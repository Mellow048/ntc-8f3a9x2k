// Original procedural architecture and set dressing in the approved ink/lens style.
import * as THREE from 'three';
import {Pen,bodyFront,HERO,ENGINEER,type Expr} from '../pendulum/toon';
import {NOINK} from '../pendulum/ink';
import type {V} from './story';
const mats=new Map<string,THREE.MeshLambertMaterial>();
export function material(color:string){if(!mats.has(color)) mats.set(color,new THREE.MeshLambertMaterial({color}));return mats.get(color)!;}
export function mesh(p:THREE.Object3D,g:THREE.BufferGeometry,c:string,x=0,y=0,z=0){const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
export function box(p:THREE.Object3D,w:number,h:number,d:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);}
export function ball(p:THREE.Object3D,r:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.SphereGeometry(r,18,12),c,x,y,z);}
export function cylinder(p:THREE.Object3D,r:number,h:number,c:string,x=0,y=0,z=0){return mesh(p,new THREE.CylinderGeometry(r,r,h,16),c,x,y,z);}
export function grp(p:THREE.Object3D,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
export function rod(p:THREE.Object3D,a:V,b:V,r:number,c:string){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=cylinder(p,r,delta.length(),c);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
export function actor(p:THREE.Object3D,x:number,y:number,z:number,which:'hero'|'engineer',scale:number,expr:Expr='grin'){
 const textures=Array.from({length:6},(_,i)=>{const canvas=document.createElement('canvas');canvas.width=600;canvas.height=1000;const cx=canvas.getContext('2d')!;
  bodyFront(new Pen(cx),which==='engineer'?ENGINEER(0):HERO,{mode:'stand',expr,seed:12,look:.1,light:-.8,headTilt:.04*Math.sin(i*Math.PI/3),wave:which==='engineer'?.3+.2*Math.sin(i*Math.PI/3):undefined,blink:i===4});
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;});
 const material=new THREE.MeshBasicMaterial({map:textures[0],transparent:true,alphaTest:.45,side:THREE.DoubleSide});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3*scale,2.16*scale),material);
 m.position.set(x,y+1.08*scale,z);m.layers.set(NOINK);p.add(m);
 return {mesh:m,animate:(f:number)=>{material.map=textures[Math.floor(f/9)%textures.length];m.rotation.z=.018*Math.sin(f/20);}};
}
// Fine-scale materials and full-size setting replace the earlier floating block diorama.
const textures=new Map<string,THREE.CanvasTexture>();
export function canvasTexture(key:string,draw:(c:CanvasRenderingContext2D)=>void){
 let t=textures.get(key);if(t)return t;
 const cv=document.createElement('canvas');cv.width=512;cv.height=512;draw(cv.getContext('2d')!);
 t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;textures.set(key,t);return t;
}
export function random(seed:number){let n=seed;return ()=>((n=(n*16807)%2147483647)-1)/2147483646;}
export function asphaltTexture(){return canvasTexture('bridge-asphalt',c=>{const r=random(341);c.fillStyle='#596169';c.fillRect(0,0,512,512);for(let i=0;i<19000;i++){const v=Math.floor(94+r()*60);c.fillStyle=`rgba(${v},${v},${v},${.10+r()*.15})`;c.fillRect(r()*512,r()*512,1+r()*2,1+r()*2);}for(let i=0;i<45;i++){c.strokeStyle='rgba(30,39,44,.12)';c.lineWidth=1+r();c.beginPath();const x=r()*512,y=r()*512;c.moveTo(x,y);c.lineTo(x+10+r()*40,y+(r()-.5)*3);c.stroke();}});}
export function waterTexture(){return canvasTexture('bridge-river',c=>{const r=random(713);c.fillStyle='#668f9b';c.fillRect(0,0,512,512);for(let i=0;i<800;i++){const x=r()*512,y=r()*512,l=8+r()*55;c.strokeStyle=i%3?'rgba(220,237,231,.22)':'rgba(38,92,111,.18)';c.lineWidth=.6+r()*1.6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.5,y-2-r()*2,x+l,y);c.stroke();}});}
export function faceTexture(id:number){return canvasTexture('modern-facade-'+id,c=>{
 const r=random(893+id*193);c.fillStyle=['#d4c2a8','#b6c2c4','#c9c3b8','#adbaad','#ddc7b0'][id%5];c.fillRect(0,0,512,512);
 const rows=8+id%4,cols=5+id%3,dx=512/cols,dy=512/rows;
 for(let y=0;y<rows;y++){c.fillStyle='rgba(72,85,91,.23)';c.fillRect(0,y*dy+dy-3,512,3);
  for(let x=0;x<cols;x++){const px=x*dx+dx*.13,py=y*dy+dy*.12,w=dx*.74,h=dy*.70;c.fillStyle='#536a78';c.fillRect(px-2,py-2,w+4,h+4);c.fillStyle=id%4===0?(r()>.4?'#728e9c':'#a4b5b2'):id%4===2?(r()>.3?'#6e8997':'#abc0bf'):(r()>.3?'#8baab5':'#afc6c5');c.fillRect(px,py,w,h);c.fillStyle='rgba(232,241,224,.42)';c.fillRect(px+w*.08,py+2,w*.15,h-4);c.fillStyle='rgba(32,57,68,.32)';c.fillRect(px+w*.49,py,2,h);}
 }
});}
export function texturedBox(p:THREE.Object3D,w:number,h:number,d:number,texture:THREE.Texture,x:number,y:number,z:number,repeat:[number,number]=[1,1]){
 const map=texture.clone();map.repeat.set(...repeat);map.needsUpdate=true;
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({map,color:'#ffffff'}));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
}
export function cityBuilding(p:THREE.Object3D,x:number,z:number,w:number,h:number,depth:number,id:number){
 const g=grp(p,x,0,z);texturedBox(g,w,h,depth,faceTexture(id),0,h/2,0);
 // Parapets, floor ledges, setback roofs and rooftop mechanical equipment break up the skyline.
 box(g,w+.12,.13,depth+.12,'#aeb7b4',0,h+.06,0);box(g,w+.06,.16,depth+.08,'#a6ada7',0,.2,0);
 if(id%3===0){box(g,w*.65,.26,depth*.55,'#c3c4b8',0,h+.24,-.04);box(g,w*.16,.18,depth*.14,'#879397',w*.17,h+.44,0);}
 if(id%5===1){box(g,w*.8,.32,depth*.7,'#9da9a5',0,h+.22,0);rod(g,[0,h+.4,0],[0,h+1.2,0],.025,'#829492');}
 if(id%5===2){for(const z of [-depth*.35,depth*.35])box(g,w*.9,.12,.12,'#d4d4c7',0,h+.2,z);}
 if(id%6===0){box(g,w*.22,.3,depth*.26,'#7e9293',-.18,h+.27,0);}
 if(id%4===0)for(let y=1;y<h;y+=1.4)box(g,w+.06,.045,depth+.06,'#d6d7c8',0,y,0);
}

