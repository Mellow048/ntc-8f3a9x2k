# START HERE — video preferences, lessons, and production handoff

This is the durable handoff for the user’s cartoon engineering shorts. **Read this before planning, editing, generating narration, or rendering a video.** The user specifically asked for this file so they do not have to repeat their preferences in a new session.

This records explicit user feedback separately from implementation lessons. It is not a guarantee that an unreviewed first render will be accepted. The goal is a strong first delivery, not another round of the same avoidable mistakes.

**Two kinds of short (added 2026-11-11).** Sections 1–8 are about the regular shorts: explaining or entertaining films on engineering, science, history and curiosities. **News shorts**, about real-life news, are a separate category with their own approved reference in `references/news/` and their own section 9. When the user wants a regular short, ignore section 9 and `references/news/`. When the user asks about the news, read section 9 and study that reference.

## Latest durable feedback — curiosity remasters and reference preservation

Read [IMPORTANT.md](IMPORTANT.md) for consolidated current gates and
[references/approved/README.md](references/approved/README.md) for actual,
branch-independent approved Taipei and Beer videos **and source** on main.
The user's latest request explicitly authorizes those two reference MP4s and
source snapshots on main, superseding the older documentation-only policy
**for this reference library**, not for every historical export.

- Beer Flood: accepted; use the detailed motion revision, not first cuts.
- Yamaguchi: accepted as “good enough”; confusing duplicate people, unclear
  bomb context and repeated angles had required correction. Do not label that
  qualified acceptance as the primary quality benchmark.
- Lake Peigneur: second visual revision was kept, then an audio/ending polish
  received “okay nice nice”. Saved final production checkpoint:
  `d1dea6bac184bca33f64b92bd41304b8629651c2`,
  `deliveries/lake-polished/lake-polished-720p.mp4` (38.4 s, 720×1280/30fps).
  No remaining request to re-render these three shorts.
- Flat blue water blocks, toy-like assets, static scenery and alternate-angle
  repetition were rejected. Geometry must be recognizably what it depicts;
  do not defend generic boxes as cars. Check meaningful on-screen detail.
- Background music was inaudible at ordinary volume and too depressing.
  Final Lake polish uses a new brighter 112 BPM cue, music measured after
  ducking at ~5–6 LU below speech instead of ~9–11, with narration clear.
  Do not apply the historical “only tiny opening lift” as a blanket instruction
  to bury every film's score. Write distinct music for each film; reusing DSP
  is different from reusing melody/recording/timbre blindly. No promise about
  platform reused-content decisions can be made from musical similarity alone.
- “The mine did not” ended too abruptly. The accepted polish retains the
  original Arena words, inserts a 0.5-second pause after “the mine”, and adds
  a one-second resolved visual/music tail. It does **not** synthesize “Well”.
  Plan ending cadence before rendering; when only sound/pacing needs repair,
  reuse picture where practical rather than another hour-long 3D render.
- The user is deleting branches: reference MP4s + source are now real tracked
  files in `references/approved/`, not just historical branch links. Other
  production recovery paths below remain historical; do not assume all media
  are on main. Preserve the separate City Hall stream's checkpoint below.

## 1. What the user wants

Make entertaining, approximately one-minute engineering/science shorts in the approved **2D cartoon characters inside a detailed, ink-outlined 3D environment** style. Explain a surprising real mechanism with understandable cause and effect.

### Explicit standing preferences / overrides

- **720p portrait only: 720 × 1280.** Do not default to 2K. The older 1440 × 2560 instructions in `IMPORTANT.md`, `SKILL.md`, and the README are superseded by this user preference.
- **Synchronized subtitles showing only 1–2 words at a time**, changing with the narration. This overrides the old “no captions” rule. Do not replace them with long subtitle sentences.
- Use **Arena TTS** for new narration. The user rejected the first audition as sounding off, then approved the second masculine educational English voice. Existing approved voice recordings should be reused when the script is unchanged.
- Preserve narrator consistency across this series. The historical approved selection was `voice-01` (`language: en`, masculine, educational, audition index 1). **That ID is session-local history, not a guarantee that a new session can synthesize with it.** Use the saved approved WAV as the reference; follow the voice-registration tool’s requirements for new synthesis.
- The user approved the engineering topic list and entrusted script/creative details to the agent. Do not repeatedly ask for approval of every camera, prop, or cut.
- Work on **one short at a time** at the improved quality level. Do not batch out the remaining films at the old low quality.
- Put the finished MP4 **on the working branch**, not just in an Actions artifact. The user found artifact downloads difficult. Present the local file and provide a direct branch file link when finished.
- Keep the approved video intact until its replacement has passed review. Do not overwrite unrelated films or re-render the entire series just to fix one.

