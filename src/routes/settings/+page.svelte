<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import LocaleSelect from '$lib/components/LocaleSelect.svelte';
	import Page from '$lib/components/Page.svelte';
	import { t } from '$lib/i18n';
</script>

<Page>
	<Card>
		<h2>{t('settings.appHeading')}</h2>
		<LocaleSelect />
	</Card>
</Page>

<style>
	h2 {
		font-size: 1rem;
	}
</style>
