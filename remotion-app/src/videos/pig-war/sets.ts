// The place: Cutlar's claim on the south end of San Juan Island, 1859. A cabin, a potato patch in rows running
// down to the strait, Griffin's split-rail fence on the boundary, the bluff, the water, and — for shot 2 — a
// warship's bow hanging in the haze behind the pig. All geometry; nothing here is a painted flat except the sky.
import * as THREE from "three";
import { Batch, boxGeo, quad, lam, V } from "./build";
import { ctex, grassHD, planksHD, beamHD, stoneHD, roofHD, waterNear, waterFar, rng } from "./paint";

/** clodded, dry farm soil, with the furrow shadows baked low so the rows read from a low lens */
const soil = () => ctex("pigSoil", 512, 512, (g, r) => {
  g.fillStyle = "#8a6440"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 380; i++) {
    g.fillStyle = ["#7a5735", "#96704a", "#6d4d30", "#a07a51", "#815c3a"][Math.floor(r() * 5)];
    g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 11, 2 + r() * 7, r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 120; i++) { g.fillStyle = "rgba(255,236,200,.35)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2); }
});
/** a hedgerow / scrub green for the far side of the field */
const scrub = () => ctex("pigScrub", 256, 256, (g, r) => {
  g.fillStyle = "#3f6b3a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = ["#4e7f42", "#356033", "#5c8f47", "#2c522e"][Math.floor(r() * 4)];
    g.beginPath(); g.ellipse(r() * 256, r() * 256, 5 + r() * 12, 4 + r() * 9, r() * 3, 0, 7); g.fill();
  }
});

export const PATCH = { x0: -5.2, x1: 5.2, z0: -2.4, z1: 13.6, rowGap: 1.3, rowW: 0.52, rowTop: 0.26 };
export const FENCE_X = 5.8;
export const CABIN: [number, number] = [-9.0, 2.6];

/** ground, shore, water, far hills — shared by every shot */
export const buildLand = (R: THREE.Object3D) => {
  const b = new Batch();
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const sand = lam("shoreSand", () => ({ color: "#c9ab7c" }));
  // the field: one big plane, texture tiled every 12 m
  const field = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), grass);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  (grass.map as THREE.Texture | null)?.repeat?.set(75, 75);
  R.add(field);

  // shore: land runs out at x = 8, drops 6 m to the water by x = 13
  const slope = quad(V(8, 0, -900), V(8, 0, 900), V(13, -6, 900), V(13, -6, -900), 60, 1);
  b.add(slope, sand);
  b.build(R);
  // beach stones at the waterline
  const stoneMat = lam("stoneHD", () => ({ map: stoneHD() }));
  const rocks = new Batch();
  for (let i = 0; i < 26; i++) {
    const z = -40 + i * 3.1, s = 0.3 + ((i * 37) % 7) / 10;
    rocks.add(new THREE.DodecahedronGeometry(s, 0).translate(11.4 + ((i * 13) % 5) / 4, -6 + s * 0.4, z), stoneMat);
  }
  rocks.build(R, false);

  // water: two texture scales, the near band with crests, the far band fine
  const wn = lam("waterNear", () => ({ map: waterNear() }));
  const wf = lam("waterFar", () => ({ map: waterFar() }));
  const near = new THREE.Mesh(new THREE.PlaneGeometry(120, 1200), wn);
  near.rotation.x = -Math.PI / 2;
  near.position.set(60, -6, 0);
  R.add(near);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), wf);
  far.rotation.x = -Math.PI / 2;
  far.position.set(760, -6.02, 0);
  R.add(far);

  // far hills across the strait: flat-topped ridges, hazed by fog
  const hill = lam("farHill", () => ({ color: "#6d7f86" }));
  const hills = new Batch();
  for (const [z, w, h, d] of [[-420, 520, 74, 150], [40, 460, 58, 130], [430, 560, 88, 170]] as const) {
    hills.add(new THREE.CylinderGeometry(w * 0.22, w * 0.42, h, 7, 1).translate(1180, h / 2 - 6, z), hill);
    hills.add(new THREE.CylinderGeometry(w * 0.16, w * 0.36, h * 0.7, 6, 1).translate(1330, h * 0.35 - 6, z + d), hill);
  }
  hills.build(R, false);
};

