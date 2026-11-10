// Original procedural engineering dioramas for the five-short series.
// All scene state is a pure function of the Remotion frame; no remote assets.
import * as THREE from 'three';
import { Pen, bodyFront, HERO, ENGINEER, townsfolk } from '../pendulum/toon';
import { NOINK } from '../pendulum/ink';

export type Beat = {frame:number; scene:string; phrase:string};
type Tick = (f:number, local:number)=>void;
type Stage = { root:THREE.Group; tick:Tick; camera:[number,number,number]; look:[number,number,number]; fov:number };
const M = new Map<string, THREE.Material>();
const mat = (c:string, rough=1) => {
  const k=c+rough;
  if(!M.has(k)) M.set(k,new THREE.MeshLambertMaterial({color:c}));
  return M.get(k)!;
};
const add = (p:THREE.Object3D, geo:THREE.BufferGeometry, c:string, x:number,y:number,z:number) => {
  const o = new THREE.Mesh(geo, mat(c)); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; p.add(o); return o;
};
const box = (p:THREE.Object3D,w:number,h:number,d:number,c:string,x:number,y:number,z:number) => add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
const sphere = (p:THREE.Object3D,r:number,c:string,x:number,y:number,z:number) => add(p,new THREE.SphereGeometry(r,20,14),c,x,y,z);
const cyl = (p:THREE.Object3D,r:number,h:number,c:string,x:number,y:number,z:number) => add(p,new THREE.CylinderGeometry(r,r,h,20),c,x,y,z);
const cone = (p:THREE.Object3D,r:number,h:number,c:string,x:number,y:number,z:number) => add(p,new THREE.ConeGeometry(r,h,24),c,x,y,z);
const link = (p:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,c:string) => {
  const d=b.clone().sub(a); const o=cyl(p,r,d.length(),c,0,0,0); o.position.copy(a).add(b).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); return o;
};
const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const group=(p:THREE.Object3D,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
const palette={ink:'#33243b', slate:'#46566e', pale:'#f5e8cc', cream:'#f2d8ae', teal:'#2e93a4', sea:'#349fb4', red:'#d94b43', gold:'#e9b745', dark:'#48516a', green:'#6ca954'};

function person(parent:THREE.Object3D,x:number,y:number,z:number,type:'hero'|'engineer'|'folk'='hero',scale=1,expr:'smile'|'shock'|'nervous'='smile') {
  const canvas=document.createElement('canvas');canvas.width=600;canvas.height=1000;
  const ctx=canvas.getContext('2d')!;
  const o=type==='engineer'?ENGINEER(0):type==='folk'?townsfolk(2):HERO;
  bodyFront(new Pen(ctx),o,{mode:'stand',expr,seed:12,look:0.15,light:-.8});
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.45,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.3*scale,2.16*scale),m);
  mesh.position.set(x,y+1.08*scale,z);mesh.layers.set(NOINK);parent.add(mesh);
  return mesh;
}
function cloud(p:THREE.Object3D,x:number,y:number,z:number,s=1) {
  const g=group(p,x,y,z); for(const [dx,dy,r] of [[-.8,0,.55],[-.25,.18,.7],[.45,.1,.6],[1,0,.48]]) {
    const q=sphere(g,r,'#f8f7ec',dx,dy,0);q.scale.set(1,.65,.6);
  }g.scale.setScalar(s);return g;
}
function sun(p:THREE.Object3D,x=3.6,y=8,z=-5){const s=sphere(p,.6,'#ffdc68',x,y,z);return s;}
function tree(p:THREE.Object3D,x:number,z:number,s=1){const g=group(p,x,0,z);cyl(g,.13,1.1,'#91633d',0,.55,0);sphere(g,.7,'#6cae63',0,1.45,0);sphere(g,.48,'#8ec774',.4,1.5,0);g.scale.setScalar(s);}
function car(p:THREE.Object3D,x:number,y:number,z:number,c='#e8654f',scale=1){
 const g=group(p,x,y,z);box(g,1.15,.35,.56,c,0,.25,0);box(g,.62,.32,.5,c,-.05,.55,0);
 box(g,.48,.20,.515,'#97d3e2',-.05,.56,0);for(const dx of [-.36,.36]) for(const dz of [-.31,.31]){const q=cyl(g,.16,.08,'#34323c',dx,.15,dz);q.rotation.x=Math.PI/2;}
 g.scale.setScalar(scale);return g;
}
function plane(p:THREE.Object3D,x:number,y:number,z:number,s=1){
 const g=group(p,x,y,z);const body=sphere(g,.42,'#f6f6ef',0,0,0);body.scale.set(3.5,.75,.85);
 box(g,2.8,.1,.72,'#dceef3',0,0,0); const wing=box(g,1.1,.10,3.2,'#ecf2ef',-.1,-.04,0);wing.rotation.y=-.23;
 const tail=box(g,.55,.7,.1,'#db534b',-1.1,.38,0);tail.rotation.z=-.3;
 for(const z0 of [-.8,.8]){const e=cyl(g,.15,.6,'#a5bbc7',.1,-.18,z0);e.rotation.z=Math.PI/2;}
 g.scale.setScalar(s);return g;
}
function sceneBase(g:THREE.Group, mode:'day'|'water'|'night'|'interior'='day') {
 const sky=mode==='night'?'#737aaf':mode==='interior'?'#d6e4ed':'#bce5f2';
 // The big background card has no depth and is always behind every prop.
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(200,100),new THREE.MeshBasicMaterial({color:sky,depthWrite:false}));
 bg.position.set(0,20,-20);bg.layers.set(NOINK);g.add(bg);
 if(mode==='day'||mode==='water'){sun(g);cloud(g,-3.5,8,-9,.7);cloud(g,3,9,-10,.6);}
 const base=box(g,32,.4,24,mode==='water'?'#49a7b7':mode==='interior'?'#d8b99a':'#a8c77d',0,-.4,0);base.receiveShadow=true;
}
function stage(root:THREE.Group,build:(g:THREE.Group)=>Tick, camera:[number,number,number]=[9,8,20],look:[number,number,number]=[0,3,0],fov=40):Stage {
 const g=group(root);const tick=build(g);return {root:g,tick,camera,look,fov};
}

