// Set-building kit (shared with the news reference): cached materials, primitives, canvas textures and timing maths.
// World geometry stays on layer 0 so the ink pass outlines it; anything soft or see-through goes on NOINK.
import * as THREE from 'three';
import {NOINK} from '../pendulum/ink';

export type V = [number, number, number];
export type Node = THREE.Object3D;
export type G2 = CanvasRenderingContext2D;

// ---------- maths ----------
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 -> 1 between frames a and b, eased in and out */
export const smooth = (f: number, a: number, b: number) => { const t = clamp01((f - a) / (b - a)); return t * t * (3 - 2 * t); };
/** 0 -> 1 with a little overshoot: things that slam or pop into place */
export const pop = (f: number, at: number, dur = 9) => {
  const t = clamp01((f - at) / dur); if (t <= 0) return 0;
  const c = 2.2; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
/** one hop: 0 -> h -> 0 over dur frames */
export const hop = (f: number, at: number, h = 0.25, dur = 11) => { const t = (f - at) / dur; return t <= 0 || t >= 1 ? 0 : h * 4 * t * (1 - t); };
/** decaying shake after a hit */
export const shake = (f: number, at: number, amp = 1, dur = 12) => { const t = f - at; return t < 0 || t > dur ? 0 : amp * (1 - t / dur) * Math.sin(t * 2.4); };
export const rng = (seed: number) => { let n = seed % 2147483647 || 1; return () => ((n = (n * 16807) % 2147483647) - 1) / 2147483646; };

// ---------- materials ----------
const lambert = new Map<string, THREE.MeshLambertMaterial>();
export const mat = (c: string) => { let m = lambert.get(c); if (!m) lambert.set(c, (m = new THREE.MeshLambertMaterial({color: c}))); return m; };
const basic = new Map<string, THREE.MeshBasicMaterial>();
/** Unlit colour. k > 1 lifts it over the bloom threshold: screens, LEDs, flames, neon. */
export const lit = (c: string, k = 1) => {
  const key = c + '|' + k; let m = basic.get(key);
  if (!m) basic.set(key, (m = new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(k)})));
  return m;
};
/** a private unlit material whose brightness a set animates */
export const lamp = (c: string, k = 1) => new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(k)});

// ---------- primitives ----------
export function mesh(p: Node, g: THREE.BufferGeometry, m: string | THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, typeof m === 'string' ? mat(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o;
}
export const grp = (p: Node, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
export const box = (p: Node, w: number, h: number, d: number, m: string | THREE.Material, x = 0, y = 0, z = 0) => mesh(p, new THREE.BoxGeometry(w, h, d), m, x, y, z);
export const cyl = (p: Node, r: number, h: number, m: string | THREE.Material, x = 0, y = 0, z = 0, rTop = r, seg = 20) =>
  mesh(p, new THREE.CylinderGeometry(rTop, r, h, seg), m, x, y, z);
export const ball = (p: Node, r: number, m: string | THREE.Material, x = 0, y = 0, z = 0) => mesh(p, new THREE.SphereGeometry(r, 20, 14), m, x, y, z);
export const cone = (p: Node, r: number, h: number, m: string | THREE.Material, x = 0, y = 0, z = 0, seg = 20) => mesh(p, new THREE.ConeGeometry(r, h, seg), m, x, y, z);
export const torus = (p: Node, r: number, t: number, m: string | THREE.Material, x = 0, y = 0, z = 0) => mesh(p, new THREE.TorusGeometry(r, t, 8, 36), m, x, y, z);
export function rod(p: Node, a: V, b: V, r: number, m: string | THREE.Material) {
  const av = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(av), o = cyl(p, r, d.length(), m, 0, 0, 0, r, 8);
  o.position.copy(av).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}
export const lathe = (p: Node, profile: [number, number][], m: string | THREE.Material, x = 0, y = 0, z = 0, seg = 32) =>
  mesh(p, new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), seg), m, x, y, z);
/** flat outline pushed back by `depth` (pediments, arrows, stars, signs with a shape) */
export function slab(p: Node, pts: [number, number][], depth: number, m: string | THREE.Material, x = 0, y = 0, z = 0) {
  const s = new THREE.Shape(pts.map(([px, py]) => new THREE.Vector2(px, py)));
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false}); g.translate(0, 0, -depth / 2);
  return mesh(p, g, m, x, y, z);
}
export const floor = (p: Node, w: number, d: number, m: string | THREE.Material, y = 0, x = 0, z = 0) => {
  const o = mesh(p, new THREE.PlaneGeometry(w, d), m, x, y, z); o.rotation.x = -Math.PI / 2; o.castShadow = false; return o;
};

// ---------- canvas textures ----------
const texCache = new Map<string, THREE.CanvasTexture>();
export function tex(key: string, w: number, h: number, draw: (g: G2, w: number, h: number) => void, repeat = false) {
  let t = texCache.get(key); if (t) return t;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set(key, t); return t;
}
export const tiled = (t: THREE.Texture, rx: number, ry: number) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
/** lit, textured material */
export const tmat = (t: THREE.Texture, color = '#ffffff') => new THREE.MeshLambertMaterial({map: t, color});
/** unlit, textured material: a screen or printed sign that carries its own light (k > 1 blooms) */
export const smat = (t: THREE.Texture, k = 1, transparent = false) =>
  new THREE.MeshBasicMaterial({map: t, color: new THREE.Color('#ffffff').multiplyScalar(k), transparent, alphaTest: transparent ? 0.02 : 0});
