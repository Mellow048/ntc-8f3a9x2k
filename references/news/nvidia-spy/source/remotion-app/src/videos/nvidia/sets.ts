// Sets of the Nvidia short, part 1: keynote stage, spotlight void, wardrobe, monument, data centre, dock.
// Each builder fills a group once and returns a tick that poses it for a frame (motion is a pure function of
// the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lathe, lerp, lit, mat, panel, pool, pop, rng, rod, rrect, slab, smat, smooth, soft,
  tex, text, tileTex, tiled, tmat, torus, vgrad, woodTex, type V} from './kit';
import {actor, AGENT, FBI, JENSEN, SPY, WOMAN} from './cast';
import {crowd, signTex} from './props';
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
const GREEN = '#76b900';
const starTex = () => tex('sparkle', 96, 96, (g) => {
  g.fillStyle = '#fff8c8'; g.strokeStyle = '#241726'; g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 9 : 42; g.lineTo(48 + r * Math.cos(a), 48 + r * Math.sin(a)); }
  g.closePath(); g.fill(); g.stroke();
});

// ------------------------------------------------------------------ keynote stage
export const stage: Builder = (root) => {
  backdrop(root, ['#04060a', '#0a1420', '#0d1a16']);
  box(root, 13, 1.1, 5.4, '#252830', 0, -0.55, 0);                                             // deck, top at y = 0
  box(root, 13, 0.08, 0.08, lit(GREEN, 2.4), 0, 0.03, 2.72);
  box(root, 13, 0.5, 0.06, '#16181e', 0, -0.3, 2.74);
  floor(root, 30, 14, '#0c0e13', -1.1, 0, 8);
  box(root, 9.3, 6.0, 0.3, '#14161b', 0, 3.15, -2.45);
  const wall = tex('stage-wall', 1024, 640, (g, w, h) => {                                    // 115 px per metre; only the middle 3 m is ever in frame
    vgrad(g, w, h, ['#050d08', '#0a1c10', '#050b07']);
    const r = rng(11); g.lineWidth = 3;
    for (let i = 0; i < 70; i++) {
      let x = r() * w, y = r() * h; g.strokeStyle = 'rgba(118,185,0,.26)'; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { if (k % 2) y += (r() - 0.5) * 160; else x += (r() - 0.5) * 220; g.lineTo(x, y); }
      g.stroke(); g.fillStyle = 'rgba(150,220,40,.55)'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
    }
    const cx = w / 2, cy = 250, s = 104;
    g.fillStyle = GREEN;
    for (let i = 0; i < 6; i++) for (const d of [-1, 1]) { g.fillRect(cx - s + 17 + i * 32, cy + d * s - (d < 0 ? 22 : 0), 14, 22); g.fillRect(cx + d * s - (d < 0 ? 22 : 0), cy - s + 17 + i * 32, 22, 14); }
    rrect(g, cx - s, cy - s, 2 * s, 2 * s, 18); g.fillStyle = '#08140c'; g.fill(); g.lineWidth = 8; g.strokeStyle = GREEN; g.stroke();
    rrect(g, cx - s * 0.62, cy - s * 0.62, s * 1.24, s * 1.24, 10); g.strokeStyle = '#a8e63c'; g.lineWidth = 5; g.stroke();
    text(g, 'AI', cx, cy + 6, 92, '#b8f24a');
    for (const d of [-1, 1]) for (let y = 30; y < h - 30; y += 34) { g.fillStyle = (y / 34) % 3 < 1 ? '#a8e63c' : '#3d6a12'; g.fillRect(cx + d * 300 - 9, y, 18, 22); }
  });
  panel(root, 8.9, 5.56, smat(wall, 0.95), 0, 3.15, -2.28);
  for (const x of [-5.3, 5.3]) {                                                                // truss towers
    for (const dx of [-0.16, 0.16]) for (const dz of [-0.16, 0.16]) box(root, 0.06, 7.2, 0.06, '#4a505c', x + dx, 3.6, -1.6 + dz);
    for (let y = 0.3; y < 7; y += 0.7) rod(root, [x - 0.16, y, -1.44], [x + 0.16, y + 0.7, -1.44], 0.022, '#687080');
  }
  for (const dy of [-0.16, 0.16]) for (const dz of [-0.16, 0.16]) box(root, 10.9, 0.06, 0.06, '#4a505c', 0, 7.0 + dy, -1.6 + dz);
  for (let x = -5.2; x < 5.2; x += 0.7) rod(root, [x, 6.84, -1.44], [x + 0.7, 7.16, -1.44], 0.022, '#687080');
  const beams = [-3.3, -1.65, 0, 1.65, 3.3].map((x, i) => {
    cyl(root, 0.2, 0.36, '#1b1d23', x, 6.6, -1.6, 0.13); soft(ball(root, 0.14, lit(i % 2 ? '#dfffa0' : '#ffffff', 2.6), x, 6.4, -1.6));
    return beam(root, 0.12, 1.5, 6.7, i % 2 ? '#a6e22e' : '#dfe9ff', 0.035, x, 6.42, -1.6);
  });
  for (const x of [-4.1, 4.1]) {                                                                // speaker stacks
    box(root, 1.0, 2.0, 0.9, '#16181d', x, 1.0, -1.2);
    for (const y of [0.5, 1.45]) { cyl(root, 0.32, 0.06, '#2d313b', x, y, -0.74).rotation.x = Math.PI / 2; cyl(root, 0.12, 0.08, '#0d0e12', x, y, -0.72).rotation.x = Math.PI / 2; }
  }
  pool(root, 2.1, '#e6ffd6', 0.34, 0, 0.5);
  const house = crowd(root, -4.4, 4.4, [3.6, 4.4, 5.2], -1.6, 5);
  const jensen = actor(root, JENSEN, {
    hold: {expr: 'grin', pose: 'hold', prop: 'chip'}, shock: {expr: 'shock', pose: 'panic'}, smile: {expr: 'smile', pose: 'hips'}, shrug: {expr: 'nervous', pose: 'shrug'},
  }, 0, 0, 0.5, {scale: 1.25, res: 1.2});
  const woman = actor(root, WOMAN, {idle: {expr: 'smile', pose: 'shrug'}}, 0.6, 0, 0.5, {scale: 1.25, res: 1.2});
  const q = card(root, 0.9, 1.3, tex('big-q', 180, 260, (g) => text(g, '?', 90, 140, 250, '#ffd43b', {stroke: '#241726', sw: 22})), 0, 2.9, 0.5, 1.3);
  return {
    light: () => LIGHT.show,
    tick: ({f, cam, shot}) => {
      const v = shot.v, hit = W(6);
      beams.forEach((b, i) => { b.rotation.z = 0.22 * Math.sin(f * 0.035 + i * 1.3); b.rotation.x = 0.12 + 0.08 * Math.sin(f * 0.05 + i); });
      woman.node.visible = q.visible = v === 'final';
      jensen.node.position.set(v === 'final' ? -0.6 : 0, hop(f, hit, 0.32, 10) * (v === 'hook' ? 1 : 0), 0.5);
      jensen.show(v === 'hook' ? (f < hit ? 'hold' : 'shock') : v === 'name' ? 'smile' : v === 'final' ? 'shrug' : 'hold');
      house.flash(f, v === 'hook' && f >= hit && f < hit + 34 ? 1 : 0);
      if (v === 'final') { const k = pop(f, shot.at + 4, 10); q.scale.setScalar(Math.max(0.001, k)); q.position.y = 2.95 + 0.06 * Math.sin(f * 0.2); q.rotation.z = 0.1 * Math.sin(f * 0.13); woman.tick(f, cam); }
      jensen.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ one figure in a spotlight
export const voidSet: Builder = (root) => {
  const skies: Record<string, THREE.Mesh> = {
    spy: backdrop(root, ['#0b0408', '#3d0c1e', '#16060c']), alice: backdrop(root, ['#170d22', '#5a2a55', '#1d0f20']), pair: backdrop(root, ['#0d1028', '#2c2f6e', '#111328']),
    honey: backdrop(root, ['#170d05', '#5a3410', '#1c1006']), noidea: backdrop(root, ['#06101c', '#143a5a', '#081320']), charged: backdrop(root, ['#06140f', '#14513e', '#081a14']),
    target: backdrop(root, ['#0a0606', '#40100f', '#120707']),
  };
  cyl(root, 6.5, 0.2, '#1b1c25', 0, -0.1, 0, 6.5, 48); torus(root, 2.5, 0.03, '#3a3c4c', 0, 0.01, 0.2).rotation.x = Math.PI / 2;
  // graphic sunburst behind the figure, one colourway per staging
  const burstC: Record<string, [string, string, string]> = {spy: ['#6e1029', '#9a1a3a', '#ff8a9a'], alice: ['#3a1c7a', '#5530a8', '#d9c2ff'], pair: ['#27347e', '#3a4cab', '#b6c8ff'],
    honey: ['#a85a14', '#d9861f', '#ffe08a'], noidea: ['#11506e', '#1c7396', '#a6e6ff'], charged: ['#175e42', '#23855d', '#a6ffd4'], target: ['#4e1010', '#7a1a1a', '#ff9a8a']};
  const bursts = Object.fromEntries(Object.entries(burstC).map(([k, [c1, c2, core]]) => {
    const t = tex('burst-' + k, 512, 512, (g) => {
      g.fillStyle = c1; g.fillRect(0, 0, 512, 512); g.fillStyle = c2;
      for (let i = 0; i < 14; i++) { const a0 = i * Math.PI / 7, a1 = a0 + Math.PI / 14; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + 400 * Math.cos(a0), 256 + 400 * Math.sin(a0)); g.lineTo(256 + 400 * Math.cos(a1), 256 + 400 * Math.sin(a1)); g.closePath(); g.fill(); }
      const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, core); gr.addColorStop(0.16, core + 'cc'); gr.addColorStop(0.5, core + '00'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      const vg = g.createRadialGradient(256, 256, 150, 256, 256, 300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = vg; g.fillRect(0, 0, 512, 512);
    });
    return [k, soft(panel(root, 17, 17, smat(t, 0.92), 0, 2.4, -5))];
  }));
  const markT = tex('mark-q', 128, 160, (g) => text(g, '?', 64, 86, 150, '#ffe14a', {stroke: '#241726', sw: 16}));
  const marks = [[-1.25, 2.9, -1.2, 0.5], [1.3, 3.2, -1.6, 0.62], [-1.0, 1.0, -1.4, 0.4], [1.15, 1.5, -1.0, 0.46], [0.2, 3.7, -2.0, 0.5]].map(([x, y, z, k]) => { const c = card(root, 0.8 * k, k, markT, x, y, z, 1.15); c.userData.y = y; return c; });
  const notEq = card(root, 0.8, 0.8, tex('not-equal', 200, 200, (g) => text(g, '≠', 100, 104, 210, '#ffe14a', {stroke: '#241726', sw: 20})), 0, 1.75, 0.1, 1.2);
  const spotC: Record<string, string> = {spy: '#ffd6e2', alice: '#ffe1f4', pair: '#dfe2ff', honey: '#ffd48a', noidea: '#cfeaff', charged: '#d0ffe8', target: '#ffd0c8'};
  const cones = Object.fromEntries(Object.entries(spotC).map(([k, c]) => [k, [beam(root, 0.18, 2.1, 8, c, 0.1, 0, 8, 0.2), pool(root, 2.3, c, 0.5, 0, 0.2)]]));
  const woman = actor(root, WOMAN, {idle: {expr: 'smile'}, hips: {expr: 'smile', pose: 'hips', tilt: 4}, think: {expr: 'smile', pose: 'think', tilt: -3}}, 0, 0, 0, {scale: 1.25, res: 1.2});
  const jensen = actor(root, JENSEN, {shrug: {expr: 'nervous', pose: 'shrug'}, point: {expr: 'stern', pose: 'cross'}, sweat: {expr: 'nervous', pose: 'panic'}, flat: {expr: 'neutral'}}, 0, 0, 0, {scale: 1.25, res: 1.2});
  const spies = [-1, 1].map((s, i) => actor(root, SPY(i), {peek: {expr: 'stern', pose: i ? 'think' : 'cross'}}, s * 2.4, 0, -0.5, {scale: 1.15}));
  // the literal honeypot
  const honey = grp(root, 0, 0, 0);
  cyl(honey, 0.62, 0.74, '#343645', 0, 0.37, 0, 0.5, 32); cyl(honey, 0.56, 0.06, '#4a4d60', 0, 0.77, 0, 0.56, 32);
  const jar = grp(honey, 0, 0.8, 0);
  lathe(jar, [[0, 0], [0.33, 0], [0.44, 0.1], [0.47, 0.34], [0.42, 0.56], [0.3, 0.66], [0.3, 0.74], [0, 0.74]], lit('#f2a516', 1.25));
  cyl(jar, 0.34, 0.1, '#c9812a', 0, 0.79, 0, 0.34, 28); cyl(jar, 0.2, 0.05, '#a86a20', 0, 0.86, 0, 0.28, 28);
  const label = tex('honey-label', 320, 150, (g) => { rrect(g, 4, 4, 312, 142, 20); g.fillStyle = '#fff6d8'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#241726'; g.stroke(); text(g, 'HONEYPOT', 160, 62, 64, '#8a4a10', {maxWidth: 280}); text(g, '100% ALLEGED', 160, 116, 30, '#c9812a', {font: 'Montserrat'}); });
  panel(jar, 0.6, 0.28, smat(label, 1), 0, 0.33, 0.475);
  rod(jar, [0.1, 0.84, 0], [0.5, 1.36, 0.06], 0.025, '#a86a20'); ball(jar, 0.07, '#c9812a', 0.5, 1.36, 0.06).scale.y = 1.5;
  for (const s of [-1, 1]) box(jar, 0.16, 0.1, 0.03, '#17171d', s * 0.11, 0.6, 0.39);                 // shades on the jar
  box(jar, 0.08, 0.025, 0.03, '#17171d', 0, 0.62, 0.39);
  const bees = [0, 1, 2].map((i) => soft(ball(honey, 0.045, lit('#ffd43b', 1.3), 0, 1.4, 0)));
  const drip = soft(ball(jar, 0.06, lit('#f2a516', 1.3), 0.3, 0.6, 0.3));
  return {
    light: (v) => ({...LIGHT.dark, amb: v === 'honey' ? 1.0 : 0.85}),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      for (const [k, m] of Object.entries(skies)) m.visible = k === v;
      for (const [k, m] of Object.entries(bursts)) { m.visible = k === v; m.rotation.z = f * 0.006; }
      const quiz = v === 'spy' || v === 'alice' || v === 'target' || v === 'noidea';
      marks.forEach((m, i) => { m.visible = quiz; m.position.y = m.userData.y + 0.1 * Math.sin(f * 0.09 + i * 1.9); m.rotation.z = 0.2 * Math.sin(f * 0.07 + i); const k = pop(f, shot.at + 2 + i * 3, 8); m.scale.setScalar(Math.max(0.001, k)); });
      notEq.visible = v === 'pair'; notEq.scale.setScalar(Math.max(0.001, pop(f, W(38), 8)) * (1 + 0.06 * Math.sin(f * 0.3)));
      for (const [k, [c, p]] of Object.entries(cones)) { c.visible = p.visible = k === v; }
      honey.visible = v === 'honey';
      woman.node.visible = ['spy', 'alice', 'pair', 'noidea', 'charged'].includes(v);
      jensen.node.visible = ['pair', 'noidea', 'target'].includes(v);
      spies.forEach((s) => (s.node.visible = v === 'target'));
      if (v === 'spy') { woman.node.position.set(0, 0, 0); woman.show(f < W(15) ? 'idle' : 'hips'); woman.node.position.y = hop(f, W(15), 0.14, 9); }
      if (v === 'alice') { woman.node.position.set(0, 0, 0); woman.show('think'); }
      if (v === 'charged') { woman.node.position.set(0, 0, 0); woman.show('idle'); }
      if (v === 'pair') { woman.node.position.set(0.66, 0, 0); woman.show('hips'); jensen.node.position.set(-0.66, 0, 0); jensen.show('point'); }
      if (v === 'noidea') {
        jensen.node.position.set(-0.15, hop(f, W(160), 0.12, 9), 0); jensen.show('shrug');
        woman.show('idle'); woman.node.position.set(lerp(3.2, 1.35, smooth(f, W(162) - 4, W(162) + 8)), 0, -0.9);
      }
      if (v === 'target') {
        jensen.node.position.set(0, 0, 0); jensen.show('sweat');
        spies.forEach((s, i) => { s.node.position.x = (i ? 1 : -1) * lerp(3.3, 1.55, smooth(f, shot.at + 3 + i * 5, shot.at + 14 + i * 5)); s.tick(f, cam); });
      }
      if (v === 'honey') {
        jar.rotation.y = 0.18 * Math.sin(f * 0.05); jar.position.y = 0.8 + hop(f, W(74), 0.12, 9);
        bees.forEach((b, i) => b.position.set(0.8 * Math.cos(f * 0.16 + i * 2.1), 1.5 + 0.3 * Math.sin(f * 0.21 + i), 0.5 * Math.sin(f * 0.16 + i * 2.1)));
        drip.position.y = 0.6 - ((f * 0.012) % 0.5);
      }
      woman.tick(f, cam); jensen.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the wardrobe: one jacket, seven times
export const wardrobe: Builder = (root) => {
  backdrop(root, ['#3a2c22', '#5a4636']);
  floor(root, 12, 8, tmat(tiled(woodTex('floor', '#a07a56', '#5f4630'), 5, 3)), 0, 0, 1);
  box(root, 9, 4, 0.2, tmat(tiled(woodTex('wall', '#7d6450', '#4a3a2c'), 4, 2)), 0, 2, -0.6);
  for (const x of [-1.52, 1.52]) box(root, 0.14, 4.5, 1.1, '#5f4a3a', x, 2.25, -0.05);          // closet sides
  box(root, 3.2, 0.1, 1.1, '#6e5847', 0, 4.5, -0.05); box(root, 3.0, 0.08, 1.0, '#6e5847', 0, 3.62, -0.1); box(root, 3.0, 0.08, 1.0, '#6e5847', 0, 0.42, -0.1);
  box(root, 2.9, 0.04, 0.06, lit('#ffe2b0', 2.2), 0, 3.56, 0.3);                                  // strip light under the shelf
  const jacket = tex('jacket', 300, 400, (g) => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = '#c3c8d2'; g.lineWidth = 7; g.beginPath(); g.arc(150, 32, 16, Math.PI * 0.85, Math.PI * 2.4); g.stroke(); g.beginPath(); g.moveTo(150, 48); g.lineTo(150, 72); g.stroke();
    g.beginPath(); g.moveTo(108, 70); g.lineTo(192, 70); g.lineTo(262, 118); g.lineTo(284, 300); g.lineTo(236, 306); g.lineTo(226, 176); g.lineTo(222, 374); g.lineTo(78, 374); g.lineTo(74, 176); g.lineTo(64, 306); g.lineTo(16, 300); g.lineTo(38, 118); g.closePath();
    g.fillStyle = '#1d1d24'; g.fill(); g.lineWidth = 9; g.strokeStyle = '#241726'; g.stroke();
    g.fillStyle = '#2f303a'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(150, 152); g.lineTo(150 + s * 44, 70); g.lineTo(150 + s * 68, 106); g.lineTo(150 + s * 16, 172); g.closePath(); g.fill(); g.lineWidth = 5; g.stroke(); }
    g.strokeStyle = '#9aa0ad'; g.lineWidth = 5; g.beginPath(); g.moveTo(150, 152); g.lineTo(150, 372); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 8; for (const [a, b, c, d] of [[52, 140, 40, 250], [100, 196, 96, 300], [250, 150, 262, 240]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    g.strokeStyle = '#0c0c10'; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(150 + s * 22, 292); g.lineTo(150 + s * 60, 284); g.stroke(); }
  });
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'GYM'];                         // two rails, the same jacket eight times
  const coats = days.map((d, i) => {
    const x = -0.84 + (i % 4) * 0.56, rail = i < 4 ? 3.3 : 1.98;
    if (i % 4 === 0) rod(root, [-1.45, rail, 0], [1.45, rail, 0], 0.03, '#c9ced6');
    const c = card(root, 0.74, 0.99, jacket, x, rail - 0.45, 0.03 + (i % 2) * 0.04); c.userData.y = rail + 0.04;
    c.geometry.translate(0, -0.49, 0); c.position.y = rail + 0.04;                                 // swings from the hook
    panel(root, 0.4, 0.16, smat(signTex('day-' + d, 160, 64, '#fff6d8', '#241726', [[d, 46]], {border: '#241726'})), x, rail + 0.17, 0.16);
    return c;
  });
  for (let i = 0; i < 5; i++) { box(root, 0.46, 0.14, 0.46, i % 2 ? '#23232b' : '#1b1b22', -1.12 + i * 0.56, 3.73, -0.15); box(root, 0.46, 0.13, 0.46, '#2a2a33', -1.12 + i * 0.56, 3.87, -0.15); }
  for (let i = 0; i < 5; i++) for (const d of [-0.1, 0.1]) { const sh = box(root, 0.13, 0.12, 0.38, '#17171d', -1.12 + i * 0.56 + d, 0.52, 0.02); sh.rotation.y = d; box(root, 0.13, 0.05, 0.13, '#f3f1ea', -1.12 + i * 0.56 + d, 0.47, 0.19); }
  const twinkle = card(root, 0.3, 0.3, starTex(), 0.3, 2.95, 0.3, 1.5);
  return {
    light: () => LIGHT.warm,
    tick: ({f, shot}) => {
      coats.forEach((c, i) => { c.rotation.z = 0.06 * Math.sin(f * 0.16 + i * 0.9); const k = pop(f, shot.at - 2 + i, 6); c.scale.set(k, k, 1); });
      twinkle.scale.setScalar(0.6 + 0.5 * Math.abs(Math.sin(f * 0.3))); twinkle.rotation.z = f * 0.1;
    },
  };
};

// ------------------------------------------------------------------ monument to the chip
export const monument: Builder = (root) => {
  backdrop(root, ['#4f97d6', '#a8d4ee', '#ffe7b4']);
  floor(root, 70, 70, tmat(tiled(tileTex('plaza', '#dccfb2', '#bdb08f', 4), 16, 16)));
  box(root, 3.8, 0.5, 3.8, '#d2c9b6', 0, 0.25, 0); box(root, 2.9, 0.6, 2.9, '#dcd4c2', 0, 0.8, 0); box(root, 2.2, 0.5, 2.2, '#d2c9b6', 0, 1.35, 0);
  panel(root, 2.5, 0.4, tmat(signTex('plaque', 640, 100, '#3b4252', '#f6e7b0', [["WORLD'S MOST VALUABLE CHIP COMPANY", 54]], {border: '#e7c56a'})), 0, 0.8, 1.46);
  const chip = grp(root, 0, 3.9, 0);
  const pcb = tex('pcb', 256, 256, (g) => {
    g.fillStyle = '#2f9440'; g.fillRect(0, 0, 256, 256); const r = rng(3); g.strokeStyle = '#57c06a'; g.lineWidth = 3;
    for (let i = 0; i < 40; i++) { let x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) { if (k % 2) y += (r() - 0.5) * 90; else x += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); g.fillStyle = '#e7c56a'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  });
  box(chip, 3.0, 3.0, 0.26, tmat(pcb), 0, 0, 0);
  box(chip, 1.8, 1.8, 0.16, '#cfd6dc', 0, 0, 0.2); box(chip, 1.5, 1.5, 0.04, '#e3e8ec', 0, 0, 0.3);
  panel(chip, 1.2, 0.7, smat(tex('ai-etch', 240, 140, (g) => text(g, 'AI', 120, 76, 130, '#5a6470')), 1, true), 0, 0, 0.33);
  for (let i = 0; i < 11; i++) for (const d of [-1, 1]) { const o = -1.3 + i * 0.26; box(chip, 0.11, 0.2, 0.08, '#e9b930', o, d * 1.58, 0); box(chip, 0.2, 0.11, 0.08, '#e9b930', d * 1.58, o, 0); }
  const king = grp(root, 0, 5.56, 0);                                                            // the man on top, wearing the crown
  const crown = grp(king, 0.03, 2.2, 0); crown.rotation.z = -0.14; crown.scale.setScalar(0.52);
  cyl(crown, 0.62, 0.34, '#e9b930', 0, 0, 0, 0.56, 24);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cone(crown, 0.15, 0.5, '#e9b930', 0.5 * Math.cos(a), 0.4, 0.5 * Math.sin(a), 12); ball(crown, 0.085, lit(i % 2 ? '#ff5a6a' : '#6ad7ff', 1.5), 0.5 * Math.cos(a), 0.7, 0.5 * Math.sin(a)); }
  torus(crown, 0.6, 0.05, '#f6d870', 0, -0.14, 0).rotation.x = Math.PI / 2;
  const r = rng(29);
  const facade = tex('rack-tower', 128, 256, (g) => {
    g.fillStyle = '#2b3446'; g.fillRect(0, 0, 128, 256); const q = rng(8);
    for (let y = 8; y < 250; y += 12) { g.fillStyle = '#1b2231'; g.fillRect(6, y, 116, 8); for (let x = 10; x < 118; x += 9) { g.fillStyle = q() < 0.5 ? '#7dff9a' : q() < 0.5 ? '#ffd166' : '#3a4760'; g.fillRect(x, y + 2, 5, 4); } }
  }, true);
  for (let i = 0; i < 13; i++) {                                                                // skyline of server towers
    const x = -11 + i * 1.85 + r() * 0.5, z = -7 - (i % 3) * 2.6, h = 5 + r() * 9, w = 1.25 + r() * 0.5;
    box(root, w, h, w, tmat(tiled(facade, 1, Math.round(h / 3))), x, h / 2, z); box(root, w + 0.14, 0.14, w + 0.14, '#3b455a', x, h + 0.07, z);
    if (i % 2) rod(root, [x, h, z], [x, h + 1.3, z], 0.03, '#59647a');
  }
  const up: V[] = [[-4.6, 1.2, -2.5], [-3.7, 2.6, -2.5], [-3.2, 2.0, -2.5], [-2.3, 4.2, -2.5], [-1.9, 3.7, -2.5], [-1.2, 6.4, -2.5]];
  for (let i = 0; i + 1 < up.length; i++) rod(root, up[i], up[i + 1], 0.09, lit(GREEN, 1.5));
  const tip = cone(root, 0.3, 0.7, lit(GREEN, 1.5), -1.1, 6.75, -2.5); tip.rotation.z = -0.25;
  for (const [x, z, n] of [[-1.9, 2.2, 9], [-2.5, 2.0, 5], [1.7, 2.3, 7], [2.3, 1.9, 11], [2.6, 2.6, 4]] as const)
    for (let k = 0; k < n; k++) cyl(root, 0.3, 0.07, k % 2 ? '#e9b930' : '#f2c84a', x + 0.02 * Math.sin(k * 3), 0.035 + k * 0.07, z + 0.02 * Math.cos(k * 2), 0.3, 20);
  const stars = [[-1.9, 5.7, 0.6], [1.9, 4.6, 0.6], [1.15, 7.3, 0.4], [-1.6, 2.5, 0.9]].map(([x, y, z]) => card(root, 0.6, 0.6, starTex(), x, y, z, 1.6));
  const jensen = actor(king, JENSEN, {proud: {expr: 'grin', pose: 'hips'}}, 0, 0, 0, {scale: 1.3, res: 1.0, shadow: 0});
  return {
    light: () => LIGHT.day,
    tick: ({f, cam}) => {
      const bob = 0.08 * Math.sin(f * 0.07);
      chip.rotation.y = 0.3 * Math.sin(f * 0.035); chip.rotation.x = -0.06; chip.position.y = 3.9 + bob; king.position.y = 5.56 + bob;
      stars.forEach((s, i) => { s.scale.setScalar(0.35 + 0.75 * Math.abs(Math.sin(f * 0.22 + i * 1.7))); s.rotation.z = f * 0.06 + i; });
      jensen.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ data centre (Megaspeed; later searched by the FBI)
export const datacenter: Builder = (root) => {
  backdrop(root, ['#0a0d14', '#161b26']);
  floor(root, 9, 20, tmat(tiled(tileTex('dc', '#e2e6ed', '#aab2c0', 2), 5, 11)), 0, 0, -2);
  box(root, 9, 0.2, 20, '#2a2f3a', 0, 4.4, -2);
  for (let i = 0; i < 6; i++) box(root, 1.5, 0.05, 0.32, lit('#eaf4ff', 2.2), 0, 4.28, 3 - i * 2.2);
  const rack = tex('rack', 128, 256, (g) => {
    g.fillStyle = '#1d222c'; g.fillRect(0, 0, 128, 256); g.strokeStyle = '#3a4352'; g.lineWidth = 3; g.strokeRect(5, 5, 118, 246);
    for (let y = 14; y < 240; y += 15) { g.fillStyle = '#12161d'; g.fillRect(12, y, 104, 11); g.fillStyle = '#39424f'; for (let x = 16; x < 80; x += 6) g.fillRect(x, y + 3, 3, 5); }
  });
  const leds = [lamp('#5dff8a', 2.2), lamp('#59b7ff', 2.2), lamp('#ffb84a', 2.2)], q = rng(17);
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
    const z = 2.6 - i * 1.22, x = s * 2.1;
    box(root, 0.95, 2.45, 1.16, tmat(rack), x, 1.225, z); box(root, 1.0, 0.08, 1.2, '#2b313c', x, 2.49, z);
    for (let k = 0; k < 13; k++) box(root, 0.02, 0.035, 0.05, leds[Math.floor(q() * 3)], x - s * 0.485, 0.3 + Math.floor(q() * 15) * 0.14, z + (q() - 0.5) * 0.3 + 0.32);
    box(root, 0.06, 0.02, 1.2, '#e9b930', x - s * 0.55, 0.012, z);                              // floor safety line
  }
  for (const s of [-1, 1]) {                                                                     // cable trays
    box(root, 0.55, 0.05, 19, '#59616f', s * 2.0, 3.45, -2);
    ['#f08a2c', '#3f8fd0', '#f2d04a'].forEach((c, i) => rod(root, [s * (1.84 + i * 0.16), 3.52, 6], [s * (1.84 + i * 0.16), 3.52, -8], 0.035, c));
    for (let z = 3; z > -8; z -= 2.2) rod(root, [s * 2.0, 3.45, z], [s * 2.0, 4.3, z], 0.02, '#59616f');
  }
  box(root, 9, 4.6, 0.3, '#262c38', 0, 2.3, -7.4);
  const sign = tex('megaspeed', 1024, 256, (g) => {
    g.fillStyle = '#0d1820'; g.fillRect(0, 0, 1024, 256); g.strokeStyle = '#27d7c4'; g.lineWidth = 8; g.strokeRect(8, 8, 1008, 240);
    g.shadowColor = '#27d7c4'; g.shadowBlur = 36; text(g, 'MEGASPEED', 512, 108, 150, '#bffff6', {spacing: 6, maxWidth: 940}); g.shadowBlur = 0;
    text(g, 'INTERNATIONAL  ·  SINGAPORE', 512, 208, 42, '#27d7c4', {font: 'Montserrat', weight: 700, spacing: 4});
  });
  panel(root, 4.1, 1.025, smat(sign, 1.5), 0, 3.25, -7.22);
  box(root, 1.9, 2.4, 0.1, '#39414f', 0, 1.2, -7.2); box(root, 0.04, 2.3, 0.12, '#1c212a', 0, 1.2, -7.18);
  for (const s of [-1, 1]) box(root, 0.5, 0.9, 0.04, lit('#9fd8ff', 0.9), s * 0.48, 1.6, -7.13);
  box(root, 0.12, 0.2, 0.05, '#1c212a', 1.15, 1.3, -7.2); soft(ball(root, 0.025, lit('#ff4a4a', 3), 1.15, 1.34, -7.16));
  // pallet of boxed chips
  const crates = grp(root, 1.0, 0, 1.0);
  const crateT = tmat(woodTex('crate', '#c69a62', '#8a6436')), gpu = smat(tex('gpu-label', 200, 160, (g) => {
    g.fillStyle = '#f6f1e0'; g.fillRect(0, 0, 200, 160); g.strokeStyle = '#241726'; g.lineWidth = 8; g.strokeRect(4, 4, 192, 152);
    rrect(g, 20, 34, 70, 70, 8); g.fillStyle = '#3f9b43'; g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = '#c9d2d8'; g.fillRect(38, 52, 34, 34);
    text(g, 'GPU', 142, 62, 54, '#241726'); text(g, 'x8', 142, 116, 44, '#c23b3b');
  }));
  box(crates, 1.5, 0.12, 1.1, '#9a7648', 0, 0.06, 0);
  for (const [x, y, z] of [[-0.36, 0.42, 0], [0.36, 0.42, 0], [0, 1.02, 0]]) { box(crates, 0.66, 0.6, 0.66, crateT, x, y, z); panel(crates, 0.44, 0.35, gpu, x, y, z + 0.335); }
  const woman = actor(root, WOMAN, {idle: {expr: 'smile'}, tablet: {expr: 'smile', pose: 'both', prop: 'tablet'}}, 0, 0, 0.1, {scale: 1.2, res: 1.2});
  const sleuth = actor(root, AGENT(0), {look: {expr: 'stern', pose: 'hold', prop: 'magnifier'}}, -0.25, 0, 0.9, {scale: 1.15, res: 1.0});
  const feds = [actor(root, FBI(0), {search: {expr: 'stern', pose: 'hold', prop: 'torch'}}, -0.5, 0, 0.4, {scale: 1.15, res: 1.2}),
    actor(root, FBI(1), {search: {expr: 'neutral', pose: 'hold', prop: 'magnifier'}}, 0.56, 0, -0.5, {scale: 1.15, res: 1.0})];
  const torch = grp(root, -0.1, 1.8, 0.46);
  const ray = beam(torch, 0.04, 0.75, 3.0, '#fff3b0', 0.16); ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, -0.22, -0.55).normalize());
  soft(ball(torch, 0.06, lit('#fff8d0', 5), 0, 0, 0.02));
  const spot = pool(root, 0.9, '#fff3b0', 0.35, 1.5, -1.0);
  return {
    light: (v) => (v === 'fbi' ? {...LIGHT.dark, amb: 0.55, keyI: 0.35} : LIGHT.cold),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      leds.forEach((m, i) => m.color.setScalar(1).multiply(new THREE.Color(['#5dff8a', '#59b7ff', '#ffb84a'][i])).multiplyScalar(((f + i * 5) % (9 + i * 4)) < 5 + i ? 2.4 : 0.25));
      woman.node.visible = v === 'intro'; sleuth.node.visible = crates.visible = v === 'inspect';
      feds.forEach((a) => (a.node.visible = v === 'fbi')); torch.visible = spot.visible = v === 'fbi';
      if (v === 'intro') { woman.show(f < W(43) ? 'idle' : 'tablet'); woman.tick(f, cam); }
      if (v === 'inspect') { sleuth.node.position.x = -0.06 + 0.09 * Math.sin(f * 0.12); sleuth.tick(f, cam); }
      if (v === 'fbi') {
        torch.rotation.y = 0.28 * Math.sin(f * 0.11); torch.rotation.z = 0.12 * Math.sin(f * 0.17);
        spot.position.z = -1.0 - 1.1 * Math.sin(f * 0.11);
        feds.forEach((a, i) => { a.node.position.y = 0.02 * Math.abs(Math.sin(f * 0.2 + i * 2)); a.tick(f, cam); });
      }
    },
  };
};

// ------------------------------------------------------------------ container dock at dusk
export const dock: Builder = (root) => {
  backdrop(root, ['#1a2150', '#59488a', '#f2a35a', '#ffdca4']);
  floor(root, 44, 26, tmat(tiled(grainTex('asphalt', '#4d525d'), 12, 7)), 0, 0, 1);
  floor(root, 120, 60, lit('#2a566e'), -0.5, 0, -40);
  box(root, 44, 0.5, 0.5, '#8a8f99', 0, -0.05, -12);
  for (let x = -12; x <= 12; x += 3) { cyl(root, 0.16, 0.5, '#d0a030', x, 0.25, -11.4); cyl(root, 0.22, 0.08, '#2b2f38', x, 0.52, -11.4); }
  for (const z of [3.2, 5.6]) box(root, 30, 0.012, 0.14, '#e9c53a', 0, 0.008, z);
  const container = (x: number, y: number, z: number, c: string, shade: string, open = false) => {
    const g = grp(root, x, y, z), skin = tmat(tiled(foldTex(c, c, shade, 8), 5, 1));
    box(g, 2.44, 2.6, 6.1, skin, 0, 1.3, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.14, 2.64, 0.14, shade, sx * 1.2, 1.32, sz * 3.02);
    box(g, 2.5, 0.12, 6.16, shade, 0, 2.62, 0); box(g, 2.5, 0.12, 6.16, shade, 0, 0.06, 0);
    if (open) {
      box(g, 2.2, 2.34, 0.05, '#0d0e13', 0, 1.3, 3.03);                                         // dark mouth
      for (const s of [-1, 1]) { const d = grp(g, s * 1.2, 0, 3.06); d.rotation.y = s * 1.95; box(d, 1.16, 2.4, 0.07, skin, -s * 0.58, 1.3, 0); for (const dx of [0.3, 0.8]) rod(d, [-s * dx, 0.15, 0.05], [-s * dx, 2.45, 0.05], 0.022, '#d9dce2'); }
    } else {
      for (const s of [-0.6, 0.6]) box(g, 1.14, 2.36, 0.05, skin, s, 1.3, 3.06);
      for (const dx of [-0.85, -0.3, 0.3, 0.85]) rod(g, [dx, 0.15, 3.1], [dx, 2.45, 3.1], 0.022, '#d9dce2');
    }
    return g;
  };
  container(-3.5, 0, -3.2, '#b5463c', '#7c2c26'); container(-3.5, 2.7, -3.2, '#2f6f9f', '#1f4c70'); container(-3.5, 5.4, -3.6, '#3f8a5a', '#2a6040');
  container(4.2, 0, -5.4, '#d08a2f', '#94601c'); container(4.2, 2.7, -5.4, '#3f8f96', '#2a6368'); container(-6.4, 0, -4.2, '#8a5aa8', '#5d3c74');
  const mouth = container(1.1, 0, -1.4, '#c9502e', '#8a3620', true);
  panel(mouth, 1.9, 0.56, smat(signTex('to-china', 380, 112, '#f2d04a', '#241726', [['→ CHINA', 84]], {border: '#241726'})), 0, 3.02, 3.1);
  for (const s of [-1, 1]) rod(mouth, [s * 0.8, 2.66, 3.08], [s * 0.8, 2.78, 3.08], 0.03, '#3b404c');
  // roller conveyor into the open container
  const belt = grp(root, 1.1, 0, 1.75);
  for (const s of [-1, 1]) { box(belt, 0.08, 0.14, 5.4, '#6b7280', s * 0.5, 0.62, 2.7); for (let z = 0.3; z < 5.4; z += 1.25) box(belt, 0.07, 0.6, 0.07, '#4b5361', s * 0.5, 0.3, z); }
  for (let z = 0.1; z < 5.4; z += 0.3) cyl(belt, 0.05, 0.92, '#aeb4c0', 0, 0.64, z, 0.05, 10).rotation.z = Math.PI / 2;
  const crateT = tmat(woodTex('crate', '#c69a62', '#8a6436')), chipLabel = smat(tex('chip-label', 160, 160, (g) => {
    g.fillStyle = '#f6f1e0'; g.fillRect(0, 0, 160, 160); g.lineWidth = 8; g.strokeStyle = '#241726'; g.strokeRect(4, 4, 152, 152);
    rrect(g, 34, 22, 92, 92, 10); g.fillStyle = '#3f9b43'; g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#c9d2d8'; g.fillRect(58, 46, 44, 44); text(g, 'GPU', 80, 134, 34, '#241726');
  }));
  const crates = [0, 1, 2, 3].map(() => { const c = grp(belt, 0, 0.98, 0); box(c, 0.72, 0.6, 0.72, crateT, 0, 0, 0); panel(c, 0.5, 0.5, chipLabel, 0, 0, 0.365); const top = panel(c, 0.5, 0.5, chipLabel, 0, 0.305, 0); top.rotation.x = -Math.PI / 2; return c; });
  // gantry crane and light masts on the quay
  for (const x of [-7.5, 7.5]) { box(root, 0.5, 11, 0.5, '#c94f3a', x, 5.5, -9.5); rod(root, [x, 0, -9.5], [x * 0.6, 11, -9.5], 0.1, '#a83f2e'); }
  box(root, 19, 0.6, 0.6, '#c94f3a', 0, 11.1, -9.5); box(root, 1.2, 0.5, 1.0, '#3b404c', 1.6, 10.6, -9.5);
  const hook = grp(root, 1.6, 10.4, -9.5); for (const s of [-0.5, 0.5]) rod(hook, [s, 0, 0], [s, -3.6, 0], 0.03, '#2b2f38'); box(hook, 2.44, 1.3, 1.6, '#3f8f96', 0, -4.25, 0);
  for (const x of [-9.2, 9.6]) { cyl(root, 0.1, 9, '#59616f', x, 4.5, -6); box(root, 1.1, 0.25, 0.4, '#3b404c', x, 9.1, -6); for (const s of [-0.3, 0.3]) soft(ball(root, 0.16, lit('#ffe9b0', 3.2), x + s, 8.95, -5.9)); beam(root, 0.3, 3.2, 9, '#ffe2a0', 0.05, x, 8.9, -5.9); }
  // forklift parked with a crate
  const lift = grp(root, -2.7, 0, 3.9); lift.rotation.y = 0.5;
  box(lift, 1.1, 0.7, 1.7, '#e9b930', 0, 0.6, 0); box(lift, 1.0, 0.08, 1.0, '#2b2f38', 0, 1.9, -0.2); for (const [x, z] of [[-0.45, 0.3], [0.45, 0.3], [-0.45, -0.7], [0.45, -0.7]]) rod(lift, [x, 0.9, z], [x, 1.9, z], 0.035, '#2b2f38');
  for (const [x, z] of [[-0.56, 0.55], [0.56, 0.55], [-0.56, -0.55], [0.56, -0.55]]) cyl(lift, 0.28, 0.2, '#1b1d23', x, 0.28, z, 0.28, 16).rotation.z = Math.PI / 2;
  for (const s of [-0.3, 0.3]) { box(lift, 0.07, 2.2, 0.07, '#3b404c', s, 1.1, 0.92); box(lift, 0.1, 0.05, 0.9, '#8a8f99', s, 0.42, 1.4); }
  box(lift, 0.72, 0.6, 0.72, crateT, 0, 0.75, 1.42); panel(lift, 0.5, 0.5, chipLabel, 0, 0.75, 1.785);
  return {
    light: () => LIGHT.dusk,
    tick: ({f}) => {
      crates.forEach((c, i) => { const u = ((f * 0.045 + i * 1.5) % 6); c.position.z = 5.2 - u; c.visible = u < 5.75; c.position.y = 0.98 + 0.012 * Math.sin(f * 0.9 + i); });
      hook.rotation.z = 0.035 * Math.sin(f * 0.05);
    },
  };
};
export {mat};
