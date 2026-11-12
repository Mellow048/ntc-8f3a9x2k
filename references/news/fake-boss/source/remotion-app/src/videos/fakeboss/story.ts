// Timing for the fake boss short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/fake-boss/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'desk' | 'call' | 'room' | 'sheet' | 'mail' | 'podium' | 'three' | 'city' | 'cash' | 'paper' | 'scales' | 'final' | 'hospital' | 'petfood' | 'board' | 'crypto' | 'laundry' | 'bank' | 'gate';
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
  // 1  "Your boss calls you on video: wire five million dollars, and tell no one. His voice. His face. It isn't him!"
  s(0, 'desk', 'ring', [0.5, 1.5, 5.9], [0.1, 1.3, -0.4], 42, {push: 0.12}),                              // 0
  s(6, 'call', 'wire', [0.5, 1.6, 4.7], [0.25, 1.6, -0.3], 42, {push: 0.08}),                             // 1
  s(10, 'call', 'hush', [-0.2, 1.72, 3.0], [0, 1.72, -0.3], 42, {push: 0.07, close: true}),               // 2
  // 3-4 are one take: his voice, his face, and then the picture breaks up and whoever is behind it shows
  s(14, 'call', 'voice', [0.35, 1.6, 4.8], [0.12, 1.6, -0.3], 42, {to: [0.3, 1.62, 4.3]}),                // 3
  s(18, 'call', 'reveal', [0.35, 1.6, 4.8], [0.12, 1.6, -0.3], 42, {join: true}),                         // 4
  // 2  "Prosecutors in New York say three men and their partners tried that on thousands of companies, using A.I., and took about a hundred and twenty-nine million dollars."
  s(21, 'podium', 'says', [0.3, 1.5, 5.9], [0, 1.45, -0.3], 42, {push: 0.1}),                             // 5
  s(26, 'three', 'men', [0.4, 1.45, 6.3], [0, 1.2, -0.3], 42, {push: 0.1}),                               // 6
  s(31, 'city', 'thousands', [0.7, 4.6, 7.6], [0, 1.0, -1.6], 42, {to: [0.2, 4.0, 6.3]}),                 // 7
  s(37, 'room', 'ai', [-0.05, 1.5, 4.6], [-0.2, 1.45, -0.4], 42, {push: 0.08}),                           // 8
  s(39, 'cash', 'total', [0.5, 1.15, 5.9], [0, 0.85, -0.3], 42, {to: [0.2, 1.7, 6.3], targetTo: [0, 1.3, -0.3]}),   // 9
  // 3  "The indictment says it began with an email in the CEO's name."
  s(48, 'paper', 'indict', [0.35, 1.7, 4.8], [0, 1.7, -0.4], 42, {push: 0.08}),                           // 10
  s(53, 'desk', 'email', [-0.1, 1.37, 4.1], [0.17, 1.27, 0], 42, {push: 0.07}),                           // 11
  // 4  "One read, quote: we need to loop you into a deal we've been working on."
  // 12-13 are one take on the message: it opens, then its lines, the agreement to sign and the lawyer to call come up
  s(60, 'mail', 'open', [0.25, 1.6, 5.8], [0, 1.6, -0.4], 42, {to: [0.08, 1.6, 5.4]}),                      // 12
  s(63, 'mail', 'quote', [0.25, 1.6, 5.8], [0, 1.6, -0.4], 42, {join: true}),                              // 13
  // 5  "Then, the call: the CEO's voice, and sometimes his face, made by A.I."
  s(75, 'desk', 'answer', [0.42, 1.37, 4.3], [0.17, 1.27, 0], 42, {push: 0.07}),                          // 14
  s(78, 'room', 'voice', [0.2, 1.4, 5.1], [-0.1, 1.35, 0], 42, {push: 0.07}),                             // 15
  s(81, 'room', 'face', [0.2, 1.4, 5.1], [-0.1, 1.35, 0], 42, {join: true}),                              // 16
  s(85, 'desk', 'believe', [-0.3, 1.4, 4.0], [0.17, 1.36, 0], 42, {push: 0.05, close: true}),             // 17
  // 6  "Next came a lawyer: also fake, under a real attorney's name."
  s(88, 'call', 'lawyer', [-0.3, 1.7, 4.7], [0, 1.76, -0.3], 42, {push: 0.08}),                            // 18
  s(92, 'room', 'swap', [0.2, 1.45, 5.7], [-0.05, 1.4, -0.4], 42, {push: 0.06}),                           // 19
  s(94, 'room', 'name', [0.95, 1.02, 2.5], [0.66, 0.88, 0.62], 42, {push: 0.08, close: true}),            // 20
  // 7  "One defendant, prosecutors say, kept a handwritten script. Its title: Lawyer Call."
  s(99, 'room', 'script', [-0.1, 1.45, 5.0], [0.2, 1.35, -0.4], 42, {push: 0.07}),                       // 21
  // 22-23 are one take: up the page to its title
  s(103, 'sheet', 'hand', [0.05, 2.9, 1.6], [0, 0.78, 0.22], 42, {to: [0, 2.55, 1.0], targetTo: [0, 0.78, -0.3]}),   // 22
  s(107, 'sheet', 'title', [0.05, 2.9, 1.6], [0, 0.78, 0.22], 42, {join: true}),                          // 23
  // 8  "And it worked, the indictment says. A Missouri hospital system sent four point eight million dollars. A Florida pet food company, five point two million."
  s(111, 'desk', 'send', [0.5, 1.5, 5.6], [0.1, 1.35, -0.3], 42, {push: 0.1}),                            // 24
  // 25-26 are one take on the hospital: there it is, then the money leaves it
  s(117, 'hospital', 'mo', [0.6, 1.5, 7.2], [0, 1.55, -1.0], 42, {to: [0.2, 1.5, 6.4]}),                  // 25
  s(122, 'hospital', 'sent', [0.6, 1.5, 7.2], [0, 1.55, -1.0], 42, {join: true}),                         // 26
  s(127, 'petfood', 'fl', [-0.5, 1.5, 7.0], [0, 1.45, -1.0], 42, {push: 0.1}),                             // 27
  s(132, 'petfood', 'bowl', [0.6, 1.3, 4.9], [0.27, 1.25, 0.6], 42, {push: 0.06, close: true}),           // 28
  // 9  "The money went to accounts in at least nine countries, then into crypto."
  s(136, 'board', 'nine', [0.35, 1.6, 6.1], [0, 1.56, -0.6], 42, {push: 0.1}),                            // 29
  s(146, 'crypto', 'coins', [0.5, 1.5, 5.8], [0.25, 1.4, -0.3], 42, {push: 0.06}),                            // 30
  // 10 "Two defendants have aliases in the indictment. Rocky Balboa. Superman Cash. Impossible Mission."
  s(149, 'three', 'alias', [-0.25, 1.45, 6.5], [0, 1.2, -0.1], 42, {push: 0.08}),                          // 31
  s(156, 'three', 'rocky', [-0.5, 1.38, 3.4], [-0.78, 1.25, 0], 42, {push: 0.07, close: true}),           // 32
  s(158, 'three', 'cash', [0.3, 1.38, 3.4], [0, 1.25, 0], 42, {push: 0.07, close: true}),                 // 33
  // 11 "One allegedly boasted that at laundering money he was, quote: number one all over the world."
  s(162, 'laundry', 'boast', [0.45, 1.5, 6.0], [0, 1.3, -0.4], 42, {push: 0.1}),                          // 34
  s(167, 'laundry', 'spin', [-0.35, 1.0, 2.5], [-0.62, 0.92, -0.95], 42, {push: 0.1}),                    // 35
  s(171, 'laundry', 'quote', [0.75, 1.45, 4.7], [0.42, 1.38, -0.2], 42, {push: 0.08}),                    // 36
  // 12 "But it didn't always work. At one New York investment bank, an employee approved the wire. The back office stopped it."
  // 37-38 are one take: the skyline, then down to the bank's door
  s(178, 'bank', 'ny', [0.6, 1.7, 8.4], [0, 2.1, -1.5], 42, {to: [0.2, 1.5, 6.5], targetTo: [0, 1.6, -1.5]}),   // 37
  s(183, 'bank', 'door', [0.6, 1.7, 8.4], [0, 2.1, -1.5], 42, {join: true}),                              // 38
  s(189, 'gate', 'approve', [-0.15, 1.45, 6.3], [0.12, 1.25, -0.2], 42, {push: 0.04}),                         // 39
  s(194, 'gate', 'stop', [0.92, 1.4, 4.5], [0.7, 1.2, -0.4], 42, {push: 0.07}),                           // 40
  // 13 "All three were arrested this year. These are accusations: they are presumed innocent."
  s(199, 'three', 'arrest', [0.3, 1.7, 6.6], [0, 1.74, -0.2], 42, {push: 0.08}),                          // 41
  s(205, 'scales', 'accuse', [0.3, 2.0, 4.8], [0, 2.1, -0.8], 42, {push: 0.03}),                        // 42
  s(208, 'scales', 'innocent', [0.3, 1.6, 7.0], [0, 1.62, -0.3], 42, {push: 0.08}),                       // 43
  // 14 "So what stops a fake boss: sharper employees, or a rule that nobody sends millions alone?"
  // 44-45 are one take: the question, then a light on each answer
  s(212, 'final', 'what', [0.25, 1.3, 6.4], [0, 1.12, -0.2], 42, {to: [0, 1.3, 5.9]}),                    // 44
  s(218, 'final', 'choice', [0.25, 1.3, 6.4], [0, 1.12, -0.2], 42, {join: true}),                         // 45
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
