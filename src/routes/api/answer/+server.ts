import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { answer } from "$lib/server/storage";

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { question: string; text: string };
	return json(answer(memex, body.question, body.text), { status: 201 });
};
