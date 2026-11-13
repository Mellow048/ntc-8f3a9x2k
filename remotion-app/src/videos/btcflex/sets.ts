// Sets of the bitcoin flex short, part 1: what every set shares, the supercar, and the sets coins, desk, drive, villa,
// deep and club. Each builder fills a group once and returns a tick that poses it for a frame (motion is a pure function of
// the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, mat, mesh, panel, pool, pop, rng, rod, rrect, smat, smooth, soft, tex, text, tiled, tileTex, tmat, torus, vgrad, woodTex, type G2, type Node, type V} from './kit';
import {actor, AGENT, LAM, STAFF} from './cast';
import {bubble, bundle, coinStack, coinStream, glints, halo, laptop, level, mug, palm, table} from './props';
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
const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };

/** Rings that leave a point, facing the camera side of the set. Call the returned function every frame. */
export function rings(p: Node, n = 3, color = '#7af0e0') {
  const os = Array.from({length: n}, () => { const o = soft(mesh(p, new THREE.RingGeometry(0.86, 1, 44), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}))); o.renderOrder = 6; return o; });
  return (f: number, on: boolean, at: V, r = 0.5, ry = 0, speed = 0.05) => os.forEach((o, i) => {
    const u = (f * speed + i / n) % 1; o.visible = on; o.position.set(...at); o.rotation.y = ry; o.scale.setScalar(r * (0.2 + 0.8 * u)); op(o, 0.9 * (1 - u) ** 1.4);
  });
}
/** a dashed outline of head and shoulders: somebody who is in the story and is not drawn */
export const ghostTex = () => tex('ghost', 300, 500, (g, w) => {
  g.strokeStyle = '#ffe14a'; g.lineWidth = 11; g.setLineDash([24, 17]); g.lineCap = 'round'; g.beginPath(); g.arc(w / 2, 104, 78, 0, 7); g.stroke(); rrect(g, w / 2 - 96, 200, 192, 280, 60); g.stroke();
});
/** a padlock, shut or open */
export function lock(g: G2, x: number, y: number, s: number, open: boolean, body: string, line = INK) {
  g.save(); g.lineWidth = s * 0.16; g.strokeStyle = body; g.lineCap = 'round';
  g.beginPath(); if (open) { g.arc(x - s * 0.34, y - s * 0.36, s * 0.3, Math.PI, 0); g.lineTo(x - s * 0.04, y - s * 0.1); } else { g.moveTo(x - s * 0.3, y - s * 0.1); g.lineTo(x - s * 0.3, y - s * 0.36); g.arc(x, y - s * 0.36, s * 0.3, Math.PI, 0); g.lineTo(x + s * 0.3, y - s * 0.1); } g.stroke();
  g.fillStyle = body; rrect(g, x - s * 0.5, y - s * 0.12, s, s * 0.74, s * 0.12); g.fill();
  g.fillStyle = line; g.beginPath(); g.arc(x, y + s * 0.18, s * 0.1, 0, 7); g.fill(); g.fillRect(x - s * 0.04, y + s * 0.2, s * 0.08, s * 0.22); g.restore();
}
/** the bitcoin sign on an orange disc */
export function btcSign(g: G2, x: number, y: number, r: number) {
  g.save(); g.fillStyle = '#f7931a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#c56f08'; g.lineWidth = r * 0.12; g.stroke();
  g.fillStyle = '#ffffff'; for (const dx of [-0.16, 0.1]) { g.fillRect(x + dx * r, y - r * 0.7, r * 0.1, r * 0.22); g.fillRect(x + dx * r, y + r * 0.48, r * 0.1, r * 0.22); }
  text(g, 'B', x, y + r * 0.04, r * 1.18, '#ffffff'); g.restore();
}

// ------------------------------------------------------------------ the supercar
/** A skin over cross-sections. Each section is a closed ring of [y, z] points at a station x; all rings have the same count. */
function loftGeo(secs: {x: number; ring: [number, number][]}[]) {
  const n = secs[0].ring.length, pos: number[] = [];
  const P = (i: number, j: number): V => { const s = secs[i], [y, z] = s.ring[j % n]; return [s.x, y, z]; };
  const tri = (a: V, b: V, c: V) => { pos.push(...a, ...b, ...c); };
  for (let i = 0; i + 1 < secs.length; i++) for (let j = 0; j < n; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); tri(a, b, c); tri(a, c, d); }
  for (const i of [0, secs.length - 1]) {                                    // close both ends with a fan
    const s = secs[i], c: V = [s.x, s.ring.reduce((t, q) => t + q[0], 0) / n, s.ring.reduce((t, q) => t + q[1], 0) / n];
    for (let j = 0; j < n; j++) tri(c, P(i, j), P(i, j + 1));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
// station, half-width, floor, sill, shoulder, top, half-width of the top
const BODY: number[][] = [[-1.15, 0.45, 0.17, 0.21, 0.42, 0.45, 0.36], [-0.95, 0.5, 0.1, 0.16, 0.45, 0.5, 0.4], [-0.45, 0.5, 0.1, 0.16, 0.44, 0.535, 0.36], [-0.1, 0.5, 0.1, 0.16, 0.42, 0.6, 0.31],
  [0.25, 0.5, 0.1, 0.16, 0.4, 0.58, 0.31], [0.62, 0.49, 0.1, 0.15, 0.35, 0.375, 0.35], [1.0, 0.46, 0.1, 0.14, 0.25, 0.265, 0.37], [1.15, 0.42, 0.12, 0.14, 0.185, 0.195, 0.34]];
const GLASS: number[][] = [[-0.52, 0.31, 0.5, 0.55], [-0.1, 0.32, 0.5, 0.618], [0.25, 0.32, 0.48, 0.598], [0.66, 0.36, 0.35, 0.385]];
let carGeo: {body: THREE.BufferGeometry; glass: THREE.BufferGeometry; wheel: THREE.BufferGeometry; hub: THREE.BufferGeometry} | null = null;
const paint = new Map<string, THREE.Material>();
/** A low wedge of a car, nose to +x, 2.3 long: nobody's model. Built from cross-sections, not from a side outline (which reads as a box). */
export function supercar(p: Node, color: string, s = 1, plain = false) {
  if (!carGeo) {
    const wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 18); wheel.rotateX(Math.PI / 2);
    const hub = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 5); hub.rotateX(Math.PI / 2);
    carGeo = {
      body: loftGeo(BODY.map(([x, w, yb, ys, yh, yr, wr]) => ({x, ring: [[yb, -w * 0.9], [yb, w * 0.9], [ys, w], [yh, w * 0.97], [yr, wr], [yr, -wr], [yh, -w * 0.97], [ys, -w]] as [number, number][]}))),
      glass: loftGeo(GLASS.map(([x, w, y0, y1]) => ({x, ring: [[y0, -w], [y0, w], [y1, w * 0.78], [y1, -w * 0.78]] as [number, number][]}))),
      wheel, hub,
    };
  }
  let m = paint.get(color); if (!m) paint.set(color, (m = new THREE.MeshLambertMaterial({color, side: THREE.DoubleSide})));
  const g = grp(p); g.scale.setScalar(s);
  mesh(g, carGeo.body, m); const gl = mesh(g, carGeo.glass, lit('#11141b', 1)); gl.castShadow = false;
  for (const x of [-0.72, 0.72]) for (const z of [-0.43, 0.43]) { mesh(g, carGeo.wheel, '#16171d', x, 0.2, z); if (!plain) mesh(g, carGeo.hub, '#c9ced6', x, 0.2, z); }
  for (const z of [-0.25, 0.25]) box(g, 0.03, 0.035, 0.2, lit('#fff3c0', 2), 1.145, 0.215, z).rotation.y = z > 0 ? -0.25 : 0.25;      // thin lit blades, not bricks
  box(g, 0.03, 0.04, 0.78, lit('#ff3b30', 1.5), -1.158, 0.385, 0);
  if (!plain) {
    for (const z of [-0.3, 0.3]) box(g, 0.05, 0.16, 0.04, '#16171d', -1.0, 0.56, z);
    box(g, 0.27, 0.03, 0.98, m, -1.04, 0.655, 0); box(g, 0.12, 0.03, 0.9, '#16171d', 1.1, 0.105, 0);
    for (const z of [-0.502, 0.502]) box(g, 0.3, 0.12, 0.02, lit('#11141b', 1), -0.42, 0.3, z);
  }
  return g;
}

