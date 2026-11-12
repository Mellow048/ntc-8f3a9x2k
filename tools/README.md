# Pelican on a bicycle — generator

The deliverable is `../pelican-bicycle.html` (and its standalone twin
`../pelican-bicycle.svg`). Both are hand-built vector artwork: no raster
images, no scripts, no external references or fonts.

Rebuild them with:

    python3 pelican_build.py
    POSE_T=0.5 python3 pelican_build.py      # bake a different crank phase

## How the motion works

Nothing is CSS-animated. Every moving part is a SMIL `<animate>` /
`<animateTransform>` with explicit rotation centres, so:

* a renderer that ignores SMIL still shows a correct static pose (each group's
  `transform` attribute holds the t=0 frame), and
* there is no `transform-origin` / `transform-box` ambiguity to get wrong.

## The two things that are actually checked

`pelican_build.py` prints its own assertions on every run:

* `crank/pedal worst error (px)` — both pedals sit exactly on their crank-arm
  ends at all 72 sampled phases, for the near and far side. 0.0000 means the
  arms and the pedals cannot drift apart.
* `IK foot worst error (px)` — the two-bone leg solver puts the foot on the
  pedal at all 360 phases, both legs. 0.0000.

`check_smil.py` then reads the finished SVG back and verifies the animation
layer: every joint's first keyframe equals its static transform, the cranks and
wheels describe exactly one full turn, and both pedal paths stay on the crank
circle.

    python3 check_smil.py ../pelican-bicycle.svg
    # -> RESULT: PASS

## Leg design note

A plain IK solution folds the knee *above* the hip when the pedal comes close
(`ta < -110 deg`), which reads as a broken leg. The thigh angle is therefore
clamped to a natural range and the thin tarsus is allowed to telescope; the
foot still lands exactly on the pedal because the shin vector is recomputed
from the clamped knee.
