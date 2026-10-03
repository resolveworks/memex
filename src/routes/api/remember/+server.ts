import { json, type RequestHandler } from '@sveltejs/kit';
import { memexId } from '$lib/server/auth';
import { remember } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { text: string };
	return json(remember(memex, body.text), { status: 201 });
};
