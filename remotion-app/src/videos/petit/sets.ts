import * as T from 'three';
import {V,box,cyl,sphere,bar,material,timber,iron,stone,wood,lamp,mesh} from './build';
import {brick,cobbleHD,rep,stoneHD,planksHD,facadeHD,roofHD,beamHD,ctex,towerGlass} from './style/paint';
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
export function ground(p:T.Object3D){
 box(p,0,-.14,0,90,.25,100,material('ground','#fff',rep(cobbleHD(),18,20)));
 farGround(p);
}
/** A large, fog-matched base plane under every outdoor set: nothing can float over the horizon. */
export function farGround(p:T.Object3D){
 box(p,0,-.55,-60,520,.5,520,material('far-ground','#b9c3bd'));
 box(p,0,.02,-74,420,.12,300,material('far-city','#9aa6a6'));
}
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
// ---- Petit: Twin Towers, wire, elevator, street, park ----
export function twinTowers(p:T.Object3D,opts:{gap?:number;height?:number;roofY?:number;wire?:boolean;z?:number}={}){
 const gap=opts.gap??14,height=opts.height??38,roofY=opts.roofY??12,CZ=opts.z??-6;
 const glass=material('towerGlass','#ffffff',rep(towerGlass(),2,6));
 const frame=material('towerFrame','#2f4a52');
 for(const side of [-1,1]){
  const x=side*(gap/2+3.2);
  // Main shaft: box is one construction part; window grid + mullions + spandrels make it a tower.
  box(p,x,height/2,CZ,6.4,height,6.4,glass);
  // Vertical mullions + horizontal spandrels (real geometry in front of glass)
  for(let i=0;i<7;i++){const xx=x-3+i;box(p,xx,height/2,CZ+3.22,.12,height,.12,frame);}
  for(let y=2;y<height;y+=2.2){box(p,x,y,CZ+3.22,6.4,.16,.14,frame);}
  // Roof: parapet, stair house with a door, water tank on legs, vents, antenna with a beacon
  box(p,x,roofY+.3,CZ,6.8,.6,6.8,frame);
  box(p,x,roofY+.9,CZ-2.2,6.6,.55,.55,material('parapet','#a4b0b6'));
  box(p,x,roofY+.9,CZ+2.2,6.6,.55,.55,material('parapet','#a4b0b6'));
  for(const sd of [-1,1])box(p,x+sd*3.25,roofY+.9,CZ,.55,.55,6.6,material('parapet','#a4b0b6'));
  box(p,x-1.6,roofY+1.5,CZ-1.6,2.2,1.8,2.0,material('stairhouse','#9aa6ac'));
  box(p,x-1.6,roofY+2.5,CZ-1.5,2.4,.18,2.2,material('stairroof','#7d8a90'));
  box(p,x-1.6,roofY+1.0,CZ-.55,.7,1.1,.08,material('stairdoor','#4e5a62'));
  // wooden water tank on a steel frame
  for(const dx of [-.5,.5])for(const dz of [-.5,.5])bar(p,V(x+1.6+dx,roofY+.6,CZ+.6+dz),V(x+1.6+dx,roofY+1.5,CZ+.6+dz),.07,iron());
  cyl(p,x+1.6,roofY+2.4,CZ+.6,1.0,1.9,material('tank','#9a6a44',rep(beamHD(),2,1)));
  const cone=mesh(p,new T.ConeGeometry(1.1,.7,12),material('tanktop','#7d5636'),V(x+1.6,roofY+3.7,CZ+.6));
  // vents
  for(const vx of [.9,1.9]){cyl(p,x+vx,roofY+1.0,CZ+1.4,.22,.7,material('vent','#8a949a'));const cap=mesh(p,new T.ConeGeometry(.3,.2,10),material('ventcap','#6f7a80'),V(x+vx,roofY+1.4,CZ+1.4));}
  cyl(p,x+2.4,roofY+2.4,CZ-1.4,.08,3.2,iron());sphere(p,x+2.4,roofY+4.1,CZ-1.4,.16,material('beacon','#ff6b5a',undefined,true));
  // Base podium
  box(p,x,1.2,CZ,8,2.4,8,material('podium','#8a9aa2'));
 }
 // Taut feed cable between the roofs (world adds the sagging walk wire where it belongs).
 if(opts.wire!==false){bar(p,V(-(gap/2+3.2),roofY+1.2,CZ),V(gap/2+3.2,roofY+1.2,CZ),.05,iron());}
 return {roofY,gap};
}
export function wireLine(p:T.Object3D,a:T.Vector3,b:T.Vector3,sag=0){
 const g=new T.Group();p.add(g);g.userData.dynamic=true;
 const pts:T.Vector3[]=[];for(let i=0;i<=24;i++){const t=i/24;const v=a.clone().lerp(b,t);v.y-=Math.sin(t*Math.PI)*sag;pts.push(v);}
 const curve=new T.CatmullRomCurve3(pts);const geo=new T.TubeGeometry(curve,32,.035,6,false);
 const o=new T.Mesh(geo,iron());g.add(o);return g;
}
export function elevatorCar(p:T.Object3D,x=0,z=0){
 box(p,x,1.6,z,3.2,3.2,2.6,material('elevator','#7a8a94'));
 // recessed doorway: frame ring, dark interior, sill
 box(p,x,1.34,z+1.29,1.78,2.78,.14,material('elevframe','#55636b'));
 box(p,x,1.34,z+1.24,1.42,2.56,.08,material('elevinner','#2b3238'));
 box(p,x,.03,z+1.27,1.92,.07,.72,material('elevsill','#6a757c'));
 box(p,x,3.35,z,3.4,.22,2.8,iron());
 for(const dx of [-1.4,1.4])box(p,x+dx,.15,z, .18,.3,2.6,timber());
 // header sign bolted flat to the fascia above the doors
 box(p,x,3.74,z+1.24,1.92,.42,.12,material('elevsign','#e8e4d6'));
 lettering(p,'FREIGHT',x,3.74,z+1.31,1.66,.32,'#2f4a52','#e8ecef');
 return {front:z+1.29};
}
export function lobby(p:T.Object3D){
 box(p,0,-.1,0,16,.2,14,material('marble','#e6e2d8',rep(stoneHD(),5,5)));
 box(p,0,3.4,-4.6,16,6.8,.4,material('lobbyGlass','#ffffff',rep(towerGlass(),3,3)));
 const frame=material('lobbyFrame','#9aa4ac',undefined,true);
 for(const x of [-4,0,4])box(p,x,3.4,-4.36,.16,6.8,.14,frame);
 for(const y of [1.2,3.4,5.6])box(p,0,y,-4.36,16,.14,.14,frame);
 box(p,0,6.9,-3.2,16,.24,3.2,material('lobbyCeil','#d8d6d0'));
 for(let i=0;i<4;i++)box(p,0,6.76,-1.9-i*1.1,9,.08,.4,material('lobbyLight','#f6f0da'));
 for(const x of [-7.4,7.4])box(p,x,3.4,0,.3,6.8,9,material('lobbySide','#cfcbc2'));
 // reception desk with a stone counter and a brass plate
 box(p,-1.4,.7,-1.6,2.9,1.0,.9,material('reception','#8d9aa3'));
 box(p,-1.4,1.25,-1.6,3.1,.12,1.1,material('counter','#e9e4d8',rep(stoneHD(),2,1)));
 lettering(p,'PORT AUTHORITY',-1.4,1.85,-2.06,2.2,.4,'#2f4a52','#e8ecef');
 // stacked chairs and a wet-paint bucket: nothing is finished
 for(let i=0;i<3;i++)box(p,2.2+i*.1,.3,.2,.7,.6,.7,material('chair','#5a5f6a'));
 cyl(p,3.6,.2,1.4,.3,.4,material('bucket','#b8452f'));
 // stanchions with a rope
 for(const x of [-3.6,-1.4,.8]){cyl(p,x,.5,1.1,.06,1.0,material('stanchion','#c9a24a',undefined,true));sphere(p,x,1.02,1.1,.08,material('stanchionTop','#c9a24a',undefined,true));}
 return p;
}
export function carNY(p:T.Object3D,x:number,z:number,col:string,rot=0){
 const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;p.add(g);
 const body=material('car'+col,col);
 box(g,0,.52,0,1.76,.42,3.9,body);              // main body
 box(g,0,.70,-.9,1.7,.22,2.0,body);             // rear deck rise
 box(g,0,.70,1.02,1.72,.2,1.7,body);            // hood
 box(g,0,.98,-.15,1.52,.44,1.86,material('carRoof'+col,col)); // cabin shell
 box(g,0,1.02,.79,1.38,.34,.06,material('carGlass','#3f5367',undefined,true));  // windscreen
 box(g,0,1.02,-1.06,1.38,.32,.06,material('carGlass','#3f5367',undefined,true)); // rear glass
 for(const sx of [-1,1])box(g,sx*.77,1.0,-.2,.06,.3,1.6,material('carGlass','#3f5367',undefined,true)); // side glass
 box(g,0,1.21,-.15,1.46,.06,1.7,material('carRoof2'+col,col)); // roof
 for(const sz of [1.96,-1.96])box(g,0,.42,sz,1.7,.14,.12,material('chrome','#cfd3d8',undefined,true)); // bumpers
 box(g,-.56,.6,1.98,.34,.18,.06,material('headlight','#ffe9a8'));box(g,.56,.6,1.98,.34,.18,.06,material('headlight','#ffe9a8'));
 box(g,-.56,.58,-1.98,.3,.16,.06,material('taillight','#c0392b'));box(g,.56,.58,-1.98,.3,.16,.06,material('taillight','#c0392b'));
 for(const dx of [-.86,.86])for(const dz of [-1.28,1.28]){
  const tire=cyl(g,dx,.42,dz,.34,.2,material('tire','#22242a'));tire.rotation.z=Math.PI/2;
  const hub=cyl(g,dx+(dx>0?.11:-.11),.42,dz,.17,.06,material('hub','#c9cdd2',undefined,true));hub.rotation.z=Math.PI/2;
 }
 box(g,0,.44,-2.02,.5,.1,.06,material('plate','#e8e2cc'));
 return g;
}
export function streetNY(p:T.Object3D){
 farGround(p);
 box(p,0,-.28,-6,60,.45,80,material('street-cobble','#ffffff',rep(cobbleHD(),12,16)));
 for(const side of [-1,1]){box(p,side*5.9,.08,-6,2.4,.25,60,material('pavement','#c2b6a1',rep(stoneHD(),2,14)));box(p,side*4.66,.12,-6,.22,.3,60,stone());}
 // 1970s cars with real body, cabin, wheels, bumpers and lights
 carNY(p,-2.5,-10,'#8a3a3a');carNY(p,2.5,-14,'#3a5a8a',Math.PI);carNY(p,-2.5,-18,'#5a6a4a');carNY(p,2.1,-6.5,'#c9b46a',Math.PI);
 // Lower Manhattan around the street: grounded blocks both sides, cross street at the end
 const brickM=material('nyBrick','#a46a52',rep(brick(),3,3));
 const lime=material('nyStone','#c6bba6',rep(stoneHD(),3,3));
 const cornice=material('nyCornice','#8f8574');
 const winM=material('nyWin','#6a8390');
 const rows:[number,number,number][]=[[-18,18,32],[-18,8,24],[-18,-3,29],[-18,-15,21],[-18,-27,27],[-18,-40,31],
                                      [18,17,29],[18,7,23],[18,-4,31],[18,-16,25],[18,-28,28],[18,-41,22]];
 for(let i=0;i<rows.length;i++){const [x,z,h]=rows[i], w=8.5+(i%3), d=9;
  box(p,x,h/2+.2,z,w,h,d,i%2?brickM:lime);
  box(p,x,h+.55,z,w+.7,.9,d+.7,cornice);
  const face=x>0?x-w/2-.08:x+w/2+.08;
  for(let yy=2.4;yy<h-1.2;yy+=3.1)for(let zz=-d*.32;zz<=d*.32;zz+=3.0)box(p,face,yy,z+zz,.12,1.5,1.1,winM);
  for(let yy=2.0;yy<h-3;yy+=4.4)box(p,x>0?x-w/2-.55:x+w/2+.55,yy,z,.95,.14,d*.82,iron());
 }
 box(p,0,9,-54,76,18,14,material('nyEnd','#9d9484',rep(brick(),6,2)));
 box(p,0,18.55,-54,76.6,.9,14.6,cornice);
 for(let i=0;i<8;i++)for(const side of [-1,1]){const z=4-i*6;cyl(p,side*4.8,.55,z,.09,1.1,iron());sphere(p,side*4.8,1.1,z,.12,iron());}
}
export function parkSet(p:T.Object3D){
 box(p,0,-.15,0,30,.3,30,material('grass','#ffffff',rep(ctex('grassHD2',512,512,(g,r)=>{g.fillStyle='#7aa05a';g.fillRect(0,0,512,512);for(let i=0;i<900;i++){g.fillStyle=r()<.5?'#6a9048':'#8ab06a';g.fillRect(r()*512,r()*512,3,8);}}),6,6)));
 for(let i=0;i<5;i++){const x=-10+i*5,z=-6+(i%2)*8;cyl(p,x,1.2,z,.14,2.4,timber());const c=sphere(p,x,3,z,1.1,material('tree','#4a7a3a'));c.scale.y=1.3;}
 // Low wire for final park walk
 bar(p,V(-4,2.2,0),V(4,2.2,0),.04,iron());
 for(const x of [-4,4]){cyl(p,x,1.1,0,.12,2.2,timber());}
}
export function bowProp(p:T.Object3D,x:number,y:number,z:number){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);g.userData.dynamic=true;
 const curve=new T.CatmullRomCurve3([V(0,-1.0,0),V(.34,0,0),V(0,1.0,0)]);
 g.add(new T.Mesh(new T.TubeGeometry(curve,16,.05,7),timber()));
 bar(g,V(0,-1.0,0),V(0,1.0,0),.025,material('string','#e8e0c8'));
 const arrow=cyl(g,0,0,.1,.03,1.5,material('shaft','#d8c9a0'));arrow.rotation.x=Math.PI/2;
 const head=mesh(g,new T.ConeGeometry(.07,.22,6),material('arrowtip','#cfd3d8'),V(0,0,.9));head.rotation.x=Math.PI/2;
 return g;
}
export function poleProp(p:T.Object3D,x:number,y:number,z:number){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);g.userData.dynamic=true;
 cyl(g,0,0,0,.045,4.2,timber());return g;
}
// ---- Petit: props for the 1974 story beats ----
export function streetHat(p:T.Object3D,x:number,z:number){
 cyl(p,x,.045,z,.46,.06,material('hat','#3c3546'));
 cyl(p,x,.13,z,.27,.18,material('hatband','#2c2634'));
 cyl(p,x,.22,z,.26,.02,material('coin','#d8b45a',undefined,true));
}
export function tree(p:T.Object3D,x:number,z:number,h=3,s=1){
 cyl(p,x,h*.4,z,.16*s,h*.8,timber());
 const c=sphere(p,x,h*.95,z,1.1*s,material('tree','#4a7a3a'));c.scale.set(1,1.35,1);
 const c2=sphere(p,x+.6*s,h*.8,z+.3*s,.7*s,material('tree2','#3f6c32'));c2.scale.set(1,1.2,1);
}
export function parkBench(p:T.Object3D,x:number,z:number){
 box(p,x,.5,z,1.9,.12,.6,wood());for(const dx of [-.75,.75])box(p,x+dx,.25,z,.12,.5,.55,timber());
 box(p,x,.85,z-.28,1.9,.5,.1,timber());
}
export function cableCoil(p:T.Object3D,x:number,y:number,z:number,r=.55){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);g.userData.dynamic=true;
 for(let i=0;i<4;i++){const t=mesh(g,new T.TorusGeometry(r-i*.045,.055,7,28),material('cable','#5b5f6e',undefined,true),V(0,i*.09,0));t.rotation.x=Math.PI/2;}
 return g;
}
export function pressCamera(p:T.Object3D,x:number,y:number,z:number){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);g.userData.dynamic=true;
 box(g,0,0,0,.4,.26,.24,material('presscam','#33343c',undefined,true));
 const lens=cyl(g,0,.02,.16,.085,.14,material('lens','#1a1d24',undefined,true));lens.rotation.x=Math.PI/2;
 box(g,0,.17,.02,.16,.08,.1,material('flash','#d8d2bd'));
 bar(g,V(-.1,.02,-.16),V(-.1,.02,-.5),.03,iron());
 return g;
}
export function toolbox(p:T.Object3D,x:number,y:number,z:number){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);g.userData.dynamic=true;
 box(g,0,.16,0,.62,.32,.3,material('toolbox','#b8452f',undefined,true));
 box(g,0,.36,0,.7,.06,.36,iron());
 const h=mesh(g,new T.TorusGeometry(.13,.022,5,14),iron(),V(0,.45,0));h.rotation.x=Math.PI/2;
 bar(g,V(.16,.3,0),V(.16,.62,0),.02,iron());bar(g,V(-.16,.3,0),V(-.16,.62,0),.02,iron());
 return g;
}
export function policeCar(p:T.Object3D,x:number,z:number,rot=0){
 const g=carNY(p,x,z,'#eef1f4',rot);
 box(g,0,.58,0,1.8,.44,3.94,material('cruiserPanel','#eef1f4'));
 box(g,0,.62,.9,1.82,.2,.9,material('cruiserStripe','#2e4a8a'));
 box(g,0,1.32,-.2,.62,.14,.46,material('lightbarBase','#3a3f48'));
 box(g,-.16,1.42,-.2,.26,.1,.36,material('lightRed','#c0392b'));
 box(g,.16,1.42,-.2,.26,.1,.36,material('lightBlue','#2d6fd0'));
 return g;
}
export function barrierTape(p:T.Object3D,x:number,z:number,w=3){
 const g=new T.Group();g.position.set(x,0,z);p.add(g);
 for(const dx of [-w/2,w/2]){cyl(g,dx,1.05,0,.06,2.1,iron());box(g,dx,.05,0,.4,.1,.4,material('barrierfoot','#3a3f48'));}
 for(const y of [.85,1.5]){const t=box(g,0,y,0,w,.14,.03,material('tape','#e0c04a'));t.castShadow=false;}
 return g;
}
export function signBoard(p:T.Object3D,text:string,x:number,y:number,z:number,w=1.6,h=.55){
 const g=new T.Group();g.position.set(x,0,z);p.add(g);
 cyl(g,-w/2,y/2,0,.05,y,timber());cyl(g,w/2,y/2,0,.05,y,timber());
 const s=lettering(g,text,0,y,0,w,h,'#e8dcc0','#3a2f2f');return s;
}
export function magazineProp(p:T.Object3D,x:number,y:number,z:number,w=1.5,h=1.9){
 const tex=ctex('mag-twin',768,1024,g=>{
  g.fillStyle='#efe3c6';g.fillRect(0,0,768,1024);
  g.fillStyle='#8a2f2a';g.fillRect(0,0,768,86);
  g.fillStyle='#f3e8cd';g.font='bold 54px Georgia';g.textAlign='center';g.fillText('THE NEW YORKER',384,60);
  g.fillStyle='#2f4a52';g.fillRect(96,200,180,520);g.fillStyle='#8fb8c8';for(let i=0;i<18;i++){g.fillRect(112,220+i*27,148,12);}
  g.fillStyle='#2f4a52';g.fillRect(492,200,180,520);g.fillStyle='#8fb8c8';for(let i=0;i<18;i++){g.fillRect(508,220+i*27,148,12);}
  g.strokeStyle='#45333b';g.lineWidth=6;g.strokeRect(20,20,728,984);
  g.fillStyle='#2b2b33';g.textAlign='left';g.font='bold 62px Georgia';g.fillText('THE TOWERS',96,820);
  g.fillText('ARE COMING',96,890);
  g.fillStyle='#7a6a55';for(let i=0;i<3;i++)g.fillRect(96,930+i*22,560-(i%2)*90,7);
 });
 const o=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),V(x,y,z));o.layers.set(NOINK);o.rotation.x=-Math.PI/2;
 return o;
}
export function footprint(p:T.Object3D,x:number,z:number,s=7){
 box(p,x,-.06,z,s,.06,s,material('towerfoot','#5a6660',rep(stoneHD(),4,4)));
 box(p,x,.1,z,s+.4,.2,.24,material('footedge','#9aa1a3'));
 // plywood hoarding around the empty lot
 const hw=s+1.8;
 for(let i=0;i<7;i++){const t=i/6-.5;box(p,x+t*hw,1.15,z-s/2-.9,.16,2.3,.16,timber());}
 box(p,x,1.25,z-s/2-.9,hw,1.9,.08,material('hoarding','#6d7a5f'));
 for(const dy of [-.6,.6])box(p,x,1.25+dy,z-s/2-.84,hw,.07,.03,material('hoardline','#cdd6dd'));
 box(p,x,2.3,z-s/2-.9,hw+.1,.12,.16,timber());
}
export function skyline(p:T.Object3D,z=-82){
 const glass=material('skyGlass','#6f93a6',rep(towerGlass(),2,4));
 // a continuous low block wall under the far skyline: no gaps, no floating towers
 box(p,0,2.4,z-6,190,4.8,30,material('skyBase','#8d9a9e'));
 const far=material('skyGlass2','#86a3b4',rep(towerGlass(),2,3));
 const roofM=material('skyRoof','#5d6a72');
 const hs=[18,24,14,28,20,26,16,22,30,17,23,13];
 for(let i=0;i<hs.length;i++){
  const x=-66+i*12, h=hs[i], w=7+(i%3)*1.4, d=6+(i%2)*2;
  box(p,x,h/2,z-(i%2)*8,w,h,d,i%2?glass:far);
  box(p,x,h+.3,z-(i%2)*8,w+.6,.6,d+.6,roofM);
  if(i%4===0){box(p,x-1,h+.9,z-(i%2)*8,2.4,1.2,2.4,roofM);cyl(p,x+2,h+2,z-(i%2)*8,.08,3,iron());}
 }
}
export function smallTowers(p:T.Object3D,x:number,y:number,z:number,s=1){
 const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);
 const glass=material('miniGlass','#8fb8c8');const frame=material('miniFrame','#2f4a52');
 for(const dx of [-1.1,1.1]){box(g,dx,3,0,1.1,6,1.1,glass);for(let i=0;i<5;i++)box(g,dx-1.1+i*.44,3,.56,.06,6,.06,frame);box(g,dx,6.1,0,1.3,.2,1.3,frame);cyl(g,dx,6.9,0,.05,1.4,iron());}
 return g;
}
