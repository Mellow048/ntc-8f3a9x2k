# Köpenick — music revision v2

SPECS 720x1280 30/1 fps, 2090 frames, 69.667 s; audio: aac 48000 Hz 2ch
LOUDNESS I:         -14.54 LUFS | LRA:         2.10 LU | Peak:       -1.41 dBFS
SILENCES none (new candidate decoded; threshold -45 dB, minimum 0.35 s)
FRAMES 2090; black []; unplanned white []; frozen spans >=12f []

## Audio-only change and checks

- User liked the story/picture/comedy; found the v1 rhythm distracting and hard
  to follow. Explicit correction: **do not make the music quieter**; improve
  the beat because music supports retention. V2 has not been user-approved.
- New Python composition: 112 BPM, continuous 4/4; kick 1/3, backbeat 2/4,
  quiet eighth subdivisions within the drum arrangement, pizzicato bass/chords
  and a sparse damped-mallet hook. No fife, offbeat march snare, rhythmic echoes
  or section-based clock resets. The music stem itself is not turned down.
- Same per-section music/voice targets after ducking as v1. Measured v1 music
  -24.491 LUFS vs v2 -24.528 LUFS (0.037 LU difference); voice -18.900 LUFS.
  V2 music/voice difference -5.628 LU. Same master target, -14.5 LUFS.
- 64 kicks and 64 backbeats checked on the uninterrupted 112 BPM grid;
  actual synthesized drum transients also checked against preceding troughs.
  These tests establish timing, not whether a listener finds it enjoyable.
- Resolved tonic at 68.571 s, after final word at 68.44 s, before the existing
  69.667 s ending. No visual retiming or caption changes.
- Two-pass mastering, then AAC 192k encoding; measured the actual muxed AAC.
- Full candidate decoded with ffmpeg `-xerror`: no decode errors, 2090 frames,
  stereo 48kHz. Video packets SHA-256 match the preceding delivery exactly:
  `dea554da10021a06012947ed7859081ac6cf583873e80b88ee68555918c0305e`.
  Prior black/white/freeze and visual reviews below therefore still apply to
  identical picture. No second 3D render or lossy picture encode was performed.
- MP4 SHA-256:
  `4167efa884652be33fd8f92181d53d60c83ecfa1a23fe29664193476741334a6`.
- Machine-readable new results: `music-v2-qa.json`.
- **Agent did not listen.** User playback is needed to judge the revised groove.

## Historical v1 QA — preserved, not new v2 audio measurements

SPECS 720x1280 30/1 fps, 2090 frames, 69.667 s; audio: aac 48000 Hz 2ch
LOUDNESS I:         -14.6 LUFS | LRA:         2.0 LU | Peak:       -1.5 dBFS
SILENCES none
FRAMES 2090; black []; unplanned white []; frozen spans >=12f []
POPS (unplanned frame-diff spikes > 3x local median): [356, 357, 358]
MOTION mean diff 2.97; frames with diff<0.3 (held): 0 (0%)

PER SHOT  (luma mean / std / p2 / p98 / saturation mean, medians over the shot)
  shot  1 f0-151: 0.440 / 0.269 / 0.072 / 0.872 / 0.520
  shot  2 f152-303: 0.503 / 0.171 / 0.096 / 0.875 / 0.612
  shot  3 f304-347: 0.462 / 0.177 / 0.070 / 0.869 / 0.573
  shot  4 f348-447: 0.423 / 0.170 / 0.095 / 0.852 / 0.700
  shot  5 f448-523: 0.455 / 0.194 / 0.053 / 0.854 / 0.578
  shot  6 f524-598: 0.600 / 0.213 / 0.102 / 0.881 / 0.329
  shot  7 f599-666: 0.601 / 0.215 / 0.087 / 0.879 / 0.336
  shot  8 f667-765: 0.574 / 0.235 / 0.056 / 0.886 / 0.344
  shot  9 f766-849: 0.429 / 0.229 / 0.063 / 0.830 / 0.601
  shot 10 f850-927: 0.440 / 0.250 / 0.097 / 0.851 / 0.534
  shot 11 f928-980: 0.564 / 0.232 / 0.076 / 0.866 / 0.341
  shot 12 f981-1119: 0.524 / 0.176 / 0.093 / 0.935 / 0.626
  shot 13 f1120-1162: 0.489 / 0.175 / 0.069 / 0.869 / 0.643
  shot 14 f1163-1243: 0.488 / 0.175 / 0.067 / 0.870 / 0.644
  shot 15 f1244-1294: 0.492 / 0.167 / 0.113 / 0.883 / 0.611
  shot 16 f1295-1382: 0.514 / 0.252 / 0.094 / 0.900 / 0.554
  shot 17 f1383-1461: 0.456 / 0.273 / 0.073 / 0.869 / 0.501
  shot 18 f1462-1488: 0.675 / 0.218 / 0.202 / 0.901 / 0.223
  shot 19 f1489-1570: 0.537 / 0.212 / 0.126 / 0.900 / 0.522
  shot 20 f1571-1628: 0.521 / 0.218 / 0.078 / 0.899 / 0.544
  shot 21 f1629-1695: 0.498 / 0.142 / 0.134 / 0.697 / 0.648
  shot 22 f1696-1739: 0.397 / 0.199 / 0.032 / 0.850 / 0.486
  shot 23 f1740-1781: 0.597 / 0.232 / 0.096 / 0.900 / 0.368
  shot 24 f1782-1821: 0.524 / 0.188 / 0.127 / 0.898 / 0.554
  shot 25 f1822-1906: 0.489 / 0.193 / 0.066 / 0.846 / 0.502
  shot 26 f1907-2089: 0.427 / 0.256 / 0.079 / 0.866 / 0.522

## Visual review of the finished export

Decoded and inspected 28 shot/start/end samples and 139 samples at 2 fps
from this actual MP4, not only the source preview frames. Inspected frames
352–360 individually after the automatic detector flagged 356–358. They show
the intentionally falling coat entering the counter shot and smoothly landing;
not a dropped frame, unexplained cut or rendering flash. Original flags above
are preserved rather than suppressed after the fact.

Picture sampling covered troop halt/follow, face clearance in the train,
bath permission, warrant gesture, cash/receipt, escape, breakfast arrest, cell
bars, stage bow and the stationary bronze callback. The 1.227-second resolved
ending remains after the final word; the last sampled frame is intact.

Audio was measured, not listened to by the agent. Human playback review and
user approval are still pending. This is a technical pass and a frame-sampling
review, not a claim that every frame was watched in real time.
