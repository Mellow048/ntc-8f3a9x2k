// Sets of the Binance heist short, part 1: the vault, the tower, the chart of records, the ice.
// Each builder fills a group once and returns a tick that poses it for a frame (motion is a pure function of the frame
// number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, box, clamp01, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus,
  type Node, type V} from './kit';
import {actor, USER} from './cast';
import {coin, coinStack, coinStream, GOLD, glints, iceBlock, level, signTex, streetLamp, wallClock} from './props';
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

// ------------------------------------------------------------------ things several sets share
/** a ragged hole: the way out that should not be there */
export function breach(p: Node, x: number, y: number, z: number, R: number) {
  const g = grp(p, x, y, z);
  const jag = (r0: number) => { const q = rng(3), s = new THREE.Shape(); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, rr = r0 * (i % 2 ? 0.74 + q() * 0.1 : 1.0 + q() * 0.18); if (i) s.lineTo(rr * Math.cos(a), rr * Math.sin(a)); else s.moveTo(rr * Math.cos(a), rr * Math.sin(a)); } s.closePath(); return new THREE.ShapeGeometry(s); };
  const rim = lamp('#35e0d0', 1.7);
  soft(mesh(g, jag(R), rim)); soft(mesh(g, jag(R * 0.8), lit('#04070a', 1), 0, 0, 0.004));
  const eyes = [-1, 1].map((s) => { const e = soft(mesh(g, new THREE.CircleGeometry(R * 0.11, 16), lit('#ffd76a', 1.5), s * R * 0.22, R * 0.04, 0.008)); e.scale.y = 1.5; return e; });
  return {g, set(f: number, open: number, watch = true) {
    g.visible = open > 0.01; g.scale.setScalar(Math.max(0.01, open)); g.rotation.z = 0.05 * Math.sin(f * 0.06);
    rim.color.set('#35e0d0').multiplyScalar(1.45 + 0.3 * Math.sin(f * 0.13));
    eyes.forEach((e) => { e.visible = watch && (f + 40) % 83 > 3; });
  }};
}
/** letters with a dark edge on nothing: labels that stand in the set */
export const label = (key: string, w: number, h: number, lines: [string, number, number, string?, ('Anton' | 'Montserrat')?][]) => tex('label-' + key, w, h, (g) => {
  for (const [s, size, y, col, font] of lines) text(g, s, w / 2, y * h, size, col ?? '#ffffff', {font: font ?? 'Anton', stroke: '#15121c', sw: size * 0.22, maxWidth: w * 0.94});
});

