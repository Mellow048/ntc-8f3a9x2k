#!/usr/bin/env python3
"""Trim the TTS take and produce word timings for the Pig War short.

The TTS engine leaves 0.4-0.9 s between sentences and ~1 s between paragraphs,
which adds ~21 s of dead air to a 61 s read. This script

  1. finds the speech segments in the raw take (energy gated),
  2. aligns the written chunks (text between punctuation marks) to those
     segments with a monotonic DP, so every chunk knows which audio it is,
  3. re-assembles the take with tight, deliberate gaps (short inside a
     sentence, a beat between sentences and paragraphs),
  4. distributes the words of each chunk across its audio by syllable weight
     and writes `words.json` in the timeline of the *new* file.

Usage:  python3 scripts/voice_trim.py [--lead 0.05] [--pad 0.06] [--gap 0.16]
                                     [--par 0.30] [--tail 1.1]
"""
import argparse
import json
import os
import re
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SHOOT = os.path.dirname(HERE)
VOICE = os.path.join(SHOOT, "voice")
RAW = os.path.join(VOICE, "narration_raw.wav")
OUT = os.path.join(VOICE, "narration.wav")
TXT = os.path.join(VOICE, "narration.txt")

VOWELS = "aeiouy"


ONES = {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 1, 9: 1, 10: 1,
        11: 3, 12: 1, 13: 2, 14: 2, 15: 2, 16: 2, 17: 3, 18: 2, 19: 2}
TENS = {2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 1, 9: 1}


