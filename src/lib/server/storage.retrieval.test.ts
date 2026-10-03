import { describe, expect, it } from 'vitest';
import { PAGE_SIZE } from '$lib/page';
import { useFrozenClock } from '../../tests/clock';
import { create } from './memexes';
import { answer, forget, list, remember, revise, search, terms, wonder } from './storage';

const tick = useFrozenClock();

describe('search', () => {
	it('matches any token of any query, case-insensitively, across memories and open questions', () => {
		const memex = create('Food', 'en');
		remember(memex, 'Pizza on Friday');
		remember(memex, 'Sushi on Monday');
		wonder(memex, 'What about TACOS?');

		const hits = search(memex, ['sushi rice', 'taco']);
		expect(hits.memories.map((memory) => memory.text)).toEqual(['Sushi on Monday']);
		expect(hits.questions.map((question) => question.text)).toEqual(['What about TACOS?']);
	});

	it('splits queries on punctuation, so "pizza-party" matches "Pizza on Friday"', () => {
		const memex = create('Food', 'en');
		remember(memex, 'Pizza on Friday');

		const hits = search(memex, ['pizza-party']);
		expect(hits.memories.map((memory) => memory.text)).toEqual(['Pizza on Friday']);
	});

	it('searches only live memories and open questions', () => {
		const memex = create('Food', 'en');
		const forgotten = remember(memex, 'Ancient pizza');
		forget(memex, forgotten.id);
		const answered = wonder(memex, 'Which pizza place?');
		answer(memex, answered.id, 'The place on the corner');

		const hits = search(memex, ['pizza']);
		expect(hits.memories).toEqual([]);
		expect(hits.questions).toEqual([]);
	});

	it('returns every recorded question, answered or not, when forgotten entities count', () => {
		const memex = create('Food', 'en');
		const answered = wonder(memex, 'Which pizza place?');
		answer(memex, answered.id, 'The place on the corner');
		tick();
		const forgotten = wonder(memex, 'Best pizza downtown?');
		forget(memex, forgotten.id);

		const hits = search(memex, ['pizza'], true);
		expect(hits.questions.map((question) => question.text)).toEqual([
			'Best pizza downtown?',
			'Which pizza place?'
		]);
	});
});

describe('list', () => {
	it('interleaves memories and open questions, newest update first', () => {
		const memex = create('Food', 'en');
		remember(memex, 'Oldest memory');
		tick();
		wonder(memex, 'Middle question');
		tick();
		remember(memex, 'Newest memory');

		const page = list(memex, undefined, 0);
		expect(page.items.map((item) => [item.kind, item.text])).toEqual([
			['memory', 'Newest memory'],
			['question', 'Middle question'],
			['memory', 'Oldest memory']
		]);
	});

	it('moves a revised memory back to the top', () => {
		const memex = create('Food', 'en');
		const memory = remember(memex, 'Old text');
		tick();
		wonder(memex, 'A question in between');
		tick();
		revise(memex, memory.id, 'New text');

		const page = list(memex, undefined, 0);
		expect(page.items.map((item) => item.text)).toEqual(['New text', 'A question in between']);
	});

	it('omits questions that a live memory answers', () => {
		const memex = create('Food', 'en');
		const question = wonder(memex, 'Where to eat?');
		answer(memex, question.id, 'The pizzeria');

		const page = list(memex, undefined, 0);
		expect(page.items.map((item) => [item.kind, item.text])).toEqual([['memory', 'The pizzeria']]);
	});

	it('returns only memories for kind "memory" and only open questions for kind "question"', () => {
		const memex = create('Food', 'en');
		remember(memex, 'A memory');
		wonder(memex, 'A question');

		expect(list(memex, 'memory', 0).items.map((item) => item.kind)).toEqual(['memory']);
		expect(list(memex, 'question', 0).items.map((item) => item.kind)).toEqual(['question']);
	});

	it('caps pages at PAGE_SIZE and sets hasMore only when more remain', () => {
		const memex = create('Food', 'en');
		for (let i = 0; i < PAGE_SIZE; i++) {
			remember(memex, `Memory ${i}`);
			tick();
		}

		let page = list(memex, undefined, 0);
		expect(page.items).toHaveLength(PAGE_SIZE);
		expect(page.hasMore).toBe(false);

		remember(memex, 'One more');
		page = list(memex, undefined, 0);
		expect(page.items).toHaveLength(PAGE_SIZE);
		expect(page.hasMore).toBe(true);
		expect(page.items.map((item) => item.text).slice(0, 2)).toEqual([
			'One more',
			`Memory ${PAGE_SIZE - 1}`
		]);

		const rest = list(memex, undefined, PAGE_SIZE);
		expect(rest.items.map((item) => item.text)).toEqual(['Memory 0']);
		expect(rest.hasMore).toBe(false);
	});
});

describe('terms', () => {
	it('counts the live memories containing each non-stopword term, ties broken alphabetically', () => {
		const memex = create('Food', 'en');
		remember(memex, 'Pizza on Friday');
		remember(memex, 'Pizza pizza');
		remember(memex, 'Sushi breakfast');

		expect(terms(memex, 'en', 10)).toEqual([
			{ term: 'pizza', count: 2 },
			{ term: 'breakfast', count: 1 },
			{ term: 'friday', count: 1 },
			{ term: 'sushi', count: 1 }
		]);
	});

	it('caps the result at the limit', () => {
		const memex = create('Food', 'en');
		remember(memex, 'Pizza on Friday');
		remember(memex, 'Pizza pizza');
		remember(memex, 'Sushi breakfast');

		expect(terms(memex, 'en', 2)).toEqual([
			{ term: 'pizza', count: 2 },
			{ term: 'breakfast', count: 1 }
		]);
	});

	it('counts only live memories', () => {
		const memex = create('Food', 'en');
		const forgotten = remember(memex, 'Sushi breakfast');
		remember(memex, 'Sushi dinner');
		forget(memex, forgotten.id);

		expect(terms(memex, 'en', 10)).toEqual([
			{ term: 'dinner', count: 1 },
			{ term: 'sushi', count: 1 }
		]);
	});
});
