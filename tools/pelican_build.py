"""Pelican on a bicycle -- pure SVG + HTML, no libraries, no raster.

Geometry note
-------------
SVG's rotate(a) maps (x, y) -> (x cos a - y sin a, x sin a + y cos a), i.e. it
turns +x toward +y, which on screen (y down) is *clockwise*.  A bone drawn from
the origin straight down (0,0)->(0,L) therefore points at angle
`atan2(-dx, dy)` after rotate().  Both the leg solver and the crank/pedal code
use exactly that convention so the feet land on the pedals.

Motion note
-----------
Every moving part is driven by SMIL <animate>/<animateTransform> with *explicit*
rotation centres, so a viewer that ignores SMIL still shows a correct, static
pose (the `transform` attribute holds the t=0 frame).  Cranks and pedals share
one phase function; legs are solved by inverse kinematics at 48 samples per
revolution and stepped from the same phase, so they cannot drift apart.
"""
import math, os

W, H = 900, 1280

# ---------- palette ----------
INK      = "#241726"
RED      = "#e85648"
RED_DK   = "#c8443a"
CREAM    = "#fdf8ec"
CREAM_2  = "#fbf2df"
SAND     = "#e9dcc1"
BILL     = "#f7bb41"
BILL_DK  = "#e08a2c"
POUCH    = "#f2a04b"
LEG_N    = "#f8c78f"
LEG_F    = "#dda76c"
SADDLE   = "#6b4226"
GRIP     = "#B4713F"

# ---------- bike layout ----------
RH, FH   = (286, 974), (642, 974)      # hubs
WR       = 104                          # wheel radius
BB       = (474, 996)                   # bottom bracket
CRANK    = 40
CHAINR   = 29
SEAT_TOP = (428, 836)
HT_TOP   = (556, 800)                   # head tube top
HIP      = (400, 806)
L1, L2   = 96, 144                      # thigh, tarsus (sized to the saddle height)
PHASE0   = -86.0                        # crank angle at t=0 (deg)
TA_MIN, TA_MAX = -150.0, -20.0          # sanity guard only; IK should stay inside
CRANKDUR = 1.5                          # s per crank revolution
WHEELDUR = 0.75

T = float(os.environ.get("POSE_T", "0.0"))   # bake an arbitrary crank phase for stills

def add(a, b): return (a[0] + b[0], a[1] + b[1])
def sub(a, b): return (a[0] - b[0], a[1] - b[1])
def mul(a, k): return (a[0] * k, a[1] * k)
def fmt(v):
    s = "%.1f" % v
    return s[:-2] if s.endswith(".0") else s

def pedal_pos(ph, near):
    a = ph + (0.0 if near else math.pi)
    return (BB[0] + CRANK * math.cos(a), BB[1] + CRANK * math.sin(a))

def leg_solve(ph, near=True):
    """Two-bone leg aimed at the pedal, but with the thigh kept in a natural range.

    A plain IK solution folds the knee *above* the hip whenever the pedal is close
    (ta < -110 deg), which reads as a broken leg. So the thigh angle is clamped and
    the thin tarsus is allowed to telescope instead; the foot still lands exactly on
    the pedal, because the shin vector is recomputed from the clamped knee.

    Returns (thigh angle, shin angle relative to thigh, ankle counter-rotation,
             shin stretch factor).
    """
    p = pedal_pos(ph, near)
    foot = (p[0], p[1] - 10.0)
    d = sub(foot, HIP)
    L = math.hypot(*d) or 1.0
    u = (d[0] / L, d[1] / L)
    a = (L1 * L1 - L2 * L2 + min(L, L1 + L2 - 1) ** 2) / (2 * min(L, L1 + L2 - 1))
    h = math.sqrt(max(0.0, L1 * L1 - a * a))
    perp = (-u[1], u[0])
    mid = add(HIP, mul(u, a))
    k1 = add(mid, mul(perp, h))
    k2 = add(mid, mul(perp, -h))
    knee = k1 if k1[0] > k2[0] else k2
    ta = math.degrees(math.atan2(-(knee[0] - HIP[0]), knee[1] - HIP[1]))
    ta = max(TA_MIN, min(TA_MAX, ta))
    knee = (HIP[0] - L1 * math.sin(math.radians(ta)), HIP[1] + L1 * math.cos(math.radians(ta)))
    dx, dy = foot[0] - knee[0], foot[1] - knee[1]
    shin = math.hypot(dx, dy) or 1.0
    wa = math.degrees(math.atan2(-dx, dy))
    return ta, wa - ta, -wa, shin / L2

def _check_cranks():
    """Pedals must sit exactly on the crank-arm ends, both sides, all phases."""
    worst = 0.0
    for i in range(72):
        ph = math.radians(PHASE0) + 2 * math.pi * i / 72
        for near, sign in ((True, 1), (False, -1)):
            ax = BB[0] + sign * CRANK * math.cos(ph)
            ay = BB[1] + sign * CRANK * math.sin(ph)
            px, py = pedal_pos(ph, near)
            worst = max(worst, math.hypot(ax - px, ay - py))
    return worst

def _check_ik():
    """Foot must land on the pedal, and the leg must not over-reach."""
    worst, reach = 0.0, []
    for i in range(360):
        ph = 2 * math.pi * i / 360
        for near in (True, False):
            ta, sa, an, sc = leg_solve(ph, near)
            # rotate(ta) maps the bone (0,0)->(0,L1) to (-L1 sin ta, L1 cos ta)
            kx = HIP[0] - L1 * math.sin(math.radians(ta))
            ky = HIP[1] + L1 * math.cos(math.radians(ta))
            w = math.radians(ta + sa)
            fx = kx - L2 * sc * math.sin(w)
            fy = ky + L2 * sc * math.cos(w)
            px, py = pedal_pos(ph, near)
            worst = max(worst, math.hypot(fx - px, fy - (py - 10.0)))
            reach.append(math.hypot(px - HIP[0], py - HIP[1]))
    return worst

print("crank/pedal worst error (px): %.4f" % _check_cranks())
print("IK foot worst error (px):     %.4f" % _check_ik())
_ped = [math.hypot(pedal_pos(2*math.pi*i/360,True)[0]-HIP[0], pedal_pos(2*math.pi*i/360,True)[1]-HIP[1]) for i in range(360)]
print("pedal distance from hip: %.1f .. %.1f  (leg reach %.1f)" % (min(_ped), max(_ped), L1+L2))

