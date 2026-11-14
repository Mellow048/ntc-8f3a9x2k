// Sets of the buried-gold short: the suburban garden with the hole in the lawn, the town hall counter, the page of the
// civil code, the culture office, the foundry that melted the bars, the gendarmerie office, the accountant's desk and the
// gate with the cameras. Each builder fills a group once and returns a tick that poses it for a frame, so any frame can be
// rendered on its own.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, grp, hop, lamp, lerp, lit, mat, mesh, panel, pool, pop, rng, rod, rrect, smat, smooth, soft, tex, text, tiled, tileTex, tmat, torus, vgrad, woodTex, grainTex, type G2, type V} from './kit';
import {actor, ACCOUNTANT, ARCH, CLERK, FINDER, GENDARME, GENDARME as GEND, OFFICIAL, REPORTER, SMELTER} from './cast';
import {bar, barStack, bag, bagPile, crate, glints, signTex, table, tvCamera, officeChair, mug} from './props';
import {W, type Shot} from './story';
import type {Node} from './kit';

export type Ctx = {f: number; t: number; cam: THREE.PerspectiveCamera; shot: Shot};
export type Light = {sky: string; ground: string; amb: number; key: string; keyI: number; from: V; span: number};
export type SetDef = {tick: (c: Ctx) => void; light: (v: string) => Light};
export type Builder = (root: THREE.Group) => SetDef;
export {type Light as LightDef};

export const LIGHT: Record<string, Light> = {
  sun: {sky: '#fff4dc', ground: '#8fa07a', amb: 1.5, key: '#fff0d0', keyI: 1.7, from: [-9, 12, 10], span: 16},
  dusk: {sky: '#ffcfa0', ground: '#5a5a72', amb: 1.15, key: '#ffb878', keyI: 1.35, from: [-10, 7, 8], span: 18},
  night: {sky: '#a8b8e0', ground: '#2a3242', amb: 1.15, key: '#b8ccff', keyI: 1.0, from: [-6, 11, 6], span: 16},
  hall: {sky: '#fff0d8', ground: '#7a6a5a', amb: 1.35, key: '#ffe9c4', keyI: 1.15, from: [-5, 9, 7], span: 9},
  paper: {sky: '#fff6e4', ground: '#b0a48c', amb: 1.6, key: '#fff4dc', keyI: 1.2, from: [-5, 10, 9], span: 8},
  lab: {sky: '#eef4ff', ground: '#9aa4b4', amb: 1.55, key: '#ffffff', keyI: 1.1, from: [-4, 10, 8], span: 8},
  foundry: {sky: '#ffd9a0', ground: '#3a2a20', amb: 0.85, key: '#ffb45a', keyI: 1.5, from: [-4, 8, 7], span: 8},
  office: {sky: '#f2f6ff', ground: '#8a909a', amb: 1.45, key: '#ffffff', keyI: 1.2, from: [-5, 11, 9], span: 9},
  money: {sky: '#ffeccb', ground: '#7a6a58', amb: 1.3, key: '#ffe2b0', keyI: 1.2, from: [-6, 10, 8], span: 9},
  press: {sky: '#dfe8f4', ground: '#8a8f9a', amb: 1.5, key: '#ffffff', keyI: 1.3, from: [-5, 11, 9], span: 9},
};

export const INK = '#15121c';
const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };
/** the flag over the counter: blue, white, red, on the mast */
const flagFR = () => tex('flag-fr', 300, 200, (g, w, h) => {
  g.fillStyle = '#26417a'; g.fillRect(0, 0, w / 3, h);
  g.fillStyle = '#f4f2ec'; g.fillRect(w / 3, 0, w / 3, h);
  g.fillStyle = '#b8232f'; g.fillRect((w * 2) / 3, 0, w / 3, h);
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
});

// ------------------------------------------------------------------ the garden
const grassTex = () => tex('grass', 256, 256, (g, w, h) => {
  g.fillStyle = '#6f8f52'; g.fillRect(0, 0, w, h);
  const r = rng(11);
  for (let i = 0; i < 2400; i++) {
    const x = r() * w, y = r() * h;
    g.strokeStyle = r() > 0.5 ? 'rgba(126,158,88,0.55)' : 'rgba(72,102,54,0.55)';
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 5); g.stroke();
  }
}, true);
const soilTex = () => tex('soil', 256, 256, (g, w, h) => {
  g.fillStyle = '#6b4a30'; g.fillRect(0, 0, w, h);
  const r = rng(23);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = r() > 0.55 ? 'rgba(120,88,56,0.75)' : 'rgba(48,32,20,0.7)';
    g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); g.fill();
  }
}, true);
const stuccoTex = () => grainTex('stucco', '#e7ddcc', 0.1, 6000);
const pavementTex = () => tex('pave', 256, 256, (g, w, h) => {
  g.fillStyle = '#b8b4ac'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,80,84,0.45)'; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); }
}, true);

