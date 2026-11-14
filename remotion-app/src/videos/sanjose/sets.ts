// Sets of the shipwreck short: the battle of 1708, the wreck at 600 metres, the conservation lab, the chart table,
// the arbitration room, the altiplano and the lectern. Each builder fills a group once and returns a tick that poses it
// for a frame, so any frame can be rendered on its own.
import * as THREE from 'three';
import {backdrop, ball, beam, box, card, cone, cyl, floor, grp, hop, lamp, lerp, lit, mat, mesh, panel, pool, pop, rng, rod, rrect, smat, smooth, soft, tex, text, tiled, tileTex, tmat, torus, vgrad, woodTex, grainTex, type G2, type V} from './kit';
import {actor, CAPTAIN, COMMODORE, COUNSEL, CROWD, DECKHAND, MINISTER, OFFICIAL, PILOT, PRESIDENT, QHARA, SALVOR, SCIENTIST, WATCH} from './cast';
import {coin, coinStack, glints, lectern, sack, signTex, table} from './props';
import {W, type Shot} from './story';

export type Ctx = {f: number; t: number; cam: THREE.PerspectiveCamera; shot: Shot};
export type Light = {sky: string; ground: string; amb: number; key: string; keyI: number; from: V; span: number};
export type SetDef = {tick: (c: Ctx) => void; light: (v: string) => Light};
export type Builder = (root: THREE.Group) => SetDef;
export {type Light as LightDef};

export const LIGHT: Record<'dawn' | 'sun' | 'under' | 'lab' | 'paper' | 'room' | 'altiplano' | 'press', Light> = {
  dawn: {sky: '#ffcf9a', ground: '#4a5a7a', amb: 1.25, key: '#ffbe78', keyI: 1.5, from: [-9, 7, 8], span: 18},
  sun: {sky: '#ffe9c8', ground: '#8fa0b8', amb: 1.5, key: '#fff0d0', keyI: 1.7, from: [-8, 12, 10], span: 16},
  under: {sky: '#7fd0e8', ground: '#124a6a', amb: 1.15, key: '#cfeeff', keyI: 0.7, from: [-4, 10, 8], span: 10},
  lab: {sky: '#f2f6ff', ground: '#9aa4b4', amb: 1.55, key: '#ffffff', keyI: 1.15, from: [-4, 10, 8], span: 8},
  paper: {sky: '#fff3d8', ground: '#a89a86', amb: 1.5, key: '#fff4dc', keyI: 1.25, from: [-5, 10, 9], span: 9},
  room: {sky: '#ffe8c4', ground: '#6a5a52', amb: 1.2, key: '#ffd9a8', keyI: 1.05, from: [-5, 9, 8], span: 9},
  altiplano: {sky: '#cfe4ff', ground: '#b08a5a', amb: 1.45, key: '#fff0d0', keyI: 1.5, from: [-9, 13, 10], span: 18},
  press: {sky: '#dfe8f4', ground: '#8a8f9a', amb: 1.5, key: '#ffffff', keyI: 1.3, from: [-5, 11, 9], span: 9},
};

export const INK = '#15121c';
const op = (o: THREE.Mesh, k: number) => { (o.material as THREE.MeshBasicMaterial).opacity = k; };
const flagTex = (a: string, b: string, c: string) => tex('flag-' + a + b + c, 300, 200, (g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h / 2); g.fillStyle = b; g.fillRect(0, h / 2, w, h / 4); g.fillStyle = c; g.fillRect(0, (h * 3) / 4, w, h / 4);
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
});
const ensign = (c: string) => tex('ensign-' + c, 300, 200, (g, w, h) => {
  g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d9a8'; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 26, w, 26);
  g.strokeStyle = '#e8d9a8'; g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, 30); g.lineTo(w / 2, h - 30); g.stroke();
  g.beginPath(); g.moveTo(20, h / 2); g.lineTo(w - 20, h / 2); g.stroke();
});
function clothFlag(p: THREE.Group, t: THREE.Texture, x: number, y: number, z: number, h = 1.4) {
  rod(p, [x, y - h, z], [x, y, z], 0.02, '#7a6a52');
  return soft(panel(p, h * 1.4, h, smat(t, 1.0), x + h * 0.7, y - h / 2, z));
}

