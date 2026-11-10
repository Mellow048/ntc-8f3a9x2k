import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(resolve('remotion-app/package.json'));
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:resolve('remotion-app/src/beer-remaster/index.tsx')});
const browserExecutable=process.env.CHROME_PATH;
const chromiumOptions={gl:'swiftshader'};
const composition=await selectComposition({serveUrl,id:'BeerFloodRemastered',browserExecutable,chromiumOptions,timeoutInMilliseconds:300000});
const dir=resolve('shoots/curiosity-beer/out/remaster/stills');await mkdir(dir,{recursive:true});
for(const frame of [35,75,125,175,220,270,320,365,410,450,535,585,635,680,720,770,820,865,915,965,1010,1060]){
 await renderStill({serveUrl,composition,output:resolve(dir,`frame-${String(frame).padStart(4,'0')}.png`),frame,browserExecutable,chromiumOptions,timeoutInMilliseconds:300000,imageFormat:'png'});
 console.log(`Verified rendered preview frame ${frame}`);
}
await writeFile(resolve(dir,'preview.json'),JSON.stringify({composition:'BeerFloodRemastered',frames:[35,75,125,175,220,270,320,365,410,450,535,585,635,680,720,770,820,865,915,965,1010,1060],width:720,height:1280},null,2));
