<script module lang="ts">
	export interface SelectOption {
		value: string;
		label: string;
		/** An action rather than a peer choice, e.g. "Create new"; styled apart. */
		action?: boolean;
	}
</script>

<script lang="ts">
	let {
		value,
		options,
		label,
		name,
		placement = 'bottom',
		disabled = false,
		onchange
	}: {
		value: string;
		options: SelectOption[];
		label: string;
		name?: string;
		placement?: 'bottom' | 'top';
		disabled?: boolean;
		onchange: (value: string) => void;
	} = $props();

	const uid = $props.id();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);

	const selectedIndex = $derived(options.findIndex((option) => option.value === value));
	const selected = $derived(options[selectedIndex]);

	let activeIndex = $state(0);

	function toggle() {
		open = !open;
		if (open) activeIndex = selectedIndex;
	}

	function choose(index: number) {
		open = false;
		trigger?.focus();
		onchange(options[index].value);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (open) choose(activeIndex);
			else toggle();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!open) {
				toggle();
				return;
			}
			const step = event.key === 'ArrowDown' ? 1 : -1;
			activeIndex = (activeIndex + step + options.length) % options.length;
		}
	}

	function onwindowclick(event: MouseEvent) {
		if (open && !root?.contains(event.target as Node)) open = false;
	}

	function onfocusout(event: FocusEvent) {
		if (!root?.contains(event.relatedTarget as Node)) open = false;
	}
</script>

<svelte:window onclick={onwindowclick} />

<div class="select" class:top={placement === 'top'} bind:this={root} onfocusout={onfocusout}>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}
	<button
		type="button"
		class="trigger"
		bind:this={trigger}
		{disabled}
		role="combobox"
		aria-haspopup="listbox"
		aria-controls={`${uid}-menu`}
		aria-expanded={open}
		aria-label={label}
		aria-activedescendant={open ? `${uid}-${activeIndex}` : undefined}
		onclick={toggle}
		onkeydown={onkeydown}
	>
		<span class="value">{selected?.label}</span>
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>

	{#if open}
		<div class="menu" id={`${uid}-menu`} role="listbox" aria-label={label}>
			{#each options as option, index (option.value)}
				<button
					type="button"
					id={`${uid}-${index}`}
					role="option"
					tabindex="-1"
					class="option"
					class:action={option.action}
					class:active={index === activeIndex}
					aria-selected={option.value === value}
					onclick={() => choose(index)}
					onmousemove={() => (activeIndex = index)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.select {
		position: relative;
	}

	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
		font: inherit;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}

	.trigger:focus {
		border-color: var(--accent);
		outline: none;
	}

	.trigger:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.value {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.menu {
		position: absolute;
		top: calc(100% + var(--space-1));
		left: 0;
		z-index: 10;
		min-width: 100%;
		max-width: 24rem;
		max-height: 15rem;
		overflow-y: auto;
		padding: var(--space-1);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
	}

	.top .menu {
		top: auto;
		bottom: calc(100% + var(--space-1));
	}

	.option {
		display: block;
		width: 100%;
		font: inherit;
		text-align: left;
		padding: var(--space-2) var(--space-3);
		border: none;
		background: none;
		color: inherit;
		border-radius: var(--radius-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
	}

	.option.active {
		background: var(--fill);
	}

	.option.action {
		margin-top: var(--space-1);
		border-top: 1px solid var(--line);
		color: var(--accent);
		font-weight: 600;
	}
</style>
