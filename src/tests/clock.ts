import { afterEach, beforeEach, vi } from 'vitest';

// Pins the clock so tests can assert exact timestamps; `tick` advances it 1ms
// between writes. Ordering itself comes from `seq`, not the clock.
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
