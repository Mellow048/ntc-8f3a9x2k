// Development aid: every character of the Binance heist short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs BinanceCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, AGENT, CON, ENGINEER, FAKE, JUDGE, PRESIDENT, SECURITY, SPOKES, USER, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [CON(0), {pose: 'type'}], [CON(1), {pose: 'point'}], [CON(2), {pose: 'cross'}], [FAKE('pd'), {pose: 'wave'}],
  [FAKE('hr'), {pose: 'wave'}], [FAKE('hr'), {pose: 'hold', prop: 'mask', bare: true}], [FAKE('ceo'), {pose: 'hips'}], [FAKE('ceo'), {pose: 'desk', mode: 'sit'}],
  [ENGINEER(0), {expr: 'smile', pose: 'type', mode: 'sit'}], [ENGINEER(0), {expr: 'shock', pose: 'panic'}], [ENGINEER(1), {expr: 'smile', pose: 'phone', prop: 'phone'}], [ENGINEER(1), {expr: 'grin', pose: 'hold', prop: 'cv'}],
  [ENGINEER(1), {expr: 'smile', pose: 'wave'}], [ENGINEER(2), {expr: 'nervous', pose: 'both'}], [SECURITY(0), {expr: 'stern', pose: 'both', prop: 'bag'}], [SECURITY(1), {expr: 'stern', pose: 'push'}],
  [AGENT(0), {expr: 'stern', pose: 'point', prop: 'pointer'}], [AGENT(1), {expr: 'stern', pose: 'cross'}], [PRESIDENT, {expr: 'neutral', pose: 'shrug'}], [PRESIDENT, {expr: 'stern', pose: 'point'}],
  [SPOKES, {expr: 'stern', pose: 'hold', prop: 'paper'}], [SPOKES, {expr: 'smile_closed', pose: 'desk'}], [JUDGE, {expr: 'stern', pose: 'think'}], [JUDGE, {expr: 'neutral', pose: 'shrug'}],
  [USER(0), {expr: 'smile', pose: 'phone', prop: 'phone'}], [USER(1), {expr: 'grin'}], [USER(2), {expr: 'smile', pose: 'think'}], [USER(4), {expr: 'shock', pose: 'panic'}],
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
