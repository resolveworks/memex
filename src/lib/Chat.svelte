<script lang="ts">
	import type { AgentMessage } from "@earendil-works/pi-agent-core";
	import { contentText } from "@earendil-works/pi-ai";
	import { chat, clear, open, send } from "$lib/chat.svelte";
	import ChatMessage, { type Item } from "$lib/ChatMessage.svelte";
	import Button from "$lib/components/Button.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { t } from "$lib/i18n.svelte";

	let { id, language }: { id: string; language: string } = $props();

	let input = $state("");

	$effect(() => {
		void open(id, language);
	});

	// Committed history is immutable while a reply streams; only the streaming
	// block below re-renders per chunk. Mirror of pi's static message components.
	function toItems(messages: AgentMessage[]): Item[] {
		const items: Item[] = [];
		for (const message of messages) {
			if (message.role === "user") {
				items.push({ kind: "user", text: contentText(message.content) });
			} else if (message.role === "assistant") {
				const text = contentText(message.content);
				if (text) items.push({ kind: "assistant", text });
				if (message.stopReason === "error" && message.errorMessage) {
					items.push({ kind: "error", text: message.errorMessage });
				}
				for (const part of message.content) {
					if (part.type === "toolCall") {
						items.push({
							kind: "tool",
							name: part.name,
							args: Object.entries(part.arguments).map(([key, value]) => ({
								key,
								value: Array.isArray(value) ? value.join(" · ") : String(value)
							}))
						});
					}
				}
			}
		}
		return items;
	}

	let items = $derived(toItems(chat.messages));
	// The greeting is a user-shaped trigger to the model, so only a real user turn
	// means the person has actually written something worth clearing.
	let hasConversation = $derived(chat.messages.some((message) => message.role === "user"));

	const streamText = $derived.by(() => {
		const message = chat.streaming;
		if (!message || message.role !== "assistant") return "";
		return contentText(message.content);
	});
	const thinking = $derived(chat.busy && !streamText);

	let viewport = $state<HTMLDivElement>();
	// Whether the view was at the bottom before the latest content arrived, so
	// streaming keeps following the answer without yanking a reader back down.
	let pinned = $state(true);

	function onScroll() {
		if (!viewport) return;
		pinned = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 24;
	}

	$effect(() => {
		void items;
		void thinking;
		void streamText;
		if (pinned && viewport) viewport.scrollTop = viewport.scrollHeight;
	});

	function submit() {
		const text = input.trim();
		if (!text || chat.busy) return;
		input = "";
		pinned = true;
		send(text);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}
</script>

<div class="chat stack">
	<div class="messages" bind:this={viewport} onscroll={onScroll}>
		<div class="thread stack">
		{#each items as item}
			<ChatMessage kind={item.kind} text={item.text} name={item.name} args={item.args} />
		{/each}
		{#if streamText}
			<ChatMessage kind="assistant" text={streamText} streaming />
		{/if}
		{#if thinking}
			<div class="thinking" role="status" aria-label={t("chat.thinking")}>
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</div>
		{/if}
		{#if hasConversation}
			<div class="clear">
				<Button type="button" onclick={clear}>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<polyline points="1 4 1 10 7 10" />
						<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
					</svg>
					{t("chat.clear")}
				</Button>
			</div>
		{/if}
		</div>
	</div>

	<Footer>
		<form
			class="composer"
			onsubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<textarea
				bind:value={input}
				onkeydown={onKeydown}
				placeholder={t("chat.placeholder")}
			></textarea>
			<Button icon type="submit" disabled={chat.busy} aria-label={t("chat.send")}>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<line x1="12" y1="19" x2="12" y2="5" />
					<polyline points="6 11 12 5 18 11" />
				</svg>
			</Button>
		</form>
	</Footer>
</div>

<style>
	.chat {
		gap: 0;
		height: 100%;
		color: var(--ink);
		background: var(--bg);
	}

	.messages {
		flex: 1;
		min-block-size: 0;
		overflow-y: auto;
		padding: var(--space-4);
	}

	.thread {
		gap: var(--space-2);
		max-inline-size: var(--content-max);
		margin-inline: auto;
	}

	.composer {
		display: flex;
		align-items: flex-end;
		flex: 1;
		gap: var(--space-2);
		max-inline-size: var(--content-max);
		margin-inline: auto;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.composer:focus-within {
		border-color: var(--accent);
	}

	textarea {
		flex: 1;
		padding: 0;
		max-height: 12rem;
		border: none;
		outline: none;
		background: none;
		color: inherit;
		line-height: var(--space-6);
		field-sizing: content;
		resize: none;
		overflow-y: auto;
	}

	.thinking {
		align-self: flex-start;
		display: inline-flex;
		gap: var(--space-1);
		padding: var(--space-2) 0;
	}

	.clear {
		align-self: center;
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
