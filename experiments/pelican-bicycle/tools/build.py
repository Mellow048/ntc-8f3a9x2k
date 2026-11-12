#!/usr/bin/env python3
"""
Pelican on a Bicycle - a single-scene SVG illustration.

The deliverable is pure HTML + inline SVG + SMIL animation: no JavaScript,
no external images, fonts or libraries.

This script is only the drawing bench: it holds the geometry (including the
two-bone leg solve for the pedalling cycle) and can render static frames with
resvg so the art can be inspected at specific animation phases.

  python tools/build.py                     # writes ../pelican.svg + ../index.html
  python tools/build.py --frame 0.55 --png preview/frame.png
"""
import argparse
import math
import os
import random

# ---------------------------------------------------------------- canvas ----
W, H = 1200, 900

INK = "#241726"
INK_SOFT = "#3a2530"

# palette
SKY_TOP = "#3d87c4"
SKY_MID = "#8dc7e2"
SKY_LOW = "#d9edf2"
SUN = "#fff3cd"
SEA_TOP = "#1d6b81"
SEA_LOW = "#4ea3ae"
SEA_LIGHT = "#9ed8da"
CREAM = "#f8efd9"
SAND_FAR = "#e8d2a8"
SAND_NEAR = "#eedcb9"
SAND_SHADE = "#d9bd8e"
SAND_LINE = "#cbab7a"

TEAL = "#1f5f60"
TEAL_LIGHT = "#2f8583"
TEAL_DARK = "#123f40"
TYRE = "#2b2523"
TYRE_HI = "#4d443e"
RIM = "#f6ecd2"
SPOKE = "#8d7a64"
BRASS = "#c99a4e"
LEATHER = "#8a4b2f"
LEATHER_LIGHT = "#a9623f"
STEEL = "#5a4c42"
STEEL_LIGHT = "#8a7a6a"

FEATHER = "#fffaf0"
FEATHER_SHADE = "#e7e1d5"
FEATHER_COOL = "#cfd5dc"
BLACK_FEATHER = "#2c2530"
BEAK = "#f3a63e"
BEAK_LIGHT = "#ffc46a"
BEAK_DEEP = "#d9771f"
POUCH = "#ef8f3a"
POUCH_SHADE = "#d0701d"
LEG_NEAR = "#e08a3c"
LEG_FAR = "#b76a2c"
SCARF = "#c9484a"
SCARF_DARK = "#a53436"
SCARF_LIGHT = "#f7ead2"

# bike geometry
R = 98.0
REAR = (330.0, 716.0)
FRONT = (776.0, 716.0)
GROUND = REAR[1] + R
BB = (520.0, 722.0)
CRANK_R = 46.0
SEAT = (430.0, 596.0)
HEAD_TOP = (718.0, 542.0)
HEAD_BOT = (736.0, 600.0)
GRIP = (650.0, 522.0)
HIP = (462.0, 522.0)
KNEE_L = 88.0
SHIN_L = 150.0
ANKLE_LIFT = 16.0

WHEEL_DUR = 2.0
CRANK_DUR = 2.4
GROUND_DUR = 4.0
RAIL_DUR = 34.0
CLOUD_DUR = 110.0
STEPS = 24  # leg keyframes around one crank revolution
PHASE0 = 35.0  # crank angle of the near pedal at t=0


# ---------------------------------------------------------------- helpers ---
def n(v):
    s = f"{v:.2f}"
    s = s.rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def f2(v):
    return f"{v:.2f}"


def lerp(a, b, t):
    return a + (b - a) * t


def dist(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


def norm(v):
    d = math.hypot(*v)
    return (v[0] / d, v[1] / d) if d else (0.0, 0.0)


def perp(v, side=1):
    return (-v[1] * side, v[0] * side)


def path_pts(pts, close=False):
    d = f"M {n(pts[0][0])},{n(pts[0][1])}"
    for p in pts[1:]:
        d += f" L {n(p[0])},{n(p[1])}"
    return d + (" Z" if close else "")


def sampled_ellipse(cx, cy, rx, ry, a0, a1, steps=12):
    return [
        (cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / steps)),
         cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / steps)))
        for i in range(steps + 1)
    ]


def rot_anim(cx, cy, dur, t, begin=0.0):
    """A full clockwise turn about (cx, cy); static frame when t is a number."""
    if t is None:
        return (
            f'<animateTransform attributeName="transform" type="rotate" '
            f'from="0 {n(cx)} {n(cy)}" to="360 {n(cx)} {n(cy)}" '
            f'dur="{dur}s" begin="{begin}s" repeatCount="indefinite"/>'
        )
    return f' transform="rotate({f2((t / dur * 360 + begin / dur * 360) % 360)} {n(cx)} {n(cy)})"'


def translate_anim(values, dur, t, begin=0.0, keytimes=None):
    """values: list of (x, y). Static transform when t is a number."""
    if t is None:
        kt = ""
        if keytimes:
            kt = f' keyTimes="{";".join(keytimes)}"'
        else:
            kt = f' keyTimes="{";".join(f2(i / (len(values) - 1)) for i in range(len(values)))}"'
        vals = ";".join(f"{n(x)},{n(y)}" for x, y in values)
        return (
            f'<animateTransform attributeName="transform" type="translate" '
            f'values="{vals}"{kt} dur="{dur}s" begin="{begin}s" '
            f'repeatCount="indefinite" calcMode="linear"/>'
        )
    i = int((t / dur) % 1.0 * len(values))
    x, y = values[i % len(values)]
    return f' transform="translate({n(x)},{n(y)})"'


def spin_values(dur, t, steps=32):
    """Static frame values for an animated spin group."""
    if t is None:
        return None
    return (t / dur * 360) % 360


# ------------------------------------------------------------------- legs ---
def leg_pose(theta_deg):
    """Two-bone solve from the hip to the ankle above the pedal.

    theta 0 = pedal at 3 o'clock. Returns pedal, knee, ankle.

    The joint folds backwards (base + a), so the knee stays tucked under the
    belly the way a bird's hock does instead of swinging forward into the sky.
    """
    th = math.radians(theta_deg)
    pedal = (BB[0] + CRANK_R * math.cos(th), BB[1] + CRANK_R * math.sin(th))
    ankle = (pedal[0], pedal[1] - ANKLE_LIFT)
    d = dist(HIP, ankle)
    d = min(d, KNEE_L + SHIN_L - 0.5)
    d = max(d, abs(KNEE_L - SHIN_L) + 0.5)
    base = math.atan2(ankle[1] - HIP[1], ankle[0] - HIP[0])
    cos_a = (KNEE_L * KNEE_L + d * d - SHIN_L * SHIN_L) / (2 * KNEE_L * d)
    cos_a = max(-1.0, min(1.0, cos_a))
    a = math.acos(cos_a)
    knee = (HIP[0] + KNEE_L * math.cos(base + a),
            HIP[1] + KNEE_L * math.sin(base + a))
    return pedal, knee, ankle


def thigh_d(knee, hip=HIP, w0=19.0, w1=11.0):
    """Feathered drumstick, wide at the hip, tapering into the hock."""
    v = norm((knee[0] - hip[0], knee[1] - hip[1]))
    p = perp(v, 1)
    a1 = (hip[0] + p[0] * w0, hip[1] + p[1] * w0)
    b1 = (hip[0] - p[0] * w0, hip[1] - p[1] * w0)
    a2 = (knee[0] + p[0] * w1, knee[1] + p[1] * w1)
    b2 = (knee[0] - p[0] * w1, knee[1] - p[1] * w1)
    c1 = ((a1[0] + a2[0]) / 2 + p[0] * 8, (a1[1] + a2[1]) / 2 + p[1] * 8)
    c2 = ((b1[0] + b2[0]) / 2 - p[0] * 6, (b1[1] + b2[1]) / 2 - p[1] * 6)
    return (f"M {n(a1[0])},{n(a1[1])} Q {n(c1[0])},{n(c1[1])} {n(a2[0])},{n(a2[1])} "
            f"L {n(b2[0])},{n(b2[1])} Q {n(c2[0])},{n(c2[1])} {n(b1[0])},{n(b1[1])} Z")


def tarsus_d(knee, ankle, w0=7.6, w1=5.4):
    """Bare orange shank: a tapered bone, not a uniform tube."""
    v = norm((ankle[0] - knee[0], ankle[1] - knee[1]))
    p = perp(v, 1)
    a1 = (knee[0] + p[0] * w0, knee[1] + p[1] * w0)
    b1 = (knee[0] - p[0] * w0, knee[1] - p[1] * w0)
    a2 = (ankle[0] + p[0] * w1, ankle[1] + p[1] * w1)
    b2 = (ankle[0] - p[0] * w1, ankle[1] - p[1] * w1)
    ma = ((a1[0] + a2[0]) / 2 + p[0] * 2.4, (a1[1] + a2[1]) / 2 + p[1] * 2.4)
    mb = ((b1[0] + b2[0]) / 2 + p[0] * 2.4, (b1[1] + b2[1]) / 2 + p[1] * 2.4)
    return (f"M {n(a1[0])},{n(a1[1])} Q {n(ma[0])},{n(ma[1])} {n(a2[0])},{n(a2[1])} "
            f"L {n(b2[0])},{n(b2[1])} Q {n(mb[0])},{n(mb[1])} {n(b1[0])},{n(b1[1])} Z")


def foot_d(ankle):
    """Webbed foot: three splayed toes with deep notches, gripping the pedal."""
    ax, ay = ankle
    px, py = 1.0, 4.0                      # toe pivot, local to the ankle
    toes = ((22.0, 35.0, 5.4), (4.0, 39.0, 5.6), (-12.0, 33.0, 5.2))
    notch = (21.0, 22.0)

    def P(x, y):
        return f"{n(ax + x)},{n(ay + y)}"

    def pt(ang, r):
        a = math.radians(ang)
        return (px + r * math.cos(a), py + r * math.sin(a))

    d = [f"M {P(-17, 0)}",
         f"C {P(-21, 4)} {P(-20, 9)} {P(-14, 11)}",
         f"L {P(-2, 12.5)}", f"L {P(3, 12.5)}"]
    for i, (ang, ln, w) in enumerate(toes):
        a = math.radians(ang)
        cx, cy = pt(ang, ln)
        p = (-math.sin(a), math.cos(a))
        c1 = (cx + p[0] * w, cy + p[1] * w)          # lower / outer corner
        c2 = (cx - p[0] * w, cy - p[1] * w)          # upper / inner corner
        tip = (cx + math.cos(a) * w * 1.25, cy + math.sin(a) * w * 1.25)
        d.append(f"L {P(c1[0], c1[1])}")
        d.append(f"Q {P(tip[0], tip[1])} {P(c2[0], c2[1])}")
        if i < len(toes) - 1:
            na = math.radians(ang + 9.0)
            nx, ny = px + notch[i] * math.cos(na), py + notch[i] * math.sin(na)
            d.append(f"L {P(nx, ny)}")
    d.append(f"C {P(10, -7)} {P(-6, -4)} {P(-17, 0)} Z")
    return " ".join(d)


