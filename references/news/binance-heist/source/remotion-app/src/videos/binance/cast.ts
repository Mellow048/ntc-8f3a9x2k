// The cast of the Binance heist short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only: lanyard, raid jacket, robe, suit.
// The engineers are private people whom Binance has not named, so they are nobody in particular. The hackers have not been
// identified by anyone, so they have no face at all: a hood with two amber eyes in it. When they pose as recruiters they wear a
// blazer over the hoodie and a paper mask with a smile drawn on it. Only the president is a (simple) likeness of a real person.
import * as THREE from 'three';
import {Pen, bodyFront, bodySide, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'type' | 'wave' | 'push' | 'swing';
export type Prop = 'paper' | 'phone' | 'bag' | 'mask' | 'pointer' | 'cv' | null;
export type MaskKind = 'pd' | 'hr' | 'ceo';
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round';
  front?: 'suit' | 'hoodie' | 'tee' | 'polo' | 'fbi' | 'robe' | 'con' | 'blazer';
  /** tie colour */
  tie?: string; shirt?: string; longTie?: boolean;
  /** a staff badge on a ribbon of this colour */
  lanyard?: string;
  /** a word across the chest */
  chest?: string;
  hairdo?: 'swept' | 'swoop' | 'long' | 'bob';
  hairColor?: string;
  extra?: 'cowl';
  /** colour of the hood when a blazer is worn over the hoodie */
  hood?: string;
  /** the paper face a fake recruiter wears */
  mask?: MaskKind;
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march'; phase?: number;
  /** the mask is off the face (hold it with prop 'mask') */ bare?: boolean};

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
    case 'type': both((s) => A(s, 1.14 * Ta + 2 * u, 0.42, 0.34 * Ta, 0.66, true)); break;
    case 'wave': hang(-1); A(1, 1.2 * Ta + 14 * u, 0.04, 1.36 * Ta + 24 * u, -0.66); break;
    case 'push': A(-1, 1.3 * Ta + 10 * u, 0.22, 1.5 * Ta + 34 * u, 0.12); A(1, 0.3 * Ta, 0.48, -(1.3 * Ta + 18 * u), 0.24, true); break;   // both hands out to screen-left
    default: both(hang);
  }
  return out;
}

// ---------- the paper mask ----------
/** A paper plate with a face in marker pen: what the fake recruiters show the camera. r is its half-width. */
function paperMask(p: Pen, cx: number, cy: number, r: number, kind: MaskKind, u: number) {
  const pen = '#2a2230', w = 0.062 * r;
  p.ell(cx, cy, r, r * 1.1, '#fff4d6', 2.6 * u);
  p.arc(cx, cy, r * 0.9, r * 1.0, 205, 335, 1.2 * u, '#e6d6ac');                                    // the rim of the plate
  for (const s of [-1, 1]) {
    p.arc(cx + s * 0.38 * r, cy - 0.1 * r, 0.19 * r, 0.2 * r, 200, 340, w, pen);                    // eyes shut in a smile
    p.ell(cx + s * 0.58 * r, cy + 0.26 * r, 0.14 * r, 0.1 * r, '#ffb0a8', 0);
  }
  p.arc(cx, cy + 0.2 * r, 0.46 * r, 0.4 * r, 18, 162, w * 1.15, pen);
  if (kind === 'hr') {                                                                              // lashes and a bow
    for (const s of [-1, 1]) for (const a of [-0.5, 0, 0.5]) p.stroke([[cx + s * (0.38 + a * 0.2) * r, cy - 0.3 * r], [cx + s * (0.38 + a * 0.34) * r, cy - 0.44 * r]], w * 0.7, pen);
    for (const s of [-1, 1]) p.poly([[cx, cy - 0.86 * r], [cx + s * 0.4 * r, cy - 1.08 * r], [cx + s * 0.4 * r, cy - 0.64 * r]], '#e3342f', 1.6 * u);
    p.dot(cx, cy - 0.86 * r, 0.09 * r, '#b3211d');
  } else if (kind === 'ceo') {                                                                      // eyebrows and a big moustache
    for (const s of [-1, 1]) {
      p.stroke([[cx + s * 0.16 * r, cy - 0.46 * r], [cx + s * 0.6 * r, cy - 0.56 * r]], w * 1.5, pen);
      p.stroke(curve([cx, cy + 0.2 * r], [cx + s * 0.34 * r, cy + 0.02 * r], [cx + s * 0.66 * r, cy + 0.2 * r]), w * 2.4, pen);
    }
  } else {                                                                                          // spectacles
    for (const s of [-1, 1]) { p.path(rounded(cx + s * 0.38 * r - 0.25 * r, cy - 0.36 * r, 0.5 * r, 0.42 * r, 0.1 * r), true); p.g.lineWidth = w; p.g.strokeStyle = pen; p.g.stroke(); }
    p.stroke([[cx - 0.13 * r, cy - 0.18 * r], [cx + 0.13 * r, cy - 0.18 * r]], w, pen);
  }
}

