import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { list, put, search } from "$lib/server/storage";

export const GET: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const queries = url.searchParams.getAll("q");
	return json(queries.length === 0 ? list(memex) : search(memex, queries));
};

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	let body: { key: string; value: string };
	try {
		body = (await request.json()) as { key: string; value: string };
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}
	return json(put(memex, body.key, body.value), { status: 201 });
};
