// Everything this film registers with Remotion: the film, the still-picker used for review, and the cast sheet.
// src/Root.tsx renders this component; references/news/restore.py adds that line when it puts the film back in a live checkout.
import React from 'react';
import {Composition, Freeze, getInputProps, useCurrentFrame} from 'remotion';
import {SorryHackShort} from './SorryHack';
import {CastSheet} from './CastSheet';
import {FPS, TOTAL} from './story';

/** Review stills in one browser page: output frame i shows film frame `frames[i]` (scripts/pick.sh).
 *  The composition keeps the film's length because Remotion clamps a frozen frame to the composition's duration. */
const Review: React.FC = () => {
  const i = useCurrentFrame(), list = ((getInputProps() as {frames?: number[]}).frames ?? [0]) as number[];
  return <Freeze frame={list[Math.min(list.length - 1, i)]}><SorryHackShort /></Freeze>;
};

export const SorryHackCompositions: React.FC = () => (
  <>
    <Composition id="SorryHackShort" component={SorryHackShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="SorryHackReview" component={Review} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="SorryHackCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
