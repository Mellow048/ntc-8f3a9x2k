import * as T from 'three';
import {V,box,cyl,sphere,bar,material,wood,timber,iron,stone,brickM,street,warehouse,barrel,lamp,VatRig,batchStatic} from './build';
import {Porter,Wake} from './water';
import {Character,CLERK,NEIGHBOUR,WORKER} from './cast';
import {LIGHTS,LOOK} from './style/lights';
import {TONE,CHAR,untone} from './style/shade';
import {cloudHD,rep,planksHD,stoneHD,beamHD} from './style/paint';
import {NOINK} from './style/ink';
import {Shot,Place,CAMS,KICKS,smooth,clamp} from './story';

export class World {
 root=new T.Group();actors:Character[]=[];sun:T.DirectionalLight;hemi:T.HemisphereLight;sky:T.Mesh;skyM:T.ShaderMaterial;
 animations:Array<(s:Shot,f:number,u:number)=>void>=[];clouds:T.Mesh[]=[];fog=new T.Fog('#b8d0ec',35,180);
 fluid?:Porter;vat?:VatRig;
 constructor(public place:Place){
  this.hemi=new T.HemisphereLight('#dcecff','#b49a78',.55);this.sun=new T.DirectionalLight('#fff3e0',2.8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.025;this.root.add(this.hemi,this.sun,this.sun.target);
  this.skyM=new T.ShaderMaterial({uniforms:{c0:{value:new T.Color()},c1:{value:new T.Color()},c2:{value:new T.Color()},c3:{value:new T.Color()},c4:{value:new T.Color()},e:{value:new T.Vector4()}},vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c0,c1,c2,c3,c4;uniform vec4 e;varying vec3 vP;void main(){float a=asin(clamp(normalize(vP).y,-1.,1.));vec3 c=mix(c0,c1,smoothstep(0.,e.x,a));c=mix(c,c2,smoothstep(e.x,e.y,a));c=mix(c,c3,smoothstep(e.y,e.z,a));c=mix(c,c4,smoothstep(e.z,e.w,a));gl_FragColor=vec4(c,1.);}',side:T.BackSide,depthWrite:false,fog:false});
  this.sky=new T.Mesh(new T.SphereGeometry(420,32,16),this.skyM);this.sky.layers.set(NOINK);this.sky.renderOrder=-1;this.sky.frustumCulled=false;this.root.add(this.sky);
  for(let i=0;i<5;i++){const m=new T.Mesh(new T.PlaneGeometry(50,25),new T.MeshBasicMaterial({map:cloudHD(i,LOOK.day.cloud),transparent:true,depthWrite:false,fog:false}));m.layers.set(NOINK);m.position.set(Math.sin(i*1.3)*210,48+i*8,-140-Math.cos(i*1.3)*70);this.root.add(m);this.clouds.push(m);}
  const p=this.root;
  const actor=(x:number,z:number,o=CLERK)=>{const a=new Character(p,x,z,o);this.actors.push(a);return a;};
  if(place==='street'){
   street(p);this.fluid=new Porter(p,9.1,90);this.fluid.mesh.position.z=-24;
   const woman=actor(-2.7,-4.2,NEIGHBOUR);const helper=actor(-1.1,-1.8,WORKER);const distant=actor(2.9,-10,CLERK);const wakes=[woman,helper,distant].map(()=>new Wake(p));
   const floating:Array<{o:T.Object3D;x:number;z:number}>=[];
   for(let i=0;i<12;i++){const x=Math.sin(i*4.7)*3.6,z=-27+i*3.2;const o=i%4===0?barrel(p,x,z,.35):box(p,x,.4,z,.14,.12,1.1+(i%3)*.4,wood());if(i%4===0)o.rotation.z=Math.PI/2;o.userData.dynamic=true;floating.push({o,x,z});}
   // Broken masonry is scattered at the edges, not in front of faces.
   const rubble=new T.Group();rubble.userData.dynamic=true;p.add(rubble);for(let i=0;i<32;i++){const o=box(rubble,(i%2?1:-1)*(3.8+(i%4)*.2),.2+(i%3)*.12,-i*.42,.3,.22,.5,i%4?brickM():stone());o.rotation.set(.2*i,.6*i,.3*i);}
   const lantern=lamp(p,-1.5,1.1,-.8,true);lantern.userData.dynamic=true;
   this.animations.push((s,f,u)=>{
    const t=f/30;const aftermath=s.id>=7;const rescue=s.id===10;
    // Feet stay below the surface. Actors fight the current; they NEVER rise
    // on top of it. The material also clips their camera-facing cards at water.
    const rush=!aftermath;const bob=Math.sin(f*.34)*.07;
    woman.root.visible=!rescue;woman.expr=rush?'shock':'nervous';woman.run=rush;woman.walk=aftermath;woman.wave=rush?.8:undefined;
    woman.root.position.set(-2.7+Math.sin(f*.09)*.1,-.38+bob,-4.2+u*(rush?2.6:.9));woman.lean=rush?-12+Math.sin(f*.2)*4:-4;
    helper.root.visible=aftermath;helper.expr=rescue?'stern':'nervous';helper.walk=true;helper.run=false;helper.wave=rescue?.6:undefined;
    helper.root.position.set(-1.1+u*.65,-.36+bob,-1.8-u*(rescue?1.5:.8));helper.lean=-7+Math.sin(f*.15)*3;
    distant.expr=rush?'shock':'stern';distant.run=rush;distant.walk=aftermath;distant.wave=rush?.9:undefined;distant.lean=rush?10:-3;
    distant.root.position.set(2.9-u*1.1,-.35-bob,-10+u*3.4);
    rubble.visible=aftermath;lantern.visible=rescue;
    lantern.position.x=-1.5+u*.65;lantern.position.z=-.8-u*1.5;
    const front=s.id===1?-16+u*23:s.id===6?-25+u*35:30;
    const level=aftermath?.78:.68,energy=aftermath?.3:.85;
    this.fluid!.update(t,front+24,level,energy);
    [woman,helper,distant].forEach((a,i)=>{a.wet(level,t,front,energy);wakes[i].update(f+i*7,a.root.position.x,a.root.position.z,this.fluid!,a.root.visible,rush?1.4:.65);});
    floating.forEach(({o,x,z},i)=>{o.visible=!rescue||i<4;o.position.set(x+Math.sin(t*.8+i)*.12,this.fluid!.surfaceAt(x,z+(aftermath?0:u*10))+.025,z+(aftermath?0:u*10));o.rotation.y=i*.8+t*.1;});
   });
  }
  if(place==='warehouse'){
   this.vat=warehouse(p);const worker=actor(3.8,3,WORKER);const v=this.vat;const wake=new Wake(p);
   const spilled=new Porter(p,19,22);spilled.mesh.position.z=1;
   const drops:T.Mesh[]=[];for(let i=0;i<40;i++){const o=sphere(p,0,0,0,.035+(i%5)*.012,material('beer-drop','#875022',undefined,true));o.userData.dynamic=true;drops.push(o);}
   this.animations.push((s,f,u)=>{
    worker.expr=f>=359?'shock':s.id===2?'neutral':'nervous';worker.wave=f>=359?.8:undefined;worker.lean=f>=396?-14:Math.sin(f*.12)*2;worker.run=f>=359;worker.walk=f<359;
    const escape=clamp((f-359)/64);worker.root.position.set(3.8+escape*1.3,escape>.6?-.2:0,3+escape*2.8);worker.wet(f>=399?.3:-100,f/30,0,0);
    const fail=smooth((f-359)/18);const burst=smooth((f-396)/22);
    v.bands[2].position.y=3.13-fail*1.9;v.bands[2].rotation.z=fail*.19;
    const active=s.id===4;spilled.mesh.visible=active;drops.forEach(o=>o.visible=active&&f>396);
    const q=active?burst:0;
    v.staves.forEach((o,i)=>{const a=i*Math.PI*2/36;const k=Math.max(0,Math.sin(a));o.position.set(Math.sin(a)*q*k*2.7,-q*k*.8,Math.cos(a)*q*k*3);o.rotation.z=-q*Math.sin(a)*.55;o.rotation.x=q*Math.cos(a)*.3;});
    v.bands.forEach((b,i)=>{if(i!==2){b.rotation.z=q*Math.sin(i)*.35;b.position.y=.65+i*1.24-q*i*.1;}});
    spilled.update(f/30,-7+q*19,.05+q*.35,q*1.7);wake.update(f,worker.root.position.x,worker.root.position.z,spilled,active&&f>=399,1.4);
    drops.forEach((o,i)=>{const tt=clamp((f-396-i%9)/25),a=i*2.4;o.position.set(Math.sin(a)*tt*6,Math.max(.1,2.4+Math.sin(tt*Math.PI)*3.2-tt*4),1+tt*(3+(i%5)));o.scale.setScalar(1-tt*.8);});
   });
  }
  if(place==='wall'){
   box(p,0,-.24,0,30,.4,40,material('wall-cobbles','#ffffff',rep(stoneHD(),8,12)));
   const bricks:T.Mesh[]=[];for(let y=0;y<9;y++)for(let x=0;x<13;x++){const xx=(x-6)*.53+(y%2)*.25;const b=box(p,xx,.25+y*.34,-2,.5,.30,.48,brickM());b.userData.dynamic=true;bricks.push(b);}
   for(const x of [-4,4]){box(p,x,3,-2,1,6,1,brickM());box(p,x,6.2,-2,1.3,.25,1.3,stone());}
   box(p,0,6,-2,9,.5,1.1,timber());for(let i=0;i<6;i++)box(p,(i-2.5)*1.1,4.5,-2,.85,2.5,.1,material('wall-window','#698395'));
   const w=new Porter(p,10,30);w.mesh.position.z=0;
   this.animations.push((s,f,u)=>{const q=smooth((f-431)/21);w.update(f/30,-5+u*19,.08+q*.3,q*1.6);bricks.forEach((b,i)=>{const x=(i%13-6)*.53+(Math.floor(i/13)%2)*.25,y=.25+Math.floor(i/13)*.34;const central=Math.max(0,1-Math.abs(x)/4);const k=q*central;b.position.set(x+k*Math.sin(i*3)*1.4,Math.max(.16,y*(1-k)+Math.sin(k*Math.PI)*1.5),-2+k*(3+i%5));b.rotation.set(k*(i%4),k*i*.1,k*Math.sin(i));});});
  }
  if(place==='cellar'){
   box(p,0,-.35,0,9,.5,9,material('cellar-stone','#ffffff',rep(stoneHD(),4,4)));
   box(p,0,2.1,-3.3,9,4.6,.5,brickM());box(p,-4.3,2,0,.4,4.4,7,brickM());
   for(const z of [-2,1])box(p,0,4.2,z,8.7,.22,.28,timber());
   for(let k=0;k<8;k++)box(p,2.8,k*.4,2-k*.58,1.9,.4,.7,stone());
   box(p,0,1,-1.5,2,.14,1.3,wood());for(const x of [-.8,.8])for(const z of [-1,-2])box(p,x,.5,z,.1,1,.1,timber());
   const chair=box(p,-1.5,.6,0,.7,.12,.8,wood());chair.userData.dynamic=true;box(p,-1.5,1, -.35,.7,.9,.09,wood());for(const x of [-1.8,-1.2])for(const z of [-.3,.3])box(p,x,.28,z,.07,.56,.07,timber());
   const w=new Porter(p,8.1,6);w.mesh.position.z=-.2;
   this.animations.push((s,f,u)=>{w.update(f/30,-2+u*8,.05+u*.72,.18);chair.rotation.z=Math.sin(u*3)*.05;});
  }
  if(place==='memorial'){
   box(p,0,-.2,0,18,.3,16,material('memorial-cobble','#ffffff',rep(stoneHD(),6,6)));
   box(p,0,.65,0,5,.35,2.4,stone());box(p,0,.3,0,5.4,.3,2.8,stone());
   box(p,0,3.3,-3.5,12,7,.5,brickM());for(const x of [-3.9,3.9])box(p,x,3.3,-3.1,.4,7,.7,stone());
   for(let i=0;i<8;i++){const x=(i%4-1.5)*.74,z=(Math.floor(i/4)-.5)*.8;const h=.46+(i%3)*.14;cyl(p,x,.85+h/2,z,.085,h,material('wax','#efe2bf'));const flame=sphere(p,x,.9+h,z,.075,new T.MeshBasicMaterial({color:new T.Color(4,1.8,.3)}));flame.userData.dynamic=true;flame.scale.y=1.9;this.animations.push((s,f)=>flame.scale.y=1.8+Math.sin(f*.21+i)*.17);}
  }
  if(place==='office'){
   box(p,0,-.2,0,15,.3,16,material('office-floor','#ffffff',rep(planksHD(),4,4)));box(p,0,3,-4.5,15,6,.4,material('office-wall','#8c9a9a',rep(stoneHD(),4,2)));
   for(const x of [-4,4]){box(p,x,3.6,-4.22,2.4,3.3,.1,material('office-glass','#abc6d7'));for(const dx of [-1.25,0,1.25])box(p,x+dx,3.6,-4.05,.09,3.5,.12,timber());box(p,x,3.6,-4.04,2.5,.08,.12,timber());box(p,x,1.9,-4.05,2.7,.16,.5,stone());}
   // Fully dressed desk: books, quill, ledger, stamped paper, wax and modest coin stack.
   box(p,0,1.35,.6,4.1,.2,2.2,wood());for(const x of [-1.8,1.8])for(const z of [-.3,1.5])box(p,x,.65,z,.18,1.3,.18,timber());
   const a=actor(-1.1,-1.1,CLERK),b=actor(1.15,-1.2,{...CLERK,jacket:'#4e6573',hat:'hair',hair:'#61564f'});a.expr=b.expr='neutral';
   for(let i=0;i<3;i++)box(p,-1.25,1.5+i*.1,.8,.8,.1,.6,material('ledger'+i,['#644953','#52665f','#795b45'][i]));
   box(p,.15,1.48,.7,1.2,.025,.85,material('paper','#e4d7b7'));const ink=cyl(p,.8,1.57,.8,.12,.18,iron());bar(p,V(.8,1.62,.8),V(1.1,2.05,.75),.025,material('quill','#e7dfcc'));
   const coins:T.Mesh[]=[];for(let i=0;i<7;i++)coins.push(cyl(p,.65,1.49+i*.055,.1,.14,.05,material('gold-coin','#b69450',undefined,true)));
   lamp(p,-2,2.4,.5,true);box(p,0,.35,-4,2,.5,.7,wood());
   coins.forEach(c=>c.userData.dynamic=true);
   this.animations.push((s,f,u)=>{a.wave=.45+Math.sin(f*.19)*.35;a.lean=Math.sin(f*.1)*4;b.lean=-5+Math.sin(f*.12)*3;b.wave=u>.5?.3:undefined;b.expr=u>.6?'shock':'neutral';coins.forEach((c,i)=>{const fall=clamp((u-.35-i*.018)*8);c.position.y=1.49+i*.055+(1-fall)*1.2+Math.abs(Math.sin(fall*Math.PI*3))*(1-fall)*.2;});});
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
  const r=this.place==='street'?32:17;const sc=this.sun.shadow.camera;sc.left=-r;sc.right=r;sc.top=r;sc.bottom=-r;sc.near=1;sc.far=220;sc.updateProjectionMatrix();
  TONE.uLitCol.value.set(...L.lit);TONE.uShadeCol.value.set(...L.shade);TONE.uShadeLift.value.set(...L.lift);TONE.uLambert.value=L.lambert;TONE.uSideK.value=L.sideK;TONE.uTerm.value=L.term;TONE.uBounce.value.set(...K.bounce);TONE.uSat.value=K.sat;
  CHAR.uCharTint.value.set(...L.charTint);CHAR.uCharShade.value=L.charShade;CHAR.uGrad.value=L.charGrad;CHAR.uBodyGrad.value=L.bodyGrad;CHAR.uSideTint.value.set(...L.sideTint);
  K.sky.c.forEach((h,i)=>untone(h,this.skyM.uniforms['c'+i].value));const e=K.sky.e.map(v=>v*Math.PI/180);this.skyM.uniforms.e.value.set(e[1],e[2],e[3],e[4]);this.sky.position.copy(cam.position);
  untone(L.fog,this.fog.color);this.fog.near=this.place==='street'?28:35;this.fog.far=this.place==='street'?130:180;scene.fog=this.fog;scene.background=null;this.clouds.forEach(cl=>cl.lookAt(cam.position));
  const u=clamp((f-s.a)/(s.b-s.a));this.animations.forEach(fn=>fn(s,f,u));this.actors.forEach(a=>a.update(f,cam));return focus;
 }
}
