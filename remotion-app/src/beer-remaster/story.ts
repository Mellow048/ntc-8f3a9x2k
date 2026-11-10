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
export const CAMS=(s:Shot,f:number)=>{const u=clamp((f-s.a)/(s.b-s.a));return {pos:s.pos.map((v,i)=>v+(s.end[i]-v)*u) as V3,look:s.look,fov:s.fov-u*.7};};
export const KICKS=[{f:396,amount:.025},{f:433,amount:.014}];
export const DOF=(s:Shot)=>s.dof;
export const FOREGROUND=[2,3,7,10,11];