/** Cutlar's cabin: log walls, a plank door on the patch side, one window, a stone chimney */
export const buildCabin = (R: THREE.Object3D) => {
  const [cx, cz] = CABIN;
  const b = new Batch();
  const logs = lam("cabinLogs", () => ({ map: planksHD() }));
  const trim = lam("cabinBeam", () => ({ map: beamHD() }));
  const stone = lam("cabinStone", () => ({ map: stoneHD() }));
  const roofM = lam("cabinRoof", () => ({ map: roofHD("#6b5c48") }));
  const glass = lam("cabinGlass", () => ({ color: "#2a2f38" }));
  const W = 5.6, D = 4.4, H = 2.45, y0 = 0.06;
  // walls
  b.add(boxGeo(V(cx - W / 2, y0, cz - D / 2), V(cx + W / 2, y0 + H, cz + D / 2), 2.0), logs);
  // gable ends: the ridge runs front-to-back, so the triangle faces the patch (+x wall) and the door side reads as a cabin
  const gableH = 1.9, x0 = cx - W / 2, x1 = cx + W / 2, z0 = cz - D / 2, z1 = cz + D / 2, yt = y0 + H;
  for (const x of [x0, x1]) {
    const out = x === x1 ? 1 : -1;
    b.add(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(
      [x, yt, z0, x, yt, z1, x, yt + gableH, cz], 3)).setAttribute("normal", new THREE.Float32BufferAttribute(
      [out, 0, 0, out, 0, 0, out, 0, 0], 3)).setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2.2, 0, 1.1, 0.95], 2)), logs);
  }
  // roof: two slopes from the ridge down to the eaves on the +-z sides, top and underside
  const eaveX = W / 2 + 0.46, eaveZ = D / 2 + 0.55, eaveDrop = (gableH * eaveX) / (W / 2);
  const roofM2 = lam("cabinRoof", () => ({ map: roofHD("#6b5c48") }));
  roofM2.side = THREE.DoubleSide;
  const ridgeA = V(cx, yt + gableH + 0.04, z0 - 0.55), ridgeB = V(cx, yt + gableH + 0.04, z1 + 0.55);
  for (const sgn of [-1, 1]) {
    const eaveA = V(cx + sgn * eaveX, yt + gableH - eaveDrop, z0 - 0.55);
    const eaveB = V(cx + sgn * eaveX, yt + gableH - eaveDrop, z1 + 0.55);
    const A = sgn > 0 ? ridgeA : ridgeB, B = sgn > 0 ? ridgeB : ridgeA;
    const C = sgn > 0 ? eaveB : eaveA, D2 = sgn > 0 ? eaveA : eaveB;
    b.add(quad(A, B, C, D2, 2.4, 3.2), roofM2);
    const down = V(0, -0.13, 0);
    b.add(quad(D2.clone().add(down), C.clone().add(down), B.clone().add(down), A.clone().add(down), 2.4, 3.2), roofM2);
  }
  b.add(boxGeo(V(cx - 0.16, yt + gableH - 0.02, z0 - 0.55), V(cx + 0.16, yt + gableH + 0.16, z1 + 0.55), 1.4), trim);
  // door on the patch side (+x wall), window beside it
  b.add(boxGeo(V(cx + W / 2 - 0.02, y0, cz + 0.55), V(cx + W / 2 + 0.06, y0 + 1.95, cz + 1.45), 0.9), trim);
  b.add(boxGeo(V(cx + W / 2 - 0.02, y0, cz - 1.35), V(cx + W / 2 + 0.05, y0 + 1.05, cz - 0.35), 0.7), glass);
  b.add(boxGeo(V(cx + W / 2 - 0.02, y0 - 0.02, cz - 1.43), V(cx + W / 2 + 0.1, y0 + 1.13, cz - 0.27), 0.5), trim);
  // chimney
  b.add(boxGeo(V(cx - W / 2 + 0.5, y0, cz - D / 2 - 0.55), V(cx - W / 2 + 1.5, y0 + H + gableH + 0.85, cz - D / 2 + 0.45), 0.5), stone);
  // porch step
  b.add(boxGeo(V(cx + W / 2, y0 - 0.02, cz + 0.3), V(cx + W / 2 + 0.5, y0 + 0.16, cz + 1.7), 0.5), trim);
  b.build(R);

  // path from the door out to the rows
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 7), lam("pigSoil", () => ({ map: soil() })));
  dirt.rotation.x = -Math.PI / 2;
  dirt.rotation.z = Math.PI / 2;
  dirt.position.set(cx + W / 2 + 3.4, 0.03, cz + 1.0);
  dirt.receiveShadow = true;
  R.add(dirt);
};

