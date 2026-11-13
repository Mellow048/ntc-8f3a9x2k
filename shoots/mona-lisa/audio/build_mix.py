"""The Man Who Walked Out with the Mona Lisa: soundtrack.

    python shoots/mona-lisa/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/mona/story.ts
Writes  mix.wav, cues.md and ../qa-shots.json.

Everything is synthesized here with the kit in templates/audio. The mixing half (ducking, the 1.2-5 kHz pocket, the
ceiling that keeps accents off the words, the limiter) is the one the news films use. The tune, its instruments and every
effect are this film's own.

The score: the film is a silent-film comedy with a sad ending, so it is scored as one. A waltz in D, 90 to the minute,
played by a felt piano, a pizzicato bass and brushes, carries the theft (it is a jaunty crime, and nobody notices). The
stairs turn the waltz into a D minor ostinato on the same three notes; the police get it in G minor with a wood block;
Florence has it in A major on the music box, because the thief thinks he is a hero. Napoleon gets four bars of a pompous
march in B flat that stops when the frame wobbles - he did not steal her - and Leonardo gets a fife over a lute for four
bars of 1516. The prison is the theme as a single tolled note; the return is the waltz again, in D major, with strings
under it and the music box on the tune, and the last four bars are the music box alone, slowing, and a held chord.
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
                 momentary, true_peak, read_wav, write_wav, phase, modal, norm_to, shelf, kfilt, widen)
import instruments as I  # noqa: E402
from sfx_gen import whoosh, clink, rattle, creak, wood_crack  # noqa: E402

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.8
MUSIC_UNDER_VOICE = -5.5      # the user's ruling: 5-6 LU under the voice; 9-11 LU was rejected as inaudible
POCKET_DB = -5.5
MUSIC_CEIL = -4.3
MUSIC_CEIL_FULL = -3.4
DUCK_DB = -4.0
WEAK_WORDS: dict[int, tuple[float, float]] = {26: (1.5, -2.0), 148: (1.5, -2.0), 149: (1.0, -1.5), 183: (1.5, -2.0), 195: (2.0, -2.5), 196: (1.5, -2.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "mona", "story.ts")).read()
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)
F = lambda i, d=0: (Wf(i) + d) / FPS
TAIL = 2.0
TOTAL = jsround((WORDS[-1]["end"] + TAIL) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]
assert len(CUTS) == 37 and CUTS[0] == 0, (len(CUTS), CUTS[:4])
JOINS = {13}                                                  # shot 13 carries on the take of 12
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))

R = rng(2026111311)
EVENTS: list[tuple[float, str, str]] = []


# ------------------------------------------------------------------------------------------------ voices
def piano(m, d=2.2, vel=0.6):
    """a felt piano: soft hammer, two strings a cent apart, the high partials weak and the first to die"""
    f, t = I.m2f(m), tt(d)
    inh, y = 0.00035 * (f / 261.6) ** 1.1, np.zeros_like(t)
    for k in range(1, int(min(13, 6000 / f)) + 1):
        fk = k * f * np.sqrt(1 + inh * k * k)
        amp = k ** -1.35 * np.exp(-(k - 1) / 5.0) * (abs(np.sin(np.pi * k / 8.3)) + 0.12)
        tau = 1.7 * (261.6 / f) ** 0.45 / (1 + 0.3 * (k - 1))
        env = 0.7 * np.exp(-t / tau) + 0.3 * np.exp(-t / (3 * tau))
        for c in (-0.6, 0.7):
            y += amp * env * np.sin(TAU * fk * 2 ** (c / 1200) * t + 0.3 * k)
    y = y / np.abs(y).max() * (1 - np.exp(-t / 0.004)) + lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.012) * 0.18
    return fades(y * vel, 0.001, min(0.4, d / 3))


def mbox(m, d=1.6, vel=0.6):
    return I.musicbox(I.m2f(m), vel, R, d)


def plk(m, d=0.7, vel=0.7):
    return I.pluck(I.m2f(m), vel, R, d, 0.62)


def softbrass(m, d=1.2, vel=0.5, kind="tuba"):
    return I.brass(I.m2f(m), d, vel, R, kind=kind)


def fife(m, d=0.5, vel=0.5):
    return I.fife(I.m2f(m), d, vel, R)


def padch(notes, d, vel=0.4, warm=1400.0, att=0.5, rel=0.8):
    return I.pad([I.m2f(m) for m in notes], d, vel, R, att=att, rel=rel, warm=warm)


def step(hard=1.0, room=0.4):
    """a boot on stone: a soft thump, a scuff and a click"""
    t = tt(0.14)
    thump = np.sin(TAU * 92 * t) * np.exp(-t / 0.035)
    scuff = bp(R.standard_normal(len(t)), 900, 3400) * np.exp(-t / 0.045) * 0.5
    click = hp(R.standard_normal(len(t)), 4000) * np.exp(-t / 0.006) * 0.35
    return fades((thump + scuff + click) * hard, 0.001, 0.04)


def rustle(d=0.5, bright=1.0):
    """cloth: bursts of band-passed noise"""
    t = tt(d)
    env = np.abs(np.sin(TAU * 3.1 * t + 0.4)) ** 2 * np.exp(-t / (d * 0.7))
    return fades(bp(R.standard_normal(len(t)), 1600 * bright, 5200) * env * 0.5, 0.01, 0.08)


def murmur(d, rate=2.4, lo=180.0, hi=900.0, vel=0.3):
    """a room full of people at a distance"""
    x = bp(R.standard_normal(ns(d)), lo, hi) * 0.7 + bp(R.standard_normal(ns(d)), 300, 2000) * 0.3
    t = tt(d)
    mod = 0.65 + 0.35 * np.sin(TAU * rate * t + 1.1) * np.sin(TAU * 0.23 * t)
    return fades(x * mod * vel, 0.25, 0.4)


def shutter():
    """a press camera: the shutter, then the flash bulb"""
    a = clickgen(2600, 0.02, 0.5)
    b = clickgen(1500, 0.05, 0.35)
    out = np.zeros(ns(0.16))
    out[: len(a)] += a
    out[ns(0.055): ns(0.055) + len(b)] += b
    return out


def clickgen(f, d, v):
    t = tt(d)
    return fades((np.sin(TAU * f * t) * 0.6 + hp(R.standard_normal(len(t)), 3000) * 0.5) * np.exp(-t / (d * 0.35)) * v, 0.0005, 0.01)


def scraper(d=0.35, f0=1800.0, f1=3200.0):
    """iron on iron: a hook, a screw thread"""
    t = tt(d)
    f = np.linspace(f0, f1, len(t))
    y = np.sin(TAU * np.cumsum(f) / SR) * 0.3 + bp(R.standard_normal(len(t)), 2500, 7000) * 0.4
    return fades(y * np.exp(-t / (d * 0.5)) * (0.6 + 0.4 * np.sin(TAU * 23 * t) ** 2), 0.004, 0.06)


def clang(f=330.0, d=1.6, vel=0.6):
    return modal(d, [(f, 1.0, 1.4), (f * 2.76, 0.6, 0.9), (f * 5.4, 0.4, 0.5), (f * 8.9, 0.25, 0.3)], R, glide=0.0) * vel


def clop(d=0.2, f=140.0, vel=0.6):
    """wooden lid, a crate"""
    t = tt(d)
    y = np.sin(TAU * f * t) * np.exp(-t / 0.05) + np.sin(TAU * f * 2.3 * t) * np.exp(-t / 0.03) * 0.5
    return fades(y * vel, 0.001, 0.05)


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 4:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def cue(t, name, why):
    EVENTS.append((round(float(t), 3), name, why))


# ------------------------------------------------------------------------------------------------ the tune
# D major, three beats to the bar at 90: the waltz the whole film is built on. Its tune, in the first bar, rises
# F sharp - A - D - and falls back; the third bar is the same notes a step lower. (The other films are in A minor 112,
# D minor 104, G major/E minor 118, C minor 130, F sharp minor 174, G minor 72, B minor 100 and E major 88: this one
# takes D at 90 and no other film's key.)
BPM = 90.0
BEAT = 60.0 / BPM
BAR = 3 * BEAT
D = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 86]   # D major, two octaves from D4: index by scale step
TUNE = [[(0, 0, 1.0), (1, 2, 0.5), (2, 4, 1.5)],                 # D - F sharp - A
        [(0, 5, 1.0), (1, 4, 1.0), (2, 2, 1.0)],                 # B - A - F sharp
        [(0, 4, 1.0), (1, 3, 0.5), (2, 2, 1.5)],                 # A - G - F sharp
        [(0, 1, 1.0), (1, 2, 1.0), (2, 0, 1.0)]]                 # E - F sharp - D
CHORDS = [(0, [0, 2, 4]), (3, [3, 5, 1]), (4, [4, 6, 3]), (1, [1, 3, 5])]


def note(i, octave=0):
    return D[min(len(D) - 1, max(0, i))] + 12 * octave - 12


def waltz(t0, t1, kind="full", g=1.0, tune=True, trans=0):
    """The waltz. kind: full = piano, bass, brushes and the tune; light = no tune; bare = bass and brushes."""
    bar, i = 0, 0
    while t0 + bar * BAR < t1 - 0.05:
        t = t0 + bar * BAR
        root, chord = CHORDS[i % 4]
        live = lambda x: t + x < t1 - 0.03
        if live(0):
            put("bass", plk(note(root, -1) + trans, 0.7, 0.8), t, 0.5 * g)
            put("comp", piano(note(root, -1) + trans, 1.9, 0.42), t, 0.5 * g)
        if kind != "bare":
            for b in (1, 2):
                if live(b * BEAT):
                    put("comp", piano(note(chord[1], 0) + trans, 1.2, 0.3), t + b * BEAT, 0.42 * g, -0.15)
                    if kind == "full":
                        put("comp", piano(note(chord[2], 0) + trans, 1.2, 0.26), t + b * BEAT, 0.34 * g, 0.16)
        if kind != "bare":
            put("drums", I.brush(0.3, R, 0.25, swish=True), t + BEAT, 0.5 * g, 0.2)
            put("drums", I.brush(0.24, R, 0.2), t + 2 * BEAT, 0.4 * g, -0.2)
        if tune and kind == "full":
            for b, deg, ln in TUNE[i % 4]:
                if live(b * BEAT):
                    put("lead", mbox(note(deg, 1 if i % 8 > 3 else 0) + trans, 0.8, 0.5), t + b * BEAT, 0.36 * g, 0.05)
        bar += 1
        i += 1


def ostinato(t0, t1, root=0, g=1.0, step_len=0.5 * BEAT, minor=True, ticks=True):
    """The sneak: the waltz's three notes as a repeating figure in the bass, with a wood block on the beat."""
    degs = [0, 0, (2 if minor else 2), 1] if minor else [0, 2, 4, 2]
    t, k = t0, 0
    while t < t1 - 0.05:
        d = degs[k % len(degs)]
        m = note(d, -1) + root
        if minor and k % 4 in (1, 3):
            m -= 1
        put("bass", plk(m, 0.45, 0.7), t, 0.5 * g, -0.1)
        if ticks and k % 2 == 0:
            put("drums", clickgen(1800, 0.05, 0.18), t, 0.5 * g, 0.3)
        t += step_len
        k += 1


