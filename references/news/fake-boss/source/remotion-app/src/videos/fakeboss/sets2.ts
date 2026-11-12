// Sets of the fake boss short, part 2: the prosecutors' lectern, the three defendants, the city of companies, the pile
// of money, the indictment, the scales, the closing question.
import * as THREE from 'three';
import {backdrop, ball, beam, box, cyl, floor, foldTex, grainTex, grp, hop, lit, panel, pool, pop, rng, rod, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, woodTex, rrect} from './kit';
import {actor, CYAN, DEFENDANT, PARTNER, PROSECUTOR, STAFF} from './cast';
import {bundleStream, flagPole, flagUS, glints, halo, lectern, noteTex, person, signTex, skylineTex, tvCamera} from './props';
import {INK, LIGHT, plateTex, type Builder} from './sets';
import {W} from './story';

// ------------------------------------------------------------------ the prosecutors' side: a lectern in New York
export const podium: Builder = (root) => {
  backdrop(root, ['#0a1228', '#1c2c58']);
  floor(root, 14, 12, tmat(tiled(grainTex('podium', '#2a3760', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, tmat(tiled(foldTex('podium-cur', '#20305c', '#131d3c'), 3, 1)), 0, 2.8, -1.95);
  flagPole(root, -1.2, -1.45, flagUS());
  flagPole(root, 1.2, -1.45, tex('flag-office', 400, 224, (g, w, h) => { g.fillStyle = '#1f2a55'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e7c56a'; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, h / 2, 62, 0, 7); g.stroke(); }), {left: true});
  lectern(root, 0, 0.35, '#2a2f44', signTex('plaque-sdny', 400, 145, '#1f2a44', '#ffd43b', [['U.S. ATTORNEY', 64, 0.36], ['SOUTHERN DISTRICT OF NEW YORK', 25, 0.78]], {border: '#e7c56a'}));
  const UP = 0.2;
  const pro = actor(root, PROSECUTOR, {idle: {expr: 'stern', pose: 'desk'}, say: {expr: 'stern', pose: 'point'}}, 0, UP, -0.3, {scale: 1.25, res: 1.2});
  tvCamera(root, -1.25, 1.5, 0.5, 0.95); tvCamera(root, 1.3, 1.9, -0.45, 0.95);
  return {
    light: () => ({...LIGHT.show, sky: '#d8e2ff', amb: 1.3}),
    tick: ({f, cam}) => { const at = W(25) - 2; pro.show(f >= at ? 'say' : 'idle'); pro.node.position.y = UP + hop(f, at, 0.08, 8); pro.tick(f, cam); },
  };
};

// ------------------------------------------------------------------ the three defendants: no faces, three jackets
const aliasTex = (key: string, name: string) => tex('alias-' + key, 440, 250, (g, w, h) => {
  g.fillStyle = '#fffdf4'; rrect(g, 5, 5, w - 10, h - 10, 22); g.fill(); g.save(); rrect(g, 5, 5, w - 10, h - 10, 22); g.clip(); g.fillStyle = '#e3342f'; g.fillRect(0, 0, w, 88); g.restore();
  g.strokeStyle = INK; g.lineWidth = 9; rrect(g, 5, 5, w - 10, h - 10, 22); g.stroke();
  text(g, 'ALSO KNOWN AS', w / 2, 50, 46, '#ffffff'); text(g, name, w / 2, 166, 92, INK, {maxWidth: w - 40});
});
const leafTex = (month: string, day: string, place: string) => tex('leaf-' + month, 300, 400, (g, w, h) => {
  g.fillStyle = '#fffdf4'; rrect(g, 5, 5, w - 10, h - 10, 20); g.fill(); g.save(); rrect(g, 5, 5, w - 10, h - 10, 20); g.clip(); g.fillStyle = '#e3342f'; g.fillRect(0, 0, w, 92); g.fillStyle = '#2b3550'; g.fillRect(0, h - 92, w, 92); g.restore();
  g.strokeStyle = INK; g.lineWidth = 9; rrect(g, 5, 5, w - 10, h - 10, 20); g.stroke();
  text(g, month, w / 2, 52, 62, '#ffffff'); text(g, day, w / 2, 204, 190, INK); text(g, place, w / 2, h - 44, 50, '#ffffff', {maxWidth: w - 30});
});
export const three: Builder = (root) => {
  backdrop(root, ['#0c0f18', '#1c2233']);
  floor(root, 14, 12, tmat(tiled(grainTex('three-floor', '#2c3346', 0.1), 5, 4)));
  box(root, 9, 5.6, 0.3, '#3a4460', 0, 2.8, -2.2);
  const XS = [-0.78, 0, 0.78], Z = 0.1;
  XS.forEach((x) => cyl(root, 0.36, 0.03, '#4a5676', x, 0.015, Z));
  const defs = XS.map((x, i) => actor(root, DEFENDANT(i), {a: {}, b: {pose: (['hang', 'hips', 'cross'] as const)[i]}}, x, 0, Z, {scale: 0.98, res: 1.2}));
  // the partners the indictment speaks of, "known and unknown": further back, in the half-dark
  const partners = [-1.35, -0.42, 0.45, 1.32].map((x, i) => actor(root, PARTNER(i % 3), {a: {}}, x, 0, -1.3, {scale: 0.9, res: 0.8, phase: i * 2.1}).tint('#70758c'));
  const spots = XS.map((x) => ({cone: beam(root, 0.14, 0.62, 5.2, '#fff0c8', 0.05, x, 5.2, Z), floor: pool(root, 0.9, '#fff0c8', 0.3, x, Z)}));
  // the names on the case's title page, as stickers
  const stick = (key: string, name: string, i: number, y: number, dx: number, at: number, rot: number) => ({m: soft(panel(root, 0.56, 0.32, smat(aliasTex(key, name), 1, true), XS[i] + dx, y, Z + 0.45 - 0.03 * y)), at, rot});
  const stickers = [stick('rocky', 'ROCKY BALBOA', 0, 0.98, 0.02, W(156), -0.07), stick('cash', 'SUPERMAN CASH', 1, 1.17, -0.05, W(158), 0.06), stick('mission', 'IMPOSSIBLE MISSION', 1, 0.93, 0.06, W(160), -0.05)];
  // when and where each was arrested, as the Justice Department gave it on November 5
  const leaves = ([['JUNE', '17', 'SPAIN', W(199)], ['AUGUST', '5', 'SPAIN', W(200)], ['SEPT', '7', 'U.K.', W(202)]] as const).map(([m, d, p, at], i) => ({m: soft(panel(root, 0.5, 0.666, smat(leafTex(m, d, p), 1, true), XS[i], 2.3, Z + 0.05)), at, rot: [-0.06, 0.04, -0.03][i]}));
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.1, keyI: 0.75}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, alias = v === 'alias' || v === 'rocky' || v === 'cash';
      partners.forEach((p) => { p.node.visible = v === 'men'; p.tick(f, cam); });
      defs.forEach((d, i) => {
        const named = alias && i < 2, fwd = named ? smooth(f, W(149), W(149) + 10) : 0;                    // the two with aliases step up
        d.show(v === 'men' ? 'a' : 'b'); d.node.position.z = Z + 0.25 * fwd; d.node.position.y = (named ? hop(f, W(149) + i * 4, 0.08, 8) : 0) + (v === 'arrest' ? hop(f, leaves[i].at, 0.05, 7) : 0);
        d.tint(alias && i === 2 ? '#7f879c' : '#ffffff'); d.tick(f, cam);
        (spots[i].cone.material as THREE.MeshBasicMaterial).opacity = alias && i === 2 ? 0.015 : 0.055; (spots[i].floor.material as THREE.MeshBasicMaterial).opacity = alias && i === 2 ? 0.08 : 0.32;
      });
      stickers.forEach((s) => { const on = (v === 'rocky' || v === 'cash') && f >= s.at; s.m.visible = on; s.m.scale.setScalar(on ? 2.2 - 1.2 * Math.min(1, (f - s.at) / 4) : 1); s.m.rotation.z = s.rot + shake(f, s.at, 0.06, 9); });
      leaves.forEach((l) => { const on = v === 'arrest' && f >= l.at; l.m.visible = on; l.m.scale.setScalar(pop(f, l.at, 8)); l.m.rotation.z = l.rot + shake(f, l.at, 0.05, 10); });
    },
  };
};

// ------------------------------------------------------------------ thousands of companies
export const city: Builder = (root) => {
  backdrop(root, ['#6fb4ee', '#dff0ff']);
  floor(root, 44, 44, tmat(tiled(tileTex('city-ground', '#98a2b6', '#828ca0', 2), 22, 22)));
  panel(root, 30, 7, smat(skylineTex('city-far', '#8fc6f2', '#dff0ff', '#8fa0b8', '#cfe0ef', 17), 1), 0, 3.2, -9.5);
  const facade = (i: number) => tex('facade-' + i, 128, 256, (g, w, h) => {
    const base = ['#d9c9b0', '#b9c6d6', '#c9b6c6', '#bcd0c0', '#d6d0c0'][i], q = rng(11 + i);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = q() < 0.7 ? '#5f7f9f' : '#ffe9a8'; g.fillRect(x * 32 + 7, y * 32 + 8, 18, 18); }
  });
  const icon = smat(tex('city-call', 128, 128, (g) => {                                                  // somebody is calling: a face on a plate
    g.fillStyle = '#0b3340'; g.strokeStyle = INK; g.lineWidth = 9; rrect(g, 14, 8, 100, 112, 26); g.fill(); g.stroke(); g.strokeStyle = CYAN; g.lineWidth = 5; rrect(g, 24, 18, 80, 92, 18); g.stroke();
    person(g, 64, 70, 62, CYAN, '#0b3340');
  }), 1.2, true);
  const q = rng(29), towers: {icon: THREE.Mesh; at: number; y: number}[] = [];
  for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
    const x = (col - 2) * 1.08 + (row % 2 ? 0.5 : 0) + (q() - 0.5) * 0.24, z = 2.2 - row * 1.4 + (q() - 0.5) * 0.3, hgt = 0.9 + q() * 1.7 + (row > 3 ? 0.5 : 0), w = 0.6 + q() * 0.22;
    box(root, w, hgt, w, tmat(facade((row + col * 2) % 5)), x, hgt / 2, z); box(root, w * 0.9, 0.06, w * 0.9, '#6f7a8e', x, hgt + 0.03, z);
    towers.push({icon: soft(panel(root, 0.52, 0.52, icon, x, hgt + 0.46, z)), at: W(31) + 2 + Math.round(row * 3.2 + q() * 22), y: hgt + 0.46});
  }
  return {
    light: () => LIGHT.day,
    tick: ({f, cam}) => towers.forEach((t, i) => {
      t.icon.visible = f >= t.at; t.icon.quaternion.copy(cam.quaternion); t.icon.scale.setScalar(pop(f, t.at, 7) * (1 + 0.05 * Math.sin(f * 0.8 + i)));
      t.icon.position.y = t.y + 0.03 * Math.sin(f * 0.12 + i * 1.7);
    }),
  };
};

// ------------------------------------------------------------------ about $129 million
export const cash: Builder = (root) => {
  backdrop(root, ['#08120d', '#17301f']);
  floor(root, 14, 12, tmat(tiled(grainTex('cash-floor', '#22302a', 0.12), 5, 4)));
  box(root, 1.9, 0.1, 1.3, '#8a6a48', 0, 0.09, -0.3); for (const x of [-0.75, 0, 0.75]) box(root, 0.16, 0.08, 1.3, '#6b4f34', x, 0.04, -0.3);
  const N = 11, LH = 0.15, q = rng(5), glow = new THREE.Color('#2c4433');
  const end = tex('pile-end', 128, 48, (g, w, h) => {                                                    // one bundle seen from the side: paper edges, a band
    g.fillStyle = '#6fc48a'; g.fillRect(0, 0, w, h); g.fillStyle = '#4f9f6a'; for (let y = 6; y < h; y += 7) g.fillRect(0, y, w, 2);
    g.fillStyle = '#fffdf4'; g.fillRect(w * 0.36, 0, w * 0.28, h); g.strokeStyle = '#1f5a36'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  }, true);
  const mats = [0, 1].map((odd) => {
    const side = (n: number) => { const t = tiled(end, n, 1); t.offset.x = odd * 0.5; return new THREE.MeshLambertMaterial({map: t, emissive: glow}); };
    const top = new THREE.MeshLambertMaterial({map: tiled(noteTex.top(), 5, 6), emissive: glow}), long = side(5), short = side(3);
    return [short, short, top, top, long, long];
  });
  const layers = Array.from({length: N}, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, LH - 0.006, 0.9), mats[i % 2]);
    m.position.set((q() - 0.5) * 0.05, 0.14 + LH / 2 + i * LH, -0.3 + (q() - 0.5) * 0.04); m.rotation.y = (q() - 0.5) * 0.06; m.castShadow = true; m.receiveShadow = true; root.add(m);
    return {m, y: m.position.y, at: Math.round(W(40) - 6 + (W(46) - W(40) + 4) * (i / (N - 1)))};
  });
  const fly = bundleStream(root, 10, 0.9);
  const spark = glints(root, [[-0.5, 1.3, 0.2], [0.45, 0.9, 0.2], [0.1, 1.75, 0.2], [-0.3, 0.6, 0.2]]);
  halo(root, 2.2, '#8fffb0', 0.1, 0, 1.2, -1.2);
  return {
    light: () => ({...LIGHT.room, sky: '#f1ffe6', ground: '#3a5a46', amb: 1.5, keyI: 1.3}),
    tick: ({f}) => {
      let topY = 0.14;
      layers.forEach((l) => { const k = Math.min(1, Math.max(0, (f - l.at) / 5)); l.m.visible = f >= l.at; l.m.position.y = l.y + (1 - k) ** 2 * 0.9; if (f >= l.at) topY = l.y + LH / 2; });
      fly.set(f, W(40) - 14, W(46) - 4, (i) => [i % 2 ? 2.4 : -2.4, 1.2 + (i % 3) * 0.5, 0.6], [0, topY + 1.5, 0.1], (i) => [((i * 37) % 10 - 5) * 0.1, topY, -0.3], 0.045);
      spark(f, f >= W(46));
    },
  };
};