### The user’s most important quality feedback

1. **Detailed environment, not a toy diorama.** The user rejected vague bridge geometry, crude cars and box-like scenery: “what even is that? boxes?” A clean render of generic blocks is not sufficient.
2. **Immediately readable hook.** At first glance, viewers must know what they are seeing. An unexplained abstract close-up risks a scroll. Establish the recognizable subject, then reveal the surprising detail right on its spoken mention.
3. **Retention-conscious editing.** Faster cuts inside longer passages, stronger purposeful camera moves, meaningful inserts, and visual progression. Do not leave a single weak shot running while the narrator moves through several ideas.
4. **Motion must listen to the narrator.** The user specifically disliked an apparent stuck/idle animation unrelated to “expands,” “narrows,” or “opens.” Keyframe the actual mechanism to those words. Hold its end state. Do not wiggle it constantly to make the scene look alive.
5. **Audible, film-specific music with clear narration.** The bridge once needed only a tiny opening lift, but Lake later established that buried music and a depressing mood are unacceptable. Assess ordinary-volume playback; the accepted Lake polish used music ~5–6 LU below speech after ducking. Do not make a quiet bridge-specific cue a blanket mix rule.
6. **Match the first approved Taipei video’s care.** The user loved that original, then said the five-video batch had degraded badly. The approved bridge rebuild/retention pass is now an additional concrete benchmark.

## 2. Approval history — do not repeat rejected approaches

| Version | User response / meaning |
| --- | --- |
| Taipei 101 / “The Giant Golden Ball Inside Skyscrapers” | Approved enthusiastically. Primary look/storytelling reference. |
| Original five engineering shorts | Rejected as much lower quality. Existing files are NOT evidence of user approval. |
| First bridge remaster | Rejected: toy-like setting, insufficient detail, crude/unclear bridge and cars. |
| Deeper bridge environment rebuild | “okay okay near there.” Environment was close; motion, opening and retention still needed work. |
| Bridge narration/retention revision | **“okay good job! go ahead and make the next idea into life.”** Accepted. This is the bridge version to reference, not an older rejected export. |

### Approved reference files

- `shoots/pendulum/final-720p.mp4` — approved Taipei short.
- `remotion-app/src/videos/pendulum/` — approved characters, ink, lens blur, grade and storytelling implementation.
- `shoots/breathing-bridge/final-720p.mp4` — accepted detailed bridge + retention revision.
- Bridge final-video delivery commit: `b472bfa`; final review/workflow cleanup: `7bc7551`.
- Bridge final: 720 × 1280, 30 fps, 1852 frames / 61.733 s, 31 shots, approved narration, 1–2-word captions. Finished-file QA: −15.0 LUFS, −1.3 dBFS peak; no detected silence, black frames, unplanned white frames, ≥12-frame freezes, or unplanned frame-difference spikes.

## 3. Current work — NEXT AGENT READ THIS BEFORE RENDERING

**The entertainment-first City Hall revision is now delivered; awaiting user review.** The user said the picture was good but the video felt like a lecture: most of it was the same building from start to end, with no genuinely new scenes. The hook was too explanatory. They suggested something dramatic like **“anti-earthquake building!”** More camera angles alone do not solve this feedback.

### Latest explicit creative direction

- Lead with a dramatic, visually demonstrated surprise, not “this is a building / here is how it works.” A possible truthful hook: “An anti-earthquake building? Watch the ground—not the roof.” Do not claim literal earthquake immunity.
- Build a sequence of **distinct scenes**, not a landmark tour: an interior quake reaction, an earthquake/shake-table test, a kitchen/tray gag, a basement bearing reveal, and a clearance demonstration. Give the viewer new action, setting, scale or stakes as the story progresses.
- Use tension → surprise → visual payoff → short explanation → callback. Entertain first; facts support the action rather than becoming a lecture.
- Do not make all the fresh scenes merely inserts of the dome/facade. Keep the recognizable City Hall architecture as brief context and payoff, not the majority of screen time.
- Preserve correct physics, approved visual quality, 720p, short synchronized captions and clear narration. A new hook/script may require new Arena narration and realignment; do not silently mismatch old words and new visuals.
- The entertainment-first export below is **delivered and reviewed technically/visually, but NOT yet user-approved**. Do not confuse it with the earlier lecture-like export.

### Latest delivered checkpoint

