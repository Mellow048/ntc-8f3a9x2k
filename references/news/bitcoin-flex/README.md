# One Month of Being Rich — news reference 8 of 8 (start here for a new film)

A 74-second news short about Malone Lam, a 20-year-old from Singapore who led a crew that talked a man in Washington
out of more than 4,100 bitcoin on 18 August 2024. He spent a month on rented mansions, jets, nightclubs and some
thirty cars while it was posted online, and the FBI arrested him in Miami on 18 September 2024. He pleaded guilty to
racketeering conspiracy on 8 September 2026 and has not been sentenced.

The user did not name the story. The request was the memory of a TikTok: "a kid who wants to be filthy rich fooled a
person and took his bitcoins, but insted of hiding and dissapearing from the internet, he bought alot of cars, flexed
it to the internet and stuff and eventually he got tracked down and arrested ... if u can find that story please adapt
it". The agent found the case, made the film without a question, and said at delivery where the real story differs
from the memory. Asked to change it or approve it, the user answered: **"yes go ahead lad"**.

It is a snapshot of a developing story as it stood on **2026-11-13**: no sentence, no date for one, a status hearing
set for 8 December 2026. The film shows that date and is out of date after it. Reuse how it was made, never its
facts, script, sets or score. The category rules and the order of work are in [`../README.md`](../README.md); every
number, command and trap is in [`../PLAYBOOK.md`](../PLAYBOOK.md).

**This is the newest snapshot, and the one to start a new film from.** It was made by following the playbook,
starting from the seventh film's folders. It was also built twice and rendered three times, and none of that was
necessary: read "What went wrong" below before you start.

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2231 frames, 74.367 s, 42,450,851 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `651d88988e053d226ddbed57ce8259c876e735bf3d60ada0647cacbd12c30195` |
| Narration | 233 words in 13 lines; one take of the user's voice, 73.0 s after `build_voice.py` (3.19 words a second) |
| Picture | 45 entries in the shot list on 18 sets: 41 cuts, three changes of shot that are not cuts, nine close shots |
| Graphics | word-timed captions of one or two words; a tab AS PROSECUTORS TELL IT and later AS ZACHXBT TOLD WIRED, each for as long as that account runs; stamps, source lines, a name tag that says he is not a likeness, two counters, a receipt, a balance that runs down, quote cards, two answers |
| Sound | F minor at 140 bpm felt at half speed: sub-bass, kick, a clap on three, rolling hats and a four-note tune on bells that comes back on a tuba and on a music box; 201 cues; music 5.7 LU under the voice; −14.6 LUFS, true peak −1.7 dBFS |
| Facts | 19 sourced rows, ten things that could not be confirmed, searched again before delivery |
| Renders | three full ones; run `43347793839` is the file |
| Shot sheets | [`shots-01-23.jpg`](shots-01-23.jpg), [`shots-24-45.jpg`](shots-24-45.jpg): the middle frame of every shot |

## What this film added to the method

- **A story found from a description.** The request named nobody. The case was found by searching, checked against
  three Justice Department releases and five outlets, and the delivery said in three lines where it differs from
  what the user remembered: it lasted one month, not years; he is not sentenced; he was not alone. The biggest
  difference is the film's title.
- **A named defendant who is nobody's likeness.** He has pleaded guilty and every source names him, so the film does.
  He is the house's stock figure in an invented costume, and his name tag says A STOCK CARTOON FIGURE, NOT A
  LIKENESS. The man who was robbed is a dashed outline; the crew and the investigator are blank heads.
- **Two accounts, each under its own tab.** The call is the prosecutors' account; the shared screen and the
  recording are the investigator's, by way of one magazine. Each has its tab for as long as it runs.
- **What the film does not say.** No source says what led the FBI to him, so the film shows the investigator's
  work and does not call it the reason for the arrest.
