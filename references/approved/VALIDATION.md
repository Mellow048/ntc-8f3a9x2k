# Reference preservation checks

- Both MP4s copied byte-for-byte from the source commits in their manifests.
- SHA-256 + byte count verification passed for every preserved file.
- All original Taipei and Beer renderer modules compared against source commits:
  exact hashes match. Only Taipei registration scaffolding is adapted.
- Relative TypeScript import closure checked: no missing local imports.
- Locked `npm ci` and `tsc --noEmit` passed independently in both source apps.
- No node_modules, transient mix WAVs, scratch renders or unrelated final films
  are included. No expensive re-render was needed to preserve approved MP4s.
- Reproduction recipes document the original synthesis and renderer paths;
  full 3D/audio regeneration was not run in this documentation/preservation task.
- Approval comes from the user's prior viewing, not these checks. These are
  reference examples, not a promise of automatic first-pass approval.


## Köpenick — explicitly approved music-v2 addition

- Exact accepted commit `5cae0e6b752fc56434d806740a59d23c94f44c7a`.
- MP4 moved byte-for-byte into `koepenick/final-720p.mp4`; SHA-256
  `4167efa884652be33fd8f92181d53d60c83ecfa1a23fe29664193476741334a6`.
- All 45 origin source/voice/lock/QA/workflow files compare byte-for-byte.
  Only two new standalone registration adapters remove unrelated-film imports.
- Relative TypeScript import closure, locked `npm ci`, standalone typecheck and
  26-beat/231-word/123-caption timing test passed.
- Regenerated Python score from the preserved snapshot; audio-only remux
  reproduced the accepted MP4 SHA-256 using its preserved H.264 picture.
  Full 2090-frame decode, unchanged picture packet hash, no silence, AAC
  -14.54 LUFS / -1.41 dBTP. No new full 3D render was run for preservation.
- Two contact sheets decoded from the actual approved MP4; not old previews.
- Source notes with historical pending statuses remain frozen. Explicit later
  approval in `koepenick/APPROVAL.md` supersedes them. Agent did not listen;
  complete aesthetic approval came from the user after playing music-v2.
- Taipei/Beer and the separate Nvidia news reference remain intact. Active
  workflow restored to main's generic job; historical branch-pushing Koepenick
  job preserved only inside the inert source snapshot.
