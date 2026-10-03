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

/** The slice of `RequestEvent` the API handlers read: only `request`. */
export function event(request: Request): RequestEvent {
	return { request } as RequestEvent;
}
