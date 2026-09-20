import { json, type RequestHandler } from "@sveltejs/kit";
import { create } from "$lib/server/memexes";

export const POST: RequestHandler = () => {
	return json({ id: create() }, { status: 201 });
};
