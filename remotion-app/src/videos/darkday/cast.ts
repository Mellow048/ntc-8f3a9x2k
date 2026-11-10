// Flat 2D cartoon cast + FX sprites for "The Dark Day" (May 19, 1780), painted into our 3D world.
// Uses the skill's Canvas2D Pen (toon.ts), the canvas pool, the cardShade() scene-lit billboard
// shader and multiply ground contact shadows, all on the NOINK layer.
//
// The cast of a small 1780 New England town watching the sky go out at 10:30 in the morning:
// Williams (white wig, scribbling), meeting-house colonials (tophats & bonnets), a candle-seller,
// and in 2007 a scientist squinting at a tree ring.

import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, townsfolk, KID,
  fxSplash, fxStars, fxPuff, fxContact, fxWind, fxFlame,
  INK, SKINS,
  type Outfit, type Expr,
} from "./toon";
import {
  FPS, STREET, DESK, LAMP, TREE, SHOTS, sceneState, clamp01, type V3,
} from "./story";
import { LIGHTS, type LookName } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r); else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();
export const SU = 0.00216; // 1000 design units = 2.16 m
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();
const CARD = new THREE.PlaneGeometry(1, 1);

export class Actor {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  dmat: THREE.MeshDepthMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() {
    const t = this.r?.tex;
    if (t) { this.mat.map = t; this.dmat.map = t; }
  }
}

export class Fx {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  soft: THREE.MeshBasicMaterial;
  blob: THREE.MeshBasicMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) {
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.needsUpdate = true;
      }
      this.blob.map = t;
      this.mesh.material = this.blob;
      this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t;
      this.soft.map = t;
      this.mesh.renderOrder = 1.5;
    }
  }
}

export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  mirror?: boolean;
  yaw?: number;
  roll?: number;
  size?: [number, number, number];
};
export type FxPlace = {
  key: string;
  cw: number;
  ch: number;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  flat?: boolean;
  rot?: number;
  soft?: boolean;
};
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3 };
export type StageOut = { places: Place[]; fx: FxPlace[] };

// ---------------- helpers ----------------
const LID = [0.5, 1, 1, 0.5];
/** Deterministic natural blink every ~1.6-2.8 s lasting 4 frames */
const blinkAt = (f: number, idSeed: number, swaps: number[] = []) => {
  for (const sf of swaps) {
    const d = f - sf;
    if (d >= -1 && d <= 2) return LID[d + 1];
  }
  const period = 48 + (idSeed % 5) * 9;
  const k = (f + idSeed * 19) % period;
  return k < 4 ? LID[k] : 0;
};

const tier = (d: number): [number, number, number] =>
  d < 4.0 ? [900, 1500, 1.5] : d < 8.5 ? [600, 1000, 1.0] : d < 22 ? [360, 600, 0.6] : [210, 350, 0.35];

const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = cam.sun.dot(cam.right) * (mirror ? -1 : 1), sy = -cam.sun.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

const blobHex = (lightName: LookName) => {
  const b = LIGHTS[lightName].blob;
  const ch = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0");
  return `#${ch(b[0])}${ch(b[1])}${ch(b[2])}`;
};

const addShadowBlob = (fx: FxPlace[], x: number, y: number, z: number, lightName: LookName, w = 0.85) => {
  const col = blobHex(lightName);
  fx.push({
    key: `|blob|${lightName}`,
    cw: 128,
    ch: 128,
    draw: (p) => fxContact(p, col),
    x,
    y: y + 0.015,
    z,
    w,
    h: w * 0.72,
    flat: true,
  });
};

