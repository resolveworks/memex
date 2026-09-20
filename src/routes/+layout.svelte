<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { chat } from '$lib/chat.svelte';
	import { i18n, languages, languageName, setLocale, t } from '$lib/i18n.svelte';
	import { getMemexes } from '$lib/memexes.svelte';
	import Sidebar from '$lib/Sidebar.svelte';

	let { children } = $props();

	let drawerOpen = $state(false);

	// The logo returns to the selected memex, never the create page.
	const home = $derived(
		page.data.memex ? `/${page.data.memex.id}` : getMemexes()[0] ? `/${getMemexes()[0].id}` : '/'
	);

	function follow(event: MouseEvent) {
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
			aria-label={t('sidebar.open')}
			aria-expanded={drawerOpen}
			onclick={() => (drawerOpen = true)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
		</button>
		<a class="title" href={home} onclick={follow}>{page.data.memex?.title ?? "Memex"}</a>
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
	<Sidebar open={drawerOpen} onclose={() => (drawerOpen = false)} />
</div>

<style>
	:global(:root) {
		--font-sans: 'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		--bg: #f5f2ec;
		--surface: #ffffff;
		--ink: #23211d;
		--ink-soft: #4d473e;
		--muted: #6f675c;
		--line: #e6e0d5;
		--line-strong: #d6cec0;
		--fill: #ede8df;
		--accent: #2f5d50;
		--accent-hover: #264c41;
		--accent-ink: #ffffff;
		--danger: #b4442f;
	}

	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	:global(body) {
		background: var(--bg);
		color: var(--ink);
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		color: var(--ink);
		background: var(--bg);
		font-family: var(--font-sans);
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
		padding: 0.375rem 0.5rem;
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}

	.title {
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--ink);
		text-decoration: none;
	}

	.title:hover {
		color: var(--accent);
	}

	.menu {
		display: flex;
		padding: 0.5rem;
		border: none;
		background: none;
		color: var(--ink);
		cursor: pointer;
	}

	.menu svg line {
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.language {
		font: inherit;
		margin-left: auto;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--ink);
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>
