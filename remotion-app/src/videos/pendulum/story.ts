// Timeline, physics & camera plan for "The Giant Golden Ball Inside Taipei 101".
// Timed directly to shoots/pendulum/voice/words.json (65.500 s = 1965 frames @ 30 fps)
// so every visual reaction lands 0-3 frames BEFORE its spoken word.
// Camera grammar follows SKILL.md + motion.md: symmetric smootherstep glides (18-36 f),
// hard cuts on big reframes, continuous push-ins on every hold (zero static frames),
// 4-4.6 deg rolls on emphasis beats, and 7-frame sign-flipping impact KICKS.

export const FPS = 30;
export const TOTAL = 1965; // 65.500 s @ 30 fps
export const D0 = 0;       // plaza ground elevation (m)

export type V3 = [number, number, number];

// World coordinates of our separated sets inside one unified Three.js scene
export const ATRIUM: V3 = [0, 140, 0];     // 88th-92nd floor observatory & golden sphere
export const OFFICE: V3 = [90, 140, 0];    // 90th floor panoramic office
export const BOAT: V3 = [-95, 0, -40];     // golden-hour harbour rowboat analogy
export const CLOSET: V3 = [180, 140, 0];   // cramped grey mechanical room

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type PlaceId = "atrium" | "city" | "office" | "boat" | "closet";
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
  // 1. Hook: "Near the top of this skyscraper hangs a golden metal ball heavier than a fully loaded jumbo jet." (f2-136)
  { id: 1, a: 0, b: 142, light: "day", place: "atrium", sunAz: 68, sunEl: 42 },
  // 2. Setting: "This is Taipei 101, half a kilometer of glass and steel built right in the middle of typhoon alley." (f148-286)
  { id: 2, a: 142, b: 289, light: "day", place: "city", sunAz: 115, sunEl: 48 },
  // 3. Flex: "Tall towers are built to bend in the wind so they don't snap in half." (f291-386)
  { id: 3, a: 289, b: 390, light: "day", place: "city", sunAz: 85, sunEl: 46 },
  // 4. Sway wide: "The problem is, ninety floors up, a strong breeze makes the whole building sway like a boat." (f392-540)
  { id: 4, a: 390, b: 546, light: "day", place: "office", sunAz: 72, sunEl: 44 },
  // 5. Office details: "Lamps swing, coffee slides off desks, and office workers get seasick just sitting in their chairs." (f551-689)
  { id: 5, a: 546, b: 694, light: "day", place: "office", sunAz: 72, sunEl: 44 },
  // 6. Damper reveal: "So between the eighty-seventh and ninety-second floors, engineers hung six hundred and sixty tons of steel on eight thick cables." (f697-897)
  { id: 6, a: 694, b: 912, light: "day", place: "atrium", sunAz: 75, sunEl: 45 },
  // 7. Analogy: "You see, picture standing in a small rowboat when a wave tips the deck left. You lean hard to the right to keep your balance." (f918-1098)
  { id: 7, a: 912, b: 1102, light: "golden", place: "boat", sunAz: -28, sunEl: 12 },
  // 8. Mechanism: "When a gust shoves the tower one way, that heavy sphere swings the other way into giant hydraulic bumpers, cutting the sway nearly in half." (f1106-1289)
  { id: 8, a: 1102, b: 1291, light: "day", place: "atrium", sunAz: 70, sunEl: 44 },
  // 9. Typhoon exterior: "In twenty fifteen, a massive typhoon slammed Taipei with hundred-mile-an-hour winds..." (f1293-1424)
  { id: 9, a: 1291, b: 1426, light: "day", place: "city", sunAz: 95, sunEl: 34 },
  // 10. Record 1m swing: "...and swung the ball a full meter off center." (f1431-1484)
  { id: 10, a: 1426, b: 1487, light: "day", place: "atrium", sunAz: 65, sunEl: 40 },
  // 11. Luckily: "Luckily, the building stayed completely fine." (f1490-1554)
  { id: 11, a: 1487, b: 1557, light: "day", place: "city", sunAz: 118, sunEl: 48 },
  // 12. Unluckily: "Unluckily for anyone scared of heights, there is a public viewing deck right beside it." (f1560-1670)
  { id: 12, a: 1557, b: 1680, light: "day", place: "atrium", sunAz: 74, sunEl: 44 },
  // 13. Dark closet: "Most skyscrapers hide their dampers in a dark closet so nobody panics." (f1688-1775)
  { id: 13, a: 1680, b: 1778, light: "day", place: "closet", sunAz: 80, sunEl: 38 },
  // 14. Golden twist + mascot: "Taipei painted theirs gold, sold tickets, and even gave the giant steel ball its own cute cartoon mascot." (f1780-1932)
  { id: 14, a: 1778, b: TOTAL, light: "golden", place: "atrium", sunAz: 8, sunEl: 9 },
];

