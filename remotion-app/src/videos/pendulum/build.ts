// Procedural 3D architecture & props for "The Giant Golden Ball Inside Taipei 101".
// Every surface uses the skill's painted Canvas2D textures (paint.ts) and stylised
// two-tone shadow-mapped Lambert/Phong shader (shade.ts twoTone), with clean normals
// so InkPass outlines silhouettes and 35-deg creases cleanly. Zero external GLBs needed.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  brick, rep, facadeHD, roofHD, stoneHD, cobbleHD, grassHD, planksHD, beamHD, towerGlass, goldPlate,
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
    // +z front
    quad(V(-wx0, y0, wz0), V(wx0, y0, wz0), V(wx1, y1, wz1), V(-wx1, y1, wz1), u(wx1), v),
    // -z back
    quad(V(wx0, y0, -wz0), V(-wx0, y0, -wz0), V(-wx1, y1, -wz1), V(wx1, y1, -wz1), u(wx1), v),
    // -x left
    quad(V(-wx0, y0, -wz0), V(-wx0, y0, wz0), V(-wx1, y1, wz1), V(-wx1, y1, -wz1), u(wz1), v),
    // +x right
    quad(V(wx0, y0, wz0), V(wx0, y0, -wz0), V(wx1, y1, -wz1), V(wx1, y1, wz1), u(wz1), v),
    // +y roof cap
    quad(V(-wx1, y1, wz1), V(wx1, y1, wz1), V(wx1, y1, -wz1), V(-wx1, y1, -wz1), u(wx1), u(wz1)),
    // -y underside overhang
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

const blocksRay = (cx: number, cz: number, r: number, h: number, rays: Ray[]) => {
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

// ---------------- storybook painted trees & foliage ----------------
const TREE_GREENS = ["#62ae4c", "#56a447", "#72b853"];
export const addTree = (B: Batch, x: number, y: number, z: number, s = 1, seed = 0) => {
  const bark = lam("bark", () => ({ map: beamHD(), color: "#8a5a3c" }));
  const leaf = lam("leaf" + (seed % 3), () => ({ color: TREE_GREENS[seed % 3] }));
  const trunk = new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 2.2 * s, 8);
  B.add(trunk, bark, trs(x, y + 1.1 * s, z));
  const puffs: [number, number, number, number][] = [
    [0, 3.0, 0, 1.35], [-0.65, 2.55, 0.35, 0.95], [0.68, 2.6, -0.3, 0.98], [0.1, 3.75, 0.15, 0.92],
  ];
  for (const [dx, dy, dz, r] of puffs) {
    const sp = new THREE.IcosahedronGeometry(r * s, 2);
    B.add(sp, leaf, trs(x + dx * s, y + dy * s, z + dz * s, 0, 1.05, 0.88, 1.05));
  }
};

