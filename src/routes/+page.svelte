<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	// Visiting the root mints a fresh memex, then replaces itself with its URL so
	// the browser's back button does not mint another one.
	async function create() {
		const response = await fetch("/api/memexes", { method: "POST" });
		if (!response.ok) throw new Error(`Failed to create a memex (${response.status}).`);
		const { id } = (await response.json()) as { id: string };
		await goto(`/m/${id}`, { replaceState: true });
	}

	onMount(() => {
		void create();
	});
</script>
