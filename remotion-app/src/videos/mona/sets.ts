// Sets of the Mona Lisa short, part 1: the gallery (1911), the courtyard outside, the glazier's workshop, the service
// staircase and the photographers' studio. Each builder fills a group once and returns a tick that poses it for a frame;
// motion is a pure function of the frame number, so any frame can be rendered on its own. Actions are keyed to the
// narration words through W() in story.ts.
import * as THREE from 'three';
import {backdrop, ball, box, cyl, floor, grp, hop, lerp, lit, mesh, panel, pool, pop, rod, smooth, soft, tex, tiled, tmat, torus, type G2, type Node, type V} from './kit';
import {actor, ARTIST, CITIZEN, CONNOISSEUR, GUARD, PLUMBER, PERUGGIA, PHOTOGRAPHER, TOURIST, WORKMAN, type Actor, type Draw} from './cast';
import {boardsTex, framed, monaTex, oldMaster, parquetTex, plasterTex, stoneTex} from './art';
import {bench, ceilingLamp, clock, cobbles, crate, door, gasLamp, galleryWall, label, LIGHT, parkBench, parquet, pictureLight, plinth, plasterWall, rope, stanchion, tallWindow, wall, boards, type Light} from './fixtures';
import {W, type Shot} from './story';

export type Ctx = {f: number; t: number; cam: THREE.PerspectiveCamera; shot: Shot};
export type SetDef = {tick: (c: Ctx) => void; light: (v: string) => Light};
export type Builder = (root: THREE.Group) => SetDef;

const INK = '#15121c';
/** a walk cycle: n drawings of the same person, cycled at about 5 frames a step */
const gait = (d: Draw, n = 6) => Object.fromEntries(Array.from({length: n}, (_, i) => ['w' + i, {...d, phase: i / n}])) as Record<string, Draw>;
const step = (f: number, n = 6, frames = 5) => 'w' + (Math.floor(f / frames) % n);
export type Show = {a: Draw; b?: Draw; c?: Draw; d?: Draw; e?: Draw} & Record<string, Draw>;

/** The portrait, framed, with textures for a few glances (eyes -1..1, moods 0 smile, 1 bored, 2 wide, 3 wink). */
export function monaFrame(parent: Node, x: number, y: number, z: number, scale = 1, glass = false) {
  const maps: THREE.Texture[] = [];
  for (const e of [-1, 0, 1]) for (const m of ['smile', 'bored', 'wide', 'wink'] as const) maps.push(monaTex(e, m));
  const f = framed(parent, 0.9 * scale, 1.3 * scale, monaTex(0, 'smile'), x, y, z, {bar: 0.12 * scale, glass, depth: 0.1 * scale});
  return {g: f.g, pic: f.pic, glass: f.glass, look(e: number, m: number) { f.pic.material = tmat(maps[(e + 1) * 4 + m]); }};
}

/** A pane of glass, leaned against a wall or lying on the floor: a pale sheet, a green edge, a streak of light. */
function glassPane(p: Node, w: number, h: number, t = 0.02) {
  const g = grp(p);
  const m = new THREE.MeshLambertMaterial({color: '#cfe4e6', transparent: true, opacity: 0.42, side: THREE.DoubleSide});
  panel(g, w, h, m, 0, 0, 0);
  for (const s of [-1, 1]) box(g, 0.03, h, t, '#7fae9a', s * w / 2, 0, 0);
  box(g, w, 0.03, t, '#7fae9a', 0, h / 2, 0); box(g, w, 0.03, t, '#7fae9a', 0, -h / 2, 0);
  const streak = soft(panel(g, w * 0.22, h * 0.9, new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false}), -w * 0.16, 0, 0.005));
  streak.rotation.z = 0.24;
  return {g, streak};
}

