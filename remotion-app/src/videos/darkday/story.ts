// Timeline, physics & camera plan for "The Dark Day" (May 19, 1780).
// Timed directly to shoots/darkday/voice/words.json (58.000 s = 1740 frames @ 30 fps)
// so every visual reaction lands 0-3 frames BEFORE its spoken word.
// Camera grammar follows SKILL.md + motion.md: symmetric smootherstep glides (18-36 f),
// hard cuts on big reframes, continuous push-ins on every hold (zero static frames),
// 3-5 deg rolls on emphasis beats, and sign-flipping impact KICKS on the fire reveal.
//
// The day the sun went out: sooty gloom at noon ("dark"), the blood-red hanging sun
// ("blood"), and the indigo night that finally lifted it ("night").

export const FPS = 30;
export const TOTAL = 1740; // 58.0 s @ 30 fps
export const D0 = 0;       // street ground elevation (m)

export type V3 = [number, number, number];

// World coordinates of the separated sets inside one unified Three.js scene
export const STREET: V3 = [0, 0, 0];       // meeting-house common & main street
export const DESK: V3 = [60, 0, 0];        // Williams' study (Harvard)
export const LAMP: V3 = [120, 0, 0];       // hand-over-a-lamp analogy insert
export const FIRE: V3 = [240, 0, 0];       // the Ontario horizon, two hundred miles away
export const TREE: V3 = [-60, 0, 0];       // 2007 fire-scar evidence (tree cookie)

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

// ---------------- shots ----------------
export type Light = "dark" | "blood" | "night";
export type PlaceId = "street" | "desk" | "lamp" | "fire" | "tree";
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: Light;
  place: PlaceId;
  sunAz?: number;
  sunEl?: number;
};

export const SHOTS: ShotDef[] = [
  // 1. Hook: "On May 19th, 1780, at 10:30 in the morning, the sky went [f84-96] dark." (f0-152)
  { id: 1, a: 0, b: 153, light: "dark", place: "street", sunAz: 75, sunEl: 34 },
  // 2. Setting: "By noon, candles [f349]. Harvard professor Samuel Williams [f153/185]..." (f153-329)
  { id: 2, a: 153, b: 330, light: "dark", place: "desk", sunAz: 55, sunEl: 32 },
  // 3. Panic: "By noon, candles. Roosters [f372] crowed at noon and frogs [f459] began to peep at midnight [f497]." (f330-635)
  { id: 3, a: 330, b: 636, light: "dark", place: "street", sunAz: 75, sunEl: 30 },
  // 4. Cause: "The real cause was a forest fire in Ontario [f656], some two hundred [f692] miles away." (f636-799)
  { id: 4, a: 636, b: 800, light: "dark", place: "fire", sunAz: 28, sunEl: 7 },
  // 5. Luckily: "Luckily [f807], it didn't burn anywhere else. Unluckily [f894], it was the thirteenth [f940] big one..." (f800-974)
  { id: 5, a: 800, b: 975, light: "dark", place: "street", sunAz: 75, sunEl: 33 },
  // 6. Analogy: "Cover a lamp with your hand [f1000]... the room goes dark [f1032]... kind of like an eclipse [f1095]." (f975-1151)
  { id: 6, a: 975, b: 1152, light: "dark", place: "lamp", sunAz: 70, sunEl: 38 },
  // 7. Red sun: "For days before, the sun had already hung red as blood [f1298]..." (f1152-1399)
  { id: 7, a: 1152, b: 1400, light: "blood", place: "street", sunAz: 55, sunEl: 9 },
  // 8. Evidence: "In 2007 [f1410], scientists [f1440] counted [f1456]... fire scars [f1474]" (f1400-1564)
  { id: 8, a: 1400, b: 1565, light: "dark", place: "tree", sunAz: 172, sunEl: 36 },  // evidence room: FRONT light on the scar-ring cap (az 62 left it in shadow)
  // 9. Night: "The darkness finally lifted late that night [f1574/1618]." (f1565-end)
  { id: 9, a: 1565, b: TOTAL, light: "night", place: "street", sunAz: 38, sunEl: 55 },
];

