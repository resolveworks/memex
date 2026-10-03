import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db';
import { create } from './memexes';
import { memories } from './db/schema';
import {
	answer,
	forget,
	listMemories,
	listQuestions,
	openQuestions,
	remember,
	restore,
	revise,
	total,
	wonder
} from './storage';

// Revision resolution orders rows by createdAt, so consecutive writes must
// never share a millisecond: the clock advances at least 1ms per write.
const EPOCH = Date.parse('2025-06-01T12:00:00.000Z');
let clock = EPOCH;

/** Advances the clock past the previous write, returning the new timestamp. */
function tick(): string {
	clock += 1;
	vi.setSystemTime(clock);
	return new Date(clock).toISOString();
}

// restore addresses revisions by row id, which no listing exposes yet.
function revisionIds(memexId: string, entityId: string): string[] {
	return db
		.select({ id: memories.id })
		.from(memories)
		.where(and(eq(memories.memexId, memexId), eq(memories.entityId, entityId)))
		.orderBy(memories.createdAt)
		.all()
		.map((row) => row.id);
}

describe('entity storage', () => {
	let memex: string;

	beforeEach(() => {
		vi.useFakeTimers();
		clock = EPOCH;
		vi.setSystemTime(clock);
		memex = create('Dinner plans', 'en');
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('remember', () => {
		it('lists what was remembered as a fresh, unlinked memory', () => {
			const memory = remember(memex, 'Pizza on Friday');

			expect(memory.text).toBe('Pizza on Friday');
			expect(memory.answers).toBe(null);
			expect(memory.deletedAt).toBe(null);
			expect(memory.createdAt).toBe(memory.updatedAt);
			expect(listMemories(memex)).toEqual([memory]);
			expect(total(memex)).toBe(1);
		});

		it('yields two distinct entities for the same text, newest first', () => {
			const first = remember(memex, 'Pizza on Friday');
			tick();
			const second = remember(memex, 'Pizza on Friday');

			expect(second.id).not.toBe(first.id);
			expect(listMemories(memex).map((memory) => memory.id)).toEqual([second.id, first.id]);
			expect(total(memex)).toBe(2);
		});
	});

	describe('wonder', () => {
		it('records a question that starts out open', () => {
			const question = wonder(memex, 'When is pizza?');

			expect(question.text).toBe('When is pizza?');
			expect(question.deletedAt).toBe(null);
			expect(listQuestions(memex)).toEqual([question]);
			expect(openQuestions(memex)).toEqual([question]);
		});
	});

	describe('answer', () => {
		it('stores a memory linked to the question, settling it', () => {
			const question = wonder(memex, 'When is pizza?');
			tick();

			const memory = answer(memex, question.id, 'Pizza on Friday');

			expect(memory.answers).toBe(question.id);
			expect(listMemories(memex)).toEqual([memory]);
			expect(openQuestions(memex)).toEqual([]);
			expect(listQuestions(memex)).toEqual([question]);
		});

		it('throws for an unknown question id', () => {
			const id = randomUUID();
			expect(() => answer(memex, id, 'Pizza on Friday')).toThrow(`No question with id "${id}".`);
		});
	});

	describe('revise', () => {
		it('replaces the text while keeping identity and creation time', () => {
			const memory = remember(memex, 'Pizza on Friday');
			const revisedAt = tick();

			const revised = revise(memex, memory.id, 'Pizza on Saturday');

			expect(revised.id).toBe(memory.id);
			expect(revised.text).toBe('Pizza on Saturday');
			expect(revised.createdAt).toBe(memory.createdAt);
			expect(revised.updatedAt).toBe(revisedAt);
			expect(listMemories(memex)).toEqual([revised]);
			expect(total(memex)).toBe(1);
		});

		it('replaces the text of a question the same way', () => {
			const question = wonder(memex, 'When is pizza?');
			const revisedAt = tick();

			const revised = revise(memex, question.id, 'When is supper?');

			expect(revised.id).toBe(question.id);
			expect(revised.text).toBe('When is supper?');
			expect(revised.createdAt).toBe(question.createdAt);
			expect(revised.updatedAt).toBe(revisedAt);
			expect(listQuestions(memex)).toEqual([revised]);
		});
	});

	describe('forget', () => {
		it('hides a memory until deleted revisions are included', () => {
			const memory = remember(memex, 'Pizza on Friday');
			tick();
			const deletedAt = tick();

			forget(memex, memory.id);

			expect(listMemories(memex)).toEqual([]);
			expect(total(memex)).toBe(0);

			const [gone] = listMemories(memex, true);
			expect(gone.id).toBe(memory.id);
			expect(gone.text).toBe('Pizza on Friday');
			expect(gone.deletedAt).toBe(deletedAt);
		});

		it('hides a question until deleted revisions are included', () => {
			const question = wonder(memex, 'When is pizza?');
			tick();
			const deletedAt = tick();

			forget(memex, question.id);

			expect(listQuestions(memex)).toEqual([]);

			const [gone] = listQuestions(memex, true);
			expect(gone.id).toBe(question.id);
			expect(gone.deletedAt).toBe(deletedAt);
		});

		it('reopens a question when its answering memory is forgotten', () => {
			const question = wonder(memex, 'When is pizza?');
			tick();
			const memory = answer(memex, question.id, 'Pizza on Friday');
			expect(openQuestions(memex)).toEqual([]);
			tick();

			forget(memex, memory.id);

			expect(openQuestions(memex).map((open) => open.id)).toEqual([question.id]);
		});
	});

	describe('restore', () => {
		it('makes an older revision current again, retiring the newer ones', () => {
			const memory = remember(memex, 'Pizza on Friday');
			tick();
			revise(memex, memory.id, 'Pizza on Saturday');
			tick();
			revise(memex, memory.id, 'Pizza on Sunday');
			tick();

			const [original] = revisionIds(memex, memory.id);
			restore(memex, memory.id, original);

			const [current] = listMemories(memex);
			expect(current.id).toBe(memory.id);
			expect(current.text).toBe('Pizza on Friday');
			expect(current.createdAt).toBe(memory.createdAt);
			expect(current.updatedAt).toBe(memory.updatedAt);
		});

		it('brings a forgotten entity back', () => {
			const memory = remember(memex, 'Pizza on Friday');
			tick();
			revise(memex, memory.id, 'Pizza on Saturday');
			tick();
			forget(memex, memory.id);
			tick();

			const [original] = revisionIds(memex, memory.id);
			restore(memex, memory.id, original);

			const [current] = listMemories(memex);
			expect(current.id).toBe(memory.id);
			expect(current.text).toBe('Pizza on Friday');
			expect(current.deletedAt).toBe(null);
		});

		it('throws for an unknown revision id', () => {
			const id = randomUUID();
			expect(() => restore(memex, randomUUID(), id)).toThrow(`No revision with id "${id}".`);
		});
	});

	it('throws when revising or forgetting an unknown id', () => {
		const id = randomUUID();
		expect(() => revise(memex, id, 'Pizza on Friday')).toThrow(
			`No memory or question with id "${id}".`
		);
		expect(() => forget(memex, id)).toThrow(`No memory or question with id "${id}".`);
	});

	it('keeps one memex from listing the entities of another', () => {
		const other = create('Supper plans', 'en');
		const memory = remember(memex, 'Pizza on Friday');
		tick();
		const question = wonder(memex, 'When is pizza?');
		tick();
		const otherMemory = remember(other, 'Sushi on Monday');
		tick();
		const otherQuestion = wonder(other, 'When is sushi?');

		expect(listMemories(memex).map((m) => m.id)).toEqual([memory.id]);
		expect(openQuestions(memex).map((q) => q.id)).toEqual([question.id]);
		expect(listMemories(other).map((m) => m.id)).toEqual([otherMemory.id]);
		expect(openQuestions(other).map((q) => q.id)).toEqual([otherQuestion.id]);

		expect(() => forget(memex, otherMemory.id)).toThrow(
			`No memory or question with id "${otherMemory.id}".`
		);
	});
});
