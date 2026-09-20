<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<footer class="cluster" {...rest}>{@render children?.()}</footer>

<style>
	footer {
		flex-wrap: nowrap;
		flex-shrink: 0;
		min-block-size: var(--space-14);
		padding: var(--space-2) var(--space-3);
	}
</style>
