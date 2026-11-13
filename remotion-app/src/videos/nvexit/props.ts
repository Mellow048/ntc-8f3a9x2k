// Furniture and set dressing shared by several sets of the Nvidia exit short (taken over from the earlier news shorts).
import * as THREE from 'three';
import {NOINK} from '../pendulum/ink';
import {ball, box, cone, cyl, grp, lamp, lerp, lit, mesh, panel, rod, rng, rrect, slab, smat, soft, tex, text, tiled, torus, vgrad, type G2, type Node, type V} from './kit';

export function plant(p: Node, x: number, z: number, s = 1, pot = '#c9c2b4') {
  const g = grp(p, x, 0, z); g.scale.setScalar(s);
  cyl(g, 0.2, 0.42, pot, 0, 0.21, 0, 0.26);
  rod(g, [0, 0.4, 0], [0, 1.0, 0], 0.03, '#5a4a36');
  for (let i = 0; i < 6; i++) { const a = i * 1.05, l = ball(g, 0.3, i % 2 ? '#3f8a52' : '#57a565', 0.26 * Math.cos(a), 0.95 + (i % 3) * 0.2, 0.26 * Math.sin(a)); l.scale.set(1, 1.25, 0.8); }
  return g;
}

export function streetLamp(p: Node, x: number, z: number, h = 3.2, glow = '#ffe9b0', k = 2) {
  cyl(p, 0.12, 0.2, '#3d4450', x, 0.1, z); cyl(p, 0.05, h, '#4b5361', x, h / 2, z);
  box(p, 0.3, 0.06, 0.3, '#3d4450', x, h + 0.02, z);
  ball(p, 0.19, lit(glow, k), x, h + 0.22, z).scale.y = 1.2;
  box(p, 0.22, 0.05, 0.22, '#3d4450', x, h + 0.47, z);
}

/** flat screen on a foot; returns the screen mesh so a set can swap or pulse it */
export function monitor(p: Node, x: number, y: number, z: number, w: number, h: number, screen: THREE.Material, ry = 0) {
  const g = grp(p, x, y, z); g.rotation.y = ry;
  box(g, w + 0.06, h + 0.06, 0.04, '#191b22', 0, h / 2 + 0.16, 0);
  const s = panel(g, w, h, screen, 0, h / 2 + 0.16, 0.022);
  box(g, 0.06, 0.18, 0.04, '#2a2d36', 0, 0.09, -0.02); box(g, 0.26, 0.02, 0.16, '#2a2d36', 0, 0.01, 0);
  return s;
}

export function officeChair(p: Node, x: number, z: number, c = '#2b2f3a', ry = 0) {
  const g = grp(p, x, 0, z); g.rotation.y = ry;
  box(g, 0.52, 0.09, 0.5, c, 0, 0.5, 0); box(g, 0.5, 0.66, 0.08, c, 0, 0.9, -0.24);
  cyl(g, 0.035, 0.42, '#6b7280', 0, 0.25, 0);
  for (let i = 0; i < 5; i++) { const a = i * 1.257; rod(g, [0, 0.06, 0], [0.3 * Math.cos(a), 0.04, 0.3 * Math.sin(a)], 0.025, '#3b404c'); }
  return g;
}

export function mug(p: Node, x: number, y: number, z: number, c = '#f3f1ea') { cyl(p, 0.045, 0.1, c, x, y + 0.05, z); cyl(p, 0.037, 0.012, '#4a2f20', x, y + 0.1, z); }

/** skyline seen through a window: dusk / day / night */
export const skylineTex = (key: string, top: string, bottom: string, building: string, windows: string, seed = 7) => tex('skyline-' + key, 1024, 512, (g, w, h) => {
  vgrad(g, w, h, [top, bottom]); const r = rng(seed);
  for (let layer = 0; layer < 2; layer++) {
    g.globalAlpha = layer ? 1 : 0.55;
    for (let x = -20; x < w;) {
      const bw = 50 + r() * 90, bh = (layer ? 120 : 190) + r() * (layer ? 190 : 220);
      g.fillStyle = building; g.fillRect(x, h - bh, bw, bh);
      g.fillStyle = windows; for (let yy = h - bh + 12; yy < h - 8; yy += 18) for (let xx = x + 8; xx < x + bw - 10; xx += 14) if (r() < 0.46) g.fillRect(xx, yy, 7, 9);
      x += bw + 4 + r() * 20;
    }
  }
  g.globalAlpha = 1;
});