// ------------------------------------------------------------------ the gallery
export const gallery: Builder = (root) => {
  backdrop(root, ['#31201a', '#1b1110'], 0.9);
  parquet(root, 24, 22);
  galleryWall(root, 24, 6.4, -3.0, {cloth: 'red', pilasters: [-11.4, -9.2, -6.9, -4.5, -2.95, 2.95, 4.5, 6.9, 9.2, 11.4]});
  box(root, 24, 0.26, 18, '#e6d8bc', 0, 6.5, 3.0);                                                // the ceiling
  for (const x of [-9.2, -4.6, 0, 4.6, 9.2]) ceilingLamp(root, x, 6.2, 2.0);
  // the pictures of the Salon Carré, hung close on the red cloth
  const spots: [number, number, number][] = [[-8.4, 1.6, 2.25], [-6.5, 1.2, 2.35], [-4.9, 1.45, 2.2], [-3.3, 1.1, 2.3], [-1.75, 0.85, 2.25],
    [1.75, 0.85, 2.25], [3.3, 1.1, 2.3], [4.9, 1.45, 2.2], [6.5, 1.2, 2.35], [8.4, 1.6, 2.25]];
  spots.forEach(([x, w, y], i) => {
    framed(root, w, w * 1.28, oldMaster(i, w > 1.1), x, y, -2.87, {bar: 0.1, lit: true});
    pictureLight(root, x, y + w * 0.64 + 0.16, -2.9, w + 0.3);
  });
  bench(root, -3.0, 1.5, 2.6); bench(root, 3.0, 1.5, 2.4);
  tallWindow(root, 10.4, -2.95, 1.8, 3.6, 0.7);
  clock(root, 7.4, 3.6, -2.9, 8, 35);
  // her place: four iron hooks, the paler square the varnish left, her brass card
  const wallZ = -2.9;
  const bare = grp(root, 0, 0, wallZ);
  const patch = soft(panel(bare, 1.16, 1.56, new THREE.MeshBasicMaterial({color: '#94474d', transparent: true, opacity: 0.3, depthWrite: false}), 0, 1.66, 0.014));
  const hooks = grp(bare, 0, 0, 0);
  for (const sx of [-1, 1]) for (const sy of [1, -1]) {
    box(hooks, 0.05, 0.05, 0.16, '#22222a', sx * 0.3, 1.66 + sy * 0.38, 0.08);
    rod(hooks, [sx * 0.3, 1.66 + sy * 0.38, 0.16], [sx * 0.3, 1.66 + sy * 0.38 + 0.11, 0.2], 0.022, '#2a2a34');
    rod(hooks, [sx * 0.3, 1.66 + sy * 0.38 + 0.11, 0.2], [sx * 0.3, 1.66 + sy * 0.38 + 0.13, 0.29], 0.02, '#2a2a34');
  }
  label(root, 0.78, 1.62, wallZ + 0.02, 'LA JOCONDE', 'LÉONARD DE VINCI');
  const mine = monaFrame(root, 0, 1.66, wallZ + 0.12, 1.05, true);
  const MINE: V = [0, 1.66, wallZ + 0.12];
  // the two attendants who hang her again
  const att1 = actor(root, WORKMAN(1), {a: {expr: 'neutral', pose: 'reach'}, b: {expr: 'smile', pose: 'hold'}} as Show, 0, 0, 0, {scale: 0.96});
  const att2 = actor(root, WORKMAN(2), {a: {expr: 'neutral', pose: 'reach'}, b: {expr: 'smile', pose: 'hold'}} as Show, 0, 0, 0, {scale: 0.96});
  // people
  const per = actor(root, PERUGGIA(0), {
    a: {expr: 'smile', pose: 'reach'}, b: {expr: 'whistle', pose: 'lift'}, c: {expr: 'smile', pose: 'under', prop: 'bundle'},
    w: gait({mode: 'side', expr: 'whistle', prop: 'bundle'}, 6), tip: {expr: 'smile', pose: 'tip'},
  } as Show, 0, 0, 0, {scale: 1});
  const guard = actor(root, GUARD(0), {a: {expr: 'neutral', pose: 'cross'}, w: gait({mode: 'side', expr: 'neutral'}, 6)} as Show, 0, 0, 0, {scale: 0.98});
  const artist = actor(root, ARTIST, {a: {expr: 'shock', pose: 'hang'}, b: {expr: 'neutral', pose: 'point'}, c: {expr: 'nervous', pose: 'hold', prop: 'palette'}} as Show, 0, 0, 0, {scale: 1});
  const guard2 = actor(root, GUARD(1), {a: {expr: 'nervous', pose: 'shrug'}, b: {expr: 'neutral', pose: 'cross'}} as Show, 0, 0, 0, {scale: 0.98});
  // the painter's easel, with a canvas turned to the wall
  const easel = grp(root, 1.35, 0, -1.85);
  for (const s of [-1, 1]) rod(easel, [s * 0.34, 0, s * 0.22], [0, 1.55, 0], 0.032, '#7a5228');
  rod(easel, [0, 0, -0.35], [0, 1.55, 0], 0.032, '#7a5228');
  box(easel, 0.92, 1.2, 0.05, '#e9e2d0', 0, 1.05, 0.06);
  box(easel, 1.0, 0.12, 0.1, '#7a5228', 0, 0.43, 0.06);
  easel.visible = false;
  const crowd = Array.from({length: 7}, (_, i) => actor(root, CITIZEN(i + 2), {a: {expr: 'neutral', back: true}, b: {expr: 'shock', pose: 'point', back: true}} as Show, 0, 0, 0, {scale: 0.95, res: 0.6}));
  const conn = actor(root, CONNOISSEUR, {a: {expr: 'smile', pose: 'heart'}, b: {expr: 'neutral', pose: 'hold'}} as Show, 1.1, 0, -0.3, {scale: 1});
  // the flashes of the photographers, on the day she comes back
  const flash = soft(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({map: tex('flash', 128, 128, (g) => { const r = g.createRadialGradient(64, 64, 2, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(0.35, 'rgba(255,250,220,0.5)'); r.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})));
  flash.position.set(0.6, 2.3, 1.0); root.add(flash);
  const lookAt = (a: Actor, x: number, z: number) => { a.node.position.set(x, 0, z); };

  return {
    light: (v) => (v === 'return' ? LIGHT.flash : v === 'today' ? LIGHT.today : LIGHT.gallery),
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at, e = shot.at + (shot.join ? 70 : 62);
      [per, guard, artist, guard2, conn, att1, att2, ...crowd].forEach((p) => (p.node.visible = false));
      easel.visible = false; flash.visible = false;
      mine.g.visible = ['hook', 'lift', 'hooks', 'before', 'return'].includes(v);
      mine.g.position.set(...MINE); mine.g.rotation.set(0, 0, 0);
      patch.visible = ['empty', 'bare', 'shrug', 'artist', 'lift', 'hooks'].includes(v);
      (mine.glass as THREE.Mesh | undefined) && (mine.glass!.visible = v === 'today' || v === 'return');
      if (v === 'hook') {                                                                          // he looks up at her, then reaches
        per.node.visible = true; per.show(f > W(3) ? 'a' : 'a'); lookAt(per, -0.66, -1.35); per.flip(false); per.tick(f, cam);
        const u = smooth(f, a + 8, a + 34);
        mine.g.rotation.z = 0.02 * Math.sin(f * 0.3) * (1 - u);
        per.node.position.y = hop(f, a + 8, 0.05, 14);
      } else if (v === 'walk') {                                                                   // out with her under his arm, unhurried
        per.node.visible = true; per.show(step(f, 6, 4)); per.node.position.set(lerp(-2.9, 2.6, smooth(f, a, e + 22)), 0, 0.55); per.flip(false); per.tick(f, cam);
        guard.node.visible = true; guard.show(step(f, 6, 5)); guard.node.position.set(lerp(2.4, -1.4, smooth(f, a + 6, e + 20)), 0, -1.3); guard.flip(false); guard.tick(f, cam);
      } else if (v === 'empty') {                                                                   // four hooks, a guard strolling past
        guard.node.visible = true; guard.show(step(f, 6, 5)); guard.node.position.set(lerp(-2.6, 2.2, smooth(f, a, e + 18)), 0, -0.9); guard.flip(false); guard.tick(f, cam);
      } else if (v === 'lift') {                                                                   // her frame comes off the wall
        per.node.visible = true; per.show(f > W(56) ? 'b' : 'a'); lookAt(per, -0.34, -1.6); per.tick(f, cam);
        const u = smooth(f, W(54), W(58) + 10);
        mine.g.position.set(MINE[0] - 0.12 * u, MINE[1] + 0.18 * u, MINE[2] + 0.26 * u); mine.g.rotation.z = 0.06 * u;
        per.node.position.y = 0.1 * u;
      } else if (v === 'artist') {                                                                 // the painter finds the wall bare
        per.node.visible = false;
        artist.node.visible = true; artist.show(f > W(91) ? 'b' : 'a'); lookAt(artist, 1.25, -0.8); artist.tick(f, cam);
        easel.visible = true; easel.position.set(1.62, 0, -1.95); easel.rotation.y = -0.35;
      } else if (v === 'bare') {                                                                    // nothing but hooks
        // nobody
      } else if (v === 'shrug') {                                                                  // a guard shrugs
        artist.node.visible = true; artist.show('c'); lookAt(artist, -0.95, -1.05); artist.flip(true); artist.tick(f, cam);
        guard2.node.visible = true; guard2.show(f > W(103) ? 'a' : 'b'); guard2.node.position.set(0.85, 0, -1.35); guard2.node.position.y = hop(f, W(103), 0.06, 10); guard2.tick(f, cam);
      } else if (v === 'crowd') {                                                                  // a line of backs, staring at the bare cloth
        crowd.forEach((c, i) => { c.node.visible = true; c.node.position.set(-1.3 + i * 0.44, 0, 0.35 + (i % 3) * 0.26); c.show(f > W(125) + i * 2 ? 'b' : 'a'); c.tick(f, cam); });
      } else if (v === 'before') {                                                                 // one man, knowing her
        conn.node.visible = true; conn.show(f > W(204) ? 'b' : 'a'); lookAt(conn, 1.15, -0.2); conn.tick(f, cam);
        guard.node.visible = true; guard.show('a'); guard.node.position.set(-1.5, 0, -0.9); guard.flip(false); guard.tick(f, cam);
      } else if (v === 'return') {                                                                 // the crowd, the flashes, the war over
        crowd.forEach((c, i) => { c.node.visible = true; c.node.position.set(-1.5 + i * 0.5, 0, 0.35 + (i % 3) * 0.28); c.show('b'); c.tick(f, cam); });
        att1.node.visible = f < W(211); att2.node.visible = f < W(211);
        [[-1.1, 1.3], [1.4, 0.9], [-0.4, 1.6]].forEach(([x, z], i) => {
          const t = (f - W(208) - i * 6) % 26;
          if (t >= 0 && t < 4) { flash.visible = true; flash.position.set(x, 2.55 + (i % 2) * 0.25, z); flash.scale.setScalar(0.4 + t * 0.16); }
        });
      } else if (v === 'hooks') {                                                                   // she goes back on the hooks
        const u = smooth(f, a, a + 44);
        mine.g.position.set(MINE[0], MINE[1] + lerp(0.62, 0, u), MINE[2] + lerp(0.42, 0, u)); mine.g.rotation.z = lerp(-0.05, 0, u);
        att1.node.visible = f < a + 50; att1.show('a'); att1.node.position.set(-0.72, 0, -1.35); att1.tick(f, cam);
        att2.node.visible = f < a + 50; att2.show('a'); att2.node.position.set(1.05, 0, -1.35); att2.flip(true); att2.tick(f, cam);
      }
    },
  };
};

// ------------------------------------------------------------------ the courtyard, and the doors
export const exit: Builder = (root) => {
  backdrop(root, ['#c9d2dc', '#8d94a2'], 1);
  cobbles(root, 26, 22);
  wall(root, 26, 10, -3.0, tmat(tiled(stoneTex('louvre', ['#e2d6bc', '#d6c9ac'], '#b9aa8c'), 9, 5)), '#8a7f6a');
  // a cornice, a string course, and the tall windows above the doors
  box(root, 26, 0.5, 0.5, tmat(stoneTex('corn', ['#e8dcc2', '#dcd0b4'], '#bcae90')), 0, 5.2, -2.8);
  box(root, 26, 0.22, 0.34, tmat(stoneTex('band', ['#ded2b8', '#d2c5a8'], '#b4a688')), 0, 4.1, -2.84);
  for (const x of [-3.4, 3.4, -8.4, 8.4]) {
    box(root, 1.5, 2.3, 0.2, '#2a2a34', x, 3.0, -2.86);
    box(root, 1.34, 2.14, 0.1, lit('#c9d6e2', 0.9), x, 3.0, -2.8);
    for (let i = 0; i < 3; i++) box(root, 1.36, 0.05, 0.14, '#2a2a34', x, 2.3 + i * 0.7, -2.78);
    box(root, 0.05, 2.14, 0.14, '#2a2a34', x, 3.0, -2.78);
    box(root, 1.7, 0.16, 0.3, tmat(stoneTex('sill', ['#e8dcc2', '#dcd0b4'], '#bcae90')), x, 1.78, -2.8);
  }
  // the great doors, shut, with their brass studs and the museum's notice
  const doors = grp(root, 0, 0, -2.86);
  box(doors, 3.9, 4.3, 0.26, '#3b2416', 0, 2.15, 0);
  for (const s of [-1, 1]) {
    box(doors, 1.78, 4.08, 0.08, '#4e3220', s * 0.95, 2.1, 0.16);
    box(doors, 1.72, 0.1, 0.1, '#6a4526', s * 0.95, 1.0, 0.2); box(doors, 1.72, 0.1, 0.1, '#6a4526', s * 0.95, 3.2, 0.2);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) ball(doors, 0.035, '#c9a23a', s * 0.95 - 0.7 + i * 0.7, 0.7 + j * 0.55, 0.22);
  }
  box(doors, 4.5, 0.5, 0.5, tmat(stoneTex('lintel', ['#e6dac0', '#dacdb0'], '#b6a888')), 0, 4.5, 0.05);
  const noticeTexF = tex('ferme', 256, 180, (g) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 256, 180); g.fillStyle = '#241a12'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 52px Montserrat, sans-serif'; g.fillText('FERMÉ', 128, 60); g.font = '700 24px Montserrat, sans-serif'; g.fillText('LE LUNDI', 128, 112); g.fillRect(112, 142, 32, 4); });
  const noticeG = grp(doors, 0, 1.9, 0.24);
  box(noticeG, 1.02, 0.72, 0.02, '#efe8d6', 0, 0, 0);
  panel(noticeG, 0.96, 0.66, tmat(noticeTexF), 0, 0, 0.016);
  const chain = grp(doors, 0, 0, 0.3);
  for (let i = 0; i < 18; i++) { const u = i / 17; torus(chain, 0.055, 0.015, '#8a8278', lerp(-1.5, 1.5, u), 1.45 - Math.sin(u * Math.PI) * 0.15, 0).rotation.set(0, 0, u > 0.5 ? 0.2 : -0.2); }
  // the staff door at the side, with its brass plate
  door(root, 5.6, -2.83, 1.3, 2.6, ['SERVICE', 'DU MUSÉE']);
  // street lamps either side, and the pavement edge
  for (const x of [-7.2, 6.9]) gasLamp(root, x, 1.2, 4.2);
  box(root, 26, 0.16, 1.4, tmat(stoneTex('kerb', ['#cdc2aa', '#c1b59c'], '#9c9078')), 0, 0.08, 6.4);
  box(root, 26, 0.2, 0.5, tmat(stoneTex('step1', ['#ded2b8', '#d2c5a8'], '#b4a688')), 0, 0.1, -2.35);
  box(root, 26, 0.2, 0.5, tmat(stoneTex('step2', ['#d8ccb2', '#ccc0a4'], '#b0a284')), 0, 0.3, -2.75);
  // people
  const staff = Array.from({length: 4}, (_, i) => actor(root, WORKMAN(i), {a: {expr: 'neutral'}, w: gait({mode: 'side', expr: 'neutral'}, 6)} as Show, 0, 0, 0, {scale: 0.97, res: 0.6}));
  const per = actor(root, PERUGGIA(0), {w: gait({mode: 'side', expr: 'whistle'}, 6), a: {expr: 'neutral', pose: 'cross'}} as Show, 0, 0, 0, {scale: 1});
  const queue = Array.from({length: 8}, (_, i) => actor(root, CITIZEN(i + 4), {a: {expr: 'neutral', back: true}, b: {expr: 'shock', pose: 'point', back: true}} as Show, 0, 0, 0, {scale: 0.95, res: 0.55}));
  return {
    light: () => LIGHT.dawn,
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at, e = shot.at + 62;
      staff.forEach((s) => (s.node.visible = false)); queue.forEach((q) => (q.node.visible = false));
      noticeG.visible = true;
      chain.visible = v === 'shut';
      per.node.visible = v === 'walkin' || v === 'smocks';
      if (v === 'walkin') {                                                                        // in by the staff door, with the rest of them
        staff.slice(0, 2).forEach((s, i) => { s.node.visible = true; s.show(step(f + i * 3, 6, 4)); const u = smooth(f, a + i * 4, e); s.node.position.set(lerp(1.9 + i * 0.3, 5.4, u), 0, 0.7 + i * 0.5); s.flip(false); s.tick(f, cam); });
        per.show(step(f, 6, 4)); per.node.position.set(lerp(1.4, 5.2, smooth(f, a, e)), 0, 1.5); per.flip(false); per.tick(f, cam);
      } else if (v === 'smocks') {                                                                 // three white smocks walking past, and one of them is his
        staff.slice(0, 2).forEach((s, i) => { s.node.visible = true; s.show(step(f + i * 2, 6, 4)); const u = smooth(f, a, e); s.node.position.set(lerp(-1.3 + i * 1.0, 0.5 + i * 1.0, u), 0, 2.1 + i * 0.4); s.flip(false); s.tick(f, cam); });
        per.show(step(f + 3, 6, 4)); per.node.position.set(lerp(-1.8, 0.0, smooth(f, a + 5, e)), 0, 2.6); per.flip(false); per.tick(f, cam);
      } else if (v === 'queue') {                                                                  // a line along the pavement, in from the right
        queue.forEach((q, i) => {
          q.node.visible = true;
          const row = i < 5 ? 0 : 1, k = i % 5;
          q.node.position.set(0.1 + k * 0.62 + row * 0.3, 0, 1.75 + row * 0.62 + 0.05 * Math.sin((f + i * 9) * 0.06));
          q.show(i === 1 && f > W(119) ? 'b' : 'a'); q.tick(f, cam);
        });
        const u = smooth(f, a, e + 20);
        void u;
      }
    },
  };
};

