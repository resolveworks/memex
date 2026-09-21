import { invalidateAll } from "$app/navigation";
import { page } from "$app/state";
import type { Agent, AgentMessage } from "@earendil-works/pi-agent-core";
import { getAgent, greetingMessage, refreshSystemPrompt } from "./agent";

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
}>({ messages: [], streaming: undefined, busy: false });

let currentId: string | undefined;
let currentMemexLanguage: string | undefined;
let openToken = 0;

/**
 * The agent lives in the browser. Create it and wire its events on first use so
 * that importing this module on the server is inert.
 */
let agent: Agent | undefined;

function active(): Agent {
	if (agent) return agent;
	const instance = getAgent();
	agent = instance;
	instance.subscribe((event) => {
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
				chat.streaming = instance.state.streamingMessage;
				break;
			case "message_end":
				chat.streaming = undefined;
				chat.messages = instance.state.messages.slice();
				break;
		}
	});
	return instance;
}

/** Starts a fresh conversation: aborts any stream in flight, then greets. */
async function restart(memexLanguage: string): Promise<void> {
	const instance = active();
	const token = ++openToken;
	if (instance.state.isStreaming) {
		instance.abort();
		await instance.waitForIdle();
	}
	if (token !== openToken) return;
	instance.reset();
	await refreshSystemPrompt(memexLanguage, page.data.locale);
	if (token !== openToken) return;
	chat.messages = [];
	chat.streaming = undefined;
	chat.busy = false;
	void instance.prompt(greetingMessage());
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
	const instance = active();
	chat.busy = true;
	// Rebuild the prompt so the queue reflects requests the previous turn recorded or closed.
	await refreshSystemPrompt(currentMemexLanguage, page.data.locale);
	void instance.prompt(text);
}
