// The Dark Day (May 19, 1780): one three.js scene with sets for each beat —
// "street" (shots 1,3,5,7,9), "desk" (shot 2, Williams at Harvard), "lamp" (shot 6, the
// hand-over-a-lamp analogy), "fire" (shot 4, the Ontario horizon) and "tree" (shot 8, the 2007
// tree-ring evidence). update(id, f, cam, scene) poses everything for shot `id` at frame f
// (pure function of id + f).
import * as THREE from "three";
import { NOINK } from "./ink";
import { Guy } from "./cast";
import { FPS, camAt, peopleAt, smooth, clamp01 } from "./story";
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
    const gr = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
const FLAME = blob("rgba(255,238,180,1)", "rgba(255,140,40,0)");
const GLOW = blob("rgba(255,210,130,1)", "rgba(255,170,80,0)");
const GLOW_RED = blob("rgba(255,120,80,1)", "rgba(200,60,30,0)");
const SMOKE = blob("rgba(52,48,48,0.9)", "rgba(52,48,48,0)");
const MOON = blob("rgba(255,150,120,1)", "rgba(255,110,80,0)");
const cobbleTex = () =>
  ctex(256, 256, (g) => {
    g.fillStyle = "#65564a";
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const ox = (y % 2) * 16;
        g.fillStyle = `rgba(${40 + (x * 37 + y * 61) % 40},${34 + (x * 53 + y * 29) % 30},${28 + (x * 17 + y * 43) % 24},0.55)`;
        g.beginPath();
        g.ellipse(x * 32 + 16 + ox, y * 32 + 16, 13, 10, 0, 0, Math.PI * 2);
        g.fill();
      }
  }, 6);
const plasterTex = (base: string) =>
  ctex(256, 256, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 340; i++) {
      g.fillStyle = `rgba(${i % 2 ? "0,0,0" : "255,255,255"},0.05)`;
      g.beginPath();
      g.ellipse((i * 97) % 256, (i * 61) % 256, 14 + (i % 5) * 6, 9 + (i % 3) * 5, i, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(0,0,0,0.38)";
    g.fillRect(0, 226, 256, 30); // plinth
    g.fillStyle = "rgba(255,255,255,0.16)";
    g.fillRect(0, 30, 256, 7); // mid band
  });
const cookieTex = () =>
  ctex(512, 512, (g) => {
    g.fillStyle = "#b98a56";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#8a6136";
    for (let r = 240; r > 12; r -= 11 + ((r * 7) % 9)) {
      g.lineWidth = 3 + (r % 4);
      g.beginPath();
      g.arc(256, 256, r, 0, Math.PI * 2);
      g.stroke();
    }
    // fire scar: one wide dark ring + a char wedge (the "receipt")
    g.strokeStyle = "#241812";
    g.lineWidth = 26;
    g.beginPath();
    g.arc(256, 256, 150, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#241812";
    g.beginPath();
    g.moveTo(256, 256);
    g.arc(256, 256, 150, -0.35, 0.32);
    g.closePath();
    g.fill();
    g.fillStyle = "#5a3d24";
    g.beginPath();
    g.ellipse(256, 256, 16, 12, 0, 0, Math.PI * 2);
    g.fill();
  });
const treelineTex = () =>
  ctex(1024, 200, (g) => {
    g.clearRect(0, 0, 1024, 200);
    g.fillStyle = "#12100e";
    g.fillRect(0, 150, 1024, 50);
    for (let x = 0; x < 1024; x += 9) {
      const h = 40 + ((x * 7919) % 100);
      g.beginPath();
      g.moveTo(x, 155);
      g.lineTo(x + 5, 155 - h);
      g.lineTo(x + 10, 155);
      g.closePath();
      g.fill();
    }
  });

// ---------------- small builders ----------------
const prismRoof = (w: number, h: number, d: number, col: string) => {
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.02, h, 4), new THREE.MeshLambertMaterial({ color: col, flatShading: true }));
  r.rotation.y = Math.PI / 4;
  r.scale.set(w / Math.hypot(w, d) * 1.42, 1, d / Math.hypot(w, d) * 1.42);
  return r;
};
const soft = (map: THREE.Texture, color: THREE.ColorRepresentation, opacity: number) =>
  new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, fog: false });

