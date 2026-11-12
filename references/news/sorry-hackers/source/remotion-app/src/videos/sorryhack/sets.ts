// Sets of the sorry hackers short, part 1: the emergency entrance, the map, the road, the nurses' station. Each builder
// fills a group once and returns a tick that poses it for a frame (motion is a pure function of the frame number, so
// any frame can be rendered on its own).
import * as THREE from 'three';
import {backdrop, ball, box, cyl, floor, grainTex, grp, hop, lamp, lit, mesh, panel, pool, pop, rng, rrect, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, type G2, type Node, type V} from './kit';
import {actor, GREEN, NURSE} from './cast';
import {monitor, officeChair, plant, screenTex, signTex, table} from './props';
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

export const INK = '#15121c';
/** a loudspeaker with three waves: a computer that talks */
export const speaker = (g: G2, x: number, y: number, s: number, c: string) => {
  g.save(); g.fillStyle = c; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - s, y - s * 0.3); g.lineTo(x - s * 0.5, y - s * 0.3); g.lineTo(x, y - s * 0.75); g.lineTo(x, y + s * 0.75); g.lineTo(x - s * 0.5, y + s * 0.3); g.lineTo(x - s, y + s * 0.3); g.closePath(); g.fill();
  g.lineWidth = s * 0.17; for (const r of [0.45, 0.82, 1.2]) { g.beginPath(); g.arc(x + s * 0.12, y, s * r, -0.8, 0.8); g.stroke(); }
  g.restore();
};
/** a padlock: locked, out of reach */
export const padlock = (g: G2, x: number, y: number, s: number, body = '#f2c230') => {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [lw, c] of [[s * 0.34, INK], [s * 0.16, '#c9ced6']] as const) { g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); g.moveTo(x - s * 0.34, y); g.lineTo(x - s * 0.34, y - s * 0.34); g.arc(x, y - s * 0.34, s * 0.34, Math.PI, 0); g.lineTo(x + s * 0.34, y); g.stroke(); }
  g.fillStyle = body; g.strokeStyle = INK; g.lineWidth = s * 0.1; rrect(g, x - s * 0.6, y - s * 0.04, s * 1.2, s * 0.92, s * 0.14); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(x, y + s * 0.32, s * 0.13, 0, 7); g.fill(); g.fillRect(x - s * 0.055, y + s * 0.32, s * 0.11, s * 0.3);
  g.restore();
};
/** what a screen shows while the computer talks: a loudspeaker, nothing else */
export const talkTex = (key: string, bg: string, fg: string) => screenTex('talk-' + key, (g, w, h) => { speaker(g, w / 2 - 20, h / 2, 110, fg); }, 512, 368, bg);
/** Rings of sound that leave a point, facing the camera side of the set. Call the returned function every frame. */
export function rings(p: Node, n = 3, color: string = GREEN) {
  const os = Array.from({length: n}, () => { const o = soft(mesh(p, new THREE.RingGeometry(0.86, 1, 44), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}))); o.renderOrder = 6; return o; });
  return (f: number, on: boolean, at: V, r = 0.5, ry = 0, speed = 0.05) => os.forEach((o, i) => {
    const u = (f * speed + i / n) % 1; o.visible = on; o.position.set(...at); o.rotation.y = ry; o.scale.setScalar(r * (0.2 + 0.8 * u)); (o.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - u) ** 1.4;
  });
}
/** Arcs of sound that leave a megaphone toward +x. Call the returned function every frame. */
export function arcs(p: Node, n = 3, color: string = '#ffe14a') {
  const os = Array.from({length: n}, () => { const o = soft(mesh(p, new THREE.RingGeometry(0.86, 1, 28, 1, -0.62, 1.24), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}))); o.renderOrder = 6; return o; });
  return (f: number, on: boolean, at: V, r = 0.5, speed = 0.05) => os.forEach((o, i) => {
    const u = (f * speed + i / n) % 1; o.visible = on; o.position.set(...at); o.scale.setScalar(r * (0.3 + 0.7 * u)); (o.material as THREE.MeshBasicMaterial).opacity = 0.95 * Math.min(1, u * 6) * (1 - u) ** 1.1;
  });
}

