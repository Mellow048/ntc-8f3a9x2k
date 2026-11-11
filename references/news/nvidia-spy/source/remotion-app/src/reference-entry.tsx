// Reference-only standalone registration adapter; the film modules are unchanged.
// In a live checkout these two compositions are registered in src/Root.tsx instead (same two lines).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {CastSheet} from './videos/nvidia/CastSheet';
import {NvidiaShort} from './videos/nvidia/Nvidia';
import {FPS, TOTAL} from './videos/nvidia/story';

const Root: React.FC = () => (
  <>
    <Composition id="NvidiaShort" component={NvidiaShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="NvidiaCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