export const garden: Builder = (root) => {
  backdrop(root, ['#b8d6ee', '#e4f0f8', '#fbf4e2']);
  const grass = () => tmat(tiled(grassTex(), 12, 12));
  // the lawn, cut around the hole: the hole spans x -1.2..1.2, z -0.2..2.2
  floor(root, 44, 12.7, grass(), 0, 0, -6.55);
  floor(root, 44, 11.1, grass(), 0, 0, 7.75);
  floor(root, 20.9, 2.4, grass(), 0, -11.65, 1.0);
  floor(root, 20.9, 2.4, grass(), 0, 11.65, 1.0);
  // ---- the pit: two bands of soil, and a bottom the light can reach
  const soilTop = () => tmat(tiled(soilTex(), 2, 1));
  const soilDeep = () => tmat(tiled(grainTex('soil-deep', '#4a3322', 0.22, 3000), 2, 1));
  floor(root, 2.6, 2.6, soilDeep(), -1.5, 0, 1.0);
  for (const [x, z, w, d] of [[0, -0.27, 2.72, 0.14], [0, 2.27, 2.72, 0.14], [-1.27, 1.0, 0.14, 2.72], [1.27, 1.0, 0.14, 2.72]] as const) {
    box(root, w, 0.75, d, soilDeep(), x, -1.14, z);
    box(root, w, 0.76, d, soilTop(), x, -0.38, z);
  }
  // the rim: soil turned up in heaps, and two planks across one corner
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.1, x = 1.42 * Math.cos(a), z = 1.0 + 1.42 * Math.sin(a);
    const b = ball(root, 0.16 + (i % 3) * 0.05, i % 2 ? '#6f5232' : '#5e442a', x + 0.06 * Math.cos(a * 3), 0.03, z + 0.06 * Math.sin(a * 2)); b.scale.set(1.3, 0.4, 1.0); b.rotation.y = a;
  }
  const plank = box(root, 1.5, 0.06, 0.26, '#b08a52', 1.5, 0.09, 2.2); plank.rotation.y = 0.5;
  // the ladder down into it
  for (const dx of [-0.16, 0.16]) rod(root, [1.02 + dx, -1.45, 1.85], [1.02 + dx, 0.5, 1.95], 0.03, '#8a8f98');
  for (let i = 0; i < 5; i++) box(root, 0.34, 0.03, 0.05, '#b8bcc4', 1.02, -1.25 + i * 0.36, 1.86 + i * 0.02);
  // the bags, in the bottom of the hole, one open with the gold showing
  bagPile(root, -0.4, -1.48, 1.1, 0.72);
  bag(root, 0.45, -1.48, 1.5, 0.64, 2.1, 0.5);
  bag(root, 0.2, -1.48, 1.62, 0.58, 0.7, 0.46);
  bar(root, 0.3, -1.44, 1.35, 0.95, 0.4); bar(root, 0.62, -1.44, 1.45, 0.9, -0.35); bar(root, 0.46, -1.33, 1.4, 0.85, 1.1);
  bar(root, -0.72, -1.44, 1.5, 0.9, 0.9); bar(root, 0.75, -1.44, 1.7, 0.85, -0.8);
  for (let i = 0; i < 8; i++) { const o = cyl(root, 0.07, 0.013, lamp('#f2c230', 0.95), 0.05 + (i % 4) * 0.2, -1.47, 1.05 + (i % 2) * 0.24, 0.07, 16); o.rotation.z = 0.1 * i; }
  const gl = glints(root, [[-0.35, -1.25, 1.25], [0.2, -1.2, 1.05], [0.55, -1.18, 1.42], [0.0, -1.3, 1.55], [0.7, -1.3, 1.3]]);
  const spoil = grp(root, 3.2, 0, 3.4);
  for (let i = 0; i < 9; i++) { const b = ball(spoil, 0.36 + (i % 2) * 0.12, i % 2 ? '#6f5232' : '#5e442a', (i - 4) * 0.34, 0.1 + (i % 3) * 0.14, (i % 2) * 0.34); b.scale.set(1.2, 0.66, 1.0); }
  // ---- the house
  const wall = tmat(tiled(stuccoTex(), 3, 1));
  box(root, 17, 5.4, 7, wall, 0, 2.7, -9.2);
  box(root, 17.6, 0.34, 7.6, '#9a8e80', 0, 5.5, -9.2);
  const roof = cone(root, 11.9, 1.7, '#8a4a3c', 0, 6.3, -9.2, 4); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.62;
  box(root, 0.34, 5.4, 7.4, '#ddd3c0', 0, 2.7, -9.2);
  const glass = () => new THREE.MeshLambertMaterial({color: '#33414c'});
  const win = (x: number, y: number) => {
    soft(panel(root, 1.1, 1.3, glass(), x, y, -5.68));
    for (const dx of [-0.6, 0.6]) box(root, 0.12, 1.44, 0.1, '#f4f2ec', x + dx, y, -5.64);
    box(root, 1.4, 0.12, 0.1, '#f4f2ec', x, y + 0.7, -5.64);
    box(root, 1.4, 0.12, 0.1, '#f4f2ec', x, y - 0.7, -5.64);
    for (const dx of [-0.8, 0.8]) box(root, 0.3, 1.44, 0.06, '#7a8a96', x + dx, y, -5.68);
  };
  win(-4.6, 1.55); win(-1.7, 1.55); win(2.4, 1.55); win(5.0, 1.55);
  win(-4.6, 3.95); win(-1.7, 3.95); win(2.4, 3.95); win(5.0, 3.95);
  const porch = grp(root, 0.6, 0, -5.6);
  box(porch, 1.4, 2.3, 0.16, '#3f4a52', 0, 1.15, 0);
  box(porch, 1.7, 0.16, 0.5, '#f4f2ec', 0, 2.4, 0.2);
  box(porch, 0.12, 2.5, 0.12, '#f4f2ec', -0.78, 1.25, 0.16); box(porch, 0.12, 2.5, 0.12, '#f4f2ec', 0.78, 1.25, 0.16);
  cyl(porch, 0.05, 0.16, '#c9a23a', 0.5, 1.1, 0.1);
  // the porch chair, and the hat on it (nobody is coming for it)
  const chair = grp(root, 1.9, 0, -4.85);
  box(chair, 0.86, 0.16, 0.8, '#6a7a6a', 0, 0.44, 0);
  box(chair, 0.86, 0.8, 0.14, '#6a7a6a', 0, 0.82, -0.34);
  for (const dx of [-0.34, 0.34]) box(chair, 0.12, 0.44, 0.12, '#4a5548', dx, 0.22, 0.28);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 16), mat('#3a3a42')); hat.position.set(0.05, 0.6, 0.02); hat.rotation.x = 0.12; chair.add(hat);
  torus(chair, 0.24, 0.02, '#3a3a42', 0.05, 0.56, 0.02).rotation.x = Math.PI / 2;
  // ---- the digger, its bucket over the hole
  const dig = grp(root, 4.9, 0, 2.6); dig.rotation.y = -0.42;
  for (const dz of [-0.55, 0.55]) { box(dig, 2.1, 0.42, 0.5, '#2f3238', 0, 0.24, dz); for (const dx of [-0.7, 0.7]) cyl(dig, 0.24, 0.34, '#1f2126', dx, 0.24, dz, 0.24, 16).rotation.z = Math.PI / 2; }
  box(dig, 1.9, 0.8, 1.0, '#e0a51e', 0, 0.86, 0);
  box(dig, 0.9, 0.9, 0.86, '#e0a51e', -0.42, 1.65, 0);
  soft(panel(dig, 0.7, 0.6, new THREE.MeshLambertMaterial({color: '#3a4a55'}), -0.42, 1.7, 0.44));
  box(dig, 1.0, 0.5, 0.9, '#c9901a', 0.6, 1.4, 0);
  const armPivot = grp(dig, 0.2, 1.3, 0);
  rod(armPivot, [0, 0, 0], [-2.3, 0.7, 0], 0.14, '#e0a51e');
  const fore = grp(armPivot, -2.2, 0.72, 0);
  rod(fore, [0, 0, 0], [-1.5, -0.9, 0], 0.11, '#e0a51e');
  const bucket = grp(fore, -1.5, -0.92, 0);
  box(bucket, 0.62, 0.5, 0.7, '#c9901a', 0, -0.1, 0);
  box(bucket, 0.66, 0.1, 0.74, '#8f8a86', 0, -0.36, 0);
  armPivot.rotation.z = -0.1;
  // ---- a spade, left standing in the soil
  const spade = grp(root, -1.85, 0, 2.6); spade.rotation.z = 0.2;
  rod(spade, [0, 0, 0], [0, 1.3, 0], 0.03, '#8a6a3a');
  box(spade, 0.26, 0.34, 0.03, '#8a8f98', 0, -0.14, 0);
  box(spade, 0.18, 0.1, 0.06, '#5a4a36', 0, 1.34, 0);
  // ---- the fence, the tree, the street
  for (const sx of [-6.2, 6.2]) {
    for (let i = 0; i < 14; i++) box(root, 0.09, 1.1, 0.03, '#8a7a5a', sx, 0.55, -1 + i * 0.9);
    box(root, 0.06, 0.08, 12.6, '#7a6a4a', sx, 0.95, 4.9);
  }
  cyl(root, 0.22, 2.4, '#5a4530', -5.0, 1.2, 5.4);
  for (let i = 0; i < 5; i++) { const b = ball(root, 0.95, i % 2 ? '#4a7a44' : '#57894b', -5.0 + (i % 3 - 1) * 0.7, 3.0 + (i % 2) * 0.5, 5.4 + (i % 2 - 0.5) * 0.6); b.scale.set(1.1, 0.9, 1.0); }
  floor(root, 44, 5.0, tmat(tiled(pavementTex(), 8, 2)), 0.01, 0, 11.4);
  box(root, 44, 0.16, 0.9, '#9a9690', 0, 0.08, 8.9);
  floor(root, 44, 9, tmat(tiled(grainTex('asphalt', '#4a4c52', 0.2, 4000), 10, 3)), 0.005, 0, 16.0);
  box(root, 9, 4.6, 6, tmat(tiled(stuccoTex(), 2, 1)), -13.5, 2.3, -8.4);
  const r2 = cone(root, 6.4, 1.4, '#7a4a3c', -13.5, 5.2, -8.4, 4); r2.rotation.y = Math.PI / 4; r2.scale.z = 0.7;
  // ---- the trestle table, for the gold on its own
  const t = table(root, 0.7, 3.9, 1.5, 0.95, {h: 0.76, top: '#c9a27a', skirt: '#a8834e'});
  t.visible = false;
  const tGold = grp(root, 0.7, 0.79, 3.9); tGold.visible = false;
  barStack(tGold, 0, 0, 0, 1.15, 0.25);
  bag(tGold, 0.55, 0, 0.12, 0.9, 1.2, 0.62);
  for (let i = 0; i < 9; i++) { const o = cyl(tGold, 0.08, 0.016, lamp('#f2c230', 0.92), -0.5 + (i % 4) * 0.16, 0.01 + Math.floor(i / 4) * 0.018, 0.34 + (i % 2) * 0.06, 0.08, 16); o.rotation.z = 0.15 * Math.sin(i); }
  const tGl = glints(root, [[0.55, 1.15, 4.0], [0.2, 1.0, 3.85], [0.95, 1.05, 4.05], [-0.1, 1.02, 3.8]]);
  // ---- the nights: a work lamp on a tripod, aimed into the hole, and the porch light
  const nightGear = grp(root, 0, 0, 0);
  const tripod = grp(nightGear, 1.95, 0, 3.5);
  for (const a of [0, 2.1, 4.2]) rod(tripod, [0, 0, 0], [0.5 * Math.cos(a), 1.5, 0.5 * Math.sin(a)], 0.025, '#8a8f98');
  box(tripod, 0.42, 0.3, 0.26, '#d8c04a', 0, 1.6, 0); box(tripod, 0.36, 0.22, 0.04, '#fff6d8', 0, 1.6, 0.15);
  const workBeam = beam(nightGear, 0.18, 1.7, 3.4, '#ffe9b0', 0.16, 1.85, 1.55, 3.1);
  workBeam.rotation.x = -1.05; workBeam.rotation.z = -0.16;
  for (const [x, z] of [[-2.2, 4.6], [2.6, 5.4]] as const) { rod(nightGear, [x, 0, z], [x, 0.55, z], 0.04, '#3a3a42'); ball(nightGear, 0.11, lamp('#ffe9b0', 1.4), x, 0.62, z); }
  const porchLight = soft(panel(nightGear, 0.44, 0.28, new THREE.MeshBasicMaterial({color: '#ffdf9a'}), 2.7, 2.5, -5.6));
  const winLit = soft(panel(nightGear, 1.1, 1.3, new THREE.MeshBasicMaterial({color: '#ffcf86'}), 2.4, 1.55, -5.66));
  const lampGlow = pool(nightGear, 5.0, '#ffd08a', 0.16, 2.4, 1.55, 0.03);
  const night = (k: number) => {
    nightGear.visible = k > 0;
    op(porchLight, k); op(winLit, k); op(lampGlow, 0.16 * k); op(workBeam as unknown as THREE.Mesh, 0.2 * k * k);
    op(workBeam as unknown as THREE.Mesh, 0.16 * k * k);
  };
  night(0);
  return {
    light: (v) => (v === 'dusk' ? LIGHT.dusk : v === 'dark' || v === 'chair' || v === 'night' || v === 'wide-night' || v === 'question' ? LIGHT.night : LIGHT.sun),
    tick: ({f, shot}) => {
      const v = shot.v, day = !(v === 'dusk' || v === 'dark' || v === 'chair' || v === 'night' || v === 'wide-night' || v === 'question');
      dig.visible = v === 'street' || v === 'dig' || v === 'hole';
      armPivot.rotation.z = -0.1 + 0.18 * Math.sin(f * 0.045);
      fore.rotation.z = 0.12 * Math.sin(f * 0.045 + 1.2);
      bucket.rotation.z = 0.1 * Math.sin(f * 0.045 + 2.1);
      t.visible = v === 'table'; tGold.visible = v === 'table';
      chair.visible = v === 'chair' || v === 'dark';
      gl(f, v === 'bags' || v === 'hole' || v === 'night' || v === 'wide-night' || v === 'question');
      tGl(f, v === 'table');
      night(v === 'dusk' ? 0.55 : day ? 0 : 1);
    },
  };
};

