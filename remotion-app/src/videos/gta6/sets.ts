// Sets of the GTA 6 leaker short, part 1: shared props, the leaker's room, the spotlight, the game shop, the
// mountain of copies. Each builder fills a group once and returns a tick that poses it for a frame (motion is a
// pure function of the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, clamp01, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat,
  torus, woodTex, type G2, type Node, type V} from './kit';
import {actor, FAN, LEEK, REPORTER} from './cast';
import {monitor, officeChair, signTex} from './props';
import {TOTAL, W, type Shot} from './story';

export type Ctx = {f: number; /** frames since the shot began */ t: number; cam: THREE.PerspectiveCamera; shot: Shot};
export type Light = {sky: string; ground: string; amb: number; key: string; keyI: number; from: V; span: number};
export type SetDef = {tick: (c: Ctx) => void; light: (v: string) => Light};
export type Builder = (root: THREE.Group) => SetDef;

export const LIGHT: Record<'day' | 'room' | 'cold' | 'dark' | 'warm' | 'show' | 'dusk', Light> = {
  day: {sky: '#fff4da', ground: '#99aac1', amb: 1.7, key: '#fff0d4', keyI: 2.0, from: [-8, 16, 12], span: 16},
  room: {sky: '#fff1dc', ground: '#8f8aa0', amb: 1.55, key: '#fff3e0', keyI: 1.1, from: [-5, 10, 9], span: 9},
  cold: {sky: '#e6efff', ground: '#8fa3c4', amb: 1.6, key: '#eaf2ff', keyI: 1.0, from: [-3, 10, 8], span: 10},
  dark: {sky: '#9fb0ff', ground: '#3a3f66', amb: 0.8, key: '#cfd8ff', keyI: 0.6, from: [-4, 10, 8], span: 9},
  warm: {sky: '#ffd9a8', ground: '#6a4a4a', amb: 1.05, key: '#ffc98a', keyI: 0.95, from: [-4, 9, 8], span: 8},
  show: {sky: '#bcd0ff', ground: '#3a4466', amb: 1.0, key: '#ffffff', keyI: 1.35, from: [1, 12, 10], span: 9},
  dusk: {sky: '#ffd0a0', ground: '#5a568a', amb: 1.15, key: '#ffb070', keyI: 1.3, from: [-7, 8, 9], span: 14},
};

