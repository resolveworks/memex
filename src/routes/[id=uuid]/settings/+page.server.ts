import { list as listMemories, remove as removeMemory } from "$lib/server/storage";
import { list as listRequests, remove as removeRequest } from "$lib/server/requests";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
	return { memories: listMemories(params.id), requests: listRequests(params.id) };
};

export const actions = {
	delete: async ({ params, request }) => {
		const key = (await request.formData()).get("key");
		if (typeof key !== "string") throw new Error("Missing memory key.");
		removeMemory(params.id, key);
	},
	deleteRequest: async ({ params, request }) => {
		const id = (await request.formData()).get("id");
		if (typeof id !== "string") throw new Error("Missing request id.");
		removeRequest(params.id, id);
	}
} satisfies Actions;