def stab(t, notes, g=1.0, kind="brass", p=0.0):
    for j, m in enumerate(notes):
        x = softbrass(m, 1.0, 0.4, "tuba") if kind == "brass" else padch([m], 2.2, 0.35)
        put("hits", x, t, g, p + 0.1 * (j - 1))


def toll(t, m=50, g=1.0):
    put("hits", clang(I.m2f(m), 2.4, 0.32), t, g)


def room_tone(g=0.05):
    """a soft presence: filtered noise with a slow drift, a room's worth of air under the whole film"""
    x = bp(R.standard_normal((2, ns(DUR))), 120, 1400) * 0.6 + bp(R.standard_normal((2, ns(DUR))), 1700, 5200) * 0.15
    t = tt(DUR)
    drift = 0.8 + 0.2 * np.sin(TAU * 0.07 * t) * np.sin(TAU * 0.031 * t + 1.3)
    return fades(x * drift, 0.8, 1.2) * g


def build_music():
    m = BUS
    place(BUS["comp"], room_tone(), 0.0, 1.0)
    # ---- 0. the theft: the waltz, jaunty, under the whole first explanation (words 0-32, shots 0-4)
    waltz(cut_t(0) + 0.06, F(4), "full", 0.6)
    waltz(F(4), F(33), "full", 0.95)
    cue(cut_t(0) + 0.06, "waltz", "the theft, played as a silent-film comedy: piano, pizzicato bass, brushes")
    # the pane goes on the case: the waltz thins to the music box alone, one note per beat
    waltz(F(22) + 0.2, F(33) - 0.1, "light", 0.55, tune=False)
    # ---- 1. Monday, the smocks, the lift, the stairs (shots 5-9): the waltz slides into D minor; the ostinato takes over
    for i in range(6, 10):
        pass
    ostinato(cut_t(6), cut_t(9), 0, 0.7)
    cue(cut_t(6), "ostinato", "in through the staff door: the tune's three notes in D minor, a wood block on the beat")
    # the lift: the music stops for the frame coming off the wall
    # (the waltz has ended; the ostinato runs to the stairs and stops on a hook)
    # ---- 2. the locked door and the plumber (shots 10-13): a low drone, a tick, and the pipe
    put("comp", piano(note(0, -1) - 1, 4.0, 0.3), cut_t(10), 0.5)
    cue(cut_t(10), "held low D", "the door that will not open")
    put("comp", padch([note(0, -2) - 1, note(4, -2) - 1, note(7, -1) - 1], cut_t(14) - cut_t(10) + 0.4, 0.3, 600.0, 1.6, 2.0), cut_t(10) - 0.1, 0.55)
    for k, t in enumerate(np.arange(cut_t(10) + 0.2, cut_t(14) - 0.4, 1.1)):
        put("drums", clickgen(1500, 0.06, 0.16), t, 0.3 if k % 2 else 0.22, -0.3 if k % 2 else 0.3)
    cue(cut_t(10) + 0.2, "tick", "he tries the door: a wood tick, one beat after another, and a low drone under it")
    # ---- 3. Tuesday, the empty wall (shots 14-16): a clock, then nothing
    for k, t in enumerate(np.arange(cut_t(14), cut_t(17), BEAT * 2)):
        put("drums", clickgen(2200, 0.06, 0.2), t, 0.4, 0.2 if k % 2 else -0.2)
    cue(cut_t(14), "clock", "the artist comes to paint her and finds the hooks: a tick every two beats")
    for i, (semi, at) in enumerate([(3, 0.0), (2, 1.4), (1, 1.2), (0, 2.2)]):
        put("comp", piano(note(semi, -2) - 1, 2.6, 0.26), cut_t(14) + at, 0.5)
    cue(cut_t(14) + 0.0, "the fall of a fourth", "piano under the bare wall: D, C, B flat, A: four notes, a step down at a time")
    # ---- 4. the photographers, the week shut (shots 17-18): a low brass step down, and the doors
    stab(cut_t(17), [note(0, -1) - 1, note(2, -1) - 1], 0.4)
    put("hits", clang(96.0, 1.8, 0.22), cut_t(18), 0.35)
    cue(cut_t(18), "clang", "the Louvre shuts for a week: a low bell on the doors")
    # ---- 5. the crowd (shots 19-20): the waltz comes back, wrong: the tune in the bass, no top
    waltz(cut_t(19), cut_t(21), "bare", 0.6, tune=False)
    # ---- 6. the police (shots 21-22): G minor, a wood block, a detective's piano
    ostinato(cut_t(21), cut_t(23), -5, 0.6, 0.5 * BEAT, True, True)
    cue(cut_t(21), "G minor ostinato", "the police and the poet: the same figure a fourth lower")
    # ---- 7. his room (shots 23-25): the ostinato thins to a heartbeat
    for k in range(10):
        t = cut_t(23) + k * 1.32
        if t < cut_t(26):
            put("hits", piano(note(0, -2), 1.4, 0.3), t, 0.32, 0.0)
    cue(cut_t(23), "heartbeat", "the questioning, and the trunk: a low D every four beats")
    # ---- 8. Florence (shots 26-28): A major, the waltz again, warm, the music box on the tune
    for k in range(3):
        pass
    t = cut_t(26)
    bars = [(0, [4, 6, 8]), (3, [3, 5, 7]), (2, [2, 4, 6]), (4, [4, 6, 8])]
    for j in range(int((cut_t(28) - t) / BAR) + 1):
        b0 = t + j * BAR
        if b0 > cut_t(28) - 0.1:
            break
        root, chord = bars[j % 4]
        put("bass", plk(note(root, -1) + 5, 0.7, 0.7), b0, 0.42)
        put("comp", piano(note(root, -1) + 5, 1.8, 0.4), b0, 0.4)
        for b in (1, 2):
            put("comp", piano(note(chord[1], 0) + 5, 1.2, 0.28), b0 + b * BEAT, 0.34, -0.2 + 0.4 * (b - 1))
        for b, deg, ln in TUNE[j % 4]:
            put("lead", mbox(note(deg, 0) + 5, 0.9, 0.5), b0 + b * BEAT, 0.34, 0.1)
        put("drums", I.brush(0.28, R, 0.2, swish=True), b0 + BEAT, 0.4, 0.25)
    cue(cut_t(26), "A major waltz", "the hotel room in Florence: the same tune, warm, a fourth above, on the music box")
    # the dealer: one held chord under his face
    put("comp", padch([note(4, -1) + 5, note(8, 0) + 5, note(11, 0) + 5], 3.2, 0.24, 1600.0, 0.4, 0.8), cut_t(27), 0.4)
    # ---- 9. Napoleon: four bars of a pompous march in B flat that stop when the frame wobbles
    t = cut_t(29)
    for j in range(4):
        b0 = t + j * 0.92
        if b0 > cut_t(30) - 0.2:
            break
        put("hits", softbrass(note(5, -1) + 3, 0.5, 0.4, "tuba"), b0, 0.3)
        put("hits", softbrass(note(9, -1) + 3, 0.4, 0.28, "tuba"), b0 + 0.46, 0.24)
        put("drums", I.snare(0.3, R, 0.2, 0.9, 0.7), b0 + 0.46, 0.3)
    cue(cut_t(29), "march in B flat", "Napoleon, in his frame: four bars of march, and it stops on 'never'")
    # ---- 10. Leonardo, 1516: a fife over a lute
    t = cut_t(30)
    for k, (deg, ln) in enumerate([(4, 0.5), (2, 0.5), (0, 1.0), (2, 0.5), (4, 0.5), (5, 1.5)]):
        tt0 = t + k * 0.42
        if tt0 < cut_t(31) - 0.1:
            put("lead", fife(note(deg, 0), 0.4, 0.42), tt0, 0.4, 0.1)
            put("bass", plk(note(0, -1), 0.6, 0.6), tt0, 0.36)
    cue(cut_t(30), "fife and lute", "Leonardo brings her to France: a fife over a plucked lute, in D")
    # ---- 11. the police in Florence, the prison (shots 31-32): D minor, a toll, then a slow held note
    ostinato(cut_t(31), cut_t(32), 0, 0.45, BEAT, True, False)
    toll(cut_t(32) + 0.5, 45, 0.32)
    cue(cut_t(32), "toll", "seven months: a tolled D under the cell")
    put("comp", padch([note(0, -1) - 1, note(4, -1) - 1, note(7, 0) - 1], cut_t(33) - cut_t(32) + 0.4, 0.2, 700.0, 0.8, 1.2), cut_t(32) + 0.3, 0.4)
    # ---- 12. she comes back (shots 33-36): the waltz in D major, strings under it, the music box on the tune
    waltz(cut_t(33) + 0.1, cut_t(36) - 0.1, "full", 1.0)
    cue(cut_t(33) + 0.1, "waltz in D, full", "the crowd and the return: the tune again, the strings under it")
    # the last shot: the tune slows, the music box alone, and a held chord
    t = cut_t(36) + 0.15
    last = [(0, 0, 1.0), (1, 2, 1.0), (2, 4, 1.6), (5, 2, 1.0), (6, 0, 2.6)]
    for b, deg, ln in last:
        put("lead", mbox(note(deg, 0), 1.2, 0.55), t + b * BEAT * 1.5, 0.36, 0.05)
    put("comp", padch([note(0, -1), note(4, -1), note(7, 0), note(9, 0)], DUR - t - 0.1, 0.3, 1200.0, 0.6, 1.6), t + 1.4, 0.42)
    cue(t, "music box, slowing", "the last picture: the tune at half speed, the music box alone, then a held D")
    return m


BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}


# ------------------------------------------------------------------------------------------------ effects
def build_sfx(v_lufs: float):
    B = {k: np.zeros((2, N + SR * 6)) for k in ("steps", "cloth", "metal", "room", "flashes")}
    sp = lambda x, t, g=1.0, p=0.0: place(B["steps"], pan(x, p), t, g)
    cl = lambda x, t, g=1.0, p=0.0: place(B["cloth"], pan(x, p), t, g)
    me = lambda x, t, g=1.0, p=0.0: place(B["metal"], pan(x, p), t, g)
    rm = lambda x, t, g=1.0, p=0.0: place(B["room"], pan(x, p), t, g)
    fl = lambda x, t, g=1.0, p=0.0: place(B["flashes"], pan(x, p), t, g)

    def walks(t0, t1, rate=0.44, gain=0.4, seed=0, pan0=-0.4, pan1=0.4):
        n = max(1, int((t1 - t0) / rate))
        for k in range(n):
            t = t0 + k * rate
            p = pan0 + (pan1 - pan0) * (k / max(1, n - 1))
            sp(step(0.8 + 0.2 * R.random(), 0.4), t, gain, p)
            cue(t, "step", "a walk across the set")

    # 0-1 the theft and the walk out: unhurried footsteps on parquet, a guard's on stone
    walks(cut_t(1) + 0.05, cut_t(2) - 0.05, 0.42, 0.44, pan0=0.5, pan1=-0.5)
    walks(cut_t(2) + 0.3, cut_t(2) + 2.6, 0.5, 0.22, pan0=-0.3, pan1=0.2)
    # the frame comes off the hooks (shot 0): iron sliding on iron
    me(scraper(0.4, 1500.0, 900.0), F(1), 0.26, -0.2); cue(F(1), "scrape", "her frame lifts off the four hooks")
    cl(rustle(0.4), F(3), 0.26, -0.2); cue(F(2), "rustle", "he wraps her in a white cloth")
    # 2 the pane in the workshop, the case
    me(clink(R, 2400.0, 0.18, 0.9), F(26), 0.2, 0.0); cue(F(24), "clink", "the pane goes into its rebate")
    me(scraper(0.3, 2400.0, 2800.0), F(25), 0.25)
    # 3 the staff door, the smocks, the crowd outside
    rm(murmur(F(40) - 0.2, 2.4, 180, 1100, 0.22), F(40), 1.0, 0.2)
    walks(F(40), F(41), 0.36, 0.3, pan0=-0.2, pan1=0.4)
    walks(cut_t(7) + 0.1, cut_t(8) - 0.05, 0.34, 0.24, pan0=-0.5, pan1=0.5)
    # 4 the lift, the stairwell: the frame, the glass, her on the floor
    me(scraper(0.5, 1200.0, 2600.0), F(56), 0.45, -0.1); cue(F(56), "scrape", "the frame comes off the wall")
    me(clink(R, 1800.0, 0.22, 1.0), F(60) + 0.2, 0.32, 0.1); cue(F(60) + 0.2, "clink", "the glass pane is set on the floor")
    cl(rustle(0.9, 0.8), F(64), 0.55, 0.0); cue(F(64), "rustle", "he wraps her in the cloth on the staircase")
    sp(step(1.0, 0.7), F(63), 0.4, 0.3)
    # 5 the locked door, the knob, the plumber
    me(creak(0.9, R, 90, 150, rough=0.2, noise=0.08), F(71), 0.5, 0.2); cue(F(71), "creak", "the handle turns; the door will not open")
    me(scraper(0.55, 900.0, 1700.0), F(75) + 0.1, 0.42, 0.1); cue(F(75) + 0.1, "screw thread", "he unscrews the doorknob")
    me(clink(R, 900.0, 0.16, 0.9), F(76) + 0.15, 0.34, 0.1)
    walks(F(78), F(80), 0.4, 0.3, pan0=-0.6, pan1=0.1)
    me(creak(1.1, R, 70, 120, rough=0.25, noise=0.1), F(84), 0.55, 0.1); cue(F(84), "creak", "the plumber opens the door and lets him out")
    # 6 Tuesday: the artist's easel, the guard, the crowd
    cl(clop(0.18, 150.0, 0.5), F(89), 0.3, 0.2)
    cl(clop(0.16, 120.0, 0.4), F(90) + 0.35, 0.22, 0.2)
    walks(F(96) + 0.2, F(98), 0.5, 0.22, pan0=0.2, pan1=-0.2)
    # 7 the studio: the plate camera's shutter, the dark cloth
    fl(shutter(), F(109) + 0.2, 0.5, -0.2); cue(F(109) + 0.2, "shutter", "the photographer's plate camera fires")
    cl(rustle(0.35, 1.2), F(109) + 0.55, 0.3, 0.3)
    # 8 the Louvre shut, the queue on the cobbles, the crowd at the empty wall
    me(clang(120.0, 2.0, 0.3), F(112), 0.34, 0.0); cue(F(112), "clang", "the great doors shut")
    walks(cut_t(19) + 0.1, cut_t(19) + 1.8, 0.52, 0.3, pan0=-0.5, pan1=0.4)
    rm(murmur(cut_t(19) + 0.4, 2.0, 200, 1300, 0.2), cut_t(19) + 0.4, 1.0, 0.0)
    rm(murmur(2.6, 2.8, 220, 1500, 0.16), cut_t(20), 1.0, 0.0)
    # 9 the police office: a door, a chair, a pen
    cl(clop(0.2, 110.0, 0.5), cut_t(21) + 0.15, 0.28, -0.3)
    cl(rustle(0.3, 1.1), cut_t(21) + 0.5, 0.22, 0.2)
    rm(murmur(cut_t(22), 2.2, 290, 900, 0.1), cut_t(22), 1.0, 0.2)
    # 10 his room: the trunk lid, the cloth, the steps
    walks(cut_t(23) + 0.2, cut_t(23) + 1.2, 0.46, 0.24, pan0=0.4, pan1=0.1)
    cl(wood_crack(R), F(148) + 0.1, 0.24, -0.2)
    cue(F(148), "wood crack", "the trunk lid comes up")
    cl(rustle(0.7, 0.9), F(151) + 0.2, 0.28, -0.2)
    # 11 Florence: the cloth off, the dealer's breath, the carabinieri at the door
    cl(rustle(1.0, 0.9), F(158) + 0.1, 0.5, -0.1); cue(F(158) + 0.1, "rustle", "the cloth comes off her in the hotel room")
    me(clink(R, 2100.0, 0.14, 0.8), F(160) + 0.3, 0.24, 0.0)
    cl(clop(0.2, 130.0, 0.4), F(171) + 0.2, 0.26, 0.2)
    walks(F(190), F(191) + 0.6, 0.36, 0.34, pan0=0.6, pan1=0.2)
    me(creak(0.7, R, 100, 140, rough=0.2, noise=0.08), F(190) + 0.1, 0.4, 0.3)
    # 12 Napoleon's frame, the hall of 1516
    me(scraper(0.5, 700.0, 1100.0), F(182) + 0.1, 0.24, 0.0)
    rm(murmur(cut_t(30) - 0.1, 2.4, 170, 700, 0.1), cut_t(30), 1.0, 0.0)
    # 13 the prison: the door, the bars, the tallies
    # the painter who will not touch her, and the shutter coming down a week later
    cl(rustle(0.35, 0.8), cut_t(16) + 0.35, 0.2, -0.3)
    for k, t in enumerate([cut_t(17) + 0.15, cut_t(17) + 0.55]):
        me(shutter(), t, 0.3 if k == 0 else 0.22, 0.1)
    cl(rattle(0.9, R, 34.0), cut_t(17) + 0.6, 0.22, -0.1)
    cue(cut_t(17), "shutter", "the shutter over the bench comes down: a rattle, then a roll")
    me(clang(150.0, 2.4, 0.5), cut_t(32) + 0.15, 0.34, -0.2); cue(cut_t(32) + 0.1, "clang", "the cell door")
    sp(step(1.1, 1.0), cut_t(32) + 0.9, 0.34, 0.3)
    rm(murmur(cut_t(32) + 0.2, 2.2, 120, 500, 0.07), cut_t(32) + 0.2, 1.0, 0.0)
    # 14 the return: the crowd, the flashes, the case, the last picture
    rm(murmur(3.2, 3.0, 240, 1600, 0.22), cut_t(34) + 0.1, 1.0, 0.0)
    for k in range(5):
        fl(shutter(), cut_t(34) + 0.35 + k * 0.55, 0.34, -0.4 + 0.2 * k); cue(cut_t(34) + 0.35 + k * 0.55, "shutter", "the photographers' flashes")
    me(clink(R, 2600.0, 0.12, 0.8), F(218) + 0.1, 0.2, 0.0)
    rm(murmur(2.8, 2.6, 260, 1700, 0.2), cut_t(36) + 0.3, 1.0, 0.0)
    for k in range(4):
        fl(shutter(), cut_t(36) + 0.7 + k * 0.75, 0.26, -0.3 + 0.2 * k)
    out = B["steps"] * 0.75 + B["cloth"] * 0.85 + B["metal"] * 0.8 + B["room"] * 0.9 + B["flashes"] * 0.8
    sfx = np.zeros((2, N + SR * 6))
    for bus in B.values():
        sfx += bus
    # a small room for the effects: everything here is close, but the stone sets ring a little
    ir = make_ir(0.7, 7, pre=0.008, hf=0.8)
    wet = convolve_st(sfx, ir)
    out = sfx * 0.86 + wet * 0.14
    out[:, N:] = 0.0
    return out[:, :N]


