<script module lang="ts">
	export type Item = {
		kind: "user" | "assistant" | "error" | "tool";
		text?: string;
		/** Tool name, when kind is "tool". */
		name?: string;
		args?: { key: string; value: string }[];
	};
</script>

<script lang="ts">
	import { marked } from "marked";

	let {
		kind,
		text = "",
		name = "",
		args = [],
		streaming = false
	}: { kind: Item["kind"]; text?: string; name?: string; args?: Item["args"]; streaming?: boolean } =
		$props();

	// Committed rows never change, so each parses exactly once; the streaming row
	// re-parses only its own text on every chunk.
	const html = $derived(kind === "assistant" ? marked(text, { async: false }) : "");
</script>

{#if kind === "tool"}
	<div class="tool">
		<span class="tool-name">{name}</span>
		{#if args.length}
			<span class="tool-args">
				{#each args as arg, j}{#if j}<span class="sep"> · </span>{/if}<span class:clamp={arg.key === "id"}>{arg.value}</span>{/each}
			</span>
		{/if}
	</div>
{:else if kind === "error"}
	<div class="error" role="alert">{text}</div>
{:else if kind === "assistant"}
	<div class="assistant" class:streaming>{@html html}</div>
{:else}
	<div class="bubble user">{text}</div>
{/if}

<style>
	.bubble {
		max-width: 75%;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-lg);
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.bubble.user {
		align-self: flex-end;
		background: var(--accent);
		color: var(--accent-ink);
		border-bottom-right-radius: var(--radius-sm);
		white-space: pre-wrap;
	}

	.assistant {
		align-self: flex-start;
		max-width: 90%;
		padding: var(--space-1) 0;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.assistant.streaming::after {
		content: "";
		display: inline-block;
		width: 0.5ch;
		height: 1em;
		margin-inline-start: 0.1ch;
		vertical-align: text-bottom;
		background: currentColor;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
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
	.assistant :global(table),
	.assistant :global(h1),
	.assistant :global(h2),
	.assistant :global(h3),
	.assistant :global(h4),
	.assistant :global(h5),
	.assistant :global(h6) {
		margin: var(--space-2) 0;
	}

	.assistant :global(ul),
	.assistant :global(ol) {
		padding-inline-start: var(--space-4);
	}

	.assistant :global(ul) {
		list-style: disc;
	}

	.assistant :global(ol) {
		list-style: decimal;
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
		font-family: var(--font-mono);
		font-size: 0.875em;
	}

	.assistant :global(:not(pre) > code) {
		background: var(--fill);
		padding: 0.1em 0.35em;
		border-radius: var(--radius-sm);
	}

	.assistant :global(pre) {
		background: var(--fill);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		overflow-x: auto;
	}

	.assistant :global(table) {
		border-collapse: collapse;
	}

	.assistant :global(th),
	.assistant :global(td) {
		border: 1px solid var(--line);
		padding: var(--space-1) var(--space-2);
		text-align: left;
	}

	.error {
		align-self: flex-start;
		max-width: 90%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--danger);
		border-radius: var(--radius-sm);
		color: var(--danger);
		line-height: 1.4;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.tool {
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		max-width: 80%;
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--line);
		border-radius: var(--radius-full);
		background: var(--surface);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		font-size: 0.75rem;
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
		padding-inline-start: var(--space-2);
		border-inline-start: 1px solid var(--line);
		font-family: var(--font-mono);
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
</style>
