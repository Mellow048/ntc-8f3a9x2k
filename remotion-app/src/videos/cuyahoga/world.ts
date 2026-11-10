// The Cuyahoga River fire (June 22, 1969): one three.js scene with sets per beat —
// "river" (shots 1,2,3,4,8,9), "press" (shot 5, the Time magazine newsroom), "wall"
// (shot 6, thirteen scorch marks) and "slick" (shot 7, the oil-floats explanation).
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
const GLOW = blob("rgba(255,214,140,1)", "rgba(255,170,80,0)");
const SMOKE = blob("rgba(48,45,43,0.92)", "rgba(48,45,43,0)");
const SPARK = blob("rgba(255,255,230,1)", "rgba(255,220,120,0)");
const waterTex = () =>
  ctex(512, 512, (g) => {
    g.fillStyle = "#1f2b38";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) {
      const y = (i * 197) % 512;
      const len = 30 + ((i * 61) % 190);
      g.fillStyle = `rgba(${120 + (i % 3) * 30},${140 + (i % 4) * 22},${160 + (i % 2) * 30},${0.05 + (i % 5) * 0.02})`;
      g.fillRect((i * 389) % 512, y, len, 2 + (i % 3));
    }
    // oil-slick sheen swirls
    for (let i = 0; i < 9; i++) {
      const x = 130 + ((i * 67) % 260), y = 120 + ((i * 103) % 260);
      g.strokeStyle = ["rgba(178,120,220,0.35)", "rgba(90,200,180,0.35)", "rgba(220,150,90,0.3)", "rgba(120,160,255,0.3)"][i % 4];
      g.lineWidth = 5 + (i % 3) * 4;
      g.beginPath();
      g.ellipse(x, y, 46 + (i % 4) * 16, 18 + (i % 3) * 9, i * 0.6, 0, Math.PI * 2);
      g.stroke();
    }
  }, 3);
const brickTex = () =>
  ctex(512, 256, (g) => {
    g.fillStyle = "#332c2c";
    g.fillRect(0, 0, 512, 256);
    const bh = 22, bw = 62;
    for (let y = 0; y < 12; y++) {
      const off = (y % 2) * (bw / 2);
      for (let x = -1; x < 10; x++) {
        g.fillStyle = ["#4a3630", "#523e35", "#42322c", "#574236"][(x * 7 + y * 13) % 4 + 0] ?? "#4a3630";
        g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
      }
    }
  }, 2);
