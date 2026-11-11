// Sets of the GTA 6 leaker short, part 2: the boulevard, the studio, the feed, the coin, the chart.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, grainTex, grp, hop, lerp, lit, panel, pool, pop, rng, rod, smat, smooth, soft, tex, text, tileTex, tiled, tmat, vgrad, woodTex,
  type Node, type V} from './kit';
import {actor, DEV, FAN, LEEK} from './cast';
import {monitor, mug, plant, signTex, skylineTex} from './props';
import {LIGHT, coin3d, coverTex, leekIcon, mosaic, type Builder} from './sets';
import {W} from './story';

const starTex = () => tex('sparkle', 96, 96, (g) => {
  g.fillStyle = '#fff8c8'; g.strokeStyle = '#241726'; g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 9 : 42; g.lineTo(48 + r * Math.cos(a), 48 + r * Math.sin(a)); }
  g.closePath(); g.fill(); g.stroke();
});

// ------------------------------------------------------------------ the boulevard: a made-up sunset city, a billboard, a game shop
function palm(p: Node, x: number, z: number, s = 1, lean = 0.1) {
  const g = grp(p, x, 0, z); g.scale.setScalar(s); g.rotation.z = lean;
  for (let i = 0; i < 6; i++) cyl(g, 0.17 - i * 0.012, 0.76, i % 2 ? '#8a6a4a' : '#7a5c40', Math.sin(i * 0.5) * 0.05, 0.37 + i * 0.72, 0, 0.16 - i * 0.012, 10);
  const top = grp(g, 0, 4.45, 0); ball(top, 0.2, '#6a4a30');
  for (let i = 0; i < 9; i++) { const f = grp(top); f.rotation.y = i * 0.7; const leaf = cone(f, 0.27, 2.0, i % 2 ? '#2f8f5a' : '#3fae6a', 0.85, -0.25 - (i % 3) * 0.12, 0, 6); leaf.rotation.z = -Math.PI / 2 - 0.42 - (i % 3) * 0.1; leaf.scale.z = 0.18; }
  return g;
}
export const vice: Builder = (root) => {
  backdrop(root, ['#241a5a', '#8a3a9a', '#ff7a6a', '#ffd08a']);
  panel(root, 64, 16, smat(tex('vice-sky', 1024, 256, (g, w, h) => {
    vgrad(g, w, h, ['#2a1f6a', '#a0409a', '#ff7a6a', '#ffcf8a']);
    g.fillStyle = '#ffe89a'; g.beginPath(); g.arc(w / 2, h * 0.7, 74, 0, 7); g.fill(); g.fillStyle = '#ff8a72'; for (let i = 0; i < 5; i++) g.fillRect(w / 2 - 80, h * 0.7 + 6 + i * 13, 160, 3 + i * 1.6);
    const r = rng(9);
    for (let x = 0; x < w; x += 24 + r() * 16) { const bw = 18 + r() * 20, bh = 26 + r() * 96; g.fillStyle = '#2a1f4a'; g.fillRect(x, h - bh, bw, bh); g.fillStyle = '#ffd98a'; for (let yy = h - bh + 6; yy < h - 6; yy += 9) for (let xx = x + 3; xx < x + bw - 4; xx += 6) if (r() < 0.4) g.fillRect(xx, yy, 2.5, 4); }
  }), 1.05), 0, 7.2, -22);
  floor(root, 70, 44, tmat(tiled(grainTex('asphalt', '#3a3550', 0.12), 12, 8)));
  for (let x = -12; x <= 22; x += 2.4) box(root, 1.2, 0.012, 0.14, '#ffe9a0', x, 0.008, 1.0);
  box(root, 44, 0.16, 2.6, '#d9b8b0', 0, 0.08, -2.3);
  for (const [x, z, s, l] of [[-2.55, -1.5, 1, 0.1], [2.6, -1.6, 1.05, -0.08], [-5.6, -4.6, 1.2, -0.06], [5.8, -4.8, 1.15, 0.08],
    [7.4, -1.7, 1, 0.07], [10.2, -1.5, 1.1, -0.06], [12.8, -1.8, 1, 0.08], [8.8, -4.7, 1.2, -0.05], [11.6, -4.5, 1.1, 0.06], [14.2, -4.8, 1.15, -0.07]] as const) palm(root, x, z, s, l);   // the second row lines the boulevard the car cruises down
  // the shop
  box(root, 5.4, 3.1, 1.2, '#f08ab0', 0, 1.71, -3.6); box(root, 5.7, 0.2, 1.36, '#fff3e8', 0, 3.36, -3.6);
  panel(root, 1.0, 2.05, lit('#2a1f4a', 1), 0, 1.19, -2.99); panel(root, 0.86, 1.9, lit('#ffd98a', 1.1), 0, 1.19, -2.985);
  const posters = ['#35c8d0', '#7a4fd0'].map((c, i) => tex('shopwin-' + i, 300, 260, (g, w, h) => { g.fillStyle = '#1b1740'; g.fillRect(0, 0, w, h); g.drawImage(coverTex('vi', '#ff5fa8', '#ff9a3c', 'VI').image as CanvasImageSource, 22, 20, 120, 168); g.fillStyle = c; g.fillRect(162, 20, 116, 76); g.fillStyle = '#ffd43b'; g.fillRect(162, 112, 116, 76); g.fillStyle = '#ffffff'; g.fillRect(22, 206, 256, 34); text(g, 'NOV 19', 150, 224, 28, '#17171d'); }));
  [-1.75, 1.75].forEach((x, i) => { box(root, 1.62, 1.42, 0.06, '#fff3e8', x, 1.6, -3.0); panel(root, 1.5, 1.3, smat(posters[i], 1.05), x, 1.6, -2.965); });
  const aw = box(root, 5.2, 0.07, 0.95, tmat(tex('awning', 256, 32, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#35c8d0'; g.fillRect(i * 16, 0, 16, 32); } })), 0, 2.56, -2.62); aw.rotation.x = 0.32;
  panel(root, 3.2, 0.5, smat(signTex('shop', 640, 100, '#17171d', '#7af0e0', [['GAME STORE', 78]], {glow: '#35c8d0'}), 1.5), 0, 3.0, -2.955);
  // the billboard over it (plain lettering, not the game's logo)
  const bill = grp(root); for (const x of [-2, 2]) box(bill, 0.14, 1.5, 0.14, '#3a3550', x, 4.1, -3.7);
  box(bill, 5.3, 2.56, 0.16, '#17171d', 0, 5.05, -3.6);
  panel(bill, 5.1, 2.36, smat(tex('billboard', 1020, 472, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff5fa8'); gr.addColorStop(0.6, '#ff9a3c'); gr.addColorStop(1, '#ffd43b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(42,31,106,.9)'; for (let i = 0; i < 5; i++) { const x = 640 + i * 90; g.fillRect(x, 300 - (i % 3) * 60, 60, 200); }
    text(g, 'GRAND THEFT', 330, 120, 130, '#ffffff', {stroke: '#17171d', sw: 14, maxWidth: 560}); text(g, 'AUTO', 200, 258, 150, '#ffffff', {stroke: '#17171d', sw: 14});
    text(g, 'VI', 760, 205, 330, '#7af0e0', {stroke: '#17171d', sw: 20});
    g.fillStyle = '#17171d'; g.fillRect(0, 372, w, 100); text(g, 'NOVEMBER 19', w / 2, 424, 78, '#ffd43b', {spacing: 6});
  }), 1.25), 0, 5.05, -3.51);
  // the pre-order gauge (takes the billboard's place)
  const gauge = grp(root); for (const x of [-1.2, 1.2]) box(gauge, 0.12, 0.6, 0.12, '#3a3550', x, 3.6, -3.6);
  box(gauge, 3.2, 1.9, 0.14, '#17171d', 0, 4.7, -3.55);
  panel(gauge, 3.0, 1.7, smat(tex('gauge', 600, 340, (g, w) => {
    g.fillStyle = '#1b1740'; g.fillRect(0, 0, w, 340);
    const arc = (a0: number, a1: number, c: string) => { g.beginPath(); g.arc(w / 2, 300, 200, Math.PI + a0, Math.PI + a1); g.lineWidth = 46; g.strokeStyle = c; g.stroke(); };
    arc(0, Math.PI / 2, '#5a63a8'); arc(Math.PI / 2, Math.PI, '#3fe07a');
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - 4, 72, 8, 64); text(g, 'PRE-ORDERS', w / 2, 34, 44, '#ffd43b', {spacing: 4}); text(g, 'EXPECTED', w / 2, 168, 28, '#ffffff', {spacing: 3});
  }), 1.2), 0, 4.7, -3.47);
  const needle = grp(gauge, 0, 4.05, -3.42); box(needle, 0.08, 1.05, 0.03, lit('#ff3b47', 1.6), 0, 0.52, 0); cyl(needle, 0.1, 0.05, '#ffffff', 0, 0, 0).rotation.x = Math.PI / 2;
  // a convertible
  const car = grp(root, 0, 0, 0.35), glass = new THREE.MeshBasicMaterial({color: '#bfe8ff', transparent: true, opacity: 0.4, depthWrite: false});
  box(car, 2.5, 0.42, 1.05, '#ff5fa8', 0, 0.52, 0); box(car, 0.85, 0.18, 1.0, '#ff7fba', -0.82, 0.8, 0); box(car, 0.75, 0.14, 1.0, '#ff7fba', 0.87, 0.78, 0); box(car, 0.5, 0.3, 0.9, '#2a1f4a', -0.1, 0.78, 0);
  soft(box(car, 0.05, 0.42, 0.95, glass, 0.48, 0.98, 0)).rotation.z = -0.35;
  for (const x of [-0.8, 0.85]) for (const z of [-0.52, 0.52]) { cyl(car, 0.27, 0.16, '#17171d', x, 0.27, z, 0.27, 16).rotation.x = Math.PI / 2; cyl(car, 0.13, 0.17, '#dfe6ee', x, 0.27, z, 0.13, 12).rotation.x = Math.PI / 2; }
  for (const z of [-0.36, 0.36]) { soft(ball(car, 0.075, lit('#fff3c0', 2.6), 1.26, 0.56, z)); soft(ball(car, 0.06, lit('#ff3b47', 2), -1.26, 0.58, z)); }
  ball(car, 0.17, '#f5c9a0', -0.12, 1.12, 0.12); box(car, 0.36, 0.1, 0.36, '#35c8d0', -0.12, 1.25, 0.12); box(car, 0.34, 0.36, 0.3, '#ffd43b', -0.12, 0.82, 0.12);
  const spots: [number, number][] = [[0.35, -2.3], [0.95, -2.0], [1.45, -1.5], [1.35, -0.8], [0.75, -0.2], [0.05, 0.3], [-0.65, 0.8], [-1.3, 1.4]];
  const line = spots.map(([x, z], i) => actor(root, FAN(i), i % 2 ? {a: {expr: 'laugh', pose: 'panic'}} : {a: {expr: 'grin', pose: 'both', prop: 'pad'}}, x, i < 3 ? 0.16 : 0, z, {scale: 1.0}));
  return {
    light: () => LIGHT.dusk,
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, q = v === 'queue' || v === 'meter';
      bill.visible = !q; gauge.visible = q;
      // the cruise is a tracking shot down the boulevard, past the shop: the car rides with the lens
      car.visible = v === 'cruise'; car.position.set(cam.position.x - 0.9, 0.012 * Math.sin(f * 1.1), 1.6);
      line.forEach((a, i) => { a.node.visible = q; a.node.position.y = (i < 3 ? 0.16 : 0) + 0.07 * Math.abs(Math.sin(f * 0.34 + i * 0.9)); if (q) a.tick(f, cam); });
      const k = smooth(f, W(193) - 4, W(195) + 8); needle.rotation.z = lerp(1.0, -1.12, k) + (k >= 1 ? 0.06 * Math.sin(f * 0.9) : 0);
    },
  };
};