// ------------------------------------------------------------------ an ambulance
const ambSide = () => tex('amb-side', 640, 400, (g, w, h) => {
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#f08a24'; g.fillRect(0, h * 0.6, w, h * 0.16); g.fillStyle = '#2f6fd0'; g.fillRect(0, h * 0.78, w, h * 0.06);
  text(g, 'AMBULANCE', w / 2, h * 0.32, 150, '#2f6fd0', {maxWidth: w * 0.9});
});
const ambCab = () => tex('amb-cab', 320, 400, (g, w, h) => {
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#f08a24'; g.fillRect(0, h * 0.6, w, h * 0.16); g.fillStyle = '#2f6fd0'; g.fillRect(0, h * 0.78, w, h * 0.06);
  g.fillStyle = '#24344e'; rrect(g, 40, 34, w - 76, h * 0.4, 22); g.fill(); g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
});
export type Ambulance = {g: THREE.Group; /** flash the lights, bob on the springs */ tick: (f: number, lights?: boolean) => void};
/** A small van with a light bar. Its nose points to +x; turn the group to drive the other way. */
export function ambulance(p: Node): Ambulance {
  const g = grp(p), W2 = 0.5, side = tmat(ambSide()), cab = tmat(ambCab());
  box(g, 1.5, 1.05, 2 * W2, '#fbfaf5', -0.45, 0.85, 0); box(g, 0.75, 0.82, 2 * W2 - 0.04, '#fbfaf5', 0.67, 0.73, 0); box(g, 0.34, 0.36, 2 * W2 - 0.08, '#fbfaf5', 1.1, 0.5, 0);
  for (const s of [-1, 1]) {
    panel(g, 1.46, 0.98, side, -0.45, 0.85, s * (W2 + 0.004), s > 0 ? 0 : Math.PI);
    panel(g, 0.72, 0.78, cab, 0.67, 0.74, s * (W2 - 0.014), s > 0 ? 0 : Math.PI);
    for (const x of [-0.78, 0.74]) { const wh = cyl(g, 0.2, 0.14, '#23252e', x, 0.2, s * (W2 - 0.03)); wh.rotation.x = Math.PI / 2; const hub = cyl(g, 0.09, 0.15, '#c9ced6', x, 0.2, s * (W2 - 0.02)); hub.rotation.x = Math.PI / 2; }
    box(g, 0.05, 0.1, 0.16, lit('#fff3c0', 1.4), 1.275, 0.52, s * 0.3);                               // headlights
  }
  panel(g, 0.86, 0.4, lit('#24344e', 1), 1.047, 0.9, 0, Math.PI / 2).rotation.set(0, Math.PI / 2, 0);   // windscreen
  box(g, 0.1, 0.12, 2 * W2 + 0.02, '#8a94a3', 1.26, 0.34, 0); box(g, 0.06, 0.1, 2 * W2, '#8a94a3', -1.22, 0.36, 0);
  const bar = [lamp('#ff3b30', 1), lamp('#2f7bff', 1)];
  box(g, 0.2, 0.07, 0.8, '#2a2d36', 0.5, 1.17, 0); bar.forEach((m, i) => box(g, 0.18, 0.11, 0.36, m, 0.5, 1.25, (i ? 1 : -1) * 0.2));
  const rear = [lamp('#ff3b30', 1), lamp('#ff3b30', 1)]; rear.forEach((m, i) => box(g, 0.1, 0.09, 0.14, m, -1.16, 1.3, (i ? 1 : -1) * 0.34));
  const red = new THREE.Color('#ff3b30'), blue = new THREE.Color('#2f7bff');
  return {g, tick: (f, lights = true) => {
    const a = lights ? (Math.floor(f / 4) % 2 ? 1 : 0) : 0.5;
    bar[0].color.copy(red).multiplyScalar(lights ? 0.35 + 2.4 * a : 0.5); bar[1].color.copy(blue).multiplyScalar(lights ? 0.35 + 2.4 * (1 - a) : 0.5);
    rear.forEach((m, i) => m.color.copy(red).multiplyScalar(lights ? 0.35 + 2.2 * (i ? a : 1 - a) : 0.5));
    g.position.y = 0.012 * Math.sin(f * 0.6);
  }};
}

