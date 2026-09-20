<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		width = 'var(--panel-max)',
		children
	}: { width?: string; children: Snippet } = $props();
</script>

<div class="page" style="--page-width: {width}">
	{@render children()}
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: minmax(0, var(--page-width));
		align-content: center;
		justify-content: center;
		min-block-size: 100%;
		padding: var(--space-6);
	}
</style>