/** Crossfades (frames) at place changes; 4-frame white flash right after the hook ("went dark") */
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8 };
export const FLASH_AT = 98;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story physics per shot & frame ----------------
export type SceneState = {
  wind: number;      // 0..1 gloom wind gust intensity (drives ember/smoke drift & audio sidechain)
  candle: number;    // 0..1 candle-window ignition cascade master (starts f346, before "candles" f349)
  write: number;     // Williams' quill bob, 0..1 amplitude, 0 outside shot 2
  panel: number;     // 0..1 smoked-glass panel coverage over the lamp (shot 6)
  fireGlow: number;  // 0..1 Ontario horizon glow band strength (shot 4)
  emberK: number;    // ember rise-speed multiplier (shot 4)
  redSun: number;    // 0..1 blood-sun sprite intensity (shot 7)
  eclipseK: number;  // 0..1 eclipse bite over the sun (shot 1, peaks on "went dark" f96)
};

export const sceneState = (id: number, f: number): SceneState => {
  const t = f / FPS;
  const z: SceneState = { wind: 0.35, candle: 0, write: 0, panel: 0, fireGlow: 0, emberK: 1, redSun: 0.35, eclipseK: 0 };
  const breathe = 0.5 + 0.5 * Math.sin(t * 0.9);
  switch (id) {
    case 1: { // hook: the bite crosses the sun right on "went dark" (f84-96)
      const bite = smooth((f - 64) / 6) * (1 - 0.35 * smooth((f - 120) / 30));
      return { ...z, eclipseK: 0.35 + 0.65 * bite, wind: 0.4 + 0.2 * breathe };
    }
    case 2: { // Williams writes; the candle is his only light
      const amp = smooth((f - 160) / 26); // arm settles in right after the cut
      return { ...z, write: amp * (0.72 + 0.28 * Math.sin(t * 6.8)), wind: 0.18 };
    }
    case 3: { // "candles" f349: window cascade + stall lanterns ignite 3 frames early
      const candle = smooth((f - 346) / 46);
      const gustRooster = smooth((f - 366) / 22) * (1 - smooth((f - 430) / 40));   // "Roosters" f372
      const gustMidnight = smooth((f - 488) / 22) * (1 - smooth((f - 540) / 40));  // "midnight" f497
      return { ...z, candle, wind: 0.42 + 0.34 * gustRooster + 0.3 * gustMidnight };
    }
    case 4: { // "forest fire in Ontario" f656: glow swells as the words land
      const glow = 0.22 + 0.78 * smooth((f - 636) / 52);
      return { ...z, fireGlow: glow, emberK: 1 + 0.9 * smooth((f - 648) / 40), wind: 0.62 + 0.3 * breathe };
    }
    case 5: // aftermath street — the hush: folks point, wind drops
      return { ...z, wind: 0.26 + 0.12 * breathe, candle: 1 };
    case 6: { // "Cover a lamp with your hand" f1000-ish: panel slides down, dims, lifts on f1102
      const down = smooth((f - 998) / 17);        // starts f998 ("lamp" f988 just spoke)
      const up = smooth((f - 1102) / 21);         // retracts on the second "lamp" f1089-1097
      return { ...z, panel: clamp01(down * (1 - up)), wind: 0.14 };
    }
    case 7: { // "red as blood" f1298: the sun swells into a blood disc
      const red = 0.55 + 0.45 * smooth((f - 1290) / 24);
      return { ...z, redSun: red, wind: 0.55 + 0.18 * breathe, candle: 1 };
    }
    case 8:  // the tree-ring cross-section: quiet evidence room
      return { ...z, wind: 0.18 };
    case 9:  // night after the eclipse: star pinpoints, red moon, candle windows
      return { ...z, wind: 0.22 + 0.1 * breathe, candle: 1 };
    default:
      return z;
  }
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;

/** Push-in factor since f0: subject grows ~rate per frame; `punch` boosts rate on punch words so NO frame is ever static */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 32) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) {
    for (let i = 0; i < Math.min(x, n); i++) {
      s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
    }
  }
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => ({
  pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k],
  look,
  ...rest,
});
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot => ({
  pos,
  look,
  fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k),
  ...rest,
});
const addV = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// Shot 1 (Hook): common-side wide of the sooty street; pushes before "went dark" (f84-96)
const S1a = (f: number) => dolly([0.5, 2.35, 15.5], [0, 2.35, -14], pushK(f, 0, 0.0011, 0.0055, 30), { fov: 46 });
const S1b = (f: number) => dolly([0.3, 2.0, 12.6], [0, 2.0, -12], pushK(f, 40, 0.0009), { fov: 43, roll: 0.02 });

