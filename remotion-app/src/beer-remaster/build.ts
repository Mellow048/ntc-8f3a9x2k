import * as T from 'three';
import {twoTone} from './style/shade';
import {beamHD,brick,cobbleHD,facadeHD,planksHD,rep,roofHD,stoneHD} from './style/paint';
export const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export const M=new Map<string,T.Material>();
export function material(key:string,color:string,map?:T.Texture,metal=false){if(!M.has(key)){const p={color,map,side:T.FrontSide};M.set(key,metal?twoTone(new T.MeshPhongMaterial({...p,specular:'#9c9caa',shininess:45}),.35):twoTone(new T.MeshLambertMaterial(p)));}return M.get(key)!;}
export const wood=()=>material('aged-oak','#b98b57',planksHD());
export const timber=()=>material('beam','#91704c',beamHD());
export const iron=()=>material('iron','#424757',undefined,true);
export const stone=()=>material('stone','#d7cabb',stoneHD());
export const brickM=()=>material('brick','#bd8165',rep(brick(),2,2));
const boxG=new T.BoxGeometry(1,1,1);
export function mesh(p:T.Object3D,g:T.BufferGeometry,m:T.Material,pos:T.Vector3){const o=new T.Mesh(g,m);o.position.copy(pos);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
export function box(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const o=mesh(p,boxG,m,V(x,y,z));o.scale.set(w,h,d);return o;}
export function cyl(p:T.Object3D,x:number,y:number,z:number,r:number,h:number,m:T.Material,rt=r,n=16){return mesh(p,new T.CylinderGeometry(rt,r,h,n),m,V(x,y,z));}
export function sphere(p:T.Object3D,x:number,y:number,z:number,r:number,m:T.Material){return mesh(p,new T.SphereGeometry(r,12,8),m,V(x,y,z));}
export function bar(p:T.Object3D,a:T.Vector3,b:T.Vector3,w:number,m:T.Material){const o=box(p,0,0,0,w,a.distanceTo(b),w,m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;}
export function lamp(p:T.Object3D,x:number,y:number,z:number,lit=false){const g=new T.Group();g.position.set(x,y,z);p.add(g);const glow=new T.MeshPhongMaterial({color:'#f7c77b',emissive:lit?'#ffb340':'#000000',emissiveIntensity:lit?2:0,transparent:true,opacity:.75});box(g,0,0,0,.32,.5,.32,glow);for(const xx of [-.19,.19])for(const zz of [-.19,.19])bar(g,V(xx,-.3,zz),V(xx,.3,zz),.04,iron());box(g,0,.3,0,.48,.08,.48,iron());box(g,0,-.3,0,.4,.05,.4,iron());const cap=mesh(g,new T.ConeGeometry(.35,.24,4),iron(),V(0,.45,0));cap.rotation.y=Math.PI/4;return g;}
export function barrel(p:T.Object3D,x:number,z:number,s=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);cyl(g,0,.6,0,.4,1.2,wood(),.38);for(const y of [.15,.55,1.05]){const ring=mesh(g,new T.TorusGeometry(.405,.035,6,28),iron(),V(0,y,0));ring.rotation.x=Math.PI/2;}return g;}
export function terrace(p:T.Object3D,side:number,i:number){
 const g=new T.Group();g.position.set(side*7.8,0,-i*5.5-4);g.rotation.y=-side*Math.PI/2;p.add(g);
 const w=5.5,h=[9.8,10.5,9.2,10.1][i%4],d=5.2;const colors=['#a97864','#c4b399','#9b6e5b','#c9bda5','#ae8067'];
 const wall=material('wall'+i,colors[i%5],rep(brick(),1.2,2.3));box(g,0,h/2,-d/2,w,h,d,wall);
 const face=material('facade'+i,'#ffffff',facadeHD('beer-terrace'+i,w,h,{wall:colors[i%5],shutter:['#4a5b59','#5c5363','#4e6473'][i%3],door:false,brick:true}));
 const plane=mesh(g,new T.PlaneGeometry(w,h),face,V(0,h/2,.018));plane.receiveShadow=true;plane.castShadow=false;
 // Real ledges and glazing in addition to the painted facade; shadows give depth.
 for(const yy of [1.525,4.325,7.125])for(const xx of [-1.375,1.375]){
  box(g,xx,yy,.07,.85,1.25,.10,material('glass','#3f5367',undefined,true));
  for(const dx of [-.49,.49])box(g,xx+dx,yy,.17,.1,1.45,.22,stone());
  box(g,xx,yy-.72,.25,1.35,.14,.5,stone());box(g,xx,yy+.72,.16,1.25,.17,.28,stone());
  box(g,xx,yy,.23,.055,1.3,.08,stone());box(g,xx,yy+.1,.23,1,.055,.08,stone());
 }
 for(const yy of [.22,3.85,h-.25])box(g,0,yy,.08,w+.1,.16,.32,stone());
 box(g,0,h+.05,-2.55,w+.5,.22,d+.5,stone());
 // Continuous slate roof, not pyramid toy houses.
 const roofMat=material('roof','#ffffff',rep(roofHD('#545965',true),1.5,1));
 for(const sideZ of [-1,1]){const roof=box(g,0,h+.65,-2.55+sideZ*1.4,w+.45,.16,3.3,roofMat);roof.rotation.x=sideZ*.43;}
 for(const xx of [-2.15,2.15]){box(g,xx,h+1.25,-2.6,.65,1.8,.7,brickM());for(const dx of [-.19,.19])cyl(g,xx+dx,h+2.32,-2.6,.11,.45,material('terracotta','#995e47'));}
 // Recessed entrance and raised escape steps.
 box(g,0,1.2,.13,1.2,2.4,.12,material('door'+i,['#344b48','#614149','#4d5263'][i%3],rep(beamHD(),1,2)));
 for(const xx of [-.73,.73])box(g,xx,1.3,.27,.16,2.6,.3,stone());box(g,0,2.65,.2,1.7,.25,.4,stone());
 for(let k=0;k<3;k++)box(g,0,.12+k*.16,.9-k*.22,1.8,.2,1.1-k*.18,stone());
 sphere(g,.4,1.2,.25,.045,material('brass','#d2a350',undefined,true));
 lamp(g,1,2.45,.6);bar(g,V(1,2.8,.1),V(1,2.8,.6),.07,iron());
 // Cellar light wells, railings, drainpipes.
 for(const xx of [-2.1,2.1]){box(g,xx,.5,.27,.7,.8,.2,material('cellar-dark','#29343c'));for(let r=0;r<4;r++)bar(g,V(xx-.3+r*.2,.15,.43),V(xx-.3+r*.2,.85,.43),.025,iron());}
 cyl(g,2.65,h/2,.3,.06,h,iron());
 return g;
}
export function street(p:T.Object3D){
 box(p,0,-.28,-18,60,.45,100,material('street-cobble','#ffffff',rep(cobbleHD(),12,20)));
 for(const side of [-1,1]){box(p,side*5.9,.08,-18,2.4,.25,80,material('pavement','#c2b6a1',rep(stoneHD(),2,18)));box(p,side*4.66,.12,-18,.22,.3,80,stone());for(let i=0;i<8;i++)terrace(p,side,i);}
 for(let i=0;i<10;i++)for(const side of [-1,1]){const z=6-i*5;cyl(p,side*4.8,.55,z,.09,1.1,iron());sphere(p,side*4.8,1.1,z,.12,iron());}
 // Period cart against the far wall, kept outside every core sightline.
 const cart=new T.Group();cart.position.set(4.9,0,-16);p.add(cart);box(cart,0,.8,0,1.3,.18,2,wood());for(const xx of [-.65,.65]){box(cart,xx,1.1,0,.08,.65,2.1,timber());const wh=cyl(cart,xx,.52,0,.48,.10,iron());wh.rotation.z=Math.PI/2;}barrel(cart,0,0,.7);
}
export type VatRig={group:T.Group;staves:T.Mesh[];bands:T.Mesh[]};
export function vat(p:T.Object3D,x=0,z=0,s=1):VatRig{
 const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);const staves:T.Mesh[]=[],bands:T.Mesh[]=[];
 const profile=[new T.Vector2(2.65,.25),new T.Vector2(2.78,1),new T.Vector2(2.95,3.6),new T.Vector2(2.85,6.8),new T.Vector2(2.7,7.4)];
 for(let i=0;i<36;i++){const o=mesh(g,new T.LatheGeometry(profile,3,i*Math.PI*2/36,Math.PI*2/36-.006),material('vat-oak'+i%4,['#b28b5c','#ad8251','#b98e59','#a77b4c'][i%4],rep(beamHD(),1,4)),V(0,0,0));staves.push(o);}
 cyl(g,0,.18,0,2.7,.24,timber());cyl(g,0,7.34,0,2.66,.07,material('porter-top','#37211a',undefined,true));
 for(let k=0;k<6;k++){const y=.65+k*1.24,r=2.73+Math.sin(y/7.4*Math.PI)*.24;const ring=mesh(g,new T.TorusGeometry(r,.09,8,72),iron(),V(0,y,0));ring.rotation.x=Math.PI/2;bands.push(ring);for(let j=0;j<18;j++){const a=j*Math.PI/9;sphere(g,Math.cos(a)*(r+.065),y,Math.sin(a)*(r+.065),.045,iron());}}
 for(const xx of [-1.9,1.9])box(g,xx,.12,0,.5,.24,4.9,timber());
 return {group:g,staves,bands};
}
export function warehouse(p:T.Object3D){
 box(p,0,-.2,0,32,.35,30,material('warehouse-floor','#ffffff',rep(planksHD(),5,5)));
 box(p,0,5,-7,30,10,.65,brickM());for(const xx of [-11,11])box(p,xx,5,-.5,.6,10,22,brickM());
 for(const x of [-8,-3,3,8]){box(p,x,6,-6.6,2.4,5.7,.1,material('warehouse-window','#9fb1bb',undefined,true));for(const y of [3.3,5.2,7.1,9])box(p,x,y,-6.4,2.55,.09,.14,timber());for(const dx of [-1.25,0,1.25])box(p,x+dx,6,-6.4,.09,5.8,.14,timber());}
 for(const x of [-9,9]){box(p,x,5,0,.5,10,.5,timber());for(const z of [-4,2,7])bar(p,V(x,7.8,z),V(x,9.7,z-2),.25,timber());}
 for(const z of [-5,0,5]){box(p,0,9.7,z,22,.45,.45,timber());bar(p,V(-10,9.5,z),V(0,11.4,z),.3,timber());bar(p,V(0,11.4,z),V(10,9.5,z),.3,timber());}
 const hero=vat(p);vat(p,-7,-3,.77);vat(p,7,-3,.77);
 for(let i=0;i<4;i++)barrel(p,-6+i*1.05,4,.85);
 // A real access ladder and elevated walkway communicate the scale.
 for(const x of [3.6,4.4])bar(p,V(x,.2,1.4),V(x,6.7,-.2),.09,timber());for(let i=0;i<13;i++){const y=.3+i*.49,z=1.4-y/6.7*1.6;bar(p,V(3.6,y,z),V(4.4,y,z),.065,timber());}
 box(p,0,7.45,-3.5,8,.16,1.25,wood());for(const x of [-3.8,0,3.8])bar(p,V(x,7.5,-3),V(x,8.6,-3),.07,iron());bar(p,V(-3.8,8.6,-3),V(3.8,8.6,-3),.07,iron());
 return hero;
}
