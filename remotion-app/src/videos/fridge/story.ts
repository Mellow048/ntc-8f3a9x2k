// Timing for the fridge hack short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/fridge-hack/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'aisle' | 'panel' | 'lair' | 'map' | 'front' | 'podium' | 'cable' | 'tech' | 'lecture' | 'lineup' | 'showroom' | 'ikea' | 'lab' | 'board' | 'desk';
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
  /** optional end point of the look-at: with `to`, a tracking shot */
  targetTo?: V;
  /** people fill the frame: blur the background a little more */
  close?: boolean;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});

export const SHOTS: Shot[] = [
  // 1  "Hackers turned up the heat in the freezers of about seven hundred French supermarkets. And France says Iran did it!"
  s(0, 'aisle', 'hook', [0.3, 1.45, 5.9], [0, 1.4, -0.4], 42, {push: 0.12}),                          // 0
  s(8, 'map', 'france', [0.2, 1.45, 5.6], [0, 1.42, -0.4], 42, {push: 0.1}),                          // 1
  s(14, 'podium', 'accuse', [0.4, 1.45, 5.9], [0, 1.45, -0.5], 42, {push: 0.14}),                     // 2
  // 2  "Overnight in October, some freezers hit fifty degrees Celsius. By morning: melted ice cream, spoiled meat, and more than a dozen fires."
  s(20, 'front', 'night', [1.2, 1.3, 9.6], [0, 1.5, -2], 40, {push: 0.08}),                           // 3
  s(23, 'aisle', 'hot', [1.5, 1.5, 5.3], [0, 1.4, -0.4], 42, {to: [0.9, 1.5, 4.9]}),                  // 4
  s(29, 'aisle', 'morning', [-0.5, 1.45, 5.7], [0, 1.4, -0.3], 42, {push: 0.1}),                      // 5
  s(34, 'front', 'dump', [0.75, 1.5, 6.3], [0.3, 1.25, 0.2], 42, {push: 0.08}),                        // 6
  s(36, 'front', 'fire', [-1.4, 1.4, 6.6], [0, 1.4, -1.2], 42, {push: 0.1}),                          // 7
  // 3  "Nobody set foot in a store. Someone got into the control panels online, muted the alarms, started a defrost, and never let it stop."
  s(42, 'front', 'locked', [-0.5, 1.25, 4.4], [0, 1.1, -1.9], 42, {push: 0.1}),                        // 8
  s(48, 'lair', 'login', [0.4, 1.45, 5.6], [0, 1.4, -0.9], 42, {push: 0.12}),                         // 9
  s(55, 'panel', 'mute', [0.6, 1.4, 4.9], [0.1, 1.38, -0.2], 40, {push: 0.08}),                       // 10
  s(58, 'panel', 'defrost', [-0.4, 1.4, 4.9], [0, 1.38, -0.2], 40, {push: 0.1}),                      // 11
  s(61, 'panel', 'stuck', [0.2, 1.4, 5.2], [0, 1.4, -0.2], 40, {push: 0.1}),                          // 12
  // 4  "Why are freezers online? So technicians can watch them day and night."
  s(66, 'cable', 'why', [0.3, 1.35, 5.3], [0, 1.3, -0.3], 42, {push: 0.08}),                           // 13
  s(70, 'tech', 'watch', [0.4, 1.45, 5.7], [0, 1.4, -0.6], 42, {push: 0.1}),                          // 14
  // 5  "One professor's verdict. Quote: a fridge doesn't look like a security risk, and that's exactly why attackers like it."
  s(78, 'lecture', 'intro', [0.4, 1.45, 5.8], [0, 1.4, -0.5], 42, {push: 0.1}),                       // 15
  s(82, 'lineup', 'innocent', [0.2, 1.4, 5.9], [0, 1.35, -0.4], 42, {push: 0.08}),                     // 16
  s(90, 'lair', 'love', [-0.3, 1.45, 5.6], [0, 1.4, -0.6], 42, {push: 0.12}),                         // 17
  // 6  "Danfoss, which makes many of those panels, points to outdated software."
  s(97, 'showroom', 'new', [0.5, 1.5, 5.6], [0, 1.4, 0], 42, {push: 0.12}),                           // 18
  s(104, 'showroom', 'old', [-0.4, 1.5, 5.4], [0, 1.4, 0], 42, {push: 0.12}),                         // 19
  // 7  "Three weeks later, the same trick hit stores from Sweden to Belgium. Even an IKEA. No word on the meatballs."
  s(108, 'panel', 'again', [0.3, 1.4, 5.2], [0, 1.4, -0.2], 40, {push: 0.12}),                        // 20
  s(114, 'map', 'europe', [-0.2, 1.45, 5.6], [0, 1.42, -0.4], 42, {push: 0.1}),                       // 21
  s(120, 'ikea', 'store', [0.8, 1.3, 9.2], [0, 1.5, -2], 40, {push: 0.1}),                            // 22
  s(123, 'ikea', 'meatballs', [0.3, 1.5, 4.6], [0, 1.3, 0], 40, {push: 0.14}),                        // 23
  // 8  "Someone even went for freezers at France's blood service. Staff caught it in time."
  s(128, 'lab', 'alarm', [0.4, 1.45, 5.8], [0, 1.4, -0.4], 42, {push: 0.1}),                          // 24
  s(137, 'lab', 'saved', [-0.4, 1.45, 5.6], [0, 1.4, -0.3], 42, {push: 0.08}),                        // 25
  // 9  "Neither has been tied to the first attack."
  s(142, 'board', 'nolink', [0.3, 1.45, 5.6], [0, 1.42, -0.4], 42, {push: 0.1}),                      // 26
  // 10 "For the first, France now names a culprit: a hacking unit of Iran's Revolutionary Guard."
  s(150, 'podium', 'paris', [-0.4, 1.45, 5.9], [0, 1.45, -0.5], 42, {push: 0.1}),                     // 27
  s(158, 'lair', 'accused', [0.3, 1.45, 5.8], [0, 1.4, -0.4], 42, {push: 0.12}),                      // 28
  // 11 "Prosecutors cite its methods, traces of Farsi, and Iranian IP addresses. France says it's certain. How exactly? It won't say."
  s(165, 'desk', 'method', [0.5, 1.6, 5.6], [0, 1.4, -0.3], 42, {push: 0.1}),                         // 29
  s(169, 'desk', 'traces', [-0.3, 1.55, 5.5], [0, 1.4, -0.3], 42, {push: 0.08}),                      // 30
  s(176, 'podium', 'sure', [0.3, 1.55, 4.9], [0, 1.55, -0.5], 42, {push: 0.12, close: true}),           // 31
  s(180, 'desk', 'sealed', [0.3, 1.55, 5.5], [0, 1.4, -0.3], 42, {push: 0.08}),                        // 32
  // 12 "Iran denies it. And its reply is ice cold. Quote: a government that cannot even manage the temperature of its own refrigerators."
  s(185, 'podium', 'deny', [-0.4, 1.45, 5.9], [0, 1.45, -0.5], 42, {push: 0.1}),                      // 33
  s(188, 'podium', 'ice', [0.5, 1.45, 5.7], [0, 1.45, -0.5], 42, {push: 0.12}),                       // 34
  s(194, 'podium', 'read', [0.2, 1.73, 5.3], [0, 1.73, -0.5], 42, {push: 0.05, close: true}),            // 35
  s(201, 'showroom', 'fridge', [0.4, 1.6, 5.6], [0, 1.6, 0], 42, {push: 0.12}),                        // 36
  // 13 "France wants arrest warrants and European sanctions."
  s(207, 'desk', 'warrant', [0.3, 1.55, 5.5], [0, 1.4, -0.3], 42, {push: 0.1}),                       // 37
  s(211, 'desk', 'sanctions', [-0.3, 1.55, 5.5], [0, 1.4, -0.3], 42, {push: 0.1}),                    // 38
  // 14 "The official advice? Take the freezers off the internet."
  s(214, 'desk', 'notice', [0.2, 1.55, 5.5], [0, 1.4, -0.3], 42, {push: 0.1}),                        // 39
  s(217, 'cable', 'unplug', [-0.3, 1.45, 5.9], [0, 1.4, -0.3], 42, {push: 0.1}),                      // 40
  // 15 "So what do you think: should a freezer be online at all?"
  s(223, 'aisle', 'restored', [0.4, 1.45, 5.9], [0, 1.4, -0.3], 42, {push: 0.08}),                    // 41
  s(228, 'cable', 'choice', [0.2, 1.5, 6.0], [0, 1.45, -0.3], 42, {push: 0.05}),                      // 42
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
