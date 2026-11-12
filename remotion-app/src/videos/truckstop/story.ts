// Timing for the truck-stop heist short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/truck-stop-heist/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'loot' | 'stop' | 'diner' | 'cab' | 'seven' | 'deal' | 'show' | 'road' | 'map' | 'trailer' | 'cold' | 'crash' | 'airport' | 'tags' | 'court' | 'scale';
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
  // 1  "Prosecutors say a hundred million dollars in jewels vanished from a truck in twenty-seven minutes, while one driver ate and the
  //     other slept. Now one of the accused has a plea deal."
  s(0, 'loot', 'pile', [0.3, 1.7, 5.9], [0, 0.62, 0], 42, {push: 0.08}),                                  // 0
  s(9, 'stop', 'wide', [0.2, 2.2, 13.5], [0.5, 2.9, -3], 42, {push: 0.05}),                               // 1
  s(15, 'diner', 'eat', [0.35, 1.75, 4.3], [0.05, 1.5, 0.3], 42, {push: 0.07, close: true}),              // 2
  s(19, 'cab', 'sleep', [-0.6, 1.9, 3.5], [-0.9, 1.6, -0.3], 42, {push: 0.06, close: true}),              // 3
  s(23, 'seven', 'one', [0.3, 1.5, 6.7], [0, 1.6, -0.3], 42, {push: 0.06}),                               // 4
  s(28, 'deal', 'sign', [0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                             // 5
  // 2  "July twenty twenty-two. A Brink's big rig leaves a jewelry show near San Francisco with seventy-three bags. The indictment
  //     says a crew followed it for three hundred miles."
  s(32, 'show', 'open', [0.4, 1.7, 8.0], [0, 1.7, -0.6], 42, {push: 0.07}),                               // 6
  s(35, 'road', 'leave', [-1.3, 1.7, 7.4], [0.9, 1.6, -4], 42, {push: 0.03}),                             // 7
  s(43, 'map', 'start', [-0.2, 1.95, 2.6], [-0.45, 1.98, -0.4], 42, {push: 0.08}),                        // 8
  s(46, 'trailer', 'full', [0.25, 1.5, 3.4], [0, 1.45, -1.3], 42, {push: 0.1}),                           // 9
  s(49, 'road', 'follow', [0, 3.4, 7.6], [0.3, 1.3, -7], 42, {push: 0.04}),                               // 10
  s(56, 'map', 'route', [0.15, 1.7, 3.0], [-0.25, 1.62, -0.4], 42, {push: 0.06}),                         // 11
  // 3  "Just after two A.M. it pulls into a truck stop. One driver goes in to eat. The other is asleep in the bunk."
  s(60, 'stop', 'clock', [-1.1, 3.2, -1.4], [-2.4, 3.9, -8], 42, {push: 0.06}),                           // 12
  s(64, 'stop', 'arrive', [-0.6, 2.0, 13.2], [0.6, 2.8, -3], 42, {push: 0.04}),                           // 13  far wider than the sign before it
  s(70, 'diner', 'in', [-0.4, 1.8, 5.6], [-0.5, 1.6, -0.6], 42, {push: 0.06}),                            // 14
  s(76, 'cab', 'alone', [-0.1, 1.95, 7.2], [-0.15, 1.85, -0.4], 42, {push: 0.05}),                        // 15
  // 4  "Twenty-seven minutes later, the lock is cut and twenty-four bags are gone."
  s(83, 'diner', 'clock', [0.7, 2.3, 1.2], [1.2, 2.42, -2.36], 42, {push: 0.1}),                          // 16
  s(86, 'stop', 'lock', [-2.5, 1.0, 3.5], [-1.45, 0.42, 0.8], 42, {push: 0.08}),                          // 17
  s(90, 'trailer', 'gone', [-0.2, 1.55, 3.3], [0, 1.45, -1.3], 42, {push: 0.08}),                         // 18
  // 5  "For nearly three years, nobody was charged."
  s(95, 'cold', 'box', [0.3, 1.9, 4.2], [0, 1.85, -0.7], 42, {push: 0.08}),                               // 19
  s(99, 'seven', 'none', [-0.3, 1.5, 7.0], [0, 1.6, -0.3], 42, {push: 0.05}),                             // 20
  // 6  "The break, the L.A. Times reports: phones that pinged cell towers along the route. And one of the crew had handed police his
  //     burner number the night before, as a witness to a crash."
  s(102, 'cold', 'break', [-0.25, 1.9, 3.5], [0, 1.95, -0.6], 42, {push: 0.1}),                           // 21
  s(105, 'deal', 'news', [-0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                           // 22
  s(108, 'road', 'towers', [-2.6, 1.5, 4.6], [1.2, 2.56, -5], 42, {push: 0.05}),                          // 23
  s(112, 'map', 'pings', [0.4, 1.4, 2.5], [-0.1, 1.48, -0.4], 42, {push: 0.06}),                          // 24
  s(116, 'crash', 'hand', [0.2, 1.65, 5.9], [0.05, 1.6, 1.2], 42, {push: 0.08}),                          // 25
  s(127, 'crash', 'note', [0.5, 1.4, 3.7], [0.62, 1.38, 1.9], 42, {push: 0.08, close: true}),             // 26  an insert: the officer's pad fills the frame
  s(130, 'crash', 'wide', [-0.7, 1.9, 9.6], [0, 2.0, 0.3], 42, {push: 0.05}),                             // 27
  // 7  "Seven men were charged. One was stopped at an airport in Panama."
  s(136, 'seven', 'charged', [0.35, 1.5, 6.8], [0, 1.6, -0.3], 42, {push: 0.06}),                         // 28
  s(140, 'airport', 'stop', [0.2, 1.6, 7.6], [-0.2, 1.5, 0.4], 42, {push: 0.05}),                         // 29
  // 8  "This month he agreed to plead guilty to robbing a different truck, one carrying AirTags. In the same deal, he admits the
  //     jewel heist."
  s(148, 'deal', 'page', [0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                            // 30
  s(155, 'tags', 'truck', [0.9, 1.7, 8.6], [0.2, 1.25, 0], 42, {push: 0.05}),                             // 31
  s(160, 'tags', 'tags', [0.15, 1.2, 4.0], [-0.25, 0.6, 1.7], 42, {push: 0.08, close: true}),             // 32
  s(163, 'deal', 'same', [-0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                           // 33
  s(169, 'loot', 'back', [-0.35, 1.5, 4.6], [0, 0.62, 0], 42, {push: 0.08}),                              // 34
  // 9  "Three others have pleaded not guilty. Two were never arrested. One was deported before trial; prosecutors say they didn't
  //     know."
  // 35-37 are one take: where each of the seven is now
  s(172, 'seven', 'three', [0.3, 1.5, 6.9], [0, 1.6, -0.3], 42, {to: [-0.12, 1.5, 6.5]}),                 // 35
  s(178, 'seven', 'two', [0.3, 1.5, 6.9], [0, 1.6, -0.3], 42, {join: true}),                              // 36
  s(182, 'seven', 'gone', [0.3, 1.5, 6.9], [0, 1.6, -0.3], 42, {join: true}),                             // 37
  s(187, 'court', 'empty', [0.1, 1.55, 6.4], [0, 1.4, -0.3], 42, {push: 0.06}),                           // 38
  // 10 "Most of the jewels are still missing. The jewelers put them at a hundred million dollars."
  s(192, 'show', 'empty', [-0.4, 1.7, 8.2], [0, 1.7, -0.6], 42, {push: 0.06}),                            // 39
  s(199, 'show', 'claim', [0.4, 1.6, 3.3], [0, 1.5, -0.8], 42, {push: 0.07, close: true}),                // 40
  s(204, 'scale', 'left', [-0.6, 1.8, 4.4], [-1.0, 1.9, 0], 42, {push: 0.07}),                            // 41
  // 11 "Brink's says they declared eight point seven million."
  s(208, 'deal', 'form', [0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                            // 42
  s(212, 'scale', 'right', [0.6, 1.8, 4.4], [1.0, 1.9, 0], 42, {push: 0.07}),                             // 43
  // 12 "So which number counts: what the jewelers lost, or what they declared?"
  // 44-45 are one take: the question, then a light on each side
  s(216, 'scale', 'what', [0.15, 1.7, 7.9], [0, 1.95, 0], 42, {to: [0, 1.7, 7.5]}),                       // 44
  s(220, 'scale', 'choice', [0.15, 1.7, 7.9], [0, 1.95, 0], 42, {join: true}),                            // 45
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
