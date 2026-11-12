// Furniture and set dressing shared by several sets.
import * as THREE from 'three';
import {ball, box, cyl, grp, lamp, lerp, lit, mesh, panel, rod, rng, slab, smat, soft, tex, text, tmat, torus, vgrad, type G2, type Node} from './kit';

/** standing audience or press pack seen from behind: dark heads and shoulders, some holding a phone up */
export function crowd(p: Node, x0: number, x1: number, zs: number[], y: number, seed = 5, colors = ['#15161d', '#1c1d27', '#101117']) {
  const r = rng(seed), flashes: THREE.Mesh[] = [];
  zs.forEach((z, row) => {
    for (let x = x0 + (row % 2) * 0.3; x <= x1; x += 0.6 + r() * 0.18) {
      const c = colors[Math.floor(r() * colors.length)], h = y + 1.5 + r() * 0.2;
      ball(p, 0.19 + r() * 0.03, c, x, h, z);
      ball(p, 0.36, c, x, h - 0.46, z).scale.set(1, 0.62, 0.6);
      box(p, 0.5, 1.2, 0.3, c, x, h - 1.15, z);
      if (r() < 0.4) {
        const px = x + (r() - 0.5) * 0.3, py = h + 0.32 + r() * 0.18;
        rod(p, [x + 0.24, h - 0.4, z], [px, py - 0.08, z - 0.05], 0.035, c);
        box(p, 0.11, 0.2, 0.02, '#0b0c10', px, py, z - 0.08);
        box(p, 0.09, 0.17, 0.01, lit('#9fd0f0', 0.95), px, py, z - 0.065);                  // the screen, seen from behind the crowd
        flashes.push(soft(ball(p, 0.045, lamp('#ffffff', 0), px, py + 0.13, z - 0.1)));
      }
    }
  });
  return {
    /** camera flashes: k = 0 (none) .. 1 (frenzy) */
    flash(f: number, k: number) {
      flashes.forEach((m, i) => { const on = k > 0 && (f * 5 + i * 7) % 11 < 2; m.visible = on; (m.material as THREE.MeshBasicMaterial).color.setScalar(on ? 6 * k : 0); });
    },
  };
}

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

