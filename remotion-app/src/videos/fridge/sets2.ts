// Sets of the fridge hack short, part 2: the two lecterns, the cable to the cloud, the technician's wall, the lecture
// hall, the line-up.
import * as THREE from 'three';
import {backdrop, ball, beam, box, clamp01, cone, cyl, floor, foldTex, grp, hop, lamp, lerp, lit, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus, vgrad, woodTex,
  type G2, type Node, type V} from './kit';
import {actor, PROF, SPOKES_PARIS, SPOKES_TEHRAN, TECH} from './cast';
import {cloud3d, crowd, cursor3d, freezer, fridge3d, lectern, plant, signTex} from './props';
import {freezerIcon, LIGHT, type Builder} from './sets';
import {TOTAL, W} from './story';

// ------------------------------------------------------------------ two ministries, two lecterns
/** the Eiffel Tower, drawn flat: base at (x, y), h tall */
function eiffel(g: G2, x: number, y: number, h: number, c: string) {
  const w = (t: number) => h * (0.03 + 0.22 * (1 - t) ** 2.4);                                        // half-width at height t (0 ground .. 1 top)
  g.fillStyle = c; g.strokeStyle = '#1a1420'; g.lineJoin = 'round'; g.lineWidth = h * 0.012;
  g.beginPath(); for (let i = 0; i <= 30; i++) { const t = i / 30 * 0.93; g.lineTo(x - w(t), y - t * h); } for (let i = 30; i >= 0; i--) { const t = i / 30 * 0.93; g.lineTo(x + w(t), y - t * h); } g.closePath(); g.fill(); g.stroke();
  g.fillRect(x - h * 0.008, y - h, h * 0.016, h * 0.09);                                               // mast
  g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(x - w(0) * 0.62, y + 2); g.quadraticCurveTo(x, y - h * 0.3, x + w(0) * 0.62, y + 2); g.closePath(); g.fill(); g.restore();   // the arch between the legs
  for (const t of [0.19, 0.4, 0.86]) { g.fillStyle = '#1a1420'; g.fillRect(x - w(t) - h * 0.012, y - t * h - h * 0.012, 2 * w(t) + h * 0.024, h * 0.024); }                                       // platforms
  g.strokeStyle = 'rgba(26,20,32,.55)'; g.lineWidth = h * 0.006;
  for (let i = 0; i < 16; i++) { const t0 = 0.2 + i * 0.042, t1 = t0 + 0.042; g.beginPath(); g.moveTo(x - w(t0), y - t0 * h); g.lineTo(x + w(t1), y - t1 * h); g.moveTo(x + w(t0), y - t0 * h); g.lineTo(x - w(t1), y - t1 * h); g.stroke(); }
}
/** Tehran's Azadi Tower, drawn flat: base at (x, y), h tall */
function azadi(g: G2, x: number, y: number, h: number) {
  const half = (t: number) => h * (t < 0.56 ? 0.13 + 0.26 * (1 - t / 0.56) ** 1.9 : 0.13 + 0.02 * Math.min(1, (t - 0.56) / 0.2));
  g.fillStyle = '#f1ecdf'; g.strokeStyle = '#2a2430'; g.lineJoin = 'round'; g.lineWidth = h * 0.014;
  g.beginPath(); for (let i = 0; i <= 30; i++) { const t = i / 30; g.lineTo(x - half(t), y - t * h); } for (let i = 30; i >= 0; i--) { const t = i / 30; g.lineTo(x + half(t), y - t * h); } g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(42,36,48,.14)'; g.beginPath(); g.moveTo(x, y); for (let i = 30; i >= 0; i--) { const t = i / 30; g.lineTo(x + half(t), y - t * h); } g.lineTo(x, y - h); g.closePath(); g.fill();   // shaded side
  const arch = (hw: number, base: number, tip: number, fill: string) => { g.beginPath(); g.moveTo(x - hw, y - base); g.quadraticCurveTo(x - hw, y - tip * 0.86, x, y - tip); g.quadraticCurveTo(x + hw, y - tip * 0.86, x + hw, y - base); g.closePath(); g.fillStyle = fill; g.fill(); g.stroke(); };
  arch(h * 0.2, -2, h * 0.4, '#6fb9c8');                                                               // the great arch: sky shows through
  arch(h * 0.085, h * 0.5, h * 0.76, '#3f8fa0');
  g.strokeStyle = 'rgba(42,36,48,.5)'; g.lineWidth = h * 0.007;
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * h * 0.034, y - h * 0.84); g.lineTo(x + i * h * 0.034, y - h * 0.97); g.stroke(); }
  g.beginPath(); g.moveTo(x - half(0.82), y - h * 0.82); g.lineTo(x + half(0.82), y - h * 0.82); g.stroke();
}
const roofs = (g: G2, w: number, y0: number, h: number, c: string, lit2: string, seed: number, flat: boolean) => {
  const r = rng(seed);
  for (let x = -10; x < w;) {
    const bw = 44 + r() * 70, bh = h * (0.45 + r() * 0.55); g.fillStyle = c; g.fillRect(x, y0 - bh, bw, bh + 4);
    if (!flat) { g.beginPath(); g.moveTo(x - 3, y0 - bh); g.lineTo(x + bw * 0.14, y0 - bh - 16); g.lineTo(x + bw * 0.86, y0 - bh - 16); g.lineTo(x + bw + 3, y0 - bh); g.closePath(); g.fill(); g.fillRect(x + bw * 0.3, y0 - bh - 28, 8, 14); }
    g.fillStyle = lit2; for (let yy = y0 - bh + 10; yy < y0 - 6; yy += 16) for (let xx = x + 8; xx < x + bw - 10; xx += 13) if (r() < 0.4) g.fillRect(xx, yy, 6, 8);
    x += bw + 2;
  }
};
const flatTex = (city: 'paris' | 'tehran') => tex('flat-' + city, 900, 660, (g, w, h) => {
  if (city === 'paris') {
    vgrad(g, w, h, ['#16224e', '#3a4a8c', '#e9a48a', '#ffd9a8']);
    const r = rng(3); g.fillStyle = '#fff6d0'; for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h * 0.42, 2.4, 2.4);
    eiffel(g, 322, 536, 232, '#c79a5a');
    roofs(g, w, 560, 74, '#2a2f52', '#ffd98a', 5, false);
  } else {
    vgrad(g, w, h, ['#1f6f86', '#59b3c2', '#bfe6e6', '#f3ead2']);
    g.fillStyle = '#7f9aa8'; g.beginPath(); g.moveTo(0, 470); for (const [px, py] of [[90, 372], [200, 430], [330, 338], [470, 420], [600, 352], [730, 430], [900, 380], [900, 560], [0, 560]]) g.lineTo(px, py); g.closePath(); g.fill();   // the Alborz range
    g.fillStyle = '#ffffff'; for (const [px, py] of [[90, 372], [330, 338], [600, 352]]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px - 34, py + 34); g.lineTo(px - 12, py + 26); g.lineTo(px, py + 40); g.lineTo(px + 14, py + 26); g.lineTo(px + 36, py + 36); g.closePath(); g.fill(); }
    azadi(g, 322, 536, 228);
    roofs(g, w, 560, 58, '#3d6470', '#fff0c0', 9, true);
  }
  g.fillStyle = city === 'paris' ? '#20243f' : '#2f4f58'; g.fillRect(0, 556, w, h - 556);
});
const plaque = (s: string, bg: string) => signTex('plaque-' + s, 400, 190, bg, '#fffdf4', [[s, 120]], {border: '#e7c56a'});
export const podium: Builder = (root) => {
  backdrop(root, ['#0a1228', '#1c2c58']);
  floor(root, 14, 12, tmat(tiled(woodTex('stage', '#6a4a36', '#3a2618'), 4, 4)));
  const paris = grp(root), tehran = grp(root);
  panel(paris, 6, 4.4, smat(flatTex('paris'), 1.02), 0, 2.2, -1.9); panel(tehran, 6, 4.4, smat(flatTex('tehran'), 1.02), 0, 2.2, -1.9);
  panel(paris, 14, 6, lit('#16224e', 1.02), 0, 7.36, -1.91); panel(tehran, 14, 6, lit('#1f6f86', 1.02), 0, 7.36, -1.91);   // the sky goes on above the painted flats
  for (const s of [-1, 1]) { box(paris, 1.0, 5.2, 0.3, tmat(tiled(foldTex('cur-p', '#27355e', '#151d38'), 1, 1)), s * 2.35, 2.6, -1.3); box(tehran, 1.0, 5.2, 0.3, tmat(tiled(foldTex('cur-t', '#1f5a52', '#10332e'), 1, 1)), s * 2.35, 2.6, -1.3); }
  lectern(paris, 0, 0.35, '#3a2a22', plaque('PARIS', '#27355e')); lectern(tehran, 0, 0.35, '#2e2a24', plaque('TEHRAN', '#1f5a52'));
  // The speakers stand on a step behind the lectern, so the jacket and the hands show above it.
  const UP = 0.2;
  const fr = actor(root, SPOKES_PARIS, {idle: {expr: 'stern'}, point: {expr: 'stern', pose: 'point'}, paper: {expr: 'stern', pose: 'hold', prop: 'paper'}, sure: {expr: 'stern', pose: 'hips'}}, 0, UP, -0.3, {scale: 1.25, res: 1.2});
  const ir = actor(root, SPOKES_TEHRAN, {idle: {expr: 'neutral'}, deny: {expr: 'stern', pose: 'cross'}, paper: {expr: 'neutral', pose: 'hold', prop: 'paper'}, read: {expr: 'neutral', pose: 'hold', prop: 'paper'}}, 0, UP, -0.3, {scale: 1.25, res: 1.2});
  // "ice cold": frost creeps over the lectern from its edges, icicles grow under its top, snow settles on it and falls
  const ice = grp(tehran, 0, 0, 0.35);
  const icicles = ([[-0.46, 0.4], [-0.39, 0.24], [-0.32, 0.13], [-0.16, 0.07], [0.04, 0.09], [0.19, 0.06], [0.32, 0.12], [0.4, 0.3], [0.47, 0.19]] as const).map(([x, len]) => {
    const c = cone(ice, 0.036, 1, lit('#e4f7ff', 1.2), x, 1.16, 0.31, 10); c.rotation.x = Math.PI; c.castShadow = false; c.userData = {len}; return c;
  });
  const frost = soft(panel(ice, 0.8, 1.14, new THREE.MeshBasicMaterial({map: tex('lectern-frost', 240, 342, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(206,236,250,.9)'); gr.addColorStop(0.55, 'rgba(222,244,254,.94)'); gr.addColorStop(1, 'rgba(244,252,255,.98)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(21); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round';
    for (let i = 0; i < 40; i++) {                                                                                               // ice crystals: six arms each, more of them toward the foot
      const x = r() * w, y = h * (0.32 + 0.68 * Math.sqrt(r())), q = 5 + r() * 9; g.lineWidth = 1.6 + r() * 1.4;
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + r() * 0.3; g.beginPath(); g.moveTo(x - q * Math.cos(a), y - q * Math.sin(a)); g.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); g.stroke(); }
    }
    g.strokeStyle = 'rgba(150,200,226,.5)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = 20 + r() * (w - 40), y = 60 + r() * (h - 120); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18 + r() * 30, y + 30 + r() * 50); g.stroke(); }   // a few cracks
  }), transparent: true, opacity: 0, depthWrite: false}), 0, 0.66, 0.2325));
  const cap = box(ice, 1.04, 0.07, 0.62, lit('#f4fbff', 1.12), 0, 1.3, 0); cap.rotation.x = 0.16; cap.castShadow = false;
  const flakes = Array.from({length: 26}, (_, i) => soft(ball(ice, 0.022 + (i % 3) * 0.008, lit('#ffffff', 1.3))));
  return {
    light: (v) => v === 'deny' || v === 'ice' || v === 'read' ? {...LIGHT.show, sky: '#d6f4f0', amb: 1.25} : {...LIGHT.show, sky: '#d8e2ff', amb: 1.25},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, inParis = v === 'accuse' || v === 'paris' || v === 'sure';
      paris.visible = fr.node.visible = inParis; tehran.visible = ir.node.visible = !inParis;
      if (v === 'accuse') { fr.show(f >= W(17) ? 'point' : 'idle'); fr.node.position.y = UP + hop(f, W(17), 0.1, 8); }
      else if (v === 'paris') { fr.show(f >= W(155) ? 'paper' : 'idle'); fr.node.position.y = UP + hop(f, W(155), 0.08, 8); }
      else if (v === 'sure') { fr.show('sure'); fr.node.position.y = UP + hop(f, W(179), 0.07, 8); }
      if (v === 'deny') { ir.show('deny'); ir.node.position.set(0.035 * Math.sin(f * 1.1) * clamp01(1 - t / 22), UP, -0.3); }
      else if (v === 'ice') { ir.show(f >= W(190) ? 'paper' : 'idle'); ir.node.position.set(0, UP + hop(f, W(190), 0.08, 8), -0.3); }
      else if (v === 'read') { ir.show('read'); ir.node.position.set(0, UP, -0.3); }
      const cold = v === 'ice' ? smooth(f, W(191), W(193) + 8) : v === 'read' ? 1 : 0;
      ice.visible = cold > 0; (frost.material as THREE.MeshBasicMaterial).opacity = cold;
      icicles.forEach((c) => { const len = Math.max(0.01, c.userData.len * cold); c.scale.set(1, len, 1); c.position.y = 1.165 - len / 2; });
      cap.scale.set(1, Math.max(0.01, cold), 1);
      flakes.forEach((m, i) => { const u = ((f * 0.012 + i * 0.137) % 1); m.visible = cold > 0.3; m.position.set(-1.4 + (i * 0.61 % 1) * 2.8 + 0.1 * Math.sin(f * 0.07 + i), 3.0 - 2.9 * u, -0.15 + (i % 5) * 0.2); });
      fr.tick(f, cam); ir.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the cable: why a freezer is online, and the two answers
/** a hanging cable made of short links, re-posed every frame */
function rope(p: Node, n: number, r: number, c: string) {
  const links = Array.from({length: n}, () => cyl(p, r, 1, c, 0, 0, 0, r, 8)), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const at = (A: V, B: V, sag: number, u: number, out: THREE.Vector3) => out.set(lerp(A[0], B[0], u), lerp(A[1], B[1], u) - sag * 4 * u * (1 - u), lerp(A[2], B[2], u));
  return {
    at: (A: V, B: V, sag: number, u: number) => at(A, B, sag, u, new THREE.Vector3()),
    set(A: V, B: V, sag: number, visible = true) {
      links.forEach((m, i) => { at(A, B, sag, i / n, a); at(A, B, sag, (i + 1) / n, b); const d = b.clone().sub(a), len = d.length(); m.visible = visible; m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(up, d.normalize()); });
    },
  };
}
const glyph = (s: string, c: string) => smat(tex('glyph-' + s + c, 128, 160, (g, w, h) => { g.clearRect(0, 0, w, h); text(g, s, w / 2, h / 2 + 6, 150, c, {stroke: '#15121c', sw: 16}); }), 1.15, true);
export const cable: Builder = (root) => {
  backdrop(root, ['#12203a', '#25406a']);
  floor(root, 14, 12, tmat(tiled(tileTex('cable', '#dfe6ea', '#bcc7cf', 2, '#d3dbe0'), 7, 6)));
  box(root, 9, 5.4, 0.3, '#2c4a78', 0, 2.7, -1.3); box(root, 9, 0.2, 0.34, '#1d3356', 0, 0.1, -1.29);
  // Two freezers, each with a network box on top: one for the question and the advice, both for the two answers.
  const units = [11, 23].map((seed) => {
    const g = grp(root, 0, 0, -0.5), fz = freezer(g, 0, 0, {seed});
    box(g, 0.34, 0.12, 0.24, '#e6e9ec', 0.3, 2.36, 0.04);
    const led = soft(ball(g, 0.032, lamp('#3fe07a', 2), 0.19, 2.36, 0.17));
    return {g, fz, led};
  });
  /** where the cable goes into the network box of a freezer standing at x, scaled s */
  const port = (x: number, sc: number): V => [x + 0.3 * sc, 2.42 * sc + 0.05, -0.5 + 0.04 * sc];
  const cloud = cloud3d(root, 0, 0, -0.55, 0.6);
  soft(panel(cloud, 0.46, 0.46, smat(tex('globe', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.strokeStyle = '#2f6fc0'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); g.beginPath(); g.ellipse(64, 64, 22, 50, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(14, 64); g.lineTo(114, 64); g.moveTo(22, 38); g.lineTo(106, 38); g.moveTo(22, 90); g.lineTo(106, 90); g.stroke(); }), 1, true), 0.06, 0.02, 0.24));
  const lines = [rope(root, 16, 0.02, '#35a0ff'), rope(root, 14, 0.02, '#35a0ff')];
  const plugs = [0, 1].map(() => { const g = grp(root); box(g, 0.1, 0.12, 0.08, '#f4f6f8', 0, 0, 0); box(g, 0.05, 0.06, 0.05, '#c9a94f', 0, -0.085, 0); return g; });
  const pulses = Array.from({length: 4}, () => soft(ball(root, 0.045, lit('#bfe9ff', 2.2))));
  const qs = [0, 1].map(() => soft(panel(root, 0.52, 0.65, glyph('?', '#ffe14a'), 0, 0, 0.1)));
  const lock = grp(root); box(lock, 0.32, 0.26, 0.1, '#e7b93c', 0, 0, 0); torus(lock, 0.1, 0.03, '#8f959e', 0, 0.19, 0); cyl(lock, 0.035, 0.02, '#15121c', 0, 0, 0.06).rotation.x = Math.PI / 2;
  const spark = soft(panel(root, 0.5, 0.5, smat(tex('spark', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.fillStyle = '#ffe14a'; g.strokeStyle = '#15121c'; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 26 : 58; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } g.closePath(); g.fill(); g.stroke(); }), 1.3, true)));
  const badge = (letter: string, bg: string, fg: string) => soft(panel(root, 0.4, 0.4, smat(tex('badge-' + letter, 160, 160, (g) => { g.clearRect(0, 0, 160, 160); g.fillStyle = bg; g.strokeStyle = '#15121c'; g.lineWidth = 11; g.beginPath(); g.arc(80, 80, 70, 0, 7); g.fill(); g.stroke(); text(g, letter, 80, 86, 104, fg); }), 1.08, true)));
  const badges = [badge('A', '#e3342f', '#ffffff'), badge('B', '#ffe14a', '#15121c')];
  const cur = cursor3d(root, 0.36);
  const tech = actor(root, TECH, {pull: {expr: 'stern', pose: 'point'}, done: {expr: 'smile', pose: 'hips'}}, 0.56, 0, 0.3, {scale: 0.94});
  tech.mesh.scale.x = -1;                                                                              // mirrored: pointing at the cable
  const SAG = 0.25;
  return {
    light: () => ({...LIGHT.cold, amb: 1.55}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, choice = v === 'choice', sc = choice ? 0.74 : 0.8, xs = choice ? [-0.64, 0.64] : [-0.55, 9];
      units.forEach((u, i) => { u.g.visible = choice || i === 0; u.g.position.x = xs[i]; u.g.scale.setScalar(sc); u.fz.set(-18, f); });
      cloud.position.set(choice ? 0 : 0.45, (choice ? 2.14 : 2.3) + 0.03 * Math.sin(f * 0.08), -0.55); cloud.scale.setScalar(choice ? 0.55 : 0.6);
      const up = cloud.position.y - (choice ? 2.14 : 2.3);
      // --- one freezer: plugged in ("why"), then unplugged on "off" and left swinging from the cloud
      const P = port(xs[0], sc), C: V = [0.2, 2.18 + up, -0.5];
      const tau = v === 'unplug' ? f - W(220) : -1, L = Math.hypot(P[0] - C[0], P[1] + 0.06 - C[1]), th0 = Math.atan2(P[0] - C[0], C[1] - P[1] - 0.06);
      const th = tau < 0 ? th0 : th0 * Math.exp(-tau / 18) * Math.cos(0.34 * tau), end: V = tau < 0 ? [P[0], P[1] + 0.06, P[2]] : [C[0] + L * Math.sin(th), C[1] - L * Math.cos(th), lerp(P[2], C[2], clamp01(tau / 8))];
      // --- two freezers: A's cable hangs loose between them, B's cable stays in and gets a padlock
      const PB = port(xs[1], sc), CA: V = [-0.16, 2.02 + up, -0.5], CB: V = [0.16, 2.02 + up, -0.5], sway = 0.09 * Math.sin(f * 0.07), endA: V = [CA[0] + 0.62 * Math.sin(sway), CA[1] - 0.62 * Math.cos(sway), -0.5], endB: V = [PB[0], PB[1] + 0.06, PB[2]];
      if (choice) { lines[0].set(endA, CA, 0.01); lines[1].set(endB, CB, 0.1); plugs[0].position.set(...endA); plugs[0].rotation.z = sway; plugs[1].position.set(...endB); plugs[1].rotation.z = 0; }
      else { lines[0].set(end, C, tau < 0 ? SAG : lerp(SAG, 0.02, smooth(tau, 0, 6))); lines[1].set(end, C, 0, false); plugs[0].position.set(...end); plugs[0].rotation.z = tau < 0 ? 0 : th; }
      plugs[1].visible = choice;
      const dead = '#ff3a3a', live = '#3fe07a';
      (units[0].led.material as THREE.MeshBasicMaterial).color.set(choice || tau >= 0 ? dead : live).multiplyScalar(choice || tau >= 0 ? 2.2 : 1.6 + 0.8 * Math.sin(f * 0.4));
      (units[1].led.material as THREE.MeshBasicMaterial).color.set(live).multiplyScalar(1.6 + 0.8 * Math.sin(f * 0.4));
      pulses.forEach((m, i) => {                                                                       // data going up and down the cable while it is plugged in
        const u = (f * 0.03 + i / 4) % 1; m.visible = choice || tau < 0;
        m.position.copy(choice ? lines[1].at(endB, CB, 0.1, i % 2 ? u : 1 - u) : lines[0].at(end, C, SAG, i % 2 ? u : 1 - u)); m.position.z += 0.03;
      });
      qs.forEach((q, i) => { q.visible = v === 'why'; q.scale.setScalar(pop(f, W(66) + i * 5, 8) || 0.001); q.position.set(i ? 0.76 : 0.28, (i ? 1.52 : 1.16) + 0.05 * Math.sin(f * 0.15 + i * 2), 0.1); q.rotation.z = (i ? -1 : 1) * 0.16; });
      spark.visible = tau >= 0 && tau < 8; spark.position.set(P[0], P[1] + 0.04, P[2] + 0.2); spark.scale.setScalar(pop(f, W(220), 5) || 0.001); spark.quaternion.copy(cam.quaternion);
      tech.node.visible = v === 'unplug'; tech.show(tau >= 6 ? 'done' : 'pull'); tech.node.position.y = hop(f, W(220), 0.12, 8); tech.tick(f, cam);
      // the letters of the two answers, on the doors
      badges.forEach((b, i) => { b.visible = choice && f >= W(i ? 232 : 230); b.position.set(xs[i], 1.0, -0.5 + 0.47 * sc); b.scale.setScalar(pop(f, W(i ? 232 : 230), 8) || 0.001); b.rotation.z = (i ? 1 : -1) * 0.08; });
      const mid = lines[1].at(endB, CB, 0.1, 0.5);
      lock.visible = choice && f >= W(232) + 2; lock.position.set(mid.x, mid.y - 0.03, mid.z + 0.1); lock.scale.setScalar(pop(f, W(232) + 2, 8) || 0.001);
      // The tail: the pointer is back. It goes for B's cable and bounces off the padlock, tries A's plug, which hangs
      // loose and only swings, and drops out of the picture. Either answer keeps it out.
      const a0 = TOTAL - 44, k1 = smooth(f, a0, a0 + 8), k2 = smooth(f, a0 + 11, a0 + 18), fall = smooth(f, a0 + 25, a0 + 39);
      const from: V = [1.7, 3.0, 0], hit: V = [mid.x + 0.06, mid.y - 0.02, 0], tap: V = [endA[0] + 0.07, endA[1] + 0.02, 0];
      cur.visible = choice && f >= a0;
      cur.position.set(lerp(lerp(from[0], hit[0], k1), tap[0], k2) + shake(f, a0 + 8, 0.08, 8) - 0.12 * fall, lerp(lerp(from[1], hit[1], k1), tap[1], k2) - 2.9 * fall * fall, -0.5 + 0.3);
      cur.rotation.z = 0.25 * (1 - k1) - 1.9 * fall; cur.scale.setScalar(0.42);
      lock.rotation.z = choice ? shake(f, a0 + 8, 0.3, 12) : 0;
      if (choice && f >= a0 + 18) { const u = f - a0 - 18, sw = sway - 0.6 * Math.exp(-u / 11) * Math.sin(u * 0.5), e: V = [CA[0] + 0.62 * Math.sin(sw), CA[1] - 0.62 * Math.cos(sw), -0.5]; lines[0].set(e, CA, 0.01); plugs[0].position.set(...e); plugs[0].rotation.z = sw; }
    },
  };
};

