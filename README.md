# Cartoon 3D Shorts

> **New session / agent: read [VIDEO_HANDOFF.md](VIDEO_HANDOFF.md) first.** It records the user's approved video style, corrections, production lessons, and current work. See also [AGENTS.md](AGENTS.md). **Current user overrides: 720×1280 output and synchronized 1–2-word subtitles**, superseding the older 2K/no-caption defaults below.

**2D characters in a colourful 3D world** — flat bean-head cartoon cards with
ink outlines in a painted 3D town, over a voice narration with synthesized
SFX + march music. This repo vendors the free **`cartoon-3d-short`** Claude
skill and wraps it in our production process.

Upstream: [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
(MIT), proven on the 67 s short *The Bridge That Fell for a Song*.

## What's in here

| Path | What it is |
| --- | --- |
| `SKILL.md` | The skill: full pipeline, rules, fixes, final look values |
| `templates/bridge/` | Full source of the bridge short (world, characters, ink, lens blur, grade, story/camera) |
| `templates/audio/` | Synthesized sound: SFX, march music, ducked mix |
| `templates/scripts/` | Stills, side-by-side sheets, merge, frame QA helpers |
| `references/` | Style bible, measured reports, 38 reference frames, 20 contact sheets |
| `IMPORTANT.md` | Our release gates (no captions, 2K export, CI rendering) |
| `docs/setup.md` | Remotion scaffold + GitHub Actions rendering |
| `shoots/` | One folder per short (script, voice, audio) |
| `UPSTREAM-README.md` | Upstream README, kept as-is |

## The look (from the skill)

- 1080×1920 master, final export **1440×2560** @ 30 fps, H.264 CRF 16
- Bean heads ~3.5 head-heights tall, plum ink, no blush, 14 expressions
- Painted 3D town (muted brick/cream/ochre), ink outlines, sky gradients,
  fog = horizon colour, DOF on ~1/3 of screen time (focus on eyes)
- Gliding cameras, creeping push-ins on every hold, impact kicks
- Voice over ducked march score (music +3 dB, SFX −6 dB)

## Use it

1. Scaffold the Remotion project once — see [docs/setup.md](docs/setup.md).
2. Follow `SKILL.md`: topic → script → voice (+`words.json`) → shot plan in
   `story.ts` → stills/side-by-sides → final render.
3. Render on **GitHub Actions** (never on your laptop):
   Actions → **Render short** → download the `cartoon-3d-short` artifact.
4. QA with `templates/scripts/short_qa.py` before delivery.

Story, characters and voice are always our own — the `references/` are for
style study only (see the skill). Code and docs are MIT; see `LICENSE`.

## License

MIT. See [LICENSE](LICENSE).
