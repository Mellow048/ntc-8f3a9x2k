// The cast of the Nvidia short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only: hair, glasses, jacket, hat.
// The real people in the story are public figures shown in their best-known public look; the woman is kept an
// anonymous figure in white behind a hat and sunglasses, because she has not been charged with anything.
import * as THREE from 'three';
import {Pen, bodyFront, bodySide, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'swing';
export type Prop = 'chip' | 'paper' | 'magnifier' | 'torch' | 'phone' | 'remote' | 'case' | 'tablet' | 'bill' | null;
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round' | 'shades' | 'cat';
  front?: 'leather' | 'suit' | 'trench' | 'fbi' | 'vest' | 'hoodie' | 'waiter' | 'tee';
  tie?: string; shirt?: string; longTie?: boolean;
  hairdo?: 'swept' | 'swoop' | 'long' | 'bob';
  hairColor?: string;
  extra?: 'brim' | 'headset' | 'earpiece' | 'fedora';
  lips?: string;
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march'; phase?: number};

const DARK = '#17171d';
const curve = (a: P2, k: P2, b: P2, n = 12): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]); }
  return out;
};
const rect = (x: number, y: number, w: number, h: number): P2[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const rounded = (x: number, y: number, w: number, h: number, r: number): P2[] => {
  const out: P2[] = [], q = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * Math.PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  q(x + w - r, y + r, -Math.PI / 2); q(x + w - r, y + h - r, 0); q(x + r, y + h - r, Math.PI / 2); q(x + r, y + r, Math.PI);
  return out;
};

// ---------- arms ----------
function arms(pose: Pose, g: FrontGeo, hands: P2[]) {
  const {sh, tcx, Ta, HH, u} = g, out: {pts: [P2, P2, P2]; front: boolean}[] = [];
  const A = (side: number, ex: number, ey: number, hx: number, hy: number, front = false) => {
    const S = sh(side), pts: [P2, P2, P2] = [S, [tcx + side * ex, S[1] + ey * HH], [tcx + side * hx, S[1] + hy * HH]];
    out.push({pts, front}); hands[side > 0 ? 1 : 0] = pts[2];
  };
  const hang = (s: number) => A(s, 1.12 * Ta + 4 * u, 0.48, 1.12 * Ta + 7 * u, 0.92);
  const both = (f: (s: number) => void) => { f(-1); f(1); };
  switch (pose) {
    case 'hold': hang(-1); A(1, 1.1 * Ta + 12 * u, -0.2, 1.18 * Ta + 30 * u, -0.6); break;
    case 'shrug': both((s) => A(s, 1.2 * Ta + 10 * u, 0.36, 1.5 * Ta + 28 * u, -0.06)); break;
    case 'panic': both((s) => A(s, 1.25 * Ta + 16 * u, 0, 56 * u, -0.56)); break;
    case 'point': hang(-1); A(1, 1.2 * Ta + 12 * u, 0.14, 1.5 * Ta + 36 * u, -0.04); break;
    case 'hips': both((s) => A(s, 1.4 * Ta + 10 * u, 0.42, 0.98 * Ta, 0.8, true)); break;
    case 'cross': A(-1, 1.14 * Ta, 0.5, -0.5 * Ta, 0.42, true); A(1, 1.14 * Ta, 0.54, -0.45 * Ta, 0.52, true); break;
    case 'desk': both((s) => A(s, 1.16 * Ta + 2 * u, 0.44, 0.5 * Ta, 0.76, true)); break;
    case 'both': both((s) => A(s, 1.2 * Ta + 4 * u, 0.46, 0.4 * Ta, 0.38, true)); break;
    case 'phone': hang(-1); A(1, 1.25 * Ta + 14 * u, 0.12, 55 * u, -0.4); break;
    case 'think': hang(-1); A(1, 1.22 * Ta, 0.52, 0.3 * Ta, 0.02, true); break;
    default: both(hang);
  }
  return out;
}

// ---------- things held ----------
function drawProp(p: Pen, prop: Prop, hands: P2[], u: number) {
  if (!prop) return;
  const g = p.g, R = hands[1] ?? [430, 600], L = hands[0] ?? [170, 600];
  const mid: P2 = [(R[0] + L[0]) / 2, (R[1] + L[1]) / 2];
  if (prop === 'chip') {
    const [x, y] = [R[0] + 2 * u, R[1] - 22 * u], s = 21 * u;
    for (let i = 0; i < 5; i++) for (const d of [-1, 1]) {
      p.stroke([[x - s + (i + 0.5) * s * 0.4, y + d * s], [x - s + (i + 0.5) * s * 0.4, y + d * (s + 5 * u)]], 2.6 * u, '#e7b93c');
      p.stroke([[x + d * s, y - s + (i + 0.5) * s * 0.4], [x + d * (s + 5 * u), y - s + (i + 0.5) * s * 0.4]], 2.6 * u, '#e7b93c');
    }
    p.poly(rounded(x - s, y - s, 2 * s, 2 * s, 3 * u), '#3f9b43', 2.6 * u);
    p.poly(rounded(x - s * 0.58, y - s * 0.58, s * 1.16, s * 1.16, 2 * u), '#c9d2d8', 2 * u);
    p.stroke([[x - s * 0.36, y - s * 0.2], [x - s * 0.1, y - s * 0.38]], 1.6 * u, '#ffffff');
    p.dot(R[0], R[1], 5.5 * u);
    for (const [dx, dy, r] of [[-1.5, -1.5, 1], [1.6, -1.2, 0.7]] as const) {                    // glints
      const sx = x + dx * s, sy = y + dy * s;
      p.poly([[sx, sy - 7 * u * r], [sx + 2 * u * r, sy - 2 * u * r], [sx + 7 * u * r, sy], [sx + 2 * u * r, sy + 2 * u * r], [sx, sy + 7 * u * r], [sx - 2 * u * r, sy + 2 * u * r], [sx - 7 * u * r, sy], [sx - 2 * u * r, sy - 2 * u * r]], '#fff6c2', 1.2 * u);
    }
  } else if (prop === 'paper') {
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u];
    p.rot = [0.18, x, y];
    p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    p.poly(rect(x - 13 * u, y - 19 * u, 26 * u, 7 * u), '#d43b3b', 0);
    for (let i = 0; i < 5; i++) p.stroke([[x - 12 * u, y - 7 * u + i * 6 * u], [x + (i === 4 ? 2 : 12) * u, y - 7 * u + i * 6 * u]], 1.5 * u, '#8f8a96');
    p.rot = null; p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'magnifier') {
    const [x, y] = [R[0] - 6 * u, R[1] - 26 * u];
    p.band([[R[0] + 3 * u, R[1] + 8 * u], [x + 9 * u, y + 13 * u]], '#6b4a2d', 5 * u, 1.5 * u, 'round');
    g.globalAlpha = 0.55; p.ell(x, y, 17 * u, 17 * u, '#cdeeff', 0); g.globalAlpha = 1;
    p.ell(x, y, 17 * u, 17 * u, null, 4 * u);
    p.arc(x - 3 * u, y - 3 * u, 9 * u, 9 * u, 200, 260, 2 * u, '#ffffff');
    p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'torch') {
    const [x, y] = [R[0], R[1]];
    p.poly([[x - 6 * u, y + 12 * u], [x + 6 * u, y + 12 * u], [x + 7 * u, y - 10 * u], [x + 12 * u, y - 16 * u], [x - 12 * u, y - 16 * u], [x - 7 * u, y - 10 * u]], '#3b3f4d', 2.2 * u);
    p.ell(x, y - 16 * u, 12 * u, 5 * u, '#fff3a8', 2 * u);
    p.dot(x, y + 2 * u, 5.5 * u);
  } else if (prop === 'phone') {
    p.poly(rounded(R[0] - 5 * u, R[1] - 15 * u, 10 * u, 24 * u, 2 * u), '#26262e', 1.8 * u); p.dot(R[0] + 3 * u, R[1] + 3 * u, 5 * u);
  } else if (prop === 'remote') {
    const [x, y] = mid;
    p.rot = [-0.25, x, y];
    p.poly(rounded(x - 7 * u, y - 24 * u, 14 * u, 34 * u, 3 * u), '#2b2b33', 2 * u);
    p.dot(x, y - 17 * u, 2.6 * u, '#e2453c');
    for (let i = 0; i < 3; i++) for (const d of [-1, 1]) p.dot(x + d * 3 * u, y - 9 * u + i * 5 * u, 1.3 * u, '#9aa0ad');
    p.rot = null;
  } else if (prop === 'case') {
    const [x, y] = [L[0], L[1] + 4 * u];
    p.arc(x, y + 4 * u, 8 * u, 7 * u, 180, 360, 2.6 * u);
    p.poly(rounded(x - 22 * u, y + 4 * u, 44 * u, 30 * u, 3 * u), '#8a5a34', 2.4 * u);
    p.stroke([[x - 22 * u, y + 14 * u], [x + 22 * u, y + 14 * u]], 1.6 * u);
    p.poly(rect(x - 3.5 * u, y + 11 * u, 7 * u, 6 * u), '#e7b93c', 1.4 * u);
    p.dot(L[0], L[1], 5.5 * u);
  } else if (prop === 'tablet') {
    const [x, y] = mid;
    p.poly(rounded(x - 25 * u, y - 17 * u, 50 * u, 32 * u, 3 * u), '#2a2c36', 2.2 * u);
    p.poly(rect(x - 21 * u, y - 13 * u, 42 * u, 24 * u), '#9fe0ff', 0);
    for (let i = 0; i < 3; i++) p.stroke([[x - 16 * u, y - 7 * u + i * 6 * u], [x + (8 - i * 6) * u, y - 7 * u + i * 6 * u]], 1.6 * u, '#3f7fa8');
    p.dot(L[0], L[1], 5.5 * u); p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'bill') {
    const [x, y] = mid;
    const strip: P2[] = [[x - 15 * u, y - 10 * u], [x + 15 * u, y - 10 * u]];
    for (let i = 0; i <= 8; i++) strip.push([x + 15 * u + Math.sin(i * 1.3) * 3 * u, y - 10 * u + (i + 1) * 13 * u]);
    for (let i = 8; i >= 0; i--) strip.push([x - 15 * u + Math.sin(i * 1.3) * 3 * u, y - 10 * u + (i + 1) * 13 * u]);
    p.poly(strip, '#fffdf4', 2.2 * u);
    for (let i = 0; i < 13; i++) p.stroke([[x - 10 * u, y - 3 * u + i * 8 * u], [x + (i % 3 ? 10 : 3) * u, y - 3 * u + i * 8 * u]], 1.4 * u, '#8f8a96');
    p.dot(L[0], L[1], 5.5 * u); p.dot(R[0], R[1], 5.5 * u);
  }
}

