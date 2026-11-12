// The people: flat painted characters (toon.ts) on camera-facing cards, shaded by cardShade() so they sit in the
// same light as the world. One canvas per actor, redrawn only when the pose key changes.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, soldier, townsfolk, type Outfit, type Expr } from "./toon";
import { cardShade, CARD_K } from "./cardshade";
import { NOINK } from "./ink";

export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();
const CW = 600, CH = 1000, K = 2; // canvas 1200 x 2000 at 2x the 600 x 1000 design grid

// ---------------- outfits ----------------
/** Lyman Cutlar: American settler, early twenties, work shirt, no coat. */
export const CUTLAR: Outfit = { jacket: "#4a7fb5", pants: "#4c4238", boots: "#33281f", hat: "hair", hair: "#7a5730", build: "adult" };
/** Charles Griffin: the Company's man, dark coat and top hat, boots always clean. */
export const GRIFFIN: Outfit = { jacket: "#332e2a", pants: "#2a2723", boots: "#1f1c19", hat: "tophat", hair: "#3a2f24", build: "stout" };
/** a Washington Territory settler */
export const SETTLER = (v = 0): Outfit => ({ ...townsfolk(v), hat: v % 2 ? "cap" : "hair", cap: "#5a4636", hair: "#4a3826" });
/** US infantry, 1858 forage cap (dark blue) */
export const US_INFANTRY = (v = 0): Outfit => soldier(v, { jacket: "#2b3d63", pants: "#394654", hat: "cap", cap: "#252f4a", belt: "#e8e6dd", rifle: true });
/** Royal Marine, red coatee, white cross-belts */
export const MARINE = (v = 0): Outfit => soldier(v, { jacket: "#a8342c", pants: "#33383d", belt: "#f2efe4", buttons: "#e3c052" });
/** Royal Navy officer */
export const RN_OFFICER: Outfit = soldier(1, { jacket: "#1f2f52", hat: "shako_tall", sash: "#d8d3c6", buttons: "#e3c052", sword: true, rifle: false, build: "stout" });

export type View = "front" | "side";
export type Pose = {
  outfit: Outfit; view?: View; expr?: Expr; mode?: "stand" | "stroll" | "march" | "push"; phase?: number;
  look?: number; blink?: boolean; light?: number; yaw?: number; scale?: number; seed?: number; lift?: number;
};

export class Figure {
  mesh: THREE.Mesh;
  private mat: THREE.MeshLambertMaterial;
  private cv: HTMLCanvasElement;
  private tex: THREE.CanvasTexture;
  private lastKey = "";
  constructor(parent: THREE.Object3D) {
    this.cv = document.createElement("canvas");
    this.cv.width = CW * K; this.cv.height = CH * K;
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

  /** place at (x, y, z) — y is the ground the feet stand on; the card faces `eye` (the lens) plus `yaw` */
  set(x: number, y: number, z: number, eye: THREE.Vector3, p: Pose, visible = true) {
    this.mesh.visible = visible;
    if (!visible) return;
    const s = p.scale ?? 1;
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = Math.atan2(eye.x - x, eye.z - z) + (p.yaw ?? 0);
    this.mesh.scale.setScalar(s);
    const phase = p.phase ?? 0;
    const key = [p.outfit.jacket, p.outfit.hat, p.view ?? "front", p.expr ?? "neutral", p.mode ?? "stand",
      Math.round(phase * 24), p.look ?? 0, p.blink ? 1 : 0, Math.round((p.light ?? 0.5) * 100), p.seed ?? 1, p.lift ?? 0].join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;
    const g = this.cv.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW * K, CH * K);
    g.setTransform(K, 0, 0, K, 0, 0);
    const pen = new Pen(g);
    if ((p.view ?? "front") === "side") {
      bodySide(pen, p.outfit, { mode: (p.mode === "stroll" ? "march" : p.mode ?? "stand") as "march" | "stand" | "swing" | "push",
        phase, expr: p.expr ?? "neutral", blink: p.blink ? 1 : 0, light: p.light ?? 0.5, seed: p.seed ?? 1 });
    } else {
      bodyFront(pen, p.outfit, { mode: (p.mode ?? "stand") as "stand" | "stroll" | "march" | "sit" | "fall",
        phase, expr: p.expr ?? "neutral", look: p.look ?? 0, blink: p.blink ? 1 : 0, light: p.light ?? 0.5,
        seed: p.seed ?? 1, lift: p.lift ?? 60 });
    }
    this.tex.needsUpdate = true;
  }
}
