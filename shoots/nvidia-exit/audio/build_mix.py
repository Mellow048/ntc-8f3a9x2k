"""Soundtrack for the Nvidia exit short: narration + an original score + effects that follow the picture.

    python shoots/nvidia-exit/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/nvexit/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: F minor at 140 beats a minute, felt at half speed. One tune tells the story. "The flex" is a sub-bass, a kick,
a clap on three, hats that roll and a four-note hook on bells; it plays under the hook and comes back when the spending
starts, with a kick on every beat in the club. "It lasted one month" cuts it dead. His room is the same beat with
everything taken out of it; the game lobby plays the hook as an old computer would. The callers get a low pulse, then
cheerful hold music on a fife for each paper face, a tone higher for the second, and the jingle comes down a diminished
chord when he lets them in. The coins leave on bells running down three octaves; the sum is a climb by semitones and a
kettledrum. "Someone was watching" stops the beat on a low F; the investigator is a walking plucked bass with brushes and
no drums. The arrest is the beat with nothing on top. In court there is one low chord and a toll for "twenty years", and
no tune under a quotation. The prosecutors' "empire" is the hook's four notes on a tuba and a horn; the lawyer's "bunch of
kids" is the same four notes on a music box, three octaves higher; the two sounds come back for A and B.
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
# One content word sat under the bed: "vanished" (0.6 LU under the bells that run down and the coins).
WEAK_WORDS: dict[int, tuple[float, float]] = {75: (2.0, -2.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "nvexit", "story.ts")).read()
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
assert len(CUTS) == 45 and CUTS[0] == 0, CUTS
JOINS = {14, 17, 44}                                             # shots that carry on the take before them: not cuts
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
# F minor at 140 beats a minute, felt at half speed: a kick on one, a clap on three. (The other seven news films are in A minor
# at 112, D minor at 104, G major / E minor at 118, C minor swung at 130, F sharp minor at 174 in three, G minor / B flat major
# at 72 in six, and B minor at 100 in five. This one shares no key and no tempo with them.)
# Bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so the sub-bass
# has harmonics and the level is carried by what a phone does play (the bells, the hats, the clap).
BPM = 140.0
BEAT = 60.0 / BPM
E8 = BEAT / 2
BAR = 4 * BEAT
KICK, BASS_MIX = 0.6, 0.7
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
ROOTS = [41, 37, 44, 39]                                          # F, D flat, A flat, E flat: a bar each
# the hook on bells, bar by bar: (quaver, note). Its first four notes are C, A flat, F, A flat.
HOOK = [[(0, 84), (3, 80), (5, 77), (6, 80)], [(0, 80), (3, 77), (5, 73), (6, 77)], [(0, 84), (3, 80), (5, 75), (6, 80)], [(0, 82), (3, 79), (5, 75), (6, 79)]]
vibe = lambda m, d=1.2: cached(("vibe", m, round(d, 2)), lambda: I.vibes(m2f(m), 0.6, R, d))
mbox = lambda m, d=1.4: cached(("mbox", m, round(d, 2)), lambda: I.musicbox(m2f(m), 0.6, R, d))


def sonar(m, d=1.5):
    """a ping: one pure note with a soft start and two echoes, each quieter"""
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


def flex_bar(t0, k, kind="trap", hook=True, until=None, g=1.0):
    """one bar of the flex, bar k of its four. kind: "trap" = sub-bass, kick on one, clap on three, rolling hats; "four" = a kick
    on every beat and a clap on two and four (the club); "bare" = the sub-bass and the hats only (his room);
    "chip" = the hook and a bass on square waves, no drums (the game)."""
    live = lambda t: until is None or t < until - 0.03
    root = ROOTS[k % 4]
    if kind == "chip":
        for q in range(8):
            if live(t0 + q * E8):
                put("bass", chipn(root + 12 + (7 if q % 4 == 2 else 0), 0.16), t0 + q * E8, 0.34 * g, -0.2)
    else:
        for q, d, w in ((0, 1.1, 1.0), (5, 0.4, 0.7)):
            if live(t0 + q * E8):
                put("bass", subn(root, d), t0 + q * E8, w * g)
        for q in range(8):
            if live(t0 + q * E8):
                put("drums", hat(0.5 if q % 2 == 0 else 0.34), t0 + q * E8, g, 0.25 if q % 2 else -0.25)
            if q in (3, 7) and kind != "bare":                    # the roll: two more, twice as fast
                for r in (1, 2):
                    if live(t0 + q * E8 + r * E8 / 3):
                        put("drums", hat(0.26), t0 + q * E8 + r * E8 / 3, g, 0.3)
        if kind == "trap":
            for q in (0, 5):
                if live(t0 + q * E8):
                    put("drums", kick(KICK), t0 + q * E8, g)
            if live(t0 + 4 * E8):
                put("drums", clap(), t0 + 4 * E8, 0.34 * g, 0.1)
        if kind == "four":
            for q in (0, 2, 4, 6):
                if live(t0 + q * E8):
                    put("drums", kick(KICK), t0 + q * E8, g)
            for q in (2, 6):
                if live(t0 + q * E8):
                    put("drums", clap(), t0 + q * E8, 0.34 * g, 0.1)
    if hook:
        for q, m in HOOK[k % 4]:
            if live(t0 + q * E8):
                if kind == "chip":
                    put("lead", chipn(m, 0.2), t0 + q * E8, 0.4 * g, 0.15)
                else:
                    put("lead", glock(m, 1.0), t0 + q * E8, 0.5 * g, -0.15)
                    put("lead", mbox(m - 12, 0.9), t0 + q * E8, 0.3 * g, 0.2)


def flex(t0, t1, kind="trap", hook=True, g=1.0, k0=0):
    k = 0
    while t0 + k * BAR < t1 - 0.05:
        flex_bar(t0 + k * BAR, k0 + k, kind, hook, t1, g)
        k += 1


def build_music():
    def thin(t0, t1, notes, g=0.13, warm=3000.0, att=0.35, rel=0.5):
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=att, rel=rel, warm=warm), t0, g)

    def rolled(t, notes, g=0.5, gap=0.022, voice=harp):
        for j, m in enumerate(notes):
            put("comp", voice(m, 1.3), t + gap * j, g, -0.3 + 0.6 * j / max(1, len(notes) - 1))

    def heavy(t, g=1.0):
        """what an empire weighs: a kettledrum, a tuba, a low chord"""
        put("hits", I.timpani(m2f(41), 0.95, R, 1.8), t, 1.0 * g)
        put("hits", I.brass(m2f(41), 0.9, 0.85, R, "tuba"), t, 0.5 * g)
        rolled(t, (53, 56, 60, 65), 0.45 * g, 0.018, vibe)

    def light(t, g=1.0):
        """what a kid weighs: two notes of a music box and one blip of a game"""
        put("lead", mbox(84, 0.9), t, 0.5 * g, 0.3); put("lead", mbox(89, 1.1), t + 0.12, 0.5 * g, 0.3)
        put("lead", chipn(96, 0.1), t + 0.24, 0.3 * g, 0.4)

    def walk(t0, t1, g=1.0, answer=True):
        """the investigator: a plucked bass walking in quavers, brushes, a chord on the vibraphone answering; no drums"""
        line = [41, 44, 46, 48, 49, 48, 46, 44, 41, 39, 41, 44, 46, 44, 41, 36]
        q = 0
        while t0 + q * E8 < t1 - 0.05:
            t = t0 + q * E8
            put("bass", bassn(line[q % 16], 0.4), t, 0.9 * g)
            put("drums", I.brush(0.5 if q % 4 == 0 else 0.3, R, 0.3, swish=q % 4 == 0), t, 0.9 * g, 0.25 if q % 2 else -0.25)
            if answer and q % 16 == 6 and t < t1 - 0.6:
                rolled(t, (65, 68, 72, 75), 0.3 * g, 0.02, vibe)
            q += 1

    # the hook (shots 0-5): the flex
    flex(0.0, cut_t(6))
    EVENTS.append((0.0, "music in", "the flex, in F minor at 140 beats a minute felt at half speed: a sub-bass, a kick, a clap on three, hats that roll, a bell hook"))
    # "It lasted one month!": the music is cut dead; the clock's two ticks are effects
    put("drums", clap(), cut_t(6), 0.4); put("bass", subn(41, 1.2), cut_t(6), 0.9)
    EVENTS.append((cut_t(6), "music cut dead", "'It lasted one month': one clap and a low F, then two ticks of a clock on 'one month'"))
    # his room (7, 8): the beat, emptied
    flex(cut_t(7), cut_t(9), "bare", False, 0.7); thin(cut_t(7), cut_t(9), (53, 56, 60, 63), 0.12)
    EVENTS.append((cut_t(7), "the beat, emptied", "August 2024, his room: only the sub-bass and the hats, and F minor with a seventh held over them"))
    # the globe (9): D flat major, the brightest chord so far; a harp goes up as the line leaves Singapore
    thin(cut_t(9), cut_t(10), (49, 53, 56, 61), 0.16, att=0.1); put("bass", subn(37, 1.5), cut_t(9), 0.7)
    for j, m in enumerate((61, 65, 68, 73, 77, 80, 85)):
        put("lead", harp(m, 1.2), F(38) + j * 0.07, 0.5, -0.3 + 0.1 * j)
    EVENTS.append((cut_t(9), "held chord", "the globe: D flat major, the film's brightest chord so far"))
    EVENTS.append((F(38), "harp, rising", "the line leaves Singapore and goes east: seven notes up, on the word"))
    # the lobby (10): the hook as a game would play it
    flex(cut_t(10), cut_t(11), "chip")
    EVENTS.append((cut_t(10), "the hook, eight-bit", "'a crew that met through online games': the hook on square waves"))
    # the callers (11, 12): a low pulse, a diminished chord; the telephone is an effect
    k = 0
    while cut_t(11) + k * BEAT < cut_t(13) - 0.05:
        put("bass", subn(41 if k % 8 < 6 else 40, 0.3), cut_t(11) + k * BEAT, 0.8); put("drums", hat(0.3), cut_t(11) + k * BEAT + E8, 0.7, 0.2)
        k += 1
    thin(cut_t(11), cut_t(13), (53, 56, 59), 0.1)
    EVENTS.append((cut_t(11), "a low pulse", "'Prosecutors say they phoned a man': the bass on every beat, one hat between, a diminished chord"))
    # 13, 14: hold music for each paper face: a cheerful jingle in A flat on a fife and bells, then a tone higher
    def jingle(t0, t1, up):
        tune, q, step = [68, 72, 75, 80, 77, 75, 72, 75], 0, 0.165
        while t0 + q * step < t1 - 0.08:
            m = tune[q % 8] + up
            put("lead", fife(m, 0.13), t0 + q * step, 0.5, -0.1); put("lead", glock(m + 12, 0.5), t0 + q * step, 0.22, 0.25)
            if q % 2 == 0:
                put("bass", bassn(44 + up + (7 if q % 4 == 2 else 0), 0.3), t0 + q * step, 0.6)
            q += 1
    jingle(cut_t(13), cut_t(14), 0); jingle(cut_t(14), cut_t(15), 2)
    EVENTS.append((cut_t(13), "hold music", "'posing as Google security': a cheerful jingle in A flat major, fife and bells, for the paper face"))
    EVENTS.append((cut_t(14), "hold music, a tone higher", "'then as his crypto exchange': the same jingle in B flat for the second paper face"))
    # 15: the jingle goes sour; then a kettledrum and brass when the program is in
    for j, m in enumerate((82, 79, 76, 73, 70, 67)):
        put("lead", fife(m, 0.15), cut_t(15) + 0.05 + j * 0.17, 0.5 - 0.05 * j, -0.1)
    thin(cut_t(15), F(68, 3), (52, 55, 58, 61), 0.14)
    t = F(68, 3)
    put("hits", I.timpani(m2f(41), 0.95, R, 1.6), t, 1.0); put("hits", I.brass(m2f(41), 0.8, 0.85, R, "tuba"), t, 0.5); put("hits", I.brass(m2f(53), 0.6, 0.8, R, "horn"), t, 0.35)
    thin(t, cut_t(16), (53, 56, 59), 0.13, att=0.05)
    EVENTS.append((cut_t(15) + 0.05, "the jingle goes sour", "'until he let them': the tune comes down a diminished chord"))
    EVENTS.append((t, "kettledrum and brass", "'into his computer': the program is in, and the screen turns red"))
    # 16: the coins go: bells running down three octaves as the piles sink
    for j, m in enumerate((89, 87, 84, 82, 80, 77, 75, 72, 70, 68, 65, 63, 60, 58, 56)):
        put("lead", glock(m, 0.8), cut_t(16) + 0.3 + j * 0.105, 0.42, -0.4 + 0.8 * j / 14)
    thin(cut_t(16), cut_t(17), (41, 53, 56, 60), 0.12)
    EVENTS.append((cut_t(16) + 0.3, "bells, running down", "'forty-one hundred bitcoin': fifteen notes down three octaves as the piles sink"))
    # 17: the sum: a climb by semitones under the counter, and a kettledrum when it stops
    t0, t1 = cut_t(17) + 0.1, F(81)
    for j in range(12):
        put("lead", chipn(53 + j, 0.14), t0 + (t1 - t0) * j / 12, 0.3 + 0.02 * j, -0.3 + 0.05 * j)
    heavy(t1); put("lead", glock(89, 1.4), t1 + 0.08, 0.2, 0.3)
    EVENTS.append((t0, "a climb", "'more than two hundred thirty million': a square wave up by semitones under the counter"))
    EVENTS.append((t1, "kettledrum, brass, a chord", "'million': the counter stops on $230 MILLION+"))
    # 18-25: "Then came the flex": the beat and the hook again; a kick on every beat in the club
    flex(cut_t(18), cut_t(21)); flex(cut_t(21), cut_t(23), "four"); flex(cut_t(23), cut_t(26))
    put("hits", I.brass(m2f(65), 0.3, 0.9, R, "stab"), F(108), 0.4); put("hits", I.brass(m2f(53), 0.3, 0.9, R, "stab"), F(108), 0.4)
    EVENTS.append((cut_t(18), "the flex, all of it", "'Then came the flex': the beat and the hook again, over the villa and the jet"))
    EVENTS.append((cut_t(21), "four on the floor", "the club: a kick on every beat and the clap on two and four, the hook still on top"))
    EVENTS.append((cut_t(23), "the flex again", "the cars: back to half speed"))
    EVENTS.append((F(108), "brass stab", "the price tag: $3,800,000"))
    # 26: "Someone was watching": the beat stops on a low F; one note on the vibraphone
    put("bass", subn(41, 1.4), cut_t(26), 0.9); put("drums", kick(KICK), cut_t(26))
    put("lead", vibe(72, 2.0), cut_t(26) + 0.38, 0.6, -0.1); thin(cut_t(26), cut_t(27), (41, 48, 53), 0.1)
    EVENTS.append((cut_t(26), "music cut dead", "'Someone was watching': the beat stops on a low F"))
    EVENTS.append((cut_t(26) + 0.38, "one note on the vibraphone", "'Someone was watching': a C over a low chord, and nothing else"))
    # 27-31: the investigator walks; quieter under the shared screen; it stops when somebody records
    walk(cut_t(27), cut_t(30)); walk(cut_t(30), cut_t(31), 0.6, False); thin(cut_t(31), cut_t(32), (48, 55, 58), 0.1)
    for j, m in enumerate((77, 80, 84)):
        put("lead", pingn(m), cut_t(28) + 0.05 + j * 0.33, 0.4, -0.3 + 0.3 * j)
    EVENTS.append((cut_t(27), "a walking bass", "the investigator: a plucked bass in quavers, brushes, a vibraphone chord answering; no drums"))
    EVENTS.append((cut_t(28) + 0.05, "three pings, rising", "'followed the coins': the wallet, the mixers, the three threads"))
    EVENTS.append((cut_t(30), "the walk, quieter", "the shared screen: the bass and the brushes only"))
    EVENTS.append((cut_t(31), "the walk stops", "'and somebody recorded it': one thin chord"))
    # 32: the calendar again: a low C; the clock is an effect
    put("bass", subn(36, 1.3), cut_t(32), 0.8); thin(cut_t(32), cut_t(33), (48, 55, 60), 0.1)
    EVENTS.append((cut_t(32), "a low C", "'One month after the theft': the dominant, waiting"))
    # 33: the arrest: the beat with nothing on top
    flex(cut_t(33), cut_t(34), "trap", False)
    EVENTS.append((cut_t(33), "the beat with nothing on top", "the arrest: the kick, the clap and the sub-bass of the flex, and no hook"))
    # 34: the dock: a harp on tiptoe; 35: the hook under water
    thin(cut_t(34), cut_t(35), (49, 56, 61), 0.12)
    for j, m in enumerate((80, 77, 73, 68)):
        put("lead", harp(m, 0.9), cut_t(34) + 0.25 + j * 0.3, 0.5, -0.2 + 0.13 * j)
    for j, (q, m) in enumerate(HOOK[0]):
        put("lead", lp(vibe(m - 24, 1.6), 900), cut_t(35) + 0.1 + j * 0.3, 0.7)
    thin(cut_t(35), cut_t(36), (41, 48, 53, 56), 0.14, warm=700.0)
    EVENTS.append((cut_t(34) + 0.25, "harp, tiptoe", "the dock: four notes down over D flat"))
    EVENTS.append((cut_t(35) + 0.1, "the hook, under water", "the phone sinks: the hook's four notes, two octaves down and muffled"))
    # 36, 37: the court: one low chord; the bass moves once; a toll on "twenty years"
    thin(cut_t(36), cut_t(38), (41, 53, 56, 60), 0.13, att=0.2); put("bass", subn(41, 2.0), cut_t(36), 0.8); put("bass", subn(36, 2.0), F(178), 0.8)
    put("hits", I.timpani(m2f(41), 0.9, R, 2.0), F(184, -1), 0.9); put("lead", vibe(53, 2.2), F(184, -1), 0.6)
    EVENTS.append((cut_t(36), "one low chord", "the courtroom: F minor, held; the bass moves once, to C, on 'racketeering'"))
    EVENTS.append((F(184, -1), "a toll", "'twenty years': a kettledrum and one low note of the vibraphone"))
    # 38: the judge's question on a harp; 39: no tune under his answer
    thin(cut_t(38), cut_t(39), (44, 51, 56, 60), 0.11)
    for j, m in enumerate((68, 72, 75, 82)):
        put("lead", harp(m, 1.2), F(189) + j * 0.16, 0.5, -0.2 + 0.13 * j)
    thin(cut_t(39), cut_t(40), (48, 55, 58, 63), 0.1)
    EVENTS.append((F(189), "a question on the harp", "'which cars': four notes up, ending in the air"))
    # 40: "a cybercrime empire": the hook's first four notes, low, on a tuba and a horn
    thin(cut_t(40), cut_t(41), (41, 48, 53, 56), 0.1)
    for j, m in enumerate((48, 44, 41, 44)):
        put("hits", I.brass(m2f(m), 0.26, 0.85, R, "tuba"), F(203) + j * 0.3, 0.6); put("hits", I.brass(m2f(m + 12), 0.26, 0.8, R, "horn"), F(203) + j * 0.3, 0.4)
    put("hits", I.timpani(m2f(41), 0.9, R, 1.4), F(203) + 0.6, 0.8)
    EVENTS.append((F(203), "the hook, as an empire", "'a cybercrime empire': its first four notes on a tuba and a horn, with a kettledrum"))
    # 41: "a very sad case of a bunch of kids": the same four notes on a music box
    thin(cut_t(41), cut_t(42), (53, 56, 60, 65), 0.09, warm=4000.0)
    for j, m in enumerate((84, 80, 77, 80)):
        put("lead", mbox(m, 1.0), F(209) + j * 0.3, 0.55, 0.2)
    EVENTS.append((F(209), "the hook, on a music box", "'a very sad case of a bunch of kids': the same four notes, three octaves higher"))
    # 42: the lobby again
    flex(cut_t(42), cut_t(43), "chip", True, 0.9)
    EVENTS.append((cut_t(42), "the hook, eight-bit", "'online games ... through which they met': the lobby's music again"))
    # 43, 44: the question on the dominant; a sound for each answer; the tune stops short
    z0, za, zb = cut_t(43) + 0.05, F(223, -2), F(227, -2)
    rolled(z0, (48, 55, 58, 62, 64, 70), 0.45); thin(z0, za, (48, 52, 55, 58), 0.1)
    heavy(za, 0.8); light(zb, 1.1)
    e = WORDS[-1]["end"] + 0.2
    for j, m in enumerate((84, 80, 77, 79)):
        put("lead", glock(m, 1.6 if j == 3 else 0.6), e + j * 0.26, 0.5, -0.15)
    put("bass", subn(36, 1.2), e + 0.78, 0.85); rolled(e + 0.78, (48, 52, 55, 58), 0.4)
    EVENTS.append((z0, "harp on the dominant", "C with a seventh and a ninth: the question is coming"))
    EVENTS.append((za, "the heavy sound", "A, 'a crime boss': the kettledrum and the brass of the empire"))
    EVENTS.append((zb, "the light sound", "B, 'a kid in way over his head': the music box, and one blip of a game"))
    EVENTS.append((e, "button", "the hook's first notes on bells, stopping on G over the dominant: it does not come home"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 11, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, : ns(cut_t(6))]), integrated(v[:, ns(cut_t(27)): ns(cut_t(30))])) for k, v in BUS.items()}
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


def splash():
    """something small dropped into water"""
    t = tt(0.9)
    y = lp(R.standard_normal(len(t)), 3200) * np.exp(-t / 0.16) + bp(R.standard_normal(len(t)), 900, 5200) * np.exp(-((t - 0.1) / 0.14) ** 2) * 0.8
    return fades(hp(y, 250), 0.002, 0.2)


def ringtone(d=0.7):
    """a telephone: two notes turn about quickly"""
    t = tt(d)
    f = np.where(np.sin(TAU * 22 * t) > 0, 1480.0, 1190.0)
    return fades(np.sin(phase(f)) * (0.6 + 0.4 * np.sin(TAU * 11 * t) ** 2), 0.004, 0.03)


def bubbles(d=1.2, n=9):
    """air going up through water"""
    y = np.zeros(ns(d))
    for k in range(n):
        dd = 0.05 + 0.03 * R.random(); t = tt(dd); f0 = 380 + 500 * R.random()
        b = np.sin(phase(f0 * (1 + 1.4 * t / dd))) * np.exp(-t / (dd * 0.5))
        i = ns((d - 0.1) * k / n + 0.03 * R.random()); y[i:i + len(b)] += b[: len(y) - i] * (0.5 + 0.5 * R.random())
    return fades(y, 0.002, 0.05)


def lapping(d):
    """water against a wall"""
    t = tt(d)
    return fades(lp(R.standard_normal(len(t)), 1400) * (0.35 + 0.65 * np.sin(TAU * 0.9 * t) ** 2), 0.15, 0.2)


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

    stamps = [(F(5), "OVER $230 MILLION"), (F(25), "31 DAYS"), (F(72), "4,100+ BITCOIN"), (F(93), "UP TO $500,000 A NIGHT"), (F(157), "ARRESTED"), (F(184, -1), "UP TO 20 YEARS")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(F(10), "in bitcoin, at the time, U.S. Attorney's Office"), (F(13), "the man who was robbed is not drawn"), (F(17), "'notorious' in clubs, a court heard, BBC"), (F(20, 3), "31 cars, by his own account"),
            (F(21, 3), "rented: Los Angeles, the Hamptons, Miami"), (F(22, 3), "'up to $500,000 per evening'"), (F(30), "name tag: Malone Lam, 20 then"), (F(32, 4), "a stock cartoon figure, not a likeness"),
            (F(35), "left school at 14, he told investigators, BBC"), (F(38, 8), "stayed after his visa expired, BBC"), (F(40), "'ringleader', U.S. Attorney's Office"), (F(43), "'connections made on online gaming platforms'"),
            (F(45, 4), "18 charged, his was the 11th guilty plea, AP"), (F(49), "the crew has no faces here"), (F(52), "Washington, D.C., Aug. 18, 2024"), (F(56), "'claiming they were from Google's security team'"),
            (F(58), "court filing, as reported by CNBC"), (cut_t(14) + f_(2), "then as the 'support team' of his exchange"), (F(65), "'duped into downloading a program', USA Today"), (F(75), "'over 4,100 bitcoin', U.S. Attorney's Office"),
            (F(84), "'a wild spending spree', Associated Press"), (F(87, 2), "rented, one at $68,000 a month"), (F(89, 2), "'private jet rentals'"), (F(95, 3), "'up to $500,000 per evening'"), (F(97, 2), "one receipt, a Los Angeles club"),
            (F(107), "a Pagani Huayra, 'purchased for $3,800,000'"), (F(111), "court filing, Oct. 2024: it had not been found"), (F(115), "'posting and appearing in photos', Wired"), (F(120), "Aug. 19, 2024: the day after"),
            (F(126), "name tag: ZachXBT, a pseudonym"), (F(129), "'three main threads', Wired"), (F(132), "'on Instagram and TikTok', Wired"), (F(133, 2), "he 'appeared to be in Miami'"), (F(138), "one of them 're-shared his screen'"),
            (F(141, 2), "with 'another group of friends'"), (F(147), "a 90-minute video, first names are spoken in it"), (F(151), "he shared his findings with law enforcement"), (F(159), "Sept. 18, 2024, at his rental home in Miami"),
            (F(162), "'off a dock ... into Biscayne Bay', USA Today"), (F(164, 2), "tipped off by an off-duty officer, it says, AP"), (F(169), "the indictment, as reported by USA Today"), (F(176), "one count of RICO conspiracy"),
            (F(178, 2), "U.S. District Court, Washington"), (F(185, 3), "not sentenced yet, next hearing Dec. 8, 2026"), (F(187), "at the plea hearing, Associated Press"), (F(190), "he had bought most of them, not all, he indicated"),
            (F(195, -2), "quote card: 'I would need some time.'"), (F(202), "quote card: 'If you build a cybercrime empire ...'"), (F(208), "quote card: 'It's a very sad case of a bunch of kids ...'"), (F(214, 2), "'online games ... through which they met'"),
            (F(216), "the same statement, to USA Today"), (F(219), "WHO GETS SENTENCED?"), (F(221, 2), "no date yet, he faces up to 20 years")]
    for k, (t, why) in enumerate(pops):
        fx(t, pop(440 + 40 * (k % 3), 980 + 60 * (k % 3), 0.075), -13.5, 0.3 if k % 2 else -0.3, "pop", why)
    for t, why in ((F(27, 1), "calendar leaf: Aug. 18, 2024"), (F(172, 1), "calendar leaf: Sept. 8, 2026")):
        fx(t, paper(), -12, -0.3, "flap", why)
    # 0: the pile
    fx(0.1, clink(R), -14, 0.1, "coins", "coins settle; he comes up behind the pile"); fx(F(8), step(), -13, 0, "step", "a hop on 'billion'")
    # 1: his wallet
    fx(cut_t(1) + f_(3), pop(520, 1040, 0.08), -12.5, 0.2, "pop", "his wallet, on a card over the laptop")
    # 2, 3: the selfie, the cars
    fx(F(17), click(), -10.5, 0.2, "click", "the camera of his phone"); fx(cut_t(3) + 0.02, engine(0.75, 80.0, 190.0), -13, -0.2, "engine", "supercars: one is revved")
    # 4, 5: the villa, the club
    fx(cut_t(4) + 0.02, lapping(0.7), -15, 0.2, "water", "the bay in front of the villa"); fx(cut_t(5) + 0.03, crackle(0.7, 70.0), -14, -0.3, "sparklers", "the club: sparklers on the bottles")
    # 6: the calendar
    a = cut_t(6)
    fx(a + f_(1), marker(0.2), -12, -0.2, "marker", "a circle round August 18"); fx(a + f_(3), pop(480, 900, 0.07), -13, -0.4, "pop", "THEFT flag")
    for k in range(10):
        fx(a + f_(6 + 2 * k), tick(1700.0 + 60 * k), -15, 0.1, "tick" if k % 3 == 0 else "", "thirty days crossed off, three to a tick")
    fx(F(25), tick(900.0), -15.5, 0, "", ""); fx(F(26), tick(900.0), -15.5, 0, "", "")
    EVENTS.append((F(25), "a clock", "two ticks on 'one month'"))
    fx(F(25, 4), marker(0.2), -12, 0.2, "marker", "a circle round September 18"); fx(F(25, 7), pop(480, 900, 0.07), -13, 0.3, "pop", "ARREST flag")
    # 7: his room
    for k in range(5):
        fx(cut_t(7) + 0.2 + 0.13 * k, click(), -19, 0.2)
    EVENTS.append((cut_t(7) + 0.2, "keys", "he types"))
    # 9: the globe
    fx(cut_t(9) + f_(4), pop(440, 990, 0.08), -12.5, -0.2, "pop", "the pin and the tag: SINGAPORE")
    fx(F(38, -2), whoosh(0.5, R, peak=0.5, f_lo=500, f_hi=2600, tail=0.2), -15, 0.2, "plane", "a small plane leaves, going east"); fx(F(38, 10), pop(520, 1040, 0.08), -12.5, 0.4, "pop", "the tag: THE U.S., OCT. 2023")
    # 10: the lobby
    for k in range(5):
        fx(cut_t(10) + f_(4 + 4 * k), blip(660.0 * 2 ** (k / 6)), -14, -0.3 + 0.15 * k, "blip", f"player {k + 1} of 5 joins the lobby")
    # 11, 12: the call
    fx(cut_t(11) + 0.15, keytone(697.0, 1209.0), -16, 0.2); fx(cut_t(11) + 0.3, keytone(770.0, 1336.0), -16, 0.2); fx(cut_t(11) + 0.45, keytone(852.0, 1477.0), -16, 0.2)
    EVENTS.append((cut_t(11) + 0.15, "telephone", "three keys: they dial"))
    fx(cut_t(12) + f_(2), pop(440, 990, 0.08), -12.5, 0.3, "pop", "INCOMING CALL: 'SECURITY TEAM'"); fx(cut_t(12) + 0.05, ringtone(0.75), -11.5, 0.3, "telephone", "the phone on his desk rings")
    # 13, 14: the paper faces
    fx(F(55, -1), step(), -14, 0.2, "step", "a paper face comes up: SECURITY TEAM"); fx(cut_t(14), step(), -13, 0.2, "step", "the paper face is swapped: EXCHANGE SUPPORT")
    # 15: the program
    fx(cut_t(15) + f_(2), pop(440, 990, 0.09), -13, 0.2, "pop", "a window: INSTALL TO PROTECT YOUR COINS?"); fx(cut_t(15) + f_(6), tick(), -18, 0.3, "tick", "a cursor")
    fx(F(68, 1), click(), -14.5, 0.2, "click", "INSTALL is pressed")
    fx(F(68, 3), buzz(0.34, 130.0), -11.5, 0, "buzzer", "REMOTE ACCESS: ON"); fx(F(68, 3), clang(), -13, 0)
    # 16, 17: the coins go
    fx(cut_t(16) + f_(3), pop(520, 1040, 0.08), -13, 0.4, "pop", "somebody's wallet, with a question mark"); fx(cut_t(16) + 0.2, rumble(1.6), -14, 0, "rumble", "the piles sink")
    for k in range(8):
        fx(cut_t(16) + 0.35 + 0.2 * k, clink(R), -16, -0.3 + 0.08 * k)
    EVENTS.append((cut_t(16) + 0.35, "coins", "coins fly up into the wallet"))
    fx(cut_t(17), tick(1200.0), -14, 0, "tick", "the counter starts"); fx(F(81), register(), -9.5, 0.2, "cash register", "the counter stops: $230 MILLION+")
    # 18-20: the flex
    fx(cut_t(18) + 0.05, rattle(0.5, R, density=24), -16, 0, "paper", "banknotes in the air"); fx(cut_t(19) + 0.02, lapping(0.8), -15, -0.2, "water", "the pool")
    fx(cut_t(20) + 0.02, whoosh(0.8, R, peak=0.6, f_lo=300, f_hi=2200, tail=0.3), -14, 0.3, "jet", "an engine winds up")
    # 21, 22: the club
    fx(cut_t(21) + 0.03, crackle(0.9, 70.0), -14, -0.3, "sparklers", "sparklers come in on bottles"); fx(cut_t(21) + f_(10), pop(900, 220, 0.06), -11.5, -0.2, "cork", "a cork")
    fx(cut_t(22) + f_(1), printer(0.5), -12, 0.3, "printer", "the bill prints")
    # 23, 24: the cars
    a23 = CUTS[23]
    for row in range(10):
        fx(f_(a23 + 3 + jsround(row * (Wf(105) - a23 - 8) / 9)), blip(520.0 * 2 ** (row / 12)), -15, -0.3 + 0.06 * row, "blip", f"three more cars: shelf {row + 1} of 10")
    fx(F(105), ding(1568.0, 0.6), -12, 0.2, "ping", "the counter stops: 31 CARS")
    fx(cut_t(24) + 0.03, engine(0.8, 70.0, 150.0), -14, -0.2, "engine", "the blue car on its turntable"); fx(F(108, 4), ding(1318.0, 0.7), -12, 0.2, "ping", "the price tag: $3,800,000")
    # 25: the feed
    fx(cut_t(25) + f_(5), whoosh(0.5, R, peak=0.3, f_lo=700, f_hi=3200, tail=0.15), -15, 0.2, "swipe", "the feed scrolls")
    for k in range(4):
        fx(cut_t(25) + 0.35 + 0.28 * k, blip(1320.0 + 220 * (k % 2), 0.05), -17, 0.3)
    EVENTS.append((cut_t(25) + 0.35, "likes", "hearts go up"))
    # 26, 27: the investigator
    fx(cut_t(26) + f_(3), pop(440, 990, 0.08), -13, 0.2, "pop", "a post comes up beside him"); fx(cut_t(27) + f_(2), step(), -14, -0.2, "step", "he steps up to the board")
    # 29: Miami
    fx(F(133), thud(0.8), -10, 0, "thud", "MIAMI, pinned where the strings meet")
    for k in range(3):
        fx(cut_t(29) + f_(8 * k + 6), tick(2300.0), -16, -0.3 + 0.3 * k, "tick" if k == 0 else "", "the glass goes from picture to picture")
    # 30, 31: the shared screen
    for k in range(4):
        fx(cut_t(30) + f_(5 + 4 * k), blip(880.0 * 2 ** (k / 12)), -15, -0.3 + 0.2 * k, "blip", f"viewer {k + 1} of 4 is watching")
    for k in range(13):
        fx(cut_t(30) + f_(14 + 4 * k), tick(2000.0 - 90 * k), -17, 0.1, "tick" if k % 2 == 0 else "", "the balance rolls down from 4,100: a counter, falling in pitch")
    fx(cut_t(30) + f_(62), tick(700.0), -12, 0, "tick", "the balance reaches 0")
    fx(F(147), marker(0.18), -12, 0.1, "marker", "a red ring closes round one of the people watching")
    fx(F(148), blip(990.0, 0.09), -11, 0.2, "blip", "REC: a recording light, two beeps"); fx(F(148, 9), blip(990.0, 0.09), -11, 0.2, "blip", "REC: a recording light, two beeps")
    # 32: the calendar again
    fx(cut_t(32) + f_(2), pop(480, 900, 0.07), -13, -0.4, "pop", "THEFT flag"); fx(F(152), pop(480, 900, 0.07), -13, 0.3, "pop", "ARREST flag")
    for k in range(5):
        fx(cut_t(32) + 0.1 + 0.26 * k, tick(900.0), -14, 0, "", "")
    EVENTS.append((cut_t(32) + 0.1, "a clock", "five ticks: a month goes by"))
    # 33: the arrest
    fx(cut_t(33) + 0.02, siren(1.3, 3.3, 660.0, 1180.0), -13, -0.3, "siren", "the F.B.I. at the villa"); fx(cut_t(33) + f_(2), step(), -13, 0, "step", "his hands go up")
    fx(F(159, 6), ratchet(5), -13, 0.2, "ratchet", "handcuffs")
    # 34, 35: the dock, the bay
    go = F(165, -3)
    fx(cut_t(34) + 0.02, lapping(1.2), -16, -0.2, "water", "the bay under the dock")
    fx(go - f_(1), whoosh(0.3, R, peak=0.6, f_lo=400, f_hi=2400, tail=0.08), -13, 0.2, "throw", "the phone leaves his hands")
    fx(go + f_(9), splash(), -9.5, -0.3, "splash", "the phone goes into the bay")
    fx(cut_t(35) + 0.05, bubbles(1.2), -13, 0, "bubbles", "under water: the phone sinks, NO SERVICE")
    # 36-39: the court
    fx(F(176, -2), step(), -13, -0.3, "step", "a card: GUILTY"); fx(F(176, 8), gavel(), -11, 0.2, "gavel", "the plea is taken")
    fx(F(185, 6), slide(420.0, 180.0, 0.16), -15, -0.2, "gulp", "he swallows")
    fx(F(188), tick(1500.0), -15, 0.2, "tick", "the judge leans over the bench")
    for k in range(3):
        fx(F(189, -2 + 3 * k), rattle(0.25, R, density=30), -17, 0.4 - 0.2 * k)
    EVENTS.append((F(189, -2), "wheels", "three toy cars roll onto the bench"))
    fx(F(197), step(), -14, -0.2, "step", "a hop on 'need'")
    fx(F(195, 2), slide(700.0, 1100.0, 0.5), -17, -0.2, "slide", "small cars go round his head")
    # 40, 41: the steps
    fx(F(204), step(), -14, -0.3, "step", "she points"); fx(F(209), step(), -14, 0.3, "step", "he shrugs")
    # 42: the lobby
    fx(cut_t(42) + f_(3), blip(660.0), -15, 0, "blip", "the lobby, bobbing")
    # 43, 44: the question
    fx(F(223, -2), knock(), -12, -0.4, "clunk", "a light on the crown: A, A CRIME BOSS")
    fx(F(227, -2), knock(), -12, 0.4, "clunk", "a light on the controller: B, A KID IN OVER HIS HEAD")
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
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ping", "click", "clunk", "paper", "step", "tick", "flap", "marker", "blip", "thud", "buzzer", "cash register", "splash", "plane", "throw"}


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
        f.write("# Thirty-Three Years and Four Days: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
