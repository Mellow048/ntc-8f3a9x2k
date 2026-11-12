// The rest of the island. Each builder fills a group at the world origin with one location; world.ts keeps only
// the set the current shot needs, so fourteen places cost one place's worth of memory at a time.
// Everything is geometry with painted textures from paint.ts — same materials and two-tone shading as the patch.
import * as THREE from "three";
import { Batch, boxGeo, lam, V } from "./build";
import { ctex, grassHD, planksHD, beamHD, stoneHD, cobbleHD, roofHD, waterNear, waterFar, rng } from "./paint";
import { buildShip } from "./sets";

const flat = (w: number, d: number, y: number) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(0, y, 0);

/** painted ground plane, tiled */
const ground = (R: THREE.Object3D, tex: THREE.Material, w: number, d: number, rep: number, y = 0) => {
  const map = (tex as THREE.MeshLambertMaterial).map;
  map?.repeat?.set(rep, rep);
  const m = new THREE.Mesh(flat(w, d, y), tex);
  m.receiveShadow = true;
  R.add(m);
  return m;
};

const seaMat = (() => {
  let n = lam("waterNear", () => ({ map: waterNear() }));
  let f = lam("waterFar", () => ({ map: waterFar() }));
  return { near: n, far: f };
})();

/** water out to the horizon, with a shallow band of crests near the lens */
const water = (R: THREE.Object3D, y: number) => {
  for (const [w, d, mat, yy] of [[260, 900, seaMat.near, y], [1800, 1800, seaMat.far, y - 0.02]] as const) {
    const m = new THREE.Mesh(flat(w, d, yy), mat);
    R.add(m);
  }
};

const hillMat = () => lam("farHill", () => ({ color: "#6d7f86" }));
const sandMat = () => lam("shoreSand", () => ({ color: "#c9ab7c" }));

/** a soft ridge of hills across the back of a shot */
const farHills = (R: THREE.Object3D, z: number, h: number, n = 5) => {
  const b = new Batch();
  const rnd = rng(31);
  for (let i = 0; i < n; i++) {
    const w = 220 + rnd() * 320, hh = h * (0.6 + rnd() * 0.8);
    b.add(new THREE.CylinderGeometry(w * 0.2, w * 0.45, hh, 8, 1).translate(-500 + i * (1000 / n) + rnd() * 60, hh / 2 - 4, z - rnd() * 120), hillMat());
  }
  b.build(R, false);
};

// ---------------- Belle Vue: the Company's farm ----------------
/** sheep: a wool body, a dark face, four black legs. Batched, so 80 of them cost one draw. */
export const addSheep = (b: Batch, x: number, z: number, yaw: number, s = 1, y = 0) => {
  const wool = lam("sheepWool", () => ({ color: "#e8e2d4" }));
  const face = lam("sheepFace", () => ({ color: "#3a3330" }));
  const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), V(s, s, s));
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, off: THREE.Vector3, sc: THREE.Vector3) => {
    const t = new THREE.Matrix4().compose(off, new THREE.Quaternion(), sc);
    b.add(geo, mat, new THREE.Matrix4().multiplyMatrices(m, t));
  };
  part(new THREE.SphereGeometry(1, 12, 9), wool, V(0, 0.52, 0), V(0.42, 0.3, 0.3));
  part(new THREE.SphereGeometry(1, 10, 8), face, V(0.44, 0.56, 0), V(0.15, 0.13, 0.12));
  for (const [dx, dz] of [[0.25, 0.16], [0.25, -0.16], [-0.25, 0.16], [-0.25, -0.16]])
    part(new THREE.CylinderGeometry(0.035, 0.03, 0.34, 5), face, V(dx, 0.17, dz), V(1, 1, 1));
};

