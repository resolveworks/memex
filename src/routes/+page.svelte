<script lang="ts">
	import type { AgentEvent } from "@earendil-works/pi-agent-core";
	import { contentText } from "@earendil-works/pi-ai";
	import { onMount } from "svelte";
	import { getAgent } from "$lib/agent";

	type Entry =
		| { kind: "user"; text: string }
		| { kind: "assistant"; text: string }
		| { kind: "tool"; text: string };

	let entries = $state<Entry[]>([]);
	let input = $state("");
	let busy = $state(false);
	let streamingIndex: number | undefined;

	onMount(() => {
		const agent = getAgent();
		return agent.subscribe((event) => handleEvent(event));
	});

	function handleEvent(event: AgentEvent) {
		switch (event.type) {
			case "agent_start":
				busy = true;
				break;
			case "agent_end":
				busy = false;
				break;
			case "message_update":
				if (event.assistantMessageEvent.type === "text_delta") {
					if (streamingIndex === undefined) {
						entries.push({ kind: "assistant", text: "" });
						streamingIndex = entries.length - 1;
					}
					entries[streamingIndex].text += event.assistantMessageEvent.delta;
				}
				break;
			case "message_end":
				if (event.message.role === "user") {
					entries.push({ kind: "user", text: contentText(event.message.content) });
				} else if (event.message.role === "assistant" && streamingIndex !== undefined) {
					entries[streamingIndex].text = contentText(event.message.content);
					streamingIndex = undefined;
				}
				break;
			case "tool_execution_start":
				entries.push({
					kind: "tool",
					text: `${event.toolName}(${Object.values(event.args).map((value) => JSON.stringify(value)).join(", ")})`,
				});
				break;
		}
	}

	async function send() {
		const text = input.trim();
		if (!text || busy) return;
		input = "";
		await getAgent().prompt(text);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	}
</script>

<div class="chat">
	<div class="messages">
		{#each entries as entry}
			{#if entry.kind === "tool"}
				<div class="tool">{entry.text}</div>
			{:else}
				<div class="bubble {entry.kind}">{entry.text}</div>
			{/if}
		{/each}
	</div>

	<form
		class="composer"
		onsubmit={(event) => {
			event.preventDefault();
			send();
		}}
	>
		<textarea
			bind:value={input}
			onkeydown={onKeydown}
			placeholder="Message Memex…"
			rows="1"
		></textarea>
		<button type="submit" disabled={busy}>Send</button>
	</form>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	.chat {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
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
