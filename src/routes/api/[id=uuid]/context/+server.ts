import { json } from '@sveltejs/kit';
import { requireMemex } from '$lib/server/memexes';
import { openQuestions, terms, total } from '$lib/server/storage';
import type { RequestHandler } from './$types';

/** How many topic terms the system prompt shows. */
const TERM_LIMIT = 50;

/** The memex state the client rebuilds the system prompt from before each turn. */
export const GET: RequestHandler = ({ params }) => {
	const { id, title, language } = requireMemex(params.id);
	return json({
		title,
		memories: total(id),
		questions: openQuestions(id),
		terms: terms(id, language, TERM_LIMIT)
	});
};
