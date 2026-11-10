// Sets of the Nvidia short, part 2: surveillance room, evidence board, cinema front, TV interview, office, trading floor.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, grainTex, grp, hop, lamp, lit, panel, pool, pop, rng, rod, rrect, shake, slab, smat, smooth, soft, tex, text, tileTex, tiled,
  tmat, vgrad, woodTex, type G2} from './kit';
import {actor, AGENT, drawActor, JENSEN, STAFF, TRADER, WOMAN, type Draw, type Look} from './cast';
import {monitor, mug, officeChair, plant, signTex, skylineTex} from './props';
import {W} from './story';
import {LIGHT, type Builder} from './sets';

/** small screen graphic with a title strip */
const screenTex = (key: string, bg: string, draw: (g: G2) => void) => tex('screen-' + key, 256, 154, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 256, 154); draw(g); });
/** head-and-shoulders snapshot of a cast member with a white border */
const portrait = (key: string, look: Look, d: Draw, bg: string, caption?: string) => tex('portrait-' + key, 240, 288, (g) => {
  g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, 240, 288); g.save(); g.beginPath(); g.rect(14, 14, 212, 214); g.clip(); g.fillStyle = bg; g.fillRect(0, 0, 240, 288);
  g.translate(120 - 300 * 0.62, 118 - 320 * 0.62); drawActor(g, look, d, 0.62); g.restore();
  if (caption) text(g, caption, 120, 258, 30, '#241726', {maxWidth: 200});
});