# =====================================================================
#  helpers
# =====================================================================
def arc(cx, cy, r, a0, a1, n=24):
    pts = [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
            cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    d = "M %s %s" % (fmt(pts[0][0]), fmt(pts[0][1]))
    for x, y in pts[1:]:
        d += " L %s %s" % (fmt(x), fmt(y))
    return d

def smooth(pts, close=False):
    """Catmull-Rom -> cubic bezier, for organic outlines."""
    p = list(pts)
    if close:
        p = [p[-1]] + p + [p[0], p[1]]
        seg = range(1, len(p) - 2)
    else:
        p = [p[0]] + p + [p[-1]]
        seg = range(1, len(p) - 2)
    d = "M %s %s" % (fmt(p[1][0]), fmt(p[1][1]))
    for i in seg:
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d += " C %s %s %s %s %s %s" % (fmt(c1[0]), fmt(c1[1]), fmt(c2[0]), fmt(c2[1]),
                                       fmt(p2[0]), fmt(p2[1]))
    if close:
        d += " Z"
    return d

def keyframes(values, dur, attr="transform", extra=""):
    """SMIL values= for a repeating cycle. values: list of formatted strings."""
    return ('<animateTransform attributeName="transform" type="%s" values="%s" '
            'dur="%ss" repeatCount="indefinite" calcMode="linear" %s/>'
            % (attr, ";".join(values), fmt(dur), extra))

def rot_values(fn, n, close=True):
    """Sample a rotate() function over one cycle into SMIL values."""
    out = [fn(2 * math.pi * i / n) for i in range(n)]
    if close:
        out.append(out[0])
    return out

# =====================================================================
#  background
# =====================================================================
def background():
    o = ['<g id="bg">']
    o.append('<defs>'
             '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
             '<stop offset="0" stop-color="#3b7fd4"/><stop offset=".62" stop-color="#a9d8f7"/>'
             '<stop offset="1" stop-color="#fdeacb"/></linearGradient>'
             '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">'
             '<stop offset="0" stop-color="#c8ecf2"/><stop offset=".45" stop-color="#63b7d4"/>'
             '<stop offset="1" stop-color="#1f6484"/></linearGradient>'
             '<linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">'
             '<stop offset="0" stop-color="#f7d7a6"/><stop offset=".55" stop-color="#e9bd86"/>'
             '<stop offset="1" stop-color="#cf9a63"/></linearGradient>'
             '<radialGradient id="sunGlow"><stop offset="0" stop-color="#fff6c4" stop-opacity=".95"/>'
             '<stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></radialGradient>'
             '</defs>')
    o.append('<rect width="%d" height="%d" fill="url(#sky)"/>' % (W, H))

    # sun with a slow pulse + rays
    o.append('<g class="sun">')
    o.append('<circle cx="700" cy="264" r="150" fill="url(#sunGlow)">'
             '<animate attributeName="r" values="150;160;150" dur="4.8s" repeatCount="indefinite"/></circle>')
    o.append('<circle cx="700" cy="264" r="62" fill="#ffe08a"/>')
    o.append('<circle cx="700" cy="264" r="50" fill="#ffd166"/>')
    o.append('<g stroke="#ffe08a" stroke-width="7" stroke-linecap="round" opacity=".85">')
    for k in range(12):
        a = math.radians(k * 30 + 8)
        r0, r1 = 78, 100
        o.append('<line x1="%s" y1="%s" x2="%s" y2="%s"/>' % (
            fmt(700 + r0 * math.cos(a)), fmt(264 + r0 * math.sin(a)),
            fmt(700 + r1 * math.cos(a)), fmt(264 + r1 * math.sin(a))))
    o.append('</g></g></g>')

    # clouds, drifting
    def cloud(x, y, s, op, dur):
        shape = ('M 0 0 c 14 -26 56 -30 70 -8 c 16 -26 62 -22 70 4 c 26 -4 42 12 42 26 '
                 'c 0 16 -16 24 -34 24 l -140 0 c -20 0 -32 -12 -30 -26 c 2 -12 12 -20 22 -20 z')
        return ('<g opacity="%s" transform="translate(%s,%s)">'
                '<g transform="scale(%s)">'
                '<animateTransform attributeName="transform" type="translate" '
                'values="0 0;%s 0;0 0" additive="sum" dur="%ss" repeatCount="indefinite"/>'
                '<path d="%s" fill="#fdf8ec" stroke="#dceaf7" stroke-width="3"/>'
                '</g></g>'
                % (op, fmt(x), fmt(y), s, fmt(W * 0.35 / s), dur, shape))
    o.append(cloud(60, 96, 1.0, .95, 150))
    o.append(cloud(-40, 250, .72, .8, 190))
    o.append(cloud(520, 82, 1.12, .96, 130))
    o.append(cloud(300, 300, .58, .7, 210))

    # gulls
    def gull(x, y, s=1.0, dur=6.4):
        return ('<g transform="translate(%s,%s) scale(%s)"><g>'
                '<animateTransform attributeName="transform" type="translate" '
                'values="0 0;16 -11;0 0" dur="%ss" repeatCount="indefinite"/>'
                '<path d="M -16 0 q 8 -9 16 0 q 8 -9 16 0" fill="none" stroke="#4a4450" '
                'stroke-width="3.4" stroke-linecap="round"/></g></g>' % (fmt(x), fmt(y), s, dur))
    o.append(gull(268, 300, .9, 7.1))
    o.append(gull(392, 232, .7, 5.6))
    o.append(gull(596, 176, .55, 8.2))

    # sea
    o.append('<rect x="0" y="880" width="%d" height="%d" fill="url(#sea)"/>' % (W, H - 880))
    o.append('<rect x="0" y="880" width="%d" height="4" fill="#eaf7fb" opacity=".8"/>' % W)
    # wave dashes, rolling
    for i, (yy, w_, op, dur) in enumerate([(912, 74, .75, 3.2), (948, 54, .5, 4.6),
                                           (986, 86, .55, 3.8), (832, 62, .35, 5.4)]):
        o.append('<line x1="%d" y1="%s" x2="%d" y2="%s" stroke="#eaf7fb" stroke-width="5" '
                 'stroke-linecap="round" stroke-dasharray="26 34" opacity="%s">'
                 '<animate attributeName="stroke-dashoffset" values="0;-120" dur="%ss" '
                 'repeatCount="indefinite"/></line>' % (-60 + i * 40, fmt(yy), W + 60, fmt(yy), op, dur))
    # horizon glints
    o.append('<g fill="#ffffff" opacity=".5">')
    for k in range(9):
        xx = 110 + k * 88
        o.append('<rect x="%d" y="%s" width="%d" height="3.4" rx="1.7">'
                 '<animate attributeName="opacity" values=".2;.85;.2" dur="%ss" '
                 'repeatCount="indefinite"/></rect>' % (xx, fmt(896 + (k % 3) * 9), 34 + (k % 4) * 12,
                                                        2.4 + (k % 5) * 0.4))
    o.append('</g>')

    # far headland with a lighthouse
    o.append('<path d="M 0 880 L 0 812 Q 90 748 196 806 Q 240 830 252 880 Z" fill="#7fb87a"/>')
    o.append('<path d="M 0 880 L 0 848 Q 80 806 168 848 Q 206 866 214 880 Z" fill="#6aa86a" opacity=".8"/>')
    o.append('<path d="M 700 880 L 700 812 Q 790 744 900 800 L 900 880 Z" fill="#7fb87a"/>')
    o.append('<path d="M 720 880 L 726 826 Q 792 786 900 822 L 900 880 Z" fill="#6aa86a" opacity=".75"/>')
    # lighthouse
    o.append('<g transform="translate(816,806)">'
             '<path d="M -22 0 L -15 -96 L 15 -96 L 22 0 Z" fill="#fdf8ec" stroke="%s" stroke-width="4"/>'
             '<path d="M -19 -20 L 19 -20 L 21 -4 L -21 -4 Z" fill="%s"/>'
             '<path d="M -17 -58 L 17 -58 L 19 -42 L -19 -42 Z" fill="%s"/>'
             '<rect x="-17" y="-108" width="34" height="13" rx="3" fill="#3c4654" stroke="%s" stroke-width="3.4"/>'
             '<circle cx="0" cy="-100" r="7" fill="#ffd166" stroke="%s" stroke-width="3"/>'
             '<path d="M -14 -108 L 0 -128 L 14 -108 Z" fill="#e85648" stroke="%s" stroke-width="3.4"/>'
             '<g opacity=".5"><path d="M 8 -101 L 96 -128 L 96 -74 Z" fill="#fff3b0">'
             '<animateTransform attributeName="transform" type="rotate" '
             'values="0 0 -100;14 0 -100;0 0 -100;-14 0 -100;0 0 -100" dur="12s" repeatCount="indefinite"/>'
             '</path></g></g>' % (INK, RED, RED, INK, INK, INK))

    # little sailboat
    o.append('<g transform="translate(140,880) scale(.9)"><g>'
             '<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" '
             'dur="5.8s" repeatCount="indefinite"/>'
             '<path d="M -30 0 L 30 0 L 20 14 L -20 14 Z" fill="#fdf8ec" stroke="%s" stroke-width="3.6"/>'
             '<path d="M 0 -4 L 0 -44" stroke="%s" stroke-width="3.4"/>'
             '<path d="M 2 -42 L 26 -8 L 2 -8 Z" fill="#e85648" stroke="%s" stroke-width="3"/>'
             '<path d="M -2 -38 L -22 -10 L -2 -10 Z" fill="#f7d7a6" stroke="%s" stroke-width="3"/>'
             '</g></g>' % (INK, INK, INK, INK))

    # promenade kerb + grass tufts
    o.append('<rect x="0" y="1032" width="%d" height="26" fill="#f2e6cd"/>' % W)
    o.append('<rect x="0" y="1032" width="%d" height="5" fill="#fffaf0"/>' % W)
    o.append('<path d="M 0 1058 L %d 1058" stroke="#cdbb9c" stroke-width="3"/>' % W)
    for k in range(16):
        xx = 24 + k * 58
        hgt = 26 + (k * 37) % 22
        o.append('<g transform="translate(%d,1058)"><g>' % xx)
        o.append('<animateTransform attributeName="transform" type="rotate" '
                 'values="-3 0 0;3.4 0 0;-3 0 0" dur="%ss" repeatCount="indefinite"/>' % fmt(3.0 + (k % 5) * 0.35))
        o.append('<path d="M 0 0 q -5 -%d -12 -%d M 0 0 q 0 -%d 4 -%d M 0 0 q 7 -%d 14 -%d" '
                 'fill="none" stroke="#4f9b4a" stroke-width="4.6" stroke-linecap="round"/>'
                 % (hgt, hgt + 6, hgt + 10, hgt + 12, hgt - 4, hgt + 2))
        o.append('</g></g>')

    # deck
    o.append('<rect x="0" y="1058" width="%d" height="%d" fill="url(#deck)"/>' % (W, H - 1058))
    for k in range(9):
        yy = 1072 + k * 26
        o.append('<path d="M 0 %d L %d %d" stroke="#c69a68" stroke-width="2.4" opacity=".55"/>' % (yy, W, yy + 3))
    o.append('<g fill="#b08050" opacity=".5">')
    for k in range(14):
        o.append('<circle cx="%d" cy="%d" r="2.6"/>' % (40 + (k * 137) % 820, 1084 + (k * 61) % 170))
    o.append('</g>')

    # flowers
    for k, (fx_, fy_, col) in enumerate([(742, 1176, "#e85648"), (772, 1200, "#f7bb41"),
                                        (806, 1170, "#e85648"), (782, 1146, "#fdf8ec")]):
        o.append('<g transform="translate(%d,%d)">' % (fx_, fy_ - 26))
        o.append('<g><animateTransform attributeName="transform" type="rotate" '
                 'values="-4 0 26;5 0 26;-4 0 26" dur="%ss" repeatCount="indefinite"/>' % fmt(2.8 + k * 0.4))
        o.append('<path d="M 0 26 L 0 0" stroke="#4f9b4a" stroke-width="4" stroke-linecap="round"/>')
        o.append('<path d="M 0 18 q -9 -4 -10 -12" fill="none" stroke="#4f9b4a" stroke-width="3.4" stroke-linecap="round"/>')
        for a in range(5):
            ang = math.radians(a * 72)
            o.append('<circle cx="%s" cy="%s" r="6.4" fill="%s"/>' % (
                fmt(7.5 * math.cos(ang)), fmt(7.5 * math.sin(ang)), col))
        o.append('<circle cx="0" cy="0" r="4.2" fill="#f7bb41"/>')
        o.append('</g></g>')

    # the crab
    o.append('<g transform="translate(140,1170) scale(1.15)"><g>')
    o.append('<animateTransform attributeName="transform" type="translate" '
             'values="0 0;-18 -2;-32 1;-14 3;0 0" dur="7s" repeatCount="indefinite"/>')
    o.append('<g stroke="%s" stroke-width="4" stroke-linecap="round" fill="none">' % INK)
    for sx in (-1, 1):
        for k in range(3):
            o.append('<path d="M %d 4 q %d 12 %d 18"/>' % (sx * (14 + k * 3), sx * 10, sx * (18 + k * 4)))
    o.append('</g>')
    o.append('<path d="M -26 -6 Q -26 -26 0 -26 Q 26 -26 26 -6 Q 26 14 0 14 Q -26 14 -26 -6 Z" '
             'fill="#e85648" stroke="%s" stroke-width="4.4"/>' % INK)
    o.append('<path d="M -14 -2 q 10 -6 20 -1" fill="none" stroke="#b8402f" stroke-width="3" stroke-linecap="round"/>')
    for sx in (-1, 1):
        o.append('<circle cx="%d" cy="-16" r="7" fill="#fdf8ec" stroke="%s" stroke-width="2.6"/>' % (sx * 9, INK))
        o.append('<circle cx="%d" cy="-16" r="3.2" fill="%s"/>' % (sx * 9, INK))
    # claws
    for sx in (-1, 1):
        o.append('<g transform="translate(%d,-20)">' % (sx * 26))
        o.append('<animateTransform attributeName="transform" type="rotate" '
                 'values="0 0 0;%d 0 0;7 0 0;0 0 0" dur="3.4s" repeatCount="indefinite"/>' % (sx * -26))
        o.append('<path d="M 0 0 q %d -6 %d -16 q %d 2 %d -6 q %d 6 %d 4 q %d 12 %d 18 Z" '
                 'fill="#f2665a" stroke="%s" stroke-width="3.6" stroke-linejoin="round"/>'
                 % (sx * 8, sx * 16, sx * 6, sx * 8, sx * 4, sx * 2, sx * -8, sx * -10, INK))
        o.append('</g>')
    o.append('</g></g>')

    # shells
    o.append('<path d="M 820 1218 q 22 -20 44 0 q -22 14 -44 0 Z" fill="#f6e3c8" '
             'stroke="%s" stroke-width="3.4"/>' % INK)
    return "".join(o)
print("bg ok")

# =====================================================================
# =====================================================================
def wheel(cx, cy, phase=0.0):
    o = ['<g>']
    o.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="#33262c" stroke-width="19"/>'
             % (cx, cy, WR))
    o.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="#f4e4c6" stroke-width="6"/>'
             % (cx, cy, WR - 10))
    o.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="3.2" opacity=".55"/>'
             % (cx, cy, WR - 18, INK))
    o.append('<g>')
    o.append('<animateTransform attributeName="transform" type="rotate" '
             'from="0 %d %d" to="360 %d %d" dur="%ss" repeatCount="indefinite"/>'
             % (cx, cy, cx, cy, fmt(WHEELDUR)))
    for k in range(16):
        a = 2 * math.pi * k / 16
        o.append('<line x1="%d" y1="%d" x2="%s" y2="%s" stroke="#8a7462" stroke-width="2.1"/>'
                 % (cx, cy, fmt(cx + (WR - 20) * math.cos(a)), fmt(cy + (WR - 20) * math.sin(a))))
    for k in (2, 7, 11):
        a = 2 * math.pi * k / 16 + .18
        o.append('<line x1="%d" y1="%d" x2="%s" y2="%s" stroke="#5f4c42" stroke-width="3.8"/>'
                 % (cx, cy, fmt(cx + (WR - 21) * math.cos(a)), fmt(cy + (WR - 21) * math.sin(a))))
    # valve, hub, reflector
    o.append('<rect x="%s" y="%s" width="15" height="8" rx="3.4" fill="#f4e4c6" stroke="%s" stroke-width="2.2"/>'
             % (fmt(cx - 7.5), fmt(cy + WR - 20), INK))
    o.append('<circle cx="%d" cy="%d" r="15" fill="#f2e6d2" stroke="%s" stroke-width="4.4"/>' % (cx, cy, INK))
    o.append('<circle cx="%d" cy="%d" r="5" fill="%s"/>' % (cx, cy, INK))
    o.append('<circle cx="%s" cy="%s" r="5" fill="#ffd166" stroke="%s" stroke-width="2"/>'
             % (fmt(cx + 52), fmt(cy - 40), INK))
    o.append('</g></g>')
    return "".join(o)

