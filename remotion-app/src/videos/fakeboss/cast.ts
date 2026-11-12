// The cast of the fake boss short. Everyone is built on the shared flat cartoon construction (pendulum/toon.ts):
// same big head, same deadpan face. A person is told apart by costume only: suit, lanyard, cardigan.
// The boss, the lawyer and the staff are invented: no company is named and nobody is a likeness of anybody.
// The three defendants are accused and have not been tried, so they have no face at all: a blank head with a question
// mark, in three jackets so that they can be told apart. "A.I." is drawn as somebody's face on a glowing plate, held up
// on a stick in front of a head that is not theirs: a picture of the idea, not of any software.
import * as THREE from 'three';
import {Pen, bodyFront, INK, type Outfit, type Expr, type FrontGeo, type HeadGeo} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import {pool, rrect, type G2, type Node} from './kit';

type P2 = [number, number];
export type Pose = 'hang' | 'hold' | 'shrug' | 'panic' | 'point' | 'hips' | 'cross' | 'desk' | 'both' | 'phone' | 'think' | 'type' | 'wave' | 'push' | 'swing' | 'hush' | 'mask' | 'side';
export type Prop = 'paper' | 'phone' | 'plate' | 'trophy' | 'paddle' | 'lens' | 'key' | null;
/** whose face a plate shows */
export type Face = 'boss' | 'lawyer';
export type Look = {
  id: string; outfit: Outfit; seed: number;
  eyewear?: 'rect' | 'round';
  front?: 'suit' | 'hoodie' | 'tee' | 'polo';
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
};
export type Draw = {expr?: Expr; pose?: Pose; prop?: Prop; blink?: boolean; tilt?: number; look?: number; mode?: 'stand' | 'sit' | 'march'; phase?: number;
  /** the face on the plate: held beside the head with prop 'plate', or in front of it with `wear` */ face?: Face;
  /** the plate is up in front of the head: what the camera of the call sees */ wear?: boolean};

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

// ---------- the face on a plate ----------
let lastHead: HeadGeo | null = null;
const shots = new Map<string, {cv: HTMLCanvasElement; h: HeadGeo}>();
/** somebody drawn once, with where their head is: what a plate or a portrait shows */
function headShot(look: Look, expr: Expr) {
  const key = look.id + expr; let s = shots.get(key);
  if (!s) { const cv = document.createElement('canvas'); cv.width = 600; cv.height = 1000; drawActor(cv.getContext('2d')!, look, {expr}, 1); s = {cv, h: lastHead!}; shots.set(key, s); }
  return s;
}
/** half-height of a plate of half-width r */
const PH = 1.2;
/** how much wider than the skull a plate is when it is worn: wide enough for the hair */
const WORN = 1.36;
/**
 * Somebody's face on a glowing plate: (cx, cy) its middle, r its half-width. With `real` the same picture is drawn as a
 * photograph (a portrait on a wall, a tile on a screen) and nothing about it says "made up"; `frame: false` leaves the edge off.
 */
export function drawPlate(g: G2, cx: number, cy: number, r: number, face: Face, o: {tilt?: number; real?: boolean; frame?: boolean; expr?: Expr} = {}) {
  const {cv, h} = headShot(face === 'boss' ? BOSS : LAWYER, o.expr ?? 'smile_closed'), H = PH * r, k = (WORN * h.a) / r;   // source pixels per unit of plate
  const sx = h.cx - r * k, sy = h.hc - 0.12 * h.b - H * k, real = !!o.real, frame = o.frame !== false;
  g.save(); g.translate(cx, cy); g.rotate(o.tilt ?? 0); g.lineJoin = 'round';
  g.save(); if (frame) { rrect(g, -r, -H, 2 * r, 2 * H, 0.34 * r); g.clip(); g.fillStyle = real ? '#cfe0ee' : '#0b3340'; g.fillRect(-r, -H, 2 * r, 2 * H); }
  g.drawImage(cv, sx, sy, 2 * r * k, 2 * H * k, -r, -H, 2 * r, 2 * H);
  if (!real) {
    for (const [y0, hh, dx] of [[-0.56, 0.16, 0.11], [0.26, 0.1, -0.09]])                                           // two slices that have slipped sideways
      g.drawImage(cv, sx, sy + (y0 + 1) * H * k, 2 * r * k, hh * H * k, -r + dx * r, y0 * H, 2 * r, hh * H);
    g.globalAlpha = 0.36; g.fillStyle = CYAN; g.fillRect(-r, -H, 2 * r, 2 * H); g.globalAlpha = 1;
    g.fillStyle = 'rgba(4,34,46,0.2)'; for (let y = -H; y < H; y += r * 0.105) g.fillRect(-r, y, 2 * r, r * 0.04);  // scan lines
  }
  g.restore();
  if (frame) { rrect(g, -r, -H, 2 * r, 2 * H, 0.34 * r); g.lineWidth = 0.12 * r; g.strokeStyle = '#15121c'; g.stroke(); }
  if (frame && !real) { rrect(g, -r + 0.085 * r, -H + 0.085 * r, 2 * r - 0.17 * r, 2 * H - 0.17 * r, 0.27 * r); g.lineWidth = 0.05 * r; g.strokeStyle = '#a8f6ff'; g.stroke(); }
  g.restore();
}

