/* ================= unidades e combate ================= */
const tagsEl=$('#tags'),fxEl=$('#fx');
const proxyMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
const blobMat=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,4,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.7,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false});})();
const blobGeo=new THREE.PlaneGeometry(1,1);
const G={state:'menu',mode:null,dungeon:null,opp:null,rooms:[],room:0,cleared:0,heroes:[],enemies:[],auto:false,speed:1,current:null,sel:null,valid:[],pending:null,loopId:0,clock:0,stats:{dmg:0,turns:0,crits:0},shake:0,deaths:[],layout:'land'};
try{G.auto=localStorage.getItem('masmorra-auto')==='1';G.speed=localStorage.getItem('masmorra-speed')==='2'?2:1;}catch(e){}

const ST={taunt:{i:'i-taunt',n:'Provocando'},shield:{i:'i-shield',n:'Escudo'},burn:{i:'i-fire',n:'Queimando'},poison:{i:'i-drop',n:'Envenenado'},stun:{i:'i-spark',n:'Atordoado'},enrage:{i:'i-rage',n:'Fúria'},charge:{i:'i-warn',n:'Preparando'}};
const hasStatus=(u,t)=>u.status.some(s=>s.type===t);
const shieldOf=u=>{const s=u.status.find(x=>x.type==='shield');return s?s.value:0;};
function statusHtml(u){return u.status.map(s=>`<span class="si s-${s.type}" title="${ST[s.type].n}"><svg><use href="#${ST[s.type].i}"/></svg>${s.turns<50&&s.type!=='charge'?`<b>${s.turns}</b>`:''}</span>`).join('');}

class Unit{
  constructor(key,side,lvl=1,evo=1){
    const d=DEFS[key];this.key=key;this.def=d;this.side=side;this.el=d.el;this.lvl=lvl;
    const isHero=HERO_KEYS.includes(key);this.evo=isHero?clamp(evo,1,MAX_EVO):1;
    const st=isHero?heroStats(key,lvl,this.evo):{hp:Math.round(d.hp*lm(lvl)),atk:d.atk*lm(lvl),spd:d.spd,crit:d.crit??.1,dr:d.dr||0};
    this.maxHp=st.hp;this.hp=this.maxHp;this.baseAtk=st.atk;this.spd=st.spd;this.crit=st.crit;this.dr=st.dr;
    this.abilities=isHero?heroAbilities(key,this.evo):d.abilities.slice();
    this.status=[];this.resetCds();
    Object.assign(this,MODELS[d.model]());
    if(this.evo>=3)addWeaponGlow(this,WEAPONS[key].color);
    this.scale=d.scale||1;this.root.scale.setScalar(this.scale);
    this.h=(d.height+.1)*this.scale;this.radius=d.radius*this.scale;
    const blob=new THREE.Mesh(blobGeo,blobMat);blob.rotation.x=-Math.PI/2;blob.position.y=.025;blob.scale.setScalar(d.radius*2.6);this.root.add(blob);
    const px=new THREE.Mesh(GEO.cyl,proxyMat);px.scale.set(d.radius*1.4,d.height,d.radius*1.4);px.position.y=d.height/2;px.userData.unit=this;this.root.add(px);this.proxy=px;
    this.bubble=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color:0x7cc7ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false}));this.bubble.scale.set(d.radius*2.1,d.height*.62,d.radius*2.1);this.bubble.position.y=d.height*.5;this.bubble.visible=false;this.root.add(this.bubble);
    this.ringMat=new THREE.MeshBasicMaterial({color:0xffc93c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.ring=new THREE.Mesh(GEO.ring,this.ringMat);this.ring.rotation.x=-Math.PI/2;this.ring.scale.setScalar(this.radius*1.7);scene.add(this.ring);
    this.phase=Math.random()*6;this.alive=true;this.timer=0;this.home=V();this.homeYaw=0;
    scene.add(this.root);this.makeTag();
  }
  get atk(){return this.baseAtk*(hasStatus(this,'enrage')?1.3:1);}
  resetCds(){this.cds={};for(const id of this.abilities){const a=AB[id];this.cds[id]=a.cd?(a.start??Math.ceil(a.cd/2)):0;}}
  makeTag(){
    const t=document.createElement('div');t.className='tag '+this.side+(this.def.boss?' boss':'');
    t.innerHTML=`<span class="tadv"></span><div class="tst"></div><div class="trow">${this.side==='enemy'?gemSvg(this.el):''}<span class="tl">${this.lvl}</span><div class="tbar"><i class="tsh"></i><i class="thp"></i></div></div>`;
    t.style.display='none';tagsEl.appendChild(t);this.tag=t;this.tagHp=t.querySelector('.thp');this.tagSh=t.querySelector('.tsh');this.tagSt=t.querySelector('.tst');this.tagAdv=t.querySelector('.tadv');
    this.refresh();
  }
  refresh(){
    const sh=shieldOf(this);
    this.tagHp.style.width=this.hp/this.maxHp*100+'%';this.tagSh.style.width=Math.min(100,sh/this.maxHp*100)+'%';
    this.tagSt.innerHTML=statusHtml(this);this.bubble.visible=this.alive&&sh>0;
  }
  destroy(){scene.remove(this.root);scene.remove(this.ring);this.tag.remove();this.ringMat.dispose();}
  center(){return V(this.root.position.x,this.h*.55,this.root.position.z);}
  top(){return V(this.root.position.x,this.root.position.y+this.h+.2,this.root.position.z);}
}
const allUnits=()=>[...G.heroes,...G.enemies];
const aliveHeroes=()=>G.heroes.filter(u=>u.alive);
const aliveEnemies=()=>G.enemies.filter(u=>u.alive);
const foesOf=u=>u.side==='hero'?aliveEnemies():aliveHeroes();
const friendsOf=u=>u.side==='hero'?aliveHeroes():aliveEnemies();
const ratio=u=>u.hp/u.maxHp;

function addStatus(t,type,turns,value=0){
  if(!t.alive)return;
  let s=t.status.find(x=>x.type===type);
  if(s){s.turns=Math.max(s.turns,turns);s.value=type==='shield'?s.value+value:Math.max(s.value,value);s.fresh=(t===G.current);}
  else t.status.push({type,turns,value,fresh:t===G.current});
  t.refresh();refreshUI();
}
function removeStatus(t,type){t.status=t.status.filter(s=>s.type!==type);t.refresh();}
function stun(t){if(t.def.stunImmune){floatText(t,'Imune','res');return;}addStatus(t,'stun',1);floatText(t,'Atordoado!','lab');}