def chain_line():
    o = ['<g fill="none" stroke="#4a4450" stroke-width="2" stroke-dasharray="6 4">']
    o.append('<path d="M %d %d L %d %d"/>' % (BB[0], BB[1] - CHAINR, RH[0], RH[1] - 15))
    o.append('<path d="M %d %d L %d %d"/>' % (BB[0], BB[1] + CHAINR, RH[0], RH[1] + 15))
    o.append('<animate attributeName="stroke-dashoffset" values="0;-40" dur=".6s" repeatCount="indefinite"/>')
    o.append('</g>')
    o.append('<circle cx="%d" cy="%d" r="15" fill="none" stroke="#b8bfc9" stroke-width="4"/>' % (RH[0], RH[1]))
    return "".join(o)

def crank(near):
    """Both arms are drawn toward BB + CRANK*cos/sin and animate through the same
    phase, so each pedal sits on its own arm at every instant."""
    ph = PHASE0 + 360 * T
    col = "#d7dbe2" if near else "#8d949c"
    o = ['<g>']
    # Both arms turn the same way. The far arm is *drawn* on the -x side, so it is
    # already 180 deg opposite the near one; spinning it backwards would mirror it.
    o.append('<animateTransform attributeName="transform" type="rotate" from="%s %d %d" '
             'to="%s %d %d" dur="%ss" repeatCount="indefinite"/>'
             % (fmt(PHASE0 + 360 * T), BB[0], BB[1], fmt(PHASE0 + 360 * T + 360),
                BB[0], BB[1], fmt(CRANKDUR)))
    if near:
        o.append('<circle cx="%d" cy="%d" r="%d" fill="#e7dcc8" stroke="%s" stroke-width="4.4"/>'
                 % (BB[0], BB[1], CHAINR, INK))
        o.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="#c9ccd6" stroke-width="4"/>'
                 % (BB[0], BB[1], CHAINR - 6))
        for k in range(22):
            a = 2 * math.pi * k / 22
            o.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="3"/>' % (
                fmt(BB[0] + CHAINR * math.cos(a)), fmt(BB[1] + CHAINR * math.sin(a)),
                fmt(BB[0] + (CHAINR + 6) * math.cos(a)), fmt(BB[1] + (CHAINR + 6) * math.sin(a)), INK))
        for k in range(5):
            a = 2 * math.pi * k / 5 + .3
            o.append('<circle cx="%s" cy="%s" r="3.4" fill="%s"/>'
                     % (fmt(BB[0] + 19 * math.cos(a)), fmt(BB[1] + 19 * math.sin(a)), INK))
    s = 1 if near else -1
    o.append('<line x1="%d" y1="%d" x2="%s" y2="%s" stroke="%s" stroke-width="%s" stroke-linecap="round"/>'
             % (BB[0], BB[1], fmt(BB[0] + s * CRANK), BB[1], col, "8.5" if near else "8"))
    o.append('<circle cx="%s" cy="%d" r="%s" fill="%s" stroke="%s" stroke-width="2.6"/>'
             % (fmt(BB[0] + s * CRANK), BB[1], "5.5" if near else "5", col, INK))
    if near:
        o.append('<circle cx="%d" cy="%d" r="11" fill="#b8bfc9" stroke="%s" stroke-width="3.4"/>' % (BB[0], BB[1], INK))
        o.append('<circle cx="%d" cy="%d" r="4" fill="%s"/>' % (BB[0], BB[1], INK))
    o.append('</g>')
    return "".join(o)

