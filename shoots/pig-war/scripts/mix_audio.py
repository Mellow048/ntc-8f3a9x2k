#!/usr/bin/env python3
"""Mix the narration and the score into the film's audio bed.

Narration sits forward and the score ducks under it (an envelope follower, not a fixed level), the
whole thing is peak-normalised to -1 dBFS. 48 kHz stereo, matching the render.

    python3 shoots/pig-war/scripts/mix_audio.py
Writes shoots/pig-war/audio/mix.wav.
"""
import os
import wave

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "..", "audio")
VOICE = os.path.join(HERE, "..", "voice", "narration.wav")


def read(path):
    with wave.open(path) as w:
        n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    assert sw == 2, f"{path}: expected 16-bit, got {sw * 8}"
    x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        k = SR / sr
        idx = np.arange(int(len(x) * k)) / k
        x = np.interp(idx, np.arange(len(x)), x)
    return x


def rms_db(x):
    return 20 * np.log10(max(1e-9, np.sqrt(np.mean(x ** 2))))


voice = read(VOICE)
score = read(os.path.join(AUDIO, "score.wav"))

# both start at zero; the mix is as long as the music bed, the voice runs out first
n = max(len(score), len(voice)) + int(0.4 * SR)
mix = np.zeros((n, 2))
v = np.zeros(n)
v[: len(voice)] = voice

# ---- levels ----
v *= 10 ** ((-18.0 - rms_db(v)) / 20)          # narration pinned at -18 dBFS RMS
sc = score.copy()
sc *= 10 ** ((-28.0 - rms_db(sc)) / 20)        # score sits ~10 dB under the voice before ducking

# ---- ducking: 40 ms envelope of the voice, 200 ms release ----
hop = int(0.02 * SR)
env = np.array([np.sqrt(np.mean(v[i:i + hop] ** 2)) for i in range(0, n, hop)])
env = np.concatenate([env, np.zeros(1)])
# attack fast, release slow
sm = np.zeros_like(env)
prev = 0.0
for i, e in enumerate(env):
    prev = e if e > prev else prev * 0.86
    sm[i] = prev
sm = np.clip(sm / (np.max(sm) + 1e-9) * 1.6, 0, 1)
duck = 1.0 - 0.62 * np.repeat(sm, hop)[:n]
if len(duck) < n:
    duck = np.concatenate([duck, np.ones(n - len(duck))])
sc2 = np.zeros(n)
sc2[: len(sc)] = sc
sc2 *= duck

mix[:, 0] = v * 0.0 + sc2 * 1.0 + v * 1.0
mix[:, 1] = sc2 * 1.0 + v * 1.0
# a hair of stereo width on the music only
mix[:, 0] = v + sc2 * 1.04
mix[:, 1] = v + sc2 * 0.96

peak = np.max(np.abs(mix))
if peak > 0.891:  # -1 dBFS
    mix *= 0.891 / peak
out = (np.clip(mix, -1, 1) * 32767).astype("<i2")

dest = os.path.join(AUDIO, "mix.wav")
with wave.open(dest, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())

print(f"voice  {len(voice) / SR:6.2f}s  {rms_db(v):6.2f} dBFS rms")
print(f"score  {len(score) / SR:6.2f}s  {rms_db(sc):6.2f} dBFS rms (ducked)")
print(f"mix    {n / SR:6.2f}s  peak {20 * np.log10(peak):5.2f} dBFS -> {dest}")
