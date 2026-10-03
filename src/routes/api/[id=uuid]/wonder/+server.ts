import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { wonder } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { text: string };
	return json(wonder(id, body.text), { status: 201 });
};
