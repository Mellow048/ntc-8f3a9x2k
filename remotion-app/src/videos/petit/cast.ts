import * as T from 'three';
import {Pen,bodyFront,bodySide,Outfit,Expr,townsfolk} from './style/toon';
import {cardShade,CARD_K,blobMaterial} from './style/cardshade';
import {NOINK} from './style/ink';
// Petit: dark street performer, no hat, dark hair. Friends: workers/reporters. Police: 1970s NYPD blue.
export const PETIT:Outfit={jacket:'#2b2e38',pants:'#23242c',boots:'#1c1a20',hat:'hair',hair:'#2a2118',skin:'#f3d5b3'};
export const FRIEND:Outfit={jacket:'#5a4632',pants:'#3f3a34',boots:'#2a2118',hat:'cap',cap:'#4a3f30',skin:'#efc9a1'};
export const POLICE:Outfit={jacket:'#2e4a8a',pants:'#2a3a5e',boots:'#1c1a20',hat:'cap',cap:'#2e4a8a',buttons:'#d0b77a',skin:'#f3d5b3'};
export const WORKER:Outfit={jacket:'#c47a2e',pants:'#4a4a52',boots:'#2a2118',hat:'cap',cap:'#e8c45a',skin:'#efc9a1'};
export const REPORTER:Outfit={jacket:'#4a5a6a',pants:'#3a3f48',boots:'#2a2118',hat:'hair',hair:'#3a2a1a',skin:'#ffe2c2'};
export const CLERK:Outfit={jacket:'#61706d',pants:'#454955',boots:'#302632',hat:'hair',hair:'#826c56',skin:'#efd3b8'};
// 1974 New York crowd: plain coats, no period hats, muted colours.
export const person=(v=0):Outfit=>{
 const coats=['#5a6b8a','#8a5a4a','#4a6a5a','#7a6a4a','#6a5a7a','#465a6a','#8a6a5a','#3f5a72'];
 const pants=['#3a3f48','#4a3f36','#33394a','#2f3a44'];
 const skins=['#f3d5b3','#e6c29a','#cf9f74','#9a6a46'];
 const hairs=['#2a2118','#4a3524','#6a5030','#1c1a20','#8a7050'];
 const caps=['#3a4452','#6a3a32','#2f4a3a'];
 const hat=v%3===0?{hat:'cap',cap:caps[v%3]}:{hat:'hair',hair:hairs[v%5]};
 return {jacket:coats[v%8],pants:pants[v%4],boots:'#241d1a',skin:skins[v%4],...hat} as Outfit;
};
export {townsfolk};
export class Actor {
 root=new T.Group();card:T.Mesh;cv=document.createElement('canvas');g:CanvasRenderingContext2D;tex:T.CanvasTexture;
 frozen=false;expr:Expr='neutral';mode:'stand'|'march'|'stroll'|'sit'='stand';wave:number|undefined;lean=0;side=false;mirror=false;look=0;seed:number;
 /** 0 = level gaze, 1 = craning straight up. Drives pupils, brows and chin. */
 gaze=0;baseY:number|undefined;baseLean:number|undefined;
 constructor(p:T.Object3D,x:number,z:number,public outfit:Outfit,seed=5){
  this.seed=seed;this.cv.width=600;this.cv.height=1000;this.g=this.cv.getContext('2d')!;
  this.tex=new T.CanvasTexture(this.cv);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=2;
  const m=cardShade(new T.MeshLambertMaterial({map:this.tex,alphaTest:.45,side:T.DoubleSide}));
  const geo=new T.PlaneGeometry(1.56,2.6);geo.translate(0,1.235,0);
  this.card=new T.Mesh(geo,m);this.card.layers.set(NOINK);this.card.receiveShadow=true;this.root.add(this.card);
  const shadowCV=document.createElement('canvas');shadowCV.width=shadowCV.height=64;const g=shadowCV.getContext('2d')!;const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(80,65,65,.28)');gr.addColorStop(1,'rgba(80,65,65,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  const blob=new T.Mesh(new T.PlaneGeometry(.8,.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCV),transparent:true,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=.012;blob.layers.set(NOINK);this.root.add(blob);
  this.root.position.set(x,0,z);p.add(this.root);
 }
 update(f:number,cam:T.Camera){if(!this.root.visible)return;CARD_K.uPx.value=1280/1920;
  this.g.clearRect(0,0,600,1000);const p=new Pen(this.g);
  if(this.frozen)f=0;
  const blink=!this.frozen&&((f+this.seed*17)%(67+this.seed%5*7))<3;
  // ---- idle life: every actor breathes and shifts weight, even on a held beat ----
  if(this.baseLean===undefined)this.baseLean=this.lean;
  if(this.baseY===undefined)this.baseY=this.root.position.y;
  const tt=f*.055+this.seed*1.7;
  const breath=Math.sin(tt*1.45)*.016+Math.sin(tt*2.9+1.1)*.005;
  this.root.position.y=this.baseY+breath;
  const sway=Math.sin(tt)*.85+Math.sin(tt*2.3)*.25;
  const nod=Math.sin(tt*.8+2.1)*.5;
  if(this.side)bodySide(p,this.outfit,{expr:this.expr,mode:this.mode==='sit'?'stand':this.mode==='stroll'?'march':this.mode,phase:f/19,blink,seed:this.seed,stride:.6});
  else bodyFront(p,this.outfit,{expr:this.expr,mode:this.mode,phase:f/19,tilt:(this.baseLean??this.lean)+sway,wave:this.wave,look:this.look,blink,seed:this.seed,
    gaze:Math.max(0,Math.min(1,this.gaze+(this.gaze>0?Math.sin(tt*1.2)*.06:0))),headTilt:nod*Math.min(1,this.gaze+.3)});
  this.tex.needsUpdate=true;this.card.rotation.y=Math.atan2(cam.position.x-this.root.position.x,cam.position.z-this.root.position.z);this.card.scale.x=this.mirror?-1:1;
 }
}
