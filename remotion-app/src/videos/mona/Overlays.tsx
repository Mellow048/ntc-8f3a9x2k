// On-screen graphics: the place and date tag, and a few words where a thing on the wall has to be read plain
// (the notice, the label). Everything stays clear of the caption band at the foot of the frame.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {SHOTS, shotAt, type Shot} from './story';

/** a tag in the top left corner: place and date; a tag that repeats the one before it stays put, without a flicker */
function tags(): {from: number; to: number; text: string}[] {
  const out: {from: number; to: number; text: string}[] = [];
  for (const s of SHOTS) {
    if (!s.tag) continue;
    const last = out[out.length - 1];
    if (last && last.text === s.tag && last.to >= s.at - 1) { last.to = Infinity; continue; }
    out.push({from: s.at, to: Infinity, text: s.tag});
  }
  for (let i = 0; i + 1 < out.length; i++) out[i].to = out[i + 1].from;
  return out;
}

export const Overlays: React.FC = () => {
  const f = useCurrentFrame(), {width} = useVideoConfig(), list = useMemo(tags, []);
  const cur = list.find((q) => f >= q.from && f < q.to);
  const age = cur ? (f - cur.from) / 9 : 0, a = Math.min(1, Math.max(0, age));
  const shot: Shot = SHOTS[shotAt(f)];
  return (
    <AbsoluteFill>
      {cur ? (
        <div style={{position: 'absolute', left: width * 0.055, top: width * 0.055, opacity: a, transform: `translateY(${(1 - a) * -8}px)`,
          fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: width * 0.026, letterSpacing: '0.09em', color: '#fffdf6',
          background: 'rgba(20,14,12,0.55)', padding: `${width * 0.012}px ${width * 0.028}px`, borderRadius: width * 0.008, borderLeft: `${width * 0.008}px solid #ffd24a`}}>{cur.text}</div>
      ) : null}
      {shot.kind === 'today' && f > shot.at + 8 ? (
        <div style={{position: 'absolute', right: width * 0.06, bottom: width * 0.36, textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
          fontSize: width * 0.024, letterSpacing: '0.08em', color: 'rgba(255,253,246,0.92)', opacity: Math.min(1, (f - shot.at - 8) / 10)}}>
          EIGHT MILLION A YEAR<br /><span style={{fontWeight: 700, fontSize: width * 0.018, opacity: 0.8}}>FIGURES FOR THE LOUVRE&apos;S VISITORS</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
