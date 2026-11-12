// Timeline of "The War With One Dead Pig": the whole 1859 San Juan Island story, 232 s at 30 fps.
// Shot boundaries come from shoots/pig-war/voice/words.json (a shot opens on the sentence that opens it),
// so the cuts land on the narration. Same shape as the supermarket/bridge story modules:
// FPS, TOTAL, SHOTS, word(i), action(f,i,d), shotAt(f), camAt, dofAt, layersAt.
export const FPS = 30;
export const TOTAL = 6960; // 232.0 s (narration 231.93 s + music tail)
export const D0 = 0;

export type V3 = [number, number, number];
export type Light = "day" | "golden";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

/** The 22 places the story needs. Named after the shot plan's `set` column (SHOT_PLAN.md). */
export type SetId =
  | "patch" | "strait" | "island" | "chart" | "bellevue" | "landing" | "farm" | "prairie" | "pasture"
  | "porch" | "fence" | "yard" | "office" | "harney" | "camp" | "redoubt" | "between" | "deck"
  | "bay" | "griffin" | "washington" | "scott" | "gettysburg" | "geneva" | "map" | "claim"
  | "grave" | "village" | "park" | "garden" | "hill";

export type ShotDef = { id: number; a: number; b: number; set: SetId; light: Light };

/** [start second, set, light] from SHOT_PLAN.md v1 — 60 shots, hard cuts on the sentence boundary. */
const PLAN: [number, SetId, Light][] = [
  [0.05, "patch", "golden"],       // 1  boar's snout in the rows (hook)
  [2.94, "patch", "golden"],       // 2  a warship's bow in the haze behind the pig
  [4.0, "strait", "day"],          // 3  empty water, five hulls, a sheep on the bluff
  [5.54, "island", "day"],         // 4  glide along the shore
  [11.95, "chart", "day"],         // 5  the 1846 line is drawn
  [18.03, "chart", "day"],         // 6  the ruler moves; a second channel
  [21.08, "island", "day"],        // 7  two flags on one rise, thirteen years
  [26.33, "bellevue", "day"],      // 8  sheep pour over the bluff
  [28.52, "landing", "day"],       // 9  1853: the lighter, the tally stick
  [36.37, "farm", "day"],          // 10 six years on: four thousand sheep
  [43.79, "prairie", "day"],       // 11 Americans arriving
  [45.17, "prairie", "day"],       // 12 stakes in the Company's best pasture
  [52.66, "pasture", "day"],       // 13 Cutlar's claim, the Company's sheep
  [55.27, "porch", "day"],         // 14 the tax bill on the step
  [58.91, "yard", "day"],          // 15 Griffin refuses it
  [63.47, "prairie", "day"],       // 16 six quiet years, then a shape at the gap
  [66.01, "patch", "day"],         // 17 the boar squeezing under the rail
  [68.12, "porch", "day"],         // 18 Cutlar in the doorway, coffee going cold
  [76.35, "patch", "day"],         // 19 boot print and hoof print
  [78.1, "fence", "day"],          // 20 the earlier conversation at the fence
  [81.02, "porch", "day"],         // 21 he reaches inside for the gun
  [82.66, "office", "day"],        // 22 the pig as one line in a ledger
  [86.2, "fence", "day"],          // 23 a hundred dollars
  [87.85, "fence", "day"],         // 24 ten dollars, and the lightning line
  [94.85, "porch", "day"],         // 25 a redcoat with a warrant
  [99.24, "porch", "day"],         // 26 the settlers' meeting by lamplight
  [103.26, "harney", "day"],       // 27 Harney signs the order
  [107.71, "camp", "day"],         // 28 Pickett's sixty-four men land
  [111.8, "strait", "day"],        // 29 five warships, guns run out
  [113.75, "redoubt", "day"],      // 30 461 men, fourteen guns
  [118.5, "redoubt", "day"],       // 31 the same arithmetic from both sides
  [123.89, "between", "day"],      // 32 two ranks, one sheep walking through
  [126.31, "between", "day"],      // 33 the orders read out, no finger moves
  [130.85, "deck", "day"],         // 34 Baynes reads the order and says no
  [137.06, "deck", "day"],         // 35 "two great nations"
  [141.4, "bay", "day"],           // 36 excursion boat full of Victorians
  [143.97, "griffin", "golden"],   // 37 church, then whisky in Griffin's room
  [149.87, "washington", "day"],   // 38 the despatch arriving
  [151.48, "scott", "day"],        // 39 Scott lays out joint occupation
  [161.63, "harney", "day"],       // 40 Harney's kit being packed
  [164.69, "camp", "golden"],      // 41 English Camp: tents, barracks, blockhouse
  [170.0, "camp", "golden"],       // 42 tennis, billiards, library, garden
  [175.13, "hill", "golden"],      // 43 the little cemetery
  [177.22, "camp", "day"],         // 44 American Camp: wind, one sentry
  [180.39, "camp", "day"],         // 45 Pickett's coat: blue to grey
  [183.92, "gettysburg", "day"],   // 46 the charge, far off and small
  [186.6, "camp", "day"],          // 47 the empty parade ground, waiting
  [189.11, "washington", "day"],   // 48 1871: two documents, two seals
  [195.39, "geneva", "day"],       // 49 three commissioners, a year of paper
  [197.82, "map", "day"],          // 50 the Kaiser's hand draws Haro Strait
  [204.19, "strait", "day"],       // 51 the island from the water, one flag
  [205.81, "camp", "day"],         // 52 the marines march down to the boats
  [208.91, "claim", "day"],        // 53 the claim with nothing on it
  [211.84, "grave", "day"],        // 54 a plain marker, 1874
  [215.72, "bellevue", "day"],     // 55 Griffin, older, still there
  [217.12, "village", "day"],      // 56 Griffin in the constable's badge
  [219.7, "park", "golden"],       // 57 the modern park
  [222.33, "garden", "golden"],    // 58 the garden being planted
  [227.17, "garden", "golden"],    // 59 push in on the formal beds
  [229.09, "garden", "golden"],    // 60 one bloom moving in the wind
];