// ------------------------------------------------------------------ the town hall
const woodFloor = () => tmat(tiled(woodTex('hall-floor', '#9a6a44', '#7a5232'), 7, 7));
const plaster = (key: string, base: string) => tmat(tiled(grainTex(key, base, 0.07, 5200), 4, 2));
/** a printed sheet, lying flat */
const sheet = (p: Node, w: number, h: number, t: THREE.Texture, x: number, y: number, z: number, rz = 0) => {
  const o = soft(panel(p, w, h, smat(t), x, y, z)); o.rotation.x = -Math.PI / 2; o.rotation.z = rz; return o;
};
const noticeTex = () => tex('notice', 512, 340, (g, w, h) => {
  g.fillStyle = '#e8e2d2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b2a30'; g.fillRect(0, 0, w, 34);
  text(g, 'TOWN HALL', w / 2, 17, 22, '#ffffff', {spacing: 3});
  text(g, 'OPEN 8.30 - 12.30', w / 2, 76, 30, '#2b2a30');
  text(g, 'MONDAY TO FRIDAY', w / 2, 112, 22, '#5a5648');
  g.fillStyle = '#b8232f'; g.fillRect(24, 140, w - 48, 3);
  text(g, 'BIRTHS  ·  DEATHS  ·  PLANNING', w / 2, 176, 20, '#5a5648');
  text(g, 'A SWIMMING POOL NEEDS A PERMIT', w / 2, 210, 20, '#5a5648', {maxWidth: w * 0.86});
  text(g, 'ASK AT THE COUNTER', w / 2, 244, 24, '#2b2a30');
});
const formTex = () => tex('form', 512, 700, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9c2b0'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#26417a'; g.fillRect(0, 0, w, 26);
  text(g, 'PREFECTURE DU RHONE', w / 2, 52, 22, '#26417a');
  text(g, 'DECLARATION OF A FIND', w / 2, 92, 34, '#2b2a30', {maxWidth: w * 0.9});
  for (let i = 0; i < 6; i++) g.fillRect(40, 130 + i * 26, w - 80, 2);
  text(g, 'FIVE BARS · GOLD COINS', 40 + 110, 250, 20, '#5a5648');
  text(g, 'NOT CLASSIFIED AS', w / 2, 430, 40, '#b8232f', {maxWidth: w * 0.9});
  text(g, 'ARCHAEOLOGICAL REMAINS', w / 2, 478, 34, '#b8232f', {maxWidth: w * 0.94});
  g.save(); g.strokeStyle = '#b8232f'; g.lineWidth = 6; g.globalAlpha = 0.9; g.beginPath(); g.arc(w / 2, 600, 86, 0, 7); g.stroke();
  text(g, 'RETURNED', w / 2, 584, 30, '#b8232f'); text(g, 'TO THE FINDER', w / 2, 618, 22, '#b8232f'); g.restore();
});

