// The cast of the fridge hack short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only: apron, helmet, lab coat, suit.
// Nobody in this film is a real person. France has accused members of a hacking unit by name, but nobody has been
// tried, so the hackers are nobody: a dark hood with no face in it and two pale eyes, the same in every shot.
// The two governments speak through anonymous spokespeople, drawn alike.
import * as THREE from 'three';
import {Pen, bodyFront, bodySide, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'swing';
export type Prop = 'paper' | 'magnifier' | 'phone' | 'tablet' | 'box' | 'crate' | 'hose' | null;
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round';
  front?: 'suit' | 'apron' | 'fire' | 'lab' | 'polo' | 'hoodie' | 'tee';
  /** tie colour, or 'none' for a shirt buttoned to the neck */
  tie?: string; shirt?: string; apron?: string;
  hairdo?: 'swept' | 'long' | 'bob';
  hairColor?: string;
  extra?: 'cowl' | 'helmet' | 'headset';
  /** what shows in the dark of the hood */
  hoodEyes?: 'pale' | 'heart';
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
  const fists = () => { p.dot(L[0], L[1], 5.5 * u); p.dot(R[0], R[1], 5.5 * u); };
  if (prop === 'paper') {                                                                          // a statement with a letterhead
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u];
    p.rot = [0.18, x, y];
    p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    p.poly(rect(x - 13 * u, y - 19 * u, 26 * u, 7 * u), '#3a6fc0', 0);
    for (let i = 0; i < 5; i++) p.stroke([[x - 12 * u, y - 7 * u + i * 6 * u], [x + (i === 4 ? 2 : 12) * u, y - 7 * u + i * 6 * u]], 1.5 * u, '#8f8a96');
    p.rot = null; p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'magnifier') {
    const [x, y] = [R[0] - 6 * u, R[1] - 26 * u];
    p.band([[R[0] + 3 * u, R[1] + 8 * u], [x + 9 * u, y + 13 * u]], '#6b4a2d', 5 * u, 1.5 * u, 'round');
    g.globalAlpha = 0.55; p.ell(x, y, 17 * u, 17 * u, '#cdeeff', 0); g.globalAlpha = 1;
    p.ell(x, y, 17 * u, 17 * u, null, 4 * u);
    p.arc(x - 3 * u, y - 3 * u, 9 * u, 9 * u, 200, 260, 2 * u, '#ffffff');
    p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'phone') {
    p.poly(rounded(R[0] - 5 * u, R[1] - 15 * u, 10 * u, 24 * u, 2 * u), '#26262e', 1.8 * u); p.dot(R[0] + 3 * u, R[1] + 3 * u, 5 * u);
  } else if (prop === 'tablet') {
    const [x, y] = mid;
    p.poly(rounded(x - 25 * u, y - 17 * u, 50 * u, 32 * u, 3 * u), '#2a2c36', 2.2 * u);
    p.poly(rect(x - 21 * u, y - 13 * u, 42 * u, 24 * u), '#9fe0ff', 0);
    for (let i = 0; i < 3; i++) p.stroke([[x - 16 * u, y - 7 * u + i * 6 * u], [x + (8 - i * 6) * u, y - 7 * u + i * 6 * u]], 1.6 * u, '#3f7fa8');
    fists();
  } else if (prop === 'box') {                                                                     // a carton of food that has to go: packets poke out, something drips
    const [x, y] = [mid[0], mid[1] - 6 * u];
    p.poly(rect(x - 20 * u, y - 31 * u, 14 * u, 17 * u), '#e9b930', 1.6 * u); p.poly(rect(x - 4 * u, y - 36 * u, 13 * u, 22 * u), '#d0507a', 1.6 * u); p.poly(rect(x + 10 * u, y - 28 * u, 12 * u, 14 * u), '#57a565', 1.6 * u);
    p.poly([[x - 31 * u, y - 16 * u], [x + 31 * u, y - 16 * u], [x + 27 * u, y + 21 * u], [x - 27 * u, y + 21 * u]], '#c79a62', 2.4 * u);
    p.stroke([[x - 28 * u, y - 6 * u], [x + 28 * u, y - 6 * u]], 1.6 * u, '#8a6a3c');
    for (const dx of [-13, 3, 16]) p.poly([[x + dx * u - 2.4 * u, y + 21 * u], [x + dx * u + 2.4 * u, y + 21 * u], [x + dx * u, y + 33 * u]], '#ffd9ec', 1.2 * u);
    fists();
  } else if (prop === 'crate') {                                                                   // blood bags on their way to another freezer
    const [x, y] = [mid[0], mid[1] - 4 * u];
    for (const dx of [-19, -6, 7]) { p.poly(rounded(x + dx * u, y - 31 * u, 12 * u, 19 * u, 2.5 * u), '#c8202f', 1.5 * u); p.poly(rect(x + dx * u + 2.5 * u, y - 26 * u, 7 * u, 6 * u), '#fffdf4', 0); }
    p.poly(rounded(x - 29 * u, y - 14 * u, 58 * u, 33 * u, 3 * u), '#e8eef4', 2.4 * u);
    for (let i = 0; i < 4; i++) p.poly(rect(x - 22 * u + i * 12 * u, y - 8 * u, 8 * u, 5 * u), '#9fb4c8', 0);
    p.stroke([[x - 29 * u, y + 5 * u], [x + 29 * u, y + 5 * u]], 1.4 * u, '#9fb4c8');
    fists();
  } else if (prop === 'hose') {                                                                    // nozzle in both hands, water fanning out to screen-right
    const [x, y] = [R[0] + 8 * u, R[1] - 2 * u];
    p.stroke(curve([L[0] - 26 * u, L[1] + 74 * u], [L[0] - 10 * u, L[1] + 22 * u], [x - 14 * u, y + 2 * u]), 6.5 * u, '#c9a94f');
    p.rot = [-0.28, x, y];
    g.globalAlpha = 0.9; p.poly([[x + 20 * u, y - 3 * u], [x + 74 * u, y - 24 * u], [x + 84 * u, y - 4 * u], [x + 76 * u, y + 18 * u], [x + 20 * u, y + 3 * u]], '#c9ecff', 1.6 * u); g.globalAlpha = 1;
    p.poly(rect(x - 14 * u, y - 5 * u, 24 * u, 10 * u), '#b9c0c8', 2 * u);
    p.poly([[x + 10 * u, y - 7 * u], [x + 21 * u, y - 4 * u], [x + 21 * u, y + 4 * u], [x + 10 * u, y + 7 * u]], '#d94a3a', 2 * u);
    p.rot = null; fists();
  }
}

