import * as THREE from 'three';
import type {BridgeAssets} from '../bridge-remaster/assets';
import {box,ball,cylinder,grp,rod,ring,lathe,actor,sky,cityBuilding,tree,lamp,texturedBox,pavementTexture,asphaltTexture} from './art';
import {cityHall} from './building';
import {SHOTS,TOTAL,smooth,seismicMotion,jellyMotion,type Kind} from './story';

type Tick=(f:number)=>void;
function vehicle(p:THREE.Object3D,a:BridgeAssets,i:number,x:number,z:number,flip=false){const g=grp(p,x,0,z);const model=a[i%a.length].clone(true);model.scale.multiplyScalar(1.15);if(flip)model.rotation.y=Math.PI;g.add(model);return g;}
function civicCenter(g:THREE.Group,assets:BridgeAssets){
 texturedBox(g,85,.2,85,pavementTexture(),0,-.16,0,[24,24]);
 // Civic plaza axial paths, clipped lawns and a real kerbed street.
 for(const x of [-6.7,6.7]){box(g,6.8,.07,12,'#8c9f7e',x,-.005,13);for(const z of [7,19])box(g,6.9,.12,.14,'#c7c3b3',x,.03,z);}
 texturedBox(g,80,.08,7.7,asphaltTexture(),0,-.04,-11,[10,1]);
 for(let x=-38;x<=38;x+=2)box(g,1,.012,.07,'#e7ddba',x,.015,-11);
 for(const z of [-6.9,-15.1])box(g,80,.15,.3,'#bfc1b5',0,0,z);
 for(const x of [-11.5,11.5]){for(let z=0;z<23;z+=5){tree(g,x,z,1.1);lamp(g,x+(x<0?1:-1),z+2.5);} }
 // Varied civic blocks have windowed masonry facades, ledges and rooftop plant.
 for(let i=0;i<12;i++){const x=-29+i*5.3;cityBuilding(g,x,-23,4.6,4.6+(i*7%6)*.65,5,i+4);}
 for(const x of [-20,20])for(let z=-10;z<=18;z+=9)cityBuilding(g,x,z,7,5.4+(z+10)*.03,6,z+14);
 // Benches: slats, legs, arms. Bollards, flower beds and civic flagpoles.
 for(const x of [-4.2,4.2])for(const z of [9,15]){const b=grp(g,x,0,z);for(let i=0;i<5;i++)box(b,1.65,.055,.065,'#8a8067',0,.44,-.18+i*.09);for(let i=0;i<3;i++)box(b,1.65,.055,.065,'#8a8067',0,.65+i*.1,-.23);for(const d of [-.62,.62]){box(b,.07,.44,.33,'#61706b',d,.22,0);rod(b,[d,.45,-.22],[d,.92,-.27],.03,'#61706b');}}
 for(const x of [-3.4,3.4])for(let z=6.2;z<18;z+=3)cylinder(g,.06,.57,'#687570',x,.28,z);
 for(const x of [-9.7,9.7]){box(g,1.5,.45,1.2,'#c3beab',x,.22,5.2);for(let i=0;i<7;i++){const q=ball(g,.17,'#758c65',x+Math.sin(i*2)*.52,.56,5.2+Math.cos(i*2)*.37);q.scale.y=.7;}}
 const cars=[vehicle(g,assets,0,-10,-9),vehicle(g,assets,1,12,-12.7,true)];
 return (f:number)=>{cars[0].position.x=-25+((f/30*1.15+17)%50);cars[1].position.x=25-((f/30*.9+13)%50);};
}
function hallSet(g:THREE.Group,assets:BridgeAssets,kind:Kind):Tick {
 sky(g);const foundation=grp(g);const road=civicCenter(foundation,assets);const building=cityHall(g);
 const guide=kind==='guide'?actor(g,1.1,0,5.2,'engineer',1.05,'grin'):undefined;
 const cracks=grp(building);for(const x of [-4.5,3.7]){rod(cracks,[x,2.9,3.71],[x+.2,2.45,3.72],.017,'#665d58');rod(cracks,[x+.2,2.45,3.72],[x-.08,2.13,3.72],.017,'#665d58');rod(cracks,[x-.08,2.13,3.72],[x+.13,1.8,3.72],.017,'#665d58');}cracks.visible=false;
 return f=>{
  road(f);guide?.animate(f);
  const m=seismicMotion(f);foundation.position.x=m.ground;
  if(kind==='history'){building.position.x=m.ground;building.rotation.z=.007*smooth(f,536,552)*Math.sin(f*.22)*(1-smooth(f,574,589));cracks.visible=f>=553;}
  else {building.position.x=m.building;building.rotation.z=0;}
 };
}
// Layered rubber/steel isolator. Both bolted end plates stay fixed to their own
// structures; intermediate shims translate linearly to show rubber shear.
function isolator(p:THREE.Object3D,x:number,y:number,z:number,scale=1){
 const g=grp(p,x,y,z);g.scale.setScalar(scale);
 const bottom=grp(g),top=grp(g);box(bottom,1.17,.15,1.17,'#819291',0,.08,0);box(top,1.17,.15,1.17,'#a8b4ac',0,1.07,0);
 const layers:{rubber:THREE.Mesh;shim:THREE.Mesh;original:Float32Array;y:number}[]=[];
 for(let i=0;i<9;i++){
  const y=.22+i*.087;
  const rubber=cylinder(g,.47,.07,'#424e52',0,y,0);
  const shim=cylinder(g,.48,.017,'#a7b1aa',0,y+.042,0);
  layers.push({rubber,shim,original:new Float32Array(rubber.geometry.getAttribute('position').array),y});
 }
 for(const dx of [-.44,.44])for(const dz of [-.44,.44]){cylinder(bottom,.043,.08,'#b3b9ad',dx,.19,dz);cylinder(top,.043,.08,'#d3d3bb',dx,1.18,dz);}
 // On macro shots the column and foundation seats make the load path unmistakable.
 return (a:number,b:number)=>{
  bottom.position.x=a;top.position.x=b;
  // Rubber shears continuously through its thickness; steel shims stay rigid.
  // Source vertices are retained so out-of-order renders never accumulate deformation.
  for(const {rubber,shim,original,y} of layers){
   const position=rubber.geometry.getAttribute('position') as THREE.BufferAttribute;
   for(let i=0;i<position.count;i++)position.setX(i,original[i*3]+a+(b-a)*(y+original[i*3+1]-.185)/.78);
   position.needsUpdate=true;rubber.geometry.computeVertexNormals();
   shim.position.x=a+(b-a)*(y+.042-.185)/.78;
  }
 };
}
function cutawaySet(g:THREE.Group,assets:BridgeAssets):Tick {
 sky(g);box(g,48,.35,38,'#b6b8a5',0,-.38,-4);const foundation=grp(g),upper=grp(g);
 box(foundation,14.6,.3,6.8,'#8e9b99',0,.04,0);box(foundation,15.2,.5,7.4,'#b0a999',0,-.35,0);
 // Explicit excavation edge in front, with retaining wall and concrete floor.
 box(g,20,1,1.2,'#b8aa91',0,-.55,5.4);box(g,20,.18,.2,'#cec4ae',0,0,4.9);
 const building=cityHall(upper);building.scale.setScalar(.72);building.position.y=1.62;
 box(upper,13.9,.24,5.9,'#acb4ac',0,1.49,0);
 const bearings:ReturnType<typeof isolator>[]=[];
 for(const x of [-5.5,-2.75,0,2.75,5.5])for(const z of [-2,2]){bearings.push(isolator(g,x,.22,z,.78));box(upper,.62,.35,.62,'#bebeb0',x,1.2,z);}
 for(let i=0;i<8;i++)box(g,.16,.035,.07,'#888d83',-8+i*.23,.12,4.92);
 // Distant windows retain architectural context rather than a floating model.
 for(let i=0;i<9;i++)cityBuilding(g,-21+i*5.3,-19,4.6,4.8+(i%3),4,i+8);
 const a=vehicle(g,assets,0,-9,-9);
 return f=>{const m=seismicMotion(f);foundation.position.x=m.ground;upper.position.x=m.building;for(const update of bearings)update(m.ground/.78,m.building/.78);a.position.x=-14+((f/30+8)%28);};
}
function bearingSet(g:THREE.Group,layersOnly:boolean):Tick {
 sky(g);box(g,20,.3,17,'#bdc0b4',0,-.32,0);const bottom=grp(g),top=grp(g);
 box(bottom,3.8,.35,3.1,'#9aa5a1',0,-.02,0);box(bottom,2.5,.22,2.1,'#b8bdb1',0,.24,0);
 const deform=isolator(g,0,.37,0,1.42);
 box(top,2.1,.32,2.1,'#c5c7b7',0,2.1,0);box(top,1.12,2.8,1.12,'#c4c1b0',0,3.62,0);box(top,4.2,.27,2.7,'#adb6ac',0,4.92,0);
 // Inspection-gallery back wall: pipes, seams, warm practical lights.
 box(g,14,5,.3,'#c3c8bc',0,2.4,-4.6);
 for(let x=-6;x<=6;x+=2){box(g,.035,4.8,.035,'#9da89d',x,2.4,-4.42);}
 for(const y of [3.7,4.05])rod(g,[-6,y,-4.25],[6,y,-4.25],.065,'#798e8a');
 for(const x of [-3,3]){box(g,.7,.12,.3,'#919b91',x,3.15,-4.12);box(g,.58,.035,.24,'#eee2bb',x,3.08,-4.1);}
 return f=>{const m=seismicMotion(f);let a=m.ground*1.8,b=m.building*1.8;
  // The hook starts with the actual isolator, at rest: no fake spring bouncing.
  if(f<131){a=0;b=0;}
  if(layersOnly){a=0;b=0;}
  bottom.position.x=a;top.position.x=b;deform(a/1.42,b/1.42);
 };
}
function jellySet(g:THREE.Group):Tick {
 sky(g);box(g,20,.25,18,'#b9ad95',0,-.35,0);box(g,18,7,.3,'#d3d9cd',0,3,-5);
 for(const x of [-3.8,3.8]){box(g,2.8,2.8,.16,'#b5c4c5',x,3.2,-4.79);box(g,2.5,2.5,.08,'#92b6c5',x,3.2,-4.67);box(g,.06,2.5,.1,'#e3ded0',x,3.2,-4.6);}
 const table=grp(g),tray=grp(g);box(table,5,.18,3.25,'#a78d69',0,1.08,0);
 for(const x of [-2.1,2.1])for(const z of [-1.2,1.2])box(table,.17,1.1,.17,'#87928b',x,.49,z);
 box(tray,2.6,.085,1.9,'#9baca8',0,1.23,0);for(const z of [-.94,.94])box(tray,2.6,.11,.055,'#c8d0c5',0,1.29,z);for(const x of [-1.27,1.27])box(tray,.055,.11,1.9,'#c8d0c5',x,1.29,0);
 // Ceramic bowl with a real curved profile and a scalloped jelly inside.
 lathe(tray,[[.05,0],[.4,.03],[.64,.18],[.79,.39],[.8,.44],[.73,.44],[.69,.3],[.54,.15],[.05,.08]],'#e0ded0',0,1.28,0);
 ring(tray,.77,.035,'#b8c8c0',0,1.72,0);
 const jelly=grp(tray,0,1.68,0);lathe(jelly,[[.59,0],[.58,.16],[.49,.44],[.35,.6],[.09,.67],[0,.67]],'#c76c62');
 for(let i=0;i<10;i++){const a=i*Math.PI/5;const q=ball(jelly,.14,'#cf7669',.43*Math.cos(a),.22,.43*Math.sin(a));q.scale.set(.65,1.75,.65);}
 const guide=actor(g,-2.4,0,.4,'hero',.85,'nervous');
 return f=>{const m=jellyMotion(f);table.position.x=m.table;tray.position.x=m.tray;jelly.rotation.z=m.wobble;jelly.scale.set(1+.12*Math.abs(m.wobble),1-.15*Math.abs(m.wobble),1);guide.animate(f);};
}
function moatSet(g:THREE.Group):Tick {
 sky(g);const fixed=grp(g),moving=grp(g);texturedBox(fixed,35,.24,25,pavementTexture(),0,-.2,0,[12,8]);
 // Narrow dark separation on both visible edges; isolated slab never touches curb.
 box(fixed,15,.06,8.3,'#424f50',0,-.025,0);box(moving,13.3,.34,6.7,'#aeb8ae',0,.11,0);
 const hall=cityHall(moving);hall.scale.setScalar(.72);hall.position.y=.3;
 for(const z of [-4.22,4.22])box(fixed,15.5,.12,.15,'#c6c4b2',0,.02,z);
 for(const x of [-7.56,7.56])box(fixed,.15,.12,8.55,'#c6c4b2',x,.02,0);
 for(const z of [-3.48,3.48]){box(moving,13.5,.045,.18,'#869994',0,.32,z);for(let x=-6.5;x<=6.5;x+=.38)box(moving,.16,.02,.1,'#c5c9bb',x,.35,z);}
 for(let i=0;i<7;i++)cityBuilding(g,-19+i*6,-18,5.1,5+i%3,5,i+3);
 return f=>{const m=seismicMotion(f);fixed.position.x=m.ground;moving.position.x=m.building;};
}
export class SpringWorld {
 root=new THREE.Group();focus=new THREE.Vector3();characterShot=false;
 private sets=new Map<Kind,{root:THREE.Group;tick:Tick}>();
 constructor(assets:BridgeAssets){
  for(const kind of new Set(SHOTS.map(s=>s.kind))){const root=grp(this.root);let tick:Tick;
   if(kind==='cutaway')tick=cutawaySet(root,assets);
   else if(kind==='bearing'||kind==='layers')tick=bearingSet(root,kind==='layers');
   else if(kind==='jelly')tick=jellySet(root);
   else if(kind==='moat')tick=moatSet(root);
   else tick=hallSet(root,assets,kind);
   root.visible=false;this.sets.set(kind,{root,tick});
  }
  this.root.add(new THREE.HemisphereLight('#fff4da','#99aac1',1.7));const light=new THREE.DirectionalLight('#fff0d4',2);light.position.set(-10,18,14);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-17,right:17,top:17,bottom:-17});light.shadow.bias=-.0002;this.root.add(light);
 }
 update(f:number,camera:THREE.PerspectiveCamera){
  let i=0;while(i+1<SHOTS.length&&f>=SHOTS[i+1].start)i++;
  const shot=SHOTS[i],end=i+1<SHOTS.length?SHOTS[i+1].start:TOTAL;
  for(const s of this.sets.values())s.root.visible=false;
  const set=this.sets.get(shot.kind)!;set.root.visible=true;set.tick(f);
  this.focus.set(...shot.target);this.characterShot=shot.kind==='guide'||shot.kind==='jelly';
  const u=smooth(f,shot.start,end),p=new THREE.Vector3(...shot.cam);p.lerp(this.focus,u*.12);
  // Gentle lateral truck on architecture; mechanism demos retain a fixed axis.
  if(shot.kind==='hall'||shot.kind==='dome')p.x+=u*.65;
  camera.position.copy(p);camera.lookAt(this.focus);camera.fov=shot.fov;camera.near=.1;camera.far=250;camera.updateProjectionMatrix();
 }
}
