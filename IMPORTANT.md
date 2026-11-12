# IMPORTANT — release gates for every short

Read [AGENTS.md](AGENTS.md), then [VIDEO_HANDOFF.md](VIDEO_HANDOFF.md), and
[the approved reference library](references/approved/README.md) **before building**.
These are current user requirements. Older conflicting defaults in `SKILL.md`
or historical source are not permission to ignore them.

**Two kinds of short.** A *regular short* explains something or tells an
entertaining story; it is the default, and sections 1–5 are written for it. A
*news short* covers real-life news. It has its own reference,
[`references/news/`](references/news/README.md), and extra gates in
[section 6](#6-news-shorts-a-separate-category-with-extra-gates). For a regular
short, ignore both.

**Approved regular-story benchmark:** [Köpenick, music-v2](references/approved/koepenick/README.md).
The user explicitly approved visuals, narration, pacing and music, and asked
for the film plus source as a teaching reference on `main`. Study its actual
set/cast/action/caption/audio implementation alongside Taipei and Beer. Labels
cannot substitute for recognizable, detailed geometry. Approval of this film
is not a waiver of review or permission to recycle its story or score.

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
   (News short: study the news reference instead, see section 6.)
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

## 6. News shorts: a separate category with extra gates

**This section applies only when the user asks for a short about real-life
news**: real people, companies or events that are in the news, something that
just happened or is still unfolding. If the user wants a regular explaining or
entertaining short, **skip this section and ignore `references/news/`**.

For a news short, study the approved films before planning: the MP4, the
script with its sources, and the film, sound and render source. Then read
[`references/news/PLAYBOOK.md`](references/news/PLAYBOOK.md), the checklist
with every number, command and trap those films produced.

- [`references/news/nvidia-spy/`](references/news/nvidia-spy/README.md): the
  user called it "so well done and not lazy" and "maybe the best one", and
  asked for it to be kept apart from the other references because it is a
  different category.
- [`references/news/gta6-leaker/`](references/news/gta6-leaker/README.md):
  made by following the first one and approved at the first delivery
  ("another banger"). The user asked for it to be kept "so that other agents
  follow your footsteps without me arguing again".
- [`references/news/fridge-hack/`](references/news/fridge-hack/README.md):
  the freezer hack, approved at the first delivery ("awesome sauce, same
  banger").
- [`references/news/binance-heist/`](references/news/binance-heist/README.md):
  the Binance heist ("you are the best at this!").
- [`references/news/fake-boss/`](references/news/fake-boss/README.md):
  "another fricking banger"; the first made from `main` by following the
  playbook.
- [`references/news/sorry-hackers/`](references/news/sorry-hackers/README.md)
  and [`references/news/truck-stop-heist/`](references/news/truck-stop-heist/README.md):
  delivered together ("another banger after banger"). The truck-stop film is
  the newest and the one to start a new film from:
  `python references/news/restore.py truck-stop-heist`.

Match their care; do not copy their stories, sets or scores. **Work in the
order written in
[`references/news/README.md`](references/news/README.md#how-to-make-a-news-short-the-order-every-film-followed)**,
and do not ask the user to restate or approve what is already decided there
and in sections 1–5: start, finish the film, and show the script with it.

Sections 1–5 apply in full. Rules 1–9 come from the first approved news film,
10–13 from the second and 14–18 from the third and fourth; a new one must
follow all of them:

1. **Facts first, with sources.** Search the news before writing. Keep a table
   of fact, source link and date checked in the film's `SCRIPT.md`; every
   narration line maps to a row. Where outlets disagree, use only what they
   agree on.
2. **Attribute every unproven claim, every time**: who says it, "reportedly",
   "allegedly", "if true". Never narrate an allegation as a fact.
3. **Keep the other side in the film**: a denial, "has not been charged", the
   company's statement. Each gets its own shot.
4. **Quotes exactly as reported**, on a card with the speaker's name. Never a
   quote you cannot source.
5. **Real people with care.** A public figure is a simple caricature made of
   well-known public features, with a name tag. A private person, or anyone
   accused and not charged, is an anonymous figure, never a likeness. Someone
   nobody has identified gets no face at all.
6. **Jokes aim at the situation**, never at a spouse, children or a victim.
   Nothing sexual.
7. **Pace and graphics.** About a minute unless the user says otherwise; a
   new, purposely staged picture every couple of seconds; on-screen graphics
   carry the sources, names, dates, numbers and exact quotes, clear of the
   caption band.
8. **End on a question that has real sides**, not on a verdict the facts do not
   support.
9. **Tell the user what you could not confirm** when you show the script.
10. **Answer what the user asked.** When the request is a question, the film
    and your reply both say the answer in plain words.
11. **Do not help the wrongdoing along.** Show nothing from leaked or stolen
    material, and give no name, address or link that leads to it or to
    something the subject of the story is selling.
12. **A number on screen is a reported number**, with its source beside it. A
    chart is drawn to scale from zero and says which points are reported.
13. **Search the news again on the day you deliver.**
14. **One side's own account is labelled as that for as long as it runs**: said
    in the narration, and a source tab on screen through all of it.
15. **Who did it is always somebody's statement**, each in its own shot with
    the exact words, the speaker and the date. Nobody is blamed for an event
    that nobody has linked.
16. **Put a date on what can change** ("nobody charged", a count), on screen.
17. **Nothing that helps anyone repeat it**: no tool, site, app or method is
    named, and every screen is made up.
18. **The closing question judges nobody**: two positions that someone really
    holds, figures that do not react, no joke on a private person.

No document guarantees a one-shot acceptance. These gates prevent repeating
known failures; visual/audio judgment and truthful reporting remain required.