// ------------------------------------------------------------------ the glazier's workshop
export const workshop: Builder = (root) => {
  backdrop(root, ['#4a3a28', '#241a12'], 0.9);
  boards(root, 16, 16, 'shop', '#a8763c', '#6a4522');
  plasterWall(root, 16, 4.6, -2.9, 'shop', '#d8c9a8');
  // a bench along the wall, a rack of tools, a window with grey daylight, a bulb on a flex
  const benchG = grp(root, -0.6, 0, -2.15);
  box(benchG, 6.2, 0.14, 1.0, '#8a5a2c', 0, 0.86, 0);
  for (const s of [-1, 1]) for (const q of [-1, 1]) box(benchG, 0.12, 0.86, 0.12, '#5a3a1c', s * 2.9, 0.43, q * 0.34);
  box(benchG, 6.2, 0.06, 0.1, '#6a4526', 0, 0.6, 0.42);
  for (let i = 0; i < 4; i++) { box(benchG, 0.9, 0.1, 0.5, '#c9b48a', -2.0 + i * 1.3, 0.98, 0.1); }
  // tools on the wall: a saw, hammers, chisels
  const rack = grp(root, -0.6, 0, -2.86);
  box(rack, 4.4, 0.06, 0.04, '#5a3a1c', 0, 2.5, 0.03);
  for (let i = 0; i < 5; i++) { rod(rack, [-2.0 + i * 0.9, 2.5, 0.05], [-2.0 + i * 0.9, 2.2 + (i % 2) * 0.16, 0.05], 0.02, '#7a7a86'); box(rack, 0.12 + (i % 3) * 0.06, 0.3, 0.06, '#8a8a96', -2.0 + i * 0.9, 2.05 + (i % 2) * 0.16, 0.05); }
  box(rack, 0.06, 0.08, 0.12, '#5a5a66', 1.9, 2.1, 0.1);
  // a saw: a blade with teeth, hanging by its handle
  const saw = grp(rack, 1.4, 1.95, 0.07); box(saw, 0.9, 0.22, 0.02, '#b9bccc', 0, 0, 0); for (let i = 0; i < 9; i++) box(saw, 0.05, 0.05, 0.02, '#b9bccc', -0.4 + i * 0.1, -0.12, 0.001); box(saw, 0.3, 0.16, 0.05, '#7a4a22', -0.55, 0.02, 0);
  tallWindow(root, 4.4, -2.9, 1.6, 2.0, 1.3);
  const bulb = grp(root, 0.6, 0, 1.6);
  cyl(bulb, 0.012, 1.6, '#2a2a30', 0, 2.9, 0); ball(bulb, 0.1, lit('#ffe6a8', 1.5), 0, 2.1, 0);
  // panes against the wall, a crate of putty, a trestle with her glass case
  const pane = glassPane(root, 0.95, 1.35); pane.g.position.set(-3.2, 0.75, -1.5); pane.g.rotation.set(-0.05, 0.2, 0.1);
  const pane2 = glassPane(root, 0.95, 1.35); pane2.g.position.set(-2.6, 0.72, -1.1); pane2.g.rotation.set(-0.06, -0.1, -0.06);
  for (const x of [-4.6, 4.2]) crate(root, x, 0, -1.0, 1.2, 0.7, 0.9);
  const caseG = grp(root, 1.0, 0, -1.6);
  for (const s of [-1, 1]) { box(caseG, 0.14, 0.78, 0.7, '#6a4526', s * 0.72, 0.39, 0); }
  box(caseG, 1.9, 0.1, 0.9, '#7a5228', 0, 0.82, 0);
  box(caseG, 1.42, 0.06, 0.74, '#9aa0a8', 0, 0.9, 0);
  box(caseG, 1.44, 0.9, 0.62, new THREE.MeshLambertMaterial({color: '#dfe9f0', transparent: true, opacity: 0.28}), 0, 1.45, 0);
  for (const s of [-1, 1]) rod(caseG, [s * 0.72, 0.9, s * 0.34], [s * 0.72, 1.9, s * 0.34], 0.022, '#9aa0a8');
  box(caseG, 1.44, 0.06, 0.62, '#a8aeb8', 0, 1.92, 0);
  const per = actor(root, PERUGGIA(0), {a: {expr: 'smile', pose: 'hold'}, b: {expr: 'smile', pose: 'lift'}, c: {expr: 'neutral', pose: 'reach'}} as Show, 0, 0, 0, {scale: 1});
  const glazier = actor(root, WORKMAN(0), {a: {expr: 'neutral', pose: 'hold'}, b: {expr: 'smile', pose: 'point'}} as Show, 0, 0, 0, {scale: 0.98});
  return {
    light: () => LIGHT.work,
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at;
      per.node.visible = glazier.node.visible = false;
      if (v === 'pane') {                                                                          // he holds the pane up, and looks through it at her
        per.node.visible = true; per.show(f > W(25) ? 'b' : 'a'); per.node.position.set(-0.55, 0, -1.5); per.flip(true); per.tick(f, cam);
        glazier.node.visible = true; glazier.show('a'); glazier.node.position.set(-2.5, 0, -1.2); glazier.flip(false); glazier.tick(f, cam);
        const u = smooth(f, a, a + 50);
        pane.g.position.set(lerp(-2.1, -1.35, u), 0.72, -1.45); pane.g.rotation.set(-0.12, 0.16, 0.05 * Math.sin(f * 0.2));
      } else if (v === 'case') {                                                                   // the pane goes onto the case, and he squares it up
        per.node.visible = true; per.show(f > W(30) ? 'c' : 'a'); per.node.position.set(-0.3, 0, -1.15); per.tick(f, cam);
        const u = smooth(f, a, a + 44);
        pane.g.position.set(lerp(0.4, 1.0, u), lerp(1.0, 1.96, u), lerp(0.2, -1.55, u));
        pane.g.rotation.set(lerp(0, -Math.PI / 2 + 0.12, u), 0, 0.02);
      }
    },
  };
};

