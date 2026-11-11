"""Soundtrack for the Binance heist short: narration + an original score + effects that follow the picture.

    python shoots/binance-heist/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/binance/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tunes, their instruments and every effect cue are this film's own.

The score: a caper in C minor, 130 bpm, swung: a walking plucked bass, a ride cymbal, finger snaps, damped vibraphone
chords and a muted-brass riff that climbs C, E flat, F, F sharp, G. The fake company has its own music: a bossa in
E flat major, the kind a switchboard plays while you hold, which runs under both interviews and stops dead when the
painted office falls over. Nothing plays under the three statements about who did it. The film ends on the first
four notes of the riff, which stop on the F sharp: a question.
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
                 momentary, true_peak, read_wav, write_wav, phase, modal, norm_to, shelf, kfilt, colored)
import instruments as I  # noqa: E402
from sfx_gen import whoosh, clink, creak, rattle  # noqa: E402

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.3                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS
MUSIC_UNDER_VOICE = -5.5       # music loudness while someone is speaking, after ducking, LU relative to the voice.
                               # The user rejected scores 9-11 LU under the voice as inaudible and accepted 5-6 (IMPORTANT.md).
POCKET_DB = -5.5               # extra dip in the music's 1.2-5 kHz band under speech: room for consonants at that level
MUSIC_CEIL = -4.3              # while someone speaks, no 200 ms of music may be louder than this (LU relative to the voice,
                               # both measured above 300 Hz, where speech is understood and where a phone speaker plays):
                               # a stab that lands on a word is pulled back to the bed, one that lands in a gap is not
MUSIC_CEIL_FULL = -3.4         # the same for the whole spectrum, relative to the voice's programme loudness: a timpani roll or a full
                               # bar of kick and bass under a word is held to the level of the bed
DUCK_DB = -4.0                 # how far the music dips under speech (it comes up for the breaths and the ending)

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "binance", "story.ts")).read()
# JavaScript's Math.round sends a half up; Python's round() sends it to the even number. A word that starts on exactly half
# a frame would put a cut one frame away from where the picture has it, and the render check would report an unplanned jump.
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)                # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
TOTAL = jsround((WORDS[-1]["end"] + 1.55) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 45 and CUTS[0] == 0, CUTS
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS

R = rng(20261029)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ small synth voices
def kick(vel=1.0):
    t = tt(0.3)
    y = np.sin(phase(48 + 90 * np.exp(-t / 0.024))) * np.exp(-t / 0.1)
    y += hp(R.standard_normal(len(t)), 1800) * np.exp(-t / 0.002) * 0.2
    return fades(y * vel, 0.0004, 0.04)


def hat(vel=1.0):
    t = tt(0.06)
    return fades(hp(R.standard_normal(len(t)), 7600, 2) * np.exp(-t / 0.013) * vel * 0.5, 0.0003, 0.012)


def shaker(vel=1.0):
    t = tt(0.075)
    return bp(R.standard_normal(len(t)), 4500, 11000) * np.sin(np.pi * np.clip(t / 0.075, 0, 1)) ** 2 * vel * 0.3


_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


def ting(vel=1.0):
    """a ride cymbal's ping"""
    t = tt(0.26)
    y = hp(R.standard_normal(len(t)), 6500, 2) * np.exp(-t / 0.035) * 0.45 + modal(0.26, [(5230, 0.5, 0.1), (7410, 0.4, 0.08), (9180, 0.3, 0.05)], R) * 0.35
    return fades(y * vel, 0.0003, 0.03)


def snap(vel=1.0):
    """a finger snap"""
    t = tt(0.07)
    y = bp(R.standard_normal(len(t)), 1500, 4800) * np.exp(-t / 0.009) + modal(0.07, [(2350, 0.7, 0.012), (3900, 0.4, 0.008)], R)
    return fades(y * vel * 0.6, 0.0003, 0.012)


m2f = I.m2f
bassn = lambda m, d=0.55: cached(("bass", m, d), lambda: I.pluck(m2f(m), 0.85, R, d, 0.28, pos=0.22))
pizz = lambda m, d=0.5, b=0.5: cached(("pizz", m, d, b), lambda: I.pluck(m2f(m), 0.8, R, d, b))
vibd = lambda m, d=0.25: cached(("vibd", m, d), lambda: I.vibes(m2f(m), 0.6, R, d + 0.3, damp=d, trem_depth=0.1))
vib = lambda m, d=1.2: cached(("vib", m, d), lambda: I.vibes(m2f(m), 0.6, R, d))
glock = lambda m, d=1.0: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.7, R, d))
horn = lambda m, d=0.3, v=0.5: cached(("horn", m, d, v), lambda: I.brass(m2f(m), d, v, R, "stab", scoop=-35.0))
brush = lambda v=0.6, swish=False: I.brush(v, R, 0.3 if swish else 0.2, swish)


