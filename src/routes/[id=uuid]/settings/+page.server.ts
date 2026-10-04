import { setLocale } from '$lib/server/locale';
import { rename } from '$lib/server/memexes';
import type { Actions } from './$types';

export const actions = {
	rename: async ({ params, request }) => {
		const title = (await request.formData()).get('title');
		if (typeof title !== 'string') throw new Error('Missing memex title.');
		rename(params.id, title);
	},
	locale: async ({ cookies, locals, request }) => {
		locals.locale = setLocale(cookies, (await request.formData()).get('locale'));
	}
} satisfies Actions;
