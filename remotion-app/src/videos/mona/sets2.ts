// Sets of the Mona Lisa short, part 2: the police office, his room in Paris, the hotel room in Florence, two tableaux out
// of history, the prison, and the gallery today. Same rules as part 1: built once, posed by frame number.
import * as THREE from 'three';
import {backdrop, ball, box, cyl, floor, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rod, smooth, soft, tex, tiled, tmat, torus, type G2, type Node, type V} from './kit';
import {actor, CARABINIERE, portraitTex, CITIZEN, DEALER, DETECTIVE, GUARD, KING, LEONARDO, MAGISTRATE, NAPOLEON, PERUGGIA, PICASSO, POET, POLICE, TOURIST, WORKMAN, type Actor, type Draw} from './cast';
import {boardsTex, damaskTex, framed, monaTex, oldMaster, parquetTex, plasterTex, stoneTex} from './art';
import {bench, ceilingLamp, clock, cobbles, crate, door, gasLamp, galleryWall, label, LIGHT, parkBench, parquet, pictureLight, plinth, plasterWall, rope, stanchion, tallWindow, wall, boards, type Light} from './fixtures';
import {W, type Shot} from './story';
import {monaFrame, type Builder, type Ctx, type SetDef, type Show} from './sets';

const gait = (d: Draw, n = 6) => Object.fromEntries(Array.from({length: n}, (_, i) => ['w' + i, {...d, phase: i / n}])) as Record<string, Draw>;
const step = (f: number, n = 6, frames = 5) => 'w' + (Math.floor(f / frames) % n);

/** A curtain, drawn as folds hanging from a rail: three panels of different shade, each with a rounded hem. */
function curtain(p: Node, x: number, y: number, z: number, w: number, h: number, col = '#8a2f3a', dark = '#6a2029') {
  rod(p, [x - w / 2 - 0.1, y, z], [x + w / 2 + 0.1, y, z], 0.035, '#7a5a2a');
  for (let i = 0; i < 3; i++) {
    const cw = w / 3, cx = x - w / 2 + cw / 2 + i * cw;
    box(p, cw * 0.94, h, 0.06, i % 2 ? col : dark, cx, y - h / 2, z + 0.02);
    cyl(p, cw * 0.47, 0.06, i % 2 ? col : dark, cx, y - h, z + 0.02, cw * 0.47, 14).rotation.x = Math.PI / 2;
  }
}

