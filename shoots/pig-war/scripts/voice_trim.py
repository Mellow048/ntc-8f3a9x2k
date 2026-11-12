#!/usr/bin/env python3
"""Assemble the Pig War narration from its line groups and time every word.

The TTS take comes back in groups (voice/groups/gNN.wav + gNN.txt) because one
long take drifts: the engine parks 0.4-0.9 s between sentences, which added
21 s of dead air and made word timings guesswork. With groups, every group's
start is known exactly and the alignment problem is only "which words are in
this 18 seconds".

Per group:
  1. find the speech segments (energy gated),
  2. align the group's written chunks (text between punctuation marks) to those
     segments with a monotonic DP that also scores the pause after each chunk
     (a full stop is followed by a longer gap than a comma),
  3. keep each segment with a small pad, join with a short gap,
  4. spread each chunk's words across its audio by syllable weight.

Then the groups are concatenated with a fixed inter-group gap and `words.json`
is written in the timeline of the assembled file.

Usage: python3 scripts/voice_trim.py [--pad 0.05] [--gap 0.13] [--group 0.28]
"""
import argparse
import glob
import json
import os
import re
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SHOOT = os.path.dirname(HERE)
VOICE = os.path.join(SHOOT, "voice")
GROUPS = os.path.join(VOICE, "groups")
OUTDIR = VOICE
OUT = os.path.join(VOICE, "narration.wav")

VOWELS = "aeiouy"
ONES = {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 1, 9: 1, 10: 1,
        11: 3, 12: 1, 13: 2, 14: 2, 15: 2, 16: 2, 17: 3, 18: 2, 19: 2}
TENS = {2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 1, 9: 1}


def digits_syllables(w):
    if len(w) == 4:
        a, b = int(w[:2]), int(w[2:])
        return ONES.get(a, 2) + (TENS.get(b // 10, 1) + ONES.get(b % 10, 0) if b >= 20 else ONES.get(b, 2))
    if len(w) <= 2:
        v = int(w)
        return ONES.get(v, 2) if v < 20 else TENS.get(v // 10, 1) + ONES.get(v % 10, 0)
    return max(1, len(w))


def syllables(word):
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
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        data = data.reshape(-1, ch).mean(1)
    return data, sr


def segments_of(a, sr, thr=0.012, min_len=0.06, join=0.18):
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
    out = []
    for piece in re.split(r"(?<=[.,:;!?])\s+", text.strip()):
        piece = piece.strip()
        if not piece:
            continue
        words = re.findall(r"[A-Za-z0-9'’-]+", piece)
        out.append({"text": piece, "words": words, "w": sum(syllables(x) for x in words)})
    for i, c in enumerate(out):
        c["last"] = i == len(out) - 1
    return out


def align(chunks, segs):
    m, n = len(chunks), len(segs)
    if m > n:
        return None
    dur = [b - a for a, b in segs]
    gaps = [segs[i + 1][0] - segs[i][1] for i in range(n - 1)]
    total_seg, total_w = sum(dur), sum(c["w"] for c in chunks)
    exp = [total_seg * c["w"] / total_w for c in chunks]
    INF = 1e18
    cost = [[INF] * (n + 1) for _ in range(m + 1)]
    back = [[0] * (n + 1) for _ in range(m + 1)]
    cost[0][0] = 0.0
    for i in range(1, m + 1):
        for j in range(i, n + 1):
            run = 0.0
            for k in range(j - 1, i - 2, -1):
                run += dur[k]
                if cost[i - 1][k] >= INF:
                    continue
                c = cost[i - 1][k] + abs(run - exp[i - 1])
                if j < n and not chunks[i - 1]["last"]:
                    endp = chunks[i - 1]["text"][-1]
                    want = 0.50 if endp in ".!?" else 0.22
                    c += 1.6 * abs(gaps[j - 1] - want)
                if c < cost[i][j]:
                    cost[i][j] = c
                    back[i][j] = k
    if cost[m][n] >= INF:
        return None
    assign, j = [None] * m, n
    for i in range(m, 0, -1):
        k = back[i][j]
        assign[i - 1] = (k, j)
        j = k
    return assign


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pad", type=float, default=0.05)
    ap.add_argument("--gap", type=float, default=0.13, help="between sentences inside a group")
    ap.add_argument("--group", type=float, default=0.28, help="between groups")
    ap.add_argument("--lead", type=float, default=0.05)
    ap.add_argument("--tail", type=float, default=1.20)
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(GROUPS, "g*.wav")))
    if not files:
        raise SystemExit("no group audio")
    sr = None
    out = []
    clock = args.lead
    out.append(("silence", args.lead))
    words_json, timing = [], {"groups": [], "duration": 0.0, "sr": None}
    clock = args.lead

    for gi, f in enumerate(files):
        txt_path = f[:-4] + ".txt"
        text = open(txt_path).read().strip()
        a, gsr = load(f)
        sr = sr or gsr
        if gi:
            out.append(("silence", args.group))
            clock += args.group
        segs = segments_of(a, gsr)
        chunks = chunks_of(text)
        assign = align(chunks, segs)
        if assign is None:
            raise SystemExit("could not align %s (%d chunks, %d segments)" % (f, len(chunks), len(segs)))
        timing["groups"].append({"file": os.path.basename(f), "start": round(clock, 3),
                                 "chunks": [c["text"] for c in chunks]})
        for ci, (ch, (s0, s1)) in enumerate(zip(chunks, assign)):
            if ci:
                out.append(("silence", args.gap))
                clock += args.gap
            piece_start = clock
            for si in range(s0, s1):
                if si > s0:
                    out.append(("silence", 2 * args.pad))
                    clock += 2 * args.pad
                st = max(0.0, segs[si][0] - args.pad)
                en = min(len(a) / gsr, segs[si][1] + args.pad)
                chunk_piece = a[int(st * gsr):int(en * gsr)]
                out.append(("audio", chunk_piece))
                clock += len(chunk_piece) / gsr
            span = clock - piece_start
            ws = [syllables(w) + (0.45 if w[-1] in ".,:;!?" else 0.0) for w in ch["words"]]
            tot = sum(ws) or 1.0
            t = piece_start
            for w, ww in zip(ch["words"], ws):
                d = span * ww / tot
                words_json.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
                t += d

    out.append(("silence", args.tail))
    clock += args.tail
    audio = np.concatenate([np.zeros(int(n * sr), dtype=np.float32) if kind == "silence" else n
                            for kind, n in out])
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((audio * 32767).astype(np.int16).tobytes())

    timing["duration"] = round(len(audio) / sr, 3)
    timing["sr"] = sr
    with open(os.path.join(VOICE, "words.json"), "w") as f:
        json.dump(words_json, f, indent=1)
    with open(os.path.join(VOICE, "timing.json"), "w") as f:
        json.dump(timing, f, indent=1)
    print("%d groups, %d words, %.2f s -> %s" % (len(files), len(words_json), len(audio) / sr, OUT))


if __name__ == "__main__":
    main()
