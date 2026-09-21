<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { i18n } from '$lib/i18n.svelte';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = i18n.locale;
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#e6f4f2" />
</svelte:head>

{@render children()}
