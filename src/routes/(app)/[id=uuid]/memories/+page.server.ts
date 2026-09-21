import { list } from "$lib/server/storage";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => ({ memories: list(params.id) });
