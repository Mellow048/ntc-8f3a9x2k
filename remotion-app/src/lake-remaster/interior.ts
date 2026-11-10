import * as T from 'three';
import {floodSurface} from './water';
import {box,cyl,bar,V,batchStatic} from '../beer-remaster/build';
// A human-scale mine interior, not the wide explanatory cutaway.
export function interior(p:T.Group){
 const salt=new T.MeshPhongMaterial({color:'#777e7c',shininess:12,flatShading:true});
 const steel=new T.MeshPhongMaterial({color:'#373e42',shininess:65});
 const rust=new T.MeshPhongMaterial({color:'#886347',shininess:20});
 box(p,0,-.25,-9,10,.5,42,salt);box(p,0,4.5,-9,10,.5,42,salt);
 for(const side of [-1,1]){
 box(p,side*5,2,-9,.7,4.5,42,salt);
 for(let i=0;i<80;i++){
 const rock=new T.Mesh(new T.IcosahedronGeometry(.23+(i%7)*.07,0),salt);
 rock.position.set(side*(4.65+Math.sin(i*4)*.15),.4+(i%8)*.49,7-Math.floor(i/8)*3.7);rock.scale.set(.6,1.2,1.6);rock.castShadow=true;p.add(rock);
 }
 for(let z=6;z>-28;z-=4){bar(p,V(side*4.3,0,z),V(side*4.3,4.1,z),.17,steel);}
 for(const y of [1.3,1.55]){const pipe=cyl(p,side*4.2,y,-9,.065,39,rust);pipe.rotation.x=Math.PI/2;}
 }
 for(let z=6;z>-28;z-=4){box(p,0,4.08,z,8.8,.18,.22,steel);
 const glow=new T.MeshBasicMaterial({color:'#ffe0a2'});box(p,0,3.94,z,1.1,.07,.25,glow);
 const l=new T.PointLight('#ffd394',8,10,2);l.position.set(0,3.5,z);p.add(l);}
 for(const x of [-.8,.8])box(p,x,.07,-9,.09,.12,40,steel);
 for(let i=0;i<50;i++)box(p,0,.015,7-i*.75,2.25,.1,.15,rust);
 const cart=new T.Group();p.add(cart);cart.position.set(-.1,0,-8);
 box(cart,0,.8,0,1.7,1.1,2.5,steel);for(const x of [-.92,.92])for(const z of [-.8,.8]){const w=cyl(cart,x,.3,z,.3,.15,steel);w.rotation.z=Math.PI/2;}
 for(let i=0;i<20;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.2,0),salt);m.position.set(Math.sin(i*3)*.65,1.45+(i%3)*.08,Math.cos(i*4)*.9);cart.add(m);}
 batchStatic(p);
 const bit=new T.Group();bit.userData.dynamic=true;p.add(bit);cyl(bit,0,0,0,.14,4,steel);for(let i=0;i<3;i++){const tooth=cyl(bit,Math.sin(i*2.094)*.18,-2,Math.cos(i*2.094)*.18,.15,.28,rust,.05);tooth.rotation.z=.3;}bit.position.set(0,6,-1);
 const stream=box(p,0,2,-1,.85,4,.85,new T.MeshPhongMaterial({color:'#98c3cc',transparent:true,opacity:.8,shininess:95}));stream.userData.dynamic=true;
 const water=floodSurface(p,8.8,34);const flood=water.mesh;flood.position.set(0,.2,-8);
 const debris=Array.from({length:65},(_,i)=>{const m=new T.Mesh(new T.IcosahedronGeometry(.035+(i%5)*.025,0),i%3?salt:new T.MeshBasicMaterial({color:'#d3e7e9'}));m.userData.dynamic=true;p.add(m);return m;});
 return {bit,stream,flood,debris,water};
}
