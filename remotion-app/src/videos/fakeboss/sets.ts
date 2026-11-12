// Sets of the fake boss short, part 1: the employee's desk, the call as she sees it, the callers' back room, the
// handwritten sheet, the message. Each builder fills a group once and returns a tick that poses it for a frame (motion
// is a pure function of the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, box, cyl, floor, grainTex, grp, hop, lamp, lit, panel, pool, pop, rng, rod, rrect, shake, smat, smooth, soft, tex, text, tiled, tmat, woodTex,
  type G2, type V} from './kit';
import {actor, BOSS, CALLER, CYAN, drawPlate, FAKE_LAWYER, LAWYER, STAFF, type Face} from './cast';
import {bubble, bundleStream, envelope, halo, laptop, mug, officeChair, plant, ringLight, screenTex, signTex, skylineTex, table} from './props';
import {W, type Shot} from './story';

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

export const INK = '#15121c';
/** letters with a dark edge on nothing: labels that stand in the set */
export const label = (key: string, w: number, h: number, lines: [string, number, number, string?, ('Anton' | 'Montserrat')?][]) => tex('label-' + key, w, h, (g) => {
  for (const [s, size, y, col, font] of lines) text(g, s, w / 2, y * h, size, col ?? '#ffffff', {font: font ?? 'Anton', stroke: INK, sw: size * 0.22, maxWidth: w * 0.94});
});
/** a white tick in a green disc: done, sent, approved */
export const tickTex = () => tex('tick', 128, 128, (g) => {
  g.fillStyle = '#2fbf71'; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(38, 66); g.lineTo(57, 85); g.lineTo(91, 45); g.stroke();
});
/** a telephone handset, as on the buttons of a call */
const handset = (g: G2, x: number, y: number, s: number, rot = 0) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.52; g.lineCap = 'round';
  g.beginPath(); g.arc(0, s * 1.05, s * 1.3, Math.PI * 1.27, Math.PI * 1.73); g.stroke(); g.restore();
};
/** somebody's picture in a round frame, as a call or a mail program shows it: a photograph, nothing about it says "made up" */
export const avatar = (g: G2, x: number, y: number, r: number, face: Face) => {
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.fillStyle = '#cfe0ee'; g.fillRect(x - r, y - r, 2 * r, 2 * r); drawPlate(g, x, y + r * 0.2, r * 0.86, face, {real: true, frame: false}); g.restore();
  g.strokeStyle = INK; g.lineWidth = r * 0.13; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
};
/** the picture a call shows of whoever is speaking, with a red LIVE flag */
export const tile = (face: Face) => screenTex('tile-' + face, (g, w, h) => {
  g.fillStyle = face === 'boss' ? '#3f5580' : '#5a4636'; g.fillRect(0, 0, w, h); drawPlate(g, w / 2, h / 2 + 30, 150, face, {real: true, frame: false});
  g.fillStyle = '#e3342f'; rrect(g, w - 150, 18, 132, 46, 12); g.fill(); text(g, '● LIVE', w - 84, 43, 30, '#ffffff', {font: 'Montserrat'});
}, 512, 368, '#3f5580');
/** a plate on its own: hung on a rail, lying on a desk, standing on a pole */
export const plateTex = (face: Face) => tex('plate-' + face, 240, 290, (g) => drawPlate(g, 120, 145, 100, face));

