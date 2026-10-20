/* ================= telas de menu ================= */
const coinSvg='<svg class="coin"><use href="#i-coin"/></svg>';
const trophySvg='<svg class="trophy"><use href="#i-trophy"/></svg>';
const purse=()=>`<span class="purse" id="purse">${coinSvg}${fmt(SAVE.gold)}</span>`;
const backBtn=`<button class="back" type="button" data-back aria-label="Voltar"><svg><use href="#i-back"/></svg></button>`;
const starsRow=n=>`<span class="ms">${[0,1,2].map(i=>`<svg class="${i<n?'on':''}"><use href="#i-star"/></svg>`).join('')}</span>`;
function show(html,{clear=false,back=null}={}){
  screenEl.hidden=false;screenEl.classList.toggle('clear',clear);screenEl.innerHTML=html;screenEl.scrollTop=0;
  const b=screenEl.querySelector('[data-back]');if(b)b.addEventListener('click',()=>{sfx.click();(back||showHub)();});
}
const on=(sel,fn,ev='click')=>{const el=screenEl.querySelector(sel);if(el)el.addEventListener(ev,fn);return el;};
const totalStars=()=>Object.values(SAVE.stars).reduce((a,b)=>a+b,0);
const unlockedDungeon=i=>i===0||(SAVE.stars[DUNGEONS[i-1].id]||0)>0;
function unlockSource(k){const d=DUNGEONS.find(x=>x.unlockHero===k);return d?`Vença ${DEFS[d.boss].short} em ${d.name}`:'';}

/* ---------- início ---------- */
let hubLog=[];
function showHub(){
  if(G.state!=='menu'||G.heroes.map(h=>h.key).join()!==SAVE.team.join()||G.heroes.some(h=>h.lvl!==lvlOf(h.key)))showcase(SAVE.team,'goblin');
  const pw=teamPower(teamList(SAVE.team));
  show(`<div class="hub"><div class="panel" style="width:100%">
    <div><p class="eyebrow">RPG de masmorra · combate por turnos</p><h1 class="title">Masmorra do Rei Ogro</h1></div>
    <div class="who"><input id="nameIn" maxlength="20" autocomplete="off" placeholder="Seu nome de aventureiro" value="${esc(SAVE.name)}" aria-label="Seu nome de aventureiro">${purse()}</div>
    <div class="row"><span class="purse">${trophySvg}${fmt(SAVE.rating)} troféus</span><span class="purse"><svg style="fill:#ffb347"><use href="#i-bolt"/></svg>${fmt(pw)} de poder</span></div>
    <div class="menu">
      <button class="mbtn primary" type="button" id="goMap" style="--mc:#b9740c"><span class="mi"><svg><use href="#i-map"/></svg></span><span><b>Masmorras</b><span>${DUNGEONS.length} masmorras · ${totalStars()} de ${DUNGEONS.length*3} estrelas</span></span></button>
      <button class="mbtn" type="button" id="goArena" style="--mc:#c8283a"><span class="mi"><svg><use href="#i-swords"/></svg></span><span><b>Invasão</b><span>Ataque a masmorra de outros jogadores e suba no ranking</span></span></button>
      <button class="mbtn" type="button" id="goHeroes" style="--mc:#2a6f8a"><span class="mi"><svg><use href="#i-users"/></svg></span><span><b>Heróis</b><span>${SAVE.unlocked.length} de ${HERO_KEYS.length} recrutados · treine e evolua</span></span></button>
    </div>
    ${hubLog.length?`<div class="well loglist"><b style="color:var(--ink)">Enquanto você estava fora</b>${hubLog.map(l=>`<span>${esc(l.name)} invadiu sua masmorra e ${l.won?'perdeu':'venceu'} (${l.delta>=0?'+':''}${l.delta} troféus)</span>`).join('')}</div>`:''}
    <p class="netline"><span class="dot ${Net.online?'on':''}"></span>${esc(Net.status)}</p>
  </div></div>`,{clear:true});
  const inp=on('#nameIn',()=>{SAVE.name=inp.value.trim().slice(0,20);persist();},'change');
  on('#goMap',()=>{sfx.click();showMap();});
  on('#goArena',()=>{sfx.click();if(!SAVE.name){toast('Escolha um nome de aventureiro antes de invadir.');inp.focus();return;}showArena();});
  on('#goHeroes',()=>{sfx.click();showHeroes();});
}

