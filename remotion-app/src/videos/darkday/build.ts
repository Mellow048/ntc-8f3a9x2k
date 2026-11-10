// Procedural 3D architecture & props for "The Dark Day" (May 19, 1780) — one unified Three.js scene.
// Every surface uses the skill's painted Canvas2D textures (paint.ts) and stylised two-tone
// shadow-mapped Lambert/Phong shading (shade.ts twoTone), with clean normals so InkPass outlines
// silhouettes cleanly. Zero external GLBs needed.
//
// Sets: STREET (meeting-house common + clapboard main street) · DESK (Williams' Harvard study) ·
// LAMP (hand-over-a-lamp analogy) · FIRE (the Ontario horizon, 200 miles away) · TREE (2007 scar ring)

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  ctex, rep, facadeHD, roofHD, stoneHD, cobbleHD, grassHD, planksHD, beamHD, brick, rng,
} from "./paint";
import { twoTone } from "./shade";
import type { FgKind, V3 } from "./story";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export type Ray = { o: THREE.Vector3; d: THREE.Vector3; len: number; core: boolean };

// ---------------- materials (shared, cached, all twoTone) ----------------
const mats = new Map<string, THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters, liftK = 1) => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(make()), liftK);
    mats.set(key, m);
  }
  return m;
};
export const phong = (key: string, make: () => THREE.MeshPhongMaterialParameters, liftK = 1) => {
  let m = mats.get(key) as THREE.MeshPhongMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshPhongMaterial(make()), liftK);
    mats.set(key, m);
  }
  return m;
};

// ---------------- geometry helpers ----------------
const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) {
    for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  }
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};

export const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1, u0 = 0, v0 = 0) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
};

export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3, tile = 0, bottom = false) => {
  const [x0, y0, z0] = [min.x, min.y, min.z], [x1, y1, z1] = [max.x, max.y, max.z];
  const t = (a: number) => (tile ? a / tile : 1);
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const faces = [
    quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), t(w), t(h)),
    quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), t(h)),
    quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), t(h)),
    quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), t(h)),
    quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d)),
  ];
  if (bottom) faces.push(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)));
  return mergeGeometries(faces, false);
};

/** Tapered frustum box (bottom half-widths wx0, wz0 at y0 -> top half-widths wx1, wz1 at y1) */
export const frustumBox = (y0: number, y1: number, wx0: number, wz0: number, wx1: number, wz1: number, tile = 4) => {
  const u = (w: number) => (tile ? (2 * w) / tile : 1);
  const v = tile ? (y1 - y0) / tile : 1;
  return mergeGeometries([
    quad(V(-wx0, y0, wz0), V(wx0, y0, wz0), V(wx1, y1, wz1), V(-wx1, y1, wz1), u(wx1), v),
    quad(V(wx0, y0, -wz0), V(-wx0, y0, -wz0), V(-wx1, y1, -wz1), V(wx1, y1, -wz1), u(wx1), v),
    quad(V(-wx0, y0, -wz0), V(-wx0, y0, wz0), V(-wx1, y1, wz1), V(-wx1, y1, -wz1), u(wz1), v),
    quad(V(wx0, y0, wz0), V(wx0, y0, -wz0), V(wx1, y1, -wz1), V(wx1, y1, wz1), u(wz1), v),
    quad(V(-wx1, y1, wz1), V(wx1, y1, wz1), V(wx1, y1, -wz1), V(-wx1, y1, -wz1), u(wx1), u(wz1)),
    quad(V(-wx0, y0, -wz0), V(wx0, y0, -wz0), V(wx0, y0, wz0), V(-wx0, y0, wz0), u(wx0), u(wz0)),
  ], false);
};

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal));
    else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

const trs = (x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(sx, sy, sz));

export const blocksRay = (cx: number, cz: number, r: number, h: number, rays: Ray[]) => {
  for (const ray of rays) {
    const dx = cx - ray.o.x, dz = cz - ray.o.z;
    const t = dx * ray.d.x + dz * ray.d.z;
    if (t < -r || t > ray.len + r) continue;
    const px = ray.o.x + ray.d.x * t - cx, pz = ray.o.z + ray.d.z * t - cz;
    const py = ray.o.y + ray.d.y * t;
    const pad = ray.core ? r + 2.4 : r + 0.8;
    if (px * px + pz * pz < pad * pad && py < h + 2.0 && py > -2.0) return true;
  }
  return false;
};

