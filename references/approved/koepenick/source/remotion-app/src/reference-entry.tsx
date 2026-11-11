// Reference-only registration adapter. Approved renderer modules are unchanged.
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Koepenick} from './videos/koepenick/Koepenick';
import {TOTAL, FPS} from './videos/koepenick/story';
const Root: React.FC = () => <Composition id="Koepenick" component={Koepenick}
  durationInFrames={TOTAL} fps={FPS} width={720} height={1280}/>;
registerRoot(Root);
