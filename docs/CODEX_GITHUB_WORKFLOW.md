# Codex + GitHub Workflow (Laien-sicher)

Dieses Dokument macht aus dem Repo eine **stabile Produktionslinie**: Issue → Fix → Test → Release, ohne „zwei Wahrheiten“ und ohne Überraschungen.

## 1) Zielbild (Release von hinten nach vorne)
Releasefertig heißt hier:

- **Start läuft immer**: Port-Check, Auto-Port-Fallback, klare URL-Ausgabe
- **UI reagiert immer**: Buttons lösen Aktionen aus (nie „tote Oberfläche“)
- **Fehler werden abgefangen**: Overlay + Lösungsknöpfe (Preflight / AutoFix / Neustart / Log export)
- **Daten bleiben konsistent**: eine Quelle der Wahrheit für `project_root`
- **Tests sichern Verhalten**: nicht nur „String existiert“, sondern echte Requests / Statuscodes / Payload

## 2) Codex-Aufträge als kleine, prüfbare Einheiten
Nutze pro Änderung **eine** klare Aufgabe, z. B.:

- „Fix: Theme Switch persistieren + UI sichtbar“
- „Feat: Macro-Keys Snippets CRUD + Clipboard + Fallback-History“
- „Refactor: Request-Routing zentralisieren (kein req außerhalb Handler)“

### Prompt-Template (kurz & hart)
1. **Ziel (1 Satz)**
2. **Ist/Fehler (1–3 Bullets)**
3. **Soll (Checkliste)**
4. **Nicht kaputt machen** (Regression-Check)
5. **Tests** (welche neuen Cases)

## 3) GitHub-Flow (minimal, robust)
### Branches
- max. **2 aktive** Branches: `main`, `dev` (Regel aus deinem Projektkontext)
- alles andere: kurzfristig, danach **merge** oder **löschen**

### Pull Request Pflichtpunkte
- [ ] `npm test` grün
- [ ] Startskript getestet (`./start.sh`)
- [ ] UI Buttons geprüft (Preflight, Test-Hinweis, Theme, Snippets)
- [ ] Changelog aktualisiert
- [ ] keine Platzhalter / keine TODO im Release-Path

## 4) Commit-Namensschema (für automatische Logs/Changelog)
Wir nutzen **Conventional Commits** (kompatibel zu SemVer).
Beispiele:
- `fix(core): request routing (req scope) stabilisieren`
- `feat(ui): theme switch + persistenz`
- `docs(readme): laien-start + troubleshoot`

## 5) GitHub Actions CI (automatisch testen)
Workflow liegt in `.github/workflows/ci.yml`:
- Node Version setzen
- `npm ci`
- `npm test`

## 6) CODEOWNERS (Review-Autopilot)
Wenn du später mit anderen arbeitest, kannst du Bereiche „besitzen“ lassen:
- `server.js` = Core
- `web/` = UI
- `tools/` = QA

## 7) Qualität: „kein Absturz ohne Lösung“
Regel: **Jeder Fehlerzustand muss mindestens 1 Klick-Lösung anbieten**:
- „AutoFix“
- „Neu starten“
- „Log exportieren“
- „In Safe-Mode starten“

## 8) Verknüpfung mit deinen Agent-Regeln
Aus `/AGENT.md` wurden übernommen:
- kleine Iterationen, messbar, rückverfolgbar
- Robustheit vor Feature-Fever
- keine toten Buttons, keine halben Pfade