// ---------------- Set A: Taipei Plaza & Painted City Blocks ----------------
export const buildCity = (parent: THREE.Object3D, rays: Ray[]) => {
  const B = new Batch();
  const cobMat = lam("cobblePlaza", () => ({ map: rep(cobbleHD(), 28, 28) }));
  const grassMat = lam("grassPlaza", () => ({ map: rep(grassHD(), 24, 24) }));
  const stoneMat = lam("stoneTrim", () => ({ map: rep(stoneHD(), 8, 8) }));
  const roadMat = lam("road", () => ({ color: "#696b72" }));

  // Ground plane: grass surround + central stone/cobble plaza + avenues
  B.add(boxGeo(V(-240, -0.5, -240), V(240, -0.06, 240), 12), grassMat);
  B.add(boxGeo(V(-34, -0.06, -95), V(34, 0.0, 45), 5), cobMat);
  B.add(boxGeo(V(-120, -0.04, -34), V(120, 0.01, -22), 6), roadMat);
  // Low stone planter curbs flanking the avenue (clear of camera paths)
  for (const sx of [-1, 1]) {
    B.add(boxGeo(V(sx * 18 - 3.5, 0, -48), V(sx * 18 + 3.5, 0.38, -28), 3), stoneMat);
    B.add(boxGeo(V(sx * 18 - 3.1, 0.38, -47.6), V(sx * 18 + 3.1, 0.44, -28.4), 3), grassMat);
    for (const tz of [-44, -38, -32]) {
      if (!blocksRay(sx * 18, tz, 2.2, 5.5, rays)) addTree(B, sx * 18, 0.4, tz, 1.1, Math.abs(sx * 7 + tz));
    }
  }

  // Painted surrounding city blocks (muted brick, cream, ochre, terracotta per SKILL.md)
  const WALLS = ["#d8c2a3", "#c87152", "#dfc99b", "#be6249", "#d4cab8", "#c98b5b"];
  const ROOFS = ["#7d493c", "#545d6a", "#8b5440", "#5f524c"];
  const blocks: [number, number, number, number, number, number][] = [
    [-46, -12, 13, 12, 16, 0], [-48, 12, 14, 14, 22, 1], [-44, 34, 15, 13, 19, 2],
    [46, -10, 14, 13, 18, 3], [48, 14, 15, 13, 24, 4], [45, 36, 14, 14, 20, 5],
    [-28, 38, 14, 12, 21, 1], [0, 44, 16, 12, 17, 2], [28, 38, 14, 12, 23, 0],
    [-68, -42, 15, 14, 15, 4], [68, -42, 15, 14, 16, 5],
    [-72, -8, 16, 16, 26, 2], [72, -6, 16, 16, 28, 3],
    [-62, 24, 15, 15, 22, 0], [62, 26, 15, 15, 25, 1],
  ];
  blocks.forEach(([cx, cz, w, d, h, k]) => {
    const r = Math.hypot(w, d) * 0.55;
    if (blocksRay(cx, cz, r, h, rays)) return;
    const fMat = lam(`fac_${k}_${w}_${h}`, () => ({
      map: facadeHD(`city_${k}_${w}_${h}`, w, h, {
        wall: WALLS[k % WALLS.length],
        shutter: ["#3d5c54", "#455a73", "#6b4840"][k % 3],
        door: true,
        brick: k % 3 === 1,
      }),
    }));
    const rMat = lam(`roof_${k}`, () => ({ map: rep(roofHD(ROOFS[k % ROOFS.length]), 3, 3) }));
    // Plinth + main facade + cornice + stepped roof cap
    B.add(boxGeo(V(cx - w / 2 - 0.15, 0, cz - d / 2 - 0.15), V(cx + w / 2 + 0.15, 0.9, cz + d / 2 + 0.15), 3), stoneMat);
    B.add(boxGeo(V(cx - w / 2, 0.9, cz - d / 2), V(cx + w / 2, h, cz + d / 2), 0), fMat);
    B.add(boxGeo(V(cx - w / 2 - 0.25, h, cz - d / 2 - 0.25), V(cx + w / 2 + 0.25, h + 0.55, cz + d / 2 + 0.25), 3), stoneMat);
    B.add(frustumBox(h + 0.55, h + 2.2, w / 2 + 0.1, d / 2 + 0.1, w / 2 - 1.6, d / 2 - 1.6, 3), rMat);
  });

  // Extra street trees framing the background avenue
  for (const [tx, tz] of [[-29, -18], [29, -18], [-30, 8], [30, 8], [-26, -54], [26, -54]] as const) {
    if (!blocksRay(tx, tz, 2.2, 5.5, rays)) addTree(B, tx, 0, tz, 1.25, Math.abs(tx + tz));
  }

  B.build(parent, true);
};

