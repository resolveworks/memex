<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { chat } from "$lib/chat.svelte";
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
	<button class="scrim" aria-label="Close sessions" onclick={onclose}></button>
{/if}

<aside class:open inert={!open}>
	<div class="head">
		<span>Sessions</span>
		<button class="close" aria-label="Close sessions" onclick={onclose}>×</button>
	</div>
	<button class="new" onclick={newChat} disabled={chat.busy}>New chat</button>
	<nav>
		{#each sessions as session (session.id)}
			<div class="item" class:active={session.id === page.params.id}>
				<a href={`/c/${session.id}`} onclick={follow}>{session.title}</a>
				<button
					class="delete"
					aria-label="Delete session"
					onclick={() => remove(session.id)}
					disabled={chat.busy}
				>
					×
				</button>
			</div>
		{/each}
	</nav>
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
		border-right: 1px solid #e2e2e4;
		background: #fff;
		overflow-y: auto;
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
		color: #6b6b70;
		cursor: pointer;
	}

	.close:hover,
	.delete:hover:not(:disabled) {
		color: #1a1a1a;
	}

	.new {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d0d0d4;
		border-radius: 0.5rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
		text-align: left;
	}

	.new:hover:not(:disabled) {
		border-color: #1a73e8;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.item {
		display: flex;
		align-items: center;
		border-radius: 0.5rem;
	}

	.item:hover,
	.item.active {
		background: #f0f0f2;
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
</style>
