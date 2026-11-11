# News reference — the user's approved news short

This is a **separate category** from the regular shorts in
[`../approved/`](../approved/README.md). A news short tells a real-life story
that is in the news. It uses the same look and passes the same release gates,
but it is paced and built differently and has extra accuracy rules, so it has
its own reference.

Like `../approved/`, this is **the user's own approved original**, not the
third-party style-study images elsewhere in `references/`.

## First decide: study this folder, or ignore it

| The user asks for | What to do |
|---|---|
| A short about **real-life news**: real people, companies or events that are in the news, something that just happened or is still unfolding | **Study this folder before planning.** It is the standard a news short has to match. |
| A regular short that explains or tells something entertaining: engineering, science, history, curiosities. **This is the default** whenever no news story is named. | **Ignore this folder.** Study `references/approved/` instead. Do not borrow the news structure, graphics, tone or music. |

| Film | Video | Source / guide | Role |
|---|---|---|---|
| Nvidia's CEO and the Suspected Spy (69 s) | [final-720p.mp4](nvidia-spy/final-720p.mp4) | [Study and reproduce](nvidia-spy/README.md) | The benchmark for news shorts. The user: "so well done and not lazy", "maybe the best one". |

## What a news short needs on top of the usual gates

Every gate in [IMPORTANT.md](../../IMPORTANT.md) still applies. The approved
film also does all of the following, and a new news short must too:

1. **Facts first, with sources.** Search the news before writing. Keep a table
   of fact, source link and the date you checked; every line of narration maps
   to a row. Where outlets disagree on a number, use only what they agree on.
2. **Attribute every unproven claim, every time.** Say who says it: "U.S.
   intelligence thinks", "reportedly", "allegedly", "if true". An allegation is
   never narrated as a fact.
3. **Keep the other side in the film.** A denial, "has not been charged", the
   company's statement: each gets its own shot, not a footnote.
4. **Quotes exactly as reported**, on a quote card with the speaker's name.
   No paraphrase inside quotation marks. No viral quote you cannot source.
5. **Draw real people with care.** A public figure is a simple caricature made
   of well-known public features (hair, glasses, jacket) plus a name tag. A
   private person, or someone accused and not charged, is an anonymous figure,
   never a likeness.
6. **Jokes aim at the situation** (the timing, the price), never at a spouse,
   children or a victim. Nothing sexual.
7. **Pace and graphics.** About a minute unless the user says otherwise. A
   new, purposely staged picture every couple of seconds. On-screen graphics
   carry the sources, names, dates, numbers and exact quotes, clear of the
   caption band.
8. **End on a question that has real sides**, not on a verdict the facts do not
   support.
9. **When you show the user the script, say what you could not confirm** and
   what you worded carefully for accuracy.

## What agents must study

1. Watch the film through, then again cut by cut. If you cannot play video,
   go through the two shot sheets in the film's folder. Note what is new in
   every shot: 39 shots in 69 seconds, each staged for its own line.
2. Read `SCRIPT.md` (facts table, rules, beat map), then `story.ts`.
3. Read `Overlays.tsx` and `Captions.tsx`: the on-screen graphics carry the
   sources, names, dates and exact quotes.
4. Read the sets and the cast to see how places and people become recognizable
   from shape, detail and staging, not from labels on boxes.
5. Read `build_mix.py`. Reuse the techniques, **not the music**: every film
   needs its own score.
6. Read the render workflow and the review scripts.

The film is a snapshot of a developing story as reported on 2026-11-10. Do not
reuse its facts, script, sets or score for another story. Reuse how it was made.

## Preservation

The folder holds the approved MP4 unchanged, `source/` with the original
repository-relative paths, and a SHA-256 manifest with the source commit. Run
`python references/news/verify.py` to check every file. `audio/mix.wav` is not
stored; `build_mix.py` regenerates it from the included voice. The workflow
under `source/.github/` is an inert copy: nothing runs from here.

Do not edit this folder or build inside it. Copy what you need to your own
branch. It stays on `main`, so deleting a branch does not remove it.