// ---------------- Taipei 101 Pagoda Skyscraper (Base + Swaying Upper Tiers) ----------------
export const buildTowerBase = (parent: THREE.Object3D) => {
  const B = new Batch();
  const glass = lam("t101Glass", () => ({ map: towerGlass() }));
  const stone = lam("t101Stone", () => ({ map: rep(stoneHD(), 4, 4), color: "#d5cec0" }));
  const trim = lam("t101Trim", () => ({ color: "#436e72" }));
  const gold = phong("t101Gold", () => ({ map: goldPlate(), color: "#f2c144", specular: "#fff0b8", shininess: 38 }));

  // Monumental tapered podium (y = 0..16 m)
  B.add(frustumBox(0, 2.2, 9.8, 9.8, 9.4, 9.4, 4), stone);
  B.add(frustumBox(2.2, 15.6, 9.2, 9.2, 7.2, 7.2, 5), glass);
  B.add(boxGeo(V(-7.6, 15.5, -7.6), V(7.6, 16.3, 7.6), 4), trim);
  // Corner stone buttresses on podium
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    B.add(frustumBox(0, 15.6, 1.35, 1.35, 1.0, 1.0, 3), stone, trs(sx * 7.8, 0, sz * 7.8));
  }
  // Entrance canopy facing -z plaza
  B.add(boxGeo(V(-3.8, 3.6, -11.4), V(3.8, 4.15, -8.8), 3, true), trim);
  B.add(boxGeo(V(-3.4, 0, -11.1), V(-3.0, 3.6, -10.7), 2), stone);
  B.add(boxGeo(V(3.0, 0, -11.1), V(3.4, 3.6, -10.7), 2), stone);
  // Medallion above podium
  const med = new THREE.CylinderGeometry(1.15, 1.15, 0.45, 16);
  med.rotateX(Math.PI / 2);
  B.add(med, gold, trs(0, 11.5, -8.35));

  B.build(parent, true);
};

/** 8 stacked inverted-trapezoid "bamboo box" tiers + pinnacle spire (mounted at y = 16 m so it flexes in wind) */
export const buildTowerUpper = (parent: THREE.Object3D) => {
  const B = new Batch();
  const glass = lam("t101Glass", () => ({ map: towerGlass() }));
  const trim = lam("t101Trim", () => ({ color: "#386368" }));
  const darkTrim = lam("t101Dark", () => ({ color: "#25454b" }));
  const gold = phong("t101Gold", () => ({ map: goldPlate(), color: "#f2c144", specular: "#fff0b8", shininess: 38 }));

  const tierH = 8.4;
  for (let i = 0; i < 8; i++) {
    const y0 = i * tierH;
    const y1 = y0 + tierH - 0.55;
    const scale = 1 - i * 0.032;
    const w0 = 5.6 * scale; // narrower waist at bottom of each bamboo box
    const w1 = 6.9 * scale; // flared pagoda lip at top
    B.add(frustumBox(y0, y1, w0, w0, w1, w1, 4.5), glass);
    // Crisp dark cornice collar & gold accent lip on every tier
    B.add(boxGeo(V(-w1 - 0.22, y1, -w1 - 0.22), V(w1 + 0.22, y1 + 0.55, w1 + 0.22), 4, true), trim);
    B.add(boxGeo(V(-w0 - 0.15, y0, -w0 - 0.15), V(w0 + 0.15, y0 + 0.32, w0 + 0.15), 4), darkTrim);
    // Iconic circular ruyi medallions on all 4 faces at each tier base
    const rMed = 0.72 * scale;
    for (const [mx, mz, ry] of [[0, -w0 - 0.18, 0], [0, w0 + 0.18, 0], [-w0 - 0.18, 0, Math.PI / 2], [w0 + 0.18, 0, Math.PI / 2]] as const) {
      const cyl = new THREE.CylinderGeometry(rMed, rMed, 0.36, 14);
      cyl.rotateX(Math.PI / 2);
      B.add(cyl, gold, trs(mx, y0 + 1.2, mz, ry));
    }
  }

  // Stepped crown pedestal + spire (local y = 67.2 .. 88 m -> world y = 83.2 .. 104 m)
  const topY = 8 * tierH;
  B.add(frustumBox(topY, topY + 5.5, 4.1, 4.1, 3.1, 3.1, 3.5), glass);
  B.add(boxGeo(V(-3.35, topY + 5.5, -3.35), V(3.35, topY + 6.1, 3.35), 3), trim);
  B.add(frustumBox(topY + 6.1, topY + 11.2, 2.1, 2.1, 1.25, 1.25, 3), trim);
  const needle = new THREE.CylinderGeometry(0.18, 0.62, 10.5, 10);
  B.add(needle, gold, trs(0, topY + 16.4, 0));

  B.build(parent, true);
};

