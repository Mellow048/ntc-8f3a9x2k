// Development aid: every character of the fake boss short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs FakeBossCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, BOSS, CALLER, DEFENDANT, FAKE_LAWYER, LAWYER, PARTNER, PROSECUTOR, STAFF, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [BOSS, {expr: 'smile'}], [BOSS, {expr: 'stern', pose: 'point'}], [BOSS, {expr: 'stern', pose: 'hush'}], [CALLER('boss'), {wear: true, face: 'boss'}],
  [CALLER('boss'), {pose: 'hold', prop: 'plate', face: 'boss'}], [LAWYER, {expr: 'smile', pose: 'hold', prop: 'paper'}], [FAKE_LAWYER, {wear: true, face: 'lawyer'}], [FAKE_LAWYER, {pose: 'hold', prop: 'plate', face: 'lawyer'}],
  [DEFENDANT(0), {}], [DEFENDANT(1), {pose: 'hips'}], [DEFENDANT(2), {pose: 'cross'}], [DEFENDANT(1), {pose: 'hold', prop: 'trophy'}],
  [PARTNER(0), {}], [PARTNER(1), {pose: 'shrug'}], [PROSECUTOR, {expr: 'stern', pose: 'desk'}], [PROSECUTOR, {expr: 'stern', pose: 'point'}],
  [STAFF(0), {expr: 'smile', pose: 'type', mode: 'sit'}], [STAFF(0), {expr: 'smile', pose: 'wave', mode: 'sit'}], [STAFF(0), {expr: 'neutral', pose: 'hold', prop: 'lens'}], [STAFF(1), {expr: 'smile'}],
  [STAFF(2), {expr: 'shock', pose: 'panic'}], [STAFF(3), {expr: 'smile', pose: 'point'}], [STAFF(3), {expr: 'neutral', pose: 'hold', prop: 'key'}], [STAFF(4), {expr: 'stern', pose: 'hold', prop: 'paddle'}],
  [STAFF(4), {expr: 'neutral', pose: 'hold', prop: 'key'}], [STAFF(4), {expr: 'stern', pose: 'push'}], [LAWYER, {expr: 'neutral'}], [BOSS, {expr: 'neutral', pose: 'phone', prop: 'phone'}],
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
