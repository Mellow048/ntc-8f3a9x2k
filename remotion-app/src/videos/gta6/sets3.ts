// Sets of the GTA 6 leaker short, part 3: the courthouse, the publisher's office, the players' den, the line-up.
import * as THREE from 'three';
import {backdrop, box, cyl, floor, grainTex, grp, hop, lit, panel, rod, slab, smat, soft, tex, text, tiled, tmat, torus} from './kit';
import {actor, DETECTIVE, EXEC, FAN, LAWYER, LEEK, ZELNICK} from './cast';
import {column, plant, signTex, skylineTex} from './props';
import {LIGHT, coin3d, coverTex, disc3d, leek3d, type Builder} from './sets';
import {W} from './story';

const STONE = '#e7e1d2';

// ------------------------------------------------------------------ federal court: the subpoenas
export const court: Builder = (root) => {
  backdrop(root, ['#5aa8f0', '#bfe0ff', '#fff3dc']);
  floor(root, 60, 40, tmat(tiled(grainTex('plaza', '#cfc8b8', 0.1), 10, 8)));
  for (let i = 0; i < 6; i++) box(root, 9 - i * 0.2, 0.22, 0.6, STONE, 0, 0.11 + i * 0.22, 2.2 - i * 0.6);
  box(root, 8.2, 1.32, 3.2, STONE, 0, 0.66, -2.6);
  for (const x of [-3.1, -1.86, -0.62, 0.62, 1.86, 3.1]) column(root, x, 1.32, -1.6, 0.26, 3.6);
  box(root, 8.4, 0.5, 1.2, STONE, 0, 5.17, -1.7); slab(root, [[-4.3, 0], [4.3, 0], [0, 1.5]], 1.0, STONE, 0, 5.42, -1.7);
  panel(root, 6.4, 0.36, smat(signTex('court', 1024, 60, STONE, '#5a5248', [['UNITED STATES COURTHOUSE', 46]]), 1), 0, 5.17, -1.09);
  box(root, 8, 3.8, 0.3, '#d9d2c0', 0, 3.2, -2.9); panel(root, 1.5, 2.6, lit('#3a2f28', 1), 0, 2.62, -2.74);
  const team = [-0.85, 0.05, 0.95].map((x, i) => actor(root, LAWYER(i), {a: {expr: 'stern', pose: i === 2 ? 'hang' : 'hold', prop: i === 2 ? 'case' : 'paper'}}, x, 0, 2.6, {scale: 1.05}));
  const writ = panel(root, 1.7, 0.6, smat(signTex('subpoena', 476, 168, '#fffdf4', '#17171d', [['SUBPOENA', 96, 0.4], ['WHO IS BEHIND THE ACCOUNT?', 26, 0.82]], {border: '#b3262f'}), 1.05), 0, 0, 0);
  return {
    light: () => LIGHT.day,
    tick: ({f, t, cam}) => {
      const k = Math.min(1, t / 70), z = 2.9 - 2.4 * k, y = Math.max(0, Math.min(1.32, (2.5 - z) / 0.6 * 0.22));
      team.forEach((a, i) => { a.node.position.set(a.node.position.x, y + 0.09 * Math.abs(Math.sin(f * 0.5 + i * 1.1)), z + (i === 1 ? -0.25 : 0)); a.tick(f, cam); });
      writ.position.set(0.05, y + 3.0 + 0.05 * Math.sin(f * 0.5), z + 0.1); writ.rotation.z = 0.04 * Math.sin(f * 0.25);
    },
  };
};

