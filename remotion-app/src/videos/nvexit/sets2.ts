// Sets of the Nvidia exit short, part 2: map, ware, racks, paper, case and floor.
import * as THREE from 'three';
import {backdrop, ball, box, card, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pop, rng, rod, rrect, smat, smooth, soft, tex, text, tiled, tileTex, tmat, vgrad, woodTex, type G2, type Node, type V} from './kit';
import {actor, drawActor, ENGINEER, JENSEN, OFFICIAL, STAFF, WOMAN, type Draw, type Look} from './cast';
import {bubble, envelope, halo, laptop, signTex, table} from './props';
import {chipIcon, ghost, glass, hash, INK, LIGHT, op, type Builder} from './sets';
import {W} from './story';

const frac = (x: number) => x - Math.floor(x);
/** head and shoulders of a figure, drawn into a rectangle of a texture: a photograph in a newspaper or on a board */
export function bust(g: G2, look: Look, d: Draw, x: number, y: number, w: number, h: number, bg: string) {
  const k = w / 360;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = bg; g.fillRect(x, y, w, h); g.translate(x - 120 * k, y - 112 * k); g.scale(k, k); drawActor(g, look, d, 1); g.restore();
  g.strokeStyle = INK; g.lineWidth = Math.max(4, w * 0.022); g.strokeRect(x, y, w, h);
}

