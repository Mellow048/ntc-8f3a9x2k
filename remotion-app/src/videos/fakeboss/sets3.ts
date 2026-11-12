// Sets of the fake boss short, part 3: where the money came from (a hospital, a pet food plant), where it went (nine
// countries, then crypto), the launderette, and the bank whose back office said no.
import * as THREE from 'three';
import {backdrop, ball, box, clamp01, cone, cyl, floor, foldTex, grainTex, grp, hop, lamp, lerp, lit, panel, pool, pop, rng, rod, rrect, shake, slab, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus,
  type V} from './kit';
import {actor, DEFENDANT, STAFF} from './cast';
import {bundle, bundleStream, coinStack, coinStream, halo, level, palm, signTex, skylineTex, streetLamp} from './props';
import {INK, LIGHT, label, tickTex, type Builder} from './sets';
import {W} from './story';

/** the state, on a road sign */
const roadSign = (p: THREE.Group, name: string, x: number, z: number) => {
  for (const s of [-1, 1]) cyl(p, 0.03, 1.5, '#8a94a3', x + s * 0.36, 0.75, z);
  panel(p, 1.0, 0.34, smat(signTex('state-' + name, 500, 170, '#2f7a4a', '#ffffff', [[name, 116, 0.56]], {border: '#ffffff'}), 1), x, 1.36, z + 0.04);
};
const tree = (p: THREE.Group, x: number, z: number, s = 1) => { cyl(p, 0.07 * s, 0.8 * s, '#7a5c3e', x, 0.4 * s, z); ball(p, 0.5 * s, '#4f9a5a', x, 1.1 * s, z); ball(p, 0.36 * s, '#5fae68', x + 0.26 * s, 0.95 * s, z + 0.1); };

// ------------------------------------------------------------------ a hospital system in Missouri
export const hospital: Builder = (root) => {
  backdrop(root, ['#6fb4ee', '#e4f3ff']);
  floor(root, 34, 26, tmat(tiled(grainTex('lawn', '#7fb86a', 0.08), 9, 7)));
  floor(root, 1.5, 9, '#c3c8d2', 0.01, 0, 3.6);
  const win = tex('hosp-win', 128, 128, (g) => {
    g.fillStyle = '#f6f3ec'; g.fillRect(0, 0, 128, 128);
    for (const x of [16, 72]) { g.fillStyle = '#9fc7e6'; g.fillRect(x, 26, 40, 62); g.strokeStyle = '#c9c2b4'; g.lineWidth = 5; g.strokeRect(x, 26, 40, 62); }
  }, true);
  box(root, 2.5, 2.25, 1.4, tmat(tiled(win, 4, 3)), 0, 1.125, -1.7); box(root, 2.62, 0.12, 1.5, '#d9d2c4', 0, 2.31, -1.7);
  for (const s of [-1, 1]) { box(root, 1.5, 1.5, 1.2, tmat(tiled(win, 2, 2)), s * 1.95, 0.75, -1.8); box(root, 1.6, 0.1, 1.3, '#d9d2c4', s * 1.95, 1.55, -1.8); }
  box(root, 1.1, 0.08, 0.72, '#3f8fd0', 0, 1.0, -0.66); for (const s of [-1, 1]) cyl(root, 0.035, 1.0, '#c9ced6', s * 0.48, 0.5, -0.36);
  box(root, 0.72, 0.92, 0.04, '#2b3a55', 0, 0.46, -0.985); box(root, 0.02, 0.92, 0.05, '#c9ced6', 0, 0.46, -0.98);
  // a white H on blue (not a red cross: that sign is protected)
  box(root, 0.62, 0.62, 0.06, '#f6f3ec', 0, 1.62, -0.98); panel(root, 0.54, 0.54, smat(signTex('hosp-h', 128, 128, '#2f6fd0', '#ffffff', [['H', 112, 0.56]]), 1.05), 0, 1.62, -0.945);
  roadSign(root, 'MISSOURI', -0.74, 0.3);
  tree(root, 1.3, -0.3, 1.0); tree(root, -2.3, -0.9, 1.2); tree(root, 2.5, -0.7, 0.9);
  const fly = bundleStream(root, 9, 0.9);
  return {
    light: () => LIGHT.day,
    tick: ({f, shot}) => { if (shot.v === 'sent') fly.set(f, W(121) - 4, shot.at + 400, () => [0, 1.0, -0.8], [0.9, 3.6, 0.1], (i) => [2.7, 2.2 + 0.25 * (i % 3), 0.7], 0.034); else fly.hide(); },
  };
};