- Latest file: `shoots/spring-building/final-720p.mp4`, delivery commit **`6da3f5c`**; successful full render/QA run **`42807708835`**.
- 720×1280, 30 fps, **1865 frames / 62.167 s**, 36,545,230 bytes; 48 kHz stereo AAC. Finished-file QA: −15.0 LUFS, −1.4 dBFS peak; no detected silence, black/unplanned white frames, ≥12-frame freezes or unplanned frame-difference spikes.
- New narration starts **“An anti earthquake building? Watch this.”** Generated using the same selected Arena voice (`voice-01` worked in this session); files: `voice/action-take.mp3`, `voice/action.wav`, `voice/action-words.json`. Do not use the old `voice.wav`/`words.json` to reproduce this revision. The old recordings remain for historical reference.
- Current script: `ACTION-SCRIPT.txt` and `SCRIPT.md`. `prepare_action.py` performs deterministic processing and PocketSphinx alignment; `build_series_data.py` now selects the action words for City Hall. Updated series script/plan metadata matches the new words.
- Thirty cuts across a shake-table lab, office reactions, kitchen/tray analogy, workshop assembly, basement bearing, brief City Hall context and moat clearance. Landmark exterior/cutaway/moat shots total **17.1%** of runtime. New set source: `spring-remaster/actionSets.ts`.
- `story.ts` drives the exact word-timed action. Motion tests also assert a lab opening, at least seven different shot kinds, and less than 20% landmark coverage. This checks coverage, not actual audience retention.
- New mix: `audio/mix-remaster.wav` via `mix_remaster.py`, using `voice/action.wav`. Tiny opening rhythmic lift retained. No unrelated films were re-rendered.
- Diagnostic runs `42805980076` and `42806540786` were reviewed; final character placement was corrected. Typecheck and motion tests passed. Twenty representative frames from the completed MP4 were visually reviewed, including the hero in-frame, contrasting model motion, kitchen/tray, rubber layers/shear and clearance.
- Temporary publishing/diagnostic workflow changes restored to the regular workflow baseline.
- Documentation-only PR **#2** put this guide/entry-point docs on `main` without importing media or production source. A follow-up documentation-only PR updates this checkpoint with the delivered action revision. Both must be squash merges; do not merge the production commit history into `main` just to update the guide.

### Why the previous version was rejected

The 63-second export in `788cc88` / snapshot `1d36f6d` had good picture quality, but the user said it felt like a lecture and showed the same building for most of its duration. It is superseded. More facade angles were not enough. The user’s initial request for the handoff also interrupted that first export; avoid leaving “rendering” versus “finished” ambiguous.

### Next action

Wait for feedback on the action-led revision. Do not move to another topic until this one is accepted and the user asks to continue. Next planned topic after acceptance: **The Airport Built on the Ocean** (Kansai). Keep the approved bridge unchanged.

## 4. Motion/storytelling lessons from the accepted bridge

### Bridge physics — preserve the correct signs

- Warming expands spans: opposing deck ends move **toward each other**, so the joint gap **narrows**.
- Cooling contracts spans: opposing deck ends move **apart**, so the gap **opens**.
- “Bridge expands” and “gap expands” are NOT the same thing.
- Preserve state across the warm → cold cut. Do not reset the cold shot to a contradictory starting gap.
- All fasteners/fingers/details attached to a span must travel with it; do not leave bolts floating in world space.

The accepted implementation is in:

- `bridge-remaster/motion.ts` — exact narration-locked windows, deterministic held endpoints, no idle joint oscillation.
- `bridge-remaster/BridgeWorld.ts` — explicit shot list, detailed sets, purposeful dolly moves.
- `engineering-series/Series.tsx` — arrows visible only while the corresponding joint actually moves; temperature icons; synchronized 1–2-word captions.
- `shoots/breathing-bridge/test-motion.mjs` — direction, endpoint and hot/cold continuity tests.
- `shoots/breathing-bridge/boost_hook.py` — subtle opening-only rhythmic layer; original voice/rest of mix preserved.

### Apply the same reasoning to every mechanism

- Write down what moves, what it is attached to, and why, **before** adding animation.
- Use actual `words.json` timestamps, not just broad scene durations.
- Prefer one purposeful transition → held result over unrelated sine-loop motion.
- Use finite envelopes for demonstrations of shaking. Do not make the entire story idle-shake.
- Separate camera motion from physical motion. A camera push is not evidence that a mechanism works.
- Use consistent axes and clear end states. Direction cues can help, but cannot rescue incorrect geometry or motion.
- Exaggerate tiny displacements for legibility when necessary, while keeping the physics correct and documenting the illustration.
- Camera/editing motion should remain energetic while mechanism demonstrations stay readable.

### City Hall specifics