// ---------- torso fronts ----------
function torsoFront(p: Pen, look: Look, g: FrontGeo) {
  const {tcx: x, Ta, chin, HH, u, torsoBot} = g, top = chin - 0.1 * HH;
  const vee = (w: number, depth: number, fill: string) => p.poly([[x - w * Ta, top], [x + w * Ta, top], [x, chin + depth * HH]], fill, 1.8 * u);
  switch (look.front) {
    case 'leather': {
      vee(0.5, 0.42, '#3a3b45');                                                                    // dark tee
      for (const s of [-1, 1]) p.poly([[x + s * 0.52 * Ta, top], [x + s * 0.92 * Ta, chin + 0.2 * HH], [x + s * 0.3 * Ta, chin + 0.5 * HH], [x + s * 0.08 * Ta, chin + 0.36 * HH]], '#2b2c35', 2 * u);
      p.stroke([[x, chin + 0.42 * HH], [x, torsoBot]], 2.2 * u, '#9aa0ad');                         // zip
      for (let y = chin + 0.46 * HH; y < torsoBot; y += 3.4 * u) p.stroke([[x - 1.6 * u, y], [x + 1.6 * u, y]], 0.9 * u, '#454752');
      p.g.globalAlpha = 0.34;                                                                       // leather shine
      p.stroke(curve([x - 0.8 * Ta, chin + 0.42 * HH], [x - 0.9 * Ta, chin + 0.62 * HH], [x - 0.72 * Ta, chin + 0.84 * HH]), 3.2 * u, '#ffffff');
      p.stroke([[x + 0.56 * Ta, chin + 0.66 * HH], [x + 0.7 * Ta, chin + 0.9 * HH]], 2.4 * u, '#ffffff');
      p.g.globalAlpha = 1;
      for (const s of [-1, 1]) p.stroke([[x + s * 0.34 * Ta, chin + 0.72 * HH], [x + s * 0.72 * Ta, chin + 0.68 * HH]], 1.5 * u, '#0c0c10'); // pockets
      break;
    }
    case 'suit': {
      vee(0.46, look.longTie ? 0.6 : 0.56, look.shirt ?? '#fbfaf5');
      const tie = look.tie ?? '#2b2d3a', end = chin + (look.longTie ? 1.02 : 0.5) * HH;
      p.poly([[x - 5 * u, top + 4 * u], [x + 5 * u, top + 4 * u], [x + 3.4 * u, chin + 0.08 * HH], [x - 3.4 * u, chin + 0.08 * HH]], tie, 1.5 * u);
      p.poly([[x - 3.4 * u, chin + 0.08 * HH], [x + 3.4 * u, chin + 0.08 * HH], [x + 6.5 * u, end - 6 * u], [x, end], [x - 6.5 * u, end - 6 * u]], tie, 1.5 * u);
      for (const s of [-1, 1]) {
        p.stroke([[x + s * 0.46 * Ta, top], [x + s * 0.2 * Ta, chin + 0.32 * HH], [x, chin + (look.longTie ? 0.6 : 0.56) * HH]], 1.8 * u);
        p.stroke([[x + s * 0.72 * Ta, chin + 0.1 * HH], [x + s * 0.2 * Ta, chin + 0.32 * HH]], 1.5 * u);     // lapel notch
      }
      if (!look.longTie) p.stroke([[x, chin + 0.56 * HH], [x, torsoBot]], 1.5 * u);
      break;
    }
    case 'trench': {                                                                                // drawn on top of the coat
      const waist = chin + 0.6 * HH;
      for (const s of [-1, 1]) {
        p.stroke([[x + s * 20 * u, chin + 0.03 * HH], [x + s * 6 * u, chin + 0.36 * HH], [x, waist - 3 * u]], 1.8 * u);
        p.stroke([[x + s * 30 * u, chin + 0.2 * HH], [x + s * 6 * u, chin + 0.36 * HH]], 1.4 * u);
      }
      p.stroke([[x, waist + 4 * u], [x + 2 * u, chin + 2.1 * HH]], 1.5 * u);
      p.band([[x - 39 * u, waist], [x + 39 * u, waist]], '#e6dfd0', 7 * u, 1.4 * u);
      p.poly(rect(x - 6 * u, waist - 5.5 * u, 12 * u, 11 * u), '#e7c56a', 1.6 * u);
      for (const s of [-1, 1]) for (const r of [0.8, 1.02]) { p.dot(x + s * 11 * u, chin + r * HH, 2.9 * u); p.dot(x + s * 11 * u, chin + r * HH, 2 * u, '#d9d2c3'); }
      break;
    }
    case 'fbi': {
      p.stroke([[x, top], [x, torsoBot]], 1.6 * u, '#0f1626');
      const g2 = p.g; g2.save(); g2.font = `400 ${17 * u}px Anton, sans-serif`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillStyle = '#ffd43b';
      g2.fillText('FBI', x - 0.46 * Ta, chin + 0.36 * HH); g2.restore();
      p.poly(rect(x + 0.24 * Ta, chin + 0.28 * HH, 0.42 * Ta, 0.14 * HH), '#e7b93c', 1.4 * u);     // badge
      break;
    }
    case 'vest': {
      vee(0.44, 0.58, look.shirt ?? '#fbfaf5');
      const tie = look.tie ?? '#c23b3b';
      p.poly([[x - 3.6 * u, top + 6 * u], [x + 3.6 * u, top + 6 * u], [x + 5.5 * u, chin + 0.44 * HH], [x + u, chin + 0.5 * HH], [x - 5 * u, chin + 0.44 * HH]], tie, 1.5 * u);
      p.poly(rect(x + 0.3 * Ta, chin + 0.3 * HH, 0.44 * Ta, 0.2 * HH), '#fffdf4', 1.4 * u);       // floor badge
      p.stroke([[x + 0.36 * Ta, chin + 0.37 * HH], [x + 0.68 * Ta, chin + 0.37 * HH]], 1.3 * u, '#777');
      p.stroke([[x + 0.36 * Ta, chin + 0.43 * HH], [x + 0.58 * Ta, chin + 0.43 * HH]], 1.3 * u, '#777');
      break;
    }
    case 'hoodie': {
      p.poly([[x - 0.5 * Ta, top], [x + 0.5 * Ta, top], [x + 0.3 * Ta, chin + 0.2 * HH], [x, chin + 0.3 * HH], [x - 0.3 * Ta, chin + 0.2 * HH]], look.shirt ?? '#d9d6cf', 1.8 * u);
      for (const s of [-1, 1]) { p.stroke([[x + s * 5 * u, chin + 0.26 * HH], [x + s * 6 * u, chin + 0.56 * HH]], 1.5 * u, '#f3f1ea'); p.dot(x + s * 6 * u, chin + 0.57 * HH, 1.6 * u, '#f3f1ea'); }
      p.poly(rounded(x - 0.52 * Ta, chin + 0.68 * HH, 1.04 * Ta, 0.22 * HH, 3 * u), null, 1.5 * u);
      break;
    }
    case 'waiter': {
      vee(0.46, 0.5, '#fbfaf5');
      for (const s of [-1, 1]) p.poly([[x, top + 5 * u], [x + s * 9 * u, top + 0.5 * u], [x + s * 9 * u, top + 10 * u]], '#17171d', 1.2 * u);
      p.dot(x, top + 5 * u, 2.4 * u);
      for (let i = 0; i < 3; i++) p.dot(x, chin + (0.62 + i * 0.13) * HH, 1.8 * u, '#e7c56a');
      break;
    }
    case 'tee':
      p.poly(rounded(x - 0.34 * Ta, chin + 0.34 * HH, 0.68 * Ta, 0.3 * HH, 3 * u), look.shirt ?? '#ffd43b', 1.5 * u);
      break;
    default:
  }
}