// BRIDGE: deck split at the expansion joint, interlocking fingers, sliding bearings.
function bridge(g:THREE.Group, mode:string):Tick {
 sceneBase(g,mode==='cold'?'night':'water');
 const deck=group(g); const left=group(deck);const right=group(deck);
 box(left,4.1,.42,2.0,'#758590',-2.1,3,0);box(right,4.1,.42,2.0,'#758590',2.1,3,0);
 for(const x of [-3.2,3.2]){
  box(g,.45,5,1.8,'#ca7557',x,2.4,0);
  box(g,.75,.4,2.1,'#e7bc83',x,4.95,0);
  for(let i=-3;i<=3;i++){let z=i*.3;link(g,v(x,4.9,z),v(x,3.25,z),.035,'#536b77');}
 }
 for(const z of [-.85,.85]){link(g,v(-4.1,3.35,z),v(4.1,3.35,z),.06,'#556875');}
 for(let i=0;i<6;i++){let z=-.8+i*.3;box(left,.32,.08,.13,'#d8dbd3',-.08,3.25,z);box(right,.32,.08,.13,'#d8dbd3',.08,3.25,z+.15);}
 const c=car(g,-2.8,3.23,-.15,'#d86750',.72);const engineer=person(g,-2.2,3.23,1.2,'engineer',.85);
 const indicator=group(g,0,5.8,0);
 if(mode==='heat'){sun(indicator,0,0,0);}
 if(mode==='cold'){for(const [x,y] of [[-1,0],[0,.6],[1,0],[.5,-.8]] as const){const f=sphere(indicator,.12,'#f3fcff',x,y,0);f.scale.set(1,1,.5);}}
 if(mode==='joint'||mode==='bearing') {
   // Move the wide set out of view and build a clear enlarged insert instead.
   deck.visible=false; g.children.forEach(o=>{if(o===deck)return;});
   const cut=group(g,0,.4,4);
   box(cut,3.3,.6,2.3,'#87949c',-1.8,3,0);box(cut,3.3,.6,2.3,'#87949c',1.8,3,0);
   for(let i=0;i<5;i++){const z=-.8+i*.38;box(cut,.8,.15,.19,'#f2d18a',-.22,3.37,z);box(cut,.8,.15,.19,'#f2d18a',.22,3.37,z+.18);}
   if(mode==='bearing'){for(const x of [-2,2]){box(cut,1.3,.17,1.3,'#414a58',x,2.45,0);box(cut,1.4,.35,1.4,'#eea855',x,2.05,0);box(cut,1.4,.17,1.4,'#414a58',x,1.75,0);}}
 }
 return (f)=>{const t=f/30;const k=mode==='cold'?-.14:.14;left.position.x=-k*(.5+.5*Math.sin(t*.7));right.position.x=k*(.5+.5*Math.sin(t*.7));c.position.x=-3.2+((t*.65)%6.4); engineer.rotation.z=.025*Math.sin(t*2);};
}
function ruler(g:THREE.Group):Tick {
 sceneBase(g,'interior'); box(g,.5,4,2,'#b98262',-3.8,2,0);box(g,.5,4,2,'#b98262',3.8,2,0);
 const r=box(g,6.5,.42,.75,'#f2c557',0,2.5,0); for(let i=-12;i<=12;i++)box(g,.035,i%5===0?.24:.12,.02,'#6e4d3a',i*.25,2.6,.385);
 person(g,-2.8,0,2,'engineer',.8,'shock');sun(g,2.8,7,0);
 return f=>{r.scale.x=1+.035*Math.sin(f/34);};
}

