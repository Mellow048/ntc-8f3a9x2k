import * as T from 'three';
import {V,box,cyl,sphere,bar,material,timber,iron,stone,wood,lamp,mesh} from './build';
import {brick,cobbleHD,rep,stoneHD,planksHD,facadeHD,roofHD,beamHD,ctex} from './style/paint';
import {NOINK} from './style/ink';
export const brickRed=()=>material('hall-brick','#ba7357',rep(brick(),3,3));
export function lettering(p:T.Object3D,text:string,x:number,y:number,z:number,w=2,h=.6,bg='#e8d6b3',ink='#46343a'){
 const tex=ctex('type-'+text+bg,1024,256,g=>{g.fillStyle=bg;g.fillRect(0,0,1024,256);g.strokeStyle=ink;g.lineWidth=6;g.strokeRect(18,18,988,220);g.fillStyle=ink;g.font=`bold ${text.length>21?51:74}px Georgia`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,130,960);});
 const m=new T.MeshBasicMaterial({map:tex});const o=mesh(p,new T.PlaneGeometry(w,h),m,V(x,y,z));o.layers.set(NOINK);return o;
}
export function paper(p:T.Object3D,text:string,x:number,y:number,z:number,w=1.5,h=1){
 const tex=ctex('paper-'+text,768,1024,g=>{g.fillStyle='#e9dcc0';g.fillRect(0,0,768,1024);g.strokeStyle='#947f64';g.lineWidth=5;g.strokeRect(24,24,720,976);g.fillStyle='#45333b';g.textAlign='center';g.font='bold 64px Georgia';g.fillText(text,384,150,690);for(let i=0;i<8;i++){g.fillStyle='#ab9980';g.fillRect(90,240+i*65,560-(i%3)*60,5);}});
 const o=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),V(x,y,z));o.layers.set(NOINK);return o;
}
export function ground(p:T.Object3D){box(p,0,-.14,0,90,.25,100,material('ground','#fff',rep(cobbleHD(),18,20)));}
export function house(p:T.Object3D,x:number,z:number,w=7,h=10,seed=0){
 const g=new T.Group();g.position.set(x,0,z);p.add(g);const col=['#d5bd96','#b98771','#d9cab0','#b69f86'][seed%4];
 box(g,0,h/2,-2.5,w,h,5,material('houseWall'+seed,col,rep(brick(),2,3)));
 const fac=material('fac'+seed,'#fff',facadeHD('kp-house'+seed,w,h,{wall:col,shutter:'#52615e',brick:seed%2===0,door:true}));mesh(g,new T.PlaneGeometry(w,h),fac,V(0,h/2,.025));
 for(let yy=1.7;yy<h;yy+=2.7)for(const xx of [-w*.28,w*.28]){box(g,xx,yy,.06,1.05,1.65,.13,material('window','#6a8390'));for(const dx of [-.62,.62])box(g,xx+dx,yy,.2,.13,1.95,.3,stone());box(g,xx,yy-.96,.25,1.5,.16,.42,stone());box(g,xx,yy,.2,.06,1.7,.1,stone());}
 for(const y of [.3,h-1,h])box(g,0,y,.12,w+.2,.16,.33,stone());
 const roof=material('slates','#fff',rep(roofHD('#5c6570',true),2,1));for(const s of [-1,1]){const o=box(g,0,h+.75,-2.5+s*1.45,w+.5,.2,3.4,roof);o.rotation.x=s*.48;}
 box(g,w*.33,h+1.2,-2.4,.65,2,.7,brickRed());cyl(g,w*.33,h+2.3,-2.4,.12,.4,material('chimney','#985d45'));
 cyl(g,w/2-.15,h/2,.38,.07,h,iron());lamp(g,-w*.32,2.7,.7);return g;
}
export function square(p:T.Object3D){ground(p);for(let i=0;i<4;i++){house(p,-15+i*9,-8,8,10+i%2*2,i);}
 for(const x of [-9,9]){cyl(p,x,2.1,4,.08,4.2,iron());lamp(p,x,4.4,4);}
}
function arch(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,rise:number,m:T.Material){
 const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h);shape.quadraticCurveTo(-w/2,h+rise,0,h+rise*1.35);shape.quadraticCurveTo(w/2,h+rise,w/2,h);shape.lineTo(w/2,0);shape.closePath();
 const o=mesh(p,new T.ShapeGeometry(shape,20),m,V(x,y,z));return o;
}
export function hall(p:T.Object3D){square(p);const b=brickRed(),s=stone();
 box(p,0,5.3,-4.6,16,10.6,5.5,b);box(p,0,10.7,-4.6,16.5,.35,5.9,s);
 for(const x of [-7.7,-4,4,7.7])box(p,x,5.3,-1.65,.38,10.6,.6,b);
 for(const y of [1.25,4.65,8.1])box(p,0,y,-1.72,16.25,.2,.55,s);
 for(const x of [-6,-3.9,3.9,6])for(const y of [2.2,5.7,8.4]){
  arch(p,x,y,-1.73,1.25,1.55,.45,material('hall-glass','#506b78'));
  for(const dx of [-.75,.75])box(p,x+dx,y+.7,-1.55,.16,1.8,.3,s);
  box(p,x,y-.1,-1.4,1.7,.16,.55,s);box(p,x,y+.85,-1.4,.07,1.65,.13,s);
 }
 // Deep pointed portal, carved stone surround, separate wooden door leaves.
 arch(p,0,.8,-1.4,3.5,3.4,1.2,s);arch(p,0,.8,-1.32,2.8,3.1,1.05,material('portal-dark','#28313b'));
 for(const x of [-.69,.69]){const leaf=box(p,x,2.1,-1.22,1.32,2.6,.18,material('door-oak','#725442',rep(beamHD(),1,2)));for(const y of [1.2,2.2,3.1])box(p,x,y,-1.09,1.1,.08,.08,iron());sphere(p,x*.3,2,-1.04,.07,material('knob','#c9b777',undefined,true));}
 for(let i=0;i<5;i++)box(p,0,.1+i*.16,.95-i*.43,5.2,.2,2-i*.27,s);
 for(const x of [-2.45,2.45])bar(p,V(x,.25,1.75),V(x,1.65,-.7),.07,iron());
 lettering(p,'TOWN HALL',0,5.25,-1.35,3.6,.55);
 // Offset belfry + clock, steep four-sided spire (not a pyramid house).
 box(p,4.9,13,-4.3,3.6,5,3.6,b);for(const x of [3.65,6.15])arch(p,x,12,-2.46,.65,1.4,.3,material('bell-dark','#2d3542'));
 const clock=cyl(p,4.9,14.5,-2.43,.85,.08,s,.85,32);clock.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=box(p,4.9+Math.sin(a)*.66,14.5+Math.cos(a)*.66,-2.36,.05,.12,.03,iron());o.rotation.z=-a;}
 bar(p,V(4.9,14.5,-2.32),V(4.9,15.03,-2.32),.05,iron());bar(p,V(4.9,14.5,-2.31),V(5.27,14.35,-2.31),.06,iron());
 const sp=mesh(p,new T.ConeGeometry(3.1,7,4),material('spire','#4f6570',roofHD('#526271',true)),V(4.9,19,-4.3));sp.rotation.y=Math.PI/4;
 cyl(p,4.9,23,-4.3,.06,1.6,iron());sphere(p,4.9,23.5,-4.3,.15,material('spiregold','#d5b66e',undefined,true));
 for(const x of [-6,-2,2]){const roof=mesh(p,new T.ConeGeometry(2,3,4),b,V(x,11.9,-4));roof.rotation.y=Math.PI/4;}
}
export function room(p:T.Object3D,kind='office'){
 box(p,0,-.15,0,15,.3,15,material('floor','#dfc09b',rep(planksHD(),5,5)));
 box(p,0,3.2,-4.3,15,6.4,.3,material('plaster-'+kind,kind==='prison'?'#8c9296':'#c9b69a',rep(stoneHD(),4,2)));
 box(p,-7.4,3,0,.3,6,9,material('plaster-side','#c4b099'));
 for(const y of [.2,1.25,5.8])box(p,0,y,-4.05,15,.13,.22,timber());
 for(const x of [-4,4]){box(p,x,3.4,-4.04,2.3,2.7,.06,material('skyglass','#a9c6d7'));for(const dx of [-1.25,0,1.25])box(p,x+dx,3.4,-3.95,.09,2.9,.15,timber());box(p,x,3.4,-3.91,2.5,.1,.16,timber());box(p,x,1.9,-3.8,2.8,.18,.5,stone());}
 for(const x of [-6,6]){lamp(p,x,3.6,-3.5,true);box(p,x,.75,-3.5,1.5,1.5,.6,wood());}
}
export function desk(p:T.Object3D,x=0,z=0,w=3.6){
 box(p,x,1.15,z,w,.18,1.75,wood());for(const dx of [-w*.43,w*.43])for(const dz of [-.65,.65])box(p,x+dx,.55,z+dz,.14,1.1,.14,timber());
 for(let i=0;i<3;i++)box(p,x-w*.32,1.29+i*.09,z+.1,.7,.09,.55,material('book'+i,['#65715d','#705366','#6b7887'][i]));
 cyl(p,x+w*.35,1.32,z-.4,.1,.16,iron());bar(p,V(x+w*.35,1.4,z-.4),V(x+w*.35+.25,1.9,z-.4),.025,material('quill','#f1dfbf'));return p;
}
export function bag(p:T.Object3D,x:number,y:number,z:number){const g=new T.Group();p.add(g);g.position.set(x,y,z);const sack=material('sack','#b9905f',rep(beamHD(),1,1));const o=sphere(g,0,.32,0,.42,sack);o.scale.set(1,1.1,.8);cyl(g,0,.66,0,.18,.12,sack,.25);const tie=mesh(g,new T.TorusGeometry(.19,.025,6,18),timber(),V(0,.67,0));tie.rotation.x=Math.PI/2;return g;}
export function mug(p:T.Object3D,x:number,y:number,z:number){const g=new T.Group();g.position.set(x,y,z);p.add(g);cyl(g,0,.17,0,.14,.34,material('beer-glass','#c79749'),.15);cyl(g,0,.34,0,.15,.07,material('foam','#f0e0ba'));const h=mesh(g,new T.TorusGeometry(.1,.025,6,14),material('handle','#c3a975'),V(.15,.18,0));return g;}
export function bars(p:T.Object3D,z=1){const g=new T.Group();p.add(g);for(let x=-2.7;x<=2.7;x+=.45)cyl(g,x,1.85,z,.045,3.7,iron());for(const y of [.3,2,3.6])box(g,0,y,z,5.7,.09,.13,iron());return g;}
