"""Soundtrack for the San José short: narration + an original score + effects that follow the picture.

    python shoots/sanjose/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/sanjose/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: E minor at 84 beats a minute, in four. Where the other films have a beat, this one has water: a low pad that
never quite settles, a kettledrum on the first beat of the bar, and a six-note motif — E, G, F sharp, E, D, E — that
means the ship. In 1708 it is played by low brass over a snare roll and the cannon; on "Holy Grail" by one bell, high,
over a sub drone; "two thousand feet" hands it to a sonar ping. The first objects are a plucked arpeggio and a triangle;
the crockery is a pizzicato joke two octaves up. The claims are a brass chorale, then a pan flute over a drum for the
mountain, then a music-box motif in G major for the salvage firm and a kettledrum for its ten billion. The watchdog is a
tremolo a minor second apart, and a bureaucracy answers it with two dry notes. The government's "science" rises on
strings, Petro gets four bars of brass, and "so far" is the motif on a music box. "The rest stays where it is" is the
motif at full weight, low; the closing question plays its first four notes and stops on the second degree, in the air.
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
                 momentary, true_peak, read_wav, write_wav, phase, modal, norm_to, shelf, kfilt)
import instruments as I  # noqa: E402
from sfx_gen import (whoosh, clink, rattle, creak, bubbles, splash_big, water_bed, flag_flutter, breeze,  # noqa: E402
                     wood_crack, timber_tear, chain_groan, boot, hammer_hit, vox, vowel_track)

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.8                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS
MUSIC_UNDER_VOICE = -5.5       # music loudness while someone is speaking, after ducking, LU relative to the voice.
POCKET_DB = -5.5               # extra dip in the music's 1.2-5 kHz band under speech: room for consonants at that level
MUSIC_CEIL = -4.3              # while someone speaks, no 200 ms of music may be louder than this (LU relative to the voice)
MUSIC_CEIL_FULL = -3.4         # the same for the whole spectrum: a kettledrum under a word is held to the bed
DUCK_DB = -4.0                 # how far the music dips under speech
# Words the read all but swallows, by word number: (lift for the voice, dip for music and effects) in dB, for that word
# only. Measured with word_margins below (the last line of the cue sheet's header) before the first render.
WEAK_WORDS: dict[int, tuple[float, float]] = {14: (4.0, -3.5), 20: (2.0, -2.0), 154: (2.5, -2.0), 156: (2.0, -2.0), 256: (3.0, -2.5)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "sanjose", "story.ts")).read()
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)
Wt = lambda i: Wf(i) / FPS
F = lambda i, d=0: (Wf(i) + d) / FPS
TOTAL = jsround((WORDS[-1]["end"] + 1.55) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 41 and CUTS[0] == 0, CUTS
JOINS: set[int] = set()                                         # no take runs over a cut in this film
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))

R = rng(20261113)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ music
# E minor at 84 beats a minute, in four. No other news film is in E, and none is this slow in four.
BPM = 84.0
BEAT = 60.0 / BPM
E8 = BEAT / 2
BAR = 4 * BEAT
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
ROOTS = [40, 36, 43, 38]                                         # E, C, G, D: a bar each, a lament bass
# the motif: E, G, F sharp, E, D, E — the ship. On the bars' beats, as (beat, note).
MOTIF = [(0, 76), (1, 79), (1.5, 78), (2, 76), (3, 74), (3.5, 76)]

m2f = I.m2f
_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


pluckn = lambda m, d=1.0: cached(("pluck", m, d), lambda: I.pluck(m2f(m), 0.7, R, d, 0.55, pos=0.19))
glockn = lambda m, d=1.4: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.55, R, d))
viben = lambda m, d=1.6: cached(("vibe", m, d), lambda: I.vibes(m2f(m), 0.5, R, d))
mboxn = lambda m, d=1.4: cached(("mbox", m, d), lambda: I.musicbox(m2f(m), 0.55, R, d))
trian = lambda m, d=2.2: cached(("tri", m, d), lambda: I.triangle(0.5, R, d, m2f(m)))
horn = lambda m, d=1.0, k="horn": cached(("brass", m, round(d, 3), k), lambda: I.brass(m2f(m), d, 0.75, R, k))
tuba = lambda m, d=1.0: cached(("brass", m, round(d, 3), "tuba"), lambda: I.brass(m2f(m), d, 0.8, R, "tuba"))
kett = lambda m, d=2.4: cached(("kett", m, d), lambda: I.timpani(m2f(m), 0.85, R, d))
flute = lambda m, d=0.55: cached(("pan", m, round(d, 3)), lambda: I.whistle([(0.0, d, m, 0.8)], R, vib_rate=5.4, vib_depth=9.0, breath=0.16, bright=0.028)[1])


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if getattr(x, "ndim", 1) == 1 else x, t, gain)


def swell(t0, t1, notes, g=0.12, warm=900.0, att=0.9, rel=1.2):
    put("comp", I.pad([m2f(m) for m in notes], max(0.4, t1 - t0), 0.45, R, att=att, rel=rel, warm=warm), t0, g)


def sonar(m, d=2.4):
    """a ping down there: one clean note, and two echoes off the water"""
    f, t = m2f(m), tt(d)
    one = (np.sin(TAU * f * t) + 0.15 * np.sin(TAU * 2 * f * t)) * np.exp(-t / 0.35) * np.clip(t / 0.005, 0, 1)
    y = one.copy()
    for k, g in ((1, 0.38), (2, 0.16)):
        n = ns(0.42 * k)
        y[n:] += g * one[: len(one) - n]
    return fades(y, 0.001, 0.08)


ping = lambda m: cached(("ping", m), lambda: sonar(m))


def drums_bar(t0, heavy=1.0, roll=False, until=None):
    """a kettledrum on the first beat and a brush on the third: the sea's slow pulse"""
    live = lambda t: until is None or t < until - 0.05
    if live(t0):
        put("drums", kett(40), t0, 0.55 * heavy)
    if live(t0 + 2 * BEAT):
        put("drums", I.brush(0.45, R, 0.4, swish=True), t0 + 2 * BEAT, 0.5 * heavy, 0.2)
    if roll:
        for ht, v in I.snare_roll(t0, t0 + BAR, 0.4, 0.1, R, 26.0):
            put("drums", I.snare(v * 0.9, R, 0.2, 0.85, 0.7), ht, 0.45 * heavy, 0.15)


