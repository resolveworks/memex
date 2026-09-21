import { read } from "$lib/server/known";
import { getMany } from "$lib/server/memexes";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const memexes = getMany(read(cookies)).map(({ id, title }) => ({ id, title }));
	return { locale: locals.locale, memexes };
};
