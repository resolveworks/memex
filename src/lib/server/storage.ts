import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { stopwords } from '$lib/languages';
import type { Memory } from '$lib/memory';
import { PAGE_SIZE, type Page } from '$lib/page';
import type { Question } from '$lib/question';
import { db } from './db';
import { revisions } from './db/schema';
import { tokenize } from './tokenize';

type Revision = typeof revisions.$inferSelect;

export type Kind = Revision['kind'];

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

interface Resolved {
	row: Revision;
	made: string;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * Picks the revision that speaks for an entity: the live row with the latest
 * `created_at`. An entity with no live row is gone unless deleted rows count.
 */
function resolveEntity(rows: Revision[], includeDeleted: boolean): Resolved | undefined {
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

function resolveAll(rows: Revision[], includeDeleted: boolean): Resolved[] {
	const groups = new Map<string, Revision[]>();
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

function toMemory({ row, made }: Resolved): Memory {
	return {
		id: row.entityId,
		text: row.text,
		createdAt: made,
		updatedAt: row.createdAt,
		answers: row.answers,
		deletedAt: row.deletedAt
	};
}

function toQuestion({ row, made }: Resolved): Question {
	return {
		id: row.entityId,
		text: row.text,
		createdAt: made,
		updatedAt: row.createdAt,
		deletedAt: row.deletedAt
	};
}

/** Every revision of a memex's entities, live or forgotten. */
function revisionsOf(memexId: string): Revision[] {
	return db.select().from(revisions).where(eq(revisions.memexId, memexId)).all();
}

/** The live revision that speaks for one entity, with the entity's first timestamp. */
function resolveById(memexId: string, entityId: string): Resolved | undefined {
	const rows = revisionsOf(memexId).filter((revision) => revision.entityId === entityId);
	return resolveEntity(rows, false);
}

/** A memex's memories; forgotten entities are included only when asked for. */
export function listMemories(memexId: string, includeDeleted = false): Memory[] {
	return resolveAll(revisionsOf(memexId), includeDeleted)
		.filter(({ row }) => row.kind === 'memory')
		.map(toMemory);
}

/** A memex's questions; forgotten entities are included only when asked for. */
export function listQuestions(memexId: string, includeDeleted = false): Question[] {
	return resolveAll(revisionsOf(memexId), includeDeleted)
		.filter(({ row }) => row.kind === 'question')
		.map(toQuestion);
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
	const createdAt = now();
	const revision: Revision = {
		id: randomUUID(),
		entityId,
		memexId,
		kind: 'memory',
		text,
		answers: null,
		createdAt,
		deletedAt: null
	};
	db.insert(revisions).values(revision).run();
	return toMemory({ row: revision, made: createdAt });
}

/** Records a new open question. */
export function wonder(memexId: string, text: string): Question {
	const entityId = randomUUID();
	const createdAt = now();
	const revision: Revision = {
		id: randomUUID(),
		entityId,
		memexId,
		kind: 'question',
		text,
		answers: null,
		createdAt,
		deletedAt: null
	};
	db.insert(revisions).values(revision).run();
	return toQuestion({ row: revision, made: createdAt });
}

/** Stores a fact that settles a recorded question. */
export function answer(memexId: string, question: string, text: string): Memory {
	if (resolveById(memexId, question)?.row.kind !== 'question') {
		throw new Error(`No question with id "${question}".`);
	}
	const entityId = randomUUID();
	const createdAt = now();
	const revision: Revision = {
		id: randomUUID(),
		entityId,
		memexId,
		kind: 'memory',
		text,
		answers: question,
		createdAt,
		deletedAt: null
	};
	db.insert(revisions).values(revision).run();
	return toMemory({ row: revision, made: createdAt });
}

/** Replaces an entity's text with a new revision, keeping its identity. */
export function revise(memexId: string, id: string, text: string): Memory | Question {
	const current = resolveById(memexId, id);
	if (!current) throw new Error(`No memory or question with id "${id}".`);
	const revision: Revision = {
		id: randomUUID(),
		entityId: id,
		memexId,
		kind: current.row.kind,
		text,
		answers: current.row.answers,
		createdAt: now(),
		deletedAt: null
	};
	db.insert(revisions).values(revision).run();
	const resolved = { row: revision, made: current.made };
	return revision.kind === 'memory' ? toMemory(resolved) : toQuestion(resolved);
}

/** Soft-deletes every live revision of a memory or question, so the entity disappears. */
export function forget(memexId: string, id: string): void {
	const { changes } = db
		.update(revisions)
		.set({ deletedAt: now() })
		.where(
			and(eq(revisions.memexId, memexId), eq(revisions.entityId, id), isNull(revisions.deletedAt))
		)
		.run();
	if (changes === 0) {
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
		.from(revisions)
		.where(
			and(
				eq(revisions.memexId, memexId),
				eq(revisions.entityId, entityId),
				eq(revisions.id, revisionId)
			)
		)
		.get();
	if (!revision) throw new Error(`No revision with id "${revisionId}".`);
	db.update(revisions).set({ deletedAt: null }).where(eq(revisions.id, revisionId)).run();
	db.update(revisions)
		.set({ deletedAt: now() })
		.where(
			and(
				eq(revisions.memexId, memexId),
				eq(revisions.entityId, entityId),
				gt(revisions.createdAt, revision.createdAt),
				isNull(revisions.deletedAt)
			)
		)
		.run();
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