/* ---------- textos flutuantes e etiquetas ---------- */
const floaters=[];
function floatText(u,text,cls){
  const el=document.createElement('div');el.className='ft '+cls;el.textContent=text;fxEl.appendChild(el);
  const n=floaters.filter(f=>f.u===u&&f.age<.45).length;
  floaters.push({el,u,base:u.top(),off:n*24,age:0,life:cls.startsWith('callout')?1.3:1.1,x:cls.startsWith('callout')?0:rand(-12,12)});
}
const _p=V();
function toScreen(v){_p.copy(v).project(camera);return{x:(_p.x+1)/2*app.clientWidth,y:(1-_p.y)/2*app.clientHeight};}
function updateOverlay(dt){
  for(let i=floaters.length-1;i>=0;i--){
    const f=floaters[i];f.age+=dt;
    if(f.age>=f.life){f.el.remove();floaters.splice(i,1);continue;}
    const s=toScreen(f.base),k=f.age/f.life;
    const pop=f.age<.12?.6+f.age/.12*.55:Math.max(1,1.15-(f.age-.12)*1.5);
    f.el.style.transform=`translate(${s.x+f.x}px,${s.y-f.off-f.age*46}px) translate(-50%,-100%) scale(${pop})`;
    f.el.style.opacity=k>.65?1-(k-.65)/.35:1;
  }
  const show=G.state==='battle'||G.state==='transition';
  for(const u of allUnits()){
    if(!u.alive||!show||!u.root.visible){u.tag.style.display='none';continue;}
    u.tag.style.display='';const s=toScreen(u.top());
    u.tag.style.transform=`translate(${s.x-33}px,${s.y-20}px)`;
  }
}

/* ---------- golpes ---------- */
function shake(a){if(!reduceMotion)G.shake=Math.max(G.shake,a);}
function flash(u){tween(220,k=>{const v=(1-k)*.9;for(const m of u.mats)m.emissive.setRGB(v,v,v*.9);});}
function knock(t){tween(260,(k,raw)=>{const s=Math.sin(raw*Math.PI);t.body.position.z=-.28*s;t.body.rotation.x=-.3*s;},E.lin);}
function hit(u,t,mult,o={}){
  if(!t.alive)return 0;
  let dmg=u.atk*mult*rand(.92,1.08);
  const em=elemMult(u.el,t.el);dmg*=em;
  const crit=Math.random()<(o.crit??u.crit);if(crit)dmg*=1.6;
  dmg*=1-(t.dr||0);if(o.bonus)dmg*=o.bonus;
  dmg=Math.max(1,Math.round(dmg));
  const sh=t.status.find(s=>s.type==='shield');let absorbed=0;
  if(sh&&!o.pierce){absorbed=Math.min(sh.value,dmg);sh.value-=absorbed;dmg-=absorbed;if(sh.value<=0)removeStatus(t,'shield');}
  t.hp=Math.max(0,t.hp-dmg);
  if(dmg>0)floatText(t,String(dmg),crit?'crit':'dmg');
  if(absorbed>0)floatText(t,`${absorbed} bloqueado`,'shieldt');
  if(crit){floatText(t,'CRÍTICO!','lab');if(u.side==='hero')G.stats.crits++;}
  if(em>1)floatText(t,'EFETIVO!','eff');else if(em<1)floatText(t,'Resistido','res');
  flash(t);knock(t);(crit?sfx.crit:sfx.hit)();
  if(o.heavy||crit)shake(crit?.3:.22);
  burst(t.center(),crit?'#ffd75e':'#ffffff',crit?16:9,3,.25,.35);
  if(u.side==='hero')G.stats.dmg+=dmg;
  t.refresh();
  if(t.hp<=0)kill(t);
  refreshUI();return dmg;
}
function healUnit(t,amt){if(!t.alive)return;const before=t.hp;t.hp=Math.min(t.maxHp,t.hp+Math.round(amt));floatText(t,'+'+(t.hp-before),'heal');t.refresh();refreshUI();}
function healFx(u){const p=u.root.position;shockwave(p,'#6fe38c',u.radius*2.6,600);for(let i=0;i<20;i++){const a=rand(0,Math.PI*2),r=rand(.2,u.radius*1.3);spawnPart(V(p.x+Math.cos(a)*r,rand(.1,u.h*.6),p.z+Math.sin(a)*r),{color:Math.random()<.5?'#9dffb4':'#ffe9a0',size:rand(.15,.32),life:rand(.6,1),v:V(0,rand(1.2,2.6),0)});}}
const fallenOf=u=>(u.side==='hero'?G.heroes:G.enemies).filter(x=>!x.alive&&HERO_KEYS.includes(x.key));
async function revive(t,pct){
  if(!t||t.alive)return;
  await waitDeaths();
  t.alive=true;t.status=[];t.hp=Math.max(1,Math.round(t.maxHp*pct));
  t.root.visible=true;t.root.position.copy(t.home);t.root.rotation.y=t.homeYaw;t.body.rotation.set(0,0,0);t.body.position.set(0,0,0);
  t.timer=G.clock+1000/t.spd*.5;
  await tween(420,k=>{t.root.scale.setScalar(t.scale*E.out(k));});
  healFx(t);burst(t.center(),'#ffe27a',30,3.5,.4,.8,0,.8);floatText(t,'De volta!','lab');
  t.refresh();refreshUI();buildOrder();
}
function kill(t){
  t.alive=false;t.status=[];t.refresh();sfx.death();
  const p=tween(650,k=>{t.body.rotation.x=-1.35*k;t.body.position.y=-.1*k;},E.out)
    .then(()=>{burst(t.center(),'#9b8ab8',22,2.5,.55,.7,.6);return tween(260,k=>t.root.scale.setScalar(t.scale*(1-k)));})
    .then(()=>{t.root.visible=false;});
  G.deaths.push(p);
}
async function waitDeaths(){const d=G.deaths.splice(0);if(d.length)await Promise.all(d);}

