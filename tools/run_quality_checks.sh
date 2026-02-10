#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "[checks] node tests ..."
node --test
echo "[checks] marker scan ..."
./tools/marker_scan.sh
echo "[checks] OK"
