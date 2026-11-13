// The cast of the Nvidia exit short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only.
// Jensen Huang is a public figure and gets the series' simple caricature (white hair, rectangular glasses, a black leather
// jacket), with the same head at 15 (a diner apron and a paper hat, invented) and at 30 (a blue shirt, invented).
// His two co-founders are named on screen and drawn as stock figures: no likeness. The businesswoman is not named in this
// film and has a blank head with a question mark: what is said about her is a suspicion. The executive is never drawn.
// Officials, the spokesman, the board, the staff, the diner's people and the news crew are invented.
import * as THREE from 'three';
import {Pen, bodyFront, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, rrect, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'type' | 'wave' | 'push' | 'swing' | 'hush' | 'mask' | 'side';
export type Prop = 'paper' | 'phone' | 'card' | 'clip' | 'tub' | 'cups' | 'pot' | 'mic' | 'napkin' | 'plate' | null;
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round' | 'shades';
  front?: 'suit' | 'hoodie' | 'tee' | 'polo' | 'coat' | 'leather' | 'apron';
  /** a folded paper cap, the kind a diner's kitchen wears */
  paperhat?: boolean;
  /** a call-centre headset */
  headset?: boolean;
  /** tie colour ('none': an open collar) */
  tie?: string; shirt?: string;
  /** a staff badge on a ribbon of this colour (on a suit: a lapel pin) */
  lanyard?: string;
  /** a word across the chest */
  chest?: string;
  hairdo?: 'swept' | 'long' | 'bob';
  hairColor?: string;
  /** nobody's face: a blank head with a question mark */
  blank?: boolean;
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march'; phase?: number;
  /** the word on a card */ text?: string;
  /** a bigger card, for a word that has to be read from far away */ big?: boolean};

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
    case 'hush': hang(-1); A(1, 1.2 * Ta + 2 * u, 0.46, 0.1 * Ta, -0.1, true); break;                 // a finger to the lips
    case 'mask': hang(-1); A(1, 1.16 * Ta + 4 * u, 0.56, 0.5 * Ta, 0.7, true); break;                 // holding a stick up in front of the chest
    case 'side': hang(-1); A(1, 1.2 * Ta + 10 * u, 0.26, 1.3 * Ta + 22 * u, 0.1); break;               // holding a stick up beside the head
    default: both(hang);
  }
  return out;
}

