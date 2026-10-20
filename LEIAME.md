# Masmorra do Rei Ogro

RPG de masmorra em 3D com combate por turnos. Tem 8 heróis, 4 masmorras com chefes, evolução de nível e Invasão, um PvP assíncrono em que você ataca a equipe de defesa de outros jogadores. O jogo roda no navegador, vira app Android (Capacitor) e usa o Firebase como servidor.

Ele funciona sem servidor: sem a configuração do Firebase, joga offline e a Invasão usa oponentes simulados. O passo 1 liga o modo online.

---

## O que tem nesta pasta

| Caminho | Para que serve |
|---|---|
| `src/` | Código do jogo (estilo, HTML e scripts em `src/js/`). É aqui que você edita. |
| `tools/build.mjs` | Junta `src/` em `www/index.html` (app e site) e `dist/artifact.html` (arquivo único). |
| `www/` | Site pronto, gerado pelo build. Vai para o app e para o Firebase Hosting. |
| `config/firebase-config.example.js` | Modelo da configuração do Firebase. |
| `firestore.rules` | Regras de segurança do banco de dados. |
| `android/` | Projeto Android nativo (ícones, tela de abertura, assinatura). |
| `.github/workflows/android.yml` | Gera o app (AAB e APK) nos servidores do GitHub. Você não precisa instalar o Android Studio. |
| `assets/` | Ícone da loja, imagem de destaque e capturas de tela para a Play Store. |
| `LOJA.md` | Textos prontos para a página da Play Store. |

## Testar no computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run build
npx http-server www -p 8080
```

Abra `http://localhost:8080` no navegador.

---

## Passo 1: ligar o servidor (Firebase)

