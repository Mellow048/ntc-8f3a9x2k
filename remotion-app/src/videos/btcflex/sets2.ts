// Sets of the bitcoin flex short, part 2: the calendar, his room, the globe, the big screen (a game lobby, a shared
// screen), the callers, the jet and the tower of cars.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mat, mesh, panel, pool, pop, rrect, smat, smooth, soft, tex, text, tiled, tileTex, tmat, torus, vgrad, woodTex, type G2, type V} from './kit';
import {actor, CREW, LAM} from './cast';
import {halo, laptop, person, signTex, table} from './props';
import {W} from './story';
import {btcSign, INK, LIGHT, rings, supercar, type Builder} from './sets';

const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };

// ------------------------------------------------------------------ cal: 18 August to 18 September 2024
const CW = 0.91, CH = 1.4, CY0 = 2.1, MONTHS: [string, number, number][] = [['AUGUST 2024', 4, 31], ['SEPTEMBER 2024', 0, 30]];
const cell = (m: number, d: number): [number, number] => { const i = d - 1 + MONTHS[m][1]; return [60 + (i % 7) * 80, m * 470 + 162 + Math.floor(i / 7) * 58]; };
const cx = (px: number) => (px / 600 - 0.5) * CW, cy = (py: number) => CY0 + (0.5 - py / 920) * CH;
const calTex = () => tex('cal-sheet', 600, 920, (g, w) => {
  MONTHS.forEach(([name, , days], m) => {
    const y0 = m * 470; g.fillStyle = '#fffdf4'; g.fillRect(0, y0, w, 450); g.fillStyle = '#e3342f'; g.fillRect(0, y0, w, 78); text(g, name, w / 2, y0 + 42, 54, '#ffffff');
    'SMTWTFS'.split('').forEach((c, i) => text(g, c, 60 + i * 80, y0 + 108, 22, '#8f8a96', {font: 'Montserrat'}));
    for (let d = 1; d <= days; d++) { const [x, y] = cell(m, d); text(g, String(d), x, y, 30, '#1a1c24', {font: 'Montserrat'}); }
    g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, y0 + 5, w - 10, 440);
  });
});
const crossTex = () => tex('cal-cross', 64, 64, (g) => { g.strokeStyle = '#e3342f'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(12, 12); g.lineTo(52, 52); g.moveTo(52, 12); g.lineTo(12, 52); g.stroke(); });
export const cal: Builder = (root) => {
  backdrop(root, ['#0c1c4a', '#16307a']);
  panel(root, 12, 7, tmat(tiled(grainTex('cal-wall', '#1c3a8a', 0.1), 5, 3)), 0, 3.5, 0);
  box(root, 12, 0.1, 0.12, '#f1ead8', 0, 1.02, 0.06); box(root, 12, 1.0, 0.08, '#6a4426', 0, 0.5, 0.04); floor(root, 12, 8, tmat(tiled(woodTex('cal-floor', '#6a4426', '#3e2614'), 4, 3)), 0, 0, 4);
  box(root, CW + 0.1, CH + 0.1, 0.03, '#15121c', 0, CY0, 0.015); soft(panel(root, CW, CH, smat(calTex(), 1.0), 0, CY0, 0.035));
  const days: [number, number][] = []; for (let d = 19; d <= 31; d++) days.push([0, d]); for (let d = 1; d <= 17; d++) days.push([1, d]);
  const crosses = days.map(([m, d]) => { const [x, y] = cell(m, d); return soft(panel(root, 0.088, 0.088, smat(crossTex(), 1.1, true), cx(x), cy(y), 0.05)); });
  const ringAt = (m: number, d: number) => { const [x, y] = cell(m, d); const o = soft(mesh(root, new THREE.RingGeometry(0.05, 0.066, 28), lit('#e3342f', 1.15), cx(x), cy(y), 0.055)); return o; };
  const r1 = ringAt(0, 18), r2 = ringAt(1, 18);
  const flag = (s: string, key: string) => soft(panel(root, s.length * 0.052 + 0.07, 0.105, smat(signTex('cal-' + key, s.length * 52 + 70, 105, '#ffe14a', INK, [[s, 74, 0.56]], {border: INK}), 1.1), 0, 0, 0.065));
  const theft = flag('THEFT', 'theft'), arrest = flag('ARREST', 'arrest');
  const [tx, ty] = cell(0, 18), [ax, ay] = cell(1, 18);
  theft.position.set(cx(0) - 0.11, cy(ty), 0.065); arrest.position.set(cx(ax) + 0.23, cy(ay), 0.065);
  return {
    light: () => LIGHT.room,
    tick: ({f, shot}) => {
      const hook = shot.v === 'hook', a = shot.at;
      r1.scale.setScalar(hook ? pop(f, a + 1, 6) : 1); theft.scale.setScalar(pop(f, a + (hook ? 3 : 2), 7));
      crosses.forEach((c, i) => { c.scale.setScalar(hook ? pop(f, a + 6 + Math.floor(i / 3) * 2, 4) : 1); });
      const end = hook ? W(25) + 4 : a; r2.scale.setScalar(hook ? pop(f, end, 6) : 1); arrest.scale.setScalar(pop(f, hook ? end + 3 : W(152), 7));
      void tx;
    },
  };
};