/* ---------- mapa ---------- */
let mapSel=null;
function showMap(){
  if(mapSel===null){mapSel=DUNGEONS.findIndex((d,i)=>unlockedDungeon(i)&&!SAVE.stars[d.id]);if(mapSel<0)mapSel=DUNGEONS.length-1;}
  const line=(fx,fy)=>DUNGEONS.map(d=>`${d[fx]},${d[fy]}`).join(' ');
  const nodes=DUNGEONS.map((d,i)=>{const lock=!unlockedDungeon(i),st=SAVE.stars[d.id]||0,next=!lock&&!st;const el=DEFS[d.boss].el;
    return `<button class="mnode${lock?' locked':''}${next?' next':''}" type="button" data-d="${i}" style="--x:${d.x}%;--y:${d.y}%;--mx:${d.mx}%;--my:${d.my}%;--elc:${ELEM[el].c}" aria-label="${d.name}${lock?', bloqueada':''}">
      <span class="mc"><svg><use href="#${lock?'i-lock':ELEM[el].i}"/></svg></span><span class="mn">${d.name}</span><span class="ml">Nível ${d.lvl}</span>${starsRow(st)}</button>`;}).join('');
  show(`<div class="panel wide">
    <div class="head">${backBtn}<h2 class="h2 grow">Mapa das Masmorras</h2>${purse()}</div>
    <div class="map">
      <svg class="path p-land" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line('x','y')}" fill="none" stroke="#c9a04666" stroke-width="1.2" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>
      <svg class="path p-port" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line('mx','my')}" fill="none" stroke="#c9a04666" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>
      ${nodes}
    </div>
    <div class="well mapinfo" id="mapInfo"></div>
  </div>`);
  screenEl.querySelectorAll('.mnode').forEach(b=>b.addEventListener('click',()=>{sfx.click();mapSel=+b.dataset.d;renderMapInfo();}));
  renderMapInfo();
}
function renderMapInfo(){
  const d=DUNGEONS[mapSel],lock=!unlockedDungeon(mapSel),st=SAVE.stars[d.id]||0,boss=DEFS[d.boss];
  const pw=teamPower(teamList(SAVE.team)),rec=recPower(d.lvl);
  const reward=d.unlockHero&&!SAVE.unlocked.includes(d.unlockHero)?`Recompensa: recruta <b style="color:var(--ink)">${DEFS[d.unlockHero].name}</b> (${DEFS[d.unlockHero].role}).`:st?'Repita para ganhar mais ouro e experiência.':`Primeira vitória: +${fmt(100*d.lvl)} de ouro.`;
  $('#mapInfo').innerHTML=`${ptHtml(d.boss,d.lvl+1,'boss')}
    <div class="grow"><p class="h3">${d.name}</p><p class="small muted" style="margin:2px 0 0">Chefe: ${boss.name} · ${ELEM[boss.el].n}. Nível ${d.lvl}, 3 salas.</p>
    <p class="small muted" style="margin:2px 0 0">${lock?`Bloqueada: vença ${DUNGEONS[mapSel-1].name} primeiro.`:reward}</p>
    <p class="small" style="margin:4px 0 0">Poder da equipe <b class="${pw>=rec?'ok':'bad'}">${fmt(pw)}</b> / recomendado ${fmt(rec)}</p></div>
    <button class="btn gold" type="button" id="goTeam" ${lock?'disabled':''}>Montar equipe</button>`;
  $('#goTeam').addEventListener('click',()=>{sfx.click();showTeam('dungeon',d);});
}

