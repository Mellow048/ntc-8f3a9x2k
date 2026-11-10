// Timeline of "The Dark Day" (May 19, 1780). Shots are timed to the voice
// (shoots/darkday/voice/words.json): dark noon wide -> Williams writing -> street panic ->
// the Ontario fire -> aftermath -> lamp analogy -> the red sun -> tree scars -> night.
// Camera grammar: hard cuts on reframes, continuous smootherstep push-ins on every hold.
export const FPS = 30;
export const D0 = 0; // floor height (kept for build.ts/world compat)
export const TOTAL = 1740; // 58.0 s @ 30 fps (voice 0.1-54.24 s + ~3.8 s night outro)
export const FLASH_AT = -100; // unused; kept for the composition shape

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 153, light: "day" },     // "On May 19th..." (dark noon wide)
  { id: 2, a: 153, b: 330, light: "day" },   // "Harvard professor Samuel Williams..." (writing desk)
  { id: 3, a: 330, b: 636, light: "day" },   // "By noon, candles..." (street panic)
  { id: 4, a: 636, b: 800, light: "day" },   // "The real cause was a forest fire in Ontario..." (horizon fire)
  { id: 5, a: 800, b: 975, light: "day" },   // "Luckily... Unluckily..." (aftermath on the street)
  { id: 6, a: 975, b: 1152, light: "day" },  // "Cover a lamp with your hand..." (lamp insert)
  { id: 7, a: 1152, b: 1400, light: "day" }, // "For days before, the sun had already hung red as blood..."
  { id: 8, a: 1400, b: 1565, light: "day" }, // "In 2007, scientists counted fire scars..." (tree cookie)
  { id: 9, a: 1565, b: TOTAL, light: "day" } // "The darkness finally lifted late that night." (red moon)
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
/** Continuous smootherstep creep across each key span — no static holds. */
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
    { f: 0, s: { pos: [0, 2.1, 17.5], look: [0, 3.4, -8], fov: 42, roll: 0 } },
    { f: 152, s: { pos: [0, 1.9, 13.2], look: [0, 3.1, -8], fov: 40, roll: 0 } },
  ],
  2: [
    { f: 153, s: { pos: [0.35, 1.72, 3.6], look: [-0.1, 1.15, 0.4], fov: 35, roll: 0 } },
    { f: 329, s: { pos: [0.3, 1.66, 2.55], look: [-0.1, 1.13, 0.4], fov: 37, roll: 0 } },
  ],
  3: [
    { f: 330, s: { pos: [2.6, 1.8, 9.0], look: [-0.6, 2.0, -4], fov: 41, roll: 0 } },
    { f: 486, s: { pos: [2.0, 1.72, 7.6], look: [-0.8, 2.0, -4.5], fov: 39, roll: 0.02 } },
    { f: 635, s: { pos: [1.4, 1.66, 6.6], look: [-1.0, 1.9, -5], fov: 38, roll: 0 } },
  ],
  4: [
    { f: 636, s: { pos: [0, 2.6, 10.0], look: [0, 3.4, -60], fov: 46, roll: 0 } },
    { f: 799, s: { pos: [0, 2.35, 5.5], look: [0, 3.2, -60], fov: 44, roll: 0 } },
  ],
  5: [
    { f: 800, s: { pos: [-2.2, 1.75, 7.2], look: [0.8, 1.9, -5], fov: 38, roll: 0 } },
    { f: 974, s: { pos: [-1.4, 1.7, 5.6], look: [0.6, 1.85, -5.5], fov: 36, roll: -0.02 } },
  ],
  6: [
    { f: 975, s: { pos: [0, 1.35, 2.35], look: [0, 1.1, 0], fov: 33, roll: 0 } },
    { f: 1151, s: { pos: [0, 1.3, 1.55], look: [0, 1.08, 0], fov: 31, roll: 0 } },
  ],
  7: [
    { f: 1152, s: { pos: [0, 2.4, 14.5], look: [0, 7.5, -25], fov: 44, roll: 0 } },
    { f: 1399, s: { pos: [0, 2.25, 11.0], look: [0, 6.9, -25], fov: 42, roll: 0 } },
  ],
  8: [
    { f: 1400, s: { pos: [1.15, 1.5, 2.15], look: [0, 1.05, 0], fov: 34, roll: 0 } },
    { f: 1564, s: { pos: [0.75, 1.42, 1.35], look: [0, 1.02, 0], fov: 32, roll: 0 } },
  ],
  9: [
    { f: 1565, s: { pos: [0.4, 2.2, 14.0], look: [0, 3.6, -10], fov: 42, roll: 0 } },
    { f: 1739, s: { pos: [0.4, 2.05, 10.5], look: [0, 3.5, -10], fov: 40, roll: 0 } },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** People in the set per shot: bean-headed townsfolk (cast.ts). */
export type PersonState = { x: number; z: number; expr: string; look: number; phase: number; hop: number };
export const peopleAt = (id: number, f: number): PersonState[] => {
  const t = f / FPS;
  const idle = (x: number, z: number, expr: string, look: number, seed: number): PersonState =>
    ({ x, z, expr, look, phase: 0, hop: Math.max(0, Math.sin(t * 1.7 + seed * 2.3)) * 0.012 });
  switch (id) {
    case 1:
      return [
        idle(-1.35, -2.0, "nervous", 0, 1),
        idle(0.95, -4.2, "shock", 0, 2),
        idle(2.15, -0.5, "nervous", -1, 3),
      ];
    case 2:
      return [idle(0, 0.05, "neutral", 0, 4)]; // Williams, seated behind the desk
    case 3:
      return [
        idle(-1.5, -1.5, "shock", 0, 1),
        idle(0.6, -3.6, "nervous", 1, 2),
        idle(2.3, 0.8, "shock", -1, 3),
        idle(-2.6, 1.2, "neutral", 1, 5),
      ];
    case 4: return [];
    case 5:
      return [
        idle(-1.9, -2.4, "relief", 1, 1),
        idle(0.9, -4.5, "neutral", 0, 2),
        idle(2.2, -0.8, "grin", -1, 3),
      ];
    case 6: return [];
    case 7:
      return [
        idle(-2.2, -3.0, "nervous", 0, 1),
        idle(1.6, -5.0, "neutral", 0, 2),
      ];
    case 8:
      return [idle(0.85, 0.25, "grin", -1, 6)]; // the scientist
    case 9:
      return [idle(-1.6, -2.2, "relief", 0, 1)];
    default: return [];
  }
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => [number, number, number] } {
  const id = shotAt(f).id;
  // wides sharp; close-ups and inserts shallow
  const cInf = id === 1 || id === 4 || id === 9 ? 2 : id === 7 ? 3 : id === 6 || id === 8 ? 13 : id === 2 ? 10 : 12;
  return { cInf };
}
export const FOREGROUND = false;
