// Timeline of "The River That Burned" (Cuyahoga, June 22, 1969). Shots are timed to the voice
// (shoots/cuyahoga/voice/words.json): hook -> skyline -> train spark -> fire -> Time magazine ->
// thirteen fires -> oil-floats explanation -> cleanup/fish -> kayak tag. Hard cuts on reframes,
// continuous smootherstep push-ins on every hold.
export const FPS = 30;
export const D0 = 0;
export const TOTAL = 1830; // 61.0 s @ 30 fps (voice 0.1-57.95 s + ~3 s outro)
export const FLASH_AT = -100;

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 143, light: "day" },      // "In 1969, the Cuyahoga River caught fire..."
  { id: 2, a: 143, b: 352, light: "day" },    // "Cleveland, Ohio... dumped oil."
  { id: 3, a: 352, b: 441, light: "day" },    // "A spark from a passing train..."
  { id: 4, a: 441, b: 661, light: "day" },    // "Poof... no photo."
  { id: 5, a: 661, b: 826, light: "day" },    // "Time magazine ran the story anyway..."
  { id: 6, a: 826, b: 971, light: "day" },    // "Luckily... Unluckily, it was the thirteenth."
  { id: 7, a: 971, b: 1226, light: "day" },   // "Oil floats, a spark does the rest..."
  { id: 8, a: 1226, b: 1588, light: "day" },  // "Within a year, Earth Day... fish..."
  { id: 9, a: 1588, b: TOTAL, light: "golden" }, // "The river that refused to flow..."
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; s: Cam };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const run = (keys: Key[], f: number) => {
  if (f <= keys[0].f) return keys[0].s;
  for (let i = 1; i < keys.length; i++) {
    if (f < keys[i].f) {
      const u = glide((f - keys[i - 1].f) / Math.max(1, keys[i].f - keys[i - 1].f));
      return mix(keys[i - 1].s, keys[i].s, u);
    }
  }
  return keys[keys.length - 1].s;
};

/** Per-shot camera keys: every hold pushes in; reframes are hard cuts. */
const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: { pos: [0, 2.4, 13.5], look: [0, 2.6, -14], fov: 43, roll: 0 } },
    { f: 142, s: { pos: [0, 2.15, 10.2], look: [0, 2.35, -14], fov: 41, roll: 0 } },
  ],
  2: [
    { f: 143, s: { pos: [4.4, 2.1, 6.2], look: [2.0, 0.8, -9], fov: 36, roll: 0 } },
    { f: 352, s: { pos: [3.2, 1.55, 3.6], look: [1.6, 0.3, -7.6], fov: 33, roll: 0 } },
  ],
  3: [
    { f: 352, s: { pos: [-6.6, 3.2, 2.6], look: [3.4, 4.1, -8.2], fov: 40, roll: 0 } },
    { f: 440, s: { pos: [-4.4, 3.7, 0.9], look: [3.1, 4.6, -8.8], fov: 38, roll: 0 } },
  ],
  4: [
    { f: 441, s: { pos: [1.3, 2.0, 6.9], look: [-0.5, 0.6, -6.2], fov: 38, roll: 0 } },
    { f: 600, s: { pos: [0.7, 1.7, 4.6], look: [-0.7, 0.6, -6.8], fov: 36, roll: 0.02 } },
    { f: 660, s: { pos: [0, 1.7, 3.4], look: [-0.9, 0.55, -7.2], fov: 35, roll: 0 } },
  ],
  5: [
    { f: 661, s: { pos: [0.35, 1.62, 3.35], look: [-0.25, 1.0, 0.1], fov: 33, roll: 0 } },
    { f: 825, s: { pos: [0.3, 1.58, 2.2], look: [-0.25, 0.97, 0.1], fov: 31, roll: 0 } },
  ],
  6: [
    { f: 826, s: { pos: [0, 1.8, 2.7], look: [0, 1.62, -1.6], fov: 33, roll: 0 } },
    { f: 970, s: { pos: [0, 1.76, 1.55], look: [0, 1.6, -1.6], fov: 31, roll: 0 } },
  ],
  7: [
    { f: 971, s: { pos: [2.5, 1.4, 3.3], look: [0.4, 0.5, -2.1], fov: 35, roll: 0 } },
    { f: 1098, s: { pos: [2.0, 1.3, 2.4], look: [0.3, 0.42, -2.2], fov: 33, roll: 0 } },
    { f: 1225, s: { pos: [1.4, 1.2, 1.7], look: [0.2, 0.38, -2.3], fov: 31, roll: 0 } },
  ],
  8: [
    { f: 1226, s: { pos: [3.1, 2.3, 8.2], look: [-1.1, 0.75, -6.2], fov: 38, roll: 0 } },
    { f: 1406, s: { pos: [1.9, 1.95, 6.1], look: [-1.3, 0.68, -6.6], fov: 36, roll: 0 } },
    { f: 1587, s: { pos: [0.5, 1.7, 4.3], look: [-0.9, 0.7, -7.0], fov: 33, roll: 0 } },
  ],
  9: [
    { f: 1588, s: { pos: [0, 2.6, 10.6], look: [0, 1.5, -8], fov: 41, roll: 0 } },
    { f: 1829, s: { pos: [0, 2.4, 7.6], look: [0, 1.4, -9], fov: 39, roll: 0 } },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** People in the set. */
export type PersonState = { x: number; z: number; expr: string; look: number; phase: number; hop: number };
export const peopleAt = (id: number, f: number): PersonState[] => {
  const t = f / FPS;
  const idle = (x: number, z: number, expr: string, look: number, seed: number): PersonState =>
    ({ x, z, expr, look, phase: 0, hop: Math.max(0, Math.sin(t * 1.6 + seed * 2.1)) * 0.012 });
  switch (id) {
    case 2:
      return []; // the river watches itself: no onlookers, no photo
    case 8:
      return [idle(-1.6, 5.05, "grin", 1, 7)]; // the angler, casting from the pier
    default:
      return [];
  }
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => [number, number, number] } {
  const id = shotAt(f).id;
  const cInf = id === 1 || id === 9 ? 2 : id === 3 ? 4 : id === 5 || id === 6 || id === 7 ? 12 : id === 2 ? 6 : 10;
  return { cInf };
}
export const FOREGROUND = false;
