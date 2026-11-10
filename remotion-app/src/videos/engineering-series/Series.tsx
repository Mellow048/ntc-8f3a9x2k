// Five original engineering shorts, with word-synchronised 1–2 word captions.
import React, {useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,noInkFallback} from '../pendulum/ink';
import {GradeEffect,GRADES,GRADE_STRENGTH} from '../pendulum/grade';
import {LensBlur} from '../pendulum/lensblur';
import {World,Beat} from './World';
import {BridgeWorld} from '../bridge-remaster/BridgeWorld';
import {loadBridgeAssets,type BridgeAssets} from '../bridge-remaster/assets';
import data from './data.json';

type Word={word:string;start:number;end:number};
type Story={title:string;frames:number;words:Word[];beats:Beat[]};
export type Slug='breathing-bridge'|'spring-building'|'ocean-airport'|'channel-tunnel'|'sky-plaza';
export const stories=data as Record<Slug,Story>;

const Scene:React.FC<{slug:Slug;assets:BridgeAssets|null}> = ({slug,assets})=>{
 const frame=useCurrentFrame(); const {camera,scene}=useThree();
 const world=useMemo(()=>slug==='breathing-bridge' ? new BridgeWorld(assets!) : new World(slug,stories[slug].beats),[slug,assets]);
 const fx=useMemo(()=>({
  ink:new InkPass(scene,camera as THREE.PerspectiveCamera),
  lens:new LensBlur({maxCoC:24,nearScale:1.2}),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.35,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:5,radius:.55}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day),
 }),[camera,scene]);
 const post=useMemo(()=> <EffectComposer multisampling={4}>{[
   <primitive key="ink" object={fx.ink} dispose={null}/>,
   ...(slug==='breathing-bridge' ? [<primitive key="lens-pre" object={fx.lens.pre} dispose={null}/>,<primitive key="lens-main" object={fx.lens.main} dispose={null}/>] : []),
   <primitive key="bloom" object={fx.bloom} dispose={null}/>,
   <primitive key="tone" object={fx.tone} dispose={null}/>,
   <primitive key="grade" object={fx.grade} dispose={null}/>,
 ]}</EffectComposer>,[fx,slug]);
 world.update(frame,camera as THREE.PerspectiveCamera);noInkFallback(world.root);
 if(world instanceof BridgeWorld){
  const direction=new THREE.Vector3();camera.getWorldDirection(direction);
  fx.lens.focus=Math.max(.3,world.focus.clone().sub(camera.position).dot(direction));
  fx.lens.cInf=((frame>=77&&frame<188)||(frame>=842&&frame<950)||(frame>=1665&&frame<1740))?12:0;
 }
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

const TemperatureCue:React.FC=()=>{
 const frame=useCurrentFrame();
 const hot=(frame>=270&&frame<325)||(frame>=1078&&frame<1199);
 const cold=(frame>=325&&frame<380)||(frame>=1199&&frame<1316);
 if(!hot&&!cold)return null;
 const color=hot?'#e56449':'#5b9fd0';
 return <div style={{position:'absolute',right:'7%',top:'8%',width:'18%',aspectRatio:'1',borderRadius:'50%',background:'rgba(255,250,231,.94)',boxShadow:'0 3px 0 #3b2b36, 0 6px 14px #2b333b33',display:'grid',placeItems:'center'}}>
  <svg viewBox="0 0 100 100" style={{width:'68%',height:'68%'}} aria-hidden="true">
   {hot ? <g fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"><circle cx="50" cy="50" r="18" fill={color}/>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <line key={i} x1={50+27*Math.cos(a)} y1={50+27*Math.sin(a)} x2={50+38*Math.cos(a)} y2={50+38*Math.sin(a)}/>;})}</g> : <g fill="none" stroke={color} strokeWidth="6" strokeLinecap="round">{Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return <line key={i} x1="50" y1="50" x2={50+35*Math.cos(a)} y2={50+35*Math.sin(a)}/>;})}<circle cx="50" cy="50" r="5" fill={color}/></g>}
  </svg>
 </div>;
};

export const EngineeringShort:React.FC<{slug:Slug}>=({slug})=>{
 const {width,height}=useVideoConfig();
 const [assets,setAssets]=useState<BridgeAssets|null>(null);
 const [handle]=useState(()=>delayRender('Load bridge vehicle models'));
 useEffect(()=>{
  if(slug!=='breathing-bridge'){continueRender(handle);return;}
  loadBridgeAssets().then(a=>{setAssets(a);continueRender(handle);}).catch(e=>cancelRender(e));
 },[slug,handle]);
 if(slug==='breathing-bridge'&&!assets)return null;
 return <AbsoluteFill style={{background:'#bce5f2',containerType:'inline-size'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance'}} camera={{fov:40,near:.1,far:300}}>
   <Scene slug={slug} assets={assets}/>
  </ThreeCanvas>
  {slug==='breathing-bridge' && <TemperatureCue/>}
  <Captions words={stories[slug].words}/>
 </AbsoluteFill>;
};
