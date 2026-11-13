// Development aid: every character of the Mona Lisa short on one page, to check costumes and poses at a glance.
//   node scripts/stills.mjs MonaCastSheet out/cast --frames=0
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill, getInputProps} from 'remotion';
import {useFonts} from './fonts';
import {drawActor, ARTIST, CARABINIERE, CITIZEN, CONNOISSEUR, DEALER, DETECTIVE, GUARD, KING, LEONARDO, MAGISTRATE, NAPOLEON, PERUGGIA, PHOTOGRAPHER, PICASSO, PLUMBER, POET, POLICE, TOURIST, WORKMAN, type Look, type Draw} from './cast';

const PAGES: [Look, Draw][][] = [[
  [PERUGGIA(0), {expr: 'neutral'}], [PERUGGIA(0), {expr: 'smile', pose: 'reach', back: true}], [PERUGGIA(0), {expr: 'nervous', pose: 'lift'}], [PERUGGIA(0), {expr: 'whistle', pose: 'tip'}], [PERUGGIA(0), {mode: 'side', phase: 0.1, expr: 'smile'}], [PERUGGIA(0), {expr: 'shock', pose: 'low', prop: 'screwdriver'}],
  [PERUGGIA(1), {expr: 'smile', pose: 'under', prop: 'bundle'}], [PERUGGIA(1), {mode: 'side', phase: 0.3, expr: 'whistle', prop: 'bundle'}], [PERUGGIA(1), {expr: 'nervous', pose: 'hold', prop: 'knob'}], [PERUGGIA(1), {expr: 'relief', pose: 'heart', prop: 'flag'}], [PERUGGIA(1), {expr: 'nervous', mode: 'sit', pose: 'both'}], [PERUGGIA(2), {expr: 'pained', pose: 'cuffed'}],
  [WORKMAN(0), {expr: 'neutral', mode: 'side', phase: 0.2}], [WORKMAN(1), {expr: 'smile'}], [WORKMAN(2), {expr: 'neutral', pose: 'both'}], [GUARD(0), {expr: 'neutral', pose: 'shrug'}], [GUARD(1), {expr: 'stern', pose: 'hips'}], [GUARD(0), {expr: 'shock', pose: 'panic'}],
  [PLUMBER, {expr: 'smile', pose: 'hang', prop: 'bag'}], [PLUMBER, {expr: 'smile', pose: 'low', prop: 'pliers'}], [PLUMBER, {expr: 'grin', pose: 'wave'}], [ARTIST, {expr: 'smile', pose: 'both', prop: 'palette'}], [ARTIST, {expr: 'shock', pose: 'hang', prop: 'palette'}], [PHOTOGRAPHER, {expr: 'nervous', pose: 'shrug'}],
  [CITIZEN(0), {expr: 'shock'}], [CITIZEN(1), {expr: 'shock', pose: 'think'}], [CITIZEN(2), {expr: 'neutral', pose: 'hold', prop: 'hat'}], [CITIZEN(3), {expr: 'shock', pose: 'point'}], [CITIZEN(4), {expr: 'pained'}], [CITIZEN(5), {expr: 'neutral'}],
  [POLICE(0), {expr: 'stern', pose: 'point'}], [POLICE(1), {expr: 'stern'}], [DETECTIVE, {expr: 'stern', pose: 'write', prop: 'notebook'}], [DETECTIVE, {expr: 'smile', pose: 'tip'}], [POET, {expr: 'shock', pose: 'cuffed'}], [POET, {expr: 'nervous', pose: 'hold', prop: 'book'}],
], [
  [PICASSO, {expr: 'nervous', pose: 'hang'}], [PICASSO, {expr: 'shock', pose: 'panic'}], [MAGISTRATE, {expr: 'stern', pose: 'point', mode: 'sit'}], [DEALER, {expr: 'shock', pose: 'panic'}], [DEALER, {expr: 'neutral', pose: 'think'}], [DEALER, {expr: 'stern', pose: 'point'}],
  [CARABINIERE(0), {expr: 'stern'}], [CARABINIERE(1), {expr: 'stern', pose: 'point'}], [NAPOLEON, {expr: 'stern', pose: 'heart'}], [NAPOLEON, {expr: 'nervous', pose: 'shrug'}], [LEONARDO, {expr: 'smile', pose: 'hold'}], [KING, {expr: 'grin', pose: 'wave'}],
  [CONNOISSEUR, {expr: 'smile', pose: 'think', prop: 'cane'}], [CITIZEN(6), {expr: 'grin', pose: 'wave'}], [CITIZEN(7), {expr: 'laugh', pose: 'panic'}], [CITIZEN(4), {expr: 'grin', pose: 'both', prop: 'boxcam'}], [TOURIST(0), {expr: 'smile', pose: 'phone', prop: 'phone'}], [TOURIST(1), {expr: 'grin', pose: 'phone', prop: 'phone'}],
  [TOURIST(2), {expr: 'smile', pose: 'phone', prop: 'phone'}], [TOURIST(3), {expr: 'shock', pose: 'phone', prop: 'phone'}], [TOURIST(4), {expr: 'smile'}], [TOURIST(5), {expr: 'grin', pose: 'phone', prop: 'phone'}], [TOURIST(0), {expr: 'smile', pose: 'phone', prop: 'phone', back: true}], [TOURIST(3), {back: true, pose: 'phone', prop: 'phone'}],
  [GUARD(0), {back: true}], [ARTIST, {back: true, pose: 'hang', prop: 'palette'}], [CITIZEN(1), {back: true}], [CITIZEN(0), {back: true}], [PERUGGIA(1), {back: true, pose: 'low'}], [PLUMBER, {back: true}],
  [PERUGGIA(0), {expr: 'smile', facing: 1}], [PERUGGIA(0), {expr: 'nervous', facing: -1, look: -1}], [GUARD(0), {mode: 'side', phase: 0.6}], [CITIZEN(3), {mode: 'side', phase: 0.4}], [POLICE(0), {mode: 'sidestand'}], [DETECTIVE, {expr: 'neutral', pose: 'think'}],
]];

export const CastSheet: React.FC = () => {
  const ok = useFonts(), ref = useRef<HTMLCanvasElement>(null), page = Number((getInputProps() as {page?: number}).page ?? 0);
  useEffect(() => {
    if (!ok || !ref.current) return;
    const g = ref.current.getContext('2d')!; g.fillStyle = '#8fa6b8'; g.fillRect(0, 0, 1080, 1920);
    PAGES[page % PAGES.length].forEach(([look, draw], i) => { g.save(); g.translate((i % 6) * 180 + 2, Math.floor(i / 6) * 318 + 6); drawActor(g, look, draw, 0.3); g.restore(); });   // six across, six rows
  }, [ok, page]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