// ------------------------------------------------------------------ surveillance room
export const surveillance: Builder = (root) => {
  backdrop(root, ['#04060c', '#0c1120']);
  floor(root, 12, 10, tmat(tiled(tileTex('dark', '#1c2130', '#11141e', 2), 6, 5)));
  box(root, 10, 7, 0.2, '#171c2a', 0, 3.5, -2.9);
  const screens = [
    screenTex('map', '#0a1a2c', (g) => { g.fillStyle = '#1f5a7a'; for (const [x, y, w, h] of [[30, 40, 60, 44], [70, 86, 32, 46], [116, 34, 44, 60], [150, 40, 80, 50], [196, 100, 36, 24]]) { g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill(); } g.strokeStyle = '#ff5a5a'; g.setLineDash([6, 5]); g.lineWidth = 2.5; g.beginPath(); g.moveTo(60, 64); g.quadraticCurveTo(130, 4, 202, 74); g.stroke(); g.setLineDash([]); g.fillStyle = '#ff5a5a'; for (const [x, y] of [[60, 64], [202, 74], [188, 96]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }),
    screenTex('subject', '#141018', (g) => { g.fillStyle = '#e9e4f0'; g.beginPath(); g.ellipse(128, 96, 36, 34, 0, 0, 7); g.fill(); g.fillRect(96, 124, 64, 40); g.beginPath(); g.ellipse(128, 62, 66, 11, 0, 0, 7); g.fill(); g.fillRect(96, 30, 64, 34); g.fillStyle = '#141018'; g.fillRect(100, 86, 24, 13); g.fillRect(132, 86, 24, 13); g.fillRect(96, 54, 64, 8); g.strokeStyle = '#ff5a5a'; g.lineWidth = 3; g.strokeRect(70, 14, 116, 130); text(g, 'SUBJECT', 42, 20, 16, '#ff5a5a', {font: 'Montserrat'}); }),
    screenTex('audio', '#07140f', (g) => { g.strokeStyle = '#5dff8a'; g.lineWidth = 3; g.beginPath(); for (let x = 8; x < 250; x += 3) { const y = 80 + Math.sin(x * 0.21) * 34 * Math.sin(x * 0.027) + Math.sin(x * 0.9) * 8; if (x === 8) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); text(g, 'AUDIO', 40, 20, 16, '#5dff8a', {font: 'Montserrat'}); }),
    screenTex('chips', '#0c1620', (g) => { g.fillStyle = '#76b900'; for (let i = 0; i < 6; i++) for (const d of [-1, 1]) { g.fillRect(92 + i * 13, 77 + d * 44 - (d < 0 ? 12 : 0), 7, 12); g.fillRect(128 + d * 44 - (d < 0 ? 12 : 0), 41 + i * 13, 12, 7); } g.strokeStyle = '#76b900'; g.lineWidth = 5; g.strokeRect(84, 33, 88, 88); g.fillStyle = '#c9d2d8'; g.fillRect(104, 53, 48, 48); text(g, 'EXPORT WATCH', 128, 140, 15, '#b8f24a', {font: 'Montserrat'}); }),
    screenTex('rec', '#0a2414', (g) => { g.fillStyle = '#12381e'; g.fillRect(0, 100, 256, 54); g.fillStyle = '#f4f3ee'; g.beginPath(); g.ellipse(128, 66, 24, 23, 0, 0, 7); g.fill(); g.fillStyle = '#f4cfa8'; g.beginPath(); g.ellipse(128, 74, 20, 18, 0, 0, 7); g.fill(); g.fillStyle = '#1d1d24'; g.fillRect(108, 90, 40, 50); g.strokeStyle = '#1d1d24'; g.lineWidth = 3; g.strokeRect(112, 68, 13, 9); g.strokeRect(131, 68, 13, 9); text(g, 'CAM 04', 214, 20, 15, '#ffffff', {font: 'Montserrat'}); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(84, 34, 88, 108); }),
    screenTex('bars', '#161208', (g) => { [50, 74, 62, 96, 84, 118, 40].forEach((h, i) => { g.fillStyle = i === 5 ? '#ff5a5a' : '#ffb84a'; g.fillRect(24 + i * 31, 136 - h, 20, h); }); text(g, 'TRAFFIC', 46, 18, 15, '#ffb84a', {font: 'Montserrat'}); }),
    screenTex('log', '#0b0d14', (g) => { const r = rng(4); for (let y = 16; y < 150; y += 13) { g.fillStyle = r() < 0.2 ? '#ff5a5a' : '#8fd3ff'; g.fillRect(12, y, 60 + r() * 170, 5); } }),
    screenTex('radar', '#06140f', (g) => { g.strokeStyle = '#3fd27a'; g.lineWidth = 2; for (const r of [22, 44, 66]) { g.beginPath(); g.arc(128, 77, r, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(62, 77); g.lineTo(194, 77); g.moveTo(128, 11); g.lineTo(128, 143); g.stroke(); g.fillStyle = '#b8ffce'; for (const [x, y] of [[150, 52], [104, 98], [168, 96]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }),
    screenTex('clocks', '#10121c', (g) => { [['WASH', '09:41'], ['TAIPEI', '22:41'], ['S\'PORE', '22:41']].forEach(([c, t], i) => { text(g, c, 46 + i * 82, 54, 17, '#8fd3ff', {font: 'Montserrat'}); text(g, t, 46 + i * 82, 92, 30, '#ffffff'); }); }),
  ];
  screens.forEach((t, i) => {
    const x = -1.42 + (i % 3) * 1.42, y = 4.15 - Math.floor(i / 3) * 0.95;
    box(root, 1.36, 0.9, 0.1, '#0c0e14', x, y, -2.76); panel(root, 1.26, 0.8, smat(t, 1.3), x, y, -2.7);
  });
  const recDot = soft(ball(root, 0.04, lamp('#ff3b3b', 4), -0.52, 3.5, -2.66));
  const sweep = box(root, 0.36, 0.015, 0.01, lit('#b8ffce', 2), 0, 2.25, -2.67); sweep.geometry.translate(0.18, 0, 0);
  for (const y of [1.72, 4.68]) box(root, 4.5, 0.06, 0.12, '#2a3246', 0, y, -2.74);
  panel(root, 4.2, 0.46, smat(signTex('intel', 900, 100, '#0b1020', '#8fd3ff', [['INTELLIGENCE  ·  OPERATIONS', 54]], {font: 'Montserrat', border: '#27405e'}), 1.2), 0, 5.08, -2.74);
  for (const x of [-1.9, 1.9]) soft(ball(root, 0.05, lamp('#ff3b3b', 3), x, 5.08, -2.7));
  // console desk
  box(root, 5.0, 0.9, 1.1, '#273044', 0, 0.45, -0.7); box(root, 5.1, 0.06, 1.2, '#3a4560', 0, 0.93, -0.7); box(root, 5.0, 0.2, 0.04, lit('#3f8fd0', 1.2), 0, 0.52, -0.14);
  for (const x of [-1.5, 0, 1.5]) { box(root, 0.7, 0.44, 0.05, '#11131a', x, 1.3, -0.66); box(root, 0.08, 0.2, 0.05, '#1f2330', x, 1.04, -0.68); box(root, 0.48, 0.03, 0.17, '#11131a', x + 0.1, 0.98, -0.34); soft(ball(root, 0.018, lit('#5dff8a', 3), x + 0.28, 1.12, -0.63)); }
  mug(root, -0.72, 0.96, -0.38, '#f3f1ea'); mug(root, 0.86, 0.96, -0.3, '#e2453c');
  box(root, 0.3, 0.07, 0.2, '#b5262a', 2.05, 0.99, -0.42); box(root, 0.3, 0.05, 0.08, '#8a1c20', 2.05, 1.05, -0.42);
  for (const x of [-1.5, 1.5]) { rod(root, [x, 7, -0.9], [x, 5.9, -0.9], 0.02, '#3a4560'); cone(root, 0.3, 0.3, '#2a3246', x, 5.8, -0.9); soft(ball(root, 0.08, lit('#cfe4ff', 3), x, 5.68, -0.9)); beam(root, 0.1, 1.3, 5.6, '#9fc4ff', 0.04, x, 5.66, -0.9); }
  const agents = [
    actor(root, AGENT(0), {watch: {expr: 'stern', pose: 'cross'}, alert: {expr: 'stern', pose: 'point'}}, -0.98, 0, -1.55, {scale: 1.15, res: 1.0}),
    actor(root, AGENT(1), {watch: {expr: 'stern', pose: 'phone', prop: 'phone'}}, 0.02, 0, -1.75, {scale: 1.15, res: 1.0}),
    actor(root, AGENT(2), {watch: {expr: 'neutral', pose: 'think'}}, 1.0, 0, -1.55, {scale: 1.15, res: 1.0}),
  ];
  agents.forEach((a) => a.tint('#e4e9f8'));
  return {
    light: () => ({...LIGHT.dark, amb: 0.9}),
    tick: ({f, cam, shot}) => {
      recDot.visible = f % 20 < 12; sweep.rotation.z = -f * 0.16;
      agents[0].show(shot.v === 'wide' && f > shot.at + 14 ? 'alert' : 'watch');
      agents.forEach((a, i) => { a.node.position.y = 0.02 * Math.sin(f * 0.13 + i * 2); a.tick(f, cam); });
    },
  };
};

// ------------------------------------------------------------------ evidence board with red string
export const corkboard: Builder = (root) => {
  backdrop(root, ['#0e1018', '#1b1e2c']);
  floor(root, 10, 8, '#2a2c38');
  box(root, 10, 5.4, 0.2, tmat(tiled(grainTex('wallpaint', '#3d4458', 0.1), 5, 3)), 0, 2.7, -0.4);
  const cork = tex('cork', 256, 256, (g) => { const r = rng(9); g.fillStyle = '#c99a62'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 4200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,56,24,.35)' : 'rgba(255,226,170,.3)'; g.beginPath(); g.arc(r() * 256, r() * 256, 0.6 + r() * 2, 0, 7); g.fill(); } }, true);
  box(root, 2.6, 3.6, 0.08, tmat(tiled(cork, 2, 3)), 0, 2.25, -0.26);
  for (const [w, h, x, y] of [[2.8, 0.12, 0, 4.09], [2.8, 0.12, 0, 0.41], [0.12, 3.8, -1.34, 2.25], [0.12, 3.8, 1.34, 2.25]]) box(root, w, h, 0.14, '#6b4a2d', x, y, -0.24);
  const note = (key: string, s: string, bg: string) => tex('note-' + key, 180, 180, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 180, 180); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 150, 180, 30); g.save(); g.translate(90, 86); g.rotate(-0.08); text(g, s, 0, 0, 46, '#241726', {maxWidth: 156}); g.restore(); });
  const items: [THREE.Texture, number, number, number, number, number][] = [
    [portrait('jensen', JENSEN, {expr: 'smile'}, '#9fc4e8', 'THE CEO'), 0.74, 0.89, -0.6, 3.34, 0.06],
    [portrait('woman', WOMAN, {expr: 'smile'}, '#e8b0c4', 'THE EXEC'), 0.74, 0.89, 0.6, 3.26, -0.07],
    [note('recruit', 'RECRUITED?', '#ffe14a'), 0.62, 0.62, 0.02, 2.38, -0.06],
    [tex('pin-mega', 300, 200, (g) => { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, 300, 200); g.fillStyle = '#0d1820'; g.fillRect(12, 12, 276, 132); text(g, 'MEGASPEED', 150, 78, 54, '#bffff6', {maxWidth: 250}); text(g, 'UNDER INVESTIGATION', 150, 172, 24, '#c23b3b', {font: 'Montserrat'}); }), 0.9, 0.6, -0.64, 1.7, 0.05],
    [tex('pin-map', 240, 240, (g) => { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, 240, 240); g.fillStyle = '#9fd0e8'; g.fillRect(14, 14, 212, 170); g.fillStyle = '#8fbf7a'; g.beginPath(); g.ellipse(100, 70, 78, 46, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(170, 150, 40, 22, 0, 0, 7); g.fill(); g.fillStyle = '#e23b3b'; for (const [x, y] of [[150, 84], [176, 108], [142, 150]]) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); } text(g, 'WHO? WHEN?', 120, 212, 28, '#241726'); }), 0.62, 0.62, 0.7, 1.78, 0.08],
    [tex('pin-chip', 240, 240, (g) => { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, 240, 240); g.fillStyle = '#20303a'; g.fillRect(14, 14, 212, 170); g.fillStyle = '#e7b93c'; for (let i = 0; i < 6; i++) for (const d of [-1, 1]) { g.fillRect(76 + i * 16, 99 + d * 56 - (d < 0 ? 14 : 0), 8, 14); g.fillRect(120 + d * 56 - (d < 0 ? 14 : 0), 55 + i * 16, 14, 8); } g.fillStyle = '#3f9b43'; g.fillRect(66, 45, 108, 108); g.fillStyle = '#c9d2d8'; g.fillRect(90, 69, 60, 60); text(g, 'AI CHIPS', 120, 212, 30, '#241726'); }), 0.6, 0.6, 0.62, 0.98, -0.05],
    [note('report', 'REPORTEDLY', '#ff9ac0'), 0.5, 0.5, -0.62, 0.96, 0.1],
  ];
  const cards = items.map(([t, w, h, x, y, rz], i) => { const m = panel(root, w, h, smat(t, 1), x, y, -0.2 + i * 0.004); m.rotation.z = rz; soft(ball(root, 0.04, lit('#e23b3b', 1.2), x, y + h * 0.43, -0.15)); return m; });
  const pin = (i: number): [number, number, number] => [items[i][3], items[i][4] + items[i][2] * 0.43, -0.14];
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [0, 2]];
  const strings = links.map(([a, b]) => { const A = pin(a), B = pin(b), g = grp(root, A[0], A[1], A[2]); const r = rod(g, [0, 0, 0], [B[0] - A[0], B[1] - A[1], 0], 0.012, lit('#e23b3b', 1.3)); return {g, r, len: Math.hypot(B[0] - A[0], B[1] - A[1])}; });
  for (const x of [-0.7, 0.7]) { cone(root, 0.22, 0.22, '#2b2f38', x, 4.62, 0.5).rotation.x = 0.5; soft(ball(root, 0.07, lit('#fff0c0', 4), x, 4.54, 0.55)); beam(root, 0.08, 1.0, 3.6, '#ffe9b0', 0.04, x, 4.52, 0.55).rotation.x = 0.18; }
  return {
    light: () => ({...LIGHT.warm, amb: 1.25}),
    tick: ({f, shot}) => {
      cards.forEach((m, i) => { const k = i === 2 ? 1 + 0.3 * Math.max(0, 1 - Math.abs(f - W(63) - 4) / 6) : 1; m.scale.set(k, k, 1); });   // the question lands on its word
      cards[2].rotation.z = -0.06 + shake(f, W(63), 0.12, 14);
      strings.forEach((s, i) => { const k = smooth(f, shot.at + 3 + i * 5, shot.at + 9 + i * 5); s.g.visible = k > 0.01; s.g.scale.set(k, k, 1); });
    },
  };
};

