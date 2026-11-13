// The things the sets share: panelled gallery walls with a cornice and a dado, a herringbone floor, a bench, a plinth, tall
// windows, a staff door with a brass plate, a clock, the picture lights, and the stanchions of today's gallery.
import * as THREE from 'three';
import {box, cyl, floor, grp, lamp, lit, panel, pop, soft, tex, tiled, tmat, text, type G2, type Node, type V} from './kit';
import {boardsTex, brassLabel, damaskTex, framed, parquetTex, plasterTex, stoneTex, cobbleTex} from './art';

export type Light = {sky: string; ground: string; amb: number; key: string; keyI: number; from: V; span: number};
export const LIGHT: Record<'gallery' | 'dawn' | 'work' | 'stair' | 'studio' | 'office' | 'room' | 'hotel' | 'warm' | 'cell' | 'night' | 'flash' | 'today', Light> = {
  gallery: {sky: '#fff6e2', ground: '#a08c78', amb: 1.65, key: '#fff4dc', keyI: 1.5, from: [-3, 9, 8], span: 14},
  dawn: {sky: '#dfe6f0', ground: '#8a8fa4', amb: 1.4, key: '#eef2ff', keyI: 0.9, from: [-6, 8, 7], span: 14},
  work: {sky: '#e8eef2', ground: '#9aa0a8', amb: 1.5, key: '#f2f6ff', keyI: 1.2, from: [-4, 8, 8], span: 10},
  stair: {sky: '#c9cfd8', ground: '#6a6f80', amb: 1.15, key: '#e6ecf6', keyI: 1.0, from: [-2, 7, 6], span: 8},
  studio: {sky: '#f2ecdc', ground: '#a08f7a', amb: 1.5, key: '#fff3d8', keyI: 1.3, from: [3, 8, 7], span: 9},
  office: {sky: '#e9e4d4', ground: '#8a7f6a', amb: 1.4, key: '#fff2d8', keyI: 1.1, from: [-4, 8, 7], span: 9},
  room: {sky: '#e6dcc4', ground: '#7a6a52', amb: 1.3, key: '#ffe9c4', keyI: 1.1, from: [5, 6, 5], span: 9},
  hotel: {sky: '#e2d6c0', ground: '#6a5a48', amb: 1.3, key: '#ffe6bc', keyI: 1.15, from: [-5, 6, 5], span: 8},
  warm: {sky: '#ffdca8', ground: '#6a4a3a', amb: 1.2, key: '#ffc98a', keyI: 1.2, from: [-4, 7, 6], span: 10},
  cell: {sky: '#aab0c0', ground: '#4a4e5a', amb: 1.0, key: '#dfe6f4', keyI: 0.8, from: [4, 8, 6], span: 8},
  night: {sky: '#9aa6c8', ground: '#3a3f5a', amb: 1.0, key: '#cfd8ff', keyI: 0.7, from: [-6, 9, 8], span: 12},
  flash: {sky: '#fffdf2', ground: '#b9b4a8', amb: 1.9, key: '#ffffff', keyI: 1.9, from: [2, 9, 7], span: 12},
  today: {sky: '#f4f1ea', ground: '#a8a49a', amb: 1.7, key: '#ffffff', keyI: 1.35, from: [0, 9, 7], span: 12},
};

/** Oak parquet in running bond (the same board texture the workshop floor uses, in herringbone). */
export const parquet = (p: Node, w: number, d: number) => floor(p, w, d, tmat(tiled(parquetTex(), w / 2.4, d / 2.4)));
export const boards = (p: Node, w: number, d: number, key: string, base: string, line: string) => floor(p, w, d, tmat(tiled(boardsTex(key, base, line), w / 2.2, d / 2.2)));
export const cobbles = (p: Node, w: number, d: number) => floor(p, w, d, tmat(tiled(cobbleTex(), w / 3, d / 3)));

