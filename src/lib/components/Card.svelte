<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="card stack">
	{@render children()}
</div>

<style>
	.card {
		min-inline-size: 0;
		padding: var(--space-6);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.card :global(h1) {
		font-size: 1.25rem;
	}
</style>
