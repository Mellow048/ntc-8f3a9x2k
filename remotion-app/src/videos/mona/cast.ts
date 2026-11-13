// The cast of the Mona Lisa short (Paris 1911, Florence 1913, and one room of tourists today). Everyone is built on the
// shared flat cartoon construction (pendulum/toon.ts): the same big head and deadpan face; a person is told apart by
// costume. Nobody is a likeness. Vincenzo Peruggia is a short man with a moustache and a flat cap; Picasso, Napoleon and
// Leonardo are costumes (a black fringe and a cubist canvas, a bicorne, a long white beard).
import * as THREE from 'three';
import {Pen, bodyFront, bodySide, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'both' | 'think' | 'wave' | 'reach' | 'heart' | 'tip' | 'under' | 'low' | 'write' | 'cuffed' | 'phone' | 'lift';
export type Prop = 'bundle' | 'screwdriver' | 'knob' | 'pliers' | 'bag' | 'palette' | 'notebook' | 'book' | 'flag' | 'phone' | 'cane' | 'boxcam' | 'paper' | 'hat' | null;
export type Front = 'smock' | 'vest' | 'overalls' | 'uniform' | 'suit' | 'coat' | 'napoleon' | 'cara' | 'tee' | 'stripes' | 'robe' | 'royal' | 'dress';
export type Hat = 'kepi' | 'bowler' | 'beret' | 'bicorne' | 'bighat' | 'leo' | 'royal' | 'boater' | null;
export type Look = {
  id: string; outfit: Outfit; seed: number; front?: Front;
  /** a hat drawn here (toon.ts has its own cap, top hat and bonnet in `outfit.hat`) */
  hat?: Hat; hatColor?: string; plume?: string;
  hairColor?: string; hairdo?: 'swept' | 'long' | 'bob' | 'fringe' | 'sides';
  beard?: 'goatee' | 'full' | 'long'; beardColor?: string;
  eyewear?: 'round' | 'pince' | 'monocle';
  shirt?: string; tie?: string; trim?: string;
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march' | 'side' | 'sidestand'; phase?: number;
  /** turned a little to one side */ facing?: -1 | 0 | 1;
  /** seen from behind: no face */ back?: boolean};

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
const ellipse = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, n = 28): P2[] => Array.from({length: n + 1}, (_, i) => { const t = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as P2; });

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
    case 'both': both((s) => A(s, 1.2 * Ta + 4 * u, 0.46, 0.4 * Ta, 0.38, true)); break;
    case 'think': hang(-1); A(1, 1.22 * Ta, 0.52, 0.3 * Ta, 0.02, true); break;
    case 'wave': hang(-1); A(1, 1.2 * Ta + 14 * u, 0.04, 1.36 * Ta + 24 * u, -0.66); break;
    case 'reach': both((s) => A(s, 1.2 * Ta + 12 * u, -0.26, 1.02 * Ta + 10 * u, -1.0)); break;                // both hands up: taking something off a wall
    case 'lift': both((s) => A(s, 1.3 * Ta + 14 * u, 0.1, 1.32 * Ta + 18 * u, -0.34)); break;                 // holding something wide at chest height
    case 'heart': hang(-1); A(1, 1.2 * Ta + 6 * u, 0.42, 0.16 * Ta, 0.3, true); break;                        // a hand on the heart
    case 'tip': hang(-1); A(1, 1.26 * Ta + 12 * u, -0.04, 0.86 * Ta, -0.6); break;                            // a finger to the cap
    case 'under': hang(-1); A(1, 1.3 * Ta + 9 * u, 0.36, 1.0 * Ta, 0.66, true); break;                        // something tucked under the arm
    case 'low': hang(-1); A(1, 1.2 * Ta + 12 * u, 0.34, 1.5 * Ta + 30 * u, 0.4); break;                       // working on something at waist height
    case 'write': A(-1, 1.16 * Ta, 0.5, 0.42 * Ta, 0.5, true); A(1, 1.16 * Ta + 2 * u, 0.46, 0.1 * Ta, 0.36, true); break;
    case 'cuffed': both((s) => A(s, 1.1 * Ta + 2 * u, 0.5, 0.12 * Ta, 0.8, true)); break;                     // wrists together in front
    case 'phone': hang(-1); A(1, 1.2 * Ta + 8 * u, -0.2, 0.9 * Ta + 8 * u, -0.86); break;                     // a telephone held up over the heads
    default: both(hang);
  }
  return out;
}

