// Timing for the Mona Lisa short. Everything is keyed to words of the locked narration (words.json, written by
// shoots/mona-lisa/build_voice.py), so re-timing the voice moves the picture with it.
import words from './words.json';
import type {V} from './kit';

export const FPS = 30;
export type Word = {word: string; start: number; end: number; line: number; ends_sentence: boolean; /** a comma, colon or semicolon follows */ comma: boolean};
export const WORDS = words as Word[];
/** frame on which narration word i starts */
export const W = (i: number) => Math.round(WORDS[i].start * FPS);
/** frame on which narration word i ends */
export const E = (i: number) => Math.round(WORDS[i].end * FPS);
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
  /** place and time, shown small in the top left corner while the shot runs (the same words on the next shot stay put) */
  tag?: string;
};
const cut = (word: number, lead = 2) => Math.max(0, W(word) - lead);
const s = (word: number, kind: Kind, v: string, cam: V, target: V, fov: number, more: Partial<Shot> = {}): Shot => ({at: cut(word), kind, v, cam, target, fov, ...more});

export const SHOTS: Shot[] = [
  // 1 "In nineteen eleven, a handyman walks out of the Louvre with the Mona Lisa. For a whole day, nobody raises the alarm."
  s(0, 'gallery', 'hook', [0.25, 1.8, 3.3], [0, 1.95, -2], 42, {push: 0.12, tag: 'PARIS · 1911'}),                    // 0  he reaches up and takes her off the wall
  s(5, 'exit', 'walk', [0.6, 1.5, 6.4], [0.1, 1.55, 0], 42, {push: 0.06, tag: 'PARIS · 1911'}),                       // 1  out of the door with a white bundle
  s(14, 'gallery', 'empty', [0, 1.75, 4.2], [0, 1.95, -2], 42, {push: 0.08, tag: 'THE LOUVRE'}),                      // 2  four pegs; a guard walks past; a day goes by
  // 2 "Vincenzo Peruggia once worked there. He helped build her glass case."
  s(22, 'workshop', 'pane', [0.5, 1.5, 4.6], [0, 1.3, 0], 42, {push: 0.08, tag: 'THE YEAR BEFORE'}),                  // 3
  s(27, 'workshop', 'case', [0.2, 1.5, 2.9], [0, 1.42, 0], 42, {push: 0.1, tag: 'THE YEAR BEFORE'}),                  // 4  the pane goes on
  // 3 "It's a Monday. The museum is closed. He says he just walks in, wearing a white smock, like the staff."
  s(33, 'exit', 'closed', [-0.3, 1.6, 6.2], [0, 1.9, 0], 42, {push: 0.08, tag: 'MONDAY, 21 AUGUST 1911'}),            // 5
  s(40, 'exit', 'walkin', [1.9, 1.5, 6.0], [-0.2, 1.3, 0.6], 42, {push: 0.05, tag: 'MONDAY, 21 AUGUST 1911'}),        // 6  the staff door
  s(46, 'exit', 'smocks', [0, 1.35, 4.4], [0, 1.2, 0], 42, {push: 0.1, close: true, tag: 'MONDAY, 21 AUGUST 1911'}),  // 7  four white smocks, and one of them is his
  // 4 "He lifts her off four hooks. In a stairwell, he strips off the frame and the glass."
  s(53, 'gallery', 'lift', [0, 1.9, 2.6], [0, 2.1, -2], 42, {push: 0.06, tag: 'THE SALON CARRÉ'}),                    // 8
  s(59, 'stairs', 'strip', [0.2, 1.5, 4.4], [0, 1.15, 0], 42, {push: 0.08, tag: 'A SERVICE STAIRCASE'}),              // 9
  // 5 "Then, a locked door. He's unscrewing the doorknob when a plumber comes by, and kindly lets him out."
  s(70, 'stairs', 'locked', [-0.2, 1.45, 4.2], [0.3, 1.2, 0], 42, {push: 0.08, tag: 'A SERVICE STAIRCASE'}),          // 10
  s(74, 'stairs', 'knob', [0.6, 1.2, 1.9], [0.95, 1.02, -0.4], 42, {push: 0.1, close: true, tag: 'A SERVICE STAIRCASE'}), // 11
  s(78, 'stairs', 'plumber', [-0.4, 1.6, 4.6], [0, 1.35, 0], 42, {push: 0.06, tag: 'A SERVICE STAIRCASE'}),           // 12
  s(83, 'stairs', 'out', [-0.4, 1.6, 4.6], [0, 1.35, 0], 42, {join: true, tag: 'A SERVICE STAIRCASE'}),              // 13  one take with 12
  // 6 "Next day, an artist comes to paint her, and finds four bare hooks. A guard shrugs. The photographers must have her."
  s(88, 'gallery', 'artist', [0.9, 1.6, 4.4], [0.1, 1.5, -1], 42, {push: 0.08, tag: 'TUESDAY'}),                      // 14
  s(96, 'gallery', 'bare', [0, 1.9, 2.4], [0, 2.1, -2], 42, {push: 0.08, tag: 'TUESDAY'}),                            // 15
  s(101, 'gallery', 'shrug', [-0.5, 1.55, 4.0], [0.1, 1.5, -0.6], 42, {push: 0.06, tag: 'TUESDAY'}),                  // 16
  // 7 "They don't. The Louvre shuts for a week."
  s(109, 'studio', 'dont', [0.3, 1.5, 4.0], [0, 1.3, 0], 42, {push: 0.08, tag: "THE PHOTOGRAPHERS' STUDIO"}),         // 17
  s(111, 'exit', 'shut', [-0.3, 1.6, 6.2], [0, 1.9, 0], 42, {push: 0.08, tag: 'THE LOUVRE'}),                         // 18
  // 8 "When it reopens, thousands line up to stare at an empty wall."
  s(117, 'exit', 'queue', [2.6, 2.4, 8.2], [0.2, 1.3, 1.0], 42, {push: 0.06, tag: 'A WEEK LATER'}),                   // 19
  s(123, 'gallery', 'crowd', [0, 1.9, 4.9], [0, 1.75, -2], 42, {push: 0.1, tag: 'A WEEK LATER'}),                     // 20
  // 9 "Police arrest a poet, and question a young Pablo Picasso."
  s(129, 'police', 'poet', [0.4, 1.5, 4.4], [0, 1.25, 0], 42, {push: 0.08, tag: 'SEPTEMBER 1911'}),                   // 21
  s(133, 'police', 'picasso', [-0.3, 1.45, 4.2], [0.1, 1.2, 0], 42, {push: 0.08, tag: 'SEPTEMBER 1911'}),             // 22
  // 10 "They even question the handyman, at home. She's in a trunk, in the same room. They believe him."
  s(139, 'room', 'question', [0.4, 1.5, 4.5], [0, 1.15, 0], 42, {push: 0.08, tag: 'HIS ROOM IN PARIS'}),              // 23
  s(146, 'room', 'trunk', [0.9, 1.0, 2.6], [1.0, 0.45, 0], 42, {push: 0.12, tag: 'HIS ROOM IN PARIS'}),               // 24
  s(154, 'room', 'believe', [0.4, 1.5, 4.5], [0, 1.15, 0], 42, {push: 0.06, tag: 'HIS ROOM IN PARIS'}),               // 25
  // 11 "Two years later, he tries to sell her to an art dealer in Florence. A patriot, he says, bringing home what Napoleon stole."
  s(157, 'florence', 'unwrap', [0.3, 1.5, 4.4], [0, 1.1, 0], 42, {push: 0.08, tag: 'FLORENCE · DECEMBER 1913'}),      // 26
  s(165, 'florence', 'dealer', [-0.5, 1.45, 3.0], [-0.7, 1.35, 0], 42, {push: 0.1, close: true, tag: 'FLORENCE · DECEMBER 1913'}), // 27
  s(171, 'florence', 'patriot', [0.7, 1.5, 3.9], [0.5, 1.5, 0], 42, {push: 0.06, tag: 'FLORENCE · DECEMBER 1913'}),   // 28
  // 12 "Napoleon never stole her. Leonardo brought her to France himself."
  s(180, 'history', 'napoleon', [0, 1.5, 4.6], [0, 1.25, 0], 42, {push: 0.08, tag: 'NAPOLEON, BORN 1769'}),           // 29
  s(184, 'history', 'leonardo', [0.3, 1.6, 6.0], [0, 1.2, 0], 42, {push: 0.06, tag: 'LEONARDO, 1516'}),               // 30
  // 13 "The dealer calls the police. The thief serves seven months."
  s(190, 'florence', 'police', [0.3, 1.5, 4.6], [0, 1.2, 0], 42, {push: 0.08, tag: 'FLORENCE · DECEMBER 1913'}),      // 31
  s(195, 'jail', 'months', [0.2, 1.5, 4.2], [0, 1.3, 0], 42, {push: 0.08, tag: 'FLORENCE · 1914'}),                   // 32
  // 14 "She left a masterpiece that art lovers knew. She returns the most famous painting on Earth. It took an empty wall to make the world look."
  s(200, 'gallery', 'before', [0.5, 1.7, 4.4], [0, 1.8, -2], 42, {push: 0.06, tag: 'BEFORE'}),                        // 33
  s(208, 'gallery', 'return', [0, 1.8, 5.0], [0, 1.8, -2], 42, {push: 0.08, tag: 'PARIS · JANUARY 1914'}),            // 34
  s(216, 'gallery', 'hooks', [0, 2.0, 1.2], [0, 2.15, -2], 42, {push: 0.08}),                                         // 35
  s(221, 'today', 'look', [0, 2.3, 6.4], [0, 1.9, -2], 42, {to: [0, 2.05, 2.2], tag: 'THE LOUVRE · TODAY'}),          // 36
];
/** shot on screen at frame f */
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= f) i++; return i; };
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOTAL);
