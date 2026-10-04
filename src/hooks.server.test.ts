import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { Handle, ResolveOptions } from '@sveltejs/kit/hooks';
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

	it('falls back to accept-language when there is no cookie', async () => {
		const event = visit(new FakeCookies(), { 'accept-language': 'sv-SE,sv' });
		const response = await handle({ event, resolve });
		expect(event.locals.locale).toBe('sv');
		expect(await response.text()).toBe('<html lang="sv"><body>Memex</body></html>');
	});
});
