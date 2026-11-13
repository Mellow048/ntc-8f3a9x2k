// Word-synchronised captions: one or two words at a time, popped in on the word.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {WORDS, type Word} from './story';

type Caption = {start: number; end: number; text: string; hot: boolean};
/** words that carry the story get the accent colour */
const HOT = /^(dishes|booth|five-trillion-dollar|resigned|taiwan|fifteen|dishwasher|busboy|tables|ninety-three|engineers|coffee|chase|flopped|fifty|forty-nine|back|survived|a\.i\.|chatgpt|businesswoman|spying|unfaithful|kept|second|executive|third|thirty-three|why|smear|conclusion|denies|plaque|gone|band-aid|impossible|replicate|replace)$/i;
/** words that stand alone so the pairs after them fall on phrases */
const SOLO = new Set<number>([]);
function groups(words: Word[]): Caption[] {
  const out: Caption[] = [];
  for (let i = 0; i < words.length;) {
    const a = words[i], b = words[i + 1];
    // never bridge a sentence end, a comma or a real pause, never more than two words ("Quote:" stands alone)
    const pair = !!b && !a.ends_sentence && !a.comma && !SOLO.has(i) && b.start - a.end < 0.16 && a.word.length + b.word.length <= 15;
    const last = pair ? b : a, next = words[i + (pair ? 2 : 1)];
    const end = next && next.start - last.end < 0.3 ? next.start : last.end + 0.14;
    out.push({start: Math.max(0, a.start - 0.03), end, text: (pair ? `${a.word} ${b.word}` : a.word).toUpperCase(), hot: HOT.test(a.word) || (pair && HOT.test(b.word))});
    i += pair ? 2 : 1;
  }
  return out;
}
/** advance widths of Montserrat Black capitals in em, read from the font file, so a caption can be sized before it is drawn */
const ADV: Record<string, number> = {A: 0.806, B: 0.773, C: 0.737, D: 0.826, E: 0.673, F: 0.644, G: 0.769, H: 0.804, I: 0.35, J: 0.574, K: 0.765, L: 0.617, M: 0.954, N: 0.804, O: 0.848, P: 0.743, Q: 0.848, R: 0.745, S: 0.657, T: 0.654, U: 0.784, V: 0.786, W: 1.206, X: 0.762, Y: 0.71, Z: 0.687, ' ': 0.3, "'": 0.254, '.': 0.304, ',': 0.304, '!': 0.314, '?': 0.606, '-': 0.39, '$': 0.657, '%': 0.917, ':': 0.304};
const SIZE = 8.6, FIT = 84, SPACING = -0.01;
/** font size in cqw: the usual size, or smaller when the words would not fit on one line */
const fit = (text: string) => Math.min(SIZE, FIT / [...text].reduce((w, ch) => w + (ADV[ch] ?? 0.7) + SPACING, 0));
export const Captions: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), list = useMemo(() => groups(WORDS), []);
  const time = f / fps, c = list.find((x) => time >= x.start && time < x.end);
  if (!c) return null;
  const age = Math.max(0, (time - c.start) * fps), scale = 1 + 0.12 * Math.max(0, 1 - age / 3);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* centred 76 % down: under the faces, above the app's own buttons and description */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '76%', translate: '0 -50%', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: `${fit(c.text).toFixed(2)}cqw`, lineHeight: 1.02, letterSpacing: `${SPACING}em`, whiteSpace: 'nowrap',
        color: c.hot ? '#ffe14a' : '#ffffff', WebkitTextStroke: '0.2em #15121c', paintOrder: 'stroke fill', textShadow: '0 0.07em 0 #15121c, 0 0.1em 0.2em #000000aa',
        transform: `scale(${scale}) rotate(${c.hot ? -1.5 : 0}deg)`,
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};
