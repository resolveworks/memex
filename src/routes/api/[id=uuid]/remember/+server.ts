import { requireMemex } from '#lib/server/memexes.js';
import { remember } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { text: string };
	return Response.json(remember(id, body.text), { status: 201 });
};
