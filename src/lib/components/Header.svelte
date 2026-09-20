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
		gap: 0.5rem;
		flex-shrink: 0;
		height: 3rem;
		padding: 0 0.75rem;
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}
</style>
