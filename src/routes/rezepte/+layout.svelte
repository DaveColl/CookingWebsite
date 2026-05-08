<script lang="ts">
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		max-width: 820px;
		margin: 0 auto;
		padding: 3rem 2rem 6rem;
	}

	@media (max-width: 600px) {
		main {
			padding: 2rem 1.25rem 5rem;
		}
	}

	@media (max-width: 375px) {
		main {
			padding: 1.5rem 1rem 4rem;
		}
	}
</style>
