<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} />

<style>
	input {
		font: inherit;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		outline: none;
		color: var(--ink);
		background: var(--surface);
	}

	input:focus {
		border-color: var(--accent);
	}
</style>