// ------------------------------------------------------------------ the publisher's office
export const office: Builder = (root) => {
  backdrop(root, ['#7ab8f0', '#d0e8ff']);
  floor(root, 14, 12, tmat(tiled(grainTex('carpet', '#3a4468', 0.1), 5, 5)));
  panel(root, 9, 4.4, smat(skylineTex('day', '#6ab0f0', '#d8ecff', '#8a9ac0', '#e8f2ff', 14), 1.05), 0, 2.9, -3.3);
  for (const x of [-4, -2, 0, 2, 4]) box(root, 0.1, 4.6, 0.12, '#2a3048', x, 2.9, -3.2); for (const y of [0.7, 5.1]) box(root, 9.2, 0.14, 0.14, '#2a3048', 0, y, -3.2); box(root, 9.2, 0.7, 0.2, '#2a3048', 0, 0.35, -3.2);
  box(root, 2.6, 0.08, 1.0, '#6b4a2d', 0, 0.9, -0.95); box(root, 2.4, 0.86, 0.9, '#4a3320', 0, 0.45, -0.95);
  panel(root, 1.4, 0.22, smat(signTex('t2', 640, 100, '#17171d', '#ffffff', [['TAKE-TWO INTERACTIVE', 62]]), 1.1), 0, 0.72, -0.49);
  plant(root, -2.2, -2.4, 1.2); plant(root, 2.3, -2.5, 1.0);
  // the offer arrives: a letter, and a leek as the calling card
  const note = grp(root, 0, 0.94, -0.8); box(note, 0.5, 0.012, 0.36, '#fffdf4', -0.25, 0.006, 0).rotation.y = 0.2; leek3d(note, 0.55, 0.07, 0.05, 0.42).rotation.z = Math.PI / 2 - 0.08;
  const execs = [actor(root, EXEC(0), {a: {expr: 'nervous', pose: 'think'}, b: {expr: 'dazed', pose: 'shrug'}}, -0.78, 0, -0.1, {scale: 1.1}), actor(root, EXEC(1), {a: {expr: 'stern', pose: 'hold', prop: 'paper'}, b: {expr: 'shock', pose: 'hold', prop: 'paper'}}, 0.75, 0, -0.2, {scale: 1.1})];
  // the boss, and a disc as a museum piece
  const boss = grp(root), glass = new THREE.MeshBasicMaterial({color: '#bfe8ff', transparent: true, opacity: 0.25, depthWrite: false});
  const z = actor(boss, ZELNICK, {a: {expr: 'neutral', pose: 'point'}, b: {expr: 'smile', pose: 'shrug'}}, -0.35, 0, 0.1, {scale: 1.15, res: 1.3});
  const dc = grp(boss, 0.74, 0, 0.35); box(dc, 0.5, 0.95, 0.5, '#e9e4d6', 0, 0.475, 0); box(dc, 0.56, 0.05, 0.56, '#c9a94f', 0, 0.975, 0); soft(box(dc, 0.46, 0.62, 0.46, glass, 0, 1.31, 0));
  const disc = disc3d(dc, 0.18, 0, 1.27, 0); cyl(dc, 0.015, 0.1, '#c9a94f', 0, 1.05, 0);
  panel(dc, 0.38, 0.13, smat(signTex('museum', 228, 78, '#c9a94f', '#17171d', [['GAME DISC', 36, 0.36], ['physical media', 20, 0.78]], {font: 'Montserrat'}), 1), 0, 0.6, 0.255);
  return {
    light: () => ({...LIGHT.room, sky: '#eaf4ff', amb: 1.5}),
    tick: ({f, t, cam, shot}) => {
      const n = shot.v === 'note'; note.visible = n; boss.visible = !n;
      execs.forEach((e, i) => { e.node.visible = n; e.show(t > 12 ? 'b' : 'a'); e.node.position.y = hop(t, 12 + i * 2, 0.14, 9); if (n) e.tick(f, cam); });
      if (!n) { z.show(Math.floor(f / 9) % 2 ? 'a' : 'b'); z.node.position.y = hop(f, W(203), 0.1, 8); z.tick(f, cam); disc.rotation.y = f * 0.05; }
    },
  };
};

