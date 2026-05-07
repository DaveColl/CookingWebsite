<!-- src/routes/aufgaben/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	interface Aufgabe {
		id: number;
		titel: string;
		dauer_minuten: number;
		wiederholung: string;
		geplant_fuer: string;
		erledigt: number;
	}

	let { data }: { data: PageData & { aufgaben: Aufgabe[] } } = $props();

	let ansicht = $state<'woche' | 'monat'>('woche');
	let bezugsDatum = $state(new Date());
	let neueAufgabeOffen = $state(false);
	let verschiebenId = $state<number | null>(null);

	const heute = $derived(new Date().toISOString().slice(0, 10));

	const wocheTage = $derived.by(() => {
		const d = new Date(bezugsDatum);
		const day = d.getDay();
		const diff = day === 0 ? -6 : 1 - day;
		d.setDate(d.getDate() + diff);
		return Array.from({ length: 7 }, (_, i) => {
			const dd = new Date(d);
			dd.setDate(d.getDate() + i);
			return dd.toISOString().slice(0, 10);
		});
	});

	const monatTage = $derived.by(() => {
		const year = bezugsDatum.getFullYear();
		const month = bezugsDatum.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, i) => {
			const d = new Date(year, month, i + 1);
			return d.toISOString().slice(0, 10);
		});
	});

	const aufgabenNachDatum = $derived(
		data.aufgaben.reduce((map: Map<string, Aufgabe[]>, a: Aufgabe) => {
			const list = map.get(a.geplant_fuer) ?? [];
			list.push(a);
			map.set(a.geplant_fuer, list);
			return map;
		}, new Map<string, Aufgabe[]>())
	);

	const tageTage = $derived(ansicht === 'woche' ? wocheTage : monatTage);

	const navLabel = $derived(
		ansicht === 'woche'
			? `${wocheTage[0].slice(8)}.${wocheTage[0].slice(5, 7)}. – ${wocheTage[6].slice(8)}.${wocheTage[6].slice(5, 7)}.`
			: new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(bezugsDatum)
	);

	const monatErsterWochentag = $derived.by(() => {
		const year = bezugsDatum.getFullYear();
		const month = bezugsDatum.getMonth();
		const d = new Date(year, month, 1);
		const day = d.getDay();
		return day === 0 ? 7 : day;
	});

	function zurueck() {
		const d = new Date(bezugsDatum);
		if (ansicht === 'woche') d.setDate(d.getDate() - 7);
		else d.setMonth(d.getMonth() - 1);
		bezugsDatum = d;
	}

	function weiter() {
		const d = new Date(bezugsDatum);
		if (ansicht === 'woche') d.setDate(d.getDate() + 7);
		else d.setMonth(d.getMonth() + 1);
		bezugsDatum = d;
	}

	function wochentagKurz(datum: string): string {
		return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(
			new Date(datum + 'T00:00:00')
		);
	}

	function tagNummer(datum: string): string {
		return datum.slice(8).replace(/^0/, '');
	}
</script>

<svelte:head>
	<title>Aufgaben – Rezeptbuch</title>
</svelte:head>

