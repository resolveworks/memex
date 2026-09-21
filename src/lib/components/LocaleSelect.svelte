<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import { tick } from "svelte";
	import { clear } from "$lib/chat.svelte";
	import { languages, languageName, t } from "$lib/i18n";
	import Field from "./Field.svelte";
	import Select from "./Select.svelte";

	let locale = $state(page.data.locale);
	let form = $state<HTMLFormElement>();

	const options = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);

	// The server owns the cookie, so submit through the `locale` action; the
	// hidden input only carries the new value once Svelte has flushed it.
	async function choose(next: string) {
		locale = next;
		await tick();
		form?.requestSubmit();
	}
</script>

<form
	bind:this={form}
	method="POST"
	action="?/locale"
	use:enhance={() => async ({ update }) => {
		await update();
		await clear();
	}}
>
	<Field label={t("nav.language")}>
		<Select
			name="locale"
			label={t("nav.language")}
			value={locale}
			{options}
			onchange={choose}
		/>
	</Field>
</form>
<p class="hint">{t("settings.appLanguageHint")}</p>

<style>
	.hint {
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
