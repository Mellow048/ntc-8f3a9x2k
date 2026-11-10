#!/usr/bin/env python3
"""Mix for our shorts: voice (unchanged) + ducked original score + synthesized SFX.

Standard mix: music bed a few dB under the voice with -3 dB ducking while speech is
active (sidechain built from words.json, the same approach as the bridge), SFX -6 dB,
voice untouched. Master normalized to -15 LUFS integrated, true peak <= -1.2 dBTP,
48 kHz stereo 24-bit. Writes mix.wav + stems + cues.md into shoots/<slug>/audio/.

Usage: python3 templates/scripts/short_mix.py darkday|cuyahoga|oymyakon
"""
import json
import os
import sys
import time

import numpy as np
from scipy import signal, ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "..", "audio")
sys.path.insert(0, AUDIO)
import dsp as D  # noqa: E402
import instruments as I  # noqa: E402

SR = 48000
REPO = os.path.dirname(os.path.dirname(HERE))  # templates/scripts -> repo root
STANDARD_MUSIC_LU = 10.0   # music ~10 LU under the voice before ducking
DUCK_DB = -3.0
SFX_GAIN = 10 ** (-6.0 / 20.0)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2

# ---------------------------------------------------------------- show configs
SHOWS = {
    "darkday": {
        "dur": 58.0,
        "bpm": 92,
        "roots": [45, 45, 41, 40],            # Am Am F E
        "quality": ["m", "m", "M", "M"],
        "motif": [76, 74, 72, 71, 68, 64, 67, 71],  # E5 D5 C5 B4 G#4 E4 G4 B4
        "motif_inst": "fife",
        "dropout": [(26.93, 33.0)],           # the deadpan lands in silence
        "accents": [(20.7, "swell"), (38.6, "warm"), (46.6, "warm"), (54.0, "cymbal")],
        "sfx": [
            (0.6, "gust", 0.55, -0.4),
            (5.4, "paper", 0.8, 0.35), (6.8, "paper", 0.7, 0.35), (8.3, "paper", 0.75, 0.35), (9.6, "paper", 0.6, 0.35),
            (12.6, "rooster", 0.5, 0.6),
            (16.5, "frogs", 0.4, -0.55),
            (20.7, "rumble", 0.9, 0.0), (23.5, "rumble", 0.8, 0.2),
            (52.1, "thunder", 0.5, -0.1),
        ],
    },
    "cuyahoga": {
        "dur": 61.0,
        "bpm": 116,
        "roots": [43, 43, 48, 50],            # G7 G7 C7 D7
        "quality": ["7", "7", "7", "7"],
        "motif": [71, 69, 67, 64, 62, 64, 67, 69],  # B4 A4 G4 E4 D4 E4 G4 A4
        "motif_inst": "fife",
        "swing": True,
        "dropout": [(14.55, 15.25)],          # one beat of silence before "Poof" plays out
        "accents": [(21.8, "warm"), (41.2, "warm"), (53.5, "tag")],
        "sfx": [
            (5.5, "drift", 0.35, -0.5),
            (11.85, "horn", 0.75, -0.35),
            (12.36, "clank", 0.9, 0.4),
            (14.76, "whooshfire", 1.0, 0.0),
            (16.2, "crackle", 0.7, -0.4), (19.4, "crackle", 0.5, 0.45),
            (22.0, "typewriter", 0.7, -0.2), (24.6, "typewriter2", 0.6, -0.2),
            (31.9, "gurgle", 0.45, 0.35),
        ],
    },
    "oymyakon": {
        "dur": 63.0,
        "bpm": 74,
        "roots": [40, 40, 36, 38],            # Em Em C D
        "quality": ["m", "m", "M", "M"],
        "motif": [83, 81, 76, 79, 78, 76, 71, 76],  # B5 A5 E5 G5 F#5 E5 B4 E5
        "motif_inst": "musicbox",
        "dropout": [(29.69, 30.3)],           # "Probably." lands in silence
        "accents": [(37.4, "kettle"), (46.5, "warm"), (53.5, "warm"), (59.1, "shimmer")],
        "sfx": [
            (0.4, "wind", 0.6, 0.0), (9.0, "wind", 0.45, 0.3),
            (10.9, "car_putter", 0.5, 0.4), (12.4, "car_putter", 0.45, 0.4), (14.8, "car_putter", 0.4, -0.5),
            (15.5, "bucket", 0.7, -0.4), (17.9, "bucket", 0.55, -0.4),
            (22.2, "crunch", 0.5, 0.5),
            (38.35, "whooshup", 0.85, 0.1), (38.9, "tinkle", 0.7, -0.3), (40.2, "tinkle2", 0.6, 0.45), (42.4, "tinkle3", 0.5, 0.15),
        ],
    },
}

