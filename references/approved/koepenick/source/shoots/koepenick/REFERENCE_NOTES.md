# Reference study for the Köpenick short

Notes from studying the two approved references (Taipei 101 and Beer Flood)
before building. Written 2026-11-10. This is a working note for whoever
builds the film, not a deliverable.

## What was actually studied

**Films.** Both `final-720p.mp4` files were viewed as one frame per second on
labelled contact sheets, plus a few full-resolution stills. Motion between
those frames was read from `story.ts`, not seen. Audio was measured
(loudness, peaks, pauses, pitch), never listened to: the agent cannot play
audio.

**Source read in full**

- Taipei: `story.ts`, `Pendulum.tsx`, `world.ts`, `cast.ts`, `build.ts`,
  `lights.ts`, `audio/timeline.py`, `audio/mix.py`, `audio/cues.md`,
  `SCRIPT.md`, `voice/words.json` (parsed).
- Beer: `story.ts`, `Beer.tsx`, `world.ts`, `cast.ts`, `water.ts`,
  `build.ts`, `index.tsx`, `sound/score.py`, `qa.py`, `stills.mjs`,
  `curiosity/Short.tsx` (the caption component), `curiosity/README.md`,
  `SCRIPT.md`, `REMASTER.md`, `voice/words.json` (parsed).
- Shared: `templates/scripts/short_qa.py`, the live
  `.github/workflows/render-short.yml`, `remotion-app` root files.

**Read in part**

- `toon.ts`: types, outfits, the expression table, hats, pose options
  (about 250 of 1,015 lines).
- `audio/music.py`: first 150 of 276 lines. `audio/sfx.py`: first 45 lines
  and the function list. Beer workflow: step list only.

**Header comments and exported names only**

- `shade.ts`, `cardshade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`,
  `paint.ts`, `dsp.py`, `instruments.py`, `sfx_gen.py`.

**Not read:** `curiosity/world.ts`, `curiosity/story.ts`, `curiosity/data.ts`
(legacy cuts, marked "not a quality benchmark"), lock files, the inert
workflow snapshot inside the Taipei reference.

## The two films in numbers

| | Taipei 101 | Beer Flood |
|---|---|---|
| Length | 65.50 s, 1,965 frames | 36.33 s, 1,090 frames |
| Narration | 226 words, 3.51 words/s, median pause 0.24 s | 91 words, 2.53 words/s |
| Shots / camera setups | 14 shots, 28 camera keys, about 2.3 s each | 11 shots, 22 beats, about 1.7 s each |
| Sets | 5 (atrium, city, office, boat, closet) | 6 (street, warehouse, wall, cellar, memorial, office) |
| Finished loudness | -15.0 LUFS, peak -1.2 dBFS | -15.2 LUFS, peak -1.4 dBFS |
| Captions | none (rule changed later) | 1–2 words, uppercase, at 73 % of height |

## How they are built

### Shared style stack

Eight files are byte-identical in both films (`cardshade`, `grade`, `ink`,
`lensblur`, `lights`, `paint`, `shade`, `toon`), and `dsp.py` and
`instruments.py` are identical in both sound folders. They are a library:
copy them unchanged into the new film's folder. `templates/bridge` has older
`paint.ts` and `toon.ts`; take the copies from the Taipei reference.

- Every world material goes through `twoTone()` (`shade.ts`): colour times a
  mix of shade colour and lit colour, driven by the real shadow map and a
  soft terminator. `world.ts` writes the `TONE` and `CHAR` uniforms every
  frame from `LIGHTS[light]`.
- Post order, fixed: ink → lens blur (pre, main) → bloom → neutral tone map
  → grade. MSAA 4. Grain off. Bloom: intensity 0.5, threshold 1.0, 6 levels.
- `InkPass` outlines the 3D world only. Anything on layer `NOINK` (3) is
  never outlined: character cards, effect sprites, sky, clouds, water.
- Pass primitives use `dispose={null}`. Do not dispose the ink pass by hand
  on unmount (it crashed a render once).
