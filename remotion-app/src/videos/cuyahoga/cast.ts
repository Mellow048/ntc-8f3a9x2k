// The Cuyahoga cast, drawn with the skill's Canvas2D Pen (toon.ts) as camera-facing
// billboard cards, shaded by cardShade(). Cards live on the NOINK layer.
// Variants: 7 = angler (green coat, cap) · others = 1969 townsfolk.
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
  if (v === 7) return { jacket: "#3f5232", pants: "#4e463a", boots: "#241d18", hat: "cap", cap: "#5a6b45", build: "adult" };
  const base = townsfolk(v + 2); // shift hues away from the bridge palette
  // 1969 Cleveland: browns, ochres, faded denim
  const era = ["#5d4a33", "#6b3b34", "#3c4a56", "#567043", "#715c2e", "#453c4e"];
  return { ...base, jacket: era[v % era.length], pants: "#37404d", boots: "#241d18" };
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
