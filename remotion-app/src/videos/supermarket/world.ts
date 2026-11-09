// The supermarket: one three.js aisle with a soda shelf at the end, posed
// per frame from the story timeline (story.ts). Guy (cast.ts) walks the
// aisle, stops at the shelf, and decides between the red (Coke) and blue
// (Pepsi) cans. update(id, f, cam, scene) poses everything for shot `id`
// at frame f (pure function of id + f).
import * as THREE from "three";
import { NOINK } from "./ink";
import { Guy } from "./cast";
import { FPS, SHOTS, camAt, guyAt, type V3 } from "./story";
import type { Kit } from "./build";

export const loadKit = async (): Promise<Kit> => ({});

const shelfTex = (col: string) => {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(0, 52, 128, 24);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export class World {
  root: THREE.Group;
  private guy: Guy;
  private can: THREE.Mesh;
  private target = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  constructor(_kit: Kit) {
    this.root = new THREE.Group();
    const R = this.root;

    // interior shell: floor, walls, ceiling
    const floorMat = new THREE.MeshLambertMaterial({ color: "#d8cdb8" });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1);
    floor.receiveShadow = true;
    R.add(floor);

    const wallMat = new THREE.MeshLambertMaterial({ color: "#efe6d2" });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), wallMat);
    backWall.position.set(0, 2, -7);
    R.add(backWall);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), wallMat);
      side.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      side.position.set(s * 5, 2, -1);
      R.add(side);
    }
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), new THREE.MeshLambertMaterial({ color: "#fdfaf2" }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 4, -1);
    R.add(ceil);
    // ceiling light panels
    const panelMat = new THREE.MeshBasicMaterial({ color: "#fffbe8" });
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(0, 3.98, 4 - i * 3.2);
      R.add(panel);
    }

    // lights
    R.add(new THREE.HemisphereLight("#dcecff", "#b49a78", 0.9));
    const sun = new THREE.DirectionalLight("#fff3e0", 2.2);
    sun.position.set(3, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    R.add(sun, sun.target);

    // soda shelf at the end of the aisle: red Coke left, blue Pepsi right
    const shelfMat = new THREE.MeshLambertMaterial({ color: "#8a8f96" });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 0.6), shelfMat);
    shelf.position.set(0, 1.1, -5);
    shelf.castShadow = true; shelf.receiveShadow = true;
    R.add(shelf);
    const canGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12);
    for (const [x0, col] of [[-3.2, "#d6232b"], [0.4, "#2255a4"]] as const) {
      const mat = new THREE.MeshLambertMaterial({ color: col });
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < 8; i++) {
          const can = new THREE.Mesh(canGeo, mat);
          can.position.set(x0 + i * 0.42, 0.55 + row * 0.5, -4.65);
          can.castShadow = true;
          R.add(can);
        }
      }
      // shelf label
      const label = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ color: col }));
      label.position.set(x0 + 1.4, 2.5, -4.69);
      R.add(label);
    }
    // big sign above the shelf
    const signCv = document.createElement("canvas");
    signCv.width = 512; signCv.height = 128;
    const sg = signCv.getContext("2d")!;
    sg.fillStyle = "#2f9e4f"; sg.fillRect(0, 0, 512, 128);
    sg.fillStyle = "#ffffff"; sg.font = "900 64px Inter, Arial, sans-serif";
    sg.textAlign = "center"; sg.textBaseline = "middle";
    sg.fillText("SODA", 256, 66);
    const signTex = new THREE.CanvasTexture(signCv);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 3.2, -6.9);
    R.add(sign);

    // guy + the blue can he ends up holding
    this.guy = new Guy(R);
    this.can = new THREE.Mesh(canGeo, new THREE.MeshLambertMaterial({ color: "#2255a4" }));
    this.can.visible = false;
    this.can.castShadow = true;
    R.add(this.can);
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, _scene: THREE.Scene) {
    const shot = SHOTS[id - 1];
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    this.target.set(...c.look);
    cam.lookAt(this.target);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.updateProjectionMatrix();
    void shot;

    const g = guyAt(id, f);
    const t = f / FPS;
    const blink = ((t * 1.1) % 2.4) < 0.12 ? 1 : 0;
    this.guy.update(g.x, 0, g.z, g.expr, g.look, g.phase, blink, g.hop);
    // blue can in hand after the decision
    this.can.visible = g.can === 1;
    if (g.can === 1) {
      this.can.position.set(g.x + 0.32, 1.05 + g.hop, g.z + 0.18);
    }
    this.tmp.copy(this.target);
    return this.tmp;
  }
}