/** A gallery wall: a dark red cloth above a marble dado, a gilt cornice, and a pilaster every couple of metres. */
export function galleryWall(p: Node, w: number, h: number, z: number, o: {cloth?: string; figure?: string; dado?: string; pilasters?: number | number[]} = {}) {
  const cloth = damaskTex(o.cloth ?? 'red', o.cloth ? '#5a2f36' : '#6d3a40', o.figure ?? 'rgba(255,220,170,0.10)');
  box(p, w, h * 0.62, 0.2, tmat(tiled(cloth, w / 0.75, h / 1.5)), 0, h * 0.42, z);
  box(p, w, 0.12, 0.16, '#b9a06a', 0, h * 0.73, z + 0.03);                                        // the picture rail
  box(p, w, 0.1, 0.26, '#d9c07a', 0, h * 0.755, z + 0.04);                                         // the cornice
  box(p, w, h * 0.14, 0.24, tmat(tiled(stoneTex('dado', ['#d8cbb8', '#cbbca6', '#e2d6c4'], '#a89a86'), w / 2, 1)), 0, h * 0.07, z + 0.02);
  box(p, w, 0.06, 0.3, '#b9a06a', 0, h * 0.145, z + 0.05);
  const n = o.pilasters ?? 2, xs = Array.isArray(n) ? n : Array.from({length: n}, (_, i) => -w / 2 + (i + 0.5) * (w / n));
  for (const x of xs) { box(p, 0.36, h * 0.7, 0.34, tmat(tiled(stoneTex('pil', ['#e2d6c4', '#d8cbb8'], '#b0a28e'), 1, 4)), x, h * 0.4, z + 0.06); box(p, 0.46, 0.12, 0.4, '#d9c07a', x, h * 0.76, z + 0.06); }
}
/** A plain wall of stone, cloth or paper, with a skirting board. */
export function wall(p: Node, w: number, h: number, z: number, material: THREE.Material, skirt = '#4a3a2a') {
  box(p, w, h, 0.2, material, 0, h / 2, z); box(p, w, 0.14, 0.26, skirt, 0, 0.07, z + 0.03); box(p, w, 0.08, 0.24, '#3a2c20', 0, h - 0.04, z + 0.02);
}
/** A plain wall with plaster and a beam at the top. */
export const plasterWall = (p: Node, w: number, h: number, z: number, key: string, base: string) => wall(p, w, h, z, tmat(tiled(plasterTex(key, base), w / 3, h / 3)), '#6a5a48');

