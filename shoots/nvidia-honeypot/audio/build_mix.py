"""Soundtrack for "Nvidia's CEO and the Suspected Spy": narration + an original spy groove + sound effects.

Everything except the narration is synthesized here with numpy/scipy, using the DSP kit and the instruments in
templates/audio. Timing comes from the same word timings and shot list the picture uses, so the sound follows a re-time.

    python -B shoots/nvidia-honeypot/audio/build_mix.py          # writes audio/mix.wav, audio/cues.md, qa-shots.json

qa-shots.json is the shot list (every hard cut) in the form templates/scripts/short_qa.py reads, so the render check
knows which frame jumps are meant.

Music: 112 bpm, A minor. Plucked bass, kick, cross-stick, hats, vibraphone stabs, a twangy guitar that answers in the
second half of every other bar. It stops dead twice so the two punchlines land in silence: the email quote and the
movie joke.
"""
from __future__ import annotations

import json
import os
import re
import sys

import numpy as np
from scipy import ndimage, signal

HERE = os.path.dirname(os.path.abspath(__file__))
SHOOT = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(SHOOT))
sys.path.insert(0, os.path.join(REPO, "templates", "audio"))

from dsp import (SR, TAU, ns, tt, dbg, rng, lp, hp, bp, fades, pan, st, place, make_ir, convolve_st, integrated,  # noqa: E402
                 momentary, momentary_max, true_peak, read_wav, write_wav, phase, modal, norm_to, shelf)
import instruments as I  # noqa: E402
from sfx_gen import whoosh  # noqa: E402

FPS = 30
TARGET_LUFS = -15.0
CEIL_DB = -2.0                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS
MUSIC_UNDER_VOICE = -10.5      # music loudness while someone is speaking, LU relative to the voice
DUCK_DB = -4.0                 # how far the music dips under speech (it comes up for the breaths and the ending)

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "nvidia", "story.ts")).read()
Wf = lambda i: int(round(WORDS[i]["start"] * FPS))            # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
TOTAL = int(round((WORDS[-1]["end"] + 1.55) * FPS))
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 39 and CUTS[0] == 0, CUTS
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS

R = rng(20261110)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ small synth voices
def kick(vel=1.0):
    t = tt(0.3)
    y = np.sin(phase(46 + 95 * np.exp(-t / 0.026))) * np.exp(-t / 0.115)
    y += hp(R.standard_normal(len(t)), 1800) * np.exp(-t / 0.002) * 0.22
    return fades(y * vel, 0.0004, 0.04)


def rim(vel=1.0):
    y = modal(0.14, [(1720, 1.0, 0.013), (2460, 0.6, 0.010), (3880, 0.35, 0.006), (810, 0.5, 0.022)], R)
    t = tt(0.14)
    y += bp(R.standard_normal(len(t)), 1500, 7000) * np.exp(-t / 0.006) * 0.5
    return fades(y * vel, 0.0003, 0.02)


def hat(vel=1.0, open_=False):
    d = 0.32 if open_ else 0.07
    t = tt(d)
    y = hp(R.standard_normal(len(t)), 7200, 2) * np.exp(-t / (0.1 if open_ else 0.015))
    return fades(y * vel * 0.5, 0.0003, 0.012)


def shaker(vel=1.0):
    t = tt(0.075)
    return bp(R.standard_normal(len(t)), 4500, 11000) * np.sin(np.pi * np.clip(t / 0.075, 0, 1)) ** 2 * vel * 0.3


_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


def bass_note(m, long=False):
    d = 0.75 if long else 0.42
    return cached(("bass", m, long), lambda: lp(I.pluck(I.m2f(m), 0.9, R, dur=d, bright=0.6, pos=0.2), 3000))


def twang(m, d=0.7):
    """spy-movie guitar: bright pluck near the bridge, a little tremolo"""
    def make():
        y = I.pluck(I.m2f(m), 0.9, R, dur=d, bright=0.95, pos=0.09)
        t = tt(d)[: len(y)]
        return hp(y * (1 - 0.3 * (0.5 + 0.5 * np.sin(TAU * 6.5 * t))), 180)
    return cached(("twang", m, d), make)


