// Gera as tabelas de números do docs/jogo.md a partir de data/*.json.
//   node tools/docs-data.mjs          reescreve os trechos entre <!-- gerado:X --> e <!-- /gerado:X -->
//   node tools/docs-data.mjs --check  só confere (sai com erro se o doc estiver desatualizado)
import {readFileSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = Object.fromEntries(['heroes', 'enemies', 'abilities', 'dungeons', 'rules', 'progression']
  .map(f => [f, JSON.parse(readFileSync(join(root, 'data', f + '.json'), 'utf8'))]));
const H = D.heroes.heroes, A = D.abilities.abilities, R = D.rules.combat, P = D.progression, EL = D.rules.elements;
const pct = v => `${Math.round(v * 100)}%`;
const text = id => A[id].text.replace(/\{([\w.]+)(?:\|(\w+))?\}/g, (m, k, f) => {
  const v = k.startsWith('rules.') ? R[k.slice(6)] : A[id].values[k];
  return f === 'pct' ? pct(v) : f === 'bonus' ? '+' + pct(v - 1) : String(v);
});
const ab = id => `${A[id].name}${A[id].values.cd ? ` (${A[id].values.cd})` : ''}: ${text(id)}`;
const unlock = Object.fromEntries(D.dungeons.dungeons.filter(d => d.unlockHero).map(d => [d.unlockHero, d.boss]));
const bossName = k => D.enemies.bosses[k].short || D.enemies.bosses[k].name;
const bonus = w => [w.hp && `+${pct(w.hp)} vida`, w.atk && `+${pct(w.atk)} ataque`, w.crit && `+${pct(w.crit)} crítico`, w.spd && `+${w.spd} velocidade`, w.dr && `+${pct(w.dr)} defesa`].filter(Boolean).join(', ');

const sections = {
  herois: () => ['| Herói | Tipo · função | Elemento | Vida | Ataque | Velocidade | Crítico | Defesa | Como conseguir |', '|---|---|---|---|---|---|---|---|---|',
    ...D.heroes.order.map(k => { const h = H[k]; return `| ${h.name} | ${D.heroes.types[h.type].n} · ${h.role} | ${EL[h.el].name} | ${h.hp} | ${h.atk} | ${h.spd} | ${pct(h.crit ?? R.critDefault ?? 0.1)} | ${pct(h.dr || 0)} | ${D.heroes.starters.includes(k) ? 'Inicial' : `Vencer ${bossName(unlock[k])}`} |`; })],
  poderes: () => ['| Herói | Básico | Habilidade 1 | Habilidade 2 | 4º poder (evolução 2) |', '|---|---|---|---|---|',
    ...D.heroes.order.map(k => `| ${H[k].name} | ${H[k].abilities.map(ab).join(' | ')} | **${ab(H[k].ult)}** |`)],
  armas: () => ['| Herói | Arma | Bônus |', '|---|---|---|', ...D.heroes.order.map(k => `| ${H[k].name} | ${H[k].weapon.name} | ${bonus(H[k].weapon)} |`)],
  evolucao: () => { const m = P.evolution.mult, q = P.evolution.require; return ['| Evolução | Requisitos | Efeito |', '|---|---|---|',
    '| 1 | Forma inicial | 3 poderes |',
    `| 2 | Nível ${q[2].lvl}, ${q[2].crystals} cristais e ${q[2].gold.toLocaleString('pt-BR')} de ouro | +${pct(m[2] - 1)} de vida e ataque e libera o **4º poder** |`,
    `| 3 | Nível ${q[3].lvl}, ${q[3].crystals} cristais e ${q[3].gold.toLocaleString('pt-BR')} de ouro | +${pct(m[3] - 1)} no total e libera a **arma lendária** |`]; },
  regras: () => [`- Vantagem de elemento: **${pct(R.elemAdv)}** do dano. Desvantagem: **${pct(R.elemDis)}**.`,
    `- Crítico: **${pct(R.critMult)}** do dano. Variação aleatória do dano: ±${pct(R.dmgVariance)}.`,
    `- Ao limpar uma sala, a equipe recupera **${pct(R.roomHeal)}** da vida. Fúria: +${pct(R.enrageAtk - 1)} de ataque.`],
  masmorras: () => ['| Masmorra | Nível | Inimigos | Chefe (elemento, vida, ataque no nível 1) | Recompensa especial |', '|---|---|---|---|---|',
    ...D.dungeons.dungeons.map(d => { const b = D.enemies.bosses[d.boss]; const en = [...new Set(d.rooms.flat())].map(k => D.enemies.enemies[k].name).join(', ');
      return `| ${d.name} | ${d.lvl} | ${en} | ${b.name} (${EL[b.el].name}, ${b.hp}, ${b.atk}) | ${d.unlockHero ? `Recruta ${H[d.unlockHero].name}` : '—'} |`; })],
  chefe: () => { const v = id => A[id].values; return [
    `- **Ataque básico:** ${pct(v('bBasic').dmg)} num alvo.`,
    `- **Ataque em área:** ${pct(v('bAoe').dmg)} em todos, com recarga de ${v('bAoe').cd} turnos (usado com ${pct(v('bAoe').useChance)} de chance quando pronto). Pode aplicar veneno ou queimadura, conforme o chefe.`,
    `- **Golpe telegrafado:** de ${v('bPrep').every} em ${v('bPrep').every} ações o chefe se prepara, e a faixa "… no próximo turno!" avisa. No turno seguinte ele usa o golpe forte: ${pct(v('bBig').dmg)} em todos.`,
    `- **Fúria:** abaixo de ${pct(v('bRage').at)} de vida, o chefe ganha +${pct(R.enrageAtk - 1)} de ataque e chama ${v('bRage').adds} reforços.`]; },
};

const check = process.argv.includes('--check');
const file = join(root, 'docs', 'jogo.md');
let doc = readFileSync(file, 'utf8'), changed = [];
for (const [name, gen] of Object.entries(sections)) {
  const re = new RegExp(`(<!-- gerado:${name} -->\\n)[\\s\\S]*?(\\n<!-- /gerado:${name} -->)`);
  if (!re.test(doc)) { console.error(`docs/jogo.md não tem o marcador gerado:${name}`); process.exit(1); }
  const next = doc.replace(re, `$1${gen().join('\n')}$2`);
  if (next !== doc) changed.push(name);
  doc = next;
}
if (check) { if (changed.length) { console.error('docs/jogo.md desatualizado: ' + changed.join(', ') + ' (rode node tools/docs-data.mjs)'); process.exit(1); } console.log('docs/jogo.md em dia'); }
else { writeFileSync(file, doc); console.log(changed.length ? 'atualizado: ' + changed.join(', ') : 'nada a mudar'); }
