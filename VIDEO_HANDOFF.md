# START HERE — video preferences, lessons, and production handoff

This is the durable handoff for the user’s cartoon engineering shorts. **Read this before planning, editing, generating narration, or rendering a video.** The user specifically asked for this file so they do not have to repeat their preferences in a new session.

This records explicit user feedback separately from implementation lessons. It is not a guarantee that an unreviewed first render will be accepted. The goal is a strong first delivery, not another round of the same avoidable mistakes.

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
5. **Music: only a tiny early lift in intensity.** The bridge score felt too soothing. The requested correction was a *tiny, tiny* increase at the beginning—not loud trailer music, an overpowering beat, or a buried narrator.
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

**City Hall needs an entertainment-first revision.** The user said the picture was good but the video felt like a lecture: most of it was the same building from start to end, with no genuinely new scenes. The hook was too explanatory. They suggested something dramatic like **“anti-earthquake building!”** More camera angles alone do not solve this feedback.

### Latest explicit creative direction

- Lead with a dramatic, visually demonstrated surprise, not “this is a building / here is how it works.” A possible truthful hook: “An anti-earthquake building? Watch the ground—not the roof.” Do not claim literal earthquake immunity.
- Build a sequence of **distinct scenes**, not a landmark tour: an interior quake reaction, an earthquake/shake-table test, a kitchen/tray gag, a basement bearing reveal, and a clearance demonstration. Give the viewer new action, setting, scale or stakes as the story progresses.
- Use tension → surprise → visual payoff → short explanation → callback. Entertain first; facts support the action rather than becoming a lecture.
- Do not make all the fresh scenes merely inserts of the dome/facade. Keep the recognizable City Hall architecture as brief context and payoff, not the majority of screen time.
- Preserve correct physics, approved visual quality, 720p, short synchronized captions and clear narration. A new hook/script may require new Arena narration and realignment; do not silently mismatch old words and new visuals.
- The last export below is **delivered but revision requested**, NOT user-approved. No entertainment-first replacement MP4 exists yet at this checkpoint.

### Latest delivered checkpoint

- New MP4: `shoots/spring-building/final-720p.mp4` — **the new detailed remaster**, no longer the old low-detail batch export.
- Delivery commit: `788cc88`; successful full render and QA run: **`42789733540`**. The job took 1h10m13s.
- File: 60,345,284 bytes; 720×1280, 30 fps, 1890 frames / 63.000 s; 48 kHz stereo AAC.
- Finished-file QA: −15.0 LUFS, −1.3 dBFS peak; no detected silence, black frames, unplanned white frames, ≥12-frame freezes, or unplanned frame-difference spikes. Report: `shoots/spring-building/qa-report.md`.
- Approved existing Arena narration retained in `voice/voice.wav` / `voice/words.json`; synchronized 1–2-word captions preserved.
- Source: `remotion-app/src/videos/spring-remaster/`; `SpringBuildingShort` routes to `SpringWorld` through `engineering-series/Series.tsx`.
- 31 shots: detailed City Hall, civic plaza, foundation cutaway, layered bearing close-ups, jelly/tray analogy, and clearance/moat demonstration.
- Mix: `shoots/spring-building/audio/mix-remaster.wav`, generated by `mix_remaster.py`. Use this, not the legacy `audio/mix.wav`, when reproducing the remaster.
- Follow-up physics fixes completed: exterior/history plaza moves with its foundation; rubber shears continuously through its thickness while steel shims remain rigid. All motion is deterministic, uses finite narrated demonstrations, and leaves smaller nonzero building motion.
- Typecheck, motion tests, diagnostic visual review, full-video technical QA, and a 20-frame finished-video visual review completed.
- Temporary diagnostic/recovery/publishing workflow changes have been restored to the normal workflow baseline from `7bc7551`.

### Relevant history, so it is not repeated

The user interrupted the first City Hall pass to request this handoff, then asked where the MP4 was. At that point it was **not finished**; only diagnostic frames existed, and the user was explicitly told that. Do not repeat the mistake of leaving export status ambiguous.

Initial diagnostic run `42786877450` rendered all 16 stills but failed to push its review sheets because a concurrent documentation push advanced the branch. Recovery run `42789516662` succeeded and committed `review/initial-*.jpg` in `91686ea`. Those sheets were reviewed before full rendering. No rerender of the full series was necessary.

### Next action

Implement the entertainment-first City Hall revision above. Do not move to another topic yet. After City Hall is approved and the user asks to continue, the next planned topic is **The Airport Built on the Ocean** (Kansai). Keep the bridge unchanged. If revising City Hall, regenerate its QA metadata and targeted mix as appropriate, inspect stills, render only at 720p, and update this checkpoint after delivery.

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
- Standard convention inherited from the production wrapper: music +3 dB, SFX −6 dB, voice unchanged; master to the intended range.
- The successful bridge opening pulse was very quiet (about −35 dBFS peak) and faded away within roughly the first 7.4 seconds. Treat that as an implementation reference, not a mandate to reuse exactly the same sound in every film.
- 48 kHz stereo final mix; aim around −15 LUFS and keep peaks at or below −1 dBFS after mux. Check the finished MP4, not only the WAV.
- Rebuild the relevant mix after changing timing. Do not accidentally run all-series audio generation for a one-film revision.

