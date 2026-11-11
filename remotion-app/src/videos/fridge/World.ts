// The world of the fridge hack short: every set is built once, one is shown per shot, and the same two lights are
// re-coloured for each set (no shader recompiles between shots). Cuts are hard; each shot pushes in or travels.
import * as THREE from 'three';
import {SHOTS, shotAt, shotEnd, type Kind} from './story';
import {aisle, front, lair, mapSet, panelSet, type Builder, type SetDef} from './sets';
import {cable, lecture, lineup, podium, tech} from './sets2';
import {board, desk, ikea, lab, showroom} from './sets3';
import {clamp01} from './kit';

const BUILDERS: Record<Kind, Builder> = {aisle, panel: panelSet, lair, map: mapSet, front, podium, cable, tech, lecture, lineup, showroom, ikea, lab, board, desk};

export class FridgeWorld {
  root = new THREE.Group();
  /** where the lens is focused this frame */
  focus = new THREE.Vector3();
  close = false;
  private sets = new Map<Kind, {root: THREE.Group; def: SetDef}>();
  private hemi = new THREE.HemisphereLight('#fff4da', '#99aac1', 1.7);
  private key = new THREE.DirectionalLight('#fff0d4', 2);
  constructor() {
    for (const [kind, build] of Object.entries(BUILDERS) as [Kind, Builder][]) {
      const root = new THREE.Group(); root.visible = false; this.root.add(root);
      this.sets.set(kind, {root, def: build(root)});
    }
    this.key.castShadow = true; this.key.shadow.mapSize.set(1024, 1024); this.key.shadow.bias = -0.0002;
    this.root.add(this.hemi, this.key, this.key.target);
  }
  update(f: number, camera: THREE.PerspectiveCamera) {
    const i = shotAt(f), shot = SHOTS[i], end = shotEnd(i);
    for (const s of this.sets.values()) s.root.visible = false;
    const set = this.sets.get(shot.kind)!; set.root.visible = true;
    const L = set.def.light(shot.v);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.amb;
    this.key.color.set(L.key); this.key.intensity = L.keyI; this.key.position.set(...L.from);
    const sc = this.key.shadow.camera;
    if (sc.right !== L.span) { sc.left = -L.span; sc.right = L.span; sc.top = L.span; sc.bottom = -L.span; sc.near = 0.5; sc.far = 60; sc.updateProjectionMatrix(); }
    this.close = !!shot.close;
    // fast off the cut, settling toward the end: every shot arrives with a little punch
    const t = clamp01((f - shot.at) / (end - shot.at)), u = 1 - (1 - t) ** 2.2, p = new THREE.Vector3(...shot.cam);
    this.focus.set(...shot.target); if (shot.targetTo) this.focus.lerp(new THREE.Vector3(...shot.targetTo), u);
    if (shot.to) p.lerp(new THREE.Vector3(...shot.to), u); else p.lerp(this.focus, u * (shot.push ?? 0.1));
    camera.position.copy(p); camera.lookAt(this.focus); camera.fov = shot.fov; camera.near = 0.1; camera.far = 320;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    set.def.tick({f, t: f - shot.at, cam: camera, shot});
  }
}
