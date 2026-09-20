import { json, type RequestHandler } from "@sveltejs/kit";
import { add } from "$lib/server/requests";

export const POST: RequestHandler = async ({ request }) => {
	let body: { question: string };
	try {
		body = (await request.json()) as { question: string };
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}
	return json(add(body.question), { status: 201 });
};
