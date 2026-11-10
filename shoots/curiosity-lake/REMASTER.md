# Final remaining idea — Lake Peigneur

User accepted Beer Flood and Yamaguchi, then authorized the final remaining
idea with a time constraint. Only Lake Peigneur is revised here; accepted
sources and MP4s remain unchanged against b94b3d4.

## Production

Independent entry: remotion-app/src/lake-remaster/index.tsx, LakeRemastered.
1,107 frames, 36.900s, 720×1280/30fps. Original approved Arena voice and
forced-aligned 1–2-word moving subtitles retained. Same reference-derived
ink/paint/shadows/grade stack; MSAA4, reduced bloom, no DOF blur. New source
render CRF17, mux without a second picture encode. All rendering on GitHub.

## Readable actions rather than interchangeable angles

19 timed beats / 10 sets: whirlpool hook, intact derrick and drilling workers,
cutaway linking the lake/rig/shaft/mine, rotating drill breach and falling
water, animated bathtub-plug analogy, sinking rig and eleven barges, canal
reversal, workers emerging onto dry land, nine barges resurfacing, and the
flooded mine remaining below the lake. Clear contextual labels.

Open radial water mesh deforms into an eight-unit-deep funnel with moving
spiral foam. Boats use exactly the shader's surface-height equation, then
submerge completely when pulled to the centre. Resurfacing uses global frame
time across both cuts, not a reset per shot. Three visibly distinct workers;
people stand on the dry rig deck or shore, never on the water. Static geometry
is batched inside moving rigs/barges as well as in the overall scene.

Mine before the breach is dry; flooding begins only after the narrated breach.
The cutaway is an explanatory diagram, not an engineering survey. No claimed
precise bore dimensions, survey mistake or exact miner count. Sources and
approved fact boundaries remain in SCRIPT.md.

## Sound

Original arranged 132 BPM curiosity/tension score using the studied Taipei
instrument/DSP primitives: bass/chords, glock, brass and percussion, quieter
mine explanation, audible drill, breach, rushing-water and resurfacing cues.
Actual post-duck section targets: music 8–10 LU below the original voice.
CI master -15 LUFS, -1.5dBTP. No new TTS or changes to the accepted other mixes.

## Review / render status

TypeScript, all-frame shot/camera coverage and local score generation passed.
Preview run 42795237776 succeeded. All 19 stills were inspected in a contact
sheet; one corrective batch addressed mine pre-flooding, overly slow boat
resurfacing, rig/boat full submersion, cropped worker framing, repeated escape
positions, canal ripple/foam direction agreement and the tiny return-water
centre opening. Bathtub water stays visible as the plug lifts.

Full render run 42797244370 succeeded. Final MP4 published in commit 83ed67d.
Reviewed a 2 fps contact sheet extracted from the finished MP4, covering the
breach, full rig submersion, workers escaping and barges resurfacing.
Automated QA: 720×1280, 30 fps, 1107 frames / 36.900 s, H.264/AAC stereo;
-15.1 LUFS, -1.5 dBFS peak. No detected silence, black frames, unplanned
white frames, frozen spans or anomalous frame-difference spikes.
Final delivered for user review; not yet user-approved. Accepted Beer and
Yamaguchi files and source remain unchanged. Redundant picture checkpoint
removed after successful copy-mux; preview PNGs compacted to JPEG only.
