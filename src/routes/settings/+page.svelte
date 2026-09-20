<script lang="ts">
	import { t } from "$lib/i18n.svelte";

	let { data } = $props();

	let tab = $state<"memories" | "requests">("memories");
</script>

<div class="settings">
	<h1>{t("settings.title")}</h1>

	<div class="tabs">
		<button class:active={tab === "memories"} onclick={() => (tab = "memories")}>{t("settings.memories")}</button>
		<button class:active={tab === "requests"} onclick={() => (tab = "requests")}>{t("settings.requests")}</button>
	</div>

	{#if tab === "memories"}
		{#if data.memories.length === 0}
			<p class="empty">{t("settings.noMemories")}</p>
		{:else}
			<ul>
				{#each data.memories as memory (memory.key)}
					<li>
						<div class="memory">
							<span class="key">{memory.key}</span>
							<span class="value">{memory.value}</span>
						</div>
						<form method="POST" action="?/delete">
							<input type="hidden" name="key" value={memory.key} />
							<button aria-label={`${t("settings.delete")} ${memory.key}`}>{t("settings.delete")}</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		{#if data.requests.length === 0}
			<p class="empty">{t("settings.noRequests")}</p>
		{:else}
			<ul>
				{#each data.requests as item (item.id)}
					<li>
						<div class="memory">
							<span class="value">{item.question}</span>
						</div>
						<form method="POST" action="?/deleteRequest">
							<input type="hidden" name="id" value={item.id} />
							<button aria-label={t("settings.deleteRequest")}>{t("settings.delete")}</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.settings {
		max-width: 40rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.tabs button {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: none;
		border-radius: 0.5rem;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.tabs button:hover {
		color: var(--ink);
	}

	.tabs button.active {
		background: var(--fill);
		color: var(--ink);
		font-weight: 600;
	}

	.empty {
		color: var(--muted);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
	}

	.memory {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.key {
		font-weight: 600;
	}

	.value {
		color: var(--ink-soft);
		overflow-wrap: anywhere;
	}

	button {
		font: inherit;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--ink);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