// ------------------------------------------------------------------ the police office of the Préfecture
export const police: Builder = (root) => {
  backdrop(root, ['#2f3a2e', '#161d16'], 0.9);
  parquet(root, 14, 14);
  wall(root, 14, 5.2, -3.0, tmat(tiled(damaskTex('office', '#3d4a38', 'rgba(214,226,190,0.07)'), 14 / 0.7, 5.2 / 1.4)), '#2a2a24');
  box(root, 14, 1.15, 0.14, '#3a2a1c', 0, 0.575, -2.9);                                           // the dado
  box(root, 14, 0.1, 0.2, '#5a4228', 0, 1.17, -2.88);
  box(root, 14, 0.24, 0.34, '#2a2a24', 0, 4.9, -2.86);
  tallWindow(root, -3.6, -2.95, 1.5, 2.6, 1.5); tallWindow(root, 3.6, -2.95, 1.5, 2.6, 1.5);
  // the desk, with its papers, its lamp, its inkwell and its chair; a filing cabinet; the Republic on the wall
  const desk = grp(root, 1.15, 0, -1.7);
  box(desk, 2.9, 0.12, 1.2, '#5a3a20', 0, 0.86, 0);
  box(desk, 2.7, 0.66, 1.0, '#4a2f1a', 0, 0.5, -0.05);
  for (let i = 0; i < 3; i++) { box(desk, 0.82, 0.18, 0.04, '#6a4526', -0.9 + i * 0.9, 0.62, 0.52); ball(desk, 0.03, '#c9a23a', -0.55 + i * 0.9, 0.62, 0.55); }
  box(desk, 0.9, 0.02, 0.5, '#efe8d6', -0.5, 0.93, 0.1).rotation.y = 0.2;
  box(desk, 0.7, 0.01, 0.4, '#f4efe2', -0.3, 0.95, 0.16).rotation.y = -0.1;
  cyl(desk, 0.07, 0.1, '#2a2a34', 0.75, 0.97, -0.05); cyl(desk, 0.03, 0.32, '#2a2a34', 0.75, 1.15, -0.05);
  const shade = cyl(desk, 0.24, 0.2, '#3f6a4a', 0.75, 1.32, -0.05, 0.11, 16); shade.rotation.x = 0;
  ball(desk, 0.09, lit('#ffe6a8', 1.4), 0.75, 1.3, -0.05);
  cyl(desk, 0.06, 0.08, '#1d2a2a', 0.2, 0.98, 0.05);
  // the chair behind, and the inspector's coat on its back
  const chair = grp(root, 2.35, 0, -0.6);
  box(chair, 1.0, 0.1, 0.9, '#4a2f1a', 0, 0.55, 0); box(chair, 1.0, 0.9, 0.1, '#4a2f1a', 0, 1.05, 0.4);
  for (const s of [-1, 1]) box(chair, 0.09, 0.55, 0.09, '#3a2416', s * 0.42, 0.28, 0.36);
  const cab = grp(root, -4.6, 0, -2.1);
  box(cab, 1.3, 2.2, 0.8, '#4a3a28', 0, 1.1, 0);
  for (let i = 0; i < 4; i++) box(cab, 1.2, 0.44, 0.05, '#5a4832', 0, 0.4 + i * 0.53, 0.42);
  for (let i = 0; i < 4; i++) ball(cab, 0.04, '#c9a23a', 0, 0.4 + i * 0.53, 0.46);
  framed(root, 1.1, 1.3, oldMaster(5, false), -1.7, 2.6, -2.9, {bar: 0.09, lit: true});
  clock(root, 2.4, 3.4, -2.9, 9, 10);
  for (const x of [-3.0, 2.4]) ceilingLamp(root, x, 5.0, 1.2, '#3a4a3a');
  const poet = actor(root, POET, {a: {expr: 'nervous', pose: 'hold', prop: 'hat'}, b: {expr: 'shock', pose: 'panic'}, c: {expr: 'dazed', pose: 'cross'}} as Show, 0, 0, 0, {scale: 1});
  const cop = actor(root, POLICE(0), {a: {expr: 'stern', pose: 'point'}, b: {expr: 'neutral', pose: 'cross'}} as Show, 0, 0, 0, {scale: 1});
  const cop2 = actor(root, POLICE(1), {a: {expr: 'neutral', pose: 'cross'}, b: {expr: 'stern', pose: 'hold', prop: 'paper'}} as Show, 0, 0, 0, {scale: 0.99});
  const pic = actor(root, PICASSO, {a: {expr: 'nervous', pose: 'hips'}, b: {expr: 'shock', pose: 'panic'}, c: {expr: 'stern', pose: 'point'}} as Show, 0, 0, 0, {scale: 1});
  const det = actor(root, DETECTIVE, {a: {expr: 'stern', pose: 'write', prop: 'notebook'}, b: {expr: 'neutral', pose: 'point'}} as Show, 0, 0, 0, {scale: 1});
  return {
    light: () => LIGHT.office,
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      [poet, cop, cop2, pic, det].forEach((p) => (p.node.visible = false));
      if (v === 'poet') {                                                                          // they bring the poet in
        poet.node.visible = cop.node.visible = cop2.node.visible = true;
        poet.show(f > W(132) ? 'b' : 'a'); poet.node.position.set(-0.62, 0, -1.05); poet.flip(true); poet.tick(f, cam);
        cop.show('a'); cop.node.position.set(0.25, 0, -0.95); cop.flip(true); cop.tick(f, cam);
        cop2.show('b'); cop2.node.position.set(1.6, 0, -1.2); cop2.flip(true); cop2.tick(f, cam);
        cop.node.position.y = hop(f, W(131), 0.04, 8);
      } else if (v === 'picasso') {                                                                 // and a young Picasso
        pic.node.visible = det.node.visible = cop.node.visible = true;
        pic.show(f > W(135) ? 'b' : 'a'); pic.node.position.set(-0.45, 0, -1.05); pic.flip(true); pic.tick(f, cam);
        det.show('a'); det.node.position.set(0.95, 0, -0.9); det.flip(true); det.tick(f, cam);
        cop.show('b'); cop.node.position.set(1.7, 0, -1.3); cop.flip(true); cop.tick(f, cam);
      }
    },
  };
};

