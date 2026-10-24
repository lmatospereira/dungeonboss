# Masmorra do Rei Ogro

RPG de masmorra em 3D com combate por turnos, que roda no navegador. Tem 8 heróis com evolução até a 3ª forma (4º poder e arma lendária), 4 masmorras com chefes, contas de jogador e Invasão, um PvP assíncrono com ranking. O servidor é próprio (API Node + Postgres em containers) e roda na VPS do projeto.

## Documentação

| Documento | Assunto |
|---|---|
| [docs/jogo.md](docs/jogo.md) | Guia do jogo: combate, elementos, heróis, poderes, evolução, masmorras, Invasão e recompensas |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura técnica: módulos do cliente, build, API, banco e fluxos |
| [docs/api.md](docs/api.md) | Referência das rotas da API |
| [docs/operacao.md](docs/operacao.md) | Publicar na VPS, backup, proxy reverso e solução de problemas |

## O que tem nesta pasta

| Caminho | Para que serve |
|---|---|
| `src/` | Código do jogo (estilo, HTML e scripts em `src/js/`). É aqui que se edita. |
| `tools/build.mjs` | Gera `www/` (site e app) e `dist/artifact.html` (arquivo único que roda offline). |
| `server/` | API: contas, salvamento, Invasão e ranking. |
| `deploy/` | Stack Docker do servidor (`compose.yml`, `compose.proxy.yml`, `nginx.conf`). |
| `android/` | Projeto Android (Capacitor), com ícones e tela de abertura. |
| `.github/workflows/android.yml` | Gera o app Android (AAB e APK) no GitHub. |
| `assets/` | Ícone, imagem de destaque e capturas de tela para a loja. |
| `LOJA.md` | Textos da página da Play Store. |

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
npm run build
npx http-server www -p 8080     # http://localhost:8080
```

Sem a API, o jogo roda offline: o progresso fica no navegador e a Invasão usa oponentes simulados. Para testar com contas e banco, publique na VPS (abaixo) ou abra um túnel SSH até a porta interna do jogo no servidor.

## Publicar na VPS

Com a ferramenta local `dbvps` configurada (veja [docs/operacao.md](docs/operacao.md)):

```bash
dbvps deploy      # build + envio + docker compose up
dbvps status      # containers e saúde da API
```

O endereço do servidor, a chave SSH e os segredos ficam fora do repositório.

---

## App Android e Play Store (depois do MVP)

> **Pendente antes de lançar o app:** o app roda a partir de arquivos locais, então precisa apontar para a API com o endereço completo (`API_URL=https://… npm run android`). A API também precisa aceitar CORS do app (`https://localhost`), e isso ainda não foi implementado.

### Gerar o app no GitHub

1. Cadastre os 4 segredos da chave de assinatura em **Settings → Secrets and variables → Actions**. Os valores estão no arquivo `LEIA-CHAVE.txt`, entregue separado do projeto:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

   **Nunca envie o arquivo `upload-keystore.jks` nem o `LEIA-CHAVE.txt` para o GitHub.** Toda atualização do app precisa da mesma chave.
2. Abra **Actions → Android → Run workflow**. Os envios para a `main` também disparam o workflow. Em cerca de 5 minutos, aparecem em **Artifacts**:
   - `app-release.apk`: para instalar no celular e testar;
   - `app-release.aab`: para enviar à Play Store.

### Publicar na Play Store

1. Crie a conta de desenvolvedor em [play.google.com/console](https://play.google.com/console). A taxa é única, de US$ 25.
2. **Criar app**: "Masmorra do Rei Ogro", Português (Brasil), **Jogo**, **Gratuito**.
3. Preencha **Configurar app**:
   - **Política de privacidade:** `<endereço do jogo>/privacidade.html`. Antes, troque `[SEU E-MAIL DE CONTATO]` em `src/privacidade.html` pelo seu e-mail.
   - **Anúncios:** não tem.
   - **Classificação de conteúdo:** violência fantasiosa leve.
   - **Público-alvo:** 13 anos ou mais.
   - **Segurança dos dados:** o app coleta nome de usuário e progresso do jogo, que são usados só para o funcionamento do app, não são compartilhados, trafegam criptografados e podem ter a exclusão pedida por e-mail.
   - **Categoria:** Jogos → RPG.
4. **Página da loja:** use os textos de `LOJA.md` e as imagens de `assets/` (`icon-512.png`, `feature-graphic.png` e a pasta `screenshots/`).
5. **Teste fechado**, obrigatório para contas pessoais novas: no mínimo **12 testadores** por **14 dias seguidos**. Depois disso, peça acesso à produção.

O pacote do app é `br.com.lmatos.masmorra`, e ele **não pode mudar depois do primeiro envio**. Para trocar antes, altere `capacitor.config.json`, `android/app/build.gradle` e o `package` de `MainActivity.java`.

## Limites atuais e ideias

- **Trapaça:** a batalha roda no navegador. O servidor calcula os troféus e limita abusos, mas não impede trapaça (veja [docs/arquitetura.md](docs/arquitetura.md)).
- **Senha:** não há recuperação de senha.
- **Ideias:** triângulo também entre os tipos (Tanque, Dano e Suporte), Torre de desafios, missões diárias, mais heróis e visuais, e replay das invasões sofridas.
