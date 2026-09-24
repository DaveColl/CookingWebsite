# Rezeptbuch (CookingWebsite)

Selbst gehostete Rezept-, Einkaufslisten- und Aufgaben-App.

## Stack

- **SvelteKit 2 + Svelte 5** (Runes-Modus erzwungen in `svelte.config.js`), TypeScript, Vite 8.
- **adapter-node** → `build/index.js`.
- **SQLite** via `better-sqlite3`, Datei `rezepte.db` im Projektroot (Produktionsdaten). Schema und idempotente Migrationen in `src/lib/db.ts`, die beim Serverstart laufen.
- **pm2**: App `kochseite` aus `ecosystem.config.cjs` (fork mode, `PORT=187`, `NODE_ENV=production`), Logs unter `~/.pm2/logs/kochseite-*.log`.
- Scripts: `npm run check` (svelte-check), `npm run lint` (prettier --check + eslint), `npm run format`, `npm run build`. **Kein Test-Script vorhanden.**
- CI (`.github/workflows/ci.yml`): check + lint auf push/PR nach `main`.

## Mobile/Desktop

Rein responsives CSS, Desktop-first mit `max-width`-Breakpoints: **700px** (Aufgaben), **600px** (Nav → Hamburger-Schublade, Layout), **500px** (Formulare, Einkauf), **375px** (kleine Phones). Drag & Drop in Aufgaben über Pointer Events (Maus und Touch). **Keine PWA** (kein Manifest, kein Service Worker).

## Verbindlicher Workflow: implementer/designer → reviewer → deployer

Diese Regel gilt ausnahmslos für jede Code-Änderung an der App:

1. Die Umsetzung macht ein ausführender Agent. Keiner von beiden committet, baut oder startet pm2:
   - **implementer** (`.claude/agents/implementer.md`) für Features, Fixes und Logik.
   - **designer** (`.claude/agents/designer.md`) für übergreifenden Stil und Aussehen: Farben, Typografie, Abstände, Übergänge, Vereinheitlichung. Er ändert nur die Darstellung und pflegt `.claude/design-system.md`.
   - Braucht ein Feature neues UI, baut der implementer es nach dem Design-System. Reine Optik-Aufträge gehen an den designer.
2. Nach **jeder** Änderung durch implementer oder designer läuft **zwingend** der **reviewer** (`.claude/agents/reviewer.md`) mit dem vollständigen Handoff. Es gibt keine Abkürzung, auch nicht bei „trivialen“ Änderungen.
3. Ist das Review **FAIL**, geht das Review-Ergebnis mit allen Befunden **direkt zurück an den Agenten, der die Änderung gemacht hat (implementer bzw. designer), nicht an den Nutzer**. Danach läuft wieder der reviewer. Diese Schleife wiederholt sich, bis PASS erreicht ist. Nur wenn nach **3** Korrekturrunden weiterhin FAIL vorliegt oder ein Befund eine fachliche Entscheidung erfordert, wird der Nutzer eingebunden.
4. Erst nach **PASS** wird der **deployer** (`.claude/agents/deployer.md`) mit dem PASS-Ergebnis und der Dateiliste aufgerufen. Er committet, baut und macht `pm2 reload kochseite`, danach folgt der Health-Check. Bei Build- oder Health-Fehler rollt er den Build zurück und meldet an den Nutzer.
5. Der Hauptagent committet, baut und restartet pm2 nicht selbst, sondern delegiert.

## Design

Verbindliches Design-System: [.claude/design-system.md](.claude/design-system.md). Ruhig, warm, simpel; Farben, Radien, Schatten, Schriftgrößen und Übergänge nur aus den dort definierten Stufen; Bewegung 150/250ms mit weicher Kurve; `prefers-reduced-motion` wird respektiert. Stand 2026-09-24 ist das System noch nicht als CSS-Tokens im Code umgesetzt. Das übernimmt der designer schrittweise.

## Hooks und Tools

- PostToolUse-Hook (`.claude/settings.json` → `.claude/hooks/post-edit-check.sh`): Nach jedem Edit/Write an Projektcode laufen automatisch prettier, eslint, svelte-check (Fehler der bearbeiteten Datei) und `npm test`, falls vorhanden.
- `.claude/hooks/guard-bash.sh`: blockiert für implementer/designer/reviewer git-Schreibbefehle, Build und pm2-Steuerung.
- `.claude/scripts/preview-sandbox.sh start|stop`: isolierte Dev-Preview (Kopie des Working Trees und DB-Snapshot) auf Port 5199. **Nie** `npm run dev` im Projektroot, weil das die Produktions-DB migriert.
- `.claude/scripts/viewport-check.mjs`: Puppeteer-Check auf 320/390/768/1440px (Overflow, Touch-Ziele, Konsolenfehler, Screenshots, optionale Interaktionsskripte).
- `.claude/scripts/health-check.sh`: pm2-Status, Stabilität, HTTP 200 aller Hauptrouten, neue Error-Log-Zeilen.

## Bekannte Altlasten (Stand 2026-09-24, nicht blockierend, solange unberührt)

- `npm run check`: 4 Typfehler in `src/routes/aufgaben/+page.svelte` (fehlendes `reihenfolge` in optimistischen Objekten, Z. ~388/701) sowie 4 a11y-Warnungen dort.
- `eslint`: `svelte/prefer-writable-derived` in `aufgaben/+page.svelte:29` und `einkauf/+page.svelte:17`, unbenutztes `e` in `aufgaben/+page.svelte:235`.
- `prettier --check`: `ecosystem.config.cjs`, `src/app.html`, `src/lib/db.ts`, `src/routes/aufgaben/+page.server.ts`, `src/routes/aufgaben/+page.svelte`.
- `static/uploads/.gitkeep` ist im Working Tree gelöscht. Nicht mitcommitten.
