import * as T from 'three';
import {Pen,bodyFront,townsfolk,Outfit,Expr} from './bridge/toon';
import {NOINK} from './bridge/ink';
import {twoTone,TONE} from './bridge/shade';
import {LIGHTS} from './bridge/lights';
import {Shot,Slug,smooth} from './story';

// Original sets and choreography, built with the vendored bridge materials/cast pipeline.
// No downloaded assets; all geometry, painted textures, sound and characters are reproducible.
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const texCache=new Map<string,T.CanvasTexture>();
function paint(color:string,kind='brick'){
 const key=color+kind;if(texCache.has(key))return texCache.get(key)!;
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d')!;g.fillStyle=color;g.fillRect(0,0,256,256);
 g.lineWidth=kind==='wood'?3:2;g.strokeStyle=kind==='wood'?'#47342855':'#443c3d55';
 for(let y=0;y<256;y+=kind==='wood'?256:32){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();for(let x=kind==='wood'?0:-(y%64?32:0);x<256;x+=kind==='wood'?32:64){g.beginPath();g.moveTo(x,y);g.lineTo(x+(kind==='wood'?2:0),kind==='wood'?256:y+32);g.stroke();}}
 for(let i=0;i<900;i++){g.fillStyle=i%2?'#ffffff08':'#00000008';g.fillRect((i*73)%256,(i*139)%256,2+(i%9),1);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;texCache.set(key,tex);return tex;
}
function mat(color:string,kind?:string){return twoTone(new T.MeshLambertMaterial({color:kind?'#ffffff':color,map:kind?paint(color,kind):null}));}
const geometry = {box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,10)};
function box(p:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:string,kind?:string){const m=new T.Mesh(geometry.box,mat(color,kind));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function cyl(p:T.Group,x:number,y:number,z:number,r:number,h:number,color:string,rt=r){const m=new T.Mesh(new T.CylinderGeometry(rt,r,h,32),mat(color,'wood'));m.position.set(x,y,z);p.add(m);return m;}
function beam(p:T.Group,a:T.Vector3,b:T.Vector3,r:number,col:string){const m=box(p,0,0,0,r,a.distanceTo(b),r,col);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return m;}
function ell(p:T.Group,x:number,y:number,z:number,sx:number,sy:number,sz:number,col:string){const m=new T.Mesh(geometry.sphere,mat(col));m.position.set(x,y,z);m.scale.set(sx,sy,sz);p.add(m);return m;}
function water(p:T.Group,y=0,col='#3f9fae',size=38){const m=box(p,0,y-.15,0,size,.25,size,col);return m;}
function house(p:T.Group,x:number,z:number,col:string,japan=false){
 const h=3.3+(Math.abs(x*3+z)%3)*.25;const g=new T.Group();g.position.set(x,0,z);p.add(g);
 box(g,0,h/2,0,3,h,2.8,col,'brick');box(g,0,.15,1.45,3.25,.3,.35,'#aaa393');
 const roof=new T.Mesh(new T.ConeGeometry(2.55,1.45,4),mat(japan?'#4a555c':'#895044','wood'));roof.rotation.y=Math.PI/4;roof.position.y=h+.6;g.add(roof);
 box(g,.72,.95,1.43,.7,1.9,.12,'#533b38','wood');
 for(const xx of [-.85,.75])for(const yy of [h-.6,h-1.6]){box(g,xx,yy,1.43,.55,.65,.08,'#384857');box(g,xx,yy,1.5,.64,.06,.08,'#e9d4ac');box(g,xx,yy,1.5,.045,.69,.08,'#e9d4ac');}
 if(!japan)box(g,-.8,h+1,0,.4,1.3,.5,'#9c6653','brick');
 return g;
}
function town(p:T.Group,japan=false){for(let i=0;i<5;i++){house(p,-5.5,-i*4.2-3,['#c7b290','#b98370','#d8c7a8'][i%3],japan);house(p,5.5,-i*4.2-3,['#c8b899','#aa7967','#d7c7a8'][i%3],japan);}}
function tree(p:T.Group,x:number,z:number){box(p,x,1.4,z,.35,2.8,.4,'#796049','wood');for(let i=0;i<3;i++)ell(p,x+(i-1)*.45,3+i%2*.5,z,1.15,1.4,1.05,['#778a50','#839759','#63794b'][i]);}
function shadow(p:T.Group,x:number,z:number,r=1){const m=new T.Mesh(new T.CircleGeometry(r,32),new T.MeshBasicMaterial({color:'#38303c',transparent:true,opacity:.19,depthWrite:false}));m.rotation.x=-Math.PI/2;m.scale.y=.5;m.position.set(x,.025,z);m.layers.set(NOINK);p.add(m);}
class Actor {
 group=new T.Group(); canvas=document.createElement('canvas');ctx:CanvasRenderingContext2D;tex:T.CanvasTexture; card:T.Mesh; outfit:Outfit; expr:Expr='neutral'; walking=false; old=false;
 constructor(p:T.Group,x:number,z:number,outfit:Outfit){this.canvas.width=300;this.canvas.height=500;this.ctx=this.canvas.getContext('2d')!;this.ctx.scale(.5,.5);this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.outfit=outfit;this.card=new T.Mesh(new T.PlaneGeometry(1.8,3),new T.MeshLambertMaterial({map:this.tex,transparent:true,alphaTest:.05,side:T.DoubleSide}));this.card.position.y=1.46;this.card.layers.set(NOINK);this.group.add(this.card);this.group.position.set(x,0,z);p.add(this.group);shadow(p,x,z,.7);}
 update(f:number,cam:T.Camera){this.ctx.clearRect(0,0,600,1000);bodyFront(new Pen(this.ctx),this.outfit,{mode:this.walking?'stroll':'stand',phase:f/24,expr:this.expr,blink:f%79<4,seed:4,headTilt:Math.sin(f*.018)*.025});this.tex.needsUpdate=true;this.card.quaternion.copy(cam.quaternion);}
}
function vat(p:T.Group){const g=new T.Group();p.add(g);cyl(g,0,3,0,2.4,6,'#b6814a');for(let i=0;i<5;i++){const m=new T.Mesh(new T.TorusGeometry(2.43,.10,8,64),mat('#42434a'));m.rotation.x=Math.PI/2;m.position.y=.55+i*1.2;g.add(m);}cyl(g,0,6.02,0,2.41,.08,'#5a3e2c');return g;}
function barge(p:T.Group,x:number,z:number){const g=new T.Group();g.position.set(x,.25,z);p.add(g);box(g,0,0,0,1.65,.7,3.3,'#5a6665');box(g,0,.4,0,1.35,.12,2.9,'#9e7552','wood');for(const xx of [-.75,.75])box(g,xx,.55,0,.08,.4,3,'#424d53');return g;}
function rig(p:T.Group){const g=new T.Group();p.add(g);box(g,0,.4,0,4,.55,4,'#7b6250','wood');box(g,1.3,1.2,.8,1.1,1.3,1.3,'#ddd0a3');for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;beam(g,V(Math.cos(a)*1.4,.7,Math.sin(a)*1.4),V(Math.cos(a)*.3,7,Math.sin(a)*.3),.14,'#776457');}
 for(let y=1;y<7;y+=1){const r=1.5-y*.16;for(const z of [-1,1]){beam(g,V(-r,y,z*r),V(r-.16,y+1,z*(r-.16)),.07,'#9e7a56');beam(g,V(-r,y,z*r),V(r,y,z*r),.08,'#776457');}}
 const drill=cyl(g,0,-1,0,.09,9,'#48494b');return {g,drill};}
