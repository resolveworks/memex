import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { create, exists, get, getMany, rename } from './memexes';

describe('memexes', () => {
	describe('create', () => {
		it('rejects a blank or whitespace-only title', () => {
			expect(() => create('', 'en')).toThrow('A memex needs a title.');
			expect(() => create('   \t', 'en')).toThrow('A memex needs a title.');
		});

		it('rejects an unsupported language', () => {
			expect(() => create('Dinner plans', 'klingon')).toThrow('Unsupported language "klingon".');
		});
	});

	describe('get', () => {
		it('returns the title, language, and creation time', () => {
			const before = Date.now();
			const id = create('Dinner plans', 'de');
			const after = Date.now();

			const memex = get(id)!;
			expect(memex.id).toBe(id);
			expect(memex.title).toBe('Dinner plans');
			expect(memex.language).toBe('de');
			expect(new Date(memex.createdAt).getTime()).toBeGreaterThanOrEqual(before);
			expect(new Date(memex.createdAt).getTime()).toBeLessThanOrEqual(after);
		});

		it('returns undefined for an unknown id', () => {
			expect(get(randomUUID())).toBeUndefined();
		});
	});

	describe('getMany', () => {
		it('returns memexes in the order the ids were given, dropping unknown ids', () => {
			const a = create('Dinner plans', 'en');
			const b = create('Supper plans', 'en');
			const c = create('Breakfast plans', 'en');

			const memexes = getMany([c, randomUUID(), a, b]);
			expect(memexes.map((memex) => memex.id)).toEqual([c, a, b]);
		});

		it('returns [] for []', () => {
			expect(getMany([])).toEqual([]);
		});
	});

	describe('rename', () => {
		it('persists the new title', () => {
			const id = create('Dinner plans', 'en');
			rename(id, 'Supper plans');
			expect(get(id)!.title).toBe('Supper plans');
		});

		it('rejects a blank or whitespace-only title', () => {
			const id = create('Dinner plans', 'en');
			expect(() => rename(id, '  ')).toThrow('A memex needs a title.');
		});
	});

	describe('exists', () => {
		it('is true only for ids that were created', () => {
			const id = create('Dinner plans', 'en');
			expect(exists(id)).toBe(true);
			expect(exists(randomUUID())).toBe(false);
		});
	});
});
