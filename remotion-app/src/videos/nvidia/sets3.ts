// Sets of the Nvidia short, part 3: courthouse, living room, boardroom, Capitol, press room, restaurant.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, clamp01, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lathe, lerp, lit, panel, pool, pop, rng, rod, rrect, shake, slab, smat, smooth, soft,
  tex, text, tileTex, tiled, tmat, torus, vgrad, woodTex} from './kit';
import {actor, BOARD, COUCH, JENSEN, LAWYER, PRESIDENT, runner, SPOKESMAN, WAITER} from './cast';
import {column, crowd, flagCN, flagPole, flagUS, mug, plant, signTex, skylineTex, streetLamp, tree} from './props';
import {W} from './story';
import {LIGHT, type Builder} from './sets';

const STONE = '#e7e1d2';
const windowsTex = (key: string, wall: string, glass: string) => tex('windows-' + key, 256, 256, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) { g.fillStyle = '#b9b2a2'; g.fillRect(x * 64 + 14, y * 128 + 20, 36, 88); g.fillStyle = glass; g.fillRect(x * 64 + 18, y * 128 + 24, 28, 80); g.fillStyle = '#b9b2a2'; g.fillRect(x * 64 + 31, y * 128 + 24, 2, 80); g.fillRect(x * 64 + 18, y * 128 + 62, 28, 2); }
}, true);

// ------------------------------------------------------------------ courthouse: sued in five minutes
export const courthouse: Builder = (root) => {
  backdrop(root, ['#5c9fe0', '#c6e2f6', '#ffe6c0']);
  floor(root, 60, 40, tmat(tiled(tileTex('plaza2', '#d5cdb8', '#b8ae96', 4), 18, 12)), 0, 0, 4);
  for (let i = 0; i < 6; i++) { const zf = 2.6 - i * 0.44; box(root, 10.4, 0.2, zf + 2.2, i % 2 ? '#ded7c6' : STONE, 0, 0.1 + i * 0.2, (zf - 2.2) / 2); }   // top landing: z -2.2 ... 0.4
  for (let i = 0; i < 6; i++) column(root, -3.5 + i * 1.4, 1.2, -1.1, 0.3, 4.4, STONE);
  box(root, 8.8, 0.8, 1.7, STONE, 0, 6.0, -1.4);
  panel(root, 3.7, 0.5, tmat(signTex('court', 760, 100, STONE, '#5a5346', [['U.S. DISTRICT COURT', 70]], {font: 'Montserrat'})), 0, 6.0, -0.54);
  slab(root, [[-4.6, 0], [4.6, 0], [0, 1.6]], 1.7, STONE, 0, 6.4, -1.4);
  slab(root, [[-3.5, 0.18], [3.5, 0.18], [0, 1.28]], 0.1, '#cfc7b4', 0, 6.4, -0.52);
  rod(root, [0, 6.75, -0.44], [0, 7.4, -0.44], 0.03, '#c9a94f'); rod(root, [-0.5, 7.3, -0.44], [0.5, 7.3, -0.44], 0.025, '#c9a94f');     // scales of justice
  for (const s of [-1, 1]) { rod(root, [s * 0.5, 7.3, -0.44], [s * 0.5, 7.0, -0.44], 0.012, '#c9a94f'); cyl(root, 0.16, 0.03, '#c9a94f', s * 0.5, 6.98, -0.44, 0.1); }
  box(root, 8.6, 5.0, 0.3, '#d8d1c0', 0, 3.7, -2.5);
  box(root, 1.9, 3.2, 0.12, '#5a4636', 0, 2.8, -2.3); box(root, 0.05, 3.1, 0.14, '#3a2c22', 0, 2.8, -2.28); for (const s of [-1, 1]) for (const y of [2.0, 3.5]) box(root, 0.6, 1.0, 0.14, '#6b5442', s * 0.48, y, -2.27);
  for (const x of [-3.0, -1.7, 1.7, 3.0]) { box(root, 0.8, 1.9, 0.1, '#3d5878', x, 3.3, -2.32); box(root, 0.9, 0.1, 0.16, '#b9b2a2', x, 4.3, -2.3); }
  for (const s of [-1, 1]) { box(root, 5, 5.4, 4, tmat(tiled(windowsTex('court', '#ddd6c5', '#40607f'), 2, 2)), s * 7.2, 2.7, -3); box(root, 5.2, 0.3, 4.2, STONE, s * 7.2, 5.5, -3); streetLamp(root, s * 4.9, 3.4); tree(root, s * 7.4, 3.2, 1.25); tree(root, s * 9.5, 1.2, 1.5); }
  // street clock: market close
  const clock = grp(root, 0.9, 0, 3.0);
  cyl(clock, 0.2, 0.16, '#2f4a3c', 0, 0.08, 0); cyl(clock, 0.07, 2.2, '#3a5a48', 0, 1.2, 0); box(clock, 0.3, 0.12, 0.3, '#2f4a3c', 0, 2.28, 0);
  const head = grp(clock, 0, 2.95, 0); head.scale.setScalar(0.86);
  cyl(head, 0.64, 0.24, '#2f4a3c', 0, 0, 0, 0.64, 32).rotation.x = Math.PI / 2;
  const faceT = tex('clock-face', 256, 256, (g) => { g.fillStyle = '#fffdf2'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 - Math.PI / 2; g.fillStyle = '#241726'; g.beginPath(); g.arc(128 + 104 * Math.cos(a), 128 + 104 * Math.sin(a), i % 3 ? 4 : 8, 0, 7); g.fill(); } [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([s, i]) => { const a = (i as number) * Math.PI / 2 - Math.PI / 2; text(g, s as string, 128 + 78 * Math.cos(a), 130 + 78 * Math.sin(a), 38, '#241726'); }); });
  const face = panel(head, 1.14, 1.14, smat(faceT, 1, true), 0, 0, 0.13); soft(face);
  const hourHand = box(head, 0.07, 0.34, 0.02, '#241726', 0, 0, 0.15); hourHand.geometry.translate(0, 0.15, 0);
  const minHand = box(head, 0.045, 0.5, 0.02, '#c1272d', 0, 0, 0.165); minHand.geometry.translate(0, 0.23, 0);
  ball(head, 0.045, '#241726', 0, 0, 0.17);
  // LED readout under the dial: the minutes since the closing bell
  box(clock, 1.0, 0.56, 0.2, '#2f4a3c', 0, 2.0, 0);
  const readout = [0, 1, 2, 3, 4, 5].map((n) => panel(clock, 0.9, 0.46, smat(signTex('led-' + n, 360, 184, '#12060a', '#ff5a4a', [['MARKET CLOSED', 34, 0.24], [`4:0${n} PM`, 92, 0.66]], {glow: '#ff3b2e'}), 1.5), 0, 2.0, 0.105));
  const sprinter = runner(root, LAWYER, -3, 1.2, -0.1, 1.15, 'grin');
  const bag = box(sprinter.node, 0.5, 0.36, 0.12, '#8a5a34', -0.42, 0.95, 0.05); box(sprinter.node, 0.16, 0.06, 0.04, '#3a2c22', -0.42, 1.16, 0.05);
  const puffM = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({color: '#f3eee2', transparent: true, opacity: 0.6, depthWrite: false}));
  const puffs = puffM.map((m) => soft(ball(root, 0.22, m, 0, 1.4, -0.1)));
  const sheets = [0, 1, 2, 3, 4].map(() => box(root, 0.2, 0.27, 0.004, '#fffdf4', 0, 0, -0.2));
  const lawyer = actor(root, LAWYER, {wave: {expr: 'grin', pose: 'hold', prop: 'paper'}, pant: {expr: 'laugh', pose: 'hold', prop: 'paper'}}, -0.16, 0, 3.0, {scale: 1.15, res: 1.2});
  return {
    light: () => LIGHT.day,
    tick: ({f, cam, shot}) => {
      const run = shot.v === 'run', t0 = shot.at, t1 = W(124) + 6, u = clamp01((f - t0) / (t1 - t0));
      const minutes = run ? 5 * clamp01((f - t0 - 6) / (t1 - t0 - 10)) : 5;
      readout.forEach((m, n) => (m.visible = n === Math.min(5, Math.floor(minutes + 0.001))));
      minHand.rotation.z = -minutes / 60 * Math.PI * 2; hourHand.rotation.z = -(4 + minutes / 60) / 12 * Math.PI * 2;
      head.rotation.z = run ? 0 : shake(f, shot.at, 0.16, 16); head.scale.setScalar(run ? 1 : 1 + 0.12 * pop(f, shot.at, 8) - 0.12);
      sprinter.node.visible = run; lawyer.node.visible = !run; bag.visible = run;
      const x = lerp(-2.7, -0.5, u);
      if (run) {
        sprinter.node.position.x = x; sprinter.tick(f);
        puffs.forEach((p, i) => { const age = ((f + i * 4) % 16) / 16; p.visible = u < 0.98; p.position.set(x - 0.5 - age * 1.3, 1.38 + age * 0.3, -0.1); p.scale.setScalar(0.5 + age * 1.3); puffM[i].opacity = 0.6 * (1 - age); });
        sheets.forEach((s, i) => { const age = ((f + i * 7) % 26) / 26; s.visible = u < 0.98; s.position.set(x - 0.4 - age * 2.2, 2.5 + 0.8 * Math.sin(age * 3 + i) + i * 0.1, -0.2 + 0.3 * Math.sin(i)); s.rotation.set(f * 0.3 + i, f * 0.2, i); });
      } else {
        puffs.forEach((p) => (p.visible = false)); sheets.forEach((s) => (s.visible = false));
        lawyer.show(Math.floor(f / 5) % 2 ? 'wave' : 'pant'); lawyer.node.position.y = 0.05 * Math.abs(Math.sin(f * 0.45)); lawyer.tick(f, cam);
      }
    },
  };
};

