<!-- src/lib/components/Nav.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let menuOffen = $state(false);
	let hamburgerKnopf: HTMLButtonElement | undefined = $state();
	let schublade: HTMLDivElement | undefined = $state();

	function beiTaste(e: KeyboardEvent) {
		if (e.key !== 'Escape' || !menuOffen) return;
		const fokusInSchublade = schublade?.contains(document.activeElement) ?? false;
		menuOffen = false;
		// Fokus nicht im nun inerten Menü verlieren lassen
		if (fokusInSchublade) hamburgerKnopf?.focus();
	}
</script>

<svelte:window onkeydown={beiTaste} />

<nav>
	<a
		class="logo"
		href={resolve('/')}>Rezeptbuch</a
	>
	<button
		class="hamburger"
		class:aktiv={menuOffen}
		bind:this={hamburgerKnopf}
		onclick={() => (menuOffen = !menuOffen)}
		aria-label={menuOffen ? 'Menü schließen' : 'Menü öffnen'}
		aria-expanded={menuOffen}
		aria-controls="menu-schublade"
	>
		<span></span><span></span><span></span>
	</button>
	<ul>
		<li>
			<a
				href={resolve('/')}
				class:aktiv={$page.url.pathname === '/'}
				onclick={() => (menuOffen = false)}>Startseite</a
			>
		</li>
		<li>
			<a
				href={resolve('/rezepte')}
				class:aktiv={$page.url.pathname.startsWith('/rezepte') &&
					$page.url.pathname !== '/rezepte/neues-rezept'}
				onclick={() => (menuOffen = false)}>Alle Rezepte</a
			>
		</li>
		<li>
			<a
				href={resolve('/rezepte/neues-rezept')}
				class:aktiv={$page.url.pathname === '/rezepte/neues-rezept'}
				onclick={() => (menuOffen = false)}>+ Neues Rezept</a
			>
		</li>
		<li>
			<a
				href={resolve('/einkauf')}
				class:aktiv={$page.url.pathname.startsWith('/einkauf')}
				onclick={() => (menuOffen = false)}>Einkaufsliste</a
			>
		</li>
		<li>
			<a
				href={resolve('/aufgaben')}
				class:aktiv={$page.url.pathname.startsWith('/aufgaben')}
				onclick={() => (menuOffen = false)}>Aufgaben</a
			>
		</li>
	</ul>
</nav>

<!-- Separate wrapper handles the slide animation so overflow:hidden never clips ul children -->
<!-- inert solange geschlossen: Links weder fokussierbar noch klickbar -->
<div
	id="menu-schublade"
	class="menu-schublade"
	class:offen={menuOffen}
	bind:this={schublade}
	inert={!menuOffen}
>
	<ul class="menu-liste">
		<li>
			<a
				href={resolve('/')}
				class:aktiv={$page.url.pathname === '/'}
				onclick={() => (menuOffen = false)}>Startseite</a
			>
		</li>
		<li>
			<a
				href={resolve('/rezepte')}
				class:aktiv={$page.url.pathname.startsWith('/rezepte') &&
					$page.url.pathname !== '/rezepte/neues-rezept'}
				onclick={() => (menuOffen = false)}>Alle Rezepte</a
			>
		</li>
		<li>
			<a
				href={resolve('/rezepte/neues-rezept')}
				class:aktiv={$page.url.pathname === '/rezepte/neues-rezept'}
				onclick={() => (menuOffen = false)}>+ Neues Rezept</a
			>
		</li>
		<li>
			<a
				href={resolve('/einkauf')}
				class:aktiv={$page.url.pathname.startsWith('/einkauf')}
				onclick={() => (menuOffen = false)}>Einkaufsliste</a
			>
		</li>
		<li>
			<a
				href={resolve('/aufgaben')}
				class:aktiv={$page.url.pathname.startsWith('/aufgaben')}
				onclick={() => (menuOffen = false)}>Aufgaben</a
			>
		</li>
	</ul>
