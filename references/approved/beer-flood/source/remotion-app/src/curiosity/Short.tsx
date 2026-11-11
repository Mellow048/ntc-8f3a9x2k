import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BloomEffect,ToneMappingEffect,ToneMappingMode,BlendFunction} from 'postprocessing';
import {World} from './world';
import {Slug,DATA,shotAt,CAMS,KICKS,DOF} from './story';
import {InkPass,noInkFallback} from './bridge/ink';
import {LensBlur} from './bridge/lensblur';
import {GradeEffect,GRADES} from './bridge/grade';

const Scene:React.FC<{slug:Slug}> = ({slug})=>{
 const f=useCurrentFrame(), shot=shotAt(slug,f); const {camera,scene}=useThree();
 const world=useMemo(()=>new World(slug,shot),[slug,shot.id]);
 const fx=useMemo(()=>({ink:new InkPass(scene,camera as THREE.PerspectiveCamera),lens:new LensBlur({maxCoC:18}),bloom:new BloomEffect({intensity:.5,luminanceThreshold:1,mipmapBlur:true,levels:4,radius:.6,blendFunction:BlendFunction.ADD}),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADES.day,.65)}),[camera,scene]);
 useEffect(()=>()=>world.dispose(),[world]);
 useEffect(()=>()=>{fx.ink.dispose();fx.bloom.dispose();fx.grade.dispose();fx.tone.dispose();},[fx]);
 const cam=camera as THREE.PerspectiveCamera;const c=CAMS(shot,f);cam.position.set(...c.pos);cam.lookAt(...c.look);cam.fov=40;
 for(const at of KICKS[slug]){const df=f-Math.round(at*30);if(df>=0&&df<7){cam.rotation.z+=(df%2?1:-1)*.014*(1-df/7);}}
 cam.updateProjectionMatrix();world.update(f,cam);noInkFallback(world.root);
 fx.lens.focus=cam.position.distanceTo(new THREE.Vector3(...shot.look));fx.lens.cInf=DOF(shot)*720/1080;
 scene.background=new THREE.Color(shot.golden?'#b8a4a2':'#b8d0ec');scene.fog=new THREE.Fog(shot.golden?'#b8a4a2':'#b8d0ec',32,110);
 return <><primitive object={world.root}/><EffectComposer multisampling={0}><primitive object={fx.ink}/><primitive object={fx.lens.pre}/><primitive object={fx.lens.main}/><primitive object={fx.bloom}/><primitive object={fx.tone}/><primitive object={fx.grade}/></EffectComposer></>;
};
export const Subtitles:React.FC<{slug:Slug}>=({slug})=>{
 const f=useCurrentFrame(),t=f/30;const words=DATA[slug].words;
 // Pair adjacent short words, but keep long words alone. Never more than two.
 const groups=useMemo(()=>{const result:Array<{text:string,start:number,end:number}>=[];for(let i=0;i<words.length;){const a=words[i],b=words[i+1];const pair=!!b&&a.word.length+b.word.length<=13&&b.start-a.end<.32;result.push({text:a.word+(pair?' '+b.word:''),start:a.start,end:pair?b.end:a.end});i+=pair?2:1;}return result;},[slug]);
 const g=groups.find((x,i)=>t>=Math.max(0,x.start-.035)&&t<(groups[i+1]?Math.min(x.end+.15,groups[i+1].start-.035):x.end+.15));if(!g)return null;
 const age=Math.max(0,f-g.start*30);const scale=age<4?1.09-.09*(age/4):1;
 return <div style={{position:'absolute',left:24,right:24,top:'73%',textAlign:'center',fontFamily:'Arial, sans-serif',fontWeight:900,fontSize:58,lineHeight:1.15,letterSpacing:-1,color:'#fff',WebkitTextStroke:'2px #241726',paintOrder:'stroke fill',textShadow:'0 4px 0 #241726, 0 6px 12px #0009',transform:`scale(${scale})`,textTransform:'uppercase'}}>{g.text}</div>;
};
export const CuriosityShort:React.FC<{slug:Slug}>=({slug})=>{const f=useCurrentFrame();const glow=slug==='survivor'?Math.max(...[9.9,20.65].map(at=>{const d=f-at*30;return d>=0&&d<18?Math.sin(d/18*Math.PI)*.42:0;})):0;return <AbsoluteFill style={{background:'#b8d0ec'}}><ThreeCanvas width={720} height={1280} gl={{antialias:false,stencil:false,powerPreference:'high-performance'}} camera={{fov:40,near:.15,far:150}}><Scene slug={slug}/></ThreeCanvas>{glow>0&&<AbsoluteFill style={{background:'#f4dfb4',opacity:glow}}/>}<Subtitles slug={slug}/></AbsoluteFill>;};
