// A bridge short designed shot-by-shot for a portrait frame.
// Motion is a pure function of frame, so renders are deterministic.
import * as THREE from 'three';
import {Pen, bodyFront, HERO, ENGINEER, type Expr} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import type {BridgeAssets} from './assets';

type V = [number,number,number];
type Stage = {root:THREE.Group; cam:V; target:V; fov:number; tick:(n:number)=>void};
type Shot = {start:number; kind:string; cam:V; target:V; fov:number};
const SHOTS:Shot[]=[
 {start:0,kind:'joint',cam:[1.6,7,4.7],target:[0,2.6,0],fov:40},
 {start:77,kind:'hero',cam:[1.6,4.3,6.1],target:[1,3.8,1.7],fov:38},
 {start:188,kind:'bridge',cam:[8.2,7.2,15],target:[0,2.9,0],fov:43},
 {start:270,kind:'warm',cam:[3.7,6.5,4.1],target:[0,2.6,0],fov:43},
 {start:325,kind:'cool',cam:[-3.7,6.5,4.1],target:[0,2.6,0],fov:43},
 {start:380,kind:'traffic',cam:[2.3,5,11],target:[0,3,0],fov:43},
 {start:480,kind:'ruler',cam:[1.5,5.2,10],target:[0,2.2,0],fov:40},
 {start:585,kind:'pressure',cam:[1.5,5.2,9],target:[0,2.2,0],fov:40},
 {start:725,kind:'traffic',cam:[-2.5,5.3,10],target:[0,3,0],fov:43},
 {start:842,kind:'engineer',cam:[1.6,4.3,6.1],target:[1,3.8,1.7],fov:38},
 {start:950,kind:'joint',cam:[1.6,7,4.7],target:[0,2.8,0],fov:43},
 {start:1078,kind:'warm',cam:[3.7,6.5,4.1],target:[0,2.8,0],fov:43},
 {start:1199,kind:'cool',cam:[-3.7,6.5,4.1],target:[0,2.8,0],fov:43},
 {start:1316,kind:'fingers',cam:[.8,7.2,4.7],target:[0,2.75,0],fov:43},
 {start:1400,kind:'seal',cam:[-2.5,6.4,4.3],target:[0,2.75,0],fov:43},
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
// Fine-scale materials and full-size setting replace the earlier floating block diorama.
const textures=new Map<string,THREE.CanvasTexture>();
function canvasTexture(key:string,draw:(c:CanvasRenderingContext2D)=>void){
 let t=textures.get(key);if(t)return t;
 const cv=document.createElement('canvas');cv.width=512;cv.height=512;draw(cv.getContext('2d')!);
 t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;textures.set(key,t);return t;
}
function random(seed:number){let n=seed;return ()=>((n=(n*16807)%2147483647)-1)/2147483646;}
function asphaltTexture(){return canvasTexture('bridge-asphalt',c=>{const r=random(341);c.fillStyle='#596169';c.fillRect(0,0,512,512);for(let i=0;i<19000;i++){const v=Math.floor(94+r()*60);c.fillStyle=`rgba(${v},${v},${v},${.10+r()*.15})`;c.fillRect(r()*512,r()*512,1+r()*2,1+r()*2);}for(let i=0;i<45;i++){c.strokeStyle='rgba(30,39,44,.12)';c.lineWidth=1+r();c.beginPath();const x=r()*512,y=r()*512;c.moveTo(x,y);c.lineTo(x+10+r()*40,y+(r()-.5)*3);c.stroke();}});}
function waterTexture(){return canvasTexture('bridge-river',c=>{const r=random(713);c.fillStyle='#668f9b';c.fillRect(0,0,512,512);for(let i=0;i<800;i++){const x=r()*512,y=r()*512,l=8+r()*55;c.strokeStyle=i%3?'rgba(220,237,231,.22)':'rgba(38,92,111,.18)';c.lineWidth=.6+r()*1.6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.5,y-2-r()*2,x+l,y);c.stroke();}});}
function faceTexture(id:number){return canvasTexture('modern-facade-'+id,c=>{
 const r=random(893+id*193);c.fillStyle=['#ddd3bb','#b6c2c4','#c9c3b8','#b4bdb5','#c8d0c7'][id%5];c.fillRect(0,0,512,512);
 const rows=8+id%4,cols=5+id%3,dx=512/cols,dy=512/rows;
 for(let y=0;y<rows;y++){c.fillStyle='rgba(72,85,91,.23)';c.fillRect(0,y*dy+dy-3,512,3);
  for(let x=0;x<cols;x++){const px=x*dx+dx*.13,py=y*dy+dy*.12,w=dx*.74,h=dy*.70;c.fillStyle='#536a78';c.fillRect(px-2,py-2,w+4,h+4);c.fillStyle=r()>.3?'#8baab5':'#afc6c5';c.fillRect(px,py,w,h);c.fillStyle='rgba(232,241,224,.42)';c.fillRect(px+w*.08,py+2,w*.15,h-4);c.fillStyle='rgba(32,57,68,.32)';c.fillRect(px+w*.49,py,2,h);}
 }
});}
function texturedBox(p:THREE.Object3D,w:number,h:number,d:number,texture:THREE.Texture,x:number,y:number,z:number,repeat:[number,number]=[1,1]){
 const map=texture.clone();map.repeat.set(...repeat);map.needsUpdate=true;
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({map,color:'#ffffff'}));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
}
function cityBuilding(p:THREE.Object3D,x:number,z:number,w:number,h:number,depth:number,id:number){
 const g=grp(p,x,0,z);texturedBox(g,w,h,depth,faceTexture(id),0,h/2,0);
 // Parapets, floor ledges, setback roofs and rooftop mechanical equipment break up the skyline.
 box(g,w+.12,.13,depth+.12,'#aeb7b4',0,h+.06,0);box(g,w+.06,.16,depth+.08,'#a6ada7',0,.2,0);
 if(id%3===0){box(g,w*.65,.26,depth*.55,'#c3c4b8',0,h+.24,-.04);box(g,w*.16,.18,depth*.14,'#879397',w*.17,h+.44,0);}
 if(id%4===0)for(let y=1;y<h;y+=1.4)box(g,w+.06,.045,depth+.06,'#d6d7c8',0,y,0);
}
function sky(p:THREE.Object3D,night=false){
 const grad=canvasTexture(night?'sky-night':'sky-day',c=>{const g=c.createLinearGradient(0,0,0,512);g.addColorStop(0,night?'#263d65':'#73acd1');g.addColorStop(.63,night?'#6887a2':'#b9dbe7');g.addColorStop(1,night?'#a3b7bc':'#e5e8d8');c.fillStyle=g;c.fillRect(0,0,512,512);});
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(200,95),new THREE.MeshBasicMaterial({map:grad,depthWrite:false}));bg.position.set(0,28,-42);bg.layers.set(NOINK);p.add(bg);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(100,55),new THREE.MeshLambertMaterial({map:waterTexture(),color:night?'#8297ab':'#e1f0e9'}));water.rotation.x=-Math.PI/2;water.position.y=-.22;water.receiveShadow=true;p.add(water);
 // Tree-covered waterfront and layered city: no repeated cardboard-box silhouette.
 box(p,85,.65,10,'#a5ad91',0,-.24,-20);box(p,85,1.0,.45,'#aaa99b',0,.02,-15.1);
 let x=-32;for(let i=0;i<26;i++){const w=1.6+(i*13%9)*.15,h=2+(i*17%15)*.36;cityBuilding(p,x+w/2,-20.5-(i%3)*1.15,w,h,1.7+(i%3)*.4,i);x+=w+.38;}
 for(let i=0;i<16;i++){const x=-25+i*3.25,z=-14.3-(i%2)*.55;cylinder(p,.08,.85,'#796f56',x,.43,z);const crown=ball(p,.58+(i%3)*.07,i%2?'#749577':'#89a580',x,1.15,z);crown.scale.set(1,1.15,.85);}
 // A few distant, flattened clouds (billboards rather than miniature puffy balls).
 for(let i=0;i<4;i++){const cloud=grp(p,-22+i*14,9+(i%2)*3,-35);for(let j=0;j<4;j++){const q=ball(cloud,1.05+(j%2)*.3,night?'#a5b3be':'#f0eee4',j*1.1,0,0);q.scale.set(1,.28,.12);}}
}
function car(p:THREE.Object3D,assets:BridgeAssets,index:number,x:number,z:number,reverse=false){
 const g=grp(p,x,2.57,z);const model=assets[index%assets.length].clone(true);model.scale.multiplyScalar(1.32);if(reverse)model.rotation.y=Math.PI;g.add(model);return g;
}
function road(g:THREE.Group,assets:BridgeAssets,opts:{hero?:boolean;engineer?:boolean;night?:boolean;traffic?:boolean}){
 sky(g,opts.night);
 // Two spans continuing toward land, instead of a short isolated toy bridge.
 for(const side of [-1,1]){
  const deck=grp(g);const x=side*11.1;
  box(deck,22,.38,4.4,'#9da7a7',x,2.25,0);
  texturedBox(deck,22,.085,3.35,asphaltTexture(),x,2.49,0,[4,1]);
  for(const z of [-1.94,1.94]){box(deck,22,.18,.49,'#d1c8b6',x,2.52,z);box(deck,22,.04,.045,'#f0eee1',x,2.63,z>0?1.71:-1.71);}
  for(let j=0;j<20;j++)box(deck,.55,.012,.045,'#e9e6d7',side*(.42+j*1.08),2.54,0);
  for(const z of [-1.95,1.95]){box(deck,22,.37,.08,'#687a83',x,1.98,z);box(deck,22,.055,.15,'#c9ceca',x,1.75,z);}
 }
 // Main towers are paired columns, cross-members and base plates, not decorative blocks.
 for(const x of [-7.5,7.5]){
  box(g,1.3,.7,5,'#a8a9a0',x,.12,0);
  for(const z of [-2.06,2.06]){
   box(g,.44,8.2,.55,'#8a9a9c',x,4.0,z);box(g,.67,.25,.76,'#bdc4be',x,8.15,z);
   box(g,.62,.16,.68,'#74878a',x,3.1,z);
   for(let y=1;y<8;y+=.7)box(g,.46,.04,.57,'#718589',x,y,z);
  }
  for(const y of [3.25,6.6,7.95])box(g,.42,.3,4.45,'#9aa9a6',x,y,0);
 }
 // Paired main cables form a catenary approximation. Suspenders connect the cable to the deck.
 for(const z of [-1.86,1.86]){
  let prev:[number,number,number]=[-7.5,7.95,z];
  for(let i=1;i<=60;i++){const x=-7.5+i*.25,y=4.15+3.8*(x/7.5)**2;const next:[number,number,number]=[x,y,z];rod(g,prev,next,.09,'#62757a');prev=next;}
  rod(g,[-16,2.9,z],[-7.5,7.95,z],.09,'#62757a');rod(g,[7.5,7.95,z],[16,2.9,z],.09,'#62757a');
  for(let x=-7;x<=7;x+=.7){const y=4.15+3.8*(x/7.5)**2;rod(g,[x,2.72,z],[x,y,z],.025,'#819292');}
  for(let x=-21;x<=21;x+=.55){rod(g,[x,2.65,z],[x,3.15,z],.025,'#a8b2af');}
  rod(g,[-22,3.15,z],[22,3.15,z],.045,'#c3cac4');
  rod(g,[-22,2.85,z],[22,2.85,z],.025,'#aebcb7');
 }
 // Street lighting with curved necks and visibly mounted luminaire heads.
 for(let x=-15;x<=15;x+=5)for(const z of [-2.18,2.18]){
  rod(g,[x,2.65,z],[x,4.9,z],.035,'#8b9b99');rod(g,[x,4.9,z],[x,5.07,z*.75],.035,'#8b9b99');box(g,.27,.08,.35,'#d6d6c8',x,5.05,z*.75);
 }
 for(let i=0;i<14;i++){const z=-1.52+i*.23;box(g,.37,.045,.105,'#9da8a9',-.06,2.56,z);box(g,.37,.045,.105,'#bac0ba',.06,2.56,z+.115);}
 const cars=[car(g,assets,0,-4,-.65),car(g,assets,1,4,.65,true),car(g,assets,0,-13,-.65)];
 const person=opts.hero?actor(g,1,2.64,2.35,opts.engineer?'engineer':'hero',1.18,opts.engineer?'grin':'nervous'):undefined;
 return (frame:number)=>{const t=frame/30;cars[0].position.x=-9+t*.9;cars[1].position.x=9-t*.72;cars[2].position.x=-16+t*.8;if(person)person.animate(frame);};
}
function closeup(g:THREE.Group,kind:string){
 sky(g,kind==='cool');
 const l=grp(g),r=grp(g);const edge='#a8abb0';
 box(l,3.15,.55,6.2,edge,-1.7,2.2,0);box(r,3.15,.55,6.2,edge,1.7,2.2,0);
 texturedBox(l,3.15,.10,6.2,asphaltTexture(),-1.7,2.52,0,[1,2]);texturedBox(r,3.15,.10,6.2,asphaltTexture(),1.7,2.52,0,[1,2]);
 for(const side of [-1,1]){const span=side<0?l:r;box(span,.6,.025,.12,'#f5e5ad',side*1.15,2.58,-.6);box(span,.6,.025,.12,'#f5e5ad',side*1.15,2.58,.6);}
 if(kind==='seal'){
  box(g,.5,.08,6.1,'#303849',0,2.54,0);for(let z=-3.0;z<3.1;z+=.25)box(g,.46,.035,.035,'#68787d',0,2.59,z);
 }else{
  // Tapered, interleaved steel fingers; the actual void remains visible between tips.
  box(l,.25,.07,6.2,'#9da5a2',-.25,2.59,0);box(r,.25,.07,6.2,'#afb6b1',.25,2.59,0);
  const tooth=(parent:THREE.Group,side:number,z:number)=>{
   const shape=new THREE.Shape();const root=side*.30,tip=-side*.16;
   shape.moveTo(root,-z-.09);shape.lineTo(tip,-z-.055);shape.lineTo(tip,-z+.055);shape.lineTo(root,-z+.09);shape.closePath();
   const geo=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false});geo.rotateX(-Math.PI/2);
   mesh(parent,geo,side<0?'#a5afad':'#b9c2bb',0,2.61,0);
  };
  for(let i=0;i<28;i++){let z=-3+i*.22;tooth(l,-1,z);tooth(r,1,z+.11);}
  for(const x of [-.40,.40])for(let z=-2.9;z<=3;z+=.32){cylinder(g,.025,.015,'#6f7b7d',x,2.67,z);}

 }
 // Roadside handrail and upright: grounds the macro in the real bridge.
 for(const z of [-3.12,3.12]){rod(g,[-3,2.87,z],[3,2.87,z],.04,'#dce0d6');for(let x=-2.5;x<3;x+=.65)rod(g,[x,2.6,z],[x,2.87,z],.025,'#dce0d6');}
 if(kind==='warm'||kind==='cool'){
  const s=ball(g,.43,kind==='warm'?'#ffc65c':'#dae9f5',2.5,5.5,-4);if(kind==='warm')for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,[2.5+Math.cos(a)*.6,5.5+Math.sin(a)*.6,-4],[2.5+Math.cos(a)*.83,5.5+Math.sin(a)*.83,-4],.035,'#ffd078');}
 }
 return (f:number)=>{const u=Math.min(1,f/105);const shift=kind==='warm'?.16*u:kind==='cool'?-.16*u:.035*Math.sin(f/35);l.position.x=shift;r.position.x=-shift;};
}
function ruler(g:THREE.Group,pressure:boolean){
 // A real workshop context for the analogy: bench, tiled walls, window and tools.
 const wall=canvasTexture('workshop-wall',c=>{c.fillStyle='#d3d9d2';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=80){c.fillStyle='rgba(85,104,105,.13)';c.fillRect(0,y,512,2);}});
 texturedBox(g,20,10,.25,wall,0,4.8,-4);
 box(g,5,.18,1.1,'#899796',0,3.1,-3.3);for(let x=-2;x<=2;x+=.5){box(g,.14,.6,.25,x%1?'#ab7d62':'#748c95',x,3.49,-3.1);}
 // Large glazed window has depth and mullions, and a light opening beyond it.
 box(g,4,2.6,.12,'#aac8d0',0,5.7,-3.77);for(const x of [-2,0,2])box(g,.09,2.7,.12,'#e6e6dc',x,5.7,-3.68);for(const y of [4.4,5.7,7])box(g,4.1,.08,.12,'#e6e6dc',0,y,-3.68);
 box(g,12,.45,5,'#a07d61',0,.2,0);texturedBox(g,12,.06,5,canvasTexture('workbench',c=>{const r=random(79);c.fillStyle='#b89470';c.fillRect(0,0,512,512);for(let i=0;i<110;i++){c.strokeStyle='rgba(87,53,36,.14)';c.lineWidth=1+r()*2;c.beginPath();c.moveTo(0,r()*512);c.lineTo(512,r()*512);c.stroke();}}),0,.45,0,[2,1]);
 for(const x of [-1.85,1.85]){box(g,.5,3.4,1.4,'#a65d50',x,1.95,0);for(let y=.65;y<3.5;y+=.55){box(g,.52,.025,1.42,'#d6a18b',x,y,0);for(let z=-.6;z<.7;z+=.55)box(g,.53,.53,.018,'#b76e56',x,y+.28,z);}}
 const parts:THREE.Mesh[]=[];for(let i=0;i<25;i++){const x=-1.57+i*.13;const seg=box(g,.135,.24,.58,'#b7bdba',x,2,0);parts.push(seg);box(seg,.018,.012,i%5===0?.19:.11,'#52636b',0,.13,.13);}
 actor(g,1.35,-.15,2.4,'engineer',1.3,pressure?'shock':'grin');
 // Heater beneath the ruler only appears in the heating/pressure shot.
 if(pressure){box(g,1,.14,.7,'#545f62',0,.62,0);for(let i=0;i<6;i++){const heater=rod(g,[-.42+i*.17,.73,-.18],[-.42+i*.17,.73,.18],.035,'#e87c4f');}}
 return (f:number)=>{const u=pressure?Math.min(1,f/70):0;parts.forEach((p,i)=>{p.position.y=2+u*.5*Math.sin(Math.PI*i/24);p.rotation.z=u*.22*Math.cos(Math.PI*i/24);});};
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
 root=new THREE.Group(); stages:Stage[]; focus=new THREE.Vector3();
 constructor(assets:BridgeAssets){
  this.stages=SHOTS.map(s=>{const root=grp(this.root);let tick:(n:number)=>void;
   if(['joint','warm','cool','fingers','seal'].includes(s.kind))tick=closeup(root,s.kind);
   else if(s.kind==='ruler'||s.kind==='pressure')tick=ruler(root,s.kind==='pressure');
   else if(s.kind==='bearing')tick=bearing(root);
   else tick=road(root,assets,{hero:s.kind==='hero'||s.kind==='engineer',engineer:s.kind==='engineer',traffic:s.kind==='traffic'});
   root.visible=false;return {root,cam:s.cam,target:s.target,fov:s.fov,tick};
  });
  this.root.add(new THREE.HemisphereLight('#fff6e9','#9aa9c1',1.7));const light=new THREE.DirectionalLight('#fff1d4',2);light.position.set(-8,15,12);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-12,right:12,top:12,bottom:-12});light.shadow.bias=-.0002;this.root.add(light);
 }
 update(frame:number,camera:THREE.PerspectiveCamera){
  let i=0;while(i+1<SHOTS.length&&frame>=SHOTS[i+1].start)i++;
  this.stages.forEach((s,j)=>s.root.visible=i===j);const s=this.stages[i];this.focus.set(...s.target);const local=frame-SHOTS[i].start;s.tick(local);
  const drift=Math.min(.32,local*.0018);camera.position.set(s.cam[0]+.06*Math.sin(frame/80),s.cam[1]+.04*Math.sin(frame/100),s.cam[2]-drift);camera.lookAt(...s.target);camera.fov=s.fov;camera.near=.1;camera.far=200;camera.updateProjectionMatrix();camera.layers.enable(NOINK);
 }
}
