import type { Agent, AgentEvent, AgentMessage } from '@earendil-works/pi-agent-core';
import { flushSync } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';

vi.mock('$app/state', () => ({ page }));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));

/**
 * A controllable stand-in for the agent: tests act on the store, then feed it
 * events through `emit`. The double keeps `state` coherent the way the real
 * agent does, so the store always sees a plausible transcript.
 */
const fake = vi.hoisted(() => {
	type Listener = (event: AgentEvent) => void;

	/** The slice of agent state the store reads back on every event. */
	const state = {
		systemPrompt: undefined as string | undefined,
		messages: [] as AgentMessage[],
		streamingMessage: undefined as AgentMessage | undefined,
		isStreaming: false
	};

	const listeners = new Set<Listener>();

	/** Delivers an event after applying the run-state transition it stands for. */
	function emit(event: AgentEvent): void {
		switch (event.type) {
			case 'agent_start':
				state.isStreaming = true;
				break;
			case 'agent_end':
				state.isStreaming = false;
				state.streamingMessage = undefined;
				state.messages = event.messages;
				break;
			case 'message_start':
			case 'message_update':
				state.streamingMessage = event.message;
				break;
			case 'message_end':
				state.streamingMessage = undefined;
				state.messages = [...state.messages, event.message];
				break;
		}
		for (const listener of listeners) listener(event);
	}

	/** The greeting the mocked `greetingMessage` hands the store. */
	const greeting: AgentMessage = {
		role: 'greeting',
		content: [{ type: 'text', text: 'The user has opened this memex.' }],
		timestamp: 0
	};

	const agent = {
		subscribe(listener: Listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		prompt: vi.fn((input: AgentMessage | AgentMessage[] | string) => {
			const batch =
				typeof input === 'string'
					? [{ role: 'user' as const, content: input, timestamp: 0 }]
					: Array.isArray(input)
						? input
						: [input];
			state.messages = [...state.messages, ...batch];
			state.isStreaming = true;
		}),
		reset: vi.fn(() => {
			state.messages = [];
			state.streamingMessage = undefined;
			state.isStreaming = false;
		}),
		abort: vi.fn(),
		waitForIdle: vi.fn(async () => {}),
		state
	};

	const useSystemPrompt = vi.fn((memexLanguage: string, userLanguage: string) => {
		state.systemPrompt = `${memexLanguage}/${userLanguage}`;
	});
	const greetingMessage = vi.fn(async () => greeting);

	return { agent, emit, greeting, greetingMessage, listeners, state, useSystemPrompt };
});

vi.mock('$lib/agent', () => ({
	getAgent: () => fake.agent as unknown as Agent,
	greetingMessage: fake.greetingMessage,
	useSystemPrompt: fake.useSystemPrompt
}));

/** An assistant turn — finished or still streaming — as the model produces it. */
function assistant(text: string): Extract<AgentMessage, { role: 'assistant' }> {
	return {
		role: 'assistant',
		content: [{ type: 'text', text }],
		api: 'deepseek',
		provider: 'deepseek',
		model: 'deepseek-chat',
		usage: {
			input: 1,
			output: 1,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 2,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
		},
		stopReason: 'stop',
		timestamp: 0
	};
}

/** The `message_update` event carrying a text delta of a streaming turn. */
function textDelta(
	message: Extract<AgentMessage, { role: 'assistant' }>,
	delta: string
): AgentEvent {
	return {
		type: 'message_update',
		message,
		assistantMessageEvent: { type: 'text_delta', contentIndex: 0, delta, partial: message }
	};
}

let store: typeof import('$lib/chat.svelte');

beforeEach(async () => {
	vi.clearAllMocks();
	fake.listeners.clear();
	fake.state.systemPrompt = undefined;
	fake.state.messages = [];
	fake.state.streamingMessage = undefined;
	fake.state.isStreaming = false;
	page.data.locale = 'sv';
	// The store keeps its open memex in module state; reimport for a fresh one.
	vi.resetModules();
	store = await import('$lib/chat.svelte');
	flushSync();
});

describe('open', () => {
	it('resets the agent, sets the system prompt from both languages, and greets', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		flushSync();

		expect(fake.agent.reset).toHaveBeenCalledTimes(1);
		expect(fake.useSystemPrompt).toHaveBeenCalledTimes(1);
		expect(fake.useSystemPrompt).toHaveBeenCalledWith('de', 'sv');
		expect(fake.agent.prompt).toHaveBeenCalledTimes(1);
		expect(fake.agent.prompt).toHaveBeenCalledWith(fake.greeting);
	});

	it('does not greet again when the same memex stays open', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		fake.agent.reset.mockClear();
		fake.useSystemPrompt.mockClear();
		fake.agent.prompt.mockClear();

		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');

		expect(fake.agent.reset).not.toHaveBeenCalled();
		expect(fake.useSystemPrompt).not.toHaveBeenCalled();
		expect(fake.agent.prompt).not.toHaveBeenCalled();
	});
});

