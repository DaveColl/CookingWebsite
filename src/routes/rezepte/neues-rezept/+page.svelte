<script>
	import RezeptFormular from '$lib/components/RezeptFormular.svelte';
	let { form } = $props();
</script>

<div class="seite-kopf">
	<h1 class="seite-titel">Neues Rezept</h1>
	<p class="seite-unter">Füge ein neues Rezept zu deiner Sammlung hinzu.</p>
</div>

<RezeptFormular
	action="?/create"
	{form}
/>
