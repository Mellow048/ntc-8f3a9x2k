# The Building on Giant Springs — detailed remaster

Approved 63-second Arena narration retained; only this next short is being rebuilt. Output remains 720×1280 at 30 fps with synchronized 1–2-word captions.

## Picture

- Bespoke Beaux-Arts City Hall: rusticated windowed wings, entrance columns and pediment, balustrades, drum/rotunda, ribbed slate-green dome, gold bands and lantern.
- Civic-center plaza with tiled paths, lawns, kerbs, detailed street furniture, windowed urban blocks and attributed real vehicle meshes (the same models credited in `../breathing-bridge/ASSET-CREDITS.md`).
- Immediate exterior → foundation cutaway → real layered isolator hook. No coil-spring cartoon that misrepresents the mechanism.
- 31 narration-anchored shots in `spring-remaster/story.ts`, with intentional push-ins and architecture trucks. Same approved ink, lens, bloom and color-grade pipeline.
- Demonstrations only when narrated: finite earthquake envelopes, smaller but nonzero superstructure motion, shear between fixed end plates. The ground and base are not glued together. Moat clearance is visible during relative motion.
- Jelly analogy: first locked tray follows table and wobbles strongly; sliding tray transmits less motion. Neither demonstration runs as background idle animation.

## Sound

`mix_remaster.py` preserves the approved voice, rebuilds the original score around the new shot timing, adds a tiny early rhythmic lift, and times quiet effects to the finite demonstrations. Only writes this short's mix; other videos are untouched.

## Checks

`node --experimental-strip-types shoots/spring-building/test-motion.mjs` checks finite shaking, nonzero but reduced building motion and the jelly analogy. Visual diagnostic reviews and finished-video technical QA are required before replacing the earlier low-detail export.

## Finished export

Delivered in `788cc88` after successful run `42789733540`: 720×1280, 30 fps, 1890 frames / 63.000 s, stereo 48 kHz AAC, 60,345,284 bytes. Finished-file QA measured −15.0 LUFS / −1.3 dBFS peak with no detected silence, black frames, unplanned white frames, ≥12-frame freezes or unplanned frame-difference spikes. Twenty representative frames from the finished MP4 were visually reviewed, including readable architectural framing, captions, jelly/tray contact, rubber shear and moat clearance. The history/plaza foundation motion and continuous rubber deformation were corrected before the final render. Awaiting user feedback; technical QA is not user approval.
