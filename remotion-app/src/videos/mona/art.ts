// Painted surfaces and pictures of the Mona Lisa short: the portrait itself (drawn in the film's own flat style, with eyes
// that can move), the other old masters on the wall, gilded frames, parquet, wall cloth, stone and cobbles.
import * as THREE from 'three';
import {box, grp, lit, mat, panel, rng, smat, soft, tex, tmat, type G2, type Node} from './kit';

const INK = '#15121c';
type P = [number, number];
const poly = (g: G2, pts: P[], fill: string | null, line = 0, stroke = INK) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (line) { g.lineWidth = line; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); }
};
const ell = (g: G2, x: number, y: number, rx: number, ry: number, fill: string | null, line = 0, rot = 0, a0 = 0, a1 = Math.PI * 2) => {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, a0, a1); if (fill) { g.fillStyle = fill; g.fill(); } if (line) { g.lineWidth = line; g.strokeStyle = INK; g.stroke(); }
};
const curveTo = (g: G2, pts: P[], w: number, col: string) => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i + 1 < pts.length; i += 2) g.quadraticCurveTo(...pts[i], ...pts[i + 1]); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); };

export type Mood = 'smile' | 'bored' | 'wide' | 'wink';
/** The portrait, 53 by 77: a hazy blue-green country behind her, the sheer veil, the folded hands, and the smile.
 *  `eyes` -1 .. 1 turns her gaze; `mood` changes the mouth and the brows. */
