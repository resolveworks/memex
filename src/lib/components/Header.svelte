<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<header {...rest}>{@render children?.()}</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
		height: 3rem;
		padding: 0 var(--space-3);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}
</style>
