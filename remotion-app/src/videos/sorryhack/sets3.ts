// Sets of the sorry hackers short, part 3: the group's den, the outage as the group tells it, the second campus, its
// computer room, the empty line-up, the closing question.
import * as THREE from 'three';
import {backdrop, ball, beam, box, cone, cyl, floor, grainTex, grp, hop, lamp, lit, panel, pool, pop, rng, rod, rrect, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, woodTex} from './kit';
import {actor, GREEN, HOOD, STUDENT, type Actor, type Draw} from './cast';
import {folder, halo, monitor, officeChair, screenTex, signTex, streetLamp, table} from './props';
import {arcs, INK, LIGHT, padlock, rings, talkTex, type Builder} from './sets';
import {W} from './story';

// ------------------------------------------------------------------ the group: three hoods, no faces, a name it gave itself
const codeTex = (seed: number) => screenTex('den-code-' + seed, (g, w, h) => {
  const q = rng(seed); g.fillStyle = GREEN; for (let r = 0; r < 12; r++) { let x = 20 + (q() < 0.4 ? 30 : 0); while (x < w - 60) { const l = 14 + q() * 70; g.globalAlpha = 0.35 + q() * 0.65; g.fillRect(x, 22 + r * 28, l, 10); x += l + 12; if (q() < 0.2) break; } }
  g.globalAlpha = 1;
}, 512, 368, '#041008');
const letterTex = (ch: string) => tex('den-letter-' + ch, 200, 240, (g, w, h) => {
  g.fillStyle = '#0a0f0c'; rrect(g, 4, 4, w - 8, h - 8, 22); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.stroke();
  // dots, as a sign board would spell it
  const cv = document.createElement('canvas'); cv.width = 20; cv.height = 24; const c = cv.getContext('2d')!; c.fillStyle = '#fff'; c.font = '400 26px Anton, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 10, 13.5);
  const d = c.getImageData(0, 0, 20, 24).data; g.fillStyle = '#ffffff'; for (let y = 0; y < 24; y++) for (let x = 0; x < 20; x++) if (d[(y * 20 + x) * 4 + 3] > 110) { g.beginPath(); g.arc(18 + x * 8.6, 20 + y * 8.6, 3.5, 0, 7); g.fill(); }
});
/** the crate is 0.95 by CRATE_H: the word sits in the upper half of its front, above the band the captions use, in the wide shots and in the close one */
const CRATE_H = 0.86;
const crateTex = () => tex('den-crate', 512, 464, (g, w, h) => {
  g.fillStyle = '#b98a52'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5630'; g.lineWidth = 10; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
  g.strokeStyle = '#6a4826'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26);
  g.save(); g.translate(w / 2, 152); g.rotate(-0.04); text(g, 'DATA', 0, 0, 168, '#2a1c10', {maxWidth: w - 90}); g.restore();
});
const bannerTex = () => tex('den-banner', 1200, 330, (g, w, h) => {
  g.fillStyle = '#fffdf4'; rrect(g, 6, 6, w - 12, h - 12, 26); g.fill(); g.strokeStyle = INK; g.lineWidth = 12; g.stroke();
  text(g, 'SORRY', w / 2, 104, 150, '#e3342f'); text(g, 'FOR THE INCONVENIENCE', w / 2, 240, 104, INK, {maxWidth: w - 80});
});
type Trio = [Draw, Draw, Draw];
/** where the mouth of the megaphone is, from the feet of the figure that holds it */
export const MEGA = [0.66, 1.36] as const;
const hang: Draw = {emo: 'flat'};
/** every drawing a hood needs, per hood (0 purple, 1 orange, 2 green) */
const DRAW: Record<string, Trio> = {
  a: [hang, hang, hang],
  b: [{emo: 'flat', pose: 'hips'}, hang, {emo: 'flat', pose: 'cross'}],
  sorry: [{emo: 'sad', pose: 'hold', prop: 'flowers'}, {emo: 'sad', pose: 'both', prop: 'card', text: 'SORRY'}, {emo: 'sad', pose: 'shrug'}],
  cash: [{emo: 'sad', pose: 'hold', prop: 'flowers'}, {emo: 'sad', pose: 'both', prop: 'card', text: 'SORRY'}, {emo: 'cash', pose: 'hold', prop: 'cash'}],
  wave: [{emo: 'happy', pose: 'wave'}, {emo: 'happy', pose: 'wave'}, {emo: 'happy', pose: 'wave'}],
  oh: [{emo: 'oh', pose: 'shrug'}, {emo: 'oh', pose: 'shrug'}, {emo: 'oh', pose: 'panic'}],
  key: [{emo: 'flat', pose: 'hips'}, {emo: 'happy', pose: 'hold', prop: 'key'}, {emo: 'flat', pose: 'cross'}],
  desk: [{emo: 'sad', pose: 'desk'}, {emo: 'sad', pose: 'desk'}, {emo: 'sad', pose: 'desk'}],
  halo: [{emo: 'happy', halo: 'on'}, {emo: 'happy', halo: 'on', pose: 'both'}, {emo: 'happy', halo: 'on'}],
  heart: [{emo: 'happy', halo: 'on', pose: 'hold', prop: 'heart'}, {emo: 'happy', halo: 'on', pose: 'both'}, {emo: 'happy', halo: 'on'}],
  askew: [{emo: 'happy', halo: 'on', pose: 'hold', prop: 'heart'}, {emo: 'happy', halo: 'askew', pose: 'shrug'}, {emo: 'happy', halo: 'on'}],
  guard: [{emo: 'flat', pose: 'cross'}, {emo: 'flat', pose: 'hips'}, {emo: 'flat', pose: 'desk'}],
  hug: [{emo: 'flat', pose: 'cross'}, {emo: 'happy', pose: 'both'}, {emo: 'happy', pose: 'both'}],
  evil: [{emo: 'evil', pose: 'hips'}, {emo: 'evil', pose: 'hold', prop: 'megaphone'}, {emo: 'evil', pose: 'cross'}],
};
const hoods = (root: THREE.Group, xs: number[], z: number, keys: string[], scale = 0.98) =>
  xs.map((x, i) => actor(root, HOOD(i), Object.fromEntries(keys.map((k) => [k, DRAW[k][i]])), x, 0, z, {scale, res: 1.0, wide: true}));