function faceTo(u,pos,ms=150){const target=Math.atan2(pos.x-u.root.position.x,pos.z-u.root.position.z),start=u.root.rotation.y,d=angDiff(start,target);return tween(ms,k=>{u.root.rotation.y=start+d*k;});}
function faceYaw(u,yaw,ms=180){const start=u.root.rotation.y,d=angDiff(start,yaw);return tween(ms,k=>{u.root.rotation.y=start+d*k;});}
function raise(u,a,ms=200,side='R'){const arm=side==='R'?u.armR:u.armL,s=arm.rotation.x;return tween(ms,k=>{arm.rotation.x=s+(a-s)*k;});}
function lower(u,side='R'){return raise(u,0,180,side);}
function orbPos(u){const v=V();(u.orb||u.handR).getWorldPosition(v);return v;}
function handPos(u,side='R'){const v=V();(side==='R'?u.handR:u.handL).getWorldPosition(v);return v;}
async function melee(u,t,onHit){
  const from=u.root.position.clone();
  const dir=V().subVectors(t.root.position,from);dir.y=0;dir.normalize();
  const to=t.root.position.clone().addScaledVector(dir,-(t.radius+u.radius+.2));to.y=0;
  await faceTo(u,t.root.position,110);sfx.whoosh();
  await tween(300,k=>{u.root.position.lerpVectors(from,to,k);u.root.position.y=Math.sin(k*Math.PI)*.6;},E.inOut);
  await tween(120,k=>{u.armR.rotation.x=-2.9*k;u.body.rotation.x=-.18*k;});
  await tween(90,k=>{u.armR.rotation.x=-2.9+2.1*k;u.body.rotation.x=-.18+.5*k;},E.lin);
  await onHit();
  await wait(200);
  await tween(150,k=>{u.armR.rotation.x=-.8*(1-k);u.body.rotation.x=.32*(1-k);});
  await tween(300,k=>{u.root.position.lerpVectors(to,from,k);u.root.position.y=Math.sin(k*Math.PI)*.45;},E.inOut);
  u.root.position.copy(u.home);
}
function sideCenter(side){const L=SLOTS[G.layout],c=side==='hero'?L.hc:L.ec;return V(c[0],0,c[1]);}
async function leapTo(u,to,h=1.4,ms=360){const from=u.root.position.clone();await tween(ms,k=>{u.root.position.lerpVectors(from,to,k);u.root.position.y=Math.sin(k*Math.PI)*h;},E.inOut);return from;}
async function bigSlam(u,mult,o){
  const to=sideCenter(u.side==='hero'?'enemy':'hero').lerp(u.root.position,.5);
  const from=await leapTo(u,to,3.2,420);
  await tween(110,k=>{u.armR.rotation.x=-3+2.6*k;u.body.rotation.x=-.25+.6*k;},E.lin);
  sfx.slam();sfx.roar();shake(.9);shockwave(to,o.color,14,800);shockwave(to,'#ffd27a',9,600);dustBurst(to);
  for(const h of foesOf(u)){dustBurst(h.root.position);hit(u,h,mult,{heavy:true});}
  await wait(500);
  await tween(160,k=>{u.armR.rotation.x=-.4*(1-k);u.body.rotation.x=.35*(1-k);});
  await leapTo(u,from,1.6,420);u.root.position.copy(u.home);
}

