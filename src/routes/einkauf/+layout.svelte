<!-- src/routes/einkauf/+layout.svelte -->
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

	:global(.seite-kopf) {
		margin-bottom: 2.5rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5ddd0;
	}
	:global(.seite-titel) {
		font-family: 'Lora', serif;
		font-size: clamp(1.9rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #2c4a1e;
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin-bottom: 0.35rem;
	}
	:global(.seite-unter) {
		font-size: 0.95rem;
		color: #6b6255;
		font-weight: 300;
	}
	:global(.meldung-fehler) {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid #f0c0c0;
		border-left: 4px solid #c0392b;
		background: #fdf5f5;
		color: #8b2020;
		font-size: 0.9rem;
	}
	:global(.meldung-erfolg) {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid #b8d8b8;
		border-left: 4px solid #2c4a1e;
		background: #f3f8f1;
		color: #2c4a1e;
		font-size: 0.9rem;
	}
	:global(input[type='text']),
	:global(input[type='number']),
	:global(textarea),
	:global(select) {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		color: #1a1a18;
		background: #fdfaf4;
		border: 1.5px solid #ddd5c5;
		border-radius: 10px;
		padding: 0.7rem 0.95rem;
		width: 100%;
		outline: none;
		appearance: none;
		transition:
			border-color 0.18s,
			box-shadow 0.18s;
	}
	:global(input:focus),
	:global(textarea:focus),
	:global(select:focus) {
		border-color: #4a7c3f;
		box-shadow: 0 0 0 3px rgba(74, 124, 63, 0.13);
	}
	:global(input::placeholder),
	:global(textarea::placeholder) {
		color: #c4bab0;
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