// ---------- hair, hats, glasses ----------
function hairMass(p: Pen, h: HeadGeo, col: string, kind: 'swept' | 'swoop') {
  const {cx, hc, a, b, u} = h, pts: P2[] = [], swoop = kind === 'swoop';
  if (swoop) {
    // a tall blond wave: big volume over the brow, swept from screen-right down to a flick on the left
    const ring: P2[] = [[-1.05, -0.1], [-1.17, -0.46], [-1.07, -0.86], [-0.72, -1.17], [-0.2, -1.33], [0.36, -1.31], [0.82, -1.13], [1.11, -0.8], [1.15, -0.44], [1.03, -0.16],
      [0.9, -0.48], [0.56, -0.68], [0.15, -0.62], [-0.3, -0.45], [-0.66, -0.3], [-0.88, -0.33]];
    const n = ring.length;
    for (let i = 0; i < n; i++) {                                                                   // closed Catmull-Rom through the ring
      const [p0, p1, p2, p3] = [ring[(i + n - 1) % n], ring[i], ring[(i + 1) % n], ring[(i + 2) % n]];
      for (let k = 0; k < 6; k++) {
        const t = k / 6, t2 = t * t, t3 = t2 * t;
        const f = (q0: number, q1: number, q2: number, q3: number) => 0.5 * (2 * q1 + (q2 - q0) * t + (2 * q0 - 5 * q1 + 4 * q2 - q3) * t2 + (3 * q1 - q0 - 3 * q2 + q3) * t3);
        pts.push([cx + f(p0[0], p1[0], p2[0], p3[0]) * a, hc + f(p0[1], p1[1], p2[1], p3[1]) * b]);
      }
    }
    p.shadedFill(pts, col, '#d79b2f', -2.1, a, 0.35); p.poly(pts, null, 4.4 * u);
    for (const [x0, y0, x1, y1, x2, y2] of [[0.86, -0.92, 0.2, -1.16, -0.62, -0.82], [0.96, -0.62, 0.3, -0.98, -0.72, -0.56], [0.7, -0.66, 0.2, -0.8, -0.5, -0.5]])
      p.stroke(curve([cx + x0 * a, hc + y0 * b], [cx + x1 * a, hc + y1 * b], [cx + x2 * a, hc + y2 * b]), 1.6 * u, '#b9811f');
    return;
  }
  // full head of hair brushed back from a side parting: proud of the skull on top, short at the temples
  for (let i = 0; i <= 26; i++) {
    const s = i / 26, t = Math.PI * (1.0 + s), lift = 1.1 + 0.1 * Math.sin(Math.PI * s) + 0.035 * Math.sin(s * 19);
    pts.push([cx + (1.07 + 0.02 * Math.sin(s * 23)) * a * Math.cos(t), hc + lift * b * Math.sin(t) - 0.02 * b]);
  }
  const line: P2[] = [[1.0, 0.12], [0.93, -0.2], [0.74, -0.44], [0.4, -0.6], [0, -0.66], [-0.36, -0.62], [-0.56, -0.5], [-0.62, -0.66], [-0.86, -0.36], [-0.95, -0.1], [-1.0, 0.12]];
  for (const [x, y] of line) pts.push([cx + x * a, hc + y * b]);
  p.shadedFill(pts, col, '#b9bac4', -2.1, a * 1.1, 0.4); p.poly(pts, null, 4.4 * u);
  for (const [x0, y0, x1, y1, x2, y2] of [[-0.56, -0.56, -0.2, -0.86, 0.3, -1.0], [-0.42, -0.6, 0.1, -0.78, 0.62, -0.8], [0.2, -0.64, 0.6, -0.66, 0.86, -0.5]])
    p.stroke(curve([cx + x0 * a, hc + y0 * b], [cx + x1 * a, hc + y1 * b], [cx + x2 * a, hc + y2 * b]), 1.6 * u, '#a3a4b0');
}
function behindHead(p: Pen, look: Look, h: HeadGeo) {
  const {cx, hc, a, b, u} = h, col = look.hairColor ?? '#2b2330';
  if (look.hairdo === 'long' || look.hairdo === 'bob') {
    // behind the skull, then two locks either side of the neck (nothing under the chin, or it reads as a beard)
    const len = look.hairdo === 'long' ? 1.62 : 1.02, pts: P2[] = [];
    for (let i = 0; i <= 20; i++) { const t = Math.PI * (1 + i / 20); pts.push([cx + 1.14 * a * Math.cos(t), hc + 1.1 * b * Math.sin(t)]); }
    pts.push([cx + 1.2 * a, hc + len * b * 0.6], [cx + 1.1 * a, hc + len * b], [cx + 0.8 * a, hc + len * b * 1.03], [cx + 0.62 * a, hc + len * b * 0.9], [cx + 0.56 * a, hc + 0.7 * b],
      [cx - 0.56 * a, hc + 0.7 * b], [cx - 0.62 * a, hc + len * b * 0.9], [cx - 0.8 * a, hc + len * b * 1.03], [cx - 1.1 * a, hc + len * b], [cx - 1.2 * a, hc + len * b * 0.6]);
    p.shadedFill(pts, col, '#15111a', -2.1, a * 1.2, 0.4);
    p.poly(pts, null, 4.6 * u);
  }
}
function onHead(p: Pen, look: Look, h: HeadGeo) {
  const {cx, hc, a, b, u} = h, g = p.g, hair = look.hairColor ?? '#2b2330';
  if (look.hairdo === 'swept' || look.hairdo === 'swoop') hairMass(p, h, hair, look.hairdo);
  if (look.hairdo === 'long' || look.hairdo === 'bob') {                                           // parted fringe over the forehead
    const top: P2[] = [];
    for (let i = 0; i <= 18; i++) { const t = Math.PI * (1.03 + 0.94 * (i / 18)); top.push([cx + 1.04 * a * Math.cos(t), hc + 1.05 * b * Math.sin(t)]); }
    top.push([cx + 0.98 * a, hc - 0.05 * b], [cx + 0.55 * a, hc - 0.5 * b], [cx + 0.1 * a, hc - 0.66 * b], [cx - 0.5 * a, hc - 0.46 * b], [cx - 0.98 * a, hc - 0.02 * b]);
    p.shadedFill(top, hair, '#15111a', -2.1, a, 0.4); p.poly(top, null, 4.2 * u);
  }
  if (look.lips) { p.ell(cx, hc + 20.5 * u, 6.2 * u, 3.6 * u, look.lips, 1.4 * u); p.stroke([[cx - 5 * u, hc + 20.5 * u], [cx + 5 * u, hc + 20.5 * u]], 1.1 * u, '#7c1730'); }
  // eyewear sits on the eye line (eyes are 13u either side of the centre)
  const ew = look.eyewear;
  if (ew === 'rect' || ew === 'round') {
    const frame = '#1b1b22';
    for (const s of [-1, 1]) {
      const shape = ew === 'rect' ? rounded(cx + s * 13.6 * u - 11.5 * u, hc - 8 * u, 23 * u, 15.5 * u, 3.4 * u) : rounded(cx + s * 13.4 * u - 10.5 * u, hc - 10 * u, 21 * u, 20 * u, 9.5 * u);
      g.globalAlpha = 0.2; p.poly(shape, '#ffffff', 0); g.globalAlpha = 1;
      g.lineJoin = 'round'; p.path(shape, true); g.lineWidth = 3 * u; g.strokeStyle = frame; g.stroke();
      p.stroke([[cx + s * 25 * u, hc - 4 * u], [cx + s * (a / u - 2) * u, hc - 6 * u]], 2.4 * u, frame);
    }
    p.stroke([[cx - 2.4 * u, hc - 3.5 * u], [cx + 2.4 * u, hc - 3.5 * u]], 2.6 * u, frame);
  } else if (ew === 'shades' || ew === 'cat') {
    const cat = ew === 'cat';
    for (const s of [-1, 1]) {
      const x0 = cx + s * 14 * u, w = (cat ? 14 : 12.5) * u, hh = (cat ? 9.5 : 7.5) * u;
      const shape: P2[] = cat
        ? [[x0 - s * w, hc - hh * 0.7], [x0 + s * w * 0.6, hc - hh * 0.95], [x0 + s * w * 1.18, hc - hh * 1.25], [x0 + s * w, hc + hh * 0.3], [x0 + s * w * 0.4, hc + hh], [x0 - s * w * 0.6, hc + hh], [x0 - s * w, hc + hh * 0.3]]
        : rounded(x0 - w, hc - hh, 2 * w, 2 * hh, 3.5 * u);
      p.poly(shape, DARK, 2.4 * u);
      g.globalAlpha = 0.4; p.stroke([[x0 - 5 * u, hc - hh * 0.5], [x0 - u, hc + hh * 0.3]], 2 * u, '#ffffff'); g.globalAlpha = 1;
      p.stroke([[x0 + s * w, hc - 3 * u], [cx + s * (a / u - 2) * u, hc - 5 * u]], 2.6 * u, DARK);
    }
    p.stroke([[cx - 2.5 * u, hc - 3 * u], [cx + 2.5 * u, hc - 3 * u]], 3 * u, DARK);
  }
  const ex = look.extra;
  if (ex === 'brim' || ex === 'fedora') {
    const white = ex === 'brim', col = white ? '#fbf9f3' : '#3a3d4a', sh = white ? '#cfcabd' : '#22242d', band = white ? '#1d1d24' : '#15161b';
    const yb = hc - b + 26 * u, rx = (white ? 76 : 62) * u, ry = (white ? 13 : 10) * u, cw = 43 * u, ch = (white ? 44 : 40) * u;
    p.ell(cx, yb, rx, ry, col, 4.2 * u);
    const dome: P2[] = [];
    for (let i = 0; i <= 14; i++) { const t = Math.PI * (i / 14); dome.push([cx + cw * Math.cos(t), yb + 6.5 * u * Math.sin(t)]); }     // front edge sags like the brim
    dome.push([cx - cw * 0.93, yb - ch * 0.6]);
    for (let i = 0; i <= 10; i++) { const t = Math.PI * (1 + i / 10); dome.push([cx + cw * 0.88 * Math.cos(t), yb - ch * 0.62 + ch * 0.4 * Math.sin(t) * (white ? 1 : 0.8)]); }
    dome.push([cx + cw * 0.93, yb - ch * 0.6]);
    p.shadedFill(dome, col, sh, -2.1, cw, 0.4);
    p.clip(dome, () => { const bandPts: P2[] = []; for (let i = 0; i <= 14; i++) { const t = Math.PI * (i / 14); bandPts.push([cx + cw * 1.05 * Math.cos(t), yb + 6.5 * u * Math.sin(t) + 1]); } for (let i = 14; i >= 0; i--) { const t = Math.PI * (i / 14); bandPts.push([cx + cw * 1.05 * Math.cos(t), yb - 9 * u + 6.5 * u * Math.sin(t)]); } p.poly(bandPts, band, 0); });
    p.poly(dome, null, 4.2 * u);
    if (!white) p.stroke([[cx - 3 * u, yb - ch * 0.98], [cx + 2 * u, yb - ch * 0.72]], 1.6 * u);                                       // crease
  } else if (ex === 'headset') {
    p.arc(cx, hc - 0.1 * b, a * 1.03, b * 1.06, 196, 344, 4.2 * u, '#2b2d38');
    for (const s of [-1, 1]) p.poly(rounded(cx + s * a * 1.0 - 6.5 * u, hc - 9 * u, 13 * u, 21 * u, 4.5 * u), '#2b2d38', 2 * u);
    p.stroke(curve([cx - a * 1.0, hc + 9 * u], [cx - a * 0.85, hc + 26 * u], [cx - 20 * u, hc + 25 * u]), 2.2 * u, '#2b2d38');
    p.dot(cx - 19 * u, hc + 25 * u, 3.2 * u, '#2b2d38');
  } else if (ex === 'earpiece') {
    const x0 = cx + a * 0.98; p.dot(x0, hc + 3 * u, 2.6 * u, '#ececec');
    const coil: P2[] = []; for (let i = 0; i <= 24; i++) coil.push([x0 + 2.5 * u * Math.sin(i * 1.4), hc + 5 * u + i * 1.5 * u]);
    p.stroke(coil, 1.3 * u, '#ececec');
  }
}

