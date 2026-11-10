import * as T from 'three';
import {V,box,cyl,sphere,bar,material,wood,timber,iron,stone,lamp,batchStatic} from '../beer-remaster/build';
import {Character,CLERK,WORKER,NEIGHBOUR} from '../beer-remaster/cast';
import {LIGHTS,LOOK} from '../beer-remaster/style/lights';
import {TONE,CHAR,untone} from '../beer-remaster/style/shade';
import {cloudHD,rep,stoneHD} from '../beer-remaster/style/paint';
import {NOINK} from '../beer-remaster/style/ink';
import {Shot,Place,CAMS,KICKS,smooth,clamp} from './story';
import {town,room,train} from './sets';
export class World {
 root=new T.Group();actors:Character[]=[];sun:T.DirectionalLight;hemi:T.HemisphereLight;sky:T.Mesh;skyM:T.ShaderMaterial;
 animations:Array<(s:Shot,f:number,u:number)=>void>=[];clouds:T.Mesh[]=[];fog=new T.Fog('#b8d0ec',35,180);
 
 constructor(public place:Place){
  this.hemi=new T.HemisphereLight('#dcecff','#b49a78',.55);this.sun=new T.DirectionalLight('#fff3e0',2.8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.025;this.root.add(this.hemi,this.sun,this.sun.target);
  this.skyM=new T.ShaderMaterial({uniforms:{c0:{value:new T.Color()},c1:{value:new T.Color()},c2:{value:new T.Color()},c3:{value:new T.Color()},c4:{value:new T.Color()},e:{value:new T.Vector4()}},vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c0,c1,c2,c3,c4;uniform vec4 e;varying vec3 vP;void main(){float a=asin(clamp(normalize(vP).y,-1.,1.));vec3 c=mix(c0,c1,smoothstep(0.,e.x,a));c=mix(c,c2,smoothstep(e.x,e.y,a));c=mix(c,c3,smoothstep(e.y,e.z,a));c=mix(c,c4,smoothstep(e.z,e.w,a));gl_FragColor=vec4(c,1.);}',side:T.BackSide,depthWrite:false,fog:false});
  this.sky=new T.Mesh(new T.SphereGeometry(420,32,16),this.skyM);this.sky.layers.set(NOINK);this.sky.renderOrder=-1;this.sky.frustumCulled=false;this.root.add(this.sky);
  for(let i=0;i<5;i++){const m=new T.Mesh(new T.PlaneGeometry(50,25),new T.MeshBasicMaterial({map:cloudHD(i,LOOK.day.cloud),transparent:true,depthWrite:false,fog:false}));m.layers.set(NOINK);m.position.set(Math.sin(i*1.3)*210,48+i*8,-140-Math.cos(i*1.3)*70);this.root.add(m);this.clouds.push(m);}
  const p=this.root;const suit={...CLERK,jacket:'#53616d',pants:'#424853',hat:'hair' as const,hair:'#282d31',skin:'#e3c3a1'};
  const hero=new Character(p,0,0,suit);this.actors.push(hero);
  const person=(x:number,z:number,outfit=suit)=>{const a=new Character(p,x,z,outfit);this.actors.push(a);return a;};
  if(place==='street'||place==='ruins'){
   town(p,place==='ruins');hero.root.position.z=-1;
   const extras=[person(-3,-9),person(3,-14),person(-2,-20)];
   // Dust bank rather than flash frames or graphic injury. Nonliteral reconstruction.
   const dust:T.Mesh[]=[];for(let i=0;i<14;i++){const m=sphere(p,Math.sin(i*4)*6,1+i%4,-8-i%5,.65+(i%3)*.25,material('dust','#a89d8d'));m.userData.dynamic=true;dust.push(m);}
   this.animations.push((s,f,u)=>{const shock=s.id===6;const q=smooth((f-296)/24);hero.expr=shock?'shock':place==='ruins'?'nervous':'neutral';hero.walk=!shock;hero.run=shock;hero.lean=shock?-12:-3;hero.wave=shock?.8:undefined;hero.root.position.set(-.6+u*.9,0,-1-u*1.2);hero.root.userData.bandage=place==='ruins';extras.forEach((a,i)=>{a.walk=true;a.run=shock;a.root.position.set((i%2?-1:1)*(2.5+i*.3),0,-8-i*4+u*(shock?3:1));a.expr=shock?'shock':'neutral';});dust.forEach((d,i)=>{d.visible=place==='ruins'||(shock&&q>0);d.position.x=Math.sin(i*4)*6+u*2;d.position.y=1+i%4+Math.sin(f*.03+i)*.15;d.scale.setScalar(place==='ruins'?.7:.3+q*1.3);});});
  }else if(place==='train'){
   const rig=train(p);hero.root.position.set(0,.7,3.8);hero.root.userData.bandage=true;
   const steam:T.Mesh[]=[];for(let i=0;i<8;i++){const d=sphere(p,0,0,0,.35,material('steam','#c7c8c3'));d.userData.dynamic=true;steam.push(d);}
   this.animations.push((s,f,u)=>{rig.position.x=-8+(f/30%6)*3;hero.walk=true;hero.expr='nervous';hero.lean=-5;hero.root.position.x=-.6+u*1.3;steam.forEach((d,i)=>{const q=((f+i*8)%70)/70;d.position.set(rig.position.x+6.4-q*3,3.5+q*2.6,0);d.scale.setScalar(.5+q*1.7);});});
  }else if(['shelter','home','office','recognition'].includes(place)){
   room(p,place);hero.root.position.set(0,0,-.5);
   const companion=person(-2.5,-1.5,{...suit,jacket:'#777361'});
   hero.root.userData.bandage=['shelter','home','office'].includes(place);
   const certificate=box(p,.5,1.25,.8,1.1,.04,.8,material('certificate','#e4dbc3'));certificate.userData.dynamic=true;certificate.visible=place==='recognition';
   for(let i=0;i<5;i++)box(p,.5,1.28,.58+i*.1,.75,.008,.016,material('certificate-ink','#5a6068'));
   const l=lamp(p,3,1.8,-1.5,true);
   this.animations.push((s,f,u)=>{hero.expr=place==='recognition'?'neutral':'nervous';hero.lean=Math.sin(f*.1)*2;hero.wave=place==='office'?.25+Math.sin(f*.18)*.25:undefined;companion.expr='neutral';companion.lean=Math.sin(f*.08+1)*3;companion.wave=place==='recognition'?.3:undefined;certificate.rotation.y=Math.sin(u*2)*.1;l.visible=s.light==='golden'||place==='shelter';});
  }else{
   // Public testimony / collective survival, then remembrance, not a victory pose.
   town(p,false);hero.root.position.set(0,0,0);
   if(place==='people'){for(let i=0;i<6;i++){const a=person((i%3-1)*2.1,-2-Math.floor(i/3)*2.4,{...suit,jacket:['#6a7774','#7e7064','#595e75'][i%3]});a.root.userData.bandage=i<2;}}
   if(place==='peace'){hero.outfit.hair='#b4b4ac';hero.outfit.jacket='#6d7476';box(p,0,.9,.9,1.5,.16,.7,wood());for(const x of [-.55,.55])box(p,x,.4,.9,.12,.8,.12,timber());const mic=cyl(p,.45,1.4,.8,.045,.65,iron());sphere(p,.45,1.75,.8,.09,iron());}
   if(place==='lanterns'){const water=box(p,0,-.08,-8,10,.12,45,material('river','#627d8c',rep(stoneHD(),4,10)));for(let i=0;i<12;i++){const l=lamp(p,Math.sin(i*3.2)*3,.55,-i*2.4,true);l.userData.dynamic=true;this.animations.push((s,f,u)=>{l.position.z=-i*2.4+u*2;l.position.y=.5+Math.sin(f*.04+i)*.035;});}hero.root.position.set(2,0,1);}
   this.animations.push((s,f,u)=>{hero.expr=place==='peace'?'stern':'neutral';hero.wave=place==='peace'?.2+Math.sin(f*.12)*.2:undefined;hero.lean=Math.sin(f*.065)*2;this.actors.slice(1).forEach((a,i)=>{a.walk=place==='people';a.lean=Math.sin(f*.09+i)*2;});});
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
  const u=clamp((f-s.a)/(s.b-s.a));this.animations.forEach(fn=>fn(s,f,u));this.actors.forEach(a=>{a.update(f,cam);if(a.root.userData.bandage){const c=a.ctx;c.save();c.fillStyle="#ddd5c2";c.strokeStyle="#5d5554";c.lineWidth=3;c.fillRect(199,232,63,128);c.strokeRect(199,232,63,128);for(let i=0;i<4;i++){c.beginPath();c.moveTo(200,245+i*28);c.lineTo(260,259+i*28);c.stroke();}c.restore();a.tex.needsUpdate=true;}});return focus;
 }
}
