// Timed to the approved Arena narration in shoots/spring-building/voice/words.json.
export type V=[number,number,number];
export type Kind='hall'|'dome'|'guide'|'history'|'cutaway'|'bearing'|'layers'|'jelly'|'moat';
export const TOTAL=1890;
export const SHOTS:{start:number;kind:Kind;cam:V;target:V;fov:number}[]=[
 {start:0,kind:'hall',cam:[19,12,28],target:[0,4.7,0],fov:44},
 {start:45,kind:'cutaway',cam:[15,9,22],target:[0,4,0],fov:45},
 {start:88,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:131,kind:'cutaway',cam:[13,8,22],target:[0,3.6,0],fov:45},
 {start:181,kind:'cutaway',cam:[-11,7,20],target:[0,3.8,0],fov:45},
 {start:247,kind:'hall',cam:[17,11,29],target:[0,4.8,0],fov:44},
 {start:339,kind:'dome',cam:[9,12.7,16],target:[0,8.1,0],fov:42},
 {start:400,kind:'guide',cam:[3,2.8,10.5],target:[1.1,1.25,5.2],fov:39},
 {start:469,kind:'history',cam:[16,11,28],target:[0,4.5,0],fov:44},
 {start:538,kind:'history',cam:[8,6.2,13],target:[0,3.8,2.4],fov:43},
 {start:591,kind:'guide',cam:[2.7,3.2,10.5],target:[1.1,1.25,5.2],fov:39},
 {start:657,kind:'dome',cam:[-8,12,16],target:[0,7.7,0],fov:42},
 {start:711,kind:'cutaway',cam:[14,7.8,22],target:[0,3.8,0],fov:45},
 {start:772,kind:'cutaway',cam:[9,4.5,16],target:[0,1.7,0],fov:45},
 {start:821,kind:'bearing',cam:[4,3.3,6.1],target:[0,1.3,0],fov:42},
 {start:877,kind:'jelly',cam:[5.2,4.7,7.5],target:[0,1.7,0],fov:42},
 {start:949,kind:'jelly',cam:[3.4,3.5,5.7],target:[0,1.6,0],fov:42},
 {start:1012,kind:'jelly',cam:[3.4,3.5,5.7],target:[0,1.6,0],fov:42},
 {start:1065,kind:'jelly',cam:[-3,3.3,5.4],target:[0,1.65,0],fov:42},
 {start:1136,kind:'cutaway',cam:[13,7.8,22],target:[0,3.8,0],fov:45},
 {start:1170,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:1205,kind:'layers',cam:[3.6,3.1,5.3],target:[0,1.3,0],fov:42},
 {start:1260,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:1322,kind:'cutaway',cam:[13,7,21],target:[0,3.6,0],fov:45},
 {start:1408,kind:'moat',cam:[10,8,13],target:[6.8,.4,2],fov:42},
 {start:1463,kind:'moat',cam:[8.5,4,10],target:[7,.5,2.4],fov:42},
 {start:1558,kind:'cutaway',cam:[12,7.5,21],target:[0,3.7,0],fov:45},
 {start:1629,kind:'hall',cam:[16,10.5,27],target:[0,4.7,0],fov:44},
 {start:1673,kind:'bearing',cam:[4.3,3.5,6.5],target:[0,1.3,0],fov:42},
 {start:1753,kind:'guide',cam:[3,2.8,10.5],target:[1.1,1.25,5.2],fov:39},
 {start:1818,kind:'hall',cam:[17,11,29],target:[0,4.8,0],fov:44},
];
export const smooth=(f:number,a:number,b:number)=>{const u=Math.max(0,Math.min(1,(f-a)/(b-a)));return u*u*(3-2*u);};
// Finite demonstrations, never an unattended idle shake. Motion is exaggerated.
export const QUAKE_WINDOWS=[[138,242],[536,589],[1260,1405],[1463,1554],[1588,1672],[1699,1880]] as const;
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
 const locked=f<1012;const a=locked?960:1030,b=locked?1008:1132;
 const env=smooth(f,a,a+9)*(1-smooth(f,b-12,b));const t=(f-a)/30;
 const table=.22*env*Math.sin(t*10);
 const tray=locked?table:.055*env*Math.sin(t*5-.3);
 const wobble=(locked?.19:.038)*env*Math.sin(t*11-1);
 return {table,tray,wobble,locked};
}