// ---------- things held ----------
function drawProp(p: Pen, prop: Prop, hands: P2[], u: number, look: Look) {
  if (!prop) return;
  const g = p.g, R = hands[1] ?? [430, 600], L = hands[0] ?? [170, 600];
  const mid: P2 = [(R[0] + L[0]) / 2, (R[1] + L[1]) / 2];
  const fists = () => { p.dot(L[0], L[1], 5.5 * u); p.dot(R[0], R[1], 5.5 * u); };
  if (prop === 'paper' || prop === 'cv') {                                                          // a statement with a letterhead, or a CV with a photo
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u];
    p.rot = [0.18, x, y];
    p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    if (prop === 'cv') { p.poly(rect(x - 13 * u, y - 19 * u, 10 * u, 12 * u), '#9fb4c8', 1.2 * u); p.stroke([[x, y - 16 * u], [x + 12 * u, y - 16 * u]], 2.2 * u, '#2a2230'); p.stroke([[x, y - 10 * u], [x + 9 * u, y - 10 * u]], 1.5 * u, '#8f8a96'); }
    else p.poly(rect(x - 13 * u, y - 19 * u, 26 * u, 7 * u), look.tie ?? '#f0b90b', 0);
    for (let i = 0; i < 5; i++) p.stroke([[x - 12 * u, y - 2 * u + i * 5 * u], [x + (i === 4 ? 2 : 12) * u, y - 2 * u + i * 5 * u]], 1.5 * u, '#8f8a96');
    p.rot = null; p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'phone') {
    p.poly(rounded(R[0] - 5 * u, R[1] - 15 * u, 10 * u, 24 * u, 2 * u), '#26262e', 1.8 * u); p.dot(R[0] + 3 * u, R[1] + 3 * u, 5 * u);
  } else if (prop === 'bag') {                                                                      // a laptop sealed in a clear evidence bag, held well away from the body
    const [x, y] = [mid[0], mid[1] - 2 * u];
    p.poly(rounded(x - 27 * u, y - 15 * u, 54 * u, 33 * u, 3 * u), '#3a3f4c', 2 * u);
    p.poly(rect(x - 22 * u, y - 10 * u, 44 * u, 4 * u), '#59606f', 0);
    g.globalAlpha = 0.42; p.poly(rounded(x - 33 * u, y - 26 * u, 66 * u, 50 * u, 4 * u), '#d8f1ff', 0); g.globalAlpha = 1;
    p.poly(rounded(x - 33 * u, y - 26 * u, 66 * u, 50 * u, 4 * u), null, 2 * u);
    p.poly(rect(x - 33 * u, y - 26 * u, 66 * u, 9 * u), '#e3342f', 1.6 * u);
    p.stroke([[x - 22 * u, y - 21.5 * u], [x + 22 * u, y - 21.5 * u]], 2 * u, '#ffffff');
    fists();
  } else if (prop === 'mask') {                                                                     // the paper face, off for a moment
    const [x, y] = [R[0] + 10 * u, R[1] - 46 * u];
    p.band([[R[0], R[1] + 4 * u], [x - 3 * u, y + 40 * u]], '#c79a62', 4 * u, 1.4 * u, 'round');
    p.rot = [0.2, x, y]; paperMask(p, x, y, 36 * u, look.mask ?? 'hr', u); p.rot = null;
    p.dot(R[0], R[1], 5.5 * u);
  } else if (prop === 'pointer') {                                                                  // a pointer stick, up and out to screen-right
    p.band([[R[0] - 4 * u, R[1] + 6 * u], [R[0] + 52 * u, R[1] - 50 * u]], '#6b4a2d', 3.6 * u, 1.3 * u, 'round');
    p.dot(R[0] + 53 * u, R[1] - 51 * u, 3.4 * u, '#e3342f'); p.dot(R[0], R[1], 5.5 * u);
  }
}

