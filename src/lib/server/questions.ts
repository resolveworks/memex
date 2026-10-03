import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { PAGE_SIZE, type Page } from "$lib/page";
import type { Question } from "$lib/question";
import { db } from "./db";
import { questions } from "./db/schema";
import { tokenize } from "./tokenize";

/** A memex's questions; deleted ones are included only when asked for. */
function scope(memexId: string, includeDeleted: boolean) {
	return and(
		eq(questions.memexId, memexId),
		includeDeleted ? undefined : isNull(questions.deletedAt)
	);
}

function newestFirst(memexId: string, includeDeleted: boolean) {
	return db
		.select()
		.from(questions)
		.where(scope(memexId, includeDeleted))
		.orderBy(desc(questions.createdAt));
}

export function list(memexId: string, includeDeleted = false): Question[] {
	return newestFirst(memexId, includeDeleted).all();
}

/** One page of a memex's live questions, most recently created first. */
export function page(memexId: string, offset: number): Page<Question> {
	const rows = newestFirst(memexId, false)
		.limit(PAGE_SIZE + 1)
		.offset(offset)
		.all();
	return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export function create(memexId: string, text: string): Question {
	const now = new Date().toISOString();
	const question: Question = {
		id: randomUUID(),
		text,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};
	db.insert(questions).values({ memexId, ...question }).run();
	return question;
}

export function update(memexId: string, id: string, text: string): Question {
	const question = db
		.update(questions)
		.set({ text, updatedAt: new Date().toISOString() })
		.where(
			and(eq(questions.memexId, memexId), eq(questions.id, id), isNull(questions.deletedAt))
		)
		.returning()
		.get();
	if (!question) throw new Error(`No question with id "${id}".`);
	return question;
}

export function remove(memexId: string, id: string): void {
	const result = db
		.update(questions)
		.set({ deletedAt: new Date().toISOString() })
		.where(
			and(eq(questions.memexId, memexId), eq(questions.id, id), isNull(questions.deletedAt))
		)
		.run();
	if (result.changes === 0) throw new Error(`No question with id "${id}".`);
}

export function search(memexId: string, queries: string[], includeDeleted = false): Question[] {
	const terms = queries.flatMap(tokenize);
	const all = list(memexId, includeDeleted);
	if (terms.length === 0) return all;
	return all.filter((question) => {
		const haystack = question.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}
