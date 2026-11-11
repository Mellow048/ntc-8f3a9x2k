// Furniture and set dressing shared by several sets of the Nvidia short.
import * as THREE from 'three';
import {ball, box, cone, cyl, grp, lamp, lit, panel, rod, rng, soft, tex, text, tmat, smat, vgrad, type Node, type G2} from './kit';
import type {SetDef} from './sets';

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
export function tree(p: Node, x: number, z: number, s = 1) {
  const g = grp(p, x, 0, z); g.scale.setScalar(s);
  cyl(g, 0.13, 1.7, '#6b5a45', 0, 0.85, 0, 0.09);
  for (let i = 0; i < 5; i++) { const a = i * 1.3; ball(g, 0.72, i % 2 ? '#5c9160' : '#6fa46c', 0.4 * Math.cos(a), 2.1 + (i % 3) * 0.25, 0.4 * Math.sin(a)).scale.set(1, 1.1, 0.9); }
  return g;
}
/** classical column: plinth, tapered shaft, capital */
export function column(p: Node, x: number, y: number, z: number, r: number, h: number, c = '#e9e4d6') {
  box(p, r * 2.7, 0.22, r * 2.7, c, x, y + 0.11, z);
  cyl(p, r * 1.15, 0.14, c, x, y + 0.29, z);
  cyl(p, r, h - 0.72, c, x, y + 0.36 + (h - 0.72) / 2, z, r * 0.86, 14);
  cyl(p, r * 0.98, 0.12, c, x, y + h - 0.3, z, r * 1.2);
  box(p, r * 2.7, 0.24, r * 2.7, c, x, y + h - 0.12, z);
}
export function streetLamp(p: Node, x: number, z: number, h = 3.2, glow = '#ffe9b0', k = 2) {
  cyl(p, 0.12, 0.2, '#3d4450', x, 0.1, z); cyl(p, 0.05, h, '#4b5361', x, h / 2, z);
  box(p, 0.3, 0.06, 0.3, '#3d4450', x, h + 0.02, z);
  ball(p, 0.19, lit(glow, k), x, h + 0.22, z).scale.y = 1.2;
  box(p, 0.22, 0.05, 0.22, '#3d4450', x, h + 0.47, z);
}
/** flag hanging from a pole with a gold finial */
export function flagPole(p: Node, x: number, z: number, t: THREE.Texture, h = 2.7, lean = 0.1) {
  cyl(p, 0.2, 0.08, '#b89a4a', x, 0.04, z); cyl(p, 0.03, h, '#c9a94f', x, h / 2, z); ball(p, 0.07, '#e7c56a', x, h + 0.05, z);
  const f = panel(p, 0.82, 1.5, tmat(t), x + 0.36 * Math.sign(lean || 1), h - 0.86, z + 0.03); f.rotation.z = -lean * 0.6; f.castShadow = true;
  (f.material as THREE.Material).side = THREE.DoubleSide;
  return f;
}
export const flagUS = () => tex('flag-us', 164, 300, (g, w, h) => {              // draped: stripes run down the pole
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f6f3ea' : '#bf2a36'; g.fillRect(i * w / 13, 0, w / 13 + 1, h); }
  g.fillStyle = '#27407f'; g.fillRect(0, 0, w * 7 / 13, h * 0.42);
  g.fillStyle = '#f6f3ea'; for (let y = 0; y < 6; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(10 + x * 21 + (y % 2) * 10, 12 + y * 20, 3.4, 0, 7); g.fill(); }
  shadeFolds(g, w, h);
});
export const flagCN = () => tex('flag-cn', 164, 300, (g, w, h) => {
  g.fillStyle = '#d2262c'; g.fillRect(0, 0, w, h);
  const star = (x: number, y: number, r: number) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; g.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); } g.closePath(); g.fill(); };
  g.fillStyle = '#ffd43b'; star(40, 46, 24); for (const [x, y] of [[84, 18], [102, 40], [102, 68], [84, 90]]) star(x, y, 8);
  shadeFolds(g, w, h);
});
function shadeFolds(g: G2, w: number, h: number) {
  for (let i = 0; i < 5; i++) { const gr = g.createLinearGradient(i * w / 5, 0, (i + 1) * w / 5, 0); gr.addColorStop(0, 'rgba(0,0,0,.22)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = gr; g.fillRect(i * w / 5, 0, w / 5 + 1, h); }
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
export const cone2 = cone;
/** helper for sets that only light one way */
export const fixed = (light: SetDef['light']) => light;
export const glowBall = (p: Node, r: number, c: string, k: number, x: number, y: number, z: number) => soft(ball(p, r, lit(c, k), x, y, z));
export {smat};