- “Giant springs” is the approved topic’s analogy, **not literal coil springs under City Hall**.
- Show layered rubber-and-steel isolators with bolted end plates and horizontal shear.
- The superstructure moves **less/differently**, not perfectly motionless. Do not imply earthquake-proof protection.
- The moat/clearance permits relative movement; the slab must not visibly collide with the surrounding ground.
- The jelly analogy first shows a locked tray following a shaking table; then a sliding tray transmits less motion and the jelly wobbles less.
- `spring-remaster/story.ts` contains finite quake windows and absolute-frame motion. `test-motion.mjs` checks finite shaking, reduced but nonzero building motion, and the analogy.
- Sources and illustration limitations are in `shoots/spring-building/SCRIPT.md`. Additional corroborating project source: https://www.olsonsteel.com/ability/san-francisco-city-hall/ .

## 5. Art and production standards

These are practical lessons, not permission to ignore later user requests.

### Build an environment, not symbols for an environment

- Recognizable landmark silhouettes and structural elements: real supports, attachment points, roofs, entrances, railings, windows, masonry, road/ground context.
- Varied urban surroundings, textures, street furniture, depth and scale cues. Avoid repeated featureless cubes and floating structures.
- Use detailed vehicle meshes when cars matter. Approved bridge cars are actual CC BY GLBs, with attribution in `shoots/breathing-bridge/ASSET-CREDITS.md`; reuse them with credits rather than reverting to rectangular toy cars.
- Procedural original architecture is fine if the detailing and silhouette hold up in the final portrait frame.
- Detail is not just polygon count. Verify that the intended details are actually visible and not hidden behind the camera or cropped out.

### Preserve the established look

- Taipei/bridge flat cartoon characters with expressive faces, plum ink, stem limbs; do not replace them with generic stock 3D people.
- Approved post stack: ink → selective lens blur → bloom → neutral tone mapping → grade.
- Keep establishing wides sharp. Use selective lens blur to emphasize faces/subjects, not to hide low-detail sets.
- Purposeful push-ins/trucks and hard cuts tied to ideas. Avoid meaningless global camera bob.
- No film-grain layer.
- `references/` is private style-study material, **not a deliverable**. Never publish its images or copy scripts/characters from it. Use approved originals for user-facing comparisons.

### Sound

- Narration is primary; duck music beneath speech.
- Original synthesized music/effects, not unlicensed commercial tracks.
- Historical +3 dB music/−6 dB SFX conventions are not sufficient release criteria. Measure post-duck music relative to narration and inspect the finished MP4; use the current IMPORTANT.md audio gates.
- The successful bridge opening pulse was very quiet (about −35 dBFS peak) and faded away within roughly the first 7.4 seconds. Treat that as an implementation reference, not a mandate to reuse exactly the same sound in every film.
- 48 kHz stereo final mix; aim around −15 LUFS and keep peaks at or below −1 dBFS after mux. Check the finished MP4, not only the WAV.
- Rebuild the relevant mix after changing timing. Do not accidentally run all-series audio generation for a one-film revision.

## 6. Repository map and reliable commands

### Lightweight `main` / branch-deletion note

The user requested that these handoff Markdown files be kept on `main` **without merging the large video/audio assets**. This documentation-only merge deliberately does not make all referenced production paths exist on `main`.

Latest complete production snapshot including the delivered entertainment-first revision: **`6da3f5c50a7dfeaaf1e92955c6cad1505aa06e05`**. The older `1d36f6d95233394f91df6de7577f2dfefe729f0d` snapshot is the superseded lecture-like version. Existing video/source links tied to a deleted branch may stop resolving; prefer this immutable commit as the recovery reference. The documentation PR's source history also records the production work. Download any finished videos you want to retain before deleting branches; documentation is not a media backup.

A new agent should inspect the current checkout and remote before claiming production files are present. If needed, fetch the production snapshot and selectively restore only the source/assets needed for the requested short **onto the platform-assigned working branch**, not by switching to a historical branch or importing all old renders into `main`. Do not assume the user wants large binaries added back to `main`.


