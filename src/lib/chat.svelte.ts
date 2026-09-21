import { invalidateAll } from "$app/navigation";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { getAgent, refreshSystemPrompt } from "./agent";

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
}>({ messages: [], streaming: undefined, busy: false });

let currentId: string | undefined;
let currentLanguage: string | undefined;
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

/** Switches to a memex, discarding the previous conversation and any stream in flight. */
export async function open(id: string, language: string): Promise<void> {
	if (id === currentId) return;
	const token = ++openToken;
	if (agent.state.isStreaming) {
		agent.abort();
		await agent.waitForIdle();
	}
	if (token !== openToken) return;
	currentId = id;
	currentLanguage = language;
	agent.reset();
	await refreshSystemPrompt(language);
	if (token !== openToken) return;
	chat.messages = [];
	chat.streaming = undefined;
	chat.busy = false;
}

export async function send(text: string): Promise<void> {
	if (chat.busy) return;
	if (!currentLanguage) throw new Error("No memex open.");
	chat.busy = true;
	// Rebuild the prompt so the queue reflects requests the previous turn recorded or closed.
	await refreshSystemPrompt(currentLanguage);
	void agent.prompt(text);
}
