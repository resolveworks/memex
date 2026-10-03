import type { RequestEvent } from '@sveltejs/kit';

/** A JSON POST request. */
export function post(body: unknown): Request {
	return new Request('http://memex.test/api', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

/** A GET request to `path`. */
export function get(path: string): Request {
	return new Request(`http://memex.test${path}`);
}

/** A form-encoded POST, as a submitting `<form>` sends it. */
export function postForm(fields: Record<string, string>): Request {
	return new Request('http://memex.test/', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(fields)
	});
}

/** The request event shape API handler tests build: the memex `id` route param. */
export type ApiEvent = RequestEvent<{ id: string }, never>;

/** The slice of `RequestEvent` an API handler reads: `request` plus the route `params`. */
export function event(request: Request, id?: string): ApiEvent {
	return { request, params: id === undefined ? {} : { id } } as ApiEvent;
}

/** Like `event`, with the parsed `url` that query-reading handlers need. */
export function urlEvent(path: string, id?: string): ApiEvent {
	const request = get(path);
	return {
		request,
		params: id === undefined ? {} : { id },
		url: new URL(request.url)
	} as ApiEvent;
}