# ---------------------------------------------------------------- small synths
def rumble(dur, r, lp_f=90.0, amp=1.0):
    n = D.ns(dur)
    x = D.colored(n, r, slope=2.0, lo=20.0)
    x = D.lp(x, lp_f, 2) * amp
    return x * np.sin(np.linspace(0, np.pi, n)) ** 0.8


def gust(dur, r, amp=1.0):
    n = D.ns(dur)
    x = D.colored(n, r, slope=1.6, lo=60.0)
    return D.bp(x, 150, 700, 1) * amp * (np.sin(np.linspace(0, np.pi, n)) ** 1.4)


def wind(dur, r, amp=1.0):
    n = D.ns(dur)
    x = D.colored(n, r, slope=1.4, lo=80.0)
    lfo = 0.65 + 0.35 * np.sin(2 * np.pi * 0.13 * np.arange(n) / SR + 1.7)
    return D.bp(x, 180, 900, 1) * amp * lfo


def paper(r, ticks=6):
    out = np.zeros(D.ns(ticks * 0.14 + 0.1))
    for i in range(ticks):
        m = D.ns(0.018)
        tick = D.bp(r.standard_normal(m), 1600 + r.uniform(-350, 500), 3400, 1) * np.exp(-np.arange(m) / SR / 0.004)
        s = int(i * (0.085 + r.uniform(-0.02, 0.045)) * SR)
        out[s:s + m] += tick * 0.6
    return out


def rooster():  # distant, offended at the sun going out — two strangled notes
    n1 = D.ns(0.34)
    t1 = np.arange(n1) / SR
    f1 = 1180 * (1 + 0.16 * np.sin(2 * np.pi * 9 * t1))
    a = np.sin(2 * np.pi * np.cumsum(f1) / SR) * np.exp(-t1 / 0.09) * 0.5
    n2 = D.ns(0.42)
    t2 = np.arange(n2) / SR
    f2 = 880 * (1 + 0.14 * np.sin(2 * np.pi * 8 * t2 + 1))
    b = np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.exp(-t2 / 0.12) * 0.5
    return np.concatenate([a, np.zeros(D.ns(0.1)), b])


def frogs():  # peep chorus as if night fell
    out = np.zeros(D.ns(2.1))
    r = D.rng(77)
    for k in range(9):
        st_ = r.uniform(0, 1.5)
        m = D.ns(0.09)
        t = np.arange(m) / SR
        f = 2100 + r.uniform(-250, 250)
        peep = np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 42 * t)) * np.exp(-t / 0.028) * 0.33
        s = int(st_ * SR)
        out[s:s + m] += peep
    return out


def thunder(r):
    n = D.ns(2.4)
    x = D.colored(n, r, slope=2.4, lo=28.0)
    x = D.lp(x, 130, 3)
    env = np.exp(-np.arange(n) / SR / 0.85) * (1 - np.exp(-np.arange(n) / SR / 0.06))
    return x * env * 0.85


def drift():  # harbour water lapping (very quiet)
    n = D.ns(2.6)
    x = D.colored(n, D.rng(31), slope=1.9, lo=90.0)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.55 * np.arange(n) / SR)
    return D.bp(x, 120, 800, 1) * 0.35 * lfo


def horn():  # far-off train horn, flat and low
    n = D.ns(1.35)
    t = np.arange(n) / SR
    f = 96.0
    y = (0.9 * np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3.02 * f * t))
    y = D.lp(y, 820, 2)
    env = np.minimum(1.0, t / 0.09) * np.minimum(1.0, (1.35 - t) / 0.22)
    return y * env * 0.55


def clank():  # spark striking the trestle
    r = D.rng(9)
    return D.modal(0.75, [(1568, 1.0, 1.15), (2217, 0.55, 0.75), (3136, 0.3, 0.4), (4186, 0.12, 0.22)], r) * 0.8


