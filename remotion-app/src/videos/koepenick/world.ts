import * as T from 'three';
import {V,box,cyl,sphere,bar,material,timber,iron,stone,wood,mesh,lamp,batchStatic} from './build';
import {hall,square,house,ground,room,desk,lettering,paper,bag,mug,bars} from './sets';
import {Actor,CAPTAIN,CIVIL,SOLDIER,POLICE,MAYOR,CLERK,KAISER,BRONZE,townsfolk} from './cast';
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
 const actor=(x:number,z:number,o=CAPTAIN,seed=5)=>{const a=new Actor(p,x,z,o,seed);this.actors.push(a);if(o===CLERK)a.root.scale.setScalar(1.2);return a;};
 const dyn=(o:T.Object3D)=>{o.userData.dynamic=true;return o;};
 const squad=(xs:number[],zs:number[])=>{const out:Actor[]=[];for(const z of zs)for(const x of xs)out.push(actor(x,z,SOLDIER(out.length),out.length+2));return out;};
 const cupAt=(a:Actor)=>{const o=mug(a.root,.48,1.13,.25);o.userData.dynamic=true;return o;};
 const indoors=()=>room(p,place);
 if(['hook','hall','guard','statue'].includes(place))hall(p);
 else if(['halt','follow','obey','crowd','laugh'].includes(place))square(p);
 else if(!['train','escape','stage'].includes(place))indoors();
 if(place==='hook'){
  const v=actor(-1.5,1.1);v.expr='grin';v.wave=.15;
  const men=squad([-.2,1.5],[0,-1.2,-2.3]);men.forEach((a,i)=>{a.mode='stroll';const b=bag(a.root,.5,.75,.2);b.userData.dynamic=true;this.motions.push((f,u)=>{a.root.position.z=-1.7+u*3+(i<2?1:0);a.root.position.x=(i%2?1.5:-.2)+u*.4;a.wave=action(f,6,14)*.9;});});
  lettering(p,'16 OCTOBER 1906',0,6.05,-1.2,4,.55);
 }
 if(place==='ban'){
  desk(p,0,-.4);const officer=actor(-1,-1.6,POLICE,9);officer.expr='stern';const v=actor(1.6,.5,CIVIL);v.expr='nervous';
  const doc=dyn(paper(p,'BERLIN',0,1.31,.4,1.2,.85));doc.rotation.x=-Math.PI/2;
  const stamp=dyn(lettering(p,'BANNED',0,1.34,.4,.95,.4,'#ebc7af','#a33236'));stamp.rotation.x=-Math.PI/2;
  this.motions.push((f,u)=>{const a=action(f,29,7);stamp.visible=a>.25;stamp.position.y=1.35+Math.sin(a*Math.PI)*.7;officer.wave=a*.6;v.root.position.x=1.6+action(f,32,18)*1.1;v.mode=f>word(32)?'stroll':'stand';});
  lettering(p,'POLICE REGISTRY',0,4.7,-4.05,3.6,.6);
 }
 if(['shop','uniform','mirror'].includes(place)){
  desk(p,0,place==='mirror'?-2.3:0,4.8);lettering(p,'SECOND-HAND UNIFORMS',0,4.8,-4.03,5.4,.6);
  // Hanging tunics are individual shoulders, sleeves, collars, belts and buttons.
  for(let i=0;i<6;i++){const x=-4.6+i*1.8;bar(p,V(x,3.6,-3.5),V(x-.4,3.3,-3.5),.045,iron());bar(p,V(x,3.6,-3.5),V(x+.4,3.3,-3.5),.045,iron());const col=material('coat'+i,['#49614f','#4e5b70','#89755a'][i%3]);box(p,x,2.6,-3.45,.72,1.5,.17,col);for(const s of [-1,1]){const arm=box(p,x+s*.49,2.7,-3.45,.23,1.2,.18,col);arm.rotation.z=s*.13;}for(let k=0;k<5;k++)sphere(p,x+.13,3.1-k*.22,-3.31,.025,material('brass','#ceb777'));}
  if(place==='shop'){const v=actor(.6,1.7,CIVIL);v.mode='stroll';const merchant=actor(-1,-1.4,CLERK,20);merchant.expr='smile';this.motions.push((f,u)=>{v.root.position.x=2-u*1.5;merchant.wave=ease(u)*.6;});}
  if(place==='uniform'){
   const coat=new T.Group();p.add(coat);coat.userData.dynamic=true;box(coat,-.7,.1,0,1.3,.13,1.2,material('displaycoat','#344352'));for(const s of [-1,1])box(coat,-.7+s*.8,.08,0,.38,.14,1,material('displaycoat','#344352'));for(let i=0;i<4;i++)sphere(coat,-.55,.2,-.4+i*.25,.035,material('buttons','#d0b77a'));
   const sash=dyn(box(p,.5,1.3,.1,.4,.06,1.2,material('sash','#bab4a2')));const sword=dyn(bar(p,V(1,1.34,-.65),V(1.3,1.34,.6),.06,iron()));
   const cap=actor(0,0,CAPTAIN);cap.root.visible=false;
   const hat=new T.Group();p.add(hat);hat.userData.dynamic=true;cyl(hat,1.6,1.4,-.1,.3,.22,material('cap','#344352'));box(hat,1.6,1.33,.15,.5,.05,.24,iron());
   this.motions.push((f)=>{coat.position.y=1.23+(1-action(f,37,12))*3;sash.position.y=1.3+(1-action(f,43,12))*3;sword.visible=f>=word(44);hat.position.y=(1-action(f,45,12))*3;});
  }
  if(place==='mirror'){
   const v=actor(0,.8);v.expr='grin';v.wave=.15;
   const helmet=new T.Group();p.add(helmet);sphere(helmet,1.7,1.5,.1,.33,iron());cyl(helmet,1.7,1.83,.1,.04,.3,material('helmetgold','#c2ac70'),0);helmet.userData.dynamic=true;
   this.motions.push((f)=>{v.look=action(f,53,10)*.6;v.expr=f<word(53)?'grin':'neutral';helmet.rotation.z=Math.sin(action(f,53,16)*Math.PI)*.12;});
  }
 }
 if(['halt','follow'].includes(place)){
  const v=actor(-1.6,1.5);v.expr='stern';const men=squad([-.6,1.05],[-1,-2.6,-4.2,-5.8,-7.4]);
  men.forEach((a,i)=>this.motions.push((f,u)=>{const q=action(f,57,8),follow=action(f,68,30);a.mode=place==='halt'?(q<1?'march':'stand'):'march';a.root.position.z=(-1-Math.floor(i/2)*1.6)+(place==='halt'?Math.min(.7,u*2):follow*3.2);a.root.position.x=(i%2?1.05:-.6)-(place==='follow'?follow*1.6:0);a.wave=place==='halt'?undefined:undefined;}));
  this.motions.push((f)=>{v.wave=place==='halt'?action(f,57,7)*.95:.65;v.mode=place==='follow'?'march':'stand';v.root.position.z=1.5+(place==='follow'?action(f,68,30)*2:0);});
 }
 if(place==='obey'){
  const a=actor(.75,0,SOLDIER(1),7);a.expr='neutral';const v=actor(-1.2,-.4);v.expr='stern';
  this.motions.push((f)=>{a.look=-.6*(1-action(f,78,16));a.wave=action(f,79,10)*1;a.expr=f>word(79)?'stern':'neutral';});
 }
 if(place==='train'){
  // Passenger carriage: warm timber walls, individual windows and brass luggage rack.
  box(p,0,-.15,0,9,.3,14,wood());box(p,0,2.6,-3.9,9,5.2,.25,material('trainwall','#966f4b',rep(beamHD(),3,2)));
  for(const x of [-3,-1,1,3]){box(p,x,2.8,-3.7,1.5,2.1,.08,material('trainview','#95b9c5'));for(const dx of [-.8,.8])box(p,x+dx,2.8,-3.6,.09,2.3,.18,timber());box(p,x,1.65,-3.55,1.75,.12,.24,timber());}
  for(const z of [-2.5,-.2]){box(p,0,.65,z,7,.25,.9,material('seat','#587364'));box(p,0,1.15,z-.35,7,1,.15,material('seat','#587364'));}
  for(const y of [3.8,4.1])bar(p,V(-4,y,-3.1),V(4,y,-3.1),.045,material('rack','#c5ad70'));for(let x=-4;x<=4;x+=.5)bar(p,V(x,3.8,-3.4),V(x,3.8,-2.8),.03,iron());
  for(let i=0;i<10;i++){const a=actor(-2.8+(i%5)*1.4,-2.3+Math.floor(i/5)*2.2,SOLDIER(i),i+1);a.mode='sit';a.root.scale.setScalar(.85);a.root.position.y=.65;a.expr='smile';const mug=cupAt(a);this.motions.push(f=>{const q=action(f,94,10);mug.position.y=1.05+q*.4;a.wave=q*.35;});}
  const v=actor(-3.5,1.6);v.expr='grin';
 }
 if(place==='hall'){
  const v=actor(-.8,.3);v.mode='march';const men=squad([-2,1.8],[.8,2.8]);men.forEach((a,i)=>this.motions.push((f)=>{const q=action(f,99,18);a.root.position.x=(i%2?1.8:-2);a.root.position.z=.8+Math.floor(i/2)*2-q*1.3;a.root.position.y=q*.5;a.mode=q<1?'march':'stand';a.expr='stern';}));
  this.motions.push((f)=>{const q=action(f,98,20);v.root.position.z=.3-q;v.root.position.y=q*.7;v.wave=.55;});
 }
 if(place==='crowd'){
  const cops=[actor(-1.25,1.9,POLICE,2),actor(1.25,1.9,POLICE,4)];cops.forEach(a=>{a.expr='stern';a.wave=.7;});for(let i=0;i<9;i++){const a=actor(-3+(i%5)*1.4,-.5-Math.floor(i/5)*1.6,townsfolk(i),i+10);a.expr='shock';a.root.scale.setScalar(.9);this.motions.push((f)=>{a.root.position.z=-.5-Math.floor(i/5)*1.6-action(f,108,15)*.45;});}
 }
 if(place==='bath'){
  const v=actor(-.65,.2);v.expr='neutral';const cop=actor(.7,0,POLICE,8);cop.expr='smile';
  const towel=dyn(box(cop.root,.49,1.1,.25,.4,.7,.08,material('towel','#eee6cf')));for(let i=0;i<3;i++)box(towel,0,-.15+i*.08,.05,.4,.015,.03,material('stripe','#758c9b'));
  const tub=cyl(p,2.1,.55,-2,1.2,.8,material('porcelain','#eee8d8'),1.4,32);tub.scale.z=.6;cyl(p,2.1,.93,-2,1.2,.03,material('bathwater','#92b8ba')).scale.z=.6;
  this.motions.push((f)=>{const q=action(f,125,12);v.wave=q*.65;cop.wave=f<word(125)?.7:undefined;cop.mode=q>.5?'stroll':'stand';cop.root.position.x=.7+q*1.3;cop.root.position.z=-q*1.6;});
 }
 if(['mayor','warrant'].includes(place)){
  desk(p,0,-.3,4.2);const v=actor(1.1,.6);v.expr='stern';const m=actor(-1,-1.5,MAYOR,17);m.expr='shock';const men=[actor(-2.4,-2.7,SOLDIER(2),2),actor(1.4,-2.7,SOLDIER(0),3)];
  this.motions.push((f)=>{if(place==='mayor'){m.wave=action(f,128,10)*.7;v.look=-.6;}else{v.wave=action(f,135,10)*.8;m.wave=undefined;m.lean=-action(f,138,14)*8;men.forEach(a=>a.expr='stern');}});
  lettering(p,'MAYOR',0,4.7,-4.05,2,.5);
 }
 if(['cash','receipt'].includes(place)){
  desk(p,0,0,4.5);const v=actor(1.15,-1.4);const c=actor(-1.45,-1.5,CLERK,10);c.expr='nervous';v.expr='grin';
  const sack=dyn(bag(p,.7,1.24,.2));
  box(p,-.8,1.42,-.2,1.25,.4,.7,iron());const lid=dyn(box(p,-.8,1.65,-.54,1.3,.1,.75,iron()));
  const coins:T.Mesh[]=[];for(let i=0;i<18;i++){const o=cyl(p,0,0,0,.095,.035,material('coins','#d8b754',undefined,true),.095,12);dyn(o);coins.push(o);}
  this.motions.push((f)=>{const q=action(f,141,14);lid.rotation.x=-q*1.3;coins.forEach((o,i)=>{const t=clamp((f-word(144)-i*1.8)/17);o.position.set(-.7+t*1.4,1.65+Math.sin(t*Math.PI)*.8-t*.3,-.15+t*.35);o.visible=t<1;c.wave=.4;});});
  const receipt=dyn(paper(p,'RECEIPT',-.25,1.27,1,1.45,1.1));receipt.rotation.x=-Math.PI/2;
  if(place==='receipt'){
   const text=dyn(lettering(p,'von Malzahn',-.25,1.29,1.12,1.15,.27,'#e9dcc0','#45333b'));text.rotation.x=-Math.PI/2;
   const pen=dyn(bar(p,V(-.9,1.3,1),V(-.6,1.9,1.1),.035,material('quill','#f1dfbf')));
   this.motions.push((f)=>{const q=action(f,146,37);text.scale.x=Math.max(.001,q);text.visible=q>.01;pen.position.x=q*1.1;pen.position.z=Math.sin(q*Math.PI*10)*.025;});
  }
 }
 if(place==='guard'){
  const a=actor(-1.7,-.2,SOLDIER(0),2),b=actor(1.7,-.2,SOLDIER(1),3);a.expr=b.expr='stern';const v=actor(-1,2);v.mode='stroll';v.side=true;
  lettering(p,'30 MINUTES',0,5.9,-1.2,3.8,.55);
  this.motions.push((f,u)=>{v.root.position.x=-1+u*7;v.root.position.z=2+u;v.wave=f<word(162)?.5:undefined;});
 }
 if(place==='escape'){
  ground(p);house(p,0,-13,14,7,3);for(const x of [-6,6]){box(p,x,2.8,-1,.2,5.6,.2,timber());bar(p,V(x,5.5,-1),V(x>0?4:-4,4.4,-1),.14,timber());}
  box(p,0,5.5,-1,16,.25,5,material('stationroof','#4a5866'));lettering(p,'KÖPENICK',0,4,-1.7,4.5,.7);
  box(p,0,.25,-4,30,.5,3,stone());for(const z of [-6,-7.2])bar(p,V(-30,.05,z),V(30,.05,z),.09,iron());
  const v=actor(-2,0);v.side=true;v.mode='march';
  const tex=ctex('steam',128,128,g=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(235,237,227,.9)');gr.addColorStop(1,'rgba(235,237,227,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
  for(let i=0;i<12;i++){const o=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));o.layers.set(NOINK);o.userData.dynamic=true;p.add(o);this.motions.push((f,u)=>{o.position.set(-6+i*.8+u*3,1.5+(i%3)*.5,1.2);o.scale.setScalar(1.6+u*1.5);(o.material as T.SpriteMaterial).opacity=Math.sin(ease(u)*Math.PI)*.8;});}
  this.motions.push((f,u)=>{v.root.position.x=-2+u*8;v.root.visible=u<.7;});
 }
 if(['wanted','tip'].includes(place)){
  desk(p,0,-.3,4.4);lettering(p,'CRIMINAL INVESTIGATION',0,4.7,-4.05,5,.6);
  const cop=actor(-1,-1.6,POLICE,4);cop.expr='nervous';const doc=dyn(paper(p,'WANTED',.7,2.6,-2,1.6,2.1));
  lettering(p,'?',.7,2.65,-1.97,.8,.7,'#e9dcc0','#44333b');
  if(place==='tip'){const tip=actor(1.7,.7,{...CIVIL,moustache:'#574135',hat:'hair',hair:'#573d30',jacket:'#67544b',build:'adult'},14);tip.expr='grin';this.motions.push((f)=>{tip.wave=action(f,182,12)*.75;cop.expr=f>word(183)?'shock':'neutral';});}
 }
 if(place==='breakfast'){
  desk(p,0,0,2.7);const v=actor(-.5,-1.2,CIVIL);v.mode='sit';v.root.position.y=.7;v.expr='neutral';const cup=dyn(mug(p,.45,1.24,.1));
  const plate=cyl(p,-.45,1.27,.2,.37,.035,material('plate','#ece2c6'),.37,24);box(p,-.45,1.33,.2,.4,.12,.25,material('bread','#b57c42'));
  const a=actor(2.8,1.2,POLICE,6),b=actor(3.7,-.3,POLICE,7);
  this.motions.push(f=>{const q=action(f,188,10);v.expr=q>.2?'shock':'neutral';cup.position.y=1.24+.35*(1-q);a.root.position.x=2.8-q*1.5;b.root.position.x=3.7-q;});
 }
 if(place==='prison'){
  const v=actor(0,-1,CIVIL);v.expr='nervous';const gate=dyn(bars(p,.9));this.motions.push((f,u)=>{gate.position.x=3*(1-ease(u*3));v.lean=-5;});
  box(p,-3,.5,-2,1.5,.3,2.8,wood());lettering(p,'4 YEARS',0,4.8,-4,3,.7);
 }
 if(place==='laugh'){
  box(p,0,1,-1,3.8,2,1.2,wood());lettering(p,'EXTRA!  EXTRA!',0,3.7,-1,4,.65);
  for(let i=0;i<6;i++){const a=actor(-3+(i%3)*2.5,1.5-Math.floor(i/3)*2.1,townsfolk(i+2),i+10);a.expr='laugh';const news=paper(a.root,'THE FAKE CAPTAIN',0,1.1,.3,.85,1.1);news.userData.dynamic=true;this.motions.push((f,u)=>{a.lean=Math.sin(f*.13+i)*4;a.wave=.25;});}
 }
 if(place==='pardon'){
  desk(p,0,0,4.2);const k=actor(0,-1.4,KAISER,12);k.expr='smile';
  const doc=dyn(paper(p,'PARDON',.1,1.27,.7,1.7,1.15));doc.rotation.x=-Math.PI/2;
  const seal=dyn(cyl(p,.55,1.3,.75,.18,.045,material('seal','#ad3e3e'),.18,24));
  lettering(p,'WILHELM II',0,4.6,-4.02,3,.6);
  this.motions.push(f=>{const q=action(f,204,10);seal.visible=q>.2;k.wave=q*.5;});
 }
 if(place==='stage'){
  box(p,0,-.1,0,16,.3,15,wood());box(p,0,3.8,-3.3,13,7.6,.1,material('backdrop','#bda27b'));
  // Clearly painted scenery rather than recycling the actual town hall geometry.
  lettering(p,'THE CAPTAIN OF KÖPENICK',0,5.5,-3,9,.85);for(const x of [-4,-2,0,2,4]){box(p,x,2.4,-3,1.3,2.7,.1,material('paintedwindow','#687780'));box(p,x,3.8,-2.9,1.5,.15,.1,stone());}
  const curtain=material('velvet','#963b4f');for(const x of [-3.7,3.7])for(let i=0;i<7;i++){const o=cyl(p,x+(i-3)*.16,3.5,-.8,.25,7,curtain);o.scale.z=.6;}
  box(p,0,6.7,-.8,13,.7,.4,curtain);for(let x=-5;x<=5;x+=1)cyl(p,x,.15,2.4,.16,.14,material('footlight','#ffe4a1'));
  const v=actor(0,0);v.expr='grin';this.motions.push((f,u)=>{v.wave=f<word(210)?.9:undefined;v.lean=f>word(210)?Math.sin(clamp((f-word(210))/35)*Math.PI)*18:0;});
  for(let i=0;i<7;i++){const x=-4.5+i*1.5;const back=material('audience-back','#333240');sphere(p,x,.65,4.5,.35,back);const torso=sphere(p,x,.12,4.5,.45,back);torso.scale.y=1.4;}
 }
 if(place==='statue'){
  cyl(p,0,.25,1,1.3,.5,stone(),1.3,24);box(p,0,.65,1,1.5,.5,1.3,material('pedestal','#8a8e82'));const v=actor(0,1,BRONZE);v.root.position.y=.9;v.expr='neutral';v.wave=.38;v.frozen=true;
  lettering(p,'WILHELM VOIGT',0,.7,1.67,1.35,.25,'#8a8e82','#d4d1b1');
  const tourist=actor(2.6,2.5,{jacket:'#cb6f47',pants:'#455b6e',boots:'#ded9cb',hat:'hair',hair:'#5d4636',skin:'#f0cfb0'},34);tourist.expr='grin';tourist.wave=.35;
  this.motions.push((f)=>{tourist.look=-.5;v.look=0;});
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
