import * as T from 'three';
import {Pen,bodyFront,Outfit,Expr} from './style/toon';
import {cardShade,CARD_K} from './style/cardshade';
import {NOINK} from './style/ink';
export class Character {
 root=new T.Group();card:T.Mesh;canvas=document.createElement('canvas');ctx:CanvasRenderingContext2D;tex:T.CanvasTexture;
 expr:Expr='neutral';walk=false;lean=0;wave=0;
 constructor(p:T.Object3D,x:number,z:number,public outfit:Outfit){
  this.canvas.width=600;this.canvas.height=1000;this.ctx=this.canvas.getContext('2d')!;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=4;
  const m=cardShade(new T.MeshLambertMaterial({map:this.tex,transparent:true,alphaTest:.2,side:T.DoubleSide}));this.card=new T.Mesh(new T.PlaneGeometry(2.04,3.4),m);this.card.position.y=1.615;this.card.castShadow=true;this.card.receiveShadow=true;this.card.layers.set(NOINK);
  this.root.add(this.card);this.root.position.set(x,0,z);p.add(this.root);
 }
 update(f:number,cam:T.Camera){CARD_K.uPx.value=1280/1920;this.ctx.clearRect(0,0,600,1000);bodyFront(new Pen(this.ctx),this.outfit,{expr:this.expr,mode:this.walk?'stroll':'stand',phase:f/24,tilt:this.lean,headTilt:Math.sin(f*.025)*.018,wave:this.wave,blink:f%83<4,seed:5});this.tex.needsUpdate=true;this.card.quaternion.copy(cam.quaternion);}
}
export const CLERK:Outfit={jacket:'#6c7274',pants:'#494d58',boots:'#352b30',hat:'tophat',skin:'#f5d9b7',hair:'#4b3730',buttons:'#bca77e'};
export const NEIGHBOUR:Outfit={jacket:'#3b6977',pants:'#434354',boots:'#3d2f32',hat:'bonnet',dress:'#975566',skin:'#f7d9b4',hair:'#47302d'};
export const WORKER:Outfit={jacket:'#a6784d',pants:'#424c55',boots:'#352c2e',hat:'cap',cap:'#615b52',skin:'#eac7a2',hair:'#483127'};
