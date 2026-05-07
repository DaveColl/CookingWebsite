<!-- src/routes/einkauf/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	interface Artikel {
		id: number;
		name: string;
		menge: string | null;
		erledigt: number;
		erstellt: number;
	}

	let artikelSSE = $state<Artikel[] | null>(null);
	const artikel = $derived(artikelSSE ?? data.artikel);

	$effect(() => {
		const es = new EventSource('/api/einkauf/stream');
		es.onmessage = (e) => {
			artikelSSE = JSON.parse(e.data);
		};
		return () => es.close();
	});

	const offeneArtikel = $derived(artikel.filter((a) => a.erledigt === 0));
	const erledigteArtikel = $derived(artikel.filter((a) => a.erledigt === 1));
</script>

<svelte:head>
	<title>Einkaufsliste · Rezeptbuch</title>
</svelte:head>

<div class="seite-kopf">
	<h1 class="seite-titel">Einkaufsliste</h1>
	<p class="seite-unter">Gemeinsam einkaufen — Änderungen sind sofort für alle sichtbar.</p>
</div>

<form
	method="POST"
	action="?/hinzufuegen"
	class="hinzufuegen-form"
	use:enhance
>
	<div class="hinzufuegen-zeile">
		<input
			type="text"
			name="name"
			placeholder="Artikel hinzufügen…"
			required
			autocomplete="off"
			class="artikel-eingabe"
		/>
		<input
			type="text"
			name="menge"
			placeholder="Menge"
			autocomplete="off"
			class="menge-eingabe"
		/>
		<button
			type="submit"
			class="btn-hinzufuegen">+</button
		>
	</div>
</form>

