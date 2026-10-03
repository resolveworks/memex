import { json, type RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { list, type Kind } from "$lib/server/storage";

export const GET: RequestHandler = ({ request, url }) => {
	const memex = memexId(request);
	const kindParam = url.searchParams.get("kind");
	const kind: Kind | undefined =
		kindParam === "memory" || kindParam === "question" ? kindParam : undefined;
	const offset = Number(url.searchParams.get("offset") ?? 0);
	return json(list(memex, kind, offset));
};
