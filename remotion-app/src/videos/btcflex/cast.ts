// The cast of the bitcoin flex short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only: a hoodie, a robe, a jacket with three letters.
// Malone Lam has pleaded guilty and is named; he is drawn as the house's stock figure in an invented costume (a pink hoodie,
// a chain with a dollar sign for his alias "$$$"): no likeness of him. His crew, some of whom have not been tried, and the
// investigator nobody has seen get a blank head with a question mark. The agents, the judge, the prosecutor, the lawyer and the
// club staff are invented. The man who was robbed is never drawn.
import * as THREE from 'three';
import {Pen, bodyFront, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, rrect, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'type' | 'wave' | 'push' | 'swing' | 'hush' | 'mask' | 'side';
export type Prop = 'paper' | 'phone' | 'key' | 'card' | 'flowers' | 'cash' | 'heart' | 'megaphone' | 'clip' | 'burger' | 'mask' | 'lens' | 'selfie' | 'bottle' | null;
/** the face in a hood */
export type Emo = 'sad' | 'flat' | 'evil' | 'happy' | 'cash' | 'oh';
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round' | 'shades';
  front?: 'suit' | 'hoodie' | 'tee' | 'polo' | 'scrubs' | 'uniform' | 'robe' | 'coat';
  /** a gold chain with a dollar sign */
  chain?: boolean;
  /** a call-centre headset */
  headset?: boolean;
  /** tie colour */
  tie?: string; shirt?: string;
  /** a staff badge on a ribbon of this colour (on a suit: a lapel pin) */
  lanyard?: string;
  /** a word across the chest */
  chest?: string;
  hairdo?: 'swept' | 'long' | 'bob';
  hairColor?: string;
  /** nobody's face: a blank head with a question mark */
  blank?: boolean;
  /** the hood is up and there is no face in it */
  hood?: boolean;
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march'; phase?: number;
  /** the face in the hood */ emo?: Emo;
  /** a paper halo on a wire */ halo?: 'on' | 'askew';
  /** the word on a card */ text?: string;
  /** a bigger card, for a word that has to be read from far away */ big?: boolean;
  /** what the paper face wears on its forehead */ badge?: 'shield' | 'coin'};

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
  } else if (prop === 'flowers') {                                                                  // a bunch of flowers in paper
    const [x, y] = [R[0] + 4 * u, R[1] - 6 * u], cols = ['#ff6b9a', '#ffd43b', '#ff8a3c', '#ffffff', '#ff6b9a'];
    p.poly([[x - 5 * u, y + 12 * u], [x + 5 * u, y + 12 * u], [x + 21 * u, y - 30 * u], [x - 21 * u, y - 30 * u]], '#fff3d6', 2.2 * u);
    ([[-15, -36], [0, -45], [15, -36], [-7, -29], [8, -28]] as P2[]).forEach(([dx, dy], i) => { p.ell(x + dx * u, y + dy * u, 9 * u, 9 * u, cols[i], 1.8 * u); p.dot(x + dx * u, y + dy * u, 3 * u, '#7a4a12'); });
    fist();
  } else if (prop === 'cash') {                                                                     // a fan of banknotes
    const [x, y] = [R[0] + 2 * u, R[1] - 6 * u];
    for (const a of [-0.55, -0.18, 0.2]) { p.rot = [a, x, y + 8 * u]; p.poly(rect(x - 9.5 * u, y - 36 * u, 19 * u, 42 * u), '#62b77e', 2 * u); p.ell(x, y - 15 * u, 5 * u, 7.5 * u, '#dff3e2', 1.2 * u); p.rot = null; }
    fist();
  } else if (prop === 'heart') {                                                                    // a paper heart on a stick
    const [x, y] = [R[0] + 3 * u, R[1] - 30 * u], k = 1.45 * u, pts: P2[] = [];
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([x + k * 16 * Math.sin(t) ** 3, y - k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
    p.band([[R[0], R[1] + 4 * u], [x, y + 14 * u]], '#c9ced6', 3.2 * u, 1.2 * u, 'round'); p.poly(pts, '#e3342f', 2.4 * u); p.arc(x - 9 * u, y - 7 * u, 6 * u, 6 * u, 180, 265, 2.4 * u, '#ffffff'); fist();
  } else if (prop === 'megaphone') {
    const [x, y] = [R[0], R[1] - 4 * u];
    p.poly([[x - 4 * u, y - 5 * u], [x + 30 * u, y - 21 * u], [x + 30 * u, y + 17 * u], [x - 4 * u, y + 5 * u]], '#f2c230', 2.4 * u); p.poly(rect(x + 30 * u, y - 24 * u, 5.5 * u, 44 * u), '#e3342f', 2 * u); fist();
  } else if (prop === 'burger') {                                                                   // a burger, half eaten
    const [x, y] = [R[0] + 2 * u, R[1] - 13 * u];
    p.ell(x, y + 8 * u, 17 * u, 7 * u, '#d9a45a', 2 * u); p.poly(rect(x - 17 * u, y - 1 * u, 34 * u, 7 * u), '#6a3d24', 1.6 * u); p.poly(rect(x - 18.5 * u, y - 4.5 * u, 37 * u, 4 * u), '#6fbf5a', 1.2 * u);
    p.ell(x, y - 9 * u, 17.5 * u, 10 * u, '#e0b06a', 2 * u); fist();
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
  } else if (prop === 'selfie') {                                                                   // a phone held up at arm's length, its back to us
    const [x, y] = [R[0] + 1 * u, R[1] - 12 * u];
    p.rot = [0.1, x, y]; p.poly(rounded(x - 8.5 * u, y - 15 * u, 17 * u, 30 * u, 3.5 * u), '#26262e', 2 * u); p.ell(x - 3 * u, y - 9.5 * u, 2.6 * u, 2.6 * u, '#5a6072', 1 * u); p.dot(x + 2.8 * u, y - 10.5 * u, 1.3 * u, '#fff3c0'); p.rot = null; fist();
  } else if (prop === 'bottle') {                                                                   // a big bottle held up, a sparkler's wire in its neck (the spark itself is a light in the set)
    const [x, y] = [R[0] + 1 * u, R[1] - 8 * u];
    p.poly(rect(x - 3 * u, y - 40 * u, 6 * u, 16 * u), '#1f6b3a', 1.8 * u); p.poly(rounded(x - 7 * u, y - 26 * u, 14 * u, 34 * u, 4 * u), '#1f6b3a', 2 * u);
    p.poly(rect(x - 3.4 * u, y - 43 * u, 6.8 * u, 5.5 * u), '#f2c230', 1.4 * u); p.poly(rect(x - 7 * u, y - 15 * u, 14 * u, 9 * u), '#fff3c0', 1.2 * u);
    p.stroke([[x, y - 43 * u], [x, y - 56 * u]], 1.5 * u, '#8f8a96'); fist();
  } else if (prop === 'lens') {                                                                     // a magnifying glass
    const [x, y] = [R[0] + 7 * u, R[1] - 24 * u];
    p.band([[R[0], R[1] + 2 * u], [x - 6 * u, y + 10 * u]], '#5a3e28', 4.6 * u, 1.4 * u, 'round');
    g.globalAlpha = 0.4; p.ell(x, y, 12.5 * u, 12.5 * u, '#bfe6ff', 0); g.globalAlpha = 1; p.arc(x, y, 12.5 * u, 12.5 * u, 0, 360, 3.4 * u, '#15121c'); fist();
  } else if (prop === 'mask') {                                                                     // a friendly paper face on a stick, with a label: who the caller says he is
    const x = R[0] + 3 * u, y = R[1] - 42 * u, r = 21 * u, label = d.text ?? 'SECURITY TEAM', coinFace = d.badge === 'coin', bg = coinFace ? '#f2a516' : '#2f7fe0';
    p.band([[R[0], R[1] + 4 * u], [x, y + r]], '#c9a27a', 3.6 * u, 1.3 * u, 'round');
    p.ell(x, y, r, r, '#fffdf4', 2.4 * u);
    for (const sgn of [-1, 1]) p.arc(x + sgn * 8 * u, y + 1 * u, 5.2 * u, 5.2 * u, 200, 340, 2.5 * u, '#15121c');                 // smiling eyes
    p.arc(x, y + 5 * u, 10 * u, 8 * u, 20, 160, 2.5 * u, '#15121c');                                                              // and a smile
    if (coinFace) { p.ell(x, y - 13 * u, 5.4 * u, 5.4 * u, '#f2c230', 1.5 * u); g.save(); g.font = `400 ${8 * u}px Anton, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7a5208'; g.fillText('$', x, y - 12.6 * u); g.restore(); }
    else p.poly([[x - 5 * u, y - 18 * u], [x + 5 * u, y - 18 * u], [x + 5 * u, y - 12 * u], [x, y - 7.5 * u], [x - 5 * u, y - 12 * u]], '#2f7fe0', 1.5 * u);
    const w = 31 * u, h = 8.5 * u, ly = y + r + 7 * u;
    p.poly(rounded(x - w, ly - h, 2 * w, 2 * h, 3 * u), bg, 2.2 * u);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = coinFace ? '#15121c' : '#ffffff';
    let px = 12.5 * u; g.font = `400 ${px}px Anton, sans-serif`; const mw = g.measureText(label).width; if (mw > 1.8 * w) { px *= 1.8 * w / mw; g.font = `400 ${px}px Anton, sans-serif`; }
    g.fillText(label, x, ly + 0.6 * u); g.restore(); fist();
  } else if (prop === 'key') {                                                                      // a key held up
    const [x, y] = [R[0] + 3 * u, R[1] - 20 * u], gold = '#f2c230';
    p.poly(rect(x - 3.5 * u, y - 4 * u, 7 * u, 32 * u), gold, 1.8 * u); for (const dy of [16, 23]) p.poly(rect(x + 3.5 * u, y + dy * u, 9 * u, 4.5 * u), gold, 1.6 * u);
    p.ell(x, y - 15 * u, 14 * u, 14 * u, gold, 2.2 * u); p.ell(x, y - 15 * u, 5 * u, 5 * u, '#3a2c08', 0); fist();
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
    case 'suit': {
      vee(0.46, 0.56, look.shirt ?? '#fbfaf5');
      const tie = look.tie ?? '#2b2d3a', end = chin + 0.5 * HH;
      p.poly([[x - 5 * u, top + 4 * u], [x + 5 * u, top + 4 * u], [x + 3.4 * u, chin + 0.08 * HH], [x - 3.4 * u, chin + 0.08 * HH]], tie, 1.5 * u);
      p.poly([[x - 3.4 * u, chin + 0.08 * HH], [x + 3.4 * u, chin + 0.08 * HH], [x + 6.5 * u, end - 6 * u], [x, end], [x - 6.5 * u, end - 6 * u]], tie, 1.5 * u);
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
    case 'scrubs': {                                                                               // hospital scrubs: a V neck over a white tee, a pocket, a badge
      vee(0.42, 0.3, look.shirt ?? '#f3f1ea');
      p.poly(rect(x + 0.22 * Ta, chin + 0.44 * HH, 0.44 * Ta, 0.2 * HH), null, 1.5 * u);
      if (look.lanyard) lanyard(look.lanyard);
      break;
    }
    case 'uniform': {                                                                              // a crew uniform: zip, a bright band, a word on the chest
      p.stroke([[x, top], [x, torsoBot]], 1.6 * u);
      p.poly(rect(x - 0.8 * Ta, chin + 0.5 * HH, 1.6 * Ta, 0.13 * HH), look.shirt ?? '#d7ff4a', 1.4 * u);
      if (look.chest) word(look.chest, chin + 0.32 * HH, 13, '#ffffff');
      break;
    }
    case 'polo': {                                                                                  // uniform polo: collar, placket, a word across the chest
      const collar = look.shirt ?? '#f3f1ea';
      for (const s of [-1, 1]) p.poly([[x, chin + 0.18 * HH], [x + s * 0.44 * Ta, top], [x + s * 0.54 * Ta, chin + 0.14 * HH], [x + s * 0.14 * Ta, chin + 0.32 * HH]], collar, 1.6 * u);
      p.stroke([[x, chin + 0.22 * HH], [x, chin + 0.4 * HH]], 1.5 * u);
      if (look.chest) word(look.chest, chin + 0.58 * HH, 13.5, '#ffffff');
      break;
    }
    case 'robe': {                                                                                 // a judge's robe: black to the neck, a white collar
      p.poly([[x - 0.3 * Ta, top], [x + 0.3 * Ta, top], [x + 0.13 * Ta, chin + 0.3 * HH], [x, chin + 0.2 * HH], [x - 0.13 * Ta, chin + 0.3 * HH]], '#fbfaf5', 1.6 * u);
      p.stroke([[x, chin + 0.3 * HH], [x, torsoBot]], 1.5 * u, '#3a3442');
      for (const s of [-1, 1]) p.stroke([[x + s * 0.5 * Ta, chin + 0.32 * HH], [x + s * 0.44 * Ta, torsoBot]], 1.3 * u, '#3a3442');
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
  if (look.chain) {                                                                                 // a gold chain, a dollar sign hanging from it
    const gold = '#f2c230', my = chin + 0.58 * HH;
    for (const s of [-1, 1]) { const pts = curve([x + s * 0.36 * Ta, top + 2 * u], [x + s * 0.24 * Ta, chin + 0.36 * HH], [x, my - 5 * u]); p.stroke(pts, 4.6 * u, '#15121c'); p.stroke(pts, 2.4 * u, gold); }
    p.ell(x, my, 7.6 * u, 7.6 * u, gold, 1.8 * u);
    const c = p.g; c.save(); c.font = `400 ${11.5 * u}px Anton, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#7a5208'; c.fillText('$', x, my + 0.6 * u); c.restore();
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
  if (look.headset) {                                                                              // a band over the head, a cup on one ear, a microphone
    const band: P2[] = []; for (let i = 0; i <= 16; i++) { const t = Math.PI * (1.08 + 0.84 * (i / 16)); band.push([cx + 1.1 * a * Math.cos(t), hc + 1.14 * b * Math.sin(t)]); }
    p.stroke(band, 5.6 * u, '#15121c'); p.stroke(band, 2.6 * u, '#5a6072');
    p.poly(rounded(cx + 0.9 * a, hc - 0.3 * b, 0.28 * a, 0.64 * b, 3 * u), '#2b2f3a', 2.2 * u);
    p.stroke(curve([cx + 1.04 * a, hc + 0.3 * b], [cx + 0.96 * a, hc + 0.68 * b], [cx + 0.56 * a, hc + 0.64 * b]), 2.6 * u, '#15121c');
    p.ell(cx + 0.54 * a, hc + 0.64 * b, 3.8 * u, 3.2 * u, '#15121c', 0);
  }
}

const GLOW = '#8dff7a';
/** A raised hood with nobody's face in it: a dark opening and a face made of green dots, the way a terminal would draw one. */
function cowl(p: Pen, h: HeadGeo, col: string, emo: Emo) {
  const {cx, hc, a, b, u} = h, g = p.g, out: P2[] = [];
  for (let i = 0; i <= 28; i++) { const t = Math.PI * (0.92 + 1.16 * (i / 28)); out.push([cx + 1.27 * a * Math.cos(t), hc - 0.02 * b + (1.25 + 0.12 * Math.exp(-((i - 14) ** 2) / 10)) * b * Math.sin(t)]); }   // a little peak on top
  out.push([cx + 1.12 * a, hc + 0.98 * b], [cx + 0.6 * a, hc + 1.22 * b], [cx - 0.6 * a, hc + 1.22 * b], [cx - 1.12 * a, hc + 0.98 * b]);
  p.shadedFill(out, col, '#120e1c', -2.1, a * 1.3, 0.45); p.poly(out, null, 4.2 * u);
  p.ell(cx, hc + 0.12 * b, 0.82 * a, 0.82 * b, '#07090c', 2.6 * u);
  const ex = 0.33 * a, ey = hc + 0.0 * b, my = hc + 0.44 * b, s = 0.085 * a;
  g.save(); g.fillStyle = GLOW; g.strokeStyle = GLOW; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 2 * s; g.shadowColor = GLOW; g.shadowBlur = 0.3 * a;
  const eye = (x: number) => { g.beginPath(); g.rect(x - s * 1.35, ey - s * 1.6, s * 2.7, s * 3.2); g.fill(); };
  if (emo === 'cash') { g.font = `400 ${0.56 * b}px Anton, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const d of [-1, 1]) g.fillText('$', cx + d * ex, ey + 0.02 * b); }
  else if (emo === 'happy') for (const d of [-1, 1]) { g.beginPath(); g.moveTo(cx + d * ex - 2.2 * s, ey + s); g.lineTo(cx + d * ex, ey - 1.4 * s); g.lineTo(cx + d * ex + 2.2 * s, ey + s); g.stroke(); }
  else { eye(cx - ex); eye(cx + ex); }
  if (emo === 'evil') for (const d of [-1, 1]) { g.beginPath(); g.moveTo(cx + d * (ex + 2.8 * s), ey - 4.8 * s); g.lineTo(cx + d * (ex - 2.4 * s), ey - 2.4 * s); g.stroke(); }
  g.beginPath();
  if (emo === 'sad') { g.moveTo(cx - 3.2 * s, my + 1.6 * s); g.lineTo(cx, my - 1.2 * s); g.lineTo(cx + 3.2 * s, my + 1.6 * s); }                       // the "<" of ":<", stood upright
  else if (emo === 'flat') { g.moveTo(cx - 2.8 * s, my); g.lineTo(cx + 2.8 * s, my); }
  else if (emo === 'oh') g.rect(cx - 1.5 * s, my - 1.6 * s, 3 * s, 3.2 * s);
  else { g.moveTo(cx - 3.4 * s, my - 1.2 * s); g.lineTo(cx - 1.6 * s, my + 1.2 * s); g.lineTo(cx + 1.6 * s, my + 1.2 * s); g.lineTo(cx + 3.4 * s, my - 1.2 * s); }
  g.stroke(); g.restore();
}
/** a paper halo on a wire, the kind a school play has */
function haloRing(p: Pen, h: HeadGeo, askew: boolean) {
  const {cx, hc, a, b, u} = h, g = p.g, x = cx + (askew ? 0.62 * a : 0), y = hc - (askew ? 1.3 : 1.56) * b;
  p.stroke([[cx + 0.62 * a, hc - 1.02 * b], [x + 0.5 * a, y + 0.1 * b]], 1.7 * u, '#8f8a96');
  g.save(); g.translate(x, y); g.rotate(askew ? 0.55 : -0.06);
  for (const [lw, c] of [[9.5 * u, '#15121c'], [5.4 * u, '#ffd84a']] as const) { g.beginPath(); g.ellipse(0, 0, 0.9 * a, 0.24 * b, 0, 0, 7); g.lineWidth = lw; g.strokeStyle = c; g.stroke(); }
  g.restore();
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
      onHead(pen, look, h);
      if (look.blank) blankFace(pen, h, look.outfit.skin ?? NOBODY);
      if (look.hood) { cowl(pen, h, look.outfit.jacket, d.emo ?? 'flat'); if (d.halo) haloRing(pen, h, d.halo === 'askew'); }
    },
  });
  drawProp(p, d, hands, unit, look);
  g.restore();
}

// ---------- the people ----------
const SKIN = ['#ffe2c2', '#c99067', '#f5c9a0', '#8a5a3c', '#ecd0b6'], HAIR = ['#3b271c', '#241c18', '#5c3c24', '#a8643a'];
const NOBODY = '#cfcadb';
const CREW_COL = ['#4f6fa8', '#3f8a55', '#7a5c9a', '#b08a3a'];
/** Malone Lam, named: the house's stock figure in four invented costumes. 0 a pink hoodie; 1 the same with a gold chain;
 *  2 the chain and sunglasses; 3 plain grey, in court. No likeness. */
export const LAM = (v = 0): Look => ({id: 'lam' + v, seed: 23, front: v === 3 ? 'tee' : 'hoodie', shirt: v === 3 ? '#c3c7d1' : '#fffdf4', hairdo: 'swept', hairColor: '#1f1b24', chain: v === 1 || v === 2, eyewear: v === 2 ? 'shades' : undefined,
  outfit: {jacket: v === 3 ? '#8f96a8' : '#e83e8c', pants: v === 3 ? '#8f96a8' : '#1f2230', boots: v === 3 ? '#6f7688' : '#f3f1ea', hat: null, skin: SKIN[2], build: 'adult', noButtons: true}});
/** The crew: eighteen people are charged and not all of them have been tried. A blank head with a question mark, nobody's likeness. */
export const CREW = (v = 0, headset = false): Look => ({id: 'crew' + v + (headset ? 'h' : ''), seed: 11 + v * 5, front: 'hoodie', shirt: '#d9d6cf', blank: true, headset,
  outfit: {jacket: CREW_COL[v % 4], pants: '#2b2f3a', boots: '#15161b', hat: null, skin: NOBODY, build: 'adult', noButtons: true}});
/** The investigator, known by a handle: no face. A trench coat (not his own avatar). */
export const SLEUTH: Look = {id: 'sleuth', seed: 61, front: 'coat', shirt: '#3a3f4a', blank: true,
  outfit: {jacket: '#c9a86a', pants: '#3b3552', boots: '#15161b', hat: null, skin: NOBODY, build: 'adult', noButtons: true}};
/** Two agents: invented. */
export const AGENT = (v = 0): Look => ({id: 'agent' + v, seed: 71 + v * 6, front: 'uniform', chest: 'FBI', shirt: '#ffd21f', hairdo: v ? 'long' : undefined, hairColor: '#241c18',
  outfit: {jacket: '#1b2440', pants: '#1b2440', boots: '#15161b', hat: v ? null : 'cap', cap: '#1b2440', hair: HAIR[1], skin: SKIN[v ? 3 : 0], build: 'adult', noButtons: true}});
/** A judge: invented, no likeness of the judge in the case. */
export const JUDGE: Look = {id: 'judge', seed: 131, front: 'robe', hairdo: 'swept', hairColor: '#c9ccd6',
  outfit: {jacket: '#1b1820', pants: '#1b1820', boots: '#15161b', hat: null, skin: SKIN[4], build: 'adult', noButtons: true}};
/** A prosecutor: invented, no likeness of anyone who works on the case. */
export const PROSECUTOR: Look = {id: 'prosecutor', seed: 201, front: 'suit', tie: '#2f4a7a', shirt: '#fbfaf5', hairdo: 'long', hairColor: '#3b271c', lanyard: '#c9a23a',
  outfit: {jacket: '#2b3348', pants: '#2b3348', boots: '#15161b', hat: null, skin: SKIN[0], build: 'adult', noButtons: true}};
/** A defence lawyer: invented. */
export const LAWYER: Look = {id: 'lawyer', seed: 171, front: 'suit', tie: '#a02c3a', shirt: '#fbfaf5', hairdo: 'swept', hairColor: '#b9bcc6', eyewear: 'rect',
  outfit: {jacket: '#5a6072', pants: '#3b3f4d', boots: '#2b2b33', hat: null, skin: SKIN[1], build: 'adult', noButtons: true}};
/** Club staff: invented. */
export const STAFF = (v = 0): Look => ({id: 'staff' + v, seed: 91 + v * 9, front: 'tee', shirt: '#f3f1ea', hairdo: v ? 'long' : 'swept', hairColor: v ? '#a8643a' : '#241c18',
  outfit: {jacket: '#15161b', pants: '#15161b', boots: '#15161b', hat: null, skin: SKIN[v ? 0 : 3], build: 'adult', noButtons: true}});

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
  const blinks = !look.blank && !look.hood;
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
