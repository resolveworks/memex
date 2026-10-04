<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as currentPage } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { ContentsItem } from '$lib/contents';
	import { formatDate, t } from '$lib/i18n';
	import Page from './Page.svelte';

	let {
		items,
		query,
		page,
		pages
	}: {
		items: ContentsItem[];
		query: string;
		page: number;
		pages: number;
	} = $props();

	// Deleted rows arrive with the rest; this controls whether they are included.
	let includeDeleted = $state(false);
	const visible = $derived(
		includeDeleted ? items : items.filter((item) => item.deletedAt === null)
	);

	// Snapshot the initial query so later prop updates can't clobber in-flight typing.
	// svelte-ignore state_referenced_locally
	let term = $state(query);

	// Search is driven by the URL: navigating re-runs the page's load function.
	function navigate(value: string): void {
		term = value;
		const params = new SvelteURLSearchParams();
		if (term) params.set('q', term);
		const search = params.toString();
		goto(resolve(`${currentPage.url.pathname}?${search}`), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function onInput(event: Event): void {
		navigate((event.currentTarget as HTMLInputElement).value);
	}

	function onSearch(event: SubmitEvent): void {
		event.preventDefault();
		navigate(term);
	}

	// The current search and page as a query string; page one is left bare.
	function queryString(target = page): string {
		const params = new SvelteURLSearchParams();
		if (query) params.set('q', query);
		if (target > 1) params.set('page', String(target));
		return params.toString();
	}

	// A link back to the same search on another page.
	function href(target: number): ResolvedPathname {
		const search = queryString(target);
		return resolve(`${currentPage.url.pathname}?${search}`);
	}

	// Post to a named action without dropping the current search and page.
	function action(name: string): string {
		const search = queryString();
		return search ? `?${search}&/${name}` : `?/${name}`;
	}
</script>

<Page width="var(--content-max)">
	<div class="list stack">
		<header class="head">
			<div class="title">
				<h1>{t('contents.heading')}</h1>
				<label class="toggle">
					<input type="checkbox" bind:checked={includeDeleted} />
					{t('list.includeDeleted')}
				</label>
			</div>
			<form class="search" method="GET" onsubmit={onSearch}>
				<input
					type="search"
					name="q"
					value={term}
					oninput={onInput}
					placeholder={t('contents.search')}
					aria-label={t('contents.search')}
				/>
				<button class="find center" type="submit" aria-label={t('list.search')}>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<circle cx="11" cy="11" r="7" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
				</button>
			</form>
		</header>

		{#if visible.length === 0}
			<p class="empty">{query ? t('contents.noResults') : t('contents.empty')}</p>
		{:else}
			<ul class="items">
				{#each visible as item (item.id)}
					<li class="item" class:deleted={item.deletedAt !== null} id={`entry-${item.id}`}>
						<div class="body">
							<p class="text">{item.text}</p>

							<p class="meta">
								<span>
									{t('list.created')}
									<time datetime={item.createdAt}>{formatDate(item.createdAt)}</time>
								</span>
								{#if item.updatedAt !== item.createdAt}
									<span>
										{t('list.updated')}
										<time datetime={item.updatedAt}>{formatDate(item.updatedAt)}</time>
									</span>
								{/if}
							</p>

							{#if item.revisions.length > 1}
								<details class="history">
									<summary>
										<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
											<polyline points="9 18 15 12 9 6" />
										</svg>
										{t('list.history')}
										<span class="count">{item.revisions.length - 1}</span>
									</summary>
									<ol class="versions">
										{#each item.revisions.slice(1) as revision (revision.seq)}
											<li class="version">
												<div class="version-head">
													<time datetime={revision.createdAt}>
														{formatDate(revision.createdAt)}
													</time>
												</div>
												<p class="version-text">{revision.text}</p>
												{#if item.deletedAt === null}
													<form method="POST" action={action('revert')} use:enhance>
														<input type="hidden" name="id" value={item.id} />
														<input type="hidden" name="seq" value={revision.seq} />
														<button class="restore-version" type="submit">
															{t('list.restore')}
														</button>
													</form>
												{/if}
											</li>
										{/each}
									</ol>
								</details>
							{/if}
						</div>

						{#if item.deletedAt === null}
							<form method="POST" action={action('delete')} use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button class="delete center" type="submit" aria-label={t('list.delete')}>
									<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
										<polyline points="3 6 5 6 21 6" />
										<path
											d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
										/>
										<line x1="10" y1="11" x2="10" y2="17" />
										<line x1="14" y1="11" x2="14" y2="17" />
									</svg>
								</button>
							</form>
						{:else}
							<form method="POST" action={action('restore')} use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button class="restore" type="submit">{t('list.restore')}</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if pages > 1}
			<nav class="pagination" aria-label={t('contents.heading')}>
				{#if page > 1}
					<a class="step" href={href(page - 1)}>{t('list.previous')}</a>
				{:else}
					<span class="step disabled">{t('list.previous')}</span>
				{/if}
				<span class="position">{page} / {pages}</span>
				{#if page < pages}
					<a class="step" href={href(page + 1)}>{t('list.next')}</a>
				{:else}
					<span class="step disabled">{t('list.next')}</span>
				{/if}
			</nav>
		{/if}
	</div>
</Page>

<style>
	h1 {
		font-size: 1.25rem;
	}

	.head {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-3);
	}

	@media (min-width: 48rem) {
		.head {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
		}
	}

	.title {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}

	.search {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--space-1);
		max-inline-size: 20rem;
		padding-inline-start: var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.search:focus-within {
		border-color: var(--accent);
	}

	.search input {
		flex: 1;
		min-inline-size: 0;
		padding: var(--space-2) 0;
		border: none;
		outline: none;
		background: none;
		color: var(--ink);
	}

	.find {
		flex: none;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius);
		color: var(--muted);
	}

	.find:hover {
		background: var(--fill);
		color: var(--ink);
	}

	.item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-2);
		border-block-end: 1px solid var(--line);
	}

	.items > :first-child {
		border-block-start: 1px solid var(--line);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-inline-size: 0;
	}

	.text {
		color: var(--ink);
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.item.deleted .text {
		color: var(--muted);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		color: var(--muted);
		font-size: 0.75rem;
	}

	.history {
		margin-block-start: var(--space-1);
	}

	.history summary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.history summary::-webkit-details-marker {
		display: none;
	}

	.history summary:hover {
		text-decoration: underline;
	}

	.history summary svg {
		transition: transform 150ms ease;
	}

	.history[open] summary svg {
		transform: rotate(90deg);
	}

	.count {
		padding: 0 var(--space-2);
		border-radius: var(--radius-full);
		background: var(--fill);
		color: var(--ink-soft);
		font-size: 0.75rem;
	}

	.versions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-block-start: var(--space-3);
		padding-inline-start: var(--space-3);
		border-inline-start: 2px solid var(--line);
	}

	.version {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.version-head {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		color: var(--muted);
		font-size: 0.75rem;
	}

	.version-text {
		color: var(--ink-soft);
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	.restore-version {
		align-self: flex-start;
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.restore-version:hover {
		text-decoration: underline;
	}

	.delete {
		inline-size: 2rem;
		block-size: 2rem;
		border-radius: var(--radius);
		color: var(--muted);
	}

	.delete:hover {
		background: var(--fill);
		color: var(--danger);
	}

	.restore {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.restore:hover {
		background: var(--fill);
	}

	.empty {
		color: var(--muted);
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--muted);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.toggle:hover {
		color: var(--ink);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	.step {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius);
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}

	.step:hover:not(.disabled) {
		background: var(--fill);
	}

	.step.disabled {
		color: var(--muted);
		opacity: 0.5;
	}

	.position {
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