// ------------------------------------------------------------------ living room: can't even pick a movie
export const living: Builder = (root) => {
  backdrop(root, ['#0b0d1c', '#1b1d38']);
  floor(root, 12, 10, tmat(tiled(woodTex('living', '#5a4234', '#33241c'), 5, 4)));
  cyl(root, 2.1, 0.02, '#7a4668', 0, 0.01, 0.2, 2.1, 40); cyl(root, 1.6, 0.025, '#935a7e', 0, 0.012, 0.2, 1.6, 40);
  box(root, 10, 4.4, 0.2, '#3d3a5e', 0, 2.2, -1.7); box(root, 10, 0.2, 0.26, '#2a2844', 0, 0.1, -1.6);
  const night = tex('night-window', 200, 240, (g) => { vgrad(g, 200, 240, ['#0d1230', '#2a3266']); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(138, 70, 30, 0, 7); g.fill(); g.fillStyle = '#0d1230'; g.beginPath(); g.arc(150, 62, 26, 0, 7); g.fill(); const r = rng(3); g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) g.fillRect(r() * 200, r() * 200, 2, 2); });
  panel(root, 1.3, 1.56, smat(night, 1.1), -2.1, 2.5, -1.58); for (const [w, h, x, y] of [[1.5, 0.1, -2.1, 3.32], [1.5, 0.1, -2.1, 1.68], [0.1, 1.7, -2.8, 2.5], [0.1, 1.7, -1.4, 2.5], [0.06, 1.6, -2.1, 2.5]]) box(root, w, h, 0.1, '#e9e4d6', x, y, -1.55);
  for (const s of [-1, 1]) panel(root, 0.5, 2.1, tmat(tiled(foldTex('curtain', '#8a4a6a', '#5a2c44', 5), 1, 1)), -2.1 + s * 0.98, 2.4, -1.5);
  for (const [x, y, c] of [[0.2, 2.9, '#e2a03a'], [1.0, 2.6, '#3f8a8f'], [0.2, 2.1, '#b5524a']] as const) { box(root, 0.62, 0.5, 0.05, '#e9e4d6', x, y, -1.57); box(root, 0.5, 0.38, 0.06, c, x, y, -1.56); }
  // wall clock that spins: time flies while he scrolls
  const wc = grp(root, 2.15, 3.05, -1.56); cyl(wc, 0.36, 0.06, '#e9e4d6', 0, 0, 0, 0.36, 28).rotation.x = Math.PI / 2; cyl(wc, 0.31, 0.065, '#fffdf2', 0, 0, 0.004, 0.31, 28).rotation.x = Math.PI / 2;
  const h1 = box(wc, 0.035, 0.26, 0.02, '#241726', 0, 0, 0.05); h1.geometry.translate(0, 0.11, 0); const h2 = box(wc, 0.045, 0.18, 0.02, '#241726', 0, 0, 0.055); h2.geometry.translate(0, 0.07, 0);
  // floor lamp
  cyl(root, 0.22, 0.05, '#2b2f38', 2.5, 0.025, -0.9); cyl(root, 0.025, 1.9, '#c9a94f', 2.5, 0.95, -0.9); cyl(root, 0.34, 0.42, lit('#ffd08a', 1.5), 2.5, 2.05, -0.9, 0.22, 20); pool(root, 1.6, '#ffc070', 0.3, 2.5, -0.7);
  // couch
  const sofa = grp(root, 0, 0, -0.75);
  box(sofa, 2.7, 0.42, 1.0, '#b5524a', 0, 0.31, 0); box(sofa, 2.7, 0.8, 0.26, '#a8483f', 0, 0.9, -0.42); for (const s of [-1, 1]) { box(sofa, 0.3, 0.66, 1.0, '#a8483f', s * 1.42, 0.5, 0); box(sofa, 1.2, 0.16, 0.76, '#c7645a', s * 0.62, 0.6, 0.08); }
  for (const s of [-1, 1]) for (const z of [-0.4, 0.4]) cyl(sofa, 0.04, 0.1, '#3a2c22', s * 1.3, 0.05, z);
  const pillow = box(sofa, 0.5, 0.46, 0.16, '#e2a03a', -0.92, 0.92, -0.2); pillow.rotation.z = 0.25;
  // cat on the arm
  const cat = grp(sofa, 1.42, 0.84, 0.15);
  ball(cat, 0.2, '#e08a3a', 0, 0.16, 0).scale.set(1, 0.85, 1.35); ball(cat, 0.14, '#e08a3a', 0, 0.36, 0.2); for (const s of [-1, 1]) { cone(cat, 0.05, 0.1, '#e08a3a', s * 0.075, 0.5, 0.2, 8); soft(ball(cat, 0.018, lit('#c8ff5a', 1.6), s * 0.05, 0.38, 0.33)); }
  const tail = rod(cat, [0, 0.16, -0.24], [0.08, 0.42, -0.36], 0.03, '#c9742a');
  // coffee table and snacks
  box(root, 1.5, 0.06, 0.62, '#6b4a2d', 0, 0.42, 0.55); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(root, 0.06, 0.4, 0.06, '#4a3320', sx * 0.66, 0.2, 0.55 + sz * 0.24);
  box(root, 0.52, 0.05, 0.52, '#c9a36a', -0.36, 0.48, 0.55); panel(root, 0.44, 0.44, smat(tex('pizza', 128, 128, (g) => { g.fillStyle = '#c9a36a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#e9b85a'; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.fillStyle = '#d9503a'; g.beginPath(); g.arc(64, 64, 45, 0, 7); g.fill(); g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(64, 64, 41, 0, 7); g.fill(); g.fillStyle = '#b5362a'; for (const [x, y] of [[48, 46], [80, 52], [62, 78], [84, 84], [44, 80]]) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); } })), -0.36, 0.51, 0.55).rotation.x = -Math.PI / 2;
  lathe(root, [[0, 0], [0.1, 0], [0.19, 0.16], [0.2, 0.18]], '#e2453c', 0.32, 0.45, 0.5); for (let i = 0; i < 9; i++) ball(root, 0.05, lit('#fff2b8', 1.05), 0.32 + 0.1 * Math.cos(i * 1.4), 0.62 + (i % 3) * 0.03, 0.5 + 0.1 * Math.sin(i * 1.4));
  for (const x of [0.62, 0.7]) cyl(root, 0.035, 0.12, x > 0.65 ? '#3f8fd0' : '#e2453c', x, 0.51, 0.66 - (x - 0.62) * 2);
  const glow = pool(root, 2.6, '#8fd3ff', 0.26, 0, 1.4, 0.03);
  const guy = actor(root, COUCH, {
    left: {expr: 'neutral', mode: 'sit', pose: 'both', prop: 'remote', look: -1}, right: {expr: 'neutral', mode: 'sit', pose: 'both', prop: 'remote', look: 1},
    dazed: {expr: 'dazed', mode: 'sit', pose: 'both', prop: 'remote'},
  }, 0, 0.5, -0.62, {scale: 1.15, res: 1.2, shadow: 0});
  const hues = ['#ff9a8a', '#8fd3ff', '#ffe08a', '#b8a0ff', '#8affc0'];
  return {
    light: () => ({...LIGHT.dark, amb: 1.05, sky: '#c8d0ff'}),
    tick: ({f, cam, shot}) => {
      const step = Math.floor(f / 4), tired = f > shot.at + 34;
      (glow.material as THREE.MeshBasicMaterial).color.set(hues[step % hues.length]);
      guy.tint(new THREE.Color(hues[step % hues.length]).lerp(new THREE.Color('#ffffff'), 0.72).getStyle());
      guy.show(tired ? 'dazed' : step % 2 ? 'left' : 'right'); guy.tick(f, cam);
      h1.rotation.z = -f * 0.5; h2.rotation.z = -f * 0.042; tail.rotation.z = 0.3 * Math.sin(f * 0.15);
    },
  };
};