const NIGHT_SKY = ["#090d16", "#121826", "#1c2434", "#2a3040", "#3a3428"];
const DAY_SKY = ["#11151d", "#1d232e", "#2c3542", "#3c4654", "#57544a"]; // sooty pseudo-noon
const RED_SKY = ["#171319", "#241c22", "#37292b", "#4e3a33", "#6d4a38"]; // pre-dark red haze
export class World {
  root: THREE.Group;
  private street = new THREE.Group();
  private desk = new THREE.Group();
  private lampSet = new THREE.Group();
  private fire = new THREE.Group();
  private tree = new THREE.Group();
  private williams: Guy;
  private scientist: Guy;
  private folks: Guy[] = [];
  private windows: THREE.MeshLambertMaterial[] = [];
  private lanterns: THREE.MeshLambertMaterial[] = [];
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private lampPoint: THREE.PointLight;
  private skyMat: THREE.ShaderMaterial;
  private sunSprite: THREE.Sprite;
  private moonSprite: THREE.Sprite;
  private stars: THREE.Points;
  private starMat: THREE.PointsMaterial;
  private smoke: THREE.Sprite[] = [];
  private embers: THREE.Points;
  private emberMat: THREE.PointsMaterial;
  private emberVel: Float32Array;
  private lampGlow: THREE.Sprite;
  private lampFlame: THREE.Sprite;
  private panel: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private deskBack: THREE.MeshStandardMaterial | THREE.MeshLambertMaterial;
  private fog = new THREE.Fog("#43443e", 18, 190);
  private target = new THREE.Vector3();