// ---------- torso fronts ----------
function torsoFront(p: Pen, look: Look, g: FrontGeo) {
  const {tcx: x, Ta, chin, HH, u, torsoBot} = g, top = chin - 0.1 * HH;
  const vee = (w: number, depth: number, fill: string) => p.poly([[x - w * Ta, top], [x + w * Ta, top], [x, chin + depth * HH]], fill, 1.8 * u);
  const word = (s: string, y: number, size: number, col: string, dx = 0) => { const c = p.g; c.save(); c.font = `400 ${size * u}px Anton, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x + dx, y); c.restore(); };
  /** a "HELLO my name is" sticker */
  const sticker = (sx: number, sy: number) => { p.rot = [-0.1, sx, sy]; p.poly(rounded(sx - 0.26 * Ta, sy - 0.09 * HH, 0.52 * Ta, 0.18 * HH, 2 * u), '#fffdf4', 1.4 * u); p.poly(rect(sx - 0.26 * Ta, sy - 0.09 * HH, 0.52 * Ta, 0.07 * HH), '#e3342f', 0); p.stroke([[sx - 0.16 * Ta, sy + 0.04 * HH], [sx + 0.14 * Ta, sy + 0.04 * HH]], 1.8 * u, '#2a2230'); p.rot = null; };
  const strings = (len = 0.56) => { for (const s of [-1, 1]) { p.stroke([[x + s * 5 * u, chin + 0.26 * HH], [x + s * 6 * u, chin + len * HH]], 1.5 * u, '#f3f1ea'); p.dot(x + s * 6 * u, chin + (len + 0.01) * HH, 1.6 * u, '#f3f1ea'); } };
  const lanyard = (col: string) => {
    for (const s of [-1, 1]) p.stroke([[x + s * 0.34 * Ta, top + 2 * u], [x + 0.02 * Ta, chin + 0.52 * HH]], 2.6 * u, col);
    p.poly(rounded(x - 0.16 * Ta, chin + 0.52 * HH, 0.36 * Ta, 0.22 * HH, 2 * u), '#fffdf4', 1.4 * u);
    p.poly(rect(x - 0.1 * Ta, chin + 0.56 * HH, 0.1 * Ta, 0.08 * HH), '#9fb4c8', 0); p.stroke([[x + 0.04 * Ta, chin + 0.6 * HH], [x + 0.15 * Ta, chin + 0.6 * HH]], 1.3 * u, '#777');
    p.stroke([[x - 0.1 * Ta, chin + 0.69 * HH], [x + 0.14 * Ta, chin + 0.69 * HH]], 1.3 * u, '#777');
  };
  switch (look.front) {
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
      if (look.lanyard) p.poly(rounded(x + 0.3 * Ta, chin + 0.36 * HH, 0.3 * Ta, 0.13 * HH, 1.5 * u), look.lanyard, 1.3 * u);   // a lapel pin in the company colour
      break;
    }
    case 'hoodie': {
      p.poly([[x - 0.5 * Ta, top], [x + 0.5 * Ta, top], [x + 0.3 * Ta, chin + 0.2 * HH], [x, chin + 0.3 * HH], [x - 0.3 * Ta, chin + 0.2 * HH]], look.shirt ?? '#d9d6cf', 1.8 * u);
      if (look.lanyard) lanyard(look.lanyard); else { strings(); p.poly(rounded(x - 0.52 * Ta, chin + 0.68 * HH, 1.04 * Ta, 0.22 * HH, 3 * u), null, 1.5 * u); }
      break;
    }
    case 'tee': {
      if (look.lanyard) lanyard(look.lanyard);
      else if (look.chest) word(look.chest, chin + 0.46 * HH, 15, look.shirt ?? '#f0b90b');
      else p.poly([[x, chin + 0.3 * HH], [x + 0.26 * Ta, chin + 0.48 * HH], [x, chin + 0.66 * HH], [x - 0.26 * Ta, chin + 0.48 * HH]], look.shirt ?? '#f0b90b', 1.5 * u);   // a plain diamond print
      break;
    }
    case 'polo': {                                                                                  // uniform polo: collar, placket, a word across the chest
      const collar = look.shirt ?? '#f3f1ea';
      for (const s of [-1, 1]) p.poly([[x, chin + 0.18 * HH], [x + s * 0.44 * Ta, top], [x + s * 0.54 * Ta, chin + 0.14 * HH], [x + s * 0.14 * Ta, chin + 0.32 * HH]], collar, 1.6 * u);
      p.stroke([[x, chin + 0.22 * HH], [x, chin + 0.4 * HH]], 1.5 * u);
      if (look.chest) word(look.chest, chin + 0.58 * HH, 13.5, '#f0b90b');
      break;
    }
    case 'fbi': {                                                                                   // raid jacket over a shirt and tie
      vee(0.34, 0.4, '#fbfaf5');
      p.poly([[x - 3.6 * u, top + 5 * u], [x + 3.6 * u, top + 5 * u], [x + 4.6 * u, chin + 0.3 * HH], [x, chin + 0.37 * HH], [x - 4.6 * u, chin + 0.3 * HH]], look.tie ?? '#8a2f3d', 1.4 * u);
      p.stroke([[x, chin + 0.4 * HH], [x, torsoBot]], 1.6 * u, '#0f1626');
      word('FBI', chin + 0.6 * HH, 17, '#ffd43b', -0.46 * Ta);
      p.poly(rect(x + 0.24 * Ta, chin + 0.52 * HH, 0.42 * Ta, 0.14 * HH), '#e7b93c', 1.4 * u);     // badge
      break;
    }
    case 'robe': {                                                                                  // a judge: black robe, white bands at the throat
      for (const s of [-1, 1]) p.stroke([[x + s * 0.5 * Ta, top], [x + s * 0.12 * Ta, torsoBot]], 1.6 * u, '#3a3a46');
      for (const s of [-1, 1]) p.poly([[x, top + 2 * u], [x + s * 0.2 * Ta, top + 3 * u], [x + s * 0.22 * Ta, chin + 0.36 * HH], [x + s * 0.02 * Ta, chin + 0.36 * HH]], '#fbfaf5', 1.5 * u);
      break;
    }
    case 'con': {                                                                                   // a hoodie dressed up for the part: clip-on tie, name sticker
      p.poly([[x - 0.5 * Ta, top], [x + 0.5 * Ta, top], [x + 0.3 * Ta, chin + 0.2 * HH], [x, chin + 0.3 * HH], [x - 0.3 * Ta, chin + 0.2 * HH]], look.shirt ?? '#0c1114', 1.8 * u);
      p.rot = [0.09, x, chin + 0.1 * HH];
      const tie = look.tie ?? '#e3342f', end = chin + 0.72 * HH;
      p.poly([[x - 5 * u, chin + 0.06 * HH], [x + 5 * u, chin + 0.06 * HH], [x + 3.6 * u, chin + 0.17 * HH], [x - 3.6 * u, chin + 0.17 * HH]], tie, 1.5 * u);
      p.poly([[x - 3.6 * u, chin + 0.17 * HH], [x + 3.6 * u, chin + 0.17 * HH], [x + 6.8 * u, end - 6 * u], [x, end], [x - 6.8 * u, end - 6 * u]], tie, 1.5 * u);
      p.rot = null;
      sticker(x + 0.5 * Ta, chin + 0.5 * HH);
      break;
    }
    case 'blazer': {                                                                                // a blazer pulled over the hoodie: the hood and its strings still show
      vee(0.5, 0.62, look.hood ?? '#1f3b40');
      strings(0.5);
      for (const s of [-1, 1]) {
        p.stroke([[x + s * 0.5 * Ta, top], [x + s * 0.22 * Ta, chin + 0.36 * HH], [x, chin + 0.62 * HH]], 1.8 * u);
        p.stroke([[x + s * 0.76 * Ta, chin + 0.12 * HH], [x + s * 0.22 * Ta, chin + 0.36 * HH]], 1.5 * u);
      }
      p.stroke([[x, chin + 0.62 * HH], [x, torsoBot]], 1.5 * u);
      p.dot(x + 3 * u, chin + 0.74 * HH, 1.8 * u, '#c9d2d8');
      sticker(x + 0.52 * Ta, chin + 0.42 * HH);
      break;
    }
    default:
  }
}

// ---------- hair, hoods, glasses ----------
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
/** A hood with nobody's face in it: a dark opening and two amber eyes. The hackers, whoever they are. With `mask`, a paper face covers the opening. */
function cowl(p: Pen, h: HeadGeo, col: string, mask: MaskKind | null) {
  const {cx, hc, a, b, u} = h, out: P2[] = [];
  for (let i = 0; i <= 28; i++) { const t = Math.PI * (0.92 + 1.16 * (i / 28)); out.push([cx + 1.27 * a * Math.cos(t), hc - 0.02 * b + (1.25 + 0.12 * Math.exp(-((i - 14) ** 2) / 10)) * b * Math.sin(t)]); }   // a little peak on top
  out.push([cx + 1.12 * a, hc + 0.98 * b], [cx + 0.6 * a, hc + 1.22 * b], [cx - 0.6 * a, hc + 1.22 * b], [cx - 1.12 * a, hc + 0.98 * b]);
  p.shadedFill(out, col, '#0a1416', -2.1, a * 1.3, 0.45); p.poly(out, null, 4.2 * u);
  p.ell(cx, hc + 0.12 * b, 0.82 * a, 0.82 * b, '#06090b', 2.6 * u);
  if (mask) {
    for (const s of [-1, 1]) p.stroke([[cx + s * 0.8 * a, hc + 0.06 * b], [cx + s * 1.16 * a, hc + 0.0 * b]], 1.6 * u, '#d9d2c0');   // the elastic
    paperMask(p, cx, hc + 0.1 * b, 0.84 * a, mask, u);
  } else for (const d of [-1, 1]) p.ell(cx + d * 0.34 * a, hc + 0.06 * b, 0.15 * a, 0.2 * b, '#ffd76a', 0);
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
    onHead: (pen, h) => { onHead(pen, look, h); if (look.extra === 'cowl') cowl(pen, h, look.hood ?? look.outfit.jacket, look.mask && !d.bare ? look.mask : null); },
  });
  drawProp(p, d.prop ?? null, hands, unit, look);
  g.restore();
}

// ---------- the people ----------
const SKIN = ['#ffe2c2', '#c99067', '#f5c9a0', '#8a5a3c', '#ecd0b6'], HAIR = ['#3b271c', '#241c18', '#5c3c24', '#a8643a'];
export const GOLD = '#f0b90b';
const suit = (id: string, seed: number, jacket: string, hair: string, skin: string, tie: string, more: Partial<Look> = {}, build: Outfit['build'] = 'adult'): Look => ({
  id, seed, front: 'suit', tie, outfit: {jacket, pants: jacket, boots: '#17171d', hat: 'hair', hair, skin, build, noButtons: true}, ...more,
});
const HOOD = '#1f4a4f';
/** the hackers at home: a teal hood, no face */
export const CON = (v = 0): Look => ({id: 'con' + v, seed: 7 + v * 3, front: v === 0 ? 'con' : 'hoodie', shirt: '#0c1114', extra: 'cowl',
  outfit: {jacket: [HOOD, '#234247', '#2a4d45'][v % 3], pants: '#161b20', boots: '#0f1113', hat: null, skin: '#06090b', build: v % 3 === 1 ? 'stout' : 'adult', noButtons: true}});
/** the same hackers dressed for the call: a blazer over the hoodie and a paper face. 'pd' the project director, 'hr' the H.R. rep, 'ceo' the chief executive. */
export const FAKE = (kind: MaskKind): Look => ({id: 'fake-' + kind, seed: kind === 'ceo' ? 10 : 7, front: 'blazer', extra: 'cowl', hood: HOOD, mask: kind,
  outfit: {jacket: {pd: '#5b6478', hr: '#8a4f9e', ceo: '#2c2f3a'}[kind], pants: '#161b20', boots: '#0f1113', hat: null, skin: '#06090b', build: kind === 'ceo' ? 'stout' : 'adult', noButtons: true}});
/** Binance engineers. Nobody in particular: 0 and 2 at the office (company lanyard), 1 at home. */
export const ENGINEER = (v = 0): Look => ({id: 'eng' + v, seed: 61 + v * 5, front: v === 2 ? 'tee' : 'hoodie', shirt: ['#f3f1ea', '#ffe9a8', '#f3f1ea'][v], lanyard: v === 1 ? undefined : GOLD,
  eyewear: v === 1 ? 'round' : undefined, hairdo: v === 2 ? 'bob' : undefined, hairColor: HAIR[v % 4],
  outfit: {jacket: ['#3a4152', '#4f8a5b', '#b0563f'][v], pants: ['#2b2f3a', '#3b4a66', '#2b2f3a'][v], boots: '#f3efe6', hat: v === 2 ? null : 'hair', hair: HAIR[(v + 1) % 4], skin: SKIN[[0, 2, 1][v]], build: 'adult', noButtons: true}});
/** Binance's security team: dark polo, cap */
export const SECURITY = (v = 0): Look => ({id: 'sec' + v, seed: 131 + v, front: 'polo', shirt: '#2a3550', chest: 'SECURITY',
  outfit: {jacket: '#1d2738', pants: '#1d2738', boots: '#15161b', hat: 'cap', cap: '#1d2738', skin: SKIN[(v * 3 + 1) % 5], build: v % 2 ? 'adult' : 'stout', noButtons: true}});
/** FBI: raid jacket with the three letters, shirt and tie under it */
export const AGENT = (v = 0): Look => ({id: 'agent' + v, seed: 151 + v, front: 'fbi', tie: ['#8a2f3d', '#2f5fa8'][v % 2], eyewear: v % 2 ? 'rect' : undefined,
  outfit: {jacket: '#1f2a44', pants: '#3b3f4d', boots: '#17171d', hat: 'hair', hair: HAIR[v % 4], skin: SKIN[(v * 2 + 4) % 5], build: 'adult', noButtons: true}});
/** The U.S. president: the simple caricature of the first news film (blond wave, long red tie), always with a name tag. */
export const PRESIDENT: Look = {...suit('president', 14, '#24304f', '#f3c552', '#f5b98c', '#d42a2a', {longTie: true, hairdo: 'swoop', hairColor: '#f3c552'}, 'stout'),
  outfit: {jacket: '#24304f', pants: '#24304f', boots: '#17171d', hat: null, skin: '#f5b98c', build: 'stout', noButtons: true}};
/** Binance's side of it: an anonymous spokesperson. Not a likeness of either chief executive. */
export const SPOKES: Look = {id: 'spokes', seed: 171, front: 'suit', tie: GOLD, lanyard: GOLD, hairdo: 'bob', hairColor: '#a8643a',
  outfit: {jacket: '#23262f', pants: '#23262f', boots: '#17171d', hat: null, skin: '#ffe2c2', build: 'adult', noButtons: true}};
/** a newsreader of North Korea's state media, reading out a statement. Nobody in particular, and not the person whose statement it is. */
export const ANCHOR: Look = {id: 'anchor', seed: 191, front: 'suit', tie: '#8a1f2a', lanyard: '#e3342f', hairdo: 'swept', hairColor: '#1d1a20',
  outfit: {jacket: '#2b2f3a', pants: '#2b2f3a', boots: '#17171d', hat: null, skin: '#f5c9a0', build: 'adult', noButtons: true}};
/** a judge with nobody to try */
export const JUDGE: Look = {id: 'judge', seed: 181, front: 'robe', eyewear: 'round', hairdo: 'swept', hairColor: '#d9dbe2',
  outfit: {jacket: '#1d1d26', pants: '#1d1d26', boots: '#17171d', hat: null, skin: '#f5c9a0', build: 'stout', noButtons: true}};
/** customers of the exchange */
export const USER = (v = 0): Look => ({id: 'user' + v, seed: 101 + v, front: v % 2 ? 'tee' : 'hoodie', shirt: ['#ff7ac8', '#ffd43b', '#7af0e0', '#f3f1ea', '#ff9a3c'][v % 5],
  eyewear: v % 4 === 3 ? 'round' : undefined, hairdo: v % 3 === 2 ? 'bob' : undefined, hairColor: HAIR[v % 3],
  outfit: {jacket: ['#7a4fd0', '#2f8fd0', '#d0507a', '#3f9b6a', '#d08a2f'][v % 5], pants: ['#323744', '#3b4a66'][v % 2], boots: '#f3efe6', hat: v % 3 === 2 ? null : v % 3 === 0 ? 'cap' : 'hair', cap: ['#d0507a', '#2f8fd0'][v % 2],
    hair: HAIR[v % 4], skin: SKIN[(v + 2) % 5], build: v % 4 === 1 ? 'stout' : 'adult', noButtons: true}});

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

/** the paper face on its own, for photos, pegs and screens: centred on (cx, cy), r is its half-width */
export function drawMask(g: G2, cx: number, cy: number, r: number, kind: MaskKind) { paperMask(new Pen(g), cx, cy, r, kind, r / 36); }
/** a hood with two amber eyes, drawn flat: the hackers as an icon */
export function drawHood(g: G2, cx: number, cy: number, r: number, col = '#1f4a4f') {
  g.save(); g.lineJoin = 'round'; g.lineWidth = r * 0.1; g.strokeStyle = '#15121c'; g.fillStyle = col;
  g.beginPath(); g.moveTo(cx - r, cy + r * 0.95); g.bezierCurveTo(cx - r * 1.15, cy - r * 0.5, cx - r * 0.55, cy - r * 1.2, cx, cy - r * 1.22); g.bezierCurveTo(cx + r * 0.55, cy - r * 1.2, cx + r * 1.15, cy - r * 0.5, cx + r, cy + r * 0.95); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#06090b'; g.beginPath(); g.ellipse(cx, cy + r * 0.05, r * 0.66, r * 0.68, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#ffd76a'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.27, cy, r * 0.12, r * 0.17, 0, 0, 7); g.fill(); }
  g.restore();
}
