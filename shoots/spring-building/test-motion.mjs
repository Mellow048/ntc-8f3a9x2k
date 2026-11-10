import assert from 'node:assert/strict';
import {seismicMotion,jellyMotion,QUAKE_WINDOWS,SHOTS,TOTAL} from '../../remotion-app/src/videos/spring-remaster/story.ts';
assert.equal(SHOTS[0].start,0);assert.ok(SHOTS.at(-1).start<TOTAL);
assert.deepEqual(SHOTS.map(s=>s.start),[...new Set(SHOTS.map(s=>s.start))].sort((a,b)=>a-b));
for(const [a,b] of QUAKE_WINDOWS){
 assert.ok(Math.abs(seismicMotion(a).ground)+Math.abs(seismicMotion(a).building)<1e-12);
 assert.ok(Math.abs(seismicMotion(b).ground)<1e-12);
 let g=0,h=0;for(let f=a;f<=b;f++){const s=seismicMotion(f);g+=s.ground**2;h+=s.building**2;}
 assert.ok(h>0&&h<g*.15,`${a}: isolation must reduce, not erase, building movement`);
}
for(let f=0;f<TOTAL;f++)if(!QUAKE_WINDOWS.some(([a,b])=>f>=a&&f<=b))assert.deepEqual(seismicMotion(f),{ground:0,building:0},`idle quake ${f}`);
for(let f=460;f<=570;f++){const s=jellyMotion(f);assert.equal(s.table,s.tray,'locked tray must follow table');}
let locked=0,sliding=0;
for(let f=460;f<=570;f++)locked+=jellyMotion(f).wobble**2;
for(let f=593;f<=730;f++)sliding+=jellyMotion(f).wobble**2;
assert.ok(sliding<locked*.15,'sliding tray should reduce jelly wobble');
console.log('spring motion: finite quakes, reduced but nonzero building motion, and consistent jelly analogy');

assert.equal(SHOTS[0].kind,'lab','open on the surprising experiment, not an explanatory landmark shot');
const architecture=SHOTS.reduce((n,s,i)=>n+(['hall','dome','cutaway','moat'].includes(s.kind)?(SHOTS[i+1]?.start??TOTAL)-s.start:0),0);
assert.ok(architecture/TOTAL<.2,'landmark shots must not dominate the revision');
assert.ok(new Set(SHOTS.map(s=>s.kind)).size>=7,'need genuinely different scenes');
console.log(`architecture occupies ${(100*architecture/TOTAL).toFixed(1)}% of the film`);
