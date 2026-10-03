import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { answer } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { question: string; text: string };
	return json(answer(id, body.question, body.text), { status: 201 });
};
