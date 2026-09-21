<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { chat } from '$lib/chat.svelte';
	import { t } from '$lib/i18n.svelte';
	import { forget, getMemexes, remember } from '$lib/memexes.svelte';
	import Header from '$lib/components/Header.svelte';
	import Select from '$lib/components/Select.svelte';

	let { children } = $props();

	// Every memex we open joins the switcher, most recent first; a 404 means it is gone.
	afterNavigate(() => {
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

	const memexOptions = $derived(memexes.map((memex) => ({ value: memex.id, label: memex.title })));
	const memexActions = $derived([{ href: '/', label: t('nav.new') }]);

	function switchMemex(id: string) {
		if (id === (page.params.id ?? '')) return;
		goto(`/${id}`);
	}

	// The brand points at the active memex, or the create page when there is none.
	const home = $derived(page.data.memex ? `/${page.data.memex.id}` : '/');

	function follow(event: MouseEvent) {
		if (chat.busy) event.preventDefault();
	}
</script>

<div class="app">
	<Header>
		<a class="title" href={home} onclick={follow}>Memex</a>
		<Select
			label={t('nav.memexes')}
			value={page.params.id ?? ''}
			options={memexOptions}
			actions={memexActions}
			placeholder={t('nav.new')}
			onchange={switchMemex}
			disabled={chat.busy}
		/>
		<div class="actions">
			{#if page.params.id}
				<a
					class="icon center"
					href={`/${page.params.id}/memories`}
					aria-label={t('memories.heading')}
					onclick={follow}
				>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
						<ellipse cx="12" cy="5" rx="9" ry="3" />
						<path d="M3 5v14a9 3 0 0 0 18 0V5" />
						<path d="M3 12a9 3 0 0 0 18 0" />
					</svg>
				</a>
				<a
					class="icon center"
					href={`/${page.params.id}/requests`}
					aria-label={t('requests.heading')}
					onclick={follow}
				>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				</a>
				<a
					class="icon center"
					href={`/${page.params.id}/settings`}
					aria-label={t('settings.memexHeading')}
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
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		block-size: 100dvh;
	}

	.title {
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}

	.title:hover {
		color: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		flex-shrink: 0;
		justify-content: flex-end;
		gap: var(--space-1);
		margin-inline-start: auto;
	}

	.icon {
		flex: none;
		inline-size: 2.25rem;
		block-size: 2.25rem;
		border-radius: var(--radius);
		color: var(--ink);
	}

	.icon:hover:not(:disabled) {
		background: var(--fill);
	}

	.icon:disabled {
		opacity: 0.5;
		cursor: default;
	}

	main {
		min-inline-size: 0;
		min-block-size: 0;
		overflow-y: auto;
	}
</style>
