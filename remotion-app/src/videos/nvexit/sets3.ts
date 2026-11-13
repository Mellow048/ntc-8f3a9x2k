// Sets of the Nvidia exit short, part 3: board, chart, release, podium, stage and copier.
import * as THREE from 'three';
import {backdrop, ball, box, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, smat, smooth, soft, tex, text, tiled, tmat, torus, woodTex, type G2, type V} from './kit';
import {actor, ATTORNEY, BOARD, JENSEN, SPOKESMAN} from './cast';
import {flagPole, flagUS, halo, lectern, person, signTex} from './props';
import {ghost, glass, hash, INK, LIGHT, op, type Builder} from './sets';
import {bust} from './sets2';
import {W} from './story';

const frac = (x: number) => x - Math.floor(x);

// ------------------------------------------------------------------ board: the directors keep him, for now
export const board: Builder = (root) => {
  backdrop(root, ['#2a2018', '#4a382a']);
  floor(root, 14, 12, tmat(tiled(grainTex('board-carpet', '#3a4458', 0.08), 5, 5)));
  panel(root, 12, 6, tmat(tiled(woodTex('board-wall', '#7a5a3c', '#4a3220'), 3, 2)), 0, 3, -3.3);
  box(root, 2.5, 1.3, 0.06, '#15121c', 0, 2.5, -3.24); soft(panel(root, 2.36, 1.16, lit('#16301e', 1), 0, 2.5, -3.2)); box(root, 2.36, 0.06, 0.02, lit('#76b900', 1.3), 0, 2.0, -3.18).castShadow = false;
  // the table runs away from us; two sit on each side and one at its head
  box(root, 1.0, 0.08, 3.5, '#4a3626', 0, 0.76, -0.9); box(root, 0.7, 0.7, 3.1, '#3a2a1e', 0, 0.36, -0.9);
  const SEATS: V[] = [[-0.72, 0.5, 0.15], [0.72, 0.5, 0.15], [-0.74, 0.5, -1.3], [0.74, 0.5, -1.3], [0, 0.5, -2.75]];
  const who = SEATS.map(([x, y, z], i) => actor(root, BOARD(i), {a: {expr: i % 2 ? 'neutral' : 'stern', pose: 'desk', mode: 'sit'}, b: {expr: 'stern', pose: 'think', mode: 'sit'}}, x, y, z, {scale: 1.0, res: 1.1, shadow: 0}));
  for (const [x, z] of [[-0.25, 0.1], [0.22, -0.2], [-0.2, -1.2], [0.24, -1.5], [0, -2.2]]) { const s = panel(root, 0.26, 0.34, lit('#fffdf4', 1), x, 0.805, z); s.rotation.x = -Math.PI / 2; s.rotation.z = (hash(Math.round(z * 10)) - 0.5) * 0.8; }
  for (const [x, z] of [[0.3, 0.3], [-0.3, -0.7], [0.3, -1.0], [-0.28, -2.0]]) cyl(root, 0.035, 0.11, glass('#cfe9f6', 0.55), x, 0.855, z).castShadow = false;
  return {
    light: () => LIGHT.warm,
    tick: ({f, cam}) => { const S = W(144); who.forEach((p, i) => { p.show(f >= S + i * 2 && i % 2 === 0 ? 'b' : 'a'); p.node.position.y = 0.5 + hop(f, S + i * 2, 0.04, 7); p.tick(f, cam); }); },
  };
};