// ------------------------------------------------------------------ things several sets share
/** a leek drawn flat (the coin's face, the poster): white stalk, three green leaves */
export function leekIcon(g: G2, x: number, y: number, s: number, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.lineJoin = 'round'; g.lineWidth = s * 0.07; g.strokeStyle = '#17171d';
  const leaf = (dx: number, tx: number, ty: number, c: string) => {
    g.beginPath(); g.moveTo(dx - s * 0.11, -s * 0.15); g.quadraticCurveTo(tx - s * 0.14, ty * 0.6, tx, ty); g.quadraticCurveTo(tx + s * 0.1, ty * 0.5, dx + s * 0.11, -s * 0.15); g.closePath(); g.fillStyle = c; g.fill(); g.stroke();
  };
  leaf(-s * 0.06, -s * 0.44, -s * 0.95, '#5f9e45'); leaf(s * 0.06, s * 0.44, -s * 0.9, '#6fae4f'); leaf(0, 0, -s * 1.12, '#8fce6a');
  g.beginPath(); g.moveTo(-s * 0.15, -s * 0.2); g.lineTo(s * 0.15, -s * 0.2); g.lineTo(s * 0.19, s * 0.75); g.quadraticCurveTo(0, s * 0.9, -s * 0.19, s * 0.75); g.closePath(); g.fillStyle = '#f6f8ec'; g.fill(); g.stroke();
  g.lineWidth = s * 0.04; for (const d of [-1, 0, 1]) { g.beginPath(); g.moveTo(d * s * 0.1, s * 0.82); g.lineTo(d * s * 0.2, s * 1.03); g.stroke(); }
  g.restore();
}
/** a game disc drawn flat */
export function discIcon(g: G2, x: number, y: number, r: number) {
  const cg = g.createConicGradient(0.6, x, y);
  ['#dfe6ee', '#a9dcff', '#f4f6fa', '#ffc9ec', '#dfe6ee', '#fff2a8', '#f4f6fa', '#a9dcff', '#dfe6ee'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), c));
  g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = r * 0.07; g.strokeStyle = '#17171d'; g.stroke();
  g.fillStyle = '#f7f9fb'; g.beginPath(); g.arc(x, y, r * 0.32, 0, 7); g.fill(); g.lineWidth = r * 0.04; g.stroke();
  g.fillStyle = '#17171d'; g.beginPath(); g.arc(x, y, r * 0.11, 0, 7); g.fill();
}
/** a clip nobody should describe: a mosaic with a play button */
export function mosaic(g: G2, x: number, y: number, w: number, h: number, seed: number, cell = 20) {
  const r = rng(seed), cols = ['#ff7ac8', '#ffb35a', '#7a4fd0', '#35c8d0', '#ffd98a', '#3a2f6a', '#f06a8a'];
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let j = 0; j * cell < h; j++) for (let i = 0; i * cell < w; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + i * cell, y + j * cell, cell + 0.5, cell + 0.5); }
  g.restore();
  g.fillStyle = 'rgba(10,12,20,.6)'; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.28, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + w / 2 - h * 0.1, y + h / 2 - h * 0.15); g.lineTo(x + w / 2 + h * 0.17, y + h / 2); g.lineTo(x + w / 2 - h * 0.1, y + h / 2 + h * 0.15); g.closePath(); g.fill();
}
/** a leek, the vegetable: about 1.6 units tall at s = 1 */
export function leek3d(p: Node, x = 0, y = 0, z = 0, s = 1) {
  const g = grp(p, x, y, z); g.scale.setScalar(s);
  cyl(g, 0.1, 0.62, '#f4f6ea', 0, 0.33, 0, 0.085); ball(g, 0.105, '#f4f6ea', 0, 0.04, 0).scale.y = 0.6; cyl(g, 0.085, 0.3, '#cfe6a8', 0, 0.78, 0, 0.095);
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.34, l = box(g, 0.14, 0.8, 0.035, i % 2 ? '#5f9e45' : '#7fc05c', Math.sin(a) * 0.38, 0.9 + Math.cos(a) * 0.38, (i % 2) * 0.04 - 0.02); l.rotation.z = -a; }
  return g;
}
const coinTex = () => tex('coin-face', 256, 256, (g) => {
  g.fillStyle = '#f2c230'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.strokeStyle = '#b8860b'; g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 102, 0, 7); g.stroke();
  g.fillStyle = '#b8860b'; for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18; g.fillRect(128 + 115 * Math.cos(a) - 3, 128 + 115 * Math.sin(a) - 3, 6, 6); }
  leekIcon(g, 128, 142, 76);
});
/** the leaker's coin: gold, a leek on both faces. It carries no name: the film does not advertise it. */
export function coin3d(p: Node, r: number, x = 0, y = 0, z = 0) {
  const g = grp(p, x, y, z), m = smat(coinTex(), 1.05);
  cyl(g, r, r * 0.14, lit('#d9a514', 1), 0, 0, 0, r, 40).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const f = mesh(g, new THREE.CircleGeometry(r * 0.985, 40), m, 0, 0, s * r * 0.072); if (s < 0) f.rotation.y = Math.PI; f.castShadow = false; }
  return g;
}
export function disc3d(p: Node, r: number, x = 0, y = 0, z = 0) {
  const g = grp(p, x, y, z), m = smat(tex('disc-face', 256, 256, (c) => discIcon(c, 128, 128, 124)), 1.05, true);
  for (const s of [-1, 1]) { const f = mesh(g, new THREE.CircleGeometry(r, 40), m, 0, 0, s * 0.012); if (s < 0) f.rotation.y = Math.PI; f.castShadow = false; }
  return g;
}
export const coverTex = (key: string, c1: string, c2: string, label: string) => tex('cover-' + key, 180, 252, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, w, 28); text(g, 'GAME', w / 2, 15, 16, '#ffffff', {font: 'Montserrat', spacing: 4});
  text(g, label, w / 2, h * 0.55, 120, '#ffffff', {stroke: '#17171d', sw: 10, maxWidth: w * 0.82});
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
});
const screenTex = (key: string, draw: (g: G2, w: number, h: number) => void) => tex('scr-' + key, 320, 196, (g, w, h) => { g.fillStyle = '#071018'; g.fillRect(0, 0, w, h); draw(g, w, h); });

