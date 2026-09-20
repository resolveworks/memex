import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { add, remove } from "$lib/server/requests";

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	let body: { question: string };
	try {
		body = (await request.json()) as { question: string };
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}
	return json(add(memex, body.question), { status: 201 });
};

export const DELETE: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const id = url.searchParams.get("id");
	if (id === null) throw new Error("Missing request id.");
	remove(memex, id);
	return new Response(null, { status: 204 });
};
