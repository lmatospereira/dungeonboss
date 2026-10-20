/* ================= vitrine 3D do herói (seleção e tela de heróis) ================= */
const silhouetteMat=new THREE.MeshBasicMaterial({color:0x0c0812});
const Preview={
  r:null,scene:null,cam:null,model:null,key:null,host:null,yaw:-.5,auto:true,drag:null,t:0,pop:1,w:0,h:0,
  init(){
    if(this.r)return true;
    try{this.r=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){return false;}
    this.r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.r.setClearColor(0x000000,0);
    const s=this.scene=new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xffffff,0x553344,.75));
    const k=new THREE.DirectionalLight(0xfff0dd,.8);k.position.set(2,4,4);s.add(k);
    const rl=new THREE.DirectionalLight(0x9a8cff,.8);rl.position.set(-3,3,-4);s.add(rl);
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(1,1.1,.24,40),new THREE.MeshToonMaterial({color:0x3a2a4a,gradientMap:gradTex}));ped.position.y=-.12;s.add(ped);
    const pedTop=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.02,40),new THREE.MeshToonMaterial({color:0x4a3760,gradientMap:gradTex}));pedTop.position.y=.005;s.add(pedTop);
    this.ringMat=new THREE.MeshBasicMaterial({color:0xffc93c,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(.92,1.04,56),this.ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.02;s.add(ring);
    this.glow=glowSprite(0xffc93c,3.4,.28);this.glow.position.y=1.3;s.add(this.glow);
    this.cam=new THREE.PerspectiveCamera(30,1,.1,50);
    const el=this.r.domElement;
    el.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,yaw:this.yaw};this.auto=false;try{el.setPointerCapture(e.pointerId);}catch(err){}});
    el.addEventListener('pointermove',e=>{if(this.drag)this.yaw=this.drag.yaw+(e.clientX-this.drag.x)*.013;});
    const end=()=>{this.drag=null;clearTimeout(this._t);this._t=setTimeout(()=>{this.auto=true;},2500);};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
    return true;
  },
  mount(host,key,locked){
    this.host=host;
    if(!this.init()){host.insertAdjacentHTML('beforeend',`<img src="${portrait(key)}" alt="" style="position:absolute;inset:0;margin:auto;width:60%;height:auto">`);return;}
    host.appendChild(this.r.domElement);this.w=this.h=0;
    if(this.key!==key||this.locked!==locked)this.set(key,locked);
  },
  set(key,locked){
    if(this.model)this.scene.remove(this.model.root);
    const m=MODELS[DEFS[key].model]();
    if(locked)m.root.traverse(o=>{if(o.isSprite)o.visible=false;else if(o.material&&o.material!==OUTLINE)o.material=silhouetteMat;});
    this.model=m;this.key=key;this.locked=locked;this.scene.add(m.root);this.pop=0;
    const c=locked?0x6a5a7a:ELEM[DEFS[key].el].c;this.ringMat.color.set(c);this.glow.material.color.set(c);
  },
  fit(){
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return false;
    if(w!==this.w||h!==this.h){
      this.w=w;this.h=h;this.r.setSize(w,h,false);this.cam.aspect=w/h;
      const hf=Math.tan(THREE.MathUtils.degToRad(15));
      const dist=Math.max(1.75/hf,1.45/(hf*this.cam.aspect));
      this.cam.position.set(0,1.75,dist);this.cam.lookAt(0,1.25,0);this.cam.updateProjectionMatrix();
    }
    return true;
  },
  tick(dt){
    if(!this.r||!this.host||!this.host.isConnected||!this.model||screenEl.hidden)return;
    if(!this.fit())return;
    this.t+=dt;if(this.auto)this.yaw+=dt*.55;
    const m=this.model,b=Math.sin(this.t*3.2);
    m.root.rotation.y=this.yaw;
    this.pop=Math.min(1,this.pop+dt*3.2);const p=E.out(this.pop);
    m.root.scale.setScalar(.6+.4*p);m.root.position.y=(1-p)*.6;
    m.body.position.y=b*.03;m.body.scale.set(1-b*.012,1+b*.025,1-b*.012);
    m.armL.rotation.z=-.15-b*.05;m.armR.rotation.z=.15+b*.05;
    if(m.cape)m.cape.rotation.x=.14+Math.sin(this.t*2.6)*.05;
    if(m.familiar){m.familiar.position.y=1.6+Math.sin(this.t*2)*.12;m.familiar.rotation.y=this.t;}
    this.r.render(this.scene,this.cam);
  }
};

/* ---------- triângulo de elementos ---------- */
function elemTriangle(){
  const n=(el,x,y,side)=>`<g><circle cx="${x}" cy="${y}" r="15" fill="${ELEM[el].c}" stroke="#120b18" stroke-width="3"/><use href="#${ELEM[el].i}" x="${x-8}" y="${y-8}" width="16" height="16" fill="#fff"/>${side?`<text x="${x-20}" y="${y+4}" text-anchor="end">${ELEM[el].n}</text>`:`<text x="${x}" y="${y+28}" text-anchor="middle">${ELEM[el].n}</text>`}</g>`;
  const arrow=(x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;return `<line x1="${x1+ux*20}" y1="${y1+uy*20}" x2="${x2-ux*24}" y2="${y2-uy*24}" stroke="#6fe38c" stroke-width="2.5" marker-end="url(#ah)"/>`;};
  return `<svg class="tri" viewBox="0 0 240 132" role="img" aria-label="Triângulo de elementos: Fogo vence Natureza, Natureza vence Água, Água vence Fogo. Luz e Sombra vencem uma à outra.">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6fe38c"/></marker></defs>
    ${arrow(62,22,104,92)}${arrow(104,92,20,92)}${arrow(20,92,62,22)}
    <line x1="212" y1="42" x2="212" y2="76" stroke="#6fe38c" stroke-width="2.5" marker-end="url(#ah)" marker-start="url(#ah)"/>
    ${n('fogo',62,22)}${n('natureza',104,92)}${n('agua',20,92)}${n('luz',212,22,1)}${n('sombra',212,96,1)}
  </svg>`;
}