/** a line of text painted on a board: lit signs, plaques, labels */
export function signTex(key: string, w: number, h: number, bg: string, fg: string, lines: [string, number, number?][], o: {border?: string; font?: 'Anton' | 'Montserrat'; glow?: string} = {}) {
  return tex('sign-' + key, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(4, h * 0.05); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
    for (const [s, size, y] of lines) {
      if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * 0.35; }
      text(g, s, w / 2, (y ?? 0.5) * h, size, fg, {font: o.font, maxWidth: w * 0.9});
      g.shadowBlur = 0;
    }
  });
}

/** a lectern with a plaque and two microphones */
export function lectern(p: Node, x: number, z: number, wood: string, plaque: THREE.Texture) {
  const g = grp(p, x, 0, z);
  box(g, 1.0, 0.1, 0.62, wood, 0, 0.05, 0); box(g, 0.78, 1.12, 0.46, wood, 0, 0.64, 0); box(g, 1.0, 0.07, 0.6, wood, 0, 1.24, 0).rotation.x = 0.16;
  panel(g, 0.58, 0.21, smat(plaque, 1.05), 0, 1.05, 0.235);
  for (const s of [-1, 1]) { rod(g, [s * 0.3, 1.26, -0.08], [s * 0.36, 1.5, 0.06], 0.014, '#2b2d38'); const m = ball(g, 0.05, '#3a3f4a', s * 0.36, 1.52, 0.07); m.scale.set(1, 1.3, 1); }
  return g;
}

