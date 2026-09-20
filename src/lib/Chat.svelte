<script lang="ts">
	import type { AgentMessage } from "@earendil-works/pi-agent-core";
	import { contentText } from "@earendil-works/pi-ai";
	import { goto } from "$app/navigation";
	import { chat, open, send } from "$lib/chat.svelte";

	let { id }: { id?: string } = $props();

	let input = $state("");

	$effect(() => {
		void open(id);
	});

	type Item =
		| { kind: "user"; text: string }
		| { kind: "assistant"; text: string }
		| { kind: "tool"; text: string };

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
						items.push({ kind: "tool", text: formatToolCall(part.name, part.arguments) });
					}
				}
			}
		}
		return items;
	}

	function formatToolCall(name: string, args: Record<string, unknown>): string {
		return `${name}(${Object.values(args)
			.map((value) => JSON.stringify(value))
			.join(", ")})`;
	}

	let items = $derived(
		toItems(chat.streaming ? [...chat.messages, chat.streaming] : chat.messages)
	);

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
	<div class="messages">
		{#each items as item}
			{#if item.kind === "tool"}
				<div class="tool">{item.text}</div>
			{:else}
				<div class="bubble {item.kind}">{item.text}</div>
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
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.bubble.user {
		align-self: flex-end;
		background: #1a73e8;
		color: #fff;
		border-bottom-right-radius: 0.25rem;
	}

	.bubble.assistant {
		align-self: flex-start;
		background: #fff;
		border: 1px solid #e2e2e4;
		border-bottom-left-radius: 0.25rem;
	}

	.tool {
		align-self: flex-start;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8rem;
		color: #6b6b70;
		padding: 0.125rem 0.25rem;
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
