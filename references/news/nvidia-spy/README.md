# Nvidia's CEO and the Suspected Spy — the approved news short

- Video: [final-720p.mp4](final-720p.mp4)
- Every shot at a glance: [shots 1–20](shots-01-20.jpg), [shots 21–39](shots-21-39.jpg)
- Source commit and checksums: [manifest.json](manifest.json)

The user watched this film and said: "so well done and not lazy", "maybe the
best one". At the user's request it is kept on `main` as the reference for
**news shorts**.

> **Use this only when the user asks for a short about real-life news.** For a
> regular short that explains something or tells an entertaining story, close
> this folder and study [`references/approved/`](../../approved/README.md)
> instead.

## The film in numbers

| | |
|---|---|
| Length | 69.17 s, 2075 frames, 720×1280, 30 fps |
| Narration | 210 words in 67.6 s, 16 lines; an Arena voice the user picked, read lifted to 1.2× |
| Picture | 39 shots on 18 sets, a new picture every 1.8 s on average |
| Captions | one or two words at a time, on one line, 76 % down the frame |
| Graphics | 25 timed stamps, name tags and cards, plus the closing A/B card |
| Sound | an original 112 bpm score that stops twice, 67 timed cues, −14.6 LUFS |
| Render | 20 parallel jobs on GitHub Actions, 8 to 11 minutes |

## Why it works: carry these over

1. **The first sentence is the whole story.** 5.6 seconds, three shots, two
   stamps. Nothing is explained before the viewer knows why to stay.
2. **Every line gets its own staging.** "The leather jacket guy" is a closet of
   identical jackets, one for each day. "Five minutes" is a street clock that
   runs from 4:00 to 4:05 while a lawyer sprints across the courthouse steps.
   The picture shows what the line says, never a generic backdrop.
3. **The graphics say what the voice does not:** who reported it, the date, the
   exact quote, "ALLEGEDLY", "NOT CHARGED". Most sit in the top third of the
   frame; the captions keep their own band lower down.
4. **The jokes are about the situation:** "I can't even pick a movie that
   fast", "the most expensive date in history". None is about the family.
5. **The music stops for the two lines that matter**, the email quote and the
   movie joke, and the last chord lands before the closing question.
6. **It is fair.** The denial, "she hasn't been charged" and the board's
   statement each get a shot and a card of their own.
7. **It ends on a question with two real sides**, shown as A and B, then "What
   are your thoughts about this?" over a held final picture.
8. **Timing is data.** Cuts, poses, captions, graphics and sound all read the
   same `words.json`. Re-timing the voice moves everything with it.

## Read in this order

All paths are under `source/`, laid out as in the repository.

| Read | For |
|---|---|
| `shoots/nvidia-honeypot/SCRIPT.md` | Facts with a source for each, the film's rules, narration, beat map, voice, sound, render, result |
| `shoots/nvidia-honeypot/narration.txt`, `voice/words.json` | The words and when each is spoken |
| `remotion-app/src/videos/nvidia/story.ts` | The 39 shots. Each cut is the index of a spoken word; length follows the last word |
| `sets.ts`, `sets2.ts`, `sets3.ts`, `props.ts`, `kit.ts` | 18 sets, each built once and posed per frame; the building kit |
| `cast.ts`, `../pendulum/toon.ts` | The cast. One shared cartoon body; a person is told apart by costume |
| `World.ts`, `Nvidia.tsx` | One set per shot, two lights re-coloured per set; ink, lens blur on close shots, bloom, grade |
| `Overlays.tsx`, `Captions.tsx`, `fonts.ts` | Graphics and captions, each cued by a word; bundled fonts |
| `shoots/nvidia-honeypot/build_voice.py`, `shoots/voice_master.py` | Raw take to locked narration: pauses tightened, pace lifted, word timings, three pauses put back |
| `shoots/nvidia-honeypot/audio/build_mix.py`, `audio/cues.md` | Score, effects and mix, all synthesized; measured levels and the cue list |
| `.github/workflows/render-short.yml`, `remotion-app/scripts/`, `templates/scripts/short_qa.py`, `qa-shots.json`, `qa-report.md` | Parallel render, preview stills, checks on the finished file |

Cannot play video? The two shot sheets show one frame from every shot. For
more, this makes sheets of every 15th frame:

```sh
ffmpeg -i final-720p.mp4 -vf "select='not(mod(n,15))',scale=270:-1,tile=7x3" \
  -fps_mode passthrough -q:v 3 /tmp/nvidia-sheet-%02d.jpg
```

## Make a new news short the same way

> **Since 2026-11-12:** `python references/news/restore.py nvidia-spy` does the copying described below in one step, and the
> newest film to start from is `bitcoin-flex`. The order of work with every number and command is in
> [`../PLAYBOOK.md`](../PLAYBOOK.md). What follows is how this film's source was first reused.

Do this on your own branch, never inside this folder.

1. **Research and script.** Follow the news rules in
   [`../README.md`](../README.md) and `IMPORTANT.md` §6. Write
   `shoots/<slug>/SCRIPT.md` with the facts table first, then about 200 words
   of narration for a one-minute film. Show the user the script and say what
   you could not confirm.
2. **Voice.** Use Arena TTS. Offer one candidate at a time; the user did not
   like being handed six reads to choose from. Keep the raw take, then run a
   copy of `build_voice.py` to get `voice.wav` and `words.json`.
