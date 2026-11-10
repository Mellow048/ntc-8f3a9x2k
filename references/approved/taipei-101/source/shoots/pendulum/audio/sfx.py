# Synthesized sound effects + ambience stem for "The Giant Golden Ball Inside Taipei 101".
# Standard mix rule (IMPORTANT.md): every discrete SFX event is placed at SFX_DB = -6.0 dB
# below its naive level relative to the voice stem.

import numpy as np
from dsp import (
    SR, ns, tt, rng, dbg, lp, hp, bp, pan, st, place, fades,
    make_ir, convolve_st, momentary_max, integrated, colored, smooth_noise, modal,
)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.14):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.send = kind, p, extra, lpf, send
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


def _sum2(a, b):
    a, b = st(a), st(b)
    m = max(a.shape[1], b.shape[1])
    y = np.zeros((2, m))
    y[:, :a.shape[1]] += a
    y[:, :b.shape[1]] += b
    return y


def _flash_whoosh(r):
    w = G.whoosh(0.42, r, 0.16, 260, 2800, 0.9, 0.22, 0.25)
    th = modal(0.45, [(68, 1.0, 0.14), (138, 0.5, 0.08)], r) * 0.9
    return _sum2(w, th), 0.16


def _mug_slide(r):
    dur = 0.55
    t = tt(dur)
    # Ceramic scrape across wood desk + crisp rim clink at desk edge
    scrape = bp(r.standard_normal(len(t)), 900, 4200, 2) * np.interp(t, [0, 0.08, 0.42, 0.55], [0, 0.65, 0.85, 0])
    cl = G.clink(r, 2750, 0.18, 1.2)
    y = scrape.copy()
    k = ns(0.40)
    y[k:k + len(cl)] += cl[:len(y) - k] * 1.4
    return fades(y, 0.01, 0.04), 0.0


def _hydraulic_hiss_thump(r, heavy=1.0):
    dur = 0.72
    t = tt(dur)
    thump = modal(dur, [(62, 1.0, 0.11), (128, 0.65, 0.07), (260, 0.35, 0.04)], r) * heavy
    hiss = bp(r.standard_normal(len(t)), 1400, 6500, 2) * np.exp(-np.maximum(0, t - 0.04) / 0.24) * 0.45
    hiss[:ns(0.03)] *= np.linspace(0, 1, ns(0.03))
    return fades(thump + hiss, 0.004, 0.06), 0.02


def _typhoon_slam(r):
    dur = 1.6
    t = tt(dur)
    howl = bp(colored(len(t), r, 0.6), 220, 1800, 2) * np.interp(t, [0, 0.15, 0.9, 1.6], [0.2, 1.0, 0.75, 0.15])
    slam = modal(dur, [(48, 1.2, 0.22), (96, 0.8, 0.14), (210, 0.45, 0.08)], r)
    return fades(st(howl * 0.55 + slam), 0.01, 0.15), 0.04


