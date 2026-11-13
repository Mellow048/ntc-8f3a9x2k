"""Soundtrack for the Nvidia exit short: narration + an original score + effects that follow the picture.

    python shoots/nvidia-exit/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/nvexit/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: E major in twelve-eight, 88 dotted crotchets a minute: a tune for a diner's jukebox. A plucked bass walks,
brushes shuffle, a vibraphone plays the triplets, and somebody whistles over the oldest changes there are (E, C sharp
minor, A, B). The whistle is the boy at the sink; it falters and stops on "On Thursday". It comes back in the booth in
1993; under his own words the band thins to the bass and the brushes. The first chip flops on two notes of a tuba, the
second one falling; the units go out on a run up and come back on the same run down. "Then came A.I." plays the same
changes as a computer would, in broken chords on square waves. With the newspaper the key turns to C sharp minor: no
drums, a bass note on every beat and one thin chord, and never a tune under a quotation. The resignation is the tune's
first five notes on a music box, slowly, and a toll. The three statements get three chords, each a step higher, and
settle nothing. A third report gets the pulse of the other two, a semitone above the key. Over the plaque the music box plays
the tune and breaks off before its end. From "It was gone" the film stays in C sharp minor and goes slowly: strings and a
felt piano under the two analysts (the chord a note at a time, the tune's first three notes, nothing under either
quotation), the dominant on "impossible to replicate", and home to C sharp minor on the cut to the empty chair. The
question is asked over the held chord. Then the whistle from the sink, alone and slowly, plays the tune's first five notes
and the last one is held over C sharp minor: the tune comes home, in the minor.

The elegy was written after the first delivery: the user missed sad music at the end. The first version scored the analysts
with a low pulse, a chord of brass, a whistled bar and a computer's wrong copy of it, and left the question on the dominant.
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
from sfx_gen import whoosh, clink, rattle, crickets, creak, applause, breeze  # noqa: E402

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.8                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS (the sixth film, built to -2.3, came out at exactly -1.0)
MUSIC_UNDER_VOICE = -5.5       # music loudness while someone is speaking, after ducking, LU relative to the voice.
                               # The user rejected scores 9-11 LU under the voice as inaudible and accepted 5-6 (IMPORTANT.md).
POCKET_DB = -5.5               # extra dip in the music's 1.2-5 kHz band under speech: room for consonants at that level
MUSIC_CEIL = -4.3              # while someone speaks, no 200 ms of music may be louder than this (LU relative to the voice,
                               # both measured above 300 Hz, where speech is understood and where a phone speaker plays):
                               # a stab that lands on a word is pulled back to the bed, one that lands in a gap is not
MUSIC_CEIL_FULL = -3.4         # the same for the whole spectrum, relative to the voice's programme loudness: a kettledrum or a full
                               # bar of kick and bass under a word is held to the level of the bed
DUCK_DB = -4.0                 # how far the music dips under speech (it comes up for the breaths and the ending)
# Words the read all but swallows, by word number: (lift for the voice, dip for music and effects) in dB, for that word only.
# Measured with templates/scripts/word_margins.py (the last line of the cue sheet's header) before the first render, as the
# playbook asks. Five content words sat under the bed in the first build: "company" twice (2.9 and 0.7 LU under it, both
# with the whole band and the whistle playing), "booth" (1.2), "out" (1.9, the end of his own sentence) and "flopped"
# (0.4, the word the tuba lands on).
WEAK_WORDS: dict[int, tuple[float, float]] = {57: (2.0, -2.5), 79: (1.5, -2.0), 61: (1.5, -2.0), 83: (1.5, -2.0), 17: (1.0, -1.5)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "nvexit", "story.ts")).read()
# JavaScript's Math.round sends a half up; Python's round() sends it to the even number. A word that starts on exactly half
# a frame would put a cut one frame away from where the picture has it, and the render check would report an unplanned jump.
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)                # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
F = lambda i, d=0: (Wf(i) + d) / FPS                           # the time of "d frames after word i", as the picture counts it
TAIL = 3.6                                                     # seconds after the last word: the question is held and the music ends (TAIL in story.ts)
TOTAL = jsround((WORDS[-1]["end"] + TAIL) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 43 and CUTS[0] == 0, CUTS
JOINS = {20, 22, 39, 41}                                         # shots that carry on the take before them: not cuts
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))   # kit.ts smooth()

R = rng(2026111309)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ small synth voices
def chip(m, d, top=5200.0):
    """a square wave, as an old computer plays a note: odd harmonics, a hard start, a short fall"""
    f, t = I.m2f(m), tt(d)
    y, k = np.zeros_like(t), 1
    while k * f < top:
        y += np.sin(TAU * k * f * t) / k
        k += 2
    return fades(y * np.exp(-t / (d * 0.5)), 0.002, 0.02)


def synth_bass(m, d):
    """a synthesizer bass: a sine with three harmonics that die quickly, so that a phone speaker plays something of it"""
    f, t = I.m2f(m), tt(d)
    y = np.sin(TAU * f * t) + 0.55 * np.sin(TAU * 2 * f * t) * np.exp(-t / 0.14) + 0.4 * np.sin(TAU * 3 * f * t) * np.exp(-t / 0.09) + 0.25 * np.sin(TAU * 4 * f * t) * np.exp(-t / 0.06)
    return fades(y * np.exp(-t / (d * 0.6)), 0.004, 0.03)


def piano(m, d=2.4, vel=0.6):
    """a felt piano, for the elegy: partials a little sharp of the harmonics, the high ones weak (a soft hammer) and the first to die,
    two strings a cent apart, a small thump from the hammer. Low notes ring longer than high ones."""
    f, t = I.m2f(m), tt(d)
    inh, y = 0.0004 * (f / 261.6) ** 1.1, np.zeros_like(t)
    for k in range(1, int(min(14, 6500 / f)) + 1):
        fk = k * f * np.sqrt(1 + inh * k * k)
        amp = k ** -1.3 * np.exp(-(k - 1) / 5.0) * (abs(np.sin(np.pi * k / 8.3)) + 0.12)
        tau = 1.8 * (261.6 / f) ** 0.45 / (1 + 0.3 * (k - 1))
        env = 0.7 * np.exp(-t / tau) + 0.3 * np.exp(-t / (3.2 * tau))
        for cents in (-0.6, 0.7):
            y += amp * env * np.sin(TAU * fk * 2 ** (cents / 1200) * t + 0.3 * k)
    y = y / np.abs(y).max() * (1 - np.exp(-t / 0.004)) + lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.012) * 0.2
    return fades(y * vel, 0.001, min(0.4, d / 3))


def hat(v=0.5):
    t = tt(0.05)
    return fades(hp(R.standard_normal(len(t)), 6500) * np.exp(-t / 0.011) * v, 0.0003, 0.01)


_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


m2f = I.m2f
bassn = lambda m, d=0.5: cached(("bass", m, d), lambda: I.pluck(m2f(m), 0.85, R, d, 0.3, pos=0.22))
harp = lambda m, d=1.1: cached(("harp", m, d), lambda: I.pluck(m2f(m), 0.8, R, d, 0.72, pos=0.31))
glock = lambda m, d=1.0: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.7, R, d))
vibe = lambda m, d=1.2, damp=None: cached(("vibe", m, round(d, 2), damp), lambda: I.vibes(m2f(m), 0.6, R, d, damp=damp))
mbox = lambda m, d=1.4: cached(("mbox", m, round(d, 2)), lambda: I.musicbox(m2f(m), 0.6, R, d))
chipn = lambda m, d=0.2: cached(("chip", m, d), lambda: chip(m, d))
subn = lambda m, d=0.34: cached(("sub", m, d), lambda: synth_bass(m, d))
swish = lambda k: cached(("swish", k), lambda: I.brush(0.5, R, 0.3, swish=True))
tap = lambda k: cached(("tap", k), lambda: I.brush(0.32, R, 0.2))
rim = lambda k: cached(("rim", k), lambda: I.snare(0.3, R, 0.2, snappy=0.7))


# ------------------------------------------------------------------------------------------------ music
# E major in twelve-eight at 88 dotted crotchets a minute: a jukebox shuffle. (The other eight news films are in A minor at 112,
# D minor at 104, G major / E minor at 118, C minor swung at 130, F sharp minor at 174 in three, G minor / B flat major at 72 in
# six, B minor at 100 in five, and F minor at 140 felt at half speed. This one shares no key and no tempo with them.)
# Bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so the bass is
# plucked an octave above a string bass and the level is carried by what a phone does play (the whistle, the vibraphone, the brushes).
BPM = 88.0
BEAT = 60.0 / BPM
T8 = BEAT / 3                                                     # one quaver of the three in a beat
SLOT = 2 * BEAT                                                   # one chord: six quavers
BASS_MIX = 0.8
# Levels of the closing music's strings and piano. Set by measurement: with these the music from "It was gone" to the last word
# is 6.6 to 7 LU under the voice above 300 Hz, and unbroken (the hook's band is 4.5 under it there; the first cut's ending was 7 to
# 11 under it, in fragments, with 1.4 s after the last word), and the music after the last word plays at the loudness the voice
# had (-15 LUFS, momentary) and no louder.
ELEGY_STRINGS, ELEGY_PIANO = 0.6, 1.4
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
# the changes, two beats each: (the bass's root, the chord as the vibraphone plays it, the note the bass walks through to the next root)
CHANGES = [(52, (64, 68, 71), 51), (49, (64, 68, 73), 47), (45, (64, 69, 73), 46), (47, (63, 66, 71), 51)]      # E, C sharp minor, A, B
# the tune, chord by chord: (quaver, note, length in quavers). Its first five notes are B, G sharp, E, G sharp, C sharp.
HOOK = [[(0, 83, 2), (2, 80, 1), (3, 76, 3)], [(0, 80, 3), (3, 73, 3)], [(0, 85, 2), (2, 81, 1), (3, 76, 3)], [(0, 78, 3), (3, 75, 2), (5, 78, 1)]]


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def juke_slot(t0, k, kind="full", until=None, g=1.0):
    """one chord of the jukebox tune, six quavers long. kind: "full" = the bass walks, the brushes shuffle with a tap on the back
    beat, the vibraphone plays every quaver; "light" = the same with the vibraphone on the two beats only; "bare" = the bass on
    the beats and the brushes (under his own words); "chip" = the chord broken into quavers on square waves over a synthesizer
    bass, with a hat for the brushes (the boom)."""
    live = lambda t: until is None or t < until - 0.03
    root, chord, walk = CHANGES[k % 4]
    q = lambda i: t0 + i * T8
    if kind == "chip":
        for i, m in enumerate((chord[0], chord[1], chord[2], chord[0] + 12, chord[2], chord[1])):
            if live(q(i)):
                put("comp", chipn(m + 12, 0.17), q(i), 0.26 * g, -0.3 + 0.12 * i)
                put("drums", hat(0.4 if i % 3 == 0 else 0.24), q(i), g, 0.25 if i % 2 else -0.25)
        for i, w in ((0, 1.0), (3, 0.7)):
            if live(q(i)):
                put("bass", subn(root - 12, 0.5), q(i), w * g)
        return
    for i, m, w in ((0, root, 1.0), (2, root, 0.5), (3, root + 7, 0.8), (5, walk, 0.7)):
        if live(q(i)) and not (kind == "bare" and i in (2, 5)):
            put("bass", bassn(m, 0.5), q(i), w * g)
    for i in (0, 3):
        if live(q(i)):
            put("drums", swish((k + i) % 5), q(i), 0.9 * g, -0.2 if i == 0 else 0.2)
    if kind != "bare":
        for i in (2, 5):
            if live(q(i)):
                put("drums", tap((k + i) % 5), q(i), 0.9 * g, 0.25)
    if kind == "full" and live(q(3)):
        put("drums", rim(k % 3), q(3), 0.5 * g, 0.1)
    if kind in ("full", "light"):
        for i in (range(6) if kind == "full" else (0, 3)):
            if live(q(i)):
                for j, m in enumerate(chord):
                    put("comp", vibe(m, 0.5, 0.2), q(i), (0.5, 0.2, 0.3, 0.45, 0.2, 0.3)[i] * 0.6 * g, -0.3 + 0.3 * j)


def juke(t0, t1, kind="full", g=1.0):
    k = 0
    while t0 + k * SLOT < t1 - 0.05:
        juke_slot(t0 + k * SLOT, k, kind, t1, g)
        k += 1


def tune(t0, slots, step=T8):
    """the tune from its first note, for `slots` chords: (time, length, note)"""
    return [(t0 + (k * 6 + qv) * step, ln * step, m) for k in range(slots) for qv, m, ln in HOOK[k % 4]]


def whistled(notes, g=0.5, falter=None, p=-0.1):
    """somebody whistles these notes: (time, length, note) or (time, length, note, breath: 0.6 unless given).
    falter = (time, semitones): from there the pitch sags and the breath gives out"""
    t0, w = I.whistle([(n[0], n[1], n[2], n[3] if len(n) > 3 else 0.6) for n in notes], R, falter=falter)
    if t0 < 0:
        w, t0 = w[ns(-t0):], 0.0
    put("lead", w, t0, g, p)


def build_music():
    def thin(t0, t1, notes, g=0.13, warm=3000.0, att=0.35, rel=0.5):
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=att, rel=rel, warm=warm), t0, g)

    def rolled(t, notes, g=0.5, gap=0.022, voice=harp):
        for j, m in enumerate(notes):
            put("comp", voice(m, 1.3), t + gap * j, g, -0.3 + 0.6 * j / max(1, len(notes) - 1))

    def pulse(t0, t1, root, chord, g=1.0):
        """the scandal: no drums, a synthesizer bass on every beat, a hat between every other pair, one thin chord"""
        k = 0
        while t0 + k * BEAT < t1 - 0.05:
            put("bass", subn(root, 0.4), t0 + k * BEAT, 0.8 * g)
            if k % 2:
                put("drums", hat(0.22), t0 + k * BEAT + BEAT / 2, 0.6 * g, 0.2)
            k += 1
        thin(t0, t1, chord, 0.1 * g)

    def strings(t0, t1, notes, g=1.0, att=0.45, rel=0.8):
        """the elegy's strings: the pad, voiced in the octave above middle C, where a phone speaker can play it"""
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=att, rel=rel, warm=2600.0), t0, ELEGY_STRINGS * g)

    def pno(t, m, g=0.5, d=2.4, p=0.0):
        put("lead", piano(m, d), t, ELEGY_PIANO * g, p)

    # 0-2 (the hook): the whole band, and the boy at the sink whistles the tune. It gets as far as the sixth chord.
    stop = cut_t(3)
    juke(0.0, stop)
    notes = [n for n in tune(0.0, 6) if n[0] < stop - 0.1]
    notes[-1] = (notes[-1][0], 1.0, notes[-1][2])
    whistled(notes, falter=(stop, -5.0))
    EVENTS.append((0.0, "music in", "the jukebox tune in E major, twelve-eight at 88: a walking bass, brushes, a vibraphone in triplets, and the tune whistled"))
    # 3: "On Thursday, he resigned": the whistle sags and gives out, the band has stopped; a low E, and a toll on "resigned"
    put("bass", bassn(40, 1.6), stop, 0.9)
    put("hits", I.timpani(m2f(40), 0.8, R, 1.8), F(21), 0.8); put("lead", vibe(52, 2.0), F(21), 0.6)
    EVENTS.append((stop, "the whistle falters", "'On Thursday': the band stops, the whistled note sags a fourth and gives out; one low E"))
    EVENTS.append((F(21), "a toll", "'resigned': a kettledrum and one low note of the vibraphone"))
    # 4, 5: Taiwan, Portland: the band again without the tune; a harp goes up with the plane
    juke(cut_t(4), cut_t(6), "light")
    for j, m in enumerate((64, 68, 71, 76, 80, 83, 88)):
        put("lead", harp(m, 1.2), cut_t(4) + 13 / FPS + j * 0.075, 0.45, -0.3 + 0.1 * j)
    EVENTS.append((cut_t(4), "the band, lighter", "born in Taiwan, a first job in Portland: bass, brushes, the vibraphone on the beats; no tune"))
    EVENTS.append((cut_t(4) + 13 / FPS, "harp, rising", "the plane leaves Taiwan for Oregon: seven notes up"))
    # 6-8: his own words: the bass on the beats and the brushes; the three jobs are counted on a triangle (an effect)
    juke(cut_t(6), cut_t(9), "bare")
    EVENTS.append((cut_t(6), "bass and brushes", "'I was a dishwasher, I was a busboy, I waited tables': nothing plays a tune under his words"))
    # 9, 10: 1993, the booth: the whole band and the whistle, from the top
    juke(cut_t(9), cut_t(11))
    whistled([n for n in tune(cut_t(9), 4) if n[0] < cut_t(11) - 0.3])
    EVENTS.append((cut_t(9), "the tune again", "1993, three engineers in a booth: the whole band and the whistle, from the top"))
    # 11: "Why Denny's?": the band stops on the dominant, rolled on a harp
    rolled(cut_t(11) + 0.04, (59, 63, 66, 69, 75), 0.45)
    EVENTS.append((cut_t(11) + 0.04, "harp on the dominant", "'Why Denny's?': B with a seventh, and the band waits"))
    # 12, 13: his own words again
    juke(cut_t(12), cut_t(14), "bare")
    EVENTS.append((cut_t(12), "bass and brushes", "'It had all the coffee you could drink ...': his words again, and no tune under them"))
    # 14: the first chip flops: two notes of a tuba and a horn, the second one falling
    t = F(83)
    for m, kind, w in ((47, "tuba", 0.8), (59, "horn", 0.4)):
        put("hits", I.brass(m2f(m), 0.26, 0.85, R, kind), t, w); put("hits", I.brass(m2f(m - 1), 0.75, 0.85, R, kind, fall=-4.0), t + 0.3, w)
    EVENTS.append((t, "two notes of a tuba", "'flopped': the second note a semitone lower, and falling"))
    # 15: out: a run up the scale on square waves under the counter; 16: back: the same run down, and a kettledrum
    run = (64, 66, 68, 69, 71, 73, 75, 76, 78, 80, 81, 83)
    t0, t1 = F(86), F(89, 6)
    for j, m in enumerate(run):
        put("lead", chipn(m, 0.14), t0 + (t1 - t0) * j / len(run), 0.3 + 0.012 * j, -0.3 + 0.05 * j)
    put("lead", glock(88, 1.2), t1, 0.5, 0.2); thin(cut_t(15), cut_t(16), (52, 59, 64, 68), 0.1)
    EVENTS.append((t0, "a run up", "'two hundred fifty thousand went out': twelve notes up the scale of E under the counter, and a bell where it stops"))
    t0, t1 = F(93), F(96, 6)
    for j, m in enumerate(run[::-1]):
        put("lead", chipn(m, 0.14), t0 + (t1 - t0) * j / len(run), 0.42 - 0.012 * j, 0.3 - 0.05 * j)
    put("hits", I.timpani(m2f(40), 0.9, R, 1.6), t1, 0.9); put("hits", I.brass(m2f(40), 0.6, 0.8, R, "tuba"), t1, 0.45); thin(cut_t(16), cut_t(17), (49, 56, 61, 64), 0.1)
    EVENTS.append((t0, "the same run, down", "'two hundred forty-nine thousand came back': the twelve notes backwards, over C sharp minor"))
    EVENTS.append((t1, "kettledrum and tuba", "the counter stops: 249,000 BACK"))
    # 17: "They survived": E major, rolled from the bottom
    rolled(cut_t(17) + 0.05, (52, 59, 64, 68, 71, 76), 0.5, 0.03); put("bass", bassn(40, 1.0), cut_t(17) + 0.05, 0.8)
    EVENTS.append((cut_t(17) + 0.05, "E major, rolled", "'They survived': the home chord, on a harp"))
    # 18-20: "Then came A.I.": the same changes as a computer plays them; the tune on square waves from the server hall on
    boom = cut_t(21) - 0.3
    juke(cut_t(18), boom, "chip"); thin(cut_t(18), boom, (64, 68, 71, 76), 0.07, warm=5000.0, att=1.2)
    for t, d, m in tune(cut_t(19), 2):
        if t < boom - 0.3:
            put("lead", chipn(m, 0.2), t, 0.62, 0.15)
    rolled(F(109), (64, 68, 71, 76, 80, 83), 0.4, 0.015, glock)
    EVENTS.append((cut_t(18), "the changes, eight-bit", "'Then came A.I.': the same four chords broken into quavers on square waves, a synthesizer bass, a hat"))
    EVENTS.append((cut_t(19), "the tune, eight-bit", "the server hall: the whistled tune as a computer plays it"))
    EVENTS.append((F(109), "bells", "'ChatGPT': E major on six bells, and the boom stops there"))
    # 21-23: the newspaper: C sharp minor. A semitone over the root on "suspect"
    pulse(cut_t(21), cut_t(24), 37, (49, 56, 61, 64))
    put("lead", vibe(74, 2.0), F(124), 0.5, -0.1)
    EVENTS.append((cut_t(21), "a low pulse", "'Two weeks ago, The New York Times ...': C sharp minor; a bass note on every beat, one thin chord, no drums, no tune"))
    EVENTS.append((F(124), "one note on the vibraphone", "'suspect': a D over C sharp minor, a semitone that does not belong"))
    # 24, 25: the memo: one chord, held; nothing moves under his words. 26: the board: the bass goes down a third
    thin(cut_t(24), cut_t(26), (45, 57, 61, 64), 0.1); put("bass", subn(33, 1.6), cut_t(24), 0.7)
    thin(cut_t(26), cut_t(27), (54, 57, 61), 0.1); put("bass", subn(42, 1.4), cut_t(26), 0.8)
    EVENTS.append((cut_t(24), "one chord, held", "Sunday, the memo: A major, and nothing under 'I was unfaithful to my wife'"))
    EVENTS.append((cut_t(26), "the bass moves", "'The board kept him': F sharp minor"))
    # 27, 28: Wednesday: the pulse again, on the dominant
    pulse(cut_t(27), cut_t(29), 44, (56, 60, 63, 66))
    EVENTS.append((cut_t(27), "the pulse, on the dominant", "Wednesday, the second report: G sharp with a seventh, waiting to fall"))
    # 29: "after thirty-three years, he resigned": the tune's first five notes on a music box, slowly; a toll on "resigned"
    for j, m in enumerate((83, 80, 76, 80, 73)):
        put("lead", mbox(m, 1.6), cut_t(29) + 0.12 + j * 0.36, 0.55, 0.15)
    thin(cut_t(29), cut_t(30), (49, 56, 61, 64), 0.1); put("bass", subn(37, 1.5), cut_t(29), 0.7)
    put("hits", I.timpani(m2f(37), 0.9, R, 2.0), F(165), 0.9); put("lead", vibe(49, 2.2), F(165), 0.6)
    EVENTS.append((cut_t(29) + 0.12, "the tune on a music box", "'Thursday, after thirty-three years': its first five notes, slowly, over C sharp minor"))
    EVENTS.append((F(165), "a toll", "'he resigned': a kettledrum and one low note of the vibraphone, as in the hook"))
    # 30: "doesn't say why": a question on the harp, ending in the air
    thin(cut_t(30), cut_t(31), (44, 56, 60, 66), 0.1)
    for j, m in enumerate((68, 72, 75, 78)):
        put("lead", harp(m, 1.2), F(168) + j * 0.15, 0.5, -0.2 + 0.13 * j)
    EVENTS.append((F(168), "a question on the harp", "'doesn't say why': four notes up the dominant, ending in the air"))
    # 31: the third report (a line added after the first delivery): the pulse of the other two reports, a semitone above the key,
    # and a low drum when the page lands
    pulse(cut_t(31), cut_t(32), 38, (50, 57, 62, 66))
    put("hits", I.timpani(m2f(38), 0.8, R, 1.6), F(177, 3), 0.7)
    EVENTS.append((cut_t(31), "the pulse, a semitone up", "'The same day, Reuters reported a third relationship': D major over a low D, a chord from outside the key"))
    EVENTS.append((F(177, 3), "a low drum", "'third': the page lands on the other two"))
    # 32-34: three statements, three chords, each a step higher; nothing is settled
    for a, b, low, chord, who in ((cut_t(32), cut_t(33), 42, (54, 57, 61, 66), "China: 'a smear'"), (cut_t(33), cut_t(34), 44, (56, 60, 63, 66), "the Justice Department: 'no conclusion'"),
                                  (cut_t(34), cut_t(35), 45, (57, 61, 64, 68), "he 'denies any knowledge'")):
        thin(a, b, chord, 0.11, att=0.15); put("bass", subn(low, 1.6), a, 0.8); put("hits", I.timpani(m2f(low), 0.7, R, 1.2), a, 0.5)
        EVENTS.append((a, "a chord, a step higher", who + ": F sharp minor, then G sharp, then A; none of them is home"))
    # 35, 36: the plaque: the tune on a music box, and it breaks off before "It was gone"
    for t, d, m in tune(cut_t(35) + 0.1, 4):
        if t < F(215) - 0.1:
            put("lead", mbox(m, 1.4), t, 0.5, 0.15); put("lead", glock(m + 12, 0.8), t, 0.12, -0.2)
    thin(cut_t(35), F(215), (52, 59, 64, 68), 0.08, warm=4000.0)
    EVENTS.append((cut_t(35) + 0.1, "the tune on a music box", "'That Denny's booth had a plaque': the whistled tune, an octave of bells over it"))
    EVENTS.append((F(215), "the tune breaks off", "'It was gone': the music box stops before the tune's last two notes"))
    # 37-42: the elegy. (Written after the first delivery: the user missed sad music at the end. The first cut had a low pulse and a
    # chord of brass for one analyst, a whistled bar and a computer's wrong copy of it for the other, and a question left on the
    # dominant: sparse, mostly bass, and nothing a listener would call sad.) From "gone" on the film stays in C sharp minor and goes
    # slowly: strings, a felt piano, and, when the last word has been said, the whistle from the sink, alone. The chords change where
    # the picture does: C sharp minor (the bare wall, the first analyst), A on "rip", F sharp minor (the second analyst), G sharp
    # with a seventh on "impossible to replicate", and home to C sharp minor on the cut to the empty chair. Nothing plays a tune
    # under either quotation: the piano plays before them. Everything is voiced where a phone speaker can play it.
    e0, rip_t, an2, imp, home = F(217, 8), F(226), cut_t(40), F(236), cut_t(42)
    strings(e0, rip_t, (61, 64, 68, 73), att=0.6); pno(e0, 49, 0.5, 3.0); pno(e0, 37, 0.2, 3.0)
    for j, m in enumerate((56, 61, 64, 68)):                       # "One analyst says the board had to, quote": the chord, a note at a time, going up
        pno(cut_t(38) + 0.12 + j * 0.34, m, 0.5 + 0.03 * j, 2.2, -0.2 + 0.12 * j)
    strings(rip_t, an2, (61, 64, 69, 73)); pno(rip_t, 45, 0.55, 3.0); pno(rip_t, 57, 0.4, 3.0); put("hits", I.timpani(m2f(45), 0.6, R, 1.6), rip_t, 0.5)
    strings(an2, imp, (61, 66, 69, 73)); pno(an2 + 0.03, 54, 0.5, 2.6); pno(an2 + 0.03, 42, 0.2, 2.6)
    for j, m in enumerate((71, 68, 64)):                           # "Another says his knowledge is, quote": the tune's first three notes, an octave under the whistle
        pno(an2 + 0.2 + j * 0.36, m, 0.58, 2.2, 0.1)
    strings(imp, home, (60, 63, 66, 68)); pno(imp, 56, 0.55, 2.6); pno(imp, 44, 0.2, 2.6)
    # 42, the empty chair: home, in the minor, and the question is asked over the held chord. Then the whistle, slowly, the tune's first
    # five notes: B, G sharp and E over C sharp minor, G sharp over A, and C sharp, held, over C sharp minor. The tune comes home.
    z = WORDS[-1]["end"] + 0.16
    strings(home, z + 1.5, (61, 64, 68, 73), att=0.2); pno(home + 0.03, 49, 0.55, 4.0); pno(home + 0.03, 61, 0.45, 4.0); pno(home + 0.03, 37, 0.25, 4.0)
    whistled([(z, 0.5, 83, 0.66), (z + 0.5, 0.5, 80, 0.62), (z + 1.0, 0.5, 76, 0.6), (z + 1.5, 0.5, 80, 0.52), (z + 2.0, 1.4, 73, 0.4)], 0.52, p=0.0)   # each note softer than the last
    strings(z + 1.5, z + 2.0, (61, 64, 69, 73), 0.5, att=0.25, rel=0.4); pno(z + 1.5, 57, 0.45, 2.0)
    strings(z + 2.0, DUR, (61, 64, 68, 73), 0.36, att=0.3, rel=0.3); pno(z + 2.0, 49, 0.3, 3.0); pno(z + 2.0, 61, 0.22, 3.0); pno(z + 2.0, 37, 0.15, 3.0)
    EVENTS.append((e0, "the elegy begins", "'It was gone': strings and a low piano note, C sharp minor; from here to the end the music is slow and in the minor"))
    EVENTS.append((cut_t(38) + 0.12, "piano, going up", "'One analyst says the board had to': the chord of C sharp minor, a note at a time"))
    EVENTS.append((rip_t, "the chord moves", "'rip': A major, a low piano octave and a soft kettledrum; nothing plays a tune under the quotation"))
    EVENTS.append((an2 + 0.2, "the tune on the piano", "'Another says his knowledge is': its first three notes, slowly, over F sharp minor"))
    EVENTS.append((imp, "the dominant", "'impossible to replicate': G sharp with a seventh, and a low piano note; it wants to go home"))
    EVENTS.append((home, "home, in the minor", "the empty chair: C sharp minor, a low C sharp on the piano; the question is asked over the held chord"))
    EVENTS.append((z, "the whistle, alone", "after the last word: the tune's first five notes, slowly, as the boy at the sink whistled them; the last one, C sharp, is held over C sharp minor: the tune comes home, in the minor"))

    dry = 2.2 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 11, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, : ns(cut_t(3))]), integrated(v[:, ns(cut_t(18)): ns(cut_t(21))])) for k, v in BUS.items()}
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


