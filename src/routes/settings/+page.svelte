<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, setLocale, t } from "$lib/i18n.svelte";
</script>

<Card>
	<h1>{t("nav.settings")}</h1>
	<Field label={t("nav.language")}>
		<Select value={i18n.locale} onchange={(event) => setLocale(event.currentTarget.value)}>
			{#each languages as code (code)}
				<option value={code}>{languageName(code)}</option>
			{/each}
		</Select>
	</Field>
</Card>

<style>
	h1 {
		margin: 0;
		font-size: 1.25rem;
	}
</style>
