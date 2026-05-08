<!-- src/routes/aufgaben/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	interface Aufgabe {
		id: number;
		titel: string;
		dauer_minuten: number;
		wiederholung: string;
		geplant_fuer: string;
		erledigt: number;
		zugewiesen_an: string[];
		beschreibung: string | null;
	}

	function fokussieren(element: HTMLElement) {
		element.focus();
	}

	let {
		data
	}: { data: PageData & { aufgaben: Aufgabe[]; personen: string[]; titelVorschlaege: string[] } } =
		$props();

	let ansicht = $state<'woche' | 'monat'>('woche');
	let bezugsDatum = $state(new Date());
	let neueAufgabeOffen = $state(false);
	let zuweisenId = $state<number | null>(null);
	let zuweisenWert = $state('');
	let dragId = $state<number | null>(null);
	let dragZielDatum = $state<string | null>(null);

	// Modal state
	let detailId = $state<number | null>(null);
	let editTitel = $state('');
	let editDauer = $state(15);
	let editBeschreibung = $state('');
	let editWiederholung = $state('einmalig');
	let editTag = $state('');
	let editMonat = $state('');
	let editJahr = $state('');
	let modalZuweisenOffen = $state(false);
	let modalZuweisenWert = $state('');

	const aufgabeDetail = $derived(
		detailId != null ? (data.aufgaben.find((a) => a.id === detailId) ?? null) : null
	);

	$effect(() => {
		if (detailId != null) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	function localDateStr(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function kapName(s: string): string {
		return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
	}

	const heute = $derived(localDateStr(new Date()));
	const heuteParts = $derived(heute.split('-'));
	const heuteJahr = $derived(heuteParts[0]);
	const heuteMonat = $derived(String(parseInt(heuteParts[1])));
	const heuteTag = $derived(String(parseInt(heuteParts[2])));

	const wocheTage = $derived.by(() => {
		const day = bezugsDatum.getDay();
		const diff = day === 0 ? -6 : 1 - day;
		return Array.from({ length: 7 }, (_, i) =>
			localDateStr(
				new Date(
					bezugsDatum.getFullYear(),
					bezugsDatum.getMonth(),
					bezugsDatum.getDate() + diff + i
				)
			)
		);
	});

	const monatTage = $derived.by(() => {
		const year = bezugsDatum.getFullYear();
		const month = bezugsDatum.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, i) =>
			localDateStr(new Date(year, month, i + 1))
		);
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
		if (ansicht === 'woche') {
			bezugsDatum = new Date(
				bezugsDatum.getFullYear(),
				bezugsDatum.getMonth(),
				bezugsDatum.getDate() - 7
			);
		} else {
			bezugsDatum = new Date(bezugsDatum.getFullYear(), bezugsDatum.getMonth() - 1, 1);
		}
	}

	function weiter() {
		if (ansicht === 'woche') {
			bezugsDatum = new Date(
				bezugsDatum.getFullYear(),
				bezugsDatum.getMonth(),
				bezugsDatum.getDate() + 7
			);
		} else {
			bezugsDatum = new Date(bezugsDatum.getFullYear(), bezugsDatum.getMonth() + 1, 1);
		}
	}

	function wochentagKurz(datum: string): string {
		return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(
			new Date(datum + 'T00:00:00')
		);
	}

	function tagNummer(datum: string): string {
		return datum.slice(8).replace(/^0/, '');
	}

	function kreisFarbe(name: string): string {
		const farben = ['#2c4a1e', '#7c3f2c', '#2c3f7c', '#6b2c7c', '#2c6b7c', '#7c6b2c'];
		return farben[name.charCodeAt(0) % farben.length];
	}

	function onDragStart(id: number, event: DragEvent) {
		dragId = id;
		event.dataTransfer!.effectAllowed = 'move';
	}

	function onDragOver(datum: string, event: DragEvent) {
		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
		dragZielDatum = datum;
	}

	function onDragLeave() {
		dragZielDatum = null;
	}

	async function onDrop(datum: string, event: DragEvent) {
		event.preventDefault();
		dragZielDatum = null;
		if (dragId === null) return;
		const id = dragId;
		dragId = null;
		const body = new FormData();
		body.append('id', String(id));
		body.append('neues_datum', datum);
		await fetch('?/verschieben', { method: 'POST', body });
		await invalidateAll();
	}

	function aufgabeKlick(aufgabe: Aufgabe) {
		detailId = aufgabe.id;
		editTitel = kapName(aufgabe.titel);
		editDauer = aufgabe.dauer_minuten;
		editBeschreibung = aufgabe.beschreibung ?? '';
		editWiederholung = aufgabe.wiederholung;
		const parts = aufgabe.geplant_fuer.split('-');
		editJahr = parts[0];
		editMonat = String(parseInt(parts[1]));
		editTag = String(parseInt(parts[2]));
		modalZuweisenOffen = false;
		modalZuweisenWert = '';
	}

	function modalSchliessen() {
		detailId = null;
		modalZuweisenOffen = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') modalSchliessen();
	}}
/>

<datalist id="titel-liste">
	{#each data.titelVorschlaege as t (t)}
		<option value={kapName(t)}></option>
	{/each}
</datalist>
<datalist id="personen-liste">
	{#each data.personen as p (p)}
		<option value={kapName(p)}></option>
	{/each}
</datalist>

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
				<button
					class:aktiv={ansicht === 'woche'}
					onclick={() => (ansicht = 'woche')}
				>
					Woche
				</button>
				<button
					class:aktiv={ansicht === 'monat'}
					onclick={() => (ansicht = 'monat')}
				>
					Monat
				</button>
			</div>
			<div class="nav-pfeile">
				<button
					class="pfeil"
					onclick={zurueck}>‹</button
				>
				<span class="nav-label">{navLabel}</span>
				<button
					class="pfeil"
					onclick={weiter}>›</button
				>
			</div>
			<button
				class="btn-neue"
				onclick={() => (neueAufgabeOffen = !neueAufgabeOffen)}
			>
				{neueAufgabeOffen ? '✕ Abbrechen' : '+ Neue Aufgabe'}
			</button>
		</div>
	</div>

	{#if neueAufgabeOffen}
		<form
			method="POST"
			action="?/erstellen"
			use:enhance={() =>
				async ({ update }) => {
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
				list="titel-liste"
			/>
			<input
				type="number"
				name="dauer_minuten"
				placeholder="Dauer (Min.)"
				min="1"
				value=""
				required
			/>
			<select name="wiederholung">
				<option value="einmalig">Einmalig</option>
				<option value="taeglich">Täglich</option>
				<option value="woechentlich">Wöchentlich</option>
				<option value="monatlich">Monatlich</option>
			</select>
			<div class="datum-gruppe">
				<input
					type="text"
					inputmode="numeric"
					name="tag"
					value={heuteTag}
					maxlength="2"
					placeholder="TT"
					class="datum-teil datum-tag"
					required
				/>
				<span class="datum-trenner">.</span>
				<input
					type="text"
					inputmode="numeric"
					name="monat"
					value={heuteMonat}
					maxlength="2"
					placeholder="MM"
					class="datum-teil datum-monat"
					required
				/>
				<span class="datum-trenner">.</span>
				<input
					type="text"
					inputmode="numeric"
					name="jahr"
					value={heuteJahr}
					maxlength="4"
					placeholder="JJJJ"
					class="datum-teil datum-jahr"
					required
				/>
			</div>
			<input
				type="text"
				name="zugewiesen_an"
				placeholder="Zugewiesen an"
				maxlength="20"
				list="personen-liste"
				autocomplete="off"
			/>
			<button
				type="submit"
				class="btn-speichern-aufgabe">Speichern</button
			>
		</form>
	{/if}

	<div class={ansicht === 'monat' ? 'monat-grid' : 'woche-grid'}>
		{#each tageTage as datum, i (datum)}
			{@const tagesAufgaben = aufgabenNachDatum.get(datum) ?? []}
			<div
				class="tag-spalte"
				role="list"
				class:heute={datum === heute}
				class:drag-ziel={dragZielDatum === datum}
				style={ansicht === 'monat' && i === 0 ? `grid-column-start: ${monatErsterWochentag}` : ''}
				ondragover={(e) => onDragOver(datum, e)}
				ondragleave={onDragLeave}
				ondrop={(e) => onDrop(datum, e)}
			>
				<div class="tag-kopf">
					<span class="tag-wochentag">{wochentagKurz(datum)}</span>
					<span class="tag-nummer">{tagNummer(datum)}</span>
				</div>
				{#each tagesAufgaben as aufgabe (aufgabe.id)}
					{@const ueberfaellig = datum < heute && aufgabe.erledigt === 0}
					<div
						class="aufgabe-karte"
						role="listitem"
						class:erledigt={aufgabe.erledigt === 1}
						class:ueberfaellig
						draggable="true"
						ondragstart={(e) => onDragStart(aufgabe.id, e)}
					>
						<div
							class="aufgabe-info"
							role="button"
							tabindex="0"
							onclick={() => aufgabeKlick(aufgabe)}
							onkeydown={(e) => e.key === 'Enter' && aufgabeKlick(aufgabe)}
						>
							<span class="aufgabe-titel-text">{kapName(aufgabe.titel)}</span>
							<span class="aufgabe-dauer">⏱ {aufgabe.dauer_minuten} Min.</span>
						</div>

						<div class="zugewiesen-zeile">
							{#each aufgabe.zugewiesen_an as person (person)}
								<form
									method="POST"
									action="?/person_entfernen"
									use:enhance
								>
									<input
										type="hidden"
										name="id"
										value={aufgabe.id}
									/>
									<input
										type="hidden"
										name="name"
										value={person}
									/>
									<button
										type="submit"
										class="zugewiesen-kreis"
										title="{kapName(person)} entfernen"
										style="background: {kreisFarbe(person)}"
									>
										{person.slice(0, 2).toUpperCase()}
									</button>
								</form>
							{/each}

							{#if zuweisenId === aufgabe.id}
								<form
									method="POST"
									action="?/person_hinzufuegen"
									use:enhance={() =>
										async ({ update }) => {
											await update();
											zuweisenId = null;
										}}
									class="zuweisen-form"
								>
									<input
										type="hidden"
										name="id"
										value={aufgabe.id}
									/>
									<input
										type="text"
										name="name"
										bind:value={zuweisenWert}
										placeholder="Name"
										maxlength="20"
										list="personen-liste"
										use:fokussieren
									/>
									<button
										type="submit"
										class="btn-aktion ok">✓</button
									>
									<button
										type="button"
										class="btn-aktion abbrechen"
										onclick={() => (zuweisenId = null)}>✕</button
									>
								</form>
							{:else}
								<button
									type="button"
									class="zugewiesen-kreis zugewiesen-leer"
									title="Person hinzufügen"
									onclick={() => {
										zuweisenId = aufgabe.id;
										zuweisenWert = '';
									}}
								>
									+
								</button>
							{/if}
						</div>

						<div class="aufgabe-aktionen">
							{#if aufgabe.erledigt === 0}
								<form
									method="POST"
									action="?/erledigen"
									use:enhance
								>
									<input
										type="hidden"
										name="id"
										value={aufgabe.id}
									/>
									<button
										type="submit"
										class="btn-aktion erledigen"
										title="Erledigt">✓</button
									>
								</form>
								{#if ueberfaellig}
									<button
										type="button"
										class="btn-verschieben"
										onclick={() => aufgabeKlick(aufgabe)}
									>
										Verschieben
									</button>
								{/if}
							{:else}
								<form
									method="POST"
									action="?/rueckgaengig"
									use:enhance
								>
									<input
										type="hidden"
										name="id"
										value={aufgabe.id}
									/>
									<button
										type="submit"
										class="btn-aktion rueckgaengig"
										title="Rückgängig">↩</button
									>
								</form>
							{/if}
							<form
								method="POST"
								action="?/loeschen"
								use:enhance
							>
								<input
									type="hidden"
									name="id"
									value={aufgabe.id}
								/>
								<button
									type="submit"
									class="btn-aktion loeschen"
									title="Löschen">✕</button
								>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</main>

{#if aufgabeDetail}
	<div
		class="modal-overlay"
		onclick={modalSchliessen}
		role="presentation"
	>
		<div
			class="modal-panel"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-kopf">
				<span
					class="modal-badge"
					class:erledigt-badge={aufgabeDetail.erledigt === 1}
				>
					{aufgabeDetail.erledigt === 1 ? 'Erledigt' : 'Offen'}
				</span>
				<button
					class="modal-schliessen"
					onclick={modalSchliessen}
					title="Schließen">✕</button
				>
			</div>

			<form
				method="POST"
				action="?/bearbeiten"
				use:enhance={() =>
					async ({ update }) => {
						await update({ reset: false });
					}}
				class="modal-form"
			>
				<input
					type="hidden"
					name="id"
					value={aufgabeDetail.id}
				/>

				<input
					class="modal-titel-input"
					type="text"
					name="titel"
					bind:value={editTitel}
					required
					autocomplete="off"
					list="titel-liste"
				/>

				<div class="modal-meta-zeile">
					<div class="datum-gruppe">
						<input
							type="text"
							inputmode="numeric"
							name="tag"
							bind:value={editTag}
							maxlength="2"
							placeholder="TT"
							class="datum-teil datum-tag"
							required
						/>
						<span class="datum-trenner">.</span>
						<input
							type="text"
							inputmode="numeric"
							name="monat"
							bind:value={editMonat}
							maxlength="2"
							placeholder="MM"
							class="datum-teil datum-monat"
							required
						/>
						<span class="datum-trenner">.</span>
						<input
							type="text"
							inputmode="numeric"
							name="jahr"
							bind:value={editJahr}
							maxlength="4"
							placeholder="JJJJ"
							class="datum-teil datum-jahr"
							required
						/>
					</div>

					<div class="dauer-gruppe">
						<input
							type="number"
							name="dauer_minuten"
							bind:value={editDauer}
							min="1"
							class="dauer-input"
						/>
						<span class="dauer-label">Min.</span>
					</div>

					<select
						name="wiederholung"
						bind:value={editWiederholung}
						class="wiederholung-select"
					>
						<option value="einmalig">Einmalig</option>
						<option value="taeglich">Täglich</option>
						<option value="woechentlich">Wöchentlich</option>
						<option value="monatlich">Monatlich</option>
					</select>
				</div>

				<textarea
					name="beschreibung"
					bind:value={editBeschreibung}
					placeholder="Beschreibung hinzufügen..."
					class="modal-beschreibung"
					rows="3"
				></textarea>

				<button
					type="submit"
					class="btn-modal-speichern">Speichern</button
				>
			</form>

			<div class="modal-personen-section">
				<span class="modal-section-label">Zugewiesen an</span>
				<div class="modal-personen">
					{#each aufgabeDetail.zugewiesen_an as person (person)}
						<form
							method="POST"
							action="?/person_entfernen"
							use:enhance
						>
							<input
								type="hidden"
								name="id"
								value={aufgabeDetail.id}
							/>
							<input
								type="hidden"
								name="name"
								value={person}
							/>
							<button
								type="submit"
								class="modal-person-chip"
							>
								{kapName(person)} ✕
							</button>
						</form>
					{/each}

					{#if modalZuweisenOffen}
						<form
							method="POST"
							action="?/person_hinzufuegen"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									modalZuweisenOffen = false;
									modalZuweisenWert = '';
								}}
							class="modal-zuweisen-form"
						>
							<input
								type="hidden"
								name="id"
								value={aufgabeDetail.id}
							/>
							<input
								type="text"
								name="name"
								bind:value={modalZuweisenWert}
								placeholder="Name"
								maxlength="20"
								list="personen-liste"
								autocomplete="off"
								use:fokussieren
							/>
							<button
								type="submit"
								class="btn-modal-aktion ok">✓</button
							>
							<button
								type="button"
								class="btn-modal-aktion abbrechen"
								onclick={() => (modalZuweisenOffen = false)}>✕</button
							>
						</form>
					{:else}
						<button
							type="button"
							class="modal-person-hinzufuegen"
							onclick={() => {
								modalZuweisenOffen = true;
								modalZuweisenWert = '';
							}}
						>
							+ Person
						</button>
					{/if}
				</div>
			</div>

			<div class="modal-aktionen-zeile">
				{#if aufgabeDetail.erledigt === 0}
					<form
						method="POST"
						action="?/erledigen"
						use:enhance={() =>
							async ({ update }) => {
								await update();
								detailId = null;
							}}
					>
						<input
							type="hidden"
							name="id"
							value={aufgabeDetail.id}
						/>
						<button
							type="submit"
							class="btn-modal-erledigen">✓ Erledigen</button
						>
					</form>
				{:else}
					<form
						method="POST"
						action="?/rueckgaengig"
						use:enhance
					>
						<input
							type="hidden"
							name="id"
							value={aufgabeDetail.id}
						/>
						<button
							type="submit"
							class="btn-modal-rueckgaengig">↩ Rückgängig</button
						>
					</form>
				{/if}
				<form
					method="POST"
					action="?/loeschen"
					use:enhance={() =>
						async ({ update }) => {
							await update();
							detailId = null;
						}}
				>
					<input
						type="hidden"
						name="id"
						value={aufgabeDetail.id}
					/>
					<button
						type="submit"
						class="btn-modal-loeschen">✕ Löschen</button
					>
				</form>
			</div>
		</div>
	</div>
{/if}

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

	.neue-form input[name='zugewiesen_an'] {
		width: 130px;
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

	/* Date group (used in create form and modal) */
	.datum-gruppe {
		display: flex;
		align-items: center;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		overflow: hidden;
		background: #f4f1eb;
	}

	.datum-teil {
		border: none;
		background: transparent;
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		color: #1a1a18;
		text-align: center;
		padding: 0.42rem 0.2rem;
		outline: none;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.datum-teil::-webkit-inner-spin-button,
	.datum-teil::-webkit-outer-spin-button {
		-webkit-appearance: none;
	}

	.datum-tag,
	.datum-monat {
		width: 28px;
	}

	.datum-jahr {
		width: 46px;
	}

	.datum-trenner {
		color: #8a7d6e;
		font-size: 0.9rem;
		user-select: none;
		padding: 0 1px;
	}

	/* Slightly larger date inputs in the neue-form context */
	.neue-form .datum-gruppe {
		border: 1.5px solid #ddd5c5;
	}

	.neue-form .datum-teil {
		font-size: 0.9rem;
		padding: 0.45rem 0.2rem;
	}

	.neue-form .datum-tag,
	.neue-form .datum-monat {
		width: 30px;
	}

	.neue-form .datum-jahr {
		width: 50px;
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
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.tag-spalte.heute {
		border-color: #4a7c3f;
		background: #f3f8f1;
	}

	.tag-spalte.drag-ziel {
		border-color: #4a7c3f;
		background: #eef5ec;
		outline: 2px dashed #9dc495;
		outline-offset: -2px;
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

	.aufgabe-karte {
		background: #f0ebe2;
		border-radius: 6px;
		padding: 0.4rem 0.5rem;
		font-size: 0.78rem;
		cursor: grab;
	}

	.aufgabe-karte:active {
		cursor: grabbing;
		opacity: 0.6;
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
		cursor: pointer;
		user-select: none;
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

	.zugewiesen-zeile {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.2rem;
		flex-wrap: wrap;
	}

	.zugewiesen-kreis {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: none;
		color: #fdfaf4;
		font-size: 0.55rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		letter-spacing: 0;
		transition: opacity 0.15s;
	}

	.zugewiesen-kreis:hover {
		opacity: 0.8;
	}

	.zugewiesen-leer {
		background: #ddd5c5;
		color: #8a7d6e;
		font-size: 0.8rem;
		font-weight: 400;
	}

	.zuweisen-form {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.zuweisen-form input[type='text'] {
		font-size: 0.7rem;
		padding: 0.1rem 0.3rem;
		border: 1px solid #ddd5c5;
		border-radius: 4px;
		background: #fdfaf4;
		width: 80px;
		color: #1a1a18;
		font-family: 'Outfit', sans-serif;
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

	/* ── Modal ─────────────────────────────────────────── */

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.38);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}

	.modal-panel {
		background: #fdfaf4;
		border-radius: 14px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
		width: 100%;
		max-width: 460px;
		max-height: 90vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.modal-kopf {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid #e5ddd0;
		flex-shrink: 0;
	}

	.modal-badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.2rem 0.65rem;
		border-radius: 20px;
		background: #d4edda;
		color: #2c4a1e;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.modal-badge.erledigt-badge {
		background: #e8e0d6;
		color: #6b6255;
	}

	.modal-schliessen {
		background: transparent;
		border: none;
		font-size: 1rem;
		color: #8a7d6e;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		line-height: 1;
		transition: background 0.15s;
	}

	.modal-schliessen:hover {
		background: #f0ebe2;
		color: #1a1a18;
	}

	.modal-form {
		padding: 1.1rem 1.25rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		border-bottom: 1px solid #e5ddd0;
	}

	.modal-titel-input {
		font-family: 'Lora', serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a18;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0.15rem 0;
		width: 100%;
		outline: none;
		transition: border-color 0.15s;
	}

	.modal-titel-input:focus {
		border-bottom-color: #4a7c3f;
	}

	.modal-meta-zeile {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.dauer-gruppe {
		display: flex;
		align-items: center;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		overflow: hidden;
		background: #f4f1eb;
		padding-right: 0.5rem;
	}

	.dauer-input {
		border: none;
		background: transparent;
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		color: #1a1a18;
		padding: 0.42rem 0.5rem;
		width: 52px;
		text-align: center;
		outline: none;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.dauer-input::-webkit-inner-spin-button,
	.dauer-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
	}

	.dauer-label {
		font-size: 0.78rem;
		color: #8a7d6e;
		font-family: 'Outfit', sans-serif;
	}

	.wiederholung-select {
		font-family: 'Outfit', sans-serif;
		font-size: 0.82rem;
		background: #f4f1eb;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		padding: 0.42rem 0.6rem;
		color: #1a1a18;
		outline: none;
		cursor: pointer;
	}

	.modal-beschreibung {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		background: #f4f1eb;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		padding: 0.65rem 0.75rem;
		color: #1a1a18;
		resize: vertical;
		min-height: 80px;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
	}

	.modal-beschreibung:focus {
		border-color: #4a7c3f;
	}

	.btn-modal-speichern {
		align-self: flex-end;
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		font-weight: 600;
		color: #fdfaf4;
		background: #2c4a1e;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1.3rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-modal-speichern:hover {
		background: #3d6528;
	}

	.modal-personen-section {
		padding: 0.85rem 1.25rem;
		border-bottom: 1px solid #e5ddd0;
	}

	.modal-section-label {
		display: block;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #8a7d6e;
		margin-bottom: 0.5rem;
		font-family: 'Outfit', sans-serif;
	}

	.modal-personen {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}

	.modal-personen form {
		display: contents;
	}

	.modal-person-chip {
		font-family: 'Outfit', sans-serif;
		font-size: 0.82rem;
		font-weight: 500;
		color: #4a3f33;
		background: #e8e0d6;
		border: none;
		border-radius: 20px;
		padding: 0.3rem 0.7rem;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.modal-person-chip:hover {
		background: #fde8e8;
		color: #c0392b;
	}

	.modal-person-hinzufuegen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.82rem;
		font-weight: 500;
		color: #4a7c3f;
		background: transparent;
		border: 1.5px dashed #9dc495;
		border-radius: 20px;
		padding: 0.25rem 0.7rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.modal-person-hinzufuegen:hover {
		background: rgba(74, 124, 63, 0.07);
	}

	.modal-zuweisen-form {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.modal-zuweisen-form input[type='text'] {
		font-family: 'Outfit', sans-serif;
		font-size: 0.82rem;
		padding: 0.25rem 0.45rem;
		border: 1.5px solid #ddd5c5;
		border-radius: 8px;
		background: #f4f1eb;
		width: 110px;
		color: #1a1a18;
		outline: none;
	}

	.btn-modal-aktion {
		border: none;
		border-radius: 6px;
		width: 26px;
		height: 26px;
		font-size: 0.78rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}

	.btn-modal-aktion:hover {
		opacity: 0.75;
	}

	.btn-modal-aktion.ok {
		background: #2c4a1e;
		color: #fdfaf4;
	}

	.btn-modal-aktion.abbrechen {
		background: #e8e0d6;
		color: #5a4a3a;
	}

	.modal-aktionen-zeile {
		padding: 0.85rem 1.25rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.modal-aktionen-zeile form {
		display: contents;
	}

	.btn-modal-erledigen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		font-weight: 500;
		color: #2c4a1e;
		background: #d4edda;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1.1rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-modal-erledigen:hover {
		background: #b8e0c2;
	}

	.btn-modal-rueckgaengig {
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		font-weight: 500;
		color: #5a4a3a;
		background: #e8e0d6;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1.1rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-modal-rueckgaengig:hover {
		background: #d8cfbf;
	}

	.btn-modal-loeschen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.88rem;
		font-weight: 500;
		color: #c0392b;
		background: #fde8e8;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1.1rem;
		cursor: pointer;
		transition: background 0.15s;
		margin-left: auto;
	}

	.btn-modal-loeschen:hover {
		background: #f8c8c8;
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

		.modal-overlay {
			padding: 0;
			align-items: flex-end;
		}

		.modal-panel {
			max-width: 100%;
			border-radius: 16px 16px 0 0;
			max-height: 88vh;
		}
	}
</style>
