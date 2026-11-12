// Sets of the sorry hackers short, part 2: the waiting room, the bedside, the university's notice, the wall of ID
// cards, somebody at home with a phone.
import * as THREE from 'three';
import {backdrop, ball, box, cyl, floor, grainTex, grp, hop, lit, panel, pop, rng, rod, rrect, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, woodTex, type G2} from './kit';
import {actor, NURSE, PATIENT} from './cast';
import {bubble, halo, monitor, person, plant, screenTex, signTex} from './props';
import {INK, LIGHT, padlock, type Builder} from './sets';
import {W} from './story';

const chair = (p: THREE.Group, x: number, z: number, c: string) => { box(p, 0.56, 0.08, 0.5, c, x, 0.48, z); box(p, 0.56, 0.56, 0.07, c, x, 0.82, z - 0.24); for (const s of [-1, 1]) for (const d of [-1, 1]) cyl(p, 0.022, 0.46, '#8a94a3', x + s * 0.23, 0.23, z + d * 0.2); };

// ------------------------------------------------------------------ the waiting room: today is cancelled
const boardTex = (off: boolean) => tex('wait-board-' + off, 760, 520, (g, w, h) => {
  g.fillStyle = '#1b2230'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3550'; g.fillRect(0, 0, w, 96); text(g, "TODAY'S APPOINTMENTS", w / 2, 52, 62, '#ffffff', {maxWidth: w - 60});
  ['9:30', '10:15', '11:00', '1:45'].forEach((t, r) => {
    const y = 152 + r * 92; text(g, t, 40, y, 62, '#e8eef8', {align: 'left'}); g.fillStyle = '#56627c'; g.fillRect(210, y - 9, 150, 18);
    g.fillStyle = off ? '#e3342f' : '#2fbf71'; rrect(g, 412, y - 34, 310, 68, 12); g.fill(); text(g, off ? 'CANCELLED' : 'ON TIME', 567, y + 3, 54, '#ffffff', {maxWidth: 280});
  });
});
export const waiting: Builder = (root) => {
  backdrop(root, ['#2a3c4a', '#40606e']);
  floor(root, 14, 12, tmat(tiled(tileTex('wait-floor', '#e6e2d6', '#c9c2b0', 4), 6, 5)));
  box(root, 9, 5.6, 0.3, '#f0e3c8', 0, 2.8, -2.0); box(root, 9, 0.9, 0.32, '#3f8f9a', 0, 0.45, -1.99);
  const boardM = new THREE.MeshBasicMaterial({map: boardTex(false)}), B = [boardTex(false), boardTex(true)], board = grp(root, -0.25, 1.92, -1.82);
  box(board, 1.62, 1.14, 0.06, '#23252e', 0, 0, 0); panel(board, 1.5, 1.03, boardM, 0, 0, 0.04);
  plant(root, 1.5, -1.45, 1.1, '#b9623a');
  const XS = [-0.85, -0.2, 0.45]; XS.forEach((x) => chair(root, x, -0.5, '#3f6fb5'));
  const pats = [actor(root, PATIENT(0), {a: {expr: 'neutral', mode: 'sit'}, b: {expr: 'stern', pose: 'cross', mode: 'sit'}}, XS[0], 0.42, -0.44, {scale: 1.02, res: 1.1}),
    actor(root, PATIENT(1), {a: {expr: 'neutral', mode: 'sit', pose: 'both'}, b: {expr: 'nervous', mode: 'sit', pose: 'both'}}, XS[1], 0.42, -0.44, {scale: 1.0, res: 1.1})];
  // staff came out to tell people in person (AP saw them do it)
  const nurse = actor(root, NURSE(2), {a: {expr: 'neutral', pose: 'hold', prop: 'clip'}, b: {expr: 'nervous', pose: 'hold', prop: 'clip'}}, 0.82, 0, 0.3, {scale: 1.0, res: 1.1});
  return {
    light: () => LIGHT.room,
    tick: ({f, cam}) => {
      const at = W(51) - 2, off = f >= at;                                                                // the board turns on "stopped"
      boardM.map = B[off ? 1 : 0]; board.rotation.z = shake(f, at, 0.03, 10); board.scale.setScalar(1 + 0.05 * Math.max(0, 1 - Math.abs(f - at - 2) / 3));
      pats.forEach((p, i) => { p.show(off && f >= at + 4 + i * 3 ? 'b' : 'a'); p.node.position.y = 0.42 + hop(f, at + 4 + i * 3, 0.04, 7); p.tick(f, cam); });
      nurse.show(off ? 'b' : 'a'); nurse.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the bedside: a computer that will not open, next to somebody who needs care now
const ecg = () => tex('ecg', 512, 256, (g, w, h) => {
  g.fillStyle = '#06130c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#123a22'; g.lineWidth = 2; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = '#6dff8a'; g.lineWidth = 7; g.lineJoin = 'round'; g.shadowColor = '#6dff8a'; g.shadowBlur = 12; g.beginPath(); g.moveTo(0, 150);
  for (let b = 0; b < 4; b++) { const x = b * 128; g.lineTo(x + 40, 150); g.lineTo(x + 52, 132); g.lineTo(x + 62, 150); g.lineTo(x + 72, 164); g.lineTo(x + 84, 50); g.lineTo(x + 96, 196); g.lineTo(x + 106, 150); g.lineTo(x + 128, 150); }
  g.stroke();
}, true);
export const bedside: Builder = (root) => {
  backdrop(root, ['#24384a', '#3a5a70']);
  floor(root, 14, 12, tmat(tiled(tileTex('bed-floor', '#dfe6ea', '#bccad2', 4), 6, 5)));
  box(root, 9, 5.6, 0.3, '#cfe0ea', 0, 2.8, -2.2); box(root, 9, 0.16, 0.32, '#8fb0c4', 0, 1.1, -2.19);
  // the bed, foot toward us
  const BX = 0.88; box(root, 1.05, 0.34, 2.0, '#c9ced6', BX, 0.36, -0.75); box(root, 1.0, 0.16, 1.96, '#fbfaf5', BX, 0.6, -0.75);
  box(root, 1.1, 0.5, 0.07, '#b9c2cc', BX, 0.5, 0.27); box(root, 1.1, 1.0, 0.07, '#b9c2cc', BX, 0.9, -1.76); box(root, 0.7, 0.14, 0.36, '#ffffff', BX, 0.76, -1.5);
  for (const s of [-1, 1]) for (const z of [0.2, -1.7]) cyl(root, 0.04, 0.2, '#6b7280', BX + s * 0.46, 0.1, z);
  const pat = actor(root, PATIENT(1), {a: {expr: 'neutral', mode: 'sit', pose: 'both'}}, BX - 0.04, 0.5, -1.3, {scale: 0.98, res: 1.1, shadow: 0});
  box(root, 1.02, 0.3, 1.25, '#9fd0e6', BX, 0.74, -0.45);                                                // the blanket over the knees
  // a monitor that keeps going: nothing in this picture says that care stopped
  const beat = ecg().clone(); beat.wrapS = THREE.RepeatWrapping; beat.repeat.set(0.5, 1); beat.needsUpdate = true;
  box(root, 0.1, 0.1, 0.3, '#8a94a3', BX, 2.08, -1.9); box(root, 0.6, 0.44, 0.08, '#23252e', BX, 2.08, -1.72); panel(root, 0.52, 0.36, new THREE.MeshBasicMaterial({map: beat}), BX, 2.08, -1.675);
  // the computer on wheels
  const CX = -0.78, cart = grp(root, CX, 0, 0.1);
  cyl(cart, 0.26, 0.05, '#6b7280', 0, 0.03, 0); cyl(cart, 0.035, 1.05, '#c9ced6', 0, 0.55, 0); box(cart, 0.62, 0.04, 0.4, '#e8eef5', 0, 1.06, 0.04); box(cart, 0.4, 0.02, 0.14, '#3a3f4a', 0, 1.09, 0.12);
  const lockT = screenTex('bed-lock', (g, w, h) => { padlock(g, w / 2, h / 2 - 34, 96); text(g, 'LOCKED', w / 2, h - 58, 82, '#f2c230'); }, 512, 368, '#1a1410');
  const ok = screenTex('bed-ok', (g, w) => { g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, w, 60); const q = rng(4); for (let r = 0; r < 6; r++) { g.fillStyle = '#8fa3bf'; g.fillRect(30, 96 + r * 42, 200 + q() * 220, 18); } }, 512, 368, '#f4f7fb');
  const scrM = new THREE.MeshBasicMaterial({map: ok}); monitor(cart, 0, 1.08, -0.06, 0.6, 0.43, scrM, 0);
  const NX = -0.22, nurse = actor(root, NURSE(3), {a: {expr: 'neutral', pose: 'type'}, b: {expr: 'shock', pose: 'shrug'}, c: {expr: 'neutral', pose: 'hold', prop: 'clip'}}, NX, 0, -0.45, {scale: 1.0, res: 1.1});
  return {
    light: () => ({...LIGHT.cold, amb: 1.45}),
    tick: ({f, cam, shot}) => {
      const at = W(95) + 3, locked = f >= at, paper = shot.v === 'paper' && f >= W(99) + 2;                 // it locks on "machines"; by "patients" she is writing by hand
      scrM.map = locked ? lockT : ok; scrM.color.setScalar(locked ? 1.1 + 0.12 * Math.sin(f * 0.5) : 1); cart.rotation.z = shake(f, at, 0.03, 9);
      nurse.show(paper ? 'c' : locked ? 'b' : 'a'); nurse.node.position.x = NX + 0.3 * (paper ? smooth(f, W(99) + 2, W(99) + 12) : 0); nurse.node.position.y = hop(f, at + 1, 0.07, 8); nurse.tick(f, cam);
      beat.offset.x = -f * 0.012; pat.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the university's notice: its own words, with the date
type Page = {date: string; lines: string[]; hot: [number, number]; after: number};
const PAGES: Record<'back' | 'noconc' | 'report', Page> = {
  back: {date: 'UPDATE · OCT. 27, 2026 · 2:02 P.M.', lines: ['Critical electronic systems at', 'The University of New Mexico', 'Health Sciences Center (HSC)', 'are back online following', "Monday's cybersecurity event."], hot: [3, 3], after: 3},
  noconc: {date: 'UPDATE · OCT. 28, 2026 · 12:39 P.M.', lines: ['UNM did not make', 'concessions with any', 'group behind the threat.'], hot: [0, 1], after: 5},
  report: {date: 'UPDATE · OCT. 28, 2026 · 12:39 P.M.', lines: ['… do not respond.', 'Preserve the message and', 'report the contact to the', "FBI's Internet Crime", 'Complaint Center at IC3.gov'], hot: [3, 4], after: 3},
};
const PW = 1000, PH = 1300, LH = 92, TOP = 430;
const pageTex = (key: keyof typeof PAGES) => tex('notice-' + key, PW, PH, (g, w, h) => {
  const P = PAGES[key], M = (s: string, x: number, y: number, size: number, weight: 700 | 900 = 700, align: CanvasTextAlign = 'left', col = '#1a1c24') => text(g, s, x, y, size, col, {font: 'Montserrat', weight, align, maxWidth: w - 150});
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h); g.fillStyle = '#b3211d'; g.fillRect(0, 0, w, 150);
  text(g, 'THE UNIVERSITY OF NEW MEXICO', w / 2, 62, 60, '#ffffff', {maxWidth: w - 120}); M('HEALTH SCIENCES · NEWSROOM', w / 2, 118, 32, 900, 'center', '#ffffff');
  M(P.date, 76, 232, 38, 900, 'left', '#b3211d'); g.fillStyle = '#1a1c24'; g.fillRect(76, 280, w - 152, 5);
  text(g, '“', 60, 372, 150, '#b3211d', {align: 'left'});
  P.lines.forEach((s, i) => M(s, 76, TOP + i * LH, 58, 900));
  g.fillStyle = '#c3c7d1'; const q = rng(key.length); for (let i = 0; i < P.after + 4; i++) g.fillRect(76, TOP + P.lines.length * LH + 30 + i * 46, (w - 152) * (i % 4 === 3 ? 0.4 + q() * 0.3 : 1), 16);
});
export const notice: Builder = (root) => {
  backdrop(root, ['#10131c', '#232a3c']);
  const page = grp(root, 0, 1.48, -0.4), W_ = 1.6, H_ = 2.08; page.rotation.z = -0.02;
  soft(panel(page, W_ + 0.07, H_ + 0.07, lit(INK, 1), 0, 0, -0.01));
  const T = {back: pageTex('back'), noconc: pageTex('noconc'), report: pageTex('report')}, pm = new THREE.MeshBasicMaterial({map: T.back}); soft(panel(page, W_, H_, pm, 0, 0, 0));
  // a highlighter over the line that matters
  const hl = new THREE.MeshBasicMaterial({color: '#ffe14a', transparent: true, blending: THREE.MultiplyBlending, depthWrite: false}), mark = soft(panel(page, 1, 1, hl, 0, 0, 0.004)); mark.renderOrder = 4;
  const glow = halo(root, 2.6, '#fff0c8', 0.12, 0, 1.5, -1.2);
  return {
    light: () => LIGHT.show,
    tick: ({f, shot}) => {
      const key = shot.v as keyof typeof PAGES, P = PAGES[key], cue = key === 'back' ? W(59) : key === 'noconc' ? W(150) : W(164) + 2;
      pm.map = T[key]; page.position.y = 1.48 + 0.01 * Math.sin(f * 0.06); page.scale.setScalar(pop(f, shot.at - 2, 8));
      const [a, b] = P.hot, k = smooth(f, cue, cue + 9), y0 = TOP + a * LH - LH / 2, y1 = TOP + b * LH + LH / 2, full = 0.86 * W_;
      mark.visible = k > 0.01; mark.scale.set(full * k, ((y1 - y0) / PH) * H_ * 0.9, 1); mark.position.set(-W_ / 2 + 0.07 * W_ + full * k / 2, H_ / 2 - ((y0 + y1) / 2 / PH) * H_, 0.004);
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.12;
    },
  };
};

// ------------------------------------------------------------------ every student and employee: what the group says it holds
const idTex = () => tex('ids', 1024, 1024, (g, w) => {
  const q = rng(77), cols = ['#2f6fd0', '#b3211d', '#3f8f9a', '#7a4fd0', '#d9652b'], N = 4, s = w / N;
  g.fillStyle = '#1a2233'; g.fillRect(0, 0, w, w);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c * s + 16, y = r * s + 22, cw = s - 32, ch = s - 44, staff = (r * N + c) % 3 === 1;
    g.fillStyle = '#fffdf4'; rrect(g, x, y, cw, ch, 16); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
    g.save(); rrect(g, x, y, cw, ch, 16); g.clip(); g.fillStyle = cols[Math.floor(q() * cols.length)]; g.fillRect(x, y, cw, 50); g.restore();
    text(g, staff ? 'STAFF' : 'STUDENT', x + cw / 2, y + 27, 34, '#ffffff');
    person(g, x + 62, y + 118, 62, ['#f5c9a0', '#c99067', '#8a5a3c', '#ffe2c2'][Math.floor(q() * 4)]);
    g.fillStyle = '#9aa3b2'; for (let i = 0; i < 3; i++) g.fillRect(x + 122, y + 84 + i * 28, (cw - 140) * (i === 2 ? 0.55 : 1), 13);
    g.fillStyle = '#1a1c24'; for (let i = 0; i < 9; i++) g.fillRect(x + 20 + i * ((cw - 40) / 9), y + ch - 34, 2 + q() * 8, 22);   // a barcode: nothing that could be read
  }
}, true);
export const ids: Builder = (root) => {
  backdrop(root, ['#0c1220', '#1a2233']);
  floor(root, 14, 12, tmat(tiled(grainTex('ids-floor', '#1c2536', 0.1), 5, 4)));
  const t = idTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 1.5); t.needsUpdate = true;
  panel(root, 4.8, 4.8, new THREE.MeshBasicMaterial({map: t}), 0, 2.1, -0.6);
  // a bar of light runs down the wall: somebody says they have read all of it
  const bar = soft(panel(root, 4.8, 0.09, new THREE.MeshBasicMaterial({color: '#8dff7a', transparent: true, opacity: 0.9, depthWrite: false}), 0, 2, -0.58)), wash = halo(root, 2.4, '#8dff7a', 0.2, 0, 2, -0.5);
  return {
    light: () => LIGHT.dark,
    tick: ({f, shot}) => { const u = ((f - shot.at) * 0.022) % 1, y = 3.5 - 3.1 * u; bar.position.y = y; wash.position.y = y; wash.scale.set(1.2, 0.3, 1); t.offset.set(0.1, (f - shot.at) * 0.0012); },
  };
};

// ------------------------------------------------------------------ at home, with a phone: the offer as the news carried it, and the warning
const note = (g: G2, x: number, y: number, s: number, rot = 0) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#62b77e'; g.strokeStyle = INK; g.lineWidth = s * 0.06; rrect(g, -s, -s * 0.5, 2 * s, s, s * 0.1); g.fill(); g.stroke();
  g.fillStyle = '#dff3e2'; g.beginPath(); g.ellipse(0, 0, s * 0.32, s * 0.36, 0, 0, 7); g.fill(); g.stroke(); text(g, '$', 0, s * 0.04, s * 0.6, '#2f7a4a'); g.restore();
};
export const home: Builder = (root) => {
  backdrop(root, ['#3a2c2a', '#5a4038']);
  floor(root, 14, 12, tmat(tiled(woodTex('home-floor', '#b98f62', '#7a5a3a'), 5, 5)));
  box(root, 9, 5.6, 0.3, '#e9c9a6', 0, 2.8, -2.0); box(root, 9, 0.2, 0.34, '#f6ead6', 0, 0.1, -1.98);
  // a window with the evening in it, a lamp, a sofa
  box(root, 1.3, 1.1, 0.08, '#f6ead6', -0.9, 1.95, -1.86); panel(root, 1.16, 0.96, smat(tex('home-win', 256, 212, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f5fa8'); gr.addColorStop(1, '#f2a56a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#7a4a44'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 150); g.lineTo(70, 120); g.lineTo(140, 160); g.lineTo(200, 130); g.lineTo(w, 156); g.lineTo(w, h); g.fill(); }), 1), -0.9, 1.95, -1.815);
  box(root, 0.05, 0.96, 0.03, '#f6ead6', -0.9, 1.95, -1.8); box(root, 1.16, 0.05, 0.03, '#f6ead6', -0.9, 1.95, -1.8);
  cyl(root, 0.16, 0.04, '#5a4a36', 1.45, 0.02, -1.2); rod(root, [1.45, 0, -1.2], [1.45, 1.55, -1.2], 0.025, '#5a4a36'); cyl(root, 0.3, 0.4, lit('#ffe2a8', 1.15), 1.45, 1.72, -1.2, 0.2);
  const sofa = '#4f7f8a'; box(root, 2.3, 0.42, 0.9, sofa, 0, 0.3, -0.75); box(root, 2.3, 0.75, 0.26, sofa, 0, 0.78, -1.1); for (const s of [-1, 1]) box(root, 0.24, 0.62, 0.9, '#44707a', s * 1.2, 0.42, -0.75);
  box(root, 0.5, 0.3, 0.16, '#f2c230', -0.75, 0.68, -0.9).rotation.z = 0.2;
  plant(root, -1.75, -1.3, 0.95, '#c9c2b4');
  const who = actor(root, PATIENT(2), {read: {expr: 'neutral', pose: 'hold', prop: 'phone', mode: 'sit'}, hm: {expr: 'nervous', pose: 'hold', prop: 'phone', mode: 'sit'}, no: {expr: 'stern', pose: 'cross', mode: 'sit'}}, -0.4, 0.44, -0.6, {scale: 1.05, res: 1.2});
  const cardT = (key: string, draw: (g: G2, w: number, h: number) => void, bg = '#f4f6fa') => screenTex('home-' + key, draw, 512, 368, bg);
  const T = {
    offer: cardT('offer', (g, w, h) => {                                                               // the offer, as a headline: it was posted, not sent to anyone
      g.fillStyle = '#1f2a44'; g.fillRect(0, 0, w, 74); text(g, 'NEWS', 84, 40, 50, '#ffffff'); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(w - 50, 37, 13, 0, 7); g.fill();
      note(g, 132, 178, 72, -0.22); note(g, 176, 206, 72, 0.1); text(g, 'UP TO', 370, 146, 50, INK, {font: 'Montserrat'}); text(g, '$2,500', 366, 212, 96, '#1f7a44', {maxWidth: 250});
      text(g, 'HACKERS OFFER TO PAY PATIENTS', w / 2, h - 46, 38, INK, {font: 'Montserrat', maxWidth: w - 40});
    }),
    warn: cardT('warn', (g, w, h) => {                                                                 // the university's notice
      g.fillStyle = '#b3211d'; g.fillRect(0, 0, w, 74); text(g, 'UNIVERSITY NOTICE', w / 2, 40, 50, '#ffffff');
      text(g, 'DO NOT', w / 2, 152, 110, '#b3211d'); text(g, 'RESPOND', w / 2, 262, 110, '#b3211d'); text(g, 'UNM · OCT. 28, 2026', w / 2, h - 30, 30, INK, {font: 'Montserrat'});
    }, '#fffdf6'),
    hook: cardT('hook', (g, w, h) => {                                                                 // money on a hook
      const cx = w / 2 + 70;
      g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, 92); g.stroke();
      note(g, cx - 96, 196, 104, -0.16);
      // the hook goes through the note and comes out under it
      const J = (lw: number, c: string) => { g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, 90); g.lineTo(cx, 214); g.arc(cx - 44, 214, 44, 0, Math.PI * 0.8); g.stroke(); };
      J(26, INK); J(14, '#d5dbe4');
      g.fillStyle = INK; g.beginPath(); g.arc(cx, 90, 11, 0, 7); g.fill();
      text(g, 'ONE MORE SCAM?', w / 2, h - 40, 52, '#b3211d', {maxWidth: w - 50});
    }, '#dfeaf4'),
  };
  const scr = new THREE.MeshBasicMaterial({map: T.offer}), BY = 1.5, bub = bubble(root, 0.44, BY, 0.2, 0.9, 0.65, scr, [-0.5, -0.24]);
  return {
    light: () => ({...LIGHT.warm, amb: 1.3, keyI: 1.0}),
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      let on: keyof typeof T = 'offer', at = shot.at, st = 'read';
      if (v === 'offer') { at = W(112) - 2; st = f >= W(116) ? 'hm' : 'read'; }                         // the headline comes up on "patient"
      else if (v === 'warn') { on = 'warn'; at = W(154) - 2; st = f >= W(155) + 2 ? 'no' : 'hm'; }       // the notice on "warns"; the phone goes down on "do not answer"
      else { on = 'hook'; at = shot.at - 30; st = 'no'; }
      scr.map = T[on]; bub.g.visible = f >= at; bub.g.scale.setScalar(0.95 * pop(f, at, 7)); bub.g.position.y = BY + 0.012 * Math.sin(f * 0.08); bub.g.rotation.z = v === 'hook' ? 0.03 * Math.sin(f * 0.11) : shake(f, at, 0.04, 9);
      who.show(st); who.node.position.y = 0.44 + (v === 'warn' ? hop(f, W(155) + 2, 0.05, 8) : 0); who.tick(f, cam);
    },
  };
};
export {ball};