- **Numbers on which the sources differ.** The narration uses the phrase every count supports ("more than two
  hundred thirty million dollars", "some thirty" cars); the screen carries one figure with its source.
- **A date that will expire stands on screen with its date:** NEXT HEARING DEC. 8, 2026.
- **A report's word and the staging are kept apart.** The report says he "dropped" his phone off the dock. The
  narration keeps the word; the picture shows a toss, so that the water is in the frame; the script records that as
  staging.
- **Words on screen claim only what a passage copied into `NOTES.md` supports.** Quotation marks go round words that
  are in the notes letter for letter, with the outlet beside them; a line without them is the film's summary of the
  source it names. The beat map in the script lists every line on screen.
- **`scripts/project.py`** says where a point of a set lands in the frame at the start and at the end of a push,
  before any still is rendered.
- **Things for a story with cars, screens and counters** are in the playbook's section 5: a car built from
  cross-sections, a group that must fit at the end of the push, water that lies under the caption, a counter with
  twenty values, a traveller on the head of its route, a screen's text clear of the tab.

## What went wrong, and what it cost

- **The film was built twice.** The first build was made on a branch whose pull request had already been merged. A
  merged branch accepts no pushes, and the session then continues on a fresh checkout of `main`: the voice take, the
  sets and the mix were gone and were made again. Push after every step, never start a film on a merged branch, and
  merge the session's pull request last (playbook, sections 0 and 11).
- **Two of the three renders were not needed.** The first was started one minute after the fifth round of stills.
  Six faults were on the sheets of rounds 3 to 5 (the first and last frame of every shot, then the fixes) and had
  been passed: two agents half outside the frame for a whole shot; a dock shot that repeated the shot before it and
  put its splash under the caption; a plane that ended on top of its tag; a car cropped at both ends; a tab across
  a heading; toy cars cut by the edge. They were recognised a quarter of an hour later on one frame in every 24 of
  the render, read tile by tile. The second render had two agents who crossed into the frame in four frames, which
  the check reported, and a prop cut by the edge at the end of a push. Before a render, make the playbook's last
  pass (section 6, step 7): every tile, the same questions. And look at every entrance frame by frame.
- **Three places of the final file were looked at only after the user had approved it:** the frames either side of
  the three joins, and a shot whose props had moved for the last render. They added one line to the known small
  things and changed nothing in the file. Look before you deliver.

## Read in this order

1. [`source/shoots/bitcoin-flex/SCRIPT.md`](source/shoots/bitcoin-flex/SCRIPT.md): sources and facts, what could not
   be confirmed, this film's rules, narration, characters, beat map, voice, sound, render, result. `NOTES.md` beside
   it holds the passages copied from the sources while they could be read.
2. [`source/remotion-app/src/videos/btcflex/story.ts`](source/remotion-app/src/videos/btcflex/story.ts): the shot
   list, keyed to words of the narration.
3. [`Overlays.tsx`](source/remotion-app/src/videos/btcflex/Overlays.tsx): every word on screen and its cue.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`.
5. [`source/shoots/bitcoin-flex/audio/build_mix.py`](source/shoots/bitcoin-flex/audio/build_mix.py) and `cues.md`.
6. `source/.github/workflows/render-short.yml` and the scripts in `source/remotion-app/scripts/`.
7. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py bitcoin-flex         # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/bitcoin-flex/audio/build_mix.py          # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
python templates/scripts/word_margins.py shoots/bitcoin-flex/audio/build_mix.py
cd remotion-app && REVIEW=BtcFlexReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,1000,2100 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4; `restore.py bitcoin-flex
--mix` rebuilds it and says whether it is that file. Two files of the snapshot's machinery are newer than the render
(the manifest lists them): `build_mix.py`, where only the title it writes on the cue sheet changed, and
`templates/scripts/short_qa.py`, which now works in blocks and needs 1.2 GB instead of more than 4. Both were run
again on this film: the mix is the same file byte for byte, and the report is the same character for character.

To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=BtcFlexShort \
  -f mix=shoots/bitcoin-flex/audio/mix.wav -f shots=shoots/bitcoin-flex/qa-shots.json \
  -f publish='shoots/bitcoin-flex/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2231 frames, about ten minutes, and a clean `qa-report.md`. Two renders of the same code are not identical
bit for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, true peak, silence, black, white and frozen
frames, unplanned jumps, the encode against its WAV). The picture was reviewed on still frames only: 264 local
stills, one frame in every 24 of the first render (every shot), and, after frame-by-frame comparisons showed that
each later render differs from the one before only where it was changed, those places on frames of the second render
and of the final file. The sound was set from meters, and the facts were searched again on the day of delivery. The
indictments, the plea agreement and the court filings themselves were not read. The agent that made the film did not
listen to it and did not watch it in motion. Known small things are listed at the end of the script's "Result".
