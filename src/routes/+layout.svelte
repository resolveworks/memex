<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SessionSidebar from '$lib/SessionSidebar.svelte';
	import { chat } from '$lib/chat.svelte';
	import { i18n, languages, languageName, setLocale, t } from '$lib/i18n.svelte';

	let { children } = $props();

	let drawerOpen = $state(false);

	function newChat(event: MouseEvent) {
		if (chat.busy) event.preventDefault();
	}

	$effect(() => {
		document.documentElement.lang = i18n.locale;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header>
		<button
			class="menu"
			aria-label={t('nav.openSessions')}
			aria-expanded={drawerOpen}
			onclick={() => (drawerOpen = true)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
		</button>
		<a class="title" href="/" onclick={newChat}>Memex</a>
		<select
			class="language"
			aria-label={t('nav.language')}
			value={i18n.locale}
			onchange={(event) => setLocale(event.currentTarget.value)}
		>
			{#each languages as code (code)}
				<option value={code}>{languageName(code)}</option>
			{/each}
		</select>
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
		color: #1a1a1a;
		text-decoration: none;
	}

	.language {
		margin-left: auto;
		font: inherit;
		padding: 0.25rem;
		border: 1px solid #d0d0d4;
		border-radius: 0.5rem;
		background: #fff;
		color: #1a1a1a;
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>
