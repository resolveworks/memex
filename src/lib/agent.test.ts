import type { AgentMessage } from '@earendil-works/pi-agent-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';
import { failure, ok, useFetchMock } from '../tests/fetch';
import { getAgent, greetingMessage, useSystemPrompt } from './agent';
import type { Question } from './question';

vi.mock('$app/state', () => ({ page }));

const memex = '9e107669-c4b1-4380-a20b-1f3e6c8b9c2d';

const fetchMock = useFetchMock();

beforeEach(() => {
	page.params.id = memex;
});

/** A recorded question with the given id and text. */
function question(id: string, text: string): Question {
	const at = '2026-03-01T08:00:00.000Z';
	return { id, text, createdAt: at, updatedAt: at, deletedAt: null };
}

/** The greeting message, confirmed by its role. */
async function greeting(question?: string): Promise<Extract<AgentMessage, { role: 'greeting' }>> {
	const message = await greetingMessage('sv', question);
	if (message.role !== 'greeting') throw new Error('Expected a greeting message.');
	return message;
}

/** The greeting's text, the only content it carries. */
async function greetingText(question?: string): Promise<string> {
	const [content] = (await greeting(question)).content;
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
			ok({ title: 'Tea Log', memories: 0, openQuestions: 0, terms: [] })
		);

		await greetingText();

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(`/api/${memex}/context`);
		expect(init).toBeUndefined();
	});

	it('fails when the api rejects the context', async () => {
		fetchMock.mockResolvedValueOnce(failure(404));

		await expect(greetingMessage('sv')).rejects.toThrow('Failed to load context (404).');
	});

	it('grounds the greeting in the store contents', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Tea Log',
				memories: 12,
				openQuestions: 3,
				question: question('q1', 'Tea or coffee?'),
				terms: [
					{ term: 'cup', count: 3 },
					{ term: 'tea', count: 3 },
					{ term: 'sleep', count: 1 }
				]
			})
		);

		const { content } = await greeting('q1');

		expect(content).toEqual([
			{
				type: 'text',
				text:
					'This memex is titled "Tea Log". Today is 2026-03-04. It holds 12 memories and 3 open questions.\n\n' +
					'# Topics\n\nThe most common terms in the store, each count followed by the terms found in that many entries. Use them to judge what it covers.\n\n3: cup tea 1: sleep\n\n' +
					'The user has opened this memex and is waiting for you to greet them. ' +
					'In one or two short sentences in svenska, say what this memex is, what it appears to hold from the topic terms above, and what it has left unanswered. ' +
					'End by asking the open question q1: "Tea or coffee?", set in bold. ' +
					'Call no tools.'
			}
		]);
	});

	it('says the store is empty when it holds no terms', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ title: 'Blank Slate', memories: 0, openQuestions: 0, terms: [] })
		);

		const text = await greetingText();

		expect(text).toContain('The store is empty.');
		expect(text).not.toContain('The most common terms');
	});

	it('asks nothing when no question is open', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Notes',
				memories: 5,
				openQuestions: 0,
				terms: [{ term: 'tea', count: 5 }]
			})
		);

		const text = await greetingText();

		expect(text).not.toContain('End by asking');
		expect(text).not.toContain('left unanswered');
	});

	it('asks the api for the named question', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				title: 'Tea Log',
				memories: 12,
				openQuestions: 1,
				question: question('q2', 'Loose leaf or bags?'),
				terms: []
			})
		);

		await greetingText('q2');

		expect(fetchMock.mock.calls[0][0]).toBe(`/api/${memex}/context?question=q2`);
	});
});

describe('useSystemPrompt', () => {
	it('names the memex language by its own name', () => {
		useSystemPrompt('de');

		const prompt = getAgent().state.systemPrompt;
		expect(prompt).toContain('Deutsch');
	});
});