def pedal(near):
    """Pedal platform, translated around the crank circle.
    Values start at the baked phase and run one full revolution, so the static
    transform attribute, the first SMIL value and the crank's angle all agree."""
    ph0 = math.radians(PHASE0) + 2 * math.pi * T
    n = 96
    pts = []
    for i in range(n + 1):
        px, py = pedal_pos(ph0 + 2 * math.pi * i / n, near)
        pts.append("%s %s" % (fmt(px), fmt(py)))
    x0, y0 = pedal_pos(ph0, near)
    o = ['<g transform="translate(%s,%s)">' % (fmt(x0), fmt(y0))]
    o.append('<animateTransform attributeName="transform" type="translate" values="%s" dur="%ss" '
             'repeatCount="indefinite"/>' % (";".join(pts), fmt(CRANKDUR)))
    col = "#4a4e59" if near else "#3a3d47"
    o.append('<rect x="-19" y="-4.5" width="38" height="9" rx="3" fill="%s" stroke="%s" stroke-width="3.2"/>' % (col, INK))
    o.append('<rect x="-13" y="-1.6" width="26" height="3" rx="1.5" fill="#9aa3ad" opacity="%s"/>'
             % ("0.9" if near else "0.5"))
    o.append('</g>')
    return "".join(o)


def frame_group():
    """Diamond frame + bars + saddle. All drawn in one go so overlaps stay tidy."""
    segs = [((428, 822), (556, 800)),   # top tube
            ((556, 800), (470, 984)),   # down tube
            ((432, 828), (474, 996)),   # seat tube
            ((556, 800), (598, 900)),   # head tube
            ((598, 900), (642, 974)),   # fork
            ((474, 996), (286, 974)),   # chain stay
            ((424, 840), (286, 974))]   # seat stay
    o = []
    for (a, b) in segs:
        o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="22" stroke-linecap="round"/>'
                 % (a[0], a[1], b[0], b[1], INK))
    for (a, b) in segs:
        o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="14" stroke-linecap="round"/>'
                 % (a[0], a[1], b[0], b[1], RED))
    # highlights along the top of each tube
    for (a, b) in segs:
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L * 4.2, dx / L * 4.2
        o.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="#f9866f" stroke-width="4" '
                 'stroke-linecap="round" opacity=".85"/>'
                 % (fmt(a[0] - nx), fmt(a[1] - ny), fmt(b[0] - nx), fmt(b[1] - ny)))
    # painted details
    o.append('<line x1="538" y1="823" x2="476" y2="955" stroke="#f4ead8" stroke-width="6" '
             'stroke-linecap="round" opacity=".92"/>')
    o.append('<line x1="440" y1="862" x2="470" y2="962" stroke="#f4ead8" stroke-width="5" '
             'stroke-linecap="round" opacity=".9"/>')
    o.append('<circle cx="%d" cy="%d" r="11.5" fill="#c9ccd6" stroke="%s" stroke-width="3.4"/>'
             % (BB[0] - 4, BB[1] - 6, INK))
    # saddle
    o.append('<path d="M 440 820 l 2 -14" stroke="#c9ccd6" stroke-width="9" stroke-linecap="round"/>')
    o.append('<path d="M 398 830 C 418 812 456 810 466 820 C 450 836 408 842 398 830 Z" '
             'fill="%s" stroke="%s" stroke-width="4.4"/>' % (SADDLE, INK))
    o.append('<path d="M 406 827 q 14 -7 34 -7" fill="none" stroke="#a06d3f" stroke-width="3.2" '
             'stroke-linecap="round"/>')
    o.append('<circle cx="402" cy="827" r="2.6" fill="#3a2a20"/><circle cx="414" cy="831" r="2.6" fill="#3a2a20"/>')
    return "".join(o)

def bars_group():
    px, py = HT_TOP
    stem = 'M %d %d L %d %d C %d %d %d %d %d %d' % (px, py + 8, px + 6, py - 34,
                                                    px + 8, py - 64, px + 30, py - 76, px + 54, py - 72)
    sweep = 'M %d %d C %d %d %d %d %d %d' % (px + 8, py - 40, px - 24, py - 82,
                                             px - 58, py - 52, px - 52, py - 16)
    o = []
    for d in (stem, sweep):
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="16" stroke-linecap="round"/>' % (d, INK))
        o.append('<path d="%s" fill="none" stroke="#cfd4dc" stroke-width="9.5" stroke-linecap="round"/>' % d)
        o.append('<path d="%s" fill="none" stroke="#fbfdff" stroke-width="3.2" stroke-linecap="round" '
                 'opacity=".85"/>' % d)
    o.append('<rect x="%d" y="%d" width="30" height="16" rx="8" transform="rotate(-46 %d %d)" '
             'fill="%s" stroke="%s" stroke-width="3.6"/>' % (px - 68, py - 30, px - 53, py - 22, GRIP, INK))
    o.append('<rect x="%d" y="%d" width="30" height="16" rx="8" transform="rotate(14 %d %d)" '
             'fill="%s" stroke="%s" stroke-width="3.6"/>' % (px + 44, py - 80, px + 58, py - 72, GRIP, INK))
    # bell, with a ding
    bx, by = px + 18, py - 78
    o.append('<g><animateTransform attributeName="transform" type="rotate" '
             'values="0 %d %d;-10 %d %d;8 %d %d;-3 %d %d;0 %d %d" dur="5.4s" repeatCount="indefinite"/>'
             % (bx, by + 9, bx, by + 9, bx, by + 9, bx, by + 9, bx, by + 9))
    o.append('<path d="M %d %d a 11 11 0 0 1 22 0 z" fill="#e8c45a" stroke="%s" stroke-width="3.2"/>'
             % (bx - 11, by + 9, INK))
    o.append('<circle cx="%d" cy="%d" r="3" fill="%s"/></g>' % (bx, by - 3, INK))
    o.append('<g fill="none" stroke="#fff6d0" stroke-width="3.4" stroke-linecap="round">'
             '<path d="M %d %d q 10 -8 12 -18"/><path d="M %d %d q 7 -9 7 -17"/>'
             '<animate attributeName="opacity" values="0;0;.9;0;0" dur="5.4s" repeatCount="indefinite"/>'
             '</g>' % (bx + 18, by - 4, bx + 10, by - 12))
    return "".join(o)
print("frame ok")