// ---------- things held ----------
function drawProp(p: Pen, d: Draw, hands: P2[], u: number, look: Look) {
  const g = p.g, R = hands[1] ?? [430, 600], L = hands[0] ?? [170, 600], prop = d.prop ?? null, fist = (h: P2 = R) => p.dot(h[0], h[1], 5.5 * u);
  if (!prop) return;
  if (prop === 'bundle') {                                                                          // a flat thing wrapped in white cloth, under the arm
    const [x, y] = [R[0] + 30 * u, R[1] - 26 * u];
    p.rot = [0.08, x, y]; p.poly(rounded(x - 40 * u, y - 56 * u, 80 * u, 112 * u, 6 * u), '#fbf8ee', 2.6 * u);
    for (const [a, b, c, dd] of [[-40, -18, 40, -30], [-40, 14, 40, 4], [-12, -56, -4, 56]]) p.stroke([[x + a * u, y + b * u], [x + c * u, y + dd * u]], 1.6 * u, '#b9b3a2');
    p.rot = null; p.stroke([[R[0] - 14 * u, R[1] - 4 * u], [R[0], R[1]]], 5.2 * u, '#15121c'); p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'screwdriver') {
    const [x, y] = R; p.band([[x - 2 * u, y + 2 * u], [x + 26 * u, y - 3 * u]], '#c9ced6', 2.6 * u, 1 * u, 'round'); p.band([[x - 14 * u, y + 4 * u], [x + 2 * u, y + 1 * u]], '#c8642c', 6.5 * u, 1.4 * u, 'round'); fist();
  } else if (prop === 'knob') {                                                                     // a brass doorknob, held up and looked at
    const [x, y] = [R[0] + 2 * u, R[1] - 10 * u]; p.poly(rect(x - 3.5 * u, y + 2 * u, 7 * u, 12 * u), '#b98a2c', 1.6 * u); p.ell(x, y, 10 * u, 10 * u, '#e7c04a', 2 * u); p.arc(x - 2 * u, y - 2 * u, 5 * u, 5 * u, 190, 280, 1.8 * u, '#fff6c9'); fist([R[0], R[1] + 6 * u]);
  } else if (prop === 'pliers') {
    const [x, y] = R;
    for (const s of [-1, 1]) { p.band([[x, y], [x + s * 5 * u, y + 20 * u]], '#b8232f', 4.4 * u, 1.3 * u, 'round'); p.band([[x, y], [x + s * 3.4 * u, y - 15 * u]], '#9aa3ad', 3.6 * u, 1.2 * u, 'round'); }
    p.dot(x, y, 3 * u, '#5a6068'); fist([x, y + 12 * u]);
  } else if (prop === 'bag') {                                                                      // a plumber's tool bag in the left hand, a wrench sticking out
    const [x, y] = [L[0] - 2 * u, L[1] + 24 * u];
    p.band([[x + 13 * u, y - 30 * u], [x + 19 * u, y - 8 * u]], '#9aa3ad', 5 * u, 1.4 * u, 'round'); p.ell(x + 12 * u, y - 33 * u, 6 * u, 6 * u, '#9aa3ad', 1.6 * u);
    p.arc(x, y - 16 * u, 15 * u, 13 * u, 180, 360, 3 * u, '#4a3018'); p.poly(rounded(x - 24 * u, y - 16 * u, 48 * u, 30 * u, 5 * u), '#8a5a2c', 2.4 * u); p.stroke([[x - 24 * u, y - 8 * u], [x + 24 * u, y - 8 * u]], 1.6 * u, '#4a3018'); p.dot(x, y - 8 * u, 2.8 * u, '#e7c04a'); fist(L);
  } else if (prop === 'palette') {                                                                  // a palette in the left hand, a brush in the right
    const [x, y] = [L[0] - 6 * u, L[1] - 6 * u];
    p.rot = [-0.2, x, y]; p.ell(x, y, 27 * u, 19 * u, '#c99a5a', 2.2 * u); p.ell(x + 12 * u, y + 5 * u, 5 * u, 4 * u, '#f4e6cf', 1.4 * u);
    ['#d63a2f', '#2f6fd6', '#f2c230', '#3f9a55', '#fffdf4'].forEach((c, i) => p.dot(x - 16 * u + i * 7.4 * u, y - 8 * u + Math.abs(i - 2) * 2.4 * u, 3.4 * u, c)); p.rot = null; fist(L);
    p.band([[R[0] - 2 * u, R[1] + 6 * u], [R[0] + 9 * u, R[1] - 30 * u]], '#8a5a2c', 3 * u, 1.1 * u, 'round'); p.band([[R[0] + 9 * u, R[1] - 30 * u], [R[0] + 12 * u, R[1] - 40 * u]], '#2f6fd6', 4.2 * u, 1.1 * u, 'round'); fist();
  } else if (prop === 'notebook') {                                                                 // a detective's notebook and a pencil
    const [x, y] = [L[0] + 2 * u, L[1] - 10 * u];
    p.rot = [-0.12, x, y]; p.poly(rect(x - 14 * u, y - 18 * u, 28 * u, 36 * u), '#fffdf4', 2.2 * u); for (let i = 0; i < 5; i++) p.stroke([[x - 9 * u, y - 10 * u + i * 6 * u], [x + 9 * u, y - 10 * u + i * 6 * u]], 1.3 * u, '#8f8a96');
    p.poly(rect(x - 14 * u, y - 22 * u, 28 * u, 6 * u), '#3a3f4a', 1.6 * u); p.rot = null; fist(L);
    p.band([[R[0] + 4 * u, R[1] - 14 * u], [R[0] - 4 * u, R[1] + 6 * u]], '#f2c230', 3 * u, 1 * u, 'round'); fist();
  } else if (prop === 'book') {                                                                     // a slim book of verse
    const [x, y] = [R[0] + 4 * u, R[1] - 16 * u]; p.rot = [0.14, x, y]; p.poly(rect(x - 15 * u, y - 20 * u, 30 * u, 40 * u), '#7a2f4a', 2.2 * u); p.poly(rect(x - 9 * u, y - 12 * u, 18 * u, 9 * u), '#f4e6cf', 1.2 * u); p.stroke([[x - 11 * u, y - 20 * u], [x - 11 * u, y + 20 * u]], 1.6 * u, '#4a1a2a'); p.rot = null; fist();
  } else if (prop === 'flag') {                                                                     // a small Italian tricolour on a stick
    const [x, y] = R; p.band([[x, y + 8 * u], [x + 4 * u, y - 62 * u]], '#8a6a3a', 2.8 * u, 1 * u, 'round');
    ['#2f9a55', '#fffdf4', '#d63a2f'].forEach((c, i) => p.poly(rect(x + 5 * u + i * 13 * u, y - 62 * u, 13 * u, 26 * u), c, 0)); p.poly(rect(x + 5 * u, y - 62 * u, 39 * u, 26 * u), null, 2 * u); fist();
  } else if (prop === 'phone') {                                                                    // a telephone held up to take a picture
    const [x, y] = [R[0], R[1] - 12 * u]; p.poly(rounded(x - 9 * u, y - 16 * u, 18 * u, 32 * u, 3 * u), '#20222a', 2 * u); p.poly(rect(x - 6.5 * u, y - 12 * u, 13 * u, 22 * u), '#bfe3ff', 0); fist([R[0], R[1] + 6 * u]);
  } else if (prop === 'cane') {
    const [x, y] = R; p.band([[x, y - 4 * u], [x + 6 * u, y + 96 * u]], '#3a2a20', 3.2 * u, 1 * u, 'round'); p.dot(x, y - 4 * u, 5 * u, '#e7c04a'); fist();
  } else if (prop === 'boxcam') {                                                                   // a press camera held in both hands, its flash pan up
    const x = (L[0] + R[0]) / 2, y = Math.min(L[1], R[1]) - 6 * u;
    p.poly(rect(x - 22 * u, y - 18 * u, 44 * u, 34 * u), '#4a3628', 2.4 * u); p.ell(x, y - 1 * u, 10 * u, 10 * u, '#20222a', 2 * u); p.ell(x, y - 1 * u, 5 * u, 5 * u, '#9fd8ff', 0);
    p.band([[x + 24 * u, y - 8 * u], [x + 34 * u, y - 40 * u]], '#9aa3ad', 2.6 * u, 1 * u, 'round'); p.poly([[x + 22 * u, y - 46 * u], [x + 46 * u, y - 46 * u], [x + 41 * u, y - 38 * u], [x + 27 * u, y - 38 * u]], '#c9ced6', 1.8 * u); fist(L); fist(R);
  } else if (prop === 'paper') {
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u]; p.rot = [0.18, x, y]; p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    for (let i = 0; i < 6; i++) p.stroke([[x - 12 * u, y - 14 * u + i * 6 * u], [x + (i === 5 ? 2 : 12) * u, y - 14 * u + i * 6 * u]], 1.5 * u, '#8f8a96'); p.rot = null; fist();
  } else if (prop === 'hat') {                                                                      // his own hat, taken off and held to the chest
    const [x, y] = [R[0] - 2 * u, R[1] + 2 * u], c = look.hatColor ?? '#2e2a36'; p.ell(x, y - 10 * u, 17 * u, 14 * u, c, 2.2 * u, 180, 360); p.ell(x, y - 9 * u, 27 * u, 5 * u, c, 2.2 * u); fist([R[0], R[1] + 4 * u]);
  }
  void g;
}

