<script lang="ts">
	import type { ActionData } from './$types';
	import RezeptFormular from '$lib/components/RezeptFormular.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Neues Rezept anlegen</h1>

<!-- Formular aufrufen und die Parameter übergeben -->
<RezeptFormular
	action="?/create"
	{form}
/>