// Shot 2 (Harvard study, CU): Williams writing at the desk
const S2a = (f: number) => dolly(addV(DESK, [0.38, 1.78, 3.45]), addV(DESK, [-0.08, 1.08, 0.35]), pushK(f, 153, 0.0008), { fov: 36 });
const S2b = (f: number) => dolly(addV(DESK, [0.3, 1.7, 2.45]), addV(DESK, [-0.08, 1.06, 0.35]), pushK(f, 185, 0.0009, 0.005, 30), { fov: 35, roll: 0.02 });

// Shot 3 (Panic in the common): candles appear down the street; punches on the animal-behaving-oddly words
const S3a = (f: number) => dolly([-1.35, 2.15, 10.5], [0.3, 1.65, -9], pushK(f, 330, 0.0009), { fov: 45 });
const S3b = (f: number) => dolly([-1.15, 1.98, 8.6], [0.2, 1.6, -8], pushK(f, 372, 0.0011, 0.006, 30), { fov: 42, roll: 0.04 });   // "Roosters"
const S3c = (f: number) => dolly([-0.6, 2.2, 7.6], [0.1, 2.0, -12], pushK(f, 497, 0.0011, 0.0055, 30), { fov: 40, roll: -0.03 }); // "midnight"

// Shot 4 (Ontario fire, tele): ridge glow grows; kick on "Ontario" (f656)
const S4a = (f: number) => dolly(addV(FIRE, [0, 3.3, 30]), addV(FIRE, [0, 7.5, -80]), pushK(f, 636, 0.0014, 0.006, 30), { fov: 31 });
const S4b = (f: number) => dolly(addV(FIRE, [0.6, 3.0, 24]), addV(FIRE, [0, 7.2, -80]), pushK(f, 692, 0.0016, 0.0055, 28), { fov: 29, roll: -0.035 }); // "hundred"

// Shot 5 (Aftermath): gentle push on the pointers; kick-roll on "Luckily"
const S5a = (f: number) => dolly([1.9, 2.0, 8.2], [-0.4, 1.75, 0.5], pushK(f, 800, 0.001), { fov: 45 });
const S5b = (f: number) => dolly([1.7, 1.9, 6.8], [-0.5, 1.8, -0.5], pushK(f, 807, 0.0011, 0.005, 28), { fov: 43, roll: 0.035 }); // "Luckily"

// Shot 6 (Lamp insert): the smoked-glass panel slides down over the flame
const S6a = (f: number) => dolly(addV(LAMP, [0.4, 1.74, 3.2]), addV(LAMP, [0, 1.3, 0]), pushK(f, 975, 0.0012, 0.006, 28), { fov: 34 }); // punch on first "lamp" f988
const S6b = (f: number) => dolly(addV(LAMP, [0.28, 1.66, 2.35]), addV(LAMP, [0, 1.32, 0]), pushK(f, 1089, 0.0013, 0.006, 28), { fov: 32, roll: -0.025 }); // second "lamp" f1089

// Shot 7 (Blood sun): near-silhouette of the steeple against the hanging red sun
const S7a = (f: number) => dolly([-0.75, 2.5, 13.5], [0.2, 5.4, -27], pushK(f, 1152, 0.0007), { fov: 42 });
const S7b = (f: number) => dolly([-0.5, 2.3, 11.5], [0.2, 5.6, -27], pushK(f, 1298, 0.0009, 0.006, 30), { fov: 40, roll: -0.04 }); // "red as blood" f1298

// Shot 8 (Tree cookie): 2007 fire-scar cross-section evidence
const S8a = (f: number) => dolly(addV(TREE, [2.15, 2.0, 3.7]), addV(TREE, [-0.35, 1.32, 0.05]), pushK(f, 1400, 0.0009), { fov: 36 });
const S8b = (f: number) => dolly(addV(TREE, [1.5, 1.78, 2.6]), addV(TREE, [-0.28, 1.3, 0.05]), pushK(f, 1440, 0.0011, 0.0055, 28), { fov: 33, roll: 0.025 }); // "scientists" f1440