// ------------------------------------------------------------------ the studio
export const studio: Builder = (root) => {
  backdrop(root, ['#0c1024', '#1c2444']);
  floor(root, 14, 12, tmat(tiled(woodTex('studio', '#8a6a4a', '#5a4030'), 5, 5)));
  box(root, 10, 5.4, 0.3, '#2a3350', 0, 2.7, -3.0);
  panel(root, 6.4, 2.3, smat(skylineTex('night', '#141a3a', '#3a4a8a', '#0c1024', '#ffd98a', 5), 1.0), 0, 3.1, -2.84); for (const x of [-3.2, -1.07, 1.07, 3.2]) box(root, 0.07, 2.4, 0.08, '#1c2440', x, 3.1, -2.8);
  const scr = (key: string, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => tex('dev-' + key, 280, 176, draw);
  const S = {
    game: scr('game', (g, w, h) => { vgrad(g, w, h, ['#2a1f6a', '#ff7a6a', '#ffcf8a']); g.fillStyle = '#2a1f4a'; g.fillRect(0, h - 40, w, 40); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * 35, h - 40); g.lineTo(i * 70 - 140, h); g.stroke(); } g.fillStyle = '#17171d'; g.fillRect(0, 0, w, 18); g.fillStyle = '#3fe07a'; g.fillRect(6, 5, 40, 8); }),
    alert: scr('alert', (g, w, h) => { g.fillStyle = '#3a0a10'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd43b'; g.beginPath(); g.moveTo(w / 2, 18); g.lineTo(w / 2 + 62, 118); g.lineTo(w / 2 - 62, 118); g.closePath(); g.fill(); text(g, '!', w / 2, 80, 78, '#17171d'); text(g, 'LEAKED', w / 2, 148, 40, '#ff5a64', {spacing: 4}); }),
    heart: scr('heart', (g, w, h) => {
      g.fillStyle = '#141a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5a7a';
      for (const s of [-1, 1]) { g.save(); g.translate(w / 2 + s * 9, h / 2 + 6); g.rotate(s * 0.14); g.beginPath(); g.moveTo(0, 44); g.bezierCurveTo(s * 74, -6, s * 46, -62, 0, -26); g.lineTo(s * -8, -6); g.lineTo(s * 6, 12); g.closePath(); g.fill(); g.restore(); }
    }),
  };
  const screens = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({map: S.game}));
  [-1.05, 1.05].forEach((x, d) => {
    box(root, 1.8, 0.06, 0.8, '#d9c8a8', x, 0.86, -1.7); box(root, 1.7, 0.84, 0.7, '#3a4468', x, 0.42, -1.7);
    [-0.42, 0.42].forEach((dx, j) => monitor(root, x + dx, 0.89, -1.82, 0.72, 0.45, screens[d * 2 + j])); box(root, 0.5, 0.03, 0.16, '#20242c', x, 0.905, -1.42); mug(root, x + 0.74, 0.89, -1.45, d ? '#ffd43b' : '#f3f1ea');
  });
  plant(root, -2.35, -2.3, 1.1); plant(root, 2.4, -2.3, 0.95);
  panel(root, 1.1, 0.8, smat(tex('notes', 220, 160, (g, w, h) => { g.fillStyle = '#f3f1ea'; g.fillRect(0, 0, w, h); const r = rng(3); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { g.fillStyle = ['#ffd43b', '#ff9ac8', '#8fd3ff', '#9fe6a0'][Math.floor(r() * 4)]; g.fillRect(10 + i * 34, 10 + j * 37, 28, 30); } }), 1), -2.9, 1.55, -2.84);
  const red = beam(root, 0.1, 1.5, 6, '#ff3b47', 0.1, 0, 4.9, -2.5); red.rotation.x = -Math.PI / 2;
  const devs = [[-0.85, -0.35], [-0.28, -0.8], [0.32, -0.45], [0.88, -0.85]].map(([x, z], i) => actor(root, DEV(i), {
    calm: {expr: 'neutral'}, shock: {expr: 'shock', pose: 'panic'}, sad: {expr: i % 2 ? 'dazed' : 'pained', pose: i === 1 ? 'think' : i === 3 ? 'hips' : 'hang'},
  }, x, 0, z, {scale: 1.1, res: i === 2 ? 1.3 : 1.0}));
  return {
    light: (v) => v === 'shock' ? {...LIGHT.room, sky: '#ffd0d0'} : {...LIGHT.cold, amb: 1.35, sky: '#cfd8ff'},
    tick: ({f, t, cam, shot}) => {
      const sh = shot.v === 'shock';
      screens.forEach((m, i) => { m.map = sh ? S.alert : S.heart; m.color.setScalar(sh ? (Math.floor(f / 4 + i) % 2 ? 1.5 : 0.8) : 1.05); });
      red.visible = sh; red.rotation.y = f * 0.25;
      devs.forEach((d, i) => { d.show(sh ? 'shock' : 'sad'); d.node.position.y = sh ? hop(t, 1 + i * 2, 0.24, 9) : 0; d.mesh.position.y = 0; d.tick(f, cam); if (!sh) d.mesh.rotation.z = (i % 2 ? 0.05 : -0.05) + 0.012 * Math.sin(f * 0.08 + i); });
    },
  };
};

