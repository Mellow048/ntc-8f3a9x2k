// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export type LookName = "day" | "golden" | "dark" | "blood" | "night";
export const LIGHTS: Record<LookName, LightPreset> = {
  // Sooty pseudo-noon (the eclipse): a dull pewter lid where noon looks like dusk, candle warmth as the only colour.
  dark: {
    az: 78, el: 38,
    lit: [1.02, 1.0, 0.94], shade: [0.2, 0.21, 0.27], lift: [0.03, 0.035, 0.055], lambert: 0.3, sideK: 0.82, term: 0.17,
    charTint: [0.94, 0.95, 1.0], charShade: 0.8, charGrad: 0.09, bodyGrad: 0.22, sideTint: [0.74, 0.79, 0.95],
    blob: [0.3, 0.3, 0.36], actorShadow: true,
    top: "#1c2027", hor: "#3f4449", skyCurve: [0.0, 0.4, 0.55], fog: "#3d4148", fogNear: 13, fogFar: 145, sunDisc: "#000000",
    sunCol: "#e9e6da", sunI: 1.15, sky: "#77808e", ground: "#3b3733", hemiI: 0.42,
    bias: -0.00025, normalBias: 0.015,
  },
  // Blood-red hanging sun through the smoke deck ("the sun had already hung red as blood").
  blood: {
    az: 82, el: 14,
    lit: [1.28, 0.78, 0.5], shade: [0.2, 0.14, 0.17], lift: [0.035, 0.025, 0.045], lambert: 0.3, sideK: 0.8, term: 0.12,
    charTint: [1.0, 0.84, 0.72], charShade: 0.8, charGrad: 0.1, bodyGrad: 0.24, sideTint: [0.85, 0.62, 0.6],
    blob: [0.28, 0.16, 0.15], actorShadow: true,
    top: "#241109", hor: "#572a1c", skyCurve: [0.0, 0.35, 0.5], fog: "#45231b", fogNear: 10, fogFar: 120, sunDisc: "#ff5a2a",
    sunCol: "#ff8a4a", sunI: 1.5, sky: "#8a5040", ground: "#2e201a", hemiI: 0.36,
    bias: -0.0004, normalBias: 0.02,
  },
  // Deep indigo night when the darkness finally lifted (red moon).
  night: {
    az: 38, el: 42,
    lit: [0.52, 0.64, 0.98], shade: [0.07, 0.09, 0.17], lift: [0.015, 0.022, 0.05], lambert: 0.28, sideK: 0.8, term: 0.1,
    charTint: [0.8, 0.88, 1.08], charShade: 0.72, charGrad: 0.11, bodyGrad: 0.26, sideTint: [0.5, 0.58, 0.88],
    blob: [0.08, 0.1, 0.18], actorShadow: true,
    top: "#05070f", hor: "#18202e", skyCurve: [0.0, 0.3, 0.45], fog: "#10161f", fogNear: 10, fogFar: 130, sunDisc: "#000000",
    sunCol: "#b9d2f2", sunI: 0.55, sky: "#46536e", ground: "#12151d", hemiI: 0.32,
    bias: -0.0003, normalBias: 0.02,
  },
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LookName, WorldLook> = {
  dark: {
    sky: { c: ["#3c4149", "#333842", "#282d36", "#1e232c", "#151a22"], e: [0, 3, 8, 16, 40] },
    water: { near: "#20262e", mid: "#1a2028", far: "#141a24", crest: "#5a6068", trough: "#0e141c", glint: "#8a8e96", shade: [0.42, 0.44, 0.52] },
    cloud: { lit: "#565b64", mid: "#3a3f47", shade: "#23272e" },
    bounce: [0, 0, 0],
    sat: 0.78,
  },
  blood: {
    sky: { c: ["#552b1d", "#42241a", "#301a14", "#221210", "#170c0d"], e: [0, 4, 10, 20, 40] },
    water: { near: "#33201a", mid: "#2a1a18", far: "#221418", crest: "#7a4634", trough: "#1a1010", glint: "#b98a76", shade: [0.42, 0.32, 0.32] },
    cloud: { lit: "#6e4030", mid: "#482a20", shade: "#2a1812" },
    bounce: [0.02, 0.008, 0.0],
    sat: 0.95,
  },
  night: {
    sky: { c: ["#141b28", "#101624", "#0b101c", "#070b14", "#04070f"], e: [0, 4, 10, 20, 40] },
    water: { near: "#101828", mid: "#0d1420", far: "#0a101c", crest: "#3a4a62", trough: "#060a12", glint: "#aebfd8", shade: [0.4, 0.46, 0.58] },
    cloud: { lit: "#232c40", mid: "#161d2c", shade: "#0b101c" },
    bounce: [0, 0, 0],
    sat: 0.68,
  },
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
};
