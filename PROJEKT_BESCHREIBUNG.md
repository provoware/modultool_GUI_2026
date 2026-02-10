# Modultool Node (Provoware) – Projektbeschreibung

**Version:** 0.6.2  
**Build:** 2026-02-10 04:31:33

## Zweck
Offlinefähiges, laienfreundliches Steuerzentrum (HTML/CSS/JS) auf lokalem Node-Server. Fokus: **Robustheit, Konsistenz, Fehlerfreiheit**.

## Kernprinzip
**Nie abstürzen ohne Lösung.**  
Jeder Fehler wird als Status (READY/WARN/SAFE) + Hinweis/Overlay sichtbar und bietet Aktionen.

## Datenablage (Projektordner)
- `project/settings.json` – UI/Theme/A11y/Projektpfade
- `project/data/snippets.json` – Textbausteine + Tasten 1–12
- `project/logs/events.log` – Ereignisse (JSON-lines)
- `project/exports/` – Exporte (z.B. Logs)

## Module
- **Textbausteine / Schnelltasten**: Bausteine anlegen, Taste zuweisen, Klick kopiert in Zwischenablage, wird geloggt.
- **Footer-Cockpit**: Tabs + Statusbadge + Chips + Export.



## Snippet-Verlauf
- Bei jeder Änderung eines vorhandenen Textbausteins wird der alte Text als JSON-Zeile in `project/data/snippets_history.txt` gespeichert.
- Der Verlauf ist in der UI sichtbar und kopierbar.

## Entwicklungsprozess (Codex/GitHub)
- Vorgaben zentral: `STANDARDS_VORGABEN.md`
- Release-Checkliste: `RELEASE_CHECKLIST.md`
- Codex/GitHub Workflow: `docs/CODEX_GITHUB_WORKFLOW.md`
- CI: `.github/workflows/ci.yml`

## Build-Infos
- Version: 0.6.8
- Build-Date: 2026-02-10 05:55:10