// ---------- torso fronts ----------
function torsoFront(p: Pen, look: Look, g: FrontGeo) {
  const {tcx: x, Ta, chin, HH, u, torsoBot} = g, top = chin - 0.1 * HH, shirt = look.shirt ?? '#fbfaf5';
  const vee = (w: number, depth: number, fill: string) => p.poly([[x - w * Ta, top], [x + w * Ta, top], [x, chin + depth * HH]], fill, 1.8 * u);
  const tie = (col: string, bow = false) => {
    if (bow) { for (const s of [-1, 1]) p.poly([[x, chin + 0.1 * HH], [x + s * 11 * u, chin + 0.03 * HH], [x + s * 11 * u, chin + 0.19 * HH]], col, 1.5 * u); p.dot(x, chin + 0.11 * HH, 3 * u, col); return; }
    const end = chin + 0.5 * HH;
    p.poly([[x - 5 * u, top + 4 * u], [x + 5 * u, top + 4 * u], [x + 3.4 * u, chin + 0.08 * HH], [x - 3.4 * u, chin + 0.08 * HH]], col, 1.5 * u);
    p.poly([[x - 3.4 * u, chin + 0.08 * HH], [x + 3.4 * u, chin + 0.08 * HH], [x + 6.5 * u, end - 6 * u], [x, end], [x - 6.5 * u, end - 6 * u]], col, 1.5 * u);
  };
  switch (look.front) {
    case 'smock': {                                                                                 // a workman's white smock: a soft collar, one row of buttons, two pockets
      for (const s of [-1, 1]) p.poly([[x, chin + 0.16 * HH], [x + s * 0.42 * Ta, top], [x + s * 0.56 * Ta, chin + 0.13 * HH], [x + s * 0.16 * Ta, chin + 0.3 * HH]], '#ffffff', 1.6 * u);
      p.stroke([[x, chin + 0.2 * HH], [x, torsoBot]], 1.5 * u, '#b9b3a2');
      for (let i = 0; i < 4; i++) p.dot(x + 3.4 * u, chin + (0.32 + i * 0.17) * HH, 2 * u, '#b9b3a2');
      for (const s of [-1, 1]) p.poly(rect(x + s * 0.5 * Ta - 0.17 * Ta, chin + 0.62 * HH, 0.34 * Ta, 0.2 * HH), null, 1.3 * u);
      break;
    }
    case 'vest': {                                                                                  // shirt sleeves and a waistcoat
      vee(0.44, 0.5, shirt);
      if (look.tie && look.tie !== 'none') tie(look.tie, look.tie === 'bow');
      for (const s of [-1, 1]) p.stroke([[x + s * 0.44 * Ta, top], [x, chin + 0.5 * HH]], 1.8 * u);
      p.stroke([[x, chin + 0.5 * HH], [x, torsoBot]], 1.5 * u);
      for (let i = 0; i < 3; i++) p.dot(x + 3 * u, chin + (0.58 + i * 0.14) * HH, 2 * u, '#e7c56a');
      break;
    }
    case 'overalls': {                                                                              // a bib and two straps over a work shirt
      const bib = look.trim ?? '#3f6aa8';
      for (const s of [-1, 1]) p.band([[x + s * 0.5 * Ta, top], [x + s * 0.34 * Ta, chin + 0.42 * HH]], bib, 6 * u, 1.4 * u);
      p.poly([[x - 0.5 * Ta, chin + 0.36 * HH], [x + 0.5 * Ta, chin + 0.36 * HH], [x + 0.9 * Ta, torsoBot + 4 * u], [x - 0.9 * Ta, torsoBot + 4 * u]], bib, 1.8 * u);
      p.poly(rect(x - 0.22 * Ta, chin + 0.5 * HH, 0.44 * Ta, 0.2 * HH), null, 1.4 * u);
      for (const s of [-1, 1]) p.dot(x + s * 0.36 * Ta, chin + 0.42 * HH, 2.6 * u, '#e7c04a');
      break;
    }
    case 'uniform': {                                                                               // a museum guard or a policeman: a stand collar, a belt
      p.poly(rect(x - 0.3 * Ta, top - 2 * u, 0.6 * Ta, 0.12 * HH), look.trim ?? '#b8232f', 1.5 * u);
      p.poly(rect(x - 1.0 * Ta, chin + 0.72 * HH, 2 * Ta, 0.1 * HH), '#15121c', 1.4 * u); p.poly(rect(x - 0.12 * Ta, chin + 0.7 * HH, 0.24 * Ta, 0.14 * HH), '#e7c04a', 1.3 * u);
      break;
    }
    case 'suit': {
      vee(0.46, 0.56, shirt);
      if (look.tie && look.tie !== 'none') tie(look.tie, look.tie === 'bow'); else p.stroke([[x - 0.2 * Ta, top + 2 * u], [x, chin + 0.2 * HH], [x + 0.2 * Ta, top + 2 * u]], 1.6 * u);
      for (const s of [-1, 1]) { p.stroke([[x + s * 0.46 * Ta, top], [x + s * 0.2 * Ta, chin + 0.32 * HH], [x, chin + 0.56 * HH]], 1.8 * u); p.stroke([[x + s * 0.72 * Ta, chin + 0.1 * HH], [x + s * 0.2 * Ta, chin + 0.32 * HH]], 1.5 * u); }
      p.stroke([[x, chin + 0.56 * HH], [x, torsoBot]], 1.5 * u);
      break;
    }
    case 'coat': {                                                                                  // an overcoat: wide lapels, two rows of buttons
      vee(0.5, 0.48, shirt);
      if (look.tie && look.tie !== 'none') tie(look.tie);
      for (const s of [-1, 1]) p.poly([[x + s * 0.5 * Ta, top], [x + s * 0.9 * Ta, chin + 0.14 * HH], [x + s * 0.24 * Ta, chin + 0.4 * HH], [x, chin + 0.48 * HH]], look.outfit.jacket, 1.7 * u);
      p.stroke([[x, chin + 0.48 * HH], [x, torsoBot]], 1.5 * u);
      for (const s of [-1, 1]) for (const yy of [0.6, 0.86]) p.dot(x + s * 0.3 * Ta, chin + yy * HH, 2.2 * u, '#2a2018');
      break;
    }
    case 'napoleon': {                                                                              // a green coat, white breast, red collar, gold epaulettes, a hand in the waistcoat
      p.poly([[x - 0.42 * Ta, top], [x + 0.42 * Ta, top], [x + 0.34 * Ta, torsoBot], [x - 0.34 * Ta, torsoBot]], '#fbfaf5', 1.8 * u);
      p.poly(rect(x - 0.34 * Ta, top - 2 * u, 0.68 * Ta, 0.12 * HH), '#c0353a', 1.5 * u);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) p.dot(x + s * 0.22 * Ta, chin + (0.26 + i * 0.16) * HH, 2 * u, '#e7c04a');
      for (const s of [-1, 1]) { p.poly(rounded(x + s * 0.95 * Ta - 9 * u, top + 1 * u, 18 * u, 8 * u, 3 * u), '#e7c04a', 1.5 * u); for (let i = -1; i <= 1; i++) p.stroke([[x + s * 0.95 * Ta + i * 5 * u, top + 9 * u], [x + s * 0.95 * Ta + i * 5 * u, top + 15 * u]], 1.6 * u, '#e7c04a'); }
      break;
    }
    case 'cara': {                                                                                  // a carabiniere: dark blue, red piping, a white cross belt
      p.poly(rect(x - 0.3 * Ta, top - 2 * u, 0.6 * Ta, 0.12 * HH), '#c0353a', 1.5 * u);
      p.band([[x - 0.9 * Ta, top + 2 * u], [x + 0.8 * Ta, torsoBot]], '#fbfaf5', 6.4 * u, 1.5 * u);
      for (let i = 0; i < 4; i++) p.dot(x + 2 * u, chin + (0.26 + i * 0.16) * HH, 2 * u, '#d9dde0');
      for (const s of [-1, 1]) p.poly(rounded(x + s * 0.95 * Ta - 8 * u, top + 1 * u, 16 * u, 7 * u, 3 * u), '#c0353a', 1.4 * u);
      break;
    }
    case 'tee': {
      p.poly([[x - 0.34 * Ta, top], [x + 0.34 * Ta, top], [x, chin + 0.2 * HH]], look.outfit.skin ?? '#ffe2c2', 1.6 * u);
      p.poly([[x, chin + 0.36 * HH], [x + 0.24 * Ta, chin + 0.52 * HH], [x, chin + 0.68 * HH], [x - 0.24 * Ta, chin + 0.52 * HH]], shirt, 1.5 * u);
      break;
    }
    case 'stripes': {                                                                               // prison cloth
      for (let i = 0; i < 9; i++) p.poly(rect(x - 1.3 * Ta, chin + (0.02 + i * 0.13) * HH, 2.6 * Ta, 0.06 * HH), '#4a4d5a', 0);
      break;
    }
    case 'robe': {                                                                                  // a long gown with a fur edge down the front
      p.poly([[x - 0.3 * Ta, top], [x + 0.3 * Ta, top], [x + 0.2 * Ta, torsoBot + 1.2 * HH], [x - 0.2 * Ta, torsoBot + 1.2 * HH]], look.trim ?? '#7a5a3a', 1.6 * u);
      break;
    }
    case 'royal': {                                                                                 // a king's doublet: a slashed front, a gold chain, an ermine collar
      p.poly([[x - 0.9 * Ta, top], [x + 0.9 * Ta, top], [x + 0.6 * Ta, chin + 0.24 * HH], [x - 0.6 * Ta, chin + 0.24 * HH]], '#fbfaf5', 1.6 * u);
      for (let i = -2; i <= 2; i++) p.dot(x + i * 0.3 * Ta, chin + 0.1 * HH, 1.8 * u, '#15121c');
      p.arc(x, chin + 0.2 * HH, 0.55 * Ta, 0.34 * HH, 20, 160, 3 * u, '#e7c04a'); p.dot(x, chin + 0.56 * HH, 4.4 * u, '#e7c04a');
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.stroke([[x + s * (0.3 + i * 0.22) * Ta, chin + 0.62 * HH], [x + s * (0.3 + i * 0.22) * Ta, torsoBot]], 2.4 * u, '#f2c230');
      break;
    }
    case 'dress': {                                                                                 // a lady of 1911: a high lace collar and a brooch
      p.poly(rect(x - 0.3 * Ta, top - 2 * u, 0.6 * Ta, 0.14 * HH), '#fbfaf5', 1.5 * u); p.dot(x, chin + 0.2 * HH, 3.6 * u, look.trim ?? '#e7c04a');
      p.arc(x, chin + 0.06 * HH, 0.7 * Ta, 0.5 * HH, 30, 150, 1.6 * u, '#00000033');
      break;
    }
    default:
  }
}