// ------------------------------------------------------------------ money
export const GOLD = '#f2c230';
const coinSide = () => tex('coin-side', 64, 32, (g, w, h) => {
  g.fillStyle = '#e9ad0c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffd94f'; g.fillRect(0, 3, w, 9);
  g.fillStyle = '#8a6208'; g.fillRect(0, h - 6, w, 6);
  g.fillStyle = 'rgba(138,98,8,.45)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 12, 2, h - 18);    // milled edge
}, true);
const coinFace = () => tex('coin-face', 128, 128, (g, w) => {
  g.fillStyle = '#ffd94f'; g.fillRect(0, 0, w, w);
  g.strokeStyle = '#b07f0a'; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 47, 0, 7); g.stroke();
  g.fillStyle = '#8a6208'; for (const x of [56, 70]) { g.fillRect(x, 26, 6, 14); g.fillRect(x, 88, 6, 14); }                     // the two strokes of the bitcoin sign
  text(g, 'B', 64, 66, 62, '#8a6208');
});
const stackMats = new Map<number, THREE.Material[]>();
/** a pile of n coins standing on (x, y, z). Lower it into the floor to take coins away: the ridges keep their size. */
export function coinStack(p: Node, x: number, y: number, z: number, n: number, r = 0.12) {
  const t = 0.3 * r;
  let m = stackMats.get(n);
  if (!m) {
    const glow = new THREE.Color('#4a3600');
    const top = new THREE.MeshLambertMaterial({map: coinFace(), emissive: glow});
    stackMats.set(n, (m = [new THREE.MeshLambertMaterial({map: tiled(coinSide(), 5, n), emissive: glow}), top, top]));
  }
  const geo = new THREE.CylinderGeometry(r, r, n * t, 22); geo.translate(0, n * t / 2, 0);
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; o.userData = {h: n * t, y}; p.add(o);
  return o;
}
/** how much of a pile is left: 1 = all of it, 0 = none */
export const level = (stack: THREE.Mesh, k: number) => { stack.position.y = stack.userData.y - (1 - Math.max(0, Math.min(1, k))) * (stack.userData.h + 0.02); stack.visible = k > 0.004; };
let flying: THREE.Material[] | null = null;
const coinGeo = new Map<number, THREE.BufferGeometry>();
/** one coin on edge, facing the camera */
export function coin(p: Node, r = 0.1) {
  if (!flying) { const face = new THREE.MeshBasicMaterial({map: coinFace()}); flying = [lit('#d9a40a', 1), face, face]; }
  let geo = coinGeo.get(r); if (!geo) { geo = new THREE.CylinderGeometry(r, r, r * 0.26, 18); geo.rotateX(Math.PI / 2); coinGeo.set(r, geo); }
  const o = new THREE.Mesh(geo, flying); o.castShadow = false; p.add(o); return o;
}
const frac = (x: number) => x - Math.floor(x);
/** coins that fly one after another along an arc */
export function coinStream(p: Node, n: number, r = 0.085) {
  const cs = Array.from({length: n}, () => coin(p, r));
  return {
    /** Coins leave between frames f0 and f1; each flies from `from(i)` over `via` to `to(i)` in 1 / speed frames. */
    set(f: number, f0: number, f1: number, from: (i: number) => V, via: V, to: (i: number) => V, speed = 0.03) {
      cs.forEach((c, i) => {
        const ph = frac(Math.sin(i * 12.9898) * 43758.5453), turn = Math.floor(f * speed + ph), left = (turn - ph) / speed, u = frac(f * speed + ph);
        c.visible = left >= f0 && left <= f1;
        if (!c.visible) return;
        const A = from(i), C = to(i), a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u;
        c.position.set(a * A[0] + b * via[0] + d * C[0], a * A[1] + b * via[1] + d * C[1], a * A[2] + b * via[2] + d * C[2]);
        c.rotation.set(0, f * 0.33 + i * 1.3, 0.35 * Math.sin(i * 2.1));
        c.scale.setScalar(Math.min(1, u * 9) * (1 - 0.6 * Math.max(0, (u - 0.82) / 0.18)));
      });
    },
    hide() { cs.forEach((c) => { c.visible = false; }); },
  };
}
/** four-point glints that come and go on gold */
export function glints(p: Node, pts: V[]) {
  const t = tex('glint', 64, 64, (g) => { g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 5 : 31; g.lineTo(32 + r * Math.cos(a), 32 + r * Math.sin(a)); } g.closePath(); g.fill(); });
  const ms = pts.map(([x, y, z]) => soft(panel(p, 0.26, 0.26, new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, color: new THREE.Color('#fff6c8').multiplyScalar(1.5)}), x, y, z)));
  return (f: number, on: boolean) => ms.forEach((m, i) => { const u = frac(f * 0.021 + i * 0.37), k = Math.sin(Math.PI * Math.min(1, u * 2.2)); m.visible = on && u < 0.45; m.scale.setScalar(0.25 + 0.9 * k); m.rotation.z = u * 1.2; });
}
/** a sack of money */
export function sack(p: Node, x: number, y: number, z: number, s = 1) {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  const body = ball(g, 0.3, '#b9925a', 0, 0.27, 0); body.scale.set(1, 0.9, 0.85);
  cyl(g, 0.1, 0.12, '#a37f4c', 0, 0.58, 0, 0.14); torus(g, 0.1, 0.02, '#6b4a2d', 0, 0.53, 0).rotation.x = Math.PI / 2;
  soft(panel(g, 0.26, 0.26, smat(tex('sack-mark', 96, 96, (c) => text(c, '$', 48, 52, 84, '#5a3d1e')), 1, true), 0, 0.27, 0.262));
  return g;
}

