// Sets of the fridge hack short, part 1: the frozen aisle, the control panel, the hackers' room, the map wall, the
// shop front. Each builder fills a group once and returns a tick that poses it for a frame (motion is a pure function
// of the frame number, so any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, box, clamp01, cone, cyl, floor, grainTex, grp, hop, lamp, lerp, lit, mesh, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus,
  type G2, type Node, type V} from './kit';
import {actor, FIREFIGHTER, HACKER, SHOPPER, WORKER} from './cast';
import {controller, cursor3d, freezer, fridge3d, risingTex, signTex, statusTex, streetLamp, tempAt, trolley} from './props';
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
/** soft puffs that rise and fade: steam off a warm freezer, smoke out of a door */
const puffTex = () => tex('puff', 96, 96, (g) => { const gr = g.createRadialGradient(48, 48, 3, 48, 48, 47); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
export function puffs(p: Node, n: number, color: string, opacity: number) {
  const ms = Array.from({length: n}, () => soft(mesh(p, new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({map: puffTex(), color, transparent: true, opacity, depthWrite: false, fog: false}))));
  return {
    /** k = 0 (none) .. 1; puffs leave from (x ± spread, y, z), rise `rise`, grow from r0 to r1 */
    set(f: number, k: number, x: number, y: number, z: number, o: {spread?: number; rise?: number; r0?: number; r1?: number; drift?: number; speed?: number} = {}) {
      const {spread = 0.5, rise = 1.4, r0 = 0.08, r1 = 0.3, drift = 0.2, speed = 0.018} = o;
      ms.forEach((m, i) => {
        const u = (f * speed + i / n + (i * 0.37) % 1) % 1, s = Math.sin(i * 12.9898) * 43758.5453, rx = s - Math.floor(s);
        m.visible = k > 0.01; m.position.set(x + (rx - 0.5) * 2 * spread + drift * u * Math.sin(i * 1.7), y + rise * u, z + 0.02 * i);
        m.scale.setScalar(lerp(r0, r1, u)); (m.material as THREE.MeshBasicMaterial).opacity = opacity * k * Math.sin(Math.PI * Math.min(1, u * 1.15));
      });
    },
  };
}
/** a flat blob on the floor: melted ice cream, water */
export function spill(p: Node, color: string, seed = 3) {
  const r = rng(seed), s = new THREE.Shape();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, q = 1 + 0.22 * Math.sin(a * 3 + r() * 0.4) + 0.12 * Math.sin(a * 5 + seed); if (i) s.lineTo(q * Math.cos(a), q * 0.62 * Math.sin(a)); else s.moveTo(q * Math.cos(a), q * 0.62 * Math.sin(a)); }
  const m = soft(mesh(p, new THREE.ShapeGeometry(s), lit(color, 1))); m.rotation.x = -Math.PI / 2; return m;
}
const screenTex = (key: string, draw: (g: G2, w: number, h: number) => void, w = 512, h = 288) => tex('scr-' + key, w, h, (g, cw, ch) => { g.fillStyle = '#071018'; g.fillRect(0, 0, cw, ch); draw(g, cw, ch); });
/** a little freezer drawn flat: icons on screens, maps and notes */
export function freezerIcon(g: G2, x: number, y: number, s: number, hot = false) {
  g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineWidth = s * 0.08; g.strokeStyle = '#15121c';
  g.fillStyle = '#eef3f6'; g.beginPath(); g.rect(-s * 0.36, -s * 0.6, s * 0.72, s * 1.2); g.fill(); g.stroke();
  g.fillStyle = hot ? '#ff8a3a' : '#9fe0ff'; g.fillRect(-s * 0.27, -s * 0.36, s * 0.54, s * 0.66);
  g.fillStyle = '#2f3a4a'; g.fillRect(-s * 0.36, -s * 0.6, s * 0.72, s * 0.17); g.strokeRect(-s * 0.36, -s * 0.6, s * 0.72, s * 0.17);
  g.fillStyle = '#46505e'; g.fillRect(-s * 0.36, s * 0.36, s * 0.72, s * 0.24); g.strokeRect(-s * 0.36, s * 0.36, s * 0.72, s * 0.24);
  g.restore();
}

// ------------------------------------------------------------------ the frozen aisle
export const aisle: Builder = (root) => {
  backdrop(root, ['#101a2c', '#1d2c48']);
  floor(root, 14, 12, tmat(tiled(tileTex('aisle', '#e3e9ed', '#bcc7cf', 2, '#d6dee3'), 7, 6)));
  box(root, 9, 5.4, 0.3, '#c5d1dc', 0, 2.7, -1.3);
  for (const x of [-2.3, 2.3]) box(root, 0.5, 5.4, 0.5, '#aebcc8', x, 2.7, -0.9);                      // pillars at the ends of the row
  const fz = [-1.16, 0, 1.16].map((x, i) => freezer(root, x, -0.72, {seed: 5 + i * 7}));
  const glow = pool(root, 2.8, '#ff5a2a', 0, 0, 0.35);
  const pink = spill(root, '#ffc4dc', 3), cream = spill(root, '#fff3d6', 8), mint = spill(root, '#c8f0d8', 5);
  const steam = puffs(root, 12, '#ffffff', 0.42);
  const cur = cursor3d(root, 0.42);
  const worker = actor(root, WORKER(0), {shock: {expr: 'shock', pose: 'panic'}, stock: {expr: 'smile', pose: 'hold'}, calm: {expr: 'smile'}}, -0.92, 0, 0.72, {scale: 1.0});
  const shopper = actor(root, SHOPPER(4), {a: {expr: 'smile', pose: 'think'}}, 0.98, 0, 0.95, {scale: 0.98});
  const tub = grp(root); cyl(tub, 0.085, 0.17, '#ff7ab0', 0, 0, 0, 0.1); cyl(tub, 0.11, 0.03, '#fffdf4', 0, 0.1, 0);
  return {
    light: (v) => v === 'morning' || v === 'restored' ? {...LIGHT.cold, amb: 1.75, keyI: 1.2} : v === 'hot' ? {...LIGHT.dark, sky: '#ffb890', ground: '#5a2a2a', key: '#ffb08a', amb: 0.95} : {...LIGHT.dark, amb: 0.9},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v;
      let temp = -18, melt = 0;
      if (v === 'hook') temp = lerp(-18, 36, smooth(f, W(1) + 4, W(7) + 10));
      else if (v === 'hot') { temp = lerp(6, 50, smooth(t, 0, 36)); melt = 0.6 * smooth(t, 8, 54); }
      else if (v === 'morning') { temp = 50; melt = 1; }
      fz.forEach((z, i) => z.set(v === 'hook' ? lerp(-18, temp, i === 1 ? 1 : 0.6) : temp, f, melt));
      const hot = clamp01((temp + 18) / 68);
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.34 * hot * (v === 'morning' ? 0.3 : 1);
      steam.set(f, v === 'hot' || v === 'morning' ? 0.4 + 0.6 * hot : 0, 0, 1.2, -0.25, {spread: 1.4, rise: 1.3, r0: 0.07, r1: 0.26});
      // the centre door stands open in the morning; the ice cream has run out onto the floor
      fz[1].door.rotation.y = v === 'morning' ? -1.18 : 0;
      const spread = v === 'morning' ? 0.75 + 0.25 * smooth(t, 0, 40) : v === 'hot' ? 0.5 * melt : 0;
      pink.visible = cream.visible = mint.visible = spread > 0.02;
      pink.position.set(0.25, 0.012, 0.42); pink.scale.setScalar(0.78 * spread); cream.position.set(-0.55, 0.013, 0.3); cream.scale.setScalar(0.5 * spread); mint.position.set(1.0, 0.014, 0.25); mint.scale.setScalar(0.44 * spread);
      // the pointer: in from the right, onto the readout of the middle freezer, one tap
      cur.visible = v === 'hook';
      if (v === 'hook') { const k = smooth(f, 2, W(1) + 2), tap = hop(f, W(1) + 2, 0.07, 6); cur.position.set(lerp(1.5, 0.2, k), lerp(3.2, 2.14, k) - tap, -0.2 + 0.02); cur.rotation.z = 0.25 * (1 - k); }
      worker.node.visible = v === 'morning' || v === 'restored'; shopper.node.visible = v === 'restored'; tub.visible = v === 'restored';
      if (v === 'morning') { worker.show('shock'); worker.node.position.set(-0.6, hop(f, W(31), 0.14, 9), 0.62); }
      if (v === 'restored') { worker.show('stock'); worker.node.position.set(-0.62, 0, 0.5); shopper.node.position.set(0.66, 0.03 * Math.abs(Math.sin(f * 0.2)), 0.8); tub.position.set(-0.24, 1.62 + 0.03 * Math.sin(f * 0.3), 0.52); }
      worker.tick(f, cam); shopper.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ the control panel, up close
export const panelSet: Builder = (root) => {
  backdrop(root, ['#141c28', '#202c3c']);
  floor(root, 12, 10, '#3a4250');
  const walls = [tmat(tiled(tileTex('wall-a', '#d3dbe1', '#aab6bf', 4), 7, 5)), tmat(tiled(tileTex('wall-b', '#f0e2b8', '#c9b98a', 4), 7, 5))].map((m) => box(root, 8, 5.4, 0.3, m, 0, 2.7, -0.45));
  const c = controller(root, 0, 1.42, -0.22, 1.25);
  for (const x of [-0.42, 0.42]) { cyl(root, 0.045, 1.6, '#8f9aa6', x, 2.95, -0.25); cyl(root, 0.045, 0.75, '#8f9aa6', x, 0.36, -0.25); }
  // rings of sound around the alarm key, until it is muted
  const rings = [0, 1, 2].map((i) => soft(torus(root, 0.2 + i * 0.075, 0.011, lamp('#ffd43b', 1.4), 0.5, 1.1325, -0.04)));
  const cur = cursor3d(root, 0.44);
  const ST = {cool: statusTex('COOLING', '#7fe3ff'), mute: statusTex('ALARM: MUTED', '#ff5a3c'), def: statusTex('DEFROST', '#ffb03a'), stuck: statusTex('DEFROST · NO END', '#ff5a3c')};
  const key = (i: number): V => [(-0.4 + i * 0.4) * 1.25, 1.42 - 0.23 * 1.25, -0.22 + 0.16 * 1.25];
  return {
    light: (v) => v === 'again' ? {...LIGHT.room, amb: 1.4} : {...LIGHT.cold, amb: 1.35},
    tick: ({f, t, shot}) => {
      const v = shot.v;
      walls[0].visible = v !== 'again'; walls[1].visible = v === 'again';
      let temp = -18, target = 2, press = 0, arrive = 6;
      const M = W(57) - 1, muted = v !== 'mute' || f >= M, defrost = v === 'stuck' || v === 'again' && f >= W(113) || v === 'defrost' && f >= W(60);
      if (v === 'mute') { target = 2; arrive = M - 1 - shot.at; press = hop(f, M - 1, 1, 6); }
      else if (v === 'defrost') { target = 1; arrive = W(60) - 1 - shot.at; press = hop(f, W(60) - 1, 1, 6); temp = lerp(-18, -6, smooth(f, W(60), W(60) + 16)); }
      else if (v === 'stuck') { target = 1; arrive = 0; press = 0.8 * smooth(t, 0, 4); temp = lerp(-6, 50, smooth(t, 0, 30)); }
      else if (v === 'again') { target = 1; arrive = W(113) - 1 - shot.at; press = f >= W(113) ? 0.8 : 0; temp = lerp(-18, 40, smooth(f, W(113), W(113) + 14)); }
      c.screen.map = v === 'again' && f >= W(113) ? risingTex() : tempAt(temp);   // no temperature was reported for November: arrows, not a number
      c.status.map = v === 'stuck' && Math.floor(f / 6) % 4 !== 3 ? ST.stuck : defrost ? ST.def : muted && v === 'mute' ? ST.mute : ST.cool;
      c.slash.visible = muted; c.slash.scale.setScalar(v === 'mute' ? pop(f, M, 7) : 1);
      c.keys[1].color.set(defrost ? '#ffb03a' : '#ffe9c2').multiplyScalar(defrost ? 1.6 + 0.3 * Math.sin(f * 0.5) : 1);
      c.keys[2].color.set(muted ? '#8f8a7a' : '#fff0a8');
      rings.forEach((r, i) => { const u = ((f * 0.06 + i / 3) % 1); r.visible = !muted; r.scale.setScalar(0.7 + 0.8 * u); (r.material as THREE.MeshBasicMaterial).color.set('#ffd43b').multiplyScalar(1.6 * (1 - u)); });
      const [kx, ky, kz] = key(target), k = v === 'stuck' ? 1 : smooth(t, 0, Math.max(3, arrive)), from: V = v === 'mute' ? [1.7, 2.6, 0.5] : v === 'defrost' ? [key(2)[0] + 0.02, key(2)[1] - 0.03, key(2)[2] + 0.04] : [1.6, 2.7, 0.5];   // 'defrost' goes on from the alarm key: 10-12 are one take
      cur.position.set(lerp(from[0], kx + 0.02, k), lerp(from[1], ky - 0.03, k), lerp(from[2], kz + 0.04, k) - 0.05 * press); cur.rotation.z = v === 'defrost' ? 0 : 0.3 * (1 - k);
      cur.scale.setScalar(0.44 * (1 - 0.1 * press));
      c.g.position.x = shake(f, v === 'stuck' ? shot.at : -99, 0.012, 10);
    },
  };
};

// ------------------------------------------------------------------ the hackers' room
export const lair: Builder = (root) => {
  backdrop(root, ['#05080d', '#0b1118']);
  floor(root, 14, 12, tmat(tiled(grainTex('lair', '#1c2026', 0.14), 5, 4)));
  box(root, 9, 5.4, 0.3, '#1b2632', 0, 2.7, -2.25); const halo = pool(root, 2.3, '#2aa8e0', 0.34, 0, -2.08, 1.7); halo.rotation.x = 0;
  const T = {
    login: screenTex('login', (g, w, h) => {                                                         // a made-up remote-access page: a list of stores, all cold
      g.fillStyle = '#12303a'; g.fillRect(0, 0, w, 46); text(g, 'REMOTE ACCESS · STORE COOLING', w / 2, 25, 24, '#9ff0ff', {font: 'Montserrat', spacing: 2, maxWidth: w - 30});
      for (let i = 0; i < 6; i++) {
        const y = 62 + i * 36; g.fillStyle = i % 2 ? '#0c1c26' : '#0f2430'; g.fillRect(16, y, w - 32, 30);
        text(g, `STORE ${String(i * 37 + 104).padStart(3, '0')}`, 40, y + 16, 20, '#cfe8f0', {font: 'Montserrat', align: 'left'});
        text(g, '−18°C', w - 150, y + 16, 22, '#7fe3ff'); g.fillStyle = '#3fe07a'; g.beginPath(); g.arc(w - 44, y + 15, 8, 0, 7); g.fill();
      }
    }),
    hot: screenTex('hot', (g, w, h) => {
      g.fillStyle = '#3a1612'; g.fillRect(0, 0, w, 46); text(g, 'REMOTE ACCESS · STORE COOLING', w / 2, 25, 24, '#ffc9a8', {font: 'Montserrat', spacing: 2, maxWidth: w - 30});
      for (let i = 0; i < 6; i++) {
        const y = 62 + i * 36; g.fillStyle = i % 2 ? '#26120f' : '#301611'; g.fillRect(16, y, w - 32, 30);
        text(g, `STORE ${String(i * 37 + 104).padStart(3, '0')}`, 40, y + 16, 20, '#f0d8cf', {font: 'Montserrat', align: 'left'});
        text(g, 'DEFROST', w - 160, y + 16, 22, '#ffb03a'); g.fillStyle = '#ff5a3c'; g.beginPath(); g.arc(w - 44, y + 15, 8, 0, 7); g.fill();
      }
    }),
    code: screenTex('code', (g, w) => { const r = rng(9); for (let i = 0; i < 17; i++) { g.fillStyle = i % 4 === 0 ? '#9ff0ff' : '#3f8fa8'; g.fillRect(22 + (i % 3) * 18, 20 + i * 15, 80 + r() * (w - 160), 7); } }),
    love: screenTex('love', (g, w, h) => { freezerIcon(g, w / 2, h / 2 + 6, 150); for (const [x, y, s] of [[110, 70, 34], [400, 60, 28], [420, 200, 38], [96, 210, 26]]) heart(g, x, y, s); }),
  };
  const scr = new THREE.MeshBasicMaterial({map: T.login});
  box(root, 2.34, 1.38, 0.08, '#0b0d12', 0, 1.7, -2.02); panel(root, 2.2, 1.24, scr, 0, 1.7, -1.975);
  const side = [-1, 1].map((s) => { const m = new THREE.MeshBasicMaterial({map: T.code}); box(root, 0.86, 0.58, 0.06, '#0b0d12', s * 1.22, 2.72, -1.9).rotation.y = -s * 0.3; const pn = panel(root, 0.78, 0.5, m, s * 1.21, 2.72, -1.86); pn.rotation.y = -s * 0.3; return m; });
  box(root, 3.2, 0.07, 0.8, '#262b33', 0, 0.86, -1.45); for (const x of [-1.5, 1.5]) box(root, 0.08, 0.84, 0.7, '#1d2128', x, 0.42, -1.45);
  for (const x of [-0.7, 0.1, 0.8]) box(root, 0.5, 0.03, 0.17, '#12151a', x, 0.915, -1.3);
  for (const [x, c] of [[-0.25, '#3fe07a'], [0.45, '#ff5a8a'], [1.2, '#ffd43b']] as const) cyl(root, 0.035, 0.13, c, x, 0.96, -1.5);
  box(root, 3.1, 0.03, 0.03, lit('#35c8ff', 2), 0, 0.81, -1.04);                                       // LED strip under the desk edge
  const cur = cursor3d(root, 0.3);
  const H = [-0.74, 0.76, 0].map((x, i) => actor(root, HACKER(i), {idle: {}, point: {pose: 'point'}, cross: {pose: 'cross'}, hips: {pose: 'hips'}}, x, 0, i === 2 ? -0.5 : -0.2, {scale: i === 2 ? 0.94 : 1.0}));
  const L = [-0.78, 0.78].map((x, i) => actor(root, HACKER(i, 'heart'), {a: {pose: 'both'}}, x, 0, -0.1, {scale: 1.0}));
  // what they fell for: a small fridge on a stand, hearts rising
  const love = grp(root, 0, 0, -0.45); cyl(love, 0.42, 0.5, '#2b303a', 0, 0.25, 0, 0.34); fridge3d(love, 0, 0, 0.62).position.y = 0.5;
  const hearts = Array.from({length: 6}, () => soft(panel(love, 0.26, 0.26, smat(tex('heart', 96, 96, (g) => heart(g, 48, 50, 40)), 1.2, true))));
  return {
    light: (v) => v === 'love' ? {...LIGHT.dark, sky: '#ff9ac0', amb: 0.95, key: '#ffd0e0'} : {...LIGHT.dark, sky: '#7fd0ff', ground: '#16304a', amb: 0.78, key: '#bfe6ff'},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, flip = v === 'login' && f >= W(54);
      scr.map = v === 'love' ? T.love : v === 'accused' ? T.code : flip ? T.hot : T.login;
      side.forEach((m) => { m.color.setScalar(0.75 + 0.2 * Math.sin(f * 0.4)); });
      cur.visible = v === 'login'; cur.position.set(lerp(1.3, 0.62, smooth(t, 2, 16)), lerp(2.5, 1.86 - 0.26 * smooth(t, 18, 40), smooth(t, 2, 16)), -1.9);
      love.visible = v === 'love'; hearts.forEach((h, i) => { const u = ((f * 0.022 + i / 6) % 1); h.position.set(Math.sin(i * 2.4) * 0.5 + 0.08 * Math.sin(f * 0.1 + i), 1.5 + 1.0 * u, 0.3); h.scale.setScalar(0.5 + 0.6 * Math.sin(Math.PI * u)); h.quaternion.copy(cam.quaternion); });
      H.forEach((a, i) => {
        a.node.visible = v !== 'love';
        if (v === 'accused') { a.show(['cross', 'hips', 'cross'][i]); a.node.position.set([-0.76, 0.76, 0][i], 0, i === 2 ? 0.1 : -0.25); }
        else { a.show(i === 1 && f >= W(52) ? 'point' : 'idle'); a.node.position.set([-0.74, 0.76, 0][i], i === 2 ? -0.5 : 0, i === 2 ? -1.0 : -0.2); a.node.visible = v !== 'love' && i !== 2; }
        a.tick(f, cam);
      });
      L.forEach((a, i) => { a.node.visible = v === 'love'; a.node.position.y = 0.05 * Math.abs(Math.sin(f * 0.3 + i * 1.5)); a.tick(f, cam); });
    },
  };
};
function heart(g: G2, x: number, y: number, s: number, c = '#ff5a8a') {
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, px = x + s * 0.06 * 16 * Math.sin(a) ** 3, py = y - s * 0.06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = s * 0.09; g.strokeStyle = '#15121c'; g.lineJoin = 'round'; g.stroke();
}

// ------------------------------------------------------------------ the map wall: France in October, Europe in November
const FRANCE: [number, number][] = [[-1.8, 43.4], [-1.2, 44.6], [-1.1, 45.6], [-2.2, 47.0], [-4.7, 48.4], [-3.0, 48.8], [-1.6, 48.6], [-1.9, 49.7], [0.1, 49.5], [1.6, 50.9], [2.5, 51.1], [4.2, 50.0], [5.8, 49.5],
  [8.2, 49.0], [7.6, 47.6], [6.1, 46.2], [7.0, 45.9], [6.6, 45.0], [7.7, 44.1], [7.5, 43.8], [6.0, 43.1], [4.8, 43.4], [3.5, 43.3], [3.0, 42.5], [0.7, 42.7]];
/** longitude/latitude to map units: x right, y up, about ±1 across France */
const proj = ([lon, lat]: [number, number]): [number, number] => [(lon - 2.2) * 0.7 / 4.6, (lat - 46.7) / 4.6];
const inside = (x: number, y: number, poly: [number, number][]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
/** tiles of the Europe board: [code, name, column, row, hit on 2 November] */
const TILES: [string, string, number, number, boolean][] = [['NO', 'NORWAY', 2, 0, false], ['SE', 'SWEDEN', 3, 0, true], ['FI', 'FINLAND', 4, 0, false], ['IE', 'IRELAND', 0, 1, true], ['UK', 'BRITAIN', 1, 1, false], ['DK', 'DENMARK', 2, 1, false],
  ['EE', 'ESTONIA', 4, 1, true], ['NL', 'NETHERL.', 2, 2, false], ['DE', 'GERMANY', 3, 2, false], ['PL', 'POLAND', 4, 2, false], ['FR', 'FRANCE', 1, 3, false], ['BE', 'BELGIUM', 2, 3, true], ['LU', 'LUXEMB.', 3, 3, true]];
export const mapSet: Builder = (root) => {
  backdrop(root, ['#0c1424', '#16233c']);
  floor(root, 12, 10, '#1b2638');
  box(root, 9, 5.6, 0.3, '#18243a', 0, 2.8, -0.65);
  const pts = FRANCE.map(proj);
  const fr = grp(root, 0, 1.42, -0.48); fr.scale.setScalar(0.82);
  panel(fr, 2.6, 2.6, smat(tex('france', 780, 780, (g, w, h) => {
    g.fillStyle = '#122036'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,200,255,.12)'; g.lineWidth = 2;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    const X = (x: number) => w / 2 + x * w / 2.6, Y = (y: number) => h / 2 - y * h / 2.6;
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.closePath();
    g.fillStyle = '#2f6fc0'; g.fill(); g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#eaf2ff'; g.stroke();
    g.beginPath(); g.ellipse(X(1.06), Y(-0.98), 20, 44, 0.15, 0, 7); g.fill(); g.stroke();                                  // Corsica
    g.strokeStyle = '#eaf2ff'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  }), 1), 0, 0, 0);
  const r = rng(12), dots: {m: THREE.Mesh; ring: THREE.Mesh; at: number}[] = [];
  while (dots.length < 64) {
    const x = (r() - 0.5) * 2.2, y = (r() - 0.5) * 2.2;
    if (!inside(x, y, pts) || dots.some((d) => Math.hypot(d.m.position.x - x, d.m.position.y - y) < 0.11)) continue;
    dots.push({m: soft(ball(fr, 0.04, lit('#ff6a3a', 2.2), x, y, 0.03)), ring: soft(mesh(fr, new THREE.RingGeometry(0.052, 0.066, 28), new THREE.MeshBasicMaterial({color: '#ffc98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}), x, y, 0.036)), at: Math.floor(r() * 44)});
  }
  // Europe as a board of tiles, laid out roughly as the countries lie
  const eu = grp(root, 0, 1.52, -0.48), P = 0.47, tiles = TILES.map(([code, name, cx, ry, hit]) => {
    const x = (cx - 2) * P, y = (1.5 - ry) * P, base = code === 'FR' ? '#e9b930' : '#31435f';
    const cold = tmat(tex('tile-' + code, 168, 168, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); text(g, code, w / 2, h * 0.42, 86, code === 'FR' ? '#15121c' : '#dfe8f5'); text(g, code === 'FR' ? 'OCT 11–12' : name, w / 2, h * 0.8, 23, code === 'FR' ? '#15121c' : '#9fb4d0', {font: 'Montserrat', maxWidth: w - 16}); }));
    const hot = smat(tex('tile-hot-' + code, 168, 168, (g, w, h) => { g.fillStyle = '#ff5a3c'; g.fillRect(0, 0, w, h); text(g, code, w / 2, h * 0.42, 86, '#ffffff'); text(g, name, w / 2, h * 0.8, 23, '#fff0e0', {font: 'Montserrat', maxWidth: w - 16}); }), 1.15);
    const b = box(eu, 0.42, 0.42, 0.07, '#1f2b40', x, y, 0); const face = panel(eu, 0.4, 0.4, cold, x, y, 0.037);
    return {b, face, cold, hot, hit, x, y};
  });
  const cur = cursor3d(eu, 0.3);
  const hits = tiles.filter((x) => x.hit);
  return {
    light: () => ({...LIGHT.dark, sky: '#bcd0ff', amb: 1.25, keyI: 0.8}),
    tick: ({f, t, shot}) => {
      const europe = shot.v === 'europe';
      fr.visible = !europe; eu.visible = europe;
      dots.forEach((d) => { const a = t - 3 - d.at, k = pop(a, 0, 7); d.m.visible = a >= 0; d.m.scale.setScalar(Math.max(0.01, k)); d.ring.visible = a >= 0 && a < 16; d.ring.scale.setScalar(1 + a * 0.13); (d.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - a / 16)); });
      hits.forEach((x, i) => {                                                                        // the pointer visits the five countries in turn
        const at = shot.at + 4 + i * 8, on = f >= at; x.face.material = on ? x.hot : x.cold;
        const k = on ? 1 + 0.25 * Math.max(0, 1 - (f - at) / 6) : 1; x.b.scale.setScalar(k); x.face.scale.setScalar(k); x.face.position.z = 0.037 * k + (on ? 0.004 : 0);
      });
      if (europe) {
        const step = clamp01((f - shot.at - 1) / 8 / hits.length) * hits.length, i = Math.min(hits.length - 1, Math.floor(step)), u = smooth(step - i, 0, 0.75);
        const a = i ? hits[i - 1] : {x: 1.3, y: 1.3}, b = hits[i];
        cur.position.set(lerp(a.x, b.x, u) + 0.05, lerp(a.y, b.y, u) - 0.02, 0.12);
      }
    },
  };
};

// ------------------------------------------------------------------ the shop front: night, morning, fire
export const front: Builder = (root) => {
  const night = backdrop(root, ['#070c1c', '#16224a', '#2c3a6a']), day = backdrop(root, ['#6fb0f0', '#cfe6ff', '#ffe9c8']);
  floor(root, 40, 30, tmat(tiled(grainTex('asphalt', '#3f454e', 0.12), 10, 8)));
  for (const x of [-3.6, -1.2, 1.2, 3.6]) box(root, 0.08, 0.006, 2.4, lit('#e9edf0', 0.8), x, 0.004, 2.6);
  box(root, 9, 0.12, 1.2, '#b9bdc4', 0, 0.06, -1.5);                                                   // kerb in front of the doors
  // the building
  box(root, 6.6, 2.7, 2.4, '#e9e3d6', 0, 1.35, -3.3); box(root, 6.8, 0.18, 2.6, '#c9404a', 0, 2.79, -3.3);
  panel(root, 3.2, 0.44, smat(signTex('super', 900, 124, '#c9404a', '#ffffff', [['SUPERMARCHÉ', 92]]), 1.2), 0, 2.3, -2.085);
  box(root, 3.4, 0.08, 0.5, '#c9404a', 0, 2.05, -1.9);                                                 // canopy
  const inside = lamp('#fff0c8', 0.9); panel(root, 1.9, 1.9, inside, 0, 1.0, -2.09);                    // the shop behind the doors
  for (const s of [-1, 1]) {                                                                           // glass doors and side windows with posters
    soft(panel(root, 0.9, 1.86, new THREE.MeshBasicMaterial({color: '#bfe6ff', transparent: true, opacity: 0.22, depthWrite: false}), s * 0.47, 0.98, -2.07));
    box(root, 0.04, 1.9, 0.05, '#5a6470', s * 0.94, 0.98, -2.06); box(root, 0.03, 1.9, 0.04, '#5a6470', s * 0.02, 0.98, -2.06);
    panel(root, 1.5, 1.25, smat(tex('poster-' + s, 300, 250, (g, w, h) => {
      g.fillStyle = s < 0 ? '#ffe14a' : '#bfe9ff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#15121c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      if (s < 0) { text(g, 'PROMO', w / 2, 70, 76, '#c9404a'); text(g, '−20%', w / 2, 168, 96, '#15121c'); } else { text(g, 'SURGELÉS', w / 2, 60, 54, '#1f5fb8'); freezerIcon(g, w / 2, 160, 110); }
    }), 1), s * 2.15, 1.1, -2.09);
  }
  box(root, 1.96, 0.1, 0.1, '#5a6470', 0, 1.98, -2.04);
  const shutter = panel(root, 1.92, 1.92, tmat(tex('shutter', 64, 256, (g, w, h) => { for (let y = 0; y < h; y += 16) { const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#9aa4ae'); gr.addColorStop(0.7, '#7d8792'); gr.addColorStop(1, '#5a636e'); g.fillStyle = gr; g.fillRect(0, y, w, 16); } })), 0, 1.0, -2.03);
  const lock = grp(root, 0, 0.22, -1.99); box(lock, 0.16, 0.13, 0.05, '#c9a94f', 0, 0, 0); torus(lock, 0.05, 0.014, '#8f959e', 0, 0.085, 0);
  // camera over the door, alarm box, lamp post, trolley bay
  const cctv = grp(root, 1.25, 2.02, -1.95); box(cctv, 0.1, 0.1, 0.2, '#e6e9ec', 0, 0, 0.1); box(cctv, 0.16, 0.12, 0.3, '#f4f6f8', 0, -0.08, 0.26); cyl(cctv, 0.045, 0.04, '#15121c', 0, -0.08, 0.42).rotation.x = Math.PI / 2;
  const led = soft(ball(root, 0.03, lamp('#ff2a2a', 2), 1.33, 1.93, -1.5));
  box(root, 0.3, 0.2, 0.08, '#f2c230', -1.3, 2.0, -2.04); const armed = soft(ball(root, 0.035, lamp('#3fe07a', 2), -1.3, 2.0, -1.99));
  streetLamp(root, 3.0, -1.0, 3.1, '#ffe9b0', 2.2);
  const bay = grp(root, -2.7, 0, -1.2); for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) cyl(bay, 0.03, 1.5, '#8f9aa6', x, 0.75, z); box(bay, 1.3, 0.05, 1.0, '#c9404a', 0, 1.52, 0);
  trolley(bay, 0, 0, false).scale.setScalar(0.82);
  // night sky
  const moon = soft(ball(root, 0.5, lit('#fff6d0', 1.5), -2.6, 5.4, -14)); const stars = grp(root); const sr = rng(5);
  for (let i = 0; i < 26; i++) soft(ball(stars, 0.035 + sr() * 0.03, lit('#ffffff', 1.4), (sr() - 0.5) * 16, 3.6 + sr() * 5, -15));
  // a cat that has the car park to itself
  const cat = grp(root); ball(cat, 0.16, '#2b2d38', 0, 0.26, 0).scale.set(1.6, 0.85, 0.8); ball(cat, 0.115, '#2b2d38', 0.27, 0.4, 0);
  for (const s of [-1, 1]) cone(cat, 0.04, 0.09, '#2b2d38', 0.27 + s * 0.06, 0.52, 0, 4); const tail = rod(cat, [-0.24, 0.3, 0], [-0.38, 0.6, 0], 0.025, '#2b2d38');
  const paws = [-0.16, -0.06, 0.1, 0.2].map((x) => cyl(cat, 0.028, 0.16, '#2b2d38', x, 0.08, 0)); for (const s of [-1, 1]) soft(ball(cat, 0.018, lit('#c8ff7a', 2.4), 0.36, 0.42, s * 0.045));
  // morning: the bin, the trolley, what ran out of it
  const dump = grp(root, 1.75, 0, 0.1); box(dump, 1.5, 1.05, 1.0, '#2f8a55', 0, 0.62, 0); box(dump, 1.56, 0.07, 1.06, '#236b41', 0, 1.17, 0); for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) cyl(dump, 0.08, 0.06, '#15121c', x, 0.08, z).rotation.x = Math.PI / 2;
  const lid = box(dump, 1.56, 0.06, 1.06, '#2f8a55', 0, 1.22, -0.5); lid.rotation.x = -1.1; lid.position.set(0, 1.62, -0.72);
  const gr = rng(8); for (let i = 0; i < 12; i++) box(dump, 0.3, 0.22, 0.24, ['#ff7ab0', '#ffd43b', '#7ad0f0', '#8fd36a', '#e0603a', '#c9a0ff'][i % 6], (gr() - 0.5) * 1.1, 1.24 + gr() * 0.26, (gr() - 0.5) * 0.6).rotation.set(gr(), gr(), gr());
  const cart = trolley(root, 0, 0); const goo = [spill(root, '#ffc4dc', 4), spill(root, '#fff3d6', 9)];
  const pusher = actor(root, WORKER(2), {a: {expr: 'pained', pose: 'both'}}, 0, 0, 0, {scale: 1.0}), carrier = actor(root, WORKER(1), {a: {expr: 'nervous', pose: 'both', prop: 'box'}}, -1.4, 0, -0.2, {scale: 0.98});
  // fire: smoke out of the doors, an engine's lights, somebody with a hose
  const smoke = puffs(root, 14, '#3a3d46', 0.85);
  // flames in the doorway: two sheets of tongues that sway out of step (drawn with their own ink line, so they stay off the ink pass)
  const flameTex = (seed: number) => tex('flames-' + seed, 512, 448, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = rng(seed);
    const tongue = (cx: number, wd: number, ht: number, lean: number, fill: string, ink: number) => {
      g.beginPath(); g.moveTo(cx - wd / 2, h + 12);
      g.bezierCurveTo(cx - wd * 0.66, h - ht * 0.42, cx - wd * 0.1 + lean * 0.4, h - ht * 0.64, cx + lean, h - ht);
      g.bezierCurveTo(cx + wd * 0.22 + lean * 0.3, h - ht * 0.6, cx + wd * 0.7, h - ht * 0.4, cx + wd / 2, h + 12);
      g.closePath(); g.fillStyle = fill; g.fill();
      if (ink) { g.lineWidth = ink; g.strokeStyle = '#15121c'; g.lineJoin = 'round'; g.stroke(); }
    };
    const ts = [0.13, 0.32, 0.5, 0.69, 0.87].map((x) => ({x: x * w + (r() - 0.5) * 24, wd: w * (0.24 + 0.08 * r()), ht: h * (0.56 + 0.36 * r()), lean: (r() - 0.5) * w * 0.14}));
    for (const t of ts) tongue(t.x, t.wd, t.ht, t.lean, '#ff5a1f', 10);
    for (const t of ts) tongue(t.x, t.wd * 0.64, t.ht * 0.7, t.lean * 0.7, '#ff9a2a', 0);
    for (const t of ts) tongue(t.x, t.wd * 0.34, t.ht * 0.42, t.lean * 0.4, '#ffe066', 0);
  });
  const flames = [5, 11].map((seed, i) => soft(panel(root, 1.9, 1.6, smat(flameTex(seed), 1.35, true), 0, 0.92, -1.99 + 0.012 * i)));
  const truck = grp(root, -3.3, 0, 0.6); box(truck, 2.2, 1.3, 1.3, '#d8322c', 0, 0.95, 0); box(truck, 0.9, 0.9, 1.26, '#d8322c', 1.3, 0.75, 0); box(truck, 0.7, 0.4, 1.28, '#bfe6ff', 1.34, 0.98, 0); box(truck, 2.2, 0.12, 1.32, '#f4f6f8', 0, 0.7, 0);
  for (const x of [-0.7, 1.3]) for (const z of [-0.62, 0.62]) cyl(truck, 0.26, 0.16, '#15121c', x, 0.26, z).rotation.x = Math.PI / 2;
  const beacons = [0.2, 0.9].map((x) => soft(box(truck, 0.2, 0.12, 0.2, lamp('#3aa0ff', 2), x, 1.68, 0)));
  const fire = actor(root, FIREFIGHTER, {a: {expr: 'stern', pose: 'both', prop: 'hose'}}, -0.95, 0, -0.2, {scale: 1.04});
  const blink = pool(root, 3.2, '#3aa0ff', 0, -1.2, 0.4);
  // the hose jet: one tapered tube along the water's arc, with bulges that run down it; spray and steam where it lands
  const JN = 18, JR = 8, jetGeo = new THREE.BufferGeometry(), jetPos = new Float32Array((JN + 1) * JR * 3), jetIdx: number[] = [];
  for (let i = 0; i < JN; i++) for (let k = 0; k < JR; k++) { const a = i * JR + k, b = i * JR + (k + 1) % JR; jetIdx.push(a, b, a + JR, b, b + JR, a + JR); }
  jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPos, 3)); jetGeo.setIndex(jetIdx);
  const jet = mesh(root, jetGeo, new THREE.MeshBasicMaterial({color: new THREE.Color('#bfe9ff').multiplyScalar(1.12), side: THREE.DoubleSide})); jet.castShadow = false; jet.frustumCulled = false;
  const jetAt = (u: number) => new THREE.Vector3(lerp(-0.42, 0.62, u), 1.12 + 1.5 * u - 1.72 * u * u, lerp(-0.1, -1.9, u));
  const spray = Array.from({length: 7}, () => soft(ball(root, 0.035, lit('#ffffff', 1.2)))), hissing = puffs(root, 6, '#ffffff', 0.6);
  return {
    light: (v) => v === 'dump' ? {...LIGHT.day, amb: 1.6} : v === 'fire' ? {...LIGHT.dusk, sky: '#ffb080', amb: 1.1, key: '#ffb070', keyI: 1.1} : {...LIGHT.dark, sky: '#9fb0ff', amb: 0.85, keyI: 0.7},
    tick: ({f, t, cam, shot}) => {
      const v = shot.v, isNight = v === 'night' || v === 'locked', isFire = v === 'fire', isDump = v === 'dump';
      night.visible = !isDump; day.visible = isDump; moon.visible = stars.visible = isNight;
      shutter.visible = lock.visible = isNight; inside.color.set(isFire ? '#ff9a4a' : isDump ? '#fff0c8' : '#20283a').multiplyScalar(isFire ? 1.5 + 0.4 * Math.sin(f * 0.7) : 0.9);
      cctv.rotation.y = 0.5 * Math.sin(f * 0.05); (led.material as THREE.MeshBasicMaterial).color.setScalar(Math.floor(f / 10) % 2 ? 0.2 : 2).multiply(new THREE.Color('#ff3a3a'));
      (armed.material as THREE.MeshBasicMaterial).color.set('#3fe07a').multiplyScalar(1.4 + 0.8 * Math.sin(f * 0.25));
      cat.visible = v === 'locked'; cat.position.set(lerp(1.25, -0.45, clamp01(t / 46)), 0.12 + 0.03 * Math.abs(Math.sin(f * 0.6)), -1.4); cat.scale.x = -1; tail.rotation.z = 0.2 * Math.sin(f * 0.3);
      paws.forEach((p, i) => { p.position.z = 0.03 * Math.sin(f * 0.6 + i * 1.6); p.rotation.x = 0.4 * Math.sin(f * 0.6 + i * 1.6); });
      dump.visible = cart.visible = pusher.node.visible = carrier.node.visible = isDump; goo.forEach((g2) => { g2.visible = isDump; });
      if (isDump) {
        const x = lerp(-0.1, 0.37, smooth(t, 0, 20)); cart.position.set(x + 0.2, 0, 0.55); pusher.node.position.set(x - 0.62, 0.03 * Math.abs(Math.sin(f * 0.5)), 0.55);   // the worker is in the frame from the first frame
        goo[0].position.set(x - 0.2, 0.011, 0.95); goo[0].scale.setScalar(0.55); goo[1].position.set(-1.2, 0.012, 0.6); goo[1].scale.setScalar(0.38);
        carrier.node.position.set(-1.55, 0.03 * Math.abs(Math.sin(f * 0.5 + 1)), -0.3);
      }
      truck.visible = fire.node.visible = jet.visible = isFire;
      smoke.set(f, isFire ? 1 : 0, 0, 1.3, -1.75, {spread: 0.8, rise: 2.4, r0: 0.25, r1: 0.85, drift: 0.7, speed: 0.014});
      flames.forEach((m, i) => { const sy = 1 + 0.1 * Math.sin(f * 0.62 + i * 2.1) + 0.04 * Math.sin(f * 1.1 + i); m.visible = isFire; m.scale.set(1 + 0.04 * Math.sin(f * 0.5 + i * 2), sy, 1); m.position.set(0.04 * Math.sin(f * 0.4 + i * 1.7) * (i ? -1 : 1), 0.12 + 0.8 * sy, -1.99 + 0.012 * i); });
      beacons.forEach((b, i) => (b.material as THREE.MeshBasicMaterial).color.set('#3aa0ff').multiplyScalar(1.65 + 1.35 * Math.sin(f * 0.55 + i * Math.PI)));
      (blink.material as THREE.MeshBasicMaterial).opacity = isFire ? 0.11 * (1 + Math.sin(f * 0.55)) : 0;
      fire.node.position.y = hop(f, shot.at + 3, 0.08, 8);
      spray.forEach((m) => { m.visible = isFire; });
      if (isFire) {
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i <= JN; i++) {
          const u = i / JN, c = jetAt(u), tan = jetAt(u + 0.01).sub(jetAt(u - 0.01)).normalize(), n = new THREE.Vector3().crossVectors(up, tan).normalize(), b = new THREE.Vector3().crossVectors(tan, n);
          const r = (0.03 + 0.065 * u) * (1 + 0.2 * Math.sin(u * 15 - f * 0.9));
          for (let k = 0; k < JR; k++) { const a = k / JR * Math.PI * 2, o = (i * JR + k) * 3, ca = Math.cos(a) * r, sa = Math.sin(a) * r; jetPos[o] = c.x + n.x * ca + b.x * sa; jetPos[o + 1] = c.y + n.y * ca + b.y * sa; jetPos[o + 2] = c.z + n.z * ca + b.z * sa; }
        }
        jetGeo.attributes.position.needsUpdate = true; jetGeo.computeVertexNormals();
        const end = jetAt(1);
        spray.forEach((m, i) => { const u = (f / 12 + i / 7) % 1, a = i * 2.4; m.position.set(end.x + 0.34 * u * Math.cos(a), end.y + 0.1 + 0.5 * u - 0.9 * u * u, end.z + 0.12 + 0.2 * u * Math.sin(a)); m.scale.setScalar(1.3 - 0.9 * u); });
      }
      hissing.set(f, isFire ? 1 : 0, 0.62, 0.95, -1.8, {spread: 0.16, rise: 0.9, r0: 0.1, r1: 0.36, drift: 0.2, speed: 0.03});
      pusher.tick(f, cam); carrier.tick(f, cam); fire.tick(f, cam);
    },
  };
};