// ---------- things held ----------
function drawProp(p: Pen, d: Draw, hands: P2[], u: number, look: Look, head: HeadGeo | null) {
  const g = p.g, R = hands[1] ?? [430, 600], prop = d.prop ?? null, fist = () => p.dot(R[0], R[1], 5.5 * u);
  const stick = (to: P2) => p.band([[R[0], R[1] + 5 * u], to], '#c9ced6', 3.6 * u, 1.3 * u, 'round');
  if (d.wear && head) {                                                                             // the plate covers the head exactly: the face on it sits where a face would be
    const r = WORN * head.a, cy = head.hc - 0.12 * head.b;
    stick([head.cx + 0.42 * r, cy + PH * r - 4 * u]); drawPlate(g, head.cx, cy, r, d.face ?? 'boss'); fist();
    return;
  }
  if (!prop) return;
  if (prop === 'plate' && head) {                                                                   // the plate lowered to one side: whoever was behind it shows
    const r = 0.6 * WORN * head.a, x = head.cx + head.a + r + 8 * u, y = head.hc - 0.2 * head.b;
    stick([x - 0.1 * r, y + PH * r - 4 * u]); drawPlate(g, x, y, r, d.face ?? 'boss', {tilt: 0.12}); fist();
  } else if (prop === 'paper') {                                                                    // a sheet of paper with a letterhead
    const [x, y] = [R[0] + 4 * u, R[1] - 20 * u];
    p.rot = [0.18, x, y];
    p.poly(rect(x - 17 * u, y - 23 * u, 34 * u, 46 * u), '#fffdf4', 2.2 * u);
    p.poly(rect(x - 13 * u, y - 19 * u, 26 * u, 7 * u), look.tie ?? '#4a78c9', 0);
    for (let i = 0; i < 5; i++) p.stroke([[x - 12 * u, y - 2 * u + i * 5 * u], [x + (i === 4 ? 2 : 12) * u, y - 2 * u + i * 5 * u]], 1.5 * u, '#8f8a96');
    p.rot = null; fist();
  } else if (prop === 'phone') {
    p.poly(rounded(R[0] - 5 * u, R[1] - 15 * u, 10 * u, 24 * u, 2 * u), '#26262e', 1.8 * u); p.dot(R[0] + 3 * u, R[1] + 3 * u, 5 * u);
  } else if (prop === 'trophy') {                                                                   // a cup with a 1 on it
    const [x, y] = [R[0] + 2 * u, R[1] - 34 * u], gold = '#f2c230';
    p.poly(rect(x - 4 * u, y + 12 * u, 8 * u, 16 * u), gold, 1.8 * u); p.poly(rect(x - 14 * u, y + 26 * u, 28 * u, 7 * u), '#6b4a2d', 1.8 * u);
    for (const s of [-1, 1]) p.arc(x + s * 19 * u, y - 4 * u, 8 * u, 10 * u, s > 0 ? -80 : 100, s > 0 ? 80 : 260, 3.2 * u, '#c9981a');
    p.poly([[x - 20 * u, y - 18 * u], [x + 20 * u, y - 18 * u], [x + 15 * u, y + 4 * u], [x + 6 * u, y + 13 * u], [x - 6 * u, y + 13 * u], [x - 15 * u, y + 4 * u]], gold, 2.2 * u);
    g.save(); g.font = `400 ${26 * u}px Anton, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7a5208'; g.fillText('1', x, y - 4 * u); g.restore();
    fist();
  } else if (prop === 'paddle') {                                                                   // a stop paddle: a red disc with a white bar
    const [x, y] = [R[0] + 6 * u, R[1] - 44 * u];
    p.band([[R[0], R[1] + 5 * u], [x, y]], '#f3f1ea', 4 * u, 1.3 * u, 'round'); p.ell(x, y, 25 * u, 25 * u, '#e3342f', 2.4 * u); p.poly(rect(x - 16 * u, y - 4.5 * u, 32 * u, 9 * u), '#ffffff', 0); fist();
  } else if (prop === 'lens') {                                                                     // a magnifying glass, up at the eye
    const [x, y] = [R[0] + 9 * u, R[1] - 30 * u];
    p.band([[R[0] - 2 * u, R[1] + 6 * u], [x - 9 * u, y + 15 * u]], '#6b4a2d', 5 * u, 1.4 * u, 'round');
    g.globalAlpha = 0.45; p.ell(x, y, 20 * u, 20 * u, '#d8f1ff', 0); g.globalAlpha = 1; p.ell(x, y, 20 * u, 20 * u, null, 4.4 * u); p.arc(x, y, 13 * u, 13 * u, 200, 260, 2.4 * u, '#ffffff'); fist();
  } else if (prop === 'key') {                                                                      // a key held up: one of two
    const [x, y] = [R[0] + 3 * u, R[1] - 16 * u], gold = '#f2c230';
    p.poly(rect(x - 3 * u, y - 4 * u, 6 * u, 26 * u), gold, 1.8 * u); for (const dy of [12, 18]) p.poly(rect(x + 3 * u, y + dy * u, 8 * u, 4 * u), gold, 1.6 * u);
    p.ell(x, y - 13 * u, 12 * u, 12 * u, gold, 2.2 * u); p.ell(x, y - 13 * u, 4.5 * u, 4.5 * u, '#3a2c08', 0); fist();
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
    case 'polo': {                                                                                  // uniform polo: collar, placket, a word across the chest
      const collar = look.shirt ?? '#f3f1ea';
      for (const s of [-1, 1]) p.poly([[x, chin + 0.18 * HH], [x + s * 0.44 * Ta, top], [x + s * 0.54 * Ta, chin + 0.14 * HH], [x + s * 0.14 * Ta, chin + 0.32 * HH]], collar, 1.6 * u);
      p.stroke([[x, chin + 0.22 * HH], [x, chin + 0.4 * HH]], 1.5 * u);
      if (look.chest) word(look.chest, chin + 0.58 * HH, 13.5, '#ffffff');
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
  const p = new Pen(g), hands: P2[] = [], pose = d.wear ? 'mask' : d.prop === 'plate' ? 'side' : d.pose ?? 'hang';
  let unit = 2.36, head: HeadGeo | null = null;
  bodyFront(p, look.outfit, {
    mode: d.mode ?? 'stand', phase: d.phase ?? 0, expr: d.expr ?? 'neutral', blink: d.blink, headTilt: d.tilt ?? 0, look: d.look ?? 0, seed: look.seed, facing: 0,
    arms: pose === 'swing' ? undefined : (geo) => { unit = geo.u; return arms(pose, geo, hands); },
    torso: (pen, geo) => torsoFront(pen, look, geo),
    behindHead: (pen, h) => behindHead(pen, look, h),
    onHead: (pen, h) => { head = h; lastHead = h; onHead(pen, look, h); if (look.blank) blankFace(pen, h, look.outfit.skin ?? NOBODY); },
  });
  if (pose === 'hush' && hands[1]) {                                                                // the finger that goes with "tell no one"
    const [x, y] = hands[1]; p.band([[x, y + 2 * unit], [x, y - 17 * unit]], look.outfit.skin ?? '#f0c19a', 5 * unit, 1.5 * unit, 'round');
  }
  drawProp(p, d, hands, unit, look, head);
  g.restore();
}

// ---------- the people ----------
const SKIN = ['#ffe2c2', '#c99067', '#f5c9a0', '#8a5a3c', '#ecd0b6'], HAIR = ['#3b271c', '#241c18', '#5c3c24', '#a8643a'];
const NOBODY = '#cfcadb';
/** the colour of everything the film calls made by A.I. */
export const CYAN = '#2fe3ff';
const suit = (id: string, seed: number, jacket: string, skin: string, tie: string, more: Partial<Look> = {}, build: Outfit['build'] = 'adult'): Look => ({
  id, seed, front: 'suit', tie, outfit: {jacket, pants: jacket, boots: '#17171d', hat: null, skin, build, noButtons: true}, ...more,
});
/** The boss: an invented chief executive. Grey hair, glasses, a green tie; nobody in particular. */
export const BOSS: Look = suit('boss', 21, '#2f3a5c', '#f0c19a', '#2f9e7a', {eyewear: 'rect', hairdo: 'swept', hairColor: '#c9ccd6'}, 'stout');
/** The face the second caller borrows: an invented lawyer. The real lawyers whose names were used are not drawn. */
export const LAWYER: Look = suit('lawyer', 33, '#4a3f4a', '#e9c7a6', '#a8323a', {eyewear: 'round', hairdo: 'swept', hairColor: '#2a2226'});
/** Whoever is on the other end of the call: nobody's face, in the suit of the person on the plate. */
export const CALLER = (face: Face = 'boss'): Look => { const who = face === 'boss' ? BOSS : LAWYER; return {...who, id: 'caller-' + face, eyewear: undefined, hairdo: undefined, blank: true, outfit: {...who.outfit, skin: NOBODY}}; };
const JACKETS = ['#2f7f86', '#9a4a5a', '#8a8a3a'];
/** The three defendants, in the order of the case title. Accused, not tried: no faces, three jackets. */
export const DEFENDANT = (v = 0): Look => ({id: 'def' + v, seed: 41 + v * 4, front: v === 1 ? 'tee' : 'hoodie', shirt: ['#e8e4da', '#e8e4da', '#3a3f4a'][v], blank: true,
  outfit: {jacket: JACKETS[v], pants: ['#2b2f3a', '#3a3340', '#2b2f3a'][v], boots: '#17171d', hat: null, skin: NOBODY, build: 'adult', noButtons: true}});
/** Defendant 1 in the lawyer's suit: the indictment says he "primarily acted to impersonate attorneys". */
export const FAKE_LAWYER: Look = {...CALLER('lawyer'), id: 'fake-lawyer'};
/** Partners "known and unknown": the same, in grey. */
export const PARTNER = (v = 0): Look => ({id: 'partner' + v, seed: 71 + v * 3, front: 'hoodie', shirt: '#8a8796', blank: true,
  outfit: {jacket: ['#5a5d6e', '#646070', '#55606a'][v % 3], pants: '#3a3d48', boots: '#17171d', hat: null, skin: '#b9b6c6', build: 'adult', noButtons: true}});
/** Staff, nobody in particular: 0 the accounts employee, 1 and 2 colleagues, 3 the bank's employee, 4 the bank's back office. */
export const STAFF = (v = 0): Look => ({id: 'staff' + v, seed: 61 + v * 5, front: (['hoodie', 'tee', 'hoodie', 'suit', 'hoodie'] as const)[v], shirt: ['#fff6dc', '#f3f1ea', '#e8f0ff', '#fbfaf5', '#fff1f1'][v],
  tie: '#3f6fb5', lanyard: ['#e8590c', '#2f9e7a', '#7a4fd0', '#3f6fb5', '#3f6fb5'][v], eyewear: v === 0 || v === 4 ? 'round' : undefined,
  hairdo: (['bob', undefined, 'long', 'swept', 'bob'] as const)[v], hairColor: ['#3b271c', '#241c18', '#a8643a', '#241c18', '#d9dbe2'][v],
  outfit: {jacket: ['#d9a13a', '#4f8a5b', '#b0563f', '#3a4660', '#7a5c9a'][v], pants: ['#3b4a66', '#2b2f3a', '#2b2f3a', '#3a4660', '#3b3f4d'][v], boots: v === 3 ? '#17171d' : '#f3efe6', hat: v === 1 ? 'hair' : null, hair: HAIR[1],
    skin: SKIN[[0, 3, 2, 1, 4][v]], build: v === 4 ? 'stout' : 'adult', noButtons: true}});
/** The prosecutors' side: a figure at a lectern with the office on the tag. Not a likeness of the U.S. Attorney. */
export const PROSECUTOR: Look = suit('prosecutor', 15, '#1f2a44', '#f0c19a', '#a8323a', {hairdo: 'swept', hairColor: '#4a3626'});

// ---------- billboards ----------
const cache = new Map<string, THREE.CanvasTexture>();
/** a figure that holds a plate out to one side needs a wider sheet of paper, or the plate is cut off at its edge */
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
export type ActorOpt = {scale?: number; res?: number; shadow?: number; still?: boolean; phase?: number};
export function actor(parent: Node, look: Look, states: Record<string, Draw>, x: number, y: number, z: number, o: ActorOpt = {}): Actor {
  const scale = o.scale ?? 1, res = o.res ?? 0.7, node = new THREE.Group(); node.position.set(x, y, z); parent.add(node);
  const blinks = !look.blank;
  const maps = new Map<string, [THREE.Texture, THREE.Texture]>();
  const wide = Object.values(states).some((d) => d.prop === 'plate' && !d.wear);
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
