import {beer} from '../curiosity/data';
export const FPS=30;
export const TOTAL=beer.frames;
export type V3=[number,number,number];
export type Place='street'|'warehouse'|'wall'|'cellar'|'memorial'|'office';
export type Shot={id:number;a:number;b:number;place:Place;pos:V3;look:V3;end:V3;fov:number;light:'day'|'golden';dof:number};
const specs:Array<[number,Place,V3,V3,V3,number,'day'|'golden',number]>=[
 [0,'street',[2.4,1.8,11],[-.5,1.5,-5],[1.8,1.7,9],49,'day',0],
 [9,'warehouse',[8.3,3.3,12],[0,3.7,0],[7,3.6,10.5],45,'day',0],
 [24,'warehouse',[4.3,4.2,6.8],[1.7,3.6,1.7],[3.9,4,6.1],36,'day',12],
 [32,'warehouse',[6.1,2.7,11],[0,3,0],[5.5,2.5,10],46,'day',0],
 [35,'wall',[4.5,2,12],[0,2.2,-1],[3.5,1.8,10],46,'day',0],
 [42,'street',[-2.1,1.65,10],[0,1.5,-6],[-1.4,1.55,8.6],48,'day',0],
 [49,'street',[1.7,2.1,7.5],[-1.4,1.7,-1],[1.1,2,6.3],44,'day',10],
 [61,'cellar',[5.5,3.1,8],[0,.6,-.7],[4.6,2.9,7],45,'day',0],
 [63,'memorial',[3.2,2.2,7],[0,1.3,0],[2.6,2,6],39,'golden',10],
 [66,'street',[1.1,2.4,5],[-1.4,1.65,-1],[.7,2.25,4],41,'golden',12],
 [78,'office',[4.7,2.8,8.5],[0,1.8,0],[3.9,2.6,7.2],44,'golden',8],
];
export const SHOTS:Shot[]=specs.map((s,i)=>({id:i+1,a:i?Math.round(beer.words[s[0]].start*30)-2:0,b:i===specs.length-1?TOTAL:Math.round(beer.words[specs[i+1][0]].start*30)-2,place:s[1],pos:s[2],look:s[3],end:s[4],fov:s[5],light:s[6],dof:s[7]}));
export const shotAt=(f:number)=>SHOTS.find(s=>f>=s.a&&f<s.b)??SHOTS[SHOTS.length-1];
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const u=clamp(v);return u*u*(3-2*u)};
// Editorial inserts within narration shots: no long static barrel hold. Each
// beat has its own dolly/orbit rather than random shake masquerading as motion.
type Beat={at:number;pos:V3;end:V3;look:V3;to?:V3;fov:number};
export const BEATS:Record<number,Beat[]>={
 1:[{at:0,pos:[.3,.65,8],end:[-1,1.15,5.5],look:[-1,1.3,-5],fov:58},{at:.56,pos:[4.4,2.9,5],end:[3.4,2.3,3.8],look:[-2.2,1.7,-4],fov:52}],
 2:[{at:0,pos:[9,2.2,11],end:[6.4,3.8,9],look:[0,3.4,0],fov:51},
    {at:.29,pos:[-5.8,5.4,7.5],end:[-4.8,6.7,6.3],look:[0,4,0],fov:48},
    {at:.55,pos:[7,2.7,7.8],end:[6.4,2.5,6.7],look:[3.8,2,3],fov:43},
    {at:.76,pos:[5.4,4.5,7.3],end:[4.4,4.1,6.2],look:[1.7,3.6,1.7],fov:40}],
 3:[{at:0,pos:[4.7,4.7,6.8],end:[3.7,3.6,6],look:[1.7,3.4,1.7],to:[1.7,2.6,1.7],fov:37},
    {at:.57,pos:[7.1,2.6,7.6],end:[6.5,2.5,6.7],look:[3.8,2.1,3],fov:43}],
 4:[{at:0,pos:[6.6,2,10],end:[4.5,1.3,8.1],look:[0,3,0],to:[0,2.6,1],fov:55}],
 5:[{at:0,pos:[4.7,1.1,11],end:[2.8,.65,8.5],look:[0,2,-1],fov:57}],
 6:[{at:0,pos:[-2.7,.7,8],end:[-1.5,1,5],look:[0,1,-7],to:[0,1.4,-5],fov:58}],
 7:[{at:0,pos:[3.4,2.4,6.5],end:[2.5,2.1,5.3],look:[-1.6,1.4,-1.7],fov:48},
    {at:.36,pos:[-4.4,1.4,4.8],end:[-3.3,1.2,3.5],look:[-.5,1.25,-1.7],fov:52},
    {at:.70,pos:[2.1,3.6,8.5],end:[.5,4.5,7],look:[-1,1,-2],fov:53}],
 8:[{at:0,pos:[5.6,2.3,7.8],end:[3.9,1.6,6.2],look:[0,.8,-.7],fov:51}],
 10:[{at:0,pos:[2.3,2.3,5.5],end:[1.1,2,4.1],look:[-1.2,1.5,-2],fov:47},
     {at:.38,pos:[-3.1,1.05,2.9],end:[-2.4,1.3,2],look:[-1.2,1.4,-2],fov:48},
     {at:.72,pos:[1.1,2.8,5],end:[.1,2.3,3.7],look:[-1.2,1.6,-2.5],fov:45}],
 11:[{at:0,pos:[4.9,2.8,8],end:[3.6,2.5,6.7],look:[0,1.8,0],fov:48},
     {at:.36,pos:[1.8,5.8,4.8],end:[1.2,5.2,4.1],look:[.3,1.5,.6],fov:44},
     {at:.68,pos:[-4.5,2.8,8.2],end:[-3.8,2.5,7.4],look:[0,1.9,-.5],fov:48}],
};
export const EDIT_CUTS=SHOTS.flatMap(s=>(BEATS[s.id]??[]).slice(1).map(b=>s.a+Math.round(b.at*(s.b-s.a))));
export const CAMS=(s:Shot,f:number)=>{
 const u=clamp((f-s.a)/(s.b-s.a)),beats=BEATS[s.id];
 const idx=beats?beats.reduce((n,b,i)=>u>=b.at?i:n,0):0;
 const b=beats?.[idx];const v=b?clamp((u-b.at)/((beats[idx+1]?.at??1)-b.at)):u;
 const ease=v*v*(3-2*v);const pos=b?.pos??s.pos,end=b?.end??s.end,look=b?.look??s.look,to=b?.to??look;
 return {pos:pos.map((x,i)=>x+(end[i]-x)*(.3*v+.7*ease)) as V3,look:look.map((x,i)=>x+(to[i]-x)*ease) as V3,fov:(b?.fov??s.fov)-v*1.6};
};
export const KICKS=[{f:396,amount:.025},{f:433,amount:.014}];
export const DOF=(s:Shot)=>s.dof;
export const FOREGROUND=[2,3,7,10,11];
