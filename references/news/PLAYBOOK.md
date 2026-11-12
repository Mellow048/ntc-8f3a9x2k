# News short playbook

The order of work in [`README.md`](README.md) as a checklist, with the numbers, commands and traps that seven approved
films produced. The README says what a news short is and which rules it obeys. This page says how to get one made in
a single pass. Each film's own `SCRIPT.md` is the worked example for every step here.

The fourth film went from its first commit to the render whose picture the user approved in under three hours. The
fifth, made from `main` by following this page, took an hour and forty minutes and two renders. The sixth and
seventh were made one after the other in four hours, with one and two renders.
Nothing below needs the user, except the choice of topic and, once in a session, the choice of voice.

## 0. Before anything: the working place

- **One branch, pushed after every step.** The sandbox can be reset between two commands. It then comes back older
  than your branch: another `HEAD`, a stale tree, and `/tmp`, the caches and `node_modules` gone. GitHub is the
  record. After a reset: `git fetch origin <branch>`, check that nothing local is newer, then
  `git reset --hard FETCH_HEAD && git clean -fd`. Keep drafts in the repository, never in `/tmp`.
- **Tools.** The sandbox reaches GitHub, the npm registry and PyPI, and nothing else.

  ```sh
  python3 -m venv ~/.cache/ntc-venv && ~/.cache/ntc-venv/bin/pip install numpy scipy pillow imageio-ffmpeg pocketsphinx
  mkdir -p ~/.cache/bin && ln -sf "$(~/.cache/ntc-venv/bin/python -c 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())')" ~/.cache/bin/ffmpeg
  export PATH="$HOME/.cache/bin:$PATH"                     # in every command that needs ffmpeg
  (cd remotion-app && npm ci --no-audit --no-fund)         # seconds when the npm cache is warm
  remotion-app/scripts/local-chromium.sh                   # a browser for local stills, from the npm registry
  ```

- **Start from the newest film.** `~/.cache/ntc-venv/bin/python references/news/restore.py truck-stop-heist --mix`
  copies its two folders into your checkout, registers it, rebuilds its mix and says whether that mix is the approved
  one, byte for byte. Render one still to prove the place works:
  `cd remotion-app && REVIEW=TruckStopReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/t 1000 540`.
  Then copy `remotion-app/src/videos/truckstop/` and `shoots/truck-stop-heist/` under your film's names, rename the four
  ids in the copy's `register.tsx` (`<Film>Short`, `<Film>Review`, `<Film>CastSheet`, `<Film>Compositions`), point
  `PICTURE_WORDS` in `build_voice.py` and `STORY` in `build_mix.py` at the new film folder, add the film's two lines
  to `src/Root.tsx` beside the anchors, and delete the restored folders again. Your film is written
  in the copies: the machinery stays, every set, costume, cue and note is new.

## 1. Topic

Search what is in the news now. When the user asks for ideas, offer a short numbered list, one line each, your
strongest first: the user answers with a number. An idea is worth offering when:

- it happened or moved in the last days, and several outlets report it;
- one sentence tells it and makes someone ask "wait, what?" (a CEO and a suspected spy; a leaker who wanted a disc;
  freezers set to 50 °C; a job interview that cost $6.3 billion);
- it has two sides that someone really holds, for the closing question;
- there are places, people and things to draw, and a number or two to put on screen;
- telling it helps nobody do harm, and it needs no private person's face.

Do not offer the same list twice. Say when an idea expires (a launch date, a verdict).

## 2. Research (about 15 pages read, as many searches)

- Primary documents first: the company's own report, the agency's alert, the statement itself, the filing. Then two
  or three outlets for every fact that matters.
- Write straight into `shoots/<slug>/SCRIPT.md`. Fetched pages are not saved anywhere: what you do not write down is
  gone. One table: number, fact, source link. Put the exact words of anything you will quote into the fact.
- Then two lists: **"Could not be confirmed, and how the film handles it"** (worded carefully, attributed on screen,
  or left out) and **"Rules for this film"** (who is a caricature, who is anonymous, who has no face, what is never
  shown, what the joke is on).
- Where outlets disagree on a number, find a statement every count supports ("less than half").

## 3. Narration: 235 words in 15 lines

