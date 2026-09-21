<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import AppShell from "$lib/components/AppShell.svelte";
	import Card from "$lib/components/Card.svelte";
	import LocaleSelect from "$lib/components/LocaleSelect.svelte";
	import Page from "$lib/components/Page.svelte";
	import { t } from "$lib/i18n";

	const memexOptions = $derived(
		page.data.memexes.map((memex) => ({ value: memex.id, label: memex.title }))
	);
</script>

<AppShell home="/" value="" options={memexOptions} onchange={(id) => goto(`/${id}`)}>
	<Page>
		<Card>
			<h2>{t("settings.appHeading")}</h2>
			<LocaleSelect />
		</Card>
	</Page>
</AppShell>

<style>
	h2 {
		font-size: 1rem;
	}
</style>