def whooshfire():  # whoomp — the slick catches
    r = D.rng(15)
    n = D.ns(1.15)
    x = D.colored(n, r, slope=0.8, lo=100.0)
    sweep = np.exp(-np.arange(n) / SR / 0.28) * (1 - np.exp(-np.arange(n) / SR / 0.02))
    x = D.bp(x, 240, 1500, 1) * sweep
    thump = D.modal(0.8, [(73.4, 1.0, 1.3), (110.0, 0.6, 0.8)], r) * 0.9
    y = np.zeros(D.ns(1.3))
    y[:len(x)] += x * 0.9
    y[:len(thump)] += thump
    return y


def crackle(dur, seed):
    r = D.rng(seed)
    n = D.ns(dur)
    out = np.zeros(n)
    for k in range(int(dur * 14)):
        p = r.integers(0, max(1, n - D.ns(0.02)))
        m = D.ns(0.012 + r.uniform(0, 0.02))
        burst = D.hp(r.standard_normal(m), 1400, 1) * np.exp(-np.arange(m) / SR / 0.0035) * r.uniform(0.3, 1.0)
        out[p:p + m] += burst
    out += rumble(dur, r, 65.0, 0.28)
    return out * 0.5


def typewriter():
    r = D.rng(21)
    out = np.zeros(D.ns(1.15))
    t0 = 0.0
    for k in range(17):
        m = D.ns(0.014)
        tick = D.bp(r.standard_normal(m), 2400 + r.uniform(-500, 700), 4200, 1) * np.exp(-np.arange(m) / SR / 0.0032)
        s = int(t0 * SR)
        out[s:s + m] += tick * 0.65
        t0 += 0.052 + r.uniform(-0.016, 0.02)
    bell = D.modal(0.7, [(2093, 1.0, 1.3), (3136, 0.35, 0.7)], D.rng(22)) * 0.35
    s = int(1.02 * SR)
    out[s:s + len(bell)] += bell[: max(0, len(out) - s)]
    return out


def typewriter2():
    r = D.rng(23)
    out = np.zeros(D.ns(0.75))
    t0 = 0.0
    for k in range(10):
        m = D.ns(0.013)
        tick = D.bp(r.standard_normal(m), 2200 + r.uniform(-450, 650), 4000, 1) * np.exp(-np.arange(m) / SR / 0.003)
        s = int(t0 * SR)
        out[s:s + m] += tick * 0.6
        t0 += 0.062 + r.uniform(-0.02, 0.024)
    return out


def gurgle():  # oil deciding whether to float or commit
    out = np.zeros(D.ns(0.95))
    t = 0.0
    for k in range(4):
        m = D.ns(0.13)
        tt = np.arange(m) / SR
        f = 300 - k * 55
        bloop = np.sin(2 * np.pi * (f * tt - f * 0.55 * tt * tt)) * np.exp(-tt / 0.05) * 0.5
        s = int(t * SR)
        out[s:s + m] += bloop
        t += 0.21
    return out


def car_putter(r):
    n = D.ns(2.1)
    t = np.arange(n) / SR
    putt = (np.sin(2 * np.pi * 38 * t) > 0.35).astype(float) * 0.4 + 0.1
    x = D.lp(r.standard_normal(n), 240, 2) * putt
    env = np.minimum(1.0, t / 0.15) * np.minimum(1.0, (2.1 - t) / 0.3)
    return x * env * 0.55


def bucket():  # wooden bucket knocked twice, politely
    return D.modal(0.28, [(212, 1.0, 1.1), (318, 0.5, 0.6), (436, 0.2, 0.3)], D.rng(33)) * 0.75


def crunch(r):  # boot on packed snow
    n = D.ns(0.5)
    x = D.bp(r.standard_normal(n), 500, 2600, 1)
    env = np.exp(-np.arange(n) / SR / 0.06) * (1 - np.exp(-np.arange(n) / SR / 0.008))
    return x * env * 0.5


def kettle():  # building whistle — the air before the stunt
    n = D.ns(1.7)
    t = np.arange(n) / SR
    f = 1150 + 700 * (1 - np.exp(-t / 0.55))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR + 0.35 * np.sin(2 * np.pi * 7.5 * t))
    y = D.bp(y, 700, 2900, 1)
    env = np.minimum(1.0, t / 0.18) * np.minimum(1.0, (1.7 - t) / 0.28)
    return y * env * 0.5


