# Setup & rendering

This repo vendors the `cartoon-3d-short` skill (see `SKILL.md`). The skill's
renderer is **three.js inside Remotion** — the vendored `templates/` are the
short's source, but they expect a host Remotion project. Scaffold it once:

```bash
npx create-video@latest remotion-app --blank   # or any Remotion 4.x scaffold
cd remotion-app
npm i @remotion/three three @types/three
cp -r ../templates/bridge src/videos/bridge
cp ../templates/sandbox_index_example.tsx src/videos/bridge/index.tsx
# register the BridgeShort composition in src/Root.tsx next to the default
```

Version-pin Remotion/`@remotion/three` in the scaffold's `package.json`.
Script, voice and sound for each short live in `shoots/<slug>/` (see
`shoots/README.md`); copy `templates/audio/` next to the short's scripts.

## Rendering in GitHub Actions (never on a laptop)

`.github/workflows/render-short.yml` installs the scaffold, renders the
composition to 2K, muxes the voice mix and uploads the MP4 as an artifact.
Inputs: the composition id, the voice/mix path, and CRF.

```text
Actions → Render short → Run workflow
```

Set `REMOTION_TMP` to a large-disk path inside the runner
(`$GITHUB_WORKSPACE/.remotion-tmp`); Remotion copies `public/` (~1.3 GB)
into its bundle temp and never cleans it.

## Stills / QA (also in CI or locally, stills only)

```bash
node templates/scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5
python templates/scripts/sbs_sheet.py out.jpg --ours <ours> --ref <ref>
python templates/scripts/short_qa.py final.mp4 out/<name>/qa shots.json
```

2K final renders run ~10 minutes; stills at 0.5 scale take seconds after the
bundle. All of it belongs on GitHub's machines.

## Skill usage

Install the skill wherever your agent loads skills (e.g.
`~/.claude/skills/cartoon-3d-short/`), or open `SKILL.md` directly and follow
it. The reference frames/sheets in `references/` are style-study material —
story, characters and voice are always our own.