// ------------------------------------------------------------------ desks and computers
export type Laptop = {g: THREE.Group; lid: THREE.Group; screen: THREE.Mesh; back: THREE.Mesh; shell: THREE.Mesh};
/** An open laptop. It faces +z (its user sits on the +z side); turn it by `ry = Math.PI` to show its lid to the camera. */
export function laptop(p: Node, x: number, y: number, z: number, o: {ry?: number; w?: number; body?: string; screen?: THREE.Material; back?: THREE.Material; open?: number} = {}): Laptop {
  const w = o.w ?? 0.46, d = w * 0.68, body = o.body ?? '#aeb7c3';
  const g = grp(p, x, y, z); g.rotation.y = o.ry ?? 0;
  box(g, w, 0.024, d, body, 0, 0.012, 0);
  box(g, w * 0.84, 0.004, d * 0.46, '#3a3f4a', 0, 0.026, -d * 0.14);
  const lid = grp(g, 0, 0.024, -d / 2); lid.rotation.x = -(o.open ?? 0.28);
  const shell = box(lid, w, d, 0.018, body, 0, d / 2, 0);
  const screen = panel(lid, w * 0.92, d * 0.86, o.screen ?? lit('#bfe6ff', 1.05), 0, d / 2, 0.0095);
  const back = panel(lid, w * 0.56, d * 0.4, o.back ?? lit(body, 1), 0, d * 0.5, -0.0095, Math.PI);
  return {g, lid, screen, back, shell};
}
/** a desk; `skirt` closes its front so a seated person's knees do not show */
export function table(p: Node, x: number, z: number, w: number, d: number, o: {h?: number; top?: string | THREE.Material; leg?: string; skirt?: string | THREE.Material} = {}) {
  const h = o.h ?? 0.74, g = grp(p, x, 0, z);
  box(g, w, 0.05, d, o.top ?? '#c9a27a', 0, h - 0.025, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.055, h - 0.05, 0.055, o.leg ?? '#5b6170', sx * (w / 2 - 0.07), (h - 0.05) / 2, sz * (d / 2 - 0.07));
  if (o.skirt) box(g, w - 0.16, h * 0.62, 0.03, o.skirt, 0, h - 0.05 - h * 0.31, d / 2 - 0.09);
  return g;
}
const roundTex = (c: string) => tex('round-' + c, 128, 96, (g, w, h) => { g.fillStyle = c; rrect(g, 1, 1, w - 2, h - 2, 13); g.fill(); });
/** What is on a screen that faces away from us, shown as a card floating over it, with a tail down to the computer. */
export function bubble(p: Node, x: number, y: number, z: number, w: number, h: number, m: THREE.Material, tail: [number, number] = [-0.3, -0.3]) {
  const g = grp(p, x, y, z);
  const s = new THREE.Shape(); s.moveTo(-0.11, -h / 2 + 0.02); s.lineTo(0.11, -h / 2 + 0.02); s.lineTo(tail[0], -h / 2 + tail[1]); s.closePath();
  soft(mesh(g, new THREE.ShapeGeometry(s), lit('#15121c', 1), 0, 0, -0.006));
  soft(panel(g, w + 0.075, h + 0.075, smat(roundTex('#15121c'), 1, true), 0, 0, -0.004));
  const screen = soft(panel(g, w, h, m, 0, 0, 0));
  return {g, screen};
}
/** a screen picture: dark glass, then whatever is drawn */
export const screenTex = (key: string, draw: (g: G2, w: number, h: number) => void, w = 512, h = 368, bg = '#0b1420') => tex('scr-' + key, w, h, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); draw(g, cw, ch); });

