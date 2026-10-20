/* ================= servidor (Firebase) ================= */
/* Sem configuração do Firebase o jogo roda offline e a Invasão usa oponentes simulados. */
const BOT_NAMES=['Tavernal','Sir Bolota','Duda Machado','Capitã Brasa','Zé das Trevas','Lumi','Rato de Cripta','Ferreiro Tonho','Bruxa Nina','Caçador Ivo','Lady Ferrugem','Bardo Beto','Gugu do Lodo','Mestre Ônix','Tia Fênix','Kiko Lâmina'];
function botTeam(avgLvl,seed){
  const keys=HERO_KEYS.slice().sort(()=>Math.random()-.5);
  const tank=['brom','rook'].includes(keys[0])?[]:[pick(['brom','rook'])];
  const team=[...new Set([...tank,...keys])].slice(0,4);
  return team.map(k=>({k,lvl:clamp(Math.round(avgLvl+rand(-1.5,1.5)),1,MAX_LVL)}));
}
function makeBots(n){
  const avg=SAVE.team.reduce((s,k)=>s+lvlOf(k),0)/4;
  return Array.from({length:n},(_,i)=>{
    const lv=avg+(i-1)*1.2,team=botTeam(Math.max(1,lv));
    return{uid:'bot-'+i+'-'+Math.random().toString(36).slice(2,6),name:pick(BOT_NAMES),rating:Math.max(0,Math.round(SAVE.rating+(i-1)*60+rand(-30,30))),team,power:teamPower(team),bot:true};
  });
}
const Net={
  online:false,uid:null,db:null,_saveTimer:0,status:'Offline',
  configured(){return typeof firebase!=='undefined'&&window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey&&!/COLE_AQUI/.test(window.FIREBASE_CONFIG.apiKey);},
  async init(){
    if(!this.configured()){this.status='Offline: Invasão com oponentes simulados';return false;}
    try{
      if(!firebase.apps.length)firebase.initializeApp(window.FIREBASE_CONFIG);
      const auth=firebase.auth();
      const user=await new Promise(res=>{const off=auth.onAuthStateChanged(u=>{off();res(u);});});
      this.uid=(user||(await auth.signInAnonymously()).user).uid;
      this.db=firebase.firestore();this.online=true;this.status='Online';
      return true;
    }catch(e){console.warn('Firebase indisponível',e);this.status='Sem conexão com o servidor: jogando offline';return false;}
  },
  async pullSave(){
    if(!this.online)return null;
    try{const d=await this.db.collection('saves').doc(this.uid).get();if(!d.exists)return null;return normalizeSave(JSON.parse(d.data().save));}catch(e){console.warn(e);return null;}
  },
  pushSave(save){
    if(!this.online)return;clearTimeout(this._saveTimer);
    this._saveTimer=setTimeout(()=>{
      this.db.collection('saves').doc(this.uid).set({save:JSON.stringify(save),updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(e=>console.warn(e));
      this.publishProfile();
    },1200);
  },
  profile(){
    const defense=teamList(SAVE.defense);
    return{name:(SAVE.name||'Aventureiro').slice(0,20),rating:SAVE.rating,wins:SAVE.wins,losses:SAVE.losses,power:teamPower(defense),defense,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  },
  publishProfile(){if(!this.online||!SAVE.name)return;this.db.collection('players').doc(this.uid).set(this.profile(),{merge:true}).catch(e=>console.warn(e));},
  async opponents(){
    if(!this.online)return makeBots(3);
    try{
      const r=SAVE.rating;
      const snap=await this.db.collection('players').where('rating','>=',r-250).where('rating','<=',r+250).orderBy('rating').limit(30).get();
      let list=snap.docs.filter(d=>d.id!==this.uid).map(d=>({uid:d.id,...d.data()})).filter(p=>Array.isArray(p.defense)&&p.defense.length===4&&p.defense.every(t=>DEFS[t.k]&&HERO_KEYS.includes(t.k)));
      list=list.sort(()=>Math.random()-.5).slice(0,3).map(p=>({uid:p.uid,name:String(p.name||'Jogador').slice(0,20),rating:p.rating|0,team:p.defense.map(t=>({k:t.k,lvl:clamp(t.lvl|0,1,MAX_LVL)})),power:p.power|0}));
      if(list.length<3)list=list.concat(makeBots(3-list.length));
      return list;
    }catch(e){console.warn(e);toast('Não consegui buscar jogadores agora. Mostrando oponentes simulados.');return makeBots(3);}
  },
  async leaderboard(){
    if(!this.online)return null;
    try{const s=await this.db.collection('players').orderBy('rating','desc').limit(50).get();return s.docs.map(d=>({uid:d.id,name:String(d.data().name||'Jogador').slice(0,20),rating:d.data().rating|0,power:d.data().power|0}));}
    catch(e){console.warn(e);return null;}
  },
  reportArena(opp,win,delta){
    if(!this.online||!opp||opp.bot)return;
    this.db.collection('players').doc(opp.uid).collection('defenses').add({attacker:(SAVE.name||'Aventureiro').slice(0,20),attackerUid:this.uid,attackerWon:win,delta:clamp(-delta,-32,32),at:firebase.firestore.FieldValue.serverTimestamp()}).catch(e=>console.warn(e));
  },
  async collectDefenses(){
    if(!this.online)return[];
    try{
      const s=await this.db.collection('players').doc(this.uid).collection('defenses').limit(30).get();
      if(s.empty)return[];
      const out=[];let sum=0;const batch=this.db.batch();
      s.forEach(d=>{const x=d.data();sum+=clamp(x.delta|0,-32,32);out.push({name:String(x.attacker||'Alguém').slice(0,20),won:!x.attackerWon,delta:x.delta|0});batch.delete(d.ref);});
      SAVE.rating=Math.max(0,SAVE.rating+clamp(sum,-200,60));
      SAVE.log=[...out.map(o=>({...o,at:Date.now()})),...SAVE.log].slice(0,10);
      await batch.commit();persist();
      return out;
    }catch(e){console.warn(e);return[];}
  }
};