export const hall: Builder = (root) => {
  backdrop(root, ['#f2e9d8', '#e8dec8', '#dcd0b8']);
  floor(root, 18, 16, woodFloor(), 0, 0, 0);
  const wall = plaster('plaster', '#e9e1d0');
  box(root, 18, 4.6, 0.3, wall, 0, 2.3, -3.7);
  box(root, 0.3, 4.6, 16, wall, -8.9, 2.3, 2);
  box(root, 0.3, 4.6, 16, wall, 8.9, 2.3, 2);
  box(root, 18, 0.2, 16, '#efe8da', 0, 4.6, 2);
  // the counter
  box(root, 5.8, 1.05, 0.95, '#b98a5a', 0, 0.525, -1.25);
  box(root, 6.0, 0.09, 1.1, '#d8b184', 0, 1.09, -1.25);
  panel(root, 2.2, 0.3, smat(signTex('counter', 700, 95, '#b98a5a', '#4a3520', [['ACCUEIL  ·  RECEPTION', 40, 0.55]], {font: 'Anton'})), -2.1, 0.55, -0.77);
  // the noticeboard and the flag
  soft(panel(root, 1.9, 1.2, smat(noticeTex()), -3.2, 2.5, -3.5));
  box(root, 1.96, 1.26, 0.06, '#6a5240', -3.2, 2.5, -3.53);
  rod(root, [3.6, 0, -3.4], [3.6, 3.4, -3.4], 0.04, '#c9c2b0');
  const flag = soft(panel(root, 1.0, 0.68, smat(flagFR()), 4.15, 2.9, -3.4));
  // the clerk, behind the counter; the finder, in front of it; the prefecture's official, for the letter
  const clerk = actor(root, CLERK, {
    man: {expr: 'smile', pose: 'type', mode: 'sit'}, clerk: {expr: 'neutral', pose: 'type', mode: 'sit'},
    verdict: {expr: 'neutral', pose: 'cross', mode: 'sit'}, handover: {expr: 'smile', pose: 'both', mode: 'sit'},
  }, 1.5, 0, -2.25, {scale: 0.96, res: 1.0});
  const finder = actor(root, FINDER, {
    man: {expr: 'neutral', pose: 'hold', prop: 'bag'}, clerk: {expr: 'neutral', pose: 'hang'},
    verdict: {expr: 'neutral', pose: 'cross'}, handover: {expr: 'smile', pose: 'both'},
  }, 0.05, 0, 0.55, {scale: 1.0, res: 1.0});
  const official = actor(root, OFFICIAL, {
    verdict: {expr: 'stern', pose: 'hold', prop: 'paper'}, man: {expr: 'neutral', pose: 'cross'}, clerk: {expr: 'neutral', pose: 'cross'}, handover: {expr: 'neutral', pose: 'cross'},
  }, -1.85, 0, -2.25, {scale: 0.96, res: 1.0});
  officeChair(root, 1.5, -2.6, '#43485a'); officeChair(root, -1.85, -2.62, '#43485a');
  mug(root, 2.5, 1.14, -1.3, '#d8d2c4');
  // the letter on the counter: a form, a stamp, a pen
  const letter = grp(root, 0.35, 0, 0); letter.visible = false;
  sheet(letter, 0.62, 0.84, formTex(), 0, 1.145, -1.2, 0.04);
  const stamp = grp(letter, 0.9, 1.16, -1.05);
  cyl(stamp, 0.09, 0.16, '#4a3a2a', 0, 0.08, 0); box(stamp, 0.2, 0.07, 0.14, '#2b2a30', 0, 0.17, 0);
  cyl(letter, 0.012, 0.5, '#c9a23a', 1.15, 1.2, -1.5, 0.012, 12).rotation.z = 1.35;
  // the crate it went home in
  const handover = grp(root, -0.35, 1.1, -1.2); handover.visible = false;
  crate(handover, 0, 0, 0, 0.56, 0.34, 0.4);
  barStack(handover, 0, 0.3, 0, 0.85, 0.3);
  const gl = glints(root, [[-0.5, 1.5, -1.1], [-0.2, 1.48, -1.2], [-0.1, 1.62, -1.05]]);
  // a plant, and a bench for the queue
  box(root, 2.4, 0.42, 0.5, '#9a7a52', -3.4, 0.21, 1.6);
  const plant = grp(root, 5.4, 0, -2.9);
  cyl(plant, 0.32, 0.5, '#c9c2b4', 0, 0.25, 0, 0.4);
  for (let i = 0; i < 5; i++) { const b = ball(plant, 0.34, i % 2 ? '#3f8a52' : '#57a565', 0.4 * Math.cos(i * 1.3), 0.8 + (i % 3) * 0.22, 0.4 * Math.sin(i * 1.3)); b.scale.set(1, 1.2, 0.85); }
  return {
    light: () => LIGHT.hall,
    tick: ({f, shot, cam}) => {
      const v = shot.v;
      letter.visible = v === 'verdict';
      handover.visible = v === 'handover';
      official.show(v === 'verdict' ? 'verdict' : 'man');
      clerk.show(v === 'verdict' ? 'verdict' : v === 'handover' ? 'handover' : v === 'clerk' ? 'clerk' : 'man');
      finder.show(v === 'verdict' ? 'verdict' : v === 'handover' ? 'handover' : 'man');
      finder.node.visible = v !== 'clerk';
      clerk.tick(f, cam); finder.tick(f, cam); official.tick(f, cam);
      gl(f, v === 'handover');
      if (v === 'verdict') stamp.position.y = 1.16 - 0.12 * Math.max(0, Math.cos(f * 0.09));
    },
  };
};

// ------------------------------------------------------------------ the page of the civil code
const pageTex = () => tex('code-page', 700, 960, (g, w, h) => {
  g.fillStyle = '#fbf7ec'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(140,120,80,0.05)'); gr.addColorStop(1, 'rgba(120,100,70,0.12)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  text(g, 'CODE CIVIL', w / 2, h * 0.045, 26, '#9a8a68', {spacing: 10});
  text(g, 'ARTICLE 716', w / 2, h * 0.10, 74, '#2a2418', {maxWidth: w * 0.8});
  g.fillStyle = '#c9a23a'; g.fillRect(w * 0.24, h * 0.136, w * 0.52, 5);
  const L = (s: string, cy: number, size: number, color = '#3a3428') => text(g, s, w / 2, h * cy, size, color, {maxWidth: w * 0.8});
  L('ANY HIDDEN', 0.20, 30);
  L('OR BURIED THING,', 0.243, 30);
  L('WHOSE OWNER', 0.286, 30);
  L('CANNOT BE PROVED,', 0.329, 30);
  L('AND WHICH IS', 0.372, 30);
  L('FOUND BY CHANCE,', 0.415, 30);
  L('IS A TREASURE.', 0.475, 44, '#2a2418');
  g.fillStyle = '#cfc6ae'; g.fillRect(w * 0.32, h * 0.545, w * 0.36, 3);
  L('ON YOUR OWN LAND,', 0.575, 34);
  L('IT IS YOURS.', 0.63, 54, '#b8232f');
  g.save(); g.strokeStyle = 'rgba(184,35,47,0.7)'; g.lineWidth = 5; g.beginPath(); g.arc(w * 0.87, h * 0.60, 40, 0, 7); g.stroke();
  text(g, 'ETAT', w * 0.87, h * 0.60, 22, 'rgba(184,35,47,0.8)'); g.restore();
  g.fillStyle = '#cfc6ae'; g.fillRect(w * 0.32, h * 0.685, w * 0.36, 3);
  L('UNLESS IT IS', 0.735, 30, '#2a2418');
  L('ARCHAEOLOGY.', 0.79, 30, '#2a2418');
});