// ------------------------------------------------------------------ cinema front: "straight out of a spy movie"
export const cinema: Builder = (root) => {
  backdrop(root, ['#050714', '#161a3c', '#2c2456']);
  floor(root, 24, 12, tmat(tiled(tileTex('pave', '#777c8a', '#5a5f6c', 4), 9, 5)), 0, 0, 2);
  const brick = tex('brick', 256, 256, (g) => { g.fillStyle = '#5a2a2a'; g.fillRect(0, 0, 256, 256); const r = rng(6); for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) { g.fillStyle = ['#7a3a34', '#6e332f', '#84423a'][Math.floor(r() * 3)]; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); } }, true);
  box(root, 11, 9, 0.4, tmat(tiled(brick, 6, 5)), 0, 4.5, -1.3);
  box(root, 11, 0.3, 0.6, '#3a2420', 0, 3.0, -1.1);
  // marquee
  box(root, 3.5, 1.3, 1.7, '#2b2f3a', 0, 3.6, -0.3);
  const title = tex('marquee', 860, 310, (g) => { g.fillStyle = '#fff8e0'; g.fillRect(0, 0, 860, 310); for (const y of [88, 310]) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, y, 860, 3); } text(g, 'NOW SHOWING', 430, 48, 50, '#241726', {font: 'Montserrat', spacing: 8}); text(g, 'THE HONEYPOT', 430, 202, 178, '#c1272d', {spacing: 4, maxWidth: 800}); });
  panel(root, 3.2, 1.15, smat(title, 1.3), 0, 3.6, 0.56);
  for (const s of [-1, 1]) panel(root, 1.66, 1.15, smat(signTex('marquee-side', 330, 228, '#fff8e0', '#c1272d', [['SPY', 150]]), 1.2), s * 1.76, 3.6, -0.3, s * Math.PI / 2);
  const bulbs = [lamp('#ffe9a0', 3), lamp('#ffe9a0', 3)];
  for (let i = 0; i < 15; i++) for (const y of [2.94, 4.26]) soft(ball(root, 0.06, bulbs[(i + (y > 4 ? 1 : 0)) % 2], -1.6 + i * 0.2286, y, 0.58));
  box(root, 3.3, 0.05, 1.5, lit('#ffe2b0', 1.6), 0, 2.93, -0.3); pool(root, 2.4, '#ffe2b0', 0.4, 0, 0.6);
  // blade sign
  box(root, 0.8, 3.2, 0.3, '#b5262a', 0, 6.15, -0.7);
  const blade = tex('blade', 128, 512, (g) => { g.fillStyle = '#8a1c20'; g.fillRect(0, 0, 128, 512); 'CINEMA'.split('').forEach((c, i) => text(g, c, 64, 52 + i * 82, 82, '#ffe9a0')); });
  panel(root, 0.6, 2.9, smat(blade, 1.4), 0, 6.15, -0.54);
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) soft(ball(root, 0.045, bulbs[i % 2], s * 0.36, 4.72 + i * 0.26, -0.53));
  // doors, posters
  box(root, 1.9, 2.7, 0.14, '#1a1e2c', 0, 1.35, -1.02);
  for (const x of [-0.66, -0.22, 0.22, 0.66]) { box(root, 0.4, 2.3, 0.05, lit('#3a4a6a', 0.7), x, 1.25, -0.94); rod(root, [x + (x < 0 ? 0.14 : -0.14), 0.9, -0.88], [x + (x < 0 ? 0.14 : -0.14), 1.5, -0.88], 0.022, '#e7c56a'); }
  const poster = (key: string, bg: [string, string], titleText: string, sub: string, ink: string) => tex('poster-' + key, 300, 470, (g) => {
    vgrad(g, 300, 470, bg);
    g.fillStyle = ink; g.beginPath(); g.ellipse(150, 196, 62, 58, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(70, 330); g.quadraticCurveTo(150, 220, 230, 330); g.lineTo(230, 470); g.lineTo(70, 470); g.fill();
    g.beginPath(); g.ellipse(150, 136, 118, 20, 0, 0, 7); g.fill(); g.fillRect(96, 78, 108, 60);
    g.fillStyle = bg[0]; g.fillRect(96, 180, 46, 22); g.fillRect(158, 180, 46, 22); g.fillRect(96, 122, 108, 12);
    text(g, titleText, 150, 372, 56, '#fff8e0', {maxWidth: 270, stroke: '#241726', sw: 8}); text(g, sub, 150, 424, 22, '#fff8e0', {font: 'Montserrat', maxWidth: 260});
    text(g, 'A SPY THRILLER', 150, 34, 24, '#fff8e0', {font: 'Montserrat', spacing: 3});
  });
  [[-1.52, poster('a', ['#c1272d', '#5a0f18'], 'THE HONEYPOT', 'RATED A FOR ALLEGED', '#16060a')], [1.52, poster('b', ['#1c7396', '#0b2c40'], 'THE BRIEFING', 'COMING SOON', '#06141c')]].forEach(([x, t]) => {
    box(root, 1.0, 1.5, 0.1, '#c9a94f', x as number, 1.6, -1.05); panel(root, 0.88, 1.38, smat(t as THREE.Texture, 1.15), x as number, 1.6, -0.99);
    box(root, 1.04, 0.05, 0.12, lit('#fff0c0', 2), x as number, 2.4, -0.98);
  });
  box(root, 1.5, 0.03, 6, '#b5262a', 0, 0.015, 1.9);
  for (const s of [-1, 1]) { for (const z of [0.4, 2.4]) { cyl(root, 0.14, 0.05, '#c9a94f', s * 0.95, 0.025, z); cyl(root, 0.03, 0.95, '#e7c56a', s * 0.95, 0.5, z); ball(root, 0.06, '#e7c56a', s * 0.95, 1.0, z); } rod(root, [s * 0.95, 0.92, 0.4], [s * 0.95, 0.8, 1.4], 0.025, '#b5262a'); rod(root, [s * 0.95, 0.8, 1.4], [s * 0.95, 0.92, 2.4], 0.025, '#b5262a'); }
  return {
    light: () => ({...LIGHT.dark, amb: 1.05, sky: '#ffd9b0', keyI: 0.7, key: '#ffe2b0'}),
    tick: ({f}) => { const on = Math.floor(f / 4) % 2; bulbs[0].color.set('#ffe9a0').multiplyScalar(on ? 3.4 : 0.5); bulbs[1].color.set('#ffe9a0').multiplyScalar(on ? 0.5 : 3.4); },
  };
};

