# JSON-Versionierung (Inhalte im Tool)

## Ziel
Alle Inhalte (Snippets, Templates, Texte, Settings) werden als JSON gespeichert und besitzen Versionierung.

## Empfehlung
- project/data/versioned_items.json enthält aktuelle Versionen
- project/history/*.jsonl enthält Historie (append-only)

## Minimalfelder
- id, type, title
- payload (z.B. text)
- meta: created, updated, version, hash, history_ref