3. **Copy the machinery** from `source/` to the same paths in your checkout:
   `remotion-app/src/videos/pendulum/` (post passes and character painter),
   `remotion-app/public/fonts/`, `remotion-app/scripts/`,
   `remotion-app/tsconfig.json`, `.github/workflows/render-short.yml`,
   `shoots/voice_master.py`. `templates/audio/` and
   `templates/scripts/short_qa.py` are already on `main`.
4. **Write the film** in `remotion-app/src/videos/<slug>/`. Start from copies
   of `kit.ts`, `fonts.ts`, `Captions.tsx`, `World.ts`, `Nvidia.tsx` and the
   card components in `Overlays.tsx` (stamp, name tag, quote card). Write your
   own `story.ts`, sets, costumes and graphic cues. For the sound, keep the
   mixing half of `build_mix.py` (levels, ducking, limiter, report) and write
   new music and effects. Register the composition in
   `remotion-app/src/Root.tsx`.
5. **Preview before the full render**, from `remotion-app/`:

   ```sh
   node scripts/stills.mjs <CompositionId> out/x --every=30 --width=540
   python scripts/sheet.py out/x out/sheet.jpg --cols 6
   ```
6. **Render on GitHub** with the copied workflow. Its defaults point at this
   film, so pass your own `composition`, `mix`, `shots` and `publish`.
7. **Check the finished MP4** and report exactly what you checked.

Lessons this film paid for:

- Keep 70–82 % of the frame height free of signs, props and heads. That band
  belongs to the captions.
- Size each caption to fit one line.
- A white prop under coloured light turns grey. Give it the unlit material
  (`lit(color, k)` in `kit.ts`).
- Lens blur only on close shots. It was more than half the render cost.
- Music that can be heard sits about 5–6 LU under the voice. Words stay clear
  because the music dips between 1.2 and 5 kHz while someone speaks, and an
  accent that lands on a word is held back. Read the top of `cues.md`.
- Job logs may not download from a sandbox. The workflow writes failures and
  the check summary to annotations:
  `gh api repos/<owner>/<repo>/check-runs/<job id>/annotations`.

## Rebuild this exact film

Standalone, from a copy outside the repository:

```sh
cp -a references/news/nvidia-spy/source /tmp/nvidia && cd /tmp/nvidia/remotion-app
npm ci
npx tsc --noEmit
npx remotion render src/reference-entry.tsx NvidiaShort /tmp/nvidia-picture.mp4 \
  --width=720 --height=1280 --codec=h264 --crf=16 --concurrency=2 --gl=swiftshader --muted
cd ..
python -m pip install numpy scipy
python -B shoots/nvidia-honeypot/audio/build_mix.py
ffmpeg -y -i /tmp/nvidia-picture.mp4 -i shoots/nvidia-honeypot/audio/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest /tmp/nvidia-reference.mp4
```

As one job, that render takes more than an hour on a GitHub runner. The
parallel way, on your own branch:

```sh
cp -a references/news/nvidia-spy/source/. .
# add the imports and the two <Composition> lines from
# remotion-app/src/reference-entry.tsx to remotion-app/src/Root.tsx
python -B shoots/nvidia-honeypot/audio/build_mix.py   # writes audio/mix.wav
git add -A && git commit -m "Restore the Nvidia short" && git push
gh workflow run render-short.yml --ref <your branch> -f composition=NvidiaShort
```

The copy replaces `.github/workflows/render-short.yml` and
`remotion-app/tsconfig.json` on your branch. The workflow muxes `mix.wav` from
the repository, so it has to be committed. When only the sound changed, add
`-f parts_from=<run id>` to reuse the rendered picture (about 2 minutes; parts
are kept for 3 days).

For previews, `scripts/plan.mjs` and `scripts/stills.mjs` bundle
`src/index.ts`; set `REMOTION_ENTRY=src/reference-entry.tsx` to use the
standalone entry, and `REMOTION_BROWSER` to a Chromium binary if Remotion
cannot download its own.

## What was checked, and what was not

- **The approved MP4** is byte-for-byte the delivered file. Before delivery
  the agent checked it technically (size, frame count, loudness, true peak, no
  silence, no black, white or frozen frames, every frame jump accounted for)
  and reviewed the picture on 139 still frames.
- **The agent never listened to it or watched it in motion.** The sound was set
  from measurements. The approval is the user's, after watching it.
- **This snapshot** was tested with both recipes above. Standalone: `npm ci`,
  typecheck, preview stills, a six-frame render at 720×1280 through
  `reference-entry.tsx`, `build_mix.py` and the mux. Restored next to `main`'s
  files: typecheck and the render plan (2075 frames in 20 parts). Both times
  `build_mix.py` gave the same `mix.wav` as the one in the MP4 (numpy 2.4.6,
  scipy 1.17.1; the checksum is in the manifest). A full re-render from the
  snapshot was not run. The picture code is the code that rendered the
  approved MP4.
- **Not stored:** `audio/mix.wav` (regenerated by `build_mix.py`),
  `node_modules`, the production `Root.tsx`, which also registered an unrelated
  film.
- **Known small things, left as they are:** the "ON AIR" sign is partly behind
  a graphic in the interview shot, and two board members are cut by the frame
  edge in the board-statement shot.

The story is a snapshot of what was reported on 2026-11-10. Links in
`SCRIPT.md` to the production branch are provenance; the files here are the
reference.
