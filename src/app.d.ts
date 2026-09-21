import type { Memex } from "$lib/server/memexes";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** The UI language, resolved from the cookie or `Accept-Language`. */
			locale: string;
		}
		interface PageData {
			/** The UI language of the current request. */
			locale: string;
			/** Memexes this browser has opened, most recent first. */
			memexes: { id: string; title: string }[];
			/** The memex of the current route, set by the `[id=uuid]` layout. */
			memex?: Memex;
			/** Open (non-deleted) request count, set by the `[id=uuid]` layout. */
			requestCount?: number;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
