/* ================= dados: heróis, inimigos, masmorras, progresso ================= */
const DEFS={
  // heróis
  brom:{name:'Brom',role:'Guardião',el:'natureza',hp:1450,atk:92,spd:88,crit:.08,dr:.2,model:'brom',abilities:['escudo','provocar','terremoto'],height:2.2,radius:.55},
  lyra:{name:'Lyra',role:'Piromante',el:'fogo',hp:820,atk:148,spd:108,crit:.12,model:'lyra',abilities:['faisca','bolafogo','meteoros'],height:2.5,radius:.5},
  alva:{name:'Alva',role:'Clériga',el:'luz',hp:960,atk:96,spd:100,crit:.08,model:'alva',abilities:['luzsagrada','prece','bencao'],height:2.3,radius:.5},
  vex:{name:'Vex',role:'Ladino',el:'sombra',hp:880,atk:132,spd:122,crit:.3,model:'vex',abilities:['corte','veneno','execucao'],height:2.2,radius:.5},
  kai:{name:'Kai',role:'Arqueiro',el:'agua',hp:860,atk:128,spd:114,crit:.2,model:'kai',abilities:['tiro','perfurante','chuvaFlechas'],height:2.2,radius:.5},
  mira:{name:'Mira',role:'Sacerdotisa',el:'agua',hp:940,atk:94,spd:106,crit:.08,model:'mira',abilities:['jatoAgua','ondaCura','bolha'],height:2.3,radius:.5},
  rook:{name:'Rook',role:'Berserker',el:'fogo',hp:1180,atk:124,spd:96,crit:.15,dr:.08,model:'rook',abilities:['machadada','sede','redemoinho'],height:2.4,radius:.55},
  nyx:{name:'Nyx',role:'Necromante',el:'sombra',hp:840,atk:136,spd:104,crit:.1,model:'nyx',abilities:['toqueSombrio','drenar','maldicao'],height:2.4,radius:.5},
  // inimigos
  goblin:{name:'Goblin Lanceiro',el:'natureza',hp:420,atk:72,spd:96,model:'goblin',abilities:['lanca'],height:2.05,radius:.5,scale:.85},
  arqueiro:{name:'Goblin Arqueiro',el:'natureza',hp:340,atk:86,spd:114,model:'arqueiro',abilities:['flecha'],height:2.05,radius:.5,scale:.85},
  xama:{name:'Xamã do Lodo',el:'agua',hp:500,atk:74,spd:98,model:'xama',abilities:['jato','curaLodo'],height:2.3,radius:.5,scale:.9},
  esqueleto:{name:'Esqueleto Guerreiro',el:'sombra',hp:600,atk:92,spd:86,model:'esqueleto',abilities:['espada'],height:2.05,radius:.5,scale:.95},
  magoEsq:{name:'Esqueleto Arcano',el:'sombra',hp:440,atk:98,spd:104,model:'magoEsq',abilities:['raio','rajada'],height:2.3,radius:.5,scale:.95},
  diabrete:{name:'Diabrete',el:'fogo',hp:420,atk:100,spd:116,model:'diabrete',abilities:['brasa','rajadaFogo'],height:2.1,radius:.5,scale:.85},
  bruto:{name:'Bruto de Magma',el:'fogo',hp:720,atk:96,spd:84,dr:.1,model:'bruto',abilities:['pancada'],height:2.2,radius:.55,scale:1},
  // chefes
  grakk:{name:'Grakk, Chefe Goblin',short:'Grakk',el:'natureza',hp:2600,atk:100,spd:94,crit:.1,model:'grakk',abilities:['bBasic','bAoe'],boss:true,stunImmune:true,scale:1.55,height:2.3,radius:.6,
    bk:{basic:'Machadada',melee:true,aoe:'Chuva de Lanças',aoeColor:'#c9a046',aoeStatus:null,prep:'Ergue o Machado',big:'Golpe Devastador',bigColor:'#ffcf5a',rage:'Grito de Guerra',adds:'goblin',quote:'Grakk ergue o machado'}},
  lich:{name:'Morvhal, o Lich',short:'Morvhal',el:'sombra',hp:3100,atk:118,spd:100,crit:.1,model:'lich',abilities:['bBasic','bAoe'],boss:true,stunImmune:true,scale:1.55,height:2.3,radius:.6,
    bk:{basic:'Raio da Morte',melee:false,boltColor:'#5ef0a0',aoe:'Praga',aoeColor:'#5ef0a0',aoeStatus:'poison',prep:'Canaliza a Ceifa',big:'Ceifa das Almas',bigColor:'#5ef0a0',rage:'Erguer os Mortos',adds:'esqueleto',quote:'Morvhal canaliza energia'}},
  gorruk:{name:'Gorruk, Rei Ogro do Lodo',short:'Gorruk',el:'agua',hp:3900,atk:138,spd:92,crit:.1,model:'gorruk',abilities:['bBasic','bAoe'],boss:true,stunImmune:true,scale:1.7,height:2.3,radius:.6,
    bk:{basic:'Clavada',melee:true,aoe:'Onda de Lodo',aoeColor:'#48c6ff',aoeStatus:'poison',prep:'Ergue a Clava',big:'Esmagamento',bigColor:'#ff6a3d',rage:'Fúria do Rei',adds:'xama',quote:'Gorruk ergue a clava'}},
  ignar:{name:'Ignar, Golem da Forja',short:'Ignar',el:'fogo',hp:4400,atk:146,spd:88,crit:.1,dr:.1,model:'ignar',abilities:['bBasic','bAoe'],boss:true,stunImmune:true,scale:1.65,height:2.3,radius:.65,
    bk:{basic:'Punho de Lava',melee:true,aoe:'Erupção',aoeColor:'#ff6a1a',aoeStatus:'burn',prep:'Núcleo Superaquecido',big:'Cataclismo',bigColor:'#ff4a1a',rage:'Forja Desperta',adds:'diabrete',quote:'O núcleo de Ignar brilha'}}
};
const HERO_KEYS=['brom','lyra','alva','vex','kai','mira','rook','nyx'];
const STARTERS=['brom','lyra','alva','vex','kai','mira'];
const DUNGEONS=[
  {id:'d1',name:'Covil dos Goblins',theme:'goblin',lvl:1,boss:'grakk',unlockHero:'rook',x:13,y:72,mx:28,my:83,
    rooms:[['goblin','arqueiro','goblin'],['goblin','arqueiro','xama']],sub:['Três goblins guardam a entrada.','O covil fica mais barulhento.','Grakk defende o tesouro da tribo.']},
  {id:'d2',name:'Cripta Esquecida',theme:'cripta',lvl:4,boss:'lich',unlockHero:'nyx',x:38,y:34,mx:70,my:64,
    rooms:[['esqueleto','magoEsq','esqueleto'],['esqueleto','magoEsq','magoEsq']],sub:['Os mortos não descansam aqui.','Um frio estranho sobe do chão.','Morvhal desperta no seu sarcófago.']},
  {id:'d3',name:'Pântano do Lodo',theme:'lodo',lvl:8,boss:'gorruk',x:63,y:68,mx:30,my:38,
    rooms:[['xama','goblin','xama'],['goblin','xama','arqueiro','goblin']],sub:['O lodo cobre tudo.','Os seguidores de Gorruk atacam.','O Rei Ogro espera no trono.']},
  {id:'d4',name:'Forja Infernal',theme:'forja',lvl:12,boss:'ignar',x:87,y:28,mx:72,my:18,
    rooms:[['diabrete','bruto','diabrete'],['bruto','diabrete','bruto','diabrete']],sub:['O calor é insuportável.','A forja nunca apaga.','Ignar se levanta da lava.']}
];
const MAX_LVL=30;
const lm=L=>1+.1*(L-1);
const xpNeed=L=>40+40*L;
const trainCost=L=>Math.round(40*L*Math.pow(1.1,L-1));
function heroPower(k,L){const d=DEFS[k];return Math.round((d.hp*.1+d.atk*1.5)*lm(L));}
function teamPower(list){return list.reduce((s,t)=>s+heroPower(t.k,t.lvl),0);}
function recPower(L){return Math.round(4*(1000*.1+120*1.5)*lm(L));}
const roomXp=L=>30+12*L;
const roomGold=L=>25+10*L;

