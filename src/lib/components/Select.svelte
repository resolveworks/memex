<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLSelectAttributes & { children?: Snippet } = $props();
</script>

<select {...rest}>{@render children?.()}</select>

<style>
	select {
		font: inherit;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		outline: none;
		background: var(--surface);
		color: var(--ink);
	}

	select:focus {
		border-color: var(--accent);
	}

	select:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
