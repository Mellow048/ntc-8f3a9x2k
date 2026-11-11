# The Shoemaker Who Borrowed an Army — user-approved reference

**Wilhelm Voigt / the Captain of Köpenick (1906).** This is the accepted
**music-v2** film, not the earlier busy 116 BPM soundtrack.

- **Watch:** [final-720p.mp4](final-720p.mp4).
- **Study the picture:** [shots 1–16](shots-01-16.jpg), [shots 17–26](shots-17-26.jpg).
  These are decoded from the approved MP4, not source-preview substitutes.
- **Approval/provenance:** [APPROVAL.md](APPROVAL.md), [manifest.json](manifest.json).
- **Implementation:** [source/](source/), preserving repository-relative paths.
- **Finished-file QA:** [report](source/deliveries/koepenick/qa-report.md),
  [music-v2 measurements](source/deliveries/koepenick/music-v2-qa.json).

720×1280, 30 fps, 2,090 frames / 69.667 seconds, H.264 + AAC stereo 48 kHz.
Actual AAC: **−14.54 LUFS / −1.41 dBTP / LRA 2.10 LU**.
81,965,458 bytes; SHA-256:
`4167efa884652be33fd8f92181d53d60c83ecfa1a23fe29664193476741334a6`.
The MP4 is byte-for-byte the one delivered at commit
`5cae0e6b752fc56434d806740a59d23c94f44c7a`, not a new encode.

## Approval and scope

The user watched the revised film and said:

> im loving this, visuals, narration, pacing, backround music etc. all perfect.
> congrats you are accepted into the reference folder in main branch

They explicitly requested the MP4 and source on `main` so other agents can
learn how to make shorts with this care. This is a **regular/history/story**
reference beside Taipei and Beer, not a news reference or a mandate to reuse
this story, music or geometry. News remains a separate category.

The saved production notes describe earlier stages, including "approval
pending" and an initial 116 BPM audio direction. Those are historical records;
**this guide and APPROVAL.md record the later full user approval of music-v2**.
No claim that the agent listened: agent review was technical measurement,
decoded-frame sampling and video-packet comparison; aesthetic approval came
from the user after playback.

## Study in this order — actual source, not just the screenshots

All paths below are relative to `source/`.

1. **Story and fact boundaries:** `shoots/koepenick/SCRIPT.md`,
   `voice/narration.txt`, `SHOT_PLAN.md`, `REFERENCE_NOTES.md`.
   The question is "How did he convince them—and did he get away with it?"
   Each scene escalates a person's bluff, power, trouble or consequence.
   Do not replace it with a lecture on uniforms or obedience.
2. **Timing:** `shoots/koepenick/voice/words.json`,
   `scripts/koepenick/plan.py`, `remotion-app/src/videos/koepenick/data.json`
   and `story.ts`. Words drive cuts, gestures, foley and caption groups.
   Actions begin roughly two frames before their spoken words. Frame-addressed
   clamped easing permits out-of-order rendering and holds completed actions.
3. **Recognizable environments and props:** `build.ts`, `sets.ts`, `world.ts`.
   Read how brick courses, door arches, steps, railings, windows, roof details,
   lamps, floorboards, desks, seats, paper, mugs, money bag and prison bars are
   assembled and placed. A box may be a construction part, not an excuse for
   an unfinished recognizable object. A label cannot make a cube a fridge.
4. **People and readable staging:** `cast.ts`, `style/toon.ts`,
   `style/cardshade.ts`. Civilian/captain/soldier/police/mayor/bronze roles are
   distinct. Cap, coat, white gloves, moustache and sabre identify Voigt.
   Faces, eyes, mouths and hands support specific actions. Inspect seated
   face clearance, the halted squad, inspector's bath, mayor's reaction and bow.
5. **Painted/ink look:** `style/paint.ts`, `shade.ts`, `lights.ts`, `ink.ts`,
   `lensblur.ts`, `grade.ts`, `Koepenick.tsx`. Inspect both procedural materials
   and the actual post stack. Detail, lighting and silhouette come first;
   blur is selective focus, not cover for placeholder scenery.
6. **Captions:** `Captions` in `Koepenick.tsx`: 1–2 words, short group timing,
   portrait-safe band and a brief arrival accent; not a whole paragraph.
7. **Accepted sound:** `shoots/koepenick/audio/groove.py`, `score.py`,
   `instruments.py`, `dsp.py`, `cues.md`; `scripts/koepenick/remix.py`.
   Learn the beat/mix construction, not the actual melody. See next section.
8. **Iteration and verification:** `shoots/koepenick/PRODUCTION.md`,
   `scripts/koepenick/{stills.mjs,test.mjs,review.py,check.py}`,
   `templates/scripts/short_qa.py`. Three diagnostic passes corrected camera
   crop, face obstruction, coat identity, gesture timing and statue movement
   before the expensive render. Preserve that process, not just the final look.

## Musical lesson: change a confusing beat, not its volume

The user liked the first picture/story but could not catch the original beat;
it distracted them. They specifically rejected the suggestion to turn it down:

> dont make the python backround music quiter tho, just change the beat and
> make it good. backround music are the bridge to retention

The accepted replacement has:

- **112 BPM, continuous 4/4 clock** from frame zero. No restart at camera cuts
  or spoken-word section boundaries.
- Round kick on 1/3, dry backbeat on 2/4, restrained eighth subdivisions.
- Pizzicato bass/chord responses and a sparse repeating damped-mallet hook.
  No competing fife line, military snare rolls or rhythmic slapback echoes.