export const den: Builder = (root) => {
  backdrop(root, ['#07080f', '#161a2c']);
  floor(root, 14, 12, tmat(tiled(grainTex('den-floor', '#22263a', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, '#262b42', 0, 2.8, -2.2);
  // a long table of screens behind them
  table(root, 0, -1.35, 3.2, 0.6, {h: 0.8, top: '#30364e', leg: '#1c2030', skirt: '#2a2f46'});
  const screens = [-1.0, 0, 1.0].map((x, i) => new THREE.MeshBasicMaterial({map: codeTex(11 + i * 7)})); [-1.0, 0, 1.0].forEach((x, i) => monitor(root, x, 0.8, -1.4, 0.74, 0.5, screens[i], 0));
  const wash = halo(root, 3.0, GREEN, 0.1, 0, 1.3, -1.9);
  // the name the group gave itself, letter by letter
  // (it is taken down for the five shots that have a quotation where it hangs: a card over half a sign is two things to read at once)
  const sign = grp(root, 0, 0, 0), CARDS = new Set(['quote', 'morals', 'villains', 'keep', 'hug']);
  const LX = [-0.84, -0.28, 0.28, 0.84], LY = 2.52, letters = ['B', 'Y', 'O', 'D'].map((ch, i) => { const m = new THREE.MeshBasicMaterial({map: letterTex(ch), transparent: true}); box(sign, 0.5, 0.6, 0.05, '#12141c', LX[i], LY, -2.0); soft(panel(sign, 0.46, 0.55, m, LX[i], LY, -1.97)); return m; });
  const XS = [-0.78, 0, 0.78], Z = 0.1, crew = hoods(root, XS, Z, Object.keys(DRAW));
  const spots = XS.map((x) => pool(root, 0.9, '#b8ffb0', 0.2, x, Z));
  // heaven's own spotlight, for the line about morals
  const gold = beam(root, 0.5, 1.9, 5.6, '#ffe9a8', 0, 0, 5.6, Z), goldPool = pool(root, 2.0, '#ffe9a8', 0, 0, Z);
  // the long banner, and the crate
  const banner = soft(panel(root, 2.08, 0.57, smat(bannerTex(), 1.02, true), 0, 1.0, Z + 0.4));
  const CRX = 0.5, crate = grp(root, CRX, 0, 0.75); box(crate, 0.95, CRATE_H, 0.6, tmat(crateTex()), 0, CRATE_H / 2, 0); box(crate, 0.99, 0.05, 0.64, '#8a6236', 0, CRATE_H + 0.02, 0);
  const files = tex('den-files', 360, 160, (g) => { g.clearRect(0, 0, 360, 160); [['#ffc94a', 60], ['#7ec8e3', 150], ['#ff9f6b', 240], ['#b8e986', 310]].forEach(([c, x], i) => folder(g, x as number, 96 - (i % 2) * 10, 96, c as string)); });
  const papers = soft(panel(crate, 0.86, 0.38, smat(files, 1, true), 0, CRATE_H + 0.17, -0.05));
  // a padlock for the crate: on the lid's edge, over the word
  const LKY = CRATE_H - 0.03, lock = grp(crate, 0, LKY, 0.32); soft(panel(lock, 0.2, 0.24, smat(tex('den-lock', 200, 240, (g) => padlock(g, 100, 110, 82)), 1.02, true)));
  const blare = arcs(root, 3, '#ffe14a'), LETTER = new THREE.Color('#b8ffb0');
  const tints = ['#ffffff', '#ffffff', '#ffffff'];
  return {
    light: (v) => v === 'morals' || v === 'villains' ? {...LIGHT.warm, amb: 1.35, keyI: 1.2} : v === 'hit' ? {...LIGHT.dark, sky: '#ffb0a0', amb: 1.0, keyI: 0.8} : {...LIGHT.dark, sky: '#c6d0ff', amb: 1.1, keyI: 0.75},
    tick: ({f, cam, shot}) => {
      const v = shot.v, t0 = shot.at, st = ['a', 'a', 'a'], x = [...XS], y = [0, 0, 0], z = [Z, Z, Z]; tints.fill('#ffffff');
      const up = (i: number, at: number, to: string, h = 0.08) => { if (f >= at) st[i] = to; y[i] += hop(f, at, h, 8); };
      let lit4 = 4, bannerAt = -1, crateIn = 0, crateX = CRX, crateY = 0, lockAt = 1e9, heaven = 0, shout = false;
      if (v === 'sorry') { lit4 = 0; up(1, W(16) - 3, 'sorry'); up(2, W(16) + 1, 'sorry', 0.05); up(0, W(16) + 4, 'sorry', 0.05); }   // the card comes up on "sorry"
      else if (v === 'money') { lit4 = 0; st.fill('sorry'); up(2, t0 + 1, 'cash', 0.1); }
      else if (v === 'new' || v === 'name') {                                                              // out of the dark, one after the other; then the name lights up as it is spelled
        st.fill('b'); XS.forEach((_, i) => { const k = smooth(f, W(65) + i * 5, W(65) + 14 + i * 5); z[i] = Z - 1.0 * (1 - k); tints[i] = '#' + new THREE.Color('#2a2c3a').lerp(new THREE.Color('#ffffff'), k).getHexString(); });
        const t = W(70), dur = (W(71) - W(70) - 6) / 4; lit4 = Math.max(0, Math.min(4, Math.floor((f - t) / dur) + 1)); if (f < t) lit4 = 0;
      } else if (v === 'claim') { st.fill('b'); XS.forEach((_, i) => up(i, t0 + 2 + i * 3, 'wave')); }
      else if (v === 'apol') { st.fill('b'); up(1, W(85) - 2, 'sorry'); up(0, W(85) + 3, 'sorry', 0.05); up(2, W(85) + 6, 'sorry', 0.05); }
      else if (v === 'quote') { st.fill('oh'); XS.forEach((_, i) => { y[i] += hop(f, W(87) + i * 3, 0.05, 7); }); }
      else if (v === 'key') { st.fill('key'); st[1] = 'a'; up(1, W(104) - 1, 'key', 0.1); }
      else if (v === 'inconv') { st.fill('desk'); bannerAt = t0 + 1; }
      else if (v === 'morals') { heaven = smooth(f, W(125) - 4, W(125) + 6); XS.forEach((_, i) => up(i, W(125) - 2 + i * 2, 'halo', 0.06)); up(0, W(130) - 2, 'heart'); }
      else if (v === 'villains') { heaven = 1; st.fill('heart'); up(1, W(134) + 3, 'askew', 0.05); }
      else if (v === 'catch') { st.fill('b'); crateIn = smooth(f, W(136) - 3, W(136) + 5); }
      else if (v === 'keep') { st.fill('guard'); crateIn = 1; XS.forEach((_, i) => { y[i] += hop(f, t0 + 2 + i * 2, 0.04, 7); }); }
      else if (v === 'hug') { st.fill('hug'); crateIn = 1; crateX = 0.39; crateY = 0.35; x[0] = -1.5; lockAt = W(143) + 1; XS.forEach((_, i) => { y[i] += hop(f, lockAt + 2 + i, 0.03, 6); }); }   // lid on, held to the chest; the third is out of this close shot
      else if (v === 'hit') { st.fill('evil'); x[2] = 2.6; y[1] += hop(f, t0 + 2, 0.08, 8); shout = f >= t0 + 3; }                 // a close shot of the one with the megaphone
      crew.forEach((a, i) => { a.show(st[i]); a.node.position.set(x[i], y[i], z[i]); a.tint(tints[i]); a.tick(f, cam); });
      sign.visible = !CARDS.has(v);
      letters.forEach((m, i) => { const on = i < lit4, born = v === 'name' ? W(70) + i * ((W(71) - W(70) - 6) / 4) : -99; m.color.setScalar(on ? 1.25 + 0.9 * Math.max(0, 1 - (f - born) / 5) : 0.16); if (on) m.color.multiply(LETTER); });
      screens.forEach((m, i) => m.color.setScalar(0.8 + 0.12 * Math.sin(f * 0.3 + i * 2)));
      (wash.material as THREE.MeshBasicMaterial).opacity = heaven ? 0.03 : 0.1;
      spots.forEach((s) => { (s.material as THREE.MeshBasicMaterial).opacity = 0.2 * (1 - heaven); });
      (gold.material as THREE.MeshBasicMaterial).opacity = 0.085 * heaven; (goldPool.material as THREE.MeshBasicMaterial).opacity = 0.4 * heaven;
      banner.visible = bannerAt >= 0; if (bannerAt >= 0) { banner.scale.setScalar(pop(f, bannerAt, 8)); banner.rotation.z = -0.02 + shake(f, bannerAt, 0.03, 9); }
      crate.visible = crateIn > 0.01; crate.position.set(crateX + 2.6 * (1 - crateIn), crateY, 0.75); papers.visible = v !== 'hug'; crate.rotation.z = v === 'catch' ? shake(f, W(136) + 5, 0.04, 8) : shake(f, lockAt, 0.03, 8);
      const locked = f >= lockAt; lock.visible = locked; if (locked) { const k = Math.min(1, (f - lockAt) / 4); lock.position.y = LKY + 0.5 * (1 - k) ** 2; lock.scale.setScalar(1 + 0.25 * Math.max(0, 1 - Math.abs(f - lockAt - 4) / 3)); }
      blare(f, shout, [MEGA[0], MEGA[1], Z + 0.02], 0.42, 0.06);
    },
  };
};

// ------------------------------------------------------------------ the outage as the group tells it: drawn in its own green, because it is its account
export const their: Builder = (root) => {
  backdrop(root, ['#020805', '#07180d']);
  floor(root, 14, 12, tmat(tiled(tileTex('their-floor', '#0b2414', '#1f6b3a', 4), 6, 5)));
  box(root, 9, 5.6, 0.3, '#0f2e1a', 0, 2.8, -1.4);
  const COLS = 3, ROWS = 4, cells: THREE.MeshBasicMaterial[] = [], on = new THREE.Color(GREEN), off = new THREE.Color('#0a1f12'), red = new THREE.Color('#ff5a4a');
  const face = tex('their-scr', 128, 96, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a1f12'; for (let r = 0; r < 4; r++) g.fillRect(12, 14 + r * 20, 40 + ((r * 37) % 60), 8); });
  const warn = tex('their-warn', 128, 96, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); text(g, '!', w / 2, h / 2 + 4, 92, '#1a0606'); });
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const m = new THREE.MeshBasicMaterial({map: face}), x = -0.05 + c * 0.56, y0 = 0.62 + r * 0.5; cells.push(m);
    box(root, 0.5, 0.42, 0.06, '#1f6b3a', x, y0, -1.2); panel(root, 0.42, 0.34, m, x, y0, -1.165);
  }
  // one big switch, with the name of whose it is (in this telling)
  const SX = -0.98, sw = grp(root, SX, 1.18, -1.2); box(sw, 0.7, 1.3, 0.1, '#1f6b3a', 0, 0.06, 0);
  panel(sw, 0.6, 0.2, smat(signTex('their-unm', 300, 100, GREEN, '#06140c', [['UNM', 84, 0.56]]), 1.05), 0, 0.56, 0.055);
  panel(sw, 0.46, 0.17, smat(signTex('their-on', 270, 100, '#0a1f12', GREEN, [['ON', 80, 0.56]]), 1.1), 0, 0.33, 0.055); panel(sw, 0.46, 0.17, smat(signTex('their-off', 270, 100, '#0a1f12', '#ffffff', [['OFF', 80, 0.56]]), 1.0), 0, -0.47, 0.055);
  box(sw, 0.12, 0.44, 0.04, '#06140c', 0, -0.02, 0.06);
  const lever = grp(sw, 0, -0.02, 0.1); rod(lever, [0, 0, 0], [0, 0.2, 0.2], 0.035, '#2f9a52'); ball(lever, 0.085, lit(GREEN, 1.2), 0, 0.22, 0.22);
  // an alarm lamp on top of it, low enough to stay under the quotation
  const LY = 2.0, alarm = lamp('#ff5a4a', 1); cyl(root, 0.12, 0.05, '#1f6b3a', SX, LY - 0.11, -1.15); ball(root, 0.12, alarm, SX, LY, -1.15); const glow = halo(root, 1.0, '#ff5a4a', 0, SX, LY, -1.0);
  return {
    light: () => ({...LIGHT.dark, sky: '#b8ffc8', ground: '#0f3a20', amb: 1.0, key: '#d8ffe0', keyI: 0.7}),
    tick: ({f}) => {
      const panic = W(178) - 2, flip = W(181) + 2, k = smooth(f, flip, flip + 6);                         // the alarm on "panic"; the switch goes over on "switched"
      lever.rotation.x = 1.75 * k; sw.rotation.z = shake(f, flip + 5, 0.03, 8);
      const a = f >= panic ? 0.5 + 0.5 * Math.sin((f - panic) * 0.9) : 0; alarm.color.set('#ff5a4a').multiplyScalar(0.3 + 2.2 * a); (glow.material as THREE.MeshBasicMaterial).opacity = 0.3 * a;
      // every screen shows the alarm, one after the other; then they go out row by row, and the last is out by "off"
      const t0 = flip + 5, t1 = W(185);
      cells.forEach((m, i) => {
        const order = (ROWS - 1 - Math.floor(i / COLS)) * COLS + (i % COLS), dark = f >= t0 + (t1 - t0) * (order / cells.length), alarmed = f >= panic + ((i * 5) % 12) * 0.6;
        m.map = alarmed ? warn : face; m.color.copy(dark ? off : alarmed ? red : on).multiplyScalar(dark ? 1 : alarmed ? 0.85 + 0.3 * a : 1.0 + 0.12 * Math.sin(f * 0.4 + i));
      });
    },
  };
};

// ------------------------------------------------------------------ the second campus (a made-up building with the real name on its sign)
const autumn = (p: THREE.Group, x: number, z: number, s = 1, c = '#e08a2c') => { cyl(p, 0.09 * s, 1.1 * s, '#6a4a30', x, 0.55 * s, z); ball(p, 0.62 * s, c, x, 1.5 * s, z); ball(p, 0.42 * s, '#f2b23a', x + 0.34 * s, 1.26 * s, z + 0.1); ball(p, 0.36 * s, '#c9622a', x - 0.32 * s, 1.2 * s, z + 0.14); };
export const campus: Builder = (root) => {
  backdrop(root, ['#5f9bd6', '#f6e6c8']);
  floor(root, 40, 30, tmat(tiled(grainTex('campus-lawn', '#7fae5e', 0.08), 10, 8)));
  floor(root, 1.9, 12, '#d9cdb8', 0.012, 0, 3.4);
  const brick = tex('campus-brick', 256, 256, (g) => {
    g.fillStyle = '#a8553a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#8a4530'; g.lineWidth = 3; for (let y = 0; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 20; x < 256; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
    for (const x of [44, 164]) { g.fillStyle = '#f3ead6'; g.beginPath(); g.moveTo(x - 8, 196); g.lineTo(x - 8, 96); g.arc(x + 24, 96, 32, Math.PI, 0); g.lineTo(x + 56, 196); g.closePath(); g.fill(); g.fillStyle = '#2f4a66'; g.beginPath(); g.moveTo(x, 190); g.lineTo(x, 98); g.arc(x + 24, 98, 24, Math.PI, 0); g.lineTo(x + 48, 190); g.closePath(); g.fill(); }
  }, true);
  const BZ = -2.4; box(root, 7.2, 2.9, 1.6, tmat(tiled(brick, 6, 2)), 0, 1.45, BZ); box(root, 7.4, 0.18, 1.8, '#f3ead6', 0, 2.98, BZ);
  // the tower, with a clock and a pointed roof
  box(root, 1.5, 5.4, 1.5, tmat(tiled(brick, 1, 3.6)), 0, 2.7, BZ + 0.2); box(root, 1.66, 0.16, 1.66, '#f3ead6', 0, 5.46, BZ + 0.2);
  const roof = cone(root, 1.16, 1.5, '#4a5a66', 0, 6.28, BZ + 0.2, 4); roof.rotation.y = Math.PI / 4;
  cyl(root, 0.46, 0.08, '#f3ead6', 0, 4.5, BZ + 0.98).rotation.x = Math.PI / 2; box(root, 0.04, 0.3, 0.02, INK, 0, 4.62, BZ + 1.03); box(root, 0.22, 0.04, 0.02, INK, 0.1, 4.5, BZ + 1.03);
  box(root, 0.9, 1.7, 0.1, '#3a2a1e', 0, 0.85, BZ + 0.98); box(root, 1.1, 0.14, 0.2, '#f3ead6', 0, 1.78, BZ + 1.0);
  autumn(root, -2.3, -0.9, 1.25); autumn(root, 2.4, -1.0, 1.1, '#d9652b'); autumn(root, -3.6, 1.2, 1.0, '#f2b23a'); streetLamp(root, 1.55, 0.2, 2.5, '#ffe9b0', 1.2);
  // the sign: its own name, in its own black and gold
  const SX = -0.25, SZ = 1.2; box(root, 1.64, 0.5, 0.36, tmat(tiled(brick, 1.4, 0.4)), SX, 0.25, SZ); box(root, 1.56, 0.98, 0.2, '#1a1a1a', SX, 0.99, SZ); box(root, 1.7, 0.1, 0.4, '#f3ead6', SX, 1.53, SZ);
  panel(root, 1.46, 0.84, smat(signTex('campus-sign', 700, 400, '#141414', '#d9b24a', [['VANDERBILT', 150, 0.36], ['UNIVERSITY', 104, 0.74]], {border: '#d9b24a'}), 1.02), SX, 0.99, SZ + 0.105);
  const st = [actor(root, STUDENT(0), {a: {expr: 'neutral', pose: 'hold', prop: 'phone'}, b: {expr: 'shock', pose: 'hold', prop: 'phone'}}, 0.84, 0, 1.5, {scale: 0.95, res: 1.0}), actor(root, STUDENT(1), {a: {expr: 'neutral'}}, 0.2, 0, -0.6, {scale: 0.95, res: 0.9})];
  return {
    light: () => ({...LIGHT.day, key: '#ffe9c4'}),
    tick: ({f, cam}) => { st[0].show(f >= W(192) + 4 ? 'b' : 'a'); st[0].node.position.y = hop(f, W(192) + 4, 0.06, 8); st.forEach((a) => a.tick(f, cam)); },
  };
};

// ------------------------------------------------------------------ its computer room: the same voice again
export const lab: Builder = (root) => {
  backdrop(root, ['#2a2018', '#4a3828']);
  floor(root, 14, 12, tmat(tiled(woodTex('lab-floor', '#a8845a', '#6a4a30'), 5, 5)));
  box(root, 9, 5.6, 0.3, '#8a7660', 0, 2.8, -2.0); box(root, 9, 0.12, 0.32, '#d9b24a', 0, 1.62, -1.99); box(root, 9, 1.56, 0.32, '#5a4634', 0, 0.78, -1.99);
  const sign = panel(root, 1.5, 0.36, smat(signTex('lab-sign', 620, 150, '#141414', '#d9b24a', [['COMPUTER LAB', 100, 0.56]], {border: '#d9b24a'}), 1), 0.2, 2.3, -1.84);
  // shelves of books along the back
  box(root, 1.2, 1.3, 0.3, '#5a4028', -1.25, 0.75, -1.8); for (const y of [0.45, 0.85, 1.25]) for (let i = 0; i < 9; i++) box(root, 0.1, 0.3, 0.2, ['#7a3b34', '#35506e', '#4f6b4a', '#8a6a3a', '#5a4468'][(i + Math.round(y * 10)) % 5], -1.75 + i * 0.125, y, -1.72);
  table(root, 0, 0.25, 2.7, 0.7, {h: 0.78, top: '#c9a27a', leg: '#3a3f4a', skirt: '#8a6a4a'});
  const XS = [-0.42, 0.72], MX = [-1.0, 0.14];
  XS.forEach((x) => officeChair(root, x, -0.42, '#2b2f3a'));
  const calm = screenTex('lab-calm', (g, w, h) => { g.fillStyle = '#d9b24a'; g.fillRect(0, 0, w, 56); const q = rng(15); for (let r = 0; r < 7; r++) { g.fillStyle = '#8f97a6'; g.fillRect(30, 84 + r * 38, 160 + q() * 280, 16); } }, 512, 368, '#fbfaf5'), talk = talkTex('ward', '#07110a', GREEN);
  const scr = MX.map(() => new THREE.MeshBasicMaterial({map: calm})), mons = MX.map((x, i) => monitor(root, x, 0.78, 0.3, 0.6, 0.42, scr[i], 0.32));
  const studs = XS.map((x, i) => actor(root, STUDENT(i ? 2 : 0), {type: {expr: 'neutral', pose: 'type', mode: 'sit'}, hear: {expr: 'shock', pose: i ? 'shrug' : 'panic', mode: 'sit'}, fear: {expr: 'nervous', pose: i ? 'panic' : 'both', mode: 'sit'}}, x, 0.42, -0.36, {scale: 1.05, res: 1.2}));
  const third = actor(root, STUDENT(1), {a: {expr: 'neutral'}, b: {expr: 'shock', pose: 'panic'}}, 0.16, 0, -1.25, {scale: 0.98, res: 1.0});
  const wave = MX.map(() => rings(root, 3));
  return {
    light: (v) => v === 'ground' ? {...LIGHT.dark, sky: '#d8ffd0', amb: 0.95, keyI: 0.7} : {...LIGHT.room, amb: 1.4},
    tick: ({f, cam, shot}) => {
      const v = shot.v, at = W(195) + 2, on = v !== 'said' || f >= at, quake = v === 'ground' ? shake(f, W(211), 0.05, 14) : 0;
      sign.visible = v !== 'quote';                                                                      // in the close shot one end of it shows beside the card
      scr.forEach((m, i) => { m.map = on ? talk : calm; m.color.setScalar(on ? 1.15 + 0.25 * Math.sin(f * 0.8 + i) : 1); });
      mons.forEach((m) => { m.parent!.rotation.z = quake; });
      MX.forEach((x, i) => wave[i](f + i * 7, on, [x + 0.07, 1.16, 0.36], v === 'quote' ? 0.44 : 0.52, 0.32, v === 'ground' ? 0.07 : 0.05));
      studs.forEach((n, i) => { n.show(!on ? 'type' : v === 'said' ? 'hear' : 'fear'); n.node.position.y = 0.42 + hop(f, at + 1 + i * 3, 0.07, 8) + (v === 'ground' ? hop(f, W(211) + i * 2, 0.05, 8) : 0); n.tick(f, cam); });
      third.show(on ? 'b' : 'a'); third.node.position.y = hop(f, at + 5, 0.06, 8); third.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the line-up: nobody is standing in it
export const lineup: Builder = (root) => {
  backdrop(root, ['#0c0f18', '#1c2233']);
  floor(root, 14, 12, tmat(tiled(grainTex('lineup-floor', '#3a4052', 0.1), 5, 4)));
  // the wall is 6 m by 4.4 m and stands on the floor: a line every half foot, a number at every foot
  panel(root, 6, 4.4, smat(tex('lineup-wall', 1024, 752, (g, w, h) => {
    g.fillStyle = '#e9e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2d36';
    for (let half = 4; half <= 14; half++) {
      const y = h - (half * 0.1524 / 4.4) * h, foot = half % 2 === 0; g.fillRect(0, y - (foot ? 4 : 2), w, foot ? 8 : 4);
      if (foot) for (const x of [w / 2 - 166, w / 2 + 166]) text(g, `${half / 2}'`, x, y - 30, 46, '#2a2d36', {font: 'Montserrat'});
    }
  }), 1), 0, 2.2, -1.2);
  const XS = [-0.78, 0, 0.78], Z = 0.1;
  const marks = tex('lineup-mark', 128, 128, (g) => { g.strokeStyle = '#f2c230'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(26, 26); g.lineTo(102, 102); g.moveTo(102, 26); g.lineTo(26, 102); g.stroke(); });
  XS.forEach((x) => { const m = soft(panel(root, 0.42, 0.42, smat(marks, 1, true), x, 0.016, Z)); m.rotation.x = -Math.PI / 2; });
  const spots = XS.map((x) => ({cone: beam(root, 0.14, 0.62, 5.2, '#fff0c8', 0.06, x, 5.2, Z), floor: pool(root, 0.9, '#fff0c8', 0.34, x, Z)}));
  const q = soft(panel(root, 0.5, 0.7, smat(tex('lineup-q', 160, 220, (g) => { text(g, '?', 80, 116, 210, '#ffffff', {stroke: INK, sw: 22}); }), 1.1, true), 0, 1.25, Z));
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.15, keyI: 0.8}),
    tick: ({f, shot}) => {
      spots.forEach((s, i) => { const k = 0.75 + 0.25 * Math.sin(f * 0.16 + i * 2.1); (s.cone.material as THREE.MeshBasicMaterial).opacity = 0.06 * k; (s.floor.material as THREE.MeshBasicMaterial).opacity = 0.34 * k; s.cone.rotation.z = 0.03 * Math.sin(f * 0.09 + i); });
      const at = shot.at + 6; q.visible = f >= at; q.scale.setScalar(pop(f, at, 8)); q.position.y = 1.25 + 0.04 * Math.sin(f * 0.1);
    },
  };
};

// ------------------------------------------------------------------ the closing question
export const final: Builder = (root) => {
  backdrop(root, ['#07090f', '#131a2a']);
  floor(root, 14, 12, tmat(tiled(grainTex('final', '#1b2232', 0.1), 5, 4)));
  const XS = [-1.0, -0.35, 0.3], Z = 0.2;
  const DR: Trio = [{emo: 'happy', halo: 'on', pose: 'hold', prop: 'heart'}, {emo: 'sad', pose: 'both', prop: 'card', text: 'SORRY'}, {emo: 'happy', pose: 'hold', prop: 'megaphone'}];
  const crew: Actor[] = XS.map((x, i) => actor(root, HOOD(i), {a: DR[i]}, x, 0, i === 1 ? Z - 0.5 : Z, {scale: i === 1 ? 0.92 : 0.98, res: 1.0, wide: true}));
  const cols = ['#ffe9a8', '#ffffff', '#ffb0a0'];
  const spots = XS.map((x, i) => ({cone: beam(root, 0.14, 0.66, 5.2, cols[i], 0, x, 5.2, i === 1 ? Z - 0.5 : Z), floor: pool(root, 0.95, cols[i], 0, x, i === 1 ? Z - 0.5 : Z)}));
  const blare = arcs(root, 3, '#ffe14a');
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.05, keyI: 0.7}),
    tick: ({f, cam, shot}) => {
      const A = W(224) - 2, B = W(226) - 2, a = shot.v === 'choice' ? smooth(f, A, A + 8) : 0, b = shot.v === 'choice' ? smooth(f, B, B + 8) : 0, ks = [a, 1, b];
      const shade = (k: number) => '#' + new THREE.Color('#6a7088').lerp(new THREE.Color('#ffffff'), k).getHexString();
      crew.forEach((c, i) => { c.tint(shade(ks[i])); c.node.position.y = i === 0 ? hop(f, A, 0.08, 8) : i === 2 ? hop(f, B, 0.08, 8) : 0; c.tick(f, cam); });
      spots.forEach((s, i) => { const k = i === 1 ? 0.55 : ks[i]; (s.cone.material as THREE.MeshBasicMaterial).opacity = 0.02 + 0.055 * k; (s.floor.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.3 * k; });
      blare(f, b > 0.5, [XS[2] + MEGA[0], MEGA[1], Z + 0.02], 0.3, 0.05);
    },
  };
};