| Location | Purpose |
| --- | --- |
| `remotion-app/src/videos/pendulum/` | Approved Taipei look, character art, motion and post-processing |
| `remotion-app/src/videos/bridge-remaster/` | Accepted detailed bridge + retention implementation |
| `remotion-app/src/videos/spring-remaster/` | Current City Hall rebuild: `story.ts`, `building.ts`, `art.ts`, `SpringWorld.ts` |
| `remotion-app/src/videos/engineering-series/Series.tsx` | Routing, shared rendering stack, 1–2-word captions |
| `remotion-app/src/videos/engineering-series/data.json` | Approved word timings, duration and legacy beats |
| `remotion-app/src/videos/engineering-series/World.ts` | Original low-detail batch worlds; NOT the new quality benchmark |
| `shoots/series-scripts.json`, `shoots/series-plan.json` | Approved series scripts, topic order, legacy scene beats |
| `shoots/<slug>/voice/` | Approved WAV and word timestamps |
| `shoots/build_series_qa.py` | QA metadata, including custom remaster shot lists and caption transitions |
| `shoots/pendulum/audio/` | DSP, instruments, sound synthesis, limiter utilities |
| `.github/workflows/render-short.yml` | Existing registered render workflow; use it for CI renders |
| `templates/scripts/short_qa.py` | Finished-video specs, loudness, silence and frame checks |

Useful local checks:

```sh
npm run typecheck --prefix remotion-app
node --experimental-strip-types shoots/breathing-bridge/test-motion.mjs
node --experimental-strip-types shoots/spring-building/test-motion.mjs
python3 shoots/build_series_qa.py
```

Install `remotion-app` dependencies with `npm ci` if absent. Python audio requires NumPy/SciPy; video review tools may require Pillow and an FFmpeg binary. Do not commit virtual environments, caches, `node_modules`, or large scratch renders.

### Topic order after City Hall

1. The Airport Built on the Ocean — Kansai (`OceanAirportShort`, `ocean-airport`).
2. The Tunnel Under the Sea — Channel Tunnel (`ChannelTunnelShort`, `channel-tunnel`).
3. The Skyscraper With a Hole in It — HSBC Hong Kong (`SkyPlazaShort`, `sky-plaza`).

These scripts and old batch outputs exist. They have **not** received approval at the new standard. Do not claim them as completed remasters or switch to them before the current film is finished unless the user asks.

## 7. Rendering, delivery, and traps already encountered

- Use **GitHub Actions** for heavy rendering. Bind any preview servers to `0.0.0.0` and respect the platform’s preview origin requirements if making a preview.
- A detailed 720p render has taken approximately **50–71 minutes** on the available runner. Be honest about running versus completed status. Do not call it delivered just because dispatch succeeded.
- Still diagnostics come first. Review opening, faces, mechanism before/during/after movement, attachment/contact points, and subtitle visibility.
- Every hard cut belongs in the actual shot list, and QA metadata must be regenerated from it. Register intentional caption/graphic transitions without masking broad stretches to hide defects.
- Passing automated QA is **not aesthetic acceptance**, a physics review, or proof of audience retention.
- In this environment `gh run download` / Actions log retrieval has failed because redirects to Azure/results-receiver hosts returned EOF. GitHub API, git fetch/push, and runner-side artifact operations worked. Do not repeatedly retry the same blocked download path.
- Successful fallback: use `actions/download-artifact@v4` **on a runner** with the explicit render run ID, verify the report, then commit the finished MP4/report to the working branch. Pull afterward. Keep remote-push races in mind; do not blindly force-push over runner results.
- A newly added standalone workflow could not be dispatched because it was not registered on the default branch. Temporary jobs in the existing `render-short.yml` worked. Restore temporary hard-coded jobs after delivery.
- Diagnostic annotations truncate around 4096 characters. Review sheets committed by the runner are more useful than stuffing image data into annotations.
- Local extracted Chromium previously failed on missing `libnss3.so`, `libnssutil3.so`, and `libnspr4.so`. Installing another Chromium package alone did not fix it. Prefer working CI diagnostics unless the missing libraries are actually resolved.
- Do not explicitly dispose the shared ink post-processing primitive: an earlier render crashed when cleanup expected a callable `dispose` but it had been overridden by `dispose={null}`.
- Keep absolute-frame animation deterministic: rendering frames out of order must not change the result.
- Reuse a set for repeated shot kinds rather than duplicating whole detailed environments for each camera cut; clear visibility on all shared roots before enabling the current one.
- A legacy stash named `Preserve restored session snapshot before syncing branch` was saved during an earlier sync. Do not blindly pop or discard it; it can overwrite newer approved work.

### Branch safety / persistence

The session that created this guide uses `arena/2524fc8a-ntc-8f3a9x2k`. Follow the branch instructions supplied by the platform for **your current session**; do not switch branches merely because this historical branch is named here. Never overwrite another session’s work. Use local status/diff and remote status to verify the current checkpoint.

### Final release checklist