/* ---------- seleção de equipe com vitrine 3D ---------- */
function advVs(k,boss){if(!boss)return 0;const a=elemMult(DEFS[k].el,boss.el);return a>1?1:a<1?-1:0;}
function heroTile(k,{sel=-1,focus=false,boss=null}={}){
  const locked=!SAVE.unlocked.includes(k),d=DEFS[k],adv=locked?0:advVs(k,boss);
  return `<button class="ht${sel>=0?' sel':''}${locked?' locked':''}${focus?' focus':''}" type="button" data-k="${k}" aria-pressed="${sel>=0}">
    ${sel>=0?`<span class="num">${sel+1}</span>`:''}${adv?`<span class="advb ${adv>0?'up':'down'}" title="${adv>0?'Forte':'Fraco'} contra o chefe">${adv>0?'▲':'▼'}</span>`:''}
    ${ptHtml(k,locked?0:lvlOf(k))}<b>${d.name}</b><span>${locked?unlockSource(k):TYPES[HERO_INFO[k].type].n+' · '+d.role}</span>${locked?'':`<span class="pw">${fmt(heroPower(k,lvlOf(k)))} poder</span>`}</button>`;
}
function elemLine(el){
  const o=el==='luz'?'sombra':el==='sombra'?'luz':null;
  return `<span class="up">▲ Forte contra ${ELEM[o||beatsOf(el)].n}</span><span class="down">▼ Fraco contra ${ELEM[o||weakTo(el)].n}</span>`;
}
function heroCard(k,{boss=null,action=''}={}){
  const d=DEFS[k],info=HERO_INFO[k],T=TYPES[info.type],locked=!SAVE.unlocked.includes(k),L=lvlOf(k);
  let vs='';
  if(boss&&!locked){
    const a=elemMult(d.el,boss.el),b=elemMult(boss.el,d.el),n=boss.short;
    vs=a>1&&b>1?`<div class="vsboss up">▲ Causa 150% de dano em ${n}, mas também sofre dano extra dele.</div>`
      :a>1?`<div class="vsboss up">▲ Causa 150% de dano em ${n} e resiste aos ataques dele.</div>`
      :a<1?`<div class="vsboss down">▼ Causa só 70% de dano em ${n} e sofre dano extra dele.</div>`
      :`<div class="vsboss even">Sem vantagem nem desvantagem contra ${n}.</div>`;
  }
  const bar=(lab,v,max,c,txt)=>`<span>${lab}</span><span class="sbar" style="--c:${c}"><i style="width:${Math.min(100,v/max*100)}%"></i></span><span>${txt}</span>`;
  return `<aside class="hcard" style="--elc:${ELEM[d.el].c}">
    <div class="pv" id="pv">${locked?`<span class="lockmsg"><svg><use href="#i-lock"/></svg>Bloqueado</span>`:''}<span class="pv-hint">Arraste para girar</span></div>
    <div class="hc-body">
      <div class="hc-name"><b>${d.name}</b>${locked?'':`<span class="lvpill">Nível ${L}</span>`}</div>
      <div class="chips"><span class="chip" style="--c:${T.c}" title="${T.d}">${T.n}</span><span class="chip" style="--c:${ELEM[d.el].c}"><svg class="gem"><use href="#${ELEM[d.el].i}"/></svg>${ELEM[d.el].n}</span><span class="chip plain">${d.role}</span></div>
      <p class="bio">${locked?`<b>${unlockSource(k)} para recrutar.</b> `:''}${info.bio}</p>
      <div class="elrow">${elemLine(d.el)}</div>
      ${vs}
      <div class="sbars">${bar('Vida',d.hp,1500,'#6fe38c',fmt(d.hp*lm(L)))}${bar('Ataque',d.atk,150,'#ff7a6e',fmt(d.atk*lm(L)))}${bar('Velocid.',d.spd,125,'#7cc7ff',d.spd)}</div>
      <div class="abchips">${d.abilities.map((id,i)=>`<div class="abchip" style="--elc:${ELEM[d.el].c}"><span class="ai"><svg><use href="#${AB[id].icon}"/></svg></span><div><b>${AB[id].name}</b> <span>${i?`· recarga ${AB[id].cd} turnos`:'· básico'}</span><br><span>${AB[id].desc}</span></div></div>`).join('')}</div>
      ${action}
    </div></aside>`;
}
function elemHelp(boss){
  const counter=boss?weakTo(boss.el):null;
  return `<div class="well elhelp">${elemTriangle()}<p><b>Triângulo de elementos.</b> A seta aponta para quem leva dano extra. Vantagem causa <b>150%</b> de dano; desvantagem, só <b>70%</b>. Luz e Sombra causam dano extra uma na outra.${boss?`<br>${boss.short} é de <b style="color:${ELEM[boss.el].c}">${ELEM[boss.el].n}</b>. Leve heróis de <b style="color:${ELEM[counter].c}">${ELEM[counter].n}</b> (marcados com ▲).`:''}</p></div>`;
}
let teamFocus=null;
function showTeam(mode,d){
  let picks=(mode==='defense'?SAVE.defense:SAVE.team).slice();
  const boss=d?DEFS[d.boss]:null;
  let focus=teamFocus&&HERO_KEYS.includes(teamFocus)?teamFocus:picks[0];
  const back=mode==='dungeon'?showMap:()=>showArena(mode==='defense'?'def':'opps');
  const head={dungeon:['Monte sua equipe',d?d.name:''],defense:['Equipe de defesa','Invasão'],attack:['Equipe de ataque','Invasão']}[mode];
  const go={dungeon:'Entrar na masmorra',defense:'Salvar defesa',attack:'Salvar equipe'}[mode];
  const toggle=k=>{
    if(!SAVE.unlocked.includes(k)){toast(`${DEFS[k].name}: ${unlockSource(k)}.`);return;}
    const i=picks.indexOf(k);
    if(i>=0)picks.splice(i,1);else if(picks.length<4)picks.push(k);else{toast('Equipe cheia. Tire alguém antes de adicionar.');return;}
    render();
  };
  const render=()=>{
    const y=screenEl.scrollTop,locked=!SAVE.unlocked.includes(focus),inTeam=picks.includes(focus);
    const action=locked?'':`<button class="btn ${inTeam?'':'gold'}" type="button" id="toggle" ${!inTeam&&picks.length>=4?'disabled':''}>${inTeam?'Tirar da equipe':picks.length>=4?'Equipe cheia':'Adicionar à equipe'}</button>`;
    const pw=teamPower(teamList(picks)),rec=d?recPower(d.lvl):0;
    show(`<div class="panel wide">
      <div class="head">${backBtn}<div class="grow"><p class="eyebrow">${head[1]}</p><h2 class="h2">${head[0]}</h2></div>${purse()}</div>
      <div class="teamlay">${heroCard(focus,{boss,action})}
        <div class="teamright">
          ${mode==='defense'?`<p class="small muted" style="margin:0">Esta equipe defende sua masmorra quando outros jogadores invadem. Ela luta sozinha, com a IA do modo AUTO.</p>`:''}
          ${elemHelp(boss)}
          <p class="small muted" style="margin:0">Toque num herói para ver a ficha. Toque de novo para colocar ou tirar da equipe.</p>
          <div class="tgrid">${HERO_KEYS.map(k=>heroTile(k,{sel:picks.indexOf(k),focus:k===focus,boss})).join('')}</div>
          <div class="footbar">
            <div class="slots">${[0,1,2,3].map(i=>picks[i]?`<button class="slot-btn" type="button" data-rm="${picks[i]}" aria-label="Tirar ${DEFS[picks[i]].name} da equipe">${ptHtml(picks[i],lvlOf(picks[i]))}</button>`:`<span class="slot">${i+1}</span>`).join('')}
              <span class="power"><svg><use href="#i-bolt"/></svg>${fmt(pw)}${d?` <span class="small muted">/ ${fmt(rec)}</span>`:''}</span></div>
            <button class="btn gold" type="button" id="goTeam" ${picks.length===4?'':'disabled'}>${go}</button>
          </div>
        </div>
      </div></div>`,{back});
    screenEl.scrollTop=y;
    Preview.mount($('#pv'),focus,locked);
    screenEl.querySelectorAll('.ht').forEach(b=>b.addEventListener('click',()=>{sfx.click();const k=b.dataset.k;if(k===focus){toggle(k);return;}focus=teamFocus=k;render();}));
    screenEl.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{sfx.click();picks=picks.filter(x=>x!==b.dataset.rm);render();}));
    on('#toggle',()=>{sfx.click();toggle(focus);});
    on('#goTeam',()=>{
      if(picks.length!==4)return;sfx.click();
      if(mode==='defense'){SAVE.defense=picks.slice();persist();Net.publishProfile();toast('Defesa salva.');showArena('def');}
      else if(mode==='attack'){SAVE.team=picks.slice();persist();showcase(SAVE.team,'arena');showArena('opps');}
      else{SAVE.team=picks.slice();persist();startDungeon(d);}
    });
  };
  render();
}

