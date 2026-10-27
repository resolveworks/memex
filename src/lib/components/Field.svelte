<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label class="stack">
	{label}
	{@render children()}
</label>

<style>
	label {
		gap: var(--space-1);
		color: var(--ink-soft);
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