// ------------------------------------------------------------------ the emergency entrance (no likeness of the real building)
const shrub = (p: THREE.Group, x: number, z: number, s = 1) => {                                       // sagebrush, two tufts: this is the high desert, not a lawn
  ball(p, 0.34 * s, '#7f9a5a', x, 0.2 * s, z).scale.y = 0.7; ball(p, 0.22 * s, '#90a968', x + 0.42 * s, 0.13 * s, z + 0.1 * s).scale.y = 0.7;
};
export const er: Builder = (root) => {
  backdrop(root, ['#5aa6e8', '#f3e6c8']);
  floor(root, 40, 30, tmat(tiled(grainTex('er-sand', '#d9c39a', 0.08), 10, 8)));
  floor(root, 40, 3.2, tmat(tiled(grainTex('er-road', '#666b78', 0.1), 12, 1)), 0.012, 0, 1.4); box(root, 40, 0.1, 0.16, '#e8e2d4', 0, 0.05, -0.28);
  const win = tex('er-win', 256, 256, (g) => {
    g.fillStyle = '#e9d6b6'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#d9c29c'; g.fillRect(0, 232, 256, 24);
    for (const x of [28, 148]) { g.fillStyle = '#7fb6d6'; g.fillRect(x, 60, 80, 120); g.strokeStyle = '#fffaf0'; g.lineWidth = 9; g.strokeRect(x, 60, 80, 120); g.beginPath(); g.moveTo(x + 40, 60); g.lineTo(x + 40, 180); g.stroke(); }
  }, true);
  box(root, 12, 6.6, 0.5, tmat(tiled(win, 6, 3)), 0, 3.3, -2.15); box(root, 12.2, 0.2, 0.7, '#c9b08a', 0, 6.65, -2.1);
  // the porch: glass doors under a canopy with a sign that can change
  box(root, 3.3, 2.75, 0.3, '#f3ead8', 0, 1.375, -1.85); box(root, 2.1, 2.2, 0.06, '#2b3a55', 0, 1.1, -1.68); box(root, 0.05, 2.2, 0.08, '#c9ced6', 0, 1.1, -1.66);
  for (const s of [-1, 1]) { box(root, 0.08, 2.2, 0.08, '#c9ced6', s * 1.06, 1.1, -1.66); panel(root, 0.86, 1.9, lit('#9fd0ee', 0.95), s * 0.52, 1.15, -1.645); }
  box(root, 3.0, 0.2, 2.3, '#f6f2e8', 0, 2.86, -0.75); for (const s of [-1, 1]) cyl(root, 0.07, 2.76, '#c9ced6', s * 1.36, 1.38, 0.2);
  const SIGNS = {
    er: signTex('er-on', 760, 160, '#d62f2f', '#ffffff', [['EMERGENCY', 128, 0.56]], {border: '#ffffff'}),
    div: signTex('er-div', 760, 160, '#f2a51f', INK, [['AMBULANCES DIVERTED', 96, 0.56]], {border: INK}),
    open: signTex('er-open', 760, 160, '#2fbf71', '#ffffff', [['EMERGENCY · OPEN', 104, 0.56]], {border: '#ffffff'}),
    off: tex('er-glitch', 760, 160, (g, w, h) => { const q = rng(5); g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = ['#d62f2f', '#8dff7a', '#f3f1ea', '#2f6fd0'][i % 4]; g.fillRect(q() * w, q() * h, 30 + q() * 150, 5 + q() * 12); } }),
  };
  const signM = new THREE.MeshBasicMaterial({map: SIGNS.er}); box(root, 2.5, 0.62, 0.1, '#2a2d36', 0, 2.52, 0.36); panel(root, 2.38, 0.5, signM, 0, 2.52, 0.415);
  shrub(root, -2.7, 0.1, 1.2); shrub(root, 2.9, -0.2, 1.0); shrub(root, 3.6, 3.4, 0.9); plant(root, -1.95, -0.9, 1.2, '#b9623a'); plant(root, 1.95, -0.9, 1.2, '#b9623a');
  const amb = ambulance(root);
  const nurse = actor(root, NURSE(3), {idle: {expr: 'neutral'}, stop: {expr: 'stern', pose: 'push'}, way: {expr: 'stern', pose: 'point'}, hi: {expr: 'smile', pose: 'wave'}}, -1.12, 0, 0.45, {scale: 1.0, res: 1.1, wide: true});
  const two = [actor(root, NURSE(0), {a: {expr: 'smile'}}, -0.55, 0, -0.9, {scale: 0.95, res: 0.9}), actor(root, NURSE(1), {a: {expr: 'smile', pose: 'wave'}}, 0.5, 0, -1.0, {scale: 0.95, res: 0.9})];
  return {
    light: (v) => v === 'date' || v === 'name' ? {...LIGHT.day, key: '#fff6e0'} : LIGHT.day,
    tick: ({f, cam, shot}) => {
      const v = shot.v, t0 = shot.at;
      let x = 9, dir = Math.PI, sign: keyof typeof SIGNS = 'er', st = 'idle', flash = true;
      if (v === 'hit') {                                                                                // it pulls in; the sign over the door breaks up on "cyberattack" and reads DIVERTED by "sent"
        x = 4.56 - 4.0 * smooth(f, t0 - 4, t0 + 24); const g0 = W(1) + 5, g1 = W(2) - 1;
        sign = f < g0 ? 'er' : f < g1 ? (Math.floor(f / 2) % 2 ? 'off' : 'er') : 'div'; st = f >= g1 + 3 ? 'stop' : 'idle';
      } else if (v === 'away') { dir = 0; x = 0.3 + 3.4 * ((f - t0) / 26) ** 2.2; sign = 'div'; st = 'way'; }      // it has turned round, and goes
      else if (v === 'back') { x = 4.38 - 4.0 * smooth(f, t0 - 2, t0 + 20); sign = 'open'; st = 'hi'; }
      else flash = false;
      amb.g.visible = v === 'hit' || v === 'away' || v === 'back'; amb.g.position.x = x; amb.g.position.z = 1.35; amb.g.rotation.y = dir; amb.tick(f, flash);
      signM.map = SIGNS[sign];
      nurse.node.visible = amb.g.visible; nurse.show(st); nurse.mesh.scale.x = st === 'stop' ? -1 : 1; nurse.node.position.y = v === 'hit' ? hop(f, W(2) + 2, 0.07, 8) : 0; nurse.tick(f, cam);
      two.forEach((a) => { a.node.visible = !amb.g.visible; a.tick(f, cam); });
    },
  };
};

