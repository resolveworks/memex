<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import mascot from "$lib/assets/mascot1.png";
	import ChatMessage from "$lib/ChatMessage.svelte";
	import AppShell from "$lib/components/AppShell.svelte";
	import Bubble from "$lib/components/Bubble.svelte";
	import Button from "$lib/components/Button.svelte";
	import Card from "$lib/components/Card.svelte";
	import Field from "$lib/components/Field.svelte";
	import Input from "$lib/components/Input.svelte";
	import Select from "$lib/components/Select.svelte";
	import { languages, languageName, t } from "$lib/i18n";

	let language = $state(page.data.locale);
	const languageOptions = $derived(
		languages.map((code) => ({ value: code, label: languageName(code) }))
	);
	const memexOptions = $derived(
		page.data.memexes.map((memex) => ({ value: memex.id, label: memex.title }))
	);

	const steps = $derived([
		{ title: t("landing.how.remember.title"), body: t("landing.how.remember.body") },
		{ title: t("landing.how.ask.title"), body: t("landing.how.ask.body") },
		{ title: t("landing.how.share.title"), body: t("landing.how.share.body") }
	]);

	const examples = $derived([
		{
			title: t("landing.example.family.title"),
			body: t("landing.example.family.body"),
			question: t("landing.example.family.question")
		},
		{
			title: t("landing.example.world.title"),
			body: t("landing.example.world.body"),
			question: t("landing.example.world.question")
		},
		{
			title: t("landing.example.place.title"),
			body: t("landing.example.place.body"),
			question: t("landing.example.place.question")
		},
		{
			title: t("landing.example.project.title"),
			body: t("landing.example.project.body"),
			question: t("landing.example.project.question")
		}
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
			<div class="mascot-wrap">
				<img class="mascot" src={mascot} alt="" />
				<Bubble class="bubble-pop big" size="0.173em" />
				<Bubble class="bubble-pop small" size="0.096em" />
			</div>
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
							<div class="step-head">
								<span class="number" aria-hidden="true">{i + 1}</span>
								<h3>{step.title}</h3>
							</div>
							<p>{step.body}</p>
						</li>
					{/each}
				</ol>
			</section>

			<section class="stack">
				<h2>{t("landing.examples.heading")}</h2>
				<ul class="examples">
					{#each examples as example}
						<li class="example stack">
							<h3>{example.title}</h3>
							<p>{example.body}</p>
							<ChatMessage kind="user" text={example.question} />
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</div>
</AppShell>

<style>
	.landing {
		--landing-max: 64rem;

		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-14);
		padding: var(--space-12) var(--space-6) var(--space-14);
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
		justify-content: center;
		align-items: center;
		gap: var(--space-8);
		inline-size: 100%;
		max-inline-size: var(--landing-max);
		padding-block: var(--space-8);
	}

	.hero :global(.card) {
		box-shadow: var(--shadow);
	}

	.hero h1 {
		font-size: 1.375rem;
		letter-spacing: -0.01em;
	}

	.mascot-wrap {
		/* One font-size drives the whole mascot + bubble cluster. */
		font-size: clamp(10rem, 24vw, 13rem);
		position: relative;
		justify-self: center;
	}

	.mascot {
		display: block;
		inline-size: 1em;
		filter: drop-shadow(0 8px 16px rgb(46 38 35 / 0.12));
	}

	.mascot-wrap :global(.bubble-pop.big) {
		top: -0.058em;
		right: 0.019em;
	}

	.mascot-wrap :global(.bubble-pop.small) {
		top: -0.173em;
		right: 0.212em;
	}

	.explain {
		inline-size: 100%;
		max-inline-size: var(--landing-max);
		gap: var(--space-14);
	}

	.explain > section {
		gap: var(--space-6);
	}

	.explain h2 {
		font-size: 1.5rem;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.explain p {
		max-inline-size: 65ch;
		color: var(--ink-soft);
		line-height: 1.6;
	}

	.steps {
		display: grid;
		gap: var(--space-6);
	}

	.step {
		gap: var(--space-3);
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.number {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: 2rem;
		block-size: 2rem;
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
		line-height: 1.55;
	}

	.examples {
		display: grid;
		gap: var(--space-8);
	}

	.example {
		gap: var(--space-4);
	}

	.example h3 {
		font-size: 1rem;
	}

	.example p {
		color: var(--muted);
		font-size: 0.9375rem;
		line-height: 1.55;
	}

	@media (min-width: 48rem) {
		.hero {
			grid-template-columns: auto minmax(0, var(--panel-max));
			gap: var(--space-12);
		}

		.steps {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.examples {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
