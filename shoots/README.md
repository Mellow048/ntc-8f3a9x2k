# Shoots

One folder per short:

```text
shoots/<slug>/
├── SCRIPT.md      # facts + sources, then script
├── voice/         # voice.wav + words.json (hand-fixed timings)
├── audio/         # mix.wav + stems + cues.md
└── out/           # stills, QA sheets, final video.mp4 (git-ignored)
```

Follow `SKILL.md` (the vendored `cartoon-3d-short` skill). Remotion
compositions live in `src/videos/<name>/` once the Remotion project is
scaffolded (see `docs/setup.md`).
