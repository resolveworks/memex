import { describe, expect, it } from 'vitest';
import { FakeCookies } from '../../tests/cookies';
import { forget, read, remember } from './known';

describe('the known-memexes roster', () => {
	it('reads as empty with no cookie', () => {
		expect(read(new FakeCookies())).toEqual([]);
	});

	it('seeds the roster on first visit', () => {
		const cookies = new FakeCookies();
		remember(cookies, 'a');
		expect(read(cookies)).toEqual(['a']);
	});

	it('moves a remembered memex to the front without duplicating it', () => {
		const cookies = new FakeCookies({ memexes: 'a,b,c' });
		remember(cookies, 'b');
		expect(read(cookies)).toEqual(['b', 'a', 'c']);
	});

	it('caps the roster at twenty, dropping the oldest', () => {
		const seed = Array.from({ length: 20 }, (_, i) => `m${i}`);
		const cookies = new FakeCookies({ memexes: seed.join(',') });
		remember(cookies, 'new');
		expect(read(cookies)).toEqual(['new', ...seed.slice(0, 19)]);
	});

	it('does not rewrite the cookie when the memex is already first', () => {
		const cookies = new FakeCookies({ memexes: 'a,b' });
		remember(cookies, 'a');
		expect(cookies.sets).toEqual([]);
	});

	it('forgets a memex', () => {
		const cookies = new FakeCookies({ memexes: 'a,b,c' });
		forget(cookies, 'b');
		expect(read(cookies)).toEqual(['a', 'c']);
	});

	it('leaves the cookie untouched when forgetting an absent memex', () => {
		const cookies = new FakeCookies({ memexes: 'a,b' });
		forget(cookies, 'z');
		expect(cookies.sets).toEqual([]);
	});
});
