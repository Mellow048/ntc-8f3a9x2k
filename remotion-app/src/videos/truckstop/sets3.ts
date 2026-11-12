// Sets of the truck-stop heist short, part 3: the seven who were charged, the papers, the other truck, the courtroom,
// the scale.
import * as THREE from 'three';
import {backdrop, ball, beam, box, cyl, floor, foldTex, grainTex, grp, hop, lit, mesh, panel, pool, pop, rng, rrect, shake, smat, smooth, soft, tex, text, tiled, tmat, woodTex, type G2} from './kit';
import {actor, CREW, PROSECUTOR, type Actor} from './cast';
import {flagPole, flagUS, glints, halo, signTex, table} from './props';
import {W} from './story';
import {gapTex, INK, jewelBag, LIGHT, rings, type Builder} from './sets';

// ------------------------------------------------------------------ the seven: nobody's face, a number each
/** where each of the seven stands: three in front, four on a step behind */
export const SEVEN: [number, number, number][] = [[-0.7, 0, 0.1], [0, 0, 0.1], [0.7, 0, 0.1], [-1.05, 0.5, -0.9], [-0.35, 0.5, -0.9], [0.35, 0.5, -0.9], [1.05, 0.5, -0.9]];
const outline = () => tex('seven-gone', 300, 500, (g, w, h) => {
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.setLineDash([22, 16]); g.lineCap = 'round';
  g.beginPath(); g.arc(w / 2, 104, 78, 0, 7); g.stroke(); rrect(g, w / 2 - 86, 196, 172, 200, 44); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 40, 396); g.lineTo(w / 2 - 40, 486); g.moveTo(w / 2 + 40, 396); g.lineTo(w / 2 + 40, 486); g.stroke();
});
const planeTex = () => tex('seven-plane', 200, 200, (g) => { g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(178, 100); g.lineTo(120, 86); g.lineTo(74, 22); g.lineTo(56, 26); g.lineTo(82, 86); g.lineTo(40, 84); g.lineTo(24, 62); g.lineTo(12, 66); g.lineTo(22, 100); g.lineTo(12, 134); g.lineTo(24, 138); g.lineTo(40, 116); g.lineTo(82, 114); g.lineTo(56, 174); g.lineTo(74, 178); g.lineTo(120, 114); g.closePath(); g.fill(); g.stroke(); });
export const seven: Builder = (root) => {
  backdrop(root, ['#0b0e1a', '#1a2038']);
  floor(root, 14, 12, tmat(tiled(woodTex('seven-floor', '#4a3b34', '#2a201c'), 4, 4)));
  panel(root, 9, 5.4, tmat(tiled(foldTex('seven-curtain', '#2b3a66', '#18203c', 12), 2, 1)), 0, 2.7, -1.9);
  box(root, 3.4, 0.5, 1.0, '#3a2f2a', 0, 0.25, -0.9); box(root, 3.44, 0.04, 1.04, '#5a463c', 0, 0.5, -0.9);
  const crew: Actor[] = SEVEN.map(([x, y, z], i) => actor(root, CREW(i), {idle: {pose: 'hang'}, deal: {pose: 'both', prop: 'card', text: 'PLEA DEAL', big: true}, not: {pose: 'both', prop: 'card', text: 'NOT GUILTY', big: true}, up: {pose: 'shrug'}}, x, y, z, {scale: 0.92, res: 1.0, wide: true}));
  const gone = SEVEN.map(([x, y, z]) => soft(panel(root, 0.66, 1.1, smat(outline(), 1.1, true), x, y + 1.0, z)));
  const spots = SEVEN.map(([x, y, z]) => pool(root, 0.62, '#fff0c8', 0, x, z, y + 0.016));
  const key = beam(root, 0.14, 0.7, 5.4, '#fff0c8', 0, SEVEN[0][0], 5.4, SEVEN[0][2]);
  const plane = soft(panel(root, 0.5, 0.5, smat(planeTex(), 1.15, true), 0, 0, 0));
  const shade = (k: number, lo = '#3f455c') => '#' + new THREE.Color(lo).lerp(new THREE.Color('#ffffff'), k).getHexString();
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.2, keyI: 0.85}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, take = v === 'three' || v === 'two' || v === 'gone';
      // one take for "three ... two ... one": the cues are words, not the entries of the shot list
      const T3 = W(175) - 2, T2 = W(180) - 2, T1 = W(184) - 2;
      crew.forEach((c, i) => {
        let k = 1, st = 'idle', y = 0, dz = 0, vis = true, x = SEVEN[i][0];
        if (v === 'one') { k = i === 0 ? smooth(f, shot.at + 2, shot.at + 9) : 0.12; if (i === 0) { dz = 0.45 * smooth(f, shot.at + 2, shot.at + 12); y = hop(f, shot.at + 3, 0.08, 9); } }
        else if (v === 'none') k = 0;
        else if (v === 'charged') { const at = shot.at + 2 + i * 3; k = smooth(f, at, at + 5); y = hop(f, at, 0.07, 8); }
        else if (take) {
          if (i === 0) st = 'deal';
          if (i >= 1 && i <= 3) { const at = T3 + (i - 1) * 4; st = f >= at ? 'not' : 'idle'; y = hop(f, at, 0.09, 8); }
          if (i === 4 || i === 5) { const at = T2 + (i - 4) * 4; vis = f < at; }
          if (i === 6) { const u = smooth(f, T1, T1 + 12); x += 2.6 * u; vis = u < 0.98; st = f >= T1 ? 'up' : 'idle'; }
          if (f >= T2 && i < 4) k = 0.6; if (f >= T1 && i < 6) k = 0.45;
        }
        c.node.visible = vis; c.node.position.set(x, SEVEN[i][1] + y, SEVEN[i][2] + dz); c.show(st); c.tint(shade(k, v === 'none' ? '#1c2136' : '#3f455c')); c.tick(f, cam);
        const at = i === 6 ? T1 + 6 : T2 + (i - 4) * 4; gone[i].visible = take && i >= 4 && f >= at; gone[i].scale.setScalar(pop(f, at, 7));
        (spots[i].material as THREE.MeshBasicMaterial).opacity = 0.3 * k * (vis ? 1 : 0);
      });
      (key.material as THREE.MeshBasicMaterial).opacity = v === 'one' ? 0.07 * smooth(f, shot.at + 2, shot.at + 9) : 0;
      const u = (f - T1) / 34; plane.visible = take && u > 0 && u < 1; plane.position.set(SEVEN[6][0] + 0.2 + 1.6 * u, 2.2 + 1.5 * u, -0.6); plane.rotation.z = 0.5; plane.scale.setScalar(0.8 + 0.5 * u);
    },
  };
};

