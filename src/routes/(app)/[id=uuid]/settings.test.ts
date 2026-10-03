import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { create, get } from '$lib/server/memexes';
import { answer, forget, remember, revise, wonder } from '$lib/server/storage';
import { FakeCookies } from '../../../tests/cookies';
import { postForm } from '../../../tests/request';
import { actions as rootActions } from '../../settings/+page.server';
import { actions } from './settings/+page.server';
import { GET } from './settings/export/+server';

// The event types the handlers are generated to expect, so partial events cast cleanly.
type SettingsEvent = Parameters<(typeof actions)['rename']>[0];
type RootSettingsEvent = Parameters<(typeof rootActions)['locale']>[0];
type ExportEvent = Parameters<typeof GET>[0];

describe('settings actions', () => {
	describe('rename', () => {
		it('persists the new title', async () => {
			const id = create('Dinner plans', 'en');
			const event = {
				params: { id },
				request: postForm({ title: 'Supper plans' })
			} as SettingsEvent;

			await actions.rename(event);

			expect(get(id)!.title).toBe('Supper plans');
		});

		it('throws on a blank title', async () => {
			const id = create('Dinner plans', 'en');
			const event = { params: { id }, request: postForm({ title: '   ' }) } as SettingsEvent;

			await expect(actions.rename(event)).rejects.toThrow('A memex needs a title.');
		});
	});

	describe('locale', () => {
		it('sets the cookie and updates locals.locale', async () => {
			const cookies: Cookies = new FakeCookies();
			const locals: App.Locals = { locale: 'en' };
			const event = {
				cookies,
				locals,
				request: postForm({ locale: 'de' })
			} as SettingsEvent;

			await actions.locale(event);

			expect(cookies.get('locale')).toBe('de');
			expect(locals.locale).toBe('de');
		});
	});
});

describe('root settings actions', () => {
	describe('locale', () => {
		it('sets the cookie and updates locals.locale', async () => {
			const cookies: Cookies = new FakeCookies();
			const locals: App.Locals = { locale: 'en' };
			const event = { cookies, locals, request: postForm({ locale: 'sv' }) } as RootSettingsEvent;

			await rootActions.locale(event);

			expect(cookies.get('locale')).toBe('sv');
			expect(locals.locale).toBe('sv');
		});
	});
});

describe('GET /(app)/[id=uuid]/settings/export', () => {
	it('returns the complete record, forgotten entities included, as pretty-printed JSON', async () => {
		const id = create('Dinner plans', 'en');
		const sushi = remember(id, 'Sushi on Fridays');
		const question = wonder(id, 'When is sushi day?');
		answer(id, question.id, 'Fridays');
		revise(id, sushi.id, 'Sushi on Saturdays');
		forget(id, sushi.id);

		const response = await GET({ params: { id } } as ExportEvent);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json');
		const body = await response.text();
		const record = JSON.parse(body);
		expect(body).toBe(JSON.stringify(record, null, 2));
		expect(record.memex).toEqual(get(id));
		expect(record.memories).toHaveLength(2);
		const forgotten = record.memories.find((memory: { id: string }) => memory.id === sushi.id);
		expect(forgotten).toMatchObject({ text: 'Sushi on Saturdays', deletedAt: expect.any(String) });
		const settled = record.memories.find(
			(memory: { answers: string | null }) => memory.answers === question.id
		);
		expect(settled).toMatchObject({ text: 'Fridays', deletedAt: null });
		expect(record.questions).toHaveLength(1);
		expect(record.questions[0]).toMatchObject({
			id: question.id,
			text: 'When is sushi day?',
			deletedAt: null
		});
	});

	it('names the download after the title, stripped and dash-joined', async () => {
		const id = create('Dinner  plans? (2024)', 'en');

		const response = await GET({ params: { id } } as ExportEvent);

		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="Dinner-plans-2024.json"'
		);
	});

	it('falls back to "memex" when the title leaves nothing filename-safe', async () => {
		const id = create('夕食', 'en');

		const response = await GET({ params: { id } } as ExportEvent);

		expect(response.headers.get('content-disposition')).toBe('attachment; filename="memex.json"');
	});

	it('rejects an unknown id with 404', async () => {
		const event = { params: { id: randomUUID() } } as ExportEvent;

		// The handler throws synchronously, so wrap the call to assert the rejection.
		await expect(async () => GET(event)).rejects.toMatchObject({
			status: 404,
			body: { message: 'No such memex.' }
		});
	});
});
