import {lake} from '../curiosity/data';
export const FPS=30,TOTAL=lake.frames;
export type V3=[number,number,number];
export type Place='lake'|'rig'|'section'|'breach'|'drain'|'sinking'|'canal'|'escape'|'return'|'lost'|'tunnel'|'impact';
export type Shot={id:number;a:number;b:number;place:Place;pos:V3;end:V3;look:V3;fov:number;light:'day'|'golden';dof:number};
const defs:Array<[number,Place,V3,V3,V3,number,boolean?]>=[
 [0,'lake',[19,18,25],[13,14,21],[0,-1,0],54],
 [5,'lake',[-15,9,22],[-11,7,19],[0,-1,0],54],
 [12,'rig',[13,7,16],[10,5.8,13],[0,3,0],52],
 [18,'rig',[4,3.2,6],[3.2,3,4.8],[0,2,0],56],
 [24,'section',[13,7,23],[10,5.5,20],[0,-3,0],53],
 [30,'tunnel',[3,1.8,7],[1.7,1.7,5],[0,1.5,-5],55],
 [34,'impact',[2.7,2.2,5],[1.7,2.4,3.7],[0,3,-1],48],
 [39,'tunnel',[-2,1.3,7],[-1,1.2,5],[0,1,-7],58],
 [43,'drain',[5,4.8,7],[3.6,4.1,6],[0,1,0],48],
 [51,'lake',[12,18,20],[7,16,16],[0,-3,0],54],
 [57,'sinking',[15,10,20],[11,8,16],[0,-1,0],54],
 [63,'sinking',[-11,7,15],[-8,6,12],[0,-2,0],53],
 [67,'canal',[14,12,20],[10,9,16],[0,0,-3],53],
 [73,'canal',[-9,6,13],[-6,5,10],[0,0,-5],51],
 [79,'escape',[7,4,10],[4.8,3.1,8],[0,1.6,0],49],
 [83,'escape',[-6,3.8,12],[-4.5,3.3,10],[-1,1.5,-.2],52],
 [86,'return',[14,10,19],[10,8,16],[0,0,0],53,true],
 [90,'return',[-10,6,14],[-7.5,5,11],[0,.3,0],51,true],
 [97,'lost',[10,5,20],[7,3.8,17],[0,-4,0],50,true],
];
export const SHOTS:Shot[]=defs.map((d,i)=>({id:i+1,a:i?Math.round(lake.words[d[0]].start*30)-2:0,b:i===defs.length-1?TOTAL:Math.round(lake.words[defs[i+1][0]].start*30)-2,place:d[1],pos:d[2],end:d[3],look:d[4],fov:d[5],light:d[6]?'golden':'day',dof:0}));
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));export const smooth=(v:number)=>{const q=clamp(v);return q*q*(3-2*q)};
export const shotAt=(f:number)=>SHOTS.find(s=>f>=s.a&&f<s.b)??SHOTS[SHOTS.length-1];
export const CAMS=(s:Shot,f:number)=>{const q=clamp((f-s.a)/(s.b-s.a)),u=.4*q+.6*smooth(q);return {pos:s.pos.map((x,i)=>x+(s.end[i]-x)*u) as V3,look:s.look,fov:s.fov-q};};
export const DOF=(s:Shot)=>s.dof;export const KICKS=[{f:393,amount:.009},{f:674,amount:.008}];
