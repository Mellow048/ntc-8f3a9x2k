# The Hack That Melted 700 Supermarkets — news reference 3 of 8

A 74-second news short about the cyberattack that heated the freezers of about 700 French supermarkets overnight on
11–12 October 2026, and France's statement of 9 November that a hacking unit of Iran's Revolutionary Guard did it,
which Iran denies. The user chose the topic from six that were offered ("lets do fridge hack yes"), was asked nothing
more, and approved the first file delivered: **"awesome sauce, same banger"**. On 2026-11-12 the user asked for its
source to be kept on `main`.

It is a snapshot of a developing story as it stood on **2026-11-11**. Reuse how it was made, never its facts, script,
sets or score. The category rules and the order of work are in [`../README.md`](../README.md); every number, command
and trap is in [`../PLAYBOOK.md`](../PLAYBOOK.md).

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2226 frames, 74.200 s, 44,682,883 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `f3ed32f18edb0711cd3ddecf484075844c89529b70bbeac97692f2759ee4de6d` |
| Narration | 235 words in 15 lines; one take of the user's voice, 72.8 s after `build_voice.py` |
| Picture | 43 entries in the shot list on 15 sets: 39 cuts (one of them a match cut), two takes that run over several entries, three close shots |
| Graphics | word-timed captions of one or two words; stamps, source lines, name tags, calendar leaves, a counter, three quote cards |
| Sound | two tunes written for it (shop music in G major, a break-in tune in E minor at 118 bpm), 147 cues; music 5.6 LU under the voice; −14.6 LUFS, peak −2.1 dBFS |
| Facts | 20 sourced rows, a list of what could not be confirmed, searched again on the day of delivery |
| Renders | three on GitHub Actions (`42969978839`, `42976665346`, `42982240824`); the third is the file |
| Shot sheets | [`shots-01-22.jpg`](shots-01-22.jpg), [`shots-23-43.jpg`](shots-23-43.jpg): the middle frame of every shot |

## What this film added to the method

- **A change of shot that is not a cut.** Two shots of the same thing from almost the same place make the picture hop.
  The first two renders did it at seven cuts, and stills from the middle of shots showed none of it. Three cures, in
  `story.ts` and `World.ts`: one take (`join: true` lets the first shot's camera move run on while the staging
  changes), a match cut (the same `join`, when the place stays and the thing on it changes), and a clearly different
  size (a close shot). `soft: true` starts a move gently when it goes on from a camera at rest.
- **Look at the frames either side of every change of shot on the same set**, not only at the middle of shots. The
  joins are then measured in the finished file (the mean change from one frame to the next, against what an ordinary
  cut measures): `SCRIPT.md`, "Result".
- **Each government speaks for itself.** An anonymous spokesperson at a lectern for each side, a landmark behind them
  to say where the lectern stands, and a card with the ministry's own English words. Nobody accused is named or drawn;
  the attackers are hoods with no faces, the same whoever they are.
- **A later event is blamed on nobody.** The attacks of November get a line of their own ("no proven link") instead
  of riding on the accusation about October.
- **Music that takes part.** A second tune for the place itself, a tape that slows down when the heat goes up, drums
  that drop out when the alarm is muted, silence for "How exactly?", the tune unplugged with the plug.
- **Two rounding traps.** JavaScript's `Math.round` and Python's `round()` disagree on halves, so the shot list handed
  to the check must round the way the picture does (`jsround` in `build_mix.py`). A ceiling on the music measured in
  the speech band alone does not see a timpani roll: there are two ceilings.
- **Stop tuning the mix when it measures like an approved one** with the same script (now
  `templates/scripts/word_margins.py`).

## Read in this order

1. [`source/shoots/fridge-hack/SCRIPT.md`](source/shoots/fridge-hack/SCRIPT.md): facts and sources, what could not be
   confirmed, this film's rules, narration, characters, beat map, cuts, voice, sound, render, result.
2. [`source/remotion-app/src/videos/fridge/story.ts`](source/remotion-app/src/videos/fridge/story.ts): the shot list,
   keyed to words of the narration, with `join` and `soft` explained where they are declared.
3. `Overlays.tsx` and `Captions.tsx` in the same folder: every word on screen and the word it arrives on.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`: people told apart by costume, places by shape.
5. [`source/shoots/fridge-hack/audio/build_mix.py`](source/shoots/fridge-hack/audio/build_mix.py) and `cues.md`: the
   score, every effect and why it is there, the mixing chain and its measured levels.
6. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py fridge-hack          # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/fridge-hack/audio/build_mix.py           # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
cd remotion-app && REVIEW=FridgeReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,900,1700 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4. To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=FridgeHackShort \
  -f mix=shoots/fridge-hack/audio/mix.wav -f shots=shoots/fridge-hack/qa-shots.json \
  -f publish='shoots/fridge-hack/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2226 frames, about ten minutes, and a clean `qa-report.md`. Two renders of the same code are not identical bit
for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, peak, silence, black, white and frozen
frames, unplanned jumps) and frame by frame against the render before it. The picture was reviewed on still frames
only: about 345 local stills, then stills of all three renders, so that every shot of the final film was seen on a
render in which it is the same picture. The sound was set from meters. The agent that made the film did not listen to
it and did not watch it in motion; the approval is the user's, after watching it. Known small things are listed at the
end of the script's "Result".
