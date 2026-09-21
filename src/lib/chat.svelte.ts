import { invalidateAll } from "$app/navigation";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { getAgent, greetingMessage, refreshSystemPrompt } from "./agent";
import { i18n } from "./i18n.svelte";

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
}>({ messages: [], streaming: undefined, busy: false });

let currentId: string | undefined;
let currentMemexLanguage: string | undefined;
let openToken = 0;

const agent = getAgent();

agent.subscribe((event) => {
	switch (event.type) {
		case "agent_start":
			chat.busy = true;
			break;
		case "agent_end":
			chat.busy = false;
			chat.streaming = undefined;
			// Pick up requests the run recorded or closed.
			void invalidateAll();
			break;
		case "message_start":
		case "message_update":
			chat.streaming = agent.state.streamingMessage;
			break;
		case "message_end":
			chat.streaming = undefined;
			chat.messages = agent.state.messages.slice();
			break;
	}
});

/** Starts a fresh conversation: aborts any stream in flight, then greets. */
async function restart(memexLanguage: string): Promise<void> {
	const token = ++openToken;
	if (agent.state.isStreaming) {
		agent.abort();
		await agent.waitForIdle();
	}
	if (token !== openToken) return;
	agent.reset();
	await refreshSystemPrompt(memexLanguage, i18n.locale);
	if (token !== openToken) return;
	chat.messages = [];
	chat.streaming = undefined;
	chat.busy = false;
	void agent.prompt(greetingMessage());
}

/** Switches to a memex, discarding the previous conversation and any stream in flight. */
export async function open(id: string, memexLanguage: string): Promise<void> {
	if (id === currentId) return;
	currentId = id;
	currentMemexLanguage = memexLanguage;
	await restart(memexLanguage);
}

/**
 * Discards the conversation with the open memex and starts over with a fresh
 * greeting; a no-op when no memex is open, since there is nothing to discard.
 */
export async function clear(): Promise<void> {
	if (!currentMemexLanguage) return;
	await restart(currentMemexLanguage);
}

export async function send(text: string): Promise<void> {
	if (chat.busy) return;
	if (!currentMemexLanguage) throw new Error("No memex open.");
	chat.busy = true;
	// Rebuild the prompt so the queue reflects requests the previous turn recorded or closed.
	await refreshSystemPrompt(currentMemexLanguage, i18n.locale);
	void agent.prompt(text);
}
