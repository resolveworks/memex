<script lang="ts">
	import { page } from "$app/state";
	import { t } from "$lib/i18n.svelte";
</script>

<div class="error">
	<p class="status">{page.status}</p>
	<p class="message">{t("error.notFound")}</p>
	<a href="/">{t("error.newMemex")}</a>
</div>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		max-width: 22rem;
		margin: 3rem auto;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface);
		text-align: center;
	}

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
