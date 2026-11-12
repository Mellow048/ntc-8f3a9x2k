// The boar. Real geometry (spheres, cones, cylinders), not a card: it has to cast a shadow in the potato rows,
// pass under the rail, and be lit from behind by a low sun. Ink pass outlines it; two-tone shading (shade.ts)
// gives it a lit rim and a flat shadow side like everything else in the world.
import * as THREE from "three";
import { lam } from "./build";
import type { PigState } from "./story";

const sphere = (r: number, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h);
const cyl = (r0: number, r1: number, h: number, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n);

export class Pig {
  group = new THREE.Group();
  private head = new THREE.Group();
  private legs: THREE.Object3D[] = [];
  private torso: THREE.Mesh;

  constructor(parent: THREE.Object3D) {
    const hide = lam("pigHide", () => ({ color: "#2b2321" }));
    const hideLit = lam("pigHideHi", () => ({ color: "#3a2f2a" }));
    const snout = lam("pigSnout", () => ({ color: "#6f4640" }));
    const horn = lam("pigTusk", () => ({ color: "#efe4cd" }));

    // torso: a boar's slab-sided barrel with a shoulder ridge
    this.torso = new THREE.Mesh(sphere(1), hide);
    this.torso.scale.set(0.62, 0.4, 0.35);
    this.torso.position.set(0, 0.53, 0);
    this.torso.castShadow = true; this.torso.receiveShadow = true;
    this.group.add(this.torso);

    const hump = new THREE.Mesh(sphere(1), hideLit);
    hump.scale.set(0.26, 0.24, 0.3);
    hump.position.set(0.2, 0.76, 0);
    hump.castShadow = true;
    this.group.add(hump);

    // head, on a pivot at the neck so `root` can drop the snout into the soil
    this.head.position.set(0.5, 0.62, 0);
    this.head.rotation.order = "ZYX";
    this.group.add(this.head);

    const skull = new THREE.Mesh(sphere(0.27), hide);
    skull.scale.set(1.15, 0.95, 0.82);
    skull.position.set(0.12, 0, 0);
    skull.castShadow = true; skull.receiveShadow = true;
    this.head.add(skull);

    const sn = new THREE.Mesh(cyl(0.075, 0.1, 0.2), snout);
    sn.rotation.z = Math.PI / 2;
    sn.position.set(0.36, -0.06, 0);
    sn.castShadow = true;
    this.head.add(sn);
    const disc = new THREE.Mesh(cyl(0.078, 0.078, 0.03, 12), snout);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(0.46, -0.06, 0);
    this.head.add(disc);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(cyl(0.002, 0.085, 0.17, 6), hide);
      ear.position.set(0.02, 0.2, s * 0.13);
      ear.rotation.set(s * 0.35, 0, -0.5);
      ear.castShadow = true;
      this.head.add(ear);
      const tusk = new THREE.Mesh(cyl(0.002, 0.026, 0.1, 6), horn);
      tusk.position.set(0.4, -0.12, s * 0.055);
      tusk.rotation.set(s * 0.2, 0, 1.0);
      this.head.add(tusk);
    }

    // legs
    for (const [x, z] of [[0.34, 0.2], [0.34, -0.2], [-0.32, 0.2], [-0.32, -0.2]]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.42, z);
      const shin = new THREE.Mesh(cyl(0.042, 0.05, 0.4, 8), hide);
      shin.position.y = -0.2;
      shin.castShadow = true;
      leg.add(shin);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.085), snout);
      hoof.position.y = -0.4;
      hoof.castShadow = true;
      leg.add(hoof);
      this.group.add(leg);
      this.legs.push(leg);
    }

    // curly tail
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 5, 14, Math.PI * 1.7), hideLit);
    tail.position.set(-0.6, 0.58, 0);
    tail.rotation.y = Math.PI / 2;
    this.group.add(tail);

    parent.add(this.group);
  }

  update(s: PigState) {
    this.group.position.set(s.x, s.y, s.z);
    this.group.rotation.y = s.yaw;
    // legs: diagonal pairs, 1.1 s stride
    for (let i = 0; i < 4; i++) {
      const ph = (s.phase + (i === 0 || i === 3 ? 0 : 0.5)) * Math.PI * 2;
      this.legs[i].rotation.z = Math.sin(ph) * 0.42;
    }
    this.torso.position.y = 0.53 + Math.sin(s.phase * Math.PI * 4) * 0.012;
    // root = how far the snout is down in the soil (0 up .. 1 down)
    this.head.rotation.z = -0.18 - 0.62 * s.root;
    this.head.rotation.x = s.ear * 0.12;
    this.head.position.y = 0.62 - 0.05 * s.root;
  }
}
