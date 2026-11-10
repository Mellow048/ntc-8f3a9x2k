// Unified Three.js world for "The Dark Day" (May 19, 1780).
// Preserves the proven stack: sky shader with tone-map-inverted stops (untone), camera-frozen sun,
// painted clouds, NOINK layers, ink-visible world on layer 0, sight-line culling for the common,
// foreground framing props, and 2D cartoon cast staged on canvas sprites.
// update(id, f, cam, scene) poses everything deterministically from story.ts (pure function of id + f).

import * as THREE from "three";
import {
  V, buildStreet, buildDesk, buildLamp, buildFire, buildTreeSet, buildFgProp, treelineTex,
  type Kit, type Ray, type StreetRig, type DeskRig, type LampRig,
} from "./build";
import { ctex, cloudHD } from "./paint";
import { LIGHTS, LOOK, type LightPreset, type LookName } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, type CamInfo } from "./cast";
import {
  FPS, SHOTS, DESK, LAMP, FIRE, TREE, FOREGROUND,
  camAt, sceneState, clamp01, type ShotDef,
} from "./story";

export const loadKit = async (): Promise<Kit> => ({});

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 56, 64, 64, 64);
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
const moonTex = () => ctex("moonDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 30, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,214,196,1)");
  gr.addColorStop(0.8, "rgba(255,190,170,0.98)");
  gr.addColorStop(1, "rgba(255,170,150,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  // maria — a couple of soft dark blotches
  g.fillStyle = "rgba(60,42,40,0.5)";
  g.beginPath(); g.ellipse(48, 56, 11, 8, 0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(78, 74, 8, 6, -0.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(62, 40, 5, 4, 0, 0, Math.PI * 2); g.fill();
});
const smokeTex = () =>
  ctex("smokePuff", 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "rgba(40,37,36,0.9)");
    gr.addColorStop(1, "rgba(40,37,36,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

/** Sight-line rays for the street shots so no house or tree blocks a camera */
const streetSightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) {
    if (s.place !== "street") continue;
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
  private fog = new THREE.Fog("#3d4148", 13, 145);
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<LookName, THREE.Texture[]>;
  private clouds: { m: THREE.Mesh; a: number; d: number; dy: number }[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];

  // Dynamic sets / rigs
  private streetRig: StreetRig;
  private deskRig: DeskRig;
  private lampRig: LampRig;
  private fireGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private fireRidgeGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private smoke: THREE.Sprite[] = [];
  private chimneySmoke: THREE.Sprite[] = [];
  private embers: THREE.Points;
  private emberMat: THREE.PointsMaterial;
  private emberVel: Float32Array;
  private sunSprite: THREE.Sprite;
  private sunHalo: THREE.Sprite;
  private eclipseMoon: THREE.Sprite;
  private moonSprite: THREE.Sprite;
  private stars: THREE.Points;
  private starMat: THREE.PointsMaterial;
  private deskFlame: THREE.Sprite;
  private deskGlow: THREE.Sprite;
  private deskLight: THREE.PointLight;
  private lampFlame: THREE.Sprite;
  private lampGlow: THREE.Sprite;
  private lampLight: THREE.PointLight;

  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;

    // ---- Sky dome (all on NOINK layer) ----
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

    // ---- sun disc (blood-red in shot 7, pale noon coin otherwise) + halo; eclipse disc crosses it in shot 1 ----
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(5.2, 2.1, 0.8), fog: false, depthWrite: false, transparent: true, opacity: 0.9 }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 0.6, 0.35), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    this.eclipseMoon = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(0.04, 0.045, 0.06), fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    this.moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), color: new THREE.Color(1.0, 0.9, 0.85), fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    for (const m of [this.sunSprite, this.sunHalo, this.eclipseMoon, this.moonSprite]) {
      m.frustumCulled = false;
      m.layers.set(NOINK);
      m.visible = false;
      R.add(m);
    }
    // fixed world placement: the noon sun hangs high right (street cameras face -z)
    this.sunSprite.position.set(34, 52, -68);
    this.sunSprite.scale.set(17, 17, 1);
    this.sunHalo.position.copy(this.sunSprite.position);
    this.sunHalo.scale.set(52, 52, 1);
    this.eclipseMoon.position.copy(this.sunSprite.position);
    this.eclipseMoon.scale.set(15, 15, 1);
    // the blood sun hangs lower, right over the meeting-house steeple
    this.moonSprite.position.set(5.5, 33.5, -76);
    this.moonSprite.scale.set(24, 24, 1);

    // ---- stars (night only) ----
    {
      const n = 420, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(0.12 + Math.random() * 0.82), r = 980;
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starMat = new THREE.PointsMaterial({ color: "#e8e2d8", size: 2.1, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
      this.stars = new THREE.Points(g, this.starMat);
      this.stars.frustumCulled = false;
      this.stars.layers.set(NOINK);
      R.add(this.stars);
    }

    // ---- lights ----
    this.hemi = new THREE.HemisphereLight("#77808e", "#3b3733", 0.42);
    this.sun = new THREE.DirectionalLight("#e9e6da", 1.15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);

    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)),
      golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
      dark: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.dark.cloud)),
      blood: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.blood.cloud)),
      night: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.night.cloud)),
    };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const d = 480 + (i % 3) * 70;
      const dy = 62 + (i % 4) * 30;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: this.cloudMaps.dark[i % 4], transparent: true, depthWrite: false, fog: false, opacity: 0.85 }),
      );
      const w = 150 + (i % 4) * 30;
      m.scale.set(w, w * 0.5, 1);
      m.layers.set(NOINK);
      m.frustumCulled = false;
      R.add(m);
      this.clouds.push({ m, a, d, dy });
    }

    // ---- Set A: meeting-house common & main street ----
    this.streetRig = buildStreet(R, streetSightLines());

    // ---- Set B: Williams' study ----
    this.deskRig = buildDesk(R, DESK);
    this.deskFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(2.2, 1.5, 0.7), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    this.deskGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(1.35, 0.95, 0.45), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    this.deskFlame.position.set(DESK[0] + 0.98, DESK[1] + 1.3, DESK[2] + 0.35);
    this.deskGlow.position.set(DESK[0] + 0.98, DESK[1] + 1.36, DESK[2] + 0.35);
    this.deskFlame.scale.set(0.22, 0.34, 1);
    this.deskGlow.scale.set(1.5, 1.5, 1);
    this.deskLight = new THREE.PointLight("#ffc27a", 22, 8, 1.8);
    this.deskLight.position.set(DESK[0] + 0.98, DESK[1] + 1.35, DESK[2] + 0.35);
    for (const o of [this.deskFlame, this.deskGlow]) { o.layers.set(NOINK); R.add(o); }
    R.add(this.deskLight);

    // ---- Set C: the lamp insert ----
    this.lampRig = buildLamp(R, LAMP);
    this.lampFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(2.6, 1.9, 1.0), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    this.lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(1.6, 1.15, 0.62), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
    this.lampFlame.position.set(LAMP[0], LAMP[1] + 1.3, LAMP[2]);
    this.lampGlow.position.set(LAMP[0], LAMP[1] + 1.47, LAMP[2]);
    this.lampFlame.scale.set(0.5, 0.8, 1);
    this.lampGlow.scale.set(2.5, 2.5, 1);
    this.lampLight = new THREE.PointLight("#ffc27a", 30, 9, 1.8);
    this.lampLight.position.set(LAMP[0], LAMP[1] + 1.5, LAMP[2] + 0.15);
    for (const o of [this.lampFlame, this.lampGlow]) { o.layers.set(NOINK); R.add(o); }
    R.add(this.lampLight);
    this.lampRig.panel.layers.set(NOINK);

    // ---- Set D: the Ontario horizon ----
    buildFire(R, FIRE);
    {
      const tlTex = treelineTex();
      const tl = new THREE.Mesh(new THREE.PlaneGeometry(230, 30), new THREE.MeshBasicMaterial({ map: tlTex, transparent: true, depthWrite: false, fog: false }));
      tl.position.set(FIRE[0], 14.5, FIRE[2] - 78);
      tl.layers.set(NOINK);
      R.add(tl);
      this.fireGlow = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 1.0, 0.28), fog: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.fireGlow.position.set(FIRE[0], 7.6, FIRE[2] - 80);
      this.fireGlow.layers.set(NOINK);
      R.add(this.fireGlow);
      this.fireRidgeGlow = new THREE.Mesh(new THREE.PlaneGeometry(240, 46), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 0.42, 0.1), fog: false, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.fireRidgeGlow.position.set(FIRE[0], 22, FIRE[2] - 81.5);
      this.fireRidgeGlow.layers.set(NOINK);
      R.add(this.fireRidgeGlow);
      // embers drifting up across the ridge
      const n = 120, pos = new Float32Array(n * 3);
      this.emberVel = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = FIRE[0] + ((Math.sin(i * 127.1) * 0.5 + 0.5) - 0.5) * 150;
        pos[i * 3 + 1] = 4 + (Math.sin(i * 311.7) * 0.5 + 0.5) * 10;
        pos[i * 3 + 2] = FIRE[2] - 66 - (Math.sin(i * 74.7) * 0.5 + 0.5) * 16;
        this.emberVel[i * 3] = (Math.sin(i * 12.9) - 0.5) * 0.42;
        this.emberVel[i * 3 + 1] = 2.6 + (i % 5) * 0.5;
        this.emberVel[i * 3 + 2] = (Math.sin(i * 39.4) - 0.5) * 0.3;
      }
      const eg = new THREE.BufferGeometry();
      eg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.emberMat = new THREE.PointsMaterial({ color: "#ffb14a", size: 0.24, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      this.embers = new THREE.Points(eg, this.emberMat);
      this.embers.frustumCulled = false;
      this.embers.layers.set(NOINK);
      R.add(this.embers);
      // smoke column sprites
      const sTex = smokeTex();
      for (let i = 0; i < 8; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 }));
        s.userData.base = i / 8;
        s.layers.set(NOINK);
        this.smoke.push(s);
        R.add(s);
      }
    }

    // ---- Set E: the tree cookie ----
    buildTreeSet(R, TREE);

    // ---- chimney smoke over the common (cook fires still burn in the gloom) ----
    {
      const sTex = smokeTex();
      for (const [cx, cy, cz] of [[-6.1, 7.3, 6.9], [7.1, 8.5, 7.7], [-6.25, 7.2, 1.3]] as const) {
        for (let i = 0; i < 4; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, transparent: true, depthWrite: false, fog: false, opacity: 0.4 }));
          s.userData.base = i / 4;
          s.userData.origin = [cx, cy, cz];
          s.layers.set(NOINK);
          this.chimneySmoke.push(s);
          R.add(s);
        }
      }
    }

    // ---- near foreground framing props ----
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

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS;
    const s = SHOTS[id - 1];
    const light = s.light as LookName;
    const L = LIGHTS[light];
    const K = LOOK[light];
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
    this.hemi.intensity = L.hemiI - 0.34 * st.panel; // the hand comes down
    this.sun.color.set(L.sunCol);
    this.sun.intensity = L.sunI * (light === "blood" ? 0.85 + 0.3 * st.redSun : 1) * (1 - 0.55 * st.panel);

    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 8, 12, 95);
    if (light === "blood") Rr = Math.max(Rr, 26);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220);
    this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480;
    sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias;
    this.sun.shadow.normalBias = L.normalBias * (Rr / 12);

    TONE.uLitCol.value.set(L.lit[0], L.lit[1], L.lit[2]);
    TONE.uShadeCol.value.set(...L.shade);
    TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert;
    TONE.uSideK.value = L.sideK;
    TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = K.sat;

    CHAR.uCharTint.value.set(...L.charTint);
    CHAR.uCharShade.value = L.charShade;
    CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad;
    CHAR.uSideTint.value.set(...L.sideTint);

    // ---- Sky, fog, sun/moon sprites, clouds ----
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

    // noon sun (shots 1-6,8): pale, dimmed by the eclipse bite crossing in shot 1
    const eclipse = light === "dark" && id === 1 ? st.eclipseK : 0;
    const showSun = light === "dark";
    this.sunSprite.visible = showSun;
    this.sunHalo.visible = showSun;
    this.eclipseMoon.visible = eclipse > 0.02;
    if (showSun) {
      const dim = 1 - 0.82 * eclipse;
      this.sunSprite.material.opacity = 0.28 + 0.45 * dim;
      this.sunSprite.material.color.set(1.5 * dim + 0.25, 1.25 * dim + 0.22, 1.05 * dim + 0.2);
      this.sunHalo.material.opacity = 0.5 * dim;
      const off = (1 - eclipse) * 10;
      this.eclipseMoon.position.set(this.sunSprite.position.x + off, this.sunSprite.position.y + 0.6 * off, this.sunSprite.position.z);
      this.eclipseMoon.material.opacity = 0.96 * Math.min(1, eclipse * 1.15);
      this.sunHalo.position.copy(this.sunSprite.position);
      this.sunHalo.scale.setScalar(52 * (1 - 0.35 * eclipse));
    }
    // blood sun (shot 7): fat low red coin over the steeple
    if (light === "blood") {
      this.sunSprite.visible = true;
      this.sunHalo.visible = true;
      this.sunSprite.position.set(2.5, 14.5, -75);
      this.sunSprite.scale.setScalar(30 + 7 * st.redSun);
      this.sunSprite.material.opacity = 0.75 + 0.25 * st.redSun;
      this.sunSprite.material.color.set(1.85 + 0.9 * st.redSun, 0.42 + 0.22 * st.redSun, 0.12 + 0.06 * st.redSun);
      this.sunHalo.position.copy(this.sunSprite.position);
      this.sunHalo.scale.setScalar(66 + 30 * st.redSun);
      this.sunHalo.material.opacity = 0.55 + 0.35 * st.redSun;
      this.sunHalo.material.color.set(1.0, 0.32, 0.1);
      this.eclipseMoon.visible = false;
    }
    // night (shot 9): red moon + stars
    this.moonSprite.visible = light === "night";
    this.starMat.opacity = light === "night" ? 0.88 : 0;
    if (light === "night") this.moonSprite.material.opacity = 0.94;
    if (light !== "blood") { this.sunHalo.material.color.set(1, 1, 1); }

    const cloudDrift = t * (0.007 + 0.02 * st.wind);
    this.clouds.forEach((cl, i) => {
      const ang = cl.a + cloudDrift * (i % 2 ? 1 : 0.7);
      cl.m.position.set(
        cam.position.x + Math.sin(ang) * cl.d,
        cam.position.y + cl.dy,
        cam.position.z + Math.cos(ang) * cl.d,
      );
      cl.m.lookAt(cam.position);
      (cl.m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[light][i % 4];
    });

    // ---- Foreground framing props ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;

    // ---- Set D dynamics: fire glow, embers, smoke ----
    if (id === 4) {
      this.fireGlow.material.opacity = 0.55 + 0.5 * st.fireGlow;
      this.fireGlow.material.color.setRGB(1.4 + 1.6 * st.fireGlow, 0.45 + 0.55 * st.fireGlow, 0.1 + 0.18 * st.fireGlow);
      this.fireRidgeGlow.material.opacity = 0.18 + 0.4 * st.fireGlow;
      for (const s2 of this.smoke) {
        const u = (t * 0.05 + s2.userData.base) % 1;
        s2.position.set(FIRE[0] + Math.sin(t * 0.4 + s2.userData.base * 9) * 3.5, 11 + u * 42, FIRE[2] - 76 - u * 8);
        const sc = 8 + u * 26;
        s2.scale.set(sc, sc * 0.8, 1);
        s2.material.opacity = 0.88 * (1 - u) * (0.35 + 0.65 * Math.min(1, u * 5)) * (0.4 + 0.6 * st.fireGlow);
      }
      const p = this.embers.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + (this.emberVel[i * 3 + 1] * st.emberK) / FPS;
        let x = p.getX(i) + this.emberVel[i * 3] / FPS + Math.sin(t * 2 + i) * 0.005;
        if (y > 19) {
          y = 4 + (i % 7) * 0.5;
          x = FIRE[0] + ((Math.sin(i * 127.1) * 0.5 + 0.5) - 0.5) * 150;
        }
        p.setY(i, y);
        p.setX(i, x);
      }
      p.needsUpdate = true;
    } else {
      for (const s2 of this.smoke) s2.material.opacity = 0;
    }

    // ---- chimney smoke over the common (all street shots) ----
    {
      const show = id === 1 || id === 3 || id === 5 || id === 7 || id === 9;
      for (const s2 of this.chimneySmoke) {
        if (!show) { s2.material.opacity = 0; continue; }
        const [ox, oy, oz] = s2.userData.origin as [number, number, number];
        const u = (t * 0.075 + s2.userData.base) % 1;
        s2.position.set(ox + Math.sin(t * 0.6 + s2.userData.base * 7) * 0.8, oy + u * 6.5, oz);
        const sc = 0.9 + u * 2.6;
        s2.scale.set(sc, sc, 1);
        s2.material.opacity = 0.34 * (1 - u) * (0.4 + 0.6 * Math.min(1, u * 4));
      }
    }

    // ---- candle-window ignition cascade (from f346, 3 frames before "candles") ----
    {
      const show = id === 1 || id === 3 || id === 5 || id === 7 || id === 9;
      this.streetRig.windows.forEach((wm, i) => {
        const ignite = clamp01((f - (346 + i * 9)) / 14);
        const vigil = id === 1 ? 0.25 : 0; // a couple of windows already lit in the hook
        const flick = 0.78 + 0.3 * Math.abs(Math.sin(t * 12 + i * 1.93 + Math.sin(t * 27.3 + i * 2.1) * 0.6));
        wm.emissiveIntensity = show ? Math.max(vigil, ignite * 1.15 * flick) : 0;
      });
      this.streetRig.stallLantern.emissiveIntensity = show && f >= 348
        ? 1.15 + 0.45 * Math.abs(Math.sin(t * 13.7 + Math.sin(t * 29.1) * 0.5))
        : show ? 0.25 : 0;
    }

    // ---- desk lamp (shot 2): candle flutter + quill-arm room tone ----
    if (id === 2) {
      const warm = 1 + 0.13 * Math.sin(t * 15.7) * Math.sin(t * 6.1);
      this.deskFlame.scale.set(0.22 * warm, 0.34 * warm, 1);
      this.deskGlow.scale.set(1.5 * warm, 1.5 * warm, 1);
      this.deskLight.intensity = 22 * warm;
      this.deskFlame.visible = this.deskGlow.visible = true;
      { const v = 0.34 + 0.035 * Math.sin(t * 3.1); this.deskRig.back.color.setRGB(v, v * 0.85, v * 0.66); }
    } else {
      this.deskFlame.visible = this.deskGlow.visible = id === 6 ? false : false;
    }

    // ---- lamp insert (shot 6): the smoked-glass panel slides down, the room dies, then lifts ----
    if (id === 6) {
      const bell = st.panel;
      this.lampRig.panel.position.y = 8.65 - 8.3 * bell;
      this.lampRig.panel.material.opacity = 0.88 * bell;
      const warm = 1 + 0.09 * Math.sin(t * 17) * Math.sin(t * 7.3);
      this.lampFlame.scale.set(0.5 * warm, 0.8 * warm, 1);
      this.lampGlow.scale.set(2.5 * warm, 2.5 * warm, 1);
      this.lampLight.intensity = 30 * warm * (1 - 0.82 * bell);
      this.lampFlame.visible = this.lampGlow.visible = true;
    } else {
      this.lampFlame.visible = id === 6;
      this.lampGlow.visible = id === 6;
    }

    // ---- Cast + FX billboards ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const staged = stage(id, f, { pos: cam.position, right, sun: sunDir } as CamInfo);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

    // request everything first — sprite requests bind retroactively at flush
    const wantA: { a: Actor; p: (typeof staged.places)[number] }[] = [];
    for (const p of staged.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(wantA.length);
      const [w, h, k] = p.size ?? [600, 1000, 1.0];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      wantA.push({ a, p });
    }
    const wantF: { e: Fx; p: (typeof staged.fx)[number] }[] = [];
    for (const p of staged.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h) + 0.5))) continue;
      const e = this.fx(wantF.length);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      wantF.push({ e, p });
    }
    this.pool.flush();

    for (const { a, p } of wantA) {
      const sc2 = p.scale ?? 1;
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      a.bind();
    }
    for (let i = wantA.length; i < this.actors.length; i++) this.actors[i].mesh.visible = false;

    for (const { e, p } of wantF) {
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      e.bind();
    }
    for (let i = wantF.length; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;

    return focus;
  }
}
