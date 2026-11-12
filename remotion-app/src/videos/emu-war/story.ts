// Timeline for "The Emu War" (72.0 s voice, 30 fps). Every beat is timed to a
// measured sentence start from shoots/emu-war/voice/words.json, so the picture
// changes on the word rather than on a guess.
//
// One district, one afternoon: the fence line, the stubble paddock, the shed and
// its verandah, the track, the dam and its windmill. The film moves between them;
// it never repeats an angle of the same static scene.
//
// Shots are keyed to the voice:
//   1  0.00  hook + setting      emus walk through the fence
//   2 11.10  the ask + arrival   shed, the phone, the truck on the track
//   3 20.00  the dam             the flock, the guns, the jam
//   4 26.31  the scatter + chase the flock turns; the truck bed
//   5 33.40  the count           crate, tally board, ten rounds a bird
//   6 39.01  not a target        one emu, side on, bullet paths
//   7 45.42  fifty kilos + hose  feathers and air; the hose on gravel
//   8 53.38  the line            a rank of men vs emus that hold nothing
//   9 58.64  withdrawal + press  the truck leaves, the papers, the permit
//  10 68.59  closer              the emu at the water, unhurried
export const FPS = 30;
export const TOTAL = 2196; // 73.2 s: 72.0 s voice + 1.2 s tail

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

/** light preset keys (see lights in world.ts) */
export type Light = "day" | "golden" | "dusk";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 333, light: "golden" },   // 0.00-11.10 hook + setting
  { id: 2, a: 333, b: 600, light: "day" },    // 11.10-20.00 the ask, the truck
  { id: 3, a: 600, b: 789, light: "day" },    // 20.00-26.31 the dam, the guns
  { id: 4, a: 789, b: 1002, light: "day" },   // 26.31-33.40 scatter + chase
  { id: 5, a: 1002, b: 1170, light: "day" },  // 33.40-39.01 the count
  { id: 6, a: 1170, b: 1363, light: "golden" },// 39.01-45.42 not a target
  { id: 7, a: 1363, b: 1601, light: "day" },  // 45.42-53.38 fifty kilos, the hose
  { id: 8, a: 1601, b: 1759, light: "dusk" }, // 53.38-58.64 the line
  { id: 9, a: 1759, b: 1984, light: "dusk" }, // 58.64-66.12 withdrawal, papers, permit
  { id: 10, a: 1984, b: TOTAL, light: "golden" },// 66.12-73.20 closer
];
export const FLASH_AT = -100; // no flash in this film (kept for the composition shape)
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; s: Cam };
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
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
    cur = mixCam(cur, k.s, glide((f - k.f) / 26));
  }
  return cur;
};
/** Every hold pushes in; nothing idles. Camera height stays low: eye level of a
 *  man standing in stubble, never a drone shot. */