</div>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--farbe-flaeche);
		border-bottom: 1px solid var(--farbe-rand);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--abstand-6);
		height: var(--nav-hoehe);
	}

	.logo {
		font-family: var(--schrift-titel);
		font-size: var(--text-abschnitt);
		font-weight: 700;
		color: var(--farbe-primaer);
		text-decoration: none;
	}

	.hamburger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		border-radius: var(--radius-m);
		cursor: pointer;
		padding: 0;
	}

	/* Strich-Geometrie (22×2px, 5px Abstand) ist Icon-Maß, keine Token-Stufe */
	.hamburger span {
		display: block;
		width: 22px;
		height: 2px;
		background: var(--farbe-primaer);
		border-radius: var(--radius-rund);
		transition:
			transform var(--dauer-mittel) var(--kurve),
			opacity var(--dauer-mittel) var(--kurve);
		transform-origin: center;
	}

	.hamburger.aktiv span:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}
	.hamburger.aktiv span:nth-child(2) {
		opacity: 0;
		transform: scaleX(0);
	}
	.hamburger.aktiv span:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	/* Desktop: horizontal nav list inside <nav> */
	ul {
		list-style: none;
		display: flex;
		gap: var(--abstand-1);
	}

	ul a {
		font-size: var(--text-klein);
		font-weight: 500;
		color: var(--farbe-text-2);
		text-decoration: none;
		padding: var(--abstand-2) var(--abstand-4);
		border-radius: var(--radius-m);
		transition:
			background var(--dauer-schnell) var(--kurve),
			color var(--dauer-schnell) var(--kurve);
	}

	@media (hover: hover) {
		ul a:hover {
			background: var(--farbe-flaeche-2);
			color: var(--farbe-primaer);
		}
	}

	ul a.aktiv {
		background: var(--farbe-primaer);
		color: var(--farbe-flaeche);
	}

	/* Touch-Geräte (z. B. Tablet 768px): Nav-Links mindestens 44px hoch */
	@media (pointer: coarse) {
		nav ul a {
			display: inline-flex;
			align-items: center;
			min-height: 44px;
		}
	}

	/* Mobile drawer — hidden on desktop */
	.menu-schublade {
		display: none;
	}

	@media (max-width: 600px) {
		/* Tap-Fläche 44×44, Striche bleiben 22px breit und zentriert.
		   Negativer Rand hält die Striche optisch an der alten Position. */
		.hamburger {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 44px;
			height: 44px;
			margin-right: calc(-1 * var(--abstand-1));
			flex-shrink: 0;
		}

		/* Hide the desktop ul inside <nav> */
		nav ul {
			display: none;
		}

		nav {
			padding: 0 var(--abstand-4);
		}

		/* Animated drawer */
		.menu-schublade {
			display: block;
			position: sticky;
			top: var(--nav-hoehe);
			z-index: 49;
			background: var(--farbe-flaeche);
			border-bottom: 1px solid var(--farbe-rand);
			/* Animation via max-height on the outer wrapper */
			max-height: 0;
			overflow: hidden;
			transition: max-height var(--dauer-mittel) var(--kurve);
		}

		.menu-schublade.offen {
			max-height: 400px;
		}

		/* Inner list has its own padding — not clipped by overflow:hidden above
		   because the list itself has no overflow, only the wrapper does */
		.menu-liste {
			list-style: none;
			display: flex;
			flex-direction: column;
			gap: var(--abstand-1);
			padding: var(--abstand-3) var(--abstand-4);
		}

		.menu-liste a {
			display: block;
			font-size: var(--text-basis);
			font-weight: 500;
			color: var(--farbe-text-2);
			text-decoration: none;
			padding: var(--abstand-3) var(--abstand-4);
			border-radius: var(--radius-m);
			transition:
				background var(--dauer-schnell) var(--kurve),
				color var(--dauer-schnell) var(--kurve);
		}

		@media (hover: hover) {
			.menu-liste a:hover {
				background: var(--farbe-flaeche-2);
				color: var(--farbe-primaer);
			}
		}

		.menu-liste a.aktiv {
			background: var(--farbe-primaer);
			color: var(--farbe-flaeche);
		}
	}
</style>
