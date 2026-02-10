# CHANGELOG

## v0.7.1 (2026-02-10 07:03:22)
- Prozess: Patch-Workflow präzisiert (Analyse->Plan->Patch->Validierung->Report, keine Endlosschleifen).
- Neu: AGENTS.md für GitHub/Codex-Iterationen.
- Neu: RECOMMENDATIONS.md als fortlaufende Empfehlungsliste.
- Todo: Fortschritt% + nächster Schritt prominent.
- Doku: patch_report_template.json ergänzt.


## v0.7.0 (2026-02-10 06:36:34)
- Prozess: Patch-Plan Workflow integriert (docs/patch_plan_template.json, docs/PATCH_WORKFLOW.md, docs/DO_NOT_TOUCH.md).
- Standards: Pflicht-Info-Dateien je Iteration festgeschrieben.
- Doku: JSON-Versionierungsleitfaden ergänzt (docs/JSON_VERSIONING.md).


## v0.6.8 (2026-02-10 05:55:10)
- Info: Release-Ziel rückwärts geplant + vollständige Projektstruktur als Liste ins Projekt geschrieben.


## v0.6.7 (2026-02-10 05:43:39)
- Layout: mittiger Hauptbereich + echtes 2x2 Panelgrid, wächst nach unten.
- UI: Click-Tracer + Console-Hinweise (Laien-Debug).
- Themes: sichtbarer Theme-Dropdown + Persistenz, Dropdown-Kontrast verbessert.


## v0.6.6 (2026-02-10 05:29:59)
- Layout-Fix: keine Überlagerung von Footer/Macrokeys mit Inhalt.
- Grid-Fix: Panels nutzen Breite besser, weniger leere Fläche rechts.
- Struktur: Sidebar+Main in .layout Grid, stabilere Abstände.


## v0.6.5 (2026-02-10 05:20:10)
- Layout: Panel-Raster wächst nach unten (Grid, keine festen Höhen).
- Header/Footer sticky wie Referenz, Arbeitsbereich scrollt stabil.
- UX: Klick auf leere Schnelltaste führt direkt zum Snippets-Modul + Taste vorgewählt.


## v0.6.4 (2026-02-10 05:08:32)
- Macro-Keys zeigen Titel+Taste sofort (1–12).
- Logging: zusätzlich info.log (Klartext, Hinweis+Lösung, laienfreundlich).
- Clipboard-Block: eigener Event-Typ mit eindeutiger Fehlerbeschreibung.


## v0.6.3 (2026-02-10 04:57:48)
- Macro-Keys erweitert: 1–12.
- Clipboard-Fallback: Overlay wenn Browser Kopieren blockiert.
- Snippet-Verlauf: alte Inhalte in snippets_history.txt + UI-Verlaufsliste.


## v0.6.2 (2026-02-10 04:31:33)
- Modul: Textbausteine (CRUD + Key-Zuordnung) + Macro-Keys kopieren in Zwischenablage.
- Logging: /api/log/event -> events.log (JSON-lines).
- UX: Tooltip-System mit Offset + Viewport-Clamp.
- Doku: Projektbeschreibung + Standards + Release-Checkliste.


## v0.6.1 (2026-02-10 04:08:41)
- UI: Panel-Raster 2×2 eingeführt (auto-responsiv, konsistente Abstände/Rahmen/Glow).
- UI: Panel-Header mit Icon-Reihe (Referenz-Annäherung).
- UX: Inhalte werden robust in Slots umgehängt (ohne Crash).


## v0.6.0 (2026-02-10 03:55:05)
- Robustheit: Status-Endpunkt + Footer READY/WARN/SAFE inkl. Polling.
- UX: Footer zweistufig real im HTML (Tabs + Status/Chips/Export).
- UX: Macro-Key Save als fixer Anker mit Aktion.
- UX: Scan-Button sichtbar + Scan-Endpoint wired.
- Export: Log-Export Endpoint (TXT) nach exports/.


## v0.5.9 (2026-02-10 03:40:58)
- UI: 2×2 Panel-Raster + Grip-Leisten (näher am Referenzlayout).
- UI: Theme-Switch (carmouflage/dunkel/hell/sonnendämmerung) + A11y-Dialog (persistent).
- UI: Notfall-Overlay mit Ein-Klick-Lösungen.
- Startpipeline: Marker-Scan Endpoint + registry.json Auto-Update.
- CSS: Macro-Keys im Hardware-Look + Footer zweistufiger.


## v0.5.8 (2026-02-10 03:18:52)
- UI: Projektbeschreibung direkt sichtbar (releasefertige Tool-Story + Build-Infos).
- API: /api/manifest fuer UI-Build-Infos.


