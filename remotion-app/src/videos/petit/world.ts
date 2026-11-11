import * as T from 'three';
import {V,box,cyl,sphere,bar,material,timber,iron,stone,wood,mesh,lamp,batchStatic} from './build';
import {ground,room,desk,lettering,paper,twinTowers,wireLine,elevatorCar,streetNY,parkSet,bowProp,poleProp} from './sets';
import {Actor,PETIT,FRIEND,POLICE,WORKER,REPORTER,CLERK,townsfolk} from './cast';
import {Shot,clamp,ease,action,word} from './story';
import {ctex,cloudHD,rep,beamHD} from './style/paint';
import {NOINK} from './style/ink';
import {LIGHTS,LOOK} from './style/lights';
import {TONE,CHAR,untone} from './style/shade';
export class World{
 root=new T.Group();actors:Actor[]=[];motions:((f:number,u:number)=>void)[]=[];
 sun=new T.DirectionalLight('#fff2d8',2.8);hemi=new T.HemisphereLight('#dcecff','#b49a78',.55);sky:T.Mesh;
 constructor(public place:string){const p=this.root;
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#4c8ed1')},bottom:{value:new T.Color('#c9dfeb')}},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top,bottom;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(0.,.7,normalize(v).y)),1.);}'});
 this.sky=new T.Mesh(new T.SphereGeometry(500,24,12),skyMat);this.sky.layers.set(NOINK);p.add(this.sky,this.hemi,this.sun,this.sun.target);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.02;
 const actor=(x:number,z:number,o=PETIT,seed=5)=>{const a=new Actor(p,x,z,o,seed);this.actors.push(a);return a;};
 const dyn=(o:T.Object3D)=>{o.userData.dynamic=true;return o;};
 const ROOF=13.2;
 const roofSet=()=>{ground(p);twinTowers(p,{gap:14,height:38,roofY:12});box(p,0,12,-6,22,.4,8,material('roof','#8a9aa2'));};
 const indoorSet=()=>{room(p,place);};
 // --- hook: wire between towers, police waiting ---
 if(place==='hook'){
  roofSet();
  const wire=wireLine(p,V(-10.2,ROOF,-6),V(10.2,ROOF,-6),.25);
  const v=actor(-2,-6,PETIT,5);v.root.position.y=ROOF;v.expr='neutral';v.wave=.15;
  const pole=poleProp(p,-2,ROOF+1.2,-6);
  const c1=actor(-8,-4,POLICE,9),c2=actor(8,-4,POLICE,10);c1.expr='stern';c2.expr='stern';
  this.motions.push((f,u)=>{v.root.position.x=-2+u*4;pole.position.x=v.root.position.x;});
  lettering(p,'NEW YORK · 1974',0,6.05,-1.2,4,.55);
 }
 // --- magazine / decision ---
 if(place==='magazine'){
  indoorSet();desk(p,0,-.4);
  const v=actor(.6,.5,PETIT,5);v.expr='neutral';
  const mag=dyn(paper(p,'TWIN TOWERS',.2,1.3,.3,1.4,1.8));mag.rotation.x=-Math.PI/2;
  lettering(p,'MAGAZINE',0,4.7,-4.05,3,.6);
  this.motions.push((f)=>{const q=action(f,21,14);v.expr=q>.4?'shock':'neutral';v.look=q*.5;});
 }
 if(place==='decision'){
  indoorSet();desk(p,0,-.4);
  const v=actor(0,.5,PETIT,5);v.expr='neutral';
  const mag=dyn(paper(p,'TWIN TOWERS',0,1.3,.3,1.4,1.8));mag.rotation.x=-Math.PI/2;
  this.motions.push((f)=>{const q=action(f,40,12);v.wave=q*.9;v.expr=q>.5?'grin':'neutral';});
 }
 // --- disguise / reporter / worker / fakeid ---
 if(place==='disguise'){
  indoorSet();desk(p,0,-.4);
  const v=actor(0,.5,PETIT,5);v.expr='neutral';
  const nb=dyn(paper(p,'NOTES',-.6,1.3,.2,1,1.3));nb.rotation.x=-Math.PI/2;
  lettering(p,'STUDYING',0,4.7,-4.05,3,.6);
  this.motions.push((f)=>{v.look=Math.sin(f*.05)*.4;});
 }
 if(place==='reporter'){
  indoorSet();desk(p,0,-.4);
  const v=actor(0,.5,REPORTER,5);v.expr='smile';
  const guard=actor(-1.5,-1.2,POLICE,9);guard.expr='stern';
  this.motions.push((f)=>{v.wave=action(f,58,10)*.7;});
 }
 if(place==='worker'){
  indoorSet();desk(p,0,-.4);
  const v=actor(0,.5,WORKER,5);v.expr='neutral';
  box(p,1.2,1.3,.3,.5,.3,.4,wood());
  this.motions.push((f)=>{v.wave=action(f,59,10)*.6;});
 }
 if(place==='fakeid'){
  indoorSet();desk(p,0,0,4.4);
  const v=actor(0,-1.2,PETIT,5);v.expr='neutral';
  for(let i=0;i<3;i++){const id=dyn(paper(p,'ID '+(i+1),-.8+i*.8,1.3,.6,.7,.9));id.rotation.x=-Math.PI/2;}
  // model towers
  box(p,1.2,1.5,.5,.3,1.2,.3,material('model','#8ab0c0'));box(p,1.6,1.5,.5,.3,1.2,.3,material('model','#8ab0c0'));
  this.motions.push((f)=>{v.look=.4*(1-action(f,61,12));});
 }
 // --- smuggle / elevator ---
 if(place==='smuggle'){
  indoorSet();elevatorCar(p,0,-1);
  const v=actor(-1.5,1,PETIT,5),f1=actor(1.5,1,FRIEND,6);
  const cable=dyn(bar(p,V(-1,1.2,.5),V(1,1.2,.5),.08,iron()));
  const pole=dyn(poleProp(p,0,1.3,.5));
  const bow=dyn(bowProp(p,.8,1.3,.5));
  this.motions.push((f)=>{const q=action(f,67,16);v.root.position.x=-1.5+q*1.5;f1.root.position.x=1.5-q*1.5;});
 }
 if(place==='elevator'){
  indoorSet();elevatorCar(p,0,-1);
  const v=actor(0,1,PETIT,5);
  const doors=dyn(box(p,0,1.6,.31,1.4,2.6,.06,material('elevdoor2','#a8b8c0')));
  this.motions.push((f,u)=>{doors.position.z=.31+u*.8;v.root.position.z=1-u*1.2;});
 }
 // --- towers (new, empty security) ---
 if(place==='towers'){
  ground(p);twinTowers(p,{gap:14,height:38,roofY:12});
  desk(p,0,-2,3.2);lettering(p,'WORLD TRADE CENTER',0,6.05,-1.2,5,.6);
  const guard=actor(-1.5,1,CLERK,9);guard.expr='neutral';
  this.motions.push((f)=>{guard.look=Math.sin(f*.04)*.3;});
 }
 // --- bow / pull ---
 if(place==='bow'){
  roofSet();
  const bow=dyn(bowProp(p,-8,ROOF+1,-6));
  const f1=actor(-8,-4,FRIEND,6);
  const line=dyn(bar(p,V(-8,ROOF+1,-6),V(10.2,ROOF+1.2,-6),.015,material('line','#e8e0c8')));
  this.motions.push((f,u)=>{line.scale.x=.2+u*.8;line.position.x=-8+ (10.2+8)*u/2;f1.wave=action(f,100,10)*.8;});
 }
 if(place==='pull'){
  roofSet();
  const f1=actor(-6,-4,FRIEND,6),f2=actor(-4,-4,FRIEND,7);
  const cable=dyn(bar(p,V(-6,ROOF+.5,-6),V(10.2,ROOF+1.2,-6),.05,iron()));
  this.motions.push((f,u)=>{const q=action(f,111,20);f1.root.position.x=-6+q*2;f2.root.position.x=-4+q*2;cable.scale.x=.5+q*.5;});
 }
 // --- sunrise / cross / kneel / lie / salute ---
 if(['sunrise','cross','kneel','lie','salute'].includes(place)){
  roofSet();
  wireLine(p,V(-10.2,ROOF,-6),V(10.2,ROOF,-6),.2);
  const v=actor(-2,-6,PETIT,5);v.root.position.y=ROOF;
  const pole=poleProp(p,-2,ROOF+1.2,-6);
  if(place==='sunrise'){v.expr='neutral';this.motions.push((f,u)=>{v.root.position.x=-2+u*2;pole.position.x=v.root.position.x;});}
  if(place==='cross'){v.expr='neutral';this.motions.push((f,u)=>{v.root.position.x=-6+u*12;pole.position.x=v.root.position.x;});}
  if(place==='kneel'){v.expr='neutral';v.lean=12;this.motions.push((f)=>{v.wave=action(f,137,10)*.8;});}
  if(place==='lie'){v.expr='neutral';v.lean=-18;this.motions.push((f)=>{v.wave=action(f,139,10)*.5;});}
  if(place==='salute'){v.expr='grin';this.motions.push((f)=>{v.wave=action(f,142,10)*.95;});}
 }
 // --- street / crowd / police ---
 if(place==='street'){
  streetNY(p);
  for(let i=0;i<4;i++){const a=actor(-3+(i%2)*6,2-i*1.5,townsfolk(i+2),i+10);a.expr='neutral';this.motions.push((f)=>{a.look=-.6;});}
 }
 if(place==='crowd'){
  streetNY(p);
  for(let i=0;i<6;i++){const a=actor(-4+(i%3)*4,2-Math.floor(i/3)*2,townsfolk(i+2),i+10);a.expr='shock';this.motions.push((f)=>{a.look=-.7;});}
 }
 if(place==='police'){
  streetNY(p);
  const c1=actor(-1,1,POLICE,9),c2=actor(1,1,POLICE,10);c1.expr='stern';c2.expr='stern';
  this.motions.push((f,u)=>{c1.root.position.x=-1+u*1.5;c2.root.position.x=1-u*1.5;});
 }
 // --- wait / arrest ---
 if(place==='wait'){
  roofSet();
  wireLine(p,V(-10.2,ROOF,-6),V(10.2,ROOF,-6),.2);
  const v=actor(0,-6,PETIT,5);v.root.position.y=ROOF;v.expr='neutral';
  const c1=actor(-8,-4,POLICE,9),c2=actor(8,-4,POLICE,10);c1.expr='stern';c2.expr='stern';
  this.motions.push((f)=>{v.look=-.4;c1.look=.3;c2.look=-.3;});
 }
 if(place==='arrest'){
  roofSet();
  wireLine(p,V(-10.2,ROOF,-6),V(10.2,ROOF,-6),.2);
  const v=actor(2,-6,PETIT,5);v.root.position.y=ROOF;v.expr='shock';
  const c1=actor(1,-4,POLICE,9),c2=actor(3,-4,POLICE,10);c1.expr='stern';c2.expr='stern';
  this.motions.push((f,u)=>{v.root.position.x=2-u*2;c1.root.position.x=1+u*1;c2.root.position.x=3-u*1;});
 }
 // --- dropped / park / pass / today ---
 if(place==='dropped'){
  indoorSet();desk(p,0,0,4.2);
  const j=actor(0,-1.4,CLERK,12);j.expr='smile';
  const doc=dyn(paper(p,'DROPPED',.1,1.27,.7,1.7,1.15));doc.rotation.x=-Math.PI/2;
  const gavel=dyn(box(p,.6,1.35,.7,.4,.08,.12,wood()));
  this.motions.push((f)=>{const q=action(f,177,10);gavel.position.y=1.35+Math.sin(q*Math.PI)*.5;j.wave=q*.5;});
 }
 if(place==='park'){
  parkSet(p);
  const v=actor(0,0,PETIT,5);v.expr='grin';
  for(let i=0;i<4;i++){const a=actor(-4+i*2.5,3,townsfolk(i+2),i+10);a.expr='laugh';}
  this.motions.push((f)=>{v.wave=action(f,187,12)*.9;});
 }
 if(place==='pass'){
  indoorSet();desk(p,0,0,3.2);
  const v=actor(0,-1.2,PETIT,5);v.expr='grin';
  const clerk=actor(1.2,-1.2,CLERK,9);clerk.expr='smile';
  const pass=dyn(paper(p,'LIFETIME PASS',.6,1.3,.5,1.4,1));pass.rotation.x=-Math.PI/2;
  this.motions.push((f)=>{const q=action(f,194,12);pass.position.x=.6-q*.6;clerk.wave=q*.6;v.wave=q*.7;});
 }
 if(place==='today'){
  parkSet(p);
  const v=actor(0,0,PETIT,5);v.root.position.y=2.2;v.expr='neutral';v.wave=.4;
  const pole=poleProp(p,0,3.4,0);
  lettering(p,'STILL WALKING',0,4.5,-4,4,.6);
  this.motions.push((f,u)=>{v.root.position.x=-3+u*6;pole.position.x=v.root.position.x;});
 }
 // Static architecture only. Actors and every animated prop are excluded.
 batchStatic(p);
 }
 update(s:Shot,f:number,cam:T.PerspectiveCamera,scene:T.Scene){
  const u=clamp((f-s.a)/(s.b-s.a));const target=V(s.look[0],s.look[1],s.look[2]);const origin=V(s.pos[0],s.pos[1],s.pos[2]);
  cam.position.copy(origin).lerp(target,.025+u*.055);cam.lookAt(target);cam.fov=s.fov;cam.near=.15;cam.far=650;cam.layers.enable(NOINK);cam.updateProjectionMatrix();cam.updateMatrixWorld();
  const L=LIGHTS.day,K=LOOK.day;this.sky.position.copy(cam.position);scene.background=null;scene.fog=new T.Fog('#b8d0d9',35,150);
  const sunDir=V(-.5,.85,.65).normalize();this.sun.position.copy(target).addScaledVector(sunDir,80);this.sun.target.position.copy(target);this.sun.target.updateMatrixWorld();const sh=this.sun.shadow.camera;sh.left=-20;sh.right=20;sh.top=22;sh.bottom=-20;sh.near=1;sh.far=180;sh.updateProjectionMatrix();
  TONE.uLitCol.value.set(...L.lit);TONE.uShadeCol.value.set(...L.shade);TONE.uShadeLift.value.set(...L.lift);TONE.uLambert.value=L.lambert;TONE.uSideK.value=L.sideK;TONE.uTerm.value=L.term;TONE.uBounce.value.set(...K.bounce);TONE.uSat.value=1.04;
  CHAR.uCharTint.value.set(...L.charTint);CHAR.uCharShade.value=L.charShade;CHAR.uGrad.value=L.charGrad;CHAR.uBodyGrad.value=L.bodyGrad;CHAR.uSideTint.value.set(...L.sideTint);
  this.motions.forEach(fn=>fn(f,u));this.actors.forEach(a=>a.update(f,cam));return target;
 }
}
