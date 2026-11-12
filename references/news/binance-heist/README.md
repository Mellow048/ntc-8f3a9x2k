# The $6.3 Billion Job Interview — news reference 4 of 4 (start here for a new film)

A 75-second news short about the theft of about $6.3 billion in crypto from Binance on 29 October 2026, which
Binance's own report traces to a rigged developer tool and two fake job interviews; the FBI says North Korea did it,
North Korea denies it, and nobody has been charged. The user chose the topic from six that were offered ("i pick 1")
and was asked nothing more. The user's reply to the delivered file: **"you are the best at this!"**, with the request
to keep its source on `main`.

It is a snapshot of a developing story as it stood on **2026-11-12**. Reuse how it was made, never its facts, script,
sets or score. The category rules and the order of work are in [`../README.md`](../README.md); every number, command
and trap is in [`../PLAYBOOK.md`](../PLAYBOOK.md).

**This is the newest snapshot, and the one to start a new film from**: it has every fix of the three before it, and
its film folder carries its own `register.tsx`.

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2259 frames, 75.300 s, 47,287,847 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `5923b5b8f461b97a472fe4e33527bb0f48348e209ac73015504eb70af3b88d41` |
| Narration | 235 words in 15 lines; one take of the user's voice, 73.9 s after `build_voice.py` |
| Picture | 45 entries in the shot list on 15 sets: 39 cuts, five changes of shot that are not cuts, three close shots |
| Graphics | 133 word-timed captions; a source tab that stays up for a whole account; stamps, source lines that quote the report, name tags, calendar leaves, a counter, call frames, three quote cards, two answers |
| Sound | a swung caper in C minor at 130 bpm and hold music for the fake company, 143 cues; music 5.7 LU under the voice; −14.6 LUFS, peak −2.1 dBFS |
| Facts | 19 sourced rows, 14 things that could not be confirmed, searched again twice before delivery |
| Renders | three full ones and two that changed the sound only; run `43131233446` is the file (picture of run `43023243761`) |
| Shot sheets | [`shots-01-23.jpg`](shots-01-23.jpg), [`shots-24-45.jpg`](shots-24-45.jpg): the middle frame of every shot |

## What this film added to the method

- **One side's own account, labelled for as long as it runs.** How the thieves got in is known only from the
  company's report on its own breach. The narration says "Binance says" once, a tab ACCORDING TO BINANCE stays on
  screen through all of it, and the source lines quote the report's own words. The one detail from elsewhere takes the
  tab off and says REPORTEDLY with its source (`Tab` and the `during(n)` cues in `Overlays.tsx`).
- **Who did it, as three statements.** The FBI, the accused state and the president each get a shot with their exact
  words, the speaker and the date. The reply is read by an anonymous newsreader of the state news agency; the author
  of the statement is named on the card and not drawn.
- **A date on what can change**: NO ARRESTS EITHER · AS OF NOV 11, the frozen sum with its report and date.
- **Fake, without claiming how.** Paper masks for the recruiters, an office painted on a board, a chat window for
  the interview the report only calls a chat. No tool, site, app or company is named and every screen is made up.
- **A closing question that judges nobody.** Two real positions, neither figure reacts, and the company's line that
  it blames no individual stays on screen above both answers.
- **Numbers drawn to scale**: two piles 1.5 and 6.34 units high from one floor; nine of twenty piles under ice.
- **The sound is checked after it is encoded.** The runner's AAC encoder once wrote a click that is not in the WAV;
  `templates/scripts/aac_check.py` now compares every encode with its WAV inside the workflow.
- **The voice is measured against the bed word by word** (`templates/scripts/word_margins.py`). One word that the
  read let trail off sat 7.9 LU under a bass beat through three renders that passed every other meter. `WEAK_WORDS`
  in `build_mix.py` lifts such a word and clears the bed under it.
- **A film registers itself.** `src/videos/binance/register.tsx` declares the film, its still-picker and its cast
  sheet; `src/Root.tsx` only renders that component.

## Read in this order

1. [`source/shoots/binance-heist/SCRIPT.md`](source/shoots/binance-heist/SCRIPT.md): facts and sources, what could
   not be confirmed, this film's rules, narration, characters, beat map, cuts, voice, sound, render, result.
2. [`source/remotion-app/src/videos/binance/story.ts`](source/remotion-app/src/videos/binance/story.ts): the shot
   list, keyed to words of the narration.
3. [`Overlays.tsx`](source/remotion-app/src/videos/binance/Overlays.tsx): every word on screen and its cue.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`.
5. [`source/shoots/binance-heist/audio/build_mix.py`](source/shoots/binance-heist/audio/build_mix.py) and `cues.md`.
6. `source/.github/workflows/render-short.yml` and the scripts in `source/remotion-app/scripts/`.
7. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py binance-heist        # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/binance-heist/audio/build_mix.py         # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
python templates/scripts/word_margins.py shoots/binance-heist/audio/build_mix.py
cd remotion-app && REVIEW=BinanceReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,1000,2200 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4. To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=BinanceHeistShort \
  -f mix=shoots/binance-heist/audio/mix.wav -f shots=shoots/binance-heist/qa-shots.json \
  -f publish='shoots/binance-heist/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2259 frames, about eleven minutes, and a clean `qa-report.md`. Two renders of the same code are not identical
bit for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, peak, silence, black, white and frozen
frames, unplanned jumps, the encode against its WAV). The picture was reviewed on still frames only: about 225 local
stills, then stills of the three full renders, so that every shot of the final film was seen on a still of the final
picture, with the frames either side of every change of shot on the same set. The sound was set from meters, and the
facts were searched again on the day of delivery. The agent that made the film did not listen to it and did not watch
it in motion. Known small things are listed at the end of the script's "Result".