// ---------- things held ----------
function drawProp(p: Pen, d: Draw, hands: P2[], u: number, look: Look) {
  const g = p.g, R = hands[1] ?? [430, 600], L = hands[0] ?? [170, 600], prop = d.prop ?? null, fist = (h: P2 = R) => p.dot(h[0], h[1], 5.5 * u);
  if (!prop) return;
  if (prop === 'card') {                                                                            // a card held up in both hands, with a word on it
    const kb = d.big ? 1.5 : 1, x = (L[0] + R[0]) / 2, y = Math.min(L[1], R[1]) - 14 * u * kb, w = (Math.abs(R[0] - L[0]) * 0.5 + 30 * u) * (d.big ? 1.3 : 1), h = 26 * u * kb, word = d.text ?? 'SORRY';
    p.rot = [-0.05, x, y]; p.poly(rounded(x - w, y - h, 2 * w, 2 * h, 5 * u), '#fffdf4', 2.6 * u); p.rot = null;
    g.save(); g.translate(x, y); g.rotate(-0.05); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e3342f';
    let px = 40 * u * kb; g.font = `400 ${px}px Anton, sans-serif`; const mw = g.measureText(word).width; if (mw > 1.7 * w) { px *= 1.7 * w / mw; g.font = `400 ${px}px Anton, sans-serif`; }
    g.fillText(word, 0, 2 * u); g.restore(); fist(L); fist(R);
  } else if (prop === 'clip') {                                                                     // a clipboard: paper forms
    const [x, y] = [R[0] + 2 * u, R[1] - 18 * u];
    p.rot = [0.12, x, y]; p.poly(rounded(x - 15 * u, y - 21 * u, 30 * u, 42 * u, 3 * u), '#8a6a3a', 2.2 * u); p.poly(rect(x - 12 * u, y - 16 * u, 24 * u, 34 * u), '#fffdf4', 1.2 * u);
    for (let i = 0; i < 4; i++) p.stroke([[x - 9 * u, y - 9 * u + i * 6 * u], [x + 9 * u, y - 9 * u + i * 6 * u]], 1.4 * u, '#8f8a96');
    p.poly(rect(x - 6 * u, y - 24 * u, 12 * u, 6 * u), '#c9ced6', 1.6 * u); p.rot = null; fist();
  } else if (prop === 'paper') {                                                                    // a sheet of paper with a letterhead
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u];
    p.rot = [0.18, x, y];
    p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    p.poly(rect(x - 13 * u, y - 19 * u, 26 * u, 7 * u), look.tie ?? '#b8232f', 0);
    for (let i = 0; i < 5; i++) p.stroke([[x - 12 * u, y - 2 * u + i * 5 * u], [x + (i === 4 ? 2 : 12) * u, y - 2 * u + i * 5 * u]], 1.5 * u, '#8f8a96');
    p.rot = null; fist();
  } else if (prop === 'phone') {
    p.poly(rounded(R[0] - 5 * u, R[1] - 15 * u, 10 * u, 24 * u, 2 * u), '#26262e', 1.8 * u); p.dot(R[0] + 3 * u, R[1] + 3 * u, 5 * u);
  } else if (prop === 'tub') {                                                                      // a bus tub in both hands, dirty dishes sticking out of it
    const x = (L[0] + R[0]) / 2, y = Math.max(L[1], R[1]) + 2 * u, w = 47 * u, h = 17 * u;
    for (let i = 0; i < 4; i++) p.poly(rounded(x - 34 * u, y - h - 9 * u - i * 5.4 * u, 34 * u, 5 * u, 2 * u), '#fffdf4', 1.5 * u);         // a pile of plates
    p.poly(rect(x + 8 * u, y - h - 22 * u, 15 * u, 20 * u), '#fffdf4', 1.6 * u); p.arc(x + 25 * u, y - h - 12 * u, 5 * u, 6 * u, -80, 80, 2.2 * u, '#15121c');   // a cup
    p.poly(rect(x + 26 * u, y - h - 14 * u, 4 * u, 12 * u), '#c9ced6', 1.2 * u);                                                                      // a fork
    p.poly([[x - w, y - h], [x + w, y - h], [x + w - 7 * u, y + h], [x - w + 7 * u, y + h]], '#8f96a8', 2.4 * u);
    p.poly(rounded(x - w - 3 * u, y - h - 4 * u, 2 * w + 6 * u, 8 * u, 3 * u), '#aab1c2', 2 * u); fist(L); fist(R);
  } else if (prop === 'cups') {                                                                     // a tray on one hand and far too many coffee cups on it
    const [x, y] = [R[0] + 2 * u, R[1] - 7 * u];
    p.ell(x, y, 30 * u, 6 * u, '#c9ced6', 2 * u);
    for (let i = 0; i < 9; i++) {
      const cx = x + 0.34 * u * i * i - 3 * u, cy = y - 10 * u - i * 13.4 * u;
      p.arc(cx + 12.5 * u, cy, 4.6 * u, 4.6 * u, -90, 90, 2.2 * u, '#15121c');
      p.poly([[cx - 11 * u, cy - 6.4 * u], [cx + 11 * u, cy - 6.4 * u], [cx + 9 * u, cy + 6.4 * u], [cx - 9 * u, cy + 6.4 * u]], i % 2 ? '#fff3d6' : '#fffdf4', 1.7 * u);
      p.stroke([[cx - 10 * u, cy - 3 * u], [cx + 10 * u, cy - 3 * u]], 1.5 * u, '#c8642c');
    }
    fist();
  } else if (prop === 'pot') {                                                                      // a glass coffee pot, tipped to pour
    const [x, y] = [R[0] - 8 * u, R[1] - 2 * u];
    p.rot = [-0.5, x, y];
    p.band([[x + 15 * u, y - 15 * u], [x + 25 * u, y - 4 * u], [x + 16 * u, y + 10 * u]], '#15121c', 5 * u, 0, 'round');
    p.ell(x, y, 17 * u, 16 * u, '#dfeaf2', 2.2 * u); p.poly([[x - 15 * u, y + 1 * u], [x + 15 * u, y + 1 * u], [x + 11 * u, y + 12 * u], [x - 11 * u, y + 12 * u]], '#4a2a16', 0); p.arc(x, y, 17 * u, 16 * u, 0, 360, 2.2 * u, '#15121c');
    p.poly(rect(x - 12 * u, y - 22 * u, 24 * u, 8 * u), '#e8553a', 1.8 * u); p.poly([[x - 12 * u, y - 20 * u], [x - 21 * u, y - 23 * u], [x - 12 * u, y - 15 * u]], '#e8553a', 1.6 * u);
    p.rot = null; fist();
  } else if (prop === 'mic') {                                                                      // a reporter's microphone with a plain cube on it
    const [x, y] = [R[0], R[1] - 3 * u];
    p.band([[x, y + 5 * u], [x - 2 * u, y - 26 * u]], '#2b2d38', 5 * u, 1.4 * u, 'round'); p.poly(rect(x - 10.5 * u, y - 31 * u, 17 * u, 14 * u), '#2f7fe0', 1.8 * u);
    p.ell(x - 2.4 * u, y - 40 * u, 8 * u, 9.5 * u, '#3a3f4a', 2 * u); fist();
  } else if (prop === 'plate') {                                                                    // a plate held up, clean
    const [x, y] = [R[0] + 2 * u, R[1] - 16 * u];
    p.ell(x, y, 22 * u, 22 * u, '#fffdf4', 2.2 * u); p.arc(x, y, 14 * u, 14 * u, 0, 360, 1.5 * u, '#c9ced6'); p.arc(x - 6 * u, y - 6 * u, 9 * u, 9 * u, 190, 260, 2 * u, '#9fd8ff'); fist();
  } else if (prop === 'napkin') {                                                                   // a paper napkin held up, a chip sketched on it in ballpoint
    const [x, y] = [R[0] + 3 * u, R[1] - 24 * u], blue = '#2a4fb0';
    p.rot = [0.1, x, y]; p.poly(rect(x - 25 * u, y - 25 * u, 50 * u, 50 * u), '#fffdf4', 2.2 * u);
    p.poly(rect(x - 11 * u, y - 11 * u, 22 * u, 22 * u), null, 0); g.lineWidth = 2 * u; g.strokeStyle = blue; g.strokeRect(x - 11 * u, y - 11 * u, 22 * u, 22 * u); g.strokeRect(x - 5 * u, y - 5 * u, 10 * u, 10 * u);
    for (let i = -1; i <= 1; i++) for (const sgn of [-1, 1]) { p.stroke([[x + i * 7 * u, y + sgn * 11 * u], [x + i * 7 * u, y + sgn * 17 * u]], 1.7 * u, blue); p.stroke([[x + sgn * 11 * u, y + i * 7 * u], [x + sgn * 17 * u, y + i * 7 * u]], 1.7 * u, blue); }
    p.rot = null; fist();
  }
}

