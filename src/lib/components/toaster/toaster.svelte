<script lang="ts">
	import { fly } from 'svelte/transition'
	import { flip } from 'svelte/animate'
	import { toastState } from '$lib/state/toast.svelte'
	import { Toast } from '$lib/components/toast'
</script>

<div class="toaster" aria-live="polite" aria-atomic="false">
	{#each toastState.toasts as toast (toast.id)}
		<div
			class="toaster__slot"
			in:fly={{ x: 320, duration: 200 }}
			out:fly={{ x: 320, duration: 150 }}
			animate:flip={{ duration: 200 }}
		>
			<Toast {toast} />
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}

	.toaster__slot {
		pointer-events: auto;
	}
</style>