// ---------- hair, beards, hats ----------
function behindHead(p: Pen, look: Look, h: HeadGeo, d: Draw) {
  const {cx, hc, a, b, u} = h, col = look.hairColor ?? '#2b2330';
  if (look.hairdo === 'long' || look.hairdo === 'bob') {
    const len = look.hairdo === 'long' ? 1.62 : 1.02, pts: P2[] = [];
    for (let i = 0; i <= 20; i++) { const t = Math.PI * (1 + i / 20); pts.push([cx + 1.14 * a * Math.cos(t), hc + 1.1 * b * Math.sin(t)]); }
    pts.push([cx + 1.2 * a, hc + len * b * 0.6], [cx + 1.1 * a, hc + len * b], [cx + 0.8 * a, hc + len * b * 1.03], [cx + 0.62 * a, hc + len * b * 0.9], [cx + 0.56 * a, hc + 0.7 * b],
      [cx - 0.56 * a, hc + 0.7 * b], [cx - 0.62 * a, hc + len * b * 0.9], [cx - 0.8 * a, hc + len * b * 1.03], [cx - 1.1 * a, hc + len * b], [cx - 1.2 * a, hc + len * b * 0.6]);
    p.shadedFill(pts, col, '#15111a', -2.1, a * 1.2, 0.4); p.poly(pts, null, 4.6 * u);
  }
  if (look.hat === 'bighat') { p.ell(cx, hc - 0.72 * b, 1.7 * a, 0.36 * b, look.hatColor ?? '#7a4a6a', 4 * u); }                 // the back of a very wide brim
  if (look.hat === 'bicorne' && !d.back) { /* drawn on the head */ }
}
function onHead(p: Pen, look: Look, h: HeadGeo, d: Draw) {
  const {cx, hc, a, b, u} = h, g = p.g, hair = look.hairColor ?? '#2b2330', hat = look.hat ?? null, hc2 = look.hatColor ?? '#2e2a36', skin = look.outfit.skin ?? '#ffe2c2';
  const headPts = ellipse(cx, hc, 1.0 * a, 1.0 * b);
  if (d.back) {                                                                                     // from behind: hair where the face was, the nape left bare, two ears
    const hatted = !!hat || !!look.outfit.hat, bald = look.hairdo === 'sides' && !hatted, from = hatted ? hc - 0.46 * b : bald ? hc - 0.02 * b : hc - 1.2 * b;
    p.clip(ellipse(cx, hc, 0.99 * a, 0.99 * b), () => {
      if (bald) p.poly(rect(cx - 1.2 * a, hc - 1.2 * b, 2.4 * a, 1.2 * b), skin, 0);
      p.poly(rect(cx - 1.2 * a, from, 2.4 * a, hc + 0.46 * b - from), hair, 0); p.poly(rect(cx - 1.2 * a, hc + 0.46 * b, 2.4 * a, 0.8 * b), skin, 0);
      p.stroke([[cx - 0.9 * a, hc + 0.46 * b], [cx + 0.9 * a, hc + 0.46 * b]], 2 * u, '#00000030');
      if (look.outfit.hat === 'cap') p.stroke([[cx - 1.0 * a, hc - 0.46 * b], [cx + 1.0 * a, hc - 0.46 * b]], 3.4 * u, '#15121c');
    });
    for (const s of [-1, 1]) p.ell(cx + s * 1.0 * a, hc + 0.12 * b, 6 * u, 9 * u, skin, 2.6 * u);
  } else {
    if (look.hairdo === 'swept' || look.hairdo === 'fringe') {                                      // a full head of hair; 'fringe' falls over the forehead to one side
      const pts: P2[] = [];
      for (let i = 0; i <= 26; i++) { const s = i / 26, t = Math.PI * (1.0 + s), lift = 1.1 + 0.1 * Math.sin(Math.PI * s) + 0.035 * Math.sin(s * 19); pts.push([cx + (1.07 + 0.02 * Math.sin(s * 23)) * a * Math.cos(t), hc + lift * b * Math.sin(t) - 0.02 * b]); }
      const line: P2[] = look.hairdo === 'fringe'
        ? [[1.0, 0.12], [0.93, -0.2], [0.7, -0.3], [0.36, -0.2], [0.02, -0.06], [-0.3, -0.34], [-0.62, -0.52], [-0.86, -0.36], [-0.95, -0.1], [-1.0, 0.12]]
        : [[1.0, 0.12], [0.93, -0.2], [0.74, -0.44], [0.4, -0.6], [0, -0.66], [-0.36, -0.62], [-0.56, -0.5], [-0.62, -0.66], [-0.86, -0.36], [-0.95, -0.1], [-1.0, 0.12]];
      for (const [x, y] of line) pts.push([cx + x * a, hc + y * b]);
      p.shadedFill(pts, hair, '#15111a', -2.1, a * 1.1, 0.4); p.poly(pts, null, 4.4 * u);
    }
    if (look.hairdo === 'long' || look.hairdo === 'bob') {
      const top: P2[] = [];
      for (let i = 0; i <= 18; i++) { const t = Math.PI * (1.03 + 0.94 * (i / 18)); top.push([cx + 1.04 * a * Math.cos(t), hc + 1.05 * b * Math.sin(t)]); }
      top.push([cx + 0.98 * a, hc - 0.05 * b], [cx + 0.55 * a, hc - 0.5 * b], [cx + 0.1 * a, hc - 0.66 * b], [cx - 0.5 * a, hc - 0.46 * b], [cx - 0.98 * a, hc - 0.02 * b]);
      p.shadedFill(top, hair, '#15111a', -2.1, a, 0.4); p.poly(top, null, 4.2 * u);
    }
    if (look.hairdo === 'sides') for (const s of [-1, 1]) p.poly([[cx + s * 1.02 * a, hc - 0.2 * b], [cx + s * 0.82 * a, hc - 0.46 * b], [cx + s * 0.8 * a, hc + 0.1 * b], [cx + s * 1.0 * a, hc + 0.3 * b]], hair, 3 * u);   // hair at the temples under a hat
    // beards: under the nose line, over the jaw
    const bc = look.beardColor ?? hair;
    if (look.beard === 'goatee') p.poly([[cx - 0.22 * a, hc + 0.62 * b], [cx + 0.22 * a, hc + 0.62 * b], [cx + 0.12 * a, hc + 1.12 * b], [cx, hc + 1.28 * b], [cx - 0.12 * a, hc + 1.12 * b]], bc, 3 * u);
    if (look.beard === 'full') { const pts = [...ellipse(cx, hc + 0.36 * b, 0.94 * a, 0.86 * b, 12, 168, 20)]; pts.push([cx - 0.5 * a, hc + 0.42 * b], [cx - 0.2 * a, hc + 0.62 * b], [cx + 0.2 * a, hc + 0.62 * b], [cx + 0.5 * a, hc + 0.42 * b]); p.poly(pts, bc, 3.4 * u); }
    if (look.beard === 'long') { const pts: P2[] = [[cx - 0.96 * a, hc + 0.3 * b], [cx - 0.5 * a, hc + 0.44 * b], [cx - 0.2 * a, hc + 0.62 * b], [cx + 0.2 * a, hc + 0.62 * b], [cx + 0.5 * a, hc + 0.44 * b], [cx + 0.96 * a, hc + 0.3 * b], [cx + 0.8 * a, hc + 1.3 * b], [cx + 0.36 * a, hc + 2.0 * b], [cx, hc + 2.25 * b], [cx - 0.36 * a, hc + 2.0 * b], [cx - 0.8 * a, hc + 1.3 * b]]; p.poly(pts, bc, 3.4 * u); for (const s of [-0.3, 0.1, 0.4]) p.stroke([[cx + s * a, hc + 0.9 * b], [cx + s * 0.8 * a, hc + 1.7 * b]], 1.5 * u, '#b9b4a8'); }
    // eyewear
    if (look.eyewear === 'round' || look.eyewear === 'pince') {
      for (const s of [-1, 1]) { const shape = rounded(cx + s * 13.4 * u - 10.5 * u, hc - 10 * u, 21 * u, 20 * u, 9.5 * u); g.globalAlpha = 0.2; p.poly(shape, '#ffffff', 0); g.globalAlpha = 1; g.lineJoin = 'round'; p.path(shape, true); g.lineWidth = 2.6 * u; g.strokeStyle = '#1b1b22'; g.stroke(); if (look.eyewear === 'round') p.stroke([[cx + s * 25 * u, hc - 4 * u], [cx + s * (a / u - 2) * u, hc - 6 * u]], 2.2 * u, '#1b1b22'); }
      p.stroke([[cx - 2.6 * u, hc - 4 * u], [cx + 2.6 * u, hc - 4 * u]], 2.4 * u, '#1b1b22');
      if (look.eyewear === 'pince') p.stroke(curve([cx + 24 * u, hc + 6 * u], [cx + 40 * u, hc + 30 * u], [cx + 30 * u, hc + 70 * u]), 1.4 * u, '#1b1b22');
    }
    if (look.eyewear === 'monocle') { const shape = rounded(cx + 13.4 * u - 11 * u, hc - 10.5 * u, 22 * u, 21 * u, 10 * u); g.globalAlpha = 0.25; p.poly(shape, '#ffffff', 0); g.globalAlpha = 1; p.path(shape, true); g.lineWidth = 2.6 * u; g.strokeStyle = '#b98a2c'; g.stroke(); p.stroke(curve([cx + 24 * u, hc + 6 * u], [cx + 44 * u, hc + 40 * u], [cx + 30 * u, hc + 90 * u]), 1.4 * u, '#1b1b22'); }
  }
  void headPts;
  // hats (from the front and from behind alike)
  const y0 = hc - 0.62 * b;                                                                         // the hat band sits here
  if (hat === 'kepi') {                                                                             // a guard's or a policeman's kepi: a low drum, a band, a peak
    p.poly([[cx - 0.86 * a, y0], [cx + 0.86 * a, y0], [cx + 0.78 * a, y0 - 0.6 * b], [cx - 0.78 * a, y0 - 0.6 * b]], hc2, 3.4 * u);
    p.poly(rect(cx - 0.86 * a, y0 - 0.16 * b, 1.72 * a, 0.16 * b), look.plume ?? '#b8232f', 1.6 * u); if (!d.back) { p.ell(cx, y0 + 0.02 * b, 0.8 * a, 0.16 * b, '#15121c', 2.6 * u, 0, 180); p.dot(cx, y0 - 0.36 * b, 3.6 * u, '#e7c04a'); }
  } else if (hat === 'bowler') {
    p.ell(cx, y0 + 0.02 * b, 0.86 * a, 0.86 * b, hc2, 3.4 * u, 180, 360); p.ell(cx, y0 + 0.02 * b, 1.3 * a, 0.14 * b, hc2, 3 * u); p.poly(rect(cx - 0.84 * a, y0 - 0.16 * b, 1.68 * a, 0.13 * b), '#00000055', 0);
  } else if (hat === 'beret') {                                                                     // a floppy beret, pulled to one side, with its stalk
    p.ell(cx + 0.16 * a, y0 - 0.2 * b, 1.16 * a, 0.5 * b, hc2, 3.4 * u, 0, 360, -8); p.poly(rect(cx - 0.8 * a, y0 - 0.06 * b, 1.6 * a, 0.14 * b), hc2, 2.4 * u); p.stroke([[cx + 0.2 * a, y0 - 0.66 * b], [cx + 0.26 * a, y0 - 0.86 * b]], 3 * u, hc2);
  } else if (hat === 'bicorne') {                                                                   // worn across, the way Napoleon wore it; with a plume: a carabiniere
    const pts: P2[] = [[cx - 1.7 * a, y0 + 0.1 * b], [cx - 0.9 * a, y0 - 0.5 * b], [cx, y0 - 0.86 * b], [cx + 0.9 * a, y0 - 0.5 * b], [cx + 1.7 * a, y0 + 0.1 * b], [cx + 0.9 * a, y0 + 0.02 * b], [cx, y0 + 0.12 * b], [cx - 0.9 * a, y0 + 0.02 * b]];
    p.poly(pts, hc2, 3.6 * u); p.stroke([[cx - 1.5 * a, y0 + 0.06 * b], [cx - 0.9 * a, y0 - 0.02 * b], [cx, y0 + 0.08 * b], [cx + 0.9 * a, y0 - 0.02 * b], [cx + 1.5 * a, y0 + 0.06 * b]], 2 * u, '#e7c04a');
    if (!d.back) { p.dot(cx, y0 - 0.36 * b, 6 * u, '#fbfaf5'); p.dot(cx, y0 - 0.36 * b, 3.6 * u, '#c0353a'); p.dot(cx, y0 - 0.36 * b, 1.6 * u, '#2f5fa8'); }
    if (look.plume) { p.poly([[cx - 0.1 * a, y0 - 0.8 * b], [cx - 0.26 * a, y0 - 1.5 * b], [cx, y0 - 1.8 * b], [cx + 0.26 * a, y0 - 1.5 * b], [cx + 0.1 * a, y0 - 0.8 * b]], look.plume, 2.6 * u); p.poly([[cx - 0.2 * a, y0 - 1.3 * b], [cx, y0 - 1.8 * b], [cx + 0.2 * a, y0 - 1.3 * b]], '#2f5fa8', 0); }
  } else if (hat === 'bighat') {                                                                    // a lady's hat of 1911: a wide brim, a crown, flowers
    p.ell(cx, y0 - 0.06 * b, 1.7 * a, 0.3 * b, hc2, 3.4 * u, 0, 180); p.ell(cx, y0 - 0.1 * b, 0.9 * a, 0.7 * b, hc2, 3.4 * u, 180, 360); p.ell(cx, y0 - 0.06 * b, 1.7 * a, 0.3 * b, hc2, 0, 180, 360);
    p.arc(cx, y0 - 0.06 * b, 1.7 * a, 0.3 * b, 0, 360, 3 * u); for (let i = -2; i <= 2; i++) p.dot(cx + i * 0.3 * a, y0 - 0.22 * b - (2 - Math.abs(i)) * 0.06 * b, 5.4 * u, i % 2 ? '#f4e6cf' : (look.plume ?? '#e8553a'));
  } else if (hat === 'leo') {                                                                       // a soft cap of the Renaissance
    p.ell(cx - 0.06 * a, y0 - 0.14 * b, 1.06 * a, 0.56 * b, hc2, 3.4 * u, 180, 360); p.poly(rect(cx - 0.98 * a, y0 - 0.14 * b, 1.96 * a, 0.2 * b), hc2, 2.6 * u);
  } else if (hat === 'royal') {                                                                     // a king's flat cap with a white feather
    p.ell(cx, y0 - 0.02 * b, 1.3 * a, 0.3 * b, hc2, 3.4 * u); p.ell(cx, y0 - 0.14 * b, 0.96 * a, 0.36 * b, hc2, 3 * u, 180, 360);
    p.poly([[cx + 0.7 * a, y0 - 0.2 * b], [cx + 1.2 * a, y0 - 0.86 * b], [cx + 1.6 * a, y0 - 0.9 * b], [cx + 1.3 * a, y0 - 0.3 * b]], '#fbfaf5', 2.6 * u); for (let i = -2; i <= 2; i++) p.dot(cx + i * 0.36 * a, y0 - 0.02 * b, 2.6 * u, '#e7c04a');
  } else if (hat === 'boater') {
    p.poly(rect(cx - 0.82 * a, y0 - 0.44 * b, 1.64 * a, 0.46 * b), '#f2e3b0', 3.2 * u); p.poly(rect(cx - 0.82 * a, y0 - 0.2 * b, 1.64 * a, 0.14 * b), look.plume ?? '#2f5fa8', 1.4 * u); p.ell(cx, y0 + 0.02 * b, 1.3 * a, 0.13 * b, '#f2e3b0', 3 * u);
  }
}