def detail_d(knee, ankle):
    """Two scale ticks on the shank plus the toe separations, one path."""
    v = norm((ankle[0] - knee[0], ankle[1] - knee[1]))
    p = perp(v, 1)
    segs = []
    for f, k in ((0.36, 0.72), (0.58, 0.66)):
        cx = knee[0] + (ankle[0] - knee[0]) * f
        cy = knee[1] + (ankle[1] - knee[1]) * f
        half = (7.6 + (5.4 - 7.6) * f) * k
        segs.append(f"M {n(cx + p[0] * half)},{n(cy + p[1] * half)} "
                    f"L {n(cx - p[0] * half)},{n(cy - p[1] * half)}")
    ax, ay = ankle
    segs.append(f"M {n(ax + 2)},{n(ay + 9)} L {n(ax + 30)},{n(ay + 2)}")
    segs.append(f"M {n(ax + 1)},{n(ay + 10)} L {n(ax + 26)},{n(ay + 12)}")
    return " ".join(segs)


def leg_group(side, t):
    """side: 'near' (phase 0) or 'far' (phase 180)."""
    offset = PHASE0 if side == "near" else PHASE0 + 180.0
    color = LEG_NEAR if side == "near" else LEG_FAR
    color_hi = "#f2a862" if side == "near" else "#cd8342"
    feather = FEATHER if side == "near" else "#f3ece0"
    feather_shade = FEATHER_SHADE if side == "near" else "#ded7c9"

    frames = [leg_pose(offset + 360.0 * i / STEPS) for i in range(STEPS + 1)]
    pedal, knee, ankle = frames[0]

    if t is None:
        kt = ";".join(f2(i / STEPS) for i in range(STEPS + 1))

        def anim(values):
            return (f'<animate attributeName="d" values="{values}" keyTimes="{kt}" '
                    f'dur="{CRANK_DUR}s" repeatCount="indefinite" calcMode="linear"/>')

        thigh_a = anim(";".join(thigh_d(k) for _, k, _ in frames))
        tarsus_a = anim(";".join(tarsus_d(k, a) for _, k, a in frames))
        detail_a = anim(";".join(detail_d(k, a) for _, k, a in frames))
        foot_a = anim(";".join(foot_d(a) for _, _, a in frames))
        knee_vals = ";".join(f"{n(k[0])},{n(k[1])}" for _, k, _ in frames)
        pedal_vals = ";".join(f"{n(pp[0])},{n(pp[1])}" for pp, _, _ in frames)
        knee_attr = ""
        knee_child = (f'<animateTransform attributeName="transform" type="translate" '
                      f'values="{knee_vals}" keyTimes="{kt}" dur="{CRANK_DUR}s" '
                      f'repeatCount="indefinite" calcMode="linear"/>')
        pedal_attr = ""
        pedal_child = (f'<animateTransform attributeName="transform" type="translate" '
                       f'values="{pedal_vals}" keyTimes="{kt}" dur="{CRANK_DUR}s" '
                       f'repeatCount="indefinite" calcMode="linear"/>')
        thigh_path, tarsus_path = thigh_d(knee), tarsus_d(knee, ankle)
        detail_path, foot_path = detail_d(knee, ankle), foot_d(ankle)
        knee_xy = f"{n(knee[0])},{n(knee[1])}"
    else:
        idx = int(((t / CRANK_DUR) % 1.0) * STEPS + 0.5) % STEPS
        pedal, knee, ankle = frames[idx]
        thigh_a = tarsus_a = detail_a = foot_a = ""
        thigh_path, tarsus_path = thigh_d(knee), tarsus_d(knee, ankle)
        detail_path, foot_path = detail_d(knee, ankle), foot_d(ankle)
        knee_xy = f"{n(knee[0])},{n(knee[1])}"
        knee_attr = f' transform="translate({knee_xy})"'
        knee_child = ""
        pedal_attr = f' transform="translate({n(pedal[0])},{n(pedal[1])})"'
        pedal_child = ""

    g = [f'<g class="leg-{side}">']
    # pedal
    g.append(f'<g{pedal_attr}>{pedal_child}'
             f'<rect x="-24" y="-7" width="48" height="14" rx="3.5" fill="#3b3330" '
             f'stroke="{INK}" stroke-width="2.6"/>'
             f'<rect x="-18" y="-3.6" width="12" height="7.2" rx="1.8" fill="#e8c98a"/>'
             f'<rect x="13" y="-2.6" width="7" height="5.2" rx="1.4" fill="#f2b23f"/>'
             f'<circle cx="0" cy="0" r="2.2" fill="{STEEL_LIGHT}"/></g>')
    # feathered drumstick, tucked under the belly
    g.append(f'<path d="{thigh_path}" fill="{feather}" stroke="{INK}" '
             f'stroke-width="3.4" stroke-linejoin="round">{thigh_a}</path>')
    g.append(f'<path d="{thigh_path}" fill="none" stroke="{feather_shade}" '
             f'stroke-width="6" stroke-linecap="round" opacity=".5" '
             f'transform="translate(-2,4)">{thigh_a}</path>')
    # bare shank
    g.append(f'<path d="{tarsus_path}" fill="{color}" stroke="{INK}" '
             f'stroke-width="2.8" stroke-linejoin="round">{tarsus_a}</path>')
    g.append(f'<path d="{tarsus_path}" fill="none" stroke="{color_hi}" '
             f'stroke-width="3" stroke-linecap="round" opacity=".55" '
             f'transform="translate(1.5,-1)">{tarsus_a}</path>')
    # hock, drawn as a small joint that sits at the top of the shank
    g.append(f'<g{knee_attr}>{knee_child}'
             f'<circle cx="0" cy="0" r="5" fill="{color}" stroke="{INK}" stroke-width="2.2"/>'
             f'<circle cx="-1" cy="-1" r="2" fill="{color_hi}" opacity=".8"/></g>')
    # webbed foot
    g.append(f'<path d="{foot_path}" fill="{color}" stroke="{INK}" stroke-width="2.4" '
             f'stroke-linejoin="round">{foot_a}</path>')
    g.append(f'<path d="{detail_path}" fill="none" stroke="{INK}" stroke-width="1.7" '
             f'stroke-linecap="round" opacity=".38">{detail_a}</path>')
    g.append('</g>')
    return "".join(g)


# ------------------------------------------------------------- environment ---
rng = random.Random(7)


def sky():
    return f'''
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2f7cbb"/>
    <stop offset=".34" stop-color="#6fb4dc"/>
    <stop offset=".72" stop-color="#a9d8e8"/>
    <stop offset=".95" stop-color="#e2f0ee"/>
  </linearGradient>
  <radialGradient id="warm" cx=".79" cy=".14" r=".62">
    <stop offset="0" stop-color="#ffe6a8" stop-opacity=".55"/>
    <stop offset=".45" stop-color="#ffd894" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffd894" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#12586f"/>
    <stop offset=".35" stop-color="#1d7189"/>
    <stop offset=".78" stop-color="#3d97a4"/>
    <stop offset="1" stop-color="#63b6b8"/>
  </linearGradient>
  <radialGradient id="sunGlow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#fff4cd" stop-opacity=".9"/>
    <stop offset=".42" stop-color="#ffe9ad" stop-opacity=".32"/>
    <stop offset="1" stop-color="#ffe9ad" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="sunCore" cx=".42" cy=".4" r=".62">
    <stop offset="0" stop-color="#fffdf0"/>
    <stop offset=".6" stop-color="#fff0bf"/>
    <stop offset="1" stop-color="#ffdf9a"/>
  </radialGradient>
  <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ead6ab"/>
    <stop offset=".34" stop-color="#f2e0bb"/>
    <stop offset=".78" stop-color="#e9d3a6"/>
    <stop offset="1" stop-color="#dcc190"/>
  </linearGradient>
  <radialGradient id="sunPatch" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#fff2ce" stop-opacity=".8"/>
    <stop offset="1" stop-color="#fff2ce" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="basket" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8ab68"/>
    <stop offset="1" stop-color="#b9834a"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="softer" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="22"/>
  </filter>
  <filter id="tiny" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="3"/>
  </filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<rect width="{W}" height="470" fill="url(#warm)"/>
<!-- thin cirrus -->
<g fill="none" stroke="#fffaf0" stroke-linecap="round" opacity=".5">
  <path d="M 60,120 C 160,104 250,112 330,100" stroke-width="7" opacity=".35"/>
  <path d="M 90,142 C 180,132 246,138 300,128" stroke-width="4" opacity=".3"/>
  <path d="M 700,88 C 780,78 860,86 920,76" stroke-width="6" opacity=".3"/>
  <path d="M 1040,214 C 1110,204 1160,210 1200,202" stroke-width="5" opacity=".28"/>
</g>
'''


def sun():
    return f'''
<g class="sun">
  <circle cx="948" cy="148" r="168" fill="url(#sunGlow)"/>
  <circle cx="948" cy="148" r="46" fill="url(#sunCore)"/>
  <circle cx="948" cy="148" r="46" fill="none" stroke="#fff8e2" stroke-width="2.5" opacity=".6"/>
</g>
'''


