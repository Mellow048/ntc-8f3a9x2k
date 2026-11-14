// Timing for the buried-gold short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/pool/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'garden' | 'hall' | 'code' | 'drac' | 'foundry' | 'brigade' | 'money' | 'press';
export type Shot = {
  /** first frame (the cut lands just ahead of the word) */
  at: number; kind: Kind;
  /** which staging of the set */
  v: string;
  cam: V; target: V; fov: number;
  /** how far the camera pushes toward the target over the shot (0.1 = 10 %) */
  push?: number;
  to?: V;
  targetTo?: V;
  close?: boolean;
  join?: boolean;
  soft?: boolean;
  /** a place-and-date line in the corner */
  tag?: string;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});

export const SHOTS: Shot[] = [
  // 1 "In May, a man outside Lyon hired a digger to cut a hole for a swimming pool, and the bucket came up with plastic bags full of gold."
  s(0, 'garden', 'street', [4.6, 3.9, 10.8], [0.3, 2.3, -0.8], 42, {push: 0.06, tag: 'NEUVILLE-SUR-SAONE · NEAR LYON'}),
  s(7, 'garden', 'dig', [0.6, 2.7, 7.2], [3.2, 1.1, 2.3], 42, {push: 0.08, tag: 'MAY 2025'}),
  s(10, 'garden', 'hole', [1.9, 2.9, 4.2], [-0.1, -0.35, 1.2], 40, {push: 0.07}),
  s(18, 'garden', 'dig', [1.6, 2.4, 6.6], [3.4, 1.0, 2.4], 40, {push: 0.1}),
  s(22, 'garden', 'bags', [0.7, 1.5, 2.6], [-0.1, -0.85, 1.2], 40, {push: 0.1, close: true}),
  // 2 "Five bars. Many coins. About seven hundred thousand euros, in the ground of a suburban garden."
  s(28, 'garden', 'table', [1.15, 1.5, 5.7], [0.55, 0.9, 3.95], 36, {push: 0.08, tag: 'FIVE BARS, AND COINS'}),
  s(30, 'garden', 'table', [0.9, 1.2, 5.0], [0.6, 0.88, 3.9], 30, {push: 0.1, close: true}),
  s(32, 'garden', 'table', [0.85, 1.25, 4.8], [0.62, 0.9, 3.9], 30, {push: 0.1, close: true}),
  s(37, 'garden', 'street', [-1.8, 3.2, 11.6], [0.2, 2.2, -1.6], 42, {push: 0.05, soft: true}),
  // 3 "He had bought the house not long before. And he did the thing almost nobody does: he rang the town hall."
  s(44, 'hall', 'man', [0.7, 2.0, 6.4], [0.1, 1.35, 0.0], 40, {push: 0.07, tag: 'THE TOWN HALL'}),
  s(52, 'hall', 'man', [-0.9, 1.75, 4.2], [0.05, 1.4, 0.5], 36, {push: 0.08, close: true}),
  s(60, 'hall', 'clerk', [3.1, 1.85, 0.75], [-1.6, 1.15, -1.9], 42, {push: 0.06, close: true}),
  // 4 "In France a treasure is a thing buried so long that nobody can prove they own it, and found by chance. On your own land, the code says, it is yours."
  s(65, 'code', 'page', [0, 2.0, 2.9], [0, 1.55, -1.45], 40, {push: 0.06, tag: 'FRENCH CIVIL CODE · ART. 716'}),
  s(71, 'code', 'clause', [0.03, 1.9, 1.2], [0.03, 1.86, -1.45], 28, {push: 0.03, close: true}),
  s(82, 'code', 'clause', [-0.35, 2.3, 2.75], [-0.1, 1.5, -1.45], 38, {push: 0.06, close: true}),
  s(86, 'code', 'own', [0.0, 1.46, 1.2], [0.0, 1.42, -1.45], 24.5, {push: 0.05, close: true}),
  // 5 "Unless it is archaeology. Then it belongs to the state. So the culture ministry's regional office came to look."
  s(96, 'code', 'state', [0.0, 1.29, 1.9], [0.0, 1.25, -1.45], 30, {push: 0.05, close: true}),
  s(106, 'drac', 'office', [-0.5, 2.0, 5.0], [0.2, 1.4, -0.4], 40, {push: 0.07, tag: 'THE REGIONAL CULTURE OFFICE'}),
  s(112, 'drac', 'office', [0.5, 2.0, 3.8], [1.0, 1.45, 0.2], 38, {push: 0.09, close: true}),
  // 6 "It found no history in it at all: the gold had been melted fifteen, twenty years ago, by a company in Lyon."
  s(115, 'drac', 'exam', [0.55, 1.75, 2.9], [0.35, 1.0, -0.1], 34, {push: 0.1, close: true, tag: 'NO HISTORY IN IT'}),
  s(123, 'foundry', 'furnace', [0.5, 2.2, 6.2], [0, 1.2, -2.6], 40, {push: 0.07, tag: 'MELTED 15 TO 20 YEARS AGO'}),
  s(127, 'foundry', 'pour', [2.4, 1.9, 3.6], [0.7, 0.9, -0.2], 36, {push: 0.1, close: true}),
  s(132, 'foundry', 'bars', [1.6, 1.75, 1.9], [0.4, 0.85, -0.9], 36, {push: 0.1, close: true, tag: 'A COMPANY IN LYON'}),
  // 7 "The bars carry serial numbers. The gendarmes followed them, and found nothing stolen: the metal was bought legally, and never reported missing."
  s(137, 'brigade', 'desk', [-1.7, 2.0, 4.4], [-0.1, 1.2, -1.1], 40, {push: 0.07, tag: 'THE GENDARMES'}),
  s(140, 'brigade', 'board', [0, 2.2, 5.6], [0, 2.0, -3.05], 42, {push: 0.06, tag: 'THE SERIAL NUMBERS'}),
  s(147, 'brigade', 'serial', [0.2, 2.0, -0.4], [0.2, 1.95, -3.05], 34, {push: 0.1, close: true}),
  s(150, 'brigade', 'clean', [-1.2, 1.85, 2.6], [0.05, 1.2, -1.5], 34, {push: 0.09, close: true}),
  // 8 "Then they went looking for the man who buried it. The previous owner of the house. He was dead."
  s(159, 'garden', 'dusk', [-2.0, 2.8, 11.0], [0.4, 2.2, -5.0], 42, {push: 0.06, tag: 'THE PREVIOUS OWNER'}),
  s(169, 'garden', 'dark', [1.6, 2.1, 2.8], [1.1, 2.3, -5.6], 40, {push: 0.08}),
  s(175, 'garden', 'chair', [2.4, 1.55, -2.4], [1.75, 0.95, -4.9], 34, {push: 0.1, close: true}),
  // 9 "No heir came forward. In November the prefecture said the gold was not heritage, and it went to the man with the pool."
  s(178, 'hall', 'verdict', [0.55, 1.95, 0.9], [0.42, 1.16, -1.15], 34, {push: 0.1, tag: 'NOVEMBER 2025'}),
  s(193, 'hall', 'handover', [-2.4, 1.9, 3.3], [-0.3, 1.15, -1.0], 38, {push: 0.08, tag: 'TO THE MAN WITH THE POOL'}),
  // 10 "Which leaves the tax. Finding it costs nothing. Selling it costs eleven and a half per cent, flat: eighty thousand five hundred euros. He keeps six hundred and nineteen thousand five hundred."
  s(201, 'money', 'ledger', [-1.5, 1.9, 4.4], [-0.15, 1.1, -0.6], 40, {push: 0.07, tag: 'THE TAX'}),
  s(205, 'money', 'ledger', [-0.15, 1.4, 0.9], [-0.15, 0.85, -0.45], 34, {push: 0.09, close: true}),
  s(211, 'money', 'ledger', [-0.15, 1.38, 0.88], [-0.15, 0.85, -0.36], 34, {push: 0.1, close: true, tag: '11.5% FLAT'}),
  s(219, 'money', 'ledger', [-0.15, 1.42, 0.92], [-0.15, 0.85, -0.38], 34, {push: 0.1, close: true}),
  s(225, 'money', 'ledger', [-0.15, 1.4, 0.9], [-0.15, 0.85, -0.26], 34, {push: 0.1, close: true, tag: 'WHAT HE KEEPS'}),
  // 11 "He has refused every interview. The local paper calls him the man who got rich digging a pool."
  s(233, 'press', 'gate', [0, 1.95, 5.7], [0.25, 1.4, 1.5], 40, {push: 0.07, tag: 'HE HAS REFUSED EVERY INTERVIEW'}),
  s(238, 'press', 'paper', [0.1, 1.8, 2.0], [0.1, 1.45, -0.85], 34, {push: 0.1, close: true}),
  s(243, 'press', 'back', [1.0, 1.9, 4.4], [0.3, 1.45, 2.2], 34, {push: 0.1, close: true}),
  // 12 "Somebody put seven hundred thousand euros in plastic bags in that garden, and never came back for it."
  s(251, 'garden', 'wide-night', [0, 3.0, 12.5], [0, 1.2, -1.5], 42, {push: 0.05, tag: 'NEVER CAME BACK'}),
  s(258, 'garden', 'night', [0.5, 2.2, 4.2], [-0.05, -0.35, 1.3], 40, {push: 0.07}),
  s(263, 'garden', 'night', [0.3, 2.6, 4.6], [0.0, -0.5, 1.2], 40, {push: 0.05, soft: true}),
  // 13 "So who was he: a man hiding his savings from a bank, from a divorce, from the tax office, or from whoever came next?"
  s(269, 'garden', 'question', [0.2, 2.9, 9.0], [0, 1.0, -1.2], 44, {push: 0.05}),
];

/** index of the shot that is on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
/** first frame of the shot after shot i (the film's length for the last) */
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
