# Masmorra do Rei Ogro: contexto para o Claude

Responda em português do Brasil. O dono do projeto é o Leonardo (lmatospereira). Ele quer um jogo no estilo do Dungeon Boss / Dungeon Boss: Respawned (Netflix), mas com personagens, nomes e arte **originais**. Nunca copie personagens, nomes ou arte do jogo original.

Documentação completa: `docs/jogo.md` (regras e conteúdo), `docs/arquitetura.md` (técnica), `docs/api.md` (rotas) e `docs/operacao.md` (VPS). **Ao mudar regras, heróis, poderes, rotas ou deploy, atualize o documento correspondente no mesmo commit.**

## Foco atual (MVP)
Versão de **navegador**, com servidor próprio na VPS do Leonardo. Android/Play Store fica para depois; o projeto Capacitor já existe em `android/` (falta CORS na API e `API_URL` no build do app).

## Como o código está organizado
- `src/js/*.js` são concatenados **em ordem alfabética** dentro de uma única IIFE por `tools/build.mjs` (todas as funções compartilham escopo). Não use `import`/`export`.
  - `01-core` utilidades, tweens, som sintetizado, elementos
  - `02-scene` three.js r128 (global `THREE`), temas, cenário, partículas
  - `03-models` modelos chibi de primitivas (`chibi()`, `cape()`, `staff()`, `addWeaponGlow()`)
  - `04-data` `DEFS`, `DUNGEONS`, nível/evolução (`heroStats`, `heroAbilities`, `EVO_REQ`, `WEAPONS`), `HERO_INFO`, `SAVE`
  - `05-battle` `Unit`, dano, `AB` (habilidades), IA, `revive`, câmera, render, retratos
  - `06-flow` HUD da batalha, alvos, salas, recompensas
  - `07-net` cliente da API (`Net`): contas, sync, Invasão, ranking; offline com bots
  - `075-preview` vitrine 3D do herói e diagrama do triângulo
  - `08-screens` telas de menu (início, conta, mapa, equipe, heróis, invasão, resultado)
  - `09-main` inicialização e ganchos de depuração
- `src/style.css`, `src/body.html` (símbolos SVG + DOM), `src/privacidade.html`
- `server/` API Node 22 + Fastify + Postgres (`src/index.js` rotas, `src/db.js` migrações em lista; só acrescente no fim)
- `deploy/compose.yml` (db, api, web nginx), `deploy/compose.proxy.yml` (entra na rede de um proxy existente), `deploy/nginx.conf`
- `npm run build` gera `www/` (gerado, fora do git) e `dist/artifact.html`. Edite sempre em `src/`.

## Regras do jogo (não quebrar sem combinar)
- Turnos por velocidade; cada herói tem 1 básico + 2 habilidades com recarga + um 4º poder (`DEFS[k].ult`, `AB[id].ult`) liberado na evolução 2.
- Evolução 1–3 com cristais: evo 2 = +15% e 4º poder; evo 3 = +30% no total e arma lendária (`WEAPONS`). Requisitos em `EVO_REQ`.
- Triângulo: Fogo > Natureza > Água > Fogo; Luz e Sombra vencem uma à outra. Vantagem 150%, desvantagem 70%.
- Nível: +10% vida/ataque por nível (`lm(L)`), máximo 30. Tipos: Tanque, Dano, Suporte (só informativo por enquanto).
- Chefes: kit genérico `bk` em `DEFS` (`bBasic`, `bAoe`, `bPrep`→`bBig` telegrafado, `bRage` a 50% chama reforços).
- Troféus da Invasão são calculados **no servidor** (Elo K=32, ticket por invasão, mínimo de 8 s).

## Testar
```bash
npm install && npm run build && npx http-server www -p 8765   # offline, sem API
```
Parâmetros: `?turbo` (8x + AUTO), `?sala=N`, `?debug` (`window.__dbg` com `G`, `AB`, `SAVE()`, `kill`, `revive`, `fallenOf`), `?shot=lineup`, `?shot=<chave>`.
Testes automáticos: Playwright usando o Chrome do sistema (`executablePath: '/usr/bin/google-chrome'`, args `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`). O render por software deixa as animações bem mais lentas: espere por estado (`waitForFunction`), não por tempo fixo. Confira o console nas duas orientações (1280×720 e 400×860). Para testar com API, use um túnel SSH até a porta interna do jogo na VPS.

## Deploy
- Ferramenta local **`dbvps`** (fora do repo, em `~/.local/bin`; config em `~/.config/dungeonboss/vps.env`): `dbvps deploy`, `status`, `logs`, `db`, `backup`, `run`, `ssh`. Detalhes em `docs/operacao.md`.
- Na VPS o jogo fica atrás do Caddy de outro projeto (porta 443) via `PROXY_NETWORK`; não mexa nos containers de outros projetos (financial-ledger, devbox) além do bloco do jogo no Caddyfile.
- **Nunca** coloque no repositório: IP/domínio do servidor, chave SSH, `.env` do servidor, a ferramenta `dbvps`, senhas.

## Segredos
A chave de assinatura Android (`upload-keystore.jks`) **não** fica no repositório. Nunca a adicione nem crie arquivos com senhas.

## Próximos passos sugeridos
- CORS + `API_URL` para o app Android; recuperação de senha.
- Triângulo também entre tipos (Tanque/Dano/Suporte), Torre de desafios, missões diárias, mais heróis e skins, replay de invasões.
- Validar batalha no servidor (anti-trapaça).
