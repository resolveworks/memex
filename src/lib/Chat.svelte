<script lang="ts">
	import type { AgentMessage } from "@earendil-works/pi-agent-core";
	import { contentText } from "@earendil-works/pi-ai";
	import { marked } from "marked";
	import { goto } from "$app/navigation";
	import { chat, open, send } from "$lib/chat.svelte";

	function md(text: string): string {
		return marked(text, { async: false });
	}

	let { id }: { id?: string } = $props();

	let input = $state("");

	$effect(() => {
		void open(id);
	});

	type Item =
		| { kind: "user"; text: string }
		| { kind: "assistant"; text: string }
		| { kind: "tool"; name: string; args: string };

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
							args: formatToolArgs(part.arguments)
						});
					}
				}
			}
		}
		return items;
	}

	function formatToolArgs(args: Record<string, unknown>): string {
		return Object.values(args)
			.map((value) => (Array.isArray(value) ? value.join(" · ") : String(value)))
			.join(" · ");
	}

	let items = $derived(
		toItems(chat.streaming ? [...chat.messages, chat.streaming] : chat.messages)
	);

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
		if (pinned && viewport) viewport.scrollTop = viewport.scrollHeight;
	});

	// Static welcome shown only on an empty chat; never sent to the model or saved.
	const intro = `I'm Memex, a memory that outlives the conversation.

Tell me something worth keeping — "remember my sister's birthday is June 3rd" — and I'll store it. Ask for it later, in this chat or a brand-new one — "when is my sister's birthday?" — and I'll look it up. If it isn't in memory, I'll note the question so you can fill it in.

That's the whole idea: say it once, and I remember.`;

	async function submit() {
		const text = input.trim();
		if (!text || chat.busy) return;
		input = "";
		const created = send(text);
		if (created) await goto(`/c/${created}`, { replaceState: true });
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
		{#if items.length === 0}
			<div class="bubble assistant">{@html md(intro)}</div>
		{/if}
		{#each items as item}
			{#if item.kind === "tool"}
				<div class="tool">
					<span class="tool-name">{item.name}</span>
					{#if item.args}<span class="tool-args">{item.args}</span>{/if}
				</div>
			{:else if item.kind === "assistant"}
				<div class="bubble assistant">{@html md(item.text)}</div>
			{:else}
				<div class="bubble user">{item.text}</div>
			{/if}
		{/each}
	</div>

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
			placeholder="Message Memex…"
			rows="1"
		></textarea>
		<button type="submit" disabled={chat.busy}>Send</button>
	</form>
</div>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: #1a1a1a;
		background: #f6f6f7;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
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
		background: #1a73e8;
		color: #fff;
		border-bottom-right-radius: 0.25rem;
		white-space: pre-wrap;
	}

	.bubble.assistant {
		align-self: flex-start;
		background: #fff;
		border: 1px solid #e2e2e4;
		border-bottom-left-radius: 0.25rem;
	}

	.bubble.assistant :global(*:first-child) {
		margin-top: 0;
	}

	.bubble.assistant :global(*:last-child) {
		margin-bottom: 0;
	}

	.bubble.assistant :global(p),
	.bubble.assistant :global(ul),
	.bubble.assistant :global(ol),
	.bubble.assistant :global(blockquote),
	.bubble.assistant :global(pre),
	.bubble.assistant :global(table) {
		margin: 0.5rem 0;
	}

	.bubble.assistant :global(ul),
	.bubble.assistant :global(ol) {
		padding-left: 1.25rem;
	}

	.bubble.assistant :global(h1),
	.bubble.assistant :global(h2),
	.bubble.assistant :global(h3),
	.bubble.assistant :global(h4),
	.bubble.assistant :global(h5),
	.bubble.assistant :global(h6) {
		font-size: 1rem;
		font-weight: 600;
	}

	.bubble.assistant :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.875em;
	}

	.bubble.assistant :global(:not(pre) > code) {
		background: #f0f0f2;
		padding: 0.1em 0.35em;
		border-radius: 0.25rem;
	}

	.bubble.assistant :global(pre) {
		background: #f0f0f2;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
	}

	.bubble.assistant :global(table) {
		border-collapse: collapse;
	}

	.bubble.assistant :global(th),
	.bubble.assistant :global(td) {
		border: 1px solid #e2e2e4;
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
		border: 1px solid #e2e2e4;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		font-size: 0.78rem;
		color: #6b6b70;
	}

	.tool-name {
		font-weight: 600;
		color: #1a1a1a;
		text-transform: capitalize;
	}

	.tool-args {
		padding-left: 0.5rem;
		border-left: 1px solid #d0d0d4;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.composer {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border-top: 1px solid #e2e2e4;
		background: #fff;
	}

	textarea {
		flex: 1;
		resize: none;
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d0d0d4;
		border-radius: 0.5rem;
		outline: none;
	}

	textarea:focus {
		border-color: #1a73e8;
	}

	button {
		font: inherit;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #1a73e8;
		color: #fff;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