// ------------------------------------------------------------------ the players
export const fans: Builder = (root) => {
  backdrop(root, ['#1a1030', '#3a2060']);
  floor(root, 14, 12, tmat(tiled(grainTex('rug', '#4a3a70', 0.12), 5, 5)));
  box(root, 10, 5, 0.3, '#2a1f4a', 0, 2.5, -2.6);
  box(root, 9, 0.05, 0.05, lit('#ff5fa8', 2), 0, 4.3, -2.42); box(root, 9, 0.05, 0.05, lit('#35c8d0', 2), 0, 0.3, -2.42);
  const cov = ([['a', '#2f8fd0', '#123a6a', 'RACE'], ['b', '#3f9b6a', '#0f3a26', 'GOAL'], ['c', '#7a4fd0', '#2a1050', 'ORBIT'], ['d', '#d04a3a', '#5a140f', 'DRAGON']] as const).map(([k, c1, c2, l]) => tmat(coverTex(k, c1, c2, l)));
  for (let row = 0; row < 2; row++) { box(root, 4.4, 0.06, 0.3, '#5a4298', 0, 2.3 + row * 0.7, -2.3); for (let i = 0; i < 11; i++) box(root, 0.32, 0.46, 0.07, cov[(i * 3 + row) % 4], -1.9 + i * 0.38, 2.56 + row * 0.7, -2.28); }
  box(root, 3.0, 0.5, 1.0, '#6a4fa8', 0, 0.35, -1.6); box(root, 3.0, 1.0, 0.3, '#5a4298', 0, 0.8, -2.05); for (const s of [-1, 1]) box(root, 0.3, 0.75, 1.0, '#5a4298', s * 1.6, 0.5, -1.6);
  for (const [x, c] of [[-0.8, '#ffd43b'], [0.7, '#35c8d0']] as const) box(root, 0.6, 0.3, 0.16, c, x, 0.78, -1.7).rotation.x = -0.3;
  // the coin with a line through it
  const no = grp(root, 0, 3.05, -0.4); coin3d(no, 0.34); torus(no, 0.46, 0.05, lit('#ff3b47', 1.5), 0, 0, 0.08); rod(no, [-0.32, -0.32, 0.08], [0.32, 0.32, 0.08], 0.05, lit('#ff3b47', 1.5));
  const people = [[-0.8, -0.2], [-0.27, -0.6], [0.27, -0.3], [0.82, -0.65]].map(([x, z], i) => actor(root, FAN(i + 4), {
    no: {expr: 'stern', pose: 'cross'}, yes: {expr: i % 2 ? 'laugh' : 'grin', pose: 'hold', prop: i % 2 ? 'sign' : 'disc'},
  }, x, 0, z, {scale: 1.08}));
  return {
    light: () => ({...LIGHT.room, sky: '#f0d8ff', ground: '#6a5a9a', amb: 1.4}),
    tick: ({f, t, cam, shot}) => {
      const yes = shot.v === 'discs'; no.visible = !yes; no.position.y = 3.05 + 0.05 * Math.sin(f * 0.2); no.scale.setScalar(Math.min(1, 0.4 + t / 8));
      people.forEach((p, i) => { p.show(yes ? 'yes' : 'no'); p.node.position.y = yes ? 0.12 * Math.abs(Math.sin(f * 0.4 + i * 1.2)) : hop(f, W(161) + i * 2, 0.1, 8); p.tick(f, cam); if (!yes) p.mesh.rotation.z = 0.05 * Math.sin(f * 0.5 + i); });
    },
  };
};

// ------------------------------------------------------------------ the line-up: nobody has been identified
export const lineup: Builder = (root) => {
  backdrop(root, ['#20242c', '#3a4050']);
  floor(root, 14, 12, tmat(tiled(grainTex('cell', '#5a6068', 0.12), 5, 5)));
  panel(root, 9, 5, smat(tex('heights', 900, 500, (g, w, h) => {
    g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { const y = h - 40 - i * 46; g.fillStyle = i % 2 ? '#a8a4b0' : '#17171d'; g.fillRect(0, y, w, i % 2 ? 3 : 6); if (i % 2 === 0) for (const x of [44, w - 44]) text(g, `${3 + i / 2}'0"`, x, y - 17, 22, '#17171d', {font: 'Montserrat'}); }
  }), 1), 0, 2.5, -0.9);
  for (const x of [-1.6, 0.4, 2.4]) { box(root, 0.5, 0.12, 0.3, '#2b2f38', x, 4.2, -0.5); soft(box(root, 0.4, 0.04, 0.22, lit('#fff6e0', 2.4), x, 4.13, -0.5)); }
  const row = [-0.62, -0.1, 0.42, 0.94, 1.46].map((x, i) => {
    panel(root, 0.3, 0.22, smat(signTex('num' + i, 136, 100, '#fffdf4', '#17171d', [[String(i + 1), 80]], {border: '#17171d'}), 1.05), x, 0.98, -0.02);
    return actor(root, LEEK, {a: {pose: 'both'}}, x, 0, -0.3, {scale: 0.86, phase: i * 1.9});
  });
  const det = actor(root, DETECTIVE, {a: {expr: 'dazed', pose: 'think'}, b: {expr: 'nervous', pose: 'shrug'}}, -0.72, 0, 1.0, {scale: 0.95});
  return {
    light: () => ({...LIGHT.cold, amb: 1.4}),
    tick: ({f, cam}) => {
      row.forEach((a, i) => { a.node.position.y = hop(f, W(187) + i * 2, 0.08, 8); a.tick(f, cam); });
      det.show(f >= W(187) ? 'b' : 'a'); det.node.position.y = hop(f, W(187), 0.1, 8); det.tick(f, cam);
    },
  };
};