def tick(f=2100.0):
    t = tt(0.035)
    return fades(modal(0.035, [(f, 1.0, 0.005), (f * 2.3, 0.4, 0.003)], R) + hp(R.standard_normal(len(t)), 4000) * np.exp(-t / 0.0015) * 0.4, 0.0002, 0.006)


def click():
    t = tt(0.05)
    return fades(modal(0.05, [(2400, 1.0, 0.004), (980, 0.7, 0.008)], R) + hp(R.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.6, 0.0002, 0.01)


def slide(f0=1500.0, f1=230.0, d=0.6):
    t = tt(d)
    ph = phase(f0 * (f1 / f0) ** (t / d) * (1 + 0.012 * np.sin(TAU * 7 * t)))
    return fades((np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)) * (0.4 + 0.6 * t / d), 0.01, 0.03)


def blip(f, d=0.045):
    t = tt(d)
    return fades(np.sin(TAU * f * t) * np.exp(-t / (d * 0.45)), 0.002, 0.008)


def step():
    t = tt(0.09)
    return fades(lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.014) + np.sin(TAU * 125 * t) * np.exp(-t / 0.02) * 0.8, 0.0005, 0.02)


def knock():
    t = tt(0.2)
    return fades(modal(0.2, [(410, 1.0, 0.035), (960, 0.6, 0.022), (1650, 0.3, 0.012)], R) + lp(R.standard_normal(len(t)), 500) * np.exp(-t / 0.01), 0.0003, 0.03)


