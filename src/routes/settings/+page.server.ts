import { list, remove } from "$lib/server/storage";
import type { Actions } from "./$types";

export function load() {
	return { memories: list() };
}

export const actions = {
	delete: async ({ request }) => {
		const key = (await request.formData()).get("key");
		if (typeof key !== "string") throw new Error("Missing memory key.");
		remove(key);
	}
} satisfies Actions;