// ---------- drawing a person ----------
export function drawActor(g: G2, look: Look, d: Draw, res = 1) {
  g.save(); g.scale(res, res);
  const p = new Pen(g), hands: P2[] = [], pose = d.pose ?? 'hang';
  let unit = 2.36;
  if (d.mode === 'side' || d.mode === 'sidestand') {                                                // in profile, facing screen-right (the billboard is flipped for screen-left)
    bodySide(p, look.outfit, {phase: d.phase ?? 0, expr: d.expr ?? 'neutral', mode: d.mode === 'side' ? 'march' : 'stand', blink: d.blink, seed: look.seed, stride: 0.8});
    if (d.prop === 'bundle') {                                                                      // the wrapped panel under the near arm
      const [x, y] = [326, 590]; p.rot = [0.08, x, y]; p.poly(rounded(x - 92, y - 130, 184, 260, 12), '#fbf8ee', 6);
      for (const [a, b, c, dd] of [[-92, -40, 92, -66], [-92, 34, 92, 12], [-26, -130, -8, 130]]) p.stroke([[x + a, y + b], [x + c, y + dd]], 3.6, '#b9b3a2');
      p.rot = null; p.stroke(curve([312, 462], [372, 560], [352, 668]), 12.4, '#4a3524'); p.dot(352, 668, 13);
    }
    g.restore(); return;
  }
  bodyFront(p, look.outfit, {
    mode: d.mode ?? 'stand', phase: d.phase ?? 0, expr: d.expr ?? 'neutral', blink: d.blink, headTilt: d.tilt ?? 0, look: d.back ? 0 : d.look ?? 0, seed: look.seed, facing: d.facing ?? 0,
    arms: (geo) => { unit = geo.u; return arms(pose, geo, hands); },
    torso: (pen, geo) => { if (!d.back) torsoFront(pen, look, geo); else if (look.front === 'overalls') { for (const s of [-1, 1]) pen.band([[geo.tcx + s * 0.5 * geo.Ta, geo.chin - 0.1 * geo.HH], [geo.tcx - s * 0.3 * geo.Ta, geo.chin + 0.6 * geo.HH]], look.trim ?? '#3f6aa8', 6 * geo.u, 1.4 * geo.u); } else if (look.front === 'smock') pen.stroke([[geo.tcx - 0.9 * geo.Ta, geo.chin + 0.62 * geo.HH], [geo.tcx + 0.9 * geo.Ta, geo.chin + 0.62 * geo.HH]], 2 * geo.u, '#b9b3a2'); },
    behindHead: (pen, h) => behindHead(pen, look, h, d),
    onHead: (pen, h) => onHead(pen, look, h, d),
  });
  drawProp(p, d, hands, unit, look);
  g.restore();
}