/* ---------- heróis ---------- */
let heroFocus='brom';
function showHeroes(){
  const k=heroFocus,locked=!SAVE.unlocked.includes(k),h=SAVE.heroes[k],L=h.lvl,cost=trainCost(L),max=L>=MAX_LVL,d=DEFS[k];
  const action=locked?'':`<div style="display:flex;flex-direction:column;gap:6px">
    <p class="small" style="margin:0">${max?'Nível máximo alcançado.':`Experiência ${fmt(h.xp)} / ${fmt(xpNeed(L))}`}</p>${max?'':`<div class="xp"><i style="width:${h.xp/xpNeed(L)*100}%"></i></div>`}
    <button class="btn gold" type="button" id="train" ${max||SAVE.gold<cost?'disabled':''}>${max?'Nível máximo':`Treinar até o nível ${L+1} · ${fmt(cost)} de ouro`}</button></div>`;
  show(`<div class="panel wide">
    <div class="head">${backBtn}<h2 class="h2 grow">Heróis</h2>${purse()}</div>
    <div class="teamlay">${heroCard(k,{action})}
      <div class="teamright">${elemHelp(null)}
        <div class="tgrid">${HERO_KEYS.map(x=>heroTile(x,{focus:x===k})).join('')}</div>
        <p class="small muted" style="margin:0">Cada nível dá +10% de vida e de ataque. Heróis ganham experiência lutando ou treinando com ouro.</p>
      </div></div></div>`);
  Preview.mount($('#pv'),k,locked);
  screenEl.querySelectorAll('.ht').forEach(b=>b.addEventListener('click',()=>{sfx.click();heroFocus=b.dataset.k;const y=screenEl.scrollTop;showHeroes();screenEl.scrollTop=y;}));
  on('#train',()=>{
    if(SAVE.gold<cost||max)return;
    SAVE.gold-=cost;h.lvl++;h.xp=0;persist();sfx.level();sfx.coin();
    toast(`${d.name} subiu para o nível ${h.lvl}!`);
    const hu=G.heroes.find(u=>u.key===k);if(hu){burst(hu.center(),'#ffd75e',30,4,.4,.8,0,.6);healFx(hu);}
    const y=screenEl.scrollTop;showHeroes();screenEl.scrollTop=y;
  });
}

