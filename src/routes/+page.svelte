<script lang="ts">
	import { enhance } from "$app/forms";
	import mascot from "$lib/assets/mascot1.png";
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Page from "$lib/components/Page.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, t } from "$lib/i18n.svelte";

	let language = $state(i18n.locale);
	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
</script>

<Page width="max-content">
	<div class="hero">
		<img class="mascot" src={mascot} alt="" />
		<Card>
			<h1>{t("create.heading")}</h1>
			<form class="stack" method="POST" use:enhance>
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
</Page>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, var(--panel-max));
		align-items: center;
		gap: var(--space-8);
	}

	.mascot {
		justify-self: center;
		inline-size: clamp(8rem, 24vw, 12rem);
	}

	@media (min-width: 48rem) {
		.hero {
			grid-template-columns: auto minmax(0, var(--panel-max));
		}
	}
</style>
