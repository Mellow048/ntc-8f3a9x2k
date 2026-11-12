// The district: one afternoon in the Western Australian wheat belt, 1932.
// A stubble paddock, a wire fence, a dirt track, the dam with its windmill and
// tank, the tin shed with a verandah, the truck, the Lewis guns, the crate and
// the tally board. Everything is hand-built from primitives with painted canvas
// textures — nothing here is a labelled box pretending to be a thing.
//
// update(id, f, cam, scene) poses the whole district for shot `id` at frame f:
// a pure function of (id, f), so any frame renders alone and deterministically.
import * as THREE from "three";
import { NOINK } from "./ink";
import { EmuCard, ManCard, DIGGER, OFFICER_OUT, FARMER_OUT } from "./cast";
import { FPS, A, camAt, crewAt, dustAt, flockAt, gunAt, truckAt, dofAt, SOLO, SOLO_WATER, RUNNER, type Light } from "./story";

/** Deterministic noise for every procedural texture and prop jitter.
 *  The film is rendered in parallel chunks on separate machines: an unseeded Math.random() makes each chunk's
 *  gravel, planks and grass a different pattern, which shows up as a hard pop on the first frame of every part. */
let _seed = 0x9e3779b9;
const RND = () => {
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const resetNoise = (seed = 0x9e3779b9) => { _seed = seed | 0; };
import type { Kit } from "./build";

export const loadKit = async (): Promise<Kit> => ({});

// ---------------------------------------------------------------- textures
const cv = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
};
const texOf = (c: HTMLCanvasElement, repeat?: [number, number]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
};
const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, col: string, alpha: number, rMin = 1, rMax = 5) => {
  g.save();
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = RND() * w, y = RND() * h, r = rMin + RND() * (rMax - rMin);
    g.globalAlpha = alpha * (0.4 + RND() * 0.6);
    g.beginPath();
    g.ellipse(x, y, r, r * (0.6 + RND() * 0.8), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
};

/** bare paddock: red-brown earth, stubble sticks, dry patches */
const earthTex = () => {
  const S = 1024, c = cv(S, S), g = c.getContext("2d")!;
  g.fillStyle = "#b07d4a"; g.fillRect(0, 0, S, S);
  noise(g, S, S, 2600, "#a06d3f", 0.5, 2, 9);
  noise(g, S, S, 1500, "#c9975e", 0.4, 2, 12);
  // broad tonal patches, so the paddock is not one flat orange at any distance
  for (let i = 0; i < 26; i++) {
    const x = RND() * S, y = RND() * S, r = 60 + RND() * 190;
    const pg = g.createRadialGradient(x, y, 0, x, y, r);
    const warm = RND() < 0.55;
    pg.addColorStop(0, warm ? "rgba(150,104,58,0.50)" : "rgba(206,166,112,0.45)");
    pg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = pg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // dry grass tufts and stones, the litter that tells you the scale of the ground
  for (let i = 0; i < 900; i++) {
    const x = RND() * S, y = RND() * S, h = 5 + RND() * 15;
    g.strokeStyle = RND() < 0.5 ? "rgba(148,140,84,0.55)" : "rgba(124,104,64,0.5)";
    g.lineWidth = 1 + RND() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (RND() - 0.5) * 9, y - h); g.stroke();
  }
  noise(g, S, S, 700, "#8c5c33", 0.35, 3, 16);
  // stubble: short straws lying every which way
  g.lineCap = "round";
  for (let i = 0; i < 2200; i++) {
    const x = RND() * S, y = RND() * S, a = RND() * Math.PI, L = 6 + RND() * 16;
    g.strokeStyle = RND() < 0.5 ? "#d8b277" : "#a87a44";
    g.globalAlpha = 0.35 + RND() * 0.4;
    g.lineWidth = 1 + RND() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  g.globalAlpha = 1;
  const t = texOf(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 9);
  return t;
};

/** corrugated iron: vertical ribs with rust at the laps */
const ironTex = () => {
  const W = 256, H = 256, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = "#9aa1a0"; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 8) {
    const grad = g.createLinearGradient(x, 0, x + 8, 0);
    grad.addColorStop(0, "#7f8686"); grad.addColorStop(0.45, "#b9c0be"); grad.addColorStop(1, "#818889");
    g.fillStyle = grad; g.fillRect(x, 0, 8, H);
  }
  noise(g, W, H, 260, "#8a5a33", 0.3, 1, 4);
  const t = texOf(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

/** weathered timber */
const woodTex = (tone = "#a47a4c") => {
  const W = 256, H = 256, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = tone; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = RND() < 0.5 ? "#8a6136" : "#c39a68";
    g.globalAlpha = 0.25 + RND() * 0.35;
    g.lineWidth = 1 + RND() * 2;
    const y = RND() * H;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x < W; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = texOf(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

/** the dam: still brown-green water with a wind-ruffle */
const waterTex = () => {
  const S = 512, c = cv(S, S), g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, "#4f7a6e"); grad.addColorStop(0.55, "#3d6a63"); grad.addColorStop(1, "#2f5751");
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const y = RND() * S, w = 20 + RND() * 90, x = RND() * S;
    g.strokeStyle = RND() < 0.5 ? "#7fa79a" : "#2b4e49";
    g.globalAlpha = 0.25 + RND() * 0.4;
    g.lineWidth = 1 + RND() * 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w * 0.5, y - 3, x + w, y); g.stroke();
  }
  g.globalAlpha = 1;
  const t = texOf(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};

/** stencilled ammunition crate lid: "10,000 ROUNDS .303" */
const crateTex = () => {
  const W = 512, H = 256, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = "#8f7043"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#7b5f38"; g.fillRect(0, i * 52, W, 3); }
  g.fillStyle = "#3e2f1c";
  g.font = "900 54px ui-monospace, Menlo, monospace";
  g.fillText("10,000", 26, 92);
  g.font = "700 34px ui-monospace, Menlo, monospace";
  g.fillText("ROUNDS .303", 26, 148);
  g.globalAlpha = 0.5;
  noise(g, W, H, 220, "#5c4526", 0.4, 1, 4);
  g.globalAlpha = 1;
  return texOf(c);
};

/** the tally board: scratched numbers, a finished column */
const boardTex = () => {
  const W = 512, H = 320, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = "#8a6b45"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#75593a"; g.fillRect(0, i * 64, W, 4); }
  g.strokeStyle = "#e8e2cf"; g.lineWidth = 5; g.lineCap = "round";
  g.font = "700 40px ui-monospace, monospace"; g.fillStyle = "#efe9d6";
  g.fillText("EMUS", 22, 52);
  g.fillText("986", 300, 52);
  g.fillText("ROUNDS", 22, 116);
  g.fillText("9860", 300, 116);
  // tally marks: bundles of five
  g.lineWidth = 3.5;
  for (let i = 0; i < 34; i++) {
    const x = 26 + (i % 12) * 34, y = 160 + Math.floor(i / 12) * 46;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 30); g.stroke();
    if (i % 5 === 4) { g.beginPath(); g.moveTo(x - 26, y + 26); g.lineTo(x + 4, y + 6); g.stroke(); }
  }
  return texOf(c);
};

/** a 1932 newspaper front page, printed on a card and pinned to the shed wall */
const paperTex = () => {
  const W = 640, H = 900, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = "#efe5cd"; g.fillRect(0, 0, W, H);
  noise(g, W, H, 700, "#cbbfa2", 0.25, 1, 4);
  g.fillStyle = "#2b2620";
  g.textAlign = "center";
  g.font = "900 74px Georgia, 'Times New Roman', serif";
  g.fillText("THE EMU WAR", W / 2, 132);
  g.font = "700 30px Georgia, serif";
  g.fillText("MACHINE GUNS SENT INTO THE WHEAT BELT", W / 2, 186);
  g.fillRect(40, 210, W - 80, 4);
  // a blocky "photo" of a gun crew
  g.fillStyle = "#c9bfa6"; g.fillRect(60, 240, W - 120, 300);
  g.fillStyle = "#8d846c"; g.fillRect(80, 420, W - 160, 60);
  g.fillStyle = "#6f6754";
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(150 + i * 150, 350, 34, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#4b4638"; g.fillRect(110, 400, 220, 22); g.fillRect(300, 372, 90, 14);
  // columns of type
  g.fillStyle = "#4a4438";
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 16; row++) {
      const w = 130 - RND() * 40;
      g.fillRect(60 + col * 175, 580 + row * 17, w, 7);
    }
  }
  return texOf(c);
};

/** the modern permit nailed to a post */
const permitTex = () => {
  const W = 300, H = 400, c = cv(W, H), g = c.getContext("2d")!;
  g.fillStyle = "#f2efe6"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#2f6b4f"; g.lineWidth = 10; g.strokeRect(16, 16, W - 32, H - 32);
  g.fillStyle = "#2f6b4f"; g.textAlign = "center";
  g.font = "900 34px Arial, sans-serif"; g.fillText("CULL PERMIT", W / 2, 96);
  g.font = "700 22px Arial, sans-serif";
  g.fillText("EMU — 2024", W / 2, 136);
  g.fillStyle = "#8a8f88";
  for (let i = 0; i < 8; i++) g.fillRect(40, 190 + i * 24, W - 80 - RND() * 40, 8);
  g.fillStyle = "#b33b32"; g.font = "900 28px Arial"; g.fillText("APPROVED", W / 2, 380);
  return texOf(c);
};

// ---------------------------------------------------------------- helpers
const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
const cyl = (rt: number, rb: number, h: number, mat: THREE.Material, seg = 12) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

export class World {
  root: THREE.Group;
  private emus: EmuCard[] = [];
  private solo: EmuCard;
  private runner: EmuCard;
  private men: ManCard[] = [];
  private farmer: ManCard;
  private truck: THREE.Group;
  private gun: THREE.Group;
  private gunFlash: THREE.Mesh;
  private board: THREE.Mesh;
  private crate: THREE.Group;
  private paper: THREE.Mesh;
  private permit: THREE.Mesh;
  private hose: THREE.Group;
  private gravel: THREE.Mesh;
  private puffs: THREE.Mesh[] = [];
  private fog = new THREE.Fog("#cfc2a6", 40, 190);
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh;
  private target = new THREE.Vector3();
  private shadows: THREE.Mesh[] = [];
  private nShadow = 0;
  private tmp = new THREE.Vector3();

  constructor(_kit: Kit) {
    this.root = new THREE.Group();
    const R = this.root;

    // ---------------- ground
    const rep = (t: THREE.Texture, rx: number, ry: number) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
};
    const earthMat = new THREE.MeshLambertMaterial({ map: rep(earthTex(), 30, 30), color: "#e6d3bb" });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 1, 1), earthMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    R.add(ground);

    // the dam: a shallow scoop of water with a mud rim
    const mud = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshLambertMaterial({ color: "#7d5b3b" }));
    mud.rotation.x = -Math.PI / 2;
    mud.scale.set(A.damR[0] + 1.6, A.damR[1] + 1.4, 1);
    mud.position.set(A.dam[0], 0.012, A.dam[1]);
    mud.receiveShadow = true;
    R.add(mud);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshLambertMaterial({ map: waterTex(), color: "#d8e6df" }));
    water.rotation.x = -Math.PI / 2;
    water.scale.set(A.damR[0], A.damR[1], 1);
    water.position.set(A.dam[0], 0.02, A.dam[1]);
    water.receiveShadow = true;
    R.add(water);

    // ---------------- fence: posts every 2.4 m, four wires
    const postMat = new THREE.MeshLambertMaterial({ map: woodTex("#9c7546") });
    const wireMat = new THREE.MeshLambertMaterial({ color: "#5c5348" });
    for (let x = -22; x <= 16; x += 2.4) {
      const p = cyl(0.055, 0.07, 1.25, postMat, 7);
      p.position.set(x, 0.62, A.fenceZ + Math.sin(x * 0.7) * 0.06);
      p.rotation.z = (RND() - 0.5) * 0.08;
      R.add(p);
    }
    for (let i = 0; i < 4; i++) {
      const w = cyl(0.012, 0.012, 38, wireMat, 5);
      w.rotation.z = Math.PI / 2;
      w.position.set(-3, 0.28 + i * 0.26, A.fenceZ);
      R.add(w);
    }

    // ---------------- windmill + tank
    const steel = new THREE.MeshLambertMaterial({ color: "#8d9490" });
    const mill = new THREE.Group();
    mill.position.set(A.windmill[0], 0, A.windmill[1]);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = cyl(0.05, 0.11, 6.4, steel, 6);
      leg.position.set(Math.cos(a) * 0.62, 3.2, Math.sin(a) * 0.62);
      leg.rotation.x = Math.sin(a) * 0.1;
      leg.rotation.z = -Math.cos(a) * 0.1;
      mill.add(leg);
    }
    for (let i = 1; i <= 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62 - i * 0.14, 0.022, 4, 12), steel);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 1.6;
      mill.add(ring);
    }
    const head = box(0.34, 0.34, 0.5, steel, 0, 6.5, 0);
    mill.add(head);
    const fan = new THREE.Group();
    fan.position.set(0, 6.5, 0.34);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.62), new THREE.MeshLambertMaterial({ color: "#b9bdb6", side: THREE.DoubleSide }));
      blade.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
      blade.rotation.z = a;
      blade.castShadow = true;
      fan.add(blade);
    }
    const hub = cyl(0.09, 0.09, 0.12, steel, 8);
    hub.rotation.x = Math.PI / 2;
    fan.add(hub);
    mill.add(fan);
    const vane = box(0.5, 0.3, 0.02, steel, 0, 6.5, -0.8);
    mill.add(vane);
    R.add(mill);

    // water tank + trough
    const tank = cyl(1.05, 1.05, 1.5, new THREE.MeshLambertMaterial({ map: ironTex() }), 16);
    tank.position.set(A.windmill[0] + 2.4, 0.75, A.windmill[1] + 0.8);
    R.add(tank);
    const trough = box(1.9, 0.42, 0.7, new THREE.MeshLambertMaterial({ map: woodTex("#8a6a44") }), A.windmill[0] + 3.9, 0.21, A.windmill[1] + 1.6);
    R.add(trough);

    // ---------------- the shed with its verandah
    const iron = new THREE.MeshLambertMaterial({ map: ironTex() });
    const shed = new THREE.Group();
    shed.position.set(A.shed[0], 0, A.shed[1]);
    shed.add(box(6.4, 3.2, 4.2, iron, 0, 1.6, 0));
    const roof = box(7.0, 0.12, 4.8, new THREE.MeshLambertMaterial({ color: "#7c8382" }), 0, 3.3, 0);
    roof.rotation.z = 0.06;
    shed.add(roof);
    // door + window
    shed.add(box(1.1, 2.1, 0.08, new THREE.MeshLambertMaterial({ color: "#5d4a33" }), -1.4, 1.05, 2.12));
    shed.add(box(1.2, 0.9, 0.06, new THREE.MeshLambertMaterial({ color: "#3d4a4a" }), 1.3, 2.0, 2.12));
    // verandah
    for (const x of [-2.6, 2.6]) {
      const p = cyl(0.07, 0.07, 2.4, new THREE.MeshLambertMaterial({ map: woodTex("#8b6b45") }), 8);
      p.position.set(x, 1.2, 3.1);
      shed.add(p);
    }
    const vRoof = box(6.6, 0.1, 1.7, new THREE.MeshLambertMaterial({ color: "#8b9290" }), 0, 2.5, 2.7);
    shed.add(vRoof);
    // the newspaper pinned to the wall
    this.paper = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.2), new THREE.MeshBasicMaterial({ map: paperTex() }));
    this.paper.position.set(0.6, 1.7, 2.14);
    shed.add(this.paper);
    R.add(shed);

    // ---------------- the track: a dirt strip that reads as a road
    const trackMat = new THREE.MeshLambertMaterial({ color: "#cfae84", map: rep(earthTex(), 2, 26) });
    const track = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(A.trackX, 0.008, -6);
    track.receiveShadow = true;
    R.add(track);

    // ---------------- the truck (1930s flatbed: bonnet, cab, tray, spoked wheels)
    this.truck = new THREE.Group();
    const paint = new THREE.MeshLambertMaterial({ color: "#5e6b4e" });
    const dark = new THREE.MeshLambertMaterial({ color: "#2f332c" });
    const body = new THREE.Group();
    body.add(box(1.5, 0.75, 2.1, paint, 0, 0.95, 0.2));                 // bonnet block
    body.add(box(1.34, 0.42, 1.5, new THREE.MeshLambertMaterial({ color: "#3b4438" }), 0, 1.42, 0.35)); // bonnet top
    body.add(box(1.58, 1.5, 1.25, paint, 0, 1.35, -1.05));              // cab
    body.add(box(1.42, 0.7, 0.1, new THREE.MeshLambertMaterial({ color: "#243033" }), 0, 1.72, -0.44)); // windscreen
    body.add(box(1.7, 0.16, 2.5, new THREE.MeshLambertMaterial({ map: woodTex("#9a7648") }), 0, 0.92, -2.6)); // tray floor
    for (const s of [-1, 1]) {
      body.add(box(0.1, 0.5, 2.5, new THREE.MeshLambertMaterial({ map: woodTex("#8f6c42") }), s * 0.8, 1.2, -2.6)); // tray sides
      body.add(box(0.1, 0.9, 1.2, paint, s * 0.78, 1.35, 0.3));        // side panels
    }
    body.add(box(1.7, 0.5, 0.1, new THREE.MeshLambertMaterial({ map: woodTex("#8f6c42") }), 0, 1.2, -3.85)); // tailgate
    // radiator, lamps, spotlight
    body.add(box(1.3, 0.9, 0.12, dark, 0, 1.15, 1.28));
    for (const s of [-1, 1]) {
      const lamp = cyl(0.13, 0.13, 0.1, new THREE.MeshLambertMaterial({ color: "#f0e4bd" }), 10);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(s * 0.5, 1.35, 1.34);
      body.add(lamp);
    }
    const spot = cyl(0.11, 0.11, 0.3, dark, 10);
    spot.rotation.x = Math.PI / 2;
    spot.position.set(0.5, 2.35, -1.0);
    body.add(spot);
    // wheels: spoked, with tyres
    const tyre = new THREE.MeshLambertMaterial({ color: "#1f2220" });
    const wood = new THREE.MeshLambertMaterial({ map: woodTex("#a17b4c") });
    for (const [x, z] of [[-0.86, 1.0], [0.86, 1.0], [-0.86, -2.7], [0.86, -2.7]] as const) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.5, z);
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 20), tyre);
      t.castShadow = true;
      wheel.add(t);
      const disc = cyl(0.34, 0.34, 0.1, wood, 14);
      disc.rotation.z = Math.PI / 2;
      wheel.add(disc);
      for (let i = 0; i < 8; i++) {
        const spoke = box(0.05, 0.6, 0.05, wood, 0, 0, 0);
        spoke.rotation.z = (i / 8) * Math.PI * 2;
        wheel.add(spoke);
      }
      body.add(wheel);
    }
    this.truck.add(body);
    R.add(this.truck);

    // ---------------- the Lewis gun on its bipod
    this.gun = new THREE.Group();
    const gunMetal = new THREE.MeshLambertMaterial({ color: "#3a3f42" });
    const g = new THREE.Group();
    const jacket = cyl(0.075, 0.075, 0.52, gunMetal, 12);
    jacket.rotation.x = Math.PI / 2;
    jacket.position.set(0, 0.94, 0.18);
    g.add(jacket);
    const barrel = cyl(0.032, 0.032, 0.34, gunMetal, 10);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.94, 0.6);
    g.add(barrel);
    const drum = cyl(0.18, 0.18, 0.12, new THREE.MeshLambertMaterial({ color: "#4c5153" }), 18);
    drum.position.set(0, 1.06, -0.02);
    g.add(drum);
    g.add(box(0.1, 0.12, 0.5, new THREE.MeshLambertMaterial({ map: woodTex("#8c6440") }), 0, 0.9, -0.42));
    const grip = box(0.06, 0.18, 0.1, gunMetal, 0, 0.82, -0.62);
    g.add(grip);
    for (const s of [-1, 1]) {
      const leg = cyl(0.022, 0.022, 0.9, gunMetal, 6);
      leg.position.set(s * 0.24, 0.45, 0.06);
      leg.rotation.z = s * 0.34;
      leg.rotation.x = -0.12;
      g.add(leg);
    }
    this.gunFlash = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.5, 8),
      new THREE.MeshBasicMaterial({ color: "#ffe9a8", transparent: true, opacity: 0.9 }),
    );
    this.gunFlash.rotation.x = -Math.PI / 2;
    this.gunFlash.position.set(0, 0.94, 0.86);
    g.add(this.gunFlash);
    this.gun.add(g);
    this.gun.position.set(A.gun[0], 0, A.gun[1]);
    R.add(this.gun);

    // ---------------- crate of ammunition + the tally board
    this.crate = new THREE.Group();
    this.crate.position.set(A.crate[0], 0, A.crate[1]);
    const crateMat = new THREE.MeshLambertMaterial({ map: crateTex() });
    for (let i = 0; i < 2; i++) {
      const c = box(0.9, 0.42, 0.62, crateMat, 0, 0.21 + i * 0.44, 0);
      c.rotation.y = 0.18 + i * 0.06;
      this.crate.add(c);
    }
    R.add(this.crate);

    this.board = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.54), new THREE.MeshLambertMaterial({ map: boardTex(), side: THREE.DoubleSide }));
    this.board.position.set(A.board[0], 0.92, A.board[1]);
    this.board.rotation.y = -0.5;
    this.board.castShadow = true;
    R.add(this.board);
    const boardPost = cyl(0.045, 0.045, 1.0, new THREE.MeshLambertMaterial({ map: woodTex("#8b6b45") }), 7);
    boardPost.position.set(A.board[0], 0.5, A.board[1] + 0.03);
    R.add(boardPost);

    // ---------------- the hose on gravel (explanation beat)
    this.hose = new THREE.Group();
    const hoseMat = new THREE.MeshLambertMaterial({ color: "#3d5c47" });
    const hosePts: THREE.Vector3[] = [
      new THREE.Vector3(-1.4, 0.3, 2.4), new THREE.Vector3(-1.0, 0.24, 2.0),
      new THREE.Vector3(-0.7, 0.16, 1.7), new THREE.Vector3(-0.55, 0.1, 1.45),
    ];
    const hoseCurve = new THREE.CatmullRomCurve3(hosePts);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 20, 0.035, 7, false);
    const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
    hoseMesh.castShadow = true;
    this.hose.add(hoseMesh);
    // the jet
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.6, 7), new THREE.MeshBasicMaterial({ color: "#cfe9ef", transparent: true, opacity: 0.55 }));
    jet.position.set(-0.42, 0.14, 1.28);
    jet.rotation.set(Math.PI / 2.4, 0, 0.1);
    this.hose.add(jet);
    R.add(this.hose);
    this.gravel = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshLambertMaterial({ color: "#8d8578" }));
    this.gravel.rotation.x = -Math.PI / 2;
    this.gravel.position.set(-0.35, 0.015, 1.15);
    this.gravel.receiveShadow = true;
    R.add(this.gravel);

    // ---------------- the permit on its post
    this.permit = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: permitTex(), side: THREE.DoubleSide }));
    this.permit.position.set(A.fenceZ * 0 + 4.6, 1.15, 0.6);
    this.permit.rotation.y = 0.5;
    R.add(this.permit);
    const permitPost = cyl(0.05, 0.055, 1.3, new THREE.MeshLambertMaterial({ map: woodTex("#8b6b45") }), 7);
    permitPost.position.set(4.6, 0.65, 0.66);
    R.add(permitPost);

    dust: {
      const puffMat = new THREE.MeshBasicMaterial({ color: "#d8bb90", transparent: true, opacity: 0.5 });
      for (let i = 0; i < 16; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), puffMat.clone());
        p.visible = false;
        p.layers.set(NOINK);
        this.puffs.push(p);
        R.add(p);
      }
    }

    // ---------------- contact shadows: pools of shade under feet and wheels, so nothing floats
    const shCv = cv(128, 128);
    const shg = shCv.getContext("2d")!;
    const shgrad = shg.createRadialGradient(64, 64, 2, 64, 64, 62);
    shgrad.addColorStop(0, "rgba(58,40,24,0.62)");
    shgrad.addColorStop(0.55, "rgba(58,40,24,0.30)");
    shgrad.addColorStop(1, "rgba(58,40,24,0)");
    shg.fillStyle = shgrad; shg.fillRect(0, 0, 128, 128);
    const shTex = texOf(shCv);
    const shMat = new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, opacity: 1 });
    for (let i = 0; i < 48; i++) {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shMat);
      q.rotation.x = -Math.PI / 2;
      q.position.y = 0.015;
      q.visible = false;
      q.renderOrder = 1;
      q.layers.set(NOINK);
      this.shadows.push(q);
      R.add(q);
    }

    // ---------------- far scrub and sky
    const scrubMat = new THREE.MeshLambertMaterial({ color: "#5d6b49" });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 46 + RND() * 14;
      const s = 1.1 + RND() * 1.8;
      const bush = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 5), scrubMat);
      bush.position.set(Math.cos(a) * r, s * 0.35, Math.sin(a) * r - 8);
      bush.scale.y = 0.5;
      R.add(bush);
    }
    const treeMat = new THREE.MeshLambertMaterial({ color: "#6b5c43" });
    for (let i = 0; i < 5; i++) {
      const t = cyl(0.12, 0.22, 3.4, treeMat, 6);
      const a = -0.6 + i * 0.55;
      t.position.set(Math.cos(a) * 34, 1.7, Math.sin(a) * 34 - 6);
      t.rotation.z = 0.08 * (i % 2 ? 1 : -1);
      R.add(t);
    }

    // painted sky dome
    const skyCv = cv(64, 512);
    const sg = skyCv.getContext("2d")!;
    const grad = sg.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#3f74bd");
    grad.addColorStop(0.42, "#7ba6d4");
    grad.addColorStop(0.72, "#c9d2cd");
    grad.addColorStop(1, "#e8cfa4");
    sg.fillStyle = grad; sg.fillRect(0, 0, 64, 512);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(220, 24, 16),
      new THREE.MeshBasicMaterial({ map: texOf(skyCv), side: THREE.BackSide, fog: false }),
    );
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    // ---------------- lights
    this.hemi = new THREE.HemisphereLight("#cfe0f2", "#8a6a4a", 0.75);
    R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffe9c4", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -14; this.sun.shadow.camera.right = 14;
    this.sun.shadow.camera.top = 14; this.sun.shadow.camera.bottom = -14;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    R.add(this.sun, this.sun.target);


    // ---------------- cast
    for (let i = 0; i < 14; i++) {
      const e = new EmuCard(R);
      this.emus.push(e);
    }
    this.solo = new EmuCard(R);
    this.runner = new EmuCard(R);
    for (let i = 0; i < 5; i++) this.men.push(new ManCard(R, DIGGER(i)));
    this.men.push(new ManCard(R, OFFICER_OUT));
    this.farmer = new ManCard(R, FARMER_OUT);
  }

  private light(kind: Light) {
    const P = {
      day: { sky: ["#cfe0f2", "#8a6a4a", 0.8], sun: ["#fff0d2", 2.9], pos: [18, 26, 12], fog: ["#e2d3b6", 16, 118] },
      golden: { sky: ["#ffd9a8", "#7a5a3c", 0.7], sun: ["#ffb268", 3.6], pos: [-22, 9, -16], fog: ["#f0cfa0", 14, 104] },
      dusk: { sky: ["#a89ec4", "#4c4356", 0.55], sun: ["#d98f7a", 1.9], pos: [-20, 7, 14], fog: ["#9c8b9a", 12, 92] },
    }[kind];
    this.hemi.color.set(P.sky[0] as string);
    this.hemi.groundColor.set(P.sky[1] as string);
    this.hemi.intensity = P.sky[2] as number;
    this.sun.color.set(P.sun[0] as string);
    this.sun.intensity = P.sun[1] as number;
    this.sun.position.set(P.pos[0], P.pos[1], P.pos[2]);
    this.fog.color.set(P.fog[0] as string);
    this.fog.near = P.fog[1] as number;
    this.fog.far = P.fog[2] as number;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    if (scene.fog !== this.fog) scene.fog = this.fog;
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    this.target.set(...c.look);
    cam.lookAt(this.target);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.updateProjectionMatrix();
    this.sky.position.copy(cam.position);

    this.light((["golden", "day", "day", "day", "day", "golden", "day", "dusk", "dusk", "golden"] as Light[])[id - 1]);

    const t = f / FPS;

    // the flock
    const fenceBeat = id === 1 || id === 2 || id === 9 || id === 10;
    const flock = flockAt(f, fenceBeat ? "fence" : "dam");
    this.emus.forEach((e, i) => {
      const b = flock[i % flock.length];
      const show = id === 3 || id === 4
        ? true
        : id === 1 || id === 2 ? i < 10
        : id === 10 ? i < 3
        : id === 9 ? i < 4
        : false;
      e.mesh.visible = !!show;
      if (show) {
        const running = id === 4 || (id === 3 && f > 700);
        e.update(b.x, b.z, Math.atan2(cam.position.x - b.x, cam.position.z - b.z), Math.cos(b.rot) < 0,
          { gait: b.gait + t * 1.6, head: b.head, run: running });
      }
    });

    // the single emu the explanation is built on
    const soloShow = id === 6 || id === 7 || id === 10;
    this.solo.mesh.visible = soloShow;
    if (soloShow) {
      const s0 = id === 10 ? SOLO_WATER : SOLO;
      this.solo.update(s0.x, s0.z, Math.atan2(cam.position.x - s0.x, cam.position.z - s0.z), s0.rot > 0.5,
        { gait: Math.sin(t * 0.6) * 0.25 + 0.5, head: id === 7 ? 0.75 : 0.45 });
    }

    this.runner.mesh.visible = id === 4;
    if (id === 4) {
      const rx = RUNNER.x + (f - 900) * 0.02, rz = RUNNER.z + (f - 900) * 0.012;
      this.runner.update(rx, rz, Math.atan2(cam.position.x - rx, cam.position.z - rz), Math.cos(RUNNER.rot) < 0,
        { gait: (f - 900) * 0.09, head: 0.1, run: true });
    }

    // men
    const crew = crewAt(id, f);
    this.men.forEach((m, i) => {
      const d = crew[i];
      m.mesh.visible = !!d;
      if (d) m.update(d.x, d.z, Math.atan2(cam.position.x - d.x, cam.position.z - d.z),
        d.pose === "carry" ? "walk" : d.pose === "kneel" ? "kneel" : "stand", d.expr, d.look, d.phase, ((t * 1.1) % 2.4) < 0.12 ? 1 : 0);
    });
    const fm = (() => {
      if (id === 1) return { x: 5.4, z: -2.0, rot: 2.5, visible: true, expr: "nervous" };
      if (id === 2) return { x: 8.4, z: -4.0, rot: 2.9, visible: true, expr: "nervous" };
      if (id === 9) return { x: 8.2, z: -3.2, rot: 2.7, visible: true, expr: "relief" };
      return { x: 5.4, z: -2.0, rot: 2.5, visible: false, expr: "neutral" };
    })();
    this.farmer.mesh.visible = fm.visible;
    this.farmer.update(fm.x, fm.z, Math.atan2(cam.position.x - fm.x, cam.position.z - fm.z), "stand", fm.expr, 0.1, 0);

    // truck, gun, dust
    const tr = truckAt(id, f);
    this.truck.visible = tr.visible;
    this.truck.position.set(tr.x, tr.bounce, tr.z);
    this.truck.rotation.y = tr.rot;
    this.truck.rotation.z = Math.sin(t * 7) * 0.01 * tr.speed;

    const gun = gunAt(id, f);
    this.gun.visible = id === 3 || id === 5;
    this.gun.rotation.y = gun.yaw;
    this.gunFlash.visible = gun.flash > 0.5;
    if (this.gunFlash.visible) this.gunFlash.scale.setScalar(0.7 + gun.flash * 0.6);

    // ---- contact shadows (after everything has been posed)
    this.nShadow = 0;
    for (const q of this.shadows) q.visible = false;
    const shade = (x: number, z: number, rx: number, rz: number) => {
      const q = this.shadows[this.nShadow++];
      if (!q) return;
      q.visible = true;
      q.position.set(x, 0.015, z);
      q.scale.set(rx, rz, 1);
    };
    for (const e of this.emus) if (e.mesh.visible) shade(e.mesh.position.x, e.mesh.position.z, 1.5, 0.9);
    if (this.solo.mesh.visible) shade(this.solo.mesh.position.x, this.solo.mesh.position.z, 1.4, 0.85);
    if (this.runner.mesh.visible) shade(this.runner.mesh.position.x, this.runner.mesh.position.z, 1.2, 0.75);
    for (const m of this.men) if (m.mesh.visible) shade(m.mesh.position.x, m.mesh.position.z, 1.0, 0.7);
    if (this.farmer.mesh.visible) shade(this.farmer.mesh.position.x, this.farmer.mesh.position.z, 1.0, 0.7);
    if (this.truck.visible) shade(this.truck.position.x, this.truck.position.z, 2.8, 1.5);
    if (this.crate.visible) shade(A.crate[0], A.crate[1], 1.3, 1.0);

    this.crate.visible = id === 5 || id === 3;
    this.board.visible = id === 5;
    this.paper.visible = id === 9;
    this.permit.visible = id === 9 || id === 10;
    this.hose.visible = id === 7;
    this.gravel.visible = id === 7;


    const dust = dustAt(id, f);
    this.puffs.forEach((p, i) => {
      const d = dust[i];
      p.visible = !!d;
      if (d) {
        p.position.set(d.x, d.y + d.r * 0.5, d.z);
        p.scale.setScalar(d.r);
        (p.material as THREE.MeshBasicMaterial).opacity = d.a;
      }
    });

    void dofAt;
    this.tmp.copy(this.target);
    return this.tmp;
  }
}