// ---------------- Set B: 88th-92nd Floor Observatory & 660-Ton Golden Sphere ----------------
export const buildAtrium = (parent: THREE.Object3D, origin: V3) => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);

  const B = new Batch();
  const floorMat = lam("atrFloor", () => ({ map: rep(planksHD(), 8, 8), color: "#dfc29d" }));
  const pitMat = lam("atrPit", () => ({ map: rep(stoneHD(), 5, 5), color: "#7f858f" }));
  const wallMat = lam("atrWall", () => ({ color: "#ebe1cf" }));
  const steelMat = lam("atrSteel", () => ({ color: "#4a5565" }));
  const railMat = lam("atrRail", () => ({ color: "#39424e" }));
  const redMat = lam("atrRed", () => ({ color: "#c93b35" }));
  const goldTrim = phong("t101Gold", () => ({ map: goldPlate(), color: "#f2c144", specular: "#fff0b8", shininess: 38 }));

  // Outer gallery ring floor (r = 3.45 .. 11.2 m) at y = 0, sunken pit floor at y = -0.78 m
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, 11.2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 3.45, 0, Math.PI * 2, true);
  ringShape.holes.push(hole);
  const deckGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.25, bevelEnabled: false, curveSegments: 36 });
  deckGeo.rotateX(Math.PI / 2);
  // Re-scale planar UVs for wood planks
  const posAttr = deckGeo.attributes.position;
  const uvs = new Float32Array(posAttr.count * 2);
  for (let i = 0; i < posAttr.count; i++) {
    uvs[i * 2] = posAttr.getX(i) / 3.5;
    uvs[i * 2 + 1] = posAttr.getZ(i) / 3.5;
  }
  deckGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  B.add(deckGeo, floorMat, trs(0, 0, 0));

  // Sunken damper pit floor + circular curb wall
  const pitDisc = new THREE.CylinderGeometry(3.55, 3.55, 0.2, 32);
  B.add(pitDisc, pitMat, trs(0, -0.88, 0));
  const curb = new THREE.CylinderGeometry(3.55, 3.45, 0.14, 32, 1, true);
  B.add(curb, steelMat, trs(0, 0.04, 0));

  // Waist-low safety balustrade around pit (height 0.74 m so it crosses legs, NEVER torsos/faces!)
  const torusTop = new THREE.TorusGeometry(3.62, 0.045, 8, 40);
  torusTop.rotateX(Math.PI / 2);
  B.add(torusTop, railMat, trs(0, 0.74, 0));
  const torusMid = new THREE.TorusGeometry(3.62, 0.028, 6, 40);
  torusMid.rotateX(Math.PI / 2);
  B.add(torusMid, railMat, trs(0, 0.38, 0));
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const post = new THREE.CylinderGeometry(0.035, 0.035, 0.74, 8);
    B.add(post, railMat, trs(Math.cos(a) * 3.62, 0.37, Math.sin(a) * 3.62));
  }

  // Panoramic curved structural columns & sky-window mullions along the rear semicircle (z > -1.5)
  for (let i = -5; i <= 5; i++) {
    const a = (i / 5.5) * (Math.PI * 0.56); // spans rear + side arc
    const rx = Math.sin(a) * 9.8, rz = Math.cos(a) * 9.8;
    const col = new THREE.CylinderGeometry(0.26, 0.3, 9.6, 10);
    B.add(col, steelMat, trs(rx, 4.8, rz));
  }
  for (const hy of [3.2, 6.4, 9.3]) {
    const mull = new THREE.TorusGeometry(9.8, 0.09, 8, 40, Math.PI * 1.12);
    mull.rotateX(Math.PI / 2);
    mull.rotateY(-Math.PI * 0.06);
    B.add(mull, steelMat, trs(0, hy, 0));
  }
  // High 92nd-floor ceiling coffer & cable anchor ring (y = 9.4 m)
  const ceilRing = new THREE.TorusGeometry(3.2, 0.35, 10, 32);
  ceilRing.rotateX(Math.PI / 2);
  B.add(ceilRing, steelMat, trs(0, 9.4, 0));
  const ceilCap = new THREE.CylinderGeometry(11.2, 11.2, 0.45, 32);
  B.add(ceilCap, wallMat, trs(0, 9.75, 0));

  // Ring of 8 lower hydraulic bumper anchor pedestals inside the pit
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const bx = Math.cos(a) * 2.85, bz = Math.sin(a) * 2.85;
    B.add(boxGeo(V(-0.28, -0.78, -0.28), V(0.28, 0.15, 0.28), 1), redMat, trs(bx, 0, bz, -a));
  }

  // Cute round pedestal on the viewing deck for the mascot figure (Shot 14)
  const ped = new THREE.CylinderGeometry(0.46, 0.52, 0.26, 18);
  B.add(ped, goldTrim, trs(2.35, 0.13, -4.3));

  B.build(G, true);
  return G;
};

