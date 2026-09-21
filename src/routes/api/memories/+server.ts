import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { create, page, remove, search, update } from "$lib/server/storage";

export const GET: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const queries = url.searchParams.getAll("q");
	if (queries.length > 0) return json(search(memex, queries));
	const offset = Number(url.searchParams.get("offset") ?? 0);
	return json(page(memex, offset));
};

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { text: string };
	return json(create(memex, body.text), { status: 201 });
};

export const PATCH: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { id: string; text: string };
	return json(update(memex, body.id, body.text));
};

export const DELETE: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const id = url.searchParams.get("id");
	if (id === null) throw new Error("Missing memory id.");
	remove(memex, id);
	return new Response(null, { status: 204 });
};