// ---------- torso fronts ----------
function torsoFront(p: Pen, look: Look, g: FrontGeo) {
  const {tcx: x, Ta, chin, HH, u, torsoBot} = g, top = chin - 0.1 * HH;
  const vee = (w: number, depth: number, fill: string) => p.poly([[x - w * Ta, top], [x + w * Ta, top], [x, chin + depth * HH]], fill, 1.8 * u);
  const word = (s: string, y: number, size: number, col: string) => { const c = p.g; c.save(); c.font = `400 ${size * u}px Anton, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); };
  const strings = (len = 0.56) => { for (const s of [-1, 1]) { p.stroke([[x + s * 5 * u, chin + 0.26 * HH], [x + s * 6 * u, chin + len * HH]], 1.5 * u, '#f3f1ea'); p.dot(x + s * 6 * u, chin + (len + 0.01) * HH, 1.6 * u, '#f3f1ea'); } };
  const lanyard = (col: string) => {
    for (const s of [-1, 1]) p.stroke([[x + s * 0.34 * Ta, top + 2 * u], [x + 0.02 * Ta, chin + 0.52 * HH]], 2.6 * u, col);
    p.poly(rounded(x - 0.16 * Ta, chin + 0.52 * HH, 0.36 * Ta, 0.22 * HH, 2 * u), '#fffdf4', 1.4 * u);
    p.poly(rect(x - 0.1 * Ta, chin + 0.56 * HH, 0.1 * Ta, 0.08 * HH), '#9fb4c8', 0); p.stroke([[x + 0.04 * Ta, chin + 0.6 * HH], [x + 0.15 * Ta, chin + 0.6 * HH]], 1.3 * u, '#777');
    p.stroke([[x - 0.1 * Ta, chin + 0.69 * HH], [x + 0.14 * Ta, chin + 0.69 * HH]], 1.3 * u, '#777');
  };
  switch (look.front) {
    case 'leather': {                                                                               // a black leather jacket over a dark tee: the caricature's costume
      vee(0.5, 0.42, '#3a3b45');
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
    case 'apron': {                                                                                 // a diner uniform: a collar, a white bib apron, a pocket
      for (const s of [-1, 1]) p.poly([[x, chin + 0.16 * HH], [x + s * 0.42 * Ta, top], [x + s * 0.52 * Ta, chin + 0.12 * HH], [x + s * 0.14 * Ta, chin + 0.28 * HH]], look.shirt ?? '#fff3d6', 1.6 * u);
      for (const s of [-1, 1]) { p.stroke([[x + s * 0.56 * Ta, top + 3 * u], [x + s * 0.44 * Ta, chin + 0.38 * HH]], 5 * u, '#15121c'); p.stroke([[x + s * 0.56 * Ta, top + 3 * u], [x + s * 0.44 * Ta, chin + 0.38 * HH]], 2.8 * u, '#fffdf4'); }
      p.poly([[x - 0.52 * Ta, chin + 0.36 * HH], [x + 0.52 * Ta, chin + 0.36 * HH], [x + 0.66 * Ta, torsoBot], [x - 0.66 * Ta, torsoBot]], '#fffdf4', 1.8 * u);
      p.poly(rect(x - 0.24 * Ta, chin + 0.64 * HH, 0.48 * Ta, 0.2 * HH), null, 1.4 * u);
      break;
    }
    case 'suit': {
      vee(0.46, 0.56, look.shirt ?? '#fbfaf5');
      const tie = look.tie ?? '#2b2d3a', end = chin + 0.5 * HH;
      if (tie !== 'none') {
        p.poly([[x - 5 * u, top + 4 * u], [x + 5 * u, top + 4 * u], [x + 3.4 * u, chin + 0.08 * HH], [x - 3.4 * u, chin + 0.08 * HH]], tie, 1.5 * u);
        p.poly([[x - 3.4 * u, chin + 0.08 * HH], [x + 3.4 * u, chin + 0.08 * HH], [x + 6.5 * u, end - 6 * u], [x, end], [x - 6.5 * u, end - 6 * u]], tie, 1.5 * u);
      } else p.stroke([[x - 0.2 * Ta, top + 2 * u], [x, chin + 0.2 * HH], [x + 0.2 * Ta, top + 2 * u]], 1.6 * u);
      for (const s of [-1, 1]) {
        p.stroke([[x + s * 0.46 * Ta, top], [x + s * 0.2 * Ta, chin + 0.32 * HH], [x, chin + 0.56 * HH]], 1.8 * u);
        p.stroke([[x + s * 0.72 * Ta, chin + 0.1 * HH], [x + s * 0.2 * Ta, chin + 0.32 * HH]], 1.5 * u);     // lapel notch
      }
      p.stroke([[x, chin + 0.56 * HH], [x, torsoBot]], 1.5 * u);
      if (look.lanyard) p.poly(rounded(x + 0.3 * Ta, chin + 0.36 * HH, 0.3 * Ta, 0.13 * HH, 1.5 * u), look.lanyard, 1.3 * u);   // a lapel pin
      break;
    }
    case 'hoodie': {                                                                                // a cardigan or a hoodie over a shirt
      p.poly([[x - 0.5 * Ta, top], [x + 0.5 * Ta, top], [x + 0.3 * Ta, chin + 0.2 * HH], [x, chin + 0.3 * HH], [x - 0.3 * Ta, chin + 0.2 * HH]], look.shirt ?? '#d9d6cf', 1.8 * u);
      if (look.lanyard) lanyard(look.lanyard); else { strings(); p.poly(rounded(x - 0.52 * Ta, chin + 0.68 * HH, 1.04 * Ta, 0.22 * HH, 3 * u), null, 1.5 * u); }
      break;
    }
    case 'tee': {
      if (look.lanyard) lanyard(look.lanyard);
      else if (look.chest) word(look.chest, chin + 0.46 * HH, 15, look.shirt ?? '#f3f1ea');
      else p.poly([[x, chin + 0.3 * HH], [x + 0.26 * Ta, chin + 0.48 * HH], [x, chin + 0.66 * HH], [x - 0.26 * Ta, chin + 0.48 * HH]], look.shirt ?? '#f3f1ea', 1.5 * u);   // a plain diamond print
      break;
    }
    case 'polo': {                                                                                  // uniform polo: collar, placket, a word across the chest
      const collar = look.shirt ?? '#f3f1ea';
      for (const s of [-1, 1]) p.poly([[x, chin + 0.18 * HH], [x + s * 0.44 * Ta, top], [x + s * 0.54 * Ta, chin + 0.14 * HH], [x + s * 0.14 * Ta, chin + 0.32 * HH]], collar, 1.6 * u);
      p.stroke([[x, chin + 0.22 * HH], [x, chin + 0.4 * HH]], 1.5 * u);
      if (look.chest) word(look.chest, chin + 0.58 * HH, 13.5, '#ffffff');
      break;
    }
    case 'coat': {                                                                                 // a trench coat: wide lapels, a belt, two rows of buttons
      vee(0.5, 0.48, look.shirt ?? '#2b2d3a');
      for (const s of [-1, 1]) p.poly([[x + s * 0.5 * Ta, top], [x + s * 0.9 * Ta, chin + 0.14 * HH], [x + s * 0.24 * Ta, chin + 0.4 * HH], [x, chin + 0.48 * HH]], look.outfit.jacket, 1.7 * u);
      p.stroke([[x, chin + 0.48 * HH], [x, torsoBot]], 1.5 * u);
      p.poly(rect(x - 0.95 * Ta, chin + 0.74 * HH, 1.9 * Ta, 0.1 * HH), '#8a6a3a', 1.5 * u); p.poly(rect(x - 0.13 * Ta, chin + 0.72 * HH, 0.26 * Ta, 0.14 * HH), '#e7c56a', 1.4 * u);
      for (const s of [-1, 1]) for (const yy of [0.58, 0.94]) p.dot(x + s * 0.32 * Ta, chin + yy * HH, 2.2 * u, '#4a3a22');
      break;
    }
    default:
  }
}

// ---------- hair, hoods, glasses ----------
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
  if (ew === 'shades') {
    for (const s of [-1, 1]) {
      p.poly(rounded(cx + s * 13.8 * u - 12 * u, hc - 9 * u, 24 * u, 15.5 * u, 4 * u), '#15121c', 2 * u);
      p.stroke([[cx + s * 13.8 * u - 7.5 * u, hc - 5 * u], [cx + s * 13.8 * u - 1.5 * u, hc - 5 * u]], 1.7 * u, '#8f96ad');
      p.stroke([[cx + s * 25 * u, hc - 4.5 * u], [cx + s * (a / u - 2) * u, hc - 6.5 * u]], 2.4 * u, '#15121c');
    }
    p.stroke([[cx - 2.6 * u, hc - 4.5 * u], [cx + 2.6 * u, hc - 4.5 * u]], 3 * u, '#15121c');
  }
  if (look.paperhat) {                                                                             // a folded paper cap with a coloured band, sitting on the hair
    const y0 = hc - 0.98 * b;
    p.poly([[cx - 0.66 * a, y0], [cx + 0.66 * a, y0], [cx + 0.52 * a, y0 - 0.46 * b], [cx - 0.52 * a, y0 - 0.46 * b]], '#fffdf4', 2.8 * u); p.poly(rect(cx - 0.66 * a, y0 - 0.13 * b, 1.32 * a, 0.13 * b), '#e8553a', 1.6 * u);
  }
  if (look.headset) {                                                                              // a band over the head, a cup on one ear, a microphone
    const band: P2[] = []; for (let i = 0; i <= 16; i++) { const t = Math.PI * (1.08 + 0.84 * (i / 16)); band.push([cx + 1.1 * a * Math.cos(t), hc + 1.14 * b * Math.sin(t)]); }
    p.stroke(band, 5.6 * u, '#15121c'); p.stroke(band, 2.6 * u, '#5a6072');
    p.poly(rounded(cx + 0.9 * a, hc - 0.3 * b, 0.28 * a, 0.64 * b, 3 * u), '#2b2f3a', 2.2 * u);
    p.stroke(curve([cx + 1.04 * a, hc + 0.3 * b], [cx + 0.96 * a, hc + 0.68 * b], [cx + 0.56 * a, hc + 0.64 * b]), 2.6 * u, '#15121c');
    p.ell(cx + 0.54 * a, hc + 0.64 * b, 3.8 * u, 3.2 * u, '#15121c', 0);
  }
}

/** No features at all, and a question mark: somebody who has been accused and not tried, or who has not been identified. */
function blankFace(p: Pen, h: HeadGeo, skin: string) {
  const {cx, hc, a, b} = h, g = p.g;
  p.ell(cx, hc + 0.1 * b, 0.82 * a, 0.78 * b, skin, 0);
  g.save(); g.font = `400 ${1.3 * b}px Anton, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#4a4560'; g.fillText('?', cx, hc + 0.16 * b); g.restore();
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
    onHead: (pen, h) => {
      if (look.blank) blankFace(pen, h, look.outfit.skin ?? NOBODY);
      onHead(pen, look, h);
    },
  });
  drawProp(p, d, hands, unit, look);
  g.restore();
}