def whooshup(r):
    n = D.ns(0.62)
    x = D.bp(D.colored(n, r, slope=0.6, lo=140.0), 260, 1800, 1)
    return x * (np.sin(np.linspace(0, np.pi, n)) ** 1.1) * 0.8


def tinkle(r, base=2637.0):
    out = np.zeros(D.ns(1.1))
    t0 = 0.0
    for k, mult in enumerate([1.0, 1.5, 2.0, 2.67]):
        m = D.modal(0.9, [(base * mult, 1.0, 1.2 / (k + 1))], D.rng(41 + k)) * (0.5 - k * 0.1)
        s = int(t0 * SR)
        out[s:s + len(m)] += m[: max(0, len(out) - s)]
        t0 += 0.085
    return out


SFX = {
    "gust": lambda r: gust(2.6, r, 0.8),
    "paper": lambda r: paper(r, 6),
    "rooster": lambda r: rooster(),
    "frogs": lambda r: frogs(),
    "rumble": lambda r: rumble(3.6, r, 75.0, 1.0) * 0.9,
    "thunder": lambda r: thunder(r),
    "drift": lambda r: drift(),
    "horn": lambda r: horn(),
    "clank": lambda r: clank(),
    "whooshfire": lambda r: whooshfire(),
    "crackle": lambda r: crackle(3.4, 51),
    "typewriter": lambda r: typewriter(),
    "typewriter2": lambda r: typewriter2(),
    "gurgle": lambda r: gurgle(),
    "car_putter": lambda r: car_putter(r),
    "bucket": lambda r: bucket(),
    "crunch": lambda r: crunch(r),
    "kettle": lambda r: kettle(),
    "whooshup": lambda r: whooshup(r),
    "tinkle": lambda r: tinkle(r, 2637.0),
    "tinkle2": lambda r: tinkle(r, 3520.0),
    "tinkle3": lambda r: tinkle(r, 2093.0),
    "wind": lambda r: wind(3.2, r, 0.85),
}

# ---------------------------------------------------------------- music bed
def chord_bank(root, quality):
    third = {"m": 3, "M": 4, "7": 4}[quality]
    oom = [root - 12, root - 24]
    if quality == "7":
        pah = [root + 12, root + 16, root + 19, root + 22]
    else:
        pah = [root + 12, root + 12 + third, root + 19]
    return oom, pah


