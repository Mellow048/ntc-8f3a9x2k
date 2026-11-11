// Where does a world point land in the frame? Checks a shot's framing without rendering.
//
//   node scripts/frame.mjs [film] <shot index> "x,y,z" ["x,y,z" ...]
//
// `film` is the folder under src/videos whose story.ts holds the shot list (default: fridge).
// Prints each point as (x%, y%) of the frame, left to right and top to bottom, at the start and end of the shot.
// Captions sit at about 73-81 % down; anything outside 0-100 is out of frame.
import fs from 'node:fs';
import * as THREE from 'three';
const args = process.argv.slice(2);
const film = args.length && !/^\d+$/.test(args[0]) ? args.shift() : 'fridge';
const src = fs.readFileSync(new URL(`../src/videos/${film}/story.ts`, import.meta.url), 'utf8');
const re = /^\s*s\((\d+), '(\w+)', '(\w+)', (\[[^\]]+\]), (\[[^\]]+\]), ([\d.]+)(?:, (\{[^}]*\}))?\)/gm;
const shots = []; let m;
while ((m = re.exec(src))) shots.push({kind: m[2], v: m[3], cam: JSON.parse(m[4]), target: JSON.parse(m[5]), fov: +m[6], ...(m[7] ? Function(`return (${m[7]})`)() : {})});
const [idx, ...pts] = args;
const shot = shots[+idx];
if (!shot) { console.error(`${film}: ${shots.length} shots; give a shot index`); process.exit(2); }
console.log(`${film} shot ${idx}: ${shot.kind}/${shot.v} cam ${shot.cam} target ${shot.target} fov ${shot.fov}`,
  shot.to ? `to ${shot.to}` : `push ${shot.push ?? 0.1}`, shot.targetTo ? `target to ${shot.targetTo}` : '');
for (const u of [0, 1]) {                                          // the same camera move as World.ts, at its two ends
  const cam = new THREE.PerspectiveCamera(shot.fov, 9 / 16, 0.1, 320), focus = new THREE.Vector3(...shot.target), p = new THREE.Vector3(...shot.cam);
  if (shot.targetTo) focus.lerp(new THREE.Vector3(...shot.targetTo), u);
  if (shot.to) p.lerp(new THREE.Vector3(...shot.to), u); else p.lerp(focus, u * (shot.push ?? 0.1));
  cam.position.copy(p); cam.lookAt(focus); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const d = p.distanceTo(focus), h = 2 * d * Math.tan(shot.fov * Math.PI / 360);
  console.log(u ? ' end  ' : ' start', `frame at target: ${(h * 9 / 16).toFixed(2)} wide x ${h.toFixed(2)} tall |`,
    pts.map((s) => { const v = new THREE.Vector3(...s.split(',').map(Number)).project(cam); return `(${((v.x + 1) * 50).toFixed(0)}%, ${((1 - v.y) * 50).toFixed(0)}%)`; }).join(' '));
}
