# The $100 Million Truck Stop — news reference 7 of 8

A 71-second news short about what prosecutors call the largest jewelry heist in U.S. history: 24 of 73 bags taken
from a Brink's big rig at a California truck stop in July 2022, in the 27 minutes one driver spent getting a meal
while the other slept. The news was a plea agreement filed on 9 November 2026 for one of seven men charged. The user
chose the topic from six that were offered ("okay lets do number 2 and 1") and was asked nothing more. It was
delivered together with the sixth film; the user's reply to both: **"another banger after banger. great job lad."**

It is a snapshot of a developing story as it stood on **2026-11-12**: the plea had been agreed and not yet entered,
and the hearing was set for 19 November 2026. Reuse how it was made, never its facts, script, sets or score. The
category rules and the order of work are in [`../README.md`](../README.md); every number, command and trap is in
[`../PLAYBOOK.md`](../PLAYBOOK.md). To start a new film, restore the newest snapshot,
[`../bitcoin-flex/`](../bitcoin-flex/README.md).

It was made by following the playbook, starting from the sixth film's folders: two full renders, no question to the
user. The eighth film was started from this one.

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2123 frames, 70.767 s, 41,012,667 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `8d09de5b979ab34e0fb2cdd01f390681fb8d83e3b97d31ffc2c38976383ef87f` |
| Narration | 228 words in 12 lines; one take of the user's voice, 69.4 s after `build_voice.py` (3.28 words a second: the pace varies from take to take) |
| Picture | 46 entries in the shot list on 16 sets: 42 cuts, three changes of shot that are not cuts, five close shots |
| Graphics | word-timed captions of one or two words; a tab AS THE L.A. TIMES REPORTS for as long as that account runs; stamps, source lines, a route map with tags, a counter of minutes, cards for each plea, both values with whose they are, two answers |
| Sound | a caper in B minor, five in a bar (three and two) at 100 bpm: vibraphone, plucked bass, brushes; 218 cues; music 5.7 LU under the voice; −14.6 LUFS, true peak −2.6 dBTP |
| Facts | 22 sourced rows, ten things that could not be confirmed, searched again before delivery |
| Renders | two full ones; run `43196917478` is the file |
| Shot sheets | [`shots-01-23.jpg`](shots-01-23.jpg), [`shots-24-46.jpg`](shots-24-46.jpg): the middle frame of every shot |

## What this film added to the method

- **What a defendant pleads to and what he admits are kept apart.** He agreed to plead guilty to one count, the
  robbery of a different truck, and admits the jewelry heist in the same agreement. The film says both in separate
  sentences, shows NOT ENTERED YET with the date of the hearing, and names the count.
- **Seven accused without faces, told apart by a number.** The man with the deal is named once, on a line beside the
  agreement; "presumed to be innocent" is on screen in the prosecutors' own words.
- **One newspaper's account from unnamed sources** is labelled as that in the narration and on a tab for as long as
  it runs, and the newspaper's page carries its own words about its sources.
- **A disputed number is the ending.** Both values are on screen with whose they are, and the closing question is
  the dispute itself.
- **Court papers that were not read.** The film quotes only the press release's and the newspapers' words, and the
  page it draws says whose summary it is. The delivery says so too.
- **Invented things say that they are invented:** the phone number on the pad and the shipping form.
- **Read every set's `tick` for things that jump before the render**, not only the stills: something that appears
  inside the frame before it moves, something that leaves after a few frames, anything timed from `shot.at` in a
  take that runs over a join. The check flagged none of the five found after the first render.
- **Things for a portrait frame:** a long vehicle stands at an angle and runs into the depth; a road has two lanes;
  a bag is a sack with a neck, a seal and a tag, not a box; a seated figure behind a counter is raised; a map tag
  stands beside a dot with a line between; digits that fly across leave last-first.
- **Build the mix under −2.8 dB** (`CEIL_DB`). The file came out at −2.6 dBTP.

## Read in this order

1. [`source/shoots/truck-stop-heist/SCRIPT.md`](source/shoots/truck-stop-heist/SCRIPT.md): facts and sources, what
   could not be confirmed, this film's rules, narration, characters, beat map, voice, sound, render, result.
   `NOTES.md` beside it holds the passages copied from the sources while they could be read.
2. [`source/remotion-app/src/videos/truckstop/story.ts`](source/remotion-app/src/videos/truckstop/story.ts): the shot
   list, keyed to words of the narration.
3. [`Overlays.tsx`](source/remotion-app/src/videos/truckstop/Overlays.tsx): every word on screen and its cue.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`.
5. [`source/shoots/truck-stop-heist/audio/build_mix.py`](source/shoots/truck-stop-heist/audio/build_mix.py) and
   `cues.md`.
6. `source/.github/workflows/render-short.yml` and the scripts in `source/remotion-app/scripts/`.
7. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py truck-stop-heist     # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/truck-stop-heist/audio/build_mix.py      # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
python templates/scripts/word_margins.py shoots/truck-stop-heist/audio/build_mix.py
cd remotion-app && REVIEW=TruckStopReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,1000,2100 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4. To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=TruckStopShort \
  -f mix=shoots/truck-stop-heist/audio/mix.wav -f shots=shoots/truck-stop-heist/qa-shots.json \
  -f publish='shoots/truck-stop-heist/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2123 frames, about twelve minutes with the wait for runners, and a clean `qa-report.md`. Two renders of the
same code are not identical bit for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, true peak, silence, black, white and frozen
frames, unplanned jumps, the encode against its WAV). The picture was reviewed on still frames only: 219 local
stills, one frame in every 24 of the first render (every shot), and, after a frame-by-frame comparison showed that
the second render differs from the first only where it was changed, those places, the three joins and the last four
seconds on frames of the final file. The sound was set from meters, and the facts were searched again on the day of
delivery. The plea agreement and the indictment themselves were not read. The agent that made the film did not
listen to it and did not watch it in motion. Known small things are listed at the end of the script's "Result".
