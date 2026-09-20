import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Request } from "$lib/request";
import { db } from "./db";
import { requests } from "./db/schema";

export function list(memexId: string): Request[] {
	return db
		.select()
		.from(requests)
		.where(eq(requests.memexId, memexId))
		.orderBy(desc(requests.createdAt))
		.all();
}

/** Renders a memex's open request queue for inclusion in the system prompt. */
export function promptSection(memexId: string): string {
	const open = list(memexId);
	if (open.length === 0) return "# Request queue\n\nThe request queue is empty.";
	const items = open.map((request) => `- ${request.id}: ${request.question}`).join("\n");
	return `# Request queue

These questions were recorded earlier because memory did not answer them. Each line is \`id: question\`.

${items}

When a later message supplies the answer to one of these, call the \`close-request\` tool with that id to remove it from the queue.`;
}

export function add(memexId: string, question: string): Request {
	const request: Request = { id: randomUUID(), question, createdAt: new Date().toISOString() };
	db.insert(requests).values({ memexId, ...request }).run();
	return request;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.delete(requests)
		.where(and(eq(requests.memexId, memexId), eq(requests.id, id)))
		.run();
	if (result.changes === 0) throw new Error(`No request with id "${id}".`);
}