// ---------- the people ----------
export const SKIN = ['#ffe2c2', '#f5c9a0', '#ecd0b6', '#c99067', '#8a5a3c'];
const SMOCK = '#f6f2e6';
/** Vincenzo Peruggia. 0: in the white smock of the museum's workmen. 1: in his own clothes (a brown waistcoat). 2: in prison cloth. Short, a dark moustache, a flat cap. */
export const PERUGGIA = (v = 0): Look => v === 0
  ? {id: 'per0', seed: 4, front: 'smock', hairdo: 'sides', hairColor: '#2a211c', outfit: {jacket: SMOCK, pants: '#4a4038', boots: '#231c18', hat: 'cap', cap: '#6f5a44', moustache: '#2a211c', skin: SKIN[1], build: 'adult', noButtons: true}}
  : v === 1
    ? {id: 'per1', seed: 4, front: 'vest', shirt: '#f4efe2', tie: 'none', hairdo: 'sides', hairColor: '#2a211c', outfit: {jacket: '#7a5234', pants: '#4a4038', boots: '#231c18', hat: 'cap', cap: '#6f5a44', moustache: '#2a211c', skin: SKIN[1], build: 'adult', noButtons: true}}
    : {id: 'per2', seed: 4, front: 'stripes', hairdo: 'swept', hairColor: '#2a211c', outfit: {jacket: '#d9d6cf', pants: '#b9b6ae', boots: '#231c18', hat: null, moustache: '#2a211c', skin: SKIN[1], build: 'adult', noButtons: true}};