// ------------------------------------------------------------------ a pet food company in Florida
const dogTex = (up: boolean) => tex('dog-' + up, 320, 320, (g) => {
  const fur = '#c98a4a', dark = '#7a4a22', pale = '#f3e3c8';
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(98, 252); g.quadraticCurveTo(38, 236, 50, 178); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = fur; g.stroke();   // tail
  g.lineWidth = 9; g.strokeStyle = INK; g.fillStyle = fur;
  g.beginPath(); g.moveTo(112, 296); g.bezierCurveTo(66, 296, 78, 190, 150, 172); g.bezierCurveTo(218, 166, 244, 232, 234, 296); g.closePath(); g.fill(); g.stroke();              // sitting: a pear
  g.fillStyle = pale; g.beginPath(); g.ellipse(180, 246, 30, 40, 0, 0, 7); g.fill();
  for (const x of [152, 206]) { g.fillStyle = fur; rrect(g, x - 14, 236, 28, 62, 12); g.fill(); g.stroke(); }
  g.strokeStyle = '#e3342f'; g.lineWidth = 14; g.beginPath(); g.moveTo(148, 190); g.quadraticCurveTo(186, 206, 224, 188); g.stroke();                                           // collar
  g.save(); g.translate(186, 146); g.rotate(up ? -0.5 : 0.06); g.strokeStyle = INK; g.lineWidth = 9;
  for (const s of [-1, 1]) { g.fillStyle = dark; g.beginPath(); g.ellipse(s * 54, up ? 0 : 8, 20, 40, s * (up ? 1.0 : 0.3), 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = fur; g.beginPath(); g.ellipse(0, 0, 58, 52, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = pale; g.beginPath(); g.ellipse(14, 22, 32, 23, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.ellipse(28, 10, 11, 8.5, 0, 0, 7); g.fill();
  for (const x of [-20, 14]) { g.beginPath(); g.arc(x, -14, 7, 0, 7); g.fill(); }
  if (up) { g.lineWidth = 6; g.beginPath(); g.moveTo(-34, -30); g.lineTo(-14, -36); g.moveTo(8, -36); g.lineTo(28, -30); g.stroke(); }                                           // worried
  g.restore();
});
const paw = (g: CanvasRenderingContext2D, x: number, y: number, s: number, c: string) => {
  g.fillStyle = c; g.beginPath(); g.ellipse(x, y + s * 0.22, s * 0.42, s * 0.34, 0, 0, 7); g.fill();
  for (const [dx, dy] of [[-0.46, -0.14], [-0.17, -0.42], [0.17, -0.42], [0.46, -0.14]]) { g.beginPath(); g.ellipse(x + dx * s, y + dy * s, s * 0.15, s * 0.19, 0, 0, 7); g.fill(); }
};
export const petfood: Builder = (root) => {
  backdrop(root, ['#3fa8ee', '#ffe9c8']);
  floor(root, 34, 26, tmat(tiled(grainTex('sand', '#e9d6aa', 0.08), 9, 7)));
  box(root, 3.3, 1.75, 1.5, tmat(tiled(foldTex('shed', '#f4f1e8', '#cfc8b8', 12), 2, 1)), 0, 0.875, -1.8); box(root, 3.4, 0.16, 1.6, '#e8590c', 0, 1.83, -1.8);
  box(root, 1.0, 1.15, 0.05, '#7f8796', -0.85, 0.575, -1.03); for (let i = 1; i < 6; i++) box(root, 1.0, 0.02, 0.06, '#5b6170', -0.85, i * 0.19, -1.02);                 // loading door
  // the sign on the roof: a bag of kibble
  soft(panel(root, 1.0, 1.25, smat(tex('kibble-bag', 320, 400, (g, w, h) => {
    g.lineJoin = 'round'; g.fillStyle = '#e8590c'; g.strokeStyle = INK; g.lineWidth = 10;
    g.beginPath(); g.moveTo(40, 30); g.lineTo(w - 40, 30); g.lineTo(w - 22, h - 14); g.lineTo(22, h - 14); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd43b'; g.fillRect(36, 30, w - 72, 44); g.strokeRect(36, 30, w - 72, 44);
    paw(g, w / 2, 168, 110, '#fff6dc'); text(g, 'PET FOOD', w / 2, 316, 74, '#ffffff', {stroke: INK, sw: 12, maxWidth: w - 60});
  }), 1, true), -0.6, 2.5, -1.5));
  for (const s of [-1, 1]) rod(root, [-0.6 + s * 0.3, 1.9, -1.52], [-0.6 + s * 0.3, 2.1, -1.52], 0.03, '#8a94a3');
  palm(root, 1.5, -0.9, 3.0, -0.3, 0.9);
  const road = grp(root); roadSign(road, 'FLORIDA', -0.74, 0.3);
  // the dog, and the bowl
  const sit = new THREE.MeshBasicMaterial({map: dogTex(false), transparent: true, alphaTest: 0.4}), upM = new THREE.MeshBasicMaterial({map: dogTex(true), transparent: true, alphaTest: 0.4});
  // a pallet of the product, with the dog on top of it
  const sack = tex('sack', 256, 96, (g, w, h) => {
    g.fillStyle = '#e8590c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd43b'; g.fillRect(0, 0, 44, h); paw(g, 150, 52, 62, '#fff6dc');
    g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(0, 0, w, h);
  });
  const sackM = tmat(sack), topM = new THREE.MeshLambertMaterial({color: '#e8590c'}), SH = 0.26, TOP = 0.1 + 2 * SH, PX = 0.3, PZ = 0.55;
  box(root, 2.1, 0.1, 1.0, '#a8824e', PX, 0.05, PZ);
  for (let lay = 0; lay < 2; lay++) for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.66, SH - 0.012, 0.9), [topM, topM, topM, topM, sackM, sackM]);
    m.position.set(PX + (i - 1) * 0.68 + (lay ? 0.03 : -0.02), 0.1 + SH * (lay + 0.5), PZ + (lay ? -0.02 : 0.02)); m.castShadow = true; m.receiveShadow = true; root.add(m);
  }
  const DX = PX - 0.3, DY = TOP + 0.5, dog = soft(panel(root, 1.08, 1.08, sit, DX, DY, PZ + 0.1)); pool(root, 0.42, '#000000', 0.3, DX, PZ + 0.1, TOP + 0.006, false).scale.set(1, 0.5, 1);
  const BX = PX + 0.62; cyl(root, 0.2, 0.11, '#e3342f', BX, TOP + 0.055, PZ + 0.2, 0.155); cyl(root, 0.125, 0.01, '#5a1a16', BX, TOP + 0.112, PZ + 0.2);
  for (const [x, z] of [[BX + 0.26, PZ + 0.36], [BX - 0.3, PZ + 0.4]]) ball(root, 0.03, '#8a5a36', x, TOP + 0.03, z);
  const fly = bundleStream(root, 9, 0.9);
  return {
    light: () => ({...LIGHT.day, sky: '#fff0d0', key: '#ffe6b8'}),
    tick: ({f, shot}) => {
      const gone = shot.v === 'bowl', at = W(132) - 2;
      road.visible = !gone;                                                                             // in the close shot it would be half a word at the edge
      dog.material = gone && f >= at + 5 ? upM : sit; dog.position.y = DY + (gone ? hop(f, at + 5, 0.07, 8) : 0); dog.rotation.z = 0.02 * Math.sin(f * 0.11);
      if (gone) fly.set(f, at - 6, shot.at + 400, () => [-0.85, 0.8, -1.0], [0.3, 3.3, -0.2], (i) => [2.8, 2.5 + 0.2 * (i % 3), 0.4], 0.036); else fly.hide();
    },
  };
};

// ------------------------------------------------------------------ accounts in nine countries
const COUNTRIES = ['UNITED STATES', 'SPAIN', 'PORTUGAL', 'GREECE', 'U.A.E.', 'SINGAPORE', 'AUSTRIA', 'SLOVAKIA', 'CHINA'];   // the order of the indictment
export const board: Builder = (root) => {
  backdrop(root, ['#0c1020', '#1f2a4a']);
  floor(root, 14, 12, tmat(tiled(tileTex('board-floor', '#3a4460', '#2a3350', 2, '#434f6e'), 7, 6)));
  box(root, 9, 5.6, 0.3, '#28324e', 0, 2.8, -1.2);
  const cells = COUNTRIES.map((name, i) => {
    const x = (i % 3 - 1) * 0.78, y = 2.06 - Math.floor(i / 3) * 0.58, g = grp(root, x, y, -0.9);
    box(g, 0.7, 0.4, 0.3, '#44506e', 0, 0, 0); const hole = lamp('#10182c', 1); panel(g, 0.6, 0.3, hole, 0, 0, 0.152);
    const tag = new THREE.MeshBasicMaterial({map: tex('country-' + i, 350, 74, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); text(c, name, w / 2, h / 2 + 3, 54, INK, {maxWidth: w - 26}); })});
    panel(g, 0.7, 0.148, tag, 0, -0.284, 0.14);
    const b = bundle(g, 0.95); b.position.set(0, -0.09, 0.2); b.rotation.y = 0.2;
    const flyer = bundle(root, 0.95, true);
    return {x, y, hole, tag, b, flyer, at: W(137) + 3 + Math.round(i * 6.1)};
  });
  return {
    light: () => ({...LIGHT.show, amb: 1.2}),
    tick: ({f}) => cells.forEach((c, i) => {
      const u = clamp01((f - (c.at - 9)) / 9), hit = f >= c.at;
      c.flyer.visible = u > 0 && u < 1;
      c.flyer.position.set(lerp(i % 2 ? 2.2 : -2.2, c.x, u), lerp(0.5, c.y - 0.09, u) + 1.1 * Math.sin(Math.PI * u), lerp(1.4, -0.7, u)); c.flyer.rotation.set(f * 0.3, f * 0.2 + i, 0);
      c.b.visible = hit; c.b.scale.setScalar(0.95 * (hit ? pop(f, c.at, 6) : 1));
      c.hole.color.set(hit ? '#ffe9a8' : '#10182c'); c.tag.color.set(hit ? '#ffe14a' : '#8f98ad');
    }),
  };
};

