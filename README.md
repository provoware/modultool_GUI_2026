# Modultool – HTML/CSS/JS + Node Backend (offline)

## Ein-Klick Start
```bash
./start.sh
```

## Manuell
```bash
node server.js --root ~/modultool_project --host 127.0.0.1 --port 8787
```
Dann im Browser öffnen:
- http://127.0.0.1:8787/

## Daten/Logs
- Settings: `~/modultool_project/data/config/settings.json`
- Hinweise: `~/modultool_project/data/state/hints.json`
- Log: `~/modultool_project/data/logs/core.log`

## Ziel
Erst Kern stabil: Preflight, Hints, Settings, Eventlog. Danach kommen Module (FFmpeg, Archiv, Editor, etc.).


## Schnellchecks
```bash
./tools/run_quality_checks.sh
```


## Erststart-Assistent (Laienmodus)
Beim ersten Start erscheint ein **Erststart-Assistent** direkt in der Oberfläche:

1. **Projektordner wählen** (wird angelegt, falls nicht vorhanden)
2. **Browser automatisch öffnen** (an/aus)
3. **Fertig starten** (speichert alles)

Der Assistent sorgt dafür, dass du ohne Terminal-Gefrickel sauber startest.

## Start (1 Klick)
```bash
./start.sh
```

- Wenn der Standard-Port belegt ist, wählt das Tool automatisch den nächsten freien Port.
- Optional öffnet `start.sh` automatisch den Browser auf der richtigen URL (einstellbar im UI).

## Wichtige URL-Hilfen
- Startseite: `http://127.0.0.1:PORT/`
- Safe Mode: `http://127.0.0.1:PORT/safe`

In der Oberfläche siehst du oben einen **Port-Banner** mit:
- **↗ Öffnen** (neuer Tab)
- **📋 Kopieren** (URL kopieren)
- **✖ Ausblenden** (merkt sich die Entscheidung)

## Sicher beenden (Logout)
Oben in der GUI: **⏻ Logout**  
Speichert Settings/Logs und beendet den Server sauber.

## Wenn etwas schief läuft
Das Tool darf nicht abstürzen. Wenn ein Startfehler erkannt wird, startet es im **Safe Mode**:

- `/safe` zeigt Buttons/Dropdowns für Reparatur und Diagnose
- **Auto-Fix anwenden** erstellt ein Backup und repariert typische Patch-Fehler
- `start.sh` startet nach Auto-Fix automatisch neu (max. 2 Versuche)

## Einstellungen
`settings.json` (im Projekt) enthält u.a.:
- `paths.project_root` (dein Projektordner)
- `ui.auto_open_browser` (Browser nach Start automatisch öffnen)



## Wizard: „Ordner testen“
Im Erststart-Assistenten gibt es den Button **„Ordner testen“**:
- prüft Schreibrechte (Testdatei schreiben/ löschen)
- legt die Standardstruktur an (logs/, exports/, data/, queue/)
- zeigt **OK** oder **Nicht OK** direkt im Wizard


## Wizard: Klick-Auswege (wenn „Nicht OK“)
Wenn der Pfad-Test fehlschlägt, zeigt der Wizard sofort 2 Buttons:
- **Pfad auf ~/Projekte setzen**
- **Neuen Ordner anlegen** (automatischer Vorschlag mit Zufalls-Suffix)

Damit hängt man nie fest.


## Wizard-Sicherheit: „Fertig starten“ ist gesperrt bis Test OK
Der Button **„Fertig starten“** wird erst aktiv, wenn **„Ordner testen“ = OK** war.
So wird verhindert, dass ein falscher Pfad nachts still scheitert.


## Crash/Exit: immer Reparatur statt Sackgasse
Wenn der Server mit Fehlercode beendet wird, startet `start.sh` **automatisch einmal im Safe Mode**,
damit du sofort Reparatur-Buttons siehst (statt „nichts passiert“).


## Logging & Debugging (laienfreundlich)
- Logfile: `PROJECT_ROOT/logs/modultool.log`
- Letzter Crashreport: `PROJECT_ROOT/logs/crash_last.txt`