// ---------- the people ----------
const SKIN = ['#ffe2c2', '#c99067', '#f5c9a0', '#8a5a3c', '#ecd0b6'], HAIR = ['#3b271c', '#241c18', '#5c3c24', '#a8643a'];
const NOBODY = '#cfcadb';
/** Jensen Huang, a public figure: the series' caricature. 0 today (white hair, rectangular glasses, black leather jacket);
 *  1 in 1993, at 30 (dark hair, a blue shirt: invented); 2 in 1978, at 15 (a diner apron and a paper cap: invented). One head for all three. */
export const JENSEN = (v = 0): Look => v === 0
  ? {id: 'jensen0', seed: 4, eyewear: 'rect', front: 'leather', hairdo: 'swept', hairColor: '#f4f3ee', outfit: {jacket: '#1d1d24', pants: '#26262f', boots: '#131318', hat: null, skin: '#f4cfa8', build: 'adult', noButtons: true}}
  : v === 1
    ? {id: 'jensen1', seed: 4, eyewear: 'rect', front: 'polo', shirt: '#e9eef6', hairdo: 'swept', hairColor: '#1f1b24', outfit: {jacket: '#4f86d6', pants: '#3b3f4d', boots: '#2b2b33', hat: null, skin: '#f4cfa8', build: 'adult', noButtons: true}}
    : {id: 'jensen2', seed: 4, eyewear: 'rect', front: 'apron', shirt: '#fff3d6', paperhat: true, hairdo: 'swept', hairColor: '#1f1b24', outfit: {jacket: '#c8642c', pants: '#4a3a30', boots: '#2b2b33', hat: null, skin: '#f4cfa8', build: 'kid', noButtons: true}};
