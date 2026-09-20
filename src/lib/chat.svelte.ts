import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { getAgent } from "./agent";
import { createSession, getSession, saveSession } from "./sessions.svelte";

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
}>({ messages: [], streaming: undefined, busy: false });

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
			if (currentId) saveSession(currentId, agent.state.messages);
			break;
		case "message_start":
		case "message_update":
			chat.streaming = agent.state.streamingMessage;
			break;
		case "message_end":
			chat.streaming = undefined;
			chat.messages = agent.state.messages.slice();
			if (currentId) saveSession(currentId, agent.state.messages);
			break;
	}
});

export async function open(id: string | undefined): Promise<void> {
	if (id === currentId) return;
	const token = ++openToken;
	if (agent.state.isStreaming) {
		agent.abort();
		await agent.waitForIdle();
	}
	if (token !== openToken) return;
	currentId = id;
	if (id) {
		agent.state.messages = getSession(id).messages;
	} else {
		agent.reset();
	}
	chat.messages = agent.state.messages.slice();
	chat.streaming = undefined;
	chat.busy = false;
}

/** Sends a prompt, creating a session first when the chat is unsaved. Returns the new session id, if any. */
export function send(text: string): string | undefined {
	if (chat.busy) return undefined;
	let created: string | undefined;
	if (currentId === undefined) {
		created = createSession(titleFrom(text)).id;
		currentId = created;
	}
	chat.busy = true;
	void agent.prompt(text);
	return created;
}

function titleFrom(text: string): string {
	const title = text.trim().replace(/\s+/g, " ");
	return title.length > 40 ? `${title.slice(0, 40)}…` : title;
}
