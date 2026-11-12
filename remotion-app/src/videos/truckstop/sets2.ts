// Sets of the truck-stop heist short, part 2: the jewelry show, the map, the road at night, the cold case, the
// collision the night before, the airport.
import * as THREE from 'three';
import {backdrop, ball, beam, box, cyl, floor, grainTex, grp, hop, lit, mesh, panel, pool, pop, rng, rrect, shake, smat, smooth, soft, tex, text, tileTex, tiled, tmat, torus, type V} from './kit';
import {actor, COP, CREW, JEWELER, SOMEONE} from './cast';
import {glints, halo, signTex, streetLamp} from './props';
import {W} from './story';
import {car, gapTex, GEMS, INK, LIGHT, nightSky, rig, rings, type Builder} from './sets';

// ------------------------------------------------------------------ the jewelry show: booths full, then a booth empty
export const show: Builder = (root) => {
  backdrop(root, ['#2a2440', '#4a3f66']);
  floor(root, 14, 12, tmat(tiled(tex('show-carpet', 128, 128, (g) => { g.fillStyle = '#7a2f4a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#8f3a58'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { g.beginPath(); g.arc(i * 32 + 16, j * 32 + 16, 9, 0, 7); g.fill(); } }, true), 7, 6)));
  box(root, 12, 5, 0.2, '#e9e2d0', 0, 2.5, -2.9);
  const banner = soft(panel(root, 3.5, 0.82, smat(signTex('show-banner', 1050, 246, '#1f2a55', '#ffe14a', [['INTERNATIONAL', 60, 0.25], ['GEM & JEWELRY SHOW', 104, 0.66]], {border: '#ffe14a'}), 1.1), 0, 3.25, -2.78));
  for (const x of [-1.2, 0, 1.2]) box(root, 0.6, 0.06, 0.16, lit('#fff6dc', 1.5), x, 4.3, -1.2);
  const XS = [-1.18, 0, 1.18], NAMES = ['DIAMONDS', 'GOLD · GEMS', 'WATCHES'];
  const sets = XS.map((x, i) => {
    const b = grp(root, x, 0, -0.3);
    box(b, 1.02, 0.92, 0.56, ['#2b3550', '#3a2f4a', '#2f4a44'][i], 0, 0.46, 0); box(b, 1.06, 0.05, 0.6, '#c9a23a', 0, 0.94, 0);
    box(b, 0.98, 0.03, 0.52, '#5a1f2a', 0, 0.975, 0);                                                       // velvet
    const glass = mesh(b, new THREE.BoxGeometry(1.0, 0.26, 0.54), new THREE.MeshBasicMaterial({color: '#cfeaff', transparent: true, opacity: 0.16, depthWrite: false}), 0, 1.1, 0); soft(glass);
    for (const s of [-1, 1]) for (const t of [-1, 1]) box(b, 0.02, 0.26, 0.02, '#c9ced6', s * 0.5, 1.1, t * 0.27);
    box(b, 1.02, 0.02, 0.56, '#c9ced6', 0, 1.24, 0);
    const jewels = grp(b, 0, 0.99, 0), r = rng(40 + i * 7), pts: V[] = [];
    for (let k = 0; k < 12; k++) {
      const gx = -0.4 + (k % 6) * 0.16 + (r() - 0.5) * 0.03, gz = (k < 6 ? -0.12 : 0.12) + (r() - 0.5) * 0.04;
      if (i === 2) { const t = torus(jewels, 0.045, 0.014, lit(k % 2 ? '#ffd84a' : '#dfe6f0', 1.3), gx, 0.05, gz); t.rotation.x = Math.PI / 2 - 0.5; cyl(jewels, 0.03, 0.012, lit('#fffdf4', 1.2), gx, 0.075, gz - 0.02).rotation.x = -0.5; }
      else if (k % 3 === 2) { const t = torus(jewels, 0.04, 0.013, lit('#ffd84a', 1.35), gx, 0.045, gz); t.rotation.x = Math.PI / 2 - 0.6; }
      else { const m = mesh(jewels, new THREE.OctahedronGeometry(0.042), lit(i === 0 ? '#eaf6ff' : GEMS[k % 5], 1.55), gx, 0.05, gz); m.rotation.set(0.6, r() * 3, 0.3); }
      if (k % 4 === 0) pts.push([gx, 0.13, gz + 0.02]);
    }
    const marks = soft(panel(b, 0.9, 0.4, smat(gapTex('case', 450, 200, '#ffe14a', 20), 1.1, true), 0, 0.985, 0.0)); marks.rotation.x = -Math.PI / 2 + 0.001;
    soft(panel(b, 0.96, 0.2, smat(signTex('show-booth' + i, 480, 100, '#fffdf4', INK, [[NAMES[i], 62, 0.56]], {border: INK}), 1), 0, 0.5, 0.285));
    const who = actor(root, JEWELER(i), {hi: {expr: 'smile', pose: i === 1 ? 'wave' : 'hang'}, low: {expr: i === 1 ? 'pained' : 'stern', pose: i === 0 ? 'shrug' : 'hang'}, paper: {expr: 'stern', pose: 'hold', prop: 'paper'}}, x + (i - 1) * 0.04, 0, -1.0, {scale: 0.98, res: 1.1, wide: true});
    return {jewels, marks, who, tw: glints(jewels, pts)};
  });
  const glow = halo(root, 3.2, '#fff0c8', 0.12, 0, 2.0, -2.4);
  return {
    light: (v) => v === 'open' ? LIGHT.room : {...LIGHT.cold, amb: 1.25, keyI: 0.8},
    tick: ({f, cam, shot}) => {
      const open = shot.v === 'open';
      sets.forEach((s, i) => {
        s.jewels.visible = open; s.marks.visible = !open; s.marks.scale.setScalar(open ? 1 : pop(f, shot.at - 30 + i * 3, 7)); s.tw(f + i * 13, open);
        s.who.show(open ? 'hi' : shot.v === 'claim' && i === 1 ? 'paper' : 'low'); s.who.node.position.y = open ? hop(f, shot.at + 5 + i * 4, 0.05, 8) : 0; s.who.tick(f, cam);
      });
      (glow.material as THREE.MeshBasicMaterial).opacity = open ? 0.14 : 0.05; banner.visible = shot.v !== 'claim';
    },
  };
};

