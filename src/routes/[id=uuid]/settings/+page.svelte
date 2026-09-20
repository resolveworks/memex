<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import { languageName, t } from "$lib/i18n.svelte";

	let { data } = $props();
</script>

<Card gap="1.5rem">
	<h1>{t("settings.heading")}</h1>

	<form method="POST" action="?/rename">
		<Field label={t("create.title")}>
			<Input name="title" value={data.memex.title} required />
		</Field>
		<Button type="submit">{t("settings.save")}</Button>
	</form>

	<div class="language">
		<span class="label">{t("nav.language")}</span>
		<span class="value">{languageName(data.memex.language)}</span>
		<p class="hint">{t("settings.languageLocked")}</p>
	</div>
</Card>

<style>
	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.language {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.label,
	.hint {
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
	}

	.value {
		font-weight: 600;
	}
</style>
