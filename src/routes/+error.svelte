<script lang="ts">
	import { page } from "$app/state";
	import Card from "$lib/components/Card.svelte";
	import { t } from "$lib/i18n.svelte";
</script>

<Card center gap="0.5rem">
	<p class="status">{page.status}</p>
	<p class="message">{t("error.notFound")}</p>
	<a href="/">{t("error.newMemex")}</a>
</Card>

<style>
	.status {
		margin: 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.message {
		margin: 0;
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
