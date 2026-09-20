<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, t } from "$lib/i18n.svelte";
</script>

<Card>
	<h1>{t("create.heading")}</h1>
	<form method="POST" use:enhance>
		<Field label={t("create.title")}>
			<Input name="title" required />
		</Field>
		<Field label={t("nav.language")}>
			<Select name="language" value={i18n.locale}>
				{#each languages as code (code)}
					<option value={code}>{languageName(code)}</option>
				{/each}
			</Select>
		</Field>
		<Button type="submit">{t("create.submit")}</Button>
	</form>
</Card>

<style>
	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
