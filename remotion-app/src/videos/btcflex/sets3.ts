// Sets of the bitcoin flex short, part 3: the feed, the investigator's board, the courtroom, the courthouse steps and
// the closing stage with its two halves.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, foldTex, grainTex, grp, hop, lerp, lit, mesh, panel, pool, pop, rod, rrect, smat, smooth, soft, tex, text, tiled, tmat, torus, vgrad, woodTex, type G2} from './kit';
import {actor, JUDGE, LAM, LAWYER, PROSECUTOR, SLEUTH} from './cast';
import {bubble, bundle, coin, flagPole, flagUS, glints, halo, laptop, lectern, mug, signTex, table} from './props';
import {W} from './story';
import {INK, LIGHT, supercar, type Builder} from './sets';
import {blocks} from './sets2';

const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };

// ------------------------------------------------------------------ little pictures: what he posted
type Icon = (g: G2, x: number, y: number, s: number) => void;
const carIcon = (g: G2, x: number, y: number, s: number, c = '#ffd21f') => {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c; g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-92, 20); g.lineTo(-92, -4); g.lineTo(-52, -12); g.lineTo(-28, -46); g.lineTo(34, -46); g.lineTo(60, -12); g.lineTo(94, -2); g.lineTo(94, 20); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#eaf6ff'; g.beginPath(); g.moveTo(-36, -14); g.lineTo(-20, -36); g.lineTo(28, -36); g.lineTo(44, -14); g.closePath(); g.fill(); g.stroke();
  for (const wx of [-54, 54]) { g.fillStyle = '#1a1c24'; g.beginPath(); g.arc(wx, 22, 21, 0, 7); g.fill(); g.fillStyle = '#c9ced6'; g.beginPath(); g.arc(wx, 22, 8, 0, 7); g.fill(); }
  g.restore();
};
const jetIcon: Icon = (g, x, y, s) => {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.28); g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(104, 0); g.quadraticCurveTo(96, -20, 60, -20); g.lineTo(-64, -20); g.lineTo(-92, -58); g.lineTo(-110, -58); g.lineTo(-98, -10); g.quadraticCurveTo(-104, 16, -70, 18); g.lineTo(-8, 18); g.lineTo(-44, 62); g.lineTo(-20, 62); g.lineTo(34, 18); g.lineTo(70, 18); g.quadraticCurveTo(100, 16, 104, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = INK; for (const wx of [0, 26, 52]) { g.beginPath(); g.arc(wx, -4, 6, 0, 7); g.fill(); } g.restore();
};
const bagIcon: Icon = (g, x, y, s) => {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round';
  g.beginPath(); g.arc(0, -22, 34, Math.PI, 0); g.stroke(); g.fillStyle = '#e8762c'; g.beginPath(); g.moveTo(-62, -22); g.lineTo(62, -22); g.lineTo(74, 46); g.lineTo(-74, 46); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffd21f'; g.fillRect(-12, -4, 24, 18); g.strokeRect(-12, -4, 24, 18); g.restore();
};
const villaIcon: Icon = (g, x, y, s) => {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round';
  g.fillStyle = '#fffdf4'; g.fillRect(-84, -8, 122, 56); g.strokeRect(-84, -8, 122, 56); g.fillRect(-64, -44, 82, 36); g.strokeRect(-64, -44, 82, 36);
  g.fillStyle = '#3fc8d8'; for (const wx of [-70, -32, 6]) g.fillRect(wx, 6, 26, 26); g.fillRect(-50, -34, 54, 18);
  g.beginPath(); g.moveTo(72, 48); g.quadraticCurveTo(64, 6, 76, -26); g.stroke(); g.fillStyle = '#2f9e5a'; for (const a of [-2.5, -1.9, -1.2, -0.6]) { g.beginPath(); g.ellipse(76 + 26 * Math.cos(a), -26 + 26 * Math.sin(a), 30, 9, a, 0, 7); g.fill(); g.stroke(); }
  g.restore();
};
const cashIcon: Icon = (g, x, y, s) => {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round';
  for (const a of [-0.5, -0.17, 0.17, 0.5]) { g.save(); g.rotate(a); g.fillStyle = '#4fbf78'; g.fillRect(-34, -84, 68, 120); g.strokeRect(-34, -84, 68, 120); g.fillStyle = '#dff3e2'; g.beginPath(); g.ellipse(0, -26, 16, 24, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
  g.restore();
};
const heart = (g: G2, x: number, y: number, s: number, c = '#ff4f7a') => { g.fillStyle = c; g.beginPath(); for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; g.lineTo(x + s * Math.sin(t) ** 3, y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16); } g.closePath(); g.fill(); };

// ------------------------------------------------------------------ feed: "posting and appearing in photos"
const POSTS: [string[], Icon][] = [[['#19c2c2', '#8fe6e6'], (g, x, y, s) => carIcon(g, x, y, s)], [['#ff9a6a', '#ffe0b0'], jetIcon], [['#5a1fb0', '#8a4fd0'], cashIcon], [['#19a8c8', '#9fe8f0'], villaIcon]];
const feedTex = () => tex('feed-roll', 600, 1900, (g, w) => {
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, 1900);
  POSTS.forEach(([cols, icon], i) => {
    const y0 = i * 475; const gr = g.createLinearGradient(0, y0, 0, y0 + 340); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.fillRect(0, y0, w, 340);
    icon(g, w / 2, y0 + 178, 1.6); heart(g, 64, y0 + 392, 26); g.fillStyle = '#1a1c24'; rrect(g, 116, y0 + 374, 150, 34, 17); g.fill(); g.fillStyle = '#c3c7d1'; rrect(g, 40, y0 + 430, 360, 16, 8); g.fill();
  });
});
const feedHead = () => tex('feed-head', 600, 150, (g, w, h) => {
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff4fa3'; g.beginPath(); g.arc(84, 76, 46, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); text(g, '$', 84, 80, 62, '#ffe14a', {stroke: INK, sw: 9});
  text(g, '$$$', 216, 78, 72, '#1a1c24'); g.fillStyle = '#3f8cff'; rrect(g, 430, 46, 130, 58, 18); g.fill(); g.fillStyle = '#d9dce4'; g.fillRect(0, h - 6, w, 6);
});
const heartTex = () => tex('feed-heart', 96, 96, (g) => heart(g, 48, 50, 42));
export const feed: Builder = (root) => {
  backdrop(root, ['#3a0f8a', '#7a2fd0', '#b060f0']);
  floor(root, 16, 12, '#3a148a');
  const ph = grp(root, 0, 2.2, 0); ph.rotation.set(0, 0.14, -0.035);
  box(ph, 2.02, 3.92, 0.14, '#15121c'); soft(panel(ph, 1.8, 0.45, smat(feedHead(), 1.05), 0, 1.575, 0.075));
  const roll = soft(panel(ph, 1.8, 3.15, smat(feedTex(), 1.05), 0, -0.225, 0.075)), map = (roll.material as THREE.MeshBasicMaterial).map!, K = 1050 / 1900; map.repeat.y = K;
  const hearts = Array.from({length: 8}, () => card(root, 0.26, 0.26, heartTex(), 0, 0, 0.5, 1.15));
  return {
    light: () => LIGHT.show,
    tick: ({f, t}) => {
      map.offset.y = (1 - K) * (1 - 0.92 * smooth(t, 5, 44));
      ph.position.y = 2.2 + 0.02 * Math.sin(f * 0.1);
      hearts.forEach((h, i) => { const u = (f * 0.016 + i * 0.125) % 1; h.position.set(0.62 + 0.22 * Math.sin(f * 0.07 + i * 2.2) + 0.1 * (i % 3), 0.9 + u * 2.7, 0.45 + 0.02 * i); h.scale.setScalar(Math.sin(Math.PI * Math.min(1, u * 1.6)) * (0.6 + 0.5 * ((i * 7) % 5) / 5)); h.visible = t > 3; });
    },
  };
};

