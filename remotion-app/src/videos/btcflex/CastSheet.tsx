// Development aid: every character of the bitcoin flex short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs BtcFlexCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, COP, CREW, DRIVER, JEWELER, PROSECUTOR, SOMEONE, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [CREW(0), {pose: 'hang'}], [CREW(1), {pose: 'both', prop: 'card', text: 'NOT GUILTY'}], [CREW(2), {pose: 'hang'}], [CREW(3), {pose: 'shrug'}],
  [CREW(4), {pose: 'hang'}], [CREW(5), {pose: 'hang'}], [CREW(6), {pose: 'shrug'}], [CREW(0), {pose: 'both', prop: 'card', text: 'PLEA DEAL'}],
  [SOMEONE, {pose: 'phone', prop: 'phone'}], [CREW(0), {mode: 'march'}], [DRIVER(0), {expr: 'neutral'}], [DRIVER(0), {expr: 'lick', pose: 'hold', prop: 'burger', mode: 'sit'}],
  [DRIVER(0), {expr: 'smile', mode: 'march'}], [DRIVER(1), {expr: 'neutral'}], [DRIVER(1), {expr: 'neutral', blink: true}], [COP(0), {expr: 'neutral', pose: 'hold', prop: 'clip'}],
  [COP(1), {expr: 'stern', pose: 'push'}], [COP(2), {expr: 'stern', pose: 'push'}], [JEWELER(0), {expr: 'smile'}], [JEWELER(1), {expr: 'smile', pose: 'wave'}],
  [JEWELER(2), {expr: 'smile'}], [JEWELER(0), {expr: 'stern', pose: 'shrug'}], [JEWELER(1), {expr: 'stern', pose: 'hold', prop: 'paper'}], [JEWELER(2), {expr: 'stern'}],
  [PROSECUTOR, {expr: 'neutral', pose: 'hold', prop: 'paper'}], [PROSECUTOR, {expr: 'shock', pose: 'hold', prop: 'paper', look: -1}], [PROSECUTOR, {expr: 'nervous', pose: 'shrug', look: -1}], [COP(0), {expr: 'smile', pose: 'hold', prop: 'clip'}],
];

export const CastSheet: React.FC = () => {
  const ok = useFonts(), ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ok || !ref.current) return;
    const g = ref.current.getContext('2d')!; g.fillStyle = '#8fa6b8'; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([look, draw], i) => { g.save(); g.translate((i % 4) * 270, Math.floor(i / 4) * 272 + 8); drawActor(g, look, draw, 0.45); g.restore(); });
  }, [ok]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