export const buildBellevue = (R: THREE.Object3D) => {
  ground(R, lam("grassHD", () => ({ map: grassHD() })), 700, 700, 75);
  const b = new Batch();
  const rnd = rng(11);
  // the flock on the slope
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI - Math.PI / 2, r = 20 + rnd() * 90;
    addSheep(b, Math.cos(a) * r * 0.7, -30 + Math.sin(a) * r * 0.5, rnd() * 6.28, 0.9 + rnd() * 0.3, 0);
  }
  // the landing beach + jetty
  b.add(flat(90, 40, 0.02).translate(-70, 0, 34), sandMat());
  b.build(R);
  const jetty = new Batch();
  for (let i = 0; i < 14; i++) {
    for (const s of [-1, 1]) jetty.add(boxGeo(V(-108 + i * 0.9, -0.4, 30 + s * 1.5), V(-108 + i * 0.9 + 0.8, 0.12, 30 + s * 1.5 + 0.16), 0.6), lam("fenceWood", () => ({ map: beamHD() })));
    jetty.add(boxGeo(V(-100 + i * 0.6, -2.4, 29.6), V(-100 + i * 0.6 + 0.3, 0.1, 30 + 3.4), 0.6), lam("planksHD", () => ({ map: planksHD() })));
  }
  jetty.build(R);

  // the farm buildings: barn, storehouse, the office
  const logs = lam("cabinLogs", () => ({ map: planksHD() }));
  const roofM = lam("cabinRoof", () => ({ map: roofHD("#6b5c48") }));
  const barn = new Batch();
  barn.add(boxGeo(V(-46, 0, -44), V(-16, 4.4, -26), 3.0), logs);
  // roof: two slabs from a ridge down to the eaves, overhanging both ends
  const slope = Math.atan2(2.2, 8.6);
  for (const sgn of [-1, 1]) {
    const m = new THREE.Matrix4().compose(V(-31, 5.4, -31 + sgn * 4.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(sgn * slope, 0, 0)), V(1, 1, 1));
    barn.add(boxGeo(V(-1.5, -0.1, -4.9), V(1.5, 0.1, 4.9), 3.0), roofM, new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeScale(10, 1, 1)));
  }
  barn.add(boxGeo(V(-38, 0, -56), V(-30, 4.0, -48), 2.4), logs);
  barn.add(boxGeo(V(-39, 3.9, -48), V(-29, 4.4, -56), 2.4), roofM);
  barn.build(R);

  // the Company's office: a whitewashed cottage with a porch
  const white = lam("officeWall", () => ({ color: "#e6dfcf" }));
  const off = new Batch();
  off.add(boxGeo(V(12, 0, -30), V(24, 3.4, -20), 2.4), white);
  off.add(boxGeo(V(11.4, 3.3, -19.4), V(24.6, 3.8, -30.6), 2.4), roofM);
  off.add(boxGeo(V(11, 0, -19), V(25, 0.16, -16.6), 2.0), lam("planksHD", () => ({ map: planksHD() })));
  off.build(R);

  // the yard fence and a cart
  const fence = new Batch();
  for (let z = -18; z < 16; z += 2.6) fence.add(boxGeo(V(9.7, 0, z - 0.07), V(9.9, 1.3, z + 0.07), 0.6), lam("fenceWood", () => ({ map: beamHD() })));
  for (const y of [0.55, 0.95, 1.2]) fence.add(boxGeo(V(9.75, y, -18), V(9.9, y + 0.1, 16), 1.2), lam("fenceWood", () => ({ map: beamHD() })));
  fence.add(boxGeo(V(20, 0, 2), V(23.4, 0.9, 3.4), 1.0), lam("planksHD", () => ({ map: planksHD() })));
  fence.build(R);
  farHills(R, -320, 60, 6);
};

// ---------------- the strait, the island, the fleet ----------------
export const buildSea = (R: THREE.Object3D) => {
  water(R, -6);
  // the island: a long ridge with a bluff, so shots 3, 4, 7 and 51 have a shore to look at
  const b = new Batch();
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const rnd = rng(5);
  for (let i = 0; i < 9; i++) {
    const w = 120 + rnd() * 90;
    b.add(new THREE.CylinderGeometry(w * 0.36, w * 0.5, 26 + rnd() * 16, 9, 1).translate(-420 + i * 110, 2, -260 - rnd() * 60), grass);
  }
  b.add(flat(900, 120, 0.4).translate(-200, 0, -180), grass);
  b.build(R, false);
  // three hulls at anchor
  const fleet: THREE.Group[] = [];
  for (const [x, z, ry] of [[34, -150, 0.5], [92, -190, 0.9], [150, -160, 0.2]] as const) {
    const s = buildShip(R);
    s.group.position.set(x, -6, z);
    s.group.rotation.y = Math.PI + ry;
    s.group.scale.setScalar(1.35);
    fleet.push(s.group);
  }
  void fleet;
  farHills(R, -700, 120, 5);
};

