import beer from './beer.json';
import survivor from './survivor.json';
import lake from './lake.json';
export type Slug = 'beer' | 'survivor' | 'lake';
export const DATA = {beer, survivor, lake};
export type V3 = [number,number,number];
export type Shot = {id:number; a:number; b:number; scene:string; pos:V3; look:V3; close?:boolean; golden?:boolean};
// Single source of truth: shot boundaries, camera staging, impacts and eye focus.
const definitions: Record<Slug, Array<[number,string,V3,V3,boolean?,boolean?]>> = {
 beer: [
  [0,'flood',[10,7,16],[0,1.4,-2]],
  [9,'vat',[10,6,18],[0,3,0]],
  [24,'hoop',[5,4.4,9],[0,3.8,0],true],
  [32,'burst',[9,5.8,15],[0,2.5,0]],
  [35,'wall',[7,4.6,15],[0,1.7,0]],
  [42,'flood',[2,3,14],[0,1.2,-3]],
  [49,'aftermath',[7,4,12],[0,1.5,-1]],
  [61,'cellar',[6,4.5,11],[0,-.7,0]],
  [63,'memorial',[4,3.5,10],[0,1.4,0],true,true],
  [66,'rescue',[5,3,11],[0,1.25,0],true,true],
  [78,'tax',[7,5,14],[0,2,0],false,true],
 ],
 survivor: [
  [0,'survivor',[3,2.8,8],[0,1.4,0],true],
  [5,'train',[10,5,16],[0,1.3,0]],
  [11,'japan',[9,5,16],[0,1.3,-1]],
  [25,'blast',[6,3.5,13],[0,1.4,0]],
  [29,'shelter',[3,2.8,8],[0,1.4,0],true],
  [37,'train',[9,4,15],[0,1.2,0]],
  [42,'home',[7,3.5,12],[0,1.3,0]],
  [49,'office',[6,3,11],[0,1.3,0]],
  [56,'shelter',[3,2.8,8],[0,1.4,0],true],
  [59,'people',[5,3.5,12],[0,1.3,0]],
  [68,'recognition',[5,3,10],[0,1.3,0],true,true],
  [79,'peace',[5,3,11],[0,1.4,0],true,true],
  [96,'lanterns',[7,4,14],[0,1.5,0],false,true],
 ],
 lake: [
  [0,'vortex',[13,16,20],[0,-.8,0]],
  [12,'rig',[11,7,18],[0,2,0]],
  [24,'mine',[10,6,19],[0,-1.8,0]],
  [34,'breach',[7,3,13],[0,-1.5,0]],
  [43,'bathtub',[6,5,10],[0,1,0],true],
  [51,'vortex',[10,13,16],[0,-.8,0]],
  [57,'sinking',[12,13,20],[0,-.8,0]],
  [67,'canal',[11,10,18],[0,0,0]],
  [79,'miners',[6,3.5,12],[0,1.3,0],true],
  [86,'return',[11,8,18],[0,0,0]],
  [97,'lostmine',[9,4,17],[0,-1.2,0],false,true],
 ]
};
export const SHOTS = (slug:Slug): Shot[] => definitions[slug].map((d,i,all)=>({id:i+1,a:i===0?0:Math.max(0,Math.round(DATA[slug].words[d[0]].start*30)-2),b:i===all.length-1?DATA[slug].frames:Math.round(DATA[slug].words[all[i+1][0]].start*30)-2,scene:d[1],pos:d[2],look:d[3],close:d[4],golden:d[5]}));
export const smooth = (x:number)=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u)};
export const shotAt = (slug:Slug,f:number)=>SHOTS(slug).find(s=>f>=s.a&&f<s.b) ?? SHOTS(slug)[0];
export const CAMS = (shot:Shot,f:number)=>{
 const u=(f-shot.a)/Math.max(1,shot.b-shot.a); const creep=1-.10*u;
 return {pos:shot.pos.map((p,i)=>shot.look[i]+(p-shot.look[i])*creep) as V3,look:shot.look};
};
export const KICKS = {beer:[13.25,14.4],survivor:[9.9,20.65],lake:[13.12,22.3]};
export const DOF = (s:Shot)=>s.close?8:0;
export const FOREGROUND = ['vat','rescue','home','miners'];
