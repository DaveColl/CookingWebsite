<script lang="ts">
	import RezeptFormular from '$lib/components/RezeptFormular.svelte';

	interface ImportierteWerte {
		titel?: string;
		portionen?: number;
		zubereitungszeit?: number;
		anleitung?: string;
		zutaten?: { name: string; menge: number; einheit: string }[];
		bild?: string | null;
	}

	let { form } = $props();

	let urlOffen = $state(false);
	let importUrl = $state('');
	let importLaeuft = $state(false);
	let importFehler = $state<string | null>(null);
	let importierteWerte = $state<ImportierteWerte | null>(null);
	let formularKey = $state(0);

	async function importieren() {
		if (!importUrl.trim()) return;
		importLaeuft = true;
		importFehler = null;
		try {
			const res = await fetch('/api/scrape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: importUrl.trim() })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				importFehler = body.message ?? `Fehler ${res.status}`;
				return;
			}
			importierteWerte = body;
			formularKey++;
			urlOffen = false;
			importUrl = '';
		} catch {
			importFehler = 'Netzwerkfehler beim Importieren.';
		} finally {
			importLaeuft = false;
		}
	}
</script>

<div class="seite-kopf">
	<h1 class="seite-titel">Neues Rezept</h1>
	<p class="seite-unter">Füge ein neues Rezept zu deiner Sammlung hinzu.</p>
</div>

<div class="import-bereich">
	<button class="btn-import-toggle" onclick={() => (urlOffen = !urlOffen)}>
		{urlOffen ? '▲ Schließen' : '🔗 Aus URL importieren'}
	</button>
	{#if urlOffen}
		<div class="import-box">
			<p class="import-hinweis">Rezept-URL einfügen – Felder werden automatisch ausgefüllt.</p>
			<div class="import-zeile">
				<input
					type="url"
					bind:value={importUrl}
					placeholder="https://www.chefkoch.de/rezepte/..."
					disabled={importLaeuft}
					autocomplete="off"
				/>
				<button
					type="button"
					class="btn-importieren"
					onclick={importieren}
					disabled={importLaeuft || !importUrl.trim()}
				>
					{importLaeuft ? 'Lädt…' : 'Importieren'}
				</button>
			</div>
			{#if importFehler}
				<p class="meldung-fehler">{importFehler}</p>
			{/if}
		</div>
	{/if}
</div>

{#key formularKey}
	<RezeptFormular
		action="?/create"
		{form}
		startWerte={importierteWerte}
		vorhandenesImportBild={importierteWerte?.bild}
	/>
{/key}

<style>
	.import-bereich {
		margin-bottom: 1.75rem;
	}

	.btn-import-toggle {
		font-family: 'Outfit', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #4a7c3f;
		background: transparent;
		border: 1.5px dashed #9dc495;
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.btn-import-toggle:hover {
		background: rgba(74, 124, 63, 0.07);
		border-color: #4a7c3f;
	}

	.import-box {
		margin-top: 0.75rem;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.import-hinweis {
		font-size: 0.85rem;
		color: #6b6255;
	}

	.import-zeile {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.import-zeile input {
		flex: 1;
		min-width: 200px;
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		color: #1a1a18;
		background: #f4f1eb;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		padding: 0.55rem 0.85rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.import-zeile input:focus {
		border-color: #4a7c3f;
	}

	.btn-importieren {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fdfaf4;
		background: #2c4a1e;
		border: none;
		border-radius: 8px;
		padding: 0.55rem 1.2rem;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}

	.btn-importieren:hover:not(:disabled) {
		background: #3d6528;
	}

	.btn-importieren:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
