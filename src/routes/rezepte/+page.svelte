<!-- src/routes/rezepte/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	import { resolve } from '$app/paths';

	let suchbegriff = $state('');

	function formatZeit(min: number): string {
		if (min < 60) return `${min} Min`;
		const h = Math.floor(min / 60);
		const m = min % 60;
		return m === 0 ? `${h} Std` : `${h} Std ${m} Min`;
	}

	const gefilterteRezepte = $derived(
		suchbegriff.trim() === ''
			? data.rezepte
			: data.rezepte.filter((r) => r.titel.toLowerCase().includes(suchbegriff.toLowerCase().trim()))
	);
</script>

<div class="seite-kopf">
	<h1 class="seite-titel">Alle Rezepte</h1>
	<p class="seite-unter">Deine gesammelten Rezepte auf einen Blick.</p>
</div>

{#if data.rezepte.length > 0}
	<div class="suche-zeile">
		<input
			type="search"
			bind:value={suchbegriff}
			placeholder="Rezepte durchsuchen…"
			class="suche-eingabe"
		/>
	</div>
{/if}

{#if data.rezepte.length === 0}
	<p class="leer-hinweis">
		Noch keine Rezepte vorhanden.
		<a href={resolve('/rezepte/neues-rezept')}>Erstes Rezept hinzufügen →</a>
	</p>
{:else if gefilterteRezepte.length === 0}
	<p class="leer-hinweis">Kein Rezept gefunden für „{suchbegriff}".</p>
{:else}
	<div class="karten-grid">
		{#each gefilterteRezepte as rezept (rezept.id)}
			<a
				href={resolve(`/rezepte/${rezept.id}`)}
				class="rezept-karte"
			>
				{#if rezept.bild}
					<img
						class="karte-bild"
						src={rezept.bild}
						alt={rezept.titel}
						loading="lazy"
					/>
				{:else}
					<div
						class="karte-bild-platzhalter"
						aria-hidden="true"
					>
						🍽
					</div>
				{/if}
				<p class="karte-titel">{rezept.titel}</p>
				<p class="karte-meta">{rezept.portionen} Portionen · {formatZeit(rezept.zubereitungszeit)}</p>
			</a>
		{/each}
	</div>
{/if}

<style>
	.suche-zeile {
		margin-bottom: 1.75rem;
	}

	.suche-eingabe {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		color: #1a1a18;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 10px;
		padding: 0.7rem 0.95rem;
		width: 100%;
		outline: none;
		transition:
			border-color 0.18s,
			box-shadow 0.18s;
		-webkit-appearance: none;
		appearance: none;
	}

	.suche-eingabe:focus {
		border-color: #4a7c3f;
		box-shadow: 0 0 0 3px rgba(74, 124, 63, 0.13);
	}

	.suche-eingabe::placeholder {
		color: #c4bab0;
	}

	.leer-hinweis {
		color: #8a7d6e;
		font-size: 0.95rem;
		margin-top: 1rem;
	}
	.leer-hinweis a {
		color: #4a7c3f;
		text-decoration: none;
	}
	.leer-hinweis a:hover {
		text-decoration: underline;
	}
</style>