// ------------------------------------------------------------------ cold things: the film's own furniture
/** a temperature readout: icy blue below zero, amber above, red from 40 */
export const tempTex = (t: number) => tex(`temp-${t}`, 256, 128, (g, w, h) => {
  g.fillStyle = '#06131c'; g.fillRect(0, 0, w, h);
  text(g, `${t < 0 ? '−' : ''}${Math.abs(t)}°C`, w / 2, h / 2 + 5, 100, t >= 40 ? '#ff5a3c' : t > 0 ? '#ffb03a' : '#7fe3ff', {maxWidth: w - 22});
});
/** "getting warmer", with no figure: for places where no temperature was reported */
export const risingTex = () => tex('temp-rising', 256, 128, (g, w, h) => {
  g.fillStyle = '#06131c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffb03a'; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const x of [64, 128, 192]) { g.beginPath(); g.moveTo(x, 104); g.lineTo(x, 30); g.moveTo(x - 26, 58); g.lineTo(x, 26); g.lineTo(x + 26, 58); g.stroke(); }
});
export const TEMPS = [-18, -9, 0, 9, 18, 27, 36, 45, 50];
/** the readout for a temperature between -18 and 50 */
export const tempAt = (t: number) => tempTex(TEMPS.reduce((a, b) => Math.abs(b - t) < Math.abs(a - t) ? b : a));
const COLD = new THREE.Color('#bfe9ff').multiplyScalar(1.12), HOT = new THREE.Color('#ff8a3a').multiplyScalar(1.35);
const fogTex = () => tex('door-fog', 128, 256, (g, w, h) => {                                       // condensation: milky, with runs
  const r = rng(41); g.fillStyle = 'rgba(255,255,255,.72)'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++) { const x = 8 + r() * (w - 16), y0 = r() * h * 0.5, len = 40 + r() * 150; g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(x, y0, 3 + r() * 3, len); g.beginPath(); g.arc(x + 2, y0 + len, 5 + r() * 3, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'source-over';
});
const frostTex = () => tex('door-frost', 128, 256, (g, w, h) => {                                    // frost creeping in from the corners
  const r = rng(77);
  for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 78); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() < 0.5 ? r() * 40 : h - r() * 40; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(x - 5 * Math.cos(a), y - 5 * Math.sin(a)); g.lineTo(x + 5 * Math.cos(a), y + 5 * Math.sin(a)); g.stroke(); } }
});
const GOODS = ['#ff7ab0', '#ffd43b', '#7ad0f0', '#8fd36a', '#ff9a3c', '#c9a0ff', '#f3f1ea', '#e0603a'];
export type Freezer = {
  g: THREE.Group; door: THREE.Group; tubs: THREE.Mesh[]; drips: THREE.Mesh[];
  /** show the cabinet at temperature t (-18 cold .. 50 hot) on frame f; melt = how far the ice cream has run (0..1) */
  set: (t: number, f: number, melt?: number) => void;
};
/** upright supermarket freezer: a closed base, a lit cabinet with four shelves of frozen food behind a glass door hinged on the left, a readout in the header */
export function freezer(p: Node, x: number, z: number, o: {w?: number; h?: number; seed?: number; body?: string; ry?: number} = {}): Freezer {
  const w = o.w ?? 1.12, h = o.h ?? 2.3, d = 0.72, bh = 0.56, g = grp(p, x, 0, z), r = rng(o.seed ?? 3), body = o.body ?? '#e9eef2';
  g.rotation.y = o.ry ?? 0;
  const top = h - 0.3, ih = top - bh;                                                                 // the cabinet runs from the base to the header
  box(g, w, bh, d, '#46505e', 0, bh / 2, 0); box(g, w + 0.02, 0.05, d + 0.02, '#2f3743', 0, 0.025, 0);
  for (let i = 0; i < 5; i++) box(g, w - 0.24, 0.022, 0.01, '#2f3743', 0, 0.16 + i * 0.07, d / 2 + 0.004);   // vent grille
  box(g, w, ih, 0.06, body, 0, bh + ih / 2, -d / 2 + 0.03);
  for (const s of [-1, 1]) box(g, 0.06, ih, d, body, s * (w / 2 - 0.03), bh + ih / 2, 0);
  box(g, w, 0.3, d, '#2f3a4a', 0, h - 0.15, 0);
  box(g, w - 0.1, 0.04, 0.02, lit('#dff6ff', 1.6), 0, top - 0.025, d / 2 - 0.06);                     // strip light under the header
  const display = new THREE.MeshBasicMaterial({map: tempTex(-18)}), inner = lamp('#bfe9ff', 1.12);
  panel(g, 0.46, 0.2, display, 0, h - 0.15, d / 2 + 0.006);
  panel(g, w - 0.12, ih - 0.02, inner, 0, bh + ih / 2, -d / 2 + 0.065);
  const tubs: THREE.Mesh[] = [], drips: THREE.Mesh[] = [];
  for (let k = 0; k < 4; k++) {
    const y = bh + 0.05 + k * ih / 4; box(g, w - 0.13, 0.03, d - 0.2, '#cfd8e0', 0, y, -0.02);
    for (let xx = -w / 2 + 0.13; xx < w / 2 - 0.2;) {
      const kind = k === 2 ? 0 : Math.floor(r() * 3), c = GOODS[Math.floor(r() * GOODS.length)];       // the third shelf is ice cream
      if (kind === 0) {
        const t = cyl(g, 0.082, 0.17, c, xx + 0.09, y + 0.1, 0.06, 0.098); cyl(t, 0.108, 0.028, '#fffdf4', 0, 0.098, 0); t.userData = {y: y + 0.1}; tubs.push(t);
        const dr = soft(box(g, 0.034, 0.2, 0.02, lit(c, 1.05), xx + 0.09 + (r() - 0.5) * 0.06, y - 0.1, 0.2)); dr.userData = {y, ph: r() * 6}; dr.visible = false; drips.push(dr);
        xx += 0.235;
      } else if (kind === 1) { box(g, 0.2, 0.27, 0.09, c, xx + 0.1, y + 0.15, 0.05); box(g, 0.14, 0.09, 0.01, '#fffdf4', xx + 0.1, y + 0.18, 0.098); xx += 0.25; }
      else { ball(g, 0.11, c, xx + 0.11, y + 0.125, 0.05).scale.set(1, 1.08, 0.55); xx += 0.27; }
    }
  }
  const door = grp(g, -w / 2 + 0.03, 0, d / 2), fr = '#aeb8c2', dw = w - 0.06, gy = bh + ih / 2;
  box(door, dw, 0.05, 0.05, fr, dw / 2, bh + 0.025, 0); box(door, dw, 0.05, 0.05, fr, dw / 2, top - 0.025, 0);
  for (const s of [0, 1]) box(door, 0.05, ih, 0.05, fr, 0.025 + s * (dw - 0.05), gy, 0);
  box(door, 0.045, 0.56, 0.06, '#5a6470', dw - 0.16, gy, 0.05);
  soft(panel(door, dw - 0.08, ih - 0.08, new THREE.MeshBasicMaterial({color: '#e6f7ff', transparent: true, opacity: 0.13, depthWrite: false}), dw / 2, gy, 0));
  const fogM = new THREE.MeshBasicMaterial({map: fogTex(), transparent: true, opacity: 0, depthWrite: false});
  const frostM = new THREE.MeshBasicMaterial({map: frostTex(), transparent: true, opacity: 0.9, depthWrite: false});
  soft(panel(door, dw - 0.08, ih - 0.08, fogM, dw / 2, gy, 0.004)); soft(panel(door, dw - 0.08, ih - 0.08, frostM, dw / 2, gy, 0.006));
  return {
    g, door, tubs, drips,
    set(t, f, melt = 0) {
      const k = Math.max(0, Math.min(1, (t + 18) / 68));
      display.map = tempAt(t); inner.color.lerpColors(COLD, HOT, k);
      frostM.opacity = 0.9 * Math.max(0, 1 - k * 2.2); fogM.opacity = 0.75 * Math.max(0, Math.min(1, (k - 0.25) * 2));
      tubs.forEach((tb, i) => { const m = Math.max(0, Math.min(1, melt * 1.3 - (i % 3) * 0.12)); tb.scale.set(1 + 0.22 * m, 1 - 0.42 * m, 1 + 0.22 * m); tb.position.y = tb.userData.y - 0.036 * m; tb.rotation.z = 0.2 * m * (i % 2 ? 1 : -1); });
      drips.forEach((dr) => { const m = Math.max(0, melt - 0.15); dr.visible = m > 0; const u = ((f * 0.045 + dr.userData.ph) % 1); dr.scale.y = 0.3 + 0.9 * m; dr.position.y = dr.userData.y - 0.02 - 0.1 * dr.scale.y - 0.12 * u * m; });
    },
  };
}

