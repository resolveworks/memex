<script lang="ts">
	import { page } from "$app/state";
	import { chat } from "$lib/chat.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { t } from "$lib/i18n.svelte";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

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
	<div class="body">
		{#if page.data.requests}
			<div class="requests">
				<span class="row section">{t("sidebar.requests")}</span>
				{#if page.data.requests.length === 0}
					<p class="row empty">{t("sidebar.noRequests")}</p>
				{:else}
					<ul>
						{#each page.data.requests as request (request.id)}
							<li class="row">{request.text}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	<Footer>
		<a class="row settings" href="/settings" onclick={follow}>
			<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<path
					d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				/>
				<circle cx="12" cy="12" r="3" />
			</svg>
			{t("nav.settings")}
		</a>
	</Footer>
</aside>

<style>
	.scrim {
		position: fixed;
		inset: 3rem 0 0 0;
		z-index: 1;
		padding: 0;
		border: none;
		background: rgba(0, 0, 0, 0.4);
	}

	aside {
		position: fixed;
		top: 3rem;
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

	/* One row shape shared by the section label, empty state, requests and settings. */
	.row {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
		min-height: 0;
		padding: var(--space-3);
	}

	.settings {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		color: var(--muted);
		text-decoration: none;
	}

	.settings:hover {
		color: var(--ink);
		background: var(--fill);
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
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.section {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.empty {
		margin: 0;
		color: var(--muted);
	}

	.requests ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.requests li {
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
	}
</style>