/* ---------- salvamento ---------- */
const SAVE_KEY='masmorra-v2';
function defaultSave(){return{v:2,name:'',gold:100,heroes:Object.fromEntries(HERO_KEYS.map(k=>[k,{lvl:1,xp:0}])),unlocked:[...STARTERS],stars:{},team:['brom','lyra','alva','vex'],defense:['brom','lyra','alva','vex'],rating:1000,wins:0,losses:0,log:[],updated:0};}
function normalizeSave(s){
  const d=defaultSave();if(!s||typeof s!=='object')return d;
  const out=Object.assign(d,s);
  for(const k of HERO_KEYS){const h=(s.heroes||{})[k];out.heroes[k]={lvl:clamp(+(h&&h.lvl)||1,1,MAX_LVL),xp:Math.max(0,+(h&&h.xp)||0)};}
  out.unlocked=[...new Set([...STARTERS,...(Array.isArray(s.unlocked)?s.unlocked:[])])].filter(k=>HERO_KEYS.includes(k));
  const okTeam=t=>Array.isArray(t)&&t.length===4&&t.every(k=>out.unlocked.includes(k))&&new Set(t).size===4;
  if(!okTeam(out.team))out.team=d.team;if(!okTeam(out.defense))out.defense=d.defense;
  out.gold=Math.max(0,Math.floor(+out.gold||0));out.rating=Math.max(0,Math.round(+out.rating||1000));
  if(!Array.isArray(out.log))out.log=[];out.log=out.log.slice(0,10);
  return out;
}
function loadLocal(){try{return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch(e){return defaultSave();}}
let SAVE=loadLocal();
function persist(){SAVE.updated=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}if(typeof Net!=='undefined')Net.pushSave(SAVE);}
const lvlOf=k=>SAVE.heroes[k].lvl;
const teamList=keys=>keys.map(k=>({k,lvl:lvlOf(k)}));
function grantXp(k,amt){
  const h=SAVE.heroes[k],from=h.lvl;h.xp+=amt;
  while(h.lvl<MAX_LVL&&h.xp>=xpNeed(h.lvl)){h.xp-=xpNeed(h.lvl);h.lvl++;}
  if(h.lvl>=MAX_LVL)h.xp=0;
  return{from,to:h.lvl};
}

