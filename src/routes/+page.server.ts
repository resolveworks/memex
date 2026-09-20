import { redirect } from "@sveltejs/kit";
import { create } from "$lib/server/memexes";
import type { Actions } from "./$types";

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = data.get("title");
		const language = data.get("language");
		if (typeof title !== "string" || typeof language !== "string") {
			throw new Error("Missing memex title or language.");
		}
		redirect(303, `/${create(title, language)}`);
	}
} satisfies Actions;
