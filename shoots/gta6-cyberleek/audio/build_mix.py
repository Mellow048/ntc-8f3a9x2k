"""Soundtrack for the GTA 6 leaker short: narration + an original synth groove + effects that follow the picture.

    python shoots/gta6-cyberleek/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/gta6/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the news
reference uses; the tune, its instruments and every effect cue are this film's own.
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
                 momentary, momentary_max, true_peak, read_wav, write_wav, phase, modal, norm_to, shelf, kfilt)
import instruments as I  # noqa: E402
from sfx_gen import whoosh, applause, clink  # noqa: E402

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.3                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS
MUSIC_UNDER_VOICE = -5.5       # music loudness while someone is speaking, after ducking, LU relative to the voice.
                               # The user rejected scores 9-11 LU under the voice as inaudible and accepted 5-6 (IMPORTANT.md).
POCKET_DB = -5.0               # extra dip in the music's 1.2-5 kHz band under speech: room for consonants at that level
MUSIC_CEIL = -3.5              # while someone speaks, no 200 ms of music may be louder than this (LU relative to the voice,
                               # both measured above 300 Hz, where speech is understood and where a phone speaker plays):
                               # a stab that lands on a word is pulled back to the bed, one that lands in a gap is not
DUCK_DB = -4.0                 # how far the music dips under speech (it comes up for the breaths and the ending)

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "gta6", "story.ts")).read()
Wf = lambda i: int(round(WORDS[i]["start"] * FPS))            # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
TOTAL = int(round((WORDS[-1]["end"] + 1.55) * FPS))
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 46 and CUTS[0] == 0, CUTS
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS

R = rng(20261119)
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


# ------------------------------------------------------------------------------------------------ music
# A night-drive pulse in D minor, 104 bpm: synth bass in eighths, four-on-the-floor kick, claps, a sixteenth-note
# arpeggio, a soft pad. Each section restarts its grid on a cut, so stops and hits land on bar lines.
# Kick and bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under
# 300 Hz, so they are kept modest and the level is carried by the parts a phone does play (arpeggio, claps, hats).
KICK, BASS_MIX = 0.7, 0.4
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
GRID: list[tuple[float, str]] = []
CH = {"Dm": [50, 53, 57, 60], "Bb": [46, 50, 53, 57], "C": [48, 52, 55, 62], "Gm": [43, 46, 50, 53], "A": [45, 49, 52, 55], "F": [41, 45, 48, 52]}
ARP = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3]
HOOK = {"Dm": [74, 72, 69, 72], "Bb": [70, 74, 77, 74], "C": [76, 72, 79, 76], "Gm": [74, 70, 67, 70], "A": [73, 76, 69, 73], "F": [72, 77, 81, 77]}


def saw(f, n, detune=0.0):
    return 2 * ((phase(np.full(n, f * (1 + detune))) / TAU) % 1.0) - 1


def sbass(m, d=0.27):
    def make():
        t = tt(d)
        f = I.m2f(m)
        raw = saw(f, len(t)) + 0.6 * np.sin(TAU * f * t)
        y = lp(raw, 520) + 0.9 * lp(raw, 2400) * np.exp(-t / 0.045)
        return fades(y * np.exp(-t / (d * 0.9)) * 0.5, 0.002, 0.02)
    return cached(("sbass", m, d), make)


def arp(m, d=0.22):
    def make():
        t = tt(d)
        f = I.m2f(m)
        raw = saw(f, len(t), 0.003) + saw(f, len(t), -0.003) + 0.5 * saw(2 * f, len(t))
        y = lp(raw, 1500) + 1.1 * hp(lp(raw, 5200), 900) * np.exp(-t / 0.03)
        return fades(y * np.exp(-t / (0.085 * d / 0.22)) * 0.3, 0.001, 0.02)
    return cached(("arp", m, d), make)


def lead(m, d=0.5, vibrato=True):
    def make():
        t = tt(d)
        f = I.m2f(m) * (1 + (0.004 * np.sin(TAU * 5.5 * t) * np.clip(t / 0.25, 0, 1) if vibrato else 0.0)) * np.ones(len(t))
        ph = phase(f) / TAU
        raw = (2 * (ph % 1) - 1) + (2 * ((ph * 1.005) % 1) - 1) + 0.4 * np.sign(np.sin(TAU * ph))
        env = np.minimum(1, t / 0.012) * np.exp(-np.maximum(0, t - d * 0.6) / (d * 0.25))
        return fades(lp(raw, 3200) * env * 0.28, 0.002, 0.03)
    return cached(("lead", m, d, vibrato), make)


def chord_hit(notes, d=0.5):
    return sum(lead(m, d, False) for m in notes) / np.sqrt(len(notes))


def clap(vel=1.0):
    t = tt(0.22)
    y = np.zeros(len(t))
    for k, d0 in enumerate((0.0, 0.011, 0.023)):
        i = ns(d0)
        y[i:] += (R.standard_normal(len(t)) * np.exp(-t / (0.012 if k < 2 else 0.07)))[: len(t) - i]
    return fades(bp(y, 900, 3800) * vel * 0.45, 0.0003, 0.03)


def tom(f=110.0, vel=1.0):
    t = tt(0.3)
    return fades(np.sin(phase(f * (1 + 0.8 * np.exp(-t / 0.03)))) * np.exp(-t / 0.11) * vel, 0.001, 0.04)


def pad(chord, d, soft):
    return cached(("pad", chord, round(d, 3), soft), lambda: I.pad([I.m2f(m + 12) for m in CH[chord]], d, 0.5, R, att=0.4 if soft else 0.05, rel=0.25, warm=1400.0))


def put(bus, x, t, gain=1.0, p=0.0):
    if t >= 0:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def play_bar(t0, chord, level, beat, until=None, hook=False):
    """one bar. level 0 = pad and a slow arpeggio, 1 = + bass and hats, 2 = + kick, claps, sixteenths, 3 = + shaker, open hat"""
    live = lambda t: until is None or t < until - 0.03
    notes, root = CH[chord], CH[chord][0] - 12
    if live(t0):
        put("comp", pad(chord, 4 * beat * 0.98, level == 0), t0, 0.75 if level == 0 else 0.5)
    for i in range(16):
        t = t0 + i * beat / 4
        if not live(t):
            break
        GRID.append((t, chord))
        if level >= 1 and i % 2 == 0:
            e = i // 2
            put("bass", sbass(root + (12 if e in (2, 6) else 7 if e == 7 else 0)), t, (0.95 if e % 2 == 0 else 0.75) * R.uniform(0.94, 1.04))
        if level >= 1 and i % 4 == 2:
            put("drums", hat(0.5 * R.uniform(0.85, 1.1), open_=(level == 3 and i == 14)), t, 1.0, 0.25)
        if level >= 2:
            if i % 4 == 0:
                put("drums", kick(KICK * (1.0 if i == 0 else 0.88)), t)
            if i in (4, 12):
                put("drums", clap(0.9 * R.uniform(0.9, 1.05)), t, 1.0, -0.15)
            put("lead", arp(notes[ARP[i]] + 12), t, (0.5 if level == 2 else 0.75) * (1.0 if i % 4 == 0 else 0.8), 0.3 if i % 2 else -0.3)
        if level == 3 and i % 2 == 1:
            put("drums", shaker(0.35), t, 1.0, -0.4)
        if level == 0 and i % 4 == 0:
            put("lead", arp(notes[(i // 4) % 4] + 12, 0.5), t, 0.5, 0.2)
        if hook and level >= 2 and i >= 8 and i % 2 == 0:               # a short answer in the second half of the bar
            j = (i - 8) // 2
            put("lead", lead(HOOK[chord][j], 0.5 if j == 3 else 0.26), t, 0.42, -0.2)


def build_music():
    B = 60.0 / 104
    BAR = 4 * B
    motif = lambda t, g=0.6: (put("lead", lead(50, 0.26, False), t, g, -0.1), put("lead", lead(49, 0.5, False), t + 0.5 * B, g, -0.1))   # the leaker's two sly notes

    # ---- A: the hook, the game, the leaker, the coin. Stops for the leaker's own words.
    stop1 = Wt(84) - 0.22
    form = ["Dm", "Dm", "Bb", "C", "Dm", "Dm", "Bb", "C", "Gm", "Gm", "A", "A"]
    level = lambda t: 1 if t < cut_t(1) - 0.3 else 3 if t < cut_t(3) - 0.3 else 2 if t < cut_t(10) - 0.3 else 1 if t < cut_t(13) - 0.3 else 3 if t < cut_t(15) - 0.3 else 2
    b = 0
    while b * BAR < stop1:
        play_bar(b * BAR, form[b % 12], level(b * BAR), B, until=stop1, hook=b % 2 == 1)
        b += 1
    put("hits", I.cymbal(0.5, R, 1.6), 0.0, 0.45)
    EVENTS.append((0.0, "music in", "night-drive pulse, 104 bpm, D minor: synth bass, kick, claps, arpeggio, pad"))
    put("hits", chord_hit([38, 45, 50, 53], 0.5), Wt(2), 0.8)
    EVENTS.append((Wt(2), "low synth hit", "'threatened'"))
    put("hits", chord_hit([62, 65, 69, 76], 0.7), Wt(20), 0.6)
    put("hits", I.cymbal(0.55, R, 1.8), Wt(20), 0.4)
    EVENTS.append((Wt(20), "bright chord + cymbal", "'Grand Theft Auto Six'"))
    motif(Wt(38) + 0.05)
    EVENTS.append((Wt(38) + 0.05, "two sly notes", "the leaker's motif, on 'Cyberleek'"))
    put("comp", I.pad([I.m2f(m) for m in (57, 61, 64, 67)], 2.3, 0.5, R, att=0.02, rel=0.9, warm=1200.0), stop1, 0.5)
    put("bass", sbass(33, 0.9), stop1, 0.9)
    EVENTS.append((stop1, "music stops", "one chord rings; the leaker's own words are read over it"))

    # ---- B: the studio (no drums, slow arpeggio), then the lawyers march
    tb, stopb = cut_t(18), cut_t(22)
    for k, (chord, lv) in enumerate((("Dm", 0), ("Bb", 0), ("Gm", 2))):
        play_bar(tb + k * BAR, chord, lv, B, until=stopb)
    for k in range(4):
        if tb + 2 * BAR + k * B < stopb - 0.1:
            put("drums", tom(118 - 8 * (k % 2), 0.8), tb + 2 * BAR + k * B, 0.8, -0.2 + 0.1 * k)
    EVENTS.append((tb, "music back, soft", "pad and a slow arpeggio for the studio's statement"))
    EVENTS.append((tb + 2 * BAR, "kick, claps and toms", "the lawyers go to court"))

    # ---- C: October. A rising line, then one hit and a stop for the quote.
    tc, stopc = cut_t(22), Wt(128) - 0.1
    for k, (chord, lv) in enumerate((("A", 2), ("A", 3), ("Dm", 1))):
        play_bar(tc + k * BAR, chord, lv, B, until=stopc)
    for j, m in enumerate((57, 58, 61, 62, 64, 65, 67, 69)):
        put("lead", lead(m, 0.3, False), tc + j * B, 0.5, 0.2)
    put("hits", chord_hit([38, 45, 50, 53, 57], 0.6), Wt(124), 0.8)
    put("hits", I.cymbal(0.7, R, 2.0), Wt(124), 0.4)
    EVENTS.append((tc, "music back, rising", "a line climbs a scale step per beat under the threat"))
    EVENTS.append((Wt(124), "low hit + cymbal", "'goes public!'"))
    put("comp", I.pad([I.m2f(m) for m in (50, 57, 62, 65)], 2.6, 0.5, R, att=0.05, rel=1.0, warm=1100.0), stopc, 0.42)
    EVENTS.append((stopc, "music stops", "one soft chord; the demand is read over it"))
    t = Wt(135) - 0.05                                            # tea: a music box, as politely as possible
    for j, m in enumerate((74, 78, 81, 86, 81, 78, 74)):
        put("lead", I.musicbox(I.m2f(m), 0.5, R, 1.3), t + j * 0.3, 0.5, 0.25 - 0.08 * j)
    EVENTS.append((t, "music box", "seven dainty notes under 'most polite threat I've ever heard'"))

    # ---- D: nobody has verified; the coin climbs; the fans say no; the band stops for the fall
    td, stopd = cut_t(28), Wt(164) - 0.06
    for k, (chord, lv) in enumerate((("Dm", 1), ("Bb", 3), ("C", 2))):
        play_bar(td + k * BAR, chord, lv, B, until=stopd, hook=k == 2)
    EVENTS.append((td, "music back, sparse", "bass, hats and pad under 'nobody has verified'"))
    EVENTS.append((td + BAR, "full groove", "the coin climbs"))
    EVENTS.append((stopd, "music stops", "'Two days later?'"))
    t = cut_t(32) + 0.05
    for j, m in enumerate((69, 65, 62, 58, 53, 50)):
        put("lead", lead(m, 0.22, False), t + j * 0.16, 0.5, -0.3 + 0.12 * j)
    put("bass", sbass(26, 1.2), cut_t(33) + 6 / FPS, 1.0)
    EVENTS.append((t, "falling line", "six notes down as the chart falls"))

    # ---- E: called off. A held chord that is switched off; the motif once more on 'For now.'
    put("comp", I.pad([I.m2f(m) for m in (55, 58, 62, 65)], Wt(172) - cut_t(34), 0.5, R, att=0.15, rel=0.08, warm=1000.0), cut_t(34), 0.6)
    motif(Wt(180) + 0.02, 0.5)
    EVENTS.append((Wt(180) + 0.02, "two sly notes", "'For now.'"))

    # ---- F: where it stands. Four bars stretched to end exactly in the pause before the question.
    tf, z = cut_t(37), WORDS[213]["end"] + 0.12
    BF = (z - tf) / 16
    for k, (chord, lv) in enumerate((("Dm", 2), ("F", 3), ("Bb", 2), ("A", 2))):
        play_bar(tf + k * 4 * BF, chord, lv, BF, hook=k in (1, 3))
    put("hits", I.cymbal(0.45, R, 1.6), tf, 0.4)
    EVENTS.append((tf, "music back", f"full groove, {60 / BF:.0f} bpm so that four bars end in the pause before the question"))
    for ts, v in I.snare_roll(z - 2 * BF, z - 0.02, 0.12, 0.7, R, rate=24):
        put("drums", I.snare(v, R, dur=0.2, buzz=True), ts, 0.55)
    put("comp", I.pad([I.m2f(m) for m in (50, 57, 60, 64, 65)], 4.6, 0.5, R, att=0.02, rel=1.2, warm=1500.0), z, 0.75)
    for m in (62, 69, 76):
        put("lead", arp(m, 0.9), z, 0.7, 0.2)
    put("bass", sbass(26, 1.2), z, 1.0)
    put("bass", sbass(38, 1.2), z, 0.5)
    put("drums", kick(1.0), z)
    put("hits", I.cymbal(0.6, R, 2.4), z, 0.45)
    EVENTS.append((z, "final chord", "D minor 9 lands in the pause and rings under the question"))
    e = WORDS[-1]["end"] + 0.22                                    # button: the sly notes resolve, A then D
    put("bass", sbass(33, 0.3), e, 0.9)
    put("lead", lead(57, 0.24, False), e, 0.5)
    put("drums", clap(0.8), e, 0.8)
    put("bass", sbass(26, 0.9), e + BF, 1.0)
    put("lead", lead(62, 0.6, False), e + BF, 0.5)
    put("drums", kick(1.0), e + BF)
    EVENTS.append((e, "button", "two notes, A then D: the tune closes while the leaker looks over the counter and ducks back"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.8 * BUS["comp"] + 0.7 * BUS["lead"] + 0.28 * BUS["hits"]
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
        if x.ndim == 2:
            x = x.mean(0)
        place(buf, pan(norm_to(x, voice_lufs + lu), p), t)
        if name:
            EVENTS.append((t, name, why))

    # every cut gets a small swish, alternating sides; the quiet passages (the quotes, 'For now') get none
    quiet = {17, 26, 27, 35, 36}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right"))

    stamps = [(Wt(2), "THE THREAT"), (Wt(7), "A 13-YEAR WAIT"), (Wt(44), "LEAKED"), (Wt(55), "NO DISC"), (Wt(68), "CRYPTO COIN"), (Wt(117), "$30,000,000"), (Wt(121), "THE WHOLE GAME"), (Wt(144), "UNVERIFIED"),
              (Wt(155), "$7.8 MILLION"), (cut_t(32) + 5 / FPS, "DOWN 78%"), (Wt(167), "$1.7 MILLION"), (Wt(172), "CALLED OFF"), (Wt(187), "NOT IDENTIFIED"), (Wt(189), "NOT CHARGED")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(Wt(13), "the studio: Rockstar Games"), (Wt(17), "name tag: Grand Theft Auto VI"), (Wt(22), "calendar: Nov 19"), (Wt(32) + 6 / FPS, "only Minecraft has sold more"), (Wt(34), "dateline: August 18"),
            (Wt(38), "name tag: Cyberleek"), (Wt(47), "the leaker's stated reason"), (Wt(58), "confirmed by Rockstar"), (Wt(63), "coin holders voted on leaks"), (Wt(84), "quote card: Cyberleek"),
            (Wt(89), "name tag: Rockstar Games"), (Wt(94), "quote card: Rockstar"), (Wt(100), "name tag: Take-Two"), (Wt(105), "subpoenas"), (Wt(110), "calendar: Oct 10"),
            (Wt(126), "posted on the leaker's website"), (Wt(129), "quote card: the offer"), (Wt(136), "yes, the real quote"), (Wt(157), "peak, Oct 11"), (Wt(168), "Oct 13"), (Wt(176), "quote card: the leeks stop here"),
            (Wt(191), "earnings call, Nov 9"), (Wt(200), "name tag: Strauss Zelnick"), (Wt(202), "quote card: Zelnick"), (Wt(211), "a code, not a disc"), (Wt(215), "WHAT DO YOU THINK?"),
            (Wt(231), "card A"), (Wt(234) + 4 / FPS, "card B")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    def roll(a, z, f0=1500.0, f1=3000.0):                         # a counter: a dozen ticks per 400 ms sits about 10 LU louder than one tick
        t = a
        while t < z:
            u = (t - a) / (z - a)
            fx(t, tick(f0 + (f1 - f0) * u), -21 + 2 * u, 0.1)
            t += 0.05 - 0.02 * u

    # 1: the hook, the crowd, the studio
    for k in range(3):
        fx(Wt(2) + 0.12 + k * 0.2, blip(1320), -15, 0.3)
    EVENTS.append((Wt(2) + 0.12, "alarm beeps", "the lid over the RELEASE button opens"))
    fx(cut_t(1) + 0.05, applause(1.7, R, people=40), -15, 0, "crowd", "the people who have been waiting, in front of the planet")
    fx(cut_t(2) + 0.04, buzz(0.3), -13, 0, "buzzer", "the studio's screens turn red")
    # 2: the game
    fx(cut_t(4) + 0.1, whoosh(0.9, R, peak=0.45, f_lo=200, f_hi=1400, tail=0.4), -14, -0.2, "car pass", "the convertible")
    a, z = (Wf(27) - 2) / FPS, (Wf(31) + 8) / FPS
    roll(a, z)
    EVENTS.append((a, "counter ticks", "the number rolls to 230 million"))
    fx(z, ding(1568, 0.9), -10.5, 0, "counter lands", "230,000,000+")
    # 3: the leaker
    for i in (33, 34, 35, 36):
        for j in range(3):
            fx(Wt(i) + j * 0.06 * R.uniform(0.8, 1.2), key(), -17, R.uniform(-0.2, 0.2))
    EVENTS.append((Wt(33), "typing", "the leaker at the keyboard"))
    fx(Wt(41), boing(), -12, 0.2, "boing", "the museum leek wobbles on 'vegetable'")
    for i in range(3):
        fx(cut_t(9) + (2 + i * 4) / FPS, pop(520 + 90 * i, 1200 + 150 * i, 0.06), -14, -0.2 + 0.2 * i)
    EVENTS.append((cut_t(9) + 2 / FPS, "three pops", "clips land in the feed as the shot opens"))
    # 4: the box
    fx(Wt(53), knock(), -12, 0.1, "click", "the case opens")
    fx(Wt(57), slide(500, 1400, 0.16), -13, 0.1, "slip", "the code slides out of the case")
    # 5-6: the coin
    for i in range(3):
        fx(cut_t(13) + (2 + i * 4) / FPS, ding(1760 + 220 * i, 0.4), -14, 0.3)
    EVENTS.append((cut_t(13) + 2 / FPS, "three coin dings", "a coin badge lands on every clip"))
    fx(Wt(77), kaching(), -9.5, 0.2, "cash register", "'at least two hundred thousand dollars'")
    a, z = Wt(77) + 0.2, (Wf(81) + 6) / FPS
    roll(a, z, 1700, 2800)
    fx(z, ding(1976, 0.8), -11, 0, "counter lands", "$200,000+")
    for k in range(4):
        fx(cut_t(17) + 0.35 + k * 0.33, clink(R), -14, 0.1, "coin in the jar" if k == 0 else "", "coins drop into the donation jar")
    # 7: the studio, the court
    for k in range(6):
        fx(cut_t(20) + 0.1 + k * 0.3, step(), -15, -0.3 + 0.1 * k)
    EVENTS.append((cut_t(20) + 0.1, "footsteps", "the lawyers climb the courthouse steps"))
    fx(Wt(103), knock(), -9.5, 0, "gavel", "'court'")
    fx(Wt(103) + 0.28, knock(), -10.5, 0)
    for k in range(3):
        fx(cut_t(21) + 0.15 + k * 0.32, blip(990 + 110 * k), -17, -0.4 + 0.4 * k)
    EVENTS.append((cut_t(21) + 0.15, "search pings", "magnifying glasses close in on the hood"))
    # 8: the threat
    fx(cut_t(23) + 0.05, slide(300, 1500, 0.5), -14, 0.2, "rising whistle", "up to the 30 million line")
    for k in range(4):
        fx(Wt(121) + 0.1 + k * 0.19, blip(1320), -15, 0.3)
    EVENTS.append((Wt(121) + 0.1, "alarm beeps", "the RELEASE button, armed"))
    # 9: the demand, politely
    fx(Wt(129) + 0.02, ding(1568, 0.7), -12, 0.2, "ding", "the disc, served")
    fx(Wt(133) + 0.02, ding(1319, 0.7), -12, 0.2, "ding", "the apology card")
    fx(Wt(137), clink(R), -15, 0.2, "teacup clink", "tea")
    # 10: unverified
    fx(cut_t(28) + 0.3, knock(), -12, 0.2, "knock on the crate", "is anything in there?")
    fx(cut_t(28) + 0.55, knock(), -13, 0.2)
    # 11: the chart
    a, z = cut_t(30) + 0.1, Wt(155)
    roll(a, z, 900, 2400)
    EVENTS.append((a, "rising ticks", "the coin climbs to its peak"))
    fx(Wt(161), buzz(0.26), -13, 0, "buzzer", "'don't buy it'")
    fx(cut_t(32) + 0.03, slide(1500, 230, 0.85), -12, 0, "falling whistle", "the chart falls")
    fx(cut_t(33) + 6 / FPS, thud(1.3), -9.5, 0, "crash", "the coin hits the floor, six frames after the cut")
    fx(cut_t(33) + 6 / FPS + 0.12, clink(R), -14, 0.2)
    # 12: called off
    fx(Wt(172), slide(700, 90, 0.5), -11, 0, "power down", "the screens go dark")
    fx(cut_t(35) + 0.12, knock(), -14, 0.4, "door", "the door opens")
    # 13: where it stands
    for k, i in enumerate((184, 186)):
        fx(Wt(i), shutter(), -13, -0.3 + 0.6 * k, "camera shutter", "line-up photographs")
    fx(cut_t(38) + 0.05, applause(1.5, R, people=24), -16, 0, "queue cheer", "the queue outside the shop")
    a, z = Wt(193) - 4 / FPS, Wt(195) + 8 / FPS
    roll(a, z, 1200, 2600)
    fx(z, ding(2093, 0.9), -11, 0.2, "ding", "the needle passes EXPECTED")
    # 14-15: the question
    fx(Wt(210) + 0.05, applause(1.1, R, people=16), -16, 0, "players cheer", "discs in the air")
    fx(Wt(222), kaching(), -10, 0.2, "cash register", "'eighty dollars'")
    fx((TOTAL - 44) / FPS, pop(700, 1500, 0.07), -15, 0.5, "peek", "the leaker's eyes come up behind the counter")
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


GRAPHIC_SOUNDS = {"stamp thud", "pop", "boing", "buzzer", "ding", "counter lands", "crash", "cash register", "click", "power down"}


def planned_changes():
    """Frame ranges where the picture is meant to jump, for the render check: the frame a caption changes on, and the
    ten frames in which a graphic that has a sound arrives (a stamp lands, a card pops, somebody hops). Hard cuts are
    in the shot list. Everything else that jumps is a defect and gets reported."""
    out, caps = [], []
    i = 0
    while i < len(WORDS):                                         # same grouping and timing as Captions.tsx
        a, b = WORDS[i], WORDS[i + 1] if i + 1 < len(WORDS) else None
        pair = bool(b) and not a["ends_sentence"] and a["word"].lower() != "quote" and b["start"] - a["end"] < 0.16 and len(a["word"]) + len(b["word"]) <= 15
        i += 2 if pair else 1
        last, nxt = (b if pair else a), WORDS[i] if i < len(WORDS) else None
        caps.append((max(0.0, a["start"] - 0.03), nxt["start"] if nxt and nxt["start"] - last["end"] < 0.3 else last["end"] + 0.14))
    first = lambda t: int(np.ceil(t * FPS - 1e-9))                # first frame at or after time t
    for k, (start, end) in enumerate(caps):                       # a caption waits for the one before it to end
        on = first(max(start, caps[k - 1][1]) if k else start)
        out.append([on, on])
        if k + 1 == len(caps) or caps[k + 1][0] > end:            # it goes away before the next one comes
            out.append([first(end), first(end)])
    for t, name, _ in EVENTS:
        if name in GRAPHIC_SOUNDS:
            f = int(round(t * FPS))
            out.append([f, f + 9])
    return sorted(out)


_SPEECH_BAND = signal.butter(4, 300, btype="high", fs=SR, output="sos")
speech_band = lambda x: signal.sosfilt(_SPEECH_BAND, x, axis=-1)   # what a phone speaker plays, and where words are understood
DIAG: dict = {}                                                   # intermediate signals, for the report and for checks


def short_loudness(x, win=0.2):
    """K-weighted loudness in a sliding, centred window (so a limiter driven by it sees `win`/2 ahead)"""
    p = (kfilt(x) ** 2).sum(0)
    return -0.691 + 10 * np.log10(ndimage.uniform_filter1d(p, ns(win), mode="nearest") + 1e-12)


def ride(music, talk, ceil_lufs):
    """Pull the music back wherever its speech band would be louder than `ceil_lufs` while someone is speaking."""
    over = np.maximum(0.0, short_loudness(speech_band(music)) - ceil_lufs) * talk
    over = ndimage.uniform_filter1d(ndimage.maximum_filter1d(over, ns(0.04)), ns(0.06), mode="nearest")
    return music * dbg(-over)[None, :]


def build_stems():
    v, sr = read_wav(os.path.join(SHOOT, "voice", "voice.wav"))
    assert sr == SR, sr
    voice = np.zeros(N)
    voice[: min(N, v.shape[1])] = v.mean(0)[:N]
    voice = st(voice)
    v_lufs, v_band = integrated(voice), integrated(speech_band(voice))

    music = build_music()
    duck = speech_gain(voice[0], DUCK_DB)
    music = music * duck[None, :]
    talk = (1 - duck) / (1 - dbg(DUCK_DB))                        # 0 in the gaps, 1 while someone speaks
    band = signal.sosfiltfilt(signal.butter(2, [1200, 5000], btype="band", fs=SR, output="sos"), music, axis=1)
    music = music - (1 - dbg(POCKET_DB)) * talk[None, :] * band
    speaking = duck < dbg(DUCK_DB * 0.5)
    raw, static = music.copy(), 0.0
    for _ in range(5):                                            # level and ceiling depend on each other: settle both
        g = v_lufs + MUSIC_UNDER_VOICE - integrated(music[:, speaking])
        static += g
        music = ride(music * dbg(g), talk, v_band + MUSIC_CEIL)
    end = np.ones(N)
    end[-ns(0.5):] = np.linspace(1, 0, ns(0.5)) ** 2
    DIAG.update(duck=duck, talk=talk, v_band=v_band, before_ride=raw * dbg(static), after_ride=music.copy())
    music *= end[None, :]
    sfx = build_sfx(v_lufs) * end[None, :]
    return voice, music, sfx, v_lufs, speaking


def main():
    voice, music, sfx, v_lufs, speaking = build_stems()
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
        f"- music after ducking: {v_lufs - integrated(music[:, speaking]):.1f} LU under the voice while someone speaks, {v_lufs - integrated(music):.1f} LU under it over the whole film",
        f"- the same above 300 Hz (what a phone speaker plays): {DIAG['v_band'] - integrated(speech_band(music)[:, speaking]):.1f} LU under the voice; "
        f"loudest 200 ms under a spoken word {DIAG['v_band'] - short_loudness(speech_band(music))[DIAG['talk'] > 0.9].max():.1f} LU under it",
        f"- voice over the bed while speaking: median {np.median(margin):.1f} LU, 10th percentile {np.percentile(margin, 10):.1f} LU",
    ]
    print("\n".join(report))
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {int(round(t * FPS)):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# GTA 6 leaker short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