- Harmony/density changes on bar boundaries; a more tense passage around the
  betrayal/arrest, then return. Final tonic at 68.571 s, after the last word
  at 68.44 s and before the 69.667 s ending.
- **Unchanged section-level music/voice targets after ducking**. Original music
  −24.491 LUFS; accepted music −24.528 LUFS: only 0.037 LU difference, not a
  quiet-music workaround. Voice −18.900 LUFS. Global mastering affects the
  entire mix, not just the music. Measurements support, not replace, playback.

Use an original musical identity that suits each new film. Do not impose
112 BPM, this instrumentation or a caper groove on every subject.

## Action beats worth comparing with the code

| Time | What changes | Source to inspect |
|---|---|---|
| 0–5.07 s | Soldiers assist a robbery: immediate contradiction/hook | `world.ts`, hook shot in `data.json` |
| 10.13–17.47 s | Shopping, uniform pieces, wrong-hat reveal | shop/uniform/mirror shot logic |
| 17.47–25.53 s | Glove halts squad, troops follow, soldier obeys | halt/follow/obey; raised-hand easing in `toon.ts` |
| 25.53–32.70 s | Train/beer, sealed town hall, police hold crowd | train/hall/crowd; seats, mugs and face clearance |
| 32.70–41.47 s | Bath permission, warrant demand, soldiers as warrant | bath/mayor/warrant; purposeful gestures |
| 41.47–49.63 s | Coins transfer, signed receipt, guards wait, escape | cash/receipt/guard/escape; frame-locked foley |
| 49.63–60.73 s | Identification, betrayal, breakfast arrest, prison, pardon | wanted/tip/breakfast/prison/laugh/pardon |
| 60.73–69.67 s | Stage bow, bronze callback, wrong hat, resolved tail | stage/statue; frozen bronze and final cadence |

A reused location is fine; repeated camera tours with no new action are not.
The 26 contiguous beats have distinct story functions, not 26 generic angles.

## Standalone reproduction — use a scratch copy, keep this reference immutable

No unrelated-film renderer modules are required. `src/reference-entry.tsx`
and its tiny `src/index.ts` shim are preservation-only registration adapters.
All 45 origin files—including renderer, score, voice, package lock and the
historical workflow—are unmodified from the accepted commit.

From the repository root on a GitHub runner with Node 22, Python, FFmpeg and
Chromium's Linux system dependencies installed:

```sh
REF="$PWD/references/approved/koepenick"
# Create a disposable directory; do not edit source/ or its saved voice in place.
WORK="$(mktemp -d)"
cp -R "$REF/source/." "$WORK/"
cd "$WORK/remotion-app"
npm ci
npm run typecheck
npx playwright@1.49.1 install --with-deps chromium
CHROME="$(find ~/.cache/ms-playwright -type f -name chrome | head -1)"
test -x "$CHROME"
cd "$WORK"
node scripts/koepenick/test.mjs
python -m pip install numpy scipy pillow
python shoots/koepenick/audio/score.py
```

**Fast audio reconstruction using the exact approved picture** (no 3D render):

```sh
mkdir -p deliveries/koepenick
cp "$REF/final-720p.mp4" deliveries/koepenick/koepenick-720p.mp4
python scripts/koepenick/remix.py --publish
```

The script measures two-pass mastering, AAC, silences, full decode and picture
packet identity before replacing this *scratch* output. It also tests the drum
grid and unchanged music/voice balance. Do not write through a symlink to the
immutable approved MP4.

**Full 3D rebuild** (heavy; use GitHub, not the interactive sandbox):

```sh
cd "$WORK/remotion-app"
mkdir -p ../shoots/koepenick/out
npx remotion render src/reference-entry.tsx Koepenick ../shoots/koepenick/out/silent.mp4 \
  --width=720 --height=1280 --codec=h264 --crf=17 --concurrency=2 \
  --gl=swiftshader --browser-executable="$CHROME" --timeout=300000
cd "$WORK"
# Seed the working delivery with the new picture; remix.py will add the mix.
cp shoots/koepenick/out/silent.mp4 deliveries/koepenick/koepenick-720p.mp4
python scripts/koepenick/remix.py --publish
python templates/scripts/short_qa.py deliveries/koepenick/koepenick-720p.mp4 \
  shoots/koepenick/out/qa shoots/koepenick/qa-shots.json
```

Use the saved `voice.wav` and timings as-is; `prepare.py` records how the raw
Arena take was conformed/aligned, but rerunning it is unnecessary for replay.
The original package's default `render`/`still` scripts name an unrelated old
composition: use the explicit commands above, not those defaults.

`source/.github/workflows/render-short.yml` is an **inert historical recipe**.
Its session-specific branch is provenance, not a destination for future work.
No workflow under this source snapshot is active on GitHub. Preserve references;
new work belongs on your own platform-assigned branch and outside this folder.

## Preservation validation

`python references/approved/verify.py` checks this and the earlier references.
For this addition, checksum/origin comparisons, local-import closure, locked
`npm ci`, standalone typecheck and timing tests passed. Python score generation
and audio-only remux were executed from this snapshot; the remux reproduced the
accepted MP4 SHA-256 using its unchanged picture. **No new 3D render was run**
for reference preservation. Dependencies/encoders on another platform may give
different regenerated bytes; the stored MP4 is the approved artifact.
