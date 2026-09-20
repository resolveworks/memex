<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label>
	{label}
	{@render children()}
</label>

<style>
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