// ---------------- storybook painted trees & fences ----------------
const TREE_GREENS = ["#5d8a4a", "#527f43", "#6b9552"];
export const addTree = (B: Batch, x: number, y: number, z: number, s = 1, seed = 0) => {
  const bark = lam("bark", () => ({ map: beamHD(), color: "#6e5238" }));
  const leaf = lam("leaf" + (seed % 3), () => ({ color: TREE_GREENS[seed % 3] }));
  const trunk = new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 2.5 * s, 8);
  B.add(trunk, bark, trs(x, y + 1.25 * s, z));
  const puffs: [number, number, number, number][] = [
    [0, 3.4, 0, 1.5], [-0.75, 2.9, 0.4, 1.05], [0.78, 2.95, -0.35, 1.1], [0.15, 4.3, 0.2, 1.0],
  ];
  for (const [dx, dy, dz, r] of puffs) {
    const sp = new THREE.IcosahedronGeometry(r * s, 2);
    B.add(sp, leaf, trs(x + dx * s, y + dy * s, z + dz * s, 0, 1.05, 0.9, 1.05));
  }
};

/** picket fence run along x from x0..x1 at fixed z (faces +z), with two rails */
const addFence = (B: Batch, x0: number, x1: number, z: number, postH = 1.05) => {
  const wood = lam("fenceOak", () => ({ map: planksHD(), color: "#c9c2b2" }));
  for (let x = x0; x <= x1; x += 0.32) {
    const h = postH * (0.9 + 0.18 * Math.abs(Math.sin(x * 12.9898)));
    B.add(boxGeo(V(x - 0.055, 0, z - 0.055), V(x + 0.055, h, z + 0.055), 0), wood);
    const tip = new THREE.ConeGeometry(0.085, 0.16, 4);
    B.add(tip, wood, trs(x, h + 0.08, z, Math.PI / 4));
  }
  for (const ry of [0.35, 0.82]) {
    B.add(boxGeo(V(x0 - 0.1, ry, z - 0.035), V(x1 + 0.1, ry + 0.075, z + 0.035), 1.5), wood);
  }
};

// prism roof helper (4-seg cone, squashed to gable proportions)
const prismRoof = (w: number, h: number, d: number, key: string, col: string) => {
  const r = new THREE.Mesh(
    new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.02, h, 4),
    lam("roof" + key, () => ({ color: col, flatShading: true })),
  );
  r.rotation.y = Math.PI / 4;
  r.scale.set(w / Math.hypot(w, d) * 1.42, 1, d / Math.hypot(w, d) * 1.42);
  return r;
};

// ================= Set A: MEETING-HOUSE COMMON & MAIN STREET =================
export type StreetRig = { windows: THREE.MeshLambertMaterial[]; stallLantern: THREE.MeshLambertMaterial };

