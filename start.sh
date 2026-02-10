#!/usr/bin/env bash
set -e

# V050_AUTO_OPEN: laienfreundlich – Auto-Fix Restart + Auto Browser öffnen (optional)
HOST="${1:-127.0.0.1}"
PORT="${2:-8787}"
PROJECT_ROOT_ARG="${3:-}"

echo "[Modultool] Startparameter: host=${HOST} port=${PORT}"

ATTEMPTS=0
MAX_ATTEMPTS=2
SAFE_RESTART_USED=0

read_setting_bool () {
  # usage: read_setting_bool <file> <js_expr> <default>
  local f="$1"
  local expr="$2"
  local def="$3"
  if [ ! -f "$f" ]; then
    echo "$def"
    return
  fi
  node -e "try{const s=require('$f'); const v=(${expr}); console.log(typeof v==='boolean'?v:${def});}catch(e){console.log(${def});}" 2>/dev/null
}

auto_open_browser () {
  local runtime_file="$1"
  local settings_file="$2"

  local enabled
  enabled="$(read_setting_bool "$settings_file" "(s.ui && s.ui.auto_open_browser)" "true")"
  if [ "$enabled" != "true" ]; then
    return
  fi

  # wait runtime file
  local i=0
  while [ $i -lt 30 ]; do
    if [ -f "$runtime_file" ]; then
      break
    fi
    sleep 0.2
    i=$((i+1))
  done

  if [ ! -f "$runtime_file" ]; then
    echo "[Modultool] Hinweis: runtime file fehlt, Browser Auto-Open übersprungen."
    return
  fi

  local url
  url="$(node -e "try{const r=require('$runtime_file'); console.log('http://'+r.host+':'+r.port+'/');}catch(e){process.exit(1)}" 2>/dev/null || true)"
  if [ -z "$url" ]; then
    return
  fi

  # open
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
    echo "[Modultool] Browser geöffnet: $url"
  else
    echo "[Modultool] Browser-Open nicht verfügbar (xdg-open fehlt). URL: $url"
  fi
}

while true; do
  ATTEMPTS=$((ATTEMPTS+1))
  echo "[Modultool] Starte Server (${ATTEMPTS}/${MAX_ATTEMPTS}) ..."
  node "server.js" "${HOST}" "${PORT}" "${PROJECT_ROOT_ARG}" &
  PID=$!

  # infer project root used by tool (settings-driven)
  SETTINGS_FILE="$(pwd)/settings.json"
    PROJECT_ROOT="$(node -e 'try{const fs=require("fs");const p=process.argv[1];const s=JSON.parse(fs.readFileSync(p,"utf8"));console.log((s.paths&&s.paths.project_root)?s.paths.project_root:"");}catch(e){console.log("");}' "$SETTINGS_FILE" 2>/dev/null)"
  if [ -z "$PROJECT_ROOT" ]; then
    PROJECT_ROOT="$(pwd)/project"
  fi
  RUNTIME_FILE="${PROJECT_ROOT}/.runtime.json"

  auto_open_browser "$RUNTIME_FILE" "$SETTINGS_FILE"

  wait $PID
  EXITCODE=$?

  if [ "${EXITCODE}" = "42" ] && [ "${ATTEMPTS}" -lt "${MAX_ATTEMPTS}" ]; then
    echo "[Modultool] Auto-Fix angewendet. Neustart..."
    sleep 1
    continue
  fi

  if [ "${EXITCODE}" != "0" ] && [ "${EXITCODE}" != "42" ] && [ "${SAFE_RESTART_USED}" = "0" ]; then
    echo "[Modultool] Crash erkannt. Starte automatisch im Safe Mode (Reparatur-Buttons)…"
    SAFE_RESTART_USED=1
    MODULTOOL_FORCE_SAFE=1 node "server.js" "${HOST}" "${PORT}" "${PROJECT_ROOT_ARG}" &
    PID=$!
    # open /safe (respects auto_open_browser as well)
    SETTINGS_FILE="$(pwd)/settings.json"
    PROJECT_ROOT="$(node -e 'try{const fs=require("fs");const p=process.argv[1];const s=JSON.parse(fs.readFileSync(p,"utf8"));console.log((s.paths&&s.paths.project_root)?s.paths.project_root:"");}catch(e){console.log("");}' "$SETTINGS_FILE" 2>/dev/null)"
    if [ -z "$PROJECT_ROOT" ]; then PROJECT_ROOT="$(pwd)/project"; fi
    RUNTIME_FILE="${PROJECT_ROOT}/.runtime.json"
    # wait runtime
    i=0; while [ $i -lt 30 ]; do [ -f "$RUNTIME_FILE" ] && break; sleep 0.2; i=$((i+1)); done
    url="$(node -e 'try{const r=require(process.argv[1]);console.log("http://"+r.host+":"+r.port+"/safe");}catch(e){process.exit(1)}' "$RUNTIME_FILE" 2>/dev/null || true)"
    if [ -n "$url" ] && command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true; echo "[Modultool] Safe Mode geöffnet: $url"; fi
    wait $PID
    EXITCODE=$?
fi

if [ "${EXITCODE}" != "0" ]; then
    echo ""
    echo "[Modultool] Server hat sich beendet (Exitcode ${EXITCODE})."
    echo "[Modultool] Tipp: Öffne im Browser /safe für Diagnose-Buttons."
    # Laien-Debug: letzte Logzeilen anzeigen (wenn vorhanden)
    SETTINGS_FILE="$(pwd)/settings.json"
    PROJECT_ROOT="$(node -e 'try{const fs=require("fs");const p=process.argv[1];const s=JSON.parse(fs.readFileSync(p,"utf8"));console.log((s.paths&&s.paths.project_root)?s.paths.project_root:"");}catch(e){console.log("");}' "$SETTINGS_FILE" 2>/dev/null)"
    if [ -z "$PROJECT_ROOT" ]; then PROJECT_ROOT="$(pwd)/project"; fi
    LOGFILE="${PROJECT_ROOT}/logs/modultool.log"
    if [ -f "$LOGFILE" ]; then
      echo "[Modultool] Letzte Logzeilen (${LOGFILE}):"
      tail -n 60 "$LOGFILE" || true
    else
      echo "[Modultool] Kein Logfile gefunden unter: $LOGFILE"
    fi
  fi
  break
done
