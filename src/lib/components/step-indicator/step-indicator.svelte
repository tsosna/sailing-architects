<script lang="ts">
	type Step = { id: number; label: string }

	type Props = {
		current: number
		steps: ReadonlyArray<Step>
	}

	let { current, steps }: Props = $props()

	function pad(n: number): string {
		return String(n).padStart(2, '0')
	}

	function status(stepId: number): 'done' | 'active' | 'inactive' {
		if (stepId < current) return 'done'
		if (stepId === current) return 'active'
		return 'inactive'
	}
</script>

<ol class="indicator" aria-label="Postęp rezerwacji">
	{#each steps as s, i (s.id)}
		{@const state = status(s.id)}
		<li class="indicator__item" aria-current={state === 'active' ? 'step' : undefined}>
			<div class="indicator__node indicator__node--{state}">
				{#if state === 'done'}
					<span class="visually-hidden">ukończone</span>✓
				{:else}
					{pad(s.id)}
				{/if}
			</div>
			<span class="indicator__label indicator__label--{state}">{s.label}</span>
		</li>
		{#if i < steps.length - 1}
			<div class="indicator__sep indicator__sep--{s.id < current ? 'done' : 'todo'}" aria-hidden="true"></div>
		{/if}
	{/each}
</ol>

<style>
	.indicator {
		list-style: none;
		padding: 0;
		margin: 0 0 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		flex-wrap: wrap;
	}

	.indicator__item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.indicator__node {
		width: 32px;
		height: 32px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-sans);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.5px;
		transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
	}

	.indicator__node--done {
		border-color: var(--color-brass);
		background: var(--color-brass);
		color: var(--color-navy);
	}

	.indicator__node--active {
		border-color: var(--color-brass);
		background: transparent;
		color: var(--color-brass);
	}

	.indicator__node--inactive {
		border-color: rgba(196, 146, 58, 0.25);
		background: transparent;
		color: rgba(196, 146, 58, 0.3);
	}

	.indicator__label {
		font-family: var(--font-sans);
		font-size: 9px;
		letter-spacing: 1px;
		text-transform: uppercase;
		transition: color 200ms ease;
	}

	.indicator__label--done {
		color: rgba(196, 146, 58, 0.7);
	}

	.indicator__label--active {
		color: var(--color-brass);
	}

	.indicator__label--inactive {
		color: rgba(196, 146, 58, 0.25);
	}

	.indicator__sep {
		width: 40px;
		height: 1px;
		margin-bottom: 22px;
		flex-shrink: 0;
		transition: background-color 200ms ease;
	}

	.indicator__sep--done {
		background: var(--color-brass);
	}

	.indicator__sep--todo {
		background: rgba(196, 146, 58, 0.15);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 640px) {
		.indicator__sep {
			width: 20px;
		}
	}
</style>