// ------------------------------------------------------------------ TV interview: "completely normal"
export const interview: Builder = (root) => {
  backdrop(root, ['#090b14', '#191d30']);
  floor(root, 14, 12, '#20232e'); cyl(root, 2.5, 0.12, '#33405e', 0, 0.06, 0, 2.5, 40); cyl(root, 2.56, 0.04, lit('#5fb0ff', 1.3), 0, 0.02, 0, 2.56, 40);
  panel(root, 6.6, 3.6, smat(skylineTex('dusk', '#39407e', '#f2a35a', '#1b1e38', '#ffd98a', 12), 1.0), 0, 2.3, -2.7);
  for (const x of [-3.3, -1.1, 1.1, 3.3]) box(root, 0.05, 3.7, 0.08, '#2a2f42', x, 2.3, -2.66);
  for (const y of [0.45, 4.15]) box(root, 6.8, 0.1, 0.12, '#2a2f42', 0, y, -2.66);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) box(root, 0.22, 4.4, 0.12, i % 2 ? '#6b4a2d' : '#7d5a3a', s * (3.7 + i * 0.3), 2.2, -2.5 + i * 0.3);
  // armchair and stool
  const chair = grp(root, 0, 0.12, 0);
  box(chair, 1.0, 0.26, 0.86, '#2f7f86', 0, 0.3, 0); box(chair, 1.0, 0.95, 0.22, '#2a727a', 0, 0.78, -0.4); for (const s of [-1, 1]) { box(chair, 0.18, 0.5, 0.86, '#2a727a', s * 0.56, 0.44, 0); cyl(chair, 0.03, 0.18, '#c9a94f', s * 0.45, 0.09, 0.3); cyl(chair, 0.03, 0.18, '#c9a94f', s * 0.45, 0.09, -0.3); }
  cyl(root, 0.27, 0.2, '#3a4a6a', 0, 0.22, 0.72, 0.27, 20);
  cyl(root, 0.3, 0.04, '#e9e4d6', 1.15, 0.7, -0.1, 0.3, 24); cyl(root, 0.04, 0.6, '#c9a94f', 1.15, 0.4, -0.1); mug(root, 1.1, 0.72, -0.05, '#f3f1ea'); plant(root, -1.7, -0.9, 0.9);
  // lights, camera, boom
  rod(root, [-2.2, 0.1, 1.2], [-2.2, 2.7, 1.2], 0.03, '#2b2f38'); for (const a of [0, 2.1, 4.2]) rod(root, [-2.2, 0.5, 1.2], [-2.2 + 0.5 * Math.cos(a), 0.1, 1.2 + 0.5 * Math.sin(a)], 0.02, '#2b2f38');
  const softbox = box(root, 0.95, 1.1, 0.18, '#1b1d23', -2.2, 3.0, 1.2); softbox.rotation.y = 0.9; const face = panel(root, 0.85, 1.0, lit('#fff6e0', 2.2), -2.12, 3.0, 1.14, 0.9); soft(face);
  const rig = grp(root, 1.75, 0, 2.3); for (const a of [0.4, 2.5, 4.6]) rod(rig, [0, 1.2, 0], [0.5 * Math.cos(a), 0.12, 0.5 * Math.sin(a)], 0.025, '#12141c'); box(rig, 0.34, 0.3, 0.6, '#16181e', 0, 1.38, 0); cyl(rig, 0.11, 0.3, '#0c0d12', 0, 1.38, -0.42, 0.13).rotation.x = Math.PI / 2; box(rig, 0.3, 0.22, 0.04, lit('#5fb0ff', 0.8), 0, 1.4, 0.32);
  const tally = soft(ball(rig, 0.03, lamp('#ff3b3b', 4), 0.1, 1.56, -0.3));
  rod(root, [-1.9, 4.3, 0.4], [-0.3, 3.0, 0.15], 0.012, '#59616f'); ball(root, 0.07, '#59616f', -0.26, 2.96, 0.14).scale.set(1.6, 1, 1);
  panel(root, 0.9, 0.3, smat(signTex('onair', 300, 100, '#2a0a0c', '#ff5a5a', [['ON AIR', 72]], {border: '#ff5a5a', glow: '#ff3b3b'}), 1.7), -2.2, 3.9, -2.58);
  const jensen = actor(root, JENSEN, {
    a: {expr: 'smile', mode: 'sit', pose: 'desk'}, b: {expr: 'relief_open', mode: 'sit', pose: 'desk'}, shrug: {expr: 'relief_open', mode: 'sit', pose: 'shrug'}, shrug2: {expr: 'smile_closed', mode: 'sit', pose: 'shrug'},
  }, 0, 0.42, 0.12, {scale: 1.2, res: 1.2, shadow: 0});
  return {
    light: () => ({...LIGHT.room, amb: 1.25, keyI: 1.2}),
    tick: ({f, cam}) => {
      const big = f >= W(87) - 2, talk = Math.floor(f / 4) % 2 === 0;
      jensen.show(big ? (talk ? 'shrug' : 'shrug2') : talk ? 'a' : 'b');
      jensen.node.position.y = 0.42 + hop(f, W(87) - 2, 0.1, 8); jensen.tick(f, cam);
      tally.visible = f % 24 < 16;
    },
  };
};