const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: { pos: [-3.4, 1.15, 4.6], look: [-2.2, 1.05, 1.0], fov: 42, roll: 0 } },
    { f: 150, s: { pos: [-2.6, 1.05, 3.2], look: [-1.9, 0.95, 0.6], fov: 39, roll: 0 } },
    { f: 250, s: { pos: [-1.6, 1.0, 2.6], look: [-1.2, 0.9, 0.0], fov: 37, roll: 0 } },
  ],
  2: [
    { f: 333, s: { pos: [6.4, 1.5, -2.2], look: [9.6, 1.35, -6.4], fov: 40, roll: 0 } },
    { f: 420, s: { pos: [7.0, 1.45, -3.2], look: [9.8, 1.3, -6.8], fov: 37, roll: 0 } },
    { f: 500, s: { pos: [4.4, 1.35, 0.4], look: [7.6, 1.1, -3.0], fov: 40, roll: -0.03 } },
  ],
  3: [
    { f: 600, s: { pos: [-1.2, 1.25, -1.4], look: [-7.4, 0.8, -8.2], fov: 40, roll: 0 } },
    { f: 690, s: { pos: [-0.4, 1.15, -2.2], look: [-6.6, 0.7, -8.6], fov: 34, roll: 0 } },
  ],
  4: [
    { f: 789, s: { pos: [-2.0, 1.4, -3.0], look: [-6.4, 0.9, -9.6], fov: 44, roll: 0 } },
    { f: 860, s: { pos: [5.2, 1.8, 6.2], look: [2.0, 1.2, 2.4], fov: 46, roll: -0.05 } },
    { f: 930, s: { pos: [5.6, 1.9, 5.4], look: [2.4, 1.25, 2.0], fov: 40, roll: -0.04 } },
  ],
  5: [
    { f: 1002, s: { pos: [1.1, 1.35, -0.9], look: [2.6, 1.05, -2.6], fov: 38, roll: 0 } },
    { f: 1090, s: { pos: [1.4, 1.3, -1.2], look: [2.7, 1.0, -2.7], fov: 32, roll: 0.02 } },
  ],
  6: [
    { f: 1170, s: { pos: [3.0, 1.05, 1.9], look: [1.4, 0.95, 0.2], fov: 34, roll: 0 } },
    { f: 1290, s: { pos: [2.4, 1.0, 1.3], look: [1.3, 0.92, 0.1], fov: 30, roll: -0.02 } },
  ],
  7: [
    { f: 1363, s: { pos: [2.9, 1.0, 1.7], look: [1.5, 0.95, 0.15], fov: 33, roll: 0 } },
    { f: 1440, s: { pos: [-0.2, 0.55, 2.6], look: [-0.5, 0.15, 1.1], fov: 40, roll: 0 } },
    { f: 1540, s: { pos: [-0.1, 0.42, 2.1], look: [-0.5, 0.1, 1.25], fov: 34, roll: 0.03 } },
  ],
  8: [
    { f: 1601, s: { pos: [6.2, 1.05, 1.2], look: [1.0, 1.0, -1.4], fov: 38, roll: 0 } },
    { f: 1700, s: { pos: [5.4, 1.0, 0.8], look: [1.0, 0.95, -1.6], fov: 32, roll: 0 } },
  ],
  9: [
    { f: 1759, s: { pos: [3.2, 1.5, 6.4], look: [7.4, 1.2, -2.0], fov: 42, roll: 0 } },
    { f: 1860, s: { pos: [3.8, 1.45, 5.2], look: [7.8, 1.15, -2.8], fov: 38, roll: 0.02 } },
    { f: 1920, s: { pos: [8.2, 1.3, -0.4], look: [8.6, 1.15, -1.2], fov: 34, roll: 0 } },
  ],
  10: [
    { f: 1984, s: { pos: [-2.6, 0.95, -3.4], look: [-6.0, 0.75, -8.0], fov: 38, roll: 0 } },
    { f: 2100, s: { pos: [-3.1, 0.9, -4.0], look: [-6.2, 0.72, -8.2], fov: 33, roll: 0 } },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

// ---------------------------------------------------------------- the world
/** Fixed anchors, shared by world.ts and the camera keys above. */
export const A = {
  fenceZ: 1.6,            // the fence line runs along z = 1.6 (posts along x)
  dam: [-8.4, -9.4] as [number, number],
  damR: [5.6, 3.5] as [number, number],
  windmill: [-13.6, -11.4] as [number, number],
  shed: [9.8, -6.6] as [number, number],
  trackX: 7.2,            // the dirt track runs along z at this x
  gun: [-0.8, -2.2] as [number, number],   // the Lewis gun on its bipod
  crate: [1.9, -2.9] as [number, number],
  board: [3.1, -3.6] as [number, number],
};

// ---------------------------------------------------------------- the flock
export type Emu = { x: number; z: number; rot: number; gait: number; head: number };

/** seeded spread so the flock is identical on every render */
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** the massed flock at the dam: a seeded ellipse of birds facing the water */
const MASSED: Emu[] = Array.from({ length: 46 }, (_, i) => {
  const a = rnd(i, 1) * Math.PI * 2, r = Math.sqrt(rnd(i, 2));
  return {
    x: A.dam[0] + Math.cos(a) * r * 3.9 + (rnd(i, 3) - 0.5) * 0.7,
    z: A.dam[1] + 3.2 + Math.sin(a) * r * 2.6 * 0.6 + (rnd(i, 4) - 0.5) * 0.6,
    rot: -0.35 + (rnd(i, 5) - 0.5) * 1.5,
    gait: rnd(i, 6),
    head: 0.2 + rnd(i, 7) * 0.6,
  };
});

/** after the volley: every bird turns and runs away from the gun, out past the fence */
const FLED: Emu[] = MASSED.map((e, i) => ({
  ...e,
  x: e.x + 6.4 + rnd(i, 8) * 3.4,
  z: e.z + 7.6 + rnd(i, 9) * 3.2,
  rot: 0.9 + (rnd(i, 10) - 0.5) * 1.1,
  gait: rnd(i, 11),
}));

/** frames the flock breaks: the volley lands at 24.09 s ("a dozen birds go down") */
export const BREAK_A = 700;
export const BREAK_B = 800;

export const flockAt = (f: number): Emu[] => {
  const u = smooth((f - BREAK_A) / (BREAK_B - BREAK_A)); // 0 = massed, 1 = running
  if (u <= 0) return MASSED;
  if (u >= 1) return FLED;
  return MASSED.map((m, i) => {
    const e = FLED[i];
    return { ...m, x: m.x + (e.x - m.x) * u, z: m.z + (e.z - m.z) * u, rot: m.rot + (e.rot - m.rot) * u };
  });
};

/** the single bird the explanation is built on: always feeding at the same spot */
export const SOLO: Emu = { x: 1.35, z: 0.15, rot: 1.62, gait: 0, head: 0.5 };

/** the bird that outruns the truck in shot 4 */
export const RUNNER: Emu = { x: 3.1, z: 2.6, rot: 1.75, gait: 0, head: 0.15 };

// ---------------------------------------------------------------- the actors
export type TruckState = { x: number; z: number; rot: number; bounce: number; visible: boolean; speed: number };
/** truck drives up the track in shot 2, is parked by the gun in 3-5, races in 4, leaves in 9 */
export const truckAt = (id: number, f: number): TruckState => {
  const bounce = (t: number) => Math.sin(t * 9.5) * 0.035 + Math.sin(t * 4.1) * 0.02;
  const t = f / FPS;
  if (id === 1) return { x: A.trackX, z: 26, rot: 0.06, bounce: 0, visible: false, speed: 0 };
  if (id === 2) {
    const u = glide((f - 355) / 150);
    return { x: A.trackX, z: 22 - 21 * u, rot: 0.04 + 0.1 * u, bounce: u > 0.97 ? 0 : bounce(t), visible: true, speed: 1 - u };
  }
  if (id === 3) return { x: A.trackX - 0.5, z: 0.4, rot: -0.12, bounce: 0, visible: true, speed: 0 };
  if (id === 4) {
    const u = glide((f - 900) / 100);
    return { x: 4.6 - 1.2 * u, z: 5.4 + 2.4 * u, rot: -0.28, bounce: bounce(t) * 1.9, visible: true, speed: 1 };
  }
  if (id === 5) return { x: A.trackX - 0.5, z: 0.4, rot: -0.12, bounce: 0, visible: true, speed: 0 };
  if (id === 9) {
    const u = glide((f - 1770) / 150);
    return { x: A.trackX, z: -1.0 + 27 * u, rot: 0.05, bounce: u > 0.02 && u < 0.96 ? bounce(t) * 1.4 : 0, visible: true, speed: 1 };
  }
  return { x: A.trackX, z: 26, rot: 0, bounce: 0, visible: false, speed: 0 };
};

/** the Lewis gun: yaw follows the flock, fires in bursts inside shot 3 */
export const gunAt = (id: number, f: number) => {
  if (id !== 3) return { yaw: 0.34, flash: 0, kick: 0, jam: id > 3 ? 1 : 0 };
  const t = f / FPS;
  const firing = f > 655 && f < 723;
  const burst = firing ? (Math.sin(t * 21) > 0.45 ? 1 : 0.15) : 0;
  const jam = f >= 723 ? 1 : 0;
  return { yaw: 0.34 + Math.sin(t * 0.8) * 0.05, flash: burst, kick: burst * 0.9, jam };
};

export type Digger = { x: number; z: number; rot: number; pose: "stand" | "kneel" | "aim" | "carry"; expr: string; look: number; phase: number };
/** two gunners and the officer; positions are per shot */
export const crewAt = (id: number, f: number): Digger[] => {
  const t = f / FPS;
  const walk = (i: number) => (Math.sin(t * 6 + i) * 0.03);
  if (id === 1) return [];
  if (id === 2) return [
    { x: A.trackX + 0.9, z: 3.2, rot: -1.35, pose: "stand", expr: "neutral", look: -0.2, phase: (t * 0.5) % 1 },
    { x: A.trackX + 1.7, z: 3.9, rot: -1.4, pose: "carry", expr: "neutral", look: 0.2, phase: (t * 0.5) % 1 },
    { x: 8.6, z: -4.2, rot: 2.6, pose: "stand", expr: "stern", look: 0.4, phase: 0 },
  ];
  if (id === 3) return [
    { x: A.gun[0], z: A.gun[1] + 0.55, rot: 2.5, pose: "kneel", expr: "stern", look: 0.3, phase: 0 },
    { x: A.gun[0] + 1.0, z: A.gun[1] + 0.3, rot: 2.7, pose: "kneel", expr: "shock", look: 0.2, phase: 0 },
    { x: 1.6, z: -1.2, rot: 2.2, pose: "stand", expr: "stern", look: 0.35, phase: 0 },
  ];
  if (id === 4) return [
    { x: 3.6, z: 6.6, rot: -1.5, pose: "aim", expr: "shock", look: 0.5, phase: 0 },
    { x: 4.3, z: 6.9, rot: -1.4, pose: "kneel", expr: "shock", look: 0.6, phase: 0 },
  ];
  if (id === 5) return [
    { x: A.crate[0] - 0.7, z: A.crate[1] + 0.5, rot: 2.4, pose: "stand", expr: "relief", look: 0.1, phase: 0 },
    { x: A.board[0] + 0.7, z: A.board[1] + 0.4, rot: 2.8, pose: "stand", expr: "neutral", look: -0.3, phase: 0 },
  ];
  if (id === 8) return Array.from({ length: 5 }, (_, i) => ({
    x: 2.2 + i * 1.15, z: -1.2 - i * 0.15, rot: 2.05, pose: "stand" as const, expr: "stern", look: 0.05, phase: 0,
  }));
  if (id === 9) return [
    { x: A.trackX - 1.2, z: -2.4, rot: 1.2, pose: "stand", expr: "neutral", look: 0.2, phase: 0 },
    { x: 8.9, z: -5.4, rot: 2.9, pose: "stand", expr: "relief", look: -0.1, phase: 0 },
  ];
  return [];
};

/** the farmer: on the verandah in shot 2, at the fence in shot 1 */
export const farmerAt = (id: number, f: number) => {
  const t = f / FPS;
  if (id === 1) return { x: 5.4, z: -2.0, rot: 2.5, visible: true, phase: 0, expr: "nervous" };
  if (id === 2) return { x: 8.9, z: -4.4, rot: 2.9, visible: true, phase: 0, expr: f < 430 ? "nervous" : "relief" };
  if (id === 9) return { x: 8.2, z: -3.2, rot: 2.7, visible: true, phase: 0, expr: "relief" };
  return { x: 5.4, z: -2.0, rot: 2.5, visible: false, phase: (t * 0.5) % 1, expr: "neutral" };
};

/** dust: muzzle blasts, galloping feet, the truck's rooster tail */
export type Puff = { x: number; y: number; z: number; r: number; a: number };
export const dustAt = (id: number, f: number): Puff[] => {
  const out: Puff[] = [];
  if (id === 3) {
    for (let i = 0; i < 8; i++) {
      const t0 = 655 + i * 9;
      const u = (f - t0) / 42;
      if (u <= 0 || u >= 1) continue;
      out.push({ x: A.gun[0] + 0.3 + i * 0.12, y: 0.28, z: A.gun[1] - 0.9 - i * 0.5, r: 0.10 + u * 0.42, a: (1 - u) * 0.5 });
    }
  }
  if (id === 4) {
    for (let i = 0; i < 14; i++) {
      const u = ((f - 900) / 44 + i / 14) % 1;
      out.push({ x: 2.0 + i * 0.5, y: 0.2, z: 2.6 + i * 0.32, r: 0.12 + u * 0.5, a: (1 - u) * 0.42 });
    }
  }
  if (id === 9) {
    for (let i = 0; i < 10; i++) {
      const u = ((f - 1770) / 50 + i / 10) % 1;
      out.push({ x: A.trackX - 0.4 + Math.sin(i) * 0.3, y: 0.22, z: -1.0 + 27 * glide((f - 1770) / 150) - i * 0.9, r: 0.1 + u * 0.45, a: (1 - u) * 0.35 });
    }
  }
  return out;
};

export function dofAt(f: number): { cInf: number; focus?: (f: number) => V3 } {
  const id = shotAt(f).id;
  const cInf = id === 1 ? 3 : id === 3 ? 5 : id === 4 ? 7 : id === 10 ? 4 : 14;
  return { cInf };
}
export const FOREGROUND = false;