// ------------------------------------------------------------------ the accounts desk: where the call lands
export const desk: Builder = (root) => {
  backdrop(root, ['#27344a', '#3a4a66']);
  floor(root, 14, 12, tmat(tiled(grainTex('desk-carpet', '#6d7f96', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, '#b9cdbf', 0, 2.8, -2.1); box(root, 9, 0.22, 0.34, '#f1ebe0', 0, 0.11, -2.08);
  box(root, 1.3, 1.5, 0.08, '#f1ebe0', -0.95, 1.85, -1.96); panel(root, 1.16, 1.36, smat(skylineTex('desk', '#8fd0ff', '#e2f4ff', '#7f95b0', '#eaf6ff', 5), 1), -0.95, 1.85, -1.915);
  box(root, 0.05, 1.36, 0.03, '#f1ebe0', -0.95, 1.85, -1.9); box(root, 1.16, 0.05, 0.03, '#f1ebe0', -0.95, 1.85, -1.9);
  // the department's sign, and the boss's portrait: this is what the real one looks like
  panel(root, 1.1, 0.3, smat(signTex('accounts', 440, 120, '#2b3550', '#ffffff', [['ACCOUNTS', 92, 0.56]]), 1), 0.75, 2.52, -1.94);
  box(root, 0.62, 0.8, 0.05, '#6b4628', 0.75, 1.82, -1.94);
  panel(root, 0.52, 0.7, smat(tex('portrait-boss', 260, 350, (g, w, h) => {
    g.fillStyle = '#d9e6ef'; g.fillRect(0, 0, w, h); drawPlate(g, w / 2, 152, 104, 'boss', {real: true, frame: false});
    g.fillStyle = '#2b3550'; g.fillRect(0, h - 64, w, 64); text(g, 'OUR CEO', w / 2, h - 30, 44, '#ffffff');
  }), 1), 0.75, 1.82, -1.91);
  box(root, 0.6, 1.2, 0.5, '#8a94a3', 1.32, 0.6, -1.6); for (const y of [0.3, 0.7, 1.05]) box(root, 0.5, 0.025, 0.02, '#5b6170', 1.32, y, -1.34);     // filing cabinet
  plant(root, -1.35, -1.4, 1.05, '#d9a441');
  table(root, 0, 0.3, 1.9, 0.72, {top: '#e9d3b4', leg: '#7f8796', skirt: '#d6bd9a'});
  officeChair(root, -0.28, -0.38, '#3f5d8a');
  const lid = smat(tex('lid-accounts', 420, 204, (g, w, h) => {
    g.fillStyle = '#aeb7c3'; g.fillRect(0, 0, w, h); g.fillStyle = '#3f6fb5'; rrect(g, 56, 50, w - 112, 104, 20); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); text(g, 'ACCOUNTS', w / 2, 106, 66, '#ffffff');
  }), 1);
  laptop(root, -0.28, 0.74, 0.36, {ry: Math.PI, w: 0.52, back: lid});
  mug(root, 0.5, 0.74, 0.45, '#3f9e7a'); box(root, 0.3, 0.02, 0.2, '#f3f1ea', 0.74, 0.75, 0.3).rotation.y = 0.2; box(root, 0.16, 0.03, 0.22, '#3a3f4a', -0.8, 0.755, 0.4).rotation.y = -0.2;
  const emp = actor(root, STAFF(0), {
    type: {expr: 'neutral', pose: 'type', mode: 'sit'}, look: {expr: 'smile', pose: 'think', mode: 'sit'}, read: {expr: 'neutral', pose: 'think', mode: 'sit'},
    wave: {expr: 'smile', pose: 'wave', mode: 'sit'}, nod: {expr: 'smile_closed', pose: 'both', mode: 'sit'}, done: {expr: 'smile', pose: 'desk', mode: 'sit'},
  }, -0.28, 0.44, -0.32, {scale: 1.08, res: 1.2});
  const cardT = (key: string, draw: (g: G2, w: number, h: number) => void, bg = '#f4f6fa') => screenTex('desk-' + key, draw, 512, 368, bg);
  const T = {
    ring: cardT('ring', (g, w) => {                                                                     // an incoming video call, from the boss
      drawPlate(g, w / 2, 124, 84, 'boss', {real: true}); text(g, 'THE BOSS', w / 2, 262, 54, '#ffffff'); text(g, 'VIDEO CALL', w / 2, 316, 28, '#9fb4c8', {font: 'Montserrat', spacing: 4});
      for (const [x, c] of [[78, '#e3342f'], [w - 78, '#2fbf71']] as const) { g.fillStyle = c; g.beginPath(); g.arc(x, 150, 46, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); handset(g, x, 150, 22, x < 100 ? 2.36 : 0); }
    }, '#1d2a44'),
    email: cardT('email', (g, w) => {                                                                   // a message in the chief executive's name
      envelope(g, w / 2 - 34, 150, 176); avatar(g, w / 2 + 96, 92, 58, 'boss');
      g.fillStyle = '#2b3550'; rrect(g, 60, 262, w - 120, 78, 18); g.fill(); text(g, 'FROM: THE CEO', w / 2, 304, 52, '#ffffff');
    }),
    live: tile('boss'),
    sent: cardT('sent', (g, w, h) => {
      g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, 128, 86, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = '#2fbf71'; g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w / 2 - 44, 132); g.lineTo(w / 2 - 12, 164); g.lineTo(w / 2 + 48, 92); g.stroke();
      text(g, 'WIRE SENT', w / 2, h - 66, 84, '#ffffff', {stroke: INK, sw: 14});
    }, '#2fbf71'),
  };
  const scr = new THREE.MeshBasicMaterial({map: T.ring}), bub = bubble(root, 0.44, 1.52, 0.2, 0.86, 0.62, scr, [-0.5, -0.3]);
  const fly = bundleStream(root, 7, 0.85);
  return {
    light: () => ({...LIGHT.room, amb: 1.5, keyI: 1.15}),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      let on: keyof typeof T | null = null, st = 'type', at = shot.at, jump = -99;
      if (v === 'ring') { at = W(1) - 1; on = f >= at ? 'ring' : null; st = f >= W(2) + 4 ? 'look' : 'type'; jump = W(2) + 4; }   // it rings on 'boss'; she looks up on 'calls'
      else if (v === 'email') { at = W(55) - 2; on = f >= at ? 'email' : null; st = f >= W(55) + 6 ? 'read' : 'type'; }
      else if (v === 'answer') { on = 'live'; st = 'wave'; }
      else if (v === 'believe') { on = 'live'; st = 'nod'; at = shot.at - 30; }                          // the call has been up since 'answer': the card does not arrive again
      else if (v === 'send') { const sent = f >= W(113); on = sent ? 'sent' : 'live'; at = sent ? W(113) : shot.at - 30; st = sent ? 'done' : 'type'; jump = W(113); }
      bub.g.visible = !!on; if (on) scr.map = T[on];
      const ringing = v === 'ring' && on ? 0.03 * Math.sin(f * 0.9) : 0;                                 // it rings
      bub.g.scale.setScalar(0.93 * pop(f, at, 7) * (1 + ringing)); bub.g.position.y = 1.52 + 0.012 * Math.sin(f * 0.08); bub.g.rotation.z = ringing * 1.4;
      emp.show(st); emp.node.position.y = 0.44 + hop(f, jump, 0.06, 8) + (v === 'believe' ? 0.022 * Math.max(0, Math.sin(f * 0.42)) : 0); emp.tick(f, cam);   // she nods along
      if (v === 'send') fly.set(f, W(113) - 4, shot.at + 200, () => [-0.28, 1.0, 0.4], [0.7, 2.7, 0.4], (i) => [2.3, 1.7 + 0.2 * (i % 3), -0.3], 0.034); else fly.hide();
    },
  };
};

