import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { terms } from "$lib/server/storage";

export const GET: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const limit = Number(url.searchParams.get("limit") ?? 50);
	return json(terms(memex, limit));
};
