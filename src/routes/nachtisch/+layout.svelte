<script lang="ts">
	import InhaltsRahmen from '$lib/components/InhaltsRahmen.svelte';

	let { children } = $props();
</script>

<InhaltsRahmen>
	{@render children()}
</InhaltsRahmen>
