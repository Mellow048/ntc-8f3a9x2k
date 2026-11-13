# News short playbook

The order of work in [`README.md`](README.md) as a checklist, with the numbers, commands and traps that eight approved
films produced. The README says what a news short is and which rules it obeys. This page says how to get one made in
a single pass. Each film's own `SCRIPT.md` is the worked example for every step here.

The fourth film went from its first commit to the render whose picture the user approved in under three hours. The
fifth, made from `main` by following this page, took an hour and forty minutes and two renders. The sixth and
seventh were made one after the other in four hours, with one and two renders. The eighth was built twice (section
0); its second build went from its first commit to the final file in an hour and forty minutes, with three renders,
two of which stills would have saved (section 6).
Nothing below needs the user, except the choice of topic and, once in a session, the choice of voice.

## 0. Before anything: the working place

- **One branch, pushed after every step.** The sandbox can be reset between two commands. It then comes back older
  than your branch: another `HEAD`, a stale tree, and `/tmp`, the caches and `node_modules` gone. GitHub is the
  record. After a reset: `git fetch origin <branch>`, check that nothing local is newer, then
  `git reset --hard FETCH_HEAD && git clean -fd`. Keep drafts in the repository, never in `/tmp`.
- **A merged branch is a dead branch.** When the session's pull request is merged or closed, the branch stops
  accepting pushes within minutes, and "Continue" then gives the session a new branch on a **fresh checkout of
  `main`**: whatever was only in the old workspace is gone, commits included. The eighth film was built once on a
  branch whose pull request had just been merged, could not be pushed, and had to be built a second time. So: push
  after every step, never start a film on a branch whose pull request is already merged, and merge the session's
  pull request last (section 11).
- **Tools.** The sandbox reaches GitHub, the npm registry and PyPI, and nothing else.

  ```sh
  python3 -m venv ~/.cache/ntc-venv && ~/.cache/ntc-venv/bin/pip install numpy scipy pillow imageio-ffmpeg pocketsphinx
  mkdir -p ~/.cache/bin && ln -sf "$(~/.cache/ntc-venv/bin/python -c 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())')" ~/.cache/bin/ffmpeg
  export PATH="$HOME/.cache/bin:$PATH"                     # in every command that needs ffmpeg
  (cd remotion-app && npm ci --no-audit --no-fund)         # seconds when the npm cache is warm
  remotion-app/scripts/local-chromium.sh                   # a browser for local stills, from the npm registry
  ```

