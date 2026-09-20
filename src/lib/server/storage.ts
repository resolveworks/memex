import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Memory } from "$lib/memory";
import { db } from "./db";
import { memories } from "./db/schema";

export function list(memexId: string): Memory[] {
	return db
		.select()
		.from(memories)
		.where(eq(memories.memexId, memexId))
		.orderBy(desc(memories.updatedAt))
		.all();
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

export function search(memexId: string, queries: string[]): Memory[] {
	const terms = queries
		.flatMap((query) => query.toLowerCase().split(/[^\p{L}\p{N}]+/u))
		.filter(Boolean);
	const all = list(memexId);
	if (terms.length === 0) return all;
	return all.filter((memory) => {
		const haystack = memory.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
