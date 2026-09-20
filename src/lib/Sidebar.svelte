<script lang="ts">
	import { page } from "$app/state";
	import Footer from "$lib/components/Footer.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, setLocale, t } from "$lib/i18n.svelte";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();
</script>

{#if open}
	<button class="scrim" aria-label={t("sidebar.close")} onclick={onclose}></button>
{/if}

<aside class:open>
	<div class="body">
		{#if page.data.requests}
			<div class="requests">
				<span class="row section">{t("sidebar.requests")}</span>
				{#if page.data.requests.length === 0}
					<p class="row empty">{t("sidebar.noRequests")}</p>
				{:else}
					<ul>
						{#each page.data.requests as request (request.id)}
							<li class="row">{request.text}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	<Footer>
		<div class="language">
			<Select
				aria-label={t("nav.language")}
				value={i18n.locale}
				onchange={(event) => setLocale(event.currentTarget.value)}
			>
				{#each languages as code (code)}
					<option value={code}>{languageName(code)}</option>
				{/each}
			</Select>
		</div>
	</Footer>
</aside>

<style>
	.scrim {
		position: fixed;
		inset: 3rem 0 0 0;
		z-index: 1;
		padding: 0;
		border: none;
		background: rgba(0, 0, 0, 0.4);
	}

	aside {
		position: fixed;
		top: 3rem;
		bottom: 0;
		left: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		width: min(80vw, 18rem);
		border-right: 1px solid var(--line);
		background: var(--surface);
		overflow: hidden;
		visibility: hidden;
		transform: translateX(-100%);
		transition: transform 200ms ease, visibility 0s linear 200ms;
	}

	aside.open {
		visibility: visible;
		transform: translateX(0);
		transition: transform 200ms ease;
	}

	/* Shared row shape; the container owns the horizontal gutter. */
	.row {
		padding-block: var(--space-2);
		border-radius: var(--radius);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
		min-height: 0;
		padding: var(--space-3);
	}

	.language {
		flex: 1;
		min-width: 0;
	}

	.language :global(select) {
		width: 100%;
	}

	.requests {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.section {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.empty {
		margin: 0;
		color: var(--muted);
	}

	.requests ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.requests li {
		color: var(--ink-soft);
	}

	@media (min-width: 48rem) {
		.scrim {
			display: none;
		}

		aside {
			position: static;
			width: 18rem;
			flex-shrink: 0;
			visibility: visible;
			transform: none;
			transition: none;
		}
	}
</style>
