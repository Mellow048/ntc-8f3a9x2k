// Everything this film registers with Remotion: the film, the still-picker used for review, and the cast sheet.
// src/Root.tsx renders this component; references/news/restore.py adds that line when it puts the film back in a live checkout.
import React from 'react';
import {Composition, Freeze, getInputProps, useCurrentFrame} from 'remotion';
import {BtcFlexShort} from './BtcFlex';
import {CastSheet} from './CastSheet';
import {FPS, TOTAL} from './story';

/** Review stills in one browser page: output frame i shows film frame `frames[i]` (scripts/pick.sh).
 *  The composition keeps the film's length because Remotion clamps a frozen frame to the composition's duration. */
const Review: React.FC = () => {
  const i = useCurrentFrame(), list = ((getInputProps() as {frames?: number[]}).frames ?? [0]) as number[];
  return <Freeze frame={list[Math.min(list.length - 1, i)]}><BtcFlexShort /></Freeze>;
};

export const BtcFlexCompositions: React.FC = () => (
  <>
    <Composition id="BtcFlexShort" component={BtcFlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="BtcFlexReview" component={Review} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="BtcFlexCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