# ------------------------------------------------------------------------------------------------ mix
def word_env(i, db, lead=0.05, tail=0.04, ramp=0.03):
    a, b = WORDS[i]["start"] - lead, WORDS[i]["end"] + tail
    t = np.arange(N) / SR
    k = (0.5 - 0.5 * np.cos(np.pi * np.clip((t - a + ramp) / ramp, 0, 1))) * (0.5 - 0.5 * np.cos(np.pi * np.clip((b + ramp - t) / ramp, 0, 1)))
    return dbg(db * k)


def word_margins(voice, bed):
    kv, kb = kfilt(voice), kfilt(bed)
    lu = lambda x, a, b: -0.691 + 10 * np.log10(max(1e-12, float((x[:, ns(a): ns(b)] ** 2).mean(axis=1).sum())))
    out = []
    for w in WORDS:
        a, b = w["start"] + 0.03, w["end"] - 0.03
        if b - a < 0.12:
            a, b = (a + b) / 2 - 0.06, (a + b) / 2 + 0.06
        if a < 0:
            a, b = 0.0, b - a
        out.append(lu(kv, a, b) - lu(kb, a, b))
    return np.array(out)


def speech_gain(voice, depth_db, att=0.05, rel=0.25):
    w = ns(0.02)
    k = len(voice) // w
    db = 20 * np.log10(np.sqrt((voice[: k * w].reshape(k, w) ** 2).mean(1)) + 1e-9)
    on = np.repeat(db > np.percentile(db, 95) - 30, w).astype(float)
    g = np.zeros(N)
    g[: len(on)] = ndimage.maximum_filter1d(on, ns(0.1))
    out = np.empty(N)
    ka, kr, v = 1 - np.exp(-1 / (att * 1000)), 1 - np.exp(-1 / (rel * 1000)), 0.0
    for i in range(0, N, 48):
        x = g[i]
        v += (x - v) * (ka if x > v else kr)
        out[i: i + 48] = v
    return dbg(depth_db * out)


