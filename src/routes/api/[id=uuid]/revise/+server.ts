import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { revise } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { id: string; text: string };
	return json(revise(id, body.id, body.text));
};
