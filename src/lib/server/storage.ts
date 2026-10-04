import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
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

/** A list item with its deletion state, as the content view needs it. */
export interface Entry extends ListItem {
	deletedAt: string | null;
}

/** One revision of an entity, for the contents view's history. */
export interface RevisionView {
	seq: number;
	text: string;
	createdAt: string;
	deletedAt: string | null;
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
			r.seq,
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
				order by (r.deleted_at is null) desc, r.seq desc
			) as rn
		from revisions r
		where r.memex_id = ${memexId}
	`;
}

interface Choice {
	kind?: Kind;
	includeDeleted?: boolean;
	/** Restrict to entities whose text contains a word of any query. */
	queries?: string[];
	limit?: number;
	offset?: number;
	/** Rank this entity id ahead of the rest. */
	prefer?: string;
	/** Order arbitrarily rather than newest first; pair with `limit` to pick one. */
	random?: boolean;
}

/**
 * The speaking row of every entity matching a choice, shared by resolution and
 * counting so a page and its total always agree.
 */
function conditions({ kind, includeDeleted = false, queries = [] }: Choice) {
	const terms = queries.flatMap(tokenize);
	return sql`
		w.rn = 1
		${kind === undefined ? sql`` : sql`and w.kind = ${kind}`}
		${includeDeleted ? sql`` : sql`and w.deleted_at is null`}
		and not exists (
			select 1 from revisions a
			where a.kind = 'memory' and a.answers = w.entity_id
		)
		${
			terms.length === 0
				? sql``
				: sql`and (${sql.join(
						terms.map((term) => sql`instr(lower(w.text), ${term}) > 0`),
						sql` or `
					)})`
		}
	`;
}

/**
 * The revision that speaks for each entity: its latest live one, or its latest
 * revision overall when forgotten entities count and no live one remains.
 * Answered questions never resolve, whether their answer is live or forgotten.
 */
function resolve(memexId: string, choice: Choice = {}): Resolved[] {
	const { limit, offset, prefer, random } = choice;
	const rows = db.all<Revision & { made: string }>(sql`
		with ranked as (${ranked(memexId)})
		select
			w.seq,
			w.entity_id as entityId,
			w.memex_id as memexId,
			w.kind,
			w.text,
			w.answers,
			w.created_at as createdAt,
			w.deleted_at as deletedAt,
			w.made
		from ranked w
		where ${conditions(choice)}
		order by
			${prefer === undefined ? sql`` : sql`(w.entity_id = ${prefer}) desc,`}
			${random ? sql`random()` : sql`w.seq desc`}
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

