<!-- src/routes/rezepte/[id]/+page.svelte -->
<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import RezeptFormular from '$lib/components/RezeptFormular.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let bearbeiten = $state(false);
	let loeschenBestaetigen = $state(false);
	let ausgewaehlteZutaten = $state<number[]>([]);
	let hinzufuegenLaeuft = $state(false);
	let hinzufuegenMeldung = $state<string | null>(null);

	function zutatUmschalten(i: number) {
		ausgewaehlteZutaten = ausgewaehlteZutaten.includes(i)
			? ausgewaehlteZutaten.filter((x) => x !== i)
			: [...ausgewaehlteZutaten, i];
	}

	async function zurEinkaufslisteHinzufuegen() {
		const zutaten = data.zutaten
			.filter((_, i) => ausgewaehlteZutaten.includes(i))
			.map((z) => ({
				name: z.name.charAt(0).toUpperCase() + z.name.slice(1),
				menge: zutatAnzeige(z.menge, z.einheit)
			}));
		if (zutaten.length === 0) return;
		hinzufuegenLaeuft = true;
		hinzufuegenMeldung = null;
		try {
			const res = await fetch('/api/einkauf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ zutaten })
			});
			hinzufuegenMeldung = res.ok
				? `${zutaten.length} Zutat(en) zur Einkaufsliste hinzugefügt.`
				: 'Fehler beim Hinzufügen.';
		} catch {
			hinzufuegenMeldung = 'Netzwerkfehler.';
		} finally {
			hinzufuegenLaeuft = false;
			ausgewaehlteZutaten = [];
		}
	}

	// User's portion override — null means "use recipe default"
	let userPortionen = $state<number | null>(null);
	const aktuellePortionen = $derived(userPortionen ?? data.rezept.portionen);
	const faktor = $derived(
		data.rezept.portionen > 0 ? aktuellePortionen / data.rezept.portionen : 1
	);

	$effect(() => {
		if (form?.erfolg) {
			bearbeiten = false;
			userPortionen = null;
		}
	});

	function zutatAnzeige(rohMenge: number, einheit: string): string {
		const m = rohMenge * faktor;
		if (einheit === 'g' && m >= 1000) {
			const kg = m / 1000;
			return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
		}
		if (einheit === 'ml' && m >= 1000) {
			const l = m / 1000;
			return `${Number.isInteger(l) ? l : l.toFixed(1)} L`;
		}
		if (einheit === 'TL' && m >= 3) {
			const el = m / 3;
			return `${Number.isInteger(el) ? el : el.toFixed(1)} EL`;
		}
		const display = Number.isInteger(m) ? m : m.toFixed(1);
		return `${display} ${einheit}`;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') loeschenBestaetigen = false;
	}}
/>

