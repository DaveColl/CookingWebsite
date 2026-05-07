<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Rezeptbuch</title>
</svelte:head>

<div class="hub">
	<header class="hub-header">
		<h1 class="hub-titel">Rezeptbuch</h1>
		<p class="hub-unter">Deine Küchen-Zentrale</p>
	</header>

	<div class="hub-karten">
		<a href={resolve('/rezepte')} class="hub-karte">
			<span class="hub-icon">📖</span>
			<span class="hub-label">Rezepte</span>
			<span class="hub-beschr">Alle Rezepte ansehen, hinzufügen und bearbeiten</span>
		</a>
		<a href={resolve('/einkauf')} class="hub-karte">
			<span class="hub-icon">🛒</span>
			<span class="hub-label">Einkaufsliste</span>
			<span class="hub-beschr">Gemeinsam einkaufen – Echtzeit-Synchronisation</span>
		</a>
		<a href={resolve('/aufgaben')} class="hub-karte">
			<span class="hub-icon">🧹</span>
			<span class="hub-label">Aufgaben</span>
			<span class="hub-beschr">Wöchentlicher Haushaltsplaner mit Wiederholungen</span>
		</a>
	</div>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: 'Outfit', sans-serif;
		background: #f4f1eb;
		color: #1a1a18;
		line-height: 1.65;
		min-height: 100vh;
	}

	.hub {
		min-height: calc(100vh - 62px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		gap: 3rem;
	}

	.hub-header {
		text-align: center;
	}

	.hub-titel {
		font-family: 'Lora', serif;
		font-size: clamp(2.2rem, 6vw, 3.5rem);
		font-weight: 700;
		color: #2c4a1e;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: 0.5rem;
	}

	.hub-unter {
		font-size: 1rem;
		color: #8a7d6e;
		font-weight: 300;
	}

	.hub-karten {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 900px;
		width: 100%;
	}

	.hub-karte {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		background: #fdfaf4;
		border: 1.5px solid #e5ddd0;
		border-radius: 20px;
		padding: 2.5rem 2rem;
		text-decoration: none;
		color: inherit;
		flex: 1;
		min-width: 200px;
		max-width: 270px;
		text-align: center;
		transition:
			box-shadow 0.2s,
			transform 0.2s,
			border-color 0.2s;
	}

	.hub-karte:hover {
		box-shadow: 0 12px 36px rgba(44, 74, 30, 0.12);
		transform: translateY(-3px);
		border-color: #9dc495;
	}

	.hub-icon {
		font-size: 2.5rem;
		line-height: 1;
	}

	.hub-label {
		font-family: 'Lora', serif;
		font-size: 1.3rem;
		font-weight: 700;
		color: #2c4a1e;
	}

	.hub-beschr {
		font-size: 0.85rem;
		color: #8a7d6e;
		font-weight: 300;
		line-height: 1.5;
	}

	@media (max-width: 600px) {
		.hub-karten {
			flex-direction: column;
			align-items: stretch;
		}
		.hub-karte {
			max-width: 100%;
		}
		.hub {
			padding: 2rem 1.25rem;
			gap: 2rem;
		}
	}
</style>
