<!-- src/lib/components/RezeptListe.svelte -->
<!-- Gemeinsame Listenansicht für /rezepte (Mittagessen) und /nachtisch -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Kategorie, Rezeptkarte } from '$lib/kategorien';

	interface ListenProps {
		rezepte: Rezeptkarte[];
		kategorie: Kategorie;
	}

	let { rezepte, kategorie }: ListenProps = $props();

	const texte = {
		mittagessen: {
			titel: 'Mittagessen',
			unter: 'Deine Hauptgerichte auf einen Blick.',
			suche: 'Mittagessen durchsuchen…',
			leer: 'Noch keine Mittagessen-Rezepte vorhanden.',
			ersterLink: 'Erstes Mittagessen hinzufügen →',
			platzhalter: '🍽'
		},
		nachtisch: {
			titel: 'Nachtisch',
			unter: 'Deine süßen Rezepte auf einen Blick.',
			suche: 'Nachtisch durchsuchen…',
			leer: 'Noch keine Nachtisch-Rezepte vorhanden.',
			ersterLink: 'Ersten Nachtisch hinzufügen →',
			platzhalter: '🍰'
		}
	} satisfies Record<Kategorie, Record<string, string>>;

	const text = $derived(texte[kategorie]);

	let suchbegriff = $state('');

	function formatZeit(min: number): string {
		if (min < 60) return `${min} Min`;
		const h = Math.floor(min / 60);
		const m = min % 60;
		return m === 0 ? `${h} Std` : `${h} Std ${m} Min`;
	}

	const gefilterteRezepte = $derived(
		suchbegriff.trim() === ''
			? rezepte
			: rezepte.filter((r) => r.titel.toLowerCase().includes(suchbegriff.toLowerCase().trim()))
	);
</script>

<svelte:head>
	<title>{text.titel} – Rezeptbuch</title>
</svelte:head>

<div class="seite-kopf">
	<h1 class="seite-titel">{text.titel}</h1>
	<p class="seite-unter">{text.unter}</p>
</div>

{#if rezepte.length > 0}
	<div class="suche-zeile">
		<input
			type="search"
			bind:value={suchbegriff}
			placeholder={text.suche}
			aria-label={text.suche}
			class="suche-eingabe"
		/>
	</div>
{/if}

{#if rezepte.length === 0}
	<p class="leer-hinweis">
		{text.leer}
		<a href={resolve(`/rezepte/neues-rezept?kategorie=${kategorie}`)}>{text.ersterLink}</a>
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
						{text.platzhalter}
					</div>
				{/if}
				<p class="karte-titel">{rezept.titel}</p>
				<p class="karte-meta">
					{rezept.portionen} Portionen · {formatZeit(rezept.zubereitungszeit)}
				</p>
			</a>
		{/each}
	</div>
{/if}

<style>
	.suche-zeile {
		margin-bottom: var(--abstand-5);
	}

	/* Innenabstand wie die globalen Eingabefelder (+layout.svelte) */
	.suche-eingabe {
		font-family: var(--schrift-text);
		font-size: var(--text-basis);
		color: var(--farbe-text);
		background: var(--farbe-flaeche);
		border: 1.5px solid var(--farbe-rand-stark);
		border-radius: var(--radius-m);
		padding: 0.7rem 0.95rem;
		width: 100%;
		transition: border-color var(--dauer-schnell) var(--kurve);
		-webkit-appearance: none;
		appearance: none;
	}

	/* Fokusring kommt global über :focus-visible (+layout.svelte) */
	.suche-eingabe:focus {
		border-color: var(--farbe-akzent);
	}

	.suche-eingabe::placeholder {
		color: var(--farbe-text-leise);
	}

	.leer-hinweis {
		color: var(--farbe-text-3);
		font-size: var(--text-ui);
		margin-top: var(--abstand-4);
	}
	/* Link in eigener Zeile, damit er nicht mitten im Text umbricht */
	.leer-hinweis a {
		display: flex;
		align-items: center;
		width: fit-content;
		max-width: 100%;
		margin-top: var(--abstand-1);
		color: var(--farbe-akzent);
		text-decoration: none;
	}
	@media (pointer: coarse) {
		.leer-hinweis a {
			min-height: 44px;
		}
	}
	@media (hover: hover) {
		.leer-hinweis a:hover {
			text-decoration: underline;
		}
	}
</style>