// ---------- drawing a person ----------
export function drawActor(g: G2, look: Look, d: Draw, res = 1) {
  g.save(); g.scale(res, res);
  const p = new Pen(g), hands: P2[] = [], pose = d.pose ?? 'hang';
  let unit = 2.36;
  bodyFront(p, look.outfit, {
    mode: d.mode ?? 'stand', phase: d.phase ?? 0, expr: d.expr ?? 'neutral', blink: d.blink, headTilt: d.tilt ?? 0, look: d.look ?? 0, seed: look.seed, facing: 0,
    arms: pose === 'swing' ? undefined : (geo) => { unit = geo.u; return arms(pose, geo, hands); },
    torso: (pen, geo) => torsoFront(pen, look, geo),
    behindHead: (pen, h) => behindHead(pen, look, h),
    onHead: (pen, h) => onHead(pen, look, h),
  });
  drawProp(p, d.prop ?? null, hands, unit);
  g.restore();
}

// ---------- the people ----------
const suit = (id: string, seed: number, jacket: string, hair: string, skin: string, tie: string, more: Partial<Look> = {}, build: Outfit['build'] = 'adult'): Look => ({
  id, seed, front: 'suit', tie, outfit: {jacket, pants: jacket, boots: '#17171d', hat: 'hair', hair, skin, build, noButtons: true}, ...more,
});
export const JENSEN: Look = {
  id: 'jensen', seed: 4, eyewear: 'rect', front: 'leather', hairdo: 'swept', hairColor: '#f4f3ee',
  outfit: {jacket: '#1d1d24', pants: '#26262f', boots: '#131318', hat: null, skin: '#f4cfa8', build: 'adult', noButtons: true},
};
export const WOMAN: Look = {
  id: 'woman', seed: 9, eyewear: 'cat', front: 'trench', hairdo: 'long', hairColor: '#2b2330', extra: 'brim', lips: '#d2314a',
  outfit: {jacket: '#f8f6f0', dress: '#f8f6f0', pants: '#ffffff', boots: '#f3efe6', hat: null, skin: '#fbe2ce', build: 'adult', noButtons: true},
};
export const AGENT = (v = 0): Look => suit('agent' + v, 21 + v, v % 2 ? '#2a2d3b' : '#252c44', ['#3b2a20', '#1f1c1e', '#6b4a2d'][v % 3], ['#f6cfa8', '#c99067', '#ffe2c2'][v % 3], '#15161b',
  {eyewear: 'shades', extra: v % 2 ? 'earpiece' : 'headset'}, v % 2 ? 'stout' : 'adult');
