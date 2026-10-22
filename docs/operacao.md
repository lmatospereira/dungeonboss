# Operação: publicar e manter o servidor

O jogo roda numa VPS como um projeto Docker Compose chamado `masmorra`, com três containers: `web`, `api` e `db`. O `web` serve a versão three.js na raiz e a versão Godot (exportação web) em `/v2/`, até a troca. Endereço do servidor, usuário, chave SSH e URL pública **não ficam no repositório**. Eles moram só na máquina de quem opera.

## Ferramenta local `dbvps`

O `dbvps` é um script de quem opera a VPS e fica fora do repositório (`~/.local/bin/dbvps`). As configurações dele ficam em `~/.config/dungeonboss/vps.env`, com permissão `600`:

```bash
VPS_HOST=<ip ou nome do servidor>
VPS_USER=<usuário ssh>
VPS_KEY=$HOME/.config/dungeonboss/vps.key   # chave privada, permissão 600
VPS_DIR=/home/<usuário>/masmorra             # pasta do projeto no servidor
VPS_PORT=8090                                # porta interna do container web
VPS_URL=https://<endereço público do jogo>   # opcional, só para exibir
```

Rode os comandos dentro da pasta do repositório:

| Comando | O que faz |
|---|---|
| `dbvps check` | Testa o SSH e mostra uptime, disco, memória e os containers do jogo |
| `dbvps status` | `docker compose ps` e teste da API (`/api/health`) |
| `dbvps deploy` | `npm ci` + `npm run build` local e exportação web do Godot (`tools/godot.sh export`). Envia `deploy/`, `server/`, `www/` e `game/build/web/` com rsync, roda `docker compose up -d --build`, reinicia o `web` e espera a API responder |
| `dbvps logs [api\|web\|db] [n]` | Últimos registros dos containers |
| `dbvps restart [serviço]` | Reinicia os containers |
| `dbvps db '<sql>'` | Roda SQL no Postgres (sem argumento, abre o `psql`) |
| `dbvps backup` | `pg_dump` compactado, salvo em `~/.config/dungeonboss/backups/` |
| `dbvps run '<cmd>'` / `dbvps ssh` | Comando avulso ou terminal no servidor |
| `dbvps url` | Mostra o endereço público |

Na primeira publicação, o `dbvps deploy` cria `VPS_DIR/.env` no servidor com segredos aleatórios (`POSTGRES_PASSWORD` e `JWT_SECRET`). Esse arquivo **nunca** é sobrescrito nem copiado de volta.

> Atenção: trocar o `JWT_SECRET` desconecta todos os jogadores. Trocar o `POSTGRES_PASSWORD` depois que o volume do banco já existe não muda a senha do banco.

## `.env` do servidor

| Variável | Uso |
|---|---|
| `POSTGRES_PASSWORD` | Senha do usuário `masmorra` no Postgres (criada pelo dbvps) |
| `JWT_SECRET` | Chave de assinatura das sessões (criada pelo dbvps) |
| `PUBLIC_PORT` | Porta do container `web` no host (padrão 8090) |
| `PUBLIC_BIND` | IP em que essa porta escuta: `0.0.0.0` (padrão, acesso direto) ou `127.0.0.1` (só local, quando há proxy) |
| `PROXY_NETWORK` | Nome da rede Docker de um proxy reverso já existente. Quando definida, o dbvps acrescenta `compose.proxy.yml` e o `web` entra nessa rede com o alias `masmorra-web` |

## Dois jeitos de expor o jogo

### 1. Atrás de um Caddy que já atende a porta 443 (configuração atual)

Use quando as portas 80 e 443 já são de outros projetos.

1. No `.env` do servidor, defina `PROXY_NETWORK=<rede do caddy>` e `PUBLIC_BIND=127.0.0.1`, e rode `dbvps deploy`.
2. Faça uma cópia de segurança do Caddyfile e acrescente um bloco para o domínio do jogo. Se a porta 80 for de outro projeto, use o desafio TLS-ALPN:

   ```
   <dominio-do-jogo> {
   	tls {
   		issuer acme {
   			disable_http_challenge
   		}
   	}
   	encode gzip
   	reverse_proxy masmorra-web:80
   }
   ```

3. Valide e recarregue o Caddy sem reiniciá-lo:

   ```bash
   docker exec <container-caddy> caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   docker exec <container-caddy> caddy reload   --config /etc/caddy/Caddyfile --adapter caddyfile
   ```

Sem um domínio próprio, um nome `<algo>.<ip-com-hifens>.sslip.io` resolve para o IP do servidor e recebe certificado normalmente.

### 2. Porta direta

Deixe `PROXY_NETWORK` vazio e `PUBLIC_BIND=0.0.0.0`. O `dbvps deploy` abre `PUBLIC_PORT` no firewalld do servidor. Na Oracle Cloud, também é preciso liberar a porta na Security List da VCN, pelo console.

## Rotina

- **Publicar uma versão nova:**
  1. `git pull`.
  2. `dbvps deploy`.
  3. Abrir o jogo e conferir que a tela inicial mostra "Online".
- **Antes de mudanças no banco:** `dbvps backup`.
- **Restaurar um backup:** `gunzip -c arquivo.sql.gz | dbvps run 'cd ~/masmorra && docker compose -p masmorra exec -T db psql -U masmorra masmorra'`. Isso sobrescreve os dados atuais.
- **Ver jogadores:** `dbvps db "SELECT u.username, p.rating, p.wins, p.losses, u.last_seen FROM users u JOIN players p ON p.user_id=u.id ORDER BY p.rating DESC LIMIT 20"`.
- **Apagar uma conta:** `dbvps db "DELETE FROM users WHERE username='nome'"`. As tabelas ligadas são apagadas em cascata.

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| Tela inicial mostra "Offline" | `dbvps status` e `dbvps logs api`. O nginx precisa repassar `/api/` para `api:3000` |
| `dbvps deploy` falha no build com 502 | Instabilidade do Docker Hub. Espere alguns segundos e repita |
| API reinicia em loop com "JWT_SECRET ausente" | O `.env` do servidor foi apagado ou editado |
| `/v2/` em tela preta, `index.js` com 404 | A rota `/v2/` precisa ser `location ^~ /v2/` no `nginx.conf` (senão a regra de cache de `.js` procura na pasta errada). Depois de mudar o `nginx.conf`, reinicie o `web` (`dbvps restart web`): `nginx -s reload` não basta, porque o arquivo montado foi substituído |
| HTTPS não abre pelo proxy | `docker exec <caddy> wget -qO- http://masmorra-web/api/health` precisa responder. Se não responder, o `web` não entrou na rede do proxy (confira `PROXY_NETWORK`) |
| Jogadores desconectados de repente | O `JWT_SECRET` mudou |
