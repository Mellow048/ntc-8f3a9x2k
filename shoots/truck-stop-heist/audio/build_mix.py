"""Soundtrack for the truck-stop heist short: narration + an original score + effects that follow the picture.

    python shoots/truck-stop-heist/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/truckstop/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: a caper in B minor, five in a bar (three and two) at 100 beats a minute: a plucked bass with a riff, brushes,
finger snaps and a tune on a vibraphone. The music takes part in the story. When the crew follows the truck, a second
plucked voice plays the bass's riff one beat behind it. At the truck stop the bass is left with a clock that ticks once
a beat; the driver in the bunk gets four notes of a lullaby on a music box; for the twenty-seven minutes the clock runs
away and the bass climbs by semitones, and all of it stops on "gone". The cold case is a bare fifth and one ping that
nobody answers, quieter with every year. When the case breaks, the pings answer each other going up, one for every
tower on the route. The law's side is in D major, the same notes heard brightly: the show, the plea agreement, the
investigation. "A different truck" is the caper a third too high on toy instruments. A hundred million is a kettledrum,
a tuba and a chord; eight point seven is one tick of wood and one high note; the two sounds come back for A and B. The
film ends on the tune's first four notes, which stop on the dominant.
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
from sfx_gen import whoosh, clink, rattle, vox, vowel_track, crickets, creak, bird_chirps  # noqa: E402

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
# Measured with word_margins below (the last line of the cue sheet's header) before the first render, as the playbook asks.
# Two reads far under what plays with them, both words the story needs: "eat" in "goes in to eat" (the read drops to -24.5 LUFS at
# the end of the sentence, where a plate arrives: 2.4 LU under the bed before this) and "deal" in "has a plea deal" (0.9 LU under).
WEAK_WORDS: dict[int, tuple[float, float]] = {75: (4.0, -3.0), 31: (2.5, -2.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "truckstop", "story.ts")).read()
# JavaScript's Math.round sends a half up; Python's round() sends it to the even number. A word that starts on exactly half
# a frame would put a cut one frame away from where the picture has it, and the render check would report an unplanned jump.
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)                # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
F = lambda i, d=0: (Wf(i) + d) / FPS                           # the time of "d frames after word i", as the picture counts it
TOTAL = jsround((WORDS[-1]["end"] + 1.55) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 46 and CUTS[0] == 0, CUTS
JOINS = {36, 37, 45}                                             # shots that carry on the take before them: not cuts
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))   # kit.ts smooth()

R = rng(20261113)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ small synth voices
def kick(vel=1.0):
    t = tt(0.3)
    y = np.sin(phase(48 + 90 * np.exp(-t / 0.024))) * np.exp(-t / 0.1)
    y += hp(R.standard_normal(len(t)), 1800) * np.exp(-t / 0.002) * 0.2
    return fades(y * vel, 0.0004, 0.04)


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


def hat(v=0.5):
    t = tt(0.05)
    return fades(hp(R.standard_normal(len(t)), 6500) * np.exp(-t / 0.011) * v, 0.0003, 0.01)


def clap():
    t = tt(0.16)
    y = sum(np.roll(bp(R.standard_normal(len(t)), 900, 3600) * np.exp(-t / 0.012), ns(0.011 * k)) for k in range(3))
    return fades(y + bp(R.standard_normal(len(t)), 900, 3600) * np.exp(-t / 0.05) * 0.5, 0.0005, 0.03)


def choir(notes, d, droop=None, swell=0.6):
    """a few voices singing "ah" on one chord. droop = (time, semitones): from there the pitch sags, all of them together"""
    n = ns(d)
    t = np.arange(n) / SR
    env = np.clip(t / swell, 0, 1) ** 1.5 * np.clip((d - t) / 0.06, 0, 1)
    forms = vowel_track(n, [(0, "o"), (min(0.6, d / 2), "a"), (d, "a")])
    out = np.zeros((2, n))
    for j, m in enumerate(notes):
        for v in range(2):
            f0 = I.m2f(m + (0.08 if v else -0.08)) * (1 + 0.006 * np.sin(TAU * (5.0 + 0.4 * v + 0.23 * j) * t + R.uniform(0, TAU)) * np.clip(t / 0.4, 0, 1))
            if droop:
                f0 = f0 * 2 ** (droop[1] / 12 * np.clip((t - droop[0]) / 0.5, 0, 1) ** 1.3)
            out += pan(vox(f0, forms, env, R, scale=1.15, breath=0.1), -0.6 + 1.2 * (2 * j + v) / (2 * len(notes) - 1))
    return out / (2 * len(notes))


_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


m2f = I.m2f
bassn = lambda m, d=0.7: cached(("bass", m, d), lambda: I.pluck(m2f(m), 0.85, R, d, 0.28, pos=0.22))
harp = lambda m, d=1.1: cached(("harp", m, d), lambda: I.pluck(m2f(m), 0.8, R, d, 0.72, pos=0.31))
glock = lambda m, d=1.0: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.7, R, d))
fife = lambda m, d: cached(("fife", m, round(d, 3)), lambda: I.fife(m2f(m), d, 0.7, R, rel=0.07))
chipn = lambda m, d=0.2: cached(("chip", m, d), lambda: chip(m, d))
subn = lambda m, d=0.34: cached(("sub", m, d), lambda: synth_bass(m, d))


# ------------------------------------------------------------------------------------------------ music
# Five in a bar, counted three and two, at 100 beats a minute, in B minor. (The other six news films are in A minor at 112,
# D minor at 104, G major / E minor at 118, C minor swung at 130, all four in a bar; F sharp minor at 174, three in a bar; and
# G minor / B flat major at 72, six quavers in a bar. This one shares no key, no tempo and no metre with them.)
# Bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so they are kept
# modest and the level is carried by what a phone does play (the vibraphone, the brushes, the plucked follower, the pings).
BPM = 100.0
BEAT = 60.0 / BPM
E8 = BEAT / 2
BAR = 5 * BEAT
KICK, BASS_MIX = 0.5, 0.7
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
# the caper: B minor, B minor, G, F sharp seven. The bass riff, in ten quavers: (quaver, semitones above the root, weight)
CHORDS = [(47, "m"), (47, "m"), (43, "M"), (42, "7")]
RIFF = {"m": [(0, 0, 1.0), (2, 12, 0.5), (3, 3, 0.8), (5, 5, 0.8), (6, 7, 1.0), (8, 10, 0.7), (9, 7, 0.6)],
        "M": [(0, 0, 1.0), (2, 12, 0.5), (3, 4, 0.8), (5, 5, 0.8), (6, 7, 1.0), (8, 9, 0.7), (9, 7, 0.6)],
        "7": [(0, 0, 1.0), (2, 12, 0.5), (3, 4, 0.8), (5, 5, 0.8), (6, 7, 1.0), (8, 10, 0.7), (9, 4, 0.6)]}
# the caper's tune on the vibraphone, bar by bar: (quaver, note, quavers)
TUNE = [
    [(0, 78, 3), (3, 74, 1), (4, 76, 1), (5, 78, 3), (8, 83, 2)],
    [(0, 81, 2), (2, 78, 1), (3, 76, 2), (5, 74, 1), (6, 73, 1), (7, 74, 1), (8, 71, 2)],
    [(0, 79, 3), (3, 74, 1), (4, 76, 1), (5, 79, 3), (8, 83, 2)],
    [(0, 82, 2), (2, 78, 1), (3, 76, 2), (5, 73, 1), (6, 70, 1), (7, 73, 1), (8, 78, 2)],
]
vibe = lambda m, d=1.2: cached(("vibe", m, round(d, 2)), lambda: I.vibes(m2f(m), 0.6, R, d))
mbox = lambda m, d=1.4: cached(("mbox", m, round(d, 2)), lambda: I.musicbox(m2f(m), 0.6, R, d))


def sonar(m, d=1.5):
    """a ping: one pure note with a soft start and two echoes, each quieter. The sound of a phone finding a tower."""
    f, t = m2f(m), tt(d)
    one = (np.sin(TAU * f * t) + 0.18 * np.sin(TAU * 2 * f * t)) * np.exp(-t / 0.22) * np.clip(t / 0.004, 0, 1)
    y = one.copy()
    for k, g in ((1, 0.42), (2, 0.18)):
        n = ns(0.27 * k)
        y[n:] += g * one[: len(one) - n]
    return fades(y, 0.001, 0.05)


pingn = lambda m: cached(("sonar", m), lambda: sonar(m))


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def caper_bar(t0, k, level, tune=None, until=None, tail=False, start=0):
    """one bar of the caper, bar k of its four. level 1 = the plucked bass, 2 = + brushes, 3 = + a kick on one and four and a
    snap on three and five. tune = the bar of the tune the vibraphone plays. tail = a second plucked voice plays the bass's
    riff two octaves up and one beat late: somebody is following. start = first quaver played (to begin in the middle of a bar)."""
    live = lambda t: until is None or t < until - 0.03
    root, kind = CHORDS[k % 4]
    for q, iv, g in RIFF[kind]:
        t = t0 + q * E8
        if q < start or not live(t):
            continue
        put("bass", bassn(root + iv, 0.6 if q in (0, 6) else 0.36), t, g)
        if tail and live(t + BEAT):
            put("lead", harp(root + iv + 24, 0.7), t + BEAT, 0.42 * g, 0.4)
    if level >= 2:
        for q in range(start, 10):
            if live(t0 + q * E8):
                put("drums", I.brush(0.55 if q in (0, 6) else 0.3, R, 0.3, swish=q in (0, 6)), t0 + q * E8, 1.0, 0.25 if q % 2 else -0.25)
    if level >= 3:
        for q in (0, 6):
            if q >= start and live(t0 + q * E8):
                put("drums", kick(KICK), t0 + q * E8)
        for q in (4, 8):
            if q >= start and live(t0 + q * E8):
                put("drums", clap(), t0 + q * E8, 0.3, 0.15)
    if tune is not None:
        for q, m, n in TUNE[tune]:
            if q >= start and live(t0 + q * E8):
                put("lead", vibe(m, 0.5 + 0.3 * n), t0 + q * E8, 0.5, -0.15)


def build_music():
    def thin(t0, t1, notes, g=0.13, warm=3000.0, att=0.35, rel=0.5):
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=att, rel=rel, warm=warm), t0, g)

    def rolled(t, notes, g=0.5, gap=0.022, voice=harp):
        for j, m in enumerate(notes):
            put("comp", voice(m, 1.3), t + gap * j, g, -0.3 + 0.6 * j / max(1, len(notes) - 1))

    def sparkle(t0, t1, notes, step=E8, g=0.26):
        """the show's music: a glockenspiel and a music box go up and down one chord"""
        n = 0
        while t0 + n * step < t1 - 0.05:
            m = notes[n % len(notes)]
            put("lead", glock(m, 0.9), t0 + n * step, g, -0.3 + 0.6 * ((n * 3) % 5) / 4)
            put("lead", mbox(m - 12, 1.2), t0 + n * step, g * 0.8, 0.2)
            n += 1

    def heavy(t, g=1.0):
        """what a hundred million weighs: a kettledrum, a tuba, a chord on the vibraphone, a glint on top"""
        put("hits", I.timpani(m2f(35), 0.95, R, 1.8), t, 1.0 * g)
        put("hits", I.brass(m2f(35), 0.9, 0.85, R, "tuba"), t, 0.5 * g)
        rolled(t, (59, 62, 66, 73), 0.5 * g, 0.018, vibe)
        put("lead", glock(90, 1.4), t + 0.08, 0.2 * g, 0.3)

    def light(t, g=1.0):
        """what a form weighs: one tick of wood and one high note of the music box"""
        put("hits", I.triangle(0.4, R, 0.5, f=2100.0), t, 0.5 * g, 0.3)
        put("lead", mbox(95, 0.9), t, 0.5 * g, 0.3)

    # ---- 1: the hook. The caper at full strength from the first frame: bass, brushes, snaps and the tune.
    a1 = cut_t(4) - 0.04
    n = 0
    while n * BAR < a1 - 0.05:
        caper_bar(n * BAR, n, 3, tune=n, until=a1)
        n += 1
    put("hits", I.cymbal(0.3, R, 1.0), 0.0, 0.25)
    EVENTS.append((0.0, "music in", f"the caper, in B minor, five in a bar at {BPM:.0f} beats a minute: a plucked bass, brushes, finger snaps, the tune on a vibraphone"))
    put("drums", I.snare(0.7, R, 0.25, snappy=0.6), a1, 0.6)
    EVENTS.append((a1, "music cut dead", "one snare stroke on the cut to the seven: 'Now one of the accused has a plea deal'"))
    #         the deal: one chord that waits, and a bright note for the stamp
    thin(a1 + 0.05, cut_t(6) - 0.05, (62, 66, 69, 76), 0.36, 2600.0, 0.15, 0.3)
    put("lead", glock(86, 1.2), F(30), 0.3, 0.2); put("hits", I.triangle(0.45, R, 0.9), F(30), 0.5, 0.3)
    EVENTS.append((a1 + 0.05, "held chord", "D major with a ninth under the plea agreement: the law's side of the story is in the major"))

    # ---- 2: the show. D major, the caper's own notes heard brightly: a glockenspiel and a music box, a pedal D under the truck.
    b0, b1 = cut_t(6), F(47)
    sparkle(b0, b1 - 0.02, (74, 78, 81, 86, 81, 78))
    thin(b0, cut_t(9) + 0.3, (50, 57, 62, 66), 0.3, 1800.0, 0.2, 0.4)
    for j in range(4):
        put("bass", bassn(38, 0.8), cut_t(7) + j * BEAT, 0.8)
    rolled(b1, (74, 78, 81, 86, 90), 0.55); put("hits", I.triangle(0.5, R, 1.2), b1, 0.6, -0.3)
    EVENTS.append((b0, "the show", "D major: a glockenspiel and a music box up and down one chord, a low D when the truck pulls out"))
    EVENTS.append((b1, "harp chord", "'seventy-three': the chord, rolled, on the stamp"))

    # ---- 3: the tail. The bass's riff again, and a second voice that plays it one beat behind, two octaves up.
    c0, c1 = cut_t(10), cut_t(12) - 0.04
    caper_bar(c0, 0, 2, until=c1, tail=True)
    EVENTS.append((c0, "the bass, followed", "'a crew followed it': the riff, and the same riff one beat late on a second plucked voice"))

    # ---- 4: two in the morning. The bass alone on one and four, and a clock: one tick a beat.
    d0, d1 = cut_t(12), cut_t(16)
    n = 0
    while d0 + n * BEAT < d1 - 0.05:
        t = d0 + n * BEAT
        put("drums", I.triangle(0.3, R, 0.12, f=1700.0), t, 0.55, 0.3 if n % 2 else -0.3)
        if n % 5 in (0, 3):
            put("bass", bassn(47 if n % 5 == 0 else 54, 0.9), t, 0.9)
        n += 1
    thin(d0, d1, (59, 66), 0.16, 2200.0, 0.4, 0.3)
    rolled(cut_t(14) + 0.05, (62, 66, 69, 71), 0.42, 0.03, vibe)
    lull = cut_t(15) + 0.12
    for j, m in enumerate((78, 81, 78, 74)):
        put("lead", mbox(m, 1.3), lull + j * BEAT * 0.56, 0.5, 0.25)
    EVENTS.append((d0, "a clock and a bass", "2:05 a.m.: one tick on every beat, the bass on one and four"))
    EVENTS.append((cut_t(14) + 0.05, "vibraphone chord", "the diner: D with a sixth, warm"))
    EVENTS.append((lull, "music box", "four notes of a lullaby for the driver in the bunk"))

    # ---- 5: twenty-seven minutes. The clock runs away, the bass climbs a semitone at a time, and everything stops on "gone".
    e0, e1, e2 = cut_t(16), F(89), F(94)
    n = 0
    while e0 + n * E8 / 2 < e1 - 0.03:
        t = e0 + n * E8 / 2
        put("drums", I.triangle(0.3, R, 0.08, f=1700.0 + 25 * n), t, 0.5, 0.3 if n % 2 else -0.3)
        if n % 2 == 0:
            put("bass", bassn(47 + n // 2, 0.36), t, 0.85)
        n += 1
    put("hits", I.cymbal(0.4, R, 0.5), e1, 0.4)
    for j, (m, q) in enumerate(((78, 0), (74, 1.5), (76, 2.5), (78, 3.5))):
        put("lead", vibe(m, 0.8), e1 + 0.12 + q * (e2 - e1 - 0.2) / 4.5, 0.55, -0.15)
    put("hits", I.timpani(m2f(35), 0.9, R, 1.6), e2, 0.9); put("bass", bassn(35, 1.2), e2, 1.0)
    EVENTS.append((e0, "the clock runs away", "'twenty-seven minutes later': ticks twice as fast and the bass climbing by semitones"))
    EVENTS.append((e1, "the tune's first four notes", "under 'twenty-four bags are gone', on the vibraphone alone"))
    EVENTS.append((e2, "kettledrum, and nothing", "a low B on 'gone'"))

    # ---- 6: the cold case. A bare fifth, held, and one ping that nobody answers: each time a year goes by it is quieter.
    f0, f1 = F(94) + 0.25, cut_t(21)
    thin(f0, f1 + 0.2, (47, 54, 59), 0.3, 1500.0, 0.5, 0.4)
    for j, t in enumerate((cut_t(19) + 1 / FPS, F(96, 2), F(97, 3), F(98, 3))):
        put("lead", pingn(90), t, 0.5 * 0.72 ** j, 0.3 - 0.2 * j)
    put("bass", bassn(35, 1.4), F(99), 0.9)
    EVENTS.append((f0, "a bare fifth", "nearly three years: B and F sharp, neither major nor minor"))
    EVENTS.append((cut_t(19) + 1 / FPS, "a ping, four times", "one note with two echoes for each year on the calendar, quieter every time"))

    # ---- 7: the break. A major chord when the light comes on; then the pings answer each other, going up, over a new bass.
    g0, g1 = cut_t(21), cut_t(25) - 0.04
    rolled(g0 + 2 / FPS, (62, 66, 69, 74, 78), 0.6, 0.03, vibe); put("lead", glock(86, 1.3), g0 + 2 / FPS, 0.25, 0.2)
    thin(g0 + 0.1, cut_t(23), (50, 57, 62, 66), 0.3, 2000.0, 0.2, 0.4)
    n = 0
    while cut_t(22) + n * E8 < g1 - 0.05:
        t, q = cut_t(22) + n * E8, n % 10
        if q in (0, 3, 6, 8):
            put("bass", bassn(38 if q in (0, 6) else 45, 0.5), t, 0.85)
        put("drums", I.brush(0.5 if q in (0, 6) else 0.28, R, 0.3, swish=q in (0, 6)), t, 0.9, 0.25 if n % 2 else -0.25)
        n += 1
    row = [(cut_t(23) + 2 / FPS, 78), (cut_t(23) + 7 / FPS, 81)] + [(cut_t(24) + k / FPS, m) for k, m in ((0, 83), (3, 86), (8, 88), (12, 90), (16, 93), (22, 95))]
    for j, (t, m) in enumerate(row):
        put("lead", pingn(m), t, 0.46, -0.4 + 0.8 * j / (len(row) - 1))
    EVENTS.append((g0 + 2 / FPS, "vibraphone chord", "'The break': D major when the lamp comes on over the box"))
    EVENTS.append((cut_t(22), "a new bass", "the investigation: D and A, three and two, with brushes"))
    EVENTS.append((cut_t(23) + 2 / FPS, "pings, going up", "two for the phones, then one for every tower on the route as it lights: B, D, E, F sharp, A, B"))

    # ---- 8: the collision. The bass on tiptoe, coming down; a note for every digit; a horn that droops; a rimshot.
    h0, h1 = cut_t(25), cut_t(28) - 0.04
    for j, m in enumerate((59, 57, 55, 54, 52, 50)):
        if h0 + j * BEAT < F(121):
            put("bass", bassn(m - 12, 0.5), h0 + j * BEAT, 0.9); put("lead", harp(m + 12, 0.5), h0 + j * BEAT, 0.3, 0.3)
    for j, m in enumerate((74, 76, 73, 71, 78, 78, 78)):                  # 2, 4, 1, 0, 5, 5, 5: the last digit leaves first
        put("lead", vibe(m, 0.5), F(122, 4 * j), 0.5, -0.3 + 0.1 * j)
    thin(F(127), cut_t(27), (59, 62, 66, 69), 0.26, 2400.0, 0.2, 0.3)
    put("hits", I.brass(m2f(57), 0.5, 0.7, R, "horn", fall=-3.0), F(132), 0.5)
    put("drums", I.snare(0.6, R, 0.2, snappy=0.5), F(135) + 0.42, 0.55); put("drums", kick(KICK), F(135) + 0.42)
    EVENTS.append((h0, "the bass on tiptoe", "'one of the crew': one note a beat, coming down, a harp an octave above"))
    EVENTS.append((F(122), "seven notes", "one for each digit of the number as it crosses to the officer's pad"))
    EVENTS.append((F(132), "a horn that droops", "'a witness'"))
    EVENTS.append((F(135) + 0.42, "rimshot", "after 'a crash'"))

    # ---- 9: seven charged: seven notes up the scale, one a man. Then an airport: three steps of the bass and a stop.
    i0 = cut_t(28)
    for j, m in enumerate((59, 61, 62, 64, 66, 67, 69)):
        t = i0 + (2 + 3 * j) / FPS
        put("lead", vibe(m + 12, 0.6), t, 0.5, -0.45 + 0.15 * j); put("bass", bassn(m - 12, 0.4), t, 0.7); put("drums", I.snare(0.35 + 0.05 * j, R, 0.16, snappy=0.4), t, 0.4)
    put("hits", I.cymbal(0.4, R, 1.2), i0 + 23 / FPS, 0.4); put("lead", vibe(83, 1.4), i0 + 23 / FPS, 0.6); put("bass", bassn(35, 1.0), i0 + 23 / FPS, 0.9)
    thin(i0 + 0.8, cut_t(29), (59, 62, 66), 0.2, 2200.0, 0.2, 0.2)
    j0 = cut_t(29)
    for j, m in enumerate((47, 50, 52)):
        if j0 + 0.06 + j * E8 < F(142, -2) - 0.05:
            put("bass", bassn(m, 0.36), j0 + 0.06 + j * E8, 0.9); put("drums", I.brush(0.4, R, 0.3), j0 + 0.06 + j * E8, 0.9)
    put("drums", I.snare(0.7, R, 0.22, snappy=0.6), F(142, -2), 0.6); put("drums", kick(KICK), F(142, -2))
    thin(F(142), cut_t(30), (54, 59, 61, 66), 0.32, 2200.0, 0.15, 0.3)
    EVENTS.append((i0 + 2 / FPS, "seven notes up the scale", "'Seven men were charged': one note and one snare stroke as each of them is lit, B to A, and the octave on the last"))
    EVENTS.append((F(142, -2), "snare, and a held chord", "'stopped': the bass had taken three steps"))

    # ---- 10: the deal. A chord under the page; then the caper in the wrong key on toy instruments: a different truck.
    k0, k1, k2 = cut_t(30), cut_t(31), cut_t(33) - 0.04
    thin(k0, k1, (62, 66, 69, 76), 0.34, 2600.0, 0.2, 0.3)
    for q, iv, g in RIFF["m"]:
        t = k1 + q * E8
        if t < k2 - 0.03:
            put("comp", harp(50 + iv + 12, 0.6), t, 0.5 * g, -0.2)
    for q, m, n in TUNE[0]:
        if k1 + q * E8 < k2 - 0.03:
            put("lead", mbox(m + 3, 0.5 + 0.3 * n), k1 + q * E8, 0.55, 0.2)
    EVENTS.append((k0, "held chord", "the plea agreement: the same D major as in the first seconds"))
    EVENTS.append((k1, "the caper, a third too high, on toys", "'a different truck': the riff on a harp and the tune on a music box, in D minor"))

    # ---- 11: the same deal. The chord again, and on "the jewel heist" the real tune, in its own key, with everything.
    l0, l1 = cut_t(33), cut_t(34)
    thin(l0, l1, (62, 66, 69, 76), 0.3, 2600.0, 0.2, 0.25)
    caper_bar(l1, 0, 3, tune=0, until=cut_t(35) - 0.04)
    put("hits", I.cymbal(0.4, R, 1.0), F(170), 0.35)
    EVENTS.append((l1, "the caper, as it was", "'the jewel heist': bass, brushes, snaps and the tune in B minor, less than half a bar of it"))

    # ---- 12: where the seven are. The bass keeps walking; three notes for three pleas, two for two outlines, one for one man gone.
    m0, m1 = cut_t(35), cut_t(38) - 0.04
    n = 0
    while m0 + n * BAR < m1 - 0.05:
        caper_bar(m0 + n * BAR, n, 2 if n == 0 else 1, until=m1)
        n += 1
    for j, m in enumerate((71, 74, 78)):
        put("lead", vibe(m, 0.9), F(175, -2 + 4 * j), 0.55, -0.3 + 0.3 * j)
    for j, m in enumerate((67, 71)):
        put("lead", harp(m + 12, 0.9), F(180, -2 + 4 * j), 0.5, -0.2 + 0.4 * j)
    put("lead", mbox(78, 1.6), F(184, -2), 0.6, 0.3)
    EVENTS.append((m0, "the bass walks on", "one take over the seven: the riff, quieter"))
    EVENTS.append((F(175, -2), "three notes, two notes, one note", "a vibraphone for each plea of not guilty, a harp for each man never arrested, a music box for the one deported"))

    # ---- 13: the courtroom. One chord, and a horn that says "oh" twice, the second time lower.
    o0, o1 = cut_t(38), cut_t(39) - 0.04
    thin(o0, o1, (55, 59, 62, 69), 0.3, 2000.0, 0.2, 0.3)
    put("hits", I.brass(m2f(64), 0.3, 0.7, R, "horn", fall=-2.0), F(190), 0.5); put("hits", I.brass(m2f(61), 0.55, 0.7, R, "horn", fall=-4.0), F(191), 0.5)
    put("bass", bassn(43, 1.0), o0, 0.8)
    EVENTS.append((o0, "held chord", "G with a ninth: the prosecutor reads, then looks up"))
    EVENTS.append((F(190), "two notes on a horn", "'didn't know': E, then C sharp, each one drooping"))

    # ---- 14: the jewelers. The show's music, in the minor and at half the pace.
    p0, p1 = cut_t(39), cut_t(41) - 0.04
    sparkle(p0 + 0.1, p1, (83, 86, 90, 86), BEAT, 0.24)
    thin(p0, p1 + 0.1, (47, 54, 59, 62), 0.3, 1700.0, 0.3, 0.3)
    EVENTS.append((p0, "the show, in the minor", "'still missing': the glockenspiel and the music box, one note a beat, B minor"))

    # ---- 15, 16: the two numbers. A hundred million is heavy; eight point seven is one tick of wood.
    A, B = F(205, 6), F(212, 8)
    heavy(A)
    thin(A + 0.1, cut_t(42), (47, 54, 59, 62), 0.22, 1700.0, 0.2, 0.3)
    q0 = cut_t(42)
    for j, m in enumerate((59, 57, 54)):
        put("bass", bassn(m - 12, 0.5), q0 + 0.1 + j * BEAT, 0.9); put("lead", harp(m + 12, 0.5), q0 + 0.1 + j * BEAT, 0.3, 0.3)
    thin(q0, cut_t(44), (54, 61, 66), 0.2, 2400.0, 0.3, 0.3)
    light(B)
    EVENTS.append((A, "kettledrum, tuba, a chord", "'a hundred million dollars': the jewels land on the pan"))
    EVENTS.append((q0 + 0.1, "the bass on tiptoe", "'Brink's says they declared': three notes"))
    EVENTS.append((B, "one tick and one high note", "'eight point seven million': the form lands on the other pan"))

    # ---- 17: the question. The dominant hangs; the heavy sound for A, the light one for B; the tune's first notes, unfinished.
    z0, za, zb = cut_t(44), F(222, -2), F(227, -2)
    thin(z0, DUR + 0.5, (42, 54, 59, 61, 64), 0.36, 1700.0, 0.35, 0.8)
    n = 0
    while z0 + n * E8 < za - 0.05:
        put("comp", harp((66, 71, 73, 76, 73, 71)[n % 6], 0.9), z0 + n * E8, 0.32, -0.3 + 0.12 * (n % 6))
        if n % 5 == 0:
            put("bass", bassn(42, 0.8), z0 + n * E8, 0.85)
        n += 1
    heavy(za, 0.8); light(zb, 1.1)
    e = WORDS[-1]["end"] + 0.2
    for j, (m, d) in enumerate(((78, 0.0), (74, 0.45), (76, 0.75), (78, 1.05))):
        put("lead", vibe(m, 1.6 if j == 3 else 0.6), e + d * 0.8, 0.55, -0.15)
    put("bass", bassn(42, 1.2), e + 1.05 * 0.8, 0.85); rolled(e + 1.05 * 0.8, (54, 58, 61, 64), 0.4)
    EVENTS.append((z0, "harp on the dominant", "F sharp with a fourth and a seventh: the question is coming"))
    EVENTS.append((za, "the heavy sound", "A, 'what they lost': the kettledrum and the chord of the hundred million"))
    EVENTS.append((zb, "the light sound", "B, 'what they declared': the tick and the high note of the form"))
    EVENTS.append((e, "button", "the tune's first four notes on the vibraphone, stopping on F sharp over the dominant: it does not come home"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 11, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, : ns(cut_t(4))]), integrated(v[:, ns(cut_t(22)): ns(cut_t(28))])) for k, v in BUS.items()}
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