// ------------------------------------------------------------------ the map: one pin
const NM: [number, number][] = [[-109.05, 37], [-103.0, 37], [-103.04, 36.5], [-103.06, 32.0], [-106.62, 32.0], [-106.53, 31.78], [-108.21, 31.78], [-108.21, 31.33], [-109.05, 31.33]];
export const map: Builder = (root) => {
  backdrop(root, ['#12303a', '#1f4a55']);
  floor(root, 14, 12, tmat(tiled(grainTex('map-floor', '#24505a', 0.1), 5, 4)));
  const BW = 2.2, BH = 2.5, CY = 1.42, Z = -0.4, PX = 1000, PY = Math.round(1000 * BH / BW);
  // lon/lat -> board pixels: one degree of longitude is about 0.83 of a degree of latitude this far north
  const sc = 118, mx = (lon: number) => PX / 2 + (lon + 106.03) * 0.83 * sc, my = (lat: number) => PY / 2 + 40 - (lat - 34.17) * sc;
  box(root, BW + 0.14, BH + 0.14, 0.08, '#6b4628', 0, CY, Z - 0.05);
  panel(root, BW, BH, smat(tex('map-nm', PX, PY, (g, w, h) => {
    g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d6cbb2'; g.lineWidth = 4;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    g.beginPath(); NM.forEach(([lo, la], i) => (i ? g.lineTo(mx(lo), my(la)) : g.moveTo(mx(lo), my(la)))); g.closePath(); g.fillStyle = '#f2b45a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 12; g.lineJoin = 'round'; g.stroke();
    text(g, 'NEW MEXICO', w / 2 + 6, my(33.25), 104, INK, {maxWidth: 560});
    g.fillStyle = INK; g.beginPath(); g.arc(mx(-106.65), my(35.08), 13, 0, 7); g.fill(); text(g, 'ALBUQUERQUE', mx(-106.65) + 28, my(35.08) + 52, 44, INK, {font: 'Montserrat', align: 'left'});
  }), 1), 0, CY, Z);
  const px = (mx(-106.65) / PX - 0.5) * BW, py = CY + (0.5 - my(35.08) / PY) * BH, pin = grp(root, px, py, Z + 0.02);
  soft(panel(pin, 0.4, 0.4, smat(tex('map-pin', 200, 200, (g) => { g.fillStyle = INK; rrect(g, 4, 4, 192, 192, 34); g.fill(); g.fillStyle = '#2f6fd0'; rrect(g, 18, 18, 164, 164, 24); g.fill(); text(g, 'H', 100, 106, 150, '#ffffff'); }), 1.05, true), 0, 0.34, 0.03));
  soft(mesh(pin, new THREE.ConeGeometry(0.07, 0.16, 3), lit(INK, 1), 0, 0.075, 0.02)).rotation.set(Math.PI, 0, 0);
  const ring = rings(root, 3, '#e3342f');
  return {
    light: () => LIGHT.room,
    tick: ({f, shot}) => { const at = shot.at + 3; pin.scale.setScalar(pop(f, at, 8)); pin.position.y = py + hop(f, at + 8, 0.05, 8); ring(f, f >= at + 6, [px, py, Z + 0.015], 0.62, 0, 0.035); },
  };
};

