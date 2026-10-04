<script lang="ts">
	import ContentsList from '$lib/components/ContentsList.svelte';

	let { data } = $props();
</script>

<ContentsList
	items={data.items}
	query={data.query}
	includeDeleted={data.includeDeleted}
	page={data.page}
	pages={data.pages}
/>
