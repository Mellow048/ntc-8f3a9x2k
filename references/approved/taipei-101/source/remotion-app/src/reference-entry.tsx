// Reference-only standalone registration adapter; renderer modules are unchanged.
import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {PendulumShort} from './videos/pendulum/Pendulum';
import {TOTAL,FPS} from './videos/pendulum/story';
const Root:React.FC=()=> <Composition id="PendulumShort" component={PendulumShort} durationInFrames={TOTAL} fps={FPS} width={720} height={1280}/>;
registerRoot(Root);
