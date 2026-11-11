// Timing for the Binance heist short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/binance-heist/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** hold the closing question long enough to read it and reach for the comments */
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + 1.55) * FPS);

export type Kind = 'vault' | 'tower' | 'den' | 'chart' | 'office' | 'screen' | 'home' | 'net' | 'fbi' | 'pyong' | 'party' | 'court' | 'ice' | 'wall' | 'final';
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
  // 1  "Hackers stole six point three billion dollars from Binance, the world's biggest crypto exchange. Their way in? A fake job interview!"
  s(0, 'vault', 'drain', [0.35, 1.5, 5.9], [0, 1.4, -0.8], 42, {push: 0.12}),                          // 0
  s(7, 'tower', 'exchange', [0.6, 1.3, 6.6], [0, 2.0, -2.2], 42, {push: 0.1}),                         // 1
  s(14, 'den', 'hook', [0.3, 1.5, 5.6], [0, 1.4, -0.3], 42, {push: 0.12}),                             // 2
  // 2  "It's the biggest crypto heist on record: over four times the last one."
  // 3-4 are one take: the tall pile rises, then the old record stacks itself up beside it four times over
  s(21, 'chart', 'record', [0.45, 1.5, 6.1], [0, 1.45, -0.3], 42, {to: [-0.2, 1.5, 5.5]}),             // 3
  s(28, 'chart', 'times', [0.45, 1.5, 6.1], [0, 1.45, -0.3], 42, {join: true}),                        // 4
  // 3  "Binance says it began in June, when one of its engineers downloaded a rigged copy of a developer tool."
  s(34, 'office', 'june', [0.4, 1.4, 5.6], [0, 1.25, -0.4], 42, {push: 0.1}),                          // 5
  s(40, 'office', 'search', [-0.1, 1.34, 3.9], [0.4, 1.28, 0], 42, {push: 0.08, close: true}),          // 6
  s(45, 'screen', 'results', [0.25, 1.5, 5.5], [0, 1.42, -0.4], 42, {push: 0.1}),                      // 7
  // 4  "Security caught it. But by then, the hackers knew who worked on the wallets, where the crypto sits."
  s(53, 'office', 'caught', [-0.3, 1.45, 5.7], [0, 1.35, -0.2], 42, {push: 0.1}),                      // 8
  s(56, 'den', 'chart', [0.3, 1.5, 4.7], [0, 1.42, -1.4], 42, {push: 0.1}),                            // 9
  s(62, 'den', 'names', [-0.25, 1.78, 1.7], [0, 1.75, -2.2], 42, {push: 0.08}),                        // 10
  s(67, 'vault', 'wallets', [-0.4, 1.45, 5.8], [0, 1.35, -0.8], 42, {push: 0.1}),                      // 11
  // 5  "In September, a second engineer got a message on a job site, from a so-called project director."
  s(71, 'home', 'evening', [0.5, 1.5, 5.9], [0, 1.3, -0.4], 42, {push: 0.08}),                         // 12
  s(76, 'home', 'ping', [-0.1, 1.25, 4.1], [0.17, 1.15, 0], 42, {push: 0.07}),                         // 13
  s(83, 'den', 'director', [0.4, 1.45, 5.5], [0, 1.4, -0.5], 42, {push: 0.12}),                        // 14
  // 6  "Interview one, on video: a fake H.R. rep, who shared personal photos to build trust."
  s(88, 'home', 'call1', [0.42, 1.25, 4.3], [0.17, 1.15, 0], 42, {push: 0.07}),                        // 15
  // 16-17 are one take on the call: she waves, then the photos come up
  s(92, 'den', 'hr', [0.3, 1.5, 5.7], [0, 1.4, -0.3], 42, {to: [-0.15, 1.48, 5.1]}),                   // 16
  s(96, 'den', 'photos', [0.3, 1.5, 5.7], [0, 1.4, -0.3], 42, {join: true}),                           // 17
  // 7  "Interview two: the CEO. Of a company that doesn't exist."
  s(103, 'home', 'call2', [-0.18, 1.25, 4.2], [0.17, 1.15, 0], 42, {push: 0.07}),                      // 18
  // 19 comes to rest on the chief executive; 20 starts from exactly there and backs out of the call, far enough to see what the office is made of
  s(105, 'den', 'ceo', [0.3, 1.45, 5.5], [0, 1.35, -0.3], 42, {to: [0.2, 1.45, 5.15]}),                // 19
  s(107, 'den', 'nocompany', [0.2, 1.45, 5.15], [0, 1.35, -0.3], 42, {to: [1.5, 2.0, 7.4], targetTo: [0.35, 1.5, -0.6], soft: true}),  // 20
  // 8  "It ended with an assignment to download. It went onto a work computer. It was malware. Spoiler: there was no job."
  s(113, 'home', 'assign', [0.37, 1.25, 4.2], [0.17, 1.15, 0], 42, {push: 0.07}),                      // 21
  s(120, 'home', 'work', [-0.6, 1.2, 2.9], [-0.28, 1.17, 0.3], 42, {push: 0.08, close: true}),          // 22
  s(126, 'home', 'malware', [0.4, 1.5, 5.6], [0, 1.25, -0.3], 42, {push: 0.12}),                       // 23
  s(129, 'den', 'nojob', [-0.4, 1.45, 5.7], [0, 1.4, -0.4], 42, {push: 0.1}),                          // 24
  // 9  "Through that computer, and Binance's own A.I. tool, the hackers took over two wallet engineers' machines."
  s(134, 'net', 'through', [-3.5, 1.3, 4.3], [-2.75, 1.05, 0.1], 42, {push: 0.1}),                     // 25
  s(137, 'net', 'ai', [0.35, 1.45, 5.6], [0, 1.3, 0], 42, {push: 0.12}),                               // 26
  s(142, 'den', 'remote', [0.5, 1.4, 5.3], [0, 1.25, -0.2], 42, {push: 0.1}),                          // 27
  s(146, 'net', 'two', [3.3, 1.45, 5.7], [3.0, 1.2, -0.2], 42, {push: 0.1}),                           // 28
  // 10 "October twenty-ninth: most of the money was gone in about twenty minutes. The last, nearly four hours later."
  s(150, 'vault', 'clock', [-0.9, 2.0, 1.6], [-0.56, 2.1, -2.2], 42, {push: 0.08}),                    // 29
  s(152, 'vault', 'gone', [0.4, 1.5, 6.0], [0, 1.4, -0.9], 42, {push: 0.1}),                           // 30
  s(162, 'vault', 'last', [-0.2, 2.05, 1.3], [-0.56, 2.08, -2.2], 42, {push: 0.06}),                    // 31
  // 11 "The F.B.I. says North Korea did it. North Korea calls that, quote: an absurd rhetoric."
  s(168, 'fbi', 'says', [0.3, 1.5, 5.9], [0.05, 1.5, -0.4], 42, {push: 0.1}),                          // 32
  s(171, 'fbi', 'nk', [0.75, 1.62, 3.8], [0.62, 1.61, -0.5], 42, {push: 0.06}),                        // 33
  s(175, 'pyong', 'deny', [0.4, 1.5, 5.9], [0, 1.5, -0.4], 42, {push: 0.1}),                           // 34
  s(180, 'pyong', 'quote', [-0.3, 1.85, 3.6], [0, 1.78, 0.3], 42, {push: 0.06}),                       // 35
  // 12 "And President Trump? Quote: we don't know if it's North Korea."
  s(183, 'party', 'trump', [1.0, 1.5, 6.4], [0, 1.1, -0.2], 40, {push: 0.08}),                          // 36
  s(186, 'party', 'quote', [0.3, 1.36, 3.7], [0, 1.25, 0], 42, {push: 0.06, close: true}),              // 37
  // 13 "No one's been charged, and less than half the money is frozen."
  s(194, 'court', 'empty', [0.4, 1.5, 5.9], [0, 1.4, -0.5], 42, {push: 0.1}),                          // 38
  s(198, 'ice', 'frozen', [0.4, 3.9, 4.9], [0, 0.25, -0.15], 42, {push: 0.06}),                         // 39
  // 14 "Binance says it's covering every loss, and that this wasn't one mistake, but a months-long campaign."
  s(206, 'tower', 'refund', [-0.4, 1.45, 6.0], [0, 1.5, -0.6], 42, {push: 0.1}),                       // 40
  // 41 comes to rest on June; 42 starts from exactly there and travels along the red string to October
  s(212, 'wall', 'mistake', [-0.8, 1.6, 2.5], [-0.95, 1.52, -1.0], 42, {to: [-0.86, 1.6, 2.1]}),        // 41
  s(218, 'wall', 'campaign', [-0.86, 1.6, 2.1], [-0.95, 1.52, -1.0], 42, {to: [0.86, 1.6, 2.1], targetTo: [0.95, 1.52, -1.0], soft: true}),   // 42
  // 15 "So whose job was it to stop this: the engineer's, or the company's?"
  // 43-44 are one take: the question, then a light on each answer
  s(222, 'final', 'whose', [0.25, 1.3, 6.4], [0, 1.12, -0.2], 42, {to: [0, 1.3, 5.9]}),                 // 43
  s(230, 'final', 'choice', [0.25, 1.3, 6.4], [0, 1.12, -0.2], 42, {join: true}),                       // 44
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
