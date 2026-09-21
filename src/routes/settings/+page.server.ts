import { setLocale } from "$lib/server/locale";
import type { Actions } from "./$types";

export const actions = {
	locale: async ({ cookies, locals, request }) => {
		locals.locale = setLocale(cookies, (await request.formData()).get("locale"));
	}
} satisfies Actions;
