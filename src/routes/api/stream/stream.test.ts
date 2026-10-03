import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantMessage, AssistantMessageEvent, Context } from '@earendil-works/pi-ai';
import { create } from '$lib/server/memexes';
import { fakeLlm } from '../../../tests/llm';
import { event } from '../../../tests/request';
import { POST } from './+server';

// The abuse limits are read from $env/dynamic/private at request time, but under Vitest
// that module is a snapshot of the shell environment taken before test code runs. Mocking
// it pins small limits the requests below are built around.
vi.mock('$env/dynamic/private', () => ({
	env: { MAX_USER_MESSAGES: '2', MAX_MESSAGE_WORDS: '5' }
}));

const url = 'http://localhost/api/stream';

async function post(body: BodyInit, token?: string): Promise<Response> {
	const headers = token ? { authorization: `Bearer ${token}` } : undefined;
	return POST(event(new Request(url, { method: 'POST', headers, body })));
}

const assistant: AssistantMessage = {
	role: 'assistant',
	content: [
		{ type: 'thinking', thinking: 'Thinking it over', thinkingSignature: 'thinking-sig' },
		{ type: 'text', text: 'Hello there', textSignature: 'text-sig' }
	],
	api: 'openai-completions',
	provider: 'deepseek',
	model: 'deepseek-v4-flash',
	usage: {
		input: 1,
		output: 2,
		cacheRead: 0,
		cacheWrite: 0,
		totalTokens: 3,
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
	},
	stopReason: 'stop',
	providerThinkingLevel: 'low',
	timestamp: 0
};

const providerEvents: AssistantMessageEvent[] = [
	{ type: 'start', partial: assistant },
	{ type: 'thinking_start', contentIndex: 0, partial: assistant },
	{ type: 'thinking_delta', contentIndex: 0, delta: 'Thinking it over', partial: assistant },
	{ type: 'thinking_end', contentIndex: 0, content: 'Thinking it over', partial: assistant },
	{ type: 'text_start', contentIndex: 1, partial: assistant },
	{ type: 'text_delta', contentIndex: 1, delta: 'Hello', partial: assistant },
	{ type: 'text_delta', contentIndex: 1, delta: ' there', partial: assistant },
	{ type: 'text_end', contentIndex: 1, content: 'Hello there', partial: assistant },
	{ type: 'done', reason: 'stop', message: assistant }
];

const proxyEvents = [
	{ type: 'start' },
	{ type: 'thinking_start', contentIndex: 0 },
	{ type: 'thinking_delta', contentIndex: 0, delta: 'Thinking it over' },
	{ type: 'thinking_end', contentIndex: 0, contentSignature: 'thinking-sig' },
	{ type: 'text_start', contentIndex: 1 },
	{ type: 'text_delta', contentIndex: 1, delta: 'Hello' },
	{ type: 'text_delta', contentIndex: 1, delta: ' there' },
	{ type: 'text_end', contentIndex: 1, contentSignature: 'text-sig' },
	{ type: 'done', reason: 'stop', usage: assistant.usage, providerThinkingLevel: 'low' }
];

describe('POST /api/stream', () => {
	it('rejects a missing bearer token before parsing the body', async () => {
		await expect(post('not json')).rejects.toMatchObject({
			status: 401,
			body: { message: 'Missing memex id.' }
		});
	});

	it('rejects an unknown bearer token before parsing the body', async () => {
		await expect(post('not json', randomUUID())).rejects.toMatchObject({
			status: 404,
			body: { message: 'No such memex.' }
		});
	});

	it('rejects a non-JSON body', async () => {
		const id = create('Dinner plans', 'en');

		const response = await post('not json', id);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Request body must be valid JSON' });
	});

	it('rejects more user messages than MAX_USER_MESSAGES', async () => {
		const id = create('Dinner plans', 'en');
		const context: Context = {
			messages: [
				{ role: 'user', content: 'one', timestamp: 0 },
				{ role: 'user', content: 'two', timestamp: 0 },
				{ role: 'user', content: 'three', timestamp: 0 }
			]
		};

		const response = await post(JSON.stringify({ context }), id);

		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: 'A chat can hold at most 2 messages.' });
	});

	it('rejects a user message over MAX_MESSAGE_WORDS words', async () => {
		const id = create('Dinner plans', 'en');
		const context: Context = {
			messages: [{ role: 'user', content: 'one two three four five six', timestamp: 0 }]
		};

		const response = await post(JSON.stringify({ context }), id);

		expect(response.status).toBe(413);
		expect(await response.json()).toEqual({ error: 'A message can hold at most 5 words.' });
	});

	it('streams provider events as SSE proxy frames ending with done', async () => {
		const id = create('Dinner plans', 'en');
		fakeLlm(providerEvents);
		const context: Context = {
			messages: [{ role: 'user', content: 'Hi there', timestamp: 0 }]
		};

		const response = await post(JSON.stringify({ context }), id);

		expect(response.headers.get('content-type')).toBe('text/event-stream');
		expect(response.headers.get('cache-control')).toBe('no-cache');
		expect(await response.text()).toBe(
			proxyEvents.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
		);
	});
});
