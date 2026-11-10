# Curiosity shorts — first cuts

Rendered entirely on GitHub Actions on branch `arena/044538ca-ntc-8f3a9x2k`.
Successful batch: https://github.com/Mellow048/ntc-8f3a9x2k/actions/runs/42750185540

| Short | MP4 | Duration | Integrated loudness |
|---|---|---:|---:|
| London Beer Flood | `curiosity-beer/curiosity-beer.mp4` | 36.333 s | −15.1 LUFS |
| Lake Peigneur | `curiosity-lake/curiosity-lake.mp4` | 36.900 s | −15.1 LUFS |
| Tsutomu Yamaguchi | `curiosity-survivor/curiosity-survivor.mp4` | 42.033 s | −14.9 LUFS |

All: 720×1280 vertical, 30 fps, H.264 + AAC stereo 48 kHz; peak −1.5 dBFS.
Arena TTS selected narrator, original synthesized score/SFX, 1–2-word animated
subtitles. Subtitle change times come from forced alignment of the approved
transcripts. Scripts and sources live in `shoots/curiosity-*/SCRIPT.md`.

## Checks completed

- Shared `npm run typecheck` passes without modifying shared configuration.
- Every frame belongs to exactly one shot; camera coordinates finite throughout.
- CI scans every exported frame: no black, unplanned white, frozen ≥12-frame
  spans, or unplanned pop flags in any short.
- Loudness and 720p/30fps/audio specs pass for each final MP4.
- Preview frames and final contact sheets reviewed for readability.
- These are first cuts for human viewing, not a claim of frame-perfect historical
  reconstruction or fully hand-corrected phoneme alignment. The survivor's brief
  train views have foreground-tree overlap and could benefit from a framing
  polish pass if requested.

The supermarket project, original entry points, original workflows, templates,
package files and all pre-existing repository files were left unchanged.
Transient silent checkpoints and reproducible music/SFX stems are not part of
the final tracked delivery; the approved voice and exact premix remain committed.
