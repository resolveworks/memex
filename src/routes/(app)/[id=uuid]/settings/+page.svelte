<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Page from "$lib/components/Page.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, setLocale, t } from "$lib/i18n.svelte";

	let { data } = $props();

	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
</script>

<Page>
	<div class="stack">
		<Card>
			<h2>{t("settings.memexHeading")}</h2>

			<form class="stack" method="POST" action="?/rename">
				<Field label={t("create.title")}>
					<Input name="title" value={data.memex.title} required />
				</Field>
				<Button type="submit">{t("settings.save")}</Button>
			</form>

			<div class="language stack">
				<span class="label">{t("nav.language")}</span>
				<span class="value">{languageName(data.memex.language)}</span>
				<p class="hint">{t("settings.languageLocked")}</p>
			</div>
		</Card>

		<Card>
			<h2>{t("settings.appHeading")}</h2>

			<Field label={t("nav.language")}>
				<Select
					label={t("nav.language")}
					value={i18n.locale}
					options={languageOptions}
					onchange={setLocale}
				/>
			</Field>
			<p class="hint">{t("settings.appLanguageHint")}</p>
		</Card>
	</div>
</Page>

<style>
	h2 {
		font-size: 1rem;
	}

	.language {
		gap: var(--space-1);
	}

	.label,
	.hint {
		color: var(--muted);
		font-size: 0.875rem;
	}

	.value {
		font-weight: 600;
	}
</style>
