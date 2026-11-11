// Unified Three.js world for "The Giant Golden Ball Inside Taipei 101".
// Preserves the proven Bridge look stack (sky shader, horizon fog, sun disc + halo,
// painted clouds, camera-relative frozen sun, twoTone + cardShade uniform sync,
// painted water shader, NOINK layer, sight-line culling, foreground framing props)
// and poses the 5 story sets deterministically from story.ts at every frame f.

import * as THREE from "three";
import {
  V, lam, phong, buildCity, buildTowerBase, buildTowerUpper, buildAtrium, buildDamperSphere,
  buildOffice, buildHarbour, buildRowboat, buildCloset, buildFgProp,
  type Kit, type Ray, type OfficeRig,
} from "./build";
import { ctex, waterNear, waterFar, cloudHD } from "./paint";
import { LIGHTS, LOOK, type LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, SHOTS, ATRIUM, OFFICE, BOAT, CLOSET, FOREGROUND,
  camAt, sceneState, clamp01, type ShotDef,
} from "./story";

export const loadKit = async (): Promise<Kit> => ({});

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
});

const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = Math.hypot(x - 127.5, y - 127.5) / 128;
      const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
      const i = (y * 256 + x) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
      im.data[i + 3] = Math.round(255 * Math.min(1, a));
    }
  }
  g.putImageData(im, 0, 0);
});

/** Sight-line rays for city shots so no surrounding building or tree blocks a camera */
const citySightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) {
    if (s.place !== "city") continue;
    for (let f = s.a; f < s.b; f += 4) {
      const c = camAt(s.id, f), o = V(...c.pos), look = V(...c.look);
      const fw = look.clone().sub(o), len = fw.length();
      fw.normalize();
      const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
      const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
      for (const [sx, sy] of [[0, 0], [-0.55, 0], [0.55, 0], [0, 0.55], [0, -0.4]] as const) {
        out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
      }
    }
  }
  return out;
};

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

