#!/usr/bin/env bash
# Monta o jogo NA SUA MÁQUINA e envia o site pronto para a VPS por SSH.
# Uso:  ./deploy/enviar.sh            (usa o apelido "vps" do ~/.ssh/config)
#       VPS=usuario@1.2.3.4 ./deploy/enviar.sh
# Requisitos: Node 20+, rsync e acesso SSH por chave (sem senha) à VPS.
# Na VPS, a pasta /var/www/masmorra precisa pertencer ao seu usuário (veja LEIAME.md).
set -euo pipefail
cd "$(dirname "$0")/.."
VPS="${VPS:-vps}"
DEST="${DEST:-/var/www/masmorra}"
ssh -o BatchMode=yes "$VPS" true || { echo "Não consegui entrar em $VPS por SSH sem senha. Configure a chave SSH primeiro."; exit 1; }
npm ci
npm run build
rsync -az --delete --info=stats1 www/ "$VPS:$DEST/"
echo "Publicado em $VPS:$DEST"