def vib(m, d=1.2, damp=None):
    return cached(("vib", m, d, damp), lambda: I.vibes(I.m2f(m), 0.7, R, dur=d, damp=damp))


def stab(notes, d=0.3, vel=0.8, fall=0.0):
    out = None
    for m in notes:
        y = I.brass(I.m2f(m), d, vel, R, kind="stab", fall=fall)
        out = y if out is None else out + y
    return out / np.sqrt(len(notes))


# ------------------------------------------------------------------------------------------------ music
BEAT = 60.0 / 112
BAR = 4 * BEAT
SWING = 0.57
e8 = lambda i: (i // 2 + (SWING if i % 2 else 0.0)) * BEAT      # eighth-note i of a bar (0-7), lightly swung
BUS = {k: np.zeros((2, N + SR * 5)) for k in ("drums", "bass", "comp", "lead", "hits")}
GRID: list[tuple[float, str]] = []                               # every eighth the band plays: (time, chord)

BASS = {   # eight eighths per bar, None = rest
    "Am": [[45, None, 48, None, 50, None, 51, 50], [48, None, 45, None, 43, None, 40, 43]],
    "Dm": [[50, None, 53, None, 55, None, 56, 55], [53, None, 50, None, 48, None, 45, 48]],
    "E7": [[52, None, 56, None, 59, None, 62, 59], [52, None, 50, None, 47, None, 44, 47]],
    "G": [[43, None, 47, None, 50, None, 52, 50]],
    "F": [[41, None, 45, None, 48, None, 50, 48]],
}
STABS = {"Am": [[57, 60, 64, 66], [56, 60, 64, 69], [55, 60, 64, 69], [54, 60, 64, 69]],   # line A - G# - G - F# inside
         "Dm": [[57, 62, 65, 71]], "E7": [[56, 62, 67, 71]], "G": [[55, 59, 62, 65]], "F": [[53, 57, 60, 63]]}
LICKS = {"Am": [[76, 74, 72, 69], [69, 72, 74, 75, 74], [81, 79, 76, 72], [64, 67, 69, 72, 69], [72, 75, 74, 72, 69]],
         "Dm": [[77, 74, 72, 69], [74, 77, 76, 74, 69]], "E7": [[71, 74, 76, 80], [80, 76, 74, 71]],
         "G": [[74, 71, 67, 62]], "F": [[72, 69, 65, 60]]}


def put(bus, x, t, gain=1.0, p=0.0):
    if t >= 0:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def play_bar(t0, chord, k, level, until=None, busy=False):
    """one bar of the groove. level 1 = bass + hats, 2 = + kick, cross-stick, vibes, 3 = + shaker and pushes"""
    live = lambda t: until is None or t < until - 0.03
    line = BASS[chord][k % len(BASS[chord])]
    for i in range(8):
        t = t0 + e8(i)
        if not live(t):
            break
        GRID.append((t, chord))
        m = line[i]
        if m is not None:
            v = (0.95 if i % 2 == 0 else 0.72) * R.uniform(0.93, 1.05)
            put("bass", bass_note(m - 12, i == 0), t, v)
            put("bass", bass_note(m), t, 0.75 * v)
        put("drums", hat((0.55 if i % 2 == 0 else 0.34) * R.uniform(0.85, 1.1), open_=(level == 3 and i == 7)), t, 1.0, 0.25)
        if busy and live(t + 0.25 * BEAT):                        # sixteenths: the urgent bars
            put("drums", hat(0.26), t + (0.28 if i % 2 == 0 else 0.22) * BEAT, 1.0, 0.25)
        if level >= 2:
            if i in (0, 4):
                put("drums", kick(1.0 if i == 0 else 0.85), t)
            if i in (2, 6):
                put("drums", rim(0.8 * R.uniform(0.9, 1.08)), t, 1.0, -0.2)
            if i == 3 or (level == 3 and i == 7):
                for m2 in STABS[chord][k % len(STABS[chord])]:
                    put("comp", vib(m2, 0.9, 0.2), t, 0.33, 0.35)
        if level == 3:
            if i == 3:
                put("drums", kick(0.5), t)
            for j in (0, 1):
                put("drums", shaker(0.5 if j == 0 else 0.3), t + j * 0.25 * BEAT, 1.0, -0.4)
        if level == 1 and i in (0, 5):
            put("comp", vib(STABS[chord][k % len(STABS[chord])][i // 5 * 2 + 1], 1.6), t, 0.3, 0.3)


def build_music():
    # ---- part one: frame 0 to the email. Bars land on the picture by luck of the tempo (25.7 s, 27.9 s).
    form = ["Am", "Am", "Am", "Am", "Dm", "Dm", "E7", "Am"]
    stop1 = cut_t(19)                                             # "Quote:" -> the band drops out
    level1 = lambda t: 3 if t < cut_t(3) - 0.2 else 1 if cut_t(11) - 0.3 <= t < cut_t(14) - 0.3 else 3 if cut_t(14) - 0.3 <= t < cut_t(16) - 0.3 else 2
    b = 0
    while b * BAR < stop1:
        play_bar(b * BAR, form[b % 8], b, level1(b * BAR), until=stop1)
        b += 1
    put("hits", I.cymbal(0.5, R, 1.6), 0.0, 0.5)
    EVENTS.append((0.0, "music in", "spy groove, 112 bpm, A minor: plucked bass, kick, cross-stick, hats, vibes"))
    t = Wt(16)                                                    # "...is a Chinese SPY!"
    put("hits", stab([45, 52, 57, 60], 0.42, 0.85, fall=-3), t, 0.8)
    put("hits", I.timpani(I.m2f(45), 0.8, R, 1.6), t, 0.7)
    EVENTS.append((t, "brass + timpani hit", "'spy'"))
    t = cut_t(15)                                                 # the cinema: big-band 'da-daa'
    put("hits", stab([57, 64, 66, 71], 0.12, 0.8), t, 0.6)
    put("hits", stab([57, 64, 67, 72], 0.5, 0.9, fall=-2), t + 0.5 * BEAT, 0.7)
    EVENTS.append((t, "brass 'da-daa'", "straight out of a spy movie"))
    for m in (57, 60, 64, 71):                                    # the stop: one vibes chord left hanging
        put("comp", vib(m, 2.6), stop1, 0.5, 0.2)
    put("bass", bass_note(33, True), stop1, 0.9)
    EVENTS.append((stop1, "music stops", "one vibes chord rings; the email quote is read over silence"))

    # ---- part two: the grid restarts on "Monday" (frame of shot 20) so the fall, the stop and the return sit on bars
    t2 = cut_t(20)
    bars = {0: ("Am", 3), 1: ("G", 3), 2: ("F", 3), 3: ("E7", 3),          # the fall: Am - G - F - E
            5: ("Am", 3), 6: ("Am", 3), 7: ("Am", 2), 8: ("Am", 2), 9: ("Dm", 2), 10: ("Dm", 2), 11: ("E7", 1), 12: ("Am", 1),
            13: ("Dm", 2), 14: ("E7", 3)}
    stop2 = cut_t(25)                                             # the living room: silence for the movie joke
    for k, (chord, level) in bars.items():
        play_bar(t2 + k * BAR, chord, k, level, until=stop2 if k < 5 else None, busy=k in (2, 3, 14))
    put("hits", I.cymbal(0.55, R, 1.8), t2, 0.5)
    put("hits", stab([57, 60, 64], 0.5, 0.85, fall=-5), t2, 0.6)
    EVENTS.append((t2, "music back, falling", "Am - G - F - E while the value drops; brass fall-off on 'Monday'"))
    t = t2 + 2 * BAR                                              # "In one day!"
    put("hits", I.timpani(I.m2f(41), 0.9, R, 1.8), t, 0.8)
    put("hits", I.cymbal(0.7, R, 2.0), t, 0.5)
    put("hits", stab([53, 57, 60, 65], 0.3, 0.9), t, 0.7)
    EVENTS.append((t, "timpani + cymbal + brass", "'In one day!'"))
    t = t2 + 4 * BAR                                              # last hit before the silence
    put("drums", kick(1.0), t)
    put("bass", bass_note(33, True), t, 1.0)
    put("hits", stab([45, 52, 57], 0.1, 0.8), t, 0.6)
    EVENTS.append((t, "music stops", "one hit, then nothing under 'I can't even pick a movie that fast'"))
    t = t2 + 5 * BAR
    put("hits", I.cymbal(0.45, R, 1.6), t, 0.45)
    EVENTS.append((t, "music back", "the investigations: full groove"))
    a, z = t2 + 14 * BAR, t2 + 15 * BAR                           # roll into the last chord
    for ts, v in I.snare_roll(a + BEAT, z - 0.02, 0.12, 0.7, R, rate=24):
        put("drums", I.snare(v, R, dur=0.2, buzz=True), ts, 0.6)
    for m in (57, 60, 64, 66, 71):
        put("comp", vib(m, 3.2), z, 0.55, 0.2)
    put("bass", bass_note(33, True), z, 1.0)
    put("bass", bass_note(45, True), z, 0.5)
    put("drums", kick(1.0), z)
    put("hits", I.cymbal(0.6, R, 2.4), z, 0.5)
    put("hits", stab([45, 57, 64], 0.9, 0.6), z, 0.5)
    put("bass", bass_note(40), z + 2 * BEAT, 0.8)                 # button: two plucks
    put("bass", bass_note(52), z + 2 * BEAT, 0.4)
    put("bass", bass_note(33, True), z + 3 * BEAT, 1.0)
    put("bass", bass_note(45, True), z + 3 * BEAT, 0.5)
    put("drums", rim(0.9), z + 3 * BEAT)
    EVENTS.append((z, "final chord", "Am6/9 rings under 'What are your thoughts'; two plucks to finish"))

    # ---- the guitar and the vibes trade short answers in the second half of every other bar
    bar_starts = sorted({round(t, 4) for t, _ in GRID if any(abs(t - (o + k * BAR)) < 1e-6 for o in (0.0, t2) for k in range(40))})
    n = 0
    for t0 in bar_starts[1::2]:
        slots = [(t, c) for t, c in GRID if t0 + 2 * BEAT - 0.01 <= t < t0 + BAR - 0.01]
        if len(slots) < 4 or t0 > t2 + 13.5 * BAR:
            continue
        lick = LICKS[slots[0][1]][n % len(LICKS[slots[0][1]])]
        for j, (t, _) in enumerate(slots[:len(lick)]):
            last = j == min(len(slots), len(lick)) - 1
            if n % 2 == 0:
                put("lead", twang(lick[j], 1.1 if last else 0.5), t, 0.8, -0.25)
            else:
                put("lead", vib(lick[j] + 12 if lick[j] < 72 else lick[j], 1.4 if last else 0.8), t, 0.6, 0.3)
        n += 1
    EVENTS.append((bar_starts[1] + 2 * BEAT, "guitar / vibes answers", f"{n} short licks, second half of every other bar"))

    # balanced for phone speakers: the bass is carried by its upper octave, mallets and guitar sit forward
    dry = 1.6 * BUS["drums"] + 0.62 * BUS["bass"] + 1.5 * BUS["comp"] + 1.2 * BUS["lead"] + 0.9 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 1.0 * BUS["comp"] + 1.0 * BUS["lead"] + 0.45 * BUS["hits"]
    wet = convolve_st(send, make_ir(1.3, 7, hf=1.1))
    return shelf(hp(dry + 0.2 * wet, 38), 3500, 3.0)[:, :N]


# ------------------------------------------------------------------------------------------------ sound effects
def thud(heavy=1.0):
    t = tt(0.36)
    y = np.sin(phase(52 + 130 * np.exp(-t / 0.02))) * np.exp(-t / 0.09) * heavy
    y += lp(R.standard_normal(len(t)), 2600) * np.exp(-t / 0.012) * 0.9 + bp(R.standard_normal(len(t)), 300, 1200) * np.exp(-t / 0.04) * 0.4
    return fades(y, 0.0005, 0.05)


def pop(f0=420.0, f1=980.0, d=0.075):
    t = tt(d)
    return fades(np.sin(phase(f0 + (f1 - f0) * (t / d) ** 0.6)) * np.exp(-t / (d * 0.55)), 0.001, 0.012)


def ding(f=1568.0, d=0.8):
    return fades(modal(d, [(f, 1.0, 0.3), (f * 2.005, 0.4, 0.16), (f * 3.01, 0.15, 0.08)], R), 0.001, 0.05)


def mail():
    y = np.zeros(ns(1.0))
    y[: ns(0.8)] += ding(1319)
    y[ns(0.1): ns(0.1) + ns(0.8)] += ding(1760) * 0.9
    return y


def key():
    t = tt(0.06)
    y = bp(R.standard_normal(len(t)), 1800, 6500) * np.exp(-t / 0.004)
    return fades(y + modal(0.06, [(3200 * R.uniform(0.85, 1.15), 0.5, 0.004), (520 * R.uniform(0.9, 1.1), 0.4, 0.012)], R), 0.0003, 0.01)


def tick(f=2100.0):
    t = tt(0.035)
    return fades(modal(0.035, [(f, 1.0, 0.005), (f * 2.3, 0.4, 0.003)], R) + hp(R.standard_normal(len(t)), 4000) * np.exp(-t / 0.0015) * 0.4, 0.0002, 0.006)


def bell(f=880.0, d=1.4):
    return fades(modal(d, [(f, 1.0, 0.7), (f * 2.76, 0.5, 0.35), (f * 5.4, 0.25, 0.16), (f * 8.9, 0.1, 0.07)], R), 0.0005, 0.1)


def kaching():
    y = np.zeros(ns(1.3))
    t = tt(0.16)
    y[: len(t)] += bp(R.standard_normal(len(t)), 600, 3000) * np.sin(np.pi * t / 0.16) ** 2 * 0.5      # the drawer
    y[ns(0.13): ns(0.13) + ns(1.1)] += fades(modal(1.1, [(2637, 1.0, 0.45), (3520, 0.6, 0.35), (5274, 0.3, 0.2)], R), 0.0005, 0.1)
    for _ in range(7):                                                                                 # coins
        k = ns(R.uniform(0.2, 0.55))
        c = modal(0.12, [(R.uniform(3800, 6500), 0.35, 0.03), (R.uniform(7000, 9500), 0.2, 0.02)], R)
        y[k: k + len(c)] += c
    return y


def shutter():
    y = np.zeros(ns(0.16))
    for k, g in ((0.0, 1.0), (0.055, 0.8)):
        t = tt(0.05)
        c = bp(R.standard_normal(len(t)), 1500, 8000) * np.exp(-t / 0.005) + np.sin(TAU * 310 * t) * np.exp(-t / 0.012) * 0.5
        y[ns(k): ns(k) + len(c)] += c * g
    return y


def radar():
    y = np.zeros(ns(1.0))
    for k, g in ((0.0, 1.0), (0.24, 0.35), (0.48, 0.12)):
        p = modal(0.5, [(1250, 1.0, 0.12)], R)
        y[ns(k): ns(k) + len(p)] += fades(p, 0.002, 0.05) * g
    return y


def squelch():
    t = tt(0.26)
    y = bp(R.standard_normal(len(t)), 1100, 3800) * (t < 0.18) * (0.6 + 0.4 * np.sign(np.sin(TAU * 43 * t)))
    y += np.sin(TAU * 1040 * t) * ((t > 0.19) & (t < 0.25)) * 0.6
    return fades(y, 0.002, 0.01)


def slide(f0=1500.0, f1=230.0, d=0.6):
    t = tt(d)
    ph = phase(f0 * (f1 / f0) ** (t / d) * (1 + 0.012 * np.sin(TAU * 7 * t)))
    return fades((np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)) * (0.4 + 0.6 * t / d), 0.01, 0.03)


def boing():
    t = tt(0.4)
    return fades(np.sin(phase(190 * (1 + 0.45 * np.sin(TAU * 27 * t) * np.exp(-t / 0.2)) * (1 + 0.5 * t))) * np.exp(-t / 0.16), 0.002, 0.04)


def buzz(d=0.3):
    t = tt(d)
    return fades(lp(np.sign(np.sin(TAU * 118 * t)) + 0.5 * np.sign(np.sin(TAU * 177 * t)), 1500), 0.004, 0.02)


def blip(f):
    t = tt(0.045)
    return fades(np.sin(TAU * f * t) * np.exp(-t / 0.02), 0.002, 0.008)


def step():
    t = tt(0.09)
    return fades(lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.014) + np.sin(TAU * 125 * t) * np.exp(-t / 0.02) * 0.8, 0.0005, 0.02)


def knock():
    t = tt(0.2)
    return fades(modal(0.2, [(410, 1.0, 0.035), (960, 0.6, 0.022), (1650, 0.3, 0.012)], R) + lp(R.standard_normal(len(t)), 500) * np.exp(-t / 0.01), 0.0003, 0.03)


def build_sfx(voice_lufs):
    buf = np.zeros((2, N + SR * 3))

    def fx(t, x, lu, p=0.0, name="", why=""):
        """place x so its loudest 400 ms sits `lu` LU relative to the narration"""
        if t < 0 or t >= DUR:
            return
        place(buf, pan(norm_to(x, voice_lufs + lu), p), t)
        if name:
            EVENTS.append((t, name, why))

    # every cut gets a small swish, alternating sides; the two silent passages get none
    quiet = {19, 25}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right"))

    for i, why in ((6, "SCANDAL! stamp"), (15, "CHINESE SPY? stamp"), (48, "UNDER INVESTIGATION stamp"), (52, "ALLEGEDLY stamp"), (118, "CLASS ACTION FILED stamp"), (174, "NOT CHARGED stamp")):
        fx(Wt(i), thud(), -7, 0, "stamp thud", why)
    pops = [(Wt(19), "name tag: Jensen Huang"), (Wt(36), "name tag: Alice Huang"), (Wt(38), "not-equals sign"), (Wt(58), "source: The New York Times"), (cut_t(14), "definition card"),
            (Wt(74), "the jar hops on 'honeypot'"), (Wt(81), "dateline"), (Wt(87) - 2 / FPS, "speech bubble"), (Wt(90), "SUNDAY calendar"), (Wt(144), "name tag: President Trump"),
            (Wt(159), "quote card: Trump"), (Wt(169), "quote card: China's Foreign Ministry"), (Wt(180), "quote card: Nvidia's board"), (Wt(193), "card A"), (Wt(199), "card B"),
            (cut_t(38) + 1 / FPS, "WHAT DO YOU THINK?"), (cut_t(38) + 9 / FPS, "card A"), (cut_t(38) + 15 / FPS, "card B")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    for t in (cut_t(1) + 0.25, cut_t(11) + 0.3, cut_t(11) + 1.2):
        fx(t, radar(), -15, 0.3, "radar ping", "surveillance room")
    for k in (7, 23, 37):
        fx(cut_t(13) + k / FPS, shutter(), -11, 0.2, "camera shutter", "long-lens viewfinder")
    for j, d in enumerate((0, 3, 6, 8, 10, 12)):                 # six laptops, one after another
        fx((Wf(92) + d) / FPS, mail(), -11 - 0.5 * j, -0.5 + 0.2 * j, "mail ding", "the email lands on every desk")
    for i in range(97, 103):                                      # the quote types itself, word by word
        for j in range(2 + len(WORDS[i]["word"]) // 3):
            fx(Wt(i) - 1 / FPS + j * 0.055 * R.uniform(0.8, 1.2), key(), -15, R.uniform(-0.2, 0.2))
    EVENTS.append((Wt(97), "typing", "each word of the quote is typed on the email card"))
    fx(cut_t(20) + 0.05, np.concatenate([bell(1175, 0.5)[: ns(0.13)] for _ in range(5)] + [bell(1175, 1.2)]), -10, 0.25, "market bell", "'Monday'")
    fx(Wt(105), slide(900, 300, 0.45), -13, -0.2, "slide down", "the chart turns over on 'lost'")
    a, z = (Wf(108) - 2) / FPS, (Wf(110) + 12) / FPS              # the counter rolls up to 190 billion
    t = a
    while t < z:
        u = (t - a) / (z - a)
        fx(t, tick(1500 + 1500 * u), -17 + 3 * u, 0.1)
        t += 0.05 - 0.02 * u
    fx(z, kaching()[ns(0.13):], -8, 0, "counter lands", "-$190,000,000,000")
    EVENTS.append((a, "counter ticks", "the number rolls"))
    fx(cut_t(22) - 0.04, slide(1500, 240, 0.24), -11, 0, "falling whistle", "the red arrow drops in")
    fx(cut_t(22) + 6 / FPS, thud(1.3), -7, 0, "crash", "the arrow stabs the floor, six frames after the cut")
    a, z = cut_t(23), (Wf(124) + 6) / FPS                          # the lawyer sprints to the door
    n = 0
    t = a + 0.05
    while t < z:
        fx(t, step(), -14, -0.6 + 0.6 * (t - a) / (z - a))
        t += 0.155
        n += 1
    EVENTS.append((a, "running feet", f"{n} steps, left to centre"))
    for k in range(int((cut_t(25) - cut_t(23)) / 0.5)):
        fx(cut_t(23) + 0.25 + k * 0.5, tick(1300 if k % 2 else 1700), -18, 0.5)
    EVENTS.append((cut_t(23) + 0.25, "clock ticking", "street clock"))
    fx(Wt(125), bell(1568, 1.3), -8, 0.3, "desk bell", "'Five minutes!'")
    a, z = cut_t(25), shot_end(25)                                 # the streaming menu
    for k in range(int((z - a - 0.3) / 0.1)):
        fx(a + 0.02 + k * 0.1, blip(660 if k % 2 else 880), -19, 0.1)
    EVENTS.append((a, "menu blips", "cursor racing over the movie tiles"))
    fx(z - 8 / FPS, buzz(0.24), -14, 0, "buzzer", "five minutes are up")
    fx(Wt(139), knock(), -9, 0, "gavel", "Congress")
    fx(Wt(139) + 0.3, knock(), -10, 0)
    for s_ in (28, 30, 32):                                        # press rooms: a burst of cameras
        for k in range(5):
            fx(cut_t(s_) + 0.08 + k * R.uniform(0.16, 0.3), shutter(), -14, R.uniform(-0.7, 0.7))
        EVENTS.append((cut_t(s_), "camera shutters", "press room"))
    fx(Wt(147), squelch(), -11, -0.3, "radio squelch", "F.B.I.")
    fx(Wt(160), boing(), -12, 0, "boing", "shrug on 'no idea'")
    fx(Wt(191), ding(1976, 0.9), -10, 0, "ding", "still CEO")
    fx(Wt(201) - 2 / FPS, kaching(), -6, 0.2, "cash register", "'the most expensive date in history'")
    return buf[:, :N]


# ------------------------------------------------------------------------------------------------ mix
def speech_gain(voice, depth_db, att=0.05, rel=0.25):
    """1 where nobody speaks, `depth_db` under the voice. Keyed from the voice itself: the read is cut so tight that
    the word timings leave no gaps."""
    w = ns(0.02)
    k = len(voice) // w
    db = 20 * np.log10(np.sqrt((voice[: k * w].reshape(k, w) ** 2).mean(1)) + 1e-9)
    on = np.repeat(db > np.percentile(db, 95) - 30, w).astype(float)
    g = np.zeros(N)
    g[: len(on)] = ndimage.maximum_filter1d(on, ns(0.1))            # bridge the gaps inside words
    out = np.empty(N)
    ka, kr, v = 1 - np.exp(-1 / (att * 1000)), 1 - np.exp(-1 / (rel * 1000)), 0.0
    for i in range(0, N, 48):                                       # control rate 1 kHz
        x = g[i]
        v += (x - v) * (ka if x > v else kr)
        out[i: i + 48] = v
    return dbg(depth_db * out)


def limiter(x, ceil_db, look=0.003, rel=0.08):
    """look-ahead peak limiter on 4x oversampled peaks"""
    c, n = dbg(ceil_db), x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    la = max(1, ns(look))
    g = ndimage.minimum_filter1d(gr, 2 * la + 1, mode="nearest")
    k = 1 - np.exp(-1 / (rel * SR))
    out, v = g.copy(), 1.0
    for i in np.flatnonzero(ndimage.minimum_filter1d(g, ns(rel * 8) * 2 + 1, mode="nearest") < 1.0):
        v = min(g[i], v + (1 - v) * k)
        out[i] = v
    out = np.minimum(ndimage.uniform_filter1d(out, 2 * la + 1, mode="nearest"), 1.0)
    return x * out[None, :], out


def main():
    v, sr = read_wav(os.path.join(SHOOT, "voice", "voice.wav"))
    assert sr == SR, sr
    voice = np.zeros(N)
    voice[: min(N, v.shape[1])] = v.mean(0)[:N]
    voice = st(voice)
    v_lufs = integrated(voice)

    music = build_music()
    duck = speech_gain(voice[0], DUCK_DB)
    music = music * duck[None, :]
    speaking = duck < dbg(DUCK_DB * 0.5)
    m_speech = integrated(music[:, speaking])
    music *= dbg(v_lufs + MUSIC_UNDER_VOICE - m_speech)
    end = np.ones(N)
    end[-ns(0.5):] = np.linspace(1, 0, ns(0.5)) ** 2
    music *= end[None, :]
    sfx = build_sfx(v_lufs) * end[None, :]

    mix = voice + music + sfx
    gain = dbg(TARGET_LUFS - integrated(mix))
    mix, gr = limiter(mix * gain, CEIL_DB)
    mix *= dbg(TARGET_LUFS - integrated(mix)) if abs(TARGET_LUFS - integrated(mix)) > 0.05 and true_peak(mix) + TARGET_LUFS - integrated(mix) < -1.0 else 1.0
    write_wav(os.path.join(HERE, "mix.wav"), mix, bits=16)

    bed = music + sfx
    mv, mb = momentary(voice * gain), momentary(bed * gain)
    tc = np.arange(len(mv)) * 0.01 + 0.2
    spoken = np.zeros(len(tc), bool)
    for w in WORDS:
        spoken |= (tc >= w["start"] + 0.03) & (tc <= w["end"] - 0.03)
    margin = (mv - mb)[spoken & (mv > v_lufs - 10)]
    report = [
        f"- length {mix.shape[1] / SR:.3f} s ({TOTAL} frames at {FPS} fps), 48 kHz stereo, 16-bit",
        f"- integrated loudness {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, limiter at most {-20 * np.log10(gr.min()):.1f} dB",
        f"- stems at mix gain: voice {integrated(voice * gain):.1f} LUFS, music {integrated(music * gain):.1f} LUFS, effects {integrated(sfx * gain):.1f} LUFS",
        f"- voice over the bed while speaking: median {np.median(margin):.1f} LU, 10th percentile {np.percentile(margin, 10):.1f} LU",
    ]
    print("\n".join(report))
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))]}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {int(round(t * FPS)):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# Nvidia short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
