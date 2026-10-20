/* ================= início ================= */
if(/turbo/.test(location.search)){G.speed=8;G.auto=true;}
/* ?shot=chave renderiza um retrato grande e transparente do modelo (usado para gerar o ícone do app) */
const shotKey=(location.search.match(/shot=(\w+)/)||[])[1];
if(shotKey==='lineup'){
  const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1600,560);r.setPixelRatio(1);r.setClearColor(0x2e2140);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x553344,.8));const l=new THREE.DirectionalLight(0xffffff,.7);l.position.set(2,4,5);sc.add(l);const rl=new THREE.DirectionalLight(0x9a8cff,.55);rl.position.set(-3,3,-5);sc.add(rl);
  HERO_KEYS.forEach((k,i)=>{const m=MODELS[DEFS[k].model]();m.root.position.x=(i-3.5)*1.55;m.root.rotation.y=i%2?.5:-.5;sc.add(m.root);});
  const cam=new THREE.PerspectiveCamera(24,1600/560,.1,80);cam.position.set(0,2.4,15);cam.lookAt(0,1.2,0);r.render(sc,cam);
  document.body.innerHTML=`<img id="shot" src="${r.domElement.toDataURL()}">`;return;
}
if(shotKey&&DEFS[shotKey]){
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(1024,1024);r.setPixelRatio(1);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x553344,.95));const l=new THREE.DirectionalLight(0xffffff,.75);l.position.set(2,3,4);sc.add(l);
  const cam=new THREE.PerspectiveCamera(26,1,.1,50);const m=MODELS[DEFS[shotKey].model]();m.root.rotation.y=.3;sc.add(m.root);
  cam.position.set(.4,1.72,4.1);cam.lookAt(0,1.66,0);r.render(sc,cam);
  document.body.innerHTML=`<img id="shot" src="${r.domElement.toDataURL()}" width="1024" height="1024">`;document.body.style.background='transparent';
  return;
}
try{muted=localStorage.getItem('masmorra-mute')==='1';}catch(e){}
syncTools();
buildEnv();setStage('goblin',false);
window.addEventListener('resize',()=>{fitCamera();if(G.state==='battle')buildOrder();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)last=performance.now();});
fitCamera();
camPos.copy(camBase).add(V(0,2,4));
requestAnimationFrame(t=>{last=t;frame(t);});
showHub();
document.addEventListener('pointerdown',()=>audio(),{once:true});
(async()=>{
  if(!await Net.init()){if(G.state==='menu'&&screenEl.querySelector('.hub'))showHub();return;}
  const remote=await Net.pullSave();
  if(remote&&(remote.updated||0)>(SAVE.updated||0)){SAVE=remote;try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}}
  else if(SAVE.updated)Net.pushSave(SAVE);
  hubLog=await Net.collectDefenses();
  Net.publishProfile();
  if(G.state==='menu'&&screenEl.querySelector('.hub'))showHub();
})();
