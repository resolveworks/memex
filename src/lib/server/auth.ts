import { error } from "@sveltejs/kit";
import { exists } from "./memexes";

/** Reads the memex id from the bearer token and rejects unknown ids. */
export function memexId(request: Request): string {
	const header = request.headers.get("authorization");
	if (!header?.startsWith("Bearer ")) error(401, "Missing memex id.");
	const id = header.slice("Bearer ".length);
	if (!exists(id)) error(404, "No such memex.");
	return id;
}
