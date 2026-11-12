"""Soundtrack for the fake boss short: narration + an original score + effects that follow the picture.

    python shoots/fake-boss/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/fakeboss/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: a masquerade waltz in F sharp minor, three in a bar at 174 bpm: a plucked bass on one, pizzicato chords on
two and three, brushes. There is one tune and two players. A horn is the boss; a music box, two octaves above it, is
the copy of him. The horn has the tune while the call looks real and whenever the trick works; the music box takes it
whenever the film says "A.I." or "fake", and the lawyer gets one bar of horn before the box gives him away. The waltz
stops dead twice: when the picture breaks up ("It isn't him!") and when the back office's shutter comes down. No tune
plays under the two quotations (one thin chord each: with nothing at all there, the render check reports a hole in
the sound), the three aliases get a drum roll and a brass chord apiece, and the film ends on the music box playing
the first three notes of the tune and stopping on the leading note: a question.
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
MUSIC_CEIL_FULL = -3.4         # the same for the whole spectrum, relative to the voice's programme loudness: a timpani note or a full
                               # bar of kick and bass under a word is held to the level of the bed
DUCK_DB = -4.0                 # how far the music dips under speech (it comes up for the breaths and the ending)
# Words the read all but swallows, by word number: (lift for the voice, dip for music and effects) in dB, for that word only.
# Measured with word_margins below (the last line of the cue sheet's header) before the first render, as the playbook asks.
# Three read low against what plays with them: "fake" in "also fake" (the point of the sentence, read 5 LU under the take's level
# with the music box on top of it: 0.1 LU over the bed), "name" at the end of the same line (-1.4) and "it" in "stopped it",
# which trails off under the tail of the blow that stops the music (-0.9).
WEAK_WORDS: dict[int, tuple[float, float]] = {93: (3.0, -3.0), 98: (3.0, -2.0), 198: (3.0, -3.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "fakeboss", "story.ts")).read()
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
JOINS = {4, 13, 16, 23, 26, 38, 45}                            # shots that carry on the take before them: not cuts
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS

R = rng(20261105)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ small synth voices
def kick(vel=1.0):
    t = tt(0.3)
    y = np.sin(phase(48 + 90 * np.exp(-t / 0.024))) * np.exp(-t / 0.1)
    y += hp(R.standard_normal(len(t)), 1800) * np.exp(-t / 0.002) * 0.2
    return fades(y * vel, 0.0004, 0.04)


_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


m2f = I.m2f
bassn = lambda m, d=0.7: cached(("bass", m, d), lambda: I.pluck(m2f(m), 0.85, R, d, 0.28, pos=0.22))
pizz = lambda m, d=0.4, b=0.55: cached(("pizz", m, d, b), lambda: I.pluck(m2f(m), 0.8, R, d, b))
boxn = lambda m, d=1.1: cached(("box", m, d), lambda: I.musicbox(m2f(m), 0.7, R, d))
hornn = lambda m, d: cached(("horn", m, round(d, 3)), lambda: I.brass(m2f(m), d, 0.55, R, "horn", scoop=-18.0, rel=0.09))
stab = lambda m, d=0.2, v=0.6: cached(("stab", m, d, v), lambda: I.brass(m2f(m), d, v, R, "stab", scoop=-30.0))
vib = lambda m, d=1.2: cached(("vib", m, d), lambda: I.vibes(m2f(m), 0.6, R, d))
glock = lambda m, d=1.0: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.7, R, d))
brush = lambda v=0.5: I.brush(v, R, 0.2, False)


# ------------------------------------------------------------------------------------------------ music
# One tune: a waltz in F sharp minor, three in a bar, 174 bpm. (The other four news films are in A minor at 112, D minor at 104,
# G major / E minor at 118 and C minor swung at 130, all four in a bar: this one shares no key, no tempo and no metre with them.)
# Bass fundamentals count towards the measured loudness but a phone speaker plays almost nothing under 300 Hz, so they are kept
# modest and the level is carried by what a phone does play (the plucked chords, the brushes, the horn, the music box).
BPM = 174.0
B = 60.0 / BPM
BAR = 3 * B
KICK, BASS_MIX = 0.5, 0.62
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
FORM = ["F#m", "F#m/C#", "Bm", "C#7", "F#m", "D", "C#7", "F#m"]
CH = {"F#m": [61, 66, 69], "F#m/C#": [61, 66, 69], "Bm": [62, 66, 71], "C#7": [59, 65, 68], "D": [62, 66, 69]}
ROOT = {"F#m": 42, "F#m/C#": 37, "Bm": 47, "C#7": 37, "D": 38}
# the tune, bar by bar of the form: (beat, note, beats). Written in the octave above middle C; the horn plays it an octave
# down and the music box an octave up.
TUNE = [
    [(0, 73, 2), (2, 78, 1)],
    [(0, 81, 1), (1, 80, 1), (2, 78, 1)],
    [(0, 74, 2), (2, 78, 1)],
    [(0, 77, 2), (2, 73, 1)],
    [(0, 73, 2), (2, 78, 1)],
    [(0, 81, 1), (1, 78, 1), (2, 74, 1)],
    [(0, 73, 1), (1, 77, 1), (2, 80, 1)],
    [(0, 78, 3)],
]


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if x.ndim == 1 else x, t, gain)


def waltz_bar(t0, k, level, lead=None, until=None):
    """one bar of the waltz, bar k of the form. level 0 = a held chord and the bass note, 1 = bass on one and plucked chords on
    two and three, 2 = + a soft kick and brushes, 3 = + the tune, on the horn (the boss) or on the music box (the copy)"""
    live = lambda t: until is None or t < until - 0.03
    name = FORM[k % 8]
    notes, root = CH[name], ROOT[name]
    if not live(t0):
        return
    put("bass", bassn(root, 0.9 if level == 0 else 0.7), t0, 1.0)
    if level == 0:
        put("comp", I.pad([m2f(m) for m in notes], min(BAR, (until or 1e9) - t0) * 0.97, 0.5, R, att=0.2, rel=0.25, warm=1100.0), t0, 0.55)
        return
    if level >= 2:
        put("drums", kick(KICK), t0)
    for b in (1, 2):
        t = t0 + b * B
        if not live(t):
            break
        for j, m in enumerate(notes):
            put("comp", pizz(m), t + 0.005 * j, (0.5 if b == 1 else 0.42) * R.uniform(0.92, 1.05), -0.3 + 0.3 * j)
        if level >= 2:
            put("drums", brush(0.5 if b == 1 else 0.4), t, 1.0, 0.25)
    if level >= 3 and lead:
        for bt, m, beats in TUNE[k % 8]:
            t = t0 + bt * B
            if not live(t):
                break
            if lead == "horn":
                put("lead", hornn(m - 12, beats * B * 0.92), t, 0.36, -0.15)
                put("lead", vib(m, 0.5 + 0.3 * beats), t, 0.12, 0.3)
            else:
                put("lead", boxn(m + 12, 0.6 + 0.3 * beats), t, 0.46, 0.2)
                put("lead", glock(m + 24, 0.5), t, 0.1, -0.2)


def build_music():
    def groove(t0, t1, level, lead=lambda t: None, start=0):
        """bars of the waltz from t0 until t1; level(t) and lead(t) are asked for the bar that starts at t"""
        n = 0
        while t0 + n * BAR < t1 - 0.05:
            t = t0 + n * BAR
            waltz_bar(t, start + n, level(t), lead(t), until=t1)
            n += 1

    def blow(t, low, high, g=1.0, dur=1.8):
        """a kettledrum and two brass notes a tritone apart"""
        put("hits", I.timpani(m2f(low), 0.95, R, dur), t, 1.0 * g)
        put("hits", I.brass(m2f(low), 0.8, 0.85, R, "tuba"), t, 0.5 * g)
        put("hits", I.brass(m2f(high), 0.8, 0.8, R, "horn"), t, 0.4 * g)

    def thin(t0, t1, notes, g=0.13):
        put("comp", I.pad([m2f(m) for m in notes], t1 - t0, 0.5, R, att=0.35, rel=0.5, warm=3000.0), t0, g)

    # ---- 1: the call. The horn has the tune; the band tiptoes for "tell no one"; everything stops when the picture breaks up.
    hush, g0 = cut_t(2) - 0.7, F(18)
    groove(0.0, g0, lambda t: 3 if t < hush else 1, lambda t: "horn")
    put("hits", I.cymbal(0.35, R, 1.2), 0.0, 0.3)
    EVENTS.append((0.0, "music in", f"a waltz in F sharp minor, three in a bar at {BPM:.0f} bpm: plucked bass, pizzicato chords, brushes, and a horn with the tune: the boss"))
    EVENTS.append((3 * BAR, "the band tiptoes", "bass and plucked chords only, from 'and tell no one' through 'His voice. His face.'"))
    EVENTS.append((g0, "music cut dead", "the picture breaks up on 'It'"))
    blow(F(20, -1), 42, 48, 0.9, 1.4)
    EVENTS.append((F(20, -1), "hit", "kettledrum and brass a tritone apart as the plate comes down: MADE WITH A.I."))
    for j, m in enumerate((90, 89)):
        put("lead", boxn(m, 0.7), F(20, 5) + j * 0.17, 0.5, 0.2)
    EVENTS.append((F(20, 5), "music box, two notes", "F sharp and the note under it: the copy of the boss has a sound of its own from here on"))

    # ---- 2: the charge. The waltz without a tune; one bar and a half of music box for 'using A.I.'; it ends as the counter lands.
    ta = cut_t(5)
    groove(ta, cut_t(10) - 0.04, lambda t: 2 if t < cut_t(8) - 0.75 else 3, lambda t: "box" if t < cut_t(9) - 0.3 else None)
    EVENTS.append((ta, "waltz back", "without the tune for the prosecutors, the three men and the city; the music box for 'using A.I.'"))

    # ---- 3: the email. Bass and plucked chords; nothing but one thin chord under the email's own words.
    tb, q0, q1 = cut_t(10), F(62), WORDS[74]["end"] + 0.3
    groove(tb, q0 - 0.05, lambda t: 1, start=4)
    EVENTS.append((tb, "waltz, thinned", "bass and plucked chords while the page and the inbox are on screen"))
    thin(q0 + 0.1, q1, (73, 78, 85))
    EVENTS.append((q0 + 0.1, "music out", "the email is read over a thin, high chord and nothing else"))

    # ---- 4: the call and the lawyer. The music box has the tune in the back room; one bar of horn when the lawyer appears,
    #         and the box takes it back on 'also fake'.
    tc = cut_t(15) - BAR
    groove(tc, cut_t(21) - 0.04, lambda t: 2 if t < cut_t(15) - 0.3 else 3,
           lambda t: "horn" if cut_t(18) - 0.3 < t < cut_t(19) - 0.3 else "box", start=7)
    EVENTS.append((tc, "waltz back", "a bar without the tune as she answers; then the music box has it in the callers' room: the CEO's voice, made by A.I."))
    EVENTS.append((cut_t(18) + BAR - (cut_t(18) - tc) % BAR, "horn, one bar", "the lawyer looks real for exactly a bar; the music box takes the tune back on 'also fake'"))

    # ---- 5: the script. Bass and plucked chords; they stop for the title, and two plucked notes answer it.
    td, stop_d = cut_t(21), F(107) - 0.08
    groove(td, stop_d, lambda t: 1, start=4)
    thin(stop_d, WORDS[110]["end"] + 0.1, (66, 73), 0.1)
    e = WORDS[110]["end"] + 0.06
    put("lead", pizz(66, 0.5, 0.6), e, 0.6); put("lead", pizz(73, 0.7, 0.6), e + B, 0.6)
    EVENTS.append((td, "waltz, thinned", "bass and plucked chords for the script; they stop before 'Its title'"))
    EVENTS.append((e, "two plucked notes", "F sharp, C sharp, after 'Lawyer Call'"))

    # ---- 6: it worked. The whole band and the horn: the tune once through, eight bars, over the hospital and the pet food company.
    te = cut_t(24)
    groove(te, cut_t(29) - 0.04, lambda t: 3, lambda t: "horn")
    EVENTS.append((te, "waltz, the whole band", "'And it worked': the horn plays the tune once through, eight bars, while two wires leave"))

    # ---- 7: where it went. Bass and plucked chords; the nine accounts are nine notes of the scale (in the effects).
    tf = cut_t(29)
    groove(tf, cut_t(31) - 0.04, lambda t: 1, start=4)
    EVENTS.append((tf, "waltz, thinned", "under the nine accounts, which ring up the scale, and the coin machine"))

    # ---- 8: the aliases. A drum roll, then a kettledrum and a brass chord for each name, one step higher each time.
    r0, r1 = F(152) + 0.25, F(156) - 0.04
    for ts, v in I.snare_roll(r0, r1, 0.1, 0.42, R, rate=26):
        put("drums", I.snare(v, R, 0.2, 1.1), ts, 0.5)
    EVENTS.append((r0, "snare roll", "into the first alias"))
    for (i, low, chord, why) in ((156, 42, (54, 61, 66, 69), "Rocky Balboa"), (158, 47, (59, 62, 66, 71), "Superman Cash"), (160, 49, (61, 65, 68, 71), "Impossible Mission")):
        t = F(i)
        put("hits", I.timpani(m2f(low), 0.85, R, 1.5), t, 0.9)
        for j, m in enumerate(chord):
            put("lead", stab(m + 12, 0.22), t, 0.3, -0.3 + 0.2 * j)
        EVENTS.append((t, "kettledrum and brass chord", f"'{why}': the sticker lands. F sharp minor, B minor, C sharp seven: each name a step up"))
    put("hits", I.cymbal(0.4, R, 1.4), F(160), 0.4)

    # ---- 9: the boast. A held chord and the bass; one thin chord under his words.
    tg, b0, b1 = cut_t(34), F(171), WORDS[177]["end"] + 0.3
    groove(tg, b0 - 0.05, lambda t: 0)
    EVENTS.append((tg, "waltz, held back", "one held chord and one bass note a bar in the laundry"))
    thin(b0 + 0.1, b1, (73, 80, 85))
    EVENTS.append((b0 + 0.1, "music out", "the boast is read over a thin, high chord and nothing else"))

    # ---- 10: the one that failed. The waltz again, the horn for 'approved the wire', and it is cut dead as the shutter lands.
    th, hit = cut_t(37), F(197)
    groove(th, hit - 0.02, lambda t: 2 if t < cut_t(39) - 0.3 else 3, lambda t: "horn")
    EVENTS.append((th, "waltz back", "at the bank; the horn takes the tune again when the employee approves the wire"))
    blow(hit, 37, 43, 1.0, 1.6)
    EVENTS.append((hit, "music cut dead", "on 'stopped': kettledrum and brass, and no waltz after it"))

    # ---- 11: the arrests, the accusations. Three low notes for three dates; one warm chord under 'presumed innocent'.
    for i, m in ((199, 42), (200, 38), (202, 37)):
        put("bass", bassn(m, 1.1), F(i), 1.0); put("hits", I.timpani(m2f(m), 0.6, R, 1.3), F(i), 0.55)
    EVENTS.append((F(199), "three low notes", "F sharp, D, C sharp: one for each arrest as its date lands"))
    p0, p1 = F(205) - 0.1, cut_t(44) - 0.05
    put("comp", I.pad([m2f(m) for m in (50, 57, 62, 66)], p1 - p0, 0.5, R, att=0.5, rel=0.6, warm=1400.0), p0, 0.5)
    put("lead", vib(74, 1.6), F(210), 0.3, 0.2); put("lead", vib(78, 1.8), F(211), 0.3, -0.2)
    EVENTS.append((p0, "held chord", "D major, the first major chord in the film, under 'These are accusations: they are presumed innocent'; two vibraphone notes on the last two words"))

    # ---- 12: the question. The dominant with a fourth in it, which does not resolve; the music box asks the tune's first three notes.
    z = cut_t(44) + 0.05
    for j, m in enumerate((61, 66, 68, 71)):
        put("comp", vib(m, 3.4), z + 0.02 * j, 0.5, -0.4 + 0.25 * j)
    put("comp", I.pad([m2f(m) for m in (49, 54, 56, 59)], 4.9, 0.5, R, att=0.05, rel=1.0, warm=1500.0), z, 0.45)
    put("bass", bassn(37, 1.2), z, 1.0); put("bass", bassn(49, 1.2), z, 0.6)
    EVENTS.append((z, "open chord", "C sharp with a fourth and a seventh on the vibraphone: it hangs under the question and does not resolve"))
    e = WORDS[-1]["end"] + 0.18
    for j, (dt, m) in enumerate(((0, 85), (0.17, 90), (0.34, 93), (0.52, 89))):
        put("lead", boxn(m, 1.3 if j == 3 else 0.6), e + dt, 0.6, 0.2)
        put("bass", bassn((37, 42, 45, 41)[j], 0.9 if j == 3 else 0.35), e + dt, 0.6)
    EVENTS.append((e, "button", "the music box: C sharp, F sharp, A, the tune's first notes, and then the leading note, where it stops: a question mark"))

    dry = 1.5 * BUS["drums"] + BASS_MIX * BUS["bass"] + 0.9 * BUS["comp"] + 1.0 * BUS["lead"] + 0.5 * BUS["hits"]
    send = 0.1 * BUS["drums"] + 0.6 * BUS["comp"] + 0.6 * BUS["lead"] + 0.28 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.1, 11, hf=1.1))
    DIAG["buses"] = {k: (integrated(v[:, ns(cut_t(24)): ns(cut_t(28))]), integrated(v[:, ns(cut_t(15)): ns(cut_t(18))])) for k, v in BUS.items()}
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


def coins(d, rate=18.0):
    """a stream of coins: a cloud of small bright clinks"""
    y = np.zeros(ns(d + 0.2))
    for _ in range(int(d * rate)):
        c = clink(R, f0=R.uniform(2600, 5400), dur=0.1, bright=1.1)
        i = int(R.integers(0, ns(d)))
        y[i: i + len(c)] += c[: len(y) - i] * R.uniform(0.4, 1.0)
    return y


def shutter():
    """a press camera: two clicks 40 ms apart"""
    y = np.zeros(ns(0.12)); a, b = tick(2600), click()
    y[: len(a)] += a; i = ns(0.04); y[i: i + len(b)] += b[: len(y) - i]
    return y


def buzz(d=0.16, f=196.0):
    """an error buzzer: a low square wave"""
    t = tt(d)
    return fades(lp(np.sign(np.sin(TAU * f * t)) * 0.6 + 0.4 * np.sign(np.sin(TAU * f * 1.5 * t)), 2600), 0.004, 0.02)


def paper():
    t = tt(0.16)
    return fades(bp(R.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * np.clip(t / 0.16, 0, 1)) ** 0.5 * (0.6 + 0.4 * np.sin(TAU * 40 * t)), 0.005, 0.03)


def ringtone(notes=(1480.0, 1760.0, 2217.0), gap=0.1):
    """a video call ringing: three soft notes up the chord of the film's key"""
    y = np.zeros(ns(gap * len(notes) + 0.2))
    for j, f in enumerate(notes):
        b, o = blip(f, 0.16), blip(2 * f, 0.1)
        b[: len(o)] += 0.3 * o
        i = ns(j * gap)
        y[i: i + len(b)] += b
    return y


