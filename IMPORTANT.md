# IMPORTANT — release gates for every short

Read [AGENTS.md](AGENTS.md), then [VIDEO_HANDOFF.md](VIDEO_HANDOFF.md), and
[the approved reference library](references/approved/README.md) **before building**.
These are current user requirements. Older conflicting defaults in `SKILL.md`
or historical source are not permission to ignore them.

## 1. Format and scope

- **720×1280 portrait, 30 fps only.** Not 2K.
- Synchronized changing **1–2-word subtitles**, never full sentences.
- Use Arena TTS for new narration; preserve saved approved voice when unchanged.
  Voice IDs are session-local; do not assume an old ID is available.
- One requested film at a time. Leave unrelated approved films and other agents'
  projects untouched. Follow the platform-assigned branch; never switch to a
  branch named in an old handoff.
- Heavy 3D rendering on GitHub Actions, not locally. Save actual source/voice
  and deliver the MP4 with a usable GitHub link, not only an Actions artifact.

## 2. Recognizable objects, not defended placeholders

- A box primitive may be one construction part; **a box is not a finished car**.
  Cars need a recognizable body/silhouette, wheels/arches, glazing, lights and
  road contact. Hero machinery needs functional parts, supports, joints,
  cables and believable scale. Architecture needs meaningful depth and detail.
- Never tell the user a crude placeholder is “stylized” or “high quality” to
  excuse missing work. If it is unfinished, say so and finish it.
- Water is not a blue cuboid or a flat colour sheet: show appropriate surface
  motion, highlights/reflection, depth, foam and object interaction. Boats and
  people must sit in/submerge through the surface, not walk on hard water.
- Check the actual portrait frame at delivery resolution. Detail hidden,
  cropped, blurred away or unreadable on screen does not count.
- Match the care of the approved Taipei and Beer examples. Preserve the
  painted/ink-outlined 3D world and expressive flat cartoon character look.
  DOF is selective emphasis, not camouflage for low-detail models. No grain.

## 3. Storytelling and physical action

- Recognizable hook immediately; entertaining surprise before lecture.
- Every beat adds a new action, reveal, mechanism, consequence, setting or
  scale. **More angles of the same static scene are not new storytelling.**
- Animate the mechanism on its spoken word, with visible before/during/after
  states, correct direction, contact, load path and held endpoints.
- Distinguish supporting people from the protagonist. No confusing duplicate
  protagonist, cropped heads, unexplained disappearances or animation resets.
- Camera motion supports the action; arbitrary bobbing/idle loops do not fix
  a static story. Respect timing, continuity and physical immersion.
- Write a real ending: setup/payoff or callback, intentional spoken cadence,
  enough space for the final idea to land, and a short resolved visual/music
  tail. Do not cut the export off as the final word ends.

## 4. Audio must work at normal playback volume

- Compose a distinct score for each film. Do not recycle a melody/recording or
  blindly reuse the same timbre/rhythm. Reusing DSP code is not reusing music.
- Match mood to the subject: engaging curiosity/tension/relief, not a blanket
  depressing drone. A musical cue should progress with the story and resolve.
- Narration remains intelligible, **but music must actually be noticeable at
  ordinary listening volume**. Do not require 150% volume to hear it.
- Köpenick feedback: if the beat is distracting or hard to follow, improve
  the groove/arrangement, **do not simply lower the music**. The user explicitly
  values music as a bridge to retention. Keep a readable pulse and musical
  identity without competing layers or unintended meter resets at story cuts.
- Measure relative music level **after ducking**, then assess the muxed MP4.
  Lake's accepted polish used music ~5–6 LU below speech; earlier ~9–11 LU
  below was rejected as inaudible. This is a starting benchmark, not a magic
  number or a mandate to overpower every narrator.
- 48 kHz stereo. Aim roughly −14 to −15 LUFS integrated, with codec headroom
  and finished-file true peak ≤−1 dBTP. Retiming means rebuilding the mix and
  captions. A loud master alone does not fix a buried music stem.

## 5. Mandatory review, honesty and delivery

1. Study both approved MP4s **and** their story/world/audio source; write a
   shot plan with genuinely distinct beats before spending a full render.
2. Typecheck and test deterministic motion; inspect diagnostic frames at
   opening, faces, mechanism contacts, before/during/after actions and ending.
3. Compare against approved originals. Fix visible placeholder geometry and
   physics errors before the full GitHub render.
4. Run technical QA on the final MP4 (specs, silence, black/white/frozen frames,
   pops, loudness/peaks), then inspect the **finished** picture and audio.
5. A passing test is not aesthetic approval. Distinguish planned, implemented,
   running, technically checked, visually checked, delivered and user-approved.
   Never claim to have listened or watched if you have not.
6. Preserve accepted versions until replacements pass review. When only audio
   or pacing changes, reuse rendered picture where practical instead of
   charging another hour of 3D rendering. Avoid repeated lossy re-encodes.
7. Present the MP4, provide a pinned GitHub link, document unresolved issues,
   and update the handoff. Never promise an unattended job will finish by a
   deadline you cannot control.

No document guarantees a one-shot acceptance. These gates prevent repeating
known failures; visual/audio judgment and truthful reporting remain required.