// ------------------------------------------------------------------ his room in Paris
export const room: Builder = (root) => {
  backdrop(root, ['#4a4432', '#221f18'], 0.9);
  boards(root, 12, 12, 'room', '#8a6a44', '#5a4228');
  plasterWall(root, 12, 4.2, -3.0, 'room', '#c9bda0');
  box(root, 12, 0.1, 0.2, '#6a5a44', 0, 0.05, -2.9);
  // faded paper, a bed against the wall, a table, a stove, a window with a curtain
  box(root, 12, 2.0, 0.06, tmat(tiled(damaskTex('room', '#b9ac8e', 'rgba(120,100,70,0.10)'), 12 / 0.8, 2.0 / 1.6)), 0, 1.4, -2.96);
  const bed = grp(root, -2.6, 0, -1.8);
  box(bed, 1.5, 0.5, 2.1, '#6a4a2c', 0, 0.35, 0);
  box(bed, 1.42, 0.22, 2.0, '#cfc4a8', 0, 0.66, 0);
  box(bed, 1.46, 0.12, 1.2, '#7a2f36', 0, 0.74, 0.35);
  box(bed, 0.9, 0.24, 0.5, '#efe8d6', 0, 0.72, -0.72);
  for (const s of [-1, 1]) box(bed, 0.12, 1.2, 0.12, '#4a3018', s * 0.7, 0.6, -0.98);
  for (let i = 0; i < 4; i++) rod(bed, [-0.62 + i * 0.41, 1.2, -1.0], [-0.62 + i * 0.41, 1.5, -1.0], 0.025, '#4a3018');
  box(bed, 1.4, 0.07, 0.09, '#4a3018', 0, 1.5, -1.0);
  const tbl = grp(root, 1.4, 0, -1.5);
  box(tbl, 1.3, 0.1, 0.85, '#7a5228', 0, 0.92, 0);
  for (const s of [-1, 1]) for (const q of [-1, 1]) box(tbl, 0.09, 0.92, 0.09, '#5a3a1c', s * 0.55, 0.46, q * 0.34);
  box(tbl, 0.5, 0.02, 0.35, '#efe8d6', 0.1, 0.97, 0.1).rotation.y = 0.3;
  box(tbl, 0.3, 0.06, 0.22, '#e9e2d0', -0.4, 1.0, -0.05);
  cyl(tbl, 0.04, 0.16, '#c9b48a', -0.42, 1.11, -0.05); ball(tbl, 0.045, lit('#ffd98a', 1.3), -0.42, 1.21, -0.05);
  const stove = grp(root, -4.6, 0, -2.2);
  box(stove, 0.9, 1.5, 0.7, '#3a3a42', 0, 0.75, 0); cyl(stove, 0.09, 1.4, '#2a2a32', 0, 2.2, 0.1);
  box(stove, 0.5, 0.14, 0.5, '#26262c', 0, 0.6, 0.32);
  tallWindow(root, 3.4, -2.96, 1.5, 2.0, 1.2);
  curtain(root, 3.4, 3.1, -2.86, 2.3, 2.3, '#7a2f36', '#5a2029');
  // the trunk, in the middle of the floor, with her inside it
  const trunk = grp(root, -1.6, 0, 0.9);
  box(trunk, 1.6, 0.62, 0.98, '#6a4526', 0, 0.31, 0);
  for (let i = 0; i < 3; i++) box(trunk, 1.62, 0.06, 1.0, '#3a3a42', 0, 0.1 + i * 0.2, 0);
  for (const s of [-1, 1]) box(trunk, 0.12, 0.64, 1.0, '#3a3a42', s * 0.5, 0.32, 0);
  box(trunk, 0.16, 0.2, 0.06, '#c9a23a', 0, 0.42, 0.5);
  const lid = grp(trunk, 0, 0.62, -0.49);
  box(lid, 1.6, 0.12, 0.98, '#5a3a1c', 0, 0.06, 0.49);
  for (const s of [-1, 1]) box(lid, 0.12, 0.44, 0.98, '#3a3a42', s * 0.5, 0.28, 0.49).rotation.x = 0;
  const herT = monaFrame(trunk, 0.0, 0.42, -0.2, 0.7, false); herT.g.rotation.set(-0.34, 0.05, 0.02);
  herT.g.position.set(0.0, 0.74, -0.16);
  const clothT = soft(ball(trunk, 0.28, '#e9e2d0', -0.2, 0.5, 0.2)); clothT.scale.set(1.2, 1.1, 0.35);
  const per = actor(root, PERUGGIA(0), {a: {expr: 'nervous', pose: 'hold'}, b: {expr: 'dazed', pose: 'shrug'}, c: {expr: 'smile', pose: 'tip'}, d: {expr: 'nervous', pose: 'both'}} as Show, 0, 0, 0, {scale: 1});
  const det = actor(root, DETECTIVE, {a: {expr: 'stern', pose: 'write', prop: 'notebook'}, b: {expr: 'neutral', pose: 'point'}, w: gait({mode: 'side', expr: 'neutral'}, 6)} as Show, 0, 0, 0, {scale: 1});
  return {
    light: () => LIGHT.room,
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      per.node.visible = det.node.visible = true;
      herT.g.visible = v === 'trunk' || v === 'question';
      clothT.visible = v === 'trunk';
      lid.rotation.x = v === 'trunk' ? -lerp(0, 1.9, smooth(f, shot.at, shot.at + 20)) : -1.9;
      if (v === 'question') {                                                                      // two men at his table, and she is in the room all along
        per.show(f > W(143) ? 'd' : 'a'); per.node.position.set(0.1, 0, -0.55); per.flip(true); per.tick(f, cam);
        det.show('a'); det.node.position.set(1.15, 0, -0.7); det.flip(true); det.tick(f, cam);
      } else if (v === 'trunk') {                                                                  // the lid comes up: a face on a plank of wood
        per.node.position.set(-1.5, 0, 0.9); per.show('b'); per.flip(false); per.tick(f, cam);
        det.node.position.set(1.0, 0, 0.2); det.show('b'); det.flip(true); det.tick(f, cam);
      } else if (v === 'believe') {                                                                // and they take his word for it
        per.show(f > W(156) ? 'c' : 'a'); per.node.position.set(0.05, 0, -0.5); per.flip(true); per.tick(f, cam);
        det.show('b'); det.node.position.set(1.35, 0, -0.9); det.flip(true); det.tick(f, cam);
      }
    },
  };
};

