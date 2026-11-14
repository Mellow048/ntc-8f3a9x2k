// Timing for the San José short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/sanjose/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'sea' | 'deep' | 'lab' | 'chart' | 'court' | 'andes' | 'press';
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
  // 1 "In seventeen-oh-eight, a Spanish treasure ship blew up off Colombia, taking six hundred men and eleven million coins down with her."
  s(0, 'sea', 'battle', [4.5, 5.0, 17.0], [-0.8, 2.8, -2.0], 42, {push: 0.06, tag: 'OFF CARTAGENA · 8 JUNE 1708'}),
  s(6, 'sea', 'fire', [-4.5, 6.0, 16.0], [-0.8, 3.0, -1.2], 40, {push: 0.1}),
  s(11, 'sea', 'sink', [6.0, 4.6, 14.0], [-0.8, 1.8, -1.2], 40, {push: 0.08}),
  s(15, 'sea', 'hold', [0, 1.75, 4.4], [0.1, 0.8, -1.2], 46, {push: 0.09}),
  // 2 "They call her the Holy Grail of shipwrecks. Estimates of what she carries run from four billion dollars to twenty."
  s(21, 'deep', 'wreck', [0.6, 2.4, 12.5], [-0.2, 1.4, -1.2], 56, {push: 0.07, tag: 'THE SAN JOSÉ'}),
  s(29, 'chart', 'estimate', [0, 1.9, 5.2], [0, 1.35, -2.2], 42, {push: 0.06, tag: 'WHAT SHE CARRIES'}),
  s(36, 'deep', 'coins', [-0.6, 1.5, 3.9], [-0.7, 0.15, 1.5], 44, {push: 0.09}),
  // 3 "Colombia found her in twenty fifteen, at two thousand feet. Her coordinates are a state secret."
  s(41, 'chart', 'secret', [1.4, 2.6, 2.2], [0.7, 0.95, -1.0], 45, {push: 0.07, tag: 'FOUND · 2015'}),
  s(47, 'deep', 'wreck', [0.4, 3.4, 14.0], [-0.4, 1.0, -1.6], 52, {push: 0.05, tag: '600 METRES DOWN'}),
  s(52, 'chart', 'secret', [0.9, 1.85, 0.6], [0.9, 0.97, -1.2], 38, {push: 0.1, close: true}),
  // 4 "Last November a robot lifted the first objects: a bronze cannon, three coins, and two porcelain cups."
  s(57, 'deep', 'rov', [0, 2.2, 7.0], [0, 1.9, -0.5], 44, {push: 0.07, tag: 'NOVEMBER 2025'}),
  s(61, 'deep', 'arm', [2.6, 1.8, 5.0], [0.9, 1.1, 0.2], 44, {push: 0.09, close: true}),
  s(66, 'lab', 'cannon', [1.4, 2.6, 5.6], [0.1, 0.7, 0.5], 44, {push: 0.07, tag: "THE CULTURE MINISTRY'S LAB"}),
  s(68, 'lab', 'coins', [1.4, 1.6, 2.9], [1.4, 0.9, 0.6], 36, {push: 0.1, close: true}),
  s(71, 'lab', 'cups', [1.5, 1.5, 0.6], [1.5, 1.05, -1.55], 40, {push: 0.09, close: true}),
  // 5 "Which is the difficulty. The richest wreck in the world, and what came up first was the crockery."
  s(74, 'lab', 'crockery', [1.5, 2.2, 3.6], [1.5, 1.0, -1.4], 44, {push: 0.05}),
  s(78, 'deep', 'wreck', [0, 2.6, 11.0], [0, 1.2, -1.6], 54, {push: 0.04}),
  s(85, 'lab', 'crockery', [1.5, 1.5, 0.2], [1.5, 1.05, -1.6], 40, {push: 0.12, close: true}),
  // 6 "Spain says she is a Spanish warship, and a war grave. The Qhara Qhara of Bolivia say the silver came out of their mountain."
  s(92, 'court', 'spain', [-2.4, 1.6, 3.9], [-2.2, 1.3, -0.4], 42, {push: 0.07, tag: 'THE CLAIMS'}),
  s(99, 'court', 'grave', [-1.9, 1.5, 2.4], [-1.9, 1.25, 0.2], 38, {push: 0.08, close: true}),
  s(103, 'andes', 'mountain', [-0.6, 3.0, 10.0], [-0.4, 2.0, -6.0], 44, {push: 0.05, tag: 'POTOSÍ, BOLIVIA'}),
  s(108, 'andes', 'claim', [0.2, 1.55, 4.8], [0.1, 1.25, 0.6], 42, {push: 0.08}),
  // 7 "An American salvage firm says it found her in nineteen eighty-two, and wants ten billion dollars: half of everything."
  s(116, 'court', 'salvor', [1.9, 1.55, 3.6], [1.9, 1.3, 0.2], 40, {push: 0.08, close: true, tag: 'SEA SEARCH ARMADA'}),
  s(121, 'chart', 'tenk', [-0.2, 2.2, 2.8], [-0.2, 0.95, -0.4], 46, {push: 0.07, tag: 'THEY SAY THEY FOUND HER IN 1982'}),
  s(128, 'chart', 'tenk', [-0.2, 1.7, 2.2], [-0.3, 0.96, -0.3], 42, {push: 0.1, close: true}),
  // 8 "Colombia says they were ten kilometres off. In nineteen eighty-four the finder's share was cut from half to five per cent."
  s(135, 'chart', 'tenk', [-0.3, 2.4, 3.0], [-0.5, 0.95, -0.4], 46, {push: 0.06}),
  s(142, 'chart', 'decree', [1.1, 2.2, 4.0], [1.1, 0.97, 0.8], 42, {push: 0.08, tag: 'DECREE · 1984'}),
  s(149, 'chart', 'decree', [1.1, 1.7, 2.6], [1.1, 1.02, 1.15], 40, {push: 0.1, close: true}),
  // 9 "A Colombian heritage watchdog says the site was already disturbed, in twenty sixteen and twenty twenty two, and that the coordinates leaked. The state institute denies it."
  s(156, 'deep', 'silt', [0, 2.0, 6.2], [0, 0.9, -1.4], 42, {push: 0.07, tag: 'ALREADY DISTURBED?'}),
  s(165, 'deep', 'silt', [1.0, 1.5, 4.0], [0.6, 0.8, -1.6], 40, {push: 0.09}),
  s(174, 'chart', 'leak', [0.9, 1.9, 1.6], [0.9, 0.97, -1.0], 40, {push: 0.1, close: true, tag: 'THE COORDINATES'}),
  s(178, 'court', 'deny', [3.7, 1.55, 3.2], [3.7, 1.3, 0], 38, {push: 0.08, close: true, tag: 'ICANH'}),
  // 10 "The government says this is science, not treasure. President Petro wants her raised before his term ends."
  s(183, 'press', 'science', [0, 1.8, 4.4], [0, 1.35, -1.0], 36, {push: 0.07, tag: 'BOGOTÁ'}),
  s(191, 'press', 'petro', [0.2, 1.8, 4.4], [0.15, 1.35, -1.0], 34, {push: 0.08, close: true, tag: 'PRESIDENT GUSTAVO PETRO'}),
  // 11 "So far: a cannon in a refrigerated container, coins kept in salt water, and the cups."
  s(200, 'lab', 'cannon', [1.4, 2.5, 5.4], [0.1, 0.7, 0.5], 44, {push: 0.1, close: true}),
  s(208, 'lab', 'coins', [1.4, 1.5, 2.6], [1.4, 0.92, 0.6], 36, {push: 0.1, close: true}),
  s(213, 'lab', 'cups', [1.5, 1.45, 0.8], [1.5, 1.05, -1.55], 38, {push: 0.1, close: true}),
  // 12 "The rest stays where it is, at the bottom, with the men who went down with her."
  s(216, 'deep', 'wreck', [0, 3.0, 13.0], [0, 1.0, -1.8], 54, {push: 0.04}),
  s(222, 'deep', 'grave', [0.8, 1.8, 7.0], [0.2, 0.7, -1.6], 40, {push: 0.06}),
  // 13 "...So who is she: the country she sank off, the country that lost her, the nation whose silver she carries, or the men who say they found her first?"
  s(233, 'court', 'four', [0, 1.65, 4.8], [0, 1.3, -0.6], 62, {push: 0.06}),
  s(250, 'deep', 'grave', [0, 2.6, 12.0], [0, 0.8, -1.6], 46, {push: 0.05}),
];

/** index of the shot that is on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
/** first frame of the shot after shot i (the film's length for the last) */
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
