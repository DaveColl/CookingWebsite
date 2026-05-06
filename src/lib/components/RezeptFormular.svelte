<script lang="ts">
	// 1. Typ-Definitionen statt Import aus ./$types
	interface RezeptWerte {
		titel?: string;
		portionen?: number | string;
		zubereitungszeit?: number | string;
		anleitung?: string;
	}

	interface FormularProps {
		action: string; // Erwartet "?/create" oder "?/update"
		form?: { erfolg?: boolean; message?: string; werte?: RezeptWerte } | null;
		startWerte?: RezeptWerte | null; // Für das Bearbeiten bestehender Rezepte
	}

	// 2. Props empfangen
	let { action, form, startWerte }: FormularProps = $props();
</script>

<!-- Fehlermeldungen vom Server -->
{#if form?.erfolg === false}
	<p class="error-text">{form.message}</p>
{/if}

<!-- Erfolgsmeldungen vom Server -->
{#if form?.erfolg}
	<p class="success-text">Rezept wurde gespeichert!</p>
{/if}

<!-- 3. action ist jetzt dynamisch {action} -->
<form
	class="recipe_change"
	{action}
	method="POST"
>
	<!-- 4. value prüft zuerst startWerte, dann form.werte, dann Fallback zu '' -->
	<input
		type="text"
		name="titel"
		value={startWerte?.titel ?? form?.werte?.titel ?? ''}
		placeholder="Rezepttitel"
		required
	/>

	<input
		type="number"
		name="portionen"
		min="1"
		value={startWerte?.portionen ?? form?.werte?.portionen ?? ''}
		placeholder="Portionen"
		required
	/>

	<input
		type="number"
		name="zubereitungszeit"
		min="1"
		value={startWerte?.zubereitungszeit ?? form?.werte?.zubereitungszeit ?? ''}
		placeholder="Zubereitungszeit"
		required
	/>

	<textarea
		name="anleitung"
		value={startWerte?.anleitung ?? form?.werte?.anleitung ?? ''}
		placeholder="Anleitung"
		required
	></textarea>

	<button type="submit">Speichern</button>
</form>
