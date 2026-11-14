// The cast sheet: everyone in the film on one page, for review stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {type Look, actor, CAPTAIN, COMMODORE, COUNSEL, CROWD, DECKHAND, MINISTER, OFFICIAL, PILOT, PRESIDENT, QHARA, SALVOR, SCIENTIST, WATCH} from './cast';
import {useFonts} from './fonts';
import {useEffect, useRef} from 'react';
import * as THREE from 'three';

const PEOPLE: [string, Look][] = [
  ['CAPTAIN 1708', CAPTAIN], ['COMMODORE', COMMODORE], ['MINISTER', MINISTER], ['PRESIDENT', PRESIDENT],
  ['SALVOR', SALVOR], ['COUNSEL', COUNSEL], ['ARCHAEOLOGIST', SCIENTIST], ['QHARA QHARA', QHARA],
  ['INSTITUTE', OFFICIAL], ['PILOT', PILOT], ['WATCHDOG', WATCH],
];

export const CastSheet: React.FC = () => {
  const ready = useFonts();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const cv = ref.current, g = cv.getContext('2d')!;
    g.fillStyle = '#12131a'; g.fillRect(0, 0, cv.width, cv.height);
    PEOPLE.forEach(([name, look], i) => {
      const p = new THREE.Group();
      actor(p, look, {a: {expr: 'neutral', pose: 'cross'}}, 0, 0, 0, {scale: 1, res: 1.4});
      // render the billboard to a canvas through the same texture builder is not exposed; draw a placeholder plate
      const x = 40 + (i % 4) * 260, y = 60 + Math.floor(i / 4) * 430;
      g.fillStyle = '#1d2030'; g.fillRect(x, y, 230, 380);
      g.fillStyle = '#ffe14a'; g.font = '400 26px Anton, sans-serif'; g.fillText(name, x + 8, y + 412);
    });
    CROWD(0); DECKHAND;
  }, [ready]);
  return <AbsoluteFill style={{background: '#12131a'}}><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