- [ ] Current user request and this guide read; no old 2K/no-caption defaults accidentally restored.
- [ ] Only the requested short changed; unrelated approved videos untouched.
- [ ] Script facts and asset credits recorded.
- [ ] Approved voice preserved or new Arena voice explicitly selected.
- [ ] Immediately recognizable opening and understandable surprise.
- [ ] Detailed setting and real attachment/load paths; no toy placeholder assets.
- [ ] Every physical transition follows the words, in the correct direction, with stable endpoints.
- [ ] Faster meaningful cuts, purposeful camera movement, and clear demonstration shots.
- [ ] Distinct mood-appropriate score audible at normal volume, voice clear; verify finished MP4, not just master loudness.
- [ ] Deliberate final spoken cadence and resolved short visual/music tail.
- [ ] 1–2-word subtitles synchronized, legible, and unobstructed.
- [ ] Typecheck, motion tests and regenerated QA metadata.
- [ ] Diagnostic visual review against approved originals, then final 720p render.
- [ ] Finished-file technical QA and final visual review; no unplanned pops or broken contact points.
- [ ] Finished MP4 + QA report saved on the assigned branch; user can open/download it easily.
- [ ] Temporary workflow changes restored; this file’s **Current work** section updated accurately.

## 8. Keep this guide useful

After each delivery or user correction, update the approval history and current checkpoint. Distinguish **planned**, **implemented**, **rendering**, **reviewed**, **delivered**, and **user-approved**. Record unresolved problems honestly. Do not make the next agent infer status from the presence of an old `final-720p.mp4`.


## Separate Köpenick production — delivered on its own session branch

This does not replace the City Hall checkpoint above. On branch
`arena/f220dac6-ntc-8f3a9x2k`, the user approved the people-driven Köpenick
idea, selected the Arena narrator, then said “then go make the mp4”.

- Film: **The Shoemaker Who Borrowed an Army**, 26 action beats.
- MP4: `deliveries/koepenick/koepenick-720p.mp4`, delivery commit `6b096c8`.
- Sources: `remotion-app/src/videos/koepenick/`; voice, sources, plan, original
  score and honest production log: `shoots/koepenick/`.
- Successful render: Actions run `42939517026`; 69.667 s, 720×1280/30fps,
  AAC stereo 48kHz, -14.6 LUFS, -1.5 dBTP. No silence, black/white or frozen
  spans detected. Three pop flags at 356–358 were visually checked against
  adjacent decoded frames: the intentional coat drop, not unexplained flashes.
- Actual final-picture review: 28 decoded shot samples plus 139 samples at
  2fps. Audio was measured, not listened to. User approval is pending.
- Existing `render-short.yml` has an isolated `Koepenick` job: normal
  `still_frame` makes diagnostic stills; `-1` is the explicit full-render gate
  after the agent reviews diagnostics. Other compositions retain their old job.


### Köpenick user feedback and music-only v2

User liked the film/story/comedy and did not know this event happened. Only
requested improvement: Python background music; v1 beat was hard to catch and
distracted from watching. Explicit correction: **do not lower the music**;
change the beat and make it engaging, since music bridges retention. Do not
solve busy composition by burying the score. Preserve the picture they liked.

Delivered replacement at the same Köpenick MP4 path: new 112 BPM continuous
4/4 groove, kick/backbeat, light eighths, pizzicato bass/chords and sparse mallet
hook. Removed fife, offbeat march-snare layer, echo and per-story-beat meter
resets. Same music/voice targets and measured stem level (-24.5 LUFS rounded
in both versions); final AAC -14.54 LUFS, -1.41 dBTP. Compressed H.264 packet
hash unchanged; no 3D render/re-encode. Full 2090-frame decode and new audio
checks pass. Sources and reproducible remux command are in the production log.
Original v1 remains pinned at `6b096c8`. Agent did not listen; v2 music approval
is pending, distinct from user's positive feedback on v1 story/picture.


## 9. Separate category: news shorts (approved reference on `main`)

A news short covers real-life news: real people, companies or events that are in the news. It is a different category from the films in sections 1–8, and it does not replace or change the City Hall checkpoint in section 3.

**When this section applies:** only when the user asks for a short about the news. For a regular explaining or entertaining short, ignore this section and `references/news/` and use `references/approved/`.

