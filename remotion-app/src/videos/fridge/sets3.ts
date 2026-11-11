// Sets of the fridge hack short, part 3: the showroom, the furniture store, the blood service, the pin board, the
// investigators' desk.
import * as THREE from 'three';
import {backdrop, ball, beam, box, clamp01, cone, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus, woodTex,
  type G2, type Node} from './kit';
import {actor, INVESTIGATOR, LABTECH, SHOPPER} from './cast';
import {cloud3d, controller, cursor3d, fridge3d, signTex, statusTex, tempTex} from './props';
import {freezerIcon, LIGHT, puffs, spill, type Builder} from './sets';
import {W} from './story';

const glyph = (s: string, c: string) => smat(tex('glyph3-' + s + c, 128, 160, (g, w, h) => { g.clearRect(0, 0, w, h); text(g, s, w / 2, h / 2 + 6, 150, c, {stroke: '#15121c', sw: 16}); }), 1.15, true);

// ------------------------------------------------------------------ the showroom: the panel new, the panel as found, and one fridge
export const showroom: Builder = (root) => {
  backdrop(root, ['#0a0d14', '#1a2030']);
  floor(root, 14, 12, tmat(tiled(grainTex('show', '#262b34', 0.1), 5, 4)));
  const stand = grp(root); cyl(stand, 0.6, 0.9, '#3a4050', 0, 0.45, 0, 0.54); cyl(stand, 0.66, 0.06, '#c9a94f', 0, 0.93, 0);
  for (const s of [-1, 1]) { cyl(stand, 0.05, 0.8, '#c9a94f', s * 1.12, 0.4, 0.75); ball(stand, 0.075, '#c9a94f', s * 1.12, 0.84, 0.75); }
  for (let i = 0; i < 10; i++) { const u = i / 10, u1 = (i + 1) / 10, y = (q: number) => 0.76 - 0.5 * q * (1 - q); rod(stand, [-1.12 + 2.24 * u, y(u), 0.75], [-1.12 + 2.24 * u1, y(u1), 0.75], 0.028, '#b8323a'); }
  const fresh = controller(stand, 0, 1.62, 0, 1.04), old = controller(stand, 0, 1.62, 0, 1.04, '#d6cba2');
  fresh.g.rotation.x = old.g.rotation.x = -0.08; old.g.rotation.z = -0.05;
  old.status.map = statusTex('UPDATE NEEDED', '#ffb03a');
  // as found: cobwebs, dust, a floppy disk, a note nobody read
  const dusty = grp(stand);
  // a cobweb in the corner: spokes from one point, sagging threads between them
  const web = (key: string, n: number, rings: number) => smat(tex('web-' + key, 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256); g.strokeStyle = 'rgba(240,246,252,.95)'; g.lineWidth = 2.6; g.lineCap = 'round';
    const at = (k: number, q: number): [number, number] => { const a = (k / (n - 1)) * Math.PI / 2; return [6 + q * 240 * Math.cos(a), 6 + q * 240 * Math.sin(a)]; };
    for (let k = 0; k < n; k++) { g.beginPath(); g.moveTo(6, 6); g.lineTo(...at(k, 1)); g.stroke(); }
    g.lineWidth = 2;
    for (let q = 1; q <= rings; q++) for (let k = 0; k < n - 1; k++) { const [x0, y0] = at(k, q / rings), [x1, y1] = at(k + 1, q / rings), [mx, my] = at(k + 0.5, q / rings * 0.9); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke(); }
  }), 1.1, true);
  soft(panel(old.g, 0.62, 0.62, web('a', 6, 5), -0.34, 0.19, 0.086));                                               // across the top-left corner of the panel
  soft(panel(old.g, 0.44, 0.44, web('b', 5, 4), 0.43, -0.28, 0.086)).rotation.z = Math.PI;                         // and the bottom-right one
  const spider = grp(dusty, 0.82, 2.0, 0.12); ball(spider, 0.05, '#15121c', 0, 0, 0); for (let i = 0; i < 4; i++) for (const s of [-1, 1]) rod(spider, [0, 0, 0], [s * 0.1, -0.03 + i * 0.03 - 0.04, 0], 0.006, '#15121c');
  const thread = soft(rod(dusty, [0.82, 2.9, 0.12], [0.82, 2.0, 0.12], 0.004, lit('#e6ecf2', 1.1)));
  const floppy = panel(dusty, 0.4, 0.4, smat(tex('floppy', 200, 200, (g, w, h) => {                                  // the last update, on a floppy disk
    g.fillStyle = '#2f5fa8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#c9d2d8'; g.fillRect(52, 8, 96, 62); g.strokeRect(52, 8, 96, 62); g.fillStyle = '#2f5fa8'; g.fillRect(112, 18, 22, 42);
    g.fillStyle = '#fffdf4'; g.fillRect(30, 96, 140, 96); g.lineWidth = 6; g.strokeRect(30, 96, 140, 96); text(g, 'v1.0', w / 2, 146, 54, '#15121c');
  }), 1.02), -0.44, 1.14, 0.42); floppy.rotation.set(-0.28, 0, 0.12);
  const note = panel(dusty, 0.42, 0.42, smat(signTex('sticky', 210, 210, '#ffe14a', '#15121c', [['UPDATE', 60, 0.36], ['ME', 70, 0.7]]), 1.05), 0.53, 1.98, 0.1); note.rotation.z = -0.14;
  const dust = puffs(dusty, 8, '#cfc6a8', 0.3);
  const glints = [[-0.8, 2.1], [0.82, 1.3], [0.6, 2.3]].map(([x, y]) => soft(panel(stand, 0.3, 0.3, smat(tex('glint', 96, 96, (g) => { g.clearRect(0, 0, 96, 96); g.fillStyle = '#fff6c2'; g.beginPath(); g.moveTo(48, 2); g.lineTo(57, 39); g.lineTo(94, 48); g.lineTo(57, 57); g.lineTo(48, 94); g.lineTo(39, 57); g.lineTo(2, 48); g.lineTo(39, 39); g.closePath(); g.fill(); }), 1.6, true), x, y, 0.2)));
  beam(root, 0.16, 1.25, 4.2, '#fff6d0', 0.14, 0, 4.4, 0); pool(root, 1.3, '#fff2c0', 0.4, 0, 0.1);
  // the last word: one fridge, one thermometer that cannot make up its mind
  const solo = grp(root); const fr = fridge3d(solo, -0.28, 0, 1.16);
  const th = grp(solo, 0.72, 0, 0.1); cyl(th, 0.03, 0.95, '#8f9aa6', 0, 0.475, 0); cyl(th, 0.2, 0.05, '#8f9aa6', 0, 0.025, 0);
  box(th, 0.3, 1.12, 0.06, '#fffdf4', 0, 1.5, 0); ball(th, 0.12, lit('#e3342f', 1.2), 0, 1.08, 0.03); for (let i = 0; i < 7; i++) box(th, i % 2 ? 0.07 : 0.12, 0.014, 0.01, '#15121c', -0.06, 1.26 + i * 0.11, 0.034);
  const col = box(th, 0.07, 1, 0.02, lit('#e3342f', 1.2), 0.05, 0, 0.035);
  const pud = spill(solo, '#bfe6ff', 6); pud.position.set(-0.2, 0.012, 0.75); pud.scale.setScalar(0.6);
  const drops = [0, 1, 2].map(() => soft(ball(solo, 0.03, lit('#bfe6ff', 1.2))));
  return {
    light: (v) => v === 'old' ? {...LIGHT.warm, amb: 0.95} : {...LIGHT.show, amb: 1.05},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v;
      stand.visible = v !== 'fridge'; solo.visible = v === 'fridge';
      fresh.g.visible = v === 'new'; old.g.visible = v === 'old'; dusty.visible = v === 'old';
      fresh.g.position.y = 1.62 + hop(f, W(97), 0.1, 9); old.g.position.y = 1.62;
      glints.forEach((gl, i) => { gl.visible = v === 'new'; gl.quaternion.copy(cam.quaternion); gl.scale.setScalar(Math.max(0.001, Math.abs(Math.sin(f * 0.14 + i * 2.1)))); });
      spider.position.y = 2.0 + 0.1 * Math.sin(f * 0.12); thread.scale.y = 1 - 0.11 * Math.sin(f * 0.12); thread.position.y = 2.45 + 0.05 * Math.sin(f * 0.12);
      dust.set(f, v === 'old' ? 1 : 0, 0, 1.2, 0.3, {spread: 0.8, rise: 0.9, r0: 0.03, r1: 0.1, speed: 0.008});
      old.g.rotation.z = -0.05 + shake(f, W(106), 0.03, 12);
      const lvl = 0.5 + 0.42 * Math.sin(f * 0.33) * Math.sin(f * 0.071 + 1); col.scale.y = 0.12 + 0.74 * lvl; col.position.y = 1.14 + col.scale.y / 2;
      fr.rotation.z = 0.02 * Math.sin(f * 0.2); drops.forEach((d, i) => { const u = (f * 0.03 + i / 3) % 1; d.position.set(-0.5 + i * 0.2, 1.2 - 1.15 * u * u, 0.48); });
    },
  };
};