{#if loeschenBestaetigen}
	<div class="overlay-wrap">
		<button
			class="overlay-backdrop"
			type="button"
			aria-label="Dialog schließen"
			onclick={() => (loeschenBestaetigen = false)}
		></button>
		<div
			class="dialog"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="dialog-titel"
			tabindex="-1"
		>
			<p class="dialog-icon">🗑</p>
			<h3 id="dialog-titel" class="dialog-titel">Rezept löschen?</h3>
			<p class="dialog-text">„{data.rezept.titel}" wird unwiderruflich gelöscht.</p>
			<div class="dialog-aktionen">
				<button class="dialog-abbrechen" onclick={() => (loeschenBestaetigen = false)}>
					Abbrechen
				</button>
				<form method="POST" action="?/loeschen">
					<button type="submit" class="dialog-loeschen">Ja, löschen</button>
				</form>
			</div>
		</div>
	</div>
{/if}

{#if bearbeiten}
	<div class="seite-kopf">
		<h1 class="seite-titel">{data.rezept.titel} bearbeiten</h1>
		<button class="link-btn" onclick={() => (bearbeiten = false)}>← Abbrechen</button>
	</div>

	<RezeptFormular
		action="?/bearbeiten"
		form={form?.erfolg ? null : form}
		buttonText="Änderungen speichern"
		currentBild={data.rezept.bild}
		startWerte={{
			titel: data.rezept.titel,
			portionen: data.rezept.portionen,
			zubereitungszeit: data.rezept.zubereitungszeit,
			anleitung: data.rezept.anleitung,
			zutaten: data.zutaten.map((z) => ({ name: z.name, menge: z.menge, einheit: z.einheit }))
		}}
	/>
{:else}
	{#if form?.erfolg}
		<p class="meldung-erfolg aktualisiert-meldung">Rezept wurde aktualisiert!</p>
	{/if}

	{#if data.rezept.bild}
		<img class="detail-bild" src={data.rezept.bild} alt={data.rezept.titel} />
	{/if}

	<div class="seite-kopf">
		<h1 class="seite-titel">{data.rezept.titel}</h1>
		<div class="rezept-meta">
			<div class="portionen-regler">
				<button
					class="portionen-btn"
					type="button"
					onclick={() => (userPortionen = Math.max(1, aktuellePortionen - 1))}
					aria-label="Portion entfernen">−</button
				>
				<span class="portionen-zahl">{aktuellePortionen}</span>
				<button
					class="portionen-btn"
					type="button"
					onclick={() => (userPortionen = aktuellePortionen + 1)}
					aria-label="Portion hinzufügen">+</button
				>
				<span class="meta-text">Portionen</span>
			</div>
			<span class="meta-trenner">·</span>
			<span class="meta-text">{data.rezept.zubereitungszeit} Min</span>
		</div>
	</div>

	<div class="rezept-body">
		<section>
			<div class="zutaten-karte">
				<h2 class="zutaten-kopf">Zutaten</h2>
				<ul class="zutaten-liste">
					{#each data.zutaten as zutat, i}
						<li class:zutat-ausgewaehlt={ausgewaehlteZutaten.includes(i)}>
							<button
								type="button"
								class="zutat-checkbox"
								onclick={() => zutatUmschalten(i)}
								aria-label="Zutat auswählen"
							>
								<span class="checkbox-kreis">{ausgewaehlteZutaten.includes(i) ? '✓' : ''}</span>
							</button>
							<span class="zutat-menge">{zutatAnzeige(zutat.menge, zutat.einheit)}</span>
							<span class="zutat-name"
								>{zutat.name.charAt(0).toUpperCase() + zutat.name.slice(1)}</span
							>
						</li>
					{/each}
				</ul>
				{#if ausgewaehlteZutaten.length > 0}
					<div class="einkauf-aktionen">
						<button
							type="button"
							class="btn-zur-liste"
							onclick={zurEinkaufslisteHinzufuegen}
							disabled={hinzufuegenLaeuft}
						>
							{hinzufuegenLaeuft
								? 'Wird hinzugefügt…'
								: `${ausgewaehlteZutaten.length} Zutat(en) zur Einkaufsliste →`}
						</button>
					</div>
				{/if}
				{#if hinzufuegenMeldung}
					<p class="meldung-erfolg einkauf-meldung">{hinzufuegenMeldung}</p>
				{/if}
			</div>
		</section>

		<section>
			<h2 class="sektion-titel">Anleitung</h2>
			<div class="anleitung-karte">
				<p class="anleitung-text">{data.rezept.anleitung}</p>
			</div>
		</section>
	</div>

	<div class="rezept-aktionen">
		<button class="btn-bearbeiten" onclick={() => (bearbeiten = true)}>Bearbeiten</button>
		<button class="btn-loeschen" onclick={() => (loeschenBestaetigen = true)}>Löschen</button>
	</div>
{/if}

<style>
	/* ── Delete dialog ──────────────────────────────────────────────────────── */
	.overlay-wrap {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.overlay-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(26, 26, 24, 0.55);
		border: none;
		cursor: default;
	}

	.dialog {
		position: relative;
		z-index: 1;
		background: #fdfaf4;
		border: 1px solid #e5ddd0;
		border-radius: 18px;
		padding: 2rem 2rem 1.75rem;
		max-width: 360px;
		width: 100%;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
		text-align: center;
	}

	.dialog-icon {
		font-size: 2rem;
		margin-bottom: 0.75rem;
	}

	.dialog-titel {
		font-family: 'Lora', serif;
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1a18;
		margin-bottom: 0.5rem;
	}

	.dialog-text {
		font-size: 0.875rem;
		color: #6b6255;
		line-height: 1.55;
		margin-bottom: 1.75rem;
	}

	.dialog-aktionen {
		display: flex;
		gap: 0.6rem;
		justify-content: center;
	}

	.dialog-abbrechen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #6b6255;
		background: transparent;
		border: 1.5px solid #ddd5c5;
		border-radius: 9px;
		padding: 0.6rem 1.25rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.dialog-abbrechen:hover {
		background: #f0ebe2;
		border-color: #c4bab0;
	}

	.dialog-loeschen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fdfaf4;
		background: #c0392b;
		border: none;
		border-radius: 9px;
		padding: 0.6rem 1.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.dialog-loeschen:hover {
		background: #a93226;
	}

	/* ── Detail view ────────────────────────────────────────────────────────── */
	.aktualisiert-meldung {
		margin-bottom: 1.5rem;
	}

	.detail-bild {
		width: 100%;
		max-height: 420px;
		object-fit: cover;
		border-radius: 14px;
		margin-bottom: 2rem;
	}

	.rezept-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.6rem;
		flex-wrap: wrap;
	}

	.portionen-regler {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.portionen-btn {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1.5px solid #ddd5c5;
		background: #fdfaf4;
		color: #2c4a1e;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.portionen-btn:hover {
		background: #ede7dc;
		border-color: #c4bab0;
	}

	.portionen-zahl {
		font-size: 0.95rem;
		font-weight: 600;
		color: #2c4a1e;
		min-width: 1.4rem;
		text-align: center;
	}

	.meta-text {
		font-size: 0.9rem;
		color: #6b6255;
	}

	.meta-trenner {
		color: #c4bab0;
		font-size: 0.9rem;
	}

	/* ── Sections ───────────────────────────────────────────────────────────── */
	.rezept-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Ingredients card */
	.zutaten-karte {
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 14px;
		overflow: hidden;
	}

	.zutaten-kopf {
		font-family: 'Lora', serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #2c4a1e;
		padding: 0.9rem 1.4rem;
		border-bottom: 1.5px solid #e5ddd0;
		background: #f7f3ec;
	}

	.zutaten-liste {
		list-style: none;
	}

	.zutaten-liste li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.93rem;
		padding: 0.5rem 1.4rem 0.5rem 0.75rem;
		transition: background 0.12s;
	}

	.zutaten-liste li:nth-child(odd) {
		background: #fdfaf4;
	}

	.zutaten-liste li:nth-child(even) {
		background: #f7f3ec;
	}

	.zutat-ausgewaehlt {
		background: rgba(74, 124, 63, 0.08) !important;
	}

	.zutat-checkbox {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		min-height: 36px;
		flex-shrink: 0;
	}

	.checkbox-kreis {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid #c4bab0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		color: #fdfaf4;
		background: transparent;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.zutat-checkbox:hover .checkbox-kreis {
		border-color: #4a7c3f;
	}

	.zutat-ausgewaehlt .checkbox-kreis {
		background: #2c4a1e;
		border-color: #2c4a1e;
	}

	.zutat-menge {
		color: #6b6255;
		font-weight: 500;
		min-width: 80px;
		flex-shrink: 0;
		font-size: 0.88rem;
	}

	.zutat-name {
		color: #1a1a18;
	}

	.einkauf-aktionen {
		padding: 0.75rem 1.4rem;
		border-top: 1px solid #e5ddd0;
	}

	.btn-zur-liste {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #2c4a1e;
		background: #f3f8f1;
		border: 1.5px solid #9dc495;
		border-radius: 9px;
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		width: 100%;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.btn-zur-liste:hover:not(:disabled) {
		background: #e6f3e4;
		border-color: #4a7c3f;
	}

	.btn-zur-liste:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.einkauf-meldung {
		margin: 0.75rem 1.4rem;
	}

	/* Instructions card */
	.sektion-titel {
		font-family: 'Lora', serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #2c4a1e;
		margin-bottom: 0.75rem;
	}

	.anleitung-karte {
		background: #fdf8f0;
		border: 1.5px solid #ddd5c5;
		border-radius: 14px;
		padding: 1.4rem 1.6rem;
	}

	.anleitung-text {
		white-space: pre-wrap;
		line-height: 1.9;
		font-size: 0.95rem;
		color: #2d2d2b;
		margin: 0;
	}

	/* ── Action bar ─────────────────────────────────────────────────────────── */
	.rezept-aktionen {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid #e5ddd0;
	}

	.btn-bearbeiten {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #4a7c3f;
		background: transparent;
		border: 1.5px solid #9dc495;
		border-radius: 8px;
		padding: 0.6rem 1.4rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.btn-bearbeiten:hover {
		background: rgba(74, 124, 63, 0.07);
		border-color: #4a7c3f;
	}

	.btn-loeschen {
		font-family: 'Outfit', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #c0392b;
		background: transparent;
		border: 1.5px solid #e8a89e;
		border-radius: 8px;
		padding: 0.6rem 1.4rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.btn-loeschen:hover {
		background: #fdf2f0;
		border-color: #c0392b;
	}

	/* ── Edit mode ──────────────────────────────────────────────────────────── */
	.link-btn {
		background: none;
		border: none;
		color: #6b6255;
		font-size: 0.875rem;
		font-family: 'Outfit', sans-serif;
		cursor: pointer;
		padding: 0;
		margin-top: 0.3rem;
	}

	.link-btn:hover {
		color: #2c4a1e;
		text-decoration: underline;
	}
</style>