// ------------------------------------------------------------------ the map: 300 miles down the valley
const CA: [number, number][] = [[-124.21, 42.0], [-120.0, 42.0], [-120.0, 39.0], [-114.63, 35.0], [-114.57, 34.3], [-114.14, 34.26], [-114.72, 33.4], [-114.5, 32.75], [-117.13, 32.53], [-117.3, 33.05], [-118.4, 33.75], [-118.5, 34.03], [-119.2, 34.15], [-120.5, 34.45], [-120.65, 35.15], [-121.9, 36.6], [-122.4, 37.2], [-122.5, 37.78], [-123.0, 38.3], [-123.8, 39.5], [-124.4, 40.4], [-124.1, 41.5]];
const ROUTE: [number, number][] = [[-122.31, 37.56], [-121.95, 37.3], [-121.55, 37.05], [-121.05, 36.98], [-120.75, 36.6], [-120.35, 36.2], [-119.95, 35.8], [-119.47, 35.4], [-119.1, 35.05], [-118.87, 34.84]];
export const map: Builder = (root) => {
  backdrop(root, ['#12303a', '#1f4a55']);
  floor(root, 14, 12, tmat(tiled(grainTex('map-floor', '#24505a', 0.1), 5, 4)));
  const BW = 2.4, BH = 3.4, CY = 1.9, Z = -0.4, PX = 1000, PY = Math.round(1000 * BH / BW), sc = 112;
  const mx = (lon: number) => PX / 2 + (lon + 119.3) * 0.8 * sc, my = (lat: number) => PY / 2 - (lat - 37.25) * sc;
  const bx = (lon: number) => (mx(lon) / PX - 0.5) * BW, by = (lat: number) => CY + (0.5 - my(lat) / PY) * BH;
  box(root, BW + 0.14, BH + 0.14, 0.08, '#6b4628', 0, CY, Z - 0.05);
  panel(root, BW, BH, smat(tex('map-ca', PX, PY, (g, w, h) => {
    g.fillStyle = '#bfe0ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a9d0dc'; g.lineWidth = 4;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); } for (let i = 1; i < 11; i++) { g.beginPath(); g.moveTo(0, i * h / 11); g.lineTo(w, i * h / 11); g.stroke(); }
    g.beginPath(); CA.forEach(([lo, la], i) => (i ? g.lineTo(mx(lo), my(la)) : g.moveTo(mx(lo), my(la)))); g.closePath(); g.fillStyle = '#f2d9a0'; g.fill(); g.strokeStyle = INK; g.lineWidth = 12; g.lineJoin = 'round'; g.stroke();
    text(g, 'CALIFORNIA', mx(-117.0), my(36.6), 62, '#b08a4a', {maxWidth: 330});
    const city = (name: string, lon: number, lat: number, dx: number, dy: number, size = 34, align: CanvasTextAlign = 'left') => { g.fillStyle = INK; g.beginPath(); g.arc(mx(lon), my(lat), 9, 0, 7); g.fill(); text(g, name, mx(lon) + dx, my(lat) + dy, size, INK, {font: 'Montserrat', align}); };
    city('SAN FRANCISCO', -122.42, 37.77, 16, -30, 28, 'left');
  }), 1), 0, CY, Z);
  // the route: a line of beads that light up one after another
  const N = 46, beads: THREE.Mesh[] = [], at = (u: number): [number, number] => { const s = u * (ROUTE.length - 1), i = Math.min(ROUTE.length - 2, Math.floor(s)), k = s - i; return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k]; };
  for (let i = 0; i < N; i++) { const [lo, la] = at(i / (N - 1)); beads.push(soft(mesh(root, new THREE.CircleGeometry(0.02, 12), lit('#e3342f', 1.2), bx(lo), by(la), Z + 0.012))); }
  const pinTex = (label: string, col: string) => tex('map-pin-' + label, 300, 120, (g, w, h) => { g.fillStyle = INK; rrect(g, 3, 3, w - 6, h - 6, 22); g.fill(); g.fillStyle = col; rrect(g, 13, 13, w - 26, h - 26, 15); g.fill(); text(g, label, w / 2, h / 2 + 4, 62, '#ffffff', {maxWidth: w - 44}); });
  /** a dot on the place, a tag beside it and a line between the two */
  const pin = (label: string, lon: number, lat: number, col: string, dx: number, dy: number, w = 0.5) => {
    const g = grp(root, bx(lon), by(lat), Z + 0.02), len = Math.hypot(dx, dy), line = soft(panel(g, len, 0.022, lit(INK, 1), dx / 2, dy / 2, 0.004)); line.rotation.z = Math.atan2(dy, dx);
    soft(mesh(g, new THREE.CircleGeometry(0.042, 20), lit(INK, 1), 0, 0, 0.008)); soft(mesh(g, new THREE.CircleGeometry(0.027, 20), lit(col, 1.1), 0, 0, 0.012));
    soft(panel(g, w, w * 0.4, smat(pinTex(label, col), 1.05, true), dx, dy, 0.02)); return g;
  };
  const start = pin('SAN MATEO', -122.31, 37.56, '#2f6fd0', 0.42, -0.05), end = pin('LEBEC', -118.87, 34.84, '#e3342f', 0.16, 0.19, 0.36), mid = pin('BUTTONWILLOW', -119.47, 35.4, '#5b6170', -0.42, 0.2, 0.5);
  const truck = grp(root, 0, 0, Z + 0.03); soft(panel(truck, 0.13, 0.065, lit('#fffdf4', 1.1), 0, 0, 0.004)); soft(panel(truck, 0.15, 0.085, lit(INK, 1), 0, 0, 0));
  // cell towers along the way, and the ring each one sends when a phone passes
  const TW_U = [0.08, 0.26, 0.44, 0.62, 0.8, 0.96], towerTex = tex('map-tower', 120, 160, (g) => { g.strokeStyle = INK; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(60, 20); g.lineTo(24, 148); g.moveTo(60, 20); g.lineTo(96, 148); g.moveTo(40, 96); g.lineTo(80, 96); g.moveTo(49, 58); g.lineTo(71, 58); g.stroke(); g.fillStyle = '#e3342f'; g.beginPath(); g.arc(60, 18, 14, 0, 7); g.fill(); });
  const towers = TW_U.map((u, i) => { const [lo, la] = at(u), s = i % 2 ? 1 : -1, x = bx(lo) + s * 0.2, y = by(la) + 0.04; const t = soft(panel(root, 0.14, 0.19, smat(towerTex, 1.05, true), x, y, Z + 0.016)); const ring = soft(mesh(root, new THREE.RingGeometry(0.8, 1, 36), new THREE.MeshBasicMaterial({color: '#2f6fd0', transparent: true, opacity: 0, depthWrite: false}), x, y + 0.07, Z + 0.02)); return {t, ring, u}; });
  return {
    light: () => LIGHT.room,
    tick: ({f, shot}) => {
      const v = shot.v;
      // "for three hundred miles": the line runs from the show to the truck stop. Later the same line, with the towers on it.
      const k = v === 'start' ? 0 : v === 'route' ? smooth(f, shot.at + 2, W(59) + 4) : smooth(f, shot.at - 8, shot.at + 26);
      beads.forEach((b, i) => { b.visible = i / (N - 1) <= k && k > 0; });
      const [lo, la] = at(k); truck.position.set(bx(lo), by(la), Z + 0.03); truck.visible = v !== 'start';
      start.visible = v !== 'pings'; start.scale.setScalar(v === 'start' ? pop(f, shot.at + 3, 8) : 1); end.visible = v !== 'start' && k > 0.93; end.scale.setScalar(pop(f, v === 'route' ? W(59) : shot.at + 22, 8)); mid.visible = v === 'route' && k > 0.74; mid.scale.setScalar(pop(f, shot.at + 26, 7));
      towers.forEach(({t, ring, u}) => {
        t.visible = v === 'pings'; const hit = k >= u, age = hit ? ((f + u * 40) % 22) / 22 : 0;
        ring.visible = v === 'pings' && hit; ring.scale.setScalar(0.05 + 0.2 * age); (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - age);
      });
    },
  };
};

