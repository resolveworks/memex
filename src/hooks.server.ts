import type { Handle } from '@sveltejs/kit/hooks';
import { readLocale } from '#lib/server/locale.js';

export const handle: Handle = ({ event, resolve }) => {
	event.locals.locale = readLocale(event.cookies, event.request);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.locale)
	});
};