# ------------------------------------------------------------------------------------------------ music
# Two tunes. The caper: C minor, swung, 130 bpm: a walking plucked bass, a ride cymbal, finger snaps on two and four, damped
# vibraphone chords in the Charleston rhythm, and a muted-brass riff. And the fake company's hold music: a bossa in E flat major
# with vibraphone, glockenspiel and brushes. (The other three news films are in A minor at 112, D minor at 104, and G major / E minor
# at 118, all with straight eighths; this one shares no key, no tempo and no feel with them.)
# Kick and bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so they are
# kept modest and the level is carried by what a phone does play (ride, snaps, vibraphone, brass).
BPM = 130.0
B = 60.0 / BPM
BAR = 4 * B
SW = 2.0 / 3.0                                                 # where the swung off-beat falls inside a beat
KICK, BASS_MIX = 0.6, 0.62
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
FORM = ["Cm6", "Cm6", "Fm7", "G7", "Cm6", "Ab7", "G7", "Cm6"]
CH = {"Cm6": [60, 63, 67, 69], "Fm7": [60, 63, 65, 68], "G7": [59, 62, 65, 68], "Ab7": [60, 63, 66, 68]}
WALK = [[36, 39, 43, 45], [48, 46, 45, 43], [41, 44, 48, 42], [43, 41, 38, 35], [36, 39, 43, 45], [44, 48, 51, 44], [43, 41, 38, 35], [36, 39, 43, 38]]
# the riff, bar by bar of the form: (beat, note, seconds)
HOOKS = [
    [(0, 72, .26), (SW, 75, .18), (1, 77, .26), (1 + SW, 78, .18), (2, 79, .8)],
    [(1, 82, .26), (1 + SW, 79, .26), (2 + SW, 77, .18), (3, 75, .26), (3 + SW, 72, .5)],
    [(0, 80, .26), (SW, 77, .18), (1, 80, .26), (1 + SW, 84, .85)],
    [(1, 79, .26), (1 + SW, 83, .18), (2, 86, .7), (3 + SW, 79, .3)],
    [(0, 72, .26), (SW, 75, .18), (1, 77, .26), (1 + SW, 78, .18), (2, 79, .8)],
    [(1, 80, .26), (1 + SW, 78, .26), (2 + SW, 75, .18), (3, 72, .26), (3 + SW, 75, .5)],
    [(0, 74, .26), (SW, 77, .18), (1, 80, .26), (1 + SW, 79, .8)],
    [(1, 75, .26), (1 + SW, 72, .18), (2, 67, .26), (2 + SW, 70, .18), (3, 72, .7)],
]
HOLD = ["Ebmaj7", "Cm7", "Fm7", "Bb7"]
HCH = {"Ebmaj7": [63, 67, 70, 74], "Cm7": [60, 63, 67, 70], "Fm7": [60, 63, 65, 68], "Bb7": [58, 62, 65, 68]}
HROOT = {"Ebmaj7": (39, 46), "Cm7": (36, 43), "Fm7": (41, 48), "Bb7": (34, 41)}
HMEL = [[(0, 79), (1, 82), (1.5, 87), (2.5, 86), (3, 82)], [(0, 84), (1, 82), (1.5, 79), (3, 75), (3.5, 79)], [(0, 80), (1, 84), (1.5, 89), (2.5, 87), (3, 84)], [(0, 86), (1, 82), (2, 80), (3, 77)]]


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def caper_bar(t0, k, level, until=None):
    """one bar of the caper, bar k of the form. level 0 = a held chord and two bass notes, 1 = walking bass and ride,
    2 = + finger snaps, a feathered kick and vibraphone chords, 3 = + the brass riff, 4 = + a shaker in double time."""
    live = lambda t: until is None or t < until - 0.03
    notes, walk = CH[FORM[k % 8]], WALK[k % 8]
    if level == 0:
        if live(t0):
            put("comp", I.pad([m2f(m) for m in notes], min(BAR, (until or 1e9) - t0) * 0.97, 0.5, R, att=0.25, rel=0.25, warm=1100.0), t0, 0.6)
        for b in (0, 2):
            if live(t0 + b * B):
                put("bass", bassn(walk[b], 0.9), t0 + b * B, 0.95)
        return
    for b in range(4):
        t = t0 + b * B
        if not live(t):
            break
        put("bass", bassn(walk[b]), t, (1.0 if b % 2 == 0 else 0.88) * R.uniform(0.94, 1.04))
        put("drums", ting(0.5 if b % 2 == 0 else 0.62), t, 1.3, 0.25)
        if b % 2 == 1 and live(t + SW * B):
            put("drums", ting(0.34), t + SW * B, 1.3, 0.25)
        if level >= 2:
            if b % 2 == 1:
                put("drums", snap(R.uniform(0.9, 1.05)), t, 1.3, -0.2)
            if b == 0:
                put("drums", kick(KICK), t)
        if level >= 4:
            for j in range(3):
                if live(t + j * B / 3):
                    put("drums", shaker(0.42 if j == 0 else 0.28), t + j * B / 3, 1.0, -0.4)
    if level >= 2:
        for bt, d in (((0, 0.2), (1 + SW, 0.3)) if k % 2 == 0 else ((SW, 0.2), (2, 0.3))):
            t = t0 + bt * B
            if live(t):
                for j, m in enumerate(notes):
                    put("comp", vibd(m, d), t + 0.006 * j, 0.44 * R.uniform(0.92, 1.05), -0.3 + 0.2 * j)
    if level >= 3:
        for bt, m, d in HOOKS[k % 8]:
            t = t0 + bt * B
            if live(t):
                put("lead", horn(m, d), t, 0.3, -0.15)
                put("lead", vibd(m + 12, d), t, 0.16, 0.3)