// ------------------------------------------------------------------ map: born in Taiwan, school in Oregon
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
const LON0 = 98, LON1 = 252, LAT0 = 2, LAT1 = 66, MW = 2.3, MH = 1.3, MY = 1.62;
const mx = (lon: number) => ((lon < 0 ? lon + 360 : lon) - LON0) / (LON1 - LON0), my = (lat: number) => (LAT1 - lat) / (LAT1 - LAT0);
const spot = (lon: number, lat: number): [number, number] => [(mx(lon) - 0.5) * MW, MY + (0.5 - my(lat)) * MH];
const mapTex = () => tex('map-pacific', 1024, 580, (g, w, h) => {
  g.fillStyle = '#2a7fd0'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; for (let lon = 100; lon <= 250; lon += 15) { g.beginPath(); g.moveTo(mx(lon) * w, 0); g.lineTo(mx(lon) * w, h); g.stroke(); } for (let lat = 10; lat <= 60; lat += 10) { g.beginPath(); g.moveTo(0, my(lat) * h); g.lineTo(w, my(lat) * h); g.stroke(); }
  g.fillStyle = '#e8cf9a'; g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
  for (const poly of [...LAND, [[120.1, 23.6], [121.0, 25.4], [122.0, 25.0], [121.5, 22.7], [120.8, 21.9]] as [number, number][]]) { g.beginPath(); poly.forEach(([lon, lat], i) => { const x = mx(lon) * w, y = my(lat) * h; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke(); }
});
const planeTex = () => tex('plane-icon', 200, 200, (g) => { g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(178, 100); g.lineTo(120, 86); g.lineTo(74, 22); g.lineTo(56, 26); g.lineTo(80, 88); g.lineTo(40, 90); g.lineTo(24, 68); g.lineTo(12, 70); g.lineTo(22, 100); g.lineTo(12, 130); g.lineTo(24, 132); g.lineTo(40, 110); g.lineTo(80, 112); g.lineTo(56, 174); g.lineTo(74, 178); g.lineTo(120, 114); g.closePath(); g.fill(); g.stroke(); });
export const map: Builder = (root) => {
  backdrop(root, ['#e8dcc4', '#d8c8a8']);
  panel(root, 12, 7, tmat(tiled(grainTex('map-wall', '#e6d8bc', 0.06), 5, 3)), 0, 3.2, -0.6); floor(root, 12, 8, tmat(tiled(woodTex('map-floor', '#8a5a34', '#5a3a1e'), 4, 3)), 0, 0, 3.4);
  box(root, MW + 0.12, MH + 0.12, 0.04, '#3a2a1e', 0, MY, -0.56); soft(panel(root, MW, MH, smat(mapTex(), 1.0), 0, MY, -0.535)); for (const s of [-1, 1]) cyl(root, 0.035, MW + 0.3, '#5a3a1e', 0, MY + s * (MH / 2 + 0.07), -0.54).rotation.z = Math.PI / 2;
  const TW = spot(121, 23.8), OR = spot(-122.7, 45.5), mid: [number, number] = [(TW[0] + OR[0]) / 2 - 0.1, MY + 0.86];
  const at = (t: number): V => [(1 - t) ** 2 * TW[0] + 2 * t * (1 - t) * mid[0] + t * t * OR[0], (1 - t) ** 2 * TW[1] + 2 * t * (1 - t) * mid[1] + t * t * OR[1], -0.5];
  const pin = grp(root, TW[0], TW[1], -0.5); ball(pin, 0.06, lit('#e3342f', 1.2), 0, 0.13, 0).castShadow = false; const stem = cyl(pin, 0.004, 0.13, '#15121c', 0, 0.065, 0, 0.014, 8); stem.castShadow = false;
  const ring = soft(mesh(root, new THREE.RingGeometry(0.07, 0.092, 32), glass('#e3342f', 1, 1.2), TW[0], TW[1], -0.52));
  const dots = Array.from({length: 15}, (_, i) => { const o = ball(root, 0.019, lit('#ffffff', 1.1), ...at((i + 1) / 16)); o.castShadow = false; return o; });
  const plane = card(root, 0.3, 0.3, planeTex(), 0, 0, 0, 1.1);
  const tagT = soft(panel(root, 0.66, 0.21, smat(signTex('map-tw', 440, 140, '#e3342f', '#ffffff', [['TAIWAN', 104, 0.56]], {border: INK}), 1.1), TW[0] + 0.3, TW[1] - 0.2, -0.47));
  const tagO = soft(panel(root, 0.66, 0.21, smat(signTex('map-or', 440, 140, '#ffe14a', INK, [['OREGON', 104, 0.56]], {border: INK}), 1.1), OR[0] - 0.36, OR[1] + 0.2, -0.47));
  return {
    light: () => ({...LIGHT.room, amb: 1.7}),
    tick: ({f, shot}) => {
      const a = shot.at, go = a + 13, u = smooth(f, go, go + 16), drop = pop(f, a + 1, 6);
      pin.scale.setScalar(Math.max(0.001, drop)); pin.position.y = TW[1] + 0.5 * (1 - Math.min(1, drop)); tagT.scale.setScalar(pop(f, a + 4, 6));
      const r = frac((f - a) / 22); ring.scale.setScalar(1 + 2.4 * r); op(ring, 0.9 * (1 - r));
      dots.forEach((d, i) => { d.visible = u * 16 >= i + 1.3; });
      const p = at(u), q = at(Math.min(1, u + 0.02)); plane.visible = f >= go - 1; plane.position.set(p[0], p[1], -0.44); plane.rotation.z = Math.atan2(q[1] - p[1], q[0] - p[0]); plane.scale.setScalar(pop(f, go - 1, 5) * lerp(1, 0.7, u));
      tagO.scale.setScalar(pop(f, go + 13, 6));
    },
  };
};

// ------------------------------------------------------------------ ware: the first chip goes out, and comes back
const nv1Tex = () => tex('ware-nv1', 300, 220, (g, w, h) => {
  vgrad(g, w, h, ['#4a34a8', '#22175c']); chipIcon(g, 78, h / 2, 84, '#1c1f26', '#b6e04a'); text(g, 'NV1', 204, h / 2 + 6, 112, '#ffffff', {maxWidth: 160}); g.strokeStyle = '#ffe14a'; g.lineWidth = 9; g.strokeRect(7, 7, w - 14, h - 14);
});
export const ware: Builder = (root) => {
  backdrop(root, ['#2f343e', '#4a505c']);
  floor(root, 18, 18, tmat(tiled(grainTex('ware-floor', '#8a8f98', 0.09), 6, 6)));
  panel(root, 16, 7, tmat(tiled(foldTex('ware-wall', '#6f7682', '#565c68', 14), 3, 1)), 0, 3.5, -4.4);
  // the dock door, bright with daylight, and the belt that runs to it
  box(root, 3.0, 3.1, 0.1, '#3a3f4a', 0, 1.55, -4.36); const dayM = lamp('#dff1ff', 1.25); soft(panel(root, 2.7, 2.9, dayM, 0, 1.5, -4.3)); for (let i = 0; i < 4; i++) box(root, 2.7, 0.06, 0.06, '#565c68', 0, 3.0 - i * 0.14, -4.28);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) box(root, 0.12, 0.16, 0.02, i % 2 ? '#15121c' : '#ffd21f', s * 1.47, 0.08 + i * 0.16, -4.27);
  const belt = grp(root); box(belt, 0.96, 0.66, 6.0, '#3a3f4a', 0, 0.33, -1.3); box(belt, 0.84, 0.05, 6.0, '#1c1e26', 0, 0.685, -1.3); cyl(belt, 0.085, 0.9, '#8f96a8', 0, 0.66, 1.7).rotation.z = Math.PI / 2;
  const marks = Array.from({length: 10}, () => { const o = box(belt, 0.84, 0.012, 0.05, '#3a3f4a', 0, 0.716, 0); o.castShadow = false; return o; });
  for (const [x, z] of [[-3.2, -3.4], [3.3, -3.2]]) { box(root, 1.5, 2.6, 0.7, '#565c68', x, 1.3, z); for (let i = 0; i < 3; i++) box(root, 1.2, 0.5, 0.6, i % 2 ? '#b98a5a' : '#a37848', x, 0.45 + i * 0.8, z + 0.08); }
  const mats = [0, 1, 2, 3, 4, 5].map((i) => i === 4 || i === 5 ? new THREE.MeshLambertMaterial({map: nv1Tex()}) : new THREE.MeshLambertMaterial({color: i === 2 ? '#3a2a8a' : '#2a1e6a'}));
  const geo = new THREE.BoxGeometry(0.5, 0.36, 0.3);
  const crate = (p: Node) => { const o = new THREE.Mesh(geo, mats); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  // one on a little table, under a lamp
  const stand = grp(root, 0, 0, 0.6); box(stand, 0.8, 0.74, 0.5, '#565c68', 0, 0.37, 0); box(stand, 0.9, 0.04, 0.6, '#8f96a8', 0, 0.76, 0); const hero = crate(stand); const lampH = halo(root, 1.1, '#fff0c8', 0, 0, 1.2, 0.3);
  const out = Array.from({length: 9}, () => crate(root));
  // the pile they come back to: slots round the three of them, filled from the floor up
  const N = 34, slots: V[] = Array.from({length: N}, (_, i) => { const layer = i < 14 ? 0 : i < 26 ? 1 : 2, j = layer === 0 ? i : layer === 1 ? i - 14 : i - 26, n = [14, 12, 8][layer]; const side = j % 2 ? 1 : -1, k = Math.floor(j / 2);
    return [side * (1.12 + 0.52 * (k % 2) - layer * 0.1) + (hash(i) - 0.5) * 0.1, 0.18 + layer * 0.36, 0.4 + (k / (n / 2)) * 1.9 - layer * 0.1] as V; });
  const back = slots.map(() => crate(root));
  const front = [[-0.5, 0.18, 2.5], [0.42, 0.18, 2.62], [0.0, 0.18, 2.3]].map(() => crate(root));
  const me = actor(root, JENSEN(1), {a: {expr: 'shock', pose: 'panic'}, b: {expr: 'nervous', pose: 'shrug'}, c: {expr: 'grin', pose: 'both', prop: 'card', text: 'RIVA 128', big: true}}, 0, 0, 1.6, {scale: 1.0, res: 1.3, wide: true});
  const pals = [0, 1].map((i) => actor(root, ENGINEER(i), {a: {expr: 'shock', pose: 'panic'}, b: {expr: 'dazed', pose: 'hang'}, c: {expr: 'relief', pose: 'hang'}}, i ? 0.66 : -0.66, 0, 1.35, {scale: 1.0, res: 1.2, wide: true}));
  return {
    light: (v) => v === 'flop' ? {...LIGHT.dark, amb: 1.15, keyI: 1.1} : LIGHT.cold,
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at, flop = v === 'flop', going = v === 'out', home = v === 'back' || v === 'alive';
      belt.visible = !flop; marks.forEach((m, i) => { m.position.z = 1.6 - frac((f * 0.1 + i * 0.6) / 6) * 6; });
      // "flopped": it keels over and slides off its table
      stand.visible = flop; op(lampH, flop ? 0.3 : 0); const k = smooth(f, W(83) - 2, W(83) + 8), fall = k * k;
      hero.position.set(0.62 * k, 0.96 - 0.78 * fall + 0.1 * Math.sin(Math.PI * k), 0.05 + 0.3 * k); hero.rotation.set(0, 0.12, -1.57 * k);
      // out: they ride away from us into the daylight
      out.forEach((c, i) => { const z = 1.4 - frac(((f - a) * 0.085 + i * 0.66) / 5.94) * 5.94; c.visible = going; c.position.set(0, 0.89, z); c.rotation.y = (hash(i) - 0.5) * 0.3; });
      // back: they come flying out of the door, and land round the three of them
      const T0 = W(92), per = (W(98) + 4 - T0) / N;
      back.forEach((c, i) => { const t0 = T0 + i * per, u = Math.min(1, Math.max(0, (f - t0) / 15)), s = slots[i]; c.visible = home && f >= t0; c.position.set(lerp((hash(i, 4) - 0.5) * 1.6, s[0], u), lerp(2.0, s[1], u * u) + 2.3 * Math.sin(Math.PI * u) * (1 - 0.35 * u), lerp(-4.0, s[2], u)); c.rotation.set((1 - u) * (3 + i), (hash(i, 5) - 0.5) * 0.9, (1 - u) * (2 + i * 0.7)); });
      front.forEach((c, i) => { const t0 = T0 + 14 + i * 16, u = Math.min(1, Math.max(0, (f - t0) / 15)), s = [[-0.5, 0.18, 2.5], [0.42, 0.18, 2.62], [0.0, 0.54, 2.56]][i]; c.visible = home && f >= t0; c.position.set(lerp(0, s[0], u), lerp(2.0, s[1], u * u) + 2.5 * Math.sin(Math.PI * u) * (1 - 0.35 * u), lerp(-4.0, s[2], u)); c.rotation.set((1 - u) * 4, 0.3 * (i - 1), (1 - u) * 3); });
      const alive = f >= W(99) - 2, card1 = f >= W(100) - 1, duck = f >= T0 + 10 && !alive;
      me.node.visible = home; pals.forEach((p) => { p.node.visible = home; });
      me.show(card1 ? 'c' : alive || !duck ? (alive ? 'b' : 'a') : 'b'); me.node.position.y = hop(f, W(100) - 1, 0.1, 8); me.tick(f, cam);
      pals.forEach((p, i) => { p.show(alive ? 'c' : duck ? 'b' : 'a'); p.node.position.y = hop(f, W(99) + i * 3, 0.06, 8); p.tick(f, cam); });
      dayM.color.set('#dff1ff').multiplyScalar(1.25);
    },
  };
};

// ------------------------------------------------------------------ racks: the chips behind the chat window
const ledTex = () => tex('racks-led', 128, 256, (g, w, h) => {
  g.fillStyle = '#0c0f16'; g.fillRect(0, 0, w, h); const r = rng(5);
  for (let y = 10; y < h - 8; y += 14) { g.fillStyle = '#1a1f2a'; g.fillRect(8, y, w - 16, 9); for (let x = 14; x < w - 16; x += 9) if (r() < 0.62) { g.fillStyle = r() < 0.8 ? '#76f08a' : '#4fd8ff'; g.fillRect(x, y + 2, 5, 5); } }
});
const chatTex = () => tex('racks-chat', 920, 720, (g, w, h) => {
  g.fillStyle = '#f7f7f8'; rrect(g, 6, 6, w - 12, h - 12, 46); g.fill(); g.strokeStyle = INK; g.lineWidth = 12; g.stroke();
  g.fillStyle = '#e4e6ea'; rrect(g, 6, 6, w - 12, 96, 46); g.fill(); g.fillRect(6, 60, w - 12, 44); for (let i = 0; i < 3; i++) { g.fillStyle = ['#ff6058', '#ffbd2e', '#28c940'][i]; g.beginPath(); g.arc(64 + i * 44, 56, 13, 0, 7); g.fill(); }
  g.fillStyle = '#2f7fe0'; rrect(g, 250, 142, w - 300, 168, 40); g.fill();
  text(g, 'Write a poem about', w - 50 - (w - 300) / 2, 196, 50, '#ffffff', {font: 'Montserrat', weight: 700, maxWidth: w - 360}); text(g, 'a diner at 3 a.m.', w - 50 - (w - 300) / 2, 258, 50, '#ffffff', {font: 'Montserrat', weight: 700, maxWidth: w - 360});
  g.fillStyle = '#76b900'; g.beginPath(); g.arc(96, 420, 40, 0, 7); g.fill(); chipIcon(g, 96, 420, 34, '#ffffff', '#76b900', '#ffffff');
});
export const racks: Builder = (root) => {
  backdrop(root, ['#04060c', '#0c1424']);
  floor(root, 12, 30, tmat(tiled(tileTex('racks-floor', '#1c2230', '#33405a', 4), 6, 15)), 0, 0, -5);
  const ledM = smat(ledTex(), 1.25);
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const z = 2.6 - i * 1.3; box(root, 0.9, 2.5, 1.1, '#14171f', s * 1.5, 1.25, z); soft(panel(root, 1.0, 2.3, ledM, s * 1.045, 1.25, z, -s * Math.PI / 2)); }
  for (let i = 0; i < 10; i++) box(root, 0.14, 0.03, 0.8, lit('#cfe6ff', 1.7), 0, 3.05, 2.6 - i * 1.3).castShadow = false;
  panel(root, 6, 4, lit('#070a12', 1), 0, 2, -10.6); const far = halo(root, 2.6, '#76f08a', 0.3, 0, 1.6, -10.4);
  // the window that opens in the aisle
  const win = grp(root, 0, 1.63, 0.6); soft(panel(win, 1.15, 0.9, smat(chatTex(), 1.0, true), 0, 0, 0));
  const lines = [0.62, 0.7, 0.5, 0.66].map((wd, i) => { const o = soft(panel(win, wd, 0.045, lit('#3a3f4a', 1), -0.33 + wd / 2, -0.03 - i * 0.085, 0.004)); return o; });
  const dots = [0, 1, 2].map((i) => soft(mesh(win, new THREE.CircleGeometry(0.022, 16), lit('#8f96a8', 1), -0.3 + i * 0.07, -0.37, 0.004)));
  return {
    light: () => ({...LIGHT.dark, amb: 1.3, keyI: 0.9, key: '#d8ffe8'}),
    tick: ({f, shot}) => {
      const open = W(108) - 2, on = shot.v === 'chat' && f >= open;
      ledM.color.set('#ffffff').multiplyScalar(1.2 + 0.2 * Math.sin(f * 0.45) + (on ? 0.25 : 0)); op(far, 0.26 + 0.08 * Math.sin(f * 0.2));
      win.visible = on; win.scale.setScalar(pop(f, open, 7));
      lines.forEach((l, i) => { const at = open + 9 + i * 6, k = smooth(f, at, at + 6); l.visible = f >= at; l.scale.x = Math.max(0.001, k); l.position.x = -0.33 + [0.62, 0.7, 0.5, 0.66][i] * k / 2; });
      dots.forEach((d, i) => { d.position.y = -0.37 + 0.02 * Math.max(0, Math.sin(f * 0.5 - i * 0.9)); });
    },
  };
};

