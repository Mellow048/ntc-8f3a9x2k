import * as T from 'three';
import {V,box,cyl,sphere,bar,material,timber,iron,stone,wood,mesh,lamp,batchStatic} from './build';
import {ground,room,desk,lettering,paper,house,twinTowers,wireLine,elevatorCar,streetNY,parkSet,bowProp,poleProp,mug,
 cableCoil,pressCamera,toolbox,policeCar,barrierTape,signBoard,magazineProp,footprint,smallTowers,tree,parkBench,
 lobby,streetHat,carNY,skyline} from './sets';
import {Actor,PETIT,FRIEND,POLICE,WORKER,REPORTER,CLERK,person} from './cast';
import {Shot,clamp,ease,action,word} from './story';
import {NOINK} from './style/ink';
import {LIGHTS,LOOK} from './style/lights';
import {TONE,CHAR,untone} from './style/shade';

type LightKey='day'|'golden'|'night';
const UP=new T.Vector3(0,1,0);
// Twin Towers geometry (metres). The deck is the roof slab; the wire runs 1.2 m above it.
const TOWER=38, DECK=38.6, WIRE=39.4, WZ=-6, SPAN=10.2;
const SKY:Record<LightKey,{top:string;bottom:string;fog:string;near:number;far:number;sun:T.Vector3}>={
 day:{top:'#4c8ed1',bottom:'#c9dfeb',fog:'#b8d0d9',near:35,far:150,sun:V(-.5,.85,.65)},
 golden:{top:'#6a4f8c',bottom:'#ffd08a',fog:'#efb489',near:45,far:190,sun:V(.25,.2,-.95)},
 night:{top:'#0a1024',bottom:'#2b3a5c',fog:'#202b45',near:25,far:130,sun:V(-.45,.78,.42)},
};