def clouds(t):
    blobs = [
        (232, 190, 1.0, 1.0),
        (792, 240, .74, .97),
        (1094, 124, .56, .92),
        (512, 88, .42, .85),
    ]

    def one(x, y, s, op):
        return f'''
<g transform="translate({n(x)},{n(y)}) scale({s})" opacity="{op}">
  <path d="M -110,28 C -124,4 -108,-24 -78,-28 C -72,-56 -36,-66 -14,-46
           C 6,-72 46,-66 56,-38 C 88,-42 106,-18 100,4 C 114,16 106,30 90,32
           Z" fill="#fff8e6"/>
  <path d="M -110,28 C -84,40 42,42 90,32 C 58,24 -32,20 -110,28 Z" fill="#dfe6ea"/>
  <path d="M -78,-28 C -72,-56 -36,-66 -14,-46 C -34,-42 -60,-32 -78,-28 Z" fill="#ffeccb" opacity=".85"/>
  <path d="M 30,-46 C 46,-58 68,-52 74,-34 C 56,-32 42,-38 30,-46 Z" fill="#fffdf2" opacity=".7"/>
  <path d="M 10,10 C 30,20 58,20 78,14 C 58,24 28,24 10,10 Z" fill="#cfd9e0" opacity=".55"/>
</g>'''

    inner = "".join(one(*b) for b in blobs)
    if t is None:
        anim = (f'<animateTransform attributeName="transform" type="translate" '
                f'values="0,0;-{W},0" dur="{CLOUD_DUR}s" repeatCount="indefinite"/>')
        return (f'<g>{inner}{anim}</g>'
                f'<g transform="translate({W},0)"><g>{inner}{anim}</g></g>')
    off = -W * ((t / CLOUD_DUR) % 1.0)
    return (f'<g transform="translate({f2(off)},0)">{inner}</g>'
            f'<g transform="translate({f2(off + W)},0)">{inner}</g>')


def gull(x, y, s, flap_dur, t, drift=26.0, period=13.0, delay=0.0):
    wing = 0.0 if t is None else math.sin((t / flap_dur + delay) * math.tau) * 15.0
    body = f'''
<path d="M -18,0 C -10,-7 8,-8 18,-2 C 10,4 -8,6 -18,0 Z" fill="#fffaf0" stroke="{INK}" stroke-width="1.6"/>
<path d="M 18,-2 L 28,1 L 18,3 Z" fill="#f0a63e" stroke="{INK}" stroke-width="1.2"/>
<path d="M -8,-2 C -14,-12 -30,-16 -40,-10 C -28,-8 -20,-2 -12,2 Z" fill="#fffaf0" stroke="{INK}" stroke-width="1.4" transform="rotate({f2(wing)} -8 -2)"/>
<path d="M -6,-2 C -2,-14 14,-18 24,-12 C 14,-9 4,-3 -2,2 Z" fill="#e7e1d5" stroke="{INK}" stroke-width="1.4" transform="rotate({f2(-wing*0.8)} -6 -2)"/>
'''
    if t is None:
        anim = (f'<animateTransform attributeName="transform" type="translate" '
                f'values="0,0;{n(drift)},2;0,0" dur="{period}s" begin="{delay}s" '
                f'repeatCount="indefinite"/>')
        return f'<g>{anim}<g transform="translate({n(x)},{n(y)}) scale({s})">{body}</g></g>'
    dx = math.sin(t / period * math.tau + delay) * drift
    dy = math.sin(t / period * math.tau * 2 + delay) * 2
    return f'<g transform="translate({n(x+dx)},{n(y+dy)}) scale({s})">{body}</g>'


def gulls(t):
    return "".join([
        gull(322, 268, .85, 2.6, t, drift=30, period=15, delay=0.4),
        gull(432, 222, .6, 2.2, t, drift=22, period=12, delay=2.0),
        gull(902, 300, .7, 2.9, t, drift=18, period=17, delay=3.2),
    ])


def headland(t):
    return f'''
<g class="headland">
  <path d="M -20,472 C 24,448 54,424 96,420 C 132,416 168,430 208,440
           C 238,447 262,452 288,458 L 288,486 L -20,486 Z" fill="#7d9a83"/>
  <path d="M -20,470 C 40,462 90,452 150,456 C 210,460 254,470 288,474 L 288,486 L -20,486 Z" fill="#63826f"/>
  <path d="M 96,420 C 132,416 168,430 208,440 L 196,446 C 160,436 128,426 96,428 Z" fill="#96ac91"/>
  <g transform="translate(118,418)">
    <path d="M -16,0 L -11,-62 L 11,-62 L 16,0 Z" fill="#f6ead2" stroke="{INK}" stroke-width="3"/>
    <path d="M -12.6,-30 L 12.6,-30 L 13.4,-20 L -13.4,-20 Z" fill="#c25b45"/>
    <path d="M -10.4,-52 L 10.4,-52 L 11.4,-42 L -11.4,-42 Z" fill="#c25b45"/>
    <rect x="-14" y="-70" width="28" height="9" rx="2" fill="#3b4a4a" stroke="{INK}" stroke-width="2.4"/>
    <rect x="-9" y="-82" width="18" height="13" rx="2" fill="#ffd98a" stroke="{INK}" stroke-width="2.4"/>
    <path d="M -12,-82 L 12,-82 L 6,-90 L -6,-90 Z" fill="#b8493a" stroke="{INK}" stroke-width="2.4"/>
    <circle cx="0" cy="-95" r="2.6" fill="{INK}"/>
    <path d="M -30,-70 C -44,-78 -58,-78 -68,-72" fill="none" stroke="#fff3c8" stroke-width="5" opacity=".35" stroke-linecap="round"/>
  </g>
  <g stroke="{INK}" stroke-width="2">
    <path d="M 28,446 L 28,432 L 40,432 L 40,446 Z" fill="#efdcc0"/>
    <path d="M 24,433 L 34,424 L 44,433 Z" fill="#bf6a4d"/>
    <path d="M 48,448 L 48,436 L 62,436 L 62,448 Z" fill="#f3e2c8"/>
    <path d="M 45,437 L 55,429 L 65,437 Z" fill="#c9765a"/>
    <path d="M 208,450 L 208,438 L 222,438 L 222,450 Z" fill="#eedbc0"/>
    <path d="M 205,439 L 215,431 L 225,439 Z" fill="#ba654b"/>
    <path d="M 228,452 L 228,443 L 240,443 L 240,452 Z" fill="#e9d4b5"/>
    <path d="M 226,444 L 234,438 L 242,444 Z" fill="#c4704f"/>
  </g>
</g>
'''


def right_town(t):
    return f'''
<g class="far-town" stroke="{INK}" stroke-width="1.6" opacity=".95">
  <path d="M 1006,458 L 1006,444 L 1020,444 L 1020,458 Z" fill="#f0ddc2"/>
  <path d="M 1002,445 L 1013,437 L 1024,445 Z" fill="#bd6a50"/>
  <path d="M 1028,458 L 1028,448 L 1044,448 L 1044,458 Z" fill="#e9d3b6"/>
  <path d="M 1025,449 L 1036,442 L 1047,449 Z" fill="#c8765b"/>
  <path d="M 1062,458 L 1062,447 L 1074,447 L 1074,458 Z" fill="#f2e0c6"/>
  <path d="M 1059,448 L 1068,441 L 1077,448 Z" fill="#b9644a"/>
  <path d="M 1110,458 L 1110,442 L 1128,442 L 1128,458 Z" fill="#eed9bc"/>
  <path d="M 1106,443 L 1119,434 L 1132,443 Z" fill="#c4704f"/>
  <path d="M 1134,458 L 1134,449 L 1150,449 L 1150,458 Z" fill="#f4e2c9"/>
  <path d="M 1131,450 L 1142,443 L 1153,450 Z" fill="#bb664c"/>
  <path d="M 1160,458 L 1160,449 L 1180,449 L 1180,458 Z" fill="#efdcc2"/>
  <path d="M 1157,450 L 1170,443 L 1183,450 Z" fill="#c06b50"/>
</g>
<g class="far-islet" opacity=".95">
  <path d="M 900,458 C 912,450 928,447 946,450 C 958,452 966,455 972,458 Z" fill="#5e7d76"/>
  <path d="M 936,451 C 942,442 950,438 956,438 L 958,451 Z" fill="#7b998c"/>
</g>
'''


