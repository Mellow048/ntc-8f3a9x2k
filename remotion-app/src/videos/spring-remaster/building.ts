import * as THREE from 'three';
import {box,mesh,grp,cylinder,rod,lathe,ring,texturedBox,stoneTexture} from './art';
const stone='#c8c4b4',light='#ded8c7',dark='#969d99',gold='#c5a05c',roof='#667471';
function window(p:THREE.Object3D,x:number,y:number,z:number,arched=false){
 box(p,.48,.91,.1,'#607b87',x,y,z);box(p,.58,.065,.15,light,x,y-.49,z+.02);
 for(const d of [-.26,.26])box(p,.045,1.03,.13,light,x+d,y,z+.02);
 box(p,.045,.89,.13,'#a6aea6',x,y,z+.07);box(p,.48,.035,.13,'#a6aea6',x,y+.05,z+.07);
 box(p,.56,.065,.15,light,x,y+.49,z+.02);
 if(arched){const arc=new THREE.Mesh(new THREE.TorusGeometry(.26,.045,5,16,Math.PI),new THREE.MeshLambertMaterial({color:light}));arc.position.set(x,y+.48,z+.035);p.add(arc);}
}
function column(p:THREE.Object3D,x:number,z:number,y=2.2,h=2.5){
 cylinder(p,.18,.15,light,x,y-h/2,z);cylinder(p,.135,h,stone,x,y,z);cylinder(p,.22,.16,light,x,y+h/2,z);
 for(let k=0;k<6;k++){const a=k*Math.PI/3;rod(p,[x+.138*Math.cos(a),y-h/2+.15,z+.138*Math.sin(a)],[x+.138*Math.cos(a),y+h/2-.15,z+.138*Math.sin(a)],.009,dark);}
}
function pediment(p:THREE.Object3D,w:number,y:number,z:number){
 const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,w*.18);s.closePath();
 const geo=new THREE.ExtrudeGeometry(s,{depth:.22,bevelEnabled:false});mesh(p,geo,light,0,y,z);
 rod(p,[-w/2,y,z+.24],[0,y+w*.18,z+.24],.055,stone);rod(p,[0,y+w*.18,z+.24],[w/2,y,z+.24],.055,stone);
}
export function cityHall(parent:THREE.Object3D){
 const g=grp(parent);
 // Wide Beaux-Arts wings: rusticated masonry, three window tiers, corner pavilions.
 texturedBox(g,18,3.65,7.2,stoneTexture(),0,2.0,0,[4,1.5]);
 for(const y of [.32,1.1,2.2,3.72,4.08])box(g,18.3,y===4.08?.19:.11,7.5,y===4.08?light:stone,0,y,0);
 for(const x of [-7.6,7.6]){texturedBox(g,2.6,4.1,7.65,stoneTexture(),x,2.2,0,[1,1.6]);box(g,2.85,.2,7.9,light,x,4.32,0);box(g,2.6,.24,7.55,roof,x,4.55,0);}
 for(let x=-8.1;x<=8.2;x+=.81){if(Math.abs(x)<2.1)continue;for(const y of [1.0,2.15,3.2])window(g,x,y,3.65,y===2.15);}
 // Recessed entrance, monumental portico and broad stairs.
 box(g,4.2,3.55,.13,'#8b9490',0,2.04,3.72);
 for(const x of [-1,0,1]){box(g,.66,1.65,.1,'#627374',x,1.25,3.83);box(g,.54,1.45,.05,'#506970',x,1.25,3.9);}
 for(const x of [-1.8,-.6,.6,1.8])column(g,x,4.2,2.2,2.8);
 box(g,4.55,.22,1.2,light,0,3.72,3.95);pediment(g,4.7,3.85,4.42);
 for(let i=0;i<6;i++)box(g,5.3+i*.18,.12,1.15+i*.16,stone,0,.12+i*.08,4.2-(i*.07));
 for(const x of [-2.8,2.8]){box(g,.28,.75,1.8,stone,x,.39,4.4);}
 // Mansard-like slate roofs with ridge lines, dormers and rooftop balustrades.
 box(g,17.4,.38,6.65,roof,0,4.38,0);
 for(const z of [-3.62,3.62]){box(g,18.35,.08,.17,light,0,4.52,z);for(let x=-8.9;x<=9;x+=.37)cylinder(g,.038,.31,light,x,4.34,z);}
 for(const x of [-5.8,-4.1,4.1,5.8]){box(g,.78,.44,.38,stone,x,4.72,2.1);box(g,.48,.31,.05,'#748893',x,4.73,2.31);}
 // Raised rotunda and a tall, ribbed, dark dome with gilded ornamental bands.
 cylinder(g,2.35,1.32,stone,0,5.02,0);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;column(g,2.29*Math.cos(a),2.29*Math.sin(a),5.1,1.24);}
 for(const y of [4.47,5.65,5.83])cylinder(g,2.52,.12,light,0,y,0);
 cylinder(g,1.96,1.12,stone,0,6.43,0);
 for(let i=0;i<20;i++){const a=i*Math.PI/10;const q=grp(g,0,0,0);q.rotation.y=a;window(q,0,6.43,1.96,true);}
 for(const y of [5.94,6.96])cylinder(g,2.13,.14,light,0,y,0);
 const profile:[number,number][]=[[2.10,0],[2.07,.3],[1.96,.68],[1.77,1.08],[1.48,1.5],[1.12,1.92],[.65,2.27],[.38,2.4]];
 lathe(g,profile,roof,0,7.03,0);
 for(let i=0;i<20;i++){const a=i*Math.PI/10;for(let j=0;j<profile.length-1;j++){const [r,y]=profile[j],[r2,y2]=profile[j+1];rod(g,[r*Math.cos(a),7.03+y,r*Math.sin(a)],[r2*Math.cos(a),7.03+y2,r2*Math.sin(a)],.027,gold);}}
 ring(g,2.105,.035,gold,0,7.14,0);ring(g,1.98,.035,gold,0,7.69,0);
 cylinder(g,.45,.18,gold,0,9.48,0);cylinder(g,.32,.62,'#647573',0,9.87,0);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,[.34*Math.cos(a),9.55,.34*Math.sin(a)],[.34*Math.cos(a),10.18,.34*Math.sin(a)],.028,gold);}
 lathe(g,[[.48,0],[.37,.18],[.12,.36],[.03,.48]],gold,0,10.2,0);cylinder(g,.035,.48,gold,0,10.87,0);
 // Flags and roof ornaments, not an anonymous dome on a rectangular box.
 for(const x of [-5.6,5.6]){rod(g,[x,4.5,1.6],[x,6.25,1.6],.018,'#939d9a');const flag=box(g,.68,.35,.025,x<0?'#ac5c50':'#d9dbd2',x+.32,6.05,1.6);if(x<0){for(let j=0;j<3;j++)box(g,.67,.035,.028,'#e5dfcf',x+.32,5.95+j*.1,1.62);box(g,.25,.2,.03,'#586c87',x+.12,6.12,1.64);}flag.castShadow=false;}
 return g;
}