// ------------------------------------------------------------------ the block game: his room's screen, the lobby, the closing shot
/** a landscape of blocks: sky, square clouds, grass, earth */
export function blocks(g: G2, w: number, h: number, ground: number, s: number) {
  vgrad(g, w, ground, ['#59b8ff', '#a8e0ff']);
  g.fillStyle = '#ffffff'; for (const [x, y, n] of [[0.1, 0.34, 3], [0.62, 0.2, 4], [0.38, 0.62, 2]]) { g.fillRect(x * w, y * ground, n * s, s); g.fillRect(x * w + s, y * ground - s, (n - 1.4) * s, s); }
  for (let y = ground, r = 0; y < h; y += s, r++) for (let x = 0, c = 0; x < w; x += s, c++) {
    g.fillStyle = r === 0 ? ((c * 7 + 3) % 5 < 2 ? '#3fbf5a' : '#58d06a') : ((c * 5 + r * 3) % 7 < 2 ? '#9a6a3c' : '#b07a48'); g.fillRect(x, y, s, s); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.strokeRect(x, y, s, s);
  }
}
const chartTex = () => tex('room-chart', 400, 250, (g, w, h) => {
  g.fillStyle = '#0d1020'; g.fillRect(0, 0, w, h); btcSign(g, 46, 46, 24);
  g.strokeStyle = '#ffd21f'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); [[30, 205], [100, 170], [150, 186], [215, 120], [265, 138], [370, 44]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
});
const listTex = () => tex('room-list', 400, 250, (g, w, h) => { g.fillStyle = '#0d1020'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#8a4fd0' : '#3a4270'; rrect(g, 30, 26 + i * 42, 180 + ((i * 67) % 150), 22, 11); g.fill(); } });
export const room: Builder = (root) => {
  backdrop(root, ['#0e0620', '#1c0a3a']);
  floor(root, 14, 12, '#1a0c36'); panel(root, 12, 7, tmat(tiled(grainTex('room-wall', '#2a1260', 0.08), 5, 3)), 0, 3.5, -1.8);
  box(root, 12, 0.05, 0.05, lit('#ff4fd8', 1.6), 0, 3.42, -1.76).castShadow = false;
  const game = tex('room-game', 400, 250, (g, w, h) => blocks(g, w, h, 150, 25));
  [[-1.2, game], [0, chartTex()], [1.2, listTex()]].forEach(([x, t]) => { box(root, 1.06, 0.68, 0.05, '#0a0a12', x as number, 2.6, -1.76); soft(panel(root, 1.0, 0.62, smat(t as THREE.Texture, 1.15), x as number, 2.6, -1.73)); });
  // his desk: we look at him over the back of his monitor
  table(root, 0, 0.2, 2.4, 0.8, {h: 0.76, top: '#15121c', leg: '#0a0a12', skirt: '#0e0c16'}); box(root, 2.4, 0.03, 0.03, lit('#4fd8ff', 1.5), 0, 0.74, 0.61).castShadow = false;
  box(root, 0.7, 0.4, 0.05, '#0a0a12', 0, 1.0, 0.3); box(root, 0.08, 0.1, 0.05, '#0a0a12', 0, 0.8, 0.29); soft(panel(root, 0.28, 0.15, lit('#ff4fd8', 1.5), 0, 1.0, 0.33));
  for (const [x, c] of [[-0.95, '#3fbf5a'], [-0.8, '#e8762c'], [0.95, '#3fbf5a']] as const) cyl(root, 0.035, 0.13, c, x, 0.83, 0.38);
  box(root, 0.72, 1.3, 0.12, '#c81e3c', 0, 1.3, -0.72); box(root, 0.8, 1.36, 0.08, '#0a0a12', 0, 1.3, -0.8);
  const glow = halo(root, 1.3, '#ff4fd8', 0.2, 0, 1.4, -0.3);
  const me = actor(root, LAM(0), {type: {expr: 'grin', pose: 'type', mode: 'sit'}, smile: {expr: 'smile', pose: 'type', mode: 'sit'}}, 0, 0.72, -0.42, {scale: 1.0, res: 1.3, shadow: 0});
  return {
    light: () => ({...LIGHT.dark, sky: '#c8a0ff', ground: '#3a2a7a', amb: 1.2, key: '#d8b8ff', keyI: 0.7}),
    tick: ({f, cam, shot}) => { me.show(shot.v === 'close' ? 'smile' : 'type'); me.tick(f, cam); op(glow, 0.2 + 0.05 * Math.sin(f * 0.3)); },
  };
};

// ------------------------------------------------------------------ globe: from Singapore to the United States
const LAND: [number, number][][] = [
  [[60, 75], [100, 78], [140, 72], [170, 66], [160, 58], [142, 50], [135, 40], [122, 38], [121, 28], [110, 20], [108, 12], [103, 9], [99, 14], [98, 8], [103.5, 1.4], [100, 6], [94, 16], [90, 22], [80, 12], [77, 8], [72, 20], [66, 25], [58, 26], [50, 30], [40, 38], [30, 42], [28, 60], [40, 68]],
  [[114, -22], [122, -17], [131, -12], [137, -16], [142, -11], [146, -19], [153, -27], [150, -37], [140, -38], [131, -32], [116, -35]],
  [[95, 5.5], [98, 3.5], [103, -1], [106, -5.5], [104, -5.8], [100, -1.5], [96, 3]], [[109, 1.5], [112, 3], [117, 6.5], [119, 4.5], [117.5, 0.5], [116, -3.5], [111, -3], [109.5, -0.5]],
  [[105.5, -6.2], [109, -6.7], [114.5, -7.7], [114, -8.6], [108, -7.8], [105.5, -6.9]], [[120, 18], [122.5, 17], [124, 12], [126, 7], [123, 8], [121, 13]], [[131, -1], [138, -2], [146, -6], [150, -10], [141, -9], [134, -4]],
  [[130, 32], [135, 34], [140, 36], [141.5, 41], [144, 44], [141, 45], [139, 38], [133, 35.5], [130, 33.5]],
  [[32, 30], [44, 11], [51, 12], [40, -5], [40, -16], [32, -28], [20, -34], [12, -17], [9, 4], [-8, 5], [-17, 15], [-10, 30], [10, 37]],
  [[-168, 66], [-140, 70], [-100, 72], [-80, 70], [-62, 58], [-55, 50], [-70, 44], [-76, 35], [-81, 26], [-90, 29], [-97, 26], [-97, 18], [-88, 16], [-83, 9], [-78, 8], [-105, 21], [-113, 31], [-124, 40], [-125, 49], [-135, 58], [-155, 59]],
  [[-78, 8], [-62, 10], [-50, 0], [-35, -7], [-40, -22], [-58, -38], [-68, -54], [-74, -46], [-71, -18], [-81, -5]],
];
const globeTex = () => tex('globe-map', 1024, 512, (g, w, h) => {
  g.fillStyle = '#1f6fd0'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12, h); g.stroke(); } for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * h / 6); g.lineTo(w, i * h / 6); g.stroke(); }
  g.fillStyle = '#e8cf9a'; g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
  for (const poly of LAND) { g.beginPath(); poly.forEach(([lon, lat], i) => { const x = (lon + 180) / 360 * w, y = (90 - lat) / 180 * h; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke(); }
});
const planeTex = () => tex('plane-icon', 200, 200, (g) => { g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(178, 100); g.lineTo(120, 86); g.lineTo(74, 22); g.lineTo(56, 26); g.lineTo(80, 88); g.lineTo(40, 90); g.lineTo(24, 68); g.lineTo(12, 70); g.lineTo(22, 100); g.lineTo(12, 130); g.lineTo(24, 132); g.lineTo(40, 110); g.lineTo(80, 112); g.lineTo(56, 174); g.lineTo(74, 178); g.lineTo(120, 114); g.closePath(); g.fill(); g.stroke(); });
export const globe: Builder = (root) => {
  const R = 1.05, GX = 0.1, GY = 1.75;
  backdrop(root, ['#e8dcc4', '#d8c8a8']);
  floor(root, 14, 12, tmat(tiled(woodTex('globe-floor', '#8a5a34', '#5a3a1e'), 4, 4))); panel(root, 12, 6, tmat(tiled(grainTex('globe-wall', '#e6d8bc', 0.06), 5, 3)), 0, 3, -2);
  box(root, 4.9, 1.9, 0.08, '#8a5a34', 0, 2.3, -1.96); panel(root, 4.6, 1.6, tmat(tiled(grainTex('globe-board', '#2f6a4a', 0.08), 3, 1)), 0, 2.3, -1.9);
  for (let i = 0; i < 4; i++) soft(panel(root, 1.2 - i * 0.2, 0.025, lit('#dfe8df', 1), -1.4 + i * 0.1, 2.8 - i * 0.16, -1.89));
  table(root, -1.5, 0.6, 0.9, 0.6, {h: 0.6, top: '#b07a48', leg: '#3a3f4a'}); for (const [c, i] of [['#2f7fe0', 0], ['#f2c230', 1], ['#d81f3a', 2]] as const) box(root, 0.42 - i * 0.03, 0.06, 0.3, c, -1.58, 0.63 + i * 0.062, 0.6); ball(root, 0.075, '#d81f3a', -1.2, 0.675, 0.68);
  cyl(root, 0.5, 0.07, '#5a3a1e', GX, 0.035, 0, 0.44, 32); cyl(root, 0.04, GY - R + 0.02, '#c9a84a', GX, (GY - R) / 2, 0); cyl(root, 0.03, 0.14, '#c9a84a', GX, GY + R + 0.05, 0);
  const ball3 = mesh(root, new THREE.SphereGeometry(R, 48, 32), tmat(globeTex()), GX, GY, 0);
  const spot = (lon: number, lat: number, k = 1): V => { const ph = (lon + 180) / 360 * 2 * Math.PI, c = Math.cos(lat * Math.PI / 180); return [-R * k * c * Math.cos(ph), R * k * Math.sin(lat * Math.PI / 180), R * k * c * Math.sin(ph)]; };
  const SG: [number, number] = [103.8, 1.35], RHO = Math.PI / 2 - (SG[0] + 180) / 360 * 2 * Math.PI;
  const pin = ball(ball3, 0.045, lit('#e3342f', 1.2), ...spot(SG[0], SG[1], 1.02)); pin.castShadow = false;
  const dots = Array.from({length: 8}, (_, i) => { const o = ball(ball3, 0.022, lit('#ffffff', 1.1), ...spot(SG[0] + (i + 1) * 8.5, SG[1] + (i + 1) * 4.2, 1.015)); o.castShadow = false; return o; });
  const pulse = rings(root, 2, '#e3342f');
  const tagSG = soft(panel(root, 0.92, 0.3, smat(signTex('globe-sg', 460, 150, '#e3342f', '#ffffff', [['SINGAPORE', 112, 0.56]], {border: INK}), 1.1), 0, 0, 0));
  const tagUS = soft(panel(root, 1.06, 0.3, smat(signTex('globe-us', 530, 150, '#ffe14a', INK, [['THE U.S., OCT. 2023', 100, 0.56]], {border: INK}), 1.1), 0.4, GY + 0.98, 0.7));
  const plane = card(root, 0.36, 0.36, planeTex(), 0, 0, 0, 1.1), wp = new THREE.Vector3();
  return {
    light: () => ({...LIGHT.room, amb: 1.7}),
    tick: ({f, shot}) => {
      const a = shot.at, go = W(38), turn = 0.8 * smooth(f, go - 2, go + 20);
      ball3.rotation.set(0.12, RHO - turn, 0); pin.getWorldPosition(wp);
      pulse(f, f < go + 6, [wp.x, wp.y, wp.z + 0.06], 0.3, 0, 0.06);
      tagSG.scale.setScalar(pop(f, a + 4, 7)); tagSG.position.set(Math.max(-0.26, wp.x + 0.1), wp.y - 0.34, Math.max(1.12, wp.z + 0.3));
      dots.forEach((d, i) => { d.visible = f >= go + 2 + i * 2; });
      const u = smooth(f, go, go + 18); plane.visible = f >= go - 2; plane.position.set(lerp(wp.x + 0.1, 1.0, u), lerp(wp.y + 0.12, GY + 0.98, u) + 0.25 * Math.sin(Math.PI * u), 1.2); plane.rotation.z = lerp(0.5, 0.3, u); plane.scale.setScalar(pop(f, go - 2, 5) * lerp(1, 0.75, u));
      tagUS.scale.setScalar(pop(f, go + 10, 7));
    },
  };
};

