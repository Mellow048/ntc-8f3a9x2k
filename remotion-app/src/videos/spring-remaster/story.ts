// Timed to the approved Arena narration in shoots/spring-building/voice/words.json.
export type V=[number,number,number];
export type Kind='hall'|'dome'|'guide'|'history'|'cutaway'|'bearing'|'layers'|'jelly'|'moat'|'office'|'archive'|'lab'|'workshop';
export const TOTAL=1865;
export const SHOTS:{start:number;kind:Kind;cam:V;target:V;fov:number}[]=[
 {start:0,kind:'lab',cam:[6.5,5,9.5],target:[0,1.65,0],fov:43},
 {start:58,kind:'lab',cam:[6.5,5,9.5],target:[0,1.65,0],fov:43},
 {start:126,kind:'lab',cam:[4.8,3.1,7.4],target:[1.8,1.6,0],fov:42},
 {start:180,kind:'office',cam:[3.1,2.7,5.9],target:[.5,1.4,.5],fov:41},
 {start:210,kind:'workshop',cam:[4.2,3.6,6.9],target:[0,1.5,0],fov:42},
 {start:262,kind:'hall',cam:[17,11,29],target:[0,4.8,0],fov:44},
 {start:350,kind:'jelly',cam:[5.2,4.7,7.5],target:[0,1.7,0],fov:42},
 {start:448,kind:'jelly',cam:[3.4,3.5,5.7],target:[0,1.6,0],fov:42},
 {start:505,kind:'jelly',cam:[-2.5,3.1,4.9],target:[0,1.8,0],fov:42},
 {start:572,kind:'jelly',cam:[3.4,3.5,5.7],target:[0,1.6,0],fov:42},
 {start:623,kind:'jelly',cam:[-3,3.3,5.4],target:[0,1.65,0],fov:42},
 {start:731,kind:'lab',cam:[6.5,5,9.5],target:[0,1.65,0],fov:43},
 {start:768,kind:'archive',cam:[5,3.5,8.2],target:[0,1.6,0],fov:43},
 {start:831,kind:'archive',cam:[2.9,2.8,6.1],target:[.2,1.4,.3],fov:42},
 {start:877,kind:'workshop',cam:[-3.8,3.7,6.6],target:[0,1.6,0],fov:42},
 {start:963,kind:'cutaway',cam:[13,7.8,22],target:[0,3.8,0],fov:45},
 {start:1015,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:1080,kind:'workshop',cam:[2.7,3.2,4.4],target:[0,1.6,0],fov:41},
 {start:1146,kind:'lab',cam:[4.2,3.5,7],target:[1.8,2,0],fov:42},
 {start:1190,kind:'lab',cam:[3.8,2,6.6],target:[1.8,1.05,0],fov:42},
 {start:1245,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:1310,kind:'office',cam:[5,3.5,8.2],target:[0,1.6,0],fov:43},
 {start:1372,kind:'lab',cam:[6.5,5,9.5],target:[0,1.65,0],fov:43},
 {start:1430,kind:'office',cam:[3.1,2.7,5.9],target:[.5,1.4,.5],fov:41},
 {start:1515,kind:'moat',cam:[10,8,13],target:[6.8,.4,2],fov:42},
 {start:1570,kind:'moat',cam:[8.5,4,10],target:[7,.5,2.4],fov:42},
 {start:1635,kind:'moat',cam:[10,7,9],target:[6.8,.3,3.3],fov:42},
 {start:1694,kind:'lab',cam:[6.5,5,9.5],target:[0,1.65,0],fov:43},
 {start:1780,kind:'office',cam:[3.1,2.7,5.9],target:[.5,1.4,.5],fov:41},
 {start:1825,kind:'lab',cam:[4.8,3.1,7.4],target:[1.8,1.6,0],fov:42},
];
export const smooth=(f:number,a:number,b:number)=>{const u=Math.max(0,Math.min(1,(f-a)/(b-a)));return u*u*(3-2*u);};
// Finite demonstrations, never an unattended idle shake. Motion is exaggerated.
export const QUAKE_WINDOWS=[[16,205],[810,875],[1185,1510],[1593,1690],[1710,1858]] as const;
export function seismicMotion(f:number){
 const w=QUAKE_WINDOWS.find(([a,b])=>f>=a&&f<=b);
 if(!w)return {ground:0,building:0};
 const [a,b]=w,t=(f-a)/30,env=smooth(f,a,a+12)*(1-smooth(f,b-18,b));
 const ground=.40*env*(.78*Math.sin(t*8.2)+.22*Math.sin(t*14.3));
 // Lower amplitude, slower response, NOT a perfectly motionless superstructure.
 const building=.095*env*Math.sin(t*4.9-.35);
 return {ground,building};
}
export function jellyMotion(f:number){
 const locked=f<572;const a=locked?460:593,b=locked?570:730;
 const env=smooth(f,a,a+9)*(1-smooth(f,b-12,b));const t=(f-a)/30;
 const table=.22*env*Math.sin(t*10);
 const tray=locked?table:.055*env*Math.sin(t*5-.3);
 const wobble=(locked?.19:.038)*env*Math.sin(t*11-1);
 return {table,tray,wobble,locked};
}
