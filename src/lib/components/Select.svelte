<script module lang="ts">
	export interface SelectOption {
		value: string;
		label: string;
	}

	/** A link below the options, e.g. "Create new"; it navigates instead of selecting. */
	export interface SelectAction {
		href: string;
		label: string;
	}
</script>

<script lang="ts">
	let {
		value,
		options,
		actions = [],
		label,
		name,
		placeholder = '',
		disabled = false,
		onchange
	}: {
		value: string;
		options: SelectOption[];
		actions?: SelectAction[];
		label: string;
		name?: string;
		placeholder?: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	} = $props();

	const uid = $props.id();

	// The popover owns open state (light dismiss, Escape, top layer); this
	// mirrors it for aria and keyboard handling.
	let open = $state(false);
	let menu = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);

	const selectedIndex = $derived(options.findIndex((option) => option.value === value));
	const selected = $derived(options[selectedIndex]);

	let activeIndex = $state(0);

	function onToggle(event: ToggleEvent) {
		open = event.newState === 'open';
		if (open) activeIndex = Math.max(0, selectedIndex);
	}

	function choose(index: number) {
		menu?.hidePopover();
		trigger?.focus();
		onchange(options[index].value);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			menu?.hidePopover();
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (open) choose(activeIndex);
			else menu?.showPopover();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!open) menu?.showPopover();
			else {
				const step = event.key === 'ArrowDown' ? 1 : -1;
				activeIndex = (activeIndex + step + options.length) % options.length;
			}
		} else if (event.key === 'Home' || event.key === 'End') {
			if (!open) return;
			event.preventDefault();
			activeIndex = event.key === 'Home' ? 0 : options.length - 1;
		}
	}
</script>

<div>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}
	<button
		type="button"
		class="trigger"
		bind:this={trigger}
		style="anchor-name: --select-{uid}"
		{disabled}
		role="combobox"
		aria-haspopup="listbox"
		aria-controls={`${uid}-options`}
		aria-expanded={open}
		aria-label={label}
		aria-activedescendant={open ? `${uid}-${activeIndex}` : undefined}
		onclick={() => menu?.togglePopover()}
		onkeydown={onkeydown}
	>
		<span class="value">{selected?.label ?? placeholder}</span>
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>

	<div
		class="menu"
		bind:this={menu}
		popover="auto"
		style="position-anchor: --select-{uid}; min-width: anchor-size(--select-{uid} width)"
		ontoggle={onToggle}
	>
		<div class="options" id={`${uid}-options`} role="listbox" aria-label={label}>
			{#each options as option, index (option.value)}
				<button
					type="button"
					id={`${uid}-${index}`}
					role="option"
					tabindex="-1"
					class="option"
					class:active={index === activeIndex}
					aria-selected={option.value === value}
					onclick={() => choose(index)}
					onmousemove={() => (activeIndex = index)}
				>
					{option.label}
				</button>
			{/each}
		</div>
		{#if actions.length}
			<div class="actions">
				{#each actions as action (action.href)}
					<a
						class="action"
						class:disabled
						href={action.href}
						onclick={() => menu?.hidePopover()}
					>
						{action.label}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
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

	/* Anchored to the trigger and flipped by the browser when the viewport
	   leaves no room below; the top layer means no z-index or clipping. */
	.menu {
		position: fixed;
		position-area: bottom span-right;
		margin: var(--space-1) 0;
		position-try-fallbacks: flip-block;
		max-width: 24rem;
		max-height: 15rem;
		overflow-y: auto;
		padding: var(--space-1);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: inherit;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
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

	.actions {
		display: flex;
		flex-direction: column;
		margin-top: var(--space-1);
		border-top: 1px solid var(--line);
		padding-top: var(--space-1);
	}

	.action {
		display: block;
		width: 100%;
		font: inherit;
		text-align: left;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.action:hover {
		background: var(--fill);
	}

	.action.disabled {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
