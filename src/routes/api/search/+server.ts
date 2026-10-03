import { json, type RequestHandler } from '@sveltejs/kit';
import { memexId } from '$lib/server/auth';
import { search } from '$lib/server/storage';

export const GET: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	return json(search(memex, url.searchParams.getAll('q')));
};
