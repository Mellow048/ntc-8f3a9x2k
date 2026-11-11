// Sets of the fridge hack short, part 2: the two lecterns, the cable to the cloud, the technician's wall, the lecture
// hall, the line-up.
import * as THREE from 'three';
import {backdrop, ball, beam, box, clamp01, cyl, floor, foldTex, grp, hop, lamp, lerp, lit, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus, vgrad, woodTex,
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
  for (const s of [-1, 1]) { box(paris, 1.0, 5.2, 0.3, tmat(tiled(foldTex('cur-p', '#27355e', '#151d38'), 1, 1)), s * 2.35, 2.6, -1.3); box(tehran, 1.0, 5.2, 0.3, tmat(tiled(foldTex('cur-t', '#1f5a52', '#10332e'), 1, 1)), s * 2.35, 2.6, -1.3); }
  lectern(paris, 0, 0.35, '#3a2a22', plaque('PARIS', '#27355e')); lectern(tehran, 0, 0.35, '#2e2a24', plaque('TEHRAN', '#1f5a52'));
  const fr = actor(root, SPOKES_PARIS, {idle: {expr: 'stern'}, point: {expr: 'stern', pose: 'point'}, paper: {expr: 'stern', pose: 'hold', prop: 'paper'}, sure: {expr: 'stern', pose: 'hips'}}, 0, 0, -0.3, {scale: 1.06, res: 1.2});
  const ir = actor(root, SPOKES_TEHRAN, {idle: {expr: 'neutral'}, deny: {expr: 'stern', pose: 'cross'}, paper: {expr: 'neutral', pose: 'hold', prop: 'paper'}, read: {expr: 'neutral', pose: 'hold', prop: 'paper'}}, 0, 0, -0.3, {scale: 1.06, res: 1.2});
  // "ice cold": frost on the lectern, icicles under its top, snow coming down
  const ice = grp(tehran); const icicles = [-0.42, -0.28, -0.1, 0.06, 0.24, 0.4].map((x, i) => { const c = soft(box(ice, 0.05, 0.3, 0.05, lit('#dff6ff', 1.25), x, 1.0, 0.62)); c.userData = {len: 0.5 + (i * 37 % 10) / 14}; return c; });
  const frost = soft(panel(ice, 0.8, 1.02, new THREE.MeshBasicMaterial({map: tex('lectern-frost', 128, 160, (g, w, h) => { const r = rng(21); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(235,250,255,${0.25 + r() * 0.6})`; const y = r() ** 2 * h; g.fillRect(r() * w, y, 2 + r() * 5, 2 + r() * 5); } }), transparent: true, opacity: 0, depthWrite: false}), 0, 0.62, 0.59));
  const flakes = Array.from({length: 26}, (_, i) => soft(ball(ice, 0.022 + (i % 3) * 0.008, lit('#ffffff', 1.3))));
  return {
    light: (v) => v === 'deny' || v === 'ice' || v === 'read' ? {...LIGHT.show, sky: '#d6f4f0', amb: 1.25} : {...LIGHT.show, sky: '#d8e2ff', amb: 1.25},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, inParis = v === 'accuse' || v === 'paris' || v === 'sure';
      paris.visible = fr.node.visible = inParis; tehran.visible = ir.node.visible = !inParis;
      if (v === 'accuse') { fr.show(f >= W(17) ? 'point' : 'idle'); fr.node.position.y = hop(f, W(17), 0.1, 8); }
      else if (v === 'paris') { fr.show(f >= W(155) ? 'paper' : 'idle'); fr.node.position.y = hop(f, W(155), 0.08, 8); }
      else if (v === 'sure') { fr.show('sure'); fr.node.position.y = hop(f, W(179), 0.07, 8); }
      if (v === 'deny') { ir.show('deny'); ir.node.position.x = 0.035 * Math.sin(f * 1.1) * clamp01(1 - t / 22); ir.node.position.y = 0; }
      else if (v === 'ice') { ir.show(f >= W(190) ? 'paper' : 'idle'); ir.node.position.set(0, hop(f, W(190), 0.08, 8), -0.3); }
      else if (v === 'read') { ir.show('read'); ir.node.position.set(0, 0, -0.3); }
      const cold = v === 'ice' ? smooth(f, W(191), W(193) + 8) : v === 'read' ? 1 : 0;
      ice.visible = cold > 0; (frost.material as THREE.MeshBasicMaterial).opacity = 0.95 * cold;
      icicles.forEach((c) => { const len = c.userData.len * cold; c.scale.set(1, Math.max(0.01, len), 1); c.position.y = 1.11 - 0.15 * len; });
      flakes.forEach((m, i) => { const u = ((f * 0.012 + i * 0.137) % 1); m.visible = cold > 0.3; m.position.set(-1.4 + (i * 0.61 % 1) * 2.8 + 0.1 * Math.sin(f * 0.07 + i), 3.0 - 2.9 * u, 0.2 + (i % 5) * 0.2); });
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
  box(root, 9, 5.4, 0.3, '#2c4a78', 0, 2.7, -1.3);
  const unit = grp(root, -0.62, 0, -0.5); const fz = freezer(unit, 0, 0, {seed: 11}); unit.scale.setScalar(0.74);
  const socket = box(root, 0.14, 0.12, 0.08, '#15202b', 0, 0, 0);
  const cloud = cloud3d(root, 0.72, 1.96, -0.55, 0.62), grey = cloud3d(root, 0.72, 1.96, -0.56, 0.62, '#8f9aa6');
  const globe = soft(panel(cloud, 0.42, 0.42, smat(tex('globe', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.strokeStyle = '#2f6fc0'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); g.beginPath(); g.ellipse(64, 64, 22, 50, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(14, 64); g.lineTo(114, 64); g.moveTo(22, 38); g.lineTo(106, 38); g.moveTo(22, 90); g.lineTo(106, 90); g.stroke(); }), 1, true), 0.06, 0, 0.2));
  const line = rope(root, 16, 0.022, '#35a0ff'), line2 = rope(root, 14, 0.022, '#35a0ff');
  const plug = grp(root); box(plug, 0.11, 0.08, 0.07, '#e6e9ec', 0, 0, 0); box(plug, 0.05, 0.03, 0.05, '#c9a94f', -0.07, 0, 0);
  const pulses = Array.from({length: 4}, () => soft(ball(root, 0.045, lit('#bfe9ff', 2.2))));
  const qs = [0, 1].map((i) => soft(panel(root, 0.5, 0.62, glyph('?', '#ffe14a'), i ? 1.02 : 0.2, i ? 1.35 : 2.2, 0.1)));
  const lock = grp(root); box(lock, 0.34, 0.28, 0.1, '#e7b93c', 0, 0, 0); torus(lock, 0.1, 0.03, '#8f959e', 0, 0.2, 0); cyl(lock, 0.035, 0.02, '#15121c', 0, 0, 0.06).rotation.x = Math.PI / 2;
  const spark = soft(panel(root, 0.5, 0.5, smat(tex('spark', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.fillStyle = '#ffe14a'; g.strokeStyle = '#15121c'; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 26 : 58; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } g.closePath(); g.fill(); g.stroke(); }), 1.3, true)));
  const cur = cursor3d(root, 0.36);
  const tech = actor(root, TECH, {pull: {expr: 'stern', pose: 'point'}, done: {expr: 'smile', pose: 'hips'}}, 0.98, 0, 0.5, {scale: 0.98});
  tech.mesh.scale.x = -1;                                                                              // mirrored: reaching toward the freezer
  return {
    light: () => ({...LIGHT.cold, amb: 1.55}),
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, choice = v === 'choice';
      unit.position.x = choice ? 0 : -0.62; fz.set(-18, f);
      const sx = (choice ? 0 : -0.62) + 0.3, A: V = [sx, 1.56, -0.2], B: V = [choice ? 0.92 : 0.5, choice ? 2.02 : 1.86, -0.5];
      socket.position.set(sx - 0.02, 1.56, -0.25);
      const out = v === 'unplug' ? smooth(f, W(220), W(220) + 9) : 0;                                 // the plug comes out on "off"
      const end: V = [lerp(A[0], A[0] + 0.5, out), lerp(A[1], 0.62, out * out), lerp(A[2], 0.1, out)];
      line.set(choice ? [-0.92, 0.6, 0.15] : end, choice ? [-0.5, 0.06, 0.3] : B, choice ? -0.25 : lerp(0.34, 0.1, out), true);
      line2.set(A, B, 0.3, choice);
      plug.visible = !choice || true; plug.position.set(choice ? -0.5 : end[0], choice ? 0.06 : end[1], choice ? 0.3 : end[2]); plug.rotation.z = choice ? -0.4 : -0.9 * out;
      const gone = v === 'unplug' ? smooth(f, W(220) + 4, W(222) + 6) : 0;
      cloud.visible = !choice || true; grey.visible = false;
      cloud.position.set(choice ? 0.98 : 0.72 + 0.5 * gone, (choice ? 2.08 : 1.96) + 0.05 * Math.sin(f * 0.08) + 0.3 * gone, -0.55); cloud.scale.setScalar(0.62 * (1 - 0.35 * gone));
      globe.visible = gone < 0.5;
      pulses.forEach((m, i) => { const u = (f * 0.03 + i / 4) % 1, on = (v === 'why' || choice) && true; m.visible = on; m.position.copy(line2.at(A, B, 0.3, choice ? u : u)); if (!choice) m.position.copy(line.at(end, B, 0.34, i % 2 ? u : 1 - u)); });
      qs.forEach((q, i) => { q.visible = v === 'why'; q.scale.setScalar(pop(f, W(66) + i * 5, 8)); q.position.y = (i ? 1.3 : 2.16) + 0.05 * Math.sin(f * 0.15 + i * 2); q.rotation.z = (i ? -1 : 1) * 0.16; });
      spark.visible = v === 'unplug' && f >= W(220) && f < W(220) + 8; spark.position.set(A[0] + 0.08, A[1], 0.0); spark.scale.setScalar(pop(f, W(220), 5)); spark.quaternion.copy(cam.quaternion);
      tech.node.visible = v === 'unplug'; tech.show(f >= W(220) + 6 ? 'done' : 'pull'); tech.node.position.y = hop(f, W(220), 0.1, 8); tech.tick(f, cam);
      // the two answers: the cable pulled out and lying on the floor, or the cable left in with a padlock on it
      lock.visible = choice; const mid = line2.at(A, B, 0.3, 0.5); lock.position.set(mid.x, mid.y - 0.02, mid.z + 0.08); lock.scale.setScalar(choice ? pop(f, W(234) + 4, 8) || 0.001 : 1);
      // the tail: the pointer comes down the line from the cloud, meets the padlock, and drops out of the picture
      const a0 = TOTAL - 42, slide = smooth(f, a0, a0 + 12), bonk = f >= a0 + 12, fall = smooth(f, a0 + 22, a0 + 34);
      cur.visible = choice && f >= a0; const pc = line2.at(A, B, 0.3, lerp(1, 0.58, slide));
      cur.position.set(pc.x + 0.03 + (bonk ? shake(f, a0 + 12, 0.07, 9) : 0) + 0.3 * fall, pc.y + 0.02 - 2.6 * fall * fall, pc.z + 0.14); cur.rotation.z = 2.4 + 1.4 * fall;
      if (choice && bonk) lock.rotation.z = shake(f, a0 + 12, 0.25, 12); else lock.rotation.z = 0;
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
  // the sun crosses the top of the wall, then the moon
  const sun = soft(ball(root, 0.14, lit('#ffd43b', 1.8))), moon = soft(ball(root, 0.12, lit('#e6f0ff', 1.5)));
  const dusk = soft(panel(root, 9, 5.4, new THREE.MeshBasicMaterial({color: '#0a1030', transparent: true, opacity: 0, depthWrite: false}), 0, 2.7, -1.38));
  box(root, 2.6, 0.07, 0.8, '#5a4030', 0, 0.86, -0.95); for (const x of [-1.2, 1.2]) box(root, 0.08, 0.84, 0.7, '#4a3426', x, 0.42, -0.95);
  box(root, 0.6, 0.03, 0.2, '#2b2d38', -0.3, 0.915, -0.85); cyl(root, 0.05, 0.11, '#f3f1ea', 0.35, 0.95, -0.9); plant(root, -1.05, -1.0, 0.52).position.y = 0.9;
  const lampOn = soft(ball(root, 0.09, lamp('#ffe9b0', 0), -0.82, 1.2, -0.95)); cyl(root, 0.02, 0.3, '#3d4450', -0.82, 1.05, -0.95);
  const t = actor(root, TECH, {day: {expr: 'smile', pose: 'hips'}, night: {expr: 'neutral', pose: 'phone', prop: 'phone'}}, 0.9, 0, -0.1, {scale: 1.0});
  return {
    light: () => ({...LIGHT.room, amb: 1.4}),
    tick: ({f, cam, shot}) => {
      const k = smooth(f, W(75) - 2, W(77) + 6), a = Math.PI * clamp01((f - shot.at) / (W(77) + 14 - shot.at));
      scr.map = dash(k > 0.5);
      sun.visible = k < 0.5; moon.visible = k >= 0.5;
      const arc = (u: number, m: THREE.Mesh) => m.position.set(-1.0 + 2.0 * u, 2.46 + 0.0 * Math.sin(Math.PI * u), -1.4);
      arc(clamp01(a / Math.PI * 1.6), sun); arc(clamp01((a / Math.PI - 0.5) * 1.6), moon);
      (dusk.material as THREE.MeshBasicMaterial).opacity = 0.5 * k; (lampOn.material as THREE.MeshBasicMaterial).color.set('#ffe9b0').multiplyScalar(2.2 * k);
      t.show(k > 0.5 ? 'night' : 'day'); t.node.position.y = hop(f, W(75) - 1, 0.08, 8); t.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ a lecture hall: the professor's line
export const lecture: Builder = (root) => {
  backdrop(root, ['#2a2018', '#3a2c22']);
  floor(root, 14, 12, tmat(tiled(woodTex('hall', '#8a6a4a', '#5a4030'), 4, 4)));
  box(root, 9, 5.4, 0.3, '#dccfb8', 0, 2.7, -1.55);
  box(root, 2.56, 1.52, 0.08, '#6b4a2d', -0.1, 1.62, -1.36);
  panel(root, 2.4, 1.36, smat(tex('chalk', 720, 408, (g, w, h) => {
    g.fillStyle = '#2f5a4a'; g.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 30 * r(), 3); }
    g.strokeStyle = '#f4f1e6'; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeRect(96, 70, 150, 270); g.beginPath(); g.moveTo(96, 160); g.lineTo(246, 160); g.moveTo(222, 100); g.lineTo(222, 140); g.moveTo(222, 190); g.lineTo(222, 250); g.stroke();                 // a fridge in chalk
    g.beginPath(); g.moveTo(420, 196); g.quadraticCurveTo(340, 150, 268, 200); g.moveTo(268, 200); g.lineTo(296, 178); g.moveTo(268, 200); g.lineTo(300, 214); g.stroke();                                // arrow
    text(g, 'SECURITY', 540, 120, 62, '#f4f1e6'); text(g, 'RISK?', 540, 190, 76, '#ffe14a');
    g.lineWidth = 5; g.beginPath(); g.moveTo(430, 232); g.lineTo(650, 232); g.stroke();
    ['UPDATED?', 'LOCKED?'].forEach((s, i) => { g.strokeRect(430, 262 + i * 52, 30, 30); text(g, s, 478, 279 + i * 52, 34, '#f4f1e6', {align: 'left'}); });
  }), 1), -0.1, 1.62, -1.315);
  box(root, 2.4, 0.05, 0.13, '#6b4a2d', -0.1, 0.9, -1.28); for (const [x, c] of [[-0.9, '#f4f1e6'], [-0.72, '#ffe14a'], [0.6, '#ff9ab0']] as const) box(root, 0.12, 0.03, 0.03, c, x, 0.94, -1.27);
  const prof = actor(root, PROF, {point: {expr: 'smile', pose: 'point'}, shrug: {expr: 'smile', pose: 'shrug'}}, 1.0, 0, -0.45, {scale: 1.02});
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
  stool(-0.98, 0.95); const router = grp(root, -0.98, 0.98, -0.45); box(router, 0.5, 0.1, 0.3, '#f4f6f8', 0, 0.05, 0); for (const x of [-0.2, 0, 0.2]) rod(router, [x, 0.1, -0.1], [x * 1.3, 0.5, -0.12], 0.016, '#2b2d38');
  const leds = [-0.16, -0.08, 0, 0.08].map((x) => soft(ball(router, 0.018, lamp('#3fe07a', 2), x, 0.06, 0.155)));
  stool(-0.22, 0.8); const lap = grp(root, -0.22, 0.83, -0.45); box(lap, 0.5, 0.03, 0.34, '#8f96a3', 0, 0.015, 0); const lid = box(lap, 0.5, 0.34, 0.025, '#3a4050', 0, 0.19, -0.19); lid.rotation.x = -0.25;
  panel(lap, 0.44, 0.28, lit('#9fe0ff', 1.1), 0, 0.19, -0.172).rotation.x = -0.25;
  tag(-0.98, 0.6, '1'); tag(-0.22, 0.6, '2');
  // 3: the fridge, with a halo
  const fridge = fridge3d(root, 0.72, -0.45, 1.0); tag(0.72, 0.62, '3').position.z = -0.08;
  panel(fridge, 0.66, 0.5, smat(tex('fridge-face', 264, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (const s of [-1, 1]) { g.fillStyle = '#ffffff'; g.strokeStyle = '#15121c'; g.lineWidth = 7; g.beginPath(); g.ellipse(w / 2 + s * 48, 78, 30, 36, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#15121c'; g.beginPath(); g.arc(w / 2 + s * 48 - 9, 62, 13, 0, 7); g.fill(); }
    g.fillStyle = '#15121c'; g.beginPath(); g.ellipse(w / 2 + 6, 150, 13, 16, 0, 0, 7); g.fill();                                       // whistling
  }), 1, true), 0, 1.5, 0.356);
  const halo = soft(torus(root, 0.3, 0.035, lit('#ffe14a', 2.2), 0.72, 2.02, -0.45)); halo.rotation.x = 1.25;
  const note = soft(panel(root, 0.3, 0.36, smat(tex('note', 96, 116, (g) => { g.clearRect(0, 0, 96, 116); g.fillStyle = '#15121c'; g.beginPath(); g.ellipse(34, 90, 20, 14, -0.3, 0, 7); g.fill(); g.fillRect(48, 18, 8, 74); g.beginPath(); g.moveTo(48, 18); g.quadraticCurveTo(84, 22, 84, 54); g.quadraticCurveTo(70, 36, 48, 40); g.fill(); }), 1, true)));
  beam(root, 0.14, 1.0, 3.6, '#fff6d0', 0.16, 0.72, 3.9, -0.45); pool(root, 0.95, '#fff2c0', 0.5, 0.72, -0.3);
  return {
    light: () => ({...LIGHT.show, amb: 1.1}),
    tick: ({f, t, cam}) => {
      leds.forEach((l, i) => (l.material as THREE.MeshBasicMaterial).color.set('#3fe07a').multiplyScalar((Math.floor(f / 3) + i) % 3 ? 0.4 : 2.4));
      fridge.position.y = hop(f, W(83), 0.08, 9); fridge.rotation.z = 0.03 * Math.sin(f * 0.12);
      halo.position.y = 2.02 + 0.03 * Math.sin(f * 0.15) + fridge.position.y; halo.scale.setScalar(pop(f, W(83) + 2, 8) || 0.001);
      const u = (f * 0.02) % 1; note.position.set(1.05 + 0.25 * u, 1.55 + 0.5 * u, 0.0); note.quaternion.copy(cam.quaternion); note.scale.setScalar(Math.sin(Math.PI * u)); note.visible = t > 6;
    },
  };
};
export {clamp01, fridge3d, cursor3d};