/* ================= habilidades ================= */
const AB={
  /* Brom */
  escudo:{name:'Golpe de Escudo',icon:'i-shield',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',run:(u,t)=>melee(u,t,()=>hit(u,t,1))},
  provocar:{name:'Provocar',icon:'i-taunt',cd:4,start:0,target:'self',desc:'Atrai os ataques individuais por 2 turnos e ganha escudo de 25% da vida.',ai:u=>!hasStatus(u,'taunt'),
    run:async u=>{sfx.roar();await tween(240,k=>{u.armL.rotation.x=-1.7*k;u.root.position.y=Math.sin(k*Math.PI)*.35;});
      shockwave(u.root.position,'#ff5a4e',4,520);addStatus(u,'taunt',2);addStatus(u,'shield',2,Math.round(u.maxHp*.25));floatText(u,'Provocando!','lab');
      await wait(380);await tween(200,k=>{u.armL.rotation.x=-1.7*(1-k);});}},
  terremoto:{name:'Terremoto',icon:'i-quake',cd:4,target:'enemies',desc:'70% de dano em todos os inimigos e 35% de chance de atordoar cada um.',
    run:async u=>{
      await tween(260,k=>{u.root.position.y=Math.sin(k*Math.PI/2)*1.4;u.armR.rotation.x=-2.9*k;});
      await tween(140,k=>{u.root.position.y=1.4*(1-k);u.armR.rotation.x=-2.9+2.2*k;},E.lin);
      sfx.slam();shake(.55);shockwave(u.root.position,'#d9b27a',11,700);dustBurst(u.root.position);
      for(const e of foesOf(u)){dustBurst(e.root.position);hit(u,e,.7);if(e.alive&&Math.random()<.35)stun(e);}
      await wait(450);await tween(150,k=>{u.armR.rotation.x=-.7*(1-k);});}},
  /* Lyra */
  faisca:{name:'Faísca',icon:'i-spark',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',
    run:async(u,t)=>{await raise(u,-1.7,180);sfx.magic();await projectile(orbPos(u),t.center(),{color:'#ff8a3a',size:.28,arc:.5,ms:360});hit(u,t,1);await lower(u);}},
  bolafogo:{name:'Bola de Fogo',icon:'i-fire',cd:3,start:1,target:'enemy',desc:'220% de dano e queimadura por 2 turnos.',
    run:async(u,t)=>{await raise(u,-2.3,260);sfx.fire();await projectile(orbPos(u),t.center(),{color:'#ff6a2a',size:.6,arc:1.2,ms:480,trail:2});
      hit(u,t,2.2,{heavy:true});if(t.alive){addStatus(t,'burn',2,Math.round(u.atk*.35));floatText(t,'Queimando','lab');}await lower(u);}},
  meteoros:{name:'Chuva de Meteoros',icon:'i-meteor',cd:5,target:'enemies',desc:'120% de dano em todos os inimigos e queimadura por 2 turnos.',
    run:async u=>{await raise(u,-2.9,300);sfx.fire();
      await Promise.all(foesOf(u).map((e,i)=>(async()=>{await wait(i*150);const to=e.center(),from=to.clone().add(V(rand(-2.5,-1),9,rand(-1,1)));
        await projectile(from,to,{color:'#ff5a1f',size:.65,arc:0,ms:420,trail:3});shake(.25);hit(u,e,1.2);if(e.alive)addStatus(e,'burn',2,Math.round(u.atk*.25));})()));
      await lower(u);}},
  /* Alva */
  luzsagrada:{name:'Luz Sagrada',icon:'i-sun',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',
    run:async(u,t)=>{await raise(u,-1.7,180);sfx.magic();await projectile(orbPos(u),t.center(),{color:'#ffd75e',size:.3,arc:.6,ms:380});hit(u,t,1);await lower(u);}},
  prece:{name:'Prece',icon:'i-heart',cd:2,start:0,target:'ally',kind:'heal',desc:'Cura um aliado em 280% do ataque.',
    run:async(u,t)=>{await raise(u,-2.5,240);sfx.heal();healFx(t);healUnit(t,u.atk*2.8);await wait(320);await lower(u);}},
  bencao:{name:'Bênção Coletiva',icon:'i-cross',cd:4,target:'allies',kind:'heal',desc:'Cura todos os aliados em 150% do ataque e remove veneno, queimadura e atordoamento.',
    run:async u=>{await raise(u,-2.9,300);sfx.heal();shockwave(u.root.position,'#ffe08a',9,700);
      for(const a of friendsOf(u)){healFx(a);healUnit(a,u.atk*1.5);const bad=['burn','poison','stun'],had=a.status.some(s=>bad.includes(s.type));a.status=a.status.filter(s=>!bad.includes(s.type));if(had)floatText(a,'Purificado','lab');a.refresh();}
      await wait(380);await lower(u);}},
  /* Vex */
  corte:{name:'Corte Duplo',icon:'i-dagger',cd:0,target:'enemy',desc:'Dois golpes de 55% em um inimigo.',
    run:(u,t)=>melee(u,t,async()=>{hit(u,t,.55);await tween(110,k=>{u.armL.rotation.x=-2.2*Math.sin(k*Math.PI);});if(t.alive)hit(u,t,.55);})},
  veneno:{name:'Lâmina Venenosa',icon:'i-drop',cd:3,start:1,target:'enemy',desc:'140% de dano e veneno por 3 turnos.',aiTarget:u=>foesOf(u).filter(f=>!hasStatus(f,'poison')).sort((a,b)=>b.hp-a.hp)[0],
    run:(u,t)=>melee(u,t,()=>{hit(u,t,1.4);burst(t.center(),'#8dff6a',14,2.5,.3,.6);if(t.alive){addStatus(t,'poison',3,Math.round(u.atk*.4));floatText(t,'Envenenado','lab');}})},
  execucao:{name:'Execução',icon:'i-skull',cd:4,start:2,target:'enemy',desc:'250% de dano, com +60% se o alvo estiver abaixo de 30% de vida.',
    aiTarget:u=>{const f=foesOf(u).sort((a,b)=>ratio(a)-ratio(b))[0];return f&&(ratio(f)<.35||f.def.boss||foesOf(u).length===1)?f:null;},
    run:(u,t)=>melee(u,t,()=>{const low=ratio(t)<.3;burst(t.center(),'#b47bff',24,4,.4,.5);hit(u,t,2.5,{heavy:true,bonus:low?1.6:1});})},
  /* Kai */
  tiro:{name:'Tiro Certeiro',icon:'i-bow',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',
    run:async(u,t)=>{await raise(u,-1.5,160,'L');sfx.whoosh();await arrow(handPos(u,'L'),t.center());hit(u,t,1);await lower(u,'L');}},
  perfurante:{name:'Flecha Perfurante',icon:'i-spark',cd:3,start:1,target:'enemy',desc:'210% de dano que atravessa escudos, com +20% de chance de crítico.',
    run:async(u,t)=>{await raise(u,-1.5,260,'L');sfx.whoosh();await arrow(handPos(u,'L'),t.center(),{arc:.2,ms:220,color:0x45aaff});burst(t.center(),'#45aaff',18,3.5,.35,.45);hit(u,t,2.1,{pierce:true,crit:u.crit+.2,heavy:true});await lower(u,'L');}},
  chuvaFlechas:{name:'Chuva de Flechas',icon:'i-wave',cd:4,target:'enemies',desc:'85% de dano em todos os inimigos.',
    run:async u=>{await raise(u,-2.8,240,'L');sfx.whoosh();
      await Promise.all(foesOf(u).map((e,i)=>wait(i*90).then(()=>{const to=e.center();return arrow(to.clone().add(V(rand(-1.5,-.5),8,rand(-.5,.5))),to,{arc:0,ms:300});}).then(()=>hit(u,e,.85))));
      await lower(u,'L');}},
  /* Mira */
  jatoAgua:{name:'Jato d\'Água',icon:'i-drop',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',
    run:async(u,t)=>{await raise(u,-1.7,180);sfx.water();await projectile(orbPos(u),t.center(),{color:'#45aaff',size:.3,arc:.5,ms:360});hit(u,t,1);await lower(u);}},
  ondaCura:{name:'Onda Curativa',icon:'i-wave',cd:3,start:1,target:'allies',kind:'heal',desc:'Cura todos os aliados em 110% do ataque.',
    run:async u=>{await raise(u,-2.7,260);sfx.water();sfx.heal();shockwave(u.root.position,'#45aaff',9,700);for(const a of friendsOf(u)){healFx(a);healUnit(a,u.atk*1.1);}await wait(360);await lower(u);}},
  bolha:{name:'Bolha Protetora',icon:'i-bubble',cd:4,start:0,target:'allies',kind:'shield',desc:'Dá a todos os aliados um escudo de 180% do ataque por 2 turnos.',
    run:async u=>{await raise(u,-2.7,240);sfx.magic();for(const a of friendsOf(u)){shockwave(a.root.position,'#7cc7ff',a.radius*2.4,500);addStatus(a,'shield',2,Math.round(u.atk*1.8));}floatText(u,'Escudo para todos','shieldt');await wait(360);await lower(u);}},
  /* Rook */
  machadada:{name:'Machadada',icon:'i-axe',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',run:(u,t)=>melee(u,t,()=>hit(u,t,1))},
  sede:{name:'Sede de Batalha',icon:'i-rage',cd:4,start:1,target:'self',desc:'Ganha +30% de ataque por 2 turnos e recupera 15% da vida.',ai:u=>!hasStatus(u,'enrage'),
    run:async u=>{sfx.roar();await tween(300,k=>{u.armL.rotation.x=-2.6*k;u.armR.rotation.x=-2.6*k;u.root.position.y=Math.sin(k*Math.PI)*.5;});
      burst(u.center(),'#ff4f5e',26,4,.45,.6);addStatus(u,'enrage',2);healUnit(u,u.maxHp*.15);floatText(u,'ATAQUE +30%','lab');
      await wait(300);await tween(200,k=>{u.armL.rotation.x=-2.6*(1-k);u.armR.rotation.x=-2.6*(1-k);});}},
  redemoinho:{name:'Redemoinho',icon:'i-rage',cd:4,target:'enemies',desc:'90% de dano em todos os inimigos e queimadura por 2 turnos.',
    run:async u=>{const to=sideCenter(u.side==='hero'?'enemy':'hero').lerp(u.root.position,.35);const from=await leapTo(u,to,1.2,340);
      sfx.whoosh();const y0=u.root.rotation.y;await tween(520,k=>{u.root.rotation.y=y0+k*Math.PI*4;u.armR.rotation.z=1.4*Math.sin(k*Math.PI);u.armL.rotation.z=-1.4*Math.sin(k*Math.PI);},E.inOut);
      shockwave(to,'#ff6a3d',8,500);for(const e of foesOf(u)){hit(u,e,.9);if(e.alive)addStatus(e,'burn',2,Math.round(u.atk*.2));}
      await wait(250);u.armR.rotation.z=.15;u.armL.rotation.z=-.15;await leapTo(u,from,1,340);u.root.position.copy(u.home);}},
  /* Nyx */
  toqueSombrio:{name:'Toque Sombrio',icon:'i-moon',cd:0,target:'enemy',desc:'100% de dano em um inimigo.',
    run:async(u,t)=>{await raise(u,-1.7,180);sfx.dark();await projectile(orbPos(u),t.center(),{color:'#a35bff',size:.3,arc:.5,ms:380});hit(u,t,1);await lower(u);}},
  drenar:{name:'Drenar Vida',icon:'i-drain',cd:3,start:1,target:'enemy',desc:'170% de dano e recupera 60% do dano causado.',
    run:async(u,t)=>{await raise(u,-2.2,220);sfx.dark();await projectile(orbPos(u),t.center(),{color:'#5ef0a0',size:.4,arc:.3,ms:340,trail:2});
      const d=hit(u,t,1.7,{heavy:true});if(d>0){await projectile(t.center(),u.center(),{color:'#9effc8',size:.3,arc:.6,ms:360});healUnit(u,d*.6);}await lower(u);}},
  maldicao:{name:'Maldição',icon:'i-skull',cd:4,target:'enemies',desc:'45% de dano em todos os inimigos e veneno por 3 turnos.',
    run:async u=>{await raise(u,-2.8,280);sfx.dark();
      await Promise.all(foesOf(u).map((e,i)=>wait(i*80).then(()=>projectile(orbPos(u),e.center(),{color:'#5ef0a0',size:.3,arc:1.2,ms:420})).then(()=>{hit(u,e,.45);if(e.alive)addStatus(e,'poison',3,Math.round(u.atk*.3));})));
      await lower(u);}},
  /* ---- 4º poderes (liberados na evolução 2) ---- */
  fortaleza:{name:'Fortaleza',icon:'i-shield',cd:5,start:1,target:'allies',kind:'shield',ult:true,desc:'Dá a todos os aliados um escudo de 15% da vida máxima do Brom por 2 turnos e provoca os inimigos.',
    run:async u=>{sfx.roar();await tween(320,k=>{u.armL.rotation.x=-2.4*k;u.root.position.y=Math.sin(k*Math.PI)*.6;});sfx.slam();shake(.3);
      shockwave(u.root.position,'#9fe4a8',9,700);for(const a of friendsOf(u)){shockwave(a.root.position,'#7cc7ff',a.radius*2.4,500);addStatus(a,'shield',2,Math.round(u.maxHp*.15));}
      addStatus(u,'taunt',2);floatText(u,'Fortaleza!','lab');await wait(380);await tween(200,k=>{u.armL.rotation.x=-2.4*(1-k);});}},
  explosaoSolar:{name:'Explosão Solar',icon:'i-sun',cd:5,start:1,target:'enemy',ult:true,desc:'320% de dano em um inimigo e queimadura forte por 3 turnos.',
    run:async(u,t)=>{await raise(u,-2.9,320);sfx.fire();const from=orbPos(u).add(V(0,1.2,0));
      await projectile(from,t.center(),{color:'#ffb347',size:.95,arc:2,ms:620,trail:4});shake(.45);shockwave(t.root.position,'#ff7a2a',5,600);
      hit(u,t,3.2,{heavy:true});if(t.alive){addStatus(t,'burn',3,Math.round(u.atk*.5));floatText(t,'Queimando','lab');}await lower(u);}},
  ressurreicao:{name:'Ressurreição',icon:'i-heart',cd:6,start:2,target:'fallen',ult:true,desc:'Traz de volta um aliado caído com 45% da vida.',
    run:async(u,t)=>{await raise(u,-2.9,320);sfx.heal();await revive(t,.45);await wait(250);await lower(u);}},
  dancaSombras:{name:'Dança das Sombras',icon:'i-dagger',cd:4,start:1,target:'enemies',ult:true,desc:'Quatro golpes de 55% em inimigos aleatórios, com +15% de chance de crítico.',
    run:async u=>{const from=u.root.position.clone();sfx.whoosh();
      for(let i=0;i<4;i++){const foes=foesOf(u);if(!foes.length)break;const t=pick(foes);
        const to=t.root.position.clone().add(V(rand(-.6,.6),0,rand(-.6,.6)));
        burst(u.center(),'#b47bff',10,2,.3,.3);await tween(120,k=>{u.root.position.lerpVectors(i?u.root.position:from,to,k);},E.lin);
        u.root.position.copy(to);await faceTo(u,t.root.position,40);await tween(90,k=>{u.armR.rotation.x=-2.6*Math.sin(k*Math.PI);});hit(u,t,.55,{crit:u.crit+.15});}
      await tween(220,k=>{u.root.position.lerp(u.home,k);});u.root.position.copy(u.home);}},
  tiroAtordoante:{name:'Tiro Atordoante',icon:'i-bolt',cd:5,start:1,target:'enemy',ult:true,desc:'160% de dano e atordoa o alvo por 1 turno.',
    run:async(u,t)=>{await raise(u,-1.6,300,'L');sfx.whoosh();await arrow(handPos(u,'L'),t.center(),{arc:.15,ms:200,color:0xffe066});
      burst(t.center(),'#ffe066',22,4,.4,.5);hit(u,t,1.6,{heavy:true});if(t.alive)stun(t);await lower(u,'L');}},
  mareAlta:{name:'Maré Alta',icon:'i-wave',cd:5,start:1,target:'enemies',ult:true,desc:'80% de dano em todos os inimigos e cura todos os aliados em 70% do ataque.',
    run:async u=>{await raise(u,-2.9,300);sfx.water();shake(.3);
      for(const e of foesOf(u)){shockwave(e.root.position,'#45aaff',3,600);hit(u,e,.8);}
      await wait(250);sfx.heal();for(const a of friendsOf(u)){healFx(a);healUnit(a,u.atk*.7);}await wait(300);await lower(u);}},
  furiaSangue:{name:'Fúria Sanguinária',icon:'i-rage',cd:5,start:1,target:'enemy',ult:true,desc:'260% de dano em um inimigo e recupera 50% do dano causado.',
    run:(u,t)=>melee(u,t,()=>{burst(t.center(),'#ff4f5e',26,4.5,.45,.5);const d=hit(u,t,2.6,{heavy:true});if(d>0)healUnit(u,d*.5);})},
  colheita:{name:'Colheita de Almas',icon:'i-skull',cd:5,start:1,target:'enemies',ult:true,desc:'110% de dano em todos os inimigos; Nyx recupera 35% do dano total.',
    run:async u=>{await raise(u,-2.9,300);sfx.dark();let total=0;
      await Promise.all(foesOf(u).map((e,i)=>wait(i*80).then(()=>{shockwave(e.root.position,'#5ef0a0',2.6,500);total+=hit(u,e,1.1);})));
      if(total>0){await projectile(V(0,2,0),u.center(),{color:'#9effc8',size:.45,arc:.4,ms:360});healUnit(u,total*.35);}await lower(u);}},
  /* inimigos comuns */
  lanca:{name:'Estocada',cd:0,run:(u,t)=>melee(u,t,()=>hit(u,t,1))},
  flecha:{name:'Flecha',cd:0,run:async(u,t)=>{await raise(u,-1.5,160,'L');sfx.whoosh();await arrow(handPos(u,'L'),t.center());hit(u,t,1);await lower(u,'L');}},
  espada:{name:'Talho',cd:0,run:(u,t)=>melee(u,t,()=>hit(u,t,1))},
  raio:{name:'Raio Sombrio',cd:0,run:async(u,t)=>{await raise(u,-1.8,200);sfx.dark();await projectile(orbPos(u),t.center(),{color:'#b47bff',size:.32,arc:.4,ms:380});hit(u,t,1.1);await lower(u);}},
  rajada:{name:'Rajada Sombria',cd:3,start:1,callout:true,run:async u=>{await raise(u,-2.6,260);sfx.dark();
    await Promise.all(foesOf(u).map((h,i)=>wait(i*90).then(()=>projectile(orbPos(u),h.center(),{color:'#a35bff',size:.3,arc:1,ms:420})).then(()=>hit(u,h,.55))));await lower(u);}},
  jato:{name:'Jato de Lodo',cd:0,run:async(u,t)=>{await raise(u,-1.8,200);sfx.water();await projectile(orbPos(u),t.center(),{color:'#48c6ff',size:.32,arc:.6,ms:380});hit(u,t,1);await lower(u);}},
  curaLodo:{name:'Lodo Restaurador',cd:3,start:1,callout:true,run:async(u,t)=>{await raise(u,-2.5,240);sfx.heal();healFx(t);healUnit(t,t.maxHp*.25);await wait(300);await lower(u);}},
  brasa:{name:'Brasa',cd:0,run:async(u,t)=>{await raise(u,-1.8,180);sfx.fire();await projectile(orbPos(u),t.center(),{color:'#ff7a2a',size:.32,arc:.7,ms:380});hit(u,t,1);if(t.alive&&Math.random()<.3)addStatus(t,'burn',2,Math.round(u.atk*.25));await lower(u);}},
  rajadaFogo:{name:'Rajada de Fogo',cd:3,start:1,callout:true,run:async u=>{await raise(u,-2.6,260);sfx.fire();
    await Promise.all(foesOf(u).map((h,i)=>wait(i*90).then(()=>projectile(orbPos(u),h.center(),{color:'#ff5a1a',size:.32,arc:1,ms:420})).then(()=>{hit(u,h,.5);if(h.alive)addStatus(h,'burn',2,Math.round(u.atk*.2));})));await lower(u);}},
  pancada:{name:'Pancada',cd:0,run:(u,t)=>melee(u,t,()=>{hit(u,t,1.2,{heavy:true});dustBurst(t.root.position);if(t.alive&&Math.random()<.25)stun(t);})},
  /* chefes (o nome vem do kit de cada chefe) */
  bBasic:{name:'Ataque',cd:0,run:async(u,t)=>{const bk=u.def.bk;
    if(bk.melee)return melee(u,t,()=>{hit(u,t,1.3,{heavy:true});shake(.35);dustBurst(t.root.position);});
    await raise(u,-1.9,220);sfx.dark();await projectile(orbPos(u),t.center(),{color:bk.boltColor,size:.45,arc:.4,ms:400,trail:2});hit(u,t,1.35,{heavy:true});await lower(u);}},
  bAoe:{name:'Ataque em área',cd:3,start:2,callout:true,run:async u=>{const bk=u.def.bk;
    await tween(300,k=>{u.armR.rotation.x=-2.9*k;u.root.position.y=Math.sin(k*Math.PI/2)*.8;});
    await tween(140,k=>{u.armR.rotation.x=-2.9+2.4*k;u.root.position.y=.8*(1-k);},E.lin);
    sfx.slam();shake(.45);shockwave(u.root.position,bk.aoeColor,14,800);
    for(let i=0;i<30;i++){const a=rand(0,Math.PI*2);spawnPart(V(u.root.position.x+Math.cos(a)*2,.3,u.root.position.z+Math.sin(a)*2),{color:bk.aoeColor,size:rand(.3,.6),life:.8,v:V(Math.cos(a)*6,rand(1,3),Math.sin(a)*6),grav:-6});}
    await wait(260);
    for(const h of foesOf(u)){hit(u,h,.75);if(h.alive&&bk.aoeStatus)addStatus(h,bk.aoeStatus,2,Math.round(u.atk*.2));}
    await wait(300);await tween(150,k=>{u.armR.rotation.x=-.5*(1-k);});}},
  bPrep:{name:'Preparar',cd:0,callout:true,run:async u=>{const bk=u.def.bk;
    sfx.roar();await tween(500,k=>{u.armR.rotation.x=-3*k;u.body.rotation.x=-.25*k;});
    addStatus(u,'charge',2);
    banner(`${bk.big} no próximo turno!`,bk.quote,'Proteja-se: escudos e cura agora.',true,2200);
    await wait(500);}},
  bBig:{name:'Golpe',cd:0,callout:true,run:async u=>{removeStatus(u,'charge');await bigSlam(u,1.9,{color:u.def.bk.bigColor});}},
  bRage:{name:'Fúria',cd:0,callout:true,run:async u=>{const bk=u.def.bk;
    u.enraged=true;sfx.roar();shake(.5);
    await tween(400,k=>{u.root.scale.setScalar(u.scale*(1+.12*Math.sin(k*Math.PI)));});
    burst(u.center(),'#ff4f5e',40,5,.6,.8);addStatus(u,'enrage',99);floatText(u,'ATAQUE +30%','lab');
    banner(`${u.def.short} enfurecido!`,bk.rage,'Reforços chegaram.',true,1800);
    await wait(400);
    const adds=[];
    for(let i=0;i<2;i++){const e=new Unit(bk.adds,'enemy',Math.max(1,u.lvl-1));e.slot={type:'add',i};G.enemies.push(e);placeUnit(e);e.timer=G.clock+1000/e.spd*.6;adds.push(e);}
    await Promise.all(adds.map((e,i)=>wait(i*160).then(()=>dropIn(e))));
    buildOrder();}}
};
function abName(u,id){const bk=u.def.bk;if(bk){const m={bBasic:bk.basic,bAoe:bk.aoe,bPrep:bk.prep,bBig:bk.big,bRage:bk.rage};if(m[id])return m[id];}return AB[id].name;}

/* ================= IA ================= */
function bestFoe(u,mode){
  const foes=foesOf(u);if(!foes.length)return null;
  const taunt=foes.filter(f=>hasStatus(f,'taunt'));if(taunt.length)return taunt[0];
  if(mode==='random')return Math.random()<.4?foes.slice().sort((a,b)=>a.hp-b.hp)[0]:pick(foes);
  return foes.slice().sort((a,b)=>{const ea=elemMult(u.el,a.el),eb=elemMult(u.el,b.el);if(ea!==eb)return eb-ea;return ratio(a)-ratio(b);})[0];
}
/* IA dos heróis (usada no AUTO e pelas equipes de defesa na Invasão) */
function heroAI(u){
  const [basic,...specials]=u.abilities,foes=foesOf(u),friends=friendsOf(u);
  const low=friends.slice().sort((a,b)=>ratio(a)-ratio(b))[0];
  const hurt=friends.filter(f=>ratio(f)<.7).length;
  const dots=friends.some(f=>f.status.some(s=>['poison','burn','stun'].includes(s.type)));
  for(const id of specials.slice().reverse()){
    if(u.cds[id]>0)continue;const a=AB[id];
    if(a.target==='self'){if(!a.ai||a.ai(u))return{ab:id,target:u};continue;}
    if(a.target==='ally'){if(ratio(low)<.6)return{ab:id,target:low};continue;}
    if(a.target==='fallen'){const f=fallenOf(u);if(f.length)return{ab:id,target:f[0]};continue;}
    if(a.target==='allies'){
      if(a.kind==='heal'&&(hurt>=2||ratio(low)<.45||(dots&&hurt>=1)))return{ab:id};
      if(a.kind==='shield'&&!friends.some(f=>shieldOf(f)>0)&&(ratio(low)<.85||foes.some(f=>f.def.boss)))return{ab:id};
      continue;}
    if(a.target==='enemies'){if(foes.length>=2||foes.some(f=>f.def.boss))return{ab:id};continue;}
    if(a.target==='enemy'){
      const t=a.aiTarget?a.aiTarget(u):bestFoe(u);if(!t)continue;
      return{ab:id,target:foes.some(f=>hasStatus(f,'taunt'))?bestFoe(u):t};}
  }
  return{ab:basic,target:bestFoe(u)};
}
function enemyAI(u){
  if(HERO_KEYS.includes(u.key))return heroAI(u);
  const ab=u.abilities,r=id=>u.cds[id]===0;
  if(u.def.boss){
    u.bt=(u.bt||0)+1;
    if(hasStatus(u,'charge'))return{ab:'bBig'};
    if(!u.enraged&&ratio(u)<.5)return{ab:'bRage'};
    if(u.bt%4===3)return{ab:'bPrep'};
    if(r('bAoe')&&Math.random()<.6)return{ab:'bAoe'};
    return{ab:'bBasic',target:bestFoe(u,'random')};
  }
  if(ab.includes('curaLodo')&&r('curaLodo')){const h=friendsOf(u).filter(f=>ratio(f)<.6).sort((a,b)=>ratio(a)-ratio(b))[0];if(h)return{ab:'curaLodo',target:h};}
  for(const id of['rajada','rajadaFogo'])if(ab.includes(id)&&r(id)&&foesOf(u).length>=2&&Math.random()<.8)return{ab:id};
  return{ab:ab[0],target:bestFoe(u,'random')};
}

/* ================= posicionamento e câmera ================= */
const SLOTS={
  land:{hero:[[-3.3,-2.3],[-4.7,-.6],[-3.3,1.1],[-4.7,2.8]],enemy:[[3.3,-2.2],[4.7,-.4],[3.3,1.4],[4.7,3]],boss:[4.3,-1.2],add:[[2.6,-2.9],[2.8,2.4]],show:[[2.6,1.8],[4.2,.6],[5.8,1.8],[7.4,.6]],hc:[-4,.3],ec:[4,.3]},
  port:{hero:[[-2.25,3.5],[-.75,3.1],[.75,3.1],[2.25,3.5]],enemy:[[-2.2,-1],[0,-1.7],[2.2,-1],[0,.2]],boss:[0,-2.6],add:[[-2.5,-.5],[2.5,-.5]],show:[[-2.25,3.5],[-.75,3.1],[.75,3.1],[2.25,3.5]],hc:[0,3.3],ec:[0,-1.3]}
};
function slotXZ(u){const L=SLOTS[G.layout],s=u.slot;if(s.type==='hero')return G.state==='menu'?L.show[s.i]:L.hero[s.i];if(s.type==='boss')return L.boss;if(s.type==='add')return L.add[s.i];return L.enemy[s.i];}
function placeUnit(u,snap=true){
  const [x,z]=slotXZ(u);u.home.set(x,0,z);
  const L=SLOTS[G.layout],c=u.side==='hero'?L.ec:L.hc;
  const toFoe=Math.atan2(c[0]-x,c[1]-z),toCam=Math.atan2(camBase.x-x,camBase.z-z);
  u.homeYaw=G.state==='menu'?toCam:toFoe+angDiff(toFoe,toCam)*(u.side==='hero'?.38:.3);
  if(snap){u.root.position.copy(u.home);u.root.rotation.y=u.homeYaw;}
}
const topEl=$('#top'),bottomEl=$('#bottom');
function fitCamera(){
  const w=app.clientWidth,h=app.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);
  const layout=w/h<.95?'port':'land';
  const hb=bottomEl.hidden?0:bottomEl.offsetHeight,ht=topEl.hidden?0:topEl.offsetHeight;
  const s=Math.max(0,(hb-ht)/2),H=h+2*s;
  camera.fov=layout==='port'?36:28;camera.aspect=w/H;
  const hf=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const bossRoom=G.state!=='menu'&&G.rooms[G.room]&&G.rooms[G.room].boss;
  const needW=layout==='port'?6.9:13.4,needH=(layout==='port'?8.5:8.2)+(bossRoom?1.4:0);
  const dist=Math.max((needW/2)/(hf*camera.aspect),(needH/2)/hf);
  lookTarget.set(0,(layout==='port'?.7:.9)+(bossRoom?.7:0),layout==='port'?.8:.3);
  const dir=layout==='port'?V(0,.74,.67).normalize():V(0,.5,.86).normalize();
  camBase.copy(lookTarget).addScaledVector(dir,dist);
  if(s>0)camera.setViewOffset(w,H,0,2*s,w,h);else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const changed=layout!==G.layout;G.layout=layout;
  for(const u of allUnits())if(u.alive)placeUnit(u,changed);
}
function updateCamera(dt,t){
  const desired=V();
  if(G.state==='menu'){
    const off=V().subVectors(camBase,lookTarget);off.applyAxisAngle(V(0,1,0),Math.sin(t*.15)*.3);
    desired.copy(lookTarget).add(off.multiplyScalar(G.layout==='port'?1:.8));
    if(G.layout==='land')desired.x+=2.8;
  }else desired.copy(camBase).add(V(Math.sin(t*.27)*.25,Math.sin(t*.21)*.12,0));
  camPos.lerp(desired,1-Math.exp(-dt*2.6));
  camera.position.copy(camPos);
  if(G.shake>.001){camera.position.add(rv(G.shake*.45));G.shake*=Math.exp(-dt*7);}
  const look=lookTarget.clone();if(G.state==='menu'&&G.layout==='land')look.x+=2.8;
  camera.lookAt(look);
}

/* ================= laço visual ================= */
function updateUnits(dt,t,rt){
  for(const u of allUnits()){
    u.ring.position.set(u.root.position.x,.04,u.root.position.z);
    let op=0,col=null,sc=1;
    if(u.alive&&u.root.visible){
      const b=Math.sin(t*3.2+u.phase);u.body.position.y=b*.03;u.body.scale.set(1-b*.012,1+b*.025,1-b*.012);
      u.armL.rotation.z=-.15-b*.05;if(u.armR.rotation.x===0)u.armR.rotation.z=.15+b*.05;
      if(u.familiar){u.familiar.position.y=1.6+Math.sin(t*2+u.phase)*.12;u.familiar.rotation.y=t;}
      if(u.cape)u.cape.rotation.x=.14+Math.sin(t*2.6+u.phase)*.05+Math.min(.5,Math.abs(u.root.position.y)*.4);
      if(u.weaponGlow){const p=.65+.25*Math.sin(rt*4+u.phase);u.weaponGlow[0].material.opacity=p;u.weaponGlow[1].material.opacity=p;
        if(Math.random()<dt*5)spawnPart(handPos(u).add(rv(.25)),{color:'#'+u.weaponGlow[0].material.color.getHexString(),size:.14,life:.6,v:V(0,1,0)});}
      if(G.state==='battle'&&G.current===u){op=.9;col=u.side==='hero'?0xffc93c:0xff4f5e;sc=1+Math.sin(rt*5)*.06;}
      if(G.valid.includes(u)){const a=AB[G.sel];col=(a.target==='enemy'||a.target==='enemies')?0xff4f5e:0x6fe38c;op=.55+.35*Math.sin(rt*6);sc=1.05;}
      if(hasStatus(u,'charge')&&Math.random()<dt*40)spawnPart(V(u.root.position.x+rand(-1,1),rand(.2,u.h),u.root.position.z+rand(-1,1)),{color:u.def.bk?u.def.bk.bigColor:'#ff5a2a',size:rand(.2,.5),life:.7,v:V(0,rand(1,3),0)});
      if(hasStatus(u,'burn')&&Math.random()<dt*8)spawnPart(u.center().add(rv(.3)),{color:'#ff7a2a',size:.25,life:.5,v:V(0,1.6,0)});
      if(hasStatus(u,'poison')&&Math.random()<dt*6)spawnPart(u.center().add(rv(.35)),{color:'#8dff6a',size:.18,life:.6,v:V(0,1.2,0)});
      u.head.rotation.z=hasStatus(u,'stun')?Math.sin(rt*8)*.12:0;
      if(hasStatus(u,'enrage'))for(const m of u.mats)m.emissive.r=Math.max(m.emissive.r,.18+.1*Math.sin(rt*6));
    }
    if(col!==null)u.ringMat.color.setHex(col);
    u.ringMat.opacity+=(op-u.ringMat.opacity)*Math.min(1,dt*12);
    u.ring.scale.setScalar(u.radius*1.7*sc);
    u.ring.visible=u.ringMat.opacity>.01;
  }
}
function updateEnv(dt,t){
  for(const f of flames){const n=Math.sin(t*9+f.phase)*.5+Math.sin(t*17+f.phase*2)*.3+Math.sin(t*4.3+f.phase)*.2;
    f.outer.scale.y=.5*f.size*(1+n*.16);f.inner.scale.y=.3*f.size*(1+n*.2);f.glow.material.opacity=.6+n*.12;if(f.light)f.light.intensity=1.35+n*.3;}
  if(dust){const a=dust.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)+dt*.15;if(y>6)y=0;a.setY(i,y);a.setX(i,a.getX(i)+Math.sin(t*.5+i)*dt*.05);}a.needsUpdate=true;}
  if(pools.length&&Math.random()<dt*6){const p=pick(pools);spawnPart(V(p.x+rand(-p.r,p.r)*.6,.05,p.z+rand(-p.r,p.r)*.6),{color:p.color,size:rand(.15,.3),life:1,v:V(0,rand(.4,.9),0)});}
}
let last=performance.now(),RT=0;
function frame(now){
  const rdt=Math.min(.05,(now-last)/1000);last=now;const dt=G.paused?0:rdt*G.speed;RT+=rdt;
  updateTweens(dt);updateUnits(dt,RT*G.speed,RT);updateParts(dt);updateEnv(rdt,RT);updateCamera(rdt,RT);
  renderer.render(scene,camera);updateOverlay(dt);Preview.tick(rdt);
  requestAnimationFrame(frame);
}