{#if offeneArtikel.length === 0 && erledigteArtikel.length === 0}
	<p class="leer-hinweis">Die Einkaufsliste ist leer. Füge oben Artikel hinzu.</p>
{/if}

{#if offeneArtikel.length > 0}
	<ul class="artikel-liste">
		{#each offeneArtikel as item (item.id)}
			<li class="artikel-zeile">
				<form
					method="POST"
					action="?/umschalten"
					use:enhance
				>
					<input
						type="hidden"
						name="id"
						value={item.id}
					/>
					<button
						type="submit"
						class="check-btn"
						aria-label="Als erledigt markieren"
					>
						<span class="check-kreis"></span>
					</button>
				</form>
				<span class="artikel-name">{item.name}</span>
				{#if item.menge}
					<span class="artikel-menge">{item.menge}</span>
				{/if}
				<form
					method="POST"
					action="?/entfernen"
					use:enhance
					class="entfernen-form"
				>
					<input
						type="hidden"
						name="id"
						value={item.id}
					/>
					<button
						type="submit"
						class="btn-entfernen"
						aria-label="Entfernen">✕</button
					>
				</form>
			</li>
		{/each}
	</ul>
{/if}

{#if erledigteArtikel.length > 0}
	<div class="erledigt-bereich">
		<div class="erledigt-kopf">
			<span>Erledigt ({erledigteArtikel.length})</span>
			<form
				method="POST"
				action="?/erledigtLoeschen"
				use:enhance
				class="inline-form"
			>
				<button
					type="submit"
					class="link-btn">Alle löschen</button
				>
			</form>
		</div>
		<ul class="artikel-liste erledigt-liste">
			{#each erledigteArtikel as item (item.id)}
				<li class="artikel-zeile erledigt">
					<form
						method="POST"
						action="?/umschalten"
						use:enhance
					>
						<input
							type="hidden"
							name="id"
							value={item.id}
						/>
						<button
							type="submit"
							class="check-btn check-btn-erledigt"
							aria-label="Als offen markieren"
						>
							<span class="check-kreis check-kreis-erledigt">✓</span>
						</button>
					</form>
					<span class="artikel-name erledigt-text">{item.name}</span>
					{#if item.menge}
						<span class="artikel-menge erledigt-text">{item.menge}</span>
					{/if}
					<form
						method="POST"
						action="?/entfernen"
						use:enhance
						class="entfernen-form"
					>
						<input
							type="hidden"
							name="id"
							value={item.id}
						/>
						<button
							type="submit"
							class="btn-entfernen"
							aria-label="Entfernen">✕</button
						>
					</form>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.hinzufuegen-form {
		margin-bottom: 2rem;
	}

	.hinzufuegen-zeile {
		display: grid;
		grid-template-columns: 1fr 140px 48px;
		gap: 0.5rem;
		align-items: center;
	}

	.artikel-eingabe,
	.menge-eingabe {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		color: #1a1a18;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 10px;
		padding: 0.7rem 0.95rem;
		outline: none;
		transition:
			border-color 0.18s,
			box-shadow 0.18s;
	}

	.artikel-eingabe:focus,
	.menge-eingabe:focus {
		border-color: #4a7c3f;
		box-shadow: 0 0 0 3px rgba(74, 124, 63, 0.13);
	}

	.artikel-eingabe::placeholder,
	.menge-eingabe::placeholder {
		color: #c4bab0;
	}

	.btn-hinzufuegen {
		width: 48px;
		height: 48px;
		background: #2c4a1e;
		color: #fdfaf4;
		border: none;
		border-radius: 10px;
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.btn-hinzufuegen:hover {
		background: #3d6528;
	}

	.artikel-liste {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.artikel-zeile {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #fdfaf4;
		border: 1px solid #e5ddd0;
		border-radius: 12px;
		padding: 0.75rem 1rem;
		min-height: 56px;
	}

	.check-btn {
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
	}

	.check-kreis {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid #c4bab0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			border-color 0.15s,
			background 0.15s;
		font-size: 0.7rem;
	}

	.check-btn:hover .check-kreis {
		border-color: #4a7c3f;
		background: rgba(74, 124, 63, 0.1);
	}

	.check-kreis-erledigt {
		background: #2c4a1e;
		border-color: #2c4a1e;
		color: #fdfaf4;
	}

	.check-btn-erledigt:hover .check-kreis-erledigt {
		background: #3d6528;
		border-color: #3d6528;
	}

	.artikel-name {
		flex: 1;
		font-size: 0.95rem;
		color: #1a1a18;
	}

	.artikel-menge {
		font-size: 0.85rem;
		color: #8a7d6e;
		flex-shrink: 0;
	}

	.erledigt-text {
		text-decoration: line-through;
		color: #aaa;
	}

	.entfernen-form {
		margin: 0;
	}

	.btn-entfernen {
		width: 34px;
		height: 34px;
		min-width: 44px;
		min-height: 44px;
		border-radius: 50%;
		border: 1.5px solid #ddd5c5;
		background: transparent;
		color: #b0a898;
		font-size: 0.75rem;
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

	.btn-entfernen:hover {
		border-color: #c0392b;
		color: #c0392b;
		background: #fdf2f0;
	}

	.leer-hinweis {
		color: #8a7d6e;
		font-size: 0.95rem;
		margin-top: 0.5rem;
		text-align: center;
		padding: 2rem;
	}

	.erledigt-bereich {
		margin-top: 1.5rem;
	}

	.erledigt-kopf {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #8a7d6e;
		margin-bottom: 0.75rem;
		padding: 0 0.25rem;
	}

	.inline-form {
		display: inline;
	}

	.link-btn {
		background: none;
		border: none;
		color: #c0392b;
		font-size: 0.82rem;
		font-family: 'Outfit', sans-serif;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		text-transform: none;
		letter-spacing: 0;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	.erledigt-liste {
		opacity: 0.75;
	}

	@media (max-width: 500px) {
		.hinzufuegen-zeile {
			grid-template-columns: 1fr 48px;
		}
		.menge-eingabe {
			display: none;
		}
	}
</style>
