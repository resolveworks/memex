import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { search } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const { id } = requireMemex(params.id);
	return json(search(id, url.searchParams.getAll('q')));
};
