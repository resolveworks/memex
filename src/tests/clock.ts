import { afterEach, beforeEach, vi } from 'vitest';

// Ordering and revision resolution read `created_at`, so tests that assert them
// pin the clock and advance it between writes.
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