// ------------------------------------------------------------------ open-plan office: the email lands
export const office: Builder = (root) => {
  backdrop(root, ['#bfe0ff', '#eef6ff']);
  floor(root, 14, 14, tmat(tiled(grainTex('carpet', '#5f7386', 0.14), 7, 7)), 0, 0, -1);
  box(root, 14, 4.2, 0.2, '#e6eaf0', 0, 2.1, -5.6);
  for (const x of [-2.2, 0, 2.2]) { panel(root, 1.8, 1.5, smat(skylineTex('day', '#74bcff', '#dff1ff', '#8aa0b8', '#eaf6ff', 21), 1.0), x, 2.4, -5.48); for (const y of [1.62, 3.18]) box(root, 1.94, 0.08, 0.1, '#aab4c0', x, y, -5.46); box(root, 0.06, 1.5, 0.1, '#aab4c0', x, 2.4, -5.46); }
  box(root, 14, 0.2, 14, '#f3f5f8', 0, 4.3, -1); for (const z of [0.6, -1.6, -3.8]) for (const x of [-1.1, 1.1]) box(root, 1.2, 0.04, 0.36, lit('#ffffff', 1.8), x, 4.19, z);
  panel(root, 1.5, 0.5, smat(tex('office-logo', 300, 100, (g) => { g.fillStyle = '#e6eaf0'; g.fillRect(0, 0, 300, 100); rrect(g, 14, 18, 64, 64, 10); g.fillStyle = '#76b900'; g.fill(); g.fillStyle = '#e6eaf0'; g.fillRect(32, 36, 28, 28); text(g, 'CHIP CO.', 184, 52, 50, '#3b4252'); }), 1), 0, 3.72, -5.47);
  plant(root, -1.9, -5.0, 1.2); plant(root, 1.95, -5.0, 1.0);
  const mail = tex('mail', 220, 190, (g) => {
    rrect(g, 10, 30, 180, 130, 22); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#241726'; g.stroke();
    g.fillStyle = '#ffd43b'; g.fillRect(40, 62, 120, 78); g.lineWidth = 7; g.strokeRect(40, 62, 120, 78); g.beginPath(); g.moveTo(40, 62); g.lineTo(100, 108); g.lineTo(160, 62); g.stroke();
    g.fillStyle = '#e2453c'; g.beginPath(); g.arc(178, 40, 30, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); text(g, '1', 178, 43, 40, '#ffffff');
  });
  const desks: {staff: ReturnType<typeof actor>; bubble: THREE.Mesh; at: number}[] = [];
  [-0.3, -2.1, -3.9].forEach((z, r) => [-1, 1].forEach((side, c) => {
    const i = r * 2 + c, x = side * 0.8, sx = side * 0.46;
    box(root, 1.34, 0.06, 0.74, '#f6f4ee', x, 0.76, z); box(root, 1.34, 0.46, 0.03, '#d3dae4', x, 0.5, z + 0.34);       // desk and its front panel
    for (const dx of [-0.63, 0.63]) box(root, 0.05, 0.74, 0.7, '#c9ced6', x + dx, 0.37, z);
    box(root, 0.44, 0.02, 0.3, '#c9ced6', sx, 0.8, z + 0.02); const lid = box(root, 0.44, 0.3, 0.02, '#c9ced6', sx, 0.94, z + 0.2); lid.rotation.x = 0.22;   // laptop
    soft(ball(root, 0.03, lit('#ffffff', 1.5), sx, 0.95, z + 0.225));
    mug(root, x + side * 0.42, 0.79, z + 0.1, ['#e2453c', '#3f8fd0', '#ffd43b'][i % 3]);
    box(root, 0.24, 0.014, 0.32, '#fffdf4', x + side * 0.36, 0.797, z - 0.12).rotation.y = side * 0.3;
    if (i % 2) for (let k = 0; k < 3; k++) box(root, 0.08, 0.3, 0.24, ['#3f8fd0', '#e2453c', '#3f9b43'][k], x + side * 0.5 + (k - 1) * 0.09, 0.94, z - 0.2);
    officeChair(root, sx, z - 0.88, '#2b2f3a');
    const staff = actor(root, STAFF(i), {work: {expr: 'neutral', pose: 'desk'}, shock: {expr: 'shock', pose: 'panic'}, read: {expr: 'shock', pose: 'desk'}}, sx, -0.22, z - 0.6, {scale: 1.0, res: r === 0 ? 1.2 : 0.8, shadow: 0});
    const bubble = card(root, 0.56, 0.48, mail, sx + side * 0.1, 1.86, z - 0.55, 1.15);
    desks.push({staff, bubble, at: W(92) + [0, 3, 6, 8, 10, 12][i]});
  }));
  return {
    light: () => ({...LIGHT.room, amb: 1.7, keyI: 1.2}),
    tick: ({f, cam, shot}) => {
      desks.forEach((d, i) => {
        const email = shot.v === 'email', k = email ? 0 : pop(f, d.at, 8);
        d.bubble.visible = k > 0.01; d.bubble.scale.setScalar(Math.max(0.001, k)); d.bubble.rotation.z = 0.12 * Math.sin(f * 0.25 + i); d.bubble.position.y = 1.86 + 0.05 * Math.sin(f * 0.2 + i);
        d.staff.show(email ? (i === 1 ? 'shock' : 'read') : f >= d.at + 3 ? 'shock' : 'work');
        d.staff.node.position.y = -0.22 + (email ? 0 : hop(f, d.at + 3, 0.2, 9));
        d.staff.tick(f, cam);
      });
    },
  };
};