/** Crossfades (frames) at major place/time shifts; 4-frame white flash right after the hook ("jumbo jet.") */
export const XFADE: Record<number, number> = { 7: 8, 8: 8, 14: 8 };
export const FLASH_AT = 138;

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
  towerBend: number;    // upper tower flex angle in radians (+ = screen right / +x)
  damperX: number;      // sphere horizontal offset in metres (-1.1 .. +1.1)
  officeRoll: number;   // 90th-floor room sway roll in radians
  lampAngle: number;    // ceiling pendant lamp swing in radians
  mugSlide: number;     // 0..1 coffee mug slide across desk
  mugTip: number;       // 0..1 mug tipping at desk edge
  boatRoll: number;     // rowboat hull roll in radians (- = tips left)
  boatBob: number;      // rowboat vertical heave (m)
  guyLean: number;      // guy torso counter-lean in degrees (+ = leans right)
  wind: number;         // 0..1 wind gust intensity
};

export const sceneState = (id: number, f: number): SceneState => {
  const t = f / FPS;
  const z: SceneState = {
    towerBend: 0, damperX: 0, officeRoll: 0, lampAngle: 0,
    mugSlide: 0, mugTip: 0, boatRoll: 0, boatBob: 0, guyLean: 0, wind: 0,
  };
  switch (id) {
    case 1: // Hook: subtle majestic slow pendulum breath
      return { ...z, damperX: 0.22 * Math.sin(t * 1.45) };
    case 2: // Setting: proud steady tower
      return { ...z, towerBend: 0.004 * Math.sin(t * 0.9) };
    case 3: { // "built to bend [f320] in the wind [f334] so they don't snap"
      const env = smooth((f - 317) / 22); // starts 3f before "bend" (f320)
      return { ...z, towerBend: env * 0.058 * Math.sin((f - 317) * 0.11), wind: 0.35 + 0.55 * env };
    }
    case 4: { // "a strong breeze [f463] makes the whole building sway [f513] like a boat"
      const env = 0.2 + 0.8 * smooth((f - 460) / 28); // ramps 3f before "strong breeze"
      return {
        ...z,
        officeRoll: env * 0.055 * Math.sin((f - 390) * 0.095),
        lampAngle: env * 0.34 * Math.sin((f - 390) * 0.095 - 0.5),
        wind: 0.5 * env,
      };
    }
    case 5: { // "Lamps swing [f551], coffee slides [f588] off desks [f601], and office workers get seasick [f644]"
      const sl = smooth((f - 585) / 15); // starts f585 (3f before "slides" f588)
      const tip = smooth((f - 599) / 8); // tips f599 (2f before "desks" f601)
      return {
        ...z,
        officeRoll: 0.05 * Math.sin((f - 546) * 0.11),
        lampAngle: 0.42 * Math.sin((f - 546) * 0.14),
        mugSlide: sl,
        mugTip: tip,
        wind: 0.55,
      };
    }
    case 6: // Engineers reveal the 660-ton sphere: calm slow swing
      return { ...z, damperX: 0.16 * Math.sin(t * 1.2) };
    case 7: { // "when a wave [f991] tips [f1002] the deck left [f1021]. You lean hard [f1042] to the right [f1066] to keep your balance [f1085]"
      const waveIn = smooth((f - 989) / 24);        // starts f989 (2f before "wave" f991)
      const rightBack = smooth((f - 1039) / 28);    // counter-lean starts f1039 (3f before "lean" f1042)
      const settle = smooth((f - 1078) / 20);
      const boatRoll = -0.24 * waveIn * (1 - 0.78 * rightBack) + 0.025 * Math.sin(t * 2.6) * (1 - 0.5 * settle);
      const guyLean = 25 * rightBack * (1 - 0.32 * settle);
      return { ...z, boatRoll, boatBob: 0.06 * Math.sin(t * 2.8) + 0.08 * waveIn * (1 - rightBack), guyLean };
    }
    case 8: { // "gust [f1110] shoves [f1121] tower one way ... sphere swings [f1179] other way into hydraulic bumpers [f1228], cutting sway [f1261]"
      const shove = smooth((f - 1118) / 22) * (1 - 0.65 * smooth((f - 1248) / 30)); // 3f before "shoves"
      const counter = smooth((f - 1176) / 36); // 3f before "swings" (f1179), peaks into bumpers at f1225
      const damp = 1 - 0.45 * smooth((f - 1255) / 25);
      return {
        ...z,
        towerBend: 0.042 * shove * damp,
        damperX: (0.18 * shove - 0.88 * counter) * damp,
        wind: 0.7 * shove,
      };
    }
    case 9: { // "In twenty fifteen, a massive typhoon [f1342] slammed [f1358] Taipei with hundred-mile-an-hour winds"
      const slam = smooth((f - 1355) / 14); // 3f before "slammed" (f1358)
      return {
        ...z,
        towerBend: (0.02 + 0.055 * slam) * Math.sin((f - 1291) * 0.16),
        wind: 0.45 + 0.55 * slam,
      };
    }
    case 10: { // "...and swung [f1434] the ball a full meter [f1463] off center."
      const u = smooth((f - 1431) / 30); // starts f1431 (3f before "swung"), hits full 1.05m peak at f1461 (2f before "meter"!)
      return {
        ...z,
        damperX: -0.25 + 1.30 * u - 0.18 * smooth((f - 1468) / 18),
        wind: 0.95,
      };
    }
    case 11: // "Luckily, the building stayed completely fine." -> rock steady!
      return { ...z, towerBend: 0.002 * Math.sin(t * 0.8), wind: 0.05 };
    case 12: // "Unluckily for anyone scared of heights..." -> gentle looming swing right beside deck
      return { ...z, damperX: 0.36 * Math.sin((f - 1557) * 0.065) };
    case 13: // Dark closet -> lifeless static grey block
      return z;
    default: // Shot 14: Golden sunset observatory + happy mascot
      return { ...z, damperX: 0.18 * Math.sin(t * 1.1) };
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

// Shot 1 (Atrium hook): low angle past visitor -> tilts up onto the massive golden sphere ("golden metal ball heavier...")
const S1a = (f: number) => dolly(addV(ATRIUM, [1.8, 1.55, -7.8]), addV(ATRIUM, [0, 3.3, -0.5]), pushK(f, 0, 0.0026), { fov: 42 });
const S1b = (f: number) => dolly(addV(ATRIUM, [-0.9, 2.25, -6.4]), addV(ATRIUM, [0, 4.15, 0]), pushK(f, 48, 0.0028, 0.006, 34), { fov: 38, roll: 0.038 });

// Shot 2 (City wide): plaza & strolling crowd -> tilts up the 8 bamboo tiers of Taipei 101
const S2a = (f: number) => zoom([22, 7.5, -58], [0, 26, 0], 46, pushK(f, 142, 0.0022));
const S2b = (f: number) => zoom([15, 12, -48], [0, 48, 0], 44, pushK(f, 192, 0.0022, 0.0055, 32), { roll: -0.03 });

// Shot 3 (Upper tower flex in wind): crisp medium-wide of upper pagoda tiers & spire
const S3a = (f: number) => dolly([18, 62, -34], [0, 68, 0], pushK(f, 289, 0.0025), { fov: 40 });
const S3b = (f: number) => dolly([13, 66, -27], [0.8, 72, 0], pushK(f, 326, 0.0028, 0.0055, 28), { fov: 37, roll: 0.04 });

// Shot 4 (90F Office wide): panoramic office swaying like a boat
const S4a = (f: number) => dolly(addV(OFFICE, [0.4, 1.85, -4.6]), addV(OFFICE, [0, 1.65, 1.2]), pushK(f, 390, 0.0024), { fov: 44 });
const S4b = (f: number) => dolly(addV(OFFICE, [-0.6, 1.75, -3.7]), addV(OFFICE, [0, 1.6, 0.8]), pushK(f, 460, 0.0026, 0.0055, 30), { fov: 40, roll: -0.042 });

// Shot 5 (Office CU): swinging lamps + sliding coffee mug -> cut to seasick worker CU ("seasick")
const S5a = (f: number) => dolly(addV(OFFICE, [-2.5, 1.45, -2.55]), addV(OFFICE, [-1.55, 1.15, -0.35]), pushK(f, 546, 0.0028), { fov: 36, roll: 0.035 });
const S5b = (f: number) => dolly(addV(OFFICE, [1.55, 1.58, -1.95]), addV(OFFICE, [1.4, 1.52, 0.55]), pushK(f, 618, 0.0026, 0.006, 30), { fov: 34, roll: -0.04 });

// Shot 6 (Atrium vertical reveal): high cable mounts -> glides down 8 thick cables to the sphere & engineers
const S6a = (f: number) => dolly(addV(ATRIUM, [2.6, 7.6, -6.8]), addV(ATRIUM, [0, 6.8, 0]), pushK(f, 694, 0.0022), { fov: 44 });
const S6b = (f: number) => dolly(addV(ATRIUM, [2.2, 3.1, -7.2]), addV(ATRIUM, [0, 4.0, 0]), pushK(f, 756, 0.0024, 0.006, 34), { fov: 40 });
const S6c = (f: number) => dolly(addV(ATRIUM, [-1.8, 2.0, -6.2]), addV(ATRIUM, [-0.6, 2.3, -1.2]), pushK(f, 835, 0.0026), { fov: 37 });

// Shot 7 (Golden harbour rowboat analogy): wave tips deck left -> hero leans hard right to balance
const S7a = (f: number) => dolly(addV(BOAT, [1.2, 1.75, -6.6]), addV(BOAT, [0, 1.25, 0]), pushK(f, 908, 0.0022), { fov: 40 });
const S7b = (f: number) => dolly(addV(BOAT, [-0.9, 1.55, -5.3]), addV(BOAT, [0.1, 1.35, 0]), pushK(f, 988, 0.0026, 0.0055, 30), { fov: 37, roll: -0.04 });
const S7c = (f: number) => dolly(addV(BOAT, [0.6, 1.6, -4.9]), addV(BOAT, [0.15, 1.4, 0]), pushK(f, 1038, 0.0025, 0.0055, 28), { fov: 36, roll: 0.038 });

// Shot 8 (Counter-sway mechanism + hydraulic bumpers): wide sphere swing -> tight insert on hydraulic pistons
const S8a = (f: number) => dolly(addV(ATRIUM, [0.4, 3.2, -8.2]), addV(ATRIUM, [0, 3.7, 0]), pushK(f, 1098, 0.0024), { fov: 44 });
const S8b = (f: number) => dolly(addV(ATRIUM, [-2.4, 1.75, -4.8]), addV(ATRIUM, [-1.1, 1.45, -0.4]), pushK(f, 1204, 0.0028, 0.006, 30), { fov: 36, roll: 0.035 });

// Shot 9 (2015 Typhoon Soudelor exterior): dramatic low angle on tower lashed by 100-mph wind
const S9a = (f: number) => zoom([-19, 14, -44], [0, 52, 0], 45, pushK(f, 1291, 0.0025), { roll: -0.04 });
const S9b = (f: number) => zoom([-14, 24, -36], [1.2, 62, 0], 41, pushK(f, 1354, 0.003, 0.0065, 30), { roll: 0.05 });

// Shot 10 (Full 1-meter swing inside atrium): tight dramatic angle as sphere heaves 1m off-center
const S10a = (f: number) => dolly(addV(ATRIUM, [-1.6, 2.35, -6.1]), addV(ATRIUM, [0.55, 3.95, 0]), pushK(f, 1426, 0.003, 0.0065, 30), { fov: 40, roll: -0.045 });

// Shot 11 ("Luckily, the building stayed completely fine"): bright serene wide of tower & peaceful plaza
const S11a = (f: number) => zoom([18, 9.5, -52], [0, 36, 0], 44, pushK(f, 1487, 0.0024));

// Shot 12 ("Unluckily for anyone scared of heights..."): nervous visitor gripping deck rail beside massive sphere
const S12a = (f: number) => dolly(addV(ATRIUM, [1.45, 1.72, -6.6]), addV(ATRIUM, [0.85, 1.62, -4.1]), pushK(f, 1557, 0.0026), { fov: 35 });
const S12b = (f: number) => dolly(addV(ATRIUM, [2.3, 2.05, -7.9]), addV(ATRIUM, [0.35, 2.85, -1.5]), pushK(f, 1618, 0.0026, 0.0055, 28), { fov: 42, roll: 0.04 });

// Shot 13 ("Most skyscrapers hide their dampers in a dark closet..."): lonely grey block behind steel bars
const S13a = (f: number) => dolly(addV(CLOSET, [0.6, 1.75, -3.2]), addV(CLOSET, [0, 1.85, 1.2]), pushK(f, 1680, 0.0025), { fov: 40 });

// Shot 14 ("Taipei painted theirs gold, sold tickets, and even gave ... cute cartoon mascot"): golden sunset gallery!
const S14a = (f: number) => dolly(addV(ATRIUM, [-2.2, 2.4, -8.1]), addV(ATRIUM, [0, 3.6, 0]), pushK(f, 1774, 0.0024), { fov: 44 });
const S14b = (f: number) => dolly(addV(ATRIUM, [1.9, 1.55, -6.9]), addV(ATRIUM, [2.35, 1.32, -4.3]), pushK(f, 1852, 0.0025, 0.006, 32), { fov: 36, roll: -0.03 });
const S14c = (f: number) => dolly(addV(ATRIUM, [0.6, 2.15, -8.3]), addV(ATRIUM, [0.8, 2.65, -1.8]), pushK(f, 1916, 0.0022), { fov: 43 });

export const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 48, dur: 28, s: S1b }, // glides onto "golden metal ball" (f52-82)
  ],
  2: [
    { f: 142, s: S2a },
    { f: 192, dur: 32, s: S2b }, // tilts up on "half a kilometer of glass and steel"
  ],
  3: [
    { f: 289, s: S3a },
    { f: 326, dur: 24, s: S3b }, // pushes in as wind bends upper tiers
  ],
  4: [
    { f: 390, s: S4a },
    { f: 460, dur: 26, s: S4b }, // glides + rolls on "strong breeze makes the whole building sway"
  ],
  5: [
    { f: 546, s: S5a },          // desk + lamps + sliding coffee mug
    { f: 618, cut: true, s: S5b }, // hard cut to seasick worker before "office workers get seasick" (f644)
  ],
  6: [
    { f: 694, s: S6a },
    { f: 756, dur: 34, s: S6b }, // vertical glide down cables onto 660-ton sphere ("engineers hung...")
    { f: 835, dur: 28, s: S6c }, // frames engineers + eight thick cables
  ],
  7: [
    { f: 908, s: S7a },
    { f: 988, dur: 22, s: S7b }, // tilts with wave tipping boat left
    { f: 1038, dur: 22, s: S7c }, // rolls opposite as hero leans hard right
  ],
  8: [
    { f: 1098, s: S8a },
    { f: 1204, cut: true, s: S8b }, // hard cut to hydraulic bumpers right before "giant hydraulic bumpers" (f1217)
  ],
  9: [
    { f: 1291, s: S9a },
    { f: 1354, cut: true, s: S9b }, // hard punch cut 4f before "slammed" (f1358)
  ],
  10: [{ f: 1426, s: S10a }],
  11: [{ f: 1487, s: S11a }],
  12: [
    { f: 1557, s: S12a },
    { f: 1618, dur: 26, s: S12b }, // pulls back on "public viewing deck right beside it"
  ],
  13: [{ f: 1680, s: S13a }],
  14: [
    { f: 1774, s: S14a },
    { f: 1852, dur: 26, s: S14b }, // glides down to cute golden mascot before "cute cartoon mascot" (f1904)
    { f: 1916, dur: 28, s: S14c }, // celebratory pull-back hold creeping to end
  ],
};

