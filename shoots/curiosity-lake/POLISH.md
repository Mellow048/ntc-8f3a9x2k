# Lake Peigneur — music and ending polish

Scope: user's remaining two complaints, not a new 3D rebuild. Beer and
Yamaguchi and the prior Lake delivery are unchanged. New output is isolated
under `deliveries/lake-polished/`.

- New original 112 BPM investigative/adventure score, major/add9 colours,
  warm resonators and string pulses instead of the prior gloomy drone bed.
- Music is calibrated **after ducking** at 5–6 LU below the Arena narration,
  rather than 9–11 LU. This is a measurable increase in relative level, not
  just a louder master. Subjective normal-volume approval is still needed.
- Original Arena voice retained. A 0.5-second rhetorical pause follows
  “the mine”; no new word “Well” was synthesized. One-second picture/music
  tail and resolving final cadence replace the abrupt stop.
- Existing captioned picture retimed with the audio, not rerendered in 3D.
  Final output uses one CRF15 H.264 re-encode and AAC256, 720×1280/30fps.
  Duration 38.4 seconds / 1152 frames. The previous MP4 remains available.
- Inspected ending frames from first polish export; corrected pause boundary
  one frame earlier so “THE MINE” holds during the pause, not “DID NOT”.
- Final master target -14 LUFS / -2 dBTP before AAC, leaving codec headroom.
  Actual encoded loudness is recorded in `loudness.txt` (input_* fields).

Workflow: `.github/workflows/lake-polish.yml`. No full Remotion job required.