// ------------------------------------------------------------------ paper: what a newspaper reported, twice
const pageTex = (key: string, second: boolean) => tex('paper-' + key, 680, 840, (g, w, h) => {
  g.fillStyle = '#f4eedc'; g.fillRect(0, 0, w, h); const r = rng(second ? 41 : 17);
  g.fillStyle = '#15121c'; g.fillRect(34, 36, w - 68, 9); for (let x = 150; x < w - 150;) { const bw = 30 + r() * 70; g.fillRect(x, 60, Math.min(bw, w - 150 - x), 46); x += bw + 14; } g.fillRect(34, 122, w - 68, 4);
  g.fillStyle = '#8f8a96'; g.fillRect(34, 134, 150, 8); g.fillRect(w - 184, 134, 150, 8);
  g.fillStyle = '#2b2733'; g.fillRect(40, 162, w - 120, 28); g.fillRect(40, 202, w * 0.55, 28);
  bust(g, JENSEN(0), {expr: second ? 'nervous' : 'neutral'}, 40, 256, 270, 330, '#cfe3d0');
  if (second) { g.fillStyle = '#2b2f3a'; g.fillRect(370, 256, 270, 330); ghost(g, 505, 420, 230); text(g, '?', 505, 436, 150, '#ffe14a'); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(370, 256, 270, 330); }
  else bust(g, WOMAN, {}, 370, 256, 270, 330, '#d9d6e3');
  g.fillStyle = '#8f8a96'; for (const x of [40, 370]) { g.fillRect(x, 598, 230, 8); g.fillRect(x, 612, 170, 8); }
  for (let c = 0; c < 3; c++) for (let y = 644; y < h - 30; y += 15) g.fillRect(40 + c * 206, y, 150 + r() * 38, 6);
  g.strokeStyle = '#b9b09a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
});
export const paper: Builder = (root) => {
  backdrop(root, ['#141a2a', '#2a3350']);
  const glow = halo(root, 3.4, '#8fb0ff', 0.16, 0, 1.6, -0.6);
  const PW = 1.7, PH = 2.1, sheet = (key: string, second: boolean) => { const g = grp(root, 0, 1.6, 0); box(g, PW + 0.02, PH + 0.02, 0.012, '#d9d2bc', 0.02, -0.02, -0.02); soft(panel(g, PW, PH, smat(pageTex(key, second), 1.0), 0, 0, 0)); return g; };
  const one = sheet('one', false), two = sheet('two', true);
  // a red cord from one photograph to the other
  const X0 = (175 / 680 - 0.5) * PW, X1 = (505 / 680 - 0.5) * PW, Y = (0.5 - 268 / 840) * PH, SEG = 12;
  const cordAt = (t: number): V => [lerp(X0, X1, t), Y - 0.09 * Math.sin(Math.PI * t), 0.03];
  const cord = Array.from({length: SEG}, (_, i) => rod(one, cordAt(i / SEG), cordAt((i + 1) / SEG), 0.012, lit('#e3342f', 1.1)));
  const pins = [X0, X1].map((x) => { const o = ball(one, 0.035, lit('#e3342f', 1.2), x, Y, 0.04); o.castShadow = false; return o; });
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      const v = shot.v, second = v === 'second', a = second ? shot.at : W(110) - 2, k = smooth(f, a, a + 15), s = lerp(0.03, 1, k) * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, Math.max(0, (f - a - 15) / 7))));
      const top = second ? two : one;
      one.visible = true; two.visible = second;
      if (second) { one.scale.setScalar(1); one.rotation.z = 0.13; one.position.set(-0.07, 1.63, -0.08); }
      else { one.position.set(0, 1.6, 0); }
      top.scale.setScalar(s); top.rotation.z = (1 - k) * 12.566 + (second ? -0.05 : -0.04);
      const tie = !second && f >= W(117) - 1, u = smooth(f, W(117) - 1, W(117) + 9);
      cord.forEach((c, i) => { c.visible = tie && u * SEG >= i + 0.5; }); pins[0].visible = tie; pins[1].visible = tie && u >= 1; pins.forEach((p, i) => p.scale.setScalar(pop(f, W(117) - 1 + i * 10, 5)));
      op(glow, 0.14 + 0.04 * Math.sin(f * 0.1));
    },
  };
};

