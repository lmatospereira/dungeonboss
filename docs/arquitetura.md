# Arquitetura técnica

## Visão geral

```
navegador / app Android
   │  HTTPS
   ▼
proxy reverso já existente na VPS (Caddy, porta 443)   ← opcional; sem ele, a porta do jogo é exposta direto
   │  rede docker do proxy (alias masmorra-web)
   ▼
┌─────────────────────── projeto docker "masmorra" ───────────────────────┐
│  web  (nginx)  ── serve www/  ──  /api/* ─►  api (Node 22 + Fastify)    │
│                                                  │                      │
│                                                  ▼                      │
│                                           db (Postgres 17, volume)      │
└─────────────────────────────────────────────────────────────────────────┘
```

| Pasta | Conteúdo |
|---|---|
| `data/` | **Fonte única dos números do jogo**: heróis, inimigos, chefes, habilidades (valores, alvo e texto), masmorras, regras e progressão. |
| `src/` | Código da versão three.js: `style.css`, `body.html` (símbolos SVG e DOM) e `js/*.js`. |
| `tools/build.mjs` | Monta `www/` (site e app) e `dist/artifact.html` (arquivo único). |
| `www/` | Gerado pelo build. Não fica no git. |
| `server/` | API: `src/index.js` (rotas) e `src/db.js` (conexão e migrações). |
| `deploy/` | `compose.yml`, `compose.proxy.yml` e `nginx.conf` da stack no servidor. |
| `android/` | Projeto Capacitor do app Android. |
| `docs/` | Esta documentação. |
| `game/` | Projeto Godot 4.6 (versão nova, publicada em `/v2/`). Ver "Versão Godot e arte". |
| `art/blender/` | Scripts Python que geram no Blender os personagens e o kit da masmorra (`.glb`). |

## Cliente (o jogo)

### Build

O `tools/build.mjs` lê `data/*.json` e embute tudo como a constante `DATA`. Depois concatena `src/js/*.js` **em ordem alfabética** dentro de uma única função (IIFE). Por isso todos os módulos compartilham o mesmo escopo, e não existe `import`/`export`. Um arquivo novo precisa de um prefixo numérico que o coloque depois das dependências dele.

O build gera duas saídas:

| Saída | Bibliotecas | Uso |
|---|---|---|
| `www/index.html` | Locais: `www/lib/three.min.js` e as fontes em `www/fonts/` | Site na VPS e app Android |
| `dist/artifact.html` | CDN (three.js r128 do cdnjs e fontes do Google Fonts) | Demonstração de arquivo único, que roda offline |

O build também grava `www/config.js` com `window.MASMORRA_API = process.env.API_URL || '/api'`. No site da VPS, a API fica no mesmo endereço do jogo, em `/api`. Para o app Android, que roda de arquivos locais, é preciso passar `API_URL` com o endereço completo (`npm run android`).

### Módulos

| Arquivo | Responsabilidade |
|---|---|
| `01-core.js` | Utilidades, tweens, som sintetizado com WebAudio (sem arquivos de áudio), elementos e `toast` |
| `02-scene.js` | Renderizador three.js r128, luzes, temas das salas, cenário em instancing e partículas |
| `03-models.js` | Modelos chibi feitos de primitivas: `chibi()`, `cape()`, `staff()`, `addWeaponGlow()` etc. |
| `04-data.js` | Monta `DEFS`, `DUNGEONS`, `WEAPONS` e `HERO_INFO` a partir de `DATA`; fórmulas de nível, evolução, poder e recompensas; salvamento local (`SAVE`) |
| `045-balance.js` | `RULES` e `BAL` (números das habilidades, lidos de `DATA`) e `abilityText()`, que gera a descrição a partir do template |
| `05-battle.js` | `Unit`, dano, status, `AB` (todas as habilidades), IA, `revive`, posicionamento, câmera, laço de render e retratos |
| `06-flow.js` | HUD da batalha, seleção de alvo, fluxo de salas e turnos, recompensas e controles |
| `07-net.js` | `Net`: cliente da API (contas, sincronização, Invasão e ranking), com modo offline e oponentes simulados |
| `075-preview.js` | Vitrine 3D do herói (renderizador próprio) e diagrama do triângulo de elementos |
| `08-screens.js` | Telas de menu: início, conta, mapa, equipe, heróis, Invasão e resultado |
| `09-main.js` | Inicialização e parâmetros de depuração |

