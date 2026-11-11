# The GTA 6 Leaker Who Wanted a Disc — the second approved news short

- Video: [final-720p.mp4](final-720p.mp4)
- Every shot at a glance: [shots 1–23](shots-01-23.jpg), [shots 24–46](shots-24-46.jpg)
- Source commit and checksums: [manifest.json](manifest.json)

The user watched this film and said: "another banger". It is the first news
short made by following the [Nvidia reference](../nvidia-spy/README.md), and
the first file delivered was the one approved. The user asked for it to be
kept on `main` beside that film "so that other agents follow your footsteps
without me arguing again".

> **Use this only when the user asks for a short about real-life news.** For a
> regular short that explains something or tells an entertaining story, close
> this folder and study [`references/approved/`](../../approved/README.md)
> instead.

## The film in numbers

| | |
|---|---|
| Length | 74.43 s, 2233 frames, 720×1280, 30 fps |
| Research | 18 facts, each with a source link; 9 things that could not be confirmed, each with how the film handles it |
| Narration | 235 words in 73.1 s, 15 lines; the Arena voice the user picked for the Nvidia film, one take, read lifted to 1.2× |
| Picture | 46 shots on 13 sets, a new picture every 1.6 s on average |
| Captions | one or two words at a time, on one line, 76 % down the frame |
| Graphics | 41 timed stamps, name tags, source lines, counters and quote cards, plus the closing A/B card |
| Sound | an original 104 bpm score that steps back for every quote, 99 timed cues, −14.6 LUFS |
| Render | 20 parallel jobs on GitHub Actions, 8 to 11 minutes a run; two full runs |

## How it was made: the steps to repeat

The request was one question: what happened to the person who leaked the GTA 6
gameplay, as a news short. The user was asked nothing. This is what was done,
in order. The general version of these steps is in
[`../README.md`](../README.md).

1. **Read the standing rules first.** `AGENTS.md`, `IMPORTANT.md` (§6 for
   news), `VIDEO_HANDOFF.md` §9 and the Nvidia reference already say the
   format, the voice, how loud the music is, where to render and how to report
   the news. None of it was asked again.
2. **Researched before writing.** 16 searches gave a table of 18 facts with
   links (`SCRIPT.md`). The details in the request itself were checked like
   any other fact. Where outlets disagreed, the film says only what they agree
   on. Nine things could not be confirmed; each is listed with what the film
   does about it, and three of them were left out of the film.
3. **Wrote the rules for this film before any picture**: the leaker has not
   been identified or charged, so no face and "they"; nothing from the leaked
   footage; no coin name; jokes about the situation.
4. **Wrote 235 words in 15 lines**, each line mapped to rows of the facts
   table, ending on a question with two real sides.
5. **One voice take** with the voice the user had already chosen. No auditions
   were put in front of the user. `build_voice.py` turned the take into
   `voice.wav` and `words.json` and put five beats of silence back.
6. **Copied the machinery** from the Nvidia snapshot and wrote this film's own
   shot list, sets, costumes, graphic cues and score. Nothing from the Nvidia
   film's story, sets or music is in it.
7. **Looked at stills and fixed what they showed, five times**, before paying
   for a full render: first the cast sheet, then every shot.
8. **Rendered on GitHub and read the check report.** It found two almost
   black frames and four frame jumps it had not been told to expect, all at
   one door. 342 frames of that file were looked at: one per shot, one in
   every eight, and 17 around the door. Three things were fixed (the door, a
   late name tag, the list of planned jumps) and the film was rendered again.
   The two files were compared frame by frame, so only the two places that
   had changed needed a second look.
9. **Searched the news again just before delivery.** Nothing had changed.
10. **Delivered with a plain account**: the answer to the user's question, a
    link to the file pinned to its commit, the narration, what could not be
    confirmed, what was checked and what was not.

## Why it works: carry these over

1. **The first line is the whole story.** "A leaker threatened to release
   the most awaited video game on Earth. Before the studio could!" 4.3
   seconds, three shots, three graphics.