That length reads in 73 to 75 seconds at the pace the films use: the third and fourth films are 235 words each and run 74.2
and 75.3 seconds. It does not hold for every text: spoken numbers and names run long. The fifth film's first draft,
242 words, read in 79.5 seconds and was cut to 228 (74.6 s), which cost a second take. The pace also varies from
take to take: the sixth film's 227 words came to 72.4 seconds and the seventh's 228 to 69.4. Count on 3.05 to 3.3
words a second, read the numbers out as words when you count, and cut the text, not the pauses.

- Line 1 is the whole story and its hook. A viewer who has never heard of it must follow every line.
- One line says whose account a stretch is ("Binance says it began in June…"). Each party to a dispute gets its own
  line. A quotation is announced with "quote:" and then given exactly.
- Write for the voice: numbers as words ("six point three billion", "October twenty-ninth"), initials with full
  stops ("F.B.I.", "H.R.", "A.I."), short sentences, one joke at the expense of the situation.
- The last line is a question with two real sides. Under the narration, map every line to rows of the facts table.
- Do not stop to have it approved. Finish the film and show the script with it.

## 4. Voice: one take

- The user's voice is en-US, masculine, conversational; `voice/voice.wav` in any snapshot is how it sounds. Voice ids
  do not survive a session. If you have none, make **one** `add_voice` call with the film's opening lines and go on
  with the user's pick. Never a series of auditions, never several reads to choose from.
- One `generate_speech` call takes the whole narration (the limit is 1500 characters; 235 words fit). Keep the raw
  take as `voice/raw-take.mp3`. Record again only if a word is wrong.
- `python shoots/<slug>/build_voice.py` makes `voice/voice.wav`, `voice/words.json` and the picture's copy of
  `words.json`. It tightens the pauses, lifts the pace 1.2× and puts silence back where the film needs a beat
  (`BEATS` in the script: after "quote:", after a quotation, before the closing question). Rewrite `BEATS` for your
  text, close the gaps inside spelled initials that the take reads slowly (`SQUEEZE`), and give every name the recogniser cannot know its sounds in `LEXICON` (initials go through `SPOKEN`). It
  needs `pocketsphinx`. Then read `words.json`: one entry for every word of the narration, in order.
- **`words.json` is the clock.** Picture, captions, graphics and sound all read it. Re-time by running
  `build_voice.py`, then `build_mix.py`, then rendering; never by editing frame numbers.

## 5. Picture

Write `story.ts` first, then cast and sets, then `Overlays.tsx`.

| Number | Value |
|---|---|
| Shots | 40 to 46 on about 15 sets; a new, staged picture every 1.5 to 2 seconds; the shortest in the last two films is 26 frames |
| A cut | lands 2 frames ahead of its word (`s(word, …)` in `story.ts`) |
| Frame | 720×1280 at 30 fps, drawn at 1080×1920 |
| Camera | a 42° lens on almost every shot: the frame is 0.43 × the camera's distance wide (2.6 units from 6 away). `frame.mjs` says whether someone is inside it on the first frame of the shot |
| Captions | one or two words, centred 76 % down; keep heads, props and signs out of 70–82 % |
| Graphics | stamps and source lines sit in the top band, from 9 % to about 31 % of the height; a sign that belongs to the set stays below it |
| Close shots | about three, and only they get the lens blur (it was more than half the render cost) |

- **Changes of shot.** Two shots of the same thing from almost the same place make the picture hop. Every change is
  a cut to another set, a cut to a clearly different size, one take over several entries (`join: true`), or a move
  that goes on from a camera at rest (`soft: true`). Check it from the numbers in `story.ts` as well: when the
  subject's size changes by a factor between about 0.8 and 1.25 across a cut on one set, it hops. A graphic that
  belongs to one entry vanishes at a join unless it is placed over both, and anything timed from `shot.at` starts
  again there: time it from a word. When a cut goes, what used to vanish on it needs a new end: keep
  the stamp until the next graphic takes its place. A card that is already up must not play its entrance again after
  a cut on the same set (start it before the shot: `at = shot.at − 30`); it is a jump with no sound, and the check
  reports it.
- **People.** One flat construction for everyone, told apart by costume. A public figure is a simple caricature with
  a name tag. A private person is nobody's likeness. Someone nobody has identified has no face.
