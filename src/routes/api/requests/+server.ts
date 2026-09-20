import { json, type RequestHandler } from "@sveltejs/kit";
import { add, remove } from "$lib/server/requests";

export const POST: RequestHandler = async ({ request }) => {
	let body: { question: string };
	try {
		body = (await request.json()) as { question: string };
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}
	return json(add(body.question), { status: 201 });
};

export const DELETE: RequestHandler = ({ url }) => {
	const id = url.searchParams.get("id");
	if (id === null) throw new Error("Missing request id.");
	remove(id);
	return new Response(null, { status: 204 });
};