// ------------------------------------------------------------------ sleuth: someone was watching
const BX = 0.75, BY = 2.25, BZ = -1.2, BW = 2.5, BH = 3.27;
const bx = (px: number) => BX + (px / 800 - 0.5) * BW, by = (py: number) => BY + (0.5 - py / 1046) * BH;
const PHOTOS: [number, number, number, Icon][] = [[205, 745, -0.06, (g, x, y, s) => carIcon(g, x, y, s)], [595, 735, 0.05, jetIcon], [205, 965, 0.04, bagIcon], [595, 975, -0.05, villaIcon]];
const boardTex = () => tex('sleuth-board', 800, 1046, (g, w, h) => {
  g.fillStyle = '#d9b46a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,60,20,${0.05 + 0.1 * ((i * 37) % 10) / 10})`; g.fillRect((i * 193) % w, (i * 389) % h, 3, 3); }
  const boxAt = (s: string, x: number, y: number, bw: number, fill: string) => { g.fillStyle = fill; rrect(g, x - bw / 2, y - 30, bw, 60, 12); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); text(g, s, x, y + 3, 40, INK, {maxWidth: bw - 22}); };
  const arrow = (x0: number, y0: number, x1: number, y1: number) => { g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 16 * Math.cos(a - 0.5), y1 - 16 * Math.sin(a - 0.5)); g.moveTo(x1, y1); g.lineTo(x1 - 16 * Math.cos(a + 0.5), y1 - 16 * Math.sin(a + 0.5)); g.stroke(); };
  arrow(400, 152, 400, 228); for (const x of [200, 400, 600]) { arrow(400, 294, x, 334); arrow(x, 400, x, 458); }
  boxAt('4,100 BTC', 400, 120, 210, '#ffb52e'); boxAt('MIXERS', 400, 262, 180, '#fffdf4'); for (const x of [200, 400, 600]) { boxAt('EXCHANGE', x, 368, 172, '#fffdf4'); g.fillStyle = '#e8ecf6'; g.beginPath(); g.arc(x, 500, 38, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); text(g, '?', x, 504, 56, '#4a4560'); }
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(40, 590); g.lineTo(w - 40, 590); g.stroke();
  g.strokeStyle = '#e3342f'; g.lineWidth = 5; g.beginPath(); g.moveTo(PHOTOS[0][0], PHOTOS[0][1]); g.lineTo(PHOTOS[3][0], PHOTOS[3][1]); g.moveTo(PHOTOS[1][0], PHOTOS[1][1]); g.lineTo(PHOTOS[2][0], PHOTOS[2][1]); g.stroke();
  for (const [x, y, a, icon] of PHOTOS) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#fffdf4'; g.strokeStyle = INK; g.lineWidth = 7; g.fillRect(-118, -96, 236, 196); g.strokeRect(-118, -96, 236, 196); g.fillStyle = '#bfe6ff'; g.fillRect(-104, -82, 208, 138); icon(g, 0, -8, 0.72); heart(g, -84, 78, 13); g.fillStyle = '#b9bcc6'; g.fillRect(-60, 70, 120, 14); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(0, -90, 11, 0, 7); g.fill(); g.restore(); }
});
const miniPost = () => tex('sleuth-post', 300, 300, (g, w, h) => { vgrad(g, w, h, ['#19c2c2', '#8fe6e6']); carIcon(g, 150, 124, 1.0); g.fillStyle = '#fffdf4'; g.fillRect(0, 222, w, 78); heart(g, 44, 258, 20); g.fillStyle = '#1a1c24'; rrect(g, 82, 246, 100, 24, 10); g.fill(); });
export const sleuth: Builder = (root) => {
  backdrop(root, ['#0a1418', '#14282e']);
  floor(root, 14, 12, tmat(tiled(woodTex('sleuth-floor', '#4a3a2c', '#2a1e14'), 4, 4)));
  panel(root, 12, 6, tmat(tiled(grainTex('sleuth-wall', '#1f4a4a', 0.08), 5, 3)), 0, 3, BZ - 0.12);
  box(root, BW + 0.14, BH + 0.14, 0.08, '#5a3e28', BX, BY, BZ - 0.05); soft(panel(root, BW, BH, smat(boardTex(), 1.0), BX, BY, BZ));
  const dim = soft(panel(root, 12, 6, new THREE.MeshBasicMaterial({color: '#02060a', transparent: true, opacity: 0.8, depthWrite: false}), 0, 3, BZ + 0.05)); dim.renderOrder = 3;
  const tagM = soft(panel(root, 0.8, 0.3, smat(signTex('sleuth-miami', 400, 150, '#e3342f', '#ffffff', [['MIAMI', 120, 0.55]], {border: INK}), 1.1), bx(400), by(855), BZ + 0.03));
  const coinsB = [200, 400, 600].map(() => coin(root, 0.11)), lens = grp(root); torus(lens, 0.3, 0.035, '#23252e'); soft(mesh(lens, new THREE.CircleGeometry(0.28, 28), new THREE.MeshBasicMaterial({color: '#bfe6ff', transparent: true, opacity: 0.22, depthWrite: false}))); rod(lens, [0.22, -0.22, 0], [0.5, -0.52, 0], 0.04, '#5a3e28');
  // the desk
  table(root, -1.2, 0.5, 1.5, 0.7, {h: 0.76, top: '#6a4c36', leg: '#2a1e14', skirt: '#4a3424'});
  laptop(root, -1.2, 0.76, 0.45, {ry: Math.PI, w: 0.6, body: '#3a3f4a', back: lit('#7af0e0', 1.3)}); mug(root, -0.62, 0.76, 0.6, '#f3f1ea');
  cyl(root, 0.1, 0.03, '#2b2f3a', -1.82, 0.775, 0.4); cyl(root, 0.014, 0.46, '#2b2f3a', -1.82, 1.02, 0.4); const sh = cyl(root, 0.17, 0.2, lit('#ffe2a0', 1.5), -1.82, 1.32, 0.4, 0.09); sh.castShadow = false;
  const lampGlow = halo(root, 1.2, '#ffd98a', 0.2, -1.8, 1.3, 0.5), scrGlow = halo(root, 1.0, '#7af0e0', 0.3, -1.2, 1.25, 0.2);
  const bub = bubble(root, -0.56, 1.95, 0.35, 0.44, 0.44, smat(miniPost(), 1.1), [-0.26, -0.22]);
  const sit = actor(root, SLEUTH, {a: {pose: 'type', mode: 'sit'}}, -1.2, 0.6, -0.05, {scale: 1.0, res: 1.2, shadow: 0});
  const stand = actor(root, SLEUTH, {a: {pose: 'hold', prop: 'lens'}}, 0.15, 0, 0.6, {scale: 1.05, res: 1.2, wide: true});
  return {
    light: (v) => v === 'watch' ? {...LIGHT.dark, amb: 0.6, keyI: 0.35} : {...LIGHT.room, amb: 1.4},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, a = shot.at, watch = v === 'watch';
      dim.visible = watch || v === 'who'; op(dim, watch ? 0.8 : 0.72); op(lampGlow, watch ? 0 : 0.2); op(scrGlow, watch ? 0.34 + 0.06 * Math.sin(f * 0.5) : 0.14);
      sit.node.visible = watch; sit.tick(f, cam); stand.node.visible = v === 'who'; stand.node.position.y = hop(f, a + 2, 0.1, 8); stand.tick(f, cam);
      bub.g.visible = watch; bub.g.scale.setScalar(pop(f, a + 3, 8));
      // one coin leaves the wallet and comes out of the mixers as three, one down each thread; the glass goes after one of them,
      // and then from picture to picture
      const run = v === 'coins', u1 = smooth(t, 0, 10), u2 = smooth(t, 10, 20), u3 = smooth(t, 20, 30), xs = [200, 400, 600];
      const pyAt = t < 10 ? lerp(120, 262, u1) : t < 20 ? lerp(262, 368, u2) : lerp(368, 500, u3), arc = 0.1 * Math.sin(Math.PI * (t < 10 ? u1 : t < 20 ? u2 : u3));
      coinsB.forEach((c, i) => { const px = t < 10 ? 400 : t < 20 ? lerp(400, xs[i], u2) : xs[i]; c.visible = run && (t >= 10 || i === 1); c.position.set(bx(px), by(pyAt) + arc, BZ + 0.2); c.rotation.y = f * 0.4 + i; });
      const posts = v === 'posts', stops: [number, number][] = [[bx(PHOTOS[0][0]), by(PHOTOS[0][1])], [bx(PHOTOS[1][0]), by(PHOTOS[1][1])], [bx(PHOTOS[3][0]), by(PHOTOS[3][1])], [bx(400) + 0.5, by(855) - 0.42]];
      const leg = Math.min(2, Math.floor(t / 8)), w = smooth(t, leg * 8, leg * 8 + 7);
      lens.visible = run || posts;
      if (run) lens.position.set(bx(t < 10 ? 400 : t < 20 ? lerp(400, 600, u2) : 600) + 0.03, by(pyAt) + arc + 0.02, BZ + 0.32);
      if (posts) lens.position.set(lerp(stops[leg][0], stops[leg + 1][0], w), lerp(stops[leg][1], stops[leg + 1][1], w), BZ + 0.32);
      tagM.visible = posts && f >= W(133); tagM.scale.setScalar(pop(f, W(133), 6));
    },
  };
};