export function stoneTexture(){return canvasTexture('sf-granite',c=>{
 const r=random(514);c.fillStyle='#c5c0af';c.fillRect(0,0,512,512);
 for(let i=0;i<14000;i++){const v=90+r()*110;c.fillStyle=`rgba(${v},${v},${v-8},.12)`;c.fillRect(r()*512,r()*512,1+r()*2,1+r()*2);}
 for(let row=0;row<12;row++)for(let col=-1;col<9;col++){c.strokeStyle='#a8a599';c.lineWidth=1.2;c.strokeRect(col*64+(row%2)*32,row*43,64,43);}
});}
export function pavementTexture(){return canvasTexture('sf-pavers',c=>{
 c.fillStyle='#c8c5b7';c.fillRect(0,0,512,512);const r=random(190);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){c.fillStyle=`rgba(83,76,69,${.03+r()*.07})`;c.fillRect(x*64+1,y*64+1,62,62);c.strokeStyle='#aca99d';c.lineWidth=1;c.strokeRect(x*64,y*64,64,64);}
});}
export function sky(p:THREE.Object3D,warm=false){
 const tex=canvasTexture(warm?'sf-gold-sky':'sf-sky',c=>{const g=c.createLinearGradient(0,0,0,512);g.addColorStop(0,warm?'#82a7c0':'#77aed2');g.addColorStop(1,'#ece8d6');c.fillStyle=g;c.fillRect(0,0,512,512);});
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(250,110),new THREE.MeshBasicMaterial({map:tex,depthWrite:false}));bg.position.set(0,32,-50);bg.layers.set(NOINK);p.add(bg);
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){const q=ball(p,1.2+(j%2)*.4,'#eeeee5',-27+i*17+j*1.3,12+(i%2)*4,-38);q.scale.set(1,.25,.1);}
}
export function lathe(p:THREE.Object3D,profile:[number,number][],color:string,x=0,y=0,z=0){return mesh(p,new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),40),color,x,y,z);}
export function ring(p:THREE.Object3D,r:number,t:number,color:string,x:number,y:number,z:number){const q=mesh(p,new THREE.TorusGeometry(r,t,6,48),color,x,y,z);q.rotation.x=Math.PI/2;return q;}
export function tree(p:THREE.Object3D,x:number,z:number,size=1){
 const g=grp(p,x,0,z);g.scale.setScalar(size);cylinder(g,.1,1.8,'#796e57',0,.9,0);
 for(let i=0;i<5;i++){const a=i*2.4;rod(g,[0,.9,0],[.45*Math.cos(a),2.05,.45*Math.sin(a)],.045,'#796e57');const crown=ball(g,.6,i%2?'#7d9676':'#8da17c',.36*Math.cos(a),1.9+(i%3)*.15,.36*Math.sin(a));crown.scale.set(1,1.18,.85);}
}
export function lamp(p:THREE.Object3D,x:number,z:number){
 cylinder(p,.11,.15,'#5a6765',x,.1,z);cylinder(p,.045,2.75,'#697671',x,1.45,z);cylinder(p,.1,.13,'#a4a994',x,2.8,z);
 const globe=ball(p,.18,'#ede9ce',x,3,z);globe.scale.y=1.22;box(p,.17,.05,.17,'#5b6764',x,3.23,z);
}