// ------------------------------------------------------------------ the feed: clips, then clips with a coin on them
export const feed: Builder = (root) => {
  backdrop(root, ['#0a0d1c', '#232a55']);
  floor(root, 30, 30, '#161a30'); pool(root, 3.2, '#8fb0ff', 0.4, 0, -0.3);
  const ph = grp(root, 0, 0, -0.7); ph.rotation.x = -0.05;
  box(ph, 2.6, 4.7, 0.22, '#14161d', 0, 2.65, 0);
  panel(ph, 2.38, 4.44, smat(tex('feed-bg', 476, 888, (g, w, h) => {
    g.fillStyle = '#0f1322'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b2138'; g.fillRect(0, 0, w, 96);
    g.fillStyle = '#12281a'; g.beginPath(); g.arc(56, 48, 32, 0, 7); g.fill(); leekIcon(g, 56, 54, 24); g.fillStyle = '#56607e'; g.fillRect(104, 28, 170, 14); g.fillStyle = '#3a4260'; g.fillRect(104, 54, 110, 12);
    g.fillStyle = '#1b2138'; g.fillRect(0, h - 60, w, 60); g.fillStyle = '#56607e'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(70 + i * 112, h - 30, 12, 0, 7); g.fill(); }
  }), 1.05), 0, 2.65, 0.115);
  const tiles = [0, 1, 2].map((i) => {
    const t = grp(ph, 0, 3.72 - i * 1.22, 0.14);
    panel(t, 2.06, 1.08, smat(tex('feed-tile-' + i, 412, 216, (g, w, h) => { mosaic(g, 0, 0, w, h, 31 + i * 7, 26); g.fillStyle = '#e3342f'; g.fillRect(0, 0, 152, 44); text(g, 'LEAKED', 76, 24, 30, '#ffffff'); }), 1.1));
    return t;
  });
  const badges = tiles.map((t) => coin3d(t, 0.27, 0.72, -0.24, 0.22));
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      const ads = shot.v === 'ads';
      tiles.forEach((t, i) => { const at = shot.at + 2 + i * 4; t.scale.setScalar(ads ? 1 : Math.max(0.001, pop(f, at, 8))); t.visible = ads || f >= at; });
      badges.forEach((b, i) => { const at = shot.at + 2 + i * 4; b.visible = ads && f >= at; b.scale.setScalar(Math.max(0.001, pop(f, at, 8))); b.rotation.y = f * 0.22 + i; b.position.y = -0.24 + hop(f, W(68) + i * 2, 0.12, 9); });
    },
  };
};

