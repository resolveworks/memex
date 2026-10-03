import { randomUUID } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import type { Memory } from '$lib/memory';
import { create } from '$lib/server/memexes';
import type { ListItem, TermCount } from '$lib/server/storage';
import { answer, forget, remember, wonder } from '$lib/server/storage';
import type { Question } from '$lib/question';
import { bearer, event, get, urlEvent } from '../../tests/request';
import { thrown } from '../../tests/throws';
import { GET as context } from './context/+server';
import { GET as list } from './list/+server';
import { GET as search } from './search/+server';

describe('API auth', () => {
	for (const [route, handler] of Object.entries({ search, list, context })) {
		describe(`GET /api/${route}`, () => {
			it('rejects a missing bearer token with 401', () => {
				expect(thrown(() => handler(urlEvent(`/api/${route}`)))).toMatchObject({
					status: 401,
					body: { message: 'Missing memex id.' }
				});
			});

			it('rejects a malformed bearer token with 401', () => {
				const request = get(`/api/${route}`, `Basic ${randomUUID()}`);
				expect(thrown(() => handler({ request } as RequestEvent))).toMatchObject({
					status: 401,
					body: { message: 'Missing memex id.' }
				});
			});

			it('rejects an unknown memex id with 404', () => {
				const request = get(`/api/${route}`, bearer(randomUUID()));
				expect(thrown(() => handler({ request } as RequestEvent))).toMatchObject({
					status: 404,
					body: { message: 'No such memex.' }
				});
			});
		});
	}
});

describe('GET /api/search', () => {
	it('unions repeated q params across memories and open questions', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		remember(id, 'Cake on Saturdays');
		wonder(id, 'Which cake for dessert?');

		const response = await search(urlEvent('/api/search?q=sushi&q=cake', bearer(id)));

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

		const response = await search(urlEvent('/api/search?q=sushi', bearer(id)));

		const results = await response.json();
		expect(results.memories.map((memory: Memory) => memory.text)).toEqual(['Sushi on Fridays']);
		expect(results.questions).toEqual([]);
	});
});

describe('GET /api/list', () => {
	it('filters by kind=memory', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		wonder(id, 'When is sushi day?');

		const response = await list(urlEvent('/api/list?kind=memory', bearer(id)));

		expect(response.status).toBe(200);
		const page = await response.json();
		expect(page.items).toHaveLength(1);
		expect(page.items[0]).toMatchObject({ kind: 'memory', text: 'Sushi on Fridays' });
		expect(page.hasMore).toBe(false);
	});

	it('filters by kind=question', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		wonder(id, 'When is sushi day?');

		const response = await list(urlEvent('/api/list?kind=question', bearer(id)));

		const page = await response.json();
		expect(page.items).toHaveLength(1);
		expect(page.items[0]).toMatchObject({ kind: 'question', text: 'When is sushi day?' });
		expect(page.hasMore).toBe(false);
	});

	it('returns both kinds for any other kind value', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		wonder(id, 'When is sushi day?');

		for (const value of ['note', '']) {
			const response = await list(urlEvent(`/api/list?kind=${value}`, bearer(id)));
			const page = await response.json();
			expect(page.items.map((item: ListItem) => item.kind).sort()).toEqual(['memory', 'question']);
		}
	});

	it('pages through results with offset', async () => {
		const id = create('Catalogue', 'en');
		const texts = Array.from({ length: 51 }, (_, i) => `item ${String(i + 1).padStart(2, '0')}`);
		for (const text of texts) remember(id, text);

		const first = await list(urlEvent('/api/list', bearer(id)));
		const second = await list(urlEvent('/api/list?offset=50', bearer(id)));

		const pageOne = await first.json();
		const pageTwo = await second.json();
		expect(pageOne.items).toHaveLength(50);
		expect(pageOne.hasMore).toBe(true);
		expect(pageTwo.items).toHaveLength(1);
		expect(pageTwo.hasMore).toBe(false);
		expect([...pageOne.items, ...pageTwo.items].map((item: ListItem) => item.text).sort()).toEqual(
			[...texts].sort()
		);
	});
});

describe('GET /api/context', () => {
	it('returns the title, live-memory total, open questions, and terms', async () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		remember(id, 'Cake on Saturdays');
		const settled = wonder(id, 'When is sushi day?');
		const open = wonder(id, 'Which wine with cake?');
		answer(id, settled.id, 'Fridays');
		const forgotten = remember(id, 'Pasta on Sundays');
		forget(id, forgotten.id);

		const response = await context(event(get('/api/context', bearer(id))));

		expect(response.status).toBe(200);
		const state = await response.json();
		expect(state.title).toBe('Dinner plans');
		expect(state.memories).toBe(3);
		expect(state.questions).toEqual([
			expect.objectContaining({ id: open.id, text: 'Which wine with cake?' })
		]);
		expect(state.terms).toEqual([
			{ term: 'fridays', count: 2 },
			{ term: 'cake', count: 1 },
			{ term: 'saturdays', count: 1 },
			{ term: 'sushi', count: 1 }
		]);
	});

	it('filters terms with the memex language stopwords', async () => {
		const id = create('Essenspläne', 'de');
		remember(id, 'Der the Hund');

		const response = await context(event(get('/api/context', bearer(id))));

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

		const response = await context(event(get('/api/context', bearer(id))));

		const state = await response.json();
		expect(state.terms).toHaveLength(50);
		expect(state.terms[0]).toEqual({ term: 'w03', count: 2 });
		const shown = state.terms.map((term: TermCount) => term.term);
		expect(new Set(shown).size).toBe(50);
		expect(shown).not.toContain('w55');
	});
});
