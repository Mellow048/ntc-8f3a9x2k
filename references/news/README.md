# News reference — the user's approved news shorts

This is a **separate category** from the regular shorts in
[`../approved/`](../approved/README.md). A news short tells a real-life story
that is in the news. It uses the same look and passes the same release gates,
but it is paced and built differently and has extra accuracy rules, so it has
its own reference.

Like `../approved/`, these are **the user's own approved originals**, not the
third-party style-study images elsewhere in `references/`.

## First decide: study this folder, or ignore it

| The user asks for | What to do |
|---|---|
| A short about **real-life news**: real people, companies or events that are in the news, something that just happened or is still unfolding | **Study this folder before planning.** It is the standard a news short has to match. |
| A regular short that explains or tells something entertaining: engineering, science, history, curiosities. **This is the default** whenever no news story is named. | **Ignore this folder.** Study `references/approved/` instead. Do not borrow the news structure, graphics, tone or music. |

## The films

| Film | Video | Source / guide | Role |
|---|---|---|---|
| Nvidia's CEO and the Suspected Spy (69 s) | [final-720p.mp4](nvidia-spy/final-720p.mp4) | [Study and reproduce](nvidia-spy/README.md) | The benchmark for news shorts. The user: "so well done and not lazy", "maybe the best one". |
| The GTA 6 Leaker Who Wanted a Disc (74 s) | [final-720p.mp4](gta6-leaker/final-720p.mp4) | [Study and reproduce](gta6-leaker/README.md) | Made by following the first film. Approved at the first delivery, with no questions to the user. The user: "another banger". |
| The Hack That Melted 700 Supermarkets (74 s) | [final-720p.mp4](fridge-hack/final-720p.mp4) | [Study and reproduce](fridge-hack/README.md) | Made by following the first two, approved at the first delivery: "awesome sauce, same banger". Adds changes of shot that are not cuts, and music that takes part in the story. |
| The $6.3 Billion Job Interview (75 s) | [final-720p.mp4](binance-heist/final-720p.mp4) | [Study and reproduce](binance-heist/README.md) | The user: "you are the best at this!". Adds a source tab for one side's own account, dated claims, and two checks of the sound. |
| The $129 Million Fake Boss (76 s) | [final-720p.mp4](fake-boss/final-720p.mp4) | [Study and reproduce](fake-boss/README.md) | The first made from `main` by following the playbook. The user: "another fricking banger". Adds a whole film told as one side's untested account, defendants without faces, and one tune for two players. |
| The Hackers Who Said Sorry (74 s) | [final-720p.mp4](sorry-hackers/final-720p.mp4) | [Study and reproduce](sorry-hackers/README.md) | Delivered with the next one; the user on both: "another banger after banger". Adds a story half told in a criminal group's own words, an offer that is never shown without the warning against it, and the check of every change of shot from the numbers. |
| The $100 Million Truck Stop (71 s) | [final-720p.mp4](truck-stop-heist/final-720p.mp4) | [Study and reproduce](truck-stop-heist/README.md) | **The newest: start a new film from this one.** Adds a plea that is agreed and not entered, what is pleaded kept apart from what is admitted, a disputed number as the ending, and a reading of the picture for things that jump before the render. |

The user asked for the second film to be kept here "so that other agents
follow your footsteps without me arguing again". The next section is those
footsteps. The third and fourth films followed them without a question to the
user, who then asked for all of it to be kept on `main` "so that other agents
follow your skills in making these perfect shorts". The fifth film was made from `main` by
following this page and the playbook, again without a question, and so were the sixth and the seventh.

**[`PLAYBOOK.md`](PLAYBOOK.md) is the same order as a checklist, with every
number, command and trap the seven films produced. Read it before you start.**

## How to make a news short: the order every film followed

**Before you start: do not ask the user what is already decided.** Format
(720×1280, 30 fps, one or two caption words at a time), Arena narration in the
voice the user chose, original music that can be heard, rendering on GitHub
Actions and delivery as an MP4 on your branch are standing decisions, written
in [IMPORTANT.md](../../IMPORTANT.md) and
[VIDEO_HANDOFF.md](../../VIDEO_HANDOFF.md). Ask only what neither the
repository nor the news can answer. Do not stop to have the script, the voice
or the plan approved unless the user asks to see them first: finish the film
and show the script with it.

1. **Research first.** Search the story in several outlets before writing a
   word. Fill a table in `shoots/<slug>/SCRIPT.md`: fact, source link, date
   checked. Check the details in the request itself the same way. List what
   you could not confirm and decide for each item whether the film words it
   carefully or leaves it out.
2. **Write this film's rules, then the narration.** Who is a named caricature
   and who is anonymous, what stays attributed, what will not be shown. Then
   200 to 240 words for 60 to 75 seconds. The first line is the whole story.
   If the user asked a question, one line answers it plainly. The other side
   gets its own lines. The last line is a question with two real sides. Map
   every line to rows of the facts table.
3. **Voice: one take.** Use the voice the user chose; all seven films use it, and
   `voice/voice.wav` in any snapshot is the record of how it sounds. Voice
   ids do not carry over to a new session. If yours has none, make one
   `add_voice` call (en-US, masculine, conversational) with the film's opening
   lines as the audition text and go on with the voice the user picks. Do not
   run a series of auditions and never hand over several full reads to choose
   from. Keep the raw take, then run a copy of `build_voice.py` to get
   `voice.wav` and `words.json`.
