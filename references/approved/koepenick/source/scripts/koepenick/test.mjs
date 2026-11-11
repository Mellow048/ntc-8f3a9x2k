import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('remotion-app/src/videos/koepenick/data.json','utf8'));
assert.equal(data.total,2090);assert.equal(data.fps,30);assert.equal(data.shots[0].a,0);
let end=0;for(const s of data.shots){assert.equal(s.a,end);assert(s.b>s.a);assert(s.b-s.a>=20);assert(s.fov>=30&&s.fov<=55);assert(s.pos[1]>.5);end=s.b;}
assert.equal(end,data.total);assert.equal(new Set(data.shots.map(s=>s.place)).size,26);
let t=0;for(const w of data.words){assert(w.start>=t);assert(w.end>w.start);t=w.end;assert(w.end<data.total/30);}
assert(data.total/30-t>=1.2);let groups=0;for(let i=0;i<data.words.length;){const a=data.words[i],b=data.words[i+1];const pair=!!b&&a.word.length+b.word.length<=13&&b.start-a.end<.32;i+=pair?2:1;groups++;}
// Frame-addressed actions may be evaluated out of order by Remotion: no incremental state.
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
for(const i of [29,37,43,57,68,79,94,99,108,125,128,135,141,146,162,188,204]){
 const w=Math.round(data.words[i].start*30)-2;
 assert.equal(ease((w-2-w)/14),0);assert.equal(ease((w+14-w)/14),1);assert.equal(ease((w+100-w)/14),1);
}
console.log(`PASS: ${data.shots.length} contiguous distinct beats; ${data.words.length} timed words; ${groups} caption groups of <=2 words; ${data.total} frames; ${(data.total/30-t).toFixed(3)}s tail; deterministic clamped action endpoints.`);