// ------------------------------------------------------------------ court: the plea, and the judge's question about the cars
const sealTex = () => tex('court-seal', 300, 300, (g, w) => {
  g.fillStyle = '#c9a23a'; g.beginPath(); g.arc(w / 2, w / 2, 144, 0, 7); g.fill(); g.strokeStyle = '#6b4a12'; g.lineWidth = 10; g.stroke(); g.beginPath(); g.arc(w / 2, w / 2, 112, 0, 7); g.lineWidth = 5; g.stroke();
  g.strokeStyle = '#3a2c08'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, 82); g.lineTo(w / 2, 220); g.moveTo(88, 110); g.lineTo(212, 110); g.moveTo(110, 220); g.lineTo(190, 220); g.stroke();
  g.lineWidth = 7; for (const x of [88, 212]) { g.beginPath(); g.moveTo(x, 110); g.lineTo(x - 28, 168); g.moveTo(x, 110); g.lineTo(x + 28, 168); g.stroke(); g.beginPath(); g.arc(x, 168, 30, 0, Math.PI); g.stroke(); }
});
const TOYS = ['#d81f3a', '#a6e22e', '#2f7fe0', '#ffd21f', '#e8762c'];
export const court: Builder = (root) => {
  backdrop(root, ['#2a2018', '#4a382a']);
  floor(root, 14, 12, tmat(tiled(woodTex('court-floor', '#7a5a3c', '#4a3220'), 4, 4)));
  panel(root, 12, 5.6, tmat(tiled(woodTex('court-wall', '#8a6444', '#5a3e28'), 3, 2)), 0, 2.8, -3.4);
  box(root, 4.6, 1.5, 0.9, '#5a3e28', 0, 0.75, -2.5); box(root, 4.8, 0.1, 1.0, '#3a2818', 0, 1.52, -2.5); box(root, 1.3, 2.0, 0.2, '#3a2818', 0, 2.5, -3.2);
  soft(panel(root, 0.9, 0.9, smat(sealTex(), 1.05, true), 0, 3.95, -3.38)); flagPole(root, -2.7, -2.7, flagUS(), {h: 3.9, w: 1.1});
  cyl(root, 0.13, 0.05, '#3a2818', 0.8, 1.6, -2.3); box(root, 0.05, 0.05, 0.3, '#5a3e28', 0.8, 1.7, -2.3); cyl(root, 0.045, 0.14, '#5a3e28', 0.8, 1.7, -2.14).rotation.x = Math.PI / 2;      // a gavel on its block
  box(root, 9, 0.9, 0.08, '#5a3e28', 0, 0.45, -1.3); box(root, 9, 0.06, 0.16, '#3a2818', 0, 0.92, -1.3);
  table(root, -0.82, 0.3, 1.3, 0.8, {top: '#8a6444', leg: '#3a2818', skirt: '#6b4a30'}); table(root, 0.82, 0.3, 1.3, 0.8, {top: '#8a6444', leg: '#3a2818', skirt: '#6b4a30'});
  const judge = actor(root, JUDGE, {sit: {expr: 'stern', pose: 'desk'}, ask: {expr: 'neutral', pose: 'point'}, wait: {expr: 'stern', pose: 'cross'}}, 0, 0.8, -2.9, {scale: 1.0, res: 1.3, wide: true, shadow: 0});
  const me = actor(root, LAM(3), {idle: {expr: 'nervous'}, guilty: {expr: 'nervous', pose: 'both', prop: 'card', text: 'GUILTY', big: true}, shock: {expr: 'shock'}, think: {expr: 'nervous', pose: 'think'}, lost: {expr: 'dazed', pose: 'shrug'}}, -0.82, 0, -0.45, {scale: 1.0, res: 1.3, wide: true});
  const pros = actor(root, PROSECUTOR, {a: {expr: 'stern', pose: 'hold', prop: 'paper'}}, 0.82, 0, -0.5, {scale: 1.0, res: 1.1, wide: true});
  const toys = TOYS.slice(0, 3).map((c) => supercar(root, c, 0.2, true)), orbit = TOYS.map((c) => supercar(root, c, 0.12, true));
  return {
    light: () => LIGHT.warm,
    tick: ({f, cam, shot}) => {
      const v = shot.v;
      judge.show(v === 'judge' ? (f >= W(188) ? 'ask' : 'sit') : v === 'time' ? 'wait' : 'sit'); judge.tick(f, cam);
      me.show(v === 'plea' ? (f >= W(176) - 2 ? 'guilty' : 'idle') : v === 'years' ? (f >= W(184) - 1 ? 'shock' : 'idle') : v === 'time' ? (f >= W(195) - 2 ? 'lost' : 'think') : 'idle');
      me.node.position.y = hop(f, W(176) - 2, 0.08, 8) + hop(f, W(184) - 1, 0.1, 8) + hop(f, W(197), 0.08, 8); me.tick(f, cam); pros.tick(f, cam);
      // three toy cars roll onto the bench as the judge asks; later a ring of them goes round his head
      toys.forEach((c, i) => { const k = smooth(f, W(189) - 2 + i * 3, W(189) + 10 + i * 3); c.visible = v === 'judge' || v === 'time'; c.position.set(lerp(2.6, -0.5 + i * 0.45, v === 'judge' ? k : 1), 1.575, -2.18); c.rotation.y = Math.PI + 0.2; });
      orbit.forEach((c, i) => { const ang = f * 0.11 + i * 1.2566, on = v === 'time' && f >= W(195) - 2; c.visible = on; c.position.set(-0.82 + 0.62 * Math.cos(ang), 2.02 + 0.07 * Math.sin(ang * 2 + i), -0.45 + 0.5 * Math.sin(ang)); c.rotation.y = -ang - Math.PI / 2; c.scale.setScalar(0.12 * pop(f, W(195) - 2 + i * 2, 6)); });
    },
  };
};