1. Entre em [console.firebase.google.com](https://console.firebase.google.com) e clique em **Criar projeto**. O Google Analytics pode ficar desligado.
2. **Authentication** → **Começar** → aba **Método de login** → ative **Anônimo**.
3. **Firestore Database** → **Criar banco de dados** → modo de produção → região `southamerica-east1` (São Paulo).
4. Engrenagem → **Configurações do projeto** → **Seus apps** → ícone **Web (`</>`)** → dê um apelido e registre. Copie o objeto `firebaseConfig` que aparece.
5. Copie `config/firebase-config.example.js` para `config/firebase-config.js` e cole os valores (apiKey, authDomain, projectId etc.). Essa configuração pode ficar no GitHub: ela é pública por natureza, e quem protege os dados são as regras do Firestore.
6. Em `.firebaserc`, troque `COLE_O_ID_DO_PROJETO` pelo ID do projeto (aparece em Configurações do projeto).
7. Instale a ferramenta do Firebase e publique as regras e o site:

```bash
npm install -g firebase-tools
firebase login
npm run deploy:web
```

Depois disso:

- o jogo fica jogável em `https://SEU-PROJETO.web.app`, e esse link pode ser mandado para qualquer pessoa;
- a política de privacidade fica em `https://SEU-PROJETO.web.app/privacidade.html`. **Antes de publicar, troque `[SEU E-MAIL DE CONTATO]` em `src/privacidade.html` pelo seu e-mail.**

No canto da tela inicial deve aparecer **Online** com uma bolinha verde.

## Publicar na sua VPS (versão de navegador)

Numa VPS com Ubuntu ou Debian:

```bash
sudo apt update && sudo apt install -y nginx rsync certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
git clone https://github.com/SEU-USUARIO/masmorra.git && cd masmorra
./deploy/publicar.sh
sudo cp deploy/nginx-masmorra.conf /etc/nginx/sites-available/masmorra   # troque SEU-DOMINIO dentro do arquivo
sudo ln -s /etc/nginx/sites-available/masmorra /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d SEU-DOMINIO
```

Para publicar uma versão nova: `git pull && ./deploy/publicar.sh`.

### Publicar a partir da sua máquina (Claude Code local + SSH)

Preparação, feita uma vez só:

1. **Chave SSH sem senha.** No seu computador, rode `ssh-keygen -t ed25519` (se ainda não tiver uma chave) e depois `ssh-copy-id usuario@IP-DA-VPS`.
2. **Apelido para a VPS.** Crie um apelido em `~/.ssh/config`:
   ```
   Host vps
     HostName IP-DA-VPS
     User usuario
   ```
   Para testar, rode `ssh vps 'echo ok'`. O teste precisa responder sem pedir senha.
3. **Preparar a VPS.** Entre com `ssh vps` e rode:
   ```bash
   sudo apt update && sudo apt install -y nginx rsync certbot python3-certbot-nginx
   sudo mkdir -p /var/www/masmorra && sudo chown -R $USER /var/www/masmorra
   ```
   Depois instale `deploy/nginx-masmorra.conf` e o certbot, como na lista de comandos acima. O `chown` faz com que os próximos envios não precisem de `sudo`.

Com isso pronto, cada publicação é um comando só, rodado no seu computador:

```bash
./deploy/enviar.sh
```

Ele monta o jogo e envia a pasta `www/` para `/var/www/masmorra` na VPS. No Windows, rode dentro do WSL, porque o script usa `rsync`.

Se usar o Firebase, adicione o domínio em **Authentication → Configurações → Domínios autorizados**.

## Passo 2: colocar o projeto no GitHub

1. Crie uma conta em [github.com](https://github.com) e um repositório **privado** (por exemplo, `masmorra`).
2. Envie esta pasta. Sem saber Git, use **Add file → Upload files** e arraste as pastas. O site aceita até 100 arquivos por envio, então mande em duas levas: primeiro a pasta `android`, depois todo o resto. A pasta `node_modules` não vai junto: ela não está no zip e é criada pelo `npm install`.
   Com Git:
   ```bash
   git init && git add . && git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/masmorra.git
   git push -u origin main
   ```
3. Cadastre os 4 segredos da chave de assinatura em **Settings → Secrets and variables → Actions → New repository secret**. Os valores estão no arquivo `LEIA-CHAVE.txt`, que veio separado do projeto:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

   **Nunca envie o arquivo `upload-keystore.jks` nem o `LEIA-CHAVE.txt` para o GitHub.** Guarde os dois num lugar seguro: toda atualização do app precisa da mesma chave.

## Passo 3: gerar o app

No GitHub, abra **Actions → Android → Run workflow**. Em cerca de 5 minutos a execução termina e, em **Artifacts**, aparece `masmorra-android` com dois arquivos:

- `app-release.apk`: mande para o seu celular e instale para testar. O Android pede para permitir a instalação de fontes desconhecidas.
- `app-release.aab`: é o arquivo que vai para a Play Store.

Cada envio para a branch `main` gera uma versão nova, com número de versão maior, automaticamente.

## Passo 4: publicar na Play Store

1. Crie a conta de desenvolvedor em [play.google.com/console](https://play.google.com/console). A taxa é única, de US$ 25, e o Google pede verificação de identidade.
2. **Criar app**: nome "Masmorra do Rei Ogro", idioma Português (Brasil), tipo **Jogo**, **Gratuito**.
3. Preencha **Configurar app** no painel:
   - **Política de privacidade**: `https://SEU-PROJETO.web.app/privacidade.html`
   - **Acesso ao app**: todas as funcionalidades sem restrição.
   - **Anúncios**: não contém anúncios.
   - **Classificação de conteúdo**: questionário de jogo; marque violência fantasiosa leve, sem sangue. Deve sair Livre ou 10+.
   - **Público-alvo**: 13 anos ou mais. Incluir crianças ativa as regras extras do programa Famílias.
   - **Segurança dos dados**: o app coleta **IDs do usuário** (ID anônimo do Firebase) e **nome de usuário/conteúdo do app** (nome de aventureiro e progresso). São usados para funcionalidade do app, não são compartilhados, os dados são criptografados em trânsito, e o usuário pode pedir exclusão por e-mail.
   - **Categoria**: Jogos → RPG.
4. **Página da loja principal**: use os textos de `LOJA.md`, o ícone `assets/icon-512.png`, a imagem de destaque `assets/feature-graphic.png` e as capturas de `assets/screenshots/`.
5. **Teste fechado** (obrigatório para contas pessoais novas): **Testes → Teste fechado → Criar faixa**, envie o `app-release.aab` e aceite a **Assinatura de apps do Google Play**. Adicione pelo menos **12 testadores** (e-mails ou um Grupo do Google). Eles precisam ficar inscritos por **14 dias seguidos**.
6. Depois dos 14 dias, peça **acesso à produção** no painel, crie a versão de produção com o mesmo AAB (ou um mais novo) e envie para revisão. A revisão costuma levar de alguns dias a uma semana.

---

## Como o jogo funciona por dentro

- **Batalha:** por turnos e ordenada pela velocidade de cada unidade. Cada herói tem 1 ataque básico e 2 habilidades com recarga.
- **Elementos:** Fogo vence Natureza, Natureza vence Água, Água vence Fogo, e Luz e Sombra vencem uma à outra. A vantagem causa 150% de dano; a desvantagem, 70%.
- **Níveis:** cada nível dá +10% de vida e de ataque. A experiência vem das batalhas ou de treinar com ouro. O nível máximo é 30.
- **Masmorras:** cada uma tem 2 salas e o chefe. Os chefes avisam o golpe forte um turno antes e, com metade da vida, se enfurecem e chamam reforços. Vencer o Grakk recruta o Rook, e vencer o Morvhal recruta a Nyx.
- **Invasão:** você escolhe entre 3 oponentes com troféus parecidos com os seus e luta contra a equipe de defesa deles, que é controlada pela IA. A pontuação usa Elo: até ±32 troféus por luta. O defensor recebe o resultado quando abrir o jogo.
- **Salvamento:** o progresso fica no aparelho e é copiado para o Firestore (`saves/{uid}`). O perfil público (nome, troféus, defesa) fica em `players/{uid}`.

## Limites atuais e próximos passos sugeridos

- **Conta presa ao aparelho:** o login anônimo cria uma conta por aparelho. Trocar de celular ou reinstalar o app começa do zero. Próximo passo: vincular uma conta Google (Firebase Auth com Google Sign-In).
- **Trapaça:** a batalha roda no aparelho do jogador. As regras do Firestore limitam quanto os troféus sobem por vez, mas não impedem trapaça. Para competição séria, a luta da Invasão teria que ser validada no servidor (Cloud Functions).
- **Ideias de conteúdo:** Torre de desafios com andares, baús e gemas, missões diárias, mais heróis e skins, e ver o replay das invasões que você sofreu.

## Mudar o nome do pacote

O app usa `br.com.lmatos.masmorra`. Esse nome **não pode mudar depois do primeiro envio** à Play Store. Para trocar antes, altere `appId` em `capacitor.config.json`, `namespace` e `applicationId` em `android/app/build.gradle`, e a pasta e o `package` de `MainActivity.java`.
