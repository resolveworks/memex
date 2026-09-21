import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { languages } from "$lib/languages";
import { db } from "./db";
import { memexes } from "./db/schema";

export interface Memex {
	id: string;
	title: string;
	language: string;
	createdAt: string;
}

/** Creates a memex and returns its id, which is unguessable and doubles as its only credential. */
export function create(title: string, language: string): string {
	if (title.trim() === "") throw new Error("A memex needs a title.");
	if (!languages.includes(language)) throw new Error(`Unsupported language "${language}".`);
	const id = randomUUID();
	db.insert(memexes)
		.values({ id, title, language, createdAt: new Date().toISOString() })
		.run();
	return id;
}

export function get(id: string): Memex | undefined {
	return db.select().from(memexes).where(eq(memexes.id, id)).get();
}

/** Looks up several memexes at once, returning them in the order the ids were given. */
export function getMany(ids: string[]): Memex[] {
	if (ids.length === 0) return [];
	const rows = db.select().from(memexes).where(inArray(memexes.id, ids)).all();
	const byId = new Map(rows.map((row) => [row.id, row]));
	return ids.flatMap((id) => {
		const row = byId.get(id);
		return row ? [row] : [];
	});
}

/** Renames a memex. The language is fixed for the memex's lifetime. */
export function rename(id: string, title: string): void {
	if (title.trim() === "") throw new Error("A memex needs a title.");
	db.update(memexes).set({ title }).where(eq(memexes.id, id)).run();
}

export function exists(id: string): boolean {
	return get(id) !== undefined;
}
