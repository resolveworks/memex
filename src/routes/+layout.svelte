<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = page.data.locale;
	});
</script>

<svelte:head>
	<meta name="description" content="Don't forget" />
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#e6f4f2" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Memex" />
	<meta property="og:url" content="https://usememex.eu/" />
	<meta property="og:title" content="Memex" />
	<meta property="og:description" content="Don't forget" />
	<meta property="og:image" content="https://usememex.eu/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Memex" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Memex" />
	<meta name="twitter:description" content="Don't forget" />
	<meta name="twitter:image" content="https://usememex.eu/og.png" />
</svelte:head>

{@render children()}