/** The cold-room controller: a made-up unit. A screen with the temperature, three round keys (cool, defrost, alarm) and a status bar. */
export type Controller = {
  g: THREE.Group; screen: THREE.MeshBasicMaterial; keys: THREE.MeshBasicMaterial[]; slash: THREE.Group; status: THREE.MeshBasicMaterial;
  /** where the three keys are, in the controller's own space */
  keyAt: (i: number) => [number, number, number];
};
const keyTex = (kind: 'cool' | 'defrost' | 'alarm') => tex('key-' + kind, 128, 128, (g) => {
  g.clearRect(0, 0, 128, 128); g.strokeStyle = '#15202b'; g.fillStyle = '#15202b'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'cool') for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(64 - 38 * Math.cos(a), 64 - 38 * Math.sin(a)); g.lineTo(64 + 38 * Math.cos(a), 64 + 38 * Math.sin(a)); g.stroke(); }
  else if (kind === 'defrost') { g.beginPath(); g.moveTo(64, 20); g.bezierCurveTo(100, 62, 96, 106, 64, 106); g.bezierCurveTo(32, 106, 28, 62, 64, 20); g.fill(); }
  else { g.beginPath(); g.moveTo(30, 88); g.lineTo(98, 88); g.lineTo(88, 72); g.lineTo(88, 52); g.bezierCurveTo(88, 20, 40, 20, 40, 52); g.lineTo(40, 72); g.closePath(); g.fill(); g.beginPath(); g.arc(64, 98, 9, 0, Math.PI); g.fill(); }
});
export const statusTex = (label: string, color: string) => tex('status-' + label, 512, 96, (g, w, h) => { g.fillStyle = '#06131c'; g.fillRect(0, 0, w, h); text(g, label, w / 2, h / 2 + 3, 62, color, {maxWidth: w - 30, spacing: 4}); });
export function controller(p: Node, x: number, y: number, z: number, s = 1, body = '#d5dbe1'): Controller {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  box(g, 1.3, 1.0, 0.12, body, 0, 0, 0); box(g, 1.36, 0.08, 0.16, '#8f9aa6', 0, 0.52, 0); box(g, 1.36, 0.08, 0.16, '#8f9aa6', 0, -0.52, 0);
  box(g, 1.14, 0.5, 0.02, '#1b2530', 0, 0.2, 0.062);
  const screen = new THREE.MeshBasicMaterial({map: tempTex(-18)}), status = new THREE.MeshBasicMaterial({map: statusTex('COOLING', '#7fe3ff')});
  panel(g, 0.62, 0.31, screen, -0.22, 0.26, 0.075); panel(g, 1.06, 0.12, status, 0, 0.035, 0.075);
  for (let i = 0; i < 3; i++) box(g, 0.07, 0.07, 0.02, lit(['#3fe07a', '#ffd43b', '#ff5a3c'][i], i === 0 ? 1.8 : 0.5), 0.3 + i * 0.12, 0.36, 0.075);      // status lights
  box(g, 0.34, 0.1, 0.02, lit('#9fb4c8', 0.9), 0.42, 0.22, 0.075);
  const keys = (['cool', 'defrost', 'alarm'] as const).map((k, i) => {
    const m = lamp(['#9fe6ff', '#ffe9c2', '#fff0a8'][i], 1), kx = -0.4 + i * 0.4;
    cyl(g, 0.15, 0.05, '#8f9aa6', kx, -0.23, 0.07).rotation.x = Math.PI / 2;
    const top = cyl(g, 0.125, 0.04, m, kx, -0.23, 0.1); top.rotation.x = Math.PI / 2;
    soft(panel(g, 0.17, 0.17, smat(keyTex(k), 1, true), kx, -0.23, 0.125));
    return m;
  });
  // the red slash that goes over the alarm key when it is muted
  panel(g, 1.2, 0.085, smat(tex('key-names', 960, 68, (c, w, h) => { c.clearRect(0, 0, w, h); ['COOL', 'DEFROST', 'ALARM'].forEach((n, i) => text(c, n, w / 2 + (i - 1) * 320, h / 2 + 3, 56, '#15202b', {spacing: 4})); }), 1, true), 0, -0.435, 0.063);
  const slash = grp(g, 0.4, -0.23, 0.14); const bar = box(slash, 0.4, 0.055, 0.02, lit('#ff2a2a', 1.4), 0, 0, 0); bar.rotation.z = -0.78; torus(slash, 0.17, 0.022, lit('#ff2a2a', 1.4), 0, 0, 0); slash.visible = false;
  return {g, screen, keys, slash, status, keyAt: (i) => [-0.4 + i * 0.4, -0.23, 0.16]};
}