def leg(near):
    """Feathered thigh + scaled tarsus + webbed foot, solved by IK to the pedal.
    Three nested rotate() groups, animated from one sampled phase table."""
    side = 4 if near else -16
    feather = "#f6c98f" if near else "#d6a067"   # feathered thigh, but bird-bone coloured
    fshade = "#e0a163" if near else "#c68f57"
    tone = LEG_N if near else LEG_F
    shade = "#e0a163" if near else "#c68f57"
    off = 0.0 if near else math.pi
    ph0 = math.radians(PHASE0) + 2 * math.pi * T + off
    ta0, sa0, an0, sc0 = leg_solve(ph0, True)
    tag = "N" if near else "F"

    def anim(idx):
        n = 48
        vals = []
        for i in range(n + 1):
            ta, sa, an, sc = leg_solve(ph0 + 2 * math.pi * i / n, True)
            vals.append("%s 0 0" % fmt((ta, sa, an)[idx]))
        return ('<animateTransform attributeName="transform" type="rotate" values="%s" '
                'dur="%ss" repeatCount="indefinite"/>' % (";".join(vals), fmt(CRANKDUR)))

    o = ['<g transform="translate(%s,%d)">' % (fmt(HIP[0] + side), HIP[1])]
    o.append('<g transform="rotate(%s)">' % fmt(ta0))
    o.append(anim(0))
    o.append('<path d="M 0 -6 L 0 %d" stroke="%s" stroke-width="34" stroke-linecap="round"/>' % (L1, INK))
    o.append('<path d="M 0 -6 L 0 %d" stroke="%s" stroke-width="24" stroke-linecap="round"/>' % (L1, feather))
    o.append('<path d="M -7 10 q 8 8 8 18 M 7 12 q -8 8 -8 16 M -7 40 q 8 8 8 16" fill="none" '
             'stroke="%s" stroke-width="2.8" stroke-linecap="round"/>' % fshade)
    o.append('<g transform="translate(0,%d)">' % L1)
    o.append('<g transform="rotate(%s)">' % fmt(sa0))
    o.append(anim(1))
    # telescoping tarsus: the shin slides inside the thigh sleeve to reach the pedal
    st = []
    n2 = 48
    for i in range(n2 + 1):
        st.append(fmt(leg_solve(ph0 + 2 * math.pi * i / n2, True)[3]))
    o.append('<animateTransform attributeName="transform" type="scale" values="1 1 1;'
             + ";".join("1 %s 1" % v for v in st) + '" dur="%ss" repeatCount="indefinite" '
             'additive="sum" fill="freeze"/>' % fmt(CRANKDUR))
    o.append('<path d="M -7.5 0 L -5.4 %d L 5.4 %d L 7.5 0 Z" fill="%s" stroke="%s" stroke-width="4.2" '
             'stroke-linejoin="round"/>' % (L2, L2, tone, INK))
    o.append('<path d="M -4.6 14 L -3.4 %d" stroke="#fff3dd" stroke-width="2.4" stroke-linecap="round" '
             'opacity=".5"/>' % (L2 - 12))
    for k in range(6):
        yy = 24 + k * 23
        o.append('<path d="M -6 %d q 6 5 12 0" fill="none" stroke="%s" stroke-width="2" '
                 'stroke-linecap="round" opacity=".7"/>' % (yy, shade))
    o.append('<circle cx="0" cy="0" r="11" fill="%s" stroke="%s" stroke-width="4.2"/>' % (tone, INK))
    o.append('<circle cx="-2.5" cy="-2.5" r="3.4" fill="#fff3dd" opacity=".55"/>')
    o.append('<g transform="translate(0,%d)">' % L2)
    o.append('<g transform="rotate(%s)">' % fmt(an0))
    o.append(anim(2))
    # webbed foot: heel behind, three splayed toes in front, web between them
    o.append('<path d="M -10 2 Q -12 -8 -4 -9 L 4 -7 Q 10 -6 14 -9 Q 20 -11 24 -6 '
             'L 30 -1 Q 34 3 30 7 L 22 8 Q 16 5 10 7 L 2 10 Q -8 10 -10 2 Z" '
             'fill="%s" stroke="%s" stroke-width="4" stroke-linejoin="round"/>' % (tone, INK))
    o.append('<path d="M -2 -6 L 2 6 M 9 -7 L 12 6" stroke="%s" stroke-width="2.4" '
             'stroke-linecap="round" opacity=".85"/>' % shade)
    o.append('</g></g></g></g></g></g>')
    return "".join(o)

def pelican():
    """Body-local frame: origin at the hip, the whole bird leans back 12 deg.
    Head, neck and body are three silhouettes that overlap, so there is no seam.
    Every extreme was checked through translate(438,816) rotate(-12) and the
    hero scale(1.1) to keep the bill inside the 900x1280 frame."""
    o = ['<g id="pelican" transform="translate(410,780)">']
    o.append('<g transform="rotate(-12)">')

    # ---------------- tail: three overlapping pointed deck feathers ----------------
    o.append('<g>')
    o.append('<animateTransform attributeName="transform" type="rotate" '
             'values="-2.4 -60 -110;2.8 -60 -110;-2.4 -60 -110" dur="2.7s" repeatCount="indefinite"/>')
    # drawn back-to-front: longest at the bottom, shortest on top
    feathers = [
        ("M -20 -108 C -60 -122 -104 -128 -140 -120 C -132 -108 -126 -100 -118 -94 "
         "C -100 -90 -66 -92 -20 -98 Z"),
        ("M -20 -110 C -64 -128 -110 -140 -148 -140 C -140 -126 -132 -116 -122 -110 "
         "C -102 -106 -66 -104 -20 -100 Z"),
        ("M -20 -112 C -62 -126 -102 -132 -132 -128 C -126 -116 -120 -108 -112 -102 "
         "C -94 -100 -64 -102 -20 -104 Z"),
    ]
    for d in feathers:
        o.append('<path d="%s" fill="#f8efdc" stroke="%s" stroke-width="4.6" '
                 'stroke-linejoin="round"/>' % (d, INK))
    o.append('<path d="M -40 -104 C -74 -108 -104 -110 -126 -108 M -44 -116 C -78 -120 -108 -124 -132 -124" '
             'fill="none" stroke="#d3c2a4" stroke-width="2.8" stroke-linecap="round"/>')
    o.append('</g>')

    # ---------------- body ----------------
    body_pts = [(-36, -148), (32, -184), (114, -176), (164, -134), (180, -70), (166, -4),
                (116, 46), (28, 64), (-42, 42), (-70, -28), (-62, -104)]
    o.append('<path d="%s" fill="%s" stroke="%s" stroke-width="6.4" stroke-linejoin="round"/>'
             % (smooth(body_pts, close=True), CREAM, INK))
    o.append('<path d="M -40 -6 C -12 32 34 54 92 50 C 130 46 158 26 172 0" fill="none" '
             'stroke="#ecdfc7" stroke-width="9" stroke-linecap="round" opacity=".7"/>')
    o.append('<g fill="none" stroke="#e6dac1" stroke-width="3" stroke-linecap="round" opacity=".7">'
             '<path d="M -22 -112 q 34 -16 70 -10"/><path d="M -30 -76 q 40 -18 84 -10"/></g>')

    # ---------------- neck: short, thick, curving up-and-forward ----------------
    neck = 'M 118 -140 C 104 -186 128 -224 176 -240'
    o.append('<path d="%s" fill="none" stroke="%s" stroke-width="66" stroke-linecap="round"/>'
             % (neck, INK))
    o.append('<path d="%s" fill="none" stroke="%s" stroke-width="54" stroke-linecap="round"/>'
             % (neck, CREAM))
    o.append('<path d="M 126 -156 C 116 -190 134 -216 168 -228" fill="none" stroke="#e9dcc1" '
             'stroke-width="7" stroke-linecap="round" opacity=".5"/>')

    # ---------------- head ----------------
    o.append('<g>')
    o.append('<animateTransform attributeName="transform" type="rotate" '
             'values="0 232 -206;3 232 -206;0 232 -206" dur="3.6s" repeatCount="indefinite"/>')

    # crest: short feathers that grow out of the skull outline (drawn behind the head)
    o.append('<path d="M 240 -290 C 230 -316 208 -332 180 -338 C 194 -322 200 -306 202 -286 Z" '
             'fill="%s" stroke="%s" stroke-width="4.6" stroke-linejoin="round"/>' % (CREAM, INK))
    o.append('<path d="M 252 -296 C 252 -322 260 -342 276 -356 C 272 -336 276 -320 284 -310 Z" '
             'fill="%s" stroke="%s" stroke-width="4.2" stroke-linejoin="round"/>' % (CREAM, INK))

    # skull
    o.append('<path d="M 206 -258 C 204 -284 224 -300 250 -300 C 278 -300 300 -282 302 -256 '
             'C 304 -230 288 -212 262 -210 C 234 -208 208 -230 206 -258 Z" '
             'fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>' % (CREAM, INK))
    # pouch, hanging under the bill
    o.append('<path d="M 318 -220 C 320 -180 348 -146 394 -134 C 432 -124 456 -146 454 -178 '
             'C 452 -210 422 -230 382 -234 C 352 -237 326 -230 318 -220 Z" fill="%s" '
             'stroke="%s" stroke-width="5.2" stroke-linejoin="round"/>' % (POUCH, INK))
    o.append('<path d="M 330 -210 C 338 -178 362 -152 394 -142" fill="none" stroke="#e08a3c" '
             'stroke-width="4.6" stroke-linecap="round" opacity=".42"/>')
    o.append('<path d="M 336 -200 C 346 -172 368 -150 394 -140" fill="none" stroke="#ffd39b" '
             'stroke-width="2.8" stroke-linecap="round" opacity=".55"/>')
    # fish tail out of the pouch
    o.append('<g>')
    o.append('<animateTransform attributeName="transform" type="rotate" '
             'values="-16 420 -162;14 420 -162;-16 420 -162" dur="1.3s" repeatCount="indefinite"/>')
    o.append('<path d="M 420 -162 C 416 -186 402 -204 386 -210 C 392 -196 394 -184 392 -174 '
             'C 384 -182 370 -178 362 -168 C 380 -160 404 -156 420 -162 Z" '
             'fill="#a8d4ec" stroke="%s" stroke-width="4" stroke-linejoin="round"/>' % INK)
    o.append('</g>')

    # upper mandible: long hooked saffron bill
    o.append('<path d="M 292 -250 C 352 -254 424 -242 466 -220 C 480 -212 484 -202 478 -196 '
             'C 472 -189 458 -191 448 -195 C 404 -210 340 -216 294 -214 Z" '
             'fill="%s" stroke="%s" stroke-width="5.2" stroke-linejoin="round"/>' % (BILL, INK))
    o.append('<path d="M 306 -242 C 360 -244 420 -234 460 -216" fill="none" stroke="#ffd98a" '
             'stroke-width="4.2" stroke-linecap="round" opacity=".9"/>')
    o.append('<path d="M 466 -224 C 482 -216 490 -204 480 -194 C 474 -187 460 -190 454 -198" '
             'fill="%s" stroke="%s" stroke-width="4.8" stroke-linejoin="round"/>' % (BILL_DK, INK))

    # eye
    o.append('<g transform="translate(252,-264)">')
    o.append('<animateTransform attributeName="transform" type="scale" '
             'values="1 1;1 1;1 .06;1 1;1 1;1 .55;1 1;1 1" keyTimes="0;.10;.12;.15;.45;.47;.50;1" '
             'dur="6.8s" repeatCount="indefinite" additive="sum"/>')
    o.append('<circle cx="0" cy="0" r="15" fill="#fdf8ec" stroke="%s" stroke-width="3.2"/>' % INK)
    o.append('<circle cx="3.4" cy="1.6" r="8" fill="%s"/>' % INK)
    o.append('<circle cx="6" cy="-2.6" r="3" fill="#ffffff"/>')
    o.append('</g>')
    o.append('<path d="M 228 -290 q 18 -9 36 -3" fill="none" stroke="%s" stroke-width="4.4" '
             'stroke-linecap="round"/>' % INK)
    o.append('<ellipse cx="226" cy="-234" rx="12" ry="7" fill="#f6a08a" opacity=".5"/>')
    o.append('</g>')      # head

    # ---------------- near wing: folded wing covering the flank ----------------
    o.append('<g>')
    o.append('<animateTransform attributeName="transform" type="rotate" '
             'values="-1.2 70 -50;1.5 70 -50;-1.2 70 -50" dur="1.5s" repeatCount="indefinite"/>')
    # primaries first: long feathers trailing back over the rump
    for k, (x0, y0, x1, y1, th) in enumerate([(44, -62, -52, -40, 12), (30, -76, -60, -58, 11),
                                              (18, -88, -50, -74, 10)]):
        o.append('<path d="M %d %d C %d %d %d %d %d %d C %d %d %d %d %d %d Z" '
                 'fill="#efe2c6" stroke="%s" stroke-width="3.6" stroke-linejoin="round"/>'
                 % (x0, y0 - th, x0 - 44, y0 - th + 6, x1 + 26, y1 - 2, x1, y1,
                    x1 + 30, y1 + 12, x0 - 40, y0 + th, x0, y0 + th, INK))
    # covert mass: a broad soft-edged shield filling the flank
    o.append('<path d="M 84 -64 C 90 -100 66 -126 30 -130 C -2 -134 -38 -120 -60 -96 '
             'C -72 -82 -76 -68 -72 -56 C -46 -62 -14 -66 14 -64 C 44 -62 72 -66 84 -64 Z" '
             'fill="#f5ead2" stroke="%s" stroke-width="4.6" stroke-linejoin="round"/>' % INK)
    o.append('<g fill="none" stroke="#ded0af" stroke-width="2.8" stroke-linecap="round">'
             '<path d="M 70 -108 C 46 -118 14 -116 -10 -104"/>'
             '<path d="M 76 -90 C 50 -102 18 -100 -8 -88"/>'
             '<path d="M 78 -72 C 52 -84 20 -82 -6 -70"/></g>')
    o.append('<path d="M 80 -60 C 52 -68 18 -66 -14 -56" fill="none" stroke="#e8dcc0" '
             'stroke-width="4.6" stroke-linecap="round" opacity=".85"/>')
    o.append('</g>')

    o.append('</g></g>')
    return "".join(o)