def limiter(x, ceil_db, look=0.003, rel=0.08):
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


STILL_CAPTIONS: set[int] = set()
FLIGHTS: list[tuple[float, float]] = []
GRAPHIC_SOUNDS = {"step", "clink", "scrape", "rustle", "creak", "shutter", "clang", "wood crack", "screw thread"}


def planned_changes():
    out, caps, heads = [], [], []
    i = 0
    while i < len(WORDS):
        a, b = WORDS[i], WORDS[i + 1] if i + 1 < len(WORDS) else None
        pair = bool(b) and not a.get("ends_sentence") and not a.get("comma") and b["start"] - a["end"] < 0.16 and len(a["word"]) + len(b["word"]) <= 15
        heads.append(i)
        i += 2 if pair else 1
        last, nxt = (b if pair else a), WORDS[i] if i < len(WORDS) else None
        caps.append((max(0.0, a["start"] - 0.03), nxt["start"] if nxt and nxt["start"] - last["end"] < 0.3 else last["end"] + 0.14))
    first = lambda t: int(np.ceil(t * FPS - 1e-9))
    for k, (start, end) in enumerate(caps):
        on = first(max(start, caps[k - 1][1]) if k else start)
        out.append([on, on + 2] if heads[k] in STILL_CAPTIONS else [on, on])
        if k + 1 == len(caps) or caps[k + 1][0] > end:
            out.append([first(end), first(end)])
    for t, name, _ in EVENTS:
        if name in GRAPHIC_SOUNDS:
            f = jsround(t * FPS)
            out.append([f, f + 9])
    for t0, t1 in FLIGHTS:
        out.append([jsround(t0 * FPS), jsround(t1 * FPS)])
    return sorted(out)


