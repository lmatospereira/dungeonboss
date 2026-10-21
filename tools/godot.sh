#!/usr/bin/env bash
# Atalhos do projeto Godot (pasta game/).
#   tools/godot.sh sync      copia data/*.json para game/data (rode antes de abrir o editor)
#   tools/godot.sh test      roda os testes headless do núcleo de combate
#   tools/godot.sh balance [args]   roda o simulador de balanceamento
#   tools/godot.sh export    exporta a versão web para game/build/web
#   tools/godot.sh editor    abre o editor
# GODOT_BIN e BLENDER_BIN podem ser definidos no ambiente; o padrão é ~/opt.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GODOT="${GODOT_BIN:-$HOME/opt/godot/Godot_v4.6.3-stable_linux.x86_64}"
[ -x "$GODOT" ] || { echo "Godot não encontrado em $GODOT (defina GODOT_BIN)"; exit 1; }
sync_data() { mkdir -p "$ROOT/game/data"; rm -f "$ROOT/game/data/"*.json; cp "$ROOT/data/"*.json "$ROOT/game/data/"; }
import_once() { [ -d "$ROOT/game/.godot" ] || "$GODOT" --headless --path "$ROOT/game" --import >/dev/null 2>&1 || true; }
cmd="${1:-help}"; shift || true
case "$cmd" in
  sync) sync_data ;;
  test) sync_data; import_once; "$GODOT" --headless --path "$ROOT/game" -s res://tests/run.gd -- "$@" ;;
  balance) sync_data; import_once; "$GODOT" --headless --path "$ROOT/game" -s res://tools/balance.gd -- "$@" ;;
  export) sync_data; "$GODOT" --headless --path "$ROOT/game" --import >/dev/null 2>&1 || true
          mkdir -p "$ROOT/game/build/web"; "$GODOT" --headless --path "$ROOT/game" --export-release "Web" "$ROOT/game/build/web/index.html" ;;
  editor) sync_data; "$GODOT" --path "$ROOT/game" -e ;;
  *) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