// ------------------------------------------------------------------ coins: what was taken, as a stage full of gold
const walletTex = () => tex('coins-wallet', 400, 260, (g, w, h) => {
  g.fillStyle = '#10141c'; rrect(g, 7, 7, w - 14, h - 14, 38); g.fill(); g.strokeStyle = '#7af0e0'; g.lineWidth = 11; g.stroke();
  text(g, '?', 132, h / 2 + 8, 190, '#7af0e0'); g.lineWidth = 10; rrect(g, 238, 78, 112, 104, 24); g.stroke();
});
export const coins: Builder = (root) => {
  backdrop(root, ['#05061a', '#10143c', '#1c1f55']);
  floor(root, 30, 30, tmat(tiled(tileTex('coins-floor', '#0b0e2c', '#1a2060', 4), 10, 10)));
  cyl(root, 1.62, 0.06, '#0d1136', 0, 0.03, 0, 1.62, 44); cyl(root, 1.34, 0.16, '#161c52', 0, 0.08, 0, 1.34, 44);
  const rim = torus(root, 1.34, 0.035, lit('#f2c230', 1.25), 0, 0.165, 0); rim.rotation.x = Math.PI / 2;
  const r = rng(5), at: [number, number][] = [];
  for (let i = 0; i < 16; i++) { const a = i * 2.39996, d = 0.2 * Math.sqrt(i); at.push([d * Math.cos(a), d * Math.sin(a)]); }
  const stacks = at.map(([x, z]) => coinStack(root, x, 0.16, z, Math.round(22 - 13 * Math.hypot(x, z) + 3 * r()), 0.12));
  const tops: V[] = at.map(([x, z], i) => [x, 0.16 + (stacks[i].userData.h as number) + 0.02, z]);
  const glint = glints(root, [tops[0], tops[3], tops[5], tops[8], tops[11], tops[14]].map(([x, y, z]) => [x + 0.05, y + 0.06, z + 0.14] as V));
  beam(root, 0.3, 2.3, 7.5, '#ffd98a', 0.035, 0, 7.5, -0.7); const spot = pool(root, 1.5, '#ffe2a0', 0.3, 0, 0, 0.17);
  const me = actor(root, LAM(0), {grin: {expr: 'grin', pose: 'panic'}, laugh: {expr: 'laugh', pose: 'panic'}}, 0, 0.36, -1.0, {scale: 1.05, res: 1.1, shadow: 0});
  const wallet = soft(panel(root, 0.86, 0.56, smat(walletTex(), 1.1, true), 1.02, 2.42, -0.2));
  const stream = coinStream(root, 18, 0.085);
  const gone = soft(mesh(root, new THREE.PlaneGeometry(3.2, 3.2), smat(tex('coins-gone', 512, 512, (g) => { g.strokeStyle = '#ffe14a'; g.lineWidth = 5; g.setLineDash([13, 9]); for (const [x, z] of at) { g.beginPath(); g.arc(256 + x * 160, 256 + z * 160, 20, 0, 7); g.stroke(); } }), 1.2, true), 0, 0.172, 0)); gone.rotation.x = -Math.PI / 2;
  return {
    light: () => ({...LIGHT.dark, amb: 1.05, key: '#ffe6b0', keyI: 1.1}),
    tick: ({f, cam, shot}) => {
      const pile = shot.v === 'pile', a = W(71) - 2, end = W(76) - 2;                    // the drain and the empty stage are one take: timed from words
      me.node.visible = pile; me.show(Math.floor(f / 12) % 2 ? 'laugh' : 'grin'); me.node.position.y = lerp(-1.5, 0.36, smooth(f, 4, 22)) + hop(f, W(8), 0.12, 9); me.tick(f, cam);
      stacks.forEach((s, i) => level(s, pile ? 1 : 1 - smooth(f, a + 8 + i * 1.6, a + 28 + i * 1.6)));
      glint(f, pile || f < a + 16); op(spot, 0.3 + 0.05 * Math.sin(f * 0.2));
      wallet.visible = !pile; wallet.scale.setScalar(pop(f, a + 3, 8) * (1 + 0.05 * Math.sin(f * 0.6) * (f < end ? 1 : 0))); wallet.position.y = 2.42 + 0.03 * Math.sin(f * 0.13);
      if (pile) stream.hide(); else stream.set(f, a + 8, end - 6, (i) => [at[i % 16][0], 0.7, at[i % 16][1]], [0.3, 3.0, 0.2], () => [1.02, 2.42, -0.15], 0.05);
      gone.visible = !pile && f >= end - 4; op(gone, smooth(f, end - 4, end + 8));
    },
  };
};

