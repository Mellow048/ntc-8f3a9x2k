// The emu, drawn with the same Pen as the human cast so it shares the outline
// weight, the flat fills and the painted crescent. Side profile on a 600 x 1000
// card (feet at y = 975), billboarded in world.ts, so it always reads as a flat
// cartoon animal standing in the painted paddock.
//
// The silhouette is the argument of the film: a shaggy barrel of feathers on two
// long grey legs, with almost nothing in the middle. The explanation shot leans
// on exactly that, so the body is drawn wide and the legs long and bare.
import { Pen, INK, mix, shade } from "./toon";

export type EmuLook = {
  gait: number;   // 0..1 stride phase
  head: number;   // 0 = head down feeding, 1 = head up alert
  run?: boolean;  // running pose (body pitched, legs stretched)
  blaze?: number; // 0..1 flinch on a hit (body jolt) — used in the explanation
};

const BODY = "#7b6a58";
const BODY_LIGHT = "#98876f";
const BELLY = "#8d7c64";
const HEAD = "#43403c";
const HEAD_LIGHT = "#5b5751";
const BILL = "#2b2825";
const LEG = "#8c8272";
const LEG_DARK = "#6f6759";
const EYE = "#f2c15a";

/** shaggy feather edge: a chain of small overlapping scallops between a and b */
const shag = (a: [number, number], b: [number, number], amp: number, n: number, out: [number, number][]) => {
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 0.5) / n, t2 = (i + 1) / n;
    const px = a[0] + (b[0] - a[0]) * t1, py = a[1] + (b[1] - a[1]) * t1;
    const nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1;
    out.push([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]);
    out.push([px + (nx / L) * amp, py + (ny / L) * amp]);
    void t2;
  }
};

const coverInk = (c: string) => mix(c, "#2a2620", 0.55);

const ellPtsLet = (cx: number, cy: number, rx: number, ry: number, n = 40): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as [number, number];
  });

const legPoly = (
  p: Pen, hip: [number, number], knee: [number, number], ankle: [number, number],
  toes: [number, number], w: number, col: string, lift = 0,
) => {
  // thigh is feathered and thick, the shank below the knee is bare and thinner
  const mid = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const k = mid(knee, ankle, 0.5);
  const pts: [number, number][] = [
    [hip[0] - w * 1.05, hip[1] + 10],
    [knee[0] - w * 0.75, knee[1]],
    [k[0] - w * 0.42, k[1]],
    [ankle[0] - w * 0.30, ankle[1]],
    [ankle[0] + w * 0.28, ankle[1] + 2],
    [k[0] + w * 0.46, k[1]],
    [knee[0] + w * 0.8, knee[1] - 6],
    [hip[0] + w * 1.15, hip[1] - 6],
  ];
  p.poly(pts, col, p.ol * 0.9);
  p.ell(knee[0] + w * 0.16, knee[1] - 2, w * 0.34, w * 0.26, col, p.ol * 0.5); // hock bump, not a ring
  // foot: three splayed forward toes, one back, flat on the ground
  const tx = toes[0], ty = toes[1] - lift;
  const ay = ankle[1] - lift;
  const tx2 = toes[0], ty2 = toes[1] - lift;
  const f: [number, number][] = [
    [ankle[0] - 10, ay - 10],
    [tx2 - 54, ty2 - 4],
    [tx2 - 30, ty2 + 2],
    [tx2 - 6, ty2 + 4],
    [tx2 + 20, ty2 + 3],
    [tx2 + 46, ty2 - 2],
    [tx2 + 62, ty2 - 10],
    [ankle[0] + 10, ay - 12],
  ];
  p.poly(f, col, p.ol * 0.8);
  // toe splits, so it reads as three toes and not a paddle
  p.stroke([[ankle[0] - 2, ay + 2], [tx2 - 26, ty2 + 1]], 3, coverInk(col));
  p.stroke([[ankle[0] + 4, ay + 2], [tx2 + 24, ty2]], 3, coverInk(col));
  // rear toe
  p.line([[ankle[0] - 6, ay], [ankle[0] - 42, ay + 4]], col, w * 0.26);
  // scale ticks on the shank
  if (lift < 12) {
    p.stroke([[knee[0] - 4, knee[1] + 30], [knee[0] + 1, knee[1] + 58]], 3, LEG_DARK);
    p.stroke([[k[0] - 4, k[1] + 34], [k[0] + 1, k[1] + 64]], 3, LEG_DARK);
    p.stroke([[ankle[0] - 5, ankle[1] - 40], [ankle[0] - 1, ankle[1] - 14]], 3, LEG_DARK);
  }
};