// ------------------------------------------------------------------ the leaker's room
export const lair: Builder = (root) => {
  backdrop(root, ['#04060a', '#0d1512']);
  floor(root, 14, 12, tmat(tiled(grainTex('lair', '#23262b', 0.14), 5, 4)));
  // back wall with a doorway on the right; a lit corridor behind it
  box(root, 6.6, 5.2, 0.3, '#182024', -1.45, 2.6, -2.75); box(root, 2.2, 5.2, 0.3, '#182024', 4.25, 2.6, -2.75); box(root, 1.3, 2.7, 0.3, '#182024', 2.5, 3.85, -2.75);
  panel(root, 2.8, 3.6, lit('#ffdf9a', 1.25), 2.5, 1.7, -4.0); floor(root, 2.8, 1.6, '#6a5a44', 0.002, 2.5, -3.5);
  const door = grp(root, 3.15, 0, -2.62); box(door, 1.28, 2.46, 0.07, '#3b4a44', -0.64, 1.23, 0); ball(door, 0.05, '#c9a94f', -1.12, 1.15, 0.06);
  const suitcase = box(root, 0.46, 0.34, 0.16, '#8a5a3a', 2.98, 0.19, -3.0);
  const T = {
    clip: screenTex('clip', (g, w, h) => { mosaic(g, 14, 12, w - 28, h - 54, 3); g.fillStyle = '#2a3340'; g.fillRect(14, h - 32, w - 28, 10); g.fillStyle = '#3fe07a'; g.fillRect(14, h - 32, (w - 28) * 0.7, 10); text(g, 'UPLOADING', w / 2, h - 12, 15, '#9fffc0', {font: 'Montserrat', spacing: 3}); }),
    code: screenTex('code', (g) => { const r = rng(9); for (let i = 0; i < 13; i++) { g.fillStyle = i % 4 === 0 ? '#9fffc0' : '#3fae6a'; g.fillRect(14 + (i % 3) * 12, 14 + i * 13, 60 + r() * 200, 6); } }),
    offer: screenTex('offer', (g, w) => { text(g, 'THE OFFER', w / 2, 44, 46, '#ffffff', {spacing: 3}); text(g, '$30,000,000', w / 2, 112, 58, '#ffd43b'); text(g, 'COIN MARKET CAP', w / 2, 164, 20, '#9fb0c8', {font: 'Montserrat', spacing: 2}); }),
    build: screenTex('build', (g, w) => { g.fillStyle = '#ffd43b'; g.fillRect(w / 2 - 62, 30, 52, 16); g.fillRect(w / 2 - 62, 42, 124, 76); text(g, '200 GB', w / 2, 82, 40, '#17171d'); text(g, '“FULL BUILD” · CLAIMED', w / 2, 156, 20, '#ffffff', {font: 'Montserrat', maxWidth: w - 30}); }),
    off: tex('scr-off', 32, 20, (g) => { g.fillStyle = '#05070a'; g.fillRect(0, 0, 32, 20); g.fillStyle = '#1d3a2a'; g.fillRect(27, 16, 2, 2); }),
  };
  const scr = [0, 1, 2].map(() => new THREE.MeshBasicMaterial({map: T.code}));
  box(root, 3.5, 0.08, 0.95, '#3a2f28', -0.2, 0.86, -1.95); for (const x of [-1.8, 1.4]) box(root, 0.1, 0.82, 0.8, '#2a221d', x, 0.41, -1.95);
  [-1.3, -0.2, 0.9].forEach((x, i) => monitor(root, x, 0.9, -2.12 + Math.abs(i - 1) * 0.14, 0.98, 0.6, scr[i], (1 - i) * 0.32));
  box(root, 3.4, 0.03, 0.03, lit('#3fe07a', 2), -0.2, 0.81, -1.49); box(root, 0.6, 0.03, 0.18, '#20242c', -0.2, 0.915, -1.7);
  for (const x of [0.45, 0.58]) cyl(root, 0.04, 0.13, x > 0.5 ? '#c9d2d8' : '#3fae6a', x, 0.965, -1.62);
  box(root, 0.32, 0.62, 0.6, '#111418', 1.72, 0.31, -1.9); box(root, 0.02, 0.5, 0.02, lit('#3fe07a', 2.2), 1.58, 0.31, -1.59);
  panel(root, 0.95, 1.25, smat(tex('poster-leek', 190, 250, (g, w, h) => { g.fillStyle = '#12281a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8fce6a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); leekIcon(g, w / 2, h * 0.58, 78, 0.25); }), 0.9), 1.0, 2.35, -2.59);
  const calTex = (m: string) => tex('cal-' + m, 160, 190, (g, w) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, 190); g.fillStyle = '#e3342f'; g.fillRect(0, 0, w, 50); text(g, m, w / 2, 27, 34, '#ffffff', {spacing: 2, maxWidth: w - 14}); text(g, '2026', w / 2, 74, 20, '#8a8698', {font: 'Montserrat'}); g.fillStyle = '#d9d5c8'; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) g.fillRect(14 + i * 23, 94 + j * 22, 17, 15); });
  const cal = ['AUGUST', 'OCTOBER'].map((m) => panel(root, 0.7, 0.83, smat(calTex(m), 0.95), -1.3, 2.3, -2.59));
  const crate = grp(root, -1.4, 0, -0.95); box(crate, 0.8, 0.45, 0.55, tmat(woodTex('crate', '#b08a55', '#6b4a2d')), 0, 0.225, 0);
  for (let i = 0; i < 4; i++) leek3d(crate, -0.27 + i * 0.18, 0.3, (i % 2) * 0.1 - 0.05, 0.5).rotation.z = (i - 1.5) * 0.13;
  const chair = officeChair(root, -0.25, -0.85, '#20242c');
  const lantern = grp(root, -1.05, 0.9, -1.58); ball(lantern, 0.17, '#f08a24', 0, 0.15, 0).scale.set(1.1, 0.9, 1); cyl(lantern, 0.025, 0.08, '#5a7a3a', 0, 0.33, 0);
  soft(panel(lantern, 0.24, 0.2, smat(tex('jack', 96, 80, (g) => {
    g.fillStyle = '#ffe14a'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(48 + s * 24, 18); g.lineTo(48 + s * 12, 38); g.lineTo(48 + s * 36, 38); g.fill(); }
    g.beginPath(); g.moveTo(18, 52); g.lineTo(78, 52); g.lineTo(66, 70); g.lineTo(54, 60); g.lineTo(42, 70); g.lineTo(30, 60); g.closePath(); g.fill();
  }), 2.2, true), 0, 0.15, 0.18));
  const tiles = [0, 1, 2, 3].map((i) => { const t = panel(root, 0.62, 0.4, smat(tex('tile-' + i, 160, 104, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); mosaic(g, 5, 5, w - 10, h - 10, 11 + i, 15); }), 1.1), 0, 0, 0); t.visible = false; return t; });
  // the release button under its glass lid
  const con = grp(root, 0.5, 0, 0.75); con.scale.setScalar(1.4);
  box(con, 0.5, 1.0, 0.5, '#2a2f38', 0, 0.5, 0); box(con, 0.54, 0.05, 0.54, '#ffd43b', 0, 1.025, 0);
  panel(con, 0.42, 0.2, smat(signTex('release', 210, 100, '#17171d', '#ffd43b', [['RELEASE', 62]], {border: '#ffd43b'}), 1.1), 0, 0.82, 0.252);
  const btnMat = lamp('#ff3b30', 1.6); cyl(con, 0.13, 0.09, btnMat, 0, 1.095, 0);
  const lid = grp(con, 0, 1.05, -0.19); soft(box(lid, 0.38, 0.26, 0.38, new THREE.MeshBasicMaterial({color: '#bfe8ff', transparent: true, opacity: 0.28, depthWrite: false}), 0, 0.13, 0.19));
  const leek = actor(root, LEEK, {idle: {}, point: {pose: 'point'}, type: {pose: 'desk'}, hips: {pose: 'hips'}, shrug: {pose: 'shrug'}, think: {pose: 'think'}}, -0.25, 0, -0.1, {scale: 1.15, res: 1.2});
  return {
    light: (v) => v === 'october' || v === 'button' ? {...LIGHT.dark, sky: '#ffb9a0', ground: '#4a2a30', amb: 1.25, keyI: 0.8}
      : v === 'peek' || v === 'door' ? {...LIGHT.dark, sky: '#9fb0ff', ground: '#20243a', amb: 0.7, keyI: 0.4} : {...LIGHT.dark, sky: '#b0ffd0', ground: '#2c4a3c', amb: 1.3, keyI: 0.8},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, oct = v === 'october' || v === 'button', offAt = W(172);
      const late = oct || v === 'off' || v === 'door' || v === 'peek';
      cal[0].visible = !late; cal[1].visible = late; lantern.visible = oct; suitcase.visible = v === 'door';
      con.visible = v !== 'post' && v !== 'october'; chair.visible = v !== 'october';                     // at the desk they would stand between the lens and the screens
      scr.forEach((m, i) => {
        let map = T.off;
        if (v === 'hook') map = i === 1 ? T.build : T.clip; else if (v === 'post') map = i === 1 ? T.clip : T.code; else if (v === 'october') map = i === 1 ? T.offer : i === 0 ? T.build : T.code; else if (v === 'button') map = T.code;   // behind the button only fragments of words would show
        else if (v === 'off') map = f >= offAt + i * 5 ? T.off : i === 1 ? T.offer : T.build;
        m.map = map; m.color.setScalar(map === T.off ? 0.6 : 1.12 + 0.1 * Math.sin(f * 0.7 + i * 2));
      });
      tiles.forEach((tile, i) => {                                                                    // clips leave the middle screen as they are posted
        const at = W(42) + i * 5, k = v === 'post' ? smooth(f, at, at + 9) : 0; tile.visible = k > 0;
        tile.position.set(lerp(-0.2, -1.05 + i * 0.7, k), lerp(1.4, 2.3 + (i % 2) * 0.3, k) + 0.04 * Math.sin(f * 0.2 + i), lerp(-2.0, -1.2 + i * 0.1, k)); tile.scale.setScalar(0.3 + 0.7 * k); tile.rotation.z = (i - 1.5) * 0.08;
      });
      const open = v === 'hook' ? smooth(f, W(2) - 2, W(2) + 6) : v === 'button' ? smooth(t, 1, 9) : v === 'off' ? 1 - smooth(f, offAt - 2, offAt + 8) : 0;
      lid.rotation.x = -1.9 * open; btnMat.color.set('#ff3b30').multiplyScalar(open > 0.5 ? (f % 10 < 5 ? 2.6 : 1.2) : 0.9);
      let pose = 'idle', x = -0.25, z = -0.1, y = 0;
      if (v === 'hook') { pose = f >= W(2) - 2 ? 'point' : 'hips'; x = -0.5; y = hop(f, W(2) - 2, 0.12, 9); }
      else if (v === 'post') { pose = 'type'; y = 0.02 * Math.abs(Math.sin(f * 0.9)); }
      else if (v === 'october') { pose = f >= W(111) ? 'hips' : 'think'; x = 0.6; z = -0.6; y = hop(f, W(111), 0.14, 9); }
      else if (v === 'button') { pose = 'point'; x = -0.2; z = 0.35; y = hop(f, W(121), 0.1, 8); }
      else if (v === 'off') { pose = f >= offAt ? 'shrug' : 'think'; x = -0.5; y = hop(f, offAt, 0.1, 9); }
      else if (v === 'door') { x = 2.5; z = -3.15; pose = f >= W(177) ? 'shrug' : 'idle'; y = hop(f, W(177), 0.08, 8); }
      else if (v === 'peek') { x = lerp(3.9, 3.22, smooth(t, 1, 10)); z = -3.15; }
      leek.show(pose); leek.node.position.set(x, y, z); leek.tick(f, cam); if (v === 'peek') leek.mesh.rotation.z = 0.22;
      door.rotation.y = v === 'door' ? 1.5 * smooth(t, 0, 7) : v === 'peek' ? 1.5 : 0;
    },
  };
};