def cues():
    C = []
    R = rng(8892)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append

    # ---- Soft continuous room/outdoor ambience beds ----
    add(Cue(0.0, "amb_city_air", "gentle high-altitude breeze & distant city air (shots 1-6)",
            lambda: (fades(G.breeze(30.4, rng(11), 0.7, 0.14, 780), 0.25, 0.4), 0.0), -31, "bed", send=0.0))
    add(Cue(30.4, "amb_harbour", "golden-hour harbour water lapping + warm breeze + gulls/sparrows (shot 7)",
            lambda: (fades(_sum2(G.water_bed(6.4, rng(12), 0.75, 0.7), pan(G.bird_chirps(6.4, rng(13), 0.35), 0.4) * 0.12), 0.3, 0.35), 0.0),
            -25, "bed", send=0.0))
    add(Cue(43.0, "amb_typhoon_wind", "100-mph Typhoon Soudelor rushing wind bed (shots 9-10)",
            lambda: (fades(st(G.breeze(6.6, rng(14), 1.6, 0.35, 1350)), 0.2, 0.35), 0.0), -23, "bed", send=0.0))
    add(Cue(59.3, "amb_gallery", "warm observatory gallery murmur & golden air (shot 14)",
            lambda: (fades(_sum2(G.breeze(6.2, rng(15), 0.5, 0.1, 700), pan(G.babble(6.2, rng(16), 155, 1.0, 3.6, 0.5), -0.25) * 0.18), 0.3, 0.3), 0.0),
            -28, "bed", send=0.0))

    # ---- Shot 1: Hook steel cable hum + white flash whoosh ----
    add(Cue(0.35, "cable_hum_hook", "deep steel cable tension groan as 660-ton sphere sways",
            lambda: (G.chain_groan(3.6, rng(21), 0.35, 0.65, 20, 28), 0.0), -13, p=-0.15, send=0.2))
    add(Cue(T.FLASH, "flash_whoosh", "white flash transition into Taipei skyline (f138)",
            lambda: _flash_whoosh(rng(22)), -5, send=0.2))

    # ---- Shot 2 & 3: Camera tilt whoosh + wind gust + tower flex creak ----
    add(Cue(T.fr(200), "cam_tilt_tower", "camera tilt whoosh up Taipei 101 spire",
            lambda: (G.whoosh(0.5, rng(23), 0.12, 320, 2100, 0.8), 0.12), -13, send=0.12))
    add(Cue(T.fr(318), "wind_flex", "high wind gust + structural flex creak ('built to bend in the wind')",
            lambda: (_sum2(G.whoosh(0.85, rng(24), 0.22, 280, 1650, 0.9), G.creak(0.65, rng(25), 75, 135, G.TIMBER) * 0.6), 0.15),
            -9, send=0.18))

    # ---- Shots 4 & 5: 90th-floor swaying lamps, sliding coffee mug & seasick groan ----
    add(Cue(T.fr(460), "office_sway_creak", "90th-floor curtain-wall creak as strong breeze sways room",
            lambda: (G.creak(0.75, rng(26), 85, 145, G.WOOD), 0.0), -11, p=0.2, send=0.15))
    add(Cue(T.fr(550), "lamp_swing", "ceiling lamps swinging on chains ('Lamps swing')",
            lambda: (G.swing_squeak(rng(27), 0.85, True), 0.0), -11, p=-0.25))
    add(Cue(T.MUG_SLIDE, "mug_slide", "ceramic coffee mug sliding across desk + edge clink ('coffee slides off desks')",
            lambda: _mug_slide(rng(28)), -8, p=-0.3, send=0.1))
    add(Cue(T.SEASICK, "seasick_ugh", "soft comedic seasick groan ('office workers get seasick')",
            lambda: (G.oof(rng(29), "ugh", base=118), 0.0), -10, p=0.3, send=0.12))

    # ---- Shot 6: 8 thick steel cables & 660-ton sphere reveal ----
    add(Cue(T.fr(765), "cam_shaft_glide", "camera vertical glide down the 5-story damper shaft",
            lambda: (G.whoosh(0.65, rng(30), 0.2, 260, 1900, 0.85), 0.2), -12, send=0.16))
    add(Cue(T.fr(865), "steel_cables_clink", "heavy steel cable & shackle metallic resonance ('eight thick cables')",
            lambda: (G.rattle(0.75, rng(31), 16.0, heavy=True), 0.0), -10, p=0.15, send=0.2))

    # ---- Shot 7: Golden-hour rowboat wave splash & counter-lean ----
    add(Cue(T.WAVE_TIP, "boat_wave_splash", "wave slapping wooden rowboat hull & tipping deck left",
            lambda: (lp(G.splash_big(rng(32)), 7500, 1), 0.04), -8, p=-0.35, send=0.18))
    add(Cue(T.GUY_LEAN, "boat_lean_thump", "wooden plank shift as hero leans hard right to balance",
            lambda: (_sum2(G.push_thump(rng(33)), G.creak(0.22, rng(34), 120, 175, G.WOOD) * 0.4), 0.02), -10, p=0.25))

    # ---- Shot 8: Counter-sway into giant hydraulic bumpers ----
    add(Cue(T.fr(1176), "sphere_counter_whoosh", "660-ton sphere swinging opposite the gust",
            lambda: (G.whoosh(0.6, rng(35), 0.22, 180, 1200, 0.7), 0.15), -10, p=-0.2, send=0.16))
    add(Cue(T.BUMPER_HIT, "hydraulic_bumper", "hydraulic viscous bumper compression thump + pneumatic hiss (f1226)",
            lambda: _hydraulic_hiss_thump(rng(36), 1.0), -7, p=-0.25, send=0.16))

    # ---- Shots 9 & 10: 2015 Typhoon Soudelor slam + record 1-meter swing ----
    add(Cue(T.TYPHOON_SLAM, "typhoon_slam", "100-mph Typhoon Soudelor wind impact on tower (f1356)",
            lambda: _typhoon_slam(rng(37)), -5, send=0.22))
    add(Cue(T.fr(1432), "cable_strain_1m", "heavy steel cables straining under record 1-meter swing",
            lambda: (G.chain_groan(1.5, rng(38), 0.7, 1.0, 26, 38), 0.0), -9, p=0.2, send=0.18))
    add(Cue(T.METER_SWING, "hydraulic_max_1m", "deep hydraulic piston absorption at 1-meter peak extension (f1460)",
            lambda: _hydraulic_hiss_thump(rng(39), 1.35), -6, p=0.25, send=0.2))

    # ---- Shot 12: Scared tourist gulp/whoa ----
    add(Cue(T.SCARED, "tourist_whoa", "nervous visitor reaction looking over the 89th-floor rail ('scared of heights')",
            lambda: (G.whoa(rng(40), base=138, dur=0.38), 0.0), -11, p=0.25, send=0.14))

    # ---- Shot 14: Happy tourist applause/cheer & cute mascot sparkle ----
    add(Cue(T.MASCOT, "mascot_reveal", "camera glide onto the waving golden mascot",
            lambda: (G.whoosh(0.45, rng(41), 0.12, 420, 2400, 0.75), 0.12), -13, p=0.2))
    add(Cue(T.fr(1904), "mascot_sparkle", "bright cheerful bell twinkle as mascot waves ('cute cartoon mascot')",
            lambda: (modal(0.65, [(1568, 0.9, 0.22), (2093, 0.75, 0.20), (2637, 0.65, 0.18)], rng(42)), 0.0),
            -11, p=0.3, send=0.2))

    return C


def render(v_ref):
    C = cues()
    out = np.zeros((2, N))
    send = np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), t0)
    hall = make_ir(1.05, 77, pre=0.01, hf=1.6, early=[(0.09, 0.45, -0.5), (0.15, 0.3, 0.6)])
    out += 0.52 * convolve_st(send, hall)
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.15)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C