/** The museum's workmen: white smocks, caps. Invented. */
export const WORKMAN = (v = 0): Look => ({id: 'work' + v, seed: 31 + v * 7, front: 'smock', hairdo: 'sides', hairColor: ['#5c3c24', '#3b271c', '#8a8690'][v % 3],
  outfit: {jacket: SMOCK, pants: '#4a4038', boots: '#231c18', hat: 'cap', cap: ['#4a5262', '#5a4a3a', '#3f4a44'][v % 3], moustache: v % 2 ? undefined : ['#5c3c24', '#3b271c', '#8a8690'][v % 3], skin: SKIN[(v * 2) % 3], build: v % 3 === 1 ? 'stout' : 'adult', noButtons: true}});
/** A guard of the Louvre: dark blue, brass buttons, a kepi. Invented. */
export const GUARD = (v = 0): Look => ({id: 'guard' + v, seed: 51 + v * 9, front: 'uniform', trim: '#b8232f', hat: 'kepi', hatColor: '#232a44', hairdo: 'sides', hairColor: v ? '#8a8690' : '#3b271c',
  outfit: {jacket: '#27304f', pants: '#27304f', boots: '#15121c', hat: null, buttons: '#e7c04a', moustache: v ? '#8a8690' : '#3b271c', skin: SKIN[v ? 2 : 0], build: v ? 'stout' : 'adult'}});
/** The plumber, Sauvet: the only person who saw the thief inside. Blue overalls, a tool bag. No likeness. */
export const PLUMBER: Look = {id: 'plumber', seed: 77, front: 'overalls', trim: '#3f6aa8', shirt: '#e9e2d0', hairdo: 'sides', hairColor: '#a8643a',
  outfit: {jacket: '#d9cfb8', pants: '#3f6aa8', boots: '#231c18', hat: 'cap', cap: '#7a8290', moustache: '#a8643a', skin: SKIN[0], build: 'stout', noButtons: true}};
/** The artist who came to paint her (Louis Béroud): a beret, a goatee, a painter's smock. No likeness. */
export const ARTIST: Look = {id: 'artist', seed: 88, front: 'smock', hat: 'beret', hatColor: '#3a2f4a', hairdo: 'sides', hairColor: '#5c3c24', beard: 'goatee',
  outfit: {jacket: '#e9dfc6', dress: '#e9dfc6', pants: '#4a4038', boots: '#231c18', hat: null, moustache: '#5c3c24', skin: SKIN[0], build: 'adult', noButtons: true}};
/** The museum's photographer: shirt sleeves, a waistcoat. Invented. */
export const PHOTOGRAPHER: Look = {id: 'photo', seed: 97, front: 'vest', shirt: '#f4efe2', tie: 'bow', hairdo: 'swept', hairColor: '#3b271c', eyewear: 'round',
  outfit: {jacket: '#4a5262', pants: '#3b3f4d', boots: '#231c18', hat: null, moustache: '#3b271c', skin: SKIN[2], build: 'adult', noButtons: true}};
/** Paris, 1911: the public. Invented. */
export const CITIZEN = (v = 0): Look => {
  const woman = v % 3 === 1, col = ['#3b4252', '#7a4a6a', '#4a3f38', '#2f3f4f', '#8a5a6a', '#3a4a44', '#5a4a6a', '#a8643a'][v % 8];
  return woman
    ? {id: 'cit' + v, seed: 111 + v * 5, front: 'dress', hat: 'bighat', hatColor: ['#7a4a6a', '#3f6a7a', '#8a6a3a'][v % 3], plume: ['#e8553a', '#f2c230', '#f4a6c0'][(v >> 1) % 3], hairdo: 'bob', hairColor: ['#5c3c24', '#a8643a', '#2a211c'][v % 3], trim: '#e7c04a',
      outfit: {jacket: col, dress: col, pants: col, boots: '#231c18', hat: null, skin: SKIN[v % 3], build: 'adult', noButtons: true}}
    : {id: 'cit' + v, seed: 111 + v * 5, front: 'suit', tie: ['#8a2f3d', '#2f4a7a', 'bow'][v % 3], hat: v % 4 === 0 ? 'bowler' : v % 4 === 2 ? 'boater' : null, hatColor: '#2e2a36', hairdo: 'sides', hairColor: ['#3b271c', '#8a8690', '#5c3c24', '#a8643a'][v % 4], eyewear: v % 5 === 3 ? 'round' : undefined,
      outfit: {jacket: col, pants: '#2b2f3a', boots: '#15121c', hat: v % 4 === 3 ? 'tophat' : null, moustache: v % 2 ? undefined : ['#3b271c', '#8a8690', '#5c3c24', '#a8643a'][v % 4], skin: SKIN[(v + 1) % 3], build: v % 5 === 2 ? 'stout' : 'adult', noButtons: true}};
};
/** A Paris policeman: a kepi, a short cape (drawn as a dark coat). Invented. */
export const POLICE = (v = 0): Look => ({id: 'police' + v, seed: 151 + v * 3, front: 'uniform', trim: '#15121c', hat: 'kepi', hatColor: '#1f2438', plume: '#c9ced6', hairdo: 'sides', hairColor: '#3b271c',
  outfit: {jacket: '#1f2438', pants: '#1f2438', boots: '#15121c', hat: null, buttons: '#d9dde0', moustache: v ? '#5c3c24' : '#2a211c', skin: SKIN[v % 3], build: v ? 'adult' : 'stout'}});
/** A detective of the Sûreté: an overcoat, a bowler. Invented. */
export const DETECTIVE: Look = {id: 'detective', seed: 171, front: 'coat', shirt: '#f4efe2', tie: '#3a3f4a', hat: 'bowler', hatColor: '#2e2a36', hairdo: 'sides', hairColor: '#5c3c24',
  outfit: {jacket: '#8a7a5a', pants: '#3b3f4d', boots: '#15121c', hat: null, moustache: '#5c3c24', skin: SKIN[0], build: 'adult', noButtons: true}};
/** The poet who was arrested (Guillaume Apollinaire): a stout man with a bow tie and a book. No likeness. */
export const POET: Look = {id: 'poet', seed: 181, front: 'suit', tie: 'bow', shirt: '#fbfaf5', hat: 'bowler', hatColor: '#3a3038', hairdo: 'sides', hairColor: '#3b271c',
  outfit: {jacket: '#5a4a6a', pants: '#3b3552', boots: '#15121c', hat: null, skin: SKIN[2], build: 'stout', noButtons: true}};
/** Pablo Picasso at 29: a black fringe, a dark jacket. A costume, not a portrait. */
export const PICASSO: Look = {id: 'picasso', seed: 191, front: 'suit', tie: 'none', shirt: '#e9e2d0', hairdo: 'fringe', hairColor: '#17131a',
  outfit: {jacket: '#3a4a5a', pants: '#3b3f4d', boots: '#15121c', hat: null, skin: SKIN[1], build: 'adult', noButtons: true}};
/** A magistrate behind a desk. Invented. */
export const MAGISTRATE: Look = {id: 'magistrate', seed: 201, front: 'suit', tie: '#15121c', shirt: '#fbfaf5', hairdo: 'swept', hairColor: '#b9b4a8', eyewear: 'pince', beard: 'full', beardColor: '#b9b4a8',
  outfit: {jacket: '#2b2d3a', pants: '#2b2d3a', boots: '#15121c', hat: null, skin: SKIN[0], build: 'stout', noButtons: true}};