// ------------------------------------------------------------------ the road: for two hours, the other way
const ridge = () => tex('ridge', 1024, 256, (g, w, h) => {
  const q = rng(41); g.clearRect(0, 0, w, h);
  for (const [c, base, amp] of [['#b98f8a', 120, 70], ['#9a6f72', 170, 46]] as const) { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); let y: number = base; for (let x = 0; x <= w; x += 32) { y = Math.max(40, Math.min(h - 30, y + (q() - 0.5) * amp)); g.lineTo(x, y); } g.lineTo(w, h); g.closePath(); g.fill(); }
});
const clockTex = (t: string) => tex('clock-' + t, 520, 230, (g, w, h) => {
  g.fillStyle = '#12151c'; g.fillRect(0, 0, w, h); g.shadowColor = '#ffb23a'; g.shadowBlur = 22; text(g, t, w / 2 - 44, h / 2 + 6, 176, '#ffc24a'); g.shadowBlur = 8; text(g, 'P.M.', w - 70, h / 2 + 44, 54, '#ffc24a', {font: 'Montserrat'});
});
const arrowSign = () => tex('road-sign', 900, 520, (g, w, h) => {
  g.fillStyle = '#2f7a4a'; rrect(g, 0, 0, w, h, 34); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 14; rrect(g, 16, 16, w - 32, h - 32, 24); g.stroke();
  g.fillStyle = '#2f6fd0'; rrect(g, 60, 60, 150, 150, 20); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke(); text(g, 'H', 135, 141, 138, '#ffffff');
  text(g, 'UNIVERSITY', 250, 104, 80, '#ffffff', {align: 'left'}); text(g, 'HOSPITAL', 250, 180, 80, '#ffffff', {align: 'left'});
  g.fillStyle = '#f2a51f'; rrect(g, 596, 86, 250, 98, 14); g.fill(); g.strokeStyle = INK; g.lineWidth = 8; g.stroke(); text(g, 'DIVERTED', 721, 139, 66, INK, {maxWidth: 220});
  g.fillStyle = '#ffffff'; g.fillRect(50, 262, w - 100, 8);
  text(g, 'OTHER HOSPITALS', 70, 392, 100, '#ffffff', {align: 'left', maxWidth: 560});
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(660, 362); g.lineTo(760, 362); g.lineTo(760, 320); g.lineTo(850, 392); g.lineTo(760, 464); g.lineTo(760, 422); g.lineTo(660, 422); g.closePath(); g.fill();
});
export const road: Builder = (root) => {
  backdrop(root, ['#5aa6e8', '#f6e3c0']);
  floor(root, 60, 40, tmat(tiled(grainTex('road-sand', '#d9c39a', 0.08), 14, 10)));
  floor(root, 60, 3.4, tmat(tiled(grainTex('road-tar', '#5f6470', 0.1), 16, 1)), 0.012, 0, 1.2); for (let i = -8; i <= 8; i++) floor(root, 0.9, 0.1, '#f3ead0', 0.016, i * 1.9, 1.2);
  box(root, 60, 0.1, 0.16, '#e8e2d4', 0, 0.05, -0.56);
  soft(panel(root, 46, 7, smat(ridge(), 1, true), 0, 3.2, -16));
  for (const [x, z, w, h, c] of [[-4.2, -5, 2.4, 1.5, '#d9a273'], [3.6, -5.5, 3, 1.9, '#c98f62'], [0.3, -7, 2.2, 1.3, '#e0b88c']] as const) { box(root, w, h, 1.6, c, x, h / 2, z); box(root, w + 0.1, 0.12, 1.7, '#b97f52', x, h + 0.06, z); }
  shrub(root, -3.2, -1.5, 1.2); shrub(root, 2.6, -1.9, 1.0); shrub(root, -0.9, -2.6, 0.8);
  // the sign over the road
  for (const s of [-1, 1]) cyl(root, 0.06, 2.7, '#8a94a3', 0.25 + s * 1.0, 1.35, -0.9); box(root, 2.44, 1.44, 0.07, '#e8e2d4', 0.25, 2.05, -0.86); panel(root, 2.3, 1.3, smat(arrowSign(), 1), 0.25, 2.05, -0.82);
  // a clock on top of it (a portrait frame cannot hold the two side by side)
  const CX = 0.25, CY = 3.22; cyl(root, 0.05, 0.12, '#3d4450', CX, 2.8, -0.86); box(root, 1.5, 0.76, 0.2, '#23252e', CX, CY, -0.86);
  const TIMES = ['12:30', '1:00', '1:30', '2:00', '2:30'], clockM = new THREE.MeshBasicMaterial({map: clockTex(TIMES[0])}), faces = TIMES.map(clockTex); panel(root, 1.36, 0.6, clockM, CX, CY, -0.755);
  const ambs = [ambulance(root), ambulance(root)];
  return {
    light: () => LIGHT.day,
    tick: ({f, shot}) => {
      // the clock runs from 12:30 to 2:30 while the narrator says "for two hours"
      const k = shot.v === 'two' ? Math.min(4, Math.floor(5 * smooth(f, W(43) + 2, W(45) + 14) * 0.999)) : 4; clockM.map = faces[k];
      ambs.forEach((a, i) => { const t = f - (shot.v === 'else' ? shot.at : W(46) - 2) - i * 30; a.g.visible = shot.v === 'else' && t > -40; a.g.position.set(-4.6 + 0.17 * t, 0, 1.0); a.tick(f); });
    },
  };
};

