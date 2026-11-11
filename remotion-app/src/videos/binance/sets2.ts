// Sets of the Binance heist short, part 2: the hackers' back room (and the office it pretends to be), the engineer's
// home desk, the Binance office, the search page, the line from one computer to the next.
import * as THREE from 'three';
import {backdrop, ball, box, clamp01, cone, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, rrect, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, vgrad, woodTex,
  type G2, type Node, type V} from './kit';
import {actor, CON, ENGINEER, FAKE, SECURITY} from './cast';
import {assistant, briefcase, bubble, bug, cardboardFlat, cursor3d, drawHood, drawMask, envelope, folder, GOLD, halo, laptop, magnifier, maskCard, monitor, mug, officeChair, person, plant, ringLight, screenTex, signTex, skylineTex, table} from './props';
import {LIGHT, type Builder} from './sets';
import {W} from './story';

const INK = '#15121c';
/** a sticker on a company laptop: whose machine this is */
const assetTag = () => tex('asset-tag', 420, 204, (g, w, h) => {
  g.fillStyle = GOLD; rrect(g, 4, 4, w - 8, h - 8, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
  text(g, 'PROPERTY OF', w / 2, 44, 34, INK, {font: 'Montserrat', spacing: 3}); text(g, 'BINANCE', w / 2, 108, 86, INK);
  g.fillStyle = INK; const r = rng(4); for (let x = 60; x < w - 60;) { const bw = 3 + Math.round(r() * 6); g.fillRect(x, 156, bw, 28); x += bw + 3 + Math.round(r() * 4); }
});
/** the same lid once somebody else is at the controls */
const takenTag = () => tex('taken-tag', 420, 204, (g, w, h) => { g.fillStyle = '#e3342f'; rrect(g, 4, 4, w - 8, h - 8, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); drawHood(g, w / 2, h / 2 + 8, 70); });
const tent = (p: Node, s: string, x: number, y: number, z: number) => panel(p, 0.2, 0.15, smat(signTex('tent-' + s, 120, 90, '#fffdf4', INK, [[s, 74, 0.56]], {border: INK}), 1), x, y + 0.075, z);

// ------------------------------------------------------------------ the back room, and the office painted on cardboard
const polaroid = (key: string, draw: (g: G2) => void) => tex('photo-' + key, 256, 300, (g) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, 256, 300); g.save(); g.beginPath(); g.rect(18, 18, 220, 214); g.clip(); draw(g); g.restore();
  g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 248, 292); g.lineWidth = 3; g.strokeRect(18, 18, 220, 214);
  g.strokeStyle = '#8f8a96'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 264); g.bezierCurveTo(100, 250, 140, 278, 196, 262); g.stroke();
});
const officeFlat = () => tex('office-flat', 1024, 1306, (g, w, h) => {
  const Y = (m: number) => h - m / 3.7 * h, X = (m: number) => (m + 1.45) / 2.9 * w, S = w / 2.9;         // metres on the flat -> pixels
  g.fillStyle = '#e8e1d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#d3c9b6'; g.fillRect(0, Y(0.9), w, h); g.fillStyle = '#b9ad98'; g.fillRect(0, Y(0.94), w, 0.05 * S);
  // a window with a skyline
  g.fillStyle = '#fffdf4'; g.fillRect(X(-1.3), Y(2.25), 0.98 * S, 1.02 * S); g.fillStyle = '#8fd0f5'; g.fillRect(X(-1.24), Y(2.19), 0.86 * S, 0.9 * S);
  g.fillStyle = '#6fa4c9'; for (const [bx, bw, bh] of [[-1.22, 0.16, 0.44], [-1.04, 0.2, 0.62], [-0.8, 0.14, 0.36], [-0.64, 0.22, 0.52]]) g.fillRect(X(bx), Y(1.29 + bh), bw * S, bh * S);
  g.strokeStyle = '#fffdf4'; g.lineWidth = 0.035 * S; g.beginPath(); g.moveTo(X(-0.81), Y(2.19)); g.lineTo(X(-0.81), Y(1.29)); g.stroke();
  // a certificate, a chart going up
  g.fillStyle = '#fffdf4'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 0.03 * S; g.fillRect(X(0.6), Y(2.05), 0.56 * S, 0.44 * S); g.strokeRect(X(0.6), Y(2.05), 0.56 * S, 0.44 * S);
  g.strokeStyle = '#2fbf71'; g.lineWidth = 0.03 * S; g.lineJoin = 'round'; g.beginPath(); g.moveTo(X(0.67), Y(1.7)); g.lineTo(X(0.8), Y(1.8)); g.lineTo(X(0.9), Y(1.76)); g.lineTo(X(1.08), Y(1.96)); g.stroke();
  // the company's sign: a name that is not there
  g.fillStyle = '#2b3350'; g.fillRect(X(-0.5), Y(2.56), 1.0 * S, 0.3 * S); g.fillStyle = '#12161f'; for (let i = 0; i < 4; i++) g.fillRect(X(-0.42 + i * 0.13), Y(2.5), 0.1 * S, 0.18 * S);
  text(g, 'INC.', X(0.29), Y(2.4), 0.19 * S, '#ffffff');
  // a plant in a pot, painted
  g.fillStyle = '#4f9a5e'; for (const [dx, dy, r] of [[0, 0.52, 0.2], [-0.16, 0.36, 0.17], [0.16, 0.38, 0.17], [0, 0.3, 0.16]]) { g.beginPath(); g.ellipse(X(1.1 + dx), Y(0.9 + dy), r * S, r * 1.2 * S, 0, 0, 7); g.fill(); }
  g.fillStyle = '#c9744a'; g.fillRect(X(0.96), Y(1.14), 0.28 * S, 0.24 * S);
});
export const den: Builder = (root) => {
  backdrop(root, ['#05080d', '#0b1118']);
  floor(root, 14, 12, tmat(tiled(grainTex('den', '#20262c', 0.14), 5, 4)));
  const brick = tex('brick', 256, 128, (g) => {
    g.fillStyle = '#16262c'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#1f353b';
    for (let y = 0; y < 4; y++) for (let x = -1; x < 4; x++) g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26);
  }, true);
  box(root, 9, 5.8, 0.3, tmat(tiled(brick, 7, 9)), 0, 2.9, -2.4);
  // the board: who works on the wallets. Nobody on it is anybody.
  const HEADS: [number, number][] = [[0, 0.2], [-0.44, -0.04], [0, -0.04], [0.44, -0.04], [-0.54, -0.31], [-0.18, -0.31], [0.18, -0.31], [0.54, -0.31]], MARKED = [1, 5, 6];
  const board = grp(root, 0, 1.75, -2.22);
  box(board, 1.64, 1.14, 0.06, '#5a4028', 0, 0, 0);
  panel(board, 1.5, 1.0, smat(tex('org', 1024, 683, (g, w, h) => {
    const X = (m: number) => (m + 0.75) / 1.5 * w, Y = (m: number) => (0.5 - m) * h, S = w / 1.5;
    g.fillStyle = '#c9a877'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,60,30,${0.1 + r() * 0.16})`; g.fillRect(r() * w, r() * h, 3, 3); }
    g.fillStyle = '#fffdf4'; g.strokeStyle = INK; g.lineWidth = 5; g.fillRect(X(-0.4), Y(0.47), 0.8 * S, 0.13 * S); g.strokeRect(X(-0.4), Y(0.47), 0.8 * S, 0.13 * S); text(g, 'WALLET TEAM', w / 2, Y(0.4), 0.105 * S, INK);
    g.strokeStyle = '#4a3622'; g.lineWidth = 5;
    for (const i of [1, 2, 3]) { g.beginPath(); g.moveTo(X(HEADS[0][0]), Y(HEADS[0][1] - 0.08)); g.lineTo(X(HEADS[i][0]), Y(HEADS[i][1] + 0.1)); g.stroke(); }
    for (const [a, b] of [[1, 4], [1, 5], [3, 6], [3, 7]]) { g.beginPath(); g.moveTo(X(HEADS[a][0]), Y(HEADS[a][1] - 0.08)); g.lineTo(X(HEADS[b][0]), Y(HEADS[b][1] + 0.1)); g.stroke(); }
    HEADS.forEach(([x, y], i) => {
      g.fillStyle = '#fffdf4'; g.strokeStyle = INK; g.lineWidth = 4; g.fillRect(X(x - 0.085), Y(y + 0.1), 0.17 * S, 0.19 * S); g.strokeRect(X(x - 0.085), Y(y + 0.1), 0.17 * S, 0.19 * S);
      person(g, X(x), Y(y + 0.02), 0.085 * S, ['#8fa3b8', '#a8b89a', '#b8a08f'][i % 3]);
      g.fillStyle = '#8f8a96'; g.fillRect(X(x - 0.055), Y(y - 0.065), 0.11 * S, 0.012 * S);
    });
  }), 1), 0, 0, 0.035);
  const ringT = tex('marker-ring', 128, 128, (g) => { g.strokeStyle = '#e3342f'; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.ellipse(64, 64, 50, 54, 0.2, 0.3, 6.6); g.stroke(); });
  const rings = MARKED.map((i) => soft(panel(board, 0.27, 0.29, smat(ringT, 1.1, true), HEADS[i][0], HEADS[i][1] + 0.005, 0.045)));
  cone(root, 0.3, 0.26, '#2a3a40', 0, 3.02, -1.8); const bulb = ball(root, 0.07, lamp('#ffe9b0', 2.2), 0, 2.9, -1.8); bulb.castShadow = false; rod(root, [0, 3.15, -1.8], [0, 5, -1.8], 0.012, '#15161b');
  // pegs with the faces they wear, a rail with the jackets
  box(root, 0.62, 2.0, 0.05, '#31424a', 1.5, 1.62, -2.22); (['pd', 'hr', 'ceo'] as const).forEach((k, i) => maskCard(root, k, 1.5, 2.26 - i * 0.62, -2.18, 0.5));
  rod(root, [-1.95, 1.86, -1.9], [-1.1, 1.86, -1.9], 0.02, '#8a94a3'); for (const x of [-1.95, -1.1]) rod(root, [x, 0, -1.9], [x, 1.86, -1.9], 0.02, '#8a94a3');
  (['#5b6478', '#8a4f9e', '#2c2f3a', '#3f6f9e'] as const).forEach((c, i) => { box(root, 0.2, 0.62, 0.34, c, -1.82 + i * 0.2, 1.5, -1.9); rod(root, [-1.82 + i * 0.2, 1.86, -1.9], [-1.82 + i * 0.2, 1.8, -1.9], 0.012, '#c9d2d8'); });
  // the studio: office carpet, the painted office, a desk, a ring light
  const studio = grp(root);
  floor(studio, 3.4, 3.4, tmat(tiled(grainTex('carpet', '#aeb4c2', 0.08), 2, 2)), 0.012, 0, 0.7);
  const flat = cardboardFlat(studio, 2.9, 3.7, officeFlat()); flat.position.set(1.45, 0, -0.85);
  ringLight(studio, 1.22, 1.25, 1.42, -0.55);
  const desk = grp(studio, 0, 0, 0.32);
  box(desk, 1.56, 0.74, 0.56, tmat(tiled(woodTex('ceo', '#8a5a36', '#5a381e'), 1, 1)), 0, 0.37, 0); box(desk, 1.66, 0.05, 0.66, '#6b4326', 0, 0.765, 0);
  const plate = grp(desk, 0, 0.79, 0.22); box(plate, 0.5, 0.15, 0.04, '#b8963e', 0, 0.075, 0); panel(plate, 0.46, 0.115, smat(signTex('ceo-plate', 300, 76, '#12161f', '#f3d37a', [['CEO', 64, 0.56]]), 1.05), 0, 0.075, 0.021);
  const laps = [-0.42, 0.42].map((x) => laptop(desk, x, 0.79, 0.02, {ry: Math.PI, w: 0.44, body: '#2a2f38', back: smat(takenTag(), 1.3)}));
  const PH = [polaroid('beach', (g) => {
    vgrad(g, 256, 232, ['#6fc4f5', '#bfe9ff']); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(196, 62, 24, 0, 7); g.fill(); g.fillStyle = '#2f8fd0'; g.fillRect(0, 150, 256, 30); g.fillStyle = '#f1d9a0'; g.fillRect(0, 176, 256, 60);
    g.strokeStyle = '#7a5c3e'; g.lineWidth = 9; g.beginPath(); g.moveTo(52, 190); g.quadraticCurveTo(46, 120, 62, 74); g.stroke(); g.fillStyle = '#3f9058'; for (const a of [-2.6, -1.9, -1.2, -0.4, 0.3]) { g.beginPath(); g.ellipse(62 + 30 * Math.cos(a), 74 + 30 * Math.sin(a), 34, 9, a, 0, 7); g.fill(); }
    drawMask(g, 148, 138, 58, 'hr'); g.fillStyle = INK; g.fillRect(104, 118, 88, 16); g.fillRect(110, 118, 34, 26); g.fillRect(152, 118, 34, 26);
  }), polaroid('dog', (g) => {
    g.fillStyle = '#bfe9ff'; g.fillRect(0, 0, 256, 232); g.fillStyle = '#7ccf6a'; g.fillRect(0, 160, 256, 80);
    drawMask(g, 92, 112, 56, 'hr');
    g.fillStyle = '#b9793d'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.ellipse(186, 176, 40, 28, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(206, 132, 26, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#7a4a22'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(206 + d * 24, 122, 9, 18, d * 0.4, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = INK; for (const d of [-1, 1]) { g.beginPath(); g.arc(206 + d * 9, 128, 3.6, 0, 7); g.fill(); } g.beginPath(); g.arc(206, 140, 5, 0, 7); g.fill();
  }), polaroid('cake', (g) => {
    g.fillStyle = '#ffd9ec'; g.fillRect(0, 0, 256, 232); const r = rng(8); for (let i = 0; i < 26; i++) { g.fillStyle = ['#ff5a8a', '#ffd43b', '#3fb8f0', '#7ccf6a'][i % 4]; g.fillRect(r() * 256, r() * 110, 9, 5); }
    drawMask(g, 150, 126, 54, 'hr'); g.fillStyle = '#3fb8f0'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(150, 14); g.lineTo(122, 74); g.lineTo(178, 74); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff4d6'; g.fillRect(28, 172, 84, 50); g.strokeRect(28, 172, 84, 50); g.fillStyle = '#ff7ab0'; g.fillRect(28, 172, 84, 16); g.strokeRect(28, 172, 84, 16);
    for (const x of [48, 70, 92]) { g.fillStyle = '#3fb8f0'; g.fillRect(x - 3, 150, 6, 22); g.fillStyle = '#ffb03a'; g.beginPath(); g.ellipse(x, 143, 5, 8, 0, 0, 7); g.fill(); }
  })];
  const photos = PH.map((t, i) => { const m = soft(panel(root, 0.52, 0.61, smat(t, 1, true), [-0.6, 0, 0.6][i], [1.16, 1.05, 1.16][i], [0.55, 0.72, 0.55][i])); m.rotation.z = [0.14, -0.05, -0.13][i]; return m; });
  const hr = actor(root, FAKE('hr'), {wave: {pose: 'wave'}, show: {pose: 'both'}, bare: {pose: 'hold', prop: 'mask', bare: true}}, 0, 0, -0.15, {scale: 1.0, res: 1.1});
  const ceo = actor(root, FAKE('ceo'), {desk: {pose: 'desk', mode: 'sit'}, oops: {pose: 'shrug', mode: 'sit'}, bare: {pose: 'hold', prop: 'mask', bare: true}}, 0, 0.44, -0.2, {scale: 1.1, res: 1.1});
  const pd = actor(root, FAKE('pd'), {bare: {pose: 'hold', prop: 'mask', bare: true}, on: {pose: 'hips'}}, 0.05, 0, -0.4, {scale: 1.0, res: 1.1});
  const cons = [0, 1, 2].map((i) => actor(root, CON(i), {idle: {}, point: {pose: 'point'}, cross: {pose: 'cross'}, type: {pose: 'type', mode: 'sit'}}, 0, 0, -1, {scale: 1.0}));
  const glow = halo(root, 2.0, '#ff3b2a', 0, 0, 1.15, -1.2);                                          // behind the two at the laptops, never over them
  return {
    light: (v) => v === 'hook' || v === 'hr' || v === 'photos' || v === 'ceo' || v === 'nocompany' ? {...LIGHT.room, amb: 1.5} : {...LIGHT.dark, sky: '#7fe0d0', ground: '#16303a', amb: 0.95, key: '#d8fff4', keyI: 0.75},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, call = v === 'hook' || v === 'hr' || v === 'photos' || v === 'ceo' || v === 'nocompany', after = v === 'nojob' || v === 'remote';
      // the painted office: up for the calls, toppling when the company turns out not to exist, lying on its side afterwards
      const k = v === 'nocompany' ? clamp01((f - W(110)) / 13) : after ? 1 : 0, land = W(110) + 13;
      studio.visible = call || after; flat.rotation.z = -Math.PI / 2 * k * k + (v === 'nocompany' && f > land ? 0.05 * Math.max(0, 1 - (f - land) / 9) * Math.abs(Math.sin((f - land) * 0.7)) : 0);
      desk.visible = v === 'ceo' || v === 'nocompany' || v === 'remote'; plate.visible = v !== 'remote'; laps.forEach((l) => { l.g.visible = v === 'remote'; });
      rings.forEach((r, i) => { const at = W(62) + 1 + i * 6; r.visible = f >= at; r.scale.setScalar(v === 'names' ? pop(f, at, 6) : 1); });
      photos.forEach((m, i) => { const at = W(97) + i * 7; m.visible = v === 'photos' && f >= at; m.scale.setScalar(pop(f, at, 7)); m.position.y = [1.16, 1.05, 1.16][i] + 0.02 * Math.sin(f * 0.09 + i * 2); });
      hr.node.visible = v === 'hook' || v === 'hr' || v === 'photos' || v === 'nojob';
      ceo.node.visible = v === 'ceo' || v === 'nocompany' || v === 'nojob';
      pd.node.visible = v === 'director';
      if (v === 'hook') { hr.show('wave'); hr.node.position.set(0, hop(f, W(17), 0.1, 9), -0.15); hr.mesh.rotation.z = 0.05 * Math.sin(t * 0.5); }
      else if (v === 'hr' || v === 'photos') { hr.show(f >= W(97) - 3 ? 'show' : 'wave'); hr.node.position.set(0, hop(f, W(97) - 3, 0.08, 8), -0.15); }
      else if (v === 'nojob') { hr.show('bare'); hr.node.position.set(-0.56, 0.16 * Math.abs(Math.sin((f - shot.at) * 0.24)), 0.1); }
      if (v === 'ceo' || v === 'nocompany') { ceo.show(f >= land ? 'oops' : 'desk'); ceo.node.position.set(0, 0.44 + hop(f, land, 0.1, 8), -0.2); }
      else if (v === 'nojob') { ceo.show('bare'); ceo.node.position.set(0.56, 0.16 * Math.abs(Math.sin((f - shot.at) * 0.24 + 1.4)), 0.1); }
      if (v === 'director') { const on = f >= W(86); pd.show(on ? 'on' : 'bare'); pd.node.position.y = hop(f, W(86), 0.12, 9); }
      cons.forEach((a, i) => {
        let on = false;
        if (v === 'chart') { on = i > 0; a.show(i === 1 ? 'point' : 'cross'); a.node.position.set(i === 1 ? -0.72 : 0.72, 0, -0.9); }
        else if (v === 'director') { on = i === 2; a.show('cross'); a.node.position.set(-0.95, 0, -1.1); }
        else if (v === 'nojob') { on = i === 1; a.show('idle'); a.node.position.set(0, 0, -1.0); }
        else if (v === 'remote') { on = i < 2; a.show('type'); a.node.position.set(i ? 0.42 : -0.42, 0.44, -0.2); }
        else if (v === 'nocompany') { on = i === 2; a.show('idle'); a.node.position.set(1.95, 0, -0.2); }
        a.node.visible = on; a.tick(f, cam);
      });
      (glow.material as THREE.MeshBasicMaterial).opacity = v === 'remote' ? 0.42 + 0.1 * Math.sin(f * 0.2) : 0;
      (bulb.material as THREE.MeshBasicMaterial).color.set('#ffe9b0').multiplyScalar(2.0 + 0.2 * Math.sin(f * 0.11));
      hr.tick(f, cam); ceo.tick(f, cam); pd.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the second engineer's desk at home
export const home: Builder = (root) => {
  backdrop(root, ['#191420', '#2a2030']);
  floor(root, 14, 12, tmat(tiled(woodTex('home', '#b98a5e', '#7a5636'), 5, 5)));
  box(root, 9, 5.6, 0.3, '#5f8088', 0, 2.8, -2.1); box(root, 9, 0.22, 0.34, '#f1ebe0', 0, 0.11, -2.08);
  box(root, 1.22, 1.32, 0.08, '#f1ebe0', -0.9, 1.72, -1.96); panel(root, 1.08, 1.18, smat(skylineTex('home', '#141a3c', '#39407a', '#0d1230', '#ffd98a', 13), 1), -0.9, 1.72, -1.915);
  box(root, 0.05, 1.18, 0.03, '#f1ebe0', -0.9, 1.72, -1.9); box(root, 1.08, 0.05, 0.03, '#f1ebe0', -0.9, 1.72, -1.9);
  box(root, 1.05, 0.05, 0.26, '#7a5636', 0.95, 1.55, -1.86);
  ([['#e0603a', 0.3], ['#3f8fd0', 0.36], ['#ffd43b', 0.27], ['#7ccf6a', 0.33], ['#c9a0ff', 0.3], ['#f3f1ea', 0.24]] as const).forEach(([c, hh], i) => box(root, 0.085, hh, 0.2, c, 0.58 + i * 0.1, 1.575 + hh / 2, -1.86));
  ball(root, 0.11, '#57a565', 1.3, 1.69, -1.86);
  cyl(root, 0.16, 0.04, '#3a3f4a', 1.45, 0.02, -1.3); cyl(root, 0.02, 1.5, '#3a3f4a', 1.45, 0.77, -1.3); const shade = cone(root, 0.26, 0.32, lit('#ffd79a', 1.5), 1.45, 1.66, -1.3); shade.castShadow = false;
  floor(root, 2.9, 2.0, tmat(tiled(grainTex('rug', '#7a5ac9', 0.1), 2, 1)), 0.012, 0, 0.1);
  plant(root, -1.3, -1.35, 1.05, '#d9a441');
  table(root, 0, 0.3, 1.9, 0.72, {top: '#e2c39c', leg: '#7a5636', skirt: '#cfa97c'});
  officeChair(root, -0.28, -0.38, '#4f5d73');
  const tagM = new THREE.MeshBasicMaterial({map: assetTag()});
  const lap = laptop(root, -0.28, 0.74, 0.36, {ry: Math.PI, w: 0.52, back: tagM});
  mug(root, 0.5, 0.74, 0.45, '#ff7a59'); box(root, 0.3, 0.02, 0.2, '#f3f1ea', 0.74, 0.75, 0.3).rotation.y = 0.2;
  const eng = actor(root, ENGINEER(1), {
    type: {expr: 'neutral', pose: 'type', mode: 'sit'}, look: {expr: 'smile', pose: 'think', mode: 'sit'}, wave: {expr: 'smile', pose: 'wave', mode: 'sit'},
    cv: {expr: 'grin', pose: 'hold', prop: 'cv', mode: 'sit'}, glad: {expr: 'smile', pose: 'type', mode: 'sit'},
  }, -0.28, 0.44, -0.32, {scale: 1.08, res: 1.2});
  const card = (key: string, draw: (g: G2, w: number, h: number) => void, bg = '#f4f6fa') => screenTex('home-' + key, draw, 512, 368, bg);
  const callTile = (kind: 'hr' | 'ceo') => card('call-' + kind, (g, w, h) => {
    g.fillStyle = '#e8e1d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#8fd0f5'; g.fillRect(30, 40, 120, 130); drawHood(g, w / 2, h / 2 + 46, 132); drawMask(g, w / 2, h / 2 + 40, 92, kind);
    if (kind === 'hr') { g.fillStyle = '#e3342f'; rrect(g, w - 150, 18, 132, 46, 12); g.fill(); text(g, '● LIVE', w - 84, 43, 30, '#ffffff', {font: 'Montserrat'}); }
    else {                                                                                            // round two was "in a popular social chat app": a chat, not a claim of video
      g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 6; rrect(g, w - 176, 22, 150, 84, 26); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(w - 150, 102); g.lineTo(w - 168, 134); g.lineTo(w - 116, 104); g.closePath(); g.fill(); g.stroke(); g.fillRect(w - 148, 96, 34, 8);
      g.fillStyle = INK; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w - 138 + i * 37, 64, 10, 0, 7); g.fill(); }
    }
  });
  const T = {
    msg: card('msg', (g, w, h) => {
      g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, w, 78); briefcase(g, 58, 44, 44, '#ffffff'); text(g, 'JOB SITE', 100, 42, 44, '#ffffff', {align: 'left'});
      envelope(g, w / 2 - 20, 220, 150); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(w / 2 + 84, 150, 40, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); text(g, '1', w / 2 + 84, 154, 58, '#ffffff');
    }),
    hr: callTile('hr'), ceo: callTile('ceo'),
    file: card('file', (g, w, h) => { folder(g, w / 2, 132, 150); text(g, 'ASSIGNMENT', w / 2, 248, 54, INK); g.fillStyle = '#c9d2de'; rrect(g, 70, 296, w - 140, 36, 18); g.fill(); }),
    bug: card('bug', (g, w, h) => { bug(g, w / 2, h / 2 + 6, 220); }, '#b3211d'),
  };
  const scr = new THREE.MeshBasicMaterial({map: T.msg}), bub = bubble(root, 0.44, 1.52, 0.2, 0.86, 0.62, scr, [-0.5, -0.3]);
  const bar = soft(panel(bub.g, 0.62, 0.05, lit('#2fbf71', 1.1), 0, -0.219, 0.004));
  const red = pool(root, 1.3, '#ff3b2a', 0, -0.28, 0.6, 0.78);
  return {
    light: (v) => v === 'malware' ? {...LIGHT.warm, sky: '#ff9a8a', ground: '#5a2a2a', key: '#ffb49a', amb: 1.1} : {...LIGHT.warm, amb: 1.35, keyI: 1.05},
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      let on: keyof typeof T | null = null, st = 'type', at = shot.at, fill = -1;
      if (v === 'ping') { at = W(77) - 1; on = f >= at ? 'msg' : null; st = f >= W(78) ? 'look' : 'type'; }
      else if (v === 'call1') { on = 'hr'; st = 'wave'; }
      else if (v === 'call2') { on = 'ceo'; st = 'cv'; }
      else if (v === 'assign' || v === 'work') { on = 'file'; st = 'glad'; fill = v === 'work' ? 1 : smooth(f, W(117), W(119) + 12); }
      else if (v === 'malware') { on = 'bug'; st = 'glad'; }
      bub.g.visible = !!on; if (on) scr.map = T[on];
      const dive = v === 'work' ? smooth(f, shot.at + 2, shot.at + 12) : 0;                              // the file goes into the work computer
      bub.g.scale.setScalar(0.93 * (v === 'work' ? Math.max(0.001, 1 - dive) : pop(f, at, 7))); bub.g.visible = !!on && dive < 0.99;
      bub.g.position.set(lerp(0.44, -0.28, dive), lerp(1.52, 0.95, dive * dive) + 0.012 * Math.sin(f * 0.08), lerp(0.2, 0.42, dive)); bub.g.rotation.z = v === 'malware' ? shake(f, shot.at, 0.06, 12) : 0;
      bar.visible = fill >= 0; bar.scale.x = Math.max(0.001, fill); bar.position.x = -0.31 * (1 - fill);
      tagM.color.set(v === 'malware' ? '#ff8a7a' : '#ffffff');
      (red.material as THREE.MeshBasicMaterial).opacity = v === 'malware' ? 0.42 * smooth(f, shot.at, shot.at + 10) * (0.8 + 0.2 * Math.sin(f * 0.18)) : 0;
      eng.show(st); eng.node.position.y = 0.44 + (v === 'ping' ? hop(f, W(78), 0.06, 8) : 0); eng.tick(f, cam);
      lap.g.position.y = 0.74 + (v === 'work' ? hop(f, shot.at + 11, 0.05, 7) : 0);
    },
  };
};

// ------------------------------------------------------------------ the Binance office, in June
export const office: Builder = (root) => {
  backdrop(root, ['#8fc4ee', '#d6ecfb']);
  floor(root, 14, 12, tmat(tiled(grainTex('office', '#b4bccb', 0.08), 5, 4)));
  panel(root, 10, 5, smat(skylineTex('office', '#8fc4ee', '#e4f2fb', '#9fb2c8', '#d8e6f2', 21), 1), 0, 2.5, -2.7);
  for (const x of [-2.25, -0.75, 0.75, 2.25]) box(root, 0.12, 5.2, 0.12, '#eef1f5', x, 2.6, -2.6);
  box(root, 10, 0.6, 0.2, '#eef1f5', 0, 0.3, -2.6);
  for (const x of [0.3, 1.14]) rod(root, [x, 2.27, -1.3], [x, 5, -1.3], 0.01, '#8a94a3');
  box(root, 1.04, 0.3, 0.05, '#15161d', 0.72, 2.12, -1.3); panel(root, 0.98, 0.24, smat(signTex('wallet-team', 490, 120, '#15161d', GOLD, [['WALLET TEAM', 92, 0.56]]), 1.1), 0.72, 2.12, -1.272);
  table(root, -1.3, -1.55, 1.2, 0.6, {top: '#eef0f3', leg: '#8a94a3', skirt: '#dfe3ea'}); laptop(root, -1.3, 0.74, -1.5, {ry: Math.PI, w: 0.44});
  const mate = actor(root, ENGINEER(2), {a: {expr: 'neutral', pose: 'type', mode: 'sit'}}, -1.3, 0.44, -2.0, {scale: 1.02});
  plant(root, 1.45, -1.7, 1.1, '#e9edf2');
  table(root, 0, 0.3, 1.9, 0.72, {top: '#eef0f3', leg: '#8a94a3', skirt: '#dfe3ea'});
  officeChair(root, 0, -0.38, '#2b2f3a');
  const lap = laptop(root, 0, 0.74, 0.36, {ry: Math.PI, w: 0.52, back: smat(assetTag(), 1)});
  const code = screenTex('code', (g, w) => { const r = rng(9); for (let i = 0; i < 19; i++) { g.fillStyle = ['#7fe3ff', '#ffd76a', '#8fd36a', '#c9a0ff'][i % 4]; g.fillRect(24 + (i % 3) * 22, 22 + i * 17, 70 + r() * (w - 200), 8); } });
  monitor(root, 0.64, 0.74, 0.12, 0.56, 0.36, smat(code, 1), -0.35); mug(root, -0.62, 0.74, 0.42, GOLD);
  const eng = actor(root, ENGINEER(0), {type: {expr: 'neutral', pose: 'type', mode: 'sit'}, think: {expr: 'smile', pose: 'type', mode: 'sit'}, hands: {expr: 'nervous', pose: 'shrug'}}, 0, 0.44, -0.32, {scale: 1.08, res: 1.2});
  const guard = actor(root, SECURITY(0), {bag: {expr: 'stern', pose: 'both', prop: 'bag'}}, 0.66, 0, 0.85, {scale: 1.0, res: 1.0});
  const search = screenTex('search-small', (g, w, h) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 7; rrect(g, 30, 44, w - 60, 86, 43); g.fill(); g.stroke(); magnifier(g, 86, 86, 44);
    text(g, 'developer tool', 132, 88, 46, INK, {font: 'Montserrat', align: 'left', weight: 700});
    for (let i = 0; i < 3; i++) { g.fillStyle = '#c9d2de'; rrect(g, 44, 170 + i * 62, w - 88 - i * 60, 38, 12); g.fill(); }
  }, 512, 368, '#f4f6fa');
  const bub = bubble(root, 0.64, 1.54, 0.2, 0.86, 0.62, new THREE.MeshBasicMaterial({map: search}), [-0.46, -0.3]);
  const beacon = pool(root, 2.6, '#ff3b2a', 0, 0, 0.2, 0.3);
  return {
    light: () => ({...LIGHT.day, amb: 1.6, keyI: 1.5}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, caught = v === 'caught';
      bub.g.visible = v === 'search'; bub.g.scale.setScalar(0.86 * pop(f, shot.at + 1, 7));
      lap.g.visible = !caught; guard.node.visible = caught;
      eng.show(caught ? 'hands' : v === 'search' ? 'think' : 'type'); eng.node.position.set(caught ? -0.4 : 0, caught ? hop(f, W(54), 0.08, 8) : 0.44, -0.32);
      guard.node.position.set(lerp(0.3, 0.66, smooth(f, shot.at, shot.at + 10)), hop(f, W(54), 0.06, 8), 0.85);
      (beacon.material as THREE.MeshBasicMaterial).opacity = caught ? 0.16 + 0.1 * Math.sin(f * 0.22) : 0;
      eng.tick(f, cam); guard.tick(f, cam); mate.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the search page. Every name on it is made up.
export const screen: Builder = (root) => {
  backdrop(root, ['#0c1220', '#1b2740']);
  floor(root, 14, 12, tmat(tiled(grainTex('scr', '#1c2434', 0.1), 5, 4)));
  box(root, 3.6, 0.6, 1.3, '#2a3142', 0, 0.3, 0.15); box(root, 3.7, 0.05, 1.4, '#3a4254', 0, 0.625, 0.15);
  box(root, 2.52, 1.72, 0.08, '#15171d', 0, 1.6, -0.45); box(root, 0.3, 0.2, 0.1, '#22252c', 0, 0.7, -0.45); box(root, 0.9, 0.03, 0.4, '#22252c', 0, 0.665, -0.4);
  const SW = 2.36, SH = 1.56, CY = 1.6, X = (px: number) => (px / 1180 - 0.5) * SW, Y = (py: number) => CY + (0.5 - py / 780) * SH;
  panel(root, SW, SH, smat(tex('search-page', 1180, 780, (g, w, h) => {
    g.fillStyle = '#f4f6fa'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 7; rrect(g, 60, 40, w - 120, 96, 48); g.fill(); g.stroke(); magnifier(g, 124, 88, 46);
    text(g, 'developer tool download', 176, 90, 50, INK, {font: 'Montserrat', align: 'left', weight: 700});
    // the first result: an advertisement
    drawHood(g, 1010, 196, 62);
    g.fillStyle = '#ffffff'; g.lineWidth = 7; rrect(g, 60, 190, w - 120, 270, 22); g.fill(); g.stroke();
    g.fillStyle = '#ffd43b'; rrect(g, 88, 216, 96, 52, 12); g.fill(); g.lineWidth = 5; g.stroke(); text(g, 'AD', 136, 244, 38, INK);
    text(g, 'DEVELOPER TOOL', 204, 244, 60, '#1a4fd0', {align: 'left'}); text(g, 'free download · fast install', 92, 318, 36, '#5a6270', {font: 'Montserrat', align: 'left', weight: 700});
    g.fillStyle = '#2fbf71'; g.lineWidth = 7; rrect(g, 720, 352, 350, 84, 20); g.fill(); g.stroke(); text(g, 'DOWNLOAD', 895, 396, 54, '#ffffff');
    g.fillStyle = '#e3e8ef'; rrect(g, 92, 372, 560, 44, 22); g.fill();
    // the real thing, one place lower
    g.fillStyle = '#ffffff'; g.lineWidth = 5; g.strokeStyle = '#aeb6c2'; rrect(g, 60, 500, w - 120, 220, 22); g.fill(); g.stroke();
    text(g, 'DEVELOPER TOOL', 92, 560, 60, '#8a94a3', {align: 'left'}); text(g, 'official site', 92, 630, 36, '#aeb6c2', {font: 'Montserrat', align: 'left', weight: 700});
  }), 1), 0, CY, -0.405);
  const fill = panel(root, X(92 + 560) - X(92), 0.07, lit('#2fbf71', 1.1), 0, Y(394), -0.4);
  const cur = cursor3d(root, 0.3);
  const pack = grp(root); box(pack, 0.36, 0.3, 0.36, '#c79a62', 0, 0.15, 0); box(pack, 0.37, 0.05, 0.1, '#e7d2a8', 0, 0.3, 0); box(pack, 0.1, 0.31, 0.37, '#e7d2a8', 0, 0.15, 0);
  const slot = soft(panel(pack, 0.3, 0.1, lit('#06090b', 1), 0, 0.2, 0.182));
  const eyes = [-1, 1].map((s) => { const e = soft(mesh(pack, new THREE.CircleGeometry(0.03, 14), lit('#ffd76a', 1.6), s * 0.07, 0.2, 0.186)); e.scale.y = 1.3; return e; });
  return {
    light: () => ({...LIGHT.dark, sky: '#cfe0ff', amb: 1.05, keyI: 0.8}),
    tick: ({f, t}) => {
      const click = W(45), k = smooth(f, click, click + 12), drop = click + 10, land = drop + 6, rigged = W(47) + 1;
      cur.position.set(lerp(X(640), X(900), smooth(t, 0, 3)) + 0.02, lerp(Y(520), Y(420), smooth(t, 0, 3)) - 0.03 - 0.03 * hop(f, click, 1, 5), -0.36);
      fill.scale.x = Math.max(0.001, k); fill.position.x = X(92) + (X(92 + 560) - X(92)) * k / 2; fill.visible = f >= click;
      const u = clamp01((f - drop) / (land - drop));
      pack.visible = f >= drop; pack.position.set(lerp(X(895), 0.5, u), lerp(Y(396), 0.65, u * u) + (f > land ? 0.12 * Math.max(0, 1 - (f - land) / 8) * Math.abs(Math.sin((f - land) * 0.8)) : 0) + hop(f, rigged, 0.1, 8), lerp(-0.3, 0.42, u));
      pack.rotation.y = -0.3 + shake(f, rigged, 0.12, 12); slot.visible = f >= rigged; slot.scale.y = pop(f, rigged, 5);
      eyes.forEach((e) => { e.visible = f >= rigged + 2 && (f - rigged) % 47 !== 30; });
    },
  };
};

// ------------------------------------------------------------------ from one computer to the next
function wire(p: Node, a: V, b: V) {
  const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A), L = d.length(), g = grp(p, a[0], a[1], a[2]);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const mk = (r: number, m: THREE.Material) => { const geo = new THREE.CylinderGeometry(r, r, 1, 10); geo.translate(0, 0.5, 0); const o = soft(mesh(g, geo, m)); return o; };
  const base = mk(0.018, lit('#2f6f8a', 1)); base.scale.y = L;
  const hot = mk(0.026, lit('#ff4a3a', 1.6)), dot = soft(ball(g, 0.07, lit('#ff7a5a', 2.2)));
  return (k: number) => { const u = clamp01(k); hot.visible = u > 0.001; hot.scale.y = Math.max(0.001, L * u); dot.visible = u > 0.001 && u < 0.999; dot.position.y = L * u; };
}
export const net: Builder = (root) => {
  backdrop(root, ['#070b14', '#101a30']);
  floor(root, 26, 12, tmat(tiled(tileTex('net', '#121a2e', '#1e2a48', 2), 13, 6)));
  const H = 0.93;
  // the second engineer's desk
  table(root, -2.75, 0.1, 1.25, 0.62, {top: '#e2c39c', leg: '#7a5636', skirt: '#cfa97c'});
  laptop(root, -2.75, 0.74, 0.16, {ry: Math.PI, w: 0.52, body: '#aeb7c3', back: smat(takenTag(), 1.3)}); tent(root, 'B', -3.18, 0.74, 0.3); mug(root, -2.3, 0.74, 0.25, '#ff7a59');
  plant(root, -3.75, -0.7, 1.0, '#d9a441');
  const glowB = halo(root, 1.5, '#ff3b2a', 0.4, -2.75, 1.0, -0.15);
  // the assistant
  box(root, 1.2, 0.42, 0.8, '#222c44', 0, 0.21, 0); box(root, 1.26, 0.04, 0.86, lit(GOLD, 1.05), 0, 0.42, 0);
  const ai = assistant(root, 0, 0.44, 0);
  // two wallet engineers
  const seats = [2.45, 3.55].map((x, i) => {
    table(root, x, 0.1, 1.0, 0.62, {top: '#eef0f3', leg: '#8a94a3', skirt: '#dfe3ea'}); tent(root, i ? 'C' : 'A', x + 0.34, 0.74, 0.3);
    const tag = new THREE.MeshBasicMaterial({map: assetTag()}), lap = laptop(root, x - 0.08, 0.74, 0.16, {ry: Math.PI, w: 0.5, back: tag});
    const who = actor(root, ENGINEER(i ? 2 : 0), {a: {expr: 'neutral', pose: 'type', mode: 'sit'}}, x - 0.08, 0.44, -0.5, {scale: 1.05});
    const glow = halo(root, 1.0, '#ff3b2a', 0, x - 0.08, 0.9, 0.02);                                     // a red light around the lid, in front of its owner's chest and fading before the face
    return {tag, lap, who, glow};
  });
  const w1 = wire(root, [-2.47, H, 0.2], [-0.5, H, 0.2]), w2 = wire(root, [0.5, H, 0.2], [2.1, H, 0.2]), wc = wire(root, [2.64, H, 0.2], [3.2, H, 0.2]);
  const tA = assetTag(), tT = takenTag();
  return {
    light: () => ({...LIGHT.dark, sky: '#b8c6ff', amb: 1.1, keyI: 0.8}),
    tick: ({f, cam}) => {
      const taken = W(140), a = W(147), c = W(148) + 2;
      w1(smooth(f, W(134) + 2, taken)); w2(smooth(f, W(141) - 4, a - 2)); wc(smooth(f, a, c));
      ai.set(f >= taken); ai.head.rotation.z = shake(f, taken, 0.09, 14); ai.head.position.y = 0.62 + hop(f, taken, 0.08, 8);
      (glowB.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.1 * Math.sin(f * 0.17);
      seats.forEach((s, i) => {
        const at = i ? c : a, on = f >= at; s.tag.map = on ? tT : tA; s.tag.color.setScalar(on ? 1.3 : 1);
        (s.glow.material as THREE.MeshBasicMaterial).opacity = on ? 0.42 * smooth(f, at, at + 6) * (0.85 + 0.15 * Math.sin(f * 0.17 + i)) : 0;
        s.lap.g.position.y = 0.74 + hop(f, at, 0.05, 7); s.who.tick(f, cam);
      });
    },
  };
};