// ---------- torso fronts ----------
function torsoFront(p: Pen, look: Look, g: FrontGeo) {
  const {tcx: x, Ta, chin, HH, u, torsoBot} = g, top = chin - 0.1 * HH;
  const vee = (w: number, depth: number, fill: string) => p.poly([[x - w * Ta, top], [x + w * Ta, top], [x, chin + depth * HH]], fill, 1.8 * u);
  switch (look.front) {
    case 'suit': {
      const shirt = look.shirt ?? '#fbfaf5';
      vee(0.46, 0.56, shirt);
      if (look.tie === 'none') {                                                                    // buttoned to the neck, no tie
        for (const s of [-1, 1]) p.poly([[x, top + 10 * u], [x + s * 10 * u, top + 1.5 * u], [x + s * 11 * u, top + 12 * u]], shirt, 1.4 * u);
        p.stroke([[x, top + 10 * u], [x, chin + 0.56 * HH]], 1.2 * u, '#b9b4a8');
        for (let i = 0; i < 3; i++) p.dot(x, chin + (0.16 + i * 0.13) * HH, 1.3 * u, '#b9b4a8');
      } else {
        const tie = look.tie ?? '#2b2d3a', end = chin + 0.5 * HH;
        p.poly([[x - 5 * u, top + 4 * u], [x + 5 * u, top + 4 * u], [x + 3.4 * u, chin + 0.08 * HH], [x - 3.4 * u, chin + 0.08 * HH]], tie, 1.5 * u);
        p.poly([[x - 3.4 * u, chin + 0.08 * HH], [x + 3.4 * u, chin + 0.08 * HH], [x + 6.5 * u, end - 6 * u], [x, end], [x - 6.5 * u, end - 6 * u]], tie, 1.5 * u);
      }
      for (const s of [-1, 1]) {
        p.stroke([[x + s * 0.46 * Ta, top], [x + s * 0.2 * Ta, chin + 0.32 * HH], [x, chin + 0.56 * HH]], 1.8 * u);
        p.stroke([[x + s * 0.72 * Ta, chin + 0.1 * HH], [x + s * 0.2 * Ta, chin + 0.32 * HH]], 1.5 * u);     // lapel notch
      }
      p.stroke([[x, chin + 0.56 * HH], [x, torsoBot]], 1.5 * u);
      break;
    }
    case 'apron': {                                                                                 // shop floor: bib apron over a shirt, name badge
      const bib = look.apron ?? '#2f9b62';
      vee(0.4, 0.3, look.shirt ?? '#fbfaf5');
      for (const s of [-1, 1]) p.stroke([[x + s * 0.34 * Ta, top + 2 * u], [x + s * 0.4 * Ta, chin + 0.34 * HH]], 4 * u, bib);
      p.poly([[x - 0.46 * Ta, chin + 0.32 * HH], [x + 0.46 * Ta, chin + 0.32 * HH], [x + 0.6 * Ta, chin + 0.6 * HH], [x + 0.74 * Ta, torsoBot], [x - 0.74 * Ta, torsoBot], [x - 0.6 * Ta, chin + 0.6 * HH]], bib, 1.8 * u);
      p.poly(rounded(x - 0.34 * Ta, chin + 0.72 * HH, 0.68 * Ta, 0.2 * HH, 2.5 * u), null, 1.4 * u);
      p.poly(rect(x + 0.06 * Ta, chin + 0.4 * HH, 0.32 * Ta, 0.11 * HH), '#fffdf4', 1.2 * u);
      p.stroke([[x + 0.1 * Ta, chin + 0.455 * HH], [x + 0.33 * Ta, chin + 0.455 * HH]], 1.2 * u, '#777');
      break;
    }
    case 'fire': {                                                                                  // turnout coat: storm flap, two reflective bands
      p.stroke([[x + 3 * u, top], [x + 3 * u, torsoBot]], 1.8 * u, '#0f1626');
      for (const yy of [0.5, 0.88]) {
        p.band([[x - 0.93 * Ta, chin + yy * HH], [x + 0.93 * Ta, chin + yy * HH]], '#e9f04a', 7.5 * u, 1.3 * u);
        p.stroke([[x - 0.9 * Ta, chin + yy * HH], [x + 0.9 * Ta, chin + yy * HH]], 2.2 * u, '#e6e9ec');
      }
      for (let i = 0; i < 2; i++) p.poly(rect(x + 5 * u, chin + (0.22 + i * 0.44) * HH, 6 * u, 3.5 * u), '#b9c0c8', 1 * u);
      break;
    }
    case 'lab': {                                                                                   // white coat over scrubs, pens in the pocket
      vee(0.42, 0.5, look.shirt ?? '#7fc4c0');
      for (const s of [-1, 1]) p.stroke([[x + s * 0.42 * Ta, top], [x, chin + 0.5 * HH]], 1.8 * u);
      p.stroke([[x, chin + 0.5 * HH], [x, torsoBot]], 1.5 * u);
      for (let i = 0; i < 2; i++) p.dot(x + 3.2 * u, chin + (0.64 + i * 0.16) * HH, 1.7 * u, '#c9d2d8');
      p.poly(rect(x + 0.28 * Ta, chin + 0.38 * HH, 0.42 * Ta, 0.2 * HH), null, 1.4 * u);
      p.stroke([[x + 0.38 * Ta, chin + 0.3 * HH], [x + 0.38 * Ta, chin + 0.42 * HH]], 2 * u, '#2f5fa8');
      p.stroke([[x + 0.52 * Ta, chin + 0.31 * HH], [x + 0.52 * Ta, chin + 0.42 * HH]], 2 * u, '#d43b3b');
      break;
    }
    case 'polo': {                                                                                  // service technician: polo shirt with a company patch
      const collar = look.shirt ?? '#f3f1ea';
      for (const s of [-1, 1]) p.poly([[x, chin + 0.18 * HH], [x + s * 0.44 * Ta, top], [x + s * 0.54 * Ta, chin + 0.14 * HH], [x + s * 0.14 * Ta, chin + 0.32 * HH]], collar, 1.6 * u);
      p.stroke([[x, chin + 0.22 * HH], [x, chin + 0.52 * HH]], 1.5 * u);
      for (let i = 0; i < 2; i++) p.dot(x, chin + (0.3 + i * 0.12) * HH, 1.4 * u, collar);
      p.poly(rounded(x + 0.26 * Ta, chin + 0.36 * HH, 0.44 * Ta, 0.14 * HH, 2 * u), '#ffd43b', 1.3 * u);
      break;
    }
    case 'hoodie': {
      p.poly([[x - 0.5 * Ta, top], [x + 0.5 * Ta, top], [x + 0.3 * Ta, chin + 0.2 * HH], [x, chin + 0.3 * HH], [x - 0.3 * Ta, chin + 0.2 * HH]], look.shirt ?? '#d9d6cf', 1.8 * u);
      for (const s of [-1, 1]) { p.stroke([[x + s * 5 * u, chin + 0.26 * HH], [x + s * 6 * u, chin + 0.56 * HH]], 1.5 * u, '#f3f1ea'); p.dot(x + s * 6 * u, chin + 0.57 * HH, 1.6 * u, '#f3f1ea'); }
      p.poly(rounded(x - 0.52 * Ta, chin + 0.68 * HH, 1.04 * Ta, 0.22 * HH, 3 * u), null, 1.5 * u);
      break;
    }
    case 'tee':
      p.poly(rounded(x - 0.34 * Ta, chin + 0.34 * HH, 0.68 * Ta, 0.3 * HH, 3 * u), look.shirt ?? '#ffd43b', 1.5 * u);
      break;
    default:
  }
}

