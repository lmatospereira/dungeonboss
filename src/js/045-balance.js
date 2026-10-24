/* ================= balanceamento: números vêm de data/ ================= */
/* Os números de combate ficam em data/abilities.json (values de cada habilidade) e data/rules.json (combat).
   Não escreva números nas habilidades (05-battle.js): use BAL[id].
   Depois de mudar os dados: npm test e npm run balance. */
const RULES=DATA.rules.combat;
const BAL=Object.fromEntries(Object.entries(DATA.abilities.abilities).map(([k,a])=>[k,a.values]));
const pct=v=>`${Math.round(v*100)}%`;
/* texto: {chave|pct} → 125%   {chave|bonus} → +25% (valor-1)   {chave} → valor   {rules.x|...} lê data/rules.json */
function abilityText(id){
  const a=DATA.abilities.abilities[id];if(!a||!a.text)return'';
  return a.text.replace(/\{([\w.]+)(?:\|(\w+))?\}/g,(m,key,fmt)=>{
    const v=key.startsWith('rules.')?RULES[key.slice(6)]:a.values[key];
    if(v===undefined)throw new Error(`texto da habilidade ${id} usa {${key}}, que não existe`);
    return fmt==='pct'?pct(v):fmt==='bonus'?'+'+pct(v-1):String(v);
  });
}