export class World{
 root=new T.Group();actors:Actor[]=[];motions:((f:number,u:number)=>void)[]=[];
 sun=new T.DirectionalLight('#fff2d8',2.8);hemi=new T.HemisphereLight('#dcecff','#b49a78',.55);
 sky:T.Mesh;skyTop:T.Color;skyBottom:T.Color;
 constructor(public place:string){const p=this.root;
 this.skyTop=new T.Color('#4c8ed1');this.skyBottom=new T.Color('#c9dfeb');
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:this.skyTop},bottom:{value:this.skyBottom}},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top,bottom;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(0.,.7,normalize(v).y)),1.);}'});
 this.sky=new T.Mesh(new T.SphereGeometry(500,24,12),skyMat);this.sky.layers.set(NOINK);
 p.add(this.sky,this.hemi,this.sun,this.sun.target);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.02;
 const A=(x:number,z:number,o=PETIT,seed=5,y=0)=>{const a=new Actor(p,x,z,o,seed);a.root.position.y=y;this.actors.push(a);return a;};
 const dyn=(o:T.Object3D)=>{o.userData.dynamic=true;return o;};
 // ---- set builders ----
 const deck=()=>{ground(p);twinTowers(p,{gap:14,height:TOWER,roofY:TOWER,wire:false});
  const slab=material('roof','#8a9aa2');
  for(const sd of [-1,1]){box(p,sd*10.2,DECK,-6,7.0,.3,7.0,slab);
   box(p,sd*10.2,DECK+.55,-6,7.2,.5,7.2,material('parapet','#a4b0b6'));}
  for(const sd of [-1,1])cyl(p,sd*6.9,DECK+.4,-6,.09,.9,iron());   // wire anchor posts at the gap edge
  };
 const wire=()=>wireLine(p,V(-SPAN,WIRE,WZ),V(SPAN,WIRE,WZ),.25);
 const plaza=()=>{streetNY(p);skyline(p,-86);twinTowers(p,{gap:14,height:TOWER,roofY:TOWER,wire:false});};
 const roomSet=()=>room(p,'office');
 const lowWire=(x:number,z:number,half=3)=>{for(const s of [-half,half])cyl(p,x+s,half?2.2/2:1,z,.08,2.2,timber());bar(p,V(x-half,2.2,z),V(x+half,2.2,z),.035,iron());};
 const upCrowd=(n:number,x0:number,z0:number,dx:number)=>{for(let i=0;i<n;i++){const a=A(x0+(i%3)*dx,z0-Math.floor(i/3)*1.5,person(i+2),i+11);a.look=-.9;a.expr='shock';}};

 // ---- 1 hook: a man on a wire between two towers, police below ----
 if(place==='hook'){plaza();wire();
  const v=A(-2.6,WZ,PETIT,5,WIRE);v.mode='march';v.side=true;v.expr='neutral';
  const pole=dyn(poleProp(p,-2.6,WIRE+1.3,WZ));pole.rotation.z=Math.PI/2;
  const p1=A(1.5,-1.3,POLICE,9),p2=A(3.7,-.9,POLICE,10);
  policeCar(p,2.4,-2.2,.1);
  const c1=A(-1.9,-2.4,person(1),11),c2=A(-3.6,-1.6,person(2),12),c3=A(5.4,-2.8,person(3),13);
  for(const a of [p1,p2,c1,c2,c3]){a.gaze=1;a.look=-.3;}
  c1.expr='shock';c2.expr='shock';
  this.motions.push((f,u)=>{v.root.position.x=-2.6+u*5.2;pole.position.x=v.root.position.x;
   p1.point=.7+.3*Math.sin(f*.09);p2.gaze=.85+.15*Math.sin(f*.07+1);
   c1.point=.5+.3*Math.sin(f*.08);c3.wave=.35+.3*Math.sin(f*.11+2);});
 }
 // ---- 2 height: straight down the tower face ----
 if(place==='height'){plaza();wire();
  policeCar(p,-2.3,-2.2,.1);policeCar(p,2.4,-4.6,Math.PI-.08);carNY(p,-2.5,-4.9,'#6a3a3a');
  const crowd:Actor[]=[];
  for(let i=0;i<7;i++){const a=A(-3.2+i*1.15,-3.6-((i%3)*.5),person(i+1),i+11);a.gaze=1;a.look=-.2;crowd.push(a);}
  this.motions.push((f)=>{crowd.forEach((a,i)=>{if(i%2===0)a.point=.35+.25*Math.sin(f*.09+i);});});
 }
 // ---- 3 policewait: street, officers craning up ----
 if(place==='policewait'){plaza();wire();
  A(0,WZ,PETIT,5,WIRE).mode='march';
  const c1=A(.9,-1.9,POLICE,9),c2=A(3.0,-1.4,POLICE,10);
  policeCar(p,2.4,-2.2,.1);
  const t1=A(-2.2,-2.4,person(2),11),t2=A(-3.8,-1.9,person(3),12);
  for(const a of [c1,c2,t1,t2]){a.gaze=1;a.look=-.25;}
  t1.expr='shock';
  // one officer points up at the wire, the other shades his eyes, then they swap a look
  this.motions.push((f,u)=>{const q=action(f,15,14);
   c1.point=.75+.25*Math.sin(f*.09);c2.point=.3+.2*Math.sin(f*.07+1);
   c2.gaze=1-Math.max(0,Math.sin(f*.055))*1.6;c2.look=-.2+.9*Math.max(0,Math.sin(f*.055));
   c1.expr=q>.4?'shock':'stern';});
 }
 // ---- 4 performer: Paris square, juggling on a low wire ----
 if(place==='performer'){ground(p);skyline(p,-60);
  house(p,-8.4,-9.5,7,10,1);house(p,8.6,-10,7.5,11,2);
  lamp(p,-4.8,2.6,-3.4);lamp(p,5.4,2.8,-4.2);
  const v=A(0,0,PETIT,5);v.expr='grin';v.wave=.85;
  // three juggling clubs in the air
  const balls=[0,1,2].map(i=>{const b=dyn(sphere(p,-1+i*1.0,2.4,0,.14,material('club','#d8b45a',undefined,true)));return b;});
  this.motions.push((f)=>{balls.forEach((b,i)=>{const t=f*.16+i*2.1;b.position.x=Math.sin(t)*1.05;b.position.y=2.5+Math.abs(Math.cos(t))*.5;b.position.z=Math.cos(t)*.3;});});
  streetHat(p,1.5,.85);box(p,1.5,.03,.85,.95,.06,.95,material('hathold','#5c626c'));
  A(-2.1,-1.7,person(1),11).expr='smile';A(2.2,-1.8,person(2),12).expr='laugh';
  A(3.1,-3.4,person(3),13).expr='smile';A(-3.2,-3.6,person(5),14).expr='smile';
  A(.2,-4.4,person(6),15).expr='smile';
 }
 // ---- 5 magazine: the photo of the towers ----
 if(place==='magazine'){roomSet();desk(p,0,-1.0);
  const v=A(0,-.1,PETIT,5);v.expr='neutral';v.look=.5;
  magazineProp(p,.05,1.27,-1.0,1.2,1.6);
  this.motions.push((f)=>{v.look=.5*(1-action(f,29,10))+.1;});
 }
 // ---- 6 decision ----
 if(place==='decision'){roomSet();desk(p,0,-1.0);
  const v=A(0,-.1,PETIT,5);v.expr='neutral';
  magazineProp(p,.05,1.27,-1.0,1.2,1.6);
  this.motions.push((f)=>{const q=action(f,40,12);v.wave=.9*q;v.expr=q>.5?'grin':'neutral';v.look=-.35*q;});
 }
 // ---- 7 study: at the tower base in disguise ----
 if(place==='study'){plaza();
  const v=A(1.3,.7,PETIT,5);v.expr='neutral';v.look=-.9;
  const pcam=pressCamera(p,1.0,1.5,.3);
  const nb=dyn(paper(p,'NOTES',1.75,1.3,.1,.45,.6));nb.rotation.x=-1.15;nb.rotation.z=.2;
  this.motions.push((f)=>{v.look=-.9;v.wave=.12*Math.sin(f*.08);pcam.rotation.z=.04*Math.sin(f*.06);});
 }
 // ---- 8 reporter ----
 if(place==='reporter'){roomSet();desk(p,0,-1.0);
  const v=A(0,-.1,REPORTER,5);v.expr='smile';
  const guard=A(-1.8,-1.1,POLICE,9);guard.expr='stern';guard.look=.6;
  const card=dyn(paper(p,'PRESS',.55,1.38,-.15,.45,.6));card.rotation.x=-.5;
  this.motions.push((f)=>{const q=action(f,58,10);v.wave=.75*q;card.position.y=1.38+.1*q;});
 }
 // ---- 9 worker: site gate ----
 if(place==='worker'){plaza();
  barrierTape(p,2.3,1.7,3.2);signBoard(p,'SITE CLOSED',2.3,2.4,1.72,1.7,.5);
  const v=A(.7,1.0,WORKER,5);v.expr='neutral';
  toolbox(p,1.5,.02,1.15);
  const log=dyn(paper(p,'CLIPBOARD',-.05,1.3,.85,.42,.56));log.rotation.x=-.7;
  this.motions.push((f)=>{const q=action(f,59,10);v.wave=.45*q;v.look=-.3*q;});
 }
 // ---- 10 fakeid ----
 if(place==='fakeid'){roomSet();desk(p,0,-.7,3.4);
  for(let i=0;i<3;i++){const id=dyn(paper(p,'ID '+(i+1),-.85+i*.85,1.27,-.5,.62,.82));id.rotation.x=-Math.PI/2;}
  smallTowers(p,1.45,1.24,-1.0,.13);
  const v=A(-.2,-1.9,PETIT,5);v.expr='neutral';
  this.motions.push((f)=>{v.look=.35*(1-action(f,61,12));});
 }
 // ---- 11 smuggle: gear in the freight car ----
 if(place==='smuggle'){room(p,'service');elevatorCar(p,0,-1.5);
  // the cable itself, carried between the two of them, the pole at chest height, the bow slung
  const coil=dyn(cableCoil(p,-.55,.78,1.1,.42));
  const pole=dyn(poleProp(p,0,1.06,1.15));pole.rotation.z=Math.PI/2;
  const bow=dyn(bowProp(p,0,0,0));bow.rotation.set(0,.3,.15);
  const v=A(-1.35,1.45,PETIT,5),f1=A(.95,1.45,FRIEND,6);
  v.mode='march';f1.mode='march';f1.mirror=true;
  this.motions.push((f,u)=>{const q=action(f,67,26),step=Math.sin(f*.3)*.03,walk=Math.sin(f*.3);
   v.root.position.z=1.45-q*1.15;f1.root.position.z=1.45-q*1.15;
   const mx=(v.root.position.x+f1.root.position.x)/2,mz=1.45-q*1.15;
   coil.position.set(mx,.8+step,mz-.15);coil.rotation.y=f*.03;
   pole.position.set(mx,1.04+step,mz+.05);pole.rotation.z=Math.PI/2+walk*.03;
   bow.position.set(f1.root.position.x-.62,1.05+step*.5,mz-.1);bow.rotation.set(0,.2,.12);
   v.wave=.2;f1.wave=.18;v.expr='nervous';f1.expr='nervous';});
 }
 // ---- 12 load: pole and bow go in ----
 if(place==='load'){room(p,'service');elevatorCar(p,0,-1.5);
  const coil=dyn(cableCoil(p,-.45,.42,.75,.42));
  const pole=dyn(poleProp(p,-.15,1.15,.55));pole.rotation.z=Math.PI/2;
  const bow=dyn(bowProp(p,1.35,.95,.35));bow.rotation.set(0,.35,.1);
  const v=A(-1.45,1.05,PETIT,5),f1=A(1.15,1.05,FRIEND,6);
  v.expr='nervous';f1.expr='nervous';
  this.motions.push((f,u)=>{const q=action(f,76,22),h=q*q;
   coil.position.set(-.45+h*.1,.42+h*1.05,.75-q*.55);coil.rotation.x=-h*.55;
   pole.position.set(-.15+h*.08,1.15+h*.5,.55-q*.4);pole.rotation.z=Math.PI/2-h*.1;
   bow.position.set(1.35,0.95+h*.25,0.35-q*.3);
   v.wave=.3+.5*q;f1.wave=.25+.55*q;v.look=.2;f1.look=-.15;});
 }
 // ---- 13 elevator: doors close, up to 104 ----
 if(place==='elevator'){room(p,'service');elevatorCar(p,0,-1.5);
  // the gear is already inside the car; the leaves close on it and the floor number climbs
  const coil=dyn(cableCoil(p,-.42,.42,-.16,.4));
  const pole=dyn(poleProp(p,.1,2.05,-.62));pole.rotation.z=Math.PI/2;
  const ind=dyn(lettering(p,'104',0,3.76,-.18,1.0,.3,'#1c2026','#ffd27a'));
  const doorL=dyn(box(p,-1.06,1.34,-.21,.72,2.56,.07,material('elevdoor3','#a8b8c0')));
  const doorR=dyn(box(p,1.06,1.34,-.21,.72,2.56,.07,material('elevdoor3','#a8b8c0')));
  const v=A(-1.45,1.15,PETIT,5),f1=A(1.5,1.05,FRIEND,6);
  v.expr='nervous';f1.expr='neutral';
  this.motions.push((f,u)=>{const q=action(f,84,26);doorL.position.x=-1.06+q*.70;doorR.position.x=1.06-q*.70;
   const floor=4+Math.floor(Math.min(21,u*22));ind.position.y=3.74+Math.sin(f*.5)*.01;
   v.wave=.3*(1-q);f1.wave=.25*(1-q);v.gaze=.55*(1-q);f1.gaze=.45*(1-q);v.look=.2;f1.look=-.2;
   void floor;});
 }
 // ---- 14 security: brand-new lobby, no guard yet ----
 if(place==='security'){lobby(p);
  barrierTape(p,1.9,.8,1.8);signBoard(p,'NO GUARD YET',1.9,2.5,.82,1.8,.5);
  box(p,-1.4,.55,-.75,.66,.85,.6,material('chair','#5a5f6a'));
  box(p,-1.4,1.02,-1.02,.66,.85,.12,material('chair','#5a5f6a'));
  const v=A(.5,.2,PETIT,5),f1=A(1.7,.0,FRIEND,6);
  v.expr='nervous';f1.expr='neutral';
  this.motions.push((f,u)=>{v.root.position.x=.5+u*.5;f1.root.position.x=1.7+u*.4;v.look=-.4;});
 }
 // ---- 15 bow: night, line shot across the gap ----
 if(place==='bow'){deck();wire();
  const f1=A(-7.0,-4.2,FRIEND,6,DECK);f1.expr='neutral';f1.side=true;
  const bow=dyn(bowProp(p,-6.35,DECK+1.55,-4.0));bow.rotation.set(0,-.35,.25);
  const LA=V(-6.0,DECK+1.55,-3.9),LB=V(7.2,WIRE,WZ);
  const line=dyn(bar(p,LA,LB,.075,material('line','#fff6df')));
  line.scale.y=.02;
  const arrow=dyn(cyl(p,0,0,0,.035,1.1,material('shaft','#f0dfae')));
  arrow.rotation.x=Math.PI/2;
  lamp(p,-9.6,DECK+1.4,-4.4,true);lamp(p,9.4,DECK+1.4,-4.4,true);
  this.motions.push((f)=>{const q=.02+.98*action(f,100,20);
   line.scale.y=q;line.position.copy(LA).addScaledVector(LB.clone().sub(LA),q/2);
   const a=clamp(action(f,100,9)*1.15);arrow.visible=a<.99;
   arrow.position.copy(LA).lerp(LB,a*a);
   f1.wave=.6*action(f,100,6)+.1*Math.sin(f*.2);f1.look=-.4;});
 }
 // ---- 16 pull: hauling the cable by hand ----
 if(place==='pull'){deck();wire();
  const f1=A(-7.3,-3.1,FRIEND,6,DECK),f2=A(-7.3,-4.9,FRIEND,7,DECK);
  const CA=V(-7.1,DECK+1.35,-4.0),CB=V(7.2,WIRE,WZ);
  const cable=dyn(bar(p,CA,CB,.1,material('cable-haul','#dfe6f0')));
  cable.scale.y=.3;
  const v=A(1.6,WZ,PETIT,5,WIRE);v.expr='nervous';
  this.motions.push((f)=>{const q=.3+.7*action(f,111,26);cable.scale.y=q;cable.position.copy(CA).addScaledVector(CB.clone().sub(CA),q/2);
   // alternating hand-over-hand hauling
   const beat=Math.sin(f*.42);f1.wave=.5+.45*beat;f2.wave=.5-.45*beat;v.wave=.25*q;
   f1.look=.35;f2.look=.3;v.gaze=.35;});
 }
 // ---- 17 sunrise: steps out, nothing ----
 if(place==='sunrise'){deck();wire();
  const v=A(-3.4,WZ,PETIT,5,WIRE);v.mode='march';v.side=true;v.expr='neutral';
  this.motions.push((f,u)=>{v.root.position.x=-3.4+u*2.2;});
 }
 // ---- 18 cross: wide from the far roof ----
 if(place==='cross'){deck();wire();
  const v=A(-2.8,WZ,PETIT,5,WIRE);v.mode='march';v.side=true;v.expr='neutral';
  this.motions.push((f,u)=>{v.root.position.x=-2.8+u*5.6;});
 }
 // ---- 19 kneel ----
 if(place==='kneel'){deck();wire();
  const v=A(-.6,WZ,PETIT,5,WIRE-.45);v.mode='sit';v.lean=8;v.expr='relief';
  this.motions.push((f)=>{v.wave=.5*action(f,137,10);});
 }
 // ---- 20 lie ----
 if(place==='lie'){deck();wire();
  const v=A(-.6,WZ,PETIT,5,WIRE+.5);v.root.rotation.z=-1.42;v.expr='relief';v.wave=.25;
 }
 // ---- 21 salute ----
 if(place==='salute'){deck();wire();
  const v=A(-.8,WZ,PETIT,5,WIRE);v.expr='grin';v.wave=1;v.look=.1;
 }
 // ---- 22 street: traffic stops ----
 if(place==='street'){streetNY(p);twinTowers(p,{gap:12,height:TOWER+10,roofY:TOWER+10,wire:false,z:-30});
  carNY(p,-1.5,-4.6,'#8a3a3a',.24);carNY(p,1.9,-6.2,'#3a5a8a',Math.PI-.18);
  policeCar(p,-3.4,-8.0,Math.PI);
  const t1=A(-2.4,-3.4,person(1),11),t2=A(-3.4,-2.4,person(2),12),t3=A(.4,-3.0,person(3),13),t4=A(2.2,-2.6,person(5),14),t5=A(3.2,-4.4,person(6),15);
  for(const a of [t1,t2,t3,t4,t5]){a.gaze=1;a.look=-.3;a.expr='shock';}
  this.motions.push((f)=>{t2.point=.7+.3*Math.sin(f*.09);t4.point=.6+.35*Math.sin(f*.12+1.7);
   t1.gaze=.9+.1*Math.sin(f*.1);t5.gaze=.85+.15*Math.sin(f*.07+2);});
 }
 // ---- 23 crowd: faces craned up ----
 if(place==='crowd'){streetNY(p);twinTowers(p,{gap:12,height:TOWER+10,roofY:TOWER+10,wire:false,z:-30});
  const crew:Actor[]=[];
  for(let i=0;i<12;i++){const a=A(-3.0+(i%4)*1.55,-1.0-Math.floor(i/4)*1.4,person(i+1),i+11);a.gaze=1;a.look=-.3;a.expr=i%2?'shock':'shock';crew.push(a);}
  for(const a of crew.slice(0,4)){a.point=.6;}
  policeCar(p,4.4,-6.6,.1);
  this.motions.push((f)=>{crew.forEach((a,i)=>{a.root.position.z-=0; a.gaze=.9+.1*Math.sin(f*.08+i);
   if(i<4)a.point=.55+.45*Math.sin(f*.1+i*1.3);});
   crew[5].root.position.z=-2.4+Math.sin(f*.05)*.1;});
 }
 // ---- 24 police: rushing in ----
 if(place==='police'){streetNY(p);twinTowers(p,{gap:12,height:TOWER+10,roofY:TOWER+10,wire:false,z:-30});
  policeCar(p,2.0,-4.2,.12);
  const c1=A(.3,1.9,POLICE,9),c2=A(2.9,2.1,POLICE,10);c1.expr='stern';c2.expr='stern';
  c1.mode='march';c2.mode='march';
  this.motions.push((f,u)=>{c1.root.position.z=1.9-u*2.0;c2.root.position.x=2.9-u*1.3;c2.root.position.z=2.1-u*1.6;
   c1.wave=.45+.25*Math.sin(f*.16);c2.wave=.3;c2.gaze=.9;c2.look=-.2;c1.gaze=.75;});
 }
 // ---- 25 reach: they cannot reach him ----
 if(place==='reach'){deck();wire();
  const v=A(-1.4,WZ,PETIT,5,WIRE);v.expr='grin';
  const c1=A(7.4,-4.3,POLICE,9,DECK),c2=A(9.3,-4.3,POLICE,10,DECK);
  c1.expr='stern';c2.expr='stern';c1.look=-.5;c2.look=-.45;c1.gaze=.75;c2.gaze=.7;
  const v2=v;
  this.motions.push((f)=>{c1.wave=.35+.3*Math.sin(f*.1);c2.wave=.2+.2*Math.sin(f*.13+1);
   v2.wave=.55+.15*Math.sin(f*.2);});
 }
 // ---- 26 wait: they can wait ----
 if(place==='wait'){deck();wire();
  const c1=A(7.5,-4.4,POLICE,9,DECK),c2=A(9.4,-4.4,POLICE,10,DECK);
  c1.mode='sit';c2.mode='sit';c1.expr='stern';c2.expr='nervous';c1.gaze=.35;c2.gaze=.2;
  const mugA=mug(p,8.0,DECK,-4.0),mugB=mug(p,9.9,DECK,-4.0);
  const pet=A(-1.2,WZ,PETIT,5,WIRE);pet.expr='grin';pet.mode='sit';
  this.motions.push((f)=>{c1.wave=.55+.25*Math.sin(f*.09);c2.wave=.4;
   mugA.position.y=DECK+.1*Math.max(0,Math.sin(f*.07));mugB.position.y=DECK+.1*Math.max(0,Math.sin(f*.055+2));
   pet.wave=.5+.2*Math.sin(f*.14);});
 }
 // ---- 27 arrest ----
 if(place==='arrest'){deck();wire();
  const v=A(7.5,-5.0,PETIT,5,DECK);v.expr='shock';
  const c1=A(6.9,-4.4,POLICE,9,DECK),c2=A(9.6,-4.4,POLICE,10,DECK);c1.expr='stern';c2.expr='stern';
  this.motions.push((f)=>{const q=action(f,166,14);c1.root.position.x=6.9+q*.45;c2.root.position.x=9.6-q*.45;v.wave=.35*q;v.look=.3*q;});
 }
 // ---- 28 dropped: charges dropped ----
 if(place==='dropped'){roomSet();desk(p,0,-1.2,3.4);
  const j=A(0,-.15,CLERK,12);j.expr='smile';
  const doc=dyn(paper(p,'DROPPED',.1,1.28,-1.1,1.5,1.1));doc.rotation.x=-Math.PI/2;
  const gavel=dyn(box(p,.7,1.4,-.8,.34,.09,.1,wood()));box(p,.7,1.3,-.8,.3,.2,.3,wood());
  this.motions.push((f)=>{const q=action(f,177,10);gavel.position.y=1.4+Math.sin(q*Math.PI)*.55;gavel.rotation.z=q*.6;j.wave=q*.5;});
 }
 // ---- 29 park: free show ----
 if(place==='park'){parkSet(p);
  const v=A(-.6,0,PETIT,5,2.2);v.mode='march';v.side=true;v.expr='grin';
  for(let i=0;i<5;i++){const a=A(-4.2+i*2.1,2.4,person(i+1),i+11);a.expr='laugh';a.wave=.8;if(i%2)a.look=-.5;}
  parkBench(p,-6.4,2.2);
 }
 // ---- 30 pass: lifetime pass ----
 if(place==='pass'){roomSet();desk(p,0,-1.2,3.2);
  const v=A(-.4,-.1,PETIT,5);v.expr='grin';
  const clerk=A(1.1,-.2,CLERK,9);clerk.expr='smile';
  const pass=dyn(paper(p,'LIFETIME PASS',.5,1.28,-.9,.9,.62));pass.rotation.x=-Math.PI/2;
  this.motions.push((f)=>{const q=action(f,194,14);pass.position.x=.5-q*.75;pass.position.y=1.28+q*.06;clerk.wave=q*.5;v.wave=q*.6;});
 }
 // ---- 31 today: the towers are gone ----
 if(place==='today'){ground(p);skyline(p,-70);
  footprint(p,-4.6,-9,6);footprint(p,6.4,-11,5);
  parkBench(p,-6.6,1.6);parkBench(p,6.2,2.2);
  for(let i=0;i<4;i++)tree(p,-12+i*8.0,-8.6,2.2+i*.15,.75);
  for(const x of [-2.9,2.9])cyl(p,x,1.1,0,.08,2.2,timber());
  bar(p,V(-2.9,2.2,0),V(2.9,2.2,0),.035,iron());
  const v=A(-2.0,0,PETIT,5,2.2);v.mode='march';v.side=true;v.expr='neutral';
  const t1=A(-4.4,-2.2,person(2),11);t1.look=-.6;A(4.0,-1.6,person(3),12).look=-.5;
  this.motions.push((f,u)=>{v.root.position.x=-2.0+u*3.4;});
 }
 // ---- 32 quote: if he sees two towers ----
 if(place==='quote'){ground(p);skyline(p,-60);tree(p,-5.6,-2.4,3.2);tree(p,5.8,-3.0,3.4);
  for(const x of [-3.0,3.0])cyl(p,x,1.1,0,.08,2.2,timber());
  bar(p,V(-3.0,2.2,0),V(3.0,2.2,0),.035,iron());
  smallTowers(p,0,0,-15,.9);
  const v=A(.5,0,PETIT,5,2.2);v.mode='march';v.side=true;v.expr='neutral';
  this.motions.push((f,u)=>{v.root.position.x=-.4+u*1.8;v.wave=.5;});
 }
 // ---- 33 walk: he still walks ----
 if(place==='walk'){ground(p);tree(p,-5.2,-1.8,3.0);parkBench(p,-5.4,1.6);
  for(const x of [-3.2,3.2])cyl(p,x,1.1,0,.08,2.2,timber());
  bar(p,V(-3.2,2.2,0),V(3.2,2.2,0),.035,iron());
  smallTowers(p,0,0,-15,.55);
  const v=A(-1.4,0,PETIT,5,2.2);v.mode='march';v.side=true;v.expr='grin';
  const pass=dyn(paper(p,'LIFETIME PASS',-1.5,2.62,-.02,.34,.46));pass.rotation.z=.06;
  const t1=A(2.4,-2.2,person(3),11);t1.expr='smile';t1.look=-.4;
  this.motions.push((f,u)=>{v.root.position.x=-1.4+u*1.6;
   pass.position.x=v.root.position.x-.12;pass.position.y=2.6+Math.sin(f*.09)*.02;pass.rotation.z=.06+Math.sin(f*.06)*.03;});
 }
 batchStatic(p);
 }
 update(s:Shot,f:number,cam:T.PerspectiveCamera,scene:T.Scene){
  const u=clamp((f-s.a)/(s.b-s.a));const target=V(s.look[0],s.look[1],s.look[2]);const origin=V(s.pos[0],s.pos[1],s.pos[2]);
  // Every shot moves: a dolly toward (or past) the subject, a small arc, a slow rise, and handheld drift.
  const id=(s as unknown as {id?:number}).id??1, alt=id%2?-1:1;
  const off=origin.clone().sub(target);
  const span=off.length();
  off.multiplyScalar(1-(0.075+0.04*(id%3))*(0.25+0.75*u));
  off.applyAxisAngle(UP,T.MathUtils.degToRad(alt*(1.5+.8*(id%4))*(u-.5)*2));
  off.y+=(id%3===0?1:-1)*span*.05*u;
  const shakeK=Math.min(.05,span*.006);
  cam.position.copy(target).add(off)
    .add(V(Math.sin(f*.057+id*1.7)*shakeK,Math.sin(f*.081+id*2.3)*shakeK*.7,Math.cos(f*.043+id)*shakeK));
  cam.lookAt(target);
  cam.rotation.z+=T.MathUtils.degToRad(alt*Math.sin(u*Math.PI)*.55);
  cam.fov=s.fov;cam.near=.15;cam.far=650;cam.layers.enable(NOINK);cam.updateProjectionMatrix();cam.updateMatrixWorld();
  const key=((s as unknown as {light?:LightKey}).light??'day') as LightKey;
  const L=LIGHTS[key],K=LOOK[key],S=SKY[key];
  this.skyTop.set(S.top);this.skyBottom.set(S.bottom);
  this.sky.position.copy(cam.position);scene.background=null;scene.fog=new T.Fog(S.fog,S.near,S.far);
  const sunDir=S.sun.clone().normalize();this.sun.color.set(L.sunCol);this.sun.intensity=L.sunI;this.hemi.intensity=L.hemiI;this.hemi.color.set(L.sky);this.hemi.groundColor.set(L.ground);
  this.sun.position.copy(target).addScaledVector(sunDir,80);this.sun.target.position.copy(target);this.sun.target.updateMatrixWorld();
  const sh=this.sun.shadow.camera;sh.left=-20;sh.right=20;sh.top=22;sh.bottom=-20;sh.near=1;sh.far=180;sh.updateProjectionMatrix();
  this.sun.shadow.bias=L.bias;this.sun.shadow.normalBias=L.normalBias;
  TONE.uLitCol.value.set(...L.lit);TONE.uShadeCol.value.set(...L.shade);TONE.uShadeLift.value.set(...L.lift);TONE.uLambert.value=L.lambert;TONE.uSideK.value=L.sideK;TONE.uTerm.value=L.term;TONE.uBounce.value.set(...K.bounce);TONE.uSat.value=K.sat;
  CHAR.uCharTint.value.set(...L.charTint);CHAR.uCharShade.value=L.charShade;CHAR.uGrad.value=L.charGrad;CHAR.uBodyGrad.value=L.bodyGrad;CHAR.uSideTint.value.set(...L.sideTint);
  this.motions.forEach(fn=>fn(f,u));this.actors.forEach(a=>a.update(f,cam));return target;
 }
}