export const SPY = (v = 0): Look => ({id: 'spy' + v, seed: 51 + v, eyewear: 'shades', extra: 'fedora', front: 'suit', tie: '#15161b', shirt: '#d9d6cf',
  outfit: {jacket: '#3a3d4a', pants: '#2c2e38', boots: '#15151a', hat: null, skin: ['#f6cfa8', '#ecd0b6'][v % 2], build: 'adult', noButtons: true}});
export const FBI = (v = 0): Look => ({id: 'fbi' + v, seed: 31 + v, front: 'fbi', eyewear: v % 2 ? 'shades' : undefined,
  outfit: {jacket: '#1f2a44', pants: '#3b3f4d', boots: '#17171d', hat: 'cap', cap: '#1f2a44', skin: ['#ffe2c2', '#c99067'][v % 2], build: v % 2 ? 'stout' : 'adult', noButtons: true}});
export const PRESIDENT: Look = {...suit('president', 14, '#24304f', '#f3c552', '#f5b98c', '#d42a2a', {longTie: true, hairdo: 'swoop', hairColor: '#f3c552'}, 'stout'),
  outfit: {jacket: '#24304f', pants: '#24304f', boots: '#17171d', hat: null, skin: '#f5b98c', build: 'stout', noButtons: true}};
export const SPOKESMAN: Look = suit('spokesman', 17, '#2b2d3a', '#1f1c1e', '#f3cfaa', '#2f5fa8', {eyewear: 'round'});
export const LAWYER: Look = suit('lawyer', 23, '#70768a', '#3a2a20', '#ffe2c2', '#c23b3b');
export const BOARD = (v = 0): Look => v % 3 === 1
  ? {id: 'board' + v, seed: 61 + v, front: 'suit', tie: '#fbfaf5', hairdo: 'bob', hairColor: '#8a8690', eyewear: 'round',
    outfit: {jacket: '#7a3f55', pants: '#3b3f4d', boots: '#17171d', hat: null, skin: '#ecd0b6', build: 'adult', noButtons: true}}
  : suit('board' + v, 61 + v, ['#3b4252', '#4a3f38', '#2f3f4f'][v % 3], ['#b9b6bd', '#3a2a20', '#d9d6cf'][v % 3], ['#ffe2c2', '#c99067', '#f5c9a0'][v % 3], ['#8a2f3d', '#2f5fa8', '#3f7a52'][v % 3], v % 2 ? {} : {eyewear: 'rect'}, v % 2 ? 'adult' : 'stout');
