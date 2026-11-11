# Original comedic march & waltz score for "The Giant Golden Ball Inside Taipei 101"
# (F major / Bb major, synthesized via instruments.py):
#   hook (0-4.6s): bold glock + brass march hook, hard stop on flash
#   city (4.73-13.0s): brisk upbeat fife + tuba/horn oom-pah march for Taipei 101
#   office (13.0-23.13s): wobbly chromatic swaying march as 90th floor rocks
#   reveal (23.13-30.4s): stately brass + glock engineering motif for the 660-ton sphere
#   boat (30.4-36.73s): warm golden-hour music-box & pizzicato 3/4 waltz for the rowboat analogy
#   mechanism (36.73-43.03s): crisp rhythmic counter-swing march
#   typhoon (43.03-49.57s): snare roll + timpani + brass stabs on Typhoon Soudelor & 1m swing
#   aftermath (49.57-59.27s): light deadpan pizzicato + vibes through "Luckily / Unluckily / dark closet"
#   finale (59.27-65.5s): bright celebratory swung vibes + glock + brushes for golden gallery & cute mascot!

import numpy as np
from dsp import SR, ns, rng, pan, place, dbg, make_ir, convolve_st, integrated, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5  # 120 bpm quarter note = 0.5 s
F = I.m2f

CH = {
    "F":  dict(oom=(41, 36), pah=[53, 57, 60], hi=[60, 65, 69]),
    "Bb": dict(oom=(34, 41), pah=[53, 58, 62], hi=[58, 62, 65]),
    "C7": dict(oom=(36, 43), pah=[52, 55, 58, 60], hi=[58, 60, 64]),
    "Dm": dict(oom=(38, 45), pah=[53, 57, 62], hi=[57, 62, 65]),
    "Gm": dict(oom=(43, 38), pah=[55, 58, 62], hi=[58, 62, 67]),
    "A7": dict(oom=(45, 40), pah=[52, 57, 61], hi=[57, 61, 64]),
}

# Melodic motif (bar 1..8 in F major, lively storybook march)
MOTIF = [
    (1, 0, 1.0, 77), (1, 1, 0.75, 81), (1, 1.75, 0.25, 82), (1, 2, 1.0, 84), (1, 3, 1.0, 77),
    (2, 0, 1.0, 82), (2, 1, 0.5, 81), (2, 1.5, 0.5, 79), (2, 2, 1.5, 81), (2, 3.5, 0.5, 77),
    (3, 0, 0.75, 79), (3, 0.75, 0.25, 81), (3, 1, 0.5, 82), (3, 1.5, 0.5, 84), (3, 2, 1.0, 86), (3, 3, 1.0, 79),
    (4, 0, 2.0, 84), (4, 2.5, 0.5, 77), (4, 3.0, 0.5, 79), (4, 3.5, 0.5, 81),
    (5, 0, 1.0, 84), (5, 1, 0.75, 86), (5, 1.75, 0.25, 88), (5, 2, 1.0, 89), (5, 3, 1.0, 84),
    (6, 0, 0.5, 86), (6, 0.5, 0.5, 84), (6, 1, 0.5, 82), (6, 1.5, 0.5, 81), (6, 2, 1.5, 79), (6, 3.5, 0.5, 81),
    (7, 0, 1.0, 82), (7, 1, 0.5, 81), (7, 1.5, 0.5, 79), (7, 2, 1.0, 77), (7, 3, 1.0, 84),
    (8, 0, 1.5, 77), (8, 2, 1.0, 72), (8, 3, 1.0, 77),
]
PROG = {
    1: ["F", "F", "F", "F"],
    2: ["Bb", "Bb", "F", "F"],
    3: ["Gm", "Gm", "C7", "C7"],
    4: ["F", "F", "C7", "C7"],
    5: ["F", "F", "Dm", "Dm"],
    6: ["Gm", "Gm", "C7", "C7"],
    7: ["Bb", "C7", "F", "Dm"],
    8: ["Gm", "C7", "F", "F"],
}

SECTIONS = [
    ("hook", 0.0, T.FLASH),
    ("city", T.FLASH, 13.0),
    ("office", 13.0, 23.13),
    ("reveal", 23.13, 30.4),
    ("boat", 30.4, 36.73),
    ("mechanism", 36.73, 43.03),
    ("typhoon", 43.03, 49.57),
    ("aftermath", 49.57, 59.27),
    ("finale", 59.27, T.DUR),
]


