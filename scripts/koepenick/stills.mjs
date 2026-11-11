import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(resolve('remotion-app/package.json'));
const {bundle}=require('@remotion/bundler');const {selectComposition,renderStill}=require('@remotion/renderer');
const data=JSON.parse(await readFile('remotion-app/src/videos/koepenick/data.json','utf8'));
const serveUrl=await bundle({entryPoint:resolve('remotion-app/src/index.ts')});
const opts={serveUrl,id:'Koepenick',browserExecutable:process.env.CHROME_PATH,chromiumOptions:{gl:'swiftshader'},timeoutInMilliseconds:300000};
const composition=await selectComposition(opts);const dir=resolve('deliveries/koepenick/previews');await mkdir(dir,{recursive:true});
const requested=process.env.REVIEW_FRAMES??'';
const frames=requested.includes(',')?requested.split(',').map(Number):[...data.shots.map(s=>Math.round(s.a+(s.b-s.a)*.65)),5,100,Math.round(68.3*30)];
for(const frame of frames){await renderStill({...opts,composition,output:resolve(dir,`frame-${String(frame).padStart(4,'0')}.png`),frame,imageFormat:'png'});console.log('Preview frame',frame);}
await writeFile(resolve(dir,'manifest.json'),JSON.stringify({frames,shots:data.shots,width:720,height:1280},null,2));
