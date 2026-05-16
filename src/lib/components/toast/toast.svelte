<script lang="ts">
	import { type Toast, toastState } from '$lib/state/toast.svelte'

	type Props = {
		toast: Toast
	}

	const { toast }: Props = $props()
</script>

<div
	class="toast toast--{toast.status}"
	role={toast.status === 'error' ? 'alert' : 'status'}
>
	<p class="toast__message">{toast.message}</p>

	<button
		class="toast__close"
		type="button"
		aria-label="Zamknij"
		onclick={() => toastState.removeToast(toast.id)}>×</button
	>
</div>

<style>
	.toast {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-width: 280px;
		max-width: 420px;
		padding: 0.875rem 1rem;
		background: var(--color-surface-low);
		color: var(--color-on-surface);
		border: 1px solid var(--color-brass-dim);
		border-left: 3px solid var(--color-brass);
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
		font-size: 0.875rem;
		line-height: 1.45;
		pointer-events: auto;
	}

	.toast--success {
		border-left-color: #4ade80;
	}

	.toast--error {
		border-left-color: #ef4444;
	}

	.toast--warning {
		border-left-color: #fbbf24;
	}

	.toast--info {
		border-left-color: var(--color-brass);
	}

	.toast__message {
		flex: 1;
		margin: 0;
	}

	.toast__close {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--color-on-surface-muted);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		transition: color 150ms;
	}

	.toast__close:hover {
		color: var(--color-on-surface);
	}

	.toast__close:focus-visible {
		outline: 2px solid var(--color-brass);
		outline-offset: 2px;
	}
</style>