// ------------------------------------------------------------------ the vault: where the crypto sits
export const vault: Builder = (root) => {
  backdrop(root, ['#0a111e', '#1a2740']);
  floor(root, 14, 12, tmat(tiled(tileTex('vault', '#3a4557', '#2a3344', 2, '#414d61'), 7, 6)));
  const drawers = tex('drawers', 128, 128, (g) => {                                                    // a wall of deposit boxes
    g.fillStyle = '#4a586e'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#5c6c84'; g.fillRect(6, 6, 116, 116); g.strokeStyle = '#2b3546'; g.lineWidth = 5; g.strokeRect(6, 6, 116, 116);
    g.fillStyle = '#c9a84a'; g.beginPath(); g.arc(64, 78, 9, 0, 7); g.fill(); g.fillStyle = '#2b3546'; g.fillRect(44, 34, 40, 12);
  }, true);
  box(root, 9, 5.8, 0.3, tmat(tiled(drawers, 14, 9)), 0, 2.9, -2.4);
  for (const x of [-2.25, 2.25]) box(root, 0.5, 5.8, 0.5, '#566277', x, 2.9, -2.0);
  box(root, 3.0, 0.16, 2.0, '#232a38', 0, 0.08, -0.85); box(root, 3.06, 0.04, 2.06, '#8a6f2a', 0, 0.02, -0.85);
  const r = rng(11), stacks: {m: THREE.Mesh; a: number; top: V}[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const n = [20, 13, 6][row] + Math.round(r() * 5), x = -1.1 + col * 0.44 + (row % 2) * 0.08, z = -1.45 + row * 0.5;
    stacks.push({m: coinStack(root, x, 0.16, z, n, 0.19), a: r(), top: [x, 0.16 + n * 0.057, z]});
  }
  const twinkle = glints(root, stacks.filter((_, i) => i % 2 === 0).map((s) => [s.top[0] + 0.1, s.top[1] + 0.06, s.top[2] + 0.2] as V));
  const HOLE: V = [0.6, 2.1, -2.235];
  const hole = breach(root, ...HOLE, 0.42), halo = pool(root, 0.95, '#35e0d0', 0.26, HOLE[0], -2.225, HOLE[1]); halo.rotation.x = 0;
  const clock = wallClock(root, -0.56, 2.1, -2.2, 0.38);
  const stream = coinStream(root, 56, 0.09), last = coin(root, 0.14);
  const alarm = pool(root, 3.2, '#ff3b2a', 0, 0, -0.6, 0.2);
  return {
    light: (v) => v === 'wallets' || v === 'clock' ? {...LIGHT.dark, sky: '#cfd8ff', amb: 1.2, key: '#ffe9b8', keyI: 1.25} : {...LIGHT.dark, sky: '#b8c6ff', amb: 1.0, key: '#ffe2a8', keyI: 1.05},
    tick: ({f, t, shot}) => {
      const v = shot.v;
      let d = 0, f0 = 1e9, f1 = -1e9, hrs = 20, min = 5, from = -1, open = 0, red = 0;
      if (v === 'drain') { d = 0.8 * smooth(f, 4, 56); f0 = 0; f1 = 52; open = 1; red = 0.2; }
      else if (v === 'gone') { const k = smooth(f, W(152), W(161) + 8); d = 0.9 * k; f0 = W(152) - 3; f1 = W(161) + 2; min = 5 + 20 * smooth(f, W(152), W(161)); from = 5; open = pop(f, shot.at, 7); red = 0.22 * k; }
      else if (v === 'last') {
        d = 0.9 + 0.1 * smooth(t, 0, 12); const T = lerp(20 * 60 + 25, 23 * 60 + 56, smooth(f, shot.at + 2, W(166))); hrs = Math.floor(T / 60); min = T - hrs * 60;
        open = 1 - smooth(f, W(167) + 3, W(167) + 9); red = 0.12;
      }
      stacks.forEach(({m, a}) => level(m, 1 - smooth(d, a * 0.68, a * 0.68 + 0.3)));
      twinkle(f, v === 'wallets');
      hole.set(f, open, v !== 'last' || f < W(166)); halo.visible = open > 0.5;
      clock.set(hrs, min, from); clock.g.rotation.z = v === 'last' ? shake(f, W(166), 0.05, 10) : 0;
      stream.set(f, f0, f1, (i) => { const s = stacks[(i * 7) % stacks.length]; return [s.top[0], Math.max(0.3, s.top[1] * (1 - d)) + 0.2, s.top[2]]; }, [0.15, 3.0, -1.3], () => HOLE, 0.034);
      const u = smooth(f, W(163), W(166)); last.visible = v === 'last' && u < 0.99;
      last.position.set(lerp(-1.3, HOLE[0], u), 1.5 + 1.05 * Math.sin(Math.PI * u * 0.6) * 0.9 + (HOLE[1] - 1.5) * u * u, lerp(-1.2, HOLE[2] + 0.05, u)); last.rotation.set(0, f * 0.4, 0); last.scale.setScalar(1 - 0.5 * smooth(u, 0.8, 1));
      (alarm.material as THREE.MeshBasicMaterial).opacity = red * (0.6 + 0.4 * Math.sin(f * 0.16));
    },
  };
};

