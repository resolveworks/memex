import { randomUUID } from "node:crypto";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { stopwords } from "$lib/languages";
import type { Memory } from "$lib/memory";
import { PAGE_SIZE, type Page } from "$lib/page";
import { db } from "./db";
import { memories } from "./db/schema";
import { tokenize } from "./tokenize";

/** A memex's memories; deleted ones are included only when asked for. */
function scope(memexId: string, includeDeleted: boolean) {
	return and(
		eq(memories.memexId, memexId),
		includeDeleted ? undefined : isNull(memories.deletedAt)
	);
}

function newestFirst(memexId: string, includeDeleted: boolean) {
	return db
		.select()
		.from(memories)
		.where(scope(memexId, includeDeleted))
		.orderBy(desc(memories.updatedAt));
}

export function list(memexId: string, includeDeleted = false): Memory[] {
	return newestFirst(memexId, includeDeleted).all();
}

/** Total number of live memories in a memex. */
export function total(memexId: string): number {
	return db
		.select({ value: count() })
		.from(memories)
		.where(scope(memexId, false))
		.get()!.value;
}

/** One page of a memex's live memories, most recently updated first. */
export function page(memexId: string, offset: number): Page<Memory> {
	const rows = newestFirst(memexId, false)
		.limit(PAGE_SIZE + 1)
		.offset(offset)
		.all();
	return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export function create(memexId: string, text: string): Memory {
	const now = new Date().toISOString();
	const memory: Memory = {
		id: randomUUID(),
		text,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};
	db.insert(memories).values({ memexId, ...memory }).run();
	return memory;
}

export function update(memexId: string, id: string, text: string): Memory {
	const memory = db
		.update(memories)
		.set({ text, updatedAt: new Date().toISOString() })
		.where(
			and(eq(memories.memexId, memexId), eq(memories.id, id), isNull(memories.deletedAt))
		)
		.returning()
		.get();
	if (!memory) throw new Error(`No memory with id "${id}".`);
	return memory;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.update(memories)
		.set({ deletedAt: new Date().toISOString() })
		.where(
			and(eq(memories.memexId, memexId), eq(memories.id, id), isNull(memories.deletedAt))
		)
		.run();
	if (result.changes === 0) throw new Error(`No memory with id "${id}".`);
}

export interface TermCount {
	term: string;
	count: number;
}

/** Most common terms across a memex's live memories, by number of memories containing each. */
export function terms(memexId: string, language: string, limit: number): TermCount[] {
	const stop = stopwords[language];
	if (!stop) throw new Error(`No stopwords for language "${language}".`);

	const rows = db
		.select({ text: memories.text })
		.from(memories)
		.where(scope(memexId, false))
		.all();

	const counts = new Map<string, number>();
	for (const { text } of rows) {
		for (const term of new Set(tokenize(text))) {
			if (stop.has(term)) continue;
			counts.set(term, (counts.get(term) ?? 0) + 1);
		}
	}

	return [...counts]
		.map(([term, count]) => ({ term, count }))
		.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
		.slice(0, limit);
}

export function search(memexId: string, queries: string[], includeDeleted = false): Memory[] {
	const terms = queries.flatMap(tokenize);
	const all = list(memexId, includeDeleted);
	if (terms.length === 0) return all;
	return all.filter((memory) => {
		const haystack = memory.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