def crackle(d, rate=45.0):
    y = np.zeros(ns(d))
    for _ in range(int(d * rate)):
        i = R.integers(0, len(y) - 400)
        c = hp(R.standard_normal(300), 2000) * np.exp(-np.arange(300) / R.uniform(8, 40))
        y[i: i + 300] += c * R.uniform(0.3, 1.0)
    return y


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


def ratchet(n=5):
    """a fishing reel: a few teeth of a ratchet"""
    y = np.zeros(ns(0.05 * n + 0.06))
    for k in range(n):
        c = tick(2900 + 150 * k)
        i = ns(0.012 + k * (0.05 - 0.002 * k))
        y[i: i + len(c)] += c
    return y


def clang():
    """a heavy switch hitting its stop"""
    t = tt(0.4)
    y = modal(0.4, [(196, 1.0, 0.12), (447, 0.8, 0.09), (811, 0.6, 0.07), (1270, 0.45, 0.05), (2130, 0.3, 0.03)], R) + lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.012) * 1.2
    return fades(y, 0.0004, 0.08)


def siren(d, rate=3.3, lo=660.0, hi=1180.0, bend=0.0):
    """an ambulance: a fast rising yelp. bend = how far the pitch falls over the sound (it drives past)"""
    t = tt(d)
    saw = (t * rate) % 1.0
    f = (lo + (hi - lo) * np.where(saw < 0.72, saw / 0.72, (1 - saw) / 0.28)) * (1 + bend * (0.5 - t / d))
    ph = phase(f)
    return fades(lp(np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph), 3400), 0.03, 0.1)


