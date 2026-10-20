// Monta o jogo a partir de src/ em duas saídas:
//  - www/index.html  → app Android (Capacitor) e site no Firebase Hosting, com bibliotecas locais
//  - dist/artifact.html → versão de demonstração de arquivo único (bibliotecas via CDN, sem Firebase)
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const r=p=>readFileSync(join(root,p),'utf8');
const nm=p=>join(root,'node_modules',p);

const css=r('src/style.css');
const body=r('src/body.html');
const jsFiles=readdirSync(join(root,'src/js')).filter(f=>f.endsWith('.js')).sort();
const js="(function(){'use strict';\n"+jsFiles.map(f=>`/* ${f} */\n`+r('src/js/'+f)).join('\n')+"\n})();";
const TITLE='Masmorra do Rei Ogro';

// ---------- versão artifact (arquivo único) ----------
mkdirSync(join(root,'dist'),{recursive:true});
const artifact=`<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Lilita+One&display=swap">
<style>
${css}
</style>
${body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
${js}
</script>
`;
writeFileSync(join(root,'dist/artifact.html'),artifact);

// ---------- versão www (app e site) ----------
const www=join(root,'www');
for(const d of['lib','fonts'])mkdirSync(join(www,d),{recursive:true});
copyFileSync(nm('three/build/three.min.js'),join(www,'lib/three.min.js'));
for(const f of['firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js'])copyFileSync(nm('firebase/'+f),join(www,'lib',f));
const fonts=[['lilita-one','Lilita One',[400]],['baloo-2','Baloo 2',[500,600,700,800]]];
let fontCss='';
for(const [pkg,fam,ws] of fonts)for(const w of ws)for(const sub of['latin','latin-ext']){
  const f=`${pkg}-${sub}-${w}-normal.woff2`;const src=nm(`@fontsource/${pkg}/files/${f}`);
  if(!existsSync(src))continue;copyFileSync(src,join(www,'fonts',f));
  const range=sub==='latin'?'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD':'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  fontCss+=`@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(${f}) format('woff2');unicode-range:${range}}\n`;
}
writeFileSync(join(www,'fonts/fonts.css'),fontCss);
copyFileSync(join(root,existsSync(join(root,'config/firebase-config.js'))?'config/firebase-config.js':'config/firebase-config.example.js'),join(www,'firebase-config.js'));
const reset=':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box;height:100%}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const index=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#110c18">
<title>${TITLE}</title>
<link rel="icon" href="icon.png">
<link rel="stylesheet" href="fonts/fonts.css">
<style>${reset}</style>
</head><body>
<style>
${css}
</style>
${body}
<script src="lib/three.min.js"></script>
<script src="lib/firebase-app-compat.js"></script>
<script src="lib/firebase-auth-compat.js"></script>
<script src="lib/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script>
${js}
</script>
</body></html>
`;
writeFileSync(join(www,'index.html'),index);
copyFileSync(join(root,'src/privacidade.html'),join(www,'privacidade.html'));
if(existsSync(join(root,'assets/icon-512.png')))copyFileSync(join(root,'assets/icon-512.png'),join(www,'icon.png'));
console.log('ok: dist/artifact.html',Math.round(artifact.length/1024)+'KB · www/index.html',Math.round(index.length/1024)+'KB');
