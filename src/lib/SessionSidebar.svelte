<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { chat } from "$lib/chat.svelte";
	import { t } from "$lib/i18n.svelte";
	import { deleteSession, getSessions } from "$lib/sessions.svelte";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	const sessions = $derived([...getSessions()].sort((a, b) => b.updatedAt - a.updatedAt));

	function follow(event: MouseEvent) {
		if (chat.busy) {
			event.preventDefault();
			return;
		}
		onclose();
	}

	function newChat() {
		onclose();
		goto("/");
	}

	function remove(id: string) {
		deleteSession(id);
		if (id === page.params.id) {
			onclose();
			goto("/");
		}
	}
</script>

{#if open}
	<button class="scrim" aria-label={t("sidebar.close")} onclick={onclose}></button>
{/if}

<aside class:open inert={!open}>
	<div class="head">
		<span>{t("sidebar.sessions")}</span>
		<button class="close" aria-label={t("sidebar.close")} onclick={onclose}>×</button>
	</div>
	<button class="new" onclick={newChat} disabled={chat.busy}>{t("sidebar.newChat")}</button>
	<nav>
		{#each sessions as session (session.id)}
			<div class="item" class:active={session.id === page.params.id}>
				<a href={`/c/${session.id}`} onclick={follow}>{session.title}</a>
				<button
					class="delete"
					aria-label={t("sidebar.delete")}
					onclick={() => remove(session.id)}
					disabled={chat.busy}
				>
					×
				</button>
			</div>
		{/each}
	</nav>
	<button
		class="settings"
		onclick={() => {
			onclose();
			goto('/settings');
		}}
	>
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<path
				d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
			/>
			<circle cx="12" cy="12" r="3" />
		</svg>
		{t('nav.settings')}
	</button>
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

	.close,
	.delete {
		font: inherit;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.close:hover,
	.delete:hover:not(:disabled) {
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

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.item {
		display: flex;
		align-items: center;
		border-radius: 0.5rem;
	}

	.item:hover,
	.item.active {
		background: var(--fill);
	}

	.item a {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.new:disabled,
	.delete:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.settings {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border: none;
		border-top: 1px solid var(--line);
		background: none;
		color: var(--ink);
		font: inherit;
		cursor: pointer;
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
</style>
