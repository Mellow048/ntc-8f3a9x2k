# London Beer Flood — accepted motion/detail reference

Video: [final-720p.mp4](final-720p.mp4). Original commit and file checksums:
[manifest.json](manifest.json). User explicitly accepted this revision; it is
not the rejected first cut. The preserved MP4 is unchanged (29,754,163 bytes).

## Read in this order

- `source/shoots/curiosity-beer/SCRIPT.md`, `REMASTER.md`: fact boundaries and
  why the rejected version needed rebuilding.
- `source/remotion-app/src/beer-remaster/story.ts`: action-led timed beats.
- `build.ts`, `world.ts`, `water.ts` where present: detailed vat/street/props,
  animated collapse and physical immersion rather than walking on hard water.
- `cast.ts` and `style/`: characters, paint, lighting, ink, lens and grade.
- `Beer.tsx`: render composition/post stack; `index.tsx`: standalone entry.
- `source/scripts/beer-remaster/sound/score.py`: original multi-instrument cue,
  effects, voice ducking and mix. Study construction; do not reuse the score.

Beer imports only the subtitle function from `src/curiosity/Short.tsx`, but
that module statically imports its old scene modules. Those exact dependencies
are included to make the import closure complete. **Do not use those old
curiosity worlds as a quality benchmark.**

## Standalone reproduction recipe (GitHub runner)

```sh
cd source/remotion-app
npm ci
npx tsc --noEmit
npx remotion render src/beer-remaster/index.tsx BeerFloodRemastered /tmp/beer-picture.mp4 \
  --width=720 --height=1280 --codec=h264 --crf=16 --concurrency=2 --gl=swiftshader
cd ..
python -m pip install numpy scipy
python scripts/beer-remaster/sound/score.py
ffmpeg -y -i shoots/curiosity-beer/out/remaster/audio/premix.wav \
  -af loudnorm=I=-15:TP=-1.5:LRA=5 -ar 48000 /tmp/beer-mix.wav
ffmpeg -y -i /tmp/beer-picture.mp4 -i /tmp/beer-mix.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -shortest /tmp/beer-reference.mp4
```

Install Chromium/system libraries and FFmpeg on the runner. The included
`source/.github/workflows/beer-remaster.yml` and `beer-camera-repair.yml` are
historical render/repair recipes, **not active main workflows**. Their hardcoded
branch names are not instructions. The saved final already contains the
accepted repair, and current audio requirements supersede old mix defaults.
