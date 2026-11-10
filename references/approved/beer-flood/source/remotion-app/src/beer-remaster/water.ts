import * as T from 'three';
import {waterNear,waterFar} from './style/paint';
import {NOINK} from './style/ink';
// Continuous, shaded fluid surface: flowing painted ripples, foam on actual crests,
// and a moving surge. No flat brown road or floating ellipse 'foam' props.
export class Porter {
 mesh:T.Mesh; uniforms:Record<string,T.IUniform>;
 constructor(p:T.Object3D,width=9,length=75){
  const near=waterNear(),far=waterFar();near.colorSpace=far.colorSpace=T.NoColorSpace;
  this.uniforms={time:{value:0},front:{value:100},height:{value:.35},energy:{value:1},nearMap:{value:near},farMap:{value:far}};
  const g=new T.PlaneGeometry(width,length,32,160);g.rotateX(-Math.PI/2);
  const m=new T.ShaderMaterial({uniforms:this.uniforms,side:T.DoubleSide,vertexShader:`uniform float time,front,height,energy;varying vec3 wp;varying float crest;
   void main(){vec3 p=position;float d=p.z-front;float wave=exp(-d*d/3.5)*energy;float wz=p.z+modelMatrix[3].z;float rip=(sin(p.x*3.6+wz*2.2-time*5.)*.045+sin(wz*5.-p.x*1.4-time*7.)*.022)*energy;p.y=height+wave*.8+rip;crest=wave+max(0.,rip)*2.;wp=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
   fragmentShader:`uniform float time,energy;uniform sampler2D nearMap,farMap;varying vec3 wp;varying float crest;
   void main(){vec2 uv=wp.xz/6.+vec2(.05*time,-.22*time);vec4 mk=texture2D(nearMap,uv)+texture2D(farMap,wp.xz/18.+vec2(0.,-.05*time))*.6;float ripple=.5+.5*sin(wp.z*5.-wp.x*2.-time*5.);vec3 col=mix(vec3(.115,.048,.025),vec3(.36,.18,.075),ripple*.45+mk.r*.4);float foam=clamp((crest-.45)*1.4+mk.r*.43+mk.b*.4,0.,.85);col=mix(col,vec3(.77,.59,.33),foam);float glint=pow(max(0.,sin(wp.x*4.+wp.z*7.-time*4.)),24.)*.12;col+=vec3(.55,.68,.85)*glint;float far=clamp(length(wp-cameraPosition)/80.,0.,.45);col=mix(col,vec3(.38,.45,.54),far);gl_FragColor=vec4(col,1.);}`
  });this.mesh=new T.Mesh(g,m);this.mesh.layers.set(NOINK);p.add(this.mesh);
 }
 surfaceAt(x:number,z:number){const t=this.uniforms.time.value,e=this.uniforms.energy.value,d=z-this.mesh.position.z-this.uniforms.front.value;return this.uniforms.height.value+Math.exp(-d*d/3.5)*e*.8+(Math.sin(x*3.6+z*2.2-t*5)*.045+Math.sin(z*5-x*1.4-t*7)*.022)*e;}
 update(time:number,front:number,height:number,energy:number){this.uniforms.time.value=time;this.uniforms.front.value=front;this.uniforms.height.value=height;this.uniforms.energy.value=energy;}
}

// Expanding contact ripples and short ballistic splashes travel WITH a person,
// tying the figure to the moving fluid instead of a hard brown stage.
export class Wake {
 root=new T.Group();rings:T.Mesh[]=[];drops:T.Mesh[]=[];
 constructor(p:T.Object3D){this.root.userData.dynamic=true;p.add(this.root);
  for(let i=0;i<3;i++){const m=new T.Mesh(new T.TorusGeometry(.48,.018,4,36),new T.MeshBasicMaterial({color:'#e7c492',transparent:true,opacity:.65,depthWrite:false}));m.rotation.x=Math.PI/2;m.layers.set(NOINK);this.root.add(m);this.rings.push(m);}
  const g=new T.SphereGeometry(.035,5,4),m=new T.MeshBasicMaterial({color:'#dfbd88'});
  for(let i=0;i<10;i++){const d=new T.Mesh(g,m);d.layers.set(NOINK);this.root.add(d);this.drops.push(d);}
 }
 update(f:number,x:number,z:number,water:Porter,active:boolean,power=1){this.root.visible=active;this.root.position.set(x,water.surfaceAt(x,z)+.035,z);
  this.rings.forEach((r,i)=>{const q=((f+i*9)%28)/28;r.scale.set( .5+q*1.9, .65+q*1.7,1);(r.material as T.MeshBasicMaterial).opacity=(1-q)*.65;});
  this.drops.forEach((d,i)=>{const q=((f+i*3)%23)/23,a=i*2.4;d.position.set(Math.sin(a)*q*.8,Math.sin(q*Math.PI)*.5*power,Math.cos(a)*q*.65);d.scale.set(.7,1.6,.7).multiplyScalar(1-q*.6);});
 }
}