def sea(t):
    out = [f'<rect x="0" y="452" width="{W}" height="172" fill="url(#sea)"/>']
    out.append(f'<rect x="0" y="448" width="{W}" height="18" fill="#cdeae6" opacity=".55"/>')
    out.append(f'<rect x="0" y="463" width="{W}" height="4" fill="#eff9f3" opacity=".5"/>')
    # sun glitter column
    out.append('<g fill="#ffeec6"><animate attributeName="opacity" values=".72;1;.8;1;.72" keyTimes="0;.25;.5;.75;1" dur="4.6s" repeatCount="indefinite"/>')
    for i in range(26):
        k = i / 25.0
        y = 464 + k * 132
        x = 948 + math.sin(i * 2.1) * (6 + k * 26)
        w = 6 + k * 26 + (i % 3) * 4
        out.append(f'<rect x="{n(x-w/2)}" y="{n(y)}" width="{n(w)}" height="{n(1.6 + k*2.2)}" rx="1.4" opacity="{n(0.45 - k*0.22)}"/>')
    out.append('</g>')
    # wave strokes
    out.append('<g stroke="#bde6e4" stroke-linecap="round" fill="none">')
    for i in range(80):
        x = rng.uniform(-20, W + 20)
        y = rng.uniform(472, 606)
        ln = rng.uniform(12, 38) * (0.55 + (y - 470) / 170)
        out.append(f'<path d="M {n(x)},{n(y)} q {n(ln/2)},-3 {n(ln)},0" stroke-width="{n(rng.uniform(1.3,2.6))}" opacity="{n(rng.uniform(.08,.3))}"/>')
    out.append('</g>')
    # darker deep bands
    out.append('<path d="M 0,524 C 220,518 380,528 600,522 C 820,516 1020,526 1200,520 L 1200,544 C 1000,550 800,542 600,546 C 400,550 200,544 0,548 Z" fill="#1b6a80" opacity=".07"/>')
    # shore foam
    out.append('<path d="M 0,596 C 140,588 250,604 400,598 C 560,590 700,606 860,600 C 1000,594 1120,604 1200,598 L 1200,622 L 0,622 Z" fill="#6db8bd"/>')
    out.append('<path d="M 0,602 C 200,596 330,610 500,604 C 700,598 900,612 1200,604 L 1200,618 L 0,618 Z" fill="#9ad6d1" opacity=".75"/>')
    out.append('<g fill="#f7f4e4" opacity=".9">')
    for i in range(26):
        x = rng.uniform(10, W - 10)
        y = rng.uniform(592, 610)
        out.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(rng.uniform(2,7))}" ry="{n(rng.uniform(1.2,2.6))}"/>')
    out.append('</g>')
    # sparkles
    out.append('<g fill="#f8f5e6">')
    for i in range(30):
        x = rng.uniform(20, W - 20)
        y = rng.uniform(474, 590)
        w = rng.uniform(1.6, 3.4)
        out.append(f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="1.6" opacity="{n(rng.uniform(.3,.8))}"/>')
    out.append('</g>')
    # boats
    out.append(f'''
<g class="boat" transform="translate(942,520)">
  <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0;0,3;0,0" keyTimes="0;.3;.55;.8;1" dur="5.6s" repeatCount="indefinite"/>
  <path d="M -26,2 C -15,11 15,11 26,2 L 19,-3 L -19,-3 Z" fill="#3d4a4e" stroke="{INK}" stroke-width="2"/>
  <path d="M -2,-5 L -2,-46 L 24,-5 Z" fill="#fdf3dc" stroke="{INK}" stroke-width="2"/>
  <path d="M -7,-5 L -7,-40 L -28,-5 Z" fill="#f3e3c4" stroke="{INK}" stroke-width="2"/>
  <path d="M 0,-5 L 0,-44" stroke="{INK}" stroke-width="2"/>
  <path d="M -28,6 C -20,10 20,10 28,6" fill="none" stroke="#cdeae6" stroke-width="2" opacity=".7"/>
  </g>
</g>
<g class="boat2" transform="translate(1078,548) scale(.7)">
  <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0;0,2;0,0" keyTimes="0;.3;.55;.8;1" dur="6.8s" repeatCount="indefinite"/>
  <path d="M -26,2 C -15,11 15,11 26,2 L 19,-3 L -19,-3 Z" fill="#41505a" stroke="{INK}" stroke-width="2.2"/>
  <path d="M -2,-5 L -2,-46 L 24,-5 Z" fill="#fdf3dc" stroke="{INK}" stroke-width="2.2"/>
  <path d="M -7,-5 L -7,-40 L -28,-5 Z" fill="#f0dfc0" stroke="{INK}" stroke-width="2.2"/>
  <path d="M 0,-5 L 0,-44" stroke="{INK}" stroke-width="2.2"/>
  </g>
</g>
<g class="boat3" transform="translate(300,502) scale(.42)" opacity=".9">
  <path d="M -26,2 C -15,11 15,11 26,2 L 19,-3 L -19,-3 Z" fill="#4a565a" stroke="{INK}" stroke-width="2.4"/>
  <path d="M -2,-5 L -2,-46 L 24,-5 Z" fill="#fdf3dc" stroke="{INK}" stroke-width="2.4"/>
  <path d="M 0,-5 L 0,-44" stroke="{INK}" stroke-width="2.4"/>
</g>''')
    return "".join(out)


def railing_tile(t):
    posts = []
    for i in range(21):
        x = 30 + i * 60
        posts.append(f'''
<g class="post">
  <path d="M {x-8},{618} L {x-4},{562} L {x+4},{562} L {x+8},{618} Z" fill="#f2e6ca" stroke="{INK}" stroke-width="2.6"/>
  <circle cx="{x}" cy="557" r="7.4" fill="#f7ecd4" stroke="{INK}" stroke-width="2.4"/>
  <rect x="{x-9}" y="613" width="18" height="6" rx="2" fill="#e3d2ad" stroke="{INK}" stroke-width="2.2"/>
</g>''')
    life_ring = '''
<g class="ring" transform="translate(1012,592)">
  <path d="M -18,-46 L -6,-26 M 18,-46 L 6,-26" stroke="#e8d8b6" stroke-width="3" stroke-linecap="round"/>
  <circle r="24" fill="#f7ecd4" stroke="#241726" stroke-width="3"/>
  <circle r="12" fill="none" stroke="#241726" stroke-width="2.4"/>
  <path d="M -24,0 A 24,24 0 0 1 0,-24 L 0,-12 A 12,12 0 0 0 -12,0 Z" fill="#d8583f"/>
  <path d="M 24,0 A 24,24 0 0 1 0,24 L 0,12 A 12,12 0 0 0 12,0 Z" fill="#d8583f"/>
</g>'''
    shadow = f'''
<g class="rail-shadow" opacity=".14">
  <rect x="0" y="618" width="1200" height="11" fill="#8f7047" filter="url(#tiny)"/>
  <g stroke="#8f7047" stroke-width="8" stroke-linecap="round" filter="url(#tiny)">
    {''.join(f'<path d="M {30+i*60},622 L {30+i*60-26},642"/>' for i in range(19))}
  </g>
</g>'''
    inner = f'''
<g stroke-linecap="round">
  <path d="M 0,554 L 1200,554" stroke="{INK}" stroke-width="12"/>
  <path d="M 0,554 L 1200,554" stroke="#f4e8cd" stroke-width="8"/>
  <path d="M 0,554 L 1200,554" stroke="#fff8e6" stroke-width="2.4" opacity=".8" transform="translate(0,-2)"/>
  <path d="M 0,590 L 1200,590" stroke="{INK}" stroke-width="8"/>
  <path d="M 0,590 L 1200,590" stroke="#eddfc1" stroke-width="5"/>
</g>
{''.join(posts)}
{life_ring}
{shadow}
'''
    return inner


def railing(t):
    return railing_tile(t)


def shell(x, y, s, fill, t=None):
    return f'''
<g transform="translate({n(x)},{n(y)}) scale({s}) rotate({n((-8 + (x % 17)))} )">
  <path d="M -14,0 C -14,-14 0,-22 14,-6 C 8,-2 2,1 -14,0 Z" fill="{fill}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M -10,-2 C -8,-10 -2,-14 4,-12 M -4,-1 C -3,-6 1,-9 5,-8" fill="none" stroke="#a9825a" stroke-width="1.6" opacity=".8"/>
</g>'''


def starfish(x, y, s, t=None):
    return f'''
<g class="starfish" transform="translate({n(x)},{n(y)}) scale({s}) rotate(12)">
  <path d="M 0,-26 L 7,-8 L 26,-7 L 11,4 L 16,23 L 0,12 L -16,23 L -11,4 L -26,-7 L -7,-8 Z"
        fill="#e2823f" stroke="{INK}" stroke-width="2.8" stroke-linejoin="round"/>
  <g fill="#c4632b" opacity=".8">
    <circle cx="0" cy="-10" r="1.6"/><circle cx="0" cy="0" r="2.2"/>
    <circle cx="-9" cy="-2" r="1.6"/><circle cx="9" cy="-2" r="1.6"/>
    <circle cx="-6" cy="9" r="1.5"/><circle cx="6" cy="9" r="1.5"/>
  </g>
</g>'''


def crab(x, y, s, t):
    # a small hermit crab watching the pelican go by
    if t is None:
        wave_attr = ""
        wave = (f'<animateTransform attributeName="transform" type="rotate" '
                f'values="0 -14 -6;14 -14 -6;-4 -14 -6;0 -14 -6" '
                f'keyTimes="0;.35;.7;1" dur="2.6s" repeatCount="indefinite"/>')
    else:
        wave_attr = f' transform="rotate({n(10*math.sin(t/2.6*math.tau))} -14 -6)"'
        wave = ""
    return f'''
<g class="crab" transform="translate({n(x)},{n(y)}) scale({s})">
  <ellipse cx="0" cy="6" rx="26" ry="8" fill="#8a6a44" opacity=".25" filter="url(#tiny)"/>
  <g stroke="{INK}" stroke-width="2.2" stroke-linecap="round" fill="none">
    <path d="M -16,0 L -30,8 M -12,4 L -24,14 M -4,6 L -10,16"/>
    <path d="M 14,0 L 28,8 M 10,4 L 20,14 M 2,6 L 6,16"/>
  </g>
  <path d="M -20,-2 C -20,-14 -8,-20 0,-20 C 8,-20 20,-14 20,-2 C 14,4 -14,4 -20,-2 Z"
        fill="#d9633f" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M -14,-8 C -6,-12 6,-12 14,-8" fill="none" stroke="#f0a07a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <g{wave_attr}>{wave}
    <path d="M -14,-6 C -22,-14 -30,-14 -32,-22 C -24,-24 -18,-18 -14,-12 Z"
          fill="#d9633f" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  </g>
  <path d="M 14,-6 C 20,-12 26,-14 28,-20 C 22,-20 16,-16 12,-10 Z"
        fill="#c2532f" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <g stroke="{INK}" stroke-width="1.8">
    <line x1="-7" y1="-20" x2="-8" y2="-27"/><line x1="7" y1="-20" x2="8" y2="-27"/>
  </g>
  <circle cx="-8" cy="-29" r="3.4" fill="#fffaf0" stroke="{INK}" stroke-width="1.8"/>
  <circle cx="8" cy="-29" r="3.4" fill="#fffaf0" stroke="{INK}" stroke-width="1.8"/>
  <circle cx="-8" cy="-29" r="1.5" fill="{INK}"/>
  <circle cx="8" cy="-29" r="1.5" fill="{INK}"/>
</g>'''


def sand(t):
    out = [f'<rect x="0" y="614" width="{W}" height="{H-614}" fill="url(#sand)"/>']
    out.append(f'<rect x="0" y="606" width="{W}" height="12" fill="#b99a6d"/>')
    # warm pool of light where the bicycle is
    out.append(f'<ellipse cx="600" cy="790" rx="430" ry="150" fill="url(#sunPatch)"/>')
    # broad, soft dune shading
    out.append('<path d="M 0,700 C 220,684 420,712 640,700 C 860,688 1040,710 1200,696 L 1200,742 C 1000,752 820,736 600,746 C 380,756 180,740 0,750 Z" fill="#d3b483" opacity=".28"/>')
    out.append('<path d="M 0,842 C 240,826 460,846 700,838 C 900,832 1050,846 1200,838 L 1200,900 L 0,900 Z" fill="#c7a773" opacity=".3"/>')
    # static wind ripples in the far band
    out.append('<g stroke="%s" fill="none" stroke-linecap="round">' % SAND_LINE)
    for i in range(54):
        x = rng.uniform(-40, W + 40)
        y = rng.uniform(626, 792)
        ln = rng.uniform(30, 92)
        out.append(f'<path d="M {n(x)},{n(y)} q {n(ln/2)},-5 {n(ln)},-1" stroke-width="{n(rng.uniform(1.6,2.6))}" opacity="{n(rng.uniform(.12,.26))}"/>')
    out.append('</g>')
    # far pebbles, static
    out.append('<g>')
    for i in range(70):
        x = rng.uniform(0, W)
        y = rng.uniform(630, 800)
        r1 = rng.uniform(1.8, 4.4) * .8
        r2 = rng.uniform(1.1, 2.6) * .8
        out.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(r1)}" ry="{n(r2)}" fill="#c8a878" opacity=".55"/>')
        out.append(f'<ellipse cx="{n(x-r1*.25)}" cy="{n(y-r2*.35)}" rx="{n(r1*.5)}" ry="{n(r2*.4)}" fill="#f7e9cd" opacity=".45"/>')
    out.append('</g>')
    # near band: ripples and pebbles, sliding at the wheel's speed
    near = ['<g>']
    for i in range(34):
        x = rng.uniform(0, W)
        y = rng.uniform(806, 900)
        ln = rng.uniform(48, 130)
        near.append(f'<path d="M {n(x)},{n(y)} q {n(ln/2)},-7 {n(ln)},-1" fill="none" stroke="{SAND_LINE}" stroke-width="2.4" opacity=".28" stroke-linecap="round"/>')
    for i in range(58):
        x = rng.uniform(0, W)
        y = rng.uniform(802, 900)
        r1 = rng.uniform(2.0, 5.2)
        r2 = rng.uniform(1.2, 3.0)
        near.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(r1)}" ry="{n(r2)}" fill="#bb9a68" opacity=".5"/>')
        near.append(f'<ellipse cx="{n(x-r1*.25)}" cy="{n(y-r2*.35)}" rx="{n(r1*.5)}" ry="{n(r2*.4)}" fill="#f9ecd2" opacity=".5"/>')
    near.append('</g>')
    near_inner = "".join(near)
    if t is None:
        anim = (f'<animateTransform attributeName="transform" type="translate" '
                f'values="0,0;-{W},0" dur="{GROUND_DUR}s" repeatCount="indefinite"/>')
        out.append(f'<g>{near_inner}{anim}</g><g transform="translate({W},0)"><g>{near_inner}{anim}</g></g>')
    else:
        off = -W * ((t / GROUND_DUR) % 1.0)
        out.append(f'<g transform="translate({f2(off)},0)">{near_inner}</g>'
                   f'<g transform="translate({f2(off + W)},0)">{near_inner}</g>')
    # foreground life
    out.append(starfish(1078, 788, 0.92, t))
    out.append(shell(238, 792, 0.9, "#f6e6c4", t))
    out.append(shell(270, 778, .65, "#eccfa9", t))
    out.append(shell(1006, 776, .5, "#f3dcb8", t))
    out.append(crab(1146, 792, 0.9, t))
    out.append(f'''
<g class="dune-grass" opacity=".95">
  <g transform="translate(34,868)" stroke="{INK}" stroke-width="2.2" fill="none" stroke-linecap="round">
    <path d="M 0,26 C -2,-4 -12,-18 -24,-30" stroke="#8d9a63"/>
    <path d="M 4,26 C 4,0 0,-22 8,-40" stroke="#7d8b56"/>
    <path d="M 8,26 C 12,2 22,-12 34,-22" stroke="#95a06b"/>
    <path d="M 2,26 C -6,6 -18,-2 -30,-4" stroke="#8d9a63"/>
  </g>
  <g transform="translate(1190,900)" stroke="{INK}" stroke-width="2.2" fill="none" stroke-linecap="round">
    <path d="M 0,4 C -2,-16 -10,-30 -22,-40" stroke="#8d9a63"/>
    <path d="M 4,4 C 4,-14 2,-32 10,-48" stroke="#7d8b56"/>
    <path d="M 8,4 C 12,-12 20,-24 32,-34" stroke="#95a06b"/>
  </g>
</g>''')
    return "".join(out)


