import { beforeAll, describe, expect, it } from 'vitest';
import { create } from './memexes';
import { listMemories, remember } from './storage';

describe('a memex memory', () => {
	let memex: string;

	beforeAll(() => {
		memex = create('Dinner plans', 'en');
	});

	it('is listed after it is remembered', () => {
		remember(memex, 'Pizza on Friday');
		expect(listMemories(memex).map((memory) => memory.text)).toEqual(['Pizza on Friday']);
	});

	it('does not survive the test that wrote it', () => {
		expect(listMemories(memex)).toEqual([]);
	});
});