// ------------------------------------------------------------------ chart: an executive who reported to him (never drawn)
const boxTex = (key: string, draw: (g: G2, w: number, h: number) => void, bg: string, w = 340, h = 300) => tex('chart-' + key, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); });
export const chart: Builder = (root) => {
  backdrop(root, ['#101826', '#22304a']);
  panel(root, 12, 8, tmat(tiled(grainTex('chart-wall', '#1c2638', 0.05), 5, 3)), 0, 3, -0.4); floor(root, 12, 8, '#141c2c', 0, 0, 3.4);
  const TOP = 2.56, ROW = 1.42, XS = [-0.76, 0, 0.76], white = lit('#dfe6f2', 1), HOT = 2, BAR = 1.94;
  soft(panel(root, 0.9, 0.795, smat(boxTex('ceo', (g, w, h) => { bust(g, JENSEN(0), {expr: 'neutral'}, 78, 22, 184, 206, '#cfe3d0'); g.fillStyle = '#76b900'; g.fillRect(5, 236, w - 10, h - 241); text(g, 'CEO', w / 2, 270, 54, '#ffffff'); }, '#fffdf4', 340, 300), 1.0), 0, TOP, -0.36));
  XS.forEach((x, i) => soft(panel(root, 0.68, 0.6, smat(i === HOT ? boxTex('hot', (g, w, h) => { ghost(g, w / 2, 150, 210); text(g, '?', w / 2, 94, 78, '#ffffff'); }, '#2b2f3a') : boxTex('exec' + i, (g, w, h) => person(g, w / 2, 150, 150, '#aeb8cc'), '#e6eaf2'), 1.0), x, ROW, -0.36)));
  box(root, 0.03, TOP - 0.4 - BAR, 0.01, white, 0, (TOP - 0.4 + BAR) / 2, -0.37).castShadow = false; box(root, 1.55, 0.03, 0.01, white, 0, BAR, -0.37).castShadow = false; for (const x of XS) box(root, 0.03, BAR - ROW - 0.3, 0.01, white, x, (BAR + ROW + 0.3) / 2, -0.37).castShadow = false;
  // the line from that box up to his: who answered to whom
  const yel = lit('#ffe14a', 1.25), segs: [V, V][] = [[[XS[HOT], ROW + 0.3, -0.35], [XS[HOT], BAR, -0.35]], [[XS[HOT], BAR, -0.35], [0, BAR, -0.35]], [[0, BAR, -0.35], [0, TOP - 0.47, -0.35]]];
  const line = segs.map(([a, b]) => { const o = rod(root, a, b, 0.022, yel); o.castShadow = false; return {o, a: new THREE.Vector3(...a), b: new THREE.Vector3(...b)}; });
  const tip = cone(root, 0.07, 0.13, yel, 0, TOP - 0.455, -0.35, 12); tip.castShadow = false;
  const ringM = glass('#ffe14a', 0, 1.2), ring = soft(mesh(root, new THREE.RingGeometry(0.47, 0.51, 4, 1, Math.PI / 4), ringM, XS[HOT], ROW, -0.34)); ring.scale.set(1.06, 0.95, 1);
  return {
    light: () => LIGHT.show,
    tick: ({f}) => {
      const S = W(157) - 2, u = smooth(f, S, S + 14) * 3;
      line.forEach(({o, a, b}, i) => { const k = Math.min(1, Math.max(0, u - i)); o.visible = k > 0.02; const e = a.clone().lerp(b, k), d = e.clone().sub(a); o.position.copy(a).addScaledVector(d, 0.5); o.scale.y = Math.max(0.001, k); });
      tip.visible = u >= 2.9; tip.scale.setScalar(pop(f, S + 13, 5));
      ringM.opacity = 0.55 + 0.4 * Math.sin(f * 0.35);
    },
  };
};

