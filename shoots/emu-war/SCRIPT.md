# The Emu War — SCRIPT

Regular short (not news). Category: history / curiosity-comedy, in the tone of
Köpenick. Vertical, 30 fps, ~63 s, one narrator, new score.

## Facts

The events below are the standard account of the 1932 Western Australian
"Emu War". **This checkout has no web access** (GitHub only), so these are the
figures I can state with confidence from the common record, not freshly
citations-checked. Anything the film leans on visually is listed here; nothing
invented is spoken as fact.

| Figure | What it is | Confidence |
|---|---|---|
| 1932, Campion district, Western Australia | place and year of the operation | solid |
| Veteran wheat farmers | the settlers whose crops and fences the emus destroyed | solid |
| Two Lewis guns, two soldiers | the force issued, on condition the army fired them | solid |
| ~10,000 rounds (9,860 recorded) | ammunition taken into the field | solid |
| Major G. P. Meredith | officer commanding the operation | solid |
| ~1,000 emus at the dam | first massed encounter, guns jammed after about a dozen kills | solid |
| ~986 emus killed | Meredith's final figure before withdrawal | solid, uncontested |
| 8 December 1932 | withdrawal | solid |
| "the Emu War" | the name the press gave it | solid |
| Meredith's report | records that wounded birds kept running | solid |
| Permits to this day | Western Australia still licenses emu culling | solid |

Deliberately **not** used: the "carry lead like a Zulu warrior" quote (attribution
is shaky and the wording is a period slur), the exact round count per bird
beyond "about ten", and any claim about medals being awarded.

## Script

Delivered flat and dry — the narrator is never impressed by anything. 235 words,
23 sentences, 72.0 s at 3.3 words/s. Times below are measured from
`voice/words.json`, not estimated.

1. Australia once sent machine guns after a flock of birds. The birds won. *(0.0s – 4.2s)*
2. It's 1932, in the wheat belt of Western Australia. *(4.3s – 6.6s)*
3. The wheat is in, the fences are up, and a few thousand emus are walking through both. *(6.8s – 10.9s)*
4. So the farmers ask for machine guns. The government says yes. *(11.1s – 15.3s)*
5. Major Meredith arrives with two Lewis guns, two soldiers, and ten thousand rounds. *(15.4s – 19.8s)*
6. A thousand emus are waiting at the dam. The guns open up. *(20.0s – 23.9s)*
7. A dozen birds go down, and then the guns jam. *(24.1s – 26.1s)*
8. The rest scatter at forty kilometres an hour, and the war is on. *(26.3s – 30.4s)*
9. They chase them in a truck. A truck can't turn like that. *(30.5s – 33.1s)*
10. Ten thousand rounds later, they've brought down nine hundred and eighty-six of them. *(33.4s – 37.1s)*
11. That's about ten rounds a bird. *(37.3s – 38.8s)*
12. And most of those birds took a hit and kept on running. *(39.0s – 42.2s)*
13. Why? *(42.4s – 42.7s)*
14. You see, an emu is not a target. *(42.8s – 45.3s)*
15. It's fifty kilos of feathers on two long legs, with nothing in the middle worth hitting. *(45.4s – 49.9s)*
16. Ever hosed down a pile of gravel? The stones just leave. *(50.1s – 53.2s)*
17. A machine gun beats an army because men hold a line. *(53.4s – 56.3s)*
18. Emus don't hold anything. *(56.4s – 58.4s)*
19. On the eighth of December, the army withdrew. *(58.6s – 60.6s)*
20. The press called it the Emu War, and the world laughed. *(60.8s – 63.5s)*
21. The farmers still got their ammunition. *(63.7s – 66.0s)*
22. They're still culling emus today, with permits. *(66.1s – 68.4s)*
23. So Australia lost a war to a bird that can't fly. *(68.6s – 72.0s)*

## Beats (what changes on screen)

1. **Hook** — a wheat paddock at dawn; a line of emus walks through a wire fence
   as if it isn't there. Nothing is broken yet: that is the joke.
2. **Setting** — pull back: flattened crop, leaning fence posts, the same birds
   working down the rows. Heat shimmer.
3. **The ask** — a farmhouse verandah, a telephone, a hand pointing at the
   paddock. Cabinet door, a stamp coming down.
4. **The force** — a truck on the track: two diggers, two Lewis guns, an
   ammunition crate. The crate is the punchline shot — 10,000 stamped on it.
5. **The dam** — wide: the water tank/dam, a thousand emus massed on the flat.
   The guns come up on their bipods. Contact.
6. **The jam** — muzzle flash, dust puffs, birds dropping; then the gun's action
   stops, a hand slaps the receiver. Before/during/after is visible.
7. **The scatter** — the whole flock turns and runs at once, legs and dust.
   The direction of travel reverses; that is the mechanism of the rest of the film.
8. **The chase** — camera on the truck bed: a bouncing gunner, a bird crossing
   the frame at speed, the shot missing behind it. Repeated twice, tighter.
9. **The count** — the crate nearly empty, the tally scratched on a board,
   a mountain of nothing gained: the paddock still full of birds.
10. **The wrong target** — the explanation. A single emu turns side-on, slow,
    close: feathers, long legs, a body that is mostly air. Bullet paths pass
    through where "a body" should be and hit nothing vital.
11. **The hose** — the analogy, staged as a real object: a hose jet on gravel,
    stones skittering away. Cut back to the machine gun.
12. **The line** — two ranks of soldiers holding a line, then emus refusing to
    form one. This is the actual reason and the film's thesis.
13. **Withdrawal** — 8 December: the truck leaving, dust, the dam behind it,
    the birds walking back to the water.
14. **The laugh** — newspaper front pages, a masthead, a stamp; the world
    reading it. Quick, one beat.
15. **The permits** — modern fence, a permit nailed to a post, a farmer with a
    rifle on the same paddock, sixty years later in the same light.
16. **Closer** — the single emu from beat 10, side-on, at the water, unhurried.
    Bird that can't fly. Cut to black on the last word; 1.2 s music tail.

## Delivery

- `shoots/emu-war/voice/` — voice.wav + words.json (1–2-word captions)
- `shoots/emu-war/audio/` — mix.wav + stems + cues.md
- `remotion-app/src/videos/emu-war/` — composition source
- Renders on GitHub Actions (`render-short.yml`); no local browser in this sandbox.
