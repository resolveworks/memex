<script lang="ts">
	import ContentsList from '$lib/components/ContentsList.svelte';

	let { data } = $props();
</script>

<ContentsList items={data.items} query={data.query} page={data.page} pages={data.pages} />