_SPEECH_BAND = signal.butter(4, 300, btype="high", fs=SR, output="sos")
speech_band = lambda x: signal.sosfilt(_SPEECH_BAND, x, axis=-1)
DIAG: dict = {}


def short_loudness(x, win=0.2):
    p = (kfilt(x) ** 2).sum(0)
    return -0.691 + 10 * np.log10(ndimage.uniform_filter1d(p, ns(win), mode="nearest") + 1e-12)


def ride(music, talk, ceil_lufs, ceil_full):
    over = np.maximum(0.0, np.maximum(short_loudness(speech_band(music)) - ceil_lufs, short_loudness(music) - ceil_full)) * talk
    over = ndimage.uniform_filter1d(ndimage.maximum_filter1d(over, ns(0.04)), ns(0.06), mode="nearest")
    return music * dbg(-over)[None, :]


def build_stems():
    v, sr = read_wav(os.path.join(SHOOT, "voice", "voice.wav"))
    assert sr == SR, sr
    voice = np.zeros(N)
    voice[: min(N, v.shape[1])] = v.mean(0)[:N]
    voice = st(voice)
    v_lufs, v_band = integrated(voice), integrated(speech_band(voice))
    build_music()
    music = np.zeros((2, N + SR * 6))
    for bus in BUS.values():
        music += bus
    music[:, N:] = 0.0
    music = music[:, :N]
    duck = speech_gain(voice[0], DUCK_DB)
    music = music * duck[None, :]
    talk = (1 - duck) / (1 - dbg(DUCK_DB))
    band = signal.sosfiltfilt(signal.butter(2, [1200, 5000], btype="band", fs=SR, output="sos"), music, axis=1)
    music = music - (1 - dbg(POCKET_DB)) * talk[None, :] * band
    speaking = duck < dbg(DUCK_DB * 0.5)
    raw, static = music.copy(), 0.0
    for _ in range(5):
        g = v_lufs + MUSIC_UNDER_VOICE - integrated(music[:, speaking])
        static += g
        music = ride(music * dbg(g), talk, v_band + MUSIC_CEIL, v_lufs + MUSIC_CEIL_FULL)
    end = np.ones(N)
    end[-ns(0.5):] = np.linspace(1, 0, ns(0.5)) ** 2
    DIAG.update(duck=duck, talk=talk, v_band=v_band, before_ride=raw * dbg(static), after_ride=music.copy(),
                buses={k: (integrated(b[:, :N]), integrated(speech_band(b[:, :N]))) for k, b in BUS.items()})
    music *= end[None, :]
    sfx = build_sfx(v_lufs) * end[None, :]
    for i, (up, down) in WEAK_WORDS.items():
        voice = voice * word_env(i, up)[None, :]
        g = word_env(i, down, ramp=0.05)[None, :]
        music, sfx = music * g, sfx * g
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
    per = word_margins(voice * gain, bed * gain)
    low = int(np.argmin(per))
    report = [
        f"- length {mix.shape[1] / SR:.3f} s ({TOTAL} frames at {FPS} fps), 48 kHz stereo, 16-bit",
        f"- integrated loudness {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, limiter at most {-20 * np.log10(gr.min()):.1f} dB",
        f"- stems at mix gain: voice {integrated(voice * gain):.1f} LUFS, music {integrated(music * gain):.1f} LUFS, effects {integrated(sfx * gain):.1f} LUFS",
        f"- music after ducking: {v_lufs - integrated(music[:, speaking]):.1f} LU under the voice while someone speaks, {v_lufs - integrated(music):.1f} LU under it over the whole film",
        f"- the same above 300 Hz: {DIAG['v_band'] - integrated(speech_band(music)[:, speaking]):.1f} LU under the voice",
        f"- voice over the bed while speaking: median {np.median(margin):.1f} LU, 10th percentile {np.percentile(margin, 10):.1f} LU",
        f"- word by word, the voice over music and effects across each word's own span: median {np.median(per):.1f} LU, 10th percentile {np.percentile(per, 10):.1f} LU, lowest {per[low]:.1f} LU ('{WORDS[low]['word']}', word {low}); {int((per < 0).sum())} of {len(per)} words under 0",
    ]
    print("\n".join(report))
    print("buses, LUFS before the mix:", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# The Man Who Walked Out with the Mona Lisa: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized there; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
