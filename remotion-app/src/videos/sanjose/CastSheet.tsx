// Development aid: every character of the bitcoin flex short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs SanJoseCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, AGENT, CREW, JUDGE, LAM, LAWYER, PROSECUTOR, SLEUTH, STAFF, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [LAM(0), {expr: 'grin', pose: 'type', mode: 'sit'}], [LAM(0), {expr: 'grin', pose: 'panic'}], [LAM(1), {expr: 'grin', pose: 'wave', prop: 'selfie'}], [LAM(2), {expr: 'laugh', pose: 'shrug'}], [LAM(2), {expr: 'laugh', pose: 'hold', prop: 'cash'}],
  [LAM(2), {expr: 'grin', pose: 'wave'}], [LAM(1), {expr: 'shock', pose: 'panic'}], [LAM(1), {expr: 'nervous', pose: 'push', look: -1}], [LAM(3), {expr: 'nervous'}], [LAM(3), {expr: 'nervous', pose: 'both', prop: 'card', text: 'GUILTY', big: true}],
  [LAM(3), {expr: 'dazed', pose: 'shrug'}], [LAM(0), {expr: 'nervous', pose: 'shrug', look: -1}], [CREW(1, true), {pose: 'phone', prop: 'phone'}], [CREW(1, true), {pose: 'side', prop: 'mask', text: 'SECURITY TEAM', badge: 'shield'}], [CREW(1, true), {pose: 'side', prop: 'mask', text: 'EXCHANGE SUPPORT', badge: 'coin'}],
  [CREW(0), {pose: 'type', mode: 'sit'}], [SLEUTH, {pose: 'hold', prop: 'lens'}], [SLEUTH, {pose: 'type', mode: 'sit'}], [AGENT(0), {expr: 'stern', pose: 'point'}], [AGENT(1), {expr: 'stern', pose: 'push'}],
  [JUDGE, {expr: 'stern', pose: 'desk'}], [JUDGE, {expr: 'neutral', pose: 'point'}], [PROSECUTOR, {expr: 'stern', pose: 'point'}], [PROSECUTOR, {expr: 'stern', pose: 'hold', prop: 'paper'}], [LAWYER, {expr: 'neutral', pose: 'hold', prop: 'paper'}],
  [LAWYER, {expr: 'nervous', pose: 'shrug'}], [STAFF(0), {expr: 'smile', pose: 'hold', prop: 'bottle'}], [STAFF(1), {expr: 'smile', pose: 'hold', prop: 'bottle'}],
];

export const CastSheet: React.FC = () => {
  const ok = useFonts(), ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ok || !ref.current) return;
    const g = ref.current.getContext('2d')!; g.fillStyle = '#8fa6b8'; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([look, draw], i) => { g.save(); g.translate((i % 5) * 216 + 12, Math.floor(i / 5) * 318 + 6); drawActor(g, look, draw, 0.31); g.restore(); });   // five across, six rows: nobody stands on anybody
  }, [ok]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
