import { refreshAll } from '$app/navigation';
import { page } from '$app/state';
import type { Agent, AgentMessage } from '@earendil-works/pi-agent-core';
import { getAgent, greetingMessage, useSystemPrompt } from './agent';

export const chat = $state<{
	messages: AgentMessage[];
	streaming: AgentMessage | undefined;
	busy: boolean;
}>({ messages: [], streaming: undefined, busy: false });

let currentId: string | undefined;
let currentQuestion: string | undefined;
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
			case 'agent_start':
				chat.busy = true;
				break;
			case 'agent_end':
				chat.busy = false;
				chat.streaming = undefined;
				// Pick up questions the run recorded or closed.
				void refreshAll();
				break;
			case 'message_start':
			case 'message_update':
				chat.streaming = instance.state.streamingMessage;
				break;
			case 'message_end':
				chat.streaming = undefined;
				chat.messages = instance.state.messages.slice();
				break;
		}
	});
	return instance;
}

/** Starts a fresh conversation: aborts any stream in flight, then greets. */
async function restart(memexLanguage: string, question: string | undefined): Promise<void> {
	const instance = active();
	const token = ++openToken;
	if (instance.state.isStreaming) {
		instance.abort();
		await instance.waitForIdle();
	}
	if (token !== openToken) return;
	instance.reset();
	useSystemPrompt(memexLanguage);
	const greeting = await greetingMessage(page.data.locale, question);
	if (token !== openToken) return;
	chat.messages = [];
	chat.streaming = undefined;
	chat.busy = false;
	void instance.prompt(greeting);
}

/**
 * Switches to a memex, discarding the previous conversation and any stream in
 * flight. `question` names an open question for the greeting to ask; without
 * one the greeting falls back to a random open question.
 */
export async function open(id: string, memexLanguage: string, question?: string): Promise<void> {
	if (id === currentId && question === currentQuestion) return;
	currentId = id;
	currentQuestion = question;
	currentMemexLanguage = memexLanguage;
	await restart(memexLanguage, question);
}

/**
 * Discards the conversation with the open memex and starts over with a fresh
 * greeting; a no-op when no memex is open, since there is nothing to discard.
 */
export async function clear(): Promise<void> {
	if (!currentMemexLanguage) return;
	await restart(currentMemexLanguage, undefined);
}

export async function send(text: string): Promise<void> {
	if (chat.busy) return;
	if (!currentMemexLanguage) throw new Error('No memex open.');
	const instance = active();
	chat.busy = true;
	void instance.prompt(text);
}