/** 660-ton 41-plate welded golden sphere + equatorial cable cradle */
export const buildDamperSphere = (parent: THREE.Object3D) => {
  const G = new THREE.Group();
  parent.add(G);
  const B = new Batch();
  // Gallery lighting keeps the famously gold-painted sphere legible even on its
  // shaded side. The painted bands are unlit, avoiding a muddy shadow tint.
  const gold = new THREE.MeshBasicMaterial({ map: goldPlate(), color: "#fff0a0" });
  const seamGold = new THREE.MeshBasicMaterial({ color: "#e5a82c" });
  const cradle = lam("atrSteel", () => ({ color: "#4a5565" }));

  const R = 2.08;
  // Core sphere + 15 stepped horizontal plate bands so InkPass catches subtle layered plate silhouettes
  B.add(new THREE.SphereGeometry(R * 0.985, 32, 24), gold);
  const bands = 15;
  for (let i = 0; i < bands; i++) {
    const u0 = -0.88 + (i / bands) * 1.76;
    const u1 = u0 + (1.76 / bands) * 0.84;
    const y0 = u0 * R, y1 = u1 * R;
    const r0 = Math.sqrt(Math.max(0.08, 1 - u0 * u0)) * R;
    const r1 = Math.sqrt(Math.max(0.08, 1 - u1 * u1)) * R;
    const cyl = new THREE.CylinderGeometry(r1, r0, y1 - y0, 28);
    B.add(cyl, i % 2 === 0 ? gold : seamGold, trs(0, (y0 + y1) * 0.5, 0));
  }
  // Equatorial steel cradle ring + 8 lug pins for the suspension cables
  const eq = new THREE.TorusGeometry(R * 1.015, 0.085, 10, 36);
  eq.rotateX(Math.PI / 2);
  B.add(eq, cradle);
  // Bottom hydraulic pin boss
  B.add(new THREE.CylinderGeometry(0.38, 0.32, 0.55, 14), cradle, trs(0, -R - 0.18, 0));

  B.build(G, true);
  return G;
};

// ---------------- Set C: 90th-Floor Panoramic Office ----------------
export type OfficeRig = {
  tilt: THREE.Group;
  lamps: THREE.Group[];
  mug: THREE.Group;
};

