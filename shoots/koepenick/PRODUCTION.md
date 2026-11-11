# Köpenick production checkpoint

## Authorization
The user said “then go make the mp4” after hearing the voice was the only
completed asset. Proceeding with the selected Arena narrator and the existing
68.63 s take. No claim that the user separately approved its pronunciation.

## Implemented
- 26 distinct action beats, 2,090 frames (69.667 s), 720×1280 / 30 fps.
- New procedural architecture, props, Prussian helmet, peaked cap, officer's
  coat and gloves; shared painted/ink rendering library studied in both originals.
- 231 written / 235 spoken words, 123 caption groups of at most two words.
- New 116 BPM D-major/B-minor score and frame-locked synthesized foley.
- Soft peak control on narration; music balanced after it and after ducking,
  5.5–6 LU below voice (7 LU in the short prison section).

## Preview review actually performed
Three CI diagnostic runs, successful:
- 42937683514: all shots. Found clipping at edges, seated face occlusion,
  hero face obscured by desk, a flat seated mug height, and audience obstruction.
- 42938504993: reviewed revisions of every shot. Fixed the remaining bath
  and treasury framing and enlarged the treasurer relative to the chest.
- 42939187938: before/after glove halt, bath permission, coin fall, arrest /
  prison cut, and statue ending. Visually inspected the resulting PNGs,
  including the full-resolution halt. The glove lifts, soldiers halt, coins
  travel from box to bag, bars close, statue is stationary (no blink).

`npm run typecheck --prefix remotion-app` PASS.
`node scripts/koepenick/test.mjs` PASS: contiguous shots, words in order,
caption grouping, deterministic action endpoints, 1.227 s after the last word.

Local audio-only measurement, including a test AAC encode: -14.6 LUFS,
-1.5 dBTP, LRA 2.0 LU. The agent cannot listen; these are measurements only.

## Current stage
Full GitHub Actions render is requested after the diagnostic gate. The MP4
does not exist yet. After it completes: fetch the branch, run/read technical
QA, inspect samples of the *finished* MP4, present the file, and record the
actual delivery commit and anything still unresolved.

## Reproduce
- `python scripts/koepenick/plan.py` regenerates timing, shot plan and QA edits.
- `node scripts/koepenick/test.mjs`
- Preview: dispatch existing `render-short.yml` on this branch with composition
  `Koepenick` and `still_frame=100` (all shots), or comma-separated frames.
- Full render: same dispatch, `still_frame=-1` (explicit reviewed-preview gate).
- Workflow produces and commits `deliveries/koepenick/koepenick-720p.mp4` and QA
  report on this branch; the other compositions keep their existing workflow.
