// Sets of the Nvidia exit short, part 1: what every set shares, and the sets kitchen, counter, diner, booth, chip and
// office. Each builder fills a group once and returns a tick that poses it for a frame (motion is a pure function of the
// frame number, so any frame can be rendered on its own). The diner is an invented one: teal, cream and red, a sign that
// says DINER. Nobody's trade dress is copied, and no company's logo is drawn anywhere in the film.
import * as THREE from 'three';
import {backdrop, ball, beam, box, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, smat, smooth, soft, tex, text, tiled, tileTex, tmat, torus, woodTex, type G2, type Node, type V} from './kit';
import {actor, ENGINEER, JENSEN, REPORTER, WAITER} from './cast';
import {glints, halo, laptop, plant, signTex, skylineTex, table, tvCamera} from './props';
import {TOTAL, W, type Shot} from './story';

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
export const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };
/** a see-through unlit material whose opacity a set animates */
export const glass = (c: string, opacity: number, k = 1) => new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(k), transparent: true, opacity, depthWrite: false});
const frac = (x: number) => x - Math.floor(x);
/** a number in [0, 1) that belongs to i */
export const hash = (i: number, k = 1) => frac(Math.sin(i * 127.1 + k * 311.7) * 43758.5453);

/** Rings that leave a point, facing the camera side of the set. Call the returned function every frame. */
export function rings(p: Node, n = 3, color = '#7af0e0') {
  const os = Array.from({length: n}, () => { const o = soft(mesh(p, new THREE.RingGeometry(0.86, 1, 44), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}))); o.renderOrder = 6; return o; });
  return (f: number, on: boolean, at: V, r = 0.5, ry = 0, speed = 0.05, flat = false) => os.forEach((o, i) => {
    const u = (f * speed + i / n) % 1; o.visible = on; o.position.set(...at); o.rotation.set(flat ? -Math.PI / 2 : 0, flat ? 0 : ry, 0); o.scale.setScalar(r * (0.2 + 0.8 * u)); op(o, 0.9 * (1 - u) ** 1.4);
  });
}
/** a dashed outline of head and shoulders: somebody who is in the story and is not drawn */
export function ghost(g: G2, x: number, y: number, s: number, c = '#ffe14a') {
  g.save(); g.strokeStyle = c; g.lineWidth = s * 0.07; g.setLineDash([s * 0.16, s * 0.11]); g.lineCap = 'round';
  g.beginPath(); g.arc(x, y - s * 0.3, s * 0.27, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.6); g.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x, y + s * 0.05); g.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.5, y + s * 0.6); g.stroke(); g.restore();
}
/** a coffee cup on a saucer */
export function cup(p: Node, x: number, y: number, z: number, s = 1) {
  const g = grp(p, x, y, z), white = lit('#fffdf4', 1); g.scale.setScalar(s);
  cyl(g, 0.06, 0.012, white, 0, 0.006, 0, 0.078, 20).castShadow = false; cyl(g, 0.04, 0.075, white, 0, 0.05, 0, 0.052, 20); cyl(g, 0.044, 0.004, '#4a2a16', 0, 0.089, 0, 0.044, 20); torus(g, 0.026, 0.008, white, 0.06, 0.052, 0);
  return g;
}
/** a pile of plates; a set shows the first n of them */
export function plates(p: Node, x: number, y: number, z: number, n: number, r = 0.17) {
  return Array.from({length: n}, (_, i) => { const o = cyl(p, r * 0.6, 0.028, lit(i % 2 ? '#fffdf4' : '#ece6d6', 1), x, y + 0.014 + i * 0.03, z, r, 24); o.castShadow = false; return o; });
}
/** a square chip seen from above: package, pins, a die */
export function chipIcon(g: G2, x: number, y: number, s: number, body = '#1c1f26', die = '#76b900', pin = '#e7c56a') {
  g.save(); g.fillStyle = pin; for (let i = -2; i <= 2; i++) { g.fillRect(x + i * s * 0.17 - s * 0.035, y - s * 0.62, s * 0.07, s * 1.24); g.fillRect(x - s * 0.62, y + i * s * 0.17 - s * 0.035, s * 1.24, s * 0.07); }
  g.fillStyle = body; g.fillRect(x - s * 0.5, y - s * 0.5, s, s); g.fillStyle = die; g.fillRect(x - s * 0.24, y - s * 0.24, s * 0.48, s * 0.48); g.restore();
}