// ------------------------------------------------------------------ then into crypto
export const crypto: Builder = (root) => {
  backdrop(root, ['#0a0c16', '#1a1630']);
  floor(root, 14, 12, tmat(tiled(grainTex('crypto-floor', '#1c1f30', 0.12), 5, 4)));
  const MX = -0.3, m = grp(root, MX, -0.2, -0.4);
  for (const [x, z] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) box(m, 0.08, 0.9, 0.08, '#2b3046', x, 0.45, z);
  box(m, 1.1, 0.8, 0.8, '#4a5682', 0, 1.3, 0); box(m, 1.16, 0.06, 0.86, '#2b3046', 0, 0.9, 0); box(m, 1.16, 0.06, 0.86, '#2b3046', 0, 1.7, 0);
  cyl(m, 0.2, 0.46, '#6a78a8', 0, 1.96, 0, 0.62); torus(m, 0.62, 0.03, '#2b3046', 0, 2.19, 0).rotation.x = Math.PI / 2;
  // what it does, without a word: dollars in, coins out
  panel(m, 0.86, 0.5, smat(tex('crypto-front', 430, 250, (g, w, h) => {
    g.fillStyle = '#10182c'; g.fillRect(0, 0, w, h); g.fillStyle = '#62b77e'; rrect(g, 28, 70, 120, 110, 12); g.fill(); text(g, '$', 88, 130, 96, '#10182c');
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(176, 108); g.lineTo(224, 108); g.lineTo(224, 84); g.lineTo(270, 125); g.lineTo(224, 166); g.lineTo(224, 142); g.lineTo(176, 142); g.closePath(); g.fill();
    g.fillStyle = '#f2c230'; g.beginPath(); g.arc(344, 125, 58, 0, 7); g.fill(); g.strokeStyle = '#b07f0a'; g.lineWidth = 8; g.beginPath(); g.arc(344, 125, 42, 0, 7); g.stroke();
    g.fillStyle = '#b07f0a'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 9 : 27; g.lineTo(344 + r * Math.cos(a), 125 + r * Math.sin(a)); } g.closePath(); g.fill();
  }), 1.1), 0, 1.3, 0.405);
  const chute = box(m, 0.5, 0.05, 0.3, '#6a78a8', 0.74, 1.12, 0.1); chute.rotation.z = -0.5;
  box(root, 0.9, 0.7, 0.5, '#2b3046', 0.9, 0.35, -0.25);                                                 // where the coins pile up
  const piles = [0.66, 0.9, 1.14].map((x, i) => coinStack(root, x, 0.7, -0.25 + (i % 2) * 0.08, 14 + i * 3, 0.11));
  const lampM = lamp('#35e0d0', 1.4); soft(panel(m, 0.1, 0.1, lampM, -0.45, 1.62, 0.41));
  const notes = bundleStream(root, 8, 0.9), coins = coinStream(root, 12, 0.1);
  halo(root, 1.6, '#f2c230', 0.16, 0.9, 1.1, -0.7);
  return {
    light: () => ({...LIGHT.dark, sky: '#c9c6ff', amb: 1.45, keyI: 1.0}),
    tick: ({f, shot}) => {
      notes.set(f, shot.at - 30, shot.at + 400, (i) => [-2.4, 2.2 + 0.3 * (i % 3), 0.4], [-1.0, 3.2, -0.2], () => [MX, 1.85, -0.4], 0.05);
      const k = 0.25 + 0.75 * smooth(f, shot.at, shot.at + 34);
      piles.forEach((p, i) => level(p, Math.min(1, k * (1.15 - i * 0.12))));
      coins.set(f, shot.at - 20, shot.at + 400, () => [MX + 0.92, 0.82, -0.3], [0.8, 1.9, -0.2], (i) => [0.66 + 0.24 * (i % 3), 0.75 + 0.5 * k, -0.25], 0.06);
      m.position.x = MX + 0.008 * Math.sin(f * 1.3); lampM.color.set('#35e0d0').multiplyScalar(1.1 + 0.5 * Math.abs(Math.sin(f * 0.3)));
    },
  };
};

