<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, icon = false, ...rest }: HTMLButtonAttributes & { children?: Snippet; icon?: boolean } =
		$props();
</script>

<button class:icon {...rest}>{@render children?.()}</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
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

	/* Fixed, icon-only button: square, circular, content centred. */
	button.icon {
		display: grid;
		place-items: center;
		flex: none;
		padding: 0;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius-full);
	}
</style>
