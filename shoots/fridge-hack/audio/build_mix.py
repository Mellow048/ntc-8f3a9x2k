"""Soundtrack for the fridge hack short: narration + an original score + effects that follow the picture.

    python shoots/fridge-hack/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/fridge/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the news
reference uses; the tune, its instruments and every effect cue are this film's own.

The score: shop music in F major (vibraphone, plucked bass, brushes) that melts like a tape slowing down when the
heat goes up, then a tiptoeing pizzicato groove in D minor, 118 bpm, with a glockenspiel for the cold. It stops for
the two quotes, is unplugged on "off the internet", and comes back as the shop music for the question.
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
from sfx_gen import whoosh, clink, crickets, rattle, whoa  # noqa: E402

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
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "fridge", "story.ts")).read()
Wf = lambda i: int(round(WORDS[i]["start"] * FPS))            # frame a word starts on (same rounding as the picture)
Wt = lambda i: Wf(i) / FPS
TOTAL = int(round((WORDS[-1]["end"] + 1.55) * FPS))
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 43 and CUTS[0] == 0, CUTS
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS

R = rng(20261012)
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


pizz = lambda m, d=0.5, b=0.45: cached(("pizz", m, d, b), lambda: I.pluck(I.m2f(m), 0.8, R, d, b))
glock = lambda m, d=1.0: cached(("glock", m, d), lambda: I.glock(I.m2f(m), 0.7, R, d))
vib = lambda m, d=1.2: cached(("vib", m, d), lambda: I.vibes(I.m2f(m), 0.6, R, d))
brush = lambda v=0.6, swish=False: I.brush(v, R, 0.3 if swish else 0.2, swish)


def stab(notes, d=0.3):
    """a short plucked chord: the tiptoe"""
    return sum(pizz(m, d, 0.6) for m in notes) / np.sqrt(len(notes))


def tape(x, t0, d, to=0.3, cut=True):
    """play x as a tape that slows down from t0 over d seconds to `to` times the speed (pitch falls with it)"""
    a, n = ns(t0), ns(d)
    if a >= x.shape[1]:
        return x
    speed = 1 + (to - 1) * np.linspace(0, 1, n) ** 1.6
    pos = a + np.cumsum(speed)
    y = x.copy()
    for c in range(2):
        seg = np.interp(pos, np.arange(x.shape[1]), x[c]) * np.linspace(1, 0, n) ** 0.7
        y[c, a: a + n] = seg[: max(0, min(n, x.shape[1] - a))]
    if cut:
        y[:, a + n:] = 0
    return y


# ------------------------------------------------------------------------------------------------ music
# Two tunes. The shop's own music: F major, vibraphone chords, a plucked bass, brushes, a glockenspiel lick. And the
# break-in: D minor, plucked bass in eighths, off-beat plucked chords, kick and brushes, a glockenspiel hook for the cold.
# Kick and bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz,
# so they are kept modest and the level is carried by what a phone does play (plucks, glockenspiel, brushes).
BPM = 118.0
B = 60.0 / BPM
BAR = 4 * B
KICK, BASS_MIX = 0.7, 0.55
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
CH = {"Dm": [50, 53, 57, 62], "Bb": [46, 50, 53, 58], "A7": [45, 49, 52, 55], "Gm": [43, 46, 50, 55], "F": [41, 45, 48, 53], "C7": [48, 52, 55, 58],
      "Fmaj7": [53, 57, 60, 64], "Dm7": [50, 53, 57, 60], "Gm7": [55, 58, 62, 65], "C9": [52, 55, 58, 62]}
ROOT = {"Dm": 38, "Bb": 34, "A7": 33, "Gm": 31, "F": 29, "C7": 36, "Fmaj7": 41, "Dm7": 38, "Gm7": 43, "C9": 36}
HOOK = {"Dm": [81, 77, 74, 77], "Bb": [82, 77, 74, 70], "A7": [81, 76, 73, 76], "Gm": [79, 74, 70, 74], "F": [81, 77, 72, 77], "C7": [79, 76, 72, 70]}
OST = [0, 12, 7, 12, 0, 12, 10, 7]                             # the bass line, in eighths, as steps above the root


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def play_bar(t0, chord, level, beat=B, until=None, hook=False, mute=None):
    """one bar of the break-in. level 0 = pad and two bass notes, 1 = + bass in eighths and off-beat hats,
    2 = + kick, brushes and plucked chords, 3 = + shaker and a glockenspiel line. mute = (a, b): no drums in between."""
    live = lambda t: until is None or t < until - 0.03
    drums = lambda t: mute is None or not (mute[0] <= t < mute[1])
    notes, root = CH[chord], ROOT[chord]
    if live(t0):
        put("comp", cached(("pad", chord, round(beat, 4), level == 0), lambda: I.pad([I.m2f(m + 12) for m in notes], 4 * beat * 0.97, 0.5, R, att=0.3 if level == 0 else 0.05, rel=0.2, warm=1300.0)), t0, 0.7 if level == 0 else 0.34)
    for i in range(8):
        t = t0 + i * beat / 2
        if not live(t):
            break
        if level >= 1 or i in (0, 4):
            put("bass", pizz(root + OST[i], 0.5, 0.35), t, (1.0 if i % 2 == 0 else 0.78) * R.uniform(0.94, 1.04))
        if level >= 1 and i % 2 == 1 and drums(t):
            put("drums", hat(0.55 * R.uniform(0.85, 1.1)), t, 1.0, 0.25)
        if level >= 2:
            if i in (0, 3, 4) and drums(t):
                put("drums", kick(KICK * (1.0 if i == 0 else 0.85)), t)
            if i in (2, 6) and drums(t):
                put("drums", brush(0.9 * R.uniform(0.9, 1.05)), t, 1.0, -0.15)
            if i % 2 == 1:
                put("comp", stab([m + 12 for m in notes[1:]]), t, 0.5 * R.uniform(0.9, 1.05), 0.3 if i % 4 == 1 else -0.3)
        if level == 3:
            for k in range(2):
                if drums(t + k * beat / 4):
                    put("drums", shaker(0.3 if k else 0.42), t + k * beat / 4, 1.0, -0.4)
            put("lead", glock(notes[(i * 3) % 4] + 24, 0.5), t, 0.3, 0.35 if i % 2 else -0.2)
        if hook and level >= 2 and i >= 4:
            put("lead", glock(HOOK[chord][i - 4], 0.9 if i == 7 else 0.45), t, 0.62, -0.25)


def shop_bar(t0, chord, beat=B, until=None, lick=None, gain=1.0):
    """one bar of the shop's music: vibraphone chord on one and the 'and' of two, plucked bass, brushes"""
    live = lambda t: until is None or t < until - 0.03
    notes, root = CH[chord], ROOT[chord]
    for i in range(8):
        t = t0 + i * beat / 2
        if not live(t):
            break
        if i in (0, 3, 6):
            for k, m in enumerate(notes):
                put("comp", vib(m + 12, 1.0), t + 0.008 * k, 0.4 * gain, -0.3 + 0.2 * k)
        if i in (0, 3, 4, 6):
            put("bass", pizz(root + (7 if i in (3, 6) else 0), 0.6, 0.3), t, 0.9 * gain)
        put("drums", brush(0.5 if i % 2 else 0.34, swish=(i % 2 == 0)), t, 0.8 * gain, 0.2)
        if i in (2, 6):
            put("drums", hat(0.4), t, gain, -0.3)
    for j, m in enumerate(lick or ()):
        if m and live(t0 + j * beat / 2):
            put("lead", glock(m, 0.7), t0 + j * beat / 2, 0.55 * gain, 0.25)