export const STAFF = (v = 0): Look => ({id: 'staff' + v, seed: 71 + v, front: v % 2 ? 'hoodie' : 'tee', shirt: ['#ffd43b', '#f3f1ea', '#8fd3ff', '#f3f1ea'][v % 4],
  eyewear: v % 3 === 0 ? 'round' : undefined, hairdo: v % 4 === 2 ? 'bob' : undefined, hairColor: '#5c3c24', extra: v % 5 === 3 ? 'headset' : undefined,
  outfit: {jacket: ['#4a6b8c', '#5b7553', '#8c4a58', '#6d588c', '#3f7f86'][v % 5], pants: '#323744', boots: '#2f2420', hat: v % 4 === 2 ? null : 'hair', hair: ['#3b271c', '#241c18', '#5c3c24', '#a8643a'][v % 4],
    skin: ['#ffe2c2', '#c99067', '#f5c9a0', '#ecd0b6'][v % 4], build: v % 3 === 1 ? 'stout' : 'adult', noButtons: true}});
export const TRADER = (v = 0): Look => ({id: 'trader' + v, seed: 81 + v, front: 'vest', tie: ['#c23b3b', '#2b2d3a', '#3f7a52'][v % 3],
  outfit: {jacket: ['#2f6fd0', '#e9b930', '#d04a3a', '#3f9b6a'][v % 4], pants: '#2c2e38', boots: '#17171d', hat: 'hair', hair: ['#3b271c', '#b9b6bd', '#241c18'][v % 3],
    skin: ['#ffe2c2', '#f5c9a0', '#c99067'][v % 3], build: v % 2 ? 'stout' : 'adult', noButtons: true}});
