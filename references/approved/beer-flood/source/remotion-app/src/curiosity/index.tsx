import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {CuriosityShort} from './Short';
import {DATA,Slug} from './story';
const Root:React.FC=()=> <>{(['beer','survivor','lake'] as Slug[]).map(slug=><Composition key={slug} id={`Curiosity-${slug}`} component={CuriosityShort} defaultProps={{slug}} width={720} height={1280} fps={30} durationInFrames={DATA[slug].frames}/>)}</>;
registerRoot(Root);