/** The two co-founders, Chris Malachowsky and Curtis Priem: named on screen, drawn as stock figures in invented clothes. No likeness. */
export const ENGINEER = (v = 0): Look => ({id: 'eng' + v, seed: 37 + v * 8, front: v ? 'hoodie' : 'polo', shirt: v ? '#f3f1ea' : '#f1ead8', hairdo: 'swept', hairColor: v ? '#5c3c24' : '#3b271c', eyewear: v ? 'round' : undefined,
  outfit: {jacket: v ? '#8a5a3c' : '#3f8a55', pants: '#3b3f4d', boots: '#2b2b33', hat: null, skin: SKIN[v ? 0 : 4], build: v ? 'stout' : 'adult', noButtons: true}});
/** The businesswoman: not named in this film. A blank head with a question mark; what is said about her is a suspicion. */
export const WOMAN: Look = {id: 'woman', seed: 9, front: 'suit', tie: 'none', shirt: '#fbfaf5', hairdo: 'bob', hairColor: '#2b2330', blank: true,
  outfit: {jacket: '#2f8f8a', pants: '#2b2f3a', boots: '#15161b', hat: null, skin: NOBODY, build: 'adult', noButtons: true}};
/** Diner staff and guests: invented. */
export const WAITER: Look = {id: 'waiter', seed: 95, front: 'apron', shirt: '#fff3d6', hairdo: 'long', hairColor: '#a8643a',
  outfit: {jacket: '#1f8f96', pants: '#2b2f3a', boots: '#15161b', hat: null, skin: SKIN[0], build: 'adult', noButtons: true}};
