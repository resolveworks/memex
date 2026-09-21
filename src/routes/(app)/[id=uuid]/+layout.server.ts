import { error } from "@sveltejs/kit";
import { get } from "$lib/server/memexes";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ params }) => {
	const memex = get(params.id);
	if (!memex) error(404, "No such memex.");
	return { memex };
};
