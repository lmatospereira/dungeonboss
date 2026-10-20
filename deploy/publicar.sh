#!/usr/bin/env bash
# Monta o jogo e publica em /var/www/masmorra (rode NA VPS, dentro da pasta do projeto).
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${DEST:-/var/www/masmorra}"
npm ci
npm run build
if [ -w "$DEST" ]; then SUDO=""; else SUDO="sudo"; $SUDO mkdir -p "$DEST"; fi
$SUDO rsync -a --delete www/ "$DEST/"
echo "Publicado em $DEST"
