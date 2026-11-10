# Engineering shorts

Five 720 × 1280, 30 fps narrated cartoon shorts, each approximately one minute:

| Short | Composition | Files |
|---|---|---|
| The Bridge That Breathes | `BreathingBridgeShort` | `breathing-bridge/` |
| The Building on Giant Springs | `SpringBuildingShort` | `spring-building/` |
| The Airport Built on the Ocean | `OceanAirportShort` | `ocean-airport/` |
| The Tunnel Under the Sea | `ChannelTunnelShort` | `channel-tunnel/` |
| The Skyscraper With a Hole in It | `SkyPlazaShort` | `sky-plaza/` |

Each folder holds a researched `SCRIPT.md`, the selected Arena narration in `voice/voice.wav`, word-level alignment in `voice/words.json`, the original synthesized music/SFX mix at `audio/mix.wav`, and shot metadata for quality checking. The five films use `remotion-app/src/videos/engineering-series/`: `data.json` contains frame-aligned visual beats and words, `World.ts` builds and animates the individual 3D sets, and `Series.tsx` renders captions in groups of at most two words.

Run `python shoots/build_series_data.py` after editing the aligned words or `series-plan.json`. `shoots/mix_series.py` rebuilds the mixes using the synthesis modules in `shoots/pendulum/audio/`. `prepare_series_voice.py` documents the preparation of the original TTS takes; the final processed voice files are retained, while the raw intermediate takes are not.

For each render use `.github/workflows/render-short.yml` with the composition above, the corresponding `shoots/<folder>/audio/mix.wav`, `shoots/<folder>/qa-shots.json` for `qa`, and `size=720`. The workflow muxes the audio and runs the frame/loudness QA script before uploading the MP4 and report.
