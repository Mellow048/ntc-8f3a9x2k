import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(resolve('remotion-app/package.json'));
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:resolve('remotion-app/src/lake-remaster/index.tsx')});
const browserExecutable=process.env.CHROME_PATH;
const chromiumOptions={gl:'swiftshader'};
const composition=await selectComposition({serveUrl,id:'LakeRemastered',browserExecutable,chromiumOptions,timeoutInMilliseconds:300000});
const dir=resolve('shoots/curiosity-lake/out/remaster/stills');await mkdir(dir,{recursive:true});
for(const frame of [35,90,150,220,290,345,410,455,520,585,650,700,750,805,880,935,985,1030,1085]){
 await renderStill({serveUrl,composition,output:resolve(dir,`frame-${String(frame).padStart(4,'0')}.png`),frame,browserExecutable,chromiumOptions,timeoutInMilliseconds:300000,imageFormat:'png'});
 console.log(`Verified rendered preview frame ${frame}`);
}
await writeFile(resolve(dir,'preview.json'),JSON.stringify({composition:'LakeRemastered',frames:[35,90,150,220,290,345,410,455,520,585,650,700,750,805,880,935,985,1030,1085],width:720,height:1280},null,2));
