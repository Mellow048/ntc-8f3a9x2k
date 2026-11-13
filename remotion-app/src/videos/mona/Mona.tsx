// "The Man Who Walked Out with the Mona Lisa": a 74-second vertical short about the 1911 theft of the Mona Lisa and the
// two years in which the most famous painting in the world was in a rented room in Paris.
// Picture: three.js sets with flat cartoon characters, ink outlines, lens blur, bloom and a grade.
// Timing: every cut, pose and caption is keyed to the narration words (story.ts).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, getInputProps, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode} from 'postprocessing';
import {InkPass, noInkFallback} from '../pendulum/ink';
import {GradeEffect, GRADES, GRADE_STRENGTH} from '../pendulum/grade';
import {LensBlurEffect} from '../pendulum/lensblur';
import {MonaWorld} from './World';
import {useFonts} from './fonts';
import {Captions} from './Captions';
import {Overlays} from './Overlays';

/** profiling switches, e.g. --props='{"fx":"nolens,nomsaa"}'; empty in production */
const OFF = String((getInputProps() as {fx?: string}).fx ?? '');

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, scene} = useThree();
  const world = useMemo(() => new MonaWorld(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lensPre: new LensBlurEffect({maxCoC: 20, nearScale: 1.2, stage: {taps: 10, spread: 0.4, nearTaps: 0, rot: 0.61}}),
    lensMain: new LensBlurEffect({maxCoC: 20, nearScale: 1.2, stage: {taps: 30, spread: 0.94, nearTaps: 0, rot: 0}}),
    bloom: new BloomEffect({blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6}),
    tone: new ToneMappingEffect({mode: ToneMappingMode.NEUTRAL}),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  const post = useMemo(() => <EffectComposer multisampling={OFF.includes('nomsaa') ? 0 : 4}>{[
    OFF.includes('noink') ? null : <primitive key="ink" object={fx.ink} dispose={null} />,
    OFF.includes('nolens') ? null : <primitive key="lens-pre" object={fx.lensPre} dispose={null} />,
    OFF.includes('nolens') ? null : <primitive key="lens-main" object={fx.lensMain} dispose={null} />,
    OFF.includes('nobloom') ? null : <primitive key="bloom" object={fx.bloom} dispose={null} />,
    <primitive key="tone" object={fx.tone} dispose={null} />,
    <primitive key="grade" object={fx.grade} dispose={null} />,
  ].filter(Boolean) as React.ReactElement[]}</EffectComposer>, [fx]);
  world.update(frame, camera as THREE.PerspectiveCamera);
  noInkFallback(world.root);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const focus = Math.max(0.3, world.focus.clone().sub(camera.position).dot(dir)), cInf = world.close ? 11 : 0;
  fx.lensPre.focus = fx.lensMain.focus = focus; fx.lensPre.cInf = fx.lensMain.cInf = cInf;
  return <><primitive object={world.root} dispose={null} />{post}</>;
};

export const MonaShort: React.FC = () => {
  const {width, height} = useVideoConfig();
  const ready = useFonts();
  return (
    <AbsoluteFill style={{background: '#0e0b0a', containerType: 'inline-size'}}>
      {ready ? (
        <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, stencil: false, powerPreference: 'high-performance'}} camera={{fov: 40, near: 0.1, far: 320}}>
          <Scene />
        </ThreeCanvas>
      ) : null}
      {ready ? <Overlays /> : null}
      {ready ? <Captions /> : null}
    </AbsoluteFill>
  );
};

/** Something to look at while the sets are built: the same Scene, frozen on one frame (scripts/pick.sh). */
export {Scene as MonaScene};