export const buildStreet = (parent: THREE.Object3D, rays: Ray[]): StreetRig => {
  const B = new Batch();
  const grassMat = lam("grassCommon", () => ({ map: rep(grassHD(), 22, 22) }));
  const dirtMat = lam("dirtPath", () => ({ map: rep(cobbleHD(), 6, 26), color: "#b8a684" }));
  const stoneMat = lam("stoneTrim", () => ({ map: rep(stoneHD(), 6, 6) }));

  // Common ground: grass with a worn dirt path leading to the meeting house
  B.add(boxGeo(V(-150, -0.5, -150), V(150, -0.05, 150), 12), grassMat);
  B.add(boxGeo(V(-2.1, -0.04, -26), V(2.1, 0.02, 22), 6), dirtMat);

  // ---- the meeting house (white clapboard, tiered steeple) at the common's head ----
  const whitePlank = lam("meetingWhite", () => ({ map: planksHD(), color: "#ece7da" }));
  const slate = lam("slateRoof", () => ({ map: roofHD("#3a4250", true), color: "#8a929e" }));
  B.add(boxGeo(V(-4.6, 0, -30.6), V(4.6, 6.2, -24.0), 3), whitePlank);              // nave
  B.add(frustumBox(6.2, 6.75, 5.1, 3.7, 4.9, 3.5, 3), stoneMat);                    // eaves course
  B.add(frustumBox(6.75, 10.4, 3.7, 2.7, 1.15, 1.1, 3), slate);                     // hipped roof
  B.add(boxGeo(V(-1.28, 9.9, -28.4), V(1.28, 13.6, -25.9), 2.5), whitePlank);       // steeple base
  B.add(frustumBox(13.6, 16.6, 1.18, 1.18, 0.82, 0.82, 2), whitePlank);             // steeple stage 2
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * 1.18, pz = sz > 0 ? -26.02 : -28.28;
    B.add(boxGeo(V(px - 0.09, 9.9, pz - 0.09), V(px + 0.09, 13.6, pz + 0.09), 1), whitePlank); // corner pilasters
  }
  B.add(frustumBox(16.6, 17.5, 1.05, 1.05, 0.78, 0.78, 2), slate);                  // steeple ring beam
  B.add(frustumBox(17.5, 22.4, 0.72, 0.72, 0.06, 0.06, 1.5), lam("spireWhite", () => ({ color: "#e5e0d2", flatShading: true }))); // spire
  const vane = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
  B.add(vane, lam("spireIron", () => ({ color: "#2a2622" })), trs(0, 23.0, -27.2));
  B.add(boxGeo(V(-0.42, 23.35, -27.26), V(0.42, 23.46, -27.14), 1), lam("spireIron", () => ({ color: "#2a2622" }))); // weathervane bar
  // door steps + door
  B.add(boxGeo(V(-1.7, 0, -23.9), V(1.7, 0.34, -22.6), 2), stoneMat);
  B.add(boxGeo(V(-0.78, 0.34, -24.02), V(0.78, 2.5, -23.92), 1), lam("doorOak", () => ({ map: planksHD(), color: "#33241a" })));

  // ---- clapboard houses, both sides of the street ----
  const WALLS = ["#8a4a3a", "#7a6a52", "#5d6a72", "#8f8574", "#6b4f3a", "#4d5a50"];
  const ROOFS = ["#33373f", "#40342c", "#2e3a44"];
  const houses: [number, number, number, number, number, number][] = [
    // [side, z, w, h, d, seed]
    [-1, 8.0, 4.4, 5.2, 4.0, 0], [-1, 2.2, 3.7, 4.4, 3.6, 1], [-1, -3.4, 4.9, 6.1, 4.2, 2],
    [-1, -9.6, 3.9, 4.7, 3.4, 3], [-1, -15.4, 4.6, 5.6, 4.4, 4],
    [1, 8.6, 4.1, 4.9, 3.8, 2], [1, 3.0, 4.8, 5.9, 4.3, 3], [1, -3.2, 3.6, 4.3, 3.5, 4],
    [1, -9.2, 4.5, 5.4, 4.1, 0], [1, -15.0, 4.0, 4.6, 3.7, 1],
  ];
  const windows: THREE.MeshLambertMaterial[] = [];
  houses.forEach(([side, z, w, h, d, k], hi) => {
    const hx = side * (4.6 + (k % 3) * 0.5);
    if (blocksRay(hx, z, Math.hypot(w, d) * 0.62, h + 2, rays)) return;
    const fMat = lam(`fac_${k}`, () => ({
      map: facadeHD(`dd_${k}`, w, h, {
        wall: WALLS[k % WALLS.length],
        shutter: ["#3d4a3f", "#413c33", "#2e3a44"][k % 3],
        door: true,
        brick: k === 4,
      }),
    }));
    const rMat = lam(`roof_${k % 3}`, () => ({ map: roofHD(ROOFS[k % 3]), color: "#c8c2b8" }));
    B.add(boxGeo(V(hx - w / 2 - 0.14, 0, z - d / 2 - 0.14), V(hx + w / 2 + 0.14, 0.7, z + d / 2 + 0.14), 2.4), stoneMat);
    B.add(boxGeo(V(hx - w / 2, 0.7, z - d / 2), V(hx + w / 2, h, z + d / 2), 0), fMat);
    B.add(boxGeo(V(hx - w / 2 - 0.2, h, z - d / 2 - 0.2), V(hx + w / 2 + 0.2, h + 0.4, z + d / 2 + 0.2), 2.4), stoneMat);
    // gabled prism roof via slab + triangular gable ends
    B.add(frustumBox(h + 0.4, h + 2.15, w / 2 + 0.16, d / 2 + 0.16, 0.32, d / 2 + 0.16, 2.4), rMat);
    // chimney
    B.add(boxGeo(V(hx + side * (w / 2 - 0.7) - 0.3, h + 0.6, z - d / 4 - 0.3), V(hx + side * (w / 2 - 0.7) + 0.3, h + 1.9, z - d / 4 + 0.3), 1), lam("chimneyBrick", () => ({ map: rep(brick(), 1, 2) })));
    // two storefront windows with emissive warm light (the candle vigil), wired for the cascade
    for (const wz of [z - d * 0.22, z + d * 0.22]) {
      const wm = new THREE.MeshLambertMaterial({ color: "#241d18", emissive: "#ffb45a", emissiveIntensity: 0.0 });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.9), wm);
      win.position.set(hx - side * (w / 2 - 0.015), h * 0.62, wz);
      win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      parent.add(win);
      windows.push(wm);
    }
  });

  // ---- the well on the common (shot 5 frames it) ----
  const wellStone = lam("wellStone", () => ({ map: rep(stoneHD("wellHD"), 3, 1), color: "#9aa08e" }));
  B.add(new THREE.CylinderGeometry(1.05, 1.2, 0.72, 12, 1, true), wellStone, trs(-3.4, 0.36, 3.2));
  B.add(new THREE.CylinderGeometry(1.12, 1.12, 0.18, 12), wellStone, trs(-3.4, 0.72, 3.2));
  for (const sx of [-1, 1]) B.add(boxGeo(V(-3.4 + sx * 0.95 - 0.09, 0.7, 3.1), V(-3.4 + sx * 0.95 + 0.09, 2.6, 3.3), 1), lam("fenceOak", () => ({ map: planksHD(), color: "#b0a892" })));
  B.add(frustumBox(2.6, 3.15, 1.35, 0.42, 0.1, 0.1, 1.5), lam("wellRoof", () => ({ map: planksHD(), color: "#6b4f3a" })), trs(-3.4, 0, 3.2));

  // ---- the candle-seller's stall (shot 3: the last candle in town sells out) ----
  const stallWood = lam("stallWood", () => ({ map: planksHD(), color: "#8a6b46" }));
  const stallX = 2.35, stallZ = 1.0;
  for (const [px, pz] of [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.55], [0.85, 0.55]] as const) {
    B.add(boxGeo(V(stallX + px - 0.07, 0, stallZ + pz - 0.07), V(stallX + px + 0.07, 2.15, stallZ + pz + 0.07), 1), stallWood);
  }
  B.add(frustumBox(2.15, 2.45, 1.35, 0.95, 1.5, 1.05, 1.5), lam("stallAwning", () => ({ map: planksHD(), color: "#a33f2e" })), trs(stallX, 0, stallZ));
  B.add(boxGeo(V(stallX - 0.95, 0.78, stallZ - 0.62), V(stallX + 0.95, 0.9, stallZ + 0.68), 1.5, true), stallWood); // counter
  B.add(boxGeo(V(stallX - 0.7, 1.32, stallZ - 0.45), V(stallX + 0.7, 1.4, stallZ + 0.05), 1), stallWood);          // shelf
  // candle boxes on the shelf (emissive once the cascade hits) — small amber loaves
  const candleBoxMat = lam("candleWax", () => ({ color: "#e8dcc2", emissive: "#ffb060", emissiveIntensity: 0.35 }));
  for (let i = 0; i < 6; i++) {
    const bx = stallX - 0.52 + i * 0.21;
    B.add(boxGeo(V(bx - 0.06, 1.4, stallZ - 0.36), V(bx + 0.06, 1.4 + 0.16 + (i % 2) * 0.06, stallZ - 0.2), 0.5), candleBoxMat);
  }
  const stallLantern = new THREE.MeshLambertMaterial({ color: "#3a2f1e", emissive: "#ffcf70", emissiveIntensity: 0.0 });
  const lanternMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), stallLantern);
  lanternMesh.position.set(stallX - 0.78, 1.98, stallZ + 0.35);
  parent.add(lanternMesh);

  // ---- trees & pickets ----
  for (const [tx, tz, s, sd] of [[-7.5, 5.5, 1.25, 3], [7.6, 4.0, 1.15, 6], [-8.3, -6.5, 1.45, 9], [8.1, -8.0, 1.35, 12], [-7.2, -14.5, 1.2, 5], [7.4, -15.5, 1.3, 8]] as const) {
    if (!blocksRay(tx, tz, 1.6, 6.5, rays)) addTree(B, tx, 0, tz, s, sd);
  }
  addFence(B, 5.6, 10.6, -11.5, 1.0);
  addFence(B, -10.6, -5.8, -11.5, 1.0);
  addFence(B, 6.2, 10.8, 7.2, 1.0);
  addFence(B, -10.8, -6.4, 7.2, 1.0);

  B.build(parent, true);
  return { windows, stallLantern };
};