/* ================= retratos (renderizados do próprio modelo 3D) ================= */
const portraitCache={};let pr=null,pScene=null,pCam=null;
function portrait(key){
  if(portraitCache[key])return portraitCache[key];
  try{
    if(!pr){pr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});pr.setSize(128,128);pr.setPixelRatio(1);
      pScene=new THREE.Scene();pScene.add(new THREE.HemisphereLight(0xffffff,0x553344,.95));const l=new THREE.DirectionalLight(0xffffff,.7);l.position.set(2,3,4);pScene.add(l);pCam=new THREE.PerspectiveCamera(30,1,.1,50);}
    const m=MODELS[DEFS[key].model]();m.root.rotation.y=.35;pScene.add(m.root);
    pCam.position.set(.55,1.62,2.75);pCam.lookAt(0,1.5,0);pr.render(pScene,pCam);
    portraitCache[key]=pr.domElement.toDataURL();pScene.remove(m.root);
  }catch(e){portraitCache[key]='data:image/gif;base64,R0lGODlhAQABAAAAACw=';}
  return portraitCache[key];
}
const evoBadge=e=>e>1?`<span class="evb" title="Evolução ${e}">${'<svg><use href="#i-star"/></svg>'.repeat(e)}</span>`:'';
const ptHtml=(k,lvl,cls='',evo=0)=>`<span class="pt ${cls}" style="--elc:${ELEM[DEFS[k].el].c}"><img src="${portrait(k)}" alt="">${evoBadge(evo)}<svg class="gem"><use href="#${ELEM[DEFS[k].el].i}"/></svg>${lvl?`<span class="lv">${lvl}</span>`:''}</span>`;