// ------------------------------------------------------------------ kitchen: the dishwasher (the hook, and "I was a dishwasher")
export const kitchen: Builder = (root) => {
  const STEP = 0.2;                                                     // fifteen, and on a crate to reach the sink
  backdrop(root, ['#cfdde2', '#aebfc6']);
  floor(root, 12, 10, tmat(tiled(tileTex('kit-floor', '#b9a58a', '#7a6a56', 4, '#a8947a'), 6, 5)));
  panel(root, 10, 4.8, tmat(tiled(tileTex('kit-wall', '#f2f5f3', '#b9c6cb', 4), 10, 5)), 0, 2.4, -1.7);
  // along the wall: a shelf with pots, a rail of order tickets, a swing door with a round window
  box(root, 3.0, 0.06, 0.42, '#aeb7c3', -1.2, 2.5, -1.48);
  for (const [x, r, h, c] of [[-2.3, 0.2, 0.3, '#c9ced6'], [-1.75, 0.15, 0.22, '#8f96a8'], [-1.25, 0.17, 0.34, '#c9ced6'], [-0.6, 0.2, 0.2, '#b8552f']] as const) { cyl(root, r, h, c, x, 2.53 + h / 2, -1.48); box(root, 0.3, 0.03, 0.05, '#3a3f4a', x + r + 0.12, 2.53 + h * 0.8, -1.48); }
  box(root, 2.6, 0.035, 0.04, '#8f96a8', -1.1, 1.98, -1.66);
  for (let i = 0; i < 6; i++) { const t = panel(root, 0.2, 0.3 + (i % 3) * 0.05, lit(i % 2 ? '#fffdf4' : '#fff3a8', 1), -2.2 + i * 0.44, 1.8 - (i % 3) * 0.025, -1.65); t.rotation.z = (i % 2 ? 1 : -1) * 0.04; }
  box(root, 1.25, 2.4, 0.08, '#c8642c', 2.45, 1.2, -1.66); cyl(root, 0.26, 0.03, lit('#ffe9b0', 1.2), 2.45, 1.6, -1.6).rotation.x = Math.PI / 2; torus(root, 0.27, 0.03, '#8f96a8', 2.45, 1.6, -1.59);
  // the sink: a steel counter between him and us, a basin of suds, a tap, and a pile of plates on either side of him
  box(root, 3.5, 0.9, 0.8, '#aeb7c3', 0, 0.45, 0.5); box(root, 3.6, 0.05, 0.9, '#d5dbe3', 0, 0.925, 0.5); box(root, 3.5, 0.1, 0.02, '#8f96a8', 0, 0.25, 0.91);
  box(root, 0.52, 0.02, 0.5, '#6f7a8a', 0, 0.953, 0.52);
  rod(root, [-0.2, 0.95, 0.16], [-0.2, 1.15, 0.16], 0.022, '#c9ced6'); rod(root, [-0.2, 1.15, 0.16], [-0.12, 1.17, 0.34], 0.022, '#c9ced6'); rod(root, [-0.12, 1.17, 0.34], [-0.12, 1.12, 0.36], 0.022, '#c9ced6');
  soft(mesh(root, new THREE.CylinderGeometry(0.01, 0.01, 0.14, 8), glass('#bfe6ff', 0.8, 1.1), -0.12, 1.04, 0.36));
  for (let i = 0; i < 9; i++) ball(root, 0.045 + (i % 3) * 0.014, lit('#ffffff', 1), -0.19 + (i % 5) * 0.095 + (i > 4 ? 0.05 : 0), 0.965 + (i % 2) * 0.02, 0.42 + (i % 3) * 0.09).castShadow = false;
  const N = 18, DX = -0.41, CX = 0.41, dirty = plates(root, DX, 0.95, 0.52, N, 0.13), clean = plates(root, CX, 0.95, 0.52, N, 0.13);
  const fly = cyl(root, 0.078, 0.028, lit('#fffdf4', 1), 0, 0, 0, 0.13, 24); fly.castShadow = false;
  const bubbles = Array.from({length: 10}, () => soft(mesh(root, new THREE.SphereGeometry(1, 14, 10), glass('#eaf7ff', 0.6, 1.05))));
  const me = actor(root, JENSEN(2), {wash: {expr: 'smile', pose: 'both'}, show: {expr: 'grin', pose: 'wave', prop: 'plate'}}, 0, STEP, -0.15, {scale: 1.0, res: 1.3, wide: true, shadow: 0});
  const twinkle = glints(root, [[0.35, 1.45, -0.05]]);
  return {
    light: () => LIGHT.room,
    tick: ({f, cam, shot}) => {
      const dish = shot.v === 'dish', a = shot.at, P = 9, base = dish ? 9 : 0, n = base + Math.max(0, Math.floor((f - a) / P)), k = frac(Math.max(0, f - a) / P), up = dish && f >= W(39);
      // one plate after another leaves the dirty pile, passes through his hands and lands on the clean one
      const nd = Math.max(2, N - n), nc = Math.min(N, 1 + n);
      dirty.forEach((d, i) => { d.visible = i < nd; d.position.x = DX + 0.0004 * i * i * Math.sin(f * 0.17); });
      clean.forEach((c, i) => { c.visible = i < nc; });
      const y0 = 0.97 + nd * 0.03, y1 = 0.97 + nc * 0.03, LOW = 1.0;                         // down beside one pile, low through the suds and his hands, up beside the other: never across his face
      fly.visible = !up && nd > 2; fly.position.set(lerp(DX, CX, k), k < 0.5 ? lerp(y0, LOW, smooth(k, 0, 0.24)) : lerp(LOW, y1, smooth(k, 0.76, 1)), 0.52); fly.rotation.z = Math.sin(k * Math.PI * 2) * 0.35;
      bubbles.forEach((b, i) => { const u = frac(f * 0.011 + i / 10); b.position.set((i % 2 ? 1 : -1) * (0.2 + 0.36 * hash(i)) + 0.05 * Math.sin(f * 0.07 + i), 1.02 + u * 1.2, 0.45); b.scale.setScalar((0.035 + 0.03 * hash(i, 2)) * (1 - 0.4 * u)); op(b, 0.65 * (1 - u)); });
      me.show(up ? 'show' : 'wash'); me.node.position.y = STEP + hop(f, W(39), 0.06, 8) + 0.012 * Math.sin(f * 0.7); me.tick(f, cam); twinkle(f, up);
    },
  };
};

