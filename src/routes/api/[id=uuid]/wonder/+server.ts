import { requireMemex } from '#lib/server/memexes.js';
import { wonder } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { text: string };
	return Response.json(wonder(id, body.text), { status: 201 });
};
