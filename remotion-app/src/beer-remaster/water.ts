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
   void main(){vec3 p=position;float d=p.z-front;float wave=exp(-d*d/3.5)*energy;float rip=(sin(p.x*3.6+p.z*2.2-time*5.)*.045+sin(p.z*5.-p.x*1.4-time*7.)*.022)*energy;p.y=height+wave*.8+rip;crest=wave+max(0.,rip)*2.;wp=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
   fragmentShader:`uniform float time,energy;uniform sampler2D nearMap,farMap;varying vec3 wp;varying float crest;
   void main(){vec2 uv=wp.xz/6.+vec2(.05*time,-.22*time);vec4 mk=texture2D(nearMap,uv)+texture2D(farMap,wp.xz/18.+vec2(0.,-.05*time))*.6;float ripple=.5+.5*sin(wp.z*5.-wp.x*2.-time*5.);vec3 col=mix(vec3(.115,.048,.025),vec3(.36,.18,.075),ripple*.45+mk.r*.4);float foam=clamp((crest-.45)*1.4+mk.r*.43+mk.b*.4,0.,.85);col=mix(col,vec3(.77,.59,.33),foam);float glint=pow(max(0.,sin(wp.x*4.+wp.z*7.-time*4.)),24.)*.12;col+=vec3(.55,.68,.85)*glint;float far=clamp(length(wp-cameraPosition)/80.,0.,.45);col=mix(col,vec3(.38,.45,.54),far);gl_FragColor=vec4(col,1.);}`
  });this.mesh=new T.Mesh(g,m);this.mesh.layers.set(NOINK);p.add(this.mesh);
 }
 update(time:number,front:number,height:number,energy:number){this.uniforms.time.value=time;this.uniforms.front.value=front;this.uniforms.height.value=height;this.uniforms.energy.value=energy;}
}
