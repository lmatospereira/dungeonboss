/* ================= interface da batalha ================= */
const hintEl=$('#hint'),skillsEl=$('#skills'),partyEl=$('#party'),orderEl=$('#order'),bannerEl=$('#banner');
function setHint(h){hintEl.innerHTML=h;}
function buildParty(){
  partyEl.innerHTML='';
  G.heroes.forEach(h=>{
    const b=document.createElement('button');b.type='button';b.className='card';
    b.innerHTML=`${ptHtml(h.key,h.lvl)}<span class="ci"><span class="cn">${h.def.name}</span><span class="cbar"><i class="chp"></i><i class="csh"></i></span><span class="ct"></span></span><span class="cst"></span>`;
    b.setAttribute('aria-label',`${h.def.name}, ${h.def.role}, nível ${h.lvl}`);
    b.addEventListener('click',()=>onUnitTap(h));partyEl.appendChild(b);h.card=b;
  });
}
function refreshCards(){
  for(const h of G.heroes){if(!h.card)continue;const c=h.card,r=ratio(h);
    const hp=c.querySelector('.chp');hp.style.width=r*100+'%';hp.className='chp'+(r<.25?' crit':r<.5?' low':'');
    c.querySelector('.csh').style.width=Math.min(100,shieldOf(h)/h.maxHp*100)+'%';
    c.querySelector('.ct').textContent=`${fmt(h.hp)} / ${fmt(h.maxHp)}`;
    c.querySelector('.cst').innerHTML=statusHtml(h);
    c.classList.toggle('dead',!h.alive);c.classList.toggle('active',G.state==='battle'&&G.current===h);
    c.classList.toggle('target',G.valid.includes(h)&&['ally','allies','self'].includes(AB[G.sel]?.target));
  }
}
function buildOrder(){
  if(G.state==='menu'){orderEl.innerHTML='';return;}
  const sim=allUnits().filter(u=>u.alive).map(u=>({u,t:u.timer}));if(!sim.length){orderEl.innerHTML='';return;}
  const max=app.clientWidth<420?6:8,out=[];
  for(let i=0;i<max;i++){let b=sim[0];for(const s of sim)if(s.t<b.t)b=s;out.push(b.u);b.t+=1000/b.u.spd;}
  orderEl.innerHTML='<span class="order-label">Ordem</span>'+out.map((u,i)=>`<span class="oc ${u.side}${i===0?' cur':''}" title="${esc(u.def.short||u.def.name)}"><img src="${portrait(u.key)}" alt=""></span>`).join('');
}
function refreshBoss(){
  const b=G.enemies.find(e=>e.def.boss),bb=$('#bossbar');
  if(!b||G.state==='menu'){bb.hidden=true;return;}
  bb.hidden=false;$('#bbName').textContent=`${b.def.name} · Nv ${b.lvl}`;
  $('#bbGem').innerHTML=`<use href="#${ELEM[b.el].i}"/>`;$('#bbGem').style.color=ELEM[b.el].c;
  const pct=ratio(b)*100;$('#bbFill').style.width=pct+'%';setTimeout(()=>{$('#bbLag').style.width=pct+'%';},350);
  $('#bbHp').textContent=`${fmt(b.hp)} / ${fmt(b.maxHp)}`;$('#bbWeak').textContent=$('#bbAdv').textContent?'':`Fraco contra ${ELEM[weakTo(b.el)].n}`;$('#bbSt').innerHTML=statusHtml(b);
}
function refreshUI(){refreshCards();refreshBoss();}
/* setas de vantagem de elemento sobre os inimigos, do ponto de vista do herói da vez */
function markAdvantage(u){
  let any=false;
  for(const e of G.enemies){
    const m=u&&u.side==='hero'&&e.alive?elemMult(u.el,e.el):1;if(m!==1)any=true;
    e.tagAdv.className='tadv'+(m>1?' up':m<1?' down':'');e.tagAdv.textContent=m>1?'▲':m<1?'▼':'';
    if(e.def.boss){const a=$('#bbAdv');a.className='bb-adv'+(m>1?' up':m<1?' down':'');a.textContent=m>1?`▲ ${u.def.name} causa 150%`:m<1?`▼ ${u.def.name} causa 70%`:'';}
  }
  return any;
}
function renderSkills(u){
  skillsEl.innerHTML='';
  u.def.abilities.forEach(id=>{
    const a=AB[id],cd=u.cds[id];const b=document.createElement('button');b.type='button';
    b.className='ab'+(cd>0?' cool':'')+(G.sel===id?' sel':'');b.style.setProperty('--elc',ELEM[u.el].c);
    b.innerHTML=`<span class="ai"><svg><use href="#${a.icon}"/></svg>${cd>0?`<b class="cd">${cd}</b>`:''}</span><span class="an">${a.name}</span>`;
    b.setAttribute('aria-label',`${a.name}${cd>0?`, recarrega em ${cd}`:''}. ${a.desc}`);
    b.addEventListener('click',()=>onAbilityTap(id));skillsEl.appendChild(b);
  });
}
const targetHelp={enemy:'Toque num inimigo.',ally:'Toque num aliado.',self:'Toque de novo para usar.',enemies:'Toque de novo para usar.',allies:'Toque de novo para usar.'};
function selectAbility(u,id){
  const a=AB[id];G.sel=id;
  G.valid=a.target==='enemy'||a.target==='enemies'?aliveEnemies():a.target==='self'?[u]:aliveHeroes();
  renderSkills(u);refreshCards();
  setHint(`<b>${a.name}</b> · ${a.desc} ${targetHelp[a.target]}`);
}
function onAbilityTap(id){
  const u=G.current;if(!G.pending||!u)return;sfx.click();
  if(u.cds[id]>0){setHint(`<b>${AB[id].name}</b> recarrega em ${u.cds[id]} turno${u.cds[id]>1?'s':''}.`);return;}
  const a=AB[id];
  if(G.sel===id&&['self','enemies','allies'].includes(a.target)){G.pending({ab:id,target:a.target==='self'?u:null});return;}
  selectAbility(u,id);
}
function onUnitTap(t){
  if(!G.pending||!G.valid.includes(t))return;
  const a=AB[G.sel];G.pending({ab:G.sel,target:a.target==='enemy'||a.target==='ally'?t:a.target==='self'?G.current:null});
}
const ray=new THREE.Raycaster();
canvas.addEventListener('pointerdown',e=>{
  if(!G.pending)return;
  const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  ray.setFromCamera({x:mx/r.width*2-1,y:-(my/r.height)*2+1},camera);
  const hits=ray.intersectObjects(allUnits().filter(u=>u.alive).map(u=>u.proxy),false);
  let u=hits.length?hits[0].object.userData.unit:null;
  if(!u||!G.valid.includes(u)){let bd=90;u=null;for(const v of G.valid){const s=toScreen(v.center());const d=Math.hypot(s.x-mx,s.y-my);if(d<bd){bd=d;u=v;}}}
  if(u)onUnitTap(u);
});
let bannerTimer=0;
function banner(title,eyebrow='',sub='',danger=false,ms=1600){
  bannerEl.querySelector('.b-title').textContent=title;bannerEl.querySelector('.b-eyebrow').textContent=eyebrow;bannerEl.querySelector('.b-sub').textContent=sub;
  bannerEl.classList.toggle('danger',danger);bannerEl.hidden=false;bannerEl.classList.remove('show');void bannerEl.offsetWidth;bannerEl.classList.add('show');
  clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>{bannerEl.hidden=true;},ms/G.speed);
}
function fade(to,ms){const el=$('#fade'),from=parseFloat(el.style.opacity||0);return tween(ms,k=>{el.style.opacity=from+(to-from)*k;},E.lin);}

