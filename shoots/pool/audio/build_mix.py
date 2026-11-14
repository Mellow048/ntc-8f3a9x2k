"""Soundtrack for the buried-gold short: narration + an original score + effects that follow the picture.

    python shoots/pool/audio/build_mix.py

Reads   ../voice/voice.wav, ../voice/words.json and the shot list in remotion-app/src/videos/pool/story.ts
Writes  mix.wav (48 kHz stereo, the film's whole soundtrack), cues.md (levels and every cue), ../qa-shots.json

Everything but the voice is synthesized here with the kit in templates/audio; nothing is sampled. The mixing half
(ducking, the 1.2-5 kHz pocket, the ceiling that keeps accents off the words, the limiter) is the one the other news
films use; the tune, its instruments and every effect cue are this film's own.

The score: D minor at 92 beats a minute, in four, with a pizzicato walk instead of a beat — money counted quietly in a
suburban garden. A low pad holds D; the walk goes D, F, A, C and back. The motif is D, F, E, D, C, D, and it means the
man who buried the gold. On the discovery it is a kettledrum and a bell; at the town hall a dry two-note figure from a
muted brass; the code gets a slow chorale and the bell again on "it is yours"; the culture office answers with a vibes
tremolo a minor second apart, then a clean marimba phrase. The foundry is timpani and a cymbal; the gendarmes are a
brush ostinato over staccato pizzicato. The dead owner takes the pad down to B flat and nearly nothing else. The
prefecture's verdict turns to F major for a moment — relief — and the tax is a clockwork: sixteen pizzicato notes a
bar, a marimba walking down to the number. The press is a snare pulse under the motif, the night is wind and one bell,
and the closing question plays the first four notes of the motif and stops on the second degree, in the air.
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
from sfx_gen import (whoosh, clink, rattle, boot, hammer_hit, breeze, crickets, bubbles, wood_crack,  # noqa: E402
                     creak, babble, bird_chirps)

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
WEAK_WORDS: dict[int, tuple[float, float]] = {16: (3.0, -2.5), 81: (3.5, -3.0), 168: (3.5, -3.0), 173: (2.0, -1.5), 216: (2.5, -2.0)}

WORDS = json.load(open(os.path.join(SHOOT, "voice", "words.json")))
STORY = open(os.path.join(REPO, "remotion-app", "src", "videos", "pool", "story.ts")).read()
jsround = lambda x: int(np.floor(x + 0.5))
Wf = lambda i: jsround(WORDS[i]["start"] * FPS)
Wt = lambda i: Wf(i) / FPS
F = lambda i, d=0: (Wf(i) + d) / FPS
TOTAL = jsround((WORDS[-1]["end"] + 1.55) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
CUTS = [max(0, Wf(int(m)) - 2) for m in re.findall(r"^\s*s\((\d+), '", STORY, re.M)]   # first frame of every shot
assert len(CUTS) == 44 and CUTS[0] == 0, CUTS
JOINS: set[int] = set()                                         # no take runs over a cut in this film
cut_t = lambda i: CUTS[i] / FPS
shot_end = lambda i: (CUTS[i + 1] if i + 1 < len(CUTS) else TOTAL) / FPS
smoothstep = lambda f, a, b: (lambda u: u * u * (3 - 2 * u))(min(1.0, max(0.0, (f - a) / (b - a))))

R = rng(20261114)
EVENTS: list[tuple[float, str, str]] = []                      # (time, sound, why) for the cue sheet


# ------------------------------------------------------------------------------------------------ music
# D minor at 92 beats a minute, in four. No other news film is in D, and none counts in pizzicato.
BPM = 92.0
BEAT = 60.0 / BPM
E8 = BEAT / 2
BAR = 4 * BEAT
BUS = {k: np.zeros((2, N + SR * 6)) for k in ("drums", "bass", "comp", "lead", "hits")}
ROOTS = [38, 34, 41, 36]                                         # D, B flat, F, C: a bar each
# the motif: D, F, E, D, C, D — the man who buried it. On the bar's beats, as (beat, note).
MOTIF = [(0, 74), (1, 77), (1.5, 76), (2, 74), (3, 72), (3.5, 74)]

m2f = I.m2f
_notes: dict = {}


def cached(key, fn):
    if key not in _notes:
        _notes[key] = fn()
    return _notes[key]


pluckn = lambda m, d=0.9: cached(("pluck", m, d), lambda: I.pluck(m2f(m), 0.7, R, d, 0.42, pos=0.14))
glockn = lambda m, d=1.6: cached(("glock", m, d), lambda: I.glock(m2f(m), 0.5, R, d))
viben = lambda m, d=1.8: cached(("vibe", m, d), lambda: I.vibes(m2f(m), 0.5, R, d))
mboxn = lambda m, d=1.3: cached(("mbox", m, d), lambda: I.musicbox(m2f(m), 0.55, R, d))
trian = lambda m, d=2.2: cached(("tri", m, d), lambda: I.triangle(0.5, R, d, m2f(m)))
horn = lambda m, d=1.1, k="horn": cached(("brass", m, round(d, 3), k), lambda: I.brass(m2f(m), d, 0.7, R, k))
tuba = lambda m, d=1.4: cached(("brass", m, round(d, 3), "tuba"), lambda: I.brass(m2f(m), d, 0.8, R, "tuba"))
kett = lambda m, d=2.4: cached(("kett", m, d), lambda: I.timpani(m2f(m), 0.8, R, d))
pluckd = lambda m, d=0.35: cached(("pluck-dry", m), lambda: I.pluck(m2f(m), 0.8, R, d, 0.28, pos=0.09))


def put(bus, x, t, gain=1.0, p=0.0):
    if 0 <= t < DUR + 3:
        place(BUS[bus], pan(x, p) if getattr(x, "ndim", 1) == 1 else x, t, gain)


def swell(t0, t1, notes, g=0.12, warm=900.0, att=0.9, rel=1.2):
    put("comp", I.pad([m2f(m) for m in notes], max(0.4, t1 - t0), 0.45, R, att=att, rel=rel, warm=warm), t0, g)


def motif(t0, g=1.0, bus="lead", voice=horn, oct=0, d=1.1, p=0.15):
    for b, m in MOTIF:
        put(bus, voice(m + oct, d), t0 + b * BEAT, g, p)


def walk(t0, t1, notes, g=0.34, every=E8, voice=pluckd):
    """the pizzicato walk: one note every eighth, up and down, under everything"""
    t, k = t0, 0
    while t < t1 - 0.02:
        put("lead", voice(notes[k % len(notes)]), t, g, -0.3 + 0.6 * ((k * 7) % 5) / 4)
        t += every
        k += 1


def build_music():
    # ---- 1, the discovery (shots 0-4): a pad on D, kettledrum and brush on the bar, the walk underneath
    swell(0.0, cut_t(5), (38, 45, 50, 57), 0.14, warm=800.0, att=0.5)
    t = 0.0
    while t < cut_t(5) - 0.05:
        put("drums", kett(38), t, 0.42)
        put("drums", I.brush(0.4, R, 0.35, swish=True), t + 2 * BEAT, 0.38, 0.2)
        put("bass", tuba(38, 1.6), t, 0.45)
        t += BAR
    walk(0.0, cut_t(5), [50, 53, 57, 62, 57, 53], 0.3)
    put("lead", glockn(86, 1.8), cut_t(4) + 0.05, 0.5, 0.25)      # the gold, in the bucket
    EVENTS.append((0.0, "music in", "the garden: D minor at 92, a low pad, a kettledrum and a brush on the bar, a pizzicato walk"))
    # ---- 2, five bars, many coins (5-8): a marimba arpeggio, and a bell on the number
    swell(cut_t(5), cut_t(9), (38, 45, 52, 57, 60), 0.12, warm=900.0, att=0.6)
    for j, m in enumerate((74, 77, 81, 84, 81, 77)):
        put("lead", mboxn(m, 1.2), cut_t(5) + 0.2 + j * 0.22, 0.3, -0.3 + 0.12 * j)
    put("lead", glockn(93, 2.0), F(36), 0.46, 0)
    put("bass", tuba(38, 2.0), cut_t(5), 0.4)
    EVENTS.append((cut_t(5) + 0.2, "marimba", "'five bars, many coins': the count, up a D minor arpeggio"))
    EVENTS.append((F(36), "one bell", "'seven hundred thousand euros': a bell, high, over the walk"))
    # ---- 3, the town hall (9-12): dry, bureaucratic: staccato pizzicato, two muted brass notes
    walk(cut_t(9), cut_t(13), [50, 50, 53, 50, 57, 50], 0.34, every=BEAT, voice=pluckd)
    put("comp", horn(62, 0.5), cut_t(9) + 0.1, 0.3, -0.2)
    put("comp", horn(57, 0.6), cut_t(9) + 0.55, 0.28, -0.1)
    put("drums", I.brush(0.3, R, 0.3), cut_t(9) + 0.02, 0.3, -0.2)
    EVENTS.append((cut_t(9) + 0.1, "muted brass, two notes", "'he rang the town hall': the two notes of a clerk's answer"))
    # ---- 4, the code (13-16): the chorale, and the bell on "it is yours"
    swell(cut_t(13), cut_t(17), (38, 45, 50, 53, 57), 0.16, warm=700.0, att=1.0, rel=1.4)
    for j, m in enumerate((50, 53, 57, 62)):
        put("bass", tuba(m - 12, 2.4), cut_t(13) + 0.1 + j * 0.9, 0.4)
    put("lead", glockn(86, 2.6), F(93), 0.5, 0.15)
    put("lead", trian(81, 2.0), F(95), 0.32, -0.2)
    EVENTS.append((cut_t(13), "a chorale, slow", "'a treasure is a thing buried so long': a pad and a low brass chorale"))
    EVENTS.append((F(93), "one bell", "'on your own land it is yours': the bell, and the pad holds"))
    # ---- 5, the state, and the culture office (16-19)
    swell(cut_t(16), cut_t(20), (37, 44, 49, 56), 0.14, warm=600.0, att=0.8)   # the pad turns to C sharp: the state
    put("drums", kett(37), cut_t(16) + 0.05, 0.45)
    put("lead", viben(74, 2.2), cut_t(17) + 0.1, 0.36, -0.2)
    for j, m in enumerate((69, 74, 77, 81)):
        put("lead", mboxn(m, 1.1), cut_t(18) + 0.2 + j * 0.26, 0.28, -0.2 + 0.13 * j)
    put("lead", trian(88, 1.6), F(114), 0.3, 0.3)                 # the loupe comes down
    EVENTS.append((cut_t(16) + 0.05, "a kettledrum, and the pad to C sharp", "'unless it is archaeology': the pad drops a semitone and the drum answers"))
    # ---- 6, the foundry (20-22): timpani, a cymbal swell, low brass on F
    put("drums", I.cymbal(0.6, R, 2.2), cut_t(20) + 0.05, 0.34, 0.2)
    for j in range(6):
        put("drums", kett(41 if j % 2 else 34), cut_t(20) + 0.1 + j * BEAT, 0.5 - 0.05 * j, -0.2 + 0.08 * j)
    swell(cut_t(20), cut_t(23), (34, 41, 46, 53), 0.13, warm=500.0, att=0.4)
    put("bass", tuba(34, 2.6), cut_t(20), 0.5)
    put("lead", horn(65, 1.2), cut_t(21) + 0.1, 0.34, 0.1)
    put("lead", horn(69, 1.4), F(131), 0.34, 0.15)
    EVENTS.append((cut_t(20) + 0.05, "timpani and a cymbal", "'the gold had been melted': the furnace, in six drum strokes"))
    # ---- 7, the gendarmes (23-26): a brush ostinato, staccato pizzicato, a bell on "nothing stolen"
    walk(cut_t(23), cut_t(27), [57, 60, 57, 53], 0.3, every=E8)
    t = cut_t(23)
    while t < cut_t(27) - 0.05:
        for b in range(4):
            put("drums", I.brush(0.22, R, 0.28), t + b * BEAT, 0.3, 0.25 if b % 2 else -0.25)
        t += BAR
    put("lead", glockn(81, 1.8), F(149), 0.42, 0.2)                # nothing stolen
    EVENTS.append((cut_t(23), "a brush ostinato", "'the bars carry serial numbers': the desk, the file, the ticks"))
    EVENTS.append((F(149), "a bell, clean", "'found nothing stolen': the one clean note of the section"))
    # ---- 8, the previous owner (27-29): the pad down to B flat, and almost nothing
    swell(cut_t(27), cut_t(30), (34, 41, 46, 53), 0.15, warm=700.0, att=1.2, rel=1.6)
    put("bass", tuba(34, 3.0), cut_t(27), 0.42)
    put("lead", viben(65, 2.4), cut_t(28) + 0.2, 0.3, -0.15)
    put("lead", viben(62, 2.6), F(177), 0.32, -0.15)
    put("drums", kett(34), F(177), 0.4)
    EVENTS.append((cut_t(27), "the pad to B flat, almost alone", "'then they went looking for the man who buried it': the music thins to a pad and one note"))
    EVENTS.append((F(177), "a low bell", "'he was dead': one note, and the drum under it"))
    # ---- 9, the verdict (30-31): dry again, then F major for a moment
    put("drums", I.brush(0.3, R, 0.3), cut_t(30) + 0.05, 0.3, -0.2)
    for j, m in enumerate((57, 57, 60)):
        put("lead", pluckd(m), cut_t(30) + 0.1 + j * BEAT, 0.34, -0.2 + 0.2 * j)
    swell(cut_t(30), cut_t(32), (41, 48, 53, 57), 0.15, warm=1100.0, att=0.4)   # F major: not heritage, relief
    for j, m in enumerate((77, 81, 84)):
        put("lead", glockn(m, 1.6), F(191) + 0.1 + j * 0.2, 0.34, -0.2 + 0.2 * j)
    motif(cut_t(31) + 0.1, 0.4, "comp", horn, -12, 1.2)
    EVENTS.append((cut_t(30), "dry, then F major", "'no heir came forward': three dry notes; 'not heritage' turns the pad to F"))
    EVENTS.append((F(191), "bells, up a major triad", "'the gold was not heritage': relief, for four seconds"))
    EVENTS.append((cut_t(31) + 0.1, "the motif, low", "'it went to the man with the pool': the motif in the horn, low"))
    # ---- 10, the tax (32-36): a clockwork
    t = cut_t(32)
    k = 0
    while t < cut_t(37) - 0.02:
        put("drums", I.brush(0.16, R, 0.22), t, 0.24, 0.3 if k % 2 else -0.3)
        t += E8
        k += 1
    walk(cut_t(32), cut_t(37), [50, 53, 57, 62, 65, 62, 57, 53], 0.26, every=E8)
    for j, m in enumerate((84, 81, 77, 74)):
        put("lead", mboxn(m, 1.0), F(212) + 0.05 + j * 0.2, 0.3, 0.2 - 0.1 * j)   # walking down to the number
    put("drums", kett(38), F(212), 0.5)
    put("lead", glockn(86, 2.4), F(223), 0.34, 0.1)
    swell(F(226), cut_t(37), (41, 48, 53, 57), 0.14, warm=1000.0, att=0.3)        # resolved: he keeps
    put("lead", trian(84, 2.0), F(226), 0.32, 0.2)
    EVENTS.append((cut_t(32), "a clockwork", "'which leaves the tax': a sixteenth-note brush and the walk, all business"))
    EVENTS.append((F(212), "a drum, and the marimba down", "'eleven and a half per cent': the drum, then four notes walking down"))
    EVENTS.append((F(226), "a major chord", "'he keeps six hundred and nineteen thousand five hundred': the figure resolves to F"))
    # ---- 11, the press (37-39)
    swell(cut_t(37), cut_t(40), (38, 45, 50, 57), 0.13, warm=700.0, att=0.5)
    t = cut_t(37)
    while t < cut_t(40) - 0.05:
        for b in (0, 1.5, 2, 3):
            put("drums", I.brush(0.2, R, 0.26), t + b * BEAT, 0.28, 0.3 if int(b) % 2 else -0.3)
        t += BAR
    motif(cut_t(37) + 0.2, 0.34, "comp", horn, -12, 1.4)
    put("lead", glockn(81, 1.6), F(241), 0.36, 0.2)
    EVENTS.append((cut_t(37), "a snare-pulse, the motif low", "'he has refused every interview': the pack, and the motif underneath"))
    # ---- 12, the night (40-42)
    swell(cut_t(40), cut_t(43), (38, 45, 50, 57, 62), 0.14, warm=500.0, att=1.4, rel=1.6)
    put("lead", trian(74, 2.6), cut_t(40) + 0.2, 0.3, -0.2)
    put("lead", mboxn(77, 2.0), F(262), 0.3, 0.2)
    put("drums", kett(38), F(262), 0.36)
    EVENTS.append((cut_t(40), "wind, a pad, one triangle", "'somebody put seven hundred thousand euros in plastic bags': the garden at night"))
    # ---- 13, the question (43): the first four notes, and it stops on the second degree
    swell(cut_t(43), DUR, (38, 45, 50, 57), 0.13, warm=900.0, att=0.6, rel=1.6)
    for j, m in enumerate((74, 77, 76, 74)):
        put("lead", glockn(m, 1.8), cut_t(43) + 0.2 + j * 0.34, 0.42, -0.2 + 0.12 * j)
    e = WORDS[-1]["end"] + 0.2
    put("lead", trian(76, 3.0), e, 0.38, 0)                       # E, the second degree: no home chord
    put("bass", tuba(38, 1.8), e, 0.45)
    EVENTS.append((cut_t(43) + 0.2, "the motif, unanswered", "'so who was he': four notes on bells, stopping on E over D"))

    end = np.ones(N)
    end[-ns(0.6):] = np.linspace(1, 0, ns(0.6)) ** 2
    dry = 1.2 * BUS["drums"] + 0.8 * BUS["bass"] + 1.0 * BUS["comp"] + 1.0 * BUS["lead"] + 0.6 * BUS["hits"]
    send = 0.12 * BUS["drums"] + 0.5 * BUS["comp"] + 0.55 * BUS["lead"] + 0.3 * BUS["hits"] + 0.1 * BUS["bass"]
    wet = convolve_st(send, make_ir(1.6, 11, hf=1.0))
    out = shelf(hp(dry + 0.28 * wet, 34), 3200, 2.5)[:, :N] * end[None, :]
    DIAG["buses"] = {k: (integrated(v[:, : ns(cut_t(5))]), integrated(v[:, ns(cut_t(13)): ns(cut_t(17))])) for k, v in BUS.items()}
    return out


# ------------------------------------------------------------------------------------------------ sound effects
def thud(heavy=1.0):
    t = tt(0.36)
    y = np.sin(phase(52 + 130 * np.exp(-t / 0.02))) * np.exp(-t / 0.09) * heavy
    y += lp(R.standard_normal(len(t)), 2600) * np.exp(-t / 0.012) * 0.9 + bp(R.standard_normal(len(t)), 300, 1200) * np.exp(-t / 0.04) * 0.4
    return fades(y, 0.0005, 0.05)


def pop(f0=420.0, f1=980.0, d=0.075):
    t = tt(d)
    return fades(np.sin(phase(f0 + (f1 - f0) * t / d)) * np.exp(-t / (d * 0.4)), 0.001, 0.02)


def click(f=2200.0):
    t = tt(0.05)
    return fades(bp(R.standard_normal(len(t)), f * 0.6, f * 1.4) * np.exp(-t / 0.006) * 0.7, 0.0005, 0.012)


def shutter():
    """a press camera: two clicks and a rewind"""
    t = tt(0.34)
    y = bp(R.standard_normal(len(t)), 1400, 5200) * np.exp(-t / 0.011) * 0.7
    y += bp(R.standard_normal(len(t)), 900, 3000) * np.exp(-((t - 0.075) / 0.014) ** 2) * 0.6
    y += bp(R.standard_normal(len(t)), 500, 1500) * np.clip((t - 0.12) / 0.2, 0, 1) * np.exp(-t / 0.16) * 0.22
    return fades(y, 0.001, 0.08)


def engine(d=2.0, f=48.0):
    """the digger: a diesel at idle, and the hydraulic hiss of the arm"""
    t = tt(d)
    hum = np.sin(phase(f + 1.6 * np.sin(TAU * 5.5 * t))) + 0.5 * np.sin(phase(2 * f + 0.9 * np.sin(TAU * 7.0 * t)))
    hum += 0.35 * np.sin(phase(3.01 * f))
    y = lp(hum, 220) * 0.5 + bp(R.standard_normal(len(t)), 90, 600) * 0.18
    y += bp(R.standard_normal(len(t)), 1800, 6000) * (np.clip((t - d * 0.35) / 0.1, 0, 1) * np.exp(-(t - d * 0.35) / 0.18)) * 0.22
    return fades(y, 0.05, 0.3)


def soil(d=0.8):
    """a bucket of wet soil tipped out"""
    t = tt(d)
    y = lp(R.standard_normal(len(t)), 240) * np.exp(-t / 0.16) * 0.7 + bp(R.standard_normal(len(t)), 400, 2600) * np.exp(-t / 0.09) * 0.35
    grain = np.zeros(len(t))
    for k in range(90):
        i = int(R.uniform() ** 1.6 * len(t) * 0.95)
        grain[i:i + 60] += R.uniform(0.3, 1.0) * np.exp(-np.arange(min(60, len(grain) - i)) / 9.0)
    return fades(y + lp(grain, 5000) * 0.5, 0.002, 0.15)


def plastic(d=0.6):
    """a supermarket bag, full of something heavy"""
    t = tt(d)
    y = bp(R.standard_normal(len(t)), 1600, 7000) * 0.5
    crinkle = np.zeros(len(t))
    for k in range(26):
        i = int(R.uniform() * len(t) * 0.9)
        n = min(int(R.uniform(200, 900)), len(crinkle) - i)
        crinkle[i:i + n] += np.exp(-np.arange(n) / 90.0) * R.uniform(0.4, 1.0)
    y = y * np.clip(crinkle * 1.6, 0, 1)
    return fades(y, 0.004, 0.1)


def keys(n=4, gap=0.075):
    t = tt(gap * n + 0.1)
    y = np.zeros(len(t))
    for k in range(n):
        i = int(k * gap * SR)
        seg = click(2600.0 + 200 * (k % 3))
        y[i:i + len(seg)] = np.maximum(y[i:i + len(seg)], seg[: len(y) - i]) * 0.7
    return y


def clang(d=1.4, f=520.0):
    """a bar of gold set down on a steel bench: dull, because gold is heavy"""
    t = tt(d)
    y = modal(d, [(f, 1.0, 0.55), (f * 2.02, 0.5, 0.32), (f * 3.4, 0.28, 0.18), (f * 5.1, 0.14, 0.1)], R) * 0.6
    y = y + lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.03) * 0.5
    return fades(y, 0.001, 0.2)


def furnace(d=3.0):
    t = tt(d)
    roar = bp(R.standard_normal(len(t)), 60, 700) * (0.6 + 0.4 * np.sin(TAU * 0.7 * t))
    roar += lp(R.standard_normal(len(t)), 90) * 0.4
    return fades(roar * 0.6, 0.2, 0.6)


def mictap():
    t = tt(0.18)
    return fades(lp(R.standard_normal(len(t)), 500) * np.exp(-t / 0.02) * 0.8, 0.0005, 0.05)


def sfx_build(voice_lufs):
    buf = np.zeros((2, N + SR * 3))

    def fx(t, x, lu, p=0.0, name="", why=""):
        if t < 0 or t >= DUR:
            return
        if getattr(x, "ndim", 1) == 2:
            x = x.mean(0)
        place(buf, pan(norm_to(x, voice_lufs + lu), p), t)
        if name:
            EVENTS.append((t, name, why))

    # every cut gets a small swish
    for i in range(1, len(CUTS)):
        fx(cut_t(i) - 0.1, whoosh(0.28, R, peak=0.09, f_lo=380, f_hi=2200 + 240 * (i % 3), tail=0.08), -18, 0.35 if i % 2 else -0.35)
    EVENTS.append((cut_t(1), "swish", f"on {len(CUTS) - 1} cuts, alternating left and right"))

    # 1: the dig
    fx(0.15, engine(3.4), -19, -0.2, "digger", "the digger, idling over the hole")
    fx(cut_t(1) + 0.2, engine(2.2), -21, 0.35, "", "")
    fx(cut_t(2) + 0.05, soil(0.9), -16, -0.1, "soil", "'cut a hole': the bucket tips the soil out")
    fx(cut_t(3) + 0.05, soil(0.7), -17, 0.2, "", "")
    fx(cut_t(4) + 0.05, plastic(0.7), -15, 0.15, "plastic", "'plastic bags': the bag comes up")
    fx(cut_t(4) + 0.35, clang(1.1, 460.0), -15, 0.1, "gold", "and something heavy in the bottom of it")
    # 2: five bars, many coins
    for k in range(5):
        fx(cut_t(5) + 0.12 + 0.19 * k, clang(0.9, 380 + 40 * k), -19, -0.35 + 0.17 * k, "bar" if k == 0 else "", "a bar set down on the table")
    for k in range(6):
        fx(cut_t(6) + 0.1 + 0.1 * k, clink(R, 1500 + 120 * k, 0.12, 1.1), -20, 0.3 - 0.1 * k, "coins", "coins poured out")
    # 3: the town hall
    fx(cut_t(9) + 0.1, thud(0.6), -15, 0.2, "counter", "the bag on the counter")
    fx(cut_t(10) + 0.15, plastic(0.5), -19, -0.2, "", "")
    for k in range(8):
        fx(cut_t(11) + 0.15 + 0.11 * k, click(2200.0), -21, 0.25, "keys" if k == 0 else "", "the clerk's keyboard")
    # 4-5: the code and the state
    fx(cut_t(12) + 0.08, rattle(0.55, R, 22), -17, 0.1, "paper", "'the code says': a page turned")
    fx(cut_t(12) + 0.9, rattle(0.4, R, 14), -20, -0.2)
    fx(cut_t(16) + 0.05, thud(0.9), -13, 0, "stamp", "'archaeology': the state's stamp")
    # 6: the culture office, and the foundry
    fx(cut_t(17) + 0.15, rattle(0.5, R, 16), -19, -0.2, "paper", "a folder opened")
    fx(cut_t(19) + 0.05, clink(R, 900.0, 0.18, 0.8), -16, 0.15, "loupe", "'no history in it': the loupe on the bar")
    fx(cut_t(20) + 0.05, furnace(3.2), -14, 0, "furnace", "'the gold had been melted': the furnace")
    fx(cut_t(21) + 0.1, clang(1.6, 300.0), -15, 0.2, "pour", "the pour")
    fx(cut_t(22) + 0.05, clang(1.2, 340.0), -14, -0.1, "bars", "'a company in Lyon': fresh bars, stacked")
    # 7: the gendarmes
    fx(cut_t(23) + 0.1, click(1800.0), -18, 0.2, "keys", "a case file, opened")
    for k in range(6):
        fx(cut_t(25) + 0.1 + 0.13 * k, click(2400.0 + 100 * (k % 3)), -20, -0.2 + 0.08 * k, "tick" if k == 0 else "", "the numbers, checked one by one")
    fx(cut_t(26) + 0.12, thud(0.5), -18, 0.15, "thud", "'nothing stolen': the file closed")
    # 8-9: the dead man, the verdict
    fx(cut_t(27) + 0.1, breeze(3.0, R, 0.7), -19, 0.1, "wind", "the garden, late")
    fx(cut_t(28) + 0.1, bird_chirps(2.0, R, 0.18), -22, -0.3, "", "")
    fx(cut_t(29) + 0.05, creak(1.0, R, 90, 130, rough=0.2), -19, 0.2, "creak", "'he was dead': the chair on the porch")
    fx(cut_t(30) + 0.08, rattle(0.5, R, 18), -17, -0.1, "paper", "the form, on the counter")
    fx(cut_t(30) + 0.45, thud(0.8), -14, 0, "stamp", "the stamp comes down")
    fx(cut_t(31) + 0.1, wood_crack(R), -16, 0.1, "wood", "the crate on the counter")
    fx(cut_t(31) + 0.25, clang(0.9, 420.0), -18, 0.2, "", "")
    # 10: the tax
    fx(cut_t(32) + 0.1, rattle(0.5, R, 16), -18, -0.2, "paper", "the ledger")
    for k in range(9):
        fx(cut_t(33) + 0.1 + 0.09 * k, click(2600.0), -20, 0.25, "calculator" if k == 0 else "", "keys on the calculator")
    for w in (212, 220, 226):
        fx(F(w) + 0.04, click(2400.0), -17, 0.1, "key", f"the readout, on word {w}")
    # 11: the press
    for k in range(10):
        fx(cut_t(37) + 0.2 + 0.24 * k, shutter(), -19, -0.4 + 0.09 * k, "shutter" if k % 4 == 0 else "", "a press camera")
    fx(cut_t(37) + 0.12, babble(2.4, R, 150.0, 1.0, 3.6, 0.5), -24, 0, "", "")
    fx(cut_t(38) + 0.05, rattle(0.5, R, 26), -17, 0, "newsprint", "'the local paper': the page turned")
    fx(cut_t(39) + 0.1, mictap(), -15, 0.15, "mic", "'no interviews': a microphone knocked")
    # 12-13: night, and the question
    fx(cut_t(40) + 0.1, breeze(4.0, R, 0.9), -18, 0, "wind", "the garden at night")
    fx(cut_t(40) + 0.2, crickets(4.0, R, 3), -24, 0.2, "", "")
    fx(cut_t(41) + 0.05, plastic(0.45), -21, -0.15, "plastic", "'in plastic bags': the bags again")
    fx(cut_t(43) + 0.1, breeze(3.6, R, 0.7), -20, 0, "wind", "the question, in the dark")

    # the graphic layer: a thud for every sticker, a pop for every plate (same cues as Overlays.tsx)
    for w in (29, 36, 68, 93, 99, 118, 128, 147, 177, 179, 191, 208, 212, 220, 226, 235):
        fx(F(w), thud(0.7), -12, 0, "stamp", f"the sticker on word {w}")
    for w in (17, 34, 44, 81, 110, 151, 156, 167, 188, 200, 218, 244, 256, 280):
        fx(F(w) + 0.05, pop(420.0 + 26 * (w % 4), 940.0 + 35 * (w % 3), 0.07), -15, 0.3 if w % 2 else -0.3, "pop", f"the plate on word {w}")
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
    sfx = sfx_build(v_lufs) * end[None, :]
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
        f.write("# The gold under the pool: soundtrack cue sheet\n\nWritten by `build_mix.py`. All music and effects are synthesized in that script; nothing is sampled.\n\n"
                + "\n".join(report) + "\n\n| time s | frame | sound | why |\n|---|---|---|---|\n" + rows + "\n")


if __name__ == "__main__":
    main()

