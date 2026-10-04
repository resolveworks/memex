import { defineParams } from '@sveltejs/kit/params';

/** Memex ids are UUIDs; everything else is a normal route. */
function matchUuid(param: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
}

export const params = defineParams({
	uuid: (param) => (matchUuid(param) ? param : undefined)
});