/** the potato patch: furrows, 13 ridges of soil with the plants on top */
export const buildPatch = (R: THREE.Object3D) => {
  const b = new Batch();
  const dirt = lam("pigSoil", () => ({ map: soil() }));
  const leaf = lam("potatoLeaf", () => ({ color: "#6f9c46" }));
  const leaf2 = lam("potatoLeaf2", () => ({ color: "#82ac52" }));
  const stem = lam("potatoStem", () => ({ color: "#4e6f34" }));

  // the patch floor, sunk 4 cm so the ridges stand proud of it
  b.add(quad(V(PATCH.x0, 0.03, PATCH.z1), V(PATCH.x1, 0.03, PATCH.z1), V(PATCH.x1, 0.03, PATCH.z0), V(PATCH.x0, 0.03, PATCH.z0), 5.6, 8.4), dirt);

  const push = (g: THREE.BufferGeometry, m: THREE.Matrix4) => b.add(g, dirt, m);
  const rnd = rng(7);
  for (let z = PATCH.z0 + 0.5, k = 0; z < PATCH.z1; z += PATCH.rowGap, k++) {
    // the ridge itself: a long low mound (box with a rounded top edge), one per row
    const g = boxGeo(V(PATCH.x0, 0, z - PATCH.rowW / 2), V(PATCH.x1, PATCH.rowTop, z + PATCH.rowW / 2), 1.2);
    push(g, new THREE.Matrix4());
    // plants down the ridge
    for (let x = PATCH.x0 + 0.22; x < PATCH.x1 - 0.16; x += 0.34) {
      const jx = (rnd() - 0.5) * 0.14, jz = (rnd() - 0.5) * 0.22, s = 0.7 + rnd() * 0.55;
      // a low clump of leaves, three lobes, sitting on the crown of the ridge
      for (let k2 = 0; k2 < 3; k2++) {
        const a = rnd() * Math.PI * 2, r = 0.06 * s;
        const t = new THREE.Matrix4().compose(
          V(x + jx + Math.cos(a) * r, PATCH.rowTop + (0.05 + rnd() * 0.05) * s, z + jz + Math.sin(a) * r),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 0.5, rnd() * 3, rnd() * 0.5)),
          V(0.095 * s, 0.065 * s, 0.09 * s));
        b.add(new THREE.IcosahedronGeometry(1, 1), rnd() > 0.5 ? leaf : leaf2, t);
      }
      const t2 = new THREE.Matrix4().compose(V(x + jx, PATCH.rowTop + 0.03, z + jz),
        new THREE.Quaternion(), V(0.03, 0.06, 0.03));
      b.add(new THREE.CylinderGeometry(0.7, 1, 1, 5), stem, t2);
    }
  }
  b.build(R);

  // hoofprints and a boot print in the furrow (shots 1, 19)
  const print = lam("printDark", () => ({ color: "#5c3f27" }));
  const pb = new Batch();
  for (let i = 0; i < 9; i++) {
    const x = -3.4 + i * 0.92, z = 5.84 + Math.sin(i * 1.7) * 0.09;
    const t = new THREE.Matrix4().compose(V(x, 0.012, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 0.3, 0)), V(0.07, 0.008, 0.05));
    pb.add(new THREE.CylinderGeometry(1, 1, 1, 8), print, t);
  }
  pb.build(R, false);
};

/** Griffin's boundary fence: split rails, one bottom rail sprung out of its socket at the pig's crossing */
export const buildFence = (R: THREE.Object3D) => {
  const b = new Batch();
  const wood = lam("fenceWood", () => ({ map: beamHD() }));
  const GAP: [number, number] = [6.1, 7.7]; // the sprung section
  for (let z = PATCH.z0; z <= PATCH.z1 + 0.2; z += 2.45) {
    b.add(boxGeo(V(FENCE_X - 0.07, 0, z - 0.07), V(FENCE_X + 0.07, 1.28, z + 0.07), 0.6), wood);
  }
  for (const [y, h] of [[0.98, 0.1], [1.24, 0.09]] as const) {
    b.add(boxGeo(V(FENCE_X - 0.05, y, PATCH.z0), V(FENCE_X + 0.05, y + h, PATCH.z1 + 0.1), 1.2), wood);
  }
  // bottom rail, in two runs with the sprung piece lying at an angle across the gap
  b.add(boxGeo(V(FENCE_X - 0.05, 0.6, PATCH.z0), V(FENCE_X + 0.05, 0.7, GAP[0]), 1.2), wood);
  b.add(boxGeo(V(FENCE_X - 0.05, 0.6, GAP[1]), V(FENCE_X + 0.05, 0.7, PATCH.z1 + 0.1), 1.2), wood);
  const sprung = new THREE.Matrix4().compose(V(FENCE_X - 0.35, 0.52, (GAP[0] + GAP[1]) / 2),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.22, -0.16)), V(1, 1, 1));
  b.add(boxGeo(V(-0.05, -0.05, -0.82), V(0.05, 0.05, 0.82), 1.2), wood, sprung);
  b.build(R);
};