// ------------------------------------------------------------------ the indictment: the page that names the case
export const paper: Builder = (root) => {
  backdrop(root, ['#10131c', '#232a3c']);
  const page = grp(root, 0, 1.48, -0.4); page.rotation.z = -0.025;
  soft(panel(page, 1.67, 2.15, lit(INK, 1), 0, 0, -0.01));
  soft(panel(page, 1.6, 2.08, smat(tex('indictment', 1000, 1300, (g, w, h) => {
    const M = (s: string, x: number, y: number, size: number, weight: 700 | 900 = 700, align: CanvasTextAlign = 'center') => text(g, s, x, y, size, '#1a1c24', {font: 'Montserrat', weight, align});
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h);
    M('UNITED STATES DISTRICT COURT', w / 2, 196, 44, 900); M('SOUTHERN DISTRICT OF NEW YORK', w / 2, 252, 44, 900);
    g.fillStyle = '#1a1c24'; g.fillRect(80, 306, w - 160, 4); g.fillRect(80, 770, w - 160, 4); g.fillRect(596, 340, 4, 400);
    M('UNITED STATES OF AMERICA', 96, 384, 30, 700, 'left'); M('- v. -', 250, 440, 30, 700);
    M('JACOB SOALL,', 96, 512, 40, 900, 'left'); M('SHARON HAZAN, and', 96, 572, 40, 900, 'left'); M('GUY SHEETRIT,', 96, 632, 40, 900, 'left'); M('Defendants.', 300, 704, 30, 700, 'left');
    text(g, 'SEALED', 762, 442, 62, '#1a1c24'); text(g, 'SUPERSEDING', 762, 528, 62, '#1a1c24', {maxWidth: 290}); text(g, 'INDICTMENT', 762, 618, 72, '#b3211d', {maxWidth: 300});
    M('COUNT ONE', w / 2, 838, 38, 900); M('(Conspiracy to Commit Wire Fraud)', w / 2, 890, 30); M('The Grand Jury charges:', 96, 962, 30, 700, 'left');
    g.fillStyle = '#c3c7d1'; const q = rng(9); for (let i = 0; i < 7; i++) g.fillRect(96, 1010 + i * 38, (w - 192) * (i % 4 === 3 ? 0.5 + q() * 0.3 : 1), 14);
  }), 1), 0, 0, 0));
  const glow = halo(root, 2.6, '#fff0c8', 0.12, 0, 1.5, -1.2);
  return {light: () => LIGHT.show, tick: ({f, shot}) => { page.position.y = 1.48 + 0.01 * Math.sin(f * 0.06); page.scale.setScalar(pop(f, shot.at - 2, 8)); (glow.material as THREE.MeshBasicMaterial).opacity = 0.12; }};
};

