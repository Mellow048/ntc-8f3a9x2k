// Development aid: every character of the GTA 6 leaker short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs CyberleekCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, LEEK, ZELNICK, LAWYER, REPORTER, DETECTIVE, EXEC, DEV, FAN, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [LEEK, {}], [LEEK, {pose: 'point'}], [LEEK, {pose: 'hold', prop: 'sign'}], [LEEK, {pose: 'both', prop: 'jar'}],
  [LEEK, {pose: 'phone', prop: 'cup'}], [LEEK, {pose: 'cross'}], [LEEK, {pose: 'shrug'}], [LEEK, {pose: 'panic'}],
  [ZELNICK, {expr: 'neutral', pose: 'point'}], [ZELNICK, {expr: 'smile', pose: 'shrug'}], [LAWYER(0), {expr: 'stern', pose: 'hold', prop: 'paper'}], [LAWYER(1), {expr: 'stern', pose: 'hold', prop: 'paper'}],
  [LAWYER(2), {expr: 'stern', prop: 'case'}], [REPORTER(0), {expr: 'stern', pose: 'hold', prop: 'magnifier'}], [REPORTER(1), {expr: 'neutral', pose: 'think'}], [DETECTIVE, {expr: 'dazed', pose: 'think'}],
  [EXEC(0), {expr: 'nervous', pose: 'think'}], [EXEC(1), {expr: 'shock', pose: 'hold', prop: 'paper'}], [DEV(0), {expr: 'shock', pose: 'panic'}], [DEV(1), {expr: 'dazed', pose: 'think'}],
  [DEV(2), {expr: 'pained'}], [DEV(3), {expr: 'dazed', pose: 'hips'}], [FAN(0), {expr: 'grin', pose: 'both', prop: 'pad'}], [FAN(3), {expr: 'shock', pose: 'panic'}],
  [FAN(4), {expr: 'grin', pose: 'hold', prop: 'disc'}], [FAN(5), {expr: 'laugh', pose: 'hold', prop: 'sign'}], [FAN(6), {expr: 'stern', pose: 'cross'}], [FAN(7), {expr: 'laugh', pose: 'hold', prop: 'slip'}],
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
