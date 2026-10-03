import type { AgentMessage } from '@earendil-works/pi-agent-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';
import { getAgent, greetingMessage, useSystemPrompt } from './agent';
import type { Question } from './question';

vi.mock('$app/state', () => ({ page }));

const memex = '9e107669-c4b1-4380-a20b-1f3e6c8b9c2d';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	page.params.id = memex;
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	fetchMock.mockReset();
});

/** A successful response carrying `body` as JSON. */
const ok = (body: unknown) => new Response(JSON.stringify(body));

/** A response carrying nothing but a failure status. */
const failure = (status: number) => new Response('denied', { status });

/** A recorded question with the given id and text. */
function question(id: string, text: string): Question {
	const at = '2026-03-01T08:00:00.000Z';
	return { id, text, createdAt: at, updatedAt: at, deletedAt: null };
}

/** The greeting message, confirmed by its role. */
async function greeting(): Promise<Extract<AgentMessage, { role: 'greeting' }>> {
	const message = await greetingMessage();
	if (message.role !== 'greeting') throw new Error('Expected a greeting message.');
	return message;
}

/** The greeting's text, the only content it carries. */
async function greetingText(): Promise<string> {
	const [content] = (await greeting()).content;
	if (content.type !== 'text') throw new Error('Expected text content.');
	return content.text;
}

describe('greetingMessage', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-04T10:30:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('loads the context from the memex api', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ title: 'Tea Log', memories: 0, questions: [], terms: [] })
		);

		await greetingText();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/context');
		expect(init).toEqual({ headers: { authorization: `Bearer ${memex}` } });
	});

	it('fails when the api rejects the context', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));

		await expect(greetingMessage()).rejects.toThrow('Failed to load context (401).');
	});

	it('grounds the greeting in the store contents', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Tea Log',
				memories: 12,
				questions: [
					question('q1', 'Tea or coffee?'),
					question('q2', 'Loose leaf or bags?'),
					question('q3', 'With milk?')
				],
				terms: [
					{ term: 'tea', count: 3 },
					{ term: 'sleep', count: 1 }
				]
			})
		);

		const { content } = await greeting();

		expect(content).toEqual([
			{
				type: 'text',
				text:
					'This memex is titled "Tea Log". Today is 2026-03-04. It holds 12 memories and 3 open questions.\n\n' +
					'# Topics\n\nMost frequent terms in the store, each with its memory count.\n\n- tea: 3\n- sleep: 1\n\n' +
					'# Question queue\n\nUnanswered questions recorded earlier, as `id: question`.\n\n' +
					'- q1: Tea or coffee?\n- q2: Loose leaf or bags?\n\n' +
					'1 more question are queued but not shown here.\n\n' +
					'The user has opened this memex and is waiting for you to greet them.'
			}
		]);
	});

	it('says the store is empty when it holds no terms', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ title: 'Blank Slate', memories: 0, questions: [], terms: [] })
		);

		expect(await greetingText()).toBe(
			'This memex is titled "Blank Slate". Today is 2026-03-04. It holds 0 memories and 0 open questions.\n\n' +
				'# Topics\n\nThe store is empty.\n\n' +
				'The user has opened this memex and is waiting for you to greet them.'
		);
	});

	it('omits the question queue when no question is open', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Notes',
				memories: 5,
				questions: [],
				terms: [{ term: 'tea', count: 5 }]
			})
		);

		const text = await greetingText();

		expect(text).not.toContain('# Question queue');
		expect(text).toBe(
			'This memex is titled "Notes". Today is 2026-03-04. It holds 5 memories and 0 open questions.\n\n' +
				'# Topics\n\nMost frequent terms in the store, each with its memory count.\n\n- tea: 5\n\n' +
				'The user has opened this memex and is waiting for you to greet them.'
		);
	});

	it('previews only the first two questions and counts the rest', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Tea Log',
				memories: 12,
				questions: [
					question('q1', 'Tea or coffee?'),
					question('q2', 'Loose leaf or bags?'),
					question('q3', 'With milk?'),
					question('q4', 'Sugar?'),
					question('q5', 'At what temperature?')
				],
				terms: []
			})
		);

		const text = await greetingText();

		expect(text).toContain('- q1: Tea or coffee?\n- q2: Loose leaf or bags?');
		expect(text).not.toContain('q3');
		expect(text).toContain('3 more questions are queued but not shown here.');
	});
});

describe('useSystemPrompt', () => {
	it('names the memex language and the ui language by their own names', () => {
		useSystemPrompt('de', 'sv');

		const prompt = getAgent().state.systemPrompt;
		expect(prompt).toContain('Deutsch');
		expect(prompt).toContain('svenska');
	});
});