class Band:
    def __init__(self):
        self.tr = {}
        self.send = {}
        self.cues = []

    def track(self, name, send=0.16):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
            self.send[name] = send
        return self.tr[name]

    def add(self, name, x, t, p=0.0, g=1.0, send=0.16):
        if t >= T.DUR or t < 0:
            return
        buf = self.track(name, send)
        place(buf, pan(x, p) if np.ndim(x) == 1 else x, t, g)


R = rng(2004101)
_r = lambda: rng(int(R.integers(1 << 30)))


def oompah_bar(b, t0, chords, vel=0.58, pah_vel=0.36, light_snare=True):
    for beat in range(4):
        t = t0 + beat * Q
        if t >= T.DUR - 0.15:
            break
        c = CH[chords[beat]]
        root = c["oom"][beat % 2]
        b.add("tuba", I.brass(F(root), 0.24, vel, _r(), "tuba"), t, -0.12)
        for m in c["pah"]:
            b.add("pah", I.brass(F(m), 0.14, pah_vel, _r(), "horn", scoop=-10), t + Q * 0.5, 0.22)
        if light_snare:
            b.add("snare", I.snare(0.32 if beat in (1, 3) else 0.18, _r()), t + Q * 0.5, -0.18, send=0.1)


def play_motif(b, t0, bars, inst="fife", vel=0.62, oct_shift=0, p=0.15, end_t=999.0):
    for bar, beat, dur, m in MOTIF:
        if bar not in bars:
            continue
        t = t0 + (bar - min(bars)) * 4 * Q + beat * Q
        if t >= end_t:
            continue
        freq = F(m + oct_shift)
        if inst == "fife":
            b.add("fife", I.fife(freq, dur * Q * 0.88, vel, _r()), t, p)
        elif inst == "glock":
            b.add("glock", I.glock(freq, vel, _r(), dur=min(1.4, dur * Q + 0.4)), t, p)
        elif inst == "vibes":
            b.add("vibes", I.vibes(freq, vel, _r(), dur=min(1.5, dur * Q + 0.5)), t, p)


