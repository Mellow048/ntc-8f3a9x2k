// Sets of the Binance heist short, part 3: the FBI's briefing room, the state broadcaster's desk, the party at
// Mar-a-Lago, the courtroom with nobody in the dock, the wall of months, the closing question.
import * as THREE from 'three';
import {backdrop, ball, beam, box, clamp01, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, vgrad, woodTex,
  type G2, type V} from './kit';
import {actor, AGENT, ANCHOR, ENGINEER, JUDGE, PRESIDENT, SPOKES} from './cast';
import {boom, drawHood, drawMask, flagNK, flagPole, flagUS, GOLD, lectern, palm, pumpkin, signTex} from './props';
import {LIGHT, type Builder} from './sets';
import {W} from './story';

const INK = '#15121c';

// ------------------------------------------------------------------ the FBI's briefing room
/** The Korean peninsula, drawn by hand from a handful of coordinates: good for a wall map, not for navigation. */
const NORTH: [number, number][] = [[124.35, 39.95], [124.9, 40.45], [125.7, 40.85], [126.5, 41.35], [126.9, 41.78], [127.6, 41.45], [128.1, 41.4], [128.3, 41.95], [129.1, 42.15], [129.7, 42.45], [129.9, 42.98], [130.25, 42.9], [130.6, 42.45], [130.68, 42.3],
  [130.0, 41.95], [129.75, 41.35], [129.3, 40.7], [128.6, 40.2], [128.15, 40.02], [127.6, 39.8], [127.45, 39.2], [127.9, 38.9], [128.36, 38.61],
  [128.1, 38.3], [127.6, 38.32], [127.1, 38.28], [126.9, 37.98], [126.68, 37.76], [126.1, 37.8], [125.7, 37.98], [125.35, 37.72], [125.0, 37.82], [124.68, 38.12], [124.98, 38.55], [125.25, 38.7], [125.15, 39.15], [125.35, 39.5], [124.9, 39.65]];
const SOUTH: [number, number][] = [[126.68, 37.76], [126.9, 37.98], [127.1, 38.28], [127.6, 38.32], [128.1, 38.3], [128.36, 38.61], [128.6, 38.2], [128.95, 37.75], [129.35, 37.1], [129.45, 36.5], [129.55, 36.05], [129.4, 35.5], [129.1, 35.1],
  [128.6, 34.9], [128.0, 34.85], [127.6, 34.7], [127.2, 34.55], [126.6, 34.35], [126.3, 34.5], [126.35, 34.8], [126.25, 35.2], [126.55, 35.6], [126.6, 36.0], [126.45, 36.4], [126.15, 36.75], [126.5, 36.95], [126.85, 37.0], [126.65, 37.4]];
const MAINLAND: [number, number][] = [[121, 43.3], [133.7, 43.3], [133.7, 42.9], [132.3, 43.15], [131.3, 42.7], [130.68, 42.3], [130.6, 42.45], [130.25, 42.9], [129.9, 42.98], [129.7, 42.45], [129.1, 42.15], [128.3, 41.95], [128.1, 41.4], [127.6, 41.45], [126.9, 41.78], [126.5, 41.35], [125.7, 40.85], [124.9, 40.45], [124.35, 39.95],
  [123.3, 39.7], [122.3, 39.3], [121.7, 38.95], [121.3, 39.3], [121.9, 40.2], [121, 40.8]];
