import { error } from "@sveltejs/kit";
import { forget, remember } from "$lib/server/known";
import { get } from "$lib/server/memexes";
import { list } from "$lib/server/requests";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ params, cookies }) => {
	const memex = get(params.id);
	if (!memex) {
		forget(cookies, params.id);
		error(404, "No such memex.");
	}
	remember(cookies, memex.id);
	return { memex, requestCount: list(params.id).length };
};
