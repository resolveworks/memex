<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { chat } from "$lib/chat.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import Header from "$lib/components/Header.svelte";
	import Select from "$lib/components/Select.svelte";
	import { t } from "$lib/i18n.svelte";
	import { forget, getMemexes, remember } from "$lib/memexes.svelte";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

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
</script>

{#if open}
	<button class="scrim" aria-label={t("sidebar.close")} onclick={onclose}></button>
{/if}

<aside class:open>
	<Header>
		<span class="head-title">{t("sidebar.memexes")}</span>
		<button class="close" aria-label={t("sidebar.close")} onclick={onclose}>×</button>
	</Header>

	<div class="body">
		<Select
			aria-label={t("sidebar.memexes")}
			value={page.params.id}
			onchange={switchMemex}
			disabled={chat.busy}
		>
			{#each memexes as memex (memex.id)}
				<option value={memex.id}>{memex.title}</option>
			{/each}
		</Select>

		<button class="new" onclick={newMemex} disabled={chat.busy}>{t("sidebar.newMemex")}</button>

		{#if page.data.requests}
			<div class="requests">
				<span class="section">{t("sidebar.requests")}</span>
				{#if page.data.requests.length === 0}
					<p class="empty">{t("sidebar.noRequests")}</p>
				{:else}
					<ul>
						{#each page.data.requests as request (request.id)}
							<li>{request.text}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	<Footer>
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
	</Footer>
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
		width: min(80vw, 18rem);
		border-right: 1px solid var(--line);
		background: var(--surface);
		overflow: hidden;
		visibility: hidden;
		transform: translateX(-100%);
		transition: transform 200ms ease, visibility 0s linear 200ms;
	}

	aside.open {
		visibility: visible;
		transform: translateX(0);
		transition: transform 200ms ease;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
		padding: 0.75rem;
	}

	.head-title {
		font-weight: 600;
	}

	.close {
		margin-left: auto;
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

	.new:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.settings {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		align-self: stretch;
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

	.requests li {
		padding: 0.5rem 0.75rem;
		color: var(--ink-soft);
	}

	@media (min-width: 48rem) {
		.scrim {
			display: none;
		}

		aside {
			position: static;
			width: 18rem;
			flex-shrink: 0;
			visibility: visible;
			transform: none;
			transition: none;
		}

		.close {
			display: none;
		}
	}
</style>
