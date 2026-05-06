<!-- src/lib/components/RezeptFormular.svelte -->
<script lang="ts">
	import { untrack } from 'svelte';

	interface RezeptWerte {
		titel?: string;
		portionen?: number | string;
		zubereitungszeit?: number | string;
		anleitung?: string;
		zutaten?: ZutatDaten[];
	}
	interface ZutatDaten {
		name?: string;
		menge?: number | string;
		einheit?: string;
		id?: string;
	}
	interface ZutatAnzeige {
		id: string;
		name: string;
		mengeAnzeige: number | string;
		gewaehlteEinheit: EinheitKonfig;
	}
	interface EinheitKonfig {
		anzeige: string;
		basis: string;
		faktor: number;
	}
	interface FormularProps {
		action: string;
		form?: { erfolg?: boolean; message?: string; werte?: RezeptWerte } | null;
		startWerte?: RezeptWerte | null;
	}

	const einheitenKonfig: EinheitKonfig[] = [
		{ anzeige: 'g', basis: 'g', faktor: 1 },
		{ anzeige: 'kg', basis: 'g', faktor: 1000 },
		{ anzeige: 'ml', basis: 'ml', faktor: 1 },
		{ anzeige: 'l', basis: 'ml', faktor: 1000 },
		{ anzeige: 'TL', basis: 'TL', faktor: 1 },
		{ anzeige: 'EL', basis: 'TL', faktor: 3 },
		{ anzeige: 'Prise', basis: 'Prise', faktor: 1 },
		{ anzeige: 'Stück', basis: 'Stück', faktor: 1 },
		{ anzeige: 'Bund', basis: 'Bund', faktor: 1 },
		{ anzeige: 'Dose', basis: 'Dose', faktor: 1 },
		{ anzeige: 'Packung', basis: 'Packung', faktor: 1 }
	];

	function zutatZuAnzeige(z: ZutatDaten): ZutatAnzeige {
		return {
			id: z.id ?? crypto.randomUUID(),
			name: z.name ?? '',
			mengeAnzeige: z.menge ?? '',
			gewaehlteEinheit:
				einheitenKonfig.find((e) => e.basis === z.einheit && e.faktor === 1) ?? einheitenKonfig[0]
		};
	}

	let { action, form, startWerte }: FormularProps = $props();

	let zutaten = $state<ZutatAnzeige[]>(
		untrack(
			() =>
				startWerte?.zutaten?.map(zutatZuAnzeige) ??
				form?.werte?.zutaten?.map(zutatZuAnzeige) ?? [
					{
						id: crypto.randomUUID(),
						name: '',
						mengeAnzeige: '',
						gewaehlteEinheit: einheitenKonfig[0]
					}
				]
		)
	);

	function addZutat() {
		zutaten.push({
			id: crypto.randomUUID(),
			name: '',
			mengeAnzeige: '',
			gewaehlteEinheit: einheitenKonfig[0]
		});
	}

	function removeZutat(id: string) {
		const index = zutaten.findIndex((z) => z.id === id);
		if (index !== -1) zutaten.splice(index, 1);
	}

	async function zutatSuchen(suchbegriff: string, zutatId: string) {
		if (suchbegriff.length < 2) return;
		const res = await fetch(`/api/zutaten?q=${encodeURIComponent(suchbegriff)}`);
		const vorschlaege: string[] = await res.json();
		const datalist = document.getElementById(`vorschlaege-${zutatId}`);
		if (datalist) {
			datalist.innerHTML = vorschlaege
				.map((v) => `<option value="${v.charAt(0).toUpperCase() + v.slice(1)}">`)
				.join('');
		}
	}
</script>

{#if form?.erfolg === false}
	<p class="meldung-fehler">{form.message}</p>
{/if}
{#if form?.erfolg}
	<p class="meldung-erfolg">Rezept wurde gespeichert!</p>
{/if}

<form
	class="recipe-form"
	{action}
	method="POST"
>
	<div class="form-group">
		<label for="titel">Titel</label>
		<input
			id="titel"
			type="text"
			name="titel"
			value={startWerte?.titel ?? form?.werte?.titel ?? ''}
			placeholder="z.B. Omas Apfelkuchen"
			required
		/>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="portionen">Portionen</label>
			<input
				id="portionen"
				type="number"
				name="portionen"
				min="1"
				value={startWerte?.portionen ?? form?.werte?.portionen ?? ''}
				placeholder="4"
				required
			/>
		</div>
		<div class="form-group">
			<label for="zeit">Zubereitungszeit (Min)</label>
			<input
				id="zeit"
				type="number"
				name="zubereitungszeit"
				min="1"
				value={startWerte?.zubereitungszeit ?? form?.werte?.zubereitungszeit ?? ''}
				placeholder="30"
				required
			/>
		</div>
	</div>

	<div class="form-group">
		<label for="anleitung">Anleitung</label>
		<textarea
			id="anleitung"
			name="anleitung"
			value={startWerte?.anleitung ?? form?.werte?.anleitung ?? ''}
			placeholder="Schritt für Schritt…"
			required
		></textarea>
	</div>

	<div class="zutaten-block">
		<p class="zutaten-label">Zutaten</p>

		{#each zutaten as zutat (zutat.id)}
			<div class="zutat-zeile">
				<div>
					<input
						type="text"
						list="vorschlaege-{zutat.id}"
						bind:value={zutat.name}
						oninput={() => zutatSuchen(zutat.name, zutat.id)}
						placeholder="Zutat"
						required
					/>
					<datalist id="vorschlaege-{zutat.id}"></datalist>
				</div>
				<input
					type="number"
					bind:value={zutat.mengeAnzeige}
					placeholder="Menge"
					min="0"
					step="0.1"
					required
				/>
				<select bind:value={zutat.gewaehlteEinheit}>
					{#each einheitenKonfig as e (e.anzeige)}
						<option value={e}>{e.anzeige}</option>
					{/each}
				</select>

				<input
					type="hidden"
					name="zutat_name"
					value={zutat.name}
				/>
				<input
					type="hidden"
					name="zutat_menge"
					value={Math.round(Number(zutat.mengeAnzeige) * zutat.gewaehlteEinheit.faktor)}
				/>
				<input
					type="hidden"
					name="zutat_einheit"
					value={zutat.gewaehlteEinheit.basis}
				/>

				<button
					class="btn-entfernen"
					type="button"
					onclick={() => removeZutat(zutat.id)}
					aria-label="Zutat entfernen">✕</button
				>
			</div>
		{/each}

		<button
			class="btn-hinzufuegen"
			type="button"
			onclick={addZutat}>+ Zutat hinzufügen</button
		>
	</div>

	<button
		class="btn-speichern"
		type="submit">Rezept speichern</button
	>
</form>
