// Different places and actions, not alternate angles of the same landmark.
import * as THREE from 'three';
import {box,ball,cylinder,grp,rod,ring,actor,texturedBox,pavementTexture,canvasTexture} from './art';
import {seismicMotion,smooth} from './story';
export function office(g:THREE.Group,archive=false){
 const floor=grp(g),room=grp(g);
 texturedBox(floor,9,.3,6,pavementTexture(),0,-.18,0,[5,4]);
 box(g,11,.35,8,'#8f9c96',0,-.55,0);box(g,12,.4,9,'#b8ad95',0,-.95,0);
 box(room,8,.12,5,'#bcae92',0,.03,0);
 box(room,8,4,.2,archive?'#c0b4a0':'#d2d4c6',0,2,-2.5);box(room,.2,4,5,'#c4caba',-4,2,0);
 for(const x of [-2.3,2.3]){box(room,2.3,2.1,.15,'#f0e6cd',x,2.4,-2.31);box(room,2.1,1.9,.1,'#8fb1be',x,2.4,-2.2);box(room,.055,1.9,.13,'#d6d8c6',x,2.4,-2.1);box(room,2.1,.055,.13,'#d6d8c6',x,2.4,-2.1);for(let i=0;i<6;i++)box(room,.23,.5+(i%3)*.3,.03,'#9baaa9',x-.8+i*.32,1.8,-2.12);}
 // Office desk, chair, books, lamp, framed picture, potted plant and a moving mug.
 const desk=grp(room,.35,0,.35);box(desk,3,.14,1.45,'#a48d6c',0,1.12,0);for(const x of [-1.25,1.25])for(const z of [-.52,.52])box(desk,.11,1.1,.11,'#697b78',x,.54,z);
 for(let i=0;i<5;i++)box(desk,.7,.055,.48,['#9c786b','#b5b3a1','#6c9297'][i%3],-.85,1.23+i*.058,-.25);
 box(desk,.65,.48,.08,'#576970',.35,1.48,-.35);box(desk,.52,.36,.02,'#94b9ba',.35,1.48,-.29);box(desk,.22,.06,.35,'#7c8d87',.35,1.22,-.35);
 const mug=grp(desk,.95,1.2,.32);cylinder(mug,.13,.25,'#e0c487',0,.15,0);cylinder(mug,.11,.012,'#695447',0,.279,0);const handle=ring(mug,.105,.027,'#d8bc7c',.17,.15,0);handle.rotation.x=0;handle.rotation.y=Math.PI/2;
 const paper=box(desk,.58,.009,.43,'#eae3ce',-.1,1.2,.35);paper.rotation.y=.2;
 box(room,.85,.12,.8,'#6b8580',.4,.63,-.85);box(room,.85,.9,.12,'#6b8580',.4,1.13,-1.2);for(const x of [.05,.75])box(room,.055,.58,.055,'#727d77',x,.3,-.85);
 box(room,1.1,1.5,.12,'#9d9278',0,2.8,-2.28);box(room,.9,1.3,.13,'#b4c0a9',0,2.8,-2.2);for(let k=0;k<5;k++)box(room,.11,.3+(k%3)*.17,.02,'#8da49b',-.29+k*.15,2.65,-2.12);
 cylinder(room,.27,.45,'#b69f7a',-3,.24,-1.3);for(let i=0;i<7;i++){const a=i*2.4;const ex=-3+.4*Math.cos(a),ey=1.2+(i%2)*.2,ez=-1.3+.3*Math.sin(a);rod(room,[-3,.4,-1.3],[ex,ey,ez],.035,'#77906d');const leaf=ball(room,.15,'#7e986f',ex,ey,ez);leaf.scale.set(1.5,.5,.65);}
 const pendant=grp(room,1.5,3.85,-.9);rod(pendant,[0,0,0],[0,-.8,0],.018,'#6c7975');const shade=ball(pendant,.3,'#d9c9a1',0,-.9,0);shade.scale.set(1,.5,1);
 const hero=actor(room,0,0,1.7,'hero',.82,archive?'shock':'nervous');
 const cracks=grp(room);rod(cracks,[-.75,3.7,-2.37],[-.5,3.05,-2.37],.02,'#72675c');rod(cracks,[-.5,3.05,-2.37],[-.75,2.7,-2.37],.02,'#72675c');
 return (f:number)=>{const m=seismicMotion(f);floor.position.x=m.ground;room.position.x=archive?m.ground:m.building;hero.animate(f);
  const response=archive?m.ground:m.building;pendant.rotation.z=response*.5;mug.position.x=.95+response*.7;paper.position.x=-.1+response*.35;
  cracks.visible=archive&&f>=837;
 };
}
function tower(p:THREE.Object3D,color:string){
 for(const x of [-.49,.49])for(const z of [-.45,.45])box(p,.08,2.1,.08,'#8e9e96',x,1.45,z);
 for(let k=0;k<5;k++){box(p,1.2,.09,1.12,color,0,.47+k*.45,0);for(const z of [-.49,.49])for(const x of [-.34,0,.34])box(p,.22,.27,.035,'#91b8c0',x,.66+k*.45,z);}
 box(p,1.22,.12,1.16,'#b6bdb0',0,2.52,0);
}
export function lab(g:THREE.Group){
 box(g,18,.25,16,'#bac0b3',0,-.65,0);box(g,16,6,.2,'#c7d0c4',0,2.4,-4);
 for(let x=-7;x<=7;x+=1.4)box(g,.025,5,.03,'#adb9ac',x,2.2,-3.85);
 const machine=grp(g);box(machine,7,.5,3.1,'#718a87',0,-.25,0);box(machine,7.3,.12,3.3,'#9ca99e',0,.06,0);
 for(const x of [-3.4,3.4]){cylinder(g,.2,.65,'#b5bdb1',x,-.25,0);rod(g,[x-.25,-.1,-1.7],[x+.25,-.1,1.7],.04,'#7e8e88');}
 const ground=grp(g);box(ground,6.7,.15,2.75,'#b1b9ab',0,.24,0);
 const fixed=grp(g,-1.8,0,0),isolated=grp(g,1.8,0,0);tower(fixed,'#b88d7c');tower(isolated,'#82a69c');
 for(const t of [fixed,isolated])for(const o of t.children)o.position.y+=.13;
 for(const x of [-.38,.38])for(const z of [-.36,.36])cylinder(fixed,.12,.23,'#a4b1a3',x,.43,z);
 const stacks:THREE.Group[]=[];
 for(const x of [1.42,2.18])for(const z of [-.36,.36]){const stack=grp(g,x,0,z);for(let k=0;k<4;k++)cylinder(stack,.15,.045,k%2?'#adb9ae':'#455853',0,.35+k*.046,0);stacks.push(stack);}
 const gauge=grp(g,-3.7,0,-1.2);box(gauge,1.4,1,.3,'#617675',0,1.65,0);box(gauge,1.15,.73,.04,'#a7c5b8',0,1.66,.18);rod(gauge,[-.45,1.63,.23],[-.1,1.9,.23],.018,'#587c72');rod(gauge,[-.1,1.9,.23],[.23,1.38,.23],.018,'#587c72');rod(gauge,[.23,1.38,.23],[.5,1.7,.23],.018,'#587c72');box(gauge,.16,.7,.16,'#7e9187',0,.8,0);
 const guide=actor(g,3.9,-.1,.35,'engineer',.8,'grin');
 return (f:number)=>{const m=seismicMotion(f);ground.position.x=m.ground;fixed.position.x=-1.8+m.ground;fixed.rotation.z=m.ground*.07;isolated.position.x=1.8+m.building;stacks.forEach(s=>s.children.forEach((layer,i)=>layer.position.x=m.ground+(m.building-m.ground)*i/3));guide.animate(f);};
}
export function workshop(g:THREE.Group){
 box(g,18,.2,15,'#b1b5a5',0,-.4,0);box(g,15,6,.2,'#cbd2c6',0,2.5,-4);
 const board=box(g,4,2.2,.1,'#6f9298',0,2.6,-3.8);
 const drawing=canvasTexture('isolation-blueprint',c=>{c.fillStyle='#66888e';c.fillRect(0,0,512,512);c.strokeStyle='#d4dfca';c.lineWidth=3;for(let y=110;y<330;y+=40)c.strokeRect(70,y,370,30);c.strokeRect(100,330,100,80);c.strokeRect(310,330,100,80);c.beginPath();c.moveTo(35,440);c.lineTo(480,440);c.stroke();});
 const card=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2),new THREE.MeshBasicMaterial({map:drawing}));card.position.set(0,2.6,-3.73);g.add(card);board.castShadow=false;
 box(g,4.5,.18,2.7,'#a69678',0,1.05,0);for(const x of [-1.9,1.9])for(const z of [-1,1])box(g,.15,1.1,.15,'#70857d',x,.43,z);
 const pieces:THREE.Mesh[]=[];
 for(let i=0;i<7;i++)pieces.push(cylinder(g,.52,.065,i%2?'#aeb9ad':'#40534f',0,1.24+i*.10,0));
 box(g,1.5,.13,1.5,'#8d9e92',0,1.17,0);const cap=box(g,1.5,.13,1.5,'#b6bfaf',0,1.98,0);
 for(const x of [-1.7,1.55]){cylinder(g,.13,.07,'#84988e',x,1.19,.3);rod(g,[x-.18,1.22,.3],[x+.18,1.22,.3],.035,'#c8c9b0');}
 const engineer=actor(g,-2.3,-.05,.9,'engineer',.95,'grin');
 return (f:number)=>{engineer.animate(f);const spread=f>=1080&&f<1146?.075*Math.sin(Math.PI*smooth(f,1080,1146)):0;pieces.forEach((p,i)=>p.position.y=1.24+i*(.1+spread));cap.position.y=1.98+spread*7;};
}
