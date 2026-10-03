import { describe, expect, it } from 'vitest';
import { isRedirect, type Cookies, type Redirect } from '@sveltejs/kit';
import { create, get } from '$lib/server/memexes';
import { FakeCookies } from '../tests/cookies';
import { load } from './+layout.server';
import { actions } from './+page.server';
import type { LayoutServerLoadEvent, RequestEvent } from './$types';

// A UUIDv4: the version and variant bits are what make the id unguessable.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Runs the action and returns the redirect it threw, asserting it redirected. */
async function redirectOf(run: () => Promise<unknown>): Promise<Redirect> {
	try {
		await run();
	} catch (err) {
		if (isRedirect(err)) return err;
	}
	throw new Error('expected the action to redirect');
}

/** A form-encoded POST request carrying the given fields. */
function postForm(fields: Record<string, string>): Request {
	return new Request('http://memex.test/', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(fields)
	});
}

describe('root layout load', () => {
	it('returns the cookie-ordered memexes as { id, title } plus the locale', () => {
		const dinner = create('Dinner plans', 'en');
		const supper = create('Supper plans', 'de');
		const breakfast = create('Breakfast plans', 'fr');
		const cookies: Cookies = new FakeCookies({ memexes: [breakfast, supper, dinner].join(',') });
		const event = { cookies, locals: { locale: 'de' } } as LayoutServerLoadEvent;

		expect(load(event)).toEqual({
			locale: 'de',
			memexes: [
				{ id: breakfast, title: 'Breakfast plans' },
				{ id: supper, title: 'Supper plans' },
				{ id: dinner, title: 'Dinner plans' }
			]
		});
	});
});

describe('create action', () => {
	it('redirects (303) to the new memex, persisting its title and language', async () => {
		const request = postForm({ title: 'Dinner plans', language: 'de' });
		const event = { request } as RequestEvent;

		const redirect = await redirectOf(() => actions.default(event));

		expect(redirect.status).toBe(303);
		const id = redirect.location.slice(1);
		expect(id).toMatch(uuid);
		const memex = get(id)!;
		expect(memex.title).toBe('Dinner plans');
		expect(memex.language).toBe('de');
	});

	it('throws on a missing title', async () => {
		const request = postForm({ language: 'de' });
		const event = { request } as RequestEvent;
		await expect(actions.default(event)).rejects.toThrow('Missing memex title or language.');
	});

	it('throws on a missing language', async () => {
		const request = postForm({ title: 'Dinner plans' });
		const event = { request } as RequestEvent;
		await expect(actions.default(event)).rejects.toThrow('Missing memex title or language.');
	});

	it('throws on a non-string field', async () => {
		const data = new FormData();
		data.append('title', new File(['Dinner plans'], 'title.txt', { type: 'text/plain' }));
		data.append('language', 'de');
		const request = new Request('http://memex.test/', { method: 'POST', body: data });
		const event = { request } as RequestEvent;
		await expect(actions.default(event)).rejects.toThrow('Missing memex title or language.');
	});
});
