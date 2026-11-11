import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import React from 'react';
import {Petit} from './Petit';
import {TOTAL, FPS} from './story';
const Root: React.FC = () => <Composition id="Petit" component={Petit} durationInFrames={TOTAL} fps={FPS} width={720} height={1280}/>;
registerRoot(Root);