# ------------------------------------------------------------------- bike ---
def tyre(cx, cy, t):
    tread = []
    for i in range(48):
        a = i * 7.5
        ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
        tread.append(f'<line x1="{n(cx + 89*ca)}" y1="{n(cy + 89*sa)}" '
                     f'x2="{n(cx + 98*ca)}" y2="{n(cy + 98*sa)}" '
                     f'stroke="{TYRE_HI}" stroke-width="3" opacity=".55"/>')
    spokes = []
    for i in range(18):
        a = math.radians(i * 20)
        spokes.append(f'<line x1="{n(cx + 11*math.cos(a))}" y1="{n(cy + 11*math.sin(a))}" '
                      f'x2="{n(cx + 79*math.cos(a))}" y2="{n(cy + 79*math.sin(a))}" '
                      f'stroke="{SPOKE}" stroke-width="2.1"/>')
    # a valve helps the eye read rotation
    valve = f'<line x1="{n(cx)}" y1="{n(cy-82)}" x2="{n(cx)}" y2="{n(cy-92)}" stroke="{BRASS}" stroke-width="4"/>'
    rim = (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="85.5" fill="none" stroke="#c79d67" stroke-width="11"/>'
           f'<circle cx="{n(cx)}" cy="{n(cy)}" r="85.5" fill="none" stroke="#e3c193" stroke-width="7.5"/>'
           f'<circle cx="{n(cx)}" cy="{n(cy)}" r="79.5" fill="none" stroke="{INK}" stroke-width="11"/>'
           f'<circle cx="{n(cx)}" cy="{n(cy)}" r="79.5" fill="none" stroke="{RIM}" stroke-width="7"/>'
           f'<circle cx="{n(cx)}" cy="{n(cy)}" r="72" fill="none" stroke="#cbb894" stroke-width="1.4" opacity=".7"/>')
    tyre_ring = (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(R)}" fill="none" stroke="{INK}" stroke-width="22"/>'
                 f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(R)}" fill="none" stroke="{TYRE}" stroke-width="17"/>')
    inner = (rim + "".join(spokes) + valve +
             f'<circle cx="{n(cx)}" cy="{n(cy)}" r="12.5" fill="{BRASS}" stroke="{INK}" stroke-width="2.8"/>'
             f'<circle cx="{n(cx)}" cy="{n(cy)}" r="4.5" fill="#6d4f28"/>' +
             "".join(tread))
    if t is None:
        rot = (f'<g><animateTransform attributeName="transform" type="rotate" '
               f'from="0 {n(cx)} {n(cy)}" to="360 {n(cx)} {n(cy)}" dur="{WHEEL_DUR}s" '
               f'repeatCount="indefinite"/>{inner}</g>')
    else:
        a = (t / WHEEL_DUR * 360) % 360
        rot = f'<g transform="rotate({f2(a)} {n(cx)} {n(cy)})">{inner}</g>'
    return tyre_ring + rot


def fender(cx, cy, a0, a1):
    pts = sampled_ellipse(cx, cy, 106, 106, a0, a1, 20)
    d = f"M {n(pts[0][0])},{n(pts[0][1])} " + " ".join(
        f"L {n(p[0])},{n(p[1])}" for p in pts[1:])
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="17" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{CREAM}" stroke-width="13" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{TEAL_LIGHT}" stroke-width="3" stroke-linecap="round" opacity=".85"/>'
            f'<path d="{d}" fill="none" stroke="#fffaf0" stroke-width="2" stroke-linecap="round" opacity=".55" transform="translate(0,-5)"/>')


