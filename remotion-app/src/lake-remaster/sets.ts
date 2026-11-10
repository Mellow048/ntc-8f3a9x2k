import * as T from 'three';
import {V,box,cyl,sphere,bar,material,wood,timber,iron,stone,mesh,batchStatic} from '../beer-remaster/build';
import {rep,stoneHD,planksHD} from '../beer-remaster/style/paint';
export const steel=()=>material('lake-steel','#bd7044',undefined,true);
export function shoreline(p:T.Object3D){for(let i=0;i<20;i++){const a=i/20*Math.PI*2,x=Math.cos(a)*43,z=Math.sin(a)*43;const land=sphere(p,x,-1,z,10,material('bayou-bank','#788873',rep(stoneHD(),3,3)));land.scale.set(1,.25,1);for(let j=0;j<3;j++){const xx=x+Math.sin(i+j*2)*5,zz=z+Math.cos(i*2+j)*5;bar(p,V(xx,0,zz),V(xx,4,zz),.22,timber());const crown=sphere(p,xx,4.5,zz,2,material('bayou-leaves','#657f69'));crown.scale.y=.7;}}}
export function rig(p:T.Object3D){const g=new T.Group();g.userData.dynamic=true;p.add(g);const deck=material('rig-deck','#9c9a88',rep(planksHD(),3,3));box(g,0,1,0,7,.3,6,deck);
 for(const x of [-2.7,2.7])for(const z of [-2.3,2.3]){cyl(g,x,-.7,z,.18,3.4,iron());bar(g,V(x,1.2,z),V(x*.28,10,z*.28),.13,steel());}
 for(let k=0;k<5;k++){const y=1.5+k*1.6,s=2.5*(1-(y-1.2)/11);for(const z of [-s,s]){bar(g,V(-s,y,z),V(s,y,z),.09,steel());bar(g,V(-s,y,z),V(s*.82,y+1.5,z*.82),.07,steel());}for(const x of [-s,s]){bar(g,V(x,y,-s),V(x,y,s),.09,steel());bar(g,V(x,y,-s),V(x*.82,y+1.5,s*.82),.07,steel());}}
 for(const z of [-2.85,2.85]){for(const x of [-3,-1,1,3])bar(g,V(x,1.2,z),V(x,2.1,z),.05,iron());bar(g,V(-3.2,2.1,z),V(3.2,2.1,z),.05,iron());}
 box(g,-2,2,-.8,1.4,1.6,1.6,material('rig-cabin','#d1c3a1'));box(g,-2,2.25,.03,1,.65,.035,material('rig-glass','#7c9ba5'));for(let i=0;i<3;i++)cyl(g,2,1.5,-1.7+i*.9,.3,.65,steel());
 const pipe=cyl(g,0,3.5,0,.1,9,iron());pipe.userData.dynamic=true;for(let i=0;i<10;i++)box(g,-3.3,1.2+i*.32,0,.5,.06,.1,iron());
 // Working deck: winch drums, motor housing, cable routes, bolted gussets.
 for(const x of [-1.2,1.2]){const winch=cyl(g,x,1.65,-1.7,.42,.8,iron());winch.rotation.z=Math.PI/2;for(const dx of [-.42,.42]){const rim=cyl(g,x+dx,1.65,-1.7,.5,.06,steel());rim.rotation.z=Math.PI/2;}}
 box(g,1.8,1.55,1.7,1.3,.65,.8,iron());for(let k=0;k<9;k++)box(g,1.3+k*.12,1.9,1.7,.035,.08,.75,steel());
 for(const x of [-2.7,2.7])for(const z of [-2.3,2.3])for(let k=0;k<3;k++){const y=1.6+k*2.2;box(g,x*(1-k*.16),y,z*(1-k*.16),.38,.3,.04,iron());}
 for(let i=0;i<30;i++){const bolt=cyl(g,-3.1+(i%10)*.68,1.18,-2.5+Math.floor(i/10)*2.5,.035,.035,iron(),.035,6);}
 const cable=new T.Mesh(new T.TorusGeometry(.52,.025,6,40),iron());cable.rotation.x=Math.PI/2;cable.position.set(-1.6,1.2,1.7);g.add(cable);
 batchStatic(g);return {root:g,pipe};}
export function barge(p:T.Object3D,i:number){const g=new T.Group();g.userData.dynamic=true;p.add(g);const hull=material('barge-hull'+i%3,['#4c676c','#6a625c','#66734e'][i%3]);box(g,0,.1,0,1.9,.55,4.8,hull);box(g,0,.4,0,1.7,.12,4.5,wood());for(const x of [-.92,.92])box(g,x,.6,0,.09,.48,4.7,hull);for(const z of [-2.3,2.3])box(g,0,.6,z,1.9,.48,.09,hull);for(let j=0;j<3;j++)box(g,0,.65,(j-1)*1.2,1.5,.32,.85,material('barge-cargo','#aaa58d',rep(stoneHD(),1,1)));batchStatic(g);return g;}
export function mine(p:T.Object3D,close=false){const soil=material('soil-cut','#b58b63',rep(stoneHD(),5,2)),salt=material('salt-cut','#ccc8b2',rep(stoneHD(),5,3));
 // Front face is open: viewers can see the lake, shaft and mine in one diagram.
 for(const x of [-6.5,6.5])box(p,x,-1.3,-2.8,10,2,5,soil);box(p,0,-6.5,-3,23,8,4.5,salt);box(p,0,-8,1,23,.4,9,salt);
 for(const x of [-9,-5,5,9]){box(p,x,-5.1,1,1.2,5.4,2.2,salt);for(const z of [0,2.6])bar(p,V(x-.8,-7.7,z),V(x-.8,-2.9,z),.12,timber());box(p,x-.8,-2.9,1.3,2.2,.18,3.3,timber());}
 for(const x of [-6,6])box(p,x,-2.9,1,9,.35,4.6,salt);const drill=cyl(p,0,-2.5,1,.11,8,iron());drill.userData.dynamic=true;const bit=new T.Group();bit.userData.dynamic=true;p.add(bit);bit.position.set(0,-4.5,1);cyl(bit,0,0,0,.23,.55,steel(),.16);for(let i=0;i<3;i++){const b=box(bit,Math.sin(i*2.1)*.15,-.24,Math.cos(i*2.1)*.15,.15,.16,.2,iron());b.rotation.y=i*2.1;}
 for(const x of [-1,1])box(p,x,-7.65,1,.07,.1,8,iron());for(let k=0;k<12;k++)box(p,0,-7.73,-2.5+k*.65,2.6,.08,.13,timber());return {drill,bit};}
export function bathtub(p:T.Object3D){box(p,0,-.15,0,12,.25,12,material('bath-floor','#b5b7ac',rep(stoneHD(),5,5)));const tub=material('bath-enamel','#ece4cd');box(p,0,.5,0,4,.25,2.5,tub);for(const x of [-2,2])box(p,x,1,0,.25,1,2.7,tub);for(const z of [-1.3,1.3])box(p,0,1,z,4.2,1,.2,tub);const plug=cyl(p,0,.8,0,.22,.1,iron());plug.userData.dynamic=true;bar(p,V(1.6,1.1,-.8),V(1.6,1.9,-.8),.08,iron());bar(p,V(1.6,1.9,-.8),V(1.2,1.9,-.8),.08,iron());return plug;}