def engine(d, f0=70.0, f1=110.0):
    """a van's engine and its tyres"""
    t = tt(d)
    ph = phase(f0 + (f1 - f0) * (t / d))
    y = np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.5 + lp(R.standard_normal(len(t)), 500) * 0.6
    return fades(lp(y, 900), 0.05, 0.12)


def talk(d, f0=118.0, rate=6.5, robot=True):
    """a voice with no words in it: syllables on changing vowels. robot = a dead-level pitch through a small speaker (the
    screens); otherwise a shout with a rising and falling pitch, clipped, through a horn (the megaphone)"""
    n = ns(d)
    t = np.arange(n) / SR
    k = int(d * rate) + 2
    names = [("a", "e", "o", "i", "ae", "u", "E")[int(R.integers(0, 7))] for _ in range(k)]
    forms = vowel_track(n, [(j / rate, v) for j, v in enumerate(names)])
    amp = (0.5 - 0.5 * np.cos(TAU * rate * t)) ** 0.7
    if robot:
        y = vox(np.full(n, f0), forms, amp, R, breath=0.04, jitter=0.0) * (0.6 + 0.4 * np.sign(np.sin(TAU * 55 * t)))
        return fades(bp(y, 500, 3000), 0.01, 0.04)
    y = vox(f0 * (1 + 0.16 * np.sin(TAU * 1.4 * t) + 0.1 * np.sin(TAU * rate / 2 * t)), forms, amp, R, breath=0.2)
    return fades(bp(np.tanh(2.5 * y / (np.max(np.abs(y)) + 1e-9)), 750, 2700), 0.01, 0.04)


