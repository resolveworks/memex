<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, t } from "$lib/i18n.svelte";

	let language = $state(i18n.locale);
	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
</script>

<div class="home center">
	<Card>
		<h1>{t("create.heading")}</h1>
		<form method="POST" use:enhance>
			<Field label={t("create.title")}>
				<Input name="title" required />
			</Field>
			<Field label={t("nav.language")}>
				<Select
					name="language"
					label={t("nav.language")}
					value={language}
					options={languageOptions}
					onchange={(value) => (language = value)}
				/>
			</Field>
			<Button type="submit">{t("create.submit")}</Button>
		</form>
	</Card>
</div>

<style>
	.home {
		min-block-size: 100dvh;
	}
</style>
