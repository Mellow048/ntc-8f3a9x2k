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
  const m=new T.ShaderMaterial({uniforms:this.u,side:T.DoubleSide,vertexShader:`uniform float time,depth;varying vec3 wp;varying float rr;void main(){vec3 p=position;float r=length(p.xz);p.y=-depth*8.*exp(-r*r/30.)+sin(r*2.5-time*4.)*.075+sin(p.x*.8+p.z*.6-time*2.)*.035+sin(p.x*3.1-p.z*2.4+time*3.)*.025;rr=r;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform mat4 modelMatrix;uniform float time,depth,flow;varying vec3 wp;varying float rr;
   float surface(vec2 p){float r=length(p);return -depth*8.*exp(-r*r/30.)+sin(r*2.5-time*4.)*.075+sin(p.x*.8+p.y*.6-time*2.)*.035+sin(p.x*3.1-p.y*2.4+time*3.)*.025;}
   void main(){vec3 world=(modelMatrix*vec4(wp,1.)).xyz;vec3 eye=normalize(cameraPosition-world);float e=.045;
   vec3 n=normalize(vec3(surface(wp.xz-vec2(e,0.))-surface(wp.xz+vec2(e,0.)),2.*e,surface(wp.xz-vec2(0.,e))-surface(wp.xz+vec2(0.,e))));
   float fres=.035+.965*pow(1.-max(dot(n,eye),0.),5.);vec3 reflection=reflect(-eye,n);
   vec3 sky=mix(vec3(.22,.31,.32),vec3(.59,.75,.83),smoothstep(-.1,.6,reflection.y));
   float cloud=pow(.5+.5*sin(reflection.x*19.+reflection.z*7.),8.)*smoothstep(.1,.5,reflection.y);sky+=cloud*.14;
   float sun=pow(max(dot(reflect(-normalize(vec3(-.5,.8,.3)),n),eye),0.),150.);
   float a=atan(wp.z,wp.x);float turbulence=sin(wp.x*4.+time*2.)*sin(wp.z*5.-time*3.);
   float spiral=pow(.5+.5*sin(a*7.+log(rr+.3)*15.-time*flow*3.+turbulence*.65),24.);
   float foam=spiral*depth*.65*exp(-rr/18.)+pow(max(0.,turbulence),12.)*.17;
   vec3 deep=mix(vec3(.025,.095,.10),vec3(.08,.23,.24),clamp(rr/20.,0.,1.));
   vec3 c=mix(deep,sky,.20+fres*.7)+vec3(1.,.88,.66)*sun*.8;c=mix(c,vec3(.73,.85,.83),clamp(foam,0.,.85));
   float fog=clamp(length(world-cameraPosition)/150.,0.,.5);gl_FragColor=vec4(mix(c,vec3(.54,.66,.70),fog),1.);}`});this.mesh=new T.Mesh(g,m);this.mesh.layers.set(NOINK);p.add(this.mesh);}
 update(t:number,d:number,flow=1){this.u.time.value=t;this.u.depth.value=d;this.u.flow.value=flow;}
 height(x:number,z:number,t:number,d:number){const r=Math.hypot(x,z);return -d*8*Math.exp(-r*r/30)+Math.sin(r*2.5-t*4)*.075+Math.sin(x*.8+z*.6-t*2)*.035+Math.sin(x*3.1-z*2.4+t*3)*.025;}
}

export class CanalWater {
 mesh:T.Mesh;u={time:{value:0},direction:{value:1}};
 constructor(p:T.Object3D){const g=new T.PlaneGeometry(5.8,65,12,120);g.rotateX(-Math.PI/2);const m=new T.ShaderMaterial({uniforms:this.u,side:T.DoubleSide,vertexShader:'uniform float time,direction;varying vec3 wp;void main(){vec3 p=position;p.y=sin(p.z*3.-time*direction*4.)*.025+sin(p.x*4.+p.z-time*2.)*.012;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float time,direction;varying vec3 wp;void main(){float line=pow(.5+.5*sin(wp.z*3.-time*direction*4.+sin(wp.x*6.)),16.);vec3 col=mix(vec3(.045,.17,.23),vec3(.30,.51,.55),line*.7);gl_FragColor=vec4(col,1.);}'});this.mesh=new T.Mesh(g,m);this.mesh.position.z=-9;this.mesh.layers.set(NOINK);p.add(this.mesh);}
 update(t:number,d:number){this.u.time.value=t;this.u.direction.value=d;}
}

// Surface-only flood water: no cuboid sides or flat blue front face.
export function floodSurface(p:T.Object3D,width:number,length:number){
 const u={time:{value:0}};
 const g=new T.PlaneGeometry(width,length,40,90);g.rotateX(-Math.PI/2);
 const m=new T.ShaderMaterial({uniforms:u,side:T.DoubleSide,transparent:true,vertexShader:`uniform float time;varying vec3 wp;void main(){vec3 p=position;p.y=sin(p.x*3.+p.z*2.-time*5.)*.055+sin(p.z*5.-time*7.)*.025;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform mat4 modelMatrix;uniform float time;varying vec3 wp;void main(){vec3 world=(modelMatrix*vec4(wp,1.)).xyz;float dx=.165*cos(wp.x*3.+wp.z*2.-time*5.);float dz=.11*cos(wp.x*3.+wp.z*2.-time*5.)+.125*cos(wp.z*5.-time*7.);vec3 n=normalize(vec3(-dx,1.,-dz));vec3 e=normalize(cameraPosition-world);float fr=pow(1.-max(dot(n,e),0.),4.);float sparkle=pow(max(dot(reflect(-normalize(vec3(.3,1.,.6)),n),e),0.),65.);float foam=pow(.5+.5*sin(wp.z*4.-time*5.+sin(wp.x*7.)),24.);vec3 c=mix(vec3(.025,.13,.15),vec3(.38,.55,.58),.15+fr*.65);c+=vec3(.9,.78,.5)*sparkle*.65;c=mix(c,vec3(.67,.79,.77),foam*.22);gl_FragColor=vec4(c,.94);}`});
 const mesh=new T.Mesh(g,m);mesh.layers.set(NOINK);mesh.userData.dynamic=true;p.add(mesh);return {mesh,update:(time:number)=>{u.time.value=time;}};
}
