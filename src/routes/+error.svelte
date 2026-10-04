<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Card from '#lib/components/Card.svelte';
	import Page from '#lib/components/Page.svelte';
	import { t } from '#lib/i18n.js';
</script>

<Page>
	<Card>
		<div class="error stack">
			<p class="status">{page.status}</p>
			<p class="message">{t('error.notFound')}</p>
			<a href={resolve('/')}>{t('error.newMemex')}</a>
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
		font-weight: 600;
	}
</style>
