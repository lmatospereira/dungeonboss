# Guia do jogo

Masmorra do Rei Ogro é um RPG de masmorra em 3D com combate por turnos, inspirado no estilo de Dungeon Boss. Todos os personagens, nomes e artes são originais.

O jogador monta uma equipe de 4 heróis, atravessa masmorras com 2 salas e um chefe, evolui os heróis e invade a masmorra de outros jogadores.

## Sumário

- [Telas](#telas)
- [Combate](#combate)
- [Triângulo de elementos](#triângulo-de-elementos)
- [Efeitos de status](#efeitos-de-status)
- [Heróis](#heróis)
- [Progressão: nível e evolução](#progressão-nível-e-evolução)
- [Masmorras e chefes](#masmorras-e-chefes)
- [Invasão (PvP assíncrono)](#invasão-pvp-assíncrono)
- [Recompensas](#recompensas)
- [Contas e salvamento](#contas-e-salvamento)

## Telas

| Tela | Para que serve |
|---|---|
| Início | Conta do jogador, ouro, cristais, troféus e poder da equipe. Dá acesso às outras telas. |
| Masmorras | Mapa com as 4 masmorras, estrelas conquistadas, chefe e poder recomendado. |
| Monte sua equipe | Escolha de 4 heróis, com vitrine 3D, ficha do herói e triângulo de elementos. |
| Heróis | Ficha completa, treino com ouro e evolução com cristais. |
| Invasão | Oponentes, ranking e a sua equipe de defesa. |
| Batalha | Combate por turnos, com os modos AUTO e 2x. |
| Resultado | Estrelas, experiência, ouro, cristais e troféus ganhos. |

## Combate

- **Ordem dos turnos:** depende da velocidade de cada unidade. Quem é mais rápido age mais vezes, e a ordem aparece no topo da tela.
- **Poderes:** cada herói tem 1 ataque básico e 2 habilidades com recarga. A partir da evolução 2, ganha também um 4º poder, o **poder supremo**.
- **Como agir:** na vez de um herói, o jogador toca num poder e depois no alvo. Poderes de área ou em si mesmo pedem um segundo toque no próprio botão.
- **Escudo:** absorve dano antes da vida. A Flecha Perfurante atravessa escudos.
- **AUTO:** a IA joga pelos heróis. É a mesma IA que controla as equipes de defesa na Invasão.
- **2x:** dobra a velocidade das animações.
- **Sair:** abandonar a luta pede confirmação. Na masmorra, você fica com a recompensa das salas já limpas; na Invasão, conta como derrota.

## Triângulo de elementos

```
        Fogo
       ↗    ↘
   Água  ←  Natureza          Luz ⇄ Sombra
```

- Fogo vence Natureza, Natureza vence Água e Água vence Fogo.
- Luz e Sombra causam dano extra uma na outra.
<!-- gerado:regras -->
- Vantagem de elemento: **150%** do dano. Desvantagem: **70%**.
- Crítico: **160%** do dano. Variação aleatória do dano: ±8%.
- Ao limpar uma sala, a equipe recupera **15%** da vida. Fúria: +30% de ataque.
<!-- /gerado:regras -->
- O jogo mostra a regra em vários lugares:
  - na escolha da equipe, com um diagrama e ▲/▼ em cada herói, conforme ele vai bem ou mal contra o chefe;
  - na batalha, com setas sobre cada inimigo durante a vez do seu herói;
  - na barra do chefe, que mostra a fraqueza dele.

## Efeitos de status

| Efeito | O que faz |
|---|---|
| Provocando | Ataques de alvo único dos inimigos vão para quem provoca. |
| Escudo | Absorve dano até acabar ou expirar. |
| Queimando / Envenenado | Perde vida no início de cada turno. |
| Atordoado | Perde a próxima vez. Chefes são imunes. |
| Fúria | +30% de ataque. |
| Preparando | O chefe vai usar o golpe forte no próximo turno. |

## Heróis

Os tipos (Tanque, Dano e Suporte) por enquanto só descrevem o papel do herói. Eles não mudam o dano.

<!-- gerado:herois -->
| Herói | Tipo · função | Elemento | Vida | Ataque | Velocidade | Crítico | Defesa | Como conseguir |
|---|---|---|---|---|---|---|---|---|
| Brom | Tanque · Guardião | Natureza | 1350 | 92 | 88 | 8% | 12% | Inicial |
| Lyra | Dano · Piromante | Fogo | 820 | 148 | 108 | 12% | 0% | Inicial |
| Alva | Suporte · Clériga | Luz | 960 | 104 | 100 | 8% | 0% | Inicial |
| Vex | Dano · Ladino | Sombra | 880 | 132 | 122 | 30% | 0% | Inicial |
| Kai | Dano · Arqueiro | Água | 860 | 128 | 114 | 20% | 0% | Inicial |
| Mira | Suporte · Sacerdotisa | Água | 940 | 104 | 106 | 8% | 0% | Inicial |
| Rook | Tanque · Berserker | Fogo | 1180 | 124 | 96 | 15% | 8% | Vencer Grakk |
| Nyx | Dano · Necromante | Sombra | 840 | 136 | 104 | 10% | 0% | Vencer Morvhal |
<!-- /gerado:herois -->

Os valores são os do nível 1 e da evolução 1.

### Poderes

A recarga é contada em turnos do próprio herói. O 4º poder só libera na evolução 2.

<!-- gerado:poderes -->
| Herói | Básico | Habilidade 1 | Habilidade 2 | 4º poder (evolução 2) |
|---|---|---|---|---|
| Brom | Golpe de Escudo: 100% de dano em um inimigo. | Provocar (4): Atrai os ataques individuais por 2 turnos e ganha escudo de 18% da vida. | Terremoto (4): 60% de dano em todos os inimigos e 20% de chance de atordoar cada um. | **Fortaleza (5): Dá a todos os aliados um escudo de 10% da vida máxima do Brom por 2 turnos e provoca os inimigos.** |
| Lyra | Faísca: 100% de dano em um inimigo. | Bola de Fogo (3): 220% de dano e queimadura por 2 turnos. | Chuva de Meteoros (5): 105% de dano em todos os inimigos e queimadura por 2 turnos. | **Explosão Solar (5): 250% de dano em um inimigo e queimadura forte por 3 turnos.** |
| Alva | Luz Sagrada: 110% de dano em um inimigo. | Prece (2): Cura um aliado em 300% do ataque. | Bênção Coletiva (4): Cura todos os aliados em 170% do ataque e remove veneno, queimadura e atordoamento. | **Ressurreição (6): Traz de volta um aliado caído com 45% da vida.** |
| Vex | Corte Duplo: 2 golpes de 55% em um inimigo. | Lâmina Venenosa (3): 140% de dano e veneno por 3 turnos. | Execução (4): 250% de dano, com +60% se o alvo estiver abaixo de 30% de vida. | **Dança das Sombras (4): 4 golpes de 70% em inimigos aleatórios, com +15% de chance de crítico.** |
| Kai | Tiro Certeiro: 100% de dano em um inimigo. | Flecha Perfurante (3): 190% de dano que atravessa escudos, com +20% de chance de crítico. | Chuva de Flechas (4): 85% de dano em todos os inimigos. | **Tiro Atordoante (5): 160% de dano e atordoa o alvo por 1 turno.** |
| Mira | Jato d'Água: 115% de dano em um inimigo. | Onda Curativa (3): Cura todos os aliados em 140% do ataque. | Bolha Protetora (4): Dá a todos os aliados um escudo de 220% do ataque por 2 turnos. | **Maré Alta (5): 80% de dano em todos os inimigos e cura todos os aliados em 90% do ataque.** |
| Rook | Machadada: 100% de dano em um inimigo. | Sede de Batalha (4): Ganha +30% de ataque por 2 turnos e recupera 15% da vida. | Redemoinho (4): 90% de dano em todos os inimigos e queimadura por 2 turnos. | **Fúria Sanguinária (5): 290% de dano em um inimigo e recupera 50% do dano causado.** |
| Nyx | Toque Sombrio: 100% de dano em um inimigo. | Drenar Vida (3): 170% de dano e recupera 60% do dano causado. | Maldição (4): 45% de dano em todos os inimigos e veneno por 3 turnos. | **Colheita de Almas (5): 110% de dano em todos os inimigos; Nyx recupera 35% do dano total.** |
<!-- /gerado:poderes -->

### Armas lendárias (evolução 3)

<!-- gerado:armas -->
| Herói | Arma | Bônus |
|---|---|---|
| Brom | Machado Rachapedra | +12% vida, +12% ataque |
| Lyra | Cajado da Fênix | +22% ataque, +5% crítico |
| Alva | Maça da Aurora | +12% vida, +15% ataque |
| Vex | Adagas do Eclipse | +15% ataque, +10% crítico, +6 velocidade |
| Kai | Arco das Marés | +20% ataque, +8% crítico |
| Mira | Tridente Coral | +15% vida, +18% ataque |
| Rook | Machados Brasa Viva | +10% vida, +20% ataque |
| Nyx | Foice das Almas | +8% vida, +20% ataque, +5% crítico |
<!-- /gerado:armas -->

Na batalha, a arma lendária brilha e solta faíscas.

## Progressão: nível e evolução

**Nível (1 a 30)**
- Cada nível dá +10% de vida e de ataque.
- Para passar do nível `L` para o próximo, o herói precisa de `40 + 40 × L` de experiência.
- A experiência vem das batalhas. Também é possível treinar com ouro, a um custo de `40 × L × 1,1^(L−1)` (arredondado).

**Evolução (1 a 3)**

<!-- gerado:evolucao -->
| Evolução | Requisitos | Efeito |
|---|---|---|
| 1 | Forma inicial | 3 poderes |
| 2 | Nível 5, 3 cristais e 300 de ouro | +8% de vida e ataque e libera o **4º poder** |
| 3 | Nível 12, 8 cristais e 1.500 de ouro | +16% no total e libera a **arma lendária** |
<!-- /gerado:evolucao -->

O multiplicador total de atributos é `nível × evolução × arma`. Os retratos mostram estrelas com a evolução de cada herói.

**Poder da equipe:** soma de `vida × 0,1 + ataque × 1,5 × (1 + crítico × 0,6)` de cada herói, com um bônus a partir da evolução 2. O mapa compara esse número com o poder recomendado de cada masmorra.

## Masmorras e chefes

Cada masmorra tem 2 salas de inimigos e um chefe. Vencer a anterior libera a próxima.

<!-- gerado:masmorras -->
| Masmorra | Nível | Inimigos | Chefe (elemento, vida, ataque no nível 1) | Recompensa especial |
|---|---|---|---|---|
| Covil dos Goblins | 1 | Goblin Lanceiro, Goblin Arqueiro, Xamã do Lodo | Grakk, Chefe Goblin (Natureza, 5600, 136) | Recruta Rook |
| Cripta Esquecida | 4 | Esqueleto Guerreiro, Esqueleto Arcano | Morvhal, o Lich (Sombra, 5800, 130) | Recruta Nyx |
| Pântano do Lodo | 8 | Xamã do Lodo, Goblin Lanceiro, Goblin Arqueiro | Gorruk, Rei Ogro do Lodo (Água, 3900, 128) | — |
| Forja Infernal | 12 | Diabrete, Bruto de Magma | Ignar, Golem da Forja (Fogo, 7200, 134) | — |
<!-- /gerado:masmorras -->

**Padrão dos chefes:**
<!-- gerado:chefe -->
- **Ataque básico:** 130% num alvo.
- **Ataque em área:** 75% em todos, com recarga de 3 turnos (usado com 60% de chance quando pronto). Pode aplicar veneno ou queimadura, conforme o chefe.
- **Golpe telegrafado:** de 4 em 4 ações o chefe se prepara, e a faixa "… no próximo turno!" avisa. No turno seguinte ele usa o golpe forte: 190% em todos.
- **Fúria:** abaixo de 50% de vida, o chefe ganha +30% de ataque e chama 2 reforços.
<!-- /gerado:chefe -->

## Invasão (PvP assíncrono)

- **Oponentes:** a tela mostra 3, com troféus próximos aos seus. Sem jogadores reais suficientes, ou jogando sem conta, aparecem oponentes simulados.
- **A luta:** sua equipe atual ataca a **equipe de defesa** do oponente, que é controlada pela IA.
- **Troféus (Elo):** cada luta vale até ±32 troféus, calculados no servidor. O defensor ganha ou perde a mesma quantidade.
- **Sua defesa:** é escolhida na aba **Defesa**. O resultado das invasões que você sofreu aparece na próxima vez que você abrir o jogo.
- **Proteções:** uma vitória com menos de 8 segundos de luta não vale troféus, e cada invasão só pode ter um resultado.

## Recompensas

| Situação | Experiência por herói | Ouro | Cristais |
|---|---|---|---|
| Sala limpa (nível L) | 30 + 12 × L | 25 + 10 × L | — |
| Sala do chefe | 2× a de uma sala comum | 3× o de uma sala comum | — |
| Primeira vitória na masmorra | — | +100 × nível da masmorra | 3 |
| Vitória repetida | — | — | 1 |
| Vitória na Invasão | 50 | 60 + 6 × nível médio da equipe | 1 |
| Derrota na Invasão | 15 | 15 | — |

**Estrelas:** 3 com os 4 heróis de pé no fim, 2 com pelo menos 2 de pé, e 1 com um só.

## Contas e salvamento

- **Sem conta (convidado):** o progresso fica só no navegador.
- **Com conta (nome e senha):**
  - o progresso vai para o servidor e pode ser continuado em outro aparelho;
  - é preciso ter conta para enfrentar jogadores reais e aparecer no ranking.
- **Criar conta:** leva o progresso atual do aparelho para a conta nova.
- **Entrar numa conta existente:** o progresso da conta substitui o do aparelho.
- **Sair da conta:** o aparelho volta a ter um progresso de convidado zerado. O da conta continua salvo.
- **Sem servidor** (por exemplo, abrindo `dist/artifact.html`): o jogo roda inteiro offline, e a Invasão usa oponentes simulados.
