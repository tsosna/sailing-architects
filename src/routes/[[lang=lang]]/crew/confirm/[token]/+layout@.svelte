<script lang="ts">
	let { children } = $props()
</script>

<div class="public-shell">
	{@render children()}
</div>

<style>
	.public-shell {
		min-height: 100vh;
		background: #07111e;
		color: #f5f0e8;
		font-family: 'DM Sans', system-ui, sans-serif;
		display: flex;
		justify-content: center;
		padding: 48px 20px;
	}
</style>
