# Isolated curiosity shorts

These three original, stylized historical reconstructions belong to branch
`arena/044538ca-ntc-8f3a9x2k`. The supermarket composition, shared Root/index,
package files, original workflow and templates are unchanged.

## Entries and assets

- Entry: `src/curiosity/index.tsx` (independent of `src/index.ts`).
- Compositions: `Curiosity-beer`, `Curiosity-survivor`, `Curiosity-lake`.
- Specs: **720×1280**, 30 fps, H.264 + AAC stereo 48 kHz.
- Arena TTS selected voice `voice-00`; final recordings are committed in
  `shoots/curiosity-*/voice/voice.wav`.
- Forced-aligned word timings: `voice/words.json`. `data.ts` is generated from
  the same timing JSON; subtitles display at most two words at a time.
- Script, sources and fact boundaries: each shoot's `SCRIPT.md`.
- Sound: original synthesized score and filtered-noise cues; ducked bed.
  Premix keeps voice unchanged, music +3 dB, SFX −6 dB. CI applies master
  loudness normalization to −15 LUFS / −1.5 dBTP, then muxes the result.
- Style base: isolated copies of bridge character drawing, two-tone shading,
  lighting presets, ink, lens and grade. Original procedural sets and props.
- Post order: ink → lens pre → lens main → bloom → neutral tone map → grade;
  grain off. 720p CPU pass uses no MSAA to keep GitHub render costs practical.
- All camera/shot timings live in `story.ts`. Camera holds creep continuously.

## Render on GitHub, not locally

```sh
gh workflow run curiosity-shorts.yml \
  --ref arena/044538ca-ntc-8f3a9x2k -f target=all
# target may instead be beer, survivor, or lake
```

Each target has its own concurrency group. A targeted rerender will not cancel
another target. Source pushes do not automatically launch expensive renders;
manual dispatch is the default (the optional `scripts/curiosity/RENDER` marker
is a push trigger).

The workflow produces five preview frames, renders on `ubuntu-latest`, mixes
and muxes audio, and runs `scripts/curiosity/qa.py`. The verifier checks every
frame for black/white/frozen spans plus loudness/specs. Subtitle pop-ins and
story light pulses are explicitly recorded as intentional transitions, not
hidden as unexplained renderer pops. Other pop flags require visual review.
Automated QA does not replace historical review or a human viewing pass.

## Delivery fallback

The Arena sandbox cannot access Azure's Actions-artifact download host.
Accordingly, the workflow also publishes **only these isolated deliveries**
(previews, MP4, QA report) under `deliveries/curiosity-*/` on the fixed session
branch. This lets the sandbox obtain the MP4 through GitHub's Git transport.
It does not alter or merge any other branch or project. Actions artifacts are
also available for 14 days.

## Reproduction of timing and sound

`python scripts/curiosity/prepare.py` requires numpy, scipy and pocketsphinx.
It uses the existing approved Arena voice WAVs; it does not substitute another
TTS provider. It rebuilds word alignment, generated data, music/SFX and premix.
If narration/timing changes, regenerate these together and inspect alignment.
The illustrations are explanatory cartoons, not exact architectural surveys.