  constructor(_kit: Kit) {
    const R = new THREE.Group();
    this.root = R;
    R.add(this.street, this.desk, this.lampSet, this.fire, this.tree);

    // ---------- lights ----------
    this.hemi = new THREE.HemisphereLight("#93a2b5", "#2c2721", 0.72);
    this.dir = new THREE.DirectionalLight("#ccd6e2", 0.55);
    this.dir.position.set(18, 42, 14);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    this.dir.shadow.camera.left = -22; this.dir.shadow.camera.right = 22; this.dir.shadow.camera.top = 24; this.dir.shadow.camera.bottom = -10;
    this.dir.shadow.camera.far = 120;
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

    // dim sooty sun disc (the "red as blood" sun comes in shot 7)
    this.sunSprite = new THREE.Sprite(soft(GLOW_RED, new THREE.Color(1.4, 0.55, 0.3), 0.8));
    this.sunSprite.position.set(30, 68, -420);
    this.sunSprite.scale.set(60, 60, 1);
    this.sunSprite.layers.set(NOINK);
    R.add(this.sunSprite);

    // red moon (night, final shot)
    this.moonSprite = new THREE.Sprite(soft(MOON, new THREE.Color(1.25, 0.75, 0.6), 0));
    this.moonSprite.position.set(-38, 66, -420);
    this.moonSprite.scale.set(34, 34, 1);
    this.moonSprite.layers.set(NOINK);
    this.moonSprite.visible = false;
    R.add(this.moonSprite);

    // stars
    {
      const n = 350, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(0.15 + Math.random() * 0.8), r = 980;
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starMat = new THREE.PointsMaterial({ color: "#dfe6f5", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
      this.stars = new THREE.Points(g, this.starMat);
      this.stars.layers.set(NOINK);
      R.add(this.stars);
    }

    // ---------- street set ----------
    {
      const g = this.street;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshLambertMaterial({ map: cobbleTex() }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      g.add(ground);

      const houseTints = ["#7a5b3e", "#8a6d4f", "#6b4f3a", "#93765a", "#75543c", "#54443a"];
      const heights = [4.6, 5.6, 6.4, 5.1, 4.9, 6.0];
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (const side of [-1, 1]) {
        let z = 8;
        let i = 0;
        while (z > -23) {
          const w = 3.0 + rnd() * 0.9, h = heights[i % heights.length], d = 3.2 + rnd() * 0.8;
          const tint = houseTints[(i * 2 + (side > 0 ? 1 : 0)) % houseTints.length];
          const hx = side * (4.0 + rnd() * 0.7);
          const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: plasterTex(tint) }));
          body.position.set(hx, h / 2, z);
          body.castShadow = body.receiveShadow = true;
          g.add(body);
          const roof = prismRoof(w + 0.5, 1.5 + rnd() * 0.7, d + 0.5, "#37302b");
          roof.position.set(hx, h + 0.75 + rnd() * 0.2, z);
          roof.castShadow = true;
          g.add(roof);
          // door
          const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.08), new THREE.MeshLambertMaterial({ color: "#2e2118" }));
          door.position.set(hx - side * (w / 2 - 0.02), 0.85, z + 0.4);
          door.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          g.add(door);
          // windows (two per house, facing the street)
          for (const wz of [z - 0.8, z + 1.0]) {
            const lit = rnd() < 0.55;
            const wm = new THREE.MeshLambertMaterial({ color: "#241d18", emissive: lit ? "#ffb45a" : "#000000", emissiveIntensity: lit ? 0.9 : 0 });
            const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.8), wm);
            win.position.set(hx - side * (w / 2 - 0.02), h * 0.62, wz);
            win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(win);
            this.windows.push(wm);
            const win2 = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.8), wm);
            win2.position.set(hx - side * (w / 2 - 0.02), h * 0.28, wz);
            g.add(win2);
          }
          // chimney
          const ch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), new THREE.MeshLambertMaterial({ color: "#4a3a32" }));
          ch.position.set(hx + side * 0.6, h + 1.5, z - 0.7);
          g.add(ch);
          z -= 4.6 + rnd() * 1.1;
          i++;
        }
      }

      // church at the end of the street
      const church = new THREE.Group();
      const nave = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.6, 4.4), new THREE.MeshLambertMaterial({ map: plasterTex("#8f887c") }));
      nave.position.set(0, 2.8, 0); nave.castShadow = nave.receiveShadow = true;
      const chancel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 2.6), new THREE.MeshLambertMaterial({ map: plasterTex("#847d71") }));
      chancel.position.set(0, 1.8, -3.2);
      const steeple = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.05, 3.6, 8), new THREE.MeshLambertMaterial({ color: "#7d766b" }));
      steeple.position.set(0, 7.4, 0);
      const spire = prismRoof(1.9, 2.2, 1.9, "#33302c");
      spire.position.set(0, 10.2, 0);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), new THREE.MeshLambertMaterial({ color: "#211d1a" }));
      cross.position.set(0, 11.75, 0);
      church.add(nave, chancel, steeple, spire, cross);
      // church door + candle glow windows (a vigil is happening)
      const cdoor = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.1, 0.1), new THREE.MeshLambertMaterial({ color: "#241a12" }));
      cdoor.position.set(0, 1.05, 2.21);
      church.add(cdoor);
      for (const cx of [-1.5, 1.5]) {
        const wm = new THREE.MeshLambertMaterial({ color: "#241d18", emissive: "#ffc06a", emissiveIntensity: 1.15 });
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.15), wm);
        win.position.set(cx, 3.1, 2.21);
        church.add(win);
        this.windows.push(wm);
      }
      church.position.set(0, 0, -27);
      g.add(church);

      // street-lamp posts with hanging lanterns (lit in the gloom)
      for (const [lx, lz] of [[-2.7, -6], [2.7, 2]] as const) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 6), new THREE.MeshLambertMaterial({ color: "#2b241d" }));
        post.position.set(lx, 1.7, lz);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.09), new THREE.MeshLambertMaterial({ color: "#2b241d" }));
        arm.position.set(lx + (lx < 0 ? 0.35 : -0.35), 3.35, lz);
        const lampM = new THREE.MeshLambertMaterial({ color: "#3a2f1e", emissive: "#ffc06a", emissiveIntensity: 1.5 });
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), lampM);
        lamp.position.set(lx + (lx < 0 ? 0.72 : -0.72), 3.1, lz);
        g.add(post, arm, lamp);
        this.lanterns.push(lampM);
        const glow = new THREE.Sprite(soft(GLOW, new THREE.Color(1.5, 1.05, 0.55), 0.75));
        glow.position.copy(lamp.position);
        glow.scale.set(1.5, 1.5, 1);
        glow.layers.set(NOINK);
        g.add(glow);
      }

      // ground mist
      for (const [mx, mz, s] of [[-3, -9, 9], [2.5, -3, 7]] as const) {
        const m = new THREE.Sprite(soft(SMOKE, new THREE.Color(0.62, 0.6, 0.56), 0.16));
        m.position.set(mx, 0.75, mz);
        m.scale.set(s, s * 0.42, 1);
        m.layers.set(NOINK);
        g.add(m);
      }
    }

    // ---------- fire horizon set (shot 4) ----------
    {
      const g = this.fire;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(220, 7, 3), new THREE.MeshLambertMaterial({ color: "#181310" }));
      ridge.position.set(0, 1.4, -78);
      g.add(ridge);
      const tlTex = treelineTex();
      const tl = new THREE.Mesh(new THREE.PlaneGeometry(210, 26), new THREE.MeshBasicMaterial({ map: tlTex, transparent: true, depthWrite: false, fog: false }));
      tl.position.set(0, 12, -77);
      tl.layers.set(NOINK);
      g.add(tl);
      // burning glow band behind the treeline
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(220, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.9, 0.28), fog: false, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set(0, 6.5, -79.5);
      glow.layers.set(NOINK);
      g.add(glow);
      // rising smoke column
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Sprite(soft(SMOKE, new THREE.Color(0.23, 0.21, 0.21), 0.85));
        s.userData.base = i / 7;
        s.position.set((i % 3) * 6 - 6, 14, -78);
        s.layers.set(NOINK);
        this.smoke.push(s);
        g.add(s);
      }
      // embers drifting up
      const n = 90, pos = new Float32Array(n * 3);
      this.emberVel = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.sin(i * 127.1) * 0.5 + 0.5) * 140 - 70;
        pos[i * 3 + 1] = 4 + (Math.sin(i * 311.7) * 0.5 + 0.5) * 9;
        pos[i * 3 + 2] = -70 - (Math.sin(i * 74.7) * 0.5 + 0.5) * 10;
        this.emberVel[i * 3] = (Math.sin(i * 12.9) - 0.5) * 0.35;
        this.emberVel[i * 3 + 1] = 2.2 + (i % 5) * 0.45;
        this.emberVel[i * 3 + 2] = (Math.sin(i * 39.4) - 0.5) * 0.3;
      }
      const eg = new THREE.BufferGeometry();
      eg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.emberMat = new THREE.PointsMaterial({ color: "#ffb14a", size: 0.22, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      this.embers = new THREE.Points(eg, this.emberMat);
      this.embers.layers.set(NOINK);
      g.add(this.embers);
    }

    // ---------- desk interior set (shot 2) ----------
    {
      const g = this.desk;
      g.position.set(60, 0, 0);
      const floorM = new THREE.MeshLambertMaterial({ color: "#4a3a2a" });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), floorM);
      floor.rotation.x = -Math.PI / 2;
      g.add(floor);
      this.deskBack = new THREE.MeshLambertMaterial({ color: "#332a21" });
      const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.5), this.deskBack);
      back.position.set(0, 2.75, -1.6);
      g.add(back);
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.5), new THREE.MeshLambertMaterial({ color: "#2c241c" }));
        side.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
        side.position.set(s * 4.5, 2.75, 0.5);
        g.add(side);
      }
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshLambertMaterial({ color: "#241d16" }));
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(0, 5.2, 0);
      g.add(ceil);
      // the desk
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.15), new THREE.MeshLambertMaterial({ color: "#3a2a1e" }));
      deskTop.position.set(0, 0.78, 0.35);
      const deskFront = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.78, 0.1), new THREE.MeshLambertMaterial({ color: "#33241a" }));
      deskFront.position.set(0, 0.39, 0.88);
      deskFront.receiveShadow = true;
      g.add(deskTop, deskFront);
      // papers + quill + candle
      const paperTex = ctex(128, 128, (gg) => {
        gg.fillStyle = "#e8e0cd"; gg.fillRect(0, 0, 128, 128);
        gg.strokeStyle = "#7a7264";
        for (let y = 30; y < 118; y += 12) { gg.beginPath(); gg.moveTo(14, y); gg.lineTo(114 - (y % 3) * 18, y); gg.stroke(); }
      });
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), new THREE.MeshLambertMaterial({ map: paperTex }));
        p.rotation.x = -Math.PI / 2;
        p.rotation.z = i * 0.55 - 1;
        p.position.set(-0.75 + (i % 3) * 0.72, 0.845 + i * 0.004, 0.28 + Math.floor(i / 3) * 0.32);
        g.add(p);
      }
      // ink pot
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.11, 10), new THREE.MeshLambertMaterial({ color: "#151312" }));
      pot.position.set(0.62, 0.9, 0.2);
      g.add(pot);
      // stack of books
      const bookCols = ["#57332a", "#2f3a4d", "#41352a"];
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.5 - i * 0.06, 0.09, 0.36), new THREE.MeshLambertMaterial({ color: bookCols[i] }));
        b.position.set(-1.35, 0.9 + i * 0.093, 0.42);
        b.rotation.y = i * 0.4 - 0.4;
        g.add(b);
      }
      // candle lamp on the desk
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.08, 12), new THREE.MeshLambertMaterial({ color: "#1d1a17" }));
      lampBase.position.set(0.95, 0.885, 0.42);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.34, 12, 1, true), new THREE.MeshLambertMaterial({ color: "#ffd9a0", emissive: "#ffbe6a", emissiveIntensity: 1.6, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
      chimney.position.set(0.95, 1.09, 0.42);
      g.add(lampBase, chimney);
      this.lampGlow = new THREE.Sprite(soft(GLOW, new THREE.Color(1.7, 1.2, 0.62), 0.95));
      this.lampGlow.position.set(0.95, 1.18, 0.42);
      this.lampGlow.scale.set(1.6, 1.6, 1);
      this.lampGlow.layers.set(NOINK);
      g.add(this.lampGlow);
      this.lampFlame = new THREE.Sprite(soft(FLAME, new THREE.Color(1.9, 1.5, 0.9), 1));
      this.lampFlame.position.set(0.95, 1.06, 0.42);
      this.lampFlame.scale.set(0.32, 0.5, 1);
      this.lampFlame.layers.set(NOINK);
      g.add(this.lampFlame);
      this.lampPoint = new THREE.PointLight("#ffc27a", 26, 7.5, 1.8);
      this.lampPoint.position.set(0.95, 1.25, 0.42);
      g.add(this.lampPoint);
    }

    // ---------- lamp insert set (shot 6) ----------
    {
      const g = this.lampSet;
      g.position.set(120, 0, 0);
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshLambertMaterial({ color: "#221c17" }));
      backdrop.position.set(0, 2.6, -2.2);
      g.add(backdrop);
      this.panel = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), new THREE.MeshBasicMaterial({ color: "#05070c", transparent: true, opacity: 0.86, depthWrite: false }));
      this.panel.position.set(0, 8.5, 0.9);
      this.panel.layers.set(NOINK);
      g.add(this.panel);
      // table
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 1.5), new THREE.MeshLambertMaterial({ color: "#3a2a1e" }));
      table.position.set(0, 0.62, 0);
      g.add(table);
      const tFront = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.62, 0.12), new THREE.MeshLambertMaterial({ color: "#31231a" }));
      tFront.position.set(0, 0.31, 0.68);
      g.add(tFront);
      // the lamp
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.14, 14), new THREE.MeshLambertMaterial({ color: "#1b1815" }));
      base.position.set(0, 0.77, 0);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 10), new THREE.MeshLambertMaterial({ color: "#1b1815" }));
      stem.position.set(0, 1.0, 0);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.56, 14, 1, true), new THREE.MeshLambertMaterial({ color: "#ffd9a0", emissive: "#ffc06a", emissiveIntensity: 1.9, transparent: true, opacity: 0.96, side: THREE.DoubleSide }));
      chimney.position.set(0, 1.38, 0);
      g.add(base, stem, chimney);
      const glow = new THREE.Sprite(soft(GLOW, new THREE.Color(1.8, 1.28, 0.66), 1));
      glow.position.set(0, 1.5, 0);
      glow.scale.set(2.6, 2.6, 1);
      glow.layers.set(NOINK);
      glow.name = "lampGlow2";
      g.add(glow);
      const flame = new THREE.Sprite(soft(FLAME, new THREE.Color(2.0, 1.6, 0.95), 1));
      flame.position.set(0, 1.34, 0);
      flame.scale.set(0.5, 0.78, 1);
      flame.layers.set(NOINK);
      flame.name = "lampFlame2";
      g.add(flame);
      const pl = new THREE.PointLight("#ffc27a", 30, 8, 1.8);
      pl.position.set(0, 1.6, 0.2);
      pl.name = "lampPoint2";
      g.add(pl);
    }

    // ---------- tree cookie set (shot 8) ----------
    {
      const g = this.tree;
      g.position.set(-60, 0, 0);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshLambertMaterial({ color: "#3a332c" }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      // fallen trunk behind the cookie
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 5.2, 12), new THREE.MeshLambertMaterial({ color: "#2f2318" }));
      trunk.rotation.z = Math.PI / 2 - 0.08;
      trunk.position.set(-2.6, 0.44, -1.2);
      g.add(trunk);
      // the cookie (cross-section) standing on sawhorses
      const cookie = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.5, 28), new THREE.MeshLambertMaterial({ color: "#b98a56" }));
      cookie.rotation.x = Math.PI / 2;
      cookie.position.set(0, 1.32, 0);
      cookie.castShadow = true;
      g.add(cookie);
      const capMat = new THREE.MeshLambertMaterial({ map: cookieTex() });
      const cap = new THREE.Mesh(new THREE.CircleGeometry(1.11, 28), capMat);
      cap.position.set(0, 1.32, 0.256);
      g.add(cap);
      for (const sx of [-0.75, 0.75]) {
        const horse = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.06, 0.8), new THREE.MeshLambertMaterial({ color: "#33241a" }));
        horse.position.set(sx, 0.53, 0);
        g.add(horse);
      }
      // annotate nothing — no labels; the charred ring speaks for itself
    }

    // ---------- characters ----------
    this.williams = new Guy(this.root, 0);
    this.scientist = new Guy(this.root, 9);
    for (const v of [1, 2, 3, 4]) this.folks.push(new Guy(this.root, v));
    // people belong to their sets
    this.williams.mesh.position.set(60, -0.82, 0.02);
    this.scientist.mesh.position.set(-59.15, 0, 0.75);

    // ---------- per-shot sprite/mesh handles for the lamp insert ----------
    this.lampGlow2 = this.lampSet.getObjectByName("lampGlow2") as THREE.Sprite;
    this.lampFlame2 = this.lampSet.getObjectByName("lampFlame2") as THREE.Sprite;
    this.lampPoint2 = this.lampSet.getObjectByName("lampPoint2") as THREE.PointLight;
  }

  private lampGlow2: THREE.Sprite;
  private lampFlame2: THREE.Sprite;
  private lampPoint2: THREE.PointLight;

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

    // set visibility
    this.street.visible = id === 1 || id === 3 || id === 5 || id === 7 || id === 9;
    this.desk.visible = id === 2;
    this.lampSet.visible = id === 6;
    this.fire.visible = id === 4;
    this.tree.visible = id === 8;

    // sky / light per mood
    if (id === 9) this.setSky(NIGHT_SKY, "#171a22", 12, 150);
    else if (id === 7) this.setSky(RED_SKY, "#453c36", 14, 170);
    else this.setSky(DAY_SKY, "#43443e", 18, 190);

    const night = id === 9;
    this.hemi.intensity = night ? 0.34 : 0.72;
    this.hemi.color.set(night ? "#4a5a76" : "#93a2b5");
    this.hemi.groundColor.set(night ? "#11141c" : "#2c2721");
    this.dir.intensity = night ? 0.16 : 0.55;
    this.dir.color.set(night ? "#8296bd" : "#ccd6e2");

    // sun / moon / stars
    this.sunSprite.visible = !night;
    this.sunSprite.material.opacity = id === 7 ? 0.95 : id === 4 ? 0.25 : 0.55;
    this.sunSprite.scale.setScalar(id === 7 ? 95 : 60);
    this.moonSprite.visible = night;
    this.moonSprite.material.opacity = night ? 0.9 : 0;
    this.starMat.opacity = night ? 0.85 : 0;

    // candle windows + lanterns flicker (brighter in the panic + night shots)
    const winLevel = id === 3 || night ? 1.0 : id === 1 ? 0.75 : id === 5 ? 0.8 : id === 7 || id === 9 ? 0.9 : 0.35;
    this.windows.forEach((wm, i) => {
      const litBias = i % 3 === 2 && id !== 3 && !night ? 0.25 : 1; // some windows stay dark in the calm shots
      wm.emissiveIntensity = wm.emissive.getHex() === 0 ? 0 : winLevel * litBias * (0.82 + 0.28 * Math.abs(Math.sin(t * 11 + i * 1.93 + Math.sin(t * 23.7 + i) * 0.6)));
    });
    this.lanterns.forEach((lm, i) => {
      lm.emissiveIntensity = winLevel * (1.15 + 0.5 * Math.abs(Math.sin(t * 13 + i * 2.7 + Math.sin(t * 29 + i) * 0.5)));
    });

    // fire horizon: smoke column rises, embers respawn
    if (id === 4) {
      for (const s of this.smoke) {
        const u = (t * 0.055 + s.userData.base) % 1;
        s.position.set((s.userData.base * 37 % 5) - 2.5 + Math.sin(t * 0.5 + s.userData.base * 9) * 1.2, 12 + u * 34, -78 - u * 6);
        const sc = 6 + u * 22;
        s.scale.set(sc, sc * 0.8, 1);
        s.material.opacity = 0.85 * (1 - u) * (0.35 + 0.65 * Math.min(1, u * 5));
      }
      const p = this.embers.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + this.emberVel[i * 3 + 1] / FPS;
        let x = p.getX(i) + this.emberVel[i * 3] / FPS + Math.sin(t * 2 + i) * 0.004;
        if (y > 17) {
          y = 4 + (i % 7) * 0.4;
          x = (Math.sin(i * 127.1) * 0.5 + 0.5) * 140 - 70;
        }
        p.setY(i, y);
        p.setX(i, x);
      }
      p.needsUpdate = true;
    }

    // lamp insert: the smoked-glass panel slides down and back up
    if (id === 6) {
      const p = clamp01((f - 975) / (1152 - 975));
      const bell = smooth((p - 0.16) / 0.22) * (1 - smooth((p - 0.6) / 0.24));
      this.panel.position.y = 8.6 - 8.15 * bell;
      this.panel.material.opacity = 0.86 * bell;
      this.hemi.intensity = 0.72 - 0.5 * bell;
      const warm = 1 + 0.08 * Math.sin(t * 17) * Math.sin(t * 7.3);
      this.lampGlow2.scale.set(2.6 * warm, 2.6 * warm, 1);
      this.lampFlame2.scale.set(0.5 * warm, 0.78 * warm, 1);
      this.lampPoint2.intensity = 30 * warm;
    }

    // desk: candle flicker + Williams' writing bob
    if (id === 2) {
      const warm = 1 + 0.1 * Math.sin(t * 15.7) * Math.sin(t * 6.1);
      this.lampGlow.scale.set(1.6 * warm, 1.6 * warm, 1);
      this.lampFlame.scale.set(0.32 * warm, 0.5 * warm, 1);
      this.lampPoint.intensity = 26 * warm;
      this.deskBack.color.setScalar(0.22 + 0.02 * Math.sin(t * 3.1));
    }

    // characters
    const states = peopleAt(id, f);
    const pool: Guy[] = id === 2 ? [this.williams] : id === 8 ? [this.scientist] : this.folks;
    pool.forEach((a, i) => {
      const s = states[i];
      if (!s) { a.mesh.visible = false; return; }
      a.mesh.visible = true;
      const y = id === 2 ? -0.82 : 0; // Williams sits: legs hidden by the desk
      a.update(s.x + (id === 2 ? 60 : id === 8 ? -60 : 0), y, s.z, s.expr, s.look, s.phase, blinkFor(i + 1), s.hop);
      a.mesh.rotation.y = s.look * 0.35;
    });
    // hide pools not in play
    if (id !== 2) this.williams.mesh.visible = false;
    if (id !== 8) this.scientist.mesh.visible = false;
    if (id === 2 || id === 4 || id === 6 || id === 8) this.folks.forEach((a) => (a.mesh.visible = false));

    // focus target (for the DOF pass): the look point of the current camera
    const cam3 = camAt(id, f);
    this.target.set(cam3.look[0], cam3.look[1], cam3.look[2]);
    return this.target;
  }
}
