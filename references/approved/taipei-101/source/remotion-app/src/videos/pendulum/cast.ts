// Flat 2D cartoon cast + cartoon FX sprites in our 3D world.
// Uses the skill's Canvas2D Pen (toon.ts), canvas pool, cardShade() scene-lit billboard
// shader, and multiply ground contact shadow blobs (blobMaterial), all on layer NOINK.

import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, townsfolk, KID, PARENT, ENGINEER, WORKER, HERO,
  fxSplash, fxStars, fxCreak, fxRing, fxPuff, fxContact, fxWind, damperMascot,
  type Outfit, type Expr,
} from "./toon";
import {
  FPS, ATRIUM, OFFICE, BOAT, SHOTS, sceneState, clamp01, type V3,
} from "./story";
import { LIGHTS } from "./lights";
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
/** Deterministic natural blink every ~1.6-2.2 s lasting 4 frames */
const blinkAt = (f: number, idSeed: number, swaps: number[] = []) => {
  for (const sf of swaps) {
    const d = f - sf;
    if (d >= -1 && d <= 2) return LID[d + 1];
  }
  const period = 48 + (idSeed % 5) * 9; // 48..84 frames (1.6..2.8s)
  const k = (f + idSeed * 19) % period;
  return k < 4 ? LID[k] : 0;
};

const tier = (d: number): [number, number, number] =>
  d < 4.0 ? [900, 1500, 1.5] : d < 8.5 ? [600, 1000, 1.0] : d < 22 ? [360, 600, 0.6] : [210, 350, 0.35];

const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = cam.sun.dot(cam.right) * (mirror ? -1 : 1), sy = -cam.sun.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

const blobHex = (lightName: "day" | "golden") => {
  const b = LIGHTS[lightName].blob;
  const ch = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0");
  return `#${ch(b[0])}${ch(b[1])}${ch(b[2])}`;
};