- Only two light presets exist: `day` and `golden`. The dark closet in
  Taipei is `day` dimmed to 0.62 and desaturated; Beer's dusk office is
  `golden` with the sun at 22°.
- Textures are painted on canvases and cached (`paint.ts`): cobbles, stone,
  planks, beams, brick, slate and tile roofs, grass, plaster and brick
  façades with windows, doors and shutters (`facadeHD`), clouds, water marks.

### Two scene architectures

- **Taipei: one world, all sets.** `World` builds the five sets once at
  separate offsets. `update(id, f, cam, scene)` sets the camera from
  `camAt`, the lights, and poses every moving rig from `sceneState(id, f)`.
  Crossfades render two `ThreeCanvas` layers at once.
- **Beer: one world per place.** `new World(place)` is rebuilt when the
  place changes and builds only that set. Each place registers a closure
  `(shot, f, u)`. `batchStatic()` then merges all static meshes by material,
  which matters on the CPU renderer.

Köpenick has about a dozen places, so it follows Beer: one world per place
with static batching. It takes Taipei's richer `story.ts` (camera keys,
word-frame constants, depth-of-field table) and Taipei's pooled cast.

### Sets: where the detail comes from

- Beer's terrace houses are a painted façade plus real geometry in front of
  it: glass, stone surrounds, sills, glazing bars, string courses, cornice,
  pitched slate roof, chimneys with pots, door case with steps and a brass
  knob, lamp bracket, cellar wells with railings, drainpipe. The comments
  say why: "shadows give depth", "not pyramid toy houses".
- The hero object is modelled from working parts: the vat is 36 separate
  staves, 6 hoops, 108 rivets, and the staves are what burst.
- Scale is shown with a ladder, a walkway and a figure next to the object.
- Taipei culls city blocks and trees along every camera sight line
  (`citySightLines`) so nothing blocks a shot.
- Rails and furniture are kept below face height on purpose
  ("crosses legs, never torsos/faces").

### Characters

- Flat cards drawn with Canvas2D (`toon.ts`), lit by `cardShade`, with a
  multiply contact blob on the ground. A card always turns to the camera.
- Taipei caches drawings by a pose key and quantises the pose (phase 1/24,
  tilt 0.5°, wave 1/12, look 0.1) so few textures are drawn. Resolution
  tiers by distance: 900×1500 under 4 m, 600×1000, 360×600, 210×350.
- Acting vocabulary: front view (stand, stroll, march, sit, fall), side view
  (march, stand, swing, push); 14 expressions; one raised arm (`wave`);
  lean; look direction.
- An expression change is hidden under a 4-frame blink (`swaps`) and lands
  2–3 frames before its word.
- **Already in `toon.ts` from the original bridge film:** soldiers with
  rifle and cross-belts, an officer with sash, sword and moustache, a
  marching side view, top hats, bonnets, caps.
- Beer keeps hand props as 3D objects that move with the actor (the
  lantern), not as drawn props.

### Timing and camera

- Every shot boundary and action is a named word frame. Actions start 0–3
  frames before the word. Beer derives cuts as `word start × 30 − 2`.
- The camera never rests: a slow push-in runs under every hold. Moves are
  22–34 frame glides. Big changes are hard cuts. Impacts get a 7-frame roll
  kick that flips sign each frame. Place changes may crossfade over 8 frames.
- Depth of field only on close-ups and inserts.
- The sun is frozen per shot relative to the camera, so a moving camera does
  not make shadows crawl.
- Beer clamps the camera above the flood surface. The equivalent here: no
  camera inside a wall or below a floor.

### Captions

`Subtitles` in `curiosity/Short.tsx`: pair two adjacent words when together
they are 13 characters or fewer and less than 0.32 s apart, never more than
two; show from 35 ms before the first word; pop from 1.09 to 1.0 over four
frames; Arial 900, 58 px, uppercase, white with a 2 px dark stroke, at 73 %
of the height. Faces must stay out of that band. QA must be told every
caption change as a planned transition or it reports pops.

