<script lang="ts">
	import { goto } from "$app/navigation";
	import { t } from "$lib/i18n.svelte";
	import Page from "./Page.svelte";

	interface Item {
		id: string;
		text: string;
	}

	let {
		heading,
		searchPlaceholder,
		empty,
		noResults,
		items,
		query,
		page,
		pages
	}: {
		heading: string;
		searchPlaceholder: string;
		empty: string;
		noResults: string;
		items: Item[];
		query: string;
		page: number;
		pages: number;
	} = $props();

	// Snapshot the initial query so later prop updates can't clobber in-flight typing.
	// svelte-ignore state_referenced_locally
	let term = $state(query);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Search is driven by the URL: navigating re-runs the page's load function.
	function navigate(): void {
		const params = new URLSearchParams();
		if (term) params.set("q", term);
		const search = params.toString();
		goto(search ? `?${search}` : "?", { replaceState: true, noScroll: true, keepFocus: true });
	}

	function schedule(): void {
		clearTimeout(timer);
		timer = setTimeout(navigate, 250);
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		clearTimeout(timer);
		navigate();
	}

	// A link back to the same search on another page; page one keeps the bare URL.
	function href(target: number): string {
		const params = new URLSearchParams();
		if (query) params.set("q", query);
		if (target > 1) params.set("page", String(target));
		const search = params.toString();
		return search ? `?${search}` : "?";
	}
</script>

<Page width="var(--content-max)">
	<div class="list stack">
		<header class="head">
			<h1>{heading}</h1>
			<form class="search" method="GET" onsubmit={submit}>
				<input
					type="search"
					name="q"
					bind:value={term}
					oninput={schedule}
					placeholder={searchPlaceholder}
					aria-label={searchPlaceholder}
				/>
				<button class="find center" type="submit" aria-label={t("list.search")}>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<circle cx="11" cy="11" r="7" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
				</button>
			</form>
		</header>

		{#if items.length === 0}
			<p class="empty">{query ? noResults : empty}</p>
		{:else}
			<ul class="items">
				{#each items as item (item.id)}
					<li class="item">
						<span class="text">{item.text}</span>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={item.id} />
							<button class="delete center" type="submit" aria-label={t("list.delete")}>
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
					</li>
				{/each}
			</ul>
		{/if}

		{#if pages > 1}
			<nav class="pagination" aria-label={heading}>
				{#if page > 1}
					<a class="step" href={href(page - 1)}>{t("list.previous")}</a>
				{:else}
					<span class="step disabled">{t("list.previous")}</span>
				{/if}
				<span class="position">{page} / {pages}</span>
				{#if page < pages}
					<a class="step" href={href(page + 1)}>{t("list.next")}</a>
				{:else}
					<span class="step disabled">{t("list.next")}</span>
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
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
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
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-2);
		border-block-end: 1px solid var(--line);
	}

	.items > :first-child {
		border-block-start: 1px solid var(--line);
	}

	.text {
		flex: 1;
		min-inline-size: 0;
		color: var(--ink-soft);
		overflow-wrap: anywhere;
	}

	.delete {
		flex: none;
		inline-size: 2rem;
		block-size: 2rem;
		border-radius: var(--radius);
		color: var(--muted);
	}

	.delete:hover {
		background: var(--fill);
		color: var(--danger);
	}

	.empty {
		color: var(--muted);
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