/* ---------- fichas dos heróis (vitrine de seleção) ---------- */
const TYPES={tanque:{n:'Tanque',c:'#7cc7ff',d:'Aguenta pancada e protege a equipe.'},dano:{n:'Dano',c:'#ff7a6e',d:'Derruba inimigos rápido.'},suporte:{n:'Suporte',c:'#6fe38c',d:'Cura e protege os aliados.'}};
const HERO_INFO={
  brom:{type:'tanque',bio:'Anão teimoso de escudo e machado que segura a linha de frente. Provoca os inimigos para tirar o foco dos aliados e atordoa o grupo inteiro com o Terremoto.'},
  rook:{type:'tanque',bio:'Berserker de dois machados que fica mais forte no meio da briga. Recupera vida com a Sede de Batalha e gira no meio dos inimigos deixando todos em chamas.'},
  lyra:{type:'dano',bio:'Piromante impulsiva que transforma tudo em brasa. Tem o maior dano em área da equipe, mas aguenta pouco: deixe alguém na frente dela.'},
  vex:{type:'dano',bio:'Ladino veloz que costuma agir antes de todos. Envenena os alvos mais fortes e finaliza quem já está com pouca vida.'},
  kai:{type:'dano',bio:'Caçador das marés com mira certeira. A Flecha Perfurante atravessa escudos e a Chuva de Flechas acerta todos os inimigos.'},
  nyx:{type:'dano',bio:'Necromante que rouba a vida dos inimigos. Espalha veneno em todos com a Maldição e se cura com Drenar Vida.'},
  alva:{type:'suporte',bio:'Clériga serena que mantém a equipe de pé. Cura um aliado de cada vez ou todos juntos, e ainda remove veneno, queimadura e atordoamento.'},
  mira:{type:'suporte',bio:'Sacerdotisa das marés que protege com bolhas de água. Dê escudo para todos logo antes do golpe forte do chefe.'}
};
const beatsOf=el=>ELEM[el].beats;
const weakTo=el=>Object.keys(ELEM).find(e=>ELEM[e].beats===el);