/** closed Catmull-Rom through the anchors, so silhouettes curve instead of cornering */
const smoothPath = (pts: [number, number][], n = 8): [number, number][] => {
  const out: [number, number][] = [];
  const P = (i: number) => pts[(i + pts.length) % pts.length];
  for (let i = 0; i < pts.length; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
};

/** feather lobes hanging off a run of the silhouette: rounded clumps, not a zigzag */
const lobes = (a: [number, number], b: [number, number], r: number, count: number, seed: number): [number, number][] => {
  const out: [number, number][] = [];
  const nx = -(b[1] - a[1]), ny = b[0] - a[0];
  const L = Math.hypot(nx, ny) || 1;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const cx = a[0] + (b[0] - a[0]) * t, cy = a[1] + (b[1] - a[1]) * t;
    const rr = r * (0.72 + 0.5 * (0.5 + 0.5 * Math.sin(seed * 5.7 + i * 1.9)));
    for (let k = 0; k <= 6; k++) {
      const ang = (k / 6) * Math.PI;
      const ux = Math.cos(ang) * rr, uy = Math.sin(ang) * rr;
      out.push([cx + (nx / L) * uy + (b[0] - a[0]) / L * ux, cy + (ny / L) * uy + (b[1] - a[1]) / L * ux]);
    }
  }
  return out;
};