const addShadowBlob = (fx: FxPlace[], x: number, y: number, z: number, lightName: "day" | "golden", w = 0.85) => {
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

const FOLK: Outfit[] = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const ENGS: Outfit[] = [ENGINEER(0), ENGINEER(1)];
const WORK: Outfit[] = [WORKER(0), WORKER(1)];

// ---------------- per-shot cast + FX staging ----------------
export const stage = (id: number, f: number, cam: CamInfo): StageOut => {
  const places: Place[] = [];
  const fx: FxPlace[] = [];
  const shot = SHOTS[id - 1];
  const L = shot.light;
  const st = sceneState(id, f);
  const t = f / FPS;

  const pushFront = (
    tag: string, outfit: Outfit, x: number, y: number, z: number,
    opts: {
      expr?: Expr; mode?: "stand" | "stroll" | "sit"; phase?: number; look?: number;
      tilt?: number; wave?: number; seed?: number; scale?: number; roll?: number; swaps?: number[];
      shadow?: boolean;
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
        mode, phase: ph, expr, look: lk, tilt: tl, wave: wv, blink: bl, light: l2, seed,
      }),
      x, y, z,
      scale: opts.scale ?? 1,
      roll: opts.roll ?? 0,
      size: sz,
    });
    if (opts.shadow !== false) addShadowBlob(fx, x, y, z, L, 0.85 * (opts.scale ?? 1));
  };

  // ---- Shot 1: Hook inside Atrium ----
  if (id === 1) {
    const expr: Expr = f < 46 ? "shock" : "smile";
    pushFront("hero1", HERO, ATRIUM[0] + 0.95, ATRIUM[1], ATRIUM[2] - 4.45, {
      expr, look: -0.35, seed: 2, swaps: [46],
    });
    pushFront("folk1", FOLK[1], ATRIUM[0] - 2.3, ATRIUM[1], ATRIUM[2] - 4.1, {
      expr: "neutral", look: 0.4, seed: 5,
    });
  }

  // ---- Shots 2 & 11: City Plaza strolling townsfolk ----
  if (id === 2 || id === 11) {
    const walkers: [number, number, number, number][] = [
      [-8.5, -36, 1.15, 0], [-3.2, -31, -1.05, 1], [4.4, -34, 1.1, 2],
      [9.2, -29, -1.0, 3], [-12.0, -25, 0.95, 4], [1.2, -40, 1.05, 5],
    ];
    walkers.forEach(([x0, z0, spd, k]) => {
      const x = x0 + ((t * spd) % 12) - 6;
      const ph = (t * Math.abs(spd) * 0.62 + k * 0.17) % 1;
      const l2 = light2D(cam, spd < 0);
      const bl = blinkAt(f, k + 10);
      const d = Math.hypot(cam.pos.x - x, cam.pos.y - 1.1, cam.pos.z - z0);
      places.push({
        key: `S|folk${k}|${Math.round(ph * 20)}|${bl}|${l2.toFixed(2)}`,
        draw: (p) => bodySide(p, FOLK[k % FOLK.length], {
          mode: "march", stride: 0.58, phase: ph, expr: "smile", blink: bl, light: l2, seed: k + 2,
        }),
        x, y: 0, z: z0,
        mirror: spd < 0,
        size: tier(d),
      });
      addShadowBlob(fx, x, 0, z0, L, 0.82);
    });
  }

  // ---- Shots 3 & 9: Exterior wind gusts on upper Taipei 101 tiers ----
  if (id === 3 || id === 9) {
    const bands = id === 9
      ? [[-8, 38, -10], [7, 50, -8], [-6, 63, -9], [8, 76, -8], [-4, 86, -7]]
      : [[-6, 58, -9], [6, 70, -8], [-5, 81, -8]];
    bands.forEach(([wx, wy, wz], i) => {
      const u = Math.round(((t * (id === 9 ? 1.85 : 1.1) + i * 0.23) % 1) * 24) / 24;
      fx.push({
        key: `wind|${u}`,
        cw: 640, ch: 260,
        draw: (p) => fxWind(p, u),
        x: wx, y: wy, z: wz,
        w: id === 9 ? 13 : 10, h: id === 9 ? 5.2 : 4.0,
        soft: true,
      });
    });
    if (id === 9 && f >= 1354) {
      const cu = Math.round(((t * 2.5) % 1) * 16) / 16;
      fx.push({
        key: `creak9|${cu}`,
        cw: 300, ch: 300,
        draw: (p) => fxCreak(p, cu),
        x: 6.8, y: 60, z: -7,
        w: 5.5, h: 5.5,
      });
    }
  }

  // ---- Shots 4 & 5: 90th-Floor Swaying Office ----
  if (id === 4 || id === 5) {
    // Rotate seated workers with the tilting office floor around OFFICE origin
    const placeWorker = (idx: number, lx: number, lz: number, expr: Expr, swaps: number[]) => {
      const c = Math.cos(st.officeRoll), s = Math.sin(st.officeRoll);
      const wx = OFFICE[0] + lx * c;
      const wy = OFFICE[1] + lx * s;
      const wz = OFFICE[2] + lz;
      pushFront(`wrk${idx}`, WORK[idx], wx, wy, wz, {
        mode: "sit",
        expr,
        look: Math.sin(t * 2.4) * 0.4,
        roll: st.officeRoll,
        seed: 12 + idx * 3,
        swaps,
        shadow: false,
      });
      return [wx, wy, wz] as V3;
    };
    const e0: Expr = id === 4 ? (f < 458 ? "neutral" : "nervous") : "nervous";
    // Worker 1 turns dazed (spiral eyes!) at f641, 3 frames before "seasick" (f644)!
    const e1: Expr = id === 4 ? (f < 460 ? "neutral" : "shock") : (f < 641 ? "nervous" : "dazed");
    placeWorker(0, -1.6, 0.55, e0, [458]);
    const w1Pos = placeWorker(1, 1.45, 0.55, e1, [460, 641]);

    // Circling cartoon dizzy stars over seasick worker right as "seasick" hits!
    if (id === 5 && f >= 641) {
      const su = Math.round(((t * 0.95) % 1) * 24) / 24;
      fx.push({
        key: `stars|${su}`,
        cw: 420, ch: 210,
        draw: (p) => fxStars(p, su),
        x: w1Pos[0], y: w1Pos[1] + 2.02, z: w1Pos[2] - 0.1,
        w: 0.95, h: 0.48,
      });
    }
    // Wind streaks outside the 90th-floor window (z = +6.5)
    for (const [wx, wy, i] of [[-2.4, 2.4, 0], [2.2, 2.9, 1]] as const) {
      const u = Math.round(((t * 1.35 + i * 0.4) % 1) * 20) / 20;
      fx.push({
        key: `windOff|${u}`,
        cw: 640, ch: 260,
        draw: (p) => fxWind(p, u),
        x: OFFICE[0] + wx, y: OFFICE[1] + wy, z: OFFICE[2] + 6.4,
        w: 4.6, h: 1.85,
        soft: true,
      });
    }
  }

  // ---- Shot 6: Engineers reveal the 660-ton sphere on 8 cables ----
  if (id === 6) {
    pushFront("eng0", ENGS[0], ATRIUM[0] - 2.15, ATRIUM[1], ATRIUM[2] - 4.25, {
      expr: f < 796 ? "neutral" : "grin",
      look: 0.35,
      wave: f >= 796 ? 0.45 + 0.2 * Math.sin(t * 4) : undefined,
      seed: 21,
      swaps: [796],
    });
    pushFront("eng1", ENGS[1], ATRIUM[0] - 0.95, ATRIUM[1], ATRIUM[2] - 4.55, {
      expr: "smile",
      look: 0.25,
      seed: 24,
    });
  }

  // ---- Shot 7: Golden-hour harbour rowboat analogy ----
  if (id === 7) {
    // Hero stands on boat deck, rolls with hull, then leans hard right at f1039 (3f before "lean")!
    const expr: Expr = f < 988 ? "smile" : f < 1039 ? "shock" : f < 1080 ? "stern" : "grin";
    const armOut = f >= 990 ? 0.55 + 0.35 * clamp01((f - 1039) / 20) : undefined;
    pushFront("boatHero", HERO, BOAT[0] + st.guyLean * 0.008, BOAT[1] + 0.22 + st.boatBob, BOAT[2], {
      expr,
      tilt: st.guyLean,
      roll: st.boatRoll * 0.65,
      wave: armOut,
      look: f >= 989 && f < 1039 ? -0.6 : 0.2,
      seed: 2,
      swaps: [988, 1039, 1080],
      shadow: false,
    });
    // Expanding water rings around the rocking hull
    const ru = Math.round(((t * 0.55) % 1) * 24) / 24;
    fx.push({
      key: `ring|${ru}`,
      cw: 600, ch: 600,
      draw: (p) => fxRing(p, ru),
      x: BOAT[0], y: BOAT[1] + 0.03, z: BOAT[2],
      w: 4.8, h: 4.8,
      flat: true,
      soft: true,
    });
    // Wave splash when the wave tips the deck left (f989..1026)
    if (f >= 989 && f <= 1026) {
      const sp = clamp01((f - 989) / 36);
      const qsp = Math.round(sp * 18) / 18;
      fx.push({
        key: `splash|${qsp}`,
        cw: 420, ch: 320,
        draw: (p) => fxSplash(p, qsp),
        x: BOAT[0] - 0.95, y: BOAT[1] + 0.45, z: BOAT[2] - 0.3,
        w: 1.55, h: 1.18,
        soft: true,
      });
    }
  }

  // ---- Shots 8 & 10: Counter-sway hydraulic bumpers & Typhoon 1-meter swing ----
  if (id === 8 || id === 10) {
    pushFront("engWatch", ENGS[0], ATRIUM[0] + 2.8, ATRIUM[1], ATRIUM[2] - 3.9, {
      expr: id === 10 ? "shock" : (f >= 1255 ? "grin" : "stern"),
      look: -0.5,
      seed: 21,
      swaps: [1255],
    });
    // Hydraulic damper compression puffs when sphere drives into left/right pistons
    if (id === 8 && f >= 1222 && f <= 1262) {
      const pu = Math.round(clamp01((f - 1222) / 38) * 16) / 16;
      fx.push({
        key: `puff8|${pu}`,
        cw: 300, ch: 300,
        draw: (p) => fxPuff(p, pu),
        x: ATRIUM[0] - 1.85, y: ATRIUM[1] + 1.15, z: ATRIUM[2] - 0.6,
        w: 1.5, h: 1.5,
        soft: true,
      });
    }
    if (id === 10) {
      const cu = Math.round(((t * 3.0) % 1) * 16) / 16;
      fx.push({
        key: `creak10|${cu}`,
        cw: 300, ch: 300,
        draw: (p) => fxCreak(p, cu),
        x: ATRIUM[0] + st.damperX + 1.9, y: ATRIUM[1] + 5.6, z: ATRIUM[2] - 0.5,
        w: 1.5, h: 1.5,
      });
      if (f >= 1456 && f <= 1486) {
        const pu = Math.round(clamp01((f - 1456) / 28) * 16) / 16;
        fx.push({
          key: `puff10|${pu}`,
          cw: 300, ch: 300,
          draw: (p) => fxPuff(p, pu),
          x: ATRIUM[0] + 1.95, y: ATRIUM[1] + 1.2, z: ATRIUM[2] - 0.5,
          w: 1.8, h: 1.8,
          soft: true,
        });
      }
    }
    // Wind streaks outside panoramic atrium windows
    if (st.wind > 0.2) {
      for (const [wx, wy, i] of [[-3.4, 5.2, 0], [3.2, 6.1, 1]] as const) {
        const u = Math.round(((t * 1.7 + i * 0.35) % 1) * 20) / 20;
        fx.push({
          key: `windAtr|${u}`,
          cw: 640, ch: 260,
          draw: (p) => fxWind(p, u),
          x: ATRIUM[0] + wx, y: ATRIUM[1] + wy, z: ATRIUM[2] + 11.2,
          w: 5.5, h: 2.2,
          soft: true,
        });
      }
    }
  }

  // ---- Shot 12: "Unluckily for anyone scared of heights, there is a public viewing deck right beside it." ----
  if (id === 12) {
    // Nervous guy right by the low rail (f1589 = 3f before "scared" f1592!)
    const scaredExpr: Expr = f < 1589 ? "shock" : "nervous";
    pushFront("scaredGuy", HERO, ATRIUM[0] + 0.85, ATRIUM[1], ATRIUM[2] - 4.18, {
      expr: scaredExpr,
      look: f < 1615 ? -0.4 : 0,
      tilt: f >= 1589 ? 5 : 0,
      seed: 2,
      swaps: [1589],
    });
    // Calm happy tourist standing casually right beside him
    pushFront("calmTour", FOLK[2], ATRIUM[0] - 0.45, ATRIUM[1], ATRIUM[2] - 4.35, {
      expr: "grin",
      look: 0.3,
      wave: 0.35,
      seed: 31,
    });
  }

  // ---- Shot 14: Golden sunset observatory + cute round golden mascot! ----
  if (id === 14) {
    // Happy crowd admiring the gleaming golden sphere & mascot
    pushFront("goldParent", PARENT, ATRIUM[0] + 0.95, ATRIUM[1], ATRIUM[2] - 4.55, {
      expr: "grin",
      look: 0.45,
      seed: 41,
    });
    pushFront("goldKid", KID, ATRIUM[0] + 1.58, ATRIUM[1], ATRIUM[2] - 4.45, {
      expr: "laugh",
      look: 0.5,
      wave: 0.5 + 0.35 * Math.sin(t * 6),
      seed: 42,
    });
    pushFront("goldHero", HERO, ATRIUM[0] - 1.55, ATRIUM[1], ATRIUM[2] - 4.45, {
      expr: "smile_closed",
      look: 0.3,
      seed: 2,
    });
    pushFront("goldFolk", FOLK[4], ATRIUM[0] - 2.75, ATRIUM[1], ATRIUM[2] - 3.85, {
      expr: "grin",
      look: 0.4,
      seed: 44,
    });

    // Cute round golden sphere mascot waving on its golden pedestal ([2.35, 0.26, -4.3])!
    const mw = Math.round((0.5 + 0.5 * Math.sin(t * 5.2)) * 12) / 12;
    const mb = blinkAt(f, 77) >= 1 ? 1 : 0;
    const ml = light2D(cam, false);
    const md = Math.hypot(cam.pos.x - (ATRIUM[0] + 2.35), cam.pos.y - (ATRIUM[1] + 1.1), cam.pos.z - (ATRIUM[2] - 4.3));
    places.push({
      key: `mascot|${mw}|${mb}|${ml.toFixed(2)}`,
      draw: (p) => damperMascot(p, mw, mb, ml),
      x: ATRIUM[0] + 2.35,
      y: ATRIUM[1] + 0.26,
      z: ATRIUM[2] - 4.3,
      scale: 0.76,
      size: tier(md),
    });
  }

  return { places, fx };
};