// ------------------------------------------------------------------ counter: the busboy and the waiter (1978)
export const counter: Builder = (root) => {
  backdrop(root, ['#f0d9b0', '#e2c08a']);
  floor(root, 14, 10, tmat(tiled(tileTex('ctr-floor', '#f4efe2', '#15121c', 2, '#22202a'), 7, 5)));
  panel(root, 12, 5, tmat(tiled(grainTex('ctr-wall', '#f6ecd4', 0.05), 5, 3)), 0, 2.5, -2.4); box(root, 12, 0.5, 0.06, '#1f8f96', 0, 3.3, -2.36);
  // the back bar: a coffee machine, a pie case, a stack of cups
  box(root, 6.4, 0.9, 0.5, '#d8cbb0', 0, 0.45, -2.1); box(root, 6.5, 0.05, 0.56, '#aeb7c3', 0, 0.925, -2.1);
  box(root, 0.6, 0.62, 0.36, '#c9ced6', -1.5, 1.26, -2.1); for (const dx of [-0.14, 0.14]) { ball(root, 0.105, '#4a2a16', -1.5 + dx, 1.07, -1.86); cyl(root, 0.05, 0.03, '#e8553a', -1.5 + dx, 1.19, -1.86); }
  for (const [x, c] of [[0.5, '#d9a45a'], [0.95, '#c8642c'], [1.4, '#f3dfa0']] as const) { cyl(root, 0.16, 0.03, '#c9ced6', x, 0.965, -2.1); cyl(root, 0.15, 0.08, c, x, 1.02, -2.1, 0.12); }
  soft(box(root, 1.5, 0.42, 0.44, glass('#dff3ff', 0.28), 0.95, 1.16, -2.1)); box(root, 1.54, 0.03, 0.48, '#c9ced6', 0.95, 1.385, -2.1);
  // the counter, its stools, and what the guests left on it
  box(root, 5.6, 1.0, 0.62, tmat(tiled(foldTex('ctr-front', '#1f8f96', '#156c72', 12), 3, 1)), 0, 0.5, -0.9); box(root, 5.8, 0.06, 0.78, '#f1e6cc', 0, 1.03, -0.9); box(root, 5.8, 0.045, 0.02, '#d5dbe3', 0, 0.975, -0.505);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) { cyl(root, 0.2, 0.03, '#8f96a8', x, 0.015, -0.15); cyl(root, 0.035, 0.66, '#c9ced6', x, 0.36, -0.15); cyl(root, 0.19, 0.09, '#e8553a', x, 0.74, -0.15); }
  plates(root, -1.25, 1.06, -0.85, 3, 0.14); cup(root, -0.75, 1.06, -0.8); cup(root, 0.15, 1.06, -0.95); plates(root, 0.75, 1.06, -0.85, 2, 0.14); cup(root, 1.25, 1.06, -0.8);
  cyl(root, 0.035, 0.16, '#d81f3a', -0.2, 1.14, -1.0); cyl(root, 0.035, 0.16, '#f2c230', -0.08, 1.14, -1.0); box(root, 0.16, 0.13, 0.1, '#c9ced6', 1.7, 1.125, -0.95);
  const walk = Object.fromEntries([0, 1, 2, 3].map((i) => ['w' + i, {expr: 'whistle', pose: 'both', prop: 'tub', mode: 'march', phase: i / 4} as const]));
  const me = actor(root, JENSEN(2), {...walk, cups: {expr: 'nervous', pose: 'hold', prop: 'cups'}, oops: {expr: 'shock', pose: 'hold', prop: 'cups'}}, 0, 0, 0.8, {scale: 1.0, res: 1.2, wide: true});
  return {
    light: () => LIGHT.warm,
    tick: ({f, cam, shot}) => {
      const a = shot.at;
      if (shot.v === 'bus') { me.show('w' + (Math.floor((f - a) / 3) % 4)); me.node.position.set(lerp(-0.85, 0.1, (f - a) / 30), 0, 0.8); me.tick(f, cam); }
      else { me.show(f >= W(46) ? 'oops' : 'cups'); me.node.position.set(0.3, 0, 0.9); me.tick(f, cam); me.mesh.rotation.z = 0.035 * Math.sin(f * 0.33) + 0.02 * Math.sin(f * 0.71); }
    },
  };
};