// ------------------------------------------------------------------ icons drawn flat on screens, boards and notes
export function envelope(g: G2, x: number, y: number, s: number, fill = '#fffdf4') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = s * 0.07; g.strokeStyle = '#15121c'; g.fillStyle = fill;
  g.beginPath(); g.rect(x - s * 0.6, y - s * 0.4, s * 1.2, s * 0.8); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.4); g.lineTo(x, y + s * 0.1); g.lineTo(x + s * 0.6, y - s * 0.4); g.stroke(); g.restore();
}
export function folder(g: G2, x: number, y: number, s: number, fill = '#ffc94a') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = s * 0.07; g.strokeStyle = '#15121c'; g.fillStyle = fill;
  g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.44); g.lineTo(x - s * 0.12, y - s * 0.44); g.lineTo(x, y - s * 0.3); g.lineTo(x + s * 0.6, y - s * 0.3); g.lineTo(x + s * 0.6, y + s * 0.44); g.lineTo(x - s * 0.6, y + s * 0.44); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.16); g.lineTo(x + s * 0.6, y - s * 0.16); g.stroke(); g.restore();
}
/** somebody, nobody in particular: head and shoulders */
export function person(g: G2, x: number, y: number, s: number, fill: string, line = '#15121c') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = s * 0.09; g.strokeStyle = line; g.fillStyle = fill;
  g.beginPath(); g.moveTo(x - s * 0.52, y + s * 0.6); g.quadraticCurveTo(x - s * 0.52, y + s * 0.02, x, y + s * 0.02); g.quadraticCurveTo(x + s * 0.52, y + s * 0.02, x + s * 0.52, y + s * 0.6); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(x, y - s * 0.26, s * 0.3, 0, 7); g.fill(); g.stroke(); g.restore();
}
export function magnifier(g: G2, x: number, y: number, s: number) {
  g.save(); g.lineCap = 'round'; g.strokeStyle = '#15121c'; g.lineWidth = s * 0.16; g.beginPath(); g.arc(x - s * 0.12, y - s * 0.12, s * 0.34, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(x + s * 0.14, y + s * 0.14); g.lineTo(x + s * 0.5, y + s * 0.5); g.stroke(); g.restore();
}
// ------------------------------------------------------------------ studio things
export function ringLight(p: Node, x: number, z: number, h = 1.75, ry = 0) {
  const g = grp(p, x, 0, z); g.rotation.y = ry;
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; rod(g, [0, 0.62, 0], [0.42 * Math.cos(a), 0.02, 0.42 * Math.sin(a)], 0.02, '#2b2f3a'); }
  cyl(g, 0.022, h - 0.6, '#3a3f4a', 0, 0.6 + (h - 0.6) / 2, 0);
  const ring = torus(g, 0.27, 0.035, lit('#fff4dc', 1.9), 0, h + 0.26, 0); ring.castShadow = false;
  box(g, 0.1, 0.15, 0.05, '#15161b', 0, h + 0.26, -0.02);
  return g;
}
/** a camera on a tripod, seen from behind or beside */
export function tvCamera(p: Node, x: number, z: number, ry = 0, s = 1) {
  const g = grp(p, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.3; rod(g, [0, 1.1, 0], [0.5 * Math.cos(a), 0.02, 0.5 * Math.sin(a)], 0.025, '#2b2f3a'); }
  box(g, 0.34, 0.3, 0.6, '#2f3542', 0, 1.3, 0); cyl(g, 0.11, 0.26, '#15161b', 0, 1.3, -0.42).rotation.x = Math.PI / 2;
  box(g, 0.12, 0.1, 0.2, '#15161b', 0.2, 1.42, 0.2); ball(g, 0.03, lit('#ff3b30', 2.2), 0.1, 1.48, -0.28);
  return g;
}
export function flagPole(p: Node, x: number, z: number, t: THREE.Texture, o: {h?: number; w?: number; left?: boolean} = {}) {
  const h = o.h ?? 2.75, w = o.w ?? 0.95, g = grp(p, x, 0, z), d = o.left ? -1 : 1;
  cyl(g, 0.17, 0.06, '#a8873a', 0, 0.03, 0); cyl(g, 0.024, h, '#c9a84a', 0, h / 2, 0); ball(g, 0.055, '#e7c56a', 0, h + 0.03, 0);
  const fl = panel(g, w, w * 0.56, new THREE.MeshLambertMaterial({map: t, side: THREE.DoubleSide}), d * (w / 2 + 0.03), h - w * 0.32, 0); fl.rotation.z = -d * 0.04; fl.scale.x = d;                // the hoist stays at the pole
  return g;
}
export const flagUS = () => tex('flag-us', 400, 224, (g, w, h) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
  g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.42, h * 7 / 13); g.fillStyle = '#ffffff';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(w * 0.42 * (c + 0.5) / 6, h * 7 / 13 * (r + 0.5) / 5, 4.4, 0, 7); g.fill(); }
});
export function palm(p: Node, x: number, z: number, h = 3.3, lean = 0.3, s = 1) {
  const g = grp(p, x, 0, z); g.scale.setScalar(s);
  let px = 0, py = 0;
  for (let i = 0; i < 6; i++) { const nx = px + lean * (i + 1) / 21 * 3, ny = py + h / 6; rod(g, [px, py, 0], [nx, ny + 0.02, 0], 0.1 - i * 0.009, i % 2 ? '#8f6f4c' : '#7a5c3e'); px = nx; py = ny; }
  for (let i = 0; i < 8; i++) {
    const f = slab(g, [[0, 0.02], [0.45, 0.2], [1.0, 0.16], [1.42, -0.1], [0.9, 0.0], [0.4, 0.04], [0, -0.1]], 0.03, i % 2 ? '#2f7a4a' : '#3f9058', px, py, 0);
    f.rotation.set(0, i * Math.PI / 4 + 0.2, -0.32 - (i % 3) * 0.12); f.castShadow = false;
  }
  for (const [dx, dz] of [[0.1, 0.06], [-0.08, 0.08], [0, -0.1]]) ball(g, 0.085, '#5a3d24', px + dx, py - 0.1, dz);
  return g;
}
export {cone, lerp, mesh, vgrad};