// CITY HALL: layered rubber bearings under a domed historic structure.
function cityhall(g:THREE.Group, mode:string):Tick {
 sceneBase(g,'day');const foundation=group(g,0,0,0);box(foundation,9,.45,4.2,'#69727d',0,.15,0);
 const top=group(g,0,0,0);box(top,8,2.9,3,'#efdfbd',0,3.15,0);box(top,8.4,.35,3.4,'#ddd0b1',0,4.8,0);
 box(top,3.5,1.1,3.3,'#eedcb9',0,5.45,0);
 const dome=sphere(top,1.55,'#caaf7e',0,6.1,0);dome.scale.set(1,.74,1);cyl(top,.18,.75,'#b58a51',0,7.35,0);sphere(top,.18,'#e5c25d',0,7.75,0);
 for(let i=-3;i<=3;i++){
  box(top,.55,1.5,.16,'#6b8fa1',i*1.0,3.1,1.57);
  cyl(top,.14,2.8,'#f2e8ce',i*1.1,3.1,1.8);
 }
 for(let i=-3;i<=3;i++){
  const b=group(g,i*1.15,.6,0);cyl(b,.43,.18,'#4a5262',0,.02,0);cyl(b,.38,.20,'#9aacc2',0,.2,0);cyl(b,.43,.17,'#4a5262',0,.38,0);
 }
 const hero=person(g,-1.9,.2,4.5,'hero',1.15,mode==='quake'?'shock':'smile');
 tree(g,-5,-1,.8);tree(g,5,-1,.8);
 if(mode==='moat'){box(g,.14,.18,4,'#2a3342',-4.4,.44,0);box(g,.14,.18,4,'#2a3342',4.4,.44,0);}
 return f=>{const t=f/30;const shake=mode==='quake'?.22*Math.sin(t*15):.04*Math.sin(t*1.7);foundation.position.x=shake;top.position.x=shake*.3;hero.rotation.z=.03*Math.sin(t*2);};
}
function bearing(g:THREE.Group):Tick {
 sceneBase(g,'interior');box(g,8,.7,3,'#a9a8a2',0,.35,0);box(g,8,.55,3,'#ded0b4',0,4.3,0);
 const b=group(g);for(let i=0;i<8;i++)cyl(b,1.55,.25,i%2?'#a7b4c0':'#3c4558',0,1.15+i*.25,0);
 box(g,3.5,.25,2.8,'#555c68',0,.8,0);box(g,3.5,.25,2.8,'#555c68',0,3.25,0);
 person(g,-3,.7,2,'engineer',.8);return f=>{b.rotation.z=.045*Math.sin(f/17);b.position.x=.1*Math.sin(f/17);};
}
function jelly(g:THREE.Group):Tick {
 sceneBase(g,'interior');box(g,8,.5,4,'#bf8e5b',0,.3,0);const tray=group(g,0,2,0);box(tray,6,.18,2.5,'#edcb81',0,0,0);
 const bowl=cyl(tray,1.5,.55,'#e8e9e2',0,.36,0);const j=sphere(tray,1.15,'#e7677d',0,.8,0);j.scale.set(1,.7,1);
 person(g,-3.3,.55,1.8,'hero',.8,'shock');return f=>{tray.position.x=.32*Math.sin(f/12);j.scale.x=1+.12*Math.sin(f/9);j.scale.y=.7-.08*Math.sin(f/9);};
}

