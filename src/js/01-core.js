/* ================= núcleo: utilidades, som, elementos ================= */
const $=s=>document.querySelector(s);
const screenEl=$('#screen');
if(typeof THREE==='undefined'){ screenEl.innerHTML='<div class="panel"><h1 class="title">Ops</h1><p class="err">Não foi possível carregar o motor 3D. Verifique a conexão e abra o jogo de novo.</p></div>'; return; }

const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('pt-BR');
const E={out:t=>1-Math.pow(1-t,3),inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,lin:t=>t,
  bounce:t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;}};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const tweens=[];
function tween(ms,fn,e=E.out){return new Promise(res=>{tweens.push({t:0,d:Math.max(.001,ms/1000),fn,e,res});});}
function wait(ms){return tween(ms,()=>{});}
function updateTweens(dt){for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;const k=Math.min(1,w.t/w.d);w.fn(w.e(k),k);if(k>=1){tweens.splice(i,1);w.res();}}}
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const rv=s=>V(rand(-s,s),rand(-s,s),rand(-s,s));
function angDiff(a,b){let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d;}

/* ---------- som (sintetizado, sem arquivos) ---------- */
let AC=null,muted=false,noiseBuf=null;
function audio(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){AC=null;}}
function tone(f,dur,type='sine',vol=.12,slide=1,delay=0){if(!AC||muted)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.03);}
function noise(dur,vol=.2,freq=1200,q=1,delay=0){if(!AC||muted)return;if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const t=AC.currentTime+delay,s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(freq,t);f.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f).connect(g).connect(AC.destination);s.start(t);s.stop(t+dur+.02);}
const sfx={
  hit:()=>{noise(.14,.35,900,.8);tone(130,.14,'sine',.22,.5);},
  crit:()=>{noise(.2,.42,1500,.7);tone(240,.2,'square',.1,.4);},
  whoosh:()=>noise(.18,.12,2600,.6),
  fire:()=>{noise(.45,.25,600,.5);tone(95,.4,'sawtooth',.05,.5);},
  magic:()=>tone(520,.28,'triangle',.09,2),
  water:()=>{noise(.3,.18,800,.4);tone(330,.25,'sine',.07,.6);},
  dark:()=>tone(300,.32,'sawtooth',.06,.5),
  heal:()=>{[523,659,784].forEach((f,i)=>tone(f,.32,'sine',.09,1,i*.07));},
  death:()=>tone(320,.5,'sawtooth',.07,.25),
  slam:()=>{noise(.55,.5,170,.6);tone(60,.55,'sine',.35,.5);},
  click:()=>tone(900,.04,'square',.04),
  roar:()=>{tone(105,.8,'sawtooth',.13,.55);noise(.8,.2,320,.5);},
  win:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.4,'triangle',.11,1,i*.12));},
  lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,.5,'triangle',.11,1,i*.18));},
  land:()=>{noise(.2,.3,250,.7);tone(80,.2,'sine',.2,.6);},
  coin:()=>{tone(1320,.08,'square',.05);tone(1760,.12,'square',.05,1,.07);},
  level:()=>{[659,784,988,1318].forEach((f,i)=>tone(f,.22,'square',.06,1,i*.08));}
};

/* ---------- elementos ---------- */
const ELEM={
  fogo:{c:'#ff6a3d',i:'i-fire'},
  natureza:{c:'#6ad16a',i:'i-leaf'},
  agua:{c:'#45aaff',i:'i-drop'},
  luz:{c:'#ffd75e',i:'i-sun'},
  sombra:{c:'#b47bff',i:'i-moon'}
};
/* nome e vantagem de cada elemento vêm de data/rules.json; aqui só cor e ícone */
for(const [k,e] of Object.entries(DATA.rules.elements))Object.assign(ELEM[k],{n:e.name,beats:e.beats});
function elemMult(a,d){if(ELEM[a].beats===d)return RULES.elemAdv;if(ELEM[d].beats===a)return RULES.elemDis;return 1;}
const gemSvg=el=>`<svg class="gem" style="color:${ELEM[el].c}"><use href="#${ELEM[el].i}"/></svg>`;

let toastTimer=0;
function toast(msg,ms=2400){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},ms);}
