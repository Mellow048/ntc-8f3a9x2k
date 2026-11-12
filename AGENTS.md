# Agent entry point — read before making a video

1. Read **[IMPORTANT.md](IMPORTANT.md)** for current mandatory release gates.
2. Read **[VIDEO_HANDOFF.md](VIDEO_HANDOFF.md)** for preferences, approval history
   and the current checkpoint. Preserve other agents' work and follow your
   current platform-assigned branch, never an old branch in these documents.
3. Decide which kind of short the user asked for (next section), then watch
   and study the reference for that kind:
   - Regular short: **[the approved Taipei 101, Beer Flood and Köpenick references](references/approved/README.md)**.
   - News short: **[the seven approved news films and the order they were made in](references/news/README.md)**, then **[the playbook](references/news/PLAYBOOK.md)**.

   They contain real MP4s, original renderer/audio source, saved narration,
   timing data, locked dependencies, provenance and standalone study entries.
   Do not infer quality from filenames like `final.mp4` in older rejected work.

## Which kind of short is this? Decide first

- **Regular short — the default.** The user wants something explained or an
  entertaining story told: engineering, science, history, curiosities. Study
  `references/approved/`. **Ignore `references/news/` completely.** Do not
  borrow its structure, graphics, tone or music.
- **News short.** The user asks about **real-life news**: real people,
  companies or events that are in the news, something that just happened or is
  still unfolding. **Study [`references/news/`](references/news/README.md)
  before planning.** It holds seven approved films, a playbook
  ([`PLAYBOOK.md`](references/news/PLAYBOOK.md): the order of work as a
  checklist, with every number, command and trap) and `restore.py`, which puts
  a film's source back in your checkout. The user called the Nvidia
  film "so well done and not lazy" and "maybe the best one". The GTA 6 leaker
  film was made by following it and was approved at the first delivery
  ("another banger"); the user asked for it to be kept "so that other agents
  follow your footsteps without me arguing again". The freezer-hack and Binance
  films followed the same order ("awesome sauce, same banger", "you are the
  best at this!"), and so did the fake boss, the hackers who said sorry and
  the truck-stop heist ("another fricking banger", "another banger after
  banger"). News is a separate category
  on a different level, and these films are the standard a news short has to
  match. **Work in the order written in that README** and follow the extra
  news rules in [IMPORTANT.md §6](IMPORTANT.md). Do not ask the user to
  restate or approve what those pages already decide: research, write, voice,
  build, render, check, then deliver the finished film with its script.
- A request that names no real news story is a regular short. Do not turn an
  explainer into a news piece, and do not skip the news reference when the
  request is about the news.

For regular shorts, study [Köpenick's source/shot/audio guide](references/approved/koepenick/README.md)
as well as Taipei and Beer. The user explicitly approved its visuals, narration,
pacing and revised music. Learn the detailed construction, action timing and
clear audible groove; do not excuse an unfinished cube as a recognizable prop.

## Stop repeating the user's corrections

- 720×1280/30fps; changing 1–2-word captions; Arena narration.
- Detailed recognizable objects: **no generic boxes passed off as cars**,
  toy scenery, blue-block water or blurry “cinematic” cover for missing work.
- Distinct action-led story beats, not repeated angles of the same scene.
  Mechanisms, people and water react to the words with believable physics.
- Original, film-specific, clearly audible music at normal volume; narration
  intelligible. No automatically reused march, gloomy drone or buried score.
- Planned spoken cadence and a resolved visual/music ending, not a hard stop.
- Preview before expensive rendering. Review the finished MP4, not just stills
  or a QA report. State exactly what was actually checked.
- Do not defend placeholders as finished work, exaggerate quality or claim
  user approval. Do not force the user to repeat these requirements.

Taipei, Beer, Köpenick and the two news films (Nvidia, the GTA 6 leaker) are
study examples, **not templates for
recycling scripts, melodies or sets in unrelated stories**. No “one-shot
perfect” guarantee exists.
If the result visibly misses the benchmark, improve it before claiming success.

Update durable guidance after explicit feedback, keeping historical approvals
separate from technical passes. Existing City Hall checkpoint in the handoff
belongs to a different production stream; do not overwrite it with this batch.
