# The Dark Day (May 19, 1780) — delivery notes

**Status:** render pipeline fixed and re-running (2K first, per delivery order; 1080 → 720 fallback if CI times out on 2K).
**Composition:** `DarkDayShort` · 1740 frames @ 30 fps · 58.000 s · base canvas 1080×1920 · final 1440×2560 (2K).

## Caption/subtitle override (explicit flag)

**Burned-in English captions are rendered into the picture** (`Subtitles.tsx` + `voice/words.json`,
158 cues, verbatim from the locked voice-09 mix). This short ships with captions **by user order**,
overriding the no-burned-captions gate. Delivery consumers cannot disable captions.

## Audio

`audio/mix.wav` · 48 kHz stereo 24-bit · **I = −15.1 LUFS · LRA 2.7 LU · true peak −1.20 dBTP**
(verified with ffmpeg ebur128 on the committed master; cues in `audio/cues.md`).
Voice = voice-09 (locked; audition batches 00–07 rejected). Music = original bed, −3 dB duck under speech.

## Picture QA (from CI `diag/qa-<run_id>` branch)

(pending — filled in from the CI QA report of the final delivered render)

## Known constraints

- Rendered CPU-side (SwiftShader, GitHub ubuntu-latest): 1740 frames is ~2 h at 2K; job cap 180 min.
  If the 2K job times out, the deliverable is re-dispatched at 1080 (fallback step 1), then 720 (step 2).
- `Supermarket` and the pendulum reference are NOT modified. `Root.tsx` registration is additive.
- Subtitles/word timing match the committed voice mix; no re-timing after delivery without a mix re-render.