def hold_bar(t0, k, until=None, gain=1.0):
    """one bar of the hold music: vibraphone chord on one and on the 'and' of two, a bossa bass, brushes, a glockenspiel tune"""
    live = lambda t: until is None or t < until - 0.03
    notes, (root, fifth) = HCH[HOLD[k % 4]], HROOT[HOLD[k % 4]]
    for i in range(8):
        t = t0 + i * B / 2
        if not live(t):
            break
        if i in (0, 3):
            for j, m in enumerate(notes):
                put("comp", vib(m, 1.0), t + 0.008 * j, 0.36 * gain, -0.3 + 0.2 * j)
        if i in (0, 4):
            put("bass", bassn(root, 0.6), t, 0.85 * gain)
        if i in (3, 7):
            put("bass", bassn(fifth, 0.45), t, 0.7 * gain)
        put("drums", brush(0.5 if i % 2 else 0.34, swish=(i % 2 == 0)), t, 1.1 * gain, 0.2)
        put("drums", shaker(0.3 if i % 2 else 0.2), t, 1.3 * gain, -0.35)
    for bt, m in HMEL[k % 4]:
        if live(t0 + bt * B):
            put("lead", glock(m, 0.8), t0 + bt * B, 0.36 * gain, 0.25)


def build_music():
    bar = [0]                                                       # where the form stands

    def groove(t0, t1, levels, start=None):
        """bars of the caper from t0 until t1; levels(t) gives the level of the bar that starts at t"""
        k0 = bar[0] if start is None else start
        n = 0
        while t0 + n * BAR < t1 - 0.05:
            caper_bar(t0 + n * BAR, k0 + n, levels(t0 + n * BAR), until=t1)
            n += 1
        bar[0] = (k0 + n) % 8

    def stop_chord(t, g=1.0):
        """the band stops on the dominant: G7, short"""
        for j, m in enumerate((55, 59, 62, 65)):
            put("lead", horn(m + 12, 0.16, 0.6), t, 0.3 * g, -0.3 + 0.2 * j)
        put("bass", bassn(31, 0.5), t, 1.0 * g); put("drums", kick(0.8), t, g); put("drums", snap(1.1), t, g)

    # ---- 1: the theft. The riff straight away; the band stops on the cut to the call; a first taste of the hold music.
    t1 = cut_t(2)
    groove(0.0, t1, lambda t: 3, start=0)
    put("hits", I.cymbal(0.4, R, 1.4), 0.0, 0.35)
    stop_chord(t1)
    EVENTS.append((0.0, "music in", f"the caper: C minor, {BPM:.0f} bpm, swung: walking plucked bass, ride cymbal, finger snaps, vibraphone chords, a muted-brass riff"))
    EVENTS.append((t1, "the band stops", "on the cut to the video call, for 'Their way in?'"))
    th = Wt(18)
    hold_bar(th, 0, until=cut_t(3))
    EVENTS.append((th, "hold music, four notes", "the fake company's own tune, under 'fake job interview': a bossa in E flat major, vibraphone and glockenspiel"))

    # ---- 2-5: the record, June, the board, September. One stretch of the caper; the riff only for the record.
    ta, stop_a = cut_t(3), cut_t(15) - 0.04
    lv = lambda t: 3 if t < cut_t(5) - 0.4 else 1 if t < cut_t(9) - 0.4 else 2 if t < cut_t(12) - 0.4 else 1 if t < cut_t(14) - 0.4 else 2
    groove(ta, stop_a, lv, start=0)
    EVENTS.append((ta, "caper back", "with the riff for the record; bass and ride only in the office and at the engineer's home; snaps and chords in the hackers' room"))
    for j, m in enumerate((84, 87, 91, 96)):                          # where the crypto sits: it glitters
        put("lead", glock(m, 0.9), cut_t(11) + 0.12 + j * 0.09, 0.4, -0.3 + 0.2 * j)
    EVENTS.append((cut_t(11) + 0.12, "glockenspiel run", "four notes up: the piles in the vault glitter"))

    # ---- 6-7: the interviews. Hold music from the moment the first call opens until the painted office hits the floor.
    tb, land = cut_t(15), (Wf(110) + 13) / FPS
    k = 0
    while tb + k * BAR < land - 0.05:
        hold_bar(tb + k * BAR, k, until=land)
        k += 1
    EVENTS.append((tb, "hold music", "the fake company's bossa plays under both interviews, on the engineer's side of the call as well"))
    EVENTS.append((land, "music cut dead", "the painted office lands on 'exist': the hold music stops with it"))

    # ---- 8: the assignment. A held chord and two bass notes a bar; one blow on 'malware'; nothing under the spoiler.
    tc, mal = cut_t(21), Wt(128)
    groove(tc, cut_t(23) - 0.05, lambda t: 0, start=0)
    EVENTS.append((tc, "caper, held back", "one held chord and two bass notes a bar while the file comes down"))
    put("hits", I.timpani(m2f(36), 0.9, R, 1.6), mal, 0.9)
    put("hits", I.brass(m2f(36), 0.7, 0.85, R, "tuba"), mal, 0.5); put("hits", I.brass(m2f(42), 0.7, 0.8, R, "horn"), mal, 0.4)
    EVENTS.append((mal, "hit", "timpani and low brass a tritone apart on 'malware'"))

    # ---- 9: through the network. The caper again, second half of the form; the riff when the wallet engineers' machines go.
    td = cut_t(25)
    groove(td, cut_t(29) - 0.04, lambda t: 2 if t < cut_t(27) - 0.4 else 3, start=4)
    EVENTS.append((td, "caper back", "snaps and chords along the wire; the riff for 'took over'"))

    # ---- 10: the night itself. Double time until the money is gone, then a held chord under 'the last', and it stops with the clock.
    te, last = cut_t(29), cut_t(31)
    groove(te, last - 0.04, lambda t: 4, start=0)
    EVENTS.append((te, "caper, double time", "a shaker in triplets joins: the twenty minutes"))
    groove(last, Wt(166) + 0.05, lambda t: 0, start=6)
    EVENTS.append((last, "music thins", "one held chord while the hands run to 23:56; it ends on the clock's chime"))

    # ---- 11: who did it. No tune under any of the three statements: a blow for the alert, a drum for the reply, plucked notes for the president.
    tf = Wt(169)
    put("hits", I.timpani(m2f(36), 1.0, R, 2.0), tf, 1.0)
    put("hits", I.brass(m2f(36), 0.9, 0.85, R, "tuba"), tf, 0.5); put("hits", I.brass(m2f(55), 0.9, 0.8, R, "horn"), tf, 0.4)
    EVENTS.append((tf, "hit", "timpani and brass on 'F.B.I.'"))
    for ts, v in I.snare_roll(Wt(170), Wt(171) - 0.02, 0.12, 0.45, R, rate=26):
        put("drums", I.snare(v, R, 0.2, 1.1), ts, 0.5)
    put("hits", I.timpani(m2f(31), 0.9, R, 1.8), Wt(171), 0.9)
    EVENTS.append((Wt(170), "snare roll into a timpani note", "under 'says', landing on 'North Korea' as the map turns red"))
    put("hits", I.timpani(m2f(38), 0.8, R, 1.6), Wt(175), 0.8)
    EVENTS.append((Wt(175), "timpani", "one note for the reply from Pyongyang"))
    q0, q1 = Wt(179), WORDS[182]["end"] + 0.3
    put("comp", I.pad([m2f(m) for m in (74, 79, 86)], q1 - q0, 0.5, R, att=0.4, rel=0.6, warm=3000.0), q0, 0.13)
    EVENTS.append((q0, "music out", "the reply is read over a thin, high chord and nothing else"))
    put("bass", bassn(43, 0.8), Wt(183), 0.9); put("bass", bassn(38, 0.8), Wt(185), 0.8)
    p0, p1 = Wt(186), WORDS[193]["end"] + 0.25
    put("comp", I.pad([m2f(m) for m in (67, 74, 79)], p1 - p0, 0.5, R, att=0.3, rel=0.5, warm=3000.0), p0, 0.13)
    EVENTS.append((Wt(183), "two bass notes", "'And President Trump?': G, then D; his sentence is read over one thin open fifth, like the reply before it"))
    put("lead", pizz(67, 0.5, 0.6), WORDS[193]["end"] + 0.04, 0.6); put("lead", pizz(73, 0.7, 0.6), WORDS[193]["end"] + 0.04 + SW * B, 0.6)
    EVENTS.append((WORDS[193]["end"] + 0.04, "two plucked notes", "rising a tritone after 'if it's North Korea': nobody has settled it"))

    # ---- 13-14: no charges, the ice, the refund, the wall. The caper comes back from the bottom up and stops on the dominant.
    tg, stop_g = cut_t(38), Wt(221) + 0.42
    groove(tg, stop_g, lambda t: 1 if t < cut_t(40) - 0.4 else 2 if t < cut_t(42) - 0.4 else 3, start=0)
    stop_chord(stop_g, 0.9)
    EVENTS.append((tg, "caper back", "bass and ride for the empty dock and the ice, snaps and chords for the refund, the riff for the months on the wall"))
    EVENTS.append((stop_g, "the band stops", "on the dominant, as 'campaign' ends: the question is next"))

    # ---- 15: the question. One chord that does not resolve, and the first four notes of the riff, which stop on the F sharp.
    z = cut_t(43) + 0.05
    for j, m in enumerate((55, 60, 62, 65, 67)):
        put("comp", vib(m + 12, 3.4), z + 0.02 * j, 0.55, -0.4 + 0.2 * j)
    put("comp", I.pad([m2f(m) for m in (55, 60, 62, 65, 67)], 3.9, 0.5, R, att=0.05, rel=1.0, warm=1500.0), z, 0.45)
    put("bass", bassn(31, 1.2), z, 1.0); put("bass", bassn(43, 1.2), z, 0.6)
    EVENTS.append((z, "open chord", "G with a fourth and a seventh on the vibraphone: it hangs under the question and does not resolve"))
    e = WORDS[-1]["end"] + 0.2
    for j, (bt, m) in enumerate(((0, 72), (SW, 75), (1, 77), (1 + SW, 78))):
        put("lead", horn(m, 0.9 if j == 3 else 0.22, 0.5), e + bt * B, 0.26, -0.15); put("lead", vib(m + 12, 1.4 if j == 3 else 0.5), e + bt * B, 0.24, 0.3)
        put("bass", bassn((36, 39, 41, 42)[j], 1.0 if j == 3 else 0.4), e + bt * B, 0.7)
    put("drums", snap(0.8), e + (1 + SW) * B)
    EVENTS.append((e, "button", "the first four notes of the riff, C, E flat, F, F sharp, and it stops there: a question mark"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.0, 9, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, ns(cut_t(3)): ns(cut_t(5))]), integrated(v[:, ns(cut_t(15)): ns(cut_t(19))])) for k, v in BUS.items()}
    return shelf(hp(dry + 0.18 * wet, 38), 3500, 3.0)[:, :N]


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


