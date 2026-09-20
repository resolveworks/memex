import { and, desc, eq } from "drizzle-orm";
import type { Memory } from "$lib/memory";
import { db } from "./db";
import { memories } from "./db/schema";

export function list(memexId: string): Memory[] {
	return db
		.select({ key: memories.key, value: memories.value, updatedAt: memories.updatedAt })
		.from(memories)
		.where(eq(memories.memexId, memexId))
		.orderBy(desc(memories.updatedAt))
		.all();
}

export function put(memexId: string, key: string, value: string): Memory {
	const memory: Memory = { key, value, updatedAt: new Date().toISOString() };
	db.insert(memories)
		.values({ memexId, ...memory })
		.onConflictDoUpdate({
			target: [memories.memexId, memories.key],
			set: { value: memory.value, updatedAt: memory.updatedAt }
		})
		.run();
	return memory;
}

export function remove(memexId: string, key: string): void {
	const result = db
		.delete(memories)
		.where(and(eq(memories.memexId, memexId), eq(memories.key, key)))
		.run();
	if (result.changes === 0) throw new Error(`No memory with key "${key}".`);
}

export function search(memexId: string, queries: string[]): Memory[] {
	const terms = queries
		.flatMap((query) => query.toLowerCase().split(/[^\p{L}\p{N}]+/u))
		.filter(Boolean);
	const all = list(memexId);
	if (terms.length === 0) return all;
	return all.filter((memory) => {
		const haystack = `${memory.key}\n${memory.value}`.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