### Conceitos importantes

- **Unidade (`Unit`):** recebe `(chave, lado, nível, evolução)`.
  - Os atributos dos heróis vêm de `heroStats()`, que aplica nível, evolução e arma. Os dos inimigos vêm de `lm(nível)`.
  - `unit.abilities` vem de `heroAbilities()`, que só inclui o 4º poder (`DEFS[k].ult`) a partir da evolução 2.
- **Habilidade (`AB[id]`):** em `05-battle.js` fica só a lógica e a animação (`run`, `ai`, `aiTarget`). Nome, ícone, alvo, recarga, números e texto vêm de `data/abilities.json`. Ao carregar, o jogo falha com uma mensagem clara se faltar a lógica de uma habilidade que está nos dados, ou o contrário. Campos de cada habilidade:
  - `name`, `icon` e `desc`;
  - `cd` (recarga) e `start` (recarga inicial);
  - `target`: `enemy`, `enemies`, `ally`, `allies`, `self` ou `fallen`;
  - `kind`: `heal` ou `shield`;
  - `ult` (é poder supremo);
  - `run(u, alvo)`, uma função assíncrona com a animação e o efeito.
- **IA:**
  - `heroAI()` percorre as habilidades especiais da última para a primeira, ou seja, o poder supremo tem prioridade. É usada pelo AUTO e pelas equipes de defesa.
  - `enemyAI()` controla os inimigos comuns e os chefes. Os chefes usam o kit genérico `bk` definido em `DEFS`.
- **Laço de turnos (`battleLoop`):**
  - a unidade com o menor `timer` age, e depois o `timer` aumenta `1000/velocidade`;
  - `G.loopId` invalida laços antigos quando a batalha é reiniciada.
- **Salvamento:**
  - `SAVE` fica no localStorage, na chave `masmorra-v2`, e `normalizeSave()` valida e migra os dados;
  - `persist()` grava no aparelho e, com conta, agenda o envio ao servidor (`Net.pushSave`).

### Parâmetros de depuração (URL)

| Parâmetro | Efeito |
|---|---|
| `?turbo` | Velocidade 8x e AUTO ligado |
| `?sala=N` | Começa a masmorra na sala N |
| `?debug` | Expõe `window.__dbg` (`G`, `AB`, `SAVE()`, `kill`, `revive`, `fallenOf`) para testes automáticos |
| `?shot=lineup` | Imagem com todos os heróis lado a lado |
| `?shot=<chave>` | Retrato grande e transparente de um modelo (usado para gerar os ícones) |
| `/v2/?grupo=N` | Prévia Godot: começa a vitrine no grupo N (0 heróis, 1 inimigos, 2 chefes) |
| `/v2/?tema=<chave>` | Prévia Godot: fixa o cenário (`goblin`, `cripta`, `lodo`, `forja` ou `arena`) em todos os grupos |

### Versão Godot e arte

- **Atalhos:** `tools/godot.sh sync | test | balance | export | editor` (Godot em `GODOT_BIN`, padrão `~/opt`).
- **Núcleo sem gráficos:** `game/scripts/core/` (batalha, habilidades, IA, progressão), testado por `game/tests/run.gd`.
- **Apresentação:** `game/scripts/presentation/`
  - `stylize.gd`: troca os materiais do `.glb` por toon + contorno; tinge materiais pelo prefixo do nome (usado nos temas do cenário).
  - `dungeon_room.gd`: monta a sala com o kit (piso em MultiMesh, paredes, arco gradeado, pilares, tochas, estandartes, objetos por tema, trono na sala do chefe), luzes (no máximo 6, por causa do renderizador Compatibility), névoa e poeira. Cores de cada tema em `THEMES`, objetos em `PROPS`.
  - `flame.gd`: chama de tocha e braseiro (cones aditivos, brilho, faíscas e luz tremulando).
  - `showcase.gd`: a vitrine atual de `/v2/`.
