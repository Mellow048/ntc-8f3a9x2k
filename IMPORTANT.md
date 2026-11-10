# IMPORTANT — Cartoon 3D short rules

> **Read [VIDEO_HANDOFF.md](VIDEO_HANDOFF.md) first for the user's current requirements and production checkpoint.** The user explicitly overrides two legacy gates below: **720×1280 exports only** (not 2K) and **synchronized changing 1–2-word subtitles** (not no captions). Later explicit user instructions take precedence over historical template defaults.

These are release gates for every short in this repo. They sit **on top of**
the vendored `SKILL.md` (`cartoon-3d-short`) — where the two disagree, the
skill's proven look values win for style, these rules win for process.

## 0. What this repo is

A vendored copy of the `cartoon-3d-short` skill (MIT, upstream:
`mromidev/claude-animated-shorts`) plus our production wrapper: rules, CI,
GitHub rendering. The skill + `templates/bridge/` is the renderer and the
look. This file is the process gate.

## 1. Non-negotiables (from the skill)

- **No captions or labels in the video.** The voice carries the story.
- English only. One steady voice tone.
- Voice timed to `words.json`; every visual reaction lands 0–3 frames
  before its word.
- Shot plan lives in `story.ts` (`SHOTS`, `CAMS`, `KICKS`, `DOF`,
  `FOREGROUND`) — there is no other shot list.
- Final export **2K vertical 1440×2560**, H.264 CRF 16, scale 1.3333.
- Save after every step. "Just do it" once the script is approved.

## 2. Look gate

- Start every short from `templates/bridge/`; the look is those values
  (light presets, ink, lens, post order, character proportions).
- Character proportions: ~3.5 head-heights, stem limbs, no blush, plum ink.
- Every hold creeps (push-in); no static hold ≥ 4 frames.
- DOF on ~1/3 of screen time, focus on the eyes; wides stay sharp.
- No film grain (reference measures none).
- Verify with side-by-side sheets against `references/frames/` before
  rendering the final.

## 3. Sound gate

- Synthesized SFX + original march score from `templates/audio/`, ducked
  under the voice. Standard mix: **music +3 dB, SFX −6 dB, voice unchanged**.
- `mix.wav` at 48 kHz, exact length. Lock picture timing first — any timing
  change means re-running the sound.

## 4. CI / rendering gate

- All rendering happens on **GitHub Actions** (see
  `.github/workflows/render-short.yml`). Never render 2K video on a laptop.
- `short_qa.py` must pass on the final MP4 (no black/white/frozen/pop
  frames, loudness in range) before delivery.
- One short per folder in `shoots/<slug>/`; voice files committed per short
  so CI can reproduce the render.

## 5. Release checklist

- [ ] Script approved, facts sourced in `SCRIPT.md`
- [ ] `voice.wav` + hand-fixed `words.json`
- [ ] `story.ts` complete, look values copied from the template
- [ ] Side-by-side look check done (sheets vs `references/frames/`)
- [ ] Still frame rate check, then `short_qa.py` clean on the final
- [ ] Muxed with voice at the standard mix, 1440×2560
- [ ] Delivered MP4 + notes
