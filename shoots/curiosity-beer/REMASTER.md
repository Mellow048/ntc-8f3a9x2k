# Beer Flood — focused visual remaster

Only Beer Flood is being revised. The approved Arena narrator, words/timing,
36.333-second runtime, 1–2-word subtitles and 720×1280 GitHub-only rendering are
retained. Lake Peigneur, the survivor short and the other agent's projects are
unchanged.

## Reference actually studied

Read-only reference branch: `arena/2524fc8a-ntc-8f3a9x2k`, commit
`f2d9d2f1676650371b4c2f28d2b917e5ad2c137d`.
Video: `shoots/pendulum/final-720p.mp4` (Taipei 101).
Studied video frames plus `Pendulum.tsx`, `world.ts`, `build.ts`, `story.ts`.
No switching to, editing, merging or pushing that branch.

## What was wrong with version one

- Toy-like repeated houses and oversized texture seams instead of dressed sets.
- Flat lighting; no enabled shadow-map pipeline in the original curiosity canvas.
- No genuinely curved/detailed hero vat, convincing foam flow, or architectural depth.
- Distant figures and weak framing; some compositions left too much empty ground.
- A clean automated QA report was incorrectly treated as sufficient visual quality.

## Rebuild, not upscale

Independent renderer: `remotion-app/src/beer-remaster/index.tsx`.

- Reused the Taipei renderer's actual MIT style modules in an isolated `style/`
  folder: painted HD textures, two-tone/card shading, light palettes, ink, lens,
  grade and the character drawing library.
- Restored MSAA 4 and the complete post order: ink → lens pre → lens main →
  bloom → neutral tone map → grade. No grain. Focus uses axial eye/subject depth.
- Enabled real 2048px directional shadow maps, frozen camera-relative lighting,
  tinted character shading, gradient sky, painted clouds and matching horizon fog.
- Built Georgian terraces with painted brick, shutters, 3D sash frames/sills,
  cornices, slate roof planes, chimney pots, doorsteps, light wells and lanterns.
- Built a curved 36-stave hero vat with six riveted iron bands, visible porter,
  a ladder, catwalk and timber warehouse trusses; ring failure and stave rupture
  land just before the narrated words.
- Replaced flat brown-floor/ellipse effects with a deforming fluid surface,
  traveling crest, flowing painted foam, moving flotsam and masonry trajectories.
- Rebuilt the cellar, eight-candle memorial and dressed tax-office desk.
- Reframed every shot; retained slow dolly motion and deterministic posing.
- Batched static architecture by material to retain the dressing without
  thousands of SwiftShader draw calls per frame.

## Visual gate before full render

All 11 shots were rendered as stills on GitHub. Initial checks caught clipped
figures and candle/face overlap; these were corrected, then all 11 were rendered
again. Preview gate runs:
- https://github.com/Mellow048/ntc-8f3a9x2k/actions/runs/42759602240
- https://github.com/Mellow048/ntc-8f3a9x2k/actions/runs/42759996245

TypeScript and an exhaustive 1,090-frame shot/camera invariant check passed.
The full render is a separate manual dispatch, never an automatic expensive
render after each source edit. Workflow: `.github/workflows/beer-remaster.yml`.
Transient picture checkpoint is published before audio mux/QA to avoid losing
rendered work to a packaging failure. Final video/QA are isolated under
`deliveries/beer-flood-remastered/`.

## Completed delivery

Full GitHub render succeeded in 41m22s:
https://github.com/Mellow048/ntc-8f3a9x2k/actions/runs/42760424384

Final: `deliveries/beer-flood-remastered/beer-flood-remastered-720p.mp4`
(28,679,023 bytes). 720×1280, 30 fps, 1,090 frames, 36.333 seconds,
AAC stereo 48 kHz, −15.1 LUFS, peak −1.5 dBFS.

Reviewed a 72-frame contact sheet extracted from the actual final MP4. QA found
no black/white frames, frozen spans or silence. Its one difference-spike warning
at frame 479 was separately inspected across frames 476–481: the animated foam
crest passes out of the foreground, revealing brown water; no discontinuity or
render corruption was visible. It remains disclosed in the unedited QA report.
The redundant picture-only checkpoint is retained locally but untracked now
that the muxed delivery has been verified. User aesthetic acceptance remains
separate from these technical checks.

## User-directed motion and music revision

The user identified sluggish pacing, water-walking figures and inaudible music.
New edit has 22 camera beats with reaction/detail inserts, stronger dollies,
low water-level views and overhead changes. Wading figures stay below the
surface; a world-space shader clips cards against the same wave equation as the
water. Moving contact wakes/splashes anchor them. Retreating/wading poses and
vat-worker escape replace standing figures. The memorial retains restraint.

Motion proof run 42766826102 succeeded; inspected its 110-frame wading excerpt
and 22 editorial-beat stills. This showed submerged bodies, changing poses,
contact ripples and clear angle changes. Moved the rescue lantern farther from
the face after review, and widened the final reverse angle.

Score now uses the studied Taipei short's DSP/instrument primitives (isolated
copies) with an original D-minor 132 BPM arrangement: plucked bass, chord
responses, glock motif, brass/tension, percussion, subdued vibes for the human
cost, and a returning tax-coda motif. Measured music-to-voice targets AFTER
smooth ducking are −7.5 to −8.5 LU in the active sections, −12 LU for human cost
and rescue, −17 LU briefly for memorial. This is not a fixed gain increase on
the old sine-pluck loop. Added timed metallic failure, timber/masonry, water
and coin effects. Source Arena voice/timing unchanged. Score/stems regenerate
from Python in ignored out/remaster/audio; CI masters the new premix.
