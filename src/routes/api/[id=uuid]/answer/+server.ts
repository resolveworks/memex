import { requireMemex } from '#lib/server/memexes.js';
import { answer } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = requireMemex(params.id);
	const body = (await request.json()) as { question: string; text: string };
	return Response.json(answer(id, body.question, body.text), { status: 201 });
};
