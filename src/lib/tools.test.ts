import type { AgentToolResult } from '@earendil-works/pi-agent-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '../tests/app-state';
import { failure, ok, useFetchMock } from '../tests/fetch';
import { answer, forget, list, remember, revise, search, wonder } from './tools';

vi.mock('$app/state', () => ({ page }));

const memex = '9e107669-c4b1-4380-a20b-1f3e6c8b9c2d';

const fetchMock = useFetchMock();

beforeEach(() => {
	page.params.id = memex;
});

/** The single request a tool's `execute` sent, as `[input, init]`. */
function sentRequest(): [string | Request | URL, RequestInit | undefined] {
	expect(fetchMock).toHaveBeenCalledTimes(1);
	const [input, init] = fetchMock.mock.calls[0];
	return [input, init];
}

/** The text an `execute` result carries back to the agent. */
async function resultText(result: Promise<AgentToolResult<unknown>>): Promise<string> {
	const [content] = (await result).content;
	if (content.type !== 'text') throw new Error('Expected text content.');
	return content.text;
}

describe('remember', () => {
	it('posts the fact to the memex api and reports the new memory', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ id: 'm1', text: 'Prefers tea.', updatedAt: '2026-03-04T10:30:00.000Z' })
		);

		expect(await resultText(remember.execute('call', { text: 'Prefers tea.' }))).toBe(
			'Remembered m1.'
		);

		const [url, init] = sentRequest();
		expect(url).toBe('/api/remember');
		expect(init).toEqual({
			method: 'POST',
			headers: {
				authorization: `Bearer ${memex}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ text: 'Prefers tea.' })
		});
	});

	it('fails when the api rejects the fact', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(remember.execute('call', { text: 'Prefers tea.' })).rejects.toThrow(
			'Failed to remember (401).'
		);
	});
});

describe('wonder', () => {
	it('posts the question to the memex api and reports it recorded', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ id: 'q1', text: 'Tea or coffee?', updatedAt: '2026-03-04T10:30:00.000Z' })
		);

		expect(await resultText(wonder.execute('call', { text: 'Tea or coffee?' }))).toBe(
			'Recorded question q1.'
		);

		const [url, init] = sentRequest();
		expect(url).toBe('/api/wonder');
		expect(init).toEqual({
			method: 'POST',
			headers: {
				authorization: `Bearer ${memex}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ text: 'Tea or coffee?' })
		});
	});

	it('fails when the api rejects the question', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(wonder.execute('call', { text: 'Tea or coffee?' })).rejects.toThrow(
			'Failed to record question (401).'
		);
	});
});

describe('answer', () => {
	it('posts the fact linked to the question and reports both ids', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({ id: 'm2', text: 'Tea, always.', updatedAt: '2026-03-04T10:30:00.000Z' })
		);

		expect(await resultText(answer.execute('call', { question: 'q1', text: 'Tea, always.' }))).toBe(
			'Answered question q1: remembered m2.'
		);

		const [url, init] = sentRequest();
		expect(url).toBe('/api/answer');
		expect(init).toEqual({
			method: 'POST',
			headers: {
				authorization: `Bearer ${memex}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ question: 'q1', text: 'Tea, always.' })
		});
	});

	it('fails when the api rejects the answer', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(answer.execute('call', { question: 'q1', text: 'Tea, always.' })).rejects.toThrow(
			'Failed to answer question q1 (401).'
		);
	});
});

describe('revise', () => {
	it('posts the replacement text for the id', async () => {
		fetchMock.mockResolvedValueOnce(ok({}));

		expect(
			await resultText(revise.execute('call', { id: 'm1', text: 'Prefers coffee now.' }))
		).toBe('Revised m1.');

		const [url, init] = sentRequest();
		expect(url).toBe('/api/revise');
		expect(init).toEqual({
			method: 'POST',
			headers: {
				authorization: `Bearer ${memex}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ id: 'm1', text: 'Prefers coffee now.' })
		});
	});

	it('fails when the api rejects the revision', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(revise.execute('call', { id: 'm1', text: 'Prefers coffee now.' })).rejects.toThrow(
			'Failed to revise m1 (401).'
		);
	});
});

