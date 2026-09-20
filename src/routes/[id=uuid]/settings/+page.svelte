<script lang="ts">
	import { languageName, t } from "$lib/i18n.svelte";

	let { data } = $props();
</script>

<div class="settings">
	<h1>{t("settings.heading")}</h1>

	<form method="POST" action="?/rename">
		<label>
			{t("create.title")}
			<input name="title" value={data.memex.title} required />
		</label>
		<button type="submit">{t("settings.save")}</button>
	</form>

	<div class="language">
		<span class="label">{t("nav.language")}</span>
		<span class="value">{languageName(data.memex.language)}</span>
		<p class="hint">{t("settings.languageLocked")}</p>
	</div>
</div>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 22rem;
		margin: 3rem auto;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface);
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--muted);
		font-size: 0.875rem;
	}

	input {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		outline: none;
		color: var(--ink);
		background: var(--surface);
	}

	input:focus {
		border-color: var(--accent);
	}

	button {
		font: inherit;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: var(--accent);
		color: var(--accent-ink);
		cursor: pointer;
	}

	button:hover {
		background: var(--accent-hover);
	}

	.language {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		color: var(--muted);
		font-size: 0.875rem;
	}

	.value {
		font-weight: 600;
	}

	.hint {
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