def motif(t0, g=1.0, bus="lead", voice=horn, oct=0, d=1.2, p=0.15):
    for b, m in MOTIF:
        put(bus, voice(m + oct, d), t0 + b * BEAT, g * (0.55 if b % 1 else 1.0), p * (1 if b % 2 else -1))


def build_music():
    # ---- 1, the battle (shots 0-3): kettledrum, snare roll, low brass; the motif in the tuba under the guns
    t = 0.0
    while t < cut_t(4) - 0.05:
        drums_bar(t, 1.0, roll=True)
        put("bass", tuba(28, 2.2), t, 0.55)
        t += BAR
    swell(0.0, cut_t(4), (40, 47, 52, 59), 0.15, warm=700.0, att=0.4)
    motif(cut_t(1) - 0.4, 0.5, "hits", horn, -12, 0.9)
    EVENTS.append((0.0, "music in", "the battle of Barú: E minor at 84, a kettledrum on the first beat, a snare roll through every bar, a low brass motif"))
    # ---- 2, the Holy Grail (4-6): one bell high, a sub drone, the motif twice
    swell(cut_t(4), cut_t(7), (40, 47, 52), 0.13, warm=600.0, att=0.8)
    put("bass", tuba(28, 3.0), cut_t(4), 0.5)
    for j, m in enumerate((88, 83, 79)):
        put("lead", trian(m, 2.4), cut_t(4) + 0.3 + j * 0.62, 0.45, -0.2 + 0.2 * j)
    motif(cut_t(5) + 0.2, 0.4, "lead", glockn, 0, 1.6)
    EVENTS.append((cut_t(4), "one bell, high", "'the Holy Grail of shipwrecks': the motif on a bell over a drone in E"))
    # ---- 3, found, and the secret (7-9): sonar pings; the pad goes to C
    swell(cut_t(7), cut_t(10), (36, 43, 48, 55), 0.11, warm=800.0, att=0.6)
    for j, m in enumerate((88, 88, 88)):
        put("lead", ping(m), cut_t(7) + 0.4 + j * 1.25, 0.42, -0.25 + 0.25 * j)
    put("lead", ping(84), cut_t(9) + 0.1, 0.45, 0)
    EVENTS.append((cut_t(7) + 0.4, "sonar", "'Colombia found her in twenty fifteen': three pings, the last one on 2,000 feet"))
    EVENTS.append((cut_t(9) + 0.1, "sonar, one tone lower", "'a state secret': the ping comes back a fourth down, and the pad changes to C"))
    # ---- 4, the first objects (10-14): a plucked arpeggio, a triangle for each object
    for j, m in enumerate((64, 67, 71, 76, 79, 83, 88)):
        put("lead", pluckn(m, 0.9), cut_t(10) + 0.15 + j * 0.19, 0.34, -0.35 + 0.1 * j)
    for j, m in enumerate((83, 81, 76)):
        put("lead", trian(m, 1.0), cut_t(12) + 0.2 + j * 0.34, 0.34, 0.2)
    swell(cut_t(10), cut_t(15), (40, 47, 55), 0.08, warm=1400.0, att=0.5)
    EVENTS.append((cut_t(10) + 0.15, "a plucked arpeggio", "'a robot lifted the first objects': E minor going up, one note per object"))
    # ---- 5, the crockery (15-17): pizzicato, and a woodblock for the joke
    for j, m in enumerate((76, 79, 78, 76, 74, 76, 71, 74)):
        put("lead", pluckn(m, 0.35), cut_t(15) + 0.1 + j * 0.22, 0.4, -0.3 + 0.08 * j)
    for j in range(4):
        put("drums", I.brush(0.3, R, 0.2, swish=False), cut_t(15) + 0.35 + j * 0.44, 0.5, 0.3)
    put("bass", tuba(33, 1.4), cut_t(16), 0.45)
    swell(cut_t(15), cut_t(18), (40, 47, 52, 55), 0.11, warm=900.0, att=0.4, rel=0.8)
    EVENTS.append((cut_t(15) + 0.1, "pizzicato", "'the richest wreck in the world, and what came up first was the crockery': the motif as a joke, plucked"))
    # ---- 6, the claims (18-20): a brass chorale in C; a funeral drum for the war grave
    swell(cut_t(18), cut_t(21), (36, 43, 48, 55), 0.14, warm=650.0, att=0.5)
    for j, m in enumerate((60, 64, 67, 72)):
        put("hits", horn(m, 1.6, "tuba"), cut_t(18) + 0.15 + j * 0.5, 0.5)
    put("drums", kett(36), cut_t(19), 0.8)
    put("hits", horn(48, 2.4, "tuba"), cut_t(19) + 0.05, 0.45)
    EVENTS.append((cut_t(18) + 0.15, "a brass chorale", "'Spain says she is a Spanish warship': four notes up in C, on brass"))
    EVENTS.append((cut_t(19), "a funeral drum", "'and a war grave': one kettledrum, and a low tuba held"))
    # ---- 6b, the mountain (21-22): pan flute over a drum, in A minor pentatonic
    put("drums", I.timpani(m2f(45), 0.8, R, 1.8), cut_t(21), 0.6)
    for j, (b, m) in enumerate([(0, 69), (1, 72), (1.5, 74), (2, 76), (3, 74), (4, 72), (5, 69), (6, 67), (7, 69)]):
        put("lead", flute(m, 1.0), cut_t(21) + b * BEAT, 0.5, -0.15 + 0.1 * (j % 3))
        if b % 2 == 0:
            put("drums", I.timpani(m2f(45), 0.4, R, 0.8), cut_t(21) + b * BEAT, 0.35)
    swell(cut_t(21), cut_t(23) + 0.3, (45, 52, 57), 0.1, warm=1200.0, att=0.4)
    EVENTS.append((cut_t(21), "a pan flute and a drum", "the Qhara Qhara: a pentatonic line over a bombo, the mountain's own music"))
    # ---- 7, the salvage firm (23-26): the motif in G major on a music box, and a kettledrum for ten billion
    put("drums", I.brush(0.4, R, 0.3, swish=False), cut_t(23) + 0.1, 0.5, 0.2)
    for j, m in enumerate((79, 83, 86, 91, 86, 83, 79, 83)):
        put("lead", mboxn(m, 0.8), cut_t(23) + 0.12 + j * 0.26, 0.42, 0.15)
    for j, m in enumerate((55, 59, 62)):
        put("bass", pluckn(m - 12, 1.2), cut_t(23) + 0.1 + j * 0.52, 0.4)
    swell(cut_t(23), cut_t(27), (43, 50, 55, 59), 0.09, warm=1600.0, att=0.6)
    put("hits", I.timpani(m2f(31), 0.95, R, 2.2), cut_t(24), 0.85)
    put("hits", tuba(31, 2.0), cut_t(24), 0.5)
    EVENTS.append((cut_t(23) + 0.12, "a music box in G", "'an American salvage firm': the motif, cheerful and wrong, on a music box"))
    EVENTS.append((cut_t(24), "ten billion", "'ten billion dollars': a kettledrum and a tuba on the low G"))
    # ---- 8, ten kilometres, and the decree (27-28): a dissonance that does not resolve; a stamp on "five"
    swell(cut_t(27), cut_t(29), (43, 50, 56, 57), 0.12, warm=700.0, att=0.2)
    put("bass", tuba(31, 2.4), cut_t(27), 0.6)
    for j, m in enumerate((86, 85, 84, 83)):
        put("lead", viben(m, 0.9), cut_t(27) + 0.2 + j * 0.36, 0.34, -0.2 + 0.1 * j)
    put("hits", I.timpani(m2f(38), 1.0, R, 1.6), F(149, -1), 0.9)
    put("bass", tuba(26, 1.8), F(149, -1), 0.55)
    EVENTS.append((cut_t(27), "a dissonance", "'ten kilometres off': D flat over G, and a vibraphone walking down; it does not resolve"))
    EVENTS.append((F(149, -1), "a stamp", "'from half to five per cent': kettledrum, tuba, and the 5% sticker"))
    # ---- 9, the watchdog (29-32): tremolo a minor second apart, a tick for each year
    swell(cut_t(29), cut_t(32), (40, 51, 56), 0.13, warm=800.0, att=0.3)
    for j, m in enumerate((83, 84, 83, 84, 83)):
        put("lead", viben(m, 0.8), cut_t(29) + 0.15 + j * 0.42, 0.3, -0.25 + 0.12 * j)
    for k, w in enumerate((165, 174)):
        for j in range(4):
            put("drums", I.brush(0.18, R, 0.15), F(w) + 0.12 + j * 0.2, 0.4, 0.3 if j % 2 else -0.3)
    EVENTS.append((cut_t(29), "a tremolo, a semitone apart", "'the site was already disturbed': G and A flat held together, the sound of something wrong"))
    # ---- 10, science, and Petro (33-34): strings up, four bars of brass
    swell(cut_t(32), cut_t(35), (40, 47, 52, 59, 64), 0.14, warm=1800.0, att=0.9, rel=1.0)
    for j, m in enumerate((64, 67, 71, 74, 76, 79, 83, 88)):
        put("lead", glockn(m, 1.1), cut_t(32) + 0.2 + j * 0.22, 0.3, -0.3 + 0.09 * j)
    for j, m in enumerate((64, 68, 71, 76)):
        put("hits", horn(m, 0.5, "stab"), F(191) + j * 0.24, 0.42)
    put("drums", kett(40), F(191), 0.7)
    EVENTS.append((cut_t(32) + 0.2, "strings, rising", "'this is science, not treasure': E minor going up on a pad and bells"))
    EVENTS.append((F(191), "four brass notes", "'President Petro wants her raised': a short fanfare under his name"))
    # ---- 11, so far (35-37): the motif on a music box; then the wreck again
    motif(cut_t(35) + 0.1, 0.42, "lead", mboxn, 0, 1.2, 0.2)
    swell(cut_t(35), cut_t(38), (40, 47, 52), 0.1, warm=900.0, att=0.4)
    EVENTS.append((cut_t(35) + 0.1, "the motif, on a music box", "'So far': what came up, played small"))
    # ---- 12, the rest stays (38-39): the motif at full weight, the sea under it
    swell(cut_t(38), cut_t(40), (28, 40, 47, 52, 59), 0.17, warm=520.0, att=0.7, rel=1.4)
    put("drums", kett(28), cut_t(38), 0.9)
    motif(cut_t(38) + 0.15, 0.55, "hits", horn, -12, 1.6, 0.0)
    put("hits", tuba(28, 4.0), cut_t(38), 0.5)
    for j, m in enumerate((76, 74, 71)):
        put("lead", trian(m, 3.0), cut_t(39) + 0.3 + j * 0.9, 0.32, -0.2 + 0.2 * j)
    EVENTS.append((cut_t(38), "the motif, low and heavy", "'the rest stays where it is, at the bottom': the ship's six notes in the tuba, a drone under them"))
    # ---- 13, the question (40): the first four notes, and it stops on the second degree
    swell(cut_t(40), DUR, (40, 47, 56, 62), 0.13, warm=1000.0, att=0.5, rel=1.6)
    for j, m in enumerate((76, 79, 78, 76)):
        put("lead", glockn(m, 1.8), cut_t(40) + 0.25 + j * 0.34, 0.45, -0.2 + 0.13 * j)
    e = WORDS[-1]["end"] + 0.25
    put("lead", trian(78, 3.0), e, 0.4, 0)                        # F sharp, the second degree: no home chord
    put("bass", tuba(28, 1.6), e, 0.5)
    EVENTS.append((cut_t(40) + 0.25, "the motif, unanswered", "'who is she': the first four notes on bells, stopping on F sharp over E"))

    end = np.ones(N)
    end[-ns(0.6):] = np.linspace(1, 0, ns(0.6)) ** 2
    dry = 1.2 * BUS["drums"] + 0.8 * BUS["bass"] + 1.0 * BUS["comp"] + 1.0 * BUS["lead"] + 0.6 * BUS["hits"]
    send = 0.12 * BUS["drums"] + 0.5 * BUS["comp"] + 0.55 * BUS["lead"] + 0.3 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.6, 11, hf=1.0))
    out = shelf(hp(dry + 0.28 * wet, 34), 3200, 2.5)[:, :N] * end[None, :]
    DIAG["buses"] = {k: (integrated(v[:, : ns(cut_t(4))]), integrated(v[:, ns(cut_t(7)): ns(cut_t(10))])) for k, v in BUS.items()}
    return out


