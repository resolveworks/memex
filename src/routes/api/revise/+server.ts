import { json, type RequestHandler } from '@sveltejs/kit';
import { memexId } from '$lib/server/auth';
import { revise } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { id: string; text: string };
	return json(revise(memex, body.id, body.text));
};