export const code: Builder = (root) => {
  backdrop(root, ['#f8efd9', '#f1e5ca', '#e3d5b5']);
  floor(root, 16, 14, tmat(tiled(woodTex('code-desk', '#7a5232', '#5e3c24'), 5, 5)), 0, 0, 0);
  table(root, 0, -0.45, 3.4, 2.3, {h: 0.55, top: '#8a6038', skirt: '#6a4728'});
  const book = grp(root, 0, 0.28, -1.45);
  box(book, 1.96, 2.62, 0.1, '#3a2a1e', 0, 1.3, -0.09);
  soft(panel(book, 1.84, 2.5, smat(pageTex()), 0, 1.3, 0));
  box(book, 0.05, 2.5, 0.02, '#c9a23a', -0.9, 1.3, 0.01);
  // a reading stand, and the page's own shadow
  for (const sx of [-0.85, 0.85]) rod(root, [sx, 0.72, -1.2], [sx, 0.78, -1.62], 0.03, '#6a4728');
  box(root, 2.0, 0.07, 0.34, '#6a4728', 0, 0.72, -1.15);
  pool(root, 1.6, '#000000', 0.18, 0, -1.4, 0.73, false);
  soft(panel(book, 0.09, 0.56, smat(tex('ribbon', 32, 160, (g, w, h) => { g.fillStyle = '#b8232f'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a1a24'; g.fillRect(0, h - 26, w, 26); })), 0.56, 0.2, 0.02));
  const pen = cyl(root, 0.028, 0.36, '#2b2a30', 1.35, 0.6, -0.75, 0.028, 12); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5;
  cyl(root, 0.075, 0.1, '#1f1e26', 1.55, 0.6, -1.05);   // an ink pot
  return {
    light: () => LIGHT.paper,
    tick: ({f}) => { book.position.y = 0.28 + 0.002 * Math.sin(f * 0.05); },
  };
};

// ------------------------------------------------------------------ the culture office
export const drac: Builder = (root) => {
  backdrop(root, ['#eef4ff', '#e4ecf7', '#dae3ef']);
  floor(root, 16, 14, tmat(tiled(tileTex('drac-floor', '#cfd4da', '#aab0b8', 4), 7, 7)), 0, 0, 0);
  const wall = plaster('office-wall', '#e2e6ec');
  box(root, 16, 4.2, 0.3, wall, 0, 2.1, -3.4);
  box(root, 0.3, 4.2, 14, wall, -7.9, 2.1, 1);
  box(root, 16, 0.2, 14, '#eef1f5', 0, 4.2, 1);
  // shelves of archive boxes
  for (let k = 0; k < 3; k++) {
    box(root, 3.0, 0.06, 0.5, '#8a8f98', -4.4, 1.1 + k * 0.8, -3.15);
    for (let i = 0; i < 5; i++) box(root, 0.46, 0.34, 0.42, i % 2 ? '#c9b48c' : '#d8d2c0', -5.7 + i * 0.62, 1.3 + k * 0.8, -3.15);
  }
  // the window, and its blinds
  soft(panel(root, 3.0, 1.7, new THREE.MeshBasicMaterial({color: '#dfeaf6'}), 3.4, 2.4, -3.22));
  for (let i = 0; i < 9; i++) box(root, 3.0, 0.05, 0.03, '#f2f4f8', 3.4, 1.62 + i * 0.18, -3.18);
  // the worktable: a cutting mat, the bars, a loupe on a stand, papers
  table(root, 0.4, -0.2, 2.3, 1.15, {h: 0.76, top: '#c9c6bc', leg: '#7a828c'});
  sheet(root, 1.55, 0.88, tex('mat', 512, 288, (g, w, h) => {
    g.fillStyle = '#3d6a4f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a8a68'; g.lineWidth = 2;
    for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 44, 0); g.lineTo(i * 44, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 26); g.lineTo(w, i * 26); g.stroke(); }
  }), 0.4, 0.785, -0.22);
  barStack(root, 0.35, 0.8, -0.3, 1.05, 0.3);
  bar(root, 0.95, 0.8, -0.15, 1.0, -0.4); bar(root, -0.3, 0.8, 0.05, 0.95, 0.7);
  for (let i = 0; i < 6; i++) cyl(root, 0.075, 0.014, lamp('#f2c230', 0.9), -0.5 + (i % 3) * 0.13, 0.795, 0.14 + (i % 2) * 0.1, 0.075, 16);
  // the loupe on its arm
  rod(root, [1.0, 0.79, -0.5], [1.0, 1.24, -0.5], 0.025, '#5a6068');
  rod(root, [1.0, 1.24, -0.5], [0.62, 1.3, -0.34], 0.025, '#5a6068');
  const lens = torus(root, 0.14, 0.03, '#3a3f48', 0.56, 1.3, -0.32); lens.rotation.x = 0.35;
  soft(panel(root, 0.24, 0.24, new THREE.MeshBasicMaterial({color: '#dff0ff', transparent: true, opacity: 0.35}), 0.56, 1.3, -0.31)).rotation.x = 0.35;
  // a desk lamp over the bars
  rod(root, [1.45, 0.79, 0.25], [1.45, 1.55, 0.25], 0.035, '#4a5058');
  rod(root, [1.45, 1.55, 0.25], [0.95, 1.62, 0.1], 0.03, '#4a5058');
  const shade = cone(root, 0.2, 0.22, '#2f343c', 0.86, 1.58, 0.05); shade.rotation.z = 0.4;
  const glow = new THREE.MeshBasicMaterial({color: '#fff0c8', transparent: true, opacity: 0.95});
  soft(ball(root, 0.09, glow, 0.8, 1.5, 0.05));
  beam(root, 0.14, 0.75, 1.5, '#fff4d0', 0.1, 0.82, 1.45, 0.08);
  const gl = glints(root, [[0.3, 0.95, -0.3], [0.9, 0.92, -0.14], [-0.25, 0.9, 0.05], [0.55, 1.02, -0.22]]);
  // a corkboard of photographs
  soft(panel(root, 1.5, 1.0, smat(tex('drac-board', 512, 340, (g, w, h) => {
    g.fillStyle = '#c9a877'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = 22 + (i % 2) * 244, y = 26 + Math.floor(i / 2) * 160; g.fillStyle = '#f6f2e6'; g.fillRect(x, y, 200, 132); g.fillStyle = '#c9b02a'; g.fillRect(x + 58, y + 46, 84, 40); }
    text(g, 'NO CONTEXT', w / 2, h - 24, 26, '#8a4a2a');
  })), -2.9, 2.3, -3.2));
  // the archaeologist, with a clipboard, and the finder, waiting
  const arch = actor(root, ARCH, {
    office: {expr: 'neutral', pose: 'hold', prop: 'clip'}, exam: {expr: 'neutral', pose: 'hold', prop: 'lens'},
  }, 1.35, 0, 1.5, {scale: 1.0, res: 1.0});
  const man = actor(root, FINDER, {office: {expr: 'neutral', pose: 'cross', prop: null}}, -1.3, 0, 1.9, {scale: 1.0, res: 0.95});
  return {
    light: () => LIGHT.lab,
    tick: ({f, shot, cam}) => { arch.tick(f, cam); man.tick(f, cam); man.node.visible = shot.v === 'office'; gl(f, true); },
  };
};

// ------------------------------------------------------------------ the foundry
export const foundry: Builder = (root) => {
  backdrop(root, ['#5a4636', '#3a2e26', '#221a16']);
  floor(root, 16, 14, tmat(tiled(grainTex('foundry-floor', '#4a4238', 0.18, 5000), 6, 6)), 0, 0, 0);
  box(root, 12, 5.0, 1.2, '#3f3630', 0, 2.5, -3.4);
  box(root, 0.3, 4.6, 14, '#3a322c', -5.2, 2.3, 1); box(root, 0.3, 4.6, 14, '#3a322c', 5.2, 2.3, 1);
  // the furnace mouth
  const mouth = soft(panel(root, 1.3, 0.9, new THREE.MeshBasicMaterial({color: '#ffbe62'}), 0, 1.35, -2.78));
  box(root, 1.6, 1.2, 0.16, '#1f1a16', 0, 1.35, -2.72);
  const mouthGlow = new THREE.MeshBasicMaterial({color: '#ff9a3a', transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false});
  soft(ball(root, 0.55, mouthGlow, 0, 1.35, -2.85)).scale.set(1, 0.7, 0.4);
  const lightPool = pool(root, 4.5, '#ff9a3a', 0.35, 0, 0.4, 0.02);
  cyl(root, 0.32, 2.6, '#4a4038', -1.2, 3.4, -3.0, 0.32, 14);
  cyl(root, 0.28, 2.0, '#4a4038', 1.6, 3.1, -3.0, 0.28, 14);
  // the ladle, tipped over the moulds, and the stream of gold
  const crane = grp(root, 0.55, 2.3, -1.5);
  cyl(crane, 0.3, 0.55, '#5a4a3a', 0, 0, 0, 0.34, 16);
  rod(crane, [0, 0.5, 0], [0.35, 1.2, 0.7], 0.05, '#3a3430');
  const pour = grp(crane, 0.45, 0.55, 0.9); pour.rotation.z = -0.35;
  const streamMat = new THREE.MeshBasicMaterial({color: '#ffd04a'});
  const stream = cyl(root, 0.045, 0.9, streamMat, 0.9, 1.15, 0.0, 0.035, 10);
  // the moulds, and the bars already poured
  box(root, 1.5, 0.12, 0.9, '#4a4a52', 0.5, 0.06, 0.0);
  for (let i = 0; i < 3; i++) box(root, 0.4, 0.16, 0.2, '#3a3a42', 0.0 + i * 0.5, 0.22, 0.0);
  for (let i = 0; i < 3; i++) bar(root, 0.0 + i * 0.5, 0.3, 0.0, 1.0, 0.02);
  const bench = grp(root, 0.4, 0, -1.0);
  box(bench, 1.6, 0.75, 0.9, '#5a5248', 0, 0.38, 0);
  box(bench, 1.7, 0.06, 1.0, '#7a7264', 0, 0.78, 0);
  barStack(bench, 0, 0.82, 0, 1.15, 0.2);
  bar(bench, 0.45, 0.82, 0.18, 1.0, 1.2);
  // sparks
  const sparks = Array.from({length: 10}, (_, i) => {
    const m = new THREE.MeshBasicMaterial({color: i % 2 ? '#ffd27a' : '#ff8a2a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false});
    return soft(mesh(root, new THREE.PlaneGeometry(0.09, 0.09), m, 0, 0, 0));
  });
  const smelter = actor(root, SMELTER, {
    furnace: {expr: 'neutral', pose: 'hips'}, pour: {expr: 'stern', pose: 'point'}, bars: {expr: 'smile', pose: 'hold'},
  }, 2.15, 0, 0.15, {scale: 1.0, res: 1.0});
  return {
    light: (v) => (v === 'bars' ? {...LIGHT.foundry, amb: 1.1, keyI: 1.1} : LIGHT.foundry),
    tick: ({f, shot, cam}) => {
      smelter.tick(f, cam);
      mouth.scale.y = 1 + 0.05 * Math.sin(f * 0.21);
      mouthGlow.opacity = 0.45 + 0.16 * Math.sin(f * 0.17);
      (lightPool.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.08 * Math.sin(f * 0.13);
      stream.visible = shot.v === 'pour';
      stream.scale.y = 0.92 + 0.08 * Math.sin(f * 0.5);
      sparks.forEach((s, i) => {
        const u = ((f * 0.014 + i * 0.17) % 1), x = 0.7 + Math.sin(i * 2.1) * 0.3 + u * 0.2, y = 0.4 + u * 1.5, z = 0.2 + Math.cos(i * 1.7) * 0.3;
        s.position.set(x, y, z);
        (s.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - u) * (shot.v === 'furnace' ? 1 : 0.6);
        s.scale.setScalar(0.6 + u);
      });
    },
  };
};

// ------------------------------------------------------------------ the gendarmerie office
const serialBoardTex = () => tex('serial-board', 760, 500, (g, w, h) => {
  g.fillStyle = '#c9a877'; g.fillRect(0, 0, w, h);
  const r = rng(41);
  for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(90,64,36,${0.1 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 2, 2); }
  const cards: [number, number, string, string][] = [
    [24, 26, '#f6f2e6', 'BARS FOUND  ·  MAY 2025'],
    [424, 26, '#f6f2e6', 'SERIAL NUMBERS'],
  ];
  for (const [x, y, c, s] of cards) { g.fillStyle = c; g.fillRect(x, y, 312, 34); text(g, s, x + 156, y + 17, 18, '#2a2418', {maxWidth: 292}); }
  for (let i = 0; i < 5; i++) {
    const x = 24 + i * 92, y = 76;
    g.fillStyle = '#fffdf4'; g.fillRect(x, y, 84, 96);
    g.fillStyle = '#e8b62c'; g.beginPath(); g.moveTo(x + 10, y + 44); g.lineTo(x + 74, y + 44); g.lineTo(x + 70, y + 74); g.lineTo(x + 14, y + 74); g.closePath(); g.fill();
    g.strokeStyle = '#15121c'; g.lineWidth = 2; g.strokeRect(x + 10, y + 44, 62, 30);
    text(g, `No ${4471 + i}`, x + 42, y + 86, 13, '#2a2418');
  }
  for (let i = 0; i < 4; i++) { g.fillStyle = '#f6f2e6'; g.fillRect(24, 196 + i * 62, 300, 52); text(g, ['BAR 1  ·  1 KG  ·  LBMA MARK', 'BAR 2  ·  1 KG  ·  LBMA MARK', 'BAR 3  ·  1 KG  ·  NO MARK', 'COINS  ·  41 PIECES'][i], 174, 222 + i * 62, 15, '#3a3428', {maxWidth: 284}); }
  g.save(); g.strokeStyle = '#b8232f'; g.lineWidth = 7; g.beginPath(); g.arc(566, 300, 108, 0, 7); g.stroke();
  text(g, 'NO LINK TO', 566, 274, 40, '#b8232f'); text(g, 'A THEFT', 566, 320, 40, '#b8232f'); g.restore();
  text(g, 'NOTHING REPORTED MISSING', 384, 462, 24, '#2a2418', {maxWidth: 700});
});
const fileScreen = () => tex('file-screen', 512, 368, (g, w, h) => {
  g.fillStyle = '#0f1822'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d2f42'; g.fillRect(0, 0, w, 30);
  text(g, 'FOUND OBJECTS  ·  REGISTER', w / 2, 15, 15, '#9ad0ff');
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#16232e' : '#131c26'; g.fillRect(16, 44 + i * 44, w - 32, 36);
    text(g, ['No 4471   1 KG BAR', 'No 4472   1 KG BAR', 'No 4473   1 KG BAR', 'No 4474   1 KG BAR', 'No 4475   1 KG BAR', '41 COINS   VARIOUS'][i], 40, 62 + i * 44, 15, '#d8e4f0', {align: 'left', maxWidth: 300});
    text(g, i < 5 ? 'NO MATCH' : 'NO MATCH', w - 110, 62 + i * 44, 15, '#7ce8a0');
  }
});

export const brigade: Builder = (root) => {
  backdrop(root, ['#f0f4f8', '#e6ebf1', '#dbe2ea']);
  floor(root, 16, 14, tmat(tiled(tileTex('bri-floor', '#c8cdd4', '#a8aeb6', 3), 7, 7)), 0, 0, 0);
  const wall = plaster('bri-wall', '#e4e8ee');
  box(root, 16, 4.2, 0.3, wall, 0, 2.1, -3.2);
  box(root, 0.3, 4.2, 14, wall, -7.9, 2.1, 1);
  box(root, 16, 0.2, 14, '#eef1f5', 0, 4.2, 1);
  // the corkboard: photographs of the bars, and what the numbers say
  box(root, 2.4, 1.66, 0.08, '#8a6a44', 0, 2.05, -3.1);
  soft(panel(root, 2.3, 1.56, smat(serialBoardTex()), 0, 2.05, -3.04));
  // a window with blinds on the left
  soft(panel(root, 2.2, 1.4, new THREE.MeshBasicMaterial({color: '#dfeaf6'}), -4.6, 2.5, -3.1));
  for (let i = 0; i < 8; i++) box(root, 2.2, 0.05, 0.03, '#f2f4f8', -4.6, 1.86 + i * 0.17, -3.06);
  // the desk, the screen, the phone, the file
  table(root, 0, -0.55, 2.2, 1.05, {h: 0.76, top: '#a8a090', leg: '#6a7078'});
  box(root, 0.6, 0.05, 0.42, '#2b2f36', 0.55, 0.79, -0.6);
  soft(panel(root, 0.9, 0.62, smat(fileScreen(), 1.1), 0.55, 1.22, -0.86));
  box(root, 0.94, 0.06, 0.04, '#1f2328', 0.55, 0.9, -0.84);
  box(root, 0.06, 0.12, 0.06, '#2b2f36', 0.55, 0.83, -0.8);
  box(root, 0.26, 0.06, 0.18, '#2b2f36', -0.62, 0.79, -0.75); box(root, 0.24, 0.02, 0.16, '#8a9aa8', -0.62, 0.825, -0.75);
  sheet(root, 0.3, 0.4, tex('bri-note', 200, 260, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) g.fillRect(18, 30 + i * 30, w - 36, 2); }), -0.5, 0.79, -0.3, 0.2);
  // the gendarme
  const gd = actor(root, GEND, {
    desk: {expr: 'neutral', pose: 'type', mode: 'sit'}, board: {expr: 'neutral', pose: 'cross', mode: 'sit'},
    serial: {expr: 'neutral', pose: 'cross', mode: 'sit'}, clean: {expr: 'smile', pose: 'shrug', mode: 'sit'},
  }, 0.1, 0, -1.55, {scale: 0.96, res: 1.0});
  officeChair(root, 0.1, -1.9, '#2b3550');
  return {
    light: () => LIGHT.office,
    tick: ({f, shot, cam}) => { gd.show(shot.v === 'clean' ? 'clean' : shot.v === 'serial' ? 'serial' : shot.v === 'board' ? 'board' : 'desk'); gd.tick(f, cam); },
  };
};

// ------------------------------------------------------------------ the accountant
const ledgerTex = () => tex('ledger', 760, 520, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8e2d0'; g.fillRect(w / 2 - 3, 0, 6, h);
  g.fillStyle = '#26417a'; g.fillRect(0, 0, w, 52);
  text(g, 'THE SUM  ·  EUR', w / 2, 27, 28, '#ffffff', {maxWidth: 700});
  const rows: [string, string][] = [['FOUND', '700,000'], ['TAX 11.5 %', '-80,500'], ['HE KEEPS', '619,500']];
  rows.forEach(([a, b], i) => {
    const y = 132 + i * 132;
    if (i === 2) { g.fillStyle = '#f6eed6'; g.fillRect(16, y - 52, w - 32, 116); }
    text(g, a, 30, y - 8, 34, '#3a3428', {align: 'left', maxWidth: 330});
    text(g, b, w - 30, y + 6, 66, i === 2 ? '#b8232f' : '#2a2418', {align: 'right', maxWidth: 380});
    g.fillStyle = '#cfc6ae'; g.fillRect(20, y + 56, w - 40, 3);
  });
  text(g, 'FINDING IT IS NOT TAXED.', w / 2, h - 30, 22, '#5a5344', {maxWidth: 700});
});

const calcTex = (s: string, big = 56) => tex('calc-' + s, 320, 200, (g, w, h) => {
  g.fillStyle = '#c9c3ac'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#8a9a7a'; g.fillRect(14, 14, w - 28, 64);
  text(g, s, w - 26, 46, big, '#1f2a1f', {align: 'right', maxWidth: w - 56, font: 'Montserrat', weight: 700});
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = '#2b2a30'; g.fillRect(22 + x * 46, 92 + y * 24, 36, 17); }
});

