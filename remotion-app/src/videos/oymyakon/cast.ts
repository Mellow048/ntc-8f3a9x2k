// The Oymyakon cast, drawn with the skill's Canvas2D Pen (toon.ts) as camera-facing
// billboard cards, shaded by cardShade(). Cards live on the NOINK layer.
// Variants: 8 = 1933 traveler · 10 = school kid · others = parka townsfolk.
import * as THREE from "three";
import { Pen, bodyFront, townsfolk, type Outfit, type Expr } from "./toon";
import { cardShade, CARD_K } from "./cardshade";
import { NOINK } from "./ink";

export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();

const variant = (v: number): Outfit => {
  if (v === 8) return { jacket: "#3a3129", pants: "#2c2724", boots: "#241d18", hat: "cap", cap: "#7d766b", build: "stout" };
  if (v === 10) return { jacket: "#d8542e", pants: "#3b5b9a", boots: "#efe9dc", hat: "cap", cap: "#e2453c", build: "kid" };
  const base = townsfolk(v);
  // Siberian parkas: safety-cone bright against the white
  const parka = ["#d8542e", "#2e7d6e", "#b0402f", "#3f5f9a", "#c77b2e", "#7d3a4e"];
  return { ...base, jacket: parka[v % parka.length], pants: "#33302c", boots: "#241d18", hat: "cap", cap: "#8a857a" };
};

export class Guy {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  private cv: HTMLCanvasElement;
  private tex: THREE.CanvasTexture;
  private lastKey = "";
  private outfit: Outfit;
  constructor(parent: THREE.Object3D, v = 1) {
    this.outfit = variant(v);
    this.cv = document.createElement("canvas");
    this.cv.width = 600; this.cv.height = 1000;
    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: this.tex, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    this.mesh.onBeforeRender = (r) => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    parent.add(this.mesh);
  }
  update(x: number, y: number, z: number, expr: string, look: number, phase: number, blink: number, hop: number) {
    this.mesh.position.set(x, y + hop, z);
    const key = `${expr}|${look}|${Math.round(phase * 30)}|${blink ? 1 : 0}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      const g = this.cv.getContext("2d")!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 600, 1000);
      const mode = phase === 0 ? "stand" : "stroll";
      bodyFront(new Pen(g), this.outfit, {
        mode: mode as "stand" | "stroll",
        phase,
        expr: expr as Expr,
        look,
        blink,
        light: 0.5,
        seed: 1,
      });
      this.tex.needsUpdate = true;
    }
  }
}