// ---------------- the camps ----------------
export const buildCamp = (R: THREE.Object3D) => {
  ground(R, lam("campGround", () => ({ map: grassHD() })), 700, 700, 75);
  const dirt = lam("campDirt", () => ({ map: cobbleHD() }));
  const planks = lam("planksHD", () => ({ map: planksHD() }));
  const canvas = lam("campCanvas", () => ({ color: "#ded6c2" }));
  const b = new Batch();
  b.add(flat(70, 46, 0.02), dirt);
  // parade ground edge markers
  for (let i = -6; i <= 6; i++) b.add(boxGeo(V(i * 5.4 - 0.1, 0, 22.6), V(i * 5.4 + 0.1, 0.9, 22.8), 0.5), planks);
  // tents: a row of white wedges
  for (let i = 0; i < 7; i++) {
    const x = -22 + i * 7.2;
    b.add(new THREE.CylinderGeometry(2.2, 2.2, 4.4, 3, 1).rotateZ(Math.PI / 2).rotateY(0).translate(x, 1.0, -16), canvas);
  }
  // blockhouse on the knoll
  b.add(boxGeo(V(-6, 0, -44), V(10, 5.4, -30), 3.0), planks);
  b.add(boxGeo(V(-7, 5.2, -29), V(11, 5.8, -45), 3.0), lam("cabinRoof", () => ({ map: roofHD("#6b5c48") })));
  // the redoubt: a turf berm with an embrasure gap
  for (const [x0, x1] of [[-40, -8], [8, 40]]) {
    b.add(boxGeo(V(x0, 0, 4), V(x1, 1.9, 8), 2.0), lam("turf", () => ({ color: "#6f8a45" })));
    b.add(boxGeo(V(x0, 1.9, 4), V(x1, 2.05, 8.6), 1.5), lam("turfTop", () => ({ color: "#7d9a4c" })));
  }
  // the little cemetery on the rise: white slabs
  const stone = lam("campStone", () => ({ color: "#e9e6dc" }));
  for (let i = 0; i < 11; i++) {
    const x = 26 + (i % 4) * 1.9 + (i > 3 ? 0.4 : 0), z = -52 - Math.floor(i / 4) * 2.6;
    b.add(boxGeo(V(x, 0, z), V(x + 0.55, 0.85, z + 0.14), 0.4), stone);
  }
  // the formal garden: beds, box hedges, roses
  const soil = lam("gardenSoil", () => ({ color: "#6b5136" }));
  const hedge = lam("gardenHedge", () => ({ color: "#4f6b39" }));
  const rose = lam("gardenRose", () => ({ color: "#c9556b" }));
  for (let i = 0; i < 3; i++) {
    const z = -4 + i * 3.4;
    b.add(boxGeo(V(18, 0.02, z), V(32, 0.12, z + 1.5), 1.0), soil);
    for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.42, 8, 6).translate(19 + k * 1.9, 0.4, z + 0.75), k % 2 ? hedge : rose);
    b.add(boxGeo(V(18, 0.1, z - 0.5), V(32, 0.62, z - 0.1), 1.0), hedge);
  }
  // tennis court: a chalked rectangle on the lawn
  const chalk = lam("chalk", () => ({ color: "#e8e4d6" }));
  for (const [a, c] of [[[-14, -6], [4, -6.3]], [[-14, 4], [4, 3.7]], [[-14.3, -6], [-14, 4]], [[3.7, -6], [4, 4]]] as const)
    b.add(boxGeo(V(a[0], 0.03, a[1]), V(c[0], 0.06, c[1]), 0.5), chalk);
  b.build(R);
  farHills(R, -600, 90, 5);
};

