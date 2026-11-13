// The world of the bitcoin flex short: every set is built once, one is shown per shot, and the same two lights are
// re-coloured for each set (no shader recompiles between shots). Cuts are hard; each shot pushes in or travels.
import * as THREE from 'three';
import {SHOTS, shotAt, shotEnd, type Kind} from './story';
import {cab, diner, loot, stop, trailer, type Builder, type SetDef} from './sets';
import {airport, cold, crash, map, road, show} from './sets2';
import {court, deal, scale, seven, tags} from './sets3';
import {clamp01} from './kit';

const BUILDERS: Record<Kind, Builder> = {loot, stop, diner, cab, seven, deal, show, road, map, trailer, cold, crash, airport, tags, court, scale};

export class BtcFlexWorld {
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
    const i = shotAt(f), shot = SHOTS[i];
    for (const s of this.sets.values()) s.root.visible = false;
    const set = this.sets.get(shot.kind)!; set.root.visible = true;
    const L = set.def.light(shot.v);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.amb;
    this.key.color.set(L.key); this.key.intensity = L.keyI; this.key.position.set(...L.from);
    const sc = this.key.shadow.camera;
    if (sc.right !== L.span) { sc.left = -L.span; sc.right = L.span; sc.top = L.span; sc.bottom = -L.span; sc.near = 0.5; sc.far = 60; sc.updateProjectionMatrix(); }
    this.close = !!shot.close;
    // fast off the cut, settling toward the end: every shot arrives with a little punch.
    // A take can run over several shots (`join`): then the move of its first shot runs across all of them and never restarts.
    let a = i, b = i; while (a > 0 && SHOTS[a].join) a--; while (SHOTS[b + 1]?.join) b++;
    // A shot that goes on from a camera at rest (`soft`) starts gently instead.
    const mv = SHOTS[a], t = clamp01((f - mv.at) / (shotEnd(b) - mv.at)), u = mv.soft ? t * t * (3 - 2 * t) : 1 - (1 - t) ** 2.2, p = new THREE.Vector3(...mv.cam);
    this.focus.set(...mv.target); if (mv.targetTo) this.focus.lerp(new THREE.Vector3(...mv.targetTo), u);
    if (mv.to) p.lerp(new THREE.Vector3(...mv.to), u); else p.lerp(this.focus, u * (mv.push ?? 0.1));
    camera.position.copy(p); camera.lookAt(this.focus); camera.fov = shot.fov; camera.near = 0.1; camera.far = 320;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    set.def.tick({f, t: f - shot.at, cam: camera, shot});
  }
}
