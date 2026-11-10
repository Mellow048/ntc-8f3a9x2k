// Word-synchronised captions: one or two words at a time, popped in on the word.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {WORDS, type Word} from './story';

type Caption = {start: number; end: number; text: string; hot: boolean};
/** words that carry the story get the accent colour */
const HOT = /^(affair|spy|spies|honeypot|allegedly|reportedly|unfaithful|billion|five|minutes|f\.b\.i\.|smears|charged|ceo|megaspeed|normal|sued|expensive|thoughts)$/i;
function groups(words: Word[]): Caption[] {
  const out: Caption[] = [];
  for (let i = 0; i < words.length;) {
    const a = words[i], b = words[i + 1];
    // never bridge a sentence end or a real pause, never more than two words
    const pair = !!b && !a.ends_sentence && !/^quote$/i.test(a.word) && b.start - a.end < 0.16 && a.word.length + b.word.length <= 15;   // "Quote:" stands alone
    const last = pair ? b : a, next = words[i + (pair ? 2 : 1)];
    const end = next && next.start - last.end < 0.3 ? next.start : last.end + 0.14;
    out.push({start: Math.max(0, a.start - 0.03), end, text: (pair ? `${a.word} ${b.word}` : a.word).toUpperCase(), hot: HOT.test(a.word) || (pair && HOT.test(b.word))});
    i += pair ? 2 : 1;
  }
  return out;
}
export const Captions: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), list = useMemo(() => groups(WORDS), []);
  const time = f / fps, c = list.find((x) => time >= x.start && time < x.end);
  if (!c) return null;
  const age = Math.max(0, (time - c.start) * fps), scale = 1 + 0.12 * Math.max(0, 1 - age / 3);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* centred 76 % down: under the faces, above the app's own buttons and description */}
      <div style={{
        position: 'absolute', left: '7%', right: '7%', top: '76%', translate: '0 -50%', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '8.6cqw', lineHeight: 1.02, letterSpacing: '-0.01em',
        color: c.hot ? '#ffe14a' : '#ffffff', WebkitTextStroke: '0.2em #15121c', paintOrder: 'stroke fill', textShadow: '0 0.07em 0 #15121c, 0 0.1em 0.2em #000000aa',
        transform: `scale(${scale}) rotate(${c.hot ? -1.5 : 0}deg)`,
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};