def bike_frame(t):
    tubes = [
        (SEAT, BB, 16),                 # seat tube
        (BB, HEAD_BOT, 17),             # down tube
        (BB, REAR, 12),                 # chainstay
        (SEAT, REAR, 11),               # seatstay
        (HEAD_TOP, HEAD_BOT, 19),       # head tube
    ]
    out = ['<g class="frame">']
    # fork
    fork = f"M {n(HEAD_BOT[0])},{n(HEAD_BOT[1])} C 752,646 768,686 {n(FRONT[0])},{n(FRONT[1])}"
    out.append(f'<path d="{fork}" fill="none" stroke="{INK}" stroke-width="16" stroke-linecap="round"/>')
    out.append(f'<path d="{fork}" fill="none" stroke="{TEAL}" stroke-width="11" stroke-linecap="round"/>')
    out.append(f'<path d="{fork}" fill="none" stroke="{TEAL_LIGHT}" stroke-width="3" stroke-linecap="round" opacity=".75" transform="translate(-3,0)"/>')
    # fenders behind the frame
    out.append(fender(REAR[0], REAR[1], 202, 338))
    out.append(fender(FRONT[0], FRONT[1], 196, 326))
    fender_stays = (f'<path d="M {n(REAR[0]-100)},{n(REAR[1]-32)} L {n(REAR[0])},{n(REAR[1])}" stroke="{STEEL_LIGHT}" stroke-width="3.2"/>'
                    f'<path d="M {n(FRONT[0]-99)},{n(FRONT[1]-30)} L {n(FRONT[0])},{n(FRONT[1])}" stroke="{STEEL_LIGHT}" stroke-width="3.2"/>'
                    f'<path d="M {n(REAR[0]+96)},{n(REAR[1]-42)} L {n(REAR[0])},{n(REAR[1])}" stroke="{STEEL_LIGHT}" stroke-width="2.6" opacity=".8"/>'
                    f'<path d="M {n(FRONT[0]+97)},{n(FRONT[1]-40)} L {n(FRONT[0])},{n(FRONT[1])}" stroke="{STEEL_LIGHT}" stroke-width="2.6" opacity=".8"/>')
    out.append(fender_stays)
    tubes = tubes + [("CURVE_TOP", None, 15)]
    for a, b, wd in tubes:
        if a == "CURVE_TOP":
            d = "M 720,548 C 692,604 612,646 482,660"
        else:
            d = f"M {n(a[0])},{n(a[1])} L {n(b[0])},{n(b[1])}"
        out.append(f'<path d="{d}" stroke="{INK}" stroke-width="{wd+8}" stroke-linecap="round" fill="none"/>')
        out.append(f'<path d="{d}" stroke="{TEAL}" stroke-width="{wd}" stroke-linecap="round" fill="none"/>')
        out.append(f'<path d="{d}" stroke="{TEAL_LIGHT}" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".8" transform="translate(-2.5,-3)"/>')
    # seat post + saddle
    out.append(f'<path d="M {n(SEAT[0])},{n(SEAT[1])} L 430,578" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>')
    out.append(f'<path d="M {n(SEAT[0])},{n(SEAT[1])} L 430,578" stroke="{STEEL_LIGHT}" stroke-width="8" stroke-linecap="round"/>')
    out.append(f'''
<g class="saddle">
  <path d="M 386,578 C 404,560 452,556 490,566 C 502,569 508,575 500,581
           C 462,590 412,590 388,585 C 380,583 380,580 386,578 Z"
        fill="{LEATHER}" stroke="{INK}" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="M 396,578 C 420,568 456,566 482,572" fill="none" stroke="{LEATHER_LIGHT}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
  <path d="M 386,584 C 400,590 420,592 440,590" fill="none" stroke="#5e3020" stroke-width="2.4" opacity=".8"/>
  <circle cx="476" cy="570" r="2.4" fill="{BRASS}"/>
  <circle cx="484" cy="570" r="2.4" fill="{BRASS}"/>
</g>
<g class="saddle-springs">
  <path d="M 398,584 C 394,592 402,596 398,604 C 394,612 402,616 398,624" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M 398,584 C 394,592 402,596 398,604 C 394,612 402,616 398,624" fill="none" stroke="{STEEL_LIGHT}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M 416,586 C 412,594 420,598 416,606 C 412,614 420,618 416,624" fill="none" stroke="{INK}" stroke-width="5.4" stroke-linecap="round"/>
  <path d="M 416,586 C 412,594 420,598 416,606 C 412,614 420,618 416,624" fill="none" stroke="{STEEL_LIGHT}" stroke-width="3" stroke-linecap="round"/>
</g>''')
    # headset, stem, handlebar
    out.append(f'<path d="M {n(HEAD_TOP[0])},{n(HEAD_TOP[1])} L 707,514" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>')
    out.append(f'<path d="M {n(HEAD_TOP[0])},{n(HEAD_TOP[1])} L 707,514" stroke="{STEEL}" stroke-width="9" stroke-linecap="round"/>')
    bar = "M 707,514 C 706,498 688,490 670,494 C 658,497 651,507 651,517"
    out.append(f'<path d="{bar}" fill="none" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>')
    out.append(f'<path d="{bar}" fill="none" stroke="#e9dcc0" stroke-width="9" stroke-linecap="round"/>')
    out.append(f'<path d="{bar}" fill="none" stroke="#fff8e6" stroke-width="3" stroke-linecap="round" opacity=".75" transform="translate(-1,-2)"/>')
    out.append(f'<path d="{bar}" fill="none" stroke="{STEEL_LIGHT}" stroke-width="2.6" stroke-linecap="round" opacity=".8" transform="translate(-1,-2)"/>')
    out.append(f'''
<g class="grip">
  <rect x="636" y="510" width="27" height="14" rx="7" fill="{LEATHER}" stroke="{INK}" stroke-width="2.8" transform="rotate(-8 650 517)"/>
  <path d="M 642,513 L 658,518" stroke="{LEATHER_LIGHT}" stroke-width="2.2" stroke-linecap="round"/>
</g>
<g class="bell">
  <path d="M 686,512 C 686,498 704,498 704,512 Z" fill="{BRASS}" stroke="{INK}" stroke-width="2.8"/>
  <rect x="689" y="510" width="12" height="5" rx="1.6" fill="#8a6531" stroke="{INK}" stroke-width="1.8"/>
  <circle cx="695" cy="503" r="2.4" fill="#fff2c8"/>
  <g opacity=".55" fill="none" stroke="{BRASS}" stroke-width="2" stroke-linecap="round">
    <animate attributeName="opacity" values="0;0;.7;.55;0;0" keyTimes="0;.52;.56;.62;.68;1" dur="7s" repeatCount="indefinite"/>
    <path d="M 706,500 C 712,496 714,490 713,484"/>
    <path d="M 710,506 C 718,502 722,494 721,486"/>
  </g>
</g>''')
    # headlamp on the fork crown
    out.append(f'''
<g class="lamp">
  <rect x="744" y="596" width="26" height="30" rx="7" fill="#f6e7c6" stroke="{INK}" stroke-width="2.8" transform="rotate(-12 757 611)"/>
  <circle cx="757" cy="611" r="8" fill="#ffe6a3" stroke="{INK}" stroke-width="2.2"/>
</g>''')
    out.append('</g>')
    return "".join(out)


def drivetrain(t):
    # chain: two runs between chainring and rear cog, plus wrap arcs
    chain = ("M 520,681 L 330,700 A 16,16 0 0 0 330,732 L 520,763 "
             "A 41,41 0 0 0 520,681 Z")
    out = ['<g class="drivetrain">']
    out.append(f'<path d="{chain}" fill="none" stroke="{INK}" stroke-width="9"/>')
    out.append(f'<path d="{chain}" fill="none" stroke="#6d5b4b" stroke-width="4.6" stroke-dasharray="6 5" stroke-linecap="round"')
    if t is None:
        out.append(f'><animate attributeName="stroke-dashoffset" from="0" to="-60" dur="0.5s" repeatCount="indefinite"/></path>')
    else:
        out.append(f' stroke-dashoffset="{f2(-60 * (t / 0.5) % 60)}"/>')
    out.append(f'<circle cx="{n(REAR[0])}" cy="{n(REAR[1])}" r="15" fill="{STEEL}" stroke="{INK}" stroke-width="2.6"/>')
    out.append('</g>')

    # crank and chainring rotate together
    crank_inner = f'''
<circle cx="{n(BB[0])}" cy="{n(BB[1])}" r="41" fill="none" stroke="{INK}" stroke-width="11"/>
<circle cx="{n(BB[0])}" cy="{n(BB[1])}" r="41" fill="none" stroke="{BRASS}" stroke-width="7"
        stroke-dasharray="4 4" stroke-linecap="round"/>
<path d="M {n(BB[0])},{n(BB[1])} L {n(BB[0]+46)},{n(BB[1])}" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>
<path d="M {n(BB[0])},{n(BB[1])} L {n(BB[0]+46)},{n(BB[1])}" stroke="{STEEL}" stroke-width="8.5" stroke-linecap="round"/>
<path d="M {n(BB[0])},{n(BB[1])} L {n(BB[0]-46)},{n(BB[1])}" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>
<path d="M {n(BB[0])},{n(BB[1])} L {n(BB[0]-46)},{n(BB[1])}" stroke="{STEEL}" stroke-width="8.5" stroke-linecap="round"/>
<circle cx="{n(BB[0])}" cy="{n(BB[1])}" r="12" fill="{STEEL_LIGHT}" stroke="{INK}" stroke-width="2.8"/>
<circle cx="{n(BB[0])}" cy="{n(BB[1])}" r="4" fill="#6d5b4b"/>
'''
    if t is None:
        out.append(f'<g><animateTransform attributeName="transform" type="rotate" '
                   f'from="{n(PHASE0)} {n(BB[0])} {n(BB[1])}" to="{n(PHASE0 + 360)} {n(BB[0])} {n(BB[1])}" '
                   f'dur="{CRANK_DUR}s" repeatCount="indefinite"/>{crank_inner}</g>')
    else:
        a = (PHASE0 + t / CRANK_DUR * 360) % 360
        out.append(f'<g transform="rotate({f2(a)} {n(BB[0])} {n(BB[1])})">{crank_inner}</g>')
    return "".join(out)


def basket(t):
    out = [f'''
<g class="basket">
  <g stroke="{INK}" stroke-width="2.4">
    <path d="M 726,542 L 736,606" stroke-width="4"/>
    <path d="M 858,542 L 848,606" stroke-width="4"/>
    <path d="M 852,612 L 776,716" stroke-width="5" opacity=".9"/>
    <path d="M 852,612 L 776,716" stroke="#d7cab0" stroke-width="2.6"/>
    <path d="M 738,606 L 748,614" stroke-width="3.4"/>
    <path d="M 846,606 L 838,614" stroke-width="3.4"/>
  </g>
  <path d="M 716,542 L 870,542 L 856,616 L 730,616 Z" fill="url(#basket)" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M 716,542 L 870,542 L 868,554 L 718,554 Z" fill="#e2ba7a" stroke="{INK}" stroke-width="3"/>
  <g stroke="#9c6d36" stroke-width="2.2" opacity=".8">
    <path d="M 724,554 L 732,614"/><path d="M 742,554 L 746,615"/><path d="M 760,554 L 761,616"/>
    <path d="M 778,554 L 776,616"/><path d="M 796,554 L 791,616"/><path d="M 814,554 L 806,615"/>
    <path d="M 832,554 L 821,615"/><path d="M 850,554 L 836,615"/><path d="M 862,554 L 851,614"/>
    <path d="M 720,570 L 865,570"/><path d="M 724,588 L 861,588"/><path d="M 728,604 L 857,604"/>
  </g>
  <path d="M 722,563 L 864,563" stroke="#f0cd93" stroke-width="2.4" opacity=".8"/>
  <!-- the day's catch -->
  <g class="fish">
    <animateTransform attributeName="transform" type="rotate" values="0 780 552;1.6 780 552;0 780 552;-1.2 780 552;0 780 552" keyTimes="0;.25;.5;.75;1" dur="3.4s" repeatCount="indefinite"/>
    <path d="M 742,542 C 748,554 758,560 772,558 C 788,556 798,548 802,542
             C 796,550 784,562 770,564 C 754,566 744,556 742,542 Z"
          fill="#a9cbd4" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
    <g transform="translate(770,552) rotate(-14)">
      <path d="M 0,0 C 14,-10 38,-9 52,4 C 40,16 14,16 0,6 Z"
            fill="#bcd8de" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M 0,2 L -16,-8 L -12,2 L -17,11 Z" fill="#8fb6c0" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M 12,-3 C 20,-7 31,-6 38,0" fill="none" stroke="#7aa2ad" stroke-width="2" opacity=".9"/>
      <circle cx="43" cy="2" r="2.2" fill="{INK}"/>
      <path d="M 40,7 C 44,9 48,9 51,7" fill="none" stroke="#7aa2ad" stroke-width="1.6"/>
    </g>
    <g transform="translate(826,540) rotate(18)">
      <path d="M 0,4 C 2,-8 12,-16 20,-14 C 16,-6 18,2 12,10 C 8,8 2,7 0,4 Z"
            fill="#bcd8de" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M 20,-14 C 30,-18 38,-16 40,-10 C 34,-8 28,-4 24,0 Z"
            fill="#9dc0c9" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
    </g>
  </g>
</g>''']
    return "".join(out)



