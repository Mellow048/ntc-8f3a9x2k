#!/usr/bin/env python3
"""Where does a point of a set land in the frame?  A shot's camera on paper, before a still is rendered.

  python scripts/project.py "cx,cy,cz" "tx,ty,tz" [fov=42] [push=0] -- "x,y,z[:name]" ...

Prints, for each point, how far across (0 % = left edge) and down (0 % = top edge) it is at the start of the shot
and, with a push, at its end, and its distance from the lens. The frame is 9:16; the caption's line is about 76 %
down, the source lines end about 17 % down, and the tab on the left is 31 % down.
"""
import sys, math
import numpy as np

def project(cam, tgt, fov, p):
    cam, tgt, p = (np.array(v, float) for v in (cam, tgt, p))
    fwd = tgt - cam; fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    d = p - cam; z = d @ fwd
    if z <= 0.1: return None
    t = math.tan(math.radians(fov) / 2)
    return 50 + 50 * (d @ right) / (z * t * 9 / 16), 50 - 50 * (d @ up) / (z * t), float(np.linalg.norm(d))

if __name__ == "__main__":
    a = sys.argv[1:]; cut = a.index("--"); head, pts = a[:cut], a[cut + 1:]
    cam = [float(v) for v in head[0].split(",")]; tgt = [float(v) for v in head[1].split(",")]
    fov = float(head[2]) if len(head) > 2 else 42.0; push = float(head[3]) if len(head) > 3 else 0.0
    end = [c + (t - c) * push for c, t in zip(cam, tgt)]
    print(f"lens to target {math.dist(cam, tgt):.2f}" + (f", {math.dist(end, tgt):.2f} at the end" if push else ""))
    for s in pts:
        xyz, _, name = s.partition(":"); p = [float(v) for v in xyz.split(",")]
        row = []
        for c in ([cam, end] if push else [cam]):
            r = project(c, tgt, fov, p)
            row.append("behind the lens" if r is None else f"{r[0]:6.1f} % across {r[1]:6.1f} % down  {r[2]:5.2f} away")
        print(f"  {name or xyz:<16}", "   ->   ".join(row))
