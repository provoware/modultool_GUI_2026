#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "[marker-scan] Suche nach TODO/FIXME/placeholder/Platzhalter ..."
hits="$(grep -RIn --exclude-dir=node_modules --exclude='*.zip' -E 'TODO|FIXME|placeholder|Platzhalter' "$ROOT" || true)"
if [[ -n "$hits" ]]; then
  echo "[marker-scan] Treffer gefunden:"
  echo "$hits"
  exit 2
fi
echo "[marker-scan] OK: keine Marker gefunden."
