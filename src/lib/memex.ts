import { page } from '$app/state';

/** The path of an API route under the memex in the current URL. */
export function api(path: string): string {
	const id = page.params.id;
	if (!id) throw new Error('No memex in the current URL.');
	return `/api/${id}/${path}`;
}
