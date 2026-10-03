<script lang="ts">
	import ListPage from "$lib/components/ListPage.svelte";
	import { t } from "$lib/i18n";

	let { data } = $props();
</script>

<ListPage
	heading={t("questions.heading")}
	searchPlaceholder={t("questions.search")}
	empty={t("questions.empty")}
	noResults={t("questions.noResults")}
	items={data.questions}
	query={data.query}
	page={data.page}
	pages={data.pages}
/>