## v0.5.7 (2026-02-10 02:59:22)
- UI: /api/state -> Root/Session/CPU/RAM/Laufzeit automatisch sichtbar.
- UI: Beenden-Dialog mit Dropdown (Save/Exit/Safe/Self-Repair).
- Server: /api/exit (graceful shutdown) + /api/selfrepair/run.
- Server: runtime.json wird beim Listen garantiert geschrieben.


## v0.5.6 (2026-02-10 02:44:32)
- Fix: Server startet wieder (nested backticks in embedded Safe-HTML entfernt).
- Safe Mode: Logs-Button + /api/safe/logtail.


## v0.5.5 (2026-02-10 02:36:33)
- Fix: start.sh Syntaxfehler (robustes Node-JSON-Read via argv).
- Debug: start.sh zeigt bei Crash die letzten Logzeilen.
- Logging: single write stream + crash_last.txt (uncaught/unhandled).


## v0.5.4 (2026-02-10 02:28:16)
- Wizard: „Fertig starten“ erst aktiv nach „Ordner testen“ = OK.
- Start: Bei Crash automatisch Safe Mode starten (Reparatur-UI statt Sackgasse).
- Safe Mode: Root redirect auf /safe.


## v0.5.3 (2026-02-10 02:23:13)
- Wizard: Bei „Nicht OK“ werden sofort 2 Klick-Auswege angeboten (Pfad auf ~/Projekte, neuen Ordner anlegen).


## v0.5.2 (2026-02-10 02:13:55)
- Wizard: Button „Ordner testen“ (Schreibrechte + Strukturprüfung) + Statusanzeige.
- API: /api/wizard/test_path.


## v0.5.1 (2026-02-10 02:08:11)
- UI: Erststart-Assistent (Projektordner + Auto-Open) komplett laientauglich.
- API: /api/wizard/status + /api/wizard/set_project_root.
- Doku: README erweitert (Start, Safe Mode, Logout, Settings).


## v0.5.0 (2026-02-10 02:02:01)
- Start: Auto-Browser-Open (optional) via start.sh + settings ui.auto_open_browser.
- UI: Dropdown „Browser automatisch öffnen: an/aus“ (persistiert).
- Runtime: .runtime.json wird geschrieben (Host/Port), damit start.sh den richtigen Port öffnet.


## v0.4.9 (2026-02-10 02:00:13)
- SAFE MODE: „↗ Öffnen“ Button (öffnet /safe in neuem Tab mit korrektem Port).


## v0.4.8 (2026-02-10 01:58:45)
- UI: Port-Banner erweitert um „↗ Öffnen“ (neuer Tab).


## v0.4.7 (2026-02-10 01:56:43)
- UI: Port-Banner mit aktueller URL + Kopier-Button (Laienfreundlich).
- API: /api/runtime/status liefert Host/Port/Safe-Mode.


## v0.4.6 (2026-02-10 01:53:51)
- Start: Port-Check – wenn belegt, wird automatisch der nächste freie Port gewählt.
- Start: Auto-Restart nach Auto-Fix (max. 2 Versuche) über start.sh.
- GUI: Logout-Button (Speichern & sauber schließen) + API /api/logout.


## v0.4.5 (2026-02-10 01:49:40)
- Tests: UI-API Check auf web/app.js korrigiert (fetch sitzt dort, nicht in index.html).


## v0.4.4 (2026-02-10 01:49:02)
- Tests: Stabilisiert und an aktuelle API/Features angepasst (realistisch, Node 18 kompatibel).


## v0.4.3 (2026-02-10 01:47:24)
- Tests: Umgestellt auf node:test + assert (keine t.ok/t.notOk mehr).
- Stabilität: Test-Suite läuft wieder sauber unter Node 18.


## v0.4.2 (2026-02-10 01:46:24)
- SAFE MODE: Auto-Fix Button (repariert server.js wenn Route-Logik nach module.exports hängt; Backup wird erstellt).
- Safe API: /api/safe/autofix.
- Stabilität: Nach erfolgreichem Auto-Fix sauberer Exit, damit Neustart möglich ist.


## v0.4.1 (2026-02-10 01:43:18)
- Start: Anti-Crash Shield (uncaughtException/unhandledRejection) – Tool bleibt am Leben.
- SAFE MODE: Selftest erkennt typische Startfehler und startet Reparatur-UI (/safe) statt abzustürzen.
- UI: Buttons/Dropdown im Safe Mode (Preflight, Diagnose kopieren, Report-ZIP, Neustart).
- Root: resolveProjectRoot als „single truth“ (Settings + optional CLI Override).


## v0.4.0 (2026-02-10 01:39:32)
- Fix: Entfernt versehentlich außerhalb des Request-Handlers gelandete Export-Route (req/res out-of-scope).
- Stabilität: server.js endet wieder sauber bei module.exports.