// ------------------------------------------------------------------ screen: a game lobby, then the screen that was shared
const SW = 2.3, SH = 3.3, SCY = 2.4, SCZ = -0.33, TW = 800, TH = 1148;
const sx = (px: number) => (px / TW - 0.5) * SW, sy = (py: number) => SCY + (0.5 - py / TH) * SH, su = (px: number) => px / TW * SW;
const lobbyTex = () => tex('screen-lobby', TW, TH, (g, w, h) => {
  blocks(g, w, h, 820, 41);
  g.fillStyle = '#16223c'; rrect(g, 120, 150, w - 240, 84, 24); g.fill(); text(g, 'LOBBY', 216, 196, 68, '#ffffff'); text(g, '5 PLAYERS', 524, 197, 44, '#b6f03a', {font: 'Montserrat'});
});
const shareTex = () => tex('screen-share', TW, TH, (g, w, h) => {
  vgrad(g, w, h, ['#0d2a52', '#0a1f40']);
  g.fillStyle = '#e3342f'; rrect(g, 60, 34, w - 120, 84, 22); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(124, 76, 20, 0, 7); g.fill(); text(g, 'SHARING THIS SCREEN', 440, 78, 54, '#ffffff', {maxWidth: 520});
  g.strokeStyle = '#2f6fc0'; g.lineWidth = 6; rrect(g, 56, 148, w - 112, 470, 26); g.stroke(); text(g, 'ONE MAN’S WALLET', w / 2, 192, 42, '#8fc0ff', {font: 'Montserrat'});
  btcSign(g, 190, 350, 74); text(g, 'BITCOIN', 520, 448, 56, '#f7931a');
  g.fillStyle = '#16365f'; rrect(g, 110, 538, w - 220, 30, 15); g.fill();
  text(g, 'WATCHING', w / 2, 730, 46, '#9fb4d8', {font: 'Montserrat'});
});
const playerTex = (me: boolean, i: number) => tex('screen-player-' + i, 230, 300, (g, w, h) => {
  g.fillStyle = me ? '#1c4a7a' : '#2a5a8a'; rrect(g, 5, 5, w - 10, h - 10, 22); g.fill(); g.strokeStyle = me ? '#ffe14a' : '#7ad0f0'; g.lineWidth = 9; g.stroke();
  if (me) {
    g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(66, 78); g.lineTo(62, 34); g.lineTo(90, 56); g.lineTo(115, 26); g.lineTo(140, 56); g.lineTo(168, 34); g.lineTo(164, 78); g.closePath(); g.fill();
    g.fillStyle = '#1c2a4a'; g.fillRect(70, 84, 90, 22); g.fillStyle = '#f5c9a0'; g.fillRect(70, 100, 90, 78); g.fillStyle = '#1a1c24'; g.fillRect(88, 124, 14, 14); g.fillRect(128, 124, 14, 14); g.fillRect(98, 154, 34, 8);
    g.fillStyle = '#ff5fb0'; g.fillRect(56, 178, 118, 56); text(g, '$$$', w / 2, 266, 44, '#ffe14a');
  } else {
    g.fillStyle = '#e8ecf6'; g.fillRect(66, 40, 98, 104); text(g, '?', w / 2, 96, 96, '#4a4560'); g.fillStyle = ['#3f9e6a', '#c9a84a', '#2f9eb0', '#2f6fd0'][i % 4]; g.fillRect(56, 150, 118, 62); g.fillStyle = '#9fb4d8'; rrect(g, 60, 236, 110, 22, 11); g.fill();
  }
});
const viewerTex = () => tex('screen-viewer', 200, 200, (g, w, h) => { g.fillStyle = '#1c4a8a'; rrect(g, 4, 4, w - 8, h - 8, 26); g.fill(); person(g, w / 2, 108, 136, '#aeb8cc', '#aeb8cc'); });
const numTex = (n: number) => tex('screen-num-' + n, 440, 170, (g, w, h) => text(g, n.toLocaleString('en-US'), w / 2, h / 2 + 6, 150, '#ffffff', {maxWidth: w - 10}));
const recTex = () => tex('screen-rec', 300, 130, (g, w, h) => { g.fillStyle = '#e3342f'; rrect(g, 6, 6, w - 12, h - 12, 30); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(70, h / 2, 22, 0, 7); g.fill(); text(g, 'REC', 186, h / 2 + 4, 84, '#ffffff'); });
const DRAIN = Array.from({length: 26}, (_, i) => Math.round(4100 * (1 - i / 25) ** 1.25)), VIEW = [205, 335, 465, 595], PLAYERS: [number, number][] = [[400, 440], [130, 700], [310, 712], [490, 700], [670, 712]];
export const screen: Builder = (root) => {
  backdrop(root, ['#040a1c', '#0a1a3a', '#0e2a5a']);
  floor(root, 18, 14, '#0a1836'); const spot = pool(root, 2.6, '#2a9fd0', 0.3, 0, 1.2);
  box(root, SW + 0.2, SH + 0.2, 0.12, '#0a0c14', 0, SCY, SCZ - 0.08); box(root, 0.9, 0.5, 0.3, '#0a0c14', 0, 0.42, SCZ - 0.1); box(root, 1.6, 0.14, 0.6, '#0a0c14', 0, 0.07, SCZ - 0.1);
  const face = soft(panel(root, SW, SH, smat(lobbyTex(), 1.08), 0, SCY, SCZ)), faceM = face.material as THREE.MeshBasicMaterial, bg = {lobby: lobbyTex(), share: shareTex()};
  const players = PLAYERS.map(([px, py], i) => soft(panel(root, su(i ? 150 : 230), su(i ? 196 : 300), smat(playerTex(i === 0, i), 1.08, true), sx(px), sy(py), SCZ + (i === 0 ? 0.024 : 0.012))));
  const viewers = VIEW.map((px) => soft(panel(root, su(112), su(112), smat(viewerTex(), 1.05, true), sx(px), sy(850), SCZ + 0.012)));
  const nums = DRAIN.map((n) => soft(panel(root, su(440), su(170), smat(numTex(n), 1.1, true), sx(520), sy(340), SCZ + 0.012)));
  const bar = soft(mesh(root, new THREE.PlaneGeometry(su(TW - 220), su(30)), lit('#ffb52e', 1.1), 0, sy(553), SCZ + 0.012));
  const fly = Array.from({length: 6}, () => soft(panel(root, su(56), su(56), smat(tex('screen-coin', 96, 96, (g) => btcSign(g, 48, 48, 44)), 1.1, true), 0, 0, SCZ + 0.03)));
  const mark = soft(mesh(root, new THREE.RingGeometry(0.25, 0.295, 40), lit('#e3342f', 1.4), sx(VIEW[2]), sy(850), SCZ + 0.02));
  const rec = soft(panel(root, 0.36, 0.156, smat(recTex(), 1.2, true), sx(VIEW[2]) + 0.36, sy(850) - 0.33, SCZ + 0.03));
  return {
    light: () => ({...LIGHT.dark, amb: 0.9}),
    tick: ({f, t, shot}) => {
      const v = shot.v, lobby = v === 'lobby' || v === 'kids', a = shot.at;
      faceM.map = lobby ? bg.lobby : bg.share; op(spot, 0.3 + 0.04 * Math.sin(f * 0.2));
      players.forEach((p, i) => { p.visible = lobby; p.scale.setScalar(v === 'kids' ? 1 : pop(f, a + 4 + i * 4, 6)); p.position.y = sy(PLAYERS[i][1]) + (i ? 0.012 : 0.02) * Math.sin(f * 0.16 + i * 1.3); });
      const step = Math.max(0, Math.min(25, Math.floor((t - 12) / 2)));
      nums.forEach((n, i) => { n.visible = !lobby && v !== 'rec' && i === step; });
      bar.visible = !lobby; bar.scale.x = Math.max(0.001, DRAIN[v === 'rec' ? 25 : step] / 4100); bar.position.x = -su(TW - 220) / 2 * (1 - bar.scale.x);
      viewers.forEach((p, i) => { p.visible = !lobby; p.scale.setScalar(v === 'rec' ? 1 : pop(f, a + 5 + i * 4, 6)); });
      fly.forEach((c, i) => { const u = ((t - 12) * 0.03 + i / 6) % 1, on = v === 'share' && t > 12 && step < 25; c.visible = on; c.position.set(sx(712) + u * 0.5, sy(330) + 0.3 * Math.sin(Math.PI * u) + 0.12 * Math.sin(i * 2.1), SCZ + 0.03); c.scale.setScalar(0.8 * Math.sin(Math.PI * u)); });
      mark.visible = v === 'rec' && f >= W(147); mark.scale.setScalar(2.2 - 1.2 * smooth(f, W(147), W(147) + 7));
      rec.visible = v === 'rec' && f >= W(148); rec.scale.setScalar(pop(f, W(148), 6)); op(rec, 1); rec.position.y = sy(850) - 0.33 + 0.004 * Math.sin(f * 0.5);
    },
  };
};