2. **It answers what the user asked.** The question was what happened to the
   leaker. Line 13 says it plainly, "So far, nobody's been publicly identified
   or charged", over a police line-up of four identical hoods and a detective
   who shrugs.
3. **A viewer who has never heard of the game can follow.** One line says what
   it is and why it matters: the last one sold 230 million copies.
4. **Nobody knows who the leaker is, and the film draws exactly that**: a
   hood with no face in it, two pale eyes, leek leaves out of the top. The
   limit became the mascot. The one real person drawn appears only under his
   name tag and beside his own quoted words.
5. **Every number is staged.** A counter rolls to 230,000,000+ over a hill of
   game cases. The $30 million target is a dashed line far above a chart drawn
   to scale, so the viewer sees how far away it was. When the line falls,
   the coin ends up cracked on the floor.
6. **The graphics say what the voice does not:** "SOURCE: IGN", the dates,
   "THE LEAKER'S STATED REASON", "UNVERIFIED", "NOT IDENTIFIED", "NOT
   CHARGED", "YES, THAT IS THE REAL QUOTE".
7. **One object carries the plot.** The RELEASE button under a glass lid opens
   at the threat, blinks at the offer and closes when the threat is called
   off.
8. **It is fair, and it does not help the leak along.** Rockstar, Take-Two's
   CEO and the leaker each get a shot and a card with their exact words.
   Nothing from the leaked footage is shown, the coin has no name on it, and
   nothing says where to find either.
9. **The music gets out of the way of quoted words**, there is a beat of
   silence before "the leeks stop here", and the last chord lands in the pause
   before the closing question.
10. **It ends on a question with two real sides**, A and B, and then a last
    small joke: two eyes come up behind the shop counter and duck back.

## What carried over from the first film, and what was written new

| Carried over almost unchanged | Written for this film |
|---|---|
| `kit.ts`, `fonts.ts`, `props.ts`, `Captions.tsx`, the frame component (`Gta6.tsx`), `World.ts` | `story.ts`: 46 shots, each cut on a spoken word |
| The card components in `Overlays.tsx` (stamp, name tag, pill, quote, calendar leaf, A/B) | All 41 graphic cues; the counter, rewritten to roll to any number |
| The shared cartoon body and post passes in `pendulum/`; the costume kit in `cast.ts` (hair, glasses, suits, hoodies) | In `cast.ts`: the hood with no face, the things people hold (disc, placard, teacup, donation jar, controller, code slip), this film's cast list |
| `build_voice.py` apart from the text and the pauses | All 13 sets in `sets.ts`, `sets2.ts`, `sets3.ts` |
| The mixing half of `build_mix.py`: levels, ducking, limiter, report | The score and every effect in `build_mix.py` |
| The render workflow and the review scripts | One new camera move: `targetTo`, a look-at point that travels with the camera |

That split is the point of a reference: reuse how the film is put together,
write the film itself new.

## Read in this order

All paths are under `source/`, laid out as in the repository.

| Read | For |
|---|---|
| `shoots/gta6-cyberleek/SCRIPT.md` | Facts with a source for each, what could not be confirmed, the film's rules, narration, characters, beat map, voice, sound, render, result |
| `shoots/gta6-cyberleek/narration.txt`, `voice/words.json` | The words and when each is spoken |
| `remotion-app/src/videos/gta6/story.ts` | The 46 shots. Each cut is the index of a spoken word; length follows the last word |
| `sets.ts`, `sets2.ts`, `sets3.ts`, `props.ts`, `kit.ts` | 13 sets, each built once and posed per frame; the building kit |
| `cast.ts`, `../pendulum/toon.ts` | The cast. One shared cartoon body; a person is told apart by costume |
| `World.ts`, `Gta6.tsx` | One set per shot, two lights re-coloured per set; ink, lens blur on close shots, bloom, grade |
| `Overlays.tsx`, `Captions.tsx`, `fonts.ts` | Graphics and captions, each cued by a word; bundled fonts |
| `shoots/gta6-cyberleek/build_voice.py`, `shoots/voice_master.py` | Raw take to locked narration: pauses tightened, pace lifted, word timings, five pauses put back |
| `shoots/gta6-cyberleek/audio/build_mix.py`, `audio/cues.md` | Score, effects and mix, all synthesized; measured levels and the cue list |
| `.github/workflows/render-short.yml`, `remotion-app/scripts/`, `templates/scripts/short_qa.py`, `qa-shots.json`, `qa-report.md` | Parallel render, preview stills, checks on the finished file |