export const monaTex = (eyes = 0, mood: Mood = 'smile') => tex(`mona-${eyes}-${mood}`, 424, 616, (g, w, h) => {
  // ---- the country behind her: pale sky, blue peaks, a lake, ochre rock, the parapet
  const sky = g.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, '#9fb3a6'); sky.addColorStop(0.5, '#b9bf94'); sky.addColorStop(1, '#cdb87c'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  poly(g, [[0, 232], [30, 150], [58, 196], [96, 128], [136, 200], [150, 330], [0, 330]], '#7d9a98', 0);
  poly(g, [[0, 244], [40, 186], [86, 214], [120, 168], [150, 240], [150, 330], [0, 330]], 'rgba(150,170,166,0.75)', 0);
  poly(g, [[262, 226], [300, 132], [332, 188], [372, 112], [424, 176], [424, 330], [262, 330]], '#7d9a98', 0);
  poly(g, [[262, 250], [340, 228], [424, 244], [424, 300], [262, 300]], '#a8c0b8', 0);
  poly(g, [[0, 292], [64, 268], [132, 292], [168, 336], [168, 430], [0, 430]], '#87824a', 0);
  poly(g, [[252, 296], [330, 282], [424, 298], [424, 430], [252, 430]], '#76763f', 0);
  curveTo(g, [[10, 424], [72, 396], [42, 364], [12, 340], [52, 320], [98, 306], [72, 288]], 10, '#cdae6a'); curveTo(g, [[10, 424], [72, 396], [42, 364], [12, 340], [52, 320], [98, 306], [72, 288]], 2, '#8a6a34');
  g.fillStyle = '#b89a5a'; g.fillRect(306, 320, 112, 8); g.strokeStyle = 'rgba(90,70,30,0.8)'; g.lineWidth = 1.6; g.strokeRect(306, 320, 112, 8);
  for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(70,60,30,0.8)'; g.beginPath(); g.ellipse(318 + i * 28, 330, 8, 8, 0, Math.PI, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#4f4a2c'; g.fillRect(0, 412, w, h - 412);                                     // the parapet
  // ---- her veil, hair and dress
  poly(g, [[208, 104], [286, 122], [322, 208], [330, 372], [350, 400], [74, 400], [94, 372], [102, 208], [138, 122]], '#2a2018', 3);
  poly(g, [[60, 616], [74, 424], [118, 360], [306, 360], [350, 424], [364, 616]], '#3b3f2e', 3);
  // the neckline of the dress, with the gold embroidery
  poly(g, [[154, 356], [178, 330], [246, 330], [270, 356], [262, 402], [212, 418], [162, 402]], '#dfc08a', 2.4);
  for (let i = 0; i < 9; i++) { const t = i / 8, x = 158 + t * 108, y = 366 + Math.sin(t * Math.PI) * 22; g.strokeStyle = '#b98a2c'; g.lineWidth = 2.2; g.beginPath(); g.arc(x, y, 5, 0, 7); g.stroke(); }
  for (const s of [-1, 1]) { poly(g, [[212 + s * 74, 436], [212 + s * 150, 428], [212 + s * 154, 566], [212 + s * 86, 582]], '#8f7130', 2); for (let i = 0; i < 4; i++) curveTo(g, [[212 + s * (88 + i * 17), 444], [212 + s * (98 + i * 17), 502], [212 + s * (92 + i * 17), 570]], 1.4, 'rgba(90,64,20,0.7)'); }
  // ---- the face: high forehead, no brows, small mouth, the corners lifted
  ell(g, 212, 234, 63, 88, '#e8c894', 3);
  g.save(); g.beginPath(); g.ellipse(212, 234, 63, 88, 0, 0, 7); g.clip();
  ell(g, 278, 244, 38, 96, 'rgba(150,104,48,0.3)', 0); ell(g, 150, 240, 30, 90, 'rgba(255,236,196,0.3)', 0);
  // the veil across the brow, and the hair coming down either side
  poly(g, [[146, 158], [212, 142], [278, 158], [284, 208], [250, 182], [212, 164], [174, 182], [140, 208]], '#2a2018', 0);
  poly(g, [[146, 158], [156, 300], [140, 340], [118, 300], [120, 200]], '#2a2018', 0);
  poly(g, [[278, 158], [268, 300], [284, 340], [306, 300], [304, 200]], '#2a2018', 0);
  g.fillStyle = 'rgba(40,30,20,0.14)'; g.fillRect(140, 250, 80, 120); g.restore();
  g.strokeStyle = 'rgba(60,44,26,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(146, 160); g.quadraticCurveTo(212, 132, 278, 160); g.stroke();
  // eyes: calm, looking out
  const ex = eyes * 5, ey = 232;
  for (const s of [-1, 1]) {
    const x = 212 + s * 25;
    if (mood === 'wink' && s === 1) { curveTo(g, [[x - 12, ey], [x, ey + 8], [x + 12, ey]], 3.6, '#2c2016'); continue; }
    if (mood === 'wide') { ell(g, x, ey, 11, 12, '#fffdf4', 2.4); ell(g, x + ex, ey, 4.4, 5.2, '#3a2a18'); continue; }
    ell(g, x + ex, ey + 1, 4.8, 6.4, '#3a2a18');
    g.strokeStyle = 'rgba(60,44,26,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(x + ex * 0.4, ey + 1, 7.6, -2.4, -0.7); g.stroke();       // the lid
    if (mood === 'bored') { g.fillStyle = '#e8c894'; g.fillRect(x - 12, ey - 8, 24, 9); curveTo(g, [[x - 11, ey], [x, ey + 1], [x + 11, ey]], 2.8, '#2c2016'); }
    else { g.strokeStyle = 'rgba(70,52,30,0.35)'; g.lineWidth = 2.6; g.beginPath(); g.arc(x, ey - 8, 12, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }   // a brow so faint it is no brow at all
  }
  curveTo(g, [[214, 246], [207, 268], [217, 270]], 2, 'rgba(140,104,64,0.85)');
  if (mood === 'bored') curveTo(g, [[194, 288], [212, 289], [230, 288]], 3, '#8a4632');
  else if (mood === 'wide') ell(g, 212, 290, 7, 8, '#7c3a2a', 2);
  else {
    g.save(); g.beginPath(); g.moveTo(188, 282); g.quadraticCurveTo(212, 300, 236, 282); g.quadraticCurveTo(212, 292, 188, 282); g.fillStyle = '#8f4634'; g.fill(); g.restore();
    curveTo(g, [[186, 281], [190, 284], [193, 288]], 2.2, 'rgba(120,60,40,0.8)'); curveTo(g, [[238, 281], [234, 284], [231, 288]], 2.2, 'rgba(120,60,40,0.8)');
    g.strokeStyle = 'rgba(120,60,40,0.4)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(196, 276); g.quadraticCurveTo(212, 282, 228, 276); g.stroke();
  }
  // ---- the folded hands on the arm of the chair
  poly(g, [[104, 578], [320, 578], [334, 616], [92, 616]], '#3a2a18', 2.4);
  ell(g, 240, 568, 48, 20, '#e8c894', 2.4, -0.16); ell(g, 198, 552, 48, 19, '#e8c894', 2.4, 0.14);
  for (let i = 0; i < 3; i++) curveTo(g, [[214 + i * 12, 540], [222 + i * 12, 548], [224 + i * 12, 562]], 1.6, 'rgba(150,110,60,0.8)');
  // ---- four hundred years of varnish, and the sfumato at the edges
  g.fillStyle = 'rgba(128,88,22,0.07)'; g.fillRect(0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h * 0.42, h * 0.3, w / 2, h * 0.42, h * 0.85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(26,14,2,0.3)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(224,196,140,0.35)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
});

/** Old masters for the rest of the wall: eight invented pictures in the manner of a museum, flat and brown with varnish. */
export const oldMaster = (i: number, wide = true) => tex(`master-${i}-${wide}`, wide ? 400 : 300, wide ? 300 : 400, (g, w, h) => {
  const r = rng(31 + i * 17), k = i % 8;
  const varnish = () => { g.fillStyle = 'rgba(110,70,20,0.1)'; g.fillRect(0, 0, w, h); const v = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,0.28)'); g.fillStyle = v; g.fillRect(0, 0, w, h); };
  const figure = (x: number, y: number, s: number, robe: string, skin = '#e3c090', hair = '#3a2416') => { poly(g, [[x - 0.5 * s, y + 1.5 * s], [x - 0.36 * s, y + 0.3 * s], [x + 0.36 * s, y + 0.3 * s], [x + 0.5 * s, y + 1.5 * s]], robe, 2); ell(g, x, y, 0.3 * s, 0.34 * s, skin, 2); ell(g, x, y - 0.12 * s, 0.32 * s, 0.26 * s, hair, 0, 0, Math.PI, Math.PI * 2); };
  if (k === 0) {                                                                                  // a landscape: sky, a river, trees
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#8fb0c4'); s.addColorStop(0.6, '#e6d6a0'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    poly(g, [[0, h * 0.62], [w * 0.3, h * 0.48], [w * 0.6, h * 0.6], [w, h * 0.5], [w, h], [0, h]], '#5a7a4a', 2); poly(g, [[w * 0.3, h], [w * 0.46, h * 0.62], [w * 0.58, h * 0.62], [w * 0.8, h]], '#8fb0c4', 2);
    for (const [x, s2] of [[0.14, 1], [0.84, 1.2], [0.7, 0.7]]) { g.fillStyle = '#4a3320'; g.fillRect(w * x - 4, h * 0.4, 8, h * 0.3); ell(g, w * x, h * 0.36, 34 * s2, 44 * s2, '#3f5a30', 2); }
  } else if (k === 1) {                                                                           // a man in a ruff on a dark ground
    g.fillStyle = '#2a1c14'; g.fillRect(0, 0, w, h); figure(w / 2, h * 0.38, h * 0.3, '#1c1a22'); ell(g, w / 2, h * 0.5, h * 0.17, h * 0.045, '#f4efe2', 2); ell(g, w / 2, h * 0.44, h * 0.05, h * 0.03, '#3a2416', 0);
  } else if (k === 2) {                                                                           // a still life: a bowl of fruit, a jug, a cloth
    g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a5230'; g.fillRect(0, h * 0.66, w, h * 0.34); poly(g, [[w * 0.5, h * 0.66], [w, h * 0.6], [w, h], [w * 0.6, h]], '#e9e2d0', 2);
    ell(g, w * 0.36, h * 0.62, w * 0.2, h * 0.09, '#b98a2c', 2, 0, 0, Math.PI); for (const [x, y, c] of [[0.26, 0.56, '#d63a2f'], [0.36, 0.52, '#f2c230'], [0.45, 0.56, '#6a8f3a'], [0.34, 0.58, '#e8853a']] as [number, number, string][]) ell(g, w * x, h * y, w * 0.055, w * 0.055, c, 2);
    poly(g, [[w * 0.68, h * 0.66], [w * 0.64, h * 0.4], [w * 0.7, h * 0.3], [w * 0.78, h * 0.3], [w * 0.84, h * 0.4], [w * 0.8, h * 0.66]], '#8fa6b8', 2);
  } else if (k === 3) {                                                                           // a holy family: two figures and a child under an arch
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#6f8fb0'); s.addColorStop(1, '#c9b77a'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    figure(w * 0.36, h * 0.36, h * 0.3, '#2f4a8a'); figure(w * 0.66, h * 0.34, h * 0.3, '#8a2f3d', '#d9b080', '#8a8690'); figure(w * 0.5, h * 0.62, h * 0.16, '#f4efe2', '#ecd0a0', '#c9a23a'); ell(g, w * 0.36, h * 0.3, h * 0.13, h * 0.13, null, 2.4);
  } else if (k === 4) {                                                                           // a ship in a storm
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#4a5a6a'); s.addColorStop(0.6, '#c9b08a'); g.fillStyle = s; g.fillRect(0, 0, w, h); poly(g, [[0, h * 0.62], [w * 0.25, h * 0.56], [w * 0.5, h * 0.64], [w * 0.75, h * 0.56], [w, h * 0.62], [w, h], [0, h]], '#2f4a5a', 2);
    poly(g, [[w * 0.3, h * 0.58], [w * 0.7, h * 0.58], [w * 0.62, h * 0.68], [w * 0.36, h * 0.68]], '#4a3320', 2); g.fillStyle = '#4a3320'; g.fillRect(w * 0.49, h * 0.2, 5, h * 0.4); poly(g, [[w * 0.5, h * 0.22], [w * 0.68, h * 0.52], [w * 0.5, h * 0.52]], '#f4efe2', 2); poly(g, [[w * 0.48, h * 0.26], [w * 0.34, h * 0.52], [w * 0.48, h * 0.52]], '#e9e2d0', 2);
  } else if (k === 5) {                                                                           // a rider on a white horse
    g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a7a4a'; g.fillRect(0, h * 0.72, w, h * 0.28);
    ell(g, w * 0.5, h * 0.56, w * 0.24, h * 0.12, '#f4efe2', 2); for (const x of [0.34, 0.42, 0.6, 0.68]) { g.fillStyle = '#f4efe2'; g.fillRect(w * x, h * 0.6, 7, h * 0.18); g.strokeRect(w * x, h * 0.6, 7, h * 0.18); } poly(g, [[w * 0.68, h * 0.5], [w * 0.8, h * 0.34], [w * 0.86, h * 0.4], [w * 0.74, h * 0.56]], '#f4efe2', 2); figure(w * 0.5, h * 0.3, h * 0.16, '#b8232f');
  } else if (k === 6) {                                                                           // a lady in red at a window
    g.fillStyle = '#3a3028'; g.fillRect(0, 0, w, h); g.fillStyle = '#8fb0c4'; g.fillRect(w * 0.62, h * 0.12, w * 0.28, h * 0.34); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(w * 0.62, h * 0.12, w * 0.28, h * 0.34); figure(w * 0.42, h * 0.36, h * 0.32, '#a8232f', '#ecd0a0', '#c9a23a');
  } else {                                                                                        // clouds and three cherubs
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#7f9fc4'); s.addColorStop(1, '#f2d6b0'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 7; j++) ell(g, r() * w, h * (0.3 + r() * 0.6), 50 + r() * 40, 22 + r() * 16, '#f4efe2', 0); for (const [x, y] of [[0.3, 0.4], [0.6, 0.3], [0.5, 0.64]]) { ell(g, w * x, h * y, 16, 17, '#ecd0a0', 2); ell(g, w * x - 22, h * y + 6, 14, 8, '#fffdf4', 2, -0.5); ell(g, w * x + 22, h * y + 6, 14, 8, '#fffdf4', 2, 0.5); }
  }
  varnish();
});

const GOLD = '#d9a83c', GOLD_DARK = '#a8782a', GOLD_LIGHT = '#f2cf6a';
export type Framed = {g: THREE.Group; pic: THREE.Mesh; glass?: THREE.Mesh; w: number; h: number};
/** A picture in a gilded frame: four moulded bars, an inner slip, corner pieces. (x, y, z) is the centre of the picture. `bar` is the width of the moulding. */
export function framed(p: Node, w: number, h: number, t: THREE.Texture, x: number, y: number, z: number, o: {bar?: number; depth?: number; lit?: boolean; glass?: boolean; plain?: boolean} = {}): Framed {
  const g = grp(p, x, y, z), bar = o.bar ?? 0.13, d = o.depth ?? 0.09, W = w + 2 * bar, H = h + 2 * bar;
  const pic = panel(g, w, h, o.lit ? smat(t, 1) : tmat(t), 0, 0, 0.012);
  box(g, W, H, 0.02, '#3a2a18', 0, 0, -0.01);                                                    // the back board
  for (const s of [-1, 1]) {
    box(g, W, bar, d, GOLD, 0, s * (h / 2 + bar / 2), d / 2); box(g, bar, h, d, GOLD, s * (w / 2 + bar / 2), 0, d / 2);
    if (!o.plain) { box(g, W - bar * 0.5, bar * 0.34, d * 0.5, GOLD_LIGHT, 0, s * (h / 2 + bar * 0.5), d + d * 0.2); box(g, bar * 0.34, H - bar * 0.5, d * 0.5, GOLD_LIGHT, s * (w / 2 + bar * 0.5), 0, d + d * 0.2); }
    box(g, w + 0.02, 0.022, 0.03, GOLD_DARK, 0, s * (h / 2 - 0.004), 0.03); box(g, 0.022, h + 0.02, 0.03, GOLD_DARK, s * (w / 2 - 0.004), 0, 0.03);
    if (!o.plain) for (const t2 of [-1, 1]) box(g, bar * 1.12, bar * 1.12, d * 1.3, GOLD_LIGHT, s * (w / 2 + bar / 2), t2 * (h / 2 + bar / 2), d * 0.66);
  }
  const out: Framed = {g, pic, w, h};
  if (o.glass) {                                                                                 // a pane in front of the picture: two streaks of reflected light
    const gt = tex('glass-streak', 128, 128, (c) => { c.clearRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.moveTo(18, 128); c.lineTo(58, 0); c.lineTo(74, 0); c.lineTo(34, 128); c.fill(); c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.moveTo(60, 128); c.lineTo(100, 0); c.lineTo(106, 0); c.lineTo(66, 128); c.fill(); });
    const m = new THREE.MeshBasicMaterial({map: gt, transparent: true, depthWrite: false, opacity: 0.55}); out.glass = soft(panel(g, w, h, m, 0, 0, 0.05));
  }
  return out;
}

/** Oak parquet laid in herringbone. */
export const parquetTex = () => tex('parquet', 512, 512, (g) => {
  const r = rng(5), L = 128, T = 32; g.fillStyle = '#a8763c'; g.fillRect(0, 0, 512, 512);
  for (let row = -2; row < 20; row++) for (let col = -2; col < 6; col++) for (const flip of [0, 1]) {
    const x = col * L * 0.5 * 2 + (flip ? T : 0) - 64, y = row * T + (flip ? 0 : 0);
    g.save(); g.translate(x + (row % 2) * 0 + flip * L, y); g.rotate(flip ? Math.PI / 4 : -Math.PI / 4);
    const c = 150 + Math.floor(r() * 40); g.fillStyle = `rgb(${c + 30},${Math.floor(c * 0.74)},${Math.floor(c * 0.4)})`; g.fillRect(0, 0, L, T); g.strokeStyle = 'rgba(60,34,12,0.7)'; g.lineWidth = 2; g.strokeRect(0, 0, L, T);
    g.strokeStyle = 'rgba(60,34,12,0.22)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(4, 6 + k * 9 + r() * 4); g.lineTo(L - 4, 6 + k * 9 + r() * 4); g.stroke(); }
    g.restore();
  }
}, true);
/** Plain planks for a workshop, a stair landing or a rented room. */
export const boardsTex = (key: string, base: string, line: string) => tex('boards-' + key, 512, 512, (g) => {
  const r = rng(key.length * 7 + 3); g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { const c = 0.9 + r() * 0.2; g.fillStyle = `rgba(${c > 1 ? 255 : 0},${c > 1 ? 255 : 0},${c > 1 ? 255 : 0},${Math.abs(c - 1) * 0.5})`; g.fillRect(0, i * 64, 512, 64); g.strokeStyle = line; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); const jx = r() * 512; g.beginPath(); g.moveTo(jx, i * 64); g.lineTo(jx, i * 64 + 64); g.stroke(); g.globalAlpha = 0.25; g.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = i * 64 + 10 + k * 13 + r() * 5; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 8, 340, y + (r() - 0.5) * 8, 512, y); g.stroke(); } g.globalAlpha = 1; }
}, true);
/** Wall cloth with a woven pattern (the red of a picture gallery, or the paper of a hotel room). */
export const damaskTex = (key: string, base: string, figure: string) => tex('damask-' + key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = figure;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + (y % 2 ? 32 : 0), cy = y * 64 + 32; for (const [dx, dy, rx, ry] of [[0, 0, 9, 18], [-13, 8, 6, 10], [13, 8, 6, 10], [0, -22, 4, 6]]) { g.beginPath(); g.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + dx + 256, cy + dy, rx, ry, 0, 0, 7); g.fill(); } }
}, true);
/** Dressed stone in courses: the Louvre's walls, a stairwell, a cell. */
export const stoneTex = (key: string, cols: string[], mortar: string) => tex('stone-' + key, 512, 512, (g) => {
  const r = rng(key.length * 13 + 1); g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) { let x = row % 2 ? -64 : 0; while (x < 512) { const bw = 96 + Math.floor(r() * 3) * 32; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + 2, row * 64 + 2, bw - 4, 60); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, row * 64 + 2, bw - 4, 5); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x + 2, row * 64 + 54, bw - 4, 8); for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(0,0,0,${0.05 * r()})`; g.fillRect(x + 4 + r() * (bw - 10), row * 64 + 4 + r() * 54, 2 + r() * 4, 2 + r() * 3); } x += bw; } }
}, true);
/** Paving stones. */
export const cobbleTex = (key = 'c', base = '#9a9288') => tex('cobble-' + key, 512, 512, (g) => {
  const r = rng(77); g.fillStyle = '#5a554e'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 12; row++) for (let col = -1; col < 9; col++) { const x = col * 64 + (row % 2 ? 32 : 0) + (r() - 0.5) * 6, y = row * 43 + (r() - 0.5) * 5, c = new THREE.Color(base).multiplyScalar(0.86 + r() * 0.3); g.fillStyle = '#' + c.getHexString(); g.beginPath(); g.roundRect(x + 3, y + 3, 58, 37, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.roundRect(x + 7, y + 6, 46, 8, 4); g.fill(); }
}, true);
/** Limewashed plaster with a few cracks and stains. */
export const plasterTex = (key: string, base: string) => tex('plaster-' + key, 512, 512, (g) => {
  const r = rng(key.length * 19 + 9); g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.05 * r()})` : `rgba(255,255,255,${0.06 * r()})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 10, 2 + r() * 6); }
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1.4; for (let i = 0; i < 5; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 50; y += 10 + r() * 26; g.lineTo(x, y); } g.stroke(); }
}, true);

/** The four iron pegs she hung on, the darker rectangle the frame left on the cloth, and the little brass label beneath. Returns the pegs. */
export function pegs(p: Node, x: number, y: number, z: number, w: number, h: number) {
  const g = grp(p, x, y, z);
  soft(panel(g, w + 0.16, h + 0.16, new THREE.MeshBasicMaterial({color: '#000000', transparent: true, opacity: 0.2, depthWrite: false}), 0, 0, 0.004));
  const out: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) for (const sy of [1, -1]) { const peg = box(g, 0.05, 0.05, 0.12, '#2a2a30', sx * w * 0.34, sy * h * 0.3, 0.06); box(g, 0.05, 0.09, 0.03, '#3a3a42', sx * w * 0.34, sy * h * 0.3 + 0.03, 0.115); out.push(peg); }
  return {g, pegs: out};
}
export const brassLabel = (p: Node, x: number, y: number, z: number, text1: string, text2 = '') => {
  const t = tex('label-' + text1 + text2, 512, 160, (g) => { g.fillStyle = '#d9b45a'; g.fillRect(0, 0, 512, 160); g.strokeStyle = '#8a6a2a'; g.lineWidth = 8; g.strokeRect(8, 8, 496, 144); g.fillStyle = '#3a2a10'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 54px Montserrat, sans-serif'; g.fillText(text1, 256, text2 ? 58 : 82); if (text2) { g.font = '700 38px Montserrat, sans-serif'; g.fillText(text2, 256, 112); } });
  const g2 = grp(p, x, y, z); box(g2, 0.46, 0.15, 0.02, '#a8842a', 0, 0, 0.0); panel(g2, 0.44, 0.135, smat(t, 1), 0, 0, 0.012); return g2;
};
void lit; void mat;
