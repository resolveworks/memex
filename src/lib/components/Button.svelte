<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLButtonAttributes & { children?: Snippet } = $props();
</script>

<button {...rest}>{@render children?.()}</button>

<style>
	button {
		font: inherit;
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--accent-ink);
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