/** the treeline behind the field, so the horizon is not a bare line */
export const buildTreeline = (R: THREE.Object3D) => {
  const b = new Batch();
  const scr = lam("pigScrub", () => ({ map: scrub() }));
  const trunk = lam("scrubTrunk", () => ({ color: "#4b3a28" }));
  const rnd = rng(19);
  for (let i = 0; i < 26; i++) {
    const x = -70 + rnd() * 78, z = 26 + rnd() * 90, h = 5 + rnd() * 7;
    b.add(new THREE.CylinderGeometry(0.22, 0.34, h * 0.5, 6).translate(x, h * 0.25, z), trunk);
    b.add(new THREE.ConeGeometry(h * 0.34, h, 7).translate(x, h * 0.62, z), scr);
    if (i % 3 === 0) b.add(new THREE.CylinderGeometry(0.2, 0.3, h * 0.35, 6).translate(x - 9, h * 0.18, z + 16), trunk);
    if (i % 3 === 0) b.add(new THREE.SphereGeometry(h * 0.34, 9, 7).translate(x - 9, h * 0.55, z + 16), scr);
  }
  // a hedgerow on the far boundary
  for (let z = -30; z < 26; z += 3.2) b.add(new THREE.SphereGeometry(1.5, 8, 6).translate(13.6 + Math.sin(z) * 0.6, 0.9, z), scr);
  b.build(R, false);
};

/** the warship on the strait: a sloop's bow, masts and furled sails, riding at anchor off the bluff */
export const buildShip = (parent: THREE.Object3D) => {
  const g = new THREE.Group();
  const hull = lam("shipHull", () => ({ color: "#2a2b31" }));
  const band = lam("shipBand", () => ({ color: "#c8b48a" }));
  const mast = lam("shipMast", () => ({ color: "#b99a6a" }));
  const sail = lam("shipSail", () => ({ color: "#e6dfd0" }));
  const L = 34, B = 9.5, D = 2.8;
  const b = new Batch();
  // hull: three tapered boxes (bow, waist, stern), then a band and a deck
  b.add(boxGeo(V(-L / 2, -1.6, -B / 2), V(L / 2 - 6, D, B / 2), 0), hull);
  // bow: a four-sided wedge off the front of the box, tapering to a stem
  const bowGeo = new THREE.ConeGeometry(B * 0.72, 7, 4, 1);
  b.add(bowGeo, hull, new THREE.Matrix4().compose(V(L / 2 - 2.4, (D - 1.6) / 2, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, -Math.PI / 2)), V(1, 1, 1)));
  b.add(boxGeo(V(-L / 2, D - 0.3, -B / 2 - 0.05), V(L / 2 - 6, D, B / 2 + 0.05), 0), band);
  b.add(boxGeo(V(-L / 2 + 0.6, D, -B / 2 + 0.5), V(L / 2 - 6, D + 0.12, B / 2 - 0.5), 0), mast);
  // bulwarks
  for (const s of [-1, 1]) b.add(boxGeo(V(-L / 2, D, s * (B / 2 - 0.25)), V(L / 2 - 6, D + 0.85, s * (B / 2)), 0), hull);
  b.build(g);

  // masts + yards + furled sails
  const sails: THREE.Mesh[] = [];
  for (const [x, h] of [[-4.5, 22], [2.5, 25], [9.5, 19]] as const) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, h, 8), mast);
    m.position.set(x, D + h / 2, 0);
    g.add(m);
    for (let i = 0; i < 3; i++) {
      const y = D + h * (0.35 + i * 0.22), w = (10 - i * 2.4) * (i === 2 ? 0.7 : 1);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, w, 6), mast);
      yard.rotation.set(Math.PI / 2, 0, 0);
      yard.position.set(x, y, 0);
      g.add(yard);
      const s = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.5, 0.42), sail);
      s.position.set(x, y - 0.42, 0);
      g.add(s);
      sails.push(s);
    }
  }
  // bowsprit, angled up and forward
  const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 13, 6), mast);
  spar.position.set(L / 2 + 2.4, D + 1.5, 0);
  spar.rotation.z = -Math.PI / 2 + 0.28;
  g.add(spar);
  // bow-chaser ports
  const port = lam("shipPort", () => ({ color: "#15161a" }));
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), port);
    p.position.set(L / 2 - 7.4, D - 0.5, s * (B / 2 + 0.02));
    g.add(p);
  }
  parent.add(g);
  return { group: g, sails };
};
