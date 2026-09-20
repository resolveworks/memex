<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<footer {...rest}>{@render children?.()}</footer>

<style>
	footer {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
		min-height: 3.5rem;
		padding: var(--space-2) var(--space-3);
	}
</style>