function toEntry({ row, made }: Resolved): Entry {
	return {
		id: row.entityId,
		kind: row.kind,
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
			r.seq,
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
		order by r.seq desc
		limit 1
	`);
	return row ? { row, made: row.made } : undefined;
}

/** A memex's memories; forgotten entities are included only when asked for. */
export function listMemories(memexId: string, includeDeleted = false): Memory[] {
	return resolve(memexId, { kind: 'memory', includeDeleted }).map(toMemory);
}

/** A memex's open questions; answered ones are never listed, forgotten ones only when asked for. */
export function listQuestions(memexId: string, includeDeleted = false): Question[] {
	return resolve(memexId, { kind: 'question', includeDeleted }).map(toQuestion);
}

/** Total number of open questions in a memex. */
export function openQuestions(memexId: string): number {
	const row = db.get<{ count: number }>(sql`
		with ranked as (${ranked(memexId)})
		select count(*) as count
		from ranked
		where rn = 1 and kind = 'question' and deleted_at is null
			and not exists (
				select 1 from revisions a
				where a.kind = 'memory' and a.answers = ranked.entity_id
			)
	`);
	return row.count;
}

/** One open question: the preferred one when it is still open, otherwise a random one. */
export function pickQuestion(memexId: string, preferred: string | undefined): Question | undefined {
	const [resolved] = resolve(memexId, {
		kind: 'question',
		prefer: preferred,
		random: true,
		limit: 1
	});
	return resolved ? toQuestion(resolved) : undefined;
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

/** Stores a new fact. */
export function remember(memexId: string, text: string): Memory {
	const createdAt = now();
	const row = db
		.insert(revisions)
		.values({
			entityId: randomUUID(),
			memexId,
			kind: 'memory',
			text,
			answers: null,
			createdAt,
			deletedAt: null
		})
		.returning()
		.get();
	return toMemory({ row, made: createdAt });
}

/** Records a new open question. */
export function wonder(memexId: string, text: string): Question {
	const createdAt = now();
	const row = db
		.insert(revisions)
		.values({
			entityId: randomUUID(),
			memexId,
			kind: 'question',
			text,
			answers: null,
			createdAt,
			deletedAt: null
		})
		.returning()
		.get();
	return toQuestion({ row, made: createdAt });
}

/** Stores a fact that settles a recorded question. */
export function answer(memexId: string, question: string, text: string): Memory {
	if (resolveById(memexId, question)?.row.kind !== 'question') {
		throw new Error(`No question with id "${question}".`);
	}
	const createdAt = now();
	const row = db
		.insert(revisions)
		.values({
			entityId: randomUUID(),
			memexId,
			kind: 'memory',
			text,
			answers: question,
			createdAt,
			deletedAt: null
		})
		.returning()
		.get();
	return toMemory({ row, made: createdAt });
}

/** Replaces an entity's text with a new revision, keeping its identity. */
export function revise(memexId: string, id: string, text: string): Memory | Question {
	const current = resolveById(memexId, id);
	if (!current) throw new Error(`No memory or question with id "${id}".`);
	const row = db
		.insert(revisions)
		.values({
			entityId: id,
			memexId,
			kind: current.row.kind,
			text,
			answers: current.row.answers,
			createdAt: now(),
			deletedAt: null
		})
		.returning()
		.get();
	const resolved = { row, made: current.made };
	return row.kind === 'memory' ? toMemory(resolved) : toQuestion(resolved);
}

/** Revives a forgotten entity by clearing the deletion on all its revisions. */
export function restore(memexId: string, id: string): void {
	const { changes } = db
		.update(revisions)
		.set({ deletedAt: null })
		.where(
			and(
				eq(revisions.memexId, memexId),
				eq(revisions.entityId, id),
				isNotNull(revisions.deletedAt)
			)
		)
		.run();
	if (changes === 0) {
		throw new Error(`No forgotten memory or question with id "${id}".`);
	}
}

/** Brings back a past revision's text as a new, current revision. */
export function revert(memexId: string, id: string, seq: number): Memory | Question {
	const past = db.get<Revision>(sql`
		select text from revisions
		where memex_id = ${memexId} and entity_id = ${id} and seq = ${seq}
	`);
	if (!past) throw new Error(`No revision ${seq} of "${id}".`);
	return revise(memexId, id, past.text);
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

/** Searches a memex's live memories and open questions; forgotten ones only when asked for. */
export function search(
	memexId: string,
	queries: string[],
	includeDeleted = false
): { memories: Memory[]; questions: Question[] } {
	return {
		memories: resolve(memexId, { kind: 'memory', includeDeleted, queries }).map(toMemory),
		questions: resolve(memexId, { kind: 'question', includeDeleted, queries }).map(toQuestion)
	};
}

/** Every revision of a memex, in insertion order, for a complete backup. */
export function allRevisions(memexId: string): Revision[] {
	return db
		.select()
		.from(revisions)
		.where(eq(revisions.memexId, memexId))
		.orderBy(revisions.seq)
		.all();
}

/** Every revision of the given entities, newest first. */
export function revisionsOf(
	memexId: string,
	ids: string[]
): (RevisionView & { entityId: string })[] {
	if (ids.length === 0) return [];
	return db.all<RevisionView & { entityId: string }>(sql`
		select
			seq,
			entity_id as entityId,
			text,
			created_at as createdAt,
			deleted_at as deletedAt
		from revisions
		where memex_id = ${memexId} and ${inArray(revisions.entityId, ids)}
		order by seq desc
	`);
}

/** One page of a memex's contents, interleaved newest first. */
export function list(memexId: string, choice: Choice = {}): Page<Entry> {
	const rows = resolve(memexId, { ...choice, limit: PAGE_SIZE + 1 });
	const items = rows.slice(0, PAGE_SIZE).map(toEntry);
	return { items, hasMore: rows.length > PAGE_SIZE };
}

/** How many entities a listing holds, so a viewer can page through it. */
export function count(memexId: string, choice: Choice = {}): number {
	const row = db.get<{ count: number }>(sql`
		with ranked as (${ranked(memexId)})
		select count(*) as count
		from ranked w
		where ${conditions(choice)}
	`);
	return row.count;
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