describe('clear', () => {
	it('does nothing while no memex is open', async () => {
		await store.clear();

		expect(fake.agent.reset).not.toHaveBeenCalled();
		expect(fake.agent.prompt).not.toHaveBeenCalled();
		expect(store.chat.messages).toEqual([]);
		expect(store.chat.busy).toBe(false);
	});

	it('restarts the greeting for the open memex', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		fake.agent.reset.mockClear();
		fake.agent.prompt.mockClear();

		await store.clear();

		expect(fake.agent.reset).toHaveBeenCalledTimes(1);
		expect(fake.useSystemPrompt).toHaveBeenCalledWith('de', 'sv');
		expect(fake.agent.prompt).toHaveBeenCalledTimes(1);
		expect(fake.agent.prompt).toHaveBeenCalledWith(fake.greeting);
	});
});

describe('send', () => {
	it('ignores messages while the agent is busy', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		fake.emit({ type: 'agent_start' });
		flushSync();
		expect(store.chat.busy).toBe(true);

		await store.send('remember this');
		expect(fake.agent.prompt).toHaveBeenCalledTimes(1);

		fake.emit({ type: 'agent_end', messages: [...fake.state.messages] });
		flushSync();

		await store.send('remember this');
		expect(fake.agent.prompt).toHaveBeenCalledWith('remember this');
	});
});

describe('chat state', () => {
	it('stays busy and mirrors the streaming message until the run ends', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		const reply = assistant('Hej');
		const longer = assistant('Hej på dig');

		fake.emit({ type: 'agent_start' });
		flushSync();
		expect(store.chat.busy).toBe(true);

		fake.emit({ type: 'message_start', message: reply });
		fake.emit(textDelta(reply, 'Hej'));
		flushSync();
		expect(store.chat.streaming).toEqual(reply);

		fake.emit(textDelta(longer, ' på dig'));
		flushSync();
		expect(store.chat.streaming).toEqual(longer);

		fake.emit({ type: 'agent_end', messages: [...fake.state.messages] });
		flushSync();
		expect(store.chat.busy).toBe(false);
		expect(store.chat.streaming).toBeUndefined();
	});

	it('reflects a finished exchange in the transcript', async () => {
		await store.open('9e107669-c4b1-4380-a20b-1f3e6c8b9c2d', 'de');
		const reply = assistant('Hej! Vad vill du spara?');

		fake.emit({ type: 'agent_start' });
		fake.emit({ type: 'message_start', message: reply });
		fake.emit(textDelta(reply, 'Hej!'));
		fake.emit({ type: 'message_end', message: reply });
		fake.emit({ type: 'agent_end', messages: [...fake.state.messages] });
		flushSync();

		expect(store.chat.messages).toEqual([fake.greeting, reply]);
		expect(store.chat.streaming).toBeUndefined();
		expect(store.chat.busy).toBe(false);
	});
});
