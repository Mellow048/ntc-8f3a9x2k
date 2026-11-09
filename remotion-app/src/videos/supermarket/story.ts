// Timeline of the supermarket short: "Coke or Pepsi? The hardest decision of
// my life." Shots are timed to the voice words (shoots/supermarket/voice/
// words.json): walk-in, shelf reveal, torn between red and blue, decision,
// walk-off. Camera grammar follows the skill: continuous push-ins, hard cuts
// on big reframes, impact kicks on the grab.
export const FPS = 30;
export const D0 = 0; // floor height (kept for build.ts compat)
export const TOTAL = 420; // 14 s @ 30 fps (voice 0.1–10.8 s + 3.2 s outro)
export const FLASH_AT = -100; // (unused; kept for the Bridge.tsx shape)

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 69, light: "day" },     // "I came in for a Coke." (walk in)
  { id: 2, a: 69, b: 153, light: "day" },   // "But the Pepsi was sitting right there." (shelf reveal)
  { id: 3, a: 153, b: 214, light: "day" },  // "Red, or blue?" (torn)
  { id: 4, a: 214, b: 323, light: "day" },  // "This is genuinely the hardest decision of my life." (decision)
  { id: 5, a: 323, b: TOTAL, light: "day" },// walk-off, happy, blue can in hand
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
  let cur = keys[0].s;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = mix(cur, k.s, glide((f - k.f) / 24));
  }
  return cur;
};

/** Per-shot camera keys: every hold pushes in; big reframes are hard cuts. */
const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: { pos: [0, 1.7, 7.5], look: [0, 1.4, -3], fov: 40, roll: 0 } },
    { f: 45, s: { pos: [0, 1.6, 5.5], look: [0, 1.4, -3.5], fov: 38, roll: 0 } },
  ],
  2: [
    { f: 69, s: { pos: [0.6, 1.6, 0.8], look: [-0.4, 1.5, -5], fov: 36, roll: 0 } },
    { f: 130, s: { pos: [0.7, 1.55, 0.2], look: [-0.6, 1.5, -5], fov: 34, roll: 0 } },
  ],
  3: [
    { f: 153, s: { pos: [0, 1.5, -1.2], look: [0, 1.5, -5], fov: 34, roll: 0 } },
    { f: 195, s: { pos: [0, 1.5, -1.7], look: [0, 1.55, -5], fov: 32, roll: 0.04 } },
  ],
  4: [
    { f: 214, s: { pos: [0.8, 1.5, -0.8], look: [0.6, 1.4, -5], fov: 34, roll: 0 } },
    { f: 300, s: { pos: [0.9, 1.5, -1.3], look: [0.7, 1.4, -5], fov: 33, roll: 0 } },
  ],
  5: [
    { f: 323, s: { pos: [0.5, 1.7, 2.5], look: [0.5, 1.4, 4], fov: 38, roll: 0 } },
    { f: 400, s: { pos: [0.8, 1.8, 5.5], look: [0.8, 1.5, 6], fov: 40, roll: 0 } },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** Guy position and pose per shot. Guy walks the aisle (z from +3 to -2),
 *  stops at the shelf, grabs the blue (Pepsi) can, walks off. */
export type GuyState = { x: number; z: number; expr: string; look: number; phase: number; can: 0 | 1; hop: number };
export const guyAt = (id: number, f: number): GuyState => {
  const t = f / FPS;
  const walk = (z0: number, z1: number, f0: number, f1: number) => z0 + (z1 - z0) * glide((f - f0) / Math.max(1, f1 - f0));
  switch (id) {
    case 1: return { x: 0, z: walk(3.2, 0.2, 6, 60), expr: "smile", look: 0, phase: (t * 0.5) % 1, can: 0, hop: 0 };
    case 2: return { x: 0, z: walk(0.2, -1.0, 75, 120), expr: f < 120 ? "grin" : "neutral", look: 0.5, phase: (t * 0.5) % 1, can: 0, hop: 0 };
    case 3: {
      const u = (f - 153) / 61;
      const look = u < 0.33 ? -1 : u < 0.66 ? 1 : -1; // left (Coke) / right (Pepsi) / left
      return { x: 0, z: -1.0, expr: "nervous", look, phase: 0, can: 0, hop: 0 };
    }
    case 4: {
      const u = (f - 214) / 109;
      const look = u < 0.7 ? 1 : 0; // stares at Pepsi, then decides
      const expr = u < 0.55 ? "nervous" : u < 0.8 ? "shock" : "grin";
      return { x: 0, z: -1.0, expr, look, phase: 0, can: u >= 0.8 ? 1 : 0, hop: u >= 0.8 ? Math.max(0, Math.sin((u - 0.8) / 0.2 * Math.PI)) * 0.12 : 0 };
    }
    default: return { x: 0.4, z: walk(-1.0, 3.0, 330, 410), expr: "laugh", look: 0, phase: (t * 0.5) % 1, can: 1, hop: Math.max(0, Math.sin(t * 7)) * 0.04 };
  }
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => V3 | [number, number, number] } {
  const id = shotAt(f).id;
  // shelves + guy close = shallow DOF; wide aisle = deep.
  const cInf = id === 1 ? 2 : id === 5 ? 4 : 12;
  return { cInf };
}
export const FOREGROUND = false;