// ------------------------------------------------------------------ the call, as it looks on her screen
const booksTex = () => tex('books', 512, 256, (g, w, h) => {
  const q = rng(23), cols = ['#7a3b34', '#35506e', '#4f6b4a', '#8a6a3a', '#5a4468', '#a8946a', '#2f3b4a'];
  g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h);
  for (let row = 0; row < 2; row++) {
    const y0 = row * 128; g.fillStyle = '#5a4028'; g.fillRect(0, y0 + 116, w, 12);
    for (let x = 4; x < w - 8;) { const bw = 14 + Math.round(q() * 18), bh = 80 + Math.round(q() * 30); g.fillStyle = cols[Math.floor(q() * cols.length)]; g.fillRect(x, y0 + 116 - bh, bw, bh); g.fillStyle = 'rgba(255,230,170,.5)'; g.fillRect(x + 3, y0 + 116 - bh + 12, bw - 6, 5); x += bw + 2; }
  }
}, true);
export const call: Builder = (root) => {
  backdrop(root, ['#141c30', '#2a3a5c']);
  floor(root, 14, 12, tmat(tiled(woodTex('call-floor', '#8a6a4a', '#5a4028'), 5, 5)));
  // the boss's corner office
  const exec = grp(root);
  box(exec, 9, 5.6, 0.3, '#3f5580', 0, 2.8, -2.1);
  box(exec, 1.7, 2.2, 0.08, '#e8e1d2', -0.72, 2.0, -1.96); panel(exec, 1.56, 2.06, smat(skylineTex('exec', '#ffb37a', '#ffe1b8', '#5a4a6a', '#ffe9a8', 9), 1), -0.72, 2.0, -1.915);
  box(exec, 0.05, 2.06, 0.03, '#e8e1d2', -0.72, 2.0, -1.9);
  for (const y of [1.45, 2.1]) box(exec, 1.0, 0.05, 0.26, '#6b4628', 0.88, y, -1.86);
  ([['#f2c230', 0.24, 0.56], ['#c9d2de', 0.3, 0.84], ['#f2c230', 0.2, 1.12]] as const).forEach(([c, hh, x]) => { box(exec, 0.12, 0.05, 0.12, '#3a2c1e', x, 2.15, -1.86); cyl(exec, 0.05, hh, c, x, 2.17 + hh / 2, -1.86, 0.08); });   // awards
  ([['#7a3b34', 0.3], ['#35506e', 0.36], ['#a8946a', 0.27], ['#4f6b4a', 0.33]] as const).forEach(([c, hh], i) => box(exec, 0.085, hh, 0.2, c, 0.56 + i * 0.1, 1.475 + hh / 2, -1.86));
  plant(exec, 1.38, -1.3, 1.2, '#2b3550');
  // the lawyer's office: books to the ceiling
  const law = grp(root);
  box(law, 9, 5.6, 0.3, tmat(tiled(booksTex(), 3.2, 4.2)), 0, 2.8, -2.1);
  box(law, 0.7, 0.9, 0.06, '#c9a84a', 0.92, 2.25, -1.93); panel(law, 0.6, 0.8, smat(tex('diploma', 150, 200, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.fillStyle = '#8f8a96'; for (let i = 0; i < 6; i++) g.fillRect(24, 44 + i * 18, w - 48, 6); g.fillStyle = '#b3211d'; g.beginPath(); g.arc(w / 2, 166, 16, 0, 7); g.fill(); }), 1), 0.92, 2.25, -1.895);
  const UP = 0, SC = 1.3;
  const boss = actor(root, BOSS, {talk: {expr: 'smile'}, wire: {expr: 'stern', pose: 'point'}, hush: {expr: 'stern', pose: 'hush'}}, 0, UP, -0.3, {scale: SC, res: 1.3});
  const fake = actor(root, CALLER('boss'), {wear: {wear: true, face: 'boss'}, off: {pose: 'hold', prop: 'plate', face: 'boss'}}, 0, UP, -0.3, {scale: SC, res: 1.3});
  const lawyer = actor(root, LAWYER, {talk: {expr: 'smile', pose: 'hold', prop: 'paper'}}, 0, UP, -0.3, {scale: SC, res: 1.3});
  // what he says, in a balloon
  const say = soft(panel(root, 0.84, 0.6, smat(tex('say-wire', 430, 306, (g, w) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 12; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(62, 232); g.lineTo(18, 296); g.lineTo(132, 236); g.closePath(); g.fill(); g.stroke();
    rrect(g, 10, 10, w - 20, 230, 40); g.fill(); g.stroke(); g.fillRect(56, 220, 74, 14);
    text(g, 'WIRE', w / 2, 84, 88, INK); text(g, '$5,000,000', w / 2, 172, 80, '#e3342f', {maxWidth: w - 64});
  }), 1, true), 0.68, 1.74, 0.1));
  // his voice, as a row of bars, and a frame round his face: both turn the colour of a fake when the picture breaks up
  const barM = lamp('#ffffff', 1.15), bars = Array.from({length: 11}, (_, i) => soft(panel(root, 0.036, 0.3, barM, 0.42 + i * 0.056, 1.68, 0.14)));
  const frameM = new THREE.MeshBasicMaterial({map: tex('face-frame', 256, 288, (g, w, h) => {
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const x = sx > 0 ? 10 : w - 10, y = sy > 0 ? 10 : h - 10; g.beginPath(); g.moveTo(x + sx * 56, y); g.lineTo(x, y); g.lineTo(x, y + sy * 56); g.stroke(); }
  }), transparent: true, depthWrite: false}), frame = soft(panel(root, 0.84, 0.95, frameM, 0, 1.86, 0.12));
  // the room behind the picture
  const veil = soft(panel(root, 9, 6, new THREE.MeshBasicMaterial({color: '#04070d', transparent: true, opacity: 0, depthWrite: false}), 0, 2.6, -0.95));
  const grid = soft(panel(root, 6.4, 4.8, new THREE.MeshBasicMaterial({map: tex('grid', 256, 256, (g) => { g.strokeStyle = CYAN; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 256); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); } }),
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}), 0, 2.2, -0.93));
  const glow = halo(root, 1.5, CYAN, 0, 0, 1.75, -0.9);
  return {
    light: (v) => v === 'lawyer' ? {...LIGHT.warm, amb: 1.3, keyI: 1.0} : {...LIGHT.room, sky: '#ffe9cf', amb: 1.45, keyI: 1.1},
    tick: ({f, cam, shot}) => {
      const v = shot.v, isLaw = v === 'lawyer';
      exec.visible = !isLaw; law.visible = isLaw;
      // "It": the picture breaks up. "isn't": it is a plate. "him": the plate comes down.
      const g0 = W(18), g1 = W(19), g2 = W(20) - 1;
      const ph = v !== 'reveal' || f < g0 ? 0 : f < g1 ? 1 : f < g2 ? 2 : 3, fakeOn = ph >= 2 || (ph === 1 && (f - g0) % 2 === 0);
      boss.node.visible = !isLaw && !fakeOn; fake.node.visible = fakeOn; lawyer.node.visible = isLaw;
      boss.show(v === 'hush' ? 'hush' : v === 'wire' && f >= W(6) + 3 ? 'wire' : 'talk'); boss.node.position.y = UP + (v === 'wire' ? hop(f, W(6) + 3, 0.06, 8) : 0);
      fake.show(ph === 3 ? 'off' : 'wear'); fake.node.position.x = ph === 1 || ph === 2 ? shake(f, g1, 0.035, 7) : 0; fake.node.position.y = UP + (ph === 3 ? hop(f, g2, 0.1, 8) : 0);
      say.visible = v === 'wire' && f >= W(7) - 1; say.scale.setScalar(0.92 * pop(f, W(7) - 1, 7)); say.rotation.z = 0.035 * Math.sin(f * 0.07);
      const voiced = (v === 'voice' && f >= W(15) - 2) || (v === 'reveal' && ph < 3);
      bars.forEach((b, i) => { b.visible = voiced; b.scale.y = 0.22 + 0.78 * Math.abs(Math.sin(f * 0.47 + i * 1.3) * Math.sin(f * 0.13 + i * 0.6)); });
      const framed = (v === 'voice' && f >= W(17) - 2) || (v === 'reveal' && ph < 3);
      frame.visible = framed; frame.scale.setScalar(v === 'voice' ? 1.25 - 0.25 * smooth(f, W(17) - 2, W(17) + 4) : 1 + 0.02 * Math.sin(f * 0.5));
      const tint = ph >= 1 ? CYAN : '#ffffff'; barM.color.set(tint).multiplyScalar(1.15); frameM.color.set(tint);
      const dark = ph >= 2 ? smooth(f, g1, g1 + 4) : ph === 1 ? 0.35 : 0;
      (veil.material as THREE.MeshBasicMaterial).opacity = 0.74 * dark; (grid.material as THREE.MeshBasicMaterial).opacity = 0.34 * dark; (glow.material as THREE.MeshBasicMaterial).opacity = 0.3 * dark;
      boss.tick(f, cam); fake.tick(f, cam); lawyer.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the callers' back room: the same desk, in the dark
const chip = (g: G2, x: number, y: number, s: number) => {                                              // a box marked A.I.: whatever does the changing
  g.fillStyle = '#0b3340'; g.strokeStyle = CYAN; g.lineWidth = s * 0.07; rrect(g, x - s * 0.5, y - s * 0.36, s, s * 0.72, s * 0.12); g.fill(); g.stroke();
  text(g, 'A.I.', x, y + s * 0.03, s * 0.44, CYAN);
};
const arrow = (g: G2, x: number, y: number, s: number, c = '#8a94a3') => { g.fillStyle = c; g.beginPath(); g.moveTo(x - s, y - s * 0.34); g.lineTo(x + s * 0.1, y - s * 0.34); g.lineTo(x + s * 0.1, y - s * 0.8); g.lineTo(x + s, y); g.lineTo(x + s * 0.1, y + s * 0.8); g.lineTo(x + s * 0.1, y + s * 0.34); g.lineTo(x - s, y + s * 0.34); g.closePath(); g.fill(); };
const waves = (g: G2, x: number, y: number, n: number, c: string, seed: number) => { const q = rng(seed); g.fillStyle = c; for (let i = 0; i < n; i++) { const hh = 14 + q() * 64; rrect(g, x + i * 15, y - hh / 2, 9, hh, 4); g.fill(); } };
export const room: Builder = (root) => {
  backdrop(root, ['#06080d', '#121824']);
  floor(root, 14, 12, tmat(tiled(grainTex('room-floor', '#2a2f3a', 0.14), 5, 4)));
  box(root, 9, 5.6, 0.3, tmat(tiled(grainTex('room-wall', '#333b4a', 0.1), 4, 3)), 0, 2.8, -2.1);
  rod(root, [-4, 3.1, -1.9], [4, 3.1, -1.9], 0.05, '#4a5262'); rod(root, [1.55, 0, -1.9], [1.55, 3.1, -1.9], 0.04, '#4a5262');
  // a rail with the face that is not in use on it
  box(root, 1.2, 0.05, 0.05, '#5b6170', -0.85, 2.78, -1.9);
  const spare = (face: Face) => { const p = soft(panel(root, 0.42, 0.5, smat(plateTex(face), 1.05, true), -0.85, 2.48, -1.88)); rod(root, [-0.85, 2.74, -1.89], [-0.85, 2.78, -1.89], 0.012, '#c9ced6'); return p; };
  const spareBoss = spare('boss'), spareLaw = spare('lawyer');
  table(root, 0, 0.3, 1.9, 0.72, {top: '#3a4254', leg: '#232834', skirt: '#2c3342'});
  laptop(root, 0.12, 0.74, 0.36, {ry: Math.PI, w: 0.52, body: '#2b303c', back: lit('#0d3b44', 1)});
  ringLight(root, 1.12, -0.35, 1.8, -0.5);
  box(root, 0.3, 0.02, 0.2, '#c9ced6', -0.62, 0.75, 0.32).rotation.y = -0.25;
  // the plate on the desk: a name, and the name is somebody's
  const sign = grp(root, 0.66, 0.74, 0.6);
  box(sign, 0.58, 0.17, 0.07, '#c9a84a', 0, 0.085, 0); box(sign, 0.62, 0.02, 0.1, '#6b4628', 0, 0.01, 0);
  panel(sign, 0.54, 0.135, smat(tex('nameplate', 540, 135, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f4dc8a'); gr.addColorStop(1, '#c9a84a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = INK; rrect(g, 44, 18, w - 88, 56, 8); g.fill();                                       // the name itself is not ours to print
    text(g, 'ATTORNEY AT LAW', w / 2, 104, 34, '#3a2c08', {font: 'Montserrat', spacing: 5});
  }), 1), 0, 0.085, 0.037);
  const lying = soft(panel(root, 0.4, 0.48, smat(plateTex('lawyer'), 1.05, true), -0.56, 0.775, 0.3)); lying.rotation.set(-Math.PI / 2, 0, 0.3);
  const glow = halo(root, 1.6, CYAN, 0.2, 0.12, 1.5, -1.0);
  const X = 0.12, SC = 1.12;
  const gen = actor(root, CALLER('boss'), {off: {pose: 'hold', prop: 'plate', face: 'boss'}, wear: {wear: true, face: 'boss'}}, X, 0, -0.42, {scale: SC, res: 1.2});
  const law = actor(root, FAKE_LAWYER, {wear: {wear: true, face: 'lawyer'}, script: {pose: 'hold', prop: 'paper'}}, X, 0, -0.42, {scale: SC, res: 1.2});
  const cardT = (key: string, draw: (g: G2, w: number, h: number) => void, bg = '#0f1a2a') => screenTex('room-' + key, draw, 512, 368, bg);
  const T = {
    voice: cardT('voice', (g, w, h) => {                                                                // somebody's voice goes in, the chief executive's comes out
      waves(g, 30, 110, 9, '#8a94a3', 3); arrow(g, 196, 110, 24); chip(g, 290, 110, 124); arrow(g, 384, 110, 24, CYAN);
      waves(g, 40, 262, 16, CYAN, 8); avatar(g, 400, 258, 74, 'boss'); text(g, 'VOICE', 256, 30, 30, '#9fb4c8', {font: 'Montserrat', spacing: 6});
    }),
    face: cardT('face', (g, w, h) => {                                                                  // nobody's face goes in, the chief executive's comes out
      g.fillStyle = '#cfcadb'; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(112, 200, 82, 0, 7); g.fill(); g.stroke(); text(g, '?', 112, 208, 120, '#4a4560');
      arrow(g, 240, 200, 26, CYAN); chip(g, 256, 82, 130); drawPlate(g, 392, 200, 86, 'boss');
    }),
    out: tile('boss'), law: tile('lawyer'),
  };
  const scr = new THREE.MeshBasicMaterial({map: T.out}), bub = bubble(root, -0.62, 1.54, 0.2, 0.86, 0.62, scr, [0.5, -0.3]);
  return {
    light: () => ({...LIGHT.dark, sky: '#b9c8ff', amb: 1.05, keyI: 0.7}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, lawOn = v === 'swap' || v === 'name' || v === 'script';
      gen.node.visible = !lawOn; law.node.visible = lawOn; spareBoss.visible = lawOn; spareLaw.visible = !lawOn; sign.visible = lawOn; lying.visible = v === 'script';
      let on: keyof typeof T | null = null, at = shot.at, y = 0;
      if (v === 'ai') { gen.show('wear'); on = 'out'; }
      else if (v === 'voice') { gen.show('off'); at = W(79) - 2; on = f >= at ? 'voice' : null; }
      else if (v === 'face') { const up = f >= W(84) - 3, next = f >= W(82) - 2; gen.show(up ? 'wear' : 'off'); y = hop(f, W(84) - 3, 0.08, 8); at = next ? W(82) - 2 : W(79) - 2; on = next ? 'face' : 'voice'; }   // one take with 'voice': its card stays until this one takes its place
      else if (v === 'swap') { law.show('wear'); on = 'law'; y = hop(f, shot.at + 2, 0.07, 8); }
      else if (v === 'name') law.show('wear');
      else if (v === 'script') { law.show('script'); y = hop(f, W(103) - 14, 0.05, 8); }
      gen.node.position.y = law.node.position.y = y;
      bub.g.visible = !!on; if (on) scr.map = T[on];
      bub.g.scale.setScalar(0.93 * pop(f, at, 7)); bub.g.position.y = 1.54 + 0.012 * Math.sin(f * 0.08);
      (glow.material as THREE.MeshBasicMaterial).opacity = v === 'script' ? 0.08 : 0.2 + 0.06 * Math.sin(f * 0.15);
      gen.tick(f, cam); law.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the handwritten sheet
/** A few letters in a quick hand, as pen strokes: x to the right, y up, small letters are 1 high. */
const HAND: Record<string, {w: number; s: [number, number][][]}> = {
  L: {w: 1.4, s: [[[0.55, 2.05], [0.25, 1.95], [0.25, 1.0], [0.15, 0.05], [0.6, 0.1], [1.25, 0.0]]]},
  a: {w: 1.22, s: [[[0.95, 0.8], [0.6, 1.02], [0.2, 0.7], [0.15, 0.25], [0.45, 0.0], [0.8, 0.25], [0.95, 0.9], [0.95, 0.2], [1.15, 0.0]]]},
  w: {w: 1.52, s: [[[0.05, 1.0], [0.3, 0.0], [0.7, 0.85], [1.0, 0.0], [1.4, 1.0]]]},
  y: {w: 1.15, s: [[[0.05, 1.0], [0.5, 0.05]], [[1.0, 1.0], [0.5, 0.05], [0.15, -0.9]]]},
  e: {w: 1.08, s: [[[0.15, 0.5], [0.85, 0.55], [0.7, 0.95], [0.35, 1.0], [0.12, 0.6], [0.2, 0.15], [0.55, 0.0], [0.92, 0.2]]]},
  r: {w: 0.92, s: [[[0.1, 1.0], [0.14, 0.0]], [[0.14, 0.6], [0.4, 0.95], [0.82, 0.9]]]},
  C: {w: 1.48, s: [[[1.25, 1.6], [0.9, 2.0], [0.4, 1.8], [0.12, 1.0], [0.35, 0.15], [0.85, 0.0], [1.3, 0.35]]]},
  l: {w: 0.62, s: [[[0.2, 2.0], [0.22, 0.25], [0.45, 0.0]]]},
  ' ': {w: 0.85, s: []},
};
function handwrite(g: G2, s: string, x: number, y: number, size: number, color: string) {
  g.save(); g.strokeStyle = color; g.lineWidth = size * 0.16; g.lineCap = 'round'; g.lineJoin = 'round';
  const q = rng(17); let cx = x;
  for (const ch of s) {
    const gl = HAND[ch]; if (!gl) continue;
    const dy = (q() - 0.5) * size * 0.12;
    for (const st of gl.s) {
      const P = st.map(([px, py]) => [cx + (px + py * 0.2) * size, y - py * size + dy] as [number, number]);       // leaning to the right
      g.beginPath(); g.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length - 1; i++) g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
      g.lineTo(P[P.length - 1][0], P[P.length - 1][1]); g.stroke();
    }
    cx += gl.w * size;
  }
  g.restore(); return cx;
}
export const sheet: Builder = (root) => {
  backdrop(root, ['#0b0d14', '#141a26']);
  box(root, 5, 0.1, 4, tmat(tiled(woodTex('sheet-desk', '#4a3a30', '#2a1e18'), 2, 2)), 0, 0.72, 0);
  // The title is the one thing the indictment gives of the page that the film shows. What the script went on to say is left as scribble.
  const page = tex('script-page', 1024, 1365, (g, w, h) => {
    g.fillStyle = '#fbf6e4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a9c4e6'; g.lineWidth = 3; for (let y = 330; y < h - 40; y += 82) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#e59a9a'; g.lineWidth = 4; g.beginPath(); g.moveTo(118, 0); g.lineTo(118, h); g.stroke();
    const ink = '#1d2a6b', end = handwrite(g, 'Lawyer Call', 150, 232, 62, ink);
    g.strokeStyle = ink; g.lineCap = 'round'; g.lineWidth = 9; for (const dy of [34, 54]) { g.beginPath(); g.moveTo(146, 232 + dy); g.quadraticCurveTo((146 + end) / 2, 232 + dy - 12, end + 10, 232 + dy + 4); g.stroke(); }
    const q = rng(41); g.lineWidth = 6; g.lineJoin = 'round';
    for (let row = 0; row < 12; row++) {
      const base = 330 + row * 82 + 82 - 12; let x = 150 + (row % 4 === 0 ? 0 : 36);
      if (row % 4 === 0) { g.beginPath(); g.moveTo(x, base - 24); g.lineTo(x + 22, base - 24); g.stroke(); x += 44; }
      const stop = w - 70 - q() * 260;
      while (x < stop) {
        const len = 50 + q() * 130, x1 = Math.min(stop, x + len); g.beginPath(); g.moveTo(x, base - 8);
        for (let px = x + 8, up = true; px < x1; px += 9 + q() * 5, up = !up) g.lineTo(px, base - (up ? 26 + q() * 26 : 4 + q() * 8));
        g.stroke();
        if (q() < 0.12) { g.beginPath(); g.moveTo(x - 4, base - 22); g.lineTo(x1 + 4, base - 20); g.stroke(); }     // crossed out
        x = x1 + 30 + q() * 16;
      }
    }
    g.strokeStyle = 'rgba(122,84,52,0.35)'; g.lineWidth = 12; g.beginPath(); g.arc(w - 190, h - 210, 96, 0.4, 5.6); g.stroke();   // where a cup stood
  });
  const lay = grp(root, 0, 0.774, 0); lay.rotation.y = 0.045;
  const paper = panel(lay, 0.92, 1.226, tmat(page), 0, 0, 0); paper.rotation.x = -Math.PI / 2; paper.receiveShadow = true;
  const pen = grp(root, 0.56, 0.79, 0.28); pen.rotation.y = 0.5; cyl(pen, 0.014, 0.3, '#1d2a6b', 0, 0, 0).rotation.x = Math.PI / 2; cyl(pen, 0.015, 0.05, '#c9ced6', 0, 0, -0.17).rotation.x = Math.PI / 2;
  mug(root, -0.62, 0.77, -0.52, '#3a4254');
  pool(root, 1.5, '#ffe9b0', 0.2, 0, -0.1, 0.78);
  return {light: () => ({...LIGHT.warm, amb: 1.25, keyI: 1.2, from: [-3, 9, 2]}), tick: () => undefined};
};

// ------------------------------------------------------------------ the message: a window in the dark
export const mail: Builder = (root) => {
  backdrop(root, ['#0d1830', '#22386a']);
  const win = grp(root, 0, 1.42, -0.4), WW = 2.3, HH = 1.6;
  soft(panel(win, WW + 0.09, HH + 0.09, lit(INK, 1), 0, 0, -0.01));
  soft(panel(win, WW, HH, smat(tex('mail-window', 1150, 800, (g, w, h) => {
    g.fillStyle = '#f6f8fc'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3550'; g.fillRect(0, 0, w, 96);
    for (const [i, c] of ['#ff5f57', '#febc2e', '#28c840'].entries()) { g.fillStyle = c; g.beginPath(); g.arc(52 + i * 46, 48, 15, 0, 7); g.fill(); }
    text(g, 'INBOX · 1 NEW', w - 40, 50, 40, '#ffffff', {align: 'right'});
    avatar(g, 124, 206, 76, 'boss');
    text(g, 'FROM: YOUR CEO', 230, 182, 62, INK, {align: 'left'}); text(g, 'sent through an e-signature service', 232, 244, 31, '#6b7686', {font: 'Montserrat', weight: 700, align: 'left'});
    g.fillStyle = '#d5dbe6'; g.fillRect(40, 312, w - 80, 5);
  }), 1), 0, 0, 0));
  // the lines of the message come up one after another; what they say is on the quote card
  const lines = [0.94, 0.8, 0.9, 0.56].map((k, i) => { const m = soft(panel(win, WW * 0.84 * k, 0.07, lit('#b8c2d2', 1), 0, 0.12 - i * 0.145, 0.006)); m.userData = {k}; return m; });
  const nda = soft(panel(win, 0.62, 0.62, smat(tex('nda', 310, 310, (g, w, h) => {                       // the agreement to sign
    g.lineJoin = 'round'; g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 9;
    g.beginPath(); g.moveTo(52, 14); g.lineTo(196, 14); g.lineTo(250, 68); g.lineTo(250, 292); g.lineTo(52, 292); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(196, 14); g.lineTo(196, 68); g.lineTo(250, 68); g.stroke();
    text(g, 'NDA', 150, 122, 78, INK); g.fillStyle = '#b8c2d2'; for (let i = 0; i < 2; i++) g.fillRect(84, 176 + i * 24, 134, 9);
    g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(98, 232); g.lineTo(300, 232); g.lineTo(300, 284); g.lineTo(98, 284); g.lineTo(74, 258); g.closePath(); g.fill(); g.stroke(); text(g, 'SIGN HERE', 196, 261, 36, INK);
  }), 1, true), -0.72, -0.46, 0.012));
  const ring = soft(panel(win, 1.24, 0.42, smat(tex('call-lawyer', 620, 210, (g, w, h) => {              // and the lawyer to call
    g.fillStyle = '#2fbf71'; g.strokeStyle = INK; g.lineWidth = 9; rrect(g, 6, 6, w - 12, h - 12, 46); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(104, h / 2, 62, 0, 7); g.fill(); g.stroke(); g.save(); g.translate(104, h / 2 - 22); g.strokeStyle = '#2fbf71'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.arc(0, 30, 36, Math.PI * 1.27, Math.PI * 1.73); g.stroke(); g.restore();
    text(g, 'THEN CALL', 392, 74, 50, '#ffffff'); text(g, 'OUR LAWYER', 392, 138, 64, '#ffffff');
  }), 1, true), 0.44, -0.5, 0.012));
  const glow = halo(root, 2.6, '#6f9bff', 0.14, 0, 1.42, -1.2);
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      win.scale.setScalar(shot.v === 'open' ? pop(f, shot.at, 9) : 1); win.position.y = 1.42 + 0.012 * Math.sin(f * 0.06);
      lines.forEach((m, i) => { const k = shot.v === 'quote' ? smooth(f, W(63) + i * 9, W(63) + i * 9 + 12) : 0; m.visible = k > 0.01; m.scale.x = Math.max(0.01, k); m.position.x = WW * 0.42 * (k * (m.userData.k as number) - 1); });
      const a = shot.v === 'quote' ? W(70) - 2 : 1e9, b = shot.v === 'quote' ? W(73) - 2 : 1e9;
      nda.visible = f >= a; nda.scale.setScalar(pop(f, a, 8)); nda.rotation.z = -0.08 + shake(f, a, 0.05, 10);
      ring.visible = f >= b; ring.scale.setScalar(pop(f, b, 8) * (1 + 0.025 * Math.sin(f * 0.7))); ring.rotation.z = 0.04;
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.03 * Math.sin(f * 0.1);
    },
  };
};
