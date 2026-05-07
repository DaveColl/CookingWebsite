<!-- src/lib/components/Nav.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let menuOffen = $state(false);
</script>

<nav>
	<a class="logo" href={resolve('/')}>Rezeptbuch</a>
	<button
		class="hamburger"
		class:aktiv={menuOffen}
		onclick={() => (menuOffen = !menuOffen)}
		aria-label="Menü öffnen"
		aria-expanded={menuOffen}
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
				class:aktiv={$page.url.pathname.startsWith('/rezepte') && $page.url.pathname !== '/rezepte/neues-rezept'}
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
	</ul>
</nav>

<!-- Separate wrapper handles the slide animation so overflow:hidden never clips ul children -->
<div class="menu-schublade" class:offen={menuOffen} aria-hidden={!menuOffen}>
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
				class:aktiv={$page.url.pathname.startsWith('/rezepte') && $page.url.pathname !== '/rezepte/neues-rezept'}
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
	</ul>
</div>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: #fdfaf4;
		border-bottom: 1px solid #e5ddd0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2.5rem;
		height: 62px;
	}

	.logo {
		font-family: 'Lora', serif;
		font-size: 1.35rem;
		font-weight: 700;
		color: #2c4a1e;
		text-decoration: none;
	}

	.hamburger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.4rem;
	}

	.hamburger span {
		display: block;
		width: 22px;
		height: 2px;
		background: #2c4a1e;
		border-radius: 2px;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
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
		gap: 0.25rem;
	}

	ul a {
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b6255;
		text-decoration: none;
		padding: 0.4rem 0.9rem;
		border-radius: 8px;
		transition:
			background 0.15s,
			color 0.15s;
	}

	ul a:hover {
		background: #ede7dc;
		color: #2c4a1e;
	}

	ul a.aktiv {
		background: #2c4a1e;
		color: #fdfaf4;
	}

	/* Mobile drawer — hidden on desktop */
	.menu-schublade {
		display: none;
	}

	@media (max-width: 600px) {
		.hamburger {
			display: flex;
		}

		/* Hide the desktop ul inside <nav> */
		nav ul {
			display: none;
		}

		nav {
			padding: 0 1.25rem;
		}

		/* Animated drawer */
		.menu-schublade {
			display: block;
			position: sticky;
			top: 62px;
			z-index: 49;
			background: #fdfaf4;
			border-bottom: 1px solid #e5ddd0;
			/* Animation via max-height on the outer wrapper */
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.3s ease;
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
			gap: 0.25rem;
			padding: 0.75rem 1.25rem;
		}

		.menu-liste a {
			display: block;
			font-size: 1rem;
			font-weight: 500;
			color: #6b6255;
			text-decoration: none;
			padding: 0.65rem 0.9rem;
			border-radius: 8px;
			transition:
				background 0.15s,
				color 0.15s;
		}

		.menu-liste a:hover {
			background: #ede7dc;
			color: #2c4a1e;
		}

		.menu-liste a.aktiv {
			background: #2c4a1e;
			color: #fdfaf4;
		}
	}

	@media (max-width: 375px) {
		nav {
			padding: 0 1rem;
		}

		.menu-liste {
			padding: 0.75rem 1rem;
		}
	}
</style>