// ------------------------------------------------------------------ papers: the plea agreement, the newspaper, the form
type Page = {draw: (g: G2, w: number, h: number) => void; /** the band the highlighter marks, in page pixels: top, bottom, left, right */ hot?: [number, number, number, number]};
const PW = 1000, PH = 1300;
const M = (g: G2, s: string, x: number, y: number, size: number, weight: 700 | 900 = 700, align: CanvasTextAlign = 'left', col = '#1a1c24', maxWidth = PW - 150) => text(g, s, x, y, size, col, {font: 'Montserrat', weight, align, maxWidth});
const grey = (g: G2, y0: number, n: number, seed: number) => { const q = rng(seed); g.fillStyle = '#c3c7d1'; for (let i = 0; i < n; i++) g.fillRect(86, y0 + i * 46, (PW - 172) * (i % 4 === 3 ? 0.4 + q() * 0.3 : 1), 16); };
const courtHead = (g: G2, title: string) => {
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, PW, PH); g.strokeStyle = '#1a1c24'; g.lineWidth = 5; g.strokeRect(40, 40, PW - 80, PH - 80);
  M(g, 'UNITED STATES DISTRICT COURT', PW / 2, 116, 46, 900, 'center'); M(g, 'CENTRAL DISTRICT OF CALIFORNIA', PW / 2, 172, 36, 700, 'center'); g.fillStyle = '#1a1c24'; g.fillRect(86, 214, PW - 172, 5);
  text(g, title, PW / 2, 312, 124, '#1a1c24', {maxWidth: PW - 200});
};
const PAGES: Record<'sign' | 'page' | 'same' | 'news' | 'form', Page> = {
  sign: {draw: (g) => { courtHead(g, 'PLEA AGREEMENT'); M(g, 'FILED NOV. 9, 2026', PW / 2, 410, 38, 900, 'center', '#b3211d'); grey(g, 480, 5, 3); g.fillStyle = '#1a1c24'; g.fillRect(430, 800, 440, 5); M(g, 'DEFENDANT', 650, 842, 30, 700, 'center', '#6b6f7a'); grey(g, 930, 6, 4); }},
  page: {draw: (g) => { courtHead(g, 'PLEA AGREEMENT'); M(g, 'FILED NOV. 9, 2026', PW / 2, 410, 38, 900, 'center', '#b3211d'); grey(g, 470, 3, 5); M(g, 'ONE COUNT:', 86, 680, 54, 900); M(g, 'INTERFERENCE WITH', 86, 772, 66, 900); M(g, 'COMMERCE BY ROBBERY', 86, 864, 66, 900); grey(g, 960, 6, 6); }, hot: [726, 910, 70, 930]},
  same: {draw: (g) => { courtHead(g, 'PLEA AGREEMENT'); M(g, 'WHAT HE ADMITS IN IT', PW / 2, 410, 40, 900, 'center', '#b3211d');
    ['FOLLOWED THE TRUCK', 'ABOUT 300 MILES', "BROKE THE TRUCK'S LOCKS", 'STOLE 24 BAGS'].forEach((s, i) => M(g, s, 170, 540 + i * 110 - (i > 1 ? 20 : 0) + (i === 1 ? -26 : 0), i === 1 ? 50 : 60, 900, 'left', '#1a1c24', 740));
    g.strokeStyle = '#2fbf71'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; for (const y of [540, 740, 850]) { g.beginPath(); g.moveTo(86, y); g.lineTo(108, y + 24); g.lineTo(146, y - 28); g.stroke(); }
    M(g, 'AS SUMMARISED BY THE L.A. TIMES', PW / 2, 1000, 34, 900, 'center', '#6b6f7a'); M(g, 'AND CITY NEWS SERVICE, NOV. 9-10, 2026', PW / 2, 1048, 34, 900, 'center', '#6b6f7a'); grey(g, 1110, 2, 8); }, hot: [800, 900, 150, 700]},
  news: {draw: (g) => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, PW, PH); M(g, 'LOS ANGELES TIMES', PW / 2, 118, 84, 900, 'center'); g.fillStyle = '#1a1c24'; g.fillRect(60, 184, PW - 120, 8); g.fillRect(60, 200, PW - 120, 3);
    M(g, 'OCT. 16, 2025', PW / 2, 248, 36, 900, 'center', '#b3211d');
    ["Inside the Brink's", 'heist probe: how', 'alleged burglars', 'behind $100-million', 'theft were caught'].forEach((s, i) => M(g, s, 76, 372 + i * 98, 80, 900));
    grey(g, 900, 8, 12); }, hot: [520, 810, 60, 940]},
  form: {draw: (g) => { g.fillStyle = '#eef4fb'; g.fillRect(0, 0, PW, PH); g.fillStyle = '#27408b'; g.fillRect(0, 0, PW, 170); text(g, 'SHIPPING FORM', PW / 2, 72, 92, '#ffffff'); M(g, 'A DRAWING, NOT THE REAL DOCUMENT', PW / 2, 136, 32, 900, 'center', '#ffffff');
    g.strokeStyle = '#27408b'; g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.strokeRect(76, 230 + i * 130, PW - 152, 100); M(g, ['SHIPPER', 'CONTENTS', 'DESTINATION'][i], 96, 260 + i * 130, 26, 900, 'left', '#27408b'); g.fillStyle = '#c3c7d1'; g.fillRect(96, 290 + i * 130, 420 + i * 70, 16); }
    g.fillStyle = '#fffdf4'; g.fillRect(76, 650, PW - 152, 260); g.lineWidth = 10; g.strokeRect(76, 650, PW - 152, 260); M(g, 'DECLARED VALUE', 110, 716, 58, 900, 'left', '#27408b'); M(g, '$', 110, 826, 120, 900, 'left'); g.fillStyle = '#1a1c24'; g.fillRect(210, 868, PW - 330, 6);
    grey(g, 980, 5, 14); }, hot: [660, 900, 86, 914]},
};
const pageTex = (key: keyof typeof PAGES) => tex('paper-' + key, PW, PH, (g, w, h) => PAGES[key].draw(g, w, h));
export const deal: Builder = (root) => {
  backdrop(root, ['#10131c', '#232a3c']);
  const page = grp(root, 0, 1.48, -0.4), W_ = 1.6, H_ = 2.08; page.rotation.z = -0.02;
  soft(panel(page, W_ + 0.07, H_ + 0.07, lit(INK, 1), 0, 0, -0.01));
  const keys = Object.keys(PAGES) as (keyof typeof PAGES)[], T = Object.fromEntries(keys.map((k) => [k, pageTex(k)])) as unknown as Record<keyof typeof PAGES, THREE.Texture>;
  const pm = new THREE.MeshBasicMaterial({map: T.sign}); soft(panel(page, W_, H_, pm, 0, 0, 0));
  const hl = new THREE.MeshBasicMaterial({color: '#ffe14a', transparent: true, blending: THREE.MultiplyBlending, depthWrite: false}), mark = soft(panel(page, 1, 1, hl, 0, 0, 0.004)); mark.renderOrder = 4;
  // a pen that signs, and the line it leaves
  const pen = grp(page, 0, 0, 0.05); const body = cyl(pen, 0.022, 0.5, '#2f4f9a', 0.1, 0.22, 0.06); body.rotation.z = -0.45; body.rotation.x = 0.5; const nib = cyl(pen, 0.006, 0.07, '#c9ced6', 0.0, 0.0, 0.0, 0.02); nib.rotation.z = -0.45; nib.rotation.x = 0.5;
  const ink = soft(panel(page, 1, 0.09, smat(tex('paper-signature', 400, 90, (g, w, h) => { g.strokeStyle = '#1f3a8a'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(8, 60); for (let i = 1; i <= 26; i++) g.lineTo(8 + i * 14.5, 46 + 30 * Math.sin(i * 1.7) * (i % 5 ? 1 : 0.3)); g.stroke(); }), 1, true), 0, 0, 0.003));
  halo(root, 2.6, '#fff0c8', 0.12, 0, 1.5, -1.2);
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      const key = shot.v as keyof typeof PAGES, P = PAGES[key];
      pm.map = T[key]; page.position.y = 1.48 + 0.01 * Math.sin(f * 0.06); page.scale.setScalar(pop(f, shot.at - 2, 8));
      const cue = key === 'page' ? W(153) : key === 'same' ? W(166) : key === 'news' ? W(107) : key === 'form' ? W(211) : 1e9;
      const k = P.hot ? smooth(f, cue, cue + 9) : 0;
      if (P.hot) { const [y0, y1, x0, x1] = P.hot, full = (x1 - x0) / PW * W_; mark.scale.set(Math.max(0.001, full * k), (y1 - y0) / PH * H_, 1); mark.position.set(-W_ / 2 + x0 / PW * W_ + full * k / 2, H_ / 2 - (y0 + y1) / 2 / PH * H_, 0.004); }
      mark.visible = k > 0.01;
      // the signature on the first page, written while the narrator says "has a plea deal"
      const s = key === 'sign' ? smooth(f, W(29), W(31) + 8) : 0, sx = (430 + 440 * s) / PW * W_ - W_ / 2, sy = H_ / 2 - 778 / PH * H_;
      pen.visible = key === 'sign'; pen.position.set(sx, sy + 0.012 * Math.sin(f * 1.3) * (s > 0 && s < 1 ? 1 : 0), 0.05);
      ink.visible = key === 'sign' && s > 0.02; const iw = 440 / PW * W_ * s; ink.scale.set(Math.max(0.001, iw), 1, 1); ink.position.set(430 / PW * W_ - W_ / 2 + iw / 2, sy + 0.01, 0.003);
      (ink.material as THREE.MeshBasicMaterial).map!.repeat.set(Math.max(0.001, s), 1);
    },
  };
};

