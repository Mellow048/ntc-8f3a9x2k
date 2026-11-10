// Run: node --experimental-strip-types shoots/breathing-bridge/test-motion.mjs
import assert from 'node:assert/strict';
import {jointShift,jointCue,MOTION_WINDOWS} from '../../remotion-app/src/videos/bridge-remaster/motion.ts';
for (const [index,[a,b]] of MOTION_WINDOWS.entries()) {
 const direction=index%2===0?1:-1;
 assert.equal(jointCue(a),direction===1?'in':'out');
 for(let f=a;f<b;f++) assert.ok(direction*(jointShift(f+1)-jointShift(f))>=-1e-12,`wrong movement at ${f}`);
 assert.ok(direction*(jointShift(b)-jointShift(a))>.19,`too little travel ${a}-${b}`);
 assert.equal(jointShift(a-1),jointShift(a));
 assert.equal(jointShift(b),jointShift(b+1));
}
for(const f of [0,23,50,915,970,994,1316,1400])assert.equal(jointShift(f),0,`unexpected idle drift ${f}`);
assert.ok(Math.abs(jointShift(1198)-jointShift(1199))<1e-12,'warm-to-cold cut must preserve the gap');
assert.ok(Math.abs(jointShift(324)-jointShift(325))<1e-12,'early warm-to-cold cut must preserve the gap');
console.log('bridge motion: correct direction, held endpoints and hot/cold continuity');
