// Timing for the sorry hackers short. Everything is keyed to words of the locked narration (words.json, written by
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

export type Kind = 'er' | 'map' | 'den' | 'ward' | 'road' | 'waiting' | 'notice' | 'ids' | 'bedside' | 'home' | 'their' | 'campus' | 'lab' | 'lineup' | 'final';
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
  // 1  "A cyberattack sent ambulances away from New Mexico's only top-level trauma center. Then the hackers said sorry, and offered patients money!"
  s(0, 'er', 'hit', [0.5, 1.55, 9.2], [0.15, 1.5, -0.6], 42, {push: 0.08}),                               // 0
  s(4, 'er', 'away', [-0.5, 1.5, 7.0], [0, 1.35, 0.2], 42, {push: 0.05}),                                 // 1
  s(8, 'map', 'only', [0.3, 1.6, 5.4], [0, 1.55, -0.4], 42, {push: 0.1}),                                 // 2
  s(12, 'den', 'sorry', [0.4, 1.4, 6.3], [0, 1.2, -0.2], 42, {push: 0.1}),                                // 3
  s(17, 'den', 'money', [0.45, 1.4, 3.6], [0.78, 1.3, 0.1], 42, {push: 0.08, close: true}),               // 4
  // 2  "October twenty-sixth, the University of New Mexico's health system. Staff say a voice came from their computers, claiming their data was stolen."
  // 5-6 are one take: the morning of the day, then in on the building
  s(21, 'er', 'date', [-0.6, 1.6, 9.2], [0, 1.7, -0.8], 42, {to: [-0.2, 1.5, 7.6]}),                      // 5
  s(23, 'er', 'name', [-0.6, 1.6, 9.2], [0, 1.7, -0.8], 42, {join: true}),                                // 6
  s(30, 'ward', 'voice', [0.3, 1.45, 5.6], [0, 1.25, -0.3], 42, {push: 0.09}),                            // 7
  s(38, 'ward', 'claim', [-0.2, 1.4, 3.4], [0.3, 1.3, 0.1], 42, {push: 0.07, close: true}),               // 8
  // 3  "For two hours, ambulances went elsewhere. Outpatient surgeries stopped for the day. By the next afternoon, the university said, systems were back."
  s(43, 'road', 'two', [0.1, 1.9, 5.8], [0.25, 2.35, -0.8], 42, {push: 0.07}),                            // 9
  s(46, 'road', 'else', [0.6, 1.6, 8.4], [0.1, 1.55, 0], 42, {push: 0.08}),                               // 10
  s(49, 'waiting', 'stop', [0.35, 1.45, 6.2], [0, 1.3, -0.4], 42, {push: 0.09}),                          // 11
  s(55, 'notice', 'back', [0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                           // 12
  s(62, 'er', 'back', [0.6, 1.5, 8.2], [0.1, 1.4, -0.3], 42, {push: 0.07}),                               // 13
  // 4  "A new group calling itself B.Y.O.D. claimed the attack, and the personal data of every student and employee."
  // 14-15 are one take: they come out of the dark, then the name they gave themselves lights up over them
  s(65, 'den', 'new', [-0.35, 1.3, 6.2], [0, 1.25, -0.2], 42, {to: [-0.1, 1.5, 6.9], targetTo: [0, 1.6, -0.2]}),   // 14
  s(70, 'den', 'name', [-0.35, 1.3, 6.2], [0, 1.25, -0.2], 42, {join: true}),                             // 15
  s(71, 'den', 'claim', [0.5, 1.35, 5.0], [0, 1.25, 0], 42, {push: 0.08}),                                // 16
  s(74, 'ids', 'every', [-0.7, 1.7, 5.2], [-0.2, 1.6, -0.6], 42, {to: [0.5, 1.6, 4.6], targetTo: [0.2, 1.6, -0.6]}),   // 17
  // 5  "Then it apologized. Quote: we did not know that it was running machines related to assisting patients in real time."
  s(83, 'den', 'apol', [0.3, 1.4, 6.0], [0, 1.2, -0.2], 42, {push: 0.09}),                                // 18
  s(86, 'den', 'quote', [-0.45, 1.4, 4.2], [-0.3, 1.3, 0], 42, {push: 0.07}),                             // 19
  // 20-21 are one take at the bed: the computer locks, and the nurse carries on by hand
  s(95, 'bedside', 'lock', [-0.25, 1.4, 5.4], [-0.1, 1.25, -0.2], 42, {to: [0, 1.4, 5.2], targetTo: [0, 1.25, -0.2]}),        // 20
  s(99, 'bedside', 'paper', [-0.25, 1.4, 5.4], [-0.1, 1.25, -0.2], 42, {join: true}),                     // 21
  // 6  "It offered the hospital a free key, and any patient affected up to twenty-five hundred dollars, for the inconvenience."
  s(103, 'den', 'key', [0.25, 1.42, 3.5], [0, 1.36, 0.1], 42, {push: 0.08, close: true}),                 // 22
  s(110, 'home', 'offer', [0.35, 1.4, 5.3], [0, 1.25, -0.2], 42, {push: 0.09}),                           // 23
  s(119, 'den', 'inconv', [-0.3, 1.35, 5.8], [0, 1.15, 0], 42, {push: 0.08}),                             // 24
  // 7  "Quote: we have morals and we have a heart, we are not villains."
  s(122, 'den', 'morals', [0.3, 1.46, 7.7], [0, 1.46, 0.1], 42, {push: 0.2}),                             // 25  far wider than the banner before it: three small figures under a great light
  s(131, 'den', 'villains', [-0.2, 1.6, 3.5], [0, 1.6, 0.1], 42, {push: 0.07, close: true}),              // 26
  // 8  "One catch. Quote: we are still going to keep the data."
  s(135, 'den', 'catch', [0.5, 1.35, 6.4], [0.15, 1.14, -0.2], 42, {push: 0.09}),                         // 27
  s(137, 'den', 'keep', [0.5, 1.35, 6.4], [0.15, 1.14, -0.2], 42, {join: true}),                          // 28  one take: a second wide camera beside the first made the picture hop
  s(143, 'den', 'hug', [0.55, 1.55, 4.8], [0.4, 1.25, 0.4], 42, {push: 0.07, close: true}),               // 29
  // 9  "The university says it made no concessions, and warns: do not answer. An offer of money can be one more scam."
  s(146, 'notice', 'noconc', [-0.3, 1.66, 4.9], [0, 1.66, -0.4], 42, {push: 0.08}),                       // 30
  s(153, 'home', 'warn', [-0.4, 1.4, 5.8], [0, 1.25, -0.2], 42, {push: 0.08}),                            // 31
  s(158, 'home', 'hook', [0.2, 1.5, 4.0], [0.12, 1.45, 0], 42, {push: 0.07, close: true}),                // 32
  s(164, 'notice', 'report', [0.2, 1.66, 4.7], [0, 1.66, -0.4], 42, {push: 0.07}),                        // 33
  // 10 "The group hit back: the university, it wrote, had a full panic attack and switched its own machines off."
  s(167, 'den', 'hit', [0.5, 1.45, 4.1], [0.36, 1.4, 0.1], 42, {push: 0.08, close: true}),                // 34
  s(171, 'their', 'panic', [0.4, 1.5, 6.2], [0, 1.4, -0.4], 42, {push: 0.06}),                            // 35
  s(180, 'their', 'off', [-0.75, 1.35, 3.6], [-0.9, 1.25, -0.3], 42, {to: [0.2, 1.5, 5.4], targetTo: [0.1, 1.4, -0.4]}),   // 36
  // 11 "Two weeks later the group claimed Vanderbilt University, where computers reportedly said, quote: failure to communicate will
  //     result in this estate being brought to the ground completely."
  // 37-38 are one take: the campus, then in on its sign
  s(186, 'campus', 'later', [0.5, 1.5, 8.6], [0, 1.45, -0.4], 42, {to: [0.2, 1.3, 7.2], targetTo: [0, 1.2, -0.4]}),  // 37
  s(192, 'campus', 'name', [0.5, 1.5, 8.6], [0, 1.45, -0.4], 42, {join: true}),                           // 38
  s(194, 'lab', 'said', [0.35, 1.5, 6.0], [0, 1.25, -0.3], 42, {push: 0.09}),                             // 39
  s(198, 'lab', 'quote', [-0.3, 1.35, 3.5], [-0.42, 1.25, 0.1], 42, {push: 0.07, close: true}),           // 40
  s(206, 'lab', 'ground', [0.2, 0.9, 5.6], [0, 1.3, -0.3], 42, {push: 0.1}),                              // 41
  // 12 "No one has been charged."
  s(213, 'lineup', 'none', [0.3, 1.5, 6.4], [0, 1.4, -0.4], 42, {push: 0.08}),                            // 42
  // 13 "So what was that apology: a conscience, or marketing?"
  // 43-44 are one take: the question, then a light on each answer
  s(218, 'final', 'what', [0.1, 1.35, 6.6], [-0.1, 1.2, -0.2], 42, {to: [-0.02, 1.35, 6.3]}),             // 43
  s(223, 'final', 'choice', [0.1, 1.35, 6.6], [-0.1, 1.2, -0.2], 42, {join: true}),                       // 44
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