def zap():
    t = tt(0.12)
    return fades(bp(np.sign(np.sin(TAU * 120 * t)) * R.standard_normal(len(t)), 1200, 8000) * np.exp(-t / 0.04), 0.001, 0.02)


def buzz(d=0.16, f=196.0):
    """an error buzzer: a low square wave"""
    t = tt(d)
    return fades(lp(np.sign(np.sin(TAU * f * t)) * 0.6 + 0.4 * np.sign(np.sin(TAU * f * 1.5 * t)), 2600), 0.004, 0.02)


def paper():
    t = tt(0.16)
    return fades(bp(R.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * np.clip(t / 0.16, 0, 1)) ** 0.5 * (0.6 + 0.4 * np.sin(TAU * 40 * t)), 0.005, 0.03)


def pen():
    """a pen on paper: one quick stroke"""
    d = R.uniform(0.09, 0.15)
    t = tt(d)
    return fades(bp(R.standard_normal(len(t)), 2600, 7000) * (0.5 + 0.5 * np.sin(TAU * R.uniform(22, 34) * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5, 0.008, 0.02)


def marker(d=0.3):
    """a highlighter drawn along a line: felt on paper, with a squeak in it"""
    t = tt(d)
    ph = phase(1900 + 500 * (t / d) + 60 * np.sin(TAU * 31 * t))
    y = bp(R.standard_normal(len(t)), 1500, 6000) * 0.8 + 0.22 * np.sin(ph)
    return fades(y * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.4, 0.01, 0.04)


def hum(d, f=110.0):
    """a machine thinking: two detuned tones and a little air"""
    t = tt(d)
    y = np.sin(TAU * f * t) + 0.6 * np.sin(TAU * f * 1.007 * t + 1) + 0.5 * np.sin(TAU * f * 3.0 * t) * (0.5 + 0.5 * np.sin(TAU * 6 * t)) + 0.3 * np.sin(TAU * f * 6.02 * t)
    return fades(y + 0.1 * bp(R.standard_normal(len(t)), 3000, 8000), 0.08, 0.15)


def snore(d=0.8):
    """somebody asleep: one long breath in through the nose"""
    t = tt(d)
    return fades(lp(R.standard_normal(len(t)), 420) * np.sin(np.pi * t / d) ** 2 * (0.6 + 0.4 * np.sin(TAU * 31 * t)), 0.03, 0.08)


def gavel():
    y = np.zeros(ns(0.5)); k = knock()
    for i, g in ((0, 1.0), (ns(0.17), 0.8)):
        y[i:i + len(k)] += k[: len(y) - i] * g
    return y


def printer(d=0.5):
    """a till printing a receipt: a fast row of small teeth"""
    y = np.zeros(ns(d)); tk = tick(1500.0)
    for k in range(int(d * 34)):
        i = ns(k / 34); y[i:i + len(tk)] += tk[: len(y) - i] * (0.6 + 0.4 * R.random())
    return fades(y, 0.002, 0.03)


def rip(d=0.3):
    """a sticking plaster pulled off: a tearing sound made of small teeth, quicker as it goes"""
    t = tt(d)
    teeth = (np.sin(phase(70 + 260 * t / d)) > 0.1).astype(float)
    return fades(bp(R.standard_normal(len(t)), 1800, 9000) * (0.3 + 0.7 * teeth) * (0.3 + 0.7 * (t / d) ** 0.7), 0.004, 0.02)


def shutter():
    """a press camera: the mirror and the curtain"""
    y, c = np.zeros(ns(0.12)), click()
    for i, g in ((0, 1.0), (ns(0.045), 0.7)):
        y[i:i + len(c)] += c[: len(y) - i] * g
    return y


def pour(d=0.8):
    """coffee into a cup: a thin stream whose note rises as the cup fills"""
    t = tt(d)
    n, k = R.standard_normal(len(t)), (t / d) ** 1.3
    return fades((bp(n, 400, 1400) * (1 - k) + bp(n, 1400, 4200) * k) * (0.7 + 0.3 * np.sin(TAU * 31 * t)), 0.03, 0.08)


def tapwater(d):
    """a tap running into a sink"""
    t = tt(d)
    n = R.standard_normal(len(t))
    return fades(hp(n, 2600) * 0.5 + bp(n, 600, 2000) * 0.3 * (0.7 + 0.3 * np.sin(TAU * 9 * t)), 0.1, 0.2)


def build_sfx(voice_lufs):
    buf = np.zeros((2, N + SR * 3))
    FLIGHTS.clear()

    def fx(t, x, lu, p=0.0, name="", why=""):
        """place x so its loudest 400 ms sits `lu` LU relative to the narration"""
        if t < 0 or t >= DUR:
            return
        if x.ndim == 2:
            x = x.mean(0)
        place(buf, pan(norm_to(x, voice_lufs + lu), p), t)
        if name:
            EVENTS.append((t, name, why))

    f_ = lambda n: n / FPS
    # Every cut gets a small swish, alternating sides. None where the camera carries straight on (the four joins).
    for i in range(1, len(CUTS)):
        if i in JOINS:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(JOINS)} cuts, alternating left and right; none on the {len(JOINS)} joins inside a take"))

    stamps = [(F(16), "$5 TRILLION"), (F(21), "RESIGNED"), (F(48), "1993"), (F(124), "SUSPECTED"), (F(162), "33 YEARS"), (F(168), "NO REASON GIVEN")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(F(0, 2), "name tag: Jensen Huang, Nvidia's CEO for 33 years, a caricature"), (F(8), "1993, East San Jose, California"), (F(17), "a first for any company, October 2025"), (F(19), "announced Thursday, Nov. 12, 2026"),
            (F(24), "born Feb. 17, 1963"), (F(28), "Portland, Oregon, around 1978"), (F(35), "tab: his words, Nvidia's blog, 2023"), (F(52), "Chris Malachowsky and Curtis Priem"), (F(53, 5), "stock cartoon figures, not likenesses"),
            (F(56), "the idea: 3D graphics for the PC"), (F(58), "as Nvidia's blog tells it"), (F(64), "tab: his words, Nvidia's blog, 2023"), (F(82), "the NV1, their first product"), (cut_t(15), "tab: as he tells it, Sequoia's podcast"),
            (cut_t(17) + f_(2), "1997, 'we saved the company'"), (F(102), "graphics chips, made for video games"), (F(105), "its chips train and run A.I. systems"), (F(109), "worth $1 trillion by May 2023"),
            (F(113), "The New York Times, Oct. 29, 2026"), (F(120), "no public word from her, as of Nov. 13"), (F(126), "not established, as of Nov. 13, 2026"), (F(131), "a memo to employees"),
            (F(136), "quote card: 'I was unfaithful to my wife. ... I am deeply sorry.'"), (F(143), "and opened an investigation, Nov. 8"), (F(149), "The New York Times, citing"), (F(150), "five people who worked there"),
            (F(155), "the executive is not named or drawn"), (F(157), "no reply from Nvidia or the executive, NBC"), (F(164), "president, CEO and board member"), (F(170), "the investigation is not mentioned"),
            (cut_t(31) + f_(2), "Reuters, Nov. 12, 2026"), (F(174), "citing two people familiar with the matter"), (F(178), "not named; no comment from him or from Nvidia"),
            (F(185), "quote card: '... it is nothing but smears against China.'"), (F(190), "the U.S. attorney general, Nov. 12, 2026"), (F(195), "the F.B.I. is investigating, he said"), (F(200), "'has denied any knowledge', The Guardian"),
            (F(202), "he has agreed to testify before Congress"), (F(208), "unveiled with him in September 2023"), (F(211), "NBC News, Thursday, Nov. 12, 2026"), (cut_t(37) + f_(3), "NBC does not say who removed it, or why"),
            (F(219), "Dan Ives, a U.S. tech analyst"), (F(225), "quote card: '... rip off the Band-Aid and take Nvidia into its next chapter without him.'"), (F(230, 2), "Neil Wilson, an analyst at Saxo UK"),
            (F(235), "quote card: 'His technical knowledge ... is basically unique and impossible to replicate.'"), (F(240), "CAN NVIDIA REPLACE HIM?"), (F(241, 4), "for now: Colette Kress, the finance chief")]
    for k, (t, why) in enumerate(pops):
        fx(t, pop(440 + 40 * (k % 3), 980 + 60 * (k % 3), 0.075), -13.5, 0.3 if k % 2 else -0.3, "pop", why)
    for t, why in ((F(129), "calendar leaf: Nov. 8, 2026"), (F(146), "calendar leaf: Nov. 11, 2026")):
        fx(t, paper(), -12, -0.3, "flap", why)

    # 0: the sink
    fx(0.05, tapwater(2.2), -19, 0.1, "water", "the tap runs into the sink")
    for k in range(1, 8):
        fx(f_(9 * k), clink(R), -15, 0.4, "plate" if k == 1 else "", "a plate lands on the clean pile, one every nine frames")
    # 1: the booth
    fx(F(8), step(), -13, 0, "step", "he holds up the napkin"); fx(F(9), step(), -15, -0.3, "step", "the two engineers light up")
    # 2: the top of the pile
    top = F(17, -4)
    fx(top, step(), -13, 0, "step", "a hop on the top chip"); fx(top + 0.05, applause(1.3, R, people=24), -15, 0, "applause", "confetti: the first five-trillion-dollar company")
    fx(top + 0.1, ding(2093.0, 0.6), -14, 0.3, "ping", "sparks round him")
    # 3: the chair
    fx(cut_t(3) + 0.05, creak(1.1, R, rate0=60, rate1=110), -15, 0.1, "creak", "the empty chair turns, his jacket over its back")
    # 4: the map
    a = cut_t(4)
    fx(a + f_(1), tick(1500.0), -13, -0.3, "tick", "a pin goes into Taiwan"); fx(a + f_(4), pop(520, 1040, 0.08), -13, -0.3, "pop", "the tag: TAIWAN")
    fx(a + f_(12), whoosh(0.5, R, peak=0.5, f_lo=500, f_hi=2600, tail=0.2), -15, 0.2, "plane", "a small plane leaves, going east"); fx(a + f_(26), pop(520, 1040, 0.08), -13, 0.4, "pop", "the tag: OREGON")
    # 5: the diner, 1978
    fx(cut_t(5) + 0.08, ding(1760.0, 0.5), -14, 0.3, "ping", "the diner's door bell"); fx(cut_t(5) + 0.25, ding(1397.0, 0.6), -14, 0.3)
    fx(F(31), step(), -13, 0.2, "step", "he waves: his first day")
    # 6: the sink again; the three jobs are counted on a triangle
    fx(cut_t(6) + 0.03, tapwater(1.6), -19, -0.1, "water", "the tap again")
    for k, (w, what) in enumerate(((39, "dishwasher"), (43, "busboy"), (46, "tables"))):
        fx(F(w), I.triangle(0.5, R, 1.0, f=1568.0 * 2 ** (2 * k / 12)), -12.5, -0.3 + 0.3 * k, "ping", f"'{what}': job {k + 1} of 3, a triangle, a tone higher each time")
    # 7: the busboy
    for k in range(5):
        fx(cut_t(7) + f_(3 + 6 * k), step(), -15, -0.4 + 0.2 * k, "step" if k == 0 else "", "he walks the tub along the counter: five steps")
    fx(cut_t(7) + 0.05, rattle(0.8, R, density=26), -16, 0, "rattle", "dishes in the tub")
    # 8: the tower of cups
    fx(cut_t(8) + 0.03, rattle(0.5, R, density=34), -15, 0.2, "rattle", "nine cups on one tray"); fx(F(46), slide(500.0, 1100.0, 0.3), -13, 0.2, "step", "the tower leans")
    # 9, 10: the booth, the napkin
    fx(F(54, -12), step(), -14, 0, "step", "he points at the napkin")
    for k in range(3):
        fx(F(56, 9 * k), pen(), -12, -0.2 + 0.2 * k, "pen", ("a square", "its pins", "a cube")[k] + " on the napkin"); fx(F(56, 9 * k + 4), pen(), -13, 0.2)
    # 11: the sign at night
    fx(cut_t(11) + 0.02, hum(0.85, 120.0), -15, 0.2, "neon", "the sign hums"); fx(cut_t(11) + 0.02, crickets(0.85, R), -18, -0.3, "crickets", "night")
    # 12, 13: the coffee, the night
    fx(cut_t(12) + 0.1, pour(0.8), -13, 0.3, "pour", "the pot: coffee into a cup")
    for k in range(7):
        fx(F(67, 6 * k), clink(R), -15.5, -0.4 + 0.13 * k, "click" if k % 3 == 0 else "", "another cup on the table: fourteen in all")
    fx(F(69), step(), -14, 0.3, "step", "the engineers grin")
    ta, tb = F(73, -2), F(79, 10)
    for k in range(12):
        fx(ta + (tb - ta) * (k / 12) ** 0.8, tick(900.0), -14.5, 0.2, "tick" if k % 4 == 0 else "", "the clock on the wall runs through a night")
    fx(F(76), snore(0.7), -13, -0.2, "step", "nobody chases them out: they sag")
    # 14: the first chip
    fx(F(83, -2), creak(0.3, R, rate0=140, rate1=90), -14, 0.1, "creak", "the box tips"); fx(F(83, 7), thud(0.9), -9.5, 0.1, "thud", "the NV1 tips over on its table")
    # 15: out
    fx(cut_t(15) + 0.03, hum(1.7, 70.0), -17, -0.2, "belt", "the belt runs to the dock door")
    for k in range(8):
        fx(F(86) + (F(89, 6) - F(86)) * k / 8, tick(1500.0 + 70 * k), -15.5, 0.1, "tick" if k % 4 == 0 else "", "the counter runs up to 250,000")
    fx(F(89, 6), ding(1568.0, 0.6), -12, 0.2, "ping", "the counter stops: 250,000 OUT")
    # 16: back
    for k in range(7):
        fx(F(92, 15) + k * (F(98, 4) - F(92)) / 7, thud(0.7), -11.5, -0.4 + 0.13 * k, "thud", f"a returned box lands: {k + 1} of 7 that are heard")
    for k in range(8):
        fx(F(93) + (F(96, 6) - F(93)) * k / 8, tick(2000.0 - 70 * k), -15.5, -0.1, "tick" if k % 4 == 0 else "", "the counter runs up to 249,000")
    fx(F(92, 10), step(), -14, 0, "step", "the three of them duck"); fx(F(96, 6), buzz(0.3, 130.0), -11.5, 0, "buzzer", "the counter stops: 249,000 BACK")
    # 17: alive
    fx(F(100, -1), pop(520, 1040, 0.09), -12, 0, "pop", "a card: RIVA 128"); fx(F(100, -1), step(), -14, 0, "step", "a hop")
    # 18: the chip wakes
    fx(F(103, -2), zap(), -13, 0, "blip", "the die lights up; rings leave it"); fx(cut_t(18) + 0.03, hum(1.2, 180.0), -17, 0.2, "hum", "current")
    # 19, 20: the server hall, the chat window
    fx(cut_t(19) + 0.03, hum(2.8, 95.0), -17.5, 0, "fans", "the server hall")
    fx(F(108, -2), pop(520, 1040, 0.09), -12, 0, "pop", "a chat window opens in the aisle")
    for k in range(4):
        for j in range(3):
            fx(F(108, 7 + 6 * k + 2 * j), tick(2200.0 + 120 * j), -17, 0.2, "tick" if j == 0 else "", f"the answer is typed: line {k + 1} of 4")
    # 21, 22: the front page
    a = F(110, -2)
    fx(a, whoosh(0.5, R, peak=0.45, f_lo=400, f_hi=2400, tail=0.1), -14, 0, "paper", "the front page spins in"); fx(a + f_(15), thud(0.6), -10.5, 0, "thud", "it lands")
    fx(F(117, -1), tick(1700.0), -13, -0.3, "tick", "a pin in his photograph"); fx(F(117, 1), marker(0.28), -13, 0, "marker", "a red cord across the page"); fx(F(117, 9), tick(1900.0), -13, 0.3, "tick", "a pin in hers")
    # 23: the case board
    fx(F(124, 5), step(), -14, 0.3, "step", "the second official looks up")
    # 24: the memo
    for k in range(8):
        fx(cut_t(24) + 0.2 + 0.14 * k, click(), -18, 0.2)
    EVENTS.append((cut_t(24) + 0.2, "keys", "he types"))
    fx(F(134), click(), -15, 0.1, "click", "the last key: he stops")
    # 25: the staff
    S = F(135, 2)
    for k, d in enumerate((0, 4, 8, 12, 16)):
        fx(S + f_(d), blip(1320.0 * 2 ** (k / 12), 0.07), -13.5, -0.4 + 0.2 * k, "blip", f"mail: desk {k + 1} of 5")
    # 26: the board
    fx(F(144), gavel(), -11.5, 0, "clunk", "the directors have decided")
    # 27: the second front page
    a = cut_t(27)
    fx(a, whoosh(0.5, R, peak=0.45, f_lo=400, f_hi=2400, tail=0.1), -14, 0, "paper", "a second front page lands on the first"); fx(a + f_(15), thud(0.6), -10.5, 0, "thud", "it lands")
    # 28: the chart
    fx(F(157, -2), marker(0.45), -13, 0.2, "marker", "a yellow line from that box up to his"); fx(F(157, 11), ding(1318.0, 0.6), -13, 0, "ping", "the arrow reaches CEO")
    # 29: he leaves
    fx(F(165, -2), step(), -14, 0.3, "step", "he holds out his badge"); fx(F(165, -1), whoosh(0.3, R, peak=0.6, f_lo=400, f_hi=2400, tail=0.08), -14, 0.2, "throw", "the badge leaves his hand")
    fx(F(165, 8), knock(), -11, -0.1, "clunk", "the badge lands on the desk")
    # 30: the statement
    fx(cut_t(30) + f_(1), pop(480, 900, 0.07), -13, 0, "pop", "a magnifying glass on the press release")
    for k in range(4):
        fx(cut_t(30) + f_(6 + 6 * k), tick(2300.0), -16, -0.3 + 0.2 * k, "tick" if k == 0 else "", "the glass goes along the lines")
    fx(F(169, -2), buzz(0.2, 160.0), -12.5, 0, "buzzer", "a question mark in the glass: no reason is given")
    # 31: the third front page lands on the word "third"
    a = F(177, -12)
    fx(a, whoosh(0.5, R, peak=0.45, f_lo=400, f_hi=2400, tail=0.1), -14, 0, "paper", "a third front page lands on the two"); fx(a + f_(15), thud(0.6), -10.5, 0, "thud", "it lands")
    FLIGHTS.append((a, a + f_(15)))                                # the page is in the air for these 15 frames, turning over twice, mid-shot
    # 32-34: three statements
    for i, (w, d, who) in enumerate(((186, 0, "the spokesman points"), (196, -1, "the attorney general shrugs"), (200, -1, "he shrugs"))):
        fx(F(w, d), step(), -14, 0, "step", who)
    for i, t in enumerate((cut_t(32) + 0.25, cut_t(32) + 0.9, cut_t(33) + 0.3, cut_t(33) + 1.1, cut_t(33) + 1.9)):
        fx(t, shutter(), -15, 0.4 if i % 2 else -0.4, "shutter" if i in (0, 2) else "", "press cameras")
    # 35: the plaque
    fx(cut_t(35) + 0.2, ding(2349.0, 0.5), -14.5, -0.2, "ping", "light on the plaque"); fx(cut_t(35) + 0.75, ding(2794.0, 0.5), -15, 0.2)
    # 36: the crew
    fx(cut_t(36) + 0.03, breeze(2.4, R, level=0.8), -19, 0, "air", "outside the diner"); fx(cut_t(36) + 0.15, blip(990.0, 0.09), -12.5, -0.3, "blip", "the camera is recording")
    fx(F(213), step(), -14, 0.3, "step", "the reporter turns to the door")
    # 37: gone
    fx(F(217), knock(), -11, 0, "clunk", "four screw holes and a pale patch: a knock on a bare wall")
    # 39: the plaster
    fx(F(226), rip(0.3), -9.5, 0, "paper", "the plaster comes off the chip"); fx(F(226, 7), whoosh(0.45, R, peak=0.3, f_lo=500, f_hi=3000, tail=0.15), -14, 0.3, "throw", "and flies off")
    # 40, 41: the copier
    A, P = F(230, -2), F(236, -2)
    fx(A + 0.02, hum(1.3, 140.0), -15, 0.3, "copier", "the lamp goes to and fro under the lid")
    for k in range(2):
        fx(A + f_(30 * k + 2), blip(1760.0, 0.06), -15, -0.3, "blip", "a bar of light reads him, top to toe")
    for k in range(7):
        fx(P + f_(7 * k), printer(0.18), -13.5, 0.3, "paper", f"copy {k + 1} of 7 comes out: a scribble and a question mark")
    fx(P + f_(12), buzz(0.26, m2f(56)), -11.5, 0.2, "buzzer", "the first copy is held up: it is not him")   # G sharp: the root of the chord the strings hold there (it was a G)
    # 42: the empty chair
    fx(cut_t(42) + 0.03, knock(), -12, 0, "clunk", "a spotlight comes on over the empty chair")
    fx(F(242, 4), knock(), -12.5, -0.4, "clunk", "A, YES, IT'S THE CHIPS"); fx(F(243, 8), knock(), -12.5, 0.4, "clunk", "B, NO, IT WAS HIM")
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
# "creak" is in the list for the NV1: the box tips over between frames 775 and 782, fastest at 779 to 781, and its thud
# comes when it lands (782). With only the thud declared, the first render's check reported frame 780.
# A caption comes in 12 per cent large and settles over three frames (Captions.tsx). Everywhere else something in the picture
# moves more than that. Under "with another" (word 179) the third front page has landed and lies still, the camera creeps, and the
# caption is the only thing that moves: the check of the second cut's first render reported the caption's second and third frames
# (1763, 1764). Captions that begin with these words are declared for their three frames instead of one.
STILL_CAPTIONS = {179}
FLIGHTS: list[tuple[float, float]] = []                           # (from, to) in seconds: filled in by build_sfx, read by planned_changes
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ping", "click", "clunk", "paper", "step", "tick", "flap", "marker", "blip", "thud", "buzzer", "plane", "throw", "pen", "plate",
                  "creak"}


