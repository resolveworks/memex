import { error } from "@sveltejs/kit";
import { get } from "$lib/server/memexes";
import { list as listRequests } from "$lib/server/requests";
import { list as listMemories } from "$lib/server/storage";
import type { RequestHandler } from "./$types";

/** The title with anything a filename can't hold removed; "memex" when nothing is left. */
function filename(title: string): string {
	const safe = title
		.replace(/[^a-zA-Z0-9 _-]+/g, "")
		.trim()
		.replace(/\s+/g, "-");
	return `${safe || "memex"}.json`;
}

export const GET: RequestHandler = ({ params }) => {
	const memex = get(params.id);
	if (!memex) error(404, "No such memex.");

	// An export is a complete copy: soft-deleted rows included, flagged by deletedAt.
	const body = JSON.stringify(
		{
			memex,
			memories: listMemories(memex.id, true),
			requests: listRequests(memex.id, true)
		},
		null,
		2
	);

	return new Response(body, {
		headers: {
			"content-type": "application/json",
			"content-disposition": `attachment; filename="${filename(memex.title)}"`
		}
	});
};