// ------------------------------------------------------------------ steps: two statements outside the courthouse
export const steps: Builder = (root) => {
  backdrop(root, ['#6fb4e8', '#cfe8f8']);
  floor(root, 30, 24, tmat(tiled(grainTex('steps-plaza', '#e3ddcd', 0.06), 8, 6)));
  for (let i = 0; i < 6; i++) box(root, 14, 0.2, 0.5, '#efe9da', 0, 0.1 + i * 0.2, -1.2 - i * 0.5);
  box(root, 14, 1.2, 5, '#efe9da', 0, 0.6, -6.4); box(root, 14, 6, 0.4, '#f1ede2', 0, 4.2, -6.2); box(root, 2.2, 3.6, 0.2, '#5a3a22', 0, 3.0, -5.95); box(root, 14, 0.7, 1.6, '#e3ddcd', 0, 7.0, -4.6);
  for (const x of [-4.2, -2.1, 2.1, 4.2]) { cyl(root, 0.36, 5.4, '#f6f3ea', x, 3.9, -4.4, 0.32, 20); box(root, 0.9, 0.2, 0.9, '#e3ddcd', x, 1.3, -4.4); }
  // on the left: the prosecutor's lectern and a flag; on the right: three microphones for the defence
  lectern(root, -1.4, 1.0, '#6b4a30', signTex('steps-plaque', 580, 210, '#16223c', '#ffffff', [['U.S. ATTORNEY’S', 78, 0.32], ['OFFICE', 78, 0.72]], {border: '#c9a23a'})); flagPole(root, -2.3, 0.2, flagUS(), {h: 3.3, w: 1.0, left: true}); box(root, 1.0, 0.3, 0.7, '#e3ddcd', -1.4, 0.15, 0.4);
  const pros = actor(root, PROSECUTOR, {a: {expr: 'stern', pose: 'desk'}, b: {expr: 'stern', pose: 'point'}}, -1.4, 0.3, 0.45, {scale: 1.0, res: 1.2, wide: true});
  for (const [dx, c] of [[-0.62, '#e3342f'], [0, '#2f7fe0'], [0.62, '#ffd21f']] as const) { const top = dx ? 1.0 : 0.86; cyl(root, 0.12, 0.03, '#15161b', 1.6 + dx, 0.015, 1.75); cyl(root, 0.016, top, '#15161b', 1.6 + dx, top / 2, 1.75); ball(root, 0.07, '#15161b', 1.6 + dx, top + 0.06, 1.75).scale.y = 1.4; box(root, 0.13, 0.1, 0.1, c, 1.6 + dx, top - 0.1, 1.75); }   // chest high: a microphone at mouth height hides the mouth
  const def = actor(root, LAWYER, {a: {expr: 'neutral', pose: 'hold', prop: 'paper'}, b: {expr: 'nervous', pose: 'shrug'}}, 1.6, 0, 1.0, {scale: 1.0, res: 1.3, wide: true});
  return {
    light: () => LIGHT.day,
    tick: ({f, cam}) => {
      pros.show(f >= W(204) ? 'b' : 'a'); pros.node.position.y = 0.3 + hop(f, W(204), 0.07, 8); pros.tick(f, cam);
      def.show(f >= W(209) ? 'b' : 'a'); def.node.position.y = hop(f, W(209), 0.07, 8); def.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ split: a crime boss, or a kid in over his head
export const split: Builder = (root) => {
  backdrop(root, ['#0a0612', '#160a24']);
  floor(root, 12, 14, '#4a0a16', 0, -6, 0); floor(root, 12, 14, '#0a1c5a', 0, 6, 0);
  panel(root, 7, 8, tmat(tiled(foldTex('split-red', '#b0142c', '#5a0612', 8), 1.4, 1)), -3.5, 4, -2.3); panel(root, 7, 8, tmat(tiled(grainTex('split-blue', '#1a3aa8', 0.08), 4, 4)), 3.5, 4, -2.3);
  const line = box(root, 0.035, 0.012, 6.2, lit('#ffffff', 1.1), 0, 0.01, 0); line.castShadow = false;
  // the left half: a throne, a crown, money
  const gold = '#d9a514'; box(root, 1.0, 0.5, 0.85, gold, -1.5, 0.25, -0.9); box(root, 1.0, 2.3, 0.16, gold, -1.5, 1.15, -1.3); for (const s of [-1, 1]) box(root, 0.14, 0.9, 0.85, gold, -1.5 + s * 0.5, 0.45, -0.9); for (const dx of [-0.36, 0, 0.36]) cone(root, 0.13, 0.4, gold, -1.5 + dx, 2.5, -1.3, 4);
  box(root, 0.74, 0.1, 0.6, '#8a1024', -1.5, 0.55, -0.88);
  const crown = grp(root, -0.95, 2.5, -0.2); crown.scale.setScalar(1.3); const band = cyl(crown, 0.3, 0.17, gold, 0, 0, 0, 0.33, 24); band.castShadow = false; for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.3; cone(crown, 0.085, 0.3, gold, 0.3 * Math.cos(a), 0.22, 0.3 * Math.sin(a), 4); ball(crown, 0.05, lit('#ff3b4c', 1.3), 0.3 * Math.cos(a), 0.4, 0.3 * Math.sin(a)); }
  const twinkle = glints(root, [[-0.78, 2.78, 0.1], [-1.24, 2.62, 0.1]]);
  for (let i = 0; i < 6; i++) { const b = bundle(root, 1.1); b.position.set(-1.85 + (i % 3) * 0.36, 0.045 + Math.floor(i / 3) * 0.085, 0.9 + (i % 2) * 0.05); b.rotation.y = 0.2 * (i % 2 ? 1 : -1); }
  // the right half: a controller, the game, a beanbag, a school bag
  const pad = grp(root, 1.0, 2.5, -0.2), grey = '#7f8aa8'; box(pad, 0.7, 0.26, 0.14, grey, 0, 0, 0); for (const s of [-1, 1]) { const gr = ball(pad, 0.2, grey, s * 0.38, -0.06, 0); gr.scale.set(1, 1.25, 0.6); }
  box(pad, 0.14, 0.045, 0.03, '#15161b', -0.22, 0.03, 0.08); box(pad, 0.045, 0.14, 0.03, '#15161b', -0.22, 0.03, 0.08);
  const dotsM = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({color: '#3a4260'})); ([[0.16, 0.03], [0.28, 0.03], [0.22, 0.09], [0.22, -0.03]] as const).forEach(([x, y], i) => { const o = ball(pad, 0.033, dotsM[i], x, y, 0.08); o.castShadow = false; });
  box(root, 0.08, 1.2, 0.08, '#15161b', 1.55, 0.6, -0.8); box(root, 1.2, 0.8, 0.06, '#0a0c14', 1.55, 1.6, -0.8); soft(panel(root, 1.1, 0.7, smat(tex('split-game', 440, 280, (g, w, h) => blocks(g, w, h, 170, 28)), 1.1), 1.55, 1.6, -0.765));
  const bag = ball(root, 0.6, '#2f5fe0', 1.4, 0.34, 0.15); bag.scale.set(1.15, 0.6, 1); box(root, 0.5, 0.6, 0.26, '#c81e3c', 1.9, 0.3, 1.0); const hd = torus(root, 0.13, 0.03, '#8a1024', 1.9, 0.62, 1.0); void hd; box(root, 0.3, 0.22, 0.03, '#8a1024', 1.9, 0.26, 1.14);
  const spot = pool(root, 1.3, '#fff0c8', 0.36, 0, 0.3); beam(root, 0.12, 1.2, 7, '#fff0c8', 0.03, 0, 7, -0.4);
  const glowA = halo(root, 1.5, '#ffd21f', 0, -1.0, 2.5, -0.5), glowB = halo(root, 1.5, '#7ad0ff', 0, 1.0, 2.5, -0.5);
  const me = actor(root, LAM(0), {mid: {expr: 'nervous', pose: 'shrug'}, left: {expr: 'nervous', pose: 'shrug', look: -1}, right: {expr: 'nervous', pose: 'shrug', look: 1}}, 0, 0, 0.3, {scale: 1.0, res: 1.2, wide: true});
  return {
    light: () => ({...LIGHT.dark, amb: 1.25, keyI: 0.9}),
    tick: ({f, cam}) => {
      const a0 = W(218) - 2, A = W(223) - 2, B = W(227) - 2;                                 // 43 and 44 are one take: everything is timed from words
      const k = smooth(f, a0 + 2, a0 + 20); line.scale.z = Math.max(0.001, k); line.position.z = 3.4 - 3.1 * k;
      me.show(f >= B ? 'right' : f >= A ? 'left' : 'mid'); me.node.position.y = hop(f, A, 0.06, 8) + hop(f, B, 0.06, 8); me.tick(f, cam);
      crown.position.y = 2.5 + 0.04 * Math.sin(f * 0.09) + hop(f, A, 0.12, 9); crown.rotation.y = f * 0.02; crown.rotation.z = 0.12;
      pad.position.y = 2.5 + 0.04 * Math.sin(f * 0.09 + 1.5) + hop(f, B, 0.12, 9); pad.rotation.z = -0.14 + 0.03 * Math.sin(f * 0.07);
      twinkle(f, f >= A); op(glowA, 0.34 * smooth(f, A, A + 6)); op(glowB, 0.34 * smooth(f, B, B + 6));
      dotsM.forEach((m, i) => m.color.set(f >= B ? ['#ff3b4c', '#3fbf5a', '#ffd21f', '#3f8cff'][i] : '#3a4260').multiplyScalar(f >= B ? 1.5 : 1));
      op(spot, 0.36 + 0.03 * Math.sin(f * 0.2));
    },
  };
};
