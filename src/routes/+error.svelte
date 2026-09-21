<script lang="ts">
	import { page } from "$app/state";
	import Card from "$lib/components/Card.svelte";
	import Page from "$lib/components/Page.svelte";
	import { t } from "$lib/i18n";
</script>

<Page>
	<Card>
		<div class="error stack">
			<p class="status">{page.status}</p>
			<p class="message">{t("error.notFound")}</p>
			<a href="/">{t("error.newMemex")}</a>
		</div>
	</Card>
</Page>

<style>
	.error {
		align-items: center;
		text-align: center;
	}

	.status {
		font-size: 2rem;
		font-weight: 600;
	}

	.message {
		color: var(--muted);
	}

	a {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
