// Timing for the Nvidia exit short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/nvidia-exit/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'kitchen' | 'counter' | 'diner' | 'booth' | 'chip' | 'office' | 'map' | 'ware' | 'racks' | 'paper' | 'case' | 'floor' | 'board' | 'chart' | 'release' | 'podium' | 'stage' | 'copier';
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
  /**
   * This shot carries on the camera move of the shot before: the move of the first shot of the take runs across all of them, with no
   * restart at the join, and this shot's own `cam` and `target` are not used. Two uses: one take that holds several stagings of a set
   * (nothing in the picture jumps, so there is no cut to see), and a match cut (the set stays exactly where it was and only what
   * stands on it changes). Without it, two shots of the same thing from almost the same place make the picture hop.
   */
  join?: boolean;
  /**
   * This shot starts exactly where the shot before came to rest (same `cam` and `target` as that shot's end) and goes on in the same
   * take: its own small move then starts gently instead of with the usual punch off a cut, which would show as a bump.
   */
  soft?: boolean;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});

export const SHOTS: Shot[] = [
  // 1  "Jensen Huang washed dishes at Denny's, founded Nvidia in a Denny's booth, and built the first five-trillion-dollar company.
  //     On Thursday, he resigned."
  s(0, 'kitchen', 'wash', [0.3, 1.52, 3.4], [0, 1.3, 0.2], 42, {push: 0.08}),                               // 0
  s(6, 'booth', 'found', [0.2, 1.5, 4.7], [0, 1.3, -0.8], 42, {push: 0.05}),                                // 1
  s(12, 'chip', 'peak', [0.7, 1.9, 5.6], [0, 2.4, 0], 42, {push: 0.06}),                                    // 2
  s(18, 'office', 'chair', [0.5, 1.5, 4.3], [0, 1.25, -0.5], 42, {push: 0.07}),                             // 3
  // 2  "He was born in Taiwan. At fifteen, his first job was at Denny's. Quote: I was a dishwasher, I was a busboy, I waited tables."
  s(22, 'map', 'born', [0, 1.7, 5.5], [0, 1.7, 0], 42, {push: 0.05}),                                       // 4
  s(27, 'diner', 'job', [0.4, 1.55, 5.7], [-0.15, 1.4, 0.4], 42, {push: 0.06}),                             // 5
  s(35, 'kitchen', 'dish', [-0.45, 1.45, 2.6], [0.05, 1.34, 0.1], 42, {push: 0.07, close: true}),           // 6
  s(40, 'counter', 'bus', [-0.6, 1.45, 4.5], [-0.35, 1.1, 0.6], 42, {push: 0.05}),                          // 7
  s(44, 'counter', 'cups', [0.85, 1.3, 3.9], [0.4, 1.32, 0.9], 42, {push: 0.06}),                           // 8
  // 3  "In nineteen ninety-three, he and two engineers started a chip company in a Denny's booth. Why Denny's? Quote: It had all the
  //     coffee you could drink and no one could chase you out."
  s(47, 'booth', 'three', [-1.0, 1.6, 4.6], [0, 1.3, -0.8], 42, {push: 0.06}),                              // 9
  s(54, 'booth', 'napkin', [0.2, 2.5, 1.5], [0, 0.8, -0.3], 42, {push: 0.07}),                              // 10
  s(62, 'diner', 'why', [-1.6, 1.3, 6.2], [-0.5, 1.7, -1.0], 42, {push: 0.06}),                             // 11
  s(64, 'booth', 'coffee', [1.65, 1.65, 4.5], [0.87, 1.25, -0.5], 42, {push: 0.07}),                        // 12
  s(73, 'booth', 'stay', [0, 1.6, 4.9], [0, 1.35, -0.9], 42, {push: 0.06}),                                 // 13
  // 4  "Their first chip flopped. He says two hundred fifty thousand went out, and two hundred forty-nine thousand came back."
  s(80, 'ware', 'flop', [0.5, 1.35, 2.8], [0, 1.0, 0.6], 42, {push: 0.08}),                                 // 14
  s(84, 'ware', 'out', [-0.3, 2.3, 5.6], [1.2, 1.0, -1.6], 42, {push: 0.05}),                               // 15
  s(92, 'ware', 'back', [-0.7, 1.7, 7.0], [0.1, 1.15, 1.6], 42, {push: 0.05}),                              // 16
  // 5  "They survived. Then came A.I.: Nvidia makes the chips behind ChatGPT."
  s(99, 'ware', 'alive', [0.25, 1.5, 7.3], [0, 1.25, 2.5], 42, {push: 0.05}),                               // 17
  s(101, 'chip', 'ai', [1.6, 3.6, 3.4], [0, 1.3, 0], 42, {push: 0.08}),                                     // 18
  s(104, 'racks', 'hall', [0, 1.7, 6.2], [0, 1.5, -6], 42, {to: [0, 1.6, 3.6]}),                            // 19
  s(108, 'racks', 'chat', [0, 1.7, 6.2], [0, 1.5, -6], 42, {join: true}),                                   // 20  one take with 19: the window opens in the aisle
  // 6  "Two weeks ago, The New York Times tied him to a businesswoman U.S. officials suspect of spying for China."
  s(110, 'paper', 'drop', [0, 1.6, 6.2], [0, 1.6, 0], 42, {push: 0.1}),                                     // 21
  s(113, 'paper', 'tie', [0, 1.6, 6.2], [0, 1.6, 0], 42, {join: true}),                                     // 22  one take with 21
  s(122, 'case', 'suspect', [0.2, 1.6, 5.6], [0, 1.55, -0.4], 42, {push: 0.06}),                            // 23
  // 7  "Sunday, he wrote to his staff. Quote: I was unfaithful to my wife. The board kept him."
  s(129, 'office', 'write', [-0.8, 1.45, 3.5], [0, 1.3, -0.6], 42, {push: 0.07, close: true}),              // 24
  s(135, 'floor', 'memo', [0.5, 2.3, 6.2], [0, 1.25, -0.2], 42, {push: 0.05}),                              // 25
  s(142, 'board', 'keep', [0, 2.3, 5.6], [0, 1.15, -0.8], 42, {push: 0.06}),                                // 26
  // 8  "Wednesday, the Times reported a second relationship, with an executive who reported to him."
  s(146, 'paper', 'second', [0.3, 1.6, 5.7], [0, 1.58, 0], 42, {push: 0.07}),                               // 27
  s(153, 'chart', 'report', [0.25, 1.78, 5.8], [0, 1.78, 0], 42, {push: 0.03}),                             // 28
  // 9  "Thursday, after thirty-three years, he resigned. Nvidia's statement doesn't say why."
  s(160, 'office', 'leave', [2.0, 1.6, 5.4], [0.62, 1.3, -0.2], 42, {push: 0.06}),                          // 29
  s(166, 'release', 'why', [0.2, 1.65, 5.6], [0, 1.6, 0], 42, {push: 0.07}),                                // 30
  // 10 "China calls the spy claim a smear. The Justice Department says it has reached no conclusion. And he denies any knowledge of it."
  s(171, 'podium', 'china', [-1.3, 1.65, 5.0], [0, 1.5, 0], 42, {push: 0.06}),                              // 31
  s(178, 'podium', 'doj', [1.0, 1.65, 3.9], [0.05, 1.55, 0], 42, {push: 0.06}),                             // 32
  s(187, 'stage', 'deny', [0.4, 1.5, 3.8], [0, 1.3, 0], 42, {push: 0.07}),                                  // 33
  // 11 "That Denny's booth had a plaque. N.B.C. News visited Thursday. It was gone."
  s(194, 'booth', 'plaque', [0.4, 1.75, 2.4], [-0.05, 1.9, -1.3], 42, {push: 0.06}),                        // 34
  s(200, 'diner', 'crew', [1.6, 1.6, 5.6], [-0.1, 1.4, 0.4], 42, {push: 0.05}),                             // 35
  s(204, 'booth', 'gone', [0.4, 1.75, 2.4], [-0.05, 1.9, -1.3], 42, {push: 0.1}),                           // 36  the same place as 34, so that the eye can compare
  // 12 "One analyst says the board had to, quote, rip off the Band-Aid. Another says his knowledge is, quote, impossible to replicate."
  s(207, 'chip', 'aid', [-1.0, 2.9, 4.6], [0, 1.35, 0], 42, {push: 0.08}),                                  // 37
  s(214, 'chip', 'rip', [-1.0, 2.9, 4.6], [0, 1.35, 0], 42, {join: true}),                                  // 38  one take with 37
  s(219, 'copier', 'scan', [0.1, 1.5, 5.1], [0.06, 1.25, 0.25], 42, {push: 0.04}),                          // 39
  s(224, 'copier', 'print', [0.1, 1.5, 5.1], [0.06, 1.25, 0.25], 42, {join: true}),                         // 40  one take with 39
  // 13 "So, can Nvidia replace him?"
  s(228, 'office', 'empty', [0.15, 1.6, 4.6], [0, 1.35, -0.6], 42, {to: [0, 1.65, 5.3]}),                   // 41  it backs away a little
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
