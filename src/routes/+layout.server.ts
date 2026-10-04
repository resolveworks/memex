import { read } from '#lib/server/known.js';
import { getMany } from '#lib/server/memexes.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const memexes = getMany(read(cookies)).map(({ id, title }) => ({ id, title }));
	return { locale: locals.locale, memexes };
};