// ------------------------------------------------------------------ mask: the callers, and who they said they were
export const mask: Builder = (root) => {
  backdrop(root, ['#07070d', '#14141f']);
  floor(root, 16, 14, '#1a1a26'); const spot = pool(root, 1.5, '#fff0c8', 0.34, 0, 0.1); beam(root, 0.15, 1.5, 6.5, '#fff0c8', 0.03, 0, 6.5, -0.5);
  for (const [x, z] of [[-1.6, -1.7], [1.7, -1.6]]) { table(root, x, z, 1.2, 0.6, {h: 0.74, top: '#2a2a36', leg: '#15151d'}); laptop(root, x, 0.74, z + 0.05, {ry: Math.PI, w: 0.5, body: '#3a3f4a', back: lit('#4fb8ff', 1.3)}); halo(root, 0.7, '#4fb8ff', 0.25, x, 1.1, z + 0.2); }
  const back = [actor(root, CREW(0), {a: {pose: 'type', mode: 'sit'}}, -1.6, 0.58, -2.1, {scale: 0.95, res: 1.0, shadow: 0}), actor(root, CREW(2), {a: {pose: 'type', mode: 'sit'}}, 1.7, 0.58, -2.0, {scale: 0.95, res: 1.0, shadow: 0})];
  back.forEach((b) => b.tint('#8a8fa8'));
  const me = actor(root, CREW(1, true), {dial: {pose: 'phone', prop: 'phone'}, google: {pose: 'side', prop: 'mask', text: 'SECURITY TEAM', badge: 'shield'}, exchange: {pose: 'side', prop: 'mask', text: 'EXCHANGE SUPPORT', badge: 'coin'}}, 0, 0, 0, {scale: 1.1, res: 1.3, wide: true});
  const call = rings(root, 3, '#7af0e0');
  return {
    light: () => ({...LIGHT.dark, amb: 0.95, keyI: 0.75}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, swap = W(59) - 2;                                                     // 13 and 14 are one take: the paper face changes on the word
      me.show(v === 'dial' ? 'dial' : f < swap ? 'google' : 'exchange'); me.node.position.y = v === 'dial' ? 0 : hop(f, swap, 0.1, 8) + hop(f, W(55) - 1, 0.08, 8); me.tick(f, cam);
      back.forEach((b) => b.tick(f, cam)); call(f, v === 'dial', [0.36, 1.72, 0.12], 0.5, 0, 0.06); op(spot, 0.34 + 0.03 * Math.sin(f * 0.2));
    },
  };
};