// ------------------------------------------------------------------ boardroom: investigation, statement, still CEO
export const boardroom: Builder = (root) => {
  backdrop(root, ['#8fc0ea', '#e3f1ff']);
  floor(root, 12, 12, tmat(tiled(grainTex('boardcarpet', '#40495c', 0.12), 6, 6)), 0, 0, -1);
  box(root, 10, 4.6, 0.2, tmat(tiled(woodTex('boardwall', '#6b4f3a', '#3d2c20'), 4, 2)), 0, 2.3, -4.7);
  box(root, 10, 0.2, 12, '#eceff3', 0, 4.5, -1);
  const win = panel(root, 9, 2.6, smat(skylineTex('board', '#74bcff', '#e3f1ff', '#7a90a8', '#dfeeff', 33), 1.0), -4.6, 2.5, -1, Math.PI / 2);
  for (let z = -4.5; z <= 3.5; z += 2) box(root, 0.14, 2.8, 0.1, '#2b2f38', -4.56, 2.5, z);
  box(root, 0.2, 4.6, 12, '#d9d3c6', 4.7, 2.3, -1);
  const scr = (key: string, lines: [string, number, number, string, number?][], icon: (g: CanvasRenderingContext2D) => void) => tex('board-' + key, 600, 390, (g) => { vgrad(g, 600, 390, ['#0f1c30', '#182a48']); icon(g); for (const [s, size, y, c, mw] of lines) text(g, s, 300, y, size, c, {maxWidth: mw ?? 540}); });
  const glass = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => { g.strokeStyle = '#ffd43b'; g.lineWidth = 16; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.lineCap = 'round'; g.beginPath(); g.moveTo(x + r * 0.72, y + r * 0.72); g.lineTo(x + r * 1.5, y + r * 1.5); g.stroke(); };
  const screens: Record<string, THREE.Mesh> = {
    probe: panel(root, 2.3, 1.5, smat(scr('probe', [['INDEPENDENT', 78, 238, '#ffffff'], ['INVESTIGATION', 78, 326, '#ffd43b']], (g) => glass(g, 276, 92, 50)), 1.15), 0, 2.95, -4.55),
    statement: panel(root, 2.3, 1.5, smat(scr('statement', [['BOARD', 120, 140, '#ffffff'], ['STATEMENT', 104, 272, '#8fd3ff']], () => undefined), 1.15), 0, 2.95, -4.55),
    ceo: panel(root, 2.3, 1.5, smat(scr('ceo', [['STATUS', 50, 96, '#8fd3ff', 400], ['STILL CEO', 130, 232, '#b8f24a', 420]], () => undefined), 1.15), 0, 2.95, -4.55),
  };
  box(root, 2.5, 1.7, 0.1, '#0b0e16', 0, 2.95, -4.62);
  // table, chairs, clutter
  box(root, 1.4, 0.1, 4.3, tmat(tiled(woodTex('boardtable', '#8a6240', '#4f3622'), 1, 3)), 0, 0.8, -1.3); box(root, 0.9, 0.75, 3.5, '#3a2c22', 0, 0.375, -1.3);
  const seat = (x: number, z: number) => { box(root, 0.56, 0.1, 0.56, '#1f2430', x, 0.5, z); const b = box(root, 0.1, 0.95, 0.56, '#262c3a', x + Math.sign(x) * 0.3, 1.0, z); if (!x) { b.scale.set(6.4, 1.15, 0.18); b.position.set(0, 1.1, z - 0.32); } cyl(root, 0.04, 0.45, '#59616f', x, 0.24, z); };
  const spots: [number, number][] = [[-1.02, -0.7], [-1.02, -2.4], [1.02, -1.5], [1.02, -3.0]];
  spots.forEach(([x, z]) => seat(x, z)); seat(0, -3.95);
  for (const [x, z] of [[-0.42, -0.7], [0.42, -1.5], [-0.42, -2.4], [0.42, -3.0]]) { box(root, 0.28, 0.012, 0.38, '#fffdf4', x, 0.86, z).rotation.y = x * 0.5; cyl(root, 0.035, 0.12, lit('#bfe6ff', 0.9), x * 0.4, 0.91, z + 0.3); }
  const laptop = grp(root, 0.05, 0.86, -1.0); box(laptop, 0.44, 0.02, 0.3, '#2b2f38', 0, 0, 0); box(laptop, 0.44, 0.28, 0.02, '#2b2f38', 0, 0.14, -0.15).rotation.x = -0.25;
  box(root, 0.34, 0.03, 0.44, '#c1272d', -0.18, 0.87, -0.1).rotation.y = 0.3;
  for (const z of [-0.4, -2.2]) { rod(root, [0, 4.4, z], [0, 3.9, z], 0.015, '#2b2f38'); box(root, 1.1, 0.08, 0.3, '#2b2f38', 0, 3.86, z); box(root, 1.0, 0.03, 0.24, lit('#fff4dc', 2), 0, 3.81, z); }
  plant(root, 1.9, -4.1, 1.2); plant(root, -1.9, -4.1, 1.0);
  const members = [
    actor(root, BOARD(0), {a: {expr: 'stern', mode: 'sit', pose: 'hold', prop: 'magnifier'}}, spots[0][0], 0.42, spots[0][1], {scale: 1.1, res: 1.0, shadow: 0}),
    actor(root, BOARD(1), {a: {expr: 'neutral', mode: 'sit', pose: 'both', prop: 'tablet'}}, spots[1][0], 0.42, spots[1][1], {scale: 1.1, res: 1.0, shadow: 0}),
    actor(root, BOARD(2), {a: {expr: 'stern', mode: 'sit', pose: 'think'}}, spots[2][0], 0.42, spots[2][1], {scale: 1.1, res: 1.0, shadow: 0}),
    actor(root, BOARD(3), {a: {expr: 'stern', mode: 'sit', pose: 'hold', prop: 'paper'}}, spots[3][0], 0.42, spots[3][1], {scale: 1.1, res: 1.0, shadow: 0}),
  ];
  const jensen = actor(root, JENSEN, {a: {expr: 'nervous', mode: 'sit', pose: 'desk'}, b: {expr: 'smile', mode: 'sit', pose: 'shrug'}}, 0, 0.42, -3.75, {scale: 1.2, res: 1.2, shadow: 0});
  return {
    light: () => ({...LIGHT.room, amb: 1.6, keyI: 1.0}),
    tick: ({f, cam, shot}) => {
      const v = shot.v; win.visible = true;
      for (const [k, m] of Object.entries(screens)) m.visible = k === v;
      members.forEach((m, i) => { m.node.visible = v !== 'ceo'; m.node.position.y = 0.42 + 0.02 * Math.sin(f * 0.12 + i * 1.7); m.node.position.x = spots[i][0] + (v === 'probe' ? 0.05 * Math.sin(f * 0.16 + i) : 0); m.tick(f, cam); });
      laptop.visible = v !== 'ceo';
      jensen.node.visible = v === 'ceo';   // no nameplate on the table: the caption sits there, and the screen already says it
      if (v === 'ceo') { jensen.show(f < W(191) ? 'a' : 'b'); jensen.node.position.y = 0.42 + hop(f, W(191), 0.1, 8); jensen.tick(f, cam); }
    },
  };
};

