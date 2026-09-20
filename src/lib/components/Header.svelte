<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<header class="cluster" {...rest}>{@render children?.()}</header>

<style>
	header {
		flex-wrap: nowrap;
		flex-shrink: 0;
		block-size: var(--chrome-h);
		padding-inline: var(--space-3);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}
</style>