// ------------------------------------------------------------------ the nurses' station: a voice from the computers
export const ward: Builder = (root) => {
  backdrop(root, ['#20404a', '#356470']);
  floor(root, 14, 12, tmat(tiled(tileTex('ward-floor', '#dfe9e6', '#b9cbc6', 4), 6, 5)));
  box(root, 9, 5.6, 0.3, '#cfe5df', 0, 2.8, -2.0); box(root, 9, 0.5, 0.32, '#27b3ad', 0, 1.25, -1.99); box(root, 9, 0.22, 0.34, '#f1ebe0', 0, 0.11, -1.98);
  const sign = panel(root, 1.5, 0.36, smat(signTex('ward-sign', 620, 150, '#2b3550', '#ffffff', [["NURSES' STATION", 96, 0.56]]), 1), 0.45, 2.22, -1.84);
  // a whiteboard of beds, as wards keep
  box(root, 1.3, 0.8, 0.05, '#c9ced6', -1.05, 1.9, -1.84); panel(root, 1.2, 0.7, smat(tex('ward-board', 480, 280, (g, w, h) => {
    g.fillStyle = '#fbfbf6'; g.fillRect(0, 0, w, h); const q = rng(3); for (let r = 0; r < 5; r++) { g.fillStyle = ['#2f6fd0', '#2fbf71', '#f2a51f'][r % 3]; g.fillRect(24, 30 + r * 48, 44, 26); g.fillStyle = '#8f97a6'; g.fillRect(84, 36 + r * 48, 120 + q() * 220, 12); }
  }), 1), -1.05, 1.9, -1.81);
  plant(root, 1.75, -1.4, 1.0, '#27b3ad');
  table(root, 0, 0.25, 2.7, 0.7, {h: 0.98, top: '#f3ead8', leg: '#8a94a3', skirt: '#3f8f9a'}); box(root, 2.74, 0.06, 0.1, '#2f7480', 0, 0.99, 0.6);
  box(root, 2.54, 0.34, 0.03, '#3f8f9a', 0, 0.17, 0.51);                                                   // the desk's front goes down to the floor: the feet of two chairs read as a scribble beside the caption
  const XS = [-0.42, 0.72], MX = [-1.0, 0.14];
  XS.forEach((x) => officeChair(root, x, -0.42, '#3f5d8a'));
  const calm = screenTex('ward-calm', (g, w, h) => {
    g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, w, 60); const q = rng(8); for (let r = 0; r < 6; r++) { g.fillStyle = '#c3d3e6'; g.fillRect(30, 90 + r * 44, 90, 18); g.fillStyle = '#8fa3bf'; g.fillRect(140, 90 + r * 44, 160 + q() * 180, 18); }
  }, 512, 368, '#f4f7fb'), talk = talkTex('ward', '#07110a', GREEN);
  const scr = MX.map(() => new THREE.MeshBasicMaterial({map: calm})); MX.forEach((x, i) => monitor(root, x, 0.98, 0.3, 0.6, 0.42, scr[i], 0.32));
  for (const x of MX) box(root, 0.36, 0.02, 0.13, '#3a3f4a', x + 0.08, 0.99, 0.52);
  const nurses = XS.map((x, i) => actor(root, NURSE(i), {type: {expr: 'neutral', pose: 'type', mode: 'sit'}, hear: {expr: 'shock', pose: i ? 'panic' : 'desk', mode: 'sit'}, look: {expr: 'nervous', pose: 'think', mode: 'sit'}}, x, 0.44, -0.36, {scale: 1.05, res: 1.2}));
  const wave = MX.map(() => rings(root, 3));
  return {
    light: () => ({...LIGHT.cold, amb: 1.5}),
    tick: ({f, cam, shot}) => {
      const at = W(33) - 3, on = shot.v === 'claim' || f >= at;                                          // the screens turn on "voice"
      sign.visible = shot.v !== 'claim';                                                                 // in the close shot it would sit half under the line that says whose claim this is
      scr.forEach((m, i) => { m.map = on ? talk : calm; m.color.setScalar(on ? 1.15 + 0.2 * Math.sin(f * 0.8 + i) : 1); });
      MX.forEach((x, i) => wave[i](f + i * 7, on, [x + 0.07, 1.36, 0.36], shot.v === 'claim' ? 0.42 : 0.5, 0.32));
      nurses.forEach((n, i) => { n.show(!on ? 'type' : shot.v === 'claim' ? 'look' : 'hear'); n.node.position.y = 0.44 + hop(f, at + 1 + i * 3, 0.07, 8); n.tick(f, cam); });
    },
  };
};
export {pool, shake, lamp};