def digits_syllables(w: str) -> int:
    """How the voice reads a number: 1859 -> eighteen fifty-nine (5)."""
    if len(w) == 4:
        a, b = int(w[:2]), int(w[2:])
        return ONES.get(a, 2) + (TENS.get(b // 10, 1) + ONES.get(b % 10, 0) if b >= 20 else ONES.get(b, 2))
    if len(w) <= 2:
        v = int(w)
        return ONES.get(v, 2) if v < 20 else TENS.get(v // 10, 1) + ONES.get(v % 10, 0)
    return max(1, len(w))


def syllables(word: str) -> int:
    if re.fullmatch(r"\d{1,4}", word):
        return digits_syllables(word)
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    n, prev = 0, False
    for ch in w:
        v = ch in VOWELS
        if v and not prev:
            n += 1
        prev = v
    if w.endswith("e") and n > 1:
        n -= 1
    return max(1, n)


def load(path):
    with wave.open(path, "rb") as w:
        sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        data = data.reshape(-1, ch).mean(1)
    return data, sr


def segments_of(a, sr, thr=0.012, min_len=0.06, join=0.20):
    hop = int(0.01 * sr)
    fr = a[: len(a) // hop * hop].reshape(-1, hop)
    rms = np.sqrt((fr ** 2).mean(1))
    voiced = rms > max(thr, float(np.percentile(rms[rms > 0], 15)) * 0.35)
    segs, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if (i - start) * 0.01 >= min_len:
                segs.append([start * 0.01, i * 0.01])
            start = None
    if start is not None:
        segs.append([start * 0.01, len(voiced) * 0.01])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < join:
            merged[-1][1] = s[1]
        else:
            merged.append([s[0], s[1]])
    return merged


def chunks_of(text):
    """Text pieces between punctuation marks, with paragraph index and words."""
    out = []
    for pi, para in enumerate([p.strip() for p in text.splitlines() if p.strip()]):
        para = para.replace('."', '".')          # keep closing quotes inside the sentence
        for piece in re.split(r"(?<=[.,:;!?])\s+", para):
            piece = piece.strip()
            if piece:
                words = re.findall(r"[A-Za-z0-9'’-]+", piece)
                out.append({"para": pi, "text": piece, "words": words,
                            "w": sum(syllables(x) for x in words),
                            "last_of_para": False})
    for i, c in enumerate(out):
        c["last_of_para"] = (i == len(out) - 1) or (out[i + 1]["para"] != c["para"])
    return out


def align(chunks, segs):
    """Monotonic DP: every chunk takes >=1 consecutive segment."""
    m, n = len(chunks), len(segs)
    dur = [b - a for a, b in segs]
    gaps = [segs[i + 1][0] - segs[i][1] for i in range(n - 1)]
    total_seg = sum(dur)
    total_w = sum(c["w"] for c in chunks)
    exp = [total_seg * c["w"] / total_w for c in chunks]
    INF = 1e18
    cost = [[INF] * (n + 1) for _ in range(m + 1)]
    back = [[0] * (n + 1) for _ in range(m + 1)]
    cost[0][0] = 0.0
    for i in range(1, m + 1):
        for j in range(i, n + 1):
            run = 0.0
            for k in range(j - 1, i - 2, -1):      # chunk i takes segs k..j-1
                run += dur[k]
                if cost[i - 1][k] >= INF:
                    continue
                c = cost[i - 1][k] + abs(run - exp[i - 1])
                if j < n:                      # this chunk ends at segment j-1
                    end_p = chunks[i - 1]["text"][-1]
                    if chunks[i - 1]["last_of_para"]:
                        want = 0.85
                    elif end_p in ".!?":
                        want = 0.50
                    else:
                        want = 0.22
                    c += 1.6 * abs(gaps[j - 1] - want)
                if c < cost[i][j]:
                    cost[i][j] = c
                    back[i][j] = k
    best = cost[m][n]
    assign, j = [None] * m, n
    for i in range(m, 0, -1):
        k = back[i][j]
        assign[i - 1] = (k, j)
        j = k
    return assign, best, exp


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lead", type=float, default=0.05)
    ap.add_argument("--pad", type=float, default=0.055, help="silence kept on each side of a segment")
    ap.add_argument("--gap", type=float, default=0.14, help="silence inside a sentence")
    ap.add_argument("--par", type=float, default=0.26, help="silence between paragraphs")
    ap.add_argument("--tail", type=float, default=1.10)
    args = ap.parse_args()

    a, sr = load(RAW)
    segs = segments_of(a, sr)
    chunks = chunks_of(open(TXT).read())
    assign, cost, exp = align(chunks, segs)
    if assign is None or any(x is None for x in assign):
        raise SystemExit("alignment failed")

    out = [np.zeros(int(args.lead * sr), dtype=np.float32)]
    clock = args.lead
    words_json = []
    para_start = {}
    prev_para = None

    for ci, (ch, (s0, s1)) in enumerate(zip(chunks, assign)):
        if ch["para"] != prev_para:
            if prev_para is not None:
                g = args.par
                out.append(np.zeros(int(g * sr), dtype=np.float32))
                clock += g
            para_start.setdefault(ch["para"], clock)
            prev_para = ch["para"]
        elif ci > 0:
            out.append(np.zeros(int(args.gap * sr), dtype=np.float32))
            clock += args.gap

        # audio for this chunk
        pieces = []
        chunk_dur = 0.0
        for si in range(s0, s1):
            if si > s0:
                pieces.append(np.zeros(int(2 * args.pad * sr), dtype=np.float32))
                chunk_dur += 2 * args.pad
            st = max(0.0, segs[si][0] - args.pad)
            en = min(len(a) / sr, segs[si][1] + args.pad)
            piece = a[int(st * sr):int(en * sr)]
            pieces.append(piece)
            chunk_dur += len(piece) / sr
        out.extend(pieces)
        chunk_start = clock
        clock += chunk_dur

        # word times inside the chunk, by syllable weight
        ws = [syllables(w) + (0.45 if w[-1] in ".,:;!?" or ch["text"].endswith(w + ".") else 0.0)
              for w in ch["words"]]
        tot = sum(ws) or 1.0
        t = chunk_start
        for w, ww in zip(ch["words"], ws):
            d = chunk_dur * ww / tot
            words_json.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d

    out.append(np.zeros(int(args.tail * sr), dtype=np.float32))
    audio = np.concatenate(out)
    audio = np.clip(audio, -1.0, 1.0)

    with wave.open(OUT, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((audio * 32767).astype(np.int16).tobytes())

    with open(os.path.join(VOICE, "words.json"), "w") as f:
        json.dump(words_json, f, indent=1)
    with open(os.path.join(VOICE, "timing.json"), "w") as f:
        json.dump({"duration": round(len(audio) / sr, 3),
                   "sr": sr,
                   "paragraph_start": {str(k): round(v, 3) for k, v in para_start.items()},
                   "chunks": [{"para": c["para"], "text": c["text"],
                               "segments": assign[i]} for i, c in enumerate(chunks)]},
                  f, indent=1)

    print("segments %d, chunks %d, alignment cost %.2f" % (len(segs), len(chunks), cost))
    print("write %.2fs -> %s" % (len(audio) / sr, OUT))
    worst = sorted(((abs(sum(segs[k][1] - segs[k][0] for k in range(*assign[i])) - exp[i]), i)
                    for i in range(len(chunks))), reverse=True)[:5]
    for d, i in worst:
        print("  chunk %2d off by %.2fs  %r" % (i, d, chunks[i]["text"][:50]))


if __name__ == "__main__":
    main()