### Sound

- `timeline.py` mirrors the picture's key frames so cues land on frames.
- Music is an original score written as sections that follow the story,
  each with its own instrumentation. Taipei: 120 bpm, F major, 8-bar motif.
  Beer: 132 bpm, D minor.
- Mix: voice untouched; music ducked under speech with smooth envelopes;
  per-section gain so music sits a set distance below the voice measured
  after ducking; effects as their own stem; master to about -15 LUFS with a
  true-peak ceiling near -1.2 dBTP.
- Taipei's music sat 10–11.5 LU under the voice. That level was later
  rejected as inaudible. Beer used 7.5–8.5 LU. The current gate starts at
  5–6 LU and is judged on the finished MP4.
- `sfx_gen.py` already has boots, a marching column, creaks, clinks, a
  whoosh, crowd babble, a cheer and applause.

### Render and QA

- Live workflow `render-short.yml`: typecheck, one still, render at
  720×1280 with SwiftShader, mux the mix, upload an artifact. It has no
  preview gate and does not put the MP4 on the branch.
- Beer's own workflow did it properly: about 22 stills in one bundle
  (`stills.mjs`), a short motion proof, publish previews to the branch, full
  render only when `stage == final`, checkpoint the silent picture, mux, QA,
  publish.
- Artifacts cannot be downloaded from this sandbox. Outputs must be
  committed to the working branch by the workflow.
- Only workflows registered on the default branch can be dispatched, so
  extend `render-short.yml` on this branch.
- `short_qa.py`: specs, loudness, silences, black, white and frozen frames,
  frame-difference pops outside planned cuts, per-shot colour, 2-second
  contact sheets. A pass is a technical pass, not approval.

## Lessons the references paid for

From `REMASTER.md` and the handoff:

- Beer v1 was rejected for toy-like repeated houses, flat light, an
  undetailed hero object, distant figures, and for treating clean QA as
  quality. Then for sluggish pacing, people walking on water and music
  nobody could hear.
- More camera angles of one static scene do not count as story beats.
- Idle wiggling is not acting. Move on the word, then hold the end state.

## What this means for Köpenick

**Reuse unchanged:** the eight style files, post stack, light presets,
`Pool`/`Actor`/`Fx` from Taipei's `cast.ts`, `batchStatic` and the
per-place `World` from Beer, the caption logic, `dsp.py`,
`instruments.py`, `sfx_gen.py`, `short_qa.py`.

**Reuse with small additions to `toon.ts`**

- Hats: spiked helmet for the soldiers and the local police; peaked officer
  cap for Voigt (the story's running joke, so it must read at a glance).
- A long double-breasted greatcoat for Voigt, with white gloves, sash and
  sabre (the officer outfit already has sash, sword and moustache).
- Dark-blue tunic soldier with rifle (recolour of the existing rifleman).

**Build new**

- About a dozen places. Hero set: Köpenick town hall, red brick, pointed
  portal, steps, tower. It appears three times with a new action each time
  (seizure, sentries left behind, the statue today).
- Hero objects: the uniform coming together on a shop counter; the town
  cash box with bags and the receipt; the bronze statue.
- Marching squad that halts in step and falls in behind him.
- Railway carriage interior and a platform. The train and the horse cab are
  the risk: build them properly or stage inside the carriage.
- Interior light looks. Only `day` and `golden` exist. Either drive
  interiors from windows with per-shot sun overrides, as both references
  do, or add one warm lamp preset and fit its grade.
- An original score. Working idea: a mock-military march that starts as one
  piccolo and a toy snare and gains players each time someone else obeys,
  falls apart at the arrest, returns as a music-hall number for the stage.
  Not the Taipei march or the Beer theme.

**Process still ahead (IMPORTANT.md gate 5)**

1. User hears and approves the voice.
2. Shot plan with a word frame for every cut and action.
3. Sets and motion, typecheck, diagnostic stills on GitHub.
4. Full render, mux, QA, review of the finished MP4, deliver on the branch.