// ================= Set B: WILLIAMS' STUDY (HARVARD, 1780) =================
export type DeskRig = { back: THREE.MeshLambertMaterial };

export const buildDesk = (parent: THREE.Object3D, origin: V3): DeskRig => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);
  const B = new Batch();
  const floorM = lam("deskFloor", () => ({ map: rep(planksHD(), 4, 4), color: "#a8896a" }));
  const wood = lam("deskWood", () => ({ map: beamHD(), color: "#7d5636" }));
  const darkWood = lam("deskDark", () => ({ map: beamHD(), color: "#4a3524" }));
  const wallM = lam("deskWall", () => ({ map: rep(planksHD(), 5, 3), color: "#6e5f4c" }));

  B.add(boxGeo(V(-4.6, -0.2, -3.2), V(4.6, 0, 3.4), 2), floorM);
  B.add(boxGeo(V(-4.6, 0, -3.25), V(4.6, 4.6, -2.95), 2), wallM);            // back wall
  B.add(boxGeo(V(-4.75, 0, -3.2), V(-4.45, 4.6, 3.4), 2), wallM);            // left
  B.add(boxGeo(V(4.45, 0, -3.2), V(4.75, 4.6, 3.4), 2), wallM);              // right
  B.add(boxGeo(V(-4.6, 4.55, -3.2), V(4.6, 4.9, 3.4), 2, true), lam("deskCeil", () => ({ color: "#3d332a" })));
  // beams across the ceiling
  for (const bz of [-1.8, 0.4, 2.4]) B.add(boxGeo(V(-4.6, 4.0, bz - 0.16), V(4.6, 4.6, bz + 0.16), 2), darkWood);

  // bookshelf on the back wall, stacked with ledger tomes
  B.add(boxGeo(V(-3.9, 0.9, -2.85), V(-1.6, 3.6, -2.2), 1.5), darkWood);
  for (const sy of [1.55, 2.25, 2.95]) {
    B.add(boxGeo(V(-3.8, sy, -2.2), V(-1.7, sy + 0.07, -2.16), 1), wood);
    let bx = -3.68;
    const rr = rng(17 + Math.floor(sy * 10));
    while (bx < -1.95) {
      const bw = 0.14 + rr() * 0.16, bh = 0.34 + rr() * 0.2;
      const cols = ["#4d2f2a", "#2f3a4d", "#3d4d2f", "#4d402a", "#2a2a33"];
      B.add(boxGeo(V(bx, sy + 0.07, -2.24), V(bx + bw, sy + 0.07 + bh, -2.02), 0.6), lam("book" + Math.floor(rr() * 5), () => ({ color: cols[Math.floor(rr() * 5)] })));
      bx += bw + 0.035;
    }
  }
  // framed map of the colonies on the wall
  const mapTex = ctex("mapWall", 512, 384, (g, r) => {
    g.fillStyle = "#d8c9a3"; g.fillRect(0, 0, 512, 384);
    g.strokeStyle = "#7a6248"; g.lineWidth = 5; g.strokeRect(10, 10, 492, 364);
    g.strokeStyle = "#5d4a34"; g.lineWidth = 2;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * 85, 14); g.lineTo(i * 85 - 15, 370); g.stroke(); }
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(14, i * 92); g.lineTo(498, i * 92 + 8); g.stroke(); }
    // coast-ish wiggly line
    g.lineWidth = 6; g.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = 120 + Math.sin(x * 0.045) * 40 + Math.sin(x * 0.013 + 2) * 38 + (r() - 0.5) * 9;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    // rhumb lines from two compass roses
    g.lineWidth = 1.1;
    for (const [rx, ry] of [[120, 220], [390, 110]] as const) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.cos(a) * 220, ry + Math.sin(a) * 220); g.stroke();
      }
      g.lineWidth = 2.6; g.beginPath(); g.arc(rx, ry, 15, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.1;
    }
  });
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.55), new THREE.MeshLambertMaterial({ map: mapTex }));
  mapMesh.position.set(1.7, 2.75, -2.9);
  G.add(mapMesh);
  B.add(boxGeo(V(0.58, 1.9, -2.93), V(2.82, 3.6, -2.88), 1), darkWood); // map frame backing

  // the writing desk (facing the room, angled to the window light)
  B.add(boxGeo(V(-1.5, 0.72, 0.05), V(1.5, 0.86, 1.25), 1.4, true), wood);       // top
  for (const sx of [-1, 1]) for (const sz of [0, 1]) {
    B.add(boxGeo(V(sx * 1.38 - 0.08, 0, 0.12 + sz * 0.98), V(sx * 1.38 + 0.08, 0.72, 0.28 + sz * 0.98), 1), darkWood);
  }
  B.add(boxGeo(V(-1.5, 0.18, 1.02), V(1.5, 0.68, 1.14), 1), darkWood);           // modesty panel
  // ink pot + quill + candle + books + papers
  B.add(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 10), lam("inkPot", () => ({ color: "#191613" })), trs(0.62, 0.92, 0.62));
  B.add(new THREE.ConeGeometry(0.05, 0.62, 7), lam("quill", () => ({ color: "#e8e4da" })), trs(0.66, 1.13, 0.6, 0, 1, 1, 1));
  const bookCols = ["#57332a", "#2f3a4d", "#41352a"];
  for (let i = 0; i < 3; i++) {
    B.add(boxGeo(V(-1.28 + i * 0.05 - 0.24, 0.86 + i * 0.1, 0.72), V(-0.82 + i * 0.05 + 0.24, 0.96 + i * 0.1, 1.12), 0.8), lam("wbook" + i, () => ({ color: bookCols[i] })));
  }
  // papers with handwriting
  const paperTex = ctex("paperHD", 128, 160, (g) => {
    g.fillStyle = "#e9e1cb"; g.fillRect(0, 0, 128, 160);
    g.strokeStyle = "#5d554a"; g.lineWidth = 1.6;
    for (let y = 26; y < 146; y += 11) {
      g.beginPath(); g.moveTo(10, y);
      for (let x = 10; x < 116; x += 7) g.lineTo(x, y + Math.sin(x * 0.8 + y) * 1.7);
      g.stroke();
    }
  });
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshLambertMaterial({ map: paperTex }));
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = i * 0.62 - 0.9;
    p.position.set(-0.55 + (i % 2) * 0.62, 0.872 + i * 0.004, 0.28 + Math.floor(i / 2) * 0.4);
    G.add(p);
  }
  // candlestick on the desk
  B.add(new THREE.CylinderGeometry(0.075, 0.115, 0.09, 12), lam("brassCandle", () => ({ color: "#8a6f2e", specular: "#d8c06a", shininess: 60 })), trs(0.98, 0.915, 0.35));
  B.add(new THREE.CylinderGeometry(0.028, 0.035, 0.3, 8), lam("candleWaxW", () => ({ color: "#e8dcc2" })), trs(0.98, 1.11, 0.35));

  // chair behind the desk
  B.add(boxGeo(V(-0.42, 0.44, 2.0), V(0.42, 0.52, 2.5), 1), wood);
  B.add(boxGeo(V(-0.42, 0.52, 2.42), V(0.42, 1.5, 2.52), 1), wood);           // chair back
  B.add(boxGeo(V(-0.38, 1.3, 2.36), V(0.38, 1.42, 2.44), 1), darkWood);

  // floor rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), lam("deskRug", () => ({ map: rep(ctex("rugTex", 256, 256, (g) => {
    g.fillStyle = "#57332a"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#a8814c"; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
    g.lineWidth = 4; g.strokeRect(34, 34, 188, 188);
  }), 1, 1) })));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, 1.4);
  G.add(rug);

  const back = lam("deskBackMat", () => ({ color: "#57493a" }));
  B.build(G, true);
  return { back };
};

