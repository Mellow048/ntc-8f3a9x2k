# Picture timeline mirrored from remotion-app/src/videos/pendulum/story.ts
# so every musical accent and synthesized SFX cue lands on the exact frame.
import json

FPS = 30
TOTAL = 1965
DUR = TOTAL / FPS  # 65.500 s exact
fr = lambda f: f / FPS

FLASH = fr(138)
MUG_SLIDE = fr(585)
MUG_TIP = fr(599)
SEASICK = fr(641)
WAVE_TIP = fr(989)
GUY_LEAN = fr(1039)
BUMPER_HIT = fr(1226)
TYPHOON_SLAM = fr(1356)
METER_SWING = fr(1460)
SCARED = fr(1589)
MASCOT = fr(1852)

SHOTS = {
    1: (0, 142, "day", "atrium"),
    2: (142, 289, "day", "city"),
    3: (289, 390, "day", "city"),
    4: (390, 546, "day", "office"),
    5: (546, 694, "day", "office"),
    6: (694, 912, "day", "atrium"),
    7: (912, 1102, "golden", "boat"),
    8: (1102, 1291, "day", "atrium"),
    9: (1291, 1426, "day", "city"),
    10: (1426, 1487, "day", "atrium"),
    11: (1487, 1557, "day", "city"),
    12: (1557, 1680, "day", "atrium"),
    13: (1680, 1778, "day", "closet"),
    14: (1778, TOTAL, "golden", "atrium"),
}
XFADE = {7: 8, 8: 8, 14: 8}


def shot_t(i):
    a, b = SHOTS[i][:2]
    return fr(a), fr(b)


def words(path):
    data = json.load(open(path, encoding="utf-8"))
    out = []
    for w in data:
        s = float(w.get("s", w.get("start", 0.0)))
        e = float(w.get("e", w.get("end", s)))
        out.append({"w": w.get("w", w.get("word", "")), "s": s, "e": e})
    return out