// ---------- hair, hats, glasses ----------
function hairMass(p: Pen, h: HeadGeo, col: string) {
  const {cx, hc, a, b, u} = h, pts: P2[] = [];
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
/** A hood with nobody's face in it: a dark opening and two pale eyes. The hackers, whoever they are. */
function cowl(p: Pen, h: HeadGeo, col: string, eyes: 'pale' | 'heart' = 'pale') {
  const {cx, hc, a, b, u} = h, out: P2[] = [];
  for (let i = 0; i <= 28; i++) { const t = Math.PI * (0.92 + 1.16 * (i / 28)); out.push([cx + 1.27 * a * Math.cos(t), hc - 0.02 * b + (1.25 + 0.12 * Math.exp(-((i - 14) ** 2) / 10)) * b * Math.sin(t)]); }   // a little peak on top
  out.push([cx + 1.12 * a, hc + 0.98 * b], [cx + 0.6 * a, hc + 1.22 * b], [cx - 0.6 * a, hc + 1.22 * b], [cx - 1.12 * a, hc + 0.98 * b]);
  p.shadedFill(out, col, '#0d0f15', -2.1, a * 1.3, 0.45); p.poly(out, null, 4.2 * u);
  p.ell(cx, hc + 0.12 * b, 0.82 * a, 0.82 * b, '#07090d', 2.6 * u);
  for (const d of [-1, 1]) {
    const ex = cx + d * 0.34 * a, ey = hc + 0.06 * b;
    if (eyes === 'heart') {
      const pts: P2[] = [], r = 0.012 * a;
      for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push([ex + r * 16 * Math.sin(t) ** 3, ey - r * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
      p.poly(pts, '#ff5a8a', 0);
    } else p.ell(ex, ey, 0.15 * a, 0.2 * b, '#cfe6ff', 0);
  }
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
  if (look.hairdo === 'swept') hairMass(p, h, hair);
  if (look.hairdo === 'long' || look.hairdo === 'bob') {                                           // parted fringe over the forehead
    const top: P2[] = [];
    for (let i = 0; i <= 18; i++) { const t = Math.PI * (1.03 + 0.94 * (i / 18)); top.push([cx + 1.04 * a * Math.cos(t), hc + 1.05 * b * Math.sin(t)]); }
    top.push([cx + 0.98 * a, hc - 0.05 * b], [cx + 0.55 * a, hc - 0.5 * b], [cx + 0.1 * a, hc - 0.66 * b], [cx - 0.5 * a, hc - 0.46 * b], [cx - 0.98 * a, hc - 0.02 * b]);
    p.shadedFill(top, hair, '#15111a', -2.1, a, 0.4); p.poly(top, null, 4.2 * u);
  }
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
  }
  const ex = look.extra;
  if (ex === 'headset') {
    p.arc(cx, hc - 0.1 * b, a * 1.03, b * 1.06, 196, 344, 4.2 * u, '#2b2d38');
    for (const s of [-1, 1]) p.poly(rounded(cx + s * a * 1.0 - 6.5 * u, hc - 9 * u, 13 * u, 21 * u, 4.5 * u), '#2b2d38', 2 * u);
    p.stroke(curve([cx - a * 1.0, hc + 9 * u], [cx - a * 0.85, hc + 26 * u], [cx - 20 * u, hc + 25 * u]), 2.2 * u, '#2b2d38');
    p.dot(cx - 19 * u, hc + 25 * u, 3.2 * u, '#2b2d38');
  } else if (ex === 'helmet') {                                                                     // firefighter: yellow helmet, comb, badge, neck brim
    const col = '#f2c230', yb = hc - b + 34 * u, dome: P2[] = [];
    for (let i = 0; i <= 18; i++) { const t = Math.PI * (1 + i / 18); dome.push([cx + 1.1 * a * Math.cos(t), yb + 0.86 * b * Math.sin(t)]); }
    p.poly(rounded(cx - 1.34 * a, yb - 6 * u, 2.68 * a, 13 * u, 6 * u), col, 3.6 * u);
    p.shadedFill(dome, col, '#c98f12', -2.1, a, 0.4); p.poly(dome, null, 4.2 * u);
    p.poly([[cx - 5 * u, yb - 0.9 * b], [cx + 5 * u, yb - 0.9 * b], [cx + 4 * u, yb - 3 * u], [cx - 4 * u, yb - 3 * u]], '#d94a3a', 1.6 * u);
    p.poly([[cx, yb - 34 * u], [cx + 11 * u, yb - 27 * u], [cx + 8 * u, yb - 12 * u], [cx, yb - 7 * u], [cx - 8 * u, yb - 12 * u], [cx - 11 * u, yb - 27 * u]], '#fffdf4', 1.8 * u);
    p.dot(cx, yb - 20 * u, 3.4 * u, '#d94a3a');
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
    onHead: (pen, h) => { onHead(pen, look, h); if (look.extra === 'cowl') cowl(pen, h, look.outfit.jacket, look.hoodEyes); },
  });
  drawProp(p, d.prop ?? null, hands, unit);
  g.restore();
}

// ---------- the people ----------
const SKIN = ['#ffe2c2', '#c99067', '#f5c9a0', '#8a5a3c', '#ecd0b6'], HAIR = ['#3b271c', '#241c18', '#5c3c24', '#a8643a'];
const suit = (id: string, seed: number, jacket: string, hair: string, skin: string, tie: string, more: Partial<Look> = {}, build: Outfit['build'] = 'adult'): Look => ({
  id, seed, front: 'suit', tie, outfit: {jacket, pants: jacket, boots: '#17171d', hat: 'hair', hair, skin, build, noButtons: true}, ...more,
});
/** the hackers: three hoods, no faces */
export const HACKER = (v = 0, eyes: Look['hoodEyes'] = 'pale'): Look => ({id: 'hacker' + v + eyes, seed: 7 + v * 3, front: 'hoodie', shirt: '#0a0c11', extra: 'cowl', hoodEyes: eyes,
  outfit: {jacket: ['#343a4a', '#2a2f3c', '#3a3644'][v % 3], pants: '#1b1d25', boots: '#111217', hat: null, skin: '#07090d', build: v % 3 === 1 ? 'stout' : 'adult', noButtons: true}});
/** shop staff: apron, sometimes a cap */
export const WORKER = (v = 0): Look => ({id: 'worker' + v, seed: 31 + v, front: 'apron', apron: ['#2f9b62', '#2f9b62', '#e0603a'][v % 3], shirt: '#fbfaf5',
  eyewear: v % 3 === 1 ? 'round' : undefined, hairdo: v % 2 ? 'bob' : undefined, hairColor: HAIR[(v + 1) % 4],
  outfit: {jacket: '#f3f1ea', pants: '#3b4a66', boots: '#2b2d38', hat: v % 2 ? null : 'cap', cap: '#2f9b62', hair: HAIR[v % 4], skin: SKIN[v % 5], build: v % 3 === 2 ? 'stout' : 'adult', noButtons: true}});
/** shoppers, students and passers-by */
export const SHOPPER = (v = 0): Look => ({id: 'shopper' + v, seed: 101 + v, front: v % 2 ? 'tee' : 'hoodie', shirt: ['#ff7ac8', '#ffd43b', '#7af0e0', '#f3f1ea', '#ff9a3c'][v % 5],
  eyewear: v % 4 === 3 ? 'round' : undefined, hairdo: v % 3 === 2 ? 'bob' : undefined, hairColor: HAIR[v % 3],
  outfit: {jacket: ['#7a4fd0', '#2f8fd0', '#d0507a', '#3f9b6a', '#d08a2f'][v % 5], pants: ['#323744', '#3b4a66'][v % 2], boots: '#f3efe6', hat: v % 3 === 2 ? null : v % 3 === 0 ? 'cap' : 'hair', cap: ['#d0507a', '#2f8fd0'][v % 2],
    hair: HAIR[v % 4], skin: SKIN[(v + 2) % 5], build: v % 4 === 1 ? 'stout' : 'adult', noButtons: true}});
export const FIREFIGHTER: Look = {id: 'fire', seed: 44, front: 'fire', extra: 'helmet',
  outfit: {jacket: '#2a3350', pants: '#2a3350', boots: '#15161b', hat: null, skin: '#f5c9a0', build: 'stout', noButtons: true}};
/** refrigeration technician: polo, cap, headset */
export const TECH: Look = {id: 'tech', seed: 52, front: 'polo', extra: 'headset',
  outfit: {jacket: '#2f6fa8', pants: '#323744', boots: '#2f2420', hat: 'cap', cap: '#ffd43b', skin: '#c99067', build: 'adult', noButtons: true}};
export const LABTECH: Look = {id: 'lab', seed: 63, front: 'lab', eyewear: 'round', hairdo: 'bob', hairColor: '#5c3c24',
  outfit: {jacket: '#f4f6f8', pants: '#7fc4c0', boots: '#f3efe6', hat: null, skin: '#ecd0b6', build: 'adult', noButtons: true}};
/** investigators: plain suits */
export const INVESTIGATOR = (v = 0): Look => suit('inv' + v, 111 + v, ['#5b6478', '#6e5a4a'][v % 2], HAIR[(v + 1) % 4], SKIN[(v * 2) % 5], ['#8a2f3d', '#2f5fa8'][v % 2], v % 2 ? {} : {eyewear: 'rect'});
/** a lecturer; nobody in particular */
export const PROF: Look = {id: 'prof', seed: 77, front: 'suit', tie: 'none', shirt: '#fbfaf5', eyewear: 'rect', hairdo: 'long', hairColor: '#3b271c',
  outfit: {jacket: '#7a4a6a', pants: '#3b3f4d', boots: '#17171d', hat: null, skin: '#f5c9a0', build: 'adult', noButtons: true}};
/** The two foreign ministries. Nobody in particular: a suit and a lectern each, drawn alike. */
export const SPOKES_PARIS: Look = suit('paris', 21, '#27355e', '#5c3c24', '#f5c9a0', '#b8323a');
export const SPOKES_TEHRAN: Look = suit('tehran', 22, '#33363f', '#2b2d38', '#ecd0b6', 'none');

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
  const blinks = look.extra !== 'cowl';
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
