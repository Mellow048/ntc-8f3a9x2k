# Bridge remaster

This revision keeps the approved narrator, original mix and one- or two-word timed subtitles. The bridge has its own 19-shot design (`remotion-app/src/videos/bridge-remaster/BridgeWorld.ts`): roadway and character close-ups, a constrained-ruler demonstration, the joint seen at different temperatures, interlocking fingers, a flexible seal and a bearing cutaway. Hot and cold are indicated visually rather than with extra labels. The selected shots use the same depth-of-field and ink/grade stack as the Taipei film.

The source is frame-deterministic. `shoots/build_series_qa.py` reads the bridge shot starts from the shot list when regenerating `qa-shots.json`. Final output is 720 × 1280 at 30 fps with the existing 48 kHz mix; the historical source video remains available in the branch's earlier commits.
