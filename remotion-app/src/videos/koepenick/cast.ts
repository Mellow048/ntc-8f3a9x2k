import * as T from 'three';
import {Pen,bodyFront,bodySide,Outfit,Expr,townsfolk} from './style/toon';
import {cardShade,CARD_K,blobMaterial} from './style/cardshade';
import {NOINK} from './style/ink';
export const CAPTAIN:Outfit={jacket:'#344352',pants:'#344352',boots:'#26232c',hat:'officer_cap',cap:'#344352',buttons:'#d0b77a',sash:'#bab4a2',sword:true,greatcoat:true,gloves:'#eee6d7',moustache:'#a49c8a',skin:'#f3d5b3',build:'stout'};
export const CIVIL:Outfit={...CAPTAIN,greatcoat:false,gloves:undefined,hat:'cap',cap:'#6c6254',jacket:'#766149',pants:'#494a51',sash:undefined,sword:false,buttons:'#b7a78b'};
export const SOLDIER=(i=0):Outfit=>({jacket:'#2f455f',pants:'#444c5b',boots:'#242332',hat:'prussian',cap:'#263342',buttons:'#d0b77a',belt:'#eee3cb',rifle:true,skin:['#ffe2c2','#efc9a1','#f3d8bc'][i%3],moustache:i%3===1?'#68513d':undefined});
export const POLICE:Outfit={...SOLDIER(1),jacket:'#324b48',rifle:false,belt:undefined};
export const MAYOR:Outfit={jacket:'#583c4d',pants:'#3b3545',boots:'#30262d',hat:'tophat',moustache:'#61463a',skin:'#ffdab4',build:'stout',buttons:'#c8a773'};
export const CLERK:Outfit={jacket:'#61706d',pants:'#454955',boots:'#302632',hat:'hair',hair:'#826c56',skin:'#efd3b8',moustache:'#826c56'};
export const KAISER:Outfit={...CAPTAIN,moustache:'#554236',hat:'prussian',cap:'#f0e0bd',jacket:'#d9cbb2',pants:'#374653',sash:'#b84142',skin:'#f9d3b0'};
export const BRONZE:Outfit={...CAPTAIN,gloves:'#6f7c6d',jacket:'#59655b',pants:'#59655b',skin:'#738175',moustache:'#576358',cap:'#58685b',buttons:'#91a388',sash:'#6e7f6c',boots:'#4d5c51'};
export {townsfolk};
export class Actor {
 root=new T.Group();card:T.Mesh;cv=document.createElement('canvas');g:CanvasRenderingContext2D;tex:T.CanvasTexture;
 frozen=false;expr:Expr='neutral';mode:'stand'|'march'|'stroll'|'sit'='stand';wave:number|undefined;lean=0;side=false;mirror=false;look=0;seed:number;
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
  if(this.side)bodySide(p,this.outfit,{expr:this.expr,mode:this.mode==='sit'?'stand':this.mode==='stroll'?'march':this.mode,phase:f/19,blink,seed:this.seed,stride:.6});
  else bodyFront(p,this.outfit,{expr:this.expr,mode:this.mode,phase:f/19,tilt:this.lean,wave:this.wave,look:this.look,blink,seed:this.seed});
  this.tex.needsUpdate=true;this.card.rotation.y=Math.atan2(cam.position.x-this.root.position.x,cam.position.z-this.root.position.z);this.card.scale.x=this.mirror?-1:1;
 }
}