describe('forget', () => {
	it('posts the id to remove', async () => {
		fetchMock.mockResolvedValueOnce(ok({}));

		expect(await resultText(forget.execute('call', { id: 'm1' }))).toBe('Forgot m1.');

		const [url, init] = sentRequest();
		expect(url).toBe('/api/forget');
		expect(init).toEqual({
			method: 'POST',
			headers: {
				authorization: `Bearer ${memex}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ id: 'm1' })
		});
	});

	it('fails when the api rejects the removal', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(forget.execute('call', { id: 'm1' })).rejects.toThrow(
			'Failed to forget m1 (401).'
		);
	});
});

describe('search', () => {
	it('sends each query as its own q param', async () => {
		fetchMock.mockResolvedValueOnce(ok({ memories: [], questions: [] }));

		await search.execute('call', { queries: ['tea', 'loose leaf'] });

		const [url, init] = sentRequest();
		expect(url).toBe('/api/search?q=tea&q=loose+leaf');
		expect(init).toEqual({ headers: { authorization: `Bearer ${memex}` } });
	});

	it('renders memories before questions as dated lines', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				memories: [
					{ id: 'm2', text: 'Prefers loose leaf.', updatedAt: '2026-03-04T10:30:00.000Z' },
					{ id: 'm1', text: 'Prefers tea.', updatedAt: '2026-03-03T09:00:00.000Z' }
				],
				questions: [{ id: 'q1', text: 'Tea or coffee?', updatedAt: '2026-03-02T08:00:00.000Z' }]
			})
		);

		expect(await resultText(search.execute('call', { queries: ['tea'] }))).toBe(
			'- 2026-03-04 [memory] m2: Prefers loose leaf.\n' +
				'- 2026-03-03 [memory] m1: Prefers tea.\n' +
				'- 2026-03-02 [question] q1: Tea or coffee?'
		);
	});

	it('says so when nothing matches', async () => {
		fetchMock.mockResolvedValueOnce(ok({ memories: [], questions: [] }));

		expect(await resultText(search.execute('call', { queries: ['kombucha'] }))).toBe(
			'Nothing matches that search.'
		);
	});

	it('fails when the api errors', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(search.execute('call', { queries: ['tea'] })).rejects.toThrow(
			'Search failed (401).'
		);
	});
});

describe('list', () => {
	it('asks for the first page of both kinds', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				items: [
					{ id: 'm1', kind: 'memory', text: 'Prefers tea.', updatedAt: '2026-03-04T10:30:00.000Z' }
				],
				hasMore: false
			})
		);

		await list.execute('call', {});

		const [url, init] = sentRequest();
		expect(url).toBe('/api/list?offset=0');
		expect(init).toEqual({ headers: { authorization: `Bearer ${memex}` } });
	});

	it('passes the given offset and kind through', async () => {
		fetchMock.mockResolvedValueOnce(ok({ items: [], hasMore: false }));

		await list.execute('call', { kind: 'question', offset: 50 });

		const [url] = sentRequest();
		expect(url).toBe('/api/list?offset=50&kind=question');
	});

	it('renders the page as dated lines', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				items: [
					{
						id: 'm2',
						kind: 'memory',
						text: 'Prefers loose leaf.',
						updatedAt: '2026-03-04T10:30:00.000Z'
					},
					{
						id: 'q1',
						kind: 'question',
						text: 'Tea or coffee?',
						updatedAt: '2026-03-02T08:00:00.000Z'
					}
				],
				hasMore: false
			})
		);

		expect(await resultText(list.execute('call', {}))).toBe(
			'- 2026-03-04 [memory] m2: Prefers loose leaf.\n' +
				'- 2026-03-02 [question] q1: Tea or coffee?'
		);
	});

	it('suggests the next offset when more remain', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				items: [
					{
						id: 'm2',
						kind: 'memory',
						text: 'Prefers loose leaf.',
						updatedAt: '2026-03-04T10:30:00.000Z'
					},
					{
						id: 'q1',
						kind: 'question',
						text: 'Tea or coffee?',
						updatedAt: '2026-03-02T08:00:00.000Z'
					}
				],
				hasMore: true
			})
		);

		expect(await resultText(list.execute('call', { offset: 10 }))).toBe(
			'- 2026-03-04 [memory] m2: Prefers loose leaf.\n' +
				'- 2026-03-02 [question] q1: Tea or coffee?\n' +
				'\n' +
				'More remain. Call list again with offset=12.'
		);
	});

	it('keeps the kind in that suggestion when one was given', async () => {
		fetchMock.mockResolvedValueOnce(
			ok({
				items: [
					{ id: 'm1', kind: 'memory', text: 'Prefers tea.', updatedAt: '2026-03-04T10:30:00.000Z' }
				],
				hasMore: true
			})
		);

		expect(await resultText(list.execute('call', { kind: 'memory' }))).toBe(
			'- 2026-03-04 [memory] m1: Prefers tea.\n' +
				'\n' +
				'More remain. Call list again with offset=1 and kind="memory".'
		);
	});

	it('says so when the page is empty', async () => {
		fetchMock.mockResolvedValueOnce(ok({ items: [], hasMore: false }));

		expect(await resultText(list.execute('call', {}))).toBe('Nothing recorded.');
	});

	it('fails when the api errors', async () => {
		fetchMock.mockResolvedValueOnce(failure(401));
		await expect(list.execute('call', {})).rejects.toThrow('Failed to list (401).');
	});
});