export const buildOffice = (parent: THREE.Object3D, origin: V3): OfficeRig => {
  const holder = new THREE.Group();
  holder.position.set(...origin);
  parent.add(holder);

  const tilt = new THREE.Group();
  holder.add(tilt);

  const B = new Batch();
  const floorMat = lam("offFloor", () => ({ map: rep(planksHD(), 6, 6), color: "#d5b68e" }));
  const wallMat = lam("offWall", () => ({ color: "#efe6d5" }));
  const deskMat = lam("offDesk", () => ({ map: beamHD(), color: "#b8824c" }));
  const darkMat = lam("offDark", () => ({ color: "#323844" }));
  const screenMat = lam("offScreen", () => ({ color: "#8cc4e8" }));
  const chairMat = lam("offChair", () => ({ color: "#3f5d7d" }));

  // Floor, ceiling, side walls, and panoramic window mullions along back wall (z = +4.4)
  B.add(boxGeo(V(-5.8, -0.2, -5.5), V(5.8, 0, 4.5), 3), floorMat);
  B.add(boxGeo(V(-5.8, 4.05, -5.5), V(5.8, 4.3, 4.5), 3, true), wallMat);
  B.add(boxGeo(V(-5.8, 0, -5.5), V(-5.5, 4.05, 4.5), 3), wallMat);
  B.add(boxGeo(V(5.5, 0, -5.5), V(5.8, 4.05, 4.5), 3), wallMat);
  // Window sill + vertical steel mullions looking out at high-altitude clouds
  B.add(boxGeo(V(-5.5, 0, 4.3), V(5.5, 0.72, 4.55), 3), wallMat);
  for (const mx of [-4.2, -2.1, 0, 2.1, 4.2]) {
    B.add(boxGeo(V(mx - 0.08, 0.72, 4.35), V(mx + 0.08, 4.05, 4.52), 2), darkMat);
  }
  B.add(boxGeo(V(-5.5, 2.55, 4.36), V(5.5, 2.68, 4.5), 3), darkMat);

  // Two office desks + monitors + chairs
  for (const dx of [-1.6, 1.45]) {
    B.add(boxGeo(V(dx - 0.95, 0.74, -0.85), V(dx + 0.95, 0.82, -0.05), 2, true), deskMat);
    for (const lx of [-0.85, 0.85]) for (const lz of [-0.78, -0.12]) {
      B.add(boxGeo(V(dx + lx - 0.04, 0, lz - 0.04), V(dx + lx + 0.04, 0.74, lz + 0.04), 1), darkMat);
    }
    // Monitor facing worker (+z)
    B.add(boxGeo(V(dx - 0.36, 0.96, -0.62), V(dx + 0.36, 1.42, -0.56), 1), darkMat);
    B.add(boxGeo(V(dx - 0.32, 1.0, -0.555), V(dx + 0.32, 1.38, -0.55), 1), screenMat);
    B.add(boxGeo(V(dx - 0.06, 0.82, -0.6), V(dx + 0.06, 0.96, -0.56), 1), darkMat);
    B.add(boxGeo(V(dx - 0.16, 0.82, -0.66), V(dx + 0.16, 0.84, -0.5), 1), darkMat);
    // Chair seat + backrest behind worker (z = 0.75)
    B.add(boxGeo(V(dx - 0.32, 0.46, 0.42), V(dx + 0.32, 0.54, 0.95), 1), chairMat);
    B.add(boxGeo(V(dx - 0.3, 0.54, 0.88), V(dx + 0.3, 1.18, 0.96), 1), chairMat);
    B.add(new THREE.CylinderGeometry(0.05, 0.05, 0.46, 8), darkMat, trs(dx, 0.23, 0.68));
  }

  B.build(tilt, true);

  // 3 swinging pendant ceiling lamps
  const lamps: THREE.Group[] = [];
  const shadeMat = lam("lampShade", () => ({ color: "#e8b44c" }));
  const bulbMat = new THREE.MeshBasicMaterial({ color: "#fff7dc" });
  for (const lx of [-2.0, 0, 2.0]) {
    const lg = new THREE.Group();
    lg.position.set(lx, 4.05, -0.35);
    const lb = new Batch();
    lb.add(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 6), darkMat, trs(0, -0.57, 0));
    lb.add(new THREE.ConeGeometry(0.32, 0.28, 14), shadeMat, trs(0, -1.2, 0));
    lb.build(lg, false);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bulbMat);
    bulb.position.set(0, -1.32, 0);
    lg.add(bulb);
    tilt.add(lg);
    lamps.push(lg);
  }

  // Sliding red ceramic coffee mug on left desk
  const mug = new THREE.Group();
  const mb = new Batch();
  const mugRed = lam("mugRed", () => ({ color: "#d43530" }));
  const coffee = lam("coffee", () => ({ color: "#4a2c18" }));
  mb.add(new THREE.CylinderGeometry(0.085, 0.078, 0.19, 14), mugRed, trs(0, 0.095, 0));
  mb.add(new THREE.CylinderGeometry(0.072, 0.072, 0.02, 12), coffee, trs(0, 0.185, 0));
  const handle = new THREE.TorusGeometry(0.055, 0.016, 6, 12, Math.PI);
  handle.rotateZ(-Math.PI / 2);
  mb.add(handle, mugRed, trs(0.082, 0.1, 0));
  mb.build(mug, true);
  mug.position.set(-1.95, 0.82, -0.36);
  tilt.add(mug);

  return { tilt, lamps, mug };
};

