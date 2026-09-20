<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLSelectAttributes & { children?: Snippet } = $props();
</script>

<select {...rest}>{@render children?.()}</select>

<style>
	select {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
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
