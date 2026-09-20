<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} />

<style>
	input {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		outline: none;
		color: var(--ink);
		background: var(--surface);
	}

	input:focus {
		border-color: var(--accent);
	}
</style>
