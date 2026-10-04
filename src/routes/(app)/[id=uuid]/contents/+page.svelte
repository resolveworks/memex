<script lang="ts">
	import ListPage from '$lib/components/ListPage.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<ListPage
	heading={`${t('memories.heading')} & ${t('questions.heading')}`}
	searchPlaceholder={t('memories.search')}
	empty={t('memories.empty')}
	noResults={t('memories.noResults')}
	items={data.items}
	query={data.query}
	page={data.page}
	pages={data.pages}
/>
