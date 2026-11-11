// Furniture and set dressing shared by several sets of the Binance heist short.
import * as THREE from 'three';
import {NOINK} from '../pendulum/ink';
import {ball, box, cone, cyl, grp, lamp, lerp, lit, mesh, panel, rod, rng, rrect, slab, smat, soft, tex, text, tiled, torus, vgrad, type G2, type Node, type V} from './kit';
import {drawHood, drawMask, type MaskKind} from './cast';

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

/** the mouse pointer, out in the physical world: whoever is on the other end of the line */
export function cursor3d(p: Node, s = 1) {
  const g = grp(p), pts: [number, number][] = [[0, 0], [0, -0.92], [0.22, -0.7], [0.36, -1.03], [0.5, -0.97], [0.36, -0.64], [0.66, -0.64]];
  const body = slab(g, pts, 0.05, lit('#ffffff', 1.05)); body.castShadow = false;
  const edge = slab(g, pts, 0.03, lit('#15121c', 1)); edge.scale.set(1.16, 1.12, 1); edge.position.set(-0.05, 0.05, -0.03); edge.castShadow = false;
  g.scale.setScalar(s); return g;
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
export const GOLD = '#f0b90b';
const coinSide = () => tex('coin-side', 64, 32, (g, w, h) => {
  g.fillStyle = '#e9ad0c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffd94f'; g.fillRect(0, 3, w, 9);
  g.fillStyle = '#8a6208'; g.fillRect(0, h - 6, w, 6);
  g.fillStyle = 'rgba(138,98,8,.45)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 12, 2, h - 18);    // milled edge
}, true);
const coinFace = () => tex('coin-face', 128, 128, (g, w) => {
  g.fillStyle = '#ffd94f'; g.fillRect(0, 0, w, w);
  g.strokeStyle = '#b07f0a'; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 47, 0, 7); g.stroke();
  g.fillStyle = '#b07f0a'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 11 : 31; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } g.closePath(); g.fill();   // a four-point star: nobody's emblem
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
export function briefcase(g: G2, x: number, y: number, s: number, fill = '#b9793d') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = s * 0.08; g.strokeStyle = '#15121c';
  g.beginPath(); g.rect(x - s * 0.2, y - s * 0.52, s * 0.4, s * 0.2); g.stroke();
  g.fillStyle = fill; g.beginPath(); g.rect(x - s * 0.6, y - s * 0.34, s * 1.2, s * 0.8); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * 0.6, y + s * 0.02); g.lineTo(x + s * 0.6, y + s * 0.02); g.stroke();
  g.fillStyle = '#ffd43b'; g.fillRect(x - s * 0.09, y - s * 0.06, s * 0.18, s * 0.16); g.strokeRect(x - s * 0.09, y - s * 0.06, s * 0.18, s * 0.16); g.restore();
}
export function folder(g: G2, x: number, y: number, s: number, fill = '#ffc94a') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = s * 0.07; g.strokeStyle = '#15121c'; g.fillStyle = fill;
  g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.44); g.lineTo(x - s * 0.12, y - s * 0.44); g.lineTo(x, y - s * 0.3); g.lineTo(x + s * 0.6, y - s * 0.3); g.lineTo(x + s * 0.6, y + s * 0.44); g.lineTo(x - s * 0.6, y + s * 0.44); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.16); g.lineTo(x + s * 0.6, y - s * 0.16); g.stroke(); g.restore();
}
/** a beetle: what was in the folder */
export function bug(g: G2, x: number, y: number, s: number, fill = '#e3342f') {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = s * 0.08; g.strokeStyle = '#15121c';
  for (const d of [-1, 1]) for (const k of [-0.28, 0.02, 0.32]) { g.beginPath(); g.moveTo(x + d * s * 0.3, y + k * s); g.lineTo(x + d * s * 0.62, y + (k - 0.12) * s); g.lineTo(x + d * s * 0.74, y + (k + 0.06) * s); g.stroke(); }
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + d * s * 0.12, y - s * 0.52); g.lineTo(x + d * s * 0.3, y - s * 0.78); g.stroke(); }
  g.fillStyle = '#2a2230'; g.beginPath(); g.ellipse(x, y - s * 0.42, s * 0.24, s * 0.2, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = fill; g.beginPath(); g.ellipse(x, y + s * 0.06, s * 0.36, s * 0.46, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x, y - s * 0.38); g.lineTo(x, y + s * 0.5); g.stroke();
  g.fillStyle = '#15121c'; for (const [dx, dy] of [[-0.17, -0.08], [0.17, -0.08], [-0.15, 0.24], [0.15, 0.24]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.06, 0, 7); g.fill(); }
  g.restore();
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
export {drawHood, drawMask};
/** a paper mask hanging on a peg or lying about */
export function maskCard(p: Node, kind: MaskKind, x: number, y: number, z: number, s = 0.5) {
  const t = tex('mask-' + kind, 200, 220, (g) => drawMask(g, 100, 118, 82, kind));
  return soft(panel(p, s, s * 1.1, smat(t, 1, true), x, y, z));
}

// ------------------------------------------------------------------ studio things
/** a painted cardboard backdrop on two struts; the group's origin is its bottom right corner, so it can topple sideways */
export function cardboardFlat(p: Node, w: number, h: number, front: THREE.Texture) {
  const pivot = grp(p), card = '#b98c5a';
  const edge = new THREE.MeshLambertMaterial({color: card}), backT = tex('flat-back', 256, 256, (g) => {
    g.fillStyle = card; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = 2; for (let y = 6; y < 256; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  }, true);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.045), [edge, edge, edge, edge, new THREE.MeshBasicMaterial({map: front}), new THREE.MeshLambertMaterial({map: tiled(backT, 3, 3)})]);
  body.position.set(-w / 2, h / 2, 0); body.castShadow = true; pivot.add(body);
  for (const x of [-w * 0.2, -w * 0.8]) { rod(pivot, [x, h * 0.62, -0.03], [x, 0.03, -0.85], 0.03, '#8a6a48'); box(pivot, 0.34, 0.1, 0.3, '#6b7280', x, 0.05, -0.85); }
  return pivot;
}
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
/** a reporter's microphone on a pole, poked into the picture */
export function boom(p: Node, from: V, to: V, c = '#3a3f4a') {
  rod(p, from, to, 0.022, '#22252c'); const m = ball(p, 0.085, c, to[0], to[1], to[2]); m.scale.set(1, 1.35, 1); return m;
}
export function flagPole(p: Node, x: number, z: number, t: THREE.Texture, o: {h?: number; w?: number; left?: boolean} = {}) {
  const h = o.h ?? 2.75, w = o.w ?? 0.95, g = grp(p, x, 0, z), d = o.left ? -1 : 1;
  cyl(g, 0.17, 0.06, '#a8873a', 0, 0.03, 0); cyl(g, 0.024, h, '#c9a84a', 0, h / 2, 0); ball(g, 0.055, '#e7c56a', 0, h + 0.03, 0);
  const fl = panel(g, w, w * 0.56, new THREE.MeshLambertMaterial({map: t, side: THREE.DoubleSide}), d * (w / 2 + 0.03), h - w * 0.32, 0); fl.rotation.z = -d * 0.04; fl.scale.x = d;                // the hoist stays at the pole
  return g;
}
export const flagNK = () => tex('flag-nk', 400, 224, (g, w, h) => {
  const u = h / 38; g.fillStyle = '#024fa2'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 6 * u, w, 26 * u); g.fillStyle = '#ed1c27'; g.fillRect(0, 8 * u, w, 22 * u);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w * 0.33, h / 2, 8 * u, 0, 7); g.fill();
  g.fillStyle = '#ed1c27'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = (i % 2 ? 0.382 : 1) * 7.6 * u; g.lineTo(w * 0.33 + r * Math.cos(a), h / 2 + r * Math.sin(a)); } g.closePath(); g.fill();
});
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
export function pumpkin(p: Node, x: number, y: number, z: number, s = 1) {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  for (const dx of [-0.12, 0.12, 0]) ball(g, 0.17, dx ? '#e9801a' : '#f6921e', dx, 0.16, dx ? -0.01 : 0.01).scale.set(dx ? 0.78 : 1, 0.92, 1);
  cyl(g, 0.03, 0.1, '#4f7a3a', 0, 0.36, 0, 0.022);
  soft(panel(g, 0.3, 0.22, smat(tex('jack', 150, 110, (c) => {
    c.fillStyle = '#ffe25a'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(75 + d * 44, 44); c.lineTo(75 + d * 14, 44); c.lineTo(75 + d * 30, 14); c.closePath(); c.fill(); }
    c.beginPath(); c.moveTo(18, 62); for (const [x2, y2] of [[36, 74], [50, 62], [64, 78], [75, 64], [86, 78], [100, 62], [114, 74], [132, 62], [112, 100], [38, 100]]) c.lineTo(x2, y2); c.closePath(); c.fill();
  }), 1.9, true), 0, 0.16, 0.185));
  return g;
}
/** a wall clock; `swept` paints the minutes that have gone by since the minute `from` */
export function wallClock(p: Node, x: number, y: number, z: number, r: number) {
  const g = grp(p, x, y, z);
  cyl(g, r * 1.1, 0.07, '#2b3242', 0, 0, 0, r * 1.1, 40).rotation.x = Math.PI / 2;
  soft(panel(g, r * 2, r * 2, smat(tex('clock-face', 256, 256, (c) => {
    c.fillStyle = '#fbf7ea'; c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fill();
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r0 = big ? 100 : 110; c.strokeStyle = '#15121c'; c.lineWidth = big ? 6 : 2; c.beginPath(); c.moveTo(128 + r0 * Math.sin(a), 128 - r0 * Math.cos(a)); c.lineTo(128 + 120 * Math.sin(a), 128 - 120 * Math.cos(a)); c.stroke(); }
    for (const [n, a] of [['12', 0], ['3', 1], ['6', 2], ['9', 3]] as const) text(c, n, 128 + 78 * Math.sin(a * Math.PI / 2), 130 - 78 * Math.cos(a * Math.PI / 2), 34, '#15121c');
  }), 1, true), 0, 0, 0.04));
  const wedges = Array.from({length: 60}, (_, i) => soft(mesh(g, new THREE.CircleGeometry(r * 0.66, 2, Math.PI / 2 - (i + 1) * Math.PI / 30, Math.PI / 30 + 0.004), lit('#ff5a4a', 1), 0, 0, 0.045)));
  const minute = grp(g, 0, 0, 0.062), hour = grp(g, 0, 0, 0.056);
  box(minute, r * 0.075, r * 0.86, 0.014, '#15121c', 0, r * 0.36, 0).castShadow = false; box(hour, r * 0.11, r * 0.56, 0.014, '#15121c', 0, r * 0.22, 0).castShadow = false;
  const hub = cyl(g, r * 0.08, 0.03, '#e3342f', 0, 0, 0.072); hub.rotation.x = Math.PI / 2; hub.castShadow = false;
  return {g, set(h: number, m: number, from = -1) {
    minute.rotation.z = -m * Math.PI / 30; hour.rotation.z = -((h % 12) + m / 60) * Math.PI / 6;
    wedges.forEach((wd, i) => { wd.visible = from >= 0 && i >= from && i < m - 0.5; });
  }};
}
/** a block of ice dropped over something */
export function iceBlock(p: Node, w: number, h: number, d: number) {
  const g = grp(p);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({color: '#c4ecff', transparent: true, opacity: 0.56})); m.position.y = h / 2; g.add(m);
  const hi = soft(panel(g, w * 0.16, h * 0.62, new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false}), -w * 0.26, h * 0.56, d / 2 + 0.004)); hi.rotation.z = 0.12;
  return g;
}
/** the in-house assistant: a head on a stand, nothing like any real product */
export function assistant(p: Node, x: number, y: number, z: number) {
  const g = grp(p, x, y, z), nice = screenTex('ai-nice', (c, w, h) => {
    c.fillStyle = '#7ff0e0'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + d * 90, h * 0.42, 34, 44, 0, 0, 7); c.fill(); }
    c.strokeStyle = '#7ff0e0'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.arc(w / 2, h * 0.5, 96, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  }, 512, 320, '#0d2230'), taken = screenTex('ai-taken', (c, w, h) => {
    c.fillStyle = '#ffd76a'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + d * 90, h * 0.45, 30, 46, 0, 0, 7); c.fill(); }
  }, 512, 320, '#06090b');
  const head = grp(g, 0, 0.62, 0);
  box(head, 0.96, 0.7, 0.56, '#eef1f5', 0, 0.35, 0);
  for (const s of [-1, 1]) cyl(head, 0.1, 0.09, '#8fb4c8', s * 0.52, 0.36, 0).rotation.z = Math.PI / 2;
  rod(head, [0, 0.7, 0], [0, 0.92, 0], 0.016, '#6b7280'); const bulb = ball(head, 0.06, lamp('#7ff0e0', 1.8), 0, 0.95, 0); bulb.castShadow = false;
  const mat = new THREE.MeshBasicMaterial({map: nice}), face = panel(head, 0.78, 0.48, mat, 0, 0.36, 0.283);
  cyl(g, 0.12, 0.2, '#8a94a3', 0, 0.52, 0); cyl(g, 0.34, 0.42, '#3a4254', 0, 0.21, 0, 0.3);
  return {g, head, face, bulb, set(on: boolean) { mat.map = on ? taken : nice; (bulb.material as THREE.MeshBasicMaterial).color.set(on ? '#ff8a2a' : '#7ff0e0').multiplyScalar(1.8); }};
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
