// Where does a world point land in the frame? Checks a shot's framing without rendering.
//
//   node scripts/frame.mjs [film] <shot index> "x,y,z" ["x,y,z" ...]
//
// `film` is the folder under src/videos whose story.ts holds the shot list (or set FILM=<folder>).
// Prints each point as (x%, y%) of the frame, left to right and top to bottom, at the start and end of the shot.
// Captions sit at about 73-81 % down; anything outside 0-100 is out of frame.
import fs from 'node:fs';
import * as THREE from 'three';
const args = process.argv.slice(2);
const film = args.length && !/^\d+$/.test(args[0]) ? args.shift() : process.env.FILM;
if (!film) { console.error('name the film folder: node scripts/frame.mjs <film> <shot index> "x,y,z"'); process.exit(2); }
const src = fs.readFileSync(new URL(`../src/videos/${film}/story.ts`, import.meta.url), 'utf8');
const re = /^\s*s\((\d+), '(\w+)', '(\w+)', (\[[^\]]+\]), (\[[^\]]+\]), ([\d.]+)(?:, (\{[^}]*\}))?\)/gm;
const shots = []; let m;
while ((m = re.exec(src))) shots.push({word: +m[1], kind: m[2], v: m[3], cam: JSON.parse(m[4]), target: JSON.parse(m[5]), fov: +m[6], ...(m[7] ? Function(`return (${m[7]})`)() : {})});
const [idx, ...pts] = args;
const shot = shots[+idx];
if (!shot) { console.error(`${film}: ${shots.length} shots; give a shot index`); process.exit(2); }
// Frames, as story.ts counts them: a shot starts two frames ahead of its word. A take can run over several shots (`join`): the move of
// its first shot then runs across all of them, so this shot shows only its share of that move.
const words = JSON.parse(fs.readFileSync(new URL(`../src/videos/${film}/words.json`, import.meta.url), 'utf8'));
const FPS = 30, at = (i) => Math.max(0, Math.round(words[shots[i].word].start * FPS) - 2);
// seconds held after the last word: a film says so in story.ts (`export const TAIL = 3.6;`); the films before the ninth's second cut held 1.55
const TAIL = +(src.match(/^export const TAIL = ([\d.]+);/m)?.[1] ?? 1.55);
const total = Math.round((words[words.length - 1].end + TAIL) * FPS), end = (i) => (i + 1 < shots.length ? at(i + 1) : total);
let a = +idx, b = +idx; while (a > 0 && shots[a].join) a--; while (shots[b + 1]?.join) b++;
const mv = shots[a], ease = (f) => { const t = (f - at(a)) / (end(b) - at(a)); return mv.soft ? t * t * (3 - 2 * t) : 1 - (1 - t) ** 2.2; };
console.log(`${film} shot ${idx}: ${shot.kind}/${shot.v} frames ${at(+idx)}-${end(+idx) - 1}`, a !== b ? `| part of the take over shots ${a}-${b} (frames ${at(a)}-${end(b) - 1})` : '',
  `| cam ${mv.cam} target ${mv.target} fov ${mv.fov}`, mv.to ? `to ${mv.to}` : `push ${mv.push ?? 0.1}`, mv.targetTo ? `target to ${mv.targetTo}` : '');
for (const [label, f] of [[' start', at(+idx)], [' end  ', end(+idx)]]) {                 // the same camera move as World.ts, at this shot's two ends
  const u = ease(f), cam = new THREE.PerspectiveCamera(mv.fov, 9 / 16, 0.1, 320), focus = new THREE.Vector3(...mv.target), p = new THREE.Vector3(...mv.cam);
  if (mv.targetTo) focus.lerp(new THREE.Vector3(...mv.targetTo), u);
  if (mv.to) p.lerp(new THREE.Vector3(...mv.to), u); else p.lerp(focus, u * (mv.push ?? 0.1));
  cam.position.copy(p); cam.lookAt(focus); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const d = p.distanceTo(focus), h = 2 * d * Math.tan(mv.fov * Math.PI / 360);
  console.log(label, `camera ${p.toArray().map((x) => x.toFixed(2))} | frame at target: ${(h * 9 / 16).toFixed(2)} wide x ${h.toFixed(2)} tall |`,
    pts.map((s) => { const v = new THREE.Vector3(...s.split(',').map(Number)).project(cam); return `(${((v.x + 1) * 50).toFixed(0)}%, ${((1 - v.y) * 50).toFixed(0)}%)`; }).join(' '));
}
