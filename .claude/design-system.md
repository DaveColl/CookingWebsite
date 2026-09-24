# Design-System „Rezeptbuch“

Leitbild: **ruhig, warm, simpel, flüssig.** Wenige Farben, wenige Größen, kurze und weiche Übergänge. Keine Effekte um der Effekte willen.
Gepflegt vom `designer`-Agent. implementer und reviewer halten sich daran.

## Tokens

Alle Tokens dieser Datei sind als CSS Custom Properties in `src/routes/+layout.svelte` (`:global(:root)`) definiert (seit 2026-09-24). Neue Styles verwenden **nur** `var(--…)`, keine neuen Hex-Werte oder Zwischengrößen.

### Stand der Umstellung

| Bereich                                                                       | Status                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Tokens, `body`, `:focus-visible`, reduced-motion                              | umgestellt (`+layout.svelte`)                     |
| Nav inkl. Hamburger-Schublade (`lib/components/Nav.svelte`)                   | umgestellt                                        |
| Startseite (`routes/+page.svelte`)                                            | umgestellt                                        |
| Gemeinsame Klassen in `+layout.svelte` (Formular, Buttons, Meldungen, Karten) | offen, noch Hex-Werte; betreffen alle Unterseiten |
| Rezepte, Einkauf, Aufgaben, `RezeptFormular.svelte`                           | offen                                             |

### Farben

| Token                    | Wert                      | Verwendung                                    |
| ------------------------ | ------------------------- | --------------------------------------------- |
| `--farbe-primaer`        | `#2c4a1e`                 | Titel, Primärbutton, aktive Nav               |
| `--farbe-primaer-hover`  | `#3d6528`                 | Hover Primärbutton                            |
| `--farbe-akzent`         | `#4a7c3f`                 | Links, Fokusrand, sekundäre Aktionen          |
| `--farbe-akzent-hell`    | `#9dc495`                 | gestrichelte Ränder, dezente Akzente          |
| `--farbe-akzent-flaeche` | `rgba(74, 124, 63, 0.07)` | Hover-Flächen von Akzent-Elementen            |
| `--farbe-hintergrund`    | `#f4f1eb`                 | Seitenhintergrund                             |
| `--farbe-flaeche`        | `#fdfaf4`                 | Karten, Nav, Eingabefelder                    |
| `--farbe-flaeche-2`      | `#ede7dc`                 | Hover neutraler Elemente, Platzhalter         |
| `--farbe-rand`           | `#e5ddd0`                 | Trennlinien, Kartenrand                       |
| `--farbe-rand-stark`     | `#ddd5c5`                 | Eingabefelder, Buttons mit Rand               |
| `--farbe-text`           | `#1a1a18`                 | Fließtext                                     |
| `--farbe-text-2`         | `#6b6255`                 | Sekundärtext, Nav-Links                       |
| `--farbe-text-3`         | `#8a7d6e`                 | Labels, Meta                                  |
| `--farbe-text-leise`     | `#c4bab0`                 | Placeholder, deaktiviert                      |
| `--farbe-fehler`         | `#c0392b`                 | Fehler, Löschen                               |
| `--farbe-fehler-flaeche` | `#fdf2f0`                 | Hintergrund von Fehlermeldungen/Löschen-Hover |
| `--farbe-erfolg-flaeche` | `#f3f8f1`                 | Hintergrund von Erfolgsmeldungen              |
| `--farbe-hinweis`        | `#f9c846`                 | Markierungen (z. B. „heute“)                  |

Weitere Farbtöne im Bestand (z. B. `#e8e0d6`, `#d4edda`, `#5a4a3a`) werden schrittweise auf die obigen Tokens zurückgeführt.

### Form, Tiefe, Abstände

| Token                         | Wert                                     | Verwendung                                                         |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `--radius-s`                  | `6px`                                    | Chips, kleine Buttons, Checkboxen                                  |
| `--radius-m`                  | `10px`                                   | Buttons, Eingabefelder, Meldungen                                  |
| `--radius-l`                  | `14px`                                   | Karten, Blöcke, Dialoge                                            |
| `--radius-rund`               | `999px`                                  | Pills, runde Icon-Buttons                                          |
| `--schatten-s`                | `0 2px 8px rgba(44, 74, 30, 0.08)`       | leichte Anhebung                                                   |
| `--schatten-m`                | `0 8px 28px rgba(44, 74, 30, 0.1)`       | Karten-Hover                                                       |
| `--schatten-l`                | `0 24px 64px rgba(0, 0, 0, 0.22)`        | Modale Dialoge                                                     |
| `--fokus-ring`                | `0 0 0 3px rgba(74, 124, 63, 0.13)`      | Fokus auf Eingaben/Buttons                                         |
| `--abstand-1` … `--abstand-7` | `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3rem` | nur diese Stufen für padding/gap/margin                            |
| `--nav-hoehe`                 | `62px`                                   | Höhe der Nav; Sticky-Offset der Schublade, `min-height`-Rechnungen |