export const SHOTS: ShotDef[] = PLAN.map(([t, set, light], i) => ({
  id: i + 1,
  a: Math.round(t * FPS),
  b: i + 1 < PLAN.length ? Math.round(PLAN[i + 1][0] * FPS) : TOTAL,
  set,
  light,
}));

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** hard cut, one layer (place changes cross-fade later, once more than one set is built) */
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- narration ----------------
import { WORD_T } from "./words";
/** Word timing table (shoots/pig-war/voice/words.json): 657 words, [start, end] in seconds. */
export const WORDS: [number, number][] = WORD_T;
/** start time of word i, seconds */
export const word = (i: number) => WORDS[Math.max(0, Math.min(WORDS.length - 1, i))][0];
/** frame at which word `i` starts */
export const wf = (i: number) => Math.round(word(i) * FPS);
/** a mechanism fires on the frame its word is spoken: `action(f, i, d)` is 0 before word i, 1 after d frames */
export const action = (f: number, i: number, d = 14) => clamp01((f - wf(i)) / d);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; s: Cam };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
/** keyed glide: each key eases over 24 frames from wherever the camera was */
const run = (keys: Key[], f: number) => {
  let cur = keys[0].s;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = mix(cur, k.s, glide((f - k.f) / 24));
  }
  return cur;
};