def klaxon(d, f1=932.0, f2=698.0, rate=4.0):
    """an alarm: two notes turn about"""
    t = tt(d)
    ph = phase(np.where(np.sin(TAU * rate / 2 * t) >= 0, f1, f2))
    y = (np.sin(ph) + 0.5 * np.sign(np.sin(ph))) * (0.5 - 0.5 * np.cos(TAU * rate * t)) ** 0.3
    return fades(lp(y, 3000), 0.01, 0.03)


def register():
    """a cash register: the drawer's clack and its bell"""
    y = np.zeros(ns(0.7))
    for x, at, g in ((click(), 0.0, 1.0), (knock(), 0.03, 0.6), (ding(2093, 0.5), 0.07, 0.9), (ding(2637, 0.6), 0.075, 0.6)):
        i = ns(at); y[i: i + len(x)] += x[: len(y) - i] * g
    return y


def bell(f=196.0, d=2.6):
    """a tower bell, a long way off"""
    return fades(modal(d, [(f * 0.5, 0.5, 2.2), (f, 1.0, 1.8), (f * 1.19, 0.7, 1.3), (f * 1.5, 0.4, 1.0), (f * 2.0, 0.8, 0.9), (f * 2.51, 0.3, 0.6), (f * 3.01, 0.25, 0.45), (f * 4.1, 0.15, 0.3)], R), 0.002, 0.4)