def build_music():
    FORM = ["Dm", "Dm", "Bb", "A7", "Dm", "Gm", "A7", "Dm"]

    def groove(t0, t1, levels, start=0, hooks=(), mute=None, beat=B):
        """bars of the break-in from t0 until t1; levels(t) gives the level of the bar that starts at t"""
        k = 0
        while t0 + k * 4 * beat < t1 - 0.05:
            t = t0 + k * 4 * beat
            play_bar(t, FORM[(start + k) % 8], levels(t), beat, until=t1, hook=k in hooks, mute=mute)
            k += 1
        return k

    # ---- 0: the shop's music, alone for one second. On "heat" it slows down like a tape and sinks.
    melt = Wt(4) - 0.02
    shop_bar(0.0, "Fmaj7", lick=(84, 0, 81, 0, 77, 81, 0, 0), gain=1.15)
    shop_bar(BAR, "Dm7", gain=1.0)
    EVENTS.append((0.0, "music in", "the shop's own music: F major, vibraphone, plucked bass, brushes, a glockenspiel lick"))
    EVENTS.append((melt, "the music melts", "'heat': the shop music slows like a tape and sinks, as the readout climbs"))
    shop = {k: v.copy() for k, v in BUS.items()}
    for k in BUS:
        BUS[k][:] = 0
        shop[k] = tape(shop[k], melt, 0.75, 0.32)

    # ---- A: the break-in tune. In on the map, full for the accusation, down for the night, up for the fire.
    ta, stop_a = cut_t(1), Wt(81) - 0.05
    lv = lambda t: (2 if t < cut_t(2) - 0.4 else 3 if t < cut_t(3) - 0.4 else 1 if t < cut_t(4) - 0.4 else 2 if t < cut_t(7) - 0.5 else 3 if t < cut_t(8) - 0.4
                    else 1 if t < cut_t(11) - 0.5 else 3 if t < cut_t(13) - 0.4 else 2)
    mute = ((Wf(57) - 1) / FPS, Wt(60))                             # the alarm is muted: the drums go with it, until the defrost starts
    n_a = groove(ta, stop_a, lv, hooks=(1, 3, 5, 9, 11), mute=mute)
    put("hits", I.cymbal(0.5, R, 1.6), ta, 0.4)
    EVENTS.append((ta, "break-in tune", f"{BPM:.0f} bpm, D minor: plucked bass in eighths, off-beat plucked chords, kick and brushes, glockenspiel"))
    put("hits", I.timpani(I.m2f(38), 0.9, R, 1.6), Wt(17), 0.9)
    put("hits", I.brass(I.m2f(50), 0.5, 0.8, R, "stab"), Wt(17), 0.5)
    EVENTS.append((Wt(17), "hit", "timpani and a brass stab on 'Iran': the spokesperson points"))
    EVENTS.append((mute[0], "drums out", "the alarm key is pressed: kick, brushes and hats drop out until the defrost starts"))
    for j, m in enumerate((62, 64, 65, 67, 69, 70, 72, 74)):          # "and never let it stop": a scale that keeps climbing
        put("lead", glock(m + 12, 0.4), Wt(61) + j * B / 2, 0.5, -0.3 + 0.08 * j)
    EVENTS.append((Wt(61), "climbing scale", "eight glockenspiel notes up under 'and never let it stop'"))
    # the professor's line is read over a single chord and two bass notes a bar
    put("comp", I.pad([I.m2f(m) for m in (50, 57, 62, 65)], Wt(97) - stop_a - 0.6, 0.5, R, att=0.05, rel=0.5, warm=1200.0), stop_a, 0.5)
    for k in range(int((cut_t(18) - stop_a) / (2 * B))):
        put("bass", pizz(38 if k % 2 == 0 else 45, 0.7, 0.3), stop_a + 0.3 + k * 2 * B, 0.8)
    EVENTS.append((stop_a, "music thins", "one held chord and a slow plucked bass under the professor's line"))

    # ---- B: Danfoss, then November: the same trick, so the same tune, a tone higher in the bass line's second bar
    tb, stop_b = cut_t(18), Wt(120) - 0.04
    lvb = lambda t: 2 if t < cut_t(20) - 0.4 else 3
    groove(tb, stop_b, lvb, start=4, hooks=(1, 3))
    EVENTS.append((tb, "break-in tune back", "under Danfoss; full again for 'the same trick'"))
    t = Wt(106)                                                      # "outdated": a music box that has seen better days
    for j, m in enumerate((74, 77, 81, 77, 72)):
        put("lead", tape(st(I.musicbox(I.m2f(m), 0.6, R, 0.9)), 0.12, 0.7, 0.86, cut=False), t + j * 0.17, 0.5, 0.2)
    EVENTS.append((t, "tired music box", "five notes that sag in pitch on 'outdated software'"))
    # "Even an IKEA. No word on the meatballs.": the shop music again, two bars, bright
    ti = Wt(120) - 0.02
    shop_bar(ti, "Fmaj7", lick=(0, 0, 84, 86, 88, 0, 84, 0))
    shop_bar(ti + BAR, "C9", until=cut_t(24), lick=(86, 84, 81, 0))
    EVENTS.append((ti, "shop music", "two bars of the F major tune for the furniture store and its meatballs"))

    # ---- C: the blood service. No tune: a low chord and a pulse like a heartbeat, then relief.
    tc = cut_t(24)
    put("comp", I.pad([I.m2f(m) for m in (38, 45, 50, 53)], Wt(137) - tc - 0.1, 0.5, R, att=0.2, rel=0.3, warm=900.0), tc, 0.8)
    k = 0
    while tc + 0.15 + k * 0.62 < Wt(137) - 0.2:
        for d, g in ((0.0, 1.0), (0.17, 0.7)):
            put("drums", kick(0.9 * g), tc + 0.15 + k * 0.62 + d)
        k += 1
    EVENTS.append((tc, "low chord, heartbeat", "the tune stops for the blood service: a held D minor and a double pulse"))
    tr = Wt(137)
    for k2, m in enumerate((53, 57, 60, 65)):
        put("comp", vib(m + 12, 1.6), tr + 0.03 * k2, 0.5, -0.3 + 0.2 * k2)
    put("bass", pizz(41, 0.9, 0.3), tr, 0.9)
    EVENTS.append((tr, "F major chord", "'Staff caught it in time': the vibraphone resolves"))
    # "Neither has been tied to the first attack": two plucked notes that ask a question
    put("bass", pizz(38, 0.6), Wt(142), 0.8); put("lead", pizz(62, 0.5, 0.6), Wt(145), 0.6); put("lead", pizz(68, 0.7, 0.6), Wt(148), 0.6)
    EVENTS.append((Wt(145), "two plucked notes", "a rising question under 'tied to the first attack'"))

    # ---- D: France names a culprit. Timpani, then the tune, steady, for the evidence. It stops on "How exactly?"
    td, stop_d = cut_t(27), Wt(180) - 0.04
    for ts, v in I.snare_roll(td + 0.1, Wt(157) - 0.03, 0.1, 0.6, R, rate=26):
        put("drums", I.timpani(I.m2f(38), v * 0.5, R, 0.5), ts, 0.5)
    put("hits", I.timpani(I.m2f(38), 1.0, R, 2.0), Wt(157), 1.0)
    put("hits", I.brass(I.m2f(38), 0.9, 0.85, R, "tuba"), Wt(157), 0.5); put("hits", I.brass(I.m2f(50), 0.9, 0.8, R, "horn"), Wt(157), 0.4)
    EVENTS.append((td + 0.1, "timpani roll", "building to 'culprit'"))
    EVENTS.append((Wt(157), "timpani and brass", "on 'culprit'"))
    tg = cut_t(28)
    lvd = lambda t: 1 if t < cut_t(29) - 0.4 else 2
    groove(tg, stop_d, lvd, hooks=(3, 5))
    EVENTS.append((tg, "break-in tune back", "sparse under the accusation, steady under the evidence"))
    put("hits", I.brass(I.m2f(50), 0.35, 0.85, R, "stab"), Wt(179), 0.5); put("hits", I.brass(I.m2f(57), 0.35, 0.8, R, "stab"), Wt(179), 0.4)
    EVENTS.append((Wt(179), "brass stab", "on 'certain'"))
    EVENTS.append((stop_d, "music stops", "'How exactly?'"))
    put("lead", pizz(69, 0.5, 0.6), Wt(183), 0.6); put("lead", pizz(62, 0.8, 0.6), Wt(184), 0.6)
    EVENTS.append((Wt(183), "two plucked notes", "falling, under 'It won't say'"))

    # ---- E: Iran's answer. One hit, then the cold: a glockenspiel line coming down, and nothing under the quote.
    put("hits", I.timpani(I.m2f(33), 0.9, R, 1.8), Wt(186), 0.9)
    EVENTS.append((Wt(186), "timpani", "on 'denies'"))
    for j, m in enumerate((93, 89, 86, 81, 77, 74, 69)):
        put("lead", glock(m, 1.4), Wt(192) + j * 0.1, 0.6, -0.4 + 0.13 * j)
    EVENTS.append((Wt(192), "icy run", "seven glockenspiel notes down on 'ice cold'"))
    put("comp", I.pad([I.m2f(m) for m in (74, 81, 86)], Wt(206) + 0.4 - Wt(194), 0.5, R, att=0.4, rel=0.6, warm=3000.0), Wt(194), 0.14)
    EVENTS.append((Wt(194), "music out", "the reply is read over a thin, cold, high chord and nothing else"))

    # ---- F: what France wants, and the advice. The tune is unplugged on "off".
    tf, off = cut_t(37), Wt(220)
    lvf = lambda t: 2 if t < cut_t(39) - 0.4 else 3
    groove(tf, off + 0.6, lvf, start=4, hooks=(1,))
    put("hits", I.cymbal(0.45, R, 1.6), tf, 0.4)
    EVENTS.append((tf, "break-in tune back", "for the warrants, the sanctions and the advice"))
    EVENTS.append((off, "power down", "'off': the plug comes out and the tune winds down like a tape"))
    for k in BUS:
        BUS[k] = tape(BUS[k], off, 0.55, 0.15)

    # ---- G: the question. The shop's music is back: one chord in the pause, ringing under the question, and a button.
    z = WORDS[222]["end"] + 0.12
    for k2, m in enumerate((53, 57, 60, 64, 67)):
        put("comp", vib(m + 12, 3.6), z + 0.02 * k2, 0.62, -0.4 + 0.2 * k2)
    put("comp", I.pad([I.m2f(m) for m in (53, 57, 60, 64, 67)], 3.6, 0.5, R, att=0.03, rel=1.0, warm=1500.0), z, 0.5)
    put("bass", pizz(29, 1.2, 0.3), z, 1.0); put("bass", pizz(41, 1.2, 0.3), z, 0.6)
    put("lead", glock(84, 1.6), z, 0.5, 0.2); put("lead", glock(89, 1.6), z + B / 2, 0.45, -0.2)
    put("drums", brush(0.6, swish=True), z, 0.8)
    EVENTS.append((z, "final chord", "F major 9 on the vibraphone lands in the pause and rings under the question: the shop's music is back"))
    e = WORDS[-1]["end"] + 0.22                                    # button: C then F
    put("bass", pizz(36, 0.4, 0.4), e, 0.9); put("lead", glock(84, 0.4), e, 0.5); put("drums", brush(0.7), e, 0.8)
    put("bass", pizz(29, 1.0, 0.4), e + B, 1.0); put("lead", glock(89, 1.4), e + B, 0.55); put("lead", glock(81, 1.4), e + B, 0.4, -0.3); put("drums", kick(0.9), e + B)
    EVENTS.append((e, "button", "two notes, C then F: the tune closes while the pointer comes down the line"))

    for k in BUS:
        BUS[k][:, : shop[k].shape[1]] += shop[k]
    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.7 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 9, hf=1.1))
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


