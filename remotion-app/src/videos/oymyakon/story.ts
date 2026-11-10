// Timeline of "The Coldest Town on Earth" (Oymyakon, Siberia). Shots are timed to the voice
// (shoots/oymyakon/voice/words.json): valley wide -> town -> cars/buckets -> school + frost ->
// laundry -> the 1933 record -> boiling-water splash -> "summer" -> hot spring tag.
// Hard cuts on reframes, continuous smootherstep push-ins on every hold.
export const FPS = 30;
export const D0 = 0;
export const TOTAL = 1890; // 63.0 s @ 30 fps (voice 0.09-59.44 s + ~3.5 s outro)
export const FLASH_AT = -100;

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 123, light: "day" },      // "In Siberia, there is a town where minus fifty is a warm day."
  { id: 2, a: 123, b: 315, light: "day" },    // "Oymyakon, population five hundred..."
  { id: 3, a: 315, b: 574, light: "day" },    // "Cars run all night... water arrives the old-fashioned way."
  { id: 4, a: 574, b: 744, light: "day" },    // "Schools close only below minus fifty five... Eyelashes freeze mid blink."
  { id: 5, a: 744, b: 908, light: "day" },    // "And the laundry, it drops, it freezes, it is dry. Probably."
  { id: 6, a: 908, b: 1126, light: "day" },   // "In 1933, somebody recorded minus sixty seven point seven degrees..."  (night)
  { id: 7, a: 1126, b: 1338, light: "day" },  // "Throw a cup of boiling water... freezes before it touches the ground."
  { id: 8, a: 1338, b: 1603, light: "day" },  // "Luckily, summer exists... Unluckily, it tops out around minus five."
  { id: 9, a: 1603, b: TOTAL, light: "golden" }, // "Oymyakon means the water that does not freeze..."
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
    { f: 0, s: { pos: [0, 3.4, 21.0], look: [0, 2.6, -28], fov: 44, roll: 0 } },
    { f: 122, s: { pos: [0, 3.0, 16.0], look: [0, 2.5, -28], fov: 42, roll: 0 } },
  ],
  2: [
    { f: 123, s: { pos: [-2.2, 2.2, 10.5], look: [0.6, 2.6, -6], fov: 40, roll: 0 } },
    { f: 314, s: { pos: [-1.4, 2.0, 7.6], look: [0.8, 2.45, -6], fov: 38, roll: 0 } },
  ],
  3: [
    { f: 315, s: { pos: [4.6, 1.9, 6.4], look: [-0.6, 1.0, -2.5], fov: 38, roll: 0 } },
    { f: 444, s: { pos: [3.6, 1.75, 4.2], look: [-0.9, 0.9, -2.8], fov: 36, roll: 0 } },
    { f: 573, s: { pos: [2.2, 1.6, 3.2], look: [-2.3, 1.0, -3.4], fov: 34, roll: 0.02 } },
  ],
  4: [
    { f: 574, s: { pos: [3.4, 1.8, 7.6], look: [-1.2, 1.6, -4], fov: 39, roll: 0 } },
    { f: 658, s: { pos: [2.6, 1.72, 6.1], look: [-1.4, 1.5, -4], fov: 37, roll: 0 } },
    { f: 743, s: { pos: [0.3, 1.9, 1.7], look: [0.05, 1.98, 0], fov: 32, roll: 0 } }, // frost CU
  ],
  5: [
    { f: 744, s: { pos: [2.6, 1.75, 6.6], look: [-0.8, 1.6, -3], fov: 38, roll: 0 } },
    { f: 907, s: { pos: [1.6, 1.7, 4.6], look: [-0.9, 1.55, -3], fov: 36, roll: 0 } },
  ],
  6: [
    { f: 908, s: { pos: [1.7, 2.0, 4.6], look: [-0.4, 1.7, -2], fov: 36, roll: 0 } },
    { f: 1125, s: { pos: [1.1, 1.9, 2.8], look: [-0.4, 1.62, -2], fov: 33, roll: 0 } },
  ],
  7: [
    { f: 1126, s: { pos: [3.6, 1.8, 5.6], look: [-0.8, 1.35, -1.6], fov: 38, roll: 0 } },
    { f: 1232, s: { pos: [2.6, 1.65, 3.6], look: [-0.9, 1.3, -1.8], fov: 35, roll: 0 } },
    { f: 1337, s: { pos: [1.8, 1.55, 2.4], look: [-1.0, 1.28, -2.0], fov: 33, roll: 0 } },
  ],
  8: [
    { f: 1338, s: { pos: [0, 2.5, 11.5], look: [0, 1.8, -8], fov: 41, roll: 0 } },
    { f: 1472, s: { pos: [0, 2.3, 8.6], look: [0, 1.72, -8], fov: 39, roll: 0.02 } },
    { f: 1602, s: { pos: [0, 2.15, 6.2], look: [0, 1.68, -8], fov: 37, roll: 0 } },
  ],
  9: [
    { f: 1603, s: { pos: [2.8, 2.3, 8.6], look: [-0.9, 0.7, -3.2], fov: 38, roll: 0 } },
    { f: 1889, s: { pos: [1.8, 2.1, 5.6], look: [-0.95, 0.65, -3.4], fov: 36, roll: 0 } },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** People in the set. (y is implicit 0; the frost CU uses the big-face card.) */
export type PersonState = { x: number; z: number; expr: string; look: number; phase: number; hop: number };
export const peopleAt = (id: number, f: number): PersonState[] => {
  const t = f / FPS;
  const idle = (x: number, z: number, expr: string, look: number, seed: number): PersonState =>
    ({ x, z, expr, look, phase: 0, hop: Math.max(0, Math.sin(t * 1.55 + seed * 2.05)) * 0.012 });
  switch (id) {
    case 2:
      return [idle(1.3, -2.2, "neutral", 0, 3)];
    case 3:
      return [idle(3.6, 2.5, "neutral", -1, 1), idle(-2.0, -1.2, "grin", 0, 2)];
    case 4:
      return [idle(-1.6, -3.4, "grin", 0, 4), idle(-0.4, -3.8, "neutral", 0, 5), idle(0.9, -3.2, "grin", 0, 6)];
    case 5:
      return [idle(1.15, -2.2, "nervous", 1, 2)];
    case 6:
      return [idle(0.9, -0.6, "neutral", -1, 8)];
    case 7:
      return [idle(1.55, -1.0, "grin", -1, 9)];
    case 8:
      return [idle(1.4, -5.5, "neutral", 0, 10), idle(-2.1, -6.5, "grin", 0, 11)];
    case 9:
      return [idle(-0.8, -2.1, "grin", 1, 12)];
    default:
      return [];
  }
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => [number, number, number] } {
  const id = shotAt(f).id;
  const cInf = id === 1 || id === 8 || id === 9 ? 3 : id === 4 && f > 660 ? 13 : id === 4 ? 8 : id === 6 ? 11 : id === 5 ? 11 : id === 7 ? 12 : 6;
  return { cInf };
}
export const FOREGROUND = false;
