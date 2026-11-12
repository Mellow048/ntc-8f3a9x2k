// Sets of the truck-stop heist short, part 1: what every set shares, the vehicles, the loot, the truck stop, the diner,
// the sleeper cab and the inside of the trailer. Each builder fills a group once and returns a tick that poses it for a
// frame (motion is a pure function of the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, beam, box, cyl, floor, foldTex, grainTex, grp, hop, lamp, lit, mesh, panel, pool, pop, rng, rrect, smat, smooth, soft, tex, text, tiled, tmat, torus, woodTex, type G2, type Node, type V} from './kit';
import {actor, DRIVER} from './cast';
import {glints, halo, mug, signTex, streetLamp} from './props';
import {W, type Shot} from './story';

export type Ctx = {f: number; /** frames since the shot began */ t: number; cam: THREE.PerspectiveCamera; shot: Shot};
export type Light = {sky: string; ground: string; amb: number; key: string; keyI: number; from: V; span: number};
export type SetDef = {tick: (c: Ctx) => void; light: (v: string) => Light};
export type Builder = (root: THREE.Group) => SetDef;

export const LIGHT: Record<'day' | 'room' | 'cold' | 'dark' | 'warm' | 'show' | 'dusk' | 'night', Light> = {
  day: {sky: '#fff4da', ground: '#99aac1', amb: 1.7, key: '#fff0d4', keyI: 2.0, from: [-8, 16, 12], span: 16},
  room: {sky: '#fff1dc', ground: '#8f8aa0', amb: 1.55, key: '#fff3e0', keyI: 1.1, from: [-5, 10, 9], span: 9},
  cold: {sky: '#e6efff', ground: '#8fa3c4', amb: 1.6, key: '#eaf2ff', keyI: 1.0, from: [-3, 10, 8], span: 10},
  dark: {sky: '#9fb0ff', ground: '#3a3f66', amb: 0.8, key: '#cfd8ff', keyI: 0.6, from: [-4, 10, 8], span: 9},
  warm: {sky: '#ffd9a8', ground: '#6a4a4a', amb: 1.05, key: '#ffc98a', keyI: 0.95, from: [-4, 9, 8], span: 8},
  show: {sky: '#bcd0ff', ground: '#3a4466', amb: 1.0, key: '#ffffff', keyI: 1.35, from: [1, 12, 10], span: 9},
  dusk: {sky: '#ffd0a0', ground: '#5a568a', amb: 1.15, key: '#ffb070', keyI: 1.3, from: [-7, 8, 9], span: 14},
  night: {sky: '#aab8ff', ground: '#3a4270', amb: 1.0, key: '#d6deff', keyI: 0.75, from: [-6, 12, 9], span: 16},
};

export const INK = '#15121c';
export const GEMS = ['#ff3b5c', '#2fd07a', '#3f8cff', '#eaf6ff', '#ffd84a', '#c56bff'];
const NIGHT_SKY = ['#070b1c', '#141c3a', '#2b2c4e'];