/* ================= montagem de cenas ================= */
function clearUnits(){for(const u of allUnits())u.destroy();G.heroes=[];G.enemies=[];for(const f of floaters)f.el.remove();floaters.length=0;}
function makeHeroes(keys){G.heroes=keys.map((k,i)=>{const u=new Unit(k,'hero',lvlOf(k));u.slot={type:'hero',i};return u;});}
function showcase(keys,themeKey='goblin'){
  G.state='menu';G.loopId++;G.pending=null;G.current=null;G.valid=[];
  topEl.hidden=true;bottomEl.hidden=true;bannerEl.hidden=true;
  clearUnits();setStage(themeKey,false);makeHeroes(keys);fitCamera();for(const u of G.heroes)placeUnit(u,true);
}
async function dropIn(e){
  e.root.position.copy(e.home);e.root.position.y=8;e.root.visible=true;e.root.rotation.y=e.homeYaw;
  await tween(520,k=>{e.root.position.y=8*(1-k);},E.bounce);
  sfx.land();dustBurst(e.home);shake(e.def.boss?.7:.15);e.refresh();
}
function spawnRoom(room){
  for(const e of G.enemies)e.destroy();G.enemies=[];
  room.enemies.forEach((x,j)=>{const e=new Unit(x.k,'enemy',x.lvl);e.slot=room.boss?{type:'boss'}:{type:'enemy',i:j};G.enemies.push(e);});
  for(const e of G.enemies){placeUnit(e);e.root.visible=false;}
}
function initTimers(){G.clock=0;for(const u of allUnits())if(u.alive)u.timer=(1000/u.spd)*(u.side==='hero'?rand(.1,.75):rand(.3,1));}

