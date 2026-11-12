// Cast: flat canvas cards billboarded into the painted paddock. The men are
// drawn with the shared Pen (toon.ts) so the outline weight and painted
// crescent match the human cast of the earlier shorts; the emu comes from
// animals.ts. Cards live on the NOINK layer so the ink pass never boxes them.
import * as THREE from "three";
import { Pen, bodyFront, type Outfit, type Expr } from "./toon";
import { emu, type EmuLook } from "./animals";
import { cardShade, CARD_K } from "./cardshade";
import { NOINK } from "./ink";

export const CU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const FOOT_Y = 975;        // soles of every card sit here in design units

/** a billboard plane whose canvas y = FOOT_Y lands exactly on world y = 0 */
const cardQuad = (cw: number, ch: number) => {
  const g = new THREE.PlaneGeometry(cw * CU, ch * CU);
  g.translate(0, FOOT_Y * CU - (ch * CU) / 2, 0);
  return g;
};

class Card {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  protected cv: HTMLCanvasElement;
  protected tex: THREE.CanvasTexture;
  protected lastKey = "";
  private geo: THREE.PlaneGeometry;
  constructor(parent: THREE.Object3D, cw: number, ch: number) {
    this.cv = document.createElement("canvas");
    this.cv.width = cw; this.cv.height = ch;
    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: this.tex, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.geo = cardQuad(cw, ch);
    this.mesh = new THREE.Mesh(this.geo, this.mat);
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
  protected ctx() {
    const g = this.cv.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.cv.width, this.cv.height);
    return g;
  }
  protected mark() { this.tex.needsUpdate = true; }
}

// ---------------------------------------------------------------- the emu
export class EmuCard extends Card {
  constructor(parent: THREE.Object3D) { super(parent, 600, 1000); }
  /** camYaw turns the card to face the lens (flat-cartoon billboard); flip mirrors the profile */
  update(x: number, z: number, camYaw: number, flip: boolean, look: EmuLook) {
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = camYaw;
    this.mesh.scale.x = flip ? -1 : 1;
    const key = `${look.gait.toFixed(2)}|${look.head.toFixed(2)}|${look.run ? 1 : 0}|${(look.blaze ?? 0).toFixed(2)}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      const g = this.ctx();
      emu(new Pen(g), look);
      this.mark();
    }
  }
}

// ---------------------------------------------------------------- the men
const BASE: Outfit = {
  jacket: "#8d9179", pants: "#6f6b58", boots: "#3a2f28", hat: "slouch", cap: "#9a9c84",
  belt: "#5a4a38", buttons: "#c8bda2", rifle: false, skin: "#f0c8a0", build: "adult",
};
export const DIGGER = (v: number): Outfit => ({
  ...BASE,
  skin: ["#f0c8a0", "#e0b184", "#f6d4b2"][v % 3],
  jacket: ["#8d9179", "#86896f", "#93977e"][v % 3],
  moustache: v % 2 ? "#6b5336" : undefined,
});
export const OFFICER_OUT: Outfit = {
  ...BASE, jacket: "#7d7f6a", cap: "#8a8c74", buttons: "#d8c69a",
  belt: "#4a3d2e", moustache: "#4f3c28", build: "stout",
};
export const FARMER_OUT: Outfit = {
  jacket: "#9d6b45", pants: "#4d4a3d", boots: "#33291f", hat: "slouch", cap: "#8f6a44",
  belt: "#40342a", buttons: "#cbb99a", build: "adult", skin: "#e8b98d",
};

export class ManCard extends Card {
  constructor(parent: THREE.Object3D, private outfit: Outfit) { super(parent, 600, 1000); }
  update(x: number, z: number, camYaw: number, pose: "stand" | "walk" | "kneel", expr: string, look: number, phase: number, blink = 0) {
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = camYaw;
    const key = `${pose}|${expr}|${look}|${Math.round(phase * 20)}|${blink}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      const g = this.ctx();
      bodyFront(new Pen(g), this.outfit, {
        mode: pose === "walk" ? "stroll" : "stand",
        phase: pose === "walk" ? phase : 0,
        expr: expr as Expr,
        look,
        blink,
        light: 0.5,
        seed: 1 + (Math.abs(Math.round(x * 7 + z * 3)) % 5),
      });
      this.mark();
    }
  }
}
