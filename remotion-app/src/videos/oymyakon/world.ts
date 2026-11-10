// Oymyakon, Siberia: one three.js scene with sets per beat —
// "valley" (shots 1,2,8), "street" (shot 3, cars + well), "school" (shot 4, + frost CU),
// "laundry" (shot 5), "monument" (shot 6, the 1933 record, night + aurora), "splash"
// (shot 7, the boiling-water stunt) and "spring" (shot 9, the hot spring tag).
// update(id, f, cam, scene) poses everything (pure function of id + f).
import * as THREE from "three";
import { NOINK } from "./ink";
import { Guy } from "./cast";
import { FPS, camAt, peopleAt, clamp01, smooth } from "./story";
import type { Kit } from "./build";

export const loadKit = async (): Promise<Kit> => ({});

// ---------------- canvas textures ----------------
const ctex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = 1): THREE.CanvasTexture => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
};
const blob = (inner: string, outer = "rgba(0,0,0,0)") =>
  ctex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 5, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
const FLAME = blob("rgba(255,232,150,1)", "rgba(255,120,30,0)");
const GLOW = blob("rgba(255,220,150,1)", "rgba(255,180,90,0)");
const SUN = blob("rgba(255,244,214,1)", "rgba(255,236,190,0)");
const SMOKE = blob("rgba(240,242,246,0.9)", "rgba(240,242,246,0)");
const DARKSMOKE = blob("rgba(28,28,30,0.9)", "rgba(28,28,30,0)");
const snowTex = () =>
  ctex(256, 256, (g) => {
    g.fillStyle = "#e8edf2";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i++) {
      g.fillStyle = `rgba(255,255,255,${0.35 + (i % 5) * 0.12})`;
      g.fillRect((i * 97) % 256, (i * 61) % 256, 1.6, 1.6);
      g.fillStyle = `rgba(160,175,195,${0.16 + (i % 3) * 0.1})`;
      g.fillRect((i * 53) % 256, (i * 131) % 256, 2.2, 1.2);
    }
  }, 10);
const shirtTex = (col: string) =>
  ctex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = col;
    g.beginPath(); // body
    g.moveTo(34, 34); g.lineTo(94, 34); g.lineTo(100, 122); g.lineTo(28, 122); g.closePath(); g.fill();
    g.beginPath(); // sleeves, frozen poker-straight out
    g.moveTo(34, 38); g.lineTo(4, 66); g.lineTo(16, 82); g.lineTo(40, 58); g.closePath(); g.fill();
    g.moveTo(94, 38); g.lineTo(124, 66); g.lineTo(112, 82); g.lineTo(88, 58); g.closePath(); g.fill();
    g.fillStyle = "rgba(120,140,165,0.5)";
    g.fillRect(28, 108, 72, 8); // frost hem
  });
