import type { RequestHandler } from "@sveltejs/kit";
import { memexId } from "$lib/server/auth";
import { forget } from "$lib/server/storage";

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	const body = (await request.json()) as { id: string };
	forget(memex, body.id);
	return new Response(null, { status: 204 });
};