Wenn der Server crasht, zeigt `start.sh` automatisch die letzten Logzeilen im Terminal an.


## Safe Mode: Logs im Browser
Im Safe Mode gibt es den Button **„Logs (letzte 60)“**:
- zeigt die letzten ~60 Zeilen aus `logs/modultool.log` direkt im UI (copybar)
- API: `GET /api/safe/logtail`


## Beenden (nie Sackgasse)
Der Button **„Beenden“** öffnet einen Dialog mit Dropdown:
- Speichern + schließen
- Nur schließen
- Safe Mode öffnen
- Self-Repair starten

So gibt es immer eine Lösung per Klick, ohne Absturz.


## Projektbeschreibung im UI
Direkt nach dem Start zeigt das Hauptmodul eine ausführliche Projektbeschreibung inkl.:
- Ziel, Prinzip, Datenmodell, Stabilität, Barrierefreiheit
- Build-Infos (Version/Build/Host/Port/Root)


## Themes & Barrierefreiheit
- Theme-Auswahl in der Topbar (persistent im Projekt-Settings).
- A11y-Dialog: Hoher Kontrast, Invertieren, Große Schrift, Weniger Bewegung, Tooltips.

## Selbstkontrolle (Marker-Scan)
`/api/scan/run` scannt TODO/FIXME/placeholder/Platzhalter im Repo und aktualisiert `registry.json`.


## Systemstatus & Footer
- Footer zeigt READY/WARN/SAFE (pollt `/api/status`).
- Export-Button schreibt eine Logs-Textdatei nach `project/exports/`.

## Macro-Keys
- Save ist der rechte Endpunkt (Anker) und schreibt ein Save-Event (Settings-Persistenz).


## Textbausteine (Schnelltasten)
- Im Modul „Textbausteine“ Titel+Text anlegen.
- Optional Taste 1–12 zuweisen.
- Klick auf Schnelltaste kopiert Text in Zwischenablage und schreibt Event in `project/logs/events.log`.


## Snippet-Verlauf
Wenn du einen bestehenden Textbaustein überschreibst, wird der alte Text in `project/data/snippets_history.txt` gespeichert und bleibt in der UI kopierbar.

---
## Codex + GitHub (Prozess)
Siehe: `docs/CODEX_GITHUB_WORKFLOW.md`

## Troubleshooting (Laien)
### 1) Port belegt
Wenn der Start meldet „Port belegt“, wird automatisch ein freier Port gewählt und in der Konsole angezeigt.

### 2) UI lädt, aber Buttons tun nichts
- Browser: STRG+F5 (Hard Reload)
- Konsole (F12) prüfen: Fehlermeldung kopieren
- Im Tool: „Details“ öffnen → Log exportieren

### 3) Server läuft, aber Seite ist leer
- URL in Konsole prüfen
- `node -v` sollte mindestens 18 sein
- `npm ci && npm test` ausführen

## Speicherorte (Standard)
- Projektroot: `./project/` (im Repo) oder via `--root`
- Logs: `project/data/logs/`
- Settings: `project/data/config/settings.json`
- Snippets: `project/data/snippets/snippets.json`
- Snippet-History: `project/data/snippets/snippets_history.txt`


## Patch-Plan Workflow (wichtig)
Vor jeder Änderung: docs/patch_plan_template.json nach patch_plan.json kopieren und ausfüllen. Danach erst Code ändern. Siehe docs/PATCH_WORKFLOW.md.


## Entwicklungsprozess (Codex/GitHub)
- Änderungen nur mit patch_plan.json (Scope + Anchors). Details: docs/PATCH_WORKFLOW.md
- Nach jeder Iteration: patch_report.json (Begründung + Tests + Ergebnis)
- Empfehlungen landen fortlaufend in RECOMMENDATIONS.md (du kannst sie ins todo verschieben)
- Pflicht-Info-Dateien je Iteration: siehe STANDARDS_VORGABEN.md