// ------------------------------------------------------------------ desk: a study in Washington; the man who was robbed is a dashed outline
const duskTex = () => tex('desk-window', 400, 460, (g, w, h) => {
  vgrad(g, w, h, ['#3b2a6e', '#a04c8c', '#ff9a6a', '#ffd9a0']);
  g.fillStyle = '#241a3c'; g.fillRect(0, h - 84, w, 84); g.fillRect(116, h - 112, 168, 30);
  g.beginPath(); g.arc(200, h - 150, 48, Math.PI, 0); g.fill(); g.fillRect(152, h - 152, 96, 44); g.fillRect(189, h - 224, 22, 30); g.fillRect(197, h - 250, 6, 30);      // a dome with a lantern: the Capitol, far off
  g.strokeStyle = '#efe6d2'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.lineWidth = 9; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
});
const cardBg = (g: G2, w: number, h: number, c = '#10141c') => { g.fillStyle = c; g.fillRect(0, 0, w, h); };
const walletCard = () => tex('desk-wallet', 520, 360, (g, w, h) => {
  cardBg(g, w, h); text(g, 'HIS WALLET', w / 2, 62, 46, '#9fd0ff', {font: 'Montserrat'});
  btcSign(g, 108, 176, 58); text(g, '4,100+', 334, 150, 104, '#ffffff'); text(g, 'BITCOIN', 334, 232, 50, '#f7931a');
  g.fillStyle = '#2fbf71'; rrect(g, 200, 276, 120, 60, 12); g.fill(); lock(g, 260, 304, 34, false, '#ffffff', '#2fbf71');
});
const callCard = () => tex('desk-call', 460, 420, (g, w, h) => {
  cardBg(g, w, h); text(g, 'INCOMING CALL', w / 2, 60, 46, '#9fd0ff', {font: 'Montserrat'});
  g.fillStyle = '#cfcadb'; g.beginPath(); g.arc(w / 2, 172, 62, 0, 7); g.fill(); text(g, '?', w / 2, 178, 96, '#4a4560');
  text(g, '“SECURITY TEAM”', w / 2, 282, 50, '#ffffff');
  for (const [x, c] of [[150, '#ff3b30'], [310, '#2fd07a']] as const) { g.fillStyle = c; g.beginPath(); g.arc(x, 360, 36, 0, 7); g.fill(); }
});
const toolCard = () => tex('desk-tool', 520, 450, (g, w, h) => {
  cardBg(g, w, h, '#fbfaf5'); g.fillStyle = '#3f8cff'; g.fillRect(0, 0, w, 84); text(g, '“SECURITY” TOOL', w / 2, 44, 44, '#ffffff', {font: 'Montserrat'});
  g.fillStyle = '#3f8cff'; g.beginPath(); g.moveTo(204, 120); g.lineTo(316, 120); g.lineTo(316, 186); g.lineTo(260, 232); g.lineTo(204, 186); g.closePath(); g.fill();
  text(g, 'INSTALL TO PROTECT YOUR COINS?', w / 2, 284, 27, '#1a1c24', {font: 'Montserrat', maxWidth: w - 50});
  g.fillStyle = '#c9ced6'; rrect(g, 50, 330, 180, 78, 16); g.fill(); text(g, 'NO', 140, 372, 50, '#5a6072');
  g.fillStyle = '#2fd07a'; rrect(g, 290, 330, 190, 78, 16); g.fill(); text(g, 'INSTALL', 385, 372, 50, '#ffffff');
});
const remoteCard = () => tex('desk-remote', 520, 450, (g, w, h) => {
  cardBg(g, w, h, '#d81f3a'); text(g, 'REMOTE ACCESS: ON', w / 2, 62, 46, '#ffffff', {font: 'Montserrat', maxWidth: w - 50});
  lock(g, w / 2 + 22, 232, 150, true, '#ffffff', '#d81f3a');
  text(g, 'SOMEBODY ELSE HAS THE DESKTOP', w / 2, 398, 27, '#ffffff', {font: 'Montserrat', maxWidth: w - 50});
});
const cursorTex = () => tex('cursor', 96, 128, (g) => {
  g.beginPath(); g.moveTo(10, 8); g.lineTo(10, 100); g.lineTo(34, 78); g.lineTo(52, 118); g.lineTo(70, 110); g.lineTo(52, 72); g.lineTo(84, 70); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 9; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke();
});
const booksTex = () => tex('desk-books', 300, 110, (g, w, h) => { const cs = ['#d81f3a', '#2f7fe0', '#f2c230', '#2f9e5a', '#8a4fd0', '#d81f3a', '#e8762c']; cs.forEach((c, i) => { g.fillStyle = c; g.fillRect(8 + i * 41, 8 + (i % 3) * 6, 35, h - 8 - (i % 3) * 6); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(8 + i * 41, 8 + (i % 3) * 6, 35, h - 8 - (i % 3) * 6); }); });
export const desk: Builder = (root) => {
  backdrop(root, ['#12142e', '#1c2046']);
  floor(root, 14, 12, tmat(tiled(woodTex('desk-floor', '#6a4426', '#3e2614'), 4, 4)));
  panel(root, 12, 6, tmat(tiled(grainTex('desk-wall', '#262b58', 0.1), 5, 3)), 0, 3, -1.6);
  soft(panel(root, 1.3, 1.5, smat(duskTex(), 1.05), -1.25, 2.2, -1.58));
  box(root, 1.5, 0.05, 0.26, '#3e2614', 1.05, 2.45, -1.46); soft(panel(root, 1.2, 0.44, smat(booksTex(), 1, true), 1.05, 2.7, -1.42));
  table(root, 0.2, 0.2, 2.6, 0.9, {h: 0.76, top: '#8a5a34', leg: '#3e2614', skirt: '#6a4426'});
  laptop(root, -0.35, 0.76, 0.2, {ry: Math.PI, w: 0.62, body: '#8f96a3', back: lit('#dfe6f0', 1)});
  cyl(root, 0.11, 0.03, '#2b2f3a', -1.0, 0.775, 0.1); cyl(root, 0.014, 0.42, '#2b2f3a', -1.0, 1.0, 0.1); const shade = cyl(root, 0.17, 0.2, lit('#ffe2a0', 1.4), -1.0, 1.28, 0.1, 0.09); shade.castShadow = false;
  halo(root, 1.0, '#ffd98a', 0.16, -1.0, 1.25, 0.2); mug(root, 1.15, 0.76, 0.3, '#d81f3a');
  // the phone, propped up, its screen to us
  const phone = grp(root, 0.8, 0.76, 0.36); box(phone, 0.2, 0.36, 0.03, '#15161b', 0, 0.2, 0).rotation.x = -0.2; const scr = soft(panel(phone, 0.165, 0.31, lamp('#1c2433', 1), 0, 0.2, 0.02)); scr.rotation.x = -0.2;
  const ring = rings(root, 3, '#2fd07a');
  const ghost = soft(panel(root, 0.78, 1.3, smat(ghostTex(), 1.2, true), -0.35, 1.5, -0.42));
  const one = bubble(root, 0.52, 2.0, 0.36, 0.95, 0.66, smat(walletCard(), 1.05), [-0.5, -0.36]);
  const call = bubble(root, 0.42, 2.02, 0.36, 0.8, 0.73, smat(callCard(), 1.05), [0.3, -0.5]);
  const tool = bubble(root, 0.36, 1.93, 0.3, 1.1, 0.95, smat(toolCard(), 1.05), [-0.5, -0.45]), toolM = tool.screen.material as THREE.MeshBasicMaterial, maps = [toolCard(), remoteCard()];
  const cursor = soft(panel(root, 0.15, 0.2, smat(cursorTex(), 1.15, true), 0, 0, 0.36)); cursor.renderOrder = 8;
  const BX = (px: number) => 0.36 + (px / 520 - 0.5) * 1.1, BY = (py: number) => 1.93 + (0.5 - py / 450) * 0.95;
  return {
    light: () => ({...LIGHT.warm, amb: 1.15}),
    tick: ({f, shot}) => {
      const v = shot.v, a = shot.at, click = W(68) + 1;
      ghost.position.y = 1.5 + 0.015 * Math.sin(f * 0.1);
      one.g.visible = v === 'one'; one.g.scale.setScalar(pop(f, a + 3, 8));
      call.g.visible = v === 'ring'; call.g.scale.setScalar(pop(f, a + 2, 8) * (1 + 0.025 * Math.sin(f * 0.9)));
      ring(f, v === 'ring', [0.8, 0.98, 0.42], 0.55, 0, 0.07); (scr.material as THREE.MeshBasicMaterial).color.set(v === 'ring' ? '#2fd07a' : '#1c2433').multiplyScalar(v === 'ring' ? 1.3 + 0.3 * Math.sin(f * 0.9) : 1);
      phone.rotation.z = v === 'ring' ? 0.05 * Math.sin(f * 1.7) : 0;
      tool.g.visible = v === 'allow'; tool.g.scale.setScalar(pop(f, a + 2, 8) * (1 + 0.06 * Math.max(0, 1 - Math.abs(f - click - 3) / 4)));
      toolM.map = maps[f >= click + 2 ? 1 : 0];
      // the cursor comes down to INSTALL and presses it; after that it moves by itself: somebody else has the desktop
      const k = smooth(f, a + 10, click - 1), away = smooth(f, click + 3, click + 12), d = Math.max(0, f - click - 12);
      cursor.visible = v === 'allow' && f >= a + 6;
      cursor.position.set(lerp(lerp(BX(520) + 0.02, BX(400), k), BX(520) + 0.12 + 0.04 * Math.sin(d * 0.35), away) + 0.05, lerp(lerp(BY(120), BY(380), k), BY(250) + 0.04 * Math.sin(d * 0.5), away) - 0.08, 0.37);
      cursor.scale.setScalar((f >= click && f < click + 3 ? 0.8 : 1) * pop(f, a + 6, 6));
    },
  };
};

