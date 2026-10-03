import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memexId } from '$lib/server/auth';
import { create } from '$lib/server/memexes';
import { listMemories, listQuestions } from '$lib/server/storage';
import { bearer, event, post } from '../../tests/request';
import { POST as answer } from './answer/+server';
import { POST as forget } from './forget/+server';
import { POST as remember } from './remember/+server';
import { POST as revise } from './revise/+server';
import { POST as wonder } from './wonder/+server';

// A UUIDv4: the version and variant bits are what make the id unguessable.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Runs a sync function and returns what it threw, asserting it threw. */
function thrown(run: () => unknown): unknown {
	try {
		run();
	} catch (err) {
		return err;
	}
	throw new Error('expected the call to throw');
}

describe('memexId', () => {
	it('returns the id carried by the bearer token', () => {
		const id = create('Dinner plans', 'en');
		expect(memexId(post({}, bearer(id)))).toBe(id);
	});

	it('rejects a missing bearer token with 401', () => {
		expect(thrown(() => memexId(post({})))).toMatchObject({
			status: 401,
			body: { message: 'Missing memex id.' }
		});
	});

	it('rejects a malformed bearer token with 401', () => {
		const request = post({}, `Basic ${randomUUID()}`);
		expect(thrown(() => memexId(request))).toMatchObject({
			status: 401,
			body: { message: 'Missing memex id.' }
		});
	});

	it('rejects an unknown memex id with 404', () => {
		const request = post({}, bearer(randomUUID()));
		expect(thrown(() => memexId(request))).toMatchObject({
			status: 404,
			body: { message: 'No such memex.' }
		});
	});
});

const handlers = { remember, wonder, answer, revise, forget };

describe('API auth', () => {
	for (const [route, handler] of Object.entries(handlers)) {
		describe(`POST /api/${route}`, () => {
			it('rejects a missing bearer token with 401', async () => {
				await expect(handler(event(post({})))).rejects.toMatchObject({
					status: 401,
					body: { message: 'Missing memex id.' }
				});
			});

			it('rejects a malformed bearer token with 401', async () => {
				const request = post({}, `Basic ${randomUUID()}`);
				await expect(handler(event(request))).rejects.toMatchObject({
					status: 401,
					body: { message: 'Missing memex id.' }
				});
			});

			it('rejects an unknown memex id with 404', async () => {
				const request = post({}, bearer(randomUUID()));
				await expect(handler(event(request))).rejects.toMatchObject({
					status: 404,
					body: { message: 'No such memex.' }
				});
			});
		});
	}
});

describe('POST /api/remember', () => {
	it('stores the fact and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const before = Date.now();
		const response = await remember(event(post({ text: 'Sushi on Fridays' }, bearer(id))));
		const after = Date.now();

		expect(response.status).toBe(201);
		const memory = await response.json();
		expect(memory.id).toMatch(uuid);
		expect(memory.text).toBe('Sushi on Fridays');
		expect(new Date(memory.createdAt).getTime()).toBeGreaterThanOrEqual(before);
		expect(new Date(memory.createdAt).getTime()).toBeLessThanOrEqual(after);
		expect(memory.updatedAt).toBe(memory.createdAt);
		expect(memory.answers).toBeNull();
		expect(listMemories(id)).toHaveLength(1);
	});
});

describe('POST /api/wonder', () => {
	it('records the question and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const before = Date.now();
		const response = await wonder(event(post({ text: 'When is sushi day?' }, bearer(id))));
		const after = Date.now();

		expect(response.status).toBe(201);
		const question = await response.json();
		expect(question.id).toMatch(uuid);
		expect(question.text).toBe('When is sushi day?');
		expect(new Date(question.createdAt).getTime()).toBeGreaterThanOrEqual(before);
		expect(new Date(question.createdAt).getTime()).toBeLessThanOrEqual(after);
		expect(question.updatedAt).toBe(question.createdAt);
		expect(listQuestions(id)).toHaveLength(1);
	});
});

describe('POST /api/answer', () => {
	it('stores a memory answering the question and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const asked = await wonder(event(post({ text: 'When is sushi day?' }, bearer(id))));
		const question = await asked.json();

		const response = await answer(
			event(post({ question: question.id, text: 'Fridays' }, bearer(id)))
		);

		expect(response.status).toBe(201);
		const memory = await response.json();
		expect(memory.id).toMatch(uuid);
		expect(memory.text).toBe('Fridays');
		expect(memory.updatedAt).toBe(memory.createdAt);
		expect(memory.answers).toBe(question.id);
		const memories = listMemories(id);
		expect(memories).toHaveLength(1);
		expect(memories[0]!.answers).toBe(question.id);
	});

	it('rejects an unknown question id', async () => {
		const id = create('Dinner plans', 'en');
		const unknown = randomUUID();
		const request = post({ question: unknown, text: 'Fridays' }, bearer(id));
		await expect(answer(event(request))).rejects.toThrow(`No question with id "${unknown}".`);
	});
});

describe('POST /api/revise', () => {
	// Revisions written in the same millisecond are unordered, so the revise
	// would be unobservable; fake time keeps the two writes apart.
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the revised memory as JSON, keeping its identity', async () => {
		const id = create('Dinner plans', 'en');
		const stored = await remember(event(post({ text: 'Sushi on Fridays' }, bearer(id))));
		const memory = await stored.json();

		vi.advanceTimersByTime(1);

		const response = await revise(
			event(post({ id: memory.id, text: 'Sushi on Saturdays' }, bearer(id)))
		);

		expect(response.status).toBe(200);
		const revised = await response.json();
		expect(revised.id).toBe(memory.id);
		expect(revised.text).toBe('Sushi on Saturdays');
		expect(new Date(revised.updatedAt).getTime()).toBeGreaterThan(
			new Date(memory.updatedAt).getTime()
		);
		expect(listMemories(id)).toHaveLength(1);
		expect(listMemories(id)[0]!.text).toBe('Sushi on Saturdays');
	});

	it('returns the revised question as JSON, keeping its identity', async () => {
		const id = create('Dinner plans', 'en');
		const stored = await wonder(event(post({ text: 'When is sushi day?' }, bearer(id))));
		const question = await stored.json();

		vi.advanceTimersByTime(1);

		const response = await revise(
			event(post({ id: question.id, text: 'When is cake day?' }, bearer(id)))
		);

		expect(response.status).toBe(200);
		const revised = await response.json();
		expect(revised.id).toBe(question.id);
		expect(revised.text).toBe('When is cake day?');
		expect(listQuestions(id)).toHaveLength(1);
		expect(listQuestions(id)[0]!.text).toBe('When is cake day?');
	});
});

describe('POST /api/forget', () => {
	it('deletes the entity and returns 204 with an empty body', async () => {
		const id = create('Dinner plans', 'en');
		const stored = await remember(event(post({ text: 'Sushi on Fridays' }, bearer(id))));
		const memory = await stored.json();

		const response = await forget(event(post({ id: memory.id }, bearer(id))));

		expect(response.status).toBe(204);
		expect(await response.text()).toBe('');
		expect(listMemories(id)).toEqual([]);
	});
});
