import { requireMemex } from '#lib/server/memexes.js';
import { forget } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { id: string };
	forget(id, body.id);
	return new Response(null, { status: 204 });
};