// ------------------------------------------------------------------ the Capitol: Congress wants a briefing
export const capitol: Builder = (root) => {
  backdrop(root, ['#4f9ae6', '#b9defc', '#eef6ff']);
  floor(root, 90, 60, '#6fa862', 0, 0, 0); floor(root, 5.4, 30, tmat(tiled(tileTex('path', '#ddd6c4', '#c2b99f', 4), 2, 10)), 0.01, 0, 12);
  const b = grp(root, 0, 0, 0); b.scale.setScalar(0.8);
  const C = '#f2eee3', C2 = '#e6e1d3';
  for (let i = 0; i < 7; i++) { const zf = 2.6 - i * 0.42; box(b, 8.2, 0.2, zf + 1.0, i % 2 ? C2 : C, 0, 0.1 + i * 0.2, (zf - 1.0) / 2); }
  box(b, 30, 1.4, 5, C2, 0, 0.7, -3.4);
  box(b, 10, 3.6, 4.4, tmat(tiled(windowsTex('capitol', C, '#4a6a8a'), 3, 1)), 0, 3.2, -3.2);
  for (const s of [-1, 1]) { box(b, 9, 3.2, 3.8, tmat(tiled(windowsTex('capitol', C, '#4a6a8a'), 3, 1)), s * 9.6, 3.0, -3.4); box(b, 9.3, 0.3, 4.1, C2, s * 9.6, 4.75, -3.4); for (let i = 0; i < 5; i++) column(b, s * (6.2 + i * 1.7), 1.4, -1.4, 0.2, 3.2, C); }
  for (let i = 0; i < 8; i++) column(b, -3.15 + i * 0.9, 1.4, -0.6, 0.24, 3.4, C);
  box(b, 7.8, 0.5, 1.5, C, 0, 5.05, -0.9); slab(b, [[-4.0, 0], [4.0, 0], [0, 1.25]], 1.5, C, 0, 5.3, -0.9); slab(b, [[-3.0, 0.16], [3.0, 0.16], [0, 1.0]], 0.08, C2, 0, 5.3, -0.12);
  box(b, 1.5, 2.6, 0.1, '#5a4636', 0, 2.7, -0.96);
  // drum, colonnade, dome, lantern
  cyl(b, 2.6, 1.3, C2, 0, 5.9, -3.2, 2.6, 36); cyl(b, 2.1, 1.7, C, 0, 7.4, -3.2, 2.1, 36);
  for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; cyl(b, 0.09, 1.6, C, 2.42 * Math.cos(a), 7.35, -3.2 + 2.42 * Math.sin(a), 0.08, 8); }
  cyl(b, 2.66, 0.18, C2, 0, 8.25, -3.2, 2.66, 36); cyl(b, 2.3, 0.5, C, 0, 8.6, -3.2, 2.3, 36);
  lathe(b, [[2.2, 0], [2.14, 0.6], [1.9, 1.3], [1.45, 2.0], [0.8, 2.55], [0.36, 2.76], [0, 2.78]], C, 0, 8.85, -3.2, 40);
  cyl(b, 0.34, 0.9, C2, 0, 12.0, -3.2, 0.3, 16); ball(b, 0.36, C, 0, 12.5, -3.2); cone(b, 0.12, 0.8, '#b9a56a', 0, 13.2, -3.2, 10);
  const flag = flagPole(grp(b, 6.4, 4.9, -2.4), 0, 0, flagUS(), 3.0);
  const banner = grp(b, 0, 4.78, -0.1);
  for (const s of [-1, 1]) rod(banner, [s * 1.5, 0, 0], [s * 1.5, -0.1, 0], 0.02, '#3a2c22');
  panel(banner, 3.4, 0.86, smat(signTex('briefing', 800, 200, '#fffdf2', '#c1272d', [['CLOSED-DOOR', 96, 0.3], ['BRIEFING', 96, 0.74]], {border: '#241726'})), 0, -0.5, 0);
  for (const s of [-1, 1]) { tree(root, s * 5.2, 4.2, 1.2); tree(root, s * 7.6, 6.5, 1.5); streetLamp(root, s * 3.2, 6.2, 2.8, '#fff6d0', 1.2); }
  // all three on the top landing, under the banner: their feet stay above the caption line
  const REP_Y = 1.44, reps = [actor(root, BOARD(2), {a: {expr: 'stern', pose: 'think'}}, -1.12, REP_Y, -0.02, {scale: 0.95}), actor(root, BOARD(0), {a: {expr: 'stern', pose: 'cross'}}, 1.12, REP_Y, -0.02, {scale: 0.95}), actor(root, BOARD(1), {a: {expr: 'neutral', pose: 'both', prop: 'tablet'}}, 0, REP_Y, 0.0, {scale: 0.95})];
  return {
    light: () => LIGHT.day,
    tick: ({f, cam}) => { banner.rotation.z = 0.03 * Math.sin(f * 0.12); flag.rotation.z = -0.06 + 0.05 * Math.sin(f * 0.2); reps.forEach((r, i) => { r.node.position.y = REP_Y + 0.02 * Math.abs(Math.sin(f * 0.2 + i)); r.tick(f, cam); }); },
  };
};

