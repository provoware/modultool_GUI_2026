# Standards & Vorgaben (zentral)

## Grundregeln
- Offline-first, keine Telemetrie
- Laienbedienung: jede Fehlersituation hat Buttons/Optionen als Lösung
- Eine Quelle der Wahrheit für Pfade (project_root)

## Dateibenennung
- Linux-konform: keine Leerzeichen, keine Sonderzeichen
- Zustands-Suffixe vor Endung (z.B. `_draft`, `_final`) wenn verwendet

## Datenhaltung
- JSON als Standard für Settings/State/Registry
- Keine stillen Überschreibungen: bei Konflikten fortlaufende Nummer

## UI/UX
- Kein Bereich verdeckt andere Bereiche
- Raster: 2×2 Panels, erweiterbar nach unten
- Fokus sichtbar (Keyboard)
- Tooltips dürfen nicht unter Cursor verschwinden (Offset + Delay)
- Themes: dunkel/hell/sonnendämmerung/carmouflage (persistiert)

## Logging (Laien)
- Kurz + eindeutig + lösungsorientiert
- Immer: Zeit, Bereich, Aktion, Ergebnis, Datei/Key (wenn relevant)
- Exportierbar aus UI

## QA/CI
- GitHub Actions: Node Setup + npm ci + npm test
- Marker-Scan automatisierbar via UI Button + CLI

## Agent-Regeln (Auszug)
- Jede Iteration: klein, messbar, rückverfolgbar (siehe AGENT.md)


## Patch-Plan Pflicht
- Vor jeder Codeänderung muss ein patch_plan.json existieren (Schema: docs/patch_plan_template.json).
- Es dürfen nur Dateien aus scope.files geändert werden.
- Es darf nur an scope.anchors gepatcht werden.
- Nach jedem Patch: Tests + Update der Pflicht-Info-Dateien.


## Info-Dateien Pflichtupdate (jede Iteration)
- CHANGELOG.md
- ENTWICKLUNGS_STATUS.md
- todo.txt
- docs/PROJECT_TREE.txt
- registry.json
- manifest.json
- RELEASE_CHECKLIST.md
- STANDARDS_VORGABEN.md


## Patch-Report Pflicht
- Nach jedem Patch wird patch_report.json erstellt: Änderungen, Gründe, Tests, Ergebnis, offene Risiken.


## Fortlaufende Empfehlungen
- RECOMMENDATIONS.md wird je Iteration ergänzt (Datum | Aspekt | Empfehlung | Nutzen | Risiko | Aufwand | Stelle).
