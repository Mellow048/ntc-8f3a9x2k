// Timing for the Mona Lisa short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/mona-lisa/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** seconds after the last word: the last picture is held while the music comes home (the same number is TAIL in build_mix.py) */
export const TAIL = 2.0;
export const TOTAL = Math.round((WORDS[WORDS.length - 1].end + TAIL) * FPS);

export type Kind = 'gallery' | 'exit' | 'workshop' | 'stairs' | 'studio' | 'police' | 'room' | 'florence' | 'history' | 'jail' | 'today';
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
  /** carries on the camera move of the shot before (one take, several stagings); its own cam and target are not used */
  join?: boolean;
  /** starts where the shot before came to rest and moves off gently */
  soft?: boolean;
  /** place and time, shown small in the top left corner while the shot runs */
  tag?: string;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});
const T = (a: V): V => a;

export const SHOTS: Shot[] = [
  // 1 "In nineteen eleven, a handyman walks out of the Louvre with the Mona Lisa. For a whole day, nobody raises the alarm."
  s(0, 'gallery', 'hook', [-0.15, 1.5, 4.2], [0.0, 1.82, -2.1], 46, {push: 0.1, tag: 'PARIS · 1911'}),                     // 0  he takes her off the wall
  s(5, 'gallery', 'walk', [0.3, 1.4, 7.0], [0.2, 1.62, 0.5], 46, {push: 0.05, tag: 'PARIS · 1911'}),                   // 1  out of the room, under his arm
  s(14, 'gallery', 'empty', [0.2, 1.56, 5.4], [0.0, 1.95, -2.6], 46, {push: 0.07, tag: 'THE LOUVRE'}),                    // 2  four pegs; a guard walks past
  // 2 "Vincenzo Peruggia once worked there. He helped build her glass case."
  s(22, 'workshop', 'pane', [-1.2, 1.5, 4.7], [-1.4, 1.18, -1.2], 46, {push: 0.07, tag: 'THE YEAR BEFORE'}),            // 3
  s(27, 'workshop', 'case', [1.0, 1.62, 3.5], [1.0, 1.34, -1.6], 46, {push: 0.1, tag: 'THE YEAR BEFORE'}),              // 4  the pane goes on her case
  // 3 "It's a Monday. The museum is closed. He says he just walks in, wearing a white smock, like the staff."
  s(33, 'exit', 'closed', [1.1, 1.9, 9.4], [0.4, 1.95, -2.6], 46, {push: 0.07, tag: 'MONDAY, 21 AUGUST 1911'}),        // 5
  s(40, 'exit', 'walkin', [4.2, 1.58, 7.2], [4.4, 1.36, 0.7], 46, {push: 0.05, tag: 'MONDAY, 21 AUGUST 1911'}),          // 6  in through the staff door
  s(46, 'exit', 'smocks', [0.2, 1.46, 7.4], [0.2, 1.24, 2.5], 46, {push: 0.09, close: true, tag: 'MONDAY, 21 AUGUST 1911'}), // 7  white smocks
  // 4 "He lifts her off four hooks. In a stairwell, he strips off the frame and the glass."
  s(53, 'gallery', 'lift', [0.0, 1.76, 1.1], [0.0, 1.8, -2.9], 46, {push: 0.06, tag: 'THE SALON CARRÉ'}),            // 8
  s(59, 'stairs', 'strip', [0.2, 1.45, 4.9], [0.15, 0.78, 0.4], 46, {push: 0.08, tag: 'A SERVICE STAIRCASE'}),            // 9
  // 5 "Then, a locked door. He's unscrewing the doorknob when a plumber comes by, and kindly lets him out."
  s(70, 'stairs', 'locked', [0.6, 1.5, 4.7], [0.9, 1.4, -2.6], 46, {push: 0.07, tag: 'A SERVICE STAIRCASE'}),           // 10
  s(74, 'stairs', 'knob', [2.25, 1.30, -0.2], [1.32, 1.05, -2.55], 46, {push: 0.08, close: true, tag: 'A SERVICE STAIRCASE'}), // 11
  s(78, 'stairs', 'plumber', [0.2, 1.5, 5.6], [0.2, 1.2, -0.3], 46, {push: 0.05, tag: 'A SERVICE STAIRCASE'}),           // 12
  s(83, 'stairs', 'out', [0.2, 1.5, 5.6], [0.2, 1.2, -0.3], 46, {join: true, tag: 'A SERVICE STAIRCASE'}),               // 13  one take with 12
  // 6 "Next day, an artist comes to paint her, and finds four bare hooks. A guard shrugs. The photographers must have her."
  s(88, 'gallery', 'artist', [0.5, 1.5, 5.2], [0.6, 1.78, -1.8], 46, {push: 0.07, tag: 'TUESDAY'}),                     // 14
  s(96, 'gallery', 'bare', [0, 1.74, 1.35], [0, 1.74, -2.9], 46, {push: 0.07, tag: 'TUESDAY'}),                           // 15
  s(101, 'gallery', 'shrug', [0.0, 1.5, 5.2], [0.0, 1.78, -1.2], 46, {push: 0.06, tag: 'TUESDAY'}),                    // 16
  // 7 "They don't. The Louvre shuts for a week."
  s(109, 'studio', 'dont', [0.3, 1.56, 4.5], [0.35, 1.3, -1.0], 46, {push: 0.07, tag: "THE PHOTOGRAPHERS' STUDIO"}),       // 17
  s(111, 'exit', 'shut', [1.1, 1.9, 9.6], [0.4, 1.9, -2.6], 46, {push: 0.07, tag: 'THE LOUVRE'}),                       // 18
  // 8 "When it reopens, thousands line up to stare at an empty wall."
  s(117, 'exit', 'queue', [4.2, 1.6, 7.4], [0.5, 1.35, 0.8], 46, {push: 0.05, tag: 'A WEEK LATER'}),                    // 19
  s(123, 'gallery', 'crowd', [0.0, 2.95, 4.4], [0.0, 1.9, -2.7], 46, {push: 0.08, tag: 'A WEEK LATER'}),                // 20
  // 9 "Police arrest a poet, and question a young Pablo Picasso."
  s(129, 'police', 'poet', [0.2, 1.46, 5.0], [0.3, 1.6, -1.0], 46, {push: 0.07, tag: 'SEPTEMBER 1911'}),                // 21
  s(133, 'police', 'picasso', [0.2, 1.44, 4.8], [0.3, 1.58, -0.9], 46, {push: 0.07, tag: 'SEPTEMBER 1911'}),              // 22
  // 10 "They even question the handyman, at home. She's in a trunk, in the same room. They believe him."
  s(139, 'room', 'question', [0.3, 1.42, 4.4], [0.4, 1.58, -0.6], 46, {push: 0.06, tag: 'HIS ROOM IN PARIS'}),           // 23
  s(146, 'room', 'trunk', [-1.45, 1.62, 5.0], [-1.6, 0.5, 0.9], 46, {push: 0.1, tag: 'HIS ROOM IN PARIS'}),             // 24  the trunk opens
  s(154, 'room', 'believe', [0.55, 1.44, 5.2], [0.7, 1.62, -0.5], 46, {push: 0.05, tag: 'HIS ROOM IN PARIS'}),            // 25
  // 11 "Two years later, he tries to sell her to an art dealer in Florence. A patriot, he says, bringing home what Napoleon stole."
  s(157, 'florence', 'unwrap', [0.4, 1.5, 5.4], [0.35, 1.44, -0.9], 46, {push: 0.07, tag: 'FLORENCE · DECEMBER 1913'}),   // 26
  s(165, 'florence', 'dealer', [-0.55, 1.6, 3.3], [-0.5, 1.48, -1.0], 46, {push: 0.09, close: true, tag: 'FLORENCE · DECEMBER 1913'}), // 27
  s(171, 'florence', 'patriot', [0.4, 1.46, 5.8], [0.25, 1.5, -0.8], 46, {push: 0.05, tag: 'FLORENCE · DECEMBER 1913'}),    // 28
  // 12 "Napoleon never stole her. Leonardo brought her to France himself."
  s(180, 'history', 'napoleon', [0.0, 1.86, 5.4], [0.0, 1.98, -2.8], 46, {push: 0.07, tag: 'NAPOLEON, BORN 1769'}),      // 29
  s(184, 'history', 'leonardo', [0.0, 1.52, 7.2], [0.0, 1.58, -1.3], 46, {push: 0.05, tag: 'LEONARDO, 1516'}),            // 30
  // 13 "The dealer calls the police. The thief serves seven months."
  s(190, 'florence', 'police', [0.7, 1.48, 6.9], [0.8, 1.56, -0.8], 46, {push: 0.06, tag: 'FLORENCE · DECEMBER 1913'}),   // 31
  s(195, 'jail', 'months', [0.35, 1.46, 4.6], [0.35, 1.54, -1.0], 46, {push: 0.06, tag: 'FLORENCE · 1914'}),                 // 32
  // 14 "She left a masterpiece that art lovers knew. She returns the most famous painting on Earth. It took an empty wall to make the world look."
  s(200, 'gallery', 'before', [0.3, 1.56, 5.2], [0.25, 1.9, -2.6], 46, {push: 0.05, tag: 'BEFORE'}),                     // 33
  s(208, 'gallery', 'return', [0.0, 2.7, 4.9], [0.0, 1.88, -2.7], 46, {push: 0.06, tag: 'PARIS · JANUARY 1914'}),        // 34
  s(216, 'gallery', 'hooks', [0.0, 1.95, 1.2], [0.0, 1.9, -2.85], 46, {push: 0.07}),                                          // 35
  s(221, 'today', 'look', [2.6, 1.86, 4.9], [0.1, 1.62, -2.2], 46, {to: [1.5, 1.78, 3.4], tag: 'THE LOUVRE · TODAY'}),        // 36
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
void T;
