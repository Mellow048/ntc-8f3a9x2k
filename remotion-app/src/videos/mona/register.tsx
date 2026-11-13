// Everything this film registers with Remotion: the film, the still-picker used for review, and the cast sheet.
import React from 'react';
import {Composition, Freeze, getInputProps, useCurrentFrame} from 'remotion';
import {CastSheet} from './CastSheet';

export const MonaCompositions: React.FC = () => (
  <>
    <Composition id="MonaCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
void Freeze; void getInputProps; void useCurrentFrame;
