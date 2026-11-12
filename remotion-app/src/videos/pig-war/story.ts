// Timeline of the short cut: 102 s at 30 fps. Shot boundaries and caption cards are generated from the
// narration by scripts/make_shots_ts.py (they land on the word that opens each sentence), so this file only
// describes cameras, depth of field and where the boar is.
export const FPS = 30;
export const D0 = 0;

import { CARDS, SHOT_ROWS, TOTAL_FRAMES } from "./shots";
import { WORD_T } from "./words";

export const TOTAL = TOTAL_FRAMES; // 3070 frames / 102.3 s
export const CAPTIONS = CARDS;

export type V3 = [number, number, number];
export type Light = "day" | "golden";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export type SetId =
  | "patch" | "strait" | "island" | "chart" | "bellevue" | "landing" | "farm" | "prairie" | "pasture"
  | "porch" | "fence" | "yard" | "office" | "harney" | "camp" | "redoubt" | "between" | "deck"
  | "bay" | "griffin" | "washington" | "scott" | "gettysburg" | "geneva" | "map" | "claim"
  | "grave" | "village" | "park" | "garden" | "hill";

export type ShotDef = { id: number; a: number; b: number; set: SetId; light: Light; word: number };
export const SHOTS: ShotDef[] = SHOT_ROWS.map((r, i) => ({
  id: i + 1, a: r.a, b: r.b, set: r.set as SetId, light: r.light as Light, word: r.word,
}));

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** hard cut, one layer */
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- narration ----------------
export const WORDS: [number, number][] = WORD_T;
export const word = (i: number) => WORDS[Math.max(0, Math.min(WORDS.length - 1, i))][0];
export const wf = (i: number) => Math.round(word(i) * FPS);
/** a mechanism fires on the frame its word is spoken */
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
const run = (keys: Key[], f: number) => {
  let cur = keys[0].s;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = mix(cur, k.s, glide((f - k.f) / 24));
  }
  return cur;
};

const PATCH_WIDE: Cam = { pos: [5.2, 2.5, 10.5], look: [-3.0, 1.2, 0.5], fov: 42, roll: 0 };

const SETCAM: Record<SetId, Cam> = {
  patch: PATCH_WIDE, fence: { pos: [2.2, 1.5, 9.4], look: [6.6, 1.2, 6.6], fov: 38, roll: 0 },
  porch: { pos: [3.05, 1.62, 6.2], look: [-6.0, 1.15, 3.9], fov: 40, roll: 0 }, claim: PATCH_WIDE,
  bellevue: { pos: [16, 1.5, 26], look: [-6, 1.2, -26], fov: 40, roll: 0 },
  landing: { pos: [-58, 3.2, 44], look: [-96, 0.6, 30], fov: 38, roll: 0 },
  farm: { pos: [18, 2.2, 20], look: [-10, 1.4, -24], fov: 42, roll: 0 },
  prairie: { pos: [26, 3.2, 26], look: [-10, 1.4, -22], fov: 40, roll: 0 },
  pasture: { pos: [22, 2.6, 20], look: [-6, 1.2, -18], fov: 38, roll: 0 },
  yard: { pos: [30, 2.4, 4], look: [10, 1.4, -22], fov: 40, roll: 0 },
  village: { pos: [22, 2.2, 10], look: [6, 1.4, -20], fov: 38, roll: 0 },
  strait: { pos: [4, 3.2, 34], look: [70, -1, -150], fov: 40, roll: 0 },
  island: { pos: [-20, 6, 30], look: [-120, 2, -170], fov: 36, roll: 0 },
  bay: { pos: [10, 4, 30], look: [60, -2, -120], fov: 42, roll: 0 },
  camp: { pos: [6, 3.6, 32], look: [-2, 2.2, -24], fov: 44, roll: 0 },
  redoubt: { pos: [0, 2.2, 20], look: [-4, 1.4, -6], fov: 40, roll: 0 },
  between: { pos: [0, 1.7, 16], look: [0, 1.5, -14], fov: 42, roll: 0 },
  hill: { pos: [26, 2.6, -40], look: [30, 1.0, -54], fov: 34, roll: 0 },
  garden: { pos: [22, 1.7, 9], look: [26, 0.9, -3], fov: 32, roll: 0 },
  park: { pos: [20, 2.2, 14], look: [26, 1.2, -6], fov: 34, roll: 0 },
  grave: { pos: [30, 1.5, -44], look: [28, 0.6, -56], fov: 30, roll: 0 },
  chart: { pos: [0, 2.5, 1.15], look: [0, 0.95, -0.45], fov: 44, roll: 0 },
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

/** hand-keyed cameras: the hook, the boar under the rail, and the two men at the fence */
const CAMS: Record<number, Key[]> = {
  // 1 — macro on the boar's snout in the furrow, low sun behind it
  1: [
    { f: 0, s: { pos: [4.35, 0.68, 7.05], look: [1.2, 0.47, 6.5], fov: 28, roll: -0.012 } },
    { f: 120, s: { pos: [3.4, 0.6, 6.88], look: [1.24, 0.47, 6.5], fov: 25, roll: -0.006 } },
  ],
};

export const camAt = (id: number, f: number): Cam => {
  const keys = CAMS[id];
  if (keys) return run(keys, f);
  const s = SHOTS[id - 1], base = SETCAM[s.set] ?? PATCH_WIDE;
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const k = 0.02 + 0.05 * u;
  const o = ((id * 53) % 7) - 3;
  return {
    pos: [base.pos[0] + (base.look[0] - base.pos[0]) * k + o * 1.1,
      base.pos[1] + (base.look[1] - base.pos[1]) * k * 0.4,
      base.pos[2] + (base.look[2] - base.pos[2]) * k + o * 0.7],
    look: base.look,
    fov: base.fov - 1.4 * u,
    roll: o * 0.005,
  };
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => V3 } {
  const id = shotAt(f).id;
  const room = ["chart", "office", "harney", "washington", "scott", "geneva", "map", "griffin"].includes(SHOTS[id - 1].set);
  const cInf = id === 1 ? 3 : id === 9 || id === 10 || id === 11 ? 6 : room ? 5 : 14;
  return { cInf };
}

// ---------------- the pig ----------------
export type PigState = { x: number; y: number; z: number; yaw: number; phase: number; root: number; ear: number };
const ROOT = (t: number, a = 0.55, b = 0.12) => a + b * Math.sin(t * 2.3);

export const pigAt = (id: number, f: number): PigState => {
  const a = SHOTS[id - 1].a, t = (f - a) / FPS;
  if (id === 1) return { x: 0.72 - 0.02 * t, y: 0, z: 6.55, yaw: 0.06, phase: (t * 0.9) % 1, root: ROOT(t), ear: Math.sin(t * 3.1) * 0.5 };
  if (id === 9) {
    // squeezing under the sprung rail and into the rows
    const k = glide((t - 0.4) / 2.6);
    return { x: 6.7 - 3.4 * k, y: 0, z: 6.9, yaw: 0.1 - 0.2 * k, phase: (t * 1.4) % 1, root: 0.45, ear: Math.sin(t * 4) * 0.5 };
  }
  // 11 — still in the rows, mid-mouthful, when Cutlar comes out
  return { x: 1.1 + 0.5 * Math.sin(t * 0.6), y: 0, z: 6.55, yaw: 0.06, phase: (t * 1.1) % 1, root: ROOT(t, 0.6, 0.08), ear: Math.sin(t * 2.8) * 0.45 };
};
