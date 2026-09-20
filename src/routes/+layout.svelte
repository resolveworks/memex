<script lang="ts">
	import { goto } from '$app/navigation';
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
		<button class="settings" onclick={() => goto('/settings')}>
			<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<path
					d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				/>
				<circle cx="12" cy="12" r="3" />
			</svg>
			{t('nav.settings')}
		</button>
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

	.settings {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
		font: inherit;
		padding: 0.25rem 0.5rem;
		border: 1px solid #d0d0d4;
		border-radius: 0.5rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
	}

	.settings svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.settings:hover {
		color: #1a73e8;
	}

	.language {
		margin-left: 0.25rem;
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
