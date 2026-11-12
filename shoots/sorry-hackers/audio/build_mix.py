"""Soundtrack for the sorry hackers short: narration + an original score + effects that follow the picture.

    python shoots/sorry-hackers/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/sorryhack/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: two kinds of music that take turns, six quavers in a bar at 72 dotted crotchets a minute. The machine is in
G minor: a synthesizer bass, a square-wave arpeggio as an old computer would play it, ticks and a kick. It runs under
the attack, the group's entrance and the group hitting back. The apology is in B flat major, the same notes heard
sweetly: a harp, a recorder and a few voices singing "ah". Its tune is two falling notes, "sor-ry" (F, D), and it is
first heard on the word. No tune plays under any of the four quotations: each has one held chord and nothing else
(with nothing at all there, the render check reports a hole in the sound). The choir's chord for "we have morals and
we have a heart" sags by a semitone when a halo slips on "villains", and is cut dead by "One catch". The machine
loses a layer for every row of screens that goes dark and is silent by "off". The film ends on the recorder playing
the two notes the other way up, D then F, over a chord that does not resolve: a question.
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
from sfx_gen import whoosh, clink, rattle, vox, vowel_track  # noqa: E402

FPS = 30
TARGET_LUFS = -14.5
CEIL_DB = -2.3                 # leaves room for the AAC encode: the finished MP4 must stay under -1 dBFS
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
# One read far under what plays with it: "for" in "for the inconvenience" (6 LU under the take's level, with the banner unrolling
# and the tune's third bar on top of it: 7.1 LU under the bed before this, the only word under -1.5).
WEAK_WORDS: dict[int, tuple[float, float]] = {119: (3.5, -4.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "sorryhack", "story.ts")).read()
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
JOINS = {6, 15, 21, 38, 44}                                    # shots that carry on the take before them: not cuts
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))   # kit.ts smooth()

R = rng(20261112)
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
# Six quavers in a bar, two beats, 72 beats a minute; the machine in G minor and the apology in B flat major, which are the same
# seven notes. (The other five news films are in A minor at 112, D minor at 104, G major / E minor at 118, C minor swung at 130,
# all four in a bar, and F sharp minor at 174, three in a bar: this one shares no key, no tempo and no metre with them.)
# Bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so they are kept
# modest and the level is carried by what a phone does play (the arpeggio, the ticks, the harp, the recorder, the voices).
BPM = 72.0
BEAT = 60.0 / BPM
Q = BEAT / 3
BAR = 2 * BEAT
KICK, BASS_MIX = 0.5, 0.62
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
MACHINE = [(43, (67, 70, 74)), (43, (67, 70, 74)), (39, (67, 70, 75)), (38, (66, 69, 74))]                      # G minor, G minor, E flat, D
SWEET = [(46, (58, 62, 65)), (39, (58, 63, 67)), (41, (57, 60, 63)), (46, (58, 62, 65))]                       # B flat, E flat, F seven, B flat
# the apology's tune, bar by bar: (quaver, note, quavers). "Sor-ry" is the first bar; the third says it again on the dominant.
TUNE = [
    [(0, 77, 3), (3, 74, 3)],
    [(0, 79, 2), (2, 77, 1), (3, 75, 3)],
    [(0, 75, 3), (3, 72, 3)],
    [(0, 74, 2), (2, 72, 1), (3, 70, 3)],
]


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def machine_bar(t0, k, level, until=None, stop=None):
    """one bar of the machine, bar k of its four. level 1 = bass and ticks, 2 = + kick and the arpeggio, 3 = + a clap on the
    second beat. stop = {"arp", "hat", "kick", "bass": time}: the layers go one by one"""
    stop = stop or {}
    live = lambda t, layer: (until is None or t < until - 0.03) and t < stop.get(layer, 1e9) - 0.01
    root, notes = MACHINE[k % 4]
    for q, m, g in ((0, root, 1.0), (2, root + 12, 0.5), (3, root + 7, 0.8), (5, root + 12, 0.5)):
        if live(t0 + q * Q, "bass"):
            put("bass", subn(m, 0.34 if q in (0, 3) else 0.2), t0 + q * Q, g)
    for q in range(6):
        if live(t0 + q * Q, "hat"):
            put("drums", hat(0.5 if q % 3 == 0 else 0.3), t0 + q * Q, 1.0, 0.3 if q % 2 else -0.3)
    if level >= 2:
        for q in (0, 3):
            if live(t0 + q * Q, "kick"):
                put("drums", kick(KICK), t0 + q * Q)
        for q, m in enumerate((notes[0], notes[1], notes[2], notes[0] + 12, notes[2], notes[1])):
            if live(t0 + q * Q, "arp"):
                put("lead", chipn(m + 12), t0 + q * Q, 0.15, -0.35 + 0.14 * q)
    if level >= 3 and live(t0 + 3 * Q, "kick"):
        put("drums", clap(), t0 + 3 * Q, 0.45, 0.1)


def sweet_bar(t0, k, level, tune=None, until=None):
    """one bar of the apology, bar k of its four. level 1 = the harp, 2 = + a plucked bass and a triangle; tune = the bar of
    the tune that the recorder plays (with a glockenspiel an octave above it)"""
    live = lambda t: until is None or t < until - 0.03
    root, notes = SWEET[k % 4]
    for q, m in enumerate((root + 12, notes[0], notes[1], notes[2], notes[1], notes[0])):
        if live(t0 + q * Q):
            put("comp", harp(m + (12 if q else 0), 1.0), t0 + q * Q, (0.6 if q == 0 else 0.42) * R.uniform(0.92, 1.05), -0.3 + 0.12 * q)
    if level >= 2:
        for q in (0, 3):
            if live(t0 + q * Q):
                put("bass", bassn(root if q == 0 else root + 7, 0.7), t0 + q * Q, 0.9)
        if live(t0):
            put("hits", I.triangle(0.35, R, 0.8), t0, 0.5, 0.3)
    if tune is not None:
        for q, m, n in TUNE[tune]:
            if live(t0 + q * Q):
                put("lead", fife(m, n * Q * 0.9), t0 + q * Q, 0.42, -0.1)
                put("lead", glock(m + 12, 0.5 + 0.2 * n), t0 + q * Q, 0.1, 0.3)


def build_music():
    def machine(t0, t1, level, start=0, stop=None):
        n = 0
        while t0 + n * BAR < t1 - 0.05:
            machine_bar(t0 + n * BAR, start + n, level(t0 + n * BAR), until=t1, stop=stop)
            n += 1

    def thin(t0, t1, notes, g=0.13, warm=3000.0, att=0.35):
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=att, rel=0.5, warm=warm), t0, g)

    def gliss(t0, t1, lo=53, hi=82):
        """the harp runs up the scale of B flat and arrives at t1"""
        scale = [m for m in range(lo, hi + 1) if (m - 58) % 12 in (0, 2, 4, 5, 7, 9, 11)]
        for j, m in enumerate(scale):
            put("comp", harp(m, 0.7), t0 + (t1 - t0) * j / len(scale), 0.2 + 0.25 * j / len(scale), -0.5 + j / len(scale))

    def rolled(t, notes, g=0.5, gap=0.022):
        for j, m in enumerate(notes):
            put("comp", harp(m, 1.3), t + gap * j, g, -0.3 + 0.6 * j / max(1, len(notes) - 1))

    def sorry(t, second, g=0.5):
        """the two notes: F, then D"""
        put("lead", fife(77, second - t - 0.03), t, g, -0.1); put("lead", glock(89, 0.6), t, 0.12, 0.3)
        put("lead", fife(74, 0.55), second, g, -0.1); put("lead", glock(86, 0.8), second, 0.12, 0.3)

    def blow(t, low, high, g=1.0, dur=1.8):
        """a kettledrum and two brass notes a tritone apart"""
        put("hits", I.timpani(m2f(low), 0.95, R, dur), t, 1.0 * g)
        put("hits", I.brass(m2f(low), 0.8, 0.85, R, "tuba"), t, 0.5 * g)
        put("hits", I.brass(m2f(high), 0.8, 0.8, R, "horn"), t, 0.4 * g)

    # ---- 1: the attack. The machine at full strength from the first frame; it is cut off when the hoods appear.
    a1 = cut_t(3) - 0.04
    machine(0.0, a1, lambda t: 3)
    put("hits", I.cymbal(0.35, R, 1.2), 0.0, 0.3)
    EVENTS.append((0.0, "music in", f"the machine, in G minor, six quavers in a bar at {BPM:.0f} beats a minute: synthesizer bass, a square-wave arpeggio, ticks, a kick"))
    EVENTS.append((a1, "music cut dead", "the cut to the group: 'Then the hackers said sorry'"))

    # ---- 2: "sorry". The harp runs up to the word, and the recorder says it: F, D. One bar of the apology, and a chord that
    #         expects B flat and gets the machine instead.
    s0 = F(16)
    gliss(F(14), s0 - 0.02)
    sorry(s0, s0 + 0.42)
    sweet_bar(s0, 0, 1, until=cut_t(5) - 0.36)
    rolled(s0 + 6 * Q, (53, 57, 60, 63), 0.5)
    EVENTS.append((F(14), "harp run", "up the scale of B flat to the word 'sorry'"))
    EVENTS.append((s0, "recorder, two notes", "F, D: 'sor-ry'. The apology's tune is these two notes, and this is where it is first heard"))

    # ---- 3: the day. The machine without its arpeggio; the arpeggio comes back for the voice in the computers; all of it
    #         stops on "stopped".
    c0, c1 = cut_t(5), F(51)
    machine(c0, c1, lambda t: 1 if t < F(32) - 0.2 else 2)
    thin(F(33), cut_t(9), (73, 79), 0.1)
    EVENTS.append((c0, "the machine again", "bass and ticks for the date and the name; the arpeggio and the kick return for 'a voice came from their computers'"))
    EVENTS.append((F(33), "held notes", "C sharp over G, a tritone, while the screens talk"))
    put("hits", I.timpani(m2f(43), 0.7, R, 1.2), c1, 0.7)
    EVENTS.append((c1, "music cut dead", "on 'stopped': the appointments board turns to CANCELLED"))

    # ---- 4: back online. A chord that waits, and B flat major on "back".
    d0, d1 = cut_t(12), cut_t(13)
    put("comp", I.pad([m2f(m) for m in (53, 58, 60)], d1 - d0, 0.5, R, att=0.4, rel=0.3, warm=1300.0), d0, 0.42)
    put("comp", I.pad([m2f(m) for m in (46, 53, 58, 62)], cut_t(14) - d1 - 0.1, 0.5, R, att=0.12, rel=0.25, warm=1500.0), d1, 0.5)
    rolled(F(64), (58, 62, 65, 70, 74), 0.5); put("lead", glock(86, 1.2), F(64), 0.25, 0.2)
    EVENTS.append((d0, "held chord", "F with a fourth in it under the university's notice: it waits"))
    EVENTS.append((F(64), "harp chord", "B flat major on 'back': the first major chord that stays"))

    # ---- 5: the group. The whole machine, four bars; each letter of the name is a note of its chord.
    e0, e1 = cut_t(14), cut_t(18) - 0.04
    machine(e0, e1, lambda t: 3)
    step = (Wf(71) - Wf(70) - 6) / 4 / FPS
    for j, m in enumerate((67, 70, 74, 79)):
        put("lead", chipn(m, 0.36), F(70) + j * step, 0.3, -0.3 + 0.2 * j)
    EVENTS.append((e0, "the machine, all of it", "'A new group': four bars, G minor, G minor, E flat, D"))
    EVENTS.append((F(70), "four square notes", "G, B flat, D, G: one for each letter as it lights up"))

    # ---- 6: the apology. "Sor-ry" again on "apologized"; one high chord under its words.
    f0 = F(85)
    gliss(cut_t(18) + 0.03, f0 - 0.02)
    sorry(f0, f0 + 0.42); rolled(f0, (58, 62, 65, 70), 0.5)
    q0, q1 = F(86) + 0.06, WORDS[102]["end"] + 0.3
    thin(q0, q1, (70, 77, 84))
    EVENTS.append((f0, "recorder, two notes", "'sor-ry' again, on 'apologized', over a harp chord"))
    EVENTS.append((q0, "music out", "the group's words are read over one high chord and nothing else"))

    # ---- 7: the offer. The apology's tune, three bars of it: harp, plucked bass, triangle, recorder. It stops on the dominant.
    g0 = cut_t(22)
    for k in range(3):
        sweet_bar(g0 + k * BAR, k, 2, tune=k, until=F(122) - 0.05)
    EVENTS.append((g0, "the apology's tune", "three bars for the free key and the money: 'sor-ry', an answer, 'sor-ry' again on the dominant; the fourth bar is left to the choir"))

    # ---- 8: "we have morals". No tune: voices on one chord of B flat, the harp when the light comes down. The chord sags when
    #         the halo slips, and is cut off by "One catch".
    h0, h1, slip = F(122) + 0.05, cut_t(27) - 0.02, F(134, 3)
    put("comp", choir((58, 65, 70, 74), h1 - h0, droop=(slip - h0, -1.0), swell=0.9), h0, 1.5)
    gliss(F(125, -4), F(125, -4) + 0.42, 58, 86); put("lead", glock(94, 1.2), F(125, -4) + 0.42, 0.2, 0.2)
    EVENTS.append((h0, "voices, one chord", "'ah' on B flat major under 'we have morals and we have a heart': a chord, not a tune"))
    EVENTS.append((F(125, -4), "harp run", "the light comes down on them and three halos appear"))
    EVENTS.append((slip, "the chord sags", "a semitone, all the voices together: one halo slips on 'villains'"))
    EVENTS.append((h1, "music cut dead", "'One catch.'"))
    for i, m in ((135, 50), (136, 43)):
        put("bass", bassn(m, 0.9), F(i), 1.0); put("bass", bassn(m + 12, 0.6), F(i), 0.5)
    EVENTS.append((F(135), "two low notes", "D, G on 'One catch': the plucked bass alone"))
    k0, k1 = F(137) + 0.1, cut_t(30) - 0.12
    thin(k0, k1, (43, 50, 58), 0.34, warm=1100.0)
    EVENTS.append((k0, "music out", "'we are still going to keep the data' is read over one low chord of G minor"))

    # ---- 9: the university. Plain: a plucked bass on the beats and a held chord a bar, B flat, F, G minor, E flat.
    u0, u1 = cut_t(30), cut_t(34) - 0.05
    for k, (root, notes) in enumerate(((46, (58, 62, 65)), (41, (57, 60, 65)), (43, (58, 62, 67)), (39, (58, 63, 67)))):
        t = u0 + k * BAR
        for b in (0, 1):
            if t + b * BEAT < u1 - 0.1:
                put("bass", bassn(root if b == 0 else root + 7, 0.75), t + b * BEAT, 0.95)
        put("comp", I.pad([m2f(m) for m in notes], min(BAR, u1 - t) * 0.96, 0.5, R, att=0.12, rel=0.22, warm=1400.0), t, 0.45)
        put("lead", glock(notes[2] + 12, 0.9), t, 0.14, 0.25)
    EVENTS.append((u0, "plain chords", "the university's notice: a plucked bass on the beats and a held chord a bar, no tune and no drums"))

    # ---- 10: the group hits back. The whole machine; it loses a layer for every row of screens that goes dark.
    v0, flip, off = cut_t(34), Wf(181) + 2, Wf(185)
    rows = [(flip + 5 + (off - flip - 5) * r / 4) / FPS for r in range(4)]                         # when each row goes out, as in sets3.ts
    machine(v0, off / FPS, lambda t: 3, stop={"arp": rows[0], "hat": rows[1], "kick": rows[2], "bass": rows[3]})
    EVENTS.append((v0, "the machine, all of it", "'The group hit back'"))
    EVENTS.append((rows[0], "the machine comes apart", "the arpeggio, the ticks, the kick, the bass: one layer goes with each row of screens, and nothing is left by 'off'"))

    # ---- 11: the second campus. A calm chord; the machine's bass for the computers that talk; one low chord under the words
    #          of the recording, and a blow on "ground".
    w0 = cut_t(37)
    put("comp", I.pad([m2f(m) for m in (51, 58, 62, 67)], cut_t(39) - w0 - 0.15, 0.5, R, att=0.3, rel=0.3, warm=1500.0), w0 + 0.03, 0.42)
    EVENTS.append((w0, "held chord", "E flat with a seventh: a campus two weeks later"))
    machine(cut_t(39), F(198) - 0.04, lambda t: 1, start=3)
    EVENTS.append((cut_t(39), "the machine's bass", "one bar of it, on D: 'where computers reportedly said'"))
    x0, x1 = F(198) + 0.08, cut_t(42) - 0.1
    low = I.pad([m2f(m) for m in (43, 50, 61)], x1 - x0, 0.5, R, att=0.5, rel=0.4, warm=1100.0)
    put("comp", low * np.linspace(0.55, 1.0, low.shape[1])[None, :], x0, 0.36)
    EVENTS.append((x0, "music out", "the recording's words are read over one low chord, G and D with a C sharp on top, that grows"))
    blow(F(211), 43, 49, 0.8, 1.5)
    EVENTS.append((F(211), "hit", "kettledrum and brass a tritone apart on 'ground': the room shakes"))

    # ---- 12: nobody. A bare fifth.
    thin(cut_t(42) + 0.05, cut_t(43) - 0.1, (55, 62), 0.16, warm=1600.0, att=0.2)
    EVENTS.append((cut_t(42) + 0.05, "bare fifth", "G and D, neither major nor minor, under 'No one has been charged'"))

    # ---- 13: the question. The harp on the dominant; the voices for "a conscience", the square wave for "marketing"; and the
    #          two notes the other way up.
    z0, za, zb = cut_t(43), F(224, -2), F(226, -2)
    n = 0
    while z0 + n * Q < za - 0.1:
        put("comp", harp((53, 58, 60, 63, 60, 58)[n % 6] + 12, 1.0), z0 + n * Q, 0.4, -0.3 + 0.12 * (n % 6))
        if n % 3 == 0:
            put("bass", bassn(41, 0.7), z0 + n * Q, 0.85)
        n += 1
    EVENTS.append((z0, "harp on the dominant", "F with a fourth and a seventh: the question is coming"))
    put("comp", choir((58, 65, 70, 74), zb - za - 0.06, swell=0.12), za, 1.5); rolled(za, (58, 62, 65, 70, 74), 0.45)
    EVENTS.append((za, "voices, one chord", "'a conscience': the choir's B flat major"))
    for j, m in enumerate((67, 70, 74, 79)):
        put("lead", chipn(m + 12, 0.2), zb + j * 0.085, 0.3, -0.3 + 0.2 * j)
    put("bass", subn(43, 0.5), zb, 1.0); put("drums", kick(KICK), zb)
    EVENTS.append((zb, "four square notes", "'marketing': the machine's G minor"))
    e = WORDS[-1]["end"] + 0.17
    put("lead", fife(74, 0.17), e, 0.5, -0.1); put("lead", fife(77, 0.9), e + 0.2, 0.5, -0.1); put("lead", glock(89, 1.4), e + 0.2, 0.14, 0.3)
    rolled(e + 0.2, (53, 57, 60, 63), 0.42); put("bass", bassn(41, 1.0), e + 0.2, 0.8)
    EVENTS.append((e, "button", "the recorder: D, F. 'Sor-ry' the other way up, a voice going up at the end of a question, over F seven, which does not resolve"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 11, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, ns(cut_t(14)): ns(cut_t(18))]), integrated(v[:, ns(cut_t(22)): ns(cut_t(25))])) for k, v in BUS.items()}
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
    # Every cut gets a small swish, alternating sides. None where the camera carries straight on (the five joins) and none on
    # the four cuts in to somebody's exact words (19, 25, 28 and 40: each starts on the word "Quote").
    quiet = JOINS | {19, 25, 28, 40}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right; none on the {len(JOINS)} joins inside a take, none on the four cuts in to a quotation"))

    stamps = [(F(19, -2), "UP TO $2,500 EACH"), (F(38, 2), "A CLAIM"), (F(75), "UNCONFIRMED"), (F(108), "FREE KEY"), (F(155), "DO NOT RESPOND"), (cut_t(35) + f_(2), "ITS VERSION")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(F(1, 4), "Albuquerque, New Mexico, Oct. 26, 2026"), (F(4), "'diverted ambulance traffic', UNM Health"), (F(9), "name tag: UNM Hospital, 'the state's only Level 1 trauma center', AP"),
            (F(14), "the next day, on its own site"), (F(24), "name tag: UNM Health"), (F(31), "what employees told the Associated Press"), (F(40), "not confirmed by the university"),
            (F(44), "12:30 to 2:30 p.m., UNM Health"), (F(47), "'to other area health systems', UNM"), (F(52), "'for the remainder of the day', UNM"), (F(63), "'returned to normal operations', UNM, Oct. 27"),
            (F(66), "first seen about a month earlier, Gizmodo"), (F(70, 22), "no one has said who is behind it"), (cut_t(16), "tab: THE GROUP'S OWN WORDS"), (F(71, 2), "on its own leak site, BleepingComputer"),
            (F(79), "UNM: 'did not penetrate core systems or servers'"), (F(85, 6), "its post of Oct. 27, quoted by Gizmodo"), (F(87, -2), "quote card: 'we did not know'"), (F(106), "'(ONLY for the hospital sector)', its post"),
            (F(111), "'please provide us proof', its post"), (F(118), "the university: 'do not respond'"), (F(119, 2), "not known if anyone has been paid"), (F(123, -2), "quote card: 'we have morals'"),
            (F(138, -2), "quote card: 'we are still going to keep the data'"), (F(141), "what it holds: not confirmed by UNM"), (F(148), "one day after the offer"), (F(154), "UNM notice, Oct. 28, 2026"), (F(159), "'false offers of payments', UNM"),
            (F(165), "IC3.gov, the FBI's complaint center"), (cut_t(34), "tab: THE GROUP'S OWN WORDS"), (F(168), "its email to DataBreaches.net, published Nov. 2"), (F(175, -2), "quote card: 'a full panic attack'"),
            (F(192, 2), "Vanderbilt has not said who did it"), (F(196), "as The Register reported, Nov. 10, 2026"), (F(199, -2), "quote card: the recording"), (F(214), "no arrest reported, as of Nov. 12, 2026"),
            (F(216), "UNM: 'under criminal investigation'"), (F(219), "WHAT WAS THAT APOLOGY?"), (F(221), "'never seen' in 20 years, DataBreaches.net")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    def notify(t, why):
        fx(t, ding(1760, 0.3), -12, 0.3, "notification", why); fx(t + 0.09, ding(2217, 0.4), -13, 0.3)

    def high(t, why):
        fx(t, marker(), -13.5, -0.1, "marker", why)

    # 1: the entrance; the sign; the ambulance sent away
    fx(0.0, siren(1.25), -12, 0.4, "siren", "an ambulance pulls up to the emergency entrance")
    fx(0.0, engine(1.0, 95, 60), -16, 0.4)
    g0, g1 = F(1, 5), F(2, -1)
    fx(g0, zap(), -11, 0, "zap", "the sign over the door breaks up on 'cyberattack'")
    fx(g0 + 0.03, crackle(g1 - g0, 70), -14, 0)
    fx(g1, buzz(0.2, 147), -11, 0, "buzz", "and reads AMBULANCES DIVERTED")
    fx(F(2, 2), step(), -13, -0.4, "step", "the nurse steps out with a hand up")
    fx(cut_t(1) + 0.02, engine(0.85, 70, 125), -16, 0.3, "engine", "it has turned round, and goes")
    fx(cut_t(1) + 0.1, siren(0.75, bend=0.12), -15.5, 0.4)
    # the map
    fx(cut_t(2) + f_(3), knock(), -12.5, 0, "clunk", "a pin lands on Albuquerque")
    for k in range(2):
        fx(cut_t(2) + f_(9 + 28 * k), ding(988, 0.5), -15.5, 0, "ping", "a ring leaves the pin")
    # the group says sorry
    fx(F(16, -3), paper(), -12.5, 0, "paper", "a card comes up: SORRY")
    fx(cut_t(4) + f_(1), register(), -11, 0.3, "cash register", "one of them has banknotes, and dollar signs for eyes")
    fx(F(20), clink(R, 3400, 0.2), -14, 0.3)
    # 2: the day; the voice in the computers
    fx(F(21, 1), knock(), -13, -0.3, "clunk", "a calendar leaf: Oct 26")
    v0 = F(33, -3)
    fx(v0, zap(), -13.5, 0, "zap", "the screens at the nurses' station change: a loudspeaker on each")
    fx(v0 + 0.05, talk(shot_end(8) - v0 - 0.1), -16.5, -0.2, "computer voice", "a voice with no words in it (nobody has published what it said), from the screens until the cut")
    for i in range(2):
        fx(v0 + f_(1 + 3 * i), step(), -14.5, -0.3 + 0.5 * i, "step", "a nurse jumps")
    # 3: two hours; elsewhere; stopped; back
    a, b = Wf(43) + 2, Wf(45) + 14
    seen = 0
    for f in range(a, b + 1):
        k = min(4, int(5 * smoothstep(f, a, b) * 0.999))
        if k != seen:
            seen = k
            fx(f_(f), tick(1500 + 120 * k), -11.5, 0, "tick", f"the clock on the road sign: {('1:00', '1:30', '2:00', '2:30')[k - 1]}")
    for k in range(2):
        t = cut_t(10) + f_(30 * k)
        d = min(1.5, shot_end(10) - t - 0.02)
        fx(t, siren(d, bend=0.14), -13.5 - 1.5 * k, -0.5 + 0.9 * k, "siren", "an ambulance passes under the sign, toward OTHER HOSPITALS" if k == 0 else "and another behind it")
        fx(t, engine(d, 90, 120), -17, -0.5 + 0.9 * k)
    flap = F(51, -2)
    for k in range(7):
        fx(flap + 0.028 * k, tick(1300 + 90 * (k % 3)), -13, -0.1, "flap" if k == 0 else "", "the appointments board turns over: CANCELLED, four times")
    for i in range(2):
        fx(flap + f_(4 + 3 * i), step(), -14.5, -0.4 + 0.3 * i, "step", "a patient sits up")
    fx(cut_t(12) + f_(1), paper(), -13, 0.2, "paper", "the university's notice, Oct. 27, 2:02 p.m.")
    high(F(59), "the line is marked: 'are back online following'")
    fx(cut_t(13) + 0.02, engine(0.7, 110, 65), -15.5, 0.4, "engine", "an ambulance pulls in again")
    fx(cut_t(13) + f_(2), ding(1319, 0.5), -12, 0, "chime", "the sign over the door: EMERGENCY, OPEN")
    fx(cut_t(13) + f_(2) + 0.1, ding(1760, 0.7), -12.5, 0)
    # 4: the group
    for i in range(3):
        fx(F(65, 12 + 5 * i), step(), -13.5, -0.4 + 0.4 * i, "step", f"hood {i + 1} of 3 steps out of the dark")
    step_l = (Wf(71) - Wf(70) - 6) / 4 / FPS
    for j in range(4):
        fx(F(70) + j * step_l, tick(2500), -13.5, -0.3 + 0.2 * j, "click", f"the letter {'BYOD'[j]} lights up")
        fx(F(70) + j * step_l + 0.01, hum(0.3, 120), -19, -0.3 + 0.2 * j)
    for i in range(3):
        fx(cut_t(16) + f_(2 + 3 * i), blip(880 * (1.12 ** i), 0.07), -15, -0.4 + 0.4 * i, "blip", "a hood waves")
    for k in range(2):
        fx(cut_t(17) + f_(45 * k), slide(1900, 800, 0.5), -18.5, -0.3 + 0.6 * k, "scanner", "a bar of light runs down the wall of ID cards")
    # 5: the apology; the bedside
    fx(F(85, -2), paper(), -12.5, 0, "paper", "the SORRY card again")
    for k in range(4):
        fx(cut_t(20) + f_(2 + 27 * k), blip(988, 0.09), -17.5, 0.4, "monitor" if k == 0 else "", "the patient's heart monitor, which keeps going")
    fx(F(95, 3), buzz(0.16, 196), -12, -0.3, "buzz", "the computer on wheels locks")
    fx(F(95, 3) + 0.03, click(), -12.5, -0.3)
    fx(F(95, 4), step(), -14, -0.1, "step", "the nurse jumps")
    for k in range(4):
        fx(F(99, 12) + k * 0.2, pen(), -15.5, 0.1 + 0.05 * k)
    EVENTS.append((F(99, 12), "pen strokes", "she carries on by hand, on a clipboard"))
    # 6: the key; the offer; the banner
    for k in range(3):
        fx(F(104, -1) + 0.05 * k, clink(R, 3000 + 500 * k, 0.16), -13, 0.3, "jingle" if k == 0 else "", "a key is held up")
    notify(F(112, -2), "a headline arrives on the patient's phone: up to $2,500")
    fx(F(116), register(), -12.5, 0.3, "cash register", "'twenty-five hundred dollars'")
    fx(cut_t(24) + f_(1), paper(), -14.5, 0, "paper", "a banner is unrolled: SORRY FOR THE INCONVENIENCE")
    # 7: morals, a heart, not villains
    for i in range(3):
        fx(F(125, -2 + 2 * i), ding(m2f(86 + (0, 3, 8)[i]), 0.5), -14, -0.4 + 0.4 * i, "ping", f"halo {i + 1} of 3")
    fx(F(130, -2), pop(520, 1040, 0.09), -12.5, -0.3, "pop", "a heart is held up")
    fx(F(134, 3), slide(1250, 720, 0.26), -14, 0, "slip", "a halo slips sideways on 'villains'")
    # 8: the catch
    fx(F(136, -3), scrape(), -13, 0.4, "scrape", "a crate slides in: DATA")
    fx(F(136, 5), thud(0.8), -11, 0.3, "thud", "it stops")
    fx(F(143, 5), click(), -10.5, 0.1, "clack", "a padlock drops on to the crate")
    fx(F(143, 5) + 0.02, clink(R, 1700, 0.18), -12.5, 0.1)
    # 9: the university
    fx(cut_t(30) + f_(1), paper(), -13, 0.2, "paper", "the university's notice, Oct. 28, 12:39 p.m.")
    high(F(150), "the line is marked: 'UNM did not make concessions with any'")
    notify(F(154, -2), "the notice arrives on the phone: DO NOT RESPOND")
    fx(F(155, 2), step(), -14, -0.2, "step", "the phone goes down, the arms are crossed")
    fx(cut_t(32) + f_(2), ratchet(8), -13, 0.2, "reel", "a banknote on a hook")
    fx(cut_t(33) + f_(1), paper(), -13, 0.2, "paper", "the notice again: where to report it")
    high(F(164, 2), "the line is marked: the FBI's complaint center, IC3.gov")
    # 10: the group hits back; its telling of the outage
    fx(cut_t(34) + f_(3), slide(1300, 2900, 0.3), -13, 0.3, "squeal", "a megaphone is switched on")
    fx(cut_t(34) + f_(8), talk(shot_end(34) - cut_t(34) - f_(8) - 0.05, 185, 5.5, robot=False), -13, 0.3, "megaphone", "shouting with no words in it, until the cut")
    panic, flip, off = Wf(178) - 2, Wf(181) + 2, Wf(185)
    fx(f_(panic), klaxon(f_(flip - panic) + 0.1), -13.5, -0.3, "alarm", "the lamp on the switch flashes and every screen turns to a red exclamation mark: 'a full panic attack', in the group's telling")
    for k in range(6):
        fx(f_(panic) + 0.045 * k, tick(1700 + 120 * (k % 4)), -15, 0.3)
    fx(f_(flip + 4), knock(), -10.5, -0.3, "clunk", "the switch marked UNM goes over to OFF")
    fx(f_(flip + 5), clang(), -12.5, -0.3)
    for r in range(4):
        t = (flip + 5 + (off - flip - 5) * r / 4) / FPS
        fx(t, blip((880, 698, 554, 440)[r], 0.12), -13, 0.3, "row out", f"row {r + 1} of 4 goes dark: a lower note each time")
        fx(t + 0.01, click(), -15, 0.3)
    fx(f_(off), thud(0.7), -12.5, 0, "thud", "the last screen is out on 'off'")
    # 11: the second campus; the computers that talk; the ground
    fx(cut_t(37) + 0.03, bell(), -13.5, -0.2, "bell", "a campus clock tower, two weeks later")
    fx(F(186, 1), knock(), -13, -0.3, "clunk", "a calendar leaf: Nov 9")
    fx(cut_t(37) + 0.55, chirp(), -17, 0.5, "bird", "a quiet morning")
    fx(F(192, 4), buzz(0.14, 160), -14, 0.4, "phone buzz", "a student's phone, and her face")
    fx(F(192, 4) + 0.2, buzz(0.14, 160), -14.5, 0.4)
    lab = F(195, 2)
    fx(lab, zap(), -13.5, 0, "zap", "the screens in the computer lab change: a loudspeaker on each")
    fx(lab + 0.05, talk(F(198) - lab - 0.1, 104), -16, 0.2, "computer voice", "the voice with no words in it again; it stops before the recording's words are read")
    for i in range(2):
        fx(lab + f_(1 + 3 * i), step(), -14.5, -0.3 + 0.5 * i, "step", "a student jumps")
    fx(F(198) + 0.1, hum(cut_t(42) - F(198) - 0.2, 55), -19, 0, "machine hum", "under the recording's words")
    fx(F(206), rumble(F(211) - F(206)), -15, 0, "rumble", "the ground, before 'ground'")
    fx(F(211), thud(1.5), -9.5, 0, "boom", "the room shakes")
    fx(F(211) + 0.03, rattle(0.5, R, density=34), -13.5, 0.2)
    # 12: nobody in the line-up
    for k in range(3):
        fx(cut_t(42) + f_(1 + 3 * k), knock(), -12.5, -0.4 + 0.4 * k, "clunk", f"spotlight {k + 1} of 3 comes up on an empty mark")
    fx(cut_t(42) + f_(6), pop(440, 990, 0.09), -12.5, 0, "pop", "a question mark where somebody should stand")
    # 13: the question
    fx(cut_t(43) + f_(1), knock(), -12.5, 0, "clunk", "a spotlight on the three of them")
    fx(F(224, -2), knock(), -12, -0.4, "clunk", "a light on the one with the halo: A, CONSCIENCE")
    fx(F(226, -2), knock(), -12, 0.4, "clunk", "a light on the one with the megaphone: B, MARKETING")
    fx(F(226, 3), talk(0.42, 185, 5.5, robot=False), -13.5, 0.4, "megaphone", "one last squawk")
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
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ping", "click", "hit", "zap", "clunk", "chime", "paper", "step", "buzz", "tick", "flap", "marker", "cash register", "jingle", "notification", "blip",
                  "slip", "thud", "clack", "reel", "squeal", "alarm", "row out", "phone buzz", "boom", "scrape"}


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
    print("buses, LUFS before the mix (the machine, the apology's tune):", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# Sorry hackers short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