# ------------------------------------------------------------------------------------------------ sound effects
def thud(heavy=1.0):
    t = tt(0.36)
    y = np.sin(phase(52 + 130 * np.exp(-t / 0.02))) * np.exp(-t / 0.09) * heavy
    y += lp(R.standard_normal(len(t)), 2600) * np.exp(-t / 0.012) * 0.9 + bp(R.standard_normal(len(t)), 300, 1200) * np.exp(-t / 0.04) * 0.4
    return fades(y, 0.0005, 0.05)


def pop(f0=420.0, f1=980.0, d=0.075):
    t = tt(d)
    return fades(np.sin(phase(f0 + (f1 - f0) * (t / d) ** 0.6)) * np.exp(-t / (d * 0.55)), 0.001, 0.012)


def click():
    t = tt(0.05)
    return fades(modal(0.05, [(2400, 1.0, 0.004), (980, 0.7, 0.008)], R) + hp(R.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.6, 0.0002, 0.01)


def cannon():
    """a gun from the lower deck: a boom, a crack and a long tail"""
    d = 2.6
    t = tt(d)
    y = np.sin(phase(38 + 44 * np.exp(-t / 0.09))) * np.exp(-t / 0.55) * 1.2
    y += lp(R.standard_normal(len(t)), 700) * np.exp(-t / 0.22) * 1.0
    y += bp(R.standard_normal(len(t)), 900, 5000) * np.exp(-t / 0.03) * 0.8
    return fades(np.tanh(y * 1.4), 0.0006, 0.5)


def boom(d=2.2, f0=44.0):
    """the magazine going up: a low wave, a long rumble"""
    t = tt(d)
    y = np.sin(phase(f0 * (0.6 + 0.4 * np.exp(-t / 0.3)))) * np.exp(-t / 0.7)
    y += lp(R.standard_normal(len(t)), 180) * np.exp(-t / 0.9) * 2.2
    y += bp(R.standard_normal(len(t)), 200, 1400) * np.exp(-t / 0.14) * 0.9
    return fades(np.tanh(y * 1.3), 0.001, 0.6)


def splash():
    t = tt(1.4)
    y = lp(R.standard_normal(len(t)), 3200) * np.exp(-t / 0.2) + bp(R.standard_normal(len(t)), 700, 5200) * np.exp(-((t - 0.12) / 0.18) ** 2) * 1.1
    return fades(hp(y, 220), 0.002, 0.5)


def hiss(d=1.0):
    """the cold air of a refrigerated container"""
    t = tt(d)
    return fades(hp(R.standard_normal(len(t)), 2400) * (0.5 + 0.5 * np.sin(TAU * 0.6 * t)) * np.clip(t / 0.2, 0, 1), 0.05, 0.3)


def shutter():
    """a press camera: two clicks, and the wind-on"""
    y = np.zeros(ns(0.34))
    for at, g in ((0.0, 1.0), (0.055, 0.7), (0.2, 0.35)):
        c = click()
        i = ns(at)
        y[i: i + len(c)] += c[: len(y) - i] * g
    return y


def porcelain():
    """a cup set down on a tray: a small high ring"""
    return fades(modal(1.1, [(1180, 1.0, 0.35), (2090, 0.6, 0.2), (3310, 0.35, 0.1)], R), 0.001, 0.12)


def clinkn():
    return clink(R, 1400.0, 0.16, 1.2)


def ping_tick(f=1400.0):
    t = tt(0.05)
    return fades(modal(0.05, [(f, 1.0, 0.006), (f * 2.4, 0.4, 0.004)], R) + hp(R.standard_normal(len(t)), 4000) * np.exp(-t / 0.002) * 0.3, 0.0002, 0.01)


def thrust(d=1.3):
    """the robot's thrusters: filtered noise with a wobble"""
    t = tt(d)
    y = bp(R.standard_normal(len(t)), 120, 900) * (0.6 + 0.4 * np.sin(TAU * 6.5 * t))
    return fades(y * np.clip(t / 0.25, 0, 1), 0.05, 0.3)


def servo(d=0.5):
    """a hydraulic arm"""
    t = tt(d)
    f = 70 + 120 * (t / d)
    return fades(lp(np.sign(np.sin(phase(f))) * 0.5 + np.sin(phase(f * 2)) * 0.5, 1800) * np.sin(np.pi * t / d), 0.01, 0.05)


def build_sfx(voice_lufs):
    buf = np.zeros((2, N + SR * 3))

    def fx(t, x, lu, p=0.0, name="", why=""):
        if t < 0 or t >= DUR:
            return
        if getattr(x, "ndim", 1) == 2:
            x = x.mean(0)
        place(buf, pan(norm_to(x, voice_lufs + lu), p), t)
        if name:
            EVENTS.append((t, name, why))

    f_ = lambda n: n / FPS
    # every cut gets a small swish; the sea and the room get their own colours
    for i in range(1, len(CUTS)):
        w = whoosh(0.3, R, peak=0.1, f_lo=420, f_hi=2400 + 250 * (i % 3), tail=0.09)
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1} cuts, alternating left and right"))

    # 1: the battle
    fx(0.05, water_bed(4.2, R, 0.9, 0.7), -15, 0, "sea", "open water under the two ships")
    fx(cut_t(1) + 0.02, cannon(), -8.5, -0.4, "cannon", "the first gun of the broadside")
    for k in range(3):
        fx(cut_t(1) + 0.35 + 0.28 * k, cannon(), -11, 0.4 - 0.25 * k, "cannon", "the rest of the broadside")
    fx(cut_t(2) + 0.05, boom(), -8.0, 0, "explosion", "'blew up': the magazine")
    fx(cut_t(2) + 0.1, timber_tear(R, 1.1), -11, -0.2, "timber", "her back breaks")
    fx(cut_t(2) + 0.95, creak(1.6, R, 60, 110, rough=0.2), -15, 0.3, "creak", "the hull goes over")
    fx(cut_t(3) + 0.02, splash(), -12, 0, "water", "the sea comes into the hold")
    fx(cut_t(3) + 0.2, clink(R, 900.0, 0.2, 1.0), -15, 0.2, "coins", "coins shift in a chest")
    # 2-3: the wreck, and the depths
    fx(cut_t(4) + 0.05, water_bed(6.0, R, 0.5, 0.35), -19, 0, "", "")
    fx(cut_t(4) + 0.1, bubbles(1.8, R, 0.8), -16, 0.2, "bubbles", "600 metres down")
    fx(cut_t(7) + 0.15, ping(1568.0), -14, -0.3, "sonar", "the finding: one ping in the dark")
    fx(cut_t(9) + 0.2, ping_tick(1200.0), -18, 0.3, "tick", "a coordinate, locked")
    # 4: the recovery
    fx(cut_t(10) + 0.1, thrust(2.0), -14, 0, "thrusters", "the robot comes down")
    fx(cut_t(11) + 0.05, servo(0.7), -13, 0.25, "servo", "the arm unfolds")
    fx(cut_t(11) + 0.55, clink(R, 700.0, 0.28, 1.1), -12.5, 0.1, "clink", "the cannon comes off the seabed")
    # 5, the lab
    fx(cut_t(12) + 0.05, hiss(1.4), -17, -0.2, "cold air", "the door of the refrigerated container")
    fx(cut_t(13) + 0.1, clinkn(), -13, 0.15, "coins", "three coins, into salt water")
    fx(cut_t(14) + 0.15, porcelain(), -14, 0.3, "porcelain", "a cup set down")
    fx(cut_t(15) + 0.05, porcelain(), -14, -0.3, "porcelain", "the second cup")
    fx(cut_t(16) + 0.05, rattle(0.5, R, 18), -17, 0, "paper", "the inventory")
    fx(cut_t(17) + 0.3, porcelain(), -13, 0.2, "porcelain", "'the crockery': one clean ring")
    # 6, the claims
    fx(cut_t(18) + 0.1, flag_flutter(1.4, R), -18, -0.3, "flags", "the flags over the table")
    fx(cut_t(18) + 0.2, wood_crack(R), -15, 0.2, "wood", "the case lands on the table")
    fx(cut_t(19) + 0.15, boot(R, 0.8), -16, -0.2, "step", "a step at the war grave")
    fx(cut_t(21) + 0.05, breeze(1.6, R, 0.8), -18, 0.2, "wind", "the altiplano")
    fx(cut_t(22) + 0.1, clink(R, 1100.0, 0.22, 0.9), -14, 0.1, "silver", "the bar on the blanket")
    # 7, the salvage firm
    fx(cut_t(23) + 0.05, rattle(0.6, R, 22), -16, 0.2, "paper", "the salvage claim, on paper")
    fx(cut_t(24) + 0.05, thud(1.0), -9, 0, "thud", "'ten billion dollars'")
    for k in range(3):
        fx(cut_t(25) + 0.3 + 0.22 * k, ping_tick(900.0 + 120 * k), -17, -0.3 + 0.3 * k, "tick", "a chart, ten kilometres wide")
    # 8, the decree
    fx(cut_t(26) + 0.05, click(), -14, -0.2, "click", "a pen on the decree")
    fx(F(149, -5), thud(0.9), -10, 0, "stamp", "the 5% stamp comes down")
    fx(F(149, -2), rattle(0.3, R, 30), -18, 0.3, "paper", "the paper settles")
    # 9, the watchdog
    fx(cut_t(28) + 0.1, timber_tear(R, 0.7), -15, 0.2, "timber", "the site, disturbed")
    fx(cut_t(29) + 0.6, creak(1.1, R, 45, 70, rough=0.3), -17, -0.2, "creak", "something shifts in the silt")
    fx(cut_t(30) + 0.1, ping_tick(1800.0), -15, 0.3, "tick", "'the coordinates leaked'")
    fx(cut_t(31) + 0.05, rattle(0.7, R, 26), -17, 0, "paper", "the institute's statement")
    # 10, the press
    for k in range(7):
        fx(cut_t(32) + 0.25 + 0.31 * k, shutter(), -18, -0.4 + 0.13 * k, "shutter" if k % 3 == 0 else "", "a press camera")
    fx(cut_t(33) + 0.3, thud(0.7), -12, 0.2, "thud", "the lectern: the president")
    # 11-12: what came up, and the bottom
    fx(cut_t(34) + 0.1, clinkn(), -13, 0.15, "coins", "the coins again")
    fx(cut_t(35) + 0.1, porcelain(), -14, 0.25, "porcelain", "the cups again")
    fx(cut_t(37) + 0.05, water_bed(5.0, R, 0.35, 0.3), -20, 0, "", "")
    fx(cut_t(38) + 0.1, bubbles(2.4, R, 0.5), -18, 0, "bubbles", "the bottom, and the men")
    fx(cut_t(39) + 0.1, creak(2.0, R, 30, 55, rough=0.35), -17, -0.3, "creak", "she moves, down there")
    fx(cut_t(40) + 0.1, water_bed(4.0, R, 0.4, 0.25), -19, 0, "sea", "the question, over open water")

    # the graphic layer: a thud for every sticker, a pop for every plate (same cues as Overlays.tsx)
    for w in (15, 36, 47, 52, 99, 128, 139, 149, 165, 174, 186, 200):
        fx(F(w), thud(0.75), -11.5, 0, "stamp", f"the sticker on word {w}")
    for w in (16, 47, 55, 57, 66, 68, 71, 101, 108, 121, 141, 142, 156, 178, 191, 233, 250):
        fx(F(w) + 0.06, pop(430.0 + 30 * (w % 4), 950.0 + 40 * (w % 3), 0.075), -14, 0.3 if w % 2 else -0.3, "pop", f"the plate on word {w}")
    return buf[:, :N]