def key():
    t = tt(0.06)
    y = bp(R.standard_normal(len(t)), 1800, 6500) * np.exp(-t / 0.004)
    return fades(y + modal(0.06, [(3200 * R.uniform(0.85, 1.15), 0.5, 0.004), (520 * R.uniform(0.9, 1.1), 0.4, 0.012)], R), 0.0003, 0.01)


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


def hiss(d, lo=2500.0, hi=9000.0, rise=True):
    """steam, a hose, something frying"""
    t = tt(d)
    env = (t / d) ** 0.7 if rise else np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    return fades(bp(R.standard_normal(len(t)), lo, hi) * env * (0.75 + 0.25 * np.sin(TAU * 13 * t)), 0.02, 0.08)


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


def coins(d, rate=18.0):
    """a stream of coins: a cloud of small bright clinks"""
    y = np.zeros(ns(d + 0.2))
    for _ in range(int(d * rate)):
        c = clink(R, f0=R.uniform(2600, 5400), dur=0.1, bright=1.1)
        i = int(R.integers(0, ns(d)))
        y[i: i + len(c)] += c[: len(y) - i] * R.uniform(0.4, 1.0)
    return y


def squeak():
    """a marker pen drawing a ring"""
    t = tt(0.14)
    ph = phase(1700 + 900 * (t / 0.14) + 120 * np.sin(TAU * 31 * t))
    return fades((np.sin(ph) + 0.3 * np.sin(2 * ph)) * (0.5 + 0.5 * np.sin(np.pi * t / 0.14)) + 0.15 * hp(R.standard_normal(len(t)), 5000), 0.01, 0.02)