## v0.3.9 (2026-02-10 01:35:17)
- Fix: Preflight nutzt jetzt korrekt projectRoot aus startServer (kein globales project_root).
- Start: startServer gibt projectRoot zurück; main ruft Preflight mit projectRoot auf.


## v0.3.8 (2026-02-10 01:31:16)
- Hauptmodul: Job-Queue (Retry 1×, danach Skip; kritische Jobs stoppen).
- Auto-Report: Am Ende entsteht automatisch ein Report-ZIP (job_report.json + Logs) in exports/.
- UI: Neuer Tab „Batch“ mit Queue-Übersicht + Start/Reset + Demo-Jobs.
- API: /api/jobs/status, /api/jobs/add, /api/jobs/run, /api/jobs/reset.


## v0.3.7 (2026-02-05 01:42:12)
- Hauptmodul: Preflight + Self-Repair (auto) beim Start (Ordner, Rechte, settings.json).
- API: /api/preflight (GET Status, POST erneut prüfen).
- UI: Ampel-Widget im Dashboard + Diagnose kopieren.


## v0.3.6 (2026-02-05 01:23:25)
- Fix: Export-Handler lief außerhalb des Request-Scopes (ReferenceError: req). Jetzt sauber via handleExportEndpoints(req,res,...).


## v0.3.5 (2026-02-05 01:08:18)
- Hauptmodul: Export-Zentrum (ZIP-Backup im Projektordner exports/ + Download in UI).
- API: /api/export/list + /api/export/create + /exports/* (read-only).
- Notizen: server-seitig in notizen.txt via /api/notes (fallback bleibt).


## v0.3.4 (2026-02-04 23:55:49)
- Feature: Notfall-Overlay/Failsafe bei API-Ausfall (Neu laden, Reset, Diagnose kopieren).
- API: /api/reset_settings (nur loopback) für schnelle Selbstheilung.
- Robust: Server meldet Port-belegt (EADDRINUSE) mit klarer Lösung.


## v0.3.3 (2026-02-04 23:50:31)
- Fix: SyntaxError bei server.listen (orphaned '.listen' + Tippfehler 'server__HTTP_SERVER').


## v0.3.2 (2026-02-04 23:47:48)
- Feature: Automatisches sauberes Beenden (UI-Button + /api/shutdown, nur loopback).
- Robust: SIGINT/SIGTERM Hook, Log-Flush beim Exit.


## v0.3.1 (2026-02-04 23:33:10)
- Fix: server.js Shebang steht wieder in Zeile 1 (Node SyntaxError behoben).
- Fix: start.sh meldet nicht mehr fälschlich 'läuft' wenn Node beendet.


## v0.3.0 (2026-02-04 23:28:55)
- Macro-Keys (Schnellleiste) wie Referenz: Tasten 1–0 + 1–8 + Save.
- Konsole/Debug: Tabs + Key-Value-Chips im Footer.
- Pages: Sidebar wechselt echte Seiten (Dashboard/Settings/...).
- API: /api/status + /api/settings, Root als Single-Source-of-Truth.
- Logging: einfacher In-Memory-Buffer mit periodischem Flush.


## v0.2.2 (2026-02-04 23:18:09)
- UI-Politur: Doppel-Outlines, Griffleisten-Optik, Chamfer-Akzente an Cards, klarere Sidebar-Hierarchie.
- Accessibility: sichtbarer Keyboard-Fokus (focus-visible) konsistent auf allen interaktiven Elementen.
- Projekt-Doku: manifest.json + Entwicklungsstatus + Tools für Marker-Scan.

## v0.2.1
- Sidebar Icon-Slots + Active-Bevel/Glow.
- Panel/Card-Header Toolbars.
- Topbar Glühlinie + Hotspot.

## v0.6.9 (2026-02-10)
- docs: Codex+GitHub Workflow + Release-Checkliste + Standards zentral
- ci: GitHub Actions CI (Node 18, npm ci, npm test)
- repo: Issue/PR Templates + CODEOWNERS Beispiel

## v0.7.2 – 2026-02-10
- Preflight: großes Ergebnisfeld im System-Panel (READY/WARN/FAIL + Checkliste).
- AutoFix: Struktur reparieren + Linux-konforme Dateinamen automatisch umbenennen (ohne Absturz).
- Neue API-Endpunkte: /api/preflight/run + /api/preflight/autofix.
- Logout-Button: speichert und beendet Server über /api/exit.
- CSS: Dropdown-Kontrast + Preflight-UI-Komponenten.
- Tests: Existenz/Hook-Checks für Preflight.

## v0.7.3 – 2026-02-10
- Fix: app.js wird garantiert geladen (defer + cache-buster), Static-Files no-store.
- Neu: Notfall-Overlay bei JS-Fehlern (Reload/Safe-Mode/Logs export).
- Fix: init/wire abgesichert (try/catch) + DOMContentLoaded Boot.