function startDungeon(d){
  G.mode='dungeon';G.dungeon=d;G.opp=null;
  G.rooms=[...d.rooms.map((ks,i)=>({enemies:ks.map(k=>({k,lvl:d.lvl})),theme:d.theme,name:d.name,sub:d.sub[i]})),
    {enemies:[{k:d.boss,lvl:d.lvl+1}],boss:true,theme:d.theme,name:d.name,sub:d.sub[2]}];
  beginBattle(SAVE.team);
}
function startArena(opp){
  G.mode='arena';G.opp=opp;G.dungeon=null;
  G.rooms=[{enemies:opp.team.map(t=>({k:t.k,lvl:t.lvl})),theme:'arena',name:`Masmorra de ${opp.name}`,sub:'Derrote a equipe de defesa.'}];
  beginBattle(SAVE.team);
}
async function beginBattle(keys){
  audio();screenEl.hidden=true;
  G.stats={dmg:0,turns:0,crits:0};G.deaths=[];G.pending=null;G.valid=[];G.sel=null;G.cleared=0;G.loopId++;
  G.state='transition';clearUnits();makeHeroes(keys);
  topEl.hidden=false;bottomEl.hidden=false;G.paused=false;
  buildParty();renderSkills(G.heroes[0]);skillsEl.classList.add('wait');
  fitCamera();
  const sala=+((location.search.match(/sala=(\d)/)||[])[1]||0);
  await enterRoom(Math.min(sala,G.rooms.length-1),true);
}
function setRoomPill(){
  const r=G.rooms[G.room];
  $('#roomNum').textContent=G.mode==='arena'?'Invasão':`Sala ${G.room+1} de ${G.rooms.length}`;
  $('#roomName').textContent=G.mode==='arena'?G.opp.name:r.name;
}
async function enterRoom(i,first){
  G.state='transition';G.room=i;G.current=null;G.valid=[];G.sel=null;
  const my=G.loopId;
  skillsEl.classList.add('wait');setHint('');
  if(!first){
    const L=SLOTS[G.layout],dir=V(L.ec[0]-L.hc[0],0,L.ec[1]-L.hc[1]).normalize();
    await Promise.all(aliveHeroes().map(h=>{const from=h.root.position.clone(),to=from.clone().addScaledVector(dir,4);h.root.rotation.y=Math.atan2(dir.x,dir.z);
      return tween(750,(k,raw)=>{h.root.position.lerpVectors(from,to,k);h.root.position.y=Math.abs(Math.sin(raw*Math.PI*4))*.18;},E.inOut);}));
    await fade(1,320);
  }
  if(my!==G.loopId)return;
  const R=G.rooms[i];
  setStage(R.theme,!!R.boss);spawnRoom(R);setRoomPill();
  for(const h of G.heroes){placeUnit(h);h.body.rotation.set(0,0,0);h.body.position.set(0,0,0);}
  refreshUI();buildOrder();fitCamera();
  if(!first)await fade(0,380);
  banner(G.mode==='arena'?`Masmorra de ${G.opp.name}`:R.boss?DEFS[R.enemies[0].k].name:R.name,G.mode==='arena'?'Invasão':`Sala ${i+1} de ${G.rooms.length}`,R.sub,!!R.boss,1700);
  await wait(500);
  await Promise.all(G.enemies.map((e,j)=>wait(j*170).then(()=>dropIn(e))));
  if(R.boss){sfx.roar();shake(.5);await wait(700);}
  if(my!==G.loopId)return;
  initTimers();refreshUI();
  G.state='battle';battleLoop();
}
function tickStart(u){
  for(const k in u.cds)if(u.cds[k]>0)u.cds[k]--;
  for(const s of u.status){
    if((s.type==='burn'||s.type==='poison')&&u.alive){
      const d=Math.min(u.hp,s.value);u.hp-=d;floatText(u,'-'+d,s.type);flash(u);
      burst(u.center(),s.type==='burn'?'#ff7a2a':'#8dff6a',10,2,.3,.5);
      if(u.hp<=0){kill(u);break;}
    }
  }
  u.refresh();refreshUI();
}
function endTurn(u){
  for(const s of u.status){if(s.fresh)s.fresh=false;else s.turns--;}
  u.status=u.status.filter(s=>s.turns>0&&!(s.type==='shield'&&s.value<=0));
  u.refresh();
}
function askPlayer(u){
  return new Promise(res=>{
    G.pending=c=>{G.pending=null;G.valid=[];G.sel=null;res(c);};
    skillsEl.classList.remove('wait');
    selectAbility(u,u.def.abilities[0]);
    setHint(`Vez de <b>${u.def.name}</b> · toque num inimigo para atacar ou escolha uma habilidade.${G.enemies.some(e=>e.alive&&elemMult(u.el,e.el)!==1)?' <span class="up">▲ dano extra</span> · <span class="down">▼ resistido</span>':''}`);
  });
}
async function perform(u,c){
  const ab=AB[c.ab];
  if(ab.cd)u.cds[c.ab]=ab.cd;
  if(ab.cd||ab.callout)floatText(u,abName(u,c.ab),'callout'+(u.side==='enemy'?' foe':''));
  if(c.target&&c.target!==u)await faceTo(u,c.target.root.position,140);
  await ab.run(u,c.target);
  if(u.alive)await faceYaw(u,u.homeYaw,170);
  refreshUI();
}
async function battleLoop(){
  const my=G.loopId;
  while(G.state==='battle'&&my===G.loopId){
    const alive=allUnits().filter(u=>u.alive);if(!alive.length)return;
    let u=alive[0];for(const v of alive)if(v.timer<u.timer)u=v;
    G.clock=u.timer;G.current=u;G.stats.turns++;
    const hasAdv=markAdvantage(u);
    buildOrder();refreshUI();
    tickStart(u);
    await waitDeaths();
    if(my!==G.loopId||await checkEnd())return;
    if(u.alive){
      if(hasStatus(u,'stun')){
        skillsEl.classList.add('wait');setHint(`<b class="${u.side==='enemy'?'foe':''}">${esc(u.def.short||u.def.name)}</b> está atordoado e perde a vez.`);
        floatText(u,'Atordoado','lab');await wait(700);
      }else{
        let choice;
        if(u.side==='hero'){
          renderSkills(u);
          if(G.auto){skillsEl.classList.add('wait');setHint(`<b>${u.def.name}</b> age sozinho (AUTO).`);await wait(260);choice=heroAI(u);}
          else choice=await askPlayer(u);
        }else{
          skillsEl.classList.add('wait');setHint(`Vez de <b class="foe">${esc(u.def.short||u.def.name)}</b>…`);
          await wait(420);choice=enemyAI(u);
        }
        if(my!==G.loopId)return;
        skillsEl.classList.add('wait');refreshCards();
        await perform(u,choice);
        if(my!==G.loopId)return;
      }
      endTurn(u);
    }
    u.timer+=1000/u.spd;
    await waitDeaths();
    if(my!==G.loopId||await checkEnd())return;
  }
}
async function checkEnd(){
  if(G.state!=='battle')return true;
  if(!aliveHeroes().length){await finishBattle(false);return true;}
  if(!aliveEnemies().length){
    G.cleared++;
    if(G.room<G.rooms.length-1){
      G.state='transition';G.current=null;refreshUI();
      banner('Sala limpa!','Vitória parcial','A equipe recupera 15% da vida.',false,1500);
      for(const h of aliveHeroes()){h.status=[];h.refresh();healUnit(h,h.maxHp*.15);healFx(h);
        tween(380,(k,raw)=>{h.root.position.y=Math.sin(raw*Math.PI)*.7;},E.lin);}
      sfx.heal();await wait(1500);
      enterRoom(G.room+1,false);
    }else await finishBattle(true);
    return true;
  }
  return false;
}