export const money: Builder = (root) => {
  backdrop(root, ['#f6ecd6', '#efe2c6', '#e2d3b2']);
  floor(root, 16, 14, tmat(tiled(grainTex('money-carpet', '#8a7f70', 0.14, 6000), 8, 8)), 0, 0, 0);
  const wall = plaster('money-wall', '#e9e0cc');
  box(root, 16, 4.2, 0.3, wall, 0, 2.1, -3.1);
  box(root, 0.3, 4.2, 14, wall, -7.9, 2.1, 1);
  box(root, 16, 0.2, 14, '#efe8da', 0, 4.2, 1);
  // a filing cabinet, a framed print
  box(root, 1.2, 1.7, 0.7, '#8a8f98', -3.6, 0.85, -2.6);
  for (let i = 0; i < 3; i++) box(root, 1.1, 0.04, 0.05, '#5a6068', -3.6, 0.4 + i * 0.5, -2.24);
  soft(panel(root, 1.4, 1.0, smat(tex('money-print', 400, 290, (g, w, h) => {
    g.fillStyle = '#f4efe0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a7a5a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#c9a23a'; g.beginPath(); g.ellipse(w / 2, h / 2, 120, 54, 0, 0, 7); g.fill();
    g.fillStyle = '#8a6a1a'; g.beginPath(); g.ellipse(w / 2, h / 2 - 8, 100, 40, 0, 0, 7); g.fill();
  })), 2.1, 2.5, -3.06));
  // the desk: an open ledger, a calculator, a bar, coins
  table(root, 0.1, -0.5, 2.3, 1.15, {h: 0.76, top: '#a8794a', skirt: '#8a6038'});
  const ledger = grp(root, -0.35, 0.78, -0.35);
  box(ledger, 0.9, 0.05, 0.62, '#7a2a2a', 0, 0.02, 0);
  soft(panel(ledger, 0.84, 0.56, smat(ledgerTex()), 0, 0.055, 0)).rotation.x = -Math.PI / 2;
  // the calculator, and the plates on its display
  box(root, 0.42, 0.05, 0.3, '#2b2a30', 0.55, 0.8, -0.25);
  const plates: Record<string, THREE.Mesh> = {};
  for (const [k, s] of [['zero', '700,000'], ['eighty', '11.5 %'], ['rate', '11.5 %'], ['net', '619,500']] as const) {
    const p = soft(panel(root, 0.36, 0.11, smat(calcTex(s, 78)), 0.55, 0.845, -0.29));
    p.rotation.x = -Math.PI / 2; p.visible = false; plates[k] = p;
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) box(root, 0.06, 0.014, 0.04, '#c9c3ac', 0.4 + i * 0.1, 0.83, -0.14 + j * 0.06);
  bar(root, 0.95, 0.79, 0.05, 1.0, 0.6);
  for (let i = 0; i < 4; i++) cyl(root, 0.07, 0.014, lamp('#f2c230', 0.9), -0.95 + i * 0.1, 0.795, 0.14, 0.07, 16);
  // a desk lamp
  rod(root, [-1.15, 0.78, -0.6], [-1.15, 1.45, -0.6], 0.03, '#4a4038');
  rod(root, [-1.15, 1.45, -0.6], [-0.8, 1.5, -0.45], 0.025, '#4a4038');
  cone(root, 0.16, 0.18, '#3a3028', -0.72, 1.46, -0.42).rotation.z = 0.5;
  beam(root, 0.1, 0.6, 1.3, '#fff0c8', 0.09, -0.7, 1.3, -0.35);
  // the accountant, at the ledger
  const acc = actor(root, ACCOUNTANT, {
    ledger: {expr: 'neutral', pose: 'desk', mode: 'sit'}, zero: {expr: 'neutral', pose: 'type', mode: 'sit'},
    rate: {expr: 'stern', pose: 'type', mode: 'sit'}, eighty: {expr: 'stern', pose: 'type', mode: 'sit'}, net: {expr: 'smile', pose: 'both', mode: 'sit'},
  }, 0.15, 0, -1.55, {scale: 0.96, res: 1.0});
  officeChair(root, 0.15, -1.9, '#3a3028');
  return {
    light: () => LIGHT.money,
    tick: ({f, shot, cam}) => {
      acc.show(shot.v === 'zero' ? 'zero' : shot.v === 'rate' ? 'rate' : shot.v === 'eighty' ? 'eighty' : shot.v === 'net' ? 'net' : 'ledger');
      acc.tick(f, cam);
      for (const [k, p] of Object.entries(plates)) p.visible = shot.v === k;
    },
  };
};

