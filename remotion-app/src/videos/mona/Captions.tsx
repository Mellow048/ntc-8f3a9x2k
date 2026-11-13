// Word-synchronised captions: one or two words at a time, popped in on the word.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {WORDS, type Word} from './story';

type Caption = {start: number; end: number; text: string; hot: boolean};
/** words that carry the story get the accent colour */
const HOT = /^(nineteen|eleven|handyman|louvre|mona|lisa|alarm|peruggia|glass|case|monday|closed|smock|staff|hooks|stairwell|frame|locked|doorknob|plumber|out|bare|shrug|photographers|week|thousands|empty|wall|poet|pablo|picasso|trunk|room|believe|florence|dealer|patriot|napoleon|stole|leonardo|france|himself|police|seven|months|masterpiece|famous|earth|world|look)$/i;
/** words that stand alone so the pairs after them fall on phrases */
const SOLO = new Set<number>([]);
function groups(words: Word[]): Caption[] {
  const out: Caption[] = [];
  for (let i = 0; i < words.length;) {
    const a = words[i], b = words[i + 1];
    // never bridge a sentence end, a comma or a real pause, never more than two words
    const pair = !!b && !a.ends_sentence && !a.comma && !SOLO.has(i) && b.start - a.end < 0.16 && a.word.length + b.word.length <= 15;
    const last = pair ? b : a, next = words[i + (pair ? 2 : 1)];
    const end = next && next.start - last.end < 0.3 ? next.start : last.end + 0.14;
    out.push({start: Math.max(0, a.start - 0.03), end, text: (pair ? `${a.word} ${b.word}` : a.word).toUpperCase(), hot: HOT.test(a.word) || (pair && HOT.test(b.word))});
    i += pair ? 2 : 1;
  }
  return out;
}

export const Captions: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const caps = useMemo(() => groups(WORDS), []);
  const c = caps.find((q) => t >= q.start && t < q.end);
  if (!c) return null;
  const age = t - c.start, pop = Math.min(1, age / 0.07), rise = (1 - pop) * 16;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: height * 0.115}}>
      <div style={{
        fontFamily: 'Anton, sans-serif', fontSize: width * 0.082, lineHeight: 1, letterSpacing: '0.01em', color: c.hot ? '#ffd24a' : '#fffdf6',
        textShadow: '0 4px 0 rgba(20,14,10,0.55), 0 0 26px rgba(0,0,0,0.55)', transform: `translateY(${rise}px) scale(${0.94 + 0.06 * pop})`,
        padding: `${width * 0.012}px ${width * 0.03}px`, borderRadius: width * 0.012, background: 'rgba(18,12,10,0.28)',
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};
