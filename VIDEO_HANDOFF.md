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

**Active production item: “The Building on Giant Springs” / San Francisco City Hall.** The user asked to move to the next idea after accepting the bridge. They then interrupted to request this handoff document; that interruption was not a rejection of the City Hall work.

### Known checkpoint when this handoff was written

- City Hall implementation commit: `beecdbc` (`Build detailed City Hall isolation short with narration-locked demonstrations`).
- Dedicated new source: `remotion-app/src/videos/spring-remaster/`.
- Existing composition: `SpringBuildingShort`, routed through `engineering-series/Series.tsx` to the new `SpringWorld`.
- Approved **existing** Arena narration retained: `shoots/spring-building/voice/voice.wav`, with `voice/words.json`.
- Duration: 1890 frames / 63.000 s at 30 fps.
- New picture: 31 planned shots; bespoke windowed Beaux-Arts City Hall, ribbed dome, gold bands/lantern, columns, plaza/street details, real car meshes, foundation cutaway, bearing close-ups, clearance/moat shot, jelly analogy.
- New audio: `shoots/spring-building/audio/mix-remaster.wav`, generated by `mix_remaster.py`; measured −15.00 LUFS / −1.40 dBTP before AAC mux.
- Typecheck and `shoots/spring-building/test-motion.mjs` passed.
- **Not yet visually approved or finally rendered.** The old `shoots/spring-building/final-720p.mp4` is still the earlier low-detail batch export. Do not present it as the new version.
- GitHub diagnostic run **`42786877450`** was still `in_progress` at the last explicit status check. The local watch was interrupted by the user; **that does not mean the remote run was cancelled.** Recheck the run before dispatching a duplicate.
- The diagnostic workflow is intended to commit 16 reviewed keyframes as four sheets under `shoots/spring-building/review/initial-*.jpg`. Check both the run result and the branch for those files. A later branch push can make its simple runner push fail; inspect any failure before assuming rendering itself failed.
- `.github/workflows/render-short.yml` currently contains **temporary City Hall diagnostic/publishing changes**. Restore the normal workflow after delivery (the version at `7bc7551` is a known clean baseline). Do not accidentally ship hard-coded spring review behavior as a general workflow feature.

### Next steps for City Hall

1. Recheck diagnostic run `42786877450` with `gh`; fetch/pull safely and inspect the review sheets if available.
2. Review framing/legibility against the approved Taipei/bridge references. Especially: whole building and dome recognizable in portrait; guide not obscuring architecture; isolator end plates and shear visible; jelly/tray/table contact; moat clearance; caption safe area.
3. Audit the illustrated load path and ground movement. A specifically identified follow-up to inspect: exterior/history `hallSet` currently moves the building but the civic-plaza environment is not grouped to follow the foundation. Make historical fixed-base versus isolated motion visually coherent rather than implying the historical building slides freely over stationary pavement.
4. Inspect bearing rubber shear. Current geometry shows stacked translated cylindrical layers between attached end plates. If it reads like disconnected pancakes rather than shearing rubber, improve the deformation before the final render. This is a review concern, **not a completed fix**.
5. Re-run typecheck, motion tests, and `python3 shoots/build_series_qa.py` after any changes. If motion timing changes, rebuild **only** City Hall’s sound.
6. Render **720p only**, with composition `SpringBuildingShort`, mix `shoots/spring-building/audio/mix-remaster.wav`, and QA metadata `shoots/spring-building/qa-shots.json`.
7. Run finished-file technical QA AND visual review. Then replace the old City Hall MP4, publish it on the assigned working branch, restore temporary workflow changes, update this checkpoint, and present the finished video.

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
- A detailed 720p render has taken approximately **50–67 minutes** on the available runner. Be honest about running versus completed status. Do not call it delivered just because dispatch succeeded.
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