/** the mouse pointer, out in the physical world: whoever is on the other end of the line */
export function cursor3d(p: Node, s = 1) {
  const g = grp(p), pts: [number, number][] = [[0, 0], [0, -0.92], [0.22, -0.7], [0.36, -1.03], [0.5, -0.97], [0.36, -0.64], [0.66, -0.64]];
  const body = slab(g, pts, 0.05, lit('#ffffff', 1.05)); body.castShadow = false;
  const edge = slab(g, pts, 0.03, lit('#15121c', 1)); edge.scale.set(1.16, 1.12, 1); edge.position.set(-0.05, 0.05, -0.03); edge.castShadow = false;
  g.scale.setScalar(s); return g;
}
export function cloud3d(p: Node, x: number, y: number, z: number, s = 1, c = '#ffffff') {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  for (const [dx, dy, r] of [[-0.42, 0, 0.3], [-0.1, 0.14, 0.4], [0.3, 0.06, 0.34], [0.58, -0.04, 0.24], [0.08, -0.1, 0.36]] as const) soft(ball(g, r, lit(c, 1), dx, dy, 0)).scale.z = 0.5;
  return g;
}
/** a shopping trolley with a load */
export function trolley(p: Node, x: number, z: number, load = true) {
  const g = grp(p, x, 0, z), m = '#aeb8c2';
  for (const [a, b] of [[[-0.42, 0.42, -0.26], [0.42, 0.42, -0.26]], [[-0.42, 0.42, 0.26], [0.42, 0.42, 0.26]], [[-0.46, 0.92, -0.3], [0.5, 0.92, -0.3]], [[-0.46, 0.92, 0.3], [0.5, 0.92, 0.3]],
    [[-0.42, 0.42, -0.26], [-0.42, 0.42, 0.26]], [[0.42, 0.42, -0.26], [0.42, 0.42, 0.26]], [[-0.46, 0.92, -0.3], [-0.46, 0.92, 0.3]], [[0.5, 0.92, -0.3], [0.5, 0.92, 0.3]]] as const) rod(g, [...a], [...b], 0.018, m);
  for (let i = 0; i < 7; i++) { const u = -0.42 + i * 0.14; for (const s of [-1, 1]) rod(g, [u, 0.42, s * 0.26], [u * 1.08 + 0.02, 0.92, s * 0.3], 0.012, m); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) rod(g, [s > 0 ? 0.42 : -0.42, 0.42, -0.26 + i * 0.26], [s > 0 ? 0.5 : -0.46, 0.92, -0.3 + i * 0.3], 0.012, m);
  for (const s of [-1, 1]) { rod(g, [-0.46, 0.92, s * 0.3], [-0.62, 1.06, s * 0.3], 0.02, m); rod(g, [-0.36, 0.42, s * 0.24], [-0.4, 0.1, s * 0.24], 0.02, m); rod(g, [0.36, 0.42, s * 0.24], [0.4, 0.1, s * 0.24], 0.02, m); for (const wx of [-0.4, 0.4]) cyl(g, 0.06, 0.04, '#2b2d38', wx, 0.06, s * 0.24).rotation.x = Math.PI / 2; }
  rod(g, [-0.62, 1.06, -0.3], [-0.62, 1.06, 0.3], 0.028, '#e0603a');
  if (load) [[-0.2, 0.62, -0.08, '#ff7ab0'], [0.12, 0.6, 0.06, '#ffd43b'], [-0.02, 0.86, 0, '#7ad0f0'], [0.26, 0.84, -0.06, '#8fd36a'], [-0.26, 0.9, 0.08, '#e0603a']].forEach(([bx, by, bz, c], i) => { box(g, 0.3, 0.26, 0.24, c as string, bx as number, by as number, bz as number).rotation.z = (i % 2 ? 1 : -1) * 0.2; });
  return g;
}
/** a lectern with a plaque and two microphones */
export function lectern(p: Node, x: number, z: number, wood: string, plaque: THREE.Texture) {
  const g = grp(p, x, 0, z);
  box(g, 1.0, 0.1, 0.62, wood, 0, 0.05, 0); box(g, 0.78, 1.12, 0.46, wood, 0, 0.64, 0); box(g, 1.0, 0.07, 0.6, wood, 0, 1.24, 0).rotation.x = 0.16;
  panel(g, 0.58, 0.21, smat(plaque, 1.05), 0, 1.05, 0.235);
  for (const s of [-1, 1]) { rod(g, [s * 0.3, 1.26, -0.08], [s * 0.36, 1.5, 0.06], 0.014, '#2b2d38'); const m = ball(g, 0.05, '#3a3f4a', s * 0.36, 1.52, 0.07); m.scale.set(1, 1.3, 1); }
  return g;
}
/** small household fridge with a freezer drawer */
export function fridge3d(p: Node, x: number, z: number, s = 1, c = '#f4f6f8') {
  const g = grp(p, x, 0, z); g.scale.setScalar(s);
  box(g, 0.86, 1.72, 0.7, c, 0, 0.92, 0); box(g, 0.8, 0.06, 0.66, '#3a4250', 0, 0.04, 0);
  box(g, 0.87, 0.02, 0.71, '#9aa6b2', 0, 1.26, 0);
  for (const y of [1.5, 0.98]) box(g, 0.05, 0.36, 0.05, '#9aa6b2', 0.32, y, 0.37);
  return g;
}
export {lerp, mesh, vgrad};
