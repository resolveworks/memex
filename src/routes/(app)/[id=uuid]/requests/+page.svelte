<script lang="ts">
	import ListPage from "$lib/components/ListPage.svelte";
	import { t } from "$lib/i18n.svelte";

	let { data } = $props();
</script>

<ListPage
	heading={t("requests.heading")}
	searchPlaceholder={t("requests.search")}
	empty={t("requests.empty")}
	noResults={t("requests.noResults")}
	items={data.requests}
	query={data.query}
	page={data.page}
	pages={data.pages}
/>