const JAPAN: [number, number][] = [[129.7, 33.3], [130.2, 33.9], [131.0, 34.1], [132.0, 34.9], [133.7, 35.6], [133.7, 33.3]];
const mapXY = (w: number, h: number) => (lon: number, lat: number): [number, number] => [(lon - 121) / 12.7 * w, (43.3 - lat) / 10 * h];
const poly = (g: G2, at: (lon: number, lat: number) => [number, number], pts: [number, number][]) => { g.beginPath(); pts.forEach(([lo, la], i) => { const [x, y] = at(lo, la); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
const mapTex = () => tex('map-korea', 1024, 1024, (g, w, h) => {
  const at = mapXY(w, h); g.fillStyle = '#bfe0f0'; g.fillRect(0, 0, w, h); g.lineJoin = 'round';
  g.fillStyle = '#d9dde2'; g.strokeStyle = '#8a94a3'; g.lineWidth = 5; poly(g, at, MAINLAND); g.fill(); g.stroke(); poly(g, at, JAPAN); g.fill(); g.stroke();
  g.fillStyle = '#f3efe4'; g.strokeStyle = INK; g.lineWidth = 7; poly(g, at, SOUTH); g.fill(); g.stroke();
  g.fillStyle = '#f2c2a8'; poly(g, at, NORTH); g.fill(); g.stroke();
  g.fillStyle = '#f3efe4'; g.beginPath(); g.ellipse(...at(126.55, 33.4), 26, 12, 0, 0, 7); g.fill(); g.stroke();
  const [px, py] = at(125.75, 39.03); g.fillStyle = INK; g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill(); text(g, 'PYONGYANG', px + 20, py + 2, 30, INK, {font: 'Montserrat', align: 'left'});
  text(g, 'NORTH', at(127.15, 40.75)[0], at(127.15, 40.75)[1], 74, INK); text(g, 'KOREA', at(127.25, 40.05)[0], at(127.25, 40.05)[1], 74, INK);
  text(g, 'SOUTH KOREA', at(127.9, 36.4)[0], at(127.9, 36.4)[1], 34, '#7a8290', {font: 'Montserrat'});
  g.strokeStyle = INK; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
});
const northTex = () => tex('map-north', 1024, 1024, (g, w, h) => {
  const at = mapXY(w, h); g.lineJoin = 'round'; g.fillStyle = '#e3342f'; g.strokeStyle = INK; g.lineWidth = 9; poly(g, at, NORTH); g.fill(); g.stroke();
  const [px, py] = at(125.75, 39.03); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill(); text(g, 'PYONGYANG', px + 20, py + 2, 30, '#ffffff', {font: 'Montserrat', align: 'left'});
  text(g, 'NORTH', at(127.15, 40.75)[0], at(127.15, 40.75)[1], 74, '#ffffff', {stroke: INK, sw: 10}); text(g, 'KOREA', at(127.25, 40.05)[0], at(127.25, 40.05)[1], 74, '#ffffff', {stroke: INK, sw: 10});
});
export const fbi: Builder = (root) => {
  backdrop(root, ['#0a1228', '#1c2c58']);
  floor(root, 14, 12, tmat(tiled(grainTex('fbi', '#2a3760', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, tmat(tiled(foldTex('fbi-cur', '#20305c', '#131d3c'), 3, 1)), 0, 2.8, -1.95);
  flagPole(root, -1.3, -1.45, flagUS());
  lectern(root, -0.52, 0.35, '#2a2f44', signTex('plaque-fbi', 400, 190, '#1f2a44', '#ffd43b', [['FBI', 132, 0.56]], {border: '#e7c56a'}));
  const UP = 0.2;
  const agent = actor(root, AGENT(0), {idle: {expr: 'stern'}, point: {expr: 'stern', pose: 'point', prop: 'pointer'}}, -0.52, UP, -0.3, {scale: 1.25, res: 1.2});
  const board = grp(root, 0.62, 1.62, -0.55);
  box(board, 1.2, 1.2, 0.05, '#e9edf2', 0, 0, 0); for (const s of [-1, 1]) rod(board, [s * 0.4, -0.6, -0.03], [s * 0.56, -1.62, -0.03], 0.025, '#8a94a3'); rod(board, [0, -0.5, -0.05], [0, -1.62, -0.5], 0.025, '#8a94a3');
  panel(board, 1.12, 1.12, smat(mapTex(), 1), 0, 0, 0.03);
  const hot = new THREE.MeshBasicMaterial({map: northTex(), transparent: true, opacity: 0, depthWrite: false}); soft(panel(board, 1.12, 1.12, hot, 0, 0, 0.034));
  return {
    light: () => ({...LIGHT.show, sky: '#d8e2ff', amb: 1.3}),
    tick: ({f, cam, shot}) => {
      agent.show(f >= W(169) + 6 ? 'point' : 'idle'); agent.node.position.y = UP + hop(f, W(169) + 6, 0.08, 8);
      hot.opacity = shot.v === 'nk' ? smooth(f, W(171), W(171) + 5) * (0.92 + 0.08 * Math.sin((f - W(171)) * 0.2)) : 0;
      agent.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ North Korea's reply, carried by its state news agency.
// The figure is the agency's voice, nobody in particular: the statement's author is named on the quote card and is not drawn.
export const pyong: Builder = (root) => {
  backdrop(root, ['#1a0a10', '#3a1420']);
  floor(root, 14, 12, tmat(tiled(tileTex('py', '#b9a98f', '#9a8a70', 2, '#c6b79d'), 7, 6)));
  box(root, 9, 5.6, 0.3, tmat(tiled(foldTex('py-cur', '#8a1f2a', '#56121a'), 3, 1)), 0, 2.8, -1.95);
  flagPole(root, -1.12, -1.4, flagNK()); flagPole(root, 1.12, -1.4, flagNK(), {left: true});
  lectern(root, 0, 0.35, '#3a2a22', signTex('plaque-py', 400, 190, '#56121a', '#fffdf4', [['STATE MEDIA', 112, 0.56]], {border: '#e7c56a'}));
  const UP = 0.2;
  const reader = actor(root, ANCHOR, {idle: {expr: 'stern'}, read: {expr: 'stern', pose: 'hold', prop: 'paper'}}, 0, UP, -0.3, {scale: 1.25, res: 1.2});
  return {
    light: () => ({...LIGHT.show, sky: '#ffe2d8', amb: 1.25}),
    tick: ({f, cam, shot}) => {
      const up = shot.v === 'quote' || f >= W(177);
      reader.show(up ? 'read' : 'idle'); reader.node.position.y = UP + hop(f, W(177), 0.08, 8); reader.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ Mar-a-Lago, Halloween
export const party: Builder = (root) => {
  backdrop(root, ['#0a0b24', '#2a1c4a', '#6a3a5a']);
  floor(root, 16, 12, tmat(tiled(tileTex('terrace', '#e2c9a4', '#b99a72', 2, '#d2b68c'), 8, 6)));
  const house = tex('mansion', 1400, 920, (g, w, h) => {
    const wall = '#e7c193', roof = '#b5553a';
    g.fillStyle = wall; g.fillRect(0, 330, w, h - 330); g.fillStyle = roof; g.fillRect(0, 300, w, 46);
    g.fillStyle = wall; g.fillRect(150, 60, 250, 280); g.fillStyle = roof; g.beginPath(); g.moveTo(120, 70); g.lineTo(275, 0); g.lineTo(430, 70); g.closePath(); g.fill();
    const arch = (x: number, y: number, aw: number, ah: number, c: string) => { g.fillStyle = c; g.beginPath(); g.moveTo(x - aw / 2, y); g.lineTo(x - aw / 2, y - ah + aw / 2); g.arc(x, y - ah + aw / 2, aw / 2, Math.PI, 0); g.lineTo(x + aw / 2, y); g.closePath(); g.fill(); g.strokeStyle = '#8a5a36'; g.lineWidth = 8; g.stroke(); };
    arch(275, 250, 90, 150, '#ffd98a');
    for (let i = 0; i < 6; i++) arch(120 + i * 232, 760, 140, 300, i % 2 ? '#ffd98a' : '#ffb85a');
    g.fillStyle = 'rgba(90,50,20,.18)'; for (let y = 350; y < h; y += 46) g.fillRect(0, y, w, 3);
  });
  soft(panel(root, 9.2, 6.05, smat(house, 0.92, true), 0, 3.02, -3.2));
  box(root, 9, 0.09, 0.2, '#f1e2c6', 0, 0.98, -1.7); box(root, 9, 0.1, 0.24, '#f1e2c6', 0, 0.05, -1.7); for (let x = -3.3; x <= 3.3; x += 0.3) cyl(root, 0.05, 0.86, '#f1e2c6', x, 0.52, -1.7, 0.035, 10);
  palm(root, -1.75, -2.3, 3.5, 0.5); palm(root, 1.95, -2.5, 3.9, -0.5);
  pumpkin(root, -0.98, 1.02, -1.7, 1.1); pumpkin(root, 1.02, 1.02, -1.7, 0.95); pumpkin(root, -1.5, 0, -0.9, 1.25);
  const bulbs = Array.from({length: 15}, (_, i) => { const u = i / 14, x = lerp(-2.2, 2.2, u), y = 3.42 - 0.62 * 4 * u * (1 - u); return ball(root, 0.055, lamp(['#ff9a2a', '#b06aff', '#7aff6a'][i % 3], 1.8), x, y, -0.9); });
  bulbs.forEach((b) => { b.castShadow = false; });
  for (let i = 0; i < 14; i++) { const u0 = i / 14, u1 = (i + 1) / 14, y = (u: number) => 3.46 - 0.62 * 4 * u * (1 - u); rod(root, [lerp(-2.2, 2.2, u0), y(u0), -0.9], [lerp(-2.2, 2.2, u1), y(u1), -0.9], 0.008, '#15161b'); }
  soft(mesh(root, new THREE.CircleGeometry(0.5, 32), lit('#fff3c4', 1.25), 1.5, 5.2, -9));
  boom(root, [-1.6, 0.45, 1.7], [-0.52, 1.26, 0.5]); boom(root, [1.6, 0.4, 1.7], [0.55, 1.2, 0.5], '#b3211d'); boom(root, [-1.3, 0.15, 1.55], [-0.14, 1.0, 0.62], '#2f6fd0');
  const pres = actor(root, PRESIDENT, {idle: {expr: 'neutral'}, shrug: {expr: 'neutral', pose: 'shrug'}}, 0, 0, 0, {scale: 1.12, res: 1.2});
  return {
    light: () => ({...LIGHT.dusk, sky: '#c9b0ff', ground: '#4a3a5a', amb: 1.25, key: '#ffd0a0', keyI: 1.2}),
    tick: ({f, cam}) => {
      pres.show(f >= W(187) ? 'shrug' : 'idle'); pres.node.position.y = hop(f, W(187), 0.07, 8); pres.tick(f, cam);
      bulbs.forEach((b, i) => { (b.material as THREE.MeshBasicMaterial).color.set(['#ff9a2a', '#b06aff', '#7aff6a'][i % 3]).multiplyScalar(1.5 + 0.4 * Math.sin(f * 0.09 + i * 1.3)); });
    },
  };
};

// ------------------------------------------------------------------ a court with nobody in the dock
export const court: Builder = (root) => {
  backdrop(root, ['#1a120c', '#2a1c12']);
  floor(root, 14, 12, tmat(tiled(woodTex('court-floor', '#9a7a56', '#5a4028'), 5, 5)));
  box(root, 9, 5.6, 0.3, tmat(tiled(woodTex('court-wall', '#6a4a30', '#3a2616'), 4, 3)), 0, 2.8, -2.25);
  for (const x of [-1.6, 1.6]) box(root, 0.22, 5.6, 0.2, '#4a321e', x, 2.8, -2.05);
  box(root, 2.5, 1.18, 0.7, '#5a3a22', 0.3, 0.59, -1.2); box(root, 2.7, 0.08, 0.86, '#7a5232', 0.3, 1.22, -1.2); box(root, 2.1, 0.7, 0.04, '#6b4628', 0.3, 0.62, -0.84);
  const mallet = grp(root, 1.1, 1.3, -1.0); cyl(mallet, 0.06, 0.2, '#3a2616', 0, 0.02, 0).rotation.z = Math.PI / 2; rod(mallet, [0, 0.02, 0], [0.04, 0.02, 0.34], 0.018, '#8a6a48'); cyl(root, 0.11, 0.04, '#3a2616', 0.86, 1.28, -0.98);
  const judge = actor(root, JUDGE, {think: {expr: 'stern', pose: 'think'}, shrug: {expr: 'neutral', pose: 'shrug'}}, 0.3, 0.2, -1.62, {scale: 1.12, res: 1.0});
  const dock = grp(root, -0.45, 0, 0.35), wood = '#6b4628';
  box(dock, 1.3, 0.08, 0.1, wood, 0, 0.98, 0.5); for (const x of [-0.6, -0.2, 0.2, 0.6]) box(dock, 0.07, 0.98, 0.07, wood, x, 0.49, 0.5);
  for (const s of [-1, 1]) { box(dock, 0.1, 0.08, 1.0, wood, s * 0.6, 0.98, 0); box(dock, 0.07, 0.98, 0.07, wood, s * 0.6, 0.49, -0.5); }
  box(dock, 0.5, 0.07, 0.46, '#8a5a36', 0, 0.5, -0.1); box(dock, 0.5, 0.62, 0.07, '#8a5a36', 0, 0.84, -0.32); for (const [x, z] of [[-0.2, -0.28], [0.2, -0.28], [-0.2, 0.08], [0.2, 0.08]]) box(dock, 0.05, 0.5, 0.05, '#5a3a22', x, 0.25, z);
  beam(root, 0.2, 0.85, 4.6, '#fff0c8', 0.13, -0.45, 4.6, 0.3); pool(root, 1.0, '#fff0c8', 0.42, -0.45, 0.3);
  return {
    light: () => ({...LIGHT.warm, amb: 1.15}),
    tick: ({f, cam}) => { judge.show(f >= W(197) ? 'shrug' : 'think'); judge.node.position.y = 0.2 + hop(f, W(197), 0.07, 8); judge.tick(f, cam); mallet.rotation.z = 0; },
  };
};

// ------------------------------------------------------------------ the wall of months
const leaf = (month: string, draw: (g: G2) => void, note: string) => tex('leaf-' + month, 300, 384, (g) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, 300, 384); g.fillStyle = '#e3342f'; g.fillRect(0, 0, 300, 96); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, 290, 374); g.lineWidth = 7; g.beginPath(); g.moveTo(0, 96); g.lineTo(300, 96); g.stroke();
  text(g, month, 150, 53, 78, '#ffffff'); draw(g); text(g, note, 150, 344, 30, INK, {font: 'Montserrat', maxWidth: 270});
});
export const wall: Builder = (root) => {
  backdrop(root, ['#10141c', '#1c2430']);
  floor(root, 14, 12, tmat(tiled(grainTex('wall-floor', '#262c38', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, '#3b4553', 0, 2.8, -1.32);
  box(root, 3.34, 1.56, 0.06, '#5a4028', 0, 1.6, -1.13);
  panel(root, 3.2, 1.42, smat(tex('cork', 512, 256, (g, w, h) => { g.fillStyle = '#c9a877'; g.fillRect(0, 0, w, h); const r = rng(7); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(90,60,30,${0.08 + r() * 0.18})`; g.fillRect(r() * w, r() * h, 3, 3); } }), 1), 0, 1.6, -1.095);
  const eyes = (g: G2) => { drawHood(g, 150, 214, 84); };
  const L = [
    leaf('JUNE', (g) => { g.fillStyle = '#c79a62'; g.strokeStyle = INK; g.lineWidth = 7; g.fillRect(84, 150, 132, 116); g.strokeRect(84, 150, 132, 116); g.fillStyle = '#06090b'; g.fillRect(104, 186, 92, 34); g.fillStyle = '#ffd76a'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(150 + d * 22, 203, 9, 12, 0, 0, 7); g.fill(); } }, 'RIGGED TOOL'),
    leaf('JULY', eyes, '…'), leaf('AUG', eyes, '…'),
    leaf('SEPT', (g) => { drawMask(g, 104, 214, 58, 'hr'); drawMask(g, 200, 220, 58, 'ceo'); }, 'FAKE INTERVIEWS'),
    leaf('OCT', (g) => { for (let i = 0; i < 5; i++) { g.fillStyle = '#f0b90b'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(150, 268 - i * 24, 62, 20, 0, 0, 7); g.fill(); g.stroke(); } }, 'THE HEIST'),
  ];
  const XS = [-1.16, -0.58, 0, 0.58, 1.16], PY = 1.97, TILT = [0.04, -0.03, 0.02, -0.04, 0.03];
  XS.forEach((x, i) => { const m = panel(root, 0.5, 0.64, smat(L[i], 1), x, 1.62, -1.07 + i * 0.001); m.rotation.z = TILT[i]; });
  const pins = XS.map((x) => { const b = ball(root, 0.04, lit('#e3342f', 1.25), x, PY, -1.03); b.castShadow = false; return b; });
  const strings = XS.slice(1).map((x, i) => {
    const g = grp(root, XS[i], PY, -1.03), geo = new THREE.CylinderGeometry(0.011, 0.011, 1, 8); geo.translate(0, 0.5, 0); geo.rotateZ(-Math.PI / 2);
    const m = soft(mesh(g, geo, lit('#e3342f', 1.3))); return {m, len: x - XS[i]};
  });
  const ring = soft(panel(root, 0.5, 0.42, smat(tex('wall-ring', 256, 216, (g) => { g.strokeStyle = '#e3342f'; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.ellipse(128, 108, 108, 88, 0.1, 0.4, 6.6); g.stroke(); }), 1.1, true), XS[0], 1.57, -1.05));
  return {
    light: () => ({...LIGHT.room, amb: 1.4}),
    tick: ({f, shot}) => {
      // the string runs from June to October a little ahead of the camera that follows it
      const head = shot.v === 'campaign' ? lerp(XS[0], XS[4], smooth(f, W(218) - 2, W(222) - 16)) : XS[0];
      ring.visible = f >= W(216); ring.scale.setScalar(pop(f, W(216), 6));
      strings.forEach((s, i) => { const k = clamp01((head - XS[i]) / s.len); s.m.visible = k > 0; s.m.scale.x = Math.max(0.001, s.len * k); });
      pins.forEach((p, i) => { p.visible = i === 0 || head >= XS[i] - 0.001; });
    },
  };
};

// ------------------------------------------------------------------ the closing question
export const final: Builder = (root) => {
  backdrop(root, ['#07090f', '#131a2a']);
  floor(root, 14, 12, tmat(tiled(grainTex('final', '#1b2232', 0.1), 5, 4)));
  const LX = -0.64, RX = 0.66;
  const eng = actor(root, ENGINEER(1), {a: {expr: 'neutral'}}, LX, 0, 0.2, {scale: 1.0, res: 1.0});                       // nobody here is made to squirm: the light asks the question
  const win = tex('final-facade', 256, 512, (g, w, h) => { g.fillStyle = '#1a2038'; g.fillRect(0, 0, w, h); const q = rng(5); for (let y = 0; y < 12; y++) for (let x = 0; x < 4; x++) { g.fillStyle = q() < 0.55 ? '#ffd98a' : '#2f3b66'; g.fillRect(x * 64 + 11, y * 42.6 + 9, 42, 26); } });
  box(root, 0.92, 2.24, 0.7, tmat(win), RX, 1.12, -0.75);
  box(root, 0.98, 0.26, 0.08, '#11141d', RX, 1.85, -0.38); panel(root, 0.9, 0.2, smat(signTex('binance-small', 450, 100, '#11141d', GOLD, [['BINANCE', 90, 0.56]]), 1.2), RX, 1.85, -0.335);
  const co = actor(root, SPOKES, {a: {expr: 'neutral'}}, RX, 0, 0.25, {scale: 0.98, res: 1.0});
  const spots = [LX, RX].map((x) => ({cone: beam(root, 0.14, 0.6, 5.2, '#fff0c8', 0, x, 5.2, 0.2), floor: pool(root, 0.9, '#fff0c8', 0, x, 0.2)}));   // the two cones never overlap
  const q = soft(panel(root, 0.6, 0.86, smat(tex('qmark', 256, 368, (g) => text(g, '?', 128, 196, 330, '#ffe14a', {stroke: INK, sw: 44})), 1.2, true), 0.01, 1.3, -0.2));
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.05, keyI: 0.7}),
    tick: ({f, cam, shot}) => {
      const a = shot.v === 'choice' ? smooth(f, W(231) - 2, W(231) + 6) : 0, b = shot.v === 'choice' ? smooth(f, W(234) - 2, W(234) + 6) : 0;
      [a, b].forEach((k, i) => { (spots[i].cone.material as THREE.MeshBasicMaterial).opacity = 0.025 + 0.05 * k; (spots[i].floor.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.3 * k; });
      const shade = (k: number) => '#' + new THREE.Color('#7f879c').lerp(new THREE.Color('#ffffff'), k).getHexString();
      eng.tint(shade(a)).show('a'); co.tint(shade(b)).show('a');
      eng.node.position.y = hop(f, W(231), 0.08, 8); co.node.position.y = hop(f, W(234), 0.08, 8);
      q.position.y = 1.3 + 0.05 * Math.sin(f * 0.08); q.rotation.z = 0.08 * Math.sin(f * 0.05); q.scale.setScalar(pop(f, shot.v === 'whose' ? W(223) : 0, 8));
      eng.tick(f, cam); co.tick(f, cam);
    },
  };
};