const UP = new THREE.Vector3(0, 1, 0);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];

  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite;
  private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: { m: THREE.Mesh; a: number; d: number; dy: number }[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];

  // Dynamic story rigs
  private towerUpper = new THREE.Group();
  private atriumGroup: THREE.Group;
  private sphereGroup: THREE.Group;
  private cables: THREE.Mesh[] = [];
  private pistons: { barrel: THREE.Mesh; rod: THREE.Mesh; bx: number; bz: number }[] = [];
  private officeRig: OfficeRig;
  private boatGroup: THREE.Group;

  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private vB = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;

    // ---- Sky dome + sun sprites + clouds (all on NOINK layer) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() },
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 40, 20), this.skyMat);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending,
    }));
    this.sunDisc.renderOrder = -0.5;
    this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) {
      m.frustumCulled = false;
      m.layers.set(NOINK);
      R.add(m);
    }

    this.hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 0.55);
    this.sun = new THREE.DirectionalLight("#fff3e0", 2.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);

    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)),
      golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
    };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.22;
      const d = 540 + (i % 3) * 65;
      const dy = 70 + (i % 4) * 32;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.08, 1.08, 1.08), transparent: true, depthWrite: false, fog: false }),
      );
      const w = 135 + (i % 4) * 28;
      m.scale.set(w, w * 0.5, 1);
      m.layers.set(NOINK);
      m.frustumCulled = false;
      R.add(m);
      this.clouds.push({ m, a, d, dy });
    }

    // ---- Set A: City Plaza + Taipei 101 Base & Swaying Upper Tiers ----
    buildCity(R, citySightLines());
    buildTowerBase(R);
    this.towerUpper.position.set(0, 16, 0);
    buildTowerUpper(this.towerUpper);
    R.add(this.towerUpper);

    // ---- Set B: Observatory Atrium + 660-ton Golden Sphere + 8 Cables + 8 Hydraulic Pistons ----
    this.atriumGroup = buildAtrium(R, ATRIUM);
    this.sphereGroup = buildDamperSphere(this.atriumGroup);

    const cableMat = phong("cableIron", () => ({ color: "#3d4452", specular: "#8a929e", shininess: 45 }), 0.2);
    const unitCyl = new THREE.CylinderGeometry(0.055, 0.055, 1, 8);
    for (let i = 0; i < 8; i++) {
      const cm = new THREE.Mesh(unitCyl, cableMat);
      cm.castShadow = true;
      cm.frustumCulled = false;
      this.atriumGroup.add(cm);
      this.cables.push(cm);
    }

    const barrelMat = lam("hydBarrel", () => ({ color: "#c93b35" }));
    const rodMat = phong("hydRod", () => ({ color: "#aeb6c2", specular: "#ffffff", shininess: 65 }), 0.3);
    const barrelGeo = new THREE.CylinderGeometry(0.14, 0.16, 1, 10);
    const rodGeo = new THREE.CylinderGeometry(0.075, 0.075, 1, 10);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const bx = Math.cos(a) * 2.85, bz = Math.sin(a) * 2.85;
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      const rod = new THREE.Mesh(rodGeo, rodMat);
      barrel.castShadow = true;
      rod.castShadow = true;
      this.atriumGroup.add(barrel, rod);
      this.pistons.push({ barrel, rod, bx, bz });
    }

    // ---- Set C: 90th-Floor Panoramic Office ----
    this.officeRig = buildOffice(R, OFFICE);

    // ---- Set D: Harbour Water + Quay + Wooden Rowboat ----
    const wNear = waterNear(), wFar = waterFar();
    for (const tex of [wNear, wFar]) {
      tex.colorSpace = THREE.NoColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "harbourWater1";
    const waterGeo = new THREE.PlaneGeometry(150, 120);
    waterGeo.rotateX(-Math.PI / 2);
    const wm = new THREE.Mesh(waterGeo, waterM);
    wm.position.set(BOAT[0], BOAT[1], BOAT[2] - 10);
    wm.receiveShadow = true;
    R.add(wm);

    buildHarbour(R, BOAT);
    this.boatGroup = buildRowboat(R, BOAT);

    // ---- Set E: Cramped Grey Mechanical Closet ----
    buildCloset(R, CLOSET);

    // ---- Near Foreground Framing Props ----
    for (const fg of FOREGROUND) {
      const o = buildFgProp(fg.kind);
      o.position.set(...fg.pos);
      o.rotation.y = fg.yaw ?? 0;
      o.scale.setScalar(fg.s ?? 1);
      o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b });
      R.add(o);
    }
  }

  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az);
    const el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az);
    const hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  private placeLink(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
    const dir = this.vB.subVectors(b, a);
    const len = Math.max(0.01, dir.length());
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.copy(this.q.setFromUnitVectors(UP, dir.divideScalar(len)));
    mesh.scale.set(1, len, 1);
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS;
    const s = SHOTS[id - 1];
    const L = LIGHTS[s.light];
    const K = LOOK[s.light];
    const st = sceneState(id, f);

    // ---- Camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    cam.layers.enable(NOINK);

    const focus = V(...c.look);
    const dist = cam.position.distanceTo(focus);

    // ---- Sun + twoTone + cardShade uniforms ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky);
    this.hemi.groundColor.set(L.ground);
    this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol);
    this.sun.intensity = s.place === "closet" ? L.sunI * 0.55 : L.sunI;

    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 8, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220);
    this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480;
    sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias;
    this.sun.shadow.normalBias = L.normalBias * (Rr / 12);

    const dimCloset = s.place === "closet" ? 0.62 : 1.0;
    TONE.uLitCol.value.set(L.lit[0] * dimCloset, L.lit[1] * dimCloset, L.lit[2] * dimCloset);
    TONE.uShadeCol.value.set(...L.shade);
    TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert;
    TONE.uSideK.value = L.sideK;
    TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = s.place === "closet" ? 0.65 : K.sat;

    CHAR.uCharTint.value.set(...L.charTint);
    CHAR.uCharShade.value = L.charShade;
    CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad;
    CHAR.uSideTint.value.set(...L.sideTint);

    // ---- Sky, fog, golden sun disc + halo, and drifting clouds around active camera ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const el = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(el[1], el[2], el[3], el[4]);
    this.sky.position.copy(cam.position);

    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;
    scene.background = null;

    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position);
      this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }

    const cloudDrift = t * (0.008 + 0.025 * st.wind);
    this.clouds.forEach((cl, i) => {
      const ang = cl.a + cloudDrift * (i % 2 ? 1 : 0.7);
      cl.m.position.set(
        cam.position.x + Math.sin(ang) * cl.d,
        cam.position.y + cl.dy,
        cam.position.z + Math.cos(ang) * cl.d,
      );
      cl.m.lookAt(cam.position);
      (cl.m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light][i % 4];
    });

    // ---- Water uniforms ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade);
    W.wTime.value = t;

    // ---- Foreground framing props ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;

    // ---- Dynamic Pose 1: Taipei 101 upper pagoda flex ----
    this.towerUpper.rotation.set(0, 0, -st.towerBend);

    // ---- Dynamic Pose 2: 660-ton Golden Sphere + 8 Cables + 8 Hydraulic Pistons ----
    const L_PEND = 5.45;
    const sinA = Math.max(-0.42, Math.min(0.42, st.damperX / L_PEND));
    const theta = Math.asin(sinA);
    const sx = L_PEND * Math.sin(theta);
    const sy = 9.4 - L_PEND * Math.cos(theta);
    this.sphereGroup.position.set(sx, sy, 0);
    this.sphereGroup.rotation.set(0, 0, theta);

    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const eqR = 2.08 * 1.015;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const topPt = this.v.set(Math.cos(a) * 2.55, 9.35, Math.sin(a) * 2.55);
      const lx = Math.cos(a) * eqR, lz = Math.sin(a) * eqR;
      const eqPt = V(sx + lx * cosT, sy + lx * sinT, lz);
      this.placeLink(this.cables[i], topPt, eqPt);
    }

    const pinPt = V(sx + 2.25 * sinT, sy - 2.25 * cosT, 0);
    for (const p of this.pistons) {
      const basePt = V(p.bx, -0.15, p.bz);
      const midPt = basePt.clone().lerp(pinPt, 0.54);
      this.placeLink(p.barrel, basePt, midPt);
      this.placeLink(p.rod, midPt, pinPt);
    }

    // ---- Dynamic Pose 3: 90th-Floor Office Sway, Swinging Lamps & Sliding Mug ----
    this.officeRig.tilt.rotation.set(0, 0, st.officeRoll);
    for (const lg of this.officeRig.lamps) lg.rotation.set(0, 0, st.lampAngle);
    this.officeRig.mug.position.set(
      -1.95 + 1.05 * clamp01(st.mugSlide),
      0.82 - 0.14 * clamp01(st.mugTip),
      -0.36,
    );
    this.officeRig.mug.rotation.set(0, 0, -1.35 * clamp01(st.mugTip));

    // ---- Dynamic Pose 4: Harbour Rowboat Heave & Wave Roll ----
    this.boatGroup.position.set(BOAT[0], BOAT[1] + st.boatBob, BOAT[2]);
    this.boatGroup.rotation.set(0.02 * Math.sin(t * 2.1), 0, st.boatRoll);

    // ---- Cast + FX Billboards ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const staged = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

    let ai = 0;
    const used: Actor[] = [];
    for (const p of staged.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [600, 1000, 1.0];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;

    let fi = 0;
    const fused: Fx[] = [];
    for (const p of staged.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;

    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();

    return focus;
  }
}
