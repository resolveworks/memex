<script lang="ts">
	import { page } from "$app/state";
	import Footer from "$lib/components/Footer.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, setLocale, t } from "$lib/i18n.svelte";

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
</script>

{#if open}
	<button class="scrim" aria-label={t("sidebar.close")} onclick={onclose}></button>
{/if}

<aside class:open>
	<div class="body stack">
		{#if page.data.requests}
			<div class="requests stack">
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
		<div class="language stack">
			<Select
				label={t("nav.language")}
				value={i18n.locale}
				options={languageOptions}
				onchange={setLocale}
			/>
		</div>
	</Footer>
</aside>

<style>
	.scrim {
		position: fixed;
		inset: var(--chrome-h) 0 0 0;
		z-index: 1;
		background: rgba(0, 0, 0, 0.4);
	}

	aside {
		position: fixed;
		top: var(--chrome-h);
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
		gap: var(--space-2);
		flex: 1;
		min-height: 0;
		padding: var(--space-3);
	}

	.language {
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.requests {
		gap: 0;
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
		color: var(--muted);
	}

	.requests li {
		color: var(--ink-soft);
	}

	@media (min-width: 48rem) {
		.scrim {
			display: none;
		}

		aside {
			position: sticky;
			top: var(--chrome-h);
			align-self: start;
			block-size: calc(100dvh - var(--chrome-h));
			width: 18rem;
			flex-shrink: 0;
			visibility: visible;
			transform: none;
			transition: none;
		}
	}
</style>
