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
		<a
			href={resolve('/rezepte')}
			class="hub-karte"
		>
			<span class="hub-icon">🍲</span>
			<span class="hub-label">Mittagessen</span>
			<span class="hub-beschr">Hauptgerichte ansehen, hinzufügen und bearbeiten</span>
		</a>
		<a
			href={resolve('/nachtisch')}
			class="hub-karte"
		>
			<span class="hub-icon">🍰</span>
			<span class="hub-label">Nachtisch</span>
			<span class="hub-beschr">Süßes und Desserts ansehen, hinzufügen und bearbeiten</span>
		</a>
		<a
			href={resolve('/einkauf')}
			class="hub-karte"
		>
			<span class="hub-icon">🛒</span>
			<span class="hub-label">Einkaufsliste</span>
			<span class="hub-beschr">Gemeinsam einkaufen – Echtzeit-Synchronisation</span>
		</a>
		<a
			href={resolve('/aufgaben')}
			class="hub-karte"
		>
			<span class="hub-icon">🧹</span>
			<span class="hub-label">Aufgaben</span>
			<span class="hub-beschr">Wöchentlicher Haushaltsplaner mit Wiederholungen</span>
		</a>
	</div>
</div>

<style>
	.hub {
		min-height: calc(100vh - var(--nav-hoehe));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--abstand-7) var(--abstand-6);
		gap: var(--abstand-7);
	}

	.hub-header {
		text-align: center;
	}

	.hub-titel {
		font-family: var(--schrift-titel);
		font-size: var(--text-seite);
		font-weight: 700;
		color: var(--farbe-primaer);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin-bottom: var(--abstand-2);
	}

	.hub-unter {
		font-size: var(--text-basis);
		color: var(--farbe-text-3);
		font-weight: 300;
	}

	/* Vier Kacheln: 2×2 auf Tablet/Desktop, einspaltig ab 600px */
	.hub-karten {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--abstand-5);
		max-width: 620px;
		width: 100%;
	}

	.hub-karte {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--abstand-2);
		background: var(--farbe-flaeche);
		border: 1.5px solid var(--farbe-rand);
		border-radius: var(--radius-l);
		padding: var(--abstand-6);
		text-decoration: none;
		color: inherit;
		min-width: 0;
		text-align: center;
		transition:
			box-shadow var(--dauer-schnell) var(--kurve),
			transform var(--dauer-schnell) var(--kurve),
			border-color var(--dauer-schnell) var(--kurve);
	}

	@media (hover: hover) {
		.hub-karte:hover {
			box-shadow: var(--schatten-m);
			transform: translateY(-2px);
			border-color: var(--farbe-akzent-hell);
		}
	}

	/* Emoji-Icon: Bildgröße, keine Schriftstufe */
	.hub-icon {
		font-size: 2.5rem;
		line-height: 1;
	}

	.hub-label {
		font-family: var(--schrift-titel);
		font-size: var(--text-abschnitt);
		font-weight: 700;
		color: var(--farbe-primaer);
	}

	.hub-beschr {
		font-size: var(--text-klein);
		color: var(--farbe-text-3);
		font-weight: 300;
		line-height: 1.5;
	}

	@media (max-width: 600px) {
		.hub-karten {
			grid-template-columns: 1fr;
		}
		.hub {
			padding: var(--abstand-6) var(--abstand-4);
			gap: var(--abstand-6);
		}
	}
</style>