// ------------------------------------------------------------------ the hotel room in Florence
export const florence: Builder = (root) => {
  backdrop(root, ['#5a4632', '#241a12'], 0.9);
  boards(root, 14, 14, 'hotel', '#a8763c', '#6a4522');
  plasterWall(root, 14, 3.4, -3.0, 'hotel', '#d8c39a');
  box(root, 14, 2.6, 0.06, tmat(tiled(damaskTex('hotel', '#b98f6a', 'rgba(255,232,190,0.12)'), 14 / 0.9, 2.6 / 1.8)), 0, 2.1, -2.95);
  box(root, 14, 0.1, 0.2, '#7a5a38', 0, 3.4, -2.9);
  box(root, 14, 0.9, 0.1, '#8a6a44', 0, 0.45, -2.9);
  // a tall shuttered window with a wash of daylight, a bed with white sheets, a chair, luggage
  tallWindow(root, 2.9, -2.96, 1.5, 2.4, 1.1);
  for (let i = 0; i < 4; i++) box(root, 1.0, 0.5, 0.05, '#c9b48a', 2.9, 1.4 + i * 0.5, -2.88).rotation.y = 0.02 * i;
  const bed = grp(root, -2.2, 0, -1.7);
  box(bed, 1.6, 0.55, 2.2, '#6a4a2c', 0, 0.36, 0);
  box(bed, 1.58, 0.28, 2.15, '#f2ece0', 0, 0.74, 0);
  box(bed, 1.62, 0.1, 1.5, '#e9e2d0', 0, 0.9, 0.25);
  box(bed, 1.1, 0.28, 0.6, '#fffdf4', 0, 0.92, -0.72);
  for (const s of [-1, 1]) box(bed, 0.1, 1.5, 0.1, '#5a3a1c', s * 0.8, 0.75, -1.05);
  for (let i = 0; i < 5; i++) rod(bed, [-0.76, 1.5, -1.05 - 0], [-0.76 + i * 0.38, 1.8, -1.05], 0.03, '#5a3a1c');
  box(bed, 1.6, 0.08, 0.08, '#5a3a1c', 0, 1.8, -1.05);
  // the table by the window, with her lying on it
  const tbl = grp(root, 0.55, 0, -1.55);
  box(tbl, 1.5, 0.12, 0.95, '#7a5228', 0, 0.9, 0);
  for (const s of [-1, 1]) for (const q of [-1, 1]) box(tbl, 0.1, 0.9, 0.1, '#5a3a1c', s * 0.64, 0.45, q * 0.38);
  const herF = monaFrame(tbl, 0, 0.02, 0.02, 0.8, false);
  herF.g.rotation.set(-Math.PI / 2, 0, 0); herF.g.position.set(0, 1.02, 0.02);
  const paper = grp(tbl, 0.62, 1.0, -0.3); box(paper, 0.3, 0.02, 0.22, '#efe8d6', 0, 0, 0).rotation.y = 0.4;
  const clothF = soft(ball(root, 0.3, '#e9e2d0', 0, 0, 0)); clothF.scale.set(1.2, 0.5, 1.1);
  const case2 = grp(root, -4.4, 0, -1.9); box(case2, 0.95, 0.45, 0.6, '#5a3a1c', 0, 0.24, 0); box(case2, 0.2, 0.12, 0.06, '#c9a23a', 0, 0.3, 0.32);
  const chair = grp(root, -3.6, 0, 1.3); box(chair, 0.8, 0.1, 0.75, '#5a3a1c', 0, 0.52, 0); box(chair, 0.8, 0.85, 0.1, '#5a3a1c', 0, 1.0, -0.35); for (const s of [-1, 1]) box(chair, 0.08, 0.52, 0.08, '#4a3018', s * 0.32, 0.26, 0.3);
  const per = actor(root, PERUGGIA(0), {a: {expr: 'smile', pose: 'reach'}, b: {expr: 'grin', pose: 'both'}, c: {expr: 'smile', pose: 'tip'}, d: {expr: 'shock', pose: 'panic'}} as Show, 0, 0, 0, {scale: 1});
  const dealer = actor(root, DEALER, {a: {expr: 'shock', pose: 'hold'}, b: {expr: 'neutral', pose: 'think'}, c: {expr: 'smile', pose: 'point'}} as Show, 0, 0, 0, {scale: 1});
  const cara = actor(root, CARABINIERE(0), {a: {expr: 'stern', pose: 'point'}, b: {expr: 'stern', pose: 'cross'}} as Show, 0, 0, 0, {scale: 1});
  const cara2 = actor(root, CARABINIERE(1), {a: {expr: 'stern', pose: 'cross'}, b: {expr: 'stern', pose: 'point'}} as Show, 0, 0, 0, {scale: 1});
  return {
    light: () => LIGHT.hotel,
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      [per, dealer, cara, cara2].forEach((p) => (p.node.visible = false));
      herF.g.visible = v === 'unwrap' || v === 'dealer' || v === 'patriot';
      clothF.visible = v === 'unwrap';
      if (v === 'unwrap') {                                                                        // the cloth comes off, and there she is
        per.node.visible = dealer.node.visible = true;
        per.show('a'); per.node.position.set(1.55, 0, -0.85); per.flip(true); per.tick(f, cam);
        dealer.show(f > W(160) ? 'b' : 'a'); dealer.node.position.set(-0.75, 0, -1.05); dealer.flip(true); dealer.tick(f, cam);
        const u = smooth(f, shot.at, shot.at + 26);
        clothF.position.set(lerp(0.55, 1.7, u), lerp(1.15, 0.5, u), -1.5);
        clothF.scale.setScalar(lerp(1.2, 0.4, u));
        per.node.position.y = hop(f, W(161), 0.04, 10);
      } else if (v === 'dealer') {                                                                 // Geri cannot believe his luck
        dealer.node.visible = true; dealer.show(f > W(169) ? 'c' : 'b'); dealer.node.position.set(-0.5, 0, -1.0); dealer.flip(true); dealer.tick(f, cam);
        per.node.visible = true; per.show('c'); per.node.position.set(1.9, 0, -1.2); per.flip(true); per.tick(f, cam);
      } else if (v === 'patriot') {                                                                // and the thief, a patriot, explains himself
        per.node.visible = dealer.node.visible = true;
        per.show(f > W(176) ? 'b' : 'a'); per.node.position.set(1.05, 0, -0.85); per.flip(true); per.tick(f, cam);
        dealer.show('b'); dealer.node.position.set(-0.6, 0, -1.05); dealer.flip(true); dealer.tick(f, cam);
        per.node.position.y = hop(f, W(177), 0.06, 12);
        herF.g.position.y = 1.02 + 0.02 * Math.sin(f * 0.1);
      } else if (v === 'police') {                                                                  // the carabinieri come in
        const u = smooth(f, shot.at, shot.at + 34);
        cara.node.visible = cara2.node.visible = true;
        cara.show('a'); cara.node.position.set(lerp(3.0, 2.0, u), 0, -0.5); cara.flip(true); cara.tick(f, cam);
        cara2.show('b'); cara2.node.position.set(lerp(3.5, 2.55, u), 0, -1.1); cara2.flip(true); cara2.tick(f, cam);
        per.node.visible = dealer.node.visible = true;
        per.show('d'); per.node.position.set(0.4, 0, -0.7); per.flip(true); per.tick(f, cam);
        dealer.show('b'); dealer.node.position.set(-1.1, 0, -1.0); dealer.flip(true); dealer.tick(f, cam);
      }
    },
  };
};

