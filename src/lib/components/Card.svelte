<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		gap = '1rem',
		center = false,
		children
	}: { gap?: string; center?: boolean; children: Snippet } = $props();
</script>

<div class="card" class:center style:gap>
	{@render children()}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
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
</style>