const scorchTex = () =>
  ctex(128, 256, (g) => {
    g.clearRect(0, 0, 128, 256);
    const gr = g.createRadialGradient(64, 208, 8, 64, 208, 95);
    gr.addColorStop(0, "rgba(10,8,7,0.95)");
    gr.addColorStop(0.45, "rgba(18,14,11,0.8)");
    gr.addColorStop(1, "rgba(18,14,11,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 256);
  });
const skylineTex = () =>
  ctex(2048, 512, (g) => {
    g.clearRect(0, 0, 2048, 512);
    g.fillStyle = "#151a21";
    // ground line
    g.fillRect(0, 430, 2048, 82);
    const rect = (x: number, y: number, w: number, h: number) => g.fillRect(x, 430 - h, w, h);
    // factories, water tower, church spire, crane silhouettes — no text, just shapes
    rect(20, 0, 190, 120); rect(60, 0, 46, 210); rect(150, 0, 30, 165);          // steel mill + 2 stacks
    rect(260, 0, 150, 88); rect(430, 0, 90, 150); rect(455, 0, 18, 238);        // plant + tower
    rect(580, 0, 220, 105); rect(830, 0, 60, 190); rect(851, 0, 24, 262);       // refinery
    rect(960, 0, 120, 70); rect(1110, 0, 170, 130); rect(1290, 0, 40, 95);      // warehouses
    rect(1360, 0, 26, 235); rect(1408, 0, 26, 235); rect(1456, 0, 26, 235);     // stacks row
    // church
    rect(1560, 0, 90, 150);
    g.beginPath(); g.moveTo(1560, 280); g.lineTo(1605, 190); g.lineTo(1650, 280); g.closePath(); g.fill();
    rect(1780, 0, 230, 95); rect(1850, 0, 60, 170);                             // far plant
    // crane
    rect(1000, 0, 14, 300);
    g.fillRect(880, 130, 330, 12);
    g.fillRect(1180, 142, 12, 70);
    // sparse dim windows
    g.fillStyle = "rgba(255,190,110,0.5)";
    for (let i = 0; i < 46; i++) g.fillRect((i * 389) % 2048, 300 + ((i * 137) % 110), 5, 6);
  });
const paperTex = () =>
  ctex(128, 160, (g) => {
    g.fillStyle = "#e6dfd0";
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = "#2b2b2b";
    g.fillRect(14, 12, 100, 12); // headline bar (no letters)
    g.fillStyle = "#6a675e";
    for (let y = 44; y < 150; y += 11)
      for (let x = 14; x < 118; x += 4) g.fillRect(x, y, 3, 2);
  });
const fishTex = () =>
  ctex(128, 80, (g) => {
    g.clearRect(0, 0, 128, 80);
    g.fillStyle = "#8fa5ab";
    g.beginPath();
    g.ellipse(52, 40, 34, 15, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(84, 40); g.lineTo(118, 18); g.lineTo(118, 62); g.closePath();
    g.fill();
  });

const TRESTLE_A = new THREE.Color("#3a3f46");
const TRESTLE_B = new THREE.Color("#151210");
const DAY_SKY = ["#59626e", "#6e7472", "#847f72", "#a2937e", "#c4b294"]; // smoggy overcast
const GOLD_SKY = ["#7d5a3c", "#a87c52", "#cfa06e", "#ecc691", "#f8e3b4"]; // tag-shot golden hour

export class World {
  root: THREE.Group;
  private riverG = new THREE.Group();
  private pressG = new THREE.Group();
  private wallG = new THREE.Group();
  private slickG = new THREE.Group();
  private angler: Guy;
  private watcher: Guy;
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#8b867c", 34, 240);
  private loco = new THREE.Group();
  private flames: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private smoke: THREE.Sprite[] = [];
  private spark: THREE.Sprite;
  private flash: THREE.Sprite;
  private fireGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private trestleMat: THREE.MeshLambertMaterial;
  private fish: THREE.Sprite;
  private splashRings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  private stackSmoke: THREE.Sprite[] = [];
  private rainbow: THREE.Mesh;
  private ripples: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  private droplet: THREE.Sprite;
  private target = new THREE.Vector3();

  constructor(_kit: Kit) {
    const R = new THREE.Group();
    this.root = R;
    R.add(this.riverG, this.pressG, this.wallG, this.slickG);

    // ---------- lights ----------
    this.hemi = new THREE.HemisphereLight("#a9b2bb", "#2c2924", 0.8);
    this.dir = new THREE.DirectionalLight("#d8d2c2", 0.52);
    this.dir.position.set(14, 32, 12);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    this.dir.shadow.camera.left = -20; this.dir.shadow.camera.right = 20; this.dir.shadow.camera.top = 20; this.dir.shadow.camera.bottom = -12;
    this.dir.shadow.camera.far = 110;
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

    // ---------- river set ----------
    {
      const g = this.riverG;
      // water
      const water = new THREE.Mesh(new THREE.PlaneGeometry(220, 150), new THREE.MeshPhongMaterial({ color: "#26333f", specular: "#6a7a88", shininess: 70, map: waterTex() }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -0.02, -40);
      water.receiveShadow = true;
      g.add(water);
      // near pier (camera side): concrete ledge + oil drums
      const pier = new THREE.Mesh(new THREE.BoxGeometry(24, 1.5, 6), new THREE.MeshLambertMaterial({ color: "#4b4a45" }));
      pier.position.set(0, 0.28, 9.5);
      pier.receiveShadow = true;
      g.add(pier);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 0.7), new THREE.MeshLambertMaterial({ color: "#5a5952" }));
      curb.position.set(0, 1.15, 6.6);
      g.add(curb);
      const barrelCols = ["#4a3226", "#53402c", "#333f33", "#3d3230"];
      for (let i = 0; i < 4; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.15, 12), new THREE.MeshLambertMaterial({ color: barrelCols[i] }));
        b.position.set(-9.5 + i * 1.35, 1.6 + 0.0, 10.2 - (i % 2) * 1.6);
        b.castShadow = true;
        g.add(b);
      }
      // dead streetlamp (budget Cleveland: even the light gave up)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.2, 6), new THREE.MeshLambertMaterial({ color: "#2c2a26" }));
      pole.position.set(6.4, 2.4, 8.6);
      pole.rotation.z = 0.12;
      g.add(pole);
      // far bank siding + skyline silhouettes
      const skylineFar = new THREE.Mesh(new THREE.PlaneGeometry(150, 22), new THREE.MeshBasicMaterial({ map: skylineTex(), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(0.62, 0.63, 0.68) }));
      skylineFar.position.set(0, 8.2, -66);
      skylineFar.layers.set(NOINK);
      g.add(skylineFar);
      const skyline = new THREE.Mesh(new THREE.PlaneGeometry(95, 12.5), new THREE.MeshBasicMaterial({ map: skylineTex(), transparent: true, depthWrite: false, fog: false }));
      skyline.position.set(-4, 4.6, -44);
      skyline.layers.set(NOINK);
      g.add(skyline);
      // far industrial tanks
      for (const [tx, tz, tr] of [[-13, -34, 2.2], [8, -37, 2.8], [15.5, -30, 1.6]] as const) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr, tr * 1.5, 14), new THREE.MeshLambertMaterial({ color: "#3b3833" }));
        tank.position.set(tx, (tr * 1.5) / 2, tz);
        g.add(tank);
      }
      // rail trestle crossing the river (the fire happens under it)
      this.trestleMat = new THREE.MeshLambertMaterial({ color: "#3a3f46" });
      const trestle = new THREE.Group();
      const deckY = 4.6;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(30, 0.55, 2.6), this.trestleMat);
      deck.position.set(0, deckY, 0);
      trestle.add(deck);
      for (let x = -13.5; x <= 13.5; x += 3) {
        const column = new THREE.Mesh(new THREE.BoxGeometry(0.7, deckY, 0.9), this.trestleMat);
        column.position.set(x, deckY / 2, 0);
        column.castShadow = true;
        trestle.add(column);
        const truss = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 2.4), this.trestleMat);
        truss.position.set(x, deckY + 1.0, 0);
        trestle.add(truss);
      }
      trestle.position.set(0, 0, -8);
      trestle.rotation.y = 0.06;
      g.add(trestle);
      // locomotive + coal cars (shot 3)
      const locoBody = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.5, 1.6), new THREE.MeshLambertMaterial({ color: "#22351f" }));
      locoBody.position.set(0, 5.75, 0);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.15, 1.5), new THREE.MeshLambertMaterial({ color: "#1a2a18" }));
      cab.position.set(-0.9, 6.9, 0);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.85, 10), new THREE.MeshLambertMaterial({ color: "#141414" }));
      chimney.position.set(0.85, 6.85, 0);
      this.loco.add(locoBody, cab, chimney);
      for (const off of [-3.6, -6.4]) {
        const car = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.55), new THREE.MeshLambertMaterial({ color: "#2a2620" }));
        car.position.set(off, 5.35, 0);
        this.loco.add(car);
      }
      this.loco.position.set(-18, 0, -8);
      this.loco.rotation.y = 0.06;
      g.add(this.loco);
      // loco smoke
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.5, 0.48, 0.46), transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
        s.userData.base = i / 3;
        s.position.set(0.85, 7.3, 0);
        s.layers.set(NOINK);
        this.smoke.push(s);
        this.loco.add(s);
      }
      // the fire (shot 4): flame cards along the slick line under the trestle
      this.fireGlow = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.85, 0.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.fireGlow.position.set(0, 0.35, -8);
      this.fireGlow.rotation.x = -0.45;
      this.fireGlow.layers.set(NOINK);
      g.add(this.fireGlow);
      for (let i = 0; i < 10; i++) {
        const h = 1.5 + ((i * 61) % 100) / 45;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85 + (i % 3) * 0.5, h), new THREE.MeshBasicMaterial({ map: FLAME, color: new THREE.Color(1.6, 1.15, 0.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        m.position.set(-5.2 + i * 1.18, h / 2 + 0.05, -8 + Math.sin(i * 2.7) * 1.4);
        m.layers.set(NOINK);
        this.flames.push(m);
        g.add(m);
      }
      // spark + flash (shot 3)
      this.spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPARK, color: new THREE.Color(2.2, 2.0, 1.4), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      this.spark.scale.set(0.35, 0.35, 1);
      this.spark.layers.set(NOINK);
      g.add(this.spark);
      this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(2.4, 1.9, 1.1), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      this.flash.scale.set(1.4, 1.4, 1);
      this.flash.layers.set(NOINK);
      g.add(this.flash);
      // fish (shot 8) + splash rings
      this.fish = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex(), transparent: true, opacity: 0, depthWrite: false, fog: false }));
      this.fish.scale.set(1.6, 1.0, 1);
      this.fish.layers.set(NOINK);
      g.add(this.fish);
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 26), new THREE.MeshBasicMaterial({ color: "#aebec2", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(-0.8 + i * 3.2, 0.06, -6.6);
        ring.layers.set(NOINK);
        this.splashRings.push(ring);
        g.add(ring);
      }
      // kayaks (shot 9): two quiet silhouettes
      const kayakMat = new THREE.MeshLambertMaterial({ color: "#241f1a" });
      for (const [kx, kz, rot] of [[-4.5, -12, 0.3], [3.2, -18, -0.25]] as const) {
        const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.9, 4, 8), kayakMat);
        k.rotation.set(Math.PI / 2, 0, rot);
        k.position.set(kx, 0.16, kz);
        g.add(k);
      }
      // distant factory smoke (always, lazily)
      for (const [sx, sy, sz] of [[-8.4, 13.5, -46], [1, 18.5, -45]] as const) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: new THREE.Color(0.32, 0.31, 0.3), transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
        s.userData.base = (sx + 20) / 30;
        s.position.set(sx, sy, sz);
        s.layers.set(NOINK);
        this.stackSmoke.push(s);
        g.add(s);
      }
    }

    // ---------- press room set (shot 5) ----------
    {
      const g = this.pressG;
      g.position.set(80, 0, 0);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.4), new THREE.MeshLambertMaterial({ color: "#2e3138" }));
      wall.position.set(0, 3.2, -2.4);
      g.add(wall);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshLambertMaterial({ color: "#26241f" }));
      floor.rotation.x = -Math.PI / 2;
      g.add(floor);
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshLambertMaterial({ color: "#1d1c19" }));
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(0, 6.1, 0);
      g.add(ceil);
      // cork pinboard with pasted papers (no letters, only shapes)
      const board = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.12), new THREE.MeshLambertMaterial({ color: "#4a3b2a" }));
      board.position.set(-2.4, 3.6, -2.3);
      g.add(board);
      const pTex = paperTex();
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.82), new THREE.MeshLambertMaterial({ map: pTex }));
        p.position.set(-4.6 + (i % 4) * 1.45, 3.95 - Math.floor(i / 4) * 1.15, -2.23);
        p.rotation.z = ((i * 37) % 10 - 5) * 0.014;
        g.add(p);
      }
      // desk + typewriter + paper + mug + banker's lamp
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 1.35), new THREE.MeshLambertMaterial({ color: "#35281c" }));
      desk.position.set(0.4, 0.78, 0.2);
      const front = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.78, 0.1), new THREE.MeshLambertMaterial({ color: "#2b211a" }));
      front.position.set(0.4, 0.39, 0.82);
      g.add(desk, front);
      const tw = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.32, 0.6), new THREE.MeshLambertMaterial({ color: "#181a1e" }));
      tw.position.set(0.1, 0.99, 0.05);
      g.add(tw);
      const platen = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.84, 12), new THREE.MeshLambertMaterial({ color: "#0d0e11" }));
      platen.rotation.z = Math.PI / 2;
      platen.position.set(0.1, 1.17, -0.16);
      g.add(platen);
      for (let r = 0; r < 3; r++)
        for (let k = 0; k < 9; k++) {
          const key = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.028, 0.052), new THREE.MeshLambertMaterial({ color: "#c9c4b4" }));
          key.position.set(-0.18 + k * 0.062 + (r % 2) * 0.03, 1.163, 0.06 + r * 0.062);
          g.add(key);
        }
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshLambertMaterial({ map: pTex, side: THREE.DoubleSide }));
      sheet.rotation.x = -0.34;
      sheet.position.set(0.1, 1.32, -0.22);
      g.add(sheet);
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.19, 10), new THREE.MeshLambertMaterial({ color: "#5d2e2e" }));
      mug.position.set(1.45, 0.94, 0.32);
      g.add(mug);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 12, 1, true), new THREE.MeshLambertMaterial({ color: "#1d4d3a", emissive: "#2e7d5b", emissiveIntensity: 0.5, side: THREE.DoubleSide }));
      shade.position.set(-0.95, 1.13, 0.15);
      g.add(shade);
      const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: new THREE.Color(0.9, 1.6, 1.05), transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      lampGlow.position.set(-0.95, 1.02, 0.15);
      lampGlow.scale.set(1.35, 1.05, 1);
      lampGlow.layers.set(NOINK);
      g.add(lampGlow);
      const lampPt = new THREE.PointLight("#9fe0b8", 7, 4.5, 1.9);
      lampPt.position.set(-0.95, 1.1, 0.15);
      g.add(lampPt);
      // window with hard daylight on the right (no view, just glare)
      const glare = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.6, 1.35), fog: false }));
      glare.position.set(6.96, 3.0, -0.4);
      glare.rotation.y = -Math.PI / 2;
      g.add(glare);
      const fill = new THREE.PointLight("#fff2d8", 9, 9, 1.8);
      fill.position.set(5.4, 3.0, -0.4);
      g.add(fill);
    }

    // ---------- brick wall set (shot 6): thirteen scorch marks ----------
    {
      const g = this.wallG;
      g.position.set(140, 0, 0);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 4.6), new THREE.MeshLambertMaterial({ map: brickTex() }));
      wall.position.set(0, 2.3, -1.8);
      wall.receiveShadow = true;
      g.add(wall);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshLambertMaterial({ color: "#211f1d" }));
      floor.rotation.x = -Math.PI / 2;
      g.add(floor);
      const sTex = scorchTex();
      // 13 scorch marks: rough arc across the wall (the river kept count)
      for (let i = 0; i < 13; i++) {
        const row = i % 5, col = Math.floor(i / 5);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72 + (i % 3) * 0.16, 1.5 + ((i * 7) % 3) * 0.3), new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false, opacity: 0.92 }));
        m.position.set(-4.4 + row * 2.15 + ((i * 13) % 5 - 2) * 0.12, 2.5 - col * 0.62 + (i % 2) * 0.1, -1.79);
        m.layers.set(NOINK);
        g.add(m);
      }
      // broom + bucket (someone finally mopping up hundred years of it)
      const broom = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 6), new THREE.MeshLambertMaterial({ color: "#54402a" }));
      broom.position.set(3.6, 1.15, -1.0);
      broom.rotation.z = 0.42;
      g.add(broom);
      const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.14), new THREE.MeshLambertMaterial({ color: "#2e2418" }));
      bristles.position.set(4.02, 0.22, -1.0);
      g.add(bristles);
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 12, 1, true), new THREE.MeshLambertMaterial({ color: "#3c4148", side: THREE.DoubleSide }));
      bucket.position.set(2.6, 0.25, -0.75);
      g.add(bucket);
    }

    // ---------- oil slick close-up set (shot 7) ----------
    {
      const g = this.slickG;
      g.position.set(180, 0, 0);
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ color: "#05070a" }));
      backdrop.position.set(0, 3.1, -3.6);
      g.add(backdrop);
      const slickTex = ctex(512, 512, (gg) => {
        gg.fillStyle = "#0e141a";
        gg.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 16; i++) {
          gg.strokeStyle = ["rgba(190,125,225,0.55)", "rgba(85,215,190,0.55)", "rgba(225,160,85,0.5)", "rgba(115,175,255,0.5)"][i % 4];
          gg.lineWidth = 9 + (i % 4) * 7;
          gg.beginPath();
          gg.ellipse(256 + Math.sin(i * 2.4) * 60, 256 + Math.cos(i * 1.9) * 60, 150 - i * 8, 62 - i * 3.2, i * 0.42, 0, Math.PI * 2);
          gg.stroke();
        }
        gg.fillStyle = "rgba(0,0,0,0.35)";
        gg.fillRect(0, 0, 512, 512);
      });
      this.rainbow = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 7.4), new THREE.MeshPhongMaterial({ map: slickTex, specular: "#8a97a5", shininess: 110, color: "#aab6bd" }));
      this.rainbow.rotation.x = -Math.PI / 2;
      this.rainbow.position.set(0, 0.02, 0);
      g.add(this.rainbow);
      // droplet that keeps falling (the spark does the rest)
      this.droplet = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPARK, color: new THREE.Color(1.9, 1.85, 1.5), transparent: true, opacity: 0.95, depthWrite: false, fog: false }));
      this.droplet.scale.set(0.2, 0.42, 1);
      this.droplet.layers.set(NOINK);
      g.add(this.droplet);
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.46, 30), new THREE.MeshBasicMaterial({ color: "#9fb2ba", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(0, 0.045, 0);
        ring.layers.set(NOINK);
        this.ripples.push(ring);
        g.add(ring);
      }
    }

    // ---------- cast ----------
    this.watcher = new Guy(this.root, 2);
    this.angler = new Guy(this.root, 7);
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

    this.riverG.visible = id === 1 || id === 2 || id === 3 || id === 4 || id === 8 || id === 9;
    this.pressG.visible = id === 5;
    this.wallG.visible = id === 6;
    this.slickG.visible = id === 7;

    if (id === 9) this.setSky(GOLD_SKY, "#c8a878", 40, 300);
    else this.setSky(DAY_SKY, "#8b867c", 34, 240);

    const golden = id === 9;
    this.hemi.intensity = golden ? 0.66 : 0.8;
    this.hemi.color.set(golden ? "#e8c49a" : "#a9b2bb");
    this.hemi.groundColor.set(golden ? "#3a2c22" : "#2c2924");
    this.dir.intensity = golden ? 1.0 : 0.52;
    this.dir.color.set(golden ? "#ffcf9e" : "#d8d2c2");
    this.dir.position.set(golden ? -18 : 14, golden ? 9 : 32, golden ? -28 : 12);

    // distant factory smoke drifts forever
    for (const s of this.stackSmoke) {
      const u = (t * 0.05 + s.userData.base) % 1;
      s.position.y = 13 + u * 16;
      const sc = 3.5 + u * 8;
      s.scale.set(sc, sc * 0.75, 1);
      s.material.opacity = 0.5 * (1 - u);
    }

    // locomotive crosses the trestle during shot 3
    if (id === 3) {
      const u = clamp01((f - 352) / 88);
      this.loco.position.x = -17 + u * 38;
      for (const s of this.smoke) {
        const v = (t * 0.9 + s.userData.base) % 1;
        s.position.set(0.85 + v * 2.4, 7.3 + v * 2.6, 0);
        const sc = 0.5 + v * 2.0;
        s.scale.set(sc, sc * 0.8, 1);
        s.material.opacity = 0.65 * (1 - v);
      }
      // spark falls to the water at the moment the voice hits "a spark"
      const su = clamp01((f - 372) / 22);
      this.spark.material.opacity = f >= 372 ? (su < 1 ? 0.95 : 0) : 0;
      this.spark.position.set(3.1, 5.0 - su * 4.75, -7.9);
      const fu = clamp01((f - 392) / 10);
      this.flash.material.opacity = f >= 392 ? 0.95 * (1 - fu) : 0;
      this.flash.position.set(3.1, 0.4, -7.9);
      this.flash.scale.setScalar(1.1 + fu * 1.6);
    } else {
      this.loco.position.x = id > 3 ? 22 : -18;
      this.spark.material.opacity = 0;
      this.flash.material.opacity = 0;
    }

    // the fire (shot 4): flames lick the slick; trestle chars
    {
      const target = id === 4 ? 1 : 0;
      this.trestleMat.color.copy(TRESTLE_A).lerp(TRESTLE_B, id === 4 ? clamp01((f - 441) / 170) : 0);
      for (const [i, m] of this.flames.entries()) {
        const fl = 0.62 + 0.38 * Math.abs(Math.sin(t * 9 + i * 1.7 + Math.sin(t * 23 + i) * 0.7));
        const fade = id === 4 ? (f > 620 ? clamp01(1 - (f - 620) / 40) : 1) : 0;
        m.material.opacity = fl * fade;
        m.scale.y = 0.85 + 0.4 * Math.abs(Math.sin(t * 12 + i * 2.3));
      }
      this.fireGlow.material.opacity = id === 4 ? 0.5 * (f > 620 ? clamp01(1 - (f - 620) / 40) : 1) * (0.7 + 0.3 * Math.sin(t * 11)) : 0;
    }

    // fish jump (shot 8): one bright arc mid-way through the Earth Day sentence
    if (id === 8) {
      const fu = clamp01((f - 1465) / 46);
      const jumping = f >= 1465 && fu < 1;
      this.fish.material.opacity = jumping ? 1 : 0;
      if (jumping) {
        const u = fu;
        this.fish.position.set(-0.8 + u * 3.2, 0.35 + Math.sin(u * Math.PI) * 1.9, -6.6);
        this.fish.material.rotation = (u - 0.5) * 2.1;
      }
      this.splashRings.forEach((ring, i) => {
        const ru = clamp01((f - (1465 + 30 + i * 12)) / 34);
        ring.scale.setScalar(0.5 + ru * 2.6);
        ring.material.opacity = ru > 0 && ru < 1 ? 0.75 * (1 - ru) : 0;
      });
    } else {
      this.fish.material.opacity = 0;
      this.splashRings.forEach((r) => (r.material.opacity = 0));
    }

    // oil-slick close-up (shot 7): droplet falls, ripples answer
    if (id === 7) {
      const period = 1.35;
      const u = (t % period) / period;
      const fall = clamp01(u / 0.72);
      this.droplet.position.set(0, 2.5 - fall * 2.1, 0);
      this.droplet.material.opacity = fall >= 1 ? 0 : 0.95;
      this.droplet.scale.set(0.17, 0.3 + fall * 0.25, 1);
      this.ripples.forEach((ring, i) => {
        const ru = clamp01((u - 0.72 - i * 0.07) / 0.28);
        ring.scale.setScalar(0.4 + ru * 3.4);
        ring.material.opacity = ru > 0 && ru < 1 ? 0.8 * (1 - ru) : 0;
      });
    }

    // characters
    const states = peopleAt(id, f);
    const w = this.watcher, a = this.angler;
    if (id === 2 && states[0]) {
      w.mesh.visible = true;
      w.update(states[0].x, 0, states[0].z, states[0].expr, states[0].look, 0, blinkFor(2), 0);
      w.mesh.rotation.y = 0.4;
      a.mesh.visible = false;
    } else if (id === 8 && states[0]) {
      a.mesh.visible = true;
      a.update(states[0].x, 0, states[0].z, states[0].expr, states[0].look, 0, blinkFor(7), states[0].hop);
      a.mesh.rotation.y = 0.5;
      w.mesh.visible = false;
    } else {
      w.mesh.visible = false;
      a.mesh.visible = false;
    }

    const cam3 = camAt(id, f);
    this.target.set(cam3.look[0], cam3.look[1], cam3.look[2]);
    return this.target;
  }
}

// shot start frames (for per-shot intro fades/eases)