// ------------------------------------------------------------------ the road at night, seen from behind
const towerSide = () => tex('road-tower', 200, 900, (g, w, h) => {
  g.strokeStyle = '#8a94a3'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2 - 14, 30); g.lineTo(30, h); g.moveTo(w / 2 + 14, 30); g.lineTo(w - 30, h); g.stroke();
  g.lineWidth = 7; for (let i = 0; i < 9; i++) { const y0 = 60 + i * 92, y1 = y0 + 92, x0 = (y: number) => w / 2 - 14 - (y - 30) / (h - 30) * (w / 2 - 44), x1 = (y: number) => w - x0(y); g.beginPath(); g.moveTo(x0(y0), y0); g.lineTo(x1(y1), y1); g.moveTo(x1(y0), y0); g.lineTo(x0(y1), y1); g.moveTo(x0(y0), y0); g.lineTo(x1(y0), y0); g.stroke(); }
  g.fillStyle = '#dfe6f0'; for (const s of [-1, 1]) g.fillRect(w / 2 + s * 44 - 12, 34, 24, 96);
});
const phoneTex = () => tex('road-phone', 96, 150, (g, w, h) => { g.fillStyle = INK; rrect(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.fillStyle = '#7af0e0'; rrect(g, 14, 18, w - 28, h - 52, 8); g.fill(); g.fillStyle = '#3d4450'; g.beginPath(); g.arc(w / 2, h - 20, 9, 0, 7); g.fill(); });
export const road: Builder = (root) => {
  nightSky(root, -70);
  floor(root, 90, 160, tmat(tiled(grainTex('road-field', '#1c2230', 0.1), 20, 30)), 0, 0, -50);
  floor(root, 4.6, 160, tmat(tiled(grainTex('road-tar2', '#343946', 0.12), 2, 40)), 0.012, 0, -50);
  for (const s of [-1, 1]) floor(root, 0.1, 160, lit('#c9ced6', 0.9), 0.018, s * 2.05, -50);
  const dashes = Array.from({length: 22}, () => floor(root, 0.14, 1.5, lit('#f3ead0', 1), 0.018, 0, 0)), posts = Array.from({length: 24}, (_, i) => box(root, 0.06, 0.7, 0.06, lit(i % 2 ? '#ffb347' : '#f3f1ea', 1.1), (i % 2 ? 1 : -1) * 2.5, 0.35, 0));
  ball(root, 1.3, lit('#f6f1d8', 1.25), -9, 17, -68);
  // the sign by the show's exit
  const sign = grp(root, 0, 0, -3); for (const s of [-1, 1]) cyl(sign, 0.07, 3.7, '#8a94a3', s * 2.7, 1.85, 0); box(sign, 5.5, 0.12, 0.12, '#8a94a3', 0, 3.52, 0); box(sign, 2.1, 0.86, 0.07, '#e8e2d4', 0.35, 3.05, 0.06);
  soft(panel(sign, 2.0, 0.76, smat(signTex('road-exit', 840, 320, '#1f6a44', '#ffffff', [['SAN MATEO COUNTY', 80, 0.3], ['EVENT CENTER', 110, 0.68]], {border: '#ffffff'}), 1.05), 0.35, 3.05, 0.1));
  const truck = rig(root); truck.g.rotation.y = Math.PI / 2;
  const cars = [car(root, '#3d4450'), car(root, '#5a3f44')]; cars.forEach((c) => { c.g.rotation.y = Math.PI / 2; });
  const beams = cars.map(() => pool(root, 1.5, '#fff3c0', 0.26, 0, 0)); beams.forEach((b) => b.scale.set(0.8, 1, 2.2));
  // a cell tower by the road
  const TX = 3.0, TZ = -9; soft(panel(root, 0.95, 4.2, smat(towerSide(), 1, true), TX, 2.1, TZ)); const beacon = ball(root, 0.09, lit('#ff3b30', 2), TX, 4.25, TZ);
  const ping = [rings(root, 3, '#7af0e0'), rings(root, 3, '#7af0e0')], reach = rings(root, 3, '#7af0e0');
  const phones = cars.map(() => soft(panel(root, 0.26, 0.4, smat(phoneTex(), 1.2, true), 0, 0, 0)));
  return {
    light: (v) => v === 'leave' ? {...LIGHT.night, sky: '#d6dcff', amb: 1.45, keyI: 1.0} : {...LIGHT.night, amb: 1.15},
    tick: ({f, shot}) => {
      const v = shot.v, speed = 0.3, t = f - shot.at;
      dashes.forEach((d, i) => { d.position.z = -56 + ((i * 3 + f * speed) % 66); }); posts.forEach((p, i) => { p.position.z = -60 + ((Math.floor(i / 2) * 6 + f * speed) % 72); });
      sign.visible = v === 'leave'; sign.position.z = -3 + t * 0.05;
      const tz = v === 'leave' ? -10.1 - 6.4 * smooth(f, shot.at - 4, shot.at + 60) : -14 + 0.2 * Math.sin(f * 0.05);
      truck.g.position.set(0.95, 0, tz + 2.2); truck.tick(f, true);
      const follow = v !== 'leave';
      cars.forEach((c, i) => {
        c.g.visible = follow; const x = i ? -0.95 : 0.95, z = (i ? -2.4 : -3.8) + 0.25 * Math.sin(f * 0.07 + i * 2) + (v === 'follow' ? 3 * (1 - smooth(f, shot.at - 4, shot.at + 20)) : 0);
        c.g.position.set(x, 0.012 * Math.sin(f * 0.6 + i), z); beams[i].visible = follow; beams[i].position.set(x, 0.02, z - 2.6);
        const on = v === 'towers'; ping[i](f + i * 9, on, [x, 1.75, z], 0.42, 0, 0.045); phones[i].visible = on; phones[i].position.set(x, 1.75 + 0.03 * Math.sin(f * 0.3 + i), z); phones[i].scale.setScalar(pop(f, shot.at + 2 + i * 5, 7));
      });
      reach(f, v === 'towers', [TX, 3.8, TZ], 0.9, 0, 0.04); (beacon.material as THREE.MeshBasicMaterial).color.set('#ff3b30').multiplyScalar(Math.floor(f / 8) % 2 ? 2.4 : 0.6);
    },
  };
};

// ------------------------------------------------------------------ the cold case: a box on a shelf
const boxLabel = (a: string, b: string) => tex('cold-label-' + a, 400, 240, (g, w, h) => { g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); text(g, a, w / 2, 86, 84, INK, {maxWidth: w - 50}); text(g, b, w / 2, 176, 52, '#e3342f', {font: 'Montserrat', maxWidth: w - 50}); });
const webTex = () => tex('cold-web', 256, 256, (g) => { g.strokeStyle = 'rgba(240,244,255,0.85)'; g.lineWidth = 3; for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(256 * Math.cos(a), 256 * Math.sin(a)); g.stroke(); } for (const r of [60, 110, 160, 210]) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 12, rr = r * (i % 2 ? 0.93 : 1); if (i) g.lineTo(rr * Math.cos(a), rr * Math.sin(a)); else g.moveTo(rr, 0); } g.stroke(); } });
export const cold: Builder = (root) => {
  backdrop(root, ['#0c0f18', '#1a2030']);
  floor(root, 14, 12, tmat(tiled(grainTex('cold-floor', '#2a3040', 0.1), 5, 4)));
  box(root, 12, 5, 0.2, '#39415a', 0, 2.5, -1.4);
  for (const x of [-1.5, 1.5]) for (const z of [-1.1, -0.45]) box(root, 0.07, 3.6, 0.07, '#7a8494', x, 1.8, z);
  for (const y of [0.55, 1.45, 2.35, 3.25]) box(root, 3.1, 0.05, 0.76, '#8a94a3', 0, y, -0.78);
  const q = rng(77);
  for (const [y, n] of [[0.58, 3], [2.38, 3]] as const) for (let i = 0; i < n; i++) { const w = 0.74 + q() * 0.16; box(root, w, 0.5 + q() * 0.14, 0.58, ['#b08a5a', '#a37f4c', '#bb9566'][i], -0.98 + i * 0.98, y + 0.28, -0.78); }
  for (const x of [-1.02, 1.02]) box(root, 0.8, 0.56, 0.58, '#a37f4c', x, 1.76, -0.78);
  // the box in the middle: this case
  const main = grp(root, 0, 1.475, -0.72); box(main, 0.96, 0.62, 0.62, '#b9925a', 0, 0.31, 0); soft(panel(main, 0.62, 0.37, tmat(boxLabel('CASE FILE', 'JULY 11, 2022')), 0, 0.3, 0.312));
  const lid = grp(main, 0, 0.62, -0.3); box(lid, 1.0, 0.1, 0.66, '#a37f4c', 0, 0.05, 0.3);
  const web = soft(panel(root, 0.7, 0.7, smat(webTex(), 1, true), -0.5, 2.36, -0.4)); web.rotation.z = -Math.PI / 2;
  const spider = grp(root, 0.62, 0, -0.36); ball(spider, 0.045, lit('#15121c', 1), 0, 0, 0); const thread = soft(box(spider, 0.006, 1, 0.006, lit('#e6eaf5', 1), 0, 0.5, 0));
  const dust = soft(panel(main, 0.9, 0.12, new THREE.MeshBasicMaterial({color: '#cfd3de', transparent: true, opacity: 0.35, depthWrite: false}), 0, 0.71, 0.05)); dust.rotation.x = -Math.PI / 2 + 0.3;
  cyl(root, 0.012, 1.2, '#23252e', 0, 4.2, 0.1); const bulb = ball(root, 0.1, lit('#ffe9b0', 1), 0, 3.56, 0.1), cone = beam(root, 0.1, 1.1, 3.5, '#ffe9b0', 0.03, 0, 3.5, 0.1), glow = halo(root, 1.5, '#ffd98a', 0, 0, 1.9, -0.3);
  // what was in it: a prepaid phone
  const phone = grp(root, 0, 1.9, -0.55); box(phone, 0.22, 0.36, 0.04, '#23252e', 0, 0, 0); soft(panel(phone, 0.17, 0.15, lit('#7af0e0', 1.5), 0, 0.08, 0.022));
  for (let i = 0; i < 9; i++) box(phone, 0.035, 0.03, 0.01, '#8a94a3', -0.055 + (i % 3) * 0.055, -0.045 - Math.floor(i / 3) * 0.045, 0.022);
  const ping = rings(root, 3, '#7af0e0');
  return {
    light: (v) => v === 'break' ? {...LIGHT.warm, amb: 1.2} : {...LIGHT.dark, amb: 0.95},
    tick: ({f, shot}) => {
      const on = shot.v === 'break', k = on ? smooth(f, shot.at + 2, shot.at + 12) : 0, sway = 0.05 * Math.sin(f * 0.07);
      bulb.position.x = sway * 3; (bulb.material as THREE.MeshBasicMaterial).color.set('#ffe9b0').multiplyScalar(on ? 1 + 1.6 * k : 0.7 + 0.25 * Math.sin(f * 0.9) * (f % 40 < 6 ? 1 : 0));
      (cone.material as THREE.MeshBasicMaterial).opacity = on ? 0.03 + 0.04 * k : 0.02; cone.rotation.z = sway; (glow.material as THREE.MeshBasicMaterial).opacity = 0.22 * k;
      lid.rotation.x = -1.25 * k; dust.visible = !on; web.visible = !on;
      const drop = on ? 0 : 0.5 + 0.34 * smooth(f, shot.at, shot.at + 30) + 0.02 * Math.sin(f * 0.2); spider.visible = !on; spider.position.y = 3.28 - drop; thread.scale.y = drop; thread.position.y = drop / 2;
      phone.visible = on && k > 0.3; phone.position.y = 1.62 + 0.5 * smooth(f, shot.at + 8, shot.at + 20) + 0.02 * Math.sin(f * 0.2); phone.rotation.y = 0.3 * Math.sin(f * 0.1); ping(f, on && f > shot.at + 16, [0, phone.position.y + 0.06, -0.5], 0.5, 0, 0.05);
    },
  };
};

