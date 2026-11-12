# Original score for "The Emu War" (72.0 s). Composed here, no borrowed melody.
# D dorian, 112 bpm, one bar = 2.143 s = 4 beats; the pulse is the film's pulse, the drones are the heat.
# The arrangement follows the picture: sparse hook -> the ask (ostinato under the shed) -> the dam and the guns
# (doubled tick, timpani) -> the chase (half-time drive) -> the tally (thin, counting motif) -> the explanation
# (drone and a pulse only, so the words sit alone) -> the hose (light, wry) -> the line (swell, one hit) ->
# withdrawal at dusk (half time, sparse) -> the closer: D major, warm, tail out to 72.0 s.
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "templates", "audio"))
from dsp import SR, ns, rng, place, pan, fades, make_ir, convolve_st, lp, hp, write_wav, integrated, true_peak  # noqa: E402
import instruments as I  # noqa: E402

DUR = 72.0
N = ns(DUR)
Q = 60.0 / 112.0          # beat
BAR = 4 * Q               # bar
T0 = 11.1                 # the ask: the ostinato enters here

# sections (s) -- read off story.ts
HOOK = (0.0, 11.1)
ASK = (11.1, 20.0)
DAM = (20.0, 26.3)
CHASE = (26.3, 33.4)
TALLY = (33.4, 39.0)
TELL = (39.0, 45.4)
HOSE = (45.4, 53.4)
LINE = (53.4, 58.6)
DUSK = (58.6, 66.1)
CLOSE = (66.1, 72.0)


def bar_time(bar):
    """time of bar 0 = the top of the ostinato (11.1 s), so the grid is anchored to a cut."""
    return T0 + (bar - 7) * BAR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def new():
    return np.zeros((2, N), dtype=np.float64)


class Bus:
    def __init__(self):
        self.dry = new()
        self.send = new()          # reverb feed

    def add(self, x, t, gain=1.0, p=0.0, wet=0.35):
        x = np.asarray(x, float)
        if x.ndim == 1:
            y = pan(x, p)
        else:                                   # already stereo: balance rather than pan
            th = (float(np.clip(p, -1, 1)) + 1) * np.pi / 4
            y = x * (np.array([np.cos(th), np.sin(th)]) * np.sqrt(2))[:, None]
        place(self.dry, y, t, gain)
        place(self.send, y, t, gain * wet)


def ostinato(bus, b0, b1, vel=0.62, octave=0, pattern=None):
    """one bar of D dorian in the low register: D F A C, plucked, with a rest on the last eighth."""
    pat = pattern or [(0.0, 38), (0.5, 38), (1.0, 41), (1.5, 45), (2.0, 41), (2.5, 38), (3.0, 36), (3.5, 36)]
    for bar in range(b0, b1):
        for beat, m in pat:
            t = bar_time(bar) + beat * Q + 0.012
            if t < 0 or t > DUR - 0.2:
                continue
            g = vel * (0.72 if beat % 1 else 1.0) * (0.9 + 0.2 * rng(int(t * 100)).random())
            bus.add(I.pluck(midi(m + 12 * octave), g, r=rng(int(t * 977)), dur=0.55, bright=0.32), t, 1.0, -0.08, 0.22)


def pulse(bus, t0, t1, step=Q, vel=0.3, kind="brush"):
    t = t0
    while t < t1:
        if kind == "brush":
            bus.add(I.brush(vel, r=rng(int(t * 31)), dur=0.26), t, 1.0, 0.22, 0.30)
        else:
            bus.add(I.snare(vel, r=rng(int(t * 41)), dur=0.2), t, 1.0, 0.18, 0.28)
        t += step


def drone(bus, t0, t1, notes=(50, 57, 62), vel=0.34, att=1.4, rel=1.2):
    dur = t1 - t0
    pad = I.pad([midi(m) for m in notes], dur, vel=vel, r=rng(int(t0 * 13)), att=att, rel=rel, warm=760.0)
    bus.add(pad, t0, 1.0, 0.0, 0.55)


def motif(bus, bar, notes, inst="box", vel=0.34, p=0.16):
    for beat, m, ln in notes:
        t = bar_time(bar) + beat * Q
        if t < 0 or t > DUR - 0.3:
            continue
        if inst == "box":
            bus.add(I.musicbox(midi(m), vel, r=rng(int(t * 71)), dur=1.1), t, 1.0, p, 0.5)
        elif inst == "glock":
            bus.add(I.glock(midi(m), vel, r=rng(int(t * 73)), dur=1.4), t, 1.0, p, 0.5)
        else:
            bus.add(I.vibes(midi(m), vel, r=rng(int(t * 79)), dur=0.9), t, 1.0, p, 0.45)