export const GUEST = (v = 0): Look => ({id: 'guest' + v, seed: 141 + v * 7, front: v % 2 ? 'tee' : 'hoodie', shirt: '#f3f1ea', hairdo: v % 2 ? 'long' : 'swept', hairColor: HAIR[(v + 2) % 4],
  outfit: {jacket: ['#b8552f', '#6a8f3a', '#8a5aa8'][v % 3], pants: '#3b3f4d', boots: '#2b2b33', hat: null, skin: SKIN[(v * 2 + 1) % 5], build: v % 2 ? 'adult' : 'stout', noButtons: true}});
/** U.S. officials: invented. */
export const OFFICIAL = (v = 0): Look => ({id: 'official' + v, seed: 71 + v * 6, front: 'suit', tie: v ? '#8a2f3d' : '#2f4a7a', shirt: '#fbfaf5', hairdo: v ? 'long' : 'swept', hairColor: v ? '#3b271c' : '#b9bcc6', lanyard: '#c9a23a', eyewear: v ? undefined : 'rect',
  outfit: {jacket: v ? '#3b3f4d' : '#24304f', pants: v ? '#3b3f4d' : '#24304f', boots: '#15161b', hat: null, skin: SKIN[v ? 3 : 0], build: 'adult', noButtons: true}});