def chain_line():
    o = ['<g fill="none" stroke="#4a4450" stroke-width="2" stroke-dasharray="6 4">']
    o.append('<path d="M %d %d L %d %d"/>' % (BB[0], BB[1] - CHAINR, RH[0], RH[1] - 15))
    o.append('<path d="M %d %d L %d %d"/>' % (BB[0], BB[1] + CHAINR, RH[0], RH[1] + 15))
    o.append('<animate attributeName="stroke-dashoffset" values="0;-40" dur=".6s" repeatCount="indefinite"/>')
    o.append('</g>')
    o.append('<circle cx="%d" cy="%d" r="15" fill="none" stroke="#b8bfc9" stroke-width="4"/>' % (RH[0], RH[1]))
    return "".join(o)

def crank(near):
    """Both arms are drawn toward BB + CRANK*cos/sin and animate through the same
    phase, so each pedal sits on its own arm at every instant."""
    ph = PHASE0 + 360 * T
    col = "#d7dbe2" if near else "#8d949c"
    o = ['<g>']
    # Both arms turn the same way. The far arm is *drawn* on the -x side, so it is
    # already 180 deg opposite the near one; spinning it backwards would mirror it.
    o.append('<animateTransform attributeName="transform" type="rotate" from="%s %d %d" '
             'to="%s %d %d" dur="%ss" repeatCount="indefinite"/>'
             % (fmt(PHASE0 + 360 * T), BB[0], BB[1], fmt(PHASE0 + 360 * T + 360),
                BB[0], BB[1], fmt(CRANKDUR)))
    if near:
        o.append('<circle cx="%d" cy="%d" r="%d" fill="#e7dcc8" stroke="%s" stroke-width="4.4"/>'
                 % (BB[0], BB[1], CHAINR, INK))
        o.append('<circle cx="%d" cy="%d" r="%d" fill="none" stroke="#c9ccd6" stroke-width="4"/>'
                 % (BB[0], BB[1], CHAINR - 6))
        for k in range(22):
            a = 2 * math.pi * k / 22
            o.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="3"/>' % (
                fmt(BB[0] + CHAINR * math.cos(a)), fmt(BB[1] + CHAINR * math.sin(a)),
                fmt(BB[0] + (CHAINR + 6) * math.cos(a)), fmt(BB[1] + (CHAINR + 6) * math.sin(a)), INK))
        for k in range(5):
            a = 2 * math.pi * k / 5 + .3
            o.append('<circle cx="%s" cy="%s" r="3.4" fill="%s"/>'
                     % (fmt(BB[0] + 19 * math.cos(a)), fmt(BB[1] + 19 * math.sin(a)), INK))
    s = 1 if near else -1
    o.append('<line x1="%d" y1="%d" x2="%s" y2="%s" stroke="%s" stroke-width="%s" stroke-linecap="round"/>'
             % (BB[0], BB[1], fmt(BB[0] + s * CRANK), BB[1], col, "8.5" if near else "8"))
    o.append('<circle cx="%s" cy="%d" r="%s" fill="%s" stroke="%s" stroke-width="2.6"/>'
             % (fmt(BB[0] + s * CRANK), BB[1], "5.5" if near else "5", col, INK))
    if near:
        o.append('<circle cx="%d" cy="%d" r="11" fill="#b8bfc9" stroke="%s" stroke-width="3.4"/>' % (BB[0], BB[1], INK))
        o.append('<circle cx="%d" cy="%d" r="4" fill="%s"/>' % (BB[0], BB[1], INK))
    o.append('</g>')
    return "".join(o)