// ------------------------------------------------------------------ the launderette: the boast, taken literally
export const laundry: Builder = (root) => {
  backdrop(root, ['#1a2a3a', '#2f4a5f']);
  floor(root, 14, 12, tmat(tiled(tileTex('laundry', '#eef3f5', '#b9c4cc', 4, '#a8d8dc'), 6, 5)));
  box(root, 9, 5.6, 0.3, '#8fd0c8', 0, 2.8, -1.75);
  const spin = new THREE.MeshBasicMaterial({map: tex('wash', 256, 256, (g) => {
    g.fillStyle = '#2f6fa8'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    const q = rng(7); for (let i = 0; i < 6; i++) { g.save(); g.translate(128 + (q() - 0.5) * 130, 128 + (q() - 0.5) * 130); g.rotate(q() * 6); g.fillStyle = '#62b77e'; g.strokeStyle = '#2f7a4a'; g.lineWidth = 5; g.fillRect(-42, -20, 84, 40); g.strokeRect(-42, -20, 84, 40); text(g, '$', 0, 2, 34, '#2f7a4a'); g.restore(); }
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(128 + (q() - 0.5) * 200, 128 + (q() - 0.5) * 200, 4 + q() * 9, 0, 7); g.fill(); }
  }), transparent: true, alphaTest: 0.3});
  const doors: THREE.Mesh[] = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const x = -0.92 + col * 0.92, y = 0.5 + row * 1.0, z = -1.2;
    box(root, 0.88, 0.96, 0.7, row ? '#f6f4ee' : '#e9edf0', x, y, z); box(root, 0.8, 0.1, 0.02, '#c3ccd6', x, y + 0.4, z + 0.36);
    for (const dx of [-0.3, -0.22]) cyl(root, 0.022, 0.03, '#3f8fd0', x + dx, y + 0.4, z + 0.37).rotation.x = Math.PI / 2;
    torus(root, 0.27, 0.045, '#8a94a3', x, y - 0.05, z + 0.36); doors.push(soft(panel(root, 0.5, 0.5, spin, x, y - 0.05, z + 0.362)));
  }
  box(root, 2.9, 0.06, 0.8, '#c3ccd6', 0, 2.03, -1.2);
  const who = actor(root, DEFENDANT(1), {hips: {pose: 'hips'}, cup: {pose: 'hold', prop: 'trophy'}}, 0.42, 0, -0.2, {scale: 1.05, res: 1.2});
  return {
    light: () => ({...LIGHT.cold, amb: 1.5}),
    tick: ({f, cam, shot}) => {
      doors.forEach((d, i) => { d.rotation.z = -f * 0.21 - i * 1.1; });
      const cup = shot.v === 'quote' && f >= W(172) - 3;
      who.show(cup ? 'cup' : 'hips'); who.node.visible = shot.v !== 'spin'; who.node.position.y = cup ? hop(f, W(172) - 3, 0.09, 8) : 0; who.tick(f, cam);
    },
  };
};