// ------------------------------------------------------------------ case: what U.S. officials suspect
const cardTex = (key: string, draw: (g: G2, w: number, h: number) => void, w = 300, h = 360) => tex('case-' + key, w, h, (g) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); draw(g, w, h); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); });
const caseBoard = (root: THREE.Group, x: number, y: number, z: number) => {
  const g = grp(root, x, y, z); box(g, 2.16, 1.14, 0.05, '#5a3a1e', 0, 0, -0.03); panel(g, 2.04, 1.02, tmat(tiled(grainTex('case-cork', '#b98a5a', 0.14), 4, 2)), 0, 0, 0);
  const pinCard = (t: THREE.Texture, w: number, h: number, cx: number, cy: number, rz: number) => { const o = soft(panel(g, w, h, smat(t, 1.0), cx, cy, 0.012)); o.rotation.z = rz; const p = ball(g, 0.024, lit('#e3342f', 1.2), cx, cy + h / 2 - 0.04, 0.03); p.castShadow = false; return o; };
  pinCard(cardTex('who', (c, w, h) => bust(c, WOMAN, {}, 22, 22, w - 44, (w - 44) * 1.22, '#d9d6e3')), 0.5, 0.6, 0, 0.02, -0.03);
  pinCard(cardTex('chip', (c, w, h) => chipIcon(c, w / 2, h / 2, 150), 260, 260), 0.36, 0.36, -0.72, 0.2, 0.08);
  pinCard(cardTex('doc', (c, w) => { c.fillStyle = '#8f8a96'; for (let i = 0; i < 9; i++) c.fillRect(34, 46 + i * 30, (i % 3 === 2 ? 0.5 : 0.78) * w, 12); }, 260, 330), 0.3, 0.38, -0.66, -0.27, -0.06);
  pinCard(cardTex('globe', (c, w, h) => { c.fillStyle = '#2a7fd0'; c.beginPath(); c.arc(w / 2, h / 2, 96, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 7; c.stroke(); c.beginPath(); c.ellipse(w / 2, h / 2, 44, 96, 0, 0, 7); c.moveTo(w / 2 - 96, h / 2); c.lineTo(w / 2 + 96, h / 2); c.stroke(); }, 260, 260), 0.36, 0.36, 0.72, 0.18, -0.07);
  for (const [x1, y1] of [[-0.58, 0.2], [-0.56, -0.2], [0.58, 0.18]]) rod(g, [x1, y1, 0.02], [x1 < 0 ? -0.24 : 0.24, 0.06, 0.02], 0.008, lit('#e3342f', 1.1));
  return g;
};
export const caseSet: Builder = (root) => {
  backdrop(root, ['#2a3446', '#46546c']);
  floor(root, 12, 10, tmat(tiled(grainTex('case-floor', '#3a4458', 0.08), 5, 4)));
  panel(root, 12, 6, tmat(tiled(grainTex('case-wall', '#5a6a84', 0.05), 5, 3)), 0, 3, -1.2); box(root, 12, 0.1, 0.06, '#2a3446', 0, 1.1, -1.17);
  caseBoard(root, 0, 2.28, -1.12);
  const note = grp(root, 0.72, 2.0, -1.08); soft(panel(note, 0.3, 0.3, smat(tex('case-note', 200, 200, (g, w, h) => { g.fillStyle = '#ffe14a'; g.fillRect(0, 0, w, h); text(g, '?', w / 2, h / 2 + 8, 170, INK); }), 1.05), 0, 0, 0)).rotation.z = 0.1;
  table(root, 0, 0.25, 2.3, 0.8, {h: 0.76, top: '#3a2a1e', leg: '#22202a', skirt: '#2e2218'});
  box(root, 0.36, 0.02, 0.26, '#ffc94a', -0.1, 0.775, 0.3).rotation.y = 0.2; box(root, 0.3, 0.012, 0.22, lit('#fffdf4', 1), 0.42, 0.772, 0.36).rotation.y = -0.3;
  const who = [0, 1].map((i) => actor(root, OFFICIAL(i), i ? {a: {expr: 'stern', pose: 'desk', mode: 'sit'}, b: {expr: 'stern', pose: 'think', mode: 'sit'}} : {a: {expr: 'stern', pose: 'desk', mode: 'sit'}, b: {expr: 'stern', pose: 'wave', mode: 'sit'}}, i ? 0.58 : -0.58, 0.52, -0.3, {scale: 1.0, res: 1.2, wide: true, shadow: 0}));
  return {
    light: () => LIGHT.cold,
    tick: ({f, cam}) => {
      const S = W(124) - 1;
      who.forEach((p, i) => { p.show(f >= S + i * 6 ? 'b' : 'a'); p.node.position.y = 0.52 + hop(f, S + i * 6, 0.05, 8); p.tick(f, cam); });
      note.scale.setScalar(pop(f, S, 7)); note.rotation.z = 0.06 * Math.sin(f * 0.15);
    },
  };
};

// ------------------------------------------------------------------ floor: the memo reaches the staff
export const floorSet: Builder = (root) => {
  backdrop(root, ['#dfe6ea', '#c2ccd4']);
  floor(root, 14, 12, tmat(tiled(grainTex('floor-carpet', '#6f7d8c', 0.08), 6, 5)));
  panel(root, 12, 5, tmat(tiled(grainTex('floor-wall', '#eef1f3', 0.04), 5, 3)), 0, 2.5, -2.6); box(root, 12, 0.22, 0.05, '#76b900', 0, 2.2, -2.56);
  for (const x of [-2.2, 0, 2.2]) { box(root, 0.06, 2.0, 0.06, '#8f96a8', x - 1.05, 1.0, -2.5); soft(panel(root, 2.0, 1.9, glass('#cfe9f6', 0.3), x, 1.05, -2.52)); }
  const SEATS: [number, number][] = [[-0.92, -1.3], [0, -1.3], [0.92, -1.3], [-0.5, 0.45], [0.5, 0.45]];
  const mail = tex('floor-mail', 220, 180, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); envelope(g, w / 2, h / 2, 120); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(w - 44, 44, 26, 0, 7); g.fill(); text(g, '1', w - 44, 46, 38, '#ffffff'); });
  const seats = SEATS.map(([x, z], i) => {
    table(root, x, z, 0.84, 0.56, {h: 0.74, top: '#e6e2d8', leg: '#8f96a8', skirt: '#cfd4da'}); laptop(root, x, 0.74, z + 0.04, {ry: Math.PI, w: 0.42, body: '#c9ced6', back: lit('#76b900', 1.0)});
    const who = actor(root, STAFF(i), {a: {expr: 'neutral', pose: 'type', mode: 'sit'}, b: {expr: 'shock', pose: 'type', mode: 'sit'}}, x, 0.6, z - 0.42, {scale: 0.95, res: 1.1, shadow: 0});
    const note = bubble(root, x + 0.3, 1.02 + 0.2, z + 0.12, 0.3, 0.24, smat(mail, 1.05), [-0.2, -0.16]);
    return {who, note};
  });
  return {
    light: () => LIGHT.cold,
    tick: ({f, cam}) => {
      const S = W(135) + 2;
      seats.forEach(({who, note}, i) => { const at = S + [4, 0, 8, 12, 16][i]; who.show(f >= at + 5 ? 'b' : 'a'); who.node.position.y = 0.6 + hop(f, at + 5, 0.06, 8); who.tick(f, cam); note.g.scale.setScalar(pop(f, at, 6)); });
    },
  };
};
