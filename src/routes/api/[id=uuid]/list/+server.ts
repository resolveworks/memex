import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { list, type Kind } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const { id } = requireMemex(params.id);
	const kindParam = url.searchParams.get('kind');
	const kind: Kind | undefined =
		kindParam === 'memory' || kindParam === 'question' ? kindParam : undefined;
	const offset = Number(url.searchParams.get('offset') ?? 0);
	return json(list(id, kind, offset));
};