// Impact kicks: sign-flipping 7-frame decay shakes on physical impacts (motion.md / SKILL.md)
// [time_seconds, gain]: bumper compression (40.85s / f1226), typhoon slam (45.20s / f1356), 1m peak swing (48.67s / f1460)
export const KICKS: [number, number][] = [
  [1226 / FPS, 0.75],
  [1356 / FPS, 1.35],
  [1460 / FPS, 1.15],
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
// DOF on ~1/3 of screen time (CU, MS, inserts; cInf 9-14 px at 1080p, focused on eyes / subject); wides stay 0 (sharp).
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 13, focus: () => addV(ATRIUM, [0.9, 1.62, -4.4]) },   // Hook visitor eyes -> sphere
  { f: 48, dur: 28, cInf: 10, focus: () => addV(ATRIUM, [0, 4.1, -1.8]) },
  { f: 142, cInf: 0 },                                                // City wide & upper tower flex sharp
  { f: 546, cInf: 12, focus: () => addV(OFFICE, [-1.5, 0.95, -0.45]) }, // Sliding coffee mug insert
  { f: 618, cInf: 14, focus: () => addV(OFFICE, [1.4, 1.55, 0.55]) },   // Seasick office worker eyes
  { f: 694, cInf: 0 },                                                // High atrium shaft sharp
  { f: 835, dur: 28, cInf: 10, focus: () => addV(ATRIUM, [-1.6, 1.62, -4.3]) }, // Engineers MS
  { f: 912, cInf: 9, focus: () => addV(BOAT, [0, 1.65, 0]) },         // Boat analogy hero eyes
  { f: 1102, cInf: 0 },                                               // Atrium mechanism wide sharp
  { f: 1204, cInf: 12, focus: () => addV(ATRIUM, [-1.3, 1.2, -0.8]) }, // Hydraulic piston insert
  { f: 1291, cInf: 0 },                                               // Typhoon exterior sharp
  { f: 1426, cInf: 10, focus: () => addV(ATRIUM, [0.6, 3.9, -1.5]) }, // 1-meter sphere swing
  { f: 1487, cInf: 0 },                                               // Calm tower wide sharp
  { f: 1557, cInf: 14, focus: () => addV(ATRIUM, [0.85, 1.62, -4.2]) }, // Scared visitor CU eyes
  { f: 1618, dur: 26, cInf: 6 },                                      // Pull-back viewing deck
  { f: 1680, cInf: 10, focus: () => addV(CLOSET, [0, 1.85, 1.2]) },   // Dark closet damper
  { f: 1778, cInf: 0 },                                               // Golden sunset wide sharp
  { f: 1852, dur: 26, cInf: 13, focus: () => addV(ATRIUM, [2.35, 1.25, -4.3]) }, // Cute golden mascot MS
  { f: 1916, dur: 28, cInf: 5 },
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
export type FgKind = "shrub" | "planter" | "pilings";
export type Fg = { a: number; b: number; kind: FgKind; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  // Shot 2 plaza bottom-left lush shrub framing Taipei 101
  { a: 142, b: 289, kind: "shrub", pos: [11.2, 0, -49.5], s: 1.35, yaw: 0.4 },
  // Shot 6 engineers MS: warm atrium planter in bottom-left corner
  { a: 835, b: 912, kind: "planter", pos: addV(ATRIUM, [-3.35, 0, -4.1]), s: 0.9, yaw: 0.2 },
  // Shot 7 harbour boat: wooden mooring pilings in bottom-right corner
  { a: 912, b: 1102, kind: "pilings", pos: addV(BOAT, [1.95, -0.3, -3.5]), s: 1.0, yaw: -0.3 },
  // Shot 11 calm tower wide: plaza shrub in bottom-right corner
  { a: 1487, b: 1557, kind: "shrub", pos: [11.8, 0, -44.2], s: 1.25, yaw: 0.8 },
  // Shot 14 golden sunset gallery: decorative planter in bottom-left corner
  { a: 1778, b: 1852, kind: "planter", pos: addV(ATRIUM, [-3.9, 0, -5.3]), s: 0.95, yaw: 0.5 },
];