// ------------------------------------------------------------------ drive: the cars in front of a rented house
const facadeTex = () => tex('drive-facade', 1024, 512, (g, w, h) => {
  g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#e3ded0'; g.fillRect(0, 0, w, 44);
  for (const x of [50, 240, 650, 840]) { g.fillStyle = '#5fd0e6'; g.fillRect(x, 96, 140, 250); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(x, 96, 140, 250); }
  g.fillStyle = '#5a3a22'; g.fillRect(450, 150, 130, 362); g.strokeRect(450, 150, 130, 362); g.fillStyle = '#e7c56a'; g.fillRect(558, 330, 8, 44);
});
export const drive: Builder = (root) => {
  backdrop(root, ['#3f9be0', '#a8dcf5', '#e8f6ff']);
  floor(root, 22, 20, tmat(tiled(tileTex('drive-floor', '#efe9da', '#cfc7b4', 2), 9, 9)));
  panel(root, 12, 6, tmat(facadeTex()), 0, 3, -3.6);
  palm(root, -3.3, -2.6, 4.4, 0.5, 1.1); palm(root, 3.5, -2.8, 4.0, -0.4, 1.1);
  const cars: [string, number, number, number][] = [['#ffd21f', 0.3, 1.4, -2.094], ['#8a2be2', 1.2, -0.35, -0.72], ['#a6e22e', -1.05, -0.9, -2.5], ['#f5f5f0', 0.4, -2.1, -1.27]];
  for (const [c, x, z, ry] of cars) { const g = supercar(root, c); g.position.set(x, 0, z); g.rotation.y = ry; }
  const selfie = actor(root, LAM(1), {a: {expr: 'grin', pose: 'wave', prop: 'selfie'}, b: {expr: 'laugh', pose: 'wave', prop: 'selfie'}}, 0, 0, 3.4, {scale: 1.0, res: 1.2, wide: true});
  const flex = actor(root, LAM(2), {a: {expr: 'laugh', pose: 'shrug'}, b: {expr: 'grin', pose: 'shrug'}}, 0, 0, 3.4, {scale: 1.0, res: 1.2, wide: true});
  const flash = halo(root, 0.7, '#ffffff', 0, 0.42, 1.62, 3.55);
  const notes = Array.from({length: 16}, () => bundle(root, 0.75, true)), q = rng(9), nx = notes.map(() => [(q() - 0.5) * 2.6, 2.4 + q() * 1.6, q()] as V);
  return {
    light: () => LIGHT.day,
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      selfie.node.visible = v === 'selfie'; selfie.show(f >= W(17) ? 'b' : 'a'); selfie.node.position.y = hop(f, W(17), 0.1, 9); selfie.tick(f, cam);
      op(flash, v === 'selfie' ? 0.9 * Math.max(0, 1 - Math.abs(f - W(17) - 1) / 3) : 0);
      flex.node.visible = v === 'flex'; flex.show(Math.floor(f / 10) % 2 ? 'b' : 'a'); flex.node.position.y = Math.abs(0.06 * Math.sin(f * 0.42)); flex.tick(f, cam);
      notes.forEach((n, i) => {
        const u = (f * 0.022 + nx[i][2]) % 1; n.visible = v === 'flex';
        n.position.set(nx[i][0] + 0.15 * Math.sin(f * 0.11 + i), 3.6 - u * 3.9, nx[i][1] + 0.4); n.rotation.set(f * 0.13 + i, f * 0.09 + i * 2, 0.6 * Math.sin(f * 0.1 + i));
      });
    },
  };
};

