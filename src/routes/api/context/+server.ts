import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { get } from "$lib/server/memexes";
import { list } from "$lib/server/requests";
import { terms, total } from "$lib/server/storage";

/** How many topic terms the system prompt shows. */
const TERM_LIMIT = 50;

/** The memex state the client rebuilds the system prompt from before each turn. */
export const GET: RequestHandler = ({ request }) => {
	const memex = memexId(request);
	const { title, language } = get(memex)!;
	return json({
		title,
		memories: total(memex),
		requests: list(memex),
		terms: terms(memex, language, TERM_LIMIT)
	});
};
