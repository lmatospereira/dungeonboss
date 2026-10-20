#!/usr/bin/env bash
# Monta o jogo e publica em /var/www/masmorra (rode na VPS, dentro da pasta do projeto).
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm run build
sudo mkdir -p /var/www/masmorra
sudo rsync -a --delete www/ /var/www/masmorra/
echo "Publicado em /var/www/masmorra"