// ------------------------------------------------------------------ the technician's wall: every store, day and night
export const tech: Builder = (root) => {
  backdrop(root, ['#2a2018', '#3a2c22']);
  floor(root, 14, 12, tmat(tiled(woodTex('tech', '#8a6a4a', '#5a4030'), 4, 4)));
  box(root, 9, 5.4, 0.3, '#e9dcc0', 0, 2.7, -1.65);
  const dash = (night: boolean) => tex('dash-' + night, 640, 360, (g, w, h) => {
    g.fillStyle = night ? '#0a1322' : '#0f2030'; g.fillRect(0, 0, w, h); g.fillStyle = '#12303a'; g.fillRect(0, 0, w, 54);
    text(g, 'ALL STORES · LIVE', 150, 29, 26, '#9ff0ff', {font: 'Montserrat', spacing: 2});
    text(g, night ? '03:00' : '15:00', w - 80, 29, 30, '#ffffff');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
      const x = 90 + i * 153, y = 116 + j * 96; freezerIcon(g, x - 28, y, 62); text(g, '−18°', x + 30, y - 10, 30, '#7fe3ff');
      g.strokeStyle = '#3fe07a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 12, y + 20); g.lineTo(x + 24, y + 32); g.lineTo(x + 48, y + 6); g.stroke();
    }
  });
  const scr = new THREE.MeshBasicMaterial({map: dash(false)});
  box(root, 2.26, 1.32, 0.08, '#15171d', 0, 1.7, -1.46); panel(root, 2.12, 1.19, scr, 0, 1.7, -1.415);
  // a strip of window over the monitor: the sun crosses it, the sky goes dark, the moon follows
  const sky = lamp('#8fd0ff', 1);
  box(root, 2.5, 0.72, 0.06, '#f4efe4', 0, 2.78, -1.49); panel(root, 2.34, 0.56, sky, 0, 2.78, -1.455);
  for (const x of [-0.39, 0.39]) box(root, 0.04, 0.56, 0.03, '#f4efe4', x, 2.78, -1.43); box(root, 2.6, 0.05, 0.14, '#f4efe4', 0, 2.44, -1.42);
  const sun = soft(ball(root, 0.12, lit('#ffd43b', 1.8))), moon = soft(ball(root, 0.1, lit('#f4f8ff', 1.5)));
  const starsN = [[-0.9, 2.92], [-0.5, 2.66], [0.1, 2.94], [0.62, 2.7], [0.98, 2.9]].map(([x, y]) => soft(ball(root, 0.018, lamp('#ffffff', 1.4), x, y, -1.45)));
  const dusk = soft(panel(root, 9, 5.4, new THREE.MeshBasicMaterial({color: '#0a1030', transparent: true, opacity: 0, depthWrite: false}), 0, 2.7, -1.494));
  box(root, 2.6, 0.07, 0.8, '#5a4030', 0, 0.86, -0.95); for (const x of [-1.2, 1.2]) box(root, 0.08, 0.84, 0.7, '#4a3426', x, 0.42, -0.95);
  box(root, 0.6, 0.03, 0.2, '#2b2d38', -0.3, 0.915, -0.85); cyl(root, 0.05, 0.11, '#f3f1ea', 0.35, 0.95, -0.9); plant(root, -1.05, -1.0, 0.52).position.y = 0.9;
  const lampOn = soft(ball(root, 0.09, lamp('#ffe9b0', 0), -0.82, 1.2, -0.95)); cyl(root, 0.02, 0.3, '#3d4450', -0.82, 1.05, -0.95);
  const t = actor(root, TECH, {day: {expr: 'smile', pose: 'hips'}, night: {expr: 'neutral', pose: 'phone', prop: 'phone'}}, 0.7, 0, -0.1, {scale: 1.0});
  return {
    light: () => ({...LIGHT.room, amb: 1.4}),
    tick: ({f, cam, shot}) => {
      const N = W(75) + 6, k = smooth(f, N - 5, N + 5), a = Math.PI * clamp01((f - shot.at) / (N + 22 - shot.at));   // night falls on frame N
      scr.map = dash(k > 0.5);
      sun.visible = k < 0.5; moon.visible = k >= 0.5; starsN.forEach((m) => { m.visible = k > 0.6; });
      const arc = (u: number, m: THREE.Mesh) => m.position.set(-0.98 + 1.96 * u, 2.6 + 0.3 * Math.sin(Math.PI * u), -1.44);
      arc(clamp01((f - shot.at) / (N + 2 - shot.at)), sun); arc(0.08 + 0.5 * clamp01((f - N) / 24), moon);
      sky.color.set('#8fd0ff').lerp(new THREE.Color('#ff9a5a'), Math.sin(Math.PI * clamp01(k * 1.4)) * 0.8).lerp(new THREE.Color('#0d1638'), k);
      (dusk.material as THREE.MeshBasicMaterial).opacity = 0.45 * k; (lampOn.material as THREE.MeshBasicMaterial).color.set('#ffe9b0').multiplyScalar(2.2 * k);
      t.show(k > 0.5 ? 'night' : 'day'); t.node.position.y = hop(f, N, 0.08, 8); t.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ a lecture hall: the professor's line
export const lecture: Builder = (root) => {
  backdrop(root, ['#2a2018', '#3a2c22']);
  floor(root, 14, 12, tmat(tiled(woodTex('hall', '#8a6a4a', '#5a4030'), 4, 4)));
  box(root, 9, 5.4, 0.3, '#dccfb8', 0, 2.7, -1.55);
  box(root, 2.16, 1.52, 0.08, '#6b4a2d', -0.32, 1.62, -1.36);
  panel(root, 2.0, 1.36, smat(tex('chalk', 600, 408, (g, w, h) => {
    g.fillStyle = '#2f5a4a'; g.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 30 * r(), 3); }
    g.strokeStyle = '#f4f1e6'; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeRect(46, 70, 150, 270); g.beginPath(); g.moveTo(46, 160); g.lineTo(196, 160); g.moveTo(172, 100); g.lineTo(172, 140); g.moveTo(172, 190); g.lineTo(172, 250); g.stroke();                   // a fridge in chalk
    g.beginPath(); g.moveTo(330, 196); g.quadraticCurveTo(276, 156, 218, 200); g.moveTo(218, 200); g.lineTo(246, 178); g.moveTo(218, 200); g.lineTo(250, 214); g.stroke();                                // arrow
    text(g, 'SECURITY', 440, 112, 62, '#f4f1e6'); text(g, 'RISK?', 440, 184, 78, '#ffe14a');
    g.lineWidth = 5; g.beginPath(); g.moveTo(340, 232); g.lineTo(540, 232); g.stroke();
    ['UPDATED?', 'LOCKED?'].forEach((n, i) => { g.strokeRect(340, 262 + i * 52, 30, 30); text(g, n, 386, 279 + i * 52, 34, '#f4f1e6', {align: 'left'}); });
  }), 1), -0.32, 1.62, -1.315);
  box(root, 2.0, 0.05, 0.13, '#6b4a2d', -0.32, 0.9, -1.28); for (const [x, c] of [[-1.0, '#f4f1e6'], [-0.82, '#ffe14a'], [0.3, '#ff9ab0']] as const) box(root, 0.12, 0.03, 0.03, c, x, 0.94, -1.27);
  const prof = actor(root, PROF, {point: {expr: 'smile', pose: 'point'}, shrug: {expr: 'smile', pose: 'shrug'}}, 0.82, 0, -0.45, {scale: 1.06});
  prof.mesh.scale.x = -1;                                                                              // mirrored: pointing at the board
  crowd(root, -1.25, 1.3, [1.7, 2.5], -0.98, 7, ['#2a2430', '#3a2f3a', '#20242c']);
  return {
    light: () => ({...LIGHT.warm, amb: 1.3, sky: '#ffe9cc'}),
    tick: ({f, cam}) => { prof.show(f >= W(81) ? 'shrug' : 'point'); prof.node.position.y = hop(f, W(80), 0.09, 8) + hop(f, W(81), 0.07, 8); prof.tick(f, cam); },
  };
};