- **Personagens:** `blender -b -P art/blender/heroes/<chave>.py` (também `enemies/` e `bosses/`) gera `game/assets/characters/<pasta>/<chave>.glb` com esqueleto e as ações Idle, Attack, Cast, Hit, Death e Victory. A base fica em `art/blender/lib.py`.
- **Kit da masmorra:** `blender -b -P art/blender/dungeon/kit.py [-- peça ...]` gera `game/assets/dungeon/<peça>.glb` (19 peças, uma malha cada, origem no chão). Materiais com prefixo `piso`, `parede`, `estandarte`, `brasa` e `cristal` são tingidos pelo tema no Godot; os demais (ferro, ouro, madeira, osso, barro) ficam fixos. Rode no máximo 3 Blenders em paralelo.
- Toda a arte é autoral, gerada por esses scripts; não há assets de terceiros.

## Servidor

### API (`server/`)

- **Base:** Node 22, Fastify 5, `pg`, `bcryptjs` e `jsonwebtoken`. A imagem é a `node:22-alpine` e o processo roda como usuário `node`.
- **Variáveis de ambiente:** `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `JWT_SECRET` (pelo menos 32 caracteres) e `PORT` (padrão 3000).
- **Inicialização:** espera o banco responder, aplica as migrações pendentes (`MIGRATIONS` em `db.js`) e começa a ouvir.
- **Senhas:** são guardadas com bcrypt (custo 10).
- **Sessões:** usam JWT assinado, válido por 60 dias.
- **Limites de requisição:** 240 por minuto por IP no geral, 10 por minuto no login e no cadastro, e 60 por minuto no salvamento.
- **Rotas:** estão em [api.md](api.md).

### Banco (Postgres)

| Tabela | Conteúdo |
|---|---|
| `users` | `id`, `username` (citext, único), `pass_hash`, `created_at`, `last_seen` |
| `saves` | `user_id`, `data` (jsonb com o `SAVE` inteiro), `updated_at` |
| `players` | Perfil público: `rating`, `wins`, `losses`, `def_wins`, `def_losses`, `power`, `defense` (jsonb `[{k,lvl,evo}]`) |
| `raids` | Invasões: `attacker_id`, `defender_id`, `started_at`, `finished_at`, `attacker_won`, `delta`, `seen` |
| `schema_version` | Versão das migrações aplicadas |

Para criar uma migração nova, acrescente o SQL no **fim** de `MIGRATIONS` em `server/src/db.js`. Nunca altere uma migração que já foi aplicada.

### Fluxo da Invasão

1. `GET /api/arena/opponents` devolve até 3 jogadores com troféus próximos. O cliente completa a lista com bots, se faltar.
2. `POST /api/arena/start` cria um ticket (`raids`) que vale 30 minutos.
3. A luta acontece no navegador, contra a equipe de defesa controlada pela IA.
4. `POST /api/arena/finish` registra o resultado:
   - o servidor calcula o Elo (K=32) e atualiza o atacante e o defensor numa transação;
   - um ticket só aceita um resultado;
   - uma vitória com menos de 8 segundos não vale troféus.
5. O defensor recebe o relatório em `GET /api/arena/defenses` quando abre o jogo.

### Sincronização do salvamento

- **Ao abrir o jogo com conta:** `GET /api/me`. Fica valendo o salvamento com o maior `SAVE.updated`, o da nuvem ou o do aparelho.
- **Ao entrar numa conta:** o salvamento da nuvem sempre substitui o do convidado.
- **A cada mudança:** `PUT /api/save` envia o salvamento, a equipe de defesa e o poder, agrupando mudanças em sequência (1,2 s). A defesa é validada no servidor (heróis conhecidos, nível de 1 a 30, evolução de 1 a 3).
- **Troféus, vitórias e derrotas:** são sempre os do servidor.

## Limites conhecidos (segurança)

- A batalha roda no cliente. Quem souber editar o localStorage ou as requisições consegue mudar o próprio progresso ou mentir o resultado de uma invasão. O servidor limita os danos (Elo calculado no servidor, um resultado por ticket e tempo mínimo de luta), mas não impede a trapaça.
- Uma solução completa exigiria simular a batalha no servidor a partir de uma semente compartilhada.
- Não há recuperação de senha nem e-mail.