def shutter():
    """a press camera: two clicks 40 ms apart"""
    y = np.zeros(ns(0.12)); a, b = tick(2600), click()
    y[: len(a)] += a; i = ns(0.04); y[i: i + len(b)] += b[: len(y) - i]
    return y


def gavel():
    t = tt(0.25)
    return fades(modal(0.25, [(310, 1.0, 0.05), (640, 0.7, 0.03), (1180, 0.35, 0.015)], R) + lp(R.standard_normal(len(t)), 500) * np.exp(-t / 0.012) * 1.2, 0.0003, 0.04)


def buzz(d=0.16, f=196.0):
    """an error buzzer: a low square wave"""
    t = tt(d)
    return fades(lp(np.sign(np.sin(TAU * f * t)) * 0.6 + 0.4 * np.sign(np.sin(TAU * f * 1.5 * t)), 2600), 0.004, 0.02)


def paper():
    t = tt(0.16)
    return fades(bp(R.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * np.clip(t / 0.16, 0, 1)) ** 0.5 * (0.6 + 0.4 * np.sin(TAU * 40 * t)), 0.005, 0.03)


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
    # Every cut gets a small swish, alternating sides. None where the camera carries straight on (4, 17, 20, 42, 44 are not cuts)
    # and none on the two cuts in to somebody's exact words (35, 37).
    quiet = {4, 17, 20, 35, 37, 42, 44}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right; none on the five joins inside a take, none on the two cuts in to a quote"))

    stamps = [(Wt(17), "A FAKE JOB INTERVIEW"), (Wt(23), "RECORD CRYPTO HEIST"), (Wt(29), "OVER 4X THE LAST ONE"), (Wt(54), "CAUGHT"), (Wt(88), "INTERVIEW 1"), (Wt(103), "INTERVIEW 2"),
              (Wt(128), "MALWARE"), (Wt(132), "JOB: NOT FOUND"), (Wt(147), "TAKEN OVER"), (Wt(159), "ABOUT 20 MINUTES"), (Wt(164), "23:56 UTC"), (Wt(171), "“NORTH KOREA RESPONSIBLE”"),
              (Wt(196), "CHARGED: NOBODY"), (Wt(201), "$2.85 BN OF $6.34 BN"), (Wt(209), "“COVERING EVERY LOSS”")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(Wt(8), "October 29, 2026"), (Wt(25) - f_(2), "$6.34 bn on the tall pile"), (Wt(31), "the last one: Bybit, 2025"), (Wt(38) - f_(2), "calendar: June 2026"), (cut_t(6) + f_(1), "the search card"),
            (Wt(46), "reportedly a search ad, Reuters"), (Wt(55), "'replaced the device', Binance"), (Wt(60), "'exposed to the hacker', Binance"), (Wt(67), "name tag: hot wallets"), (Wt(72) - f_(2), "calendar: September 2026"),
            (Wt(79), "on a real job site, Binance"), (Wt(86), "the mask goes on; name tag: 'project director'"), (cut_t(15) + f_(1), "the call opens on the engineer's screen"), (Wt(90), "live, on video"),
            (Wt(93), "name tag: 'H.R. rep'"), (Wt(97), "photo: the beach"), (Wt(97) + f_(7), "photo: the dog"), (Wt(97) + f_(14), "photo: the birthday"), (Wt(100), "'to build trust', Binance's report"),
            (cut_t(18) + f_(1), "the chat opens on the engineer's screen"), (Wt(106), "name tag: 'the CEO'"), (Wt(109), "'a fictitious company', Binance"), (cut_t(21) + f_(1), "the assignment arrives"),
            (Wt(117), "'instructed to download', Binance"), (Wt(123), "'onto his work computer', Binance"), (cut_t(23) + f_(1), "the bug"), (Wt(128) + f_(6), "'not detected', Binance's report"),
            (Wt(134), "calendar: October 20"), (Wt(139), "how it was used: not published"), (Wt(148) + f_(2), "engineers 'A' and 'C', Binance"), (Wt(150), "calendar: October 29"), (Wt(161), "most of it, TRM Labs"),
            (Wt(165) + f_(3), "last transfer, Binance's report"), (Wt(169), "name tag: FBI"), (Wt(173), "from the title of the FBI's alert"), (Wt(175) + f_(2), "name tag: KCNA"), (Wt(179), "quote card: Kim Yo Jong's statement"),
            (Wt(184), "name tag: President Trump"), (cut_t(37) + f_(1), "name tag, lower"), (Wt(186), "quote card: the president"), (Wt(197), "no arrests either"), (Wt(203), "'frozen or intercepted'"),
            (Wt(204), "Binance's report, Nov 3"), (Wt(210) + f_(3), "Richard Teng, Binance co-CEO"), (Wt(213), "quote card: Richard Teng"), (Wt(223), "WHOSE JOB WAS IT?"), (Wt(226), "Binance, Oct 30: no individual blamed"),
            (Wt(231), "card A"), (Wt(234), "card B")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    def roll(a, z, f0=1500.0, f1=3000.0, step_s=0.05, lu=-22.5):   # a counter: a dozen ticks per 400 ms sits about 10 LU louder than one tick
        t = a
        while t < z:
            u = (t - a) / (z - a)
            fx(t, tick(f0 + (f1 - f0) * u), lu + 2 * u, 0.1)
            t += step_s - 0.02 * u

    def keys(words, per=3):
        for i in words:
            for j in range(per):
                fx(Wt(i) + j * 0.06 * R.uniform(0.8, 1.2), key(), -17, R.uniform(-0.2, 0.2))

    def call_tone(t, up=True, name="", why=""):
        for j, f in enumerate((1175, 1568) if up else (1568, 1175)):
            fx(t + j * 0.11, blip(f, 0.1), -14, 0.3, name if j == 0 else "", why)

    # 1: the vault, the tower, the call
    fx(0.1, coins(1.7), -15, 0.25, "coin stream", "the piles drain through the hole in the vault wall")
    a, z = (Wf(2) - 2) / FPS, (Wf(5) + 5) / FPS
    fx(a, pop(500, 1100), -13, 0, "pop", "the counter appears")
    roll(a, z)
    EVENTS.append((a, "counter ticks", "the sum rolls up to $6.3 billion"))
    fx(z, ding(1568, 0.9), -10.5, 0, "counter lands", "$6.3 BILLION")
    fx(cut_t(1) + 0.05, coins(2.0, 14), -17, 0.4, "coin stream", "out of the tower and away")
    call_tone(cut_t(2) + 0.08, True, "call tone", "a video call connects: two rising notes")
    # 2: the record
    fx(cut_t(3) + 0.1, slide(220, 660, 0.72), -15, 0.2, "rising tone", "the tall pile comes up out of the floor")
    for i in range(4):
        fx(Wt(28) + f_(2 + i * 6), ding(1047 * 2 ** (i / 6), 0.5), -12.5, -0.3 + 0.1 * i, "ping", f"the old record stacked up {i + 2} times")
    # 3: June
    keys((36, 37))
    EVENTS.append((Wt(36), "typing", "an engineer at work"))
    fx(Wt(45), click(), -11, 0.3, "click", "the pointer clicks DOWNLOAD on the first result, the advertisement")
    roll(Wt(45), Wt(45) + 0.4, 1200, 2400, 0.05, -24)
    fx(Wt(47) + f_(1), pop(300, 110, 0.14), -11.5, 0.3, "pop", "the box lands and opens its eyes: a rigged copy")
    # 4: caught; the board
    for k in range(3):
        fx(cut_t(8) + 0.04 + k * 0.13, blip(1760 if k % 2 == 0 else 1320, 0.09), -14, 0.3)
    EVENTS.append((cut_t(8) + 0.04, "alarm, two tones", "security has seen it"))
    for k in range(3):
        fx(Wt(62) + f_(1 + k * 6), squeak(), -13, -0.3 + 0.3 * k, "marker", "a red ring round one of the wallet team")
    # 5: September
    keys((73, 74))
    msg = Wt(77) - f_(1)
    fx(msg, ding(1760, 0.5), -11.5, 0.3, "ding", "a message arrives on the job site")
    fx(msg + 0.09, ding(2217, 0.6), -12.5, 0.3)
    # 6-7: the interviews
    call_tone(cut_t(15) + 0.05, True, "call tone", "interview one connects")
    call_tone(cut_t(18) + 0.05, True, "call tone", "interview two: a chat opens")
    fx(cut_t(20), whoosh(0.3, R, peak=0.08, f_lo=700, f_hi=3200, tail=0.12), -14, 0, "frame off", "the camera backs out of the call and its frame flies apart")
    fx(Wt(110), creak(0.42, R), -13, 0.3, "creak", "the painted office starts to tip")
    land = (Wf(110) + 13) / FPS
    fx(land, thud(1.4), -6.5, 0.2, "hit", "it lands flat: there is a back room behind it. The COMPANY: NOT FOUND stamp lands with it")
    fx(land + 0.03, rattle(0.5, R, density=30), -14, 0.3)
    # 8: the assignment
    roll(Wt(117), Wt(119) + f_(8), 1300, 2600, 0.055, -24)
    EVENTS.append((Wt(117), "progress ticks", "the download bar fills"))
    fx(Wt(120) - f_(12), slide(1500, 500, 0.28), -15, 0.2, "falling whistle", "the file drops into the laptop")
    fx(cut_t(22) + f_(5), ding(2093, 0.7), -11.5, 0.3, "ding", "a green tick over the lid: it is on the work computer")
    for k in range(3):
        fx(cut_t(23) + f_(2) + k * 0.2, buzz(0.15, 196 if k % 2 == 0 else 147), -12.5, 0.2, "buzzer" if k == 0 else "", "the room turns red")
    # 9: the wire, the assistant, the two machines
    fx(Wt(134) + f_(2), slide(180, 520, 1.9), -19, -0.2, "rising hum", "the wire lights up from the second engineer's computer")
    taken = Wt(140)
    fx(taken, zap(), -12, 0, "zap", "the assistant's face changes")
    fx(taken + 0.03, slide(900, 240, 0.3), -14, 0, "", "")
    keys((142, 143, 144, 145), 4)
    EVENTS.append((Wt(142), "typing", "two of them at the controls"))
    for k, t in enumerate((Wt(147), Wt(148) + f_(2))):
        fx(t + f_(1), zap(), -12.5, -0.3 + 0.6 * k, "zap", f"engineer {'AC'[k]}'s machine is taken")
        fx(t + f_(2), slide(700, 200, 0.26), -15, -0.3 + 0.6 * k)
    # 10: the clock
    k, t = 0, cut_t(29) + 0.05
    while t < cut_t(30) - 0.05:
        fx(t, tick(1900 if k % 2 == 0 else 1500), -15, 0.2)
        k += 1; t += 0.25
    EVENTS.append((cut_t(29) + 0.05, "clock ticks", "20:05 on the vault clock"))
    fx(cut_t(30) + f_(1), pop(300, 760, 0.1), -12, 0.3, "pop", "the hole opens")
    fx((Wf(152) - 3) / FPS, coins((Wf(161) + 2 - Wf(152) + 3) / FPS, 22), -13.5, 0.3, "coin stream", "the piles empty through the hole while the clock's red wedge grows to twenty minutes")
    roll(cut_t(31) + f_(2), Wt(166), 1500, 2800, 0.045, -22)
    EVENTS.append((cut_t(31) + f_(2), "fast ticks", "the hands run on to 23:56"))
    fx(Wt(166) - f_(1), clink(R, 3600), -13, 0.5, "clink", "the last coin goes")
    fx(Wt(166), ding(880, 1.3), -10.5, 0, "chime", "23:56: the clock strikes and shakes")
    fx(Wt(167) + f_(3), pop(900, 240, 0.09), -12, 0.5, "pop", "the hole closes")
    # 11: FBI, Pyongyang
    fx(Wt(169) + f_(6), knock(), -13, 0.3, "click", "the agent's pointer on the map")
    fx(Wt(177), paper(), -14, 0.2, "click", "the statement is held up")
    # 12: Mar-a-Lago
    for k, t in enumerate((cut_t(36) + 0.06, cut_t(36) + 0.3, cut_t(36) + 0.62, Wt(186) - 0.1)):
        fx(t, shutter(), -15 - (k == 3) * 3, (-0.5, 0.5, -0.2, 0.4)[k])
    EVENTS.append((cut_t(36) + 0.06, "camera shutters", "reporters on the terrace"))
    fx(Wt(187), shutter(), -17, 0.4, "click", "a camera fires as the president shrugs on 'we don't know'")
    # 13: the court, the ice
    fx(cut_t(38) + 0.04, gavel(), -11.5, 0.3, "gavel", "a court, and nobody in the dock")
    fx(cut_t(38) + 0.24, gavel(), -12.5, 0.3)
    fx(Wt(199), slide(1300, 320, 0.7), -16, 0.2, "falling whistle", "eleven of the twenty piles are gone")
    cold = Wt(205)
    for k in range(3):
        fx(cold + f_(k * 3), clink(R, 2400 + 500 * k, 0.16), -12.5, -0.3 + 0.3 * k, "ice" if k == 0 else "", "ice comes down on the other nine")
    fx(cold, crackle(0.6, 60), -16, 0)
    # 14: the refund, the wall
    fx(Wt(208), coins(1.0, 16), -15, 0, "coin stream", "out of the door, to the customers")
    fx(Wt(209) + f_(3), ding(2093, 0.5), -11.5, 0.2, "ding", "the cash register: customers are paid back")
    fx(Wt(209) + f_(5), ding(2637, 0.7), -12.5, 0.2)
    fx(Wt(216), squeak(), -13, -0.3, "marker", "a red ring round June's rigged tool")
    s0, s1 = cut_t(42), (Wf(222) - 16) / FPS
    for k, (u, m) in enumerate(((0.326, 72), (0.5, 75), (0.674, 79), (1.0, 84))):
        fx(s0 + u * (s1 - s0), I.pluck(I.m2f(m), 0.8, R, 0.5, 0.6), -13, -0.4 + 0.27 * k, "pluck", f"the red string reaches {('July', 'August', 'September', 'October')[k]}")
    # 15: the question
    for k, t in enumerate((Wt(231), Wt(234))):
        fx(t - f_(2), knock(), -12.5, -0.4 + 0.8 * k, "clunk", f"a spotlight comes up on {('the engineer', 'the company')[k]}")
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


# sounds that go with something arriving in the picture: the ten frames from each are allowed to jump
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ding", "ping", "counter lands", "click", "hit", "marker", "call tone", "frame off", "zap", "clunk", "chime", "ice", "gavel", "buzzer", "falling whistle"}


SOLO = {6, 25, 45, 117, 139, 170, 189, 224}                         # the same words Captions.tsx keeps on their own


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
    print("buses, LUFS before the mix (caper with riff, hold music):", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# Binance heist short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
