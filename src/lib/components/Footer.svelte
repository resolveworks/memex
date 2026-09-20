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
		gap: 0.5rem;
		flex-shrink: 0;
		min-height: 3.5rem;
		padding: 0.5rem 0.75rem;
	}
</style>