def boing():
    t = tt(0.4)
    return fades(np.sin(phase(190 * (1 + 0.45 * np.sin(TAU * 27 * t) * np.exp(-t / 0.2)) * (1 + 0.5 * t))) * np.exp(-t / 0.16), 0.002, 0.04)


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


def drip(f=900.0):
    t = tt(0.09)
    return fades(np.sin(phase(f * (1 + 0.9 * np.exp(-t / 0.012)))) * np.exp(-t / 0.03), 0.001, 0.02)


def bell_ring(d):
    """an electric alarm bell: a clapper at 22 strokes a second"""
    y = np.zeros(ns(d + 0.3))
    for k in range(int(d * 22)):
        c = modal(0.25, [(2280, 1.0, 0.09), (3410, 0.6, 0.06), (5150, 0.3, 0.03)], R)
        i = ns(k / 22)
        y[i: i + len(c)] += c * R.uniform(0.8, 1.0)
    return y[: ns(d)]                                               # cut dead: somebody muted it


def siren(d):
    t = tt(d)
    f = np.where((t * 2.2) % 1 < 0.5, 660.0, 495.0)
    return fades(lp(np.sign(np.sin(phase(f))) * 0.5 + np.sin(phase(f)), 2400), 0.02, 0.08)


def crackle(d, rate=45.0):
    y = np.zeros(ns(d))
    for _ in range(int(d * rate)):
        i = R.integers(0, len(y) - 400)
        c = hp(R.standard_normal(300), 2000) * np.exp(-np.arange(300) / R.uniform(8, 40))
        y[i: i + 300] += c * R.uniform(0.3, 1.0)
    return y


