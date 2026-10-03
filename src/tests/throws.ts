/** Runs a sync function and returns what it threw, asserting it threw. */
export function thrown(run: () => unknown): unknown {
	try {
		run();
	} catch (err) {
		return err;
	}
	throw new Error('expected the call to throw');
}