// ------------------------------------------------------------------ jet: "private jet rentals"
export const jet: Builder = (root) => {
  backdrop(root, ['#f0c070', '#f6d9a0', '#fbe9c8']);
  floor(root, 80, 60, tmat(tiled(grainTex('jet-apron', '#8a8f9a', 0.08), 20, 15))); box(root, 60, 0.012, 0.16, lit('#ffd21f', 1), 0, 0.008, 3.4).castShadow = false;
  box(root, 9, 3.6, 5, '#aab0bc', -8.5, 1.8, -9); box(root, 9.4, 0.3, 5.4, '#8a909c', -8.5, 3.7, -9); box(root, 3.4, 2.6, 0.1, '#5a6070', -8.5, 1.3, -6.48);
  const j = grp(root, -0.4, 0, -1.0); j.rotation.y = 0.95;                                      // nose to -x, turned toward us: a long aircraft does not fit a portrait frame from the side
  const white = '#f3f1ea', teal = '#1fb5a8', Y = 1.62, Rf = 0.62;
  const tube = cyl(j, Rf, 4.2, white, 0.3, Y, 0, Rf, 24); tube.rotation.z = Math.PI / 2;
  const nose = cyl(j, Rf, 1.5, white, -2.55, Y - 0.06, 0, 0.12, 24); nose.rotation.z = Math.PI / 2; ball(j, 0.125, white, -3.3, Y - 0.06, 0);
  const tail = cyl(j, 0.16, 1.9, white, 3.35, Y + 0.18, 0, Rf, 24); tail.rotation.z = Math.PI / 2 + 0.19;
  box(j, 4.1, 0.05, 0.012, teal, 0.3, Y - 0.22, 0.583).castShadow = false;                        // a line of colour along the side
  const fin = mesh(j, new THREE.ExtrudeGeometry(new THREE.Shape([[2.9, Y + 0.5], [3.9, Y + 2.0], [4.5, Y + 2.0], [4.1, Y + 0.45]].map(([x, y]) => new THREE.Vector2(x, y))), {depth: 0.1, bevelEnabled: false}), teal, 0, 0, -0.05);
  box(j, 1.0, 0.07, 2.2, teal, 4.25, Y + 2.02, 0); void fin;
  for (const s of [-1, 1]) { const e = cyl(j, 0.3, 1.25, white, 2.5, Y + 0.3, s * 0.92, 0.3, 18); e.rotation.z = Math.PI / 2; const lip = cyl(j, 0.24, 0.05, '#2b2f3a', 1.86, Y + 0.3, s * 0.92, 0.24, 18); lip.rotation.z = Math.PI / 2; box(j, 0.5, 0.08, 0.36, white, 2.5, Y + 0.24, s * 0.68); }
  for (const s of [-1, 1]) { const wing = box(j, 1.3, 0.09, 3.3, white, 0.75, Y - 0.42, s * 2.1); wing.rotation.y = s * 0.3; }
  for (let i = 0; i < 5; i++) soft(panel(j, 0.24, 0.32, lit('#1b2433', 1), -0.2 + i * 0.52, Y + 0.14, Rf + 0.012)); soft(panel(j, 0.7, 0.34, lit('#1b2433', 1), -2.25, Y + 0.2, 0.47, -0.55));
  soft(panel(j, 0.62, 1.2, lit('#3a2a1c', 1), -1.15, Y - 0.02, Rf + 0.014));                       // the open door
  // the stairs come down from the door toward us
  const st = grp(j, -1.15, 0, Rf); for (let i = 0; i < 6; i++) box(st, 0.62, 0.05, 0.24, '#d8d2c2', 0, 1.02 - i * 0.17, 0.14 + i * 0.25);
  for (const s of [-1, 1]) { const rail = box(st, 0.03, 0.03, 1.75, '#2b2f3a', s * 0.32, 1.25, 0.82); rail.rotation.x = 0.6; for (const i of [0, 5]) box(st, 0.03, 0.64, 0.03, '#2b2f3a', s * 0.32, 1.34 - i * 0.17, 0.14 + i * 0.25); }
  for (const [x, z] of [[-2.2, 0], [0.9, -1.1], [0.9, 1.1]]) { cyl(j, 0.03, 0.75, '#3a3f4a', x, 0.6, z); const w = cyl(j, 0.21, 0.13, '#16171d', x, 0.21, z, 0.21, 16); w.rotation.x = Math.PI / 2; }
  const me = actor(root, LAM(2), {wave: {expr: 'grin', pose: 'wave'}, laugh: {expr: 'laugh', pose: 'wave'}}, 0, 0, 0, {scale: 1.0, res: 1.0, wide: true, shadow: 0}), at = new THREE.Vector3();
  return {
    light: () => ({...LIGHT.dusk, sky: '#fff0d8', ground: '#b8a898', amb: 1.5, key: '#ffe0b0', keyI: 1.3}),
    tick: ({f, t, cam}) => {
      // he goes up the stairs (a point on them, taken from the jet's own frame to the set's)
      const k = smooth(t, 2, 24); at.set(-1.15, lerp(0, 1.05, k) + Math.abs(0.05 * Math.sin(f * 0.6)) * (k < 1 ? 1 : 0), Rf + lerp(1.75, 0.2, k)); j.updateWorldMatrix(true, false); j.localToWorld(at);
      me.node.position.copy(at); me.show(Math.floor(f / 9) % 2 ? 'laugh' : 'wave'); me.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ fleet: thirty-one cars, by his own account
const CAR_COLS = ['#d81f3a', '#ffd21f', '#2f7fe0', '#f5f5f0', '#a6e22e', '#8a2be2', '#e8762c', '#16171d', '#2fb5a8', '#c9ced6'];
const priceTex = () => tex('fleet-price', 600, 200, (g, w, h) => { g.fillStyle = '#fffdf4'; rrect(g, 8, 8, w - 16, h - 16, 26); g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke(); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(60, h / 2, 14, 0, 7); g.fill(); text(g, '$3,800,000', 330, h / 2 + 6, 112, '#e3342f', {maxWidth: 470}); });
export const fleet: Builder = (root) => {
  backdrop(root, ['#04060f', '#0a1024', '#101a3a']);
  floor(root, 24, 20, '#0a0f22');
  const RX = [-1.35, 0, 1.35], RY = (i: number) => 1.12 + i * 0.6, RZ = -2.0;
  for (let i = 0; i <= 10; i++) box(root, 4.3, 0.04, 1.1, '#2a3048', 0, RY(i) - 0.03, RZ); for (const x of [-2.1, -0.675, 0.675, 2.1]) for (const z of [-0.5, 0.5]) box(root, 0.05, 6.1, 0.05, '#3a4260', x, 4.1, RZ + z);
  for (let i = 0; i < 10; i++) soft(panel(root, 4.2, 0.02, lit('#c8d8ff', 1.2), 0, RY(i) + 0.5, RZ + 0.56));
  const small: THREE.Group[] = []; for (let i = 0; i < 10; i++) for (let c = 0; c < 3; c++) { const g = supercar(root, CAR_COLS[(i * 3 + c * 7 + i * i) % CAR_COLS.length], 0.5, true); g.position.set(RX[c], RY(i), RZ + 0.05); g.rotation.y = (c - 1) * 0.12 + ((i + c) % 2 ? Math.PI : 0) - 0.25; small.push(g); }
  cyl(root, 1.35, 0.1, '#1a2448', 0, 0.05, 1.6, 1.35, 44); const rim = torus(root, 1.35, 0.03, lamp('#4fd8ff', 1.5), 0, 0.105, 1.6); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
  const turn = grp(root, 0, 0.1, 1.6); supercar(turn, '#2f6fe8'); beam(root, 0.25, 1.9, 8, '#c8d8ff', 0.035, 0, 8, 1.2); const spot = pool(root, 1.6, '#c8d8ff', 0.3, 0, 1.6, 0.112);
  const tag = grp(root, 0.05, 0, 1.6); soft(panel(tag, 0.96, 0.32, smat(priceTex(), 1.1, true), 0, 1.6, 0.2)); for (const s of [-1, 1]) box(tag, 0.012, 3.0, 0.012, '#c9ced6', s * 0.34, 3.15, 0.2).castShadow = false;
  return {
    light: (v) => v === 'hero' ? {...LIGHT.show, amb: 1.3} : {...LIGHT.show, amb: 1.6},
    tick: ({f, shot}) => {
      const tower = shot.v === 'tower', a = shot.at;
      small.forEach((g, i) => { const row = Math.floor(i / 3), at = a + 3 + Math.round(row * (W(105) - a - 8) / 9); g.scale.setScalar(tower ? 0.5 * pop(f, at + (i % 3), 5) : 0.5); });
      turn.rotation.y = 0.9 + f * 0.012; (rim.material as THREE.MeshBasicMaterial).color.set('#4fd8ff').multiplyScalar(1.4 + 0.3 * Math.sin(f * 0.3)); op(spot, 0.3);
      const k = smooth(f, W(108) - 4, W(108) + 8); tag.visible = !tower; tag.position.y = lerp(2.6, 0, k) + 0.02 * Math.sin(f * 0.12) * k; tag.rotation.z = 0.05 * Math.sin(f * 0.21) * (1 - 0.6 * k);
    },
  };
};