def meow():
    t = tt(0.34)
    f = 620 * (1 + 0.45 * np.sin(np.pi * t / 0.34) ** 0.8) * (1 + 0.012 * np.sin(TAU * 9 * t))
    ph = phase(f)
    y = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
    return fades(bp(y, 500, 3800) * np.sin(np.pi * t / 0.34) ** 0.7, 0.02, 0.05)


def zap():
    t = tt(0.12)
    return fades(bp(np.sign(np.sin(TAU * 120 * t)) * R.standard_normal(len(t)), 1200, 8000) * np.exp(-t / 0.04), 0.001, 0.02)


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
    # every cut gets a small swish, alternating sides; the two quotes and the blood service get none
    quiet = {16, 17, 25, 26, 35, 36}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right"))

    stamps = [(Wt(1), "THE FREEZER HACK"), (Wt(15), "FRANCE SAYS: IRAN"), (Wt(26), "50°C"), (Wt(31), "TENS OF MILLIONS OF €"), (Wt(37), "15+ FIRES"), (Wt(43), "NO BREAK-IN"), (Wt(57), "ALARMS: OFF"),
              (Wt(62), "DEFROST: NO END"), (Wt(106), "OUTDATED"), (Wt(115), "100+ STORES"), (Wt(124), "STATUS: UNKNOWN"), (Wt(138), "NOTHING LOST"), (Wt(145), "NO PROVEN LINK"), (Wt(178), "“WITH CERTAINTY”"),
              (Wt(182), "HOW? NOT DISCLOSED"), (Wt(186), "DENIED"), (Wt(210), "REQUESTED, on the warrant"), (Wt(213), "SOUGHT, on the sanctions folder"), (Wt(219), "“OFF THE PUBLIC INTERNET”")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(Wt(17) + f_(2), "Iran calls that baseless"), (Wt(20), "calendar: October 11–12"), (Wt(27) + f_(3), "122°F, Reuters"), (Wt(32) + f_(3), "one retailer's estimate"), (Wt(40), "official report: at least 15"),
            (Wt(50), "the prosecutor's account"), (Wt(66), "question mark"), (Wt(66) + f_(5), "question mark"), (Wt(71), "the boss of a French chain"), (Wt(79), "a cybersecurity professor"), (Wt(82), "quote card: the professor"),
            (Wt(97), "name tag: Danfoss"), (Wt(107), "Danfoss: outdated firmware"), (Wt(108), "calendar: November 2"), (Wt(117), "at least five countries, AFP"), (Wt(121), "one store in Belgium"),
            (Wt(123), "question mark"), (Wt(123) + f_(4), "question mark"), (Wt(123) + f_(8), "question mark"), (Wt(132), "name tag: France's blood service"), (Wt(140), "products not damaged"),
            (Wt(145) + f_(6), "question mark on the second string"), (cut_t(27) + f_(3), "quote card: French Foreign Ministry"), (Wt(159), "name tag: Shahid Kaveh"), (Wt(162), "context: the Iran war"),
            (Wt(165) + f_(2), "the prosecutor's evidence"), (Wt(168) - f_(2), "evidence card: the method"), (Wt(169) + f_(2), "evidence card: traces of Farsi"), (Wt(174) - f_(1), "evidence card: IP addresses"),
            (Wt(179), "Barrot, via CNN"), (Wt(180), "question mark"), (Wt(180) + f_(5), "question mark"), (Wt(182) + f_(6), "the minister, via CNN"), (Wt(189), "name tag: Iran's Foreign Ministry"), (Wt(195), "quote card: Iran's Foreign Ministry"),
            (Wt(209), "for the unit's leaders"), (Wt(212), "France will ask the EU"), (cut_t(39) + f_(2), "notice: CERT-FR"), (cut_t(39) + f_(8), "notice: FBI Cyber"), (Wt(215), "CERT-FR and the FBI"),
            (Wt(221), "FBI Cyber, via CBS News"), (Wt(223), "WHAT DO YOU THINK?"), (Wt(230), "card A"), (Wt(232), "card B")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    def roll(a, z, f0=1500.0, f1=3000.0, step_s=0.05):             # a counter: a dozen ticks per 400 ms sits about 10 LU louder than one tick
        t = a
        while t < z:
            u = (t - a) / (z - a)
            fx(t, tick(f0 + (f1 - f0) * u), -21 + 2 * u, 0.1)
            t += step_s - 0.02 * u

    # 1: the hook, the map, the accusation
    fx(Wt(1) + f_(2), click(), -11, 0.2, "click", "the pointer taps the freezer's readout")
    fx(Wt(4), hiss(0.8, 1800, 8000), -15, 0, "hiss", "the cabinets warm up")
    a, z = (Wf(9) - 2) / FPS, (Wf(12) + 4) / FPS
    fx(a, pop(500, 1100), -13, 0, "pop", "the counter appears")
    roll(a, z)
    EVENTS.append((a, "counter ticks", "the number rolls to 700 while dots light up across France"))
    fx(z, ding(1568, 0.9), -10.5, 0, "counter lands", "700")
    # 2: the night, the heat, the morning
    fx(cut_t(3) + 0.02, crickets(1.0, R), -19, 0, "crickets", "the car park at night")
    fx(cut_t(4) + 0.05, hiss(1.7, 2200, 9000), -14, 0, "hiss, rising", "steam off the doors as the readout climbs to 50")
    for k in range(4):
        fx(cut_t(4) + 0.5 + k * 0.33, drip(820 + 90 * (k % 3)), -16, -0.3 + 0.2 * k)
    EVENTS.append((cut_t(4) + 0.5, "drips", "ice cream starts to run"))
    fx(Wt(31), whoa(R, 190, 0.4), -13, -0.3, "gasp", "the shop worker finds the freezers in the morning")
    for k in range(3):
        fx(cut_t(5) + 0.9 + k * 0.28, drip(700 + 110 * k), -15, 0.2)
    fx(cut_t(6) + 0.02, rattle(0.75, R, density=36), -14, 0.1, "trolley rattle", "a trolley of spoiled food on its way to the bin")
    fx(cut_t(7) + 0.03, siren(1.25), -13, -0.4, "siren", "the fire engine")
    fx(cut_t(7) + 0.1, crackle(1.2), -15, 0.2, "fire crackle", "smoke out of the doors")
    fx(cut_t(7) + 0.25, hiss(1.0, 1500, 7000, rise=False), -15, 0.3, "hose", "water on the fire")
    # 3: nobody there; the login; mute, defrost, no end
    fx(cut_t(8) + 0.7, meow(), -15, 0.3, "meow", "the only one in the car park")
    for i in (48, 49, 50, 52, 53):
        for j in range(3):
            fx(Wt(i) + j * 0.06 * R.uniform(0.8, 1.2), key(), -17, R.uniform(-0.2, 0.2))
    EVENTS.append((Wt(48), "typing", "somebody at a keyboard, somewhere"))
    fx(Wt(52), click(), -13, 0.3, "click", "one of the hoods points at the list")
    for k in range(3):
        fx(Wt(54) + k * 0.09, blip(880 + 220 * k), -15, 0.2)
    EVENTS.append((Wt(54), "three rising beeps", "'online': the list of stores turns red"))
    bell0, bell1 = Wt(54) + f_(9), (Wf(57) - 1) / FPS
    fx(bell0, bell_ring(bell1 - bell0), -12, 0.3, "alarm bell", "starts as the stores turn red, rings across the cut, and is cut dead when the pointer presses the alarm key")
    fx(bell1 - f_(1), click(), -11, 0.2, "click", "the alarm key")
    fx(Wt(60) - f_(1), click(), -11, 0, "click", "the defrost key")
    fx(Wt(60), slide(260, 700, 0.3), -14, 0, "power up", "the defrost starts")
    a, z = cut_t(12) + 0.05, shot_end(12) - 0.1
    roll(a, z, 900, 2600, 0.06)
    EVENTS.append((a, "rising ticks", "the readout climbs and nothing stops it"))
    # 4: why online
    for k in range(5):
        fx(cut_t(13) + 0.5 + k * 0.2, blip(1320 + 180 * (k % 2), 0.03), -18, 0.3 - 0.15 * k)
    EVENTS.append((cut_t(13) + 0.5, "data blips", "packets up and down the cable"))
    night = (Wf(75) + 6) / FPS
    fx(night, pop(600, 300, 0.08), -13, 0.3, "pop", "night falls in the technician's window; he gets his phone out")
    fx(night + 0.1, crickets(0.5, R, 2), -19, 0)
    # 5: the professor, the line-up, the hackers in love
    fx(Wt(80), knock(), -13, 0.3, "click", "the pointer on the blackboard")
    fx(Wt(81), knock(), -14, 0.3, "click", "the pointer on the blackboard")
    fx(Wt(83) + f_(2), ding(1976, 0.9), -12, 0.3, "ding", "a halo lands over the fridge")
    t0, w = I.whistle([(Wt(84) + 0.1, 0.22, 79, 0.6), (Wt(84) + 0.36, 0.2, 76, 0.6), (Wt(84) + 0.6, 0.22, 79, 0.6), (Wt(84) + 0.86, 0.5, 84, 0.6)], R)
    fx(t0, w, -15, 0.4, "whistling", "the fridge, looking innocent, in the line-up")
    for j, m in enumerate((72, 76, 79, 84, 88, 91)):
        fx(cut_t(17) + 0.12 + j * 0.07, I.glock(I.m2f(m), 0.6, R, 0.8), -15, -0.3 + 0.12 * j)
    EVENTS.append((cut_t(17) + 0.12, "rising glissando", "hearts for the fridge"))
    # 6: Danfoss
    fx(Wt(97), ding(2093, 0.9), -12, 0.2, "ding", "the panel, brand new, on its stand")
    # 7: November
    fx(Wt(113) - f_(1), click(), -11, 0, "click", "the defrost key, again")
    fx(Wt(113), slide(260, 700, 0.3), -14, 0, "power up", "another defrost starts")
    for i in range(5):
        fx(cut_t(21) + f_(4 + i * 8), ding(1319 + 150 * i, 0.5), -12.5, -0.4 + 0.2 * i, "ping", "a country lights up on the board")
    fx(Wt(122), click(), -11, 0.3, "click", "the pointer taps the furniture store")
    fx(Wt(127), boing(), -13, 0.2, "boing", "one meatball hops")
    # 8: the blood service
    for k in range(7):
        fx(cut_t(24) + 0.12 + k * 0.3, blip(1760 if k % 2 == 0 else 1320, 0.11), -13, 0.3)
    EVENTS.append((cut_t(24) + 0.12, "alarm, two tones", "the blood service's own alarm goes off"))
    for k in range(4):
        fx(Wt(132) + k * 0.16, step(), -15, 0.5 - 0.25 * k)
    EVENTS.append((Wt(132), "running steps", "a technician comes running"))
    fx(Wt(141), ding(1568, 1.0), -11.5, 0.3, "ding", "a green tick: the blood is in another freezer")
    # 9-10: no link; the accusation
    fx(Wt(155), knock(), -13, 0, "click", "the statement is held up")
    # 11: the evidence; certain; not disclosed
    for k in range(9):
        fx(cut_t(32) + 0.1 + k * 0.1, tick(1500 + 60 * k), -17, 0.2)
    EVENTS.append((cut_t(32) + 0.1, "dial clicks", "the safe's dial turns and turns"))
    # 12: the denial, the cold
    fx(Wt(190), knock(), -13, 0.2, "click", "the statement is held up")
    fx(Wt(191), crackle(0.9, 60), -16, 0, "ice crackle", "frost over the lectern, icicles under it")
    fx(Wt(191), hiss(1.6, 300, 1400, rise=False), -17, 0, "cold wind", "'ice cold'")
    for k, t in enumerate((Wt(197), Wt(201), Wt(204))):
        fx(t, drip(760 + 80 * k), -18, 0.2 if k % 2 else -0.2)
    EVENTS.append((Wt(197), "three drips", "the only other sound under the quote"))
    fx(WORDS[206]["end"] + 0.12, clink(R), -13, 0.2, "ice clink", "after 'refrigerators'")
    # 14: the advice
    fx(Wt(220), pop(900, 240, 0.09), -10.5, 0.2, "pop", "the plug comes out")
    fx(Wt(220) + 0.03, zap(), -13, 0.2, "zap", "a spark at the socket")
    # 15: the question, and the tail
    for k in range(2):
        fx(cut_t(41) + 0.25 + k * 0.42, blip(1976, 0.06), -17, 0.4, "checkout beep" if k == 0 else "", "the shop is open again")
    fx(Wt(232) + f_(2), click(), -11, 0.3, "click", "a padlock closes on B's cable")
    a0 = (TOTAL - 42) / FPS
    fx(a0, slide(1700, 700, 0.4), -14, 0.4, "pop", "the pointer comes down the line from the cloud")
    fx(a0 + f_(12), boing(), -11.5, 0.3, "boing", "it meets the padlock")
    fx(a0 + f_(22), slide(900, 160, 0.42), -14, 0.3, "falling whistle", "and drops out of the picture")
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


GRAPHIC_SOUNDS = {"stamp thud", "pop", "boing", "ding", "ping", "counter lands", "click", "hit", "gasp", "power down", "power up", "three rising beeps"}


SOLO = {31, 113}                                                   # the same two words Captions.tsx keeps on their own


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
        f.write("# Fridge hack short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