// ------------------------------------------------------------------ two tableaux out of history
export const history: Builder = (root) => {
  backdrop(root, ['#2a2438', '#141020'], 0.9);
  parquet(root, 16, 16);
  // a hall of emperors: dark marble, pilasters, one great frame on the wall
  const imper = grp(root, 0, 0, 0);
  wall(imper, 16, 6.4, -3.0, tmat(tiled(damaskTex('imper', '#2a2a4a', 'rgba(200,200,255,0.06)'), 16 / 0.9, 6.4 / 1.8)), '#1a1a2a');
  box(imper, 16, 1.4, 0.16, '#20203a', 0, 0.7, -2.92);
  for (const x of [-5.6, -3.2, 3.2, 5.6]) {
    box(imper, 0.7, 6.4, 0.4, tmat(stoneTex('pil', ['#3a3a52', '#33334a'], '#22223a')), x, 3.2, -2.82);
    box(imper, 0.9, 0.2, 0.5, '#4a4a6a', x, 6.2, -2.82); box(imper, 0.9, 0.2, 0.5, '#4a4a6a', x, 0.9, -2.82);
  }
  box(imper, 2.4, 0.5, 0.24, '#4a4a6a', 0, 5.6, -2.86);
  const napFrame = framed(imper, 2.3, 3.0, portraitTex(NAPOLEON, {expr: 'stern', pose: 'heart'}, 'napoleon', ['#5d6d8a', '#2a3142']), 0, 2.05, -2.86, {bar: 0.2, depth: 0.18});
  label(imper, 1.55, 1.5, -2.8, 'NAPOLÉON Ier', 'EMPEREUR DES FRANÇAIS');
  // in front of the frame: a rope on two posts, a marble plinth with a bust
  for (const x of [-1.5, 1.5]) stanchion(imper, x, -1.1);
  rope(imper, [-1.5, 0.95, -1.1], [1.5, 0.95, -1.1], '#7a2f4a');
  // the hall of 1516: a mullioned window, a long table, Leonardo, the king, and her
  const hall = grp(root, 0, 0, 0); hall.visible = false;
  wall(hall, 18, 6.4, -3.0, tmat(tiled(stoneTex('hall', ['#d9cdb8', '#cec1a8'], '#a89a82'), 6, 4)), '#8a7f6a');
  box(hall, 18, 0.3, 0.36, tmat(stoneTex('cornice', ['#e2d6c0', '#d6caae'], '#b6a888')), 0, 5.9, -2.86);
  for (const x of [-2.9, 2.9]) {
    box(hall, 2.0, 3.4, 0.16, '#2f3a44', x, 2.7, -2.9);
    for (let i = 0; i < 3; i++) box(hall, 0.16, 3.4, 0.18, '#c9bda8', x - 0.7 + i * 0.7, 2.7, -2.86);
    for (let i = 0; i < 3; i++) box(hall, 2.0, 0.16, 0.18, '#c9bda8', x, 1.9 + i * 0.8, -2.86);
    box(hall, 2.3, 0.3, 0.3, tmat(stoneTex('arch', ['#e2d6c0', '#d6caae'], '#b6a888')), x, 4.5, -2.8);
  }
  floor(hall, 18, 16, tmat(tiled(stoneTex('marble', ['#e6ddc8', '#ddd2b8'], '#b9ad96'), 6, 5)));
  const tblH = grp(hall, 0, 0, -1.5);
  box(tblH, 2.8, 0.14, 1.1, '#6a4522', 0, 0.98, 0);
  for (const s of [-1, 1]) for (const q of [-1, 1]) box(tblH, 0.14, 0.98, 0.14, '#4a3018', s * 1.2, 0.49, q * 0.42);
  box(tblH, 2.95, 0.4, 1.2, '#8a2f3d', 0, 1.2, 0);
  for (let i = 0; i < 6; i++) box(tblH, 0.06, 0.4, 1.22, 'rgba(0,0,0,0)', 0, 0, 0);
  const herH = framed(hall, 0.62, 0.9, monaTex(0, 'smile'), 0, 1.72, -1.5, {bar: 0.09, depth: 0.08});
  herH.g.rotation.set(-0.22, 0, 0);
  const easelH = grp(hall, 0, 1.32, -1.62); for (const s of [-1, 1]) rod(easelH, [s * 0.4, -1.1, s * 0.1], [0, 0, 0], 0.03, '#6a4522');
  const leo = actor(hall, LEONARDO, {a: {expr: 'smile', pose: 'both'}, b: {expr: 'smile', pose: 'tip'}, c: {expr: 'smile', pose: 'heart'}} as Show, -1.05, 0, -0.85, {scale: 0.98});
  const king = actor(hall, KING, {a: {expr: 'grin', pose: 'both'}, b: {expr: 'shock', pose: 'panic'}, c: {expr: 'grin', pose: 'tip'}} as Show, 1.05, 0, -0.85, {scale: 0.98});
  return {
    light: (v) => (v === 'leonardo' ? LIGHT.warm : LIGHT.night),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      imper.visible = v === 'napoleon'; hall.visible = v === 'leonardo';
      if (v === 'napoleon') {                                                                      // he shakes his head: he never took her
        napFrame.g.rotation.z = f >= W(182) ? 0.012 * Math.sin((f - W(182)) * 0.9) : 0.003 * Math.sin(f * 0.4);
      } else {                                                                                     // the king admires her; Leonardo stands by
        leo.show(f >= W(187) ? 'c' : 'a'); leo.node.position.set(-1.05, 0, -0.85); leo.tick(f, cam);
        king.show(f >= W(188) ? 'c' : 'a'); king.node.position.set(1.05, 0, -0.85); king.tick(f, cam);
        herH.pic.rotation.z = 0;
      }
    },
  };
};

