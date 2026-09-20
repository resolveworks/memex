import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { memexes } from "./db/schema";

/** Creates a memex and returns its id, which is unguessable and doubles as its only credential. */
export function create(): string {
	const id = randomUUID();
	db.insert(memexes).values({ id, createdAt: new Date().toISOString() }).run();
	return id;
}

export function exists(id: string): boolean {
	return db.select({ id: memexes.id }).from(memexes).where(eq(memexes.id, id)).get() !== undefined;
}
