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

---

## PROVOWARE GLOBAL DEVELOPMENT CONTRACT

Dieser globale Kern gilt zusätzlich zu den projektspezifischen Regeln. Bei Sicherheits- oder Nachvollziehbarkeitskonflikten hat er Vorrang; lokale Regeln dürfen ihn verschärfen, nicht stillschweigend abschwächen.

- **Frozen Current Plan:** Laufenden freigegebenen Plan nicht durch neue Ideen erweitern; Neues in die nächste Iteration einordnen.
- **Conflict Gate:** Unterbrechen nur bei nachgewiesenem Konflikt mit Planvoraussetzung, Sicherheit, Ausgangs-SHA, Scope oder Invariant.
- **Single Writer:** Pro produktivem Scope nur ein autorisierter Executor; Analyse/Planung/Prüfung dürfen parallel lesen.
- **SHA + Scope:** Vor Mutation HEAD und erlaubten/verbotenen Scope prüfen; keine stillen Nebenrefactorings.
- **Evidence:** Kein PASS ohne echten Test; Evidence muss zum geprüften HEAD gehören.
- **Controlled Evidence Lab:** Echte Mutationen, Fehler-Injektion und Recovery-Tests nur in isolierten Testbereichen; Produktivdaten bleiben geschützt.
- **Next Queue:** Neue Anforderungen/Findings append-only erfassen und Beziehungen wie BLOCKS, REQUIRES, SUPERSEDES, DUPLICATE oder CONFLICTS dokumentieren.
- **Statusklarheit:** OBSERVED/SUSPECTED/REPRODUCED/CONFIRMED/DISPROVED nicht vermischen.
- **Recovery Key:** Nach Abbruch oder Agentenwechsel müssen Stand, Ziel, Frozen Plan, Scope, Findings, Gates und nächster erlaubter Schritt ohne alten Chat rekonstruierbar sein.
- **Traceability:** Requirement/Decision → Finding → Plan → Change → Test/Evidence → Gate/Checkpoint nachvollziehbar halten.
- **Negativtests:** Schutzmechanismen absichtlich gegen falschen SHA, zweiten Writer, Scope-Verstoß und unbelegtes PASS testen.
- **Sichtbarer Fortschritt:** Längere Prüfungen mit Schritt, Fortschritt, Ergebnis und Ampelstatus darstellen.

Leitsatz: **Kein Agent muss sich erinnern. Kein Agent darf raten. Keine Änderung verliert ihren Ursprung. Kein PASS existiert ohne Evidence.**