// ---------------- outfits (all 1780s except the 2007 scientist) ----------------
const FOLK: Outfit[] = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
/** Samuel Williams, Harvard professor: dark coat, cream cravat knot, white full-bottomed wig */
const WILLIAMS: Outfit = {
  jacket: "#38342f", pants: "#2a2724", boots: INK, hat: "hair", hair: "#ece8de",
  belt: "#1d1a17", buttons: "#b8b2a2", build: "adult", skin: SKINS[0],
};
/** 2007 researcher with the increment borer and the cookie in hand */
const SCIENTIST: Outfit = {
  jacket: "#374a5c", pants: "#2b333c", boots: "#1d1a17", hat: "cap", cap: "#26313d",
  belt: "#1a1a1a", buttons: "#77879a", build: "adult", skin: SKINS[2],
};
/** colonial child (the candle-seller's boy) */
const COLONIAL_KID: Outfit = {
  jacket: "#5d4a2e", pants: "#33291d", boots: "#241a12", hat: "hair", hair: "#241a12", build: "kid", skin: SKINS[3],
};

// ================= per-shot cast + FX staging =================
export const stage = (id: number, f: number, cam: CamInfo): StageOut => {
  const places: Place[] = [];
  const fx: FxPlace[] = [];
  const shot = SHOTS[id - 1];
  const L = shot.light as LookName;
  const st = sceneState(id, f);
  const t = f / FPS;

  const pushFront = (
    tag: string, outfit: Outfit, x: number, y: number, z: number,
    opts: {
      expr?: Expr; mode?: "stand" | "stroll" | "sit"; phase?: number; look?: number;
      tilt?: number; wave?: number; seed?: number; scale?: number; roll?: number; swaps?: number[];
      shadow?: boolean; facing?: -1 | 0 | 1;
    } = {},
  ) => {
    const d = Math.hypot(cam.pos.x - x, cam.pos.y - (y + 1.1), cam.pos.z - z);
    const sz = tier(d);
    const seed = opts.seed ?? 1;
    const bl = blinkAt(f, seed, opts.swaps ?? []);
    const l2 = light2D(cam, false);
    const ph = Math.round((opts.phase ?? 0) * 24) / 24;
    const tl = Math.round((opts.tilt ?? 0) * 2) / 2;
    const wv = opts.wave !== undefined ? Math.round(opts.wave * 12) / 12 : undefined;
    const lk = Math.round((opts.look ?? 0) * 10) / 10;
    const mode = opts.mode ?? "stand";
    const expr = opts.expr ?? "neutral";
    places.push({
      key: `F|${tag}|${mode}|${expr}|${ph}|${lk}|${tl}|${wv ?? "n"}|${bl}|${l2.toFixed(2)}`,
      draw: (p) => bodyFront(p, outfit, {
        mode, phase: ph, expr, look: lk, tilt: tl, wave: wv, blink: bl, light: l2, seed, facing: opts.facing ?? 0,
      }),
      x, y, z,
      scale: opts.scale ?? 1,
      roll: opts.roll ?? 0,
      size: sz,
    });
    if (opts.shadow !== false) addShadowBlob(fx, x, y, z, L, 0.85 * (opts.scale ?? 1));
  };

  const pushTorch = (tag: string, x: number, y: number, z: number, size: number, u: number) => {
    const q = Math.round(((u % 1) + 1) % 1 * 12) / 12;
    fx.push({
      key: `torch|${tag}|${q}`,
      cw: 64, ch: 96,
      draw: (p) => fxFlame(p, q),
      x, y, z,
      w: 0.22 * size, h: 0.34 * size,
      soft: true,
    });
  };

  // ---------------- Shot 1: the hook in the common ----------------
  if (id === 1) {
    // the town looks at the dying sun: pointing farmer, two gawking wives, the candle-seller's boy
    pushFront("point1", FOLK[0], 1.7, 0, 2.3, { expr: "shock", wave: 0.62, look: -0.35, seed: 11 });
    pushFront("gawk1", FOLK[1], -1.8, 0, 3.5, { expr: "shock", look: 0.3, seed: 12 });
    pushFront("gawk2", FOLK[3], 0.35, 0, 0.4, { expr: "nervous", look: 0.1, seed: 13 });
    pushFront("gawk3", FOLK[2], -0.75, 0, -4.6, { expr: "shock", look: 0, seed: 14 });
    pushFront("boy1", COLONIAL_KID, 2.75, 0, 3.6, { expr: "shock", wave: 0.4, look: -0.3, seed: 15 });
    // gloom streaks sliding across the common
    const u = t * 0.6;
    for (const [wx, wy, i] of [[-2.5, 3.4, 0], [2.2, 4.6, 1]] as const) {
      const uu = Math.round(((u + i * 0.37) % 1) * 20) / 20;
      fx.push({ key: `wind1|${uu}`, cw: 640, ch: 260, draw: (p) => fxWind(p, uu), x: wx, y: wy, z: -4, w: 9, h: 3.4, soft: true });
    }
  }

  // ---------------- Shot 2: Harvard study — Williams writes ----------------
  if (id === 2) {
    // seated behind the desk; the quill arm scribbles with the scene's write amplitude
    const scribble = 0.2 + 0.4 * clamp01(st.write);
    pushFront("williams", WILLIAMS, DESK[0] - 0.02, DESK[1] + 0.02, DESK[2] + 1.32, {
      mode: "sit",
      expr: f > 227 && f < 248 ? "stern" : "neutral", // "darkness" f236: he frowns at the sentence
      wave: scribble,
      tilt: 5,
      look: 0.08,
      seed: 21,
      shadow: false,
    });
    // candle flame on the desk (small live flame at the candlestick)
    pushTorch("deskcandle", DESK[0] + 0.98, DESK[1] + 1.32, DESK[2] + 0.35, 1.0, t * 2.1);
  }

  // ---------------- Shot 3: candles in every window; noon behaves like midnight ----------------
  if (id === 3) {
    const panic = f >= 349; // "candles" f349: the cascade starts (3 frames early)
    pushFront("rooster1", FOLK[4], -0.9, 0, 4.6, {
      expr: f >= 369 ? "shock" : "nervous", wave: f >= 372 && f < 420 ? 0.62 + 0.18 * Math.sin(t * 9) : undefined,
      look: -0.25, seed: 31, swaps: [372],
    });
    pushFront("candlelady", FOLK[1], 1.35, 0, 2.5, { expr: panic ? "shock" : "nervous", look: 0.32, seed: 32 });
    pushFront("candidate", FOLK[2], -2.5, 0, 1.1, { expr: panic ? "nervous" : "neutral", look: 0.15, seed: 33 });
    pushFront("frogman", FOLK[5], 0.35, 0, -2.4, { expr: f >= 456 ? "shock" : panic ? "nervous" : "neutral", look: -0.1, seed: 34, swaps: [459] });
    pushFront("midnightman", FOLK[0], -1.6, 0, -6.4, { expr: panic ? "shock" : "neutral", look: 0.05, seed: 35 });
    pushFront("boysell", COLONIAL_KID, 2.35, 0, 1.05, { expr: "nervous", look: 0, seed: 36 }); // the candle-seller's boy guards the stall
    pushFront("clutch", FOLK[3], 3.35, 0, -3.2, { expr: panic ? "nervous" : "neutral", look: 0.3, seed: 37 });
    // held candles ignite one by one, front to back, from f346 (3 f before "candles")
    const holders: [number, number, number][] = [
      [1.35, 2.5, 1], [-0.9, 4.6, 0], [-2.5, 1.1, 2], [0.35, -2.4, 3], [3.35, -3.2, 4], [-1.6, -6.4, 5],
    ];
    for (const [hx, hz, i] of holders) {
      const ignite = clamp01((f - (346 + i * 9)) / 10);
      if (ignite > 0.55) pushTorch(`hand${i}`, hx, 1.12, hz + 0.18, 0.9 + 0.12 * Math.sin(t * 3 + i), t * 2.4 + i * 0.37);
    }
    // soot streaks slide through the common
    const u = t * 0.85;
    for (const [wx, wy, i] of [[-3.2, 3.8, 0], [2.6, 2.9, 1], [0, 5.2, 2]] as const) {
      const uu = Math.round(((u + i * 0.41) % 1) * 20) / 20;
      fx.push({ key: `wind3|${uu}`, cw: 640, ch: 260, draw: (p) => fxWind(p, uu), x: wx, y: wy, z: -2 - i * 2, w: 10, h: 3.6, soft: true });
    }
  }

  // ---------------- Shot 4: the cause, two hundred miles away (landscape only) ----------------
  if (id === 4) {
    // nobody. the fire is the actor.
  }

  // ---------------- Shot 5: aftermath — everyone looks up ----------------
  if (id === 5) {
    pushFront("point5", FOLK[4], -0.75, 0, 3.6, {
      expr: "shock", wave: 0.58, look: -0.2, seed: 41,
    }); // the same farmer still points up, arms trembling a little
    pushFront("lady5", FOLK[1], 1.5, 0, 2.3, { expr: "nervous", look: 0.3, seed: 42 });
    pushFront("oldman5", FOLK[2], -2.7, 0, 4.4, { expr: "shock", look: 0, seed: 43 });
    pushFront("kneel5", FOLK[5], 0.75, 0, -1.7, { expr: f >= 891 ? "nervous" : "shock", look: 0.1, seed: 44, swaps: [894] }); // "unluckily" f894
  }

  // ---------------- Shot 6: the lamp insert (no people) ----------------
  if (id === 6) {
    // the lamp flame, big and close
    pushTorch("lampbig", LAMP[0], LAMP[1] + 1.62, LAMP[2], 2.1, t * 2.6);
  }

  // ---------------- Shot 7: the blood-red sun hangs over the common ----------------
  if (id === 7) {
    pushFront("gasp1", FOLK[0], -1.35, 0, 2.6, { expr: "shock", wave: 0.7, look: -0.15, seed: 51 });
    pushFront("gasp2", FOLK[1], 1.15, 0, 3.3, { expr: "shock", look: 0.25, seed: 52 });
    pushFront("gasp3", FOLK[3], -0.35, 0, -1.3, { expr: "shock", wave: 0.66, look: 0.05, seed: 53 });
    pushFront("gasp4", FOLK[2], 2.75, 0, -2.9, { expr: "dazed", look: 0.2, seed: 54 });
    pushFront("boy7", COLONIAL_KID, 1.95, 0, 4.5, { expr: "shock", look: 0.15, seed: 55 });
    // heavy soot streaks under the blood sun
    const u = t * 0.95;
    for (const [wx, wy, i] of [[0, 4.1, 0], [-2.8, 2.6, 1], [3.0, 3.2, 2]] as const) {
      const uu = Math.round(((u + i * 0.43) % 1) * 20) / 20;
      fx.push({ key: `wind7|${uu}`, cw: 640, ch: 260, draw: (p) => fxWind(p, uu), x: wx, y: wy, z: -1 - i * 2.5, w: 11, h: 4.0, soft: true });
    }
  }

  // ---------------- Shot 8: 2007 — the scientist and the scar ring ----------------
  if (id === 8) {
    pushFront("scientist", SCIENTIST, TREE[0] - 1.15, TREE[1], TREE[2] + 1.15, {
      expr: "stern", wave: 0.34 + 0.1 * Math.sin(t * 2.2), look: 0.3, seed: 61,
    });
    pushFront("scout", FOLK[4], TREE[0] + 1.35, TREE[1], TREE[2] + 1.5, {
      expr: "neutral", look: -0.35, seed: 62,
    }); // field assistant with the increment borer
  }

  // ---------------- Shot 9: night after the lift ----------------
  if (id === 9) {
    // two walkers head home under the red moon; the candle-seller's boy carries the last lantern
    const wph = (t * 0.35) % 1;
    const w1x = -6.5 + wph * 7.5;
    pushFront("walk9a", FOLK[1], w1x, 0, 5.2, { mode: "stroll", phase: wph * 1.7, expr: "neutral", look: 0.2, seed: 71, shadow: true });
    pushFront("walk9b", COLONIAL_KID, w1x + 1.15, 0, 5.65, { mode: "stroll", phase: (wph * 1.7 + 0.5) % 1, expr: "smile", look: -0.2, seed: 72 });
    // his lantern
    pushTorch("lantern9", w1x + 1.35, 0.92, 5.8, 0.95, t * 2.0);
    // door candle inside the meeting house
    pushTorch("church9", 0, 1.15, -23.85, 1.15, t * 1.8);
  }

  return { places, fx };
};
