<script lang="ts">
	import { goto } from "$app/navigation";
	import AppShell from "$lib/components/AppShell.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Page from "$lib/components/Page.svelte";
	import Select from "$lib/components/Select.svelte";
	import { clear } from "$lib/chat.svelte";
	import { i18n, languages, languageName, setLocale, t } from "$lib/i18n.svelte";
	import { getMemexes } from "$lib/memexes.svelte";

	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
	const memexOptions = $derived(
		getMemexes().map((memex) => ({ value: memex.id, label: memex.title }))
	);

	// The greeting is generated in the app language, so a switch invalidates the
	// conversation; the next one greets in the newly chosen language.
	function chooseLanguage(code: string) {
		setLocale(code);
		void clear();
	}
</script>

<AppShell home="/" value="" options={memexOptions} onchange={(id) => goto(`/${id}`)}>
	<Page>
		<Card>
			<h2>{t("settings.appHeading")}</h2>

			<Field label={t("nav.language")}>
				<Select
					label={t("nav.language")}
					value={i18n.locale}
					options={languageOptions}
					onchange={chooseLanguage}
				/>
			</Field>
			<p class="hint">{t("settings.appLanguageHint")}</p>
		</Card>
	</Page>
</AppShell>

<style>
	h2 {
		font-size: 1rem;
	}

	.hint {
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
