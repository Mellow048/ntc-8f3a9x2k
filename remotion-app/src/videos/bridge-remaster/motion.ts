// Narration-locked, deliberately exaggerated displacements for illustration.
// Positive shift moves the left span rightward and right span leftward: smaller gap.
export const smooth = (frame:number,a:number,b:number) => {
 const u=Math.max(0,Math.min(1,(frame-a)/(b-a)));return u*u*(3-2*u);
};
export const MOTION_WINDOWS = [[284,314],[337,369],[1120,1176],[1239,1288]] as const;
export function jointShift(frame:number):number {
 if(frame>=270 && frame<325) return -.10+.20*smooth(frame,284,314);
 if(frame>=325 && frame<380) return .10-.20*smooth(frame,337,369);
 if(frame>=1078 && frame<1199) return -.10+.20*smooth(frame,1120,1176);
 if(frame>=1199 && frame<1316) return .10-.20*smooth(frame,1239,1288);
 return 0;
}
export function jointCue(frame:number):'in'|'out'|null {
 const index=MOTION_WINDOWS.findIndex(([a,b])=>frame>=a && frame<=b);
 return index<0?null:index%2===0?'in':'out';
}