// ------------------------------------------------------------------ the scales: an accusation is not a verdict
export const scales: Builder = (root) => {
  backdrop(root, ['#1a120c', '#2a1c12']);
  floor(root, 14, 12, tmat(tiled(woodTex('scales-floor', '#9a7a56', '#5a4028'), 5, 5)));
  box(root, 9, 5.6, 0.3, tmat(tiled(woodTex('scales-wall', '#6a4a30', '#3a2616'), 4, 3)), 0, 2.8, -2.25);
  for (const x of [-1.7, 1.7]) box(root, 0.22, 5.6, 0.2, '#4a321e', x, 2.8, -2.05);
  const brass = '#d9b24a', sc = grp(root, 0, 0, -0.8);
  cyl(sc, 0.34, 0.08, brass, 0, 0.04, 0); cyl(sc, 0.05, 2.5, brass, 0, 1.29, 0); ball(sc, 0.1, brass, 0, 2.62, 0);
  const arm = grp(sc, 0, 2.5, 0); box(arm, 1.4, 0.07, 0.07, brass, 0, 0, 0);
  const pans = [-1, 1].map((s) => {
    const p = grp(arm, s * 0.66, 0, 0);
    for (const d of [-1, 1]) rod(p, [0, 0, 0], [d * 0.26, -0.78, 0], 0.012, brass);
    cyl(p, 0.3, 0.05, brass, 0, -0.805, 0, 0.26);
    return p;
  });
  // the indictment stands in one pan, and the scales have not moved
  panel(pans[0], 0.5, 0.65, smat(tex('pan-paper', 300, 390, (g, w, h) => {
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    text(g, 'INDICTMENT', w / 2, 70, 58, '#b3211d', {maxWidth: w - 40}); g.fillStyle = '#c3c7d1'; for (let i = 0; i < 8; i++) g.fillRect(34, 128 + i * 30, (w - 68) * (i === 7 ? 0.5 : 1), 12);
  }), 1), 0, -0.45, 0.12);
  const defs = [-0.78, 0, 0.78].map((x, i) => actor(root, DEFENDANT(i), {a: {}}, x, 0, 0.3, {scale: 0.9, res: 1.0}));
  beam(root, 0.3, 1.5, 5.4, '#fff0c8', 0.07, 0, 5.4, 0.1); pool(root, 1.7, '#fff0c8', 0.3, 0, 0.2);
  return {
    light: () => ({...LIGHT.warm, amb: 1.2}),
    tick: ({f, cam, shot}) => {
      const sway = 0.012 * Math.sin(f * 0.07); arm.rotation.z = sway; pans.forEach((p) => { p.rotation.z = -sway; });
      defs.forEach((d) => { d.node.visible = shot.v === 'innocent'; d.tick(f, cam); });
    },
  };
};

