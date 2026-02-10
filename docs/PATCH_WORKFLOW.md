# Patch-Plan Workflow (Codex/GitHub) – v0.7.1

Ziel: Codex darf **nur** planmäßig arbeiten: erst Analyse + Patch-Erklärung, dann Änderungen, dann Validierung.
Keine Endlosschleifen. Wenn ein Fehler in dieser Iteration nicht sauber lösbar ist: in **neuen Patch-Plan** aufnehmen.

## Prinzipien (hart)
- **Nur** Dateien aus `patch_plan.json -> scope.files` ändern.
- **Nur** an `scope.anchors` patchen (Anchor = Datei + klarer Fixpunkt + optional Zeilenbereich).
- Änderungen sind **additiv**, funktionierender Code bleibt erhalten.
- Jede Änderung braucht einen **guten Grund** (Bugfix, Robustheit, UX, Testbarkeit).
- Wenn nicht lösbar: **abbrechen**, Erkenntnisse dokumentieren, **neue Planung**.

## Ablauf je Iteration
1) **Analyse** (ohne Codeänderung)
   - Problem beschreiben
   - betroffene Dateien/Funktionen
   - konkrete Patch-Stellen festhalten (Anchors + optional Zeilen)
   - Risiko: Was darf nicht kaputt gehen?

2) **Patch-Plan schreiben**
   - `patch_plan.json` erstellen oder aktualisieren
   - Steps + Tests + Info-Dateien festlegen

3) **Patch umsetzen**
   - nur Scope-Dateien anfassen
   - nur an Anchors patchen
   - keine Massen-Refactors

4) **Validierung**
   - `npm test`
   - Preflight
   - UI-Smoke: Buttons reagieren / Logs sichtbar / Theme umschaltbar

5) **Patch-Report**
   - `patch_report.json` schreiben: was geändert, warum, welche Tests, Ergebnis, offene Risiken

6) **Info-Dateien aktualisieren**
   - CHANGELOG.md
   - ENTWICKLUNGS_STATUS.md
   - todo.txt (inkl. Fortschritt + nächster Schritt)
   - docs/PROJECT_TREE.txt
   - registry.json
   - manifest.json
   - RELEASE_CHECKLIST.md
   - STANDARDS_VORGABEN.md
   - RECOMMENDATIONS.md (fortlaufende Empfehlungen)

## Keine Endlosschleifen (Regel)
Maximal **1 Patch-Iteration pro Problem**.
Wenn es nicht sauber gelöst wird:
- in `patch_report.json` dokumentieren (WAS/WO/WARUM)
- neuen Patch-Plan erstellen (neue Iteration)

Build: 2026-02-10 07:03:22