# ------------------------------------------------------------------------------------------------ mix
def word_env(i, db, lead=0.05, tail=0.04, ramp=0.03):
    """a gain curve that is `db` over narration word i (from `lead` before it to `tail` after it) and 0 dB everywhere else"""
    a, b = WORDS[i]["start"] - lead, WORDS[i]["end"] + tail
    t = np.arange(N) / SR
    k = (0.5 - 0.5 * np.cos(np.pi * np.clip((t - a + ramp) / ramp, 0, 1))) * (0.5 - 0.5 * np.cos(np.pi * np.clip((b + ramp - t) / ramp, 0, 1)))
    return dbg(db * k)


def word_margins(voice, bed):
    """for every narration word, the loudness of the voice minus that of everything else, both over the word's own span
    (30 ms off each end, never less than 120 ms). A word that reads well under zero is covered by what plays with it."""
    kv, kb = kfilt(voice), kfilt(bed)
    lu = lambda x, a, b: -0.691 + 10 * np.log10(max(1e-12, float((x[:, ns(a): ns(b)] ** 2).mean(axis=1).sum())))
    out = []
    for w in WORDS:
        a, b = w["start"] + 0.03, w["end"] - 0.03
        if b - a < 0.12:
            a, b = (a + b) / 2 - 0.06, (a + b) / 2 + 0.06
        if a < 0:                                    # a first word that starts at zero: the window may not start before the file does
            a, b = 0.0, b - a
        out.append(lu(kv, a, b) - lu(kb, a, b))
    return np.array(out)


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