- **Approved film:** "Nvidia's CEO and the Suspected Spy", 69 seconds. The user watched the delivered MP4 and said: "so well done and not lazy", "maybe the best one". The user then asked for the MP4 and the source to be put on `main` as a reference in a folder of its own, because it is "on a different level and category", and for `AGENTS.md`, `README.md` and `IMPORTANT.md` to describe this type of film. This authorizes this one film on `main`, as the Taipei and Beer references were authorized; it is not a policy for every export.
- **Where:** `references/news/README.md` (category rules, when to study and when to ignore) and `references/news/nvidia-spy/` (MP4, one frame of every shot, source snapshot, manifest, study guide, rebuild recipe). Check the files with `python references/news/verify.py`.
- **File:** `references/news/nvidia-spy/final-720p.mp4`. 720×1280, 30 fps, 2075 frames / 69.167 s, 51,611,759 bytes; H.264 + 48 kHz stereo AAC. Finished-file QA: −14.6 LUFS, −1.8 dBFS true peak; no silence, black, unplanned white or frozen frames; every frame jump is a cut, a caption change or an arriving graphic. Produced on branch `arena/44d045b4-ntc-8f3a9x2k`, render run `42918009608`. The branch is provenance, not a dependency.
- **What the agent checked before delivery, and what it did not:** it checked the finished file technically and reviewed the picture on 139 still frames. It did not listen to the sound, which was set from meters, and did not watch the film in motion. The approval is the user's, after watching it.
- **What the user decided on the way:** approved the fifth draft of the narration; rejected twelve voice auditions as sounding artificial, then picked one of six full reads; then "make the video and render it in github". The user was annoyed at being given six reads to choose from: **offer one candidate, not a menu.** Voice IDs are session-local; the saved `voice.wav` in the reference is the record of that voice.
- **Accuracy rules for news** are in `IMPORTANT.md` §6 and `references/news/README.md`. In short: sources for every fact, every unproven claim attributed every time, the denial and "not charged" kept in the film, quotes exactly as reported, public figures as simple caricatures with name tags and anyone not charged as an anonymous figure, jokes about the situation and never about the family.
- **Timing is data, not code:** picture, captions, graphics and sound all read the narration's `words.json`. To re-time, run `build_voice.py`, then `build_mix.py`, then render. The read is brisk (1.2×), so three beats of silence were put back on purpose: after "Quote:", after the email quote, before the closing question.
- **Sound:** the first render had the music 10.5 LU under the voice and was replaced; that is the range recorded above as inaudible. The approved mix has it 5.5 LU under while someone speaks (6.8 LU counting only what a phone speaker plays, above 300 Hz). Words stay clear because the music's 1.2–5 kHz band dips under speech and an accent that lands on a word is held about 3 LU under it. The score is original to this film (112 bpm, A minor, a spy groove); a new film needs its own.
- **Render workflow:** the film's workflow is in the snapshot at `references/news/nvidia-spy/source/.github/workflows/render-short.yml`. It splits a composition into 20 frame ranges on parallel runners: 8 to 11 minutes for this film instead of more than an hour in one job. `-f parts_from=<run id>` reuses the rendered picture of an earlier run when only the sound changed (about 2 minutes; parts are kept 3 days). The live `.github/workflows/render-short.yml` on `main` is still the older single-job workflow; copy the snapshot's file over it on your working branch to use the parallel one. Failing steps and the check summary are written to the run's annotations, because job logs could not be downloaded from the sandbox.
- **Lessons from this film:** keep the caption band (70–82 % of the height) free of signs, props and heads; size captions to fit one line; white props need an unlit material or they grey out; lens blur only on close shots (it was more than half the render cost).
- **Known small things, left as they are:** the "ON AIR" sign is partly behind a graphic in the interview shot; two board members are cut by the frame edge in the board-statement shot.


## Köpenick — complete music-v2 explicitly approved; preserved as a reference

After playing the revised MP4, the user said: “im loving this, visuals,
narration, pacing, backround music etc. all perfect.” They explicitly requested
the exact MP4 and source in the reference folder on `main` so other agents
can learn the level of effort and stop defending primitive placeholder props.
This supersedes earlier Köpenick notes saying v2 approval was pending.

Canonical reference: `references/approved/koepenick/` — exact accepted MP4,
source snapshot from `5cae0e6b752fc56434d806740a59d23c94f44c7a`, two decoded
shot sheets, approval record, manifest, source study/reproduction guide.
Regular/history category beside Taipei and Beer; news reference unchanged.

The MP4 was moved, not re-encoded or duplicated. Historical delivery paths in
older logs resolve through their pinned commits; see the reference for today's
canonical copy. Source includes the accepted 112 BPM groove, not just the old
score. Historical “pending” source logs remain frozen and are superseded by
the reference approval record. Agent did not listen; approval is the user's.

Standalone locked install/typecheck/timing tests and local import closure pass.
Python score + audio-only remux were regenerated from the snapshot and matched
the accepted MP4 hash using its preserved picture. No new full 3D render was
performed for archiving. All 45 origin files compare byte-for-byte; only two
standalone registration adapters are new. `references/approved/verify.py`
includes the new manifest. The session-only branch-pushing render job was
removed from the active workflow; its inert source snapshot preserves the
production recipe. Never edit approved snapshots as new-film scratch space.