// KANSAI: sectional island, soft clay, runway and airport facilities.
function airport(g:THREE.Group,mode:string):Tick {
 sceneBase(g,'water');const island=group(g,0,0,0);
 box(island,8,1.1,3.8,'#cba46e',0,1,0);box(island,8,.18,3.8,'#8aa878',0,1.6,0);box(island,7.5,.11,1.1,'#555e68',0,1.73,.3);
 for(let x=-3.3;x<3.4;x+=.8)box(island,.45,.025,.06,'#faf1ce',x,1.8,.3);
 const terminal=group(island,0,0,-.7);box(terminal,5,.85,.8,'#9cc4cd',0,2.15,0);box(terminal,5.4,.14,1,'#e8eee8',0,2.63,0);
 for(let x=-2.2;x<=2.2;x+=.55)box(terminal,.05,.85,.06,'#6d8997',x,2.16,.43);
 const a=plane(island,-1.8,2.7,.45,.9);
 const worker=person(island,2.8,1.8,1.9,'engineer',.75);
 // bridge to shore on the right, and gentle wave crests
 box(g,3,.2,.8,'#b8b5a5',5,1.75,0);for(let x=3.7;x<6.6;x+=.8)box(g,.13,1.6,.13,'#e0d5b6',x,.8,0);
 for(let x=-5;x<5;x+=1.6){const q=box(g,.7,.035,.06,'#b4e5df',x,.1,3);q.rotation.y=.2;}
 if(mode==='clay'||mode==='sink'){box(g,8,1.35,3.7,'#a56e62',0,.0,.01);for(let x=-3;x<=3;x+=1){box(g,.06,1,.06,'#e8d1ab',x,-.05,2);}}
 if(mode==='build'){const boat=group(g,-3,.5,3);box(boat,1.8,.35,.7,'#b56546',0,0,0);box(boat,.6,.35,.6,'#f4e8d4',-.4,.32,0);}
 if(mode==='seawall'){for(const x of [-4,4])box(g,.35,2.1,4.1,'#9da9a7',x,1.1,0);}
 // Oscillate continuously instead of wrapping the aircraft across the screen.
 return f=>{const t=f/30;island.position.y=(mode==='sink'||mode==='clay')?-.35*(.5+.5*Math.sin(t*.5)):0;a.position.x=2.1*Math.sin(t*.30);worker.rotation.z=.025*Math.sin(t*2);};
}
function jack(g:THREE.Group):Tick {
 sceneBase(g,'interior');box(g,8,.4,3,'#777782',0,.15,0);box(g,8,.65,3,'#e1d4b7',0,4.3,0);
 const piston=group(g);box(piston,2,1.2,1.5,'#d95042',0,1.4,0);cyl(piston,.42,1.5,'#bfc8ca',0,2.65,0);box(piston,2.4,.22,1.8,'#626b78',0,3.4,0);
 for(let i=0;i<3;i++)box(g,1.9,.12,1.6,i%2?'#9ba8ae':'#e8bf65',0,3.55+i*.13,0);
 person(g,2.7,.3,1.8,'engineer',.8);return f=>{piston.position.y=.12*Math.sin(f/22);};
}

