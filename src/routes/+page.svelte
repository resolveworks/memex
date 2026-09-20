<script lang="ts">
	import { enhance } from "$app/forms";
	import { i18n, languages, languageName, t } from "$lib/i18n.svelte";
</script>

<form class="create" method="POST" use:enhance>
	<h1>{t("create.heading")}</h1>
	<label>
		{t("create.title")}
		<input name="title" required />
	</label>
	<label>
		{t("nav.language")}
		<select name="language" value={i18n.locale}>
			{#each languages as code (code)}
				<option value={code}>{languageName(code)}</option>
			{/each}
		</select>
	</label>
	<button type="submit">{t("create.submit")}</button>
</form>

<style>
	.create {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--muted);
		font-size: 0.875rem;
	}

	input,
	select {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		outline: none;
		color: var(--ink);
		background: var(--surface);
	}

	input:focus,
	select:focus {
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

	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
