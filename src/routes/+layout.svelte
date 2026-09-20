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
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
