<script lang="ts">
	import type { Snippet } from 'svelte';

	let { center = false, children }: { center?: boolean; children: Snippet } = $props();
</script>

<div class="card stack" class:centered={center}>
	{@render children()}
</div>

<style>
	.card {
		max-inline-size: var(--panel-max);
		margin: var(--space-12) auto;
		padding: var(--space-6);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.card.centered {
		align-items: center;
		text-align: center;
	}

	.card :global(h1) {
		font-size: 1.25rem;
	}

	.card :global(form) {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
