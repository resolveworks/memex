import { list } from "$lib/server/requests";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => ({ requests: list(params.id) });