## 6. Repository map and reliable commands

### Lightweight `main` / branch-deletion note

The user requested that these handoff Markdown files be kept on `main` **without merging the large video/audio assets**. This documentation-only merge deliberately does not make all referenced production paths exist on `main`.

Last complete production snapshot before the entertainment-first revision: **`1d36f6d95233394f91df6de7577f2dfefe729f0d`**. Existing video/source links tied to a deleted branch may stop resolving; prefer this immutable commit as the recovery reference. The documentation PR's source history also records the production work. Download any finished videos you want to retain before deleting branches; documentation is not a media backup.

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
- [ ] Music restrained, voice intelligible; opening lift subtle.
- [ ] 1–2-word subtitles synchronized, legible, and unobstructed.
- [ ] Typecheck, motion tests and regenerated QA metadata.
- [ ] Diagnostic visual review against approved originals, then final 720p render.
- [ ] Finished-file technical QA and final visual review; no unplanned pops or broken contact points.
- [ ] Finished MP4 + QA report saved on the assigned branch; user can open/download it easily.
- [ ] Temporary workflow changes restored; this file’s **Current work** section updated accurately.

## 8. Keep this guide useful

After each delivery or user correction, update the approval history and current checkpoint. Distinguish **planned**, **implemented**, **rendering**, **reviewed**, **delivered**, and **user-approved**. Record unresolved problems honestly. Do not make the next agent infer status from the presence of an old `final-720p.mp4`.

## 9. Separate stream: Nvidia news short (approved by the user)

A different kind of film from the engineering series: a one-minute news explainer, "Nvidia's CEO and the Suspected Spy". It does not replace or change the City Hall checkpoint in section 3.

- **Status: user-approved.** The user watched the delivered MP4 and said: "so well done and not lazy", "maybe the best one". At the user's request the film and its source are kept on `main` as the reference for **news shorts**, a separate category from the regular explainer shorts: `references/news/nvidia-spy/`, with the category described in `AGENTS.md`, `README.md` and `IMPORTANT.md`. Before that it was technically checked and its finished picture reviewed on contact sheets; the agent set the sound with meters and did not listen to it.
- **Produced on** branch `arena/44d045b4-ntc-8f3a9x2k`. The branch name is provenance, not a dependency: use the copy on `main`.
- **File:** `shoots/nvidia-honeypot/final-720p.mp4`, render commit **`56cbf5b`**, run **`42918009608`**. 720×1280, 30 fps, **2075 frames / 69.167 s**, 51,611,759 bytes; H.264 + 48 kHz stereo AAC. Finished-file QA: −14.6 LUFS, −1.8 dBFS true peak; no silence, black, unplanned white or frozen frames; the only frame jumps are cuts, caption changes and arriving graphics.
- **What the user decided:** narration v5 approved; voice = the 4th of six full reads (Arena `voice-15`; twelve earlier auditions were rejected as artificial); then "make the video and render it in github". The user was annoyed at being given six reads to choose from: offer one candidate, not a menu.
- **Everything about the film** is in `shoots/nvidia-honeypot/SCRIPT.md`: sourced facts, accuracy rules, beat map, voice, sound, render. Film code: `remotion-app/src/videos/nvidia/` (composition `NvidiaShort`). Sound: `shoots/nvidia-honeypot/audio/build_mix.py`.
- **Accuracy rules that must survive any edit** (the subject is an unproven allegation about real people): attribute the spy claim every time; "honeypot" only as "if true"; keep China's denial, "she hasn't been charged" and the board statement; quotes exactly as reported; the woman is an anonymous figure in white, never a likeness; no jokes about the wife or children.
- **Timing is data, not code:** picture, captions, graphics and sound all read `words.json`. To re-time, run `build_voice.py`, then `build_mix.py`, then render. The read is brisk (1.2×), so three beats of silence are put back on purpose: after "Quote:", after the email quote, before the closing question.
- **Sound, first render replaced:** the first render had the music 10.5 LU under the voice. The copy of this guide on `main` (and `IMPORTANT.md` there) records 9–11 LU as rejected for being inaudible and 5–6 LU as accepted; this branch started before that was written. The delivered mix has it 5.5 LU under while someone speaks (6.8 LU counting only what a phone speaker plays, above 300 Hz). Words stay clear because the music's 1.2–5 kHz band dips under speech and an accent that lands on a word is held about 3 LU under it. `cues.md` starts with these measurements; check them before changing levels.
- **Render workflow:** `.github/workflows/render-short.yml` now splits any composition into 20 frame ranges on parallel runners: about 8 minutes for this film instead of an hour-long single job. `-f parts_from=<run id>` reuses the rendered picture of an earlier run when only the sound changed (about 2 minutes; parts are kept 3 days). Its defaults point at this film; pass `composition`, `mix`, `shots` and `publish` for another one. Job logs could not be downloaded in this sandbox, so failing steps and the QA summary are written to the run's annotations.
- **Lessons from this film:** keep the caption band (70–82 % of the height) free of signs, props and heads; size captions to fit one line; white props need an unlit material or they grey out; lens blur only on close shots (it was more than half the render cost).
- **Known small things, left as they are:** the "ON AIR" sign is partly behind a graphic in the interview shot; two board members are cut by the frame edge in the board-statement shot.
