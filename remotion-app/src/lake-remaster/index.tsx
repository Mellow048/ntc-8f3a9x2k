import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {LakeRemastered} from './Film';
import {TOTAL,FPS} from './story';
const Root:React.FC=()=> <Composition id="LakeRemastered" component={LakeRemastered} durationInFrames={TOTAL} fps={FPS} width={720} height={1280}/>;
registerRoot(Root);
