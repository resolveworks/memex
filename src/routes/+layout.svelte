<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SessionSidebar from '$lib/SessionSidebar.svelte';

	let { children } = $props();

	let drawerOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header>
		<button
			class="menu"
			aria-label="Open sessions"
			aria-expanded={drawerOpen}
			onclick={() => (drawerOpen = true)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
		</button>
		<span class="title">Memex</span>
		<a class="settings" href="/settings">Settings</a>
	</header>
	<main>
		{@render children()}
	</main>
	<SessionSidebar open={drawerOpen} onclose={() => (drawerOpen = false)} />
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
		padding: 0.375rem 0.5rem;
		border-bottom: 1px solid #e2e2e4;
		background: #fff;
	}

	.menu {
		display: flex;
		padding: 0.5rem;
		border: none;
		background: none;
		color: #1a1a1a;
		cursor: pointer;
	}

	.menu svg line {
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.title {
		font-weight: 600;
	}

	.settings {
		margin-left: auto;
		padding: 0.5rem;
		color: #1a1a1a;
		text-decoration: none;
	}

	.settings:hover {
		color: #1a73e8;
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>