// ------------------------------------------------------------------ a New York investment bank, from the street
export const bank: Builder = (root) => {
  backdrop(root, ['#2a2f5a', '#f0a070']);
  floor(root, 34, 26, tmat(tiled(grainTex('street', '#3a3f4c', 0.1), 9, 7)));
  panel(root, 20, 9, smat(skylineTex('ny', '#2a2f5a', '#f0a070', '#1d2140', '#ffd98a', 31), 1), 0, 4.5, -7);
  const q = rng(13), win = (i: number) => tex('ny-win-' + i, 128, 256, (g, w, h) => { g.fillStyle = ['#2b3156', '#30365e', '#262c4e'][i]; g.fillRect(0, 0, w, h); const r = rng(3 + i); for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) { g.fillStyle = r() < 0.5 ? '#ffd98a' : '#3d4470'; g.fillRect(x * 32 + 8, y * 25.6 + 6, 17, 14); } });
  for (const [x, z, hh, i] of [[-2.2, -3.2, 5.2, 0], [2.3, -3.4, 6.0, 1], [-3.6, -4.4, 6.8, 2], [3.8, -4.6, 5.0, 0], [-0.9, -5.0, 7.2, 1], [1.0, -5.2, 6.4, 2]] as const) box(root, 1.5 + q() * 0.4, hh, 1.4, tmat(win(i)), x, hh / 2, z);
  // stone, columns, a pediment: nobody's building
  const stone = '#ded7c8';
  box(root, 3.1, 0.12, 1.1, '#c9c2b4', 0, 0.06, -0.85); box(root, 2.8, 0.12, 0.9, stone, 0, 0.18, -0.95);
  box(root, 2.5, 2.0, 1.3, '#cfc8b8', 0, 1.24, -1.95); box(root, 0.66, 1.05, 0.05, '#3a2c1e', 0, 0.765, -1.29);
  for (const x of [-0.99, -0.42, 0.42, 0.99]) { cyl(root, 0.105, 1.62, stone, x, 1.05, -1.1); box(root, 0.28, 0.07, 0.28, stone, x, 1.895, -1.1); }
  box(root, 2.7, 0.3, 0.52, stone, 0, 2.08, -1.2); panel(root, 2.3, 0.22, smat(signTex('bank-sign', 920, 88, '#ded7c8', '#3a2c1e', [['INVESTMENT BANK', 76, 0.56]]), 1), 0, 2.08, -0.935);
  slab(root, [[-1.4, 0], [1.4, 0], [0, 0.55]], 0.44, stone, 0, 2.23, -1.2);
  streetLamp(root, -1.65, -0.3, 2.3, '#ffe9b0', 2); streetLamp(root, 1.65, -0.3, 2.3, '#ffe9b0', 2);
  return {light: () => LIGHT.dusk, tick: () => undefined};
};