// Shot 9 (Night): the red moon hangs by the steeple; the candle town breathes out
const S9a = (f: number) => dolly([0.5, 2.3, 14.0], [0, 4.6, -27], pushK(f, 1565, 0.0008), { fov: 44 });
const S9b = (f: number) => dolly([0.4, 2.15, 11.8], [0, 4.9, -27], pushK(f, 1618, 0.0009), { fov: 42, roll: 0.02 }); // "night." f1618

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 40, dur: 28, s: S1b }],
  2: [{ f: 153, s: S2a }, { f: 185, dur: 30, s: S2b }],
  3: [{ f: 330, s: S3a }, { f: 372, dur: 24, s: S3b }, { f: 497, dur: 26, s: S3c }],
  4: [{ f: 636, s: S4a }, { f: 692, dur: 24, s: S4b }],
  5: [{ f: 800, s: S5a }, { f: 807, dur: 26, s: S5b }],
  6: [{ f: 975, s: S6a }, { f: 1089, dur: 24, s: S6b }],
  7: [{ f: 1152, s: S7a }, { f: 1298, dur: 30, s: S7b }],
  8: [{ f: 1400, s: S8a }, { f: 1440, dur: 26, s: S8b }],
  9: [{ f: 1565, s: S9a }, { f: 1618, dur: 30, s: S9b }],
};

// Impact kicks: sign-flipping 7-frame decay shakes on physical impacts (SKILL.md §camera)
export const KICKS: [number, number][] = [
  [653 / FPS, 1.15], // "Ontario" lands (f656 minus 3)
  [693 / FPS, 0.6],  // "hundred" miles (f692)
  [1090 / FPS, 0.5], // second "lamp", the eclipse beat (f1089)
  [1298 / FPS, 0.55],// "red as blood" (f1298)
];

export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id] ?? CAMS[1], f);
  const a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
};

// ---------------- lens: depth of field + foreground framing ----------------
// DOF on ~1/3 of screen time (CUs, MS, inserts; cInf 9-14 px at 1080p, focused on eyes / subject); wides stay 0 (sharp).
// Shots 2, 3(MS), 5, 6, 8 carry DOF.
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 153, dur: 26, cInf: 13, focus: () => addV(DESK, [-0.08, 1.13, 0.35]) },       // Williams' face over the candle
  { f: 330, cInf: 0 },
  { f: 340, dur: 20, cInf: 11, focus: () => [-0.9, 1.62, 4.6] },                    // rooster/shock man MS
  { f: 470, dur: 20, cInf: 0 },                                                     // widen to sharp panic street
  { f: 800, dur: 22, cInf: 11, focus: () => [-0.5, 1.75, 3.4] },                    // pointing man MS
  { f: 900, dur: 18, cInf: 0 },
  { f: 975, dur: 18, cInf: 12, focus: () => addV(LAMP, [0, 1.42, 0]) },             // the lamp under the hand
  { f: 1152, cInf: 0 },
  { f: 1400, dur: 22, cInf: 12, focus: () => addV(TREE, [-0.3, 1.35, 0.05]) },      // the scar ring
  { f: 1565, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0;
  while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? clamp01((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** Near framing props (>2.4 m from lens, bottom frame corners only, never crossing faces; ~1/3 of shots) */
export type FgKind = "fence" | "wellc" | "sawhorse";
export type Fg = { a: number; b: number; kind: FgKind; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  // Shot 1 hook: picket fence bottom-right, framing the gloomy common
  { a: 0, b: 153, kind: "fence", pos: [4.6, 0, 9.6], s: 1.35, yaw: 0.42 },
  // Shot 3: same fence, bottom-right — panic happens past it
  { a: 330, b: 636, kind: "fence", pos: [4.6, 0, 9.6], s: 1.35, yaw: 0.42 },
  // Shot 5: the meeting-house well curb, bottom-left
  { a: 800, b: 975, kind: "wellc", pos: [-3.1, 0, 5.6], s: 1.1, yaw: 0.25 },
  // Shot 8: sawhorse legs bottom-left, cookie sits dead-centre over it
  { a: 1400, b: 1565, kind: "sawhorse", pos: addV(TREE, [-1.55, 0, 2.15]), s: 1.15, yaw: -0.18 },
  // Shot 9: fence again, night — the town asleep behind it
  { a: 1565, b: TOTAL, kind: "fence", pos: [4.6, 0, 9.6], s: 1.35, yaw: 0.42 },
];