// ------------------------------------------------------------------ sea: 8 June 1708, the battle of Barú
function hull(p: THREE.Group, s: number, c: string, deck: string) {
  const g = grp(p, 0, 0, 0);
  box(g, 7.2 * s, 1.5 * s, 2.4 * s, c, 0, 0.75 * s, 0);
  box(g, 6.4 * s, 0.5 * s, 2.0 * s, c, 0, 1.62 * s, 0);
  box(g, 8.0 * s, 0.5 * s, 2.6 * s, deck, 0, 1.9 * s, 0);
  for (const sgn of [-1, 1]) box(g, 7.0 * s, 0.22 * s, 0.2 * s, '#c9a23a', 0, 1.42 * s, sgn * 1.2 * s);
  // gunports down both sides
  for (let i = 0; i < 7; i++) for (const sgn of [-1, 1]) box(g, 0.34 * s, 0.3 * s, 0.06 * s, '#15161b', (-2.6 + i * 0.86) * s, 1.0 * s, sgn * 1.22 * s);
  // the stern castle and its lantern
  box(g, 2.0 * s, 1.1 * s, 2.2 * s, c, -2.5 * s, 2.4 * s, 0); box(g, 2.2 * s, 0.16 * s, 2.4 * s, deck, -2.5 * s, 3.0 * s, 0);
  ball(g, 0.14 * s, lit('#ffe8b0', 1.6), -2.5 * s, 3.2 * s, 0);
  // three masts, yards and square sails
  const masts = [[-1.9, 6.2], [0.2, 7.4], [2.0, 5.6]] as const;
  for (const [mx, mh] of masts) {
    rod(g, [mx * s, 1.9 * s, 0], [mx * s, mh * s, 0], 0.075 * s, '#6a4a2a');
    for (let k = 0; k < 2; k++) {
      const y = (3.5 + k * 1.5) * s, w = (2.6 - k * 0.5) * s, hh = 1.3 * s;
      rod(g, [mx * s - w / 2, y + hh, 0], [mx * s + w / 2, y + hh, 0], 0.03 * s, '#6a4a2a');
      const sail = box(g, w, hh, 0.04 * s, '#f2e8d0', mx * s, y + hh / 2, 0.05 * s);
      sail.rotation.z = 0.02;
    }
  }
  return g;
}
export const sea: Builder = (root) => {
  backdrop(root, ['#ffcf9a', '#e88a52', '#7a4a5a']);
  const water = floor(root, 60, 60, tmat(tiled(tex('waves', 256, 256, (g, w, h) => {
    g.fillStyle = '#2f6a8a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a8aa8'; g.lineWidth = 5;
    for (let i = 0; i < 9; i++) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, 18 + i * 26 + 7 * Math.sin(x / 22 + i)); g.stroke(); }
  }, true), 8, 8)), 0, 0, -4);
  water.receiveShadow = true;
  const galleon = hull(root, 1, '#8a5a2a', '#c9a86a');
  const british = hull(root, 0.86, '#4a5a3a', '#c9a86a');
  british.position.set(11, 0, -7); british.rotation.y = -0.55;
  galleon.position.set(-1.4, 0, -1.2); galleon.rotation.y = 0.5;
  const galleon2 = galleon;   // the same ship, moved for the sinking
  // the smoke of a broadside: puffs that grow and fade
  const puffs = Array.from({length: 14}, (_, i) => soft(ball(root, 0.5, '#d8d2c8', 0, -5, 0)));
  // the magazine goes up: a cluster of fire, and a white-hot core
  const fire = Array.from({length: 7}, (_, i) => {
    const o = soft(ball(root, 0.4 + 0.1 * (i % 3), i % 2 ? '#ffb03a' : '#ff7a1a', 0, 0, 0));
    o.position.set(-0.6 + 0.45 * Math.cos(i * 1.9), 1.9 + 0.4 * Math.sin(i * 2.3), -0.7 + 0.4 * Math.sin(i * 1.7));
    return o;
  });
  const flash = soft(mesh(root, new THREE.SphereGeometry(0.34, 14, 10), new THREE.MeshBasicMaterial({color: '#fff0c0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending})));
  flash.position.set(-0.6, 2.0, -0.6);
  // the captain on his own deck, and the commodore on his
  const cap = actor(root, CAPTAIN, {a: {expr: 'stern', pose: 'point'}, b: {expr: 'shock', pose: 'both'}, c: {expr: 'pained', pose: 'cross'}}, 0, 2.1, 0.6, {scale: 0.94, res: 1.1});
  const com = actor(root, COMMODORE, {a: {expr: 'grin', pose: 'point'}, b: {expr: 'stern', pose: 'hold'}}, 0, 0, 0, {scale: 0.9, res: 0.9});
  com.node.visible = false;
  // the hold: chests, coins, emeralds
  const hold = grp(root, 0, 0, 0); hold.visible = false;
  const holdWall = box(hold, 9, 4.4, 0.4, '#3a2618', 0, 2.2, -2.6);
  floor(hold, 9, 7, tmat(tiled(woodTex('hold-deck', '#5a3a20', '#3a2414'), 4, 3)), 0, 0, 0);
  for (const [x, z, s] of [[-1.7, -1.4, 1], [-0.4, -1.8, 1.1], [1.3, -1.3, 0.95], [0.4, 0.2, 1.2], [-1.5, 0.4, 1.05]] as const) {
    const c = grp(hold, x, 0, z); box(c, 1.5 * s, 0.9 * s, 1.0 * s, '#7a4a24', 0, 0.45 * s, 0); box(c, 1.56 * s, 0.12 * s, 1.06 * s, '#c9a23a', 0, 0.93 * s, 0);
    coinStack(c, 0, 0.98 * s, 0, 5, 0.13); coinStack(c, 0.3 * s, 0.98 * s, 0.1, 3, 0.12);
  }
  const emeralds = Array.from({length: 9}, (_, i) => { const o = ball(hold, 0.07, lit('#2fc98a', 1.25), -2.4 + (i % 3) * 0.5, 0.06, 0.9 + Math.floor(i / 3) * 0.45); o.scale.y = 0.8; return o; });
  const holdLight = soft(panel(hold, 3.4, 2.2, new THREE.MeshBasicMaterial({color: '#ffcf8a', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending}), 0, 1.2, 2.2));
  return {
    light: (v) => (v === 'hold' ? {...LIGHT.dawn, amb: 0.9, keyI: 0.7, sky: '#8a5a3a', ground: '#2a1a12'} : LIGHT.dawn),
    tick: ({f, t, shot, cam}) => {
      const v = shot.v, u = smooth(t, 0, 60);
      const isHold = v === 'hold';
      hold.visible = isHold; galleon.visible = !isHold; british.visible = !isHold && v !== 'sink'; water.visible = !isHold;
      cap.node.visible = v === 'deck' || v === 'sink';
      if (!isHold) {
        galleon2.position.set(-1.4 + (v === 'sink' ? 0.4 * u : 0), v === 'sink' ? -0.5 * u : 0, -1.2 + (v === 'sink' ? 0.3 * u : 0));
        galleon2.rotation.z = v === 'sink' ? 0.36 * u : 0; galleon2.rotation.y = 0.5 + (v === 'sink' ? 0.1 * u : 0);
        british.position.set(11 - (v === 'battle' ? 2.2 * u : 0), 0, -7 + (v === 'battle' ? 0.6 * u : 0));
        // the broadside: smoke rolls off the British ship's side
        puffs.forEach((o, i) => {
          const s0 = v === 'battle' ? smooth(f, shot.at + i * 2, shot.at + i * 2 + 34) : 0;
          o.visible = s0 > 0.02;
          o.position.set(6.4 - i * 0.42 + 0.3 * Math.sin(i + f * 0.02), 1.3 + 0.22 * i, -6.2 + Math.sin(i * 1.7) * 0.5);
          o.scale.setScalar((0.5 + 0.5 * i / 14) * (0.4 + 1.7 * s0));
          op(o, 0.5 * s0 * (1 - 0.4 * s0));
        });
        const fl = v === 'fire' ? smooth(f, shot.at + 2, shot.at + 9) : 0;
        flash.visible = fl > 0.01; flash.scale.setScalar(0.6 + 0.5 * fl); op(flash, 0.9 * fl * (1 - 0.4 * fl));
        fire.forEach((o, i) => {
          const u = v === 'fire' ? smooth(f, shot.at + 2 + i * 2, shot.at + 12 + i * 3) : 0;
          o.visible = u > 0.02; o.scale.setScalar(0.35 + 1.35 * u); op(o, 0.9 * u * (1 - 0.55 * u));
        });
        cap.show(v === 'sink' ? (f > shot.at + 40 ? 'c' : 'b') : 'a');
        cap.node.position.set(-2.6, v === 'sink' ? 2.1 - 0.3 * u : 2.1, 0.8);
        cap.node.rotation.z = v === 'sink' ? 0.2 * u : 0; cap.tick(f, cam);
        com.tick(f, cam);
      } else {
        // the hold: the chests breathe a little with the sea
        hold.rotation.z = 0.012 * Math.sin(f * 0.08);
        emeralds.forEach((o, i) => { o.position.y = 0.06 + 0.01 * Math.sin(f * 0.1 + i); });
        op(holdLight, 0.14 + 0.03 * Math.sin(f * 0.07));
      }
    },
  };
};

// ------------------------------------------------------------------ deep: the wreck, 600 metres down
const siltTex = () => tex('silt', 512, 512, (g, w, h) => {
  g.fillStyle = '#0a2c3e'; g.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(190,220,235,${0.03 + r() * 0.05})`; const s = 1 + r() * 3; g.fillRect(r() * w, r() * h, s, s); }
});
export const deep: Builder = (root) => {
  backdrop(root, ['#1a6a8a', '#0d3f5a', '#061e30']);
  floor(root, 40, 30, tmat(tiled(grainTex('seafloor', '#7a8a86', 0.12), 8, 6)), 0, 0, -3);
  for (const [x, z, r] of [[-3.4, -2.2, 0.8], [3.1, -1.6, 0.6], [-1.6, 1.4, 0.5], [2.4, 1.8, 0.44]] as const) { const o = ball(root, r, '#3f5a5e', x, r * 0.22, z); o.scale.y = 0.5; }
  // her: the broken hull, a rib cage of frames, her stern half standing
  const wreck = grp(root, 0, 0, -1.2);
  box(wreck, 9.0, 0.6, 3.4, '#5a4a34', 0, 0.3, 0);
  for (let i = 0; i < 11; i++) {
    const x = -4.2 + i * 0.82, hh = 2.2 - Math.abs(i - 5) * 0.16;
    box(wreck, 0.20, hh, 0.22, '#6a5a40', x, 0.6 + hh / 2, -1.5);
    box(wreck, 0.20, hh, 0.22, '#6a5a40', x, 0.6 + hh / 2, 1.5);
    if (i % 2 === 0) box(wreck, 0.20, 0.2, 3.0, '#6a5a40', x, 0.6 + hh, 0);
  }
  box(wreck, 3.2, 2.6, 3.2, '#4a3a26', -4.4, 1.9, 0);       // the stern castle, standing
  for (let i = 0; i < 4; i++) cyl(wreck, 0.16, 0.22, '#4a3a26', 3.4 + i * 0.5, 0.35, -1.0 + i * 0.5);   // cannon, still in the silty row
  // the cannon that comes up, on its own, for the lift
  const cannon = grp(root, 1.2, 0.3, 0.4);
  {
    const c = cyl(cannon, 0.19, 1.5, '#3f5a44', 0, 0, 0, 0.15, 14); c.rotation.z = Math.PI / 2;
    cyl(cannon, 0.21, 0.12, '#3f5a44', 0.72, 0, 0, 0.21, 14).rotation.z = Math.PI / 2;
    ball(cannon, 0.15, '#3f5a44', -0.78, 0, 0);
  }
  // the coins on the seabed: a field of them, and they glint
  const coins = Array.from({length: 34}, (_, i) => { const o = coin(root, 0.07); o.rotation.x = -Math.PI / 2; o.position.set(-1.9 + (i % 9) * 0.42 + 0.05 * (i % 3), 0.02, 0.9 + Math.floor(i / 9) * 0.42 + 0.04 * (i % 4)); return o; });
  const shine = glints(root, [[-1.4, 0.14, 1.1], [0.5, 0.14, 1.3], [1.5, 0.14, 1.6], [-0.4, 0.14, 1.8]]);
  // the robot: a yellow box with lights and an arm
  const rov = grp(root, 0, 0, 0);
  {
    box(rov, 1.1, 0.7, 0.9, '#e8b93a', 0, 0, 0);
    box(rov, 1.2, 0.12, 1.0, '#2a2a30', 0, 0.4, 0);
    for (const [x, z] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) cyl(rov, 0.09, 0.3, '#2a2a30', x, 0.45, z);
    for (const s of [-1, 1]) { const l = cyl(rov, 0.06, 0.12, lit('#bfe8ff', 0.9), s * 0.44, -0.08, 0.5); l.rotation.x = Math.PI / 2; }
    const arm = grp(rov, 0.15, -0.1, 0.5);
    rod(arm, [0, 0, 0], [0.35, -0.36, 0.28], 0.06, '#8a8f96'); rod(arm, [0.35, -0.36, 0.28], [0.62, -0.62, 0.5], 0.05, '#8a8f96'); box(arm, 0.14, 0.1, 0.16, '#c9c2b4', 0.66, -0.66, 0.54);
  }
  rov.position.set(0, 5.2, 1.4);
  // two beams down from the surface, and the silt that hangs in the water
  beam(root, 0.5, 1.4, 14, '#e8ffff', 0.06, -2.2, 9, -1.0);
  beam(root, 0.5, 1.4, 14, '#e8ffff', 0.055, 1.6, 9, -0.6);
  const snow = Array.from({length: 26}, (_, i) => { const o = soft(ball(root, 0.02, '#dff4ff', 0, 0, 0)); o.userData.i = i; return o; });
  const cloud = Array.from({length: 14}, (_, i) => soft(ball(root, 0.9, '#b8ccd0', 0, 0, 0)));
  const cloudG = grp(root, 0, 0, 0);
  cloud.forEach((c, i) => { cloudG.add(c); c.userData.i = i; });
  cloudG.visible = false;
  return {
    light: (v) => (v === 'coins' ? {...LIGHT.under, amb: 1.5, keyI: 1.7, sky: '#9ad0e8'} : LIGHT.under),
    tick: ({f, t, shot, cam}) => {
      const v = shot.v, k = smooth(t, 0, 40);
      const silt = v === 'silt';
      coins.forEach((c) => (c.visible = v === 'coins'));
      cloudG.visible = silt;
      rov.visible = v === 'rov' || v === 'arm';
      cannon.visible = !silt;
      snow.forEach((o, i) => { const u = ((f * 0.0025 + i * 0.037) % 1); o.position.set(-5 + ((i * 37) % 90) / 10, 0.4 + u * 5.6, -3 + ((i * 17) % 40) / 10); o.visible = true; });
      shine(f, v === 'coins');
      if (v === 'rov') {
        rov.position.set(0.2 * Math.sin(f * 0.05), lerp(5.4, 1.9, k), lerp(2.2, 0.6, k));
        rov.rotation.y = 0.2 * Math.sin(f * 0.04);
      } else if (v === 'arm') {
        rov.position.set(0.6, lerp(2.4, 1.5, k), lerp(1.4, 0.9, k));
        cannon.position.set(lerp(1.2, 0.9, k), lerp(0.3, 0.9, smooth(t, 18, 50)), lerp(0.4, 0.9, k));
        cannon.rotation.z = lerp(0, -0.25, smooth(t, 18, 50));
      } else {
        rov.position.set(2.4, 4.2, 2.0);
      }
      if (silt) {
        cloud.forEach((c, i) => { const u = (f * 0.006 + i * 0.125) % 1; c.position.set(lerp(-2.4, 2.4, (i % 4) / 3) - 3.0 * u, 0.5 + u * 2.6, -1.8 + ((i * 13) % 20) / 10); c.scale.setScalar(0.15 + 3.4 * u); op(c, 0.16 * (1 - u) * Math.min(1, u / 0.25)); });
      }
    },
  };
};

// ------------------------------------------------------------------ lab: what came up
export const lab: Builder = (root) => {
  backdrop(root, ['#eef3fa', '#cfd9e6']);
  floor(root, 14, 12, tmat(tiled(tileTex('lab-floor', '#d8dee6', '#aab4c0'), 6, 6)));
  panel(root, 14, 5.2, tmat(tiled(tileTex('lab-wall', '#e8edf4', '#c3ccd8'), 8, 4)), 0, 2.6, -3.4);
  // the refrigerated container the cannon went into: a white box with its door open and mist coming out
  const cont = grp(root, -1.7, 0, -1.2);
  box(cont, 2.6, 2.2, 1.8, '#e8ecf0', 0, 1.1, 0);
  box(cont, 2.7, 0.16, 1.9, '#b9c2cc', 0, 2.2, 0);
  const door = grp(cont, 1.32, 0, 0.88); box(door, 0.08, 2.0, 1.7, '#c9d2dc', 0, 1.05, 0);
  const mouth = box(cont, 0.06, 1.9, 1.6, '#0d1620', 1.3, 1.05, 0);
  const mist = Array.from({length: 54 as number}, () => soft(ball(root, 0.16, '#ffffff', 0, -4, 0)));
  // the tank of salt water, with three coins in it
  const tank = grp(root, 1.4, 0, 0.6);
  box(tank, 1.7, 0.14, 1.2, '#c6ccd4', 0, 0.86, 0);
  for (const [x, z] of [[-0.8, -0.55], [0.8, -0.55], [-0.8, 0.55], [0.8, 0.55]]) box(tank, 0.08, 0.86, 0.08, '#8a929c', x, 0.43, z);
  soft(box(tank, 1.6, 0.7, 1.1, new THREE.MeshBasicMaterial({color: '#bfe4ef', transparent: true, opacity: 0.34, depthWrite: false}), 0, 1.2, 0));
  const tre = [0, 1, 2].map((i) => { const o = coin(tank, 0.11); o.rotation.set(-1.2, 0.4, 0.2 + i * 0.4); o.position.set(-0.3 + i * 0.3, 0.9 + 0.02 * i, 0.0); return o; });
  // two porcelain cups on a tray, under a lamp
  const tray = grp(root, 1.5, 0, -1.6);
  box(tray, 1.6, 0.06, 1.0, '#8a929c', 0, 0.9, 0);
  const cups = [0, 1].map((i) => {
    const c = grp(tray, -0.34 + i * 0.68, 0.93, 0);
    cyl(c, 0.17, 0.2, '#f4f6f8', 0, 0.1, 0, 0.2, 18); cyl(c, 0.2, 0.03, '#c9d2dc', 0, 0.21, 0, 0.2, 18);
    torus(c, 0.07, 0.02, '#f4f6f8', 0.2, 0.11, 0).rotation.y = Math.PI / 2;
    return c;
  });
  const lampo = soft(panel(root, 1.4, 1.4, new THREE.MeshBasicMaterial({color: '#fff4d8', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending}), 1.5, 1.5, -1.2));
  // the gun itself, on a wooden cradle, muzzle to the right
  const gun = grp(root, 0.25, 0, 0.55);
  {
    const b = cyl(gun, 0.2, 2.5, '#3f5a44', 0, 0.78, 0, 0.17, 16); b.rotation.z = Math.PI / 2;
    cyl(gun, 0.24, 0.24, '#3f5a44', 1.12, 0.78, 0, 0.23, 16).rotation.z = Math.PI / 2;
    ball(gun, 0.25, '#3f5a44', -1.3, 0.78, 0);
    box(gun, 1.5, 0.26, 0.44, '#7a5a34', 0, 0.32, -0.26); box(gun, 1.5, 0.26, 0.44, '#7a5a34', 0, 0.32, 0.26);
    for (const x of [-0.62, 0.62]) box(gun, 0.16, 0.34, 0.9, '#6a4a2c', x, 0.17, 0);
    soft(ball(gun, 0.045, lit('#bff0e8', 0.85), 0.3, 1.0, 0));
  }
  return {
    light: () => LIGHT.lab,
    tick: ({f, t, shot, cam}) => {
      const v = shot.v;
      cont.visible = v === 'cannon'; gun.visible = v === 'cannon'; tank.visible = v === 'coins'; tray.visible = v === 'cups' || v === 'crockery';
      door.rotation.y = -0.9 * smooth(t, 4, 22);
      mist.forEach((m, i) => {
        const u = ((f * 0.006 + i * 0.019) % 1); m.visible = v === 'cannon';
        m.position.set(-0.45 + 0.4 * Math.sin(i * 2.1), -0.05 + 0.6 * u, -1.0 + 0.3 * Math.sin(i * 1.3));
        m.scale.setScalar(0.5 + 1.1 * u); op(m, 0.34 * (1 - u) ** 1.5);
      });
      tre.forEach((o, i) => { o.position.y = 0.9 + 0.012 * Math.sin(f * 0.09 + i); o.rotation.y = 0.4 + i * 0.4 + 0.02 * Math.sin(f * 0.05); });
      cups.forEach((c, i) => { c.position.y = 0.93 + 0.001 * i; });
      op(lampo, 0.2 + 0.03 * Math.sin(f * 0.05));
      void t;
    },
  };
};

// ------------------------------------------------------------------ chart: the chart table, and what is written on it
const chartTex = () => tex('chart', 1024, 700, (g, w, h) => {
  g.fillStyle = '#e8dfc4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#cfd8c2'; g.fillRect(0, 0, w, h * 0.42);                       // the land
  g.fillStyle = '#8ab4c8'; g.fillRect(0, h * 0.42, w, h);                       // the sea
  g.strokeStyle = '#5a7a6a'; g.lineWidth = 4;
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, h * 0.42 + 26 + i * 34); g.bezierCurveTo(w * 0.3, h * 0.42 + 14 + i * 34, w * 0.6, h * 0.42 + 40 + i * 34, w, h * 0.42 + 20 + i * 34); g.stroke(); }
  g.fillStyle = '#f4f0e2'; g.beginPath(); g.moveTo(w * 0.55, h * 0.42); g.lineTo(w * 0.78, h * 0.42); g.lineTo(w * 0.7, h * 0.56); g.lineTo(w * 0.52, h * 0.54); g.closePath(); g.fill();   // the island of Barú
  g.strokeStyle = '#3a4a42'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#2a3a32'; text(g, 'CARTAGENA', w * 0.62, h * 0.36, 26, '#2a3a32', {font: 'Montserrat'}); text(g, 'ISLA BARÚ', w * 0.66, h * 0.5, 18, '#2a3a32', {font: 'Montserrat'});
  text(g, 'MAR CARIBE', w * 0.2, h * 0.62, 22, '#4a6a7a', {font: 'Montserrat'});
  // the compass rose
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.14, h * 0.8, 60, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.beginPath(); g.moveTo(w * 0.14, h * 0.8); g.lineTo(w * 0.14 + 58 * Math.cos(a), h * 0.8 + 58 * Math.sin(a)); g.stroke(); }
  text(g, 'N', w * 0.14, h * 0.8 - 78, 24, '#8a7a5a');
});
export const chart: Builder = (root) => {
  backdrop(root, ['#4a4236', '#2a2620']);
  floor(root, 12, 10, tmat(tiled(woodTex('chart-floor', '#6a4a2c', '#3a2818'), 4, 4)));
  // the room round the table: a panelled wall, so a view over the chart is not a void
  panel(root, 14, 5.0, tmat(tiled(woodTex('chart-wall', '#5a4a34', '#33281c'), 5, 4)), 0, 2.5, -3.6);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) box(root, 0.22, 5, 0.2, '#33281c', x, 2.5, -3.5);
  soft(panel(root, 1.6, 1.0, smat(signTex('chart-plate', 520, 320, '#e8dfc4', '#4a4236', [['MAR CARIBE', 52, 0.45], ['1708', 44, 0.8]], {font: 'Anton'}), 1.0), 0, 3.1, -3.5));
  const top = grp(root, 0, 0.92, -0.6);
  table(root, 0, 0, 7.2, 4.4, {h: 0.92, top: '#c9a86a', leg: '#5a3e28', skirt: '#8a6a44'});
  const map = soft(panel(top, 5.6, 3.8, smat(chartTex(), 1.0), 0, 0.02, 0));
  map.rotation.x = -Math.PI / 2;
  // the site: a red cross, and the black bars that hide the numbers
  const siteG = grp(top, 0.9, 0.04, -0.2);
  const cross = (g: THREE.Group, c: string) => { box(g, 0.5, 0.02, 0.07, c, 0, 0, 0); box(g, 0.07, 0.02, 0.5, c, 0, 0, 0); };
  cross(siteG, '#c0392b');
  const bars = [0, 1, 2].map((i) => box(top, 0.9, 0.03, 0.13, '#15161b', 0.9, 0.06, -0.9 + i * 0.22));
  const barsG = grp(top, 0, 0, 0); bars.forEach((b) => barsG.add(b));
  // the two crosses of the dispute, ten kilometres apart, with a bar between them
  const far = grp(top, -1.2, 0.04, 0.5); cross(far, '#3a6a9a');
  const rule = box(top, 1.5, 0.02, 0.05, '#3a3a42', -0.6, 0.05, 0.5); rule.visible = false;
  const ruleLabel = soft(panel(top, 1.2, 0.3, smat(signTex('tenk', 300, 90, '#f4f0e2', '#2a3a32', [['10 KM', 46]], {font: 'Anton'}), 1.0), -0.6, 0.07, 0.86));
  ruleLabel.rotation.x = -Math.PI / 2;
  // the 1984 decree, and the stamp that changes what a finder gets
  const decree = grp(top, 1.1, 0.05, 0.9);
  const paper = soft(panel(decree, 1.3, 0.85, smat(tex('decree', 620, 400, (g, w, h) => {
    g.fillStyle = '#f4f0e2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b9b09a'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#3a3a42'; for (let i = 0; i < 7; i++) g.fillRect(46, 60 + i * 40, 190 + ((i * 61) % 190), 12);
    text(g, 'DECRETO 1984', w - 46, 52, 26, '#8a2f2f', {font: 'Montserrat', align: 'right'});
  }), 1.0), 0, 0.02, 0));
  paper.rotation.x = -Math.PI / 2;
  const stamp = grp(top, 1.1, 0.08, 1.15);
  const stampPct = soft(panel(stamp, 0.9, 0.5, smat(signTex('pct5', 300, 180, '#c0392b', '#ffffff', [['5%', 110]], {font: 'Anton'}), 1.0), 0, 0.02, 0));
  stampPct.rotation.x = -Math.PI / 2;
  // a ledger of the estimates: two numbers and a range
  const board = grp(root, 0, 1.5, -2.2);
  board.visible = false;
  soft(panel(board, 2.9, 1.35, smat(signTex('est', 640, 300, '#15161b', '#ffe14a', [['ESTIMATED', 40, 0.26], ['$4B — $20B', 104, 0.78]], {font: 'Anton', border: '#ffe14a'}), 1.05), 0, 0, 0));
  return {
    light: (v) => (v === 'estimate' ? LIGHT.paper : LIGHT.paper),
    tick: ({f, t, shot, cam}) => {
      const v = shot.v, barsOn = v === 'secret';
      barsG.visible = barsOn;
      bars.forEach((b, i) => { b.visible = barsOn; b.position.y = 0.06; b.scale.x = pop(f, shot.at + 6 + i * 4, 8); });
      far.visible = v === 'tenk';
      rule.visible = v === 'tenk'; ruleLabel.visible = v === 'tenk';
      rule.scale.x = smooth(t, 6, 22);
      decree.visible = v === 'decree'; stamp.visible = v === 'decree' && f > shot.at + 22;
      stampPct.scale.setScalar(pop(f, shot.at + 22, 10));
      board.visible = v === 'estimate';
      siteG.visible = v === 'secret' || v === 'leak' || v === 'tenk';
      barsG.visible = v === 'secret';
      void f;
      void t;
    },
  };
};

// ------------------------------------------------------------------ court: the claims, on one long table at The Hague
export const court: Builder = (root) => {
  backdrop(root, ['#3a2c22', '#1e1712']);
  floor(root, 16, 12, tmat(tiled(woodTex('court-fl', '#6a4a30', '#3a2818'), 5, 5)));
  panel(root, 16, 6, tmat(tiled(woodTex('court-wall', '#7a5638', '#4a3220'), 4, 3)), 0, 3, -4.2);
  for (const x of [-5.4, -2.7, 0, 2.7, 5.4]) box(root, 0.24, 6, 0.24, '#3a2818', x, 3, -4.1);
  table(root, 0, -0.4, 8.2, 2.2, {h: 0.95, top: '#8a6444', leg: '#3a2818', skirt: '#6b4a30'});
  box(root, 8.4, 0.08, 2.4, '#3a2818', 0, 1.0, -0.4);
  // the flags over the table
  const flags = [clothFlag(root, flagTex('#f2c230', '#2f4a7a', '#c0392b'), -4.4, 5.0, -3.9, 1.5), clothFlag(root, flagTex('#c0392b', '#f2c230', '#c0392b'), -2.2, 5.0, -3.9, 1.5), clothFlag(root, flagTex('#2f4a7a', '#f4f6f8', '#2f4a7a'), 0, 5.0, -3.9, 1.5)];
  // a model of her, on a stand: the ship the case is about
  const model = grp(root, -3.6, 1.04, -0.2);
  box(model, 0.06, 0.5, 0.06, '#3a2818', 0, 0.25, 0); box(model, 1.3, 0.2, 0.5, '#8a6a44', 0, 0.6, 0);
  for (const x of [-0.4, 0, 0.4]) rod(model, [x, 0.6, 0], [x, 1.3, 0], 0.012, '#5a3e28');
  for (const x of [-0.4, 0, 0.4]) soft(panel(model, 0.3, 0.34, smat(tex('sail', 80, 90, (g, w, h) => { g.fillStyle = '#f2e8d0'; g.fillRect(0, 0, w, h); }), 1.0), x, 1.05, 0));
  // the wreath, for a war grave
  const wreath = grp(root, -1.0, 1.04, -0.1);
  torus(wreath, 0.3, 0.09, '#2f6a44', 0, 0.3, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) ball(wreath, 0.06, '#e8e2d2', 0.3 * Math.cos(i * 1.05), 0.3, 0.3 * Math.sin(i * 1.05));
  // the stack of the case, and a chart on the table
  for (let i = 0; i < 5; i++) box(root, 0.8, 0.06, 0.56, '#f4f0e2', 2.4 + (i % 2) * 0.04, 1.03 + i * 0.06, 0.1).rotation.y = 0.04 * i;
  // the people
  const min = actor(root, MINISTER, {a: {expr: 'neutral', pose: 'both'}, b: {expr: 'stern', pose: 'point'}}, 0, 0, 0, {scale: 1.0, res: 1.0});
  const salvor = actor(root, SALVOR, {a: {expr: 'grin', pose: 'hold', prop: 'paper'}, b: {expr: 'neutral', pose: 'shrug'}}, 1.9, 0, 0.2, {scale: 1.0, res: 1.0});
  const counsel = actor(root, COUNSEL, {a: {expr: 'stern', pose: 'both'}, b: {expr: 'neutral', pose: 'hold'}}, -1.9, 0, 0.2, {scale: 1.0, res: 1.0});
  const official = actor(root, OFFICIAL, {a: {expr: 'neutral', pose: 'cross'}, b: {expr: 'stern', pose: 'hold', prop: 'paper'}}, 3.7, 0, 0, {scale: 0.98, res: 0.9});
  [min, salvor, counsel, official].forEach((a) => { a.node.visible = false; });
  const four = [min, salvor, counsel, official];
  return {
    light: () => LIGHT.room,
    tick: ({f, t, shot, cam}) => {
      const v = shot.v;
      four.forEach((a) => (a.node.visible = false));
      model.visible = v === 'spain' || v === 'four'; wreath.visible = v === 'grave' || v === 'spain';
      if (v === 'spain' || v === 'grave') { counsel.node.visible = true; counsel.show(v === 'grave' ? 'b' : 'a'); counsel.tick(f, cam); }
      if (v === 'salvor') { salvor.node.visible = true; salvor.show('a'); salvor.tick(f, cam); }
      if (v === 'deny') { official.node.visible = true; official.show(f > shot.at + 24 ? 'b' : 'a'); official.tick(f, cam); }
      if (v === 'four') {
        min.node.visible = salvor.node.visible = counsel.node.visible = official.node.visible = true;
        min.node.position.set(-1.2, 0, 0.3); salvor.node.position.set(-0.4, 0, 0.3); counsel.node.position.set(0.4, 0, 0.3); official.node.position.set(1.2, 0, 0.3);
        min.show('a'); salvor.show('b'); counsel.show('a'); official.show('b');
        four.forEach((a) => a.tick(f, cam));
      }
      void t;
    },
  };
};

// ------------------------------------------------------------------ andes: the mountain the silver came out of
export const andes: Builder = (root) => {
  backdrop(root, ['#cfe4ff', '#a8c0e0', '#e8d8b8']);
  // the Cerro Rico: a red mountain with adits and a road
  const hillTex = tex('cerro', 1024, 512, (g, w, h) => {
    g.fillStyle = '#cfe4ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d8b8'; g.fillRect(0, h * 0.55, w, h);
    g.fillStyle = '#b06a4a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.18, h * 0.52); g.lineTo(w * 0.34, h * 0.34); g.lineTo(w * 0.52, h * 0.2);
    g.lineTo(w * 0.7, h * 0.4); g.lineTo(w * 0.86, h * 0.5); g.lineTo(w, h); g.closePath(); g.fill();
    g.fillStyle = '#8a4a34'; for (let i = 0; i < 16; i++) { const x = 120 + i * 52, y = 300 + (i % 3) * 40; g.fillRect(x, y, 26, 20); }
    g.strokeStyle = '#d8c8a8'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.08, h); g.lineTo(w * 0.4, h * 0.42); g.stroke();
  });
  soft(panel(root, 24, 10.5, smat(hillTex, 1.0), 0, 4.3, -12));
  floor(root, 30, 24, tmat(tiled(grainTex('altiplano', '#c9a86a', 0.12), 6, 5)));
  // a stone wall, a llama's worth of scrub, and the mine's headframe
  for (let i = 0; i < 7; i++) box(root, 1.1, 0.6, 0.5, '#a89a86', -6 + i * 1.05, 0.3, -3.2);
  const head = grp(root, 4.6, 0, -4.4);
  for (const s of [-1, 1]) rod(head, [s * 0.7, 0, 0], [0, 2.6, 0], 0.07, '#5a4a38');
  box(head, 1.7, 0.16, 0.16, '#5a4a38', 0, 2.6, 0); cyl(head, 0.28, 0.12, '#3a3a42', 0, 2.45, 0, 0.28, 14);
  // the claim on the cloth: a silver bar and coins on a woven blanket
  const cloth = grp(root, 0, 0.02, 0.4); cloth.visible = false;
  const weave = tex('weave', 512, 400, (g, w, h) => {
    g.fillStyle = '#a8322f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#e8b93a' : '#2f4a6a'; for (let x = 0; x < w; x += 40) g.fillRect(x + (i % 2) * 20, i * 44, 22, 34); }
  });
  soft(panel(cloth, 3.6, 2.6, tmat(weave), 0, 0.03, 0));
  const clothPanel = cloth.children[0] as THREE.Mesh; clothPanel.rotation.x = -Math.PI / 2;
  const ingot = box(cloth, 0.9, 0.22, 0.4, '#cfd6dd', -0.5, 0.14, 0);
  for (let i = 0; i < 6; i++) { const o = coin(cloth, 0.1); o.rotation.x = -Math.PI / 2; o.position.set(0.5 + (i % 3) * 0.28, 0.03, -0.2 + Math.floor(i / 3) * 0.3); }
  const woman = actor(root, QHARA, {a: {expr: 'stern', pose: 'both'}, b: {expr: 'pained', pose: 'cross'}}, 0.1, 0, 1.4, {scale: 1.04, res: 0.9});
  const miner = actor(root, CROWD(2), {a: {expr: 'neutral', pose: 'hold'}, b: {expr: 'pained', pose: 'cross'}}, -1.35, 0, -2.3, {scale: 0.9, res: 0.5});
  return {
    light: () => LIGHT.altiplano,
    tick: ({f, shot, cam}) => {
      const v = shot.v;
      cloth.visible = v === 'claim';
      woman.node.visible = v === 'claim'; woman.show(f > shot.at + 24 ? 'b' : 'a'); woman.tick(f, cam);
      miner.node.visible = v === 'mountain'; miner.tick(f, cam);
      ingot.position.y = 0.14;
      void f;
    },
  };
};

// ------------------------------------------------------------------ press: the lectern, the announcement
export const press: Builder = (root) => {
  backdrop(root, ['#e8eef6', '#b9c4d2']);
  floor(root, 14, 12, tmat(tiled(tileTex('press-fl', '#d8d2c4', '#b0a898'), 6, 6)));
  // a wall of the ministry, with the flag and the two shields
  panel(root, 14, 5.4, tmat(tiled(tileTex('press-wall', '#ede7da', '#cfc6b4'), 8, 4)), 0, 2.7, -3.6);
  clothFlag(root, flagTex('#f2c230', '#2f4a7a', '#c0392b'), -3.2, 4.2, -3.4, 1.5);
  soft(panel(root, 1.5, 0.75, smat(signTex('min', 640, 320, '#2f4a7a', '#ffffff', [['MINISTERIO', 54, 0.36], ['DE CULTURA', 54, 0.74]], {font: 'Anton'}), 1.0), -2.3, 3.7, -3.5));
  const lect = grp(root, 0, 0, -0.4);
  soft(panel(lect, 0.44, 0.25, smat(signTex('sello', 480, 270, '#f4f0e2', '#2f4a7a', [['SAN JOSÉ', 66, 0.4], ['1708', 54, 0.82]], {font: 'Anton'}), 1.0), 0, 0.55, 0.32));
  box(lect, 1.0, 1.05, 0.6, '#8a6a44', 0, 0.52, 0);
  box(lect, 1.1, 0.07, 0.7, '#c9a86a', 0, 1.06, 0);
  // the model cannon and a cup, on the lectern: what came up
  const can = grp(lect, -0.28, 1.1, 0.05);
  const barrel = cyl(can, 0.07, 0.5, '#3f5a44', 0, 0.04, 0, 0.055, 12); barrel.rotation.z = Math.PI / 2;
  cyl(can, 0.1, 0.12, '#3f5a44', 0.26, 0.04, 0, 0.1, 14).rotation.z = Math.PI / 2;
  const cup = grp(lect, 0.28, 1.1, 0.05); cyl(cup, 0.09, 0.12, '#f4f6f8', 0, 0.06, 0, 0.11, 16); cyl(cup, 0.11, 0.02, '#c9d2dc', 0, 0.12, 0, 0.11, 16);
  // the press: blank heads with cameras
  const pressC = Array.from({length: 5}, (_, i) => actor(root, CROWD(i), {a: {expr: 'neutral', pose: 'hold'}}, -3.5 + i * 1.6, 0, 3.4 + (i % 2) * 0.5, {scale: 0.9, res: 0.45}));
  const mina = actor(root, MINISTER, {a: {expr: 'neutral', pose: 'both'}, b: {expr: 'stern', pose: 'point'}}, 0, 0, -1.2, {scale: 1.02, res: 1.0});
  const pres = actor(root, PRESIDENT, {a: {expr: 'stern', pose: 'point'}, b: {expr: 'neutral', pose: 'both'}}, 0, 0, -1.15, {scale: 1.04, res: 1.0});
  const bulbs = [0, 1, 2, 3].map((k) => soft(panel(root, 0.5, 0.5, new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}), -2.6 + k * 1.7, 2.5, 1.9)));
  return {
    light: () => LIGHT.press,
    tick: ({f, shot, cam}) => {
      const v = shot.v;
      const flashes = [0, 1, 2, 3];
      mina.node.visible = v === 'science'; pres.node.visible = v === 'petro';
      if (v === 'science') mina.tick(f, cam); else pres.tick(f, cam);
      pressC.forEach((p, i) => { p.node.visible = i < 3 || v === 'petro'; p.tick(f, cam); });
      // a flash bulb going off, now and then
      flashes.forEach((k, i) => { const on = ((f + k * 17) % 53) < 3; op(bulbs[i], on ? 0.32 : 0); });
    },
  };
};
