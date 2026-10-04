import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ListPage from './ListPage.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/contents'), data: { locale: 'en' } }
}));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

interface Item {
	id: string;
	kind: 'memory' | 'question';
	text: string;
	deletedAt: string | null;
}

const items: Item[] = [
	{ id: '1', kind: 'memory', text: 'First memory', deletedAt: null },
	{ id: '2', kind: 'memory', text: 'Deleted memory', deletedAt: '2025-10-03T10:00:00.000Z' },
	{ id: '3', kind: 'question', text: 'First question', deletedAt: null }
];

function renderList(
	overrides: Partial<{
		heading: string;
		searchPlaceholder: string;
		empty: string;
		noResults: string;
		items: Item[];
		query: string;
		page: number;
		pages: number;
	}> = {}
): void {
	render(ListPage, {
		props: {
			heading: 'Memories',
			searchPlaceholder: 'Search memories…',
			empty: 'No memories yet.',
			noResults: 'No memories match your search.',
			items,
			query: '',
			page: 1,
			pages: 1,
			...overrides
		}
	});
}

beforeEach(() => {
	vi.mocked(goto).mockClear();
});

afterEach(cleanup);

describe('ListPage', () => {
	it('hides deleted items until "Include deleted" is checked', async () => {
		renderList();
		expect(screen.getByText('First memory')).toBeInTheDocument();
		expect(screen.getByText('First question')).toBeInTheDocument();
		expect(screen.queryByText('Deleted memory')).not.toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Include deleted' }));
		await tick();
		expect(screen.getByText('Deleted memory')).toBeInTheDocument();
		// Deleted rows come back without a delete button of their own.
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Include deleted' }));
		await tick();
		expect(screen.queryByText('Deleted memory')).not.toBeInTheDocument();
	});

	it('marks each row as a memory or a question', () => {
		renderList();
		expect(screen.getAllByRole('img', { name: 'Memories' })).toHaveLength(1);
		expect(screen.getAllByRole('img', { name: 'Questions' })).toHaveLength(1);
	});

	it('seeds the search box with the current query', () => {
		renderList({ query: 'gol' });
		expect(screen.getByRole('searchbox', { name: 'Search memories…' })).toHaveValue('gol');
	});

	it('navigates with the q param as the user types, keeping focus', async () => {
		renderList({ items: [] });
		const search = screen.getByRole('searchbox', { name: 'Search memories…' });
		await fireEvent.input(search, { target: { value: 'g' } });
		await fireEvent.input(search, { target: { value: 'go' } });
		await fireEvent.input(search, { target: { value: 'gol' } });

		expect(goto).toHaveBeenLastCalledWith('/contents?q=gol', {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});

		await fireEvent.input(search, { target: { value: '' } });
		expect(vi.mocked(goto).mock.lastCall?.[0]).not.toContain('q');
	});

	it('builds pagination links that keep q and omit page one', () => {
		renderList({ query: 'foo', page: 1, pages: 3 });
		expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
		expect(screen.getByText('Previous')).toHaveClass('disabled');
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
			'href',
			'/contents?q=foo&page=2'
		);
	});

	it('drops the page param from the link back to page one', () => {
		renderList({ query: 'foo', page: 2, pages: 3 });
		expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
			'href',
			'/contents?q=foo'
		);
	});

	it('omits the q param from pagination links when there is no query', () => {
		renderList({ page: 1, pages: 2 });
		expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/contents?page=2');
	});

	it('shows the empty message when there is nothing yet', () => {
		renderList({ items: [] });
		expect(screen.getByText('No memories yet.')).toBeInTheDocument();
	});

	it('shows the no-results message when a query matches nothing', () => {
		renderList({ items: [], query: 'gol' });
		expect(screen.getByText('No memories match your search.')).toBeInTheDocument();
	});
});
