import * as T from 'three';
import {NOINK} from '../beer-remaster/style/ink';
// An open radial mesh, not a dark circle painted on a solid plane. Its centre
// descends eight metres; boats use the same surface equation for immersion.
export class LakeWater {
 mesh:T.Mesh;u={time:{value:0},depth:{value:1},flow:{value:1}};
 constructor(p:T.Object3D,public width=55){const pos:number[]=[],uv:number[]=[],idx:number[]=[];const rings=55,n=112;
  for(let r=0;r<=rings;r++){const rad=.3+(width-.3)*Math.pow(r/rings,1.6);for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;pos.push(Math.cos(a)*rad,0,Math.sin(a)*rad);uv.push(j/n,r/rings);}}
  for(let r=0;r<rings;r++)for(let j=0;j<n;j++){const a=r*(n+1)+j,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);
  const m=new T.ShaderMaterial({uniforms:this.u,side:T.DoubleSide,vertexShader:`uniform float time,depth;varying vec3 wp;varying float rr;void main(){vec3 p=position;float r=length(p.xz);p.y=-depth*8.*exp(-r*r/30.)+sin(r*2.5-time*4.)*.075+sin(p.x*.8+p.z*.6-time*2.)*.035;rr=r;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform float time,depth,flow;varying vec3 wp;varying float rr;void main(){float a=atan(wp.z,wp.x);float spiral=pow(.5+.5*sin(a*7.+log(rr+.3)*15.-time*flow*3.),16.);float rip=pow(.5+.5*sin(rr*4.-time*4.+sin(a*5.)),24.);vec3 c=mix(vec3(.025,.10,.15),vec3(.13,.33,.39),clamp(rr/20.,0.,1.));c+=vec3(.1,.15,.16)*sin(wp.x*.7+wp.z*.9-time)*.15;float foam=(spiral*.65+ rip*.25)*(.35+depth*.65);c=mix(c,vec3(.70,.83,.79),foam);float fog=clamp(length(wp-cameraPosition)/130.,0.,.5);gl_FragColor=vec4(mix(c,vec3(.54,.66,.70),fog),1.);}`});this.mesh=new T.Mesh(g,m);this.mesh.layers.set(NOINK);p.add(this.mesh);}
 update(t:number,d:number,flow=1){this.u.time.value=t;this.u.depth.value=d;this.u.flow.value=flow;}
 height(x:number,z:number,t:number,d:number){const r=Math.hypot(x,z);return -d*8*Math.exp(-r*r/30)+Math.sin(r*2.5-t*4)*.075+Math.sin(x*.8+z*.6-t*2)*.035;}
}

export class CanalWater {
 mesh:T.Mesh;u={time:{value:0},direction:{value:1}};
 constructor(p:T.Object3D){const g=new T.PlaneGeometry(5.8,65,12,120);g.rotateX(-Math.PI/2);const m=new T.ShaderMaterial({uniforms:this.u,side:T.DoubleSide,vertexShader:'uniform float time,direction;varying vec3 wp;void main(){vec3 p=position;p.y=sin(p.z*3.-time*direction*4.)*.025+sin(p.x*4.+p.z-time*2.)*.012;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float time,direction;varying vec3 wp;void main(){float line=pow(.5+.5*sin(wp.z*3.-time*direction*4.+sin(wp.x*6.)),16.);vec3 col=mix(vec3(.045,.17,.23),vec3(.30,.51,.55),line*.7);gl_FragColor=vec4(col,1.);}'});this.mesh=new T.Mesh(g,m);this.mesh.position.z=-9;this.mesh.layers.set(NOINK);p.add(this.mesh);}
 update(t:number,d:number){this.u.time.value=t;this.u.direction.value=d;}
}