// ================= Set C: LAMP INSERT (hand over a lamp) =================
export type LampRig = { panel: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> };

export const buildLamp = (parent: THREE.Object3D, origin: V3): LampRig => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);
  const B = new Batch();
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshLambertMaterial({ map: rep(planksHD(), 3, 2), color: "#5d4f42" }));
  backdrop.position.set(0, 2.9, -2.4);
  G.add(backdrop);
  // table
  B.add(boxGeo(V(-1.9, 0.58, -0.8), V(1.9, 0.72, 0.85), 1.4, true), lam("lampTable", () => ({ map: beamHD(), color: "#6b4a2e" })));
  for (const sx of [-1, 1]) B.add(boxGeo(V(sx * 1.75 - 0.09, 0, -0.65), V(sx * 1.75 + 0.09, 0.58, 0.68), 1), lam("lampTableLeg", () => ({ map: beamHD(), color: "#4a3524" })));
  // the oil lamp: base, stem, chimney (emissive via world.ts point light + sprites)
  B.add(new THREE.CylinderGeometry(0.2, 0.28, 0.16, 14), phong("lampBrass", () => ({ color: "#7a5f24", specular: "#e8d98a", shininess: 70 })), trs(0, 0.8, 0));
  B.add(new THREE.CylinderGeometry(0.06, 0.08, 0.36, 10), phong("lampBrass", () => ({ color: "#7a5f24", specular: "#e8d98a", shininess: 70 })), trs(0, 1.05, 0));
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.22, 0.62, 14, 1, true),
    new THREE.MeshLambertMaterial({ color: "#ffdca8", emissive: "#ffc06a", emissiveIntensity: 2.0, transparent: true, opacity: 0.96, side: THREE.DoubleSide }),
  );
  chimney.position.set(0, 1.45, 0);
  G.add(chimney);
  // hand silhouette? no — the smoked-glass PANEL is the hand
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 9),
    new THREE.MeshBasicMaterial({ color: "#04060b", transparent: true, opacity: 0, depthWrite: false }),
  );
  panel.position.set(0, 8.6, 0.95);
  panel.layers.set(1); // separate layer handled by ink NOINK logic in world
  G.add(panel);
  B.build(G, false);
  return { panel };
};