// ------------------------------------------------------------------ the prison in Florence
export const jail: Builder = (root) => {
  backdrop(root, ['#6a707e', '#26292f'], 0.95);
  floor(root, 12, 14, tmat(tiled(stoneTex('cell', ['#8a8478', '#7f7a6e'], '#5f5a50'), 5, 6)));
  wall(root, 12, 5.2, -3.0, tmat(tiled(stoneTex('cellw', ['#9a9488', '#8e887c'], '#6a655c'), 5, 4)), '#4a4640');
  box(root, 12, 0.3, 14, '#8a8478', 0, 5.1, -0.5);
  // a high barred window, the bench, the bucket, and the tallies scratched in the stone
  const win = grp(root, 1.6, 0, -2.92);
  box(win, 1.5, 1.3, 0.14, '#c9c4b4', 0, 3.5, 0); box(win, 1.3, 1.15, 0.1, lit('#dfe6f4', 1.15), 0, 3.5, 0.02);
  for (let i = 0; i < 3; i++) box(win, 0.06, 1.2, 0.08, '#3a3a42', -0.4 + i * 0.4, 3.5, 0.08);
  box(win, 1.3, 0.06, 0.08, '#3a3a42', 0, 3.5, 0.08);
  box(root, 2.4, 0.16, 0.7, '#6a5a44', -2.6, 0.55, -2.5);
  for (const s of [-1, 1]) box(root, 0.14, 0.55, 0.6, '#5a4a38', -2.6 + s * 1.0, 0.28, -2.5);
  const bucket = grp(root, 2.6, 0, -1.6); cyl(bucket, 0.2, 0.34, '#5a5a52', 0, 0.17, 0); cyl(bucket, 0.18, 0.02, '#3a3a36', 0, 0.33, 0);
  // the tallies: four strokes and a fifth across, seven months of them
  const tallies = grp(root, -1.35, 0, -2.94);
  for (let i = 0; i < 7; i++) {
    const x = (i % 4) * 0.18, y = 1.9 - Math.floor(i / 4) * 0.3;
    box(tallies, 0.03, 0.2, 0.02, '#3a3630', x, y, 0.02);
  }
  for (let g0 = 0; g0 < 4; g0++) box(tallies, 0.62, 0.03, 0.02, '#3a3630', 0.27, 1.8 - g0 * 0.3, 0.02);
  // the iron bars between him and us
  const bars = grp(root, 0, 0, 0.35);
  for (let i = 0; i < 9; i++) box(bars, 0.06, 5.2, 0.06, '#2a2a30', -1.9 + i * 0.48, 2.6, 0);
  box(bars, 4.2, 0.1, 0.1, '#2a2a30', 0, 1.4, 0); box(bars, 4.2, 0.1, 0.1, '#2a2a30', 0, 4.0, 0);
  for (let i = 0; i < 2; i++) box(root, 0.55, 5.2, 0.5, tmat(stoneTex('pillar', ['#9a9488', '#8e887c'], '#6a655c')), -2.55 + i * 5.1, 2.6, 0.35);
  const per = actor(root, PERUGGIA(0), {a: {expr: 'dazed', pose: 'cross'}, b: {expr: 'dazed', pose: 'shrug'}, c: {expr: 'smile', pose: 'hips'}, w: gait({mode: 'side', expr: 'dazed'}, 6)} as Show, 0, 0, 0, {scale: 1});
  return {
    light: () => LIGHT.cell,
    tick: ({f, cam}) => {
      per.node.visible = true;
      per.show(f > W(197) ? 'c' : f > W(196) ? 'b' : 'a');
      per.node.position.set(0.35, 0, -1.1); per.flip(true);
      per.node.position.y = 0.02 * Math.sin(f * 0.2);
      per.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the gallery today
export const today: Builder = (root) => {
  backdrop(root, ['#c9c2b0', '#8a8478'], 0.95);
  parquet(root, 18, 18);
  box(root, 18, 4.6, 0.3, tmat(tiled(stoneTex('today', ['#e4dcc6', '#d8cfb6'], '#bcb29a'), 9, 3)), 0, 2.3, -3.0);
  box(root, 18, 0.4, 0.4, tmat(stoneTex('tband', ['#efe8d4', '#e3dbc4'], '#c4baa2')), 0, 4.5, -2.86);
  box(root, 18, 0.5, 0.34, tmat(stoneTex('tdado', ['#e8e0ca', '#dcd3ba'], '#beb49c')), 0, 0.25, -2.9);
  // an arch behind her case, and a big label
  const arch = grp(root, 0, 0, -2.78);
  for (let i = 0; i < 13; i++) { const t = i / 12, ang = Math.PI * t; box(arch, 0.42, 0.34, 0.3, tmat(stoneTex('tarch', ['#efe8d4', '#e3dbc4'], '#c4baa2')), Math.cos(ang) * 1.55, 3.3 + Math.sin(ang) * 1.55, 0).rotation.z = ang; }
  for (const s of [-1, 1]) box(arch, 0.4, 3.3, 0.3, tmat(stoneTex('tarch2', ['#efe8d4', '#e3dbc4'], '#c4baa2')), s * 1.55, 1.65, 0);
  // her: on a dark plinth, under glass, roped off, lit from above
  const caseG = grp(root, 0, 0, -2.2);
  box(caseG, 1.9, 0.9, 0.6, '#2a2a32', 0, 0.45, 0);
  box(caseG, 1.96, 0.08, 0.66, '#1e1e26', 0, 0.92, 0);
  const her = monaFrame(caseG, 0, 1.75, 0, 1.03, false);
  box(caseG, 1.46, 1.7, 0.05, '#1a1a22', 0, 1.75, -0.11);
  const glassCase = soft(panel(caseG, 1.56, 2.0, new THREE.MeshBasicMaterial({color: '#dfe9f0', transparent: true, opacity: 0.13, depthWrite: false}), 0, 1.72, 0.24));
  for (const s of [-1, 1]) rod(caseG, [s * 0.9, 0.1, -0.2], [s * 0.9, 0.1, 0.2], 0.04, '#1e1e26');
  // the frame of the case, in brass, and the light on her
  for (const s of [-1, 1]) box(caseG, 0.06, 2.0, 0.5, '#8a7a4a', s * 0.78, 1.72, 0.1);
  box(caseG, 1.62, 0.06, 0.5, '#8a7a4a', 0, 2.72, 0.1);
  const spot = soft(panel(caseG, 2.0, 2.4, new THREE.MeshBasicMaterial({map: tex('spot', 128, 128, (g) => { const r = g.createRadialGradient(64, 40, 4, 64, 64, 70); r.addColorStop(0, 'rgba(255,238,190,0.42)'); r.addColorStop(1, 'rgba(255,238,190,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), 0, 1.9, 0.3));
  void spot;
  for (const s of [-1, 1]) stanchion(caseG, s * 1.35, 0.85);
  rope(caseG, [-1.35, 1.0, 0.85], [1.35, 1.0, 0.85], '#7a2f4a');
  const tLabel = grp(caseG, 1.5, 1.15, 0.5);
  box(tLabel, 0.66, 0.46, 0.03, '#f4efe2', 0, 0, 0); box(tLabel, 0.68, 0.48, 0.02, '#c9c2b4', 0, 0, -0.01);
  tLabel.rotation.y = -0.3;
  // the crowd, with their phones up
  const crowd = Array.from({length: 9}, (_, i) => actor(root, TOURIST(i), {a: {expr: 'smile', back: true, pose: 'phone', prop: 'phone'}, b: {expr: 'grin', back: true, pose: 'phone', prop: 'phone'}, c: {expr: 'shock', pose: 'tip'}} as Show, 0, 0, 0, {scale: 0.95, res: 0.6}));
  return {
    light: () => LIGHT.today,
    tick: ({f, cam, shot}) => {
      crowd.forEach((c, i) => {
        const row = Math.floor(i / 3), col = i % 3;
        c.node.visible = true; c.node.position.set(-1.9 + col * 1.2 + (row % 2) * 0.3, 0, 0.9 + row * 1.0);
        c.show(i % 3 === 1 ? 'b' : 'a'); c.tick(f, cam);
      });
      her.look(0, 0);
      void shot;
    },
  };
};
