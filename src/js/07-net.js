/* ================= servidor próprio (API em /api) ================= */
/* Contas com nome e senha, salvamento na nuvem, Invasão e ranking.
   Se a API não responder (arquivo aberto sem servidor, artifact, sem internet), o jogo roda offline
   e a Invasão usa oponentes simulados. */
const API=(window.MASMORRA_API||'/api').replace(/\/$/,'');
const TOKEN_KEY='masmorra-token';
const BOT_NAMES=['Tavernal','Sir Bolota','Duda Machado','Capitã Brasa','Zé das Trevas','Lumi','Rato de Cripta','Ferreiro Tonho','Bruxa Nina','Caçador Ivo','Lady Ferrugem','Bardo Beto','Gugu do Lodo','Mestre Ônix','Tia Fênix','Kiko Lâmina'];
function botTeam(avgLvl,avgEvo){
  const keys=HERO_KEYS.slice().sort(()=>Math.random()-.5);
  const tank=['brom','rook'].includes(keys[0])?[]:[pick(['brom','rook'])];
  const team=[...new Set([...tank,...keys])].slice(0,4);
  return team.map(k=>({k,lvl:clamp(Math.round(avgLvl+rand(-1.5,1.5)),1,MAX_LVL),evo:clamp(Math.round(avgEvo+rand(-.6,.6)),1,MAX_EVO)}));
}
function makeBots(n){
  const avg=SAVE.team.reduce((s,k)=>s+lvlOf(k),0)/4,avgE=SAVE.team.reduce((s,k)=>s+evoOf(k),0)/4;
  return Array.from({length:n},(_,i)=>{
    const team=botTeam(Math.max(1,avg+(i-1)*1.2),avgE);
    return{uid:'bot-'+i+'-'+Math.random().toString(36).slice(2,6),name:pick(BOT_NAMES),rating:Math.max(0,Math.round(SAVE.rating+(i-1)*60+rand(-30,30))),team,power:teamPower(team),bot:true};
  });
}
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){}};

