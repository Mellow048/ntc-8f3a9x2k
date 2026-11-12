# The $129 Million Fake Boss — news reference 5 of 7

A 76-second news short about an indictment unsealed in Manhattan on 5 November 2026. It accuses three men of using
A.I. to copy the voices, and sometimes the faces, of chief executives and of real lawyers, and of talking employees
of thousands of companies into wiring about $129 million. Everything in the film is one side's account: nothing has
been tested in court. The user chose the topic from three that were offered ("yes go") and was asked nothing more.
The user's reply to the delivered file: **"another fricking banger. nice job! you are so good at this ngl"**.

It is a snapshot of a developing story as it stood on **2026-11-12**. Reuse how it was made, never its facts, script,
sets or score. The category rules and the order of work are in [`../README.md`](../README.md); every number, command
and trap is in [`../PLAYBOOK.md`](../PLAYBOOK.md).

It is the first film that was made from `main` by following the playbook, starting from `restore.py binance-heist`:
two full renders, no question to the user. To start a new film, restore the newest snapshot,
[`../truck-stop-heist/`](../truck-stop-heist/README.md).

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2281 frames, 76.033 s, 46,526,268 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `497bdd1a2a9eeaa92aeac89d1bc6524714148016229960b02aa8392ff1813215` |
| Narration | 228 words in 14 lines; the second take of the user's voice (a 242-word draft ran to 79.5 s and was cut), 74.6 s after `build_voice.py` |
| Picture | 46 entries in the shot list on 19 sets: 38 cuts, seven changes of shot that are not cuts, six close shots |
| Graphics | 127 word-timed captions; a tab that says whose account is running; stamps, source lines that quote the indictment, name tags, name stickers, calendar leaves, a counter, call frames, two quote cards, two answers |
| Sound | a waltz in F sharp minor at 174 bpm with one tune for two players, 162 cues; music 5.6 LU under the voice; −14.6 LUFS, peak −1.9 dBFS |
| Facts | 22 sourced rows, ten things that could not be confirmed, searched again before delivery |
| Renders | two full ones; run `43151658637` is the file |
| Shot sheets | [`shots-01-23.jpg`](shots-01-23.jpg), [`shots-24-46.jpg`](shots-24-46.jpg): the middle frame of every shot |

## What this film added to the method

- **A whole film that is one side's untested account.** The narration attributes line by line ("prosecutors say",
  "the indictment says", "allegedly"). A tab PROSECUTORS' ACCOUNT stays on screen for as long as that account runs,
  every line under a stamp names the indictment, and the film says in words and on a stamp that all three are
  presumed innocent. That no defence comment had been reported is on screen with the agency and the date (`Tab` and
  the `during(n)` cues in `Overlays.tsx`).
- **Defendants without faces.** A blank head with a question mark, three jackets. Their names appear once, in the
  case title on the indictment's page; the aliases are from that title, and a line says which two belong to one man.
  An earlier conviction that the press release mentions is left out.
- **A picture of "A.I." that claims nothing about how it is done:** a face on a glowing plate on a stick, in front of
  a head with no face (`prop: 'plate'` and the poses `wear` and `side` in `cast.ts`). No tool, service, firm or
  company is named, and every screen is made up.
- **An opening that speaks to the viewer** ("Your boss calls you on video"), with the line that says whose account
  it is landing with the stamp six seconds in.
- **An invented document that says so:** the handwritten page shows the title the indictment gives and scribble, and
  the line on screen says which is which.
- **A tab that stays up sets the framing of every shot under it.** It is 47 % of the width at 31 % of the height:
  heads, cards and signs go below 36 % or to the right of it, from the first still.
- **One tune, two players.** A horn has it for the boss and a music box, two octaves up, for the copy of him. The
  music is cut dead twice, on "It isn't him" and when the back office stops the wire, and does not come back after
  the second.
- **A take that runs over two entries of the shot list keeps its source line** until the next one takes its place,
  and a card that is already up does not arrive a second time after a cut (the first render's one fault).
- **A figure that holds something out to the side gets a wider drawing** (`WIDE` in `cast.ts`).

## Read in this order

1. [`source/shoots/fake-boss/SCRIPT.md`](source/shoots/fake-boss/SCRIPT.md): facts and sources, what could not be
   confirmed, this film's rules, narration, characters, beat map, cuts, voice, sound, render, result.
2. [`source/remotion-app/src/videos/fakeboss/story.ts`](source/remotion-app/src/videos/fakeboss/story.ts): the shot
   list, keyed to words of the narration.
3. [`Overlays.tsx`](source/remotion-app/src/videos/fakeboss/Overlays.tsx): every word on screen and its cue.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`.
5. [`source/shoots/fake-boss/audio/build_mix.py`](source/shoots/fake-boss/audio/build_mix.py) and `cues.md`.
6. `source/.github/workflows/render-short.yml` and the scripts in `source/remotion-app/scripts/`.
7. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py fake-boss            # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/fake-boss/audio/build_mix.py             # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
python templates/scripts/word_margins.py shoots/fake-boss/audio/build_mix.py
cd remotion-app && REVIEW=FakeBossReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,1000,2200 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4. To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=FakeBossShort \
  -f mix=shoots/fake-boss/audio/mix.wav -f shots=shoots/fake-boss/qa-shots.json \
  -f publish='shoots/fake-boss/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2281 frames, about nine minutes, and a clean `qa-report.md`. Two renders of the same code are not identical
bit for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, peak, silence, black, white and frozen
frames, unplanned jumps, the encode against its WAV). The picture was reviewed on still frames only: 169 local stills
in seven rounds, one frame in every 24 of the first render (every shot), and, after a frame-by-frame comparison showed
that the second render differs from the first only where it was changed, those places on frames of the final file.
The sound was set from meters, and the facts were searched again on the day of delivery. The agent that made the film
did not listen to it and did not watch it in motion. Known small things are listed at the end of the script's
"Result".