def build_music(cfg):
    dur = cfg["dur"]
    N = D.ns(dur)
    mus = np.zeros((2, N))
    rng = D.rng(1234)
    beat = 60.0 / cfg["bpm"]
    bar = 4 * beat
    swing = cfg.get("swing", False)

    def beat_time(b):  # b in beats from 0
        if not swing:
            return b * beat
        whole = int(b)
        frac = b - whole
        return (whole + (2 / 3 if frac == 0.5 else frac)) * beat

    # per-bar pad (quiet, warm) under everything
    bar_i = 0
    t0 = 0.0
    while t0 < dur - 0.01:
        root = cfg["roots"][bar_i % len(cfg["roots"])]
        q = cfg["quality"][bar_i % len(cfg["roots"])]
        f0 = I.m2f(root)
        tones = [f0, f0 * (2 ** (3 / 12) if q == "m" else 2 ** (4 / 12)), f0 * 2 ** (7 / 12)]
        seg = min(dur, t0 + bar) - t0
        mus[:, D.ns(t0): D.ns(t0) + D.ns(seg)] += I.pad(tones, seg, vel=0.16, r=D.rng(500 + bar_i))[:, :D.ns(seg)]
        t0 += bar
        bar_i += 1
    # brass oompah: root on 1 and 3, chord stab on 2 and 4; snare on 2 and 4
    t0, bi = 0.0, 0
    while t0 < dur - 0.01:
        root = cfg["roots"][bi % len(cfg["roots"])]
        q = cfg["quality"][bi % len(cfg["roots"])]
        oom, pah = chord_bank(root, q)
        for beat_i, b in enumerate([0, 2]):
            bt = t0 + beat_time(b)
            if bt >= dur:
                break
            note = I.brass(I.m2f(oom[beat_i]), beat * 0.82, vel=0.5, r=rng, kind="tuba")
            D.place(mus, note, bt, 0.55)
        for beat_i, b in enumerate([1, 3]):
            bt = t0 + beat_time(b)
            if bt >= dur:
                break
            for k, mf in enumerate(pah):
                note = I.brass(I.m2f(mf), beat * 0.34, vel=0.34, r=rng, kind="horn", scoop=-12.0)
                D.place(mus, note, bt + k * 0.012, 0.3)
        for b in [1, 3]:
            bt = t0 + beat_time(b)
            if bt < dur:
                s = I.snare(vel=0.34, r=rng, dur=0.18, tune=1.1, snappy=0.8)
                D.place(mus, s, bt, 0.5)
        t0 += bar
        bi += 1
    # motif, one phrase per bar from bar 2; lifts an octave after the third cycle
    motif = cfg["motif"]
    step = bar / 4.0
    mt = bar * 2
    i = 0
    while mt < dur - 1.0:
        midi = motif[i % len(motif)]
        octave_lift = 12 if (mt // (bar * 4)) >= 3 else 0
        f0 = I.m2f(midi + octave_lift)
        if cfg["motif_inst"] == "musicbox":
            note = I.musicbox(f0, vel=0.42, r=rng, dur=1.1)
        else:
            note = I.fife(f0, beat * 0.9, vel=0.4, r=rng)
        D.place(mus, note, mt, 0.42)
        i += 1
        mt += step
    # dropout bars (silence carries the joke)
    for (a, b) in cfg.get("dropout", []):
        mus[:, D.ns(a): D.ns(b)] = 0.0
    # section accents
    for (t_at, kind) in cfg.get("accents", []):
        if kind == "swell":
            D.place(mus, I.timpani(I.m2f(33), vel=0.8, r=rng, dur=2.4), t_at, 0.75)
        elif kind == "warm":
            f0 = I.m2f(cfg["roots"][0] + 12)
            tones = [f0, f0 * 2 ** (4 / 12), f0 * 2 ** (7 / 12), f0 * 2]
            seg = min(6.0, dur - t_at)
            if seg > 0.1:
                mus[:, D.ns(t_at): D.ns(t_at) + D.ns(seg)] += I.pad(tones, seg, vel=0.22, r=D.rng(777))[:, :D.ns(seg)] * 0.8
        elif kind == "cymbal":
            D.place(mus, I.cymbal(vel=0.35, r=rng, dur=2.8), t_at, 0.4)
        elif kind == "tag":
            for k, midi in enumerate([76, 79, 81, 79, 76, 74, 72]):
                note = I.musicbox(I.m2f(midi), vel=0.36, r=D.rng(900 + k), dur=1.0)
                D.place(mus, note, t_at + k * 0.31, 0.5)
        elif kind == "kettle":
            D.place(mus, I.glock(I.m2f(88), vel=0.3, r=rng, dur=1.4), t_at, 0.4)
        elif kind == "shimmer":
            for k, midi in enumerate([88, 93, 95, 100]):
                note = I.glock(I.m2f(midi), vel=0.3, r=D.rng(950 + k), dur=1.6)
                D.place(mus, note, t_at + k * 0.14, 0.45)
    return mus

# ---------------------------------------------------------------- pipeline
def main():
    slug = sys.argv[1]
    cfg = SHOWS[slug]
    shot_dir = os.path.join(REPO, "shoots", slug)
    voice_path = os.path.join(shot_dir, "voice", "voice.wav")
    words_path = os.path.join(shot_dir, "voice", "words.json")
    out_dir = os.path.join(shot_dir, "audio")
    os.makedirs(out_dir, exist_ok=True)
    dur = cfg["dur"]
    N = D.ns(dur)
    t0 = time.time()

    # --- voice: resample 44.1k -> 48k, mono duplicated to stereo, unchanged gain
    v, vsr = D.read_wav(voice_path)
    if vsr != SR:
        g = int(np.gcd(vsr, SR))
        v = signal.resample_poly(v, SR // g, vsr // g, axis=-1)
    voice = np.zeros((2, N))
    m = min(v.shape[1], N)
    voice[0, :m] = v[0, :m]
    voice[1, :m] = v[0, :m]
    print(f"voice: {vsr} Hz -> 48 kHz, speech ends at {m / SR:.2f}s of {dur}s")

    # --- music: build, then level ~10 LU under the voice, fades in/out
    music = build_music(cfg)
    Lv = D.integrated(voice)
    Lm = D.integrated(music)
    gain = 10 ** ((-STANDARD_MUSIC_LU - (Lm - Lv)) / 20.0)
    music *= gain
    fade = D.ns(1.2)
    ramp = np.linspace(0.0, 1.0, fade) ** 2
    music[:, :fade] *= ramp[None, :]
    fade_out = D.ns(2.2)
    ramp_out = np.linspace(1.0, 0.0, fade_out) ** 2
    music[:, -fade_out:] *= ramp_out[None, :]

    # --- sidechain duck under speech (from words.json)
    words = json.load(open(words_path))
    ctrl = 200
    env = np.zeros(int(dur * ctrl) + 2)
    for w in words:
        a = max(0, int((w["start"] - 0.07) * ctrl))
        b = min(len(env), int((w["end"] + 0.12) * ctrl))
        env[a:b] = 1.0
    att = 1 - np.exp(-1 / (0.07 * ctrl))
    rel = 1 - np.exp(-1 / (0.45 * ctrl))
    e = 0.0
    curve = np.zeros(len(env))
    for i in range(len(env)):
        tgt = env[i]
        e += (tgt - e) * (att if tgt > e else rel)
        curve[i] = e
    duck = np.interp(np.arange(N) / SR, np.arange(len(curve)) / ctrl, D.dbg(DUCK_DB) ** curve)
    music *= duck[None, :]

    # --- sfx
    sfx = np.zeros((2, N))
    cues = []
    r = D.rng(2026)
    for (t_at, kind, amp, pan) in cfg["sfx"]:
        fx = SFX[kind](r) * (amp * SFX_GAIN)
        stereofx = D.pan(fx, pan) if pan else np.stack([fx, fx])
        D.place(sfx, stereofx, t_at, 1.0)
        cues.append((t_at, kind, amp))

    # --- mix and master
    mix = voice + music + sfx
    Lm2 = D.integrated(mix)
    if np.isfinite(Lm2):
        mix *= 10 ** ((TARGET_LUFS - Lm2) / 20.0)
    # true-peak limit to CEIL_DBTP (fast attack, ~120 ms release, at 4x oversampled rate)
    ceiling = D.dbg(CEIL_DBTP)
    up = np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max(axis=0)
    if up.max() > ceiling:
        La = max(1, int(0.001 * 4 * SR))
        g = np.minimum(1.0, ceiling / np.maximum(up, 1e-12))
        g = ndimage.minimum_filter1d(g, 2 * La + 1, mode="nearest")
        gr = 1 - np.exp(-1 / (0.080 * 4 * SR))
        envg = np.empty_like(g)
        e = 1.0
        for i in range(len(g)):
            tgt = g[i]
            if tgt < e:
                e = tgt            # instant attack (lookahead widened by the min-filter)
            else:
                e += (tgt - e) * gr  # smoothed release
            envg[i] = e
        g4 = signal.resample_poly(envg, 1, 4)
        g4 = np.interp(np.arange(N), np.linspace(0, N - 1, len(g4)), g4)
        mix = mix * g4[None, :]

    # --- write stems + mix + cues.md
    D.write_wav(os.path.join(out_dir, "stem_voice.wav"), voice, 24)
    D.write_wav(os.path.join(out_dir, "stem_music.wav"), music, 24)
    D.write_wav(os.path.join(out_dir, "stem_sfx.wav"), sfx, 24)
    D.write_wav(os.path.join(out_dir, "mix.wav"), mix, 24)
    tp = D.true_peak(mix)
    lufs = D.integrated(mix)
    with open(os.path.join(out_dir, "cues.md"), "w") as fh:
        fh.write(f"# {slug} — mix cues\n\n")
        fh.write(f"Duration {dur:.3f} s @ 48 kHz stereo · integrated {lufs:.1f} LUFS · true peak {tp:.2f} dBTP\n\n")
        fh.write("## SFX\n\n| t (s) | event | level |\n| --- | --- | --- |\n")
        for (t_at, kind, amp) in cues:
            fh.write(f"| {t_at:6.2f} | {kind} | {amp:.2f} |\n")
        fh.write("\n## Music\n\nOriginal score, ducked -3 dB under speech. Standard mix: voice unchanged, music bed, SFX -6 dB.\n")
    print(f"mix.wav written: {dur}s, integrated {lufs:.1f} LUFS, true peak {tp:.2f} dBTP ({time.time() - t0:.1f}s)")


if __name__ == "__main__":
    main()