// ------------------------------------------------------------------ press room, American and Chinese dressing
export const pressroom: Builder = (root) => {
  backdrop(root, ['#07080e', '#14161f']);
  floor(root, 12, 10, tmat(tiled(grainTex('presscarpet', '#343a52', 0.12), 6, 5)));
  box(root, 7, 0.2, 3.2, '#2a2f44', 0, 0.1, -0.5);
  const us = grp(root), cn = grp(root);
  panel(us, 9, 5, tmat(tiled(foldTex('us', '#27439a', '#152a6e', 9), 3, 1)), 0, 2.5, -1.9);
  panel(cn, 9, 5, tmat(tiled(foldTex('cn', '#b5262a', '#74121a', 9), 3, 1)), 0, 2.5, -1.9);
  const oval = tex('wh-sign', 420, 250, (g) => {
    g.fillStyle = '#152a6e'; g.beginPath(); g.ellipse(210, 125, 204, 119, 0, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#f6f3ea'; g.stroke();
    g.fillStyle = '#f6f3ea'; g.fillRect(126, 96, 168, 44); g.beginPath(); g.moveTo(170, 96); g.lineTo(210, 68); g.lineTo(250, 96); g.fill(); for (let i = 0; i < 4; i++) g.fillRect(180 + i * 18, 100, 6, 36);
    g.fillStyle = '#152a6e'; for (let i = 0; i < 3; i++) { g.fillRect(134 + i * 14, 108, 7, 12); g.fillRect(258 + i * 14 - 20, 108, 7, 12); }
    text(g, 'THE WHITE HOUSE', 210, 172, 30, '#f6f3ea', {font: 'Montserrat', weight: 700}); text(g, 'WASHINGTON', 210, 204, 20, '#f6f3ea', {font: 'Montserrat', weight: 700, spacing: 3});
  });
  panel(us, 2.0, 1.19, smat(oval, 1, true), 0, 3.25, -1.84);
  panel(cn, 2.5, 0.78, smat(signTex('mfa', 640, 200, '#74121a', '#ffd43b', [['MINISTRY OF', 62, 0.3], ['FOREIGN AFFAIRS', 78, 0.72]], {border: '#ffd43b'}), 1), 0, 3.3, -1.84);
  for (const s of [-1, 1]) { flagPole(us, s * 1.12, -1.3, flagUS(), 2.9, s * 0.12); flagPole(cn, s * 1.12, -1.3, flagCN(), 2.9, s * 0.12); }
  const podium = (g: THREE.Group, body: string, trim: string, seal: THREE.Texture) => {
    box(g, 1.0, 1.1, 0.55, body, 0, 0.75, 0.3); box(g, 1.14, 0.08, 0.66, trim, 0, 1.33, 0.3); box(g, 1.08, 0.08, 0.6, trim, 0, 0.24, 0.3);
    const top = box(g, 1.0, 0.05, 0.5, trim, 0, 1.4, 0.28); top.rotation.x = 0.18;
    cyl(g, 0.3, 0.04, '#c9a94f', 0, 0.82, 0.59, 0.3, 28).rotation.x = Math.PI / 2; soft(panel(g, 0.54, 0.54, smat(seal, 1, true), 0, 0.82, 0.615));
    for (const s of [-0.16, 0.16]) { rod(g, [s, 1.38, 0.2], [s * 0.6, 1.66, 0.34], 0.012, '#2b2f38'); ball(g, 0.04, '#17181d', s * 0.6, 1.68, 0.35).scale.y = 1.4; }
  };
  const sealUS = tex('seal-us', 128, 128, (g) => { g.fillStyle = '#1c3274'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#e7c56a'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); g.fillStyle = '#f6f3ea'; for (let i = 0; i < 13; i++) { const a = i * Math.PI * 2 / 13; g.beginPath(); g.arc(64 + 41 * Math.cos(a), 64 + 41 * Math.sin(a), 3.2, 0, 7); g.fill(); } g.fillStyle = '#e7c56a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 27; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } g.fill(); });
  const sealCN = tex('seal-cn', 128, 128, (g) => { g.fillStyle = '#b5262a'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#ffd43b'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); g.fillStyle = '#ffd43b'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 13 : 32; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } g.fill(); });
  podium(us, '#3a2c22', '#5a4636', sealUS); podium(cn, '#74121a', '#3a2c22', sealCN);
  for (const x of [-2.8, 2.8]) { rod(root, [x, 5, 1.2], [x, 4.3, 1.2], 0.02, '#2b2f38'); cyl(root, 0.2, 0.3, '#1b1d23', x, 4.2, 1.2, 0.14); soft(ball(root, 0.12, lit('#fff6e0', 3), x, 4.02, 1.2)); beam(root, 0.14, 1.6, 4.4, '#fff0d0', 0.022, x, 4.0, 1.2).rotation.z = x > 0 ? -0.5 : 0.5; }
  const press = crowd(root, -3.2, 3.2, [2.5, 3.2], -1.1, 9);
  const prez = actor(us, PRESIDENT, {a: {expr: 'whistle', pose: 'point'}, b: {expr: 'stern', pose: 'shrug'}, c: {expr: 'whistle', pose: 'shrug'}}, 0, 0.2, -0.3, {scale: 1.25, res: 1.2, shadow: 0});
  const spox = actor(cn, SPOKESMAN, {a: {expr: 'stern', pose: 'desk'}, b: {expr: 'whistle', pose: 'desk'}, c: {expr: 'stern', pose: 'point'}}, 0, 0.2, -0.3, {scale: 1.25, res: 1.2, shadow: 0});
  return {
    light: () => ({...LIGHT.room, amb: 1.35, keyI: 1.25, from: [2, 9, 9]}),
    tick: ({f, cam, shot}) => {
      const china = shot.v === 'cn'; us.visible = !china; cn.visible = china;
      const beat = Math.floor(f / 4) % 2, phrase = Math.floor(f / 22) % 2;
      if (china) { spox.show(f >= W(169) && f < W(172) ? 'c' : beat ? 'a' : 'b'); spox.node.position.y = 0.2 + hop(f, W(169), 0.08, 8); spox.tick(f, cam); }
      else { prez.show(phrase ? (beat ? 'b' : 'c') : (beat ? 'a' : 'b')); prez.node.position.y = 0.2 + 0.015 * Math.sin(f * 0.4); prez.tick(f, cam); }
      press.flash(f, f < shot.at + 26 ? 0.9 : 0.25);
    },
  };
};

// ------------------------------------------------------------------ restaurant: the most expensive date in history
export const restaurant: Builder = (root) => {
  backdrop(root, ['#100a0c', '#2a1418']);
  floor(root, 12, 10, tmat(tiled(woodTex('resto', '#5d3c2a', '#2f1d14'), 5, 4)));
  box(root, 10, 4.6, 0.2, '#6e2030', 0, 2.3, -1.9); box(root, 10, 1.1, 0.26, '#3a2418', 0, 0.55, -1.84); box(root, 10, 0.08, 0.3, '#c9a94f', 0, 1.12, -1.84);
  const bokeh = tex('bokeh', 256, 320, (g) => { vgrad(g, 256, 320, ['#0b0f2a', '#1c1d44']); const r = rng(12); for (let i = 0; i < 40; i++) { g.fillStyle = ['rgba(255,200,120,.5)', 'rgba(255,120,120,.45)', 'rgba(140,200,255,.45)'][i % 3]; g.beginPath(); g.arc(r() * 256, 120 + r() * 200, 6 + r() * 14, 0, 7); g.fill(); } });
  panel(root, 1.7, 2.1, smat(bokeh, 1.1), 2.3, 2.5, -1.78); for (const [w, h, x, y] of [[1.9, 0.1, 2.3, 3.6], [1.9, 0.1, 2.3, 1.42], [0.1, 2.3, 1.4, 2.5], [0.1, 2.3, 3.2, 2.5]]) box(root, w, h, 0.12, '#3a2418', x, y, -1.75);
  for (const [x, y, c] of [[-2.2, 2.7, '#3f6a8a'], [-1.1, 2.9, '#c9812a']] as const) { box(root, 0.86, 1.06, 0.06, '#c9a94f', x, y, -1.78); box(root, 0.7, 0.9, 0.07, c, x, y, -1.77); }
  for (const x of [-3.2, 0.5]) { cone(root, 0.16, 0.26, '#c9a94f', x, 2.9, -1.68); soft(ball(root, 0.09, lit('#ffd9a0', 3), x, 3.02, -1.66)); }
  // table for two
  cyl(root, 0.84, 0.74, '#f8f3e8', 0, 0.37, 0, 0.76, 36); cyl(root, 0.8, 0.04, '#fffaf0', 0, 0.76, 0, 0.8, 36);
  cyl(root, 0.07, 0.03, '#c9a94f', 0, 0.795, -0.12); cyl(root, 0.03, 0.24, '#fff6e0', 0, 0.92, -0.12);
  const flame = card(root, 0.16, 0.24, tex('flame', 64, 96, (g) => { g.fillStyle = '#ffb030'; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(58, 44, 52, 90, 32, 92); g.bezierCurveTo(12, 90, 6, 44, 32, 4); g.fill(); g.fillStyle = '#fff2a8'; g.beginPath(); g.ellipse(32, 66, 9, 18, 0, 0, 7); g.fill(); }), 0, 1.15, -0.12, 2.6);
  const halo = pool(root, 1.0, '#ffb860', 0.5, 0, -0.1, 0.79);
  const glassAt = (x: number, z: number) => { lathe(root, [[0.06, 0], [0.012, 0.02], [0.012, 0.13], [0.07, 0.2], [0.06, 0.3]], '#dfeaf2', x, 0.78, z, 16); cyl(root, 0.052, 0.06, '#8a1c2c', x, 1.0, z, 0.06, 14); };
  glassAt(-0.36, 0.1); glassAt(0.4, 0.06);
  for (const s of [-1, 1]) { cyl(root, 0.2, 0.016, '#ffffff', s * 0.42, 0.79, 0.34, 0.2, 24); box(root, 0.02, 0.006, 0.2, '#c9ced6', s * 0.42 + 0.26, 0.79, 0.34); box(root, 0.02, 0.006, 0.2, '#c9ced6', s * 0.42 - 0.26, 0.79, 0.34); }
  cyl(root, 0.04, 0.18, '#8fd3ff', 0.2, 0.87, -0.34, 0.03); rod(root, [0.2, 0.9, -0.34], [0.22, 1.2, -0.34], 0.008, '#3f8a52'); ball(root, 0.055, '#d2314a', 0.22, 1.22, -0.34);
  const hat = grp(root, -0.12, 0.8, 0.34); cyl(hat, 0.36, 0.03, lit('#fbf9f3', 1.05), 0, 0, 0, 0.36, 28); cyl(hat, 0.2, 0.2, lit('#fbf9f3', 1.05), 0, 0.1, 0, 0.18, 24); cyl(hat, 0.205, 0.05, '#1d1d24', 0, 0.04, 0, 0.2, 24);
  rod(root, [0, 4.6, 0], [0, 3.1, 0], 0.012, '#2b2f38'); cone(root, 0.4, 0.34, '#c9812a', 0, 3.0, 0); soft(ball(root, 0.1, lit('#ffd9a0', 3), 0, 2.86, 0));
  // the bill: unrolls off the table and across the floor
  const receipt = tex('receipt', 256, 512, (g) => {
    g.fillStyle = '#fffdf4'; g.fillRect(0, 0, 256, 512);
    const rows: [string, string][] = [['DINNER', '$240'], ['DRINKS', '$80'], ['DESSERT', '$24'], ['SCANDAL', '$190B'], ['LAWYERS', '$$$$'], ['TIP', 'NOT INCL.']];
    text(g, 'THE BILL', 128, 38, 44, '#241726'); g.fillStyle = '#241726'; g.fillRect(20, 68, 216, 4);
    rows.forEach(([a, b], i) => { text(g, a, 24, 108 + i * 54, 28, '#241726', {font: 'Montserrat', weight: 700, align: 'left'}); text(g, b, 232, 108 + i * 54, 28, a === 'SCANDAL' ? '#c1272d' : '#241726', {font: 'Montserrat', weight: 700, align: 'right'}); });
    g.fillRect(20, 430, 216, 4); text(g, 'TOTAL  $190,000,000,344', 128, 468, 22, '#c1272d', {font: 'Montserrat', maxWidth: 216});
  }, true);
  const strip = (len: number, x: number, y: number, z: number, rx: number, rep: number) => {
    const g = new THREE.PlaneGeometry(0.42, len); g.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({map: tiled(receipt, 1, rep), side: THREE.DoubleSide})); m.position.set(x, y, z); m.rotation.x = rx; root.add(m); return m;
  };
  const s1 = strip(1.16, 0.5, 0.795, -0.5, -Math.PI / 2, 1.16), s2 = strip(0.78, 0.5, 0.79, 0.67, 0, 0.8), s3 = strip(3.4, 0.5, 0.012, 0.69, -Math.PI / 2, 3.4);
  const roll = cyl(root, 0.07, 0.44, '#fffdf4', 0.5, 0.07, 0.69, 0.07, 16); roll.rotation.z = Math.PI / 2;
  const waiter = actor(root, WAITER, {a: {expr: 'smile_closed', pose: 'both', prop: 'bill'}}, 0.52, 0, -0.95, {scale: 1.15, res: 1.2});
  const jensen = actor(root, JENSEN, {calm: {expr: 'smile', mode: 'sit', pose: 'desk'}, gasp: {expr: 'shock', mode: 'sit', pose: 'panic'}}, -0.5, 0.42, -0.7, {scale: 1.15, res: 1.2, shadow: 0});
  return {
    light: () => ({...LIGHT.warm, amb: 1.2, keyI: 0.9}),
    tick: ({f, cam, shot}) => {
      const k1 = smooth(f, shot.at + 2, shot.at + 9), k2 = smooth(f, shot.at + 8, shot.at + 14), k3 = smooth(f, shot.at + 13, shot.at + 40);
      s1.scale.y = Math.max(0.001, k1); s2.scale.y = Math.max(0.001, k2); s3.scale.y = Math.max(0.001, k3); s2.visible = k1 > 0.99; s3.visible = k2 > 0.99;
      roll.visible = k2 > 0.99; roll.position.z = 0.69 + 3.4 * k3; roll.rotation.x = f * 0.5;
      flame.scale.set(1 + 0.12 * Math.sin(f * 0.9), 1 + 0.16 * Math.sin(f * 1.3 + 1), 1); (halo.material as THREE.MeshBasicMaterial).opacity = 0.42 + 0.1 * Math.sin(f * 1.1);
      jensen.show(f >= shot.at + 12 ? 'gasp' : 'calm'); jensen.node.position.y = 0.42 + hop(f, shot.at + 12, 0.16, 9); jensen.tick(f, cam);
      waiter.tick(f, cam);
    },
  };
};
export {torus, rrect, lamp, mug};
