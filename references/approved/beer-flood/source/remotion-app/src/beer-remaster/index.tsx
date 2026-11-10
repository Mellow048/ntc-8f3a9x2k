import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {BeerFloodRemastered} from './Beer';
import {TOTAL,FPS} from './story';
const Root:React.FC=()=> <Composition id="BeerFloodRemastered" component={BeerFloodRemastered} durationInFrames={TOTAL} fps={FPS} width={720} height={1280}/>;
registerRoot(Root);