// CHANNEL TUNNEL: the sea is above a chalk seabed; three separate bores.
function train(p:THREE.Object3D,x:number,y:number,z:number,c='#e7c95a',s=1){
 const g=group(p,x,y,z);box(g,3.1,.85,.95,c,0,.5,0);box(g,2.7,.35,1,'#8ac8d7',0,.75,0);
 for(let i=-2;i<=2;i++)box(g,.07,.35,.04,'#4c6471',i*.48,.75,.53);
 for(const dx of [-1,.95]){const q=cyl(g,.18,.95,'#393b47',dx,.15,0);q.rotation.x=Math.PI/2;}
 g.scale.setScalar(s);return g;
}
function fish(p:THREE.Object3D,x:number,y:number,z:number,c='#e99259'){
 const g=group(p,x,y,z);const body=sphere(g,.25,c,0,0,0);body.scale.set(1.5,.8,.45);const tail=cone(g,.22,.4,c,-.45,0,0);tail.rotation.z=-Math.PI/2;sphere(g,.035,'#292b38',.22,.05,.13);return g;
}
function tunnel(g:THREE.Group,mode:string):Tick {
 sceneBase(g,'water');
 // Water occupies the upper third and chalk beneath; tunnels remain solid, not glass underwater.
 box(g,10,3.4,3,'#6fb9cb',0,6.6,-1);box(g,10,4.7,3,'#dfc698',0,2.55,-1);
 for(let i=0;i<5;i++)box(g,9.8,.035,.02,'#bfaa84',0,.8+i*.8,.53);
 const fishes=[fish(g,-2.5,7.2,.8),fish(g,1.4,6.1,.8,'#d4bf5d'),fish(g,3,7.4,.8,'#a2ced1')];
 let t:THREE.Group;
 if(mode==='three'||mode==='service'){
   for(const [x,r] of [[-3,1.25],[0,.85],[3,1.25]] as const){const q=cyl(g,r,.2,'#525e6c',x,2.4,1);q.rotation.x=Math.PI/2;const inner=cyl(g,r*.78,.23,'#aebbc1',x,2.4,1.12);inner.rotation.x=Math.PI/2;}
   t=train(g,-3,1.55,1.5,'#e9c04c',.55);train(g,3,1.55,1.5,'#d95f4e',.55);
 }else{
   const q=cyl(g,1.55,.22,'#5e6874',0,2.5,1);q.rotation.x=Math.PI/2;const inner=cyl(g,1.25,.25,'#a5b6be',0,2.5,1.12);inner.rotation.x=Math.PI/2;
   t=train(g,0,1.45,1.5,'#e9c04c',.8);
 }
 if(mode==='drill'){
  const head=cyl(g,1.38,.22,'#eaa844',0,2.5,1.6);head.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(g,.36,.17,.2,'#61707d',Math.cos(a)*.9,2.5+Math.sin(a)*.9,1.8);}
  t.visible=false;
 }
 if(mode==='car'){car(g,0,2.2,2,'#df6b54',.7);}
 person(g,-1.9,0,2.5,'engineer',.85);
 return f=>{const tm=f/30;t.position.x+=0;fishes.forEach((fish,i)=>{fish.position.x=[-2.5,1.4,3][i]+.3*Math.sin(tm+i);});};
}

