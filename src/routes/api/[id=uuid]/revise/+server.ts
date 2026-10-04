import { requireMemex } from '#lib/server/memexes.js';
import { revise } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { id: string; text: string };
	return Response.json(revise(id, body.id, body.text));
};
