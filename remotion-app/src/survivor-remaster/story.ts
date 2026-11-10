import {survivor} from '../curiosity/data';
export const FPS=30,TOTAL=survivor.frames;
export type V3=[number,number,number];
export type Place='ruins'|'train'|'street'|'shelter'|'home'|'office'|'people'|'recognition'|'peace'|'lanterns'|'hiroshima-bomb'|'nagasaki-bomb'|'packing'|'carriage'|'calendar'|'certificate'|'testimony';
export type Shot={id:number;a:number;b:number;place:Place;pos:V3;end:V3;look:V3;fov:number;light:'day'|'golden';dof:number};
// Each cut is tied to narration. Restraint in the aftermath, energy in travel.
const defs:Array<[number,Place,V3,V3,V3,number,boolean?]>=[
 [0,'ruins',[3,2.5,7],[1.7,2.2,5.7],[0,1.7,0],46],
 [5,'train',[10,4.5,16],[7,3.8,14],[0,2.2,2],55],
 [11,'street',[5.5,4,12],[3,2.5,9],[0,1.4,-3],53],
 [16,'street',[3,2.7,6],[1.9,2.3,4.7],[0,1.7,-1],45],
 [21,'packing',[4.8,3.3,8],[3.6,2.9,6.6],[0,1.7,0],48],
 [25,'hiroshima-bomb',[14,17,25],[10,15,23],[0,9,-5],55],
 [29,'shelter',[3,2.5,7],[1.7,2.2,5.7],[0,1.5,0],45],
 [33,'shelter',[-3,2.8,7],[-2,2.4,6],[0,1.5,0],45,true],
 [37,'train',[8,4,15],[5.8,3.5,13],[0,2.1,2],54],
 [40,'carriage',[3,2.8,7],[1.9,2.5,6],[0,1.9,-1],47],
 [42,'home',[4.5,3,8],[2.8,2.5,6],[0,1.5,0],49],
 [45,'calendar',[2.8,3.3,5],[1.7,2.9,4.2],[0,1.7,.8],42],
 [49,'nagasaki-bomb',[13,17,25],[10,15,23],[0,9,-5],55],
 [54,'office',[-3.7,2.7,7],[-2.2,2.3,5.8],[0,1.8,0],49],
 [56,'ruins',[-3,2.7,8],[-1.6,2.4,6.6],[0,1.7,0],46],
 [59,'people',[5,3.5,10],[2.8,2.8,8],[0,1.5,0],51],
 [65,'people',[-4,2.7,8],[-2.5,2.4,6.7],[0,1.7,0],46],
 [68,'recognition',[4.5,3,8],[3,2.6,6.7],[0,1.8,0],48,true],
 [72,'certificate',[1.4,4.6,4.5],[.5,4.2,3.7],[0,1.4,.8],45,true],
 [79,'peace',[3,2.6,7],[1.6,2.3,5.8],[0,1.8,0],45,true],
 [84,'testimony',[3.6,3.8,7],[2.4,3.2,5.9],[0,1.8,.4],45,true],
 [90,'lanterns',[5,3.3,10],[3,2.8,8],[0,1.6,0],50,true],
 [96,'peace',[2.6,2.5,6.8],[1.5,2.3,5.9],[0,1.8,0],45,true],
 [101,'lanterns',[-5,3.1,10],[-2.6,4.4,9],[0,1.4,-1],51,true],
];
export const SHOTS:Shot[]=defs.map((d,i)=>({id:i+1,a:i?Math.round(survivor.words[d[0]].start*30)-2:0,b:i===defs.length-1?TOTAL:Math.round(survivor.words[defs[i+1][0]].start*30)-2,place:d[1],pos:d[2],end:d[3],look:d[4],fov:d[5],light:d[6]?'golden':'day',dof:0}));
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const q=clamp(v);return q*q*(3-2*q)};
export const shotAt=(f:number)=>SHOTS.find(s=>f>=s.a&&f<s.b)??SHOTS[SHOTS.length-1];
export const CAMS=(s:Shot,f:number)=>{const q=clamp((f-s.a)/(s.b-s.a)),u=.4*q+.6*smooth(q);return {pos:s.pos.map((x,i)=>x+(s.end[i]-x)*u) as V3,look:s.look,fov:s.fov-q*1.2};};
export const DOF=(s:Shot)=>s.dof;
export const KICKS=[{f:300,amount:.009},{f:604,amount:.009}];
