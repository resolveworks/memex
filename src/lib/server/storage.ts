import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
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
 * A memex's revisions ranked per entity. `made` is the entity's first
 * timestamp; `rn` counts live rows before deleted ones and newest first, so
 * `rn = 1` is the revision that speaks for the entity.
 */
function ranked(memexId: string) {
	return sql`
		select
			r.id,
			r.entity_id,
			r.memex_id,
			r.kind,
			r.text,
			r.answers,
			r.created_at,
			r.deleted_at,
			min(r.created_at) over (partition by r.entity_id) as made,
			row_number() over (
				partition by r.entity_id
				order by (r.deleted_at is null) desc, r.created_at desc
			) as rn
		from revisions r
		where r.memex_id = ${memexId}
	`;
}

interface Choice {
	kind?: Kind;
	includeDeleted?: boolean;
	openOnly?: boolean;
	limit?: number;
	offset?: number;
}

/**
 * The revision that speaks for each entity: its latest live one, or its latest
 * revision overall when forgotten entities count and no live one remains.
 */
function resolve(memexId: string, choice: Choice = {}): Resolved[] {
	const { kind, includeDeleted = false, openOnly = false, limit, offset } = choice;
	const rows = db.all<Revision & { made: string }>(sql`
		with ranked as (${ranked(memexId)})
		select
			w.id,
			w.entity_id as entityId,
			w.memex_id as memexId,
			w.kind,
			w.text,
			w.answers,
			w.created_at as createdAt,
			w.deleted_at as deletedAt,
			w.made
		from ranked w
		where w.rn = 1
			${kind === undefined ? sql`` : sql`and w.kind = ${kind}`}
			${includeDeleted ? sql`` : sql`and w.deleted_at is null`}
			${
				openOnly
					? sql`and not exists (
							select 1 from ranked m
							where m.rn = 1
								and m.kind = 'memory'
								and m.deleted_at is null
								and m.answers = w.entity_id
						)`
					: sql``
			}
		order by w.created_at desc
		${limit === undefined ? sql`` : sql`limit ${limit}`}
		${offset === undefined ? sql`` : sql`offset ${offset}`}
	`);
	return rows.map((row) => ({ row, made: row.made }));
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

/** The live revision that speaks for one entity, with the entity's first timestamp. */
function resolveById(memexId: string, entityId: string): Resolved | undefined {
	const row = db.get<(Revision & { made: string }) | undefined>(sql`
		select
			r.id,
			r.entity_id as entityId,
			r.memex_id as memexId,
			r.kind,
			r.text,
			r.answers,
			r.created_at as createdAt,
			r.deleted_at as deletedAt,
			(
				select min(previous.created_at)
				from revisions previous
				where previous.memex_id = ${memexId} and previous.entity_id = ${entityId}
			) as made
		from revisions r
		where r.memex_id = ${memexId} and r.entity_id = ${entityId} and r.deleted_at is null
		order by r.created_at desc
		limit 1
	`);
	return row ? { row, made: row.made } : undefined;
}

/** A memex's memories; forgotten entities are included only when asked for. */
export function listMemories(memexId: string, includeDeleted = false): Memory[] {
	return resolve(memexId, { kind: 'memory', includeDeleted }).map(toMemory);
}

/** A memex's questions; forgotten entities are included only when asked for. */
export function listQuestions(memexId: string, includeDeleted = false): Question[] {
	return resolve(memexId, { kind: 'question', includeDeleted }).map(toQuestion);
}

/** Total number of live memories in a memex. */
export function total(memexId: string): number {
	const row = db.get<{ count: number }>(sql`
		with ranked as (${ranked(memexId)})
		select count(*) as count
		from ranked
		where rn = 1 and kind = 'memory' and deleted_at is null
	`);
	return row.count;
}

/** Questions no live memory answers. */
export function openQuestions(memexId: string): Question[] {
	return resolve(memexId, { kind: 'question', openOnly: true }).map(toQuestion);
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
	const rows = resolve(memexId, { kind, openOnly: true, limit: PAGE_SIZE + 1, offset });
	const items = rows.slice(0, PAGE_SIZE).map(({ row, made }) => ({
		id: row.entityId,
		kind: row.kind,
		text: row.text,
		createdAt: made,
		updatedAt: row.createdAt
	}));
	return { items, hasMore: rows.length > PAGE_SIZE };
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
