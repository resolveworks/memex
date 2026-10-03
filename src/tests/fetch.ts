import { afterEach, beforeEach, vi, type Mock } from 'vitest';

/** A successful response carrying `body` as JSON. */
export function ok(body: unknown): Response {
	return new Response(JSON.stringify(body));
}

/** A response carrying nothing but a failure status. */
export function failure(status: number): Response {
	return new Response('denied', { status });
}

/** Installs a `fetch` double for each test and returns it, reset between tests. */
export function useFetchMock(): Mock<typeof fetch> {
	const mock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal('fetch', mock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		mock.mockReset();
	});

	return mock;
}
