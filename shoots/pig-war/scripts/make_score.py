#!/usr/bin/env python3
"""The short cut's score: an original 104 s bed, written in numpy.

Nothing is sampled and nothing is borrowed: the plucks, pad, bass, fiddle line and shaker are all
synthesised here, so the film owns its music. Form follows the picture — a plain opening under the
hook, the full band once the island and the flock arrive, a hush for the twelve years, and a
Picardy third on "the garden is still there".

    python3 shoots/pig-war/scripts/make_score.py
Writes shoots/pig-war/audio/score.wav (48 kHz, 16-bit stereo).
"""
import os
import wave

import numpy as np

SR = 48000
BPM = 84.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
DUR = 104.0
N = int(DUR * SR)

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str) -> float:
    """'D4' -> 293.66"""
    octave = int(name[-1])
    semis = NOTE[name[:-1]] + 12 * (octave + 1)
    return 440.0 * 2 ** ((semis - 69) / 12)


def env(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    """simple ADSR over n samples"""
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    ns = max(0, n - na - nd - nr)
    return np.concatenate([
        np.linspace(0, 1, max(1, na)),
        np.linspace(1, s, max(1, nd)),
        np.full(max(0, ns), s),
        np.linspace(s, 0, max(1, nr)),
    ])[:n]


def pluck(f: float, dur: float, amp: float, bright: float = 0.5) -> np.ndarray:
    """a harp/guitar-ish pluck: a few harmonics, each decaying faster than the last"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 7):
        a = (bright ** (k - 1)) / k
        out += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3.0 + 2.4 * k))
    return amp * out * env(n, 0.004, 0.06, 0.7, 0.25)


def pad(freqs, dur: float, amp: float) -> np.ndarray:
    """warm chord pad: detuned saws through a one-pole lowpass"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-0.6, 0.0, 0.55):
            ph = 2 * np.pi * (f + det) * t + np.random.rand() * 6.28
            saw = sum(np.sin(ph * k) / k for k in range(1, 9))
            out += saw
    out /= (len(freqs) * 3 * 2.2)
    # one-pole lowpass, coefficient from a 2.2 kHz corner
    a = np.exp(-2 * np.pi * 2200 / SR)
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):  # cheap but only runs once per chord
        acc = (1 - a) * out[i] + a * acc
        y[i] = acc
    return amp * y * env(n, 0.5, 0.3, 0.8, 0.7)


def bass(f: float, dur: float, amp: float) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return amp * out * env(n, 0.01, 0.08, 0.85, 0.12)


def fiddle(f: float, dur: float, amp: float) -> np.ndarray:
    """bowed line: triangle-ish with vibrato and a slow bow attack"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.1 * t) * np.clip(t / 0.3, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    out = np.sin(ph) + 0.28 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    return amp * out * env(n, 0.09, 0.2, 0.75, 0.24)


def shaker(dur: float, amp: float, seed: int) -> np.ndarray:
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n)
    # high-pass-ish: difference of the noise with a smoothed copy
    k = 12
    sm = np.convolve(noise, np.ones(k) / k, mode="same")
    out = (noise - sm)
    return amp * out * env(n, 0.002, 0.05, 0.0, 0.03)


def kick(dur: float, amp: float) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 118 * np.exp(-t * 26) + 44
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13)


# ---------------- the arrangement ----------------
# D minor, two bars per chord, a Picardy D major to land it
CHORDS = [
    (["D4", "F4", "A4"], "D2"),
    (["A#3", "D4", "F4"], "A#1"),
    (["F4", "A4", "C5"], "F2"),
    (["C4", "E4", "G4"], "C2"),
]
SECTIONS = 9  # 9 * 4 chords * 2 bars = 72 bars ~ 102 s

L = np.zeros((N, 2))


def add(sig: np.ndarray, at: float, pan: float = 0.0, gain: float = 1.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    j = min(N, i + len(sig))
    seg = sig[: j - i] * gain
    l = np.cos((pan + 1) * np.pi / 4) * 1.414
    r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:j, 0] += seg * l
    L[i:j, 1] += seg * r


for s in range(SECTIONS):
    for c, (chord, root) in enumerate(CHORDS):
        t0 = s * 4 * BAR + c * 2 * BAR
        if t0 >= DUR:
            break
        last = s == SECTIONS - 1 and c == 3
        loud = 12.0 <= t0 < 72.0          # the full band under the island, the flock and the armies
        hush = 72.0 <= t0 < 90.0          # the twelve years: pad and fiddle only
        if last:
            chord, root = ["D4", "F#4", "A4"], "D2"   # Picardy third: the garden is still there
        freqs = [hz(n) for n in chord]
        # pad + bass everywhere
        add(pad(freqs, 2 * BAR * 1.05, 0.16), t0, 0.0)
        for b in range(2):
            add(bass(hz(root), BEAT * 3.4, 0.20 if loud else 0.13), t0 + b * 2 * BEAT, -0.1)
        # plucked arpeggio
        if not hush or s % 2 == 0:
            pat = [0, 1, 2, 1, 0, 2, 1, 2]
            for k in range(8):
                f = freqs[pat[k] % len(freqs)] * (2 if (k >= 4 and loud) else 1)
                add(pluck(f, BEAT * 0.9, 0.14 if loud else 0.10), t0 + k * BEAT / 2, -0.35 + 0.1 * (k % 3))
        # shaker and kick
        if loud or hush:
            for k in range(8):
                add(shaker(0.12, 0.05 if loud else 0.03, k + s), t0 + k * BEAT / 2, 0.55)
        if loud:
            for b in (0, 2):
                add(kick(0.3, 0.16), t0 + b * BEAT, 0.0)
        # fiddle line in the last third and over the hush
        if t0 >= 66.0:
            mel = {"D2": ["A4", "F4", "D4", "E4"], "A#1": ["A#4", "F4", "D4", "C4"],
                   "F2": ["C5", "A4", "F4", "G4"], "C2": ["G4", "E4", "C4", "D4"]}[root]
            add(fiddle(hz(mel[0]), BAR * 0.9, 0.11), t0 + 0.05, 0.22)
            add(fiddle(hz(mel[2]), BAR * 0.9, 0.09), t0 + BAR + 0.1, 0.18)

# a soft fade at the very top and a long release at the end
fade_in = int(1.2 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
fade_out = int(3.0 * SR)
L[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5

peak = np.max(np.abs(L)) or 1.0
L = L / peak * 0.72
out = (np.clip(L, -1, 1) * 32767).astype("<i2")

dest = os.path.join(os.path.dirname(__file__), "..", "audio")
os.makedirs(dest, exist_ok=True)
with wave.open(os.path.join(dest, "score.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print(f"score.wav: {DUR:.1f}s stereo {SR} Hz")
