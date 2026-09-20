<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { chat } from "$lib/chat.svelte";
	import { deleteSession, getSessions } from "$lib/sessions.svelte";

	const sessions = $derived([...getSessions()].sort((a, b) => b.updatedAt - a.updatedAt));

	function guard(event: MouseEvent) {
		if (chat.busy) event.preventDefault();
	}

	function remove(id: string) {
		deleteSession(id);
		if (id === page.params.id) goto("/");
	}
</script>

<aside>
	<button class="new" onclick={() => goto("/")} disabled={chat.busy}>New chat</button>
	<nav>
		{#each sessions as session (session.id)}
			<div class="item" class:active={session.id === page.params.id}>
				<a href={`/c/${session.id}`} onclick={guard}>{session.title}</a>
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
	aside {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 15rem;
		flex-shrink: 0;
		padding: 0.75rem;
		border-right: 1px solid #e2e2e4;
		background: #ffffff;
		overflow-y: auto;
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

	.delete {
		font: inherit;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		color: #6b6b70;
		cursor: pointer;
	}

	.delete:hover:not(:disabled) {
		color: #1a1a1a;
	}

	.new:disabled,
	.delete:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
