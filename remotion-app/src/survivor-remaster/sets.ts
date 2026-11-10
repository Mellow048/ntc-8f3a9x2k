import * as T from 'three';
import {box,cyl,bar,V,material,wood,timber,iron,stone,mesh} from '../beer-remaster/build';
import {rep,planksHD,stoneHD,roofHD} from '../beer-remaster/style/paint';
export const plaster=()=>material('jp-plaster','#ddd0b7',rep(stoneHD(),2,2));
export function house(p:T.Object3D,x:number,z:number,w=4){const g=new T.Group();g.position.set(x,0,z);p.add(g);
 box(g,0,1.6,0,w,3.2,3.8,plaster());
 for(const xx of [-w/2,0,w/2])box(g,xx,1.6,2,.11,3.3,.14,timber());
 for(const y of [.25,1.2,2.9])box(g,0,y,2,w,.12,.16,timber());
 const paper=material('shoji-paper','#e7dcbf');
 for(const x of [-w*.25,w*.25]){box(g,x,1.65,2.04,w*.38,1.7,.1,paper);for(let j=0;j<5;j++)box(g,x+(j-2)*w*.075,1.65,2.12,.035,1.7,.04,timber());for(const y of [1,1.5,2,2.5])box(g,x,y,2.12,w*.39,.035,.04,timber());}
 const rm=material('jp-roof','#596375',rep(roofHD('#596375'),3,2));
 for(const side of [-1,1]){const r=box(g,side*w*.27,3.5,0,w*.64,.16,4.7,rm);r.rotation.z=-side*.36;box(g,side*(w*.56),3.08,0,.16,.16,4.8,timber());}
 box(g,0,3.9,0,.18,.15,4.8,rm);box(g,0,.05,2.4,w+1,.18,.9,stone());return g;}
export function town(p:T.Object3D,ruined=false){box(p,0,-.22,-9,70,.4,90,material('jp-road','#aaa394',rep(stoneHD(),14,18)));
 for(let i=0;i<7;i++)for(const side of [-1,1]){if(ruined&&i<3){const g=new T.Group();p.add(g);g.position.set(side*6,0,-i*5.4-3);for(let k=0;k<10;k++){const b=box(g,Math.sin(k*3.7)*2,.25+(k%3)*.2,Math.cos(k*2.1)*1.5,1.5,.15,.4,timber());b.rotation.set(k*.2,k*.7,k*.1);}bar(g,V(-1,0,1),V(-.8,2.3,.8),.16,timber());}else house(p,side*7,-i*5.4-4,4.8);}
 for(let i=0;i<8;i++){const x=Math.sin(i*3.4)*33,z=-45-i*3;const m=mesh(p,new T.SphereGeometry(13+i%3*4,24,12),material('jp-hill','#8c9b98'),V(x,-4,z));m.scale.set(1,.6,.7);}
 for(const x of [-4.7,4.7]){bar(p,V(x,0,-5),V(x,6,-5),.15,timber());bar(p,V(x-.8,5.4,-5),V(x+.8,5.4,-5),.08,timber());}
}
export function room(p:T.Object3D,kind:string){box(p,0,-.2,0,12,.3,12,material('jp-floor','#c2a56b',rep(planksHD(),5,5)));box(p,0,2.4,-4,12,5,.3,plaster());
 for(const x of [-5,-2,2,5])box(p,x,2.3,-3.8,.13,4.8,.25,timber());for(const y of [.2,3,4.6])box(p,0,y,-3.8,12,.15,.25,timber());
 for(const x of [-3.3,3.3]){box(p,x,2.1,-3.77,2.3,2.5,.04,material('jp-window','#b8c9cf'));for(let i=0;i<5;i++)box(p,x+(i-2)*.45,2.1,-3.65,.045,2.55,.08,timber());for(let i=0;i<4;i++)box(p,x,1+i*.7,-3.65,2.4,.04,.08,timber());}
 if(kind==='shelter'||kind==='home'){for(let i=0;i<5;i++)box(p,(i-2)*1.7,-.01,.1,1.6,.07,6,material('tatami'+i,i%2?'#b9ad78':'#c4b888',rep(planksHD(),1,3)));box(p,0,.45,1,1.7,.12,1,wood());for(const x of [-.65,.65])box(p,x,.2,1,.1,.4,.8,timber());const bed=box(p,-2,.14,-1.8,1.3,.18,2.3,material('futon','#c0b5a1'));box(p,-2,.3,-2.65,1,.2,.5,material('pillow','#e7decc'));}
 else {box(p,0,1.1,.7,3.6,.16,1.8,wood());for(const x of [-1.5,1.5])for(const z of [0,1.4])box(p,x,.5,z,.12,1,.12,timber());for(let i=0;i<4;i++)box(p,-.8,1.22+i*.05,.7,.8,.05,.6,material('files'+i,['#707b76','#95775a','#6d6e86','#b1a78e'][i]));}
}
export function train(p:T.Object3D){box(p,0,-.22,0,80,.3,70,material('rail-gravel','#8b8b87',rep(stoneHD(),20,20)));for(let i=0;i<55;i++)box(p,(i-27)*1.3,-.02,0,.24,.15,3.3,timber());for(const z of [-1,1])box(p,0,.12,z,90,.13,.13,iron());
 box(p,0,.35,4.1,60,.7,4.8,stone());for(let i=0;i<10;i++)bar(p,V((i-5)*6,.7,6),V((i-5)*6,4.9,6),.12,timber());box(p,0,5,5,62,.2,5,timber());
 const g=new T.Group();g.userData.dynamic=true;p.add(g);const body=material('train-body','#405a58'),glass=material('train-glass','#829aa7');
 for(let i=0;i<3;i++){const x=-i*6.2;box(g,x,1.9,0,5.8,2.7,2.7,body);box(g,x,3.35,0,6,.25,2.9,iron());for(const z of [-1.39,1.39])for(let j=0;j<5;j++){box(g,x+(j-2)*.9,2.4,z,.7,.8,.05,glass);for(const dx of [-.4,.4])box(g,x+(j-2)*.9+dx,2.4,z,.05,.9,.08,timber());}for(const xx of [-1.9,1.9])for(const z of [-1.2,1.2]){const w=cyl(g,x+xx,.55,z,.44,.2,iron());w.rotation.x=Math.PI/2;}}
 // Engine is clearly mechanical, not a sliding black box.
 const e=new T.Group();g.add(e);e.position.x=5.2;const boiler=cyl(e,0,1.65,0,.85,4.3,iron());boiler.rotation.z=Math.PI/2;box(e,-2.4,2,0,1.5,2.6,2.6,body);cyl(e,1.2,2.9,0,.25,1.1,iron());for(let i=0;i<3;i++)for(const z of [-1.15,1.15]){const w=cyl(e,-1.4+i*1.3,.6,z,.55,.2,iron());w.rotation.x=Math.PI/2;}bar(e,V(-1.4,.65,1.3),V(1.2,.65,1.3),.09,stone());
 return g;}
