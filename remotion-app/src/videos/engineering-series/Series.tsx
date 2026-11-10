// Five original engineering shorts, with word-synchronised 1–2 word captions.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,noInkFallback} from '../pendulum/ink';
import {GradeEffect,GRADES,GRADE_STRENGTH} from '../pendulum/grade';
import {World,Beat} from './World';
import data from './data.json';

type Word={word:string;start:number;end:number};
type Story={title:string;frames:number;words:Word[];beats:Beat[]};
export type Slug='breathing-bridge'|'spring-building'|'ocean-airport'|'channel-tunnel'|'sky-plaza';
export const stories=data as Record<Slug,Story>;

const Scene:React.FC<{slug:Slug}> = ({slug})=>{
 const frame=useCurrentFrame(); const {camera,scene}=useThree();
 const world=useMemo(()=>new World(slug,stories[slug].beats),[slug]);
 const fx=useMemo(()=>({
  ink:new InkPass(scene,camera as THREE.PerspectiveCamera),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.35,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:5,radius:.55}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day),
 }),[camera,scene]);
 const post=useMemo(()=><EffectComposer multisampling={4}>
   <primitive object={fx.ink} dispose={null}/>
   <primitive object={fx.bloom} dispose={null}/>
   <primitive object={fx.tone} dispose={null}/>
   <primitive object={fx.grade} dispose={null}/>
 </EffectComposer>,[fx]);
 world.update(frame,camera as THREE.PerspectiveCamera);noInkFallback(world.root);
 return <><primitive object={world.root} dispose={null}/>{post}</>;
};

type Caption={start:number;end:number;text:string};
function captionGroups(words:Word[]):Caption[]{
 const out:Caption[]=[];
 for(let i=0;i<words.length;){
  const a=words[i];const b=words[i+1];
  // Never bridge a sentence pause or combine into more than two displayed words.
  const pair=b && b.start-a.end<.16 && a.word.length+b.word.length<=20;
  const last=pair?b:a;const following=words[i+(pair?2:1)];
  const end=following && following.start-last.end<.24 ? following.start : last.end+.12;
  out.push({start:Math.max(0,a.start-.025),end,text:(pair?`${a.word} ${b.word}`:a.word).toUpperCase()});
  i+=pair?2:1;
 }
 return out;
}
const Captions:React.FC<{words:Word[]}>=({words})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();const groups=useMemo(()=>captionGroups(words),[words]);
 const time=f/fps;const c=groups.find(x=>time>=x.start&&time<x.end);
 if(!c)return null;
 const age=Math.max(0,(time-c.start)*fps),scale=1+0.09*Math.max(0,1-age/3);
 return <AbsoluteFill style={{pointerEvents:'none',justifyContent:'flex-end',alignItems:'center',paddingBottom:'17%'}}>
  <div style={{maxWidth:'88%',textAlign:'center',fontFamily:'Arial, Helvetica, sans-serif',fontWeight:900,fontSize:'8.3cqw',lineHeight:1.04,letterSpacing:'0.01em',color:'#fff8dd',WebkitTextStroke:'0.045em #241726',paintOrder:'stroke fill',textShadow:'0 .055em 0 #241726, 0 .09em .14em #24172699',transform:`scale(${scale})`}}>{c.text}</div>
 </AbsoluteFill>;
};

export const EngineeringShort:React.FC<{slug:Slug}>=({slug})=>{
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#bce5f2',containerType:'inline-size'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance'}} camera={{fov:40,near:.1,far:300}}>
   <Scene slug={slug}/>
  </ThreeCanvas>
  <Captions words={stories[slug].words}/>
 </AbsoluteFill>;
};
