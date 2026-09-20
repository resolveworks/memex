<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { chat, selectRequest } from "$lib/chat.svelte";
	import { t } from "$lib/i18n.svelte";
	import { getMemexes, remember } from "$lib/memexes.svelte";
	import type { Request as MemexRequest } from "$lib/request";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	// Every memex we open joins the switcher, most recent first.
	$effect(() => {
		const current = page.data.memex;
		if (current) remember({ id: current.id, title: current.title });
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

	function newMemex() {
		onclose();
		goto("/");
	}

	function switchMemex(event: Event) {
		const id = (event.currentTarget as HTMLSelectElement).value;
		if (id === page.params.id) return;
		onclose();
		goto(`/${id}`);
	}

	function follow(event: MouseEvent) {
		if (chat.busy) {
			event.preventDefault();
			return;
		}
		onclose();
	}

	// Drop the open request once the agent closes it and the list refreshes.
	$effect(() => {
		const requests = page.data.requests;
		const selected = chat.request;
		if (requests && selected && !requests.some((request: MemexRequest) => request.id === selected.id)) {
			chat.request = undefined;
		}
	});
</script>

{#if open}
	<button class="scrim" aria-label={t("sidebar.close")} onclick={onclose}></button>
{/if}

<aside class:open inert={!open}>
	<div class="head">
		<span>{t("sidebar.memexes")}</span>
		<button class="close" aria-label={t("sidebar.close")} onclick={onclose}>×</button>
	</div>

	<select
		class="switcher"
		aria-label={t("sidebar.memexes")}
		value={page.params.id}
		onchange={switchMemex}
		disabled={chat.busy}
	>
		{#each memexes as memex (memex.id)}
			<option value={memex.id}>{memex.title}</option>
		{/each}
	</select>

	<button class="new" onclick={newMemex} disabled={chat.busy}>{t("sidebar.newMemex")}</button>

	{#if page.data.requests}
		<div class="requests">
			<span class="section">{t("sidebar.requests")}</span>
			{#if page.data.requests.length === 0}
				<p class="empty">{t("sidebar.noRequests")}</p>
			{:else}
				<ul>
					{#each page.data.requests as request (request.id)}
						<li>
							<button
								class:active={chat.request?.id === request.id}
								onclick={() => {
									selectRequest(request);
									onclose();
								}}
							>{request.text}</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<div class="foot">
		{#if page.params.id}
			<a class="settings" href={`/${page.params.id}/settings`} onclick={follow}>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<path
						d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
					/>
					<circle cx="12" cy="12" r="3" />
				</svg>
				{t("nav.settings")}
			</a>
		{/if}
	</div>
</aside>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 1;
		padding: 0;
		border: none;
		background: rgba(0, 0, 0, 0.4);
	}

	aside {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: min(80vw, 18rem);
		padding: 0.75rem;
		border-right: 1px solid var(--line);
		background: var(--surface);
		overflow: hidden;
		transform: translateX(-100%);
		transition: transform 200ms ease;
	}

	aside.open {
		transform: translateX(0);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 600;
		padding-left: 0.75rem;
	}

	.close {
		font: inherit;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.close:hover {
		color: var(--ink);
	}

	.switcher {
		font: inherit;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--ink);
	}

	.new {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--ink);
		cursor: pointer;
		text-align: left;
	}

	.new:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.new:disabled,
	.switcher:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.foot {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: auto;
	}

	.settings {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-top: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
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

	.requests {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.section {
		padding-left: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.empty {
		margin: 0;
		padding-left: 0.75rem;
		color: var(--muted);
	}

	.requests ul {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.requests button {
		width: 100%;
		font: inherit;
		text-align: left;
		padding: 0.5rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		background: none;
		color: var(--ink-soft);
		cursor: pointer;
	}

	.requests button:hover {
		background: var(--fill);
	}

	.requests button.active {
		border-color: var(--line-strong);
		background: var(--fill);
		color: var(--ink);
		font-weight: 600;
	}
</style>