/**
 * A glow hanging in the air, facing down the set: brightest in the middle and gone long before its edge. (A pool of light stood on
 * end keeps its full strength over half its radius and shows as a disc.)
 */
export function halo(p: Node, r: number, color: string, opacity: number, x: number, y: number, z: number) {
  const t = tex('halo', 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); for (let i = 0; i <= 12; i++) gr.addColorStop(i / 12, `rgba(255,255,255,${((1 - i / 12) ** 2.6).toFixed(4)})`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.MeshBasicMaterial({map: t, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false});
  const o = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m); o.position.set(x, y, z); o.layers.set(NOINK); o.renderOrder = 2; p.add(o); return o;
}

// ------------------------------------------------------------------ banknotes
const noteTop = () => tex('note-top', 128, 64, (g, w, h) => {
  g.fillStyle = '#62b77e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2f7a4a'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#fffdf4'; g.fillRect(w * 0.34, 0, w * 0.32, h); g.strokeStyle = '#cfc8b4'; g.lineWidth = 2; g.strokeRect(w * 0.34, -2, w * 0.32, h + 4);
  text(g, '$', w / 2, h / 2 + 2, 44, '#2f7a4a');
});
const noteSide = () => tex('note-side', 64, 32, (g, w, h) => {
  g.fillStyle = '#dcefdc'; g.fillRect(0, 0, w, h); g.fillStyle = '#8fc7a0'; for (let y = 2; y < h; y += 5) g.fillRect(0, y, w, 2);
  g.fillStyle = '#fffdf4'; g.fillRect(w * 0.34, 0, w * 0.32, h);
});
/** the two faces of a bundle, for piles built out of bigger blocks */
export const noteTex = {top: noteTop, side: noteSide};
const noteGeo = new THREE.BoxGeometry(0.3, 0.075, 0.15);
const noteMats = new Map<boolean, THREE.Material[]>();
/** a banded bundle of banknotes, 0.3 long. `bright` ones carry their own light: for bundles in the air, in any set */
export function bundle(p: Node, s = 1, bright = false) {
  let m = noteMats.get(bright);
  if (!m) {
    const mk = (t: THREE.Texture) => bright ? new THREE.MeshBasicMaterial({map: t}) : new THREE.MeshLambertMaterial({map: t, emissive: new THREE.Color('#16241a')});
    const side = mk(noteSide()), top = mk(noteTop()); noteMats.set(bright, (m = [side, side, top, top, side, side]));
  }
  const o = new THREE.Mesh(noteGeo, m); o.scale.setScalar(s); o.castShadow = !bright; o.receiveShadow = !bright; p.add(o); return o;
}
/** bundles that fly one after another along an arc */
export function bundleStream(p: Node, n: number, s = 0.8) {
  const bs = Array.from({length: n}, () => bundle(p, s, true));
  return {
    /** Bundles leave between frames f0 and f1; each flies from `from(i)` over `via` to `to(i)` in 1 / speed frames. */
    set(f: number, f0: number, f1: number, from: (i: number) => V, via: V, to: (i: number) => V, speed = 0.03) {
      bs.forEach((c, i) => {
        const ph = frac(Math.sin(i * 12.9898) * 43758.5453), turn = Math.floor(f * speed + ph), left = (turn - ph) / speed, u = frac(f * speed + ph);
        c.visible = left >= f0 && left <= f1;
        if (!c.visible) return;
        const A = from(i), C = to(i), a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u;
        c.position.set(a * A[0] + b * via[0] + d * C[0], a * A[1] + b * via[1] + d * C[1], a * A[2] + b * via[2] + d * C[2]);
        c.rotation.set(0.5 + f * 0.19 + i, f * 0.13 + i * 1.3, 0.4 * Math.sin(i * 2.1 + f * 0.1));
        c.scale.setScalar(s * Math.min(1, u * 9) * (1 - 0.6 * Math.max(0, (u - 0.85) / 0.15)));
      });
    },
    hide() { bs.forEach((c) => { c.visible = false; }); },
  };
}
