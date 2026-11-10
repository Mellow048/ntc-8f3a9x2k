// A bridge short designed shot-by-shot for a portrait frame.
// Motion is a pure function of frame, so renders are deterministic.
import * as THREE from 'three';
import {Pen, bodyFront, HERO, ENGINEER, type Expr} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';

type V = [number,number,number];
type Stage = {root:THREE.Group; cam:V; target:V; fov:number; tick:(n:number)=>void};
type Shot = {start:number; kind:string; cam:V; target:V; fov:number};
const SHOTS:Shot[]=[
 {start:0,kind:'joint',cam:[1.6,7,4.7],target:[0,2.6,0],fov:40},
 {start:77,kind:'hero',cam:[1.6,4.3,6.1],target:[1,3.8,1.7],fov:38},
 {start:188,kind:'bridge',cam:[8.2,7.2,15],target:[0,2.9,0],fov:43},
 {start:270,kind:'warm',cam:[1.8,7,4.8],target:[0,2.6,0],fov:43},
 {start:325,kind:'cool',cam:[1.8,7,4.8],target:[0,2.6,0],fov:43},
 {start:380,kind:'traffic',cam:[2.3,5,11],target:[0,3,0],fov:43},
 {start:480,kind:'ruler',cam:[1.5,5.2,10],target:[0,2.2,0],fov:40},
 {start:585,kind:'pressure',cam:[1.5,5.2,9],target:[0,2.2,0],fov:40},
 {start:725,kind:'traffic',cam:[-2.5,5.3,10],target:[0,3,0],fov:43},
 {start:842,kind:'engineer',cam:[1.6,4.3,6.1],target:[1,3.8,1.7],fov:38},
 {start:950,kind:'joint',cam:[1.6,7,4.7],target:[0,2.8,0],fov:43},
 {start:1078,kind:'warm',cam:[1.9,7,4.9],target:[0,2.8,0],fov:43},
 {start:1199,kind:'cool',cam:[1.9,7,4.9],target:[0,2.8,0],fov:43},
 {start:1316,kind:'fingers',cam:[.8,7.2,4.7],target:[0,2.75,0],fov:43},
 {start:1400,kind:'seal',cam:[.8,7.2,4.7],target:[0,2.75,0],fov:43},
 {start:1470,kind:'bearing',cam:[4,5.5,9.5],target:[0,2.4,0],fov:42},
 {start:1565,kind:'traffic',cam:[1,5.2,10],target:[0,3,0],fov:43},
 {start:1665,kind:'hero',cam:[1.6,4.3,6.1],target:[1,3.8,1.7],fov:38},
 {start:1740,kind:'bridge',cam:[7.2,6.8,13.2],target:[0,2.8,0],fov:43},
];
const mats=new Map<string,THREE.MeshLambertMaterial>();
function material(color:string){if(!mats.has(color)) mats.set(color,new THREE.MeshLambertMaterial({color}));return mats.get(color)!;}
function mesh(p:THREE.Object3D,g:THREE.BufferGeometry,c:string,x=0,y=0,z=0){const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
function box(p:THREE.Object3D,w:number,h:number,d:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);}
function ball(p:THREE.Object3D,r:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.SphereGeometry(r,18,12),c,x,y,z);}
function cylinder(p:THREE.Object3D,r:number,h:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.CylinderGeometry(r,r,h,16),c,x,y,z);}
function grp(p:THREE.Object3D,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
function rod(p:THREE.Object3D,a:V,b:V,r:number,c:string){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=cylinder(p,r,delta.length(),c);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function actor(p:THREE.Object3D,x:number,y:number,z:number,which:'hero'|'engineer',scale:number,expr:Expr='grin'){
 const textures=Array.from({length:6},(_,i)=>{const canvas=document.createElement('canvas');canvas.width=600;canvas.height=1000;const cx=canvas.getContext('2d')!;
  bodyFront(new Pen(cx),which==='engineer'?ENGINEER(0):HERO,{mode:'stand',expr,seed:12,look:.1,light:-.8,headTilt:.04*Math.sin(i*Math.PI/3),wave:which==='engineer'?.3+.2*Math.sin(i*Math.PI/3):undefined,blink:i===4});
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;});
 const material=new THREE.MeshBasicMaterial({map:textures[0],transparent:true,alphaTest:.45,side:THREE.DoubleSide});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3*scale,2.16*scale),material);
 m.position.set(x,y+1.08*scale,z);m.layers.set(NOINK);p.add(m);
 return {mesh:m,animate:(f:number)=>{material.map=textures[Math.floor(f/9)%textures.length];m.rotation.z=.018*Math.sin(f/20);}};
}
function sky(p:THREE.Object3D,night=false){
 const skyMesh=new THREE.Mesh(new THREE.PlaneGeometry(150,75),new THREE.MeshBasicMaterial({color:night?'#34496f':'#b8dcf0',depthWrite:false}));skyMesh.position.set(0,22,-20);skyMesh.layers.set(NOINK);p.add(skyMesh);
 // distant city gives scale and a lived-in setting
 for(let i=0;i<19;i++){const x=(i-9)*1.7;const h=1.2+((i*17)%9)*.23;box(p,1.35,h,.7,i%3===0?'#a6bcc4':i%3===1?'#9fb8c2':'#b7c7c6',x,h/2-.1,-9);for(let k=0;k<3;k++)for(let y=.5;y<h-.2;y+=.48)box(p,.12,.18,.03,'#d6e2d9',x-.43+k*.39,y,-8.62);}
 box(p,45,.3,18,night?'#417b8f':'#68b6c4',0,-.32,0);
 for(let i=0;i<25;i++){const x=(i*2.13)%18-9,z=(i*1.47)%9-3.5;box(p,.4+(i%3)*.12,.025,.035,night?'#8db6c5':'#d3ede4',x,-.15,z);}
 for(let i=0;i<3;i++){const g=grp(p,-5+i*4,8+i%2,-10);for(let j=0;j<4;j++){const q=ball(g,.45+(j%2)*.15,night?'#9baec2':'#f7f6e7',j*.55,0,0);q.scale.set(1,.58,.6);}}
}
function car(p:THREE.Object3D,x:number,z:number,color:string,scale=.75){
 const g=grp(p,x,2.55,z);box(g,1.05,.30,.52,color,0,.25,0);box(g,.62,.30,.5,color,-.02,.52,0);box(g,.43,.18,.52,'#b9deea',-.04,.53,0);box(g,.08,.05,.51,'#fce9b6',.49,.27,0);
 for(const dx of [-.34,.34]) for(const dz of [-.27,.27]){const w=cylinder(g,.14,.08,'#303140',dx,.14,dz);w.rotation.x=Math.PI/2;}
 g.scale.setScalar(scale);return g;
}
function road(g:THREE.Group,opts:{hero?:boolean;engineer?:boolean;night?:boolean;traffic?:boolean}){
 sky(g,opts.night);
 // Two independently-supported spans and a visible expansion gap.
 for(const side of [-1,1]){
  const deck=grp(g);box(deck,3.85,.42,3.1,'#687786',side*1.98,2.25,0);box(deck,3.85,.08,3.1,'#586674',side*1.98,2.50,0);
  box(deck,3.85,.12,.18,'#d5d2b9',side*1.98,2.57,1.46);box(deck,3.85,.12,.18,'#d5d2b9',side*1.98,2.57,-1.46);
  for(let j=0;j<5;j++)box(deck,.38,.025,.08,'#f9e4a5',side*(.45+j*.68),2.56,0);
 }
 for(const x of [-3.15,3.15]){
  box(g,.52,4.6,1.2,'#ca6f56',x,2.15,0);box(g,.74,.23,1.45,'#f1bd83',x,4.45,0);
  box(g,.64,.2,1.4,'#a85344',x,.36,0);
  for(const z of [-1.3,1.3]){rod(g,[x,4.35,z],[x,2.68,z],.035,'#3d5869');}
 }
 for(const z of [-1.3,1.3]){
  rod(g,[-3.15,4.35,z],[0,3.05,z],.065,'#3e5867');rod(g,[0,3.05,z],[3.15,4.35,z],.065,'#3e5867');
  rod(g,[-3.8,2.9,z],[3.8,2.9,z],.035,'#cbd8d0');
  for(let x=-3;x<=3;x+=.5)rod(g,[x,2.65,z],[x,2.9,z],.023,'#cbd8d0');
 }
 // Silver finger plate at road level.
 for(let i=0;i<7;i++){const z=-1.25+i*.39;box(g,.32,.06,.18,'#e4bb80',-.08,2.6,z);box(g,.32,.06,.18,'#ead3a3',.08,2.6,z+.19);}
 const cars=[car(g,-2,0,'#da5847'),car(g,2,-.8,'#efb54d',.62)];
 const person=opts.hero?actor(g,1.0,2.58,1.7,opts.engineer?'engineer':'hero',1.18,opts.engineer?'grin':'nervous'):undefined;
 return (frame:number)=>{const t=frame/30;cars[0].position.x=3*Math.sin(t*.32);cars[1].position.x=3*Math.sin(t*.25+2.4);if(person)person.animate(frame);};
}
function closeup(g:THREE.Group,kind:string){
 sky(g,kind==='cool');
 const l=grp(g),r=grp(g);const asphalt='#596673',edge='#a8abb0';
 box(l,3.15,.55,6.2,edge,-1.7,2.2,0);box(r,3.15,.55,6.2,edge,1.7,2.2,0);
 box(l,3.15,.10,6.2,asphalt,-1.7,2.52,0);box(r,3.15,.10,6.2,asphalt,1.7,2.52,0);
 for(const side of [-1,1]){const span=side<0?l:r;box(span,.6,.025,.12,'#f5e5ad',side*1.15,2.58,-.6);box(span,.6,.025,.12,'#f5e5ad',side*1.15,2.58,.6);}
 if(kind==='seal'){
  box(g,.5,.08,6.1,'#303849',0,2.54,0);for(let z=-3.0;z<3.1;z+=.25)box(g,.46,.035,.035,'#68787d',0,2.59,z);
 }else{
  for(let i=0;i<16;i++){let z=-2.9+i*.38;box(l,.50,.12,.17,'#dbba81',-.10,2.62,z);box(r,.50,.12,.17,'#e9d2a7',.10,2.62,z+.19);}
  for(const x of [-.48,.48])for(let z=-2.9;z<=3;z+=.38){const b=cylinder(g,.035,.03,'#566275',x,2.71,z);}
 }
 // Roadside handrail and upright: grounds the macro in the real bridge.
 for(const z of [-3.12,3.12]){rod(g,[-3,2.87,z],[3,2.87,z],.04,'#dce0d6');for(let x=-2.5;x<3;x+=.65)rod(g,[x,2.6,z],[x,2.87,z],.025,'#dce0d6');}
 if(kind==='warm'||kind==='cool'){
  const s=ball(g,.43,kind==='warm'?'#ffc65c':'#dae9f5',2.5,5.5,-4);if(kind==='warm')for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,[2.5+Math.cos(a)*.6,5.5+Math.sin(a)*.6,-4],[2.5+Math.cos(a)*.83,5.5+Math.sin(a)*.83,-4],.035,'#ffd078');}
 }
 return (f:number)=>{const u=Math.min(1,f/105);const shift=kind==='warm'?.16*u:kind==='cool'?-.16*u:.035*Math.sin(f/35);l.position.x=shift;r.position.x=-shift;};
}
function ruler(g:THREE.Group,pressure:boolean){
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(40,30),new THREE.MeshBasicMaterial({color:'#d9e7e6'}));bg.position.set(0,8,-9);bg.layers.set(NOINK);g.add(bg);
 box(g,12,.45,5,'#cc9f74',0,.2,0);for(const x of [-3.35,3.35]){box(g,.5,3.4,1.4,'#a65d50',x,1.95,0);for(let y=.65;y<3.5;y+=.55)box(g,.52,.04,1.42,'#d28f73',x,y,0);}
 const parts:THREE.Mesh[]=[];for(let i=0;i<25;i++){const x=-2.95+i*.245;const seg=box(g,.248,.24,.58,'#ebbb56',x,2,0);parts.push(seg);box(seg,.025,.012,.14,'#6d503d',0,.13,.13);}
 actor(g,1.65,.44,1.65,'engineer',1.1,pressure?'shock':'grin');
 const heat=ball(g,.42,'#f8c65d',-2.4,4.3,-1);
 return (f:number)=>{const u=pressure?Math.min(1,f/70):0;parts.forEach((p,i)=>{p.position.y=2+u*.55*Math.sin(Math.PI*i/24);p.rotation.z=u*.22*Math.cos(Math.PI*i/24);});heat.scale.setScalar(1+.08*Math.sin(f/12));};
}
function bearing(g:THREE.Group){
 sky(g);const top=grp(g);box(top,5,.45,2.8,'#84929b',0,3.4,0);box(top,5,.12,2.8,'#5c6975',0,3.68,0);
 box(top,2,.18,1.6,'#d5dad5',0,3.07,0);box(g,2,.18,1.6,'#d5dad5',0,1.5,0);
 for(let i=0;i<6;i++)box(top,1.7,.2,1.4,i%2?'#9eaeb4':'#455461',0,1.7+i*.22,0);
 box(g,2.3,1,1.8,'#d48c6b',0,.9,0);for(const x of [-.8,.8]){cylinder(g,.08,.12,'#55606c',x,1.65,.55);}
 actor(g,2.5,.45,1.8,'engineer',.85,'grin');
 return (f:number)=>{top.position.x=.2*Math.sin(f/28);};
}
export class BridgeWorld {
 root=new THREE.Group(); stages:Stage[];
 constructor(){
  this.stages=SHOTS.map(s=>{const root=grp(this.root);let tick:(n:number)=>void;
   if(['joint','warm','cool','fingers','seal'].includes(s.kind))tick=closeup(root,s.kind);
   else if(s.kind==='ruler'||s.kind==='pressure')tick=ruler(root,s.kind==='pressure');
   else if(s.kind==='bearing')tick=bearing(root);
   else tick=road(root,{hero:s.kind==='hero'||s.kind==='engineer',engineer:s.kind==='engineer',traffic:s.kind==='traffic'});
   root.visible=false;return {root,cam:s.cam,target:s.target,fov:s.fov,tick};
  });
  this.root.add(new THREE.HemisphereLight('#fff6e9','#9aa9c1',1.7));const light=new THREE.DirectionalLight('#fff1d4',2);light.position.set(-8,15,12);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-12,right:12,top:12,bottom:-12});light.shadow.bias=-.0002;this.root.add(light);
 }
 update(frame:number,camera:THREE.PerspectiveCamera){
  let i=0;while(i+1<SHOTS.length&&frame>=SHOTS[i+1].start)i++;
  this.stages.forEach((s,j)=>s.root.visible=i===j);const s=this.stages[i];const local=frame-SHOTS[i].start;s.tick(local);
  const drift=Math.min(.32,local*.0018);camera.position.set(s.cam[0]+.06*Math.sin(frame/80),s.cam[1]+.04*Math.sin(frame/100),s.cam[2]-drift);camera.lookAt(...s.target);camera.fov=s.fov;camera.near=.1;camera.far=200;camera.updateProjectionMatrix();camera.layers.enable(NOINK);
 }
}
