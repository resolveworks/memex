import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Memory } from '$lib/memory';
import { create } from '$lib/server/memexes';
import type { TermCount } from '$lib/server/storage';
import { answer, forget, remember, wonder } from '$lib/server/storage';
import type { Question } from '$lib/question';
import { urlEvent, type ApiEvent } from '../../tests/request';
import { thrown } from '../../tests/throws';
import { GET as context } from './[id=uuid]/context/+server';
import { GET as search } from './[id=uuid]/search/+server';

describe('unknown memex', () => {
	const handlers: Record<string, (event: ApiEvent) => unknown> = { search, context };
	for (const [route, handler] of Object.entries(handlers)) {
		describe(`GET /api/:id/${route}`, () => {
			it('rejects an unknown memex id with 404', () => {
				expect(thrown(() => handler(urlEvent(`/api/${route}`, randomUUID())))).toMatchObject({
					status: 404,
					body: { message: 'No such memex.' }
				});
			});
		});
	}
});

describe('GET /api/:id/search', () => {
	it('unions repeated q params across memories and open questions', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		remember(id, 'Cake on Saturdays');
		wonder(id, 'Which cake for dessert?');

		const response = await search(urlEvent('/api/search?q=sushi&q=cake', id));

		expect(response.status).toBe(200);
		const results = await response.json();
		expect(results.memories.map((memory: Memory) => memory.text).sort()).toEqual([
			'Cake on Saturdays',
			'Sushi on Fridays'
		]);
		expect(results.questions.map((question: Question) => question.text)).toEqual([
			'Which cake for dessert?'
		]);
	});

	it('narrows to a single q param', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		remember(id, 'Cake on Saturdays');

		const response = await search(urlEvent('/api/search?q=sushi', id));

		const results = await response.json();
		expect(results.memories.map((memory: Memory) => memory.text)).toEqual(['Sushi on Fridays']);
	});
});

describe('GET /api/:id/context', () => {
	it('returns the title, live-memory total, open question count, chosen question, and terms', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		remember(id, 'Cake on Saturdays');
		const settled = wonder(id, 'When is sushi day?');
		const open = wonder(id, 'Which wine with cake?');
		answer(id, settled.id, 'Fridays');
		const forgotten = remember(id, 'Pasta on Sundays');
		forget(id, forgotten.id);

		const response = await context(urlEvent('/api/context', id));

		expect(response.status).toBe(200);
		const state = await response.json();
		expect(state.title).toBe('Dinner plans');
		expect(state.memories).toBe(3);
		expect(state.openQuestions).toBe(1);
		expect(state.question).toMatchObject({ id: open.id, text: 'Which wine with cake?' });
		expect(state.terms).toEqual([
			{ term: 'fridays', count: 2 },
			{ term: 'cake', count: 1 },
			{ term: 'saturdays', count: 1 },
			{ term: 'sushi', count: 1 }
		]);
	});

	it('asks the question named by the question parameter', async () => {
		const id = create('Dinner plans', 'en');
		wonder(id, 'Which wine with cake?');
		const wanted = wonder(id, 'When is sushi day?');

		const response = await context(urlEvent(`/api/context?question=${wanted.id}`, id));

		const state = await response.json();
		expect(state.openQuestions).toBe(2);
		expect(state.question).toMatchObject({ id: wanted.id, text: 'When is sushi day?' });
	});

	it('falls back to an open question when the named one is no longer open', async () => {
		const id = create('Dinner plans', 'en');
		const settled = wonder(id, 'When is sushi day?');
		answer(id, settled.id, 'Fridays');
		const open = wonder(id, 'Which wine with cake?');

		const response = await context(urlEvent(`/api/context?question=${settled.id}`, id));

		const state = await response.json();
		expect(state.openQuestions).toBe(1);
		expect(state.question).toMatchObject({ id: open.id, text: 'Which wine with cake?' });
	});

	it('reports no question when none is open', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');

		const response = await context(urlEvent('/api/context', id));

		const state = await response.json();
		expect(state.openQuestions).toBe(0);
		expect(state.question).toBeUndefined();
	});

	it('filters terms with the memex language stopwords', async () => {
		const id = create('Essenspläne', 'de');
		remember(id, 'Der the Hund');

		const response = await context(urlEvent('/api/context', id));

		const state = await response.json();
		expect(state.terms).toEqual([
			{ term: 'hund', count: 1 },
			{ term: 'the', count: 1 }
		]);
	});

	it('caps terms at 50, keeping the most common', async () => {
		const id = create('Glossary', 'en');
		const words = Array.from({ length: 55 }, (_, i) => `w${String(i + 1).padStart(2, '0')}`);
		remember(id, words.join(' '));
		remember(id, 'w03');

		const response = await context(urlEvent('/api/context', id));

		const state = await response.json();
		expect(state.terms).toHaveLength(50);
		expect(state.terms[0]).toEqual({ term: 'w03', count: 2 });
		const shown = state.terms.map((term: TermCount) => term.term);
		expect(shown).not.toContain('w55');
	});
});