/** A spokesman at a foreign-ministry lectern: a stock figure, no likeness of the man who made the statement. */
export const SPOKESMAN: Look = {id: 'spokesman', seed: 17, front: 'suit', tie: '#b8232f', shirt: '#fbfaf5', hairdo: 'swept', hairColor: '#1f1c1e', eyewear: 'round',
  outfit: {jacket: '#2b2d3a', pants: '#2b2d3a', boots: '#15161b', hat: null, skin: SKIN[2], build: 'adult', noButtons: true}};
/** The official at the Justice Department's lectern: a stock figure, no likeness of the attorney general. */
export const ATTORNEY: Look = {id: 'attorney', seed: 201, front: 'suit', tie: '#2f5fa8', shirt: '#fbfaf5', hairdo: 'swept', hairColor: '#5c3c24',
  outfit: {jacket: '#2b3348', pants: '#2b3348', boots: '#15161b', hat: null, skin: SKIN[0], build: 'stout', noButtons: true}};
/** The board: invented people. */
export const BOARD = (v = 0): Look => ({id: 'board' + v, seed: 161 + v * 5, front: 'suit', tie: v % 2 ? 'none' : ['#8a2f3d', '#2f5fa8', '#3f7a52'][v % 3], shirt: '#fbfaf5', hairdo: v % 2 ? 'bob' : 'swept', hairColor: ['#b9b6bd', '#3a2a20', '#d9d6cf', '#5c3c24', '#8a8690'][v % 5], eyewear: v % 3 === 0 ? 'rect' : undefined,
  outfit: {jacket: ['#3b4252', '#4a3f38', '#2f3f4f', '#5a4a6a', '#3a4a44'][v % 5], pants: '#2b2f3a', boots: '#15161b', hat: null, skin: SKIN[(v * 3) % 5], build: v % 3 === 2 ? 'stout' : 'adult', noButtons: true}});