// ------------------------------------------------------------------ the tower: the exchange from outside
export const tower: Builder = (root) => {
  const dusk = backdrop(root, ['#0b1030', '#27306a', '#c9688a', '#ffb070']), day = backdrop(root, ['#6fb6f0', '#bfe3fb', '#eaf6ff']);
  floor(root, 30, 24, tmat(tiled(tileTex('plaza', '#8f96a6', '#767d8e', 2, '#868d9d'), 15, 12)));
  const facade = (key: string, base: string, on: string, off: string, seed: number, cols: number, rows: number) => tex('facade-' + key, 256, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); const q = rng(seed), cw = w / cols, rh = h / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { g.fillStyle = q() < 0.5 ? on : off; g.fillRect(x * cw + cw * 0.17, y * rh + rh * 0.2, cw * 0.66, rh * 0.6); }
  });
  box(root, 2.7, 7.6, 2.2, tmat(facade('main', '#1a2038', '#ffd98a', '#2f3b66', 5, 6, 13)), 0, 3.8 + 2.75, -3.4);          // the tower, standing on its ground floor
  box(root, 2.7, 2.75, 2.2, '#222a45', 0, 1.375, -3.4);
  box(root, 2.9, 0.12, 0.9, '#2f3852', 0, 1.98, -2.1);                                                                      // canopy
  panel(root, 1.3, 1.86, lit('#9fd4f2', 0.85), 0, 0.93, -2.295); box(root, 0.05, 1.86, 0.04, '#222a45', 0, 0.93, -2.28);    // doors
  box(root, 2.3, 0.56, 0.1, '#11141d', 0, 2.42, -2.27);
  panel(root, 2.16, 0.44, smat(signTex('binance', 800, 164, '#11141d', GOLD, [['BINANCE', 150, 0.54]], {glow: '#f0b90b'}), 1.25), 0, 2.42, -2.215);
  for (const [x, h, z, sd] of [[-3.0, 5.0, -4.2, 2], [3.05, 4.2, -4.4, 4], [-4.6, 6.4, -6.5, 6], [4.8, 7.0, -6.8, 8], [-1.9, 8.6, -8.5, 10], [2.2, 9.4, -9, 12]] as const)
    box(root, 2.2, h, 2.0, tmat(facade('side' + sd, '#262c48', '#e9c070', '#343f66', sd, 5, Math.round(h * 1.6))), x, h / 2, z);
  for (const x of [-1.55, 1.55]) streetLamp(root, x, -1.3, 2.5);
  const out = breach(root, 0.62, 3.25, -2.29, 0.4), stream = coinStream(root, 40, 0.1), pay = coinStream(root, 30, 0.08);
  const us = [-0.78, 0, 0.78].map((x, i) => actor(root, USER([0, 1, 4][i]), {worry: {expr: 'nervous', pose: 'phone', prop: 'phone'}, glad: {expr: 'grin', pose: 'phone', prop: 'phone'}}, x, 0, 0.25 + (i === 1 ? 0.12 : 0), {scale: 0.96}));
  return {
    light: (v) => v === 'refund' ? LIGHT.day : {...LIGHT.dusk, amb: 1.2},
    tick: ({f, cam, shot}) => {
      const v = shot.v, late = v === 'refund';
      dusk.visible = !late; day.visible = late;
      out.set(f, late ? 0 : 1);
      if (late) stream.hide(); else stream.set(f, shot.at - 40, 1e9, () => [0.62, 3.25, -2.2], [1.5, 4.6, -1.2], (i) => [3.2 + (i % 3) * 0.3, 6.4, 0.5], 0.03);
      if (late) pay.set(f, W(208), 1e9, () => [0, 2.1, -2.0], [0, 3.1, -0.9], (i) => [[-0.78, 0, 0.78][i % 3] + 0.2, 1.32, 0.4], 0.04); else pay.hide();
      us.forEach((a, i) => { a.node.visible = late; a.show(f >= W(209) + i * 3 ? 'glad' : 'worry'); a.node.position.y = hop(f, W(209) + i * 3, 0.12, 9); a.tick(f, cam); });
    },
  };
};