// ------------------------------------------------------------------ the gate, and the cameras
const frontPageTex = () => tex('front-page', 620, 820, (g, w, h) => {
  g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1f1e24'; g.fillRect(0, 0, w, 78);
  text(g, 'THE LOCAL PAPER', w / 2, 40, 40, '#ffffff', {maxWidth: w * 0.9});
  g.fillStyle = '#b8232f'; g.fillRect(0, 78, w, 8);
  text(g, 'NEUVILLE-SUR-SAONE', w / 2, 112, 18, '#5a5344');
  text(g, 'HE GOT RICH DIGGING', w / 2, 190, 46, '#1f1e24', {maxWidth: w * 0.92});
  text(g, 'A POOL', w / 2, 244, 46, '#b8232f', {maxWidth: w * 0.92});
  g.fillStyle = '#d8d2c0'; g.fillRect(24, 280, w - 48, 280);
  g.fillStyle = '#c9a23a'; g.beginPath(); g.moveTo(90, 420); g.lineTo(w - 90, 380); g.lineTo(w - 110, 470); g.lineTo(70, 500); g.closePath(); g.fill();
  g.fillStyle = '#6f8f52'; g.fillRect(24, 540, w - 48, 20);
  for (let i = 0; i < 7; i++) g.fillRect(24, 580 + i * 22, w - 48 - (i % 3) * 60, 5);
  text(g, 'THE TOWN HALL SAYS THE GOLD IS HIS', 24, 790, 17, '#3a3428', {align: 'left', maxWidth: w - 48});
});

