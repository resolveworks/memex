import { requireMemex } from '#lib/server/memexes.js';
import { openQuestions, pickQuestion, terms, total } from '#lib/server/storage.js';
import type { RequestHandler } from './$types';

/** How many topic terms the system prompt shows. */
const TERM_LIMIT = 50;

/** The memex state the client rebuilds the system prompt from before each turn. */
export const GET: RequestHandler = ({ params, url }) => {
	const { id, title, language } = requireMemex(params.id);
	return Response.json({
		title,
		memories: total(id),
		openQuestions: openQuestions(id),
		question: pickQuestion(id, url.searchParams.get('question') ?? undefined),
		terms: terms(id, language, TERM_LIMIT)
	});
};
