import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { ContentsItem } from '$lib/contents';
import { create, type Memex } from '$lib/server/memexes';
import {
	answer,
	forget,
	listAll,
	remember,
	revisionsOf,
	revise,
	wonder
} from '$lib/server/storage';
import { useFrozenClock } from '../../../tests/clock';
import { FakeCookies } from '../../../tests/cookies';
import { thrown } from '../../../tests/throws';
import { load as loadLayout } from './+layout.server';
import type { LayoutServerLoadEvent } from './$types';
import { actions as contentsActions, load as loadContents } from './contents/+page.server';
import type {
	PageServerLoadEvent as ContentsLoadEvent,
	RequestEvent as ContentsActionEvent
} from './contents/$types';

// The handlers are annotated with SvelteKit's generated load types, which
// erase the concrete return shape, so the tests state what they return.
interface LayoutData {
	memex: Memex;
}

interface ContentsPage {
	items: ContentsItem[];
	query: string;
	page: number;
	pages: number;
}

const tick = useFrozenClock();

/** The slice of the layout event the handler reads: params and cookies. */
function layoutEvent(id: string, cookies: Cookies): LayoutServerLoadEvent {
	return { params: { id }, cookies } as LayoutServerLoadEvent;
}

/** The slice of a page load event the handler reads: params and url. */
function contentsEvent(id: string, url: URL): ContentsLoadEvent {
	return { params: { id }, url } as ContentsLoadEvent;
}

function loadContentsPage(id: string, url: URL): ContentsPage {
	return loadContents(contentsEvent(id, url)) as ContentsPage;
}

/** A form-encoded POST as a form on the page submits it. */
function contentsFormEvent(id: string, fields: Record<string, string>): ContentsActionEvent {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return {
		params: { id },
		request: new Request('http://memex.test/contents?/action', { method: 'POST', body: form })
	} as ContentsActionEvent;
}

describe('the app layout load', () => {
	it('forgets an unknown memex from the cookie and throws 404', () => {
		const other = randomUUID();
		const unknown = randomUUID();
		const cookies = new FakeCookies({ memexes: `${unknown},${other}` });

		const failure = thrown(() => loadLayout(layoutEvent(unknown, cookies)));

		expect(failure).toMatchObject({ status: 404, body: { message: 'No such memex.' } });
		expect(cookies.get('memexes')).toBe(other);
	});

	it('records the memex in the cookie', () => {
		const id = create('Dinner plans', 'en');
		const other = randomUUID();
		const cookies = new FakeCookies({ memexes: other });

		const data = loadLayout(layoutEvent(id, cookies)) as LayoutData;

		expect(cookies.get('memexes')).toBe(`${id},${other}`);
		expect(data.memex).toMatchObject({ id, title: 'Dinner plans' });
	});
});

