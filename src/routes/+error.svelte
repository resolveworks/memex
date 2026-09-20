<script lang="ts">
	import { page } from "$app/state";
	import Card from "$lib/components/Card.svelte";
	import { t } from "$lib/i18n.svelte";
</script>

<Card center>
	<p class="status">{page.status}</p>
	<p class="message">{t("error.notFound")}</p>
	<a href="/">{t("error.newMemex")}</a>
</Card>

<style>
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
