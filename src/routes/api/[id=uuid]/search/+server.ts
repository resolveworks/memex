import { requireMemex } from '#lib/server/memexes.js';
import { search } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const { id } = requireMemex(params.id);
	return Response.json(search(id, url.searchParams.getAll('q')));
};
