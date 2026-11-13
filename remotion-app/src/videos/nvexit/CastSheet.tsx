// Development aid: every character of the Nvidia exit short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs NvExitCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, ATTORNEY, BOARD, ENGINEER, GUEST, JENSEN, OFFICIAL, REPORTER, SPOKESMAN, STAFF, WAITER, WOMAN, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [JENSEN(0), {expr: 'neutral'}], [JENSEN(0), {expr: 'grin', pose: 'panic'}], [JENSEN(0), {expr: 'pained', pose: 'hang'}], [JENSEN(0), {expr: 'nervous', pose: 'shrug'}], [JENSEN(0), {expr: 'stern', pose: 'type', mode: 'sit'}], [JENSEN(0), {expr: 'neutral', pose: 'cross'}],
  [JENSEN(1), {expr: 'grin', pose: 'wave', prop: 'napkin'}], [JENSEN(1), {expr: 'smile', pose: 'desk', mode: 'sit'}], [JENSEN(1), {expr: 'shock', pose: 'panic'}], [JENSEN(1), {expr: 'relief', pose: 'hang'}], [JENSEN(2), {expr: 'smile', pose: 'both'}], [JENSEN(2), {expr: 'grin', pose: 'wave', prop: 'plate'}],
  [JENSEN(2), {expr: 'whistle', pose: 'both', prop: 'tub', mode: 'march', phase: 0.2}], [JENSEN(2), {expr: 'nervous', pose: 'hold', prop: 'cups'}], [JENSEN(2), {expr: 'smile', pose: 'wave'}], [ENGINEER(0), {expr: 'smile', pose: 'desk', mode: 'sit'}], [ENGINEER(1), {expr: 'grin', pose: 'desk', mode: 'sit'}], [ENGINEER(0), {expr: 'shock', pose: 'panic'}],
  [ENGINEER(1), {expr: 'relief', pose: 'hang'}], [WAITER, {expr: 'smile', pose: 'hold', prop: 'pot'}], [GUEST(0), {expr: 'smile', pose: 'desk', mode: 'sit'}], [GUEST(1), {expr: 'neutral', pose: 'desk', mode: 'sit'}], [WOMAN, {}], [OFFICIAL(0), {expr: 'stern', pose: 'point'}],
  [OFFICIAL(1), {expr: 'stern', pose: 'hold', prop: 'paper'}], [SPOKESMAN, {expr: 'stern', pose: 'desk'}], [ATTORNEY, {expr: 'neutral', pose: 'desk'}], [BOARD(0), {expr: 'stern', pose: 'desk', mode: 'sit'}], [BOARD(1), {expr: 'neutral', pose: 'desk', mode: 'sit'}], [BOARD(2), {expr: 'stern', pose: 'desk', mode: 'sit'}],
  [BOARD(3), {expr: 'neutral', pose: 'desk', mode: 'sit'}], [BOARD(4), {expr: 'stern', pose: 'desk', mode: 'sit'}], [STAFF(0), {expr: 'shock', pose: 'type', mode: 'sit'}], [STAFF(1), {expr: 'shock', pose: 'phone', prop: 'phone'}], [STAFF(2), {expr: 'nervous', pose: 'type', mode: 'sit'}], [REPORTER, {expr: 'neutral', pose: 'mask', prop: 'mic'}],
];

export const CastSheet: React.FC = () => {
  const ok = useFonts(), ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ok || !ref.current) return;
    const g = ref.current.getContext('2d')!; g.fillStyle = '#8fa6b8'; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([look, draw], i) => { g.save(); g.translate((i % 6) * 180 + 2, Math.floor(i / 6) * 318 + 6); drawActor(g, look, draw, 0.3); g.restore(); });   // six across, six rows
  }, [ok]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
