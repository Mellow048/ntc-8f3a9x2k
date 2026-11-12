#!/usr/bin/env python3
"""Preserve an approved news short in references/news/<slug>/, the way the films already there are kept.

Run it from a working branch on which the film is finished, approved by the user, and committed:

    python references/news/make_reference.py <slug> --film-dir <folder under remotion-app/src/videos> \
        --shoot <folder under shoots> --register <Name>Compositions --title "..." --approval "User, <date>: ..." \
        --render-commit <commit that holds the MP4> --render-source-commit <commit the picture was rendered from> \
        --render-run <Actions run id> [--set key=value ...] [--replace]

It writes
    final-720p.mp4          the approved file, unchanged
    shots-NN-MM.jpg         one frame from the middle of every shot, cut from that file
    source/                 the film's source with its repository-relative paths, plus the shared machinery it needs
                            and a standalone entry point, so the folder type-checks and renders on its own
    manifest.json           SHA-256 of every file above, where it came from, and what restore.py needs
and leaves README.md (the study guide) to you: write it first, it is not generated.

audio/mix.wav is not stored (build_mix.py makes it again from the stored voice; its SHA-256 is recorded).
Needs Pillow and an ffmpeg (on the PATH, or the imageio-ffmpeg package). Check the result with verify.py.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent

# Machinery every news short uses. A snapshot carries its own copy so that it still builds when the live tree moves on.
SHARED = [
    ".github/workflows/render-short.yml",
    "remotion-app/package.json", "remotion-app/package-lock.json", "remotion-app/remotion.config.ts", "remotion-app/tsconfig.json",
    "remotion-app/public/fonts",
    "remotion-app/scripts/frame.mjs", "remotion-app/scripts/local-chromium.sh", "remotion-app/scripts/pick.sh", "remotion-app/scripts/plan.mjs",
    "remotion-app/scripts/sheet.py", "remotion-app/scripts/shots.mjs", "remotion-app/scripts/stills.mjs",
    "remotion-app/src/videos/pendulum/grade.ts", "remotion-app/src/videos/pendulum/ink.ts",
    "remotion-app/src/videos/pendulum/lensblur.ts", "remotion-app/src/videos/pendulum/toon.ts",
    "shoots/voice_master.py",
    "templates/audio/dsp.py", "templates/audio/instruments.py", "templates/audio/sfx_gen.py",
    "templates/scripts/aac_check.py", "templates/scripts/short_qa.py", "templates/scripts/word_margins.py",
]
SKIP = ("__pycache__", ".DS_Store")


def git(*a):
    return subprocess.run(["git", *a], cwd=REPO, check=True, capture_output=True, text=True).stdout.strip()


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def files_under(rel):
    p = REPO / rel
    if p.is_file():
        return [rel]
    return sorted(str(q.relative_to(REPO)) for q in p.rglob("*") if q.is_file() and not any(s in q.parts for s in SKIP))


def shot_sheets(mp4, shots, out_dir, cols=8, width=240):
    from PIL import Image, ImageDraw
    tmp = out_dir / ".frames"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    mids = [(s["a"] + s["b"] - 1) // 2 for s in shots]
    expr = "+".join(f"eq(n\\,{n})" for n in mids)
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(mp4), "-vf", f"select='{expr}',scale={width}:-1", "-fps_mode", "passthrough",
                    "-frame_pts", "1", "-q:v", "2", str(tmp / "f%05d.jpeg")], check=True)
    half = (len(shots) + 1) // 2
    made = []
    for lo, hi in ((0, half), (half, len(shots))):
        tiles = []
        for i in range(lo, hi):
            im = Image.open(tmp / f"f{mids[i]:05d}.jpeg").convert("RGB")
            d = ImageDraw.Draw(im)
            label = f"{shots[i]['id']:02d}  f{mids[i]}"
            d.rectangle((0, 0, 10 + 7 * len(label), 15), fill=(0, 0, 0))
            d.text((4, 2), label, fill=(255, 255, 0))
            tiles.append(im)
        h = max(t.height for t in tiles)
        rows = -(-len(tiles) // cols)
        sheet = Image.new("RGB", (cols * width, rows * h), (20, 20, 20))
        for k, t in enumerate(tiles):
            sheet.paste(t, ((k % cols) * width, (k // cols) * h))
        name = f"shots-{shots[lo]['id']:02d}-{shots[hi - 1]['id']:02d}.jpg"
        sheet.save(out_dir / name, quality=88)
        made.append(name)
    shutil.rmtree(tmp)
    return made


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--film-dir", required=True)
    ap.add_argument("--shoot", required=True)
    ap.add_argument("--register", required=True, help="the component exported by src/videos/<film-dir>/register.tsx")
    ap.add_argument("--title", required=True)
    ap.add_argument("--approval", required=True)
    ap.add_argument("--render-commit", required=True)
    ap.add_argument("--render-source-commit", required=True)
    ap.add_argument("--render-run", required=True, type=int)
    ap.add_argument("--video", default=None, help="the approved MP4 (default shoots/<shoot>/final-720p.mp4)")
    ap.add_argument("--set", action="append", default=[], metavar="key=value", help="extra manifest fields")
    ap.add_argument("--replace", action="store_true")
    a = ap.parse_args()

    dst = HERE / a.slug
    film = f"remotion-app/src/videos/{a.film_dir}"
    shoot = f"shoots/{a.shoot}"
    video = a.video or f"{shoot}/final-720p.mp4"
    register = (REPO / film / "register.tsx").read_text()
    assert f"export const {a.register}" in register, f"{film}/register.tsx does not export {a.register}"
    compositions = [c for c in __import__("re").findall(r'<Composition id="(\w+)"', register)]

    copied = SHARED + [film, shoot]
    dirty = git("status", "--porcelain", "--", *copied)
    assert not dirty, "commit these first, so that the snapshot is the tree of one commit:\n" + dirty
    origin = git("rev-parse", "HEAD")
    for c in (a.render_commit, a.render_source_commit):
        git("cat-file", "-e", c + "^{commit}")
    assert git("rev-parse", f"{a.render_commit}:{video}") == git("hash-object", video), "the MP4 in the working tree is not the one of --render-commit"

    if dst.exists():
        keep = (dst / "README.md").read_text() if (dst / "README.md").exists() else None
        assert a.replace or sorted(p.name for p in dst.iterdir()) in ([], ["README.md"]), f"{dst} exists; pass --replace to write it again"
        shutil.rmtree(dst)
        dst.mkdir()
        if keep is not None:
            (dst / "README.md").write_text(keep)
    else:
        dst.mkdir()

    src = dst / "source"
    for rel in copied:
        for f in files_under(rel):
            if f == video or f.endswith("/audio/mix.wav") or (f.startswith(shoot + "/final-") and f.endswith(".mp4")):
                continue
            (src / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(REPO / f, src / f)
    (src / "remotion-app/src/reference-entry.tsx").write_text(
        "// Reference-only standalone entry point: it registers what the film's own register.tsx declares.\n"
        f"// In a live checkout src/Root.tsx renders <{a.register} /> instead (references/news/restore.py adds that line).\n"
        "import {registerRoot} from 'remotion';\n"
        f"import {{{a.register}}} from './videos/{a.film_dir}/register';\n\n"
        f"registerRoot({a.register});\n")
    shutil.copy2(REPO / video, dst / "final-720p.mp4")
    shots = json.loads((REPO / shoot / "qa-shots.json").read_text())["shots"]
    sheets = shot_sheets(dst / "final-720p.mp4", shots, dst)

    changed = [f for f in git("diff", "--name-only", a.render_source_commit, origin, "--", *copied).splitlines()
               if (src / f).is_file()]
    mix = REPO / shoot / "audio/mix.wav"
    manifest = {
        "title": a.title,
        "origin_commit": origin,
        "origin_video": video,
        "origin_branch": git("rev-parse", "--abbrev-ref", "HEAD"),
        "render_commit": git("rev-parse", a.render_commit),
        "render_source_commit": git("rev-parse", a.render_source_commit),
        "render_run": a.render_run,
        "category": "news",
        "approval": a.approval,
        "film_dir": a.film_dir,
        "shoot": a.shoot,
        "register": a.register,
        "compositions": compositions,
        "adaptation": "Standalone entry point added (source/remotion-app/src/reference-entry.tsx); the live Root.tsx and index.ts, which "
                      "register other films too, are omitted. Every other file under source/ is copied without edits from origin_commit. "
                      "changed_since_render_source lists the copied files that differ from the tree the picture was rendered from. "
                      "audio/mix.wav is not stored: build_mix.py regenerates it from the included voice (mix_wav_sha256 is the file that "
                      "went into the MP4). The shot sheets were cut from final-720p.mp4. The render workflow is included as an inert recipe.",
        "changed_since_render_source": changed,
        "mix_wav_sha256": sha(mix) if mix.exists() else None,
    }
    for kv in a.set:
        k, v = kv.split("=", 1)
        manifest[k] = v
    paths = ["final-720p.mp4", *sheets] + sorted(str(p.relative_to(dst)) for p in src.rglob("*") if p.is_file())
    manifest["files"] = [{"path": p, "sha256": sha(dst / p), "bytes": (dst / p).stat().st_size} for p in paths]
    (dst / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{a.slug}: {len(paths)} files, {sum(f['bytes'] for f in manifest['files']) / 1e6:.1f} MB; origin {origin[:7]}; "
          f"{len(changed)} copied files changed since the render source; compositions {', '.join(compositions)}")
    if not (dst / "README.md").exists():
        print("write", dst / "README.md", "(the study guide) before you commit")


if __name__ == "__main__":
    sys.exit(main())
