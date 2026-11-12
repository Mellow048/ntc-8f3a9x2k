#!/usr/bin/env python3
"""Put a preserved news short back into a working checkout, ready to look at, change and render.

    python references/news/restore.py <slug> [--mix] [--force] [--shared]        (slugs: the folders beside this file)

The folders in references/news/ are frozen: nothing is edited or built inside them. This copies one film out:

  1. its film folder (remotion-app/src/videos/<film>/) and its shoot folder (shoots/<shoot>/) go to their live paths.
     An existing folder is left alone unless you pass --force.
  2. shared machinery of the snapshot that the checkout lacks is added (review scripts, fonts, the render stack, the
     audio kit, the render workflow). A file that already exists is kept, and named if it differs; --shared takes the
     snapshot's copy instead. The live copies on main are the newest; a snapshot's are the ones its film was made with.
  3. the film is registered in remotion-app/src/Root.tsx, between the two "news:" anchors. A film that predates
     register.tsx (the first two) gets one written from its reference entry point.
  4. --mix runs the film's build_mix.py (NumPy and SciPy) and compares the result with the mix that went into the MP4.

Nothing is committed and nothing under references/ changes. To start a NEW film, restore the newest one
(binance-heist), check that it renders stills, then copy its two folders under new names and write your film in the
copies: see PLAYBOOK.md.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
ROOT_TSX = REPO / "remotion-app/src/Root.tsx"
ANCHOR_IMPORT, ANCHOR_COMP = "// news:imports", "{/* news:compositions"


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def register_from_entry(entry, film_dir, name):
    """a register.tsx for a film whose snapshot only has the standalone reference-entry.tsx"""
    imports = [l.replace(f"./videos/{film_dir}/", "./") for l in entry.splitlines() if l.startswith("import") and f"./videos/{film_dir}/" in l]
    comps = re.findall(r"^\s*(<Composition .*/>)\s*$", entry, re.M)
    main = next(re.search(r"component=\{(\w+)\}", c).group(1) for c in comps if "durationInFrames={TOTAL}" in c)
    review = f'<Composition id="{name}Review" component={{Review}} durationInFrames={{TOTAL}} fps={{FPS}} width={{1080}} height={{1920}} />'
    return "\n".join([
        "// Written by references/news/restore.py from the snapshot's reference-entry.tsx: this film predates register.tsx.",
        "import React from 'react';",
        "import {Composition, Freeze, getInputProps, useCurrentFrame} from 'remotion';",
        *imports,
        "",
        "/** Review stills in one browser page: output frame i shows film frame `frames[i]` (scripts/pick.sh). */",
        "const Review: React.FC = () => {",
        "  const i = useCurrentFrame(), list = ((getInputProps() as {frames?: number[]}).frames ?? [0]) as number[];",
        f"  return <Freeze frame={{list[Math.min(list.length - 1, i)]}}><{main} /></Freeze>;",
        "};",
        "",
        f"export const {name}Compositions: React.FC = () => (",
        "  <>",
        *[f"    {c}" for c in comps],
        f"    {review}",
        "  </>",
        ");",
        "",
    ])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--mix", action="store_true", help="run build_mix.py and compare with the mix of the approved file")
    ap.add_argument("--force", action="store_true", help="overwrite the film's live folders if they exist")
    ap.add_argument("--shared", action="store_true", help="overwrite shared files with this snapshot's copies")
    a = ap.parse_args()

    ref = HERE / a.slug
    if not (ref / "manifest.json").is_file():
        sys.exit(f"no such reference: {a.slug}. Choose from: " + ", ".join(sorted(p.parent.name for p in HERE.glob("*/manifest.json"))))
    man = json.loads((ref / "manifest.json").read_text())
    src = ref / "source"
    # Only what the manifest lists is the reference. Anything else found in the folder (node_modules after a type-check,
    # caches) is not, and is never copied.
    listed = sorted(f["path"][len("source/"):] for f in man["files"] if f["path"].startswith("source/"))
    film_dir = man.get("film_dir") or next(r.split("/")[3] for r in listed if r.startswith("remotion-app/src/videos/") and r.split("/")[3] != "pendulum")
    shoot = man.get("shoot") or next(r.split("/")[1] for r in listed if r.startswith("shoots/") and r.count("/") > 1)
    film, shoot_rel = f"remotion-app/src/videos/{film_dir}", f"shoots/{shoot}"

    for rel in (film, shoot_rel):
        if (REPO / rel).exists():
            if not a.force:
                sys.exit(f"{rel} already exists in this checkout. Pass --force to overwrite it with the reference's copy.")
            shutil.rmtree(REPO / rel)
    own = [r for r in listed if r.startswith((film + "/", shoot_rel + "/"))]
    for rel in own:
        (REPO / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src / rel, REPO / rel)
    print(f"copied  {film}/  and  {shoot_rel}/  ({len(own)} files)")

    added, kept = [], []
    for rel in listed:
        p = src / rel
        if rel in own or rel == "remotion-app/src/reference-entry.tsx":
            continue
        live = REPO / rel
        if not live.exists() or (a.shared and sha(live) != sha(p)):
            live.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, live)
            added.append(rel)
        elif sha(live) != sha(p):
            kept.append(rel)
    if added:
        print("added shared files:", ", ".join(added))
    if kept:
        print("kept the checkout's own (newer or different) copy of:", ", ".join(kept), "\n  (the film was made with the snapshot's copies; --shared takes those)")

    name = man.get("register")
    if not name:
        name = film_dir[:1].upper() + film_dir[1:] + "Compositions"
        (REPO / film / "register.tsx").write_text(register_from_entry((src / "remotion-app/src/reference-entry.tsx").read_text(), film_dir, name[:-len("Compositions")]))
        print(f"wrote   {film}/register.tsx (this film predates it)")
    reg = (REPO / film / "register.tsx").read_text()
    comps = re.findall(r'<Composition id="(\w+)"', reg)
    imp, comp = f'import {{ {name} }} from "./videos/{film_dir}/register";', f"      <{name} />"
    root = ROOT_TSX.read_text() if ROOT_TSX.exists() else ""
    if imp in root:
        print("already registered in src/Root.tsx")
    elif ANCHOR_IMPORT in root and ANCHOR_COMP in root:
        out = []
        for line in root.splitlines():
            out.append(line)
            if ANCHOR_IMPORT in line:
                out.append(imp)
            elif ANCHOR_COMP in line:
                out.append(comp)
        ROOT_TSX.write_text("\n".join(out) + "\n")
        print("registered in src/Root.tsx:", ", ".join(comps))
    else:
        print("src/Root.tsx has no news anchors. Add by hand, inside the fragment that Root returns:\n  " + imp + "\n  " + comp.strip())

    review = next((c for c in comps if c.endswith("Review")), "<Film>Review")
    film_comp = comps[0] if comps else "<Film>Short"
    if a.mix:
        r = subprocess.run([sys.executable, f"{shoot_rel}/audio/build_mix.py"], cwd=REPO, capture_output=True, text=True)
        mix = REPO / shoot_rel / "audio/mix.wav"
        if r.returncode or not mix.exists():
            print("build_mix.py failed:\n" + (r.stderr or r.stdout)[-600:])
        else:
            same = sha(mix) == man.get("mix_wav_sha256")
            print("mix.wav built:", "the same file that went into the approved MP4" if same else
                  "NOT byte-identical to the approved mix (another NumPy/SciPy can move the last bit; compare the levels in cues.md)")
    print(f"""
next:
  (cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
  {'' if a.mix else f'python {shoot_rel}/audio/build_mix.py        # NumPy + SciPy; the workflow needs audio/mix.wav' + chr(10) + '  '}cd remotion-app && REVIEW={review} REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,900 540
  gh workflow run render-short.yml --ref <branch> -f composition={film_comp} -f mix={shoot_rel}/audio/mix.wav \\
     -f shots={shoot_rel}/qa-shots.json -f publish='{shoot_rel}/final-{{size}}p.mp4' -f size=720 -f chunks=20     # after commit and push""")


if __name__ == "__main__":
    main()
