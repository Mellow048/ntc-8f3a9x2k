import React,{useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BloomEffect,BlendFunction,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {World} from './world';
import {WORDS,shotAt,clamp} from './story';
import {InkPass,noInkFallback} from './style/ink';
import {LensBlur} from './style/lensblur';
import {GradeEffect,GRADES,gradeFor} from './style/grade';
const Scene:React.FC=()=>{
 const f=useCurrentFrame(),s=shotAt(f);const {camera,scene}=useThree();
 const world=useMemo(()=>new World(s.place),[s.place]);
 const fx=useMemo(()=>({ink:new InkPass(scene,camera as T.PerspectiveCamera),lens:new LensBlur({maxCoC:16,nearScale:1.1}),bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.4,luminanceThreshold:1,mipmapBlur:true,levels:4,radius:.6}),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADES.day,.85)}),[camera,scene]);
 const target=world.update(s,f,camera as T.PerspectiveCamera,scene);noInkFallback(world.root);
 gradeFor(fx.grade,(s.light??'day') as 'day');
 const forward=new T.Vector3();camera.getWorldDirection(forward);fx.lens.focus=Math.max(.3,target.clone().sub(camera.position).dot(forward));fx.lens.cInf=['fakeid','pass'].includes(s.place)?3:0;
 const post=useMemo(()=><EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null}/><primitive object={fx.lens.pre} dispose={null}/><primitive object={fx.lens.main} dispose={null}/><primitive object={fx.bloom} dispose={null}/><primitive object={fx.tone} dispose={null}/><primitive object={fx.grade} dispose={null}/></EffectComposer>,[fx]);
 return <><primitive object={world.root} dispose={null}/>{post}</>;
};
export const Captions:React.FC=()=>{
 const f=useCurrentFrame(),t=f/30;
 const groups=useMemo(()=>{const g:{text:string;start:number;end:number}[]=[];for(let i=0;i<WORDS.length;){const a=WORDS[i],b=WORDS[i+1];const pair=!!b&&a.word.length+b.word.length<=13&&b.start-a.end<.32;g.push({text:a.word+(pair?' '+b.word:''),start:a.start,end:pair?b.end:a.end});i+=pair?2:1;}return g;},[]);
 const g=groups.find((a,i)=>t>=Math.max(0,a.start-.035)&&t<(groups[i+1]?Math.min(a.end+.15,groups[i+1].start-.035):a.end+.15));if(!g)return null;
 const scale=1+.08*(1-clamp((f-g.start*30)/4));
 return <div style={{position:'absolute',top:'73%',left:22,right:22,textAlign:'center',fontFamily:'Arial,sans-serif',fontSize:57,fontWeight:900,lineHeight:1.1,textTransform:'uppercase',color:'#fff',WebkitTextStroke:'2px #241726',paintOrder:'stroke fill',textShadow:'0 4px 0 #241726, 0 6px 12px #0008',transform:`scale(${scale})`}}>{g.text}</div>;
};
export const Petit:React.FC=()=>{
 const f=useCurrentFrame(),s=shotAt(f),{width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#b8d0ec'}}><ThreeCanvas width={width} height={height} shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}} camera={{fov:43,near:.15,far:650}}><Scene/></ThreeCanvas>{s.label&&<div style={{position:'absolute',top:65,left:36,font:'700 22px Arial',letterSpacing:2,textTransform:'uppercase',color:'#fff8e9',padding:'9px 14px',background:'#263244d9',borderLeft:'4px solid #dabb78'}}>{s.label}</div>}<Captions/></AbsoluteFill>;
};