const faceCardTex = () =>
  ctex(512, 640, (g) => {
    g.clearRect(0, 0, 512, 640);
    // bean head close-up, facing front
    g.fillStyle = "#ffe2c2";
    g.beginPath();
    g.ellipse(256, 268, 150, 168, 0, 0, Math.PI * 2);
    g.fill();
    // fur hat
    g.fillStyle = "#5a4636";
    g.beginPath();
    g.ellipse(256, 130, 155, 74, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(100, 122, 312, 30);
    // eyes: squeezed against the cold, frosted lashes
    g.strokeStyle = "#241726";
    g.lineWidth = 13;
    g.lineCap = "round";
    for (const s of [-1, 1]) {
      const ex = 256 + s * 66;
      g.beginPath();
      g.arc(ex, 300, 30, Math.PI * 0.18, Math.PI * 0.82, false);
      g.stroke();
    }
    // frost specks at lash tips (both outer corners)
    g.fillStyle = "#eaf6ff";
    const frost = [[168, 316], [176, 330], [158, 331], [188, 344], [344, 316], [336, 330], [354, 331], [324, 344]];
    for (const [x, y] of frost) {
      g.beginPath();
      g.arc(x, y, 6 + (x * 7 + y * 3) % 5, 0, Math.PI * 2);
      g.fill();
    }
    // nose + mouth: the loyal deadpan of a man who has seen minus sixty
    g.fillStyle = "#e8b48e";
    g.beginPath();
    g.ellipse(256, 372, 22, 15, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#241726";
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(226, 442);
    g.quadraticCurveTo(256, 452, 286, 442);
    g.stroke();
    // scarf wrap
    g.fillStyle = "#a8323e";
    g.fillRect(96, 500, 320, 68);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(96, 500, 320, 14);
  });
const thermomTex = () =>
  ctex(128, 512, (g) => {
    g.clearRect(0, 0, 128, 512);
    g.fillStyle = "#d8d2c2";
    g.fillRect(38, 0, 52, 512);
    g.fillStyle = "#8a857a";
    for (let y = 20; y < 500; y += 26) g.fillRect(38, y, 22, 5);
    g.fillStyle = "#b03030";
    g.fillRect(56, 430, 16, 70); // the red column: barely alive
    g.beginPath(); g.arc(64, 476, 26, 0, Math.PI * 2); g.fill();
  });

const DAY_SKY = ["#6d89a8", "#8ba6bd", "#aec2d2", "#cdd9e2", "#eef0ea"]; // pale ice
const NIGHT_SKY = ["#030711", "#071020", "#0d1830", "#16233e", "#21304e"]; // record night
const GOLD_SKY = ["#4a3a30", "#6d5540", "#94744f", "#c4a468", "#ecdcb0"]; // tag-shot winter gold

export class World {
  root: THREE.Group;
  private valley = new THREE.Group();
  private street = new THREE.Group();
  private school = new THREE.Group();
  private laundry = new THREE.Group();
  private monument = new THREE.Group();
  private splash = new THREE.Group();
  private spring = new THREE.Group();
  private faceCard: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#d3dde6", 34, 380);
  // characters
  private folkA: Guy; private folkB: Guy; private folkC: Guy; private folkD: Guy; private folkE: Guy;
  private kidA: Guy; private kidB: Guy; private kidC: Guy;
  private traveler: Guy; private springer: Guy;
  private carExhaust: THREE.Sprite[] = [];
  private carGlow: THREE.Sprite[] = [];
  private breath: THREE.Sprite[] = [];
  private steam: THREE.Sprite[] = [];
  private faceGlow: THREE.Sprite;
  private aurora: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private dropGeo: THREE.BufferGeometry;
  private dropVel: Float32Array;
  private drops: THREE.Points;
  private dropMat: THREE.PointsMaterial;
  private landFlash: THREE.Sprite[] = [];
  private snowStreaks: THREE.Points;
  private starMat: THREE.PointsMaterial;
  private laundryBits: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private target = new THREE.Vector3();

  constructor(_kit: Kit) {
    const R = new THREE.Group();
    this.root = R;
    R.add(this.valley, this.street, this.school, this.laundry, this.monument, this.splash, this.spring);

    // ---------- lights ----------
    this.hemi = new THREE.HemisphereLight("#cfe0ee", "#5a5b58", 0.95);
    this.dir = new THREE.DirectionalLight("#f2f6ff", 0.75);
    this.dir.position.set(-16, 26, 10);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    this.dir.shadow.camera.left = -18; this.dir.shadow.camera.right = 18; this.dir.shadow.camera.top = 20; this.dir.shadow.camera.bottom = -10;
    this.dir.shadow.camera.far = 100;
    R.add(this.hemi, this.dir, this.dir.target);

    // ---------- sky dome ----------
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color(DAY_SKY[0]) }, c1: { value: new THREE.Color(DAY_SKY[1]) },
        c2: { value: new THREE.Color(DAY_SKY[2]) }, c3: { value: new THREE.Color(DAY_SKY[3]) }, c4: { value: new THREE.Color(DAY_SKY[4]) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 c0,c1,c2,c3,c4;
        void main(){ float h = clamp(normalize(vP).y, -0.05, 0.65);
          vec3 col = h < 0.06 ? mix(c4, c3, smoothstep(-0.05, 0.06, h))
                   : h < 0.18 ? mix(c3, c2, smoothstep(0.06, 0.18, h))
                   : h < 0.34 ? mix(c2, c1, smoothstep(0.18, 0.34, h))
                   : mix(c1, c0, smoothstep(0.34, 0.65, h));
          gl_FragColor = vec4(col, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1050, 32, 16), this.skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; sky.layers.set(NOINK);
    R.add(sky);

    // stars (night shot only)
    {
      const n = 380, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(0.1 + Math.random() * 0.85), r = 960;
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starMat = new THREE.PointsMaterial({ color: "#e8eeff", size: 2.3, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
      const stars = new THREE.Points(g, this.starMat);
      stars.layers.set(NOINK);
      R.add(stars);
    }
    // low pale winter sun
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: SUN, color: new THREE.Color(1.35, 1.28, 1.12), transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    sun.position.set(-95, 14, -430);
    sun.scale.set(46, 46, 1);
    sun.layers.set(NOINK);
    sun.name = "lowSun";
    R.add(sun);

    // blowing snow (valley shots)
    {
      const n = 320, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.sin(i * 127.1) * 0.5 + 0.5) * 70 - 35;
        pos[i * 3 + 1] = (Math.sin(i * 311.7) * 0.5 + 0.5) * 9 + 0.3;
        pos[i * 3 + 2] = (Math.sin(i * 74.7) * 0.5 + 0.5) * 80 - 55;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.snowStreaks = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
      this.snowStreaks.layers.set(NOINK);
      R.add(this.snowStreaks);
    }

    // ---------- valley set (shots 1, 2, 8) ----------
    {
      const g = this.valley;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      g.add(ground);
      // ring of frozen ridges
      const ridgeMat = new THREE.MeshLambertMaterial({ color: "#dde5ec" });
      for (const [rx, rz, rw, rh] of [[-52, -55, 60, 11], [0, -68, 90, 15], [55, -52, 55, 10], [-30, -38, 40, 7], [34, -36, 42, 8]] as const) {
        const ridge = new THREE.Mesh(new THREE.ConeGeometry(rw, rh, 7), ridgeMat);
        ridge.scale.set(1.6, 1, 0.55);
        ridge.position.set(rx, rh / 2 - 0.5, rz);
        g.add(ridge);
      }
      // tajga spruces (dark cones) on the ridges
      const spruceMat = new THREE.MeshLambertMaterial({ color: "#22382c" });
      for (let i = 0; i < 46; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.9 + (i % 3) * 0.35, 3.2 + (i % 4) * 1.15, 6), spruceMat);
        s.position.set(Math.sin(i * 12.9898) * 46, 1.1 + (i % 4) * 0.75, -34 - ((i * 39.4) % 30));
        g.add(s);
      }
      // the town itself: a scatter of dark timber houses + a steeple, smoke rising
      const houseMat = new THREE.MeshLambertMaterial({ color: "#2e2419" });
      const roofMat = new THREE.MeshLambertMaterial({ color: "#1e1a14" });
      for (let i = 0; i < 11; i++) {
        const hx = Math.sin(i * 78.233) * 9;
        const hz = -6 - (i * 5.7) % 20;
        const hw = 1.6 + (i % 3) * 0.55;
        const hh = 1.7 + (i % 4) * 0.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hw * 0.85), houseMat);
        body.position.set(hx, hh / 2, hz);
        g.add(body);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(hw * 0.72, hh * 0.55, 4), roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.set(hx, hh + hh * 0.26, hz);
        g.add(roof);
        // chimney smoke
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.92, 0.93, 0.97), transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
        s.userData.base = (i * 0.37) % 1;
        s.position.set(hx + 0.4, hh + 1.2, hz);
        s.layers.set(NOINK);
        this.steam.push(s);
        g.add(s);
      }
      // church steeple
      const nave = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 1.7), new THREE.MeshLambertMaterial({ color: "#33291d" }));
      nave.position.set(6.5, 1.25, -14);
      const steeple = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.6, 6), new THREE.MeshLambertMaterial({ color: "#2b241c" }));
      steeple.position.set(6.5, 3.3, -14);
      const dome = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.0, 6), roofMat);
      dome.position.set(6.5, 4.55, -14);
      g.add(nave, steeple, dome);
      // Pole of Cold stele
      const stele = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.4), new THREE.MeshLambertMaterial({ color: "#8f8f8d" }));
      stele.position.set(-0.6, 1.3, -3.2);
      g.add(stele);
      const steleTop = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.3, 0.55), new THREE.MeshLambertMaterial({ color: "#6e6e6c" }));
      steleTop.position.set(-0.6, 2.75, -3.2);
      g.add(steleTop);
    }

    // ---------- street set (shot 3): cars idling at the well ----------
    {
      const g = this.street;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // big timber house backdrop
      const hse = new THREE.Mesh(new THREE.BoxGeometry(9, 5.2, 5), new THREE.MeshLambertMaterial({ color: "#33281d" }));
      hse.position.set(-3.5, 2.6, -6.5);
      g.add(hse);
      const hseRoof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.6, 4), new THREE.MeshLambertMaterial({ color: "#211c15" }));
      hseRoof.rotation.y = Math.PI / 4;
      hseRoof.scale.set(1.05, 1, 0.62);
      hseRoof.position.set(-3.5, 6.3, -6.5);
      g.add(hseRoof);
      // icicles under the eave
      for (let i = 0; i < 12; i++) {
        const ic = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.3 + (i % 3) * 0.18, 5), new THREE.MeshLambertMaterial({ color: "#dfeef6" }));
        ic.rotation.x = Math.PI;
        ic.position.set(-7.4 + i * 0.72, 5.05, -4.2);
        g.add(ic);
      }
      // two cars, engines running, exhaust steaming
      const carCols = ["#6e2a22", "#3a4048"];
      for (const [ci, [cx, cz, rot]] of [[0, [2.2, 1.2, 0.35]], [1, [-1.4, 3.4, -0.2]]] as [number, number[]][]) {
        const car = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.72, 1.25), new THREE.MeshLambertMaterial({ color: carCols[ci] }));
        body.position.set(0, 0.62, 0);
        body.castShadow = true;
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 1.15), new THREE.MeshLambertMaterial({ color: carCols[ci] }));
        cabin.position.set(-0.15, 1.24, 0);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.17), new THREE.MeshLambertMaterial({ color: "#546e85", emissive: "#241f14", emissiveIntensity: 0.25 }));
        glass.position.set(-0.15, 1.26, 0);
        car.add(body, cabin, glass);
        for (const [wx, wz] of [[-0.85, 0.66], [0.85, 0.66], [-0.85, -0.66], [0.85, -0.66]] as const) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 12), new THREE.MeshLambertMaterial({ color: "#11100e" }));
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(wx, 0.3, wz);
          car.add(wheel);
        }
        car.position.set(cx, 0, cz);
        car.rotation.y = rot;
        g.add(car);
        // exhaust puffs from the tailpipe
        for (let k = 0; k < 3; k++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.85, 0.88, 0.93), transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
          s.userData.base = k / 3;
          s.userData.car = ci;
          s.position.set(cx + Math.cos(rot) * (ci === 0 ? -1.6 : 1.6), 0.42, cz - Math.sin(rot) * (ci === 0 ? -1.6 : 1.6));
          s.layers.set(NOINK);
          this.carExhaust.push(s);
          g.add(s);
        }
        // headlight glow (it's that kind of cold)
        const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(1.6, 1.5, 1.1), transparent: true, opacity: 0.85, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        hg.position.set(cx + Math.sin(rot) * 0 + Math.cos(rot) * 1.45, 0.68, cz + Math.sin(rot) * 1.45);
        hg.scale.set(0.85, 0.6, 1);
        hg.layers.set(NOINK);
        this.carGlow.push(hg);
        g.add(hg);
      }
      // the wooden well (water the old-fashioned way)
      const well = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.85, 1.15, 12, 1, true), new THREE.MeshLambertMaterial({ color: "#3a3026", side: THREE.DoubleSide }));
      wall.position.set(0, 0.57, 0);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.09, 8, 14), new THREE.MeshLambertMaterial({ color: "#241f18" }));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 1.16, 0);
      const postA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.14), new THREE.MeshLambertMaterial({ color: "#2c241c" }));
      postA.position.set(-0.78, 2.0, 0);
      const postB = postA.clone();
      postB.position.x = 0.78;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.13, 0.13), new THREE.MeshLambertMaterial({ color: "#2c241c" }));
      beam.position.set(0, 2.9, 0);
      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), new THREE.MeshLambertMaterial({ color: "#191512" }));
      crank.rotation.z = Math.PI / 2;
      crank.position.set(1.05, 2.62, 0);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 5), new THREE.MeshLambertMaterial({ color: "#4d443a" }));
      rope.position.set(0, 2.0, 0);
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.3, 10), new THREE.MeshLambertMaterial({ color: "#423a30" }));
      bucket.position.set(0, 1.35, 0);
      well.add(wall, rim, postA, postB, beam, crank, rope, bucket);
      well.position.set(-2.6, 0, -2.6);
      g.add(well);
      // ice bucket by the door
      const ib = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.55, 10), new THREE.MeshLambertMaterial({ color: "#46525e" }));
      ib.position.set(-1.15, 0.28, -3.6);
      g.add(ib);
    }

    // ---------- school set (shot 4) ----------
    {
      const g = this.school;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // schoolhouse
      const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.0, 4.6), new THREE.MeshLambertMaterial({ color: "#57452f" }));
      body.position.set(-1.2, 2.0, -6.2);
      body.castShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.2, 4), new THREE.MeshLambertMaterial({ color: "#241f18" }));
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.02, 1, 0.6);
      roof.position.set(-1.2, 5.05, -6.2);
      g.add(roof);
      // bell gable over the door
      const gable = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 0.3), new THREE.MeshLambertMaterial({ color: "#463726" }));
      gable.position.set(-1.2, 4.6, -3.85);
      const gableRoof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.65, 4), new THREE.MeshLambertMaterial({ color: "#241f18" }));
      gableRoof.rotation.y = Math.PI / 4;
      gableRoof.position.set(-1.2, 5.45, -3.85);
      g.add(gable, gableRoof);
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#6e5a2a" }));
      bell.position.set(-1.2, 4.35, -3.68);
      g.add(bell);
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.15, 0.12), new THREE.MeshLambertMaterial({ color: "#241a10" }));
      door.position.set(-1.2, 1.07, -3.9);
      g.add(door);
      // warm windows: children are inside learning about absolutely nothing
      for (const wx of [-4.0, 1.7]) {
        const wm = new THREE.MeshLambertMaterial({ color: "#241d18", emissive: "#ffc06a", emissiveIntensity: 1.1 });
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.75), wm);
        win.position.set(wx, 2.45, -3.88);
        g.add(win);
      }
      // frost CU face card (shown only in the last stretch of the shot)
      this.faceCard = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 2.31), new THREE.MeshBasicMaterial({ map: faceCardTex(), transparent: true, alphaTest: 0.35, fog: false }));
      this.faceCard.position.set(0.05, 2.0, 0.15);
      this.faceCard.layers.set(NOINK);
      g.add(this.faceCard);
    }

    // ---------- laundry set (shot 5) ----------
    {
      const g = this.laundry;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      const poleMat = new THREE.MeshLambertMaterial({ color: "#2c241c" });
      for (const px of [-2.3, 2.3]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 2.5, 8), poleMat);
        pole.position.set(px, 1.25, -2);
        g.add(pole);
      }
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 5), new THREE.MeshLambertMaterial({ color: "#6a6154" }));
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 2.32, -2);
      g.add(rope);
      const shirtCols = ["#e9e6da", "#ccd4da", "#dfd8c8"];
      for (let i = 0; i < 3; i++) {
        const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ map: shirtTex(shirtCols[i]), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: false }));
        shirt.position.set(-1.45 + i * 1.4, 1.83, -2);
        shirt.rotation.y = (i * 37 % 10 - 5) * 0.06;
        shirt.layers.set(NOINK);
        this.laundryBits.push(shirt);
        g.add(shirt);
      }
      // laundry basket
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.34, 0.6, 12, 1, true), new THREE.MeshLambertMaterial({ color: "#4a3a28", side: THREE.DoubleSide }));
      basket.position.set(1.35, 0.3, -1.1);
      g.add(basket);
    }

    // ---------- monument set (shot 6, night, the 1933 record) ----------
    {
      const g = this.monument;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshLambertMaterial({ color: "#aebdcd" }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // the stele (plain concrete, Pole of Cold)
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 1.3), new THREE.MeshLambertMaterial({ color: "#565b64" }));
      plinth.position.set(-0.5, 0.25, -2.2);
      const stele = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.6, 0.75), new THREE.MeshLambertMaterial({ color: "#7d838e" }));
      stele.position.set(-0.5, 2.3, -2.2);
      stele.castShadow = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.6, 4), new THREE.MeshLambertMaterial({ color: "#4a505a" }));
      cap.rotation.y = Math.PI / 4;
      cap.position.set(-0.5, 4.4, -2.2);
      g.add(plinth, stele, cap);
      // giant thermometer stuck in the snow (no numbers needed: the red sits at the bottom)
      const thermo = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 2.6), new THREE.MeshBasicMaterial({ map: thermomTex(), transparent: true, alphaTest: 0.4, fog: false, side: THREE.DoubleSide }));
      thermo.position.set(0.95, 1.35, -1.6);
      thermo.rotation.z = -0.09;
      thermo.layers.set(NOINK);
      g.add(thermo);
      // breath puffs (the traveler endures)
      for (let i = 0; i < 2; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.88, 0.9, 0.96), transparent: true, opacity: 0.0, depthWrite: false, fog: false }));
        s.userData.base = i * 0.5;
        s.position.set(1.0, 1.72, -0.7);
        s.layers.set(NOINK);
        this.breath.push(s);
        g.add(s);
      }
      // lantern glow for the traveler
      this.faceGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(1.75, 1.25, 0.6), transparent: true, opacity: 0.9, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      this.faceGlow.position.set(0.32, 1.05, -0.95);
      this.faceGlow.scale.set(1.05, 1.05, 1);
      this.faceGlow.layers.set(NOINK);
      g.add(this.faceGlow);
      // faint aurora ribbons
      const aurTex = ctex(256, 64, (gg) => {
        const grad = gg.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, "rgba(120,255,190,0)");
        grad.addColorStop(0.5, "rgba(120,255,190,0.85)");
        grad.addColorStop(1, "rgba(120,255,190,0)");
        gg.fillStyle = grad;
        gg.fillRect(0, 0, 256, 64);
      });
      for (const [ay, az, w, hue] of [[9.5, -30, 34, 0], [11.5, -26, 26, 1]] as const) {
        const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.6), new THREE.MeshBasicMaterial({ map: aurTex, color: new THREE.Color(hue ? 0.55 : 0.75, 1.5, 1.05), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        ribbon.position.set(0, ay, az);
        ribbon.layers.set(NOINK);
        this.aurora.push(ribbon);
        g.add(ribbon);
      }
    }

    // ---------- splash set (shot 7, the boiling-water stunt) ----------
    {
      const g = this.splash;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // the barrel stove + kettle
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.25, 12), new THREE.MeshLambertMaterial({ color: "#33291f" }));
      barrel.position.set(1.9, 0.62, -1.4);
      g.add(barrel);
      const fire = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.9, 0.25), fog: false }));
      fire.rotation.x = -Math.PI / 2;
      fire.position.set(1.9, 0.015, -0.72);
      fire.layers.set(NOINK);
      g.add(fire);
      const kettleBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshLambertMaterial({ color: "#1d1d1f" }));
      kettleBody.position.set(1.9, 1.42, -1.4);
      const kettleSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.5, 8), new THREE.MeshLambertMaterial({ color: "#1d1d1f" }));
      kettleSpout.rotation.z = Math.PI / 3.1;
      kettleSpout.position.set(2.18, 1.5, -1.4);
      g.add(kettleBody, kettleSpout);
      // steam from the spout
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.95, 0.96, 1), transparent: true, opacity: 0.75, depthWrite: false, fog: false }));
        s.userData.base = i / 3;
        s.position.set(2.35, 1.75, -1.4);
        s.layers.set(NOINK);
        this.steam.push(s);
        g.add(s);
      }
      // droplet stream (deterministic ballistic arcs, re-launched every 2.4 s)
      const N = 130;
      const pos = new Float32Array(N * 3);
      this.dropVel = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = i / N;
        this.dropVel[i * 3] = -2.1 - u * 1.35;                 // toward the thrower's left
        this.dropVel[i * 3 + 1] = 3.4 + Math.sin(i * 91.7) * 0.9;
        this.dropVel[i * 3 + 2] = Math.sin(i * 41.3) * 0.32;
        pos[i * 3] = 1.35; pos[i * 3 + 1] = 1.62; pos[i * 3 + 2] = -1.4;
      }
      this.dropGeo = new THREE.BufferGeometry();
      this.dropGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.dropMat = new THREE.PointsMaterial({ color: "#bcd6e8", size: 0.055, transparent: true, opacity: 0.95, depthWrite: false });
      this.drops = new THREE.Points(this.dropGeo, this.dropMat);
      this.drops.layers.set(NOINK);
      g.add(this.drops);
      // landing sparkles (freeze points on the snow)
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(1.6, 1.6, 1.5), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        s.position.set(-1.1 - i * 0.55, 0.1, -1.45 + (i % 2) * 0.38);
        s.scale.set(0.5, 0.32, 1);
        s.layers.set(NOINK);
        this.landFlash.push(s);
        g.add(s);
      }
    }

    // ---------- spring set (shot 9, "the water that does not freeze") ----------
    {
      const g = this.spring;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: snowTex() }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // the ice hole: dark open water steaming in the cold
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20), new THREE.MeshBasicMaterial({ color: "#0a141a" }));
      hole.rotation.x = -Math.PI / 2;
      hole.position.set(-0.7, 0.02, -3.0);
      g.add(hole);
      const slush = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 8, 18), new THREE.MeshLambertMaterial({ color: "#dfe8ee" }));
      slush.rotation.x = Math.PI / 2;
      slush.position.set(-0.7, 0.05, -3.0);
      g.add(slush);
      // warm stone + tin kettle + cup left to share
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.34, 0.5), new THREE.MeshLambertMaterial({ color: "#5a564e" }));
      stone.position.set(-0.65, 0.17, -2.2);
      g.add(stone);
      const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshLambertMaterial({ color: "#222426" }));
      kettle.position.set(-0.72, 0.42, -2.2);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.13, 8), new THREE.MeshLambertMaterial({ color: "#3d4148" }));
      cup.position.set(-0.32, 0.4, -2.15);
      g.add(kettle, cup);
      // steam rising off the hole
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.96, 0.97, 1), transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
        s.userData.base = i / 6;
        s.position.set(-0.7, 0.7, -3.0);
        s.layers.set(NOINK);
        this.steam.push(s);
        g.add(s);
      }
      // a wooden guard rail
      for (const px of [-1.85, 0.5]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.95, 0.13), new THREE.MeshLambertMaterial({ color: "#33291d" }));
        post.position.set(px, 0.48, -2.35);
        g.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.11, 0.11), new THREE.MeshLambertMaterial({ color: "#33291d" }));
      rail.position.set(-0.67, 0.9, -2.35);
      g.add(rail);
    }

    // ---------- characters ----------
    this.folkA = new Guy(this.root, 1); this.folkB = new Guy(this.root, 2); this.folkC = new Guy(this.root, 3);
    this.folkD = new Guy(this.root, 4); this.folkE = new Guy(this.root, 5);
    this.kidA = new Guy(this.root, 10); this.kidB = new Guy(this.root, 10); this.kidC = new Guy(this.root, 10);
    this.traveler = new Guy(this.root, 8); this.springer = new Guy(this.root, 12);
  }

  private setSky(stops: string[], fogCol: string, fogNear: number, fogFar: number) {
    const u = this.skyMat.uniforms;
    [u.c0, u.c1, u.c2, u.c3, u.c4].forEach((c, i) => (c.value as THREE.Color).set(stops[i]));
    this.fog.color.set(fogCol);
    this.fog.near = fogNear;
    this.fog.far = fogFar;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    scene.fog = this.fog;
    const t = f / FPS;
    const blinkFor = (seed: number) => (((t * 1.12 + seed * 0.68) % 2.4) < 0.12 ? 1 : 0);

    this.valley.visible = id === 1 || id === 2 || id === 8;
    this.street.visible = id === 3;
    this.school.visible = id === 4;
    this.laundry.visible = id === 5;
    this.monument.visible = id === 6;
    this.splash.visible = id === 7;
    this.spring.visible = id === 9;

    if (id === 6) this.setSky(NIGHT_SKY, "#0b101a", 14, 150);
    else if (id === 9) this.setSky(GOLD_SKY, "#d9c79c", 40, 360);
    else this.setSky(DAY_SKY, "#d3dde6", 34, 380);

    const night = id === 6;
    this.hemi.intensity = night ? 0.3 : 0.95;
    this.hemi.color.set(night ? "#43557a" : "#cfe0ee");
    this.hemi.groundColor.set(night ? "#0e1220" : "#5a5b58");
    this.dir.intensity = night ? 0.18 : id === 9 ? 0.95 : 0.75;
    this.dir.color.set(night ? "#8fa5cc" : id === 9 ? "#ffd9a6" : "#f2f6ff");
    this.dir.position.set(night ? 8 : -16, night ? 18 : 26, night ? -6 : 10);
    this.starMat.opacity = night ? 0.9 : 0;
    for (const a of this.aurora) {
      a.material.opacity = 0.32 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.7 + a.position.y));
      a.position.x = Math.sin(t * 0.23 + a.position.y) * 4;
    }

    // low pale sun only in day/golden; snow streaks blow hard in the valley
    const lowSun = this.root.getObjectByName("lowSun") as THREE.Sprite | undefined;
    if (lowSun) {
      lowSun.visible = !night;
      (lowSun.material as THREE.SpriteMaterial).opacity = id === 9 ? 1 : 0.85;
    }
    {
      const p = this.snowStreaks.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) + 5.2 / FPS;
        if (x > 34) x = -34;
        p.setX(i, x);
      }
      p.needsUpdate = true;
      this.snowStreaks.visible = !night && (id === 1 || id === 2 || id === 8);
    }

    // smoke / steam drift (chimneys, kettle, spring hole)
    for (const s of this.steam) {
      const u = (t * 0.16 + s.userData.base) % 1;
      s.position.y = (s.userData.base > 0.5 ? 1.9 : 0.8) + u * 2.6;
      const sc = 0.55 + u * 1.6;
      s.scale.set(sc, sc * 0.8, 1);
      s.material.opacity = 0.7 * (1 - u) * (0.4 + 0.6 * Math.min(1, u * 5));
    }

    // car exhaust + headlights (shot 3)
    if (id === 3) {
      for (const s of this.carExhaust) {
        const u = (t * 0.55 + s.userData.base) % 1;
        const car = s.userData.car as number;
        const back = car === 0 ? -1 : 1;
        s.position.x += back * 0.008;
        s.position.y += 0.0085;
        const sc = 0.3 + u * 1.15;
        s.scale.set(sc, sc * 0.75, 1);
        s.material.opacity = 0.62 * (1 - u);
        if (u > 0.97) {
          s.position.y = 0.42;
          s.position.x = (car === 0 ? 2.2 : -1.4) + back * 1.6;
        }
      }
      for (const hg of this.carGlow) hg.material.opacity = 0.72 + 0.18 * Math.sin(t * 9.5);
      // breath puffs by the well
    } else {
      for (const hg of this.carGlow) hg.material.opacity = 0.0;
    }

    // laundry shudders in the gusts (shot 5)
    if (id === 5) {
      for (const [i, m] of this.laundryBits.entries()) {
        const gust = Math.max(0, Math.sin(t * 1.9 + i * 1.4)) ** 3;
        m.rotation.z = Math.sin(t * 6.5 + i * 2.1) * 0.09 * gust;
        m.rotation.x = 0.06 + Math.sin(t * 5.2 + i) * 0.05 * gust;
      }
    }

    // the 1933 record (shot 6): breath fogs, lantern warms
    if (id === 6) {
      for (const s of this.breath) {
        const u = (t * 0.5 + s.userData.base) % 1;
        s.position.set(1.0 + u * 0.55, 1.74 + u * 0.28, -0.7);
        const sc = 0.16 + u * 0.42;
        s.scale.set(sc, sc * 0.75, 1);
        s.material.opacity = 0.6 * Math.sin(Math.PI * u);
      }
      this.faceGlow.material.opacity = 0.78 + 0.16 * Math.sin(t * 8.3) * Math.sin(t * 3.7);
    }

    // the boiling-water stunt (shot 7): ballistic droplets, frozen near apex
    if (id === 7) {
      const period = 2.35;
      const local = (t % period) / period;
      const tau = local * period; // seconds since launch
      const p = this.dropGeo.attributes.position as THREE.BufferAttribute;
      const g = 4.6;
      for (let i = 0; i < p.count; i++) {
        const vx = this.dropVel[i * 3], vy = this.dropVel[i * 3 + 1], vz = this.dropVel[i * 3 + 2];
        const jitter = Math.sin(i * 12.9898) * 0.011;
        let x = 1.35 + vx * tau + jitter * tau;
        let y = 1.62 + vy * tau - 0.5 * g * tau * tau;
        let z = -1.4 + vz * tau;
        // droplets burst into mist and hang (the air is that cold)
        const apexT = vy / g;
        if (tau > apexT * 0.55 && y > 2.2) y = 2.2 + (y - 2.2) * 0.25 + Math.sin(t * 13 + i) * 0.012;
        if (y < 0.035) y = 0.035;
        p.setXYZ(i, x, y, z);
      }
      p.needsUpdate = true;
      this.dropMat.opacity = local < 0.06 ? local / 0.06 : 0.95;
      for (const [i, s] of this.landFlash.entries()) {
        s.material.opacity = local > 0.52 + i * 0.09 ? 0.85 * (1 - (local - 0.52 - i * 0.09) / 0.35) : 0;
      }
    }

    // frost CU (end of shot 4)
    if (id === 4) this.faceCard.visible = f > 662;
    else this.faceCard.visible = false;

    // characters
    const states = peopleAt(id, f);
    const pools: Record<number, Guy[]> = {
      2: [this.folkC],
      3: [this.folkA, this.folkB],
      4: [this.kidA, this.kidB, this.kidC],
      5: [this.folkE],
      6: [this.traveler],
      7: [this.folkD],
      8: [this.folkB, this.folkA],
      9: [this.springer],
    };
    const pool = pools[id] ?? [];
    const all: Guy[] = [this.folkA, this.folkB, this.folkC, this.folkD, this.folkE, this.kidA, this.kidB, this.kidC, this.traveler, this.springer];
    all.forEach((a) => (a.mesh.visible = false));
    pool.forEach((a, i) => {
      const s = states[i];
      if (!s) return;
      a.mesh.visible = true;
      a.update(s.x, 0, s.z, s.expr, s.look, s.phase, blinkFor(i + 2), s.hop);
      a.mesh.rotation.y = s.look * 0.35;
    });

    const cam3 = camAt(id, f);
    this.target.set(cam3.look[0], cam3.look[1], cam3.look[2]);
    return this.target;
  }
}
