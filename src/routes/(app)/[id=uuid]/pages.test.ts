import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { Memory } from '$lib/memory';
import type { Question } from '$lib/question';
import { create, type Memex } from '$lib/server/memexes';
import { answer, forget, listMemories, listQuestions, remember, wonder } from '$lib/server/storage';
import { FakeCookies } from '../../../tests/cookies';
import { load as loadLayout } from './+layout.server';
import type { LayoutServerLoadEvent } from './$types';
import { actions as memoriesActions, load as loadMemories } from './memories/+page.server';
import type {
	PageServerLoadEvent as MemoriesLoadEvent,
	RequestEvent as MemoriesActionEvent
} from './memories/$types';
import { actions as questionsActions, load as loadQuestions } from './questions/+page.server';
import type {
	PageServerLoadEvent as QuestionsLoadEvent,
	RequestEvent as QuestionsActionEvent
} from './questions/$types';

// The handlers are annotated with SvelteKit's generated load types, which
// erase the concrete return shape, so the tests state what they return.
interface LayoutData {
	memex: Memex;
	questionCount: number;
}

interface MemoriesPage {
	memories: Memory[];
	query: string;
	page: number;
	pages: number;
}

interface QuestionsPage {
	questions: Question[];
	query: string;
	page: number;
	pages: number;
}

// now() has millisecond resolution, so consecutive writes can tie and make
// ordering flaky. Fake time and advance it between writes instead.
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
});

const tick = () => vi.advanceTimersByTime(1);

/** Runs a sync function and returns what it threw, asserting it threw. */
function thrown(run: () => unknown): unknown {
	try {
		run();
	} catch (err) {
		return err;
	}
	throw new Error('expected the call to throw');
}

/** The slice of the layout event the handler reads: params and cookies. */
function layoutEvent(id: string, cookies: Cookies): LayoutServerLoadEvent {
	return { params: { id }, cookies } as LayoutServerLoadEvent;
}

/** The slice of a page load event the handlers read: params and url. */
function memoriesEvent(id: string, url: URL): MemoriesLoadEvent {
	return { params: { id }, url } as MemoriesLoadEvent;
}

function questionsEvent(id: string, url: URL): QuestionsLoadEvent {
	return { params: { id }, url } as QuestionsLoadEvent;
}

function loadMemoriesPage(id: string, url: URL): MemoriesPage {
	return loadMemories(memoriesEvent(id, url)) as MemoriesPage;
}

function loadQuestionsPage(id: string, url: URL): QuestionsPage {
	return loadQuestions(questionsEvent(id, url)) as QuestionsPage;
}

/** A form-encoded POST as the delete forms submit it, carrying the entity id. */
function memoriesDeleteEvent(id: string, entityId: string): MemoriesActionEvent {
	const form = new FormData();
	form.set('id', entityId);
	return {
		params: { id },
		request: new Request('http://memex.test/memories?/delete', { method: 'POST', body: form })
	} as MemoriesActionEvent;
}

function questionsDeleteEvent(id: string, entityId: string): QuestionsActionEvent {
	const form = new FormData();
	form.set('id', entityId);
	return {
		params: { id },
		request: new Request('http://memex.test/questions?/delete', { method: 'POST', body: form })
	} as QuestionsActionEvent;
}

describe('the app layout load', () => {
	it('forgets an unknown memex from the cookie and throws 404', () => {
		const other = create('Supper plans', 'en');
		const unknown = randomUUID();
		const cookies = new FakeCookies({ memexes: `${unknown},${other}` });

		const failure = thrown(() => loadLayout(layoutEvent(unknown, cookies)));

		expect(failure).toMatchObject({ status: 404, body: { message: 'No such memex.' } });
		expect(cookies.get('memexes')).toBe(other);
	});

	it('records the memex in the cookie and returns its open-question count', () => {
		const id = create('Dinner plans', 'en');
		const other = create('Supper plans', 'en');
		const settled = wonder(id, 'When is sushi day?');
		answer(id, settled.id, 'Sushi on Fridays');
		wonder(id, 'What about tacos?');
		const cookies = new FakeCookies({ memexes: other });

		const data = loadLayout(layoutEvent(id, cookies)) as LayoutData;

		expect(cookies.get('memexes')).toBe(`${id},${other}`);
		expect(data.memex).toMatchObject({ id, title: 'Dinner plans' });
		expect(data.questionCount).toBe(1);
	});
});

