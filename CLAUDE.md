# Masmorra do Rei Ogro: contexto para o Claude

Responda em português do Brasil. O dono do projeto é o Leonardo (lmatospereira). Ele quer um jogo no estilo do Dungeon Boss / Dungeon Boss: Respawned (Netflix), mas com personagens, nomes e arte **originais**. Nunca copie personagens, nomes ou arte do jogo original.

## Foco atual (MVP)
Versão de **navegador** publicada na **VPS do Leonardo** via SSH (apelido `vps` no `~/.ssh/config`). Android/Play Store fica para depois; o projeto Capacitor já existe em `android/`.

## Como o código está organizado
- `src/js/*.js` são concatenados **em ordem alfabética** dentro de uma única IIFE por `tools/build.mjs` (todas as funções compartilham escopo). Não use `import`/`export`.
  - `01-core` utilidades, tweens, som sintetizado (WebAudio), elementos
  - `02-scene` three.js r128 (UMD, global `THREE`), temas das salas, cenário, partículas
  - `03-models` modelos chibi feitos de primitivas (`chibi()`, `cape()`, `staff()`, etc.)
  - `04-data` `DEFS` (heróis/inimigos/chefes), `DUNGEONS`, níveis, salvamento (`SAVE`, localStorage `masmorra-v2`), `HERO_INFO`
  - `05-battle` `Unit`, dano, `AB` (habilidades), IA, câmera, laço de render, retratos
  - `06-flow` HUD da batalha, fluxo de salas, recompensas
  - `07-net` Firebase (Auth anônimo + Firestore); sem config roda offline com bots
  - `075-preview` vitrine 3D do herói e diagrama do triângulo de elementos
  - `08-screens` telas de menu (início, mapa, equipe, heróis, invasão, resultado)
  - `09-main` inicialização e ganchos de depuração
- `src/style.css`, `src/body.html` (símbolos SVG + DOM), `src/privacidade.html`
- `npm run build` gera `www/` (site e app, bibliotecas locais em `www/lib`, fontes em `www/fonts`) e `dist/artifact.html` (arquivo único com CDN).
- `www/` é gerado: edite sempre em `src/`.

## Regras do jogo (não quebrar sem combinar)
- Turnos por velocidade; cada herói tem 1 básico + 2 habilidades com recarga.
- Triângulo: Fogo > Natureza > Água > Fogo; Luz e Sombra vencem uma à outra. Vantagem 150%, desvantagem 70%.
- Nível: +10% vida/ataque por nível (`lm(L)`), máximo 30. Tipos: Tanque, Dano, Suporte (só informativo por enquanto).
- Chefes: kit genérico `bk` em `DEFS` (`bBasic`, `bAoe`, `bPrep`→`bBig` telegrafado, `bRage` a 50% chama reforços).

## Testar
```bash
npm install && npm run build && npx http-server www -p 8765
```
Parâmetros de depuração: `?turbo` (velocidade 8x + AUTO), `?sala=N` (começa na sala N), `?shot=lineup` (imagem com todos os heróis), `?shot=<chave>` (retrato grande).
Para testes automáticos, Playwright + Chromium com `--use-gl=angle --use-angle=swiftshader` funciona. Confira erros no console nas duas orientações (1280×720 e 400×860).

## Deploy
- Da máquina local: `./deploy/enviar.sh` (build + rsync de `www/` para `vps:/var/www/masmorra`). Exige SSH por chave, sem senha.
- Preparação única da VPS (nginx, certbot, `chown` da pasta): `LEIAME.md`, seção "Publicar na sua VPS".
- Nunca peça nem grave senhas da VPS. Comandos com `sudo` na VPS ficam para o Leonardo rodar.

## Segredos
A chave de assinatura Android (`upload-keystore.jks`) **não** fica no repositório. Nunca a adicione nem crie arquivos com senhas.

## Próximos passos combinados ou sugeridos
- Primeiro deploy na VPS com domínio + HTTPS.
- Configurar o Firebase (`config/firebase-config.js`) para ligar a Invasão online.
- Possível: triângulo também entre tipos (Tanque/Dano/Suporte), login com Google, Torre de desafios, missões diárias, mais heróis e skins.
