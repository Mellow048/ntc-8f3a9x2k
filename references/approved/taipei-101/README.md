# Taipei 101 — primary approved reference

Video: [final-720p.mp4](final-720p.mp4). Original source commit and hashes:
[manifest.json](manifest.json). Found on `arena/2524fc8a-ntc-8f3a9x2k` at
`04cb77afebaae79f093a8d32ce45eb18c09f0559`, original path
`shoots/pendulum/final-720p.mp4`. Branch name is provenance, not a dependency.

## Read in this order

- `source/shoots/pendulum/SCRIPT.md`, `voice/words.json`: facts and timing.
- `source/remotion-app/src/videos/pendulum/story.ts`: timed shot plan,
  purposeful cameras, focus and action progression.
- `build.ts`, `world.ts`: detailed geometry, different environments, physically
  readable mechanisms and deterministic animation.
- `cast.ts`, `toon.ts`, `cardshade.ts`: expressive consistent characters.
- `paint.ts`, `lights.ts`, `shade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`,
  `Pendulum.tsx`: painted materials and actual post-processing stack.
- `source/shoots/pendulum/audio/`: original music, SFX, timeline, DSP and mix.

This historical film's presentation is a benchmark, not a specification for
all future films. Today's 1–2-word caption rule still applies to new work.

## Standalone reproduction recipe (GitHub runner)

From this directory:

```sh
cd source/remotion-app
npm ci
npx tsc --noEmit
npx remotion render src/reference-entry.tsx PendulumShort /tmp/taipei-picture.mp4 \
  --width=720 --height=1280 --codec=h264 --crf=16 --concurrency=2 --gl=swiftshader
cd ..
python -m pip install numpy scipy
python shoots/pendulum/audio/mix.py
ffmpeg -y -i /tmp/taipei-picture.mp4 -i shoots/pendulum/audio/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest /tmp/taipei-reference.mp4
```

Install Chromium/system libraries and FFmpeg on the runner as in the included
historical workflow. `src/reference-entry.tsx` is the only new registration
adapter; it replaces the old root that imported several unrelated films.
The regenerated encoder output is not expected to be bit-identical across
versions/platforms; the preserved MP4 is the approved visual reference.