// ------------------------------------------------------------------ villa: a rented glass house on the bay (the pool, the arrest, the dock)
export const villa: Builder = (root) => {
  const day = backdrop(root, ['#3f9be0', '#a8dcf5', '#e8f6ff']), dusk = backdrop(root, ['#3a2a6e', '#b0508a', '#ff9a6a', '#ffd0a0']);
  floor(root, 60, 60, lit('#2a9fd0', 1), -0.36);                                                   // the bay
  const waves = soft(mesh(root, new THREE.PlaneGeometry(40, 30), smat(tiled(tex('villa-waves', 256, 128, (g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const x = (i * 97) % w, y = 10 + i * 17; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 18, y - 8, x + 36, y); g.stroke(); } }, true), 10, 12), 1, true), 0, -0.35, 14)); waves.rotation.x = -Math.PI / 2;
  box(root, 12, 0.5, 9.4, '#efe9da', 0, -0.25, -1.5);                                              // the terrace, 0 high, from z = -6.2 to 3.2
  soft(mesh(root, new THREE.PlaneGeometry(12, 9.4), tmat(tiled(tileTex('villa-stone', '#efe9da', '#d3cbb8', 2), 6, 5)), 0, 0.004, -1.5)).rotation.x = -Math.PI / 2;
  // the house: two floors of glass between white slabs
  const glassM = lamp('#7fd6e8', 1.0), frame = '#f6f3ea';
  box(root, 6.8, 0.22, 3.2, frame, -0.2, 2.25, -4.2); box(root, 7.2, 0.24, 3.6, frame, -0.2, 4.3, -4.2);
  for (const x of [-3.4, -1.8, -0.2, 1.4, 3.0]) box(root, 0.16, 4.2, 0.16, frame, x, 2.1, -2.7);
  soft(panel(root, 6.4, 2.05, glassM, -0.2, 1.1, -2.78)); soft(panel(root, 6.4, 1.85, glassM, -0.2, 3.26, -2.78));
  for (const x of [-2.6, -1.0, 0.6, 2.2]) for (const y of [1.1, 3.26]) box(root, 0.05, 1.9, 0.05, frame, x, y, -2.74);
  for (let i = 0; i < 9; i++) box(root, 0.03, 0.5, 0.03, '#3a3f4a', -3.3 + i * 0.775, 2.6, -2.62); box(root, 6.4, 0.04, 0.04, '#3a3f4a', -0.2, 2.86, -2.62);
  box(root, 12, 5.2, 0.3, '#f1ede2', 0, 2.6, -6.0);
  // the pool, sunk in the terrace: x -1.9 .. 1.1, z 0.1 .. 2.4
  box(root, 3.3, 0.06, 2.6, '#fbf8f0', -0.4, 0.03, 1.25); const water = soft(mesh(root, new THREE.PlaneGeometry(3.0, 2.3), lamp('#35c3e8', 1.05), -0.4, 0.07, 1.25)); water.rotation.x = -Math.PI / 2;
  const ripples = soft(mesh(root, new THREE.PlaneGeometry(3.0, 2.3), smat(tiled(tex('villa-ripple', 128, 128, (g) => { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; g.lineCap = 'round'; for (const [x, y] of [[14, 30], [70, 62], [30, 100]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 7, x + 28, y); g.stroke(); } }, true), 5, 4), 1, true), -0.4, 0.075, 1.25)); ripples.rotation.x = -Math.PI / 2;
  const floats = [torus(root, 0.27, 0.085, '#ff4fa3', -1.0, 0.13, 1.5), torus(root, 0.22, 0.07, '#ffd21f', 0.2, 0.13, 0.75)]; floats.forEach((t) => { t.rotation.x = Math.PI / 2; });
  // loungers, a parasol, palms
  for (const x of [1.9, 2.6]) { box(root, 0.5, 0.1, 1.2, '#fbf8f0', x, 0.22, 0.9); box(root, 0.5, 0.42, 0.1, '#fbf8f0', x, 0.42, 0.34).rotation.x = -0.5; }
  cyl(root, 0.03, 2.0, '#8a8f9a', 2.25, 1.0, 0.1); cone(root, 0.95, 0.4, '#ff4fa3', 2.25, 2.1, 0.1, 12);
  palm(root, -3.6, 0.3, 4.2, 0.5, 1.0); palm(root, 3.9, -1.2, 4.6, -0.4, 1.0); palm(root, -2.9, 2.7, 3.2, 0.35, 0.85);
  // the dock: from the terrace's edge out into the bay
  const dock = grp(root, 2.1, 0, 5.4); box(dock, 1.3, 0.1, 4.6, '#8a5a34', 0, 0.2, 0); for (let i = 0; i < 9; i++) box(dock, 1.3, 0.012, 0.03, '#5a3a22', 0, 0.256, -2.1 + i * 0.52);
  for (const z of [-1.9, -0.3, 1.3, 2.25]) for (const s of [-1, 1]) cyl(dock, 0.085, 1.5, '#5a3a22', s * 0.66, 0.1, z);
  // people
  const me = actor(root, LAM(1), {shock: {expr: 'shock', pose: 'panic'}, caught: {expr: 'nervous', pose: 'panic'}}, 0.9, 0, 3.0 - 0.3, {scale: 1.0, res: 1.2});
  const agents = [actor(root, AGENT(0), {a: {expr: 'stern', pose: 'point'}}, -0.4, 0, 2.8, {scale: 1.02, res: 1.2, wide: true}), actor(root, AGENT(1), {a: {expr: 'stern', pose: 'push'}}, 2.2, 0, 2.8, {scale: 1.0, res: 1.2, wide: true})];
  const runner = actor(root, LAM(1), {look: {expr: 'nervous', pose: 'wave', prop: 'selfie', look: -1}, thrown: {expr: 'nervous', pose: 'push', look: -1}, gone: {expr: 'whistle', pose: 'hang'}}, 2.1, 0.25, 6.0, {scale: 1.0, res: 1.2, wide: true});
  const phone = box(root, 0.11, 0.2, 0.025, '#15161b', 0, 0, 0); phone.castShadow = false;
  const HIT: V = [0.75, -0.34, 7.2];
  const splash = [0, 1, 2].map(() => { const o = soft(mesh(root, new THREE.RingGeometry(0.8, 1, 40), new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}), HIT[0], -0.33, HIT[2])); o.rotation.x = -Math.PI / 2; return o; });
  const drops = Array.from({length: 7}, () => { const o = ball(root, 0.05, lit('#ffffff', 1.1)); o.castShadow = false; return o; });
  return {
    light: (v) => v === 'dock' ? {...LIGHT.dusk, amb: 1.3} : v === 'raid' ? {...LIGHT.dusk, amb: 1.45, keyI: 1.1} : LIGHT.day,
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at, late = v === 'dock' || v === 'raid';
      day.visible = !late; dusk.visible = late; glassM.color.set(late ? '#ffd98a' : '#7fd6e8').multiplyScalar(late ? 1.25 : 1.0);
      (water.material as THREE.MeshBasicMaterial).color.set(late ? '#2a8fc0' : '#35c3e8');
      ripples.position.x = -0.4 + 0.05 * Math.sin(f * 0.07); waves.position.x = 0.4 * Math.sin(f * 0.03);
      floats.forEach((t, i) => { t.position.y = 0.13 + 0.012 * Math.sin(f * 0.13 + i * 2); t.rotation.z = f * 0.01 * (i ? -1 : 1); });
      // the arrest: he is alone for a moment, then they are on both sides of him
      me.node.visible = v === 'raid'; me.show(f < a + 14 ? 'shock' : 'caught'); me.node.position.y = hop(f, a + 2, 0.1, 8); me.tick(f, cam);
      agents.forEach((g, i) => { const k = smooth(f, a + 6 + i * 3, a + 20 + i * 3); g.node.visible = v === 'raid'; g.node.position.x = lerp(i ? 4.6 : -2.8, i ? 2.05 : -0.25, k); g.node.position.y = Math.abs(0.05 * Math.sin(f * 0.5 + i)) * (1 - k); g.tick(f, cam); });
      // the dock: he looks round, and on "dropped" the phone leaves his hand
      const go = W(165) - 2, u = (f - go) / 13, flying = v === 'dock' && u >= 0 && u < 1;
      runner.node.visible = v === 'dock'; runner.show(f < go ? 'look' : f < go + 16 ? 'thrown' : 'gone'); runner.node.position.y = 0.25 + hop(f, go - 1, 0.12, 8); runner.tick(f, cam);
      const from: V = [1.55, 1.75, 6.2];
      phone.visible = flying; if (flying) { phone.position.set(lerp(from[0], HIT[0], u), lerp(from[1], HIT[1], u) + 1.5 * 4 * u * (1 - u) * 0.5, lerp(from[2], HIT[2], u)); phone.rotation.set(f * 0.9, 0.4, f * 0.6); }
      splash.forEach((o, i) => { const w = (f - go - 13 - i * 4) / 16; o.visible = v === 'dock' && w > 0 && w < 1; o.scale.setScalar(0.15 + 0.75 * w); op(o, 0.9 * (1 - w)); });
      drops.forEach((o, i) => { const w = (f - go - 13) / 12, ang = i * 0.9; o.visible = v === 'dock' && w > 0 && w < 1; o.position.set(HIT[0] + 0.45 * w * Math.cos(ang), -0.3 + 1.1 * 4 * w * (1 - w) * (0.5 + 0.08 * i), HIT[2] + 0.3 * w * Math.sin(ang)); });
    },
  };
};

