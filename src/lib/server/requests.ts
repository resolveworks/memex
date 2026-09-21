import { randomUUID } from "node:crypto";
import { and, count, desc, eq } from "drizzle-orm";
import { PAGE_SIZE, type Page } from "$lib/page";
import type { Request } from "$lib/request";
import { db } from "./db";
import { requests } from "./db/schema";

function newestFirst(memexId: string) {
	return db
		.select()
		.from(requests)
		.where(eq(requests.memexId, memexId))
		.orderBy(desc(requests.createdAt));
}

export function list(memexId: string): Request[] {
	return newestFirst(memexId).all();
}

/** Total number of requests in a memex. */
export function total(memexId: string): number {
	return db
		.select({ value: count() })
		.from(requests)
		.where(eq(requests.memexId, memexId))
		.get()!.value;
}

/** One page of a memex's requests, most recently created first. */
export function page(memexId: string, offset: number): Page<Request> {
	const rows = newestFirst(memexId)
		.limit(PAGE_SIZE + 1)
		.offset(offset)
		.all();
	return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

/** Renders a memex's open request queue for inclusion in the system prompt. */
export function promptSection(memexId: string): string {
	const open = list(memexId);
	if (open.length === 0) return "# Request queue\n\nThe request queue is empty.";
	const items = open.map((request) => `- ${request.id}: ${request.text}`).join("\n");
	return `# Request queue

These questions were recorded earlier because memory did not answer them. Each line is \`id: question\`.

${items}

When a later message supplies the answer to one of these, call the \`delete-request\` tool with that id to remove it from the queue.`;
}

export function create(memexId: string, text: string): Request {
	const now = new Date().toISOString();
	const request: Request = { id: randomUUID(), text, createdAt: now, updatedAt: now };
	db.insert(requests).values({ memexId, ...request }).run();
	return request;
}

export function update(memexId: string, id: string, text: string): Request {
	const request = db
		.update(requests)
		.set({ text, updatedAt: new Date().toISOString() })
		.where(and(eq(requests.memexId, memexId), eq(requests.id, id)))
		.returning()
		.get();
	if (!request) throw new Error(`No request with id "${id}".`);
	return request;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.delete(requests)
		.where(and(eq(requests.memexId, memexId), eq(requests.id, id)))
		.run();
	if (result.changes === 0) throw new Error(`No request with id "${id}".`);
}

export function search(memexId: string, queries: string[]): Request[] {
	const terms = queries
		.flatMap((query) => query.toLowerCase().split(/[^\p{L}\p{N}]+/u))
		.filter(Boolean);
	const all = list(memexId);
	if (terms.length === 0) return all;
	return all.filter((request) => {
		const haystack = request.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