export const press: Builder = (root) => {
  backdrop(root, ['#cfe0f0', '#e4edf6', '#f4f6f8']);
  floor(root, 16, 14, tmat(tiled(pavementTex(), 8, 8)), 0, 0, 0);
  // the house, behind the hedge
  box(root, 14, 4.6, 5, tmat(tiled(stuccoTex(), 3, 1)), 0, 2.3, -7.6);
  const roof = cone(root, 10.0, 1.5, '#8a4a3c', 0, 5.2, -7.6, 4); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.6;
  box(root, 14, 1.3, 1.2, '#4a6a44', 0, 0.65, -4.4);
  // the gate: stone pillars and iron bars
  for (const sx of [-5.0, 5.0]) { box(root, 0.7, 2.4, 0.7, '#c9c2b4', sx, 1.2, -2.6); ball(root, 0.34, '#b8b0a0', sx, 2.6, -2.6); }
  for (let i = 0; i < 27; i++) rod(root, [-4.6 + i * 0.36, 0, -2.6], [-4.6 + i * 0.36, 2.0, -2.6], 0.04, '#2b2a30');
  for (const y of [0.3, 1.6]) box(root, 9.3, 0.08, 0.08, '#2b2a30', 0, y, -2.6);
  // the reporters, with cameras
  const reps = [0, 1, 2].map((i) => actor(root, REPORTER(i), {
    gate: {expr: 'shock', pose: 'hold', prop: 'phone'}, paper: {expr: 'neutral', pose: 'hang'}, back: {expr: 'shock', pose: 'hold', prop: 'phone'},
  }, [-1.05, 0.95, -0.55][i], 0, [1.15, 1.0, 0.7][i], {scale: 0.98, res: 0.95}));
  tvCamera(root, -1.75, 1.5, 0.4, 1.0); tvCamera(root, 1.7, 1.35, -0.45, 0.95);
  rod(root, [-2.0, 2.2, 1.5], [-2.4, 2.85, 2.8], 0.03, '#2b2a30');   // a boom
  soft(ball(root, 0.1, mat('#3a3a42'), -2.42, 2.81, 2.82));
  // a thicket of microphones, pushed at him
  const mics = grp(root, 0, 0, 0);
  for (const [x, y, z, a] of [[-0.62, 1.55, 2.1, 0.4], [0.2, 1.45, 2.0, 0.1], [0.85, 1.5, 2.15, -0.35], [-1.05, 1.4, 2.3, 0.7]] as const) {
    rod(mics, [x * 0.4, 0.9, z + 0.9], [x, y, z], 0.014, '#2b2a30');
    cyl(mics, 0.045, 0.14, '#3a3a42', x, y + 0.06, z, 0.045, 12).rotation.z = a;
  }
  // the man, at the gate, hand up: no interview
  const man = actor(root, FINDER, {
    gate: {expr: 'neutral', pose: 'hush'}, back: {expr: 'neutral', pose: 'hush'}, paper: {expr: 'neutral', pose: 'hush'},
  }, 0.3, 0, 2.3, {scale: 1.02, res: 1.0});
  // the paper, on its stand
  const stand = grp(root, 0.1, 0, -0.9); stand.visible = false;
  rod(stand, [-0.38, 0, 0], [-0.38, 1.05, 0], 0.03, '#3a3430'); rod(stand, [0.38, 0, 0], [0.38, 1.05, 0], 0.03, '#3a3430');
  soft(panel(stand, 0.72, 0.96, smat(frontPageTex()), 0, 1.5, 0.02));
  box(stand, 0.8, 0.05, 0.06, '#3a3430', 0, 1.02, 0);
  box(stand, 1.0, 0.06, 0.5, '#5a5248', 0, 0.03, 0.1);
  return {
    light: () => LIGHT.press,
    tick: ({f, shot, cam}) => {
      reps.forEach((r, i) => { r.tick(f, cam); r.node.visible = shot.v === 'gate' || shot.v === 'back'; });
      man.tick(f, cam);
      stand.visible = shot.v === 'paper';
      man.node.visible = shot.v !== 'paper';
      mics.visible = shot.v !== 'back';
    },
  };
};