/** The art dealer in Florence (Alfredo Geri): a grey beard, pince-nez, a waistcoat. No likeness. */
export const DEALER: Look = {id: 'dealer', seed: 211, front: 'vest', shirt: '#fbfaf5', tie: '#7a2f4a', hairdo: 'swept', hairColor: '#8a8690', beard: 'goatee', beardColor: '#8a8690', eyewear: 'pince',
  outfit: {jacket: '#5a4a3a', pants: '#3b3f4d', boots: '#15121c', hat: null, moustache: '#8a8690', skin: SKIN[2], build: 'adult', noButtons: true}};
/** Carabinieri: the bicorne with its red and blue plume. Invented. */
export const CARABINIERE = (v = 0): Look => ({id: 'cara' + v, seed: 221 + v * 4, front: 'cara', hat: 'bicorne', hatColor: '#1c2030', plume: '#d63a2f', hairdo: 'sides', hairColor: '#2a211c',
  outfit: {jacket: '#1c2440', pants: '#1c2440', boots: '#15121c', hat: null, moustache: v ? undefined : '#2a211c', skin: SKIN[v ? 0 : 1], build: v ? 'adult' : 'stout', noButtons: true}});
/** Napoleon: the hat, the green coat. A costume. */
export const NAPOLEON: Look = {id: 'napoleon', seed: 231, front: 'napoleon', hat: 'bicorne', hatColor: '#1d1d24', hairdo: 'sides', hairColor: '#3b271c',
  outfit: {jacket: '#2f5a3f', pants: '#fbfaf5', boots: '#15121c', hat: null, skin: SKIN[0], build: 'stout', noButtons: true}};
/** Leonardo da Vinci in old age: a long white beard, a soft cap, a gown. A costume. */
export const LEONARDO: Look = {id: 'leonardo', seed: 241, front: 'robe', trim: '#7a5a3a', hat: 'leo', hatColor: '#8a2f3d', hairdo: 'long', hairColor: '#e9e6dc', beard: 'long', beardColor: '#e9e6dc',
  outfit: {jacket: '#8a2f3d', dress: '#8a2f3d', pants: '#4a3a30', boots: '#231c18', hat: null, skin: SKIN[2], build: 'adult', noButtons: true}};
/** The King of France who took him in (Francis I): a feathered cap, a beard, a doublet. A costume. */
export const KING: Look = {id: 'king', seed: 251, front: 'royal', hat: 'royal', hatColor: '#24304f', hairdo: 'sides', hairColor: '#5c3c24', beard: 'full', beardColor: '#5c3c24',
  outfit: {jacket: '#2f4a8a', pants: '#fbfaf5', boots: '#231c18', hat: null, skin: SKIN[0], build: 'stout', noButtons: true}};
/** A gentleman who knows his paintings (1911): a top hat, a monocle, a cane. Invented. */
export const CONNOISSEUR: Look = {id: 'connoisseur', seed: 261, front: 'suit', tie: '#7a2f4a', shirt: '#fbfaf5', hairdo: 'sides', hairColor: '#8a8690', eyewear: 'monocle', hatColor: '#2e2a36',
  outfit: {jacket: '#3b3f4d', pants: '#2b2f3a', boots: '#15121c', hat: 'tophat', moustache: '#8a8690', skin: SKIN[0], build: 'adult', noButtons: true}};
/** Today's visitors: invented. */
export const TOURIST = (v = 0): Look => ({id: 'tour' + v, seed: 271 + v * 7, front: 'tee', shirt: ['#fffdf4', '#f2c230', '#bfe3ff', '#f4a6c0'][v % 4], hairdo: v % 3 === 0 ? 'long' : v % 3 === 1 ? 'swept' : 'bob', hairColor: ['#2a211c', '#a8643a', '#5c3c24', '#e7c56a', '#17131a'][v % 5], eyewear: v % 6 === 4 ? 'round' : undefined,
  outfit: {jacket: ['#e8553a', '#2f8f8a', '#4f6fa8', '#7a5c9a', '#3f8a55', '#b08a3a', '#d6708a'][v % 7], pants: ['#3b4a6a', '#2b2f3a', '#6a6f7a'][v % 3], boots: ['#fffdf4', '#15121c', '#e8553a'][v % 3], hat: v % 5 === 2 ? 'cap' : null, cap: '#e8553a', skin: SKIN[v % 5], build: v % 4 === 3 ? 'stout' : v % 7 === 5 ? 'kid' : 'adult', noButtons: true}});

// ---------- billboards ----------
const cache = new Map<string, THREE.CanvasTexture>();
const WIDE = 1.4;
function texture(look: Look, d: Draw, res: number, wide = false) {
  const key = look.id + JSON.stringify(d) + res + (wide ? 'w' : ''); let t = cache.get(key); if (t) return t;
  const cv = document.createElement('canvas'), W = wide ? 600 * WIDE : 600; cv.width = Math.round(W * res); cv.height = Math.round(1000 * res);
  const g = cv.getContext('2d')!; g.translate(Math.round((W - 600) / 2 * res), 0);
  drawActor(g, look, d, res);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cache.set(key, t); return t;
}
export type Actor = {
  node: THREE.Group; mesh: THREE.Mesh; state: string;
  /** switch the drawing (expression + pose) */
  show: (state: string) => Actor;
  /** call once per frame: faces the camera, breathes, blinks */
  tick: (f: number, cam: THREE.Camera) => void;
  tint: (c: string) => Actor;
  /** a profile drawing faces screen-right; flip(true) turns it to screen-left */
  flip: (left: boolean) => Actor;
};
export type ActorOpt = {scale?: number; res?: number; shadow?: number; still?: boolean; phase?: number; /** a wider drawing: for things held out to the side */ wide?: boolean};
export function actor(parent: Node, look: Look, states: Record<string, Draw>, x: number, y: number, z: number, o: ActorOpt = {}): Actor {
  const scale = o.scale ?? 1, res = o.res ?? 0.7, node = new THREE.Group(); node.position.set(x, y, z); parent.add(node);
  const maps = new Map<string, [THREE.Texture, THREE.Texture]>();
  const wide = !!o.wide;
  for (const [k, d] of Object.entries(states)) maps.set(k, [texture(look, d, res, wide), d.back ? texture(look, d, res, wide) : texture(look, {...d, blink: true}, res, wide)]);
  const first = Object.keys(states)[0];
  const material = new THREE.MeshBasicMaterial({map: maps.get(first)![0], transparent: true, alphaTest: 0.45, side: THREE.DoubleSide});
  const w = 1.296 * scale * (wide ? WIDE : 1), h = 2.16 * scale, geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h * 0.475, 0);     // soles on the ground
  const m = new THREE.Mesh(geo, material); m.layers.set(NOINK); node.add(m);
  if (o.shadow !== 0) pool(node, 0.46 * scale, '#000000', o.shadow ?? 0.34, 0, 0, 0.014, false).scale.set(1, 0.55, 1);
  const ph = o.phase ?? look.seed * 1.7, wp = new THREE.Vector3();
  const a: Actor = {
    node, mesh: m, state: first,
    show(s) { if (maps.has(s)) a.state = s; return a; },
    tint(c) { material.color.set(c); return a; },
    flip(left) { m.scale.x = left ? -1 : 1; return a; },
    tick(f, cam) {
      node.getWorldPosition(wp);
      node.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z) * 0.9;
      const pair = maps.get(a.state)!, blink = (f + Math.round(ph * 23)) % 97 < 3;
      material.map = pair[blink ? 1 : 0];
      if (!o.still) { m.rotation.z = 0.014 * Math.sin(f * 0.105 + ph); m.scale.y = 1 + 0.011 * Math.sin(f * 0.19 + ph); }
    },
  };
  return a;
}

export {INK};