// ------------------------------------------------------------------ the chart: two records, drawn to scale from zero
export const chart: Builder = (root) => {
  backdrop(root, ['#0a0f1e', '#182446']);
  floor(root, 14, 12, tmat(tiled(tileTex('chart', '#141c33', '#222d4d', 2), 7, 6)));
  const BASE = 0.56, U = 0.268, R = 0.3, H1 = 1.5 * U, H2 = 6.34 * U, X1 = -0.58, X2 = 0.5, Z = -0.3;   // U: metres per billion dollars
  box(root, 2.6, BASE, 1.2, '#1d2740', 0, BASE / 2, Z); box(root, 2.64, 0.05, 1.24, lit(GOLD, 1.05), 0, BASE - 0.025, Z);
  coinStack(root, X1, BASE, Z, H1 / (0.3 * R), R);
  const now = coinStack(root, X2, BASE, Z, H2 / (0.3 * R), R);
  const tag = (key: string, lines: [string, number, number, string?, ('Anton' | 'Montserrat')?][], w: number, h: number, x: number, y: number, z: number) =>
    soft(panel(root, w, h, smat(label(key, 512, Math.round(512 * h / w), lines), 1, true), x, y, z));
  const oldValue = tag('old-v', [['$1.5 BN', 150, 0.52]], 0.6, 0.26, X1, BASE + H1 * 0.5, Z + R + 0.03);
  const oldName = tag('old-n', [['BYBIT · 2025', 96, 0.5, '#ffffff', 'Montserrat']], 0.8, 0.2, X1, BASE + H1 + 0.16, Z);
  const nowValue = tag('now-v', [['$6.34 BN', 150, 0.36], ['BINANCE · 2026', 74, 0.8, '#ffe14a', 'Montserrat']], 0.82, 0.52, X2, BASE + H2 * 0.62, Z + R + 0.03);
  const ghostMat = new THREE.MeshBasicMaterial({color: '#ffe14a', transparent: true, opacity: 0.34, depthWrite: false});
  const ghosts = [1, 2, 3, 4].map((i) => {
    const h = i < 4 ? H1 : H2 - 4 * H1, g = grp(root, X1, BASE + i * H1, Z), geo = new THREE.CylinderGeometry(R, R, h, 24); geo.translate(0, h / 2, 0);
    soft(mesh(g, geo, ghostMat));
    for (const y of [0, h]) soft(torus(g, R, 0.012, lit('#ffe14a', 1.3), 0, y, 0)).rotation.x = Math.PI / 2;
    if (i < 4) soft(panel(g, 0.42, 0.24, smat(label('x' + i, 256, 146, [[`${i + 1}×`, 120, 0.54, '#ffe14a']]), 1, true), 0, h / 2, R + 0.03));
    return g;
  });
  const dashes = Array.from({length: 5}, (_, i) => soft(panel(root, 0.07, 0.022, lit('#ffe14a', 1.4), X1 + R + 0.1 + i * 0.105, BASE + H2, Z + 0.02)));
  return {
    light: () => ({...LIGHT.show, amb: 1.2}),
    tick: ({f, shot}) => {
      const times = shot.v === 'times', rise = times ? 1 : smooth(f, shot.at + 3, W(24) + 2);
      now.position.y = BASE - (1 - rise) * (H2 + 0.02);
      nowValue.visible = times || f >= W(25) - 2; nowValue.scale.setScalar(times ? 1 : pop(f, W(25) - 2, 8));
      oldName.visible = !times; oldValue.position.y = BASE + H1 * 0.5 + hop(f, W(32), 0.05, 8);
      ghosts.forEach((g, i) => { const at = W(28) + 2 + i * 6; g.visible = times && f >= at; g.scale.set(1, clamp01(pop(f, at, 7)), 1); });
      dashes.forEach((m, i) => { m.visible = times && f >= W(28) + 26 + i * 2; });
    },
  };
};

// ------------------------------------------------------------------ the ice: how much of the money is frozen
export const ice: Builder = (root) => {
  backdrop(root, ['#07101a', '#12283c']);
  floor(root, 14, 12, tmat(tiled(grainTex('ice', '#1b2c3d', 0.1), 5, 4)));
  box(root, 2.5, 0.12, 2.3, '#263a4f', 0, 0.06, -0.3);
  const cells = Array.from({length: 20}, (_, i) => {                                                   // 20 piles, 5 % of the money each; 9 of them is 45 %
    const row = Math.floor(i / 5), col = i % 5, x = -0.84 + col * 0.42, z = 0.52 - row * 0.5, held = i < 9;
    const pile = coinStack(root, x, 0.12, z, 7, 0.15), ring = soft(torus(root, 0.15, 0.012, lit('#6f879c', 1), x, 0.128, z)); ring.rotation.x = Math.PI / 2;
    const block = held ? iceBlock(root, 0.38, 0.44, 0.38) : null; if (block) block.position.set(x, 0.12, z);
    return {pile, ring, block, x, z, held, i};
  });
  const frost = pool(root, 1.6, '#bfe9ff', 0, 0, 0.3, 0.13);
  return {
    light: () => ({...LIGHT.cold, sky: '#cfe6ff', amb: 1.25, keyI: 1.1}),
    tick: ({f}) => {
      const gone = W(199), cold = W(205) - 5;
      cells.forEach((c) => {
        if (c.held) {
          const at = cold + (c.i % 5) * 1.5 + Math.floor(c.i / 5) * 2, k = clamp01((f - at) / 5);
          c.block!.visible = f >= at; c.block!.position.y = 0.12 + (1 - k * k) * 2.6 + (k >= 1 ? 0.03 * Math.max(0, 1 - (f - at - 5) / 5) * Math.abs(Math.sin((f - at - 5) * 0.9)) : 0);
          level(c.pile, 1); c.ring.visible = false;
        } else {
          const at = gone + (c.i - 9) * 1.2; level(c.pile, 1 - smooth(f, at, at + 7)); c.ring.visible = f >= at + 3;
        }
      });
      (frost.material as THREE.MeshBasicMaterial).opacity = 0.3 * smooth(f, cold + 4, cold + 14);
    },
  };
};
