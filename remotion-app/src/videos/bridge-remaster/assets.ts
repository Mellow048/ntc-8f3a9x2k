// Properly modelled, attributed vehicle meshes. Load once; every shot clones
// the shared geometry. Render must fail rather than silently revert to boxes.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {staticFile} from 'remotion';
export type BridgeAssets = THREE.Group[];
let promise:Promise<BridgeAssets>|null=null;
export const loadBridgeAssets=()=>{
 if(!promise){
  const loader=new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  promise=Promise.all(['byd-dolphin-mini.glb','chevrolet-onix.glb'].map(async file=>{
   const loaded=(await loader.loadAsync(staticFile(`bridge-remaster/${file}`))).scene;
   // Align ground, normalise length to 1.5 scene units, and turn +Z front to +X.
   const car=new THREE.Group();car.add(loaded);loaded.rotation.y=Math.PI/2;
   car.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(car);const size=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3());
   loaded.position.set(-mid.x,-bounds.min.y,-mid.z);car.scale.setScalar(1.5/size.x);
   car.traverse(o=>{if(o instanceof THREE.Mesh){
    o.castShadow=true;o.receiveShadow=true;
    const paints=file.startsWith('byd')?['Carro_Pintura']:['ID74','ID74_0'];
    const tint=file.startsWith('byd')?'#597f91':'#bf6c59';
    const fix=(source:THREE.Material)=>{if(!paints.includes(source.name))return source;const m=source.clone() as THREE.MeshStandardMaterial;if(m.color)m.color.set(tint);return m;};
    o.material=Array.isArray(o.material)?o.material.map(fix):fix(o.material);
   }});
   return car;
  }));
 }
 return promise;
};
