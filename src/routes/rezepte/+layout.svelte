<script lang="ts">
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: 'Outfit', sans-serif;
		background: #f4f1eb;
		color: #1a1a18;
		line-height: 1.65;
		min-height: 100vh;
	}

	main {
		max-width: 820px;
		margin: 0 auto;
		padding: 3rem 2rem 6rem;
	}

	@media (max-width: 600px) {
		main {
			padding: 2rem 1.25rem 5rem;
		}
	}

	@media (max-width: 375px) {
		main {
			padding: 1.5rem 1rem 4rem;
		}
	}

	/* ── Globale Styles ─────────────────────────────────────────────────────── */

	:global(.seite-kopf) {
		margin-bottom: 2.5rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5ddd0;
	}
	:global(.seite-titel) {
		font-family: 'Lora', serif;
		font-size: clamp(1.9rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #2c4a1e;
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin-bottom: 0.35rem;
	}
	:global(.seite-unter) {
		font-size: 0.95rem;
		color: #6b6255;
		font-weight: 300;
	}

	/* Formular */
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
		gap: 1rem;
	}
	@media (max-width: 500px) {
		:global(.form-row) {
			grid-template-columns: 1fr;
		}
	}
	:global(label) {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: #8a7d6e;
	}
	:global(input[type='text']),
	:global(input[type='number']),
	:global(textarea),
	:global(select) {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		color: #1a1a18;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 10px;
		padding: 0.7rem 0.95rem;
		width: 100%;
		outline: none;
		appearance: none;
		transition:
			border-color 0.18s,
			box-shadow 0.18s;
	}
	:global(input[type='number']) {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	:global(input[type='number']::-webkit-inner-spin-button),
	:global(input[type='number']::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	:global(input:focus),
	:global(textarea:focus),
	:global(select:focus) {
		border-color: #4a7c3f;
		box-shadow: 0 0 0 3px rgba(74, 124, 63, 0.13);
	}
	:global(input::placeholder),
	:global(textarea::placeholder) {
		color: #c4bab0;
	}
	:global(textarea) {
		min-height: 150px;
		resize: vertical;
		line-height: 1.6;
	}
	:global(select) {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238A7D6E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.8rem center;
		padding-right: 2rem;
		cursor: pointer;
	}

	/* Zutaten */
	:global(.zutaten-block) {
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 14px;
		padding: 1.4rem 1.4rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	:global(.zutaten-label) {
		font-family: 'Lora', serif;
		font-size: 1.05rem;
		font-style: italic;
		font-weight: 500;
		color: #2c4a1e;
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
		border-radius: 50%;
		border: 1.5px solid #ddd5c5;
		background: transparent;
		color: #b0a898;
		font-size: 0.8rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			border-color 0.15s,
			color 0.15s,
			background 0.15s;
	}
	:global(.btn-entfernen:hover) {
		border-color: #c0392b;
		color: #c0392b;
		background: #fdf2f0;
	}
	:global(.btn-hinzufuegen) {
		align-self: flex-start;
		font-family: 'Outfit', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #4a7c3f;
		background: transparent;
		border: 1.5px dashed #9dc495;
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
		margin-top: 0.2rem;
	}
	:global(.btn-hinzufuegen:hover) {
		background: rgba(74, 124, 63, 0.07);
		border-color: #4a7c3f;
	}
	:global(.btn-speichern) {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #fdfaf4;
		background: #2c4a1e;
		border: none;
		border-radius: 10px;
		padding: 0.85rem 2rem;
		cursor: pointer;
		align-self: flex-start;
		transition:
			background 0.18s,
			transform 0.1s;
		margin-top: 0.4rem;
	}
	:global(.btn-speichern:hover) {
		background: #3d6528;
	}
	:global(.btn-speichern:active) {
		transform: translateY(1px);
	}

	/* Meldungen */
	:global(.meldung-fehler) {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid #f0c0c0;
		border-left: 4px solid #c0392b;
		background: #fdf5f5;
		color: #8b2020;
		font-size: 0.9rem;
	}
	:global(.meldung-erfolg) {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid #b8d8b8;
		border-left: 4px solid #2c4a1e;
		background: #f3f8f1;
		color: #2c4a1e;
		font-size: 0.9rem;
	}

	/* Rezeptkarten */
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
		background: #fdfaf4;
		border: 1px solid #e5ddd0;
		border-radius: 14px;
		padding: 1.4rem;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition:
			box-shadow 0.2s,
			transform 0.2s;
	}
	:global(.rezept-karte:hover) {
		box-shadow: 0 8px 28px rgba(44, 74, 30, 0.1);
		transform: translateY(-2px);
	}
	:global(.karte-titel) {
		font-family: 'Lora', serif;
		font-size: 1.15rem;
		font-weight: 700;
		color: #2c4a1e;
		line-height: 1.3;
	}
	:global(.karte-meta) {
		font-size: 0.82rem;
		color: #8a7d6e;
		font-weight: 300;
	}

	/* Kartenbilder */
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
		background: #f0ebe2;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		margin-bottom: 0.2rem;
	}
</style>
