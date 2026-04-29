<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<!-- If the server returned { success: false, message: '...' } -->
{#if form?.eingabefehler === true}
	<p class="error-text">{form.message}</p>
{/if}

<!-- If the server returned { success: true } -->
{#if form?.success === true}
	<p class="success-text">Recipe saved successfully!</p>
{/if}

<form class="create_recipe" action="?/create" method="POST">
	<!-- -- class is for css and action for svelte action catcher-->
	<input type="text" name="titel" value={form?.werte?.titel ?? ''} />
	<!-- -- checkt ob der wert titel gegeben wurde ??(wenn nicht) dann platzier einen leeren String -->
	<input type="number" name="portionen" value={form?.werte?.portionen ?? ''} />
	<input type="number" name="zubereitungszeit" value={form?.werte?.zubereitungszeit ?? ''} />
	<textarea name="anleitung" value={form?.werte?.anleitung ?? ''}></textarea>
	<button type="submit">Speichern</button>
</form>