// ------------------------------------------------------------------ inside: the wire is approved, and then it meets the back office
export const gate: Builder = (root) => {
  backdrop(root, ['#131a2a', '#2a3550']);
  floor(root, 14, 12, tmat(tiled(tileTex('gate-floor', '#59657e', '#48546c', 2), 7, 6)));
  box(root, 9, 5.6, 0.3, '#3d4a66', 0, 2.8, -2.25);
  // the belt runs from the employee's desk, front left, to the way out in the back wall
  const A: V = [-0.95, 0.86, 0.75], B: V = [0.92, 0.86, -1.95], L = Math.hypot(B[0] - A[0], B[2] - A[2]), line = grp(root, A[0], 0, A[2]);
  line.rotation.y = Math.atan2(B[0] - A[0], B[2] - A[2]);                                                // local +z runs along the belt
  const beltT = tiled(tex('belt', 64, 64, (g) => { g.fillStyle = '#2b303c'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3a4050'; g.fillRect(0, 0, 64, 10); }, true), 1, 12);
  box(line, 0.6, 0.66, L - 0.1, '#56627e', 0, 0.42, L / 2); box(line, 0.52, 0.11, L, new THREE.MeshLambertMaterial({map: beltT}), 0, 0.805, L / 2);
  for (const s of [-1, 1]) box(line, 0.05, 0.1, L, '#8a94a3', s * 0.29, 0.83, L / 2);
  // the gate, six tenths of the way along
  const GZ = 0.6 * L;
  for (const s of [-1, 1]) box(line, 0.07, 1.78, 0.07, '#c9ced6', s * 0.4, 0.89, GZ); box(line, 0.87, 0.09, 0.09, '#c9ced6', 0, 1.78, GZ);
  const stripes = new THREE.MeshBasicMaterial({map: tex('gate-plate', 256, 192, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e3342f'; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 56, 0); g.lineTo(i * 56 + 28, 0); g.lineTo(i * 56 + 28 + h, h); g.lineTo(i * 56 + h, h); g.closePath(); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  }), side: THREE.DoubleSide});
  const plate = panel(line, 0.72, 0.54, stripes, 0, 2.2, GZ - 0.02, Math.PI);
  // the way out
  box(root, 0.9, 0.9, 0.1, '#1a2030', B[0], 1.25, -2.08); panel(root, 0.6, 0.2, smat(signTex('out', 300, 100, '#2fbf71', '#ffffff', [['OUT', 84, 0.56]], {border: '#ffffff'}), 1.1), B[0], 1.86, -2.05);
  panel(line, 0.72, 0.2, smat(signTex('back-office', 540, 150, '#ffe14a', INK, [['BACK OFFICE', 104, 0.56]], {border: INK}), 1), 0, 1.62, GZ - 0.06, Math.PI);
  // the wire: a bundle with its price on it
  const cargo = grp(root); bundle(cargo, 1.5, true).position.y = 0.06;
  soft(panel(cargo, 0.74, 0.24, smat(label('wire-sum', 592, 192, [['$2,849,000', 150, 0.54, '#ffffff']]), 1, true), 0, 0.42, 0));
  const ok = soft(panel(root, 0.34, 0.34, smat(tickTex(), 1.1, true), A[0] + 0.1, 1.62, A[2] - 0.2));
  const red = halo(root, 1.3, '#ff3b2a', 0, 0.2, 1.2, -0.7);
  const emp = actor(root, STAFF(3), {idle: {expr: 'neutral', pose: 'type'}, ok: {expr: 'smile', pose: 'point'}, oh: {expr: 'nervous', pose: 'both'}}, -0.6, 0, 0.12, {scale: 1.0, res: 1.2});
  const clerk = actor(root, STAFF(4), {idle: {expr: 'neutral', pose: 'cross'}, stop: {expr: 'stern', pose: 'hold', prop: 'paddle'}}, 1.06, 0, -0.62, {scale: 1.02, res: 1.2});
  return {
    light: () => ({...LIGHT.cold, amb: 1.35}),
    tick: ({f, cam, shot}) => {
      const go = W(191), shut = W(195), hit = W(197);                                                    // "approved", "back (office)", "stopped"
      const s = f < go ? 0.02 : Math.min(0.52, 0.02 + 0.5 * smooth(f, go, hit + 2) ** 0.9), bump = shake(f, hit, 0.05, 10);
      cargo.position.set(lerp(A[0], B[0], s) - bump * 0.3, 0.86 + hop(f, go, 0.12, 8), lerp(A[2], B[2], s) + bump * 0.4); cargo.rotation.y = line.rotation.y + Math.PI / 2 + bump;
      cargo.visible = f >= go - 3; cargo.scale.setScalar(pop(f, go - 3, 6));
      beltT.offset.y = -(f < hit ? f : hit) * 0.02;
      plate.position.y = lerp(2.2, 1.14, smooth(f, shut, shut + 6)) + (f >= shut + 6 ? Math.abs(shake(f, shut + 6, 0.04, 6)) : 0);
      ok.visible = f >= go && f < shut + 20 && shot.v === 'approve'; ok.scale.setScalar(pop(f, go, 7));
      (red.material as THREE.MeshBasicMaterial).opacity = f >= hit ? 0.3 * (0.7 + 0.3 * Math.sin(f * 0.4)) : 0;
      emp.show(f >= hit ? 'oh' : f >= go - 2 ? 'ok' : 'idle'); emp.node.position.y = hop(f, go - 2, 0.07, 8); emp.tick(f, cam);
      clerk.show(f >= shut - 2 ? 'stop' : 'idle'); clerk.node.position.y = hop(f, shut - 2, 0.09, 8); clerk.tick(f, cam);
    },
  };
};