// ------------------------------------------------------------------ spotlight: one figure, one idea at a time
export const spot: Builder = (root) => {
  backdrop(root, ['#070913', '#1a2040']);
  floor(root, 30, 30, '#141829'); cyl(root, 3.0, 0.1, '#262c44', 0, 0.05, 0, 3.0, 48); pool(root, 2.3, '#fff3d0', 0.55, 0, 0, 0.11);
  const ray = beam(root, 0.2, 1.25, 7.5, '#fff3d0', 0.035, 0, 7.6, 0);
  const G = (x = 0, z = 0) => grp(root, x, 0.1, z);
  // "on Earth": the planet, and people who have been waiting
  const earth = G(0, 0); const globe = ball(earth, 0.9, smat(tex('earth', 512, 256, (g, w, h) => {
    g.fillStyle = '#2f7fd8'; g.fillRect(0, 0, w, h); const q = rng(12); g.fillStyle = '#5fbf6a';
    for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(q() * w, 30 + q() * (h - 60), 18 + q() * 46, 10 + q() * 26, q() * 3, 0, 7); g.fill(); }
    g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
  }), 1.0), 0, 1.85, -0.3);
  for (let i = 0; i < 26; i++) { const q = rng(40 + i); soft(ball(earth, 0.02 + q() * 0.025, lit('#ffffff', 2), (q() - 0.5) * 5, 0.6 + q() * 4.4, -1.6 - q())); }
  const waiting = [-0.72, 0, 0.72].map((x, i) => actor(earth, FAN(i + 1), i === 1 ? {a: {expr: 'grin', pose: 'both', prop: 'pad'}} : {a: {expr: 'laugh', pose: 'panic'}}, x, 0, 1.1, {scale: 0.9}));
  // "like the vegetable": a leek as a museum piece
  const veg = G(0.62, 0); box(veg, 0.56, 0.86, 0.56, '#e9e4d6', 0, 0.43, 0); box(veg, 0.66, 0.06, 0.66, '#d9d2c0', 0, 0.89, 0); const bigLeek = leek3d(veg, 0, 0.92, 0, 0.95);
  panel(veg, 0.36, 0.13, smat(signTex('plaque', 216, 78, '#c9a94f', '#17171d', [['LEEK', 40, 0.36], ['a vegetable', 21, 0.78]], {font: 'Montserrat'}), 1), 0, 0.55, 0.285);
  for (const s of [-1, 1]) { cyl(veg, 0.035, 0.7, '#c9a94f', s * 0.5, 0.35, 0.5); ball(veg, 0.055, '#c9a94f', s * 0.5, 0.72, 0.5); } rod(veg, [-0.5, 0.62, 0.5], [0.5, 0.62, 0.5], 0.02, '#b3262f');
  // the protest
  const pro = G(); const picket = smat(tex('picket', 124, 88, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#17171d'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); discIcon(g, w / 2, h / 2, 30); }), 1);
  for (const [x, z, r] of [[-0.9, -0.7, 0.12], [0.92, -0.6, -0.1]] as const) { const s = grp(pro, x, 0, z); s.rotation.z = r; rod(s, [0, 0, 0], [0, 1.45, 0], 0.025, '#8a6a3c'); panel(s, 0.62, 0.44, picket, 0, 1.55, 0.02); }
  // the donation jar gets its coins
  const coins = Array.from({length: 6}, () => { const c = cyl(root, 0.07, 0.02, lit('#f2c230', 1.2), 0, 0, 0, 0.07, 16); c.rotation.x = 1.2; return c; });
  // unmasking
  const mags = [-1, 1].map((s) => { const m = G(); torus(m, 0.3, 0.04, '#2b2f3a'); soft(mesh(m, new THREE.CircleGeometry(0.28, 28), new THREE.MeshBasicMaterial({color: '#bfe8ff', transparent: true, opacity: 0.16, depthWrite: false}))); rod(m, [s * 0.25, -0.25, 0], [s * 0.52, -0.62, 0], 0.04, '#6b4a2d'); return m; });
  const qTex = tex('qmark', 96, 96, (g) => text(g, '?', 48, 52, 92, '#ffe14a', {stroke: '#17171d', sw: 12})), qs = [0, 1, 2].map(() => card(root, 0.42, 0.42, qTex, 0, 0, 0, 1.1));
  // the demand, served: a disc and an apology
  const dem = G(0.55, 0.45); cyl(dem, 0.1, 0.9, '#3a3f52', 0, 0.45, 0, 0.07); cyl(dem, 0.26, 0.04, '#3a3f52', 0, 0.02, 0); cyl(dem, 0.36, 0.035, lit('#dfe6ee', 1), 0, 0.92, 0, 0.36, 32);
  const dDisc = disc3d(dem, 0.2, -0.13, 1.16, 0.02);
  const sorry = panel(dem, 0.3, 0.24, smat(tex('sorry', 150, 120, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e58fb0'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); text(g, 'SORRY', w / 2, h * 0.42, 40, '#17171d'); text(g, '♥', w / 2, h * 0.78, 30, '#e3342f', {font: 'Montserrat'}); }), 1.05), 0.17, 1.08, 0.05, -0.3);
  // "most polite threat": tea
  const tea = G(0, 0.42); cyl(tea, 0.5, 0.74, '#fffdf4', 0, 0.37, 0, 0.44, 28); cyl(tea, 0.46, 0.04, '#f6c8d8', 0, 0.76, 0, 0.46, 28); cyl(tea, 0.52, 0.06, '#e58fb0', 0, 0.03, 0, 0.52, 28);
  ball(tea, 0.12, '#fffdf4', -0.2, 0.89, 0.05).scale.y = 0.85; rod(tea, [-0.1, 0.9, 0.05], [0.02, 0.98, 0.05], 0.025, '#fffdf4'); torus(tea, 0.06, 0.018, '#fffdf4', -0.33, 0.9, 0.05); ball(tea, 0.03, '#e58fb0', -0.2, 1.0, 0.05);
  for (const [y, r] of [[0.8, 0.17], [0.98, 0.12]] as const) { cyl(tea, r, 0.015, '#fffdf4', 0.22, y, -0.02, r, 20); for (let i = 0; i < 5; i++) ball(tea, 0.03, i % 2 ? '#e58fb0' : '#8a5a3a', 0.22 + (r - 0.05) * Math.cos(i * 1.26), y + 0.035, -0.02 + (r - 0.05) * Math.sin(i * 1.26)); }
  cyl(tea, 0.012, 0.32, '#c9a94f', 0.22, 0.94, -0.02); cyl(tea, 0.035, 0.1, '#bfe8ff', 0.02, 0.83, 0.22); leek3d(tea, 0.02, 0.84, 0.22, 0.2);
  // the build nobody has seen
  const cr = G(0.4, -0.25); box(cr, 1.5, 1.25, 1.1, tmat(tiled(woodTex('crate2', '#b08a55', '#6b4a2d'), 2, 2)), 0, 0.625, 0);
  for (const y of [0.08, 1.17]) box(cr, 1.56, 0.14, 1.16, '#8a6a3c', 0, y, 0); for (const x of [-0.72, 0.72]) box(cr, 0.12, 1.25, 1.16, '#8a6a3c', x, 0.625, 0);
  panel(cr, 0.8, 0.4, smat(signTex('crate', 400, 200, '#fffdf4', '#17171d', [['THE WHOLE GAME?', 58, 0.36], ['“200 GB” · CLAIMED', 33, 0.76]], {border: '#17171d'}), 1), -0.24, 0.9, 0.565);
  box(cr, 0.3, 0.1, 0.03, '#8f959e', 0.36, 0.99, 0.575); torus(cr, 0.08, 0.022, '#8f959e', 0.36, 0.9, 0.6); box(cr, 0.24, 0.2, 0.07, '#c9a94f', 0.36, 0.78, 0.6);   // hasp and padlock
  cyl(cr, 0.026, 0.02, '#17171d', 0.36, 0.77, 0.64).rotation.x = Math.PI / 2;
  const reps = [actor(cr, REPORTER(0), {a: {expr: 'stern', pose: 'hold', prop: 'magnifier'}}, 0.9, 0, 0.95, {scale: 1.02}), actor(cr, REPORTER(1), {a: {expr: 'neutral', pose: 'think'}}, -1.12, 0, 0.95, {scale: 1.02})];
  reps[0].mesh.scale.x = -1;                                                                          // mirrored: the magnifier is held toward the crate
  const leek = actor(root, LEEK, {idle: {}, point: {pose: 'point'}, sign: {pose: 'hold', prop: 'sign'}, jar: {pose: 'both', prop: 'jar'}, cross: {pose: 'cross'}, shrug: {pose: 'shrug'}, cup: {pose: 'phone', prop: 'cup'}, hips: {pose: 'hips'}},
    0, 0.1, 0, {scale: 1.12, res: 1.3});
  return {
    light: (v) => v === 'tea' ? {...LIGHT.show, sky: '#ffd6e6', amb: 1.15} : LIGHT.show,
    tick: ({f, t, cam, shot}) => {
      const v = shot.v; veg.visible = v === 'veg'; pro.visible = v === 'protest'; dem.visible = v === 'demand'; tea.visible = v === 'tea'; cr.visible = v === 'crate'; ray.visible = v !== 'crate' && v !== 'earth';
      earth.visible = v === 'earth'; leek.node.visible = v !== 'earth';
      if (v === 'earth') { globe.rotation.y = f * 0.035; waiting.forEach((a, i) => { a.node.position.y = 0.1 * Math.abs(Math.sin(f * 0.42 + i * 1.3)); a.tick(f, cam); }); }
      mags.forEach((m, i) => { const s = i ? 1 : -1; m.visible = v === 'unmask'; m.position.set(s * (0.8 - 0.2 * smooth(t, 0, 14)), 1.95 + 0.07 * Math.sin(f * 0.18 + i * 2), 0.55); m.rotation.z = s * 0.25 + 0.08 * Math.sin(f * 0.13 + i); });
      qs.forEach((q, i) => { q.visible = v === 'unmask'; q.position.set([-0.78, 0.8, 0.9][i], [2.5, 2.46, 1.3][i] + 0.06 * Math.sin(f * 0.16 + i * 2), -0.3); q.scale.setScalar(pop(f, shot.at + 2 + i * 3, 8)); });
      coins.forEach((c, i) => {                                                                       // donations arrive from both sides, under the quote card
        const u = ((f + i * 5) % 30) / 30, s = i % 2 ? 1 : -1; c.visible = v === 'jar' && t > 3 && u < 0.94;
        c.position.set(s * 1.35 * (1 - u), lerp(1.9, 1.45, u) + 1.5 * u * (1 - u), 0.28); c.rotation.z = f * 0.3 + i;
      });
      let pose = 'idle', x = 0, z = 0, y = 0.1;
      if (v === 'name') { pose = 'hips'; y += hop(f, W(38), 0.14, 9); }
      else if (v === 'veg') { pose = 'point'; x = -0.52; bigLeek.rotation.z = shake(f, W(41), 0.12, 14); y += hop(f, W(41), 0.1, 8); }
      else if (v === 'protest') { pose = 'sign'; y += 0.06 * Math.abs(Math.sin(f * 0.42)); }
      else if (v === 'jar') pose = 'jar';
      else if (v === 'unmask') { pose = 'cross'; x = 0.03 * Math.sin(f * 1.3) * clamp01((f - W(105)) / 4); }
      else if (v === 'demand') {
        pose = f >= W(131) ? 'shrug' : 'point'; x = -0.42; y += hop(f, W(129), 0.1, 8) + hop(f, W(133), 0.1, 8);
        dDisc.rotation.y = 0.25 + 0.5 * Math.sin(f * 0.1); dDisc.position.y = 1.16 + hop(f, W(129), 0.12, 10); sorry.position.y = 1.08 + hop(f, W(133), 0.14, 10);
      }
      else if (v === 'tea') { pose = 'cup'; z = -0.3; y += 0.02 * Math.sin(f * 0.25); }
      else if (v === 'crate') { pose = 'cross'; x = 0.45; z = -1.05; y = 0.45; reps.forEach((r, i) => { r.node.position.y = hop(f, W(144) + i * 4, 0.1, 9); r.tick(f, cam); }); }
      leek.show(pose); leek.node.position.set(x, y, z); leek.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ game shop: what is in the box
export const store: Builder = (root) => {
  backdrop(root, ['#151936', '#2a2f5a']);
  floor(root, 14, 12, tmat(tiled(tileTex('shop', '#d9d3c6', '#b9b2a2', 2, '#cfc8b8'), 7, 6)));
  box(root, 9, 5, 0.3, '#2b3158', 0, 2.5, -2.55);
  const covers = ([['vi', '#ff5fa8', '#ff9a3c', 'VI'], ['a', '#2f8fd0', '#123a6a', 'RACE'], ['b', '#3f9b6a', '#0f3a26', 'GOAL'], ['c', '#7a4fd0', '#2a1050', 'ORBIT'], ['d', '#d04a3a', '#5a140f', 'DRAGON'], ['e', '#e9b930', '#8a5a0a', 'FARM']] as const)
    .map(([k, c1, c2, l]) => tmat(coverTex(k, c1, c2, l)));
  const r = rng(23);
  for (let row = 0; row < 4; row++) {
    const y = 0.75 + row * 0.72; box(root, 5.8, 0.06, 0.34, '#4a5288', 0, y - 0.03, -2.25);
    for (let x = -2.7; x <= 2.7; x += 0.37) box(root, 0.32, 0.46, 0.07, covers[row === 1 ? 0 : 1 + Math.floor(r() * 5)], x, y + 0.23, -2.22);
  }
  box(root, 6, 0.08, 0.08, lit('#ff7ac8', 1.8), 0, 3.72, -2.36);
  box(root, 0.55, 3.3, 0.8, '#4a5288', 1.32, 1.65, -1.35);
  box(root, 1.9, 0.9, 0.62, '#3a4170', 0, 0.45, 0.45); box(root, 2.0, 0.06, 0.7, '#5a63a8', 0, 0.93, 0.45);
  const price = grp(root, -0.38, 0.96, 0.64); box(price, 0.04, 0.12, 0.04, '#17171d', 0, 0.06, 0);
  panel(price, 0.56, 0.3, smat(signTex('price', 280, 150, '#ffe14a', '#17171d', [['$79.99', 96, 0.44], ['STANDARD EDITION', 26, 0.84]], {border: '#17171d'}), 1.1), 0, 0.24, 0.03);
  const slipTex = tex('slip', 260, 150, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#17171d'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); text(g, 'DOWNLOAD CODE', w / 2, 48, 38, '#17171d', {maxWidth: w - 30}); text(g, 'XXXX-XXXX-XXXX', w / 2, 104, 26, '#8a8698', {font: 'Montserrat', maxWidth: w - 36}); });
  // the case: shut, or open like a book with an empty tray
  const cs = grp(root, 0.36, 0.96, 0.5); cs.rotation.x = -0.12;
  const closed = box(cs, 0.5, 0.7, 0.07, covers[0], 0, 0.36, 0);
  const leaves = [-1, 1].map((s) => {
    const h = grp(cs, 0, 0.36, 0); box(h, 0.5, 0.7, 0.03, '#20232c', s * 0.25, 0, 0);
    if (s > 0) { panel(h, 0.44, 0.64, lit('#2c303c', 1), 0.25, 0, 0.017); torus(h, 0.15, 0.012, '#565c6e', 0.25, 0.02, 0.022); cyl(h, 0.035, 0.02, '#6a7082', 0.25, 0.02, 0.026).rotation.x = Math.PI / 2; }
    else { panel(h, 0.44, 0.64, lit('#3a3f4e', 1), -0.25, 0, 0.017); for (const y of [-0.2, 0.2]) box(h, 0.3, 0.02, 0.012, '#565c6e', -0.25, y, 0.022); }
    return h;
  });
  const slip = panel(cs, 0.42, 0.24, smat(slipTex, 1.08), -0.27, 0.36, 0.1);
  const buyer = actor(root, FAN(3), {look: {expr: 'neutral'}, shock: {expr: 'shock', pose: 'panic'}, think: {expr: 'nervous', pose: 'think'}, shrug: {expr: 'dazed', pose: 'shrug'}}, -0.5, 0, -0.1, {scale: 1.1, res: 1.2});
  const fDisc = disc3d(root, 0.28, -0.48, 1.92, 0.45), fSlip = panel(root, 0.52, 0.3, smat(slipTex, 1.1), 0.48, 1.92, 0.45);
  const dim = soft(panel(root, 9, 5, new THREE.MeshBasicMaterial({color: '#05060f', transparent: true, opacity: 0.6, depthWrite: false}), 0, 2.5, -2.1));   // house lights down for the question
  const leek = actor(root, LEEK, {idle: {}}, 0.78, -1.4, -0.2, {scale: 1.05, shadow: 0});
  return {
    light: () => ({...LIGHT.room, sky: '#eef0ff', amb: 1.45}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, choice = v === 'choice', a = v === 'open' ? smooth(f, W(53), W(53) + 8) : v === 'code' || choice ? 1 : 0;
      closed.visible = a < 0.05; leaves.forEach((h, i) => { h.visible = a >= 0.05; h.rotation.y = -(i ? 1 : -1) * lerp(1.35, 0.3, a); });
      cs.position.set(choice ? 0 : 0.33, 0.96 + hop(f, W(53), 0.1, 8), 0.5); dim.visible = choice;
      const out = v === 'code' ? pop(f, W(57), 9) : 0; slip.visible = v === 'code'; slip.position.set(-0.27 + 0.1 * out, 0.36 + 0.44 * out, 0.12); slip.rotation.z = 0.12 * out;
      price.visible = v === 'final' || v === 'price';
      buyer.node.visible = !choice; buyer.show(v === 'open' ? (f >= W(55) ? 'shock' : 'look') : v === 'code' ? 'shrug' : 'think'); buyer.node.position.y = hop(f, W(55), 0.16, 9); buyer.tick(f, cam);
      fDisc.visible = fSlip.visible = choice; fDisc.position.y = 1.92 + 0.06 * Math.sin(f * 0.15); fDisc.rotation.y = 0.5 * Math.sin(f * 0.08); fSlip.position.y = 1.92 + 0.06 * Math.sin(f * 0.15 + 2); fSlip.rotation.z = 0.08 * Math.sin(f * 0.1);
      const k = smooth(f, TOTAL - 44, TOTAL - 34) * (1 - smooth(f, TOTAL - 12, TOTAL - 5));               // the tail: somebody is still watching
      leek.node.visible = choice && k > 0; leek.node.position.y = lerp(-1.4, -0.42, k); leek.tick(f, cam);                       // up from behind the counter, eyes just over the edge
    },
  };
};

// ------------------------------------------------------------------ 230 million copies
export const mountain: Builder = (root) => {
  backdrop(root, ['#3a8fe8', '#9fd0ff', '#fff0d0']);
  floor(root, 80, 60, '#7fb86a');
  const cov = [tmat(coverTex('v1', '#3f9b6a', '#0f3a26', 'V')), tmat(coverTex('v2', '#2b2f3a', '#0c0d12', 'V')), tmat(coverTex('v3', '#d08a2f', '#6e3d0a', 'V'))];
  const r = rng(4), cases: THREE.Mesh[] = [];
  // a stepped mountain, 7-5-3-1 across (wide enough to fill a vertical frame between the counter and the captions),
  // standing behind a grass hill that keeps the caption band plain
  for (let k = 0; k < 4; k++) for (let i = 0; i < 7 - 2 * k; i++) { const y = 2.27 + k * 0.86, m = box(root, 0.62, 0.84, 0.16, cov[Math.floor(r() * 3)], (i - (6 - 2 * k) / 2) * 0.66, y, -k * 0.04); m.userData = {k, i, y}; cases.push(m); }
  mesh(root, new THREE.SphereGeometry(6, 72, 36), '#7fb86a', 0.2, -4.2, 2.0);
  for (const [x, y, z, s] of [[-5, 6.5, -12, 1.6], [4.5, 5.2, -10, 1.2], [1, 8.5, -14, 1.8], [-3.4, 3.2, -9, 1]] as const) for (let i = 0; i < 4; i++) soft(ball(root, 0.8 * s, lit('#ffffff', 1), x + (i - 1.5) * 0.9 * s, y + (i % 2) * 0.3 * s, z)).scale.y = 0.6;
  const fans = [actor(root, FAN(0), {a: {expr: 'shock', pose: 'panic'}}, 1.35, 1.63, 2.8, {scale: 1.0}), actor(root, FAN(1), {a: {expr: 'grin', pose: 'point'}}, -0.95, 1.63, 2.8, {scale: 1.0})];
  return {
    light: () => LIGHT.day,
    tick: ({f, cam, shot}) => {
      cases.forEach((m) => { const at = shot.at + m.userData.k * 4 + m.userData.i, k = smooth(f, at, at + 7); m.visible = f >= at; m.position.y = m.userData.y + 3.2 * (1 - k) + (k >= 1 ? 0 : 0); });
      fans.forEach((a, i) => { a.node.position.y = 1.63 + 0.05 * Math.abs(Math.sin(f * 0.3 + i * 1.4)); a.tick(f, cam); });
    },
  };
};
