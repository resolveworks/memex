import type { PageLoad } from './$types';

// The agent and the transcript live in the browser and are never persisted; there is nothing to render on the server.
export const ssr = false;

/** The open question the link named, if any; the greeting picks one at random otherwise. */
export const load: PageLoad = ({ url }) => ({
	question: url.searchParams.get('question') ?? undefined
});
