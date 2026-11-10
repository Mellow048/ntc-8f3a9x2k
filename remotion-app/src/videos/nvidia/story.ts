// Timing for the Nvidia short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/nvidia-honeypot/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'stage' | 'void' | 'wardrobe' | 'monument' | 'datacenter' | 'dock' | 'surveillance' | 'corkboard' | 'cinema' | 'interview'
  | 'office' | 'trading' | 'courthouse' | 'living' | 'boardroom' | 'capitol' | 'pressroom' | 'restaurant';
export type Shot = {
  /** first frame (cut lands just ahead of the word) */
  at: number; kind: Kind;
  /** which staging of the set */
  v: string;
  cam: V; target: V; fov: number;
  /** how far the camera pushes toward the target over the shot (0.1 = 10 %) */
  push?: number;
  /** optional end position: the camera travels there instead of pushing in */
  to?: V;
  /** people fill the frame: blur the background a little more */
  close?: boolean;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});

export const SHOTS: Shot[] = [
  // 1  "Nvidia's CEO just admitted to an affair, and U.S. intelligence thinks the woman is a Chinese spy!"
  s(0, 'stage', 'hook', [0.7, 1.15, 7.4], [0, 1.5, 0.5], 38, {push: 0.16}),
  s(7, 'surveillance', 'intro', [-0.5, 1.5, 6.6], [0, 2.75, -1.6], 40, {push: 0.12}),
  s(11, 'void', 'spy', [0.5, 1.35, 5.6], [0, 1.4, 0], 38, {push: 0.2, close: true}),
  // 2  "This is Jensen Huang, the leather jacket guy who runs the world's most valuable chip company."
  s(17, 'stage', 'name', [-0.9, 1.45, 4.3], [0, 1.6, 0.5], 36, {push: 0.1, close: true}),
  s(21, 'wardrobe', 'row', [-0.35, 1.9, 6.0], [0, 1.95, 0], 40, {to: [0.35, 1.9, 5.3]}),
  s(25, 'monument', 'hero', [1.8, 1.6, 13.2], [0, 4.2, 0], 42, {push: 0.12}),
  // 3  "And this is Alice Huang. Not related."
  s(33, 'void', 'alice', [-0.5, 1.4, 4.9], [0, 1.45, 0], 38, {push: 0.12, close: true}),
  s(38, 'void', 'pair', [0, 1.45, 6.6], [0, 1.45, 0], 38, {push: 0.06}),
  // 4  "She was an executive at Megaspeed, a company investigated over Nvidia chips allegedly smuggled into China."
  s(40, 'datacenter', 'intro', [0.6, 1.5, 6.6], [0, 1.9, -1], 42, {push: 0.14}),
  s(46, 'datacenter', 'inspect', [-0.7, 1.5, 5.5], [0.45, 1.25, 0.9], 40, {push: 0.08, close: true}),
  s(52, 'dock', 'load', [0.2, 2.3, 9.0], [1.0, 1.7, 1.0], 42, {push: 0.12}),
  // 5  "U.S. officials reportedly believe China's spy agency recruited her to gather information on Jensen."
  s(56, 'surveillance', 'wide', [1.2, 1.6, 4.6], [0, 2.2, -1.6], 40, {to: [-0.3, 1.6, 4.0]}),
  s(60, 'corkboard', 'board', [-0.35, 2.2, 5.9], [0, 2.3, -0.2], 40, {push: 0.14}),
  s(65, 'stage', 'watch', [3.2, 2.6, 13.5], [0, 1.3, 0.5], 17, {push: 0.03}),
  // 6  "If true, that's a honeypot, straight out of a spy movie!"
  s(70, 'void', 'honey', [0.9, 1.9, 4.4], [0, 1.15, 0], 38, {push: 0.18}),
  s(75, 'cinema', 'front', [-0.9, 1.3, 9.6], [0, 3.9, 0], 42, {push: 0.1}),
  // 7  "Days earlier, Jensen called their relationship completely normal."
  s(81, 'interview', 'wide', [1.2, 1.45, 5.0], [0, 1.5, 0], 40, {push: 0.12}),
  s(87, 'interview', 'close', [-0.5, 1.45, 3.5], [0, 1.4, 0], 38, {push: 0.08, close: true}),
  // 8  "Then Sunday, he emails the whole company. Quote: I was unfaithful to my wife."
  s(89, 'office', 'ping', [0.4, 2.6, 6.2], [0, 1.25, -1.9], 42, {push: 0.12}),
  s(96, 'office', 'email', [0.12, 1.25, 2.5], [0, 1.45, -0.92], 40, {push: 0.05, close: true}),
  // 9  "Monday, Nvidia lost about a hundred ninety billion dollars in value. In one day!"
  s(103, 'trading', 'wide', [0.9, 1.5, 7.0], [0, 2.4, -1.5], 42, {push: 0.12}),
  s(107, 'trading', 'panic', [-0.7, 1.5, 4.0], [0, 1.45, 0], 40, {push: 0.1, close: true}),
  s(114, 'trading', 'arrow', [1.2, 1.0, 5.6], [0.1, 1.7, -0.5], 42, {push: 0.08}),
  // 10 "Shareholders sued five minutes after the market closed. Five minutes! I can't even pick a movie that fast."
  s(117, 'courthouse', 'run', [0.3, 1.5, 10.5], [0, 2.9, 0], 42, {push: 0.06}),
  s(125, 'courthouse', 'clock', [0.42, 1.8, 8.6], [0.45, 2.1, 3.0], 40, {push: 0.08, close: true}),
  s(127, 'living', 'couch', [0.5, 1.2, 4.0], [0, 1.15, -0.4], 40, {push: 0.1}),
  // 11 "Now the board's investigating, Congress wants a briefing, and Trump says the F.B.I. is looking into it."
  s(135, 'boardroom', 'probe', [0.5, 2.4, 6.0], [0, 1.7, -2.2], 42, {push: 0.12}),
  s(139, 'capitol', 'front', [-2.4, 1.0, 13.0], [0, 4.6, 0], 44, {push: 0.1}),
  s(143, 'pressroom', 'us', [0.9, 1.5, 5.4], [0, 1.65, 0], 40, {push: 0.08}),
  s(147, 'datacenter', 'fbi', [0.3, 1.3, 5.2], [0, 1.4, -0.4], 42, {push: 0.14}),
  // 12 "He says Jensen told him he had absolutely no idea she was a spy."
  s(152, 'pressroom', 'us', [-0.6, 1.6, 3.7], [0, 1.72, 0], 38, {push: 0.08, close: true}),
  s(159, 'void', 'noidea', [0.3, 1.4, 5.3], [0.1, 1.4, 0], 38, {push: 0.1, close: true}),
  // 13 "China calls it nothing but smears, and she hasn't been charged."
  s(166, 'pressroom', 'cn', [-0.3, 1.55, 4.9], [0, 1.72, 0], 40, {push: 0.1}),
  s(172, 'void', 'charged', [0.4, 1.4, 4.7], [0, 1.45, 0], 38, {push: 0.1, close: true}),
  // 14 "Nvidia's board says it has no reason to believe secrets leaked, and Jensen's still CEO."
  s(177, 'boardroom', 'statement', [-0.4, 2.0, 5.6], [0, 2.3, -2.4], 42, {push: 0.14}),
  s(188, 'boardroom', 'ceo', [0.3, 1.6, 1.0], [0, 1.75, -3.75], 38, {push: 0.08, close: true}),
  // 15 "So, targeted by spies? Or just the most expensive date in history?"
  s(192, 'void', 'target', [0, 1.5, 6.0], [0, 1.4, 0], 38, {push: 0.12}),
  s(196, 'restaurant', 'bill', [0.5, 1.7, 4.6], [0, 1.15, -0.1], 42, {push: 0.1}),
  // 16 "What are your thoughts about this?"
  s(204, 'stage', 'final', [0, 1.3, 6.6], [0, 1.45, 0.5], 38, {push: 0.08}),
];
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
