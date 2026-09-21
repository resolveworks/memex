<script lang="ts">
	let { size = "2rem", class: className = "" }: { size?: string; class?: string } = $props();
</script>

<span class="bubble {className}" style="--bubble-size: {size}" aria-hidden="true"></span>

<style>
	.bubble {
		position: absolute;
		display: block;
		inline-size: var(--bubble-size);
		aspect-ratio: 1;
		border-radius: 50%;
		border: 2px solid #4d282f;
		background: #c8e4fa;
	}

	.bubble::after {
		content: "";
		position: absolute;
		top: 16%;
		left: 18%;
		inline-size: 32%;
		block-size: 32%;
		border-radius: 50%;
		background: #fff;
	}
</style>
