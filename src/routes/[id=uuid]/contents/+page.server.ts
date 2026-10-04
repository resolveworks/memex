import type { ContentsItem, Revision } from '$lib/contents';
import { PAGE_SIZE } from '$lib/page';
import { count, forget, list, restore, revert, revisionsOf } from '$lib/server/storage';
import type { Actions, PageServerLoad } from './$types';

function pageNumber(value: string | null, pages: number): number {
	const parsed = Number(value ?? 1);
	return Math.min(Math.max(1, Number.isInteger(parsed) ? parsed : 1), pages);
}

/** Groups the flat revision rows under the entity they belong to, newest first. */
function groupRevisions(rows: (Revision & { entityId: string })[]): Map<string, Revision[]> {
	const grouped = new Map<string, Revision[]>();
	for (const { entityId, ...revision } of rows) {
		const entity = grouped.get(entityId);
		if (entity) entity.push(revision);
		else grouped.set(entityId, [revision]);
	}
	return grouped;
}

export const load: PageServerLoad = ({ params, url }) => {
	const query = url.searchParams.get('q') ?? '';
	const includeDeleted = url.searchParams.get('deleted') === '1';
	const queries = query ? [query] : [];

	const total = count(params.id, { includeDeleted, queries });
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const page = pageNumber(url.searchParams.get('page'), pages);
	const { items } = list(params.id, {
		includeDeleted,
		queries,
		offset: (page - 1) * PAGE_SIZE
	});

	const revisions = groupRevisions(
		revisionsOf(
			params.id,
			items.map((item) => item.id)
		)
	);

	return {
		items: items.map((item): ContentsItem => ({
			...item,
			revisions: revisions.get(item.id) ?? []
		})),
		query,
		includeDeleted,
		page,
		pages
	};
};

export const actions = {
	delete: async ({ params, request }) => {
		const id = (await request.formData()).get('id');
		if (typeof id !== 'string') throw new Error('Missing id.');
		forget(params.id, id);
	},
	restore: async ({ params, request }) => {
		const id = (await request.formData()).get('id');
		if (typeof id !== 'string') throw new Error('Missing id.');
		restore(params.id, id);
	},
	revert: async ({ params, request }) => {
		const form = await request.formData();
		const id = form.get('id');
		const seq = form.get('seq');
		if (typeof id !== 'string' || typeof seq !== 'string') throw new Error('Missing id or seq.');
		revert(params.id, id, Number(seq));
	}
} satisfies Actions;
