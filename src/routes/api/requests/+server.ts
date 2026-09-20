import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { create, remove, update } from "$lib/server/requests";

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
	if (id === null) throw new Error("Missing request id.");
	remove(memex, id);
	return new Response(null, { status: 204 });
};
