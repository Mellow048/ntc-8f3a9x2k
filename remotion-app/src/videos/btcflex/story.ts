// Timing for the bitcoin flex short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/bitcoin-flex/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'coins' | 'desk' | 'drive' | 'villa' | 'deep' | 'club' | 'cal' | 'room' | 'globe' | 'screen' | 'mask' | 'jet' | 'fleet' | 'feed' | 'sleuth' | 'court' | 'steps' | 'split';
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
  // 1  "He helped steal nearly a quarter of a billion dollars in bitcoin from one man. Then he showed it off: supercars, mansions,
  //     nightclubs. It lasted one month!"
  s(0, 'coins', 'pile', [0.3, 1.5, 6.0], [0, 0.8, 0], 42, {push: 0.08}),                                    // 0
  s(12, 'desk', 'one', [0.45, 1.45, 4.7], [0.15, 1.25, 0], 42, {push: 0.07}),                               // 1
  s(15, 'drive', 'selfie', [0.3, 1.5, 7.2], [0, 1.35, 3.4], 42, {push: 0.07, close: true}),                // 2
  s(20, 'drive', 'row', [0.4, 4.2, 7.4], [0.2, 0.4, -0.2], 42, {push: 0.06}),                              // 3
  s(21, 'villa', 'wide', [2.4, 2.0, 13.0], [0.2, 2.0, 0], 42, {push: 0.05}),                               // 4
  s(22, 'club', 'party', [0.3, 1.7, 5.2], [0.05, 1.65, -1.0], 42, {push: 0.07}),                           // 5
  s(23, 'cal', 'hook', [0, 1.9, 4.0], [0, 1.95, 0], 42, {push: 0.05}),                                     // 6
  // 2  "August twenty twenty-four. Malone Lam is twenty, a school dropout from Singapore, leading a crew that met through online games."
  s(27, 'room', 'wide', [0.3, 1.6, 5.4], [0, 1.45, 0], 42, {push: 0.07}),                                  // 7
  s(30, 'room', 'close', [0.25, 1.6, 3.1], [0, 1.55, -0.2], 42, {push: 0.07, close: true}),                // 8
  s(34, 'globe', 'path', [0.2, 1.75, 6.4], [0.05, 1.7, 0], 42, {push: 0.05}),                              // 9
  s(39, 'screen', 'lobby', [0, 2.3, 7.6], [0, 2.35, -0.4], 42, {push: 0.05}),                              // 10
  // 3  "Prosecutors say they phoned a man in Washington, posing as Google security, then as his crypto exchange, until he let them
  //     into his computer."
  s(47, 'mask', 'dial', [0.3, 1.5, 5.6], [0, 1.45, 0], 42, {push: 0.07}),                                  // 11
  s(51, 'desk', 'ring', [0.6, 1.6, 4.0], [0.4, 1.5, 0.2], 42, {push: 0.07}),                               // 12
  s(55, 'mask', 'google', [0.35, 1.62, 3.9], [0.2, 1.58, 0], 42, {push: 0.06, close: true}),               // 13
  s(59, 'mask', 'exchange', [0.35, 1.62, 3.9], [0.2, 1.58, 0], 42, {join: true, close: true}),             // 14  one take with 13: only the paper face changes
  s(64, 'desk', 'allow', [0.45, 1.98, 4.0], [0.36, 1.93, 0.3], 42, {push: 0.09}),                          // 15
  // 4  "Over forty-one hundred bitcoin vanished: more than two hundred thirty million dollars."
  s(71, 'coins', 'drain', [0.25, 1.9, 6.4], [0.15, 1.0, 0], 42, {push: 0.06}),                             // 16
  s(76, 'coins', 'gone', [0.25, 1.9, 6.4], [0.15, 1.0, 0], 42, {join: true}),                              // 17  one take with 16
  // 5  "Then came the flex. Miami mansions. Private jets. Up to half a million dollars a night in clubs."
  s(83, 'drive', 'flex', [-0.3, 1.45, 7.4], [0, 1.3, 3.4], 42, {push: 0.08, close: true}),                 // 18
  s(87, 'villa', 'pool', [1.4, 5.4, 6.2], [0.0, 0.2, 1.2], 42, {push: 0.06}),                              // 19
  s(89, 'jet', 'board', [0.2, 2.0, 12.0], [-0.3, 1.8, -0.5], 42, {push: 0.03}),                             // 20
  s(91, 'club', 'bill', [-0.5, 1.6, 4.3], [-0.2, 1.6, -0.9], 42, {push: 0.08}),                            // 21
  s(97, 'club', 'receipt', [1.0, 1.5, 3.3], [1.1, 1.42, 1.5], 42, {push: 0.1, close: true}),               // 22
  // 6  "And some thirty exotic cars, one a three point eight million dollar Pagani. He was posting it online."
  s(101, 'fleet', 'tower', [0, 3.3, 10.5], [0, 3.45, -2.0], 42, {push: 0.04}),                              // 23
  s(106, 'fleet', 'hero', [1.9, 1.95, 8.3], [0, 0.9, 1.6], 42, {push: 0.05}),                              // 24  far enough back for the whole car, nose to wing, at every angle of the turntable
  s(114, 'feed', 'post', [0.2, 2.2, 6.4], [0, 2.2, 0], 42, {push: 0.05}),                                  // 25
  // 7  "Someone was watching. An investigator known only as ZachXBT followed the coins, and the posts."
  s(119, 'sleuth', 'watch', [-0.8, 1.62, 4.3], [-0.95, 1.6, 0], 42, {push: 0.07, close: true}),            // 26
  s(122, 'sleuth', 'who', [0.5, 1.9, 6.6], [0.45, 2.0, -0.6], 42, {push: 0.05}),                           // 27
  s(128, 'sleuth', 'coins', [0.8, 2.95, 3.2], [0.75, 2.9, -1.2], 42, {push: 0.06}),                        // 28
  s(131, 'sleuth', 'posts', [0.7, 1.35, 2.6], [0.75, 1.25, -1.2], 42, {push: 0.06}),                       // 29
  // 8  "He says the crew shared a screen with friends during the theft, and somebody recorded it."
  s(134, 'screen', 'share', [0.1, 2.3, 7.4], [0, 2.35, -0.4], 42, {push: 0.06}),                           // 30
  s(146, 'screen', 'rec', [0.3, 1.58, 3.17], [0.22, 1.5, -0.43], 42, {push: 0.04}),                        // 31
  // 9  "One month after the theft, the F.B.I. arrested him in Miami. The indictment says he dropped his phone into the bay first."
  s(150, 'cal', 'month', [0, 1.9, 4.0], [0, 1.95, 0], 42, {push: 0.05}),                                   // 32
  s(155, 'villa', 'raid', [0.5, 1.6, 9.3], [0.5, 1.3, 2.7], 42, {push: 0.05}),                             // 33  wide: all three stand inside the frame
  s(161, 'villa', 'dock', [2.25, 2.2, 2.3], [2.3, 1.25, 6.6], 42, {push: 0.05}),                           // 34  the reverse angle: from the terrace out over the bay, so the water he throws into is behind him and above the caption
  s(168, 'deep', 'sink', [0, 1.7, 5.4], [0, 1.7, 0], 42, {push: 0.05}),                                    // 35
  // 10 "This September he pleaded guilty to racketeering conspiracy. He faces up to twenty years."
  s(172, 'court', 'plea', [0.2, 1.75, 6.6], [0, 1.6, -1.0], 42, {push: 0.05}),                             // 36
  s(180, 'court', 'years', [-0.5, 1.55, 2.9], [-0.8, 1.5, -0.45], 42, {push: 0.07, close: true}),          // 37
  // 11 "The judge asked which cars he bought himself. Quote: I would need some time."
  s(186, 'court', 'judge', [0.25, 2.1, 1.3], [0, 2.05, -2.85], 42, {push: 0.06}),                          // 38
  s(194, 'court', 'time', [-1.05, 1.6, 2.5], [-0.8, 1.55, -0.45], 42, {push: 0.06, close: true}),          // 39
  // 12 "Prosecutors call it a cybercrime empire. His lawyer: quote, a very sad case of a bunch of kids."
  s(200, 'steps', 'pros', [-1.25, 1.6, 5.4], [-1.4, 1.55, 0.6], 42, {push: 0.05}),                           // 40
  s(206, 'steps', 'def', [1.8, 1.5, 4.9], [1.6, 1.5, 1.0], 42, {push: 0.06}),                              // 41
  s(213, 'screen', 'kids', [0, 2.5, 4.6], [0, 2.5, -0.33], 42, {push: 0.05}),                              // 42
  // 13 "So who gets sentenced: a crime boss, or a kid in way over his head?"
  s(218, 'split', 'what', [0.15, 1.7, 8.1], [0, 1.95, 0], 42, {to: [0, 1.7, 8.3]}),                        // 43  it backs away a little
  s(222, 'split', 'choice', [0.15, 1.7, 8.1], [0, 1.95, 0], 42, {join: true}),                             // 44  one take with 43: the question, then a light on each side
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