/** a dashed outline where something used to be */
export const gapTex = (key: string, w: number, h: number, color = '#ffffff', r = 26) => tex('gap-' + key + color, w, h, (g) => {
  g.strokeStyle = color; g.lineWidth = 10; g.setLineDash([26, 18]); g.lineCap = 'round'; rrect(g, 9, 9, w - 18, h - 18, r); g.stroke();
});
/** Rings that leave a point, facing the camera side of the set. Call the returned function every frame. */
export function rings(p: Node, n = 3, color = '#7af0e0') {
  const os = Array.from({length: n}, () => { const o = soft(mesh(p, new THREE.RingGeometry(0.86, 1, 44), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}))); o.renderOrder = 6; return o; });
  return (f: number, on: boolean, at: V, r = 0.5, ry = 0, speed = 0.05) => os.forEach((o, i) => {
    const u = (f * speed + i / n) % 1; o.visible = on; o.position.set(...at); o.rotation.y = ry; o.scale.setScalar(r * (0.2 + 0.8 * u)); (o.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - u) ** 1.4;
  });
}
/** stars and a far ridge for the night exteriors */
export function nightSky(root: THREE.Group, ridgeZ = -24, top = NIGHT_SKY) {
  backdrop(root, top);
  soft(panel(root, 70, 26, smat(tex('stars', 1024, 512, (g, w, h) => { const r = rng(31); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.7})`; const s = 1 + r() * 2.2; g.fillRect(r() * w, r() * h * 0.8, s, s); } }), 1, true), 0, 14, ridgeZ - 6));
  soft(panel(root, 60, 6, smat(tex('ridge-night', 1024, 128, (g, w, h) => {
    const r = rng(17); g.fillStyle = '#10142a'; g.beginPath(); g.moveTo(0, h); let y = h * 0.5;
    for (let x = 0; x <= w; x += 16) { y = Math.max(h * 0.12, Math.min(h * 0.8, y + (r() - 0.5) * 26)); g.lineTo(x, y); } g.lineTo(w, h); g.closePath(); g.fill();
  }), 1, true), 0, 2.6, ridgeZ));
}

// ------------------------------------------------------------------ vehicles
export type Rig = {g: THREE.Group; doors: THREE.Group[]; L: number; FY: number; TH: number; TW: number; tick: (f: number, moving?: boolean) => void};
/** A tractor and a trailer: plain white, no name on it (the real one carried none that the reports describe). The nose
 *  points to +x, the trailer's rear doors are at x = -L, and the origin is on the ground under the trailer's front. */
export function rig(p: Node, o: {len?: number; cab?: string} = {}): Rig {
  const g = grp(p), L = o.len ?? 4.4, TH = 2.0, TW = 1.5, FY = 0.72, CAB = o.cab ?? '#2f4f9a', DARK = '#23252e';
  const side = tmat(tiled(foldTex('rig-side', '#f3f0e8', '#dcd8cc', 16), 3, 1));
  box(g, L + 0.4, TH, TW, side, -L / 2 + 0.2, FY + TH / 2, 0);
  box(g, L + 0.44, 0.08, TW + 0.04, '#c9c5ba', -L / 2 + 0.2, FY + TH + 0.04, 0); box(g, L + 0.44, 0.08, TW + 0.04, '#c9c5ba', -L / 2 + 0.2, FY + 0.02, 0);
  box(g, L, 0.16, TW - 0.3, '#3a3f4a', -L / 2, FY - 0.1, 0);
  const doors = [-1, 1].map((s) => {
    const d = grp(g, -L, FY, s * TW / 2);
    box(d, 0.05, TH - 0.06, TW / 2 - 0.02, '#ece8dd', -0.03, TH / 2, -s * TW / 4);
    box(d, 0.035, TH - 0.2, 0.04, '#8a94a3', -0.07, TH / 2, -s * (TW / 2 - 0.2)); box(d, 0.035, 0.04, 0.2, '#8a94a3', -0.075, TH * 0.4, -s * (TW / 2 - 0.27));
    for (const y of [0.25, 1.0, 1.75]) box(d, 0.05, 0.1, 0.07, '#8a94a3', -0.04, y, -s * 0.03);
    return d;
  });
  box(g, 0.1, 0.12, TW, '#8a94a3', -L - 0.03, 0.46, 0); for (const s of [-1, 1]) { box(g, 0.05, 0.3, 0.05, '#8a94a3', -L - 0.03, 0.58, s * 0.5); box(g, 0.05, 0.12, 0.2, lit('#ff3b30', 1.5), -L - 0.02, FY - 0.1, s * (TW / 2 - 0.14)); }
  for (const x of [-L + 0.62, -L + 1.3]) for (const s of [-1, 1]) { const w = cyl(g, 0.36, 0.3, DARK, x, 0.36, s * (TW / 2 - 0.17)); w.rotation.x = Math.PI / 2; const h = cyl(g, 0.15, 0.32, '#c9ced6', x, 0.36, s * (TW / 2 - 0.165)); h.rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) { box(g, 0.07, 0.5, 0.07, '#5b6170', -0.7, 0.4, s * 0.45); for (let i = 0; i < 5; i++) box(g, 0.1, 0.05, 0.02, lit('#ffb347', 1.7), -L + 0.35 + i * (L - 0.5) / 4, FY + TH - 0.1, s * (TW / 2 + 0.012)); }
  // the tractor: sleeper, cab, hood
  box(g, 2.5, 0.22, 1.0, DARK, 1.55, 0.6, 0);
  box(g, 0.95, 1.8, TW - 0.06, CAB, 0.98, FY + 0.9, 0); box(g, 0.8, 1.45, TW - 0.1, CAB, 1.8, FY + 0.725, 0); box(g, 0.78, 0.82, TW - 0.3, CAB, 2.5, FY + 0.41, 0);
  box(g, 0.9, 0.3, TW - 0.2, CAB, 1.5, FY + 1.87, 0).rotation.z = -0.2;                             // the fairing over the cab
  soft(panel(g, TW - 0.3, 0.6, lit('#1c2433', 1), 2.205, FY + 1.02, 0, Math.PI / 2));                // windscreen
  for (const s of [-1, 1]) {
    soft(panel(g, 0.5, 0.5, lit('#1c2433', 1), 1.86, FY + 1.02, s * (TW / 2 - 0.045), s > 0 ? 0 : Math.PI));
    cyl(g, 0.05, 1.9, '#c9ced6', 1.48, FY + 1.35, s * (TW / 2 + 0.02)); box(g, 0.05, 0.14, 0.24, lit('#fff3c0', 1.8), 2.9, FY + 0.22, s * 0.42);
    const tank = cyl(g, 0.2, 0.7, '#c9ced6', 1.6, 0.52, s * (TW / 2 - 0.16)); tank.rotation.z = Math.PI / 2;
    for (const [x, r] of [[2.5, 0.34], [0.72, 0.36], [1.34, 0.36]] as const) { const w = cyl(g, r, 0.28, DARK, x, r, s * (TW / 2 - 0.16)); w.rotation.x = Math.PI / 2; const h = cyl(g, 0.14, 0.3, '#c9ced6', x, r, s * (TW / 2 - 0.155)); h.rotation.x = Math.PI / 2; }
  }
  box(g, 0.05, 0.6, TW - 0.5, '#c9ced6', 2.9, FY + 0.5, 0); box(g, 0.12, 0.16, TW - 0.1, '#8a94a3', 2.92, 0.5, 0);
  return {g, doors, L, FY, TH, TW, tick: (f, moving = false) => { g.position.y = moving ? 0.014 * Math.sin(f * 0.7) : 0; }};
}
export type Car = {g: THREE.Group; head: THREE.MeshBasicMaterial; tail: THREE.MeshBasicMaterial};
/** a plain saloon car, nose to +x */
export function car(p: Node, color: string): Car {
  const g = grp(p), glass = lit('#1c2433', 1), head = lamp('#fff3c0', 1.8), tail = lamp('#ff3b30', 1.4);
  box(g, 2.0, 0.42, 0.9, color, 0, 0.47, 0); box(g, 1.05, 0.38, 0.82, color, -0.1, 0.86, 0);
  for (const s of [-1, 1]) {
    soft(panel(g, 0.95, 0.27, glass, -0.1, 0.87, s * 0.413, s > 0 ? 0 : Math.PI));
    for (const x of [-0.62, 0.64]) { const w = cyl(g, 0.22, 0.16, '#1b1d24', x, 0.22, s * 0.4); w.rotation.x = Math.PI / 2; const h = cyl(g, 0.1, 0.17, '#c9ced6', x, 0.22, s * 0.41); h.rotation.x = Math.PI / 2; }
    box(g, 0.04, 0.1, 0.2, head, 1.01, 0.5, s * 0.3); box(g, 0.04, 0.09, 0.22, tail, -1.01, 0.52, s * 0.3);
  }
  soft(panel(g, 0.76, 0.28, glass, 0.428, 0.87, 0, Math.PI / 2)); soft(panel(g, 0.76, 0.28, glass, -0.628, 0.87, 0, -Math.PI / 2));
  box(g, 0.06, 0.1, 0.92, '#8a94a3', 1.0, 0.3, 0); box(g, 0.06, 0.1, 0.92, '#8a94a3', -1.0, 0.3, 0);
  return {g, head, tail};
}

// ------------------------------------------------------------------ a bag of jewels
const tagTex = (n: number) => tex('bag-tag-' + n, 150, 100, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.strokeStyle = INK; g.lineWidth = 7; rrect(g, 4, 4, w - 8, h - 8, 10); g.fill(); g.stroke();
  text(g, String(n).padStart(2, '0'), w / 2, 38, 52, INK); g.fillStyle = INK; for (let i = 0; i < 10; i++) g.fillRect(22 + i * 11, 70, i % 3 ? 4 : 7, 16);
});
const CANVAS = '#7d8798';
/** one sealed bag with a numbered tag and a red seal on its neck, facing +z; its origin is under its middle */
export function bag(p: Node, x: number, y: number, z: number, n = 1, s = 1) {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  ball(g, 0.2, CANVAS, 0, 0.145, 0).scale.set(1.08, 0.74, 0.8); cyl(g, 0.045, 0.07, '#6b7586', 0, 0.3, 0, 0.06); const seal = torus(g, 0.05, 0.016, '#d62f2f', 0, 0.285, 0); seal.rotation.x = Math.PI / 2;
  soft(panel(g, 0.17, 0.115, smat(tagTex(n), 1), 0, 0.14, 0.162));
  return g;
}
/** an open bag heaped with jewels */
export function jewelBag(p: Node, x: number, z: number, ry = 0, s = 1) {
  const g = grp(p, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); const r = rng(Math.round(x * 97 + z * 31) + 301);
  ball(g, 0.38, CANVAS, 0, 0.25, 0).scale.set(1.0, 0.66, 0.78); const rim = torus(g, 0.27, 0.035, '#5b6576', 0, 0.44, 0); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 0.72, 1);
  soft(panel(g, 0.2, 0.135, smat(tagTex(1 + Math.round(r() * 60)), 1), 0, 0.2, 0.3));
  const heap = ball(g, 0.27, lit('#f2c230', 1.05), 0, 0.44, 0); heap.scale.set(1.0, 0.42, 0.72);
  const pts: V[] = [];
  for (let i = 0; i < 16; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 0.23, gx = Math.cos(a) * d, gz = Math.sin(a) * d * 0.66, gy = 0.52 + 0.09 * (1 - d / 0.23) + r() * 0.03, c = GEMS[i % GEMS.length];
    if (i % 5 === 4) { const t = torus(g, 0.055, 0.016, lit('#ffd84a', 1.3), gx, gy, gz); t.rotation.set(r() * 3, r() * 3, 0); }
    else { const m = mesh(g, new THREE.OctahedronGeometry(0.05 + r() * 0.035), lit(c, 1.5), gx, gy, gz); m.rotation.set(r() * 3, r() * 3, r() * 3); if (i % 3 === 0) pts.push([gx, gy + 0.05, gz + 0.05]); }
  }
  return {g, tw: glints(g, pts)};
}

// ------------------------------------------------------------------ the loot: what vanished
export const loot: Builder = (root) => {
  backdrop(root, ['#07090f', '#161c30']);
  floor(root, 14, 12, tmat(tiled(grainTex('loot-floor', '#1b2236', 0.1), 5, 4)));
  halo(root, 3.0, '#ffe9b0', 0.14, 0, 1.0, -1.6);
  const cone = beam(root, 0.16, 1.5, 5.6, '#fff0c8', 0.04, 0, 5.6, 0), spot = pool(root, 1.9, '#fff0c8', 0.4, 0, 0);
  const SPOTS: [number, number, number][] = [[-0.78, 0.25, 0.3], [0.02, -0.3, -0.12], [0.8, 0.2, -0.32]];
  const bags = SPOTS.map(([x, z, ry]) => jewelBag(root, x, z, ry, 1.15));
  const gaps = SPOTS.map(([x, z, ry]) => { const m = soft(panel(root, 0.95, 0.66, smat(gapTex('loot', 380, 264), 1, true), x, 0.02, z)); m.rotation.set(-Math.PI / 2, 0, ry); return m; });
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.2, keyI: 0.9}),
    tick: ({f, shot}) => {
      // on "vanished" they are gone, one after another, and only the marks on the floor are left
      const gone = shot.v === 'pile' ? W(8) : 1e9;
      bags.forEach((b, i) => { const at = gone + i * 3, k = f < at ? 1 + 0.03 * Math.sin(f * 0.2 + i) : Math.max(0, 1 - (f - at) / 3); b.g.visible = k > 0.02; b.g.scale.setScalar(1.15 * k); b.g.position.y = f < at ? hop(f, shot.at + 4 + i * 5, 0.05, 8) : 0.3 * (1 - k); b.tw(f + i * 17, k > 0.9); });
      gaps.forEach((m, i) => { const at = gone + i * 3 + 2; m.visible = f >= at; m.scale.setScalar(pop(f, at, 7)); });
      const k = f < gone ? 1 : 0.55; (cone.material as THREE.MeshBasicMaterial).opacity = 0.04 * k; (spot.material as THREE.MeshBasicMaterial).opacity = 0.4 * k;
    },
  };
};

// ------------------------------------------------------------------ the truck stop (no likeness of the real one; the place name is real)
const clockFace = (t: string) => tex('stop-clock-' + t, 520, 200, (g, w, h) => {
  g.fillStyle = '#0d0f14'; g.fillRect(0, 0, w, h); g.shadowColor = '#ffb020'; g.shadowBlur = 20; text(g, t, w / 2 - 54, h / 2 + 8, 150, '#ffc94a'); text(g, 'A.M.', w - 84, h / 2 + 38, 54, '#ffc94a'); g.shadowBlur = 0;
});
export const RIG_AT: V = [1.0, 0, -3.4];
export const RIG_RY = 1.05;
const TIMES = ['2:05', '2:08', '2:11', '2:14', '2:17', '2:20', '2:23', '2:26', '2:29', '2:32'];
export const stop: Builder = (root) => {
  nightSky(root);
  floor(root, 60, 50, tmat(tiled(grainTex('stop-tar', '#2b2f3c', 0.12), 16, 14)));
  for (let i = -5; i <= 5; i++) { const m = floor(root, 0.1, 7, lit('#8a8f9c', 1), 0.014, i * 2.4 + 0.4, 1.5); m.rotation.z = -0.5; }
  // the travel center: a low building with a lit diner and a canopy
  box(root, 13, 2.7, 2.4, '#3a4058', 0.5, 1.35, -11.7); box(root, 13.4, 0.3, 3.2, '#c9372c', 0.5, 2.85, -11.4); box(root, 13.2, 0.06, 3.0, lit('#fff0c8', 1.25), 0.5, 2.68, -11.4);
  soft(panel(root, 11.4, 1.25, smat(tex('stop-windows', 1024, 140, (g, w, h) => {
    g.fillStyle = '#ffd98a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a4058'; for (let i = 0; i <= 8; i++) g.fillRect(i * w / 8 - 7, 0, 14, h); g.fillRect(0, h * 0.62, w, 9);
    g.fillStyle = '#b9742f'; for (let i = 0; i < 8; i++) { g.fillRect(i * w / 8 + 26, h * 0.7, 74, h * 0.3); }
  }), 1.2), 0.5, 1.45, -10.48));
  soft(panel(root, 2.4, 0.5, smat(signTex('stop-diner', 480, 100, '#16181f', '#ff7a59', [['DINER · OPEN 24 HRS', 64, 0.56]], {glow: '#ff7a59'}), 1.5), 3.6, 3.3, -10.5));
  // the tall sign: a name, and a clock under it
  const SX = -2.4, SZ = -8;
  cyl(root, 0.1, 4.9, '#5b6170', SX, 2.45, SZ); box(root, 2.56, 1.0, 0.22, '#23252e', SX, 4.35, SZ); box(root, 1.86, 0.74, 0.2, '#23252e', SX, 3.44, SZ);
  soft(panel(root, 2.42, 0.86, smat(signTex('stop-sign', 720, 256, '#d62f2f', '#ffe14a', [['TRAVEL CENTER', 104, 0.38], ['LEBEC · CALIFORNIA', 46, 0.78]], {border: '#ffe14a'}), 1.3), SX, 4.35, SZ + 0.115));
  const clockM = new THREE.MeshBasicMaterial({map: clockFace(TIMES[0])}), faces = TIMES.map(clockFace); soft(panel(root, 1.72, 0.6, clockM, SX, 3.44, SZ + 0.105));
  streetLamp(root, 3.4, -1.4, 3.6, '#ffe9b0', 2.2); pool(root, 2.6, '#ffe9b0', 0.3, 3.4, -1.4); streetLamp(root, -3.9, -4.6, 3.6, '#ffe9b0', 2.2); pool(root, 2.6, '#ffe9b0', 0.26, -3.9, -4.6);
  // other rigs asleep in the lot: dark shapes with a few marker lights
  for (const [x, z, ry] of [[-5.8, -6.6, 1.05], [6.6, -7.8, 1.05], [-8.2, -1.8, 1.05]] as const) {
    const o = grp(root, x, 0, z); o.rotation.y = ry; box(o, 4.6, 2.0, 1.5, '#262a3a', -2.1, 1.72, 0); box(o, 1.7, 1.9, 1.4, '#1f2233', 1.2, 1.3, 0);
    for (let i = 0; i < 4; i++) box(o, 0.1, 0.05, 0.02, lit('#ffb347', 1.4), -4.0 + i * 1.3, 2.62, 0.76);
  }
  const truck = rig(root); truck.g.rotation.y = RIG_RY;
  const nose = new THREE.Vector3(Math.cos(RIG_RY), 0, -Math.sin(RIG_RY)), rear = new THREE.Vector3(...RIG_AT).addScaledVector(nose, -truck.L);
  pool(root, 2.2, '#dfe6ff', 0.2, rear.x - 0.3, rear.z + 0.7);
  // the lock, cut, on the ground behind the doors
  const lock = grp(root, rear.x - 0.42, 0, rear.z + 0.62); lock.rotation.y = 0.5;
  const lb = grp(lock, 0, 0.07, 0); lb.rotation.set(-1.05, 0, 0.35); box(lb, 0.34, 0.26, 0.09, '#f2c230', 0, 0, 0); box(lb, 0.27, 0.19, 0.02, '#d9a520', 0, 0, 0.046); cyl(lb, 0.035, 0.03, INK, 0, 0.02, 0.055).rotation.x = Math.PI / 2; box(lb, 0.03, 0.08, 0.02, INK, 0, -0.04, 0.058);
  for (const [x, y, rz] of [[-0.3, 0.04, 1.2], [0.27, 0.035, -0.3]] as const) { const t = mesh(lock, new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI * 0.8), '#c9ced6', x, y, 0.06); t.rotation.set(-1.3, 0, rz); }
  const spark = glints(lock, [[0.02, 0.3, 0.1], [-0.2, 0.16, 0.12], [0.22, 0.14, 0.1]]);
  return {
    light: () => ({...LIGHT.night, amb: 1.2, keyI: 0.9}),
    tick: ({f, shot}) => {
      const v = shot.v;
      // the clock on the sign: 2:05 when the truck pulls in; it runs to 2:32 while the narrator says "twenty-seven minutes"
      let k = 0; if (v === 'wide') k = Math.min(9, Math.floor(10 * smooth(f, W(13) - 2, W(14) + 14) * 0.999)); if (v === 'lock') k = 9;
      clockM.map = faces[k];
      const s = v === 'arrive' ? 7.5 * (1 - smooth(f, shot.at - 6, shot.at + 30)) : 0;
      truck.g.position.set(RIG_AT[0] - nose.x * s, 0, RIG_AT[2] - nose.z * s); truck.tick(f, s > 0.05);
      const open = v === 'lock' ? 0.55 + 0.03 * Math.sin(f * 0.2) : 0; truck.doors[1].rotation.y = -open;
      lock.visible = v === 'lock'; lock.position.y = hop(f, shot.at, 0.12, 9) + hop(f, shot.at + 9, 0.04, 6); spark(f, v === 'lock');
    },
  };
};

// ------------------------------------------------------------------ the diner, seen from behind the counter
export const CLOCK: V = [1.0, 2.42, -2.36];
export const diner: Builder = (root) => {
  backdrop(root, ['#3a2a22', '#5a4030']);
  floor(root, 12, 10, tmat(tiled(tex('diner-floor', 128, 128, (g) => { g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#2f3a4a'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); }, true), 8, 7)));
  box(root, 12, 4.2, 0.2, '#b9543a', 0, 2.1, -2.5); box(root, 12, 1.1, 0.24, '#7a3a2a', 0, 0.55, -2.46);
  // the window on the lot: the truck is out there
  box(root, 2.5, 1.5, 0.1, '#f3ead8', -0.75, 1.95, -2.42);
  soft(panel(root, 2.3, 1.3, smat(tex('diner-window', 640, 360, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1030'); gr.addColorStop(1, '#27304f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c2033'; g.fillRect(0, h * 0.74, w, h * 0.26);
    g.fillStyle = '#f1eee6'; g.fillRect(150, h * 0.34, 330, h * 0.3); g.fillStyle = '#2f4f9a'; g.fillRect(480, h * 0.4, 96, h * 0.24); g.fillStyle = '#15121c'; for (const x of [200, 250, 420, 530]) { g.beginPath(); g.arc(x, h * 0.68, 22, 0, 7); g.fill(); }
    g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(70, 70, 16, 0, 7); g.fill(); g.fillStyle = 'rgba(255,233,176,0.18)'; g.beginPath(); g.moveTo(70, 70); g.lineTo(0, h * 0.8); g.lineTo(200, h * 0.8); g.closePath(); g.fill();
    g.fillStyle = '#f3ead8'; g.fillRect(w / 2 - 6, 0, 12, h);
  }), 1), -0.75, 1.95, -2.36));
  // the wall clock
  const cg = grp(root, ...CLOCK); const rim = cyl(cg, 0.4, 0.06, '#23252e', 0, 0, 0); rim.rotation.x = Math.PI / 2;
  soft(panel(cg, 0.72, 0.72, smat(tex('diner-clock', 360, 360, (g, w) => {
    g.fillStyle = '#fffdf4'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 4, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? 150 : 138; g.strokeStyle = INK; g.lineWidth = i % 3 ? 6 : 12; g.beginPath(); g.moveTo(w / 2 + r0 * Math.sin(a), w / 2 - r0 * Math.cos(a)); g.lineTo(w / 2 + 168 * Math.sin(a), w / 2 - 168 * Math.cos(a)); g.stroke(); }
    for (const [n, a] of [['12', 0], ['3', 90], ['6', 180], ['9', 270]] as const) text(g, n, w / 2 + 112 * Math.sin(a * Math.PI / 180), w / 2 - 112 * Math.cos(a * Math.PI / 180) + 4, 54, INK);
  }), 1.05, true), 0, 0, 0.04));
  const hour = grp(cg, 0, 0, 0.05), minute = grp(cg, 0, 0, 0.06);
  soft(box(hour, 0.05, 0.2, 0.01, lit(INK, 1), 0, 0.09, 0)); soft(box(minute, 0.035, 0.3, 0.01, lit('#e3342f', 1), 0, 0.14, 0)); soft(cyl(cg, 0.03, 0.02, lit(INK, 1), 0, 0, 0.07)).rotation.x = Math.PI / 2;
  soft(panel(root, 1.5, 0.5, smat(signTex('diner-menu', 450, 150, '#1f2a24', '#f3f1ea', [['BURGER · FRIES · COFFEE', 50, 0.36], ['OPEN ALL NIGHT', 40, 0.74]], {font: 'Montserrat'}), 1), -2.9, 3.0, -2.38));
  // a booth behind him, and the counter in front of us
  box(root, 1.5, 1.0, 0.5, '#b9302a', -2.4, 0.5, -1.7); box(root, 1.1, 0.06, 0.7, '#e9e2d0', -2.4, 0.78, -0.9);
  box(root, 6, 0.08, 0.9, '#f3ead8', 0, 1.02, 1.25); box(root, 6, 0.06, 0.94, '#c9372c', 0, 0.96, 1.25); box(root, 6, 0.96, 0.7, '#8fa3b8', 0, 0.48, 1.3);
  for (const x of [-1.5, 0, 1.5]) { cyl(root, 0.05, 0.7, '#c9ced6', x, 0.35, 0.35); cyl(root, 0.24, 0.1, '#c9372c', x, 0.72, 0.35); }
  // his plate: a burger and fries; a coffee; ketchup
  const plate = grp(root, 0.05, 1.06, 1.05);
  cyl(plate, 0.26, 0.025, '#fffdf4', 0, 0.012, 0); const fries = grp(plate, 0.13, 0.03, 0.02); const q = rng(9); for (let i = 0; i < 9; i++) { const fr = box(fries, 0.025, 0.14, 0.025, '#f2c230', (q() - 0.5) * 0.12, 0.06, (q() - 0.5) * 0.1); fr.rotation.set((q() - 0.5) * 0.9, 0, (q() - 0.5) * 0.9); }
  const burger = grp(plate, -0.1, 0.03, 0); ball(burger, 0.11, '#d9a45a', 0, 0.02, 0).scale.y = 0.4; cyl(burger, 0.115, 0.035, '#6a3d24', 0, 0.06, 0); cyl(burger, 0.125, 0.012, '#6fbf5a', 0, 0.085, 0); ball(burger, 0.115, '#e0b06a', 0, 0.1, 0).scale.y = 0.62;
  mug(root, 0.62, 1.06, 1.1, '#fffdf4'); cyl(root, 0.035, 0.16, '#d62f2f', -0.5, 1.14, 1.2, 0.02); box(root, 0.16, 0.12, 0.1, '#c9ced6', -0.8, 1.12, 1.15);
  halo(root, 2.4, '#ffd9a0', 0.1, 0, 2.6, -2.0);
  const man = actor(root, DRIVER(0), {idle: {expr: 'neutral', mode: 'sit'}, bite: {expr: 'lick', pose: 'hold', prop: 'burger', mode: 'sit'}, chew: {expr: 'smile_closed', pose: 'hold', prop: 'burger', mode: 'sit'}, walk: {expr: 'smile', mode: 'march'}, sit: {expr: 'grin', mode: 'sit'}}, 0, 0, 0.3, {scale: 1.0, res: 1.1, wide: true});
  return {
    light: () => LIGHT.warm,
    tick: ({f, cam, shot}) => {
      const v = shot.v, t = f - shot.at;
      // 2:05 on the wall clock; in the close shot it runs to 2:32
      const m = v === 'clock' ? 5 + 27 * smooth(f, shot.at + 2, shot.at + 24) : v === 'eat' ? 12 : 5;
      minute.rotation.z = -m / 60 * Math.PI * 2; hour.rotation.z = -(2 + m / 60) / 12 * Math.PI * 2;
      let x = 0, z = 0.3, st = 'idle', own = false;
      if (v === 'eat') { st = Math.floor(t / 9) % 2 ? 'chew' : 'bite'; own = true; }
      else if (v === 'in') { const k = smooth(f, shot.at - 4, shot.at + 22); x = -2.3 + 2.3 * k; z = -1.0 + 1.3 * k; st = k < 0.98 ? 'walk' : 'sit'; }
      else { st = Math.floor(f / 9) % 2 ? 'chew' : 'bite'; own = true; }
      man.node.position.set(x, st === 'walk' ? 0 : 0.36, z); man.show(st); man.tick(f, cam);
      burger.visible = !own; plate.visible = v !== 'in' || t > 24; plate.position.x = 0.05 + (v === 'in' ? 2.2 * (1 - smooth(f, shot.at + 24, shot.at + 34)) : 0);
    },
  };
};

// ------------------------------------------------------------------ the sleeper: a cab with its side cut away
const zTex = () => tex('zzz', 120, 120, (g) => text(g, 'Z', 60, 64, 110, '#ffffff', {stroke: INK, sw: 16}));
export const cab: Builder = (root) => {
  nightSky(root, -20);
  floor(root, 40, 30, tmat(tiled(grainTex('cab-tar', '#2b2f3c', 0.12), 14, 10)));
  pool(root, 3.2, '#ffe9b0', 0.2, 1.2, 1.4);
  const BLUE = '#4a72c9', IN = lit('#7a6052', 1), Y0 = 0.95;
  // wheels, frame, tank, the front of the trailer behind
  box(root, 5.4, 0.24, 1.0, '#23252e', 0.4, 0.74, -0.5);
  for (const [x, r] of [[-1.25, 0.46], [-0.2, 0.46], [2.45, 0.44]] as const) { const w = cyl(root, r, 0.34, '#1b1d24', x, r, 0.02); w.rotation.x = Math.PI / 2; const h = cyl(root, 0.18, 0.36, '#c9ced6', x, r, 0.03); h.rotation.x = Math.PI / 2; }
  const tank = cyl(root, 0.24, 0.9, '#c9ced6', 1.2, 0.62, 0.06); tank.rotation.z = Math.PI / 2;
  box(root, 1.6, 2.9, 1.5, tmat(tiled(foldTex('cab-trailer', '#f3f0e8', '#dcd8cc', 8), 1, 1)), -2.75, 2.4, -0.55); cyl(root, 0.06, 2.6, '#c9ced6', -1.82, 2.2, 0.16);
  // the sleeper box with no near wall: back wall, floor, roof, ends
  box(root, 1.9, 2.1, 0.08, IN, -0.72, Y0 + 1.05, -1.0); box(root, 2.0, 0.1, 1.2, BLUE, -0.72, Y0 - 0.02, -0.42); box(root, 2.0, 0.12, 1.2, BLUE, -0.72, Y0 + 2.14, -0.42);
  box(root, 0.1, 2.2, 1.2, BLUE, -1.72, Y0 + 1.05, -0.42); box(root, 0.08, 0.9, 1.2, BLUE, 0.26, Y0 + 1.72, -0.42);
  soft(panel(root, 0.5, 1.25, tmat(tiled(foldTex('cab-curtain', '#8a5a6a', '#5a3442', 6), 1, 1)), 0.2, Y0 + 0.66, 0.12));   // the curtain, pushed back
  box(root, 1.72, 0.2, 0.8, '#e9e2d0', -0.76, Y0 + 0.25, -0.5); box(root, 1.76, 0.12, 0.84, '#6b4628', -0.76, Y0 + 0.1, -0.5);
  const pillow = ball(root, 0.2, '#fffdf4', -1.12, Y0 + 0.42, -0.5); pillow.scale.set(2.2, 0.5, 1.5);
  const blanket = box(root, 0.98, 0.3, 0.86, tmat(tiled(tex('cab-plaid', 64, 64, (g) => { g.fillStyle = '#3f6fb5'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 26, 64, 10); g.fillRect(26, 0, 10, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 54, 64, 6); g.fillRect(54, 0, 6, 64); }, true), 6, 2)), -0.13, Y0 + 0.5, -0.36);
  soft(panel(root, 0.5, 0.36, lit('#ffd98a', 1.15), -1.2, Y0 + 1.5, -0.955)); box(root, 0.56, 0.42, 0.04, '#3a2c22', -1.2, Y0 + 1.5, -0.97);   // a little window with the lot's light in it
  // the cab in front: seat, wheel, windscreen, hood
  box(root, 1.1, 0.1, 1.2, BLUE, 0.85, Y0 - 0.02, -0.42); box(root, 1.1, 0.12, 1.2, BLUE, 0.85, Y0 + 1.68, -0.42); box(root, 1.1, 1.6, 0.08, IN, 0.85, Y0 + 0.8, -1.0);
  box(root, 0.5, 0.14, 0.5, '#8a94a8', 0.72, Y0 + 0.42, -0.45); box(root, 0.14, 0.7, 0.5, '#8a94a8', 0.5, Y0 + 0.8, -0.45); box(root, 0.1, 0.3, 0.1, '#5b6170', 0.72, Y0 + 0.2, -0.45);
  const wheel = torus(root, 0.2, 0.035, '#c9ced6', 1.22, Y0 + 0.86, -0.45); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0.5; box(root, 0.3, 0.5, 0.9, '#3d4450', 1.36, Y0 + 0.36, -0.45);
  box(root, 0.06, 1.0, 1.2, lit('#27304f', 1), 1.42, Y0 + 1.1, -0.42).rotation.z = -0.22; box(root, 1.1, 1.0, 1.1, BLUE, 2.05, Y0 + 0.4, -0.47); box(root, 0.08, 0.7, 0.9, '#c9ced6', 2.62, Y0 + 0.45, -0.47);
  box(root, 0.08, 0.16, 0.3, lit('#fff3c0', 1.6), 2.63, Y0 + 0.16, -0.1);
  halo(root, 1.3, '#ffd98a', 0.16, -0.8, Y0 + 1.1, -0.9);
  const man = actor(root, DRIVER(1), {a: {expr: 'neutral', blink: true}}, 0.3, Y0 + 0.56, -0.2, {scale: 0.86, res: 1.1, still: true, shadow: 0}); man.mesh.rotation.z = Math.PI / 2;
  const zs = [0, 1, 2].map(() => soft(panel(root, 0.3, 0.3, smat(zTex(), 1.1, true), 0, 0, 0)));
  const seat = soft(panel(root, 0.62, 0.95, smat(gapTex('seat', 250, 380, '#ffe14a'), 1.1, true), 0.74, Y0 + 0.9, -0.1));
  return {
    light: () => ({...LIGHT.night, amb: 1.7, keyI: 1.1}),
    tick: ({f, cam, shot}) => {
      man.tick(f, cam); man.node.rotation.y = 0; blanket.scale.y = 1 + 0.05 * Math.sin(f * 0.11);
      zs.forEach((z, i) => { const u = (f * 0.022 + i / 3) % 1; z.position.set(-1.2 + 0.5 * u + 0.06 * Math.sin(u * 9 + i), Y0 + 0.85 + 0.7 * u, 0.1); z.scale.setScalar(0.5 + 0.9 * u); (z.material as THREE.MeshBasicMaterial).opacity = Math.min(1, u * 5) * (1 - u) ** 0.7; (z.material as THREE.MeshBasicMaterial).transparent = true; z.rotation.z = -0.25; });
      seat.visible = shot.v === 'alone' && f >= shot.at + 8; seat.scale.setScalar(pop(f, shot.at + 8, 8));
    },
  };
};

// ------------------------------------------------------------------ inside the trailer: seventy-three bags, then the marks of twenty-four
export const COLS = 4, ROWS = 6;
export const trailer: Builder = (root) => {
  backdrop(root, ['#0b0d14', '#161a24']);
  const wall = tmat(tiled(foldTex('trailer-wall', '#d9d5ca', '#aaa59a', 10), 2, 1), '#c9c9d6');
  floor(root, 2.6, 9, tmat(tiled(woodTex('trailer-floor', '#8a6a48', '#4a3622'), 2, 6)), 0, 0, -1.6);
  for (const s of [-1, 1]) { const w = panel(root, 9, 3.2, wall, s * 1.3, 1.6, -1.6, -s * Math.PI / 2); w.receiveShadow = true; }
  panel(root, 2.6, 3.2, wall, 0, 1.6, -5.4); const roof = floor(root, 2.6, 9, lit('#3a3f4a', 1), 3.2, 0, -1.6); roof.rotation.x = Math.PI / 2;
  for (const z of [-0.4, -2.6]) box(root, 0.9, 0.04, 0.16, lit('#f3f6ff', 1.5), 0, 3.17, z);
  // three layers of bags, four across and six high; the front layer is the twenty-four
  const DX = 0.47, DY = 0.335, X0 = -DX * (COLS - 1) / 2, front: THREE.Group[] = [], marks: THREE.Mesh[] = [];
  for (let layer = 0; layer < 3; layer++) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = X0 + c * DX, y = 0.04 + r * DY, z = -1.3 - layer * 0.42, b = bag(root, x, y, z, 1 + ((r * COLS + c + layer * 24) % 73), 1.08);
    if (layer === 0) { front.push(b); const m = soft(panel(root, 0.44, 0.3, smat(gapTex('bag', 220, 150, '#ffe14a', 18), 1.15, true), x, y + 0.15, z + 0.17)); marks.push(m); }
  }
  const moon = pool(root, 1.5, '#dfe6ff', 0.3, 0.3, 0.2); moon.scale.set(0.7, 1, 1.6);
  return {
    light: (v) => v === 'gone' ? {...LIGHT.dark, sky: '#c6d0ff', amb: 1.25, keyI: 0.7} : {...LIGHT.cold, amb: 1.45},
    tick: ({f, shot}) => {
      const gone = shot.v === 'gone';
      front.forEach((b) => { b.visible = !gone; });
      marks.forEach((m, i) => { const at = shot.at - 2 + Math.floor(i / COLS) * 2; m.visible = gone; m.scale.setScalar(gone ? pop(f, at, 6) : 1); });
      moon.visible = gone;
    },
  };
};