export const COUCH: Look = {id: 'couch', seed: 91, front: 'hoodie', shirt: '#d9d6cf',
  outfit: {jacket: '#6f7f96', pants: '#3b4a66', boots: '#f3efe6', hat: 'hair', hair: '#5c3c24', skin: '#ffe2c2', build: 'adult', noButtons: true}};
export const WAITER: Look = {id: 'waiter', seed: 95, front: 'waiter',
  outfit: {jacket: '#1d1d24', pants: '#1d1d24', boots: '#131318', hat: 'hair', hair: '#241c18', skin: '#f5c9a0', build: 'adult', moustache: '#241c18', noButtons: true}};

// ---------- billboards ----------
const cache = new Map<string, THREE.CanvasTexture>();
function texture(look: Look, d: Draw, res: number) {
  const key = look.id + JSON.stringify(d) + res; let t = cache.get(key); if (t) return t;
  const cv = document.createElement('canvas'); cv.width = Math.round(600 * res); cv.height = Math.round(1000 * res);
  drawActor(cv.getContext('2d')!, look, d, res);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cache.set(key, t); return t;
}
export type Actor = {
  node: THREE.Group; mesh: THREE.Mesh; state: string;
  /** switch the drawing (expression + pose) */
  show: (state: string) => Actor;
  /** call once per frame: faces the camera, breathes, blinks */
  tick: (f: number, cam: THREE.Camera) => void;
  tint: (c: string) => Actor;
};
export type ActorOpt = {scale?: number; res?: number; shadow?: number; still?: boolean; phase?: number};
export function actor(parent: Node, look: Look, states: Record<string, Draw>, x: number, y: number, z: number, o: ActorOpt = {}): Actor {
  const scale = o.scale ?? 1, res = o.res ?? 0.7, node = new THREE.Group(); node.position.set(x, y, z); parent.add(node);
  const blinks = look.eyewear !== 'shades' && look.eyewear !== 'cat';
  const maps = new Map<string, [THREE.Texture, THREE.Texture]>();
  for (const [k, d] of Object.entries(states)) maps.set(k, [texture(look, d, res), blinks ? texture(look, {...d, blink: true}, res) : texture(look, d, res)]);
  const first = Object.keys(states)[0];
  const material = new THREE.MeshBasicMaterial({map: maps.get(first)![0], transparent: true, alphaTest: 0.45, side: THREE.DoubleSide});
  const w = 1.296 * scale, h = 2.16 * scale, geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h * 0.475, 0);     // soles on the ground
  const m = new THREE.Mesh(geo, material); m.layers.set(NOINK); node.add(m);
  if (o.shadow !== 0) pool(node, 0.46 * scale, '#000000', o.shadow ?? 0.34, 0, 0, 0.014, false).scale.set(1, 0.55, 1);
  const ph = o.phase ?? look.seed * 1.7, wp = new THREE.Vector3();
  const a: Actor = {
    node, mesh: m, state: first,
    show(s) { if (maps.has(s)) a.state = s; return a; },
    tint(c) { material.color.set(c); return a; },
    tick(f, cam) {
      node.getWorldPosition(wp);
      node.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z) * 0.9;
      const pair = maps.get(a.state)!, blink = blinks && (f + Math.round(ph * 23)) % 97 < 3;
      material.map = pair[blink ? 1 : 0];
      if (!o.still) { m.rotation.z = 0.014 * Math.sin(f * 0.105 + ph); m.scale.y = 1 + 0.011 * Math.sin(f * 0.19 + ph); }
    },
  };
  return a;
}