// ------------------------------------------------------------------ trading floor: the cliff
export const trading: Builder = (root) => {
  backdrop(root, ['#050810', '#101830']);
  floor(root, 14, 12, tmat(tiled(tileTex('trade', '#1c2233', '#12172a', 2), 7, 6)));
  box(root, 10, 6.4, 0.3, '#0e1220', 0, 3.2, -3.1);
  const chart = tex('chart', 1024, 624, (g, w, h) => {
    g.fillStyle = '#070b14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1b2742'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 52) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const r = rng(5), pts: [number, number][] = []; let y = 420;
    for (let x = 330; x <= 560; x += 12) { y += (r() - 0.62) * 28; pts.push([x, y]); }
    const top = pts[pts.length - 1];
    g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#3fe07a'; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    const fall: [number, number][] = [top, [578, top[1] + 60], [590, top[1] + 40], [612, 470], [628, 450], [652, 540], [690, 570]];
    g.fillStyle = 'rgba(255,60,70,.22)'; g.beginPath(); fall.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineTo(690, h); g.lineTo(top[0], h); g.fill();
    g.strokeStyle = '#ff3b47'; g.lineWidth = 10; g.beginPath(); fall.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    text(g, 'NVDA', 512, 84, 110, '#ffffff', {spacing: 6}); text(g, '▼ 4.3%', 512, 196, 92, '#ff3b47');
  });
  box(root, 6.3, 4.0, 0.14, '#05070c', 0, 3.25, -2.92); panel(root, 6.0, 3.66, smat(chart, 1.15), 0, 3.25, -2.83);
  const tick = tex('ticker', 1024, 64, (g) => { g.fillStyle = '#12060a'; g.fillRect(0, 0, 1024, 64); for (let i = 0; i < 4; i++) text(g, 'NVDA ▼ 4.3%', 128 + i * 256, 34, 38, '#ff5a64'); }, true);
  const band = panel(root, 6.3, 0.4, smat(tick, 1.4), 0, 5.5, -2.8);
  for (const x of [-3.6, 3.6]) { box(root, 0.5, 6.4, 0.5, '#161b2c', x, 3.2, -2.6); soft(ball(root, 0.16, lit('#ff3b47', 3), x, 4.6, -2.3)); }
  const alarms = [-3.6, 3.6].map((x) => { const b = beam(root, 0.1, 1.4, 6, '#ff3b47', 0.08, x, 4.6, -2.3); b.rotation.x = -Math.PI / 2; return b; });
  const red = lamp('#ff5a64', 1.2);
  for (const x of [-2.1, 0, 2.1]) {                                                                // desks with banks of screens behind the traders
    box(root, 1.8, 0.06, 0.8, '#2a3146', x, 0.9, -1.5); box(root, 1.7, 0.86, 0.7, '#1c2233', x, 0.44, -1.5);
    for (const dx of [-0.55, 0, 0.55]) monitor(root, x + dx, 0.93, -1.6, 0.46, 0.3, red);
    box(root, 0.4, 0.03, 0.14, '#0d0f15', x, 0.95, -1.25);
  }
  const traders = [
    actor(root, TRADER(0), {calm: {expr: 'neutral'}, panic: {expr: 'pained', pose: 'panic'}}, -0.85, 0, 0.1, {scale: 1.15, res: 1.0}),
    actor(root, TRADER(1), {calm: {expr: 'smile'}, panic: {expr: 'shock', pose: 'panic'}}, 0.02, 0, -0.35, {scale: 1.15, res: 1.0}),
    actor(root, TRADER(2), {calm: {expr: 'neutral', pose: 'phone', prop: 'phone'}, panic: {expr: 'dazed', pose: 'shrug'}}, 0.9, 0, 0.15, {scale: 1.15, res: 1.0}),
    actor(root, TRADER(3), {calm: {expr: 'neutral'}, panic: {expr: 'shock', pose: 'panic'}}, -1.75, 0, -0.8, {scale: 1.1}),
    actor(root, TRADER(4), {calm: {expr: 'neutral'}, panic: {expr: 'pained', pose: 'panic'}}, 1.8, 0, -0.9, {scale: 1.1}),
  ];
  traders.forEach((t) => t.tint('#ecdcdc'));
  const q = rng(41), papers = Array.from({length: 18}, () => { const m = box(root, 0.2, 0.26, 0.004, '#f6f4ee', 0, 0, 0); m.userData = {x: (q() - 0.5) * 5, z: (q() - 0.5) * 2.4, p: q() * 90, s: 0.03 + q() * 0.02}; return m; });
  // the arrow that stabs the floor in front of them
  const arrow = grp(root, 0.42, 0, 0.8); arrow.scale.setScalar(0.85);
  slab(arrow, [[-0.32, 2.4], [0.32, 2.4], [0.32, 0.9], [0.8, 0.9], [0, 0], [-0.8, 0.9], [-0.32, 0.9]], 0.3, lit('#ff3b47', 1.5), 0, 0, 0);
  const cracks = grp(root, 0.42, 0.012, 0.8);
  for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.2, len = 0.5 + (i % 3) * 0.3, c = box(cracks, len, 0.01, 0.05, '#05070c', Math.cos(a) * len / 2, 0, Math.sin(a) * len / 2); c.rotation.y = -a; }
  return {
    light: () => ({...LIGHT.dark, amb: 1.0, sky: '#ffc0c0', ground: '#4a3050'}),
    tick: ({f, cam, shot}) => {
      const hit = W(105), panic = f >= hit || shot.v !== 'wide';
      (band.material as THREE.MeshBasicMaterial).map!.offset.x = f * 0.006;
      red.color.set('#ff5a64').multiplyScalar(panic ? (f % 8 < 4 ? 1.9 : 0.7) : 0.9);
      alarms.forEach((b, i) => { b.visible = panic; b.rotation.y = f * 0.2 + i * Math.PI; });
      traders.forEach((t, i) => { t.show(panic ? 'panic' : 'calm'); t.node.position.y = hop(f, hit + i * 2, 0.26, 9) + (panic ? 0.03 * Math.abs(Math.sin(f * 0.5 + i)) : 0); t.tick(f, cam); });
      papers.forEach((m) => { const u = ((f - hit) * m.userData.s + m.userData.p * 0.05) % 1; m.visible = panic; m.position.set(m.userData.x + 0.4 * Math.sin(f * 0.07 + m.userData.p), 4.2 - u * 4.2, m.userData.z); m.rotation.set(f * 0.11 + m.userData.p, f * 0.07, f * 0.13 + m.userData.p); });
      const land = shot.at + 6, on = shot.v === 'arrow';
      arrow.visible = on; cracks.visible = on && f >= land;
      arrow.position.y = on ? 7 * (1 - smooth(f, shot.at - 1, land)) - 0.12 : 0; arrow.rotation.z = on ? 0.1 + shake(f, land, 0.16, 16) : 0;
      if (on) traders.forEach((t, i) => { t.node.position.y = hop(f, land + i, 0.34, 10); });
    },
  };
};
export {woodTex, cyl};
