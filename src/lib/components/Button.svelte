<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLButtonAttributes & { children?: Snippet } = $props();
</script>

<button {...rest}>{@render children?.()}</button>

<style>
	button {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--accent-ink);
	}

	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
