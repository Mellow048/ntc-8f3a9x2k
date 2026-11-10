import * as T from 'three';
import {Pen,bodyFront,Outfit,Expr} from '../beer-remaster/style/toon';
import {cardShade,CARD_K} from '../beer-remaster/style/cardshade';
import {NOINK} from '../beer-remaster/style/ink';
export class Character {
 root=new T.Group();card:T.Mesh;canvas=document.createElement('canvas');ctx:CanvasRenderingContext2D;tex:T.CanvasTexture;
 seed=5;hero=false;
 expr:Expr='neutral';walk=false;run=false;lean=0;wave:number|undefined;
 water={level:{value:-100},time:{value:0},front:{value:100},energy:{value:0}};
 constructor(p:T.Object3D,x:number,z:number,public outfit:Outfit){
  this.canvas.width=600;this.canvas.height=1000;this.ctx=this.canvas.getContext('2d')!;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=4;
  const m=cardShade(new T.MeshLambertMaterial({map:this.tex,transparent:true,alphaTest:.2,side:T.DoubleSide}));this.card=new T.Mesh(new T.PlaneGeometry(2.04,3.4),m);this.card.position.y=1.615;this.card.castShadow=true;this.card.receiveShadow=true;this.card.layers.set(NOINK);
  // Clip the billboard against the SAME world-space surface as Porter. Camera
  // pitch must not expose legs beneath water (a depth test alone cannot do this).
  const shade=m.onBeforeCompile;
  m.onBeforeCompile=(sh,r)=>{shade.call(m,sh,r);Object.assign(sh.uniforms,{wetLevel:this.water.level,wetTime:this.water.time,wetFront:this.water.front,wetEnergy:this.water.energy});
   sh.vertexShader='varying vec3 wetWorld;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nwetWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   sh.fragmentShader='varying vec3 wetWorld; uniform float wetLevel,wetTime,wetFront,wetEnergy;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    float wd=wetWorld.z-wetFront;
    float wy=wetLevel+exp(-wd*wd/3.5)*wetEnergy*.8+(sin(wetWorld.x*3.6+wetWorld.z*2.2-wetTime*5.)*.045+sin(wetWorld.z*5.-wetWorld.x*1.4-wetTime*7.)*.022)*wetEnergy;
    if(wetWorld.y<wy) discard;`);
  };m.customProgramCacheKey=()=>"beer-wet-character-v1";
  this.root.add(this.card);this.root.position.set(x,0,z);p.add(this.root);
 }
 wet(level:number,time:number,front:number,energy:number){this.water.level.value=level;this.water.time.value=time;this.water.front.value=front;this.water.energy.value=energy;}
 update(f:number,cam:T.Camera){CARD_K.uPx.value=1280/1920;this.ctx.clearRect(0,0,600,1000);bodyFront(new Pen(this.ctx),this.outfit,{expr:this.expr,mode:this.run?'march':this.walk?'stroll':'stand',phase:f/(this.run?11:18),tilt:this.lean,headTilt:Math.sin(f*.025)*.018,wave:this.wave===undefined?undefined:this.wave+Math.sin(f*.4)*.35,blink:f%83<4,seed:this.seed});
  if(this.hero){const c=this.ctx,bob=this.walk?Math.cos(4*Math.PI*f/18)*11:0;c.save();c.translate(0,bob);c.strokeStyle="#241726";c.lineWidth=3;c.fillStyle="#ece5d4";c.beginPath();c.moveTo(264,433);c.lineTo(300,476);c.lineTo(335,433);c.lineTo(300,450);c.closePath();c.fill();c.stroke();c.fillStyle="#a64e37";c.beginPath();c.moveTo(300,454);c.lineTo(312,481);c.lineTo(307,555);c.lineTo(293,555);c.lineTo(288,481);c.closePath();c.fill();c.stroke();c.restore();}this.tex.needsUpdate=true;this.card.quaternion.copy(cam.quaternion);}
}
export const CLERK:Outfit={jacket:'#6c7274',pants:'#494d58',boots:'#352b30',hat:'tophat',skin:'#f5d9b7',hair:'#4b3730',buttons:'#bca77e'};
export const NEIGHBOUR:Outfit={jacket:'#3b6977',pants:'#434354',boots:'#3d2f32',hat:'bonnet',dress:'#975566',skin:'#f7d9b4',hair:'#47302d'};
export const WORKER:Outfit={jacket:'#a6784d',pants:'#424c55',boots:'#352c2e',hat:'cap',cap:'#615b52',skin:'#eac7a2',hair:'#483127'};