/** upright rectangle carrying a texture */
export function panel(p: Node, w: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0) {
  const o = mesh(p, new THREE.PlaneGeometry(w, h), m, x, y, z); o.rotation.y = ry; o.castShadow = false; return o;
}
/** soft things that must not be outlined or cast shadows */
export function soft<T extends THREE.Mesh>(o: T) { o.layers.set(NOINK); o.castShadow = false; o.receiveShadow = false; return o; }

export type TextOpt = {font?: 'Anton' | 'Montserrat'; weight?: number; align?: CanvasTextAlign; stroke?: string; sw?: number; maxWidth?: number; spacing?: number};
/** centred text that shrinks to fit maxWidth */
export function text(g: G2, s: string, x: number, y: number, size: number, color: string, o: TextOpt = {}) {
  const font = o.font ?? 'Anton', weight = o.weight ?? (font === 'Anton' ? 400 : 900);
  let px = size;
  g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
  (g as unknown as {letterSpacing: string}).letterSpacing = `${o.spacing ?? 0}px`;
  for (let i = 0; i < 12; i++) { g.font = `${weight} ${px}px ${font}, sans-serif`; if (!o.maxWidth || g.measureText(s).width <= o.maxWidth) break; px *= 0.93; }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw ?? px * 0.12; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
  g.fillStyle = color; g.fillText(s, x, y);
  (g as unknown as {letterSpacing: string}).letterSpacing = '0px';
}
export function rrect(g: G2, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export const vgrad = (g: G2, w: number, h: number, stops: string[]) => {
  const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
};
/** speckled surface: carpet, concrete, asphalt, plaster */
export const grainTex = (key: string, base: string, dark = 0.12, n = 9000) => tex('grain-' + key, 256, 256, (g) => {
  const r = rng(key.length * 97 + 13); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) { g.fillStyle = r() > 0.5 ? `rgba(0,0,0,${dark * r()})` : `rgba(255,255,255,${dark * 0.8 * r()})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
}, true);
export const woodTex = (key: string, base: string, line: string) => tex('wood-' + key, 256, 256, (g) => {
  const r = rng(71); g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.strokeStyle = line;
  for (let i = 0; i < 46; i++) { g.globalAlpha = 0.15 + r() * 0.3; g.lineWidth = 0.6 + r() * 1.6; const y = r() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (r() - 0.5) * 12, 170, y + (r() - 0.5) * 12, 256, y); g.stroke(); }
  g.globalAlpha = 0.35; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  g.globalAlpha = 1;
}, true);
export const tileTex = (key: string, base: string, line: string, n = 4, alt?: string) => tex('tile-' + key, 256, 256, (g) => {
  const s = 256 / n; g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (alt && (x + y) % 2) { g.fillStyle = alt; g.fillRect(x * s, y * s, s, s); } g.strokeStyle = line; g.lineWidth = 2.5; g.strokeRect(x * s, y * s, s, s); }
}, true);
/** vertical folds: curtains, corrugated container walls */
export const foldTex = (key: string, base: string, shade: string, n = 10) => tex('fold-' + key, 256, 64, (g) => {
  const s = 256 / n;
  for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * s, 0, (i + 1) * s, 0); gr.addColorStop(0, shade); gr.addColorStop(0.45, base); gr.addColorStop(0.8, base); gr.addColorStop(1, shade); g.fillStyle = gr; g.fillRect(i * s, 0, s + 1, 64); }
}, true);

// ---------- atmosphere ----------
/** sky / studio backdrop: a huge inward-facing dome with a vertical gradient (top colour first) */
export function backdrop(p: Node, stops: string[], k = 1) {
  const t = tex('sky-' + stops.join(), 8, 256, (g, w, h) => vgrad(g, w, h, stops));
  const m = new THREE.MeshBasicMaterial({map: t, side: THREE.BackSide, depthWrite: false, fog: false, color: new THREE.Color('#fff').multiplyScalar(k)});
  const o = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), m); o.layers.set(NOINK); o.renderOrder = -10; p.add(o); return o;
}
/** see-through light beam (spotlights, flashlights, projector): additive, never outlined */
export function beam(p: Node, rTop: number, rBot: number, h: number, color: string, opacity: number, x = 0, y = 0, z = 0) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, 28, 1, true); g.translate(0, -h / 2, 0);
  const m = new THREE.MeshBasicMaterial({color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false});
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.layers.set(NOINK); o.renderOrder = 5; p.add(o); return o;
}
const spotTex = (inner: string, outer: string) => tex(`spot-${inner}-${outer}`, 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.55, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** soft round patch on the ground: pools of light (additive) or contact shadows (normal blending) */
export function pool(p: Node, r: number, color: string, opacity: number, x = 0, z = 0, y = 0.012, additive = true) {
  const t = spotTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const m = new THREE.MeshBasicMaterial({map: t, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false});
  const o = new THREE.Mesh(new THREE.CircleGeometry(r, 32), m); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.layers.set(NOINK); o.renderOrder = 2; p.add(o); return o;
}
/** camera-facing flat cut-out (props drawn in 2D: bubbles, flames, stars). Never outlined. */
export function card(p: Node, w: number, h: number, t: THREE.Texture, x = 0, y = 0, z = 0, k = 1) {
  const m = new THREE.MeshBasicMaterial({map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, color: new THREE.Color('#fff').multiplyScalar(k)});
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.layers.set(NOINK); p.add(o); return o;
}
