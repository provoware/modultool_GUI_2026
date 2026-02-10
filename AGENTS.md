# AGENTS.md – Modultool (Provoware) v0.7.1

Build: 2026-02-10 07:03:22

## Ziel
Iterative Entwicklung mit Codex + GitHub, maximal robust, keine Regressionen, kein „wildes“ Refactoring.

## Arbeitsregeln
1. Patch-Plan Pflicht: ohne `patch_plan.json` keine Codeänderung.
2. Scope-Only: nur Dateien aus `scope.files` anfassen.
3. Anchor-Only: nur an `scope.anchors` patchen.
4. Additiv: funktionierendes bleibt erhalten; Änderungen nur mit Grund.
5. Validierung: `npm test` + Preflight vor/nach.
6. Keine Endlosschleifen: nicht lösbar -> neue Planung.

## Mindest-Outputs pro Patch
- patch_plan.json
- patch_report.json
- aktualisierte Info-Dateien (siehe STANDARDS_VORGABEN.md)
- CHANGELOG-Eintrag

## Befehle
```bash
./start.sh
npm test
node tools/marker_scan.sh
```

## Fertig-Definition
Siehe INFO_RELEASE_BACK2FRONT.md + RELEASE_CHECKLIST.md