// ================= Set D: THE ONTARIO HORIZON (fire, 200 mi away) =================
export const buildFire = (parent: THREE.Object3D, origin: V3) => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);
  const B = new Batch();
  // scorched foreground meadow
  B.add(boxGeo(V(-90, -0.4, -20), V(90, 0.02, 30), 8), lam("fireField", () => ({ map: rep(grassHD(), 12, 6), color: "#4d4636" })));
  // burnt snags (bare charred trunks) for parallax depth
  const charMat = lam("charSnag", () => ({ color: "#16110e" }));
  for (const [sx, sz, h] of [[-16, -8, 3.6], [-9, -13, 4.6], [6, -10, 3.1], [14, -15, 5.2], [21, -6, 2.6], [-24, -14, 4.9], [2, -17, 5.6]] as const) {
    B.add(new THREE.CylinderGeometry(0.13, 0.3, h, 6), charMat, trs(sx, h / 2, sz));
    for (let i = 0; i < 3; i++) {
      const br = new THREE.CylinderGeometry(0.05, 0.08, 1.4 - i * 0.4, 5);
      br.rotateZ(0.7 + i * 0.45);
      B.add(br, charMat, trs(sx + (i - 1) * 0.3, h - 0.6 - i * 0.75, sz, i * 1.1));
    }
  }
  // the far ridge
  B.add(boxGeo(V(-130, 0.5, -86), V(130, 8.5, -78), 10), lam("fireRidge", () => ({ color: "#1a1512" })));
  B.build(G, true);
  return G;
};

