import { afterEach, beforeEach, vi } from 'vitest';

// Cross-entity list ordering still reads `created_at`, so tests that assert it
// pin the clock and advance it between writes. Revision resolution itself uses
// `version` and needs no clock movement.
const EPOCH = Date.parse('2025-06-01T12:00:00.000Z');

let clock = EPOCH;

/** Pins the clock for each test and returns a `tick` that advances it 1ms. */
export function useFrozenClock(): () => string {
	beforeEach(() => {
		vi.useFakeTimers();
		clock = EPOCH;
		vi.setSystemTime(clock);
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	return () => {
		clock += 1;
		vi.setSystemTime(clock);
		return new Date(clock).toISOString();
	};
}