<main>
	<div class="seite-kopf">
		<h1 class="seite-titel">Aufgaben</h1>
		<p class="seite-unter">Wöchentlicher Haushaltsplaner</p>
	</div>

	<div class="planer-kopf">
		<div class="planer-steuerung">
			<div class="ansicht-toggle">
				<button class:aktiv={ansicht === 'woche'} onclick={() => (ansicht = 'woche')}>
					Woche
				</button>
				<button class:aktiv={ansicht === 'monat'} onclick={() => (ansicht = 'monat')}>
					Monat
				</button>
			</div>
			<div class="nav-pfeile">
				<button class="pfeil" onclick={zurueck}>‹</button>
				<span class="nav-label">{navLabel}</span>
				<button class="pfeil" onclick={weiter}>›</button>
			</div>
			<button class="btn-neue" onclick={() => (neueAufgabeOffen = !neueAufgabeOffen)}>
				{neueAufgabeOffen ? '✕ Abbrechen' : '+ Neue Aufgabe'}
			</button>
		</div>
	</div>

	{#if neueAufgabeOffen}
		<form
			method="POST"
			action="?/erstellen"
			use:enhance={() => async ({ update }) => {
				await update();
				neueAufgabeOffen = false;
			}}
			class="neue-form"
		>
			<input
				type="text"
				name="titel"
				placeholder="Aufgabe (z.B. Staubsaugen)"
				required
				autocomplete="off"
			/>
			<input
				type="number"
				name="dauer_minuten"
				placeholder="Dauer (Min.)"
				min="1"
				value="20"
				required
			/>
			<select name="wiederholung">
				<option value="einmalig">Einmalig</option>
				<option value="taeglich">Täglich</option>
				<option value="woechentlich">Wöchentlich</option>
				<option value="monatlich">Monatlich</option>
			</select>
			<input type="date" name="geplant_fuer" value={heute} required />
			<button type="submit" class="btn-speichern-aufgabe">Speichern</button>
		</form>
	{/if}

	<div class={ansicht === 'monat' ? 'monat-grid' : 'woche-grid'}>
		{#each tageTage as datum, i (datum)}
			{@const tagesAufgaben = aufgabenNachDatum.get(datum) ?? []}
			<div
				class="tag-spalte"
				class:heute={datum === heute}
				style={ansicht === 'monat' && i === 0 ? `grid-column-start: ${monatErsterWochentag}` : ''}
			>
				<div class="tag-kopf">
					<span class="tag-wochentag">{wochentagKurz(datum)}</span>
					<span class="tag-nummer">{tagNummer(datum)}</span>
				</div>
				{#each tagesAufgaben as aufgabe (aufgabe.id)}
					{@const ueberfaellig = datum < heute && aufgabe.erledigt === 0}
					<div class="aufgabe-karte" class:erledigt={aufgabe.erledigt === 1} class:ueberfaellig>
						<div class="aufgabe-info">
							<span class="aufgabe-titel-text">{aufgabe.titel}</span>
							<span class="aufgabe-dauer">⏱ {aufgabe.dauer_minuten} Min.</span>
						</div>
						<div class="aufgabe-aktionen">
							{#if aufgabe.erledigt === 0}
								<form method="POST" action="?/erledigen" use:enhance>
									<input type="hidden" name="id" value={aufgabe.id} />
									<button type="submit" class="btn-aktion erledigen" title="Erledigt">✓</button>
								</form>
								{#if ueberfaellig}
									{#if verschiebenId === aufgabe.id}
										<form
											method="POST"
											action="?/verschieben"
											use:enhance
											onsubmit={() => (verschiebenId = null)}
										>
											<input type="hidden" name="id" value={aufgabe.id} />
											<input type="date" name="neues_datum" required />
											<button type="submit" class="btn-aktion ok">OK</button>
											<button
												type="button"
												class="btn-aktion abbrechen"
												onclick={() => (verschiebenId = null)}>✕</button
											>
										</form>
									{:else}
										<button
											type="button"
											class="btn-verschieben"
											onclick={() => (verschiebenId = aufgabe.id)}
										>
											Verschieben
										</button>
									{/if}
								{/if}
							{:else}
								<form method="POST" action="?/rueckgaengig" use:enhance>
									<input type="hidden" name="id" value={aufgabe.id} />
									<button type="submit" class="btn-aktion rueckgaengig" title="Rückgängig"
										>↩</button
									>
								</form>
							{/if}
							<form method="POST" action="?/loeschen" use:enhance>
								<input type="hidden" name="id" value={aufgabe.id} />
								<button type="submit" class="btn-aktion loeschen" title="Löschen">✕</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</main>

<style>
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 3rem 2rem 6rem;
	}

	.seite-kopf {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5ddd0;
	}

	.seite-titel {
		font-family: 'Lora', serif;
		font-size: clamp(1.9rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #2c4a1e;
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin-bottom: 0.35rem;
	}

	.seite-unter {
		font-size: 0.95rem;
		color: #6b6255;
		font-weight: 300;
	}

	.planer-kopf {
		margin-bottom: 1.25rem;
	}

	.planer-steuerung {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.ansicht-toggle {
		display: flex;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		overflow: hidden;
	}

	.ansicht-toggle button {
		background: transparent;
		border: none;
		padding: 0.35rem 0.85rem;
		font-family: 'Outfit', sans-serif;
		font-size: 0.82rem;
		font-weight: 500;
		color: #6b6255;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.ansicht-toggle button.aktiv {
		background: #2c4a1e;
		color: #fdfaf4;
	}

	.nav-pfeile {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.pfeil {
		background: transparent;
		border: 1.5px solid #ddd5c5;
		border-radius: 6px;
		width: 28px;
		height: 28px;
		font-size: 1.1rem;
		color: #6b6255;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	.pfeil:hover {
		border-color: #2c4a1e;
		color: #2c4a1e;
	}

	.nav-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: #4a3f33;
		min-width: 130px;
		text-align: center;
	}

	.btn-neue {
		font-family: 'Outfit', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #4a7c3f;
		background: transparent;
		border: 1.5px dashed #9dc495;
		border-radius: 8px;
		padding: 0.35rem 0.85rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.btn-neue:hover {
		background: rgba(74, 124, 63, 0.07);
		border-color: #4a7c3f;
	}

	/* New chore form */
	.neue-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-end;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
	}

	.neue-form input,
	.neue-form select {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		background: #f4f1eb;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		padding: 0.45rem 0.7rem;
		outline: none;
		transition: border-color 0.15s;
		color: #1a1a18;
	}

	.neue-form input:focus,
	.neue-form select:focus {
		border-color: #4a7c3f;
	}

	.neue-form input[name='titel'] {
		flex: 2;
		min-width: 160px;
	}

	.neue-form input[name='dauer_minuten'] {
		width: 110px;
	}

	.neue-form select {
		width: 145px;
	}

	.neue-form input[type='date'] {
		width: 150px;
	}

	.btn-speichern-aufgabe {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fdfaf4;
		background: #2c4a1e;
		border: none;
		border-radius: 8px;
		padding: 0.45rem 1.1rem;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}

	.btn-speichern-aufgabe:hover {
		background: #3d6528;
	}

	/* Calendar grids */
	.woche-grid,
	.monat-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
		overflow-x: auto;
	}

	.tag-spalte {
		background: #fdfaf4;
		border: 1px solid #e5ddd0;
		border-radius: 10px;
		padding: 0.6rem 0.5rem;
		min-width: 90px;
		min-height: 80px;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.tag-spalte.heute {
		border-color: #4a7c3f;
		background: #f3f8f1;
	}

	.tag-kopf {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.2rem;
	}

	.tag-wochentag {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #8a7d6e;
		letter-spacing: 0.05em;
	}

	.tag-nummer {
		font-size: 0.85rem;
		font-weight: 600;
		color: #2c4a1e;
	}

	.tag-spalte.heute .tag-nummer {
		background: #2c4a1e;
		color: #fdfaf4;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
	}

	/* Chore cards */
	.aufgabe-karte {
		background: #f0ebe2;
		border-radius: 6px;
		padding: 0.4rem 0.5rem;
		font-size: 0.78rem;
	}

	.aufgabe-karte.ueberfaellig {
		background: #fff8e1;
		border: 1px solid #f9c846;
	}

	.aufgabe-karte.erledigt {
		opacity: 0.45;
	}

	.aufgabe-karte.erledigt .aufgabe-titel-text {
		text-decoration: line-through;
	}

	.aufgabe-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.aufgabe-titel-text {
		font-weight: 500;
		color: #1a1a18;
		line-height: 1.3;
	}

	.aufgabe-dauer {
		font-size: 0.7rem;
		color: #8a7d6e;
	}

	.aufgabe-aktionen {
		display: flex;
		gap: 0.2rem;
		margin-top: 0.3rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.aufgabe-aktionen form {
		display: contents;
	}

	.btn-aktion {
		border: none;
		border-radius: 4px;
		width: 22px;
		height: 22px;
		font-size: 0.7rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.btn-aktion:hover {
		opacity: 0.75;
	}

	.btn-aktion.erledigen {
		background: #d4edda;
		color: #2c4a1e;
	}

	.btn-aktion.rueckgaengig {
		background: #e8e0d6;
		color: #5a4a3a;
	}

	.btn-aktion.loeschen {
		background: #fde8e8;
		color: #c0392b;
	}

	.btn-aktion.ok {
		background: #2c4a1e;
		color: #fdfaf4;
		width: auto;
		padding: 0 0.4rem;
	}

	.btn-aktion.abbrechen {
		background: #e8e0d6;
		color: #5a4a3a;
	}

	.btn-verschieben {
		font-size: 0.68rem;
		font-weight: 500;
		color: #8a5a00;
		background: transparent;
		border: 1px solid #f9c846;
		border-radius: 4px;
		padding: 0.1rem 0.3rem;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s;
	}

	.btn-verschieben:hover {
		background: #fff3cc;
	}

	.aufgabe-aktionen input[type='date'] {
		font-size: 0.7rem;
		padding: 0.1rem 0.3rem;
		border: 1px solid #ddd5c5;
		border-radius: 4px;
		background: #fdfaf4;
		width: 110px;
		color: #1a1a18;
	}

	@media (max-width: 700px) {
		.woche-grid {
			grid-template-columns: repeat(7, minmax(70px, 1fr));
		}

		.monat-grid {
			grid-template-columns: repeat(7, minmax(40px, 1fr));
		}
	}

	@media (max-width: 600px) {
		main {
			padding: 2rem 1.25rem 5rem;
		}

		.planer-steuerung {
			flex-direction: column;
			align-items: flex-start;
		}

		.woche-grid,
		.monat-grid {
			grid-template-columns: 1fr;
		}

		.tag-spalte {
			min-width: unset;
		}

		.monat-grid .tag-spalte {
			grid-column-start: auto !important;
		}
	}
</style>
