import { error } from "@sveltejs/kit";
import { exists } from "$lib/server/memexes";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
	if (!exists(params.id)) error(404, "No such memex.");
};