SOLO: set[int] = set()                                              # the same words Captions.tsx keeps on their own: none in this film


def planned_changes():
    """Frame ranges where the picture is meant to jump, for the render check: the frame a caption changes on, and the
    ten frames in which something that has a sound arrives (a stamp lands, a card pops, somebody hops, a key is
    pressed, a readout changes colour). Hard cuts are in the shot list. Everything else that jumps is a defect and
    gets reported."""
    out, caps, heads = [], [], []
    i = 0
    while i < len(WORDS):                                         # same grouping and timing as Captions.tsx
        a, b = WORDS[i], WORDS[i + 1] if i + 1 < len(WORDS) else None
        pair = bool(b) and not a["ends_sentence"] and not a["comma"] and i not in SOLO and b["start"] - a["end"] < 0.16 and len(a["word"]) + len(b["word"]) <= 15
        heads.append(i)
        i += 2 if pair else 1
        last, nxt = (b if pair else a), WORDS[i] if i < len(WORDS) else None
        caps.append((max(0.0, a["start"] - 0.03), nxt["start"] if nxt and nxt["start"] - last["end"] < 0.3 else last["end"] + 0.14))
    first = lambda t: int(np.ceil(t * FPS - 1e-9))                # first frame at or after time t
    for k, (start, end) in enumerate(caps):                       # a caption waits for the one before it to end
        on = first(max(start, caps[k - 1][1]) if k else start)
        out.append([on, on + 2] if heads[k] in STILL_CAPTIONS else [on, on])
        if k + 1 == len(caps) or caps[k + 1][0] > end:            # it goes away before the next one comes
            out.append([first(end), first(end)])
    for t, name, _ in EVENTS:
        if name in GRAPHIC_SOUNDS:
            f = jsround(t * FPS)
            out.append([f, f + 9])
    for t0, t1 in FLIGHTS:                                         # a move that lasts longer than the ten frames its sound declares
        out.append([jsround(t0 * FPS), jsround(t1 * FPS)])
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
    print("buses, LUFS before the mix (the hook, the boom):", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# Thirty-Three Years and Four Days: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
