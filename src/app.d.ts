import type { Memex } from "$lib/server/memexes";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
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
