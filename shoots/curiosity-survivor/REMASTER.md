# Idea #2 — Tsutomu Yamaguchi remaster

Scope: survivor short only. Beer Flood was accepted by the user and is frozen;
Lake Peigneur and all other agents' projects remain unchanged.

## Retained

Original approved Arena TTS recording, script and forced-aligned words. 1,261
frames / 42.033 seconds, 30fps, 720×1280. Synchronized animated 1–2-word captions.
Facts and sources remain in SCRIPT.md. Yamaguchi is NOT described as the only
person to survive both bombings. No invented dialogue or graphic injuries.
Sets and character drawings are stylized reconstructions, not archival images.

## New isolated production

- Entry: remotion-app/src/survivor-remaster/index.tsx, SurvivorRemastered.
- 24 narration-timed camera setups, continuous dolly/orbit motion, reaction
  inserts, rail journey and quieter testimony/remembrance pacing.
- Japanese timber/plaster houses, layered pitched roofs, 3D shoji lattice,
  tatami/futon room, office and recognition desk, public testimony microphone,
  damaged street, moving multi-car steam train and remembrance lanterns.
- Frame-deterministic walking, retreating, gestures, swaying, train movement,
  drifting smoke and floating lantern motion. Non-graphic bandage drawing.
- Reads accepted Beer renderer/character/DSP helpers without changing them.
  MSAA4, shadow maps, painted textures, ink, lens/bloom/tone/grade stack.
- Original restrained D-minor arrangement using the studied Taipei instrument
  primitives. Measured post-duck music is 9–13 LU below speech by section,
  rather than an inaudible generic loop. Train rhythm and subdued transition
  accents, no spectacular explosion sound or celebratory ending.

## Validation to date

TypeScript and exhaustive shot/camera invariants passed for all 1,261 frames.
Preview run 42775982880 succeeded; all 24 stills reviewed. Corrections: wider
train framing to prevent cropped heads, soft translucent smoke rather than
solid floating spheres, rounded distant hills rather than polygonal cones.
An initial dispatch was cancelled during preflight to fix the smoke-palette
TypeScript signature; no completed render was discarded. Refined previews in
run 42776524823 were pulled and inspected, including the corrected train shots.
Full render 42776524823 was running when this note was written. Final MP4 and
QA will publish to deliveries/survivor-remastered/. Do not confuse the original
v1 in deliveries/curiosity-survivor/ with this remaster.

Workflow: .github/workflows/survivor-remaster.yml. Preview-only on source push;
full 720p render requires stage=final. All frame rendering happens on GitHub.