// HSBC's raised tower, external masts, trusses and sheltered plaza.
function tower(g:THREE.Group,mode:string):Tick {
 sceneBase(g,'day');const tower=group(g,0,0,0);
 for(const x of [-3.4,3.4]){box(tower,.48,9,2,'#768592',x,4.5,0);for(let y=1;y<9;y+=1){box(tower,.7,.16,2.3,'#d5d8d0',x,y,0);}}
 box(tower,6.5,.4,3,'#9aa9af',0,3,0);
 for(let i=0;i<6;i++){
  let y=3.65+i*.82;box(tower,6,.64,2.7,i%2?'#83b6c4':'#9bc7cc',0,y,0);
  box(tower,6.3,.12,2.85,'#b5c4c6',0,y+.34,0);
  for(let x=-2.5;x<=2.5;x+=.7)box(tower,.05,.58,.06,'#5c7d8d',x,y,1.38);
 }
 for(const y of [3.35,5.8,8.2]){for(const z of [-1.1,1.5]){link(tower,v(-3.2,y,z),v(0,y+.72,z),.09,'#627481');link(tower,v(0,y+.72,z),v(3.2,y,z),.09,'#627481');}}
 // Escalators leading from open plaza to raised entrance.
 for(const x of [-.55,.55]){const e=box(tower,.5,3.4,.32,'#8d999d',x,1.7,1.6);e.rotation.x=-.72;}
 const people=[person(g,-2.1,0,3.1,'folk',.9),person(g,1.5,0,3.5,'hero',1.0),person(g,.2,0,2.7,'folk',.75)];
 tree(g,-5,1,.8);tree(g,5,1,.8);
 return f=>{people.forEach((p,i)=>{p.rotation.z=.015*Math.sin(f/17+i);});};
}
function atrium(g:THREE.Group,mode:string):Tick {
 sceneBase(g,'interior');box(g,8,.4,4,'#c6b39c',0,0,0);
 for(const x of [-3.5,3.5])box(g,.35,8,2,'#6d818c',x,4,0);
 for(let y=1;y<8;y+=1.1)box(g,7,.12,.18,'#94adb5',0,y,-1.1);
 for(let x=-3;x<3.1;x+=1)box(g,.06,8,.1,'#acc4c8',x,4,-1.05);
 const escal=box(g,.8,5,.45,'#a4acae',0,2.7,1);escal.rotation.x=-.72;
 for(let i=0;i<9;i++)box(g,.85,.07,.5,'#e5e8dc',0,.9+i*.36,2-i*.28);
 if(mode==='mirror'){
  const panel=box(g,2.6,.1,1.2,'#eef7f3',0,7,0);panel.rotation.z=.3;
  const beam=new THREE.Mesh(new THREE.ConeGeometry(1.1,5,4,1,true),new THREE.MeshBasicMaterial({color:'#fff2a8',transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(0,4.4,0);beam.layers.set(NOINK);g.add(beam);
 }
 person(g,-2,.2,2,'hero',.85);return f=>{escal.position.y=2.7+.035*Math.sin(f/22);};
}

export class World {
 root=new THREE.Group();
 stages:Stage[];
 beats:Beat[];
 constructor(slug:string,beats:Beat[]){
  this.beats=beats;
  this.stages=beats.map((b,i)=>{
   // Each idea gets its own framing, rather than showing the same distant
   // diorama for a whole minute. In particular, inserts fill the portrait frame.
   let cam:[number,number,number]=[9,8,20], look:[number,number,number]=[0,3,0], fov=40;
   if(slug==='breathing-bridge') {
    if(b.scene==='joint'||b.scene==='bearing'){cam=[6,6.8,11.5];look=[0,2.5,2.6];fov=43;}
    else if(b.scene==='ruler'){cam=[5,5.8,12.5];look=[0,2.4,0];fov=43;}
    else if(i===0){cam=[9,7.8,15.8];look=[0,2.9,0];fov=43;}
   }
   if(slug==='spring-building') {
    if(b.scene==='bearing'||b.scene==='jelly'){cam=[5.5,6,12.5];look=[0,2.2,0];fov=43;}
    else {cam=[9,7.5,18];look=[0,3.6,0];fov=42;}
   }
   if(slug==='ocean-airport') {
    if(b.scene==='jack'){cam=[6,6.2,12.5];look=[0,2.1,0];fov=43;}
    else {cam=[9,8.5,15.5];look=[0,2.2,0];fov=43;}
   }
   if(slug==='channel-tunnel') {
    if(b.scene==='three'||b.scene==='service'){cam=[6,7,18];look=[0,3.2,0];fov=42;}
    else {cam=[5.5,6.5,13.5];look=[0,3.4,0];fov=45;}
   }
   if(slug==='sky-plaza') {
    if(b.scene==='plaza'){cam=[5.2,5,12];look=[0,2.5,0];fov=45;}
    else if(b.scene==='truss'){cam=[7,8.2,15];look=[0,5.2,0];fov=42;}
    else if(b.scene==='atrium'||b.scene==='mirror'){cam=[5,7,14];look=[0,3.5,0];fov=43;}
   }
   return stage(this.root,g=>{
    if(slug==='breathing-bridge') return b.scene==='ruler'?ruler(g):bridge(g,b.scene);
    if(slug==='spring-building') return b.scene==='bearing'?bearing(g):b.scene==='jelly'?jelly(g):cityhall(g,b.scene);
    if(slug==='ocean-airport') return b.scene==='jack'?jack(g):airport(g,b.scene);
    if(slug==='channel-tunnel') return tunnel(g,b.scene);
    return b.scene==='atrium'||b.scene==='mirror'?atrium(g,b.scene):tower(g,b.scene);
   },cam,look,fov);
  });
  this.stages.forEach(s=>s.root.visible=false);
  const hemi=new THREE.HemisphereLight('#fff7e7','#8f94a3',2.0);this.root.add(hemi);
  const sunLight=new THREE.DirectionalLight('#fff6dd',2.2);sunLight.position.set(-8,18,12);sunLight.castShadow=true;sunLight.shadow.mapSize.set(1024,1024);sunLight.shadow.camera.left=-14;sunLight.shadow.camera.right=14;sunLight.shadow.camera.top=14;sunLight.shadow.camera.bottom=-14;sunLight.shadow.bias=-.0002;this.root.add(sunLight);
 }
 update(frame:number,camera:THREE.PerspectiveCamera){
  let index=0;while(index+1<this.beats.length&&frame>=this.beats[index+1].frame)index++;
  this.stages.forEach((s,i)=>{s.root.visible=i===index;});const s=this.stages[index], local=frame-this.beats[index].frame;
  s.tick(frame,local);
  const t=frame/30;const creep=Math.min(.8,local*.003);
  camera.position.set(s.camera[0]+.18*Math.sin(t*.38),s.camera[1]+.08*Math.sin(t*.55),s.camera[2]-creep);
  camera.lookAt(...s.look);camera.fov=s.fov;camera.near=.1;camera.far=300;camera.updateProjectionMatrix();camera.layers.enable(NOINK);
 }
}
