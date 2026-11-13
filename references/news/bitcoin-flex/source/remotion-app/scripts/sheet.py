"""Tile review stills into one contact sheet.

    python scripts/sheet.py <dir with *.jpeg> <out.jpg> [--cols 4] [--width 300]

Each tile is labelled with its file name (the frame number), so a remark about the sheet can name a frame.
"""
import argparse
import glob
import os

from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--cols", type=int, default=4)
ap.add_argument("--width", type=int, default=300)
a = ap.parse_args()
files = sorted(glob.glob(os.path.join(a.src, "*.jpeg")) + glob.glob(os.path.join(a.src, "*.png")))
files = [f for f in files if "sheet" not in os.path.basename(f)]
if not files:
    raise SystemExit("no stills in " + a.src)
tiles = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    label = os.path.splitext(os.path.basename(f))[0].replace("element-", "f")
    d.rectangle((0, 0, 8 + 7 * len(label), 14), fill=(0, 0, 0))
    d.text((4, 1), label, fill=(255, 255, 0))
    tiles.append(im)
h = max(t.height for t in tiles)
rows = -(-len(tiles) // a.cols)
sheet = Image.new("RGB", (a.cols * a.width, rows * h), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % a.cols) * a.width, (i // a.cols) * h))
sheet.save(a.out, quality=88)
print(a.out, sheet.size, len(tiles), "tiles")