- **Start from the newest film.** `~/.cache/ntc-venv/bin/python references/news/restore.py bitcoin-flex --mix`
  copies its two folders into your checkout, registers it, rebuilds its mix and says whether that mix is the approved
  one, byte for byte. Render one still to prove the place works:
  `cd remotion-app && REVIEW=BtcFlexReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/t 1000 540`.
  Then copy `remotion-app/src/videos/btcflex/` and `shoots/bitcoin-flex/` under your film's names, rename the four
  ids in the copy's `register.tsx` (`<Film>Short`, `<Film>Review`, `<Film>CastSheet`, `<Film>Compositions`), point
  `PICTURE_WORDS` in `build_voice.py` and `STORY` in `build_mix.py` at the new film folder, change the title that
  `build_mix.py` writes at the top of `cues.md` (the eighth film's cue sheet carried the seventh's until after the
  delivery), add the film's two lines to `src/Root.tsx` beside the anchors, and delete the restored folders again. Your film is written
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
- When the user describes a story from memory instead of naming it (the eighth film: "a tiktok somewhere where a kid
  ... took his bitcoins"), search for the case, then check every detail of the description against the sources like
  any other claim. The film tells the story the sources tell, and the delivery says where it differs from the
  memory (there: one month, not years; not sentenced; not alone).
- Copy the passages you will rely on into `shoots/<slug>/NOTES.md`, word for word with their source, and push it at
  once. It was the only file of the eighth film's first build that survived the loss of its branch.

## 3. Narration: 235 words in 15 lines

That length reads in 73 to 75 seconds at the pace the films use: the third and fourth films are 235 words each and run 74.2
and 75.3 seconds. It does not hold for every text: spoken numbers and names run long. The fifth film's first draft,
242 words, read in 79.5 seconds and was cut to 228 (74.6 s), which cost a second take. The pace also varies from
take to take: the sixth film's 227 words came to 72.4 seconds, the seventh's 228 to 69.4 and the eighth's 233 to
73.0. Count on 3.05 to 3.3 words a second, read the numbers out as words when you count, and cut the text, not the
pauses.

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
| Shots | 40 to 46 on 15 to 18 sets; a new, staged picture every 1.5 to 2 seconds; the shortest in the last three films is 24 frames |
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
- **From the eighth film** (a story with cars, screens and counters):
  - A car made from an extruded side outline reads as a box. Build it from cross-sections along its length
    (`supercar` in that film's `sets.ts`), give it thin lit blades for lamps and wheels smaller than its fenders,
    and show a row of cars from above, one behind another. A car on a turntable must fit the frame at its widest
    angle, nose to wing: a car that is cropped at both ends for the whole shot is a blue wall.
  - A cone of light between the camera and a face whitens the face: keep such cones at about 0.03 opacity.
  - A prop held at hand height covers the holder's face in a close shot: hold it up beside the head, and draw it as
    big as a head if it has to be read. A microphone on a stand belongs at chest height.
  - A tag that belongs to the set and sits in the top third collides with the source lines, and so does a set's own
    header (a game lobby's title bar): place both under the lines, and check the last frame of the shot, when the
    camera has pushed in.
  - Whatever a set keeps for another staging (a till, a dock, a parasol) is in the first frames of every shot on
    that set unless it is hidden for that staging: look at the first and the last frame of every shot.
  - An action timed from `shot.at` can happen before its word, and one timed from its word can have no time left
    before the cut (a phone thrown on "dropped" needs its splash inside the shot). Count the frames to the cut, and
    work out where the thing lands in the frame before you render it.
  - A counter with four values jumps: give it twenty or more. A `Count` label is fitted to its length like every
    other line.
  - A group has to fit the frame at the END of the push, not at its start: two agents who walked in beside a man
    stood half outside the frame for the whole shot until the camera was pulled back (`scripts/project.py`).
  - A figure that walks in from far outside the frame crosses its edge in a few frames, and the check reports the
    jump (two agents who started well outside were in the picture within four frames). Start it just outside the
    edge, give the walk about eighteen frames, and look at the entrance frame by frame.
  - A prop that stands near the edge at the start of a push is cut by the edge at its end: the last frame of every
    shot shows it, the middle does not. A set dressed for one shot is also seen in the next shot on that set, from
    another place: look at both.
  - In a portrait frame the water round a man on a dock lies at the bottom, under the caption. For something that
    happens in the water, turn round and shoot toward it, so that the water is the background behind him. The same
    turn cured a hop: before it, the arrest and the dock showed the same figure at the same size against the same
    house.
  - A thing that travels along a drawn route rides the head of that route (the plane and its dots on the globe);
    a plane that flies one way while its dots appear another way reads as two things.
  - The tab on the left edge lies across fixed rows of a screen that the camera pushes into, and across more rows at
    the end than at the start. Work those rows out and keep the screen's own text out of them.
  - A cursor or a hand left resting on a screen covers the line the viewer should read: move it off after its moment.
  - **Words on screen claim only what a passage copied into `NOTES.md` supports.** Quotation marks go round words
    that are in the notes letter for letter, and the name beside them is the outlet the passage is from. Compare every
    line of `Overlays.tsx` with the notes before the render.
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
3. The first frames after every cut, the frame on which each graphic has landed, and **the last frame of every
   shot**: the push has ended there, and what stood near an edge is cut by it.
4. **The two frames either side of every change of shot on the same set.** A hop shows only there. Do this before
   the render is started, not while it runs: the sixth film lost a queued run to it.
5. The last second: the closing question, both answers, nothing under the captions.
6. **One frame in every 24 of the whole film**, in order, as the last round before the render
   (`scripts/pick.sh out/all "$(seq -s, 0 24 <last frame>)" 400` through the process tool: 93 stills, about six
   minutes). The eighth film made this pass on its first render instead and found six faults that the middles of
   its shots had not shown; every one of them was visible on a local still. Every entrance and every exit is looked
   at frame by frame as well.

`PYTHON=~/.cache/ntc-venv/bin/python scripts/sheets.sh out/r1 r1 12 6 250` tiles a folder of stills into sheets of
twelve. Give every round a new name. Before a still is rendered, `python scripts/project.py "<cam>" "<target>" 42
<push> -- "x,y,z:name" ...` says where a point of the set lands in the frame at the start and the end of a shot: it
found the camera for the eighth film's dock (a splash that must be above the caption) and for its arrest (three
figures that must fit) in two tries instead of five rounds of stills.

Expect five to eight rounds and 170 to 350 stills. A full render costs a commit and ten minutes each time; a
round of stills costs neither, and you choose the frames. The eighth film was rendered three times: once to find
what the six steps above would have found, and once more for an entrance and a prop at the end of a push.

## 7. Sound

Copy the newest `build_mix.py`. Keep its mixing half (ducking, the pocket for consonants, the ceilings, the limiter,
the report). Write new: the tune, its instruments, and every cue.

- **A score of its own.** Used so far: A minor at 112 bpm, D minor at 104, G major with E minor at 118, C minor swung
  at 130, a waltz in F sharp minor at 174, six-eight in G minor with B flat major at 72, five in a bar in B minor
  at 100, F minor at 140 felt at half speed. Take another key and another tempo, and let the music take part: a second tune for a place or a party,
  drums that drop out, a stop before the question, no tune under a quotation (one thin chord: with nothing at all
  there, the check reports silence).
- **Levels.** The mix is built to −14.5 LUFS under a ceiling of −2.8 dB (`TARGET_LUFS`, `CEIL_DB`), so that the
  encoded film stays under −1 dBTP. Built to −2.3, the sixth film came out at exactly −1.0: the encode can go a
  decibel over the mix where several noisy cues start together (the eighth: 0.95 dB over, −1.7 dBFS from −2.7). The music **5 to 6 LU under the voice while someone speaks**, measured after
  ducking. The user rejected 9 to 11 LU as inaudible.
- **Every word clear.** `python templates/scripts/word_margins.py shoots/<slug>/audio/build_mix.py` measures the
  voice against music and effects over each word's own span. The last four films read: median 5.6, 5.8, 5.7 and
  5.4 LU, tenth percentile 1.5, 2.4, 2.4 and 1.9, lowest −3.4, −3.4, −1.9 and −1.2, with 7, 7, 3 and 5 words under 0. A word far below that is covered:
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
                                                # nine to thirteen minutes with the wait for runners
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

### When the branch cannot be pushed: render in the sandbox

`remotion-app/scripts/render-local.sh` does the workflow's steps on the sandbox itself: the same `remotion render`
command for each part, the same stitch, the same sound encode with its check, the same film check and gates. It is
slow: 1.6 to 4.5 seconds a frame on two cores, one to nearly three hours for a film against ten minutes on GitHub.
**Every step has run, the render loop on one part only** (13 November 2026, the eighth film in 74 parts: 73 cut from
its Actions render, one rendered by the script and the same picture as the Actions file; then stitch, sound, film
check and gates, all clean). A whole film has never been rendered with it; its header says exactly how far it was
used. What it makes is in the workspace only. If the branch is closed, the better answer is to ask the user to press
Continue first, and to know that the new branch starts from `main` (section 0).

## 9. Check the finished file

- `qa-report.md`: the right frame count, about −14.6 LUFS, a peak under −1 dBFS, no silence, no black, white or
  frozen frames, no unplanned jumps. Whatever it flags is fixed and rendered again, not explained away. The same
  check runs in the sandbox in twenty seconds and gives the same report, character for character:
  `python templates/scripts/short_qa.py <final.mp4> <out dir> shoots/<slug>/qa-shots.json` (ffmpeg and ffprobe on the
  PATH; 1.2 GB of memory).
- The encode against its WAV: `python templates/scripts/aac_check.py shoots/<slug>/audio/mix.wav <final.mp4>`, the
  WAV first. With the two swapped it prints the peaks the wrong way round and still exits 0.
- Frames of the file itself (`ffmpeg -v error -i final-720p.mp4 -vf "select='not(mod(n\,24))',scale=270:-1"
  -fps_mode passthrough -frame_pts 1 -q:v 3 out/f%04d.jpeg`, then `sheet.py`): one in every 24, every place that
  changed since the last render, the pairs either side of every join, the last second. Every shot must have been
  seen on a still of the final picture. **All of it before the delivery:** the eighth film's joins, and a shot
  whose props had moved for the last render, were looked at only after the user had approved it.
- A join on whose frame a planned change lands (a stamp that gives way to a counter, a paper face that is swapped)
  measures like a small cut, several times the frames before it, and the check passes it because it is planned.
  The numbers do not say whether the set moved: look at the frames either side.
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
  the film's live folders and its two lines in `src/Root.tsx`, run `python references/news/verify.py`, put the film
  back once with `restore.py <slug> --mix` to see that it type-checks and renders a still (then remove it again), and
  open a pull request to `main`.
- The new film is now the newest. Move that word to it wherever it stands: section 0 here, the table and step 4 of
  `README.md`, the first lines of the older films' guides (`N of M`, "start a new film from"), `restore.py`'s
  docstring, `IMPORTANT.md` section 6, `AGENTS.md`, the repository's `README.md` and `VIDEO_HANDOFF.md` (the list
  in section 9, the table under it, the film's own section). `git grep -n <the old newest slug>` finds them.
- **Merge the session's pull request last.** Merging it closes the branch (section 0). When the user approves two
  films and asks for a third in the same message, make, render and deliver the third first, or tell the user that
  keeping the approved ones comes after it.
