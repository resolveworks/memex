import type { Handle } from "@sveltejs/kit";
import { readLocale } from "$lib/server/locale";

export const handle: Handle = ({ event, resolve }) => {
	event.locals.locale = readLocale(event.cookies, event.request);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace("%lang%", event.locals.locale)
	});
};