export const emu = (p: Pen, o: EmuLook) => {
  const g = o.gait * Math.PI * 2;
  const run = !!o.run;
  const pitch = run ? 0.18 : 0;
  const swing = run ? 76 : 54;
  const bob = Math.sin(g * 2) * (run ? 9 : 4);
  const lean = Math.cos(g) * 5;

  // ---- far leg: feathered thigh above the hock, bare scaly shank below
  const farLift = Math.max(0, Math.sin(g + Math.PI)) * (run ? 40 : 22);
  const farAnkleX = 296 + Math.sin(g + Math.PI) * swing;
  const farAnkleY = 936 - farLift * 0.5;
  const farKnee: [number, number] = [292 + Math.sin(g + Math.PI) * swing * 0.45, 682 - farLift * 0.35];
  legPoly(p, [292, 486], farKnee, [farAnkleX, farAnkleY], [farAnkleX + 6, 972 - farLift * 0.2], 26, LEG_DARK, farLift);
  // far thigh feathers, tucked against the body
  p.poly(smoothPath([[268, 470], [252, 530], [268, 590], [300, 600], [316, 540], [312, 480]]), shade(BODY, 0.82), p.ol * 0.8);

  // ---- near leg
  const lift = Math.max(0, Math.sin(g)) * (run ? 44 : 26);
  const nearAnkleX = 336 + Math.sin(g) * swing;
  const nearAnkleY = 940 - lift * 0.5;
  const nearKnee: [number, number] = [336 + Math.sin(g) * swing * 0.45, 688 - lift * 0.35];
  legPoly(p, [330, 486], nearKnee, [nearAnkleX, nearAnkleY], [nearAnkleX + 8, 974 - lift * 0.2], 30, LEG, lift);
  p.poly(smoothPath([[306, 468], [292, 534], [306, 596], [342, 606], [358, 540], [352, 474]]), BODY, p.ol * 0.85);

  // ---- body: a round feathered mass; the belly tucks up between the thighs
  p.rot = [-pitch, 300, 470];
  const body: [number, number][] = smoothPath([
    [196, 500], [176, 452], [164, 396], [176, 336], [214, 292], [268, 268], [330, 268], [382, 288],
    [414, 336], [424, 390], [412, 440], [386, 482], [348, 506], [300, 498], [258, 508], [222, 508],
  ], 10);
  // feather clumps: short arcs just inside the back edge, never part of the outline
  const clump = (x: number, y: number, r: number) => {
    const pts: [number, number][] = [];
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * (0.55 + 0.9 * (k / 8)) + 0.6;
      pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
    p.stroke(pts, 4, shade(BODY, 0.66));
  };
  p.shadedFill(body, BODY, mix(BODY, "#36302a", 0.5), -2.3, 168, 0.25);
  p.poly(body, null, p.ol * 1.05);
  clump(196, 372, 26); clump(186, 420, 24); clump(200, 462, 22); clump(232, 300, 24); clump(282, 282, 22);

  p.clip(body, () => {
    p.shadedFill(smoothPath([[214, 470], [246, 512], [300, 508], [356, 512], [392, 470], [300, 466]], 8),
      BELLY, mix(BELLY, BODY, 0.8), -1.4, 120, 0.15, 0.55, 1.15);
    p.shadedFill(ellPtsLet(400, 372, 52, 98), BODY_LIGHT, mix(BODY_LIGHT, BODY, 0.88), -1.4, 100, 0.12, 0.5, 1.1);
    p.stroke([[196, 356], [258, 344]], 3.6, shade(BODY, 0.7));
    p.stroke([[190, 408], [256, 396]], 3.6, shade(BODY, 0.72));
    p.stroke([[210, 452], [268, 442]], 3.6, shade(BODY, 0.74));
    p.stroke([[352, 300], [396, 330]], 3.2, mix(BODY_LIGHT, "#ffffff", 0.25));
  });

  // ---- tail plume: three clumps off the rump
  p.poly(smoothPath([[198, 452], [150, 438], [122, 406], [116, 370], [128, 342], [158, 350], [186, 380], [200, 412]], 8), shade(BODY, 0.9), p.ol * 0.9);
  p.stroke([[150, 414], [176, 402]], 3.6, shade(BODY, 0.68));

  // ---- neck: short, thick at the shoulder, an S up to the head
  const headX = 462 + (o.head - 0.5) * 26 + lean;
  const headY = 214 - o.head * 78 + bob * 0.35;
  const nb: [number, number] = [382, 316];
  const nt: [number, number] = [headX - 2, headY + 32];
  const c1: [number, number] = [nb[0] + 40, nb[1] - 40];
  const c2: [number, number] = [nt[0] - 40, nt[1] + 44];
  const neck: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, s = 1 - t;
    neck.push([
      s * s * s * nb[0] + 3 * s * s * t * c1[0] + 3 * s * t * t * c2[0] + t * t * t * nt[0],
      s * s * s * nb[1] + 3 * s * s * t * c1[1] + 3 * s * t * t * c2[1] + t * t * t * nt[1],
    ]);
  }
  const neckW = (t: number) => 62 - 28 * Math.pow(t, 0.7);
  const left = neck.map((q, i) => [q[0] - neckW(i / 12) * 0.5, q[1]] as [number, number]);
  const right = neck.map((q, i) => [q[0] + neckW(i / 12) * 0.5, q[1]] as [number, number]).reverse();
  p.shadedFill([...left, ...right], mix(BODY, HEAD, 0.62), mix(HEAD, "#23211e", 0.25), -2.4, 74, 0.24);
  p.poly([...left, ...right], null, p.ol * 0.85);
  p.clip([...left, ...right], () => {
    for (let i = 1; i <= 4; i++) {
      const q = neck[i * 3] ?? neck[6];
      p.stroke([[q[0] - 12, q[1]], [q[0] + 9, q[1] + 4]], 2.2, mix(HEAD, "#8f8474", 0.4));
    }
  });

  // ---- head + bill
  p.ell(headX + 10, headY, 32, 28, HEAD, p.ol * 0.9);
  p.ell(headX + 4, headY - 8, 20, 14, HEAD_LIGHT, 0);
  p.ell(headX + 14, headY + 11, 15, 8, mix(HEAD, "#b6a48c", 0.5), 0);
  const by = headY + 6;
  p.poly([[headX + 34, by - 9], [headX + 118, by + 2], [headX + 116, by + 10], [headX + 32, by + 12]], BILL, p.ol * 0.75);
  p.stroke([[headX + 40, by - 4], [headX + 110, by + 3]], 2.6, "#5f5a52");
  p.ell(headX + 16, headY - 7, 8.5, 7.5, "#f8f2e3", 0);
  p.dot(headX + 17, headY - 7, 3.8, INK);
  p.dot(headX + 18.4, headY - 8.4, 1.4, "#ffffff");
  p.stroke([[headX + 4, headY - 15], [headX + 23, headY - 12]], 3.6, INK);

  p.rot = null;

  if (o.blaze && o.blaze > 0.01) {
    const k = o.blaze;
    p.stroke([[300, 372], [300 + 28 * k, 372 - 20 * k]], 5 * k, "#fff3cf");
    p.stroke([[312, 400], [312 + 22 * k, 400 + 16 * k]], 4.5 * k, "#fff3cf");
    p.stroke([[348, 336], [348 + 26 * k, 336 - 12 * k]], 4 * k, "#fff3cf");
  }
};

/** A bundle of wheat stubble for the foreground rows: cheap, but it sells the crop. */
export const stubble = (p: Pen, seed: number) => {
  const r = (k: number) => { const x = Math.sin(seed * 91.7 + k * 47.3) * 9137.13; return x - Math.floor(x); };
  for (let i = 0; i < 9; i++) {
    const x = 90 + r(i) * 420, h = 120 + r(i + 20) * 190;
    const bend = (r(i + 40) - 0.5) * 40;
    p.stroke([[x, 975], [x + bend, 975 - h]], 5.5, mix("#c9a25f", "#8d6b39", r(i + 60)));
    p.stroke([[x + bend * 0.7, 975 - h * 0.6], [x + bend + 22, 975 - h * 0.78]], 4, "#b18a4c");
  }
};