def shh(d=0.42):
    """'tell no one': a finger to the lips"""
    t = tt(d)
    return fades(bp(R.standard_normal(len(t)), 3200, 9000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5, 0.02, 0.08)


def flutter(d):
    """banknotes on the wing: paper beating the air"""
    t = tt(d)
    beat = 0.5 + 0.5 * np.sin(phase(15 + 6 * np.sin(TAU * 0.9 * t)))
    return fades(bp(R.standard_normal(len(t)), 1800, 7500) * beat ** 3 * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5, 0.02, 0.1)


def thump():
    """a bundle of banknotes dropped on a pile"""
    t = tt(0.1)
    return fades(lp(R.standard_normal(len(t)), 700) * np.exp(-t / 0.012) + np.sin(TAU * 105 * t) * np.exp(-t / 0.022) * 0.7 + bp(R.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.006) * 0.25, 0.0005, 0.02)


def slap():
    """a sticker slapped on: a flat hand on paper"""
    t = tt(0.16)
    y = bp(R.standard_normal(len(t)), 700, 5200) * np.exp(-t / 0.011) + np.sin(TAU * 170 * t) * np.exp(-t / 0.03) * 0.6
    return fades(y, 0.0004, 0.03)


def squeaky_toy():
    """a dog's toy, squeezed twice"""
    def one(d, f0, f1):
        t = tt(d)
        ph = phase(f0 + (f1 - f0) * np.sin(np.pi * t / d) ** 0.7)
        return fades((np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.4 + 0.08 * hp(R.standard_normal(len(t)), 4000), 0.006, 0.02)
    a, b = one(0.13, 1500, 2300), one(0.17, 1350, 2050)
    y = np.zeros(ns(0.42)); y[: len(a)] += a; i = ns(0.2); y[i: i + len(b)] += b
    return y


def whimper(d=0.42):
    """a dog watching its dinner money leave: a small falling whine"""
    t = tt(d)
    ph = phase((980 - 420 * (t / d) ** 1.4) * (1 + 0.02 * np.sin(TAU * 9 * t)))
    return fades((np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6, 0.02, 0.06)


def washer(d, spin=False):
    """washing machines: a drum turning over, water going round; with `spin`, one of them winding up"""
    t = tt(d)
    turn = 0.55 + 0.45 * np.sin(TAU * 1.7 * t)
    y = lp(R.standard_normal(len(t)), 260) * turn * 1.6 + bp(R.standard_normal(len(t)), 500, 2200) * (0.5 + 0.5 * np.sin(TAU * 0.85 * t + 1.0)) ** 2 * 0.5
    if spin:
        ph = phase(90 + 190 * (t / d) ** 1.3)
        y += (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * (t / d) * 0.5
    return fades(y, 0.08, 0.15)


def belt(d):
    """a conveyor belt: a motor's hum and the rollers ticking by"""
    t = tt(d)
    y = lp(np.sign(np.sin(TAU * 58 * t)), 420) * 0.5 + bp(R.standard_normal(len(t)), 300, 1400) * 0.25
    for k in range(int(d / 0.11)):
        c = tick(1300 + 200 * (k % 2)) * 0.5
        i = ns(k * 0.11)
        y[i: i + len(c)] += c[: len(y) - i]
    return fades(y, 0.05, 0.04)


def clang():
    """a steel shutter hitting its stop"""
    t = tt(0.5)
    y = modal(0.5, [(196, 1.0, 0.16), (447, 0.8, 0.12), (811, 0.6, 0.09), (1270, 0.45, 0.07), (2130, 0.3, 0.04)], R) + lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.012) * 1.2
    return fades(y, 0.0004, 0.08)


def ratchet(n=5):
    """handcuffs closing: a few teeth of a ratchet"""
    y = np.zeros(ns(0.05 * n + 0.06))
    for k in range(n):
        c = tick(2900 + 150 * k)
        i = ns(0.012 + k * (0.05 - 0.004 * k))
        y[i: i + len(c)] += c
    return y


def pen():
    """a pen on paper: one quick stroke"""
    d = R.uniform(0.09, 0.15)
    t = tt(d)
    return fades(bp(R.standard_normal(len(t)), 2600, 7000) * (0.5 + 0.5 * np.sin(TAU * R.uniform(22, 34) * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5, 0.008, 0.02)


def hum(d, f=110.0):
    """a machine thinking: two detuned tones and a little air"""
    t = tt(d)
    y = np.sin(TAU * f * t) + 0.6 * np.sin(TAU * f * 1.007 * t + 1) + 0.5 * np.sin(TAU * f * 3.0 * t) * (0.5 + 0.5 * np.sin(TAU * 6 * t)) + 0.3 * np.sin(TAU * f * 6.02 * t)
    return fades(y + 0.1 * bp(R.standard_normal(len(t)), 3000, 8000), 0.08, 0.15)


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
    # Every cut gets a small swish, alternating sides. None where the camera carries straight on (the six joins) and none on the
    # cut in to somebody's exact words (36: the boast; the email's words begin inside a take).
    quiet = JOINS | {36}
    for i in range(1, len(CUTS)):
        if i in quiet:
            continue
        w = cached(("whoosh", i % 3), lambda: whoosh(0.26, R, peak=0.11, f_lo=500, f_hi=2600 + 300 * (i % 3), tail=0.07))
        fx(cut_t(i) - 0.1, w, -17, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1 - len(quiet)} cuts, alternating left and right; none on the {len(JOINS)} joins inside a take, none on the cut in to the boast"))

    stamps = [(F(20, -1), "MADE WITH A.I."), (F(26), "3 MEN CHARGED"), (F(34), "TARGETED"), (F(122), "$4,829,580"), (F(132), "$5,242,747"), (F(152), "ALSO KNOWN AS…"),
              (F(191), "APPROVED"), (F(197), "STOPPED"), (F(210), "PRESUMED INNOCENT")]
    for t, why in stamps:
        fx(t, thud(), -8.5, 0, "stamp thud", why + " stamp")
    pops = [(F(7, -1), "his words in a balloon: WIRE $5,000,000"), (F(12), "'keep the transaction secret', indictment"), (F(20, 5), "a U.S. indictment says so, Nov 5, 2026"),
            (F(21, 2), "name tag: U.S. Attorney's Office"), (F(28), "and others 'known and unknown', indictment"), (F(35, 3), "July 2024 to February 2026, indictment"),
            (F(37), "'voices and/or images', indictment"), (F(41, -2), "the counter appears"), (F(49), "unsealed Nov 5, 2026: not tested in court"),
            (F(55, 4), "to staff who could approve a wire, indictment"), (F(61), "one email, Oct 8, 2024, indictment"), (F(63, -2), "quote card: the email"),
            (F(70, -2), "the attachment: an NDA to sign"), (F(73, -2), "the button: then call our lawyer"), (F(76), "'a phone or video call', indictment"),
            (F(79, -2), "card: a voice goes in, the CEO's comes out"), (F(80), "'mimic the voice', indictment"), (F(82, -2), "card: nobody's face goes in, the CEO's comes out"),
            (F(85, 3), "'to convince the victim employee', indictment"), (F(91), "name tag: the lawyer, 'our legal representative'"), (F(96), "often from a top-50 law firm, indictment"),
            (F(101), "U.S. Attorney's Office, Nov 5"), (F(105), "'a handwritten script', indictment"), (F(109), "the title is from the indictment"),
            (F(110, 2), "the rest of this page is our scribble"), (F(115), "'often ... millions of dollars', indictment"), (F(119), "November 2024, indictment"),
            (F(125), "November 2024, under the sum"), (F(129), "June 2025, indictment"), (F(134), "June 2025, under the sum"), (F(140), "accounts named in the indictment"),
            (F(147), "'to conceal the source', indictment"), (F(153, 2), "from the case's title page"), (F(163), "an alleged boast, indictment"), (F(167), "'laundered funds', indictment"),
            (F(172, -3), "quote card: the boast; he holds up a cup"), (F(180), "October 2024, indictment"), (F(185), "'a major investment bank', indictment"),
            (F(192, 2), "the employee was deceived, indictment"), (F(198), "$2,849,000 never left, indictment"), (F(202, 4), "extradition requests pending, DOJ, Nov 5"),
            (F(207), "'merely accusations', Justice Department, Nov 5"), (F(211, 4), "defence: no comment reported, AP, Nov 6"), (F(213), "WHAT STOPS A FAKE BOSS?"),
            (F(216), "a back office stopped one, indictment")]
    for n, (t, why) in enumerate(pops):
        fx(t, pop(380 + 60 * (n % 3), 900 + 110 * (n % 3)), -13, 0.15 if n % 2 else -0.15, "pop", why)

    def roll(a, z, f0=1500.0, f1=3000.0, step_s=0.05, lu=-22.5):   # a counter: a dozen ticks per 400 ms sits about 10 LU louder than one tick
        t = a
        while t < z:
            u = (t - a) / (z - a)
            fx(t, tick(f0 + (f1 - f0) * u), lu + 2 * u, 0.1)
            t += step_s - 0.02 * u

    def keys(t0, n, p=-0.2):
        for j in range(n):
            fx(t0 + j * 0.075 * R.uniform(0.8, 1.25), key(), -17, p + R.uniform(-0.1, 0.1))

    def call_tone(t, name="", why=""):
        for j, f in enumerate((1109, 1480)):
            fx(t + j * 0.11, blip(f, 0.1), -14, 0.3, name if j == 0 else "", why)

    def money(t, d, why, lu=-15.5, p=0.3):
        fx(t, flutter(d), lu, p, "banknotes", why)

    # 1: her desk, the call, the reveal
    keys(0.04, 5)
    EVENTS.append((0.04, "typing", "an ordinary morning in accounts"))
    fx(F(1, -1), ringtone(), -11.5, 0.3, "ring", "a video call comes in on 'boss': THE BOSS")
    fx(F(2, 2), ringtone(), -12.5, 0.3, "ring", "it rings again, and she looks up")
    fx(F(2, 2) + 0.56, ringtone(), -14.5, 0.3)
    call_tone(cut_t(1) + f_(1), "call tone", "she answers: we are looking at her screen")
    fx(F(11), shh(), -15, 0.1, "shh", "a finger to his lips: 'tell no one'")
    for j in range(5):
        fx(F(15, -2) + j * 0.05, blip(700 + 260 * ((j * 3) % 5), 0.05), -16, 0.35, "voice print" if j == 0 else "", "his voice, drawn as a row of bars")
    for j in range(2):
        fx(F(17, -2) + j * 0.09, tick(2700), -13.5, 0, "click" if j == 0 else "", "a frame closes on his face")
    fx(F(18), zap(), -10.5, 0, "zap", "the picture breaks up: frame by frame it is him, then it is not")
    fx(F(18) + 0.02, crackle(0.3, 70), -15, 0)
    fx(F(19), whoosh(0.3, R, peak=0.08, f_lo=700, f_hi=3200, tail=0.12), -13, 0, "frame off", "the call's frame flies apart: the face is a plate, and there is a dark room behind it")
    # 2: the prosecutor, the three, the city, the money
    for k, t in enumerate((cut_t(5) + 0.08, cut_t(5) + 0.36)):
        fx(t, shutter(), -15, (-0.5, 0.5)[k])
    EVENTS.append((cut_t(5) + 0.08, "camera shutters", "a press conference in New York"))
    fx(F(25, -2), knock(), -14, 0.1, "click", "he leans in to the microphones on 'say'")
    fx(cut_t(6) + f_(1), knock(), -12.5, 0, "clunk", "three spotlights, three men")
    for k in range(7):
        fx(F(31, 2 + 6 * k), ding(m2f((78, 81, 83, 85, 88, 90, 93)[k]), 0.35), -15 + 0.4 * k, -0.4 + 0.13 * k, "ping", "a call lights up on another company's roof")
    fx(cut_t(8) + f_(1), hum(0.8), -17, -0.2, "machine hum", "the callers' back room: the plate is up, the picture goes out live")
    a, z = F(41, -2), F(46, 5)
    roll(a, z)
    EVENTS.append((a, "counter ticks", "the sum rolls up to $129 million"))
    fx(z, ding(1480, 0.9), -10.5, 0, "counter lands", "$129 MILLION")
    w40, w46 = Wf(40), Wf(46)
    for i in range(11):
        fx(jsround(w40 - 6 + (w46 - w40 + 4) * (i / 10)) / FPS, thump(), -16.5, -0.2 + 0.04 * i, "bundle", f"layer {i + 1} of 11 lands on the pile")
    money(F(40, -14), (w46 - 4 - w40 + 14) / FPS, "bundles fly in from both sides", -17, 0)
    # 3: the indictment, the email
    fx(cut_t(10) + f_(1), paper(), -13, 0.2, "paper", "the indictment's first page")
    keys(cut_t(11) + 0.05, 5)
    fx(F(55, -2), ding(1760, 0.5), -11.5, 0.3, "ding", "an email arrives: from the CEO")
    fx(F(55, -2) + 0.09, ding(2217, 0.6), -12.5, 0.3)
    fx(cut_t(12) + f_(1), click(), -12, 0.2, "click", "she opens it")
    # 4: the call, the back room, the lawyer
    fx(cut_t(14) + f_(1), ringtone(), -12.5, 0.3, "ring", "then the call: he is live on her screen")
    fx(F(80), slide(170, 250, 0.4), -16.5, -0.3, "voice changer", "somebody's voice goes in low and comes out as the CEO's")
    fx(F(84, -3), zap(), -12.5, 0, "zap", "the plate goes up in front of his head: 'his face'")
    call_tone(cut_t(18) + f_(1), "call tone", "another call: a lawyer")
    fx(cut_t(19) + f_(2), zap(), -12.5, 0, "zap", "the same trick with another face")
    fx(cut_t(20) + f_(2), clink(R, 2100, 0.2), -13.5, 0.3, "clink", "a brass name plate on the desk, and the name is somebody's")
    # 5: the script
    fx(F(103, -14), paper(), -13, 0.2, "paper", "he picks up the script")
    for k in range(4):
        fx(cut_t(22) + 0.08 + k * 0.19, pen(), -16, -0.2 + 0.13 * k)
    EVENTS.append((cut_t(22) + 0.08, "pen strokes", "a page in a quick hand"))
    # 6: it worked
    keys(cut_t(24) + 0.05, 6)
    fx(F(113), ding(2093, 0.5), -11, 0.2, "ding", "WIRE SENT")
    fx(F(113) + 0.07, ding(2637, 0.7), -12, 0.2)
    money(F(113, -4), 1.3, "the money leaves her screen")
    fx(cut_t(25) + 0.1, ding(659, 0.6), -15, -0.3, "chime", "a hospital's public address: two notes")
    fx(cut_t(25) + 0.38, ding(523, 0.8), -15.5, -0.3)
    money(F(121, -4), 1.5, "out of the hospital's front door")
    fx(cut_t(27) + 0.22, squeaky_toy(), -13.5, 0.2, "squeak", "a pet food company: the dog's toy, twice")
    money(F(132, -8), 1.3, "out of the loading door and over the dog's head")
    fx(F(132, 5), whimper(), -14, 0.1, "whimper", "the dog looks up and watches it go")
    # 7: nine accounts, the coin machine
    for i in range(9):
        fx(F(137, 3 + jsround(i * 6.1)), ding(m2f((66, 68, 69, 71, 73, 74, 76, 78, 81)[i] + 12), 0.45), -12.5, -0.4 + 0.1 * i, "ping", f"account {i + 1} of 9 lights up: one note of the scale each")
    fx(cut_t(30) + 0.05, coins(1.05, 20), -14, 0.3, "coin stream", "banknotes in at the top, coins out at the side")
    fx(cut_t(30) + 0.02, hum(1.1, 82), -18, -0.3)
    # 8: the aliases
    for k in range(2):
        fx(F(149, 4 * k), step(), -12.5, -0.3 + 0.3 * k, "step", "two of the three step forward")
    for i, who in ((156, "ROCKY BALBOA"), (158, "SUPERMAN CASH"), (160, "IMPOSSIBLE MISSION")):
        fx(F(i), slap(), -9.5, 0, "slap", f"a name sticker: {who}")
    # 9: the laundry
    fx(cut_t(34) + 0.03, washer(cut_t(35) - cut_t(34)), -15.5, 0, "washing machines", "money going round behind eight glass doors")
    fx(cut_t(35), washer(cut_t(36) - cut_t(35), spin=True), -14.5, -0.2, "spin cycle", "close on one drum as it winds up")
    fx(F(172, -3) + 0.06, I.triangle(0.5, R, 0.9), -15, 0.3, "triangle", "the cup goes up")
    # 10: the bank, the gate
    fx(cut_t(39) + 0.03, belt(F(197) - cut_t(39) - 0.03), -17.5, -0.2, "conveyor", "the wire rides a belt towards the way out; it stops when the bundle does")
    fx(F(191, -3), ding(2093, 0.6), -11, -0.3, "ding", "a green tick: the employee has approved it")
    fx(F(195, -2), rattle(0.22, R, density=42), -12.5, 0.2, "shutter", "the back office's shutter comes down")
    fx(F(195, -2), slide(620, 240, 0.24), -15, 0.2)
    fx(F(195, 6), clang(), -9.5, 0.2, "clang", "it lands")
    fx(F(197) + 0.03, buzz(0.22, 147), -12.5, 0, "hit", "the bundle runs into it: the room turns red")
    # 11: the arrests, the scales
    for k, (i, why) in enumerate(((199, "June 17, Spain"), (200, "August 5, Spain"), (202, "September 7, United Kingdom"))):
        fx(F(i), knock(), -11.5, -0.3 + 0.3 * k, "clunk", f"a calendar leaf: {why}")
        fx(F(i) + 0.05, ratchet(), -14, -0.3 + 0.3 * k)
    fx(cut_t(42) + 0.12, creak(0.4, R), -16, 0, "creak", "the scales, with the indictment in one pan: they have not moved")
    # 12: the question
    for k, i in enumerate((218, 222)):
        fx(F(i), knock(), -12.5, -0.4 + 0.8 * k, "clunk", f"a spotlight comes up on {('the employee with the magnifying glass', 'the two who check each other')[k]}")
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
GRAPHIC_SOUNDS = {"stamp thud", "pop", "ding", "ping", "counter lands", "click", "hit", "call tone", "frame off", "zap", "clunk", "chime", "ring", "voice print", "bundle", "paper", "step", "slap",
                  "shutter", "clang", "squeak", "whimper", "clink", "triangle"}


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
    print("buses, LUFS before the mix (waltz with the horn, waltz with the music box):", {k: (round(float(x), 1), round(float(y), 1)) for k, (x, y) in DIAG["buses"].items()})
    with open(os.path.join(SHOOT, "qa-shots.json"), "w") as f:
        json.dump({"shots": [{"id": i + 1, "a": CUTS[i], "b": CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL} for i in range(len(CUTS))], "planned": planned_changes()}, f)
        f.write("\n")
    rows = "\n".join(f"| {t:6.2f} | {jsround(t * FPS):4d} | {name} | {why} |" for t, name, why in sorted(EVENTS))
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("# Fake boss short: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()
