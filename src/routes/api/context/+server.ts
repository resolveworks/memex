import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { list } from "$lib/server/requests";
import { total } from "$lib/server/storage";

/** The memex state the client rebuilds the system prompt from before each turn. */
export const GET: RequestHandler = ({ request }) => {
	const memex = memexId(request);
	return json({ memories: total(memex), requests: list(memex) });
};