// ------------------------------------------------------------------ diner: outside, in 1978, in 1993 at night, and in 2026 with a news crew
export const diner: Builder = (root) => {
  const day = backdrop(root, ['#6fb4e8', '#fde8c8']), night = backdrop(root, ['#070b24', '#2a2658']), grey = backdrop(root, ['#aab6c4', '#dfe4ea']);
  floor(root, 30, 24, tmat(tiled(grainTex('diner-lot', '#5a5f6a', 0.1), 8, 6)));
  for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) box(root, 0.08, 0.012, 2.6, lit('#f3f1ea', 1), x, 0.008, 2.9).castShadow = false;
  box(root, 12, 0.14, 1.3, '#c9c2b4', 0, 0.07, -1.0);
  // the building: cream walls, a teal band, a flat red roof, three windows and a glass door
  box(root, 8.4, 2.5, 3, '#f6ecd4', 0.2, 1.39, -3.2); box(root, 8.5, 0.34, 3.1, '#1f8f96', 0.2, 2.5, -3.2); box(root, 9.0, 0.16, 3.7, '#e8553a', 0.2, 2.78, -3.2);
  const paneM = lamp('#ffe2a8', 1), doorM = lamp('#bfe6ff', 1);
  for (const x of [-2.9, -1.0, 2.6]) { box(root, 1.74, 1.24, 0.06, '#3a3f4a', x, 1.55, -1.69); soft(panel(root, 1.6, 1.1, paneM, x, 1.55, -1.65)); box(root, 0.04, 1.1, 0.03, '#3a3f4a', x, 1.55, -1.64); box(root, 1.74, 0.07, 0.16, '#c9c2b4', x, 0.9, -1.64); }
  box(root, 1.0, 2.1, 0.06, '#3a3f4a', 0.9, 1.19, -1.69); soft(panel(root, 0.84, 1.9, doorM, 0.9, 1.2, -1.65)); box(root, 0.04, 0.3, 0.05, '#c9ced6', 0.62, 1.2, -1.62);
  // a low roadside sign of its own
  box(root, 0.14, 1.5, 0.14, '#3a3f4a', -0.55, 0.75, 0.2); box(root, 1.3, 0.86, 0.14, '#22202a', -0.55, 1.95, 0.2);
  const signM = smat(signTex('diner-sign', 600, 380, '#b8232f', '#fff3d6', [['DINER', 210, 0.42], ['OPEN 24 HOURS', 60, 0.83]], {border: '#fff3d6'}), 1.05);
  soft(panel(root, 1.2, 0.76, signM, -0.55, 1.95, 0.275));
  const glowS = halo(root, 1.5, '#ff6a4a', 0, -0.55, 1.95, 0.4), glowW = [-2.9, -1.0].map((x) => halo(root, 1.5, '#ffd28a', 0, x, 1.55, -1.5));
  const teen = actor(root, JENSEN(2), {hi: {expr: 'smile', pose: 'wave'}, a: {expr: 'smile'}}, 0.45, 0, 1.0, {scale: 1.0, res: 1.2, wide: true});
  const rep = actor(root, REPORTER, {a: {expr: 'neutral', pose: 'mask', prop: 'mic'}, b: {expr: 'stern', pose: 'mask', prop: 'mic'}}, 0.55, 0, 0.9, {scale: 1.0, res: 1.2, wide: true});
  const tv = tvCamera(root, 0.2, 2.6, -0.2, 1.0);
  return {
    light: (v) => v === 'why' ? LIGHT.night : v === 'crew' ? {...LIGHT.cold, amb: 1.75} : LIGHT.day,
    tick: ({f, cam, shot}) => {
      const v = shot.v, dark = v === 'why';
      day.visible = v === 'job'; night.visible = dark; grey.visible = v === 'crew';
      paneM.color.set('#ffe2a8').multiplyScalar(dark ? 1.5 : v === 'crew' ? 0.8 : 0.95); doorM.color.set(dark ? '#ffe2a8' : '#bfe6ff').multiplyScalar(dark ? 1.3 : 0.9);
      signM.color.set('#ffffff').multiplyScalar(dark ? 1.35 + 0.12 * Math.sin(f * 0.9) : 1.05); op(glowS, dark ? 0.3 : 0); glowW.forEach((g) => op(g, dark ? 0.22 : 0));
      teen.node.visible = v === 'job'; teen.show(f >= W(31) ? 'hi' : 'a'); teen.node.position.y = hop(f, W(31), 0.07, 8); teen.tick(f, cam);
      rep.node.visible = tv.visible = v === 'crew'; rep.show(f >= W(213) ? 'b' : 'a'); rep.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ booth: where the company was started, and where a plaque hung
const SKIES = ['#9fd4f4', '#f4a868', '#141c44', '#141c44', '#f6c6c0', '#9fd4f4'];
const plaqueTex = () => tex('booth-plaque', 760, 480, (g, w, h) => {
  g.fillStyle = '#16301e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e7c56a'; g.lineWidth = 14; g.strokeRect(16, 16, w - 32, h - 32);
  chipIcon(g, 118, 116, 104); text(g, 'THE BOOTH THAT', w / 2 + 64, 120, 84, '#f3f1ea', {maxWidth: 470}); text(g, 'LAUNCHED A', w / 2, 250, 96, '#f3f1ea', {maxWidth: w - 90}); text(g, '$1 TRILLION COMPANY.', w / 2, 374, 92, '#b6e04a', {maxWidth: w - 90});
});
const patchTex = () => tex('booth-patch', 760, 480, (g, w, h) => {
  g.fillStyle = '#fdf7e6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,100,70,.55)'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#5a4a36'; for (const [x, y] of [[44, 44], [w - 44, 44], [44, h - 44], [w - 44, h - 44]]) { g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); }
});
const sketchTex = (stage: number) => tex('booth-sketch-' + stage, 400, 400, (g, w) => {
  g.strokeStyle = '#2a4fb0'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  if (stage === 0) g.strokeRect(110, 110, 180, 180);
  if (stage === 1) for (let i = -2; i <= 2; i++) { const o = w / 2 + i * 36; g.beginPath(); g.moveTo(o, 110); g.lineTo(o, 66); g.moveTo(o, 290); g.lineTo(o, 334); g.moveTo(110, o); g.lineTo(66, o); g.moveTo(290, o); g.lineTo(334, o); g.stroke(); }
  if (stage === 2) { g.strokeRect(160, 160, 80, 80); g.beginPath(); g.moveTo(160, 160); g.lineTo(184, 138); g.lineTo(264, 138); g.lineTo(240, 160); g.moveTo(264, 138); g.lineTo(264, 218); g.lineTo(240, 240); g.stroke(); }
});
export const booth: Builder = (root) => {
  backdrop(root, ['#f0dcc0', '#e6caa4']);
  floor(root, 14, 10, tmat(tiled(tileTex('booth-floor', '#f4efe2', '#15121c', 2, '#22202a'), 7, 5)));
  // the wall: teal below, cream above, two windows and a pier between them
  panel(root, 12, 4.4, tmat(tiled(grainTex('booth-wall', '#f6ecd4', 0.05), 5, 2)), 0, 2.2, -1.36);
  box(root, 12, 1.16, 0.04, '#1f8f96', 0, 0.58, -1.33); box(root, 12, 0.07, 0.07, '#e8553a', 0, 1.2, -1.31);
  const skyM = lamp(SKIES[0], 1);
  for (const x of [-1.85, 1.85]) { box(root, 2.3, 1.36, 0.05, '#3a3f4a', x, 2.0, -1.33); soft(panel(root, 2.14, 1.2, skyM, x, 2.0, -1.3)); box(root, 0.05, 1.2, 0.04, '#3a3f4a', x, 2.0, -1.29); for (let i = 0; i < 3; i++) box(root, 2.14, 0.035, 0.05, '#f3f1ea', x, 2.52 - i * 0.09, -1.28); }
  // the booth: a bench against the wall with two short arms, and a table
  box(root, 3.2, 0.5, 0.62, '#156c72', 0, 0.25, -0.98); box(root, 3.2, 0.74, 0.16, tmat(tiled(foldTex('booth-vinyl', '#1f8f96', '#156c72', 10), 1.2, 1)), 0, 0.87, -1.22); box(root, 3.3, 0.06, 0.2, '#d5dbe3', 0, 1.26, -1.22);
  for (const s of [-1, 1]) { box(root, 0.16, 0.86, 0.7, '#156c72', s * 1.68, 0.43, -0.92); box(root, 0.2, 0.05, 0.74, '#d5dbe3', s * 1.68, 0.88, -0.92); }
  box(root, 2.5, 0.05, 0.8, '#f1e6cc', 0, 0.765, -0.3); box(root, 2.54, 0.035, 0.84, '#c9ced6', 0, 0.735, -0.3); for (const s of [-1, 1]) { cyl(root, 0.06, 0.72, '#8f96a8', s * 0.75, 0.36, -0.3); cyl(root, 0.24, 0.03, '#8f96a8', s * 0.75, 0.015, -0.3); }
  box(root, 0.13, 0.15, 0.09, '#c9ced6', -1.05, 0.865, -0.5); cyl(root, 0.03, 0.14, '#d81f3a', -0.92, 0.86, -0.56); cyl(root, 0.03, 0.14, '#f2c230', -0.92, 0.86, -0.44);
  // on the pier: a clock (1993), or the plaque, or the place where it hung (2026)
  const clock = grp(root, 0.5, 2.25, -1.33); cyl(clock, 0.27, 0.05, '#3a3f4a', 0, 0, 0).rotation.x = Math.PI / 2; cyl(clock, 0.235, 0.02, lit('#fffdf4', 1), 0, 0, 0.03).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) box(clock, 0.016, 0.04, 0.01, '#15121c', 0.19 * Math.sin(i * Math.PI / 6), 0.19 * Math.cos(i * Math.PI / 6), 0.045).rotation.z = -i * Math.PI / 6;
  const hands = [grp(clock, 0, 0, 0.05), grp(clock, 0, 0, 0.055)]; box(hands[0], 0.026, 0.13, 0.008, '#15121c', 0, 0.055, 0); box(hands[1], 0.018, 0.19, 0.008, '#e3342f', 0, 0.085, 0);
  const plaque = grp(root, -0.1, 2.05, -1.34); box(plaque, 1.0, 0.64, 0.035, '#0c1a10', 0, 0, 0.018); soft(panel(plaque, 0.95, 0.6, smat(plaqueTex(), 1.0), 0, 0, 0.04));
  const patch = soft(panel(root, 0.95, 0.6, smat(patchTex(), 1.02), -0.1, 2.05, -1.345));
  const shine = glints(root, [[-0.5, 2.3, -1.2], [0.3, 1.85, -1.2]]);
  // the three of them in 1993; a waiter with the pot
  const me = actor(root, JENSEN(1), {sit: {expr: 'smile', pose: 'desk', mode: 'sit'}, idea: {expr: 'grin', pose: 'wave', prop: 'napkin', mode: 'sit'}, talk: {expr: 'grin', pose: 'point', mode: 'sit'}, late: {expr: 'relief', pose: 'desk', mode: 'sit'}}, 0, 0.56, -0.95, {scale: 1.0, res: 1.3, wide: true, shadow: 0});
  const pals = [0, 1].map((i) => actor(root, ENGINEER(i), {sit: {expr: 'smile', pose: 'desk', mode: 'sit'}, wow: {expr: 'grin', pose: 'desk', mode: 'sit'}, late: {expr: 'dazed', pose: 'desk', mode: 'sit'}}, i ? 0.74 : -0.74, 0.56, -0.95, {scale: 1.0, res: 1.2, shadow: 0}));
  const waiter = actor(root, WAITER, {pour: {expr: 'smile', pose: 'side', prop: 'pot'}, a: {expr: 'smile'}}, 1.45, 0, 0.1, {scale: 1.0, res: 1.2, wide: true});
  waiter.mesh.scale.x = -1;                                             // the pot on the table's side of her, held low: at shoulder height it hid the engineer's face
  const cups = Array.from({length: 14}, (_, i) => cup(root, -0.98 + (i % 7) * 0.33 + (i > 6 ? 0.1 : 0), 0.79, i > 6 ? -0.42 : -0.12));
  const still3 = [cup(root, -0.62, 0.79, -0.42), cup(root, 0.38, 0.79, -0.56), cup(root, 0.78, 0.79, -0.36)], topCup = cup(root, -0.33, 0.79, 0.0);
  // seen from above: the napkin, the sketch, a pen, three pairs of sleeves
  const napkin = grp(root, 0, 0.792, -0.26); const sheet = panel(napkin, 0.44, 0.44, lit('#fffdf4', 1), 0, 0, 0); sheet.rotation.x = -Math.PI / 2; napkin.rotation.y = 0.12;
  const marks = [0, 1, 2].map((i) => { const o = soft(panel(napkin, 0.44, 0.44, smat(sketchTex(i), 1, true), 0, 0.003 + i * 0.001, 0)); o.rotation.x = -Math.PI / 2; return o; });
  const pen = grp(root, 0, 0.8, -0.26); rod(pen, [0, 0, 0], [0.1, 0.2, -0.16], 0.012, '#2a4fb0'); cone(pen, 0.012, 0.03, '#15121c', 0, -0.012, 0, 8).rotation.x = Math.PI;
  const arms = grp(root); for (const [x, c, ry] of [[-0.62, '#3f8a55', 0.5], [0.05, '#4f86d6', 0], [0.66, '#8a5a3c', -0.5]] as const) for (const s of [-1, 1]) { const a = grp(arms, x + s * 0.12, 0.82, -0.62); a.rotation.y = ry + s * 0.25; box(a, 0.085, 0.07, 0.34, c, 0, 0, 0); ball(a, 0.05, '#f4cfa8', 0, 0, 0.2).castShadow = false; }
  return {
    light: (v) => v === 'plaque' || v === 'gone' ? LIGHT.cold : {...LIGHT.room, key: '#ffe9c8'},
    tick: ({f, cam, shot}) => {
      const v = shot.v, then = v === 'found' || v === 'three' || v === 'coffee' || v === 'stay', top = v === 'napkin', now = v === 'plaque' || v === 'gone';
      // "no one could chase you out": the windows go through a night and the clock runs
      const T0 = W(73) - 2, T1 = W(79) + 10, u = v === 'stay' ? smooth(f, T0, T1) : 0, seg = Math.min(4.999, u * 5), i0 = Math.floor(seg);
      skyM.color.set(SKIES[i0]).lerp(new THREE.Color(SKIES[i0 + 1]), seg - i0).multiplyScalar(now ? 0.92 : 1);
      clock.visible = !now; const hrs = 2.2 + u * 19; hands[0].rotation.z = -hrs * Math.PI / 6; hands[1].rotation.z = -hrs * Math.PI * 2;
      plaque.visible = v === 'plaque'; patch.visible = v === 'gone'; shine(f, v === 'plaque');
      me.node.visible = then; pals.forEach((p) => { p.node.visible = then; });
      const idea = v === 'found' && f >= W(8), wow = (v === 'found' && f >= W(9)) || (v === 'coffee' && f >= W(69)), late = v === 'stay' && f >= W(76);
      me.show(idea ? 'idea' : late ? 'late' : v === 'three' && f >= W(54) - 12 ? 'talk' : 'sit'); me.node.position.y = 0.56 + hop(f, W(8), 0.07, 8); me.tick(f, cam);
      pals.forEach((p, i) => { p.show(late ? 'late' : wow ? 'wow' : 'sit'); p.node.position.y = 0.56 + hop(f, W(9) + i * 3, 0.05, 8); p.tick(f, cam); });
      // the waiter comes with the pot, the cups multiply, and nobody sends them home
      const pour = v === 'coffee' || v === 'stay', gone = smooth(f, T0 + 4, T0 + 22);
      waiter.node.visible = pour && gone < 1; waiter.show(f < T0 ? 'pour' : 'a'); waiter.node.position.set(1.45 + 1.6 * gone, hop(f, W(69), 0.05, 8), 0.1); waiter.tick(f, cam);
      cups.forEach((c, i) => { const at = W(67) + i * 3; c.visible = pour && f >= at; c.scale.setScalar(pop(f, at, 5)); });
      still3.forEach((c) => { c.visible = then && !pour; }); topCup.visible = top;
      napkin.visible = top || v === 'three'; pen.visible = arms.visible = top;
      marks.forEach((m, i) => { const at = W(56) + i * 9; m.visible = v === 'three' ? false : f >= at; op(m, smooth(f, at, at + 7)); });
      const pt = f * 0.5; pen.position.set(0.1 * Math.cos(pt) + 0.02, 0.8, -0.26 + 0.1 * Math.sin(pt * 1.3));
    },
  };
};

// ------------------------------------------------------------------ chip: the top of the pile, the boom, and the sticking plaster
const boardTex = () => tex('chip-board', 512, 512, (g, w, h) => {
  g.fillStyle = '#0c3324'; g.fillRect(0, 0, w, h); const r = rng(29); g.lineCap = 'round';
  for (let i = 0; i < 26; i++) { g.strokeStyle = i % 3 ? '#1f8f5a' : '#2fbf71'; g.lineWidth = 5; let x = Math.round(r() * 16) * 32, y = Math.round(r() * 16) * 32; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) { if (k % 2) y += (Math.round(r() * 6) - 3) * 32; else x += (Math.round(r() * 6) - 3) * 32; g.lineTo(x, y); } g.stroke(); g.fillStyle = '#e7c56a'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
}, true);
const dieTex = () => tex('chip-die', 256, 256, (g, w, h) => {
  g.fillStyle = '#9aa7b4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6f7d8c'; g.lineWidth = 3; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
  g.strokeStyle = '#3a4654'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
});
export const chip: Builder = (root) => {
  backdrop(root, ['#03100c', '#0c3324']);
  floor(root, 22, 22, tmat(tiled(boardTex(), 5, 5)));
  const glow = halo(root, 4.2, '#76f08a', 0.2, 0, 2.6, -2.2);
  // three packages, one on another: each with its row of pins
  const LV: [number, number][] = [[3.3, 0.3], [2.4, 0.74], [1.5, 1.18]];
  for (const [s, y] of LV) { box(root, s, 0.4, s, '#1c1f26', 0, y, 0); box(root, s - 0.12, 0.02, s - 0.12, '#2a2e38', 0, y + 0.205, 0); const n = Math.round(s / 0.3); for (let i = 0; i < n; i++) for (const side of [0, 1, 2, 3]) { const t = (i + 0.5) / n * s - s / 2, e = s / 2 + 0.05, px = side < 2 ? t : (side === 2 ? e : -e), pz = side < 2 ? (side ? e : -e) : t; box(root, side < 2 ? 0.1 : 0.14, 0.07, side < 2 ? 0.14 : 0.1, '#e7c56a', px, y - 0.165, pz); } }
  const dieM = new THREE.MeshBasicMaterial({map: dieTex(), color: '#ffffff'}); const die = box(root, 0.86, 0.05, 0.86, dieM, 0, 1.405, 0); die.castShadow = false;
  const pulse = rings(root, 3, '#9dff8a');
  const sparks = glints(root, [[-0.9, 2.2, 0.6], [1.0, 2.6, 0.2], [0.4, 3.3, 0.5], [-0.6, 3.5, 0.3], [1.2, 1.6, 0.9], [-1.2, 1.4, 0.8]]);
  const me = actor(root, JENSEN(0), {a: {expr: 'smile', pose: 'hips'}, b: {expr: 'grin', pose: 'wave'}}, 0, 1.43, 0, {scale: 1.0, res: 1.3, wide: true, shadow: 0});
  const conf = Array.from({length: 36}, (_, i) => soft(panel(root, 0.09, 0.05, lit(['#ffe14a', '#76f08a', '#ffffff', '#ff7a5a'][i % 4], 1.1), 0, 0, 0)));
  // the plaster: a strip with a pad, stuck across the top chip
  const aid = grp(root, 0, 1.44, 0); box(aid, 1.7, 0.035, 0.46, '#e8b98a', 0, 0, 0); box(aid, 0.56, 0.045, 0.4, '#f6dcc0', 0, 0.004, 0); for (const s of [-1, 1]) for (let i = 0; i < 6; i++) cyl(aid, 0.016, 0.002, '#c9925e', s * (0.44 + (i % 3) * 0.14), 0.019, (i < 3 ? -1 : 1) * 0.1).castShadow = false;
  return {
    light: (v) => v === 'ai' ? {...LIGHT.dark, amb: 1.25, keyI: 1.0, key: '#d8ffd8'} : {...LIGHT.show, sky: '#c8ffd8', ground: '#2a5a44', amb: 1.2},
    tick: ({f, cam, shot}) => {
      const v = shot.v, peak = v === 'peak', ai = v === 'ai', plaster = v === 'aid' || v === 'rip';
      const top = W(17) - 4, R = W(226), k = ai ? smooth(f, shot.at, shot.at + 10) : plaster ? smooth(f, R + 4, R + 16) : peak ? 0.5 : 0;
      dieM.color.set('#ffffff').lerp(new THREE.Color('#9dff8a'), k).multiplyScalar(1 + (ai ? 0.9 : 0.7) * k + (ai ? 0.25 * Math.sin(f * 0.5) : 0));
      op(glow, peak ? 0.26 : ai ? 0.12 + 0.2 * k : 0.1 + 0.2 * k);
      pulse(f, ai && f >= W(103) - 2, [0, 1.46, 0], 2.6, 0, 0.045, true); sparks(f, peak && f >= top);
      me.node.visible = peak; me.show(f >= top ? 'b' : 'a'); me.node.position.y = 1.43 + hop(f, top, 0.12, 9); me.tick(f, cam);
      conf.forEach((c, i) => { const u = frac((f - top) / 46 + hash(i, 3)); c.visible = peak && f >= top; c.position.set((hash(i) - 0.5) * 3.0 + 0.2 * Math.sin(f * 0.1 + i), 4.6 - u * 3.6, (hash(i, 2) - 0.5) * 1.6 + 0.3); c.rotation.set(f * 0.2 + i, f * 0.13 + i * 2, 0); });
      // "rip off the Band-Aid": it peels up at one end and is gone
      const rip = smooth(f, R, R + 9), fly = smooth(f, R + 6, R + 20);
      aid.visible = plaster && fly < 1; aid.rotation.set(0, 0.5, 0.9 * rip + 1.4 * fly); aid.position.set(-0.3 * rip + 2.6 * fly, 1.44 + 0.5 * rip + 2.4 * fly, 0.4 * fly);
    },
  };
};

// ------------------------------------------------------------------ office: the chair, the memo, the badge on the desk, the empty chair
const badgeTex = () => tex('office-badge', 200, 280, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.fillStyle = '#76b900'; g.fillRect(0, 0, w, 62); g.fillStyle = '#c9ced6'; g.fillRect(52, 88, 96, 96); g.fillStyle = '#8f96a8'; g.fillRect(40, 210, 120, 14); g.fillRect(60, 238, 80, 12); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
});
export const office: Builder = (root) => {
  backdrop(root, ['#aab6c4', '#dfe4ea']);
  floor(root, 14, 12, tmat(tiled(woodTex('office-floor', '#8a6a4c', '#5a4430'), 4, 4)));
  panel(root, 12, 5, tmat(tiled(grainTex('office-wall', '#dfe2e6', 0.04), 5, 3)), 0, 2.5, -2.6);
  // the window: day, a Sunday evening, night
  const views = [skylineTex('office-day', '#8fc8f0', '#e8f2f8', '#9fb0c4', '#dfe8f2', 11), skylineTex('office-dusk', '#f08a4a', '#f6d8a8', '#5a4a6a', '#ffd88a', 11), skylineTex('office-night', '#070b24', '#232a5a', '#11142c', '#ffd88a', 11)]
    .map((t, i) => { const o = soft(panel(root, 3.3, 1.9, smat(t, i === 2 ? 0.9 : 1.0), 0, 2.25, -2.56 + i * 0.002)); return o; });
  box(root, 3.5, 0.1, 0.1, '#3a3f4a', 0, 3.25, -2.52); box(root, 3.5, 0.1, 0.1, '#3a3f4a', 0, 1.25, -2.52); for (const x of [-1.72, -0.57, 0.57, 1.72]) box(root, 0.07, 2.0, 0.08, '#3a3f4a', x, 2.25, -2.52);
  plant(root, -2.3, -1.9, 1.15); box(root, 0.9, 1.1, 0.4, '#5a4430', 2.35, 0.55, -2.3); for (const [dx, c] of [[-0.25, '#76b900'], [0.05, '#e7c56a'], [0.3, '#c9ced6']] as const) { box(root, 0.14, 0.05, 0.14, '#22202a', 2.35 + dx, 1.125, -2.3); box(root, 0.1, 0.22, 0.03, c, 2.35 + dx, 1.26, -2.3); }
  // the desk, the nameplate, a laptop
  table(root, 0, -0.2, 2.3, 0.95, {h: 0.76, top: '#4a3626', leg: '#22202a', skirt: '#3a2a1e'});
  box(root, 0.5, 0.13, 0.07, '#e7c56a', -0.6, 0.825, 0.12).rotation.x = -0.25; soft(panel(root, 0.46, 0.1, smat(signTex('office-ceo', 460, 100, '#22202a', '#e7c56a', [['CEO', 84, 0.56]]), 1.0), -0.6, 0.83, 0.157)).rotation.x = -0.25;
  const lap = laptop(root, 0.1, 0.76, -0.25, {ry: Math.PI, w: 0.52, body: '#c9ced6', back: lit('#76b900', 1.0)});
  const screenGlow = halo(root, 0.9, '#bfe6ff', 0, 0.1, 1.25, -0.5);
  // the chair, and the jacket that hangs over it when nobody sits there
  const chair = grp(root, 0, 0, -1.0); cyl(chair, 0.32, 0.05, '#22202a', 0, 0.06, 0); cyl(chair, 0.04, 0.42, '#8f96a8', 0, 0.28, 0); box(chair, 0.7, 0.12, 0.62, '#a8774a', 0, 0.52, 0);
  box(chair, 0.72, 1.25, 0.14, '#b98a5a', 0, 1.2, -0.26); box(chair, 0.54, 1.05, 0.02, '#cda072', 0, 1.2, -0.185); for (const s of [-1, 1]) { box(chair, 0.08, 0.06, 0.5, '#5a4430', s * 0.4, 0.78, -0.02); box(chair, 0.06, 0.24, 0.06, '#5a4430', s * 0.4, 0.64, 0.18); }
  const jacket = grp(chair, 0, 0, 0); box(jacket, 0.8, 0.62, 0.2, '#1d1d24', 0, 1.55, -0.26); box(jacket, 0.34, 0.1, 0.24, '#34353f', 0, 1.89, -0.26);
  for (const s of [-1, 1]) { const sl = box(jacket, 0.15, 0.66, 0.17, '#1d1d24', s * 0.44, 1.26, -0.2); sl.rotation.z = s * 0.1; box(jacket, 0.16, 0.07, 0.18, '#34353f', s * 0.475, 0.95, -0.2).rotation.z = s * 0.1; box(jacket, 0.13, 0.3, 0.012, '#34353f', s * 0.11, 1.7, -0.154).rotation.z = -s * 0.5; }
  box(jacket, 0.022, 0.6, 0.012, '#aeb4c0', 0, 1.55, -0.154);
  const badge = grp(root, 0.5, 0.775, 0.08); const bc = panel(badge, 0.2, 0.28, smat(badgeTex(), 1.0), 0, 0, 0); bc.rotation.x = -Math.PI / 2; torus(badge, 0.11, 0.012, '#76b900', 0.06, 0.004, -0.2).rotation.x = Math.PI / 2;
  const spot = pool(root, 1.5, '#fff0c8', 0, 0, -0.7), cone1 = beam(root, 0.15, 1.5, 6, '#fff0c8', 0, 0, 6.2, -0.7), dim = soft(panel(root, 12, 6, glass('#05060f', 0), 0, 3, -2.5));
  const me = actor(root, JENSEN(0), {type: {expr: 'stern', pose: 'type', mode: 'sit'}, pause: {expr: 'pained', pose: 'desk', mode: 'sit'}}, 0, 0.66, -0.82, {scale: 1.0, res: 1.3, shadow: 0});
  const he = actor(root, JENSEN(0), {a: {expr: 'stern'}, b: {expr: 'pained', pose: 'point'}, c: {expr: 'nervous'}}, 1.2, 0, 0.3, {scale: 1.0, res: 1.2, wide: true});
  return {
    light: (v) => v === 'write' ? {...LIGHT.warm, amb: 1.2} : v === 'empty' ? {...LIGHT.dark, amb: 0.95, keyI: 0.8} : LIGHT.room,
    tick: ({f, cam, shot}) => {
      const v = shot.v, R = W(165), empty = v === 'empty', seat = v === 'write';
      views.forEach((o, i) => { o.visible = i === (seat ? 1 : empty ? 2 : 0); });
      jacket.visible = !seat && v !== 'leave'; chair.rotation.y = v === 'chair' ? -0.5 + 0.45 * smooth(f, shot.at, shot.at + 40) : empty ? 0.25 * Math.sin((f - shot.at) * 0.02) : v === 'leave' ? -0.6 : 0;
      me.node.visible = seat; me.show(f >= W(134) ? 'pause' : 'type'); me.tick(f, cam);
      lap.g.visible = seat || v === 'leave'; op(screenGlow, seat ? 0.2 + 0.04 * Math.sin(f * 0.4) : 0);
      // he lays his badge on the desk
      he.node.visible = v === 'leave'; he.show(f >= R + 12 ? 'c' : f >= R - 2 ? 'b' : 'a'); he.tick(f, cam);
      const k = v === 'leave' ? smooth(f, R - 2, R + 8) : 1;
      badge.visible = v !== 'write' && (v !== 'leave' || f >= R - 2); badge.position.set(lerp(0.95, 0.5, k), lerp(1.15, 0.775, k) + 0.25 * Math.sin(Math.PI * k), lerp(0.3, 0.08, k)); badge.rotation.y = 0.3 + (1 - k) * 2;
      // the light over the chair goes down while the last note rings (not to black: the question stays up)
      const down = empty ? smooth(f, TOTAL - 54, TOTAL - 6) : 0;
      op(spot, empty ? lerp(0.34, 0.12, down) : 0); op(cone1, empty ? lerp(0.035, 0.008, down) : 0); op(dim, empty ? lerp(0.45, 0.62, down) : 0);
    },
  };
};