// ------------------------------------------------------------------ a furniture store in Belgium, and its meatballs
const swedishFlag = () => tex('flag-se', 160, 100, (g, w, h) => { g.fillStyle = '#1f5fb8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd43b'; g.fillRect(50, 0, 20, h); g.fillRect(0, 40, w, 20); });
export const ikea: Builder = (root) => {
  backdrop(root, ['#5aa8f0', '#bfe0ff', '#fff0d0']);
  floor(root, 40, 30, tmat(tiled(grainTex('carpark', '#4a505a', 0.1), 10, 8)));
  const out = grp(root);
  box(out, 8.4, 2.6, 3, '#1f5fb8', 0, 1.3, -4.0); box(out, 8.5, 0.34, 3.05, '#ffd43b', 0, 2.34, -4.0);
  box(out, 2.2, 1.9, 0.5, '#ffd43b', -0.7, 0.95, -2.4); panel(out, 1.5, 1.5, lit('#bfe6ff', 1.0), -0.7, 0.8, -2.14); box(out, 0.05, 1.5, 0.05, '#1f5fb8', -0.7, 0.8, -2.13);
  for (const x of [1.3, 1.9, 2.5]) { cyl(out, 0.03, 2.5, '#e6e9ec', x, 1.25, -1.8); const fl = panel(out, 0.62, 0.4, tmat(swedishFlag()), x + 0.33, 2.24, -1.8); (fl.material as THREE.Material).side = THREE.DoubleSide; fl.userData = {x}; }
  for (const x of [-3, -1, 1, 3]) box(out, 0.08, 0.006, 2.4, lit('#e9edf0', 0.8), x, 0.004, 1.6);
  const flags = out.children.filter((c) => c.userData.x !== undefined) as THREE.Mesh[];
  cloud3d(out, -1.6, 4.3, -6, 1.5); cloud3d(out, 1.9, 3.7, -6, 1.1);
  const cart = grp(out); box(cart, 1.3, 0.06, 0.6, '#ffd43b', 0, 0.2, 0); for (const x of [-0.5, 0.5]) for (const z of [-0.24, 0.24]) cyl(cart, 0.07, 0.05, '#15121c', x, 0.07, z).rotation.x = Math.PI / 2; rod(cart, [-0.62, 0.2, 0], [-0.74, 1.0, 0], 0.025, '#8f9aa6');
  box(cart, 1.2, 0.14, 0.5, '#c79a62', 0, 0.3, 0); box(cart, 1.1, 0.12, 0.44, '#b88a52', 0.02, 0.43, 0);
  const shopper = actor(out, SHOPPER(2), {a: {expr: 'smile', pose: 'both'}}, 0, 0, 0, {scale: 0.98});
  const cur = cursor3d(out, 0.5);
  // the plate nobody is talking about
  const inn = grp(root); soft(panel(inn, 30, 12, new THREE.MeshBasicMaterial({color: '#141a28'}), 0, 3, -1.4));
  floor(inn, 14, 6, '#20283a', 0.003, 0, 0.5);
  cyl(inn, 0.1, 0.86, '#c9a94f', 0, 0.43, 0); cyl(inn, 0.5, 0.05, '#fffdf4', 0, 0.9, 0); cyl(inn, 0.34, 0.04, '#c9a94f', 0, 0.02, 0);
  cyl(inn, 0.38, 0.03, '#f4f6f8', 0, 0.94, 0); cyl(inn, 0.3, 0.012, '#e3e7ea', 0, 0.957, 0);
  const balls = [[-0.1, 0, 0.06], [0.06, 0, 0.1], [0.14, 0, -0.04], [-0.02, 0, -0.08], [-0.16, 0, -0.06], [0.0, 0.1, 0.02], [0.1, 0.1, 0.02], [-0.08, 0.1, -0.02]].map(([x, y, z]) => ball(inn, 0.068, '#8a5a34', x, 1.02 + y, z));
  ball(inn, 0.11, '#fff3d6', -0.2, 0.99, 0.12).scale.set(1.2, 0.5, 1); for (let i = 0; i < 6; i++) ball(inn, 0.02, '#c8202f', 0.2 + (i % 3) * 0.035, 0.975, 0.14 + Math.floor(i / 3) * 0.035);
  rod(inn, [0.02, 1.1, 0.02], [0.05, 1.42, 0.02], 0.006, '#c9a94f'); const pick = panel(inn, 0.16, 0.1, tmat(swedishFlag()), 0.13, 1.37, 0.02); (pick.material as THREE.Material).side = THREE.DoubleSide;
  const dome = soft(mesh(inn, new THREE.SphereGeometry(0.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({color: '#dff4ff', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide}), 0, 0.96, 0));
  ball(inn, 0.035, '#c9a94f', 0, 1.385, 0);
  const qs = [[-0.62, 1.55], [0.6, 1.72], [0.02, 1.9]].map(([x, y]) => soft(panel(inn, 0.4, 0.5, glyph('?', '#ffe14a'), x, y, 0.1)));
  beam(inn, 0.1, 0.7, 2.6, '#fff6d0', 0.16, 0, 3.4, 0); pool(inn, 0.9, '#fff2c0', 0.45, 0, 0.1);
  return {
    light: (v) => v === 'meatballs' ? {...LIGHT.show, amb: 1.05} : {...LIGHT.day, amb: 1.6},
    tick: ({f, t, cam, shot}) => {
      const m = shot.v === 'meatballs'; out.visible = !m; inn.visible = m;
      flags.forEach((fl, i) => { fl.rotation.y = 0.25 * Math.sin(f * 0.2 + i); });
      const x = lerp(-1.12, -0.5, clamp01(t / 30)); cart.position.set(x + 0.9, 0, 0.6); shopper.node.position.set(x, 0.03 * Math.abs(Math.sin(f * 0.5)), 0.6); shopper.tick(f, cam);
      const k = smooth(t, 0, 12); cur.position.set(lerp(2.6, 0.9, k), lerp(4.2, 2.5, k) - hop(f, W(122), 0.2, 8), -2.0); cur.rotation.z = 0.2;
      qs.forEach((q, i) => { q.scale.setScalar(pop(f, W(123) + i * 4, 8) || 0.001); q.position.y = [1.55, 1.72, 1.9][i] + 0.04 * Math.sin(f * 0.16 + i * 2); q.rotation.z = (i - 1) * 0.18; });
      balls.forEach((b, i) => { b.position.y = 1.02 + (i > 4 ? 0.1 : 0) + (i === 6 ? hop(f, W(127), 0.06, 8) : 0); });
      dome.rotation.y = f * 0.01;
    },
  };
};

// ------------------------------------------------------------------ France's blood service: the freezers that mattered most
/** Readout of a medical freezer. No figures: the reports give none for the blood service, so the film shows only "cold" and "warming". */
const readout = (kind: 'ok' | 'warn' | 'alert') => tex('readout-' + kind, 256, 104, (g, w, h) => {
  g.fillStyle = '#06131c'; g.fillRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'ok') {
    g.strokeStyle = '#7fe3ff'; g.lineWidth = 8; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(64 - 30 * Math.cos(a), 52 - 30 * Math.sin(a)); g.lineTo(64 + 30 * Math.cos(a), 52 + 30 * Math.sin(a)); g.stroke(); }
    text(g, 'OK', 170, 56, 78, '#7fe3ff');
  } else {
    const c = kind === 'alert' ? '#ff5a3c' : '#ffb03a';
    g.fillStyle = c; g.beginPath(); g.moveTo(64, 14); g.lineTo(106, 88); g.lineTo(22, 88); g.closePath(); g.fill(); text(g, '!', 64, 60, 58, '#06131c');
    g.strokeStyle = c; g.lineWidth = 13; for (const x of [150, 206]) { g.beginPath(); g.moveTo(x, 88); g.lineTo(x, 26); g.moveTo(x - 20, 46); g.lineTo(x, 22); g.lineTo(x + 20, 46); g.stroke(); }   // warming: two arrows up
  }
});
function medFreezer(p: Node, x: number, z: number) {
  const g = grp(p, x, 0, z), w = 1.0, h = 2.08, d = 0.7, bh = 0.56, top = h - 0.28, ih = top - bh;
  box(g, w, bh, d, '#8f9aa6', 0, bh / 2, 0); box(g, w, ih, 0.06, '#dfe6ec', 0, bh + ih / 2, -d / 2 + 0.03); for (const s of [-1, 1]) box(g, 0.06, ih, d, '#dfe6ec', s * (w / 2 - 0.03), bh + ih / 2, 0);
  box(g, w, 0.28, d, '#aab6c0', 0, h - 0.14, 0);
  const display = new THREE.MeshBasicMaterial({map: readout('ok')}), inner = lamp('#eaf6ff', 1.1);
  panel(g, 0.44, 0.18, display, 0, h - 0.14, d / 2 + 0.006); panel(g, w - 0.12, ih - 0.02, inner, 0, bh + ih / 2, -d / 2 + 0.065);
  const bags: THREE.Object3D[] = [];
  for (let k = 0; k < 3; k++) {
    const y = bh + 0.06 + k * ih / 3; box(g, w - 0.13, 0.025, d - 0.2, '#c9d2d8', 0, y, -0.02);
    for (let i = 0; i < 4; i++) { const b = grp(g, -0.3 + i * 0.2, y + 0.16, 0.06); box(b, 0.15, 0.24, 0.045, '#c8202f', 0, 0, 0); box(b, 0.1, 0.09, 0.006, '#fffdf4', 0, 0.02, 0.026); box(b, 0.03, 0.05, 0.03, '#e6e9ec', 0, 0.14, 0); bags.push(b); }
  }
  const fr = '#8f9aa6', gy = bh + ih / 2;
  box(g, w - 0.06, 0.05, 0.05, fr, 0, bh + 0.025, d / 2); box(g, w - 0.06, 0.05, 0.05, fr, 0, top - 0.025, d / 2); for (const s of [-1, 1]) box(g, 0.05, ih, 0.05, fr, s * (w / 2 - 0.055), gy, d / 2);
  box(g, 0.045, 0.5, 0.06, '#5a6470', w / 2 - 0.2, gy, d / 2 + 0.05);
  soft(panel(g, w - 0.14, ih - 0.08, new THREE.MeshBasicMaterial({color: '#e6f7ff', transparent: true, opacity: 0.12, depthWrite: false}), 0, gy, d / 2));
  return {g, display, inner, bags};
}
export const lab: Builder = (root) => {
  backdrop(root, ['#dfeaf2', '#f4f8fb']);
  floor(root, 14, 12, tmat(tiled(tileTex('lab', '#eef3f6', '#c9d6de', 2, '#e3ebf0'), 7, 6)));
  box(root, 9, 5.4, 0.3, tmat(tiled(tileTex('labwall', '#f4f8fb', '#cfdbe3', 4), 8, 5)), 0, 2.7, -1.3);
  box(root, 9, 0.5, 0.32, '#3f8fa0', 0, 0.25, -1.29);
  const mf = [-0.74, 0.74].map((x) => medFreezer(root, x, -0.62));
  const beacon = soft(ball(root, 0.11, lamp('#ff2a2a', 2), 0, 2.2, -1.1)); cyl(root, 0.13, 0.05, '#3a4250', 0, 2.08, -1.1);
  const wash = pool(root, 3.2, '#ff3a2a', 0, 0, 0.4);
  const tick2 = soft(panel(root, 0.5, 0.5, smat(tex('tick', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.fillStyle = '#2fbf71'; g.strokeStyle = '#15121c'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(38, 66); g.lineTo(58, 86); g.lineTo(92, 44); g.stroke(); }), 1.1, true), 0.74, 1.3, 0.3));
  const techA = actor(root, LABTECH, {run: {expr: 'shock', pose: 'panic'}, carry: {expr: 'nervous', pose: 'both', prop: 'crate'}, phew: {expr: 'relief', pose: 'both', prop: 'crate'}}, 0, 0, 0.55, {scale: 1.0});
  return {
    light: () => ({...LIGHT.cold, amb: 1.7}),
    tick: ({f, t, cam, shot}) => {
      const alarm = shot.v === 'alarm', rise = alarm ? smooth(t, 4, 60) : 0.75;
      mf[0].display.map = !alarm ? readout('warn') : t < 4 ? readout('ok') : readout(Math.floor(f / 6) % 2 ? 'warn' : 'alert'); mf[0].inner.color.set('#eaf6ff').lerp(new THREE.Color('#ffb08a'), rise).multiplyScalar(1.1);
      mf[1].display.map = readout('ok');
      const glow = alarm ? 0.5 + 0.5 * Math.sin(f * 0.6) : 0;                                           // the beacon turns: it swells and fades, it does not switch
      (beacon.material as THREE.MeshBasicMaterial).color.set('#ff2a2a').multiplyScalar(alarm ? 0.5 + 2.5 * glow : 0.25); (wash.material as THREE.MeshBasicMaterial).opacity = 0.2 * glow;
      mf[0].bags.forEach((b, i) => { b.visible = alarm || i % 4 > 1 && i < 8; });
      tick2.visible = !alarm && f >= W(141); tick2.scale.setScalar(pop(f, W(141), 8) || 0.001); tick2.quaternion.copy(cam.quaternion);
      if (alarm) { techA.show('run'); techA.node.position.set(lerp(1.9, 0.25, smooth(f, W(132), W(134) + 6)), 0.04 * Math.abs(Math.sin(f * 0.7)), 0.6); }
      else { techA.show(f >= W(141) ? 'phew' : 'carry'); techA.node.position.set(lerp(-0.62, 0.3, smooth(t, 0, 22)), 0.035 * Math.abs(Math.sin(f * 0.6)) * (f < W(141) ? 1 : 0), 0.6); }
      techA.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the pin board: three attacks, no string between them yet
const noteTex = (key: string, bg: string, lines: [string, number, string?][], icon?: (g: G2, w: number, h: number) => void) => tex('note-' + key, 300, 330, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  lines.forEach(([s, size, c], i) => text(g, s, w / 2, 52 + i * 62, size, c ?? '#15121c', {maxWidth: w - 30}));
  icon?.(g, w, h);
});
const drop = (g: G2, x: number, y: number, s: number) => { g.beginPath(); g.moveTo(x, y - s); g.bezierCurveTo(x + s * 0.9, y - s * 0.1, x + s * 0.8, y + s * 0.8, x, y + s * 0.8); g.bezierCurveTo(x - s * 0.8, y + s * 0.8, x - s * 0.9, y - s * 0.1, x, y - s); g.fillStyle = '#c8202f'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#15121c'; g.stroke(); };
export const board: Builder = (root) => {
  backdrop(root, ['#141820', '#232a36']);
  floor(root, 14, 12, '#2f3542');
  box(root, 9, 5.4, 0.3, '#3a4458', 0, 2.7, -0.75);
  box(root, 2.66, 1.96, 0.08, '#6b4a2d', 0, 1.44, -0.56); panel(root, 2.5, 1.8, tmat(tiled(grainTex('cork', '#c79a62', 0.2, 14000), 3, 2)), 0, 1.44, -0.515);
  const pin = (x: number, y: number) => ball(root, 0.035, '#e3342f', x, y, -0.44);
  const A: [number, number] = [-0.68, 1.42], B: [number, number] = [0.66, 1.92], C: [number, number] = [0.66, 0.96];
  const nA = panel(root, 0.86, 0.95, smat(noteTex('oct', '#ffe14a', [['OCT 11–12', 54], ['FRANCE', 62], ['ABOUT 700 STORES', 30]], (g, w, h) => freezerIcon(g, w / 2, 262, 100, true)), 1.04), A[0], A[1], -0.5); nA.rotation.z = 0.04;
  const nB = panel(root, 0.8, 0.7, smat(tex('note-nov', 300, 262, (g, w, h) => { g.fillStyle = '#bfe9ff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); text(g, 'NOV 2', w / 2, 56, 58, '#15121c'); text(g, 'EUROPE', w / 2, 126, 62, '#15121c'); text(g, '100+ STORES', w / 2, 200, 38, '#15121c', {maxWidth: w - 30}); }), 1.04), B[0], B[1], -0.5); nB.rotation.z = -0.05;
  const nC = panel(root, 0.8, 0.7, smat(tex('note-blood', 300, 262, (g, w, h) => { g.fillStyle = '#ffd0d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); text(g, 'NOV 2', w / 2, 56, 58, '#15121c'); text(g, 'BLOOD SERVICE', w / 2, 124, 44, '#15121c', {maxWidth: w - 96}); drop(g, w / 2, 204, 34); }), 1.04), C[0], C[1], -0.5); nC.rotation.z = 0.04;
  pin(A[0], A[1] + 0.4); pin(B[0], B[1] + 0.28); pin(C[0], C[1] + 0.28);
  // a red string from each November note toward October, cut in the middle by a question mark
  const tags = [B, C].map((P, i) => {
    const a: [number, number] = [A[0] + 0.36, A[1] + (i ? -0.2 : 0.2)], b: [number, number] = [P[0] - 0.38, P[1] + (i ? 0.12 : -0.12)], m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const [p0, p1] of [[a, [lerp(a[0], m[0], 0.62), lerp(a[1], m[1], 0.62)]], [[lerp(b[0], m[0], 0.62), lerp(b[1], m[1], 0.62)], b]] as [number, number][][]) rod(root, [p0[0], p0[1], -0.47], [p1[0], p1[1], -0.47], 0.012, '#e3342f');
    const tg = grp(root, m[0], m[1], -0.42); cyl(tg, 0.17, 0.03, '#fffdf4', 0, 0, 0).rotation.x = Math.PI / 2; soft(panel(tg, 0.3, 0.38, glyph('?', '#e3342f'), 0, 0, 0.03));
    return tg;
  });
  const lens = grp(root); torus(lens, 0.26, 0.035, '#3a3f4a', 0, 0, 0); soft(mesh(lens, new THREE.CircleGeometry(0.24, 28), new THREE.MeshBasicMaterial({color: '#cdeeff', transparent: true, opacity: 0.22, depthWrite: false}), 0, 0, 0)); rod(lens, [0.19, -0.19, 0], [0.5, -0.52, 0], 0.04, '#6b4a2d');
  return {
    light: () => ({...LIGHT.room, amb: 1.35}),
    tick: ({f, t}) => {
      tags.forEach((tg, i) => { tg.scale.setScalar(pop(f, W(145) + i * 6, 8) || 0.001); tg.rotation.z = shake(f, W(145) + i * 6, 0.3, 12); });
      const u = smooth(f, W(146), W(148) + 6), a = tags[0].position, b = tags[1].position;
      lens.position.set(lerp(a.x, b.x, u) + 0.05 * Math.sin(f * 0.2), lerp(a.y, b.y, u) + 0.03 * Math.sin(f * 0.27), -0.2); lens.visible = t > 2;
    },
  };
};

// ------------------------------------------------------------------ the investigators' desk: what France shows, what it keeps, what it wants
const cardTex = (key: string, title: string, draw: (g: G2, w: number, h: number) => void, band = '#e3342f', label = 'EVIDENCE') => tex('card-' + key, 400, 460, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.fillStyle = band; g.fillRect(0, 0, w, 58); text(g, label, w / 2, 31, 36, '#ffffff', {spacing: 6});
  g.strokeStyle = '#15121c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  draw(g, w, h); text(g, title, w / 2, h - 52, 58, '#15121c', {maxWidth: w - 40});
});
const stars = (g: G2, x: number, y: number, r: number, s: number) => { for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, cx = x + r * Math.cos(a), cy = y + r * Math.sin(a); g.beginPath(); for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * 0.42 : s; g.lineTo(cx + q * Math.cos(b), cy + q * Math.sin(b)); } g.closePath(); g.fillStyle = '#ffd43b'; g.fill(); } };
export const desk: Builder = (root) => {
  backdrop(root, ['#12161e', '#222a38']);
  floor(root, 14, 12, tmat(tiled(woodTex('office', '#4a3a30', '#2a1c14'), 5, 4)));
  box(root, 9, 5.4, 0.3, '#34425c', 0, 2.7, -1.45); box(root, 9, 1.5, 0.34, '#4a3628', 0, 0.75, -1.44); box(root, 9, 0.07, 0.38, '#6a4a36', 0, 1.52, -1.43);   // wall, panelling, rail
  // a window with the blinds down (the street lamp outside draws the slats) and a wall clock
  const win = grp(root, 0.8, 2.5, -1.28); box(win, 1.12, 1.1, 0.06, '#2a2218', 0, 0, 0); panel(win, 1.0, 0.98, lit('#16224a', 1), 0, 0, 0.035);
  for (let i = 0; i < 9; i++) soft(box(win, 1.0, 0.05, 0.02, lit('#ffd9a0', 0.92), 0, 0.42 - i * 0.105, 0.05));
  const clock = grp(root, -0.88, 2.56, -1.28); cyl(clock, 0.3, 0.05, '#2a2218', 0, 0, 0).rotation.x = Math.PI / 2; cyl(clock, 0.26, 0.052, '#fffdf4', 0, 0, 0.006).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; box(clock, 0.016, i % 3 ? 0.03 : 0.055, 0.01, '#15121c', 0.215 * Math.sin(a), 0.215 * Math.cos(a), 0.036).rotation.z = -a; }
  const hands = [box(clock, 0.022, 0.19, 0.012, '#15121c', 0, 0, 0.042), box(clock, 0.03, 0.13, 0.012, '#15121c', 0, 0, 0.046)]; hands.forEach((hd) => hd.geometry.translate(0, hd === hands[0] ? 0.085 : 0.055, 0));
  cyl(clock, 0.025, 0.02, '#e3342f', 0, 0, 0.05).rotation.x = Math.PI / 2;
  box(root, 3.4, 0.08, 1.2, tmat(tiled(woodTex('desk', '#6a4a36', '#3a2618'), 2, 1)), 0, 0.86, -0.5); box(root, 3.3, 0.8, 0.06, '#4a3426', 0, 0.42, 0.06);
  panel(root, 2.9, 0.9, lit('#2f6a52', 0.9), 0, 0.905, -0.5).rotation.x = -Math.PI / 2;
  // a banker's lamp at the back
  beam(root, 0.05, 0.26, 0.34, '#fff0c0', 0.2, -0.98, 1.24, -0.96);
  const bl = grp(root, -1.08, 0.9, -0.96); cyl(bl, 0.14, 0.03, '#c9a94f', 0, 0.015, 0); cyl(bl, 0.02, 0.36, '#c9a94f', 0, 0.2, 0); box(bl, 0.46, 0.14, 0.2, '#2f8a55', 0.1, 0.42, 0); box(bl, 0.4, 0.02, 0.16, lit('#fff0b0', 2), 0.1, 0.345, 0);
  pool(root, 1.5, '#fff0c0', 0.3, -0.5, -0.45, 0.92);
  const card = (t: THREE.Texture, w = 0.98, h = 1.12) => { const g = grp(root, 0, 0.92, -0.62); box(g, w + 0.04, h + 0.04, 0.03, '#15121c', 0, h / 2, -0.02); panel(g, w, h, smat(t, 1.04), 0, h / 2, 0); g.rotation.x = -0.1; return g; };
  const method = card(cardTex('method', 'THE METHOD', (g, w) => { g.strokeStyle = '#15121c'; g.lineWidth = 9; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(w / 2, 232, 22 + i * 17, 28 + i * 21, 0, Math.PI * (1.05 + (i % 3) * 0.06), Math.PI * (1.95 - (i % 2) * 0.1)); g.stroke(); } for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w / 2, 250, 20 + i * 22, 14 + i * 16, 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); } }));
  const farsi = card(cardTex('farsi', 'TRACES OF FARSI', (g, w) => { g.fillStyle = '#0f1a24'; g.fillRect(50, 96, w - 100, 250); const r = rng(14); for (let i = 0; i < 9; i++) { const hot = i === 3 || i === 6; g.fillStyle = hot ? '#ffe14a' : '#3f8fa8'; g.fillRect(70 + (i % 3) * 16, 116 + i * 25, hot ? 190 : 90 + r() * 150, hot ? 16 : 9); } }));
  const ip = card(cardTex('ip', 'IP ADDRESSES', (g, w) => { g.strokeStyle = '#2f6fc0'; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, 210, 96, 0, 7); g.stroke(); g.beginPath(); g.ellipse(w / 2, 210, 42, 96, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 96, 210); g.lineTo(w / 2 + 96, 210); g.stroke();
    g.fillStyle = '#e3342f'; g.strokeStyle = '#15121c'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2 + 34, 176, 24, Math.PI, 0); g.lineTo(w / 2 + 34, 232); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fffdf4'; g.beginPath(); g.arc(w / 2 + 34, 176, 9, 0, 7); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = '#15121c'; g.fillRect(74 + i * 66, 330, 50, 22); } }));
  // what stays shut: a safe
  const safe = grp(root, 0, 0.9, -0.6); box(safe, 1.24, 1.22, 0.7, '#5a6474', 0, 0.61, 0); box(safe, 1.06, 1.02, 0.04, '#6e7a8c', 0, 0.61, 0.36); torus(safe, 0.2, 0.035, '#c9d2d8', -0.16, 0.56, 0.4); cyl(safe, 0.13, 0.05, '#2b2d38', -0.16, 0.56, 0.41).rotation.x = Math.PI / 2;
  const dial = box(safe, 0.03, 0.2, 0.02, '#e6e9ec', -0.16, 0.56, 0.45); box(safe, 0.08, 0.34, 0.06, '#c9d2d8', 0.32, 0.56, 0.41);
  panel(safe, 0.86, 0.26, smat(signTex('howweknow', 430, 130, '#ffe14a', '#15121c', [['HOW WE KNOW', 74]], {border: '#15121c'}), 1.05), 0, 0.98, 0.385);
  const sq = [[-0.87, 1.6], [0.88, 1.78]].map(([x, y]) => soft(panel(root, 0.4, 0.5, glyph('?', '#ffe14a'), x, y, -0.2)));
  // what France wants: a warrant, and a folder for Brussels
  const warrant = card(tex('warrant', 400, 500, (g, w, h) => {
    g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    text(g, 'ARREST WARRANT', w / 2, 62, 50, '#15121c', {maxWidth: w - 40}); g.fillStyle = '#15121c'; g.fillRect(40, 96, w - 80, 6);
    text(g, 'NAME', 46, 150, 26, '#6b7280', {font: 'Montserrat', align: 'left'}); g.fillRect(140, 136, 210, 28);
    for (let i = 0; i < 5; i++) { g.fillStyle = '#c9c4b8'; g.fillRect(46, 200 + i * 34, i === 4 ? 180 : w - 92, 10); }
    text(g, 'INTERNATIONAL', w / 2, 420, 34, '#2f5fa8', {spacing: 4});
  }), 0.98, 1.22);
  const stamp = soft(panel(warrant, 0.86, 0.34, smat(tex('requested', 430, 170, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#e3342f'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20); text(g, 'REQUESTED', w / 2, h / 2 + 4, 84, '#e3342f', {maxWidth: w - 50}); }), 1.1, true), 0.04, 0.5, 0.02)); stamp.rotation.z = -0.2;
  const folder = card(tex('eu-folder', 400, 500, (g, w, h) => {
    g.fillStyle = '#1f4fa8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    stars(g, w / 2, 190, 98, 17); g.fillStyle = '#fffdf4'; g.fillRect(50, 340, w - 100, 96); g.strokeStyle = '#15121c'; g.lineWidth = 6; g.strokeRect(50, 340, w - 100, 96); text(g, 'SANCTIONS', w / 2, 390, 60, '#15121c', {maxWidth: w - 130});
  }), 0.98, 1.22);
  const proposed = soft(panel(folder, 0.8, 0.3, smat(tex('proposed', 400, 150, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffe14a'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20); text(g, 'SOUGHT', w / 2, h / 2 + 4, 84, '#ffe14a', {maxWidth: w - 50}); }), 1.15, true), 0.02, 0.62, 0.02)); proposed.rotation.z = 0.16;
  // the advice: two notices
  const plugIcon = (g: G2, x: number, y: number) => { g.strokeStyle = '#15121c'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(x - 30, y, 34, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x - 30, y, 15, 34, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x + 70, y); g.stroke(); g.fillStyle = '#15121c'; g.fillRect(x + 66, y - 20, 30, 40); g.strokeStyle = '#e3342f'; g.lineWidth = 14; g.beginPath(); g.moveTo(x - 84, y + 60); g.lineTo(x + 110, y - 60); g.stroke(); };
  const notices = [['CERT-FR', 'ALERT', '#1f4fa8'], ['FBI CYBER', 'WARNING', '#27314d']].map(([who, kind, c], i) => { const n = card(cardTex('notice' + i, who, (g, w) => plugIcon(g, w / 2 - 8, 220), c, kind), 0.98, 1.12); n.position.x = (i ? 1 : -1) * 0.56; n.rotation.z = (i ? -1 : 1) * 0.03; return n; });
  const inv = actor(root, INVESTIGATOR(0), {look: {expr: 'stern', pose: 'hold', prop: 'magnifier'}, think: {expr: 'neutral', pose: 'think'}}, 0.72, 0, -0.1, {scale: 1.08});
  inv.mesh.scale.x = -1;                                                                               // mirrored: the glass is held toward the card
  return {
    light: () => ({...LIGHT.room, amb: 1.25}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, hour = f / 600;
      hands[0].rotation.z = -hour * Math.PI * 2; hands[1].rotation.z = -2.2 - hour * Math.PI / 6;
      method.visible = v === 'method'; farsi.visible = ip.visible = v === 'traces'; safe.visible = v === 'sealed'; warrant.visible = v === 'warrant'; folder.visible = v === 'sanctions'; notices.forEach((n) => { n.visible = v === 'notice'; });
      method.position.x = -0.3; method.scale.setScalar(pop(f, W(168) - 2, 8) || 0.001); method.position.y = 0.92;
      farsi.position.x = -0.56; ip.position.x = 0.56; farsi.scale.setScalar(pop(f, W(169) + 2, 8) || 0.001); ip.scale.setScalar(pop(f, W(174) - 1, 8) || 0.001);
      farsi.rotation.z = 0.03; ip.rotation.z = -0.03;
      inv.node.visible = v === 'method'; inv.node.position.y = hop(f, W(168), 0.08, 8); inv.tick(f, cam);
      dial.rotation.z = v === 'sealed' ? 2.2 * Math.sin(f * 0.25) * clamp01(1 - (f - W(182)) / 8) : 0; safe.position.x = shake(f, W(182), 0.03, 10);
      sq.forEach((q, i) => { q.visible = v === 'sealed'; q.scale.setScalar(pop(f, W(180) + i * 5, 8) || 0.001); q.rotation.z = (i ? -1 : 1) * 0.18; q.position.y = [1.6, 1.78][i] + 0.04 * Math.sin(f * 0.15 + i * 2); });
      stamp.visible = f >= W(210); stamp.scale.setScalar(f >= W(210) ? 2.2 - 1.2 * smooth(f, W(210), W(210) + 5) : 1); warrant.position.y = 0.92 - shake(f, W(210) + 4, 0.03, 8);
      proposed.visible = f >= W(213); proposed.scale.setScalar(f >= W(213) ? 2.2 - 1.2 * smooth(f, W(213), W(213) + 5) : 1); folder.position.y = 0.92 - shake(f, W(213) + 4, 0.03, 8);
      notices.forEach((n, i) => { n.scale.setScalar(pop(f, shot.at + 2 + i * 6, 8) || 0.001); });
    },
  };
};
export {ball, cone, lerp, torus};
