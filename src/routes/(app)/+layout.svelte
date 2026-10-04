<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { chat } from '$lib/chat.svelte';
	import { t } from '$lib/i18n';
	import AppShell from '$lib/components/AppShell.svelte';

	let { children } = $props();

	// The current memex is selectable even on the request that first records it.
	const memexes = $derived.by(() => {
		const known = page.data.memexes;
		const current = page.data.memex;
		if (current && !known.some((memex) => memex.id === current.id)) {
			return [{ id: current.id, title: current.title }, ...known];
		}
		return known;
	});

	const memexOptions = $derived(memexes.map((memex) => ({ value: memex.id, label: memex.title })));
	const memexActions = $derived([{ href: resolve('/'), label: t('nav.new') }]);

	function switchMemex(id: string) {
		if (id === page.params.id) return;
		goto(resolve(`/${id}`));
	}

	function follow(event: MouseEvent) {
		if (chat.busy) event.preventDefault();
	}
</script>

<AppShell
	home={page.data.memex ? resolve(`/${page.data.memex.id}`) : resolve('/')}
	value={page.params.id ?? ''}
	options={memexOptions}
	actions={memexActions}
	disabled={chat.busy}
	onchange={switchMemex}
	onhomeclick={follow}
>
	{#snippet toolbar()}
		<a
			class="icon center"
			href={resolve(`/${page.params.id}/contents`)}
			aria-label={t('contents.heading')}
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
			href={resolve(`/${page.params.id}/settings`)}
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
	{/snippet}
	{@render children()}
</AppShell>

<style>
	.icon {
		position: relative;
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
</style>
