<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SessionSidebar from '$lib/SessionSidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<SessionSidebar />
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	.app {
		display: flex;
		height: 100dvh;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	main {
		flex: 1;
		min-width: 0;
	}
</style>
