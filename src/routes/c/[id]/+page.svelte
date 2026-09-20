<script lang="ts">
	import { page } from "$app/state";
	import Chat from "$lib/Chat.svelte";
</script>

<Chat id={page.params.id} />