def build():
    b = Band()

    # 1. HOOK (0.0 - 4.60 s): intriguing golden glock + warm low brass pulse, hard cut at white flash!
    play_motif(b, 0.1, [1, 2], "glock", 0.65, 12, -0.2, end_t=T.FLASH - 0.12)
    for k in range(4):
        tb = 0.1 + k * 1.0
        if tb < T.FLASH - 0.25:
            b.add("tuba", I.brass(F(41 if k % 2 == 0 else 36), 0.35, 0.55, _r(), "tuba"), tb, -0.1)
            b.add("pad", I.pad([F(53), F(57), F(60)], 0.9, 0.28, _r(), att=0.15, rel=0.25), tb, 0.0)
    # Trim hook cleanly at FLASH
    k_fl = ns(T.FLASH)
    for tr in b.tr.values():
        tr[:, k_fl:] = 0.0
    b.cues.append((0.1, "hook glockenspiel + warm brass pulse, hard stop on white flash (f138)"))

    # 2. CITY & FLEX (4.75 - 13.0 s): brisk fife + oom-pah march introducing Taipei 101
    t_city = 4.78
    b.add("cymbal", I.cymbal(0.32, _r(), dur=1.6), t_city, 0.0)
    for idx, bar in enumerate([1, 2, 3, 4]):
        oompah_bar(b, t_city + idx * 2.0, PROG[bar], 0.56, 0.35, True)
    play_motif(b, t_city, [1, 2, 3, 4], "fife", 0.62, 0, 0.18, end_t=12.9)
    play_motif(b, t_city, [1, 3], "glock", 0.35, 12, -0.25, end_t=12.9)
    b.cues.append((t_city, "bright Taipei plaza march (120 bpm F major): fife + glock + oom-pah brass"))

    # 3. SWAYING 90TH FLOOR OFFICE (13.05 - 23.0 s): playful tipsy pizzicato + vibraphone sway
    t_off = 13.1
    sway_chords = ["Gm", "C7", "F", "Dm", "Gm", "A7", "Dm", "C7", "Gm", "C7"]
    for k, cname in enumerate(sway_chords):
        tb = t_off + k * 1.0
        if tb >= 23.0:
            break
        c = CH[cname]
        b.add("pluck", I.pluck(F(c["oom"][k % 2] + 12), 0.72, _r(), dur=0.75), tb, -0.15)
        for m in c["hi"]:
            b.add("vibes", I.vibes(F(m), 0.32, _r(), dur=0.85, trem=6.4, trem_depth=0.35), tb + 0.48, 0.22)
        b.add("brush", I.brush(0.38, _r(), swish=True), tb + 0.25, 0.1)
    # Little descending glock slip on coffee mug slide (19.5s)
    for j, m in enumerate([88, 86, 84, 81, 79]):
        b.add("glock", I.glock(F(m), 0.48, _r(), dur=0.45), T.MUG_SLIDE + j * 0.09, -0.25)
    b.cues.append((t_off, "tipsy swaying office groove: plucked bass + wide-tremolo vibes + mug-slide glock run"))

    # 4. DAMPER REVEAL (23.2 - 30.35 s): noble brass + glock engineering march for the 660-ton sphere
    t_rev = 23.25
    for idx, bar in enumerate([5, 6, 7, 8]):
        tb = t_rev + idx * 1.75
        if tb < 30.1:
            oompah_bar(b, tb, PROG[bar], 0.54, 0.34, idx >= 1)
    play_motif(b, t_rev, [5, 6, 7], "glock", 0.55, 12, -0.2, end_t=30.2)
    b.add("timpani", I.timpani(F(41), 0.58, _r(), dur=1.6), fr_t := 26.8, -0.1)  # "six hundred and sixty tons"
    b.cues.append((t_rev, "stately engineering march + timpani accent on 'six hundred and sixty tons'"))

    # 5. GOLDEN HARBOUR ROWBOAT ANALOGY (30.5 - 36.7 s): warm music-box & pad 3/4 waltz
    t_boat = 30.55
    waltz = [
        (0.0, [58, 62, 65], [82, 86, 89]),
        (1.5, [58, 63, 67], [87, 86, 84]),
        (3.0, [57, 60, 65], [84, 81, 77]),
        (4.5, [58, 62, 65], [82, 86, 94]),
    ]
    for dt, pad_m, mb_m in waltz:
        tb = t_boat + dt
        b.add("pad", I.pad([F(m) for m in pad_m], 1.45, 0.34, _r(), att=0.25, rel=0.35), tb, 0.0)
        b.add("pluck", I.pluck(F(pad_m[0] - 12), 0.65, _r(), dur=0.8), tb, -0.1)
        for step, mm in enumerate(mb_m):
            b.add("musicbox", I.musicbox(F(mm), 0.58, _r(), dur=1.1), tb + step * 0.5, 0.2)
    b.add("triangle", I.triangle(0.38, _r(), dur=1.2), T.GUY_LEAN, 0.3)
    b.cues.append((t_boat, "golden-hour 3/4 music-box waltz for the rowboat balance analogy"))

    # 6. COUNTER-SWAY MECHANISM (36.85 - 43.0 s): crisp purposeful march
    t_mech = 36.9
    for idx, bar in enumerate([1, 2, 3]):
        oompah_bar(b, t_mech + idx * 2.0, PROG[bar], 0.56, 0.36, True)
    play_motif(b, t_mech, [1, 2, 3], "fife", 0.58, 0, 0.15, end_t=42.85)
    b.cues.append((t_mech, "crisp counter-phase march as golden sphere opposes the wind"))

    # 7. TYPHOON SOUDELOR CLIMAX (43.1 - 49.5 s): tension snare roll + brass stabs + timpani!
    for ts, sv in I.snare_roll(43.2, T.TYPHOON_SLAM - 0.04, 0.14, 0.65, _r()):
        b.add("snare", I.snare(sv, _r(), buzz=True), ts, -0.1, send=0.18)
    for t_hit, chord_m, timp_m, vel in [
        (T.TYPHOON_SLAM, [38, 50, 57, 62, 65], 38, 0.78),  # "slammed" (f1356)
        (47.1, [43, 55, 58, 62, 67], 43, 0.68),            # "hundred-mile-an-hour winds"
        (T.METER_SWING, [36, 48, 55, 60, 64], 36, 0.80),   # "full meter" (f1460)
    ]:
        for m in chord_m:
            b.add("stab", I.brass(F(m), 0.24, vel, _r(), "stab", scoop=-14), t_hit, (m - 54) / 24)
        b.add("timpani", I.timpani(F(timp_m), vel, _r(), dur=1.8), t_hit, -0.08)
    b.add("cymbal", I.cymbal(0.34, _r(), dur=1.8), T.TYPHOON_SLAM, 0.0)
    b.cues.append((43.2, "typhoon snare crescendo + brass/timpani stabs on 'slammed' (f1356) and 'full meter' (f1460)"))

    # 8. AFTERMATH / DEADPAN + DARK CLOSET (49.7 - 59.25 s): cheeky dry pizzicato + light vibes
    t_aft = 49.75
    walk = [53, 57, 60, 57, 58, 62, 65, 62, 55, 58, 60, 55, 53, 52, 50, 48, 45, 48, 52]
    for k, m in enumerate(walk):
        tb = t_aft + k * 0.5
        if tb >= 59.15:
            break
        b.add("pluck", I.pluck(F(m), 0.68, _r(), dur=0.55), tb, -0.08)
        if k % 2 == 1:
            b.add("brush", I.brush(0.32, _r()), tb, 0.15)
    b.add("triangle", I.triangle(0.32, _r(), dur=0.9), 49.75, 0.25)  # "Luckily"
    b.cues.append((t_aft, "deadpan walking pizzicato through 'Luckily / Unluckily' and the dark mechanical closet"))

    # 9. GOLDEN FINALE & CUTE MASCOT (59.35 - 65.5 s): sunny celebratory swung vibes + glock + full cadence!
    t_fin = 59.35
    b.add("cymbal", I.cymbal(0.26, _r(), dur=1.5), t_fin, 0.0)
    for idx, bar in enumerate([5, 7, 8]):
        oompah_bar(b, t_fin + idx * 1.8, PROG[bar], 0.52, 0.34, False)
    fin_notes = [
        (59.4, 0.45, 81), (59.85, 0.45, 84), (60.3, 0.6, 89), (60.95, 0.45, 86),
        (61.45, 0.45, 84), (61.95, 0.45, 82), (62.45, 0.5, 84), (63.0, 0.45, 86),
        (63.5, 0.45, 89), (64.0, 0.95, 93),
    ]
    for tn, dur, m in fin_notes:
        b.add("vibes", I.vibes(F(m - 12), 0.58, _r(), dur=dur + 0.45, trem_depth=0.25), tn, -0.2)
        b.add("glock", I.glock(F(m), 0.46, _r(), dur=dur + 0.4), tn, 0.22)
    for k in range(11):
        b.add("brush", I.brush(0.42, _r(), swish=True), t_fin + k * 0.5, 0.12)
    # Warm resolving F major chord ringing gently to 65.5s
    for m in [53, 57, 60, 65, 69]:
        b.add("vibes", I.vibes(F(m), 0.42, _r(), dur=1.25, trem_depth=0.22), 64.15, 0.1)
    b.add("triangle", I.triangle(0.35, _r(), dur=1.1), 64.15, 0.3)
    b.cues.append((t_fin, "golden sunset observatory celebration + sparkly glock/vibes cadence on 'cute cartoon mascot'"))

    # Clean master fade at very end (65.25 -> 65.50 s)
    end = np.ones(N)
    a = ns(T.DUR - 0.25)
    end[a:] = np.linspace(1, 0, N - a) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {
    "fife": -2.5, "glock": -5.0, "tuba": -2.5, "pah": -7.0, "snare": -5.5, "cymbal": -11.0,
    "stab": -2.5, "timpani": -4.5, "pad": -4.0, "vibes": -2.0, "musicbox": -1.5,
    "pluck": -3.5, "brush": -12.5, "triangle": -14.0,
}


def render(b, ref=-20.0):
    hall = make_ir(1.35, 7, pre=0.016, hf=1.4)
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))
    levels = {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        g = dbg(ref + TARGET.get(k, -6.0) - L)
        levels[k] = (round(L, 1), round(ref + TARGET.get(k, -6.0), 1))
        x = x * g
        b.tr[k] = x
        dry += x
        wet += b.send[k] * x
    out = dry + 0.68 * convolve_st(wet.mean(0), hall)
    out = hp(out, 30, 2)
    return out, levels
