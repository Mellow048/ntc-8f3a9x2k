# The Emu War — shot plan (rebuild)

Why the first cut failed, in numbers: **28 sentences over 10 shots** — 2.8 lines of narration per picture,
average shot 7.3 s, every shot a slow push on an unmoving set. That is why the words and the picture never
meet, the camera reads stiff, and nothing is funny: the picture is a backdrop for a voice-over, not a film.

Rules for the rebuild:

1. **One picture per beat.** 28 sentences → 26 shots (two pairs share a frame because the action is one action).
   Average 2.8 s. No shot carries more than two lines, none carries a line it cannot show.
2. **Cut on the word,** not on a grid: every shot's in-point is the start of its sentence in `words.json`.
3. **Every shot moves.** Either the camera (push / track / pan / tilt / whip) or the subject (run, march, jam,
   flinch, tally, scatter) — and no two consecutive shots use the same camera move.
4. **The hook is three images in four seconds.** Gun aimed at a bird · bird standing over the gun · headline.
   The joke is on screen before the audience knows what the film is about.
5. **Gags are staged, not narrated.** The jam happens on the word "jam". The truck fishtails on "can't turn".
   The tally board fills on the numbers. The hose gag is a physical joke on "the stones just leave".
6. **One location, one light per beat;** `golden` only for the hook, the explanation and the closer.

`s` = start, `e` = end of the sentence in the narration (`shoots/emu-war/voice/words.json`).

| # | in–out (s) | line | picture | camera |
|---|---|---|---|---|
| 1 | 0.00–1.55 | Australia once sent machine guns after a flock of birds. | Low angle: a Lewis gun muzzle in the foreground, a single emu pecking behind it, oblivious | static frame, slow drift right (the only still-ish shot; the muzzle snap-focuses) |
| 2 | 1.55–3.31 | — | The gun fires: white flash, dust burst, emu bolts out of frame | whip pan left with the bird |
| 3 | 3.31–4.18 | The birds won. | The emu stops, turns, and looks straight down the barrel | quick push in on the bird's face |
| 4 | 4.34–6.62 | It's 1932, in the wheat belt of Western Australia. | Wide: the district — shed, windmill, tank, wheat, the line of the fence | crane down from sky to ground level |
| 5 | 6.78–9.10 | The wheat is in, the fences are up, | Track along the fence line, wheat heads passing in the foreground | lateral track right, fast |
| 6 | 9.10–10.94 | and a few thousand emus are walking through both. | The flock arrives at the wire; birds stepping through it, the wire ringing | static, flock crossing frame (subject motion carries it) |
| 7 | 11.10–13.60 | So the farmers ask for machine guns. | The farmer on the verandah, hat in hands, talking to the officer | push in past the verandah post (foreground wipe) |
| 8 | 13.60–15.27 | The government says yes. | The officer stamps the permit; ink hits paper | top-down tilt down onto the paper |
| 9 | 15.43–17.60 | Major Meredith arrives with two Lewis guns, | The truck comes up the track, guns in the bed | track with the truck, camera moving backwards ahead of it |
| 10 | 17.60–19.84 | two soldiers, and ten thousand rounds. | Crates stacked, lid off: rounds heaped; a soldier counts | push in on the boxes, soldier's hand moving |
| 11 | 20.00–22.70 | A thousand emus are waiting at the dam. | The dam: the whole flock at the water, one bird drinking | high wide, slow tilt up from water to flock |
| 12 | 22.70–23.93 | The guns open up. | Two guns fire, flash and smoke, birds lifting | shake on each burst, push in |
| 13 | 24.09–26.15 | A dozen birds go down, and then the guns jam. | Birds fall; the gun's bolt jams; a soldier slaps it | fast push onto the jammed bolt, then hold 6 frames |
| 14 | 26.31–28.50 | The rest scatter at forty kilometres an hour, | The flock breaks: birds running past the lens, dust | whip pan right, then let them run past the camera |
| 15 | 28.50–30.38 | and the war is on. | The truck slews out of the yard, dust plume | low angle, pan with the truck |
| 16 | 30.54–31.92 | They chase them in a truck. | Truck chasing birds across the paddock, parallax | tracking shot from the side, constant speed |
| 17 | 31.92–33.10 | A truck can't turn like that. | The truck tries a hard turn, back end slides, men hold on | static low, truck turning towards the lens |
| 18 | 33.40–37.14 | Ten thousand rounds later, they've brought down nine hundred and eighty-six of them. | The tally: crate, board, chalk marks appearing, birds laid out in a row | slow track right along the row of birds, board in the foreground |
| 19 | 37.30–38.79 | That's about ten rounds a bird. | Board: the number scribbled, a heap of spent cases beside it | push in on the number |
| 20 | 39.01–42.19 | And most of those birds took a hit and kept on running. | A bird with a scorched patch gets up and runs off | static, subject motion only |
| 21 | 42.43–42.69 | Why? | The emu, dead centre, looking at us | hard push in (2 frames), no easing |
| 22 | 42.84–45.26 | You see, an emu is not a target. | The bird in golden light, full profile, nothing behind it | slow orbit, 15° |
| 23 | 45.42–49.91 | It's fifty kilos of feathers on two long legs, with nothing in the middle worth hitting. | The body held up as a diagram: legs, feathers, the empty middle; the hose gag starts | dolly down the body from head to feet |
| 24 | 50.07–52.23 | Ever hosed down a pile of gravel? | The hose: a jet hitting gravel, stones scattering | low, close, water crossing the lens |
| 25 | 52.23–53.22 | The stones just leave. | The gravel is gone; a wet patch where it was | small pull back, reveal the empty patch |
| 26 | 53.38–56.25 | A machine gun beats an army because men hold a line. | The five men in a rank, rifles up, the line of them against the paddock | slow lateral track along the rank |
| 27 | 56.41–58.44 | Emus don't hold anything. | Cut to the emus: scattered, each facing a different way, none in line | static; chaos in the composition |
| 28 | 58.64–60.62 | On the eighth of December, the army withdrew. | The truck going out down the track, men aboard | static, long lens, truck shrinking |
| 29 | 60.78–63.54 | The press called it the Emu War, and the world laughed. | The front page slaps down on the shed wall: THE EMU WAR | push in on the headline, paper still settling |
| 30 | 63.70–65.96 | The farmers still got their ammunition. | The permit on the post, stamped; behind it, crates still full | rack focus from permit to crates |
| 31 | 66.12–68.43 | They're still culling emus today, with permits. | Permit in the foreground, a modern cull notice beside it, the same post | slow tilt down the two documents |
| 32 | 68.59–72.00 | So Australia lost a war to a bird that can't fly. | The bird at the water, alone, wings folded; it does not fly | static wide, the bird small in frame; the last line lands on nothing moving |

## Sound
Music stays as built (D dorian, 112 bpm, 73.2 s). Re-cut the cues to the new shots: the ostinato enters on
shot 7 (the ask), drops out entirely for shots 21–23 (the explanation), returns at 26 (the rank) and resolves
at 32. SFX to add: the bolt jam (shot 13), the truck engine on 9/15/16/17, the paper slap on 29, the hose on 24.

## What gets deleted
The current 10-shot `SHOTS` table and `CAMS` keys in `story.ts`, and the `blocksLens` runtime hide — with the
cast laid out per shot, no card is ever close enough for that rule to fire, so it goes.
