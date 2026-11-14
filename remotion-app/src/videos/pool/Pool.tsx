// "The Gold Under the Pool": a 79-second vertical news short about five bars and a bag of coins found in a suburban
// garden near Lyon, and who ended up with them. Picture: three.js sets with flat cartoon characters, ink outlines, lens
// blur, bloom and a grade. Timing: every cut, pose and caption is keyed to the narration words (story.ts).
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
import {PoolWorld} from './World';
import {useFonts} from './fonts';
import {Captions} from './Captions';
import {Overlays} from './Overlays';

/** profiling switches, e.g. --props='{"fx":"nolens,nomsaa"}'; empty in production */
const OFF = String((getInputProps() as {fx?: string}).fx ?? '');

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, scene} = useThree();
  const world = useMemo(() => new PoolWorld(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    // A light depth-of-field kernel (10 + 30 taps instead of 16 + 64 + 32): the blur is by far the slowest pass in
    // software GL, and flat cartoon colours do not need the full disc.
    lensPre: new LensBlurEffect({maxCoC: 20, nearScale: 1.2, stage: {taps: 10, spread: 0.4, nearTaps: 0, rot: 0.61}}),
    lensMain: new LensBlurEffect({maxCoC: 20, nearScale: 1.2, stage: {taps: 30, spread: 0.94, nearTaps: 0, rot: 0}}),
    bloom: new BloomEffect({blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6}),
    tone: new ToneMappingEffect({mode: ToneMappingMode.NEUTRAL}),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  // The effect objects live for the whole render: never let React dispose them between frames.
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
  // Background blur only on shots where a person fills the frame; wide shots stay sharp (and render much faster).
  const focus = Math.max(0.3, world.focus.clone().sub(camera.position).dot(dir)), cInf = world.close ? 11 : 0;
  fx.lensPre.focus = fx.lensMain.focus = focus; fx.lensPre.cInf = fx.lensMain.cInf = cInf;
  return <><primitive object={world.root} dispose={null} />{post}</>;
};

export const PoolShort: React.FC = () => {
  const {width, height} = useVideoConfig();
  const ready = useFonts();
  return (
    <AbsoluteFill style={{background: '#0b0d14', containerType: 'inline-size'}}>
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