// ------------------------------------------------------------------ the closing question
export const final: Builder = (root) => {
  backdrop(root, ['#07090f', '#131a2a']);
  floor(root, 14, 12, tmat(tiled(grainTex('final', '#1b2232', 0.1), 5, 4)));
  const LX = -0.66, RX = 0.7;
  // nobody here is made to squirm: the light asks the question
  const sharp = actor(root, STAFF(0), {a: {expr: 'neutral', pose: 'hold', prop: 'lens'}}, LX, 0, 0.2, {scale: 1.0, res: 1.0});
  const pair = [actor(root, STAFF(3), {a: {expr: 'neutral', pose: 'hold', prop: 'key'}}, RX - 0.27, 0, 0.26, {scale: 0.94, res: 1.0}), actor(root, STAFF(4), {a: {expr: 'neutral', pose: 'hold', prop: 'key'}}, RX + 0.27, 0, 0.14, {scale: 0.94, res: 1.0})];
  // between them, the fake boss: a face on a pole
  rod(root, [0.02, 0, -0.8], [0.02, 1.36, -0.8], 0.022, '#c9ced6'); cyl(root, 0.2, 0.04, '#3a4254', 0.02, 0.02, -0.8);
  const plate = soft(panel(root, 0.62, 0.75, smat(plateTex('boss'), 1.1, true), 0.02, 1.7, -0.8)), glow = halo(root, 1.1, CYAN, 0.3, 0.02, 1.7, -0.95);
  const spots = [LX, RX].map((x) => ({cone: beam(root, 0.14, 0.66, 5.2, '#fff0c8', 0, x, 5.2, 0.2), floor: pool(root, 0.95, '#fff0c8', 0, x, 0.2)}));   // the two cones never overlap
  return {
    light: () => ({...LIGHT.dark, sky: '#c6d0ff', amb: 1.05, keyI: 0.7}),
    tick: ({f, cam, shot}) => {
      const a = shot.v === 'choice' ? smooth(f, W(218) - 2, W(218) + 6) : 0, b = shot.v === 'choice' ? smooth(f, W(222) - 2, W(222) + 6) : 0;
      [a, b].forEach((k, i) => { (spots[i].cone.material as THREE.MeshBasicMaterial).opacity = 0.025 + 0.05 * k; (spots[i].floor.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.3 * k; });
      const shade = (k: number) => '#' + new THREE.Color('#7f879c').lerp(new THREE.Color('#ffffff'), k).getHexString();
      sharp.tint(shade(a)); sharp.node.position.y = hop(f, W(218), 0.08, 8); sharp.tick(f, cam);
      pair.forEach((p, i) => { p.tint(shade(b)); p.node.position.y = hop(f, W(222) + i * 3, 0.08, 8); p.tick(f, cam); });
      plate.position.y = 1.7 + 0.03 * Math.sin(f * 0.08); plate.rotation.z = 0.05 * Math.sin(f * 0.05); plate.scale.setScalar(shot.v === 'what' ? pop(f, W(213), 8) : 1);
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.24 + 0.08 * Math.sin(f * 0.14);
    },
  };
};