/** Per-shot camera keys. Every hold pushes in; big reframes are hard cuts (a new shot id). */
const CAMS: Record<number, Key[]> = {
  // 1 — macro on the boar's snout in the furrow; rows run away from the lens, low sun behind the pig.
  1: [
    { f: 2, s: { pos: [4.35, 0.68, 7.05], look: [1.20, 0.47, 6.50], fov: 28, roll: -0.012 } },
    { f: 70, s: { pos: [3.85, 0.62, 6.92], look: [1.22, 0.47, 6.51], fov: 26, roll: -0.006 } },
  ],
  // 2 — pull back one step: the pig, the fence, and a sloop's bow hanging in the haze beyond the bluff.
  2: [
    { f: 88, s: { pos: [-4.2, 0.78, 7.4], look: [3.0, 1.15, 6.7], fov: 32, roll: 0 } },
    { f: 118, s: { pos: [-3.4, 0.84, 7.45], look: [3.0, 1.2, 6.7], fov: 29, roll: 0 } },
  ],
  // 17 — the boar squeezing under the sprung bottom rail, from outside the patch looking in
  17: [
    { f: SHOTS[16].a, s: { pos: [7.55, 0.86, 7.5], look: [5.5, 0.42, 6.9], fov: 34, roll: 0.005 } },
    { f: SHOTS[16].a + 55, s: { pos: [7.15, 0.8, 7.35], look: [5.4, 0.40, 6.9], fov: 31, roll: 0.005 } },
  ],
  // 18 — Cutlar in his doorway, the boar working down the row in the foreground
  18: [
    { f: SHOTS[17].a, s: { pos: [3.05, 1.62, 6.2], look: [-6.0, 1.15, 3.9], fov: 40, roll: 0 } },
    { f: SHOTS[17].a + 80, s: { pos: [2.15, 1.56, 5.6], look: [-6.0, 1.12, 3.9], fov: 37, roll: 0 } },
  ],
  // 19 — boot print beside hoof print, flat to the soil
  19: [
    { f: SHOTS[18].a, s: { pos: [-0.55, 1.05, 7.05], look: [-0.75, 0.0, 6.15], fov: 30, roll: 0 } },
    { f: SHOTS[18].a + 40, s: { pos: [-0.62, 0.82, 6.85], look: [-0.78, 0.0, 6.1], fov: 26, roll: 0 } },
  ],
};

/** Wide establishing frame of the patch, used by any patch shot without its own keys. */
const PATCH_WIDE: Cam = { pos: [5.2, 2.5, 10.5], look: [-3.0, 1.2, 0.5], fov: 42, roll: 0 };
const SETCAM: Record<SetId, Cam> = {
  patch: PATCH_WIDE, fence: PATCH_WIDE, porch: PATCH_WIDE, claim: PATCH_WIDE,
  prairie: { pos: [26, 3.2, 26], look: [-10, 1.4, -22], fov: 40, roll: 0 },
  pasture: { pos: [22, 2.6, 20], look: [-6, 1.2, -18], fov: 38, roll: 0 },
  bellevue: { pos: [16, 1.5, 26], look: [-6, 1.2, -26], fov: 40, roll: 0 },
  landing: { pos: [-58, 3.2, 44], look: [-96, 0.6, 30], fov: 38, roll: 0 },
  farm: { pos: [18, 2.2, 20], look: [-10, 1.4, -24], fov: 42, roll: 0 },
  yard: { pos: [30, 2.4, 4], look: [10, 1.4, -22], fov: 40, roll: 0 },
  village: { pos: [22, 2.2, 10], look: [6, 1.4, -20], fov: 38, roll: 0 },
  strait: { pos: [4, 3.2, 34], look: [70, -1, -150], fov: 40, roll: 0 },
  island: { pos: [-20, 6, 30], look: [-120, 2, -170], fov: 36, roll: 0 },
  bay: { pos: [10, 4, 30], look: [60, -2, -120], fov: 42, roll: 0 },
  camp: { pos: [6, 3.6, 32], look: [-2, 2.2, -24], fov: 44, roll: 0 },
  redoubt: { pos: [0, 2.2, 20], look: [-4, 1.4, -6], fov: 40, roll: 0 },
  between: { pos: [0, 1.7, 16], look: [0, 1.5, -14], fov: 42, roll: 0 },
  hill: { pos: [26, 2.6, -40], look: [30, 1.0, -54], fov: 34, roll: 0 },
  garden: { pos: [22, 1.8, 8], look: [26, 0.8, -3], fov: 32, roll: 0 },
  park: { pos: [20, 2.2, 14], look: [26, 1.2, -6], fov: 34, roll: 0 },
  grave: { pos: [30, 1.5, -44], look: [28, 0.6, -56], fov: 30, roll: 0 },
  chart: { pos: [0.15, 1.95, 2.9], look: [0, 0.98, -0.1], fov: 42, roll: 0 },
  office: { pos: [0, 1.9, 3.0], look: [0, 1.1, -0.4], fov: 44, roll: 0 },
  harney: { pos: [0, 1.85, 2.9], look: [0.2, 1.15, -0.5], fov: 42, roll: 0 },
  washington: { pos: [0, 1.8, 2.8], look: [0, 1.1, -0.4], fov: 44, roll: 0 },
  scott: { pos: [1.0, 1.9, 2.7], look: [0, 1.05, -0.5], fov: 44, roll: 0 },
  geneva: { pos: [0, 1.95, 3.1], look: [0, 1.1, -0.6], fov: 40, roll: 0 },
  map: { pos: [0, 2.05, 2.8], look: [0.1, 0.98, -0.5], fov: 40, roll: 0 },
  griffin: { pos: [1.1, 1.85, 2.6], look: [0, 1.1, -0.6], fov: 44, roll: 0 },
  deck: { pos: [0, 1.75, 9], look: [0, 1.5, -14], fov: 44, roll: 0 },
  gettysburg: { pos: [0, 7, 26], look: [24, 2, -130], fov: 32, roll: 0 },
};

