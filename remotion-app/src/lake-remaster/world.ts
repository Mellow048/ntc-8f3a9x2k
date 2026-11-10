import * as T from 'three';
import {interior} from './interior';
import {V,box,cyl,sphere,bar,material,wood,timber,iron,stone,lamp,batchStatic} from '../beer-remaster/build';
import {Character} from '../survivor-remaster/cast';
import {LIGHTS,LOOK} from '../beer-remaster/style/lights';
import {TONE,CHAR,untone} from '../beer-remaster/style/shade';
import {cloudHD,rep,stoneHD} from '../beer-remaster/style/paint';
import {NOINK} from '../beer-remaster/style/ink';
import {Shot,Place,CAMS,KICKS,smooth,clamp} from './story';
import {LakeWater,CanalWater,floodSurface} from './water';
import {shoreline,rig,barge,mine,bathtub,steel} from './sets';
export class World {
 root=new T.Group();actors:Character[]=[];sun:T.DirectionalLight;hemi:T.HemisphereLight;sky:T.Mesh;skyM:T.ShaderMaterial;
 animations:Array<(s:Shot,f:number,u:number)=>void>=[];clouds:T.Mesh[]=[];fog=new T.Fog('#b8d0ec',35,180);
 
 constructor(public place:Place){
  this.hemi=new T.HemisphereLight('#dcecff','#b49a78',.55);this.sun=new T.DirectionalLight('#fff3e0',2.8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.025;this.root.add(this.hemi,this.sun,this.sun.target);
  this.skyM=new T.ShaderMaterial({uniforms:{c0:{value:new T.Color()},c1:{value:new T.Color()},c2:{value:new T.Color()},c3:{value:new T.Color()},c4:{value:new T.Color()},e:{value:new T.Vector4()}},vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c0,c1,c2,c3,c4;uniform vec4 e;varying vec3 vP;void main(){float a=asin(clamp(normalize(vP).y,-1.,1.));vec3 c=mix(c0,c1,smoothstep(0.,e.x,a));c=mix(c,c2,smoothstep(e.x,e.y,a));c=mix(c,c3,smoothstep(e.y,e.z,a));c=mix(c,c4,smoothstep(e.z,e.w,a));gl_FragColor=vec4(c,1.);}',side:T.BackSide,depthWrite:false,fog:false});
  this.sky=new T.Mesh(new T.SphereGeometry(420,32,16),this.skyM);this.sky.layers.set(NOINK);this.sky.renderOrder=-1;this.sky.frustumCulled=false;this.root.add(this.sky);
  for(let i=0;i<5;i++){const m=new T.Mesh(new T.PlaneGeometry(50,25),new T.MeshBasicMaterial({map:cloudHD(i,LOOK.day.cloud),transparent:true,depthWrite:false,fog:false}));m.layers.set(NOINK);m.position.set(Math.sin(i*1.3)*210,48+i*8,-140-Math.cos(i*1.3)*70);this.root.add(m);this.clouds.push(m);}
  const p=this.root;
  const worker=(x:number,z:number,i=0)=>{const a=new Character(p,x,z,{jacket:['#c17b3c','#6d8b78','#8a697d'][i%3],pants:'#3b4653',boots:'#35333a',hat:i===1?'hair':'cap',cap:i===0?'#dfbb50':'#bdc4c4',hair:i===1?'#573a30':'#333b43',skin:'#e9c9a5',build:i===2?'stout':'adult'});a.seed=11+i*13;a.root.scale.setScalar([1,.93,1.07][i%3]);this.actors.push(a);return a;};
  if(['lake','rig','sinking','return'].includes(place)){
   shoreline(p);const water=new LakeWater(p);const tower=rig(p);const boats=Array.from({length:11},(_,i)=>barge(p,i));
   const seal=cyl(p,0,-.15,0,.42,.2,new T.MeshBasicMaterial({color:'#286879'}));seal.userData.dynamic=true;seal.visible=place==='return';const lead=worker(2,1,0);tower.root.add(lead.root);lead.root.position.set(2,1.15,1);const other=worker(-2,1,1);tower.root.add(other.root);other.root.position.set(-2,1.15,1);
   this.animations.push((s,f,u)=>{const t=f/30,calm=place==='rig',returning=place==='return';const q=place==='sinking'?smooth((f-617)/99):place==='lake'? .12+u*.3:0;const depth=calm||returning?0:1;water.update(t,depth,calm?.35:1.4);
    tower.root.visible=!returning;tower.root.position.set(Math.sin(t*.7)*.08,-q*20,0);tower.root.rotation.z=q*.55;tower.root.rotation.x=q*.18;tower.pipe.rotation.y=f*.12;
    lead.expr=calm?'neutral':'shock';other.expr=calm?'neutral':'nervous';lead.wave=calm?undefined:.8;other.wave=calm?undefined:.6;lead.lean=calm?Math.sin(t*4)*2:-12;lead.root.visible=calm;other.root.visible=calm;
    boats.forEach((b,i)=>{const ang=i/11*Math.PI*2+t*(calm?.025:.25);let r=12+(i%3)*2.5;
     if(place==='sinking')r=Math.max(.4,r-(u*18+i*.15));if(returning)r=8+i*.9;
     const x=Math.cos(ang)*r,z=Math.sin(ang)*r;b.visible=!returning||i<9;b.position.set(x,water.height(x,z,t,depth)+(returning?-.15-(1-smooth((f-965)/45))*2.3:-clamp((1.5-r)/1.5)*3),z);b.rotation.set(Math.sin(t*1.6+i)*.045+(!calm&&!returning?clamp((7-r)/7)*.65:0),-ang,(!calm&&!returning?clamp((7-r)/7)*.6:Math.sin(t+i)*.035));
    });
   });
  }else if(place==='tunnel'||place==='impact'){
   const room=interior(p);const people=place==='tunnel'?[worker(1.8,-6,0),worker(-2,-11,1)]:[];
   this.animations.push((s,f,u)=>{room.water.update(f/30);const q=clamp((f-393)/65);const hit=place==='impact';room.bit.position.y=6-clamp((f-377)/35)*2;room.bit.rotation.y=f*.34;room.stream.visible=f>399;room.stream.scale.set(.4+q,1,.4+q);room.flood.visible=f>410;room.flood.position.y=.08+q*.85;
    room.debris.forEach((d,i)=>{d.visible=f>390;const t=((f-390+i*3)%37)/37;d.position.set(Math.sin(i*2.39)*t*3,4-t*4,-1+Math.cos(i*1.7)*t*3);});
    people.forEach((a,i)=>{a.walk=q>0;a.expr=q>0?'shock':'neutral';a.lean=q>0?-14:0;a.root.position.set(i?-2:1.8,0,-6-i*5+q*9);});
   });
  }else if(['section','breach','lost'].includes(place)){
   const cut=mine(p);const lakeTop=floodSurface(p,24,6);lakeTop.mesh.position.y=.1;const small=rig(p);small.root.scale.setScalar(.45);small.root.position.set(0,.1,1);
   const stream=cyl(p,0,-3,1,.4,7,material('mine-water','#72b8c8'));stream.userData.dynamic=true;
   const droplets:T.Mesh[]=[];for(let i=0;i<18;i++){const d=sphere(p,0,0,0,.06,material('mine-droplet','#a8d3d9'));d.userData.dynamic=true;droplets.push(d);}
   const mineWater=floodSurface(p,20,6);const flood=mineWater.mesh;flood.position.set(0,-7.6,1);
   this.animations.push((s,f,u)=>{lakeTop.update(f/30);mineWater.update(f/30);const breached=place==='breach',lost=place==='lost';const q=breached?smooth((f-393)/35):lost?1:0;cut.drill.position.y=1.8-q*2;cut.drill.rotation.y=f*.25;cut.bit.position.y=-2.3-q*2;cut.bit.rotation.y=f*.25;cut.bit.visible=!lost;cut.drill.visible=!lost;small.root.visible=!lost;stream.visible=q>0;stream.scale.set(q,1,q);flood.visible=q>0;flood.position.y=-7.6+q*(lost?4.1:1.8);droplets.forEach((d,i)=>{d.visible=breached&&q>0;const v=((f+i*7)%40)/40;d.position.set(Math.sin(i*2.3)*q*.9,-1-v*6,1+Math.cos(i*2.4)*q*.6);});});
  }else if(place==='drain'){
   const plug=bathtub(p);const water=new LakeWater(p,1.1);water.mesh.scale.set(1.5,.08,1);water.mesh.position.y=.9;const chain:T.Mesh[]=[];for(let i=0;i<7;i++){const r=new T.Mesh(new T.TorusGeometry(.04,.009,4,12),iron());r.userData.dynamic=true;p.add(r);chain.push(r);}
   this.animations.push((s,f,u)=>{const q=smooth(u);plug.position.set(.7*q,.8+q*1.4,0);plug.rotation.z=q*.4;water.update(f/30,q*.18,1);water.mesh.position.y=.9-q*.16;chain.forEach((r,i)=>r.position.set(.7*q*i/7,.9+q*1.4*i/7,0));});
  }else if(place==='canal'){
   for(const x of [-7,7]){box(p,x,-.2,-9,8,.5,65,material('canal-bank','#8a9a72',rep(stoneHD(),4,12)));for(let i=0;i<6;i++){bar(p,V(x,0,-i*7),V(x,3,-i*7),.13,timber());sphere(p,x,3.7,-i*7,1.7,material('canal-leaves','#658469'));}}
   const water=new CanalWater(p);const foam:T.Mesh[]=[];for(let i=0;i<30;i++){const m=box(p,Math.sin(i*3)*2.2,.07,-i*2,.025,.015,.6+(i%3)*.25,material('canal-foam','#bfd5d2'));m.userData.dynamic=true;foam.push(m);}
   const arrow=new T.Group();arrow.userData.dynamic=true;p.add(arrow);box(arrow,0,.1,0,.22,.03,2,material('flow-arrow','#e5d9a7'));for(const x of [-1,1]){const h=box(arrow,x*.34,.1,-.8,.14,.03,1,material('flow-arrow','#e5d9a7'));h.rotation.y=x*.8;}
   this.animations.push((s,f,u)=>{const reversed=f>=746;water.update(f/30,reversed?1:-1);arrow.rotation.y=reversed?Math.PI:0;arrow.position.z=-6;foam.forEach((m,i)=>m.position.z=-30+((i*2+(reversed?-2*746/30+3*(f-746)/30:-2*f/30))%55+55)%55);});
  }else if(place==='escape'){
   box(p,0,-.2,0,26,.35,22,material('safe-ground','#a8ad8b',rep(stoneHD(),7,7)));box(p,-3,1.8,-3,5,3.8,.5,stone());box(p,-3,1.4,-2.6,2.1,3,.15,material('mine-opening','#303b48'));for(const x of [-4.4,-1.6])box(p,x,1.6,-2.4,.22,3.2,.3,timber());box(p,-3,3.2,-2.4,3,.25,.3,timber());
   const people=[worker(-2.5,-1.6,0),worker(-3,-3,1),worker(-3.5,-4.5,2)];const cart=box(p,-4,.5,-1,1.2,.7,1.6,steel());for(const x of [-4.65,-3.35])for(const z of [-1.6,-.4]){const w=cyl(p,x,.22,z,.2,.12,iron());w.rotation.z=Math.PI/2;}
   this.animations.push((s,f,u)=>people.forEach((a,i)=>{const e=clamp((f-861)/101);a.walk=true;a.expr='neutral';a.root.position.set(-2.5+e*[4.3,2.2,.2][i],0,-1.6-i+e*(3+i*.9));a.wave=i===0?.35:undefined;a.lean=-3+Math.sin(f*.14+i)*2;}));
  }
  batchStatic(this.root);
 }
 update(s:Shot,f:number,cam:T.PerspectiveCamera,scene:T.Scene){
  const c=CAMS(s,f);cam.position.set(...c.pos);cam.lookAt(...c.look);cam.fov=c.fov;
  for(const kick of KICKS){const d=f-kick.f;if(d>=0&&d<7)cam.rotation.z+=(d%2?1:-1)*kick.amount*(1-d/7);}
  cam.updateProjectionMatrix();cam.updateMatrixWorld();cam.layers.enable(NOINK);
  const L=LIGHTS[s.light],K=LOOK[s.light];const focus=V(...c.look);
  this.hemi.color.set(L.sky);this.hemi.groundColor.set(L.ground);this.hemi.intensity=L.hemiI;this.sun.color.set(L.sunCol);this.sun.intensity=L.sunI;
  const heading=Math.atan2(s.pos[0]-s.look[0],s.pos[2]-s.look[2]);const az=heading+Math.PI*.48,el=(s.light==='golden'?22:48)*Math.PI/180;
  const dir=V(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el));
  this.sun.position.copy(focus).addScaledVector(dir,100);this.sun.target.position.copy(focus);this.sun.target.updateMatrixWorld();
  const r=['lake','rig','sinking','return','canal'].includes(this.place)?32:17;const sc=this.sun.shadow.camera;sc.left=-r;sc.right=r;sc.top=r;sc.bottom=-r;sc.near=1;sc.far=220;sc.updateProjectionMatrix();
  TONE.uLitCol.value.set(...L.lit);TONE.uShadeCol.value.set(...L.shade);TONE.uShadeLift.value.set(...L.lift);TONE.uLambert.value=L.lambert;TONE.uSideK.value=L.sideK;TONE.uTerm.value=L.term;TONE.uBounce.value.set(...K.bounce);TONE.uSat.value=K.sat;
  CHAR.uCharTint.value.set(...L.charTint);CHAR.uCharShade.value=L.charShade;CHAR.uGrad.value=L.charGrad;CHAR.uBodyGrad.value=L.bodyGrad;CHAR.uSideTint.value.set(...L.sideTint);
  K.sky.c.forEach((h,i)=>untone(h,this.skyM.uniforms['c'+i].value));const e=K.sky.e.map(v=>v*Math.PI/180);this.skyM.uniforms.e.value.set(e[1],e[2],e[3],e[4]);this.sky.position.copy(cam.position);
  untone(L.fog,this.fog.color);this.fog.near=['lake','rig','sinking','return','canal'].includes(this.place)?28:35;this.fog.far=['lake','rig','sinking','return','canal'].includes(this.place)?130:180;scene.fog=this.fog;scene.background=null;this.clouds.forEach(cl=>cl.lookAt(cam.position));
  const u=clamp((f-s.a)/(s.b-s.a));this.animations.forEach(fn=>fn(s,f,u));this.actors.forEach(a=>a.update(f,cam));return focus;
 }
}
