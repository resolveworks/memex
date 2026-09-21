import { list, remove, search } from "$lib/server/requests";
import type { Actions, PageServerLoad } from "./$types";

const PAGE_SIZE = 20;

function pageNumber(value: string | null, pages: number): number {
	const parsed = Number(value ?? 1);
	return Math.min(Math.max(1, Number.isInteger(parsed) ? parsed : 1), pages);
}

export const load: PageServerLoad = ({ params, url }) => {
	const query = url.searchParams.get("q") ?? "";
	const matches = query ? search(params.id, [query]) : list(params.id);
	const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
	const page = pageNumber(url.searchParams.get("page"), pages);
	return {
		requests: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		query,
		page,
		pages
	};
};

export const actions = {
	delete: async ({ params, request }) => {
		const id = (await request.formData()).get("id");
		if (typeof id !== "string") throw new Error("Missing request id.");
		remove(params.id, id);
	}
} satisfies Actions;
