// Development aid: every character of the Nvidia short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs NvidiaCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, JENSEN, WOMAN, AGENT, SPY, FBI, PRESIDENT, SPOKESMAN, LAWYER, BOARD, STAFF, TRADER, COUCH, WAITER, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [JENSEN, {expr: 'smile', pose: 'hold', prop: 'chip'}], [JENSEN, {expr: 'shock', pose: 'panic'}], [JENSEN, {expr: 'nervous', pose: 'shrug'}], [JENSEN, {expr: 'relief_open', mode: 'sit', pose: 'desk'}],
  [WOMAN, {expr: 'smile'}], [WOMAN, {expr: 'smile', pose: 'hips', tilt: 5}], [AGENT(0), {expr: 'stern', pose: 'cross'}], [AGENT(1), {expr: 'stern', pose: 'phone', prop: 'phone'}],
  [FBI(0), {expr: 'stern', pose: 'hold', prop: 'torch'}], [FBI(1), {expr: 'neutral', pose: 'hold', prop: 'magnifier'}], [PRESIDENT, {expr: 'whistle', pose: 'point'}], [SPOKESMAN, {expr: 'stern', pose: 'desk'}],
  [LAWYER, {expr: 'grin', pose: 'hold', prop: 'paper'}], [BOARD(0), {expr: 'stern', pose: 'hold', prop: 'magnifier'}], [BOARD(1), {expr: 'neutral', pose: 'both', prop: 'tablet'}], [BOARD(2), {expr: 'stern', pose: 'think'}],
  [STAFF(0), {expr: 'shock', pose: 'panic'}], [STAFF(1), {expr: 'shock'}], [STAFF(2), {expr: 'shock', pose: 'panic'}], [STAFF(3), {expr: 'nervous'}],
  [TRADER(0), {expr: 'pained', pose: 'panic'}], [TRADER(1), {expr: 'shock', pose: 'panic'}], [COUCH, {expr: 'dazed', mode: 'sit', pose: 'both', prop: 'remote'}], [WAITER, {expr: 'smile_closed', pose: 'both', prop: 'bill'}],
  [SPY(0), {expr: 'stern'}], [SPY(1), {expr: 'smile', pose: 'think'}], [TRADER(2), {expr: 'dazed'}], [JENSEN, {expr: 'grin', pose: 'point'}],
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