/** side-on runner (faces screen-right; flip node.scale.x to run left). 8 drawings of one stride. */
export function runner(parent: Node, look: Look, x: number, y: number, z: number, scale = 1, expr: Expr = 'grin') {
  const node = new THREE.Group(); node.position.set(x, y, z); parent.add(node);
  const frames = Array.from({length: 8}, (_, i) => {
    const key = `run-${look.id}-${i}`; let t = cache.get(key);
    if (!t) {
      const cv = document.createElement('canvas'); cv.width = 420; cv.height = 700; const g = cv.getContext('2d')!; g.scale(0.7, 0.7);
      bodySide(new Pen(g), look.outfit, {phase: i / 8, mode: 'march', stride: 1.5, stomp: 1.6, expr, seed: look.seed});
      t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cache.set(key, t);
    }
    return t;
  });
  const material = new THREE.MeshBasicMaterial({map: frames[0], transparent: true, alphaTest: 0.45, side: THREE.DoubleSide});
  const w = 1.296 * scale, h = 2.16 * scale, geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h * 0.475, 0);
  const m = new THREE.Mesh(geo, material); m.layers.set(NOINK); m.rotation.z = -0.16; node.add(m);                      // leaning into the sprint
  pool(node, 0.46 * scale, '#000000', 0.3, 0, 0, 0.014, false).scale.set(1, 0.55, 1);
  return {node, mesh: m, tick: (f: number) => { material.map = frames[Math.floor(f / 2) % 8]; m.position.y = 0.05 * scale * Math.abs(Math.sin(f * Math.PI / 4)); }};
}
export {INK};
