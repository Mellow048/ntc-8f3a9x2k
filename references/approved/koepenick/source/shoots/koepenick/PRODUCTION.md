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

## Original delivery (v1)

- Full render run **42939517026** succeeded in 56m31s.
- Delivery commit **6b096c8**, file
  `deliveries/koepenick/koepenick-720p.mp4` (81,973,701 bytes).
- SHA-256: `35d7856d322332be7e6741a9a4500a1a6ce04a4f97a7c525df4264a245536aad`.
- Finished MP4: 720×1280, 30 fps, 2,090 frames, 69.667 s, AAC stereo 48 kHz.
- Finished loudness: **-14.6 LUFS**, **-1.5 dBTP**, LRA 2.0 LU.
- No detected silences, black, white or >=12-frame frozen spans.
- Three motion-spike flags (356–358) individually checked in the decoded MP4:
  they are the intentionally falling coat, with continuous motion. The
  original detector report and review addendum are saved beside the MP4.
- Visually inspected 28 decoded final-picture samples and 139 samples at
  2 fps spanning the film. Source stills alone were not used for final review.
- **Audio not listened to by the agent; user playback/approval pending.**

Diagnostics were converted from PNG to compact JPEG after the review to
avoid retaining about 40 MB of intermediate lossless stills in the patch.
The delivered MP4 was not re-encoded or changed by this storage cleanup.

## Reproduce
- `python scripts/koepenick/plan.py` regenerates timing, shot plan and QA edits.
- `node scripts/koepenick/test.mjs`
- Preview: dispatch existing `render-short.yml` on this branch with composition
  `Koepenick` and `still_frame=100` (all shots), or comma-separated frames.
- Full render: same dispatch, `still_frame=-1` (explicit reviewed-preview gate).
- Workflow produces and commits `deliveries/koepenick/koepenick-720p.mp4` and QA
  report on this branch; the other compositions keep their existing workflow.


## Current delivery — music v2, audio-only revision

User feedback: liked the film, found it funny and the story surprising; found
the background beat hard to follow and distracting. Their explicit follow-up
was **not quieter**: change the beat; music is a bridge to retention. Story and
picture are liked; this does not imply v2 music approval.

Replaced the 116 BPM section-reset syncopated fife/march arrangement with an
original 112 BPM continuous 4/4 groove in `audio/groove.py`: kick 1/3, backbeat
2/4, light eighths, pizzicato bass/chords, sparse repeating damped-mallet hook.
Meter never restarts at a spoken beat. No rhythmic echoes or fife. Harmony and
instrument density change at bar boundaries, with a final tonic after the
last word. Narration source, captions, action timing and picture unchanged.
Foley synthesis/cue timings retained, with its RNG now independent of score.

**Not a volume workaround:** same section loudness targets. Original music
-24.491 LUFS; v2 -24.528 LUFS (difference 0.037 LU). Voice -18.900 LUFS.
Finished AAC -14.54 LUFS / -1.41 dBTP / LRA 2.10 LU. Checked all drum events
on the global grid and the rendered drum attacks. Full decode passes, no
>=0.35-second silence at -45 dB. All 2090 compressed picture packets hash
identically to v1: inherited picture review remains valid.

Current file is `deliveries/koepenick/koepenick-720p.mp4`. Previous version
remains available at commit `6b096c8`, not duplicated as another 79 MB file.
New measurements: delivery `music-v2-qa.json` and `qa-report.md`.
**Agent cannot listen; new music awaits user playback/approval.**

Rebuild music/remux without rendering picture again:
```
python shoots/koepenick/audio/score.py
python scripts/koepenick/remix.py --publish
```
Requires numpy/scipy and ffmpeg (`FFMPEG`, PATH, or imageio-ffmpeg). The remux
checks before replacing the delivery. Ignored candidates/stems live under
`shoots/koepenick/out/audio/`; do not commit them or rerender the accepted film.
