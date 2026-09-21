import { randomUUID } from "node:crypto";
import { and, count, desc, eq } from "drizzle-orm";
import type { Memory } from "$lib/memory";
import { PAGE_SIZE, type Page } from "$lib/page";
import { db } from "./db";
import { memories } from "./db/schema";

function newestFirst(memexId: string) {
	return db
		.select()
		.from(memories)
		.where(eq(memories.memexId, memexId))
		.orderBy(desc(memories.updatedAt));
}

export function list(memexId: string): Memory[] {
	return newestFirst(memexId).all();
}

/** Total number of memories in a memex. */
export function total(memexId: string): number {
	return db
		.select({ value: count() })
		.from(memories)
		.where(eq(memories.memexId, memexId))
		.get()!.value;
}

/** One page of a memex's memories, most recently updated first. */
export function page(memexId: string, offset: number): Page<Memory> {
	const rows = newestFirst(memexId)
		.limit(PAGE_SIZE + 1)
		.offset(offset)
		.all();
	return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export function create(memexId: string, text: string): Memory {
	const now = new Date().toISOString();
	const memory: Memory = { id: randomUUID(), text, createdAt: now, updatedAt: now };
	db.insert(memories).values({ memexId, ...memory }).run();
	return memory;
}

export function update(memexId: string, id: string, text: string): Memory {
	const memory = db
		.update(memories)
		.set({ text, updatedAt: new Date().toISOString() })
		.where(and(eq(memories.memexId, memexId), eq(memories.id, id)))
		.returning()
		.get();
	if (!memory) throw new Error(`No memory with id "${id}".`);
	return memory;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.delete(memories)
		.where(and(eq(memories.memexId, memexId), eq(memories.id, id)))
		.run();
	if (result.changes === 0) throw new Error(`No memory with id "${id}".`);
}

export interface TermCount {
	term: string;
	count: number;
}

/** Most common terms across a memex's memories, by number of memories containing each. */
export function terms(memexId: string, limit: number): TermCount[] {
	const rows = db
		.select({ text: memories.text })
		.from(memories)
		.where(eq(memories.memexId, memexId))
		.all();

	const counts = new Map<string, number>();
	for (const { text } of rows) {
		for (const term of new Set(tokenize(text))) {
			if (term.length < 3) continue;
			counts.set(term, (counts.get(term) ?? 0) + 1);
		}
	}

	return [...counts]
		.map(([term, count]) => ({ term, count }))
		.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
		.slice(0, limit);
}

/** Splits text into the lowercase terms used by search and term statistics. */
function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

export function search(memexId: string, queries: string[]): Memory[] {
	const terms = queries.flatMap(tokenize);
	const all = list(memexId);
	if (terms.length === 0) return all;
	return all.filter((memory) => {
		const haystack = memory.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