4. **Copy the machinery, write the film new.** Run
   `python references/news/restore.py truck-stop-heist`: it puts the newest
   film's source into your checkout and registers it (the shared machinery
   and the render workflow are already live on `main`). Check that it renders
   a still, copy its two folders under your film's names, and write your film
   in the copies. Write `story.ts` first:
   one staged picture for each phrase, every cut on a spoken word, a new
   picture every 1.5 to 2 seconds. Then the sets and costumes, then the
   graphic cues, then the score and effects. Nothing of another film's story,
   sets or music goes into yours.
5. **Look at stills before you pay for a render.** The cast sheet first. Then
   every shot, in the middle and in its first frames after the cut, and the
   frames either side of every change of shot on the same set. Fix what you
   see and look again. The second film took five rounds, the fourth eight, the fifth and sixth seven.
6. **Render on GitHub Actions** with the parallel workflow, and read the check
   report it writes. Whatever it flags gets fixed and rendered again, not
   explained away.
7. **Check the finished file**: size and frame count, loudness and true peak,
   the music's level against the voice, the voice against music and effects
   word by word (`templates/scripts/word_margins.py`), the encoded sound
   against its WAV (`templates/scripts/aac_check.py`), and frames of the final file wherever
   it differs from what you already looked at.
8. **Search the news again on the day you deliver.** If the story moved, the
   film moves with it.
9. **Deliver with a plain account**: the answer to the user's question first,
   then the link to the file pinned to its commit, the narration, what you
   could not confirm, what you checked and what you did not. If you measured
   the sound and looked at stills, say that. Never say you listened or watched.
10. **Record it** in the film's `SCRIPT.md` and in a short section of
    `VIDEO_HANDOFF.md` on your branch. A film is added to this folder only
    after the user has approved it and asked for it to be kept;
    `make_reference.py` then writes its folder.

What the films share, and what they do not:

| The same in all seven | New in each |
|---|---|
| The order of work above | The story, its facts and its rules |
| The look: painted 3D sets, flat cartoon people, ink outlines, word-timed captions | Every set and every costume |
| The machinery: building kit, caption and card components, post passes, mixing chain, render workflow | The shot list and the graphic cues |
| The voice and the release gates | The score, the effects and the closing gag |

## What a news short needs on top of the usual gates

Every gate in [IMPORTANT.md](../../IMPORTANT.md) still applies. Rules 1–9 come
from the first film, 10–13 from the second and 14–18 from the third and
fourth. A new news short follows all of them:

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
   never a likeness. Someone nobody has identified gets no face at all.
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
10. **Answer what the user asked.** When the request is a question ("what
    happened to…?"), the film says the answer in plain words, and so does
    your reply.
11. **Do not help the wrongdoing along.** Show nothing from leaked or stolen
    material. Give no name, address or link that leads to it, or to something
    the subject of the story is selling.
12. **A number on screen is a reported number.** Put its source beside it.
    Draw a chart to scale from zero and say which points are reported. Note
    arithmetic of your own as such in the facts table.
13. **Search again before you deliver.** The film has to be right on the day
    the user gets it.
14. **One side's own account is labelled as that, for as long as it runs.**
    When a stretch of the story is known only from one party (a company's
    report on its own breach, a prosecutor's version), say so in the
    narration and keep a source tab on screen through all of it. A detail
    from elsewhere takes the tab off and names its own source.
15. **Who did it is always somebody's statement.** Each party gets a shot of
    its own with its exact words, the speaker and the date. A statement read
    out by someone else (a spokesperson, a state news agency) is shown as
    that: the author is named on the card and not drawn. A later event that
    nobody has linked is blamed on nobody, in a line of its own.
16. **Put a date on what can change.** "Nobody has been charged", a count of
    money or victims, "as of": the date stands on screen beside the claim.
17. **Nothing that helps anyone repeat it.** No tool, site, app or method is
    named. Every screen, panel and interface is made up. No address, code or
    command is shown.
18. **The closing question judges nobody.** Both answers are positions that
    someone really holds, each with a source in the script. The figures under
    them do not react, a party's own line stays on screen if it bears on the
    answer, and no joke lands on a private person.

## What agents must study

1. Watch the films through, then again cut by cut. If you cannot play video,
   go through the two shot sheets in each film's folder. Note what is new in
   every shot: 39 shots in 69 seconds, 46 in 74, 43 in 74 and 45 in 75, each
   staged for its own line.
2. Read each `SCRIPT.md` (facts table, what could not be confirmed, rules,
   beat map), then `story.ts`.
3. Read `Overlays.tsx` and `Captions.tsx`: the on-screen graphics carry the
   sources, names, dates and exact quotes.
4. Read the sets and the cast to see how places and people become recognizable
   from shape, detail and staging, not from labels on boxes.
5. Read `build_mix.py` in each. Reuse the techniques, **not the music**: the
   seven scores share neither key nor tempo, and the last three have a metre of their own; every film needs its own.
6. Read the render workflow and the review scripts.
7. Compare the films. What they share is what to reuse. Everything else
   was written for one story and stays with it.

Each film is a snapshot of a developing story on the date given in its guide.
Do not reuse its facts, script, sets or score for another story. Reuse how it
was made.

## Preservation

Each film's folder holds the approved MP4 unchanged, `source/` with the
original repository-relative paths, and a SHA-256 manifest with the source
commit. Run `python references/news/verify.py` to check every file.
`audio/mix.wav` is not stored; `build_mix.py` regenerates it from the included
voice. The workflow under `source/.github/` is an inert copy: nothing runs from
here.

Do not edit these folders or build inside them. `python
references/news/restore.py <film>` copies a film out into your working
checkout and registers it; `make_reference.py` writes a new folder here from a
finished, approved film. They stay on `main`, so deleting a branch does not
remove them.