Cannot play video? The two shot sheets show one frame from every shot, taken
late in the shot so its graphics have landed. For more, this makes sheets of
every 15th frame:

```sh
ffmpeg -i final-720p.mp4 -vf "select='not(mod(n,15))',scale=270:-1,tile=7x3" \
  -fps_mode passthrough -q:v 3 /tmp/gta6-sheet-%02d.jpg
```

## Make a new news short the same way

Do this on your own branch, never inside this folder. The steps are in
[`../README.md`](../README.md). What to take from this folder:

- **The machinery**, copied from `source/` to the same paths in your checkout:
  `remotion-app/src/videos/pendulum/`, `remotion-app/public/fonts/`,
  `remotion-app/scripts/`, `remotion-app/tsconfig.json`,
  `.github/workflows/render-short.yml`, `shoots/voice_master.py`.
  `templates/audio/` and `templates/scripts/short_qa.py` are already on
  `main`. It is the same machinery as in the Nvidia snapshot, with one fix:
  `scripts/frame.mjs` takes the film's folder as an argument and follows
  `targetTo`.
- **Starting points for your film** in `remotion-app/src/videos/<slug>/`:
  copies of `kit.ts`, `fonts.ts`, `Captions.tsx`, `World.ts`, `Gta6.tsx` and
  the card components at the top of `Overlays.tsx`. Write your own `story.ts`,
  sets, costumes and graphic cues. Change the list of highlighted caption
  words at the top of `Captions.tsx` (`HOT`) to your script's key words.
- **Sound:** keep the mixing half of `build_mix.py` and write new music and
  effects. The score here belongs to this film.
- **The workflow's defaults name this film.** Pass your own `composition`,
  `mix`, `shots` and `publish`.

Lessons this film paid for, on top of the ones in the Nvidia guide:

- **Look at the first frames after every cut, not only the middle of each
  shot.** One shot opened on an empty phone screen, one on two almost black
  frames, and a name tag arrived half a second after the person it named. The
  mid-shot stills showed none of it.
- **Every visible jump needs a sound, and the check has to know about it.**
  The finished-file check reports every frame jump it was not told to expect.
  Something that pops in or swings open needs a cue in `build_mix.py` whose
  name is in `GRAPHIC_SOUNDS`; `build_mix.py` writes the expected jumps to
  `qa-shots.json` from that list.
- **Do not open a shot on a closed door in a dark room.** Start the movement a
  few frames before the cut, so the first frame already shows it.
- **A vertical frame is narrow.** A pile of cases one narrower per row fills
  half the width; two narrower per row fills it. A chart and a standing figure
  want the same height: stand the figure where the line is not.
- **To keep the caption band plain, put something plain in front of what is
  busy** (the grass hill in front of the pile of cases) instead of shrinking
  the subject.
- **A caricature of a named person gets its name tag as the shot begins**, and
  staff in the same room must not look like that person.
- **A chart of money is linear from zero on both axes** and says on screen
  which points are reported and which part is a sketch. A percentage worked
  out from two reported figures is recorded as your own arithmetic in the
  facts table.
- **Starting a second render of the same film cancels the first.** Do not
  push while a run is publishing its file; run `git pull --rebase` after it.
- **The sandbox can reset in the middle of the work.** The tools vanish and
  `.git` goes back to a fresh clone of `main` while your files stay. Recover
  with `git fetch origin && git reset -q origin/<your branch>`, check
  `git status`, and reinstall the tools. Commit and push after every step.

## Rebuild this exact film

Standalone, from a copy outside the repository:

```sh
cp -a references/news/gta6-leaker/source /tmp/gta6 && cd /tmp/gta6/remotion-app
npm ci
npx tsc --noEmit
npx remotion render src/reference-entry.tsx CyberleekShort /tmp/gta6-picture.mp4 \
  --width=720 --height=1280 --codec=h264 --crf=16 --concurrency=2 --gl=swiftshader --muted
cd ..
python -m pip install numpy scipy
python -B shoots/gta6-cyberleek/audio/build_mix.py
ffmpeg -y -i /tmp/gta6-picture.mp4 -i shoots/gta6-cyberleek/audio/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest /tmp/gta6-reference.mp4
```

As one job, that render takes more than an hour on a GitHub runner. The
parallel way, on your own branch:

```sh
cp -a references/news/gta6-leaker/source/. .
# add the imports and the two <Composition> lines from
# remotion-app/src/reference-entry.tsx to remotion-app/src/Root.tsx
# (Root.tsx on main returns one <Composition>: wrap them in <>...</>, and import
#  the film's FPS and TOTAL under other names, since Root.tsx already uses those)
python -B shoots/gta6-cyberleek/audio/build_mix.py   # writes audio/mix.wav
git add -A && git commit -m "Restore the GTA 6 leaker short" && git push
gh workflow run render-short.yml --ref <your branch> -f composition=CyberleekShort
```

The copy replaces `.github/workflows/render-short.yml` and
`remotion-app/tsconfig.json` on your branch. The workflow muxes `mix.wav` from
the repository, so it has to be committed. When only the sound changed, add
`-f parts_from=<run id>` to reuse the rendered picture (about 2 minutes; parts
are kept for 3 days).

For previews, `scripts/plan.mjs` and `scripts/stills.mjs` bundle
`src/index.ts`; set `REMOTION_ENTRY=src/reference-entry.tsx` to use the
standalone entry, and `REMOTION_BROWSER` to a Chromium binary if Remotion
cannot download its own. `node scripts/frame.mjs gta6 <shot> "x,y,z"` prints
where a point of the set lands in the frame, without rendering; shots are
numbered from 0, as in the comments in `story.ts`.

## What was checked, and what was not

- **The approved MP4** is byte-for-byte the delivered file. Before delivery
  the agent checked it technically (size, frame count, loudness, true peak, no
  black, unplanned white or frozen frames, every frame jump accounted for; one
  planned silence of 0.31 s before "the leeks stop here"). The picture was
  reviewed on still frames: 342 frames of the first full render, then 12
  frames from the two places where the final render differs from it (frames
  1667–1672 and 1921–1938).
- **The agent never listened to it or watched it in motion.** The sound was set
  from measurements. The approval is the user's, after watching it.
- **This snapshot** was tested with both recipes above. Standalone: `npm ci`,
  typecheck, three preview stills and a six-frame render at 720×1280 through
  `reference-entry.tsx`, all compared with the same frames of the approved
  MP4, then `build_mix.py` and the mux. Restored next to `main`'s files:
  typecheck and the render plan (2233 frames in 20 parts). `build_mix.py` gave
  the same `mix.wav` as the one in the MP4 (numpy 2.4.6, scipy 1.17.1; the
  checksum is in the manifest). A full re-render from the snapshot was not
  run. The picture and sound source are the files that rendered the approved
  MP4.
- **Changed after the render:** `scripts/frame.mjs` (it still read the Nvidia
  film's shot list) and one comment in `scripts/stills.mjs`. Neither is used
  by the render. `SCRIPT.md` gained its result and the approval.
- **Not stored:** `audio/mix.wav` (regenerated by `build_mix.py`),
  `node_modules`, the production `Root.tsx`, which also registered an unrelated
  film.
- **Known small things, left as they are:** the crate of leeks is cut by the
  left edge of the frame in the first shot, and in the "called it off" shot a
  corner of the offer screen shows between the leaker and the button until the
  screens go dark.

The story is a snapshot of what was reported up to 2026-11-11, eight days
before the game's release. Links in `SCRIPT.md` to the production branch are
provenance; the files here are the reference.