/* ---------- recompensas ---------- */
function computeRewards(win,quit){
  const res={win,quit,mode:G.mode,xp:[],gold:0,stars:0,unlocked:null,delta:0};
  const team=G.heroes.map(h=>h.key);
  let xp=0;
  if(G.mode==='dungeon'){
    const d=G.dungeon;
    for(let i=0;i<G.cleared;i++){const boss=!!G.rooms[i].boss,L=G.rooms[i].enemies[0].lvl;xp+=roomXp(L)*(boss?2:1);res.gold+=roomGold(L)*(boss?3:1);}
    if(win){
      res.stars=Math.max(1,aliveHeroes().length===4?3:aliveHeroes().length>=2?2:1);
      const prev=SAVE.stars[d.id]||0;if(res.stars>prev)SAVE.stars[d.id]=res.stars;
      if(!prev){res.gold+=100*d.lvl;res.firstClear=true;}
      if(d.unlockHero&&!SAVE.unlocked.includes(d.unlockHero)){SAVE.unlocked.push(d.unlockHero);res.unlocked=d.unlockHero;}
    }
  }else{
    const avg=team.reduce((s,k)=>s+lvlOf(k),0)/4;
    const exp=1/(1+Math.pow(10,(G.opp.rating-SAVE.rating)/400));
    res.delta=clamp(Math.round(32*((win?1:0)-exp)),-32,32);
    SAVE.rating=Math.max(0,SAVE.rating+res.delta);
    if(win)SAVE.wins++;else SAVE.losses++;
    res.gold=win?Math.round(60+6*avg):15;xp=win?50:15;
  }
  SAVE.gold+=res.gold;
  for(const k of team){const before={lvl:lvlOf(k),xp:SAVE.heroes[k].xp};const r=grantXp(k,xp);res.xp.push({k,before,gained:xp,to:r.to});}
  persist();
  return res;
}
async function finishBattle(win,quit=false){
  G.state='end';G.loopId++;G.current=null;G.valid=[];if(G.pending){G.pending=null;}skillsEl.classList.add('wait');refreshUI();
  const res=computeRewards(win,quit);
  if(G.mode==='arena')Net.reportArena(G.opp,win,res.delta);
  if(!quit){
    if(win){sfx.win();banner('Vitória!',G.mode==='arena'?'Invasão concluída':`${DEFS[G.dungeon.boss].short} caiu`,'',false,1800);
      for(let r=0;r<2;r++)await Promise.all(aliveHeroes().map(h=>tween(420,(k,raw)=>{h.root.position.y=Math.sin(raw*Math.PI)*.9;h.root.rotation.y=h.homeYaw+raw*Math.PI*2;},E.lin)));}
    else{sfx.lose();banner('Derrota','A equipe caiu','',true,1800);await wait(1400);}
    await wait(400);
  }
  topEl.hidden=true;bottomEl.hidden=true;bannerEl.hidden=true;
  showResults(res);
}

