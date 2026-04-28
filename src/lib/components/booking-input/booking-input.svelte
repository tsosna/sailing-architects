<script lang="ts">
	type Option = { value: string; label: string }

	type Props = {
		label: string
		value: string
		type?: 'text' | 'email' | 'password' | 'date' | 'tel' | 'textarea'
		required?: boolean
		hint?: string
		error?: string
		options?: ReadonlyArray<Option>
		oninput?: () => void
	}

	let {
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		hint,
		error,
		options,
		oninput
	}: Props = $props()
</script>

<label class="field">
	<span class="field__label">
		{label}{required ? ' *' : ''}
	</span>
	{#if options}
		<select
			class="field__input field__input--select"
			class:field__input--error={error}
			bind:value
			{oninput}
		>
			{#each options as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	{:else if type === 'textarea'}
		<textarea
			class="field__input field__input--textarea"
			class:field__input--error={error}
			rows="3"
			bind:value
			{oninput}
		></textarea>
	{:else}
		<input
			class="field__input"
			class:field__input--error={error}
			{type}
			bind:value
			{oninput}
		/>
	{/if}
	{#if error}
		<span class="field__error" role="alert">{error}</span>
	{:else if hint}
		<span class="field__hint">{hint}</span>
	{/if}
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field__label {
		font-family: var(--font-sans);
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--color-brass-text-soft);
	}

	.field__input {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(196, 146, 58, 0.25);
		padding: 10px 14px;
		color: var(--color-warm-white);
		font-family: var(--font-sans);
		font-size: 14px;
		outline: none;
		width: 100%;
		box-sizing: border-box;
		border-radius: 0;
		appearance: none;
		transition:
			border-color 150ms ease,
			background-color 150ms ease;
	}

	.field__input:focus-visible {
		border-color: var(--color-brass);
		background: rgba(255, 255, 255, 0.06);
	}

	.field__input--select {
		cursor: pointer;
		background-image:
			linear-gradient(45deg, transparent 50%, rgba(196, 146, 58, 0.6) 50%),
			linear-gradient(135deg, rgba(196, 146, 58, 0.6) 50%, transparent 50%);
		background-position:
			calc(100% - 18px) 50%,
			calc(100% - 13px) 50%;
		background-size:
			5px 5px,
			5px 5px;
		background-repeat: no-repeat;
		padding-right: 30px;
	}

	.field__input--select option {
		background: var(--color-navy-light);
		color: var(--color-warm-white);
	}

	.field__input--textarea {
		resize: vertical;
		min-height: 70px;
		font-family: var(--font-sans);
	}

	.field__hint {
		font-family: var(--font-sans);
		font-size: 10px;
		color: rgba(245, 240, 232, 0.3);
	}

	.field__input--error {
		border-color: #ef4444;
	}

	.field__error {
		font-family: var(--font-sans);
		font-size: 11px;
		color: #ef4444;
		margin-top: 4px;
		display: block;
	}
</style>
