import { json, type RequestHandler } from "@sveltejs/kit";
import { list, put, search } from "$lib/server/storage";

export const GET: RequestHandler = ({ url }) => {
	const queries = url.searchParams.getAll("q");
	return json(queries.length === 0 ? list() : search(queries));
};

export const POST: RequestHandler = async ({ request }) => {
	let body: { key: string; value: string };
	try {
		body = (await request.json()) as { key: string; value: string };
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}
	return json(put(body.key, body.value), { status: 201 });
};