// ------------------------------------------------------------------ release: the statement, and what is not in it
const BULLETS = ['Jensen Huang Resigns', 'Colette Kress, Executive Vice President and', 'Chief Financial Officer, Appointed Interim CEO', 'Harvey C. Jones Appointed First-Ever Chair', 'of the Board'];
const releaseTex = () => tex('release-sheet', 760, 980, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#76b900'; g.fillRect(0, 0, w, 26);
  const L = {font: 'Montserrat', align: 'left'} as const;
  text(g, 'PRESS RELEASE · NOVEMBER 12, 2026', 56, 96, 27, '#5a6072', {...L, weight: 700});
  text(g, 'NVIDIA Announces CEO Transition', 56, 160, 46, INK, {...L, weight: 900, maxWidth: w - 112});
  let y = 244; BULLETS.forEach((t, i) => { const first = i === 0 || i === 1 || i === 3; if (first && i) y += 18; if (first) { g.fillStyle = '#76b900'; g.beginPath(); g.arc(70, y, 9, 0, 7); g.fill(); } text(g, t, 98, y, 30, INK, {...L, weight: 700, maxWidth: w - 150}); y += 42; });
  const r = rng(3); g.fillStyle = '#c2c7d0'; for (let yy = 520; yy < h - 50; yy += 33) g.fillRect(56, yy, ((yy - 520) % 165 > 120 ? 0.5 : 0.8 + r() * 0.06) * (w - 112), 12);
  g.strokeStyle = '#b9bec8'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
});
export const release: Builder = (root) => {
  backdrop(root, ['#1c2230', '#3a4458']);
  const SW = 1.75, SH = 2.26, SY = 1.62;
  halo(root, 3.4, '#cfe6ff', 0.14, 0, SY, -0.6); box(root, SW + 0.02, SH + 0.02, 0.012, '#aeb7c3', 0.03, SY - 0.03, -0.02); soft(panel(root, SW, SH, smat(releaseTex(), 1.0), 0, SY, 0));
  // a magnifying glass goes down the page and finds no reason
  const lens = grp(root, 0, 1.2, 0.08); torus(lens, 0.2, 0.026, '#15121c', 0, 0, 0); soft(mesh(lens, new THREE.CircleGeometry(0.19, 32), glass('#cfe9ff', 0.35, 1.1), 0, 0, -0.005)); rod(lens, [0.15, -0.15, 0], [0.34, -0.36, 0], 0.03, '#5a3e28');
  const q = soft(panel(lens, 0.3, 0.3, smat(tex('release-q', 128, 128, (g) => text(g, '?', 64, 70, 120, '#e3342f', {stroke: '#ffffff', sw: 12})), 1.1, true), 0, 0, 0.01));
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      const a = shot.at, S = W(169) - 2, u = smooth(f, a + 3, S), rows = 3.4, t = u * rows, row = Math.min(rows - 0.4, t), side = Math.floor(t) % 2 ? -1 : 1;
      const rest = smooth(f, S - 4, S + 2); lens.position.set(lerp(side * lerp(-0.45, 0.45, t - Math.floor(t)), 0.05, rest), lerp(1.47 - row * 0.115, 1.2, rest), 0.08); lens.scale.setScalar(pop(f, a + 1, 6) * (1 + 0.25 * smooth(f, S, S + 6)));
      q.visible = f >= S; q.scale.setScalar(pop(f, S, 6));
    },
  };
};

