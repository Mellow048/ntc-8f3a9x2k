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
