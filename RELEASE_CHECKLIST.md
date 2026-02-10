# Release-Checkliste (bis „Releasefertig“)

## A) Start & Betrieb (Laien)
- [ ] `./start.sh` startet ohne Syntaxfehler
- [ ] Port belegt → anderer Port wird automatisch gewählt
- [ ] Start zeigt URL + Pfad + Status in Konsole **und** UI
- [ ] Beenden/Logout speichert + stoppt Server sauber (Button in UI)

## B) UI (Referenzbild-Niveau)
- [ ] Mittiger Hauptbereich
- [ ] 2×2 Panel-Raster, gleiche Abstände, konsistente Rahmen
- [ ] Erweiterung nach unten: neue Panel-Reihen ohne Überdeckung
- [ ] Macro-Keys unten: Hardware-Look, Fokus sichtbar, Save-Anker rechts
- [ ] Footer zweistufig: Tabs oben, Chips/Status unten

## C) Funktionen (keine toten Buttons)
- [ ] Preflight: prüft Struktur + schreibt verständliche Hinweise
- [ ] Scan: marker scan + registry update + Ergebnis in UI
- [ ] Theme switcher: sichtbar, wirksam, persistent
- [ ] Accessibility: Kontrast, Großtext, Weniger Bewegung, Tooltips (sichtbar + wirksam)

## D) Snippets/Macro-Keys
- [ ] Snippet-Editor: Titel + Tastennummer + Text (CRUD)
- [ ] Klick auf Key kopiert in Zwischenablage
- [ ] Fallback: alter Inhalt wird in History-Datei angehängt
- [ ] Anzeige in UI: Titel + Keynummer sofort sichtbar
- [ ] Logging: klar, laienfreundlich, mit Kontext (welcher Key, welches Ziel)

## E) Tests (Verhalten)
- [ ] Server bootbar im Test, echte HTTP-Requests
- [ ] Negative Tests: Port belegt, kaputte JSON, Root ungültig, keine Rechte
- [ ] Preflight erzeugt Struktur korrekt (Dateisystem-Test)

## F) Doku
- [ ] README: Ein-Klick, Troubleshooting, Ports, Speicherorte
- [ ] PROJEKT_BESCHREIBUNG.md: Release-Story + Garantien (offline, no telemetry)
- [ ] STANDARDS_VORGABEN.md: alles zentral gesammelt
- [ ] Projektbaum-Datei aktuell (siehe `docs/PROJECT_TREE.txt`)

- [ ] Patch-Plan vorhanden + patch_report.json erstellt
