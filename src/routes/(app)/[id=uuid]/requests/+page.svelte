<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import Page from "$lib/components/Page.svelte";
	import { t } from "$lib/i18n.svelte";

	let { data } = $props();
</script>

<Page>
	<Card>
		<h1>{t("requests.heading")}</h1>
		{#if data.requests.length === 0}
			<p class="empty">{t("requests.empty")}</p>
		{:else}
			<ul class="items">
				{#each data.requests as request (request.id)}
					<li>{request.text}</li>
				{/each}
			</ul>
		{/if}
	</Card>
</Page>

<style>
	.items {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.items li {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius);
		background: var(--fill);
		color: var(--ink-soft);
	}

	.empty {
		color: var(--muted);
	}
</style>
