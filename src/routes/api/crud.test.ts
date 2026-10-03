import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { create } from '$lib/server/memexes';
import { listMemories } from '$lib/server/storage';
import { event, post, type ApiEvent } from '../../tests/request';
import { POST as answer } from './[id=uuid]/answer/+server';
import { POST as forget } from './[id=uuid]/forget/+server';
import { POST as remember } from './[id=uuid]/remember/+server';
import { POST as revise } from './[id=uuid]/revise/+server';
import { POST as wonder } from './[id=uuid]/wonder/+server';

const handlers: Record<string, (event: ApiEvent) => unknown> = {
	remember,
	wonder,
	answer,
	revise,
	forget
};

describe('unknown memex', () => {
	for (const [route, handler] of Object.entries(handlers)) {
		describe(`POST /api/:id/${route}`, () => {
			it('rejects an unknown memex id with 404', async () => {
				const request = post({});
				await expect(handler(event(request, randomUUID()))).rejects.toMatchObject({
					status: 404,
					body: { message: 'No such memex.' }
				});
			});
		});
	}
});

describe('POST /api/:id/remember', () => {
	it('stores the fact and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const response = await remember(event(post({ text: 'Sushi on Fridays' }), id));

		expect(response.status).toBe(201);
		const memory = await response.json();
		expect(memory.text).toBe('Sushi on Fridays');
	});
});

describe('POST /api/:id/wonder', () => {
	it('records the question and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const response = await wonder(event(post({ text: 'When is sushi day?' }), id));

		expect(response.status).toBe(201);
		const question = await response.json();
		expect(question.text).toBe('When is sushi day?');
	});
});

describe('POST /api/:id/answer', () => {
	it('stores a memory answering the question and returns it as 201 JSON', async () => {
		const id = create('Dinner plans', 'en');
		const asked = await wonder(event(post({ text: 'When is sushi day?' }), id));
		const question = await asked.json();

		const response = await answer(event(post({ question: question.id, text: 'Fridays' }), id));

		expect(response.status).toBe(201);
		const memory = await response.json();
		expect(memory.text).toBe('Fridays');
		expect(memory.answers).toBe(question.id);
	});

	it('rejects an unknown question id', async () => {
		const id = create('Dinner plans', 'en');
		const unknown = randomUUID();
		const request = post({ question: unknown, text: 'Fridays' });
		await expect(answer(event(request, id))).rejects.toThrow(`No question with id "${unknown}".`);
	});
});

describe('POST /api/:id/revise', () => {
	it('returns the revised memory as JSON, keeping its identity', async () => {
		const id = create('Dinner plans', 'en');
		const stored = await remember(event(post({ text: 'Sushi on Fridays' }), id));
		const memory = await stored.json();

		const response = await revise(event(post({ id: memory.id, text: 'Sushi on Saturdays' }), id));

		expect(response.status).toBe(200);
		const revised = await response.json();
		expect(revised.id).toBe(memory.id);
		expect(revised.text).toBe('Sushi on Saturdays');
	});
});

describe('POST /api/:id/forget', () => {
	it('deletes the entity and returns 204 with an empty body', async () => {
		const id = create('Dinner plans', 'en');
		const stored = await remember(event(post({ text: 'Sushi on Fridays' }), id));
		const memory = await stored.json();

		const response = await forget(event(post({ id: memory.id }), id));

		expect(response.status).toBe(204);
		expect(await response.text()).toBe('');
		expect(listMemories(id)).toEqual([]);
	});
});
