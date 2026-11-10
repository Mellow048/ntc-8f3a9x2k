# Bridge remaster

The remaster keeps the approved narrator, original mix, and one- or two-word timed subtitles. `remotion-app/src/videos/bridge-remaster/BridgeWorld.ts` contains the 19-shot design, including close views of thermal movement, interlocking fingers and a flexible seal, the workshop ruler analogy, a bridge bearing, and bridge traffic.

The bridge spans the frame and is supported by a pier, with paired towers, suspension cables and hangers, guardrails, sidewalks, roadway markings and lighting. A textured waterfront, city and water provide context. The road vehicles are externally sourced models; authors, source links, licensing and modifications are recorded in `ASSET-CREDITS.md`. The set, lighting, motion, textures and shot design are procedural and frame-deterministic. The selected shots use the same depth-of-field and ink/grade stack as the Taipei film.

`shoots/build_series_qa.py` reads the bridge shot starts from the shot list when regenerating `qa-shots.json`. Final output is 720 × 1280 at 30 fps with the existing 48 kHz mix. Previous versions remain in the branch's earlier commits.
