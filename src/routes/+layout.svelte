<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { chat } from '$lib/chat.svelte';
	import { i18n, languages, languageName, setLocale, t } from '$lib/i18n.svelte';

	let { children } = $props();

	function newMemex(event: MouseEvent) {
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
		<a class="title" href="/" onclick={newMemex}>Memex</a>
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
		{#if page.params.id}
			<a class="settings" href={`/${page.params.id}/settings`} aria-label={t('nav.settings')}>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<path
						d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
					/>
					<circle cx="12" cy="12" r="3" />
				</svg>
			</a>
		{/if}
	</header>
	<main>
		{@render children()}
	</main>
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

	.language {
		margin-left: auto;
		font: inherit;
		padding: 0.25rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--ink);
	}

	.settings {
		display: flex;
		padding: 0.5rem;
		color: var(--ink);
	}

	.settings:hover {
		color: var(--accent);
	}

	.settings svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>