# sounds that go with something arriving in the picture: the ten frames from each are allowed to jump
GRAPHIC_SOUNDS = {"stamp thud", "stamp", "pop", "ping", "click", "clunk", "paper", "step", "tick", "flap", "marker", "blip", "thud", "buzzer", "cash register", "splash", "plane", "throw"}


SOLO: set[int] = set()                                              # the same words Captions.tsx keeps on their own: none in this film


def planned_changes():
    """Frame ranges where the picture is meant to jump, for the render check: the frame a caption changes on, and the
    ten frames in which something that has a sound arrives (a stamp lands, a card pops, somebody hops, a key is
    pressed, a readout changes colour). Hard cuts are in the shot list. Everything else that jumps is a defect and
    gets reported."""
    out, caps = [], []
    i = 0
    while i < len(WORDS):                                         # same grouping and timing as Captions.tsx
        a, b = WORDS[i], WORDS[i + 1] if i + 1 < len(WORDS) else None
        pair = bool(b) and not a["ends_sentence"] and not a["comma"] and i not in SOLO and b["start"] - a["end"] < 0.16 and len(a["word"]) + len(b["word"]) <= 15
        i += 2 if pair else 1
        last, nxt = (b if pair else a), WORDS[i] if i < len(WORDS) else None
        caps.append((max(0.0, a["start"] - 0.03), nxt["start"] if nxt and nxt["start"] - last["end"] < 0.3 else last["end"] + 0.14))
    first = lambda t: int(np.ceil(t * FPS - 1e-9))                # first frame at or after time t
    for k, (start, end) in enumerate(caps):                       # a caption waits for the one before it to end
        on = first(max(start, caps[k - 1][1]) if k else start)
        out.append([on - 2, on + 2])                              # a caption may land a frame either side of plan
        if k + 1 == len(caps) or caps[k + 1][0] > end:            # it goes away before the next one comes
            out.append([first(end) - 2, first(end) + 2])
    for t, name, _ in EVENTS:
        if name in GRAPHIC_SOUNDS:
            f = jsround(t * FPS)
            out.append([f - 2, f + 12])                           # the whole of a sticker's slam, not just its first frame
    return sorted(out)