def bench(x, y, s, t=None):
    return f'''
<g class="bench" transform="translate({n(x)},{n(y)}) scale({s})">
  <ellipse cx="14" cy="52" rx="120" ry="12" fill="#8a6a44" opacity=".3" filter="url(#tiny)"/>
  <g stroke="{INK}" stroke-width="3" stroke-linejoin="round">
    <path d="M -92,8 L -86,-58 L -74,-58 L -80,8 Z" fill="#3c6557"/>
    <path d="M 68,8 L 74,-58 L 86,-58 L 80,8 Z" fill="#3c6557"/>
    <path d="M -84,-62 L 76,-62 L 74,-52 L -82,-52 Z" fill="#3c6557"/>
    <path d="M -82,-40 L 74,-40 L 72,-31 L -80,-31 Z" fill="#3c6557"/>
    <path d="M -86,-8 L -86,34 L -78,34 L -78,-8 Z" fill="#2f5348"/>
    <path d="M 72,-8 L 72,34 L 80,34 L 80,-8 Z" fill="#2f5348"/>
  </g>
  <g fill="#c58c54" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M -86,-46 L 76,-46 L 76,-36 L -86,-36 Z"/>
    <path d="M -86,-32 L 76,-32 L 76,-22 L -86,-22 Z"/>
    <path d="M -84,-16 L 78,-16 L 78,-2 L -84,-2 Z"/>
  </g>
  <g stroke="#a06f3d" stroke-width="2.2" opacity=".85">
    <path d="M -78,-42 L 68,-42"/><path d="M -78,-28 L 68,-28"/><path d="M -76,-10 L 70,-10"/>
  </g>
</g>'''


def bike(t):
    out = []
    # ground shadow
    out.append(f'<ellipse cx="305" cy="828" rx="150" ry="26" fill="#6a4a2a" opacity=".22" filter="url(#soft)"/>')
    out.append(f'<ellipse cx="755" cy="828" rx="150" ry="26" fill="#6a4a2a" opacity=".22" filter="url(#soft)"/>')
    out.append(f'<path d="M 248,812 C 350,806 500,808 640,812 L 890,820 L 884,831 '
              f'C 700,835 420,833 248,825 Z" fill="#4a2d14" opacity=".32" filter="url(#tiny)"/>')
    out.append(f'<ellipse cx="330" cy="817" rx="62" ry="8" fill="#3a2412" opacity=".55" filter="url(#tiny)"/>')
    out.append(f'<ellipse cx="776" cy="817" rx="62" ry="8" fill="#3a2412" opacity=".55" filter="url(#tiny)"/>')
    out.append(f'<ellipse cx="330" cy="815" rx="34" ry="4" fill="#2a190b" opacity=".5"/>')
    out.append(f'<ellipse cx="776" cy="815" rx="34" ry="4" fill="#2a190b" opacity=".5"/>')
    # dust puffs behind the rear wheel
    out.append(dust(t))
    out.append(tyre(REAR[0], REAR[1], t))
    out.append(tyre(FRONT[0], FRONT[1], t))
    out.append(bike_frame(t))
    out.append(drivetrain(t))
    out.append(basket(t))
    return "".join(out)


def dust(t):
    out = []
    for i, (x, y, s, delay, dur) in enumerate([
        (214, 802, .8, 0.0, 1.3),
        (196, 816, 1.0, 0.45, 1.5),
        (230, 828, .7, 0.9, 1.2),
    ]):
        puffs = []
        for j, (dx, dy, r) in enumerate([(0, 0, 13), (-16, -8, 9), (8, -11, 7)]):
            puffs.append(f'<circle cx="{n(x+dx*s)}" cy="{n(y+dy*s)}" r="{n(r*s)}" fill="#e9d3a8" opacity=".9"/>')
        inner = "".join(puffs)
        if t is None:
            out.append(f'<g opacity="0"><animate attributeName="opacity" '
                       f'values="0;.85;0" keyTimes="0;.18;1" dur="{dur}s" begin="{delay}s" '
                       f'repeatCount="indefinite"/>'
                       f'<animateTransform attributeName="transform" type="translate" '
                       f'values="0,0;-58,-16" dur="{dur}s" begin="{delay}s" repeatCount="indefinite"/>'
                       f'{inner}</g>')
        else:
            k = ((t + delay) % dur) / dur
            op = max(0.0, 0.85 * (1 - k) if k > 0.18 else 0.0)
            out.append(f'<g opacity="{n(op)}" transform="translate({n(-58*k)},{n(-16*k)})">{inner}</g>')
    return "".join(out)


# ---------------------------------------------------------------- pelican ---
def feather_d(base, tip, w0, w1, bend=0.0, fill="none"):
    """Leaf-shaped feather from a wide base to a pointed tip."""
    v = norm((tip[0] - base[0], tip[1] - base[1]))
    p = perp(v, 1)
    ln = dist(base, tip)
    mx = (base[0] + tip[0]) / 2 + p[0] * bend * ln
    my = (base[1] + tip[1]) / 2 + p[1] * bend * ln
    b1 = (base[0] + p[0] * w0, base[1] + p[1] * w0)
    b2 = (base[0] - p[0] * w0, base[1] - p[1] * w0)
    c1 = (mx + p[0] * w1, my + p[1] * w1)
    c2 = (mx - p[0] * w1 * .75, my - p[1] * w1 * .75)
    return (f"M {n(b1[0])},{n(b1[1])} Q {n(c1[0])},{n(c1[1])} {n(tip[0])},{n(tip[1])} "
            f"Q {n(c2[0])},{n(c2[1])} {n(b2[0])},{n(b2[1])} Z")


def pelican_head():
    return f'''
  <path d="M 578,290 C 548,276 516,264 490,254 C 508,268 520,280 528,292
           C 506,288 486,288 470,292 C 490,300 506,306 518,312
           C 502,316 490,320 480,326 C 500,338 522,346 540,348 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 532,350 C 526,316 548,292 580,288 C 612,284 638,306 638,336
           C 638,364 616,382 586,382 C 560,382 540,370 532,350 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3.8" stroke-linejoin="round"/>
  <path d="M 544,364 C 560,378 588,382 608,372 C 594,384 564,386 546,372 Z"
        fill="{FEATHER_SHADE}" opacity=".85"/>
  <path d="M 562,296 C 580,289 604,293 618,305 C 602,301 582,301 564,305 Z"
        fill="#fffdf2" opacity=".9"/>
  <path d="M 582,298 C 592,292 604,294 612,302 C 602,300 592,300 584,304 Z"
        fill="{FEATHER_SHADE}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <circle cx="594" cy="320" r="12.5" fill="#f2b878"/>
  <circle cx="595" cy="320" r="7.4" fill="{INK}"/>
  <circle cx="597.5" cy="317" r="2.5" fill="#ffffff"/>
  <path d="M 584,332 C 592,337 602,336 608,330" fill="none" stroke="{INK}"
        stroke-width="2" stroke-linecap="round" opacity=".45"/>
  <path d="M 583,312 C 589,318 600,318 607,311 C 600,328 590,328 583,312 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="2" opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.80;.83;.87;.90;1"
             dur="5.4s" repeatCount="indefinite"/>
  </path>
  <path d="M 612,332 C 630,378 664,410 706,416 C 748,404 792,392 818,392
           C 772,366 706,348 664,340 C 644,336 626,334 612,332 Z"
        fill="{POUCH}" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M 634,352 C 654,380 676,400 704,408 C 728,400 752,388 768,374
           C 738,384 698,370 634,352 Z"
        fill="{POUCH_SHADE}" opacity=".4"/>
  <path d="M 676,372 C 686,388 694,402 700,410 M 700,370 C 706,384 710,394 714,404" fill="none" stroke="{POUCH_SHADE}" stroke-width="2" stroke-linecap="round" opacity=".4"/>
  <path d="M 652,344 C 666,366 680,388 690,404" fill="none" stroke="{BEAK_LIGHT}"
        stroke-width="2.6" stroke-linecap="round" opacity=".45"/>
  <path d="M 606,304 C 668,312 748,344 816,386 C 822,390 819,398 812,396
           C 752,372 682,344 610,330 C 602,322 600,310 606,304 Z"
        fill="{BEAK}" stroke="{INK}" stroke-width="3.6" stroke-linejoin="round"/>
  <path d="M 614,310 C 672,320 742,350 808,386" fill="none" stroke="{BEAK_LIGHT}"
        stroke-width="3.8" stroke-linecap="round" opacity=".9"/>
  <path d="M 620,326 C 680,336 744,362 804,388" fill="none" stroke="#b8611a"
        stroke-width="1.8" stroke-linecap="round" opacity=".3"/>
  <path d="M 802,376 C 814,382 822,388 814,397 C 806,394 800,386 796,378 Z"
        fill="{BEAK_DEEP}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <circle cx="616" cy="330" r="2.6" fill="{INK}"/>
  <path d="M 638,320 C 648,322 656,324 662,327" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>
  <path d="M 628,312 C 690,322 752,348 802,380" fill="none" stroke="#fff2cc"
        stroke-width="2" stroke-linecap="round" opacity=".45"/>
  <path d="M 598,342 C 604,354 612,364 624,370" fill="none" stroke="{POUCH_SHADE}"
        stroke-width="3" stroke-linecap="round" opacity=".55"/>
  <path d="M 612,333 C 672,344 746,364 818,393" fill="none" stroke="{INK}"
        stroke-width="2.2" stroke-linecap="round" opacity=".45"/>
'''


