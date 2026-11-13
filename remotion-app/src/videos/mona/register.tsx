// Everything this film registers with Remotion: the film, the still-picker used for review, and the cast sheet.
import React from 'react';
import {Composition, Freeze, getInputProps, useCurrentFrame} from 'remotion';
import {MonaShort} from './Mona';
import {CastSheet} from './CastSheet';
import {FPS, TOTAL} from './story';

/** Review stills in one browser page: output frame i shows film frame `frames[i]` (scripts/pick.sh).
 *  The composition keeps the film's length because Remotion clamps a frozen frame to the composition's duration. */
const Review: React.FC = () => {
  const i = useCurrentFrame(), list = ((getInputProps() as {frames?: number[]}).frames ?? [0]) as number[];
  return <Freeze frame={list[Math.min(list.length - 1, i)]}><MonaShort /></Freeze>;
};

export const MonaCompositions: React.FC = () => (
  <>
    <Composition id="MonaShort" component={MonaShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="MonaReview" component={Review} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="MonaCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
