#!/usr/bin/env python3
"""Generate words.json from a voice.wav + the exact spoken text.

No ASR model needed: splits the text into phrases at punctuation, finds the
voiced spans in the waveform (RMS + adaptive threshold), aligns phrases to
spans in order, then distributes each phrase's time across its words weighted
by character count. Timings are approximate (±80 ms) — hand-fix against the
audio if you have to. Outputs the same schema as supermarket's words.json.

Usage: python3 words_from_wav.py voice.wav "THE SPOKEN TEXT" [out_words.json]
"""
import json
import re
import sys
import wave

import numpy as np


def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
        sw, ch = w.getsampwidth(), w.getnchannels()
    x = np.frombuffer(raw, dtype=np.int16 if sw == 2 else np.uint8).astype(np.float64)
    if sw == 2:
        x /= 32768.0
    else:
        x = (x - 128) / 128.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return x, sr


def voiced_spans(x, sr, hop=0.010, win=0.025, min_gap=0.18, min_len=0.05):
    n = len(x)
    step, w = int(hop * sr), int(win * sr)
    rms = []
    for s in range(0, n - w, step):
        seg = x[s:s + w]
        rms.append(float(np.sqrt(np.mean(seg * seg) + 1e-12)))
    rms = np.array(rms)
    p10, p90, p99 = np.percentile(rms, [10, 90, 99])
    thr = max(2.5 * p10, 0.22 * p99)
    on = rms > thr
    spans = []
    i = 0
    times = np.arange(len(rms)) * hop
    while i < len(on):
        if not on[i]:
            i += 1
            continue
        j = i
        while j < len(on) and on[j]:
            j += 1
        spans.append([times[i], min(times[j - 1] + win, n / sr)])
        i = j
    # merge spans separated by short gaps
    merged = []
    for s in spans:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(list(s))
    return [[a, b] for a, b in merged if b - a >= min_len]


def split_phrases(text):
    # phrases end at sentence-ish punctuation; keep punctuation on the last word
    parts = re.split(r"(?<=[.!?])\s+|,\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def balance_groups(phrases, n_spans):
    """merge phrases into n_spans groups, roughly equal in char count, in order"""
    lens = [len(p) for p in phrases]
    total = sum(lens)
    groups, cur, acc = [], [], 0
    target = total / n_spans
    for i, p in enumerate(phrases):
        remaining = len(phrases) - i
        slots_left = n_spans - len(groups) - 1
        cur.append(p)
        acc += lens[i]
        if len(groups) < n_spans - 1 and (acc >= target or remaining == slots_left + 1):
            groups.append(" ".join(cur))
            cur, acc = [], 0
    groups.append(" ".join(cur))
    return groups


def main():
    wav, text = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else None
    x, sr = read_wav_mono(wav)
    spans = voiced_spans(x, sr)
    phrases = split_phrases(text)
    if len(spans) == len(phrases):
        groups = phrases
    elif len(spans) < len(phrases):
        groups = balance_groups(phrases, len(spans))
    else:  # more spans than phrases: keep the loudest/longest spans, merge neighbours
        while len(spans) > len(phrases):
            gaps = [spans[i + 1][0] - spans[i][1] for i in range(len(spans) - 1)]
            k = int(np.argmin(gaps))
            spans[k:k + 2] = [[spans[k][0], spans[k + 1][1]]]
        groups = phrases
    words = []
    for (a, b), group in zip(spans, groups):
        ws = group.split()
        weights = np.array([len(re.sub(r"\s", "", w)) + 1 for w in ws], dtype=float)
        weights /= weights.sum()
        t = a
        for w, wt in zip(ws, weights):
            d = (b - a) * wt
            words.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d
    payload = json.dumps(words, indent=2, ensure_ascii=False)
    if out:
        with open(out, "w") as f:
            f.write(payload)
    print(f"{len(spans)} voiced spans / {len(phrases)} phrases -> {len(words)} words, "
          f"speech {spans[0][0]:.2f}s..{spans[-1][1]:.2f}s")


if __name__ == "__main__":
    main()