/** A gallery bench: a velvet cushion on an oak frame, with turned legs. */
export function bench(p: Node, x: number, z: number, len = 2.2, y = 0) {
  const g = grp(p, x, y, z);
  box(g, len, 0.12, 0.6, '#5a3a22', 0, 0.42, 0); box(g, len - 0.12, 0.1, 0.52, '#8a2f3a', 0, 0.53, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, 0.05, 0.4, '#4a2f1a', sx * (len / 2 - 0.18), 0.2, sz * 0.22); cyl(g, 0.075, 0.05, '#4a2f1a', sx * (len / 2 - 0.18), 0.03, sz * 0.22); }
  return g;
}
/** A plinth of stone with a moulded cap. */
export function plinth(p: Node, x: number, z: number, h = 1.1, r = 0.42) {
  const g = grp(p, x, 0, z); box(g, r, h, r, tmat(stoneTex('plinth', ['#e2d8c8', '#d6cab6'], '#b8ac98')), 0, h / 2, 0); box(g, r + 0.08, 0.08, r + 0.08, '#e8e0d2', 0, h - 0.04, 0); box(g, r + 0.1, 0.06, r + 0.1, '#c9bda8', 0, 0.03, 0); return g;
}
/** A tall window: a stone surround, glazing bars, and daylight beyond. */
export function tallWindow(p: Node, x: number, z: number, w = 1.6, h = 3.0, y0 = 0.4) {
  const g = grp(p, x, y0, z);
  box(g, w + 0.24, h + 0.24, 0.18, '#d8cbb8', 0, h / 2, 0);
  panel(g, w, h, lit('#f4f8ff', 1.1), 0, h / 2, 0.1);
  for (let i = 1; i < 3; i++) box(g, 0.06, h, 0.06, '#e2d6c4', -w / 2 + i * w / 3, h / 2, 0.12);
  for (let i = 1; i < 4; i++) box(g, w, 0.05, 0.06, '#e2d6c4', 0, i * h / 4, 0.12);
  box(g, w + 0.36, 0.1, 0.3, '#c9bda8', 0, -0.02, 0.04);
  return g;
}
/** A tall door of dark oak, two leaves, with a brass plate and a fanlight. */
export function door(p: Node, x: number, z: number, w = 1.7, h = 3.1, plate?: [string, string]) {
  const g = grp(p, x, 0, z), leaf = w / 2;
  for (const s of [-1, 1]) {
    box(g, leaf, h, 0.12, '#3f2a1a', s * leaf / 2, h / 2, 0);
    for (const yy of [0.55, 1.6, 2.55]) box(g, leaf - 0.24, h * 0.26, 0.04, '#4a3220', s * leaf / 2, yy, 0.07);
    box(g, 0.2, 0.06, 0.06, '#d9b45a', s * 0.12, h * 0.46, 0.1);
  }
  box(g, w + 0.5, 0.3, 0.36, '#d9c07a', 0, h + 0.15, 0.06);
  box(g, w + 0.3, 0.06, 0.3, '#c9bda8', 0, -0.02, 0.05);
  if (plate) brassLabel(g, 0.34 * (w / 1.7), 1.65, Math.abs(z) + 0.09, plate[0], plate[1]);
  return g;
}
/** A clock on a bracket: the sort that stands at the end of a gallery. */
export function clock(p: Node, x: number, y: number, z: number, hours = 8, mins = 35) {
  const g = grp(p, x, y, z), face = tex(`clock-${hours}-${mins}`, 256, 256, (c) => {
    c.fillStyle = '#f4efe2'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.strokeStyle = '#3a2a18'; c.lineWidth = 10; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = i % 3 ? '#3a2a18' : '#8a2f3a'; c.beginPath(); c.arc(128 + 96 * Math.sin(a), 128 - 96 * Math.cos(a), i % 3 ? 5 : 8, 0, 7); c.fill(); }
    const hand = (a: number, l: number, w: number) => { c.strokeStyle = '#241a12'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + l * Math.sin(a), 128 - l * Math.cos(a)); c.stroke(); };
    hand((hours % 12 + mins / 60) / 12 * Math.PI * 2, 60, 11); hand(mins / 60 * Math.PI * 2, 92, 7);
  });
  box(g, 0.66, 0.66, 0.14, '#3a2a18', 0, 0, 0); panel(g, 0.6, 0.6, tmat(face), 0, 0, 0.08);
  box(g, 0.1, 0.1, 0.16, '#3a2a18', 0, -0.38, 0.02);
  return g;
}
/** Today's gallery: a stanchion with a rope, and the low wall under the painting. */
export function stanchion(p: Node, x: number, z: number) {
  const g = grp(p, x, 0, z); cyl(g, 0.16, 0.04, '#b98a2c', 0, 0.02, 0); cyl(g, 0.035, 0.95, '#d9b45a', 0, 0.5, 0); cyl(g, 0.05, 0.06, '#d9b45a', 0, 0.98, 0); cyl(g, 0.028, 0.1, '#d9b45a', 0, 1.05, 0); return g;
}
/** A rope between two stanchions. */
export function rope(p: Node, a: V, b: V, col = '#7a2f4a') {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), mid = av.clone().lerp(bv, 0.5); mid.y -= 0.18;
  const curve = new THREE.QuadraticBezierCurve3(av, mid, bv), m = new THREE.MeshBasicMaterial({color: col});
  const o = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.024, 6, false), m); o.castShadow = true; p.add(o); return o;
}
/** A picture light: a brass arm and a shade over a frame, with a pool of light on the wall. */
export function pictureLight(p: Node, x: number, y: number, z: number, w = 1.2) {
  const g = grp(p, x, y, z);
  box(g, 0.05, 0.05, 0.2, '#a8842a', 0, 0.06, 0.06);                                             // the bracket off the wall
  box(g, w * 0.5, 0.16, 0.16, '#c9a23a', 0, 0, 0.2).rotation.x = -0.35;                           // the brass shade, tilted at the picture
  box(g, w * 0.44, 0.03, 0.12, lit('#ffe6a8', 1.05), 0, -0.06, 0.27).rotation.x = -0.35;          // the lit underside
  return g;
}
/** The little card beside a picture with its title and painter. */
export const label = (p: Node, x: number, y: number, z: number, t1: string, t2 = '') => brassLabel(p, x, y, z, t1, t2);
/** A wooden crate / box, planked. */
export function crate(p: Node, x: number, y: number, z: number, w: number, h: number, d: number, c = '#8a5a2c') {
  const g = grp(p, x, y, z); box(g, w, h, d, c, 0, h / 2, 0);
  for (const yy of [0.12, 0.5, 0.88]) box(g, w + 0.02, 0.06, d + 0.02, '#6a4020', 0, h * yy, 0);
  return g;
}
/** A hanging ceiling lamp on a cord, with a shade and a warm pool. */
export function ceilingLamp(p: Node, x: number, y: number, z: number, shade = '#2f6a6a') {
  const g = grp(p, x, y, z); cyl(g, 0.012, 0.9, '#241a12', 0, 0.5, 0); cyl(g, 0.26, 0.2, shade, 0, 0.06, 0, 0.1, 18); cyl(g, 0.1, 0.04, lit('#ffe9b0', 1.4), 0, -0.04, 0, 0.1, 18); return g;
}
/** A gas lamp of 1911 on a post. */
export function gasLamp(p: Node, x: number, z: number, h = 3.4) {
  const g = grp(p, x, 0, z); cyl(g, 0.08, h, '#2f3a3a', 0, h / 2, 0, 0.05); cyl(g, 0.16, 0.08, '#2f3a3a', 0, 0.04, 0, 0.2);
  for (const s of [-1, 1]) box(g, 0.06, 0.06, 0.5, '#2f3a3a', 0, h - 0.3, s * 0.2);
  box(g, 0.36, 0.42, 0.36, '#3a4a4a', 0, h - 0.02, 0); panel(g, 0.26, 0.3, lit('#ffe4a0', 1.5), 0, h - 0.02, 0.19);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) panel(g, 0.14, 0.3, lit('#ffe4a0', 1.4), sx * 0.18, h - 0.02, sz * 0.18).rotation.y = sx * Math.PI / 2;
  box(g, 0.42, 0.06, 0.42, '#2f3a3a', 0, h + 0.21, 0); return g;
}
/** A bench of green slats on iron ends: the sort on a Paris pavement. */
export function parkBench(p: Node, x: number, z: number, len = 1.8, ry = 0) {
  const g = grp(p, x, 0, z); g.rotation.y = ry;
  for (let i = 0; i < 3; i++) box(g, len, 0.05, 0.14, '#3f6a5a', 0, 0.44, -0.16 + i * 0.16);
  for (let i = 0; i < 3; i++) box(g, len, 0.14, 0.05, '#3f6a5a', 0, 0.56 + i * 0.17, 0.22);
  for (const s of [-1, 1]) { box(g, 0.07, 0.42, 0.5, '#25232a', s * (len / 2 - 0.12), 0.22, 0); box(g, 0.07, 0.55, 0.07, '#25232a', s * (len / 2 - 0.12), 0.68, 0.22); }
  return g;
}
/** A notice pasted to a door: a white sheet with printing. */
export function notice(p: Node, x: number, y: number, z: number, lines: string[], ry = 0, w = 0.5) {
  const t = tex('notice-' + lines.join('|'), 256, 360, (g) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 256, 360); g.strokeStyle = '#8a8278'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 354); g.fillStyle = '#241a12'; g.textAlign = 'center'; g.textBaseline = 'middle'; text(g, lines[0], 128, 70, 40, '#241a12', {maxWidth: 220}); lines.slice(1).forEach((l, i) => text(g, l, 128, 130 + i * 40, 24, '#4a4038', {font: 'Montserrat', weight: 700, maxWidth: 220})); });
  const o = panel(p, w, w * 1.4, tmat(t), x, y, z, ry); o.castShadow = false; return o;
}
void pop; void lamp;
