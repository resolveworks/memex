import { page } from "$app/state";

/** The memex id from the current URL, sent to the server as the bearer credential. */
export function memexId(): string {
	const id = page.params.id;
	if (!id) throw new Error("No memex in the current URL.");
	return id;
}
