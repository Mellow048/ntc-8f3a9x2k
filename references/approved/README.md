# Approved original-film references — watch, then read the implementation

These are **the user's own approved originals**, not the unrelated third-party
style-study images elsewhere in `references/`. All MP4s and source snapshots
are stored here on `main`; they do not depend on a surviving branch link.

News shorts are a separate category with their own reference:
[`../news/`](../news/README.md). Use it only when the user asks about real-life
news; for the regular shorts this library is for, ignore it.

| Film | Video | Source / guide | Role |
|---|---|---|---|
| Taipei 101 — The Giant Golden Ball Inside Skyscrapers | [final-720p.mp4](taipei-101/final-720p.mp4) | [Study and reproduce](taipei-101/README.md) | Primary approved care/look/storytelling benchmark |
| Köpenick — The Shoemaker Who Borrowed an Army | [final-720p.mp4](koepenick/final-720p.mp4) | [Study and reproduce](koepenick/README.md) | Fully approved story/visuals/narration/pacing/music-v2; people-driven history and clear audible groove |
| London Beer Flood | [final-720p.mp4](beer-flood/final-720p.mp4) | [Study and reproduce](beer-flood/README.md) | Accepted motion/detail revision; closest example from the curiosity batch |

Köpenick's approval covers the **music-v2** export, not the initial busy score.
Read its [approval record](koepenick/APPROVAL.md). Its guide connects specific
shots to source and explains the music revision: a clearer beat at unchanged
music level, not a quiet-music workaround. All three regular references must
be studied as films **and source**, not treated as a menu of ready-made assets.

## What agents must study

1. Watch the opening, an explanation/action transition, character reaction,
   mechanism/physical contact and ending. Identify what changes, not merely
   where the camera goes.
2. Read `story.ts`, world/set construction, characters and post stack. Inspect
   how recognizability comes from functional shapes, material detail, lights,
   scale and staging—not labels attached to primitive blocks.
3. Read the audio-generation/mix code. Reuse techniques, **not the music**.
   Each new film needs a distinct score that is audible at normal volume.
4. Follow today's [release gates](../../IMPORTANT.md). References are not
   perfect or blanket exemptions: old resolution/caption settings, filenames,
   hard-coded historical branches and old mix targets are provenance only.

## Preservation / reproducibility

Each folder has the original MP4, `source/` preserving original repository
relative paths, and a SHA-256 manifest with the source commit and origin video
path. A standalone registration adapter removes unrelated-film dependencies
from Taipei's old multi-film root. Köpenick also has standalone registration
scaffolding with no unrelated-film imports. Renderer/animation source is unmodified.
Beer includes the legacy subtitle module's complete local dependency closure;
that code is a dependency, **not an endorsement of the rejected first cuts**.

Saved narration and word timestamps are included. Scores are regenerable from
included Python source; transient mix WAVs, checkpoints, other films' exports,
node_modules and diagnostic PNGs are omitted. Workflow snapshots nested under
`source/.github/` are inert historical recipes; do not push to their old branch
names or run them blindly. Use your platform-assigned branch for new work.

Run `python references/approved/verify.py` to verify file checksums. Restore
new films separately; do not edit these approved snapshots as scratch projects.
Deleting branches will not remove these tracked reference files from `main`.
