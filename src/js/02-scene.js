/* ================= cena 3D: renderizador, luzes, cenário, partículas ================= */
const app=$('#app'),canvas=$('#c');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true}); }
catch(e){ screenEl.innerHTML='<div class="panel"><h1 class="title">Ops</h1><p class="err">Seu aparelho não conseguiu iniciar o 3D (WebGL). Tente outro navegador ou ative a aceleração de hardware.</p></div>'; return; }
const LOWEND=(navigator.hardwareConcurrency||4)<=4&&/Android|iPhone|iPad/i.test(navigator.userAgent);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,LOWEND?1.5:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.NoToneMapping;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1b120f);
scene.fog=new THREE.Fog(0x1b120f,16,38);
const camera=new THREE.PerspectiveCamera(40,1,.1,120);
const lookTarget=V(0,.9,.3),camBase=V(0,8,13),camPos=V(0,9,16);

const gradTex=new THREE.DataTexture(new Uint8Array([80,80,80,255,165,165,165,255,255,255,255,255]),3,1,THREE.RGBAFormat);
gradTex.minFilter=gradTex.magFilter=THREE.NearestFilter;gradTex.generateMipmaps=false;gradTex.needsUpdate=true;
function makeGlowTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.75)');gr.addColorStop(.6,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const glowTex=makeGlowTex();
function glowSprite(color,size,opacity=1){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity}));s.scale.setScalar(size);return s;}

const hemi=new THREE.HemisphereLight(0xa58bc0,0x3a2216,.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffd9a8,.85);key.position.set(-6,15,9);key.castShadow=true;key.shadow.mapSize.set(LOWEND?512:1024,LOWEND?512:1024);
Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:45});key.shadow.bias=-.0006;scene.add(key);
const rim=new THREE.DirectionalLight(0x9a8cff,.55);rim.position.set(6,6,-10);scene.add(rim);

const GEO={
  sph:new THREE.SphereGeometry(1,22,16),
  half:new THREE.SphereGeometry(1,22,10,0,Math.PI*2,0,Math.PI/2),
  cyl:new THREE.CylinderGeometry(1,1,1,16),
  cone:new THREE.ConeGeometry(1,1,16),
  box:new THREE.BoxGeometry(1,1,1),
  dodec:new THREE.DodecahedronGeometry(1,0),
  torus:new THREE.TorusGeometry(1,.12,8,32),
  bow:new THREE.TorusGeometry(.42,.035,6,18,Math.PI),
  club:new THREE.CylinderGeometry(.22,.08,1.2,10),
  ring:new THREE.RingGeometry(.78,1,48)
};
const OUTLINE=new THREE.MeshBasicMaterial({color:0x160d14,side:THREE.BackSide});
function P(parent,geo,mat,pos,scl,rot,outline=.05){
  const m=new THREE.Mesh(geo,mat);m.position.set(pos[0],pos[1],pos[2]);m.scale.set(scl[0],scl[1],scl[2]);
  if(rot)m.rotation.set(rot[0],rot[1],rot[2]);m.castShadow=true;parent.add(m);
  if(outline){const o=new THREE.Mesh(geo,OUTLINE);o.scale.set(1+outline/scl[0],1+outline/scl[1],1+outline/scl[2]);m.add(o);}
  return m;
}