def chirp():
    """a small bird: three quick notes"""
    y = np.zeros(ns(0.32))
    for j in range(3):
        c = pop(3100 + 500 * j, 4700 + 300 * j, 0.06)
        i = ns(0.1 * j); y[i: i + len(c)] += c
    return y


def scrape(d=0.28):
    """a wooden crate pushed across a floor"""
    t = tt(d)
    return fades(bp(R.standard_normal(len(t)), 250, 1600) * (0.3 + 0.7 * t / d) * (0.7 + 0.3 * np.sin(TAU * 23 * t)), 0.02, 0.02)


def rumble(d):
    """the ground, before it goes: low noise that grows"""
    t = tt(d)
    y = lp(R.standard_normal(len(t)), 110) * 2.0 + bp(R.standard_normal(len(t)), 110, 420) * 0.5
    return fades(y * (0.15 + 0.85 * (t / d) ** 1.8), 0.2, 0.1)


def snore(d=0.8):
    """somebody asleep: one long breath in through the nose"""
    t = tt(d)
    return fades(lp(R.standard_normal(len(t)), 420) * np.sin(np.pi * t / d) ** 2 * (0.6 + 0.4 * np.sin(TAU * 31 * t)), 0.03, 0.08)


def keytone(lo, hi, d=0.07):
    """one key of a telephone: two pure notes together"""
    t = tt(d)
    return fades(np.sin(TAU * lo * t) + np.sin(TAU * hi * t), 0.003, 0.012)


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

    f_ = lambda n: n / FPS
    # Every cut gets a small swish, alternating sides. None where the camera carries straight on (the three joins).
    for i in range(1, len(CUTS)):
        if i in JOINS:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(JOINS)} cuts, alternating left and right; none on the {len(JOINS)} joins inside a take"))

    stamps = [(F(3), "$100 MILLION"), (F(13), "27 MINUTES"), (F(30), "PLEA DEAL"), (F(47), "73 BAGS"), (F(57), "ABOUT 300 MILES"), (F(83, 2), "27 MINUTES"), (F(91), "24 OF 73 BAGS"),
              (F(99, 2), "NOBODY CHARGED"), (F(136, 2), "7 CHARGED"), (F(158), "A DIFFERENT TRUCK"), (F(162, -2), "$57,377 OF AIRTAGS"), (F(170), "ADMITS THE HEIST")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(F(6), "'approximately $100 million', U.S. Attorney's Office"), (F(10), "'the largest jewelry heist in U.S. history'"), (F(11, 3), "U.S. Attorney's Office, Los Angeles"),
            (F(16), "one went in 'to get a meal', L.A. Times"), (F(20), "the other was asleep in the cab, L.A. Times"), (F(24), "seven men were charged in June 2025"),
            (F(31, 5), "not entered yet: plea hearing Nov. 19, 2026"), (F(36), "name tag: a Brink's big rig, left about 8:25 p.m."), (F(44), "San Mateo, California, July 10, 2022"),
            (F(48), "the indictment"), (F(50), "alleged in the indictment, June 2025"), (F(59), "'approximately 300 miles', U.S. Attorney's Office"), (F(62), "2:05 a.m., July 11, 2022, L.A. Times"),
            (F(66), "Lebec, 70 miles north of Los Angeles"), (F(71), "both drivers are drawn as nobody in particular"), (F(77), "the indictment mentions no weapon here, L.A. Times"),
            (F(84, 4), "2:05 to 2:32 a.m., L.A. Times"), (F(87), "'its rear lock had been cut away', L.A. Times"), (F(93), "the indictment and the plea agreement"), (F(100, 4), "July 2022 to June 2025"),
            (F(103), "a break in the case"), (F(106), "'according to two people involved with the case'"), (cut_t(23), "tab: AS THE L.A. TIMES REPORTS"), (F(109), "phones connecting to towers"),
            (F(113), "along the truck's route, San Mateo to Lebec"), (F(122), "'the number of his burner phone'"), (F(128), "the night before the heist"), (F(131), "'he witnessed a traffic collision'"),
            (F(133), "the Times does not say which of them"), (F(138), "indictment unsealed June 17, 2025"), (F(139), "'presumed to be innocent' until proven guilty"), (F(143), "Panama City, July 1, 2025"),
            (F(145), "on a layover to Ecuador, the plea agreement"), (F(150), "his name, as the court papers give it"), (F(152), "his lawyer declined to comment, L.A. Times"), (F(159, 2), "Fontana, Calif., March 11, 2022"),
            (F(162, 8), "taken 'by force and threat of force'"), (F(162, 16), "one count of robbery, up to 20 years"), (F(164), "the same agreement"), (F(171, 3), "the other counts are to be dropped, CNS"),
            (F(173), "their trial is set for March 2027"), (F(179), "as of Nov. 2026, L.A. Times"), (F(183), "to Ecuador, late Dec. 2025, L.A. Times"), (F(188), "a prosecutor's filing: 'genuine surprise'"),
            (F(190), "they still hope to try him, L.A. Times"), (F(193), "'still unrecovered', L.A. Times, Jan. 2026"), (F(196), "14 jewelers, some have left the trade"), (F(200), "the jewelers' lawsuit against Brink's"),
            (F(206), "prosecutors: 'at least $100,312,031.54', CNS"), (F(208), "name tag: Brink's, its own lawsuit"), (F(213), "'declared total value of $8.7 million', L.A. Times"),
            (F(215), "the man with the deal: under $10 million, CNS"), (F(217), "WHICH NUMBER COUNTS?"), (F(219, 4), "a legal battle since 2022, L.A. Times")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)
    for t, why in [(F(32, 1), "July 10, 2022"), (cut_t(19) + f_(1), "2022"), (F(96, 2), "2023"), (F(97, 3), "2024"), (F(98, 3), "2025"), (F(148, 1), "Nov. 9, 2026")]:
        fx(t, paper(), -12.5, -0.3, "flap", "calendar leaf: " + why)
    for t, why in [(F(107), "the newspaper's headline"), (F(153), "'interference with commerce by robbery'"), (F(168), "'stole 24 bags'"), (F(211), "DECLARED VALUE")]:
        fx(t, marker(), -13.5, -0.1, "marker", why)
    for i, why in [(5, "the plea agreement"), (22, "the newspaper"), (26, "the officer's pad"), (30, "the plea agreement"), (33, "the plea agreement, what he admits"), (42, "the shipping form")]:
        fx(cut_t(i), paper(), -13, 0.1, "paper", why + " lands")

    # 0: the loot. The bags settle; on "vanished" they go, one after another.
    for k in range(3):
        fx(f_(4 + 5 * k), clink(R, 2400 + 300 * k, 0.14), -15, -0.4 + 0.4 * k, "tick", "a bag of jewels settles")
        fx(F(8, 3 * k), pop(900 - 120 * k, 300, 0.09), -11, -0.4 + 0.4 * k, "pop", f"bag {k + 1} of 3 is gone, and a mark is left on the floor")
    fx(0.35, ding(2637, 0.5), -17, 0.3); fx(1.1, ding(3136, 0.5), -18, -0.3)
    # 1: the truck stop at night; the clock on the sign runs from 2:05 to 2:32
    night = cut_t(1)
    fx(night + 0.02, crickets(cut_t(2) - night - 0.1, R), -20, 0, "crickets", "the truck stop at night")
    a, b = Wf(13) - 2, Wf(14) + 14
    k = 0
    for f in range(a, b + 1):
        if int(np.floor(10 * smoothstep(f, a, b) * 0.999)) > k:
            k += 1
            fx(f_(f), tick(1500 + 60 * k), -14, -0.3, "tick", f"the clock on the sign: {5 + 3 * k} minutes past two")
    # 2: the diner
    eat = cut_t(2)
    fx(eat + 0.03, clink(R, 1900, 0.1), -16, 0.3)
    for k in range(1, 4):
        fx(eat + f_(9 * k), click(), -17, 0.1, "munch", "the driver takes a bite, then chews")
    # 3: the bunk
    fx(cut_t(3) + 0.12, snore(0.55), -15, -0.2, "snore", "the other driver, asleep"); fx(cut_t(3) + 0.8, snore(0.5), -16, -0.2)
    # 4: one of the seven
    fx(cut_t(4) + f_(2), knock(), -12, -0.2, "clunk", "a light on number 1")
    # 5: the signature
    for k in range(6):
        fx(F(29) + k * (F(31, 8) - F(29)) / 6, pen(), -14.5, 0.2, "pen" if k == 0 else "", "a signature on the plea agreement")
    # 6: the show
    for k in range(3):
        fx(cut_t(6) + f_(5 + 4 * k), ding(2093 + 370 * k, 0.4), -16, -0.4 + 0.4 * k, "tick", "a jeweler behind a full case")
    # 7: the truck pulls out
    fx(cut_t(7) + 0.02, engine(1.6, 62, 96), -15, 0.2, "engine", "the big rig pulls out under the sign")
    # 8: the map
    fx(cut_t(8) + f_(3), knock(), -12.5, 0, "clunk", "a pin on San Mateo")
    # 10: followed
    fx(cut_t(10) + 0.02, engine(1.35, 58, 62), -17, 0.2, "engines", "the truck, and two cars behind it")
    fx(cut_t(10) + 0.1, engine(1.2, 118, 126), -19, -0.4); fx(cut_t(10) + 0.25, engine(1.1, 104, 110), -19, 0.4)
    # 11: the route
    fx(cut_t(11) + f_(2), slide(380, 760, F(59, 4) - cut_t(11) - f_(2)), -19, 0, "line", "the route is drawn down the valley")
    fx(cut_t(11) + f_(26), pop(520, 1040), -13, -0.2, "pop", "pin: Buttonwillow")
    fx(F(59), knock(), -12.5, 0.2, "clunk", "pin: Lebec")
    # 12, 13: 2:05 a.m.; the truck pulls in
    fx(cut_t(12) + 0.02, crickets(cut_t(14) - cut_t(12) - 0.1, R), -20, 0, "crickets", "2:05 a.m. at the truck stop")
    fx(cut_t(12) + 0.05, hum(cut_t(13) - cut_t(12) - 0.1, 120), -21, 0.2, "neon hum", "the sign")
    fx(cut_t(13) + 0.02, engine(1.0, 96, 52), -14, -0.2, "engine", "the big rig pulls in and stops")
    fx(cut_t(13) + f_(30), whoosh(0.4, R, peak=0.15, f_lo=1800, f_hi=5200, tail=0.2), -14.5, -0.1, "air brake", "it stops")
    # 14: he goes in
    fx(cut_t(14) + 0.02, ding(2093, 0.5), -14, -0.5, "door bell", "the diner's door"); fx(cut_t(14) + 0.14, ding(1568, 0.6), -15, -0.5)
    fx(cut_t(14) + f_(20), step(), -13, 0, "step", "he sits down at the counter")
    fx(cut_t(14) + f_(34), clink(R, 1700, 0.12), -15.5, 0.2, "tick", "a plate arrives")
    # 15: the cab
    fx(cut_t(15) + 0.1, snore(0.55), -15, -0.3, "snore", "the bunk"); fx(cut_t(15) + 0.78, snore(0.5), -16, -0.3)
    fx(cut_t(15) + f_(8), pop(440, 990, 0.09), -12.5, 0.3, "pop", "an empty seat: the outline of the driver who went to eat")
    # 16: twenty-seven minutes on the wall clock
    fx(cut_t(16) + f_(2), ratchet(9), -13, 0.2, "tick", "the hands run from 2:05 to 2:32"); fx(cut_t(16) + f_(13), ratchet(8), -13.5, 0.2)
    # 17: the lock
    fx(cut_t(17) + f_(1), clang(), -10.5, -0.2, "clack", "a cut padlock hits the ground")
    fx(cut_t(17) + f_(9), clink(R, 2100, 0.14), -13, -0.1, "tick", "it bounces once"); fx(cut_t(17) + f_(3), rattle(0.3, R, density=26), -15, 0.1)
    # 18: the marks of twenty-four bags
    for k in range(5):
        fx(cut_t(18) + f_(2 * k), pop(820 - 70 * k, 360, 0.07), -13.5, -0.4 + 0.2 * k, "pop", f"row {k + 1}: the marks of four bags")
    # 19-21: the shelf; the light comes on; a phone
    fx(cut_t(19) + 0.05, hum(cut_t(20) - cut_t(19) - 0.1, 60), -21, 0, "room hum", "an evidence room")
    fx(cut_t(19) + 0.5, crackle(0.3, 50), -20, 0.2)
    fx(cut_t(21) + f_(2), click(), -11.5, 0, "click", "a light is switched on over the box")
    fx(cut_t(21) + f_(3), creak(0.34, R), -15.5, 0.1, "creak", "the lid comes up")
    fx(cut_t(21) + f_(16), ding(1760, 0.3), -12.5, 0.2, "ping", "a prepaid phone, out of the box"); fx(cut_t(21) + f_(16) + 0.09, ding(2217, 0.35), -13.5, 0.2)
    # 23: towers
    fx(cut_t(23) + 0.02, engine(0.95, 60, 64), -19, 0.1, "engines", "the road again")
    for k in range(2):
        fx(cut_t(23) + f_(2 + 5 * k), blip(1319 + 440 * k, 0.06), -14, -0.3 + 0.6 * k, "blip", "a phone over a car lights up")
    # 24: the route again
    fx(cut_t(24) + f_(22), knock(), -12.5, 0.2, "clunk", "pin: Lebec")
    # 25: the number
    KEYS = {"1": (697, 1209), "2": (697, 1336), "4": (770, 1209), "5": (770, 1336), "0": (941, 1336)}
    for k, dgt in enumerate("2410555"):
        fx(F(122, 4 * k), keytone(*KEYS[dgt]), -15, -0.2 + 0.07 * k, "blip", f"a digit crosses to the officer's pad ({k + 1} of 7)")
    for k in range(6):
        fx(cut_t(25) + f_(9 * k), tick(820 if k % 2 else 980), -21, 0.5)
    # 26: the pad
    for k in range(3):
        fx(cut_t(26) + f_(3 + 5 * k), pen(), -15, 0.3, "pen" if k == 0 else "", "the officer writes it down")
    # 27: the collision, wide
    fx(cut_t(27) + f_(3), buzz(0.2, 330) + buzz(0.2, 415), -17, -0.4, "horn", "a car horn, far off")
    fx(F(132, -2), pop(440, 990, 0.09), -12.5, -0.2, "pop", "tag: WITNESS")
    for k in range(5):
        fx(cut_t(27) + f_(9 * k), tick(820 if k % 2 else 980), -21, 0.5)
    # 28: seven lights
    for k in range(7):
        fx(cut_t(28) + f_(2 + 3 * k), knock(), -13.5, -0.5 + k / 6, "clunk", f"a light on number {k + 1}")
    # 29: the airport
    fx(cut_t(29) + 0.03, ding(1047, 0.5), -14.5, 0, "airport chime", "two notes over the loudspeakers"); fx(cut_t(29) + 0.24, ding(784, 0.7), -15, 0)
    fx(cut_t(29) + 0.05, rumble(0.5), -19, -0.3)
    fx(F(142, -2), step(), -12, 0, "step", "he stops: an officer on either side")
    # 31, 32: the other truck
    fx(cut_t(31) + 0.05, bird_chirps(cut_t(33) - cut_t(31) - 0.2, R, density=1.2), -21, 0.3, "birds", "a car park by day")
    for k in range(3):
        t = cut_t(32) + f_(4 + 7 * k)
        fx(t, blip(1319, 0.05), -13, -0.3 + 0.3 * k, "blip", f"a tag lifts out of the carton and chirps ({k + 1} of 3)"); fx(t + 0.07, blip(1760, 0.07), -13, -0.3 + 0.3 * k)
    # 34: the loot again
    fx(cut_t(34) + 0.1, ding(2637, 0.5), -17, 0.3); fx(cut_t(34) + 0.5, ding(3136, 0.5), -18, -0.3)
    # 35-37: where the seven are
    for k in range(3):
        fx(F(175, -2 + 4 * k), paper(), -13.5, -0.3 + 0.3 * k, "paper", f"NOT GUILTY: card {k + 1} of 3 comes up")
    for k in range(2):
        fx(F(180, -2 + 4 * k), pop(700 - 120 * k, 330, 0.09), -12, -0.1 + 0.3 * k, "pop", f"never arrested: an outline where number {5 + k} stood")
    fx(F(184, -2), step(), -13, 0.4, "step", "number 7 leaves the line")
    fx(F(184, -2), whoosh(1.1, R, peak=0.55, f_lo=300, f_hi=1500, tail=0.4), -15.5, 0.4, "plane", "a plane, small, up and away")
    fx(F(184, 4), pop(520, 300, 0.09), -12.5, 0.4, "pop", "an outline where number 7 stood")
    # 38: the courtroom
    fx(cut_t(38) + f_(3), pop(440, 990, 0.09), -12.5, -0.3, "pop", "an outline on the defendant's chair")
    fx(cut_t(38) + f_(10), step(), -14, 0.3, "step", "the prosecutor looks up from the papers")
    fx(F(190, -2), click(), -16, 0.3, "tick", "a shrug")
    # 40: the jeweler's paper
    fx(cut_t(40) + 0.1, paper(), -17, 0.2)
    # 41, 43: the scale
    A, B = F(205, -2), F(212, -2)
    fx(A, whoosh(0.3, R, peak=0.8, f_lo=300, f_hi=900, tail=0.05), -17, -0.3)
    fx(A + f_(8), thud(1.2), -9.5, -0.3, "thud", "the bag of jewels lands on the left pan, and its price with it"); fx(A + f_(9), rattle(0.4, R, density=30), -14.5, -0.3)
    fx(A + f_(10), creak(0.4, R), -15.5, -0.2, "creak", "the beam goes down on that side")
    fx(B + f_(10), paper(), -12.5, 0.3, "paper", "the form lands on the right pan, and its price with it")
    fx(B + f_(12), creak(0.3, R), -17, 0.2)
    # 44, 45: the question
    fx(cut_t(44) + 0.3, creak(0.45, R), -18, 0, "creak", "the beam rocks: it has not made up its mind")
    fx(F(222, -2), knock(), -12, -0.4, "clunk", "a light on the jewels: A, WHAT THEY LOST")
    fx(F(227, -2), knock(), -12, 0.4, "clunk", "a light on the form: B, WHAT THEY DECLARED")
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
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ping", "click", "clunk", "paper", "step", "tick", "flap", "marker", "blip", "thud", "clack", "munch"}


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
        out.append([on, on])
        if k + 1 == len(caps) or caps[k + 1][0] > end:            # it goes away before the next one comes
            out.append([first(end), first(end)])
    for t, name, _ in EVENTS:
        if name in GRAPHIC_SOUNDS:
            f = jsround(t * FPS)
            out.append([f, f + 9])
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
        f.write("# Truck-stop heist short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
