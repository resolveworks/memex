import { json, type RequestHandler } from "@sveltejs/kit";
import { create } from "$lib/server/memexes";

export const POST: RequestHandler = async ({ request }) => {
	const { title, language } = (await request.json()) as { title: string; language: string };
	return json({ id: create(title, language) }, { status: 201 });
};