// ------------------------------------------------------------------ the coin, and what it paid
export const coin: Builder = (root) => {
  backdrop(root, ['#120c04', '#3a2608']);
  floor(root, 30, 30, '#1c1408'); cyl(root, 1.6, 0.3, '#3a2a10', 0.25, 0.15, 0, 1.5, 40); cyl(root, 1.52, 0.05, lit('#f2c230', 1.2), 0.25, 0.31, 0, 1.52, 40); pool(root, 2.6, '#ffd98a', 0.5, 0.25, 0, 0.345);
  for (const x of [-1.2, 0.25, 1.7]) beam(root, 0.2, 1.6, 8, '#ffe9b0', 0.07, x, 8.2, -0.6);
  const big = coin3d(root, 0.8, 0.38, 1.7, 0);
  const sparks = Array.from({length: 7}, () => card(root, 0.36, 0.36, starTex(), 0, 0, 0, 1.6));
  const cash = grp(root, 0, 0.3, 0), stackTex = tmat(tex('bills', 64, 128, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#4f9e5c' : '#62b56e'; g.fillRect(0, i * 8, 64, 8); } g.fillStyle = '#f3f1ea'; g.fillRect(22, 0, 20, 128); }));
  const stacks = ([[0.62, 0.95, 1.0], [1.02, 0.8, 0.7], [0.82, 1.3, 1.25], [1.22, 1.2, 0.5], [0.42, 1.35, 0.6]] as const).map(([x, z, h]) => { const s = grp(cash, x, 0, z); box(s, 0.4, 1, 0.2, stackTex, 0, 0.5, 0); return {s, h}; });
  const q = rng(17), bills = Array.from({length: 14}, () => { const m = box(cash, 0.3, 0.14, 0.004, '#62b56e', 0, 0, 0); m.userData = {x: 0.2 + q() * 1.3, z: 0.4 + q() * 1.1, p: q() * 90, s: 0.02 + q() * 0.014}; return m; });
  const leek = actor(root, LEEK, {point: {pose: 'point'}, hips: {pose: 'hips'}, shrug: {pose: 'shrug'}}, -0.72, 0.3, 0.5, {scale: 1.05, res: 1.2});
  return {
    light: () => ({...LIGHT.warm, amb: 1.2, keyI: 1.2}),
    tick: ({f, t, cam, shot}) => {
      const v = shot.v;
      big.rotation.y = f * 0.11; big.position.y = 1.7 + 0.05 * Math.sin(f * 0.13);
      sparks.forEach((s, i) => { const a = i * 0.9 + f * 0.02; s.position.set(0.38 + 1.1 * Math.cos(a), 1.7 + 0.8 * Math.sin(a * 1.7 + i), 0.3 * Math.sin(a)); s.scale.setScalar(0.5 + 0.5 * Math.abs(Math.sin(f * 0.21 + i * 1.3))); });
      cash.visible = v !== 'hero';
      stacks.forEach(({s, h}, i) => { s.scale.y = Math.max(0.02, h * (v === 'cash' ? smooth(t, 2 + i * 4, 18 + i * 4) : 1)); });
      bills.forEach((m) => { const u = (f * m.userData.s + m.userData.p * 0.05) % 1; m.visible = v === 'cash'; m.position.set(m.userData.x + 0.3 * Math.sin(f * 0.07 + m.userData.p), 3.6 - u * 3.6, m.userData.z); m.rotation.set(f * 0.11 + m.userData.p, f * 0.07, f * 0.13 + m.userData.p); });
      leek.node.scale.setScalar(v === 'pile' ? 0.85 : 1);
      if (v === 'pile') { leek.show('hips'); leek.node.position.set(0.8, 0.3, -0.1); } else { leek.show(v === 'hero' ? 'point' : 'shrug'); leek.node.position.set(-0.52, 0.3 + (v === 'hero' ? hop(f, W(68), 0.12, 9) : 0), 0.6); }
      leek.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the chart: the target, the peak, the fall
export const chart: Builder = (root) => {
  backdrop(root, ['#050810', '#101830']);
  floor(root, 14, 12, tmat(tiled(tileTex('trade', '#1c2233', '#12172a', 2), 7, 6)));
  box(root, 7, 7, 0.3, '#0e1220', 0, 3.5, -3.2);
  /** market value in millions of dollars -> height on the wall. The scale is linear and starts at zero. */
  const Y = (m: number) => 1.9 + (m / 30) * 3.0, ty = (y: number) => (5.8 - y) * 160, tx = (x: number) => (x + 2.3) * 160;
  /** October day -> place along the wall: one unit a day, so the time axis is linear too */
  const DAY = (d: number) => d - 11.5;
  panel(root, 4.6, 5.0, smat(tex('chart-bg', 736, 800, (g, w, h) => {
    g.fillStyle = '#070b14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#18233c'; g.lineWidth = 2;
    for (let x = 48; x < w; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ty(Y(0))); g.stroke(); }
    for (const m of [10, 20]) { g.strokeStyle = '#2a3a5c'; g.beginPath(); g.moveTo(0, ty(Y(m))); g.lineTo(w, ty(Y(m))); g.stroke(); text(g, `$${m}M`, tx(-1.3), ty(Y(m)) - 16, 24, '#6f82a8', {font: 'Montserrat'}); }
    g.strokeStyle = '#ffd43b'; g.lineWidth = 6; g.setLineDash([22, 14]); g.beginPath(); g.moveTo(0, ty(Y(30))); g.lineTo(w, ty(Y(30))); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#6f82a8'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, ty(Y(0))); g.lineTo(w, ty(Y(0))); g.stroke();
    for (const d of [10, 11, 12, 13]) { g.fillStyle = '#6f82a8'; g.fillRect(tx(DAY(d)) - 2, ty(Y(0)), 4, 10); text(g, d === 10 ? 'OCT 10' : String(d), tx(DAY(d)), ty(Y(0)) + 30, 24, '#9fb0c8', {font: 'Montserrat'}); }
  }), 1.1), 0, 3.3, -3.03);
  // lettering on the wall is separate from the grid so each shot shows only what does not sit under its stamp
  const label = (key: string, w: number, h: number, wide: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, x: number, y: number) =>
    soft(panel(root, wide, wide * h / w, smat(tex('chart-' + key, w, h, draw), 1.1, true), x, y, -3.0));
  const bigTarget = label('target', 520, 64, 2.6, (g, w) => text(g, 'TARGET: $30 MILLION', w / 2, 34, 46, '#ffd43b', {spacing: 2}), 0, Y(30) - 0.24);
  const smallTarget = label('target-s', 300, 50, 1.2, (g, w) => text(g, 'TARGET $30M', w / 2, 27, 34, '#ffd43b', {spacing: 1}), 1.45, Y(30) + 0.15);
  const note = label('note', 500, 84, 2.3, (g, w) => {
    text(g, 'PEAK AND LOW AS REPORTED BY IGN', w / 2, 24, 24, '#8494b8', {font: 'Montserrat'}); text(g, 'THE LINE BETWEEN THEM IS A SKETCH', w / 2, 61, 24, '#8494b8', {font: 'Montserrat'});
  }, -0.6, 1.44);
  // Two values are reported: the peak on October 11 and the low on October 13. Everything between is drawn by hand.
  const P: [number, number][] = [[DAY(10), 4.0], [-1.25, 4.5], [-1.0, 5.4], [-0.75, 6.8], [DAY(11), 7.8], [-0.2, 6.3], [0.15, 4.2], [0.55, 2.8], [1.0, 2.0], [DAY(13), 1.7]];
  const at = (i: number): V => [P[i][0], Y(P[i][1]), -2.96];
  const segs = P.slice(1).map((_, i) => rod(root, at(i), at(i + 1), 0.04, lit(i < 4 ? '#3fe07a' : '#ff3b47', 1.5)));
  const marker = coin3d(root, 0.2), fallen = coin3d(root, 0.5);
  const cracks = grp(root, 0.72, 0.012, -0.9); for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.2, len = 0.4 + (i % 3) * 0.25, c = box(cracks, len, 0.01, 0.05, '#05070c', Math.cos(a) * len / 2, 0, Math.sin(a) * len / 2); c.rotation.y = -a; }
  const soapbox = box(root, 0.9, 0.3, 0.6, tmat(woodTex('soapbox', '#b08a55', '#6b4a2d')), 0.8, 0.15, 3.0);
  const leek = actor(root, LEEK, {reach: {pose: 'hold'}, up: {pose: 'panic'}, shrug: {pose: 'shrug'}}, -1.0, 0, -1.2, {scale: 1.1, res: 1.2});
  return {
    light: (v) => v === 'fall' || v === 'bottom' ? {...LIGHT.dark, amb: 1.0, sky: '#ffc0c0', ground: '#4a3050'} : {...LIGHT.dark, amb: 1.0, sky: '#c0ffd8', ground: '#2a4a40'},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, p = v === 'target' ? 0 : v === 'peak' ? 4 * smooth(f, shot.at + 3, W(155) + 5) : v === 'fall' ? 4 + 5 * smooth(t, 1, 27) : 9;
      bigTarget.visible = v === 'target'; smallTarget.visible = note.visible = v === 'peak' || v === 'fall'; note.position.x = v === 'fall' ? 0.75 : -0.6;   // on the side the leaker is not
      segs.forEach((s, i) => { s.visible = p >= i + 1; });
      const i = Math.min(8, Math.floor(p)), u = p - i, a = at(i), b = at(Math.min(9, i + 1));
      marker.visible = v !== 'bottom'; marker.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + (v === 'target' ? 0.05 * Math.sin(f * 0.3) : 0), -2.8); marker.rotation.y = v === 'target' ? 0.5 * Math.sin(f * 0.15) : f * 0.2; marker.scale.setScalar(v === 'target' ? 1.5 : 1);
      const land = shot.at + 6, k = v === 'bottom' ? smooth(f, shot.at - 1, land) : 0;
      fallen.visible = v === 'bottom'; cracks.visible = v === 'bottom' && f >= land; fallen.position.set(0.72, lerp(3.6, 0.4, k), -0.9); fallen.rotation.set(0, 0.5, 0.45 + (k >= 1 ? 0.12 * Math.sin((f - land) * 0.9) * Math.max(0, 1 - (f - land) / 16) : 0));
      // The leaker never stands in front of the part of the line a shot is about: up front on a soapbox for the target
      // (mirrored, so the raised arm points at it), right of the climb, left of the fall, beside the wreck.
      let pose = 'reach', x = 0.8, z = 3.0, y = 0.3 + hop(f, W(117), 0.1, 8), flip = -1;
      if (v === 'peak') { pose = 'up'; x = 0.95; z = -1.2; y = 0.1 * Math.abs(Math.sin(f * 0.45)); flip = 1; }
      else if (v === 'fall') { x = -0.93 + 0.03 * Math.sin(f * 1.5); z = -1.2; y = 0; flip = 1; }
      else if (v === 'bottom') { pose = 'shrug'; x = -1.0; z = -1.0; y = 0; flip = 1; }
      soapbox.visible = v === 'target';
      leek.show(pose); leek.node.position.set(x, y, z); leek.tick(f, cam); leek.mesh.scale.x = flip;
    },
  };
};