def pedal(near):
    """Pedal platform, translated around the crank circle.
    Values start at the baked phase and run one full revolution, so the static
    transform attribute, the first SMIL value and the crank's angle all agree."""
    ph0 = math.radians(PHASE0) + 2 * math.pi * T
    n = 96
    pts = []
    for i in range(n + 1):
        px, py = pedal_pos(ph0 + 2 * math.pi * i / n, near)
        pts.append("%s %s" % (fmt(px), fmt(py)))
    x0, y0 = pedal_pos(ph0, near)
    o = ['<g transform="translate(%s,%s)">' % (fmt(x0), fmt(y0))]
    o.append('<animateTransform attributeName="transform" type="translate" values="%s" dur="%ss" '
             'repeatCount="indefinite"/>' % (";".join(pts), fmt(CRANKDUR)))
    col = "#4a4e59" if near else "#3a3d47"
    o.append('<rect x="-19" y="-4.5" width="38" height="9" rx="3" fill="%s" stroke="%s" stroke-width="3.2"/>' % (col, INK))
    o.append('<rect x="-13" y="-1.6" width="26" height="3" rx="1.5" fill="#9aa3ad" opacity="%s"/>'
             % ("0.9" if near else "0.5"))
    o.append('</g>')
    return "".join(o)


def frame_group():
    """Diamond frame + bars + saddle. All drawn in one go so overlaps stay tidy."""
    segs = [((428, 822), (556, 800)),   # top tube
            ((556, 800), (470, 984)),   # down tube
            ((432, 828), (474, 996)),   # seat tube
            ((556, 800), (598, 900)),   # head tube
            ((598, 900), (642, 974)),   # fork
            ((474, 996), (286, 974)),   # chain stay
            ((424, 840), (286, 974))]   # seat stay
    o = []
    for (a, b) in segs:
        o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="22" stroke-linecap="round"/>'
                 % (a[0], a[1], b[0], b[1], INK))
    for (a, b) in segs:
        o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="14" stroke-linecap="round"/>'
                 % (a[0], a[1], b[0], b[1], RED))
    # highlights along the top of each tube
    for (a, b) in segs:
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L * 4.2, dx / L * 4.2
        o.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="#f9866f" stroke-width="4" '
                 'stroke-linecap="round" opacity=".85"/>'
                 % (fmt(a[0] - nx), fmt(a[1] - ny), fmt(b[0] - nx), fmt(b[1] - ny)))
    # painted details
    o.append('<line x1="538" y1="823" x2="476" y2="955" stroke="#f4ead8" stroke-width="6" '
             'stroke-linecap="round" opacity=".92"/>')
    o.append('<line x1="440" y1="862" x2="470" y2="962" stroke="#f4ead8" stroke-width="5" '
             'stroke-linecap="round" opacity=".9"/>')
    o.append('<circle cx="%d" cy="%d" r="11.5" fill="#c9ccd6" stroke="%s" stroke-width="3.4"/>'
             % (BB[0] - 4, BB[1] - 6, INK))
    # saddle
    o.append('<path d="M 440 820 l 2 -14" stroke="#c9ccd6" stroke-width="9" stroke-linecap="round"/>')
    o.append('<path d="M 398 830 C 418 812 456 810 466 820 C 450 836 408 842 398 830 Z" '
             'fill="%s" stroke="%s" stroke-width="4.4"/>' % (SADDLE, INK))
    o.append('<path d="M 406 827 q 14 -7 34 -7" fill="none" stroke="#a06d3f" stroke-width="3.2" '
             'stroke-linecap="round"/>')
    o.append('<circle cx="402" cy="827" r="2.6" fill="#3a2a20"/><circle cx="414" cy="831" r="2.6" fill="#3a2a20"/>')
    return "".join(o)

def bars_group():
    px, py = HT_TOP
    stem = 'M %d %d L %d %d C %d %d %d %d %d %d' % (px, py + 8, px + 6, py - 34,
                                                    px + 8, py - 64, px + 30, py - 76, px + 54, py - 72)
    sweep = 'M %d %d C %d %d %d %d %d %d' % (px + 8, py - 40, px - 24, py - 82,
                                             px - 58, py - 52, px - 52, py - 16)
    o = []
    for d in (stem, sweep):
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="16" stroke-linecap="round"/>' % (d, INK))
        o.append('<path d="%s" fill="none" stroke="#cfd4dc" stroke-width="9.5" stroke-linecap="round"/>' % d)
        o.append('<path d="%s" fill="none" stroke="#fbfdff" stroke-width="3.2" stroke-linecap="round" '
                 'opacity=".85"/>' % d)
    o.append('<rect x="%d" y="%d" width="30" height="16" rx="8" transform="rotate(-46 %d %d)" '
             'fill="%s" stroke="%s" stroke-width="3.6"/>' % (px - 68, py - 30, px - 53, py - 22, GRIP, INK))
    o.append('<rect x="%d" y="%d" width="30" height="16" rx="8" transform="rotate(14 %d %d)" '
             'fill="%s" stroke="%s" stroke-width="3.6"/>' % (px + 44, py - 80, px + 58, py - 72, GRIP, INK))
    # bell, with a ding
    bx, by = px + 18, py - 78
    o.append('<g><animateTransform attributeName="transform" type="rotate" '
             'values="0 %d %d;-10 %d %d;8 %d %d;-3 %d %d;0 %d %d" dur="5.4s" repeatCount="indefinite"/>'
             % (bx, by + 9, bx, by + 9, bx, by + 9, bx, by + 9, bx, by + 9))
    o.append('<path d="M %d %d a 11 11 0 0 1 22 0 z" fill="#e8c45a" stroke="%s" stroke-width="3.2"/>'
             % (bx - 11, by + 9, INK))
    o.append('<circle cx="%d" cy="%d" r="3" fill="%s"/></g>' % (bx, by - 3, INK))
    o.append('<g fill="none" stroke="#fff6d0" stroke-width="3.4" stroke-linecap="round">'
             '<path d="M %d %d q 10 -8 12 -18"/><path d="M %d %d q 7 -9 7 -17"/>'
             '<animate attributeName="opacity" values="0;0;.9;0;0" dur="5.4s" repeatCount="indefinite"/>'
             '</g>' % (bx + 18, by - 4, bx + 10, by - 12))
    return "".join(o)
print("frame ok")

def leg(near):
    """Feathered thigh + scaled tarsus + webbed foot, solved by IK to the pedal.
    Three nested rotate() groups, animated from one sampled phase table."""
    side = 4 if near else -16
    feather = "#f6c98f" if near else "#d6a067"   # feathered thigh, but bird-bone coloured
    fshade = "#e0a163" if near else "#c68f57"
    tone = LEG_N if near else LEG_F
    shade = "#e0a163" if near else "#c68f57"
    off = 0.0 if near else math.pi
    ph0 = math.radians(PHASE0) + 2 * math.pi * T + off
    ta0, sa0, an0, sc0 = leg_solve(ph0, True)
    tag = "N" if near else "F"

    def anim(idx):
        n = 48
        vals = []
        for i in range(n + 1):
            ta, sa, an, sc = leg_solve(ph0 + 2 * math.pi * i / n, True)
            vals.append("%s 0 0" % fmt((ta, sa, an)[idx]))
        return ('<animateTransform attributeName="transform" type="rotate" values="%s" '
                'dur="%ss" repeatCount="indefinite"/>' % (";".join(vals), fmt(CRANKDUR)))

    o = ['<g transform="translate(%s,%d)">' % (fmt(HIP[0] + side), HIP[1])]
    o.append('<g transform="rotate(%s)">' % fmt(ta0))
    o.append(anim(0))
    o.append('<path d="M 0 -6 L 0 %d" stroke="%s" stroke-width="34" stroke-linecap="round"/>' % (L1, INK))
    o.append('<path d="M 0 -6 L 0 %d" stroke="%s" stroke-width="24" stroke-linecap="round"/>' % (L1, feather))
    o.append('<path d="M -7 10 q 8 8 8 18 M 7 12 q -8 8 -8 16 M -7 40 q 8 8 8 16" fill="none" '
             'stroke="%s" stroke-width="2.8" stroke-linecap="round"/>' % fshade)
    o.append('<g transform="translate(0,%d)">' % L1)
    o.append('<g transform="rotate(%s)">' % fmt(sa0))
    o.append(anim(1))
    # telescoping tarsus: the shin slides inside the thigh sleeve to reach the pedal
    st = []
    n2 = 48
    for i in range(n2 + 1):
        st.append(fmt(leg_solve(ph0 + 2 * math.pi * i / n2, True)[3]))
    o.append('<animateTransform attributeName="transform" type="scale" values="1 1 1;'
             + ";".join("1 %s 1" % v for v in st) + '" dur="%ss" repeatCount="indefinite" '
             'additive="sum" fill="freeze"/>' % fmt(CRANKDUR))
    o.append('<path d="M -7.5 0 L -5.4 %d L 5.4 %d L 7.5 0 Z" fill="%s" stroke="%s" stroke-width="4.2" '
             'stroke-linejoin="round"/>' % (L2, L2, tone, INK))
    o.append('<path d="M -4.6 14 L -3.4 %d" stroke="#fff3dd" stroke-width="2.4" stroke-linecap="round" '
             'opacity=".5"/>' % (L2 - 12))
    for k in range(6):
        yy = 24 + k * 23
        o.append('<path d="M -6 %d q 6 5 12 0" fill="none" stroke="%s" stroke-width="2" '
                 'stroke-linecap="round" opacity=".7"/>' % (yy, shade))
    o.append('<circle cx="0" cy="0" r="11" fill="%s" stroke="%s" stroke-width="4.2"/>' % (tone, INK))
    o.append('<circle cx="-2.5" cy="-2.5" r="3.4" fill="#fff3dd" opacity=".55"/>')
    o.append('<g transform="translate(0,%d)">' % L2)
    o.append('<g transform="rotate(%s)">' % fmt(an0))
    o.append(anim(2))
    # webbed foot: heel behind, three splayed toes in front, web between them
    o.append('<path d="M -10 2 Q -12 -8 -4 -9 L 4 -7 Q 10 -6 14 -9 Q 20 -11 24 -6 '
             'L 30 -1 Q 34 3 30 7 L 22 8 Q 16 5 10 7 L 2 10 Q -8 10 -10 2 Z" '
             'fill="%s" stroke="%s" stroke-width="4" stroke-linejoin="round"/>' % (tone, INK))
    o.append('<path d="M -2 -6 L 2 6 M 9 -7 L 12 6" stroke="%s" stroke-width="2.4" '
             'stroke-linecap="round" opacity=".85"/>' % shade)
    o.append('</g></g></g></g></g></g>')
    return "".join(o)

