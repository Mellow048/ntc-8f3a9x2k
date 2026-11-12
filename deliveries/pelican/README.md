# Pelican on a Bicycle

A single self-contained HTML file. The whole picture is hand-authored inline SVG —
no three.js, no Remotion, no images, no fonts, no network requests. Open the file
in any browser; it works offline.

- `pelican-on-a-bicycle.html` — the deliverable (≈50 KB, viewBox `0 0 1200 800`)
- `preview.png` — a 1200 px still rendered from the same markup

## What moves

The pedal rig is real two-bone inverse kinematics, not a canned loop:

- bottom bracket `(608, 582)`, crank 60, hip `(525, 330)`, thigh 175, shin 155
- the near and far cranks are 180° apart, so the legs occlude correctly
- wheels turn at 2.35× crank speed through the chainring
- the first frame (`-0.62 rad`) is baked into the markup, so the still image is
  already correct before any script runs

Everything else is CSS: cloud drift, gull bob, scarf flutter, pouch jiggle, the
fish wagging in the pouch, and dust kicking off the tyres. `prefers-reduced-motion`
stops all of it; space bar or a click pauses and resumes the ride.

Checked at static frame and at crank angles 0, π/2, π, 3π/2: the near knee leads
the near pedal in all four quadrants and both webbed feet stay on their pedals.

## Honest scope

This is a hand-drawn vector illustration, not output from the repo's three.js
pipeline. It is a craft test, not a film: no narration, no score, no captions
track, no 720×1280 render.
