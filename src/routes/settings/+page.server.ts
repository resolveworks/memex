import { list as listMemories, remove as removeMemory } from "$lib/server/storage";
import { list as listRequests, remove as removeRequest } from "$lib/server/requests";
import type { Actions } from "./$types";

export function load() {
	return { memories: listMemories(), requests: listRequests() };
}

export const actions = {
	delete: async ({ request }) => {
		const key = (await request.formData()).get("key");
		if (typeof key !== "string") throw new Error("Missing memory key.");
		removeMemory(key);
	},
	deleteRequest: async ({ request }) => {
		const id = (await request.formData()).get("id");
		if (typeof id !== "string") throw new Error("Missing request id.");
		removeRequest(id);
	}
} satisfies Actions;
