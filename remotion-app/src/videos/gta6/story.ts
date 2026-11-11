// Timing for the GTA 6 leaker short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/gta6-cyberleek/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'lair' | 'spot' | 'store' | 'mountain' | 'vice' | 'studio' | 'feed' | 'coin' | 'chart' | 'court' | 'office' | 'fans' | 'lineup';
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
  // 1  "A leaker threatened to release the most awaited video game on Earth. Before the studio could!"
  s(0, 'lair', 'hook', [0.5, 1.45, 5.5], [0.05, 1.5, -0.2], 40, {push: 0.16}),                        // 0
  s(5, 'spot', 'earth', [0.4, 1.6, 6.8], [0, 1.75, 0], 40, {push: 0.12}),                             // 1
  s(12, 'studio', 'shock', [0.5, 1.5, 6.2], [0, 1.7, -1], 42, {push: 0.14}),                          // 2
  // 2  "It's Grand Theft Auto Six, out November nineteenth. The last one sold two hundred thirty million copies!"
  s(16, 'vice', 'title', [-1.2, 1.3, 10.5], [0, 3.0, -3], 42, {push: 0.08}),                          // 3
  s(21, 'vice', 'cruise', [1.3, 0.9, 6.6], [0, 1.35, 0.3], 42, {to: [0.3, 0.9, 6.0]}),                // 4
  s(24, 'mountain', 'copies', [0.8, 1.2, 11], [0, 3.4, 0], 44, {push: 0.1}),                          // 5
  // 3  "In August, an account called Cyberleek, like the vegetable, started posting leaked clips."
  s(33, 'lair', 'post', [-0.9, 1.6, 4.9], [0, 1.55, -1.2], 40, {to: [0.4, 1.6, 4.5]}),                // 6
  s(37, 'spot', 'name', [-0.4, 1.5, 5.3], [0, 1.6, 0], 38, {push: 0.12, close: true}),                // 7
  s(39, 'spot', 'veg', [0.3, 1.5, 6.3], [0.1, 1.5, 0], 38, {push: 0.08}),                             // 8
  s(42, 'feed', 'clips', [0.5, 1.6, 8.2], [0, 2.6, -0.6], 40, {push: 0.1}),                           // 9
  // 4  "They called it a protest: the boxed game has no disc. Just a download code."
  s(46, 'spot', 'protest', [0.5, 1.45, 6.0], [0, 1.75, 0], 38, {push: 0.1}),                          // 10
  s(51, 'store', 'open', [0.5, 1.6, 4.9], [0, 1.45, 0], 40, {push: 0.1}),                             // 11
  s(57, 'store', 'code', [0.1, 1.5, 3.3], [0.36, 1.42, 0.45], 38, {push: 0.06, close: true}),         // 12
  // 5  "But every clip advertised the leaker's own crypto coin."
  s(61, 'feed', 'ads', [-0.6, 1.8, 7.2], [0, 2.7, -0.6], 40, {push: 0.1}),                            // 13
  s(65, 'coin', 'hero', [0.5, 1.5, 6.6], [0.05, 1.65, 0], 40, {push: 0.14}),                          // 14
  // 6  "Outside estimates say it made them at least two hundred thousand dollars. Cyberleek's words: a donation, never an investment."
  s(70, 'coin', 'cash', [-0.5, 1.5, 6.6], [0.15, 1.55, 0], 40, {push: 0.1}),                          // 15
  s(78, 'coin', 'pile', [1.15, 1.15, 5.6], [0.75, 1.3, 0.3], 38, {push: 0.08}),                       // 16
  s(82, 'spot', 'jar', [-0.4, 1.45, 5.1], [0, 1.55, 0], 38, {push: 0.1, close: true}),                // 17
  // 7  "Rockstar called the leaks, quote, heartbreaking for our team. Its owner, Take-Two, went to court to unmask the leaker."
  s(89, 'studio', 'sad', [-0.6, 1.5, 6.4], [0, 1.7, -1], 42, {push: 0.1}),                            // 18
  s(93, 'studio', 'close', [0.95, 1.5, 3.1], [0.45, 1.5, -0.45], 38, {push: 0.06, close: true}),      // 19
  s(98, 'court', 'steps', [0.4, 1.4, 11.5], [0, 3.0, 0], 42, {push: 0.08}),                           // 20
  s(104, 'spot', 'unmask', [0.3, 1.5, 5.5], [0, 1.6, 0], 38, {push: 0.12, close: true}),              // 21
  // 8  "Then in October, the threat: if the coin hits thirty million dollars, the whole game goes public!"
  s(108, 'lair', 'october', [-0.6, 1.5, 5.9], [0, 1.65, -1], 42, {push: 0.12}),                       // 22
  s(113, 'chart', 'target', [0.7, 1.5, 7.8], [0, 3.0, -2.9], 44, {push: 0.1}),                        // 23
  s(120, 'lair', 'button', [1.1, 1.55, 4.3], [0.3, 1.4, 0.5], 38, {push: 0.1, close: true}),          // 24
  // 9  "Take-Two's way out? Quote: physical disks and a public apology. Honestly? Most polite threat I've ever heard."
  s(125, 'office', 'note', [0.5, 1.6, 6.2], [0, 1.55, -0.5], 42, {push: 0.1}),                        // 25
  s(128, 'spot', 'demand', [0.4, 1.5, 5.7], [0.1, 1.5, 0.2], 38, {push: 0.1}),                        // 26
  s(135, 'spot', 'tea', [-0.5, 1.4, 5.3], [0, 1.4, 0.1], 38, {push: 0.12}),                           // 27
  // 10 "Nobody has verified they even have the whole game."
  s(142, 'spot', 'crate', [0.4, 1.6, 7.6], [0.1, 1.5, 0], 38, {push: 0.08}),                          // 28
  s(147, 'spot', 'crate', [1.25, 1.45, 5.0], [0.8, 1.4, 0.2], 38, {push: 0.08, close: true}),         // 29
  // 11 "The coin peaked at seven point eight million. Fans said: don't buy it. Two days later? One point seven."
  s(151, 'chart', 'peak', [-0.6, 1.4, 6.6], [-0.2, 2.5, -2.9], 42, {push: 0.1}),                      // 30
  s(159, 'fans', 'no', [0.4, 1.5, 6.0], [0, 1.7, -0.3], 40, {push: 0.1}),                             // 31
  s(164, 'chart', 'fall', [0.5, 1.3, 6.2], [0.4, 2.3, -2.9], 42, {push: 0.08}),                       // 32
  s(167, 'chart', 'bottom', [0.2, 1.3, 5.4], [0.15, 1.35, -1.0], 40, {push: 0.1}),                    // 33
  // 12 "So Cyberleek called it off. Quote: the leeks stop here. For now."
  s(170, 'lair', 'off', [0.5, 1.5, 5.9], [0, 1.6, -0.8], 42, {push: 0.1}),                            // 34
  s(175, 'lair', 'door', [1.3, 1.5, 4.8], [2.3, 1.55, -2.7], 40, {push: 0.1}),                        // 35
  s(180, 'lair', 'peek', [1.9, 1.5, 2.4], [2.6, 1.6, -2.9], 38, {push: 0.12, close: true}),           // 36
  // 13 "So far, nobody's been publicly identified or charged. And Take-Two says pre-orders are far ahead of expectations."
  s(182, 'lineup', 'row', [0.42, 1.2, 7.0], [0.42, 1.5, 0], 40, {push: 0.06}),                        // 37
  s(190, 'vice', 'queue', [1.0, 1.6, 8.8], [0, 2.0, -1.6], 42, {push: 0.1}),                          // 38
  s(195, 'vice', 'meter', [-0.5, 1.7, 6.4], [0, 3.6, -2.5], 40, {push: 0.1}),                         // 39
  // 14 "Take-Two's boss says discs don't really make sense for the consumer. Plenty of players disagree."
  s(199, 'office', 'ceo', [0.6, 1.5, 5.9], [0, 1.6, 0], 40, {push: 0.1}),                             // 40
  s(202, 'office', 'close', [-0.75, 1.55, 3.9], [-0.3, 1.6, 0.1], 38, {push: 0.08, close: true}),     // 41
  s(210, 'fans', 'discs', [-0.4, 1.4, 6.0], [0, 1.5, -0.3], 40, {push: 0.1}),                         // 42
  // 15 "So what do you think: if you pay eighty dollars for a game, should there be a disc in the box?"
  s(214, 'store', 'final', [0.3, 1.6, 5.4], [-0.1, 1.45, 0], 40, {push: 0.08}),                       // 43
  s(219, 'store', 'price', [-0.15, 1.45, 3.6], [-0.1, 1.32, 0.5], 38, {push: 0.08, close: true}),     // 44
  s(227, 'store', 'choice', [0, 1.55, 5.2], [0, 1.5, 0.2], 40, {push: 0.06}),                         // 45
];
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