def pelican(t):
    out = ['<g class="pelican">']

    # tail feathers
    out.append(f'''
<g class="tail">
  <path d="M 372,490 C 336,480 306,462 288,440 C 314,440 342,450 364,464 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M 364,504 C 326,500 296,490 274,474 C 300,468 330,474 356,486 Z"
        fill="{FEATHER_SHADE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 368,518 C 338,522 308,520 284,510 C 304,500 332,500 358,504 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 372,530 C 348,538 322,540 300,534 C 318,524 342,518 364,518 Z"
        fill="{FEATHER_SHADE}" stroke="{INK}" stroke-width="2.8" stroke-linejoin="round"/>
  <path d="M 340,500 C 316,496 296,488 282,478" fill="none" stroke="#d9d0bf"
        stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
</g>''')

    # near leg over the frame, under the belly
    out.append(leg_group("near", t))

    # body
    out.append(f'''
<g class="body">
  <path d="M 356,506 C 348,458 376,410 434,397 C 484,386 514,414 516,460
           C 518,508 496,550 460,568 C 428,584 394,576 374,554
           C 360,538 356,522 356,506 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M 372,548 C 390,570 420,582 452,576 C 484,570 504,548 512,516
           C 506,548 482,568 452,572 C 420,576 392,566 372,548 Z"
        fill="{FEATHER_SHADE}"/>
  <path d="M 458,570 C 490,560 510,536 516,506 C 520,538 500,566 468,576 Z"
        fill="{FEATHER_COOL}" opacity=".75"/>
  <path d="M 366,486 C 370,452 392,420 428,404" fill="none" stroke="#fffdf2"
        stroke-width="6" stroke-linecap="round" opacity=".95"/>
  <path d="M 438,462 C 458,486 470,512 472,540 C 456,532 440,514 430,492
           C 424,480 428,470 438,462 Z" fill="{FEATHER_COOL}" opacity=".45"/>
  <path d="M 386,536 C 394,550 406,560 420,566" fill="none" stroke="#d8d0c1"
        stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
  <path d="M 400,548 C 406,558 416,564 426,568" fill="none" stroke="#d8d0c1"
        stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
  <path d="M 486,452 C 500,468 506,488 504,508" fill="none" stroke="#e0d8c8"
        stroke-width="3.6" stroke-linecap="round" opacity=".85"/>
  <path d="M 490,470 C 502,486 506,504 502,520" fill="none" stroke="#e0d8c8"
        stroke-width="3" stroke-linecap="round" opacity=".7"/>
</g>''')

    # folded wing panel: shaded, layered, black tips at the rear
    out.append(f'''
<g class="wing-panel">
  <path d="M 438,408 C 482,402 514,430 522,468 C 530,506 512,542 482,558
           C 470,548 458,540 446,536 C 456,528 464,516 468,502
           C 474,486 468,464 456,446 C 448,432 442,420 438,408 Z"
        fill="#ece5d6" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M 456,430 C 480,448 494,472 496,500" fill="none" stroke="#d6ccba"
        stroke-width="4.2" stroke-linecap="round"/>
  <path d="M 448,420 C 472,440 484,464 486,492" fill="none" stroke="#d6ccba"
        stroke-width="3.6" stroke-linecap="round" opacity=".85"/>
  <path d="M 468,498 C 480,512 490,526 492,540" fill="none" stroke="#d6ccba"
        stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <path d="M 446,536 C 432,548 414,556 394,558 C 406,544 422,536 436,532 Z"
        fill="{BLACK_FEATHER}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M 452,546 C 438,556 420,562 400,566 C 412,552 428,544 442,540 Z"
        fill="#3a3342" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 462,552 C 450,562 432,568 414,570 C 426,558 440,550 452,548 Z"
        fill="{BLACK_FEATHER}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 470,514 C 476,526 480,538 480,550" fill="none" stroke="#d6ccba"
        stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
</g>''')

    # neck
    out.append(f'''
<g class="neck">
  <path d="M 460,450 C 462,410 484,378 518,364 L 554,390
           C 530,404 512,430 506,460 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3.8" stroke-linejoin="round"/>
  <path d="M 472,444 C 476,414 492,392 514,378" fill="none" stroke="#efe8da"
        stroke-width="7" stroke-linecap="round" opacity=".9"/>
  <path d="M 498,446 C 500,424 508,404 522,390" fill="none" stroke="{FEATHER_SHADE}"
        stroke-width="4" stroke-linecap="round" opacity=".85"/>
  <path d="M 516,430 C 526,442 540,450 556,454" fill="none" stroke="{FEATHER_SHADE}"
        stroke-width="3" stroke-linecap="round" opacity=".7"/>
</g>''')

    # head + bill with a gentle sway
    if t is None:
        sway = (f'<animateTransform attributeName="transform" type="rotate" '
                f'values="0 545 378;1.3 545 378;0 545 378;-1 545 378;0 545 378" '
                f'keyTimes="0;.28;.5;.78;1" dur="6.4s" repeatCount="indefinite"/>')
        out.append(f'<g class="head">{sway}{pelican_head()}</g>')
    else:
        a = math.sin(t / 6.4 * math.tau) * 1.3
        out.append(f'<g class="head" transform="rotate({n(a)} 545 378)">{pelican_head()}</g>')

    # near wing, reaching forward to the handlebar
    out.append(f'''
<g class="wing">
  <path d="M 446,410 C 454,404 464,402 474,404 C 464,408 456,414 452,422 Z"
        fill="{FEATHER_SHADE}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 448,414 C 476,402 506,414 528,434 C 556,460 586,492 620,510
           C 632,516 638,526 632,534 C 618,540 596,530 572,512
           C 546,492 518,466 492,450 C 474,440 458,430 448,414 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="3.8" stroke-linejoin="round"/>
  <path d="M 462,428 C 488,432 514,452 538,476 C 562,500 588,520 612,528"
        fill="none" stroke="{FEATHER_SHADE}" stroke-width="8" stroke-linecap="round" opacity=".9"/>
  <path d="M 470,436 C 492,444 514,462 534,484" fill="none" stroke="#fffdf6"
        stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
  <path d="M 560,500 C 574,506 590,516 604,526 M 546,486 C 560,492 576,502 590,512"
        fill="none" stroke="#d9d1c2" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
  <!-- feather scallops along the trailing edge -->
  <path d="M 512,470 C 520,484 532,494 546,498 C 536,488 530,478 528,468 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 558,502 C 566,514 578,522 592,526 C 582,516 576,506 574,496 Z"
        fill="{FEATHER}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M 604,512 C 616,514 626,520 633,526 C 621,531 610,527 601,520 Z"
        fill="#f7f0e2" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 610,508 C 626,510 642,518 654,530 C 648,537 634,535 622,528
           C 616,524 610,515 610,508 Z"
        fill="{BLACK_FEATHER}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M 614,518 C 630,522 644,530 654,540 C 648,547 634,545 622,538
           C 616,534 613,525 614,518 Z"
        fill="#3b3342" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M 616,528 C 630,534 642,542 650,550 C 642,556 630,553 620,546
           C 615,542 614,533 616,528 Z"
        fill="{BLACK_FEATHER}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
</g>''')

    # scarf
    out.append(f'''
<g class="scarf">
  <path d="M 500,364 C 514,354 536,354 552,364 L 550,384 C 534,392 512,392 500,384 Z"
        fill="{SCARF}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 502,374 C 518,366 536,366 550,374" fill="none" stroke="{SCARF_LIGHT}"
        stroke-width="3" opacity=".9"/>
  <g class="scarf-tail-a">
    <path d="M 504,370 C 470,372 430,366 398,346 C 408,332 428,332 450,344
             C 474,356 494,362 510,364 Z"
          fill="{SCARF}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 466,352 L 458,338 M 486,360 L 478,346 M 442,340 L 434,330"
          stroke="{SCARF_LIGHT}" stroke-width="3" opacity=".95"/>
    <path d="M 406,342 C 398,338 392,334 388,328 C 396,332 404,334 412,336 Z"
          fill="{SCARF_DARK}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>
  </g>
  <g class="scarf-tail-b">
    <path d="M 506,388 C 484,396 458,398 434,390 C 450,380 476,376 496,378
             C 504,380 510,384 506,388 Z"
          fill="{SCARF_DARK}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 462,390 L 454,400 M 480,384 L 472,394" stroke="{SCARF_LIGHT}"
          stroke-width="2.8" opacity=".9"/>
  </g>
</g>''')
    out.append('</g>')

    if t is None:
        out = [x.replace('<g class="scarf-tail-a">',
                         '<g class="scarf-tail-a"><animateTransform attributeName="transform" type="rotate" '
                         'values="0 510 366;4 510 366;-3 510 366;2 510 366;0 510 366" '
                         'keyTimes="0;.25;.5;.75;1" dur="1.1s" repeatCount="indefinite"/>')
               .replace('<g class="scarf-tail-b">',
                        '<g class="scarf-tail-b"><animateTransform attributeName="transform" type="rotate" '
                        'values="0 508 384;-5 508 384;4 508 384;-2 508 384;0 508 384" '
                        'keyTimes="0;.25;.5;.75;1" dur="1.35s" repeatCount="indefinite"/>')
               for x in out]
    return "".join(out)


def pelican_motion(t):
    """Wrap the pelican so the scarf tails, head sway and body breathe.

    The static frame mode leaves the rider at its base pose except for the
    legs; this wrapper only emits SMIL in animated mode.
    """
    return pelican(t)


# ------------------------------------------------------------------ scene ---
def scene(t=None):
    global rng
    rng = random.Random(11)
    parts = [
        sky(),
        sun(),
        clouds(t),
        gulls(t),
        headland(t),
        right_town(t),
        sea(t),
        railing(t),
        sand(t),
        bench(112, 708, 0.86, t),
        leg_group("far", t),
        bike(t),
        pelican(t),
    ]
    return "".join(parts)


def svg(t=None, title="Pelican on a Bicycle"):
    body = scene(t)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">
<title id="t">{title}</title>
<desc id="d">A white pelican with an orange bill rides a teal seaside bicycle along a promenade, a basket of fish on the handlebars.</desc>
{body}
</svg>
'''


PAGE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pelican on a Bicycle</title>
<style>
  html, body {{
    margin: 0;
    min-height: 100%;
    background: radial-gradient(120% 100% at 50% 0%, #fbf4e6 0%, #f0e4cf 55%, #e2d2b6 100%);
  }}
  body {{
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    box-sizing: border-box;
  }}
  .frame {{
    width: min(1200px, 100%);
    aspect-ratio: 4 / 3;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 30px 60px -30px rgba(58, 37, 30, .55), 0 2px 0 rgba(255,255,255,.6) inset;
  }}
  svg {{ display: block; width: 100%; height: 100%; }}
</style>
</head>
<body>
<div class="frame">
{svg}
</div>
</body>
</html>
'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    ap.add_argument("--html", default=None)
    ap.add_argument("--frame", type=float, default=None, help="render a static frame at this time (s)")
    ap.add_argument("--png", default=None)
    args = ap.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)

    if args.frame is not None:
        s = svg(args.frame)
        if args.png:
            import resvg_py
            png = resvg_py.svg_to_bytes(svg_string=s, width=W, height=H)
            with open(args.png, "wb") as f:
                f.write(png)
            print("wrote", args.png)
        else:
            print(s)
        return

    s = svg(None)
    out_svg = args.out or os.path.join(root, "pelican.svg")
    out_html = args.html or os.path.join(root, "index.html")
    with open(out_svg, "w", encoding="utf-8") as f:
        f.write(s)
    with open(out_html, "w", encoding="utf-8") as f:
        f.write(PAGE.format(svg=s))
    print("wrote", out_svg, os.path.getsize(out_svg), "bytes")
    print("wrote", out_html, os.path.getsize(out_html), "bytes")


if __name__ == "__main__":
    main()
