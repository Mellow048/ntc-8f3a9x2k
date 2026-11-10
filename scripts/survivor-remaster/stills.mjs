import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(resolve('remotion-app/package.json'));
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:resolve('remotion-app/src/survivor-remaster/index.tsx')});
const browserExecutable=process.env.CHROME_PATH;
const chromiumOptions={gl:'swiftshader'};
const composition=await selectComposition({serveUrl,id:'SurvivorRemastered',browserExecutable,chromiumOptions,timeoutInMilliseconds:300000});
const dir=resolve('shoots/curiosity-survivor/out/remaster/stills');await mkdir(dir,{recursive:true});
for(const frame of [25,75,145,215,270,310,355,400,440,470,500,540,600,640,690,745,790,835,890,950,1010,1080,1150,1220]){
 await renderStill({serveUrl,composition,output:resolve(dir,`frame-${String(frame).padStart(4,'0')}.png`),frame,browserExecutable,chromiumOptions,timeoutInMilliseconds:300000,imageFormat:'png'});
 console.log(`Verified rendered preview frame ${frame}`);
}
await writeFile(resolve(dir,'preview.json'),JSON.stringify({composition:'SurvivorRemastered',frames:[25,75,145,215,270,310,355,400,440,470,500,540,600,640,690,745,790,835,890,950,1010,1080,1150,1220],width:720,height:1280},null,2));