Live production code, voice copies and diagnostic JPGs were consolidated into
the frozen source snapshot rather than left as a second active Koepenick app.
The main app registration/config and generic render workflow are unchanged
from current main. Delivery README points to the canonical reference MP4.

## 10. News short delivered, waiting for the user's verdict: the GTA 6 leaker (branch `arena/3f667ce0-ntc-8f3a9x2k`)

This section is about one film on its own branch. It changes nothing in sections 1–9. **Status: implemented, rendered, technically checked, reviewed on stills, delivered on 2026-11-11. Not user-approved.** Until the user says so, do not treat it as a reference and do not copy it to `main`.

- **Request:** a news short about the person who leaked Grand Theft Auto VI gameplay and what became of them, made the way the Nvidia film was made. Delivered eight days before the game's release on 19 November 2026.
- **Film:** "The GTA 6 Leaker Who Wanted a Disc", 74 seconds, 235 words, 46 shots on 13 sets, 15 lines of narration ending on a question with two real sides (a disc in the box, or a code is fine).
- **Where:** `shoots/gta6-cyberleek/` (`SCRIPT.md` is the record: 18 sourced facts, what could not be confirmed, the rules, narration, characters, beat map, voice, sound, render, result), picture in `remotion-app/src/videos/gta6/`, composition `CyberleekShort`.
- **File:** `shoots/gta6-cyberleek/final-720p.mp4` at commit `1e74ff354a00a6f225b6778757dc0e9c6d23e1f4` (render run `42952057784`). 720×1280, 30 fps, 2233 frames / 74.433 s, 48,721,649 bytes; H.264 + 48 kHz stereo AAC. Finished-file QA: −14.6 LUFS, −1.8 dBFS true peak; no black, unplanned white or frozen frames, no unplanned frame jumps; one deliberate 0.31 s silence before the last quote.
- **What the agent checked, and what it did not:** the finished file technically; the picture on one frame per shot plus one frame in every eight (279), and the two spots that changed in the final render. It did not listen to the sound (set from meters) and did not watch the film in motion.
- **Accuracy decisions:** nobody has been identified or charged, so Cyberleek is a hood with no face and the narration says "they"; the motive is "they called it a protest"; the money is "outside estimates say"; the full-game claim is followed at once by "nobody has verified"; Rockstar, Take-Two's CEO and the leaker each get a card with their exact words. Nothing from the leaked footage is shown, the coin has no name on it, and the billboard is plain lettering, not the game's artwork. Left out because no major outlet confirmed them: a "comeback" post on 21 Oct, a $40 "development build" download, the "dead man's switch", arrest rumours.
- **Voice:** the same Arena voice the user chose for the Nvidia film (`voice-15`, still valid in that session), one take, no menu of options. The saved `voice/voice.wav` is the record.
- **Sound:** original score for this film (104 bpm, D minor, a night-drive synth groove with a two-note motif for the leaker), 5.5 LU under the voice while someone speaks (7.2 LU above 300 Hz).
- **Machinery:** copied from the news reference's snapshot onto this branch (parallel render workflow, scripts, fonts, `pendulum` post-processing). The workflow's defaults on this branch point at this film; `SCRIPT.md` has the full command.
- **Lessons from this film, on top of section 9:**
  - Check every shot on a still before rendering, and then look at the first frames after every cut: one shot opened on an empty phone, one on two almost black frames, and a name tag arrived half a second after the person. The mid-shot stills showed none of it.
  - A vertical frame is narrow. A pyramid one case narrower per row fills half the width; two per row fills it. A chart and a standing figure compete for the same height: stand the figure where the line is not, or bring it close to the lens.
  - To keep the caption band plain, put something plain in front of what is busy (the grass hill in front of the pile of cases) instead of shrinking the subject.
  - A shot may move its look-at point as well as its camera (`targetTo` in `story.ts`): that is a tracking shot, and whatever rides with the lens stays sharp while the background moves.
  - A caricature of a named person gets its name tag as the shot begins, and staff in the same room must not look like them.
  - A chart of money is linear from zero on both axes and says on screen which points are reported and which part is a sketch.
  - The sandbox can reset mid-task: the tool folders vanish and `.git` goes back to a fresh clone of `main` while the files stay. Recover with `git fetch origin && git reset -q origin/<branch>`, check `git status`, restore anything the render run committed, and reinstall the tools. Commit and push after every step so nothing is lost.
