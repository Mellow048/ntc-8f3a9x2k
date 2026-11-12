# The Hackers Who Said Sorry — news reference 6 of 7

A 74-second news short about a cyberattack on the University of New Mexico's health system on 26 October 2026, which
made the state's only top-level trauma centre send ambulances elsewhere for two hours, and about the group that
claimed it: the next day it apologised, offered the hospital a free key and patients up to $2,500 "for the
inconvenience", and said it would keep the data. The user chose the topic from six that were offered ("okay lets do
number 2 and 1") and was asked nothing more. It was delivered together with the seventh film; the user's reply to
both: **"another banger after banger. great job lad."**

It is a snapshot of a developing story as it stood on **2026-11-12**. Reuse how it was made, never its facts, script,
sets or score. The category rules and the order of work are in [`../README.md`](../README.md); every number, command
and trap is in [`../PLAYBOOK.md`](../PLAYBOOK.md). To start a new film, restore the newest snapshot,
[`../truck-stop-heist/`](../truck-stop-heist/README.md).

It was made from `main` by following the playbook, starting from `restore.py fake-boss`: one full render, no question
to the user.

## The film in numbers

| | |
|---|---|
| File | [`final-720p.mp4`](final-720p.mp4): 720×1280, 30 fps, 2213 frames, 73.767 s, 46,394,026 bytes, H.264 + 48 kHz stereo AAC |
| SHA-256 | `411943b8e72cb053c5ba139c863bad0a786da64f890f96436a3f21753273baef` |
| Narration | 227 words in 13 lines; one take of the user's voice, 72.4 s after `build_voice.py` (3.14 words a second) |
| Picture | 45 entries in the shot list on 15 sets: 38 cuts, six changes of shot that are not cuts, eight close shots |
| Graphics | 129 word-timed captions; a tab that says whose words are running; five quote cards, each marked with whose words they are and where they were published; stamps, source lines, a dated "no arrest reported", two answers |
| Sound | six-eight at 72 bpm, G minor with B flat major, 170 cues; music 5.8 LU under the voice; −14.6 LUFS, true peak −1.0 dBTP (exactly at the gate) |
| Facts | 21 sourced rows, ten things that could not be confirmed, searched again before delivery |
| Renders | one full one, run `43180281971` (a run before it was cancelled while queued: see the lessons) |
| Shot sheets | [`shots-01-23.jpg`](shots-01-23.jpg), [`shots-24-45.jpg`](shots-24-45.jpg): the middle frame of every shot |

## What this film added to the method

- **A story half of which is a criminal group's own account.** A tab THE GROUP'S OWN WORDS stays up while its posts
  and claims are shown. What it wrote is quoted exactly, on cards marked as its own with the date or the place of
  publication; the narration says "claimed", "it wrote", "reportedly". What nobody has confirmed carries UNCONFIRMED
  with the university's own line beside it.
- **An offer that could itself be a trap never stands alone.** The group's offer of money is followed at once by the
  university's "do not respond", in its own words. The group's site, its channel and any way to reach it are never
  shown or named, and the channel is cut from the quotation (rule 11).
- **A group nobody has identified:** three hoods with no faces, as a picture of "a group" and not a head count.
- **Two accounts of one outage, neither decided:** each side's words in a shot of its own.
- **The pairs check, from the numbers too.** Two wide cameras side by side on one set make the picture hop, and the
  middle frame of each shot does not show it. For every change of shot on one set compare the cameras from
  `story.ts`: when the subject's size changes by a factor between about 0.8 and 1.25, make it one take
  (`join: true`) or frame it anew. A render was queued before this check and had to be cancelled.
- **A graphic that belongs to one entry of the shot list disappears at a join** unless it is placed over both
  (`over(a, b, …)` in `Overlays.tsx`).
- **Words on props and signs:** hide a set's own sign while a card, stamp or tab is in front of it; a word on a prop
  goes above 70 % of the frame's height; a highlighter is multiplied onto the page, not laid over it; anything wide
  is stacked, not placed side by side.
- **Spelled initials are read slowly** (four letters took 2.2 s): `SQUEEZE` in `build_voice.py` closes the gaps.
- **The sound encode can go a full decibel over the mix** where several noisy cues start together. This film was
  built to −2.3 dB and came out at exactly −1.0 dBTP. The seventh film is built to −2.8 dB for that reason.

## Read in this order

1. [`source/shoots/sorry-hackers/SCRIPT.md`](source/shoots/sorry-hackers/SCRIPT.md): facts and sources, what could
   not be confirmed, this film's rules, narration, characters, beat map, cuts, voice, sound, render, result.
2. [`source/remotion-app/src/videos/sorryhack/story.ts`](source/remotion-app/src/videos/sorryhack/story.ts): the shot
   list, keyed to words of the narration.
3. [`Overlays.tsx`](source/remotion-app/src/videos/sorryhack/Overlays.tsx): every word on screen and its cue.
4. `cast.ts`, then `sets.ts`, `sets2.ts`, `sets3.ts` and `props.ts`.
5. [`source/shoots/sorry-hackers/audio/build_mix.py`](source/shoots/sorry-hackers/audio/build_mix.py) and `cues.md`.
6. `source/.github/workflows/render-short.yml` and the scripts in `source/remotion-app/scripts/`.
7. The two shot sheets beside this file, with `story.ts` open.

## Put it back in a working checkout

```sh
python references/news/restore.py sorry-hackers        # film and shoot folders, registration in src/Root.tsx
(cd remotion-app && npm ci --no-audit --no-fund && npx tsc --noEmit -p .)
python shoots/sorry-hackers/audio/build_mix.py         # NumPy + SciPy; writes audio/mix.wav, cues.md, qa-shots.json
python templates/scripts/word_margins.py shoots/sorry-hackers/audio/build_mix.py
cd remotion-app && REVIEW=SorryHackReview REMOTION_BROWSER="$(scripts/local-chromium.sh)" scripts/pick.sh out/r1 100,1000,2200 540
```

`mix_wav_sha256` in [`manifest.json`](manifest.json) is the mix that went into the MP4. To render the film again,
commit the restored tree with the mix on your branch, push, and run

```sh
gh workflow run render-short.yml --ref <branch> -f composition=SorryHackShort \
  -f mix=shoots/sorry-hackers/audio/mix.wav -f shots=shoots/sorry-hackers/qa-shots.json \
  -f publish='shoots/sorry-hackers/final-{size}p.mp4' -f size=720 -f chunks=20
```

Expect 2213 frames, about twelve minutes with the wait for runners, and a clean `qa-report.md`. Two renders of the
same code are not identical bit for bit: compare with a threshold, not for equality.

## What was checked, and what was not

The finished file was checked technically (size, frame count, loudness, true peak, silence, black, white and frozen
frames, unplanned jumps, the encode against its WAV). The picture was reviewed on still frames only: 236 local stills
in seven rounds, then from the finished file one frame in every 24 (every shot), four frames around each of the six
joins and the last second. The sound was set from meters, and the facts were searched again on the day of delivery.
The agent that made the film did not listen to it and did not watch it in motion. Known small things are listed at
the end of the script's "Result".
