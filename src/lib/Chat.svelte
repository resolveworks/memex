<script lang="ts">
	import type { AgentMessage } from "@earendil-works/pi-agent-core";
	import { contentText } from "@earendil-works/pi-ai";
	import { marked } from "marked";
	import { chat, open, send } from "$lib/chat.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { t } from "$lib/i18n.svelte";

	function md(text: string): string {
		return marked(text, { async: false });
	}

	function streamed(text: string, active: boolean): string {
		return md(active ? `${text}<span class="cursor"></span>` : text);
	}

	let { id, language }: { id: string; language: string } = $props();

	let input = $state("");

	$effect(() => {
		void open(id, language);
	});

	type Item =
		| { kind: "user"; text: string }
		| { kind: "assistant"; text: string }
		| { kind: "tool"; name: string; args: { key: string; value: string }[] };

	function toItems(messages: AgentMessage[]): Item[] {
		const items: Item[] = [];
		for (const message of messages) {
			if (message.role === "user") {
				items.push({ kind: "user", text: contentText(message.content) });
			} else if (message.role === "assistant") {
				const text = contentText(message.content);
				if (text) items.push({ kind: "assistant", text });
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

	let items = $derived(
		toItems(chat.streaming ? [...chat.messages, chat.streaming] : chat.messages)
	);

	const streamText = $derived.by(() => {
		const message = chat.streaming;
		if (!message || message.role !== "assistant") return "";
		return contentText(message.content);
	});
	const thinking = $derived(chat.busy && !streamText);

	let viewport = $state<HTMLDivElement>();
	let composerEl = $state<HTMLTextAreaElement>();
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
		if (pinned && viewport) viewport.scrollTop = viewport.scrollHeight;
	});

	$effect(() => {
		void input;
		if (!composerEl) return;
		composerEl.style.height = "auto";
		composerEl.style.height = `${composerEl.scrollHeight}px`;
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

<div class="chat">
	<div class="messages" bind:this={viewport} onscroll={onScroll}>
		<div class="thread">
		{#each items as item, i}
			{#if item.kind === "tool"}
				<div class="tool">
					<span class="tool-name">{item.name}</span>
					{#if item.args.length}
						<span class="tool-args">
							{#each item.args as arg, j}{#if j}<span class="sep"> · </span>{/if}<span class:clamp={arg.key === "id"}>{arg.value}</span>{/each}
						</span>
					{/if}
				</div>
			{:else if item.kind === "assistant"}
				<div class="assistant">{@html streamed(item.text, chat.streaming !== undefined && i === items.length - 1)}</div>
			{:else}
				<div class="bubble user">{item.text}</div>
			{/if}
		{/each}
		{#if thinking}
			<div class="assistant thinking" role="status" aria-label={t("chat.thinking")}>
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</div>
		{/if}
		</div>
	</div>

	<Footer style="padding-inline: max(0.75rem, calc((100% - 48rem) / 2))">
		<form
			class="composer"
			onsubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<textarea
				bind:this={composerEl}
				bind:value={input}
				onkeydown={onKeydown}
				placeholder={t("chat.placeholder")}
				rows="1"
			></textarea>
			<button class="send" type="submit" disabled={chat.busy} aria-label={t("chat.send")}>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<line x1="12" y1="19" x2="12" y2="5" />
					<polyline points="6 11 12 5 18 11" />
				</svg>
			</button>
		</form>
	</Footer>
</div>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--ink);
		background: var(--bg);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.thread {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 48rem;
		margin: 0 auto;
	}

	.bubble {
		max-width: 75%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.bubble.user {
		align-self: flex-end;
		background: var(--accent);
		color: var(--accent-ink);
		border-bottom-right-radius: 0.25rem;
		white-space: pre-wrap;
	}

	.assistant {
		align-self: flex-start;
		max-width: 90%;
		padding: 0.25rem 0;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.assistant :global(*:first-child) {
		margin-top: 0;
	}

	.assistant :global(*:last-child) {
		margin-bottom: 0;
	}

	.assistant :global(p),
	.assistant :global(ul),
	.assistant :global(ol),
	.assistant :global(blockquote),
	.assistant :global(pre),
	.assistant :global(table) {
		margin: 0.5rem 0;
	}

	.assistant :global(ul),
	.assistant :global(ol) {
		padding-left: 1.25rem;
	}

	.assistant :global(h1),
	.assistant :global(h2),
	.assistant :global(h3),
	.assistant :global(h4),
	.assistant :global(h5),
	.assistant :global(h6) {
		font-size: 1rem;
		font-weight: 600;
	}

	.assistant :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.875em;
	}

	.assistant :global(:not(pre) > code) {
		background: var(--fill);
		padding: 0.1em 0.35em;
		border-radius: 0.25rem;
	}

	.assistant :global(pre) {
		background: var(--fill);
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
	}

	.assistant :global(table) {
		border-collapse: collapse;
	}

	.assistant :global(th),
	.assistant :global(td) {
		border: 1px solid var(--line);
		padding: 0.25rem 0.5rem;
		text-align: left;
	}

	.tool {
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 80%;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		font-size: 0.78rem;
		color: var(--muted);
	}

	.tool-name {
		flex: none;
		white-space: nowrap;
		font-weight: 600;
		color: var(--ink);
		text-transform: capitalize;
	}

	.tool-args {
		padding-left: 0.5rem;
		border-left: 1px solid var(--line);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tool-args .clamp {
		display: inline-block;
		max-width: 6ch;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: bottom;
	}

	.composer {
		display: flex;
		align-items: flex-end;
		flex: 1;
		gap: 0.5rem;
		padding: 0.375rem 0.375rem 0.375rem 0.875rem;
		border: 1px solid var(--line-strong);
		border-radius: 1.25rem;
		background: var(--surface);
	}

	.composer:focus-within {
		border-color: var(--accent);
	}

	textarea {
		flex: 1;
		min-height: 1.5rem;
		max-height: 12rem;
		padding: 0.4rem 0;
		border: none;
		outline: none;
		background: none;
		color: inherit;
		font: inherit;
		resize: none;
		overflow-y: auto;
	}

	.send {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-ink);
		cursor: pointer;
	}

	.send:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.send:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.send svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	:global(.cursor) {
		display: inline-block;
		width: 0.5ch;
		height: 1em;
		margin-left: 0.1ch;
		vertical-align: text-bottom;
		background: currentColor;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.thinking {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.5rem 0;
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