// ------------------------------------------------------------------ deep: where the phone went
const fishTex = (c: string) => tex('fish-' + c, 220, 120, (g) => {
  g.fillStyle = c; g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(14, 20); g.lineTo(60, 60); g.lineTo(14, 100); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(124, 60, 78, 40, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(166, 50, 12, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(169, 50, 6, 0, 7); g.fill();
});
const sunkTex = () => tex('deep-phone', 240, 440, (g, w, h) => {
  g.fillStyle = '#0d1118'; g.fillRect(0, 0, w, h); text(g, 'NO SERVICE', w / 2, 70, 34, '#ffffff', {font: 'Montserrat'});
  lock(g, w / 2, 210, 96, false, '#ffffff', '#0d1118');
  g.strokeStyle = '#ff3b30'; g.lineWidth = 8; rrect(g, 76, 342, 76, 40, 8); g.stroke(); g.fillStyle = '#ff3b30'; g.fillRect(156, 352, 8, 20); g.fillRect(84, 350, 14, 24);
});
export const deep: Builder = (root) => {
  backdrop(root, ['#7fe0e8', '#2a9fc8', '#0f5a8a', '#0a3a66']);
  floor(root, 30, 20, tmat(tiled(grainTex('deep-sand', '#6fb0a8', 0.1), 6, 4)), 0, 0, -2);
  for (const [x, rr, z] of [[-2.2, 0.5, -1.6], [2.0, 0.6, -1.2], [1.2, 0.3, 0.6], [-1.3, 0.28, 0.9]]) { const o = ball(root, rr, '#4a7f8a', x, rr * 0.3, z); o.scale.y = 0.6; }
  for (const [x, z, h] of [[-1.7, -0.6, 1.3], [-1.45, -0.4, 0.9], [1.6, -0.3, 1.1], [1.85, -0.5, 1.5], [0.6, -1.4, 0.9]]) cone(root, 0.12, h, '#7fd0c0', x, h / 2, z, 5);
  for (const [x, o] of [[-0.8, 0.07], [0.6, 0.05], [1.9, 0.04]] as const) beam(root, 0.4, 1.3, 9, '#e8ffff', o, x, 8, -1.2 - x * 0.2);
  const fish = [card(root, 0.62, 0.34, fishTex('#ff8fa8'), 0, 0, -0.6, 1.05), card(root, 0.4, 0.22, fishTex('#7fe8e0'), 0, 0, -1.2, 1.0), card(root, 1.0, 0.55, fishTex('#ffb52e'), 0, 0, 1.0, 1.05)];
  const ph = grp(root); box(ph, 0.62, 1.16, 0.07, '#15161b'); soft(panel(ph, 0.55, 1.05, smat(sunkTex(), 1.1), 0, 0, 0.04));
  const bub = Array.from({length: 7}, () => soft(mesh(root, new THREE.RingGeometry(0.05, 0.068, 20), new THREE.MeshBasicMaterial({color: '#e8ffff', transparent: true, opacity: 0.9, depthWrite: false}))));
  return {
    light: () => ({...LIGHT.cold, sky: '#bff4ff', ground: '#2a7f9a', amb: 1.5}),
    tick: ({f, t}) => {
      const k = smooth(t, -2, 26);
      ph.position.set(0.15 + 0.05 * Math.sin(f * 0.07), lerp(4.4, 1.5, k) - 0.004 * Math.max(0, t - 26), 0); ph.rotation.set(0.1 * Math.sin(f * 0.06), 0.35 * Math.sin(f * 0.045) + 0.25, lerp(0.5, -0.12, k));
      fish[0].position.set(lerp(1.9, -1.9, ((f * 0.006 + 0.35) % 1)), 2.35 + 0.05 * Math.sin(f * 0.1), -0.6); fish[0].scale.x = -1;
      fish[1].position.set(lerp(-1.9, 1.9, ((f * 0.005 + 0.6) % 1)), 1.9, -1.2);
      fish[2].position.set(lerp(-2.3, 2.3, ((f * 0.004 + 0.72) % 1)), 0.62 + 0.03 * Math.sin(f * 0.08), 1.0);
      bub.forEach((b, i) => { const u = (f * 0.012 + i * 0.143) % 1; b.position.set(ph.position.x + 0.3 * Math.sin(i * 2.4) + 0.05 * Math.sin(f * 0.1 + i), ph.position.y + 0.5 + u * 2.6, 0.1); b.scale.setScalar(0.7 + 1.3 * u); op(b, 0.9 * (1 - u)); b.visible = t > 6; });
    },
  };
};

// ------------------------------------------------------------------ club: up to half a million dollars a night
const billTex = () => tex('club-bill', 420, 950, (g, w, h) => {
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h); text(g, 'ONE NIGHT', w / 2, 70, 74, '#1a1c24'); g.fillStyle = '#1a1c24'; g.fillRect(40, 124, w - 80, 6);
  g.fillStyle = '#c3c7d1'; for (let i = 0; i < 7; i++) { g.fillRect(44, 160 + i * 40, 150 + ((i * 53) % 110), 16); g.fillRect(w - 44 - 90, 160 + i * 40, 90, 16); }
  g.fillStyle = '#1a1c24'; g.fillRect(40, 452, w - 80, 6); text(g, 'TOTAL', w / 2, 508, 62, '#1a1c24');
  g.fillStyle = '#ffe14a'; g.fillRect(26, 552, w - 52, 96); text(g, '$569,528.39', w / 2, 602, 78, '#1a1c24', {maxWidth: w - 70}); g.fillStyle = '#1a1c24'; g.fillRect(40, 682, w - 80, 6);
  for (let x = 60; x < w - 60;) { const bw = 3 + ((x * 7) % 9); g.fillRect(x, 722, bw, 86); x += bw + 4 + ((x * 3) % 5); }
  g.fillStyle = '#c3c7d1'; for (let i = 0; i < 3; i++) g.fillRect(96, 846 + i * 32, w - 192, 14);
});
const crowdTex = () => tex('club-crowd', 512, 256, (g, w, h) => {
  g.fillStyle = '#2a3460'; for (let i = 0; i < 9; i++) { const x = 30 + i * 56, y = 120 + ((i * 37) % 50); g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); g.fillRect(x - 34, y + 20, 68, h); if (i % 3 === 0) g.fillRect(x + 18, y - 70, 14, 90); }
});
const sparkTex = () => tex('club-spark', 128, 128, (g) => { g.strokeStyle = '#ffffff'; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = i % 2 ? 36 : 60; g.lineWidth = i % 2 ? 3 : 5; g.beginPath(); g.moveTo(64 + 8 * Math.cos(a), 64 + 8 * Math.sin(a)); g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); g.stroke(); } });
export const club: Builder = (root) => {
  backdrop(root, ['#12041c', '#2a0a3a']);
  floor(root, 16, 14, '#1a0a2a'); panel(root, 14, 7, mat('#2a0a3a'), 0, 3.5, -2.9);
  const neon = torus(root, 0.78, 0.035, lamp('#ff4fd8', 1.8), 0.25, 2.8, -2.82); neon.castShadow = false;
  for (const [x, c] of [[-2.0, '#4fd8ff'], [-0.95, '#ff4fd8'], [1.25, '#ff4fd8'], [2.15, '#4fd8ff']] as const) box(root, 0.045, 4.6, 0.045, lit(c, 1.6), x, 2.3, -2.84).castShadow = false;
  // the booth and its table
  box(root, 5.4, 0.44, 1.0, '#5a0a3a', 0, 0.22, -1.4); box(root, 5.4, 1.1, 0.26, '#6a1046', 0, 0.75, -1.9);
  box(root, 2.5, 0.5, 0.95, '#120818', -0.1, 0.25, 0.35); box(root, 2.5, 0.03, 0.03, lit('#ff4fd8', 1.6), -0.1, 0.5, 0.83).castShadow = false;
  cyl(root, 0.2, 0.3, '#8a4fd0', -0.1, 0.66, 0.3, 0.27); for (const [dx, tz] of [[-0.1, -0.3], [0.02, 0.05], [0.13, 0.3]]) { const b = cyl(root, 0.045, 0.5, '#1f4a30', -0.1 + dx, 0.95, 0.3, 0.03); b.rotation.z = -tz; cyl(root, 0.032, 0.07, '#e8762c', -0.1 + dx - tz * 0.24, 1.2, 0.3).rotation.z = -tz; }
  for (const x of [-0.75, 0.5]) { cyl(root, 0.035, 0.02, '#c9ced6', x, 0.51, 0.35); cyl(root, 0.012, 0.12, '#c9ced6', x, 0.57, 0.35); cyl(root, 0.05, 0.1, lit('#ffe9a0', 1.2), x, 0.68, 0.35, 0.03); }
  // the till: a stand, a printer, a long strip of paper
  const till = [box(root, 0.5, 0.95, 0.4, '#23252e', 1.1, 0.48, 1.4), box(root, 0.36, 0.14, 0.3, '#3a3f4a', 1.1, 1.02, 1.4)];
  const bill = soft(panel(root, 0.42, 0.95, smat(billTex(), 1.02), 1.1, 1.57, 1.44)); bill.rotation.x = -0.06;
  // the room: a crowd, beams, moving light
  const crowd = [card(root, 3.0, 1.5, crowdTex(), -2.6, 1.0, -2.5, 1), card(root, 3.0, 1.5, crowdTex(), 2.7, 1.0, -2.6, 1)];
  const beams = ['#ff4fd8', '#4fd8ff', '#b6f03a', '#ffb52e'].map((c, i) => beam(root, 0.03, 0.55, 7, c, 0.15, -2.1 + i * 1.4, 6.2, -2.7));
  const spots = ['#ff4fd8', '#4fd8ff', '#ffb52e'].map((c) => pool(root, 1.1, c, 0.3, 0, 0));
  const me = actor(root, LAM(2), {cash: {expr: 'laugh', pose: 'hold', prop: 'cash'}, grin: {expr: 'grin', pose: 'hold', prop: 'cash'}}, 0.2, 0.44, -1.3, {scale: 1.18, res: 1.2, wide: true, shadow: 0});
  const staff = [actor(root, STAFF(0), {a: {expr: 'smile', pose: 'hold', prop: 'bottle'}}, -1.5, 0, 0.5, {scale: 0.98, res: 1.1, wide: true}), actor(root, STAFF(1), {a: {expr: 'smile', pose: 'hold', prop: 'bottle'}}, -0.95, 0, 1.1, {scale: 0.98, res: 1.1, wide: true})];
  const sparks = staff.map(() => ({star: soft(panel(root, 0.5, 0.5, new THREE.MeshBasicMaterial({map: sparkTex(), transparent: true, depthWrite: false, color: new THREE.Color('#fff3c0').multiplyScalar(2.2)}), 0, 0, 0)), glow: halo(root, 0.7, '#ffd98a', 0.5, 0, 0, 0)}));
  return {
    light: () => ({...LIGHT.dark, sky: '#c8a0ff', ground: '#4a2a7a', amb: 1.15, key: '#ff9ad8', keyI: 0.8}),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      me.show(Math.floor(f / 10) % 2 ? 'cash' : 'grin'); me.node.position.y = 0.44 + Math.abs(0.05 * Math.sin(f * 0.42)); me.tick(f, cam);
      staff.forEach((s, i) => {
        const k = v === 'bill' ? smooth(f, shot.at - 6 + i * 4, shot.at + 14 + i * 4) : 1, x = lerp(-2.8 - i * 0.5, i ? -0.85 : -1.3, k);
        s.node.position.set(x, Math.abs(0.045 * Math.sin(f * 0.5 + i)), i ? 0.0 : -0.7); s.tick(f, cam); s.node.visible = v !== 'receipt';
        const sp = sparks[i], fl = 0.75 + 0.25 * Math.sin(f * 2.3 + i * 1.7);
        sp.star.position.set(x + 0.36, s.node.position.y + 2.02, s.node.position.z + 0.05); sp.star.scale.setScalar(0.7 + 0.5 * fl); sp.glow.position.copy(sp.star.position); op(sp.glow, 0.5 * fl);
        sp.star.visible = sp.glow.visible = v !== 'receipt'; sp.star.lookAt(cam.position); sp.star.rotateZ(f * 0.7 + i);
      });
      crowd.forEach((c, i) => { c.position.y = 1.0 + 0.06 * Math.abs(Math.sin(f * 0.42 + i * 1.3)); });
      beams.forEach((b, i) => { b.rotation.z = 0.5 * Math.sin(f * 0.07 + i * 1.7); b.rotation.x = -0.06 + 0.05 * Math.sin(f * 0.05 + i); });
      spots.forEach((s, i) => { s.position.set(1.8 * Math.sin(f * 0.06 + i * 2.1), 0.012, 0.4 + 1.0 * Math.cos(f * 0.05 + i * 1.3)); });
      (neon.material as THREE.MeshBasicMaterial).color.set('#ff4fd8').multiplyScalar(1.7 + 0.5 * Math.sin(f * 0.42));
      // the receipt feeds up out of the printer, top first: the panel shows the top `k` of the paper, its foot at the slot
      const k = v === 'receipt' ? lerp(0.4, 1, smooth(f, shot.at - 1, shot.at + 15)) : 1, paper = (bill.material as THREE.MeshBasicMaterial).map!;
      bill.scale.y = k; bill.position.y = 1.09 + 0.475 * k; paper.repeat.y = k; paper.offset.y = 1 - k;
      bill.visible = v !== 'party'; till.forEach((m) => { m.visible = v !== 'party'; });   // in the hook the till would stand at the right edge of the first frames
    },
  };
};
