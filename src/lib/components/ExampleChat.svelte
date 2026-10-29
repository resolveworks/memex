<script lang="ts">
	import ChatMessage, { type Item } from '#lib/ChatMessage.svelte';
	import { t } from '#lib/i18n.js';

	let { items }: { items: Item[] } = $props();

	// How many items are on screen; once the thread scrolls into view, the
	// effect walks this up one timer at a time so the canned conversation plays
	// out like a live one.
	let shown = $state(0);
	let root = $state<HTMLDivElement>();

	$effect(() => {
		void items;
		shown = 0;
		if (!root) return;

		const timers: ReturnType<typeof setTimeout>[] = [];
		const start = () => {
			observer.disconnect();
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				shown = items.length;
				return;
			}
			let at = 0;
			for (let i = 0; i < items.length; i++) {
				at += i === 0 ? 600 : items[i].kind === 'user' ? 1800 : 1200;
				timers.push(setTimeout(() => (shown = i + 1), at));
			}
		};
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) start();
		});
		observer.observe(root);
		return () => {
			observer.disconnect();
			timers.forEach(clearTimeout);
		};
	});

	const thinking = $derived(shown < items.length && items[shown].kind !== 'user');
</script>

<div class="thread" bind:this={root}>
	{#each items.slice(0, shown) as item (item.key)}
		<ChatMessage kind={item.kind} text={item.text} name={item.name} args={item.args} />
	{/each}
	{#if thinking}
		<div class="thinking" role="status" aria-label={t('chat.thinking')}>
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
	{/if}
</div>

<style>
	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.thinking {
		align-self: flex-start;
		display: inline-flex;
		gap: var(--space-1);
		padding: var(--space-2) 0;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--muted);
		animation: pulse 1.2s ease-in-out infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			opacity: 0.3;
		}
		40% {
			opacity: 1;
		}
	}
</style>