function tunnel(p:T.Group,flood=false){box(p,0,-3.6,0,15,.7,5,'#c9b9a3','brick');box(p,0,-.4,-2.5,15,6,1,'#b8a48d','brick');for(let x=-6;x<8;x+=3){if(x===0||x===3)continue;box(p,x,-1.5,-1,.6,4,1,'#c9bda9','brick');}if(flood)box(p,0,-3.1,0,14,.25,4,'#4b9fae');}
function lantern(p:T.Group,x:number,y:number,z:number){const m=box(p,x,y,z,.38,.6,.38,'#f4c77d');box(p,x,y+.33,z,.46,.08,.46,'#65515a');return m;}
export class World {
 root=new T.Group();actors:Actor[]=[];animate:Array<(f:number,t:number,u:number)=>void>=[];shot:Shot;slug:Slug;
 constructor(slug:Slug,shot:Shot){this.slug=slug;this.shot=shot;const p=this.root;const s=shot.scene;
 const gold=shot.golden;const l=LIGHTS[gold?'golden':'day'];TONE.uLitCol.value.set(...l.lit);TONE.uShadeCol.value.set(...l.shade);TONE.uShadeLift.value.set(...l.lift);
 p.add(new T.HemisphereLight('#d7e4f5','#9b8265',2.2));const sun=new T.DirectionalLight('#ffe5c6',2.6);sun.position.set(8,15,9);p.add(sun);
 const person=(x:number,z:number,expr:Expr='neutral',extra:Partial<Outfit>={})=>{const a=new Actor(p,x,z,{...townsfolk(0),hat:'hair',hair:'#322a30',jacket:'#527a83',...extra});a.expr=expr;this.actors.push(a);return a;};
 const ground=(col='#ad9a83')=>box(p,0,-.2,0,70,.35,70,col,'brick');
 if(slug==='beer'){
  ground();
  if(['vat','hoop','burst'].includes(s)){
   box(p,0,4,-5,17,8,.5,'#b38c72','brick');box(p,0,.1,0,17,.2,16,'#b89766','wood');for(const x of [-6,6])box(p,x,4,-1,.35,8,.4,'#68513c','wood');
   const v=vat(p);vat(p).position.set(-6,0,-3);vat(p).position.set(6,0,-3);person(3.5,2,'nervous',{hat:'tophat',jacket:'#7d6657'});
   if(s==='hoop'){const hoop=v.children[3];this.animate.push((f,t,u)=>{hoop.rotation.z=-smooth((u-.25)*2)*.28;hoop.position.y=2.95-smooth((u-.25)*2)*1.6;});}
   if(s==='burst'){
    const liquid=ell(p,0,1,0,.1,.1,.1,'#704428');const planks:Array<T.Mesh>=[];for(let i=0;i<14;i++)planks.push(box(p,0,3,0,.5,5,.15,'#a67b4a','wood'));
    this.animate.push((f,t,u)=>{const q=smooth(u*2);v.scale.x=1-q*.9;v.scale.z=1-q*.9;liquid.scale.set(2+q*7,.6+q,2+q*7);planks.forEach((m,i)=>{const a=i*2.4;m.position.set(Math.sin(a)*q*5,2+Math.sin(q*3+i)*q*2,Math.cos(a)*q*5);m.rotation.set(q*i*.3,0,q*Math.sin(i)*1.4);});});
   }
  }else if(s==='wall'){
   town(p);const bricks:T.Mesh[]=[];for(let row=0;row<6;row++)for(let col=0;col<8;col++)bricks.push(box(p,(col-3.5)*.85,row*.6+.3,-2,.8,.55,.5,'#a77a66','brick'));
   const wave=ell(p,0,.4,-3,3,.6,2,'#795235');this.animate.push((f,t,u)=>{wave.position.z=-2+u*10;wave.scale.set(3+u*5,.6+u,2+u*3);bricks.forEach((b,i)=>{const q=smooth((u-.12)*1.5);b.position.z=-2+q*(2+(i%5));b.position.y=Math.max(.3,(Math.floor(i/8)*.6+.3)*(1-q)+Math.sin(q*3.14)*2);b.rotation.x=q*(i%4);});});
  }else if(['flood','aftermath','cellar','rescue'].includes(s)){
   if(s==='cellar'){
    box(p,0,-1.6,-2,7,4,.4,'#9c8c7a','brick');box(p,-3.5,-1,0,.3,4,5,'#bba68c','brick');box(p,0,-3,0,7,.3,5,'#8d7e70');box(p,0,.5,-3.2,8,.25,1,'#b9a78b','wood');for(let i=0;i<5;i++)box(p,2,0-i*.6,2-i*.5,1.5,.5,.6,'#aa9c8b');const w=box(p,0,-2.9,0,6.5,.3,4.8,'#78583b');this.animate.push((f,t,u)=>{w.position.y=-2.8+u*2;});
   }else{
    town(p);const w=water(p,.12,'#79583b');w.scale.x=8.5;w.scale.z=38;this.animate.push((f,t)=>{w.position.y=-.03+Math.sin(t*1.8)*.04;});
    for(let i=0;i<20;i++){const foam=ell(p,(i%4-1.5)*1.7,.4,Math.floor(i/4)*4-9,.65,.08,.25,i%2?'#c9a86e':'#9e774a');this.animate.push((f,t)=>{foam.position.z=((i*3+t*2)%23)-12;foam.position.y=.4+Math.sin(t*3+i)*.06;});}
    if(s==='flood'){const surge=ell(p,0,.18,-10,4,.35,1.6,'#987043');this.animate.push((f,t,u)=>{surge.position.z=-11+u*16;surge.scale.y=.3+Math.sin(u*Math.PI)*.28;});person(-2.4,-1,'shock',{hat:'bonnet',dress:'#a76c6b'});person(2.3,-6,'nervous',{hat:'tophat'});}
    else{
     for(let i=0;i<12;i++){const b=box(p,Math.sin(i*9)*3,.4,-6+i*.8,.8,.22,.35,'#89705a','wood');b.rotation.y=i;}
     const a=person(-1,1,'stern',{jacket:'#8c6b53',hat:'tophat'});const b=person(1.3,-.7,'nervous',{jacket:'#687a6a'});if(s==='rescue'){a.walking=true;this.animate.push((f,t,u)=>a.group.position.x=-1+u*.8);lantern(p,1.1,1.1,0);}
    }
   }
  }else if(s==='memorial'){
   ground('#817e7d');box(p,0,.2,0,8,.3,4,'#b3a493');for(let i=0;i<8;i++){cyl(p,(i%4-1.5)*.75,.65,Math.floor(i/4)*.8-.4,.10,.8,'#e5d3ad');const flame=ell(p,(i%4-1.5)*.75,1.18,Math.floor(i/4)*.8-.4,.08,.20,.08,'#ffd28c');this.animate.push((f,t)=>flame.scale.y=.18+Math.sin(t*6+i)*.025);}
   house(p,-6,-6,'#a2978f');house(p,6,-6,'#aa9d8e');
  }else if(s==='tax'){
   house(p,0,-4,'#b58e73');box(p,0,1,1,5,.2,2.3,'#9a7449','wood');person(-1,-.3,'neutral',{hat:'tophat',jacket:'#5c5e61'});person(1.1,-.3,'neutral',{hat:'tophat',jacket:'#705b55'});
   const paper=box(p,0,1.16,1.3,1.3,.025,.9,'#eee0be');const coins:T.Mesh[]=[];for(let i=0;i<9;i++)coins.push(cyl(p,.8,1.2+i*.09,.6,.22,.08,'#d8b569'));this.animate.push((f,t,u)=>{coins.forEach((c,i)=>c.position.y=1.2+i*.09+Math.max(0,1-u*3+i*.06)*2);paper.rotation.y=Math.sin(t*.3)*.02;});
  }
 }else if(slug==='survivor'){
  ground('#b5aa93');
  const hero=(x=0,z=0,old=false)=>{const a=person(x,z,'stern',{skin:'#f0d0af',jacket:old?'#6a7071':'#82785f',pants:'#4d5252',hair:old?'#c7c7bb':'#24272b',hat:'hair'});a.old=old;return a;};
  if(['japan','home','blast','survivor'].includes(s)){
   town(p,true);tree(p,-8,-1);const a=hero();if(s==='japan'){a.walking=true;box(p,.85,.9,0,.6,.8,.25,'#66533d','wood');this.animate.push((f,t,u)=>a.group.position.z=1-u*2);}
   if(s==='home'){house(p,0,-5,'#cdbd9c',true);person(1.4,-2,'neutral',{hat:'hair',hair:'#29262b',dress:'#7c748b'});}
   if(s==='survivor'||s==='blast'){const rubble:T.Mesh[]=[];for(let i=0;i<15;i++){rubble.push(box(p,Math.sin(i*7)*4,.2,-1-Math.abs(Math.cos(i*5))*7,.6,.4,.8,'#8e877b'));}a.expr='dazed';if(s==='blast'){const shock=new T.Mesh(new T.TorusGeometry(1,.12,8,64),mat('#dfc5a0'));shock.rotation.x=Math.PI/2;shock.position.set(0,.2,-8);p.add(shock);this.animate.push((f,t)=>{const q=Math.max(0,t-9.90);shock.visible=q>0;shock.scale.setScalar(1+q*7);a.group.rotation.z=-Math.sin(Math.min(q*7,Math.PI))*.12;});}}
  }else if(s==='shelter'){
   box(p,0,2,-2,8,4,.6,'#9e968a','brick');box(p,-4,2,0,.4,4,5,'#8f8c82','brick');beam(p,V(-3,.2,-1),V(3,3.8,-1),.25,'#756a5b');const a=hero();a.expr='dazed';lantern(p,2,.65,0);
  }else if(s==='train'){
   for(const x of [-.8,.8])box(p,x,.06,0,.09,.12,48,'#53535a');for(let i=0;i<30;i++)box(p,0,.01,i*1.5-23,2.4,.08,.23,'#786853','wood');
   const train=new T.Group();p.add(train);for(let j=0;j<3;j++){box(train,0,1.8,-j*4.5,2.3,2.4,4,'#61756c');box(train,0,3.1,-j*4.5,2.5,.3,4.2,'#404b50');for(const side of [-1,1]){for(let i=0;i<3;i++)box(train,side*1.17,2.25,-j*4.5-1.3+i*1.2,.05,.75,.75,'#c2c6b2');for(const z of [-1.3,1.3]){const wheel=cyl(train,side*1.05,.5,-j*4.5+z,.4,.18,'#42434b');wheel.rotation.z=Math.PI/2;}}}
   for(let i=0;i<8;i++)tree(p,(i%2?1:-1)*6,-i*6+12);this.animate.push((f,t,u)=>{train.position.z=5-u*10;});
  }else if(s==='office'){
   box(p,0,2.5,-3,10,5,.4,'#c7b99c');box(p,0,2.6,-2.7,4,2.6,.1,'#b9d3dc');for(const x of [-2,0,2])box(p,x,2.6,-2.6,.1,2.8,.1,'#625c51');box(p,0,2.6,-2.6,4.2,.1,.1,'#625c51');hero(-1,0);person(1,0,'stern',{hat:'hair',hair:'#24272b',jacket:'#626e68'});box(p,0,1,1.5,4,.15,1.4,'#9d7c55','wood');
  }else if(s==='people'){
   town(p,true);for(let i=0;i<5;i++)hero((i-2)*1.2,-Math.abs(i-2)*.5);this.actors[2].expr='stern';
  }else if(s==='recognition'){
   box(p,0,2,-3,10,4,.3,'#b8b1a6');hero(-.8,0,true);person(1,0,'neutral',{hat:'hair',hair:'#5e6263',jacket:'#566b78'});box(p,.2,1.2,.5,.9,.02,.65,'#eee3c9');
  }else if(s==='peace'){
   hero(0,0,true);box(p,0,.65,1.2,1.3,1.3,.7,'#947655','wood');beam(p,V(.3,1.3,1.2),V(.3,2.15,1.1),.04,'#3c414b');ell(p,.3,2.15,1.1,.08,.08,.13,'#3c414b');for(let i=0;i<4;i++)tree(p,(i-1.5)*4,-6);
  }else if(s==='lanterns'){
   water(p,-.12,'#617e8c');town(p,true);for(let i=0;i<14;i++){const x=(i%5-2)*1.3,z=Math.floor(i/5)*3-2;const m=lantern(p,x,.5,z);this.animate.push((f,t)=>{m.position.y=.5+Math.sin(t*1.3+i)*.04;m.position.z=z-t*.12;});}
  }
 }else{
  const lakeScenes=['vortex','rig','sinking','return','canal'];
  if(lakeScenes.includes(s)){
   const bank=new T.Mesh(new T.RingGeometry(17,55,72),mat('#88986d'));bank.rotation.x=-Math.PI/2;bank.position.y=-.12;p.add(bank);
   // Annular water surface leaves an actual opening into the funnel.
   const ring=new T.Mesh(new T.RingGeometry(s==='rig'||s==='return'?0:3.6,17,72),mat('#599eaa'));ring.rotation.x=-Math.PI/2;ring.position.y=-.05;p.add(ring);
   for(let i=0;i<12;i++)tree(p,Math.cos(i*.52)*18,Math.sin(i*.52)*18);
   if(s==='rig'){const r=rig(p);person(2,1,'neutral',{hat:'cap',cap:'#dfc56a',jacket:'#bb7b4d'});this.animate.push((f,t)=>r.drill.rotation.y=t*5);}
   else if(s==='canal'){
    box(p,0,.05,0,5,.2,45,'#65a4af');for(const x of [-4,4])box(p,x,.3,0,3,.6,45,'#93a578');for(let i=0;i<22;i++){const m=box(p,Math.sin(i)*1.6,.2,(i*2)%36-18,.4,.02,1.7,'#b7d8d4');this.animate.push((f,t)=>{m.position.z=((i*2+t*4)%36)-18;});}
   }else if(s==='return'){
    for(let i=0;i<9;i++){const b=barge(p,(i%3-1)*3,(Math.floor(i/3)-1)*4);this.animate.push((f,t,u)=>{b.position.y=-1.5+smooth(Math.min(1,u*3+.3-i*.03))*1.9;b.rotation.z=Math.sin(t*1.5+i)*.025;});}
   }else{
    const funnelGeo=new T.ConeGeometry(3.6,5,64,8,true);const fun=new T.Mesh(funnelGeo,new T.MeshLambertMaterial({color:'#357b8c',side:T.DoubleSide}));fun.rotation.x=Math.PI;fun.position.y=-2.5;p.add(fun);
    const rings:T.Mesh[]=[];for(let i=0;i<16;i++){const rr=.3+i*.3;const m=new T.Mesh(new T.TorusGeometry(rr,.035,5,72,Math.PI*1.65),mat(i%2?'#a5d1ca':'#467f91'));m.rotation.x=Math.PI/2;m.position.y=rr<3.6?-5+rr/3.6*5:.03;p.add(m);rings.push(m);}
    this.animate.push((f,t)=>rings.forEach((r,i)=>r.rotation.z=t*1.3+i*.7));
    const count=s==='sinking'?11:4;for(let i=0;i<count;i++){const b=barge(p,0,0);this.animate.push((f,t,u)=>{const radius=Math.max(.2,8-i*.32-u*(s==='sinking'?7:2));const a=i*2.4+t*.5;b.position.set(Math.cos(a)*radius,Math.min(.3,(radius-3)*.7),Math.sin(a)*radius);b.rotation.y=-a;b.rotation.z=(radius<3?1-radius/3:.03)*.9;});}
    const r=rig(p);r.g.scale.setScalar(.65);this.animate.push((f,t,u)=>{r.g.position.set(3-u*3,-u*(s==='sinking'?6:1),-1);r.g.rotation.z=u*.55;});
   }
  }else if(['mine','breach','lostmine'].includes(s)){
   tunnel(p,s!=='mine');box(p,0,.6,-1.7,17,1.1,3,'#a29474','brick');box(p,0,1.3,-1.7,17,.25,3,'#5b9eab');const r=rig(p);r.g.position.set(0,1.5,-1);r.g.scale.setScalar(.48);
   if(s==='mine'){person(-3,0,'neutral',{hat:'cap',cap:'#e1bf59',jacket:'#9b7956'}).group.position.y=-3.3;}
   if(s==='breach'){const stream=box(p,0,-.4,-1, .18,4,.2,'#62adbd');const fill=box(p,0,-3.1,0,14,.05,4,'#5495a5');this.animate.push((f,t,u)=>{stream.scale.x=.18+u*.5;fill.scale.y=.05+u*2.4;r.drill.rotation.y=t*5;});}
   if(s==='lostmine'){box(p,0,-1.8,0,14,2.6,3.9,'#547d88');}
  }else if(s==='bathtub'){
   box(p,0,-.3,0,16,.5,14,'#c6beb2','brick');box(p,0,.65,0,4,1.3,6,'#e5ded0');box(p,0,1.35,0,3.8,.2,5.8,'#6eafb8');for(const x of [-2.1,2.1])box(p,x,1.2,0,.3,.8,6.3,'#f1e5d1');for(const z of [-3.1,3.1])box(p,0,1.2,z,4.5,.8,.3,'#f1e5d1');const plug=cyl(p,0,1.5,1.8,.23,.1,'#3d454d');this.animate.push((f,t,u)=>{plug.position.y=1.5+smooth(u)*1.5;plug.position.x=smooth(u)*.8;});
  }else if(s==='miners'){
   box(p,0,-.2,0,30,.4,30,'#a99b78');box(p,0,2,-4,6,4,2,'#8e8e7b','brick');box(p,0,1.3,-2.9,2,2.6,.1,'#454b4c');for(let i=0;i<4;i++){const a=person((i-1.5)*1.25,0,'relief',{hat:'cap',cap:'#dfc168',jacket:['#a47a51','#638691'][i%2]});a.walking=true;this.animate.push((f,t,u)=>a.group.position.z=-1+u*2+i*.15);}
  }
 }
 }
 update(f:number,camera:T.Camera){const u=(f-this.shot.a)/Math.max(1,this.shot.b-this.shot.a);for(const fn of this.animate)fn(f,f/30,u);for(const actor of this.actors)actor.update(f,camera);}
 dispose(){const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();this.root.traverse(o=>{if(o instanceof T.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m); }}});for(const g of geos)if(g!==geometry.box&&g!==geometry.sphere)g.dispose();for(const m of mats)m.dispose();for(const a of this.actors)a.tex.dispose();}
}
