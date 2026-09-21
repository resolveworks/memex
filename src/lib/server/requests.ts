import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { PAGE_SIZE, type Page } from "$lib/page";
import type { Request } from "$lib/request";
import { db } from "./db";
import { requests } from "./db/schema";
import { tokenize } from "./tokenize";

/** A memex's requests; deleted ones are included only when asked for. */
function scope(memexId: string, includeDeleted: boolean) {
	return and(
		eq(requests.memexId, memexId),
		includeDeleted ? undefined : isNull(requests.deletedAt)
	);
}

function newestFirst(memexId: string, includeDeleted: boolean) {
	return db
		.select()
		.from(requests)
		.where(scope(memexId, includeDeleted))
		.orderBy(desc(requests.createdAt));
}

export function list(memexId: string, includeDeleted = false): Request[] {
	return newestFirst(memexId, includeDeleted).all();
}

/** One page of a memex's live requests, most recently created first. */
export function page(memexId: string, offset: number): Page<Request> {
	const rows = newestFirst(memexId, false)
		.limit(PAGE_SIZE + 1)
		.offset(offset)
		.all();
	return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export function create(memexId: string, text: string): Request {
	const now = new Date().toISOString();
	const request: Request = {
		id: randomUUID(),
		text,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};
	db.insert(requests).values({ memexId, ...request }).run();
	return request;
}

export function update(memexId: string, id: string, text: string): Request {
	const request = db
		.update(requests)
		.set({ text, updatedAt: new Date().toISOString() })
		.where(
			and(eq(requests.memexId, memexId), eq(requests.id, id), isNull(requests.deletedAt))
		)
		.returning()
		.get();
	if (!request) throw new Error(`No request with id "${id}".`);
	return request;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.update(requests)
		.set({ deletedAt: new Date().toISOString() })
		.where(
			and(eq(requests.memexId, memexId), eq(requests.id, id), isNull(requests.deletedAt))
		)
		.run();
	if (result.changes === 0) throw new Error(`No request with id "${id}".`);
}

export function search(memexId: string, queries: string[], includeDeleted = false): Request[] {
	const terms = queries.flatMap(tokenize);
	const all = list(memexId, includeDeleted);
	if (terms.length === 0) return all;
	return all.filter((request) => {
		const haystack = request.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
