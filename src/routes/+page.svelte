<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import mascot from "$lib/assets/mascot1.png";
	import AppShell from "$lib/components/AppShell.svelte";
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Select from "$lib/components/Select.svelte";
	import { i18n, languages, languageName, t } from "$lib/i18n.svelte";
	import { getMemexes } from "$lib/memexes.svelte";

	let language = $state(i18n.locale);
	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
	const memexOptions = $derived(
		getMemexes().map((memex) => ({ value: memex.id, label: memex.title }))
	);

	const steps = $derived([
		{ title: t("landing.how.remember.title"), body: t("landing.how.remember.body") },
		{ title: t("landing.how.ask.title"), body: t("landing.how.ask.body") },
		{ title: t("landing.how.share.title"), body: t("landing.how.share.body") }
	]);

	const examples = $derived([
		[
			{ kind: "user", text: t("landing.example.remember.user1") },
			{ kind: "assistant", text: t("landing.example.remember.assistant1") },
			{ kind: "user", text: t("landing.example.remember.user2") },
			{ kind: "assistant", text: t("landing.example.remember.assistant2") }
		],
		[
			{ kind: "user", text: t("landing.example.ask.user") },
			{ kind: "assistant", text: t("landing.example.ask.assistant") }
		]
	]);
</script>

<AppShell
	home="/"
	value=""
	options={memexOptions}
	onchange={(id) => goto(`/${id}`)}
>
	{#snippet toolbar()}
		<a class="icon center" href="/settings" aria-label={t('settings.appHeading')}>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				/>
				<circle cx="12" cy="12" r="3" />
			</svg>
		</a>
	{/snippet}
	<div class="landing">
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

		<div class="explain stack">
			<section class="stack">
				<h2>{t("landing.what.heading")}</h2>
				<p>{t("landing.what.body")}</p>
			</section>

			<section class="stack">
				<h2>{t("landing.how.heading")}</h2>
				<ol class="steps">
					{#each steps as step, i}
						<li class="step stack">
							<span class="number" aria-hidden="true">{i + 1}</span>
							<h3>{step.title}</h3>
							<p>{step.body}</p>
						</li>
					{/each}
				</ol>
			</section>

			<section class="stack">
				<h2>{t("landing.examples.heading")}</h2>
				<div class="examples">
					{#each examples as example}
						<div class="example stack">
							{#each example as message}
								<p class="bubble {message.kind}">{message.text}</p>
							{/each}
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</AppShell>

<style>
	.landing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-14);
		padding: var(--space-8) var(--space-6) var(--space-14);
	}

	.icon {
		flex: none;
		inline-size: 2.25rem;
		block-size: 2.25rem;
		border-radius: var(--radius);
		color: var(--ink);
	}

	.icon:hover {
		background: var(--fill);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, var(--panel-max));
		align-items: center;
		gap: var(--space-8);
	}

	.mascot {
		justify-self: center;
		inline-size: clamp(10rem, 24vw, 12rem);
	}

	.explain {
		inline-size: 100%;
		max-inline-size: var(--content-max);
		gap: var(--space-12);
	}

	.explain h2 {
		font-size: 1.5rem;
	}

	.explain p {
		color: var(--ink-soft);
		line-height: 1.6;
	}

	.steps {
		display: grid;
		gap: var(--space-6);
	}

	.step {
		gap: var(--space-2);
	}

	.number {
		display: grid;
		place-items: center;
		inline-size: 1.75rem;
		block-size: 1.75rem;
		border-radius: var(--radius-full);
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.step h3 {
		font-size: 1rem;
	}

	.step p {
		color: var(--muted);
		font-size: 0.9375rem;
	}

	.examples {
		display: grid;
		gap: var(--space-4);
	}

	.example {
		gap: var(--space-2);
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.bubble {
		max-inline-size: 85%;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-lg);
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.bubble.user {
		align-self: flex-end;
		background: var(--accent);
		color: var(--accent-ink);
		border-bottom-right-radius: var(--radius-sm);
	}

	.bubble.assistant {
		align-self: flex-start;
		background: var(--fill);
		border-bottom-left-radius: var(--radius-sm);
	}

	@media (min-width: 40rem) {
		.steps {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 48rem) {
		.hero {
			grid-template-columns: auto minmax(0, var(--panel-max));
		}

		.examples {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
