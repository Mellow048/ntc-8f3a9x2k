// Development aid: every character of the sorry hackers short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs TruckStopCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, HOOD, MEDIC, NURSE, PATIENT, STUDENT, type Look, type Draw} from './cast';

const CELLS: [Look, Draw][] = [
  [HOOD(0), {emo: 'flat'}], [HOOD(1), {emo: 'sad', pose: 'both', prop: 'card', text: 'SORRY'}], [HOOD(2), {emo: 'evil', pose: 'hips'}], [HOOD(0), {emo: 'sad', pose: 'hold', prop: 'flowers'}],
  [HOOD(2), {emo: 'cash', pose: 'hold', prop: 'cash'}], [HOOD(1), {emo: 'happy', pose: 'hold', prop: 'key'}], [HOOD(0), {emo: 'happy', halo: 'on', pose: 'hold', prop: 'heart'}], [HOOD(1), {emo: 'happy', halo: 'askew', pose: 'shrug'}],
  [HOOD(2), {emo: 'oh', pose: 'panic'}], [HOOD(1), {emo: 'evil', pose: 'hold', prop: 'megaphone'}], [HOOD(0), {emo: 'flat', pose: 'cross'}], [HOOD(2), {emo: 'sad', pose: 'shrug'}],
  [NURSE(0), {expr: 'neutral'}], [NURSE(1), {expr: 'shock', pose: 'panic'}], [NURSE(2), {expr: 'neutral', pose: 'hold', prop: 'clip'}], [NURSE(3), {expr: 'stern', pose: 'push'}],
  [NURSE(0), {expr: 'neutral', pose: 'type', mode: 'sit'}], [NURSE(1), {expr: 'neutral', pose: 'think', mode: 'sit'}], [MEDIC, {expr: 'neutral'}], [MEDIC, {expr: 'stern', pose: 'point'}],
  [PATIENT(0), {expr: 'neutral', mode: 'sit'}], [PATIENT(0), {expr: 'stern', pose: 'cross', mode: 'sit'}], [PATIENT(1), {expr: 'neutral', pose: 'phone', prop: 'phone'}], [PATIENT(2), {expr: 'neutral', mode: 'sit'}],
  [STUDENT(0), {expr: 'neutral', pose: 'type', mode: 'sit'}], [STUDENT(1), {expr: 'shock', pose: 'panic', mode: 'sit'}], [STUDENT(2), {expr: 'shock', pose: 'shrug'}], [PATIENT(0), {expr: 'neutral', pose: 'hold', prop: 'phone'}],
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