/* ---------- invasão (PvP assíncrono) ---------- */
let arenaTab='opps',oppCache=null;
function oppCard(o,i){
  return `<div class="opp"><div class="on"><span class="nm">${esc(o.name)}${o.bot?' <span class="small muted">· simulado</span>':''}</span>
    <span class="meta"><span>${trophySvg.replace('class="trophy"','class="trophy" style="width:14px;height:14px;vertical-align:-2px"')} ${fmt(o.rating)}</span><span>Poder ${fmt(o.power)}</span></span>
    <span class="minis">${o.team.map(t=>ptHtml(t.k,t.lvl)).join('')}</span></div>
    <button class="btn red" type="button" data-opp="${i}"><svg><use href="#i-swords"/></svg>Invadir</button></div>`;
}
async function showArena(tab){
  if(tab)arenaTab=tab;
  if(G.state!=='menu'||!G.heroes.length)showcase(SAVE.team,'arena');else setStage('arena',false);
  const tabs=[['opps','Oponentes'],['rank','Ranking'],['def','Defesa']];
  show(`<div class="panel wide">
    <div class="head">${backBtn}<div class="grow"><p class="eyebrow">${Net.online?'Online':'Offline · oponentes simulados'}</p><h2 class="h2">Invasão</h2></div>${purse()}</div>
    <div class="row"><span class="purse">${trophySvg}${fmt(SAVE.rating)} troféus</span><span class="purse">${SAVE.wins} vitórias · ${SAVE.losses} derrotas</span></div>
    <div class="tabs" role="tablist">${tabs.map(([k,n])=>`<button class="tab${arenaTab===k?' on':''}" type="button" role="tab" aria-selected="${arenaTab===k}" data-tab="${k}">${n}</button>`).join('')}</div>
    <div id="arenaBody" style="display:flex;flex-direction:column;gap:10px"><p class="small muted">Carregando…</p></div>
  </div>`);
  screenEl.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{sfx.click();arenaTab=b.dataset.tab;showArena();}));
  const body=$('#arenaBody');
  if(arenaTab==='opps'){
    if(!oppCache)oppCache=await Net.opponents();
    if(screenEl.querySelector('#arenaBody')!==body)return;
    body.innerHTML=`<p class="small muted" style="margin:0">Sua equipe atual (${SAVE.team.map(k=>DEFS[k].name).join(', ')}) ataca a equipe de defesa do oponente. Vencer dá troféus, ouro e experiência.</p>
      ${oppCache.map(oppCard).join('')}
      <div class="row"><button class="btn" type="button" id="reroll">Buscar outros oponentes</button><button class="btn" type="button" id="chTeam">Trocar equipe de ataque</button></div>`;
    body.querySelectorAll('[data-opp]').forEach(b=>b.addEventListener('click',()=>{sfx.click();const o=oppCache[+b.dataset.opp];oppCache=null;startArena(o);}));
    on('#reroll',async()=>{sfx.click();oppCache=await Net.opponents();showArena();});
    on('#chTeam',()=>{sfx.click();showTeam('attack');});
  }else if(arenaTab==='rank'){
    const lb=await Net.leaderboard();
    if(screenEl.querySelector('#arenaBody')!==body)return;
    if(!lb){body.innerHTML=`<p class="small muted">O ranking global aparece quando o jogo está conectado ao servidor.</p>`;return;}
    body.innerHTML=lb.length?`<div class="rank">${lb.map((p,i)=>`<div class="rk${p.uid===Net.uid?' me':''}"><b>${i+1}</b><span class="rn">${esc(p.name)}</span><span class="small muted">Poder ${fmt(p.power)}</span><span>${fmt(p.rating)}</span></div>`).join('')}</div>`:`<p class="small muted">Ninguém no ranking ainda. Seja o primeiro: invada uma masmorra.</p>`;
  }else{
    const def=teamList(SAVE.defense);
    body.innerHTML=`<div class="opp"><div class="on"><span class="nm">Sua masmorra</span><span class="meta"><span>Poder ${fmt(teamPower(def))}</span></span><span class="minis">${def.map(t=>ptHtml(t.k,t.lvl)).join('')}</span></div>
      <button class="btn gold" type="button" id="chDef">Mudar defesa</button></div>
      <p class="small muted" style="margin:0">${Net.online?'Quando alguém invade e perde, você ganha troféus. Os resultados aparecem quando você abre o jogo.':'Com o jogo conectado ao servidor, outros jogadores invadem esta equipe.'}</p>
      ${SAVE.log.length?`<div class="well loglist">${SAVE.log.map(l=>`<span>${esc(l.name)} invadiu e ${l.won?'perdeu':'venceu'} (${l.delta>=0?'+':''}${l.delta})</span>`).join('')}</div>`:''}`;
    on('#chDef',()=>{sfx.click();showTeam('defense');});
  }
}
/* ---------- resultado ---------- */
function showResults(res){
  const title=res.quit?'Retirada':res.win?'Vitória!':'Derrota';
  const eyebrow=res.mode==='arena'?`Invasão · ${esc(G.opp.name)}`:res.win?`${G.dungeon.name} conquistada`:`${G.dungeon.name} · ${G.cleared} de ${G.rooms.length} salas`;
  const xpRows=res.xp.map(x=>{const L=SAVE.heroes[x.k].lvl,cur=SAVE.heroes[x.k].xp,max=L>=MAX_LVL,up=x.to>x.before.lvl;
    return `<div class="xprow">${ptHtml(x.k,L)}<div style="min-width:0;display:flex;flex-direction:column;gap:4px"><span class="nm"><span>${DEFS[x.k].name}</span>${up?`<span class="up">Nível ${x.before.lvl} → ${L}!</span>`:`<span class="small muted">Nível ${L}</span>`}</span>
      <div class="xp"><i data-w="${max?100:cur/xpNeed(L)*100}" style="width:${up?0:x.before.xp/xpNeed(x.before.lvl)*100}%"></i></div></div><span class="small" style="font-weight:800;color:#9fd8ff">+${x.gained} XP</span></div>`;}).join('');
  const tip=res.win?'':res.mode==='arena'?'Treine seus heróis ou troque a equipe de ataque para aproveitar elementos.':'Treine os heróis em Heróis, repita masmorras anteriores para ganhar experiência e use o escudo antes do golpe telegrafado do chefe.';
  show(`<div class="panel center">
    <div><p class="eyebrow">${eyebrow}</p><h1 class="title">${title}</h1></div>
    ${res.mode==='dungeon'&&res.win?`<div class="stars">${[0,1,2].map(i=>`<svg class="${i<res.stars?'on':''}" style="animation-delay:${i*.18}s"><use href="#i-star"/></svg>`).join('')}</div>`:''}
    ${res.mode==='arena'?`<p class="h3" style="color:${res.delta>=0?'var(--heal)':'#ff9aa4'}">${res.delta>=0?'+':''}${res.delta} troféus · total ${fmt(SAVE.rating)}</p>`:''}
    ${res.unlocked?`<div class="well row" style="justify-content:center">${ptHtml(res.unlocked,1)}<span><b>${DEFS[res.unlocked].name}</b> (${DEFS[res.unlocked].role}) entrou para a equipe!</span></div>`:''}
    ${tip?`<p class="lead small muted" style="margin-inline:auto">${tip}</p>`:''}
    <div class="xprows" style="text-align:left">${xpRows}</div>
    <div class="stats3"><div class="stat"><b>${G.stats.turns}</b><span>Turnos</span></div><div class="stat"><b>${fmt(G.stats.dmg)}</b><span>Dano</span></div><div class="stat"><b style="color:var(--gold)">+${fmt(res.gold)}</b><span>Ouro${res.firstClear?' (1ª vitória)':''}</span></div></div>
    <div class="row" style="justify-content:center">
      <button class="btn" type="button" id="again">${res.mode==='arena'?'Outra invasão':'Repetir masmorra'}</button>
      <button class="big-btn" type="button" id="cont" style="min-width:200px">Continuar</button>
    </div>
  </div>`);
  if(res.gold)setTimeout(sfx.coin,300);
  if(res.xp.some(x=>x.to>x.before.lvl))setTimeout(sfx.level,600);
  requestAnimationFrame(()=>requestAnimationFrame(()=>screenEl.querySelectorAll('.xp i[data-w]').forEach(i=>{i.style.width=i.dataset.w+'%';})));
  on('#cont',()=>{sfx.click();if(res.mode==='arena')showArena('opps');else{mapSel=null;showcase(SAVE.team,'goblin');showMap();}});
  on('#again',()=>{sfx.click();if(res.mode==='arena'){showArena('opps');}else startDungeon(G.dungeon);});
}
