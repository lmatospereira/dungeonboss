#!/usr/bin/env bash
# Renderiza os retratos de todos os personagens (3 Blenders por vez).
#   art/blender/portraits.sh [chave ...]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BLENDER="${BLENDER_BIN:-$HOME/opt/blender-5.2.2-linux-x64/blender}"
OUT="$ROOT/game/assets/portraits"; mkdir -p "$OUT"
for f in "$ROOT"/game/assets/characters/*/*.glb; do
  k="$(basename "$f" .glb)"
  if [ $# -gt 0 ] && [[ ! " $* " == *" $k "* ]]; then continue; fi
  echo "$f $OUT/$k.png"
done | xargs -P 3 -n 2 sh -c '"$0" -b -P "'"$ROOT"'/art/blender/portrait.py" -- "$1" "$2" >/dev/null 2>&1 && echo "ok $2" || echo "FALHOU $1"' "$BLENDER"
