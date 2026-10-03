import { randomUUID } from 'node:crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { stopwords } from '$lib/languages';
import type { Memory } from '$lib/memory';
import { PAGE_SIZE, type Page } from '$lib/page';
import type { Question } from '$lib/question';
import { db } from './db';
import { memories, questions } from './db/schema';
import { tokenize } from './tokenize';

type MemoryRow = typeof memories.$inferSelect;
type QuestionRow = typeof questions.$inferSelect;

export type Kind = 'memory' | 'question';

export interface ListItem {
	id: string;
	kind: Kind;
	text: string;
	createdAt: string;
	updatedAt: string;
}

export interface TermCount {
	term: string;
	count: number;
}

/** The fields shared by every revision row. */
interface RevisionRow {
	entityId: string;
	createdAt: string;
	deletedAt: string | null;
}

interface Resolved<R> {
	row: R;
	made: string;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * Picks the revision that speaks for an entity: the live row with the latest
 * `created_at`. An entity with no live row is gone unless deleted rows count.
 */
function resolveEntity<R extends RevisionRow>(
	rows: R[],
	includeDeleted: boolean
): Resolved<R> | undefined {
	if (rows.length === 0) return undefined;
	const made = rows.reduce(
		(min, row) => (row.createdAt < min ? row.createdAt : min),
		rows[0].createdAt
	);
	const live = rows.filter((row) => row.deletedAt === null);
	const pool = live.length > 0 ? live : includeDeleted ? rows : [];
	if (pool.length === 0) return undefined;
	const row = pool.reduce((latest, current) =>
		current.createdAt > latest.createdAt ? current : latest
	);
	return { row, made };
}

function resolveAll<R extends RevisionRow>(rows: R[], includeDeleted: boolean): Resolved<R>[] {
	const groups = new Map<string, R[]>();
	for (const row of rows) {
		const group = groups.get(row.entityId);
		if (group) group.push(row);
		else groups.set(row.entityId, [row]);
	}
	const resolved = [...groups.values()].flatMap((group) => {
		const entity = resolveEntity(group, includeDeleted);
		return entity ? [entity] : [];
	});
	return resolved.sort((a, b) => b.row.createdAt.localeCompare(a.row.createdAt));
}

function toMemory({ row, made }: Resolved<MemoryRow>): Memory {
	return {
		id: row.entityId,
		text: row.text,
		createdAt: made,
		updatedAt: row.createdAt,
		answers: row.answers,
		deletedAt: row.deletedAt
	};
}

function toQuestion({ row, made }: Resolved<QuestionRow>): Question {
	return {
		id: row.entityId,
		text: row.text,
		createdAt: made,
		updatedAt: row.createdAt,
		deletedAt: row.deletedAt
	};
}

function revisionRows<R extends RevisionRow>(rows: R[], entityId: string): R[] {
	return rows.filter((row) => row.entityId === entityId);
}

/** A memex's memories; forgotten entities are included only when asked for. */
export function listMemories(memexId: string, includeDeleted = false): Memory[] {
	const rows = db.select().from(memories).where(eq(memories.memexId, memexId)).all();
	return resolveAll(rows, includeDeleted).map(toMemory);
}

/** A memex's questions; forgotten entities are included only when asked for. */
export function listQuestions(memexId: string, includeDeleted = false): Question[] {
	const rows = db.select().from(questions).where(eq(questions.memexId, memexId)).all();
	return resolveAll(rows, includeDeleted).map(toQuestion);
}

function memoryById(memexId: string, entityId: string, includeDeleted = false): Memory | undefined {
	const rows = db.select().from(memories).where(eq(memories.memexId, memexId)).all();
	const resolved = resolveEntity(revisionRows(rows, entityId), includeDeleted);
	return resolved ? toMemory(resolved) : undefined;
}

function questionById(
	memexId: string,
	entityId: string,
	includeDeleted = false
): Question | undefined {
	const rows = db.select().from(questions).where(eq(questions.memexId, memexId)).all();
	const resolved = resolveEntity(revisionRows(rows, entityId), includeDeleted);
	return resolved ? toQuestion(resolved) : undefined;
}

/** Total number of live memories in a memex. */
export function total(memexId: string): number {
	return listMemories(memexId).length;
}

/** Questions no live memory answers. */
export function openQuestions(memexId: string): Question[] {
	const answered = new Set(
		listMemories(memexId).flatMap((memory) => (memory.answers ? [memory.answers] : []))
	);
	return listQuestions(memexId).filter((question) => !answered.has(question.id));
}

/** Stores a new fact. */
export function remember(memexId: string, text: string): Memory {
	const entityId = randomUUID();
	db.insert(memories)
		.values({
			id: randomUUID(),
			entityId,
			memexId,
			text,
			answers: null,
			createdAt: now(),
			deletedAt: null
		})
		.run();
	return memoryById(memexId, entityId)!;
}

/** Records a new open question. */
export function wonder(memexId: string, text: string): Question {
	const entityId = randomUUID();
	db.insert(questions)
		.values({ id: randomUUID(), entityId, memexId, text, createdAt: now(), deletedAt: null })
		.run();
	return questionById(memexId, entityId)!;
}

/** Stores a fact that settles a recorded question. */
export function answer(memexId: string, question: string, text: string): Memory {
	if (!questionById(memexId, question)) {
		throw new Error(`No question with id "${question}".`);
	}
	const entityId = randomUUID();
	db.insert(memories)
		.values({
			id: randomUUID(),
			entityId,
			memexId,
			text,
			answers: question,
			createdAt: now(),
			deletedAt: null
		})
		.run();
	return memoryById(memexId, entityId)!;
}

function latestLiveMemory(memexId: string, entityId: string): MemoryRow | undefined {
	return db
		.select()
		.from(memories)
		.where(
			and(
				eq(memories.memexId, memexId),
				eq(memories.entityId, entityId),
				isNull(memories.deletedAt)
			)
		)
		.orderBy(desc(memories.createdAt))
		.limit(1)
		.get();
}

function latestLiveQuestion(memexId: string, entityId: string): QuestionRow | undefined {
	return db
		.select()
		.from(questions)
		.where(
			and(
				eq(questions.memexId, memexId),
				eq(questions.entityId, entityId),
				isNull(questions.deletedAt)
			)
		)
		.orderBy(desc(questions.createdAt))
		.limit(1)
		.get();
}

/** Replaces an entity's text with a new revision, keeping its identity. */
export function revise(memexId: string, id: string, text: string): Memory | Question {
	const memory = latestLiveMemory(memexId, id);
	if (memory) {
		db.insert(memories)
			.values({
				id: randomUUID(),
				entityId: id,
				memexId,
				text,
				answers: memory.answers,
				createdAt: now(),
				deletedAt: null
			})
			.run();
		return memoryById(memexId, id)!;
	}
	const question = latestLiveQuestion(memexId, id);
	if (question) {
		db.insert(questions)
			.values({ id: randomUUID(), entityId: id, memexId, text, createdAt: now(), deletedAt: null })
			.run();
		return questionById(memexId, id)!;
	}
	throw new Error(`No memory or question with id "${id}".`);
}

/** Soft-deletes every live revision of a memory or question, so the entity disappears. */
export function forget(memexId: string, id: string): void {
	const deletedAt = now();
	const memory = db
		.update(memories)
		.set({ deletedAt })
		.where(
			and(eq(memories.memexId, memexId), eq(memories.entityId, id), isNull(memories.deletedAt))
		)
		.run();
	const question = db
		.update(questions)
		.set({ deletedAt })
		.where(
			and(eq(questions.memexId, memexId), eq(questions.entityId, id), isNull(questions.deletedAt))
		)
		.run();
	if (memory.changes === 0 && question.changes === 0) {
		throw new Error(`No memory or question with id "${id}".`);
	}
}

/**
 * Brings a revision back and soft-deletes the newer ones, so that revision
 * speaks for the entity again. Human-only until the history UI exists.
 */
export function restore(memexId: string, entityId: string, revisionId: string): void {
	const revision = db
		.select()
		.from(memories)
		.where(
			and(
				eq(memories.memexId, memexId),
				eq(memories.entityId, entityId),
				eq(memories.id, revisionId)
			)
		)
		.get();
	if (revision) {
		db.update(memories).set({ deletedAt: null }).where(eq(memories.id, revisionId)).run();
		db.update(memories)
			.set({ deletedAt: now() })
			.where(
				and(
					eq(memories.memexId, memexId),
					eq(memories.entityId, entityId),
					gt(memories.createdAt, revision.createdAt),
					isNull(memories.deletedAt)
				)
			)
			.run();
		return;
	}
	const question = db
		.select()
		.from(questions)
		.where(
			and(
				eq(questions.memexId, memexId),
				eq(questions.entityId, entityId),
				eq(questions.id, revisionId)
			)
		)
		.get();
	if (question) {
		db.update(questions).set({ deletedAt: null }).where(eq(questions.id, revisionId)).run();
		db.update(questions)
			.set({ deletedAt: now() })
			.where(
				and(
					eq(questions.memexId, memexId),
					eq(questions.entityId, entityId),
					gt(questions.createdAt, question.createdAt),
					isNull(questions.deletedAt)
				)
			)
			.run();
		return;
	}
	throw new Error(`No revision with id "${revisionId}".`);
}

function matches<T extends { text: string }>(items: T[], terms: string[]): T[] {
	if (terms.length === 0) return items;
	return items.filter((item) => {
		const haystack = item.text.toLowerCase();
		return terms.some((term) => haystack.includes(term));
	});
}

/**
 * Searches live memories and open questions together. The UI asks for forgotten
 * entities too, in which case every recorded question comes back.
 */
export function search(
	memexId: string,
	queries: string[],
	includeDeleted = false
): { memories: Memory[]; questions: Question[] } {
	const terms = queries.flatMap(tokenize);
	return {
		memories: matches(listMemories(memexId, includeDeleted), terms),
		questions: matches(
			includeDeleted ? listQuestions(memexId, true) : openQuestions(memexId),
			terms
		)
	};
}

export function list(memexId: string, kind: Kind | undefined, offset: number): Page<ListItem> {
	const items: ListItem[] = [];
	if (kind !== 'question') {
		items.push(
			...listMemories(memexId).map((memory) => ({
				id: memory.id,
				kind: 'memory' as const,
				text: memory.text,
				createdAt: memory.createdAt,
				updatedAt: memory.updatedAt
			}))
		);
	}
	if (kind !== 'memory') {
		items.push(
			...openQuestions(memexId).map((question) => ({
				id: question.id,
				kind: 'question' as const,
				text: question.text,
				createdAt: question.createdAt,
				updatedAt: question.updatedAt
			}))
		);
	}
	items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	return {
		items: items.slice(offset, offset + PAGE_SIZE),
		hasMore: items.length > offset + PAGE_SIZE
	};
}

/** Most common terms across a memex's live memories, by number of memories containing each. */
export function terms(memexId: string, language: string, limit: number): TermCount[] {
	const stop = stopwords[language];
	if (!stop) throw new Error(`No stopwords for language "${language}".`);

	const counts = new Map<string, number>();
	for (const { text } of listMemories(memexId)) {
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