Ausnahmen, die kein Token brauchen: Rahmenstärken (1px, 1.5px, 4px-Streifen), Icon-Geometrie (Hamburger-Striche 22×2px), Emoji-Icons (Startseite 2.5rem), Mindestmaße für Touch (44px) und Layout-Breiten (`max-width`, `minmax`).

### Typografie

- Überschriften und Kartentitel: **Lora**, 700 (`--schrift-titel`). Fließtext und UI: **Outfit**, 300–600 (`--schrift-text`).
- Größenstufen:

| Token              | Wert                         | Verwendung                                      |
| ------------------ | ---------------------------- | ----------------------------------------------- |
| `--text-label`     | `0.72rem`                    | Label, Versalien, `letter-spacing: 0.09em`      |
| `--text-klein`     | `0.85rem`                    | klein/Meta, Desktop-Nav-Links                   |
| `--text-ui`        | `0.95rem`                    | UI-Text                                         |
| `--text-basis`     | `1rem`                       | Fließtext, Eingaben (mind. 1rem wegen iOS-Zoom) |
| `--text-karte`     | `1.15rem`                    | Kartentitel                                     |
| `--text-abschnitt` | `1.4rem`                     | Abschnittstitel, Logo, Startseiten-Kachel       |
| `--text-seite`     | `clamp(1.9rem, 4vw, 2.8rem)` | Seitentitel (auch Startseiten-Titel)            |

- Keine neuen Zwischengrößen (0.82, 0.88, 0.78 …). Beim Anfassen auf die nächste Stufe runden.

## Bewegung: flüssig, aber zurückhaltend

| Token             | Wert                         | Verwendung                                         |
| ----------------- | ---------------------------- | -------------------------------------------------- |
| `--dauer-schnell` | `150ms`                      | Farbe, Hintergrund, Rand, Schatten bei Hover/Fokus |
| `--dauer-mittel`  | `250ms`                      | Auf-/Zuklappen, Einblenden, Menü, Dialog           |
| `--kurve`         | `cubic-bezier(0.2, 0, 0, 1)` | Standard für alles (weiches Auslaufen)             |

Regeln:

1. Animiert werden nur `opacity`, `transform`, Farben/Schatten und, wenn unvermeidbar, `max-height`/`grid-template-rows` beim Aufklappen. Kein Animieren von `width`, `top` oder `margin`.
2. Keine Bounces, kein Überschwingen, keine Dauer über 300ms, keine Dauerschleifen-Animationen (außer Ladeindikator).
3. Hover-Anhebung höchstens `translateY(-2px)` plus `--schatten-m`. `:active` höchstens `translateY(1px)`.
4. Hover-Effekte nur hinter `@media (hover: hover)`, damit auf Touch nichts „kleben“ bleibt.
5. Neue oder entfernte Listeneinträge dürfen mit Svelte `fade`/`slide` (Dauer 150–250ms) erscheinen, aber nicht bei jedem SSE-Update neu animiert werden.
6. Global gilt `@media (prefers-reduced-motion: reduce)` (in `+layout.svelte`): `--dauer-schnell`/`--dauer-mittel` werden `0ms`, alle CSS-Übergänge und -Animationen laufen mit `0.01ms`, `scroll-behavior: auto`. Svelte-JS-Transitions (`fade`/`slide`) sind davon nicht erfasst; wer sie nutzt, setzt die Dauer bei reduced-motion selbst auf 0.
7. Einheitlicher Fokus: global `:focus-visible { outline: 2px solid var(--farbe-akzent); outline-offset: 2px }`. Text-Eingaben, `textarea` und `select` zeigen Fokus stattdessen über Rand `--farbe-akzent` + `--fokus-ring` (ohne zusätzliche Outline). Nie `outline: none` ohne Ersatz.
8. Übergänge immer als `<eigenschaft> var(--dauer-…) var(--kurve)` schreiben, keine festen Sekunden-Werte und kein `ease`.
9. Touch-Geräte: interaktive Elemente unter `@media (pointer: coarse)` mindestens 44px hoch (z. B. Nav-Links auf Tablets).

## Komponenten-Muster

- **Primärbutton** `.btn-speichern`: `--farbe-primaer`, Text `--farbe-flaeche`, `--radius-m`, Höhe ≥ 44px.
- **Sekundär/gestrichelt** `.btn-hinzufuegen`: transparent, Rand `--farbe-akzent-hell` gestrichelt, Hover `--farbe-akzent-flaeche`.
- **Icon-Button rund** `.btn-entfernen`: `--radius-rund`, sichtbar 34px, Tap-Fläche auf Mobile ≥ 44px (z. B. per Padding oder Pseudo-Element).
- **Karte** `.rezept-karte`: `--farbe-flaeche`, Rand `--farbe-rand`, `--radius-l`, Hover wie Regel 3.
- **Eingabe**: `--farbe-flaeche`, Rand `--farbe-rand-stark`, `--radius-m`, Fokus `--farbe-akzent` + `--fokus-ring`.
- **Meldungen** `.meldung-fehler` / `.meldung-erfolg`: linker 4px-Streifen, `--radius-m`.

Wiederkehrende Muster gehören als `:global(...)`-Klasse in `+layout.svelte` und nicht als Kopie in jede Seite.