// ------------------------------------------------------------------ podium: Beijing's answer, and the Justice Department's
const star = (g: G2, x: number, y: number, r: number, rot = -Math.PI / 2) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.closePath(); g.fill(); };
const flagCN = () => tex('flag-cn', 400, 267, (g, w, h) => { g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffde00'; star(g, 67, 67, 40); for (const [x, y] of [[133, 27], [160, 53], [160, 93], [133, 120]]) star(g, x, y, 13, Math.atan2(67 - y, 67 - x)); });
export const podium: Builder = (root) => {
  const RISE = 0.24;
  backdrop(root, ['#15121c', '#2b2733']);
  floor(root, 14, 12, tmat(tiled(grainTex('pod-carpet', '#4a4f5c', 0.08), 5, 5)));
  const red = grp(root), blue = grp(root);
  box(root, 12, RISE, 1.3, '#3a3f4a', 0, RISE / 2, -0.55); box(root, 12, 0.03, 0.03, '#6f7684', 0, RISE, 0.1);
  panel(red, 12, 6, tmat(tiled(foldTex('pod-red', '#9a1826', '#5a0a14', 10), 2.4, 1)), 0, 3, -1.6); panel(blue, 12, 6, tmat(tiled(foldTex('pod-blue', '#1f3f86', '#122650', 10), 2.4, 1)), 0, 3, -1.6);
  lectern(red, 0, 0.3, '#5a3a22', signTex('pod-cn', 580, 210, '#8a1420', '#ffde6a', [['MINISTRY OF', 74, 0.32], ['FOREIGN AFFAIRS', 74, 0.72]], {border: '#ffde6a'}));
  lectern(blue, 0, 0.3, '#6b4a30', signTex('pod-us', 580, 210, '#16223c', '#ffffff', [['DEPARTMENT', 78, 0.32], ['OF JUSTICE', 78, 0.72]], {border: '#c9a23a'}));
  flagPole(red, 1.0, -0.9, flagCN(), {h: 2.2, w: 0.62, left: true}); flagPole(blue, -1.1, -0.9, flagUS(), {h: 2.2, w: 0.62});
  const cn = actor(red, SPOKESMAN, {a: {expr: 'stern', pose: 'desk'}, b: {expr: 'stern', pose: 'point'}}, 0, RISE, -0.2, {scale: 1.0, res: 1.2, wide: true, shadow: 0});
  const us = actor(blue, ATTORNEY, {a: {expr: 'neutral', pose: 'desk'}, b: {expr: 'neutral', pose: 'shrug'}}, 0, RISE, -0.2, {scale: 1.0, res: 1.3, wide: true, shadow: 0});
  return {
    light: (v) => v === 'china' ? {...LIGHT.room, key: '#ffe6d0'} : LIGHT.cold,
    tick: ({f, cam, shot}) => {
      const china = shot.v === 'china'; red.visible = china; blue.visible = !china;
      cn.show(f >= W(175) ? 'b' : 'a'); cn.node.position.y = RISE + hop(f, W(175), 0.06, 8); cn.tick(f, cam);
      us.show(f >= W(185) - 1 ? 'b' : 'a'); us.node.position.y = RISE + hop(f, W(185) - 1, 0.06, 8); us.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ stage: what he says about it
export const stage: Builder = (root) => {
  backdrop(root, ['#33423f', '#8ea39d']);
  floor(root, 18, 18, '#8ea39d'); halo(root, 3.0, '#e8fff6', 0.22, 0, 1.7, -1.4); pool(root, 1.4, '#e8fff6', 0.25, 0, 0.1);
  const me = actor(root, JENSEN(0), {a: {expr: 'stern'}, b: {expr: 'nervous', pose: 'shrug'}}, 0, 0, 0, {scale: 1.0, res: 1.3, wide: true});
  return {
    light: () => LIGHT.room,
    tick: ({f, cam}) => { const S = W(189) - 1; me.show(f >= S ? 'b' : 'a'); me.node.position.y = hop(f, S, 0.06, 8); me.tick(f, cam); },
  };
};

// ------------------------------------------------------------------ copier: "impossible to replicate"
const scribble = (i: number) => tex('copier-sheet-' + i, 300, 400, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); const r = rng(7 + i * 13);
  g.strokeStyle = '#3a3f4a'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2, rad = 80 + (r() - 0.5) * 30, x = w / 2 + rad * Math.cos(a), y = 150 + rad * 1.05 * Math.sin(a); if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(52, 384); g.quadraticCurveTo(50 + r() * 40, 262, w / 2, 256 + r() * 16); g.quadraticCurveTo(w - 50 - r() * 40, 262, w - 52, 384); g.stroke();
  text(g, '?', w / 2, 160, 130, '#e3342f'); g.strokeStyle = INK; g.lineWidth = 7; g.strokeRect(3, 3, w - 6, h - 6);
});
export const copier: Builder = (root) => {
  backdrop(root, ['#cfd8e0', '#aab6c2']);
  floor(root, 14, 12, tmat(tiled(grainTex('copier-carpet', '#5f6d80', 0.08), 6, 5)));
  panel(root, 12, 6, tmat(tiled(grainTex('copier-wall', '#e4e9ee', 0.04), 5, 3)), 0, 3, -1.5); box(root, 12, 0.12, 0.05, '#aab6c2', 0, 0.06, -1.46);
  // the machine
  const CX = 0.45, mc = grp(root, CX, 0, 0);
  box(mc, 1.0, 0.86, 0.72, '#d9dde4', 0, 0.43, 0); box(mc, 1.02, 0.12, 0.74, '#b8bec8', 0, 0.92, 0); box(mc, 0.9, 0.2, 0.02, '#8f96a8', 0, 0.3, 0.365); box(mc, 0.9, 0.2, 0.02, '#8f96a8', 0, 0.06 + 0.02, 0.365);
  box(mc, 0.7, 0.035, 0.03, '#22202a', 0, 0.62, 0.37); box(mc, 0.76, 0.02, 0.22, '#b8bec8', 0, 0.585, 0.47).rotation.x = 0.2;
  const lid = grp(mc, 0, 0.98, -0.34); box(lid, 0.98, 0.05, 0.68, '#8f96a8', 0, 0.025, 0.34);
  box(mc, 0.3, 0.03, 0.16, '#22202a', 0.3, 0.995, 0.3); const led = ball(mc, 0.022, lamp('#3fe06a', 1.6), 0.2, 1.02, 0.32); led.castShadow = false;
  const scanM = lamp('#7dff9a', 1.8), scan = box(mc, 0.92, 0.02, 0.05, scanM, 0, 0.985, 0); scan.castShadow = false; const scanGlow = halo(root, 0.9, '#7dff9a', 0, CX, 1.0, 0.45);
  const sheets = Array.from({length: 7}, (_, i) => soft(mesh(root, new THREE.PlaneGeometry(0.33, 0.44), new THREE.MeshBasicMaterial({map: scribble(i % 3), side: THREE.DoubleSide}), 0, 0, 0)));
  const JX = -0.55, me = actor(root, JENSEN(0), {a: {expr: 'neutral', pose: 'cross'}, b: {expr: 'smile', pose: 'cross'}}, JX, 0, 0.3, {scale: 1.0, res: 1.2, wide: true});
  // the machine reads him: a bar of green light goes down him and up again
  const beamM = glass('#7dff9a', 0.8, 1.5), bar = soft(panel(root, 0.7, 0.03, beamM, JX, 1.0, 0.46)), glowM = glass('#7dff9a', 0.16, 1.2), glow = soft(panel(root, 0.76, 0.22, glowM, JX, 1.0, 0.455));
  const OUT: V = [CX, 0.64, 0.44], LAND: V[] = [[0.0, 0.012, 1.3], [0.62, 0.014, 1.6], [-0.3, 0.016, 1.8], [0.36, 0.018, 2.1], [0.95, 0.02, 1.25], [0.02, 0.022, 2.45]];
  return {
    light: () => LIGHT.cold,
    tick: ({f, cam}) => {
      const A = W(219) - 2, P = W(225) - 2, scanning = f < P;
      const sw = 0.5 + 0.5 * Math.sin((f - A) * 0.3); scan.position.z = lerp(-0.3, 0.3, sw); scan.visible = f < P + 60; lid.rotation.x = -0.22; op(scanGlow, 0.16 + 0.1 * sw);
      const by = lerp(1.76, 0.12, 0.5 - 0.5 * Math.cos((f - A) * 0.21)); bar.visible = glow.visible = scanning; bar.position.y = glow.position.y = by; beamM.opacity = 0.7 + 0.25 * Math.sin(f * 0.9);
      me.show(f >= P + 20 ? 'b' : 'a'); me.tick(f, cam);
      // sheet after sheet: each a scribble with a question mark; the first comes up to be read, the rest land on the floor in front
      sheets.forEach((q, i) => {
        const t0 = P + i * 7, u = Math.min(1, Math.max(0, (f - t0) / (i ? 20 : 12))), e = 1 - (1 - u) ** 2;
        q.visible = f >= t0;
        if (i === 0) { q.position.set(lerp(OUT[0], 0.0, e), lerp(OUT[1], 1.56, e), lerp(OUT[2], 1.0, e)); q.rotation.set(0, 0, lerp(1.2, -0.06, e) + 0.03 * Math.sin(f * 0.1)); q.scale.setScalar(lerp(0.4, 1.5, e)); }
        else { const to = LAND[i - 1]; q.position.set(lerp(OUT[0], to[0], u), lerp(OUT[1], to[1], u * u) + 0.6 * Math.sin(Math.PI * u) * (1 - 0.3 * u), lerp(OUT[2], to[2], u)); q.rotation.set(-Math.PI / 2 * e, 0, (hash(i, 2) - 0.5) * 2.4 * e + (1 - u) * 3); q.scale.setScalar(0.6 + 0.4 * e); }
      });
    },
  };
};