/* ---------- temas das salas ---------- */
const THEMES={
  goblin:{bg:0x1b120f,fog:[16,38],torch:0xff9440,flame:0xffd27a,hemi:[0xa58bc0,0x3a2216,.6],key:[0xffd9a8,.85],tile:0xd8c9c0,wall:0xc9b8b0,banner:0xa8322b},
  cripta:{bg:0x0b1316,fog:[14,34],torch:0x4fe0c6,flame:0xc8fff2,hemi:[0x7fa6c2,0x14232a,.55],key:[0xbfe6ff,.7],tile:0xb7c4c8,wall:0xa9b6bc,banner:0x2c6b78},
  lodo:{bg:0x0c140d,fog:[14,34],torch:0x9cff5a,flame:0xe6ffc2,hemi:[0x8fb38a,0x1d2410,.55],key:[0xffe0b0,.75],tile:0xb9c2a8,wall:0xa5ae98,banner:0x3d7a2e},
  forja:{bg:0x1a0906,fog:[14,34],torch:0xff5a1a,flame:0xffc070,hemi:[0xc08a7a,0x3a1408,.6],key:[0xffb08a,.8],tile:0xc4a49a,wall:0xb0948a,banner:0x8a1f10},
  arena:{bg:0x14101c,fog:[18,40],torch:0xffb040,flame:0xffe2a0,hemi:[0xb0a0d0,0x3a2a16,.65],key:[0xffe6c0,.95],tile:0xe8d6b4,wall:0xcab8a0,banner:0x2b4fa8}
};
const envMats={
  tile:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}),
  wall:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
  wood:new THREE.MeshStandardMaterial({color:0x6b4426,roughness:.9}),
  metal:new THREE.MeshStandardMaterial({color:0x7d838d,roughness:.45,metalness:.6}),
  dark:new THREE.MeshBasicMaterial({color:0x050307}),
  bone:new THREE.MeshStandardMaterial({color:0xd9d2bd,roughness:.8}),
  gold:new THREE.MeshStandardMaterial({color:0xd6a23a,roughness:.35,metalness:.8}),
  stone:new THREE.MeshStandardMaterial({color:0x4a4252,roughness:.95}),
  banner:new THREE.MeshStandardMaterial({color:0xa8322b,roughness:.9,side:THREE.DoubleSide})
};
const flames=[],torchLights=[];let propGroup=null,throneLight=null,dust=null,pools=[],fixedFlames=0;
function sbox(parent,w,h,d,mat,x,y,z,ry=0){const m=new THREE.Mesh(GEO.box,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function scyl(parent,r,h,mat,x,y,z){const m=new THREE.Mesh(GEO.cyl,mat);m.scale.set(r,h,r);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function makeFlame(parent,x,y,z,size=1,light=false){
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
  const outer=new THREE.Mesh(GEO.cone,new THREE.MeshBasicMaterial({color:0xff9440,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));outer.scale.set(.16*size,.5*size,.16*size);outer.position.y=.2*size;g.add(outer);
  const inner=new THREE.Mesh(GEO.cone,new THREE.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));inner.scale.set(.08*size,.3*size,.08*size);inner.position.y=.13*size;g.add(inner);
  const glow=glowSprite(0xff9440,1.8*size,.7);glow.position.y=.25*size;g.add(glow);
  const f={g,outer,inner,glow,size,phase:Math.random()*10};
  if(light){const L=new THREE.PointLight(0xff9440,1.4,13,1.6);L.position.set(0,.3,.5);g.add(L);f.light=L;torchLights.push(L);}
  flames.push(f);return f;
}
function buildEnv(){
  const env=new THREE.Group();scene.add(env);
  const W=24,D=18,m4=new THREE.Matrix4(),col=new THREE.Color();
  const floor=new THREE.InstancedMesh(new THREE.BoxGeometry(.97,.4,.97),envMats.tile,W*D);let n=0;
  for(let x=0;x<W;x++)for(let z=0;z<D;z++){
    m4.makeTranslation(x-W/2+.5,-.2+rand(-.025,.025),z-D/2+.5);floor.setMatrixAt(n,m4);
    col.setHSL(.74+rand(-.03,.03),.1,.2+rand(-.045,.045)*(Math.random()<.1?2:1));floor.setColorAt(n,col);n++;
  }
  floor.receiveShadow=true;env.add(floor);
  const blocks=[];
  for(let row=0;row<10;row++)for(let i=-11;i<=11;i++){const x=i*1.2+(row%2?.6:0);const y=row*.62+.31;if(Math.abs(x)<2.1&&y<4.1)continue;blocks.push([x,y,-8.6,1.18,.6,1]);}
  for(const sx of[-1,1])for(let row=0;row<9;row++)for(let i=0;i<12;i++){const z=-8+i*1.2+(row%2?.6:0);blocks.push([12.3*sx,row*.62+.31,z,1,.6,1.18]);}
  const wall=new THREE.InstancedMesh(GEO.box,envMats.wall,blocks.length);
  blocks.forEach((b,i)=>{m4.compose(V(b[0],b[1],b[2]+rand(-.04,.04)),new THREE.Quaternion(),V(b[3],b[4],b[5]));wall.setMatrixAt(i,m4);col.setHSL(.75+rand(-.03,.03),.1,.16+rand(-.04,.04));wall.setColorAt(i,col);});
  wall.receiveShadow=true;env.add(wall);
  sbox(env,4.2,4.2,.4,envMats.dark,0,2.1,-9.1);
  for(const sx of[-1,1])sbox(env,.6,4.4,1.2,envMats.stone,2.2*sx,2.2,-8.5);
  sbox(env,5,.7,1.2,envMats.stone,0,4.45,-8.5);
  for(let i=-3;i<=3;i++)scyl(env,.05,4,envMats.metal,i*.55,2,-8.7);
  for(let j=0;j<3;j++)sbox(env,3.8,.08,.08,envMats.metal,0,1+j*1.2,-8.7);
  for(const [x,z] of[[-7,-7.4],[7,-7.4],[-11,-2],[11,-2]]){scyl(env,.55,6.4,envMats.stone,x,3.2,z);sbox(env,1.4,.4,1.4,envMats.stone,x,.2,z);sbox(env,1.4,.4,1.4,envMats.stone,x,6.3,z);}
  for(const x of[-3.6,3.6,-9.6,9.6]){sbox(env,.12,.5,.4,envMats.metal,x,2.6,-7.95);const cup=new THREE.Mesh(GEO.cone,envMats.metal);cup.scale.set(.22,.35,.22);cup.rotation.x=Math.PI;cup.position.set(x,2.95,-7.75);env.add(cup);makeFlame(env,x,3.05,-7.75,1.1,true);}
  fixedFlames=flames.length;
  const bs=new THREE.Shape();bs.moveTo(-.6,1.3);bs.lineTo(.6,1.3);bs.lineTo(.6,-1);bs.lineTo(0,-1.45);bs.lineTo(-.6,-1);bs.lineTo(-.6,1.3);
  const bGeo=new THREE.ShapeGeometry(bs);
  for(const x of[-5.4,5.4]){const b=new THREE.Mesh(bGeo,envMats.banner);b.position.set(x,3.4,-8.05);env.add(b);scyl(env,.04,1.5,envMats.metal,x,4.72,-8.05).rotation.z=Math.PI/2;const e=new THREE.Mesh(new THREE.CircleGeometry(.3,24),envMats.gold);e.position.set(x,3.6,-8.03);env.add(e);}
  throneLight=new THREE.PointLight(0xff3b2b,0,12,1.6);throneLight.position.set(0,3,-6);scene.add(throneLight);
  const N=LOWEND?90:180,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=rand(-11,11);pos[i*3+1]=rand(0,6);pos[i*3+2]=rand(-8,6);}
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0xffd9a0,size:.07,map:glowTex,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust);
}
function barrel(g,x,z,lying){const b=new THREE.Group();b.position.set(x,0,z);g.add(b);scyl(b,.45,1,envMats.wood,0,.5,0);for(const y of[.2,.8])scyl(b,.47,.07,envMats.metal,0,y,0);if(lying){b.rotation.z=Math.PI/2;b.position.y=.45;b.rotation.y=rand(0,3);}}
function bones(g,x,z){for(let i=0;i<5;i++){const b=scyl(g,.05,.6,envMats.bone,x+rand(-.5,.5),.06,z+rand(-.5,.5));b.rotation.set(Math.PI/2,0,rand(0,3));}const s=new THREE.Mesh(GEO.sph,envMats.bone);s.scale.set(.22,.2,.22);s.position.set(x,.2,z);s.castShadow=true;g.add(s);}
function pool(g,x,z,r,color,glow){const m=new THREE.Mesh(new THREE.CircleGeometry(r,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.02,z);g.add(m);pools.push({x,z,r,color:glow});}
function brazier(g,x,z,s=1.6){scyl(g,.3,1,envMats.stone,x,.5,z);scyl(g,.5,.25,envMats.metal,x,1.1,z);makeFlame(g,x,1.2,z,s);}
function buildProps(themeKey,boss){
  if(propGroup){scene.remove(propGroup);flames.splice(fixedFlames);}
  pools=[];propGroup=new THREE.Group();scene.add(propGroup);const g=propGroup;
  if(themeKey==='goblin'){
    barrel(g,-8.6,-6.2);barrel(g,-9.6,-5.1);barrel(g,-8,-4.6,true);barrel(g,8.9,-6);
    sbox(g,1,1,1,envMats.wood,9.7,.5,-4.3,.3);sbox(g,.8,.8,.8,envMats.wood,9.7,1.4,-4.3,.6);sbox(g,.9,.9,.9,envMats.wood,-10.2,.45,-2.4,.2);
    const hay=new THREE.Mesh(GEO.sph,new THREE.MeshStandardMaterial({color:0xc9a24a,roughness:1}));hay.scale.set(1.3,.45,1);hay.position.set(9.6,.15,1.8);hay.receiveShadow=true;g.add(hay);
    for(let k=0;k<3;k++){const l=scyl(g,.1,1.1,envMats.wood,-9.6,.1,1.6);l.rotation.set(Math.PI/2,0,k*1.05);}
    makeFlame(g,-9.6,.15,1.6,1.4);bones(g,8.4,-2.6);
  }else if(themeKey==='cripta'){
    for(const [x,z,r] of[[-9.2,-5.6,.4],[9.3,-5.2,-.5],[-10,1.6,1.4]]){sbox(g,1,.55,2.2,envMats.wood,x,.28,z,r);sbox(g,1.15,.12,2.35,envMats.stone,x,.62,z,r);}
    for(const [x,z] of[[-7.4,-6.8],[7.4,-7],[-10,-1],[10,1.2]])for(let k=0;k<3;k++){const h=rand(.25,.6),cx=x+rand(-.35,.35),cz=z+rand(-.35,.35);scyl(g,.07,h,envMats.bone,cx,h/2,cz);makeFlame(g,cx,h,cz,.35);}
    bones(g,-8.6,-3);bones(g,8.6,-2.6);bones(g,9.4,3);
    for(const x of[-5.8,5.8])sbox(g,.9,1.2,.3,envMats.stone,x,.6,-7.6);
  }else if(themeKey==='lodo'){
    for(const [x,z,r] of[[-8.5,-4,1.4],[8.8,-3,1.2],[-9.4,2.6,1.6],[9.2,2.4,1.3],[-6.4,-6.6,1],[6.2,-6.4,.9]])pool(g,x,z,r,0x5ee05a,'#7dff6a');
    for(const sx of[-1,1])brazier(g,7.2*sx,-5.6);
    bones(g,-8.8,-1);bones(g,9,-.6);
  }else if(themeKey==='forja'){
    for(const [x,z,r] of[[-8.8,-3.6,1.5],[9,-2.8,1.3],[-9.2,3,1.2],[8.6,3.2,1.4]])pool(g,x,z,r,0xff5a1a,'#ffb347');
    for(const [x,z] of[[-6.6,-6.4],[6.8,-6.2]]){sbox(g,.9,.6,.5,envMats.stone,x,.3,z);sbox(g,1.4,.3,.6,envMats.metal,x,.75,z);sbox(g,.4,.2,.4,envMats.metal,x+.6,.75,z);}
    for(const sx of[-1,1]){for(let k=0;k<6;k++){const l=new THREE.Mesh(GEO.torus,envMats.metal);l.scale.setScalar(.14);l.rotation.y=k%2?Math.PI/2:0;l.position.set(4.6*sx,5.6-k*.3,-8.1);g.add(l);}}
    for(const sx of[-1,1])brazier(g,10*sx,-.5,1.9);
  }else if(themeKey==='arena'){
    for(const sx of[-1,1]){brazier(g,9.6*sx,-5.2,1.9);brazier(g,9.6*sx,2.6,1.6);
      for(let k=0;k<3;k++){const s=scyl(g,.38,.08,envMats.metal,11.6*sx,2.6,-4+k*2.4);s.rotation.z=Math.PI/2;const b=new THREE.Mesh(GEO.sph,envMats.gold);b.scale.setScalar(.12);b.position.set(11.5*sx,2.6,-4+k*2.4);g.add(b);}
      sbox(g,.15,1.6,1.6,envMats.wood,10.6*sx,.8,-1.2);for(let k=0;k<3;k++)scyl(g,.035,1.8,envMats.metal,10.45*sx,.9,-1.7+k*.5);}
    const ring=new THREE.Mesh(new THREE.RingGeometry(5.4,5.7,64),new THREE.MeshBasicMaterial({color:0xffc93c,transparent:true,opacity:.18,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;g.add(ring);
  }
  if(boss){
    sbox(g,5.2,.3,2.2,envMats.stone,0,.15,-7.2);sbox(g,4,.3,1.8,envMats.stone,0,.45,-7.4);
    const tm=new THREE.MeshStandardMaterial({color:new THREE.Color(THEMES[themeKey].banner).multiplyScalar(.5),roughness:.9});
    sbox(g,2.4,.9,1.4,tm,0,1.05,-7.5);sbox(g,2.6,3.6,.5,tm,0,2.4,-8.1);sbox(g,2.8,.2,.6,envMats.gold,0,4.25,-8.1);
    for(let k=-2;k<=2;k++){const c=new THREE.Mesh(GEO.cone,envMats.gold);c.scale.set(.14,.6,.14);c.position.set(k*.6,4.65,-8.1);g.add(c);}
    for(const sx of[-1,1]){const s=new THREE.Mesh(GEO.sph,envMats.bone);s.scale.set(.28,.26,.28);s.position.set(1.4*sx,1.6,-7.4);g.add(s);}
  }
}
let theme=THEMES.goblin;
function applyTheme(k,boss){
  theme=THEMES[k];
  scene.background.setHex(theme.bg);scene.fog.color.setHex(theme.bg);scene.fog.near=theme.fog[0];scene.fog.far=theme.fog[1];
  hemi.color.setHex(theme.hemi[0]);hemi.groundColor.setHex(theme.hemi[1]);hemi.intensity=theme.hemi[2];
  key.color.setHex(theme.key[0]);key.intensity=theme.key[1];
  envMats.tile.color.setHex(theme.tile);envMats.wall.color.setHex(theme.wall);envMats.banner.color.setHex(theme.banner);
  dust.material.color.setHex(theme.flame);
  for(const f of flames){f.outer.material.color.setHex(theme.torch);f.inner.material.color.setHex(theme.flame);f.glow.material.color.setHex(theme.torch);if(f.light)f.light.color.setHex(theme.torch);}
  throneLight.color.setHex(theme.torch);throneLight.intensity=boss?1.6:0;
}
function setStage(k,boss){buildProps(k,boss);applyTheme(k,boss);}

/* ---------- partículas ---------- */
const parts=[],ppool=[];
function spawnPart(pos,o){
  if(parts.length>(LOWEND?260:520))return;
  let s=ppool.pop();
  if(!s){s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));scene.add(s);}
  s.visible=true;s.material.color.set(o.color);s.material.opacity=1;s.position.copy(pos);
  s.userData={v:o.v?o.v.clone():V(),life:o.life||.5,age:0,size:o.size||.3,grav:o.grav||0};s.scale.setScalar(s.userData.size);parts.push(s);
}
function burst(pos,color,n=14,speed=3,size=.3,life=.5,grav=0,up=.3){for(let i=0;i<n;i++){const v=V(rand(-1,1),rand(-up,1),rand(-1,1)).normalize().multiplyScalar(speed*rand(.35,1));spawnPart(pos,{color,size:size*rand(.6,1.3),life:life*rand(.7,1.25),v,grav});}}
function updateParts(dt){for(let i=parts.length-1;i>=0;i--){const s=parts[i],d=s.userData;d.age+=dt;if(d.age>=d.life){s.visible=false;parts.splice(i,1);ppool.push(s);continue;}d.v.y+=d.grav*dt;d.v.multiplyScalar(Math.max(0,1-1.6*dt));s.position.addScaledVector(d.v,dt);const k=d.age/d.life;s.material.opacity=1-k*k;s.scale.setScalar(d.size*(1-k*.5));}}
function shockwave(pos,color,R,ms){const m=new THREE.Mesh(GEO.ring,new THREE.MeshBasicMaterial({color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(pos.x,.06,pos.z);scene.add(m);return tween(ms,k=>{m.scale.setScalar(.3+R*k);m.material.opacity=1-k;}).then(()=>{scene.remove(m);m.material.dispose();});}
function dustBurst(p){burst(V(p.x,.25,p.z),'#a89a8a',12,2.4,.5,.6,-.5,.1);}
function orb(color,size){const g=new THREE.Group();g.add(glowSprite(color,size*2.6),glowSprite(0xffffff,size*.9));return g;}
function disposeOrb(o){scene.remove(o);o.children.forEach(c=>c.material.dispose());}
async function projectile(from,to,{color='#ff8a3a',size=.35,arc=.8,ms=420,trail=1}={}){
  const o=orb(color,size);o.position.copy(from);scene.add(o);const p=V();
  await tween(ms,k=>{p.lerpVectors(from,to,k);p.y+=Math.sin(k*Math.PI)*arc;o.position.copy(p);for(let i=0;i<trail;i++)spawnPart(p,{color,size:size*rand(.5,1.1),life:.35,v:rv(.5)});},E.lin);
  disposeOrb(o);burst(to,color,16,3.2,size*.9,.45);
}
async function arrow(from,to,{arc=.7,ms=320,color=0x8a5a2b}={}){
  const g=new THREE.Group();const s=new THREE.Mesh(GEO.box,new THREE.MeshBasicMaterial({color}));s.scale.set(.04,.04,.7);g.add(s);
  const tip=new THREE.Mesh(GEO.cone,new THREE.MeshBasicMaterial({color:0xd0d6de}));tip.scale.set(.06,.16,.06);tip.rotation.x=Math.PI/2;tip.position.z=.4;g.add(tip);scene.add(g);
  const p=V(),q=V();
  await tween(ms,k=>{p.lerpVectors(from,to,k);p.y+=Math.sin(k*Math.PI)*arc;const k2=Math.min(1,k+.05);q.lerpVectors(from,to,k2);q.y+=Math.sin(k2*Math.PI)*arc;g.position.copy(p);g.lookAt(q);},E.lin);
  scene.remove(g);burst(to,'#ffe0a0',8,2,.2,.3);
}