// ------------------------------------------------------------------ the night before: a collision, a witness, a number
export const PAD: V = [0.62, 1.3, 1.9];
const padTex = () => tex('crash-pad', 500, 650, (g, w, h) => {
  g.fillStyle = '#fffdf4'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d4450'; g.fillRect(0, 0, w, 70); g.fillStyle = '#c9ced6'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(40 + i * 52, 35, 13, 0, 7); g.fill(); }
  g.strokeStyle = '#b9c4dc'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(34, 190 + i * 84); g.lineTo(w - 34, 190 + i * 84); g.stroke(); }
  const hand = (s: string, y: number, size: number, col = '#1f3a8a') => { g.save(); g.translate(w / 2, y); g.rotate(-0.035); text(g, s, 0, 0, size, col, {font: 'Montserrat', weight: 700, maxWidth: w - 70}); g.restore(); };
  hand('WITNESS', 150, 76, INK); hand('saw the collision', 230, 48); hand('PHONE', 316, 56, INK); hand('(invented for this film)', 366, 32, '#8f8a96'); hand('555-0142', 446, 96);
});
const digitTex = (d: string) => tex('crash-digit-' + d, 90, 110, (g, w, h) => { g.fillStyle = INK; rrect(g, 3, 3, w - 6, h - 6, 16); g.fill(); g.fillStyle = '#7af0e0'; rrect(g, 11, 11, w - 22, h - 22, 10); g.fill(); text(g, d, w / 2, h / 2 + 5, 78, INK); });
export const crash: Builder = (root) => {
  nightSky(root, -30);
  floor(root, 40, 30, tmat(tiled(grainTex('crash-tar', '#2f3340', 0.12), 12, 9)));
  for (let i = -6; i <= 6; i++) floor(root, 0.9, 0.1, lit('#c9ced6', 0.9), 0.016, i * 1.9, -0.75);
  floor(root, 40, 3, tmat(tiled(tileTex('crash-walk', '#6a7084', '#4a5064', 4), 20, 2)), 0.08, 0, -3.5); box(root, 40, 0.16, 0.2, '#8a8f9c', 0, 0.08, -1.95);
  box(root, 14, 5, 0.4, '#3a3550', 0, 2.5, -5.2);
  soft(panel(root, 3.0, 1.5, smat(tex('crash-shop', 600, 300, (g, w, h) => { g.fillStyle = '#ffd98a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3550'; g.fillRect(w / 2 - 8, 0, 16, h); g.fillRect(0, h - 40, w, 40); g.fillStyle = '#c9742f'; for (let i = 0; i < 5; i++) g.fillRect(40 + i * 112, 130 + (i % 2) * 30, 70, 130); }), 1.15), -2.2, 1.55, -4.98));
  streetLamp(root, 2.9, -2.4, 3.8, '#ffe9b0', 2.2); pool(root, 3.0, '#ffe9b0', 0.3, 2.4, -0.6);
  // two cars, one into the back of the other
  const a = car(root, '#3f6fb5'), b = car(root, '#b9443a'); a.g.position.set(-1.15, 0, -0.4); b.g.position.set(0.98, 0, -0.52); b.g.rotation.y = -0.14;
  const hood = box(a.g, 0.5, 0.06, 0.8, '#3f6fb5', 0.78, 0.72, 0); hood.rotation.z = 0.5;
  const bang = soft(panel(root, 0.8, 0.8, smat(tex('crash-bang', 200, 200, (g) => { g.fillStyle = '#ffe14a'; g.strokeStyle = INK; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8, r = i % 2 ? 48 : 92; g.lineTo(100 + r * Math.cos(an), 100 + r * Math.sin(an)); } g.closePath(); g.fill(); g.stroke(); }), 1.1, true), -0.08, 0.86, 0.1));
  const puffs = [0, 1, 2].map(() => soft(ball(root, 0.14, new THREE.MeshBasicMaterial({color: '#cfd3de', transparent: true, opacity: 0.5, depthWrite: false}), 0, 0, 0)));
  // the officer and the witness, in front of the cars
  const cop = actor(root, COP(0), {write: {expr: 'neutral', pose: 'hold', prop: 'clip'}, nod: {expr: 'smile', pose: 'hold', prop: 'clip'}}, 0.62, 0, 1.3, {scale: 1.0, res: 1.1, wide: true});
  const who = actor(root, SOMEONE, {tell: {pose: 'phone', prop: 'phone'}, idle: {pose: 'hang'}}, -0.5, 0, 1.3, {scale: 1.0, res: 1.1, wide: true});
  const DIGITS = '5550142'.split('').reverse(), digits = DIGITS.map((d) => soft(panel(root, 0.17, 0.21, smat(digitTex(d), 1.25, true), 0, 0, 0)));
  const pad = grp(root, ...PAD); box(pad, 0.5, 0.66, 0.03, '#3d4450', 0, 0, -0.02); soft(panel(pad, 0.47, 0.61, smat(padTex(), 1), 0, 0, 0)); const pen = cyl(pad, 0.012, 0.3, '#e3342f', 0.2, -0.16, 0.06); pen.rotation.z = -0.5; pen.rotation.x = 0.4;
  const tag = soft(panel(root, 0.86, 0.36, smat(tex('crash-witness', 430, 180, (g, w, h) => { g.fillStyle = INK; rrect(g, 3, 3, w - 6, 120, 24); g.fill(); g.fillStyle = '#ffe14a'; rrect(g, 13, 13, w - 26, 100, 16); g.fill(); text(g, 'WITNESS', w / 2, 66, 84, INK); g.fillStyle = INK; g.beginPath(); g.moveTo(w / 2 - 26, 118); g.lineTo(w / 2 + 26, 118); g.lineTo(w / 2, 176); g.closePath(); g.fill(); }), 1.1, true), -0.5, 2.4, 1.3));
  return {
    light: () => ({...LIGHT.night, amb: 1.2, keyI: 0.9}),
    tick: ({f, cam, shot}) => {
      const v = shot.v, blink = Math.floor(f / 9) % 2 ? 2.2 : 0.4;
      [a, b].forEach((c) => { c.tail.color.set('#ff7a1a').multiplyScalar(blink); c.head.color.set('#fff3c0').multiplyScalar(1.4); });
      bang.scale.setScalar(1 + 0.08 * Math.sin(f * 0.5)); bang.rotation.z = 0.1 * Math.sin(f * 0.21);
      puffs.forEach((p, i) => { const u = (f * 0.016 + i / 3) % 1; p.position.set(-0.3 + 0.2 * Math.sin(i * 2 + u * 3), 0.9 + 1.1 * u, -0.3); p.scale.setScalar(0.6 + 1.6 * u); (p.material as THREE.MeshBasicMaterial).opacity = 0.42 * (1 - u); });
      cop.show(v === 'wide' ? 'nod' : 'write'); cop.node.visible = v !== 'note'; cop.tick(f, cam);
      who.show(v === 'wide' ? 'idle' : 'tell'); who.node.visible = v !== 'note'; who.tick(f, cam);
      // "handed police his burner number": the digits go from his phone to the officer's pad
      digits.forEach((d, i) => { const at = W(122) + i * 4, u = (f - at) / 16; d.visible = v === 'hand' && u > 0 && u < 1; d.position.set(-0.22 + 0.72 * u, 1.5 + 0.25 * Math.sin(Math.PI * u), 1.42); d.scale.setScalar(0.7 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 1.2))); });
      pad.visible = v === 'note'; pad.scale.setScalar(v === 'note' ? pop(f, shot.at - 3, 7) : 1); pen.position.x = 0.2 + 0.03 * Math.sin(f * 0.9); pen.position.y = -0.16 + shake(f, shot.at + 2, 0.02, 14);
      tag.visible = v === 'wide' && f >= W(132) - 2; tag.scale.setScalar(pop(f, W(132) - 2, 8)); tag.position.y = 2.4 + 0.03 * Math.sin(f * 0.12);
    },
  };
};

