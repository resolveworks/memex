import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { create } from './memexes';
import { useFrozenClock } from '../../tests/clock';
import {
	answer,
	forget,
	listMemories,
	listQuestions,
	openQuestions,
	remember,
	restore,
	revert,
	revise,
	revisionsOf,
	wonder
} from './storage';

const tick = useFrozenClock();

describe('entity storage', () => {
	let memex: string;

	beforeEach(() => {
		memex = create('Dinner plans', 'en');
	});

	describe('remember', () => {
		it('lists what was remembered as a fresh, unlinked memory', () => {
			const memory = remember(memex, 'Pizza on Friday');

			expect(memory.text).toBe('Pizza on Friday');
			expect(memory.answers).toBe(null);
			expect(memory.deletedAt).toBe(null);
			expect(memory.createdAt).toBe(memory.updatedAt);
			expect(listMemories(memex)).toEqual([memory]);
		});

		it('yields two distinct entities for the same text, newest first, in the same millisecond', () => {
			const first = remember(memex, 'Pizza on Friday');
			const second = remember(memex, 'Pizza on Friday');

			expect(second.id).not.toBe(first.id);
			expect(listMemories(memex).map((memory) => memory.id)).toEqual([second.id, first.id]);
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

		it('keeps the latest revision when two arrive in the same millisecond', () => {
			const memory = remember(memex, 'Old text');
			revise(memex, memory.id, 'Middle text');
			revise(memex, memory.id, 'New text');

			expect(listMemories(memex).map((listed) => listed.text)).toEqual(['New text']);
		});
	});

	describe('forget', () => {
		it('hides a memory until deleted revisions are included', () => {
			const memory = remember(memex, 'Pizza on Friday');
			const deletedAt = tick();

			forget(memex, memory.id);

			expect(listMemories(memex)).toEqual([]);

			const [gone] = listMemories(memex, true);
			expect(gone.id).toBe(memory.id);
			expect(gone.text).toBe('Pizza on Friday');
			expect(gone.deletedAt).toBe(deletedAt);
		});

		it('hides a question until deleted revisions are included', () => {
			const question = wonder(memex, 'When is pizza?');
			const deletedAt = tick();

			forget(memex, question.id);

			expect(listQuestions(memex)).toEqual([]);

			const [gone] = listQuestions(memex, true);
			expect(gone.id).toBe(question.id);
			expect(gone.deletedAt).toBe(deletedAt);
		});

		it('reopens a question when its answering memory is forgotten', () => {
			const question = wonder(memex, 'When is pizza?');
			const memory = answer(memex, question.id, 'Pizza on Friday');
			expect(openQuestions(memex)).toEqual([]);

			forget(memex, memory.id);

			expect(openQuestions(memex).map((open) => open.id)).toEqual([question.id]);
		});
	});

	describe('restore', () => {
		it('revives a forgotten entity together with its history', () => {
			const memory = remember(memex, 'Pizza on Friday');
			revise(memex, memory.id, 'Pizza on Saturday');
			forget(memex, memory.id);
			expect(listMemories(memex)).toEqual([]);

			restore(memex, memory.id);

			expect(listMemories(memex).map((listed) => listed.text)).toEqual(['Pizza on Saturday']);
		});

		it('throws for an entity that is not forgotten', () => {
			const memory = remember(memex, 'Pizza on Friday');
			expect(() => restore(memex, memory.id)).toThrow(
				`No forgotten memory or question with id "${memory.id}".`
			);
		});
	});

	describe('revert', () => {
		it('brings a past revision back as a new, current one', () => {
			const memory = remember(memex, 'Pizza on Friday');
			tick();
			revise(memex, memory.id, 'Pizza on Saturday');
			const oldest = revisionsOf(memex, [memory.id]).at(-1)!;

			revert(memex, memory.id, oldest.seq);

			expect(listMemories(memex).map((listed) => listed.text)).toEqual(['Pizza on Friday']);
			expect(revisionsOf(memex, [memory.id]).map((revision) => revision.text)).toEqual([
				'Pizza on Friday',
				'Pizza on Saturday',
				'Pizza on Friday'
			]);
		});

		it('throws for a revision that does not belong to the entity', () => {
			const memory = remember(memex, 'Pizza on Friday');
			expect(() => revert(memex, memory.id, 99999)).toThrow(`No revision 99999 of "${memory.id}".`);
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
		const other = create('Dinner plans', 'en');
		const memory = remember(memex, 'Pizza on Friday');
		const otherMemory = remember(other, 'Pizza on Friday');

		expect(listMemories(memex).map((m) => m.id)).toEqual([memory.id]);
		expect(listMemories(other).map((m) => m.id)).toEqual([otherMemory.id]);

		expect(() => forget(memex, otherMemory.id)).toThrow(
			`No memory or question with id "${otherMemory.id}".`
		);
	});
});