def tick_wall(bus, t0, t1, vel=0.16, rate=Q / 2):
    """the dry woodblock click that keeps the farce moving"""
    t = t0
    while t < t1:
        bus.add(I.triangle(vel, r=rng(int(t * 53)), dur=0.10, f=1750.0), t, 1.0, 0.30, 0.18)
        t += rate


def build():
    bus = Bus()

    # ---------------- 1  hook (0 - 11.1): heat, a drone, a click, two notes of the theme
    drone(bus, 0.0, 12.4, notes=(50, 57), vel=0.30, att=2.2, rel=2.4)
    tick_wall(bus, 0.6, 11.1, vel=0.12)
    pulse(bus, 2.2, 11.1, step=2 * Q, vel=0.20, kind="brush")
    motif(bus, 1, [(0, 74, 1), (1.5, 77, 1), (2.5, 81, 2)], vel=0.22, p=0.20)
    motif(bus, 3, [(0, 79, 2), (2, 74, 2)], vel=0.18, p=0.14)

    # ---------------- 2  the ask (11.1 - 20): the ostinato and a tuba oompah
    drone(bus, 11.1, 21.0, notes=(50, 57, 62), vel=0.26)
    ostinato(bus, 7, 12, vel=0.60)
    for bar in range(7, 12):
        for beat in (0, 2):
            t = bar_time(bar) + beat * Q
            if 11.0 < t < 20.0:
                bus.add(I.brass(midi(38), Q * 0.8, vel=0.30, r=rng(int(t * 17)), kind="tuba"), t, 0.9, -0.05, 0.3)
    pulse(bus, 11.4, 20.0, step=Q, vel=0.22, kind="brush")
    tick_wall(bus, 11.4, 20.0, vel=0.10)

    # ---------------- 3  the dam and the guns (20 - 26.3): doubled tick, timpani, a stab
    drone(bus, 19.2, 27.0, notes=(50, 57, 63), vel=0.30)
    ostinato(bus, 12, 15, vel=0.66)
    pulse(bus, 20.0, 26.3, step=Q / 2, vel=0.20, kind="snare")
    tick_wall(bus, 20.0, 26.3, vel=0.13, rate=Q / 2)
    for t in (20.4, 21.6, 23.0):
        bus.add(I.timpani(midi(38), 0.7, r=rng(int(t * 19)), dur=1.6), t, 0.85, -0.12, 0.45)
    # the burst on the picture's shot
    bus.add(I.snare(0.55, r=rng(5), dur=0.5, buzz=True), 22.35, 1.0, 0.05, 0.5)
    bus.add(I.brass(midi(45), 0.5, vel=0.34, r=rng(6), kind="stab"), 22.35, 0.8, 0.0, 0.4)

    # ---------------- 4  the chase (26.3 - 33.4): half time under a running ostinato
    drone(bus, 26.3, 34.2, notes=(50, 53, 57), vel=0.30)
    ostinato(bus, 15, 18, vel=0.70, pattern=[(0.0, 38), (0.25, 38), (0.5, 41), (0.75, 38),
                                            (1.0, 45), (1.25, 41), (1.5, 38), (1.75, 36),
                                            (2.0, 38), (2.25, 38), (2.5, 41), (2.75, 45),
                                            (3.0, 43), (3.25, 41), (3.5, 38), (3.75, 36)])
    pulse(bus, 26.4, 33.4, step=2 * Q, vel=0.30, kind="snare")
    tick_wall(bus, 26.4, 33.4, vel=0.12)
    for t in (26.35, 29.4, 32.4):
        bus.add(I.cymbal(0.20, r=rng(int(t * 11)), dur=2.0), t, 0.7, 0.42, 0.55)

    # ---------------- 5  the tally (33.4 - 39): thin out, count
    drone(bus, 33.4, 40.0, notes=(50, 57), vel=0.24)
    ostinato(bus, 18, 20, vel=0.46)
    motif(bus, 18, [(0, 74, 1), (1, 74, 1), (2, 77, 1), (3, 74, 1)], vel=0.30, p=0.10)

    # ---------------- 6  the explanation (39 - 45.4): drone and a pulse, nothing else
    drone(bus, 39.0, 46.2, notes=(50, 57, 62, 66), vel=0.26, att=1.0)
    pulse(bus, 39.6, 45.4, step=2 * Q, vel=0.14, kind="brush")

    # ---------------- 7  fifty kilos and the hose (45.4 - 53.4): light and wry
    ostinato(bus, 23, 27, vel=0.52)
    drone(bus, 45.4, 53.6, notes=(50, 57, 65), vel=0.22)
    pulse(bus, 45.6, 53.4, step=Q, vel=0.17, kind="brush")
    tick_wall(bus, 45.6, 53.4, vel=0.09)
    motif(bus, 24, [(0, 77, 1), (1, 79, 1), (2, 81, 1), (3, 79, 1), (3.5, 77, 0.5)], inst="vb", vel=0.30, p=-0.12)
    motif(bus, 26, [(0, 74, 2), (2, 77, 1), (3, 72, 1)], inst="vb", vel=0.26, p=0.18)

    # ---------------- 8  the line (53.4 - 58.6): swell, then one hit
    pad = I.pad([midi(m) for m in (38, 45, 50, 57)], 4.6, vel=0.42, r=rng(91), att=1.8, rel=0.9, warm=620.0)
    bus.add(pad, 53.4, 1.0, 0.0, 0.6)
    for k, t in enumerate((54.0, 54.9, 55.8, 56.7)):
        bus.add(I.timpani(midi(38 + (0 if k < 2 else 3)), 0.85, r=rng(int(t * 23)), dur=1.5), t, 0.55 + 0.12 * k, -0.1, 0.5)
    bus.add(I.brass(midi(38), 1.6, vel=0.46, r=rng(93), kind="tuba", fall=-0.6), 57.55, 1.0, -0.02, 0.45)
    bus.add(I.cymbal(0.26, r=rng(94), dur=3.0), 57.55, 0.8, 0.35, 0.6)

    # ---------------- 9  the withdrawal at dusk (58.6 - 66.1): half time, tired
    drone(bus, 58.6, 66.4, notes=(50, 57, 60), vel=0.26, att=0.9)
    for bar in range(29, 32):
        bus.add(I.pluck(midi(38), 0.5, r=rng(bar * 13), dur=1.2, bright=0.26), bar_time(bar), 1.0, -0.05, 0.35)
        bus.add(I.pluck(midi(45), 0.34, r=rng(bar * 17), dur=1.0, bright=0.22), bar_time(bar) + 2 * Q, 1.0, 0.1, 0.35)
    pulse(bus, 59.0, 65.4, step=2 * Q, vel=0.13, kind="brush")
    bus.add(I.vibes(midi(72), 0.22, r=rng(95), dur=1.6), 62.0, 1.0, 0.2, 0.55)

    # ---------------- 10  the closer (66.1 - 72): D major, warm, tail
    close = I.pad([midi(m) for m in (38, 50, 57, 62, 66, 69)], 6.0, vel=0.40, r=rng(97), att=0.35, rel=2.2, warm=900.0)
    bus.add(close, 66.1, 1.0, 0.0, 0.6)
    bus.add(I.pluck(midi(38), 0.55, r=rng(98), dur=2.4, bright=0.3), 66.1, 1.0, -0.05, 0.4)
    for k, (t, m) in enumerate([(66.4, 74), (67.2, 78), (68.0, 81), (69.2, 86)]):
        bus.add(I.glock(midi(m), 0.26 - 0.03 * k, r=rng(110 + k), dur=1.8), t, 1.0, 0.14, 0.6)
    motif(bus, 34, [(1, 74, 1), (2, 78, 1)], inst="vb", vel=0.24, p=-0.1)

    # ---------------- tail / bus
    ir = make_ir(1.5, seed=4242, pre=0.014, hf=0.9, early=[(0.011, 0.30, -0.4), (0.019, 0.24, 0.45), (0.031, 0.16, 0.0)])
    wet = convolve_st(bus.send, ir)
    mix = bus.dry + 0.85 * wet
    mix = hp(mix, 42.0)
    mix = lp(mix, 15500.0)
    mix[:, : ns(0.02)] *= np.linspace(0, 1, ns(0.02))[None, :]
    end = ns(DUR - 1.6)
    mix[:, end:] *= np.linspace(1, 0, mix.shape[1] - end)[None, :] ** 1.5
    peak = np.max(np.abs(mix))
    mix = mix / peak * 10 ** (-6.0 / 20)          # -6 dBFS peak; the mix sets the real level
    return mix


if __name__ == "__main__":
    m = build()
    out = os.path.join(HERE, "music.wav")
    write_wav(out, m, bits=24)
    print(out, f"{m.shape[1] / SR:.3f}s", f"I={integrated(m):.1f} LUFS", f"TP={true_peak(m):.2f} dBTP")
