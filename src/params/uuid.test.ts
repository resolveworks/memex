import { describe, expect, it } from 'vitest';
import { match } from './uuid';

describe('the uuid param matcher', () => {
	it('accepts a canonical uuid in lowercase', () => {
		expect(match('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
	});

	it('accepts a canonical uuid in uppercase', () => {
		expect(match('123E4567-E89B-42D3-A456-426614174000')).toBe(true);
	});

	it('accepts a canonical uuid of mixed case', () => {
		expect(match('123e4567-E89b-42d3-a456-426614174000')).toBe(true);
	});

	it('rejects undashed hex', () => {
		expect(match('123e4567e89b42d3a456426614174000')).toBe(false);
	});

	it('rejects a short or long final group', () => {
		expect(match('123e4567-e89b-42d3-a456-42661417400')).toBe(false);
		expect(match('123e4567-e89b-42d3-a456-4266141740000')).toBe(false);
	});

	it('rejects non-hex characters', () => {
		expect(match('g23e4567-e89b-42d3-a456-426614174000')).toBe(false);
	});

	it('rejects braced and urn forms', () => {
		expect(match('{123e4567-e89b-42d3-a456-426614174000}')).toBe(false);
		expect(match('urn:uuid:123e4567-e89b-42d3-a456-426614174000')).toBe(false);
	});

	it('rejects surrounding characters', () => {
		expect(match(' 123e4567-e89b-42d3-a456-426614174000')).toBe(false);
		expect(match('123e4567-e89b-42d3-a456-426614174000/')).toBe(false);
	});

	it('rejects the empty string', () => {
		expect(match('')).toBe(false);
	});

	it('rejects non-string values', () => {
		expect(match(null as unknown as string)).toBe(false);
		expect(match(undefined as unknown as string)).toBe(false);
		expect(match(42 as unknown as string)).toBe(false);
		expect(match({} as unknown as string)).toBe(false);
	});
});