// ---------------- interiors: chart table, offices, the Geneva room ----------------
export const buildRoom = (R: THREE.Object3D) => {
  const wood = lam("planksHD", () => ({ map: planksHD() }));
  const wall = lam("roomWall", () => ({ color: "#d9cbb0" }));
  const plaster = lam("roomPlaster", () => ({ color: "#e2d8c2" }));
  const b = new Batch();
  // shell: floor, four walls, ceiling
  b.add(flat(9, 8, 0).translate(0, 0.01, 0), wood);
  for (const [x, z, w, d] of [[0, -4, 9, 0.2], [0, 4, 9, 0.2], [-4.5, 0, 0.2, 8], [4.5, 0, 0.2, 8]] as const)
    b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, 3.3, z + d / 2), 2.4), wall);
  b.add(boxGeo(V(-4.5, 3.3, -4), V(4.5, 3.5, 4), 2.0), plaster);
  // window on the far wall, with light behind it
  b.add(boxGeo(V(-1.1, 1.3, -4.12), V(1.1, 2.7, -3.98), 0.8), lam("roomGlass", () => ({ color: "#dfe9f2" })));
  b.build(R);
  // the long table: chart, papers, a brass ruler, a lamp
  const t = new Batch();
  t.add(boxGeo(V(-1.5, 0.9, -1.0), V(1.5, 0.97, 0.7), 1.4), wood);
  for (const [x, z] of [[-1.35, -0.85], [1.35, -0.85], [-1.35, 0.55], [1.35, 0.55]])
    t.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 0.9, z + 0.07), 1.0), wood);
  // the chart itself: a painted sheet with a coastline and a channel
  const chartTex = ctex("chartSheet", 1024, 640, (g, r) => {
    g.fillStyle = "#efe3c6"; g.fillRect(0, 0, 1024, 640);
    g.strokeStyle = "rgba(120,90,60,.35)"; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const y = i * 26; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y + (r() - 0.5) * 6); g.stroke(); }
    g.fillStyle = "#e7d7b2"; g.beginPath(); g.moveTo(140, 0); g.bezierCurveTo(260, 180, 200, 420, 330, 640); g.lineTo(0, 640); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = "#d8c9a6"; g.beginPath(); g.moveTo(700, 0); g.bezierCurveTo(640, 220, 760, 400, 690, 640); g.lineTo(1024, 640); g.lineTo(1024, 0); g.closePath(); g.fill();
    g.strokeStyle = "#3a6ea8"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(420, 40); g.bezierCurveTo(470, 240, 520, 380, 500, 600); g.stroke();
    g.strokeStyle = "#8a3b2e"; g.lineWidth = 4; g.setLineDash([14, 10]);
    g.beginPath(); g.moveTo(300, 40); g.bezierCurveTo(340, 240, 360, 380, 340, 600); g.stroke();
  });
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), lam("chartSheet", () => ({ map: chartTex })));
  chart.rotation.x = -Math.PI / 2;
  chart.position.set(0, 0.98, -0.12);
  R.add(chart);
  t.build(R);
  // lamp: a warm emissive globe over a brass stand
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.1, 1.3) });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), lampMat);
  globe.position.set(1.5, 1.32, 0.55);
  R.add(globe);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 8), lam("brass", () => ({ color: "#b08c3f" })));
  post.position.set(1.5, 1.12, 0.55);
  R.add(post);
};

// ---------------- a ship's deck ----------------
export const buildDeck = (R: THREE.Object3D) => {
  const planks = lam("planksHD", () => ({ map: planksHD() }));
  const dark = lam("shipHull", () => ({ color: "#2a2b31" }));
  const b = new Batch();
  // deck, bulwarks, deck furniture
  b.add(boxGeo(V(-4, -0.3, -9), V(4, 0, 9), 1.6), planks);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(s > 0 ? 3.7 : -4.1, 0, -9), V(s > 0 ? 4.1 : -3.7, 1.0, 9), 1.2), planks);
    b.add(boxGeo(V(s > 0 ? 3.6 : -4.2, 1.0, -9), V(s > 0 ? 4.2 : -3.6, 1.12, 9), 1.2), dark);
    // guns in a row, run out
    for (let i = -2; i <= 2; i++) {
      b.add(new THREE.CylinderGeometry(0.19, 0.24, 1.8, 10).rotateZ(Math.PI / 2).translate(s * 3.1, 0.55, i * 3.2), dark);
      b.add(boxGeo(V(s * 3.0 - 0.4, 0, i * 3.2 - 0.4), V(s * 3.0 + 0.4, 0.42, i * 3.2 + 0.4), 0.6), lam("cabinBeam", () => ({ map: beamHD() })));
    }
  }
  // the mast and its rigging
  b.add(new THREE.CylinderGeometry(0.22, 0.3, 16, 10).translate(0, 8, -2), lam("shipMast", () => ({ color: "#b99a6a" })));
  b.build(R);
  water(R, -6);
  farHills(R, -520, 70, 4);
};

// ---------------- Gettysburg, seen from a long way off ----------------
export const buildField = (R: THREE.Object3D) => {
  ground(R, lam("grassHD", () => ({ map: grassHD() })), 900, 900, 75);
  const b = new Batch();
  const trees = lam("pigScrub", () => ({ color: "#43643a" }));
  const rnd = rng(23);
  for (let i = 0; i < 30; i++) {
    const x = -180 + rnd() * 360, z = -150 - rnd() * 60, h = 7 + rnd() * 9;
    b.add(new THREE.ConeGeometry(h * 0.3, h, 6).translate(x, h * 0.5, z), trees);
  }
  b.build(R, false);
  farHills(R, -520, 70, 5);
};
