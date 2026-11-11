import D from './data.json';
export const FPS=30,TOTAL=D.total,WORDS=D.words,SHOTS=D.shots;
export const CAPTIONS=(D as unknown as {captions:{start:number;end:number;text:string}[]}).captions;
export type Shot=typeof SHOTS[number];
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(x:number)=>{x=clamp(x);return x*x*(3-2*x);};
export const word=(i:number)=>Math.round(WORDS[i].start*FPS)-2;
export const action=(f:number,i:number,d=14)=>ease((f-word(i))/d);
export const shotAt=(f:number)=>SHOTS.find(s=>f>=s.a&&f<s.b)??SHOTS[SHOTS.length-1];
