import type { Cookies, Handle, RequestEvent, ResolveOptions } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';
import { FakeCookies } from './tests/cookies';

const page = '<html lang="%lang%"><body>Memex</body></html>';

/** The slice of `RequestEvent` the hook reads: cookies, request, and locals. */
function visit(cookies: Cookies, headers: Record<string, string> = {}): RequestEvent {
	return {
		cookies,
		request: new Request('http://memex.test/', { headers }),
		locals: { locale: '' }
	} as RequestEvent;
}

/** Renders `page` as SvelteKit renders `app.html`: through the hook's chunk transform. */
const resolve: Parameters<Handle>[0]['resolve'] = async (_, opts) => {
	// The hook always passes its transform to `resolve`; treat the options as required.
	const { transformPageChunk } = opts as Required<ResolveOptions>;
	return new Response(await transformPageChunk({ html: page, done: true }));
};

describe('the server handle hook', () => {
	it('sets the locale from the cookie, preferring it over accept-language', async () => {
		const event = visit(new FakeCookies({ locale: 'cs' }), { 'accept-language': 'de' });
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('cs');
		expect(await response.text()).toBe('<html lang="cs"><body>Memex</body></html>');
	});

	it('falls back to accept-language when the cookie names an unsupported language', async () => {
		const event = visit(new FakeCookies({ locale: 'klingon' }), {
			'accept-language': 'fr-CA,fr;q=0.9,en;q=0.8'
		});
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('fr');
		expect(await response.text()).toBe('<html lang="fr"><body>Memex</body></html>');
	});

	it('falls back to accept-language when there is no cookie', async () => {
		const event = visit(new FakeCookies(), { 'accept-language': 'sv-SE,sv;q=0.9' });
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('sv');
		expect(await response.text()).toBe('<html lang="sv"><body>Memex</body></html>');
	});

	it('defaults to english with no cookie and no accept-language', async () => {
		const event = visit(new FakeCookies());
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('en');
		expect(await response.text()).toBe('<html lang="en"><body>Memex</body></html>');
	});

	it('defaults to english when accept-language offers no supported language', async () => {
		const event = visit(new FakeCookies(), { 'accept-language': 'ja,zh-CN;q=0.9' });
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('en');
		expect(await response.text()).toBe('<html lang="en"><body>Memex</body></html>');
	});
});