// ---------------- Set D: Harbour Quay & Wooden Rowboat ----------------
export const buildHarbour = (parent: THREE.Object3D, boatPos: V3) => {
  const B = new Batch();
  const quayStone = lam("quayStone", () => ({ map: rep(stoneHD(), 10, 3), color: "#c8bca6" }));
  const cob = lam("cobblePlaza", () => ({ map: rep(cobbleHD(), 14, 6) }));
  const bx = boatPos[0], bz = boatPos[2];

  // Distant picturesque harbour quay wall + waterfront houses behind the boat (z = bz + 22)
  B.add(boxGeo(V(bx - 55, -1.5, bz + 20), V(bx + 55, 2.2, bz + 48), 5), quayStone);
  B.add(boxGeo(V(bx - 55, 2.2, bz + 20), V(bx + 55, 2.35, bz + 48), 4), cob);
  const cols = ["#d8c2a3", "#c87152", "#dfc99b", "#be6249", "#c98b5b"];
  [-28, -14, 0, 15, 29].forEach((dx, i) => {
    const fh = 8.15 + (i % 2) * 1.6;
    const fMat = lam(`harbFac_${i}`, () => ({
      map: facadeHD(`harb_${i}`, 10.4, fh, {
        wall: cols[i % cols.length],
        shutter: i % 2 ? "#3d5c54" : "#455a73",
        door: true,
        timber: i === 2,
      }),
    }));
    const rMat = lam(`harbRoof_${i}`, () => ({ map: rep(roofHD(i % 2 ? "#7d493c" : "#545d6a"), 2, 2) }));
    B.add(boxGeo(V(bx + dx - 5.2, 2.35, bz + 26), V(bx + dx + 5.2, 10.5 + (i % 2) * 1.6, bz + 36), 0), fMat);
    B.add(frustumBox(10.5 + (i % 2) * 1.6, 12.6 + (i % 2) * 1.6, 5.4, 5.2, 3.6, 3.4, 3), rMat, trs(bx + dx, 0, bz + 31));
  });
  for (const tx of [-21, 7, 22]) addTree(B, bx + tx, 2.35, bz + 23.5, 1.05, Math.abs(tx));
  B.build(parent, true);
};

export const buildRowboat = (parent: THREE.Object3D, boatPos: V3) => {
  const G = new THREE.Group();
  G.position.set(...boatPos);
  parent.add(G);

  const B = new Batch();
  const hullWood = lam("boatHull", () => ({ map: rep(planksHD(), 2, 2), color: "#c27f45" }));
  const trimWood = lam("boatTrim", () => ({ map: beamHD(), color: "#7d4d29" }));
  const benchWood = lam("boatBench", () => ({ map: beamHD(), color: "#d69c63" }));

  // Tapered wooden hull (wide enough to look sturdy, narrow enough to tip clearly on a wave)
  B.add(frustumBox(-0.18, 0.36, 0.56, 1.55, 0.82, 1.95, 2), hullWood);
  // Recessed interior floor & inner gunwale trim
  B.add(boxGeo(V(-0.62, 0.12, -1.45), V(0.62, 0.22, 1.45), 1.5), benchWood);
  for (const sx of [-1, 1]) {
    B.add(boxGeo(V(sx * 0.76 - 0.07, 0.34, -1.85), V(sx * 0.76 + 0.07, 0.44, 1.85), 2), trimWood);
  }
  for (const sz of [-1.82, 1.82]) {
    B.add(boxGeo(V(-0.78, 0.34, sz - 0.08), V(0.78, 0.44, sz + 0.08), 1), trimWood);
  }
  // Fore & aft wooden thwart benches (leaving centre deck clear at z = 0 where hero stands!)
  for (const bz of [-0.95, 0.95]) {
    B.add(boxGeo(V(-0.74, 0.28, bz - 0.2), V(0.74, 0.35, bz + 0.2), 1, true), benchWood);
  }
  B.build(G, true);
  return G;
};