// ------------------------------------------------------------------ the other truck: a box truck and its cargo
const tagTex = () => tex('tag-top', 96, 96, (g) => { g.fillStyle = '#fffdf8'; g.beginPath(); g.arc(48, 48, 46, 0, 7); g.fill(); g.strokeStyle = '#c9ced6'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#dfe3ea'; g.beginPath(); g.arc(48, 48, 22, 0, 7); g.fill(); });
export const CARTON: [number, number, number] = [-0.25, 0, 1.7];
export const tags: Builder = (root) => {
  backdrop(root, ['#6fb0e8', '#f6e3c0']);
  floor(root, 40, 30, tmat(tiled(grainTex('tags-lot', '#8a8f9c', 0.1), 12, 9)));
  for (let i = -4; i <= 4; i++) floor(root, 0.1, 4.6, lit('#f3ead0', 1), 0.014, i * 2.3, -0.4);
  box(root, 16, 4.6, 0.5, '#c9b99a', 0, 2.3, -6.2); for (let i = -3; i <= 3; i++) box(root, 1.5, 2.6, 0.1, '#8a94a3', i * 2.2, 1.3, -5.92);
  // the box truck, three quarters from behind: its nose points away to the right
  const t = grp(root, 0.55, 0, -0.9); t.rotation.y = 1.0;
  const W2 = 0.66, BX = -0.6; box(t, 2.5, 1.6, 2 * W2, '#f6f3ea', BX, 1.32, 0); box(t, 2.5, 0.14, 2 * W2 - 0.2, '#3a3f4a', BX, 0.46, 0);
  box(t, 0.95, 1.15, 2 * W2 - 0.08, '#2f8f86', 1.2, 1.0, 0); box(t, 0.4, 0.5, 2 * W2 - 0.12, '#2f8f86', 1.8, 0.68, 0); soft(panel(t, 2 * W2 - 0.24, 0.5, lit('#1c2433', 1), 1.682, 1.22, 0, Math.PI / 2));
  for (const s of [-1, 1]) { soft(panel(t, 0.5, 0.44, lit('#1c2433', 1), 1.24, 1.22, s * (W2 - 0.038), s > 0 ? 0 : Math.PI)); for (const x of [-1.25, 1.35]) { const w = cyl(t, 0.3, 0.24, '#1b1d24', x, 0.3, s * (W2 - 0.14)); w.rotation.x = Math.PI / 2; const hb = cyl(t, 0.13, 0.25, '#c9ced6', x, 0.3, s * (W2 - 0.135)); hb.rotation.x = Math.PI / 2; } box(t, 0.04, 0.1, 0.18, lit('#ff3b30', 1.3), BX - 1.26, 0.62, s * (W2 - 0.12)); }
  soft(panel(t, 2 * W2 - 0.12, 1.44, lit('#1b1e28', 1), BX - 1.252, 1.34, 0, -Math.PI / 2)); box(t, 0.06, 0.14, 2 * W2, '#c9ced6', BX - 1.26, 2.1, 0); box(t, 0.1, 0.1, 2 * W2, '#8a94a3', BX - 1.3, 0.5, 0);
  const cartonTex = tex('tags-carton', 256, 200, (g, w, h) => { g.fillStyle = '#c99a62'; g.fillRect(0, 0, w, h); g.fillStyle = '#b08350'; g.fillRect(0, h / 2 - 10, w, 20); g.fillStyle = '#fffdf4'; g.fillRect(58, 30, 140, 56); g.fillStyle = INK; for (let i = 0; i < 11; i++) g.fillRect(70 + i * 11, 42, i % 3 ? 4 : 7, 32); });
  for (const [x, y, z] of [[-1.0, 0.53, -0.3], [-1.0, 0.53, 0.3], [-1.0, 1.0, 0], [-0.3, 0.53, -0.3], [-0.3, 0.53, 0.28], [-0.35, 1.0, 0.1]] as const) box(t, 0.62, 0.45, 0.54, tmat(cartonTex), BX + x, y + 0.23, z);
  // one carton on the ground, open: small white tags
  const c = grp(root, ...CARTON); c.rotation.y = 0.3; box(c, 0.9, 0.5, 0.66, tmat(cartonTex), 0, 0.25, 0); box(c, 0.84, 0.03, 0.6, '#8a6a3a', 0, 0.44, 0);
  for (const [s, rz] of [[-1, 0.9], [1, -0.9]] as const) { const fl = box(c, 0.44, 0.03, 0.66, '#c99a62', s * 0.62, 0.6, 0); fl.rotation.z = rz; }
  const disc = tmat(tagTex()), q = rng(21), pts: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) { const x = (q() - 0.5) * 0.7, z = (q() - 0.5) * 0.46, y = 0.47 + q() * 0.08; const d = cyl(c, 0.075, 0.022, '#fffdf8', x, y, z); d.rotation.set((q() - 0.5) * 0.6, 0, (q() - 0.5) * 0.6); const top = soft(mesh(d, new THREE.CircleGeometry(0.074, 20), disc, 0, 0.0115, 0)); top.rotation.x = -Math.PI / 2; if (i % 6 === 0) pts.push([x, y + 0.08, z + 0.05]); }
  const fly = [0, 1, 2].map(() => { const d = cyl(c, 0.085, 0.024, '#fffdf8', 0, 0, 0); d.rotation.x = Math.PI / 2; const top = soft(mesh(d, new THREE.CircleGeometry(0.084, 20), disc, 0, 0.0125, 0)); top.rotation.x = -Math.PI / 2; return d; });
  const tw = glints(c, pts), ping = fly.map(() => rings(root, 2, '#2f6fd0'));
  return {
    light: () => LIGHT.day,
    tick: ({f, shot}) => {
      const close = shot.v === 'tags';
      fly.forEach((d, i) => { const at = shot.at + 4 + i * 7, u = smooth(f, at, at + 12); d.visible = close && f >= at; d.position.set((i - 1) * 0.3, 0.5 + (0.3 + 0.1 * (i % 2)) * u + 0.02 * Math.sin(f * 0.2 + i), 0.12); d.rotation.z = 0.2 * Math.sin(f * 0.1 + i);
        const wp = new THREE.Vector3(); d.getWorldPosition(wp); ping[i](f + i * 11, close && u > 0.9, [wp.x, wp.y, wp.z + 0.02], 0.2, 0, 0.05); });
      tw(f, true);
    },
  };
};

// ------------------------------------------------------------------ the courtroom: one chair is empty
const sealTex = () => tex('court-seal', 300, 300, (g, w) => {
  g.fillStyle = '#c9a23a'; g.beginPath(); g.arc(w / 2, w / 2, 144, 0, 7); g.fill(); g.strokeStyle = '#6b4a12'; g.lineWidth = 10; g.stroke(); g.beginPath(); g.arc(w / 2, w / 2, 112, 0, 7); g.lineWidth = 5; g.stroke();
  g.strokeStyle = '#3a2c08'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, 82); g.lineTo(w / 2, 220); g.moveTo(88, 110); g.lineTo(212, 110); g.moveTo(110, 220); g.lineTo(190, 220); g.stroke();
  g.lineWidth = 7; for (const x of [88, 212]) { g.beginPath(); g.moveTo(x, 110); g.lineTo(x - 28, 168); g.moveTo(x, 110); g.lineTo(x + 28, 168); g.stroke(); g.beginPath(); g.arc(x, 168, 30, 0, Math.PI); g.stroke(); }
});
export const court: Builder = (root) => {
  backdrop(root, ['#2a2018', '#4a382a']);
  floor(root, 14, 12, tmat(tiled(woodTex('court-floor', '#7a5a3c', '#4a3220'), 4, 4)));
  panel(root, 12, 5.2, tmat(tiled(woodTex('court-wall', '#8a6444', '#5a3e28'), 3, 2)), 0, 2.6, -3.2);
  box(root, 4.6, 1.5, 0.9, '#5a3e28', 0, 0.75, -2.5); box(root, 4.8, 0.1, 1.0, '#3a2818', 0, 1.52, -2.5); box(root, 1.2, 1.7, 0.2, '#3a2818', 0, 2.4, -3.0);
  soft(panel(root, 0.9, 0.9, smat(sealTex(), 1.05, true), 0, 2.6, -2.88)); flagPole(root, -2.6, -2.6, flagUS(), {h: 3.6, w: 1.1});
  box(root, 9, 0.9, 0.08, '#5a3e28', 0, 0.45, -1.3); box(root, 9, 0.06, 0.16, '#3a2818', 0, 0.92, -1.3);
  // two tables: the defence on the left with an empty chair, the prosecution on the right
  table(root, -0.82, 0.3, 1.3, 0.8, {top: '#8a6444', leg: '#3a2818', skirt: '#6b4a30'}); table(root, 0.82, 0.3, 1.3, 0.8, {top: '#8a6444', leg: '#3a2818', skirt: '#6b4a30'});
  const ch = grp(root, -0.82, 0, -0.5); box(ch, 0.6, 0.08, 0.55, '#3a2818', 0, 0.5, 0); box(ch, 0.6, 0.8, 0.08, '#3a2818', 0, 0.95, -0.25); for (const s of [-1, 1]) for (const t of [-1, 1]) box(ch, 0.06, 0.5, 0.06, '#3a2818', s * 0.26, 0.25, t * 0.22);
  const empty = soft(panel(root, 0.7, 1.16, smat(tex('court-gone', 300, 500, (g, w) => { g.strokeStyle = '#ffe14a'; g.lineWidth = 10; g.setLineDash([22, 16]); g.lineCap = 'round'; g.beginPath(); g.arc(w / 2, 104, 78, 0, 7); g.stroke(); rrect(g, w / 2 - 86, 196, 172, 220, 44); g.stroke(); }), 1.15, true), -0.82, 1.42, -0.42));
  soft(panel(root, 0.7, 0.2, smat(signTex('court-card', 420, 120, '#fffdf4', INK, [['DEFENDANT', 76, 0.56]], {border: INK}), 1), -0.82, 0.86, 0.72));
  const spot = pool(root, 1.0, '#fff0c8', 0.36, -0.82, -0.3), cone = beam(root, 0.12, 0.9, 5.0, '#fff0c8', 0.06, -0.82, 5.0, -0.4);
  const pros = actor(root, PROSECUTOR, {read: {expr: 'neutral', pose: 'hold', prop: 'paper'}, what: {expr: 'shock', pose: 'hold', prop: 'paper', look: -1}, shrug: {expr: 'nervous', pose: 'shrug', look: -1}}, 0.82, 0, -0.5, {scale: 1.0, res: 1.1, wide: true});
  return {
    light: () => LIGHT.warm,
    tick: ({f, cam, shot}) => {
      const cue = W(190) - 2;
      pros.show(f < shot.at + 10 ? 'read' : f < cue ? 'what' : 'shrug'); pros.node.position.y = hop(f, shot.at + 10, 0.08, 8); pros.tick(f, cam);
      empty.scale.setScalar(pop(f, shot.at + 3, 8)); empty.position.y = 1.42 + 0.02 * Math.sin(f * 0.12);
      const k = 0.8 + 0.2 * Math.sin(f * 0.14); (spot.material as THREE.MeshBasicMaterial).opacity = 0.36 * k; (cone.material as THREE.MeshBasicMaterial).opacity = 0.06 * k;
    },
  };
};

