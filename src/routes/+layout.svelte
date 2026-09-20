<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { chat } from '$lib/chat.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { forget, getMemexes, remember } from '$lib/memexes.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/Sidebar.svelte';

	let { children } = $props();

	let drawerOpen = $state(false);

	// Every memex we open joins the switcher, most recent first; a 404 means it is gone.
	$effect(() => {
		const current = page.data.memex;
		if (current) remember({ id: current.id, title: current.title });
		else if (page.status === 404 && page.params.id) forget(page.params.id);
	});

	// The current memex is selectable even before the effect has recorded it.
	const memexes = $derived.by(() => {
		const known = getMemexes();
		const current = page.data.memex;
		if (current && !known.some((memex) => memex.id === current.id)) {
			return [{ id: current.id, title: current.title }, ...known];
		}
		return known;
	});

	function switchMemex(event: Event) {
		const id = (event.currentTarget as HTMLSelectElement).value;
		if (id === page.params.id) return;
		goto(`/${id}`);
	}

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
	<Header>
		<button
			class="menu"
			aria-label={drawerOpen ? t('sidebar.close') : t('sidebar.open')}
			aria-expanded={drawerOpen}
			onclick={() => (drawerOpen = !drawerOpen)}
		>
			{#if drawerOpen}
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
					<line x1="5" y1="5" x2="19" y2="19" />
					<line x1="19" y1="5" x2="5" y2="19" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			{/if}
		</button>
		<label class="switcher">
			<select
				aria-label={t('sidebar.memexes')}
				value={page.params.id}
				onchange={switchMemex}
				disabled={chat.busy}
			>
				{#each memexes as memex (memex.id)}
					<option value={memex.id}>{memex.title}</option>
				{/each}
			</select>
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path d="m6 9 6 6 6-6" />
			</svg>
		</label>
		<div class="actions">
			{#if page.params.id}
				<a
					class="icon"
					href={`/${page.params.id}/settings`}
					aria-label={t('settings.heading')}
					onclick={follow}
				>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
						<path
							d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
						/>
						<circle cx="12" cy="12" r="3" />
					</svg>
				</a>
			{/if}
		</div>
	</Header>
	<div class="body">
		<Sidebar open={drawerOpen} onclose={() => (drawerOpen = false)} />
		<main>
			{@render children()}
		</main>
	</div>
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

		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 0.75rem;
		--space-4: 1rem;
		--space-6: 1.5rem;

		--radius-sm: 0.375rem;
		--radius: 0.5rem;
		--radius-lg: 0.75rem;
		--radius-full: 999px;
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

	.body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.switcher {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: 0;
	}

	.switcher select {
		appearance: none;
		min-width: 0;
		max-width: min(60vw, 24rem);
		padding: 0 1.5rem 0 0;
		border: none;
		background: none;
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.switcher select:hover:not(:disabled) {
		color: var(--accent);
	}

	.switcher select:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.switcher svg {
		position: absolute;
		right: 0;
		color: var(--muted);
		pointer-events: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.menu {
		display: flex;
		padding: var(--space-2);
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

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-left: auto;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: var(--radius);
		background: none;
		color: var(--ink);
		cursor: pointer;
	}

	.icon:hover:not(:disabled) {
		background: var(--fill);
	}

	.icon:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.icon svg {
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

	@media (min-width: 48rem) {
		.menu {
			display: none;
		}
	}
</style>