describe('the memories page load', () => {
	it('lists every memory, deleted ones included, when there is no query', () => {
		const id = create('Dinner plans', 'en');
		const live = remember(id, 'Sushi on Fridays');
		tick();
		const gone = remember(id, 'Tacos on Tuesdays');
		forget(id, gone.id);

		const data = loadMemoriesPage(id, new URL('http://memex.test/memories'));

		expect(data.query).toBe('');
		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.memories.map((memory) => memory.text)).toEqual([
			'Tacos on Tuesdays',
			'Sushi on Fridays'
		]);
		const byId = new Map(data.memories.map((memory) => [memory.id, memory]));
		expect(byId.get(live.id)?.deletedAt).toBeNull();
		expect(byId.get(gone.id)?.deletedAt).not.toBeNull();
	});

	it('searches matching memories, deleted ones included', () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		tick();
		const gone = remember(id, 'Sushi on Saturdays');
		forget(id, gone.id);
		tick();
		remember(id, 'Tacos on Tuesdays');

		const data = loadMemoriesPage(id, new URL('http://memex.test/memories?q=sushi'));

		expect(data.query).toBe('sushi');
		expect(data.memories.map((memory) => memory.text)).toEqual([
			'Sushi on Saturdays',
			'Sushi on Fridays'
		]);
	});

	it('serves twenty memories per page and reports ceil(count / 20) pages', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			remember(id, `Fact ${i}`);
			tick();
		}
		const newestFirst = Array.from({ length: 45 }, (_, i) => `Fact ${45 - i}`);

		const first = loadMemoriesPage(id, new URL('http://memex.test/memories'));
		expect(first.page).toBe(1);
		expect(first.pages).toBe(3);
		expect(first.memories.map((memory) => memory.text)).toEqual(newestFirst.slice(0, 20));

		const second = loadMemoriesPage(id, new URL('http://memex.test/memories?page=2'));
		expect(second.page).toBe(2);
		expect(second.memories.map((memory) => memory.text)).toEqual(newestFirst.slice(20, 40));

		const third = loadMemoriesPage(id, new URL('http://memex.test/memories?page=3'));
		expect(third.page).toBe(3);
		expect(third.memories.map((memory) => memory.text)).toEqual(newestFirst.slice(40));
	});

	it('clamps an out-of-range page into [1, pages]', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			remember(id, `Fact ${i}`);
			tick();
		}

		const tooHigh = loadMemoriesPage(id, new URL('http://memex.test/memories?page=99'));
		expect(tooHigh.page).toBe(3);
		expect(tooHigh.memories.map((memory) => memory.text)).toEqual(
			Array.from({ length: 5 }, (_, i) => `Fact ${5 - i}`)
		);

		for (const page of ['0', '-2']) {
			const tooLow = loadMemoriesPage(id, new URL(`http://memex.test/memories?page=${page}`));
			expect(tooLow.page).toBe(1);
			expect(tooLow.memories).toHaveLength(20);
		}
	});

	it('falls back to page 1 for a non-integer page', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			remember(id, `Fact ${i}`);
			tick();
		}

		for (const page of ['abc', '2.5']) {
			const data = loadMemoriesPage(id, new URL(`http://memex.test/memories?page=${page}`));
			expect(data.page).toBe(1);
			expect(data.memories).toHaveLength(20);
		}
	});

	it('reports one page at minimum for a memex without memories', () => {
		const id = create('Dinner plans', 'en');

		const data = loadMemoriesPage(id, new URL('http://memex.test/memories'));

		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.memories).toEqual([]);
	});
});

describe('the questions page load', () => {
	it('lists every question, deleted ones included, when there is no query', () => {
		const id = create('Dinner plans', 'en');
		const live = wonder(id, 'When is sushi day?');
		tick();
		const gone = wonder(id, 'When is taco day?');
		forget(id, gone.id);

		const data = loadQuestionsPage(id, new URL('http://memex.test/questions'));

		expect(data.query).toBe('');
		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.questions.map((question) => question.text)).toEqual([
			'When is taco day?',
			'When is sushi day?'
		]);
		const byId = new Map(data.questions.map((question) => [question.id, question]));
		expect(byId.get(live.id)?.deletedAt).toBeNull();
		expect(byId.get(gone.id)?.deletedAt).not.toBeNull();
	});

	it('searches matching questions, deleted ones included', () => {
		const id = create('Dinner plans', 'en');
		const gone = wonder(id, 'Which sushi place?');
		forget(id, gone.id);
		tick();
		wonder(id, 'Tacos or burritos?');

		const data = loadQuestionsPage(id, new URL('http://memex.test/questions?q=sushi'));

		expect(data.query).toBe('sushi');
		expect(data.questions.map((question) => question.text)).toEqual(['Which sushi place?']);
	});

	it('clamps the page into [1, pages] and reports ceil(count / 20) pages', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 25; i++) {
			wonder(id, `Question ${i}`);
			tick();
		}

		const first = loadQuestionsPage(id, new URL('http://memex.test/questions'));
		expect(first.page).toBe(1);
		expect(first.pages).toBe(2);
		expect(first.questions).toHaveLength(20);

		const tooHigh = loadQuestionsPage(id, new URL('http://memex.test/questions?page=99'));
		expect(tooHigh.page).toBe(2);
		expect(tooHigh.questions.map((question) => question.text)).toEqual(
			Array.from({ length: 5 }, (_, i) => `Question ${5 - i}`)
		);

		const nonsense = loadQuestionsPage(id, new URL('http://memex.test/questions?page=abc'));
		expect(nonsense.page).toBe(1);
	});

	it('reports one page at minimum for a memex without questions', () => {
		const id = create('Dinner plans', 'en');

		const data = loadQuestionsPage(id, new URL('http://memex.test/questions'));

		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.questions).toEqual([]);
	});
});

describe('the memories page delete action', () => {
	it('forgets the memory whose id the form posts', async () => {
		const id = create('Dinner plans', 'en');
		const kept = remember(id, 'Sushi on Fridays');
		tick();
		const gone = remember(id, 'Tacos on Tuesdays');

		await memoriesActions.delete(memoriesDeleteEvent(id, gone.id));

		expect(listMemories(id).map((memory) => memory.id)).toEqual([kept.id]);
		const every = listMemories(id, true);
		expect(every.map((memory) => memory.id)).toEqual([gone.id, kept.id]);
		expect(every.find((memory) => memory.id === gone.id)?.deletedAt).not.toBeNull();
	});
});

describe('the questions page delete action', () => {
	it('forgets the question whose id the form posts', async () => {
		const id = create('Dinner plans', 'en');
		const kept = wonder(id, 'When is sushi day?');
		tick();
		const gone = wonder(id, 'When is taco day?');

		await questionsActions.delete(questionsDeleteEvent(id, gone.id));

		expect(listQuestions(id).map((question) => question.id)).toEqual([kept.id]);
		const every = listQuestions(id, true);
		expect(every.map((question) => question.id)).toEqual([gone.id, kept.id]);
		expect(every.find((question) => question.id === gone.id)?.deletedAt).not.toBeNull();
	});
});
