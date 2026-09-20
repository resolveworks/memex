<script lang="ts">
	import Chat from "$lib/Chat.svelte";

	let { data } = $props();
</script>

<Chat id={data.memex.id} language={data.memex.language} />
