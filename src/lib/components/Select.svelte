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

	// The popover owns open state (light dismiss, Escape, top layer); we only
	// mirror it for aria and to know whether the arrows open or navigate.
	let open = $state(false);
	let menu = $state<HTMLDivElement | null>(null);

	const selected = $derived(options.find((option) => option.value === value)?.label ?? placeholder);

	function choose(next: string) {
		menu?.hidePopover();
		onchange(next);
	}

	function onToggle(event: ToggleEvent) {
		open = event.newState === 'open';
		if (!open) return;
		// Focus moves into the menu so Enter/Space are the browser's; the arrows
		// then walk real focus instead of a mirror index.
		const current = menu?.querySelector<HTMLElement>('[aria-selected="true"]');
		(current ?? menu?.querySelector<HTMLElement>('.option, .action'))?.focus();
	}

	function onkeydown(event: KeyboardEvent) {
		if (!open) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				menu?.showPopover();
			}
			return;
		}
		const items = [...(menu?.querySelectorAll<HTMLElement>('.option, .action') ?? [])];
		const at = items.indexOf(document.activeElement as HTMLElement);
		let next: number;
		if (event.key === 'ArrowDown') next = at + 1;
		else if (event.key === 'ArrowUp') next = at - 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = items.length - 1;
		else return;
		event.preventDefault();
		items[(next + items.length) % items.length]?.focus();
	}
</script>

{#if name}
	<input type="hidden" {name} {value} />
{/if}
<button
	type="button"
	class="trigger"
	style="anchor-name: --select-{uid}"
	{disabled}
	role="combobox"
	aria-haspopup="listbox"
	aria-controls={`${uid}-options`}
	aria-expanded={open}
	aria-label={label}
	onclick={() => menu?.togglePopover()}
	onkeydown={onkeydown}
>
	<span class="value">{selected}</span>
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
		{#each options as option (option.value)}
			<button
				type="button"
				role="option"
				tabindex="-1"
				class="option"
				aria-selected={option.value === value}
				onclick={() => choose(option.value)}
				onkeydown={onkeydown}
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
					onkeydown={onkeydown}
				>
					{action.label}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		text-align: left;
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
		text-align: left;
		padding: var(--space-2) var(--space-3);
		color: inherit;
		border-radius: var(--radius-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option:focus {
		outline: none;
	}

	.option:hover,
	.option:focus {
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
		text-align: left;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.action:hover,
	.action:focus {
		background: var(--fill);
		outline: none;
	}

	.action.disabled {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
