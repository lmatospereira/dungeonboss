/* ================= modelos chibi ================= */
function chibi(o){
  const mats=[];const T=c=>{const m=new THREE.MeshToonMaterial({color:c,gradientMap:gradTex});mats.push(m);return m;};
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const skin=T(o.skin),cloth=T(o.cloth),acc=T(o.acc),dark=T(o.dark||0x2a2030);
  const r={root,body,mats,T,skin,cloth,acc,dark};
  const bw=o.belly||.4;
  for(const sx of[-1,1]){P(body,GEO.cyl,dark,[.16*sx,.22,0],[.12,.36,.12]);P(body,GEO.sph,dark,[.17*sx,.08,.06],[.18,.12,.24]);}
  P(body,GEO.sph,cloth,[0,.72,0],[bw,.42,bw*.85]);
  P(body,GEO.cyl,acc,[0,.56,0],[bw*.98,.09,bw*.84],null,.03);
  if(o.robe)P(body,GEO.cone,cloth,[0,.38,0],[.46,.64,.42]);
  const head=new THREE.Group();head.position.set(0,1.46,0);head.scale.setScalar(o.headScale||1.14);body.add(head);r.head=head;
  P(head,GEO.sph,skin,[0,0,0],[.56,.52,.52]);
  const eyeM=new THREE.MeshBasicMaterial({color:o.eye||0x1b1222}),shine=new THREE.MeshBasicMaterial({color:0xffffff});
  for(const sx of[-1,1]){
    P(head,GEO.sph,eyeM,[.19*sx,-.02,.46],[o.eyeW||.085,o.eyeH||.125,.05],null,0);
    if(!o.noShine){P(head,GEO.sph,shine,[.19*sx+.035,.035,.505],[.032,.032,.02],null,0);P(head,GEO.sph,shine,[.19*sx-.025,-.055,.505],[.014,.014,.01],null,0);}
    if(o.blush)P(head,GEO.sph,T(0xff9a9a),[.31*sx,-.15,.41],[.075,.04,.03],null,0);
  }
  const arm=sx=>{const g=new THREE.Group();g.position.set(.44*sx*(bw/.4),.9,0);body.add(g);P(g,GEO.sph,cloth,[0,-.13,0],[.14,.22,.14]);P(g,GEO.sph,o.glove?T(o.glove):skin,[0,-.34,.02],[.15,.15,.15]);const h=new THREE.Group();h.position.set(0,-.36,.04);h.scale.setScalar(o.weaponScale||1.28);g.add(h);g.rotation.z=.15*sx;return[g,h];};
  [r.armL,r.handL]=arm(-1);[r.armR,r.handR]=arm(1);
  return r;
}
function cape(r,color,{len=.82,w=.5,y=1.08,arc=.85}={}){
  const g=new THREE.Group();g.position.set(0,y,-.12);r.body.add(g);
  const geo=new THREE.CylinderGeometry(w*.72,w*1.15,len,18,1,true,Math.PI*(1-arc/2),Math.PI*arc);
  const m=new THREE.MeshToonMaterial({color,gradientMap:gradTex,side:THREE.DoubleSide});r.mats.push(m);
  const c=new THREE.Mesh(geo,m);c.position.y=-len/2;c.castShadow=true;g.add(c);
  const edge=new THREE.Mesh(new THREE.CylinderGeometry(w*1.16,w*1.16,.05,18,1,true,Math.PI*(1-arc/2),Math.PI*arc),new THREE.MeshBasicMaterial({color:0x160d14,side:THREE.DoubleSide}));edge.position.y=-len+.02;g.add(edge);
  r.cape=g;return g;
}
function pauldron(r,mat,sx,s=1){P(r.body,GEO.half,mat,[.48*sx,1,0],[.22*s,.18*s,.22*s]);P(r.body,GEO.torus,r.T(0xe2ad35),[.48*sx,1,0],[.22*s,.22*s,.22*s],[Math.PI/2,0,0],0);}
function staff(r,hand,wood,orbColor,glowColor,top){
  const st=new THREE.Group();hand.add(st);
  P(st,GEO.cyl,wood,[0,.35,0],[.045,1.5,.045]);
  const orb=P(st,top||GEO.sph,new THREE.MeshBasicMaterial({color:orbColor}),[0,1.18,0],[.15,.15,.15],null,.04);
  const g=glowSprite(glowColor,1.1);g.position.set(0,1.18,0);st.add(g);
  r.orb=orb;return st;
}
function crown(r,y=.46,s=1,ruby=0xff3b4e){
  const gold=r.T(0xe2ad35);
  P(r.head,GEO.cyl,gold,[0,y,0],[.34*s,.16,.34*s]);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+Math.PI/2;P(r.head,GEO.cone,gold,[Math.cos(a)*.3*s,y+.17,Math.sin(a)*.3*s],[.07,.2,.07],null,.03);}
  P(r.head,GEO.sph,new THREE.MeshBasicMaterial({color:ruby}),[0,y,.34*s],[.06,.06,.03],null,0);
}
function axeIn(r,hand,wood,metal,len=.75){const ax=new THREE.Group();hand.add(ax);ax.rotation.x=-.5;P(ax,GEO.cyl,wood,[0,0,len/3],[.045,len,.045],[Math.PI/2,0,0]);P(ax,GEO.box,metal,[0,.16,len*.72],[.06,.4,.3]);P(ax,GEO.cyl,metal,[0,.36,len*.72],[.15,.06,.15],[0,0,Math.PI/2],.02);return ax;}
function goblinBase(o){
  const r=chibi({skin:o.skin||0x7cbf4a,cloth:o.cloth||0x7a5532,acc:o.acc||0xa33b2b,dark:o.dark||0x3a2a1c,eye:0x2a0606,eyeW:.07,eyeH:.09,belly:o.belly});
  const browM=r.T(o.brow||0x3d5a22);
  for(const sx of[-1,1]){
    P(r.head,GEO.cone,r.skin,[.6*sx,.08,-.02],[.12,.44,.1],[0,0,-(Math.PI/2-.3)*sx]);
    P(r.head,GEO.box,browM,[.19*sx,.14,.47],[.18,.05,.04],[0,0,.35*sx],.02);
  }
  P(r.head,GEO.sph,r.skin,[0,-.08,.52],[.1,.08,.13]);
  return r;
}
function skelBase(o){
  const r=chibi({skin:0xe9e3d0,cloth:o.cloth,acc:o.acc,dark:0x3a3440,eye:0x0d0a10,eyeW:.11,eyeH:.13,noShine:true,robe:o.robe});
  const g=new THREE.MeshBasicMaterial({color:o.glow||0x7af5ff});
  for(const sx of[-1,1])P(r.head,GEO.sph,g,[.19*sx,-.02,.51],[.035,.035,.02],null,0);
  P(r.head,GEO.box,r.skin,[0,-.36,.18],[.34,.12,.28]);
  P(r.head,GEO.box,r.dark,[0,-.3,.33],[.24,.02,.02],null,0);
  return r;
}
const MODELS={
  /* ---- heróis ---- */
  brom(){
    const r=chibi({skin:0xf2b48c,cloth:0x4d7a3a,acc:0xc9a046,dark:0x4a3426,belly:.46});
    const metal=r.T(0x9ba4b0),horn=r.T(0xece3cc),beard=r.T(0xc0612b),wood=r.T(0x8a5a2b);
    P(r.head,GEO.half,metal,[0,.06,0],[.6,.52,.58]);
    for(const sx of[-1,1]){P(r.head,GEO.cone,horn,[.52*sx,.32,0],[.09,.36,.09],[0,0,-1*sx]);P(r.body,GEO.half,metal,[.46*sx,.96,0],[.2,.16,.2]);}
    P(r.head,GEO.sph,beard,[0,-.3,.3],[.4,.32,.26]);
    P(r.head,GEO.sph,beard,[0,-.08,.48],[.22,.07,.06],null,.03);
    const sh=new THREE.Group();sh.position.set(-.08,.05,.1);sh.rotation.y=-.5;r.handL.add(sh);
    P(sh,GEO.cyl,wood,[0,0,0],[.42,.08,.42],[Math.PI/2,0,0]);
    P(sh,GEO.torus,metal,[0,0,.04],[.4,.4,.4],null,0);
    P(sh,GEO.sph,metal,[0,0,.06],[.13,.13,.08]);
    axeIn(r,r.handR,wood,metal);
    cape(r,0xa8322b,{len:.86,w:.52});
    P(r.body,GEO.cyl,r.T(0x5a3a22),[0,.6,0],[.47,.1,.41],null,.03);
    P(r.body,GEO.box,r.T(0xe2ad35),[0,.6,.42],[.16,.12,.05],null,.02);
    P(sh,GEO.sph,r.T(0x4d7a3a),[0,0,.08],[.2,.2,.04],null,0);
    return r;
  },
  lyra(){
    const r=chibi({skin:0xffd3b4,cloth:0xb83a2c,acc:0xf2b33d,dark:0x3a1f2a,robe:true,blush:true});
    const hair=r.T(0xff7a2a),hat=r.T(0x5b2b7c),band=r.T(0xf2b33d),wood=r.T(0x7a4a25);
    P(r.head,GEO.sph,hair,[0,.04,-.12],[.6,.56,.52]);
    for(const sx of[-1,1])P(r.head,GEO.sph,hair,[.42*sx,-.24,.05],[.16,.28,.16]);
    P(r.head,GEO.sph,hair,[0,.3,.32],[.42,.16,.2]);
    P(r.head,GEO.cyl,hat,[0,.36,0],[.8,.05,.8]);
    P(r.head,GEO.cone,hat,[.08,.88,-.04],[.46,1,.46],[-.15,0,-.22]);
    P(r.head,GEO.cyl,band,[0,.43,0],[.47,.09,.47],null,.03);
    staff(r,r.handR,wood,0xffb36a,0xff7a2a);
    cape(r,0x5b2b7c,{len:.7,w:.46,arc:.7});
    for(const sx of[-1,1])P(r.body,GEO.sph,band,[.42*sx,.98,0],[.15,.11,.15]);
    const fl=glowSprite(0xff7a2a,.5,.7);fl.position.set(-.05,0,.08);r.handL.add(fl);
    return r;
  },
  alva(){
    const r=chibi({skin:0xf6d0b3,cloth:0xf1eadb,acc:0xe1b23f,dark:0x6b5a48,robe:true,blush:true});
    const hood=r.T(0xe6dcc8),hair=r.T(0xf3d27a),gold=r.T(0xe1b23f);
    P(r.head,GEO.sph,hood,[0,.05,-.13],[.62,.6,.52]);
    P(r.head,GEO.sph,hair,[0,.28,.3],[.4,.15,.2]);
    P(r.head,GEO.torus,new THREE.MeshBasicMaterial({color:0xffe27a}),[0,.78,0],[.3,.3,.3],[Math.PI/2,0,0],0);
    P(r.body,GEO.box,gold,[0,.76,.36],[.07,.24,.04],null,.02);
    P(r.body,GEO.box,gold,[0,.8,.36],[.18,.06,.04],null,.02);
    const mc=new THREE.Group();r.handR.add(mc);mc.rotation.x=-.4;
    P(mc,GEO.cyl,r.T(0x7a5a3a),[0,0,.22],[.04,.55,.04],[Math.PI/2,0,0]);
    r.orb=P(mc,GEO.sph,gold,[0,0,.52],[.14,.14,.14]);
    const g=glowSprite(0xffe08a,.8,.8);g.position.set(0,0,.52);mc.add(g);
    cape(r,0xf8f2e4,{len:.78,w:.48});
    const wing=r.T(0xffffff);
    for(const sx of[-1,1]){P(r.body,GEO.sph,wing,[.26*sx,1.08,-.4],[.1,.3,.08],[0,.5*sx,.5*sx]);P(r.body,GEO.sph,wing,[.36*sx,.96,-.38],[.08,.22,.06],[0,.5*sx,.9*sx]);}
    return r;
  },
  vex(){
    const r=chibi({skin:0xd9a07c,cloth:0x3b2b4d,acc:0x8b5cf6,dark:0x1e1726});
    const hood=r.T(0x2e2240),mask=r.T(0x1b1424),steel=r.T(0xd3dae3);
    P(r.head,GEO.sph,hood,[0,.06,-.1],[.62,.6,.55]);
    P(r.head,GEO.cone,hood,[0,.52,-.28],[.24,.42,.24],[-.7,0,0]);
    P(r.head,GEO.sph,mask,[0,-.2,.3],[.44,.2,.26]);
    P(r.body,GEO.cyl,r.acc,[0,1.02,0],[.3,.1,.28],null,.03);
    for(const h of[r.handR,r.handL]){const d=new THREE.Group();h.add(d);d.rotation.x=-.3;P(d,GEO.box,steel,[0,0,.28],[.07,.025,.44],null,.03);P(d,GEO.box,r.acc,[0,0,.05],[.2,.05,.05],null,.03);}
    const sc=r.T(0x8b5cf6);
    P(r.body,GEO.box,sc,[.18,1.0,-.34],[.09,.4,.04],[.4,0,-.4],.02);P(r.body,GEO.box,sc,[.28,.86,-.4],[.08,.32,.04],[.6,0,-.7],.02);
    for(const sx of[-1,1])P(r.body,GEO.box,r.T(0x5a4a6a),[.2*sx,.6,.36],[.06,.14,.04],[0,0,.2*sx],.02);
    return r;
  },
  kai(){
    const r=chibi({skin:0xe8b98f,cloth:0x2a6f8a,acc:0x9ad8e8,dark:0x223040,blush:true});
    const hood=r.T(0x1f5a72),hair=r.T(0x3a2a22),wood=r.T(0x8a5a2b),leather=r.T(0x6b4426);
    P(r.head,GEO.sph,hair,[0,.12,-.1],[.58,.5,.5]);
    P(r.head,GEO.sph,hood,[0,.04,-.2],[.64,.62,.46]);
    P(r.head,GEO.cone,hood,[0,.4,-.45],[.2,.4,.2],[-1.2,0,0]);
    P(r.head,GEO.sph,hair,[.1,.32,.34],[.36,.12,.16],[0,0,-.2]);
    P(r.body,GEO.box,leather,[0,.82,-.32],[.08,.6,.06],[0,0,.7],.02);
    const q=P(r.body,GEO.cyl,leather,[.2,.95,-.34],[.11,.5,.11],[.3,0,-.4]);
    for(let i=0;i<3;i++)P(q,GEO.cone,r.T(0xf2f2f2),[(i-1)*.35,.62,0],[.25,.25,.25],null,0);
    const b1=new THREE.Group(),b2=new THREE.Group();b2.rotation.y=-Math.PI/2;b1.rotation.z=-Math.PI/2;r.handL.add(b2);b2.add(b1);
    P(b1,GEO.bow,wood,[0,0,0],[1.3,1.3,1.3],null,.03);
    cape(r,0x1f5a72,{len:.8,w:.5});
    for(const sx of[-1,1])P(r.body,GEO.half,r.T(0x9ad8e8),[.46*sx,.98,0],[.18,.14,.18]);
    return r;
  },
  rook(){
    const r=chibi({skin:0xe0a07a,cloth:0x8a2a1c,acc:0x3a2a22,dark:0x2a1a14,belly:.5});
    const metal=r.T(0x5a5f68),horn=r.T(0xf1e6cc),hair=r.T(0xff5a2a),wood=r.T(0x5a3a22),steel=r.T(0xc8ced6);
    P(r.head,GEO.half,metal,[0,.1,0],[.58,.4,.56]);
    for(const sx of[-1,1]){P(r.head,GEO.cone,horn,[.5*sx,.42,.1],[.1,.5,.1],[.5,0,-.9*sx]);P(r.body,GEO.sph,metal,[.5*sx,.98,0],[.18,.14,.18]);}
    P(r.head,GEO.box,hair,[0,.52,-.05],[.1,.24,.5],null,.03);
    P(r.head,GEO.sph,hair,[0,-.32,.32],[.36,.2,.22]);
    for(const sx of[-1,1])P(r.head,GEO.box,r.T(0x1a0a08),[.2*sx,-.02,.5],[.12,.03,.02],null,0);
    P(r.body,GEO.box,r.T(0x3a2a22),[0,.86,.33],[.06,.6,.05],[0,0,.7],.02);
    axeIn(r,r.handR,wood,steel,.8);axeIn(r,r.handL,wood,steel,.8);
    P(r.body,GEO.sph,r.T(0x7a5a3a),[0,1.04,-.2],[.5,.18,.32]);
    cape(r,0x5a1a14,{len:.74,w:.56,arc:.75});
    return r;
  },
  nyx(){
    const r=chibi({skin:0xd8d0e0,cloth:0x2a1838,acc:0x5ef0a0,dark:0x140c1c,robe:true,eye:0x2a0a3a});
    const hood=r.T(0x221430),bone=r.T(0xe9e3d0);
    P(r.head,GEO.sph,hood,[0,.05,-.12],[.63,.62,.52]);
    for(const sx of[-1,1])P(r.head,GEO.cone,hood,[.32*sx,.5,-.15],[.1,.32,.1],[0,0,-.5*sx]);
    P(r.head,GEO.sph,r.T(0xf0f0ff),[0,.28,.32],[.38,.12,.18]);
    for(let i=0;i<3;i++)P(r.body,GEO.sph,bone,[(i-1)*.14,1.05,.3],[.06,.06,.05],null,.02);
    staff(r,r.handR,r.T(0x2e2a2a),0x9effc8,0x5ef0a0,GEO.dodec);
    const sk=new THREE.Group();sk.position.set(-.7,1.6,.1);r.body.add(sk);
    P(sk,GEO.sph,bone,[0,0,0],[.14,.13,.14]);
    for(const sx of[-1,1])P(sk,GEO.sph,new THREE.MeshBasicMaterial({color:0x5ef0a0}),[.05*sx,0,.12],[.03,.03,.02],null,0);
    r.familiar=sk;
    cape(r,0x1a0e26,{len:.9,w:.5,arc:.9});
    for(const sx of[-1,1])P(r.body,GEO.cone,r.T(0x2a1838),[.44*sx,1.02,0],[.14,.3,.14],[0,0,-1.1*sx]);
    return r;
  },
  mira(){
    const r=chibi({skin:0x9a6448,cloth:0x2a7ad8,acc:0xe8f4ff,dark:0x1a2a48,robe:true,blush:true});
    const hair=r.T(0xf0f4ff),shell=r.T(0xffc8d6),wood=r.T(0xc8b48a);
    P(r.head,GEO.sph,hair,[0,.06,-.14],[.6,.58,.5]);
    P(r.head,GEO.sph,hair,[0,-.35,-.3],[.4,.5,.3]);
    P(r.head,GEO.sph,hair,[0,.3,.3],[.42,.14,.2]);
    for(let i=-2;i<=2;i++)P(r.head,GEO.cone,shell,[i*.13,.56,.12],[.06,.22,.06],[.2,0,-i*.25],.02);
    P(r.body,GEO.torus,r.acc,[0,1.02,0],[.3,.3,.3],[Math.PI/2,0,0],0);
    staff(r,r.handR,wood,0x9fe4ff,0x45aaff);
    for(const sx of[-1,1]){P(r.body,GEO.half,shell,[.44*sx,.98,0],[.2,.15,.2]);for(let k=-1;k<=1;k++)P(r.body,GEO.box,r.T(0xe89aac),[.44*sx+k*.07,1.08,0],[.02,.06,.2],null,0);}
    cape(r,0x1a5ab8,{len:.8,w:.48,arc:.7});
    return r;
  },
  /* ---- inimigos ---- */
  goblin(){
    const r=goblinBase({});
    P(r.head,GEO.half,r.T(0x6b4a2e),[0,.12,-.02],[.56,.42,.54]);
    const sp=new THREE.Group();r.handR.add(sp);
    P(sp,GEO.cyl,r.T(0x6b4a2e),[0,.3,0],[.04,1.4,.04]);
    P(sp,GEO.cone,r.T(0xb9c0c8),[0,1.08,0],[.08,.24,.08]);
    return r;
  },
  arqueiro(){
    const r=goblinBase({cloth:0x4d6b2f,acc:0x6b4a2e});
    P(r.head,GEO.sph,r.T(0x3e5a26),[0,.1,-.12],[.6,.55,.5]);
    const b1=new THREE.Group(),b2=new THREE.Group();b2.rotation.y=-Math.PI/2;b1.rotation.z=-Math.PI/2;r.handL.add(b2);b2.add(b1);
    P(b1,GEO.bow,r.T(0x8a5a2b),[0,0,0],[1,1,1],null,.03);
    P(r.body,GEO.cyl,r.T(0x6b4a2e),[.12,.86,-.34],[.1,.5,.1],[.4,0,-.3]);
    return r;
  },
  xama(){
    const r=goblinBase({skin:0x4fb3a0,cloth:0x3c5a6a,acc:0xd9c49a,brow:0x2d6b5e});
    const bone=r.T(0xd9c49a),red=r.T(0xc0392b);
    P(r.head,GEO.cyl,bone,[0,-.02,.5],[.3,.05,.34],[Math.PI/2,0,0]);
    const hole=new THREE.MeshBasicMaterial({color:0x0d0a10});
    for(const sx of[-1,1]){P(r.head,GEO.sph,hole,[.12*sx,.04,.56],[.06,.05,.02],null,0);P(r.head,GEO.box,red,[.18*sx,-.14,.56],[.04,.12,.02],null,0);}
    [[0xe74c3c,-.25],[0xf1c40f,0],[0x48c6ff,.25]].forEach(([c,a])=>P(r.head,GEO.cone,r.T(c),[a*.8,.66,-.1],[.07,.45,.04],[0,0,-a]));
    staff(r,r.handR,r.T(0x5a3a22),0x9fe4ff,0x48c6ff);
    return r;
  },
  esqueleto(){
    const r=skelBase({cloth:0x5b5f66,acc:0x7a2e2e});
    const rust=r.T(0x8a6a52),steel=r.T(0xc0c7cf);
    P(r.head,GEO.half,rust,[0,.1,0],[.58,.46,.56]);
    const sw=new THREE.Group();r.handR.add(sw);sw.rotation.x=-.4;
    P(sw,GEO.box,steel,[0,0,.42],[.09,.03,.66],null,.03);
    P(sw,GEO.box,rust,[0,0,.08],[.28,.06,.06],null,.03);
    const sh=new THREE.Group();sh.position.set(-.06,0,.1);sh.rotation.y=-.5;r.handL.add(sh);
    P(sh,GEO.cyl,rust,[0,0,0],[.3,.06,.3],[Math.PI/2,0,0]);
    return r;
  },
  magoEsq(){
    const r=skelBase({cloth:0x3b2459,acc:0xb47bff,robe:true,glow:0xd59bff});
    P(r.head,GEO.sph,r.T(0x2c1a44),[0,.06,-.13],[.62,.6,.5]);
    P(r.head,GEO.cone,r.T(0x2c1a44),[0,.55,-.25],[.26,.5,.26],[-.6,0,0]);
    staff(r,r.handR,r.T(0x3a2a2a),0xe2b8ff,0xb47bff);
    return r;
  },
  diabrete(){
    const r=goblinBase({skin:0xd8483a,cloth:0x2a1414,acc:0xffa62a,brow:0x6a1a10,dark:0x1a0a0a});
    const horn=r.T(0x2a1a14);
    for(const sx of[-1,1])P(r.head,GEO.cone,horn,[.22*sx,.5,0],[.08,.28,.08],[0,0,-.35*sx]);
    const tail=P(r.body,GEO.cyl,r.skin,[0,.45,-.38],[.04,.6,.04],[-.9,0,0]);
    P(tail,GEO.cone,horn,[0,.55,0],[2,.3,2],null,.02);
    staff(r,r.handR,r.T(0x3a2a22),0xffc070,0xff5a1a);
    return r;
  },
  bruto(){
    const r=goblinBase({skin:0x8a4a3a,cloth:0x221a1a,acc:0xff7a2a,brow:0x3a1a10,belly:.5});
    const metal=r.T(0x4a4a52),wood=r.T(0x3a2a22);
    P(r.head,GEO.half,metal,[0,.12,-.02],[.58,.44,.56]);
    for(const sx of[-1,1])P(r.body,GEO.half,metal,[.5*sx,.98,0],[.2,.16,.2]);
    const cl=new THREE.Group();r.handR.add(cl);cl.rotation.x=-.5;
    P(cl,GEO.club,wood,[0,0,.55],[1,1,1],[Math.PI/2,0,0]);
    const lava=new THREE.MeshBasicMaterial({color:0xff7a2a});
    for(let i=0;i<3;i++)P(cl,GEO.sph,lava,[Math.cos(i*2)*.15,Math.sin(i*2)*.15,.85],[.05,.05,.05],null,0);
    return r;
  },
  /* ---- chefes ---- */
  grakk(){
    const r=goblinBase({skin:0x6aa840,cloth:0x5a3a22,acc:0xc9a046,brow:0x2d4a18,belly:.48});
    const fur=r.T(0xb08a5a),wood=r.T(0x6b4426),metal=r.T(0xb9c0c8);
    crown(r,.42,.95,0x5eff7a);
    for(const sx of[-1,1])P(r.body,GEO.sph,fur,[.42*sx,1,-.05],[.26,.18,.26]);
    P(r.body,GEO.sph,fur,[0,1.02,-.2],[.46,.16,.3]);
    for(const sx of[-1,1])P(r.head,GEO.cone,r.T(0xf1ead6),[.14*sx,-.26,.42],[.05,.16,.05],[.3,0,0]);
    axeIn(r,r.handR,wood,metal,.95);
    return r;
  },
  lich(){
    const r=skelBase({cloth:0x1e1430,acc:0x5ef0a0,robe:true,glow:0x5ef0a0});
    P(r.head,GEO.sph,r.T(0x160e24),[0,.06,-.14],[.63,.6,.5]);
    crown(r,.42,1,0x5ef0a0);
    for(const sx of[-1,1])P(r.body,GEO.cone,r.T(0x160e24),[.48*sx,1.02,0],[.16,.36,.16],[0,0,-.9*sx]);
    staff(r,r.handR,r.T(0x2a2224),0x9effc8,0x5ef0a0,GEO.dodec);
    return r;
  },
  gorruk(){
    const r=chibi({skin:0x6c93b8,cloth:0x4a3829,acc:0xd8a531,dark:0x2a2018,belly:.52,eye:0x2a0a00,eyeW:.06,eyeH:.07});
    const tusk=r.T(0xf1ead6),wood=r.T(0x6a4424),metal=r.T(0x8c96a3),brow=r.T(0x3d5671),gold=r.T(0xe2ad35);
    for(const sx of[-1,1]){
      P(r.head,GEO.cone,tusk,[.17*sx,-.24,.42],[.06,.2,.06],[.3,0,0]);
      P(r.head,GEO.box,brow,[.19*sx,.12,.46],[.22,.07,.05],[0,0,.4*sx],.03);
    }
    P(r.head,GEO.sph,r.skin,[0,-.08,.52],[.14,.11,.12]);
    crown(r);
    P(r.body,GEO.half,metal,[.5,.98,0],[.24,.2,.24]);
    P(r.body,GEO.cone,metal,[.56,1.18,0],[.06,.18,.06],[0,0,-.4],.03);
    P(r.body,GEO.box,gold,[0,.56,.42],[.18,.14,.06],null,.03);
    const cl=new THREE.Group();r.handR.add(cl);cl.rotation.x=-.5;
    P(cl,GEO.club,wood,[0,0,.55],[1,1,1],[Math.PI/2,0,0]);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2;P(cl,GEO.cone,metal,[Math.cos(a)*.2,Math.sin(a)*.2,.9],[.05,.14,.05],[Math.sin(a)*1.57,0,-Math.cos(a)*1.57],.02);}
    return r;
  },
  ignar(){
    const r=chibi({skin:0x4a3c3a,cloth:0x2e2422,acc:0xff6a1a,dark:0x1e1614,belly:.52,eye:0xffa040,eyeW:.09,eyeH:.06,noShine:true});
    const rock=r.T(0x3a302e),lava=new THREE.MeshBasicMaterial({color:0xff7a2a});
    for(const sx of[-1,1]){P(r.body,GEO.dodec,rock,[.52*sx,1.02,0],[.3,.26,.3]);P(r.head,GEO.dodec,rock,[.38*sx,.32,-.1],[.18,.2,.18]);}
    P(r.head,GEO.dodec,rock,[0,.44,-.05],[.26,.18,.24]);
    for(const sx of[-1,1])P(r.head,GEO.sph,lava,[.19*sx,-.02,.5],[.09,.05,.03],null,0);
    P(r.body,GEO.sph,lava,[0,.78,.34],[.14,.14,.06],null,0);
    const core=glowSprite(0xff6a1a,1.1,.8);core.position.set(0,.78,.4);r.body.add(core);
    for(const h of[r.handL,r.handR])P(h,GEO.dodec,rock,[0,-.04,.04],[.26,.26,.26]);
    for(let i=0;i<5;i++)P(r.body,GEO.box,lava,[rand(-.3,.3),rand(.45,1),.36],[.03,rand(.1,.22),.02],[0,0,rand(-.6,.6)],0);
    r.orb=r.handR;
    return r;
  }
};
