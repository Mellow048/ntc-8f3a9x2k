# The Dark Day (May 19, 1780) — delivery notes

**Composition:** `DarkDayShort` · 1740 frames @ 30 fps · 58.000 s · base canvas 1080×1920 · delivered at **720×1280** (per delivery order; 2K proved infeasible on CPU-only CI runners: ~5 s/frame, a 2K render of this pipeline exceeds the job cap).
**Render:** GitHub Actions (SwiftShader, concurrency 2) — see `.github/workflows/render-short.yml`. Artifact: `cartoon-3d-short` (final.mp4 + still.png), 14-day retention.

## Caption/subtitle override (explicit flag)

**Burned-in English captions are rendered into the picture** (`Subtitles.tsx`, built from
`voice/words.json` — 157 words, cues split at sentence punctuation and into ≤2 visual lines of
≤56 chars). This short ships with captions **by user order**, overriding the
no-burned-captions gate. Viewers cannot disable them.

## Audio (verified on the committed master and on the delivered render)

`audio/mix.wav` · 48 kHz stereo · voice-09 (locked; audition batches 00–07 rejected).
Master: **I = −15.1 LUFS · LRA 2.7 LU · true peak −1.20 dBTP** (ffmpeg ebur128).
Delivered MP4 after AAC transcode: **I = −15.2 LUFS · LRA 2.7 LU · peak −1.1 dBFS** — "in loudness
range, peak ≈ −1 dBTP" ✓. Music bed ducked −3 dB under speech; cues in `audio/cues.md`.
Silences flagged by QA: 31.28 s (0.30 s, rhetorical pause) and 57.48 s (0.52 s, tail of mix) — both intentional.

## Picture QA (CI frame-by-frame, `templates/scripts/short_qa.py`, run 42787443537)

- SPECS 720x1280 30 fps, 1740 frames, 58.000 s ✓ (AAC 48 kHz stereo ✓)
- No unplanned white frames ✓ · no frozen spans ≥12 f ✓ · no unplanned black except below
- **Defect found & fixed:** shot 8 (tree-cookie evidence, f1400–1564) was near-black — the sun preset
  (sunAz 62°) put the scar-ring cap in backlight; a 20-frame black span was flagged (f1535–1554).
  Root cause fixed in commit `2221077` (sunAz 172° — FRONT key on the cap). 
- Shot-8 median luma 0.045 → expected ≥0.15 after fix (to confirm in the re-render's QA report).
- Frame-diff spikes at cut boundaries (f322/324/806/…) and `POPS` at planned beats — expected cut signatures, not defects.

## Known constraints

- Rendered CPU-side (SwiftShader) — very slow; ~3 h for 720p on the slow runner class.
- `Supermarket` and the pendulum reference are NOT modified; `Root.tsx` registration is additive only.
- Captions/word timing are bound to the committed voice-09 mix; re-timing requires a mix re-render.
- 2K remains out of reach on CI (infeasible within runner time limits); 1080p is the next step up if the runner class improves.

## Re-render after shot-8 fix

Run 42813335357 (720p, commit `2221077`, still preview at f1535) is the delivery render;
QA summary will be updated here on completion.