// ------------------------------------------------------------------ the scale: one number on each side
const priceTex = (s: string, sub: string, bg: string, fg: string) => tex('scale-tag-' + s, 560, 250, (g, w, h) => {
  g.fillStyle = INK; rrect(g, 3, 3, w - 6, h - 6, 34); g.fill(); g.fillStyle = bg; rrect(g, 15, 15, w - 30, h - 30, 24); g.fill(); text(g, s, w / 2, 100, 118, fg, {maxWidth: w - 60}); text(g, sub, w / 2, 196, 42, fg, {font: 'Montserrat', maxWidth: w - 60});
});
const formTex = () => tex('scale-form', 300, 390, (g, w, h) => {
  g.fillStyle = '#eef4fb'; g.fillRect(0, 0, w, h); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#27408b'; g.fillRect(8, 8, w - 16, 58); text(g, 'FORM', w / 2, 40, 50, '#ffffff');
  g.fillStyle = '#c3c7d1'; for (let i = 0; i < 3; i++) g.fillRect(28, 96 + i * 34, w - 56 - i * 30, 14); g.fillStyle = '#fffdf4'; g.fillRect(24, 214, w - 48, 130); g.strokeStyle = '#27408b'; g.lineWidth = 6; g.strokeRect(24, 214, w - 48, 130);
  text(g, 'DECLARED', w / 2, 250, 38, '#27408b'); text(g, 'VALUE', w / 2, 304, 52, INK);
});
export const PAN_X = 1.05, BEAM_Y = 2.34, DROP = 0.92;
export const scale: Builder = (root) => {
  backdrop(root, ['#07090f', '#161c30']);
  floor(root, 14, 12, tmat(tiled(grainTex('scale-floor', '#1b2236', 0.1), 5, 4)));
  const BRASS = '#d9a441';
  cyl(root, 0.52, 0.12, BRASS, 0, 0.06, 0); cyl(root, 0.36, 0.1, '#b9842f', 0, 0.17, 0); cyl(root, 0.06, 2.2, BRASS, 0, 1.3, 0); ball(root, 0.1, BRASS, 0, 2.46, 0);
  const arm = grp(root, 0, BEAM_Y, 0); box(arm, 2 * PAN_X + 0.2, 0.07, 0.07, BRASS, 0, 0, 0); for (const s of [-1, 1]) ball(arm, 0.06, BRASS, s * PAN_X, 0, 0);
  const pans = [-1, 1].map((s) => {
    const p = grp(root, s * PAN_X, BEAM_Y - DROP, 0);
    cyl(p, 0.56, 0.04, BRASS, 0, 0, 0); cyl(p, 0.5, 0.05, '#b9842f', 0, -0.04, 0, 0.3);
    for (const a of [0.5, 2.6, 4.7]) { const r = mesh(p, new THREE.CylinderGeometry(0.008, 0.008, 1, 6), '#c9ced6', 0, 0, 0); const ax = 0.5 * Math.cos(a), az = 0.5 * Math.sin(a), d = new THREE.Vector3(-ax, DROP, -az); r.scale.y = d.length(); r.position.set(ax / 2, DROP / 2, az / 2); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
    return p;
  });
  const jewels = jewelBag(pans[0], 0, 0.02, 0.15, 1.05); jewels.g.position.y = 0.03;
  const form = soft(panel(pans[1], 0.54, 0.7, smat(formTex(), 1.05), 0, 0.4, 0.05)); form.rotation.z = 0.06;
  const tagA = soft(panel(root, 0.92, 0.41, smat(priceTex('$100 MILLION', 'THE JEWELERS', '#ffe14a', INK), 1.1, true), 0, 0, 0.3)), tagB = soft(panel(root, 0.92, 0.41, smat(priceTex('$8.7 MILLION', "BRINK'S: DECLARED", '#fffdf4', INK), 1.1, true), 0, 0, 0.3));
  const spots = [-1, 1].map((s) => ({cone: beam(root, 0.14, 0.8, 5.4, s < 0 ? '#ffe9a8' : '#dfe9ff', 0, s * PAN_X, 5.4, 0), floor: pool(root, 1.0, s < 0 ? '#ffe9a8' : '#dfe9ff', 0, s * PAN_X, 0)}));
  halo(root, 3.2, '#ffe9b0', 0.1, 0, 2.0, -1.6);
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.25, keyI: 0.9}),
    tick: ({f, shot}) => {
      const v = shot.v, A = W(205) - 2, B = W(212) - 2, QA = W(222) - 2, QB = W(227) - 2;
      // the jewels land on the left pan on "a hundred million"; the form on the right pan on "eight point seven"
      const a = v === 'left' ? smooth(f, A, A + 10) : 1, b = v === 'left' ? 0 : v === 'right' ? smooth(f, B, B + 12) : 1;
      // the beam: down on the left with the jewels alone, then it comes level and rocks, undecided
      const rock = v === 'what' || v === 'choice' ? 0.075 * Math.sin((f - shot.at) * 0.085) : 0;
      const tilt = 0.2 * a * (1 - b) + shake(f, A + 8, 0.05, 16) * (v === 'left' ? 1 : 0) + shake(f, B + 10, 0.06, 18) * (v === 'right' ? 1 : 0) + rock;
      arm.rotation.z = tilt;
      pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * PAN_X * Math.cos(tilt), BEAM_Y + s * PAN_X * Math.sin(tilt) - DROP, 0); });
      jewels.g.visible = a > 0.01; jewels.g.position.y = 0.03 + 1.6 * (1 - a) ** 2; jewels.tw(f, a > 0.9);
      form.visible = b > 0.01; form.position.y = 0.4 + 1.5 * (1 - b) ** 1.6; form.position.x = 0.25 * Math.sin((1 - b) * 9) * (1 - b); form.rotation.z = 0.06 + 0.5 * Math.sin((1 - b) * 7) * (1 - b);
      tagA.visible = a > 0.6; tagA.scale.setScalar(pop(f, v === 'left' ? A + 8 : -99, 8)); tagA.position.set(pans[0].position.x, pans[0].position.y + 1.02, 0.3);
      tagB.visible = b > 0.6; tagB.scale.setScalar(pop(f, v === 'right' ? B + 10 : -99, 8)); tagB.position.set(pans[1].position.x, pans[1].position.y + 1.02, 0.3);
      const ka = v === 'choice' ? smooth(f, QA, QA + 8) : 0, kb = v === 'choice' ? smooth(f, QB, QB + 8) : 0;
      spots.forEach((s, i) => { const k = i ? kb : ka; (s.cone.material as THREE.MeshBasicMaterial).opacity = 0.02 + 0.06 * k; (s.floor.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.3 * k; });
    },
  };
};
