// The Dark Day cast, drawn with the skill's Canvas2D Pen (toon.ts) as camera-facing
// billboard cards, shaded by cardShade(). Cards live on the NOINK layer.
// Variants: 0 = Williams (stout, dark coat, grey hair) · 1..5 = townsfolk (colonial) · 9 = scientist.
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

const WILLIAMS: Outfit = { jacket: "#3f332c", pants: "#2b2724", boots: "#241d18", hat: "hair", hair: "#b9b2a4", build: "stout" };
const SCIENTIST: Outfit = { jacket: "#2e3d55", pants: "#333a44", boots: "#241d18", hat: "hair", hair: "#3a2c20", build: "adult" };
const variant = (v: number): Outfit => {
  if (v === 0) return WILLIAMS;
  if (v === 9) return SCIENTIST;
  const colonial = townsfolk(v);
  // mute the palette to 1780s wools: navy, brown, dark green
  const mute = ["#31435c", "#4a3a2c", "#2f4634", "#54382e", "#3a3f52", "#43352a"];
  return { ...colonial, jacket: mute[v % mute.length], pants: "#2e2a26", boots: "#241d18" };
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
