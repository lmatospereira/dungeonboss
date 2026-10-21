# Balanceamento

Relatório gerado por `tools/godot.sh balance --write` (núcleo de combate do Godot, semente 1). Não edite à mão: mude os números em `data/` e gere de novo.

## PvP (Invasão): vitória por herói

1500 lutas por evolução, equipes de 4 sorteadas, nível 10. Cada luta é jogada nos dois lados (ataque e defesa) para anular a vantagem de quem ataca. Meta: 45% a 55%.

| Herói | Tipo | Evo 1 | Evo 2 | Evo 3 | Dano/luta | Cura+escudo/luta |
|---|---|---|---|---|---|---|
| Brom | Tanque | 53% ✅ | 54% ✅ | 55% 🔺 | 616 | 1942 |
| Lyra | Dano | 54% ✅ | 55% ✅ | 52% ✅ | 3077 | 0 |
| Alva | Suporte | 46% ✅ | 50% ✅ | 48% ✅ | 528 | 4156 |
| Vex | Dano | 48% ✅ | 46% ✅ | 46% ✅ | 4068 | 0 |
| Kai | Dano | 52% ✅ | 50% ✅ | 52% ✅ | 3965 | 0 |
| Mira | Suporte | 48% ✅ | 47% ✅ | 46% ✅ | 2134 | 5904 |
| Rook | Tanque | 46% ✅ | 49% ✅ | 49% ✅ | 2722 | 848 |
| Nyx | Dano | 49% ✅ | 49% ✅ | 50% ✅ | 3495 | 656 |

## Masmorras: chance de vitória

300 corridas por linha, equipes de 4 sorteadas com os heróis disponíveis, heróis no nível da masmorra. Meta no nível recomendado com evolução 1: 70% a 85% (o Covil dos Goblins é o tutorial: 85% a 95%). Rodadas do chefe = ações do chefe; meta 8 a 15.

| Masmorra | Nível dos heróis | Evo | Vitória | Salas limpas (média) | Rodadas do chefe | Heróis vivos no fim |
|---|---|---|---|---|---|---|
| Covil dos Goblins | 1 | 1 | 92% ✅ | 2.9 de 3 | 9.3 ✅ | 3.3 |
| Covil dos Goblins | 3 | 1 | 100%  | 3.0 de 3 | 6.9 🔻 | 3.9 |
| Covil dos Goblins | 1 | 2 | 100%  | 3.0 de 3 | 7.3 🔻 | 3.9 |
| Cripta Esquecida | 4 | 1 | 81% ✅ | 2.8 de 3 | 10.8 ✅ | 3.1 |
| Cripta Esquecida | 6 | 1 | 99%  | 3.0 de 3 | 8.2 ✅ | 3.7 |
| Cripta Esquecida | 4 | 2 | 100%  | 3.0 de 3 | 7.6 🔻 | 3.9 |
| Pântano do Lodo | 8 | 1 | 79% ✅ | 2.8 de 3 | 13.3 ✅ | 3.3 |
| Pântano do Lodo | 10 | 1 | 98%  | 3.0 de 3 | 10.2 ✅ | 3.7 |
| Pântano do Lodo | 8 | 2 | 100%  | 3.0 de 3 | 8.6 ✅ | 3.8 |
| Forja Infernal | 12 | 1 | 69% 🔻 | 2.7 de 3 | 11.7 ✅ | 3.1 |
| Forja Infernal | 14 | 1 | 84%  | 2.8 de 3 | 10.8 ✅ | 3.5 |
| Forja Infernal | 12 | 2 | 99%  | 3.0 de 3 | 9.1 ✅ | 3.8 |

## Histórico de ajustes

### 2026-10-21: primeiro balanceamento com o simulador

**Antes** (valores originais, 600 lutas PvP e 120 corridas por masmorra):

- **PvP:** os heróis iam de 38% (Mira) a 66% (Brom).
- **Masmorras:** quase todas ficavam com 98% a 100% de vitória.
- **Chefes:** caíam em 3 a 7 rodadas. Só o Pântano estava no ponto.

**Depois:** todos os heróis ficam entre 46% e 55%, as masmorras têm de 69% a 92% de vitória no nível recomendado, e os chefes duram de 9 a 13 rodadas.

| Onde | Mudança | Motivo |
|---|---|---|
| Brom | vida 1450 → 1350; defesa 20% → 12% | O tanque vencia 63% a 66%: escudos e redução de dano se somavam |
| Provocar / Fortaleza | escudo 25% → 18% / 15% → 10% da vida | Idem |
| Terremoto | dano 70% → 60%; atordoar 35% → 20% | Atordoar a equipe inteira com frequência era decisivo demais |
| Arma do Brom | +15% vida, +10% ataque, +5% defesa → +12% vida, +12% ataque | A defesa extra deixava o Brom 59% na evolução 3 |
| Mira | ataque 94 → 104; Jato d'Água 100% → 115%; Onda Curativa 110% → 140%; Bolha 180% → 220%; Maré Alta cura 70% → 90%; arma +12% → +18% de ataque | A suporte vencia só 38% a 42% |
| Alva | ataque 96 → 104; Luz Sagrada 100% → 110%; Prece 280% → 300%; Bênção 150% → 170% | 43% na evolução 1 |
| Vex | Dança das Sombras 55% → 70% por golpe; veneno 40% → 50% | Caía para 43% nas evoluções 2 e 3 |
| Kai | Flecha Perfurante 210% → 190% | 58% na evolução 1 |
| Lyra | Chuva de Meteoros 120% → 105%; Explosão Solar 320% → 250%, queimadura 50% → 40% | 58% na evolução 2 |
| Rook | Fúria Sanguinária 260% → 290% | 44% na evolução 2 |
| Evolução | bônus de atributos +15%/+30% → +8%/+16% | Com +15%, a evolução 2 tornava qualquer masmorra 100% vencível; o 4º poder já é o grande ganho |
| Chefes | vida: Grakk 2600 → 5600, Morvhal 3100 → 5800, Gorruk 3900 (sem mudança), Ignar 4400 → 7200; ataque: Grakk 100 → 136, Morvhal 118 → 130, Gorruk 138 → 128, Ignar 146 → 134 | Lutas de chefe curtas demais (3 a 7 rodadas) |
| Inimigos comuns | goblins e arqueiros com mais vida e ataque; esqueletos, magos, diabretes e brutos com mais ataque; bruto com menos vida | As salas não ofereciam perigo |
| Covil dos Goblins | meta própria de tutorial: 85% a 95% (`targetWin` em `data/dungeons.json`) | Primeira masmorra deve ser vencível por quem está aprendendo |

**Observações:**
- A evolução 2 ainda deixa as masmorras perto de 100% no nível delas. Isso é intencional: ela exige nível 5, cristais e ouro, e jogar com evolução 1 continua viável.
- A Forja Infernal ficou com 69%, um ponto abaixo da meta, aceitável por ser o desafio final.
- A versão three.js publicada usa os mesmos `data/*.json`, então os ajustes valem para ela também.