/** treeline silhouette strip (alpha-tested conifer line) for the fire horizon */
export const treelineTex = () =>
  ctex("treelineTex", 1024, 220, (g) => {
    g.clearRect(0, 0, 1024, 220);
    g.fillStyle = "#0f0d0b";
    g.fillRect(0, 168, 1024, 52);
    for (let x = 0; x < 1024; x += 8) {
      const h = 52 + ((x * 7919) % 96) + Math.sin(x * 0.05) * 14;
      g.beginPath();
      g.moveTo(x, 172);
      g.lineTo(x + 4.5, 172 - h);
      g.lineTo(x + 9, 172);
      g.closePath();
      g.fill();
    }
  });

// ================= Set E: THE TREE COOKIE (2007 evidence) =================
export const buildTreeSet = (parent: THREE.Object3D, origin: V3) => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);
  const B = new Batch();
  const dirt = lam("cookieDirt", () => ({ map: rep(grassHD(), 6, 6), color: "#5a5244" }));
  B.add(boxGeo(V(-15, -0.4, -15), V(15, 0.02, 15), 6), dirt);
  // fallen pine trunk behind the cookie
  const bark = lam("cookieBark", () => ({ map: beamHD(), color: "#3a2c20" }));
  const trunk = new THREE.CylinderGeometry(0.46, 0.58, 5.6, 12);
  trunk.rotateZ(Math.PI / 2 - 0.07);
  B.add(trunk, bark, trs(-2.2, 0.5, -1.7));
  B.add(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 12), bark, trs(-4.95, 0.42, -1.89));
  // sawhorses under the cookie (A-frame tops at y≈0.42, cookie rests on them)
  const horseWood = lam("horseWood", () => ({ map: planksHD(), color: "#54402c" }));
  for (const hx of [-0.78, 0.78]) {
    B.add(boxGeo(V(hx - 0.55, 0.34, -0.16), V(hx + 0.55, 0.46, 0.16), 0.8), horseWood);
    for (const sz of [-1, 1]) {
      const leg = new THREE.BoxGeometry(0.14, 0.52, 0.14);
      leg.rotateZ(sz * 0.32);
      B.add(leg, horseWood, trs(hx + sz * 0.17, 0.17, 0));
    }
  }
  // the cookie: upright cross-section with the 1780 scar ring painted on the cap (axis = z so a cap faces the camera)
  const cookieSide = lam("cookieSide", () => ({ map: beamHD(), color: "#6e5233" }));
  const cookieGeo = new THREE.CylinderGeometry(1.14, 1.14, 0.52, 26);
  cookieGeo.rotateX(Math.PI / 2);
  B.add(cookieGeo, cookieSide, trs(0, 1.5, 0));
  // bark rim (torus already faces +z in the XY plane)
  const rim = new THREE.TorusGeometry(1.13, 0.075, 8, 26);
  B.add(rim, bark, trs(0, 1.5, 0));
  // log pile
  for (const [lx, ly, lz, ry] of [[-3.4, 0.32, 1.5, 0.3], [-2.7, 0.32, 2.2, 1.1], [-3.05, 0.88, 1.85, 0.7]] as const) {
    const l = new THREE.CylinderGeometry(0.34, 0.36, 2.6, 9);
    l.rotateZ(Math.PI / 2);
    B.add(l, bark, trs(lx, ly, lz, ry));
  }
  B.build(G, true);

  // the painted cap goes on as its own mesh (CircleGeometry faces +z after rotateX)
  const capTex = ctex("cookieCap", 512, 512, (g) => {
    g.fillStyle = "#b98a56"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#8a6136";
    for (let r = 238; r > 12; r -= 11 + ((r * 7) % 9)) {
      g.lineWidth = 3 + (r % 4);
      g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke();
    }
    // the 1780 scar: one wide charcoal ring — the "receipt"
    g.strokeStyle = "#241812";
    g.lineWidth = 26;
    g.beginPath(); g.arc(256, 256, 148, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#241812";
    g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 148, -0.38, 0.35); g.closePath(); g.fill();
    g.fillStyle = "#5a3d24";
    g.beginPath(); g.ellipse(256, 256, 17, 13, 0, 0, Math.PI * 2); g.fill();
  });
  const cap = new THREE.Mesh(new THREE.CircleGeometry(1.13, 28), new THREE.MeshLambertMaterial({ map: capTex }));
  cap.position.set(0, 1.5, 0.265);
  cap.rotation.x = 0; // faces +z
  G.add(cap);
  const capBack = cap.clone();
  capBack.rotation.y = Math.PI;
  capBack.position.set(0, 1.5, -0.265);
  G.add(capBack);
  return G;
};

// ================= Foreground framing props =================
export const buildFgProp = (kind: FgKind): THREE.Group => {
  const G = new THREE.Group();
  const B = new Batch();
  if (kind === "fence") {
    addFence(B, -2.6, 2.6, 0, 1.18);
  } else if (kind === "wellc") {
    const stone = lam("wellStone", () => ({ map: rep(stoneHD(), 3, 1), color: "#9aa08e" }));
    B.add(new THREE.CylinderGeometry(1.15, 1.3, 0.78, 12, 1, true), stone, trs(0, 0.39, 0));
    B.add(new THREE.CylinderGeometry(1.22, 1.22, 0.2, 12), stone, trs(0, 0.78, 0));
  } else { // sawhorse
    const wood = lam("horseWood", () => ({ map: planksHD(), color: "#54402c" }));
    B.add(boxGeo(V(-0.75, 0.9, -0.16), V(0.75, 1.12, 0.16), 1.2), wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.BoxGeometry(0.13, 1.0, 0.13);
      leg.rotateZ(sx * 0.3);
      leg.rotateX(sz * 0.18);
      B.add(leg, wood, trs(sx * 0.42, 0.48, sz * 0.16));
    }
  }
  B.build(G, false);
  return G;
};