/** Employees: invented. */
export const STAFF = (v = 0): Look => ({id: 'staff' + v, seed: 91 + v * 9, front: v % 2 ? 'hoodie' : 'tee', shirt: ['#f3f1ea', '#d9d6cf', '#f3f1ea'][v % 3], lanyard: '#76b900', hairdo: v % 3 === 1 ? 'long' : v % 3 === 2 ? 'bob' : 'swept', hairColor: HAIR[v % 4], eyewear: v % 4 === 3 ? 'round' : undefined,
  outfit: {jacket: ['#4f6fa8', '#7a5c9a', '#b08a3a', '#3f8a55', '#b8552f'][v % 5], pants: '#2b2f3a', boots: '#15161b', hat: null, skin: SKIN[(v * 2) % 5], build: 'adult', noButtons: true}});
/** A television reporter: invented. */
export const REPORTER: Look = {id: 'reporter', seed: 121, front: 'coat', shirt: '#3a3f4a', hairdo: 'long', hairColor: '#3b271c',
  outfit: {jacket: '#c9a86a', pants: '#3b3552', boots: '#15161b', hat: null, skin: SKIN[1], build: 'adult', noButtons: true}};

// ---------- billboards ----------
const cache = new Map<string, THREE.CanvasTexture>();
/** a figure that holds something out to one side needs a wider sheet of paper, or the thing is cut off at its edge */
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
};
export type ActorOpt = {scale?: number; res?: number; shadow?: number; still?: boolean; phase?: number; /** a wider drawing: for things held out to the side */ wide?: boolean};
export function actor(parent: Node, look: Look, states: Record<string, Draw>, x: number, y: number, z: number, o: ActorOpt = {}): Actor {
  const scale = o.scale ?? 1, res = o.res ?? 0.7, node = new THREE.Group(); node.position.set(x, y, z); parent.add(node);
  const blinks = !look.blank;
  const maps = new Map<string, [THREE.Texture, THREE.Texture]>();
  const wide = !!o.wide;
  for (const [k, d] of Object.entries(states)) maps.set(k, [texture(look, d, res, wide), blinks ? texture(look, {...d, blink: true}, res, wide) : texture(look, d, res, wide)]);
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

export {INK};
