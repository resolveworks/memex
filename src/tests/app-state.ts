/**
 * Stand-in for `page` from `$app/state`, for tests that run outside SvelteKit.
 *
 * Register the mock once per test file, importing this module before the code
 * under test (the factory runs when `$app/state` is first imported, so the
 * binding must be initialized by then):
 *
 *   import { page } from '../tests/app-state';
 *   vi.mock('$app/state', () => ({ page }));
 *
 * Point it at the page under test by mutating fields — the mock hands out this
 * very object, so reassigning `page` itself has no effect:
 *
 *   page.params.id = '9e107669-c4b1-4380-a20b-1f3e6c8b9c2d';
 *   page.data.locale = 'de';
 */
export const page = {
	/** Route params of the current page, e.g. the memex `id`. */
	params: {} as Record<string, string | undefined>,
	/** Merged load data of the current page, e.g. `locale`. */
	data: {} as Record<string, unknown>
};
