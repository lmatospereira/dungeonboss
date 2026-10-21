/* ================= dados: heróis, inimigos, masmorras, progresso ================= */
/* Todos os números vêm de data/*.json (constante DATA, embutida pelo build).
   Aqui só montamos as estruturas usadas pelo jogo e as fórmulas. */
const flat=e=>{const {view,...rest}=e;return{...rest,...view};};
const DEFS=Object.fromEntries([
  ...Object.entries(DATA.heroes.heroes),...Object.entries(DATA.enemies.enemies),...Object.entries(DATA.enemies.bosses)
].map(([k,v])=>[k,flat(v)]));
const HERO_KEYS=DATA.heroes.order;
const STARTERS=DATA.heroes.starters;
const DUNGEONS=DATA.dungeons.dungeons;
const PROG=DATA.progression;
const MAX_LVL=PROG.maxLevel;
const lm=L=>1+PROG.levelBonus*(L-1);
const xpNeed=L=>PROG.xpNeed.base+PROG.xpNeed.perLevel*L;
const trainCost=L=>Math.round(PROG.trainCost.perLevel*L*Math.pow(PROG.trainCost.growth,L-1));

/* ---------- evolução (1 a 3) ---------- */
/* Evolução 2: bônus de atributos e o 4º poder. Evolução 3: mais bônus e a arma lendária (data/heroes.json → weapon). */
const MAX_EVO=PROG.evolution.max;
const EVO_MULT=PROG.evolution.mult;
const EVO_REQ=PROG.evolution.require;
const WEAPONS=Object.fromEntries(HERO_KEYS.map(k=>[k,{...DATA.heroes.heroes[k].weapon,color:parseInt(DATA.heroes.heroes[k].weapon.color.slice(1),16)}]));
function heroStats(k,L=1,evo=1){
  const d=DEFS[k],m=lm(L)*(EVO_MULT[evo]||1),w=evo>=3?WEAPONS[k]:null;
  return{hp:Math.round(d.hp*m*(1+(w&&w.hp||0))),atk:d.atk*m*(1+(w&&w.atk||0)),spd:d.spd+(w&&w.spd||0),crit:(d.crit??.1)+(w&&w.crit||0),dr:(d.dr||0)+(w&&w.dr||0)};
}
function heroAbilities(k,evo=1){const d=DEFS[k];return evo>=2&&d.ult?[...d.abilities,d.ult]:d.abilities.slice();}
function heroPower(k,L,evo=1){const s=heroStats(k,L,evo),P=PROG.power;return Math.round(s.hp*P.hp+s.atk*P.atk*(1+s.crit*P.critWeight)+(evo>=2?P.evoBonusPerLevel*lm(L):0));}
function teamPower(list){return list.reduce((s,t)=>s+heroPower(t.k,t.lvl,t.evo||1),0);}
function recPower(L){const P=PROG.power;return Math.round(4*(P.recommendedHp*P.hp+P.recommendedAtk*P.atk)*lm(L));}
const RW=PROG.rewards;
const roomXp=L=>RW.roomXp.base+RW.roomXp.perLevel*L;
const roomGold=L=>RW.roomGold.base+RW.roomGold.perLevel*L;

/* ---------- salvamento ---------- */
const SAVE_KEY='masmorra-v2';
function defaultSave(){return{v:3,name:'',gold:PROG.start.gold,crystals:PROG.start.crystals,heroes:Object.fromEntries(HERO_KEYS.map(k=>[k,{lvl:1,xp:0,evo:1}])),unlocked:[...STARTERS],stars:{},team:['brom','lyra','alva','vex'],defense:['brom','lyra','alva','vex'],rating:PROG.start.rating,wins:0,losses:0,log:[],updated:0};}
function normalizeSave(s){
  const d=defaultSave();if(!s||typeof s!=='object')return d;
  const out=Object.assign(d,s);
  for(const k of HERO_KEYS){const h=(s.heroes||{})[k];out.heroes[k]={lvl:clamp(+(h&&h.lvl)||1,1,MAX_LVL),xp:Math.max(0,+(h&&h.xp)||0),evo:clamp(+(h&&h.evo)||1,1,MAX_EVO)};}
  out.crystals=Math.max(0,Math.floor(+out.crystals||0));
  out.unlocked=[...new Set([...STARTERS,...(Array.isArray(s.unlocked)?s.unlocked:[])])].filter(k=>HERO_KEYS.includes(k));
  const okTeam=t=>Array.isArray(t)&&t.length===4&&t.every(k=>out.unlocked.includes(k))&&new Set(t).size===4;
  if(!okTeam(out.team))out.team=d.team;if(!okTeam(out.defense))out.defense=d.defense;
  out.gold=Math.max(0,Math.floor(+out.gold||0));out.rating=Math.max(0,Math.round(+out.rating||PROG.start.rating));
  if(!Array.isArray(out.log))out.log=[];out.log=out.log.slice(0,10);
  return out;
}
function loadLocal(){try{return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch(e){return defaultSave();}}
let SAVE=loadLocal();
function persist(){SAVE.updated=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}if(typeof Net!=='undefined')Net.pushSave(SAVE);}
const lvlOf=k=>SAVE.heroes[k].lvl;
const evoOf=k=>SAVE.heroes[k].evo||1;
const teamList=keys=>keys.map(k=>({k,lvl:lvlOf(k),evo:evoOf(k)}));
/* o que falta para evoluir: lista de motivos (vazia = pode evoluir) */
function evoMissing(k){
  const h=SAVE.heroes[k],next=(h.evo||1)+1,r=EVO_REQ[next];if(!r)return null;
  const miss=[];
  if(h.lvl<r.lvl)miss.push(`nível ${r.lvl}`);
  if(SAVE.crystals<r.crystals){const n=r.crystals-SAVE.crystals;miss.push(`${n} ${n>1?'cristais':'cristal'} a mais`);}
  if(SAVE.gold<r.gold)miss.push(`${fmt(r.gold-SAVE.gold)} de ouro a mais`);
  return miss;
}
function evolveHero(k){
  const h=SAVE.heroes[k],next=(h.evo||1)+1,r=EVO_REQ[next];
  if(!r||evoMissing(k).length)return false;
  SAVE.crystals-=r.crystals;SAVE.gold-=r.gold;h.evo=next;persist();return true;
}
function grantXp(k,amt){
  const h=SAVE.heroes[k],from=h.lvl;h.xp+=amt;
  while(h.lvl<MAX_LVL&&h.xp>=xpNeed(h.lvl)){h.xp-=xpNeed(h.lvl);h.lvl++;}
  if(h.lvl>=MAX_LVL)h.xp=0;
  return{from,to:h.lvl};
}

/* ---------- fichas dos heróis (vitrine de seleção) ---------- */
const TYPES=DATA.heroes.types;
const HERO_INFO=Object.fromEntries(HERO_KEYS.map(k=>[k,{type:DATA.heroes.heroes[k].type,bio:DATA.heroes.heroes[k].bio}]));
const beatsOf=el=>ELEM[el].beats;
const weakTo=el=>Object.keys(ELEM).find(e=>ELEM[e].beats===el);
