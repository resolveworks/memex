import type { RequestEvent } from '@sveltejs/kit';

/** The authorization header value that identifies a memex. */
export function bearer(id: string): string {
	return `Bearer ${id}`;
}

/** A JSON POST request; omit `authorization` to send it without credentials. */
export function post(body: unknown, authorization?: string): Request {
	const headers: Record<string, string> = { 'content-type': 'application/json' };
	if (authorization !== undefined) headers.authorization = authorization;
	return new Request('http://memex.test/api', {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});
}

/** A GET request to `path`; omit `authorization` to send it without credentials. */
export function get(path: string, authorization?: string): Request {
	const headers: Record<string, string> = {};
	if (authorization !== undefined) headers.authorization = authorization;
	return new Request(`http://memex.test${path}`, { headers });
}

/** A form-encoded POST, as a submitting `<form>` sends it. */
export function postForm(fields: Record<string, string>): Request {
	return new Request('http://memex.test/', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(fields)
	});
}

/** The slice of `RequestEvent` the API handlers read: only `request`. */
export function event(request: Request): RequestEvent {
	return { request } as RequestEvent;
}

/** The slice of `RequestEvent` the search and list handlers read: `request` plus the parsed `url`. */
export function urlEvent(path: string, authorization?: string): RequestEvent {
	const request = get(path, authorization);
	return { request, url: new URL(request.url) } as RequestEvent;
}
