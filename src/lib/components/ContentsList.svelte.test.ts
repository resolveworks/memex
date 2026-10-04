import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentsItem } from '$lib/contents';
import ContentsList from './ContentsList.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
const memex = vi.hoisted(() => '9e107669-c4b1-4380-a20b-1f3e6c8b9c2d');

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/contents'),
		params: { id: memex },
		data: { locale: 'en' }
	}
}));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

const at = '2025-11-03T10:00:00.000Z';

/** A contents item with one current revision unless the test says otherwise. */
function item(
	overrides: Partial<ContentsItem> & Pick<ContentsItem, 'id' | 'kind' | 'text'>
): ContentsItem {
	const createdAt = overrides.createdAt ?? at;
	return {
		createdAt,
		updatedAt: createdAt,
		deletedAt: null,
		revisions: [{ seq: 1, text: overrides.text, createdAt, deletedAt: null }],
		...overrides
	};
}

function renderList(
	items: ContentsItem[],
	overrides: Partial<{ query: string; includeDeleted: boolean; page: number; pages: number }> = {}
): void {
	render(ContentsList, {
		props: { items, query: '', includeDeleted: false, page: 1, pages: 1, ...overrides }
	});
}

beforeEach(() => {
	vi.mocked(goto).mockClear();
});

afterEach(cleanup);

describe('ContentsList', () => {
	it('shows each entry’s text with a single delete action', () => {
		renderList([
			item({ id: '1', kind: 'memory', text: 'Sushi on Fridays' }),
			item({ id: '2', kind: 'question', text: 'When is sushi day?' })
		]);

		expect(screen.getByText('Sushi on Fridays')).toBeInTheDocument();
		expect(screen.getByText('When is sushi day?')).toBeInTheDocument();
		// The only per-entry control is the delete button.
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
	});

	it('links a question to the chat that will answer it, but leaves the text plain', () => {
		renderList([
			item({ id: '1', kind: 'memory', text: 'Sushi on Fridays' }),
			item({ id: 'q1', kind: 'question', text: 'When is sushi day?' })
		]);

		expect(screen.getByRole('link', { name: 'Answer question' })).toHaveAttribute(
			'href',
			`/${memex}?question=q1`
		);
		expect(screen.queryByRole('link', { name: 'When is sushi day?' })).toBeNull();
		expect(screen.queryByRole('link', { name: 'Sushi on Fridays' })).toBeNull();
	});

	it('shows earlier versions in the history and a restore action for each', () => {
		renderList([
			item({
				id: '1',
				kind: 'memory',
				text: 'Sushi on Saturdays',
				updatedAt: '2025-11-05T10:00:00.000Z',
				revisions: [
					{
						seq: 2,
						text: 'Sushi on Saturdays',
						createdAt: '2025-11-05T10:00:00.000Z',
						deletedAt: null
					},
					{
						seq: 1,
						text: 'Sushi on Fridays',
						createdAt: at,
						deletedAt: null
					}
				]
			})
		]);

		expect(screen.getByText('History')).toBeInTheDocument();
		// The current revision is shown above, not repeated in the history.
		expect(screen.queryByText('Current')).toBeNull();
		expect(screen.getAllByText('Sushi on Saturdays')).toHaveLength(1);
		expect(screen.getByText('Sushi on Fridays')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
	});

	it('offers restore instead of delete for a forgotten entry', () => {
		renderList(
			[
				item({
					id: '1',
					kind: 'memory',
					text: 'Sushi on Fridays',
					deletedAt: '2025-11-06T10:00:00.000Z'
				}),
				item({ id: '2', kind: 'memory', text: 'Tacos on Tuesdays' })
			],
			{ includeDeleted: true }
		);

		expect(screen.getByText('Sushi on Fridays')).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Restore' })).toHaveLength(1);
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);
	});

	it('navigates with the deleted param when the toggle is checked', async () => {
		renderList([], { query: 'sushi' });

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Include deleted' }));

		expect(goto).toHaveBeenLastCalledWith('/contents?q=sushi&deleted=1', {
			noScroll: true,
			keepFocus: true
		});
	});

	it('seeds the search box with the current query', () => {
		renderList([], { query: 'sushi' });
		expect(screen.getByRole('searchbox', { name: 'Search memories and questions…' })).toHaveValue(
			'sushi'
		);
	});

	it('navigates with the q param as the user types, keeping focus', async () => {
		renderList([]);
		const search = screen.getByRole('searchbox', { name: 'Search memories and questions…' });
		await fireEvent.input(search, { target: { value: 'sus' } });

		expect(goto).toHaveBeenLastCalledWith('/contents?q=sus', {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});

		await fireEvent.input(search, { target: { value: '' } });
		expect(vi.mocked(goto).mock.lastCall?.[0]).not.toContain('q');
	});

	it('builds pagination links that keep q and omit page one', () => {
		renderList([], { query: 'foo', page: 1, pages: 3 });
		expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
		expect(screen.getByText('Previous')).toHaveClass('disabled');
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
			'href',
			'/contents?q=foo&page=2'
		);
	});

	it('omits the page param from the link back to page one', () => {
		renderList([], { query: 'foo', page: 2, pages: 3 });
		expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
			'href',
			'/contents?q=foo'
		);
	});

	it('shows the empty message when there is nothing yet', () => {
		renderList([]);
		expect(screen.getByText('Nothing recorded yet.')).toBeInTheDocument();
	});

	it('shows the no-results message when a query matches nothing', () => {
		renderList([], { query: 'sushi' });
		expect(screen.getByText('Nothing matches your search.')).toBeInTheDocument();
	});
});
