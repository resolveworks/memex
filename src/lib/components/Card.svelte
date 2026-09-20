<script lang="ts">
	import type { Snippet } from 'svelte';

	let { center = false, children }: { center?: boolean; children: Snippet } = $props();
</script>

<div class="card" class:center>
	{@render children()}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 22rem;
		margin: 3rem auto;
		padding: var(--space-6);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.card.center {
		align-items: center;
		text-align: center;
	}

	.card :global(h1) {
		margin: 0;
		font-size: 1.25rem;
	}

	.card :global(form) {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
