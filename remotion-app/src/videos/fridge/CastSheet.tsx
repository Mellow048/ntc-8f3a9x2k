// Development aid: every character of the fridge hack short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs FridgeCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, FIREFIGHTER, HACKER, INVESTIGATOR, LABTECH, PROF, SHOPPER, SPOKES_PARIS, SPOKES_TEHRAN, TECH, WORKER, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [HACKER(0), {}], [HACKER(1), {pose: 'point'}], [HACKER(2), {pose: 'cross'}], [HACKER(0, 'heart'), {pose: 'both'}],
  [WORKER(0), {expr: 'shock', pose: 'panic'}], [WORKER(0), {expr: 'smile', pose: 'hold'}], [WORKER(1), {expr: 'nervous', pose: 'both', prop: 'box'}], [WORKER(2), {expr: 'pained', pose: 'both'}],
  [FIREFIGHTER, {expr: 'stern', pose: 'both', prop: 'hose'}], [TECH, {expr: 'smile', pose: 'hips'}], [TECH, {expr: 'neutral', pose: 'phone', prop: 'phone'}], [TECH, {expr: 'stern', pose: 'point'}],
  [PROF, {expr: 'smile', pose: 'point'}], [PROF, {expr: 'smile', pose: 'shrug'}], [LABTECH, {expr: 'shock', pose: 'panic'}], [LABTECH, {expr: 'relief', pose: 'both', prop: 'crate'}],
  [SPOKES_PARIS, {expr: 'stern', pose: 'point'}], [SPOKES_PARIS, {expr: 'stern', pose: 'hold', prop: 'paper'}], [SPOKES_PARIS, {expr: 'stern', pose: 'hips'}], [INVESTIGATOR(0), {expr: 'stern', pose: 'hold', prop: 'magnifier'}],
  [SPOKES_TEHRAN, {expr: 'stern', pose: 'cross'}], [SPOKES_TEHRAN, {expr: 'neutral', pose: 'hold', prop: 'paper'}], [SPOKES_TEHRAN, {expr: 'smile_closed', pose: 'hold', prop: 'paper'}], [INVESTIGATOR(1), {expr: 'neutral', pose: 'think'}],
  [SHOPPER(1), {expr: 'smile', pose: 'think'}], [SHOPPER(2), {expr: 'smile', pose: 'both'}], [SHOPPER(4), {expr: 'smile', pose: 'think'}], [SHOPPER(0), {expr: 'grin'}],
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