export const camAt = (id: number, f: number): Cam => {
  const keys = CAMS[id];
  if (keys) return run(keys, f);
  // default: each set has one base framing; every shot creeps in on it and shifts a little so two
  // consecutive shots in the same place never cut to the same picture
  const s = SHOTS[id - 1], base = SETCAM[s.set] ?? PATCH_WIDE;
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const k = 0.02 + 0.05 * u;
  const o = ((id * 53) % 9) - 4;
  return {
    pos: [base.pos[0] + (base.look[0] - base.pos[0]) * k + o * 0.9,
      base.pos[1] + (base.look[1] - base.pos[1]) * k * 0.4,
      base.pos[2] + (base.look[2] - base.pos[2]) * k + o * 0.55],
    look: base.look,
    fov: base.fov - 1.2 * u,
    roll: o * 0.004,
  };
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => V3 } {
  const id = shotAt(f).id;
  // macro shots: very shallow. Wides: deep.
  const set = SHOTS[id - 1].set;
  const room = set === "chart" || set === "office" || set === "harney" || set === "washington" || set === "scott" || set === "geneva" || set === "map" || set === "griffin";
  const cInf = id === 1 || id === 19 ? 3 : id === 2 || id === 17 || id === 18 ? 6 : room ? 5 : 14;
  return { cInf };
}

// ---------------- the pig ----------------
/** The boar: position, heading (rad, 0 = snout toward +x) and a walk phase. */
export type PigState = { x: number; y: number; z: number; yaw: number; phase: number; root: number; ear: number };
export const pigAt = (id: number, f: number): PigState => {
  const a = SHOTS[id - 1].a;
  const t = (f - a) / FPS;
  // shot 1/2: standing in the rows, rooting — snout down, slow shuffle forward
  if (id === 1) return { x: 0.72 - 0.02 * t, y: 0, z: 6.55, yaw: 0.06, phase: (t * 0.9) % 1, root: 0.55 + 0.1 * Math.sin(t * 2.2), ear: Math.sin(t * 3.1) * 0.5 };
  if (id === 2) return { x: 0.72, y: 0, z: 6.55, yaw: 0.06, phase: 0.2, root: 0.6 + 0.05 * Math.sin(t * 1.7), ear: Math.sin(t * 1.9) * 0.4 };
  // 17: squeezing under the rail at the gap, then trotting into the rows
  if (id === 17) {
    const k = glide((t - 0.35) / 1.5);
    return { x: 6.0 - 3.3 * k, y: 0, z: 6.9 + 0.1 * k, yaw: -0.1 * (1 - k) + 0.12 * k, phase: (t * 1.5) % 1, root: 0.5, ear: Math.sin(t * 4) * 0.5 };
  }
  // 18: working down the row in the foreground of Cutlar's doorway
  if (id === 18) return { x: -3.9 - 0.5 * t, y: 0, z: 4.05, yaw: 0.02, phase: (t * 1.2) % 1, root: 0.6 + 0.08 * Math.sin(t * 2.6), ear: Math.sin(t * 2.8) * 0.45 };
  return { x: 0.7, y: 0, z: 6.55, yaw: 0.06, phase: (t * 1.1) % 1, root: 0.6, ear: 0 };
};