// ------------------------------------------------------------------ the line-up: the usual suspects, and a fridge
export const lineup: Builder = (root) => {
  backdrop(root, ['#14161d', '#262a36']);
  floor(root, 14, 12, '#4a4f5a');
  panel(root, 7, 4.6, smat(tex('heights', 700, 460, (g, w, h) => {
    g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) { const y = h - 30 - i * 34; g.fillStyle = i % 2 ? '#3a3f4a' : '#8a8f9a'; g.fillRect(0, y, w, i % 2 ? 5 : 2.5); if (i % 2) for (const x of [56, w / 2, w - 56]) text(g, String(100 + i * 10), x, y - 14, 22, '#3a3f4a'); }
  }), 1), 0, 2.3, -1.25);
  const stool = (x: number, hgt: number) => { cyl(root, 0.2, 0.05, '#6b4a2d', x, hgt, -0.45); for (let i = 0; i < 3; i++) { const a = i * 2.094; rod(root, [x + 0.14 * Math.cos(a), hgt, -0.45 + 0.14 * Math.sin(a)], [x + 0.22 * Math.cos(a), 0, -0.45 + 0.22 * Math.sin(a)], 0.02, '#5a4030'); } };
  const tag = (x: number, y: number, n: string) => panel(root, 0.3, 0.2, smat(signTex('tag-' + n, 150, 100, '#fffdf4', '#15121c', [[n, 76]], {border: '#15121c'}), 1.05), x, y, -0.02);
  // 1: a router; 2: a laptop
  stool(-1.0, 0.95); const router = grp(root, -1.0, 0.98, -0.45); box(router, 0.5, 0.1, 0.3, '#f4f6f8', 0, 0.05, 0); for (const x of [-0.2, 0, 0.2]) rod(router, [x, 0.1, -0.1], [x * 1.3, 0.5, -0.12], 0.016, '#2b2d38');
  const leds = [-0.16, -0.08, 0, 0.08].map((x) => soft(ball(router, 0.018, lamp('#3fe07a', 2), x, 0.06, 0.155)));
  stool(-0.3, 0.8); const lap = grp(root, -0.3, 0.83, -0.45); box(lap, 0.5, 0.03, 0.34, '#8f96a3', 0, 0.015, 0); const lid = box(lap, 0.5, 0.34, 0.025, '#3a4050', 0, 0.19, -0.19); lid.rotation.x = -0.25;
  panel(lap, 0.44, 0.28, lit('#9fe0ff', 1.1), 0, 0.19, -0.172).rotation.x = -0.25;
  tag(-1.0, 0.6, '1'); tag(-0.3, 0.6, '2');
  // 3: the fridge, with a halo
  const fridge = fridge3d(root, 0.6, -0.45, 1.0); tag(0.6, 0.62, '3').position.z = -0.08;
  panel(fridge, 0.66, 0.5, smat(tex('fridge-face', 264, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (const s of [-1, 1]) { g.fillStyle = '#ffffff'; g.strokeStyle = '#15121c'; g.lineWidth = 7; g.beginPath(); g.ellipse(w / 2 + s * 48, 78, 30, 36, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#15121c'; g.beginPath(); g.arc(w / 2 + s * 48 - 9, 62, 13, 0, 7); g.fill(); }
    g.fillStyle = '#15121c'; g.beginPath(); g.ellipse(w / 2 + 6, 150, 13, 16, 0, 0, 7); g.fill();                                       // whistling
  }), 1, true), 0, 1.5, 0.356);
  const halo = soft(torus(root, 0.3, 0.035, lit('#ffe14a', 2.2), 0.6, 2.02, -0.45)); halo.rotation.x = 1.25;
  const note = soft(panel(root, 0.3, 0.36, smat(tex('note', 96, 116, (g) => { g.clearRect(0, 0, 96, 116); g.fillStyle = '#15121c'; g.beginPath(); g.ellipse(34, 90, 20, 14, -0.3, 0, 7); g.fill(); g.fillRect(48, 18, 8, 74); g.beginPath(); g.moveTo(48, 18); g.quadraticCurveTo(84, 22, 84, 54); g.quadraticCurveTo(70, 36, 48, 40); g.fill(); }), 1, true)));
  beam(root, 0.14, 1.0, 3.6, '#fff6d0', 0.16, 0.6, 3.9, -0.45); pool(root, 0.95, '#fff2c0', 0.5, 0.6, -0.3);
  return {
    light: () => ({...LIGHT.show, amb: 1.1}),
    tick: ({f, t, cam}) => {
      leds.forEach((l, i) => (l.material as THREE.MeshBasicMaterial).color.set('#3fe07a').multiplyScalar((Math.floor(f / 3) + i) % 3 ? 0.4 : 2.4));
      fridge.position.y = hop(f, W(83), 0.08, 9); fridge.rotation.z = 0.03 * Math.sin(f * 0.12);
      halo.position.y = 2.02 + 0.03 * Math.sin(f * 0.15) + fridge.position.y; halo.scale.setScalar(pop(f, W(83) + 2, 8) || 0.001);
      const u = (f * 0.02) % 1; note.position.set(0.98 + 0.2 * u, 1.55 + 0.5 * u, 0.0); note.quaternion.copy(cam.quaternion); note.scale.setScalar(Math.sin(Math.PI * u)); note.visible = t > 6;
    },
  };
};
export {clamp01, fridge3d, cursor3d};