_SPEECH_BAND = signal.butter(4, 300, btype="high", fs=SR, output="sos")
speech_band = lambda x: signal.sosfilt(_SPEECH_BAND, x, axis=-1)   # what a phone speaker plays, and where words are understood
DIAG: dict = {}                                                   # intermediate signals, for the report and for checks


def short_loudness(x, win=0.2):
    """K-weighted loudness in a sliding, centred window (so a limiter driven by it sees `win`/2 ahead)"""
    p = (kfilt(x) ** 2).sum(0)
    return -0.691 + 10 * np.log10(ndimage.uniform_filter1d(p, ns(win), mode="nearest") + 1e-12)


def ride(music, talk, ceil_lufs, ceil_full):
    """Pull the music back wherever its speech band would be louder than `ceil_lufs`, or the whole of it louder than
    `ceil_full`, while someone is speaking (a drum roll is all bass: the speech band alone does not see it)."""
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
        music = ride(music * dbg(g), talk, v_band + MUSIC_CEIL, v_lufs + MUSIC_CEIL_FULL)
    end = np.ones(N)
    end[-ns(0.5):] = np.linspace(1, 0, ns(0.5)) ** 2
    DIAG.update(duck=duck, talk=talk, v_band=v_band, before_ride=raw * dbg(static), after_ride=music.copy())
    music *= end[None, :]
    sfx = build_sfx(v_lufs) * end[None, :]
    for i, (up, down) in WEAK_WORDS.items():                      # after every level is set: nothing else in the mix moves
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
        f"- the same above 300 Hz (what a phone speaker plays): {DIAG['v_band'] - integrated(speech_band(music)[:, speaking]):.1f} LU under the voice; "
        f"loudest 200 ms under a spoken word {DIAG['v_band'] - short_loudness(speech_band(music))[DIAG['talk'] > 0.9].max():.1f} LU under it",
        f"- voice over the bed while speaking: median {np.median(margin):.1f} LU, 10th percentile {np.percentile(margin, 10):.1f} LU",
        f"- word by word, the voice over music and effects across each word's own span: median {np.median(per):.1f} LU, 10th percentile {np.percentile(per, 10):.1f} LU, "
        f"lowest {per[low]:.1f} LU ('{WORDS[low]['word']}', word {low}); {int((per < 0).sum())} of {len(per)} words under 0"
        + "".join(f"; '{WORDS[i]['word']}' (word {i}) is lifted {up:g} dB with the bed {-down:g} dB down under it" for i, (up, down) in WEAK_WORDS.items()),
    ]
    print("\n".join(report))
    print("buses, LUFS before the mix (the hook, the break):", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# The San José: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()

