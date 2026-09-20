<script lang="ts">
	let { data } = $props();
</script>

<div class="settings">
	<h1>Settings</h1>
	<h2>Memories</h2>

	{#if data.memories.length === 0}
		<p class="empty">No memories yet.</p>
	{:else}
		<ul>
			{#each data.memories as memory (memory.key)}
				<li>
					<div class="memory">
						<span class="key">{memory.key}</span>
						<span class="value">{memory.value}</span>
					</div>
					<form method="POST" action="?/delete">
						<input type="hidden" name="key" value={memory.key} />
						<button aria-label={`Delete ${memory.key}`}>Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.settings {
		max-width: 40rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		color: #6b6b70;
	}

	.empty {
		color: #6b6b70;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid #e2e2e4;
		border-radius: 0.5rem;
	}

	.memory {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.key {
		font-weight: 600;
	}

	.value {
		color: #4a4a4f;
		overflow-wrap: anywhere;
	}

	button {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d0d0d4;
		border-radius: 0.5rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
	}

	button:hover {
		border-color: #d33;
		color: #d33;
	}
</style>
