import { json, type RequestHandler } from "@sveltejs/kit";
import { list, put, search } from "$lib/server/storage";

export const GET: RequestHandler = ({ url }) => {
	const query = url.searchParams.get("q");
	return json(query === null ? list() : search(query));
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