// ------------------------------------------------------------------ an airport gate in Panama City
const boardTex = () => tex('air-board', 760, 420, (g, w, h) => {
  g.fillStyle = '#10131c'; g.fillRect(0, 0, w, h); text(g, 'SALIDAS · DEPARTURES', w / 2, 44, 52, '#ffe14a');
  const rows: [string, string, string][] = [['21:40', 'BOGOTÁ', 'A TIEMPO'], ['22:05', 'ECUADOR', 'EMBARCANDO'], ['22:30', 'LIMA', 'A TIEMPO'], ['23:10', 'MIAMI', 'A TIEMPO']];
  rows.forEach(([t, city, st], i) => { const y = 122 + i * 78, hot = i === 1; if (hot) { g.fillStyle = '#ffe14a'; g.fillRect(14, y - 34, w - 28, 68); }
    const col = hot ? INK : '#f3f1ea'; text(g, t, 30, y + 3, 48, col, {align: 'left'}); text(g, city, 190, y + 3, 48, col, {align: 'left'}); text(g, st, w - 30, y + 3, 40, hot ? INK : '#7af0a0', {align: 'right'}); });
});
export const airport: Builder = (root) => {
  backdrop(root, ['#0b1228', '#27305a']);
  floor(root, 16, 14, tmat(tiled(tileTex('air-floor', '#d9dde6', '#b9c0cc', 2), 8, 7)));
  // the glass wall, the apron and a plane outside
  box(root, 14, 0.5, 0.3, '#5b6170', 0, 0.25, -3.2); box(root, 14, 0.3, 0.3, '#5b6170', 0, 4.6, -3.2); for (let i = -3; i <= 3; i++) box(root, 0.12, 4.4, 0.16, '#5b6170', i * 2.0, 2.4, -3.2);
  soft(panel(root, 14, 4.2, new THREE.MeshBasicMaterial({color: '#8fb4e0', transparent: true, opacity: 0.12, depthWrite: false}), 0, 2.5, -3.2));
  floor(root, 40, 16, lit('#1c2233', 1), -0.02, 0, -12);
  const plane = grp(root, 1.6, 1.9, -8.5); const fus = cyl(plane, 0.75, 8.5, '#f3f1ea', 0, 0, 0); fus.rotation.z = Math.PI / 2; ball(plane, 0.75, '#f3f1ea', 4.25, 0, 0).scale.x = 1.6;
  box(plane, 1.6, 2.0, 0.14, '#2f6fd0', -3.6, 1.3, 0).rotation.z = 0.5; box(plane, 2.2, 0.14, 7.5, '#dfe3ea', 0.3, -0.35, 0); for (let i = 0; i < 14; i++) box(plane, 0.2, 0.18, 0.02, lit('#ffe9b0', 1.4), -2.6 + i * 0.46, 0.2, 0.76);
  for (const x of [-2.5, 3.2]) cyl(root, 0.05, 1.2, '#8a94a3', x + 1.6, 0.6, -8.5);
  // the gate: a desk, a board, seats, the name of the place
  box(root, 1.5, 1.05, 0.5, '#2f4a7a', 2.3, 0.525, -1.9); soft(panel(root, 1.3, 0.5, smat(signTex('air-gate', 520, 200, '#ffe14a', INK, [['GATE 12', 120, 0.56]], {border: INK}), 1.05), 2.3, 0.6, -1.64));
  cyl(root, 0.03, 1.4, '#5b6170', -0.9, 3.9, -2.0); cyl(root, 0.03, 1.4, '#5b6170', 0.9, 3.9, -2.0); box(root, 2.5, 1.44, 0.12, '#23252e', 0, 2.9, -2.0); soft(panel(root, 2.38, 1.32, smat(boardTex(), 1.15), 0, 2.9, -1.935));
  for (let i = 0; i < 4; i++) { box(root, 0.5, 0.08, 0.5, '#3d4450', -3.3 + i * 0.56, 0.48, -2.2); box(root, 0.5, 0.5, 0.07, '#3d4450', -3.3 + i * 0.56, 0.76, -2.44); }
  // one traveller with a case, and two officers
  const man = actor(root, CREW(0), {walk: {mode: 'march', pose: 'hang'}, halt: {pose: 'shrug'}}, 0, 0, 0.4, {scale: 1.0, res: 1.1, wide: true});
  const bagG = grp(root, 0, 0, 0.3); box(bagG, 0.42, 0.6, 0.24, '#b9443a', 0, 0.38, 0); box(bagG, 0.03, 0.5, 0.03, '#c9ced6', -0.12, 0.92, 0); box(bagG, 0.03, 0.5, 0.03, '#c9ced6', 0.12, 0.92, 0); box(bagG, 0.3, 0.04, 0.04, '#23252e', 0, 1.17, 0); for (const s of [-1, 1]) cyl(bagG, 0.05, 0.05, '#23252e', s * 0.16, 0.05, 0).rotation.x = Math.PI / 2;
  const cops = [-1, 1].map((s, i) => actor(root, COP(i + 1), {walk: {mode: 'march', expr: 'stern'}, stop: {expr: 'stern', pose: 'push'}}, 0, 0, 0.5, {scale: 1.0, res: 1.1, wide: true}));
  return {
    light: () => ({...LIGHT.cold, amb: 1.5}),
    tick: ({f, cam, shot}) => {
      const cue = W(142) - 2, k = smooth(f, shot.at - 6, cue + 2), halted = f >= cue;
      const x = -1.5 + 1.35 * k; man.node.position.set(x, hop(f, cue, 0.07, 7), 0.4); man.show(halted ? 'halt' : 'walk'); man.tick(f, cam);
      bagG.position.set(x - 0.52, 0, 0.36); bagG.rotation.z = halted ? 0 : -0.16;
      cops.forEach((c, i) => { const s = i ? 1 : -1, u = smooth(f, cue - 8, cue + 4), cx = s * (2.5 - 1.6 * u) + (i ? -0.1 : -0.3); c.node.position.set(cx, 0, 0.55); c.show(u > 0.96 ? 'stop' : 'walk'); c.mesh.scale.x = s < 0 ? -1 : 1; c.tick(f, cam); });
    },
  };
};
