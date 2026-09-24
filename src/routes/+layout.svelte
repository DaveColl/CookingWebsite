<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link
		rel="icon"
		href={favicon}
	/>
	<link
		rel="preconnect"
		href="https://fonts.googleapis.com"
	/>
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Nav />
{@render children()}

<style>
	/* Design-Tokens: Quelle der Wahrheit ist .claude/design-system.md */
	:global(:root) {
		/* Farben */
		--farbe-primaer: #2c4a1e;
		--farbe-primaer-hover: #3d6528;
		--farbe-akzent: #4a7c3f;
		--farbe-akzent-hell: #9dc495;
		--farbe-akzent-flaeche: rgba(74, 124, 63, 0.07);
		--farbe-hintergrund: #f4f1eb;
		--farbe-flaeche: #fdfaf4;
		--farbe-flaeche-2: #ede7dc;
		--farbe-rand: #e5ddd0;
		--farbe-rand-stark: #ddd5c5;
		--farbe-text: #1a1a18;
		--farbe-text-2: #6b6255;
		--farbe-text-3: #8a7d6e;
		--farbe-text-leise: #c4bab0;
		--farbe-fehler: #c0392b;
		--farbe-fehler-flaeche: #fdf2f0;
		--farbe-erfolg-flaeche: #f3f8f1;
		--farbe-hinweis: #f9c846;

		/* Form und Tiefe */
		--radius-s: 6px;
		--radius-m: 10px;
		--radius-l: 14px;
		--radius-rund: 999px;
		--schatten-s: 0 2px 8px rgba(44, 74, 30, 0.08);
		--schatten-m: 0 8px 28px rgba(44, 74, 30, 0.1);
		--schatten-l: 0 24px 64px rgba(0, 0, 0, 0.22);

		/* Abstände */
		--abstand-1: 0.25rem;
		--abstand-2: 0.5rem;
		--abstand-3: 0.75rem;
		--abstand-4: 1rem;
		--abstand-5: 1.5rem;
		--abstand-6: 2rem;
		--abstand-7: 3rem;

		/* Typografie */
		--schrift-titel: 'Lora', serif;
		--schrift-text: 'Outfit', sans-serif;
		--text-label: 0.72rem;
		--text-klein: 0.85rem;
		--text-ui: 0.95rem;
		--text-basis: 1rem;
		--text-karte: 1.15rem;
		--text-abschnitt: 1.4rem;
		--text-seite: clamp(1.9rem, 4vw, 2.8rem);

		/* Bewegung */
		--dauer-schnell: 150ms;
		--dauer-mittel: 250ms;
		--kurve: cubic-bezier(0.2, 0, 0, 1);

		/* Layout */
		--nav-hoehe: 62px;
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: var(--schrift-text);
		background: var(--farbe-hintergrund);
		color: var(--farbe-text);
		line-height: 1.65;
		min-height: 100vh;
	}

	/* Einheitlicher Fokus für Tastaturbedienung, gilt für alle Elemente inkl.
	   Eingabefeldern (die zusätzlich den Rand auf --farbe-akzent färben).
	   Nie outline: none setzen. */
	:global(:focus-visible) {
		outline: 2px solid var(--farbe-akzent);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(:root) {
			--dauer-schnell: 0ms;
			--dauer-mittel: 0ms;
		}
		:global(html) {
			scroll-behavior: auto;
		}
		:global(*, *::before, *::after) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}

	:global(.seite-kopf) {
		margin-bottom: 2.5rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--farbe-rand);
	}
	:global(.seite-titel) {
		font-family: var(--schrift-titel);
		font-size: var(--text-seite);
		font-weight: 700;
		color: var(--farbe-primaer);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin-bottom: 0.35rem;
	}
	:global(.seite-unter) {
		font-size: var(--text-ui);
		color: var(--farbe-text-2);
		font-weight: 300;
	}

	:global(.recipe-form) {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}
	:global(.form-group) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	:global(.form-row) {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--abstand-4);
	}
	@media (max-width: 500px) {
		:global(.form-row) {
			grid-template-columns: 1fr;
		}
	}
	:global(label) {
		font-size: var(--text-label);
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--farbe-text-3);
	}
	/* Fokus der Eingabefelder: Rand --farbe-akzent (bei :focus) plus der globale
	   :focus-visible-Ring oben. Kein outline: none. */
	:global(input[type='text']),
	:global(input[type='number']),
	:global(textarea),
	:global(select) {
		font-family: var(--schrift-text);
		font-size: var(--text-basis);
		color: var(--farbe-text);
		background: var(--farbe-flaeche);
		border: 1.5px solid var(--farbe-rand-stark);
		border-radius: var(--radius-m);
		padding: 0.7rem 0.95rem;
		width: 100%;
		appearance: none;
		transition: border-color var(--dauer-schnell) var(--kurve);
	}
	:global(input[type='number']) {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	:global(input[type='number']::-webkit-outer-spin-button),
	:global(input[type='number']::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	:global(input:focus),
	:global(textarea:focus),
	:global(select:focus) {
		border-color: var(--farbe-akzent);
	}
	:global(input::placeholder),
	:global(textarea::placeholder) {
		color: var(--farbe-text-leise);
	}
	:global(textarea) {
		min-height: 150px;
		resize: vertical;
		line-height: 1.6;
	}
	/* Hex im Data-URI (%238A7D6E = --farbe-text-3) ist die einzige erlaubte
	   Ausnahme: CSS-Variablen wirken nicht innerhalb von url(). */
	:global(select) {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238A7D6E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.8rem center;
		padding-right: 2rem;
		cursor: pointer;
	}

	:global(.zutaten-block) {
		background: var(--farbe-flaeche);
		border: 1.5px solid var(--farbe-rand-stark);
		border-radius: var(--radius-l);
		padding: 1.4rem 1.4rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	:global(.zutaten-label) {
		font-family: var(--schrift-titel);
		font-size: 1.05rem;
		font-style: italic;
		font-weight: 500;
		color: var(--farbe-primaer);
		margin-bottom: 0.1rem;
	}
	:global(.zutat-zeile) {
		display: grid;
		grid-template-columns: 1fr 88px 96px 34px;
		gap: 0.45rem;
		align-items: center;
	}
	@media (max-width: 500px) {
		:global(.zutat-zeile) {
			grid-template-columns: 1fr 72px 80px 30px;
		}
	}
	:global(.btn-entfernen) {
		width: 34px;
		height: 34px;
		border-radius: var(--radius-rund);
		border: 1.5px solid var(--farbe-rand-stark);
		background: transparent;
		color: var(--farbe-text-3);
		font-size: 0.8rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			border-color var(--dauer-schnell) var(--kurve),
			color var(--dauer-schnell) var(--kurve),
			background var(--dauer-schnell) var(--kurve);
	}
	:global(.btn-hinzufuegen) {
		align-self: flex-start;
		font-family: var(--schrift-text);
		font-size: var(--text-klein);
		font-weight: 500;
		color: var(--farbe-akzent);
		background: transparent;
		border: 1.5px dashed var(--farbe-akzent-hell);
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		transition:
			background var(--dauer-schnell) var(--kurve),
			border-color var(--dauer-schnell) var(--kurve);
		margin-top: 0.2rem;
	}
	:global(.btn-speichern) {
		font-family: var(--schrift-text);
		font-size: var(--text-basis);
		font-weight: 600;
		color: var(--farbe-flaeche);
		background: var(--farbe-primaer);
		border: none;
		border-radius: var(--radius-m);
		padding: 0.85rem 2rem;
		cursor: pointer;
		align-self: flex-start;
		transition:
			background var(--dauer-schnell) var(--kurve),
			transform var(--dauer-schnell) var(--kurve);
		margin-top: 0.4rem;
	}
	:global(.btn-speichern:active) {
		transform: translateY(1px);
	}

	:global(.meldung-fehler) {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-m);
		border: 1px solid var(--farbe-rand);
		border-left: 4px solid var(--farbe-fehler);
		background: var(--farbe-fehler-flaeche);
		color: var(--farbe-fehler);
		font-size: 0.9rem;
	}
	:global(.meldung-erfolg) {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-m);
		border: 1px solid var(--farbe-rand);
		border-left: 4px solid var(--farbe-primaer);
		background: var(--farbe-erfolg-flaeche);
		color: var(--farbe-primaer);
		font-size: 0.9rem;
	}

	:global(.karten-grid) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.25rem;
	}
	@media (max-width: 375px) {
		:global(.karten-grid) {
			grid-template-columns: 1fr;
		}
	}
	:global(.rezept-karte) {
		background: var(--farbe-flaeche);
		border: 1px solid var(--farbe-rand);
		border-radius: var(--radius-l);
		padding: 1.4rem;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: var(--abstand-2);
		transition:
			box-shadow var(--dauer-mittel) var(--kurve),
			transform var(--dauer-mittel) var(--kurve);
	}
	:global(.karte-titel) {
		font-family: var(--schrift-titel);
		font-size: var(--text-karte);
		font-weight: 700;
		color: var(--farbe-primaer);
		line-height: 1.3;
	}
	:global(.karte-meta) {
		font-size: 0.82rem;
		color: var(--farbe-text-3);
		font-weight: 300;
	}
	:global(.karte-bild) {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 0.2rem;
	}
	:global(.karte-bild-platzhalter) {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--farbe-flaeche-2);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		margin-bottom: 0.2rem;
	}

	/* Hover nur auf Geräten mit echtem Hover (Design-System, Bewegung Regel 4) */
	@media (hover: hover) {
		:global(.btn-entfernen:hover) {
			border-color: var(--farbe-fehler);
			color: var(--farbe-fehler);
			background: var(--farbe-fehler-flaeche);
		}
		:global(.btn-hinzufuegen:hover) {
			background: var(--farbe-akzent-flaeche);
			border-color: var(--farbe-akzent);
		}
		:global(.btn-speichern:hover) {
			background: var(--farbe-primaer-hover);
		}
		:global(.rezept-karte:hover) {
			box-shadow: var(--schatten-m);
			transform: translateY(-2px);
		}
	}

	/* Trefffläche ≥ 44px auf Touch-Geräten, ohne die sichtbare Größe zu ändern:
	   ein unsichtbares, zentriertes Pseudo-Element vergrößert den Klickbereich.
	   Nachbarn brauchen mindestens (44px − sichtbare Größe) / 2 Abstand. */
	@media (pointer: coarse) {
		:global(.btn-entfernen) {
			position: relative;
		}
		:global(.btn-entfernen::after) {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 100%;
			height: 100%;
			min-width: 44px;
			min-height: 44px;
			transform: translate(-50%, -50%);
		}
	}
</style>
