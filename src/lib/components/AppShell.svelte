<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n.svelte';
	import Header from './Header.svelte';
	import Select, { type SelectAction, type SelectOption } from './Select.svelte';

	let {
		home,
		value,
		options,
		actions = [],
		disabled = false,
		onchange,
		onhomeclick,
		toolbar,
		children
	}: {
		home: string;
		value: string;
		options: SelectOption[];
		actions?: SelectAction[];
		disabled?: boolean;
		onchange: (value: string) => void;
		onhomeclick?: (event: MouseEvent) => void;
		toolbar?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="app">
	<Header>
		<a class="title" href={home} onclick={onhomeclick}>Memex</a>
		{#if options.length}
			<Select
				label={t('nav.memexes')}
				{value}
				{options}
				{actions}
				placeholder={t('nav.select')}
				{disabled}
				{onchange}
			/>
		{/if}
		{#if toolbar}
			<div class="actions">{@render toolbar()}</div>
		{/if}
	</Header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		block-size: 100dvh;
	}

	.title {
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}

	.title:hover {
		color: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		flex-shrink: 0;
		justify-content: flex-end;
		gap: var(--space-1);
		margin-inline-start: auto;
	}

	main {
		min-inline-size: 0;
		min-block-size: 0;
		overflow-y: auto;
	}
</style>