/* ---------- controles da batalha ---------- */
$('#btnAuto').addEventListener('click',e=>{
  G.auto=!G.auto;syncTools();sfx.click();try{localStorage.setItem('masmorra-auto',G.auto?'1':'0');}catch(err){}
  if(G.auto&&G.pending&&G.current)G.pending(heroAI(G.current));
});
$('#btnSpeed').addEventListener('click',()=>{G.speed=G.speed===1?2:1;syncTools();sfx.click();try{localStorage.setItem('masmorra-speed',String(G.speed));}catch(err){}});
$('#btnSound').addEventListener('click',e=>{muted=!muted;audio();syncTools();try{localStorage.setItem('masmorra-mute',muted?'1':'0');}catch(err){}});
$('#btnExit').addEventListener('click',()=>{
  if(G.state!=='battle'&&G.state!=='transition')return;
  sfx.click();G.paused=true;
  show(`<div class="panel center" style="width:min(400px,100%)"><h2 class="h2">Sair da batalha?</h2>
    <p class="small muted" style="margin:0">${G.mode==='arena'?'A invasão conta como derrota.':'Você fica com a recompensa das salas que já limpou.'}</p>
    <div class="row" style="justify-content:center"><button class="btn" type="button" id="stay">Continuar lutando</button><button class="btn red" type="button" id="leave">Sair</button></div></div>`);
  on('#stay',()=>{sfx.click();G.paused=false;screenEl.hidden=true;});
  on('#leave',()=>{sfx.click();G.paused=false;screenEl.hidden=true;finishBattle(false,true);});
});
function syncTools(){
  const a=$('#btnAuto');a.classList.toggle('on',G.auto);a.setAttribute('aria-pressed',G.auto);
  const s=$('#btnSpeed');s.textContent=G.speed+'x';s.classList.toggle('on',G.speed>1);
  const m=$('#btnSound');m.innerHTML=`<svg><use href="#${muted?'i-mute':'i-sound'}"/></svg>`;m.setAttribute('aria-label',muted?'Ligar som':'Desligar som');
}
document.addEventListener('keydown',e=>{
  if(!G.pending||!G.current)return;
  const n=parseInt(e.key,10);
  if(n>=1&&n<=3){const id=G.current.def.abilities[n-1];if(id)onAbilityTap(id);}
  if(e.key==='Enter'||e.key===' '){const a=AB[G.sel];if(a&&G.valid.length){e.preventDefault();onUnitTap(a.target==='enemy'?bestFoe(G.current):a.target==='ally'?aliveHeroes().sort((x,y)=>ratio(x)-ratio(y))[0]:G.valid[0]);}}
});