print("pelican ok")

# =====================================================================
#  vector wordmark (no font dependency -> identical everywhere)
# =====================================================================
GLYPHS = {
 'P': "M0,14 L0,0 L5,0 Q8,0 8,3.2 Q8,6.4 5,6.4 L0,6.4",
 'E': "M8,0 L0,0 L0,14 L8,14 M0,7.2 L6.2,7.2",
 'L': "M0,0 L0,14 L8,14",
 'I': "M4,0 L4,14",
 'C': "M8.2,2.6 Q7.6,0 5.2,0 L2.8,0 Q0,0 0,2.8 L0,11.2 Q0,14 2.8,14 L5.2,14 Q7.6,14 8.2,11.4",
 'A': "M0,14 L4,0 L8,14 M1.9,9.4 L6.1,9.4",
 'N': "M0,14 L0,0 L8,14 L8,0",
 'O': "M2.6,0 L5.4,0 Q8,0 8,2.6 L8,11.4 Q8,14 5.4,14 L2.6,14 Q0,14 0,11.4 L0,2.6 Q0,0 2.6,0 Z",
 'B': "M0,14 L0,0 L4.6,0 Q7.4,0 7.4,3.1 Q7.4,6.2 4.6,6.2 L0,6.2 M0,6.2 L5,6.2 Q8,6.2 8,10.1 Q8,14 5,14 L0,14",
 'Y': "M0,0 L4,6.4 L8,0 M4,6.4 L4,14",
}

def word(txt, x, y, size, color, stroke_w=6.0, adv=10.6):
    k = size / 14.0
    glyphs = ''.join('<path d="%s" transform="translate(%s,0)"/>' % (GLYPHS[ch], fmt(i * adv))
                     for i, ch in enumerate(txt) if ch != ' ')
    return ('<g transform="translate(%s,%s) scale(%s)" fill="none" stroke="%s" stroke-width="%s" '
            'stroke-linecap="round" stroke-linejoin="round">%s</g>'
            % (fmt(x), fmt(y), fmt(k), color, fmt(stroke_w / k), glyphs))

def title_block():
    o = ['<g>']
    o.append('<g transform="translate(10,12)"><rect x="44" y="40" width="404" height="230" rx="26" '
             'fill="%s" opacity=".12"/></g>' % INK)
    o.append('<rect x="44" y="40" width="404" height="230" rx="26" fill="%s" stroke="%s" '
             'stroke-width="6"/>' % (CREAM, INK))
    o.append('<rect x="68" y="60" width="66" height="7" rx="3.5" fill="#ffc94d"/>')
    o.append(word('PELICAN', 68, 82, 44, '#20293a', 7.0))
    o.append(word('ON A', 70, 148, 22, '#3c5168', 5.2))
    o.append(word('BICYCLE', 68, 186, 44, RED, 7.2))
    o.append('</g>')
    return "".join(o)

# =====================================================================
#  document
# =====================================================================
HERO = '<g transform="translate(470,1080) scale(1.1) translate(-470,-1080)">'

def svg_doc():
    o = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
         'role="img" aria-labelledby="t d">' % (W, H, W, H),
         '<title id="t">A pelican riding a bicycle along a seaside promenade</title>',
         '<desc id="d">Hand-built vector artwork. A white pelican with a saffron bill and a fish '
         'tail poking from its pouch pedals a red bicycle past the sea. The cranks, pedals, legs, '
         'wheels, bell, clouds, waves and wildlife are all animated with SVG SMIL, so the whole '
         'scene loops forever with no scripts.</desc>',
         background(),
         title_block(),
         HERO,
         crank(False),
         pedal(False),
         frame_group(),
         chain_line(),
         wheel(RH[0], RH[1]),
         wheel(FH[0], FH[1]),
         bars_group(),
         leg(False),
         leg(True),
         crank(True),
         pedal(True),
         (pelican() if os.environ.get("NOBIRD") != "1" else ""),
         '</g>',
         '</svg>']
    return "\n".join(o)

def html_doc(svg):
    body_svg = svg.replace('<?xml version="1.0" encoding="UTF-8"?>\n', "")
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pelican on a Bicycle \u2014 SVG + HTML</title>
<meta name="description" content="A pelican riding a bicycle: one hand-built SVG, animated with SMIL, embedded in a single HTML file. No images, no scripts, no libraries.">
<style>
  :root{ color-scheme: light; }
  *,*::before,*::after{ box-sizing: border-box; }
  html,body{ margin:0; padding:0; }
  body{
    min-height:100vh; margin:0; padding:28px 16px 40px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;
    background: radial-gradient(1200px 760px at 50% -12%, #2f639f 0%, #16283f 52%, #0b1420 100%);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color:#e8eef6;
  }
  .frame{
    width:min(94vw, 560px); border-radius:26px; overflow:hidden;
    box-shadow: 0 34px 80px -24px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.12),
                inset 0 0 0 1px rgba(255,255,255,.07);
    background:#a9d8f7; line-height:0;
  }
  .frame svg{ display:block; width:100%; height:auto; }
  .caption{
    margin:0; text-align:center; font-size:12.5px; letter-spacing:.14em;
    text-transform:uppercase; color:#8ea6c2; line-height:1.7;
  }
  .caption b{ color:#dce8f5; font-weight:600; letter-spacing:.16em; }
  .caption span{ display:block; letter-spacing:.06em; text-transform:none; font-size:12px; color:#6f8aa8; }
  @media (prefers-reduced-motion: reduce){
    .frame svg *{ animation: none !important; }
  }
</style>
</head>
<body>
  <main class="frame">
__SVG__
  </main>
  <p class="caption">
    <b>Pelican on a Bicycle</b>
    <span>SVG + HTML &middot; 900 &times; 1280 &middot; pure SMIL animation, no scripts</span>
  </p>
</body>
</html>
""".replace("__SVG__", body_svg)

def validate(svg):
    import xml.dom.minidom as md
    md.parseString(svg.encode("utf-8"))
    opens, closes = svg.count("<g"), svg.count("</g>")
    assert opens == closes, "group imbalance: %d open, %d close" % (opens, closes)
    return opens

svg = svg_doc()
n = validate(svg)
out_svg = os.path.join(os.path.dirname(__file__), "..", "pelican-bicycle.svg")
out_html = os.path.join(os.path.dirname(__file__), "..", "pelican-bicycle.html")
open(out_svg, "w").write(svg)
open(out_html, "w").write(html_doc(svg.replace('<?xml version="1.0" encoding="UTF-8"?>\n', "")))
print("groups:", n, "| svg bytes:", len(svg), "| html bytes:", len(open(out_html).read()))