describe('the contents page load', () => {
	it('lists every memory and question, deleted ones included, newest first', () => {
		const id = create('Dinner plans', 'en');
		const memory = remember(id, 'Sushi on Fridays');
		tick();
		const question = wonder(id, 'When is taco day?');
		tick();
		const gone = remember(id, 'Tacos on Tuesdays');
		forget(id, gone.id);

		const data = loadContentsPage(id, new URL('http://memex.test/contents'));

		expect(data.query).toBe('');
		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.items.map((item) => item.text)).toEqual([
			'Tacos on Tuesdays',
			'When is taco day?',
			'Sushi on Fridays'
		]);
		const byId = new Map(data.items.map((item) => [item.id, item]));
		expect(byId.get(memory.id)).toMatchObject({ kind: 'memory', deletedAt: null });
		expect(byId.get(question.id)).toMatchObject({ kind: 'question', deletedAt: null });
		expect(byId.get(gone.id)?.deletedAt).not.toBeNull();
	});

	it('omits questions a live memory answers', () => {
		const id = create('Dinner plans', 'en');
		const question = wonder(id, 'When is sushi day?');
		tick();
		const settled = answer(id, question.id, 'Sushi is on Fridays');

		const data = loadContentsPage(id, new URL('http://memex.test/contents'));

		expect(data.items.map((item) => item.id)).toEqual([settled.id]);
	});

	it('carries each entity’s revisions, newest first', () => {
		const id = create('Dinner plans', 'en');
		const memory = remember(id, 'Sushi on Fridays');
		tick();
		revise(id, memory.id, 'Sushi on Saturdays');

		const data = loadContentsPage(id, new URL('http://memex.test/contents'));

		const entry = data.items.find((item) => item.id === memory.id)!;
		expect(entry.revisions.map((revision) => revision.text)).toEqual([
			'Sushi on Saturdays',
			'Sushi on Fridays'
		]);
		expect(entry.updatedAt).toBe(entry.revisions[0].createdAt);
	});

	it('reopens a question when its only answer is forgotten', () => {
		const id = create('Dinner plans', 'en');
		const question = wonder(id, 'When is sushi day?');
		tick();
		const settled = answer(id, question.id, 'Sushi is on Fridays');
		forget(id, settled.id);

		const data = loadContentsPage(id, new URL('http://memex.test/contents'));

		expect(data.items.map((item) => item.id)).toContain(question.id);
	});

	it('searches matching memories and questions, deleted ones included', () => {
		const id = create('Dinner plans', 'en');
		remember(id, 'Sushi on Fridays');
		tick();
		const gone = wonder(id, 'Which sushi place?');
		forget(id, gone.id);
		tick();
		wonder(id, 'Tacos or burritos?');

		const data = loadContentsPage(id, new URL('http://memex.test/contents?q=sushi'));

		expect(data.query).toBe('sushi');
		expect(data.items.map((item) => item.text)).toEqual(['Which sushi place?', 'Sushi on Fridays']);
	});

	it('serves twenty entries per page and reports ceil(count / 20) pages', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			if (i % 2 === 0) wonder(id, `Entry ${i}`);
			else remember(id, `Entry ${i}`);
			tick();
		}
		const newestFirst = Array.from({ length: 45 }, (_, i) => `Entry ${45 - i}`);

		const first = loadContentsPage(id, new URL('http://memex.test/contents'));
		expect(first.page).toBe(1);
		expect(first.pages).toBe(3);
		expect(first.items.map((item) => item.text)).toEqual(newestFirst.slice(0, 20));

		const second = loadContentsPage(id, new URL('http://memex.test/contents?page=2'));
		expect(second.page).toBe(2);
		expect(second.items.map((item) => item.text)).toEqual(newestFirst.slice(20, 40));

		const third = loadContentsPage(id, new URL('http://memex.test/contents?page=3'));
		expect(third.page).toBe(3);
		expect(third.items.map((item) => item.text)).toEqual(newestFirst.slice(40));
	});

	it('clamps an out-of-range page into [1, pages]', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			remember(id, `Fact ${i}`);
			tick();
		}

		const tooHigh = loadContentsPage(id, new URL('http://memex.test/contents?page=99'));
		expect(tooHigh.page).toBe(3);
		expect(tooHigh.items.map((item) => item.text)).toEqual(
			Array.from({ length: 5 }, (_, i) => `Fact ${5 - i}`)
		);

		for (const page of ['0', '-2']) {
			const tooLow = loadContentsPage(id, new URL(`http://memex.test/contents?page=${page}`));
			expect(tooLow.page).toBe(1);
			expect(tooLow.items).toHaveLength(20);
		}
	});

	it('falls back to page 1 for a non-integer page', () => {
		const id = create('Dinner plans', 'en');
		for (let i = 1; i <= 45; i++) {
			remember(id, `Fact ${i}`);
			tick();
		}

		for (const page of ['abc', '2.5']) {
			const data = loadContentsPage(id, new URL(`http://memex.test/contents?page=${page}`));
			expect(data.page).toBe(1);
			expect(data.items).toHaveLength(20);
		}
	});

	it('reports one page at minimum for an empty memex', () => {
		const id = create('Dinner plans', 'en');

		const data = loadContentsPage(id, new URL('http://memex.test/contents'));

		expect(data.page).toBe(1);
		expect(data.pages).toBe(1);
		expect(data.items).toEqual([]);
	});
});

describe('the contents page delete action', () => {
	it('forgets the memory whose id the form posts', async () => {
		const id = create('Dinner plans', 'en');
		const kept = remember(id, 'Sushi on Fridays');
		tick();
		const gone = remember(id, 'Sushi on Saturdays');

		await contentsActions.delete(contentsFormEvent(id, { id: gone.id }));

		expect(listAll(id).map((entry) => entry.id)).toEqual([kept.id]);
		expect(listAll(id, true).find((entry) => entry.id === gone.id)?.deletedAt).not.toBeNull();
	});

	it('forgets the question whose id the form posts', async () => {
		const id = create('Dinner plans', 'en');
		const kept = wonder(id, 'When is sushi day?');
		tick();
		const gone = wonder(id, 'When is taco day?');

		await contentsActions.delete(contentsFormEvent(id, { id: gone.id }));

		expect(listAll(id).map((entry) => entry.id)).toEqual([kept.id]);
		expect(listAll(id, true).find((entry) => entry.id === gone.id)?.deletedAt).not.toBeNull();
	});
});

describe('the contents page restore action', () => {
	it('revives the forgotten entity whose id the form posts', async () => {
		const id = create('Dinner plans', 'en');
		const memory = remember(id, 'Sushi on Fridays');
		forget(id, memory.id);

		await contentsActions.restore(contentsFormEvent(id, { id: memory.id }));

		expect(listAll(id).map((entry) => entry.id)).toEqual([memory.id]);
	});
});

describe('the contents page revert action', () => {
	it('makes the posted revision current again', async () => {
		const id = create('Dinner plans', 'en');
		const memory = remember(id, 'Sushi on Fridays');
		tick();
		revise(id, memory.id, 'Sushi on Saturdays');
		const oldest = revisionsOf(id, [memory.id]).at(-1)!;

		await contentsActions.revert(contentsFormEvent(id, { id: memory.id, seq: String(oldest.seq) }));

		expect(listAll(id).map((entry) => entry.text)).toEqual(['Sushi on Fridays']);
	});
});