- **Words on screen** (`Overlays.tsx`, every cue keyed to a word): a stamp for the claim, a source line under it, a
  name tag, a quote card with the spoken words marked, a calendar leaf, a counter, a tab that says whose account is
  running, two answers at the end. Every number has its source beside it and every status its date. Long source
  lines fit themselves to 84 % of the width. Write "X", not "×": the stamp font draws it tiny. A tab that
  stays up for most of a film sits on the left at 31 % of the height and is up to 47 % of the width: keep its text
  short, and frame heads, cards and signs below 36 % or to the right of it from the first still.
- **Small things that cost a render each:** white props need an unlit material or they turn grey; a glow behind
  someone is `halo()`, not a `pool()` stood on end; a card beside a seated figure covers the face unless the camera
  aims beside the figure; water from a hose is one tapered tube with spray at its end; fire needs drawn flames; a figure that holds something out to
  the side needs a wider drawing (`WIDE` in the fifth film's `cast.ts`), or the thing is cut off at the edge of the
  figure's canvas; a small animal on the ground sits under the captions, so stand it on something.
- **Things that jump and that the check does not report:** something that appears inside the frame before it
  moves (start it outside), something that leaves after a few frames (let it shrink away in the frame), a cue that
  starts too late to finish before the cut. Read every set's `tick` for these before the render.
- **A portrait frame is narrow.** Anything wide is cut at both edges: stand a long vehicle at an angle so that it
  runs into the depth, stack things instead of placing them side by side, and work out where a sign lands with
  `frame.mjs`. A set's own sign is hidden while a card, stamp or tab is in front of it.
- `node scripts/shots.mjs <film> table` lists every shot with its frames. `node scripts/frame.mjs <film> <shot>
  "x,y,z"` says where a point of the set lands in the frame, without rendering.

## 6. Look at stills before paying for a render

`REVIEW=<Film>Review REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 <frame,frame,…> 540`
renders the frames you name (four took 23 seconds in the two-core sandbox). Tile them
(`python scripts/sheet.py out/r1 out/r1.jpg --cols 5 --width 300`) and read sheets, not single frames.

1. The cast sheet: everyone side by side, before any set is finished
   (`REMOTION_BROWSER=… node scripts/stills.mjs <Film>CastSheet out/cast --frames=0 --width=720`).
2. The middle frame of every shot. Fix, render the same frames, look again.
3. The first frames after every cut, and the frame on which each graphic has landed.
4. **The two frames either side of every change of shot on the same set.** A hop shows only there. Do this before
   the render is started, not while it runs: the sixth film lost a queued run to it.
5. The last second: the closing question, both answers, nothing under the captions.

Expect five to eight rounds and 170 to 350 stills. A full render costs a commit and eleven minutes each time; a
round of stills costs neither, and you choose the frames.

## 7. Sound

Copy the newest `build_mix.py`. Keep its mixing half (ducking, the pocket for consonants, the ceilings, the limiter,
the report). Write new: the tune, its instruments, and every cue.

- **A score of its own.** Used so far: A minor at 112 bpm, D minor at 104, G major with E minor at 118, C minor swung
  at 130, a waltz in F sharp minor at 174, six-eight in G minor with B flat major at 72, five in a bar in B minor
  at 100. Take another key and another tempo, and let the music take part: a second tune for a place or a party,
  drums that drop out, a stop before the question, no tune under a quotation (one thin chord: with nothing at all
  there, the check reports silence).
- **Levels.** The mix is built to −14.5 LUFS under a ceiling of −2.8 dB (`TARGET_LUFS`, `CEIL_DB`), so that the
  encoded film stays under −1 dBTP. Built to −2.3, the sixth film came out at exactly −1.0: the encode can go a
  decibel over the mix where several noisy cues start together. The music **5 to 6 LU under the voice while someone speaks**, measured after
  ducking. The user rejected 9 to 11 LU as inaudible.
- **Every word clear.** `python templates/scripts/word_margins.py shoots/<slug>/audio/build_mix.py` measures the
  voice against music and effects over each word's own span. The last three films read: median 5.6, 5.8 and 5.7 LU, tenth
  percentile 1.5, 2.4 and 2.4, lowest −3.4, −3.4 and −1.9, with 7, 7 and 3 words under 0. A word far below that is covered:
  move the accent off it, or lift the word and dip the bed under it (`WEAK_WORDS`). Do this before the first render.
- **Effects follow the picture**, and each has a reason in `cues.md`. A soft swish on a cut, none on a join and none
  on a cut in to a quotation. A jump in the picture that is meant (a stamp, a drop, a shrug) needs a sound whose name
  is in `GRAPHIC_SOUNDS`, or the check reports the jump.
- **Two traps in the script.** Round frames the way the picture does (`jsround`: JavaScript sends a half up, Python
  to the even number). Do not give an instrument the name of a mixer function.
- The build is deterministic. Run it twice and compare the files.

Nobody listens to the mix before the user does. Say so when you deliver.

## 8. Render

```sh
git push origin <branch>
gh workflow run render-short.yml --ref <branch> -f composition=<Film>Short \
  -f mix=shoots/<slug>/audio/mix.wav -f shots=shoots/<slug>/qa-shots.json \
  -f publish='shoots/<slug>/final-{size}p.mp4' -f size=720 -f chunks=20
gh run list --workflow render-short.yml --branch <branch> --limit 1 --json databaseId --jq '.[0].databaseId'
gh run view <run id> --json status,conclusion   # poll it (`gh run watch` can outlive the sandbox's command limit);
                                                # eleven to thirteen minutes with the wait for runners
git fetch origin <branch> && git merge --ff-only FETCH_HEAD   # the run commits the MP4 and qa-report.md
```

- Only the sound changed? Add `-f parts_from=<run id of the last full render>`: three minutes, and the same picture
  byte for byte. Parts are kept three days.
- Job logs cannot be read from the sandbox. The check's lines and any warning are in the annotations:
  `gh api repos/<owner>/<repo>/actions/runs/<run id>/jobs --jq '.jobs[].id'`, then
  `gh api repos/<owner>/<repo>/check-runs/<job id>/annotations`.
- The workflow pads the sound to the picture, compares every encode of the sound with its WAV
  (`templates/scripts/aac_check.py`: the encoder once wrote a click that no meter on the mix could show), counts the
  frames again and refuses a peak above −1 dBFS.

## 9. Check the finished file

- `qa-report.md`: the right frame count, about −14.6 LUFS, a peak under −1 dBFS, no silence, no black, white or
  frozen frames, no unplanned jumps. Whatever it flags is fixed and rendered again, not explained away.
- Frames of the file itself (`ffmpeg -v error -i final-720p.mp4 -vf "select='not(mod(n\,24))',scale=270:-1"
  -fps_mode passthrough -frame_pts 1 -q:v 3 out/f%04d.jpeg`, then `sheet.py`): one in every 24, every place that
  changed since the last render, the pairs either side of every join, the last second. Every shot must have been
  seen on a still of the final picture.
- Against the render before it: only what you changed may differ. Two renders of the same code are not identical bit
  for bit, so compare with a threshold. When a run reused the picture, compare the video streams' checksums
  (`ffmpeg -i f.mp4 -map 0:v -c copy -f md5 -`).

## 10. The news again, then deliver

Search the story again on the day, note the time, and change the film if the story moved. Then one message:

1. what the film is, and the answer to the user's question if they asked one;
2. the link to the file pinned to its commit (`…/blob/<commit>/shoots/<slug>/final-720p.mp4`), and `present_file`;
3. the narration;
4. what could not be confirmed and how the film handles it;
5. what you checked and what you did not. You measured the sound and looked at stills. **Never say you listened or
   watched.**

## 11. Record it, and keep it when the user says so

- `shoots/<slug>/SCRIPT.md`: status, facts, unconfirmed, rules, narration, characters, beat map, cuts, voice, sound,
  render (every run and why), result (file, checksum, check, what was seen, what was not, known small things, the
  story on the day).
- A short section in `VIDEO_HANDOFF.md`: request, film, file, checks, accuracy decisions, lessons.
- When the user approves the film and asks for it to be kept: add `register.tsx` if the film has none, write
  `references/news/<slug>/README.md`, run `python references/news/make_reference.py …` (its docstring has the
  arguments), add the folder to the two loops in `.github/workflows/ci.yml` and to the table in `README.md`, remove
  the film's live folders, run `python references/news/verify.py`, and open a pull request to `main`.