const Net={
  online:false,token:lsGet(TOKEN_KEY),uid:null,status:'Conectando ao servidor…',_saveTimer:0,
  get logged(){return this.online&&!!this.token;},
  async call(path,{method='GET',body,auth=true,timeout=8000}={}){
    const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout);
    try{
      const headers={};if(body!==undefined)headers['Content-Type']='application/json';
      if(auth&&this.token)headers.Authorization='Bearer '+this.token;
      const r=await fetch(API+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal});
      let data=null;try{data=await r.json();}catch(e){}
      if(r.status===401&&auth&&this.token){this.setToken(null);this.status='Sua sessão expirou. Entre de novo.';}
      if(!r.ok){const err=new Error(data&&data.error||`Erro ${r.status}`);err.status=r.status;throw err;}
      return data;
    }catch(e){
      if(e.name==='AbortError'){const err=new Error('O servidor demorou para responder. Tente de novo.');err.status=0;throw err;}
      if(e.status===undefined){e.status=0;e.message='Sem conexão com o servidor.';}
      throw e;
    }finally{clearTimeout(t);}
  },
  setToken(t){
    this.token=t;lsSet(TOKEN_KEY,t);
    try{this.uid=t?String(JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub):null;}catch(e){this.uid=null;}
  },
  async init(){
    this.setToken(this.token);
    try{await this.call('/health',{auth:false,timeout:4000});this.online=true;}
    catch(e){this.online=false;this.status='Offline: progresso salvo neste aparelho e Invasão com oponentes simulados';return false;}
    if(this.token)await this.sync();
    else this.status='Online · jogando como convidado';
    return true;
  },
  /* traz o salvamento da conta; o mais recente vence */
  async sync(){
    try{
      const me=await this.call('/me');
      const remote=me.save?normalizeSave(me.save):null;
      if(remote&&(remote.updated||0)>=(SAVE.updated||0))SAVE=remote;
      SAVE.name=me.profile.name;
      this.applyProfile(me.profile);
      lsSet(SAVE_KEY,JSON.stringify(SAVE));
      if(!remote||(SAVE.updated||0)>(remote.updated||0))this.pushSave(SAVE,0);
      this.status=`Online · conectado como ${me.profile.name}`;
      return true;
    }catch(e){
      this.status=this.token?`Não consegui carregar sua conta: ${e.message}`:'Online · jogando como convidado';
      return false;
    }
  },
  applyProfile(p){
    if(!p)return;
    SAVE.rating=p.rating;SAVE.wins=p.wins;SAVE.losses=p.losses;
    lsSet(SAVE_KEY,JSON.stringify(SAVE));
  },
  async register(name,pass){
    SAVE.name=name;SAVE.updated=Date.now();
    const r=await this.call('/auth/register',{method:'POST',auth:false,body:{username:name,password:pass,save:SAVE}});
    this.setToken(r.token);await this.sync();this.pushSave(SAVE,0);
  },
  async login(name,pass){
    const r=await this.call('/auth/login',{method:'POST',auth:false,body:{username:name,password:pass}});
    this.setToken(r.token);
    /* conta existente: o salvamento da nuvem substitui o do convidado neste aparelho */
    SAVE.updated=0;
    await this.sync();
  },
  logout(){
    this.setToken(null);SAVE=defaultSave();lsSet(SAVE_KEY,JSON.stringify(SAVE));
    this.status='Online · jogando como convidado';
  },
  pushSave(save,delay=1200){
    if(!this.logged)return;clearTimeout(this._saveTimer);
    this._saveTimer=setTimeout(()=>{
      const defense=teamList(SAVE.defense);
      this.call('/save',{method:'PUT',body:{save:SAVE,defense,power:teamPower(defense)}})
        .then(r=>this.applyProfile(r.profile)).catch(e=>console.warn('save',e.message));
    },delay);
  },
  publishProfile(){this.pushSave(SAVE,0);},
  async opponents(){
    if(!this.logged)return makeBots(3);
    try{
      const r=await this.call('/arena/opponents');
      let list=r.opponents.filter(p=>Array.isArray(p.defense)&&p.defense.length===4&&p.defense.every(t=>HERO_KEYS.includes(t.k)))
        .map(p=>({uid:String(p.id),name:String(p.name).slice(0,20),rating:p.rating|0,power:p.power|0,team:p.defense.map(t=>({k:t.k,lvl:clamp(t.lvl|0,1,MAX_LVL),evo:clamp(t.evo|0||1,1,MAX_EVO)}))}));
      if(list.length<3)list=list.concat(makeBots(3-list.length));
      return list;
    }catch(e){toast(`Não consegui buscar jogadores: ${e.message} Mostrando oponentes simulados.`);return makeBots(3);}
  },
  async leaderboard(){
    if(!this.online)return null;
    try{return(await this.call('/arena/leaderboard',{auth:false})).players.map(p=>({uid:String(p.id),name:p.name,rating:p.rating,power:p.power}));}
    catch(e){return null;}
  },
  async startRaid(uid){
    try{return(await this.call('/arena/start',{method:'POST',body:{opponentId:Number(uid)}})).raidId;}
    catch(e){return null;}
  },
  async finishRaid(raidId,won){
    try{return await this.call('/arena/finish',{method:'POST',body:{raidId,won}});}
    catch(e){toast(`O resultado não foi registrado: ${e.message}`);return null;}
  },
  async collectDefenses(){
    if(!this.logged)return[];
    try{
      const r=await this.call('/arena/defenses');
      const out=r.defenses.map(d=>({name:String(d.name).slice(0,20),won:!!d.won,delta:d.delta|0,at:Date.parse(d.at)||Date.now()}));
      if(out.length){SAVE.log=[...out,...SAVE.log].slice(0,10);lsSet(SAVE_KEY,JSON.stringify(SAVE));await this.sync();}
      return out;
    }catch(e){return[];}
  }
};
