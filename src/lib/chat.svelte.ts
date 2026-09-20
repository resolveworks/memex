import { invalidateAll } from "$app/navigation";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { getAgent, useLanguage } from "./agent";
import type { Request } from "./request";

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
	request: Request | undefined;
}>({ messages: [], streaming: undefined, busy: false, request: undefined });

let currentId: string | undefined;
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
	agent.reset();
	useLanguage(language);
	chat.messages = [];
	chat.streaming = undefined;
	chat.busy = false;
	chat.request = undefined;
}

/** Opens a recorded request in the chat, where the assistant restates it. */
export function selectRequest(request: Request): void {
	chat.request = request;
}

export function send(text: string): void {
	if (chat.busy) return;
	chat.busy = true;
	void agent.prompt(text);
}