// ---------------- Set E: Cramped Grey Mechanical Closet ----------------
export const buildCloset = (parent: THREE.Object3D, origin: V3) => {
  const G = new THREE.Group();
  G.position.set(...origin);
  parent.add(G);

  const B = new Batch();
  const greyWall = lam("closWall", () => ({ map: rep(stoneHD(), 4, 4), color: "#686e78" }));
  const darkFloor = lam("closFloor", () => ({ color: "#494e57" }));
  const dullSteel = lam("closSteel", () => ({ color: "#58606c" }));
  const pipeMat = lam("closPipe", () => ({ color: "#787f8a" }));

  // Enclosed dim concrete room
  B.add(boxGeo(V(-4.2, -0.2, -4.5), V(4.2, 0, 3.6), 2.5), darkFloor);
  B.add(boxGeo(V(-4.2, 3.7, -4.5), V(4.2, 3.95, 3.6), 2.5, true), greyWall);
  B.add(boxGeo(V(-4.2, 0, 3.35), V(4.2, 3.7, 3.6), 2.5), greyWall);
  B.add(boxGeo(V(-4.2, 0, -4.5), V(-3.9, 3.7, 3.6), 2.5), greyWall);
  B.add(boxGeo(V(3.9, 0, -4.5), V(4.2, 3.7, 3.6), 2.5), greyWall);

  // Unpainted utilitarian grey concrete/steel block damper hanging on 4 plain rods
  B.add(boxGeo(V(-1.15, 1.15, 0.45), V(1.15, 2.55, 1.95), 1.5, true), dullSteel);
  for (const rx of [-0.85, 0.85]) for (const rz of [0.7, 1.7]) {
    B.add(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8), pipeMat, trs(rx, 3.12, rz));
  }
  // Exposed industrial pipes & safety bars in front (z = -0.35)
  for (const py of [2.9, 3.3]) {
    const p = new THREE.CylinderGeometry(0.09, 0.09, 7.8, 10);
    p.rotateZ(Math.PI / 2);
    B.add(p, pipeMat, trs(0, py, 2.95));
  }
  for (let bx = -2.4; bx <= 2.41; bx += 0.8) {
    B.add(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8), pipeMat, trs(bx, 0.67, -0.45));
  }
  B.add(boxGeo(V(-2.6, 1.32, -0.5), V(2.6, 1.4, -0.4), 2), pipeMat);

  B.build(G, true);
  return G;
};

// ---------------- Foreground Framing Props ----------------
export const buildFgProp = (kind: FgKind): THREE.Group => {
  const G = new THREE.Group();
  const B = new Batch();
  if (kind === "shrub") {
    const leafA = lam("leaf0", () => ({ color: "#62ae4c" }));
    const leafB = lam("leaf2", () => ({ color: "#72b853" }));
    for (const [dx, dy, dz, r, m] of [
      [0, 0.48, 0, 0.58, leafA], [-0.42, 0.36, 0.15, 0.44, leafB], [0.44, 0.38, -0.1, 0.46, leafB],
    ] as const) {
      B.add(new THREE.IcosahedronGeometry(r, 2), m, trs(dx, dy, dz, 0, 1.1, 0.85, 1.0));
    }
  } else if (kind === "planter") {
    const pot = lam("potTerra", () => ({ map: brick(), color: "#c26c4a" }));
    const leaf = lam("leaf1", () => ({ color: "#56a447" }));
    B.add(frustumBox(0, 0.52, 0.36, 0.36, 0.46, 0.46, 1), pot);
    B.add(new THREE.IcosahedronGeometry(0.48, 2), leaf, trs(0, 0.82, 0, 0, 1.05, 0.9, 1.05));
  } else {
    const wood = lam("boatTrim", () => ({ map: beamHD(), color: "#7d4d29" }));
    B.add(new THREE.CylinderGeometry(0.14, 0.15, 1.45, 10), wood, trs(0, 0.55, 0));
    B.add(new THREE.CylinderGeometry(0.12, 0.13, 1.15, 10), wood, trs(0.34, 0.42, 0.18));
  }
  B.build(G, false);
  return G;
};
