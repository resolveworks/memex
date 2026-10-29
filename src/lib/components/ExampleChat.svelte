<script lang="ts">
	import ChatMessage, { type Item } from '#lib/ChatMessage.svelte';
	import type { Turn } from '#lib/examples.js';
	import { t } from '#lib/i18n.js';
	import Thinking from '#lib/components/Thinking.svelte';

	let { script }: { script: Turn[] } = $props();

	/** Resolves the script into chat items, as Chat renders its transcript. */
	const items = $derived(
		script.map((turn, i): Item => {
			if (turn.kind === 'tool') {
				return {
					key: String(i),
					kind: 'tool',
					name: turn.name,
					args: [{ key: 'value', value: t(turn.args) }]
				};
			}
			return { key: String(i), kind: turn.kind, text: t(turn.text) };
		})
	);

	// How many items are on screen; once the demo is started, timers walk this up
	// one at a time so the canned conversation plays out like a live one.
	let shown = $state(0);
	let started = $state(false);
	let viewport = $state<HTMLDivElement>();
	let timers: ReturnType<typeof setTimeout>[] = [];

	function stop() {
		timers.forEach(clearTimeout);
		timers = [];
		shown = 0;
	}

	function schedule() {
		let at = 0;
		for (let i = 0; i < items.length; i++) {
			at += i === 0 ? 600 : items[i].kind === 'user' ? 1800 : 1200;
			timers.push(setTimeout(() => (shown = i + 1), at));
		}
	}

	// Switching tabs swaps the script: whatever is scheduled is torn down and,
	// once the demo has been started, the new script rolls straight into play.
	$effect(() => {
		void items;
		stop();
		if (started) schedule();
		return stop;
	});

	function play() {
		started = true;
	}

	// Playback reveals from the bottom, so follow it as the thread outgrows the frame.
	$effect(() => {
		void shown;
		if (started && viewport) viewport.scrollTop = viewport.scrollHeight;
	});

	// The next turn to appear isn't the user's own message, so the agent is
	// "working" on it.
	const thinking = $derived(started && shown < items.length && items[shown].kind !== 'user');
</script>

<div class="frame">
	<div class="thread" bind:this={viewport}>
		{#each items.slice(0, shown) as item (item.key)}
			<ChatMessage kind={item.kind} text={item.text} name={item.name} args={item.args} />
		{/each}
		{#if thinking}
			<Thinking />
		{/if}
	</div>
	{#if !started}
		<button class="play" type="button" onclick={play} aria-label={t('landing.examples.play')}>
			<span class="disc">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<polygon points="6.5 4 19.5 12 6.5 20" fill="currentColor" stroke="none" />
				</svg>
			</span>
		</button>
	{/if}
</div>

<style>
	.frame {
		position: relative;
		block-size: 26rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.thread {
		block-size: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		overflow-y: auto;
	}

	.play {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		border: none;
		background: none;
		cursor: pointer;
	}

	.play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.disc {
		display: grid;
		place-items: center;
		inline-size: 4.5rem;
		block-size: 4.5rem;
		border-radius: var(--radius-full);
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: 0 0 0 var(--space-2) color-mix(in srgb, var(--accent) 20%, transparent);
		transition:
			background-color 120ms ease,
			box-shadow 120ms ease;
	}

	.play:hover .disc {
		background: var(--accent-hover);
		box-shadow: 0 0 0 var(--space-3) color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.disc svg {
		inline-size: 1.5rem;
		block-size: 1.5rem;
		margin-inline-start: 0.25rem;
	}
</style>
