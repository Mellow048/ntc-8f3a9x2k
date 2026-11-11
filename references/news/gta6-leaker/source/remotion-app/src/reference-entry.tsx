// Reference-only standalone registration adapter; the film modules are unchanged.
// In a live checkout these two compositions are registered in src/Root.tsx instead (same two lines).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {CastSheet} from './videos/gta6/CastSheet';
import {CyberleekShort} from './videos/gta6/Gta6';
import {FPS, TOTAL} from './videos/gta6/story';

const Root: React.FC = () => (
  <>
    <Composition id="CyberleekShort" component={CyberleekShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CyberleekCastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
