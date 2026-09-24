<!-- src/routes/nachtisch/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import RezeptListe from '$lib/components/RezeptListe.svelte';

	let { data }: { data: PageData } = $props();
</script>

<RezeptListe
	rezepte={data.rezepte}
	kategorie="nachtisch"
/>