// ------------------------------------------------------------------ the service staircase
export const stairs: Builder = (root) => {
  backdrop(root, ['#b9bfc9', '#7d838f'], 0.95);
  floor(root, 14, 16, tmat(tiled(stoneTex('step', ['#c9bda8', '#bfb39e'], '#9c9078'), 6, 7)));
  wall(root, 14, 6.2, -3.0, tmat(tiled(stoneTex('stair', ['#d2c7b2', '#c6baa4'], '#a1957e'), 6, 5)), '#8a7f6a');
  for (const s of [-1, 1]) box(root, 0.3, 6.2, 12, tmat(tiled(stoneTex('stairside', ['#c6bba6', '#baae98'], '#9c9078'), 5, 5)), s * 5.6, 3.1, -1.0);
  box(root, 12, 0.2, 14, '#b9b2a4', 0, 6.2, -1.0);
  // the door, shut, with its iron plate and its brass knob
  const doorG = grp(root, 0.9, 0, -2.94);
  const doorLeaf = grp(doorG, 0.95, 0, 0);
  for (const s of [-1, 1]) box(doorG, 0.2, 3.4, 0.3, tmat(stoneTex('df', ['#dcd0bc', '#d0c4ae'], '#ac9f88')), s * 1.05, 1.7, 0.1);
  box(doorLeaf, 1.9, 3.2, 0.16, '#6a4526', -0.95, 1.6, 0.02);
  for (const s of [-1, 1]) box(doorLeaf, 0.8, 2.9, 0.05, '#7a5228', -0.95 + s * 0.47, 1.55, 0.11);
  for (let i = 0; i < 2; i++) box(doorLeaf, 0.62, 0.5, 0.03, '#8a5f33', -0.95 + (i ? 0.24 : -0.24), 2.3, 0.15);
  // an enamel lamp over the door, to keep the landing from going black
  const lampOver = grp(doorG, 0, 3.5, 0.3); rod(lampOver, [0, 0, -0.2], [0, 0, 0.24], 0.02, '#2a2a30');
  cyl(lampOver, 0.16, 0.12, '#2f4a44', 0, -0.06, 0.26, 0.1, 14); ball(lampOver, 0.1, lit('#ffe8b0', 1.5), 0, -0.12, 0.26);
  box(doorG, 0.16, 3.0, 0.05, '#8a8a96', 0, 1.55, 0.2);
  box(doorG, 2.3, 0.28, 0.42, tmat(stoneTex('dd', ['#d6cab6', '#cabda8'], '#a89c86')), 0, 3.32, 0.1);
  const knobBase = grp(doorLeaf, -0.33, 1.04, 0.14), knob = ball(knobBase, 0.085, '#c9a23a', 0, 0, 0.07);
  box(doorLeaf, 0.26, 0.14, 0.04, '#c9a23a', -0.33, 1.04, 0.1);
  cyl(knobBase, 0.1, 0.04, '#8a6a2a', 0, 0, 0.01).rotation.x = Math.PI / 2;
  // the stairs come down from the dark at the left, with a handrail
  for (let i = 0; i < 10; i++) {
    box(root, 1.9, 0.19 * (i + 1), 0.42, tmat(stoneTex('tread', ['#d6cab6', '#cabda8'], '#a89c86')), -4.2, 0.095 * (i + 1), -0.2 - i * 0.42);
    box(root, 0.5, 0.19, 0.42, tmat(stoneTex('nose', ['#e0d4c0', '#d4c8b2'], '#b0a48c')), -3.4, 0.095 * (i + 1), -0.2 - i * 0.42);
  }
  for (let i = 0; i < 8; i++) rod(root, [-3.05, 0.9 + i * 0.24, 0.1 - i * 0.42], [-3.05, 1.35 + i * 0.24, 0.1 - i * 0.42], 0.02, '#3f4a4a');
  rod(root, [-3.05, 1.4, 0.2], [-3.05, 3.2, -3.0], 0.035, '#3f4a4a');
  // the bottom steps come round into the landing, so the shot reads as a staircase
  for (let i = 0; i < 3; i++) {
    box(root, 2.2, 0.19 * (i + 1), 0.5, tmat(stoneTex('tread2', ['#d6cab6', '#cabda8'], '#a89c86')), -1.55 - i * 0.1, 0.095 * (i + 1), 2.6 - i * 0.5);
    box(root, 2.2, 0.06, 0.52, tmat(stoneTex('nose2', ['#e0d4c0', '#d4c8b2'], '#b0a48c')), -1.55 - i * 0.1, 0.19 * (i + 1), 2.6 - i * 0.5);
  }
  cyl(root, 0.09, 1.1, '#3f4a4a', -0.45, 0.55, 2.85, 0.1, 12); ball(root, 0.12, '#4a5555', -0.45, 1.15, 2.85);
  // a window high on the back wall, a bulb, a bucket and a mop
  tallWindow(root, -1.9, -3.0, 1.1, 1.5, 3.1);
  const bulb = grp(root, 0.2, 0, 0.9); cyl(bulb, 0.014, 1.2, '#2a2a30', 0, 2.9, 0); ball(bulb, 0.1, lit('#ffe9b8', 1.35), 0, 2.28, 0);
  const bucket = grp(root, -1.5, 0, -1.1); cyl(bucket, 0.19, 0.34, '#5a6a5a', 0, 0.17, 0); cyl(bucket, 0.17, 0.02, '#2f3a3a', 0, 0.33, 0);
  rod(bucket, [0.1, 0.3, 0], [0.3, 1.5, 0], 0.022, '#8a6a3a'); box(bucket, 0.22, 0.1, 0.06, '#c9b48a', 0.3, 1.52, 0);
  // her, the frame, the glass, and the cloth he wraps her in
  const herS = monaFrame(root, 0.2, 0.62, 0.35, 0.95); herS.g.rotation.set(-0.12, 0.55, 0.04);
  const frameBare = framed(root, 1.18, 1.62, tex('cratewood', 64, 64, (g) => { g.fillStyle = '#8a5a2c'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#5a3a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 20); g.lineTo(64, 24); g.stroke(); }), -0.8, 0.85, 0.4, {bar: 0.12, plain: true});
  frameBare.g.rotation.set(0.06, 0.4, 0.1);
  const glassLean = glassPane(root, 1.0, 1.35); glassLean.g.position.set(1.5, 0.72, -0.2); glassLean.g.rotation.set(-0.1, -0.45, 0.05);
  const clothG = grp(root, 0, 0, 0);
  for (let i = 0; i < 3; i++) { const c = box(clothG, 0.62 - i * 0.1, 0.14, 0.44 + i * 0.04, i % 2 ? '#e9e2d0' : '#ded5c0', 0, 0.07 + i * 0.12, 0); c.rotation.y = 0.08 * (i - 1); }
  const cloth = clothG;
  const per = actor(root, PERUGGIA(0), {a: {expr: 'smile', pose: 'low'}, b: {expr: 'nervous', pose: 'low'}, c: {expr: 'shock', pose: 'hold', prop: 'screwdriver'}, d: {expr: 'relief', pose: 'hold', prop: 'knob'}, e: {expr: 'smile', pose: 'tip'}, w: gait({mode: 'side', expr: 'smile'}, 6)} as Show, 0, 0, 0, {scale: 1});
  const plumber = actor(root, PLUMBER, {a: {expr: 'neutral', prop: 'bag'}, b: {expr: 'smile', pose: 'low', prop: 'pliers'}, w: gait({mode: 'side', expr: 'neutral', prop: 'bag'}, 6)} as Show, 0, 0, 0, {scale: 1});
  return {
    light: () => LIGHT.stair,
    tick: ({f, cam, shot}) => {
      const v = shot.v, a = shot.at;
      herS.g.visible = v === 'strip'; glassLean.g.visible = v === 'strip' || v === 'locked'; frameBare.g.visible = v === 'strip';
      cloth.visible = false; plumber.node.visible = v === 'plumber' || v === 'out'; per.node.visible = true;
      knob.visible = !(v === 'knob' && f > W(76)); knobBase.rotation.z = v === 'knob' && f > W(74) ? -horizon(f, W(74)) : 0;
      if (v === 'strip') {                                                                         // he kneels and strips the frame off her
        per.node.position.set(0.75, 0, 0.85); per.show(f > W(64) ? 'b' : 'a'); per.flip(true); per.tick(f, cam);
        const u = smooth(f, W(62), W(66));
        herS.g.position.set(lerp(0.2, 0.42, u), lerp(0.62, 0.34, u), lerp(0.35, 0.5, u)); herS.g.rotation.set(lerp(-0.12, -0.05, u), 0.55, 0.04);
        frameBare.g.position.set(lerp(-0.9, -0.75, u), 0.8, 0.35);
        cloth.visible = f > W(64); cloth.position.set(0.55, 0.02, 0.5); cloth.scale.setScalar(lerp(0.7, 1.05, smooth(f, W(64), W(68))));
      } else if (v === 'locked') {                                                                 // the handle turns; the door stays shut
        per.node.position.set(0.55, 0, -1.55); per.show(f >= W(71) ? 'b' : 'a'); per.tick(f, cam);
        doorLeaf.rotation.y = f > W(72) ? 0.008 * Math.sin(f * 1.6) : 0;
      } else if (v === 'knob') {                                                                   // the knob comes off in his hand
        per.node.position.set(1.05, 0, -1.7); per.show('c'); per.tick(f, cam);
      } else if (v === 'plumber' || v === 'out') {                                                 // the plumber comes down and lets him out
        const a0 = v === 'out' ? a - 6 : W(78), u = smooth(f, a0, a0 + 46);
        plumber.show(f < W(81) ? step(f) : 'b'); plumber.node.position.set(lerp(-3.2, 1.2, u), 0, lerp(0.6, -1.5, u)); plumber.flip(false); plumber.tick(f, cam);
        per.node.position.set(0.4, 0, -2.1); per.show(f >= W(83) ? 'e' : 'd'); per.flip(true); per.tick(f, cam);
        if (v === 'out') { const u2 = smooth(f, W(83), W(87)); per.node.position.set(lerp(0.4, 2.3, u2), 0, lerp(-2.1, -1.3, u2)); per.show(step(f)); doorLeaf.rotation.y = -1.15 * smooth(f, W(84), W(88)); }
      }
    },
  };
};
const horizon = (f: number, at: number) => Math.min(1, Math.max(0, (f - at) / 6)) * 1.2;

// ------------------------------------------------------------------ the photographers' studio
export const studio: Builder = (root) => {
  backdrop(root, ['#efe8d8', '#b9b0a0'], 0.95);
  boards(root, 12, 12, 'studio', '#b98a58', '#7a5228');
  plasterWall(root, 12, 4.8, -2.8, 'studio', '#e9e2d0');
  // a skylight, with two beams of daylight falling across the room
  box(root, 3.6, 0.1, 2.8, '#5a5f6a', 0, 4.7, -0.8).rotation.x = 0.05;
  panel(root, 3.4, 2.6, lit('#fffdf4', 1.3), 0, 4.64, -0.8).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 4.0, 18, 1, true), new THREE.MeshBasicMaterial({color: '#fff6dc', transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
    b.position.set(s * 1.1, 2.8, 0.3); b.rotation.z = s * 0.22; b.layers.set(1); root.add(b);
  }
  // a wall of canvases waiting, a table of glass plates, a backdrop sheet on its frame
  for (let i = 0; i < 4; i++) {
    const f2 = framed(root, i % 2 ? 0.7 : 0.95, i % 2 ? 0.95 : 0.65, oldMaster(i + 2, i % 2 === 0), -3.6 + i * 0.42, 0.75, -2.0 + i * 0.28, {bar: 0.05});
    f2.g.rotation.set(-0.07, 0.34, 0.16);
  }
  const sheet = grp(root, -2.4, 0, -1.2); box(sheet, 2.2, 3.4, 0.05, '#ded3bc', 0, 1.7, 0); box(sheet, 0.06, 3.5, 0.06, '#8a7a5a', -1.1, 1.75, -0.04); box(sheet, 2.3, 0.06, 0.06, '#8a7a5a', 0, 3.45, -0.04);
  const tableG = grp(root, 2.6, 0, -0.9); box(tableG, 1.5, 0.1, 0.8, '#8a5a2c', 0, 0.9, 0); for (const s of [-1, 1]) for (const q of [-1, 1]) box(tableG, 0.09, 0.9, 0.09, '#5a3a1c', s * 0.65, 0.45, q * 0.32);
  for (let i = 0; i < 3; i++) box(tableG, 0.3, 0.02, 0.4, '#bfe3ff', -0.4 + i * 0.36, 0.96, 0);
  // the big camera on its stand, its brass lens pointing at the wall where she used to be
  const camG = grp(root, 1.9, 0, -1.4);
  for (const s of [-1, 1]) rod(camG, [s * 0.45, 0, s * 0.35], [0, 1.15, 0], 0.03, '#5a3f28');
  rod(camG, [0, 0, -0.4], [0, 1.15, 0], 0.03, '#5a3f28');
  box(camG, 0.62, 0.52, 0.72, '#6a4526', 0, 1.5, 0); box(camG, 0.66, 0.06, 0.76, '#8a5a2c', 0, 1.78, 0);
  cyl(camG, 0.14, 0.3, '#c9a23a', 0, 1.5, -0.5).rotation.x = Math.PI / 2; cyl(camG, 0.1, 0.06, '#3a3a44', 0, 1.5, -0.66).rotation.x = Math.PI / 2;
  box(camG, 0.3, 0.36, 0.04, '#2a2a32', 0, 1.5, 0.38);
  const darkCloth = soft(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshBasicMaterial({color: '#2a2a32'})));
  darkCloth.scale.set(1.1, 1.35, 0.5); darkCloth.position.set(0.44, 1.48, 0.12); darkCloth.layers.set(1); camG.add(darkCloth);
  const lampS = grp(root, -0.6, 0, 1.1); cyl(lampS, 0.15, 0.05, '#3a3a42', 0, 0.02, 0); cyl(lampS, 0.03, 0.9, '#3a3a42', 0, 0.45, 0); cyl(lampS, 0.14, 0.2, '#c8642c', 0, 0.95, 0, 0.05, 12); ball(lampS, 0.11, lit('#ffe9b0', 1.5), 0, 1.0, 0);
  const photo = actor(root, PHOTOGRAPHER, {a: {expr: 'nervous', pose: 'shrug'}, b: {expr: 'stern', pose: 'point'}, c: {expr: 'nervous', pose: 'both'}} as Show, 0, 0, 0, {scale: 1});
  const mate = actor(root, WORKMAN(0), {a: {expr: 'neutral', pose: 'cross'}} as Show, 0, 0, 0, {scale: 0.97});
  return {
    light: () => LIGHT.studio,
    tick: ({f, cam}) => {
      photo.node.visible = mate.node.visible = true;
      photo.show(f >= W(110) ? 'c' : 'a'); photo.node.position.set(-0.55, 0, -1.0); photo.flip(true); photo.tick(f, cam);
      mate.show('a'); mate.node.position.set(0.2, 0, -0.85); mate.tick(f, cam);
    },
  };
};
